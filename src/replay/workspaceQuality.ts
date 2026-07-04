import type { JsonRecord, TransitionRecord } from "../domain/types.js";
import { isRecord } from "../agent/utils.js";

export interface WorkspaceDecisionClassQualityStats {
  transitions: number;
  liveEligibleTransitions: number;
  shadowCalled: number;
  liveEligibleCalled: number;
  liveEligibleInvalid: number;
  liveEligibleMissingCandidate: number;
  reasonQualityCounts: Record<string, number>;
  thinReasonCounts: Record<string, number>;
  completenessRecordedTransitions: number;
  completenessMissingTransitions: number;
  futureSamples: number;
  futureCount: number;
  withCoreTacticalFacts: number;
  withBenefitOrCost: number;
  withRiskOrUncertainty: number;
  withAssumptionOrInvalidation: number;
  withPredictionCheckTrace: number;
  withCoreTradeoff: number;
  completeEnough: number;
  shallowFutureCount: number;
  liveEligibleCalledCompletenessRecordedTransitions: number;
  liveEligibleCalledFutureCount: number;
  liveEligibleCalledCompleteEnough: number;
  liveEligibleCalledShallowFutureCount: number;
  reviewSignals: Record<string, number>;
  liveEligibleCalledReviewSignals: Record<string, number>;
  proposalSignals: Record<string, number>;
  cueAttributionSources: Record<string, number>;
  reasonCueAttributionSources: Record<string, number>;
}

export function buildWorkspaceDecisionClassQuality(
  transitions: Array<TransitionRecord | JsonRecord>
): Record<string, WorkspaceDecisionClassQualityStats> {
  const rows: Record<string, WorkspaceDecisionClassQualityStats> = {};
  for (const transition of transitions) {
    const comparison = isRecord(transition.workspaceComparison) ? transition.workspaceComparison : undefined;
    const shadow = isRecord(transition.shadowWorkspaceDecision) ? transition.shadowWorkspaceDecision : undefined;
    const decisionClass = typeof comparison?.decisionClass === "string"
      ? comparison.decisionClass
      : typeof shadow?.decisionClass === "string" ? shadow.decisionClass : undefined;
    if (!decisionClass) continue;
    const row = rows[decisionClass] ??= createWorkspaceDecisionClassQualityRow();
    row.transitions += 1;
    const liveEligible = isLiveEligibleShadowDecision(shadow, comparison);
    if (liveEligible) row.liveEligibleTransitions += 1;
    if (shadow?.called === true) {
      row.shadowCalled += 1;
      if (liveEligible) row.liveEligibleCalled += 1;
    }
    if (shadow && liveEligible && ["invalid_output", "invalid_choice", "error"].includes(String(shadow.outcome ?? ""))) {
      row.liveEligibleInvalid += 1;
    }
    if (shadow?.agreement === "missing_candidate" && liveEligible) {
      row.liveEligibleMissingCandidate += 1;
    }
    if (typeof shadow?.reasonQuality === "string") {
      row.reasonQualityCounts[shadow.reasonQuality] = (row.reasonQualityCounts[shadow.reasonQuality] ?? 0) + 1;
    }
    if (Array.isArray(shadow?.reasonQualityNotes)) {
      for (const note of shadow.reasonQualityNotes.map(String)) {
        row.thinReasonCounts[note] = (row.thinReasonCounts[note] ?? 0) + 1;
      }
    }
    const coverage = isRecord(comparison?.coverage) ? comparison.coverage : undefined;
    const completeness = isRecord(coverage?.candidateFutureCompleteness) ? coverage.candidateFutureCompleteness : undefined;
    if (completeness) {
      row.completenessRecordedTransitions += 1;
      row.futureSamples += 1;
      addNumber(row, "futureCount", completeness.futureCount);
      addNumber(row, "withCoreTacticalFacts", completeness.withCoreTacticalFacts);
      addNumber(row, "withBenefitOrCost", completeness.withBenefitOrCost);
      addNumber(row, "withRiskOrUncertainty", completeness.withRiskOrUncertainty);
      addNumber(row, "withAssumptionOrInvalidation", completeness.withAssumptionOrInvalidation);
      addNumber(row, "withPredictionCheckTrace", completeness.withPredictionCheckTrace);
      addNumber(row, "withCoreTradeoff", completeness.withCoreTradeoff);
      addNumber(row, "completeEnough", completeness.completeEnough);
      addNumber(row, "shallowFutureCount", completeness.shallowFutureCount);
      if (shadow?.called === true && liveEligible) {
        row.liveEligibleCalledCompletenessRecordedTransitions += 1;
        addNumber(row, "liveEligibleCalledFutureCount", completeness.futureCount);
        addNumber(row, "liveEligibleCalledCompleteEnough", completeness.completeEnough);
        addNumber(row, "liveEligibleCalledShallowFutureCount", completeness.shallowFutureCount);
      }
    } else if (coverage) {
      row.completenessMissingTransitions += 1;
    }
    mergeCountMap(row.reviewSignals, coverage?.candidateFutureReviewSignals);
    if (shadow?.called === true && liveEligible) {
      mergeCountMap(row.liveEligibleCalledReviewSignals, coverage?.candidateFutureReviewSignals);
    }
    mergeCountMap(row.proposalSignals, coverage?.candidateFutureProposalSignals);
    if (isRecord(coverage?.candidateFutureCueAttribution)) {
      mergeCountMap(row.cueAttributionSources, coverage.candidateFutureCueAttribution.sourceCounts);
    }
    if (isRecord(shadow?.reasonCueAttribution)) {
      mergeCountMap(row.reasonCueAttributionSources, shadow.reasonCueAttribution.sourceCounts);
    }
  }
  return Object.fromEntries(
    Object.entries(rows).sort((left, right) =>
      right[1].liveEligibleTransitions - left[1].liveEligibleTransitions ||
      right[1].transitions - left[1].transitions ||
      left[0].localeCompare(right[0])
    )
  );
}

export function formatWorkspaceDecisionClassQuality(
  qualityByClass: Record<string, WorkspaceDecisionClassQualityStats>,
  limit = 6
): string {
  const entries = Object.entries(qualityByClass).slice(0, limit);
  if (entries.length === 0) return "none";
  return entries.map(([decisionClass, stats]) => [
    decisionClass,
    `t=${stats.transitions}`,
    `live=${stats.liveEligibleTransitions}/${stats.liveEligibleCalled}`,
    `liveInvalid=${stats.liveEligibleInvalid}`,
    `rq=${JSON.stringify(stats.reasonQualityCounts)}`,
    `thin=${JSON.stringify(stats.thinReasonCounts)}`,
    stats.completenessRecordedTransitions > 0
      ? `complete=${stats.completeEnough}/${stats.futureCount}`
      : `complete=not_recorded(${stats.completenessMissingTransitions})`,
    stats.liveEligibleCalledCompletenessRecordedTransitions > 0
      ? `liveComplete=${stats.liveEligibleCalledCompleteEnough}/${stats.liveEligibleCalledFutureCount}`
      : "liveComplete=not_recorded",
    `shallow=${stats.shallowFutureCount}`,
    `liveShallow=${stats.liveEligibleCalledShallowFutureCount}`,
    `signals=${JSON.stringify(stats.reviewSignals)}`,
    `liveSignals=${JSON.stringify(stats.liveEligibleCalledReviewSignals)}`,
    `proposals=${JSON.stringify(stats.proposalSignals)}`,
    `cueSources=${JSON.stringify(stats.cueAttributionSources)}`,
    `reasonCueSources=${JSON.stringify(stats.reasonCueAttributionSources)}`
  ].join(" ")).join(" | ");
}

function createWorkspaceDecisionClassQualityRow(): WorkspaceDecisionClassQualityStats {
  return {
    transitions: 0,
    liveEligibleTransitions: 0,
    shadowCalled: 0,
    liveEligibleCalled: 0,
    liveEligibleInvalid: 0,
    liveEligibleMissingCandidate: 0,
    reasonQualityCounts: {},
    thinReasonCounts: {},
    completenessRecordedTransitions: 0,
    completenessMissingTransitions: 0,
    futureSamples: 0,
    futureCount: 0,
    withCoreTacticalFacts: 0,
    withBenefitOrCost: 0,
    withRiskOrUncertainty: 0,
    withAssumptionOrInvalidation: 0,
    withPredictionCheckTrace: 0,
    withCoreTradeoff: 0,
    completeEnough: 0,
    shallowFutureCount: 0,
    liveEligibleCalledCompletenessRecordedTransitions: 0,
    liveEligibleCalledFutureCount: 0,
    liveEligibleCalledCompleteEnough: 0,
    liveEligibleCalledShallowFutureCount: 0,
    reviewSignals: {},
    liveEligibleCalledReviewSignals: {},
    proposalSignals: {},
    cueAttributionSources: {},
    reasonCueAttributionSources: {}
  };
}

function mergeCountMap(target: Record<string, number>, value: unknown): void {
  if (!isRecord(value)) return;
  for (const [key, count] of Object.entries(value)) {
    if (typeof count === "number") target[key] = (target[key] ?? 0) + count;
  }
}

function addNumber<T extends keyof WorkspaceDecisionClassQualityStats>(
  target: WorkspaceDecisionClassQualityStats,
  key: T,
  value: unknown
): void {
  if (typeof value === "number") {
    target[key] = (target[key] as number) + value as WorkspaceDecisionClassQualityStats[T];
  }
}

function isLiveEligibleShadowDecision(shadowDecision?: JsonRecord, comparison?: JsonRecord): boolean {
  if (typeof shadowDecision?.liveEligibleClass === "boolean") return shadowDecision.liveEligibleClass;
  const decisionClass = typeof shadowDecision?.decisionClass === "string"
    ? shadowDecision.decisionClass
    : typeof comparison?.decisionClass === "string"
      ? comparison.decisionClass
      : undefined;
  return typeof decisionClass === "string" && /:llm_required$/u.test(decisionClass);
}
