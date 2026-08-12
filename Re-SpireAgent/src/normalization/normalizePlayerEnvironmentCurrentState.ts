import {
  NORMALIZED_STATE_SCHEMA_VERSION,
  type NormalizedCurrentState,
  type SemanticContext,
  type StateEnvelope
} from "../domain/state/index.js";
import type { AdapterDescriptor } from "../game-io/adapter.js";
import {
  playerCombatContextSchema,
  type PlayerCombatContext
} from "../integrations/sts2mcp/playerCombatPresentation.js";
import { decodePlayerSnapshot } from "../integrations/sts2mcp/playerEnvironmentProtocol.js";
import {
  isPlayerEnvironmentWrappedState,
  type PlayerEnvironmentRawState
} from "../integrations/sts2mcp/rawState.js";
import { persistentVisibleStateSchema } from "../integrations/sts2mcp/playerVisibleStateProtocol.js";
import { isJsonObject, type JsonObject } from "../shared/json.js";
import { stateHash } from "../runtime/stateHash.js";
import { DiagnosticsBuilder } from "./diagnostics.js";
import {
  projectPlayerCombatContext,
  projectPlayerCombatState
} from "./projectPlayerCombat.js";
import { projectPlayerVisibleState } from "./projectPlayerVisibleState.js";

export function normalizePlayerEnvironmentCurrentState(
  rawInput: unknown,
  source: AdapterDescriptor,
  capturedAt = new Date().toISOString()
): StateEnvelope {
  const diagnostics = new DiagnosticsBuilder();
  const rawState: PlayerEnvironmentRawState = isJsonObject(rawInput) ? rawInput : {};
  const wrapped = isPlayerEnvironmentWrappedState(rawInput);
  if (!wrapped) {
    diagnostics.invalid(
      "$",
      rawInput,
      "Current Re production input must be a Player Environment wrapper"
    );
  }
  let decoded;
  try {
    if (!wrapped) throw new Error("Player Environment wrapper is missing");
    decoded = decodePlayerSnapshot(rawState.player_snapshot).data;
  } catch (error) {
    diagnostics.invalid("player_snapshot", rawState.player_snapshot, safeMessage(error));
  }
  const observation = decoded;
  const content = observation?.interaction.content;
  let persistent;
  if (observation?.persistent) {
    const parsed = persistentVisibleStateSchema.safeParse(observation.persistent.content);
    if (parsed.success) persistent = projectPlayerVisibleState(parsed.data);
    else diagnostics.invalid("player_snapshot.persistent.content", observation.persistent.content, parsed.error.message);
  }
  let combatContext: PlayerCombatContext | undefined;
  const rawContext = isJsonObject(content) ? content.context : undefined;
  if (isJsonObject(rawContext) && rawContext.kind === "combat") {
    const parsed = playerCombatContextSchema.safeParse(rawContext);
    if (parsed.success) combatContext = parsed.data;
    else diagnostics.invalid("player_snapshot.interaction.content.context", rawContext, parsed.error.message);
  }
  const built = diagnostics.build();
  const actionable = observation?.status === "interactive"
    && observation.bound_actions.status === "complete"
    && observation.bound_actions.actions.length > 0
    && built.status !== "invalid";
  const boundActions = observation?.bound_actions.actions.map((boundAction) => ({
    boundActionId: boundAction.bound_action_id,
    snapshotId: observation.snapshot_id,
    verb: boundAction.verb,
    label: boundAction.label,
    ...(boundAction.subject_referent_id ? { subjectReferentId: boundAction.subject_referent_id } : {}),
    arguments: boundAction.arguments.map((argument) => ({
      role: argument.role,
      referentId: argument.referent_id
    }))
  })) ?? [];
  const currentState: NormalizedCurrentState = {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType: observation
      ? `player_environment:${observation.interaction.kind}`
      : "player_environment:invalid",
    stability: built.status === "invalid"
      ? "invalid"
      : observation?.status === "settling"
        ? "settling"
        : actionable ? "actionable" : "non_actionable",
    actionAuthority: actionable ? "player_environment" : "none",
    ...(persistent?.run ? { run: persistent.run } : {}),
    ...(persistent?.player ? {
      player: combatContext
        ? projectPlayerCombatState(combatContext, persistent.player)
        : persistent.player
    } : {}),
    context: observation
      ? combatContext
        ? projectPlayerCombatContext(combatContext)
        : contextFor(observation.interaction.kind, content)
      : invalidContext(rawState),
    surface: observation && built.status !== "invalid"
        ? {
          kind: "player_environment",
          snapshotId: observation.snapshot_id,
          interactionKind: observation.interaction.kind,
          stage: observation.interaction.stage,
          ...(observation.interaction.prompt ? { prompt: observation.interaction.prompt } : {}),
          interactionId: observation.interaction.interaction_id,
          contentSchema: observation.interaction.content_schema,
          content: asJsonObject(content),
          referents: observation.referents.map((referent) => ({
            referentId: referent.referent_id,
            role: referent.role,
            kind: referent.kind,
            ...(referent.label ? { label: referent.label } : {}),
            visible: referent.state.visible,
            ...(typeof referent.state.enabled === "boolean" ? { enabled: referent.state.enabled } : {}),
            ...(referent.state.selected !== null ? { selected: referent.state.selected } : {}),
            ...(referent.state.focused !== null ? { focused: referent.state.focused } : {}),
            observationBasis: referent.state.observation_basis,
            ...(referent.properties_schema ? { propertiesSchema: referent.properties_schema } : {}),
            ...(referent.properties !== undefined ? { properties: referent.properties } : {})
          })),
          reads: observation.reads.map((read) => ({
            readId: read.read_id,
            kind: read.kind,
            ...(read.target_referent_id ? { targetReferentId: read.target_referent_id } : {}),
            contentSchema: read.content_schema,
            visibilityBasis: read.visibility_basis,
            snapshotBound: true,
            orderingSemantics: read.ordering_semantics,
            hiddenByPolicy: [...read.hidden_by_policy]
          })),
          capabilities: observation.interaction.capabilities.map((capability) => ({
            verb: capability.verb,
            ...(capability.subject_role ? { subjectRole: capability.subject_role } : {}),
            arguments: capability.arguments.map((argument) => ({ ...argument })),
            availabilityBasis: capability.availability_basis
          })),
          boundActionProjection: {
            status: observation.bound_actions.status,
            totalCount: observation.bound_actions.total_count,
            limit: observation.bound_actions.limit,
            orderingSemantics: observation.bound_actions.ordering_semantics
          },
          boundActions,
          completeness: {
            status: observation.completeness.status,
            visibleInformation: observation.completeness.visible_information,
            interactionDiscovery: observation.completeness.interaction_discovery,
            missing: [...observation.completeness.missing],
            hiddenByPolicy: [...observation.completeness.hidden_by_policy]
          }
        }
      : {
          kind: "unsupported",
          reason: "Player Environment snapshot failed strict decoding",
          classification: "malformed_known_state",
          observedTopLevelKeys: Object.keys(rawState).sort()
        }
  };
  return {
    envelopeSchemaVersion: 2,
    capturedAt,
    source,
    rawState,
    currentState,
    diagnostics: built,
    stateHash: stateHash({
      snapshotId: observation?.snapshot_id ?? null,
      interactionId: observation?.interaction.interaction_id ?? null,
      boundActions: observation?.bound_actions.actions.map((item) => item.bound_action_id) ?? []
    }),
    normalizedStateHash: stateHash(currentState)
  };
}

function contextFor(surfaceKind: string, facts: unknown): SemanticContext {
  const context = isJsonObject(facts) && isJsonObject(facts.context) ? facts.context : undefined;
  const contextKind = typeof context?.kind === "string" ? context.kind : undefined;
  if (contextKind === "combat" || surfaceKind.startsWith("combat_"))
    return { kind: "combat", encounterType: "unknown", turnOwner: "unknown", isPlayPhase: false, enemies: [] };
  if (surfaceKind === "map_navigation") return { kind: "map", visited: [], nodes: [] };
  if (surfaceKind.includes("reward")) return { kind: "reward_flow", rewardKind: surfaceKind === "card_reward_selection" ? "card_reward" : "room_rewards" };
  if (surfaceKind.includes("shop")) return { kind: "shop" };
  if (surfaceKind.includes("rest")) return { kind: "rest" };
  if (surfaceKind.includes("treasure")) return { kind: "treasure" };
  if (surfaceKind === "game_over") return { kind: "run_ended", message: "Game over" };
  if (surfaceKind.includes("menu") || surfaceKind === "character_select") return { kind: "menu", screen: surfaceKind };
  if (contextKind === "event" || surfaceKind.includes("event")) {
    return {
      kind: "event",
      ...(typeof context?.event_id === "string" ? { eventId: context.event_id } : {}),
      ...(typeof context?.name === "string" ? { name: context.name } : {}),
      ...(typeof context?.body === "string" ? { body: context.body } : {})
    };
  }
  return { kind: "unknown", reason: `Current player interaction is ${surfaceKind}`, observedTopLevelKeys: [] };
}

function asJsonObject(value: unknown): JsonObject {
  return isJsonObject(value) ? value : {};
}
function invalidContext(raw: JsonObject): SemanticContext {
  return { kind: "unknown", reason: "Player Environment snapshot was invalid", observedTopLevelKeys: Object.keys(raw).sort() };
}
function safeMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
