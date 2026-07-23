import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import type { ExecutableGameAction } from "../src/domain/actions/action.js";
import type { StateEnvelope } from "../src/domain/state/index.js";
import { NORMALIZED_STATE_SCHEMA_VERSION } from "../src/domain/state/common.js";
import type { GameAdapter, GameExecutionResult } from "../src/game-io/adapter.js";
import { TransientObservationError } from "../src/game-io/observationError.js";
import type { Sts2McpRawState } from "../src/integrations/sts2mcp/rawState.js";
import type { LlmDecisionProvider, LlmDecisionSession } from "../src/llm/types.js";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";
import type { DecisionRecord, DecisionRecorder, PreparedEvidence } from "../src/recording/types.js";
import { SettlementWatcher } from "../src/runtime/settlementWatcher.js";
import { TickOrchestrator } from "../src/runtime/tickOrchestrator.js";
import { fixture, TEST_ADAPTER } from "./helpers.js";

describe("TickOrchestrator", () => {
  it("runs read-normalize-prompt-decide-revalidate-execute-settle-record", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const post = structuredClone(pre);
    if (typeof post.player === "object" && post.player && !Array.isArray(post.player)) post.player.energy = 2;
    const adapter = new FakeAdapter([pre, pre, post]);
    const recorder = new MemoryRecorder();
    const provider = fixedProvider("combat:end-turn", () => expect(recorder.prepared).toBe(true));
    const orchestrator = makeOrchestrator(adapter, provider, recorder);

    const result = await orchestrator.runTick(1);

    expect(result.outcome).toBe("executed_and_settled");
    expect(adapter.executed).toEqual([{ kind: "end_turn" }]);
    expect(recorder.records).toHaveLength(1);
    expect(recorder.records[0]).toMatchObject({
      outcome: "executed_and_settled",
      execution: { attempted: true, selectedActionId: "combat:end-turn", stateHashMatchedBeforeExecution: true },
      settlement: { status: "settled" }
    });
    expect(recorder.records[0]?.preState?.normalizedState.context.kind).toBe("combat");
    expect(recorder.records[0]?.postState?.normalizedState.context.kind).toBe("combat");
  });

  it("aborts without execution when state changes while the LLM is deciding", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const changed = structuredClone(pre);
    if (typeof changed.player === "object" && changed.player && !Array.isArray(changed.player)) changed.player.energy = 1;
    const adapter = new FakeAdapter([pre, changed]);
    const recorder = new MemoryRecorder();
    const orchestrator = makeOrchestrator(adapter, fixedProvider("combat:end-turn"), recorder);

    const result = await orchestrator.runTick(1);

    expect(result.outcome).toBe("not_executed_stale_state");
    expect(adapter.executed).toEqual([]);
    expect(recorder.records[0]?.execution.stateHashMatchedBeforeExecution).toBe(false);
  });

  it("waits for two identical non-transitional post-action observations before declaring settlement", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const intermediate = structuredClone(pre);
    const final = structuredClone(pre);
    if (typeof intermediate.player === "object" && intermediate.player && !Array.isArray(intermediate.player)) intermediate.player.energy = 2;
    if (typeof final.player === "object" && final.player && !Array.isArray(final.player)) final.player.energy = 1;
    const adapter = new FakeAdapter([pre, pre, intermediate, final, final]);
    const recorder = new MemoryRecorder();
    const result = await makeOrchestrator(adapter, fixedProvider("combat:end-turn"), recorder).runTick(1);

    expect(result.outcome).toBe("executed_and_settled");
    expect(recorder.records[0]?.postState?.stateHash).toBe(normalizeCurrentState(final, TEST_ADAPTER).stateHash);
    expect(recorder.records[0]?.settlement?.polls).toBe(3);
  });

  it("retries transient composite-read drift during settlement without weakening stable observation", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const post = structuredClone(pre);
    if (typeof post.player === "object" && post.player && !Array.isArray(post.player)) post.player.energy = 2;
    const drift = new TransientObservationError(
      "state_changed_during_composite_read",
      "fixture inspection capture drift"
    );
    const adapter = new FakeAdapter([pre, pre, post, drift, post, post]);
    const recorder = new MemoryRecorder();
    const result = await makeOrchestrator(adapter, fixedProvider("combat:end-turn"), recorder).runTick(1);

    expect(result.outcome).toBe("executed_and_settled");
    expect(recorder.records[0]?.settlement).toMatchObject({
      status: "settled",
      polls: 4,
      transientObservationErrors: 1,
      lastTransientObservationError: {
        code: "state_changed_during_composite_read",
        message: "fixture inspection capture drift"
      }
    });
  });

  it("skips one pre-decision tick after composite-read drift without executing or ending a bounded run", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const drift = new TransientObservationError(
      "state_changed_during_composite_read",
      "fixture initial observation drift"
    );
    const adapter = new FakeAdapter([drift, pre]);
    const recorder = new MemoryRecorder();
    const orchestrator = makeOrchestrator(adapter, fixedProvider("combat:end-turn"), recorder);

    const skipped = await orchestrator.runTick(1);

    expect(skipped).toMatchObject({
      outcome: "observation_failed",
      shouldStopRun: false
    });
    expect(adapter.executed).toEqual([]);
    expect(recorder.records[0]?.error).toContain("fixture initial observation drift");
  });

  it("uses the end-turn settlement budget for an opaque Bridge v2 end-turn action", async () => {
    const preRaw = await fixture("combat") as Sts2McpRawState;
    const postRaw = structuredClone(preRaw);
    if (typeof postRaw.player === "object" && postRaw.player && !Array.isArray(postRaw.player)) postRaw.player.energy = 2;
    const adapter = new FakeAdapter([postRaw, postRaw]);
    const watcher = new SettlementWatcher(adapter, (raw) => normalizeCurrentState(raw, TEST_ADAPTER), {
      pollMs: 1,
      defaultTimeoutMs: -1,
      endTurnTimeoutMs: 20,
      roomTransitionTimeoutMs: -1
    }, async () => {});

    const result = await watcher.waitForNextState(
      normalizeCurrentState(preRaw, TEST_ADAPTER),
      {
        kind: "bridge_v2_action",
        actionId: "action-end-turn",
        expectedStateId: "state-before",
        bridgeActionKind: "end_turn"
      }
    );

    expect(result).toMatchObject({ status: "settled", polls: 2 });
  });

  it("captures one stable checkpoint without re-proving an adapter-confirmed command", async () => {
    const preRaw = await fixture("combat") as Sts2McpRawState;
    const adapter = new FakeAdapter([preRaw]);
    const watcher = new SettlementWatcher(adapter, (raw) => normalizeCurrentState(raw, TEST_ADAPTER), {
      pollMs: 1,
      defaultTimeoutMs: 20,
      endTurnTimeoutMs: 20,
      roomTransitionTimeoutMs: 20
    }, async () => {});

    const result = await watcher.waitForNextState(
      normalizeCurrentState(preRaw, TEST_ADAPTER),
      {
        kind: "bridge_v2_action",
        actionId: "action-confirmed",
        expectedStateId: "state-before",
        bridgeActionKind: "play_card"
      },
      "adapter_confirmed"
    );

    expect(result).toMatchObject({ status: "settled", polls: 1 });
  });

  it("does not accept an action-preceding Bridge token after the command confirmed a newer state", async () => {
    const adapter = new FakeAdapter([{ token: "state-old" }, { token: "state-new" }]);
    const watcher = new SettlementWatcher(adapter, (raw) => {
      const token = typeof raw === "object" && raw && "token" in raw ? String(raw.token) : "missing";
      return bridgeEnvelope(token);
    }, {
      pollMs: 1,
      defaultTimeoutMs: 20,
      endTurnTimeoutMs: 20,
      roomTransitionTimeoutMs: 20
    }, async () => {});

    const result = await watcher.waitForNextState(
      bridgeEnvelope("state-old"),
      {
        kind: "bridge_v2_action",
        actionId: "action-confirmed",
        expectedStateId: "state-old",
        bridgeActionKind: "play_card"
      },
      "adapter_confirmed",
      "state-new"
    );

    expect(result).toMatchObject({ status: "settled", polls: 2 });
    expect(result.after?.currentState.surface).toMatchObject({ bridgeStateId: "state-new" });
  });

  it("does not accept an unsupported unknown checkpoint after an adapter-confirmed transition", async () => {
    const transient = bridgeEnvelope("state-transient", "unknown");
    const final = bridgeEnvelope("state-final");
    const adapter = new FakeAdapter([{ token: "state-transient" }, { token: "state-final" }]);
    const watcher = new SettlementWatcher(adapter, (raw) => {
      const token = typeof raw === "object" && raw && "token" in raw ? String(raw.token) : "missing";
      return token === "state-transient" ? transient : final;
    }, {
      pollMs: 1,
      defaultTimeoutMs: 20,
      endTurnTimeoutMs: 20,
      roomTransitionTimeoutMs: 20
    }, async () => {});

    const result = await watcher.waitForNextState(
      bridgeEnvelope("state-before"),
      {
        kind: "bridge_v2_action",
        actionId: "action-embark",
        expectedStateId: "state-before",
        bridgeActionKind: "embark_standard_run"
      },
      "adapter_confirmed",
      "state-transient"
    );

    expect(result).toMatchObject({ status: "settled", polls: 2 });
    expect(result.after?.currentState.stability).toBe("actionable");
    expect(result.after?.currentState.surface).toMatchObject({ bridgeStateId: "state-final" });
  });

  it("uses a dedicated room-transition budget for map navigation", async () => {
    const preRaw = await fixture("map") as Sts2McpRawState;
    const loadingRaw = structuredClone(preRaw);
    loadingRaw.state_type = "combat";
    loadingRaw.combat = { turn: "enemy", is_play_phase: false, enemies: [] };
    const postRaw = await fixture("combat") as Sts2McpRawState;
    const adapter = new FakeAdapter([loadingRaw, postRaw, postRaw]);
    const watcher = new SettlementWatcher(adapter, (raw) => normalizeCurrentState(raw, TEST_ADAPTER), {
      pollMs: 1,
      defaultTimeoutMs: -1,
      endTurnTimeoutMs: -1,
      roomTransitionTimeoutMs: 20
    }, async () => {});

    const result = await watcher.waitForNextState(
      normalizeCurrentState(preRaw, TEST_ADAPTER),
      { kind: "choose_map_node", index: 0 }
    );

    expect(result).toMatchObject({ status: "settled", polls: 3 });
  });

  it("uses the room-transition budget for an opaque Bridge v2 map action", async () => {
    const preRaw = await fixture("map") as Sts2McpRawState;
    const postRaw = await fixture("combat") as Sts2McpRawState;
    const adapter = new FakeAdapter([postRaw, postRaw]);
    const watcher = new SettlementWatcher(adapter, (raw) => normalizeCurrentState(raw, TEST_ADAPTER), {
      pollMs: 1,
      defaultTimeoutMs: -1,
      endTurnTimeoutMs: -1,
      roomTransitionTimeoutMs: 20
    }, async () => {});

    const result = await watcher.waitForNextState(
      normalizeCurrentState(preRaw, TEST_ADAPTER),
      {
        kind: "bridge_v2_action",
        actionId: "action-map-node",
        expectedStateId: "state-before",
        bridgeActionKind: "choose_map_node"
      }
    );

    expect(result).toMatchObject({ status: "settled", polls: 2 });
  });

  it.each(["continue_run", "embark_standard_run"] as const)(
    "uses the long-transition budget for the opaque Bridge v2 %s action",
    async (bridgeActionKind) => {
      const adapter = new FakeAdapter([{ token: "state-after" }]);
      const watcher = new SettlementWatcher(adapter, (raw) => {
        const token = typeof raw === "object" && raw && "token" in raw ? String(raw.token) : "missing";
        return bridgeEnvelope(token);
      }, {
        pollMs: 1,
        defaultTimeoutMs: -1,
        endTurnTimeoutMs: -1,
        roomTransitionTimeoutMs: 20
      }, async () => {});

      const result = await watcher.waitForNextState(
        bridgeEnvelope("state-before"),
        {
          kind: "bridge_v2_action",
          actionId: `action-${bridgeActionKind}`,
          expectedStateId: "state-before",
          bridgeActionKind
        },
        "adapter_confirmed",
        "state-after"
      );

      expect(result).toMatchObject({ status: "settled", polls: 1 });
    }
  );

  it("stops after an exact state-action-state transition repeats", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const post = structuredClone(pre);
    if (typeof post.player === "object" && post.player && !Array.isArray(post.player)) post.player.energy = 2;
    const adapter = new FakeAdapter([pre, pre, post, post, pre, pre, post, post]);
    const recorder = new MemoryRecorder();
    const orchestrator = makeOrchestrator(adapter, fixedProvider("combat:end-turn"), recorder);

    const first = await orchestrator.runTick(1);
    const second = await orchestrator.runTick(2);

    expect(first.shouldStopRun).toBe(false);
    expect(second).toMatchObject({
      outcome: "executed_and_settled",
      shouldStopRun: true,
      stopReason: "repeated_exact_transition"
    });
    expect(recorder.records[1]?.runtimeGuard).toMatchObject({
      code: "repeated_exact_transition",
      occurrence: 2,
      selectedActionId: "combat:end-turn"
    });
  });

  it("keeps transient composite-read drift fail-closed before execution", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const drift = new TransientObservationError(
      "state_changed_during_composite_read",
      "fixture pre-execution drift"
    );
    const adapter = new FakeAdapter([pre, drift]);
    const recorder = new MemoryRecorder();
    const result = await makeOrchestrator(adapter, fixedProvider("combat:end-turn"), recorder).runTick(1);

    expect(result.outcome).toBe("not_executed_stale_state");
    expect(adapter.executed).toEqual([]);
    expect(recorder.records[0]?.error).toContain("fixture pre-execution drift");
  });

  it("does not retry generic settlement read failures", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const adapter = new FakeAdapter([pre, pre, new Error("fixture transport failure")]);
    const recorder = new MemoryRecorder();
    const result = await makeOrchestrator(adapter, fixedProvider("combat:end-turn"), recorder).runTick(1);

    expect(result.outcome).toBe("executed_unsettled");
    expect(recorder.records[0]?.settlement).toMatchObject({
      status: "read_error",
      polls: 1,
      error: "fixture transport failure"
    });
  });

  it("keeps polling on the next tick after a confirmed Bridge action reaches a changed transitional state", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const transitional = await fixture("post-combat-settling") as Sts2McpRawState;
    const adapter = new FakeAdapter([pre, pre, transitional], {
      accepted: true,
      outcome: "accepted",
      settlementAuthority: "adapter_confirmed",
      confirmedStateToken: "state-after",
      response: { status: "completed", outcome: "confirmed" }
    });
    const recorder = new MemoryRecorder();
    const normalize = (raw: unknown) => normalizeCurrentState(raw, adapter.describe());
    const settlement = new SettlementWatcher(adapter, normalize, {
      pollMs: 1,
      defaultTimeoutMs: 20,
      endTurnTimeoutMs: 20,
      roomTransitionTimeoutMs: 20
    }, async () => {});
    const bridgeAction = {
      id: "bridge:end-turn",
      kind: "end_turn",
      label: "End turn",
      action: {
        kind: "bridge_v2_action" as const,
        actionId: "action-end-turn",
        expectedStateId: "state-before",
        bridgeActionKind: "end_turn"
      },
      sourceStateHash: normalizeCurrentState(pre, adapter.describe()).stateHash
    };
    const orchestrator = new TickOrchestrator({
      adapter,
      normalize,
      buildAllowedActions: () => [bridgeAction],
      llm: fixedProvider(bridgeAction.id),
      settlement,
      recorder
    });

    const result = await orchestrator.runTick(1);

    expect(result).toMatchObject({
      outcome: "executed_checkpoint_pending",
      shouldStopRun: false
    });
    expect(recorder.records[0]).toMatchObject({
      outcome: "executed_checkpoint_pending",
      execution: { attempted: true, adapterResult: { status: "completed", outcome: "confirmed" } },
      settlement: { status: "timeout" }
    });
    expect(recorder.records[0]?.postState?.normalizedState.stability).toBe("transitioning");
    expect(recorder.records[0]?.runtimeGuard).toBeUndefined();
  });

  it("does not turn an adapter-confirmed command into an unknown outcome when checkpoint reading fails", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const adapter = new FakeAdapter([pre, pre, new Error("fixture post-command read failure")], {
      accepted: true,
      outcome: "accepted",
      settlementAuthority: "adapter_confirmed",
      confirmedStateToken: "state-after",
      response: { status: "completed", outcome: "confirmed" }
    });
    const recorder = new MemoryRecorder();

    const result = await makeOrchestrator(adapter, fixedProvider("combat:end-turn"), recorder).runTick(1);

    expect(result).toMatchObject({
      outcome: "executed_checkpoint_pending",
      shouldStopRun: false
    });
    expect(recorder.records[0]).toMatchObject({
      execution: { adapterResult: { status: "completed", outcome: "confirmed" } },
      settlement: { status: "read_error", error: "fixture post-command read failure" }
    });
  });

  it("does not treat a legacy acknowledgement as confirmed when the next checkpoint is pending", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const transitional = await fixture("post-combat-settling") as Sts2McpRawState;
    const adapter = new FakeAdapter([pre, pre, transitional]);
    const recorder = new MemoryRecorder();
    const result = await makeOrchestrator(adapter, fixedProvider("combat:end-turn"), recorder).runTick(1);

    expect(result.outcome).toBe("executed_unsettled");
    expect(result.shouldStopRun).toBe(true);
  });

  it("never executes a provider-selected id outside the whitelist", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const adapter = new FakeAdapter([pre]);
    const recorder = new MemoryRecorder();
    const orchestrator = makeOrchestrator(adapter, fixedProvider("invented-action"), recorder);

    const result = await orchestrator.runTick(1);

    expect(result.outcome).toBe("not_executed_invalid_decision");
    expect(adapter.executed).toEqual([]);
    expect(recorder.records[0]?.llm?.validation).toMatchObject({ valid: false, outcome: "unknown_action_id" });
  });

  it("does not call the provider for unsupported states", async () => {
    const raw = await fixture("unknown") as Sts2McpRawState;
    const adapter = new FakeAdapter([raw]);
    const recorder = new MemoryRecorder();
    let calls = 0;
    const provider = fixedProvider("anything", () => { calls += 1; });
    const result = await makeOrchestrator(adapter, provider, recorder).runTick(1);
    expect(result.outcome).toBe("not_executed_invalid_state");
    expect(calls).toBe(0);
    expect(adapter.executed).toEqual([]);
  });

  it("stops a bounded run after a repeated coherent non-actionable state without calling the provider", async () => {
    const raw = await fixture("event") as Sts2McpRawState;
    const settling = structuredClone(raw);
    if (typeof settling.event === "object" && settling.event && !Array.isArray(settling.event)) {
      settling.event.options = [];
    }
    const adapter = new FakeAdapter(Array.from({ length: 8 }, () => settling));
    const recorder = new MemoryRecorder();
    let calls = 0;
    const orchestrator = makeOrchestrator(adapter, fixedProvider("anything", () => { calls += 1; }), recorder);

    let result;
    for (let tick = 1; tick <= 8; tick += 1) {
      result = await orchestrator.runTick(tick);
    }

    expect(result).toMatchObject({
      outcome: "not_executed_non_actionable_state",
      shouldStopRun: true,
      stopReason: "repeated_non_actionable_state"
    });
    expect(calls).toBe(0);
    expect(adapter.executed).toEqual([]);
    expect(recorder.records[7]?.runtimeGuard).toMatchObject({
      code: "repeated_non_actionable_state",
      occurrence: 8,
      contextKind: "event",
      surfaceKind: "option_choice"
    });
  });

  it("does not treat an adapter-declared unknown command outcome as success", async () => {
    const pre = await fixture("combat") as Sts2McpRawState;
    const adapter = new FakeAdapter([pre, pre], {
      accepted: false,
      outcome: "unknown",
      response: { status: "client_outcome_unknown" }
    });
    const recorder = new MemoryRecorder();

    const result = await makeOrchestrator(adapter, fixedProvider("combat:end-turn"), recorder).runTick(1);

    expect(result.outcome).toBe("executed_unsettled");
    expect(result.shouldStopRun).toBe(true);
    expect(adapter.executed).toEqual([{ kind: "end_turn" }]);
    expect(recorder.records[0]?.execution.adapterResult).toEqual({ status: "client_outcome_unknown" });
    expect(recorder.records[0]?.error).toContain("will not be retried");
  });

  it("allows the current run to complete its game-over return lifecycle", async () => {
    const raw = await fixture("game-over") as Sts2McpRawState;
    const menu = await fixture("menu") as Sts2McpRawState;
    const adapter = new FakeAdapter([raw, raw, menu, menu]);
    const recorder = new MemoryRecorder();
    let calls = 0;
    const provider = fixedProvider("game-over:main_menu", () => { calls += 1; });

    const result = await makeOrchestrator(adapter, provider, recorder).runTick(1, { stopAtRunBoundary: true });

    expect(result).toMatchObject({
      outcome: "executed_and_settled",
      contextKind: "run_ended",
      surfaceKind: "menu_choice",
      actionAuthority: "local_reconstruction",
      shouldStopRun: false
    });
    expect(calls).toBe(1);
    expect(adapter.executed).toEqual([{ kind: "menu_select", option: "main_menu" }]);
  });

  it("stops at the top-level menu before the model can start or continue another run", async () => {
    const raw = await fixture("menu") as Sts2McpRawState;
    const adapter = new FakeAdapter([raw]);
    const recorder = new MemoryRecorder();
    let calls = 0;
    const provider = fixedProvider("menu:0", () => { calls += 1; });

    const result = await makeOrchestrator(adapter, provider, recorder).runTick(1, { stopAtRunBoundary: true });

    expect(result).toMatchObject({
      outcome: "not_executed_non_actionable_state",
      contextKind: "menu",
      shouldStopRun: true,
      stopReason: "run_boundary"
    });
    expect(calls).toBe(0);
    expect(adapter.executed).toEqual([]);
    expect(recorder.records[0]?.error).toContain("run-start boundary");
  });
});

class FakeAdapter implements GameAdapter<Sts2McpRawState, ExecutableGameAction, GameExecutionResult> {
  readonly executed: ExecutableGameAction[] = [];
  private readIndex = 0;

  constructor(
    private readonly states: Array<Sts2McpRawState | Error>,
    private readonly executionResult: GameExecutionResult = { accepted: true, response: { status: "ok" } }
  ) {}

  describe() {
    return TEST_ADAPTER;
  }

  async readCurrentState(): Promise<Sts2McpRawState> {
    const state = this.states[Math.min(this.readIndex, this.states.length - 1)];
    this.readIndex += 1;
    if (!state) throw new Error("No fake state");
    if (state instanceof Error) throw state;
    return structuredClone(state);
  }

  async execute(action: ExecutableGameAction): Promise<GameExecutionResult> {
    this.executed.push(action);
    return this.executionResult;
  }
}

class MemoryRecorder implements DecisionRecorder {
  readonly runId = "run-test";
  readonly records: DecisionRecord[] = [];
  prepared = false;

  async initialize(): Promise<void> {}

  async prepare(input: Parameters<DecisionRecorder["prepare"]>[0]): Promise<PreparedEvidence> {
    this.prepared = true;
    return {
      preState: {
        rawStateRef: "snapshots/pre.json",
        normalizedState: input.normalizedState,
        stateHash: input.stateHash,
        normalizedStateHash: input.normalizedStateHash,
        diagnostics: input.diagnostics
      },
      ...(input.prompt
        ? {
            prompt: {
              promptRef: "prompts/prompt.json",
              globalPromptId: input.prompt.globalPromptId,
              globalPromptVersion: input.prompt.globalPromptVersion,
              stateGuideId: input.prompt.stateGuideId,
              stateGuideVersion: input.prompt.stateGuideVersion,
              systemPromptHash: input.prompt.systemPromptHash,
              userPromptHash: input.prompt.userPromptHash,
              systemPromptBytes: input.prompt.systemPromptBytes,
              userPromptBytes: input.prompt.userPromptBytes
            }
          }
        : {})
    };
  }

  async append(record: DecisionRecord): Promise<void> {
    this.records.push(record);
  }
}

function fixedProvider(selectedActionId: string, beforeDecision?: () => void): LlmDecisionProvider {
  return {
    describe: () => ({ provider: "deepseek", model: "fake", thinkingMode: "disabled", maxOutputTokens: 100 }),
    decide: async (): Promise<LlmDecisionSession> => {
      beforeDecision?.();
      const attempt = {
        requestKind: "primary" as const,
        startedAt: "2026-01-01T00:00:00.000Z",
        completedAt: "2026-01-01T00:00:00.001Z",
        latencyMs: 1,
        outcome: "valid_json" as const,
        requestBodyRedacted: {},
        requestBodyHash: "sha256:test",
        rawResponseText: JSON.stringify({ selectedActionId, reasonBrief: "Fixture decision." }),
        parsedDecision: { selectedActionId, reasonBrief: "Fixture decision." },
        finishReason: "stop"
      };
      return { provider: "deepseek", model: "fake", attempts: [attempt], finalAttempt: attempt };
    }
  };
}

function makeOrchestrator(adapter: FakeAdapter, provider: LlmDecisionProvider, recorder: MemoryRecorder): TickOrchestrator {
  const normalize = (raw: unknown) => normalizeCurrentState(raw, adapter.describe());
  const settlement = new SettlementWatcher(adapter, normalize, {
    pollMs: 1,
    // The injected no-op sleep makes these fixture polls deterministic; the
    // wider wall-clock guard prevents parallel test load from expiring the
    // loop before the asserted observation sequence is consumed.
    defaultTimeoutMs: 250,
    endTurnTimeoutMs: 250,
    roomTransitionTimeoutMs: 250
  }, async () => {});
  return new TickOrchestrator({ adapter, normalize, buildAllowedActions, llm: provider, settlement, recorder });
}

function bridgeEnvelope(
  bridgeStateId: string,
  stability: StateEnvelope["currentState"]["stability"] = "actionable"
): StateEnvelope {
  return {
    envelopeSchemaVersion: 2,
    capturedAt: "2026-07-21T00:00:00.000Z",
    source: TEST_ADAPTER,
    rawState: { token: bridgeStateId },
    currentState: {
      normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
      sourceStateType: "bridge_v2:combat:combat_turn",
      stability,
      actionAuthority: stability === "actionable" ? "bridge_advertised" : "none",
      context: {
        kind: "combat",
        encounterType: "normal",
        turnOwner: "player",
        isPlayPhase: true,
        enemies: []
      },
      surface: { kind: "combat_turn", bridgeStateId }
    },
    diagnostics: {
      status: "ok",
      missingRequiredFields: [],
      invalidFields: [],
      inferredFields: [],
      defaultedFields: [],
      unknownFields: [],
      warnings: []
    },
    stateHash: bridgeStateId,
    normalizedStateHash: bridgeStateId
  };
}
