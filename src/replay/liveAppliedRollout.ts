import type { JsonRecord } from "../domain/types.js";
import { isRecord } from "../agent/utils.js";

export interface LiveAppliedRolloutSummary {
  transitions: number;
  liveAdditiveApplied: number;
  chosenByLlm: number;
  chosenByFallback: number;
  decisionClassCounts: Record<string, number>;
  providerSourceCounts: Record<string, number>;
  llmOutcomeCounts: Record<string, number>;
  invalidOutput: number;
  invalidChoice: number;
  error: number;
  missingCandidateSignals: number;
  promptModeCounts: Record<string, number>;
}

export function buildLiveAppliedRolloutSummary(transitions: JsonRecord[]): LiveAppliedRolloutSummary {
  const summary: LiveAppliedRolloutSummary = {
    transitions: transitions.length,
    liveAdditiveApplied: 0,
    chosenByLlm: 0,
    chosenByFallback: 0,
    decisionClassCounts: {},
    providerSourceCounts: {},
    llmOutcomeCounts: {},
    invalidOutput: 0,
    invalidChoice: 0,
    error: 0,
    missingCandidateSignals: 0,
    promptModeCounts: {}
  };

  for (const transition of transitions) {
    const llm = transitionLlmAudit(transition);
    if (!llm || llm.liveAdditiveApplied !== true) continue;
    summary.liveAdditiveApplied += 1;
    const chosenBy = transitionChosenBy(transition);
    if (chosenBy === "llm") summary.chosenByLlm += 1;
    if (chosenBy === "fallback") summary.chosenByFallback += 1;
    increment(summary.decisionClassCounts, stringOr(llm.liveAdditiveDecisionClass, "unknown"));
    increment(summary.providerSourceCounts, stringOr(llm.providerSource, "unknown"));
    increment(summary.llmOutcomeCounts, stringOr(llm.outcome, "unknown"));
    if (typeof llm.promptMode === "string") increment(summary.promptModeCounts, llm.promptMode);
    if (llm.outcome === "invalid_output") summary.invalidOutput += 1;
    if (llm.outcome === "invalid_choice") summary.invalidChoice += 1;
    if (llm.outcome === "error" || llm.outcome === "timeout" || llm.outcome === "unavailable") summary.error += 1;
    if (typeof llm.error === "string" && /missing[_ ]candidate/i.test(llm.error)) summary.missingCandidateSignals += 1;
  }

  return summary;
}

export function formatLiveAppliedRolloutSummary(summary: LiveAppliedRolloutSummary): string {
  return [
    `applied=${summary.liveAdditiveApplied}`,
    `chosenByLlm=${summary.chosenByLlm}`,
    `fallback=${summary.chosenByFallback}`,
    `classes=${JSON.stringify(summary.decisionClassCounts)}`,
    `provider=${JSON.stringify(summary.providerSourceCounts)}`,
    `outcomes=${JSON.stringify(summary.llmOutcomeCounts)}`,
    `invalid=${summary.invalidOutput + summary.invalidChoice}`,
    `error=${summary.error}`
  ].join(" ");
}

function transitionLlmAudit(transition: JsonRecord): JsonRecord | undefined {
  const audit = isRecord(transition.decisionAudit) ? transition.decisionAudit : undefined;
  const raw = isRecord(audit?.raw) ? audit.raw : undefined;
  return isRecord(raw?.llm) ? raw.llm : undefined;
}

function transitionChosenBy(transition: JsonRecord): string | undefined {
  const audit = isRecord(transition.decisionAudit) ? transition.decisionAudit : undefined;
  return typeof audit?.chosenBy === "string" ? audit.chosenBy : undefined;
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}
