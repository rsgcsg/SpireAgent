import { describe, expect, it } from "vitest";
import { buildPlayerEnvironmentAllowedActions } from "../src/domain/actions/buildPlayerEnvironmentAllowedActions.js";
import type { ExecutableGameAction } from "../src/domain/actions/action.js";
import type { StateEnvelope } from "../src/domain/state/index.js";
import type { GameAdapter, GameExecutionResult, RawGameState } from "../src/game-io/adapter.js";
import { TransientObservationError } from "../src/game-io/observationError.js";
import type { LlmDecisionProvider, LlmDecisionSession } from "../src/llm/types.js";
import { normalizePlayerEnvironmentCurrentState } from "../src/normalization/normalizePlayerEnvironmentCurrentState.js";
import type { DecisionRecord, DecisionRecorder, PreparedEvidence } from "../src/recording/types.js";
import type { JsonValue } from "../src/shared/json.js";
import { SuccessorWatcher } from "../src/runtime/successorWatcher.js";
import { nonActionableStallLimit, TickOrchestrator } from "../src/runtime/tickOrchestrator.js";
import { playerEnvironmentSnapshot, TEST_ADAPTER, wrapSnapshot } from "./helpers.js";

describe("current Player Environment runtime", () => {
  it("runs observe, finite choice, stale preflight, delivery, successor, and recording", async () => {
    const before = wrapSnapshot(playerEnvironmentSnapshot({ snapshotId: "snapshot-1" }));
    const after = wrapSnapshot(playerEnvironmentSnapshot({ snapshotId: "snapshot-2", sequence: 2 }));
    const adapter = new FakeAdapter([before, before, after, after]);
    const recorder = new MemoryRecorder();
    const result = await makeOrchestrator(adapter, fixedProvider("end-turn"), recorder).runTick(1);

    expect(result.outcome).toBe("executed_and_settled");
    expect(adapter.executed).toEqual([{
      kind: "bound_action",
      choiceId: "end-turn",
      expectedSnapshotId: "snapshot-1",
      boundActionId: "end-turn"
    }]);
    expect(recorder.records[0]).toMatchObject({
      outcome: "executed_and_settled",
      execution: { attempted: true, selectedActionId: "end-turn", stateHashMatchedBeforeExecution: true },
      settlement: { status: "settled", polls: 2 }
    });
    expect(recorder.records[0]?.preState?.normalizedState.surface).toMatchObject({
      kind: "player_environment",
      snapshotId: "snapshot-1"
    });
  });

  it("refuses without delivery when the snapshot changes during model selection", async () => {
    const before = wrapSnapshot(playerEnvironmentSnapshot({ snapshotId: "snapshot-1" }));
    const changed = wrapSnapshot(playerEnvironmentSnapshot({ snapshotId: "snapshot-2", sequence: 2 }));
    const adapter = new FakeAdapter([before, changed]);
    const recorder = new MemoryRecorder();
    const result = await makeOrchestrator(adapter, fixedProvider("end-turn"), recorder).runTick(1);

    expect(result.outcome).toBe("not_executed_stale_state");
    expect(result.shouldStopRun).toBe(false);
    expect(adapter.executed).toEqual([]);
    expect(recorder.records[0]?.execution.stateHashMatchedBeforeExecution).toBe(false);
  });

  it("never retries an unknown delivery", async () => {
    const before = wrapSnapshot();
    const adapter = new FakeAdapter([before, before], {
      accepted: false,
      outcome: "unknown",
      response: { delivery: "unknown", retry: { allowed: false } }
    });
    const recorder = new MemoryRecorder();
    const result = await makeOrchestrator(adapter, fixedProvider("end-turn"), recorder).runTick(1);

    expect(result).toMatchObject({ outcome: "executed_unsettled", shouldStopRun: true });
    expect(adapter.executed).toHaveLength(1);
    expect(recorder.records[0]?.error).toContain("will not be retried");
  });

  it("skips a transient composite-read drift before a decision", async () => {
    const drift = new TransientObservationError("state_changed_during_composite_read", "fixture drift");
    const adapter = new FakeAdapter([drift]);
    const recorder = new MemoryRecorder();
    const result = await makeOrchestrator(adapter, fixedProvider("end-turn"), recorder).runTick(1);

    expect(result).toMatchObject({ outcome: "observation_failed", shouldStopRun: false });
    expect(adapter.executed).toEqual([]);
    expect(recorder.records[0]?.error).toContain("fixture drift");
  });

  it("waits through transient settlement drift and requires a repeatable actionable successor", async () => {
    const beforeRaw = wrapSnapshot(playerEnvironmentSnapshot({ snapshotId: "snapshot-1" }));
    const afterRaw = wrapSnapshot(playerEnvironmentSnapshot({ snapshotId: "snapshot-2", sequence: 2 }));
    const drift = new TransientObservationError("state_changed_during_composite_read", "settlement drift");
    const adapter = new FakeAdapter([afterRaw, drift, afterRaw, afterRaw]);
    const watcher = watcherFor(adapter);
    const result = await watcher.waitForReadySuccessor(
      normalize(beforeRaw),
      boundAction("snapshot-1"),
      "adapter_confirmed",
      "snapshot-2",
      "end_turn"
    );

    expect(result).toMatchObject({
      status: "settled",
      polls: 4,
      after: { currentState: { surface: { snapshotId: "snapshot-2" } } },
      transientObservationErrors: 1,
      lastTransientObservationError: { code: "state_changed_during_composite_read" }
    });
  });

  it("accepts a coherent non-actionable successor after delivery", async () => {
    const beforeRaw = wrapSnapshot(playerEnvironmentSnapshot({ snapshotId: "snapshot-1" }));
    const settlingRaw = wrapSnapshot(playerEnvironmentSnapshot({
      snapshotId: "snapshot-2",
      sequence: 2,
      status: "observed",
      actions: []
    }));
    const adapter = new FakeAdapter([settlingRaw]);
    const result = await watcherFor(adapter).waitForReadySuccessor(
      normalize(beforeRaw),
      boundAction("snapshot-1"),
      "adapter_confirmed",
      "snapshot-2"
    );

    expect(result).toMatchObject({ status: "settled", polls: 1 });
  });

  it("does not invoke the provider for settling or malformed snapshots", async () => {
    let calls = 0;
    const provider = fixedProvider("end-turn", () => { calls += 1; });
    const settling = new FakeAdapter([wrapSnapshot(playerEnvironmentSnapshot({ status: "settling", actions: [] }))]);
    const settlingResult = await makeOrchestrator(settling, provider, new MemoryRecorder()).runTick(1);
    const malformed = new FakeAdapter([{ invalid: true }]);
    const malformedResult = await makeOrchestrator(malformed, provider, new MemoryRecorder()).runTick(1);

    expect(settlingResult).toMatchObject({ outcome: "not_executed_non_actionable_state", shouldStopRun: false });
    expect(malformedResult).toMatchObject({ outcome: "not_executed_invalid_state", shouldStopRun: true });
    expect(calls).toBe(0);
  });

  it("gives native animation settling forty coherent observations before a bounded stop", () => {
    const settling = normalize(wrapSnapshot(playerEnvironmentSnapshot({ status: "settling", actions: [] })));
    expect(nonActionableStallLimit(settling.currentState, true)).toBe(40);
  });

  it("stops at the menu boundary instead of starting a second run", async () => {
    const menu = wrapSnapshot(playerEnvironmentSnapshot({
      interactionKind: "main_menu",
      context: { kind: "menu" },
      surface: { kind: "main_menu" },
      actions: [{ id: "play", verb: "activate", label: "Play" }]
    }));
    const adapter = new FakeAdapter([menu]);
    const result = await makeOrchestrator(adapter, fixedProvider("play"), new MemoryRecorder()).runTick(1, {
      stopAtRunBoundary: true
    });

    expect(result).toMatchObject({ shouldStopRun: true, stopReason: "run_boundary" });
    expect(adapter.executed).toEqual([]);
  });
});

class FakeAdapter implements GameAdapter<RawGameState, ExecutableGameAction, GameExecutionResult> {
  readonly executed: ExecutableGameAction[] = [];
  private last?: RawGameState;

  constructor(
    private readonly observations: Array<RawGameState | Error>,
    private readonly executionResult: GameExecutionResult = {
      accepted: true,
      outcome: "accepted",
      settlementAuthority: "adapter_confirmed",
      confirmedStateToken: "snapshot-2",
      response: { delivery: "delivered" }
    }
  ) {}

  async readCurrentState(): Promise<RawGameState> {
    const next = this.observations.shift();
    if (next instanceof Error) throw next;
    if (next) this.last = next;
    if (!this.last) throw new Error("No fixture observation remains");
    return structuredClone(this.last);
  }

  async execute(action: ExecutableGameAction): Promise<GameExecutionResult> {
    this.executed.push(action);
    return structuredClone(this.executionResult);
  }

  describe() { return TEST_ADAPTER; }
}

class MemoryRecorder implements DecisionRecorder<ExecutableGameAction> {
  readonly runId = "run-runtime-test";
  readonly records: Array<DecisionRecord<ExecutableGameAction>> = [];
  async initialize(): Promise<void> {}
  async prepare(input: Parameters<DecisionRecorder<ExecutableGameAction>["prepare"]>[0]): Promise<PreparedEvidence> {
    return {
      preState: {
        rawStateRef: "memory:pre",
        normalizedState: input.normalizedState,
        stateHash: input.stateHash,
        normalizedStateHash: input.normalizedStateHash,
        diagnostics: input.diagnostics
      }
    };
  }
  async append(record: DecisionRecord<ExecutableGameAction>): Promise<void> { this.records.push(record); }
}

function makeOrchestrator(
  adapter: FakeAdapter,
  provider: LlmDecisionProvider,
  recorder: MemoryRecorder
): TickOrchestrator {
  const normalizeCurrent = (raw: unknown) => normalizePlayerEnvironmentCurrentState(raw, TEST_ADAPTER);
  return new TickOrchestrator({
    adapter,
    normalize: normalizeCurrent,
    buildAllowedActions: buildPlayerEnvironmentAllowedActions,
    llm: provider,
    settlement: new SuccessorWatcher(adapter, normalizeCurrent, {
      pollMs: 0,
      defaultTimeoutMs: 100,
      endTurnTimeoutMs: 100,
      roomTransitionTimeoutMs: 100
    }, async () => {}),
    recorder
  });
}

function watcherFor(adapter: FakeAdapter): SuccessorWatcher {
  return new SuccessorWatcher(adapter, normalize, {
    pollMs: 0,
    defaultTimeoutMs: 100,
    endTurnTimeoutMs: 100,
    roomTransitionTimeoutMs: 100
  }, async () => {});
}

function normalize(raw: unknown): StateEnvelope {
  return normalizePlayerEnvironmentCurrentState(raw, TEST_ADAPTER);
}

function boundAction(snapshotId: string): ExecutableGameAction {
  return { kind: "bound_action", choiceId: "end-turn", expectedSnapshotId: snapshotId, boundActionId: "end-turn" };
}

function fixedProvider(selectedActionId: string, beforeDecision?: () => void): LlmDecisionProvider {
  return {
    describe: () => ({ provider: "deepseek", model: "fake", thinkingMode: "disabled", maxOutputTokens: 64 }),
    decide: async (): Promise<LlmDecisionSession> => {
      beforeDecision?.();
      const attempt = {
        requestKind: "primary" as const,
        startedAt: "2026-01-01T00:00:00.000Z",
        completedAt: "2026-01-01T00:00:00.001Z",
        latencyMs: 1,
        outcome: "valid_json" as const,
        requestBodyRedacted: {} as JsonValue,
        requestBodyHash: "sha256:test",
        rawResponseText: JSON.stringify({ selectedActionId, reasonBrief: "fixture" }),
        parsedDecision: { selectedActionId, reasonBrief: "fixture" }
      };
      return { provider: "deepseek", model: "fake", attempts: [attempt], finalAttempt: attempt };
    }
  };
}
