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
  if (observation?.persistent_state) {
    const parsed = sharedVisibleStateSchema.safeParse(observation.persistent_state);
    if (parsed.success) persistent = projectGatewayVisibleState(parsed.data);
    else diagnostics.invalid("human_snapshot.persistent_state", observation.persistent_state, parsed.error.message);
  }
  const built = diagnostics.build();
  const actionable = observation?.status === "actionable"
    && observation.affordances.length > 0
    && built.status !== "invalid";
  const legalActions = observation?.affordances.map((affordance) => ({
    actionId: affordance.affordance_id,
    stateId: observation.state_token,
    kind: affordance.affordance_id,
    label: affordance.label,
    authority: "current_human_ui",
    evidenceCode: `human_ui:${affordance.action}`,
    entityBindings: affordance.entity_bindings.map((binding) => ({
      role: binding.role,
      entityId: binding.entity_id
    })),
    category: affordance.action
  })) ?? [];
  const facts = observation?.surface.facts;
  const currentState: NormalizedCurrentState = {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType: observation
      ? `human_equivalent:${observation.mode}:${observation.surface.kind}`
      : "human_equivalent:invalid",
    stability: built.status === "invalid"
      ? "invalid"
      : observation?.status === "settling"
        ? "settling"
        : actionable ? "actionable" : "non_actionable",
    actionAuthority: actionable ? "bridge_advertised" : "none",
    ...(persistent?.run ? { run: persistent.run } : {}),
    ...(persistent?.player ? { player: persistent.player } : {}),
    bridgeLegacyWarnings: observation
      ? [
          ...observation.warnings,
          "Human-Equivalent C exposes UI facts and delivery affordances; A owns flow interpretation."
        ]
      : [],
    context: observation ? contextFor(observation.surface.kind, facts) : invalidContext(rawState),
    surface: observation && built.status !== "invalid"
      ? {
          kind: "human_ui",
          uiKind: observation.surface.kind,
          stage: observation.surface.stage,
          ...(observation.surface.prompt ? { prompt: observation.surface.prompt } : {}),
          ownerId: observation.owner.owner_id,
          facts: asJsonObject(facts),
          entities: observation.entities.map((entity) => ({
            entityId: entity.entity_id,
            kind: entity.kind,
            ...(entity.label ? { label: entity.label } : {}),
            visible: entity.visible,
            enabled: entity.enabled,
            selected: entity.selected,
            ...(entity.detail !== undefined ? { detail: entity.detail } : {})
          })),
          controls: observation.controls.map((control) => ({
            controlId: control.control_id,
            ownerId: control.owner_id,
            role: control.role,
            ...(control.label ? { label: control.label } : {}),
            visible: control.visible,
            enabled: control.enabled,
            selected: control.selected,
            focused: control.focused,
            actions: [...control.actions]
          })),
          legalActions,
          ...(observation.optional_annotations ? {
            annotations: {
              ...(observation.optional_annotations.scene_hint ? { sceneHint: observation.optional_annotations.scene_hint } : {}),
              ...(observation.optional_annotations.purpose_hint ? { purposeHint: observation.optional_annotations.purpose_hint } : {}),
              ...(observation.optional_annotations.phase_hint ? { phaseHint: observation.optional_annotations.phase_hint } : {}),
              ...(observation.optional_annotations.expected_transition ? { expectedTransition: observation.optional_annotations.expected_transition } : {}),
              authorizationEffect: "none" as const
            }
          } : {})
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
      stateToken: observation?.state_token ?? null,
      frameId: observation?.frame.frame_id ?? null,
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
