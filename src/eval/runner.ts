import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { RunRecord, TransitionRecord } from "../domain/types.js";
import { assertGroundTruthInvariants } from "../data/transitionSchema.js";
import { generateCandidates } from "../agent/candidates.js";
import type { AgentAction, CandidateAction, NormalizedState } from "../agent/types.js";
import { normalizeGameState } from "../agent/state.js";
import { agentRoot, isRecord } from "../agent/utils.js";
import { resolveRunDir } from "../replay/reader.js";

export type EvalStatus = "PASS" | "WARN" | "FAIL";

export interface EvalIssue {
  code: string;
  message: string;
  transitionId?: string;
  tick?: number;
  category?: EvalWarningCategory;
  severity?: EvalWarningSeverity;
  actionable?: boolean;
  historical?: boolean;
  action?: string;
  screen?: string;
  floor?: number;
}

export type EvalWarningCategory =
  | "normal_flow_checkpoint"
  | "acceptable_settlement_timeout"
  | "program_risk"
  | "historical_fixed_evidence"
  | "strategy_quality"
  | "cognitive_coverage"
  | "prediction_error"
  | "needs_fixture_bug_candidate";

export type EvalWarningSeverity = "info" | "warn" | "risk";

export interface EvalWarningSummaryBucket {
  count: number;
  codes: Record<string, number>;
  examples: EvalIssue[];
}

export interface EvalStrategyMetrics {
  lowHpTransitions: number;
  highIncomingTransitions: number;
  blockDeficitTurns: number;
  deckTooThickTransitions: number;
  potionUseCount: number;
  potionUseAtLowPressure: number;
  routeGreedChoices: number;
  fallbackDecisions: number;
  fallbackRate: number;
  lowConfidenceDecisions: number;
  repeatedLowConfidenceChoices: number;
  combatTempoLoss: number;
}

export interface EvalSummary {
  runId: string;
  runDir: string;
  transitions: number;
  parsedTransitions: number;
  parsedEvents: number;
  regeneratedCandidates: number;
  matchedSelectedActions: number;
  hardCheckpoints: number;
  unknownCheckpoints: number;
  settlementTimeouts: number;
  repeatedNoProgress: number;
  warningCategories: Record<string, number>;
  cognitiveCoverage: EvalCognitiveCoverage;
  deliberationCoverage: EvalDeliberationCoverage;
  promptParityCoverage: EvalPromptParityCoverage;
  predictionErrorCoverage: EvalPredictionErrorCoverage;
  consolidationCoverage: EvalConsolidationCoverage;
}

export interface EvalCognitiveCoverage {
  transitions: number;
  strategicImpression: number;
  salienceSignals: number;
  memoryActivation: number;
  candidateFutures: number;
  candidateFuturePredictionChecks: number;
  derivedSnapshot: number;
  deliberationPacket: number;
  fullShadowScaffold: number;
  rates: Record<string, number>;
}

export interface EvalDeliberationCoverage {
  transitions: number;
  packetPresent: number;
  stateFacts: number;
  enemyIntent: number;
  handSummary: number;
  legalActionsSummary: number;
  topCandidates: number;
  derivedKnowledgeSummary: number;
  outputSchema: number;
  rates: Record<string, number>;
}

export interface EvalPromptParityCoverage {
  transitions: number;
  promptParity: number;
  livePromptUsed: number;
  averageCoverage: number;
  missingSections: Record<string, number>;
}

export interface EvalPredictionErrorCoverage {
  transitions: number;
  predictionError: number;
  supported: number;
  unknownOrOpen: number;
  warningOrCritical: number;
  withTypedChecks: number;
  withAttribution: number;
  withAttributionBuckets: number;
  attributionBucketCounts: Record<string, number>;
  attributionBucketStatusCounts: Record<string, number>;
  unsupportedAttributionBuckets: number;
  criticalAttributionBuckets: number;
  rates: Record<string, number>;
}

export interface EvalConsolidationCoverage {
  transitions: number;
  consolidation: number;
  proposed: number;
  rejected: number;
  expired: number;
  reverted: number;
  acceptedOrMutating: number;
  statusCounts: Record<string, number>;
  rates: Record<string, number>;
}

export interface EvalReport {
  status: EvalStatus;
  summary: EvalSummary;
  errors: EvalIssue[];
  warnings: EvalIssue[];
  warningSummary: Record<string, EvalWarningSummaryBucket>;
  strategyMetrics: EvalStrategyMetrics;
}

interface ParsedTransitionLine {
  lineNumber: number;
  transition?: TransitionRecord;
}

export function evaluateRun(runIdOrPath?: string): EvalReport {
  const runDir = resolveRunDir(runIdOrPath);
  const errors: EvalIssue[] = [];
  const warnings: EvalIssue[] = [];
  const metadata = readMetadata(runDir, errors);
  const transitions = readTransitionsForEval(path.join(runDir, "transitions.jsonl"), errors);
  const parsedEvents = readEventsForEval(path.join(runDir, "events.jsonl"), errors);
  const seenTransitionIds = new Set<string>();
  let regeneratedCandidates = 0;
  let matchedSelectedActions = 0;
  let hardCheckpoints = 0;
  let unknownCheckpoints = 0;
  let settlementTimeouts = 0;
  let repeatedNoProgress = 0;
  let previous: TransitionRecord | undefined;
  const warningSummary: Record<string, EvalWarningSummaryBucket> = {};
  const strategyMetrics = createStrategyMetrics();
  const cognitiveCoverage = createCognitiveCoverage();
  const deliberationCoverage = createDeliberationCoverage();
  const promptParityCoverage = createPromptParityCoverage();
  const predictionErrorCoverage = createPredictionErrorCoverage();
  const consolidationCoverage = createConsolidationCoverage();

  if (!existsSync(path.join(runDir, "snapshots"))) {
    errors.push({ code: "missing_snapshots_dir", message: `Missing snapshots directory: ${path.join(runDir, "snapshots")}` });
  }

  for (const item of transitions) {
    const transition = item.transition;
    if (!transition) continue;

    const transitionIssue = issueBase(transition);
    if (metadata?.runId && transition.runId !== metadata.runId) {
      errors.push({
        ...transitionIssue,
        code: "run_id_mismatch",
        message: `Transition runId ${transition.runId} does not match metadata runId ${metadata.runId}`
      });
    }
    if (seenTransitionIds.has(transition.transitionId)) {
      errors.push({
        ...transitionIssue,
        code: "duplicate_transition_id",
        message: `Duplicate transitionId: ${transition.transitionId}`
      });
    }
    seenTransitionIds.add(transition.transitionId);
    collectCognitiveCoverage(cognitiveCoverage, transition);
    collectDeliberationCoverage(deliberationCoverage, transition);
    collectPromptParityCoverage(promptParityCoverage, transition);
    collectPredictionErrorCoverage(predictionErrorCoverage, transition);
    collectConsolidationCoverage(consolidationCoverage, transition);

    try {
      assertGroundTruthInvariants(transition);
    } catch (error) {
      errors.push({
        ...transitionIssue,
        code: "ground_truth_invariant",
        message: error instanceof Error ? error.message : String(error)
      });
    }

    checkSnapshotRefs(runDir, transition, errors);
    const checkpointKind = checkpointKindOf(transition);
    if (checkpointKind === "hard") {
      hardCheckpoints += 1;
      addWarning(warnings, warningSummary, classifyHardCheckpoint(transition));
    } else if (checkpointKind === "unknown") {
      unknownCheckpoints += 1;
      addWarning(warnings, warningSummary, classifyUnknownCheckpoint(transition));
    }

    if (hasSettlementTimeout(transition)) {
      settlementTimeouts += 1;
      addWarning(warnings, warningSummary, classifySettlementTimeout(transition));
    }

    if (previous && isRepeatedNoProgress(previous, transition)) {
      repeatedNoProgress += 1;
      addWarning(warnings, warningSummary, classifyRepeatedNoProgress(previous, transition));
    }
    for (const issue of classifyPredictionAttributionIssues(transition)) {
      addWarning(warnings, warningSummary, issue);
    }
    previous = transition;

    const preRaw = readSnapshotJson(transition.preStateRef, errors, transition);
    if (preRaw === undefined) continue;

    const state = normalizeGameState(preRaw);
    collectStrategyMetrics(strategyMetrics, transition, state);
    const candidates = generateCandidates(state);
    regeneratedCandidates += candidates.length;
    if (state.screen === "unknown" && transition.selectedAction) {
      errors.push({
        ...transitionIssue,
        code: "unknown_screen_action",
        message: "Transition selected an action from an unknown screen"
      });
    }
    if (isActionableScreen(state) && candidates.length === 0) {
      errors.push({
        ...transitionIssue,
        code: "no_candidates_on_actionable_screen",
        message: `No candidates regenerated for actionable screen: ${state.screen}`
      });
    }

    if (transition.selectedAction) {
      const match = matchSelectedAction(transition.selectedAction, candidates, state);
      if (match.ok) {
        matchedSelectedActions += 1;
      } else {
        errors.push({
          ...transitionIssue,
          code: match.code,
          message: match.message
        });
      }
    }
  }

  const transitionCount = transitions.filter((line) => line.transition).length;
  if (transitionCount === 0) {
    addWarning(warnings, warningSummary, {
      code: "empty_transition_log",
      message: "No transitions found in transitions.jsonl",
      category: "program_risk",
      severity: "risk",
      actionable: true
    });
  }
  finishStrategyMetrics(strategyMetrics, transitionCount);
  finishCognitiveCoverage(cognitiveCoverage, transitionCount);
  finishDeliberationCoverage(deliberationCoverage, transitionCount);
  finishPromptParityCoverage(promptParityCoverage, transitionCount);
  finishPredictionErrorCoverage(predictionErrorCoverage, transitionCount);
  finishConsolidationCoverage(consolidationCoverage, transitionCount);
  for (const issue of buildStrategyWarnings(strategyMetrics)) {
    addWarning(warnings, warningSummary, issue);
  }
  for (const issue of buildCognitiveCoverageWarnings(cognitiveCoverage, transitionCount)) {
    addWarning(warnings, warningSummary, issue);
  }
  for (const issue of buildP1CoverageWarnings(deliberationCoverage, promptParityCoverage, predictionErrorCoverage, transitionCount)) {
    addWarning(warnings, warningSummary, issue);
  }

  const status: EvalStatus = errors.length > 0 ? "FAIL" : warnings.length > 0 ? "WARN" : "PASS";
  const warningCategories = Object.fromEntries(
    Object.entries(warningSummary).map(([category, bucket]) => [category, bucket.count])
  );
  return {
    status,
    summary: {
      runId: metadata?.runId ?? path.basename(runDir),
      runDir,
      transitions: transitionCount,
      parsedTransitions: transitionCount,
      parsedEvents,
      regeneratedCandidates,
      matchedSelectedActions,
      hardCheckpoints,
      unknownCheckpoints,
      settlementTimeouts,
      repeatedNoProgress,
      warningCategories,
      cognitiveCoverage,
      deliberationCoverage,
      promptParityCoverage,
      predictionErrorCoverage,
      consolidationCoverage
    },
    errors,
    warnings,
    warningSummary,
    strategyMetrics
  };
}

function readEventsForEval(filePath: string, errors: EvalIssue[]): number {
  if (!existsSync(filePath)) return 0;
  let count = 0;
  const lines = readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (let index = 0; index < lines.length; index += 1) {
    try {
      const parsed = JSON.parse(lines[index]);
      if (!isRecord(parsed)) {
        errors.push({
          code: "invalid_event_jsonl",
          message: `events.jsonl line ${index + 1} is not an object`
        });
        continue;
      }
      count += 1;
    } catch (error) {
      errors.push({
        code: "event_json_parse_error",
        message: `events.jsonl line ${index + 1} failed to parse: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
  return count;
}

function readMetadata(runDir: string, errors: EvalIssue[]): RunRecord | undefined {
  const metadataPath = path.join(runDir, "metadata.json");
  if (!existsSync(metadataPath)) {
    errors.push({ code: "missing_metadata", message: `Missing metadata.json: ${metadataPath}` });
    return undefined;
  }
  try {
    const parsed = JSON.parse(readFileSync(metadataPath, "utf8")) as RunRecord;
    if (!isRecord(parsed) || typeof parsed.runId !== "string") {
      errors.push({ code: "invalid_metadata", message: "metadata.json is missing runId" });
      return undefined;
    }
    return parsed;
  } catch (error) {
    errors.push({
      code: "metadata_parse_error",
      message: `Could not parse metadata.json: ${error instanceof Error ? error.message : String(error)}`
    });
    return undefined;
  }
}

function readTransitionsForEval(filePath: string, errors: EvalIssue[]): ParsedTransitionLine[] {
  if (!existsSync(filePath)) {
    errors.push({ code: "missing_transitions", message: `Missing transitions.jsonl: ${filePath}` });
    return [];
  }
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter((item) => item.line.length > 0)
    .map((item) => {
      try {
        const parsed = JSON.parse(item.line) as TransitionRecord;
        if (!isRecord(parsed)) {
          errors.push({ code: "transition_not_object", message: `Transition line ${item.lineNumber} is not an object` });
          return { lineNumber: item.lineNumber };
        }
        return { lineNumber: item.lineNumber, transition: parsed };
      } catch (error) {
        errors.push({
          code: "transition_parse_error",
          message: `Could not parse transition line ${item.lineNumber}: ${error instanceof Error ? error.message : String(error)}`
        });
        return { lineNumber: item.lineNumber };
      }
    });
}

function checkSnapshotRefs(runDir: string, transition: TransitionRecord, errors: EvalIssue[]): void {
  const refs = Array.from(
    new Set([transition.preStateRef, transition.postStateRef, ...(Array.isArray(transition.rawRefs) ? transition.rawRefs : [])].filter(Boolean))
  ) as string[];
  for (const ref of refs) {
    if (!existsSync(resolveStateRef(ref))) {
      errors.push({
        ...issueBase(transition),
        code: "missing_snapshot_ref",
        message: `Snapshot ref does not exist: ${ref}`
      });
    }
  }
  if (!transition.preStateRef) {
    errors.push({ ...issueBase(transition), code: "missing_pre_state_ref", message: "Transition missing preStateRef" });
  }
}

function readSnapshotJson(ref: string | undefined, errors: EvalIssue[], transition: TransitionRecord): unknown {
  if (!ref) return undefined;
  const snapshotPath = resolveStateRef(ref);
  if (!existsSync(snapshotPath)) return undefined;
  try {
    return JSON.parse(readFileSync(snapshotPath, "utf8"));
  } catch (error) {
    errors.push({
      ...issueBase(transition),
      code: "snapshot_parse_error",
      message: `Could not parse snapshot ${ref}: ${error instanceof Error ? error.message : String(error)}`
    });
    return undefined;
  }
}

function resolveStateRef(ref: string): string {
  return path.isAbsolute(ref) ? ref : path.join(agentRoot, ref);
}

function isActionableScreen(state: NormalizedState): boolean {
  if (state.screen === "unknown") return false;
  if (state.screen === "combat") return state.isPlayPhase && state.turn !== "enemy";
  return true;
}

interface MatchResult {
  ok: boolean;
  code: string;
  message: string;
}

function matchSelectedAction(selectedAction: unknown, candidates: CandidateAction[], state: NormalizedState): MatchResult {
  if (!isRecord(selectedAction) || typeof selectedAction.kind !== "string") {
    return { ok: false, code: "invalid_selected_action", message: "selectedAction is missing a string kind" };
  }
  if (candidates.some((candidate) => actionMatchesCandidate(selectedAction, candidate.action))) {
    return { ok: true, code: "matched", message: "selectedAction matched regenerated candidates" };
  }
  const stale = staleIndexHint(selectedAction, candidates);
  if (stale) {
    return { ok: false, code: "stale_index", message: stale };
  }
  const illegalTarget = illegalTargetHint(selectedAction, state);
  if (illegalTarget) {
    return { ok: false, code: "illegal_target", message: illegalTarget };
  }
  return {
    ok: false,
    code: "selected_action_not_regenerated",
    message: `selectedAction did not match regenerated candidates: ${shortAction(selectedAction)}`
  };
}

function actionMatchesCandidate(selected: Record<string, unknown>, candidate: AgentAction): boolean {
  if (selected.kind !== candidate.kind) return false;
  switch (candidate.kind) {
    case "play_card":
      return (
        selected.cardIndex === candidate.cardIndex &&
        stringFieldEqual(selected.cardName, candidate.cardName) &&
        stringFieldEqual(selected.target, candidate.target)
      );
    case "use_potion":
      return selected.slot === candidate.slot && stringFieldEqual(selected.target, candidate.target);
    case "discard_potion":
      return selected.slot === candidate.slot;
    case "choose_map_node":
    case "choose_rest_option":
    case "claim_reward":
    case "claim_treasure_relic":
    case "select_card_reward":
    case "event_choose_option":
    case "shop_purchase":
    case "select_card":
    case "combat_select_card":
    case "bundle_select":
      return selected.index === candidate.index;
    case "menu_select":
      return selected.option === candidate.option;
    case "end_turn":
    case "proceed":
    case "skip_card_reward":
    case "confirm_selection":
    case "combat_confirm_selection":
    case "cancel_selection":
    case "bundle_confirm_selection":
    case "bundle_cancel_selection":
      return true;
  }
}

function stringFieldEqual(left: unknown, right: unknown): boolean {
  if (left === undefined || right === undefined) return left === right;
  return String(left) === String(right);
}

function staleIndexHint(selected: Record<string, unknown>, candidates: CandidateAction[]): string | undefined {
  if (selected.kind === "play_card") {
    const sameCard = candidates.find((candidate) => {
      const action = candidate.action;
      return (
        action.kind === "play_card" &&
        selected.cardName !== undefined &&
        action.cardName === selected.cardName &&
        stringFieldEqual(selected.target, action.target)
      );
    });
    if (sameCard?.action.kind === "play_card") {
      return `Possible stale card index: selected ${String(selected.cardName)} at index ${String(selected.cardIndex)}, regenerated index is ${sameCard.action.cardIndex}`;
    }
  }
  return undefined;
}

function illegalTargetHint(selected: Record<string, unknown>, state: NormalizedState): string | undefined {
  if (selected.target === undefined) return undefined;
  const target = String(selected.target);
  const targets = new Set(state.enemies.filter((enemy) => enemy.hp > 0).map((enemy) => enemy.id));
  if (!targets.has(target)) {
    return `Selected target is not a living enemy in pre-state: ${target}`;
  }
  return undefined;
}

function checkpointKindOf(transition: TransitionRecord): string | undefined {
  const stateDiff = transition.stateDiff;
  if (!isRecord(stateDiff) || !isRecord(stateDiff.checkpoint)) return undefined;
  return typeof stateDiff.checkpoint.kind === "string" ? stateDiff.checkpoint.kind : undefined;
}

function hasSettlementTimeout(transition: TransitionRecord): boolean {
  const stateDiff = transition.stateDiff;
  if (!isRecord(stateDiff) || !isRecord(stateDiff.checkpoint)) return false;
  const checkpoint = stateDiff.checkpoint;
  const reasons = Array.isArray(checkpoint.reasons) ? checkpoint.reasons.map(String) : [];
  return checkpoint.settled === false || reasons.includes("settlement_timeout_or_no_visible_change");
}

function addWarning(
  warnings: EvalIssue[],
  warningSummary: Record<string, EvalWarningSummaryBucket>,
  warning: EvalIssue
): void {
  warnings.push(warning);
  const category = warning.category ?? "program_risk";
  const bucket = (warningSummary[category] ??= { count: 0, codes: {}, examples: [] });
  bucket.count += 1;
  bucket.codes[warning.code] = (bucket.codes[warning.code] ?? 0) + 1;
  if (bucket.examples.length < 8) bucket.examples.push(warning);
}

function classifyHardCheckpoint(transition: TransitionRecord): EvalIssue {
  const action = shortAction(transition.selectedAction);
  const normal = isNormalHardCheckpoint(transition);
  return {
    ...issueBase(transition),
    code: "hard_checkpoint",
    message: normal ? `Normal flow checkpoint after selected action: ${action}` : `Hard checkpoint after selected action: ${action}`,
    category: normal ? "normal_flow_checkpoint" : "needs_fixture_bug_candidate",
    severity: normal ? "info" : "warn",
    actionable: !normal,
    action,
    screen: transition.screen,
    floor: transition.floor
  };
}

function classifyUnknownCheckpoint(transition: TransitionRecord): EvalIssue {
  const action = shortAction(transition.selectedAction);
  const acceptable = isAcceptableUnknownOrTimeout(transition);
  return {
    ...issueBase(transition),
    code: "unknown_checkpoint",
    message: acceptable ? `Acceptable unknown checkpoint on low-visibility flow: ${action}` : `Unknown checkpoint after selected action: ${action}`,
    category: acceptable ? "acceptable_settlement_timeout" : "needs_fixture_bug_candidate",
    severity: acceptable ? "info" : "warn",
    actionable: !acceptable,
    action,
    screen: transition.screen,
    floor: transition.floor
  };
}

function classifySettlementTimeout(transition: TransitionRecord): EvalIssue {
  const action = shortAction(transition.selectedAction);
  const acceptable = isAcceptableUnknownOrTimeout(transition);
  return {
    ...issueBase(transition),
    code: "settlement_timeout",
    message: acceptable ? `Settlement timeout accepted for low-visibility flow: ${action}` : "Transition checkpoint reports settlement timeout or no visible change",
    category: acceptable ? "acceptable_settlement_timeout" : "needs_fixture_bug_candidate",
    severity: acceptable ? "info" : "warn",
    actionable: !acceptable,
    action,
    screen: transition.screen,
    floor: transition.floor
  };
}

function classifyRepeatedNoProgress(previous: TransitionRecord, transition: TransitionRecord): EvalIssue {
  const action = shortAction(transition.selectedAction);
  const historical = isHistoricalFixedRepeatedNoProgress(previous, transition);
  return {
    ...issueBase(transition),
    code: "repeated_no_progress",
    message: historical ? `Historical fixed repeated no-progress evidence: ${action}` : `Repeated same action without visible progress: ${action}`,
    category: historical ? "historical_fixed_evidence" : "program_risk",
    severity: historical ? "info" : "risk",
    actionable: !historical,
    historical,
    action,
    screen: transition.screen,
    floor: transition.floor
  };
}

function classifyPredictionAttributionIssues(transition: TransitionRecord): EvalIssue[] {
  const predictionError = isRecord(transition.predictionError) ? transition.predictionError : undefined;
  const buckets = Array.isArray(predictionError?.attributionBuckets)
    ? predictionError.attributionBuckets.filter(isRecord)
    : [];
  return buckets
    .filter((bucket) => bucket.status === "unsupported" || bucket.severity === "critical")
    .map((bucket): EvalIssue => {
      const bucketName = typeof bucket.bucket === "string" ? bucket.bucket : "unknown";
      const status = typeof bucket.status === "string" ? bucket.status : "unknown";
      const severity = bucket.severity === "critical" ? "risk" : "warn";
      return {
        ...issueBase(transition),
        code: "prediction_attribution_miss",
        message: `Prediction attribution ${bucketName} is ${status}`,
        category: "prediction_error",
        severity,
        actionable: false,
        action: shortAction(transition.selectedAction),
        screen: transition.screen,
        floor: transition.floor
      };
    });
}

function isNormalHardCheckpoint(transition: TransitionRecord): boolean {
  const action = actionKind(transition.selectedAction);
  const reasons = checkpointReasons(transition);
  if (
    [
      "menu_select",
      "event_choose_option",
      "choose_map_node",
      "choose_rest_option",
      "claim_reward",
      "claim_treasure_relic",
      "select_card_reward",
      "proceed",
      "skip_card_reward",
      "confirm_selection",
      "combat_confirm_selection",
      "end_turn"
    ].includes(action)
  ) {
    return true;
  }
  if (
    (action === "select_card" || action === "combat_select_card") &&
    reasons.some((reason) => ["screen_changed", "state_type_changed", "screen_or_menu_flow_progressed", "enemy_added"].includes(reason))
  ) {
    return true;
  }
  if (
    transition.screen === "combat" &&
    action === "play_card" &&
    reasons.some((reason) => ["expected_card_removed_from_hand", "enemy_removed_or_dead", "screen_changed"].includes(reason))
  ) {
    return true;
  }
  if (action === "use_potion" && reasons.some((reason) => reason.includes("potion_state_changed"))) {
    return true;
  }
  return false;
}

function isAcceptableUnknownOrTimeout(transition: TransitionRecord): boolean {
  const action = actionKind(transition.selectedAction);
  if (["menu", "shop", "treasure", "card_select", "rewards", "map"].includes(transition.screen)) return true;
  if (["shop_purchase", "claim_treasure_relic", "select_card", "combat_select_card", "use_potion", "play_card"].includes(action)) {
    return hasVisibleProgressEvidence(transition);
  }
  return false;
}

function hasVisibleProgressEvidence(transition: TransitionRecord): boolean {
  const visibleReasons = new Set([
    "screen_changed",
    "state_type_changed",
    "screen_or_menu_flow_progressed",
    "state_hash_changed",
    "expected_card_removed_from_hand",
    "enemy_hp_or_block_changed",
    "enemy_removed_or_dead",
    "player_hp_changed",
    "player_block_changed",
    "player_energy_changed",
    "potion_state_changed",
    "hand_count_changed",
    "hand_changed_beyond_expected_card_removal",
    "hand_grew_or_generated_card",
    "draw_pile_count_changed",
    "discard_pile_count_changed",
    "exhaust_pile_count_changed",
    "orb_state_changed"
  ]);
  return checkpointReasons(transition).some((reason) => visibleReasons.has(reason));
}

function isHistoricalFixedRepeatedNoProgress(previous: TransitionRecord, transition: TransitionRecord): boolean {
  const action = shortAction(transition.selectedAction);
  if (transition.runId === "run-mr0rfdcb-yewhg8" && transition.tick >= 708 && transition.tick <= 768 && action === "select_card:0:Strike") {
    return true;
  }
  return transition.screen === "card_select" && action === shortAction(previous.selectedAction);
}

function isRepeatedNoProgress(previous: TransitionRecord, current: TransitionRecord): boolean {
  if (shortAction(previous.selectedAction) !== shortAction(current.selectedAction)) return false;
  const previousCheckpoint = isRecord(previous.stateDiff) && isRecord(previous.stateDiff.checkpoint) ? previous.stateDiff.checkpoint : {};
  const currentCheckpoint = isRecord(current.stateDiff) && isRecord(current.stateDiff.checkpoint) ? current.stateDiff.checkpoint : {};
  return (
    typeof previousCheckpoint.preStateHash === "string" &&
    previousCheckpoint.preStateHash === previousCheckpoint.postStateHash &&
    previousCheckpoint.preStateHash === currentCheckpoint.preStateHash &&
    currentCheckpoint.preStateHash === currentCheckpoint.postStateHash
  );
}

function issueBase(transition: TransitionRecord): Pick<EvalIssue, "transitionId" | "tick"> {
  return {
    transitionId: transition.transitionId,
    tick: transition.tick
  };
}

function checkpointReasons(transition: TransitionRecord): string[] {
  const stateDiff = transition.stateDiff;
  if (!isRecord(stateDiff) || !isRecord(stateDiff.checkpoint)) return [];
  const reasons = stateDiff.checkpoint.reasons;
  return Array.isArray(reasons) ? reasons.map(String) : [];
}

function actionKind(action: unknown): string {
  return isRecord(action) && typeof action.kind === "string" ? action.kind : "unknown";
}

function createCognitiveCoverage(): EvalCognitiveCoverage {
  return {
    transitions: 0,
    strategicImpression: 0,
    salienceSignals: 0,
    memoryActivation: 0,
    candidateFutures: 0,
    candidateFuturePredictionChecks: 0,
    derivedSnapshot: 0,
    deliberationPacket: 0,
    fullShadowScaffold: 0,
    rates: {}
  };
}

function collectCognitiveCoverage(coverage: EvalCognitiveCoverage, transition: TransitionRecord): void {
  coverage.transitions += 1;
  const hasStrategicImpression = isRecord(transition.strategicImpression);
  const hasSalienceSignals = Array.isArray(transition.salienceSignals) && transition.salienceSignals.length > 0;
  const hasMemoryActivation = isRecord(transition.memoryActivation);
  const hasCandidateFutures = Array.isArray(transition.candidateFutures) && transition.candidateFutures.length > 0;
  const hasCandidateFuturePredictionChecks = Array.isArray(transition.candidateFutures) &&
    transition.candidateFutures.some((future) => isRecord(future) && Array.isArray(future.predictionChecks) && future.predictionChecks.length > 0);
  const hasDerivedSnapshot = isRecord(transition.derivedSnapshot);
  const hasDeliberationPacket = isRecord(transition.deliberationPacket);
  if (hasStrategicImpression) coverage.strategicImpression += 1;
  if (hasSalienceSignals) coverage.salienceSignals += 1;
  if (hasMemoryActivation) coverage.memoryActivation += 1;
  if (hasCandidateFutures) coverage.candidateFutures += 1;
  if (hasCandidateFuturePredictionChecks) coverage.candidateFuturePredictionChecks += 1;
  if (hasDerivedSnapshot) coverage.derivedSnapshot += 1;
  if (hasDeliberationPacket) coverage.deliberationPacket += 1;
  if (hasStrategicImpression && hasSalienceSignals && hasMemoryActivation && hasCandidateFutures && hasDeliberationPacket) {
    coverage.fullShadowScaffold += 1;
  }
}

function finishCognitiveCoverage(coverage: EvalCognitiveCoverage, transitionCount: number): void {
  coverage.transitions = transitionCount;
  const rate = (value: number): number => (transitionCount > 0 ? Number((value / transitionCount).toFixed(3)) : 0);
  coverage.rates = {
    strategicImpression: rate(coverage.strategicImpression),
    salienceSignals: rate(coverage.salienceSignals),
    memoryActivation: rate(coverage.memoryActivation),
    candidateFutures: rate(coverage.candidateFutures),
    candidateFuturePredictionChecks: rate(coverage.candidateFuturePredictionChecks),
    derivedSnapshot: rate(coverage.derivedSnapshot),
    deliberationPacket: rate(coverage.deliberationPacket),
    fullShadowScaffold: rate(coverage.fullShadowScaffold)
  };
}

function buildCognitiveCoverageWarnings(coverage: EvalCognitiveCoverage, transitionCount: number): EvalIssue[] {
  if (transitionCount === 0) return [];
  const warnings: EvalIssue[] = [];
  const pushCoverage = (code: string, count: number, label: string): void => {
    if (count < transitionCount) {
      warnings.push({
        code,
        message: `${label} present on ${count}/${transitionCount} transition(s)`,
        category: "cognitive_coverage",
        severity: "info",
        actionable: false
      });
    }
  };
  pushCoverage("cognitive_missing_strategic_impression", coverage.strategicImpression, "StrategicImpression");
  pushCoverage("cognitive_missing_salience_signals", coverage.salienceSignals, "SalienceSignal[]");
  pushCoverage("cognitive_missing_memory_activation", coverage.memoryActivation, "MemoryActivation");
  pushCoverage("cognitive_missing_candidate_futures", coverage.candidateFutures, "CandidateFuture[]");
  pushCoverage("cognitive_missing_candidate_future_prediction_checks", coverage.candidateFuturePredictionChecks, "CandidateFuture.predictionChecks");
  pushCoverage("cognitive_missing_deliberation_packet", coverage.deliberationPacket, "DeliberationPacket");
  pushCoverage("cognitive_missing_full_shadow_scaffold", coverage.fullShadowScaffold, "Full shadow scaffold");
  return warnings;
}

function createDeliberationCoverage(): EvalDeliberationCoverage {
  return {
    transitions: 0,
    packetPresent: 0,
    stateFacts: 0,
    enemyIntent: 0,
    handSummary: 0,
    legalActionsSummary: 0,
    topCandidates: 0,
    derivedKnowledgeSummary: 0,
    outputSchema: 0,
    rates: {}
  };
}

function collectDeliberationCoverage(coverage: EvalDeliberationCoverage, transition: TransitionRecord): void {
  coverage.transitions += 1;
  const packet = isRecord(transition.deliberationPacket) ? transition.deliberationPacket : undefined;
  if (!packet) return;
  coverage.packetPresent += 1;
  if (isRecord(packet.stateFacts)) coverage.stateFacts += 1;
  if (Array.isArray(packet.enemyIntent)) coverage.enemyIntent += 1;
  if (Array.isArray(packet.handSummary)) coverage.handSummary += 1;
  if (Array.isArray(packet.legalActionsSummary)) coverage.legalActionsSummary += 1;
  if (Array.isArray(packet.topCandidates)) coverage.topCandidates += 1;
  if (isRecord(packet.derivedKnowledgeSummary)) coverage.derivedKnowledgeSummary += 1;
  if (isRecord(packet.outputSchema)) coverage.outputSchema += 1;
}

function finishDeliberationCoverage(coverage: EvalDeliberationCoverage, transitionCount: number): void {
  coverage.transitions = transitionCount;
  const rate = (value: number): number => (transitionCount > 0 ? Number((value / transitionCount).toFixed(3)) : 0);
  coverage.rates = {
    packetPresent: rate(coverage.packetPresent),
    stateFacts: rate(coverage.stateFacts),
    enemyIntent: rate(coverage.enemyIntent),
    handSummary: rate(coverage.handSummary),
    legalActionsSummary: rate(coverage.legalActionsSummary),
    topCandidates: rate(coverage.topCandidates),
    derivedKnowledgeSummary: rate(coverage.derivedKnowledgeSummary),
    outputSchema: rate(coverage.outputSchema)
  };
}

function createPromptParityCoverage(): EvalPromptParityCoverage {
  return {
    transitions: 0,
    promptParity: 0,
    livePromptUsed: 0,
    averageCoverage: 0,
    missingSections: {}
  };
}

function collectPromptParityCoverage(coverage: EvalPromptParityCoverage, transition: TransitionRecord): void {
  coverage.transitions += 1;
  const parity = isRecord(transition.promptParity)
    ? transition.promptParity
    : isRecord(transition.deliberationPacket) && isRecord(transition.deliberationPacket.promptParity)
      ? transition.deliberationPacket.promptParity
      : undefined;
  if (!parity) return;
  coverage.promptParity += 1;
  if (parity.livePromptUsed === true) coverage.livePromptUsed += 1;
  const coverageValue = typeof parity.coverage === "number" ? parity.coverage : 0;
  coverage.averageCoverage += coverageValue;
  const missing = Array.isArray(parity.missingSections) ? parity.missingSections.map(String) : [];
  for (const section of missing) {
    coverage.missingSections[section] = (coverage.missingSections[section] ?? 0) + 1;
  }
}

function finishPromptParityCoverage(coverage: EvalPromptParityCoverage, transitionCount: number): void {
  coverage.transitions = transitionCount;
  coverage.averageCoverage = coverage.promptParity > 0 ? Number((coverage.averageCoverage / coverage.promptParity).toFixed(3)) : 0;
}

function createPredictionErrorCoverage(): EvalPredictionErrorCoverage {
  return {
    transitions: 0,
    predictionError: 0,
    supported: 0,
    unknownOrOpen: 0,
    warningOrCritical: 0,
    withTypedChecks: 0,
    withAttribution: 0,
    withAttributionBuckets: 0,
    attributionBucketCounts: {},
    attributionBucketStatusCounts: {},
    unsupportedAttributionBuckets: 0,
    criticalAttributionBuckets: 0,
    rates: {}
  };
}

function collectPredictionErrorCoverage(coverage: EvalPredictionErrorCoverage, transition: TransitionRecord): void {
  coverage.transitions += 1;
  const predictionError = isRecord(transition.predictionError) ? transition.predictionError : undefined;
  if (!predictionError) return;
  coverage.predictionError += 1;
  if (predictionError.status === "accepted" || predictionError.errorType === "prediction_supported") coverage.supported += 1;
  if (predictionError.status === "open" || String(predictionError.errorType ?? "").includes("unknown")) coverage.unknownOrOpen += 1;
  if (predictionError.severity === "warning" || predictionError.severity === "critical") coverage.warningOrCritical += 1;
  const evidence = Array.isArray(predictionError.evidence) ? predictionError.evidence.filter(isRecord) : [];
  if (evidence.some((item) => Array.isArray(item.typedChecks) && item.typedChecks.length > 0)) coverage.withTypedChecks += 1;
  if (evidence.some((item) => isRecord(item.attribution))) coverage.withAttribution += 1;
  const attributionBuckets = Array.isArray(predictionError.attributionBuckets)
    ? predictionError.attributionBuckets.filter(isRecord)
    : [];
  if (attributionBuckets.length > 0) coverage.withAttributionBuckets += 1;
  for (const bucket of attributionBuckets) {
    const bucketName = typeof bucket.bucket === "string" ? bucket.bucket : "unknown";
    const status = typeof bucket.status === "string" ? bucket.status : "unknown";
    coverage.attributionBucketCounts[bucketName] = (coverage.attributionBucketCounts[bucketName] ?? 0) + 1;
    coverage.attributionBucketStatusCounts[status] = (coverage.attributionBucketStatusCounts[status] ?? 0) + 1;
    if (status === "unsupported") coverage.unsupportedAttributionBuckets += 1;
    if (bucket.severity === "critical") coverage.criticalAttributionBuckets += 1;
  }
}

function finishPredictionErrorCoverage(coverage: EvalPredictionErrorCoverage, transitionCount: number): void {
  coverage.transitions = transitionCount;
  const rate = (value: number): number => (transitionCount > 0 ? Number((value / transitionCount).toFixed(3)) : 0);
  coverage.rates = {
    predictionError: rate(coverage.predictionError),
    supported: rate(coverage.supported),
    unknownOrOpen: rate(coverage.unknownOrOpen),
    warningOrCritical: rate(coverage.warningOrCritical),
    withTypedChecks: rate(coverage.withTypedChecks),
    withAttribution: rate(coverage.withAttribution),
    withAttributionBuckets: rate(coverage.withAttributionBuckets),
    unsupportedAttributionBuckets: rate(coverage.unsupportedAttributionBuckets),
    criticalAttributionBuckets: rate(coverage.criticalAttributionBuckets)
  };
}

function createConsolidationCoverage(): EvalConsolidationCoverage {
  return {
    transitions: 0,
    consolidation: 0,
    proposed: 0,
    rejected: 0,
    expired: 0,
    reverted: 0,
    acceptedOrMutating: 0,
    statusCounts: {},
    rates: {}
  };
}

function collectConsolidationCoverage(coverage: EvalConsolidationCoverage, transition: TransitionRecord): void {
  coverage.transitions += 1;
  const consolidation = isRecord(transition.consolidation) ? transition.consolidation : undefined;
  if (!consolidation) return;
  coverage.consolidation += 1;
  const status = typeof consolidation.status === "string" ? consolidation.status : "unknown";
  coverage.statusCounts[status] = (coverage.statusCounts[status] ?? 0) + 1;
  if (status === "proposed") coverage.proposed += 1;
  if (status === "rejected") coverage.rejected += 1;
  if (status === "expired") coverage.expired += 1;
  if (status === "reverted" || status === "rolled_back") coverage.reverted += 1;
  if (status === "accepted" || status === "reverted" || status === "rolled_back") coverage.acceptedOrMutating += 1;
}

function finishConsolidationCoverage(coverage: EvalConsolidationCoverage, transitionCount: number): void {
  coverage.transitions = transitionCount;
  const rate = (value: number): number => (transitionCount > 0 ? Number((value / transitionCount).toFixed(3)) : 0);
  coverage.rates = {
    consolidation: rate(coverage.consolidation),
    proposed: rate(coverage.proposed),
    rejected: rate(coverage.rejected),
    expired: rate(coverage.expired),
    reverted: rate(coverage.reverted),
    acceptedOrMutating: rate(coverage.acceptedOrMutating)
  };
}

function buildP1CoverageWarnings(
  deliberation: EvalDeliberationCoverage,
  promptParity: EvalPromptParityCoverage,
  predictionError: EvalPredictionErrorCoverage,
  transitionCount: number
): EvalIssue[] {
  if (transitionCount === 0) return [];
  const warnings: EvalIssue[] = [];
  const push = (code: string, message: string): void => {
    warnings.push({ code, message, category: "cognitive_coverage", severity: "info", actionable: false });
  };
  if (deliberation.packetPresent < transitionCount) {
    push("deliberation_packet_partial_coverage", `DeliberationPacket present on ${deliberation.packetPresent}/${transitionCount} transition(s)`);
  }
  if (promptParity.promptParity < transitionCount) {
    push("prompt_parity_partial_coverage", `PromptParity present on ${promptParity.promptParity}/${transitionCount} transition(s)`);
  }
  if (predictionError.predictionError < transitionCount) {
    push("prediction_error_partial_coverage", `PredictionErrorRecord present on ${predictionError.predictionError}/${transitionCount} transition(s)`);
  }
  return warnings;
}

function createStrategyMetrics(): EvalStrategyMetrics {
  return {
    lowHpTransitions: 0,
    highIncomingTransitions: 0,
    blockDeficitTurns: 0,
    deckTooThickTransitions: 0,
    potionUseCount: 0,
    potionUseAtLowPressure: 0,
    routeGreedChoices: 0,
    fallbackDecisions: 0,
    fallbackRate: 0,
    lowConfidenceDecisions: 0,
    repeatedLowConfidenceChoices: 0,
    combatTempoLoss: 0
  };
}

function collectStrategyMetrics(metrics: EvalStrategyMetrics, transition: TransitionRecord, state: NormalizedState): void {
  const hpRatio = state.player.maxHp > 0 ? state.player.hp / state.player.maxHp : 1;
  if (hpRatio <= 0.35) metrics.lowHpTransitions += 1;

  const incoming = incomingDamage(state);
  if (incoming >= 20) metrics.highIncomingTransitions += 1;
  if (state.screen === "combat" && incoming > state.player.block) metrics.blockDeficitTurns += 1;

  if (deckSizeEstimate(state) >= 35) metrics.deckTooThickTransitions += 1;

  const action = transition.selectedAction;
  const kind = actionKind(action);
  if (kind === "use_potion") {
    metrics.potionUseCount += 1;
    if (state.screen === "combat" && incoming <= 5 && hpRatio > 0.35) metrics.potionUseAtLowPressure += 1;
  }

  if (kind === "choose_map_node" && isLowHpEliteChoice(transition, state)) metrics.routeGreedChoices += 1;

  const audit = isRecord(transition.decisionAudit) ? transition.decisionAudit : {};
  const chosenBy = typeof audit.chosenBy === "string" ? audit.chosenBy : undefined;
  if (chosenBy === "fallback") metrics.fallbackDecisions += 1;

  const confidence = typeof audit.confidence === "number" ? audit.confidence : undefined;
  if (confidence !== undefined && confidence < 0.25) {
    metrics.lowConfidenceDecisions += 1;
    if (kind === "play_card" && state.screen === "combat") metrics.repeatedLowConfidenceChoices += 1;
  }

  if (isCombatTempoLoss(transition, state, incoming)) metrics.combatTempoLoss += 1;
}

function finishStrategyMetrics(metrics: EvalStrategyMetrics, transitionCount: number): void {
  metrics.fallbackRate = transitionCount > 0 ? Number((metrics.fallbackDecisions / transitionCount).toFixed(3)) : 0;
}

function buildStrategyWarnings(metrics: EvalStrategyMetrics): EvalIssue[] {
  const warnings: EvalIssue[] = [];
  const pushMetric = (code: string, message: string): void => {
    warnings.push({ code, message, category: "strategy_quality", severity: "warn", actionable: false });
  };
  if (metrics.lowHpTransitions > 25) pushMetric("strategy_low_hp_pressure", `Low HP appeared in ${metrics.lowHpTransitions} transitions`);
  if (metrics.blockDeficitTurns > 30) pushMetric("strategy_block_deficit", `Block deficit appeared in ${metrics.blockDeficitTurns} combat transitions`);
  if (metrics.deckTooThickTransitions > 25) pushMetric("strategy_deck_too_thick", `Large deck estimate appeared in ${metrics.deckTooThickTransitions} transitions`);
  if (metrics.potionUseAtLowPressure > 0) pushMetric("strategy_potion_low_pressure", `Potion used at low pressure ${metrics.potionUseAtLowPressure} time(s)`);
  if (metrics.routeGreedChoices > 0) pushMetric("strategy_route_greed", `Risky low-HP elite/map choice appeared ${metrics.routeGreedChoices} time(s)`);
  if (metrics.fallbackRate >= 0.2) pushMetric("strategy_fallback_heavy", `Fallback handled ${(metrics.fallbackRate * 100).toFixed(1)}% of transitions`);
  if (metrics.lowConfidenceDecisions > 40) pushMetric("strategy_low_confidence", `Low-confidence decisions appeared ${metrics.lowConfidenceDecisions} time(s)`);
  if (metrics.combatTempoLoss > 20) pushMetric("strategy_combat_tempo_loss", `Possible combat tempo loss appeared ${metrics.combatTempoLoss} time(s)`);
  return warnings;
}

function incomingDamage(state: NormalizedState): number {
  return state.enemies.reduce((total, enemy) => {
    if (enemy.hp <= 0) return total;
    return (
      total +
      enemy.intents.reduce((intentTotal, intent) => {
        const label = intent.label ?? "";
        const multi = label.match(/(\d+)\s*x\s*(\d+)/i);
        if (multi) return intentTotal + Number(multi[1]) * Number(multi[2]);
        const single = label.match(/(\d+)/);
        return intentTotal + (single ? Number(single[1]) : 0);
      }, 0)
    );
  }, 0);
}

function deckSizeEstimate(state: NormalizedState): number {
  return state.player.drawPileCount + state.player.discardPileCount + state.player.exhaustPileCount + state.player.hand.length;
}

function isLowHpEliteChoice(transition: TransitionRecord, state: NormalizedState): boolean {
  if (!isRecord(transition.selectedAction) || transition.selectedAction.kind !== "choose_map_node") return false;
  if (state.player.maxHp <= 0 || state.player.hp / state.player.maxHp > 0.4) return false;
  const selectedIndex = transition.selectedAction.index;
  const candidates = Array.isArray(transition.legalActions) ? transition.legalActions : [];
  const selectedCandidate = candidates.find((candidate) => {
    if (!isRecord(candidate) || !isRecord(candidate.action)) return false;
    return candidate.action.kind === "choose_map_node" && candidate.action.index === selectedIndex;
  });
  const candidateText = isRecord(selectedCandidate) ? `${String(selectedCandidate.label ?? "")} ${JSON.stringify(selectedCandidate.facts ?? {})}` : "";
  return /elite/i.test(candidateText);
}

function isCombatTempoLoss(transition: TransitionRecord, state: NormalizedState, incoming: number): boolean {
  if (state.screen !== "combat" || !isRecord(transition.selectedAction)) return false;
  const kind = actionKind(transition.selectedAction);
  if (incoming === 0 && kind === "play_card") {
    const cardName = String(transition.selectedAction.cardName ?? "");
    if (/defend|leap|compact|charge battery|glasswork/i.test(cardName)) return true;
  }
  return incoming >= 18 && kind === "end_turn" && state.player.block < incoming;
}

function shortAction(action: unknown): string {
  if (!isRecord(action)) return String(action ?? "null");
  const kind = typeof action.kind === "string" ? action.kind : "unknown";
  if (kind === "play_card" && typeof action.cardIndex === "number") {
    const card = typeof action.cardName === "string" ? `:${action.cardName}` : "";
    const target = typeof action.target === "string" ? `->${action.target}` : "";
    return `${kind}:${action.cardIndex}${card}${target}`;
  }
  if (typeof action.index === "number") {
    const card = typeof action.cardName === "string" ? `:${action.cardName}` : "";
    return `${kind}:${action.index}${card}`;
  }
  if (typeof action.cardName === "string") return `${kind}:${action.cardName}`;
  if (typeof action.target === "string") return `${kind}->${action.target}`;
  if (typeof action.option === "string" || typeof action.option === "number") return `${kind}:${String(action.option)}`;
  return kind;
}
