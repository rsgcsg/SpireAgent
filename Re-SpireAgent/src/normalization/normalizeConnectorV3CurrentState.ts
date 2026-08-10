import {
  NORMALIZED_STATE_SCHEMA_VERSION,
  type BridgeLegalActionSnapshot,
  type BridgeRewardClaimSurface,
  type CardBundleSelectionSurface,
  type CardRewardSelectionSurface,
  type CharacterSelectSurface,
  type CombatPileCardSelectionSurface,
  type CombatHandCardSelectionSurface,
  type CombatTurnSurface,
  type DeckEnchantSelectionSurface,
  type DeckUpgradeSelectionSurface,
  type DeckRemovalSelectionSurface,
  type DeckTransformSelectionSurface,
  type EventDeckRemovalSelectionSurface,
  type EventDialogueSurface,
  type EventOptionSurface,
  type GameOverSurface,
  type GeneratedCardChoiceSurface,
  type MainMenuSurface,
  type MapNavigationSurface,
  type NormalizedCurrentState,
  type RestSiteSurface,
  type RelicDeckRemovalSelectionSurface,
  type RewardDeckRemovalSelectionSurface,
  type SemanticContext,
  type ShopInventorySurface,
  type ShopRoomSurface,
  type SingleplayerMenuSurface,
  type StateEnvelope,
  type TreasureRoomSurface,
  type WoodCarvingsReplacementSelectionSurface
} from "../domain/state/index.js";
import type { AdapterDescriptor } from "../game-io/adapter.js";
import {
  gatewayCardBundleSurfaceSchema,
  type GatewayCardBundleSurface
} from "../integrations/sts2mcp/gatewayCardBundleProtocol.js";
import {
  gatewayCombatHandSurfaceSchema,
  type GatewayCombatHandSurface
} from "../integrations/sts2mcp/gatewayCombatHandProtocol.js";
import {
  gatewayCombatPileSurfaceSchema,
  type GatewayCombatPileSurface
} from "../integrations/sts2mcp/gatewayCombatPileProtocol.js";
import {
  gatewayCombatContextSchema,
  gatewayCombatTurnSurfaceSchema,
  type GatewayCombatContext,
  type GatewayCombatTurnSurface
} from "../integrations/sts2mcp/gatewayCombatProtocol.js";
import {
  gatewayEventDeckRemovalSurfaceSchema,
  gatewayMerchantRemovalSurfaceSchema,
  gatewayRelicRemovalSurfaceSchema,
  gatewayRewardRemovalSurfaceSchema,
  type GatewayDeckRemovalSurface,
  type GatewayEventDeckRemovalSurface
} from "../integrations/sts2mcp/gatewayDeckRemovalProtocol.js";
import {
  gatewayDeckUpgradeSurfaceSchema,
  type GatewayDeckUpgradeSurface
} from "../integrations/sts2mcp/gatewayDeckUpgradeProtocol.js";
import {
  gatewayDeckTransformSurfaceSchema,
  gatewayWoodCarvingsSurfaceSchema,
  type GatewayDeckTransformSurface,
  type GatewayWoodCarvingsSurface
} from "../integrations/sts2mcp/gatewayTransformProtocol.js";
import {
  gatewayDeckEnchantSurfaceSchema,
  type GatewayDeckEnchantSurface
} from "../integrations/sts2mcp/gatewayDeckEnchantProtocol.js";
import {
  gatewayEventDialogueSurfaceSchema,
  type GatewayEventDialogueSurface
} from "../integrations/sts2mcp/gatewayEventDialogueProtocol.js";
import {
  gatewayGeneratedChoiceSurfaceSchema,
  type GatewayGeneratedChoiceSurface
} from "../integrations/sts2mcp/gatewayGeneratedChoiceProtocol.js";
import {
  gatewayEventContextSchema,
  gatewayEventOptionSurfaceSchema,
  gatewayGameOverContextSchema,
  gatewayGameOverSurfaceSchema,
  gatewayMapContextSchema,
  gatewayMapNavigationSurfaceSchema,
  type GatewayEventContext,
  type GatewayGameOverContext,
  type GatewayJourneySurface,
  type GatewayMapContext
} from "../integrations/sts2mcp/gatewayJourneyProtocol.js";
import {
  gatewayMenuContextSchema,
  gatewayMenuSurfaceSchema,
  type GatewayMenuContext,
  type GatewayMenuSurface
} from "../integrations/sts2mcp/gatewayMenuProtocol.js";
import {
  gatewayCardRewardSelectionSurfaceSchema,
  gatewayRewardClaimSurfaceSchema,
  gatewayRewardFlowContextSchema,
  type GatewayRewardFlowContext,
  type GatewayRewardSurface
} from "../integrations/sts2mcp/gatewayRewardProtocol.js";
import {
  gatewayRestSiteSurfaceSchema,
  gatewayRunRoomContextSchema,
  gatewayShopInventorySurfaceSchema,
  gatewayShopRoomSurfaceSchema,
  gatewayTreasureRoomSurfaceSchema,
  type GatewayRunRoomContext,
  type GatewayRunRoomSurface
} from "../integrations/sts2mcp/gatewayRunRoomProtocol.js";
import {
  decodeConnectorV3Observation,
  type ConnectorV3Observation
} from "../integrations/sts2mcp/connectorV3Protocol.js";
import {
  expandConnectorV3Commands,
  type ConnectorV3ConsumerCommand
} from "../integrations/sts2mcp/connectorV3Projection.js";
import {
  sharedVisibleStateSchema,
  type GatewaySharedVisibleState
} from "../integrations/sts2mcp/gatewayVisibleStateProtocol.js";
import type { Sts2McpRawState } from "../integrations/sts2mcp/rawState.js";
import { stateHash } from "../runtime/stateHash.js";
import { DiagnosticsBuilder } from "./diagnostics.js";
import {
  projectGatewayVisibleCard,
  projectGatewayVisibleRelic,
  projectGatewayVisibleState
} from "./gatewayVisibleStateProjection.js";
import {
  projectGatewayCombatContext as projectCombatContext,
  projectGatewayCombatPlayer as projectCombatPlayer
} from "./gatewayCombatProjection.js";

type DirectSurface = GatewayCombatTurnSurface | GatewayCombatHandSurface
  | GatewayCombatPileSurface
  | GatewayDeckEnchantSurface | GatewayEventDialogueSurface
  | GatewayDeckUpgradeSurface | GatewayDeckRemovalSurface | GatewayEventDeckRemovalSurface
  | GatewayDeckTransformSurface | GatewayWoodCarvingsSurface
  | GatewayCardBundleSurface
  | GatewayGeneratedChoiceSurface
  | GatewayMenuSurface | GatewayJourneySurface | GatewayRewardSurface
  | GatewayRunRoomSurface;
type DirectContext = GatewayCombatContext | GatewayMenuContext | GatewayEventContext | GatewayMapContext
  | GatewayGameOverContext | GatewayRewardFlowContext | GatewayRunRoomContext;

export function isDirectConnectorV3ConsumerState(rawState: Sts2McpRawState): boolean {
  const observation = rawState.connector_v3_observation;
  try {
    decodeConnectorV3Observation(observation);
    return true;
  } catch {
    return false;
  }
}

export function normalizeConnectorV3CurrentState(
  rawState: Sts2McpRawState,
  source: AdapterDescriptor,
  capturedAt: string
): StateEnvelope {
  const diagnostics = new DiagnosticsBuilder();
  const rawObservation = rawState.connector_v3_observation;
  let observation: ConnectorV3Observation | undefined;
  let context: DirectContext | undefined;
  let surface: DirectSurface | undefined;
  let shared: GatewaySharedVisibleState | undefined;
  let commands: ConnectorV3ConsumerCommand[] = [];
  let visibleUnsupported = false;
  let settling = false;

  try {
    observation = decodeConnectorV3Observation(rawObservation).data;
  } catch (error) {
    diagnostics.invalid("connector_v3_observation", rawObservation, safeMessage(error));
  }
  if (observation) {
    settling = observation.interaction.phase === "settling";
    visibleUnsupported = observation.interaction.execution_support === "unsupported" && !settling;
    if (settling) {
      if (observation.interaction.command_candidates.length > 0) {
        diagnostics.invalid(
          "connector_v3_observation.interaction.command_candidates",
          observation.interaction.command_candidates,
          "settling interaction must not publish commands"
        );
      }
      context = parseContext(observation, diagnostics);
      surface = parseSurface(observation, diagnostics);
      if (observation.shared_state !== null) shared = parseSharedState(observation, diagnostics);
    } else if (visibleUnsupported) {
      if (observation.interaction.command_candidates.length > 0) {
        diagnostics.invalid(
          "connector_v3_observation.interaction.command_candidates",
          observation.interaction.command_candidates,
          "visible unsupported interaction must not publish commands"
        );
      }
      if (observation.shared_state !== null) {
        shared = parseSharedState(observation, diagnostics);
      }
    } else {
      context = parseContext(observation, diagnostics);
      surface = parseSurface(observation, diagnostics);
      shared = parseSharedState(observation, diagnostics);
      try {
        commands = expandConnectorV3Commands(observation);
      } catch (error) {
        diagnostics.invalid(
          "connector_v3_observation.interaction.command_candidates",
          observation.interaction.command_candidates,
          safeMessage(error)
        );
      }
    }
  }
  if (observation && context && surface) {
    if (!contextMatchesSurface(context, surface)) {
      diagnostics.invalid(
        "connector_v3_observation.context",
        observation.context,
        "semantic context does not match the current direct V3 surface"
      );
    }
    for (const error of validateSurfaceFacts(surface)) {
      diagnostics.invalid(
        "connector_v3_observation.surface",
        observation.surface,
        error
      );
    }
    if (!settling && !visibleUnsupported) {
      for (const error of validateCommands(context, surface, commands)) {
        diagnostics.invalid(
          "connector_v3_observation.interaction.command_candidates",
          observation.interaction.command_candidates,
          error
        );
      }
    }
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
    ? projectCommands(commands)
    : [];
  const actionable = observation?.interaction.phase === "ready"
    && observation.interaction.execution_support !== "unsupported"
    && legalActions.length > 0
    && builtDiagnostics.status !== "invalid";
  const projectedPersistent = shared ? projectGatewayVisibleState(shared) : undefined;
  const projectedPlayer = projectedPersistent?.player && context?.kind === "combat"
    ? projectCombatPlayer(context, projectedPersistent.player)
    : projectedPersistent?.player;
  const normalizedContext: NormalizedCurrentState["context"] = settling && observation
    ? projectSettlingContext(observation, context, surface, projectedPlayer, rawState)
    : visibleUnsupported && observation
    ? projectVisibleUnsupportedContext(observation, rawState)
    : context
    ? projectContext(context, surface, projectedPlayer)
    : invalidContext(rawState);
  const normalizedSurface: NormalizedCurrentState["surface"] = settling
    ? {
        kind: "no_action",
        reason: "settling",
        message: "Native STS2 is settling the current interaction; no command is legal now.",
        observedTopLevelKeys: Object.keys(rawState).sort()
      }
    : visibleUnsupported && observation
    ? {
        kind: "unsupported",
        reason: typeof observation.surface.reason === "string"
          ? observation.surface.reason
          : observation.interaction.support_reason
            ?? "Connector V3 exposes this visible interaction without mutation support.",
        classification: "unknown_surface",
        observedTopLevelKeys: Object.keys(rawState).sort()
      }
    : observation && surface
    && builtDiagnostics.status !== "invalid"
    ? projectSurface(surface, observation, legalActions)
    : {
        kind: "unsupported",
        reason: "Connector V3 direct semantic contract validation failed",
        classification: "malformed_known_state",
        observedTopLevelKeys: Object.keys(rawState).sort()
      };
  const currentState: NormalizedCurrentState = {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType: observation
      ? `connector_v3:${observation.context.kind}:${observation.surface.kind}:direct`
      : "connector_v3:invalid:direct",
    ...(projectedPersistent?.run ? { run: projectedPersistent.run } : {}),
    ...(projectedPlayer ? { player: projectedPlayer } : {}),
    ...(shared ? {
      bridgeSharedStateEvidence: {
        scope: shared.scope,
        playerVisibleSemantics: shared.completeness.player_visible_semantics,
        sources: [...shared.completeness.sources],
        missing: [...shared.completeness.missing]
      }
    } : {}),
    stability: builtDiagnostics.status === "invalid"
      ? "invalid"
      : settling
        ? "settling"
      : visibleUnsupported
        ? "non_actionable"
      : actionable
        ? "actionable"
        : observation?.interaction.phase === "settling"
          ? "settling"
          : "non_actionable",
    actionAuthority: actionable ? "bridge_advertised" : "none",
    bridgeLegacyWarnings: observation
      ? [
          ...observation.warnings,
          "Connector V3 facts and commands were consumed directly without a V2 state or capabilities projection."
        ]
      : [],
    ...(observation ? {
      bridgeVisibility: {
        profileId: observation.visibility.profile_id,
        coreStatus: observation.visibility.core_status,
        playerVisibleClosureStatus: observation.visibility.player_visible_closure_status,
        availableInspections: [...observation.visibility.available_inspections],
        linkedDetailKinds: [...observation.visibility.linked_detail_kinds],
        hiddenByPolicy: [...observation.visibility.hidden_by_policy],
        missing: [...observation.visibility.missing],
        unknownCriticalFieldBehavior: observation.visibility.unknown_critical_field_behavior
      },
      bridgeInspectionCatalog: observation.inspection_catalog.map((entry) => ({
        kind: entry.kind,
        scope: entry.scope,
        availability: entry.availability,
        visibilityBasis: entry.visibility_basis,
        stateBound: entry.state_bound,
        createsActionAuthority: entry.creates_action_authority,
        orderingSemantics: entry.ordering_semantics,
        estimatedCost: entry.estimated_cost,
        recommendedFor: [...entry.recommended_for],
        hiddenByPolicy: [...entry.hidden_by_policy]
      }))
    } : {}),
    context: normalizedContext,
    surface: normalizedSurface
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

function projectVisibleUnsupportedContext(
  observation: ConnectorV3Observation,
  rawState: Sts2McpRawState
): SemanticContext {
  if (observation.context.kind === "rest") return { kind: "rest" };
  if (observation.context.kind === "shop") return { kind: "shop" };
  if (observation.context.kind === "treasure") return { kind: "treasure" };
  if (observation.context.kind === "reward_flow"
      && (observation.context.reward_kind === "card_reward"
        || observation.context.reward_kind === "room_rewards")) {
    return { kind: "reward_flow", rewardKind: observation.context.reward_kind };
  }
  return {
    kind: "unknown",
    reason: typeof observation.context.reason === "string"
      ? observation.context.reason
      : `Connector V3 exposes unsupported context ${observation.context.kind}`,
    observedTopLevelKeys: Object.keys(rawState).sort()
  };
}

function projectSettlingContext(
  observation: ConnectorV3Observation,
  context: DirectContext | undefined,
  surface: DirectSurface | undefined,
  player: NormalizedCurrentState["player"] | undefined,
  rawState: Sts2McpRawState
): SemanticContext {
  if (context) return projectContext(context, surface, player);
  if (observation.context.kind === "run_transition") {
    return { kind: "run_transition", phase: "setup" };
  }
  return {
    kind: "unknown",
    reason: `Connector V3 is settling context ${observation.context.kind}`,
    observedTopLevelKeys: Object.keys(rawState).sort()
  };
}

function parseContext(
  observation: ConnectorV3Observation,
  diagnostics: DiagnosticsBuilder
): DirectContext | undefined {
  const schema = observation.context.kind === "menu"
    ? gatewayMenuContextSchema
    : observation.context.kind === "combat"
      ? gatewayCombatContextSchema
    : observation.context.kind === "event"
      ? gatewayEventContextSchema
      : observation.context.kind === "map"
        ? gatewayMapContextSchema
        : observation.context.kind === "reward_flow"
      ? gatewayRewardFlowContextSchema
      : ["rest", "shop", "treasure"].includes(observation.context.kind)
        ? gatewayRunRoomContextSchema
        : observation.context.kind === "game_over"
          ? gatewayGameOverContextSchema
          : undefined;
  if (!schema) return undefined;
  const parsed = schema.safeParse(observation.context);
  if (parsed.success) return parsed.data;
  diagnostics.invalid(
    "connector_v3_observation.context",
    observation.context,
    parsed.error.issues.map((issue) => issue.message).join("; ")
  );
  return undefined;
}

function parseSurface(
  observation: ConnectorV3Observation,
  diagnostics: DiagnosticsBuilder
): DirectSurface | undefined {
  const schema = ["main_menu", "singleplayer_menu", "character_select"]
    .includes(observation.surface.kind)
    ? gatewayMenuSurfaceSchema
    : observation.surface.kind === "combat_turn"
      ? gatewayCombatTurnSurfaceSchema
    : observation.surface.kind === "combat_hand_card_selection"
      ? gatewayCombatHandSurfaceSchema
    : observation.surface.kind === "combat_pile_card_selection"
      ? gatewayCombatPileSurfaceSchema
    : observation.surface.kind === "deck_enchant_selection"
      ? gatewayDeckEnchantSurfaceSchema
    : observation.surface.kind === "event_dialogue"
      ? gatewayEventDialogueSurfaceSchema
    : observation.surface.kind === "generated_card_choice"
      ? gatewayGeneratedChoiceSurfaceSchema
    : observation.surface.kind === "deck_upgrade_selection"
      ? gatewayDeckUpgradeSurfaceSchema
    : observation.surface.kind === "deck_transform_selection"
      ? gatewayDeckTransformSurfaceSchema
    : observation.surface.kind === "wood_carvings_replacement_selection"
      ? gatewayWoodCarvingsSurfaceSchema
    : observation.surface.kind === "deck_removal_selection"
      ? gatewayMerchantRemovalSurfaceSchema
    : observation.surface.kind === "relic_deck_removal_selection"
      ? gatewayRelicRemovalSurfaceSchema
    : observation.surface.kind === "reward_deck_removal_selection"
      ? gatewayRewardRemovalSurfaceSchema
    : observation.surface.kind === "event_deck_removal_selection"
      ? gatewayEventDeckRemovalSurfaceSchema
    : observation.surface.kind === "card_bundle_selection"
      ? gatewayCardBundleSurfaceSchema
    : observation.surface.kind === "event_option"
      ? gatewayEventOptionSurfaceSchema
      : observation.surface.kind === "map_navigation"
        ? gatewayMapNavigationSurfaceSchema
        : observation.surface.kind === "reward_claim"
          ? gatewayRewardClaimSurfaceSchema
          : observation.surface.kind === "card_reward_selection"
            ? gatewayCardRewardSelectionSurfaceSchema
            : observation.surface.kind === "rest_site"
              ? gatewayRestSiteSurfaceSchema
              : observation.surface.kind === "shop_inventory"
                ? gatewayShopInventorySurfaceSchema
                : observation.surface.kind === "shop_room"
                  ? gatewayShopRoomSurfaceSchema
                  : observation.surface.kind === "treasure_room"
                    ? gatewayTreasureRoomSurfaceSchema
        : observation.surface.kind === "game_over"
          ? gatewayGameOverSurfaceSchema
          : undefined;
  if (!schema) return undefined;
  const parsed = schema.safeParse(observation.surface);
  if (parsed.success) return parsed.data;
  diagnostics.invalid(
    "connector_v3_observation.surface",
    observation.surface,
    parsed.error.issues.map((issue) => issue.message).join("; ")
  );
  return undefined;
}

function parseSharedState(
  observation: ConnectorV3Observation,
  diagnostics: DiagnosticsBuilder
): GatewaySharedVisibleState | undefined {
  if (observation.context.kind === "menu") return undefined;
  const parsed = sharedVisibleStateSchema.safeParse(observation.shared_state);
  if (parsed.success) return parsed.data;
  diagnostics.invalid(
    "connector_v3_observation.shared_state",
    observation.shared_state,
    parsed.error.issues.map((issue) => issue.message).join("; ")
  );
  return undefined;
}

function contextMatchesSurface(context: DirectContext, surface: DirectSurface): boolean {
  if (surface.kind === "generated_card_choice") {
    return context.kind !== "menu";
  }
  if (context.kind === "menu") {
    return surface.kind === "main_menu"
      ? context.flow === "root_navigation"
      : (surface.kind === "singleplayer_menu" || surface.kind === "character_select")
        && context.flow === "standard_run_setup";
  }
  if (context.kind === "reward_flow") {
    return (context.reward_kind === "room_rewards" && surface.kind === "reward_claim")
      || (context.reward_kind === "card_reward" && surface.kind === "card_reward_selection")
      || surface.kind === "reward_deck_removal_selection"
      || surface.kind === "card_bundle_selection";
  }
  if (context.kind === "combat") {
    return surface.kind === "combat_turn"
      || surface.kind === "combat_hand_card_selection"
      || surface.kind === "combat_pile_card_selection";
  }
  if (surface.kind === "deck_transform_selection") {
    return surface.source.kind === "whispering_hollow_event"
      ? context.kind === "event"
      : ["event", "reward_flow", "shop", "treasure"].includes(context.kind);
  }
  if (surface.kind === "wood_carvings_replacement_selection") {
    return context.kind === "event";
  }
  if (surface.kind === "deck_enchant_selection") {
    return surface.source.kind === "kifuda_relic_pickup"
      ? context.kind === "shop"
      : context.kind === "event";
  }
  if (surface.kind === "event_dialogue") return context.kind === "event";
  if (surface.kind === "deck_upgrade_selection") {
    return context.kind === "rest" || context.kind === "event";
  }
  if (surface.kind === "deck_removal_selection") return context.kind === "shop";
  if (surface.kind === "relic_deck_removal_selection") return context.kind === "event";
  if (surface.kind === "reward_deck_removal_selection") {
    return context.kind === "event";
  }
  if (surface.kind === "event_deck_removal_selection") return context.kind === "event";
  if (surface.kind === "card_bundle_selection") {
    return context.kind === "event"
      || context.kind === "treasure";
  }
  if (context.kind === "rest") return surface.kind === "rest_site";
  if (context.kind === "shop") {
    return surface.kind === "shop_inventory" || surface.kind === "shop_room";
  }
  if (context.kind === "treasure") return surface.kind === "treasure_room";
  return (context.kind === "event" && surface.kind === "event_option")
    || (context.kind === "map" && surface.kind === "map_navigation")
    || (context.kind === "game_over" && surface.kind === "game_over");
}

function validateCommands(
  context: DirectContext,
  surface: DirectSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const errors = commands.flatMap((command) => {
    if (surface.kind === "combat_turn") {
      return context.kind === "combat"
        ? validateCombatCommand(context, surface, command)
        : ["combat turn command requires combat context"];
    }
    if (surface.kind === "combat_hand_card_selection") {
      return context.kind === "combat"
        ? validateCombatHandCommand(surface, command)
        : ["combat-hand command requires combat context"];
    }
    if (surface.kind === "combat_pile_card_selection") {
      return context.kind === "combat"
        ? validateCombatPileCommand(surface, command)
        : ["combat-pile command requires combat context"];
    }
    if (surface.kind === "generated_card_choice") {
      return validateGeneratedChoiceCommand(surface, command);
    }
    if (surface.kind === "deck_upgrade_selection") {
      return validateDeckUpgradeCommand(surface, command);
    }
    if (surface.kind === "deck_transform_selection") {
      return validateDeckTransformCommand(surface, command);
    }
    if (surface.kind === "wood_carvings_replacement_selection") {
      return validateWoodCarvingsCommand(surface, command);
    }
    if (surface.kind === "deck_enchant_selection") {
      return validateDeckEnchantCommand(surface, command);
    }
    if (surface.kind === "event_dialogue") {
      return validateEventDialogueCommand(surface, command);
    }
    if (surface.kind === "deck_removal_selection"
        || surface.kind === "relic_deck_removal_selection"
        || surface.kind === "reward_deck_removal_selection") {
      return validateDeckRemovalCommand(surface, command);
    }
    if (surface.kind === "event_deck_removal_selection") {
      return validateEventRemovalCommand(surface, command);
    }
    if (surface.kind === "card_bundle_selection") {
      return validateCardBundleCommand(surface, command);
    }
    if (surface.kind === "event_option") return validateEventCommand(surface, command);
    if (surface.kind === "map_navigation") return validateMapCommand(surface, command);
    if (surface.kind === "reward_claim") return validateRewardCommand(surface, command);
    if (surface.kind === "card_reward_selection") {
      return validateCardRewardCommand(surface, command);
    }
    if (surface.kind === "rest_site") return validateRestCommand(surface, command);
    if (surface.kind === "shop_inventory") return validateShopInventoryCommand(surface, command);
    if (surface.kind === "shop_room") return validateShopRoomCommand(surface, command);
    if (surface.kind === "treasure_room") return validateTreasureCommand(surface, command);
    if (surface.kind === "game_over") return validateGameOverCommand(surface, command);
    return validateMenuCommand(surface, command);
  });
  if (surface.kind === "deck_upgrade_selection") {
    errors.push(...validateDeckUpgradeCommandSet(surface, commands));
  }
  if (surface.kind === "deck_transform_selection") {
    errors.push(...validateDeckTransformCommandSet(surface, commands));
  }
  if (surface.kind === "wood_carvings_replacement_selection") {
    errors.push(...validateWoodCarvingsCommandSet(surface, commands));
  }
  if (surface.kind === "deck_enchant_selection") {
    errors.push(...validateDeckEnchantCommandSet(surface, commands));
  }
  if (surface.kind === "generated_card_choice") {
    errors.push(...validateGeneratedChoiceCommandSet(surface, commands));
  }
  if (surface.kind === "event_dialogue") {
    errors.push(...validateEventDialogueCommandSet(surface, commands));
  }
  if (surface.kind === "map_navigation") {
    errors.push(...validateMapCommandSet(surface, commands));
  }
  if (surface.kind === "combat_turn") {
    errors.push(...validateCombatCommandSet(surface, commands));
  }
  if (surface.kind === "combat_pile_card_selection") {
    errors.push(...validateCombatPileCommandSet(surface, commands));
  }
  if (surface.kind === "deck_removal_selection"
      || surface.kind === "relic_deck_removal_selection"
      || surface.kind === "reward_deck_removal_selection") {
    errors.push(...validateDeckRemovalCommandSet(surface, commands));
  }
  if (surface.kind === "event_deck_removal_selection") {
    errors.push(...validateEventRemovalCommandSet(surface, commands));
  }
  if (surface.kind === "card_bundle_selection") {
    errors.push(...validateCardBundleCommandSet(surface, commands));
  }
  return errors;
}

function validateDeckUpgradeCommandSet(
  surface: GatewayDeckUpgradeSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = [
    ...surface.selectable_card_entity_ids.map(
      (id) => `toggle_deck_upgrade_card|select_entity|${id}`
    ),
    ...surface.deselectable_card_entity_ids.map(
      (id) => `toggle_deck_upgrade_card|deselect_entity|${id}`
    ),
    ...(surface.can_cancel_selection
      ? ["cancel_deck_upgrade_selection|cancel_interaction|"]
      : []),
    ...(surface.can_cancel_preview
      ? ["cancel_deck_upgrade_preview|cancel_interaction|"]
      : []),
    ...(surface.can_confirm ? ["confirm_deck_upgrade|confirm_interaction|"] : [])
  ].sort();
  return exactCommandSetErrors("deck-upgrade", expected, commands);
}

function validateDeckTransformCommandSet(
  surface: GatewayDeckTransformSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = [
    ...surface.selectable_card_entity_ids.map(
      (id) => `toggle_deck_transform_card|select_entity|${id}`
    ),
    ...surface.deselectable_card_entity_ids.map(
      (id) => `toggle_deck_transform_card|deselect_entity|${id}`
    ),
    ...(surface.can_preview ? ["preview_deck_transform|confirm_interaction|"] : []),
    ...(surface.can_cancel_selection
      ? ["cancel_deck_transform_selection|cancel_interaction|"]
      : []),
    ...(surface.can_cancel_preview
      ? ["cancel_deck_transform_preview|cancel_interaction|"]
      : []),
    ...(surface.can_confirm ? ["confirm_deck_transform|confirm_interaction|"] : []),
    ...(surface.can_toggle_upgrade_view
      ? ["toggle_deck_transform_upgrade_view|activate_control|"]
      : [])
  ].sort();
  return exactCommandSetErrors("deck-transform", expected, commands);
}

function validateWoodCarvingsCommandSet(
  surface: GatewayWoodCarvingsSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = [
    ...surface.selectable_card_entity_ids.map(
      (id) => `select_wood_carvings_replacement_card|select_entity|${id}`
    ),
    ...(surface.can_cancel_preview
      ? ["cancel_wood_carvings_replacement_preview|cancel_interaction|"]
      : []),
    ...(surface.can_confirm
      ? ["confirm_wood_carvings_replacement|confirm_interaction|"]
      : [])
  ].sort();
  return exactCommandSetErrors("wood-carvings", expected, commands);
}

function validateDeckEnchantCommandSet(
  surface: GatewayDeckEnchantSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = [
    ...surface.selectable_card_entity_ids.map(
      (id) => `toggle_card|select_entity|${id}`
    ),
    ...surface.deselectable_card_entity_ids.map(
      (id) => `toggle_card|deselect_entity|${id}`
    ),
    ...(surface.can_preview ? ["preview_selection|confirm_interaction|"] : []),
    ...(surface.can_close_selection ? ["close_selection|cancel_interaction|"] : []),
    ...(surface.can_confirm ? ["confirm_selection|confirm_interaction|"] : []),
    ...(surface.can_cancel_preview ? ["cancel_preview|cancel_interaction|"] : [])
  ].sort();
  return exactCommandSetErrors("deck-enchant", expected, commands);
}

function validateEventDialogueCommandSet(
  surface: GatewayEventDialogueSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = surface.can_advance
    ? ["advance_event_dialogue|activate_control|"]
    : [];
  return exactCommandSetErrors("event-dialogue", expected, commands);
}

function validateMapCommandSet(
  surface: Extract<GatewayJourneySurface, { kind: "map_navigation" }>,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = [
    ...surface.next_options.map((option) =>
      `choose_map_node|navigate|${option.entity_id}`
    ),
    ...(surface.can_exit_annotation && surface.annotation_input_entity_id
      ? [`exit_map_annotation|activate_control|${surface.annotation_input_entity_id}`]
      : [])
  ].sort();
  const actual = commands.map((command) => [
    command.operation,
    command.command,
    command.operands.map_node_id
      ?? command.operands.map_annotation_input_id
      ?? ""
  ].join("|")).sort();
  return JSON.stringify(actual) === JSON.stringify(expected)
    ? []
    : ["map command set must exactly match current actionable facts"];
}

function validateCombatPileCommandSet(
  surface: GatewayCombatPileSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = [
    ...surface.selectable_card_entity_ids.map(
      (id) => `toggle_combat_pile_card|select_entity|${id}`
    ),
    ...surface.deselectable_card_entity_ids.map(
      (id) => `toggle_combat_pile_card|deselect_entity|${id}`
    ),
    ...(surface.can_confirm
      ? ["confirm_combat_pile_selection|confirm_interaction|"]
      : [])
  ].sort();
  return exactCommandSetErrors("combat-pile", expected, commands);
}

function validateDeckRemovalCommandSet(
  surface: GatewayDeckRemovalSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = [
    ...surface.selectable_card_entity_ids.map(
      (id) => `toggle_deck_removal_card|select_entity|${id}`
    ),
    ...surface.deselectable_card_entity_ids.map(
      (id) => `toggle_deck_removal_card|deselect_entity|${id}`
    ),
    ...(surface.can_preview ? ["preview_deck_removal|confirm_interaction|"] : []),
    ...(surface.kind !== "relic_deck_removal_selection" && surface.can_cancel_selection
      ? ["cancel_deck_removal_selection|cancel_interaction|"]
      : []),
    ...(surface.can_cancel_preview
      ? ["cancel_deck_removal_preview|cancel_interaction|"]
      : []),
    ...(surface.can_confirm ? ["confirm_deck_removal|confirm_interaction|"] : [])
  ].sort();
  return exactCommandSetErrors(surface.kind, expected, commands);
}

function validateCardBundleCommandSet(
  surface: GatewayCardBundleSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = [
    ...surface.selectable_bundle_entity_ids.map(
      (id) => `preview_card_bundle|select_entity|${id}`
    ),
    ...(surface.can_confirm && surface.selected_bundle_entity_id
      ? [`confirm_card_bundle|confirm_interaction|${surface.selected_bundle_entity_id}`]
      : []),
    ...(surface.can_cancel_preview && surface.selected_bundle_entity_id
      ? [`cancel_card_bundle_preview|cancel_interaction|${surface.selected_bundle_entity_id}`]
      : [])
  ].sort();
  const actual = commands.map((command) => [
    command.operation,
    command.command,
    command.operands.bundle_id ?? ""
  ].join("|")).sort();
  return JSON.stringify(actual) === JSON.stringify(expected)
    ? []
    : ["card-bundle command set must exactly match current actionable facts"];
}

function validateEventRemovalCommandSet(
  surface: GatewayEventDeckRemovalSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = [
    ...surface.selectable_card_entity_ids.map(
      (id) => `toggle_event_deck_removal_card|select_entity|${id}`
    ),
    ...surface.deselectable_card_entity_ids.map(
      (id) => `toggle_event_deck_removal_card|deselect_entity|${id}`
    ),
    ...(surface.can_cancel_preview
      ? ["cancel_event_deck_removal_preview|cancel_interaction|"]
      : []),
    ...(surface.can_confirm
      ? ["confirm_event_deck_removal|confirm_interaction|"]
      : [])
  ].sort();
  return exactCommandSetErrors("event-removal", expected, commands);
}

function exactCommandSetErrors(
  family: string,
  expected: string[],
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const actual = commands.map((command) => [
    command.operation,
    command.command,
    command.operands.card_id ?? ""
  ].join("|")).sort();
  return JSON.stringify(actual) === JSON.stringify(expected)
    ? []
    : [`${family} command set must exactly match current actionable facts`];
}

function validateGeneratedChoiceCommand(
  surface: GatewayGeneratedChoiceSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "generated choice command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "generated choice command is missing its exact screen binding"
  ];
  if (command.command === "choose") {
    const card = surface.cards.find(
      (value) => value.entity_id === command.operands.card_id
    );
    return collectErrors([
      ...base,
      command.operation === surface.select_operation
        || "generated choice select operation does not match its exact source contract",
      surface.selectable_card_entity_ids.includes(command.operands.card_id ?? "")
        || "generated choice card is not currently selectable",
      Boolean(card) || "generated choice must bind one current visible card",
      Boolean(card && hasBinding(command, "card", card.entity_id))
        || "generated choice is missing its exact card binding"
    ]);
  }
  if (command.operation === surface.skip_operation) {
    return collectErrors([
      ...base,
      command.command === "activate_control"
        || "generated choice skip must activate its native control",
      surface.skip_available || "generated choice skip was published while unavailable",
      command.operands.control_id === command.operation
        || "generated choice skip control is not exact"
    ]);
  }
  return [`unsupported direct generated-choice operation ${command.operation}`];
}

function validateGeneratedChoiceCommandSet(
  surface: GatewayGeneratedChoiceSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = [
    ...surface.selectable_card_entity_ids.map(
      (id) => `${surface.select_operation}|choose|${id}`
    ),
    ...(surface.skip_available && surface.skip_operation
      ? [`${surface.skip_operation}|activate_control|`]
      : [])
  ].sort();
  return exactCommandSetErrors("generated-choice", expected, commands);
}

function validateDeckUpgradeCommand(
  surface: GatewayDeckUpgradeSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "deck-upgrade command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "deck-upgrade command is missing its exact screen binding"
  ];
  if (command.operation === "toggle_deck_upgrade_card") {
    const cardId = command.operands.card_id ?? "";
    const selecting = surface.selectable_card_entity_ids.includes(cardId);
    const deselecting = surface.deselectable_card_entity_ids.includes(cardId);
    return collectErrors([
      ...base,
      surface.stage === "selecting"
        || "deck-upgrade card toggle requires selecting stage",
      (selecting && command.command === "select_entity")
        || (deselecting && command.command === "deselect_entity")
        || "deck-upgrade command must match exact selected membership",
      hasBinding(command, "card", cardId)
        || "deck-upgrade command is missing its exact card binding"
    ]);
  }
  if (command.operation === "cancel_deck_upgrade_selection") {
    return collectErrors([
      ...base,
      command.command === "cancel_interaction"
        || "deck-upgrade selection cancel must cancel the interaction",
      command.operands.control_id === command.operation
        || "deck-upgrade selection cancel control is not exact",
      surface.stage === "selecting" && surface.can_cancel_selection
        || "deck-upgrade selection cancel is unavailable"
    ]);
  }
  if (command.operation === "cancel_deck_upgrade_preview") {
    return collectErrors([
      ...base,
      command.command === "cancel_interaction"
        || "deck-upgrade preview return must cancel the preview interaction",
      command.operands.control_id === command.operation
        || "deck-upgrade preview return control is not exact",
      surface.stage === "preview" && surface.can_cancel_preview
        || "deck-upgrade preview return is unavailable"
    ]);
  }
  if (command.operation === "confirm_deck_upgrade") {
    const boundCards = command.entityBindings
      .filter((binding) => binding.role === "card")
      .map((binding) => binding.entityId)
      .sort();
    const selectedCards = [...surface.selected_card_entity_ids].sort();
    return collectErrors([
      ...base,
      command.command === "confirm_interaction"
        || "deck-upgrade commit must confirm the interaction",
      command.operands.control_id === command.operation
        || "deck-upgrade confirm control is not exact",
      surface.stage === "preview" && surface.can_confirm
        || "deck-upgrade confirm is unavailable",
      JSON.stringify(boundCards) === JSON.stringify(selectedCards)
        || "deck-upgrade confirm must bind exact selected-card membership"
    ]);
  }
  return [`unsupported direct deck-upgrade operation ${command.operation}`];
}

function validateCombatCommandSet(
  surface: GatewayCombatTurnSurface,
  commands: ConnectorV3ConsumerCommand[]
): string[] {
  const expected = [
    ...surface.playable_cards.flatMap((card) =>
      (card.target_entity_ids.length > 0 ? card.target_entity_ids : [""])
        .map(() => `play_card|play_card|${card.entity_id}`)
    ),
    ...surface.usable_potions.flatMap((potion) =>
      (potion.target_entity_ids.length > 0 ? potion.target_entity_ids : [""])
        .map(() => `use_potion|use_potion|`)
    ),
    ...(surface.can_end_turn ? ["end_turn|end_turn|"] : [])
  ].sort();
  const actual = commands.map((command) => [
    command.operation,
    command.command,
    command.operands.card_id ?? ""
  ].join("|")).sort();
  return JSON.stringify(actual) === JSON.stringify(expected)
    ? []
    : ["combat command set must exactly match current actionable facts"];
}

function validateDeckTransformCommand(
  surface: GatewayDeckTransformSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "deck-transform command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "deck-transform command is missing its exact screen binding"
  ];
  if (command.operation === "toggle_deck_transform_card") {
    const cardId = command.operands.card_id ?? "";
    const selecting = surface.selectable_card_entity_ids.includes(cardId);
    const deselecting = surface.deselectable_card_entity_ids.includes(cardId);
    return collectErrors([
      ...base,
      surface.stage === "selecting" || "deck-transform card toggle requires selecting stage",
      (selecting && command.command === "select_entity")
        || (deselecting && command.command === "deselect_entity")
        || "deck-transform command must match exact selected membership",
      hasBinding(command, "card", cardId)
        || "deck-transform command is missing its exact card binding"
    ]);
  }
  const selectedBindingsMatch = (): boolean => {
    const bound = command.entityBindings
      .filter((binding) => binding.role === "card")
      .map((binding) => binding.entityId)
      .sort();
    return JSON.stringify(bound)
      === JSON.stringify([...surface.selected_card_entity_ids].sort());
  };
  const control = command.operands.control_id === command.operation;
  if (command.operation === "preview_deck_transform") {
    return collectErrors([
      ...base,
      command.command === "confirm_interaction" || "deck-transform preview must confirm the selecting interaction",
      control || "deck-transform preview control is not exact",
      surface.stage === "selecting" && surface.can_preview || "deck-transform preview is unavailable",
      selectedBindingsMatch() || "deck-transform preview must bind exact selected membership"
    ]);
  }
  if (command.operation === "cancel_deck_transform_selection") {
    return collectErrors([
      ...base,
      command.command === "cancel_interaction" || "deck-transform close must cancel the interaction",
      control || "deck-transform close control is not exact",
      surface.stage === "selecting" && surface.can_cancel_selection || "deck-transform close is unavailable"
    ]);
  }
  if (command.operation === "toggle_deck_transform_upgrade_view") {
    return collectErrors([
      ...base,
      command.command === "activate_control" || "deck-transform upgrade view must activate its native control",
      control || "deck-transform upgrade-view control is not exact",
      surface.stage === "selecting" && surface.can_toggle_upgrade_view || "deck-transform upgrade view is unavailable"
    ]);
  }
  if (command.operation === "cancel_deck_transform_preview") {
    return collectErrors([
      ...base,
      command.command === "cancel_interaction" || "deck-transform preview return must cancel the preview",
      control || "deck-transform preview return control is not exact",
      surface.stage === "preview" && surface.can_cancel_preview || "deck-transform preview return is unavailable",
      selectedBindingsMatch() || "deck-transform preview return must bind exact selected membership"
    ]);
  }
  if (command.operation === "confirm_deck_transform") {
    return collectErrors([
      ...base,
      command.command === "confirm_interaction" || "deck-transform commit must confirm the interaction",
      control || "deck-transform confirm control is not exact",
      surface.stage === "preview" && surface.can_confirm || "deck-transform confirm is unavailable",
      selectedBindingsMatch() || "deck-transform commit must bind exact selected membership"
    ]);
  }
  return [`unsupported direct deck-transform operation ${command.operation}`];
}

function validateWoodCarvingsCommand(
  surface: GatewayWoodCarvingsSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "Wood Carvings command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "Wood Carvings command is missing its exact screen binding"
  ];
  if (command.operation === "select_wood_carvings_replacement_card") {
    const cardId = command.operands.card_id ?? "";
    return collectErrors([
      ...base,
      command.command === "select_entity" || "Wood Carvings selection must use select_entity",
      surface.stage === "selecting" && surface.selectable_card_entity_ids.includes(cardId)
        || "Wood Carvings selection must bind one currently selectable card",
      hasBinding(command, "card", cardId)
        || "Wood Carvings selection is missing its exact card binding"
    ]);
  }
  const selected = command.entityBindings
    .filter((binding) => binding.role === "card")
    .map((binding) => binding.entityId)
    .sort();
  const selectedMatch = JSON.stringify(selected)
    === JSON.stringify([...surface.selected_card_entity_ids].sort());
  if (command.operation === "confirm_wood_carvings_replacement") {
    return collectErrors([
      ...base,
      command.command === "confirm_interaction" || "Wood Carvings commit must confirm the interaction",
      command.operands.control_id === command.operation || "Wood Carvings confirm control is not exact",
      surface.stage === "preview" && surface.can_confirm || "Wood Carvings confirm is unavailable",
      selectedMatch || "Wood Carvings commit must bind the exact selected card"
    ]);
  }
  if (command.operation === "cancel_wood_carvings_replacement_preview") {
    return collectErrors([
      ...base,
      command.command === "cancel_interaction" || "Wood Carvings preview return must cancel the preview",
      command.operands.control_id === command.operation || "Wood Carvings preview return control is not exact",
      surface.stage === "preview" && surface.can_cancel_preview || "Wood Carvings preview return is unavailable",
      selectedMatch || "Wood Carvings preview return must bind the exact selected card"
    ]);
  }
  return [`unsupported direct Wood Carvings operation ${command.operation}`];
}

function validateDeckEnchantCommand(
  surface: GatewayDeckEnchantSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "deck-enchant command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "deck-enchant command is missing its exact screen binding"
  ];
  if (command.operation === "toggle_card") {
    const cardId = command.operands.card_id ?? "";
    const selecting = surface.selectable_card_entity_ids.includes(cardId);
    const deselecting = surface.deselectable_card_entity_ids.includes(cardId);
    return collectErrors([
      ...base,
      (selecting && command.command === "select_entity")
        || (deselecting && command.command === "deselect_entity")
        || "deck-enchant command must match exact selected membership",
      hasBinding(command, "card", cardId)
        || "deck-enchant command is missing its exact card binding"
    ]);
  }
  const expectedAvailability = command.operation === "preview_selection"
    ? surface.stage === "selecting" && surface.can_preview
    : command.operation === "close_selection"
      ? surface.stage === "selecting" && surface.can_close_selection
      : command.operation === "confirm_selection"
        ? surface.stage === "preview" && surface.can_confirm
        : command.operation === "cancel_preview"
          ? surface.stage === "preview" && surface.can_cancel_preview
          : false;
  const expectedCommand = command.operation === "preview_selection"
      || command.operation === "confirm_selection"
    ? "confirm_interaction"
    : "cancel_interaction";
  const selected = command.entityBindings
    .filter((binding) => binding.role === "card")
    .map((binding) => binding.entityId)
    .sort();
  const selectedMatch = command.operation !== "confirm_selection"
    || JSON.stringify(selected) === JSON.stringify([...surface.selected_card_entity_ids].sort());
  return collectErrors([
    ...base,
    expectedAvailability || `deck-enchant operation ${command.operation} is unavailable`,
    command.command === expectedCommand || "deck-enchant command uses the wrong semantic command",
    command.operands.control_id === command.operation
      || "deck-enchant command must bind its exact semantic control",
    selectedMatch || "deck-enchant commit must bind exact selected membership"
  ]);
}

function validateEventDialogueCommand(
  surface: GatewayEventDialogueSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const current = surface.revealed_lines.find((line) => line.is_current);
  return collectErrors([
    command.operation === "advance_event_dialogue"
      || "event-dialogue operation is not supported",
    command.command === "activate_control"
      || "event-dialogue advance must activate the semantic control",
    surface.can_advance || "event-dialogue advance was published while unavailable",
    command.operands.screen_id === surface.screen_entity_id
      || "event-dialogue command must bind the current screen",
    command.operands.dialogue_line_id === current?.entity_id
      || "event-dialogue command must bind the exact current revealed line",
    command.operands.control_id === "advance_event_dialogue"
      || "event-dialogue command must bind the advance control",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "event-dialogue command is missing its exact screen binding",
    Boolean(current && hasBinding(command, "dialogue_line", current.entity_id))
      || "event-dialogue command is missing its exact line binding"
  ]);
}

function validateCombatPileCommand(
  surface: GatewayCombatPileSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "combat-pile command must bind the current screen",
    command.operands.source_id === surface.source_entity_id
      || "combat-pile command must bind the current semantic source",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "combat-pile command is missing its exact screen binding",
    hasBinding(command, "source", surface.source_entity_id)
      || "combat-pile command is missing its exact source binding"
  ];
  if (command.operation === "toggle_combat_pile_card") {
    const cardId = command.operands.card_id ?? "";
    const selecting = surface.selectable_card_entity_ids.includes(cardId);
    const deselecting = surface.deselectable_card_entity_ids.includes(cardId);
    return collectErrors([
      ...base,
      (selecting && command.command === "select_entity")
        || (deselecting && command.command === "deselect_entity")
        || "combat-pile command must match exact selected membership",
      hasBinding(command, "card", cardId)
        || "combat-pile command is missing its exact card binding"
    ]);
  }
  if (command.operation === "confirm_combat_pile_selection") {
    const bound = command.entityBindings
      .filter((binding) => binding.role === "card")
      .map((binding) => binding.entityId)
      .sort();
    return collectErrors([
      ...base,
      command.command === "confirm_interaction" || "combat-pile commit must confirm the interaction",
      command.operands.control_id === command.operation || "combat-pile confirm control is not exact",
      surface.can_confirm || "combat-pile confirm is unavailable",
      JSON.stringify(bound) === JSON.stringify([...surface.selected_card_entity_ids].sort())
        || "combat-pile commit must bind exact selected membership"
    ]);
  }
  return [`unsupported direct combat-pile operation ${command.operation}`];
}

function validateDeckRemovalCommand(
  surface: GatewayDeckRemovalSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const family = surface.kind;
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || `${family} command must bind the current screen`,
    hasBinding(command, "screen", surface.screen_entity_id)
      || `${family} command is missing its exact screen binding`
  ];
  if (command.operation === "toggle_deck_removal_card") {
    const cardId = command.operands.card_id ?? "";
    const selecting = surface.selectable_card_entity_ids.includes(cardId);
    const deselecting = surface.deselectable_card_entity_ids.includes(cardId);
    return collectErrors([
      ...base,
      surface.stage === "selecting"
        || `${family} card toggle requires selecting stage`,
      (selecting && command.command === "select_entity")
        || (deselecting && command.command === "deselect_entity")
        || `${family} command must match exact selected membership`,
      hasBinding(command, "card", cardId)
        || `${family} command is missing its exact card binding`
    ]);
  }
  const selectedBindingsMatch = (): boolean => {
    const boundCards = command.entityBindings
      .filter((binding) => binding.role === "card")
      .map((binding) => binding.entityId)
      .sort();
    return JSON.stringify(boundCards)
      === JSON.stringify([...surface.selected_card_entity_ids].sort());
  };
  if (command.operation === "preview_deck_removal") {
    return collectErrors([
      ...base,
      command.command === "confirm_interaction"
        || `${family} preview must confirm the selecting stage`,
      command.operands.control_id === command.operation
        || `${family} preview control is not exact`,
      surface.stage === "selecting" && surface.can_preview
        || `${family} preview is unavailable`,
      selectedBindingsMatch()
        || `${family} preview must bind exact selected membership`
    ]);
  }
  if (command.operation === "cancel_deck_removal_selection") {
    return collectErrors([
      ...base,
      surface.kind !== "relic_deck_removal_selection"
        || `${family} has no proven selection-cancel contract`,
      command.command === "cancel_interaction"
        || `${family} selection cancel must cancel the interaction`,
      command.operands.control_id === command.operation
        || `${family} selection cancel control is not exact`,
      surface.stage === "selecting" && surface.can_cancel_selection
        || `${family} selection cancel is unavailable`
    ]);
  }
  if (command.operation === "cancel_deck_removal_preview") {
    return collectErrors([
      ...base,
      command.command === "cancel_interaction"
        || `${family} preview return must cancel the preview interaction`,
      command.operands.control_id === command.operation
        || `${family} preview return control is not exact`,
      surface.stage === "preview" && surface.can_cancel_preview
        || `${family} preview return is unavailable`
    ]);
  }
  if (command.operation === "confirm_deck_removal") {
    return collectErrors([
      ...base,
      command.command === "confirm_interaction"
        || `${family} commit must confirm the interaction`,
      command.operands.control_id === command.operation
        || `${family} confirm control is not exact`,
      surface.stage === "preview" && surface.can_confirm
        || `${family} confirm is unavailable`,
      selectedBindingsMatch()
        || `${family} confirm must bind exact selected membership`
    ]);
  }
  return [`unsupported direct ${family} operation ${command.operation}`];
}

function validateCardBundleCommand(
  surface: GatewayCardBundleSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const bundleId = command.operands.bundle_id ?? "";
  const bundle = surface.bundles.find((value) => value.entity_id === bundleId);
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "card-bundle command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "card-bundle command is missing its exact screen binding",
    Boolean(bundle) || "card-bundle command must bind one current visible bundle",
    Boolean(bundle && hasBinding(command, "bundle", bundle.entity_id))
      || "card-bundle command is missing its exact bundle binding"
  ];
  if (command.operation === "preview_card_bundle") {
    return collectErrors([
      ...base,
      surface.stage === "choosing" || "bundle preview requires choosing stage",
      surface.selectable_bundle_entity_ids.includes(bundleId)
        || "bundle preview must bind one currently selectable bundle",
      command.command === "select_entity" || "bundle preview must use select_entity"
    ]);
  }
  if (command.operation === "confirm_card_bundle") {
    return collectErrors([
      ...base,
      surface.stage === "preview" && surface.can_confirm
        || "bundle confirmation is unavailable",
      surface.selected_bundle_entity_id === bundleId
        || "bundle confirmation must bind the exact previewed bundle",
      command.command === "confirm_interaction"
        || "bundle confirmation must confirm the interaction",
      command.operands.control_id === command.operation
        || "bundle confirmation control is not exact"
    ]);
  }
  if (command.operation === "cancel_card_bundle_preview") {
    return collectErrors([
      ...base,
      surface.stage === "preview" && surface.can_cancel_preview
        || "bundle preview cancel is unavailable",
      surface.selected_bundle_entity_id === bundleId
        || "bundle preview cancel must bind the exact previewed bundle",
      command.command === "cancel_interaction"
        || "bundle preview cancel must cancel the interaction",
      command.operands.control_id === command.operation
        || "bundle preview cancel control is not exact"
    ]);
  }
  return [`unsupported direct card-bundle operation ${command.operation}`];
}

function validateEventRemovalCommand(
  surface: GatewayEventDeckRemovalSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "event-removal command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "event-removal command is missing its exact screen binding"
  ];
  if (command.operation === "toggle_event_deck_removal_card") {
    const cardId = command.operands.card_id;
    const selecting = cardId !== undefined
      && surface.selectable_card_entity_ids.includes(cardId);
    const deselecting = cardId !== undefined
      && surface.deselectable_card_entity_ids.includes(cardId);
    return collectErrors([
      ...base,
      surface.stage === "selecting"
        || "event-removal card toggle requires selecting stage",
      (selecting && command.command === "select_entity")
        || (deselecting && command.command === "deselect_entity")
        || "event-removal command must match exact selected membership",
      Boolean(cardId && hasBinding(command, "card", cardId))
        || "event-removal command is missing its exact card binding"
    ]);
  }
  const selectedBindingsMatch = (): boolean => {
    const boundCards = command.entityBindings
      .filter((binding) => binding.role === "card")
      .map((binding) => binding.entityId)
      .sort();
    return JSON.stringify(boundCards)
      === JSON.stringify([...surface.selected_card_entity_ids].sort());
  };
  if (command.operation === "cancel_event_deck_removal_preview") {
    return collectErrors([
      ...base,
      command.command === "cancel_interaction"
        || "event-removal preview return must cancel the preview interaction",
      command.operands.control_id === command.operation
        || "event-removal preview return control is not exact",
      surface.stage === "preview" && surface.can_cancel_preview
        || "event-removal preview return is unavailable",
      selectedBindingsMatch()
        || "event-removal preview return must bind exact selected membership"
    ]);
  }
  if (command.operation === "confirm_event_deck_removal") {
    return collectErrors([
      ...base,
      command.command === "confirm_interaction"
        || "event-removal commit must confirm the interaction",
      command.operands.control_id === command.operation
        || "event-removal confirm control is not exact",
      surface.stage === "preview" && surface.can_confirm
        || "event-removal confirm is unavailable",
      selectedBindingsMatch()
        || "event-removal confirm must bind exact selected membership"
    ]);
  }
  return [`unsupported direct event-removal operation ${command.operation}`];
}

function validateCombatCommand(
  context: GatewayCombatContext,
  surface: GatewayCombatTurnSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  if (command.operation === "end_turn") {
    return collectErrors([
      command.command === "end_turn" || "end turn must use the native end_turn command",
      surface.can_end_turn || "end turn was published while unavailable",
      Object.keys(command.operands).length === 0
        || "end turn must not carry invented operands"
    ]);
  }
  if (command.operation === "play_card") {
    const option = surface.playable_cards.find(
      (value) => value.entity_id === command.operands.card_id
    );
    const card = context.player.hand.find(
      (value) => value.entity_id === command.operands.card_id
    );
    const target = command.operands.target_id
      ? context.enemies.find((value) => value.entity_id === command.operands.target_id)
      : undefined;
    return collectErrors([
      command.command === "play_card" || "card play must use play_card",
      Boolean(option) || "card play was not published by the current typed surface",
      Boolean(card) || "card play must bind one current hand card",
      Boolean(card && hasBinding(command, "card", card.entity_id))
        || "card play is missing its exact card binding",
      !command.operands.target_id || Boolean(target)
        || "card play target must be one current enemy",
      Boolean(option && (option.target_entity_ids.length === 0
        ? !command.operands.target_id
        : Boolean(command.operands.target_id
          && option.target_entity_ids.includes(command.operands.target_id))))
        || "card play target must match its exact published target domain",
      !target || hasBinding(command, "target", target.entity_id)
        || "card play target is missing its exact binding"
    ]);
  }
  if (command.operation === "use_potion") {
    const option = surface.usable_potions.find(
      (value) => value.entity_id === command.operands.potion_id
    );
    const potion = context.player.potion_states.find(
      (value) => value.entity_id === command.operands.potion_id
    );
    const validTargetIds = new Set([
      context.player.player_entity_id,
      ...context.enemies.map((enemy) => enemy.entity_id)
    ]);
    return collectErrors([
      command.command === "use_potion" || "potion use must use use_potion",
      Boolean(option) || "potion use was not published by the current typed surface",
      Boolean(potion) || "potion use must bind one current potion",
      Boolean(potion && hasBinding(command, "potion", potion.entity_id))
        || "potion use is missing its exact potion binding",
      !command.operands.target_id || validTargetIds.has(command.operands.target_id)
        || "potion target must be a current player or enemy",
      Boolean(option && (option.target_entity_ids.length === 0
        ? !command.operands.target_id
        : Boolean(command.operands.target_id
          && option.target_entity_ids.includes(command.operands.target_id))))
        || "potion target must match its exact published target domain",
      !command.operands.target_id || hasBinding(command, "target", command.operands.target_id)
        || "potion target is missing its exact binding"
    ]);
  }
  return [`unsupported direct combat operation ${command.operation}`];
}

function validateCombatHandCommand(
  surface: GatewayCombatHandSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.hand_id === surface.hand_entity_id
      || "combat-hand command must bind the current hand owner",
    hasBinding(command, "hand", surface.hand_entity_id)
      || "combat-hand command is missing its exact hand binding"
  ];
  if (command.operation === "select_combat_hand_card") {
    const cardId = command.operands.card_id;
    return collectErrors([
      ...base,
      command.command === "select_entity"
        || "combat-hand selection must use select_entity",
      Boolean(cardId && surface.selectable_card_entity_ids.includes(cardId))
        || "combat-hand selection must bind one currently selectable card",
      Boolean(cardId && hasBinding(command, "card", cardId))
        || "combat-hand selection is missing its exact card binding"
    ]);
  }
  if (command.operation === "deselect_combat_hand_card") {
    const cardId = command.operands.card_id;
    return collectErrors([
      ...base,
      command.command === "deselect_entity"
        || "combat-hand deselection must use deselect_entity",
      Boolean(cardId && surface.deselectable_card_entity_ids.includes(cardId))
        || "combat-hand deselection must bind one currently deselectable card",
      Boolean(cardId && hasBinding(command, "card", cardId))
        || "combat-hand deselection is missing its exact card binding"
    ]);
  }
  if (command.operation === "confirm_combat_hand_selection") {
    return collectErrors([
      ...base,
      command.command === "confirm_interaction"
        || "combat-hand confirmation must use confirm_interaction",
      surface.can_confirm || "combat-hand confirmation was published while unavailable",
      command.operands.control_id === command.operation
        || "combat-hand confirmation control is not exact"
    ]);
  }
  if (command.operation === "close_combat_hand_peek") {
    return collectErrors([
      ...base,
      command.command === "cancel_interaction"
        || "combat-hand peek close must use cancel_interaction",
      surface.can_close_peek || "combat-hand peek close was published while unavailable",
      command.operands.control_id === command.operation
        || "combat-hand peek control is not exact"
    ]);
  }
  return [`unsupported direct combat-hand operation ${command.operation}`];
}

function validateRewardCommand(
  surface: Extract<GatewayRewardSurface, { kind: "reward_claim" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "reward command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "reward command is missing its exact screen binding"
  ];
  if (command.operation === "claim_reward") {
    const reward = surface.rewards.find(
      (value) => value.entity_id === command.operands.choice_id
    );
    return collectErrors([
      ...base,
      command.command === "choose" || "reward claim must use choose",
      Boolean(reward?.enabled) || "reward claim must bind one current enabled reward",
      Boolean(reward && hasBinding(command, "reward", reward.entity_id))
        || "reward claim is missing its exact reward binding"
    ]);
  }
  if (command.operation === "discard_potion_for_reward") {
    const potion = surface.discardable_potions.find(
      (value) => value.entity_id === command.operands.potion_id
    );
    return collectErrors([
      ...base,
      command.command === "activate_control" || "reward potion discard must activate a control",
      command.operands.control_id === "discard_potion_for_reward"
        || "reward potion discard control is not exact",
      Boolean(potion) || "reward potion discard must bind one current discardable potion",
      Boolean(potion && hasBinding(command, "potion", potion.entity_id))
        || "reward potion discard is missing its exact potion binding"
    ]);
  }
  if (command.operation === "proceed_rewards") {
    return collectErrors([
      ...base,
      command.command === "activate_control" || "reward proceed must activate a control",
      command.operands.control_id === "proceed_rewards"
        || "reward proceed control is not exact",
      surface.can_proceed || "reward proceed was published while the control is unavailable"
    ]);
  }
  return [`unsupported direct reward operation ${command.operation}`];
}

function validateCardRewardCommand(
  surface: Extract<GatewayRewardSurface, { kind: "card_reward_selection" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "card reward command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "card reward command is missing its exact screen binding"
  ];
  if (command.operation === "select_card_reward") {
    const card = surface.cards.find((value) => value.entity_id === command.operands.card_id);
    const selectable = card && (surface.selectable_card_entity_ids === undefined
      || surface.selectable_card_entity_ids.includes(card.entity_id));
    return collectErrors([
      ...base,
      command.command === "select_entity" || "card reward selection must use select_entity",
      Boolean(selectable) || "card reward selection must bind one current selectable card",
      Boolean(card && hasBinding(command, "card", card.entity_id))
        || "card reward selection is missing its exact card binding"
    ]);
  }
  if (command.operation === "choose_card_reward_alternative") {
    const alternative = surface.alternatives.find(
      (value) => value.entity_id === command.operands.choice_id
    );
    return collectErrors([
      ...base,
      command.command === "choose" || "card reward alternative must use choose",
      Boolean(alternative?.enabled)
        || "card reward alternative must bind one current enabled alternative",
      Boolean(alternative && hasBinding(command, "alternative", alternative.entity_id))
        || "card reward alternative is missing its exact alternative binding"
    ]);
  }
  return [`unsupported direct card reward operation ${command.operation}`];
}

function validateSurfaceFacts(surface: DirectSurface): string[] {
  if (surface.kind === "deck_upgrade_selection") return [];
  if (surface.kind === "deck_transform_selection") return [];
  if (surface.kind === "wood_carvings_replacement_selection") return [];
  if (surface.kind === "combat_pile_card_selection") return [];
  if (surface.kind === "deck_removal_selection"
      || surface.kind === "relic_deck_removal_selection"
      || surface.kind === "reward_deck_removal_selection") return [];
  if (surface.kind === "event_deck_removal_selection") return [];
  if (surface.kind === "card_bundle_selection") return [];
  if (surface.kind === "rest_site") {
    const entityIds = new Set(surface.options.map((option) => option.entity_id));
    const indices = new Set(surface.options.map((option) => option.index));
    return collectErrors([
      entityIds.size === surface.options.length || "rest option entity ids must be unique",
      indices.size === surface.options.length
        && surface.options.every((option, index) => option.index === index)
        || "rest options must retain contiguous visible order"
    ]);
  }
  if (surface.kind === "shop_inventory") {
    const offers = [
      ...surface.cards,
      ...surface.relics,
      ...surface.potions,
      ...(surface.card_removal ? [surface.card_removal] : [])
    ];
    return collectErrors([
      new Set(offers.map((offer) => offer.entity_id)).size === offers.length
        || "shop offer entity ids must be unique",
      new Set(offers.map((offer) => offer.slot_entity_id)).size === offers.length
        || "shop slot entity ids must be unique",
      new Set(offers.map((offer) => offer.inventory_index)).size === offers.length
        || "shop inventory indices must be unique"
    ]);
  }
  return [];
}

function validateRestCommand(
  surface: Extract<GatewayRunRoomSurface, { kind: "rest_site" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "rest command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "rest command is missing its exact screen binding"
  ];
  if (command.operation === "choose_rest_option") {
    const option = surface.options.find(
      (value) => value.entity_id === command.operands.rest_option_id
    );
    return collectErrors([
      ...base,
      command.command === "choose" || "rest option must use choose",
      Boolean(option?.enabled) || "rest option must bind one current enabled option",
      Boolean(option && hasBinding(command, "rest_option", option.entity_id))
        || "rest option is missing its exact entity binding"
    ]);
  }
  if (command.operation === "proceed_rest_site") {
    return collectErrors([
      ...base,
      command.command === "activate_control" || "rest proceed must activate a control",
      command.operands.control_id === "proceed_rest_site"
        || "rest proceed control is not exact",
      surface.can_proceed || "rest proceed was published while unavailable"
    ]);
  }
  return [`unsupported direct rest operation ${command.operation}`];
}

function validateShopRoomCommand(
  surface: Extract<GatewayRunRoomSurface, { kind: "shop_room" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const available = command.operation === "open_shop_inventory"
    ? surface.can_open_inventory
    : command.operation === "proceed_shop"
      ? surface.can_proceed
      : false;
  return collectErrors([
    command.command === "activate_control" || "shop-room command must activate a control",
    command.operands.room_id === surface.room_entity_id
      || "shop-room command must bind the current room",
    command.operands.control_id === command.operation
      || "shop-room command must bind its exact semantic control",
    available || "shop-room command was published while its control is unavailable",
    hasBinding(command, "room", surface.room_entity_id)
      || "shop-room command is missing its exact room binding"
  ]);
}

function validateShopInventoryCommand(
  surface: Extract<GatewayRunRoomSurface, { kind: "shop_inventory" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.screen_id === surface.screen_entity_id
      || "shop command must bind the current screen",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "shop command is missing its exact screen binding"
  ];
  if (command.operation === "close_shop_inventory") {
    return collectErrors([
      ...base,
      command.command === "cancel_interaction" || "shop close must cancel the interaction",
      command.operands.control_id === "close_shop_inventory"
        || "shop close control is not exact",
      surface.can_close || "shop close was published while unavailable"
    ]);
  }
  if (command.operation === "open_shop_card_removal") {
    const offer = surface.card_removal;
    return collectErrors([
      ...base,
      command.command === "activate_control" || "shop removal must activate a control",
      command.operands.control_id === "open_shop_card_removal"
        || "shop removal control is not exact",
      Boolean(offer?.can_purchase
        && offer.entity_id === command.operands.shop_card_removal_id)
        || "shop removal must bind the current available removal offer",
      Boolean(offer && hasBinding(command, "shop_card_removal", offer.entity_id))
        || "shop removal is missing its exact offer binding"
    ]);
  }
  const categories = [
    { operation: "purchase_shop_card", offers: surface.cards },
    { operation: "purchase_shop_relic", offers: surface.relics },
    { operation: "purchase_shop_potion", offers: surface.potions }
  ] as const;
  const category = categories.find((value) => value.operation === command.operation);
  const offer = category?.offers.find(
    (value) => value.entity_id === command.operands.shop_offer_id
  );
  return collectErrors([
    ...base,
    Boolean(category) || `unsupported direct shop operation ${command.operation}`,
    command.command === "purchase" || "shop purchase must use purchase",
    Boolean(offer?.can_purchase) || "shop purchase must bind one current purchasable offer",
    Boolean(offer && hasBinding(command, "shop_offer", offer.entity_id))
      || "shop purchase is missing its exact offer binding"
  ]);
}

function validateTreasureCommand(
  surface: Extract<GatewayRunRoomSurface, { kind: "treasure_room" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.treasure_room_id === surface.room_entity_id
      || "treasure command must bind the current room",
    hasBinding(command, "treasure_room", surface.room_entity_id)
      || "treasure command is missing its exact room binding"
  ];
  if (command.operation === "choose_treasure_relic") {
    const relic = surface.relics.find(
      (value) => value.entity_id === command.operands.choice_id
    );
    return collectErrors([
      ...base,
      command.command === "choose" || "treasure relic selection must use choose",
      surface.stage === "relic_choice" && Boolean(relic)
        || "treasure relic selection requires the current visible relic choice",
      Boolean(relic && hasBinding(command, "relic", relic.entity_id))
        || "treasure relic selection is missing its exact relic binding"
    ]);
  }
  const expected = command.operation === "open_treasure_chest"
    ? surface.stage === "closed" && !surface.chest_opened
    : command.operation === "skip_treasure_relic"
      ? surface.stage === "relic_choice" && surface.can_skip
      : command.operation === "proceed_treasure_room"
        ? surface.stage === "completed" && surface.can_proceed
        : false;
  return collectErrors([
    ...base,
    command.command === "activate_control" || "treasure control must use activate_control",
    command.operands.control_id === command.operation
      || "treasure command must bind its exact semantic control",
    expected || "treasure command does not match the current stage"
  ]);
}

function validateEventCommand(
  surface: Extract<GatewayJourneySurface, { kind: "event_option" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const option = surface.options.find((value) => value.entity_id === command.operands.choice_id);
  const expectedOperation = option?.is_proceed ? "proceed_event" : "choose_event_option";
  return collectErrors([
    command.command === (option?.is_proceed ? "activate_control" : "choose")
      || "event command kind does not match the exact option semantics",
    command.operands.screen_id === surface.screen_entity_id
      || "event command must bind the current screen",
    Boolean(option?.is_enabled && !option.is_locked)
      || "event command must bind one current enabled option",
    command.operation === expectedOperation
      || "event command operation does not match the exact option semantics",
    (!option?.is_proceed || command.operands.control_id === "proceed_event")
      || "event proceed command must bind the exact proceed control",
    hasBinding(command, "screen", surface.screen_entity_id)
      || "event command is missing its exact screen binding",
    Boolean(option && hasBinding(command, "option", option.entity_id))
      || "event command is missing its exact option binding"
  ]);
}

function validateMapCommand(
  surface: Extract<GatewayJourneySurface, { kind: "map_navigation" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const base = [
    command.operands.map_screen_id === surface.screen_entity_id
      || "map command must bind the current screen",
    hasBinding(command, "map_screen", surface.screen_entity_id)
      || "map command is missing its exact screen binding"
  ];
  if (command.operation === "choose_map_node") {
    const node = surface.next_options.find(
      (value) => value.entity_id === command.operands.map_node_id
    );
    return collectErrors([
      ...base,
      command.command === "navigate" || "map node choice must use navigate",
      surface.travel_enabled && !surface.traveling
        || "map node choice was published while travel is unavailable",
      Boolean(node) || "map command must bind one current travelable node",
      Boolean(node && hasBinding(command, "map_node", node.entity_id))
        || "map command is missing its exact node binding"
    ]);
  }
  if (command.operation === "exit_map_annotation") {
    const inputId = command.operands.map_annotation_input_id;
    return collectErrors([
      ...base,
      command.command === "activate_control" || "map annotation exit must activate a control",
      command.operands.control_id === "exit_map_annotation"
        || "map annotation exit control is not exact",
      surface.can_exit_annotation
        || "map annotation exit was published while its control was unavailable",
      surface.drawing_mode !== "none" || "map annotation exit requires active drawing mode",
      inputId === surface.annotation_input_entity_id
        || "map annotation exit must bind the current input owner",
      Boolean(inputId && hasBinding(command, "map_annotation_input", inputId))
        || "map annotation exit is missing its exact input binding"
    ]);
  }
  return [`unsupported direct map operation ${command.operation}`];
}

function validateGameOverCommand(
  surface: Extract<GatewayJourneySurface, { kind: "game_over" }>,
  command: ConnectorV3ConsumerCommand
): string[] {
  const expected = command.operation === "advance_game_over_summary"
    ? surface.can_advance_summary && surface.stage === "intro"
    : command.operation === "return_game_over"
      ? surface.can_return && surface.stage === "summary"
      : false;
  return collectErrors([
    command.command === "activate_control" || "game-over command must activate a control",
    command.operands.game_over_screen_id === surface.screen_entity_id
      || "game-over command must bind the current screen",
    command.operands.control_id === command.operation
      || "game-over command must bind its exact semantic control",
    expected || "game-over command does not match the current stage",
    hasBinding(command, "game_over_screen", surface.screen_entity_id)
      || "game-over command is missing its exact screen binding"
  ]);
}

function validateMenuCommand(
  surface: GatewayMenuSurface,
  command: ConnectorV3ConsumerCommand
): string[] {
  const screenOperand = command.operands.menu_screen_id
    ?? command.operands.singleplayer_screen_id
    ?? command.operands.character_select_screen_id
    ?? command.operands.screen_id;
  const screenBinding = command.entityBindings.some(
    (binding) => binding.entityId === surface.screen_entity_id
      && binding.role.endsWith("screen")
  );
  return collectErrors([
    screenOperand === surface.screen_entity_id
      || "menu command must bind the current screen",
    screenBinding || "menu command is missing its exact screen binding"
  ]);
}

function hasBinding(
  command: ConnectorV3ConsumerCommand,
  role: string,
  entityId: string
): boolean {
  return command.entityBindings.some(
    (binding) => binding.role === role && binding.entityId === entityId
  );
}

function collectErrors(results: Array<true | string>): string[] {
  return results.flatMap((result) => result === true ? [] : [result]);
}

function projectCommands(commands: ConnectorV3ConsumerCommand[]): BridgeLegalActionSnapshot[] {
  return commands.map((command) => ({
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

function projectContext(
  context: DirectContext,
  surface?: DirectSurface,
  player?: NormalizedCurrentState["player"]
): SemanticContext {
  if (context.kind === "combat") return projectCombatContext(context);
  if (context.kind === "menu") {
    return {
      kind: "menu",
      screen: surface?.kind,
      message: surface?.kind === "main_menu"
        ? "Navigate the visible root menu."
        : "Choose a standard run setup action."
    };
  }
  if (context.kind === "event") {
    return {
      kind: "event",
      eventId: context.event_id,
      ...(context.name ? { name: context.name } : {}),
      ancient: context.ancient,
      inDialogue: context.in_dialogue,
      ...(context.body !== undefined ? { body: context.body } : {})
    };
  }
  if (context.kind === "map") return projectMapContext(context);
  if (context.kind === "reward_flow") {
    return { kind: "reward_flow", rewardKind: context.reward_kind };
  }
  if (context.kind === "rest") return { kind: "rest" };
  if (context.kind === "shop") {
    return {
      kind: "shop",
      ...(player?.gold !== undefined ? { gold: player.gold } : {}),
      ...(player?.maxPotionSlots !== undefined
        ? { maxPotionSlots: player.maxPotionSlots }
        : {}),
      ...(player ? {
        potions: player.potions.map((potion) => ({
          entityId: potion.entityId ?? potion.id,
          id: potion.id,
          ...(potion.name ? { name: potion.name } : {}),
          ...(potion.description ? { description: potion.description } : {}),
          slot: potion.slot ?? 0
        }))
      } : {})
    };
  }
  if (context.kind === "treasure") return { kind: "treasure" };
  return {
    kind: "run_ended",
    result: context.result,
    gameMode: context.game_mode,
    ...(context.score != null ? { score: context.score } : {}),
    ...(context.floor_reached != null ? { floorReached: context.floor_reached } : {}),
    ...(context.ascension != null ? { ascension: context.ascension } : {})
  };
}

function projectMapContext(context: GatewayMapContext): SemanticContext {
  const coordinate = (value: GatewayMapContext["visited"][number]) => ({
    col: value.col,
    row: value.row,
    type: value.point_type ?? "unknown",
    leadsTo: [],
    children: []
  });
  return {
    kind: "map",
    ...(context.current_position ? {
      currentPosition: {
        col: context.current_position.col,
        row: context.current_position.row,
        ...(context.current_position.point_type
          ? { type: context.current_position.point_type }
          : {})
      }
    } : {}),
    visited: context.visited.map(coordinate),
    nodes: context.nodes.map((node) => ({
      entityId: node.entity_id,
      col: node.col,
      row: node.row,
      type: node.point_type,
      state: node.state,
      leadsTo: node.children.map((child) => ({
        col: child.col,
        row: child.row,
        ...(child.point_type ? { type: child.point_type } : {})
      })),
      children: node.children.map((child) => ({ col: child.col, row: child.row }))
    }))
  };
}

function projectSurface(
  surface: DirectSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): NormalizedCurrentState["surface"] {
  if (surface.kind === "combat_turn") {
    return projectCombatSurface(surface, observation, legalActions);
  }
  if (surface.kind === "combat_hand_card_selection") {
    return projectCombatHandSurface(surface, observation, legalActions);
  }
  if (surface.kind === "combat_pile_card_selection") {
    return projectCombatPileSurface(surface, observation, legalActions);
  }
  if (surface.kind === "deck_enchant_selection") {
    return projectDeckEnchantSurface(surface, observation, legalActions);
  }
  if (surface.kind === "event_dialogue") {
    return projectEventDialogueSurface(surface, observation, legalActions);
  }
  if (surface.kind === "generated_card_choice") {
    return projectGeneratedChoiceSurface(surface, observation, legalActions);
  }
  if (surface.kind === "deck_upgrade_selection") {
    return projectDeckUpgradeSurface(surface, observation, legalActions);
  }
  if (surface.kind === "deck_transform_selection") {
    return projectDeckTransformSurface(surface, observation, legalActions);
  }
  if (surface.kind === "wood_carvings_replacement_selection") {
    return projectWoodCarvingsSurface(surface, observation, legalActions);
  }
  if (surface.kind === "deck_removal_selection"
      || surface.kind === "relic_deck_removal_selection"
      || surface.kind === "reward_deck_removal_selection") {
    return projectDeckRemovalSurface(surface, observation, legalActions);
  }
  if (surface.kind === "event_deck_removal_selection") {
    return projectEventRemovalSurface(surface, observation, legalActions);
  }
  if (surface.kind === "card_bundle_selection") {
    return projectCardBundleSurface(surface, observation, legalActions);
  }
  if (surface.kind === "event_option") {
    return projectEventSurface(surface, observation, legalActions);
  }
  if (surface.kind === "map_navigation") {
    return projectMapSurface(surface, observation, legalActions);
  }
  if (surface.kind === "reward_claim") {
    return projectRewardSurface(surface, observation, legalActions);
  }
  if (surface.kind === "card_reward_selection") {
    return projectCardRewardSurface(surface, observation, legalActions);
  }
  if (surface.kind === "rest_site") {
    return projectRestSurface(surface, observation, legalActions);
  }
  if (surface.kind === "shop_inventory") {
    return projectShopInventorySurface(surface, observation, legalActions);
  }
  if (surface.kind === "shop_room") {
    return projectShopRoomSurface(surface, observation, legalActions);
  }
  if (surface.kind === "treasure_room") {
    return projectTreasureSurface(surface, observation, legalActions);
  }
  if (surface.kind === "game_over") {
    return projectGameOverSurface(surface, observation, legalActions);
  }
  return projectMenuSurface(surface, observation, legalActions);
}

function projectDeckEnchantSurface(
  surface: GatewayDeckEnchantSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): DeckEnchantSelectionSurface {
  return {
    kind: "deck_enchant_selection",
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    source: {
      kind: surface.source.kind,
      definitionId: surface.source.definition_id,
      bindingEvidence: surface.source.binding_evidence
    },
    ...(surface.prompt ? { prompt: surface.prompt } : {}),
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    cancelable: surface.cancelable,
    enchantment: {
      definitionId: surface.enchantment.definition_id,
      ...(surface.enchantment.name ? { name: surface.enchantment.name } : {}),
      ...(surface.enchantment.description
        ? { description: surface.enchantment.description }
        : {}),
      amount: surface.enchantment.amount,
      ...(surface.enchantment.observation_source
        ? { observationSource: surface.enchantment.observation_source }
        : {})
    },
    cards: surface.cards.map(projectGatewayVisibleCard),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectEventDialogueSurface(
  surface: GatewayEventDialogueSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): EventDialogueSurface {
  return {
    kind: "event_dialogue",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    currentLineIndex: surface.current_line_index,
    revealedLines: surface.revealed_lines.map((line) => ({
      entityId: line.entity_id,
      index: line.index,
      text: line.text,
      speaker: line.speaker,
      isCurrent: line.is_current
    })),
    advanceLabel: surface.advance_label,
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectDeckUpgradeSurface(
  surface: GatewayDeckUpgradeSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): DeckUpgradeSelectionSurface {
  return {
    kind: "deck_upgrade_selection",
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    cancelable: surface.cancelable,
    cards: surface.cards.map(projectGatewayVisibleCard),
    previewCards: surface.preview_cards.map(projectGatewayVisibleCard),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectDeckTransformSurface(
  surface: GatewayDeckTransformSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): DeckTransformSelectionSurface {
  return {
    kind: "deck_transform_selection",
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    source: {
      kind: surface.source.kind,
      definitionId: surface.source.definition_id,
      bindingEvidence: surface.source.binding_evidence
    },
    prompt: surface.prompt,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    cancelable: surface.cancelable,
    upgradeToggleVisible: surface.upgrade_toggle_visible,
    showingUpgradePreviews: surface.showing_upgrade_previews,
    previewKind: surface.preview_kind,
    replacementKnown: false,
    cards: surface.cards.map(projectGatewayVisibleCard),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectWoodCarvingsSurface(
  surface: GatewayWoodCarvingsSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): WoodCarvingsReplacementSelectionSurface {
  return {
    kind: "wood_carvings_replacement_selection",
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    branch: surface.branch,
    replacementDefinitionId: surface.replacement_definition_id,
    ...(surface.replacement_name ? { replacementName: surface.replacement_name } : {}),
    ...(surface.replacement_description
      ? { replacementDescription: surface.replacement_description }
      : {}),
    minimumSelections: 1,
    maximumSelections: 1,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    cards: surface.cards.map(projectGatewayVisibleCard),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectCombatPileSurface(
  surface: GatewayCombatPileSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): CombatPileCardSelectionSurface {
  return {
    kind: "combat_pile_card_selection",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    purpose: surface.purpose,
    mutationKind: surface.mutation_kind,
    commitMode: surface.commit_mode,
    sourceKind: surface.source_kind,
    sourceEntityKind: surface.source_entity_kind,
    sourceEntityId: surface.source_entity_id,
    sourceDefinitionId: surface.source_definition_id,
    sourceCardEntityId: surface.source_card_entity_id ?? null,
    sourceCardDefinitionId: surface.source_card_definition_id ?? null,
    pileType: surface.pile_type,
    destinationPile: surface.destination_pile,
    destinationPosition: surface.destination_position,
    overflowDestination: surface.overflow_destination ?? null,
    replacementCardDefinitionId: surface.replacement_card_definition_id ?? null,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    requireManualConfirmation: surface.require_manual_confirmation,
    cancelable: false,
    cards: surface.cards.map(projectGatewayVisibleCard),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectDeckRemovalSurface(
  surface: GatewayDeckRemovalSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): DeckRemovalSelectionSurface | RelicDeckRemovalSelectionSurface
  | RewardDeckRemovalSelectionSurface {
  const projected = {
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    cancelable: surface.cancelable,
    cards: surface.cards.map(projectGatewayVisibleCard),
    legalActions,
    completeness: projectCompleteness(observation)
  };
  if (surface.kind === "relic_deck_removal_selection") {
    return { kind: "relic_deck_removal_selection", ...projected };
  }
  if (surface.kind === "reward_deck_removal_selection") {
    return { kind: "reward_deck_removal_selection", ...projected };
  }
  return { kind: "deck_removal_selection", ...projected };
}

function projectCardBundleSurface(
  surface: GatewayCardBundleSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): CardBundleSelectionSurface {
  return {
    kind: "card_bundle_selection",
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    ...(surface.prompt ? { prompt: surface.prompt } : {}),
    ...(surface.selected_bundle_entity_id
      ? { selectedBundleEntityId: surface.selected_bundle_entity_id }
      : {}),
    selectableBundleEntityIds: [...surface.selectable_bundle_entity_ids],
    canConfirm: surface.can_confirm,
    canCancelPreview: surface.can_cancel_preview,
    bundles: surface.bundles.map((bundle) => ({
      entityId: bundle.entity_id,
      cards: bundle.cards.map(projectGatewayVisibleCard)
    })),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectEventRemovalSurface(
  surface: GatewayEventDeckRemovalSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): EventDeckRemovalSelectionSurface {
  return {
    kind: "event_deck_removal_selection",
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    sourceKind: surface.source_kind,
    purpose: surface.purpose,
    prompt: surface.prompt,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    expectedEffects: [...surface.expected_effects],
    cards: surface.cards.map(projectGatewayVisibleCard),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectGeneratedChoiceSurface(
  surface: GatewayGeneratedChoiceSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): GeneratedCardChoiceSurface {
  const base = {
    kind: "generated_card_choice" as const,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    ...(surface.prompt ? { prompt: surface.prompt } : {}),
    canSkip: surface.can_skip,
    isPeeking: surface.is_peeking,
    cards: surface.cards.map(projectGatewayVisibleCard),
    legalActions,
    completeness: projectCompleteness(observation)
  };
  return {
    ...base,
    purpose: surface.purpose,
    sourceKind: surface.source_kind,
    destination: surface.destination,
    selectedCardCostPolicy: surface.selected_card_cost_policy,
    ...(surface.overflow_destination
      ? { overflowDestination: surface.overflow_destination }
      : {})
  };
}

function projectCombatSurface(
  surface: GatewayCombatTurnSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): CombatTurnSurface {
  return {
    kind: "combat_turn",
    bridgeStateId: observation.state_token,
    roomEntityId: surface.room_entity_id,
    canEndTurn: surface.can_end_turn,
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectCombatHandSurface(
  surface: GatewayCombatHandSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): CombatHandCardSelectionSurface {
  return {
    kind: "combat_hand_card_selection",
    bridgeStateId: observation.state_token,
    handEntityId: surface.hand_entity_id,
    prompt: surface.prompt,
    selectionMode: surface.selection_mode,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    requireManualConfirmation: surface.require_manual_confirmation,
    isPeeking: surface.is_peeking,
    cards: surface.cards.map(projectGatewayVisibleCard),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectRestSurface(
  surface: Extract<GatewayRunRoomSurface, { kind: "rest_site" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): RestSiteSurface {
  return {
    kind: "rest_site",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    options: surface.options.map((option) => ({
      entityId: option.entity_id,
      index: option.index,
      optionId: option.option_id,
      ...(option.name ? { name: option.name } : {}),
      ...(option.description ? { description: option.description } : {}),
      enabled: option.enabled
    })),
    canProceed: surface.can_proceed,
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectShopInventorySurface(
  surface: Extract<GatewayRunRoomSurface, { kind: "shop_inventory" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): ShopInventorySurface {
  type Offer = (typeof surface.cards)[number]
    | (typeof surface.relics)[number]
    | (typeof surface.potions)[number]
    | NonNullable<typeof surface.card_removal>;
  const base = (offer: Offer) => ({
    entityId: offer.entity_id,
    slotEntityId: offer.slot_entity_id,
    inventoryIndex: offer.inventory_index,
    price: offer.price,
    stocked: offer.stocked,
    visible: offer.visible,
    affordable: offer.affordable,
    canPurchase: offer.can_purchase,
    ...(offer.blocked_reason ? { blockedReason: offer.blocked_reason } : {})
  });
  return {
    kind: "shop_inventory",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    cards: surface.cards.map((offer) => ({
      ...base(offer),
      onSale: offer.on_sale,
      ...(offer.card ? { card: projectGatewayVisibleCard(offer.card) } : {})
    })),
    relics: surface.relics.map((offer) => ({
      ...base(offer),
      ...(offer.relic ? { relic: projectGatewayVisibleRelic(offer.relic) } : {})
    })),
    potions: surface.potions.map((offer) => ({
      ...base(offer),
      ...(offer.definition_id ? { id: offer.definition_id } : {}),
      ...(offer.name ? { name: offer.name } : {}),
      ...(offer.description ? { description: offer.description } : {}),
      ...(offer.rarity ? { rarity: offer.rarity } : {})
    })),
    ...(surface.card_removal ? {
      cardRemoval: {
        ...base(surface.card_removal),
        nextPriceIncrease: surface.card_removal.next_price_increase
      }
    } : {}),
    canClose: surface.can_close,
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectShopRoomSurface(
  surface: Extract<GatewayRunRoomSurface, { kind: "shop_room" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): ShopRoomSurface {
  return {
    kind: "shop_room",
    bridgeStateId: observation.state_token,
    roomEntityId: surface.room_entity_id,
    canOpenInventory: surface.can_open_inventory,
    canProceed: surface.can_proceed,
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectTreasureSurface(
  surface: Extract<GatewayRunRoomSurface, { kind: "treasure_room" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): TreasureRoomSurface {
  return {
    kind: "treasure_room",
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    roomEntityId: surface.room_entity_id,
    chestOpened: surface.chest_opened,
    relics: surface.relics.map((relic) => ({
      ...projectGatewayVisibleRelic(relic),
      rarity: String((relic as { rarity?: unknown }).rarity ?? "unknown")
    })),
    canSkip: surface.can_skip,
    canProceed: surface.can_proceed,
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectRewardSurface(
  surface: Extract<GatewayRewardSurface, { kind: "reward_claim" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): BridgeRewardClaimSurface {
  return {
    kind: "reward_claim",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    rewards: surface.rewards.map((reward) => ({
      entityId: reward.entity_id,
      kind: reward.kind,
      label: reward.label,
      ...(reward.description ? { description: reward.description } : {}),
      enabled: reward.enabled
    })),
    potionSlotsFull: surface.potion_slots_full,
    discardablePotions: surface.discardable_potions.map((potion) => ({
      entityId: potion.entity_id,
      id: potion.definition_id,
      ...(potion.name ? { name: potion.name } : {}),
      ...(potion.description ? { description: potion.description } : {}),
      slot: potion.slot
    })),
    canProceed: surface.can_proceed,
    proceedSkipsRemainingRewards: surface.proceed_skips_remaining_rewards,
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectCardRewardSurface(
  surface: Extract<GatewayRewardSurface, { kind: "card_reward_selection" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): CardRewardSelectionSurface {
  return {
    kind: "card_reward_selection",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    cards: surface.cards.map(projectGatewayVisibleCard),
    alternatives: surface.alternatives.map((alternative) => ({
      entityId: alternative.entity_id,
      index: alternative.index,
      label: alternative.label,
      enabled: alternative.enabled
    })),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectEventSurface(
  surface: Extract<GatewayJourneySurface, { kind: "event_option" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): EventOptionSurface {
  return {
    kind: "event_option",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    options: surface.options.map((option) => ({
      entityId: option.entity_id,
      index: option.index,
      title: option.title ?? option.description ?? `Event option ${option.index}`,
      ...(option.description ? { description: option.description } : {}),
      enabled: option.is_enabled && !option.is_locked,
      proceed: option.is_proceed,
      chosen: option.was_chosen,
      willKillPlayer: option.will_kill_player,
      tooltips: option.tooltips.map((tooltip) => tooltip.kind === "card"
        ? { kind: "card" as const, card: projectGatewayVisibleCard(tooltip.card) }
        : {
            kind: "text" as const,
            ...(tooltip.name ? { name: tooltip.name } : {}),
            ...(tooltip.description ? { description: tooltip.description } : {})
          }),
      ...(option.relic_name ? { relicName: option.relic_name } : {}),
      ...(option.relic_description ? { relicDescription: option.relic_description } : {})
    })),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectMapSurface(
  surface: Extract<GatewayJourneySurface, { kind: "map_navigation" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): MapNavigationSurface {
  const context = gatewayMapContextSchema.parse(observation.context);
  return {
    kind: "map_navigation",
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    travelEnabled: surface.travel_enabled,
    traveling: surface.traveling,
    drawingMode: surface.drawing_mode,
    nextOptions: surface.next_options.map((option) => {
      const node = context.nodes.find((value) => value.entity_id === option.entity_id);
      return {
        entityId: option.entity_id,
        col: option.col,
        row: option.row,
        type: option.point_type,
        state: "travelable",
        leadsTo: (node?.children ?? []).map((child) => ({
          col: child.col,
          row: child.row,
          ...(child.point_type ? { type: child.point_type } : {})
        })),
        children: (node?.children ?? []).map((child) => ({ col: child.col, row: child.row }))
      };
    }),
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectGameOverSurface(
  surface: Extract<GatewayJourneySurface, { kind: "game_over" }>,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): GameOverSurface {
  return {
    kind: "game_over",
    stage: surface.stage,
    bridgeStateId: observation.state_token,
    screenEntityId: surface.screen_entity_id,
    ...(surface.return_destination ? { returnDestination: surface.return_destination } : {}),
    canAdvanceSummary: surface.can_advance_summary,
    canReturn: surface.can_return,
    legalActions,
    completeness: projectCompleteness(observation)
  };
}

function projectMenuSurface(
  surface: GatewayMenuSurface,
  observation: ConnectorV3Observation,
  legalActions: BridgeLegalActionSnapshot[]
): MainMenuSurface | SingleplayerMenuSurface | CharacterSelectSurface {
  const completeness = projectCompleteness(observation);
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
      random: character.is_random,
      enabled: character.is_enabled
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

function projectCompleteness(observation: ConnectorV3Observation) {
  return {
    playerVisibleSemantics: observation.completeness.player_visible_semantics,
    legalActions: observation.completeness.legal_actions,
    sources: [...observation.completeness.sources],
    missing: [...observation.completeness.missing]
  };
}

function invalidContext(rawState: Sts2McpRawState): NormalizedCurrentState["context"] {
  return {
    kind: "unknown",
    reason: "Connector V3 direct context could not be decoded",
    observedTopLevelKeys: Object.keys(rawState).sort()
  };
}

function safeMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500);
}
