export type JsonRecord = Record<string, unknown>;

export const DOMAIN_SCHEMA_VERSION = 1;

export interface AdapterCapabilities {
  canReadState: boolean;
  canReadRawState: boolean;
  canReadScreen: boolean;
  canExecuteActions: boolean;
  canReadAgentActionResults: boolean | "partial";
  canListLegalActions: boolean;
  canReadEventLog: boolean;
  canReadHumanEvents: boolean;
  canProvideFactData: boolean;
  canProvideVersionedFacts: boolean;
}

export interface StateReader<TState = unknown> {
  getState(format?: "json" | "markdown"): Promise<TState | string>;
}

export interface RawStateReader<TRawState = unknown> {
  getRawState?(): Promise<TRawState>;
}

export interface ActionExecutor<TAction = GameAction, TResult = ExecutionResult> {
  execute(action: TAction): Promise<TResult>;
}

export interface GameEventReader<TEvent = GameEvent> {
  readEvents(sinceEventId?: string | number): Promise<TEvent[]>;
}

export interface CapabilityProvider {
  capabilities(): AdapterCapabilities;
}

export interface GameIO<TState = unknown, TAction = GameAction, TResult = ExecutionResult>
  extends StateReader<TState>,
    RawStateReader,
    ActionExecutor<TAction, TResult>,
    CapabilityProvider {
  readEvents?(sinceEventId?: string | number): Promise<GameEvent[]>;
}

export interface GameState {
  schemaVersion: number;
  stateId?: string;
  stateType: string;
  screen: string;
  act?: number;
  floor?: number;
  timestamp?: string;
  rawRef?: string;
  summary?: string;
  features?: JsonRecord;
}

export type CanonicalState = GameState;

export interface GameAction {
  kind: string;
  payload?: JsonRecord;
}

export interface LegalAction extends GameAction {
  id: string;
  label: string;
  screen?: string;
  requiresLlm?: boolean;
  facts?: JsonRecord;
}

export type GameEventType =
  | "CARD_PLAYED"
  | "TURN_ENDED"
  | "REWARD_SELECTED"
  | "MAP_NODE_SELECTED"
  | "SHOP_PURCHASED"
  | "POTION_USED"
  | "EVENT_CHOICE_SELECTED"
  | "REST_OPTION_SELECTED"
  | "CARD_PURGED"
  | "CARD_UPGRADED"
  | "COMBAT_STARTED"
  | "COMBAT_ENDED"
  | "SCREEN_CHANGED"
  | "UNKNOWN";

export interface GameEvent {
  schemaVersion: number;
  eventId: string | number;
  runId?: string;
  type: GameEventType | string;
  source: TransitionSource;
  timestamp: string;
  screen?: string;
  floor?: number;
  preStateRef?: string;
  postStateRef?: string;
  preStateHash?: string;
  postStateHash?: string;
  rawEvent?: JsonRecord;
}

export interface ActionEvent extends GameEvent {
  selectedAction?: GameAction;
  cardName?: string;
  cardInstanceId?: string;
  cardIndex?: number;
  targetId?: string;
  optionId?: string | number;
  energyCost?: number;
}

export type TransitionSource = "agent" | "human" | "game" | "replay";

export type CaptureMode = "executor_logged" | "mcp_event" | "diff_inferred" | "snapshot_only";

export interface RunRecord {
  schemaVersion: number;
  runId: string;
  startedAt: string;
  endedAt?: string;
  character?: string;
  result?: "win" | "loss" | "unknown";
  metadata?: JsonRecord;
}

export interface StateSnapshot {
  schemaVersion: number;
  runId: string;
  snapshotId: string;
  tick: number;
  timestamp: string;
  stateRef: string;
  stateHash?: string;
  screen: string;
  floor?: number;
  compactState: JsonRecord;
  rawStatePath?: string;
}

export interface StateDiff {
  schemaVersion: number;
  summary?: string;
  changes: JsonRecord;
}

export interface DecisionAudit {
  route?: string;
  chosenBy?: "local" | "llm" | "fallback" | "human" | "unknown";
  candidateCount?: number;
  topCandidateId?: string;
  fallbackReason?: string;
  reasons?: string[];
  raw?: JsonRecord;
}

export interface LlmDecision {
  candidateId: string;
  confidence?: number;
  reason?: string;
  memoryUpdates?: JsonRecord;
  parameterSuggestions?: JsonRecord[];
}

export interface MemorySnapshot {
  schemaVersion: number;
  runId: string;
  summary?: string;
  deficits?: JsonRecord;
  routeBias?: JsonRecord;
  riskFlags?: string[];
  ref?: string;
}

export interface DerivedSnapshot {
  schemaVersion: number;
  relevantFacts?: JsonRecord[];
  relevantRules?: JsonRecord[];
  ref?: string;
}

export type SalienceKind =
  | "danger"
  | "opportunity"
  | "uncertainty"
  | "memory_resonance"
  | "irreversible_choice"
  | "repeated_failure_pattern"
  | "resource_pressure"
  | "strategy_quality";

export interface SalienceSignal {
  kind: SalienceKind | string;
  label: string;
  severity?: "info" | "warning" | "critical";
  confidence: number;
  reason?: string;
  evidence?: JsonRecord[];
  tags?: string[];
}

export interface StrategicImpression {
  schemaVersion: number;
  summary: string;
  decisionType?: string;
  isKeyDecision?: boolean;
  danger?: string[];
  opportunity?: string[];
  uncertainty?: string[];
  resourcePressure?: string[];
  deckPressure?: string[];
  routePressure?: string[];
  memoryResonance?: string[];
  salienceSignals?: SalienceSignal[];
}

export type MemoryActivationKind = "episodic" | "semantic" | "procedural" | "salience" | "unknown";

export interface MemoryActivationItem {
  memoryId: string;
  kind: MemoryActivationKind | string;
  summary: string;
  relevance: number;
  confidence: number;
  reason?: string;
  evidenceRunIds?: string[];
  conditions?: string[];
  counterexamples?: string[];
  tags?: string[];
}

export interface MemoryActivation {
  schemaVersion: number;
  activatedAt: string;
  queryTags: string[];
  items: MemoryActivationItem[];
  omissions?: string[];
}

export interface CandidatePredictionCheck {
  type: string;
  prediction: string;
  expected?: JsonRecord;
  source?: "candidate_future" | "derived_from_text" | string;
  severity?: "info" | "warning" | "critical";
}

export interface CandidateFuture {
  id: string;
  label: string;
  plan: string;
  sourceCandidateId?: string;
  actions?: GameAction[];
  deterministicCalculations?: JsonRecord;
  predictedOutcome?: string[];
  predictionChecks?: CandidatePredictionCheck[];
  cost?: string[];
  risk?: string[];
  uncertainty?: string[];
  assumptions?: string[];
  invalidationTriggers?: string[];
  executionRequirements?: string[];
  memoryLinks?: string[];
  confidence?: number;
}

export interface DeliberationPacket {
  schemaVersion: number;
  stateSummary: string;
  screen?: string;
  stateFacts?: JsonRecord;
  enemyIntent?: JsonRecord[];
  handSummary?: JsonRecord[];
  deckSummary?: JsonRecord;
  legalActionsSummary?: JsonRecord[];
  topCandidates?: JsonRecord[];
  runMemorySummary?: JsonRecord;
  derivedKnowledgeSummary?: JsonRecord;
  strategicImpression?: StrategicImpression;
  salienceSignals?: SalienceSignal[];
  memoryActivation?: MemoryActivation;
  candidateFutures: CandidateFuture[];
  deterministicCalculations?: JsonRecord;
  tradeoffs?: string[];
  uncertainty?: string[];
  validationConstraints?: string[];
  outputSchema?: JsonRecord;
  promptParity?: PromptParityReport | JsonRecord;
}

export interface PromptParityReport {
  schemaVersion: number;
  mode: "shadow";
  livePromptUsed: boolean;
  livePromptBytes?: number;
  coveredSections: string[];
  missingSections: string[];
  coverage: number;
  notes?: string[];
}

export interface DeliberationWorkspaceCoverage {
  promptParityCoverage?: number;
  coveredSections: string[];
  missingSections: string[];
  structuredSections: string[];
  missingStructuredSections: string[];
  candidateFutureCount: number;
  requiredLegacySections?: string[];
  preservedLegacySections?: string[];
  missingLegacySections?: string[];
  informationPreservationScore?: number;
  sectionTokenEstimate?: Record<string, number>;
  compressionMode?: string;
  futuresTruncated?: number;
  futuresOmitted?: number;
  truncatedFields?: Record<string, number>;
  candidateFuturesBytesBefore?: number;
  candidateFuturesBytesAfter?: number;
  candidateFuturesTokensBefore?: number;
  candidateFuturesTokensAfter?: number;
  workspaceBytesBefore?: number;
  workspaceBytesAfter?: number;
  workspaceTokensBefore?: number;
  workspaceTokensAfter?: number;
  informationPreservationEstimate?: number;
  largestFieldSources?: Record<string, number>;
  repeatedTextBytes?: number;
  repeatedTextCount?: number;
  candidateFutureCompleteness?: CandidateFutureCompletenessSummary;
  candidateFutureReviewSignals?: Record<string, number>;
  candidateFutureProposalSignals?: Record<string, number>;
  candidateFutureCueAttribution?: JsonRecord;
}

export interface CandidateFutureCompletenessSummary {
  futureCount: number;
  withCoreTacticalFacts: number;
  withBenefit: number;
  withCost: number;
  withBenefitOrCost: number;
  withRiskOrUncertainty: number;
  withAssumptionOrInvalidation: number;
  withPredictionCheckTrace: number;
  withCoreTradeoff: number;
  completeEnough: number;
  shallowFutureCount: number;
}

export type BudgetGovernanceProfileName =
  | "observe_only"
  | "shadow_exploration"
  | "shadow_readiness"
  | "live_additive_candidate"
  | "protected_learning_preparation"
  | "stable_update_candidate";

export interface BudgetGovernancePolicy {
  schemaVersion: number;
  profile: BudgetGovernanceProfileName | string;
  principle: "budget_is_guard_not_goal" | string;
  callBudget: JsonRecord;
  recoveryBudget: JsonRecord;
  runBudget: JsonRecord;
  evidenceBudget: JsonRecord;
  rolloutBudget: JsonRecord;
  protectedPathBudget: JsonRecord;
}

export interface DeliberationWorkspaceBudget {
  governanceProfile?: BudgetGovernanceProfileName | string;
  governancePolicy?: BudgetGovernancePolicy;
  maxShadowCalls: number;
  shadowCallsUsed: number;
  estimatedInputTokens: number;
  softInputTokenLimit: number;
  hardInputTokenLimit: number;
  maxOutputTokens: number;
  timeoutMs: number;
  retryLimit: number;
  estimatedCostUsd?: number;
  maxEstimatedCostUsd?: number;
  status: "within_budget" | "soft_token_limit_exceeded" | "token_budget_exceeded" | "call_budget_exceeded" | "cost_budget_exceeded";
  skippedReason?: string;
}

export interface DeliberationWorkspaceComparison {
  schemaVersion: number;
  phase: "P8";
  mode: "shadow";
  revisionTag?: string;
  ablationMode?: string;
  featureFlag: string;
  enabled: boolean;
  structuredPromptAvailable: boolean;
  legacyPromptAvailable: boolean;
  decisionClass: string;
  legacyPromptHash?: string;
  structuredPromptHash?: string;
  legacyPromptBytes?: number;
  structuredPromptBytes?: number;
  legacyTokenEstimate?: number;
  structuredTokenEstimate?: number;
  coverage: DeliberationWorkspaceCoverage;
  gatedReadiness: "ready" | "not_ready";
  readinessReasons: string[];
  providerReadiness?: "ready_for_shadow_call" | "needs_api_key" | "not_ready";
  providerReadinessReasons?: string[];
  budget?: DeliberationWorkspaceBudget;
  rolloutGate?: JsonRecord;
  summary: string;
}

export type ShadowWorkspaceAgreement = "agree" | "disagree" | "missing_candidate" | "not_applicable";

export type ShadowWorkspaceDecisionOutcome =
  | "not_enabled"
  | "not_ready"
  | "skipped"
  | "unavailable"
  | "valid"
  | "invalid_output"
  | "invalid_choice"
  | "error";

export interface ShadowWorkspaceDecision {
  schemaVersion: number;
  phase: "P8";
  mode: "shadow";
  revisionTag?: string;
  enabled: boolean;
  attempted: boolean;
  called: boolean;
  available: boolean;
  outcome: ShadowWorkspaceDecisionOutcome;
  agreement: ShadowWorkspaceAgreement;
  legacySelectedCandidateId?: string;
  structuredSelectedCandidateId?: string;
  confidence?: number;
  reason?: string;
  reasonQuality?: "missing" | "thin" | "adequate";
  reasonQualityNotes?: string[];
  reasonCueAttribution?: JsonRecord;
  validationError?: string;
  error?: string;
  promptHash?: string;
  decisionClass?: string;
  liveEligibleClass?: boolean;
  provider?: string;
  model?: string;
  providerMode?: string;
  ablationMode?: string;
  workspacePromptBytes?: number;
  workspacePromptTokens?: number;
  providerOutputKind?: string;
  providerContentSource?: string;
  providerOutputPreview?: string;
  providerOutputBytes?: number;
  providerReasoningContentBytes?: number;
  providerReasoningContentReturned?: boolean;
  providerThinkingMode?: string;
  providerParseState?: string;
  providerCleanupReason?: string;
  providerAttempts?: JsonRecord[];
  providerRecoveryPolicy?: JsonRecord;
  providerRecoveryPolicyName?: string;
  failureCategory?: string;
  failureBucket?: string;
  outputCapHit?: boolean;
  retryCount?: number;
  emptyContentRetryCount?: number;
  emptyContentRetrySucceeded?: boolean;
  truncationRetryCount?: number;
  truncationRetrySucceeded?: boolean;
  estimatedInputTokens?: number;
  actualInputTokens?: number;
  actualOutputTokens?: number;
  actualTotalTokens?: number;
  maxOutputTokens?: number;
  providerFinishReason?: string;
  latencyMs?: number;
  estimatedCostUsd?: number;
  budgetStatus?: string;
  riskTags?: string[];
  missingInfo?: string[];
  scaffoldFeedback?: string[];
  skippedReason?: string;
}

export type PredictionErrorLayer =
  | "normalization"
  | "salience"
  | "memory_activation"
  | "candidate_future"
  | "llm_decision"
  | "validation"
  | "execution"
  | "checkpoint"
  | "eval"
  | "unknown";

export interface PredictionAttributionBucket {
  bucket: "damage" | "defense" | "hp" | "kill" | "phase" | "card_flow" | "resource" | "route" | "reward" | "unknown" | string;
  status: "supported" | "unsupported" | "unknown";
  predictionTypes: string[];
  expected?: JsonRecord;
  actual?: JsonRecord;
  evidenceReasons: string[];
  severity?: "info" | "warning" | "critical";
}

export interface PredictionErrorRecord {
  schemaVersion: number;
  transitionId?: string;
  predicted: string;
  actual?: string;
  errorType: string;
  attributedLayer: PredictionErrorLayer | string;
  severity: "info" | "warning" | "critical";
  evidence?: JsonRecord[];
  attributionBuckets?: PredictionAttributionBucket[];
  proposedFix?: string;
  status?: "open" | "accepted" | "rejected" | "fixed";
}

export interface ReplayFrame {
  schemaVersion: number;
  frameId: string;
  transitionId: string;
  stateSummary?: string;
  selectedAction?: unknown;
  stateDiff?: StateDiff | JsonRecord;
  strategicImpression?: StrategicImpression | JsonRecord;
  salienceSignals?: SalienceSignal[];
  memoryActivation?: MemoryActivation | JsonRecord;
  candidateFutures?: CandidateFuture[];
  deliberationPacket?: DeliberationPacket | JsonRecord;
  promptParity?: PromptParityReport | JsonRecord;
  workspaceComparison?: DeliberationWorkspaceComparison | JsonRecord;
  shadowWorkspaceDecision?: ShadowWorkspaceDecision | JsonRecord;
  predictionError?: PredictionErrorRecord | JsonRecord;
}

export interface ConsolidationRecord {
  schemaVersion: number;
  recordId: string;
  sourceFrameId?: string;
  targetLayer: PredictionErrorLayer | "memory" | "derived_knowledge" | "strategy_params" | string;
  affectedModule?: PredictionErrorLayer | "memory" | "derived_knowledge" | "strategy_params" | string;
  proposalKind?: "learning_proposal" | "evidence_gap" | "manual_review";
  evidenceStrength?: "weak" | "moderate" | "strong";
  blockedStableTargets?: string[];
  proposal: string;
  proposedChange?: JsonRecord;
  evidence: JsonRecord[];
  confidence: number;
  conditions: string[];
  expiry?: JsonRecord;
  revalidation?: JsonRecord;
  rollback: string;
  createdAt?: string;
  status?: "proposed" | "accepted" | "rejected" | "expired" | "reverted" | "rolled_back";
}

export interface ExecutionResult {
  status: "ok" | "error" | "unknown";
  message?: string;
  raw?: JsonRecord;
}

export interface GroundTruthEvidence {
  hasActionIdentity: boolean;
  hasTiming: boolean;
  sources: string[];
}

export interface TransitionRecord {
  schemaVersion: number;
  runId: string;
  transitionId: string;
  source: TransitionSource;
  captureMode: CaptureMode;
  isGroundTruth: boolean;
  confidence: number;
  uncertainty: string[];
  candidateActions: unknown[];
  inferenceReason?: string;
  tick: number;
  timestamp: string;
  screen: string;
  floor?: number;
  hp?: number;
  maxHp?: number;
  gold?: number;
  preStateRef: string;
  postStateRef?: string;
  rawStatePath?: string;
  compactState?: JsonRecord;
  preState?: JsonRecord;
  postState?: JsonRecord;
  compactPreState: JsonRecord;
  compactPostState?: JsonRecord;
  legalActions: unknown[];
  selectedAction: unknown | null;
  localScores?: unknown;
  llmDecision?: unknown;
  decisionAudit?: DecisionAudit;
  derivedSnapshot?: DerivedSnapshot | JsonRecord;
  memorySnapshot?: MemorySnapshot | JsonRecord;
  strategicImpression?: StrategicImpression | JsonRecord;
  salienceSignals?: SalienceSignal[];
  memoryActivation?: MemoryActivation | JsonRecord;
  candidateFutures?: CandidateFuture[];
  deliberationPacket?: DeliberationPacket | JsonRecord;
  promptParity?: PromptParityReport | JsonRecord;
  workspaceComparison?: DeliberationWorkspaceComparison | JsonRecord;
  shadowWorkspaceDecision?: ShadowWorkspaceDecision | JsonRecord;
  selectedPlan?: CandidateFuture | JsonRecord;
  predictionError?: PredictionErrorRecord | JsonRecord;
  replayFrame?: ReplayFrame | JsonRecord;
  consolidation?: ConsolidationRecord | JsonRecord;
  executionResult?: ExecutionResult | JsonRecord;
  stateDiff?: StateDiff | JsonRecord;
  rawRefs: string[];
  groundTruthEvidence?: GroundTruthEvidence;
}
