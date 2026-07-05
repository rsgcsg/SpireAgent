import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { DecisionLogEntry, JsonRecord, RunMemory } from "./types.js";
import type { MemoryManager } from "./memory.js";
import { agentRoot, isRecord } from "./utils.js";
import {
  buildReplayConsolidationProposalSurface,
  buildReplayFocusedShadowSlices,
  buildReplayFreshShadowSlices,
  readConsolidationProposals
} from "../replay/reader.js";
import { buildWorkspaceDecisionClassQuality } from "../replay/workspaceQuality.js";
import { assessP8LiveReadiness } from "../replay/p8LiveReadiness.js";

export function buildReviewReport(memory: MemoryManager): JsonRecord {
  const decisions = memory.run.keyDecisions;
  const stats = summarizeDecisions(decisions);

  return {
    run: summarizeRunMemory(memory.run),
    decisionStats: stats,
    cognitiveCoverage: summarizeCurrentRunCognitiveCoverage(memory.run.runId),
    recentDecisions: decisions.slice(-12).map((decision) => ({
      at: decision.at,
      screen: decision.screen,
      floor: decision.floor,
      chosen: decision.chosen,
      chosenBy: decision.chosenBy,
      route: decision.route ?? "unknown",
      fallbackReason: decision.fallbackReason,
      fallbackPolicy: decision.fallbackPolicy?.name,
      llmOutcome: decision.llm?.outcome,
      checkpoint: decision.checkpoint?.kind,
      score: round(decision.score),
      confidence: round(decision.confidence),
      reasons: decision.reasons.slice(0, 3)
    })),
    strategy: {
      weights: memory.strategy.weights,
      thresholds: memory.strategy.thresholds,
      recentHistory: memory.strategy.history.slice(-8)
    },
    recentLessons: memory.longTerm.lessons.slice(-10),
    recentRuns: memory.longTerm.runs.slice(-10)
  };
}

function summarizeCurrentRunCognitiveCoverage(runId: string): JsonRecord {
  const transitionsPath = path.join(agentRoot, "data", "runs", runId, "transitions.jsonl");
  if (!existsSync(transitionsPath)) {
    return { runId, transitions: 0, available: false };
  }
  const transitions = readFileSync(transitionsPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as unknown;
      } catch {
        return undefined;
      }
    })
    .filter((value): value is JsonRecord => isRecord(value));
  const count = (predicate: (transition: JsonRecord) => boolean): number => transitions.filter(predicate).length;
  const total = transitions.length;
  const rate = (value: number): number => (total > 0 ? round(value / total) ?? 0 : 0);
  const strategicImpression = count((transition) => isRecord(transition.strategicImpression));
  const derivedSnapshot = count((transition) => isRecord(transition.derivedSnapshot));
  const candidateFuturePredictionChecks = count((transition) =>
    Array.isArray(transition.candidateFutures) &&
    transition.candidateFutures.some((future) => isRecord(future) && Array.isArray(future.predictionChecks) && future.predictionChecks.length > 0)
  );
  const deliberationPacket = count((transition) => isRecord(transition.deliberationPacket));
  const derivedKnowledgeSummary = count((transition) => isRecord(transition.deliberationPacket) && isRecord(transition.deliberationPacket.derivedKnowledgeSummary));
  const promptParity = count((transition) => isRecord(transition.promptParity) || (isRecord(transition.deliberationPacket) && isRecord(transition.deliberationPacket.promptParity)));
  const workspaceComparison = count((transition) => isRecord(transition.workspaceComparison));
  const workspaceReady = count((transition) => isRecord(transition.workspaceComparison) && transition.workspaceComparison.gatedReadiness === "ready");
  const shadowWorkspaceDecision = count((transition) => isRecord(transition.shadowWorkspaceDecision));
  const shadowWorkspaceCalled = count((transition) => isRecord(transition.shadowWorkspaceDecision) && transition.shadowWorkspaceDecision.called === true);
  const workspaceAgreementCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision)) return counts;
    const agreement = typeof transition.shadowWorkspaceDecision.agreement === "string" ? transition.shadowWorkspaceDecision.agreement : "unknown";
    counts[agreement] = (counts[agreement] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceDecisionClassCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.workspaceComparison) || typeof transition.workspaceComparison.decisionClass !== "string") return counts;
    counts[transition.workspaceComparison.decisionClass] = (counts[transition.workspaceComparison.decisionClass] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceProviderReadinessCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.workspaceComparison) || typeof transition.workspaceComparison.providerReadiness !== "string") return counts;
    const readiness = transition.workspaceComparison.providerReadiness;
    counts[readiness] = (counts[readiness] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceBudgetStatusCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (isRecord(transition.workspaceComparison) && isRecord(transition.workspaceComparison.budget) && typeof transition.workspaceComparison.budget.status === "string") {
      counts[transition.workspaceComparison.budget.status] = (counts[transition.workspaceComparison.budget.status] ?? 0) + 1;
    }
    if (isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.budgetStatus === "string") {
      counts[transition.shadowWorkspaceDecision.budgetStatus] = (counts[transition.shadowWorkspaceDecision.budgetStatus] ?? 0) + 1;
    }
    return counts;
  }, {});
  const workspaceGovernanceProfileCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    const budget = isRecord(transition.workspaceComparison) && isRecord(transition.workspaceComparison.budget)
      ? transition.workspaceComparison.budget
      : undefined;
    if (!budget) return counts;
    const profile = typeof budget.governanceProfile === "string"
      ? budget.governanceProfile
      : isRecord(budget.governancePolicy) && typeof budget.governancePolicy.profile === "string"
        ? budget.governancePolicy.profile
        : undefined;
    if (profile) counts[profile] = (counts[profile] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceRecoveryPolicyCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision)) return counts;
    const policyName = typeof transition.shadowWorkspaceDecision.providerRecoveryPolicyName === "string"
      ? transition.shadowWorkspaceDecision.providerRecoveryPolicyName
      : isRecord(transition.shadowWorkspaceDecision.providerRecoveryPolicy) &&
          typeof transition.shadowWorkspaceDecision.providerRecoveryPolicy.policyName === "string"
        ? transition.shadowWorkspaceDecision.providerRecoveryPolicy.policyName
        : undefined;
    if (policyName) counts[policyName] = (counts[policyName] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceRecoveryOutputCapRelationCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision) || !isRecord(transition.shadowWorkspaceDecision.providerRecoveryPolicy)) return counts;
    const relation = transition.shadowWorkspaceDecision.providerRecoveryPolicy.rescueOutputCapRelation;
    if (typeof relation === "string") counts[relation] = (counts[relation] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceReasonQualityCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision) || typeof transition.shadowWorkspaceDecision.reasonQuality !== "string") return counts;
    counts[transition.shadowWorkspaceDecision.reasonQuality] = (counts[transition.shadowWorkspaceDecision.reasonQuality] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceReasonQualityNoteCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision) || !Array.isArray(transition.shadowWorkspaceDecision.reasonQualityNotes)) return counts;
    for (const note of transition.shadowWorkspaceDecision.reasonQualityNotes.map(String)) {
      counts[note] = (counts[note] ?? 0) + 1;
    }
    return counts;
  }, {});
  const workspaceFinishReasonCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision) || typeof transition.shadowWorkspaceDecision.providerFinishReason !== "string") return counts;
    counts[transition.shadowWorkspaceDecision.providerFinishReason] = (counts[transition.shadowWorkspaceDecision.providerFinishReason] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceCleanupReasonCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision) || typeof transition.shadowWorkspaceDecision.providerCleanupReason !== "string") return counts;
    counts[transition.shadowWorkspaceDecision.providerCleanupReason] = (counts[transition.shadowWorkspaceDecision.providerCleanupReason] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceProviderModeCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision) || typeof transition.shadowWorkspaceDecision.providerMode !== "string") return counts;
    counts[transition.shadowWorkspaceDecision.providerMode] = (counts[transition.shadowWorkspaceDecision.providerMode] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceFailureCategoryCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision) || typeof transition.shadowWorkspaceDecision.failureCategory !== "string") return counts;
    counts[transition.shadowWorkspaceDecision.failureCategory] = (counts[transition.shadowWorkspaceDecision.failureCategory] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceFailureBucketCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision) || typeof transition.shadowWorkspaceDecision.failureBucket !== "string") return counts;
    counts[transition.shadowWorkspaceDecision.failureBucket] = (counts[transition.shadowWorkspaceDecision.failureBucket] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceAblationModeCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    const mode = isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.ablationMode === "string"
      ? transition.shadowWorkspaceDecision.ablationMode
      : isRecord(transition.workspaceComparison) && typeof transition.workspaceComparison.ablationMode === "string"
        ? transition.workspaceComparison.ablationMode
        : undefined;
    if (mode) counts[mode] = (counts[mode] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceCompressionModeCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.workspaceComparison) || !isRecord(transition.workspaceComparison.coverage)) return counts;
    const mode = typeof transition.workspaceComparison.coverage.compressionMode === "string"
      ? transition.workspaceComparison.coverage.compressionMode
      : undefined;
    if (mode) counts[mode] = (counts[mode] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceRetryCount = transitions.reduce((sum, transition) => (
    isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.retryCount === "number"
      ? sum + transition.shadowWorkspaceDecision.retryCount
      : sum
  ), 0);
  const workspaceRetrySuccessCount = transitions.reduce((sum, transition) => (
    isRecord(transition.shadowWorkspaceDecision) &&
    (transition.shadowWorkspaceDecision.emptyContentRetrySucceeded === true || transition.shadowWorkspaceDecision.truncationRetrySucceeded === true)
      ? sum + 1
      : sum
  ), 0);
  const workspaceOutputCapHits = transitions.reduce((sum, transition) => (
    isRecord(transition.shadowWorkspaceDecision) && shadowOutputCapHit(transition.shadowWorkspaceDecision)
      ? sum + 1
      : sum
  ), 0);
  const liveEligibleShadowCalled = count((transition) =>
    isRecord(transition.shadowWorkspaceDecision) &&
    transition.shadowWorkspaceDecision.called === true &&
    isLiveEligibleShadowDecision(transition.shadowWorkspaceDecision, isRecord(transition.workspaceComparison) ? transition.workspaceComparison : undefined)
  );
  const liveEligibleInvalidOrError = count((transition) =>
    isRecord(transition.shadowWorkspaceDecision) &&
    isLiveEligibleShadowDecision(transition.shadowWorkspaceDecision, isRecord(transition.workspaceComparison) ? transition.workspaceComparison : undefined) &&
    ["invalid_output", "invalid_choice", "error"].includes(String(transition.shadowWorkspaceDecision.outcome ?? ""))
  );
  const liveEligibleMissingCandidate = count((transition) =>
    isRecord(transition.shadowWorkspaceDecision) &&
    isLiveEligibleShadowDecision(transition.shadowWorkspaceDecision, isRecord(transition.workspaceComparison) ? transition.workspaceComparison : undefined) &&
    transition.shadowWorkspaceDecision.agreement === "missing_candidate"
  );
  const workspaceCostEstimate = transitions.reduce((sum, transition) => {
    if (isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.estimatedCostUsd === "number") {
      return sum + transition.shadowWorkspaceDecision.estimatedCostUsd;
    }
    if (isRecord(transition.workspaceComparison) && isRecord(transition.workspaceComparison.budget) && typeof transition.workspaceComparison.budget.estimatedCostUsd === "number") {
      return sum + transition.workspaceComparison.budget.estimatedCostUsd;
    }
    return sum;
  }, 0);
  const workspaceLatencies = transitions
    .map((transition) => isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.latencyMs === "number"
      ? transition.shadowWorkspaceDecision.latencyMs
      : undefined)
    .filter((value): value is number => value !== undefined);
  const workspacePromptTokens = transitions
    .map((transition) => {
      if (isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.workspacePromptTokens === "number") {
        return transition.shadowWorkspaceDecision.workspacePromptTokens;
      }
      if (isRecord(transition.workspaceComparison) && typeof transition.workspaceComparison.structuredTokenEstimate === "number") {
        return transition.workspaceComparison.structuredTokenEstimate;
      }
      return undefined;
    })
    .filter((value): value is number => value !== undefined);
  const workspacePreservationScores = transitions
    .map((transition) => {
      if (!isRecord(transition.workspaceComparison) || !isRecord(transition.workspaceComparison.coverage)) return undefined;
      const score = transition.workspaceComparison.coverage.informationPreservationScore;
      return typeof score === "number" ? score : undefined;
    })
    .filter((score): score is number => score !== undefined);
  const workspaceSizeSamples = transitions
    .map((transition) => {
      if (!isRecord(transition.workspaceComparison) || !isRecord(transition.workspaceComparison.coverage)) return undefined;
      return transition.workspaceComparison.coverage;
    })
    .filter((value): value is JsonRecord => value !== undefined);
  const workspaceSizeSummary = averageWorkspaceSizeSummary(workspaceSizeSamples);
  const shadowWorkspaceSkipped = count((transition) => isRecord(transition.shadowWorkspaceDecision) && transition.shadowWorkspaceDecision.outcome === "skipped");
  const shadowWorkspaceUnavailable = count((transition) => isRecord(transition.shadowWorkspaceDecision) && transition.shadowWorkspaceDecision.outcome === "unavailable");
  const predictionError = count((transition) => isRecord(transition.predictionError));
  const predictionErrorAttributionBuckets = count((transition) =>
    isRecord(transition.predictionError) &&
    Array.isArray(transition.predictionError.attributionBuckets) &&
    transition.predictionError.attributionBuckets.length > 0
  );
  const replayFrame = count((transition) => isRecord(transition.replayFrame));
  const consolidation = count((transition) => isRecord(transition.consolidation));
  const proposalSurface = buildReplayConsolidationProposalSurface(readConsolidationProposals(path.dirname(transitionsPath), transitions));
  const freshSlices = buildReplayFreshShadowSlices(transitions as any);
  const focusedFreshSlices = buildReplayFocusedShadowSlices(transitions as any);
  const workspaceDecisionClassQuality = buildWorkspaceDecisionClassQuality(transitions as any);
  const p8LiveReadinessAssessment = assessP8LiveReadiness(freshSlices.sinceLatestRevision, workspaceDecisionClassQuality);
  const consolidationStatusCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.consolidation)) return counts;
    const status = typeof transition.consolidation.status === "string" ? transition.consolidation.status : "unknown";
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});
  return {
    runId,
    available: true,
    transitions: total,
    strategicImpression,
    derivedSnapshot,
    candidateFuturePredictionChecks,
    deliberationPacket,
    derivedKnowledgeSummary,
    promptParity,
    workspaceComparison,
    workspaceReady,
    shadowWorkspaceDecision,
    shadowWorkspaceCalled,
    shadowWorkspaceSkipped,
    shadowWorkspaceUnavailable,
    workspaceAgreementCounts,
    workspaceDecisionClassCounts,
    workspaceProviderReadinessCounts,
    workspaceBudgetStatusCounts,
    workspaceGovernanceProfileCounts,
    workspaceRecoveryPolicyCounts,
    workspaceRecoveryOutputCapRelationCounts,
    workspaceReasonQualityCounts,
    workspaceReasonQualityNoteCounts,
    workspaceFinishReasonCounts,
    workspaceCleanupReasonCounts,
    workspaceProviderModeCounts,
    workspaceFailureCategoryCounts,
    workspaceFailureBucketCounts,
    workspaceAblationModeCounts,
    workspaceCompressionModeCounts,
    workspaceRetryCount,
    workspaceRetrySuccessCount,
    workspaceOutputCapHits,
    workspaceSizeSummary,
    workspaceEstimatedCostUsd: round(workspaceCostEstimate),
    averageWorkspaceLatencyMs:
      workspaceLatencies.length > 0
        ? round(workspaceLatencies.reduce((sum, value) => sum + value, 0) / workspaceLatencies.length)
        : undefined,
    averageWorkspacePromptTokens:
      workspacePromptTokens.length > 0
        ? round(workspacePromptTokens.reduce((sum, value) => sum + value, 0) / workspacePromptTokens.length)
        : undefined,
    p8RolloutGate: buildP8ReviewGate({
      shadowWorkspaceCalled,
      liveEligibleShadowCalled,
      liveEligibleInvalidOrError,
      liveEligibleMissingCandidate,
      workspaceAgreementCounts,
      workspaceBudgetStatusCounts,
      workspaceReasonQualityCounts,
      transitions
    }),
    freshSlices,
    focusedFreshSlices,
    workspaceDecisionClassQuality,
    p8LiveReadinessAssessment,
    averageWorkspaceInformationPreservation:
      workspacePreservationScores.length > 0
        ? round(workspacePreservationScores.reduce((sum, score) => sum + score, 0) / workspacePreservationScores.length)
        : undefined,
    predictionError,
    predictionErrorAttributionBuckets,
    replayFrame,
    consolidation,
    consolidationProposalSurface: proposalSurface,
    consolidationStatusCounts,
    rates: {
      strategicImpression: rate(strategicImpression),
      derivedSnapshot: rate(derivedSnapshot),
      candidateFuturePredictionChecks: rate(candidateFuturePredictionChecks),
      deliberationPacket: rate(deliberationPacket),
      derivedKnowledgeSummary: rate(derivedKnowledgeSummary),
      promptParity: rate(promptParity),
      workspaceComparison: rate(workspaceComparison),
      workspaceReady: rate(workspaceReady),
      shadowWorkspaceDecision: rate(shadowWorkspaceDecision),
      shadowWorkspaceCalled: rate(shadowWorkspaceCalled),
      predictionError: rate(predictionError),
      predictionErrorAttributionBuckets: rate(predictionErrorAttributionBuckets),
      replayFrame: rate(replayFrame),
      consolidation: rate(consolidation)
    }
  };
}

function summarizeRunMemory(run: RunMemory): JsonRecord {
  return {
    runId: run.runId,
    character: run.character,
    act: run.act,
    floor: run.floor,
    ascension: run.ascension,
    hp: run.hp,
    maxHp: run.maxHp,
    gold: run.gold,
    updatedAt: run.updatedAt,
    highDeficits: Object.fromEntries(
      Object.entries(run.deficits)
        .filter(([, value]) => value >= 0.6)
        .map(([key, value]) => [key, round(value)])
    ),
    routeBias: mapValues(run.routeBias, roundNumber),
    riskFlags: run.riskFlags.slice(-12),
    counters: run.counters,
    strategicDirection: run.strategicDirection.slice(-8),
    recentCombat: run.recentCombat
  };
}

function buildP8ReviewGate(input: {
  shadowWorkspaceCalled: number;
  liveEligibleShadowCalled: number;
  liveEligibleInvalidOrError: number;
  liveEligibleMissingCandidate: number;
  workspaceAgreementCounts: Record<string, number>;
  workspaceBudgetStatusCounts: Record<string, number>;
  workspaceReasonQualityCounts: Record<string, number>;
  transitions: JsonRecord[];
}): JsonRecord {
  const reasons: string[] = [];
  const { plannedShadowCalls, maxObservedShadowCallsUsed } = input.transitions.reduce<{
    plannedShadowCalls: number;
    maxObservedShadowCallsUsed: number;
  }>((acc, transition) => {
    if (!isRecord(transition.workspaceComparison) || !isRecord(transition.workspaceComparison.budget)) return acc;
    const plannedValue = transition.workspaceComparison.budget.maxShadowCalls;
    const observedValue = transition.workspaceComparison.budget.shadowCallsUsed;
    return {
      plannedShadowCalls: typeof plannedValue === "number" ? Math.max(acc.plannedShadowCalls, plannedValue) : acc.plannedShadowCalls,
      maxObservedShadowCallsUsed: typeof observedValue === "number" ? Math.max(acc.maxObservedShadowCallsUsed, observedValue) : acc.maxObservedShadowCallsUsed
    };
  }, { plannedShadowCalls: 0, maxObservedShadowCallsUsed: 0 });
  const callBudgetReachedPlannedSample = (input.workspaceBudgetStatusCounts.call_budget_exceeded ?? 0) > 0 &&
    plannedShadowCalls > 0 &&
    (input.shadowWorkspaceCalled >= plannedShadowCalls || maxObservedShadowCallsUsed >= plannedShadowCalls);
  if (input.shadowWorkspaceCalled === 0) reasons.push("no_real_shadow_calls");
  if (input.liveEligibleShadowCalled === 0) reasons.push("no_live_eligible_shadow_calls");
  if (input.liveEligibleInvalidOrError > 0) reasons.push("live_eligible_invalid_or_error_shadow_outcome");
  if (input.liveEligibleMissingCandidate > 0) reasons.push("live_eligible_missing_candidate_present");
  if ((input.workspaceBudgetStatusCounts.token_budget_exceeded ?? 0) > 0) reasons.push("token_budget_exceeded");
  if ((input.workspaceBudgetStatusCounts.call_budget_exceeded ?? 0) > 0 && !callBudgetReachedPlannedSample) {
    reasons.push("call_budget_exceeded_before_planned_sample");
  }
  if ((input.workspaceBudgetStatusCounts.cost_budget_exceeded ?? 0) > 0) reasons.push("cost_budget_exceeded");
  if ((input.workspaceReasonQualityCounts.missing ?? 0) > 0) reasons.push("missing_reason_quality");
  return {
    status: reasons.length === 0 ? "go" : "no_go",
    reasons,
    firstLiveMode: "additive_legacy_prompt_plus_compact_workspace_summary",
    structuredPromptOnlyDefaultAllowed: false
  };
}

function summarizeDecisions(decisions: DecisionLogEntry[]): JsonRecord {
  const promptBytes = decisions
    .map((decision) => decision.llm?.promptBytes)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  return {
    total: decisions.length,
    byScreen: countBy(decisions, (decision) => decision.screen),
    byChosenBy: countBy(decisions, (decision) => decision.chosenBy),
    byRoute: countBy(decisions, (decision) => decision.route ?? "unknown"),
    fallbackByReason: countBy(
      decisions.filter((decision) => decision.chosenBy === "fallback"),
      (decision) => decision.fallbackReason ?? decision.llm?.outcome ?? "unknown"
    ),
    fallbackByPolicy: countBy(
      decisions.filter((decision) => decision.chosenBy === "fallback"),
      (decision) => decision.fallbackPolicy?.name ?? "missing"
    ),
    checkpointByKind: countBy(decisions, (decision) => decision.checkpoint?.kind ?? "missing"),
    hardCheckpointReasons: countReasons(decisions.flatMap((decision) => {
      if (decision.checkpoint?.kind !== "hard") return [];
      return decision.checkpoint.reasons;
    })),
    recentHardCheckpoints: decisions
      .filter((decision) => decision.checkpoint?.kind === "hard")
      .slice(-5)
      .map((decision) => ({
        at: decision.at,
        screen: decision.screen,
        floor: decision.floor,
        chosen: decision.chosen,
        reasons: decision.checkpoint?.reasons.slice(0, 6),
        before: decision.checkpoint?.before,
        after: decision.checkpoint?.after
      })),
    llmWanted: decisions.filter((decision) => decision.llm?.wanted).length,
    llmCalled: decisions.filter((decision) => decision.llm?.called).length,
    llmSelected: decisions.filter((decision) => decision.llm?.outcome === "selected").length,
    invalidLlmOutputs: decisions.filter(
      (decision) => decision.llm?.outcome === "invalid_output" || decision.llm?.outcome === "invalid_choice"
    ).length,
    promptBytes:
      promptBytes.length > 0
        ? {
            max: Math.max(...promptBytes),
            average: round(promptBytes.reduce((sum, value) => sum + value, 0) / promptBytes.length)
          }
        : undefined
  };
}

function averageWorkspaceSizeSummary(items: JsonRecord[]): JsonRecord | undefined {
  const numericAverage = (key: string): number | undefined => {
    const values = items
      .map((item) => item[key])
      .filter((value): value is number => typeof value === "number");
    if (values.length === 0) return undefined;
    return round(values.reduce((sum, value) => sum + value, 0) / values.length);
  };
  const truncatedFieldCounts = items.reduce<Record<string, number>>((counts, item) => {
    if (!isRecord(item.truncatedFields)) return counts;
    for (const [key, value] of Object.entries(item.truncatedFields)) {
      if (typeof value === "number") counts[key] = (counts[key] ?? 0) + value;
    }
    return counts;
  }, {});
  const largestFieldSources = items.reduce<Record<string, number>>((counts, item) => {
    if (!isRecord(item.largestFieldSources)) return counts;
    for (const [key, value] of Object.entries(item.largestFieldSources)) {
      if (typeof value === "number") counts[key] = (counts[key] ?? 0) + value;
    }
    return counts;
  }, {});
  if (items.length === 0) return undefined;
  return {
    samples: items.length,
    averageWorkspaceBytesBefore: numericAverage("workspaceBytesBefore"),
    averageWorkspaceBytesAfter: numericAverage("workspaceBytesAfter"),
    averageWorkspaceTokensBefore: numericAverage("workspaceTokensBefore"),
    averageWorkspaceTokensAfter: numericAverage("workspaceTokensAfter"),
    averageCandidateFuturesBytesBefore: numericAverage("candidateFuturesBytesBefore"),
    averageCandidateFuturesBytesAfter: numericAverage("candidateFuturesBytesAfter"),
    averageCandidateFuturesTokensBefore: numericAverage("candidateFuturesTokensBefore"),
    averageCandidateFuturesTokensAfter: numericAverage("candidateFuturesTokensAfter"),
    averageInformationPreservationEstimate: numericAverage("informationPreservationEstimate"),
    futuresTruncated: items.reduce((sum, item) => sum + (typeof item.futuresTruncated === "number" ? item.futuresTruncated : 0), 0),
    futuresOmitted: items.reduce((sum, item) => sum + (typeof item.futuresOmitted === "number" ? item.futuresOmitted : 0), 0),
    truncatedFieldCounts,
    largestFieldSources,
    repeatedTextBytes: items.reduce((sum, item) => sum + (typeof item.repeatedTextBytes === "number" ? item.repeatedTextBytes : 0), 0),
    repeatedTextCount: items.reduce((sum, item) => sum + (typeof item.repeatedTextCount === "number" ? item.repeatedTextCount : 0), 0)
  };
}

function countBy<T>(values: T[], getKey: (value: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    const key = getKey(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function countReasons(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function isLiveEligibleShadowDecision(shadowDecision: JsonRecord, comparison?: JsonRecord): boolean {
  if (typeof shadowDecision.liveEligibleClass === "boolean") return shadowDecision.liveEligibleClass;
  const decisionClass = typeof shadowDecision.decisionClass === "string"
    ? shadowDecision.decisionClass
    : typeof comparison?.decisionClass === "string"
      ? comparison.decisionClass
      : undefined;
  return typeof decisionClass === "string" && /:llm_required$/u.test(decisionClass);
}

function shadowOutputCapHit(shadowDecision: JsonRecord): boolean {
  if (shadowDecision.outputCapHit === true) return true;
  if (shadowDecision.providerFinishReason === "length") return true;
  const actualOutputTokens = typeof shadowDecision.actualOutputTokens === "number" ? shadowDecision.actualOutputTokens : undefined;
  const maxOutputTokens = typeof shadowDecision.maxOutputTokens === "number" ? shadowDecision.maxOutputTokens : undefined;
  return typeof actualOutputTokens === "number" && typeof maxOutputTokens === "number" && actualOutputTokens >= maxOutputTokens;
}

function mapValues<T extends Record<string, number>>(value: T, mapper: (input: number) => number): T {
  return Object.fromEntries(Object.entries(value).map(([key, number]) => [key, mapper(number)])) as T;
}

function round(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.round(value * 1000) / 1000;
}

function roundNumber(value: number): number {
  return Math.round(value * 1000) / 1000;
}
