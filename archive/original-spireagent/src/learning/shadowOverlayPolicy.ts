import type { JsonRecord } from "../domain/types.js";
import { isRecord } from "../agent/utils.js";
import { PROTECTED_STABLE_WRITE_TARGETS } from "../agent/protectedPathGate.js";
import { classifyTransitionEvidenceRole } from "../replay/evidenceRoleClassifier.js";

export type ShadowWorkspaceOverlayKind = "reason_guidance" | "candidate_future_guidance";

export interface ShadowWorkspaceOverlayPatch {
  kind: ShadowWorkspaceOverlayKind;
  guidance: string;
  candidateFutureIds?: string[];
  requiredReasonQualityNote?: string;
}

export interface ShadowWorkspaceOverlayEligibility {
  eligible: boolean;
  blockers: string[];
  patch?: ShadowWorkspaceOverlayPatch;
}

/**
 * This is deliberately narrower than proposal validation. A proposal may be
 * useful review evidence without being safe to place in an offline workspace.
 */
export function assessShadowWorkspaceOverlayEligibility(
  proposal: JsonRecord,
  sourceTransition?: JsonRecord
): ShadowWorkspaceOverlayEligibility {
  const blockers: string[] = [];
  const validation = isRecord(proposal.validation) ? proposal.validation : {};
  const patch = isRecord(proposal.proposedPatch) && isRecord(proposal.proposedPatch.shadowOverlay)
    ? parsePatch(proposal.proposedPatch.shadowOverlay)
    : undefined;

  if (validation.actionable !== true) blockers.push("proposal_not_actionable");
  if (proposal.status !== "pending_review") blockers.push("proposal_not_pending_review");
  if (proposal.riskLevel !== "low") blockers.push("proposal_risk_not_low");
  if (proposal.type !== "reason_policy") {
    blockers.push("proposal_type_not_deliberation_shaping_canary_safe");
  }
  if (proposal.behaviorImpact !== "deliberation_shaping") {
    blockers.push("proposal_behavior_impact_not_deliberation_shaping");
  }
  if (!hasDeclaredProtectedTargets(proposal.protectedPathImpact)) blockers.push("protected_targets_not_declared");
  if (!hasExactOrganicEnvironmentScope(proposal.environmentScope)) {
    blockers.push("proposal_environment_scope_not_exact_organic");
  }
  blockers.push(...sourceResolutionBlockers(proposal, sourceTransition));
  if (!patch) blockers.push("explicit_shadow_overlay_patch_missing_or_invalid");
  if (patch && proposal.type === "reason_policy" && patch.kind !== "reason_guidance") {
    blockers.push("reason_policy_requires_reason_guidance_patch");
  }
  if (patch && proposal.type === "reason_policy" && !patch.requiredReasonQualityNote) {
    blockers.push("reason_policy_requires_scoped_review_trigger");
  }

  return {
    eligible: blockers.length === 0,
    blockers,
    patch
  };
}

function parsePatch(value: JsonRecord): ShadowWorkspaceOverlayPatch | undefined {
  const kind = value.kind;
  const guidance = typeof value.guidance === "string" ? value.guidance.trim() : "";
  if ((kind !== "reason_guidance" && kind !== "candidate_future_guidance") || !guidance || guidance.length > 240) {
    return undefined;
  }
  const candidateFutureIds = Array.isArray(value.candidateFutureIds)
    ? value.candidateFutureIds.filter((id): id is string => typeof id === "string" && id.length > 0).slice(0, 8)
    : undefined;
  const requiredReasonQualityNote = typeof value.requiredReasonQualityNote === "string" && value.requiredReasonQualityNote.length > 0
    ? value.requiredReasonQualityNote
    : undefined;
  return {
    kind,
    guidance,
    candidateFutureIds: candidateFutureIds?.length ? candidateFutureIds : undefined,
    requiredReasonQualityNote
  };
}

function sourceResolutionBlockers(proposal: JsonRecord, sourceTransition?: JsonRecord): string[] {
  if (!sourceTransition) return ["source_transition_not_resolved"];
  const transitionId = typeof sourceTransition.transitionId === "string" ? sourceTransition.transitionId : undefined;
  if (!transitionId) return ["source_transition_id_not_recorded"];
  if (!proposalReferencesTransition(proposal, transitionId)) {
    return ["source_transition_not_referenced_by_proposal"];
  }
  const sourceRunId = typeof sourceTransition.runId === "string" ? sourceTransition.runId : undefined;
  if (sourceRunId && !proposalReferencesRun(proposal, sourceRunId)) {
    return ["source_run_not_referenced_by_proposal"];
  }

  const classification = classifyTransitionEvidenceRole(sourceTransition);
  const blockers: string[] = [];
  if (!classification.eligibility.proposalSeedEligible) {
    blockers.push(...classification.eligibility.reasons.map((reason) => `source_transition_ineligible:${reason}`));
  }
  if (!proposalScopeMatchesTransition(proposal.environmentScope, sourceTransition)) {
    blockers.push("proposal_environment_scope_does_not_match_source_transition");
  }
  return blockers;
}

function proposalReferencesTransition(proposal: JsonRecord, transitionId: string): boolean {
  const createdFrom = Array.isArray(proposal.createdFromTransitionIds)
    ? proposal.createdFromTransitionIds.filter((value): value is string => typeof value === "string")
    : [];
  const evidenceFrom = Array.isArray(proposal.evidence)
    ? proposal.evidence
      .filter(isRecord)
      .map((evidence) => evidence.transitionId)
      .filter((value): value is string => typeof value === "string")
    : [];
  return createdFrom.includes(transitionId) && evidenceFrom.includes(transitionId);
}

function proposalReferencesRun(proposal: JsonRecord, runId: string): boolean {
  const createdFrom = Array.isArray(proposal.createdFromRunIds)
    ? proposal.createdFromRunIds.filter((value): value is string => typeof value === "string")
    : [];
  return createdFrom.includes(runId);
}

function proposalScopeMatchesTransition(scope: unknown, transition: JsonRecord): boolean {
  if (!isRecord(scope)) return false;
  const fingerprint = isRecord(transition.environmentFingerprint) ? transition.environmentFingerprint : {};
  const transitionHash = typeof fingerprint.fingerprintHash === "string" ? fingerprint.fingerprintHash : undefined;
  const fingerprintHashes = Array.isArray(scope.fingerprintHashes)
    ? scope.fingerprintHashes.filter((value): value is string => typeof value === "string")
    : [];
  const provenance = isRecord(transition.evidenceEnvironmentScope)
    ? transition.evidenceEnvironmentScope.captureProvenance
    : undefined;
  const declaredProvenance = Array.isArray(scope.captureProvenance)
    ? scope.captureProvenance.filter((value): value is string => typeof value === "string")
    : [];
  return Boolean(transitionHash && fingerprintHashes.includes(transitionHash) &&
    typeof provenance === "string" && declaredProvenance.includes(provenance));
}

function hasDeclaredProtectedTargets(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.protectedTargets)) return false;
  return value.protectedTargets.length > 0 && value.protectedTargets.every((target) =>
    typeof target === "string" && PROTECTED_STABLE_WRITE_TARGETS.includes(target as typeof PROTECTED_STABLE_WRITE_TARGETS[number])
  );
}

function hasExactOrganicEnvironmentScope(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return value.scopeStatus === "exact" &&
    Array.isArray(value.fingerprintHashes) &&
    value.fingerprintHashes.some((item) => typeof item === "string" && item.length > 0) &&
    Array.isArray(value.captureProvenance) &&
    value.captureProvenance.includes("organic");
}
