import type { JsonRecord } from "../domain/types.js";
import { isRecord } from "../agent/utils.js";

export type ShadowWorkspaceOverlayKind = "reason_guidance" | "candidate_future_guidance";

export interface ShadowWorkspaceOverlayPatch {
  kind: ShadowWorkspaceOverlayKind;
  guidance: string;
  candidateFutureIds?: string[];
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
export function assessShadowWorkspaceOverlayEligibility(proposal: JsonRecord): ShadowWorkspaceOverlayEligibility {
  const blockers: string[] = [];
  const validation = isRecord(proposal.validation) ? proposal.validation : {};
  const patch = isRecord(proposal.proposedPatch) && isRecord(proposal.proposedPatch.shadowOverlay)
    ? parsePatch(proposal.proposedPatch.shadowOverlay)
    : undefined;

  if (validation.actionable !== true) blockers.push("proposal_not_actionable");
  if (proposal.status !== "pending_review") blockers.push("proposal_not_pending_review");
  if (proposal.riskLevel !== "low") blockers.push("proposal_risk_not_low");
  if (proposal.type !== "reason_policy" && proposal.type !== "candidate_template") {
    blockers.push("proposal_type_not_shadow_overlay_safe");
  }
  if (!hasEligibleEvidence(proposal.evidence)) blockers.push("organic_promotion_eligible_evidence_missing");
  if (!patch) blockers.push("explicit_shadow_overlay_patch_missing_or_invalid");
  if (patch && proposal.type === "reason_policy" && patch.kind !== "reason_guidance") {
    blockers.push("reason_policy_requires_reason_guidance_patch");
  }
  if (patch && proposal.type === "candidate_template" && patch.kind !== "candidate_future_guidance") {
    blockers.push("candidate_template_requires_candidate_future_guidance_patch");
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
  return { kind, guidance, candidateFutureIds: candidateFutureIds?.length ? candidateFutureIds : undefined };
}

function hasEligibleEvidence(evidence: unknown): boolean {
  if (!Array.isArray(evidence)) return false;
  return evidence.some((item) => {
    if (!isRecord(item)) return false;
    if (Array.isArray(item.tags) && item.tags.includes("promotion_eligible:true")) return true;
    return isRecord(item.raw) && item.raw.evidencePromotionEligible === true;
  });
}
