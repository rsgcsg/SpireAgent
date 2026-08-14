import { describe, expect, it } from "vitest";
import { buildBaselineReport } from "../src/evaluation/baselineReport.js";
import type { ExecutableGameAction } from "../src/domain/actions/action.js";
import type { DecisionRecord, RunMetadata, RunSummary } from "../src/recording/types.js";

describe("M1 baseline report", () => {
  it("joins exact identity and redacted run metrics without granting authority", () => {
    const report = buildBaselineReport(metadata(true), [record()], summary());

    expect(report).toMatchObject({
      source: "local_run_artifacts_read_only",
      authorityEffect: "none",
      identityStatus: "exact",
      evidence: { completedGame: true, termination: "completed_run_boundary" },
      metrics: {
        decisionCount: 1,
        outcomes: { executed_and_settled: 1 },
        contexts: { combat: 1 },
        surfaces: { player_environment: 1 },
        selectedActions: { end_turn: 1 },
        prompt: { totalUserBytes: 200, averageUserBytes: 200 },
        provider: { attemptCount: 1, totalTokens: 12, invalidSessions: 0 }
      }
    });
    expect(report.identityDigest).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(report.limitations).toContain(
      "report_is_read_only_and_does_not_change_player_environment_authority"
    );
    expect(JSON.stringify(report)).not.toContain("secret model response");
  });

  it("keeps old run records usable while naming the missing source identity", () => {
    const report = buildBaselineReport(metadata(false), [record()], undefined);

    expect(report.identityStatus).toBe("incomplete");
    expect(report.missingIdentityFields).toContain("agent.sourceRevision");
    expect(report.limitations).toEqual(expect.arrayContaining([
      "exact_baseline_identity_incomplete",
      "unrecorded_provenance_is_coverage_only",
      "run_summary_not_recorded"
    ]));
  });
});

function metadata(withRevision: boolean): RunMetadata {
  return {
    metadataSchemaVersion: 1,
    runId: "run-baseline",
    startedAt: "2026-01-01T00:00:00.000Z",
    agentVersion: "0.1.0",
    ...(withRevision ? {
      agentSource: {
        revision: "a".repeat(40),
        sourceDigest: "f".repeat(64),
        worktreeStatus: "clean" as const,
        declaredBy: "runtime_environment" as const
      }
    } : {}),
    adapter: {
      adapterId: "sts2mcp-rest-negotiated",
      endpoint: "http://127.0.0.1:15526",
      capabilities: {},
      negotiated: {
        connector_protocol_version: "1.0.0",
        host_artifact_sha256: "b".repeat(64),
        host_module_version_id: "mvid",
        host_runtime_instance_id: "epoch",
        environment_fingerprint: "environment",
        game_version: "v0.test",
        game_commit: "commit",
        main_assembly_hash: 123,
        modset_status: "exact_player_environment_only",
        modset_fingerprint: "c".repeat(64),
        runtime_patch_digest: "e".repeat(64)
      }
    },
    provider: { provider: "deepseek", model: "test", thinkingMode: "disabled", maxOutputTokens: 320 },
    evidence: {
      provenance: "unrecorded",
      declaredBy: "runtime_configuration"
    },
    schemas: { normalizedState: 29, prompt: 3, decisionRecord: 2 }
  };
}

function record(): DecisionRecord<ExecutableGameAction> {
  const attempt = {
    requestKind: "primary" as const,
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:00.010Z",
    latencyMs: 10,
    outcome: "valid_json" as const,
    requestBodyRedacted: {},
    requestBodyHash: "sha256:request",
    rawResponseText: "secret model response",
    usage: { promptTokens: 10, completionTokens: 2, totalTokens: 12 }
  };
  return {
    recordSchemaVersion: 2,
    decisionId: "decision-1",
    runId: "run-baseline",
    tick: 1,
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:00.020Z",
    preState: {
      rawStateRef: "pre.json",
      normalizedState: { context: { kind: "combat" }, surface: { kind: "player_environment" } } as never,
      stateHash: "state",
      normalizedStateHash: "normalized",
      diagnostics: {} as never
    },
    allowedActions: [{
      id: "action-end",
      kind: "end_turn",
      label: "End turn",
      action: {
        kind: "bound_action",
        choiceId: "action-end",
        expectedSnapshotId: "snapshot",
        boundActionId: "action-end"
      },
      sourceStateHash: "state"
    }],
    prompt: {
      promptRef: "prompt.json",
      globalPromptId: "global",
      globalPromptVersion: 1,
      stateGuideId: "combat",
      stateGuideVersion: 3,
      systemPromptHash: "sha256:system",
      userPromptHash: "sha256:user",
      systemPromptBytes: 100,
      userPromptBytes: 200
    },
    llm: {
      provider: "deepseek",
      model: "test",
      session: { provider: "deepseek", model: "test", attempts: [attempt], finalAttempt: attempt },
      validation: { valid: true, outcome: "valid" }
    },
    execution: { attempted: true, selectedActionId: "action-end", stateHashMatchedBeforeExecution: true },
    settlement: { status: "settled", polls: 1, elapsedMs: 10 },
    outcome: "executed_and_settled"
  };
}

function summary(): RunSummary {
  return {
    summarySchemaVersion: 1,
    runId: "run-baseline",
    endedAt: "2026-01-01T00:00:01.000Z",
    decisionCount: 1,
    termination: "completed_run_boundary",
    completedGame: true,
    terminalOutcome: "executed_and_settled",
    terminalStopReason: "run_boundary",
    maxTicks: 1000
  };
}
