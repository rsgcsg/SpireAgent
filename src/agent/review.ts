import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { DecisionLogEntry, JsonRecord, RunMemory } from "./types.js";
import type { MemoryManager } from "./memory.js";
import { agentRoot, isRecord } from "./utils.js";
import {
  buildReplayConsolidationProposalSurface,
  buildReplayFreshShadowSlices,
  readConsolidationProposals
} from "../replay/reader.js";

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
  const workspaceReasonQualityCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision) || typeof transition.shadowWorkspaceDecision.reasonQuality !== "string") return counts;
    counts[transition.shadowWorkspaceDecision.reasonQuality] = (counts[transition.shadowWorkspaceDecision.reasonQuality] ?? 0) + 1;
    return counts;
  }, {});
  const workspaceProviderModeCounts = transitions.reduce<Record<string, number>>((counts, transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision) || typeof transition.shadowWorkspaceDecision.providerMode !== "string") return counts;
    counts[transition.shadowWorkspaceDecision.providerMode] = (counts[transition.shadowWorkspaceDecision.providerMode] ?? 0) + 1;
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
  const workspaceRetryCount = transitions.reduce((sum, transition) => (
    isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.retryCount === "number"
      ? sum + transition.shadowWorkspaceDecision.retryCount
      : sum
  ), 0);
  const workspaceRetrySuccessCount = transitions.reduce((sum, transition) => (
    isRecord(transition.shadowWorkspaceDecision) && transition.shadowWorkspaceDecision.emptyContentRetrySucceeded === true
      ? sum + 1
      : sum
  ), 0);
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
    workspaceReasonQualityCounts,
    workspaceProviderModeCounts,
    workspaceAblationModeCounts,
    workspaceRetryCount,
    workspaceRetrySuccessCount,
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
      workspaceAgreementCounts,
      workspaceBudgetStatusCounts,
      workspaceReasonQualityCounts,
      transitions
    }),
    freshSlices,
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
  workspaceAgreementCounts: Record<string, number>;
  workspaceBudgetStatusCounts: Record<string, number>;
  workspaceReasonQualityCounts: Record<string, number>;
  transitions: JsonRecord[];
}): JsonRecord {
  const invalidOrError = input.transitions.filter((transition) => {
    if (!isRecord(transition.shadowWorkspaceDecision)) return false;
    return ["invalid_output", "invalid_choice", "error"].includes(String(transition.shadowWorkspaceDecision.outcome ?? ""));
  }).length;
  const reasons: string[] = [];
  if (input.shadowWorkspaceCalled === 0) reasons.push("no_real_shadow_calls");
  if (invalidOrError > 0) reasons.push("invalid_or_error_shadow_outcome");
  if ((input.workspaceAgreementCounts.missing_candidate ?? 0) > 0) reasons.push("missing_candidate_present");
  if ((input.workspaceBudgetStatusCounts.token_budget_exceeded ?? 0) > 0) reasons.push("token_budget_exceeded");
  if ((input.workspaceBudgetStatusCounts.call_budget_exceeded ?? 0) > 0) reasons.push("call_budget_exceeded");
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
