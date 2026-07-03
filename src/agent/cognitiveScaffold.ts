import {
  DOMAIN_SCHEMA_VERSION,
  type CandidateFuture,
  type CandidatePredictionCheck,
  type ConsolidationRecord,
  type DeliberationPacket,
  type JsonRecord,
  type MemoryActivation,
  type MemoryActivationItem,
  type PredictionAttributionBucket,
  type PredictionErrorRecord,
  type PromptParityReport,
  type SalienceSignal,
  type StrategicImpression
} from "../domain/types.js";
import { getIncomingDamage, summarizeState } from "./state.js";
import type { DecisionRoute, ExecutionCheckpoint, NormalizedState, RunMemory, ScoredCandidate } from "./types.js";
import { asString, isRecord } from "./utils.js";

export interface CognitiveScaffoldInput {
  state: NormalizedState;
  run: RunMemory;
  candidates: ScoredCandidate[];
  relevantMemories: string[];
  tags: string[];
  route?: DecisionRoute;
  uncertaintyReasons?: string[];
  derivedSnapshot?: JsonRecord;
  livePromptUsed?: boolean;
  livePromptBytes?: number;
}

export interface CognitiveScaffold {
  strategicImpression: StrategicImpression;
  salienceSignals: SalienceSignal[];
  memoryActivation: MemoryActivation;
  candidateFutures: CandidateFuture[];
  deliberationPacket: DeliberationPacket;
  promptParity: PromptParityReport;
}

export function buildCognitiveScaffold(input: CognitiveScaffoldInput): CognitiveScaffold {
  const salienceSignals = buildSalienceSignals(input);
  const strategicImpression = buildStrategicImpression(input.state, input.run, salienceSignals, input.route, input.uncertaintyReasons);
  const memoryActivation = buildMemoryActivation(input.relevantMemories, input.tags, salienceSignals);
  const candidateFutures = buildCandidateFutures(input.candidates, input.state, input.run, input.route);
  const promptParity = buildPromptParityReport(input, candidateFutures);
  const deliberationPacket: DeliberationPacket = {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    stateSummary: summarizeState(input.state),
    screen: input.state.screen,
    stateFacts: stateFacts(input.state),
    enemyIntent: enemyIntentSummary(input.state),
    handSummary: handSummary(input.state),
    deckSummary: deckSummary(input.state),
    legalActionsSummary: legalActionsSummary(input.candidates),
    topCandidates: topCandidateSummary(input.candidates),
    runMemorySummary: runMemorySummary(input.run),
    derivedKnowledgeSummary: derivedKnowledgeSummary(input.derivedSnapshot),
    strategicImpression,
    salienceSignals,
    memoryActivation,
    candidateFutures,
    deterministicCalculations: deterministicCalculations(input.state),
    tradeoffs: input.route?.reasons ?? [],
    uncertainty: input.uncertaintyReasons ?? [],
    validationConstraints: [
      "shadow_mode_only",
      "does_not_change_prompt",
      "does_not_change_candidate_order",
      "LLM must choose an existing candidate id when prompted"
    ],
    outputSchema: {
      candidateId: "string",
      confidence: "0..1 number",
      reason: "short string",
      memoryUpdates: "optional, validated elsewhere"
    },
    promptParity
  };
  return { strategicImpression, salienceSignals, memoryActivation, candidateFutures, deliberationPacket, promptParity };
}

export function buildPromptParityReport(input: CognitiveScaffoldInput, candidateFutures: CandidateFuture[]): PromptParityReport {
  const sections = [
    { name: "task", covered: true },
    { name: "output_schema", covered: true },
    { name: "state", covered: Boolean(input.state) },
    { name: "run_memory", covered: Boolean(input.run) },
    { name: "uncertainty", covered: Array.isArray(input.uncertaintyReasons) },
    { name: "relevant_memory", covered: Array.isArray(input.relevantMemories) },
    { name: "candidates", covered: candidateFutures.length > 0 },
    { name: "strategic_impression", covered: true },
    { name: "salience", covered: true },
    { name: "candidate_futures", covered: candidateFutures.length > 0 },
    { name: "derived_knowledge", covered: Boolean(input.derivedSnapshot) }
  ];
  const coveredSections = sections.filter((section) => section.covered).map((section) => section.name);
  const missingSections = sections.filter((section) => !section.covered).map((section) => section.name);
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    mode: "shadow",
    livePromptUsed: Boolean(input.livePromptUsed),
    livePromptBytes: input.livePromptBytes,
    coveredSections,
    missingSections,
    coverage: Number((coveredSections.length / sections.length).toFixed(3)),
    notes: ["shadow parity only", "live prompt remains built by src/agent/prompt.ts"]
  };
}

export function buildPredictionErrorRecord(input: {
  selectedPlan?: CandidateFuture | JsonRecord;
  checkpoint?: ExecutionCheckpoint;
  transitionId?: string;
}): PredictionErrorRecord {
  const predictions = Array.isArray(input.selectedPlan?.predictedOutcome)
    ? input.selectedPlan.predictedOutcome.map(String)
    : [];
  const plannedChecks = Array.isArray(input.selectedPlan?.predictionChecks)
    ? input.selectedPlan.predictionChecks.filter(isRecord).map(normalizePredictionCheck)
    : [];
  const reasons = input.checkpoint?.reasons ?? [];
  const typedChecks = buildTypedPredictionChecks(predictions, input.checkpoint, plannedChecks);
  const attributionBuckets = buildPredictionAttributionBuckets(typedChecks, input.checkpoint);
  const evidence: JsonRecord[] = [
    {
      checkpointKind: input.checkpoint?.kind ?? "unknown",
      settled: input.checkpoint?.settled,
      reasons,
      before: input.checkpoint?.before,
      after: input.checkpoint?.after,
      attribution: checkpointAttribution(input.checkpoint),
      typedChecks
    }
  ];
  const unknown = typedChecks.filter((check) => check.status !== "supported");
  const predictedText = predictions.length > 0
    ? predictions.join("; ")
    : plannedChecks.length > 0
      ? plannedChecks.map((check) => check.prediction).join("; ")
      : "unknown";
  const severity: PredictionErrorRecord["severity"] =
    input.checkpoint?.kind === "unknown" || input.checkpoint?.settled === false ? "warning" : "info";
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    transitionId: input.transitionId,
    predicted: predictedText,
    actual: checkpointActualSummary(input.checkpoint),
    errorType: unknown.length === 0 ? "prediction_supported" : "prediction_partially_unknown",
    attributedLayer: unknown.length === 0 ? "checkpoint" : "candidate_future",
    severity,
    evidence,
    attributionBuckets,
    proposedFix: unknown.length === 0 ? undefined : "Add stronger candidate future predicates for state-diff verification.",
    status: unknown.length === 0 ? "accepted" : "open"
  };
}

export function buildConsolidationRecord(input: {
  predictionError?: PredictionErrorRecord | JsonRecord;
  selectedPlan?: CandidateFuture | JsonRecord;
  transitionId?: string;
}): ConsolidationRecord | undefined {
  const predictionError = input.predictionError;
  if (!predictionError || predictionError.status === "accepted" || predictionError.errorType === "prediction_supported") {
    return undefined;
  }
  const buckets = Array.isArray(predictionError.attributionBuckets)
    ? predictionError.attributionBuckets.filter(isRecord)
    : [];
  const actionableBuckets = buckets.filter((bucket) => bucket.status === "unsupported" || bucket.severity === "critical");
  if (actionableBuckets.length === 0) {
    return undefined;
  }
  const layer = typeof predictionError.attributedLayer === "string" ? predictionError.attributedLayer : "unknown";
  const bucketNames = Array.from(new Set(actionableBuckets.map((bucket) => String(bucket.bucket ?? "unknown"))));
  const hasCritical = actionableBuckets.some((bucket) => bucket.severity === "critical");
  const evidenceStrength = hasCritical ? "strong" : actionableBuckets.length >= 2 ? "moderate" : "weak";
  const proposal = layer === "candidate_future"
    ? `Refine CandidateFuture mechanics or prediction predicates for unsupported attribution bucket(s): ${bucketNames.join(", ")}.`
    : `Review ${layer} attribution for unsupported bucket(s) ${bucketNames.join(", ")} before proposing any stable update.`;
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    recordId: `consolidation-${input.transitionId ?? "pending"}`,
    sourceFrameId: input.transitionId ? `frame-${input.transitionId}` : undefined,
    targetLayer: layer,
    affectedModule: layer,
    proposalKind: "learning_proposal",
    evidenceStrength,
    blockedStableTargets: ["memory", "derived_knowledge", "strategy_params", "candidate_ordering", "prompt"],
    proposal,
    proposedChange: {
      kind: "shadow_proposal",
      action: layer === "candidate_future" ? "refine_candidate_future_mechanics" : "review_attribution_before_update",
      stableMutation: false,
      allowedNextSteps: [
        "create_or_update_fixture",
        "improve_expected_vs_actual_check",
        "collect_more_executor_logged_evidence",
        "manual_review"
      ],
      forbiddenNextSteps: [
        "auto_write_memory",
        "auto_write_derived_knowledge",
        "auto_change_strategy_params",
        "auto_change_candidate_ordering",
        "replace_live_prompt"
      ]
    },
    evidence: [
      {
        predictionErrorType: predictionError.errorType,
        severity: predictionError.severity,
        selectedPlanId: input.selectedPlan?.id,
        status: predictionError.status ?? "open",
        actionableBuckets: actionableBuckets.map((bucket) => ({
            bucket: bucket.bucket,
            status: bucket.status,
            severity: bucket.severity,
            predictionTypes: bucket.predictionTypes,
            expected: bucket.expected,
            actual: bucket.actual,
            evidenceReasons: bucket.evidenceReasons
        })),
        nonActionableBucketCount: Math.max(0, buckets.length - actionableBuckets.length)
      }
    ],
    confidence: hasCritical ? 0.7 : evidenceStrength === "moderate" ? 0.55 : 0.4,
    conditions: [
      "shadow_only",
      "evidence_backed_by_prediction_attribution",
      "requires_replay_confirmation",
      "requires_manual_review_before_stable_update",
      "do_not_apply_as_stable_learning_yet"
    ],
    expiry: {
      policy: "expires_if_not_revalidated",
      maxFreshRuns: 3
    },
    revalidation: {
      requiredEvidence: ["fresh_executor_logged_transition", "eval_zero_errors", "same_attribution_bucket_or_manual_review"],
      minimumOccurrences: hasCritical ? 1 : 2
    },
    rollback: "Discard this proposal; it has not mutated memory, derived knowledge, candidate templates, or strategy params.",
    createdAt: new Date().toISOString(),
    status: "proposed"
  };
}

export function buildStrategicImpression(
  state: NormalizedState,
  run: RunMemory,
  salienceSignals: SalienceSignal[] = [],
  route?: DecisionRoute,
  uncertaintyReasons: string[] = []
): StrategicImpression {
  const incoming = getIncomingDamage(state);
  const hpRatio = hpRatioOf(state);
  const danger: string[] = [];
  const opportunity: string[] = [];
  const uncertainty: string[] = [...uncertaintyReasons];
  const resourcePressure: string[] = [];
  const deckPressure: string[] = [];
  const routePressure: string[] = [];
  const memoryResonance: string[] = [];

  if (state.screen === "combat" && incoming > 0) danger.push(`incoming_damage=${incoming}`);
  if (state.screen === "combat" && incoming >= state.player.hp) danger.push("death_risk_if_unblocked");
  if (state.screen === "combat" && incoming > state.player.block) resourcePressure.push(`block_deficit=${incoming - state.player.block}`);
  if (hpRatio <= 0.35) danger.push(`low_hp=${state.player.hp}/${state.player.maxHp}`);
  if (state.player.energy <= 1 && state.screen === "combat") resourcePressure.push(`low_energy=${state.player.energy}`);
  if (state.player.potions.length === 0) resourcePressure.push("no_potions");
  if (run.deficits.draw >= 0.6) deckPressure.push(`draw_deficit=${run.deficits.draw.toFixed(2)}`);
  if (run.deficits.block >= 0.6) deckPressure.push(`block_deficit=${run.deficits.block.toFixed(2)}`);
  if (run.deficits.scaling >= 0.65) deckPressure.push(`scaling_deficit=${run.deficits.scaling.toFixed(2)}`);
  if (state.screen === "map" && hpRatio <= 0.45) routePressure.push("low_hp_pathing_pressure");
  if (state.screen === "shop" && state.player.gold >= 100) opportunity.push(`shop_gold=${state.player.gold}`);
  if (state.screen === "card_reward") opportunity.push("deck_update_choice");
  if (state.screen === "combat" && state.enemies.some((enemy) => enemy.hp > 0 && enemy.hp <= 12)) opportunity.push("possible_near_lethal");
  if (salienceSignals.some((signal) => signal.kind === "memory_resonance")) memoryResonance.push("relevant_memory_available");
  if (route?.llmPriority === "required") uncertainty.push("llm_required_route");

  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    summary: strategicSummary(state, danger, opportunity, uncertainty),
    decisionType: `${state.screen}:${route?.kind ?? "unrouted"}`,
    isKeyDecision: route?.llmPriority === "required" || salienceSignals.some((signal) => signal.severity === "critical"),
    danger,
    opportunity,
    uncertainty,
    resourcePressure,
    deckPressure,
    routePressure,
    memoryResonance,
    salienceSignals
  };
}

export function buildSalienceSignals(input: CognitiveScaffoldInput): SalienceSignal[] {
  const { state, run, relevantMemories, route, uncertaintyReasons = [] } = input;
  const signals: SalienceSignal[] = [];
  const incoming = getIncomingDamage(state);
  const hpRatio = hpRatioOf(state);
  const livingEnemies = state.enemies.filter((enemy) => enemy.hp > 0);

  if (state.screen === "combat" && incoming >= state.player.hp) {
    signals.push(signal("danger", "death_risk", "critical", 0.95, `incoming ${incoming} >= hp ${state.player.hp}`, ["combat", "hp"]));
  } else if (state.screen === "combat" && incoming >= Math.max(12, state.player.hp * 0.45)) {
    signals.push(signal("danger", "high_incoming_damage", "warning", 0.82, `incoming ${incoming}`, ["combat", "incoming_damage"]));
  }

  if (state.screen === "combat" && incoming > state.player.block) {
    signals.push(signal("resource_pressure", "block_deficit", "warning", 0.78, `incoming ${incoming} > block ${state.player.block}`, ["combat", "block"]));
  }

  if (state.screen === "combat" && livingEnemies.some((enemy) => enemy.hp <= 12)) {
    signals.push(signal("opportunity", "high_value_swing", "info", 0.55, "at least one living enemy is near a basic attack range", ["combat", "lethal"]));
  }

  if (uncertaintyReasons.length > 0 || route?.shouldAskLlm) {
    signals.push(signal("uncertainty", "decision_uncertainty", route?.llmPriority === "required" ? "warning" : "info", 0.7, [...uncertaintyReasons, ...(route?.reasons ?? [])].slice(0, 4).join("; "), ["routing"]));
  }

  if (relevantMemories.length > 0) {
    signals.push(signal("memory_resonance", "relevant_memory_available", "info", 0.65, `${relevantMemories.length} relevant memory item(s) retrieved`, ["memory"]));
  }

  if (isIrreversibleScreen(state.screen)) {
    signals.push(signal("irreversible_choice", `${state.screen}_choice`, "warning", 0.68, "choice may alter deck, route, resources, or event outcome", [state.screen]));
  }

  if (run.riskFlags.length > 0 || highDeficitCount(run) >= 2) {
    signals.push(signal("repeated_failure_pattern", "run_risk_pattern", "warning", 0.6, [...run.riskFlags.slice(-3), `high_deficits=${highDeficitCount(run)}`].join("; "), ["run_memory"]));
  }

  if (hpRatio <= 0.35) {
    signals.push(signal("danger", "low_hp", "warning", 0.85, `hp ratio ${hpRatio.toFixed(2)}`, ["hp", "route"]));
  }

  return signals;
}

export function buildMemoryActivation(relevantMemories: string[], tags: string[], salienceSignals: SalienceSignal[] = []): MemoryActivation {
  const items: MemoryActivationItem[] = relevantMemories.map((memory, index) => ({
    memoryId: `memory-${index + 1}`,
    kind: inferMemoryKind(memory),
    summary: memory,
    relevance: Number(Math.max(0.2, 1 - index * 0.12).toFixed(2)),
    confidence: parseConfidence(memory) ?? 0.5,
    reason: activationReason(tags, salienceSignals),
    evidenceRunIds: extractRunIds(memory),
    conditions: tags.slice(0, 8),
    counterexamples: [],
    tags: tags.slice(0, 12)
  }));
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    activatedAt: new Date().toISOString(),
    queryTags: tags.slice(0, 24),
    items,
    omissions: items.length === 0 ? ["no_relevant_memory_retrieved"] : []
  };
}

export function buildCandidateFutures(
  candidates: ScoredCandidate[],
  state: NormalizedState,
  run: RunMemory,
  route?: DecisionRoute
): CandidateFuture[] {
  return candidates.map((candidate, index) => {
    const outcomes = predictedOutcome(candidate, state, run);
    const mechanics = mechanicsExpectationForCandidate(candidate, state, run);
    return {
      id: `future-${candidate.id}`,
      label: candidate.label,
      plan: planForCandidate(candidate, state, run),
      sourceCandidateId: candidate.id,
      actions: [candidate.action],
      deterministicCalculations: {
        score: candidate.score,
        confidence: candidate.confidence,
        rank: index + 1,
        route: route?.kind,
        screen: state.screen,
        mechanics
      },
      predictedOutcome: outcomes,
      predictionChecks: predictionChecksForCandidate(candidate, state, outcomes, mechanics),
      cost: costForCandidate(candidate, state, run),
      risk: futureRisksForCandidate(candidate, state, run),
      uncertainty: route?.shouldAskLlm ? ["local_scaffold_requested_llm_arbitration"] : [],
      assumptions: assumptionsForCandidate(candidate, state, run),
      invalidationTriggers: invalidationTriggersForCandidate(candidate, state, run),
      executionRequirements: ["must_match_current_state", "must_pass_action_validation"],
      confidence: candidate.confidence
    };
  });
}

function signal(
  kind: SalienceSignal["kind"],
  label: string,
  severity: NonNullable<SalienceSignal["severity"]>,
  confidence: number,
  reason: string,
  tags: string[]
): SalienceSignal {
  return { kind, label, severity, confidence, reason, tags };
}

function strategicSummary(state: NormalizedState, danger: string[], opportunity: string[], uncertainty: string[]): string {
  const parts = [`${state.screen} decision`];
  if (danger.length > 0) parts.push(`danger: ${danger.slice(0, 2).join(", ")}`);
  if (opportunity.length > 0) parts.push(`opportunity: ${opportunity.slice(0, 2).join(", ")}`);
  if (uncertainty.length > 0) parts.push(`uncertainty: ${uncertainty.slice(0, 2).join(", ")}`);
  return parts.join(" | ");
}

function deterministicCalculations(state: NormalizedState): JsonRecord {
  return {
    incomingDamage: getIncomingDamage(state),
    hpRatio: hpRatioOf(state),
    handSize: state.player.hand.length,
    potionCount: state.player.potions.length,
    livingEnemies: state.enemies.filter((enemy) => enemy.hp > 0).length
  };
}

function stateFacts(state: NormalizedState): JsonRecord {
  return {
    screen: state.screen,
    stateType: state.stateType,
    act: state.act,
    floor: state.floor,
    round: state.round,
    turn: state.turn,
    isPlayPhase: state.isPlayPhase,
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    block: state.player.block,
    energy: state.player.energy,
    maxEnergy: state.player.maxEnergy,
    gold: state.player.gold
  };
}

function enemyIntentSummary(state: NormalizedState): JsonRecord[] {
  return state.enemies
    .filter((enemy) => enemy.hp > 0)
    .map((enemy) => ({
      id: enemy.id,
      name: enemy.name,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      block: enemy.block,
      intents: enemy.intents.map((intent) => `${intent.type}:${intent.label}`)
    }));
}

function handSummary(state: NormalizedState): JsonRecord[] {
  return state.player.hand.map((card) => ({
    index: card.index,
    id: card.id,
    name: card.name,
    type: card.type,
    cost: card.cost,
    canPlay: card.canPlay,
    targetType: card.targetType
  }));
}

function deckSummary(state: NormalizedState): JsonRecord {
  return {
    drawPileCount: state.player.drawPileCount,
    discardPileCount: state.player.discardPileCount,
    exhaustPileCount: state.player.exhaustPileCount,
    handSize: state.player.hand.length,
    relicCount: state.player.relics.length,
    potionCount: state.player.potions.length,
    statusCount: state.player.status.length
  };
}

function legalActionsSummary(candidates: ScoredCandidate[]): JsonRecord[] {
  return candidates.map((candidate) => ({
    id: candidate.id,
    kind: candidate.kind,
    label: candidate.label,
    action: candidate.action
  }));
}

function topCandidateSummary(candidates: ScoredCandidate[]): JsonRecord[] {
  return candidates.slice(0, 5).map((candidate, index) => ({
    rank: index + 1,
    id: candidate.id,
    label: candidate.label,
    score: Number(candidate.score.toFixed(3)),
    confidence: Number(candidate.confidence.toFixed(3)),
    reasons: candidate.reasons.slice(0, 3),
    risks: candidate.risks.slice(0, 3)
  }));
}

function runMemorySummary(run: RunMemory): JsonRecord {
  return {
    runId: run.runId,
    character: run.character,
    act: run.act,
    floor: run.floor,
    hp: run.hp,
    maxHp: run.maxHp,
    gold: run.gold,
    strategicDirection: run.strategicDirection.slice(-6),
    deficits: run.deficits,
    routeBias: run.routeBias,
    riskFlags: run.riskFlags.slice(-8),
    recentCombat: run.recentCombat,
    counters: {
      llmWanted: run.counters.llmWanted,
      fallbackDecisions: run.counters.fallbackDecisions,
      checkpointUnknown: run.counters.checkpointUnknown
    }
  };
}

function derivedKnowledgeSummary(snapshot?: JsonRecord): JsonRecord {
  if (!snapshot) {
    return { present: false, relevantFacts: 0, relevantRules: 0 };
  }
  return {
    present: true,
    relevantFacts: Array.isArray(snapshot.relevantFacts) ? snapshot.relevantFacts.length : 0,
    relevantRules: Array.isArray(snapshot.relevantRules) ? snapshot.relevantRules.length : 0,
    ref: snapshot.ref
  };
}

function hpRatioOf(state: NormalizedState): number {
  return state.player.maxHp > 0 ? state.player.hp / state.player.maxHp : 1;
}

function highDeficitCount(run: RunMemory): number {
  return Object.values(run.deficits).filter((value) => value >= 0.65).length;
}

function isIrreversibleScreen(screen: string): boolean {
  return ["card_reward", "shop", "event", "map", "rest", "card_select", "bundle_select"].includes(screen);
}

function inferMemoryKind(memory: string): MemoryActivationItem["kind"] {
  if (/lesson|conf=/i.test(memory)) return "procedural";
  if (/experience|run-|failed:|success:/i.test(memory)) return "episodic";
  return "unknown";
}

function parseConfidence(memory: string): number | undefined {
  const match = memory.match(/conf=([0-9.]+)/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : undefined;
}

function extractRunIds(memory: string): string[] {
  return Array.from(new Set(memory.match(/run-[a-z0-9-]+/gi) ?? [])).slice(0, 6);
}

function activationReason(tags: string[], salienceSignals: SalienceSignal[]): string {
  const signalLabels = salienceSignals.map((item) => item.label).slice(0, 3);
  return [`matched tags: ${tags.slice(0, 5).join(", ")}`, signalLabels.length ? `salience: ${signalLabels.join(", ")}` : ""]
    .filter(Boolean)
    .join(" | ");
}

function planForCandidate(candidate: ScoredCandidate, state: NormalizedState, run: RunMemory): string {
  switch (candidate.action.kind) {
    case "select_card_reward":
      return `Take '${candidate.action.cardName ?? candidate.label}' if it patches ${primaryDeckNeed(run)} without bloating the deck, then re-read reward flow.`;
    case "skip_card_reward":
      return `Skip the card reward if preserving draw quality matters more than this immediate patch for ${primaryDeckNeed(run)}, then re-read reward flow.`;
    case "choose_map_node":
      return `Commit to ${mapNodeType(candidate) ?? `map node ${candidate.action.index}`} if its timing fits ${mapPressureSummary(state, run)}, then re-read remaining path options.`;
    case "use_potion":
      return `Use the potion, confirm the slot change and combat swing, then re-read state.`;
    case "end_turn":
      return "End turn, watch enemy intent resolution, then re-read the next player state.";
    default:
      return `Take action '${candidate.label}' and re-read state after execution.`;
  }
}

function predictedOutcome(candidate: ScoredCandidate, state: NormalizedState, run: RunMemory): string[] {
  const positive = strategicReasonFragment(candidate.reasons);
  const downside = strategicReasonFragment(candidate.risks);
  switch (candidate.action.kind) {
    case "play_card":
      return [
        `card ${candidate.action.cardName ?? candidate.action.cardIndex} leaves hand if accepted`,
        "energy should decrease by card cost if paid",
        ...playCardOutcomeHints(candidate),
        "combat state should change or settle"
      ];
    case "end_turn":
      return ["enemy turn resolves", "player hp may change from enemy turn", "new player turn or next screen should appear"];
    case "use_potion":
      return ["potion slot changes", "combat/resource state may change"];
    case "choose_map_node":
      return compactStrings([
        `map path advances toward selected node ${candidate.action.index}`,
        mapNodeDirection(candidate),
        mapRouteTiming(candidate, state, run),
        positive ? `route leans toward ${positive}` : undefined,
        downside ? `watch route cost: ${downside}` : undefined
      ]);
    case "select_card_reward":
      return compactStrings([
        `deck gains ${candidate.action.cardName || "the selected card"} and reward flow continues`,
        cardRewardDirection(candidate),
        cardRewardNeedLine(candidate, run),
        cardRewardOpportunityCost(candidate, run),
        positive ? `expected gain: ${positive}` : undefined,
        downside ? `watch deck cost: ${downside}` : undefined
      ]);
    case "skip_card_reward":
      return compactStrings([
        "deck remains unchanged and reward flow continues",
        `skip preserves current draw consistency but delays help for ${primaryDeckNeed(run)}`,
        cardRewardSkipValue(run)
      ]);
    case "event_choose_option":
      return ["event option resolves and may alter resources/deck/route"];
    default:
      return [`${state.screen} flow should make visible progress`];
  }
}

function costForCandidate(candidate: ScoredCandidate, state: NormalizedState, run: RunMemory): string[] {
  if (candidate.action.kind === "play_card") return ["card energy cost if playable"];
  if (candidate.action.kind === "select_card_reward") return compactStrings([
    "adds one card to future draw cycles",
    cardRewardOpportunityCost(candidate, run)
  ]);
  if (candidate.action.kind === "skip_card_reward") return compactStrings([
    "forgoes immediate card power",
    `may leave ${primaryDeckNeed(run)} unresolved`
  ]);
  if (candidate.action.kind === "choose_map_node") return compactStrings([
    "commits route and drops alternate node lines",
    mapPathLockRisk(candidate, state, run)
  ]);
  if (candidate.action.kind === "shop_purchase") return ["gold cost"];
  if (candidate.action.kind === "use_potion") return ["potion slot consumed"];
  if (candidate.action.kind === "event_choose_option") return ["event-specific cost unknown until resolved"];
  return [];
}

function playCardOutcomeHints(candidate: ScoredCandidate): string[] {
  const text = [...candidate.reasons, candidate.label, ...candidate.risks].join(" ").toLowerCase();
  const hints: string[] = [];
  if (/格挡|block|defend|防御/.test(text)) hints.push("player block should increase");
  if (/输出|damage|strike|zap|伤害/.test(text)) hints.push("enemy hp or block should decrease");
  if (/击杀|lethal|kill/.test(text)) hints.push("enemy may be removed or dead");
  if (/抽牌|draw|coolheaded/.test(text)) hints.push("hand or draw/discard state may change beyond played card");
  return hints;
}

function assumptionsForCandidate(candidate: ScoredCandidate, state: NormalizedState, run: RunMemory): string[] {
  const assumptions = ["candidate generated from current canonical state", "shadow candidate future is action-first"];
  if (candidate.action.kind === "play_card") assumptions.push("hand index remains current until execution");
  if (candidate.action.kind === "select_card_reward") assumptions.push(`current deck still most needs ${primaryDeckNeed(run)}`);
  if (candidate.action.kind === "choose_map_node") assumptions.push(`current HP/resources still support ${mapPressureSummary(state, run)}`);
  if ("index" in candidate.action) assumptions.push("indexed option remains current until execution");
  if ("target" in candidate.action && candidate.action.target) assumptions.push("target remains legal and alive");
  return assumptions;
}

function invalidationTriggersForCandidate(candidate: ScoredCandidate, state: NormalizedState, run: RunMemory): string[] {
  const triggers = ["state changes before execution", "adapter rejects action"];
  if (candidate.action.kind === "play_card") triggers.push("hand index shifted");
  if (candidate.action.kind === "select_card_reward") triggers.push(`another reward option better patches ${primaryDeckNeed(run)}`);
  if (candidate.action.kind === "choose_map_node") triggers.push(`route lock-in becomes worse than ${mapPressureSummary(state, run)}`);
  if ("target" in candidate.action && candidate.action.target) triggers.push("target disappeared or became illegal");
  if ("index" in candidate.action) triggers.push("option index shifted");
  return triggers;
}

function predictionMatched(prediction: string, reasons: string[], checkpoint?: ExecutionCheckpoint): boolean {
  const text = prediction.toLowerCase();
  if (/card .* leaves hand|card .*leaves hand/.test(text)) return reasons.includes("expected_card_removed_from_hand") || reasons.includes("hand_count_changed");
  if (/player block should increase/.test(text)) return reasons.includes("player_block_changed");
  if (/enemy hp or block should decrease/.test(text)) return reasons.includes("enemy_hp_or_block_changed") || reasons.includes("enemy_removed_or_dead");
  if (/enemy may be removed or dead/.test(text)) return reasons.includes("enemy_removed_or_dead");
  if (/hand or draw\/discard state may change/.test(text)) {
    return reasons.some((reason) => ["hand_count_changed", "draw_pile_count_changed", "discard_pile_count_changed", "hand_changed_beyond_expected_card_removal"].includes(reason));
  }
  if (/enemy hp|combat state should change|visible progress/.test(text)) {
    return reasons.some((reason) => ["enemy_hp_or_block_changed", "enemy_removed_or_dead", "state_hash_changed", "screen_changed"].includes(reason));
  }
  if (/new player turn|enemy turn resolves/.test(text)) return reasons.includes("new_combat_round") || reasons.includes("turn_changed") || reasons.includes("play_phase_changed");
  if (/potion/.test(text)) return reasons.some((reason) => reason.includes("potion"));
  if (/deck changes/.test(text)) return reasons.includes("screen_changed") || reasons.includes("state_type_changed") || Boolean(checkpoint?.postStateHash && checkpoint.preStateHash !== checkpoint.postStateHash);
  if (/map path|reward flow|event option|flow should/.test(text)) return reasons.includes("screen_or_menu_flow_progressed") || reasons.includes("screen_changed") || reasons.includes("state_type_changed");
  return false;
}

function checkpointActualSummary(checkpoint?: ExecutionCheckpoint): string {
  if (!checkpoint) return "unknown";
  return `${checkpoint.kind}: ${checkpoint.reasons.slice(0, 5).join(", ") || "no reasons"}`;
}

function checkpointAttribution(checkpoint?: ExecutionCheckpoint): JsonRecord {
  if (!checkpoint) return { kind: "unknown" };
  const changes = checkpoint.changes;
  const reasons = new Set(checkpoint.reasons);
  return {
    damage: {
      enemyHpOrBlockChanged: reasons.has("enemy_hp_or_block_changed"),
      enemyRemovedOrDead: reasons.has("enemy_removed_or_dead"),
      livingEnemies: changes.livingEnemies
    },
    defense: {
      playerBlockChanged: reasons.has("player_block_changed"),
      block: changes.block
    },
    hp: {
      playerHpChanged: reasons.has("player_hp_changed"),
      hp: changes.hp
    },
    cardFlow: {
      expectedCardRemovedFromHand: reasons.has("expected_card_removed_from_hand"),
      handCountChanged: reasons.has("hand_count_changed"),
      hand: changes.hand,
      discardPileCount: changes.discardPileCount,
      exhaustPileCount: changes.exhaustPileCount,
      drawPileCount: changes.drawPileCount
    },
    phase: {
      screenChanged: reasons.has("screen_changed"),
      stateTypeChanged: reasons.has("state_type_changed"),
      floorChanged: reasons.has("floor_changed"),
      newCombatRound: reasons.has("new_combat_round"),
      turnChanged: reasons.has("turn_changed"),
      playPhaseChanged: reasons.has("play_phase_changed"),
      screen: changes.screen,
      stateType: changes.stateType,
      floor: changes.floor,
      round: changes.round,
      turn: changes.turn
    },
    resource: {
      playerEnergyChanged: reasons.has("player_energy_changed"),
      energy: changes.energy,
      potionStateChanged: reasons.has("potion_state_changed"),
      potionCount: changes.potionCount,
      orbStateChanged: reasons.has("orb_state_changed")
    }
  };
}

function predictionChecksForOutcome(predictions: string[]): CandidatePredictionCheck[] {
  return predictions.map((prediction) => {
    const type = predictionCheckType(prediction);
    return {
      type,
      prediction,
      expected: expectedForPredictionType(type),
      source: "candidate_future" as const,
      severity: "info" as const
    };
  });
}

function predictionChecksForCandidate(
  candidate: ScoredCandidate,
  state: NormalizedState,
  predictions: string[],
  mechanics: JsonRecord
): CandidatePredictionCheck[] {
  const checks = predictionChecksForOutcome(predictions).map((check) => ({
    ...check,
    expected: {
      ...(check.expected ?? {}),
      ...expectedForCandidateCheck(candidate, state, check.type, mechanics)
    }
  }));
  if (candidate.action.kind === "play_card" && typeof mechanics.energyCost === "number" && mechanics.energyCost > 0 && !checks.some((check) => check.type === "resource_delta")) {
    checks.push({
      type: "resource_delta",
      prediction: "energy should decrease by card cost if paid",
      expected: expectedForCandidateCheck(candidate, state, "resource_delta", mechanics),
      source: "candidate_future",
      severity: "info"
    });
  }
  if (candidate.action.kind === "end_turn" && !checks.some((check) => check.type === "player_hp_delta")) {
    checks.push({
      type: "player_hp_delta",
      prediction: "player hp may change from enemy turn",
      expected: expectedForCandidateCheck(candidate, state, "player_hp_delta", mechanics),
      source: "candidate_future",
      severity: "info"
    });
  }
  return checks;
}

function expectedForCandidateCheck(
  candidate: ScoredCandidate,
  state: NormalizedState,
  type: string,
  mechanics: JsonRecord
): JsonRecord {
  const action = candidate.action;
  if (type === "card_removed_from_hand" && action.kind === "play_card") {
    return {
      cardIndex: action.cardIndex,
      cardName: action.cardName,
      beforeHandCount: state.player.hand.length,
      expectedAfterHandCount: Math.max(0, state.player.hand.length - 1)
    };
  }
  if (type === "enemy_hp_or_block_delta" && action.kind === "play_card") {
    return {
      targetId: action.target,
      expectedDamage: mechanics.expectedDamage,
      targetHpBefore: mechanics.targetHpBefore,
      targetBlockBefore: mechanics.targetBlockBefore
    };
  }
  if (type === "kill_or_enemy_removed" && action.kind === "play_card") {
    return {
      targetId: action.target,
      expectedDamage: mechanics.expectedDamage,
      targetHpBefore: mechanics.targetHpBefore
    };
  }
  if (type === "block_delta" && action.kind === "play_card") {
    return {
      expectedBlockGain: mechanics.expectedBlockGain,
      blockBefore: state.player.block
    };
  }
  if (type === "phase_or_turn_change" && action.kind === "end_turn") {
    return {
      roundBefore: state.round,
      turnBefore: state.turn,
      isPlayPhaseBefore: state.isPlayPhase,
      expectedNewCombatRound: state.screen === "combat"
    };
  }
  if (type === "potion_delta" && action.kind === "use_potion") {
    return {
      potionSlot: action.slot,
      beforePotionCount: state.player.potions.length
    };
  }
  if (type === "resource_delta" && action.kind === "play_card") {
    return {
      energyBefore: state.player.energy,
      expectedEnergyCost: mechanics.energyCost
    };
  }
  if (type === "player_hp_delta" && action.kind === "end_turn") {
    return {
      hpBefore: state.player.hp,
      blockBefore: state.player.block,
      incomingDamage: getIncomingDamage(state),
      expectedHpLoss: Math.max(0, getIncomingDamage(state) - state.player.block)
    };
  }
  if (type === "route_progress" && action.kind === "choose_map_node") {
    return {
      actionKind: action.kind,
      screenBefore: state.screen,
      selectedIndex: action.index
    };
  }
  if (type === "reward_flow") {
    return {
      actionKind: action.kind,
      screenBefore: state.screen,
      rewardCountBefore: Array.isArray(state.rewards) ? state.rewards.length : 0
    };
  }
  if (type === "phase_or_visible_progress") {
    return {
      actionKind: action.kind,
      screenBefore: state.screen,
      stateTypeBefore: state.stateType
    };
  }
  return {};
}

function mechanicsExpectationForCandidate(candidate: ScoredCandidate, state: NormalizedState, run: RunMemory): JsonRecord {
  const action = candidate.action;
  if (action.kind !== "play_card") {
    const card = isRecord(candidate.facts?.card) ? candidate.facts.card : undefined;
    const node = isRecord(candidate.facts?.node) ? candidate.facts.node : undefined;
    return {
      actionKind: action.kind,
      screen: state.screen,
      cardName: action.kind === "select_card_reward" ? action.cardName : undefined,
      cardType: asString(card?.type_key ?? card?.type, ""),
      cardRarity: asString(card?.rarity_key ?? card?.rarity, ""),
      nodeType: asString(node?.type ?? node?.node_type ?? node?.symbol ?? node?.name, ""),
      strategicReasons: candidate.reasons.slice(0, 2),
      strategicRisks: futureRisksForCandidate(candidate, state, run).slice(0, 2),
      deckNeed: action.kind === "select_card_reward" || action.kind === "skip_card_reward" ? primaryDeckNeed(run) : undefined,
      routePressure: action.kind === "choose_map_node" ? mapPressureSummary(state, run) : undefined,
      routeRewardExpectation: action.kind === "choose_map_node" ? mapRewardExpectation(candidate) : undefined
    };
  }
  const card = isRecord(candidate.facts?.card) ? candidate.facts.card : state.player.hand.find((item) => item.index === action.cardIndex);
  const target = action.target ? state.enemies.find((enemy) => enemy.id === action.target) : undefined;
  return {
    actionKind: "play_card",
    cardIndex: action.cardIndex,
    cardName: action.cardName,
    targetId: action.target,
    energyCost: parseEnergyCost(isRecord(card) ? card.cost : undefined),
    expectedDamage: parseCardNumber(isRecord(card) ? card.description : undefined, /deal\s+(\d+)\s+damage/i),
    expectedBlockGain: parseCardNumber(isRecord(card) ? card.description : undefined, /gain\s+(\d+)\s+block/i),
    targetHpBefore: target?.hp,
    targetBlockBefore: target?.block
  };
}

function strategicReasonFragment(values: string[]): string | undefined {
  const item = values
    .map((value) => value.trim())
    .find((value) => value.length > 0 && value.toLowerCase() !== "invalid");
  return item;
}

function compactStrings(values: Array<string | undefined>): string[] {
  return values.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function cardRewardDirection(candidate: ScoredCandidate): string {
  const reasonsText = candidate.reasons.join(" ");
  if (/输出|damage|attack/i.test(reasonsText)) return "candidate pushes deck toward stronger damage turns";
  if (/防御|block|weak|冰|frost/i.test(reasonsText)) return "candidate pushes deck toward safer defense turns";
  if (/抽牌|draw/i.test(reasonsText)) return "candidate improves deck cycling and consistency";
  if (/成长|scaling|能量|energy/i.test(reasonsText)) return "candidate improves long-fight scaling";
  return "candidate changes deck direction and future draw texture";
}

function mapNodeDirection(candidate: ScoredCandidate): string | undefined {
  const node = isRecord(candidate.facts?.node) ? candidate.facts.node : undefined;
  const nodeType = asString(node?.type ?? node?.node_type ?? node?.symbol ?? node?.name, "").trim();
  if (!nodeType) return undefined;
  return `route commits to ${nodeType} node rewards and risks`;
}

function futureRisksForCandidate(candidate: ScoredCandidate, state: NormalizedState, run: RunMemory): string[] {
  if (candidate.risks.length > 0) return candidate.risks;
  switch (candidate.action.kind) {
    case "select_card_reward":
      return compactStrings([
        cardRewardOpportunityCost(candidate, run),
        cardRewardBloatRisk(candidate, run)
      ]);
    case "skip_card_reward":
      return compactStrings([
        `skip delays help for ${primaryDeckNeed(run)}`,
        cardRewardSkipRisk(run)
      ]);
    case "choose_map_node":
      return compactStrings([
        mapPathLockRisk(candidate, state, run),
        mapUncertaintyRisk(candidate, state, run)
      ]);
    default:
      return ["shallow_future_risk_model"];
  }
}

function primaryDeckNeed(run: RunMemory): string {
  const ordered: Array<[string, number, string]> = [
    ["block", run.deficits.block, "block"],
    ["damage", run.deficits.damage, "damage"],
    ["draw", run.deficits.draw, "draw consistency"],
    ["energy", run.deficits.energy, "energy"],
    ["scaling", run.deficits.scaling, "long-fight scaling"],
    ["status_control", run.deficits.status_control, "status control"]
  ];
  const top = ordered.sort((a, b) => b[1] - a[1])[0];
  return top?.[2] ?? "deck quality";
}

function cardRewardNeedLine(candidate: ScoredCandidate, run: RunMemory): string | undefined {
  const reasonsText = candidate.reasons.join(" ");
  const need = primaryDeckNeed(run);
  if (/成长|scaling/i.test(reasonsText)) return `helps scaling while the deck still needs ${need}`;
  if (/抽牌|draw/i.test(reasonsText)) return `improves cycle while the deck still needs ${need}`;
  if (/防御|block|弱化|冰|frost/i.test(reasonsText)) return `patches defense while the deck still needs ${need}`;
  if (/输出|damage|attack/i.test(reasonsText)) return `adds immediate damage while the deck still needs ${need}`;
  if (/能量|energy/i.test(reasonsText)) return `improves energy pacing while the deck still needs ${need}`;
  return `changes deck direction while the deck still needs ${need}`;
}

function cardRewardOpportunityCost(candidate: ScoredCandidate, run: RunMemory): string | undefined {
  if (candidate.action.kind !== "select_card_reward") return undefined;
  const card = isRecord(candidate.facts?.card) ? candidate.facts.card : undefined;
  const rarity = asString(card?.rarity_key ?? card?.rarity, "").toLowerCase();
  if (rarity.includes("rare")) return "passing the other reward lines may miss a rare deck pivot";
  return `passing other reward lines may leave ${primaryDeckNeed(run)} unresolved`;
}

function cardRewardBloatRisk(candidate: ScoredCandidate, run: RunMemory): string | undefined {
  if (candidate.action.kind !== "select_card_reward") return undefined;
  if (run.deficits.deck_thinness > 0.6) return "extra card can dilute future draws if the payoff is narrow";
  return "card must justify its slot in future draw cycles";
}

function cardRewardSkipValue(run: RunMemory): string | undefined {
  if (run.deficits.deck_thinness > 0.65) return "skip may be correct if none of the cards beat current deck consistency";
  return "skip is safer only if the offered cards do not solve a real deck weakness";
}

function cardRewardSkipRisk(run: RunMemory): string | undefined {
  return `skip may miss a needed patch for ${primaryDeckNeed(run)}`;
}

function mapPressureSummary(state: NormalizedState, run: RunMemory): string {
  const hpRatio = state.player.hp / Math.max(1, state.player.maxHp);
  if (hpRatio <= 0.35) return "low HP recovery pressure";
  if (run.deficits.block > 0.65 || run.deficits.potions > 0.6) return "fragile combat resources";
  if (run.deficits.damage > 0.65 || run.deficits.scaling > 0.65) return "deck power-up pressure";
  return "balanced route pressure";
}

function mapRouteTiming(candidate: ScoredCandidate, state: NormalizedState, run: RunMemory): string | undefined {
  const nodeType = mapNodeType(candidate);
  if (!nodeType) return undefined;
  return `${nodeType} timing is judged against ${mapPressureSummary(state, run)}`;
}

function mapRewardExpectation(candidate: ScoredCandidate): string | undefined {
  const nodeType = mapNodeType(candidate);
  if (!nodeType) return undefined;
  if (/elite/i.test(nodeType)) return "expected reward: relic and higher-risk combat";
  if (/rest|campfire/i.test(nodeType)) return "expected reward: heal or upgrade timing";
  if (/shop/i.test(nodeType)) return "expected reward: spend gold for patching";
  if (/monster|enemy/i.test(nodeType)) return "expected reward: card reward and normal combat";
  if (/\?|event|unknown/i.test(nodeType)) return "expected reward: flexible event upside with uncertainty";
  return "expected reward depends on node outcome";
}

function mapPathLockRisk(candidate: ScoredCandidate, state: NormalizedState, run: RunMemory): string | undefined {
  const nodeType = mapNodeType(candidate);
  if (!nodeType) return "route lock-in may cut off safer or richer lines";
  return `${nodeType} path may lock out alternate lines better suited to ${mapPressureSummary(state, run)}`;
}

function mapUncertaintyRisk(candidate: ScoredCandidate, state: NormalizedState, run: RunMemory): string | undefined {
  const nodeType = mapNodeType(candidate);
  if (nodeType && /\?|event|unknown/i.test(nodeType)) return "unknown node may miss the next reliable heal/shop timing";
  if (nodeType && /elite/i.test(nodeType)) return "elite path can punish low HP or weak block scaling";
  return `future floor outcomes remain uncertain after this route commitment`;
}

function mapNodeType(candidate: ScoredCandidate): string | undefined {
  const node = isRecord(candidate.facts?.node) ? candidate.facts.node : undefined;
  const nodeType = asString(node?.type ?? node?.node_type ?? node?.symbol ?? node?.name, "").trim();
  if (nodeType) return nodeType;
  const label = candidate.label.toLowerCase();
  if (label.includes("shop")) return "Shop";
  if (label.includes("elite")) return "Elite";
  if (label.includes("rest") || label.includes("campfire")) return "Rest";
  if (label.includes("event") || label.includes("unknown") || label.includes("?")) return "Unknown";
  if (label.includes("monster") || label.includes("enemy") || label.includes("combat")) return "Monster";
  return undefined;
}

function parseEnergyCost(cost: unknown): number | undefined {
  if (typeof cost === "number" && Number.isFinite(cost)) return cost;
  if (typeof cost !== "string") return undefined;
  const parsed = Number(cost);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCardNumber(description: unknown, pattern: RegExp): number | undefined {
  if (typeof description !== "string") return undefined;
  const match = description.match(pattern);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizePredictionCheck(check: JsonRecord): CandidatePredictionCheck {
  const type = typeof check.type === "string" ? check.type : "semantic_prediction";
  return {
    type,
    prediction: typeof check.prediction === "string" ? check.prediction : type,
    expected: isRecord(check.expected) ? check.expected : expectedForPredictionType(type),
    source: typeof check.source === "string" ? check.source : "candidate_future",
    severity: check.severity === "warning" || check.severity === "critical" ? check.severity : "info"
  };
}

function buildTypedPredictionChecks(
  predictions: string[],
  checkpoint?: ExecutionCheckpoint,
  plannedChecks: CandidatePredictionCheck[] = []
): JsonRecord[] {
  const checks = plannedChecks.length > 0 ? plannedChecks : predictionChecksForOutcome(predictions);
  if (checks.length === 0) {
    return [{ type: "unknown", status: "unknown", prediction: "unknown", reason: "selected plan had no predictedOutcome" }];
  }
  return checks.map((check) => {
    const expected = check.expected ?? expectedForPredictionType(check.type);
    const actual = actualForPredictionType(check.type, checkpoint);
    const status = predictionCheckStatus(check.type, expected, actual, checkpoint?.reasons ?? [], checkpoint);
    return {
      type: check.type,
      prediction: check.prediction,
      status,
      source: check.source,
      expected,
      actual,
      checkpointKind: checkpoint?.kind ?? "unknown"
    };
  });
}

function buildPredictionAttributionBuckets(
  typedChecks: JsonRecord[],
  checkpoint?: ExecutionCheckpoint
): PredictionAttributionBucket[] {
  const grouped = new Map<string, JsonRecord[]>();
  for (const check of typedChecks) {
    const bucket = bucketForPredictionType(String(check.type ?? "unknown"));
    grouped.set(bucket, [...(grouped.get(bucket) ?? []), check]);
  }
  if (grouped.size === 0) {
    grouped.set("unknown", [{ type: "unknown", status: "unknown", expected: {}, actual: { known: false } }]);
  }
  const reasons = checkpoint?.reasons ?? [];
  return Array.from(grouped.entries()).map(([bucket, checks]) => {
    const statuses = checks.map((check) => String(check.status ?? "unknown"));
    const status: PredictionAttributionBucket["status"] = statuses.every((value) => value === "supported")
      ? "supported"
      : statuses.some((value) => value === "unknown")
        ? "unknown"
        : "unsupported";
    return {
      bucket,
      status,
      predictionTypes: checks.map((check) => String(check.type ?? "unknown")),
      expected: mergeCheckRecords(checks, "expected"),
      actual: mergeCheckRecords(checks, "actual"),
      evidenceReasons: reasons,
      severity: status === "supported" ? "info" : "warning"
    };
  });
}

function bucketForPredictionType(type: string): PredictionAttributionBucket["bucket"] {
  switch (type) {
    case "enemy_hp_or_block_delta":
      return "damage";
    case "block_delta":
      return "defense";
    case "kill_or_enemy_removed":
      return "kill";
    case "player_hp_delta":
      return "hp";
    case "card_removed_from_hand":
    case "card_flow_delta":
    case "deck_delta":
      return "card_flow";
    case "phase_or_turn_change":
    case "phase_or_visible_progress":
      return "phase";
    case "potion_delta":
    case "resource_delta":
      return "resource";
    case "route_progress":
      return "route";
    case "reward_flow":
      return "reward";
    default:
      return "unknown";
  }
}

function mergeCheckRecords(checks: JsonRecord[], key: "expected" | "actual"): JsonRecord {
  return checks.reduce<JsonRecord>((merged, check) => {
    const value = isRecord(check[key]) ? check[key] : {};
    return { ...merged, ...value };
  }, {});
}

function predictionCheckStatus(
  type: string,
  expected: JsonRecord,
  actual: JsonRecord,
  reasons: string[],
  checkpoint?: ExecutionCheckpoint
): "supported" | "unsupported" | "unknown" {
  const fallback = predictionCheckSupported(type, reasons, checkpoint) ? "supported" : "unknown";
  switch (type) {
    case "block_delta": {
      const expectedBlockGain = numeric(expected.expectedBlockGain);
      const block = isRecord(actual.block) ? actual.block : undefined;
      if (expectedBlockGain === undefined || !block || typeof block.after !== "number" || typeof block.before !== "number") return fallback;
      return block.after - block.before >= expectedBlockGain ? "supported" : "unsupported";
    }
    case "enemy_hp_or_block_delta": {
      const targetId = typeof expected.targetId === "string" ? expected.targetId : undefined;
      const delta = enemyDeltaFor(actual, targetId);
      if (!targetId || !delta) return fallback;
      const hpLoss = (numeric(delta.hpBefore) ?? 0) - (numeric(delta.hpAfter) ?? 0);
      const blockLoss = (numeric(delta.blockBefore) ?? 0) - (numeric(delta.blockAfter) ?? 0);
      return hpLoss > 0 || blockLoss > 0 || delta.removed === true ? "supported" : "unsupported";
    }
    case "kill_or_enemy_removed": {
      const targetId = typeof expected.targetId === "string" ? expected.targetId : undefined;
      const delta = enemyDeltaFor(actual, targetId);
      if (!targetId || !delta) return fallback;
      return delta.removed === true || (numeric(delta.hpAfter) ?? 1) <= 0 ? "supported" : "unsupported";
    }
    case "card_removed_from_hand": {
      const expectedAfterHandCount = numeric(expected.expectedAfterHandCount);
      const hand = isRecord(actual.hand) ? actual.hand : undefined;
      if (actual.expectedCardRemovedFromHand === true) {
        return "supported";
      }
      if (expectedAfterHandCount === undefined || !hand || !Array.isArray(hand.after)) return fallback;
      return hand.after.length === expectedAfterHandCount ? "supported" : "unsupported";
    }
    case "phase_or_turn_change": {
      if (expected.expectedNewCombatRound !== true) return fallback;
      if (actual.newCombatRound === true || actual.playPhaseChanged === true || actual.turnChanged === true) return "supported";
      return checkpoint?.settled === true ? "unsupported" : "unknown";
    }
    case "potion_delta": {
      const beforePotionCount = numeric(expected.beforePotionCount);
      const potionCount = isRecord(actual.potionCount) ? actual.potionCount : undefined;
      if (beforePotionCount === undefined || !potionCount || typeof potionCount.after !== "number") return fallback;
      return potionCount.after !== beforePotionCount || actual.potionStateChanged === true ? "supported" : "unsupported";
    }
    case "resource_delta": {
      const expectedEnergyCost = numeric(expected.expectedEnergyCost);
      const energy = isRecord(actual.energy) ? actual.energy : undefined;
      if (expectedEnergyCost === undefined || !energy || typeof energy.before !== "number" || typeof energy.after !== "number") return fallback;
      return energy.before - energy.after >= expectedEnergyCost ? "supported" : "unsupported";
    }
    case "player_hp_delta": {
      const expectedHpLoss = numeric(expected.expectedHpLoss);
      const hp = isRecord(actual.hp) ? actual.hp : undefined;
      if (expectedHpLoss === undefined || !hp || typeof hp.before !== "number" || typeof hp.after !== "number") return fallback;
      const actualHpLoss = hp.before - hp.after;
      if (expectedHpLoss > 0) return actualHpLoss > 0 ? "supported" : "unsupported";
      return actualHpLoss === 0 ? "supported" : "unknown";
    }
    case "route_progress":
    case "reward_flow":
      if (actual.visibleProgress === true || actual.screenOrMenuFlowProgressed === true) return "supported";
      return checkpoint?.settled === true ? "unsupported" : "unknown";
    case "phase_or_visible_progress":
      if (actual.visibleProgress === true) return "supported";
      return checkpoint?.settled === true ? "unsupported" : "unknown";
    default:
      return fallback;
  }
}

function predictionCheckSupported(type: string, reasons: string[], checkpoint?: ExecutionCheckpoint): boolean {
  switch (type) {
    case "block_delta":
      return reasons.includes("player_block_changed");
    case "enemy_hp_or_block_delta":
      return reasons.includes("enemy_hp_or_block_changed") || reasons.includes("enemy_removed_or_dead");
    case "kill_or_enemy_removed":
      return reasons.includes("enemy_removed_or_dead");
    case "card_removed_from_hand":
      return reasons.includes("expected_card_removed_from_hand") || reasons.includes("hand_count_changed");
    case "card_flow_delta":
      return reasons.some((reason) => ["hand_count_changed", "draw_pile_count_changed", "discard_pile_count_changed", "hand_changed_beyond_expected_card_removal"].includes(reason));
    case "phase_or_turn_change":
      return reasons.includes("new_combat_round") || reasons.includes("turn_changed") || reasons.includes("play_phase_changed");
    case "potion_delta":
      return reasons.some((reason) => reason.includes("potion"));
    case "resource_delta":
      return reasons.includes("player_energy_changed");
    case "player_hp_delta":
      return reasons.includes("player_hp_changed") || reasons.includes("new_combat_round") || reasons.includes("play_phase_changed");
    case "route_progress":
    case "reward_flow":
      return reasons.includes("screen_or_menu_flow_progressed") || reasons.includes("screen_changed") || reasons.includes("state_type_changed");
    case "deck_delta":
      return reasons.includes("screen_changed") || reasons.includes("state_type_changed") || Boolean(checkpoint?.postStateHash && checkpoint.preStateHash !== checkpoint.postStateHash);
    case "phase_or_visible_progress":
      return reasons.some((reason) =>
        [
          "screen_or_menu_flow_progressed",
          "screen_changed",
          "state_type_changed",
          "state_hash_changed",
          "enemy_hp_or_block_changed",
          "enemy_removed_or_dead",
          "player_energy_changed",
          "expected_card_removed_from_hand",
          "hand_count_changed"
        ].includes(reason)
      );
    default:
      return false;
  }
}

function enemyDeltaFor(actual: JsonRecord, targetId?: string): JsonRecord | undefined {
  const deltas = Array.isArray(actual.enemyDeltas) ? actual.enemyDeltas.filter(isRecord) : [];
  if (targetId) return deltas.find((delta) => delta.id === targetId);
  return deltas[0];
}

function numeric(value: unknown, fallback?: number): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
}

function predictionCheckType(prediction: string): string {
  const text = prediction.toLowerCase();
  if (/player block should increase/.test(text)) return "block_delta";
  if (/enemy hp or block should decrease/.test(text)) return "enemy_hp_or_block_delta";
  if (/enemy may be removed or dead/.test(text)) return "kill_or_enemy_removed";
  if (/card .* leaves hand|card .*leaves hand/.test(text)) return "card_removed_from_hand";
  if (/hand or draw\/discard state may change/.test(text)) return "card_flow_delta";
  if (/new player turn|enemy turn resolves/.test(text)) return "phase_or_turn_change";
  if (/player hp may change/.test(text)) return "player_hp_delta";
  if (/energy should decrease/.test(text)) return "resource_delta";
  if (/potion/.test(text)) return "potion_delta";
  if (/deck changes/.test(text)) return "deck_delta";
  if (/map path/.test(text)) return "route_progress";
  if (/reward flow/.test(text)) return "reward_flow";
  if (/event option|flow should|combat state should change|visible progress/.test(text)) return "phase_or_visible_progress";
  return "semantic_prediction";
}

function expectedForPredictionType(type: string): JsonRecord {
  switch (type) {
    case "block_delta":
      return { blockChanged: true };
    case "enemy_hp_or_block_delta":
      return { enemyHpOrBlockChanged: true };
    case "kill_or_enemy_removed":
      return { enemyRemovedOrDead: true };
    case "card_removed_from_hand":
      return { expectedCardRemovedFromHand: true };
    case "card_flow_delta":
      return { handOrPileChanged: true };
    case "phase_or_turn_change":
      return { turnOrPhaseChanged: true };
    case "potion_delta":
      return { potionStateChanged: true };
    case "resource_delta":
      return { energyChanged: true };
    case "player_hp_delta":
      return { hpKnown: true };
    case "route_progress":
      return { routeProgressed: true };
    case "reward_flow":
      return { rewardFlowProgressed: true };
    case "deck_delta":
      return { deckOrScreenChanged: true };
    case "phase_or_visible_progress":
      return { visibleProgress: true };
    default:
      return { semanticMatchRequired: true };
  }
}

function actualForPredictionType(type: string, checkpoint?: ExecutionCheckpoint): JsonRecord {
  if (!checkpoint) return { known: false };
  const reasons = new Set(checkpoint.reasons);
  const changes = checkpoint.changes;
  switch (type) {
    case "block_delta":
      return { blockChanged: reasons.has("player_block_changed"), block: changes.block };
    case "enemy_hp_or_block_delta":
      return {
        enemyHpOrBlockChanged: reasons.has("enemy_hp_or_block_changed"),
        enemyRemovedOrDead: reasons.has("enemy_removed_or_dead"),
        livingEnemies: changes.livingEnemies,
        enemyDeltas: Array.isArray(changes.enemyDeltas) ? changes.enemyDeltas : []
      };
    case "kill_or_enemy_removed":
      return {
        enemyRemovedOrDead: reasons.has("enemy_removed_or_dead"),
        livingEnemies: changes.livingEnemies,
        enemyDeltas: Array.isArray(changes.enemyDeltas) ? changes.enemyDeltas : []
      };
    case "card_removed_from_hand":
      return {
        expectedCardRemovedFromHand: reasons.has("expected_card_removed_from_hand"),
        handCountChanged: reasons.has("hand_count_changed"),
        hand: changes.hand
      };
    case "card_flow_delta":
      return {
        handCountChanged: reasons.has("hand_count_changed"),
        handChangedBeyondExpectedCardRemoval: reasons.has("hand_changed_beyond_expected_card_removal"),
        handGrewOrGeneratedCard: reasons.has("hand_grew_or_generated_card"),
        drawPileCount: changes.drawPileCount,
        discardPileCount: changes.discardPileCount,
        exhaustPileCount: changes.exhaustPileCount,
        hand: changes.hand
      };
    case "phase_or_turn_change":
      return {
        newCombatRound: reasons.has("new_combat_round"),
        turnChanged: reasons.has("turn_changed"),
        playPhaseChanged: reasons.has("play_phase_changed"),
        screenChanged: reasons.has("screen_changed")
      };
    case "potion_delta":
      return { potionStateChanged: reasons.has("potion_state_changed"), potionCount: changes.potionCount };
    case "resource_delta":
      return { playerEnergyChanged: reasons.has("player_energy_changed"), energy: changes.energy };
    case "player_hp_delta":
      return { playerHpChanged: reasons.has("player_hp_changed"), hp: changes.hp };
    case "deck_delta":
      return { screenChanged: reasons.has("screen_changed"), stateTypeChanged: reasons.has("state_type_changed") };
    case "route_progress":
    case "reward_flow":
      return {
        visibleProgress: reasons.has("screen_or_menu_flow_progressed") || reasons.has("screen_changed") || reasons.has("state_type_changed"),
        screenOrMenuFlowProgressed: reasons.has("screen_or_menu_flow_progressed"),
        screenChanged: reasons.has("screen_changed"),
        stateTypeChanged: reasons.has("state_type_changed"),
        rewardsCount: changes.rewardsCount,
        mapNodesCount: changes.mapNodesCount
      };
    case "phase_or_visible_progress":
      return {
        visibleProgress: Array.from(reasons).some((reason) =>
          [
            "screen_or_menu_flow_progressed",
            "screen_changed",
            "state_type_changed",
            "state_hash_changed",
            "enemy_hp_or_block_changed",
            "enemy_removed_or_dead",
            "player_energy_changed",
            "expected_card_removed_from_hand",
            "hand_count_changed"
          ].includes(reason)
        ),
        screenOrMenuFlowProgressed: reasons.has("screen_or_menu_flow_progressed"),
        screenChanged: reasons.has("screen_changed"),
        stateTypeChanged: reasons.has("state_type_changed"),
        stateHashChanged: reasons.has("state_hash_changed"),
        enemyHpOrBlockChanged: reasons.has("enemy_hp_or_block_changed"),
        expectedCardRemovedFromHand: reasons.has("expected_card_removed_from_hand")
      };
    default:
      return { known: false, reasons: checkpoint.reasons };
  }
}
