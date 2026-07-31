import { describe, expect, it } from "vitest";
import { projectConnectorV3ForRe } from "../src/integrations/sts2mcp/connectorV3Projection.js";
import {
  decodeConnectorV3Observation,
  decodeConnectorV3Receipt,
  type ConnectorV3Observation
} from "../src/integrations/sts2mcp/connectorV3Protocol.js";
import type { JsonObject } from "../src/shared/json.js";

const BRIDGE = {
  id: "sts2_connector_v3",
  name: "STS2 Semantic Gateway",
  version: "0.6.0-dev",
  upstream_commit: "fixture",
  module_version_id: "fixture-mvid",
  assembly_file_sha256: "a".repeat(64),
  runtime_instance_id: "fixture-runtime"
};

const GAME = {
  version: "v0.109.1",
  commit: "fixture-game",
  branch: "v0.109.1",
  main_assembly_hash: 123,
  compatibility: {
    status: "supported_exact",
    action_execution_allowed: true,
    state_observation_allowed: true,
    inspection_allowed: false,
    action_permission_scopes: [{
      surface_kind: "combat_turn",
      operation: "play_card",
      tier: "qualified"
    }]
  },
  modset: {
    status: "exact_bridge_only",
    fingerprint: "fixture-modset"
  }
};

function combatObservation(): ConnectorV3Observation {
  return decodeConnectorV3Observation({
    protocol_version: "3.0-preview.1",
    schema: "sts2.connector.v3/observation-1",
    profile: "semantic_accessibility.tools.v1",
    state_token: "state-fixture-1",
    sequence: 1,
    observed_at: "2026-07-31T00:00:00Z",
    status: "actionable_complete",
    shared_state: null,
    context: { kind: "combat" },
    surface: { kind: "combat_turn", hand: [], enemies: [] },
    interaction: {
      id: "interaction-fixture-1",
      kind: "combat_turn",
      phase: "ready",
      execution_support: "supported",
      support_reason: null,
      affordances: ["play_card"],
      command_candidates: [{
        candidate_id: "candidate-fixture-1",
        command: "play_card",
        operation: "play_card",
        label: "Play Strike",
        operands: { card_id: "card-fixture-1" },
        operand_domains: {
          target_id: {
            kind: "entity_ids",
            entity_ids: ["creature-fixture-1", "creature-fixture-2"]
          }
        },
        entity_bindings: [
          { role: "card", entity_id: "card-fixture-1" },
          { role: "target", entity_id: "creature-fixture-1" },
          { role: "target", entity_id: "creature-fixture-2" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "supported"
      }]
    },
    completeness: {
      player_visible_semantics: "complete",
      legal_actions: "complete",
      sources: ["fixture"],
      missing: []
    },
    bridge: BRIDGE,
    game: GAME,
    observation_policy: {
      id: "player_visible_ui_v1",
      scope: "visible",
      includes_hidden_information: false,
      unknown_field_behavior: "omit_and_mark_incomplete"
    },
    visibility: {
      profile_id: "fixture",
      core_status: "complete",
      player_visible_closure_status: "partial_catalog",
      available_inspections: [],
      linked_detail_kinds: [],
      hidden_by_policy: ["hidden_rng"],
      missing: [],
      unknown_critical_field_behavior: "fail_closed"
    },
    inspection_catalog: [],
    diagnostics: [],
    warnings: [],
    coverage: {
      visible_information: "complete_for_declared_contract",
      interaction_discovery: "complete",
      execution_support: "supported",
      unmapped_visible_controls: [],
      hidden_by_policy: ["hidden_rng"]
    }
  }).data;
}

describe("Connector V3 strict contract", () => {
  it("keeps visible unsupported interactions observable without commands", () => {
    const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
    value.status = "actionable_partial";
    value.surface = { kind: "unsupported", source_type: "new_owner", reason: "code_required" };
    value.interaction = {
      id: "interaction-unsupported",
      kind: "unsupported",
      phase: "blocked",
      execution_support: "unsupported",
      support_reason: "No exact binding",
      affordances: [],
      command_candidates: []
    };

    const decoded = decodeConnectorV3Observation(value).data;

    expect(decoded.surface.kind).toBe("unsupported");
    expect(decoded.interaction.command_candidates).toEqual([]);
  });

  it("rejects unknown mutation receipts that permit retry", () => {
    expect(() => decodeConnectorV3Receipt({
      protocol_version: "3.0-preview.1",
      request_id: "request-fixture",
      status: "unknown",
      application: "unknown",
      command: { kind: "play_card", operands: { card_id: "card-fixture" } },
      reason_code: "outcome_timeout",
      detail: "unknown",
      completion: null,
      retry: { allowed: true, reason: "retry" },
      successor: { status: "pending", state_token: null },
      events: []
    })).toThrow("unknown mutation must forbid retry");
  });

  it("expands only Gateway-provided operand domains into local opaque choices", () => {
    const observation = combatObservation();
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject,
      { protocol_version: "2.0-preview.82" }
    );

    expect(projected.invocations.size).toBe(2);
    expect([...projected.invocations.values()].map((entry) => entry.operands.target_id))
      .toEqual(["creature-fixture-1", "creature-fixture-2"]);
    expect([...projected.invocations.values()].every(
      (entry) => entry.command === "play_card"
        && entry.operands.card_id === "card-fixture-1"
    )).toBe(true);
    const wrapper = projected.rawState as Record<string, unknown>;
    expect(wrapper.adapter_protocol).toBe("connector_v3_selected");
  });
});
