import type { ReplayShadowSliceStats } from "./reader.js";
import type { WorkspaceDecisionClassQualityStats } from "./workspaceQuality.js";
import type { JsonRecord } from "../domain/types.js";
import { buildP8EvidenceBudgetAssessment } from "./evidenceBudget.js";
import { buildP8RolloutBudgetAssessment } from "./rolloutBudget.js";

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
  evidenceBudget: JsonRecord;
  rolloutBudget: JsonRecord;
}

export function assessP8LiveReadiness(
  freshSlice: ReplayShadowSliceStats,
  qualityByClass: Record<string, WorkspaceDecisionClassQualityStats>
): P8LiveReadinessAssessment {
  const reasons: string[] = [];
  const combat = qualityByClass["combat:llm_required"];
  const cardReward = qualityByClass["card_reward:llm_required"];
  const map = qualityByClass["map:llm_required"];
  const evidenceBudget = buildP8EvidenceBudgetAssessment(freshSlice, qualityByClass);
  const combatReady = classReadyForLive(combat);
  const cardRewardReady = classReadyForLive(cardReward);
  const mapReady = classReadyForLive(map);
  const combatWhitelistCandidate = combatReady ? ["combat:llm_required"] : [];

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
    return blocked("NOT_READY_LIVE_SAFETY_BLOCKER", reasons, [], evidenceBudget);
  }

  if (hasProviderBlocker(freshSlice)) {
    if ((freshSlice.finishReasonCounts.length ?? 0) > 0) reasons.push("provider_finish_reason_length_present");
    if (freshSlice.outputCapHits > 0) reasons.push("output_cap_hit_present");
    if ((freshSlice.failureCategoryCounts.provider_reliability ?? 0) > 0) reasons.push("provider_reliability_failure_present");
    if ((freshSlice.failureBucketCounts.provider_length_empty ?? 0) > 0) reasons.push("provider_length_empty_present");
    if ((freshSlice.failureBucketCounts.provider_length_truncated ?? 0) > 0) reasons.push("provider_length_truncated_present");
    if ((freshSlice.failureBucketCounts.provider_json_empty_content ?? 0) > 0) reasons.push("provider_json_empty_content_present");
    if ((freshSlice.failureBucketCounts.provider_request_error ?? 0) > 0) reasons.push("provider_request_error_present");
    return blocked("NOT_READY_PROVIDER_BLOCKER", reasons, [], evidenceBudget);
  }

  if (!combat || combat.liveEligibleCalled < 2) {
    const blockedDecisionClasses: string[] = ["combat:llm_required"];
    reasons.push("insufficient_fresh_live_eligible_evidence");
    if (!cardReward || cardReward.liveEligibleCalled < 2) blockedDecisionClasses.push("card_reward:llm_required");
    if (!map || map.liveEligibleCalled < 2) blockedDecisionClasses.push("map:llm_required");
    return blocked("NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE", reasons, blockedDecisionClasses, evidenceBudget);
  }

  if (classFutureShallow(combat)) {
    return blocked(
      "NOT_READY_CANDIDATE_FUTURE_QUALITY",
      ["combat_candidate_future_quality_not_clear"],
      ["combat:llm_required", ...blockedNonCombatClasses(cardRewardReady, mapReady)],
      evidenceBudget
    );
  }

  if (classReasonWeak(combat)) {
    return blocked(
      "NOT_READY_REASON_QUALITY",
      ["combat_reason_quality_not_clear"],
      ["combat:llm_required", ...blockedNonCombatClasses(cardRewardReady, mapReady)],
      evidenceBudget
    );
  }

  if (evidenceBudget.status !== "evidence_window_usable") {
    const blockedDecisionClasses = blockedNonCombatClasses(cardRewardReady, mapReady);
    reasons.push("combat_window_meets_current_live_gate");
    reasons.push("promotion_window_not_usable");
    appendNonCombatReadinessReasons(reasons, cardReward, map, cardRewardReady, mapReady);
    return blocked(
      "NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE",
      reasons,
      blockedDecisionClasses,
      evidenceBudget,
      combatWhitelistCandidate
    );
  }

  if (combatReady && cardRewardReady) {
    return withRolloutBudget({
      status: "READY_FOR_P8_5_LIVE_COMBAT_AND_CARD_REWARD",
      reasons: ["combat_and_card_reward_windows_meet_current_live_gate"],
      staticPreAuditAllowed: true,
      recommendedFirstLiveWhitelist: ["combat:llm_required", "card_reward:llm_required"],
      blockedDecisionClasses: mapReady ? [] : ["map:llm_required"],
      evidenceBudget
    });
  }

  if (combatReady) {
    const blockedDecisionClasses = blockedNonCombatClasses(cardRewardReady, mapReady);
    const liveReasons = ["combat_window_meets_current_live_gate"];
    appendNonCombatReadinessReasons(liveReasons, cardReward, map, cardRewardReady, mapReady);
    return withRolloutBudget({
      status: "READY_FOR_P8_5_LIVE_COMBAT_ONLY",
      reasons: liveReasons,
      staticPreAuditAllowed: true,
      recommendedFirstLiveWhitelist: ["combat:llm_required"],
      blockedDecisionClasses,
      evidenceBudget
    });
  }

  return blocked(
    "NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE",
    ["combat_live_gate_not_cleared"],
    ["combat:llm_required", "card_reward:llm_required", "map:llm_required"],
    evidenceBudget
  );
}

export function formatP8LiveReadinessAssessment(assessment: P8LiveReadinessAssessment): string {
  return [
    assessment.status,
    `static=${assessment.staticPreAuditAllowed ? "allowed" : "blocked"}`,
    `whitelist=${assessment.recommendedFirstLiveWhitelist.join(",") || "none"}`,
    `blocked=${assessment.blockedDecisionClasses.join(",") || "none"}`,
    `evidence=${String(assessment.evidenceBudget.status ?? "unknown")}`,
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
  if (stats.liveEligibleCalledCompletenessRecordedTransitions === 0) return true;
  if (stats.liveEligibleCalledShallowFutureCount > 0) return true;
  if (stats.liveEligibleCalledCompleteEnough <= 0) return true;
  if ((stats.liveEligibleCalledReviewSignals.shallow_candidate_future ?? 0) > 0) return true;
  if ((stats.liveEligibleCalledReviewSignals.missing_survival_line ?? 0) > 0) return true;
  if ((stats.liveEligibleCalledReviewSignals.missing_future_risk ?? 0) > 0) return true;
  if ((stats.liveEligibleCalledReviewSignals.missing_resource_tradeoff ?? 0) > 0) return true;
  if ((stats.liveEligibleCalledReviewSignals.missing_card_reward_direction ?? 0) > 0) return true;
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
  blockedDecisionClasses: string[] = [],
  evidenceBudget: JsonRecord = {},
  recommendedFirstLiveWhitelist: string[] = []
): P8LiveReadinessAssessment {
  return withRolloutBudget({
    status,
    reasons: dedupe(reasons),
    staticPreAuditAllowed: true,
    recommendedFirstLiveWhitelist: dedupe(recommendedFirstLiveWhitelist),
    blockedDecisionClasses: dedupe(blockedDecisionClasses),
    evidenceBudget
  });
}

function withRolloutBudget(assessment: Omit<P8LiveReadinessAssessment, "rolloutBudget">): P8LiveReadinessAssessment {
  return {
    ...assessment,
    rolloutBudget: buildP8RolloutBudgetAssessment({
      status: assessment.status,
      reasons: assessment.reasons,
      recommendedFirstLiveWhitelist: assessment.recommendedFirstLiveWhitelist,
      blockedDecisionClasses: assessment.blockedDecisionClasses,
      evidenceBudget: assessment.evidenceBudget
    })
  };
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function blockedNonCombatClasses(cardRewardReady: boolean, mapReady: boolean): string[] {
  const blocked: string[] = [];
  if (!cardRewardReady) blocked.push("card_reward:llm_required");
  if (!mapReady) blocked.push("map:llm_required");
  return blocked;
}

function appendNonCombatReadinessReasons(
  reasons: string[],
  cardReward: WorkspaceDecisionClassQualityStats | undefined,
  map: WorkspaceDecisionClassQualityStats | undefined,
  cardRewardReady: boolean,
  mapReady: boolean
): void {
  if (!cardRewardReady) reasons.push(classReadinessReason(cardReward, "card_reward"));
  if (!mapReady) reasons.push(classReadinessReason(map, "map"));
}

function classReadinessReason(
  stats: WorkspaceDecisionClassQualityStats | undefined,
  prefix: "card_reward" | "map"
): string {
  if (!stats || stats.liveEligibleCalled < 2) return `${prefix}_fresh_evidence_not_clear`;
  if (classFutureShallow(stats)) return `${prefix}_candidate_future_quality_not_clear`;
  if (classReasonWeak(stats)) return `${prefix}_reason_quality_not_clear`;
  if (stats.liveEligibleInvalid > 0) return `${prefix}_live_invalid_present`;
  if (stats.liveEligibleMissingCandidate > 0) return `${prefix}_missing_candidate_present`;
  return `${prefix}_not_ready`;
}
