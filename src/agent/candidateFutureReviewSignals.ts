import type { CandidateFutureCompletenessSummary, DeliberationPacket, JsonRecord } from "../domain/types.js";
import { isRecord } from "./utils.js";

export interface CandidateFutureReviewAnalysis {
  completeness: CandidateFutureCompletenessSummary;
  reviewSignals: Record<string, number>;
  proposalSignals: Record<string, number>;
  cueAttribution: CandidateFutureCueAttributionSummary;
}

export interface CandidateFutureCueAttributionSummary {
  cues: Record<string, CandidateFutureCueAttribution>;
  sourceCounts: Record<string, number>;
  missingInOriginal: string[];
  lostInSerialization: string[];
  preservedInSerialization: string[];
}

export interface CandidateFutureCueAttribution {
  original: boolean;
  serialized: boolean;
  source: "not_applicable" | "candidate_future_missing" | "compression_lost" | "serialization_preserved";
}

export interface ReasonCueAttributionSummary {
  cues: Record<string, ReasonCueAttribution>;
  sourceCounts: Record<string, number>;
  missingDespiteSerialized: string[];
}

export interface ReasonCueAttribution {
  original: boolean;
  serialized: boolean;
  modelReason: boolean;
  source:
    | "not_applicable"
    | "candidate_future_missing"
    | "compression_lost"
    | "model_reason_omitted"
    | "model_reason_used";
}

export function analyzeSerializedCandidateFutures(
  packet: DeliberationPacket,
  serializedCandidateFutures: unknown[],
  decisionClass: string
): CandidateFutureReviewAnalysis {
  const serialized = serializedCandidateFutures.filter(isRecord);
  const completeness: CandidateFutureCompletenessSummary = {
    futureCount: serialized.length,
    withCoreTacticalFacts: 0,
    withBenefit: 0,
    withCost: 0,
    withBenefitOrCost: 0,
    withRiskOrUncertainty: 0,
    withAssumptionOrInvalidation: 0,
    withPredictionCheckTrace: 0,
    withCoreTradeoff: 0,
    completeEnough: 0,
    shallowFutureCount: 0
  };
  const reviewSignals: Record<string, number> = {};
  const proposalSignals: Record<string, number> = {};

  for (const future of serialized) {
    const hasTacticalFacts = hasCoreTacticalFacts(future);
    const hasBenefitValue = hasBenefit(future);
    const hasCostValue = hasCost(future);
    const hasRiskValue = hasRiskOrUncertainty(future);
    const hasAssumptionValue = hasAssumptionOrInvalidation(future);
    const hasPredictionValue = hasPredictionCheckTrace(future);
    const hasTradeoffValue = hasCoreTradeoff(future, hasBenefitValue || hasCostValue, hasRiskValue, hasAssumptionValue);
    if (hasTacticalFacts) completeness.withCoreTacticalFacts += 1;
    if (hasBenefitValue) completeness.withBenefit += 1;
    if (hasCostValue) completeness.withCost += 1;
    if (hasBenefitValue || hasCostValue) completeness.withBenefitOrCost += 1;
    if (hasRiskValue) completeness.withRiskOrUncertainty += 1;
    if (hasAssumptionValue) completeness.withAssumptionOrInvalidation += 1;
    if (hasPredictionValue) completeness.withPredictionCheckTrace += 1;
    if (hasTradeoffValue) completeness.withCoreTradeoff += 1;
    const missingDimensions = [
      !hasTacticalFacts,
      !(hasBenefitValue || hasCostValue),
      !hasRiskValue,
      !hasAssumptionValue,
      !hasPredictionValue,
      !hasTradeoffValue
    ].filter(Boolean).length;
    const completeEnough = hasTacticalFacts &&
      (hasBenefitValue || hasCostValue) &&
      (hasRiskValue || hasAssumptionValue) &&
      (hasTradeoffValue || hasPredictionValue);
    if (completeEnough) completeness.completeEnough += 1;
    if (missingDimensions >= 3 || !completeEnough) {
      completeness.shallowFutureCount += 1;
      increment(reviewSignals, "shallow_candidate_future");
    }
  }

  if (cuePresentInOriginal(packet, SURVIVAL_PATTERN) && !cuePresentInSerialized(serialized, SURVIVAL_PATTERN)) {
    increment(reviewSignals, "missing_survival_line");
  }
  if (cuePresentInOriginal(packet, LETHAL_PATTERN) && !cuePresentInSerialized(serialized, LETHAL_PATTERN)) {
    increment(reviewSignals, "missing_lethal_line");
  }
  if (resourceCuePresentInOriginal(packet) && !resourceCuePresentInSerialized(serialized)) {
    increment(reviewSignals, "missing_resource_tradeoff");
  }
  if (/^card_reward:llm_required$/u.test(decisionClass) && cardRewardDirectionCuePresentInOriginal(packet) && !cardRewardDirectionCuePresentInSerialized(serialized)) {
    increment(reviewSignals, "missing_card_reward_direction");
  }
  if (futureRiskPresentInOriginal(packet) && !futureRiskPresentInSerialized(serialized)) {
    increment(reviewSignals, "missing_future_risk");
  }

  if ((reviewSignals.missing_survival_line ?? 0) > 0 || (reviewSignals.missing_lethal_line ?? 0) > 0 || (reviewSignals.missing_card_reward_direction ?? 0) > 0) {
    increment(proposalSignals, "candidate_template_improvement_proposal");
  }
  if (serialized.length > 0 && completeness.withCoreTacticalFacts < serialized.length) {
    increment(proposalSignals, "context_feature_proposal");
  }
  if (originalHasPredictionChecks(packet) && completeness.withPredictionCheckTrace < Math.min(serialized.length, packet.candidateFutures.length)) {
    increment(proposalSignals, "prediction_check_improvement_proposal");
  }

  return {
    completeness,
    reviewSignals,
    proposalSignals,
    cueAttribution: buildCandidateFutureCueAttribution(packet, serialized, decisionClass)
  };
}

export function analyzeReasonCueAttribution(
  reason: unknown,
  cueAttribution: unknown
): ReasonCueAttributionSummary | undefined {
  if (!isRecord(cueAttribution) || !isRecord(cueAttribution.cues)) return undefined;
  const reasonText = typeof reason === "string" ? reason : "";
  const cues: Record<string, ReasonCueAttribution> = {};
  const sourceCounts: Record<string, number> = {};
  const missingDespiteSerialized: string[] = [];
  for (const [name, value] of Object.entries(cueAttribution.cues)) {
    if (!isRecord(value)) continue;
    const original = value.original === true;
    const serialized = value.serialized === true;
    const modelReason = cuePattern(name).test(reasonText);
    const source = reasonCueSource(original, serialized, modelReason);
    cues[name] = { original, serialized, modelReason, source };
    increment(sourceCounts, source);
    if (source === "model_reason_omitted") missingDespiteSerialized.push(name);
  }
  return {
    cues,
    sourceCounts,
    missingDespiteSerialized
  };
}

const SURVIVAL_PATTERN = /surviv|survival|block|defend|mitigat|avoid damage|incoming damage|stabil/i;
const LETHAL_PATTERN = /lethal|kill|finish|execute|dead this turn/i;
const RESOURCE_PATTERN = /energy|cost|draw|discard|retain|exhaust|gold|hp|potion|resource/i;
const CARD_REWARD_PATTERN = /deck|curve|archetype|synergy|scaling|draw|block|damage|thin|upgrade|engine/i;
const TRADEOFF_PATTERN = /\b(while|but|vs|tradeoff|trade-off|watch|preserve|risk|unless|avoid|delay|commit|lock-?in|opportunity cost|skip value|at the cost of|cost)\b/i;
const SPECIFIC_TACTICAL_FACT_PATTERN = /deck|card|reward|route|map|node|elite|shop|rest|damage|block|energy|potion|enemy|hp/i;

function buildCandidateFutureCueAttribution(
  packet: DeliberationPacket,
  serialized: JsonRecord[],
  decisionClass: string
): CandidateFutureCueAttributionSummary {
  const cueNames = cueNamesForDecisionClass(decisionClass);
  const cues: Record<string, CandidateFutureCueAttribution> = {};
  const sourceCounts: Record<string, number> = {};
  const missingInOriginal: string[] = [];
  const lostInSerialization: string[] = [];
  const preservedInSerialization: string[] = [];
  for (const name of cueNames) {
    const pattern = cuePattern(name);
    const original = cuePresentInOriginal(packet, pattern);
    const serializedCue = cuePresentInSerialized(serialized, pattern);
    const source = cueSource(original, serializedCue);
    cues[name] = { original, serialized: serializedCue, source };
    increment(sourceCounts, source);
    if (source === "candidate_future_missing") missingInOriginal.push(name);
    if (source === "compression_lost") lostInSerialization.push(name);
    if (source === "serialization_preserved") preservedInSerialization.push(name);
  }
  return {
    cues,
    sourceCounts,
    missingInOriginal,
    lostInSerialization,
    preservedInSerialization
  };
}

function cueNamesForDecisionClass(decisionClass: string): string[] {
  const names = ["tradeoff", "resource_tradeoff", "future_risk"];
  if (/^combat:/u.test(decisionClass)) names.push("survival_line", "lethal_line");
  if (/^card_reward:/u.test(decisionClass)) names.push("card_reward_direction");
  if (/^map:/u.test(decisionClass)) names.push("route_risk");
  return names;
}

function cuePattern(name: string): RegExp {
  switch (name) {
    case "survival_line":
      return SURVIVAL_PATTERN;
    case "lethal_line":
      return LETHAL_PATTERN;
    case "resource_tradeoff":
      return RESOURCE_PATTERN;
    case "card_reward_direction":
      return CARD_REWARD_PATTERN;
    case "future_risk":
    case "route_risk":
      return /risk|uncertain|assum|invalid|elite|rest|shop|path|route|lock|danger|future/i;
    case "tradeoff":
      return TRADEOFF_PATTERN;
    default:
      return new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }
}

function cueSource(original: boolean, serialized: boolean): CandidateFutureCueAttribution["source"] {
  if (!original && !serialized) return "candidate_future_missing";
  if (original && !serialized) return "compression_lost";
  if (serialized) return "serialization_preserved";
  return "not_applicable";
}

function reasonCueSource(original: boolean, serialized: boolean, modelReason: boolean): ReasonCueAttribution["source"] {
  if (!original && !serialized) return "candidate_future_missing";
  if (original && !serialized) return "compression_lost";
  if (serialized && !modelReason) return "model_reason_omitted";
  if (modelReason) return "model_reason_used";
  return "not_applicable";
}

function hasCoreTacticalFacts(future: JsonRecord): boolean {
  if (nonEmptyStringArray(future.tacticalFacts).length > 0 || objectSize(future.deterministicCalculations) > 0) return true;
  if (hasSpecificPlanFact(future.plan)) return true;
  return nonEmptyStringArray(future.predictedOutcome).some((value) => SPECIFIC_TACTICAL_FACT_PATTERN.test(value));
}

function hasBenefit(future: JsonRecord): boolean {
  return nonEmptyStringArray(future.predictedOutcome).length > 0 || positiveTradeoffText(future.tradeoff);
}

function hasCost(future: JsonRecord): boolean {
  return nonEmptyStringArray(future.cost).length > 0 || tradeoffHasResourceCue(future.tradeoff);
}

function hasRiskOrUncertainty(future: JsonRecord): boolean {
  return nonEmptyStringArray(future.risk).length > 0 ||
    nonEmptyStringArray(future.uncertainty).length > 0 ||
    watchTradeoffText(future.tradeoff);
}

function hasAssumptionOrInvalidation(future: JsonRecord): boolean {
  return nonEmptyStringArray(future.assumptions).length > 0 || nonEmptyStringArray(future.invalidationTriggers).length > 0;
}

function hasPredictionCheckTrace(future: JsonRecord): boolean {
  if (!Array.isArray(future.predictionChecks)) return false;
  return future.predictionChecks.some((check) =>
    isRecord(check) &&
    (typeof check.type === "string" ||
      typeof check.prediction === "string" ||
      nonEmptyStringArray(check.expected).length > 0 ||
      (typeof check.expected === "string" && check.expected.trim().length > 0) ||
      objectSize(check.expected) > 0)
  );
}

function hasCoreTradeoff(
  future: JsonRecord,
  hasBenefitValue: boolean,
  hasRiskValue: boolean,
  hasAssumptionValue: boolean
): boolean {
  if (typeof future.tradeoff === "string" && future.tradeoff.trim().length > 0) return true;
  return hasBenefitValue && (hasRiskValue || hasAssumptionValue);
}

function cuePresentInOriginal(packet: DeliberationPacket, pattern: RegExp): boolean {
  return packet.candidateFutures.some((future) => futureStrings(future).some((value) => pattern.test(value)));
}

function cuePresentInSerialized(futures: JsonRecord[], pattern: RegExp): boolean {
  return futures.some((future) => futureStrings(future).some((value) => pattern.test(value)));
}

function resourceCuePresentInOriginal(packet: DeliberationPacket): boolean {
  return cuePresentInOriginal(packet, RESOURCE_PATTERN);
}

function resourceCuePresentInSerialized(futures: JsonRecord[]): boolean {
  return futures.some((future) => {
    if (nonEmptyStringArray(future.cost).length > 0) return true;
    return futureStrings(future).some((value) => RESOURCE_PATTERN.test(value));
  });
}

function cardRewardDirectionCuePresentInOriginal(packet: DeliberationPacket): boolean {
  return packet.candidateFutures.some((future) => futureStrings(future).some((value) => CARD_REWARD_PATTERN.test(value)));
}

function cardRewardDirectionCuePresentInSerialized(futures: JsonRecord[]): boolean {
  return cuePresentInSerialized(futures, CARD_REWARD_PATTERN);
}

function futureRiskPresentInOriginal(packet: DeliberationPacket): boolean {
  return packet.candidateFutures.some((future) =>
    (future.risk?.length ?? 0) > 0 ||
    (future.uncertainty?.length ?? 0) > 0 ||
    (future.assumptions?.length ?? 0) > 0 ||
    (future.invalidationTriggers?.length ?? 0) > 0
  );
}

function futureRiskPresentInSerialized(futures: JsonRecord[]): boolean {
  return futures.some((future) =>
    nonEmptyStringArray(future.risk).length > 0 ||
    nonEmptyStringArray(future.uncertainty).length > 0 ||
    nonEmptyStringArray(future.assumptions).length > 0 ||
    nonEmptyStringArray(future.invalidationTriggers).length > 0
  );
}

function originalHasPredictionChecks(packet: DeliberationPacket): boolean {
  return packet.candidateFutures.some((future) => (future.predictionChecks?.length ?? 0) > 0);
}

function futureStrings(value: unknown): string[] {
  if (typeof value === "string") return value.trim().length > 0 ? [value.trim()] : [];
  if (Array.isArray(value)) return value.flatMap((item) => futureStrings(item));
  if (!isRecord(value)) return [];
  return Object.values(value).flatMap((item) => futureStrings(item));
}

function nonEmptyStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function objectSize(value: unknown): number {
  return isRecord(value) ? Object.keys(value).length : 0;
}

function positiveTradeoffText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0 && !/^watch\b/i.test(value.trim());
}

function watchTradeoffText(value: unknown): boolean {
  return typeof value === "string" && /\bwatch\b/i.test(value);
}

function tradeoffHasResourceCue(value: unknown): boolean {
  return typeof value === "string" && RESOURCE_PATTERN.test(value);
}

function hasSpecificPlanFact(value: unknown): boolean {
  return typeof value === "string" && SPECIFIC_TACTICAL_FACT_PATTERN.test(value);
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}
