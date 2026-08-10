import {
  NORMALIZED_STATE_SCHEMA_VERSION,
  type NormalizedCurrentState,
  type SemanticContext,
  type StateEnvelope
} from "../domain/state/index.js";
import type { AdapterDescriptor } from "../game-io/adapter.js";
import {
  gatewayCombatContextSchema,
  type GatewayCombatContext
} from "../integrations/sts2mcp/gatewayCombatProtocol.js";
import { decodeHumanObservation } from "../integrations/sts2mcp/humanEquivalentProtocol.js";
import type { Sts2McpRawState } from "../integrations/sts2mcp/rawState.js";
import { sharedVisibleStateSchema } from "../integrations/sts2mcp/gatewayVisibleStateProtocol.js";
import { isJsonObject, type JsonObject } from "../shared/json.js";
import { stateHash } from "../runtime/stateHash.js";
import { DiagnosticsBuilder } from "./diagnostics.js";
import {
  projectGatewayCombatContext,
  projectGatewayCombatPlayer
} from "./gatewayCombatProjection.js";
import { projectGatewayVisibleState } from "./gatewayVisibleStateProjection.js";

export function normalizeHumanEquivalentCurrentState(
  rawState: Sts2McpRawState,
  source: AdapterDescriptor,
  capturedAt: string
): StateEnvelope {
  const diagnostics = new DiagnosticsBuilder();
  let decoded;
  try {
    decoded = decodeHumanObservation(rawState.human_snapshot).data;
  } catch (error) {
    diagnostics.invalid("human_snapshot", rawState.human_snapshot, safeMessage(error));
  }
  const observation = decoded;
  const content = observation?.interaction.content;
  let persistent;
  if (observation?.persistent) {
    const parsed = sharedVisibleStateSchema.safeParse(observation.persistent.content);
    if (parsed.success) persistent = projectGatewayVisibleState(parsed.data);
    else diagnostics.invalid("human_snapshot.persistent.content", observation.persistent.content, parsed.error.message);
  }
  let combatContext: GatewayCombatContext | undefined;
  const rawContext = isJsonObject(content) ? content.context : undefined;
  if (isJsonObject(rawContext) && rawContext.kind === "combat") {
    const parsed = gatewayCombatContextSchema.safeParse(rawContext);
    if (parsed.success) combatContext = parsed.data;
    else diagnostics.invalid("human_snapshot.interaction.content.context", rawContext, parsed.error.message);
  }
  const built = diagnostics.build();
  const actionable = observation?.status === "actionable"
    && observation.affordances.length > 0
    && built.status !== "invalid";
  const affordances = observation?.affordances.map((affordance) => ({
    affordanceId: affordance.affordance_id,
    snapshotId: observation.snapshot_id,
    action: affordance.action,
    label: affordance.label,
    ...(affordance.subject_ref ? { subjectRef: affordance.subject_ref } : {}),
    arguments: affordance.arguments.map((argument) => ({
      role: argument.role,
      referentId: argument.referent_id
    }))
  })) ?? [];
  const currentState: NormalizedCurrentState = {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType: observation
      ? `human_equivalent:${observation.interaction.kind}`
      : "human_equivalent:invalid",
    stability: built.status === "invalid"
      ? "invalid"
      : observation?.status === "settling"
        ? "settling"
        : actionable ? "actionable" : "non_actionable",
    actionAuthority: actionable ? "current_human_ui" : "none",
    ...(persistent?.run ? { run: persistent.run } : {}),
    ...(persistent?.player ? {
      player: combatContext
        ? projectGatewayCombatPlayer(combatContext, persistent.player)
        : persistent.player
    } : {}),
    context: observation
      ? combatContext
        ? projectGatewayCombatContext(combatContext)
        : contextFor(observation.interaction.kind, content)
      : invalidContext(rawState),
    surface: observation && built.status !== "invalid"
      ? {
          kind: "human_ui",
          uiKind: observation.interaction.kind,
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
            actionable: referent.state.actionable,
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
            orderingSemantics: read.ordering_semantics,
            hiddenByPolicy: [...read.hidden_by_policy]
          })),
          affordances
        }
      : {
          kind: "unsupported",
          reason: "Human-Equivalent snapshot failed strict decoding",
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
      affordances: observation?.affordances.map((item) => item.affordance_id) ?? []
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
  return { kind: "unknown", reason: `Current human UI is ${surfaceKind}`, observedTopLevelKeys: [] };
}

function asJsonObject(value: unknown): JsonObject {
  return isJsonObject(value) ? value : {};
}
function invalidContext(raw: JsonObject): SemanticContext {
  return { kind: "unknown", reason: "Human-Equivalent snapshot was invalid", observedTopLevelKeys: Object.keys(raw).sort() };
}
function safeMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
