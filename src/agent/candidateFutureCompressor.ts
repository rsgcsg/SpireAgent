import type { DeliberationPacket, JsonRecord } from "../domain/types.js";
import type { ScoredCandidate } from "./types.js";
import type { WorkspaceAblationMode } from "./workspaceExperimentConfig.js";
import { isRecord } from "./utils.js";

export interface WorkspaceCandidateFutureSerializationResult {
  serialized: JsonRecord[];
}

interface CombatCompressionProfile {
  boss: boolean;
  highPressure: boolean;
  criticalPressure: boolean;
  multipleEnemies: boolean;
  incomingDamage: number;
  hpRatio: number | undefined;
  maxFutures: number;
}

interface FutureFieldCaps {
  label: number;
  plan: number;
  text: number;
  shortText: number;
  outcomeText: number;
  outcomeItems: number;
  riskItems: number;
  predictionCheckItems: number;
  predictionText: number;
  expectedText: number;
  expectedFacts: number;
  mechanicsKeys: number;
  factItems: number;
}

export function serializeWorkspaceCandidateFutures(
  packet: DeliberationPacket,
  candidates: ScoredCandidate[],
  mode: WorkspaceAblationMode
): WorkspaceCandidateFutureSerializationResult {
  const fullSerialized = packet.candidateFutures.slice(0, 8).map(serializeFullCandidateFuture);
  if (mode !== "full_bounded_candidate_futures") {
    return { serialized: fullSerialized };
  }
  if (packet.screen !== "combat") {
    return {
      serialized: packet.candidateFutures.slice(0, 8).map(serializeStrategicNonCombatFuture)
    };
  }
  const rankedCandidates = new Map(candidates.map((candidate, index) => [candidate.id, index]));
  const pressureProfile = buildCombatCompressionProfile(packet);
  return {
    serialized: packet.candidateFutures
      .map((future, index) => ({ future, index }))
      .sort((left, right) =>
        candidateFuturePriority(right.future, right.index, rankedCandidates) - candidateFuturePriority(left.future, left.index, rankedCandidates)
      )
      .slice(0, pressureProfile.maxFutures)
      .map(({ future, index }) => serializeBoundedCandidateFuture(
        future,
        index,
        candidateFuturePriority(future, index, rankedCandidates),
        pressureProfile
      ))
  };
}

function serializeFullCandidateFuture(future: DeliberationPacket["candidateFutures"][number]): JsonRecord {
  return {
    id: future.sourceCandidateId ?? future.id,
    futureId: future.id,
    label: future.label,
    plan: future.plan,
    predictedOutcome: future.predictedOutcome,
    predictionChecks: future.predictionChecks,
    cost: future.cost,
    risk: future.risk,
    assumptions: future.assumptions,
    invalidationTriggers: future.invalidationTriggers,
    confidence: future.confidence
  };
}

function serializeBoundedCandidateFuture(
  future: DeliberationPacket["candidateFutures"][number],
  index: number,
  priority: number,
  pressureProfile: CombatCompressionProfile
): JsonRecord {
  const highPriority = priority >= 8;
  const caps = fieldCapsForFuture(pressureProfile, highPriority);
  return compactObject({
    id: future.sourceCandidateId ?? future.id,
    label: trimText(future.label, caps.label),
    plan: pressureProfile.criticalPressure && !highPriority ? undefined : trimText(future.plan, caps.plan),
    deterministicCalculations: compactStructuredValue(future.deterministicCalculations, caps.mechanicsKeys, 1, caps.text),
    tacticalFacts: summarizeFutureTacticalFacts(future, caps.factItems, caps.text),
    tradeoff: summarizeFutureTradeoff(future, caps.text),
    predictedOutcome: pressureProfile.criticalPressure ? undefined : limitStringList(future.predictedOutcome, caps.outcomeItems, caps.outcomeText),
    predictionChecks: limitPredictionChecks(future.predictionChecks, caps.predictionCheckItems, caps),
    cost: limitStringList(future.cost, 1, caps.shortText),
    risk: limitStringList(future.risk, caps.riskItems, caps.text),
    uncertainty: limitStringList(future.uncertainty, 1, caps.shortText),
    assumptions: limitStringList(future.assumptions, 1, caps.shortText),
    invalidationTriggers: limitStringList(future.invalidationTriggers, 1, caps.shortText),
    confidence: future.confidence
  });
}

function serializeStrategicNonCombatFuture(
  future: DeliberationPacket["candidateFutures"][number]
): JsonRecord {
  return compactObject({
    id: future.sourceCandidateId ?? future.id,
    futureId: future.id,
    label: trimText(future.label, 120),
    plan: trimText(future.plan, 148),
    deterministicCalculations: compactStructuredValue(future.deterministicCalculations, 5, 2, 76),
    tacticalFacts: summarizeNonCombatStrategicFacts(future, 4, 84),
    tradeoff: summarizeFutureTradeoff(future, 108),
    predictedOutcome: limitStringList(future.predictedOutcome, 3, 84),
    predictionChecks: limitPredictionChecks(future.predictionChecks, 2, {
      label: 120,
      plan: 120,
      text: 84,
      shortText: 72,
      outcomeText: 84,
      outcomeItems: 3,
      riskItems: 2,
      predictionCheckItems: 2,
      predictionText: 72,
      expectedText: 60,
      expectedFacts: 2,
      mechanicsKeys: 4,
      factItems: 4
    }),
    cost: limitStringList(future.cost, 2, 72),
    risk: limitStringList(future.risk, 2, 84),
    uncertainty: limitStringList(future.uncertainty, 1, 72),
    assumptions: limitStringList(future.assumptions, 2, 72),
    invalidationTriggers: limitStringList(future.invalidationTriggers, 2, 72),
    confidence: future.confidence
  });
}

function buildCombatCompressionProfile(packet: DeliberationPacket): CombatCompressionProfile {
  const stateFacts = isRecord(packet.stateFacts) ? packet.stateFacts : undefined;
  const deterministic = isRecord(packet.deterministicCalculations) ? packet.deterministicCalculations : undefined;
  const hp = firstNumber(stateFacts?.playerHp, stateFacts?.hp, deterministic?.playerHp, deterministic?.hp);
  const maxHp = firstNumber(stateFacts?.playerMaxHp, stateFacts?.maxHp, deterministic?.playerMaxHp, deterministic?.maxHp);
  const incomingDamage = firstNumber(
    stateFacts?.incomingDamage,
    deterministic?.incomingDamage,
    stateFacts?.incomingIntentDamage
  ) ?? 0;
  const enemyCount = firstNumber(stateFacts?.enemyCount, deterministic?.enemyCount) ?? (Array.isArray(packet.enemyIntent) ? packet.enemyIntent.length : 0);
  const stateType = firstNonEmptyString(
    stateFacts?.combatType,
    stateFacts?.encounterType,
    stateFacts?.roomType,
    deterministic?.combatType,
    packet.stateSummary
  );
  const hpRatio = typeof hp === "number" && typeof maxHp === "number" && maxHp > 0 ? hp / maxHp : undefined;
  const boss = /boss/i.test(stateType ?? "");
  const multipleEnemies = enemyCount >= 2;
  const highPressure = boss || multipleEnemies || incomingDamage >= 10 || (typeof hpRatio === "number" && hpRatio <= 0.6);
  const criticalPressure = boss || incomingDamage >= 14 || (typeof hpRatio === "number" && hpRatio <= 0.45);
  return {
    boss,
    highPressure,
    criticalPressure,
    multipleEnemies,
    incomingDamage,
    hpRatio,
    maxFutures: criticalPressure ? 3 : highPressure ? (multipleEnemies ? 4 : 5) : 6
  };
}

function fieldCapsForFuture(profile: CombatCompressionProfile, highPriority: boolean): FutureFieldCaps {
  if (profile.criticalPressure) {
    return {
      label: highPriority ? 96 : 88,
      plan: highPriority ? 96 : 80,
      text: highPriority ? 64 : 56,
      shortText: highPriority ? 56 : 48,
      outcomeText: highPriority ? 60 : 52,
      outcomeItems: 1,
      riskItems: 1,
      predictionCheckItems: 1,
      predictionText: highPriority ? 56 : 44,
      expectedText: highPriority ? 40 : 32,
      expectedFacts: 1,
      mechanicsKeys: 2,
      factItems: highPriority ? 2 : 1
    };
  }
  if (profile.highPressure) {
    return {
      label: highPriority ? 110 : 96,
      plan: highPriority ? 112 : 96,
      text: highPriority ? 84 : 72,
      shortText: highPriority ? 72 : 60,
      outcomeText: highPriority ? 76 : 64,
      outcomeItems: 1,
      riskItems: highPriority ? 2 : 1,
      predictionCheckItems: 1,
      predictionText: highPriority ? 72 : 56,
      expectedText: highPriority ? 56 : 44,
      expectedFacts: 1,
      mechanicsKeys: 3,
      factItems: highPriority ? 4 : 3
    };
  }
  return {
    label: highPriority ? 120 : 104,
    plan: highPriority ? 120 : 104,
    text: highPriority ? 92 : 80,
    shortText: highPriority ? 76 : 64,
    outcomeText: highPriority ? 84 : 72,
    outcomeItems: highPriority ? 2 : 1,
    riskItems: highPriority ? 2 : 1,
    predictionCheckItems: highPriority ? 2 : 1,
    predictionText: highPriority ? 76 : 60,
    expectedText: highPriority ? 68 : 52,
    expectedFacts: highPriority ? 2 : 1,
    mechanicsKeys: 3,
    factItems: highPriority ? 4 : 3
  };
}

function summarizeFutureTacticalFacts(
  future: DeliberationPacket["candidateFutures"][number],
  maxItems: number,
  maxLength: number
): string[] | undefined {
  const facts = new Set<string>();
  const calculations = isRecord(future.deterministicCalculations) ? future.deterministicCalculations : undefined;
  const mechanics = isRecord(calculations?.mechanics) ? calculations.mechanics : undefined;
  const cardName = firstNonEmptyString(
    mechanics?.cardName,
    mechanics?.primaryCard,
    mechanics?.card,
    calculations?.cardName,
    calculations?.primaryCard,
    calculations?.card
  );
  const energyCost = firstNumber(mechanics?.energyCost, calculations?.energyCost, calculations?.cost, calculations?.energySpend);
  const expectedDamage = firstNumber(mechanics?.expectedDamage, calculations?.expectedDamage);
  const expectedBlockGain = firstNumber(mechanics?.expectedBlockGain, calculations?.expectedBlockGain);
  const targetHpBefore = firstNumber(mechanics?.targetHpBefore, calculations?.targetHpBefore);
  const targetBlockBefore = firstNumber(mechanics?.targetBlockBefore, calculations?.targetBlockBefore);
  const score = firstNumber(calculations?.score, calculations?.candidateScore);
  const rank = firstNumber(calculations?.rank, calculations?.candidateRank);
  if (cardName) facts.add(trimText(cardName, maxLength) ?? cardName);
  if (typeof energyCost === "number") facts.add(`cost ${energyCost}`);
  if (typeof expectedDamage === "number" && expectedDamage > 0) facts.add(`damage ${expectedDamage}`);
  if (typeof expectedBlockGain === "number" && expectedBlockGain > 0) facts.add(`block +${expectedBlockGain}`);
  if (typeof targetBlockBefore === "number" && targetBlockBefore > 0) facts.add(`target block ${targetBlockBefore}`);
  if (typeof targetHpBefore === "number" && typeof expectedDamage === "number" && expectedDamage >= targetHpBefore) {
    facts.add("lethal if hit lands");
  }
  if (typeof score === "number") facts.add(`score ${score.toFixed(1)}`);
  if (typeof rank === "number") facts.add(`rank ${rank}`);
  for (const cue of futureCueFacts(future, maxLength)) facts.add(cue);
  const normalized = [...facts]
    .map((item) => trimText(item, maxLength))
    .filter((item): item is string => typeof item === "string" && item.length > 0);
  return normalized.length > 0 ? normalized.slice(0, maxItems) : undefined;
}

function summarizeFutureTradeoff(
  future: DeliberationPacket["candidateFutures"][number],
  maxLength: number
): string | undefined {
  const upside = firstNonEmptyString(...(future.predictedOutcome ?? []));
  const cost = firstNonEmptyString(...(future.cost ?? []));
  const downside = firstNonEmptyString(
    ...(future.risk ?? []),
    ...(future.uncertainty ?? []),
    ...(future.assumptions ?? []),
    ...(future.invalidationTriggers ?? [])
  );
  if (!upside && !cost && !downside) return undefined;
  if (upside && cost && downside) return trimText(`${upside}; pay ${cost}; watch ${downside}.`, maxLength);
  if (upside && cost) return trimText(`${upside}; pay ${cost}.`, maxLength);
  if (upside && downside) return trimText(`${upside}; watch ${downside}.`, maxLength);
  if (cost && downside) return trimText(`Pay ${cost}; watch ${downside}.`, maxLength);
  if (upside) return trimText(upside, maxLength);
  if (cost) return trimText(`Pay ${cost}.`, maxLength);
  return trimText(`Watch ${downside}.`, maxLength);
}

function summarizeNonCombatStrategicFacts(
  future: DeliberationPacket["candidateFutures"][number],
  maxItems: number,
  maxLength: number
): string[] | undefined {
  const facts = new Set<string>();
  const calculations = isRecord(future.deterministicCalculations) ? future.deterministicCalculations : undefined;
  const mechanics = isRecord(calculations?.mechanics) ? calculations.mechanics : undefined;
  const cardName = firstNonEmptyString(mechanics?.cardName, calculations?.cardName);
  const cardType = firstNonEmptyString(mechanics?.cardType, calculations?.cardType);
  const cardRarity = firstNonEmptyString(mechanics?.cardRarity, calculations?.cardRarity);
  const deckNeed = firstNonEmptyString(mechanics?.deckNeed, calculations?.deckNeed);
  const routePressure = firstNonEmptyString(mechanics?.routePressure, calculations?.routePressure);
  const rewardExpectation = firstNonEmptyString(mechanics?.routeRewardExpectation, calculations?.routeRewardExpectation);
  const nodeType = firstNonEmptyString(mechanics?.nodeType, calculations?.nodeType);
  if (cardName) facts.add(cardName);
  if (cardType) facts.add(`card type ${cardType}`);
  if (cardRarity) facts.add(`rarity ${cardRarity}`);
  if (deckNeed) facts.add(`deck needs ${deckNeed}`);
  if (nodeType) facts.add(`node ${nodeType}`);
  if (routePressure) facts.add(routePressure);
  if (rewardExpectation) facts.add(rewardExpectation);
  for (const reason of nonEmptyStringArray(mechanics?.strategicReasons).slice(0, 2)) facts.add(reason);
  for (const cue of futureCueStrings(future).filter((value) => /deck|route|path|lock|elite|rest|shop|reward|timing|scaling|draw|energy|bloat|skip|hp|resource|monster|unknown|opportunity cost/i.test(value)).slice(0, 3)) {
    facts.add(cue);
  }
  const normalized = [...facts]
    .map((item) => trimText(item, maxLength))
    .filter((item): item is string => typeof item === "string" && item.length > 0);
  return normalized.length > 0 ? normalized.slice(0, maxItems) : undefined;
}

function futureCueFacts(
  future: DeliberationPacket["candidateFutures"][number],
  maxLength: number
): string[] {
  const cues = futureCueStrings(future)
    .map((value) => trimText(value, maxLength))
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  return cues.slice(0, 2);
}

function futureCueStrings(future: DeliberationPacket["candidateFutures"][number]): string[] {
  const values = [
    ...limitStringList(future.predictedOutcome, 2, 72) ?? [],
    ...limitStringList(future.risk, 2, 72) ?? [],
    ...limitStringList(future.uncertainty, 1, 72) ?? []
  ];
  return values.filter((value) => /block|surviv|incoming damage|mitigat|lethal|kill|energy|draw|discard/i.test(value));
}

function limitPredictionChecks(value: unknown, maxItems: number, caps: FutureFieldCaps): JsonRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter(isRecord)
    .slice(0, maxItems)
    .map((check) => {
      const type = typeof check.type === "string" ? check.type : undefined;
      return compactObject({
        type,
        severity: typeof check.severity === "string" ? check.severity : undefined,
        prediction: trimText(check.prediction, caps.predictionText),
        expected: summarizePredictionCheckExpected(type, check.expected, caps.expectedFacts, caps.expectedText)
      });
    });
  return items.length > 0 ? items : undefined;
}

function summarizePredictionCheckExpected(
  type: string | undefined,
  expected: unknown,
  maxFacts: number,
  maxLength: number
): string[] | string | undefined {
  const facts = predictionCheckExpectedFacts(type, expected, maxFacts)
    .map((fact) => trimText(fact, maxLength))
    .filter((fact): fact is string => typeof fact === "string" && fact.length > 0);
  if (facts.length > 0) return facts;
  if (typeof expected === "string") return trimText(expected, maxLength);
  return trimText(JSON.stringify(compactStructuredValue(expected, 2, 1, maxLength)), maxLength);
}

function predictionCheckExpectedFacts(type: string | undefined, expected: unknown, maxFacts: number): string[] {
  const facts: string[] = [];
  if (!isRecord(expected)) return facts;
  switch (type) {
    case "card_removed_from_hand":
      buildCardExpectedFact(expected, facts);
      buildHandCountFact(expected, facts);
      break;
    case "resource_delta":
      buildEnergyExpectedFact(expected, facts);
      break;
    case "enemy_hp_or_block_delta":
      buildHpExpectedFact(expected, facts, "enemy hp");
      buildBlockExpectedFact(expected, facts, "enemy block");
      break;
    case "block_delta":
      buildBlockExpectedFact(expected, facts, "block");
      break;
    case "player_hp_delta":
      buildHpExpectedFact(expected, facts, "hp");
      break;
    case "phase_or_visible_progress":
    case "phase_or_turn_change":
    case "route_progress":
      actionFact(expected, facts);
      break;
    default:
      break;
  }
  booleanFact(expected, facts, "lethal");
  booleanFact(expected, facts, "survive");
  if (facts.length > 0) return facts.slice(0, maxFacts);
  for (const [key, value] of Object.entries(expected)) {
    if (facts.length >= maxFacts) break;
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      facts.push(`${key}:${String(value)}`);
    }
  }
  return facts.slice(0, maxFacts);
}

function compactStructuredValue(value: unknown, maxKeys: number, maxDepth: number, maxStringLength: number): unknown {
  if (typeof value === "string") return trimText(value, maxStringLength);
  if (Array.isArray(value)) return value.slice(0, maxKeys).map((item) => compactStructuredValue(item, maxKeys, maxDepth - 1, maxStringLength));
  if (!isRecord(value) || maxDepth <= 0) return value;
  return compactObject(
    Object.fromEntries(
      Object.entries(value)
        .slice(0, maxKeys)
        .map(([key, item]) => [key, compactStructuredValue(item, Math.max(2, maxKeys - 1), maxDepth - 1, maxStringLength)])
    )
  );
}

function compactObject<T extends JsonRecord>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function trimText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 3))}...`;
}

function limitStringList(value: unknown, maxItems: number, maxLength: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => trimText(item, maxLength))
    .filter((item): item is string => typeof item === "string" && item.length > 0);
  return items.length > 0 ? items.slice(0, maxItems) : undefined;
}

function nonEmptyStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => typeof item === "string" ? item.trim() : "")
    .filter((item): item is string => item.length > 0);
}

function buildCardExpectedFact(expected: JsonRecord, facts: string[]): void {
  const name = firstNonEmptyString(expected.cardName, expected.card, expected.removedCardName);
  const index = firstNumber(expected.handIndex, expected.cardIndex, expected.removedHandIndex);
  if (name && typeof index === "number") {
    facts.push(`remove ${name}@${index}`);
    return;
  }
  if (name) facts.push(`remove ${name}`);
}

function buildHandCountFact(expected: JsonRecord, facts: string[]): void {
  const before = firstNumber(expected.handCountBefore, expected.handBefore);
  const after = firstNumber(expected.handCountAfter, expected.handAfter);
  if (typeof before === "number" && typeof after === "number") facts.push(`hand ${before}->${after}`);
}

function buildEnergyExpectedFact(expected: JsonRecord, facts: string[]): void {
  const before = firstNumber(expected.energyBefore, expected.before, expected.playerEnergyBefore);
  const after = firstNumber(expected.energyAfter, expected.after, expected.playerEnergyAfter);
  const cost = firstNumber(expected.energyCost, expected.cost, expected.delta);
  if (expected.energyChanged === true) {
    facts.push("energy changes");
    return;
  }
  if (typeof before === "number" && typeof after === "number") {
    facts.push(`energy ${before}->${after}`);
    return;
  }
  if (typeof cost === "number") facts.push(`energy cost ${Math.abs(cost)}`);
}

function buildBlockExpectedFact(expected: JsonRecord, facts: string[], prefix: string): void {
  const before = firstNumber(expected.blockBefore, expected.beforeBlock, expected.playerBlockBefore, expected.enemyBlockBefore);
  const after = firstNumber(expected.blockAfter, expected.afterBlock, expected.playerBlockAfter, expected.enemyBlockAfter);
  if (typeof before === "number" && typeof after === "number") facts.push(`${prefix} ${before}->${after}`);
}

function buildHpExpectedFact(expected: JsonRecord, facts: string[], prefix: string): void {
  const before = firstNumber(expected.hpBefore, expected.beforeHp, expected.playerHpBefore, expected.enemyHpBefore);
  const after = firstNumber(expected.hpAfter, expected.afterHp, expected.playerHpAfter, expected.enemyHpAfter);
  if (typeof before === "number" && typeof after === "number") facts.push(`${prefix} ${before}->${after}`);
}

function actionFact(expected: JsonRecord, facts: string[]): void {
  const action = firstNonEmptyString(expected.action, expected.transition, expected.progress, expected.phase);
  const screen = firstNonEmptyString(expected.screen, expected.nextScreen);
  if (action && screen) {
    facts.push(`${action} -> ${screen}`);
    return;
  }
  if (action) facts.push(action);
}

function booleanFact(expected: JsonRecord, facts: string[], key: string, label = key): void {
  if (typeof expected[key] === "boolean") facts.push(`${label}:${expected[key] ? "yes" : "no"}`);
}

function candidateFuturePriority(
  future: DeliberationPacket["candidateFutures"][number],
  index: number,
  rankedCandidates: Map<string, number>
): number {
  const candidateRank = rankedCandidates.get(future.sourceCandidateId ?? future.id) ?? index + 4;
  const riskCount = (future.risk?.length ?? 0) + (future.invalidationTriggers?.length ?? 0) + (future.uncertainty?.length ?? 0);
  const outcomeCount = (future.predictedOutcome?.length ?? 0) + (future.predictionChecks?.length ?? 0);
  const confidence = typeof future.confidence === "number" ? future.confidence : 0.5;
  return Math.max(0, 12 - candidateRank * 2) + Math.min(3, riskCount) + Math.min(2, outcomeCount) + Math.round(confidence * 2);
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function firstNonEmptyString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}
