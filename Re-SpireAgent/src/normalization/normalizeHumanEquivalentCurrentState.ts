import {
  NORMALIZED_STATE_SCHEMA_VERSION,
  type NormalizedCurrentState,
  type SemanticContext,
  type StateEnvelope
} from "../domain/state/index.js";
import type { AdapterDescriptor } from "../game-io/adapter.js";
import { decodeHumanObservation } from "../integrations/sts2mcp/humanEquivalentProtocol.js";
import type { Sts2McpRawState } from "../integrations/sts2mcp/rawState.js";
import { sharedVisibleStateSchema } from "../integrations/sts2mcp/gatewayVisibleStateProtocol.js";
import { isJsonObject, type JsonObject } from "../shared/json.js";
import { stateHash } from "../runtime/stateHash.js";
import { DiagnosticsBuilder } from "./diagnostics.js";
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
  let persistent;
  if (observation?.persistent) {
    const parsed = sharedVisibleStateSchema.safeParse(observation.persistent.content);
    if (parsed.success) persistent = projectGatewayVisibleState(parsed.data);
    else diagnostics.invalid("human_snapshot.persistent.content", observation.persistent.content, parsed.error.message);
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
    targetElementId: affordance.target_element_id
  })) ?? [];
  const content = observation?.surface.content;
  const currentState: NormalizedCurrentState = {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType: observation
      ? `human_equivalent:${observation.surface.kind}`
      : "human_equivalent:invalid",
    stability: built.status === "invalid"
      ? "invalid"
      : observation?.status === "settling"
        ? "settling"
        : actionable ? "actionable" : "non_actionable",
    actionAuthority: actionable ? "current_human_ui" : "none",
    ...(persistent?.run ? { run: persistent.run } : {}),
    ...(persistent?.player ? { player: persistent.player } : {}),
    context: observation ? contextFor(observation.surface.kind, content) : invalidContext(rawState),
    surface: observation && built.status !== "invalid"
      ? {
          kind: "human_ui",
          uiKind: observation.surface.kind,
          stage: observation.surface.stage,
          ...(observation.surface.prompt ? { prompt: observation.surface.prompt } : {}),
          ownerId: observation.owner.owner_id,
          contentSchema: observation.surface.content_schema,
          content: asJsonObject(content),
          elements: observation.elements.map((element) => ({
            elementId: element.element_id,
            role: element.role,
            category: element.category,
            ...(element.label ? { label: element.label } : {}),
            visible: element.state.visible,
            enabled: element.state.enabled,
            ...(element.state.selected !== null ? { selected: element.state.selected } : {}),
            ...(element.state.focused !== null ? { focused: element.state.focused } : {}),
            observationBasis: element.state.observation_basis,
            actions: [...element.actions],
            ...(element.properties_schema ? { propertiesSchema: element.properties_schema } : {}),
            ...(element.properties !== undefined ? { properties: element.properties } : {})
          })),
          reads: observation.reads.map((read) => ({
            readId: read.read_id,
            kind: read.kind,
            ...(read.target_element_id ? { targetElementId: read.target_element_id } : {}),
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
      ownerId: observation?.owner.owner_id ?? null,
      affordances: observation?.affordances.map((item) => item.affordance_id) ?? []
    }),
    normalizedStateHash: stateHash(currentState)
  };
}

function contextFor(surfaceKind: string, facts: unknown): SemanticContext {
  const context = isJsonObject(facts) && isJsonObject(facts.context) ? facts.context : undefined;
  const contextKind = typeof context?.kind === "string" ? context.kind : undefined;
  if (surfaceKind.startsWith("combat_")) {
    return { kind: "combat", encounterType: "unknown", turnOwner: "unknown", isPlayPhase: true, enemies: [] };
  }
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
