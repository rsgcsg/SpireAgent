import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type {
  JsonRecord,
  LearningProposalEnvironmentScope,
  PolicyArtifact,
  PolicyChangeEvent,
  PolicyRetrievalTrace,
  PolicyRollbackSnapshot
} from "../domain/types.js";
import { appendJsonl, isRecord, nowIso, stableId } from "../agent/utils.js";
import { evaluateProtectedStableWriteAuthorization } from "../agent/protectedPathGate.js";

export const POLICY_ARTIFACTS_FILE = "policy-artifacts.jsonl";
export const POLICY_CHANGE_EVENTS_FILE = "policy-change-events.jsonl";
export const POLICY_ROLLBACK_SNAPSHOTS_FILE = "policy-rollback-snapshots.jsonl";

export interface ChangeKernelSurface {
  schemaVersion: number;
  surface: "p9_g3a_change_kernel";
  artifacts: number;
  disabled: number;
  quarantined: number;
  events: number;
  rollbackSnapshots: number;
  malformedArtifactLines: number;
  malformedEventLines: number;
  malformedRollbackSnapshotLines: number;
  activationEnabled: false;
  stableWriteEnabled: false;
  notes: string[];
}

export function createDisabledPolicyArtifact(input: {
  semanticKey: string;
  proposalId?: string;
  behaviorImpact: string;
  payload: JsonRecord;
  environmentScope: LearningProposalEnvironmentScope;
  providerExperimentFingerprintHash?: string;
  protectedTargets: string[];
}): PolicyArtifact {
  const payload = isRecord(input.payload) ? input.payload : {};
  const semanticKey = input.semanticKey.trim();
  const scopeIsExactAndNamed = input.environmentScope.scopeStatus === "exact" && input.environmentScope.fingerprintHashes.length > 0;
  const providerExperimentFingerprintHash = input.providerExperimentFingerprintHash?.trim();
  const quarantineReason = !semanticKey
    ? "artifact_semantic_key_missing"
    : !scopeIsExactAndNamed
      ? "artifact_environment_scope_not_exact"
      : !providerExperimentFingerprintHash
        ? "artifact_provider_experiment_identity_missing"
      : undefined;
  return {
    schemaVersion: 1,
    id: stableId("policy-artifact"),
    semanticKey,
    proposalId: input.proposalId,
    behaviorImpact: input.behaviorImpact,
    version: 1,
    payload,
    environmentScope: input.environmentScope,
    providerExperimentFingerprintHash,
    protectedTargets: [...new Set(input.protectedTargets)],
    contentHash: hashJson({ semanticKey: input.semanticKey, payload, environmentScope: input.environmentScope }),
    status: quarantineReason ? "quarantined" : "disabled",
    quarantineReason,
    createdAt: nowIso(),
    activationEnabled: false,
    stableWriteEnabled: false
  };
}

export function appendPolicyArtifact(runDir: string, artifact: PolicyArtifact): PolicyArtifact {
  appendJsonl(path.join(runDir, POLICY_ARTIFACTS_FILE), artifact);
  return artifact;
}

export function appendPolicyChangeEvent(runDir: string, input: Omit<PolicyChangeEvent, "schemaVersion" | "id" | "createdAt" | "activationEnabled" | "stableWriteEnabled">): PolicyChangeEvent {
  const event: PolicyChangeEvent = {
    schemaVersion: 1,
    id: stableId("policy-event"),
    ...input,
    evidenceIds: [...new Set(input.evidenceIds)],
    createdAt: nowIso(),
    activationEnabled: false,
    stableWriteEnabled: false
  };
  appendJsonl(path.join(runDir, POLICY_CHANGE_EVENTS_FILE), event);
  return event;
}

export function simulatePolicyRollback(runDir: string, artifact: PolicyArtifact): PolicyRollbackSnapshot {
  const snapshot: PolicyRollbackSnapshot = {
    schemaVersion: 1,
    id: stableId("policy-rollback"),
    artifactId: artifact.id,
    artifactContentHash: artifact.contentHash,
    rollbackMode: "simulation_only",
    reversible: true,
    createdAt: nowIso(),
    activationEnabled: false,
    stableWriteEnabled: false
  };
  appendJsonl(path.join(runDir, POLICY_ROLLBACK_SNAPSHOTS_FILE), snapshot);
  appendPolicyChangeEvent(runDir, {
    artifactId: artifact.id,
    kind: "rollback_simulated",
    actor: "system",
    reason: "g3a_simulation_only_no_policy_activation_or_write",
    evidenceIds: []
  });
  return snapshot;
}

export function dryRunPolicyRetrieval(
  artifact: PolicyArtifact,
  environmentFingerprintHash?: string,
  providerExperimentFingerprintHash?: string
): PolicyRetrievalTrace {
  const scope = artifact.environmentScope;
  const environmentExact = scope.scopeStatus === "exact" && Boolean(environmentFingerprintHash) && scope.fingerprintHashes.includes(environmentFingerprintHash!);
  const providerExact = Boolean(providerExperimentFingerprintHash) && artifact.providerExperimentFingerprintHash === providerExperimentFingerprintHash;
  const exact = environmentExact && providerExact;
  const quarantine = artifact.status === "quarantined";
  return {
    schemaVersion: 1,
    artifactId: artifact.id,
    environmentFingerprintHash,
    applicability: quarantine ? "quarantined" : exact ? "exact_match" : scope.scopeStatus === "unknown" ? "unknown_scope" : "scope_mismatch",
    result: quarantine ? "quarantined" : exact ? "disabled_no_activation" : "scope_mismatch",
    reasons: quarantine
      ? ["artifact_quarantined"]
      : exact
        ? ["g3a_retrieval_dry_run_activation_disabled"]
        : [environmentExact ? "provider_experiment_identity_not_exact_match" : "environment_scope_not_exact_match"],
    createdAt: nowIso(),
    activationEnabled: false,
    stableWriteEnabled: false
  };
}

export function assessChangeKernelActivation(): JsonRecord {
  const protectedGate = evaluateProtectedStableWriteAuthorization({ origin: "p9_stable_promotion" });
  return {
    schemaVersion: 1,
    activationEnabled: false,
    stableWriteEnabled: false,
    protectedGate,
    reasons: ["g3a_infrastructure_only", "g3b_policy_qualification_not_authorized", "g3c_activation_not_authorized"]
  };
}

export function readChangeKernelSurface(runDir: string): ChangeKernelSurface {
  const artifacts = readJsonl(path.join(runDir, POLICY_ARTIFACTS_FILE));
  const events = readJsonl(path.join(runDir, POLICY_CHANGE_EVENTS_FILE));
  const snapshots = readJsonl(path.join(runDir, POLICY_ROLLBACK_SNAPSHOTS_FILE));
  return {
    schemaVersion: 1,
    surface: "p9_g3a_change_kernel",
    artifacts: artifacts.records.length,
    disabled: artifacts.records.filter((item) => item.status === "disabled").length,
    quarantined: artifacts.records.filter((item) => item.status === "quarantined").length,
    events: events.records.length,
    rollbackSnapshots: snapshots.records.length,
    malformedArtifactLines: artifacts.malformedLines,
    malformedEventLines: events.malformedLines,
    malformedRollbackSnapshotLines: snapshots.malformedLines,
    activationEnabled: false,
    stableWriteEnabled: false,
    notes: ["run_local_append_only", "no_active_policy_retrieval", "no_stable_write_path", "malformed_lines_are_visible_and_promotion_ineligible"]
  };
}

function readJsonl(filePath: string): { records: JsonRecord[]; malformedLines: number } {
  if (!existsSync(filePath)) return { records: [], malformedLines: 0 };
  let malformedLines = 0;
  const records = readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try {
      const parsed = JSON.parse(line);
      if (isRecord(parsed)) return [parsed];
    } catch {
      // Count malformed input instead of silently granting a clean audit view.
    }
    malformedLines += 1;
    return [];
  });
  return { records, malformedLines };
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}
