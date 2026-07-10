import type { JsonRecord } from "../domain/types.js";
import { assessReasonQuality } from "../agent/providerFailureClassifier.js";
import { isRecord } from "../agent/utils.js";
import type { LearningProposalShadowWorkspaceComparison } from "./shadowApplicator.js";

export interface ShadowWorkspaceOutcomeEvidence {
  source: "recorded_shadow" | "same_slice_shadow";
  transitionId: string;
  promptHash: string;
  allowedCandidateIdsHash: string;
  candidateFutureFactsHash: string;
  revisionTag: string;
  budgetWindow: string;
  providerProfile: string;
  providerAttempts?: ShadowWorkspaceProviderAttempt[];
  outcome: "valid" | "invalid_output" | "invalid_choice" | "error" | "unavailable" | "skipped";
  selectedCandidateId?: string;
  reason?: string;
  failureBucket?: string;
  finishReason?: string;
  outputCapHit?: boolean;
}

export interface ShadowWorkspaceProviderAttempt {
  requestKind: "primary" | "rescue";
  rescueMode?: "empty" | "truncation";
  requestMaxOutputTokens?: number;
  requestedThinkingMode?: string;
  finishReason?: string;
  contentKind?: string;
}

export interface LearningProposalShadowEvaluation {
  schemaVersion: number;
  surface: "p9_shadow_workspace_evaluation";
  proposalId: string;
  status: "incomplete" | "regression_detected" | "paired_evidence_ready_for_review";
  blockers: string[];
  observations: string[];
  baselineReasonQuality?: string;
  overlayReasonQuality?: string;
  baselineReasonNotes?: string[];
  overlayReasonNotes?: string[];
  selectedCandidateAgreement?: "same" | "different" | "not_observed";
  providerProfileMatches: boolean;
  candidateFactsPreserved: boolean;
  allowedCandidatesPreserved: boolean;
  sameEvidenceSlice: boolean;
  eligibleForHumanShadowReview: boolean;
  proposalStatusMutationEnabled: false;
  shadowValidated: false;
  stablePromotionEnabled: false;
  notes: string[];
}

/**
 * Evaluates paired evidence only. It never invokes a provider, writes a run
 * artifact, or changes proposal status. A clean pair is review evidence, not
 * a shadow-validated policy.
 */
export function evaluateLearningProposalShadowPair(input: {
  comparison: LearningProposalShadowWorkspaceComparison;
  baseline: ShadowWorkspaceOutcomeEvidence;
  overlay?: ShadowWorkspaceOutcomeEvidence;
}): LearningProposalShadowEvaluation {
  const blockers: string[] = [];
  const observations: string[] = [];
  const overlay = input.overlay;
  const candidateFactsPreserved = input.comparison.applied &&
    input.comparison.overlay?.candidateFutureFactsHash === input.comparison.baseline.candidateFutureFactsHash;
  const allowedCandidatesPreserved = input.comparison.applied &&
    input.comparison.overlay?.allowedCandidateIdsHash === input.comparison.baseline.allowedCandidateIdsHash;

  if (!input.comparison.applied || !input.comparison.overlay) blockers.push("offline_shadow_overlay_not_assembled");
  if (!candidateFactsPreserved) blockers.push("candidate_future_facts_changed");
  if (!allowedCandidatesPreserved) blockers.push("allowed_candidate_set_changed");
  if (!overlay) blockers.push("overlay_shadow_outcome_missing");
  if (input.baseline.source !== "recorded_shadow") blockers.push("baseline_source_not_recorded_shadow");
  if (overlay && overlay.source !== "same_slice_shadow") blockers.push("overlay_source_not_same_slice_shadow");

  const providerProfileMatches = overlay !== undefined && input.baseline.providerProfile === overlay.providerProfile;
  if (overlay && !providerProfileMatches) blockers.push("provider_profile_mismatch");
  const sameEvidenceSlice = overlay !== undefined && input.comparison.overlay !== undefined &&
    input.baseline.transitionId === overlay.transitionId &&
    input.baseline.revisionTag === overlay.revisionTag &&
    input.baseline.budgetWindow === overlay.budgetWindow &&
    providerProfileMatches &&
    input.baseline.allowedCandidateIdsHash === overlay.allowedCandidateIdsHash &&
    input.baseline.candidateFutureFactsHash === overlay.candidateFutureFactsHash &&
    input.baseline.promptHash === input.comparison.baseline.promptHash &&
    overlay.promptHash === input.comparison.overlay.promptHash;
  if (overlay && !sameEvidenceSlice) blockers.push("same_evidence_slice_invariants_failed");

  validateOutcome("baseline", input.baseline, input.comparison.baseline, blockers);
  if (overlay && input.comparison.overlay) validateOutcome("overlay", overlay, input.comparison.overlay, blockers);

  const baselineAssessment = reasonAssessment(input.baseline.reason);
  const overlayAssessment = reasonAssessment(overlay?.reason);
  if (baselineAssessment.quality === "missing") blockers.push("baseline_reason_missing");
  if (overlay && baselineAssessment.quality === "adequate" && overlayAssessment.quality !== "adequate") {
    blockers.push("reason_quality_regressed");
  }
  if (overlay && overlayAssessment.quality === "missing") blockers.push("overlay_reason_missing");
  if (overlay && input.baseline.selectedCandidateId && overlay.selectedCandidateId) {
    observations.push(input.baseline.selectedCandidateId === overlay.selectedCandidateId
      ? "selected_candidate_same"
      : "selected_candidate_different_not_automatically_a_regression");
  }
  if (candidateFactsPreserved && allowedCandidatesPreserved) {
    observations.push("candidate_and_fact_invariants_preserved");
  }

  const regression = blockers.some((blocker) =>
    blocker === "candidate_future_facts_changed" ||
    blocker === "allowed_candidate_set_changed" ||
    blocker === "reason_quality_regressed" ||
    blocker === "overlay_reason_missing" ||
    blocker.endsWith("_invalid") ||
    blocker.endsWith("_provider_failure") ||
    blocker.endsWith("_finish_reason_not_stop") ||
    blocker.endsWith("_output_cap_hit") ||
    blocker.endsWith("_selected_candidate_not_allowed")
  );
  const complete = blockers.length === 0 && Boolean(overlay);
  return {
    schemaVersion: 1,
    surface: "p9_shadow_workspace_evaluation",
    proposalId: input.comparison.proposalId,
    status: regression ? "regression_detected" : complete ? "paired_evidence_ready_for_review" : "incomplete",
    blockers,
    observations,
    baselineReasonQuality: baselineAssessment.quality,
    overlayReasonQuality: overlay ? overlayAssessment.quality : undefined,
    baselineReasonNotes: baselineAssessment.notes,
    overlayReasonNotes: overlay ? overlayAssessment.notes : undefined,
    selectedCandidateAgreement: !overlay || !input.baseline.selectedCandidateId || !overlay.selectedCandidateId
      ? "not_observed"
      : input.baseline.selectedCandidateId === overlay.selectedCandidateId ? "same" : "different",
    providerProfileMatches,
    candidateFactsPreserved,
    allowedCandidatesPreserved,
    sameEvidenceSlice,
    eligibleForHumanShadowReview: complete,
    proposalStatusMutationEnabled: false,
    shadowValidated: false,
    stablePromotionEnabled: false,
    notes: [
      "Paired evidence ready for review is not a shadow_validated proposal status.",
      "Reason quality is a smoke alarm; strategic quality still needs replay/eval and counterexample review.",
      "This evaluator cannot call a provider, apply a proposal, promote stable policy, or alter live behavior."
    ]
  };
}

export function parseSameSliceShadowOutcomeEvidence(value: unknown): ShadowWorkspaceOutcomeEvidence | undefined {
  if (!isRecord(value)) return undefined;
  const source = value.source;
  const outcome = value.outcome;
  if ((source !== "recorded_shadow" && source !== "same_slice_shadow") ||
    !isOutcome(outcome) ||
    !requiredString(value.transitionId) ||
    !requiredString(value.promptHash) ||
    !requiredString(value.allowedCandidateIdsHash) ||
    !requiredString(value.candidateFutureFactsHash) ||
    !requiredString(value.revisionTag) ||
    !requiredString(value.budgetWindow)) {
    return undefined;
  }
  return {
    source,
    transitionId: value.transitionId,
    promptHash: value.promptHash,
    allowedCandidateIdsHash: value.allowedCandidateIdsHash,
    candidateFutureFactsHash: value.candidateFutureFactsHash,
    revisionTag: value.revisionTag,
    budgetWindow: value.budgetWindow,
    providerProfile: requiredString(value.providerProfile) ? value.providerProfile : "unknown",
    providerAttempts: parseProviderAttempts(value.providerAttempts),
    outcome,
    selectedCandidateId: optionalString(value.selectedCandidateId),
    reason: optionalString(value.reason),
    failureBucket: optionalString(value.failureBucket),
    finishReason: optionalString(value.finishReason),
    outputCapHit: value.outputCapHit === true
  };
}

function validateOutcome(
  label: "baseline" | "overlay",
  outcome: ShadowWorkspaceOutcomeEvidence,
  artifact: LearningProposalShadowWorkspaceComparison["baseline"],
  blockers: string[]
): void {
  if (outcome.outcome !== "valid") blockers.push(`${label}_outcome_invalid`);
  if (outcome.failureBucket && outcome.failureBucket !== "none") blockers.push(`${label}_provider_failure`);
  if (outcome.finishReason && outcome.finishReason !== "stop") blockers.push(`${label}_finish_reason_not_stop`);
  if (outcome.outputCapHit) blockers.push(`${label}_output_cap_hit`);
  if (!outcome.selectedCandidateId) blockers.push(`${label}_selected_candidate_missing`);
  if (outcome.selectedCandidateId && !artifact.allowedCandidateIds.includes(outcome.selectedCandidateId)) {
    blockers.push(`${label}_selected_candidate_not_allowed`);
  }
  if (outcome.promptHash !== artifact.promptHash) blockers.push(`${label}_prompt_hash_mismatch`);
  if (outcome.allowedCandidateIdsHash !== artifact.allowedCandidateIdsHash) blockers.push(`${label}_allowed_candidate_hash_mismatch`);
  if (outcome.candidateFutureFactsHash !== artifact.candidateFutureFactsHash) blockers.push(`${label}_candidate_future_facts_hash_mismatch`);
}

function reasonAssessment(reason: unknown): { quality: "missing" | "thin" | "adequate"; notes: string[] } {
  return assessReasonQuality(reason);
}

function isOutcome(value: unknown): value is ShadowWorkspaceOutcomeEvidence["outcome"] {
  return value === "valid" || value === "invalid_output" || value === "invalid_choice" || value === "error" || value === "unavailable" || value === "skipped";
}

function requiredString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function parseProviderAttempts(value: unknown): ShadowWorkspaceProviderAttempt[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const attempts = value.flatMap((attempt) => {
    if (!isRecord(attempt)) return [];
    const requestKind = attempt.requestKind;
    if (requestKind !== "primary" && requestKind !== "rescue") return [];
    const parsed: ShadowWorkspaceProviderAttempt = {
      requestKind: requestKind as ShadowWorkspaceProviderAttempt["requestKind"],
      rescueMode: attempt.rescueMode === "empty" || attempt.rescueMode === "truncation" ? attempt.rescueMode : undefined,
      requestMaxOutputTokens: typeof attempt.requestMaxOutputTokens === "number" ? attempt.requestMaxOutputTokens : undefined,
      requestedThinkingMode: optionalString(attempt.requestedThinkingMode),
      finishReason: optionalString(attempt.finishReason),
      contentKind: optionalString(attempt.contentKind)
    };
    return [parsed];
  });
  return attempts.length > 0 ? attempts : undefined;
}
