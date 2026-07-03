import type { ReplayShadowSliceStats } from "./reader.js";
import type { WorkspaceDecisionClassQualityStats } from "./workspaceQuality.js";

export type P8LiveReadinessStatus =
  | "READY_FOR_P8_5_LIVE_COMBAT_ONLY"
  | "READY_FOR_P8_5_LIVE_COMBAT_AND_CARD_REWARD"
  | "NOT_READY_PROVIDER_BLOCKER"
  | "NOT_READY_LIVE_SAFETY_BLOCKER"
  | "NOT_READY_REASON_QUALITY"
  | "NOT_READY_CANDIDATE_FUTURE_QUALITY"
  | "NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE";

export interface P8LiveReadinessAssessment {
  status: P8LiveReadinessStatus;
  reasons: string[];
  staticPreAuditAllowed: boolean;
  recommendedFirstLiveWhitelist: string[];
  blockedDecisionClasses: string[];
}

export function assessP8LiveReadiness(
  freshSlice: ReplayShadowSliceStats,
  qualityByClass: Record<string, WorkspaceDecisionClassQualityStats>
): P8LiveReadinessAssessment {
  const reasons: string[] = [];
  const blockedDecisionClasses: string[] = [];
  const combat = qualityByClass["combat:llm_required"];
  const cardReward = qualityByClass["card_reward:llm_required"];
  const map = qualityByClass["map:llm_required"];

  if (
    freshSlice.liveEligibleInvalidOutput > 0 ||
    freshSlice.liveEligibleInvalidChoice > 0 ||
    freshSlice.liveEligibleError > 0 ||
    freshSlice.liveEligibleMissingCandidate > 0
  ) {
    if (freshSlice.liveEligibleInvalidOutput > 0) reasons.push("live_eligible_invalid_output_present");
    if (freshSlice.liveEligibleInvalidChoice > 0) reasons.push("live_eligible_invalid_choice_present");
    if (freshSlice.liveEligibleError > 0) reasons.push("live_eligible_shadow_error_present");
    if (freshSlice.liveEligibleMissingCandidate > 0) reasons.push("live_eligible_missing_candidate_present");
    return blocked("NOT_READY_LIVE_SAFETY_BLOCKER", reasons);
  }

  if (hasProviderBlocker(freshSlice)) {
    if ((freshSlice.finishReasonCounts.length ?? 0) > 0) reasons.push("provider_finish_reason_length_present");
    if (freshSlice.outputCapHits > 0) reasons.push("output_cap_hit_present");
    if ((freshSlice.failureCategoryCounts.provider_reliability ?? 0) > 0) reasons.push("provider_reliability_failure_present");
    if ((freshSlice.failureBucketCounts.provider_length_empty ?? 0) > 0) reasons.push("provider_length_empty_present");
    if ((freshSlice.failureBucketCounts.provider_length_truncated ?? 0) > 0) reasons.push("provider_length_truncated_present");
    if ((freshSlice.failureBucketCounts.provider_json_empty_content ?? 0) > 0) reasons.push("provider_json_empty_content_present");
    if ((freshSlice.failureBucketCounts.provider_request_error ?? 0) > 0) reasons.push("provider_request_error_present");
    return blocked("NOT_READY_PROVIDER_BLOCKER", reasons);
  }

  if (freshSlice.liveEligibleCalled < 2 || !combat || combat.liveEligibleCalled < 2) {
    reasons.push("insufficient_fresh_live_eligible_evidence");
    if (!combat || combat.liveEligibleCalled < 2) blockedDecisionClasses.push("combat:llm_required");
    if (!cardReward || cardReward.liveEligibleCalled < 2) blockedDecisionClasses.push("card_reward:llm_required");
    if (!map || map.liveEligibleCalled < 2) blockedDecisionClasses.push("map:llm_required");
    return blocked("NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE", reasons, blockedDecisionClasses);
  }

  if (classFutureShallow(combat) || classFutureShallow(cardReward) || classFutureShallow(map)) {
    if (classFutureShallow(combat)) {
      reasons.push("combat_candidate_future_quality_not_clear");
      blockedDecisionClasses.push("combat:llm_required");
    }
    if (classFutureShallow(cardReward)) {
      reasons.push("card_reward_candidate_future_quality_not_clear");
      blockedDecisionClasses.push("card_reward:llm_required");
    }
    if (classFutureShallow(map)) {
      reasons.push("map_candidate_future_quality_not_clear");
      blockedDecisionClasses.push("map:llm_required");
    }
    return blocked("NOT_READY_CANDIDATE_FUTURE_QUALITY", reasons, blockedDecisionClasses);
  }

  if (classReasonWeak(combat) || classReasonWeak(cardReward) || classReasonWeak(map)) {
    if (classReasonWeak(combat)) {
      reasons.push("combat_reason_quality_not_clear");
      blockedDecisionClasses.push("combat:llm_required");
    }
    if (classReasonWeak(cardReward)) {
      reasons.push("card_reward_reason_quality_not_clear");
      blockedDecisionClasses.push("card_reward:llm_required");
    }
    if (classReasonWeak(map)) {
      reasons.push("map_reason_quality_not_clear");
      blockedDecisionClasses.push("map:llm_required");
    }
    return blocked("NOT_READY_REASON_QUALITY", reasons, blockedDecisionClasses);
  }

  if (classReadyForLive(combat) && classReadyForLive(cardReward)) {
    return {
      status: "READY_FOR_P8_5_LIVE_COMBAT_AND_CARD_REWARD",
      reasons: ["combat_and_card_reward_windows_meet_current_live_gate"],
      staticPreAuditAllowed: true,
      recommendedFirstLiveWhitelist: ["combat:llm_required", "card_reward:llm_required"],
      blockedDecisionClasses: classReadyForLive(map) ? [] : ["map:llm_required"]
    };
  }

  if (classReadyForLive(combat)) {
    return {
      status: "READY_FOR_P8_5_LIVE_COMBAT_ONLY",
      reasons: ["combat_window_meets_current_live_gate", "non_combat_live_classes_need_more_evidence"],
      staticPreAuditAllowed: true,
      recommendedFirstLiveWhitelist: ["combat:llm_required"],
      blockedDecisionClasses: ["card_reward:llm_required", "map:llm_required"]
    };
  }

  return blocked(
    "NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE",
    ["combat_live_gate_not_cleared"],
    ["combat:llm_required", "card_reward:llm_required", "map:llm_required"]
  );
}

export function formatP8LiveReadinessAssessment(assessment: P8LiveReadinessAssessment): string {
  return [
    assessment.status,
    `static=${assessment.staticPreAuditAllowed ? "allowed" : "blocked"}`,
    `whitelist=${assessment.recommendedFirstLiveWhitelist.join(",") || "none"}`,
    `blocked=${assessment.blockedDecisionClasses.join(",") || "none"}`,
    `reasons=${assessment.reasons.join(",") || "none"}`
  ].join(" ");
}

function classReadyForLive(stats?: WorkspaceDecisionClassQualityStats): boolean {
  if (!stats) return false;
  if (stats.liveEligibleCalled < 2) return false;
  if (stats.liveEligibleInvalid > 0) return false;
  if (stats.liveEligibleMissingCandidate > 0) return false;
  if (classFutureShallow(stats)) return false;
  if (classReasonWeak(stats)) return false;
  return true;
}

function classReasonWeak(stats?: WorkspaceDecisionClassQualityStats): boolean {
  if (!stats) return true;
  const adequate = stats.reasonQualityCounts.adequate ?? 0;
  const thin = stats.reasonQualityCounts.thin ?? 0;
  const missing = stats.reasonQualityCounts.missing ?? 0;
  if (missing > 0) return true;
  if (adequate === 0) return true;
  if (thin > adequate) return true;
  if ((stats.thinReasonCounts.missing_tradeoff ?? 0) > adequate) return true;
  return false;
}

function classFutureShallow(stats?: WorkspaceDecisionClassQualityStats): boolean {
  if (!stats) return true;
  if (stats.completenessRecordedTransitions === 0) return true;
  if (stats.shallowFutureCount > 0) return true;
  if (stats.completeEnough <= 0) return true;
  if ((stats.reviewSignals.shallow_candidate_future ?? 0) > 0) return true;
  if ((stats.reviewSignals.missing_survival_line ?? 0) > 0) return true;
  if ((stats.reviewSignals.missing_future_risk ?? 0) > 0) return true;
  if ((stats.reviewSignals.missing_resource_tradeoff ?? 0) > 0) return true;
  if ((stats.reviewSignals.missing_card_reward_direction ?? 0) > 0) return true;
  return false;
}

function hasProviderBlocker(freshSlice: ReplayShadowSliceStats): boolean {
  return freshSlice.outputCapHits > 0 ||
    (freshSlice.finishReasonCounts.length ?? 0) > 0 ||
    (freshSlice.failureCategoryCounts.provider_reliability ?? 0) > 0 ||
    (freshSlice.failureBucketCounts.provider_length_empty ?? 0) > 0 ||
    (freshSlice.failureBucketCounts.provider_length_truncated ?? 0) > 0 ||
    (freshSlice.failureBucketCounts.provider_json_empty_content ?? 0) > 0 ||
    (freshSlice.failureBucketCounts.provider_request_error ?? 0) > 0;
}

function blocked(
  status: Exclude<P8LiveReadinessStatus, "READY_FOR_P8_5_LIVE_COMBAT_ONLY" | "READY_FOR_P8_5_LIVE_COMBAT_AND_CARD_REWARD">,
  reasons: string[],
  blockedDecisionClasses: string[] = []
): P8LiveReadinessAssessment {
  return {
    status,
    reasons: dedupe(reasons),
    staticPreAuditAllowed: true,
    recommendedFirstLiveWhitelist: [],
    blockedDecisionClasses: dedupe(blockedDecisionClasses)
  };
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
