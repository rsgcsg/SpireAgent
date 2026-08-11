import { createHash } from "node:crypto";
import { isJsonObject, type JsonObject } from "../shared/json.js";
import { listRunIds, readRunMetadata, readRunRecords, readRunSummary } from "../recording/fileDecisionRecorder.js";
import type { DecisionRecord, RunMetadata, RunSummary } from "../recording/types.js";

interface BaselineIdentity {
  agent: { sourceRevision: string | null; sourceDigest: string | null };
  connector: {
    protocolVersion: string | null;
    assemblySha256: string | null;
    moduleVersionId: string | null;
    runtimeInstanceId: string | null;
  };
  game: { version: string | null; commit: string | null; mainAssemblyHash: number | null };
  environment: {
    modsetStatus: string | null;
    modsetFingerprint: string | null;
    permissionPolicyDigest: string | null;
    runtimePatchDigest: string | null;
  };
}

/**
 * Builds a non-authorizing, content-redacted report from append-only local run
 * evidence. It never opens the Gateway, invokes a provider, or changes policy.
 */
export async function createBaselineReport(dataRoot: string, requestedRunId?: string) {
  const runIds = await listRunIds(dataRoot);
  const runId = requestedRunId ?? runIds.at(-1);
  if (!runId) throw new Error(`No runs found in ${dataRoot}`);
  if (!runIds.includes(runId)) throw new Error(`Run not found: ${runId}`);
  return buildBaselineReport(
    await readRunMetadata(dataRoot, runId),
    await readRunRecords(dataRoot, runId),
    await readRunSummary(dataRoot, runId)
  );
}

export function buildBaselineReport(
  metadata: RunMetadata,
  records: readonly DecisionRecord<{ kind: string }>[],
  summary: RunSummary | undefined
) {
  const negotiated = isJsonObject(metadata.adapter.negotiated) ? metadata.adapter.negotiated : {};
  const identity = {
    agent: {
      version: metadata.agentVersion,
      sourceRevision: metadata.agentSource?.revision ?? null,
      sourceDigest: metadata.agentSource?.sourceDigest ?? null,
      worktreeStatus: metadata.agentSource?.worktreeStatus ?? "not_recorded",
      sourceRevisionDeclaredBy: metadata.agentSource?.declaredBy ?? "not_recorded"
    },
    provider: metadata.provider,
    connector: {
      adapterId: metadata.adapter.adapterId,
      adapterVersion: metadata.adapter.adapterVersion ?? null,
      protocolVersion: stringField(negotiated, "bridge_protocol_version"),
      assemblySha256: stringField(negotiated, "host_artifact_sha256")
        ?? stringField(negotiated, "bridge_assembly_file_sha256"),
      moduleVersionId: stringField(negotiated, "host_module_version_id")
        ?? stringField(negotiated, "bridge_module_version_id"),
      runtimeInstanceId: stringField(negotiated, "host_runtime_instance_id")
        ?? stringField(negotiated, "bridge_runtime_instance_id")
    },
    game: {
      version: stringField(negotiated, "game_version"),
      commit: stringField(negotiated, "game_commit"),
      mainAssemblyHash: numberField(negotiated, "main_assembly_hash")
    },
    environment: {
      modsetStatus: stringField(negotiated, "modset_status"),
      modsetFingerprint: stringField(negotiated, "modset_fingerprint"),
      compatibilityPolicyId: stringField(negotiated, "compatibility_policy_id"),
      compatibilityPolicyDigest: stringField(negotiated, "compatibility_policy_digest"),
      permissionMode: stringField(negotiated, "permission_mode"),
      permissionPolicyId: stringField(negotiated, "permission_policy_id"),
      permissionPolicyDigest: stringField(negotiated, "permission_policy_digest"),
      runtimePatchStatus: stringField(negotiated, "runtime_patch_status"),
      runtimePatchDigest: stringField(negotiated, "runtime_patch_digest")
    },
    schemas: metadata.schemas
  };
  const missingIdentityFields = findMissingIdentityFields(identity);
  const prompts = records.flatMap((record) => record.prompt ? [record.prompt] : []);
  const attempts = records.flatMap((record) => record.llm?.session.attempts ?? []);
  const promptBytes = prompts.map((prompt) => prompt.userPromptBytes);
  const latencies = attempts.map((attempt) => attempt.latencyMs);
  const limitations = [
    ...(missingIdentityFields.length > 0 ? ["exact_baseline_identity_incomplete"] : []),
    ...(metadata.evidence.provenance === "unrecorded" ? ["unrecorded_provenance_is_coverage_only"] : []),
    ...(!summary ? ["run_summary_not_recorded"] : []),
    "strategic_quality_not_evaluated",
    "report_does_not_grant_permission_or_qualification"
  ];

  return {
    schemaVersion: 1 as const,
    source: "local_run_artifacts_read_only" as const,
    authorizationEffect: "none" as const,
    qualificationEffect: "none" as const,
    runId: metadata.runId,
    identityStatus: missingIdentityFields.length === 0 ? "exact" as const : "incomplete" as const,
    identityDigest: `sha256:${createHash("sha256").update(JSON.stringify(identity)).digest("hex")}`,
    missingIdentityFields,
    identity,
    evidence: {
      provenance: metadata.evidence.provenance,
      qualificationUse: metadata.evidence.qualificationUse,
      startedAt: metadata.startedAt,
      endedAt: summary?.endedAt ?? null,
      termination: summary?.termination ?? "not_recorded",
      completedGame: summary?.completedGame ?? false,
      terminalOutcome: summary?.terminalOutcome ?? records.at(-1)?.outcome ?? "not_recorded",
      terminalStopReason: summary?.terminalStopReason ?? null
    },
    metrics: {
      decisionCount: records.length,
      outcomes: counts(records.map((record) => record.outcome)),
      contexts: counts(records.map((record) => record.preState?.normalizedState.context.kind ?? "not_recorded")),
      surfaces: counts(records.map((record) => record.preState?.normalizedState.surface.kind ?? "not_recorded")),
      selectedActions: counts(records.map(selectedActionKind)),
      settlement: counts(records.map((record) => record.settlement?.status ?? "not_applicable")),
      prompt: {
        count: prompts.length,
        totalUserBytes: sum(promptBytes),
        averageUserBytes: average(promptBytes),
        minUserBytes: minimum(promptBytes),
        maxUserBytes: maximum(promptBytes),
        globalContracts: unique(prompts.map((prompt) => `${prompt.globalPromptId}@${prompt.globalPromptVersion}`)),
        stateGuides: unique(prompts.map((prompt) => `${prompt.stateGuideId}@${prompt.stateGuideVersion}`)),
        systemPromptHashes: unique(prompts.map((prompt) => prompt.systemPromptHash))
      },
      provider: {
        decisionSessions: records.filter((record) => record.llm !== undefined).length,
        attemptCount: attempts.length,
        attemptOutcomes: counts(attempts.map((attempt) => attempt.outcome)),
        totalLatencyMs: sum(latencies),
        averageLatencyMs: average(latencies),
        minLatencyMs: minimum(latencies),
        maxLatencyMs: maximum(latencies),
        promptTokens: sum(attempts.map((attempt) => attempt.usage?.promptTokens ?? 0)),
        completionTokens: sum(attempts.map((attempt) => attempt.usage?.completionTokens ?? 0)),
        totalTokens: sum(attempts.map((attempt) => attempt.usage?.totalTokens ?? 0)),
        invalidSessions: records.filter((record) => record.llm && !record.llm.validation.valid).length
      }
    },
    limitations
  };
}

function selectedActionKind(record: DecisionRecord<{ kind: string }>): string {
  if (!record.execution.selectedActionId) return "not_selected";
  return record.allowedActions.find((action) => action.id === record.execution.selectedActionId)?.kind ?? "unknown_selected_action";
}

function stringField(value: JsonObject, key: string): string | null {
  return typeof value[key] === "string" ? value[key] : null;
}

function numberField(value: JsonObject, key: string): number | null {
  return typeof value[key] === "number" && Number.isFinite(value[key]) ? value[key] : null;
}

function findMissingIdentityFields(identity: BaselineIdentity): string[] {
  const required: [string, unknown][] = [
    ["agent.sourceRevision", identity.agent.sourceRevision],
    ["agent.sourceDigest", identity.agent.sourceDigest],
    ["connector.protocolVersion", identity.connector.protocolVersion],
    ["connector.assemblySha256", identity.connector.assemblySha256],
    ["connector.moduleVersionId", identity.connector.moduleVersionId],
    ["connector.runtimeInstanceId", identity.connector.runtimeInstanceId],
    ["game.version", identity.game.version],
    ["game.commit", identity.game.commit],
    ["game.mainAssemblyHash", identity.game.mainAssemblyHash],
    ["environment.modsetStatus", identity.environment.modsetStatus],
    ["environment.modsetFingerprint", identity.environment.modsetFingerprint],
    ["environment.permissionPolicyDigest", identity.environment.permissionPolicyDigest],
    ["environment.runtimePatchDigest", identity.environment.runtimePatchDigest]
  ];
  return required.filter(([, value]) => value === null || value === "").map(([path]) => path);
}

function counts(values: readonly string[]): Record<string, number> {
  const result = new Map<string, number>();
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1);
  return Object.fromEntries([...result].sort(([left], [right]) => left.localeCompare(right)));
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: readonly number[]): number | null {
  return values.length > 0 ? Math.round(sum(values) / values.length) : null;
}

function minimum(values: readonly number[]): number | null {
  return values.length > 0 ? Math.min(...values) : null;
}

function maximum(values: readonly number[]): number | null {
  return values.length > 0 ? Math.max(...values) : null;
}
