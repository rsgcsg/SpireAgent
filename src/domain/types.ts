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
  executionResult?: ExecutionResult | JsonRecord;
  stateDiff?: StateDiff | JsonRecord;
  rawRefs: string[];
  groundTruthEvidence?: GroundTruthEvidence;
}
