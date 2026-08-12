import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlayerEnvironmentAllowedActions } from "../src/domain/actions/buildPlayerEnvironmentAllowedActions.js";
import type { ExecutableGameAction } from "../src/domain/actions/action.js";
import { normalizePlayerEnvironmentCurrentState } from "../src/normalization/normalizePlayerEnvironmentCurrentState.js";
import { buildDecisionPrompt } from "../src/prompting/promptBuilder.js";
import { FileDecisionRecorder, readRunMetadata, readRunRecords, readRunSummary } from "../src/recording/fileDecisionRecorder.js";
import type { DecisionRecord, RunMetadata } from "../src/recording/types.js";
import { TEST_ADAPTER, wrapSnapshot } from "./helpers.js";

describe("FileDecisionRecorder", () => {
  it("rejects unsafe replay path segments", async () => {
    await expect(readRunMetadata("data/runs", "../outside")).rejects.toThrow("Unsafe path segment");
  });

  it("keeps a v1 decision record replay-readable without reinterpreting its state", async () => {
    const dataRoot = await mkdtemp(join(tmpdir(), "re-spire-agent-history-"));
    await mkdir(join(dataRoot, "run-v1"), { recursive: true });
    await writeFile(join(dataRoot, "run-v1", "decisions.jsonl"), `${JSON.stringify({
      recordSchemaVersion: 1,
      decisionId: "historical-decision",
      runId: "run-v1",
      tick: 1,
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:00.001Z",
      allowedActions: [],
      execution: { attempted: false },
      outcome: "dry_run"
    })}\n`);

    const records = await readRunRecords(dataRoot, "run-v1");

    expect(records).toHaveLength(1);
    expect(records[0]?.recordSchemaVersion).toBe(1);
  });

  it("persists the Player Environment snapshot, prompt, provider response, and receipt-facing action", async () => {
    const dataRoot = await mkdtemp(join(tmpdir(), "re-spire-agent-"));
    const metadata: RunMetadata = {
      metadataSchemaVersion: 1,
      runId: "run-recording-test",
      startedAt: "2026-01-01T00:00:00.000Z",
      agentVersion: "test",
      adapter: { adapterId: "sts2-player-environment", endpoint: "http://localhost:15526", capabilities: {} },
      provider: { provider: "deepseek", model: "fake", thinkingMode: "disabled", maxOutputTokens: 100 },
      evidence: {
        provenance: "fixture",
        declaredBy: "runtime_configuration"
      },
      schemas: { normalizedState: 32, prompt: 3, decisionRecord: 2 }
    };
    const recorder = new FileDecisionRecorder<ExecutableGameAction>(dataRoot, metadata);
    await recorder.initialize();
    const raw = wrapSnapshot();
    const envelope = normalizePlayerEnvironmentCurrentState(raw, TEST_ADAPTER);
    const actions = buildPlayerEnvironmentAllowedActions(envelope.currentState, envelope.stateHash);
    const prompt = buildDecisionPrompt(envelope.currentState, actions);
    const prepared = await recorder.prepare({
      decisionId: "decision-1",
      preRawState: raw,
      normalizedState: envelope.currentState,
      stateHash: envelope.stateHash,
      normalizedStateHash: envelope.normalizedStateHash,
      diagnostics: envelope.diagnostics,
      prompt
    });
    const attempt = {
      requestKind: "primary" as const,
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:00.001Z",
      latencyMs: 1,
      outcome: "valid_json" as const,
      requestBodyRedacted: {},
      requestBodyHash: "sha256:request",
      rawProviderResponse: { choices: [] },
      rawResponseText: '{"selectedActionId":"end-turn","reasonBrief":"Done."}',
      parsedDecision: { selectedActionId: "end-turn", reasonBrief: "Done." },
      finishReason: "stop"
    };
    const selected = actions[0];
    expect(selected).toBeDefined();
    const record: DecisionRecord<ExecutableGameAction> = {
      recordSchemaVersion: 2,
      decisionId: "decision-1",
      runId: recorder.runId,
      tick: 1,
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:00.010Z",
      preState: prepared.preState,
      allowedActions: actions,
      prompt: prepared.prompt,
      llm: {
        provider: "deepseek",
        model: "fake",
        session: { provider: "deepseek", model: "fake", attempts: [attempt], finalAttempt: attempt },
        validation: { valid: true, outcome: "valid" }
      },
      execution: {
        attempted: true,
        selectedActionId: selected!.id,
        action: selected!.action,
        stateHashMatchedBeforeExecution: true,
        adapterResult: { delivery: "delivered" }
      },
      settlement: { status: "settled", polls: 1, elapsedMs: 1 },
      postState: { ...prepared.preState, rawStateRef: "pending" },
      outcome: "executed_and_settled"
    };
    await recorder.append(record, { postRawState: raw });
    await recorder.finalize({
      endedAt: "2026-01-01T00:00:00.011Z",
      decisionCount: 1,
      termination: "completed_run_boundary",
      completedGame: true,
      terminalOutcome: "executed_and_settled",
      terminalStopReason: "run_boundary",
      maxTicks: 1000
    });

    const runDir = join(dataRoot, recorder.runId);
    const savedPrompt = JSON.parse(await readFile(join(runDir, "prompts/decision-1.prompt.json"), "utf8"));
    const savedResponse = JSON.parse(await readFile(join(runDir, "responses/decision-1.response.json"), "utf8"));
    const savedRecord = JSON.parse((await readFile(join(runDir, "decisions.jsonl"), "utf8")).trim());
    expect(savedPrompt.systemPrompt).toBe(prompt.systemPrompt);
    expect(savedPrompt.userPrompt).toBe(prompt.userPrompt);
    expect(savedResponse.finalAttempt.rawResponseText).toContain("end-turn");
    expect(savedRecord.preState.rawStateRef).toBe("snapshots/decision-1-pre.raw.json");
    expect(savedRecord.postState.rawStateRef).toBe("snapshots/decision-1-post.raw.json");
    expect(savedRecord.execution.action).toEqual(selected!.action);
    expect(savedRecord.llm.responseRef).toBe("responses/decision-1.response.json");
    await expect(readRunSummary(dataRoot, recorder.runId)).resolves.toMatchObject({
      runId: recorder.runId,
      decisionCount: 1,
      termination: "completed_run_boundary",
      completedGame: true
    });
    await expect(recorder.finalize({
      endedAt: "2026-01-01T00:00:00.012Z",
      decisionCount: 1,
      termination: "stopped_runtime_failure",
      completedGame: false,
      terminalOutcome: "observation_failed",
      maxTicks: 1000
    })).rejects.toMatchObject({ code: "EEXIST" });
  });
});
