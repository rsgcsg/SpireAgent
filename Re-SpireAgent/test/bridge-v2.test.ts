import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import type { AdapterDescriptor } from "../src/game-io/adapter.js";
import { Sts2McpHybridAdapter } from "../src/integrations/sts2mcp/hybridAdapter.js";
import { decodeBridgeV2State } from "../src/integrations/sts2mcp/bridgeV2Protocol.js";
import { isBridgeV2WrappedState, wrapBridgeV2State } from "../src/integrations/sts2mcp/rawState.js";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";
import type { JsonObject } from "../src/shared/json.js";
import { fixture } from "./helpers.js";

const CAPABILITIES = {
  protocol_version: "2.0-preview.1",
  bridge: { id: "sts2_mcp_bridge_v2", name: "STS2 Agent Bridge", version: "0.5.0-dev", upstream_commit: "upstream" },
  game: {
    version: "v0.108.0",
    commit: "58694f64",
    branch: "v0.108.0",
    main_assembly_hash: -2044609792,
    compatibility: { status: "supported_exact", action_execution_allowed: true, detail: "exact" }
  },
  observation_policy: { id: "player_visible_ui_v1", scope: "visible", includes_hidden_information: false, unknown_field_behavior: "omit" },
  surfaces: [{ kind: "deck_enchant_selection", support: "implemented_exact_game_version", operations: ["toggle_card"], evidence: "test-contract" }],
  commands: { opaque_actions_only: true, state_bound: true, idempotent_request_ids: true, lifecycle_states: ["started", "completed"], outcome_timeout_ms: 10000 },
  warnings: []
};

const DECK_ENCHANT_STATE = {
  protocol_version: "2.0-preview.1",
  state_id: "state-test-1",
  state_sequence: 1,
  observed_at: "2026-07-16T00:00:00Z",
  readiness: "ready",
  surface_kind: "deck_enchant_selection",
  surface: {
    kind: "deck_enchant_selection",
    stage: "selecting",
    screen_entity_id: "screen-1",
    prompt: "Choose a card to enchant",
    min_select: 1,
    max_select: 1,
    selected_count: 0,
    selected_card_entity_ids: [],
    cancelable: false,
    enchantment: {
      definition_id: "SLITHER",
      name: "Slither",
      description: "When drawn, randomize this card's cost.",
      amount: 1,
      observation_source: "visible_ui"
    },
    cards: [{
      entity_id: "card-1",
      definition_id: "STRIKE",
      name: "Strike",
      type: "Attack",
      cost: "1",
      star_cost: null,
      description: "Deal damage.",
      rarity: "Basic",
      is_upgraded: false,
      is_selected: false,
      existing_enchantment: null
    }]
  },
  legal_actions: [{
    action_id: "action-test-1",
    state_id: "state-test-1",
    kind: "toggle_card",
    category: "selection",
    label: "Select Strike",
    authority: "game_ui",
    evidence_code: "NCardGrid.HolderPressed"
  }],
  completeness: {
    player_visible_semantics: "contract_complete_for_supported_surface",
    legal_actions: "derived_from_same_validator_as_execution",
    sources: ["visible_ui"],
    missing: []
  },
  bridge: CAPABILITIES.bridge,
  game: CAPABILITIES.game,
  observation_policy: CAPABILITIES.observation_policy,
  warnings: []
};

const TEST_SOURCE: AdapterDescriptor = {
  adapterId: "sts2mcp-rest-negotiated",
  endpoint: "http://adapter.test",
  capabilities: {
    canReadState: true,
    canExecuteActions: true,
    canListLegalActions: false,
    actionResults: "partial" as const,
    legalActionAuthority: "mixed" as const,
    protocols: ["sts2mcp_v1", "bridge_v2"]
  }
};

describe("Bridge v2 Re-SpireAgent integration", () => {
  it("strictly decodes the qualified surface and rejects discriminator mismatch", () => {
    expect(decodeBridgeV2State(DECK_ENCHANT_STATE).data.surface.kind).toBe("deck_enchant_selection");
    expect(() => decodeBridgeV2State({ ...DECK_ENCHANT_STATE, surface_kind: "other" })).toThrow("does not match");
  });

  it("preserves enchant semantics and imports only advertised opaque actions", async () => {
    const legacyState = await fixture("event") as JsonObject;
    const wrapped = wrapBridgeV2State({
      state: structuredClone(DECK_ENCHANT_STATE),
      capabilities: structuredClone(CAPABILITIES),
      legacyState
    });
    const envelope = normalizeCurrentState(wrapped, TEST_SOURCE);

    expect(envelope.currentState.context.kind).toBe("event");
    expect(envelope.currentState.surface.kind).toBe("deck_enchant_selection");
    if (envelope.currentState.surface.kind !== "deck_enchant_selection") throw new Error("unexpected surface");
    expect(envelope.currentState.surface.enchantment).toMatchObject({ definitionId: "SLITHER", name: "Slither" });
    expect(envelope.currentState.surface.cards[0]).toMatchObject({ entityId: "card-1", id: "STRIKE", selected: false });
    expect(envelope.stateHash).not.toContain(DECK_ENCHANT_STATE.observed_at);

    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    expect(actions).toEqual([expect.objectContaining({
      id: "action-test-1",
      kind: "toggle_card",
      action: {
        kind: "bridge_v2_action",
        actionId: "action-test-1",
        expectedStateId: "state-test-1",
        bridgeActionKind: "toggle_card"
      }
    })]);
  });

  it("fails closed instead of importing an unknown advertised action kind", () => {
    const raw = structuredClone(DECK_ENCHANT_STATE);
    raw.legal_actions[0]!.kind = "invented_operation";
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: raw, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.surface.kind).toBe("unsupported");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("fails closed when state identity or advertised operations disagree", () => {
    const mismatchedIdentity = structuredClone(DECK_ENCHANT_STATE);
    mismatchedIdentity.game.commit = "different-build";
    const identityEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: mismatchedIdentity, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(identityEnvelope.currentState.stability).toBe("invalid");
    expect(buildAllowedActions(identityEnvelope.currentState, identityEnvelope.stateHash)).toEqual([]);

    const capabilitiesWithoutOperation = structuredClone(CAPABILITIES);
    capabilitiesWithoutOperation.surfaces[0]!.operations = [];
    const operationEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(DECK_ENCHANT_STATE), capabilities: capabilitiesWithoutOperation }),
      TEST_SOURCE
    );
    expect(operationEnvelope.currentState.stability).toBe("invalid");
    expect(buildAllowedActions(operationEnvelope.currentState, operationEnvelope.stateHash)).toEqual([]);
  });

  it("auto mode uses v2 as the single executor for a qualified surface", async () => {
    const requests: Array<{ url: string; init?: RequestInit; body?: any }> = [];
    let pollCount = 0;
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      requests.push({ url, ...(init ? { init } : {}), ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}) });
      if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
      if (url.endsWith("/api/v2/state")) return json(DECK_ENCHANT_STATE);
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("event"));
      if (url.endsWith("/api/v2/commands") && init?.method === "POST") {
        return json(command(requests.at(-1)?.body.request_id, "started"), 202);
      }
      if (url.includes("/api/v2/commands/")) {
        pollCount += 1;
        return json(command(url.split("/").at(-1), "completed"));
      }
      throw new Error(`Unexpected request ${url}`);
    };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      mode: "auto",
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, fetchImpl, async () => {});

    await adapter.initialize();
    expect(adapter.describe().capabilities).toMatchObject({
      canListLegalActions: true,
      legalActionAuthority: "mixed",
      protocols: ["sts2mcp_v1", "bridge_v2"]
    });
    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    const action = buildAllowedActions(envelope.currentState, envelope.stateHash)[0]?.action;
    if (!action) throw new Error("missing imported action");
    const result = await adapter.execute(action);

    expect(result).toMatchObject({ accepted: true, outcome: "accepted", response: { status: "completed" } });
    expect(pollCount).toBe(1);
    expect(requests.filter((request) => request.url.endsWith("/api/v1/singleplayer") && request.init?.method === "POST")).toHaveLength(0);
    expect(requests.find((request) => request.url.endsWith("/api/v2/commands"))?.body).toMatchObject({
      expected_state_id: "state-test-1",
      action_id: "action-test-1"
    });
  });

  it("auto mode keeps v1 ownership for an unsupported v2 surface", async () => {
    const calls: string[] = [];
    const unsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "map", reason: "not implemented" },
      legal_actions: []
    };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      mode: "auto",
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
      if (url.endsWith("/api/v2/state")) return json(unsupported);
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json({ state_type: "menu", options: [] });
      throw new Error(`Unexpected request ${url}`);
    });

    const state = await adapter.readCurrentState();
    expect(state).toMatchObject({ state_type: "menu" });
    expect(calls).toContain("http://adapter.test/api/v1/singleplayer?format=json");
  });

  it("preserves the bridge reason when strict v2 sees an unsupported surface", () => {
    const unsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "NMainMenu", reason: "surface adapter not implemented" },
      legal_actions: []
    };
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: unsupported, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState.surface).toMatchObject({
      kind: "unsupported",
      reason: "Bridge v2 does not implement NMainMenu: surface adapter not implemented"
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("rejects legacy actions at the strict v2 adapter boundary", async () => {
    let called = false;
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      mode: "v2",
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async () => {
      called = true;
      throw new Error("strict v2 must not call a v1 endpoint");
    });

    await expect(adapter.execute({ kind: "end_turn" })).resolves.toMatchObject({
      accepted: false,
      outcome: "rejected",
      response: { error: { code: "action_authority_mismatch" } }
    });
    expect(called).toBe(false);
  });

  it("enforces the latest read as the single executor authority in auto mode", async () => {
    const requests: string[] = [];
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      mode: "auto",
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      requests.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
      if (url.endsWith("/api/v2/state")) return json(DECK_ENCHANT_STATE);
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("event"));
      throw new Error(`Unexpected request ${url}`);
    });

    await adapter.readCurrentState();
    await expect(adapter.execute({ kind: "end_turn" })).resolves.toMatchObject({
      accepted: false,
      outcome: "rejected",
      response: { error: { code: "action_authority_mismatch" } }
    });
    expect(requests.some((url) => url.endsWith("/api/v1/singleplayer"))).toBe(false);
  });

  it("does not regain v1 action authority when exact-build execution is denied", async () => {
    const calls: string[] = [];
    const incompatibleCapabilities = structuredClone(CAPABILITIES);
    incompatibleCapabilities.game.compatibility = {
      status: "unsupported",
      action_execution_allowed: false,
      detail: "build mismatch"
    };
    const incompatibleState = structuredClone(DECK_ENCHANT_STATE);
    incompatibleState.game = incompatibleCapabilities.game;
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      mode: "auto",
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(incompatibleCapabilities);
      if (url.endsWith("/api/v2/state")) return json(incompatibleState);
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("event"));
      throw new Error(`Unexpected request ${url}`);
    });

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    expect(isBridgeV2WrappedState(raw)).toBe(true);
    expect(envelope.currentState.stability).toBe("invalid");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("does not hide v2 identity drift behind unsupported-surface v1 fallback", async () => {
    const calls: string[] = [];
    const driftedUnsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "menu", reason: "not implemented" },
      legal_actions: [],
      game: { ...CAPABILITIES.game, commit: "different-build" }
    };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      mode: "auto",
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
      if (url.endsWith("/api/v2/state")) return json(driftedUnsupported);
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("event"));
      throw new Error(`Unexpected request ${url}`);
    });

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    expect(isBridgeV2WrappedState(raw)).toBe(true);
    expect(envelope.currentState.stability).toBe("invalid");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("treats failed commands and mismatched command identities as unknown without retry", async () => {
    const failedAdapter = commandAdapter((requestId) => command(requestId, "failed"));
    const failedAction = await firstBridgeAction(failedAdapter);
    const failed = await failedAdapter.execute(failedAction);
    expect(failed).toMatchObject({ accepted: false, outcome: "unknown", response: { status: "failed" } });

    let submissions = 0;
    const mismatchedAdapter = commandAdapter((_requestId) => {
      submissions += 1;
      return command("wrong-request-id", "completed");
    }, true);
    const mismatchedAction = await firstBridgeAction(mismatchedAdapter);
    const mismatched = await mismatchedAdapter.execute(mismatchedAction);
    expect(mismatched).toMatchObject({
      accepted: false,
      outcome: "unknown",
      response: { status: "client_outcome_unknown", error: { code: "command_response_contract_mismatch" } }
    });
    expect(submissions).toBe(1);
  });
});

function command(
  requestId: string | undefined,
  status: "started" | "completed" | "failed" | "timed_out"
) {
  const outcome = status === "completed" ? "confirmed" : status === "failed" || status === "timed_out" ? "unknown" : "pending";
  return {
    request_id: requestId ?? "request-missing",
    expected_state_id: "state-test-1",
    action_id: "action-test-1",
    status,
    outcome,
    observed_state_id: "state-test-1",
    events: [{ status, at: "2026-07-16T00:00:00Z", evidence: status === "completed" ? "test_completion" : null, error_code: null, detail: null }]
  };
}

function commandAdapter(
  terminal: (requestId: string) => ReturnType<typeof command>,
  terminalOnSubmit = false
): Sts2McpHybridAdapter {
  return new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
    mode: "auto",
    commandPollMs: 1,
    commandTimeoutMs: 100
  }, async (input, init) => {
    const url = String(input);
    if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
    if (url.endsWith("/api/v2/state")) return json(DECK_ENCHANT_STATE);
    if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("event"));
    if (url.endsWith("/api/v2/commands") && init?.method === "POST") {
      const requestId = JSON.parse(String(init.body)).request_id as string;
      return json(terminalOnSubmit ? terminal(requestId) : command(requestId, "started"), terminalOnSubmit ? 200 : 202);
    }
    if (url.includes("/api/v2/commands/")) {
      return json(terminal(decodeURIComponent(url.split("/").at(-1) ?? "")));
    }
    throw new Error(`Unexpected request ${url}`);
  }, async () => {});
}

async function firstBridgeAction(adapter: Sts2McpHybridAdapter) {
  const raw = await adapter.readCurrentState();
  const envelope = normalizeCurrentState(raw, adapter.describe());
  const action = buildAllowedActions(envelope.currentState, envelope.stateHash)[0]?.action;
  if (!action || action.kind !== "bridge_v2_action") throw new Error("missing bridge action");
  return action;
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
}
