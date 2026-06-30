import type { DecisionLogEntry, JsonRecord, RunMemory } from "./types.js";
import type { MemoryManager } from "./memory.js";

export function buildReviewReport(memory: MemoryManager): JsonRecord {
  const decisions = memory.run.keyDecisions;
  const stats = summarizeDecisions(decisions);

  return {
    run: summarizeRunMemory(memory.run),
    decisionStats: stats,
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
