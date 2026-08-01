import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import type { AdapterDescriptor } from "../src/game-io/adapter.js";
import { projectConnectorV3ForRe } from "../src/integrations/sts2mcp/connectorV3Projection.js";
import { Sts2ConnectorV3Adapter } from "../src/integrations/sts2mcp/connectorV3Adapter.js";
import {
  decodeConnectorV3Observation,
  decodeConnectorV3Receipt,
  type ConnectorV3Observation
} from "../src/integrations/sts2mcp/connectorV3Protocol.js";
import type { JsonObject } from "../src/shared/json.js";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";

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

const SOURCE: AdapterDescriptor = {
  adapterId: "sts2-connector-v3",
  endpoint: "http://fixture.invalid",
  capabilities: {
    canReadState: true,
    canExecuteActions: true,
    canListLegalActions: true,
    actionResults: "complete",
    legalActionAuthority: "bridge_advertised",
    protocols: ["connector_v3"]
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

function mainMenuObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.shared_state = null;
  value.context = { kind: "menu", flow: "root_navigation" };
  value.surface = {
    kind: "main_menu",
    stage: "choosing",
    screen_entity_id: "menu-screen-fixture",
    options: [
      {
        entity_id: "menu-option-singleplayer",
        semantic_id: "singleplayer",
        label: "Singleplayer",
        enabled: true,
        bridge_support: "actionable"
      },
      {
        entity_id: "menu-option-settings",
        semantic_id: "settings",
        label: "Settings",
        enabled: true,
        bridge_support: "visible_unsupported",
        blocked_reason: "outside the bounded run contract"
      }
    ]
  };
  value.interaction = {
    id: "interaction-menu-fixture",
    kind: "main_menu",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["activate_control"],
    command_candidates: [{
      candidate_id: "candidate-open-singleplayer",
      command: "activate_control",
      operation: "open_singleplayer",
      label: "Open Single Player",
      operands: {
        menu_screen_id: "menu-screen-fixture",
        control_id: "open_singleplayer"
      },
      operand_domains: {},
      entity_bindings: [{ role: "menu_screen", entity_id: "menu-screen-fixture" }],
      binding_kind: "native_direct_resolver",
      authority_state: "trial"
    }]
  };
  return decodeConnectorV3Observation(value).data;
}

function connectorCapabilities() {
  return {
    protocol_version: "3.0-preview.1",
    observation_schema: "sts2.connector.v3/observation-1",
    command_schema: "sts2.connector.v3/command-1",
    status: "experimental_cutover",
    bridge: BRIDGE,
    game: GAME,
    commands: ["activate_control"],
    control: { recommended_renewal_ms: 10_000 },
    non_claims: []
  };
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" }
  });
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
      { protocol_version: "2.0-preview.86" }
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

  it("projects a visible unsupported V3 family as typed unsupported instead of an invalid V2 surface", () => {
    const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
    value.status = "observed";
    value.context = { kind: "event", event_id: "SYMBIOTE" };
    value.surface = {
      kind: "deck_enchant_selection",
      source_type: "NDeckEnchantSelectScreen",
      reason: "The exact source contract is not recognized."
    };
    value.interaction = {
      id: "interaction-enchant-unsupported",
      kind: "deck_enchant_selection",
      phase: "degraded",
      execution_support: "unsupported",
      support_reason: "No exact current command binding is authorized.",
      affordances: [],
      command_candidates: []
    };
    const observation = decodeConnectorV3Observation(value).data;
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject,
      { protocol_version: "2.0-preview.86" }
    );
    const wrapper = projected.rawState as Record<string, unknown>;
    const bridgeState = wrapper.bridge_v2_state as Record<string, unknown>;

    expect(bridgeState.readiness).toBe("unsupported");
    expect(bridgeState.surface_kind).toBe("unsupported");
    expect(bridgeState.surface).toEqual(expect.objectContaining({
      kind: "unsupported",
      source_type: "deck_enchant_selection",
      reason: "The exact source contract is not recognized."
    }));
    expect(bridgeState.legal_actions).toEqual([]);
  });

  it("preserves exact card reward owner and entity operands without consumer reconstruction", () => {
    const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
    value.context = { kind: "reward_flow", reward_kind: "card_reward" };
    value.surface = {
      kind: "card_reward_selection",
      screen_entity_id: "screen-reward-1",
      cards: [],
      selectable_card_entity_ids: ["card-reward-1"],
      alternatives: []
    };
    value.interaction = {
      id: "interaction-card-reward",
      kind: "card_reward_selection",
      phase: "ready",
      execution_support: "trial",
      support_reason: null,
      affordances: ["select_entity"],
      command_candidates: [{
        candidate_id: "candidate-card-reward",
        command: "select_entity",
        operation: "select_card_reward",
        label: "Take Strike",
        operands: {
          screen_id: "screen-reward-1",
          card_id: "card-reward-1"
        },
        operand_domains: {},
        entity_bindings: [
          { role: "screen", entity_id: "screen-reward-1" },
          { role: "card", entity_id: "card-reward-1" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      }]
    };
    const observation = decodeConnectorV3Observation(value).data;

    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject,
      { protocol_version: "2.0-preview.86" }
    );

    expect([...projected.invocations.values()]).toEqual([
      expect.objectContaining({
        command: "select_entity",
        operation: "select_card_reward",
        operands: {
          screen_id: "screen-reward-1",
          card_id: "card-reward-1"
        }
      })
    ]);
  });

  it("consumes menu facts and commands directly without a V2 state projection", () => {
    const observation = mainMenuObservation();
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject,
      { invalid_v2_sidecar: true }
    );
    const wrapper = projected.rawState as Record<string, unknown>;

    expect(wrapper.bridge_v2_state).toBeUndefined();
    expect(wrapper.bridge_v2_capabilities).toBeUndefined();

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);
    expect(envelope.diagnostics.status).toBe("ok");
    expect(envelope.currentState).toMatchObject({
      sourceStateType: "connector_v3:menu:main_menu:direct",
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "menu", screen: "main_menu" },
      surface: {
        kind: "main_menu",
        screenEntityId: "menu-screen-fixture",
        choices: [
          { semanticId: "singleplayer", bridgeSupport: "actionable" },
          { semanticId: "settings", bridgeSupport: "visible_unsupported" }
        ]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({
        kind: "open_singleplayer",
        action: expect.objectContaining({
          kind: "connector_v3_command",
          expectedStateToken: observation.state_token,
          operation: "open_singleplayer"
        })
      })
    ]);
  });

  it("reads a direct V3 menu without requesting the V2 capabilities sidecar", async () => {
    const calls: string[] = [];
    const adapter = new Sts2ConnectorV3Adapter(
      "http://adapter.test",
      1_000,
      { commandPollMs: 1, commandTimeoutMs: 100 },
      async (input) => {
        const url = String(input);
        calls.push(url);
        if (url.endsWith("/api/v3/capabilities")) return json(connectorCapabilities());
        if (url.endsWith("/api/v3/observation")) return json(mainMenuObservation());
        throw new Error(`Unexpected request ${url}`);
      },
      async () => {}
    );

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());

    expect(calls.filter((url) => url.endsWith("/api/v3/capabilities"))).toHaveLength(2);
    expect(calls.some((url) => url.endsWith("/api/v2/capabilities"))).toBe(false);
    expect(envelope.currentState.sourceStateType)
      .toBe("connector_v3:menu:main_menu:direct");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toHaveLength(1);
  });

  it("fails a direct menu observation closed when its context flow is inconsistent", () => {
    const observation = mainMenuObservation();
    const raw = observation as unknown as JsonObject;
    raw.context = { kind: "menu", flow: "standard_run_setup" };
    const projected = projectConnectorV3ForRe(
      observation,
      raw,
      { protocol_version: "2.0-preview.86" }
    );

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(envelope.currentState.surface.kind).toBe("unsupported");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });
});
