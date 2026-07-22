import { createHash } from "node:crypto";
import type { JsonRecord, ProviderExperimentFingerprint } from "../domain/types.js";
import { isRecord } from "../agent/utils.js";

export interface ProviderExperimentIdentityComparison {
  exact: boolean;
  status: "exact" | "partial" | "not_recorded";
  reasons: string[];
}

/**
 * Builds a secret-free identity for a provider experiment. The identity is
 * intentionally stricter than a display profile: a human-readable profile
 * string cannot prove model or recovery-contract equivalence.
 */
export function buildProviderExperimentFingerprint(input: {
  provider?: unknown;
  providerSource?: unknown;
  model?: unknown;
  responseMode?: unknown;
  thinkingMode?: unknown;
  maxOutputTokens?: unknown;
  retryCount?: unknown;
  recoveryPolicyName?: unknown;
  attempts?: unknown;
}): ProviderExperimentFingerprint {
  const attempts = Array.isArray(input.attempts) ? input.attempts.filter(isRecord) : [];
  const primaryAttemptProfile = attemptProfile(attempts, "primary");
  const rescueAttemptProfile = attemptProfile(attempts, "rescue");
  const fingerprint: ProviderExperimentFingerprint = {
    schemaVersion: 1,
    provider: stringValue(input.provider),
    providerSource: stringValue(input.providerSource),
    model: stringValue(input.model),
    responseMode: stringValue(input.responseMode),
    thinkingMode: stringValue(input.thinkingMode),
    maxOutputTokens: positiveNumber(input.maxOutputTokens),
    retryCount: nonNegativeNumber(input.retryCount),
    recoveryPolicyName: stringValue(input.recoveryPolicyName),
    primaryAttemptProfile,
    rescueAttemptProfile,
    identityStatus: "unknown",
    notes: []
  };
  const missing = missingIdentityFields(fingerprint);
  fingerprint.identityStatus = missing.length === 0 ? "complete" : missing.length >= 6 ? "unknown" : "partial";
  fingerprint.notes.push(...missing.map((field) => `missing_${field}`));
  if (attempts.length === 0) fingerprint.notes.push("provider_attempts_not_recorded");
  fingerprint.fingerprintHash = hashFingerprint({
    provider: fingerprint.provider,
    providerSource: fingerprint.providerSource,
    model: fingerprint.model,
    responseMode: fingerprint.responseMode,
    thinkingMode: fingerprint.thinkingMode,
    maxOutputTokens: fingerprint.maxOutputTokens,
    retryCount: fingerprint.retryCount,
    recoveryPolicyName: fingerprint.recoveryPolicyName,
    primaryAttemptProfile: fingerprint.primaryAttemptProfile,
    rescueAttemptProfile: fingerprint.rescueAttemptProfile
  });
  return fingerprint;
}

export function buildProviderExperimentFingerprintFromTransition(transition: JsonRecord): ProviderExperimentFingerprint {
  const shadow = isRecord(transition.shadowWorkspaceDecision) ? transition.shadowWorkspaceDecision : {};
  const audit = isRecord(transition.decisionAudit) ? transition.decisionAudit : {};
  const rawAudit = isRecord(audit.raw) ? audit.raw : {};
  const llm = isRecord(rawAudit.llm) ? rawAudit.llm : {};
  return buildProviderExperimentFingerprint({
    provider: shadow.provider,
    // A same-slice baseline is a workspace-provider experiment even if the
    // enclosing transition also carried a separate live-command audit.
    providerSource: shadow.called === true ? "workspace_shadow" : llm.providerSource ?? shadow.provider,
    model: shadow.model,
    responseMode: shadow.providerMode,
    thinkingMode: shadow.providerThinkingMode,
    maxOutputTokens: shadow.maxOutputTokens,
    retryCount: shadow.retryCount,
    recoveryPolicyName: shadow.providerRecoveryPolicyName,
    attempts: shadow.providerAttempts
  });
}

export function compareProviderExperimentFingerprints(
  baseline: ProviderExperimentFingerprint | undefined,
  overlay: ProviderExperimentFingerprint | undefined
): ProviderExperimentIdentityComparison {
  if (!baseline || !overlay) {
    return {
      exact: false,
      status: "not_recorded",
      reasons: ["provider_experiment_fingerprint_not_recorded"]
    };
  }
  if (baseline.identityStatus !== "complete" || overlay.identityStatus !== "complete") {
    return {
      exact: false,
      status: "partial",
      reasons: ["provider_experiment_fingerprint_incomplete"]
    };
  }
  if (!baseline.fingerprintHash || !overlay.fingerprintHash || baseline.fingerprintHash !== overlay.fingerprintHash) {
    return {
      exact: false,
      status: "partial",
      reasons: ["provider_experiment_fingerprint_mismatch"]
    };
  }
  return { exact: true, status: "exact", reasons: [] };
}

function attemptProfile(attempts: JsonRecord[], requestKind: "primary" | "rescue"): JsonRecord {
  const matching = attempts.filter((attempt) => attempt.requestKind === requestKind);
  const maxOutputTokens = uniqueNumbers(matching.map((attempt) => attempt.requestMaxOutputTokens));
  const thinkingModes = uniqueStrings(matching.map((attempt) => attempt.requestedThinkingMode));
  const rescueModes = uniqueStrings(matching.map((attempt) => attempt.rescueMode));
  return {
    attempts: matching.length,
    maxOutputTokens,
    thinkingModes,
    ...(requestKind === "rescue" ? { rescueModes } : {})
  };
}

function missingIdentityFields(fingerprint: ProviderExperimentFingerprint): string[] {
  const missing: string[] = [];
  if (!fingerprint.provider) missing.push("provider");
  if (!fingerprint.providerSource) missing.push("provider_source");
  if (!fingerprint.model) missing.push("model");
  if (!fingerprint.responseMode) missing.push("response_mode");
  if (!fingerprint.thinkingMode) missing.push("thinking_mode");
  if (!fingerprint.maxOutputTokens) missing.push("max_output_tokens");
  if (fingerprint.retryCount === undefined) missing.push("retry_count");
  if (!fingerprint.recoveryPolicyName) missing.push("recovery_policy");
  const primaryAttempts = isRecord(fingerprint.primaryAttemptProfile)
    ? fingerprint.primaryAttemptProfile.attempts
    : undefined;
  if (typeof primaryAttempts !== "number" || primaryAttempts < 1) missing.push("primary_attempt_profile");
  return missing;
}

function hashFingerprint(value: JsonRecord): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, 256) : undefined;
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function nonNegativeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))].sort();
}

function uniqueNumbers(values: unknown[]): number[] {
  return [...new Set(values.filter((value): value is number => typeof value === "number" && Number.isFinite(value)))].sort((a, b) => a - b);
}
