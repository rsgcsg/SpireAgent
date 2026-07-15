import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import type { ExecutableGameAction } from "../src/domain/actions/action.js";
import type { GameAdapter } from "../src/game-io/adapter.js";
import type { Sts2McpRawState } from "../src/integrations/sts2mcp/rawState.js";
import type { McpExecutionResult } from "../src/integrations/sts2mcp/restAdapter.js";
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
    expect(recorder.records[0]?.preState?.normalizedState.kind).toBe("combat");
    expect(recorder.records[0]?.postState?.normalizedState.kind).toBe("combat");
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

  it("stops a run before game-over actions can restart or leave the completed run", async () => {
    const raw = await fixture("game-over") as Sts2McpRawState;
    const adapter = new FakeAdapter([raw]);
    const recorder = new MemoryRecorder();
    let calls = 0;
    const provider = fixedProvider("game-over:main_menu", () => { calls += 1; });

    const result = await makeOrchestrator(adapter, provider, recorder).runTick(1, { stopAtRunBoundary: true });

    expect(result).toMatchObject({ outcome: "not_executed_non_actionable_state", stateKind: "game_over", shouldStopRun: true });
    expect(calls).toBe(0);
    expect(adapter.executed).toEqual([]);
    expect(recorder.records[0]?.error).toContain("run boundary");
  });
});

class FakeAdapter implements GameAdapter<Sts2McpRawState, ExecutableGameAction, McpExecutionResult> {
  readonly executed: ExecutableGameAction[] = [];
  private readIndex = 0;

  constructor(private readonly states: Sts2McpRawState[]) {}

  describe() {
    return TEST_ADAPTER;
  }

  async readCurrentState(): Promise<Sts2McpRawState> {
    const state = this.states[Math.min(this.readIndex, this.states.length - 1)];
    this.readIndex += 1;
    if (!state) throw new Error("No fake state");
    return structuredClone(state);
  }

  async execute(action: ExecutableGameAction): Promise<McpExecutionResult> {
    this.executed.push(action);
    return { accepted: true, response: { status: "ok" } };
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
    defaultTimeoutMs: 20,
    endTurnTimeoutMs: 20
  }, async () => {});
  return new TickOrchestrator({ adapter, normalize, buildAllowedActions, llm: provider, settlement, recorder });
}
