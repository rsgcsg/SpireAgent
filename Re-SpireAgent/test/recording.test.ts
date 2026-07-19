import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";
import { buildDecisionPrompt } from "../src/prompting/promptBuilder.js";
import { FileDecisionRecorder, readRunMetadata, readRunRecords } from "../src/recording/fileDecisionRecorder.js";
import type { DecisionRecord, RunMetadata } from "../src/recording/types.js";
import { fixture, TEST_ADAPTER } from "./helpers.js";

describe("FileDecisionRecorder", () => {
  it("rejects unsafe replay path segments", async () => {
    await expect(readRunMetadata("data/runs", "../outside")).rejects.toThrow("Unsafe path segment");
  });

  it("keeps a v1 decision record replay-readable without reinterpreting its normalized state", async () => {
    const dataRoot = await mkdtemp(join(tmpdir(), "re-spire-agent-legacy-"));
    await mkdir(join(dataRoot, "run-v1"), { recursive: true });
    await writeFile(join(dataRoot, "run-v1", "decisions.jsonl"), `${JSON.stringify({
      recordSchemaVersion: 1,
      decisionId: "legacy-decision",
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

  it("persists pre/post raw state, full prompt, provider response, and the decision record", async () => {
    const dataRoot = await mkdtemp(join(tmpdir(), "re-spire-agent-"));
    const metadata: RunMetadata = {
      metadataSchemaVersion: 1,
      runId: "run-recording-test",
      startedAt: "2026-01-01T00:00:00.000Z",
      agentVersion: "test",
      adapter: { adapterId: "sts2mcp-rest", endpoint: "http://localhost:15526", capabilities: {} },
      provider: { provider: "deepseek", model: "fake", thinkingMode: "disabled", maxOutputTokens: 100 },
      evidence: {
        provenance: "fixture",
        declaredBy: "runtime_configuration",
        qualificationUse: "coverage_only_unless_independently_reviewed"
      },
      schemas: { normalizedState: 2, prompt: 2, decisionRecord: 2 }
    };
    const recorder = new FileDecisionRecorder(dataRoot, metadata);
    await recorder.initialize();
    const raw = await fixture("combat") as any;
    const envelope = normalizeCurrentState(raw, TEST_ADAPTER);
    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
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
      rawResponseText: '{"selectedActionId":"combat:end-turn","reasonBrief":"Done."}',
      parsedDecision: { selectedActionId: "combat:end-turn", reasonBrief: "Done." },
      finishReason: "stop"
    };
    const record: DecisionRecord = {
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
      execution: { attempted: true, selectedActionId: "combat:end-turn", action: { kind: "end_turn" }, stateHashMatchedBeforeExecution: true },
      settlement: { status: "settled", polls: 1, elapsedMs: 1 },
      postState: { ...prepared.preState, rawStateRef: "pending" },
      outcome: "executed_and_settled"
    };
    await recorder.append(record, { postRawState: raw });

    const runDir = join(dataRoot, recorder.runId);
    const savedPrompt = JSON.parse(await readFile(join(runDir, "prompts/decision-1.prompt.json"), "utf8"));
    const savedResponse = JSON.parse(await readFile(join(runDir, "responses/decision-1.response.json"), "utf8"));
    const savedRecord = JSON.parse((await readFile(join(runDir, "decisions.jsonl"), "utf8")).trim());
    expect(savedPrompt.systemPrompt).toBe(prompt.systemPrompt);
    expect(savedPrompt.userPrompt).toBe(prompt.userPrompt);
    expect(savedResponse.finalAttempt.rawResponseText).toContain("combat:end-turn");
    expect(savedRecord.preState.rawStateRef).toBe("snapshots/decision-1-pre.raw.json");
    expect(savedRecord.postState.rawStateRef).toBe("snapshots/decision-1-post.raw.json");
    expect(savedRecord.llm.responseRef).toBe("responses/decision-1.response.json");
  });
});
