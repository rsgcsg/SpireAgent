import type { JsonRecord } from "../domain/types.js";
import type { ReplayShadowSliceStats } from "./reader.js";
import type { WorkspaceDecisionClassQualityStats } from "./workspaceQuality.js";

const LIVE_ELIGIBLE_CLASSES = ["combat:llm_required", "card_reward:llm_required", "map:llm_required"] as const;

export function buildP8EvidenceBudgetAssessment(
  freshSlice: ReplayShadowSliceStats,
  qualityByClass: Record<string, WorkspaceDecisionClassQualityStats>
): JsonRecord {
  const decisionClassTargets: Record<string, JsonRecord> = {};
  for (const decisionClass of LIVE_ELIGIBLE_CLASSES) {
    const observed = qualityByClass[decisionClass]?.liveEligibleCalled ?? 0;
    decisionClassTargets[decisionClass] = {
      minFreshCalled: 2,
      observedFreshCalled: observed,
      status: observed >= 2 ? "met" : "insufficient"
    };
  }
  const liveEligibleStatus = freshSlice.liveEligibleCalled >= 2 ? "met" : "insufficient";
  const cleanPromotionWindow = !freshSlice.mixedRevisionWindow && !freshSlice.mixedBudgetWindow;
  return {
    schemaVersion: 1,
    policyName: "p8_live_readiness_evidence_budget_v1",
    freshnessWindow: freshSlice.label,
    liveEligibleTarget: {
      minFreshCalled: 2,
      observedFreshCalled: freshSlice.liveEligibleCalled,
      status: liveEligibleStatus
    },
    decisionClassTargets,
    mixedRevisionWindow: freshSlice.mixedRevisionWindow,
    mixedBudgetWindow: freshSlice.mixedBudgetWindow,
    cleanPromotionWindow,
    promotionUseAllowed: liveEligibleStatus === "met" && cleanPromotionWindow,
    status: liveEligibleStatus === "met" && cleanPromotionWindow ? "evidence_window_usable" : "evidence_window_not_usable",
    notes: evidenceNotes(freshSlice, decisionClassTargets, cleanPromotionWindow)
  };
}

function evidenceNotes(
  freshSlice: ReplayShadowSliceStats,
  decisionClassTargets: Record<string, JsonRecord>,
  cleanPromotionWindow: boolean
): string[] {
  const notes: string[] = [];
  if (freshSlice.liveEligibleCalled < 2) notes.push("insufficient_live_eligible_shadow_calls");
  for (const [decisionClass, target] of Object.entries(decisionClassTargets)) {
    if (target.status === "insufficient") notes.push(`insufficient_${decisionClass.replace(/[:]/g, "_")}_evidence`);
  }
  if (!cleanPromotionWindow) notes.push("mixed_window_not_for_promotion");
  return notes;
}
