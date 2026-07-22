export type JsonRecord = Record<string, unknown>;

export type ScreenKind =
  | "combat"
  | "rewards"
  | "card_reward"
  | "map"
  | "rest"
  | "event"
  | "shop"
  | "treasure"
  | "crystal_sphere"
  | "card_select"
  | "bundle_select"
  | "game_over"
  | "menu"
  | "unknown";

export interface NormalizedEnemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  intents: Array<{
    type: string;
    label: string;
    title?: string;
    description?: string;
  }>;
  status: JsonRecord[];
}

export interface NormalizedCard {
  id: string;
  name: string;
  index: number;
  type: string;
  typeKey?: string;
  rarity?: string;
  rarityKey?: string;
  cost?: string | number | null;
  description: string;
  canPlay: boolean;
  targetType?: string;
  raw: JsonRecord;
}

export interface NormalizedPlayer {
  character: string;
  hp: number;
  maxHp: number;
  block: number;
  energy: number;
  maxEnergy: number;
  gold: number;
  hand: NormalizedCard[];
  drawPileCount: number;
  discardPileCount: number;
  exhaustPileCount: number;
  relics: JsonRecord[];
  potions: JsonRecord[];
  status: JsonRecord[];
  orbs: JsonRecord[];
  orbSlots: number;
  orbEmptySlots: number;
}

export interface NormalizedState {
  stateType: string;
  screen: ScreenKind;
  act?: number;
  floor?: number;
  ascension?: number;
  round?: number;
  turn?: string;
  isPlayPhase: boolean;
  player: NormalizedPlayer;
  enemies: NormalizedEnemy[];
  rewards: JsonRecord[];
  options: JsonRecord[];
  mapNodes: JsonRecord[];
  raw: JsonRecord;
}

export type AgentAction =
  | { kind: "play_card"; cardIndex: number; cardName?: string; target?: string }
  | { kind: "end_turn" }
  | { kind: "use_potion"; slot: number; target?: string }
  | { kind: "discard_potion"; slot: number }
  | { kind: "choose_map_node"; index: number }
  | { kind: "choose_rest_option"; index: number }
  | { kind: "proceed" }
  | { kind: "claim_reward"; index: number }
  | { kind: "claim_treasure_relic"; index: number; relicName?: string }
  | { kind: "select_card_reward"; index: number; cardName?: string }
  | { kind: "skip_card_reward" }
  | { kind: "event_choose_option"; index: number }
  | { kind: "shop_purchase"; index: number }
  | { kind: "crystal_sphere_set_tool"; tool: "big" | "small" }
  | { kind: "crystal_sphere_click_cell"; x: number; y: number }
  | { kind: "crystal_sphere_proceed" }
  | { kind: "select_card"; index: number; cardName?: string }
  | { kind: "combat_select_card"; index: number; cardName?: string }
  | { kind: "confirm_selection" }
  | { kind: "combat_confirm_selection" }
  | { kind: "cancel_selection" }
  | { kind: "bundle_select"; index: number }
  | { kind: "bundle_confirm_selection" }
  | { kind: "bundle_cancel_selection" }
  | { kind: "menu_select"; option: string | number; seed?: string };

export interface CandidateAction {
  id: string;
  action: AgentAction;
  label: string;
  kind: AgentAction["kind"];
  requiresLlm?: boolean;
  facts?: JsonRecord;
}

export interface ScoredCandidate extends CandidateAction {
  score: number;
  confidence: number;
  reasons: string[];
  risks: string[];
}

export type DecisionRouteKind =
  | "no_op_or_poll"
  | "forced_local"
  | "obvious_local"
  | "local_fast_combat"
  | "local_confident"
  | "local_recommended_llm_arbitrate"
  | "llm_required";

export interface DecisionRoute {
  kind: DecisionRouteKind;
  shouldAskLlm: boolean;
  llmPriority: "none" | "optional" | "required";
  reasons: string[];
}

export type LlmAuditOutcome =
  | "not_needed"
  | "selected"
  | "unavailable"
  | "disabled_by_tick_limit"
  | "disabled_by_live_whitelist"
  | "timeout"
  | "invalid_output"
  | "invalid_choice"
  | "error";

export interface DecisionLlmAudit {
  wanted: boolean;
  called: boolean;
  available: boolean;
  outcome: LlmAuditOutcome;
  providerSource?: "deepseek-live-command" | "bridge-command" | "custom-command" | "none";
  candidateId?: string;
  error?: string;
  promptBytes?: number;
  candidatesSent?: number;
  promptMode?: "legacy_only" | "additive_legacy_prompt_plus_compact_workspace_summary";
  liveAdditiveEnabled?: boolean;
  liveAdditiveApplied?: boolean;
  liveAdditiveDecisionClass?: string;
  liveAdditiveWhitelist?: string[];
  liveAdditiveSummaryBytes?: number;
  protectedPathAttemptedWrites?: string[];
  protectedPathBlockedWrites?: string[];
}

export type FallbackPolicyName = "local_top" | "conservative_combat";

export interface FallbackPolicyAudit {
  name: FallbackPolicyName;
  originalCandidateId?: string;
  selectedCandidateId?: string;
  reasons: string[];
}

export type CheckpointKind = "none" | "soft" | "hard" | "unknown";

export interface ExecutionCheckpoint {
  kind: CheckpointKind;
  reasons: string[];
  settled: boolean;
  polls: number;
  preStateHash: string;
  postStateHash: string;
  before: string;
  after: string;
  changes: JsonRecord;
}

export type DeficitKey =
  | "damage"
  | "block"
  | "draw"
  | "energy"
  | "scaling"
  | "aoe"
  | "deck_thinness"
  | "status_control"
  | "healing"
  | "potions";

export type DeficitMap = Record<DeficitKey, number>;

export interface RunMemory {
  runId: string;
  startedAt: string;
  updatedAt: string;
  character?: string;
  act?: number;
  floor?: number;
  ascension?: number;
  hp?: number;
  maxHp?: number;
  gold?: number;
  strategicDirection: string[];
  deficits: DeficitMap;
  routeBias: {
    elites: number;
    shops: number;
    rests: number;
    events: number;
  };
  activeMapRoutePlan?: MapRoutePlan;
  riskFlags: string[];
  keyDecisions: DecisionLogEntry[];
  recentCombat: {
    lastIncomingDamage?: number;
    lastTurnHpLoss?: number;
    statusBurden: number;
  };
  counters: {
    ticks: number;
    llmCalls: number;
    llmWanted: number;
    localDecisions: number;
    uncertainDecisions: number;
    fallbackDecisions: number;
    forcedLocalDecisions: number;
    llmUnavailableFallbacks: number;
    llmInvalidFallbacks: number;
    llmTimeoutFallbacks: number;
    conservativeFallbackDecisions: number;
    checkpointNone: number;
    checkpointSoft: number;
    checkpointHard: number;
    checkpointUnknown: number;
    combats: number;
    elitesSeen: number;
    restsUsed: number;
  };
}

export interface MapRoutePlan {
  schemaVersion: 1;
  id: string;
  status: "active";
  createdAt: string;
  updatedAt: string;
  act?: number;
  originFloor?: number;
  originNode?: MapRouteNodeSummary;
  nextNode?: MapRouteNodeSummary;
  routeLine: MapRouteNodeSummary[];
  checkpoints: string[];
  replanTriggers: string[];
  rationale: string[];
}

export interface MapRouteNodeSummary {
  index?: number;
  col?: number;
  row?: number;
  type: string;
}

export interface DecisionLogEntry {
  id: string;
  at: string;
  act?: number;
  floor?: number;
  screen: ScreenKind;
  stateSummary: string;
  chosen: string;
  chosenBy: "local" | "llm" | "fallback";
  route?: DecisionRouteKind;
  routeReasons?: string[];
  fallbackReason?: string;
  fallbackPolicy?: FallbackPolicyAudit;
  llm?: DecisionLlmAudit;
  checkpoint?: ExecutionCheckpoint;
  candidateCount?: number;
  topCandidate?: {
    id: string;
    label: string;
    score: number;
    confidence: number;
  };
  score?: number;
  confidence?: number;
  reasons: string[];
  candidates: Array<{
    id: string;
    label: string;
    score: number;
    reasons: string[];
  }>;
  outcome?: JsonRecord;
}

export interface CollectedStateRecord {
  schemaVersion: 1;
  runId: string;
  tick: number;
  source: "collector" | "agent" | "human_watch" | "replay";
  timestamp: string;
  screen: ScreenKind;
  act?: number;
  floor?: number;
  hp: number;
  maxHp: number;
  gold: number;
  stateHash: string;
  rawStatePath: string;
  compactState: JsonRecord;
  action: AgentAction | null;
  executionResult: JsonRecord | null;
  stateDiff: JsonRecord | null;
  checkpointKind: CheckpointKind | "not_applicable";
  checkpointReasons: string[];
}

export interface StrategyParams {
  version: number;
  updatedAt: string;
  weights: {
    damage: number;
    block: number;
    lethal: number;
    draw: number;
    energy: number;
    scaling: number;
    statusControl: number;
    deckThinness: number;
    routeEliteRisk: number;
    routeShopValue: number;
    restSafety: number;
  };
  thresholds: {
    localConfidence: number;
    llmUncertaintyMargin: number;
    lowHpRatio: number;
    obviousScoreGap: number;
    maxLlmCandidates: number;
  };
  learning: {
    enabled: boolean;
    maxParamDeltaPerRun: number;
    memoryConfidenceStep: number;
  };
  history: Array<{
    at: string;
    reason: string;
    changes: JsonRecord;
    rewardScore?: number;
  }>;
}

export interface LongTermMemory {
  version: number;
  runs: Array<{
    runId: string;
    at: string;
    character?: string;
    result: "win" | "loss" | "unknown";
    act?: number;
    floor?: number;
    rewardScore: number;
    summary: string;
    failureReasons: string[];
    successfulPatterns: string[];
  }>;
  lessons: Array<{
    id: string;
    text: string;
    tags: string[];
    confidence: number;
    evidenceRunIds: string[];
    updatedAt: string;
  }>;
}

export interface ExperienceMemory {
  version: number;
  cards: Record<string, ExperienceEntry>;
  relics: Record<string, ExperienceEntry>;
  enemies: Record<string, ExperienceEntry>;
  routes: Record<string, ExperienceEntry>;
}

export interface ExperienceEntry {
  id: string;
  notes: string[];
  tags: string[];
  confidence: number;
  wins: number;
  losses: number;
  updatedAt: string;
}

export interface RewardSummary {
  runId: string;
  result: "win" | "loss" | "unknown";
  score: number;
  reasons: string[];
  parameterFeedback: Partial<Record<DeficitKey | "routeEliteRisk" | "routeShopValue", number>>;
}

export interface LlmDecision {
  candidateId: string;
  confidence?: number;
  reason?: string;
  memoryUpdates?: {
    strategicDirection?: string[];
    riskFlags?: string[];
    deficits?: Partial<DeficitMap>;
  };
  parameterSuggestions?: Array<{
    key: string;
    delta: number;
    reason: string;
  }>;
}
