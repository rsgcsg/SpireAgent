import {
  NORMALIZED_STATE_SCHEMA_VERSION,
  type BridgeLegalActionSnapshot,
  type CharacterSelectSurface,
  type MainMenuSurface,
  type NormalizedCurrentState,
  type SingleplayerMenuSurface,
  type StateEnvelope
} from "../domain/state/index.js";
import type { AdapterDescriptor } from "../game-io/adapter.js";
import {
  decodeConnectorV3Observation,
  type ConnectorV3Observation
} from "../integrations/sts2mcp/connectorV3Protocol.js";
import {
  expandConnectorV3Commands,
  usesDirectConnectorV3Consumer
} from "../integrations/sts2mcp/connectorV3Projection.js";
import {
  gatewayMenuSurfaceSchema,
  type GatewayMenuSurface
} from "../integrations/sts2mcp/gatewayMenuProtocol.js";
import type { Sts2McpRawState } from "../integrations/sts2mcp/rawState.js";
import { stateHash } from "../runtime/stateHash.js";
import { isJsonObject } from "../shared/json.js";
import { DiagnosticsBuilder } from "./diagnostics.js";

export function isDirectConnectorV3ConsumerState(rawState: Sts2McpRawState): boolean {
  const observation = rawState.connector_v3_observation;
  return isJsonObject(observation)
    && isJsonObject(observation.context)
    && observation.context.kind === "menu"
    && isJsonObject(observation.surface)
    && ["main_menu", "singleplayer_menu", "character_select"]
      .includes(String(observation.surface.kind));
}

export function normalizeConnectorV3CurrentState(
  rawState: Sts2McpRawState,
  source: AdapterDescriptor,
  capturedAt: string
): StateEnvelope {
  const diagnostics = new DiagnosticsBuilder();
  const rawObservation = rawState.connector_v3_observation;
  let observation: ConnectorV3Observation | undefined;
  let menuSurface: GatewayMenuSurface | undefined;

  try {
    observation = decodeConnectorV3Observation(rawObservation).data;
  } catch (error) {
    diagnostics.invalid(
      "connector_v3_observation",
      rawObservation,
      safeMessage(error)
    );
  }
  if (observation) {
    const parsed = gatewayMenuSurfaceSchema.safeParse(observation.surface);
    if (parsed.success) {
      menuSurface = parsed.data;
    } else {
      diagnostics.invalid(
        "connector_v3_observation.surface",
        observation.surface,
        parsed.error.issues.map((issue) => issue.message).join("; ")
      );
    }
  }

  const commands = observation ? expandConnectorV3Commands(observation) : [];
  if (observation && !usesDirectConnectorV3Consumer(observation)) {
    diagnostics.invalid(
      "connector_v3_observation.surface",
      observation.surface,
      "surface is not assigned to the direct Connector V3 consumer"
    );
  }
  if (observation && menuSurface && !contextMatchesSurface(observation, menuSurface)) {
    diagnostics.invalid(
      "connector_v3_observation.context",
      observation.context,
      "menu context flow does not match the current visible surface"
    );
  }
  if (observation && observation.interaction.phase !== "ready" && commands.length > 0) {
    diagnostics.invalid(
      "connector_v3_observation.interaction.command_candidates",
      observation.interaction.command_candidates,
      "non-ready interaction must not publish executable commands"
    );
  }

  const builtDiagnostics = diagnostics.build();
  const legalActions = observation && builtDiagnostics.status !== "invalid"
    ? projectCommands(observation)
    : [];
  const actionable = observation?.interaction.phase === "ready"
    && observation.interaction.execution_support !== "unsupported"
    && legalActions.length > 0
    && builtDiagnostics.status !== "invalid";
  const context: NormalizedCurrentState["context"] = menuSurface
    ? {
        kind: "menu",
        screen: menuSurface.kind,
        message: menuSurface.kind === "main_menu"
          ? "Navigate the visible root menu."
          : "Choose a standard run setup action."
      }
    : {
        kind: "unknown",
        reason: "Connector V3 menu context could not be decoded",
        observedTopLevelKeys: Object.keys(rawState).sort()
      };
  const surface: NormalizedCurrentState["surface"] = observation && menuSurface
    && builtDiagnostics.status !== "invalid"
    ? projectSurface(menuSurface, observation, legalActions)
    : {
        kind: "unsupported",
        reason: "Connector V3 direct menu contract validation failed",
        classification: "malformed_known_state",
        observedTopLevelKeys: Object.keys(rawState).sort()
      };
  const currentState: NormalizedCurrentState = {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType: observation
      ? `connector_v3:${observation.context.kind}:${observation.surface.kind}:direct`
      : "connector_v3:invalid:direct",
    stability: builtDiagnostics.status === "invalid"
      ? "invalid"
      : actionable
        ? "actionable"
        : observation?.interaction.phase === "settling"
          ? "settling"
          : "non_actionable",
    actionAuthority: actionable ? "bridge_advertised" : "none",
    bridgeLegacyWarnings: observation
      ? [
          ...observation.warnings,
          "Connector V3 menu facts and commands were consumed directly without a V2 state projection."
        ]
      : [],
    context,
    surface
  };

  return {
    envelopeSchemaVersion: 2,
    capturedAt,
    source,
    rawState,
    currentState,
    diagnostics: builtDiagnostics,
    stateHash: stateHash({
      stateToken: observation?.state_token ?? null,
      interactionId: observation?.interaction.id ?? null,
      commands: legalActions.map((action) => ({
        actionId: action.actionId,
        kind: action.kind,
        entityBindings: action.entityBindings
      }))
    }),
    normalizedStateHash: stateHash(currentState)
  };
}

function contextMatchesSurface(
  observation: ConnectorV3Observation,
  surface: GatewayMenuSurface
): boolean {
  if (observation.context.kind !== "menu") return false;
  const flow = isJsonObject(observation.context)
    ? observation.context.flow
    : undefined;
  return surface.kind === "main_menu"
    ? flow === "root_navigation"
    : flow === "standard_run_setup";
}

function projectCommands(
  observation: ConnectorV3Observation
): BridgeLegalActionSnapshot[] {
  return expandConnectorV3Commands(observation).map((command) => ({
    actionId: command.choiceId,
    stateId: command.expectedStateToken,
    kind: command.operation,
    label: command.label,
    authority: command.authorityState,
    evidenceCode: command.bindingKind,
    entityBindings: command.entityBindings,
    category: "connector_v3"
  }));
}

function projectSurface(
  surface: GatewayMenuSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): MainMenuSurface | SingleplayerMenuSurface | CharacterSelectSurface {
  const completeness = {
    playerVisibleSemantics: observation.completeness.player_visible_semantics,
    legalActions: observation.completeness.legal_actions,
    sources: [...observation.completeness.sources],
    missing: [...observation.completeness.missing]
  };
  if (surface.kind === "main_menu") {
    return {
      kind: "main_menu",
      stage: surface.stage,
      bridgeStateId: observation.state_token,
      screenEntityId: surface.screen_entity_id,
      choices: projectMenuChoices(surface.options),
      ...(surface.continue_run ? {
        continueRun: {
          characterId: surface.continue_run.character_id,
          ...(surface.continue_run.character_name
            ? { characterName: surface.continue_run.character_name }
            : {}),
          actId: surface.continue_run.act_id,
          ...(surface.continue_run.act_name ? { actName: surface.continue_run.act_name } : {}),
          floor: surface.continue_run.floor,
          hp: surface.continue_run.hp,
          maxHp: surface.continue_run.max_hp,
          gold: surface.continue_run.gold,
          ascension: surface.continue_run.ascension
        }
      } : {}),
      legalActions,
      completeness
    };
  }
  if (surface.kind === "singleplayer_menu") {
    return {
      kind: "singleplayer_menu",
      stage: surface.stage,
      bridgeStateId: observation.state_token,
      screenEntityId: surface.screen_entity_id,
      choices: projectMenuChoices(surface.options),
      legalActions,
      completeness
    };
  }
  return {
    kind: "character_select",
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    characters: surface.characters.map((character) => ({
      entityId: character.entity_id,
      index: character.index,
      characterId: character.character_id,
      name: character.name,
      locked: character.is_locked,
      selected: character.is_selected,
      random: character.is_random
    })),
    ...(surface.selected_details ? {
      selectedDetails: {
        characterId: surface.selected_details.character_id,
        title: surface.selected_details.title,
        ...(surface.selected_details.description
          ? { description: surface.selected_details.description }
          : {}),
        ...(surface.selected_details.starting_hp != null
          ? { startingHp: surface.selected_details.starting_hp }
          : {}),
        ...(surface.selected_details.starting_gold != null
          ? { startingGold: surface.selected_details.starting_gold }
          : {}),
        ...(surface.selected_details.starting_relic ? {
          startingRelic: {
            id: surface.selected_details.starting_relic.definition_id,
            ...(surface.selected_details.starting_relic.name
              ? { name: surface.selected_details.starting_relic.name }
              : {}),
            ...(surface.selected_details.starting_relic.description
              ? { description: surface.selected_details.starting_relic.description }
              : {})
          }
        } : {})
      }
    } : {}),
    ...(surface.ascension != null ? { ascension: surface.ascension } : {}),
    ...(surface.ascension_title ? { ascensionTitle: surface.ascension_title } : {}),
    ...(surface.ascension_description
      ? { ascensionDescription: surface.ascension_description }
      : {}),
    canDecreaseAscension: surface.can_decrease_ascension,
    canIncreaseAscension: surface.can_increase_ascension,
    canEmbark: surface.can_embark,
    canGoBack: surface.can_go_back,
    legalActions,
    completeness
  };
}

function projectMenuChoices(
  choices: Extract<GatewayMenuSurface, { kind: "main_menu" | "singleplayer_menu" }>["options"]
): MainMenuSurface["choices"] {
  return choices.map((choice) => ({
    entityId: choice.entity_id,
    semanticId: choice.semantic_id,
    label: choice.label,
    ...(choice.description ? { description: choice.description } : {}),
    enabled: choice.enabled,
    bridgeSupport: choice.bridge_support,
    ...(choice.blocked_reason ? { blockedReason: choice.blocked_reason } : {})
  }));
}

function safeMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
}
