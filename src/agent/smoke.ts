import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AgentAction, ScoredCandidate } from "./types.js";
import type { GameClient } from "./client.js";
import { toRestBody } from "./client.js";
import { getSts2McpRestCapabilities } from "../adapters/sts2mcp/capabilities.js";
import { AgentController } from "./controller.js";
import { buildP8LiveAdditivePrompt } from "./controller.js";
import { AgentDecisionRecorder } from "./decisionRecorder.js";
import {
  extractAllowedCandidates,
  extractDecisionClass,
  normalizeLiveDecision
} from "./deepseekLiveCommand.js";
import { buildExecutionCheckpoint } from "./checkpoint.js";
import { buildCollectedStateRecord } from "./collector.js";
import {
  assertGroundTruthInvariants,
  createDiffInferredTransitionSkeleton,
  createExecutorLoggedTransitionSkeleton,
  createSnapshotOnlyTransitionFromCollectedState,
  createSnapshotOnlyTransition
} from "../data/transitionSchema.js";
import { selectFallbackCandidate } from "./fallback.js";
import {
  DeepSeekV4FlashDecider,
  NoopLlmDecider,
  buildDeepSeekRequestBody,
  createLlmDecider,
  createP8WorkspaceDecider,
  describeLlmCommandSource,
  parseWorkspaceJsonDecision,
  resolveDeepSeekResponseMode,
  resolveDeepSeekThinkingMode,
  validateLlmDecisionForCandidates,
  type LlmDecider
} from "./llm.js";
import { MemoryManager } from "./memory.js";
import { cardDamage, normalizeGameState } from "./state.js";
import { generateCandidates } from "./candidates.js";
import { scoreCandidates } from "./scoring.js";
import {
  buildReplayCognitiveCoverage,
  buildReplayConsolidationProposalSurface,
  buildReplayFocusedShadowSlices,
  buildReplayShadowSliceStats,
  buildReplayTimeline,
  readConsolidationProposals,
  readReplayRun,
  readTransitionJsonl
} from "../replay/reader.js";
import { assessP8LiveReadiness } from "../replay/p8LiveReadiness.js";
import type { WorkspaceDecisionClassQualityStats } from "../replay/workspaceQuality.js";
import { evaluateRun } from "../eval/runner.js";
import { buildCognitiveScaffold, buildConsolidationRecord, buildPredictionErrorRecord } from "./cognitiveScaffold.js";
import {
  buildP8WorkspaceShadowFromPacket,
  buildCompactWorkspaceSummary,
  buildDeliberationWorkspacePrompt,
  buildStructuredDeliberationWorkspacePrompt,
  buildWorkspaceComparison,
  normalizeWorkspaceAblationMode,
  workspaceOptionsFromEnv
} from "./workspace.js";
import { normalizeBudgetGovernanceProfile } from "./budgetGovernance.js";
import { assessReasonQuality } from "./providerFailureClassifier.js";
import { summarizeProviderRecoveryPolicy } from "./providerRecoveryPolicy.js";
import { analyzeSerializedCandidateFutures } from "./candidateFutureReviewSignals.js";
import { serializeWorkspaceCandidateFutures } from "./candidateFutureCompressor.js";
import { buildMapRoutePlanFromChoice } from "./mapRoutePlan.js";
import {
  evaluateLegacyFinalizeStableWriteGate,
  evaluateLiveLlmMemoryUpdateGate,
  evaluateLiveLlmStableWriteGate,
  protectedPathGateSnapshot
} from "./protectedPathGate.js";
import { buildLiveAppliedRolloutSummary } from "../replay/liveAppliedRollout.js";
import { buildEvidenceSliceSummary, formatEvidenceSliceSummary } from "../replay/evidenceSliceReader.js";
import {
  appendLearningProposal,
  appendLearningProposalReviewDecision,
  appendReverseScaffoldFeedback,
  buildLearningProposalSurface,
  buildLearningProposalReviewDecisionSurface,
  buildReverseScaffoldFeedbackSurface,
  filterLearningProposalReviewDecisions,
  filterLearningProposals,
  filterReverseScaffoldFeedback,
  readLearningProposalReviewDecisions,
  readLearningProposals,
  readReverseScaffoldFeedback,
  summarizeLearningProposalReviewDecision,
  summarizeLearningProposal,
  summarizeReverseScaffoldFeedback
} from "../learning/proposals.js";
import {
  DOMAIN_SCHEMA_VERSION,
  type CandidateFuture,
  type DeliberationPacket,
  type MemoryActivation,
  type PredictionErrorRecord,
  type SalienceSignal,
  type StrategicImpression,
  type TransitionRecord
} from "../domain/types.js";

function makeWorkspaceDecisionClassQualityStats(
  overrides: Partial<WorkspaceDecisionClassQualityStats> = {}
): WorkspaceDecisionClassQualityStats {
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
    reasonCueAttributionSources: {},
    ...overrides
  };
}

class FakeClient implements GameClient {
  executed: AgentAction[] = [];

  constructor(
    private readonly state: unknown = combatState(),
    private readonly postExecuteState?: unknown
  ) {}

  async getState(): Promise<unknown> {
    if (this.executed.length > 0 && this.postExecuteState) {
      return this.postExecuteState;
    }
    return this.state;
  }

  async execute(action: AgentAction): Promise<unknown> {
    this.executed.push(action);
    return { status: "ok" };
  }
}

class ActionsDisabledClient extends FakeClient {
  async execute(): Promise<unknown> {
    throw new Error("Game action failed: Player actions are currently disabled (turn may already be ending)");
  }
}

class StaleThenSettledClient implements GameClient {
  executed: AgentAction[] = [];
  private readsAfterExecute = 0;

  constructor(
    private readonly state: unknown,
    private readonly staleState: unknown,
    private readonly settledState: unknown
  ) {}

  async getState(): Promise<unknown> {
    if (this.executed.length === 0) return this.state;
    this.readsAfterExecute += 1;
    return this.readsAfterExecute === 1 ? this.staleState : this.settledState;
  }

  async execute(action: AgentAction): Promise<unknown> {
    this.executed.push(action);
    return { status: "ok" };
  }
}

class InvalidChoiceLlmDecider implements LlmDecider {
  isAvailable(): boolean {
    return true;
  }

  async decide(): Promise<{ candidateId: string; reason: string }> {
    return { candidateId: "missing-candidate", reason: "test invalid choice" };
  }
}

class InvalidShapeLlmDecider implements LlmDecider {
  isAvailable(): boolean {
    return true;
  }

  async decide(): Promise<any> {
    return { reason: "missing candidate id" };
  }
}

class CountingLlmDecider implements LlmDecider {
  calls = 0;

  isAvailable(): boolean {
    return true;
  }

  async decide(): Promise<{ candidateId: string; reason: string }> {
    this.calls += 1;
    return { candidateId: "select-card-0", reason: "test selection" };
  }
}

const capabilities = getSts2McpRestCapabilities();
assert.equal(capabilities.canReadState, true);
assert.equal(capabilities.canReadRawState, true);
assert.equal(capabilities.canReadScreen, true);
assert.equal(capabilities.canExecuteActions, true);
assert.equal(capabilities.canReadAgentActionResults, "partial");
assert.equal(capabilities.canListLegalActions, false);
assert.equal(capabilities.canReadEventLog, false);
assert.equal(capabilities.canReadHumanEvents, false);
assert.equal(capabilities.canProvideFactData, false);
assert.equal(capabilities.canProvideVersionedFacts, false);

const salienceSignal: SalienceSignal = {
  kind: "danger",
  label: "incoming_damage",
  severity: "warning",
  confidence: 0.8,
  reason: "enemy intends to attack this turn",
  tags: ["combat", "block_deficit"]
};
const strategicImpression: StrategicImpression = {
  schemaVersion: DOMAIN_SCHEMA_VERSION,
  summary: "Attack is incoming and the decision should preserve HP without hiding lethal lines.",
  decisionType: "combat",
  isKeyDecision: true,
  danger: ["incoming damage"],
  opportunity: ["enemy is in strike range"],
  uncertainty: ["draw quality next turn"],
  salienceSignals: [salienceSignal]
};
const memoryActivation: MemoryActivation = {
  schemaVersion: DOMAIN_SCHEMA_VERSION,
  activatedAt: new Date(0).toISOString(),
  queryTags: ["combat", "block_deficit"],
  items: [
    {
      memoryId: "lesson-block-deficit",
      kind: "procedural",
      summary: "When low on HP, prefer lines that reduce incoming damage unless lethal is reliable.",
      relevance: 0.7,
      confidence: 0.6,
      evidenceRunIds: ["run-test"],
      conditions: ["low_hp", "enemy_attacking"]
    }
  ]
};
const candidateFuture: CandidateFuture = {
  id: "future-strike",
  label: "Strike the attacking enemy",
  plan: "Play Strike and reassess after state settlement.",
  sourceCandidateId: "play-strike",
  predictedOutcome: ["enemy HP decreases"],
  predictionChecks: [
    {
      type: "enemy_hp_or_block_delta",
      prediction: "enemy HP decreases",
      expected: { enemyHpOrBlockChanged: true },
      source: "candidate_future",
      severity: "info"
    }
  ],
  cost: ["1 energy"],
  risk: ["may leave block deficit"],
  assumptions: ["card index is current"],
  invalidationTriggers: ["hand index shifted before execution"],
  confidence: 0.72
};
const deliberationPacket: DeliberationPacket = {
  schemaVersion: DOMAIN_SCHEMA_VERSION,
  stateSummary: "Combat with one attacking enemy and a small hand.",
  screen: "combat",
  stateFacts: { hp: "80/80", energy: 3 },
  enemyIntent: [{ enemy: "Jaw Worm", intent: "Attack 6" }],
  handSummary: [{ index: 0, name: "Strike", cost: 1 }],
  deckSummary: { drawPileCount: 5, discardPileCount: 0 },
  topCandidates: [{ id: "play-strike", label: "Strike Jaw Worm" }],
  runMemorySummary: { riskFlags: [] },
  derivedKnowledgeSummary: { present: true, facts: 0, rules: 1 },
  strategicImpression,
  salienceSignals: [salienceSignal],
  memoryActivation,
  candidateFutures: [candidateFuture],
  uncertainty: ["test uncertainty"],
  outputSchema: { selectedCandidateId: "string", confidence: "number", reasonBrief: "string" },
  validationConstraints: ["LLM must choose a provided candidate id"]
};
const predictionError: PredictionErrorRecord = {
  schemaVersion: DOMAIN_SCHEMA_VERSION,
  predicted: "Strike reduces immediate threat enough for the turn.",
  actual: "Enemy survived and incoming damage remained high.",
  errorType: "underestimated_incoming_risk",
  attributedLayer: "candidate_future",
  severity: "warning",
  status: "open"
};
assert.equal(deliberationPacket.candidateFutures[0]?.sourceCandidateId, "play-strike");
const workspaceCandidate: ScoredCandidate = {
  id: "play-strike",
  kind: "play_card",
  label: "Strike Jaw Worm",
  action: { kind: "play_card", cardIndex: 0, cardName: "Strike", target: "JAW_WORM_0" },
  score: 10,
  confidence: 0.8,
  reasons: ["test candidate"],
  risks: []
};
const baselineStructuredWorkspacePrompt = buildStructuredDeliberationWorkspacePrompt(deliberationPacket);
assert.match(baselineStructuredWorkspacePrompt, /structured strategic workspace/);
const compactWorkspaceSummary = buildCompactWorkspaceSummary(deliberationPacket);
assert.match(compactWorkspaceSummary, /p8_workspace_summary/);
const liveAdditiveSkippedPrompt = buildP8LiveAdditivePrompt({
  legacyPrompt: JSON.stringify({ candidates: [{ id: "play-strike" }] }),
  compactWorkspaceSummary,
  decisionClass: "map:llm_required",
  liveAdditiveEnabled: true,
  liveDecisionClassWhitelist: ["combat:llm_required"]
});
assert.equal(liveAdditiveSkippedPrompt.applied, false);
assert.equal(liveAdditiveSkippedPrompt.promptMode, "legacy_only");
assert.doesNotMatch(liveAdditiveSkippedPrompt.prompt, /p8_live_additive/);
const liveAdditiveCombatPrompt = buildP8LiveAdditivePrompt({
  legacyPrompt: JSON.stringify({ candidates: [{ id: "play-strike" }] }),
  compactWorkspaceSummary,
  decisionClass: "combat:llm_required",
  liveAdditiveEnabled: true,
  liveDecisionClassWhitelist: ["combat:llm_required"]
});
assert.equal(liveAdditiveCombatPrompt.applied, true);
assert.equal(liveAdditiveCombatPrompt.promptMode, "additive_legacy_prompt_plus_compact_workspace_summary");
assert.match(liveAdditiveCombatPrompt.prompt, /p8_live_additive/);
assert.match(liveAdditiveCombatPrompt.prompt, /p8_workspace_summary/);
const structuredWorkspacePrompt = buildStructuredDeliberationWorkspacePrompt(deliberationPacket, [workspaceCandidate]);
assert.match(structuredWorkspacePrompt, /allowed_candidate_ids/);
assert.match(structuredWorkspacePrompt, /choose_exactly_one_candidate_id_from_allowed_list/);
assert.match(structuredWorkspacePrompt, /FINAL_ALLOWED_CANDIDATE_IDS/);
assert.match(structuredWorkspacePrompt, /Return JSON now/);
const combatBoundedWorkspacePrompt = buildDeliberationWorkspacePrompt(
  { ...deliberationPacket, screen: "combat" },
  [workspaceCandidate],
  "full_bounded_candidate_futures",
  "combat:llm_required"
);
const compactShadowPrompt = buildDeliberationWorkspacePrompt(deliberationPacket, [workspaceCandidate], "compact");
const ultraCompactShadowPrompt = buildDeliberationWorkspacePrompt(deliberationPacket, [workspaceCandidate], "ultra_compact");
assert.match(combatBoundedWorkspacePrompt, /full_bounded_candidate_futures/);
assert.match(combatBoundedWorkspacePrompt, /decision_class":"combat:llm_required/);
assert.match(combatBoundedWorkspacePrompt, /main gain and the main cost, delay, or risk this turn/);
assert.match(combatBoundedWorkspacePrompt, /say both what this line gains now and what it gives up, delays, or risks/);
assert.ok(compactShadowPrompt.length < structuredWorkspacePrompt.length);
assert.ok(ultraCompactShadowPrompt.length < compactShadowPrompt.length);
assert.equal(normalizeWorkspaceAblationMode("bounded"), "full_bounded_candidate_futures");
assert.equal(normalizeWorkspaceAblationMode("compact"), "compact");
assert.equal(normalizeWorkspaceAblationMode("ultra"), "ultra_compact");
assert.equal(normalizeWorkspaceAblationMode("unknown"), "full");
assert.equal(normalizeBudgetGovernanceProfile(undefined), "shadow_exploration");
assert.equal(normalizeBudgetGovernanceProfile("observe"), "observe_only");
assert.equal(normalizeBudgetGovernanceProfile("shadow-readiness"), "shadow_readiness");
assert.equal(normalizeBudgetGovernanceProfile("live_additive"), "live_additive_candidate");
assert.equal(normalizeBudgetGovernanceProfile("stable_update"), "stable_update_candidate");
const workspaceComparison = buildWorkspaceComparison({
  legacyPrompt: JSON.stringify({ candidates: [{ id: "play-strike" }] }),
  deliberationPacket,
  candidates: [workspaceCandidate],
  decisionClass: "combat:test",
  options: { shadowEnabled: false, callEnabled: false }
});
assert.ok(workspaceComparison.revisionTag);
assert.equal(workspaceComparison.ablationMode, "full");
assert.equal(workspaceComparison.enabled, false);
assert.equal(workspaceComparison.structuredPromptAvailable, true);
assert.equal(workspaceComparison.gatedReadiness, "not_ready");
assert.ok(workspaceComparison.readinessReasons.includes("STS2_P8_WORKSPACE_SHADOW=off"));
assert.ok(workspaceComparison.structuredPromptHash);
assert.equal(workspaceComparison.coverage.informationPreservationScore, 1);
assert.equal(workspaceComparison.coverage.missingLegacySections?.length, 0);
assert.ok(workspaceComparison.coverage.sectionTokenEstimate?.candidateFutures);
assert.equal(workspaceComparison.coverage.compressionMode, "none");
assert.equal(workspaceComparison.coverage.candidateFutureCompleteness?.futureCount, 1);
assert.equal(workspaceComparison.coverage.candidateFutureCompleteness?.withCoreTradeoff, 1);
assert.equal(workspaceComparison.coverage.candidateFutureReviewSignals?.shallow_candidate_future ?? 0, 0);
assert.equal(workspaceComparison.providerReadiness, "needs_api_key");
assert.equal(workspaceComparison.budget?.maxShadowCalls, 1);
assert.equal(workspaceComparison.budget?.maxOutputTokens, 400);
assert.equal(workspaceComparison.budget?.status, "within_budget");
assert.equal(workspaceComparison.budget?.governanceProfile, "shadow_exploration");
assert.equal(workspaceComparison.budget?.governancePolicy?.principle, "budget_is_guard_not_goal");
assert.equal(workspaceComparison.budget?.governancePolicy?.recoveryBudget.separatedFromWorkspaceCompression, true);
assert.equal(workspaceComparison.budget?.governancePolicy?.protectedPathBudget.liveAdditiveRequiresExplicitFlag, true);
assert.equal(workspaceComparison.budget?.governancePolicy?.protectedPathBudget.stableMemoryWritesAllowed, false);
assert.equal(workspaceComparison.rolloutGate?.liveIntegrationEnabled, false);
assert.equal(workspaceComparison.rolloutGate?.liveReadiness, "not_enabled");
assert.equal(workspaceComparison.rolloutGate?.structuredPromptOnlyDefaultAllowed, false);
assert.equal(workspaceComparison.rolloutGate?.compactWorkspaceSummaryAvailable, true);
const p8Shadow = await buildP8WorkspaceShadowFromPacket({
  legacyPrompt: JSON.stringify({ candidates: [{ id: "play-strike" }] }),
  deliberationPacket,
  candidates: [workspaceCandidate],
  decisionClass: "combat:test",
  llm: new NoopLlmDecider(),
  legacySelectedCandidateId: "play-strike",
  options: { shadowEnabled: false, callEnabled: false }
});
assert.equal(p8Shadow.shadowDecision.called, false);
assert.equal(p8Shadow.shadowDecision.outcome, "not_enabled");
assert.equal(p8Shadow.shadowDecision.ablationMode, "full");
assert.ok(p8Shadow.shadowDecision.workspacePromptTokens);
const boundedComparison = buildWorkspaceComparison({
  legacyPrompt: JSON.stringify({ candidates: [{ id: "play-strike" }] }),
  deliberationPacket: { ...deliberationPacket, screen: "combat" },
  candidates: [workspaceCandidate],
  decisionClass: "combat:test",
  options: { shadowEnabled: false, callEnabled: false, ablationMode: "full_bounded_candidate_futures" }
});
assert.equal(boundedComparison.ablationMode, "full_bounded_candidate_futures");
assert.equal(boundedComparison.coverage.compressionMode, "bounded_candidate_futures");
assert.equal(boundedComparison.coverage.candidateFutureCompleteness?.futureCount, 1);
assert.ok((boundedComparison.coverage.candidateFuturesBytesAfter ?? 0) > 0);
assert.ok((boundedComparison.coverage.workspaceBytesBefore ?? 0) > 0);
assert.equal(boundedComparison.revisionTag, "2026-07-05-v5.1.7-survival-cue-preservation");

const survivalCuePacket: DeliberationPacket = {
  ...deliberationPacket,
  screen: "combat",
  stateFacts: {
    ...(deliberationPacket.stateFacts ?? {}),
    hp: 18,
    maxHp: 60,
    block: 0,
    incomingDamage: 21
  },
  strategicImpression: {
    ...strategicImpression,
    decisionType: "combat:llm_required"
  },
  candidateFutures: [
    {
      id: "future-survival",
      label: "Play Leap",
      plan: "Play Leap to survive the incoming turn.",
      sourceCandidateId: "play-leap",
      actions: [{ kind: "play_card", payload: { cardIndex: 0, cardName: "Leap" } }],
      deterministicCalculations: {
        score: 3,
        confidence: 0.6,
        rank: 1,
        route: "llm_required",
        screen: "combat",
        mechanics: {
          actionKind: "play_card",
          cardName: "Leap",
          energyCost: 1,
          expectedBlockGain: 9
        }
      },
      predictedOutcome: ["gain 9 block", "survive the incoming turn"],
      predictionChecks: [
        {
          type: "player_hp_delta",
          prediction: "player hp may change from enemy turn",
          expected: {
            hpBefore: 18,
            blockBefore: 0,
            incomingDamage: 21,
            expectedHpLoss: 21
          },
          source: "candidate_future",
          severity: "info"
        }
      ],
      cost: ["spend 1 energy"],
      risk: ["生死回合若不补防会直接死"],
      uncertainty: ["draw order next turn"],
      assumptions: ["state stays stable"],
      invalidationTriggers: ["enemy intent changes"],
      executionRequirements: ["must_match_current_state"],
      confidence: 0.6
    }
  ]
};
const serializedSurvivalCueFutures = serializeWorkspaceCandidateFutures(
  survivalCuePacket,
  [{ id: "play-leap" } as ScoredCandidate],
  "full_bounded_candidate_futures"
).serialized;
const survivalCueReview = analyzeSerializedCandidateFutures(
  survivalCuePacket,
  serializedSurvivalCueFutures,
  "combat:llm_required"
);
assert.equal(survivalCueReview.reviewSignals.missing_survival_line ?? 0, 0);
assert.equal(survivalCueReview.cueAttribution.cues.survival_line?.source, "serialization_preserved");
assert.ok(
  serializedSurvivalCueFutures.some((future) =>
    typeof future.survivalLine === "string" && /survival:|生死|保命|补防/i.test(future.survivalLine)
  )
);
const boundedSurvivalPreservationPacket: DeliberationPacket = {
  ...survivalCuePacket,
  candidateFutures: [
    {
      id: "future-setup-a",
      label: "Play Setup A",
      plan: "Play Setup A for long-term value.",
      sourceCandidateId: "play-setup-a",
      actions: [{ kind: "play_card", payload: { cardIndex: 0, cardName: "Setup A" } }],
      deterministicCalculations: {
        score: 12,
        confidence: 0.3,
        rank: 1,
        route: "llm_required",
        screen: "combat",
        mechanics: { actionKind: "play_card", cardName: "Setup A", energyCost: 1 }
      },
      predictedOutcome: ["gain scaling", "combat state should change or settle"],
      predictionChecks: [
        { type: "resource_delta", prediction: "energy changes", expected: { energyBefore: 2, expectedEnergyCost: 1 }, source: "candidate_future", severity: "info" },
        { type: "phase_or_visible_progress", prediction: "combat progresses", expected: { visibleProgress: true }, source: "candidate_future", severity: "info" }
      ],
      cost: ["spend 1 energy"],
      risk: ["tempo loss this turn"],
      uncertainty: [],
      assumptions: ["state stays stable"],
      invalidationTriggers: [],
      executionRequirements: ["must_match_current_state"],
      confidence: 0.3
    },
    {
      id: "future-setup-b",
      label: "Play Setup B",
      plan: "Play Setup B for long-term value.",
      sourceCandidateId: "play-setup-b",
      actions: [{ kind: "play_card", payload: { cardIndex: 1, cardName: "Setup B" } }],
      deterministicCalculations: {
        score: 11,
        confidence: 0.28,
        rank: 2,
        route: "llm_required",
        screen: "combat",
        mechanics: { actionKind: "play_card", cardName: "Setup B", energyCost: 1 }
      },
      predictedOutcome: ["gain scaling", "combat state should change or settle"],
      predictionChecks: [
        { type: "resource_delta", prediction: "energy changes", expected: { energyBefore: 2, expectedEnergyCost: 1 }, source: "candidate_future", severity: "info" },
        { type: "phase_or_visible_progress", prediction: "combat progresses", expected: { visibleProgress: true }, source: "candidate_future", severity: "info" }
      ],
      cost: ["spend 1 energy"],
      risk: ["tempo loss this turn"],
      uncertainty: [],
      assumptions: ["state stays stable"],
      invalidationTriggers: [],
      executionRequirements: ["must_match_current_state"],
      confidence: 0.28
    },
    {
      id: "future-setup-c",
      label: "Play Setup C",
      plan: "Play Setup C for long-term value.",
      sourceCandidateId: "play-setup-c",
      actions: [{ kind: "play_card", payload: { cardIndex: 2, cardName: "Setup C" } }],
      deterministicCalculations: {
        score: 10,
        confidence: 0.27,
        rank: 3,
        route: "llm_required",
        screen: "combat",
        mechanics: { actionKind: "play_card", cardName: "Setup C", energyCost: 0 }
      },
      predictedOutcome: ["enable later combo", "combat state should change or settle"],
      predictionChecks: [
        { type: "resource_delta", prediction: "energy changes", expected: { energyBefore: 2, expectedEnergyCost: 0 }, source: "candidate_future", severity: "info" },
        { type: "phase_or_visible_progress", prediction: "combat progresses", expected: { visibleProgress: true }, source: "candidate_future", severity: "info" }
      ],
      cost: [],
      risk: ["tempo loss this turn"],
      uncertainty: [],
      assumptions: ["state stays stable"],
      invalidationTriggers: [],
      executionRequirements: ["must_match_current_state"],
      confidence: 0.27
    },
    {
      id: "future-defend",
      label: "Play Defend",
      plan: "Play Defend to reduce incoming damage.",
      sourceCandidateId: "play-defend",
      actions: [{ kind: "play_card", payload: { cardIndex: 3, cardName: "Defend" } }],
      deterministicCalculations: {
        score: 5,
        confidence: 0.24,
        rank: 4,
        route: "llm_required",
        screen: "combat",
        mechanics: { actionKind: "play_card", cardName: "Defend", energyCost: 1, expectedBlockGain: 6 }
      },
      predictedOutcome: ["gain 6 block", "combat state should change or settle"],
      predictionChecks: [
        { type: "block_delta", prediction: "block increases", expected: { blockBefore: 8, expectedBlockGain: 6 }, source: "candidate_future", severity: "info" },
        { type: "player_hp_delta", prediction: "player hp may change from enemy turn", expected: { hpBefore: 73, blockBefore: 8, incomingDamage: 24, expectedHpLoss: 10 }, source: "candidate_future", severity: "info" }
      ],
      cost: ["spend 1 energy"],
      risk: ["still leaves some damage"],
      uncertainty: [],
      assumptions: ["state stays stable"],
      invalidationTriggers: [],
      executionRequirements: ["must_match_current_state"],
      confidence: 0.24
    },
    {
      id: "future-end-turn",
      label: "End turn",
      plan: "End turn and accept the enemy attack.",
      sourceCandidateId: "end-turn",
      actions: [{ kind: "end_turn" }],
      deterministicCalculations: {
        score: -50,
        confidence: 0.2,
        rank: 5,
        route: "llm_required",
        screen: "combat",
        mechanics: { actionKind: "end_turn" }
      },
      predictedOutcome: ["enemy turn resolves", "player hp may change from enemy turn"],
      predictionChecks: [
        { type: "player_hp_delta", prediction: "player hp may change from enemy turn", expected: { hpBefore: 73, blockBefore: 8, incomingDamage: 24, expectedHpLoss: 16 }, source: "candidate_future", severity: "info" }
      ],
      cost: [],
      risk: ["结束会掉 16 HP"],
      uncertainty: [],
      assumptions: ["state stays stable"],
      invalidationTriggers: [],
      executionRequirements: ["must_match_current_state"],
      confidence: 0.2
    }
  ]
};
const boundedSurvivalSerialized = serializeWorkspaceCandidateFutures(
  boundedSurvivalPreservationPacket,
  [
    { id: "play-setup-a" } as ScoredCandidate,
    { id: "play-setup-b" } as ScoredCandidate,
    { id: "play-setup-c" } as ScoredCandidate,
    { id: "play-defend" } as ScoredCandidate,
    { id: "end-turn" } as ScoredCandidate
  ],
  "full_bounded_candidate_futures"
).serialized;
const boundedSurvivalReview = analyzeSerializedCandidateFutures(
  boundedSurvivalPreservationPacket,
  boundedSurvivalSerialized,
  "combat:llm_required"
);
assert.equal(boundedSurvivalSerialized.length, 3);
assert.ok(boundedSurvivalSerialized.some((future) => future.id === "play-defend" || future.id === "end-turn"));
assert.equal(boundedSurvivalReview.reviewSignals.missing_survival_line ?? 0, 0);
assert.equal(boundedSurvivalReview.cueAttribution.cues.survival_line?.source, "serialization_preserved");
const p8ShadowReadyButSkipped = await buildP8WorkspaceShadowFromPacket({
  legacyPrompt: JSON.stringify({ candidates: [{ id: "play-strike" }] }),
  deliberationPacket,
  candidates: [workspaceCandidate],
  decisionClass: "combat:test",
  llm: new NoopLlmDecider(),
  legacySelectedCandidateId: "play-strike",
  options: { shadowEnabled: true, callEnabled: false, providerAvailable: true }
});
assert.equal(p8ShadowReadyButSkipped.comparison.gatedReadiness, "ready");
assert.equal(p8ShadowReadyButSkipped.comparison.providerReadiness, "ready_for_shadow_call");
assert.equal(p8ShadowReadyButSkipped.shadowDecision.outcome, "skipped");
assert.equal(p8ShadowReadyButSkipped.shadowDecision.skippedReason, "STS2_P8_WORKSPACE_CALL=off");
const p8ShadowThinReason = await buildP8WorkspaceShadowFromPacket({
  legacyPrompt: JSON.stringify({ candidates: [{ id: "play-strike" }] }),
  deliberationPacket,
  candidates: [workspaceCandidate],
  decisionClass: "combat:test",
  llm: {
    isAvailable: () => true,
    decide: async () => ({ candidateId: "play-strike", reason: "Block damage." })
  },
  legacySelectedCandidateId: "play-strike",
  options: { shadowEnabled: true, callEnabled: true, providerAvailable: true, maxShadowCalls: 5 }
});
assert.equal(p8ShadowThinReason.shadowDecision.reasonQuality, "thin");
assert.ok(p8ShadowThinReason.shadowDecision.reasonQualityNotes?.includes("missing_tradeoff"));
assert.equal(assessReasonQuality("Draw for block without losing HP.").quality, "adequate");
assert.equal(assessReasonQuality("0-cost draw 3 to find block, sacrificing no energy.").quality, "adequate");
assert.equal(assessReasonQuality("Block immediately to survive, then scale later.").quality, "adequate");
assert.equal(assessReasonQuality("Reduce incoming damage with free attack.").quality, "thin");
const recoveryPolicySummary = summarizeProviderRecoveryPolicy({
  outcome: "invalid_output",
  failureBucket: "provider_length_empty",
  parseState: "empty_content_after_retry",
  finishReason: "length",
  attempts: [
    { requestKind: "primary", requestMaxOutputTokens: 400, finishReason: "length", contentKind: "empty" },
    { requestKind: "rescue", rescueMode: "truncation", requestMaxOutputTokens: 256, finishReason: "length", contentKind: "empty" },
    { requestKind: "rescue", rescueMode: "empty", requestMaxOutputTokens: 320, finishReason: "length", contentKind: "empty" }
  ]
});
assert.equal(recoveryPolicySummary?.policyName, "p8_provider_json_recovery_v1");
assert.equal(recoveryPolicySummary?.separatedFromWorkspaceCompression, true);
assert.equal(recoveryPolicySummary?.semanticValidationRelaxed, false);
assert.equal(recoveryPolicySummary?.rescueAttempts, 2);
assert.equal(recoveryPolicySummary?.rescueOutputCapRelation, "rescue_smaller_than_primary");
const p8ShadowRecoveryPolicy = await buildP8WorkspaceShadowFromPacket({
  legacyPrompt: JSON.stringify({ candidates: [{ id: "play-strike" }] }),
  deliberationPacket,
  candidates: [workspaceCandidate],
  decisionClass: "combat:test",
  llm: {
    isAvailable: () => true,
    decide: async () => ({
      candidateId: "play-strike",
      reason: "Block while preserving tempo.",
      providerAudit: {
        contentKind: "json",
        parseState: "parsed_after_empty_retry",
        requestMode: "json_mode",
        requestedThinkingMode: "default_enabled",
        retryCount: 1,
        emptyContentRetryCount: 1,
        emptyContentRetrySucceeded: true,
        attempts: [
          { requestKind: "primary", requestMaxOutputTokens: 400, finishReason: "length", latencyMs: 10, contentKind: "empty" },
          { requestKind: "rescue", rescueMode: "empty", requestMaxOutputTokens: 320, finishReason: "stop", latencyMs: 12, contentKind: "json" }
        ]
      },
      providerMetadata: {
        provider: "deepseek",
        model: "test",
        latencyMs: 22,
        maxOutputTokens: 400,
        finishReason: "stop",
        requestMode: "json_mode",
        requestedThinkingMode: "default_enabled"
      }
    })
  },
  legacySelectedCandidateId: "play-strike",
  options: { shadowEnabled: true, callEnabled: true, providerAvailable: true, maxShadowCalls: 5 }
});
assert.equal(p8ShadowRecoveryPolicy.shadowDecision.providerRecoveryPolicyName, "p8_provider_json_recovery_v1");
assert.equal(p8ShadowRecoveryPolicy.shadowDecision.providerRecoveryPolicy?.recovered, true);
assert.equal(p8ShadowRecoveryPolicy.shadowDecision.providerRecoveryPolicy?.separatedFromWorkspaceCompression, true);
const p8ShadowCallBudgetSkipped = await buildP8WorkspaceShadowFromPacket({
  legacyPrompt: JSON.stringify({ candidates: [{ id: "play-strike" }] }),
  deliberationPacket,
  candidates: [workspaceCandidate],
  decisionClass: "combat:test",
  llm: {
    isAvailable: () => true,
    decide: async () => ({ candidateId: "play-strike" })
  },
  legacySelectedCandidateId: "play-strike",
  options: { shadowEnabled: true, callEnabled: true, providerAvailable: true, maxShadowCalls: 0 }
});
assert.equal(p8ShadowCallBudgetSkipped.shadowDecision.called, false);
assert.equal(p8ShadowCallBudgetSkipped.shadowDecision.outcome, "skipped");
assert.equal(p8ShadowCallBudgetSkipped.shadowDecision.skippedReason, "skipped_by_budget");
assert.equal(p8ShadowCallBudgetSkipped.shadowDecision.budgetStatus, "call_budget_exceeded");
assert.equal(p8ShadowCallBudgetSkipped.comparison.budget?.governancePolicy?.runBudget.status, "call_budget_exceeded");
assert.equal(p8ShadowCallBudgetSkipped.comparison.budget?.governancePolicy?.runBudget.skippedReason, "skipped_by_budget");
const parsedWorkspaceDecision = parseWorkspaceJsonDecision(JSON.stringify({
  selectedCandidateId: "play-strike",
  confidence: 0.66,
  reasonBrief: "Preserve tempo while checking incoming risk.",
  riskTags: ["tempo"],
  missingInfo: ["exact draw order"],
  scaffoldFeedback: ["candidate futures were clear"]
}));
assert.equal(parsedWorkspaceDecision.decision?.candidateId, "play-strike");
assert.deepEqual(parsedWorkspaceDecision.decision?.riskTags, ["tempo"]);
const parsedNestedWorkspaceDecision = parseWorkspaceJsonDecision(JSON.stringify({
  decision: {
    selected_candidate_id: "play-strike",
    reason_brief: "Take the exact listed action.",
    risk_tags: ["pressure"],
    missing_info: ["future draw"],
    scaffold_feedback: ["salience was useful"]
  }
}));
assert.equal(parsedNestedWorkspaceDecision.decision?.candidateId, "play-strike");
assert.equal(parsedNestedWorkspaceDecision.decision?.reason, "Take the exact listed action.");
assert.deepEqual(parsedNestedWorkspaceDecision.decision?.riskTags, ["pressure"]);
const parsedArrayWrappedWorkspaceDecision = parseWorkspaceJsonDecision("[{\"selectedCandidateId\":\"play-strike\",\"reasonBrief\":\"Array-wrapped but still explicit\"}]");
assert.equal(parsedArrayWrappedWorkspaceDecision.decision?.candidateId, "play-strike");
const parsedCleanupWorkspaceDecision = parseWorkspaceJsonDecision("{\"selectedCandidateId\":\"play-strike\",\"reasonBrief\":\"Clean finish\"}<｜end▁of▁thinking｜>{\"selectedCandidateId\":\"other\"}");
assert.equal(parsedCleanupWorkspaceDecision.decision?.candidateId, "play-strike");
assert.equal(parsedCleanupWorkspaceDecision.cleanupReason, "trimmed_thinking_tail");
assert.throws(
  () => parseWorkspaceJsonDecision("{\"candidateId\":\"play-strike\",\"reasonBrief\":\"Close the turn safely\","),
  /ended before completing one JSON object/
);
const liveEligibleGate = buildReplayShadowSliceStats("test", [
  {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    runId: "run-shadow-gate",
    transitionId: "transition-shadow-1",
    source: "agent",
    captureMode: "executor_logged",
    isGroundTruth: true,
    confidence: 1,
    uncertainty: [],
    candidateActions: [],
    tick: 1,
    timestamp: new Date(0).toISOString(),
    screen: "combat",
    preStateRef: "snapshots/pre.json",
    compactPreState: {},
    legalActions: [],
    selectedAction: null,
    rawRefs: [],
    shadowWorkspaceDecision: {
      schemaVersion: DOMAIN_SCHEMA_VERSION,
      phase: "P8",
      mode: "shadow",
      enabled: true,
      attempted: true,
      called: true,
      available: true,
      outcome: "invalid_output",
      agreement: "not_applicable",
      decisionClass: "combat:forced_local",
      liveEligibleClass: false
    }
  } as TransitionRecord,
  {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    runId: "run-shadow-gate",
    transitionId: "transition-shadow-2",
    source: "agent",
    captureMode: "executor_logged",
    isGroundTruth: true,
    confidence: 1,
    uncertainty: [],
    candidateActions: [],
    tick: 2,
    timestamp: new Date(1).toISOString(),
    screen: "combat",
    preStateRef: "snapshots/pre.json",
    compactPreState: {},
    legalActions: [],
    selectedAction: null,
    rawRefs: [],
    shadowWorkspaceDecision: {
      schemaVersion: DOMAIN_SCHEMA_VERSION,
      phase: "P8",
      mode: "shadow",
      enabled: true,
      attempted: true,
      called: true,
      available: true,
      outcome: "valid",
      agreement: "agree",
      decisionClass: "combat:llm_required",
      liveEligibleClass: true,
      reasonQuality: "adequate"
    }
  } as TransitionRecord
]);
assert.equal(liveEligibleGate.invalidOutput, 1);
assert.equal(liveEligibleGate.liveEligibleInvalidOutput, 0);
assert.equal(liveEligibleGate.nonLiveInvalidOutput, 1);
assert.equal(liveEligibleGate.gate.status, "go");
const budgetGuardAfterPlannedSampleGate = buildReplayShadowSliceStats("budget-after-sample", [
  {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    runId: "run-shadow-budget",
    transitionId: "transition-shadow-budget-1",
    source: "agent",
    captureMode: "executor_logged",
    isGroundTruth: true,
    confidence: 1,
    uncertainty: [],
    candidateActions: [],
    tick: 1,
    timestamp: new Date(0).toISOString(),
    screen: "combat",
    preStateRef: "snapshots/pre.json",
    compactPreState: {},
    legalActions: [],
    selectedAction: null,
    rawRefs: [],
    workspaceComparison: {
      schemaVersion: DOMAIN_SCHEMA_VERSION,
      phase: "P8",
      mode: "shadow",
      revisionTag: "rev",
      enabled: true,
      structuredPromptAvailable: true,
      legacyPromptAvailable: true,
      decisionClass: "combat:llm_required",
      budget: { maxShadowCalls: 50, shadowCallsUsed: 50 }
    },
    shadowWorkspaceDecision: {
      schemaVersion: DOMAIN_SCHEMA_VERSION,
      phase: "P8",
      mode: "shadow",
      enabled: true,
      attempted: true,
      called: true,
      available: true,
      outcome: "valid",
      agreement: "agree",
      decisionClass: "combat:llm_required",
      liveEligibleClass: true,
      reasonQuality: "adequate",
      budgetStatus: "within_budget"
    }
  } as TransitionRecord,
  {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    runId: "run-shadow-budget",
    transitionId: "transition-shadow-budget-2",
    source: "agent",
    captureMode: "executor_logged",
    isGroundTruth: true,
    confidence: 1,
    uncertainty: [],
    candidateActions: [],
    tick: 2,
    timestamp: new Date(1).toISOString(),
    screen: "combat",
    preStateRef: "snapshots/pre.json",
    compactPreState: {},
    legalActions: [],
    selectedAction: null,
    rawRefs: [],
    workspaceComparison: {
      schemaVersion: DOMAIN_SCHEMA_VERSION,
      phase: "P8",
      mode: "shadow",
      revisionTag: "rev",
      enabled: true,
      structuredPromptAvailable: true,
      legacyPromptAvailable: true,
      decisionClass: "combat:local_fast_combat",
      budget: { maxShadowCalls: 50, shadowCallsUsed: 50, status: "call_budget_exceeded" }
    },
    shadowWorkspaceDecision: {
      schemaVersion: DOMAIN_SCHEMA_VERSION,
      phase: "P8",
      mode: "shadow",
      enabled: true,
      attempted: true,
      called: false,
      available: true,
      outcome: "skipped",
      agreement: "not_applicable",
      decisionClass: "combat:local_fast_combat",
      liveEligibleClass: false,
      budgetStatus: "call_budget_exceeded",
      skippedReason: "skipped_by_budget"
    }
  } as TransitionRecord
]);
assert.equal(budgetGuardAfterPlannedSampleGate.gate.status, "go");
assert.equal(budgetGuardAfterPlannedSampleGate.gate.reasons.includes("call_budget_exceeded_before_planned_sample"), false);
assert.equal(resolveDeepSeekResponseMode(undefined, undefined), "json_mode");
assert.equal(describeLlmCommandSource("tsx src/agent/deepseekLiveCommand.ts"), "deepseek-live-command");
assert.equal(describeLlmCommandSource("node scripts/deepseek-live-decider.mjs"), "deepseek-live-command");
assert.equal(describeLlmCommandSource("node scripts/llm-bridge-decider.mjs"), "bridge-command");
assert.equal(describeLlmCommandSource("node custom-decider.mjs"), "custom-command");
assert.equal(describeLlmCommandSource(""), "none");

{
  const previousDeepSeekLiveClasses = process.env.STS2_DEEPSEEK_LIVE_DECISION_CLASSES;
  const previousLiveClasses = process.env.STS2_P8_LIVE_DECISION_CLASSES;
  try {
    delete process.env.STS2_DEEPSEEK_LIVE_DECISION_CLASSES;
    process.env.STS2_P8_LIVE_DECISION_CLASSES = "combat:llm_required,card_reward:llm_required";
    const allowed = extractDecisionClass({
      p8_live_additive: {
        decisionClass: "card_reward:llm_required",
        allowedCandidateIds: ["card-reward-0", "skip-card-reward"]
      }
    });
    assert.equal(allowed, "card_reward:llm_required");
  } finally {
    if (previousDeepSeekLiveClasses === undefined) delete process.env.STS2_DEEPSEEK_LIVE_DECISION_CLASSES;
    else process.env.STS2_DEEPSEEK_LIVE_DECISION_CLASSES = previousDeepSeekLiveClasses;
    if (previousLiveClasses === undefined) delete process.env.STS2_P8_LIVE_DECISION_CLASSES;
    else process.env.STS2_P8_LIVE_DECISION_CLASSES = previousLiveClasses;
  }
}
assert.equal(resolveDeepSeekResponseMode("non_json_strict", undefined), "non_json_strict");
assert.equal(resolveDeepSeekResponseMode(undefined, "0"), "non_json_strict");
assert.equal(resolveDeepSeekThinkingMode(undefined), "default_enabled");
assert.equal(resolveDeepSeekThinkingMode("disabled"), "explicit_disabled");
const jsonModeRequest = buildDeepSeekRequestBody({
  model: "deepseek-v4-flash",
  maxOutputTokens: 400,
  temperature: 0,
  topP: 0.1,
  outputMode: "json_mode",
  thinkingMode: "default_enabled",
  requestKind: "primary",
  prompt: "{\"allowed_candidate_ids\":[\"play-strike\"]}"
});
assert.deepEqual(jsonModeRequest.response_format, { type: "json_object" });
assert.equal("thinking" in jsonModeRequest, false);
const nonJsonRequest = buildDeepSeekRequestBody({
  model: "deepseek-v4-flash",
  maxOutputTokens: 400,
  temperature: 0,
  topP: 0.1,
  outputMode: "non_json_strict",
  thinkingMode: "explicit_disabled",
  requestKind: "primary",
  prompt: "{\"allowed_candidate_ids\":[\"play-strike\"]}"
});
assert.equal("response_format" in nonJsonRequest, false);
assert.deepEqual(nonJsonRequest.thinking, { type: "disabled" });
const deepSeekWithoutKey = new DeepSeekV4FlashDecider({ apiKey: "" });
assert.equal(deepSeekWithoutKey.isAvailable(), false);
let fetchCalls = 0;
const deepSeekEmptyRetry = new DeepSeekV4FlashDecider({
  apiKey: "fixture-key",
  emptyContentRetryLimit: 1,
  retryLimit: 0,
  fetchImpl: async () => {
    fetchCalls += 1;
    const content = fetchCalls === 1
      ? ""
      : "{\"selectedCandidateId\":\"play-strike\",\"reasonBrief\":\"Rescue prompt returned a candidate.\"}";
    return new Response(JSON.stringify({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 }
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
});
const retriedDecision = await deepSeekEmptyRetry.decide("{\"allowed_candidate_ids\":[\"play-strike\"]}");
assert.equal(fetchCalls, 2);
assert.equal(retriedDecision?.candidateId, "play-strike");
assert.equal(retriedDecision?.providerAudit?.requestMode, "json_mode");
assert.equal(retriedDecision?.providerAudit?.retryCount, 1);
assert.equal(retriedDecision?.providerAudit?.emptyContentRetryCount, 1);
assert.equal(retriedDecision?.providerAudit?.emptyContentRetrySucceeded, true);
assert.equal(retriedDecision?.providerAudit?.attempts?.length, 2);
assert.equal(retriedDecision?.providerAudit?.attempts?.[1]?.requestMaxOutputTokens, 320);
assert.equal(retriedDecision?.providerAudit?.requestedThinkingMode, "explicit_disabled");
assert.equal(retriedDecision?.providerAudit?.attempts?.[1]?.requestedThinkingMode, "explicit_disabled");
let truncationFetchCalls = 0;
const truncationRequestMaxTokens: number[] = [];
const truncationThinkingModes: unknown[] = [];
const deepSeekTruncationRetry = new DeepSeekV4FlashDecider({
  apiKey: "fixture-key",
  emptyContentRetryLimit: 1,
  truncationRetryLimit: 1,
  retryLimit: 0,
  fetchImpl: async (_url, init) => {
    truncationFetchCalls += 1;
    const body = JSON.parse(String(init?.body ?? "{}"));
    truncationRequestMaxTokens.push(body.max_tokens);
    truncationThinkingModes.push(body.thinking?.type ?? "default_enabled");
    const payload = truncationFetchCalls === 1
      ? {
          choices: [{ message: { content: "" }, finish_reason: "length" }],
          usage: { prompt_tokens: 40, completion_tokens: 800, total_tokens: 840 }
        }
      : {
          choices: [{ message: { content: "{\"selectedCandidateId\":\"play-strike\",\"reasonBrief\":\"Short rescue.\"}" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 18, completion_tokens: 28, total_tokens: 46 }
        };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
});
const truncationRetriedDecision = await deepSeekTruncationRetry.decide("{\"allowed_candidate_ids\":[\"play-strike\"]}");
assert.equal(truncationFetchCalls, 2);
assert.deepEqual(truncationRequestMaxTokens, [400, 256]);
assert.deepEqual(truncationThinkingModes, ["default_enabled", "disabled"]);
assert.equal(truncationRetriedDecision?.candidateId, "play-strike");
assert.equal(truncationRetriedDecision?.providerAudit?.retryCount, 1);
assert.equal(truncationRetriedDecision?.providerAudit?.emptyContentRetryCount, 0);
assert.equal(truncationRetriedDecision?.providerAudit?.truncationRetryCount, 1);
assert.equal(truncationRetriedDecision?.providerAudit?.truncationRetrySucceeded, true);
assert.equal(truncationRetriedDecision?.providerAudit?.attempts?.length, 2);
assert.equal(truncationRetriedDecision?.providerAudit?.attempts?.[1]?.requestMaxOutputTokens, 256);
assert.equal(truncationRetriedDecision?.providerAudit?.requestedThinkingMode, "explicit_disabled");
assert.equal(truncationRetriedDecision?.providerAudit?.attempts?.[1]?.requestedThinkingMode, "explicit_disabled");
const previousProvider = process.env.STS2_LLM_PROVIDER;
const previousDeepSeekKey = process.env.STS2_DEEPSEEK_API_KEY;
const previousCommand = process.env.STS2_LLM_COMMAND;
try {
  delete process.env.STS2_LLM_COMMAND;
  process.env.STS2_LLM_PROVIDER = "deepseek-v4-flash";
  process.env.STS2_DEEPSEEK_API_KEY = "fixture-key";
  assert.equal(createLlmDecider().isAvailable?.(), false);
  assert.equal(createP8WorkspaceDecider().isAvailable?.(), true);
} finally {
  if (previousProvider === undefined) delete process.env.STS2_LLM_PROVIDER;
  else process.env.STS2_LLM_PROVIDER = previousProvider;
  if (previousDeepSeekKey === undefined) delete process.env.STS2_DEEPSEEK_API_KEY;
  else process.env.STS2_DEEPSEEK_API_KEY = previousDeepSeekKey;
  if (previousCommand === undefined) delete process.env.STS2_LLM_COMMAND;
  else process.env.STS2_LLM_COMMAND = previousCommand;
}
const previousShadowAlias = process.env.STS2_P8_MAX_SHADOW_CALLS;
const previousShadowCanonical = process.env.STS2_P8_WORKSPACE_MAX_SHADOW_CALLS;
try {
  delete process.env.STS2_P8_WORKSPACE_MAX_SHADOW_CALLS;
  process.env.STS2_P8_MAX_SHADOW_CALLS = "7";
  assert.equal(workspaceOptionsFromEnv().maxShadowCalls, 7);
} finally {
  if (previousShadowAlias === undefined) delete process.env.STS2_P8_MAX_SHADOW_CALLS;
  else process.env.STS2_P8_MAX_SHADOW_CALLS = previousShadowAlias;
  if (previousShadowCanonical === undefined) delete process.env.STS2_P8_WORKSPACE_MAX_SHADOW_CALLS;
  else process.env.STS2_P8_WORKSPACE_MAX_SHADOW_CALLS = previousShadowCanonical;
}

const collectedRecord = buildCollectedStateRecord({
  rawStatePath: "memory/collected/snapshots/test.raw.json",
  runId: "run-test",
  tick: 1,
  source: "collector",
  state: normalizeGameState(combatState())
});
const snapshotTransition = createSnapshotOnlyTransitionFromCollectedState(collectedRecord);
assert.equal(snapshotTransition.captureMode, "snapshot_only");
assert.equal(snapshotTransition.isGroundTruth, false);
assert.equal(snapshotTransition.selectedAction, null);
assert.equal(snapshotTransition.preStateRef, collectedRecord.rawStatePath);
assert.deepEqual(snapshotTransition.compactPreState, collectedRecord.compactState);
assert.throws(() => assertGroundTruthInvariants({ ...snapshotTransition, isGroundTruth: true }), /snapshot_only/);

const executorTransition = createExecutorLoggedTransitionSkeleton({
  runId: "run-test",
  transitionId: "transition-executor",
  tick: 2,
  timestamp: new Date(0).toISOString(),
  screen: "combat",
  preStateRef: "pre.raw.json",
  compactPreState: { screen: "combat" },
  selectedAction: { kind: "end_turn" }
});
assert.equal(executorTransition.captureMode, "executor_logged");
assert.equal(executorTransition.isGroundTruth, true);
const cognitiveTransition: TransitionRecord = {
  ...executorTransition,
  strategicImpression,
  salienceSignals: [salienceSignal],
  memoryActivation,
  candidateFutures: [candidateFuture],
  deliberationPacket,
  workspaceComparison,
  shadowWorkspaceDecision: p8Shadow.shadowDecision,
  predictionError
};
assert.equal(cognitiveTransition.strategicImpression?.schemaVersion, DOMAIN_SCHEMA_VERSION);
assert.equal(cognitiveTransition.candidateFutures?.[0]?.id, "future-strike");
assert.throws(
  () => assertGroundTruthInvariants({ ...executorTransition, source: "human", captureMode: "executor_logged" }),
  /human ground truth/
);

const diffTransition = createDiffInferredTransitionSkeleton({
  runId: "run-test",
  transitionId: "transition-diff",
  tick: 3,
  timestamp: new Date(0).toISOString(),
  screen: "combat",
  preStateRef: "pre.raw.json",
  compactPreState: { screen: "combat" },
  selectedAction: null,
  confidence: 0.4,
  uncertainty: ["duplicate_cards"],
  candidateActions: [{ kind: "play_card", cardName: "Strike" }],
  inferenceReason: "hand and discard changed, but duplicate cards make identity ambiguous"
});
assert.equal(diffTransition.captureMode, "diff_inferred");
assert.equal(diffTransition.isGroundTruth, false);
assert.throws(() => assertGroundTruthInvariants({ ...diffTransition, isGroundTruth: true }), /diff_inferred/);

const manualSnapshot = createSnapshotOnlyTransition({
  runId: "run-test",
  transitionId: "transition-snapshot",
  tick: 4,
  timestamp: new Date(0).toISOString(),
  screen: "map",
  preStateRef: "map.raw.json",
  compactPreState: { screen: "map" }
});
assert.equal(manualSnapshot.isGroundTruth, false);
assert.equal(validateLlmDecisionForCandidates({ candidateId: "a" }, [{ id: "a" }]).valid, true);
assert.equal(validateLlmDecisionForCandidates({ candidateId: "missing" }, [{ id: "a" }]).outcome, "invalid_choice");
assert.equal(validateLlmDecisionForCandidates({} as any, [{ id: "a" }]).outcome, "invalid_output");
const deepSeekLivePrompt = {
  state: "screen=combat hp=12/75 incoming=18",
  candidates: [
    { id: "play-block", label: "Block" },
    { id: "play-attack", label: "Attack" }
  ],
  p8_live_additive: {
    decisionClass: "combat:llm_required"
  }
};
assert.equal(extractDecisionClass(deepSeekLivePrompt), "combat:llm_required");
assert.deepEqual(extractAllowedCandidates(deepSeekLivePrompt), [{ id: "play-block" }, { id: "play-attack" }]);
assert.deepEqual(
  normalizeLiveDecision({
    candidateId: "play-block",
    confidence: 0.72,
    reason: "Block now, but delay damage.",
    memoryUpdates: { strategicDirection: ["do-not-emit"] },
    parameterSuggestions: [{ key: "block", delta: 1, reason: "do-not-emit" }]
  }),
  { candidateId: "play-block", confidence: 0.72, reason: "Block now, but delay damage." }
);
assert.equal(
  validateLlmDecisionForCandidates(normalizeLiveDecision({ candidateId: "play-block" }), extractAllowedCandidates(deepSeekLivePrompt)).valid,
  true
);
assert.equal(
  validateLlmDecisionForCandidates(normalizeLiveDecision({ candidateId: "missing" }), extractAllowedCandidates(deepSeekLivePrompt)).outcome,
  "invalid_choice"
);
assert.equal(evaluateLiveLlmMemoryUpdateGate({}).allowed, false);
assert.deepEqual(evaluateLiveLlmStableWriteGate({
  attemptedTargets: ["memory", "strategy_params"],
  env: {}
}).reasons, [
  "live_llm_memory_updates_blocked_by_default",
  "live_llm_strategy_params_blocked_by_default"
]);
const protectedPathSnapshot = protectedPathGateSnapshot({});
assert.deepEqual(protectedPathSnapshot.stableWriteTargets, [
  "memory",
  "derived_knowledge",
  "strategy_params",
  "skills",
  "prompt_policy",
  "budget_policy",
  "candidate_templates",
  "classification_policy",
  "scaffold_policy"
]);
assert.equal(evaluateLegacyFinalizeStableWriteGate({ STS2_ENABLE_LEGACY_FINALIZE_STABLE_WRITES: "1" } as NodeJS.ProcessEnv).allowed, true);

const rewardState = normalizeGameState({
  state_type: "card_reward",
  card_reward: {
    cards: [
      {
        id: "COLD_SNAP",
        name: "Cold Snap",
        type: "Attack",
        rarity: "Common",
        description: "Deal 6 damage. Channel 1 Frost."
      },
      {
        id: "COOLHEADED",
        name: "Coolheaded",
        type: "Skill",
        rarity: "Common",
        description: "Channel 1 Frost. Draw 1 card."
      }
    ],
    can_proceed: false
  },
  run: { act: 1, floor: 2, ascension: 1 },
  player: {
    character: "The Defect",
    hp: 70,
    max_hp: 75,
    block: 0,
    energy: 0,
    max_energy: 3,
    relics: [],
    potions: [],
    status: [],
    draw_pile_count: 8,
    discard_pile_count: 4,
    exhaust_pile_count: 0,
    gold: 99
  }
});
const rewardCandidates = generateCandidates(rewardState);
assert.equal(rewardState.screen, "card_reward");
assert.ok(rewardCandidates.some((candidate) => candidate.kind === "select_card_reward"));
assert.ok(!rewardCandidates.some((candidate) => candidate.kind === "proceed"));
{
  const memoryDir = mkdtempSync(path.join(tmpdir(), "sts2-agent-routing-"));
  try {
    const memory = new MemoryManager(memoryDir);
    const scoring = scoreCandidates(rewardState, rewardCandidates, memory.run, memory.strategy);
    assert.equal(scoring.route.kind, "llm_required");
    assert.equal(scoring.shouldAskLlm, true);

    const noLlmController = new AgentController(new FakeClient(rewardState.raw), memory, new NoopLlmDecider());
    const noLlmResult = await noLlmController.tick({ dryRun: true });
    assert.equal(noLlmResult.chosenBy, "fallback");
    assert.equal(noLlmResult.route, "llm_required");
    assert.equal(noLlmResult.fallbackReason, "llm_unavailable");
    assert.equal(noLlmResult.llm?.wanted, true);
    assert.equal(noLlmResult.llm?.called, false);
    assert.equal(noLlmResult.llm?.outcome, "unavailable");

    const invalidChoiceController = new AgentController(
      new FakeClient(rewardState.raw),
      memory,
      new InvalidChoiceLlmDecider()
    );
    const invalidChoiceResult = await invalidChoiceController.tick({ dryRun: true });
    assert.equal(invalidChoiceResult.chosenBy, "fallback");
    assert.equal(invalidChoiceResult.fallbackReason, "llm_invalid_choice");
    assert.equal(invalidChoiceResult.llm?.called, true);
    assert.equal(invalidChoiceResult.llm?.outcome, "invalid_choice");

    const invalidShapeController = new AgentController(
      new FakeClient(rewardState.raw),
      memory,
      new InvalidShapeLlmDecider()
    );
    const invalidShapeResult = await invalidShapeController.tick({ dryRun: true });
    assert.equal(invalidShapeResult.chosenBy, "fallback");
    assert.equal(invalidShapeResult.fallbackReason, "llm_invalid_output");
    assert.equal(invalidShapeResult.llm?.called, true);
    assert.equal(invalidShapeResult.llm?.outcome, "invalid_output");

    const previousLiveAdditive = process.env.STS2_P8_LIVE_ADDITIVE;
    const previousLiveClasses = process.env.STS2_P8_LIVE_DECISION_CLASSES;
    const countingLlm = new CountingLlmDecider();
    try {
      process.env.STS2_P8_LIVE_ADDITIVE = "1";
      process.env.STS2_P8_LIVE_DECISION_CLASSES = "combat:llm_required";
      const nonWhitelistedController = new AgentController(
        new FakeClient(rewardState.raw),
        memory,
        countingLlm
      );
      const nonWhitelistedResult = await nonWhitelistedController.tick({ dryRun: true });
      assert.equal(nonWhitelistedResult.chosenBy, "fallback");
      assert.equal(nonWhitelistedResult.fallbackReason, "live_additive_decision_class_not_whitelisted");
      assert.equal(nonWhitelistedResult.llm?.called, false);
      assert.equal(nonWhitelistedResult.llm?.outcome, "disabled_by_live_whitelist");
      assert.equal(nonWhitelistedResult.llm?.promptMode, "legacy_only");
      assert.equal(nonWhitelistedResult.llm?.liveAdditiveEnabled, true);
      assert.equal(nonWhitelistedResult.llm?.liveAdditiveApplied, false);
      assert.equal(countingLlm.calls, 0);
    } finally {
      if (previousLiveAdditive === undefined) delete process.env.STS2_P8_LIVE_ADDITIVE;
      else process.env.STS2_P8_LIVE_ADDITIVE = previousLiveAdditive;
      if (previousLiveClasses === undefined) delete process.env.STS2_P8_LIVE_DECISION_CLASSES;
      else process.env.STS2_P8_LIVE_DECISION_CLASSES = previousLiveClasses;
    }

    const previousLiveMemoryUpdates = process.env.STS2_ALLOW_LIVE_LLM_MEMORY_UPDATES;
    try {
      process.env.STS2_P8_LIVE_ADDITIVE = "1";
      process.env.STS2_P8_LIVE_DECISION_CLASSES = "card_reward:llm_required";
      delete process.env.STS2_ALLOW_LIVE_LLM_MEMORY_UPDATES;
      const blockingController = new AgentController(
        new FakeClient(rewardState.raw),
        memory,
        {
          isAvailable: () => true,
          async decide() {
            return {
              candidateId: rewardCandidates[0]!.id,
              confidence: 0.8,
              reason: "Take immediate power now.",
              memoryUpdates: { strategicDirection: ["blocked-write"] },
              parameterSuggestions: [{ key: "block", delta: 1, reason: "blocked-strategy-write" }]
            };
          }
        }
      );
      const blockedMemoryUpdateResult = await blockingController.tick({ dryRun: true });
      assert.equal(blockedMemoryUpdateResult.chosenBy, "llm");
      assert.deepEqual(blockedMemoryUpdateResult.llm?.protectedPathAttemptedWrites, ["memory", "strategy_params"]);
      assert.ok(blockedMemoryUpdateResult.llm?.protectedPathBlockedWrites?.includes("live_llm_memory_updates_blocked_by_default"));
      assert.ok(blockedMemoryUpdateResult.llm?.protectedPathBlockedWrites?.includes("live_llm_strategy_params_blocked_by_default"));
      assert.equal(memory.run.strategicDirection.includes("blocked-write"), false);
    } finally {
      if (previousLiveAdditive === undefined) delete process.env.STS2_P8_LIVE_ADDITIVE;
      else process.env.STS2_P8_LIVE_ADDITIVE = previousLiveAdditive;
      if (previousLiveClasses === undefined) delete process.env.STS2_P8_LIVE_DECISION_CLASSES;
      else process.env.STS2_P8_LIVE_DECISION_CLASSES = previousLiveClasses;
      if (previousLiveMemoryUpdates === undefined) delete process.env.STS2_ALLOW_LIVE_LLM_MEMORY_UPDATES;
      else process.env.STS2_ALLOW_LIVE_LLM_MEMORY_UPDATES = previousLiveMemoryUpdates;
    }

    const characterSelectState = normalizeGameState({
      state_type: "menu",
      menu_screen: "character_select",
      menu: { options: ["IRONCLAD", "DEFECT", "embark"] },
      player: { character: "Unknown", max_energy: 3 }
    });
    memory.run.keyDecisions.push({
      id: "old-menu-defect",
      at: "2000-01-01T00:00:00.000Z",
      screen: "menu",
      stateSummary: "old menu",
      chosen: "菜单 DEFECT",
      chosenBy: "local",
      reasons: [],
      candidates: []
    });
    const characterSelectScoring = scoreCandidates(
      characterSelectState,
      generateCandidates(characterSelectState),
      memory.run,
      memory.strategy
    );
    assert.equal(characterSelectScoring.top?.action.kind, "menu_select");
    assert.equal(
      characterSelectScoring.top?.action.kind === "menu_select" ? characterSelectScoring.top.action.option : "",
      "DEFECT"
    );

    const disabledMenuState = normalizeGameState({
      state_type: "menu",
      menu_screen: "character_select",
      options: [
        { name: "DEFECT", enabled: true },
        { name: "embark", enabled: false }
      ],
      player: { character: "Unknown", max_energy: 3 }
    });
    assert.ok(
      !generateCandidates(disabledMenuState).some(
        (candidate) => candidate.action.kind === "menu_select" && candidate.action.option === "embark"
      )
    );

    const runStartingMenuState = normalizeGameState({
      state_type: "menu",
      menu_screen: "character_select",
      run: { act: 1, floor: 0, ascension: 4 },
      options: [
        { name: "DEFECT", enabled: true },
        { name: "confirm", enabled: false },
        { name: "embark", enabled: false }
      ],
      player: { character: "Unknown", max_energy: 3 }
    });
    assert.deepEqual(generateCandidates(runStartingMenuState), []);
  } finally {
    rmSync(memoryDir, { recursive: true, force: true });
  }
}

{
  const memoryDir = mkdtempSync(path.join(tmpdir(), "sts2-agent-finalize-gate-"));
  const previousLegacyFinalize = process.env.STS2_ENABLE_LEGACY_FINALIZE_STABLE_WRITES;
  try {
    delete process.env.STS2_ENABLE_LEGACY_FINALIZE_STABLE_WRITES;
    const memory = new MemoryManager(memoryDir);
    memory.updateFromState(rewardState);
    memory.recordDecision({
      id: "decision-test",
      at: new Date(0).toISOString(),
      screen: rewardState.screen,
      stateSummary: "reward state",
      chosen: "Take card",
      chosenBy: "llm",
      route: "llm_required",
      routeReasons: [],
      llm: { wanted: true, called: true, available: true, outcome: "selected" },
      candidateCount: rewardCandidates.length,
      topCandidate: { id: rewardCandidates[0]!.id, label: rewardCandidates[0]!.label, score: 1, confidence: 0.5 },
      score: 1,
      confidence: 0.5,
      reasons: [],
      candidates: []
    });
    const reward = memory.finalizeRun(rewardState);
    assert.ok(reward.score <= 1000);
    assert.equal(memory.longTerm.runs.length, 0);
    const legacyFinalizeAuditPath = path.join(memoryDir, "legacy-finalize-audit.jsonl");
    assert.equal(existsSync(legacyFinalizeAuditPath), true);
    const blockedAudit = JSON.parse(readFileSync(legacyFinalizeAuditPath, "utf8").trim().split("\n").at(-1) ?? "{}");
    assert.equal(blockedAudit.learningMode, "legacy_local_learning");
    assert.equal(blockedAudit.proposalPromotion, false);
    assert.equal(blockedAudit.stablePromotion, false);
    assert.equal(blockedAudit.blockedStableWrites, true);
    assert.deepEqual(blockedAudit.blockedStableWriteTargets, ["memory", "strategy_params"]);

    process.env.STS2_ENABLE_LEGACY_FINALIZE_STABLE_WRITES = "1";
    const enabledMemory = new MemoryManager(memoryDir);
    enabledMemory.updateFromState(rewardState);
    enabledMemory.recordDecision({
      id: "decision-test-enabled",
      at: new Date(0).toISOString(),
      screen: rewardState.screen,
      stateSummary: "reward state",
      chosen: "Take card",
      chosenBy: "local",
      route: "local_confident",
      routeReasons: [],
      llm: { wanted: false, called: false, available: false, outcome: "not_needed" },
      candidateCount: rewardCandidates.length,
      topCandidate: { id: rewardCandidates[0]!.id, label: rewardCandidates[0]!.label, score: 1, confidence: 0.5 },
      score: 1,
      confidence: 0.5,
      reasons: [],
      candidates: []
    });
    enabledMemory.finalizeRun(rewardState);
    assert.equal(enabledMemory.longTerm.runs.length, 1);
    const enabledAudit = JSON.parse(readFileSync(legacyFinalizeAuditPath, "utf8").trim().split("\n").at(-1) ?? "{}");
    assert.equal(enabledAudit.mode, "legacy_finalize_explicitly_enabled");
    assert.equal(enabledAudit.learningMode, "legacy_local_learning");
    assert.equal(enabledAudit.proposalPromotion, false);
    assert.equal(enabledAudit.stablePromotion, false);
    assert.equal(enabledAudit.blockedStableWrites, false);
    assert.deepEqual(enabledAudit.appliedStableWriteTargets, ["memory", "strategy_params"]);
  } finally {
    if (previousLegacyFinalize === undefined) delete process.env.STS2_ENABLE_LEGACY_FINALIZE_STABLE_WRITES;
    else process.env.STS2_ENABLE_LEGACY_FINALIZE_STABLE_WRITES = previousLegacyFinalize;
    rmSync(memoryDir, { recursive: true, force: true });
  }
}
assert.equal(
  cardDamage({
    id: "REFRACT",
    name: "Refract",
    index: 0,
    type: "Attack",
    cost: "3",
    description: "Deal 9 damage twice. Channel 2 Glass.",
    canPlay: true,
    raw: {}
  }),
  18
);

const rewardsScreenState = normalizeGameState({
  state_type: "rewards",
  rewards: {
    items: [
      {
        index: 0,
        type: "gold",
        description: "Obtain 25 gold.",
        gold_amount: 25
      },
      {
        index: 1,
        type: "card",
        description: "Add a card to your deck."
      }
    ],
    can_proceed: true
  },
  run: { act: 1, floor: 2, ascension: 1 },
  player: {
    character: "The Defect",
    hp: 70,
    max_hp: 75,
    block: 0,
    energy: 0,
    max_energy: 3,
    relics: [],
    potions: [],
    status: [],
    draw_pile_count: 8,
    discard_pile_count: 4,
    exhaust_pile_count: 0,
    gold: 99
  }
});
const rewardsScreenCandidates = generateCandidates(rewardsScreenState);
assert.equal(rewardsScreenState.screen, "rewards");
assert.ok(rewardsScreenCandidates.some((candidate) => candidate.kind === "claim_reward"));
assert.ok(!rewardsScreenCandidates.some((candidate) => candidate.kind === "proceed"));
{
  const memoryDir = mkdtempSync(path.join(tmpdir(), "sts2-agent-reward-order-"));
  try {
    const memory = new MemoryManager(memoryDir);
    const scoring = scoreCandidates(rewardsScreenState, rewardsScreenCandidates, memory.run, memory.strategy);
    assert.equal(scoring.top?.action.kind, "claim_reward");
    assert.equal(scoring.top?.action.kind === "claim_reward" ? scoring.top.action.index : -1, 1);
  } finally {
    rmSync(memoryDir, { recursive: true, force: true });
  }
}

const fullPotionRewardState = normalizeGameState({
  state_type: "rewards",
  rewards: {
    items: [
      {
        index: 0,
        type: "potion",
        description: "Speed Potion",
        potion_id: "SPEED_POTION",
        potion_name: "Speed Potion"
      }
    ],
    can_proceed: true
  },
  run: { act: 1, floor: 5, ascension: 4 },
  player: {
    character: "The Defect",
    hp: 42,
    max_hp: 75,
    block: 0,
    energy: 0,
    max_energy: 3,
    max_potion_slots: 2,
    relics: [],
    potions: [
      { id: "STRENGTH_POTION", name: "Strength Potion", slot: 0 },
      { id: "POTION_OF_CAPACITY", name: "Potion of Capacity", slot: 1 }
    ],
    status: [],
    draw_pile_count: 0,
    discard_pile_count: 0,
    exhaust_pile_count: 0,
    gold: 97
  }
});
const fullPotionRewardCandidates = generateCandidates(fullPotionRewardState);
assert.ok(!fullPotionRewardCandidates.some((candidate) => candidate.kind === "claim_reward"));
assert.deepEqual(
  fullPotionRewardCandidates.map((candidate) => candidate.action),
  [{ kind: "discard_potion", slot: 0 }, { kind: "discard_potion", slot: 1 }, { kind: "proceed" }]
);
{
  const memoryDir = mkdtempSync(path.join(tmpdir(), "sts2-agent-full-potion-reward-"));
  try {
    const memory = new MemoryManager(memoryDir);
    const scoring = scoreCandidates(fullPotionRewardState, fullPotionRewardCandidates, memory.run, memory.strategy);
    assert.equal(scoring.top?.action.kind, "proceed");
  } finally {
    rmSync(memoryDir, { recursive: true, force: true });
  }
}

const smokeMemoryDir = mkdtempSync(path.join(tmpdir(), "sts2-agent-smoke-"));
try {
  const memory = new MemoryManager(smokeMemoryDir);
  const scaffoldState = normalizeGameState(combatState());
  const scaffoldCandidates = scoreCandidates(scaffoldState, generateCandidates(scaffoldState), memory.run, memory.strategy);
  const scaffold = buildCognitiveScaffold({
    state: scaffoldState,
    run: memory.run,
    candidates: scaffoldCandidates.candidates,
    relevantMemories: ["combat lesson: avoid death risk when incoming damage is high (conf=0.80)"],
    tags: ["combat", "incoming_damage"],
    route: scaffoldCandidates.route,
    uncertaintyReasons: scaffoldCandidates.uncertaintyReasons
  });
  assert.equal(scaffold.strategicImpression.schemaVersion, DOMAIN_SCHEMA_VERSION);
  assert.ok(scaffold.salienceSignals.length > 0);
  assert.equal(scaffold.memoryActivation.items.length, 1);
  assert.equal(scaffold.candidateFutures.length, scaffoldCandidates.candidates.length);
  assert.ok(scaffold.candidateFutures.every((future) => Array.isArray(future.predictionChecks)));
  assert.ok(scaffold.candidateFutures.some((future) => (future.predictionChecks?.length ?? 0) > 0));
  assert.equal(scaffold.deliberationPacket.candidateFutures.length, scaffoldCandidates.candidates.length);
  const blockPrediction = buildPredictionErrorRecord({
    selectedPlan: {
      predictedOutcome: ["player block should increase"],
      predictionChecks: [
        {
          type: "block_delta",
          prediction: "player block should increase",
          expected: { blockChanged: true },
          source: "candidate_future"
        }
      ]
    },
    checkpoint: {
      kind: "soft",
      reasons: ["player_block_changed"],
      settled: true,
      polls: 1,
      preStateHash: "pre",
      postStateHash: "post",
      before: "before",
      after: "after",
      changes: { block: { changed: true, before: 0, after: 5 } }
    }
  });
  assert.equal(blockPrediction.errorType, "prediction_supported");
  assert.ok(Array.isArray(blockPrediction.evidence?.[0]?.typedChecks));
  assert.equal(blockPrediction.evidence?.[0]?.typedChecks?.[0]?.type, "block_delta");
  assert.equal(blockPrediction.evidence?.[0]?.typedChecks?.[0]?.status, "supported");
  assert.equal(blockPrediction.evidence?.[0]?.typedChecks?.[0]?.source, "candidate_future");
  assert.equal(blockPrediction.attributionBuckets?.[0]?.bucket, "defense");
  assert.equal(blockPrediction.attributionBuckets?.[0]?.status, "supported");
  assert.equal(buildConsolidationRecord({ predictionError: blockPrediction }), undefined);
  const unknownPrediction = buildPredictionErrorRecord({
    selectedPlan: {
      id: "future-test",
      predictedOutcome: ["player block should increase"],
      predictionChecks: [
        {
          type: "block_delta",
          prediction: "player block should increase",
          expected: { blockChanged: true },
          source: "candidate_future"
        }
      ]
    },
    checkpoint: {
      kind: "soft",
      reasons: ["player_energy_changed"],
      settled: true,
      polls: 1,
      preStateHash: "pre",
      postStateHash: "post",
      before: "before",
      after: "after",
      changes: { energy: { changed: true, before: 3, after: 2 } }
    }
  });
  assert.equal(unknownPrediction.attributionBuckets?.[0]?.bucket, "defense");
  assert.equal(unknownPrediction.attributionBuckets?.[0]?.status, "unknown");
  assert.equal(buildConsolidationRecord({ predictionError: unknownPrediction, selectedPlan: { id: "future-test" } }), undefined);
  const contradictedPrediction = buildPredictionErrorRecord({
    selectedPlan: {
      id: "future-contradicted",
      predictedOutcome: ["player block should increase"],
      predictionChecks: [
        {
          type: "block_delta",
          prediction: "player block should increase by 5",
          expected: { blockChanged: true, expectedBlockGain: 5 },
          source: "candidate_future"
        }
      ]
    },
    checkpoint: {
      kind: "soft",
      reasons: ["player_block_changed"],
      settled: true,
      polls: 1,
      preStateHash: "pre",
      postStateHash: "post",
      before: "before",
      after: "after",
      changes: { block: { changed: true, before: 0, after: 3 } }
    }
  });
  const contradictedChecks = contradictedPrediction.evidence?.[0]?.typedChecks;
  assert.ok(Array.isArray(contradictedChecks));
  assert.equal(contradictedChecks[0]?.status, "unsupported");
  assert.equal(contradictedPrediction.attributionBuckets?.[0]?.status, "unsupported");
  const consolidationProposal = buildConsolidationRecord({ predictionError: contradictedPrediction, selectedPlan: { id: "future-contradicted" } });
  assert.equal(consolidationProposal?.status, "proposed");
  assert.ok(consolidationProposal);
  assert.equal(consolidationProposal?.targetLayer, "candidate_future");
  assert.equal(consolidationProposal?.affectedModule, "candidate_future");
  assert.equal(consolidationProposal?.proposalKind, "learning_proposal");
  assert.equal(consolidationProposal?.evidenceStrength, "weak");
  assert.ok(consolidationProposal?.blockedStableTargets?.includes("memory"));
  assert.equal(consolidationProposal?.proposedChange?.stableMutation, false);
  assert.ok(consolidationProposal?.expiry);
  assert.ok(consolidationProposal?.revalidation);
  assert.ok(consolidationProposal?.createdAt);
  const unsupportedProposalSurface = buildReplayConsolidationProposalSurface([consolidationProposal]);
  assert.equal(unsupportedProposalSurface.proposals, 1);
  assert.equal(unsupportedProposalSurface.pendingReview, 1);
  assert.equal(unsupportedProposalSurface.mutatingOrAccepted, 0);
  assert.equal(unsupportedProposalSurface.targetLayerCounts.candidate_future, 1);
  assert.equal(unsupportedProposalSurface.groups.length, 1);
  assert.equal(unsupportedProposalSurface.groups[0]?.occurrences, 1);
  assert.equal(unsupportedProposalSurface.groups[0]?.stableMutation, false);
  assert.ok(unsupportedProposalSurface.groups[0]?.blockedStableTargets.includes("memory"));
  const aggregatedProposalSurface = buildReplayConsolidationProposalSurface([
    consolidationProposal,
    {
      ...consolidationProposal,
      recordId: "consolidation-aggregate-2",
      transitionId: "transition-aggregate-2",
      tick: 2,
      selectedAction: { kind: "play_card", cardName: "Strike" }
    },
    {
      ...consolidationProposal,
      recordId: "consolidation-aggregate-3",
      transitionId: "transition-aggregate-3",
      tick: 3,
      selectedAction: { kind: "play_card", cardName: "Strike" }
    }
  ]);
  assert.equal(aggregatedProposalSurface.proposals, 3);
  assert.equal(aggregatedProposalSurface.groups.length, 1);
  assert.equal(aggregatedProposalSurface.recurringGroups, 1);
  assert.equal(aggregatedProposalSurface.groups[0]?.occurrences, 3);
  assert.equal(aggregatedProposalSurface.groups[0]?.evidenceStrength, "moderate");
  assert.equal(aggregatedProposalSurface.groups[0]?.mutatingOrAccepted, 0);
  assert.equal(aggregatedProposalSurface.groups[0]?.stableMutation, false);
  assert.ok(aggregatedProposalSurface.groups[0]?.forbiddenNextSteps.includes("auto_write_memory"));
  const p9ProposalDir = mkdtempSync(path.join(tmpdir(), "sts2-p9-proposals-"));
  const actionableProposal = appendLearningProposal(p9ProposalDir, {
    type: "classification_policy",
    status: "pending_review",
    scope: { decisionClasses: ["shop:llm_required"], conditions: ["low HP and deck scaling pressure"] },
    targetLayer: "classification_policy",
    targetObject: "shop_skill_routing",
    proposedPatch: { proposalOnly: true, addSoftTag: "shop + survival-risk + deck-scaling" },
    evidence: [
      {
        source: "review",
        runId: "run-p9-smoke",
        transitionId: "transition-p9-smoke",
        summary: "Shop choice needed survival and scaling framing.",
        strength: "weak"
      }
    ],
    counterexamples: [{ summary: "High HP shops may favor scaling over survival buys.", condition: "high_hp" }],
    weakAttribution: {
      suspectedCause: "classification missed the survival-risk overlay",
      confidence: 0.42,
      counterexampleNeeded: ["fresh shop windows where survival overlay would be wrong"],
      alternativeHypotheses: ["candidate template omitted defensive buy value"]
    },
    confidence: 0.42,
    riskLevel: "medium",
    expectedEffect: "Route shop decisions through a richer soft situation tag before any stable promotion.",
    promotionCriteria: {
      evidenceRequired: ["same-budget fresh shop evidence"],
      validationPlan: ["shadow overlay comparison only"]
    },
    rollbackPlan: {
      rollbackTrigger: ["worse reason quality", "candidate mismatch"],
      rollbackAction: "remove proposed soft tag from shadow overlay"
    },
    protectedPathImpact: {
      protectedTargets: ["classification_policy", "scaffold_policy"],
      stableWriteRequired: true,
      allowedBeforePromotion: false
    },
    createdFromRunIds: ["run-p9-smoke"],
    createdFromTransitionIds: ["transition-p9-smoke"]
  });
  assert.equal(actionableProposal.status, "pending_review");
  assert.equal(actionableProposal.validation.actionable, true);
  const vagueProposal = appendLearningProposal(p9ProposalDir, {
    type: "memory",
    status: "pending_review",
    targetLayer: "memory",
    targetObject: "generic_advice",
    proposedPatch: { advice: "be careful" },
    expectedEffect: "Be better."
  });
  assert.equal(vagueProposal.status, "draft");
  assert.equal(vagueProposal.validation.actionable, false);
  assert.ok(vagueProposal.validation.missingRequiredFields.includes("evidence"));
  const proposalSurfaceV2 = buildLearningProposalSurface(readLearningProposals(p9ProposalDir));
  assert.equal(proposalSurfaceV2.proposals, 2);
  assert.equal(proposalSurfaceV2.pendingReview, 1);
  assert.equal(proposalSurfaceV2.actionablePending, 1);
  assert.equal(proposalSurfaceV2.draft, 1);
  assert.equal(proposalSurfaceV2.stableOrApplied, 0);
  assert.equal(proposalSurfaceV2.applyPathEnabled, false);
  assert.equal(proposalSurfaceV2.stablePromotionEnabled, false);
  const storedP9Proposals = readLearningProposals(p9ProposalDir);
  assert.equal(filterLearningProposals(storedP9Proposals, { status: "pending_review" }).length, 1);
  assert.equal(filterLearningProposals(storedP9Proposals, { missingRequiredField: "evidence" }).length, 1);
  assert.equal(summarizeLearningProposal(storedP9Proposals[0] ?? {}).applyPathEnabled, false);
  const approvedReviewDecision = appendLearningProposalReviewDecision(p9ProposalDir, storedP9Proposals, {
    proposalId: actionableProposal.id,
    decision: "approve",
    reviewer: "human",
    notes: "Approved for future shadow review only; no apply or promotion."
  });
  assert.equal(approvedReviewDecision.decision, "approve");
  assert.equal(approvedReviewDecision.reviewScope, "audit_only");
  assert.equal(approvedReviewDecision.proposalMutationEnabled, false);
  assert.equal(approvedReviewDecision.applyPathEnabled, false);
  assert.equal(approvedReviewDecision.stablePromotionEnabled, false);
  assert.equal(approvedReviewDecision.proposalSnapshot.actionable, true);
  assert.throws(
    () => appendLearningProposalReviewDecision(p9ProposalDir, storedP9Proposals, {
      proposalId: vagueProposal.id,
      decision: "approve",
      reviewer: "human",
      notes: "This must not be accepted because the proposal is vague."
    }),
    /non-actionable proposal/
  );
  const rejectedReviewDecision = appendLearningProposalReviewDecision(p9ProposalDir, storedP9Proposals, {
    proposalId: vagueProposal.id,
    decision: "reject",
    reviewer: "human",
    notes: "Rejected as vague advice; keep as audit evidence only."
  });
  assert.equal(rejectedReviewDecision.decision, "reject");
  assert.equal(rejectedReviewDecision.proposalMutationEnabled, false);
  assert.equal(readLearningProposals(p9ProposalDir).find((proposal) => proposal.id === vagueProposal.id)?.status, "draft");
  const reviewDecisions = readLearningProposalReviewDecisions(p9ProposalDir);
  const reviewDecisionSurface = buildLearningProposalReviewDecisionSurface(reviewDecisions);
  assert.equal(reviewDecisionSurface.decisions, 2);
  assert.equal(reviewDecisionSurface.approve, 1);
  assert.equal(reviewDecisionSurface.reject, 1);
  assert.equal(reviewDecisionSurface.expire, 0);
  assert.equal(reviewDecisionSurface.proposalMutationEnabled, false);
  assert.equal(reviewDecisionSurface.applyPathEnabled, false);
  assert.equal(reviewDecisionSurface.stablePromotionEnabled, false);
  assert.equal(filterLearningProposalReviewDecisions(reviewDecisions, { proposalId: actionableProposal.id }).length, 1);
  assert.equal(filterLearningProposalReviewDecisions(reviewDecisions, { decision: "reject" }).length, 1);
  assert.equal(summarizeLearningProposalReviewDecision(reviewDecisions[0] ?? {}).applyPathEnabled, false);
  const feedback = appendReverseScaffoldFeedback(p9ProposalDir, {
    source: "review",
    targetLayer: "candidate_future",
    omittedInformation: ["skip value compared with deck bloat"],
    misleadingInformation: [],
    requestedScaffoldChange: "Expose skip value as a candidate-future tradeoff before card reward decisions.",
    evidence: [
      {
        source: "review",
        runId: "run-p9-smoke",
        transitionId: "transition-p9-card-reward",
        summary: "Card reward reason compared cards but did not explain skip value.",
        strength: "weak"
      }
    ],
    confidence: 0.55,
    riskLevel: "low",
    proposalSeedIds: [actionableProposal.id],
    createdFromRunIds: ["run-p9-smoke"],
    createdFromTransitionIds: ["transition-p9-card-reward"]
  });
  assert.equal(feedback.targetLayer, "candidate_future");
  const feedbackSurface = buildReverseScaffoldFeedbackSurface(readReverseScaffoldFeedback(p9ProposalDir));
  assert.equal(feedbackSurface.feedback, 1);
  assert.equal(feedbackSurface.targetLayerCounts.candidate_future, 1);
  assert.equal(feedbackSurface.proposalSeedLinks, 1);
  assert.equal(feedbackSurface.affectsLiveBehavior, false);
  assert.equal(feedbackSurface.stablePromotionEnabled, false);
  const storedFeedback = readReverseScaffoldFeedback(p9ProposalDir);
  assert.equal(filterReverseScaffoldFeedback(storedFeedback, { targetLayer: "candidate_future" }).length, 1);
  assert.equal(filterReverseScaffoldFeedback(storedFeedback, { proposalSeedId: actionableProposal.id }).length, 1);
  assert.equal(summarizeReverseScaffoldFeedback(storedFeedback[0] ?? {}).affectsLiveBehavior, false);
  rmSync(p9ProposalDir, { recursive: true, force: true });
  const cardFlowSupportedPrediction = buildPredictionErrorRecord({
    selectedPlan: {
      id: "future-card-flow-supported",
      predictedOutcome: [
        "card Strike leaves hand if accepted",
        "hand or draw/discard state may change beyond played card"
      ],
      predictionChecks: [
        {
          type: "card_removed_from_hand",
          prediction: "card Strike leaves hand if accepted",
          expected: {
            cardIndex: 0,
            cardName: "Strike",
            beforeHandCount: 3,
            expectedAfterHandCount: 2
          },
          source: "candidate_future"
        },
        {
          type: "card_flow_delta",
          prediction: "hand or draw/discard state may change beyond played card",
          expected: { handOrPileChanged: true },
          source: "candidate_future"
        }
      ]
    },
    checkpoint: {
      kind: "hard",
      reasons: [
        "expected_card_removed_from_hand",
        "hand_grew_or_generated_card",
        "draw_pile_count_changed",
        "discard_pile_count_changed"
      ],
      settled: true,
      polls: 1,
      preStateHash: "pre-card-flow",
      postStateHash: "post-card-flow",
      before: "before",
      after: "after",
      changes: {
        hand: {
          before: ["Strike", "Zap", "Coolheaded"],
          after: ["Zap", "Defend", "Orb Shard"]
        },
        drawPileCount: { before: 6, after: 5 },
        discardPileCount: { before: 2, after: 3 }
      }
    }
  });
  assert.equal(cardFlowSupportedPrediction.status, "accepted");
  assert.equal(cardFlowSupportedPrediction.attributionBuckets?.[0]?.bucket, "card_flow");
  assert.equal(cardFlowSupportedPrediction.attributionBuckets?.[0]?.status, "supported");

  const lowHpMapState = normalizeGameState({
    state_type: "map",
    map_nodes: [{ type: "RestSite" }, { type: "Unknown" }],
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 20,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  memory.updateFromState(lowHpMapState);
  const lowHpMapScoring = scoreCandidates(lowHpMapState, generateCandidates(lowHpMapState), memory.run, memory.strategy);
  assert.equal(lowHpMapScoring.shouldAskLlm, true);
  assert.equal(lowHpMapScoring.route.kind, "llm_required");
  assert.equal(lowHpMapScoring.top?.action.kind, "choose_map_node");
  assert.equal(lowHpMapScoring.top?.action.kind === "choose_map_node" ? lowHpMapScoring.top.action.index : -1, 0);
  const lowHpMapPlan = buildMapRoutePlanFromChoice({
    state: lowHpMapState,
    candidate: lowHpMapScoring.top,
    run: memory.run
  });
  assert.ok(lowHpMapPlan);
  memory.run.activeMapRoutePlan = lowHpMapPlan;
  const lowHpMapFollowScoring = scoreCandidates(lowHpMapState, generateCandidates(lowHpMapState), memory.run, memory.strategy);
  assert.equal(lowHpMapFollowScoring.shouldAskLlm, false);
  assert.equal(lowHpMapFollowScoring.route.kind, "obvious_local");
  assert.match(lowHpMapFollowScoring.top?.reasons.join(" ") ?? "", /route plan|路线计划/i);
  const lowHpMapScaffold = buildCognitiveScaffold({
    state: lowHpMapState,
    run: memory.run,
    candidates: lowHpMapScoring.candidates.slice(0, 2),
    relevantMemories: [],
    tags: ["map", "low_hp"],
    route: lowHpMapScoring.route
  });
  const lowHpMapComparison = buildWorkspaceComparison({
    legacyPrompt: JSON.stringify({ candidates: lowHpMapScoring.candidates.slice(0, 2).map((candidate) => ({ id: candidate.id })) }),
    deliberationPacket: lowHpMapScaffold.deliberationPacket,
    candidates: lowHpMapScoring.candidates.slice(0, 2),
    decisionClass: "map:llm_required",
    options: { shadowEnabled: false, callEnabled: false, ablationMode: "full_bounded_candidate_futures" }
  });
  assert.equal(lowHpMapComparison.coverage.candidateFutureCompleteness?.futureCount, 2);
  assert.ok((lowHpMapComparison.coverage.candidateFutureCompleteness?.withCoreTradeoff ?? 0) >= 1);
  assert.match(
    lowHpMapComparison.summary,
    /compression=(bounded_candidate_futures_non_combat|bounded_passthrough_non_combat)/
  );
  const lowHpMapPrompt = buildDeliberationWorkspacePrompt(
    lowHpMapScaffold.deliberationPacket,
    lowHpMapScoring.candidates.slice(0, 2),
    "full_bounded_candidate_futures"
  );
  assert.match(lowHpMapPrompt, /opportunity cost|alternate route cost|route lock/i);

  const routePlanMapState = normalizeGameState({
    state_type: "map",
    run: { act: 1, floor: 1, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 60,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 99
    },
    map: {
      current_position: { col: 3, row: 0, type: "Ancient" },
      next_options: [
        { index: 0, col: 2, row: 1, type: "Monster", leads_to: [{ col: 2, row: 2, type: "Unknown" }] },
        { index: 1, col: 4, row: 1, type: "Monster", leads_to: [{ col: 4, row: 2, type: "Shop" }] }
      ],
      nodes: [
        { col: 2, row: 1, type: "Monster", children: [[2, 2]] },
        { col: 2, row: 2, type: "Unknown", children: [[2, 3]] },
        { col: 2, row: 3, type: "RestSite", children: [] },
        { col: 4, row: 1, type: "Monster", children: [[4, 2]] },
        { col: 4, row: 2, type: "Shop", children: [] }
      ]
    }
  });
  const routePlanCandidates = generateCandidates(routePlanMapState);
  const routePlanScored = scoreCandidates(routePlanMapState, routePlanCandidates, memory.run, memory.strategy);
  assert.equal(routePlanScored.route.kind, "llm_required");
  assert.equal(routePlanScored.top?.action.kind, "choose_map_node");
  if (!routePlanScored.top) throw new Error("expected route plan map candidate");
  const routePlan = buildMapRoutePlanFromChoice({ state: routePlanMapState, candidate: routePlanScored.top, run: memory.run });
  assert.ok(routePlan);
  assert.notEqual(routePlan.nextNode?.row, routePlan.routeLine[0]?.row);
  assert.ok(routePlan.checkpoints.length >= 2);

  const waitingMapState = normalizeGameState({
    state_type: "map",
    map_nodes: [],
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 20,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  assert.deepEqual(generateCandidates(waitingMapState), []);

  const equivalentMapState = normalizeGameState({
    state_type: "map",
    map_nodes: [{ type: "RestSite" }, { type: "RestSite" }],
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 20,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  memory.updateFromState(equivalentMapState);
  const equivalentMapScoring = scoreCandidates(
    equivalentMapState,
    generateCandidates(equivalentMapState),
    memory.run,
    memory.strategy
  );
  assert.equal(equivalentMapScoring.shouldAskLlm, false);

  const riskyEliteMapState = normalizeGameState({
    state_type: "map",
    map_nodes: [{ type: "Elite" }],
    run: { act: 1, floor: 10, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 28,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  memory.updateFromState(riskyEliteMapState);
  const riskyEliteScoring = scoreCandidates(riskyEliteMapState, generateCandidates(riskyEliteMapState), memory.run, memory.strategy);
  assert.equal(riskyEliteScoring.shouldAskLlm, false);
  assert.equal(riskyEliteScoring.route.kind, "forced_local");

  const eventLoadingState = normalizeGameState({
    state_type: "event",
    event: { options: [] },
    run: { act: 1, floor: 8, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 42,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  assert.deepEqual(generateCandidates(eventLoadingState), []);
  const eventLoadingScoring = scoreCandidates(eventLoadingState, generateCandidates(eventLoadingState), memory.run, memory.strategy);
  assert.equal(eventLoadingScoring.shouldAskLlm, false);

  const eventProceedOptionState = normalizeGameState({
    ...eventLoadingState.raw,
    event: { options: [{ title: "Proceed" }] }
  });
  assert.deepEqual(generateCandidates(eventProceedOptionState)[0]?.action, { kind: "event_choose_option", index: 0 });

  const restProceedState = normalizeGameState({
    state_type: "rest",
    rest_site: { options: [], can_proceed: false },
    run: { act: 1, floor: 14, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 42,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  assert.deepEqual(generateCandidates(restProceedState)[0]?.action, { kind: "proceed" });

  const eventDescriptionState = normalizeGameState({
    state_type: "event",
    event: {
      options: [
        { title: "Gorge", description: "Choose 2 of 8 random Common cards to add to your Deck." },
        { title: "Search", description: "Lose 14 HP. Obtain the Chosen Cheese." }
      ]
    },
    run: { act: 1, floor: 8, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 42,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  const eventDescriptionCandidates = generateCandidates(eventDescriptionState);
  assert.ok(eventDescriptionCandidates.some((candidate) => candidate.label.includes("Lose 14 HP")));

  const crystalSphereState = normalizeGameState({
    state_type: "crystal_sphere",
    crystal_sphere: {
      grid_width: 11,
      grid_height: 11,
      tool: "big",
      can_use_big_tool: true,
      can_use_small_tool: true,
      can_proceed: false,
      divinations_left_text: "3 Divinations remain",
      clickable_cells: [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 0, y: 0 }
      ]
    },
    run: { act: 2, floor: 22, ascension: 0 },
    player: {
      character: "The Defect",
      hp: 39,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 0,
      discard_pile_count: 0,
      exhaust_pile_count: 0,
      gold: 329
    }
  });
  assert.equal(crystalSphereState.screen, "crystal_sphere");
  const crystalSphereCandidates = generateCandidates(crystalSphereState);
  assert.ok(
    crystalSphereCandidates.some(
      (candidate) =>
        candidate.action.kind === "crystal_sphere_click_cell" && candidate.action.x === 5 && candidate.action.y === 5
    )
  );
  const crystalSphereScoring = scoreCandidates(crystalSphereState, crystalSphereCandidates, memory.run, memory.strategy);
  assert.equal(crystalSphereScoring.top?.action.kind, "crystal_sphere_click_cell");

  const crystalSphereToolSwitchState = normalizeGameState({
    ...crystalSphereState.raw,
    crystal_sphere: {
      ...(crystalSphereState.raw.crystal_sphere as object),
      tool: "small"
    }
  });
  const crystalSphereToolSwitchScoring = scoreCandidates(
    crystalSphereToolSwitchState,
    generateCandidates(crystalSphereToolSwitchState),
    memory.run,
    memory.strategy
  );
  assert.equal(crystalSphereToolSwitchScoring.top?.action.kind, "crystal_sphere_set_tool");

  const crystalSphereProceedState = normalizeGameState({
    ...crystalSphereState.raw,
    crystal_sphere: {
      ...(crystalSphereState.raw.crystal_sphere as object),
      can_proceed: true
    }
  });
  assert.deepEqual(generateCandidates(crystalSphereProceedState)[0]?.action, { kind: "crystal_sphere_proceed" });
  assert.deepEqual(toRestBody({ kind: "crystal_sphere_set_tool", tool: "big" }), {
    action: "crystal_sphere_set_tool",
    tool: "big"
  });
  assert.deepEqual(toRestBody({ kind: "crystal_sphere_click_cell", x: 4, y: 7 }), {
    action: "crystal_sphere_click_cell",
    x: 4,
    y: 7
  });
  assert.deepEqual(toRestBody({ kind: "crystal_sphere_proceed" }), { action: "crystal_sphere_proceed" });

  const forcedEndTurnState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 8,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "TERROR_EEL_0",
          name: "Terror Eel",
          hp: 13,
          max_hp: 140,
          block: 0,
          intents: [{ type: "Attack", label: "33" }]
        }
      ]
    },
    run: { act: 1, floor: 11, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 10,
      max_hp: 75,
      block: 20,
      energy: 0,
      max_energy: 3,
      hand: [
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: false
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 10,
      discard_pile_count: 2,
      exhaust_pile_count: 1,
      gold: 80
    }
  });
  const forcedEndTurnScoring = scoreCandidates(forcedEndTurnState, generateCandidates(forcedEndTurnState), memory.run, memory.strategy);
  assert.equal(forcedEndTurnScoring.shouldAskLlm, false);

  const lethalState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 5,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "WATERFALL_GIANT_0",
          name: "Waterfall Giant",
          hp: 80,
          max_hp: 240,
          block: 0,
          intents: [{ type: "Attack", label: "25" }]
        }
      ]
    },
    run: { act: 1, floor: 17, ascension: 4 },
    player: {
      character: "The Defect",
      hp: 8,
      max_hp: 75,
      block: 0,
      energy: 3,
      max_energy: 3,
      hand: [
        {
          id: "REFRACT",
          name: "Refract",
          index: 0,
          type: "Attack",
          cost: "3",
          description: "Deal 9 damage twice. Channel 2 Glass.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 0,
      exhaust_pile_count: 0,
      gold: 99
    }
  });
  const lethalScoring = scoreCandidates(lethalState, generateCandidates(lethalState), memory.run, memory.strategy);
  assert.equal(lethalScoring.top?.action.kind, "play_card");
  assert.equal(lethalScoring.top?.action.kind === "play_card" ? lethalScoring.top.action.cardName : "", "Defend");

  const highPressureState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "CORPSE_SLUG_0",
          name: "Corpse Slug",
          hp: 27,
          max_hp: 27,
          block: 0,
          intents: [{ type: "Attack", label: "14" }]
        }
      ]
    },
    run: { act: 1, floor: 5, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 47,
      max_hp: 75,
      block: 0,
      energy: 2,
      max_energy: 3,
      hand: [
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 0,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "LEAP",
          name: "Leap",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Gain 9 Block.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 2,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 8,
      discard_pile_count: 3,
      exhaust_pile_count: 0,
      gold: 20
    }
  });
  const highPressureScoring = scoreCandidates(highPressureState, generateCandidates(highPressureState), memory.run, memory.strategy);
  assert.equal(highPressureScoring.top?.action.kind, "play_card");
  assert.equal(highPressureScoring.top?.action.kind === "play_card" ? highPressureScoring.top.action.cardName : "", "Leap");

  const sparsePotionSlotState = normalizeGameState({
    ...highPressureState.raw,
    player: {
      ...(highPressureState.raw.player as object),
      potions: [
        {
          id: "POTION_OF_CAPACITY",
          name: "Potion of Capacity",
          slot: 1,
          can_use_in_combat: true,
          target_type: "Self"
        }
      ]
    }
  });
  const sparsePotionCandidate = generateCandidates(sparsePotionSlotState).find((candidate) => candidate.kind === "use_potion");
  assert.deepEqual(sparsePotionCandidate?.action, { kind: "use_potion", slot: 1 });

  const enemyPotionTargetState = normalizeGameState({
    ...highPressureState.raw,
    player: {
      ...(highPressureState.raw.player as object),
      potions: [
        {
          id: "FIRE_POTION",
          name: "Fire Potion",
          slot: 0,
          can_use_in_combat: true,
          target_type: "AnyEnemy"
        }
      ]
    }
  });
  const enemyPotionCandidate = generateCandidates(enemyPotionTargetState).find((candidate) => candidate.kind === "use_potion");
  assert.deepEqual(enemyPotionCandidate?.action, { kind: "use_potion", slot: 0, target: "CORPSE_SLUG_0" });

  const automaticPotionState = normalizeGameState({
    ...highPressureState.raw,
    player: {
      ...(highPressureState.raw.player as object),
      potions: [
        {
          id: "FAIRY_IN_A_BOTTLE",
          name: "Fairy in a Bottle",
          slot: 1,
          target_type: "Self"
        }
      ]
    }
  });
  assert.ok(!generateCandidates(automaticPotionState).some((candidate) => candidate.kind === "use_potion"));

  const riskyAttackFallback: ScoredCandidate = {
    id: "attack-risky",
    kind: "play_card",
    label: "打出 Strike -> Corpse Slug",
    action: { kind: "play_card", cardIndex: 0, cardName: "Strike", target: "CORPSE_SLUG_0" },
    score: 24,
    confidence: 0.18,
    reasons: ["输出"],
    risks: ["高压回合非斩杀攻击会少挡血"]
  };
  const defensiveFallback: ScoredCandidate = {
    id: "block-safe",
    kind: "play_card",
    label: "打出 Leap",
    action: { kind: "play_card", cardIndex: 1, cardName: "Leap" },
    score: 11,
    confidence: 0.72,
    reasons: ["补格挡 9/14"],
    risks: []
  };
  const conservativeFallback = selectFallbackCandidate({
    state: highPressureState,
    route: {
      kind: "llm_required",
      shouldAskLlm: true,
      llmPriority: "required",
      reasons: ["life_or_death"]
    },
    candidates: [riskyAttackFallback, defensiveFallback],
    localTop: riskyAttackFallback,
    fallbackReason: "llm_unavailable"
  });
  assert.equal(conservativeFallback.candidate?.id, "block-safe");
  assert.equal(conservativeFallback.audit.name, "conservative_combat");

  const lethalFallback = selectFallbackCandidate({
    state: highPressureState,
    route: {
      kind: "llm_required",
      shouldAskLlm: true,
      llmPriority: "required",
      reasons: ["possible_combo"]
    },
    candidates: [
      {
        ...riskyAttackFallback,
        id: "lethal-attack",
        score: 120,
        reasons: ["可斩杀目标"]
      },
      defensiveFallback
    ],
    localTop: {
      ...riskyAttackFallback,
      id: "lethal-attack",
      score: 120,
      reasons: ["可斩杀目标"]
    },
    fallbackReason: "llm_unavailable"
  });
  assert.equal(lethalFallback.candidate?.id, "lethal-attack");
  assert.equal(lethalFallback.audit.name, "local_top");

  const collectedRecord = buildCollectedStateRecord({
    rawStatePath: "memory/collected/snapshots/test.raw.json",
    runId: "test-run",
    tick: 1,
    source: "collector",
    state: highPressureState
  });
  assert.equal(collectedRecord.schemaVersion, 1);
  assert.equal(collectedRecord.source, "collector");
  assert.equal(collectedRecord.screen, "combat");
  assert.equal(collectedRecord.action, null);
  assert.equal(collectedRecord.checkpointKind, "not_applicable");
  assert.ok(typeof collectedRecord.stateHash === "string" && collectedRecord.stateHash.length > 20);

  const bundleSelectState = normalizeGameState({
    state_type: "bundle_select",
    bundle_select: {
      screen_type: "bundle",
      prompt: "Choose a bundle.",
      bundles: [
        {
          index: 0,
          cards: [
            {
              id: "BREAKTHROUGH",
              name: "Breakthrough",
              type: "Attack",
              cost: "1",
              description: "Lose 1 HP. Deal 9 damage to ALL enemies.",
              rarity: "Common",
              index: 0
            },
            {
              id: "MOLTEN_FIST",
              name: "Molten Fist",
              type: "Attack",
              cost: "1",
              description: "Deal 10 damage. Double the enemy's Vulnerable. Exhaust.",
              rarity: "Common",
              index: 1
            }
          ]
        },
        {
          index: 1,
          cards: [
            {
              id: "IRON_WAVE",
              name: "Iron Wave",
              type: "Attack",
              cost: "1",
              description: "Gain 5 Block. Deal 5 damage.",
              rarity: "Common",
              index: 0
            },
            {
              id: "TWIN_STRIKE",
              name: "Twin Strike",
              type: "Attack",
              cost: "1",
              description: "Deal 5 damage twice.",
              rarity: "Common",
              index: 1
            }
          ]
        }
      ],
      preview_showing: false,
      can_cancel: false,
      can_confirm: false
    },
    run: { act: 1, floor: 1, ascension: 1 },
    player: {
      character: "The Ironclad",
      hp: 80,
      max_hp: 80,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [{ id: "BURNING_BLOOD", name: "Burning Blood" }],
      potions: [],
      status: [],
      gold: 99
    }
  });
  assert.equal(bundleSelectState.screen, "bundle_select");
  const bundleCandidates = generateCandidates(bundleSelectState);
  assert.ok(bundleCandidates.some((candidate) => candidate.kind === "bundle_select"));
  const bundleScoring = scoreCandidates(bundleSelectState, bundleCandidates, memory.run, memory.strategy);
  assert.equal(bundleScoring.shouldAskLlm, true);
  assert.equal(bundleScoring.top?.action.kind, "bundle_select");

  const bundleConfirmState = normalizeGameState({
    ...bundleSelectState.raw,
    bundle_select: {
      ...(bundleSelectState.raw.bundle_select as object),
      preview_showing: true,
      preview_cards: [
        { id: "IRON_WAVE", name: "Iron Wave", type: "Attack", cost: "1", description: "Gain 5 Block. Deal 5 damage." }
      ],
      can_confirm: true
    }
  });
  const bundleConfirmCandidates = generateCandidates(bundleConfirmState);
  assert.equal(bundleConfirmCandidates[0]?.kind, "bundle_confirm_selection");
  assert.deepEqual(toRestBody({ kind: "bundle_select", index: 1 }), { action: "select_bundle", index: 1 });
  assert.deepEqual(toRestBody({ kind: "bundle_confirm_selection" }), { action: "confirm_bundle_selection" });

  const handSelectState = normalizeGameState({
    state_type: "hand_select",
    hand_select: {
      mode: "simple_select",
      prompt: "Choose a card to make free.",
      cards: [
        { id: "STRIKE_IRONCLAD", name: "Strike", type: "Attack", cost: "1", index: 0 },
        { id: "DEFEND_IRONCLAD", name: "Defend", type: "Skill", cost: "1", index: 1 }
      ],
      can_confirm: false
    },
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [{ entity_id: "GREMLIN_MERC_0", name: "Gremlin Merc", hp: 24, max_hp: 47, intents: [] }]
    },
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Ironclad",
      hp: 78,
      max_hp: 80,
      block: 5,
      energy: 0,
      max_energy: 3,
      hand: [],
      relics: [],
      potions: [],
      status: [],
      gold: 164
    }
  });
  assert.equal(handSelectState.screen, "card_select");
  assert.deepEqual(
    generateCandidates(handSelectState).map((candidate) => candidate.kind),
    ["combat_select_card", "combat_select_card"]
  );
  assert.deepEqual(toRestBody({ kind: "combat_select_card", index: 1, cardName: "Defend" }), {
    action: "combat_select_card",
    card_index: 1
  });
  assert.deepEqual(toRestBody({ kind: "combat_confirm_selection" }), { action: "combat_confirm_selection" });

  const multiRemoveState = normalizeGameState({
    state_type: "card_select",
    card_select: {
      screen_type: "select",
      prompt: "Choose 5 cards to Remove.",
      cards: [
        { id: "STRIKE_DEFECT", name: "Strike", type: "Attack", cost: "1", rarity: "Basic", index: 0 },
        { id: "STRIKE_DEFECT", name: "Strike", type: "Attack", cost: "1", rarity: "Basic", index: 1 },
        { id: "DEFEND_DEFECT", name: "Defend", type: "Skill", cost: "1", rarity: "Basic", index: 2 }
      ]
    },
    run: { act: 2, floor: 18, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 60,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      hand: [],
      relics: [{ id: "PAELS_TOOTH", name: "Pael's Tooth" }],
      potions: [],
      status: [],
      gold: 200
    }
  });
  const multiRemoveClient = new FakeClient(multiRemoveState.raw, multiRemoveState.raw);
  const multiRemoveController = new AgentController(multiRemoveClient, memory, new NoopLlmDecider());
  const firstRemove = await multiRemoveController.tick();
  await new Promise((resolve) => setTimeout(resolve, 1250));
  const secondRemove = await multiRemoveController.tick();
  assert.equal(firstRemove.chosen?.action.kind, "select_card");
  assert.equal(firstRemove.chosen?.action.kind === "select_card" ? firstRemove.chosen.action.index : -1, 0);
  assert.equal(secondRemove.chosen?.action.kind, "select_card");
  assert.equal(secondRemove.chosen?.action.kind === "select_card" ? secondRemove.chosen.action.index : -1, 1);

  const shopState = normalizeGameState({
    state_type: "shop",
    shop: {
      items: [
        { index: 0, category: "card", price: 49, is_stocked: false, can_afford: false },
        { index: 1, category: "relic", price: 192, is_stocked: true, can_afford: false, relic_name: "Blood Vial" },
        { index: 2, category: "potion", price: 50, is_stocked: true, can_afford: true, potion_name: "Block Potion" }
      ],
      can_proceed: false
    },
    run: { act: 1, floor: 9, ascension: 1 },
    player: {
      character: "The Ironclad",
      hp: 65,
      max_hp: 80,
      block: 0,
      energy: 0,
      max_energy: 3,
      hand: [],
      relics: [],
      potions: [],
      status: [],
      gold: 50
    }
  });
  const shopCandidates = generateCandidates(shopState);
  assert.deepEqual(
    shopCandidates.map((candidate) => candidate.action),
    [{ kind: "shop_purchase", index: 2 }, { kind: "proceed" }]
  );
  assert.equal(shopCandidates[0]?.requiresLlm, true);
  const shopAfterPurchaseState = normalizeGameState({
    ...shopState.raw,
    player: {
      ...(shopState.raw.player as object),
      gold: 0
    }
  });
  const shopPurchaseCheckpoint = buildExecutionCheckpoint({
    before: shopState,
    after: shopAfterPurchaseState,
    action: { kind: "shop_purchase", index: 2 },
    settled: true,
    polls: 1
  });
  assert.equal(shopPurchaseCheckpoint.kind, "hard");
  assert.ok(shopPurchaseCheckpoint.reasons.includes("screen_or_menu_flow_progressed"));
  assert.ok(shopPurchaseCheckpoint.reasons.includes("player_gold_changed"));

  const openingTreasureState = normalizeGameState({
    state_type: "treasure",
    treasure: { message: "Opening chest...", can_proceed: false },
    run: { act: 1, floor: 10, ascension: 1 },
    player: { character: "The Ironclad", hp: 65, max_hp: 80, block: 0, energy: 0, max_energy: 3, hand: [] }
  });
  assert.deepEqual(generateCandidates(openingTreasureState), []);

  const treasureRelicState = normalizeGameState({
    ...openingTreasureState.raw,
    treasure: {
      relics: [{ index: 0, id: "LANTERN", name: "Lantern" }],
      can_proceed: false
    }
  });
  assert.deepEqual(generateCandidates(treasureRelicState)[0]?.action, {
    kind: "claim_treasure_relic",
    index: 0,
    relicName: "Lantern"
  });
  assert.deepEqual(toRestBody({ kind: "claim_treasure_relic", index: 0, relicName: "Lantern" }), {
    action: "claim_treasure_relic",
    index: 0
  });

  const treasureProceedState = normalizeGameState({
    ...openingTreasureState.raw,
    treasure: { can_proceed: true }
  });
  assert.deepEqual(generateCandidates(treasureProceedState)[0]?.action, { kind: "proceed" });

  const treasureRelicAndProceedState = normalizeGameState({
    ...openingTreasureState.raw,
    treasure: {
      relics: [{ index: 0, id: "JUZU_BRACELET", name: "Juzu Bracelet" }],
      can_proceed: true
    }
  });
  assert.deepEqual(
    generateCandidates(treasureRelicAndProceedState).map((candidate) => candidate.action.kind),
    ["claim_treasure_relic", "proceed"]
  );

  const softAfterStrikeState = normalizeGameState({
    ...highPressureState.raw,
    battle: {
      ...(highPressureState.raw.battle as object),
      enemies: [
        {
          entity_id: "CORPSE_SLUG_0",
          name: "Corpse Slug",
          hp: 21,
          max_hp: 27,
          block: 0,
          intents: [{ type: "Attack", label: "14" }]
        }
      ]
    },
    player: {
      ...(highPressureState.raw.player as object),
      energy: 1,
      hand: [
        {
          id: "LEAP",
          name: "Leap",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 9 Block.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ]
    }
  });
  const softCheckpoint = buildExecutionCheckpoint({
    before: highPressureState,
    after: softAfterStrikeState,
    action: { kind: "play_card", cardIndex: 0, cardName: "Strike", target: "CORPSE_SLUG_0" },
    settled: true,
    polls: 1
  });
  assert.equal(softCheckpoint.kind, "soft");
  assert.ok(softCheckpoint.reasons.includes("expected_card_removed_from_hand"));

  const generatedCardState = normalizeGameState({
    ...highPressureState.raw,
    player: {
      ...(highPressureState.raw.player as object),
      energy: 1,
      hand: [
        ...(highPressureState.player.hand.map((card) => card.raw)),
        {
          id: "WOUND",
          name: "Wound",
          index: 3,
          type: "Status",
          cost: null,
          description: "Unplayable.",
          can_play: false
        }
      ]
    }
  });
  const generatedCheckpoint = buildExecutionCheckpoint({
    before: highPressureState,
    after: generatedCardState,
    action: { kind: "play_card", cardIndex: 0, cardName: "Strike", target: "CORPSE_SLUG_0" },
    settled: true,
    polls: 1
  });
  assert.equal(generatedCheckpoint.kind, "hard");
  assert.ok(generatedCheckpoint.reasons.includes("hand_grew_or_generated_card"));

  const enemyDeadState = normalizeGameState({
    ...highPressureState.raw,
    battle: {
      ...(highPressureState.raw.battle as object),
      enemies: [
        {
          entity_id: "CORPSE_SLUG_0",
          name: "Corpse Slug",
          hp: 0,
          max_hp: 27,
          block: 0,
          intents: [{ type: "Attack", label: "14" }]
        }
      ]
    },
    player: {
      ...(highPressureState.raw.player as object),
      energy: 1,
      hand: highPressureState.player.hand.slice(1).map((card, index) => ({ ...card.raw, index }))
    }
  });
  const enemyDeadCheckpoint = buildExecutionCheckpoint({
    before: highPressureState,
    after: enemyDeadState,
    action: { kind: "play_card", cardIndex: 0, cardName: "Strike", target: "CORPSE_SLUG_0" },
    settled: true,
    polls: 1
  });
  assert.equal(enemyDeadCheckpoint.kind, "hard");
  assert.ok(enemyDeadCheckpoint.reasons.includes("enemy_removed_or_dead"));

  const obviousLethalCheckpointState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 4,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "CALCIFIED_CULTIST_0",
          name: "Calcified Cultist",
          hp: 3,
          max_hp: 39,
          block: 0,
          intents: [{ type: "Attack", label: "13" }],
          status: [{ id: "VULNERABLE_POWER", name: "Vulnerable", amount: 2, type: "Debuff" }]
        },
        {
          entity_id: "DAMP_CULTIST_0",
          name: "Damp Cultist",
          hp: 22,
          max_hp: 53,
          block: 0,
          intents: [{ type: "Attack", label: "11" }],
          status: [{ id: "STRENGTH_POWER", name: "Strength", amount: 10, type: "Buff" }]
        }
      ]
    },
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 26,
      max_hp: 75,
      block: 0,
      energy: 1,
      max_energy: 3,
      hand: [
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "ZAP",
          name: "Zap",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Channel 1 Lightning.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 2,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 4,
      discard_pile_count: 8,
      exhaust_pile_count: 0,
      gold: 20
    }
  });
  const obviousLethalScoring = scoreCandidates(
    obviousLethalCheckpointState,
    generateCandidates(obviousLethalCheckpointState),
    memory.run,
    memory.strategy
  );
  assert.equal(obviousLethalScoring.shouldAskLlm, false);
  assert.equal(obviousLethalScoring.top?.action.kind, "play_card");
  assert.equal(obviousLethalScoring.top?.action.kind === "play_card" ? obviousLethalScoring.top.action.target : "", "CALCIFIED_CULTIST_0");

  const twoCardLethalState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 6,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "DAMP_CULTIST_0",
          name: "Damp Cultist",
          hp: 10,
          max_hp: 53,
          block: 0,
          intents: [{ type: "Attack", label: "21" }],
          status: [{ id: "STRENGTH_POWER", name: "Strength", amount: 20, type: "Buff" }]
        }
      ]
    },
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 20,
      max_hp: 75,
      block: 0,
      energy: 3,
      max_energy: 3,
      hand: [
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 1,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 2,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "LEAP",
          name: "Leap",
          index: 3,
          type: "Skill",
          cost: "1",
          description: "Gain 9 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 0,
      discard_pile_count: 12,
      exhaust_pile_count: 0,
      gold: 20
    }
  });
  const twoCardLethalScoring = scoreCandidates(
    twoCardLethalState,
    generateCandidates(twoCardLethalState),
    memory.run,
    memory.strategy
  );
  assert.equal(twoCardLethalScoring.shouldAskLlm, false);
  assert.equal(twoCardLethalScoring.top?.action.kind, "play_card");
  assert.equal(twoCardLethalScoring.top?.action.kind === "play_card" ? twoCardLethalScoring.top.action.cardName : "", "Strike");

  const statusCleanupState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 3,
      turn: "player",
      is_play_phase: true,
      enemies: [{ entity_id: "SLAVER_0", name: "Slaver", hp: 30, max_hp: 30, block: 0, intents: [{ type: "Buff" }] }]
    },
    run: { act: 1, floor: 5, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 40,
      max_hp: 75,
      block: 0,
      energy: 2,
      max_energy: 3,
      hand: [
        { id: "WOUND", name: "Wound", index: 0, type: "Status", cost: null, description: "Unplayable.", can_play: false },
        {
          id: "COMPACT",
          name: "Compact",
          index: 1,
          type: "Skill",
          cost: "0",
          description: "Transform all Status cards in your hand into Fuel.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 2,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 99
    }
  });
  const cleanupScoring = scoreCandidates(statusCleanupState, generateCandidates(statusCleanupState), memory.run, memory.strategy);
  assert.equal(cleanupScoring.top?.action.kind, "play_card");
  assert.equal(cleanupScoring.top?.action.kind === "play_card" ? cleanupScoring.top.action.cardName : "", "Compact");

  const statusCreationState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [{ entity_id: "LOUSE_0", name: "Louse", hp: 30, max_hp: 30, block: 0, intents: [{ type: "Buff" }] }]
    },
    run: { act: 1, floor: 2, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 70,
      max_hp: 75,
      block: 0,
      energy: 3,
      max_energy: 3,
      hand: [
        {
          id: "FIGHT_THROUGH",
          name: "Fight Through",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 10 Block. Add 1 Wound to your hand.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 1,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 99
    }
  });
  const creationScoring = scoreCandidates(statusCreationState, generateCandidates(statusCreationState), memory.run, memory.strategy);
  assert.equal(creationScoring.top?.action.kind, "play_card");
  assert.equal(creationScoring.top?.action.kind === "play_card" ? creationScoring.top.action.cardName : "", "Strike");

  const enemyStatusState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 2,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "SCALER_0",
          name: "Scaling Enemy",
          hp: 30,
          max_hp: 30,
          block: 0,
          intents: [{ type: "Buff" }],
          status: [{ name: "Ritual", amount: 3 }]
        },
        {
          entity_id: "NORMAL_0",
          name: "Normal Enemy",
          hp: 30,
          max_hp: 30,
          block: 0,
          intents: [{ type: "Buff" }],
          status: []
        }
      ]
    },
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 60,
      max_hp: 75,
      block: 0,
      energy: 3,
      max_energy: 3,
      hand: [
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 0,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 99
    }
  });
  const enemyStatusScoring = scoreCandidates(enemyStatusState, generateCandidates(enemyStatusState), memory.run, memory.strategy);
  assert.equal(enemyStatusScoring.top?.action.kind, "play_card");
  assert.equal(enemyStatusScoring.top?.action.kind === "play_card" ? enemyStatusScoring.top.action.target : "", "SCALER_0");

  const disabledController = new AgentController(new ActionsDisabledClient(combatState()), memory, new NoopLlmDecider());
  const disabledResult = await disabledController.tick();
  assert.equal(disabledResult.chosenBy, "none");
  assert.equal(disabledResult.executed, false);
  assert.match(disabledResult.message, /Player actions are currently disabled/);

  const restChoiceController = new AgentController(
    new FakeClient(restChoiceState(), restPostChoiceState()),
    memory,
    new NoopLlmDecider()
  );
  const restChoiceResult = await restChoiceController.tick();
  assert.deepEqual(restChoiceResult.chosen?.action, { kind: "choose_rest_option", index: 0 });
  const restBackoffResult = await restChoiceController.tick();
  assert.equal(restBackoffResult.executed, false);
  assert.equal(restBackoffResult.message, "Waiting for previous action settlement");

  const runsRoot = path.join(smokeMemoryDir, "runs");
  const client = new FakeClient(combatState(), combatPostStrikeState());
  const controller = new AgentController(client, memory, new NoopLlmDecider(), new AgentDecisionRecorder({ runsRoot }));
  const result = await controller.tick();
  assert.ok(client.executed.length > 0);
  const runDir = path.join(runsRoot, memory.run.runId);
  const transitionsPath = path.join(runDir, "transitions.jsonl");
  assert.ok(existsSync(path.join(runDir, "metadata.json")));
  assert.ok(existsSync(path.join(runDir, "events.jsonl")));
  assert.ok(existsSync(path.join(runDir, "proposals.jsonl")));
  assert.ok(existsSync(path.join(runDir, "replay.json")));
  assert.ok(existsSync(path.join(runDir, "snapshots")));
  assert.ok(existsSync(transitionsPath));
  const transitionLines = readFileSync(transitionsPath, "utf8").trim().split(/\r?\n/).filter(Boolean);
  assert.equal(transitionLines.length, 1);
  const parsedTransition = JSON.parse(transitionLines[0]);
  assert.equal(parsedTransition.source, "agent");
  assert.equal(parsedTransition.captureMode, "executor_logged");
  assert.equal(parsedTransition.isGroundTruth, true);
  assert.deepEqual(parsedTransition.selectedAction, client.executed[0]);
  assert.equal(parsedTransition.hp, 80);
  assert.equal(parsedTransition.gold, 99);
  assert.equal(parsedTransition.rawStatePath, parsedTransition.preStateRef);
  assert.ok(typeof parsedTransition.postStateRef === "string");
  assert.ok(Array.isArray(parsedTransition.legalActions));
  assert.ok(parsedTransition.legalActions.length > 0);
  assert.ok(parsedTransition.compactState);
  assert.ok(parsedTransition.memorySnapshot);
  assert.ok(parsedTransition.derivedSnapshot);
  assert.ok(parsedTransition.strategicImpression);
  assert.ok(Array.isArray(parsedTransition.salienceSignals));
  assert.ok(parsedTransition.salienceSignals.length > 0);
  assert.ok(parsedTransition.memoryActivation);
  assert.ok(Array.isArray(parsedTransition.candidateFutures));
  assert.ok(parsedTransition.candidateFutures.length > 0);
  assert.ok(parsedTransition.candidateFutures.some((future: { predictionChecks?: unknown[] }) => Array.isArray(future.predictionChecks) && future.predictionChecks.length > 0));
  assert.ok(parsedTransition.deliberationPacket);
  assert.ok(parsedTransition.deliberationPacket.promptParity);
  assert.ok(parsedTransition.promptParity);
  assert.ok(parsedTransition.workspaceComparison);
  assert.equal(parsedTransition.workspaceComparison.phase, "P8");
  assert.equal(parsedTransition.workspaceComparison.enabled, false);
  assert.ok(parsedTransition.workspaceComparison.structuredPromptHash);
  assert.ok(parsedTransition.shadowWorkspaceDecision);
  assert.equal(parsedTransition.shadowWorkspaceDecision.outcome, "not_enabled");
  assert.equal(parsedTransition.shadowWorkspaceDecision.called, false);
  assert.ok(!parsedTransition.promptParity.missingSections.includes("derived_knowledge"));
  assert.ok(parsedTransition.deliberationPacket.derivedKnowledgeSummary.present);
  assert.ok(parsedTransition.selectedPlan);
  assert.ok(parsedTransition.predictionError);
  assert.equal(parsedTransition.predictionError.schemaVersion, DOMAIN_SCHEMA_VERSION);
  assert.ok(parsedTransition.predictionError.evidence[0].attribution);
  assert.ok(Array.isArray(parsedTransition.predictionError.evidence[0].typedChecks));
  assert.ok(parsedTransition.predictionError.evidence[0].typedChecks.length > 0);
  assert.ok(Array.isArray(parsedTransition.predictionError.attributionBuckets));
  assert.ok(parsedTransition.predictionError.attributionBuckets.length > 0);
  assert.ok(parsedTransition.replayFrame);
  assert.equal(parsedTransition.replayFrame.transitionId, parsedTransition.transitionId);
  if (parsedTransition.consolidation) {
    assert.equal(parsedTransition.consolidation.status, "proposed");
    assert.equal(parsedTransition.consolidation.sourceFrameId, parsedTransition.replayFrame.frameId);
  }
  assert.equal(parsedTransition.executionResult.status, "ok");
  assert.ok(parsedTransition.stateDiff.checkpoint);
  assert.equal(readTransitionJsonl(transitionsPath).length, 1);
  const replayRun = readReplayRun(runDir);
  assert.equal(replayRun.transitions.length, 1);
  const replayCoverage = buildReplayCognitiveCoverage(replayRun.transitions);
  assert.equal(replayCoverage.fullShadowScaffold, 1);
  assert.equal(replayCoverage.candidateFuturePredictionChecks, 1);
  assert.equal(replayCoverage.workspaceComparison, 1);
  assert.equal(replayCoverage.workspaceProviderReady, 0);
  assert.equal(replayCoverage.shadowWorkspaceDecision, 1);
  assert.equal(replayCoverage.shadowWorkspaceCalled, 0);
  assert.equal(replayCoverage.shadowWorkspaceSkipped, 0);
  assert.equal(replayCoverage.replayFrame, 1);
  const proposalSurface = buildReplayConsolidationProposalSurface(readConsolidationProposals(runDir, replayRun.transitions));
  assert.equal(proposalSurface.proposals, 0);
  assert.equal(proposalSurface.mutatingOrAccepted, 0);
  const timeline = buildReplayTimeline(replayRun.transitions);
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0]?.captureMode, "executor_logged");
  const evalReport = evaluateRun(runDir);
  assert.ok(["PASS", "WARN"].includes(evalReport.status));
  assert.equal(evalReport.errors.length, 0);
  assert.equal(evalReport.summary.transitions, 1);
  assert.equal(evalReport.summary.parsedEvents, 0);
  assert.equal(evalReport.summary.matchedSelectedActions, 1);
  assert.equal(evalReport.summary.cognitiveCoverage.fullShadowScaffold, 1);
  assert.equal(evalReport.summary.cognitiveCoverage.candidateFuturePredictionChecks, 1);
  assert.equal(evalReport.summary.deliberationCoverage.packetPresent, 1);
  assert.equal(evalReport.summary.promptParityCoverage.promptParity, 1);
  assert.equal(evalReport.summary.workspaceCoverage.comparison, 1);
  assert.equal(evalReport.summary.workspaceCoverage.structuredPromptAvailable, 1);
  assert.equal(evalReport.summary.workspaceCoverage.shadowDecision, 1);
  assert.equal(evalReport.summary.workspaceCoverage.enabled, 0);
  assert.equal(evalReport.summary.workspaceCoverage.shadowCalled, 0);
  assert.equal(evalReport.summary.workspaceCoverage.skipped, 0);
  assert.equal(evalReport.summary.workspaceCoverage.unavailable, 0);
  assert.equal(evalReport.summary.workspaceCoverage.averageInformationPreservationScore, 1);
  assert.equal(evalReport.summary.workspaceCoverage.providerReadinessCounts.needs_api_key, 1);
  assert.equal(evalReport.summary.workspaceCoverage.agreementCounts.not_applicable, 1);
  assert.ok((evalReport.summary.workspaceCoverage.budgetStatusCounts.within_budget ?? 0) >= 0);
  assert.equal(evalReport.summary.workspaceCoverage.rolloutGate.status, "no_go");
  assert.ok(evalReport.summary.workspaceCoverage.rolloutGate.reasons.includes("no_real_shadow_calls"));
  assert.equal(evalReport.summary.p8LiveReadinessAssessment.status, "NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE");
  assert.equal(evalReport.summary.p8LiveReadinessAssessment.staticPreAuditAllowed, true);
  assert.ok(evalReport.summary.p8LiveReadinessAssessment.blockedDecisionClasses.includes("combat:llm_required"));
  assert.equal(evalReport.summary.p8LiveReadinessAssessment.evidenceBudget.status, "evidence_window_not_usable");
  assert.ok(
    Array.isArray(evalReport.summary.p8LiveReadinessAssessment.evidenceBudget.notes) &&
      evalReport.summary.p8LiveReadinessAssessment.evidenceBudget.notes.includes("insufficient_live_eligible_shadow_calls")
  );
  assert.equal(evalReport.summary.p8LiveReadinessAssessment.rolloutBudget.explicitLiveFlagRequired, true);
  assert.equal(evalReport.summary.p8LiveReadinessAssessment.rolloutBudget.humanAuthorizationRequired, true);
  assert.equal(evalReport.summary.p8LiveReadinessAssessment.rolloutBudget.structuredPromptOnlyDefaultAllowed, false);
  assert.equal(evalReport.summary.p8LiveReadinessAssessment.rolloutBudget.stableMemoryWritesAllowed, false);
  assert.equal(evalReport.summary.budgetGovernance.accountingNotAuthorization, true);
  assert.equal(evalReport.summary.budgetGovernance.p9BudgetPolicyProposalOnly, true);
  assert.equal(evalReport.summary.budgetGovernance.runtimeBudgetOsDeferredTo, "P13");
  assert.ok((evalReport.summary.budgetGovernance.callBudgetStatusCounts.within_budget ?? 0) >= 0);
  const [firstWorkspaceDecisionClassQuality] = Object.values(evalReport.summary.workspaceDecisionClassQuality);
  assert.equal(firstWorkspaceDecisionClassQuality?.transitions, 1);
  assert.ok((firstWorkspaceDecisionClassQuality?.futureCount ?? 0) > 0);

  const mixedCombatEvidenceSlice = buildReplayShadowSliceStats("sinceLatestRevision", []);
  mixedCombatEvidenceSlice.liveEligibleCalled = 3;
  mixedCombatEvidenceSlice.mixedRevisionWindow = false;
  mixedCombatEvidenceSlice.mixedBudgetWindow = true;
  const combatOnlyReady = makeWorkspaceDecisionClassQualityStats({
    liveEligibleCalled: 3,
    completenessRecordedTransitions: 3,
    liveEligibleCalledCompletenessRecordedTransitions: 3,
    futureCount: 6,
    liveEligibleCalledFutureCount: 6,
    completeEnough: 6,
    liveEligibleCalledCompleteEnough: 6,
    reasonQualityCounts: { adequate: 3 }
  });
  const mixedCombatAssessment = assessP8LiveReadiness(mixedCombatEvidenceSlice, {
    "combat:llm_required": combatOnlyReady
  });
  assert.equal(mixedCombatAssessment.status, "NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE");
  assert.deepEqual(mixedCombatAssessment.recommendedFirstLiveWhitelist, ["combat:llm_required"]);
  assert.ok(mixedCombatAssessment.reasons.includes("combat_window_meets_current_live_gate"));
  assert.ok(mixedCombatAssessment.reasons.includes("promotion_window_not_usable"));
  assert.ok(mixedCombatAssessment.blockedDecisionClasses.includes("map:llm_required"));

  const cleanCombatEvidenceSlice = buildReplayShadowSliceStats("sinceLatestRevision", []);
  cleanCombatEvidenceSlice.liveEligibleCalled = 3;
  cleanCombatEvidenceSlice.mixedRevisionWindow = false;
  cleanCombatEvidenceSlice.mixedBudgetWindow = false;
  const cleanCombatAssessment = assessP8LiveReadiness(cleanCombatEvidenceSlice, {
    "combat:llm_required": combatOnlyReady
  });
  assert.equal(cleanCombatAssessment.status, "READY_FOR_P8_5_LIVE_COMBAT_ONLY");
  assert.deepEqual(cleanCombatAssessment.recommendedFirstLiveWhitelist, ["combat:llm_required"]);
  assert.ok(cleanCombatAssessment.blockedDecisionClasses.includes("card_reward:llm_required"));
  assert.ok(cleanCombatAssessment.blockedDecisionClasses.includes("map:llm_required"));

  const liveAppliedSummary = buildLiveAppliedRolloutSummary([
    {
      decisionAudit: { chosenBy: "llm", raw: { llm: { liveAdditiveApplied: true, liveAdditiveDecisionClass: "combat:llm_required", providerSource: "deepseek-live-command", outcome: "selected", promptMode: "additive_legacy_prompt_plus_compact_workspace_summary" } } }
    },
    {
      decisionAudit: { chosenBy: "fallback", raw: { llm: { liveAdditiveApplied: true, liveAdditiveDecisionClass: "card_reward:llm_required", providerSource: "deepseek-live-command", outcome: "invalid_output", error: "missing candidate" } } }
    }
  ] as any);
  assert.equal(liveAppliedSummary.liveAdditiveApplied, 2);
  assert.equal(liveAppliedSummary.chosenByLlm, 1);
  assert.equal(liveAppliedSummary.invalidOutput, 1);
  assert.equal(liveAppliedSummary.missingCandidateSignals, 1);
  const evidenceSliceSummary = buildEvidenceSliceSummary([
    {
      source: "agent",
      captureMode: "executor_logged",
      workspaceComparison: { decisionClass: "combat:llm_required", revisionTag: "rev-a", budget: { maxShadowCalls: 4, governanceProfile: "shadow_readiness" } },
      shadowWorkspaceDecision: { called: true, revisionTag: "rev-a", providerSource: "deepseek-shadow" },
      decisionAudit: { chosenBy: "llm", raw: { llm: { liveAdditiveApplied: true, liveAdditiveDecisionClass: "combat:llm_required", providerSource: "deepseek-live-command" } } }
    },
    {
      source: "agent",
      captureMode: "executor_logged",
      workspaceComparison: { decisionClass: "combat:llm_required", revisionTag: "rev-b", budget: { maxShadowCalls: 8, governanceProfile: "shadow_readiness" } },
      shadowWorkspaceDecision: { called: true, revisionTag: "rev-b", providerSource: "deepseek-shadow" },
      decisionAudit: { provenance: "console_fixture", raw: { llm: { liveAdditiveApplied: false } } }
    }
  ] as any);
  assert.equal(evidenceSliceSummary.mixedRevisionWindow, true);
  assert.equal(evidenceSliceSummary.mixedBudgetWindow, true);
  assert.equal(evidenceSliceSummary.consoleDebugOrFixtureTransitions, 1);
  assert.equal(evidenceSliceSummary.promotionEvidence.eligibleTransitions, 1);
  assert.equal(evidenceSliceSummary.promotionEvidence.excludedTransitions, 1);
  assert.equal(evidenceSliceSummary.promotionEvidence.exclusionReasonCounts.console_debug_or_fixture, 1);
  const promotionSlice = evidenceSliceSummary.slices.find((slice) => slice.kind === "stable_learning_promotion");
  assert.equal(promotionSlice?.promotionUseAllowed, false);
  assert.equal(promotionSlice?.transitions, 1);
  assert.ok(promotionSlice?.reasons.includes("p9_promotion_not_implemented"));
  assert.ok(promotionSlice?.reasons.includes("mixed_revision_window"));
  assert.ok(promotionSlice?.reasons.includes("mixed_budget_window"));
  assert.ok(promotionSlice?.reasons.includes("console_debug_or_fixture_present"));
  assert.ok(promotionSlice?.reasons.includes("promotion_evidence_exclusions_present"));
  assert.match(formatEvidenceSliceSummary(evidenceSliceSummary), /promotionAllowed=false/);
  assert.match(formatEvidenceSliceSummary(evidenceSliceSummary), /promotionEligible=1/);
  assert.match(formatEvidenceSliceSummary(evidenceSliceSummary), /promotionExcluded=1/);

  const focusedFreshSlices = buildReplayFocusedShadowSlices([
    {
      transitionId: "transition-local-tail",
      tick: 1,
      workspaceComparison: { decisionClass: "combat:local_fast_combat", budget: { maxShadowCalls: 4 } },
      shadowWorkspaceDecision: { called: false, liveEligibleClass: false, revisionTag: "rev-a", outcome: "not_needed" }
    },
    {
      transitionId: "transition-combat-a",
      tick: 2,
      workspaceComparison: { decisionClass: "combat:llm_required", budget: { maxShadowCalls: 4 } },
      shadowWorkspaceDecision: {
        called: true,
        liveEligibleClass: true,
        revisionTag: "rev-a",
        outcome: "valid",
        reasonQuality: "adequate",
        failureBucket: "none",
        providerFinishReason: "stop"
      }
    },
    {
      transitionId: "transition-combat-b",
      tick: 3,
      workspaceComparison: { decisionClass: "combat:llm_required", budget: { maxShadowCalls: 4 } },
      shadowWorkspaceDecision: {
        called: true,
        liveEligibleClass: true,
        revisionTag: "rev-a",
        outcome: "valid",
        reasonQuality: "adequate",
        failureBucket: "none",
        providerFinishReason: "stop"
      }
    },
    {
      transitionId: "transition-combat-live-applied",
      tick: 4,
      workspaceComparison: { decisionClass: "combat:llm_required", budget: { maxShadowCalls: 4 } },
      decisionAudit: { raw: { llm: { liveAdditiveApplied: true } } },
      llmDecision: {
        reason: "Block most incoming now, but delay lethal setup and add draw risk."
      },
      shadowWorkspaceDecision: {
        called: true,
        liveEligibleClass: true,
        revisionTag: "rev-a",
        outcome: "valid",
        reasonQuality: "thin",
        reasonQualityNotes: ["missing_tradeoff"],
        failureBucket: "none",
        providerFinishReason: "stop"
      }
    },
    {
      transitionId: "transition-forced-tail",
      tick: 5,
      workspaceComparison: { decisionClass: "combat:forced_local", budget: { maxShadowCalls: 4 } },
      shadowWorkspaceDecision: { called: false, liveEligibleClass: false, revisionTag: "rev-a", outcome: "not_needed" }
    }
  ] as unknown as TransitionRecord[]);
  assert.deepEqual(
    focusedFreshSlices.combatLiveEligibleFresh.transitionIds,
    ["transition-combat-a", "transition-combat-b", "transition-combat-live-applied"]
  );
  assert.equal(focusedFreshSlices.combatLiveEligibleFresh.stats.called, 3);
  assert.equal(focusedFreshSlices.combatLiveEligibleFresh.stats.liveEligibleCalled, 3);
  assert.equal(focusedFreshSlices.combatLiveEligibleFresh.stats.valid, 3);
  assert.equal(focusedFreshSlices.combatLiveEligibleFresh.stats.reasonQualityCounts.adequate, 3);
  assert.equal(focusedFreshSlices.combatLiveEligibleFresh.stats.reasonQualityNoteCounts.missing_tradeoff ?? 0, 0);

  assert.equal(evalReport.summary.predictionErrorCoverage.predictionError, 1);
  assert.equal(evalReport.summary.predictionErrorCoverage.withTypedChecks, 1);
  assert.equal(evalReport.summary.predictionErrorCoverage.withAttribution, 1);
  assert.equal(evalReport.summary.consolidationProposalSurface.proposals, 0);
  assert.equal(evalReport.summary.learningProposalSurface.proposals, 0);
  assert.equal(evalReport.summary.learningProposalSurface.stableOrApplied, 0);
  assert.equal(evalReport.summary.learningProposalSurface.applyPathEnabled, false);
  assert.equal(evalReport.summary.learningProposalReviewDecisionSurface.decisions, 0);
  assert.equal(evalReport.summary.learningProposalReviewDecisionSurface.applyPathEnabled, false);
  assert.equal(evalReport.summary.learningProposalReviewDecisionSurface.stablePromotionEnabled, false);
  assert.equal(evalReport.summary.reverseScaffoldFeedbackSurface.feedback, 0);
  assert.equal(evalReport.summary.reverseScaffoldFeedbackSurface.affectsLiveBehavior, false);
  assert.ok(evalReport.warningSummary);
  assert.equal(evalReport.strategyMetrics.fallbackRate, 0);
  assert.deepEqual(evalReport.errors, []);

  const mechanicsEvalDir = path.join(smokeMemoryDir, "mechanics-eval");
  const mechanicsSnapshotsDir = path.join(mechanicsEvalDir, "snapshots");
  mkdirSync(mechanicsSnapshotsDir, { recursive: true });
  writeFileSync(path.join(mechanicsEvalDir, "metadata.json"), JSON.stringify({ runId: "run-mechanics-eval" }));
  writeFileSync(path.join(mechanicsEvalDir, "events.jsonl"), "");
  const mechanicsRawPath = path.join(mechanicsSnapshotsDir, "combat.raw.json");
  writeFileSync(mechanicsRawPath, JSON.stringify(highPressureState.raw));
  const mechanicsTransition = {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    runId: "run-mechanics-eval",
    transitionId: "transition-mechanics-card-flow",
    tick: 1,
    source: "agent",
    captureMode: "executor_logged",
    isGroundTruth: true,
    timestamp: new Date(0).toISOString(),
    screen: "combat",
    floor: 9,
    hp: 42,
    gold: 99,
    preStateRef: mechanicsRawPath,
    postStateRef: mechanicsRawPath,
    rawStatePath: mechanicsRawPath,
    rawRefs: [mechanicsRawPath],
    compactPreState: { screen: "combat" },
    compactPostState: { screen: "combat" },
    compactState: { screen: "combat" },
    legalActions: generateCandidates(highPressureState),
    selectedAction: { kind: "play_card", cardIndex: 0, cardName: "Strike", target: "CORPSE_SLUG_0" },
    executionResult: { status: "ok" },
    stateDiff: {
      checkpoint: {
        kind: "hard",
        settled: true,
        reasons: [
          "expected_card_removed_from_hand",
          "player_energy_changed",
          "orb_state_changed",
          "hand_changed_beyond_expected_card_removal",
          "draw_pile_count_changed",
          "discard_pile_count_changed",
          "state_hash_changed"
        ],
        preStateHash: "combat-before",
        postStateHash: "combat-after"
      }
    },
    decisionAudit: { chosenBy: "local", confidence: 0.5 },
    derivedSnapshot: {},
    memorySnapshot: {},
    predictionError: {
      schemaVersion: DOMAIN_SCHEMA_VERSION,
      predicted: "card Strike leaves hand if accepted",
      actual: "hard: expected_card_removed_from_hand, hand_changed_beyond_expected_card_removal",
      errorType: "prediction_supported",
      attributedLayer: "checkpoint",
      severity: "info",
      evidence: [],
      attributionBuckets: [
        {
          bucket: "card_flow",
          status: "supported",
          predictionTypes: ["card_removed_from_hand", "card_flow_delta"],
          expected: {},
          actual: {},
          evidenceReasons: ["expected_card_removed_from_hand", "hand_changed_beyond_expected_card_removal"],
          severity: "info"
        }
      ],
      status: "accepted"
    }
  };
  writeFileSync(path.join(mechanicsEvalDir, "transitions.jsonl"), `${JSON.stringify(mechanicsTransition)}\n`);
  const mechanicsEval = evaluateRun(mechanicsEvalDir);
  assert.equal(mechanicsEval.errors.length, 0);
  assert.equal(mechanicsEval.warnings.some((warning) => warning.category === "needs_fixture_bug_candidate"), false);

  const historicalEvalDir = path.join(smokeMemoryDir, "historical-eval");
  const historicalSnapshotsDir = path.join(historicalEvalDir, "snapshots");
  mkdirSync(historicalSnapshotsDir, { recursive: true });
  writeFileSync(path.join(historicalEvalDir, "metadata.json"), JSON.stringify({ runId: "run-mr0rfdcb-yewhg8" }));
  writeFileSync(path.join(historicalSnapshotsDir, "card-select.raw.json"), JSON.stringify(multiRemoveState.raw));
  const historicalTransitionBase = {
    schemaVersion: "1.0",
    runId: "run-mr0rfdcb-yewhg8",
    source: "agent",
    captureMode: "executor_logged",
    isGroundTruth: true,
    timestamp: new Date(0).toISOString(),
    screen: "card_select",
    floor: 18,
    hp: 60,
    gold: 200,
    preStateRef: path.join(historicalSnapshotsDir, "card-select.raw.json"),
    postStateRef: path.join(historicalSnapshotsDir, "card-select.raw.json"),
    rawStatePath: path.join(historicalSnapshotsDir, "card-select.raw.json"),
    rawRefs: [path.join(historicalSnapshotsDir, "card-select.raw.json")],
    compactPreState: { screen: "card_select" },
    compactPostState: { screen: "card_select" },
    compactState: { screen: "card_select" },
    legalActions: generateCandidates(multiRemoveState),
    selectedAction: { kind: "select_card", index: 0, cardName: "Strike" },
    executionResult: { status: "ok" },
    stateDiff: {
      checkpoint: {
        kind: "unknown",
        settled: false,
        reasons: ["settlement_timeout_or_no_visible_change"],
        preStateHash: "same-card-select",
        postStateHash: "same-card-select"
      }
    },
    decisionAudit: { chosenBy: "fallback", confidence: 0.45 },
    derivedSnapshot: {},
    memorySnapshot: {}
  };
  writeFileSync(
    path.join(historicalEvalDir, "transitions.jsonl"),
    [
      JSON.stringify({ ...historicalTransitionBase, transitionId: "transition-historical-1", tick: 708 }),
      JSON.stringify({ ...historicalTransitionBase, transitionId: "transition-historical-2", tick: 713 })
    ].join("\n")
  );
  const historicalEvalReport = evaluateRun(historicalEvalDir);
  assert.equal(historicalEvalReport.status, "WARN");
  assert.equal(historicalEvalReport.errors.length, 0);
  assert.equal(historicalEvalReport.summary.repeatedNoProgress, 1);
  assert.equal(historicalEvalReport.summary.cognitiveCoverage.fullShadowScaffold, 0);
  assert.equal(historicalEvalReport.summary.promptParityCoverage.promptParity, 0);
  assert.equal(historicalEvalReport.summary.predictionErrorCoverage.predictionError, 0);
  assert.ok(historicalEvalReport.warningSummary.cognitive_coverage);
  assert.equal(historicalEvalReport.warningSummary.historical_fixed_evidence?.codes.repeated_no_progress, 1);
  assert.equal(
    historicalEvalReport.warnings.find((warning) => warning.code === "repeated_no_progress")?.historical,
    true
  );

  const staleRunsRoot = path.join(smokeMemoryDir, "stale-runs");
  const staleClient = new StaleThenSettledClient(combatState(), combatStalePostStrikeState(), combatPostStrikeState());
  const staleController = new AgentController(
    staleClient,
    memory,
    new NoopLlmDecider(),
    new AgentDecisionRecorder({ runsRoot: staleRunsRoot })
  );
  const staleResult = await staleController.tick();
  assert.ok((staleResult.checkpoint?.polls ?? 0) >= 2);
  assert.match(staleResult.checkpoint?.after ?? "", /hand=\[0:Defend\]/);

  const noProgressClient = new FakeClient(combatState(), combatState());
  const noProgressController = new AgentController(noProgressClient, memory, new NoopLlmDecider());
  const firstNoProgress = await noProgressController.tick();
  assert.equal(firstNoProgress.executed, true);
  assert.equal(firstNoProgress.checkpoint?.kind, "unknown");
  assert.ok(firstNoProgress.checkpoint?.reasons.includes("settlement_timeout_or_no_visible_change"));
  (noProgressController as any).settlementBackoffUntilMs = 0;
  const secondNoProgress = await noProgressController.tick();
  assert.equal(secondNoProgress.executed, false);
  assert.equal(secondNoProgress.chosenBy, "none");
  assert.match(secondNoProgress.message, /Waiting after no-progress guard/);
  assert.equal(noProgressClient.executed.length, 1);
  console.log(JSON.stringify({ result, executed: client.executed }, null, 2));
} finally {
  rmSync(smokeMemoryDir, { recursive: true, force: true });
}

function combatStalePostStrikeState(): unknown {
  return {
    state_type: "combat",
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "JAW_WORM_0",
          name: "Jaw Worm",
          hp: 6,
          max_hp: 40,
          block: 0,
          intents: [{ type: "Attack", label: "6" }]
        }
      ]
    },
    run: {
      act: 1,
      floor: 1,
      ascension: 1
    },
    player: {
      character: "Ironclad",
      hp: 80,
      max_hp: 80,
      block: 0,
      energy: 2,
      max_energy: 3,
      hand: [
        {
          id: "STRIKE_IRONCLAD",
          name: "Strike",
          index: 0,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "DEFEND_IRONCLAD",
          name: "Defend",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 1,
      exhaust_pile_count: 0,
      gold: 99
    }
  };
}

function combatPostStrikeState(): unknown {
  return {
    state_type: "combat",
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "JAW_WORM_0",
          name: "Jaw Worm",
          hp: 6,
          max_hp: 40,
          block: 0,
          intents: [{ type: "Attack", label: "6" }]
        }
      ]
    },
    run: {
      act: 1,
      floor: 1,
      ascension: 1
    },
    player: {
      character: "Ironclad",
      hp: 80,
      max_hp: 80,
      block: 0,
      energy: 2,
      max_energy: 3,
      hand: [
        {
          id: "DEFEND_IRONCLAD",
          name: "Defend",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 1,
      exhaust_pile_count: 0,
      gold: 99
    }
  };
}

function restChoiceState(): unknown {
  return {
    state_type: "rest_site",
    rest_site: {
      options: [{ index: 0, label: "Rest", description: "Heal for 30% of your Max HP." }],
      can_proceed: false
    },
    run: { act: 1, floor: 7, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 31,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      gold: 120
    }
  };
}

function restPostChoiceState(): unknown {
  return {
    state_type: "rest_site",
    rest_site: {
      options: [],
      can_proceed: false
    },
    run: { act: 1, floor: 7, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 53,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      gold: 120
    }
  };
}

function combatState(): unknown {
  return {
    state_type: "combat",
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "JAW_WORM_0",
          name: "Jaw Worm",
          hp: 12,
          max_hp: 40,
          block: 0,
          intents: [{ type: "Attack", label: "6" }]
        }
      ]
    },
    run: {
      act: 1,
      floor: 1,
      ascension: 1
    },
    player: {
      character: "Ironclad",
      hp: 80,
      max_hp: 80,
      block: 0,
      energy: 3,
      max_energy: 3,
      hand: [
        {
          id: "STRIKE_IRONCLAD",
          name: "Strike",
          index: 0,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "DEFEND_IRONCLAD",
          name: "Defend",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 0,
      exhaust_pile_count: 0,
      gold: 99
    }
  };
}
