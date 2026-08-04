import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import type { AdapterDescriptor } from "../src/game-io/adapter.js";
import { decodeHumanObservation } from "../src/integrations/sts2mcp/humanEquivalentProtocol.js";
import { wrapHumanEquivalentState } from "../src/integrations/sts2mcp/rawState.js";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";
import type { JsonObject } from "../src/shared/json.js";

const SOURCE: AdapterDescriptor = {
  adapterId: "sts2-human-equivalent",
  endpoint: "http://fixture.invalid",
  capabilities: {
    canReadState: true,
    canExecuteActions: true,
    canListLegalActions: true,
    actionResults: "partial",
    legalActionAuthority: "bridge_advertised",
    protocols: ["human_equivalent"]
  }
};

function snapshot(mode: "he_assisted" | "he_pure" = "he_pure"): JsonObject {
  return {
    protocol_version: "1.0-preview.1",
    schema: "sts2.connector.human-ui/observation-1",
    mode,
    state_token: "state-he-1",
    sequence: 1,
    observed_at: "2026-08-04T00:00:00Z",
    status: "actionable",
    frame: { frame_id: "frame-he-1", width: 1920, height: 1080, provenance: "native_structured_ui" },
    owner: { owner_id: "screen-current", kind: "generated_card_choice" },
    persistent_state: null,
    surface: {
      kind: "generated_card_choice",
      stage: "ready",
      prompt: "Choose a card",
      facts: {
        surface: { kind: "generated_card_choice", cards: [{ entity_id: "card-1", name: "Visible card" }] },
        context: { kind: "event", name: "Unknown new event" }
      }
    },
    entities: [{ entity_id: "card-1", kind: "card", label: "Visible card", visible: true, enabled: true, selected: false, detail: {} }],
    controls: [{ control_id: "card-1", owner_id: "screen-current", role: "select", label: "Choose Visible card", visible: true, enabled: true, selected: false, focused: false, actions: ["select"] }],
    affordances: [{
      affordance_id: "affordance-card-1",
      action: "select",
      target_id: "card-1",
      owner_id: "screen-current",
      label: "Choose Visible card",
      parameters: { screen_id: "screen-current", card_id: "card-1" },
      parameter_domains: {},
      entity_bindings: [{ role: "screen", entity_id: "screen-current" }, { role: "card", entity_id: "card-1" }],
      provenance: "native_ui_adapter"
    }],
    optional_annotations: mode === "he_assisted"
      ? { scene_hint: "unclassified", purpose_hint: "choose", phase_hint: "ready", expected_transition: null, teacher_generated: false, authorization_effect: "none" }
      : null,
    completeness: { player_visible_semantics: "complete_current_structured_ui", legal_actions: "derived_from_current_visible_enabled_controls", sources: ["native UI"], missing: [] },
    bridge: { id: "sts2_human_equivalent_connector", name: "STS2 Human-Equivalent Connector", version: "fixture", upstream_commit: "fixture", module_version_id: "fixture-mvid", assembly_file_sha256: "a".repeat(64), runtime_instance_id: "fixture-runtime" },
    game: { version: "v0.109.1", commit: "fixture", main_assembly_hash: 1, compatibility: { state_observation_allowed: true }, modset: { status: "exact_bridge_only", fingerprint: "fixture-modset" } },
    observation_policy: { includes_hidden_information: false },
    visibility: { profile_id: "player_visible", core_status: "complete", player_visible_closure_status: "complete", available_inspections: [], linked_detail_kinds: [], hidden_by_policy: [], missing: [], unknown_critical_field_behavior: "fail_closed" },
    inspection_catalog: [], linked_detail_catalog: [], diagnostics: [], warnings: [], coverage: {}
  };
}

describe("Human-Equivalent C", () => {
  it("accepts an unknown business source when current native UI is exact and operable", () => {
    const decoded = decodeHumanObservation(snapshot()).data;
    expect(decoded.affordances).toHaveLength(1);
    expect(decoded.surface.facts).not.toHaveProperty("source_kind");
  });

  it("enforces that he_pure has no D annotation envelope", () => {
    expect(() => decodeHumanObservation({ ...snapshot(), optional_annotations: { scene_hint: "event", purpose_hint: null, phase_hint: "ready", expected_transition: null, teacher_generated: false, authorization_effect: "none" } }))
      .toThrow("he_pure must not contain D annotations");
  });

  it("projects current UI affordances to opaque Re choices without V2 legal_actions wire data", () => {
    const raw = wrapHumanEquivalentState({ snapshot: snapshot() });
    const normalized = normalizeCurrentState(raw, SOURCE, "2026-08-04T00:00:00Z");
    expect(normalized.currentState.surface.kind).toBe("human_ui");
    const actions = buildAllowedActions(normalized.currentState, normalized.stateHash);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.action).toEqual({
      kind: "human_ui_action",
      choiceId: "affordance-card-1",
      expectedStateToken: "state-he-1",
      affordanceId: "affordance-card-1"
    });
  });
});
