import {
  DOMAIN_SCHEMA_VERSION,
  type CaptureMode,
  type ExecutionResult,
  type JsonRecord,
  type TransitionRecord,
  type TransitionSource
} from "../domain/types.js";

export type { TransitionRecord } from "../domain/types.js";

export interface TransitionBaseInput {
  runId: string;
  transitionId: string;
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
  rawRefs?: string[];
  legalActions?: unknown[];
  candidateActions?: unknown[];
  memorySnapshot?: JsonRecord;
  derivedSnapshot?: JsonRecord;
  localScores?: unknown;
  llmDecision?: unknown;
  stateDiff?: JsonRecord;
  executionResult?: ExecutionResult | JsonRecord;
}

export interface SnapshotOnlyInput extends TransitionBaseInput {
  source?: TransitionSource;
}

export interface ExecutorLoggedInput extends TransitionBaseInput {
  selectedAction: unknown;
  decisionAudit?: JsonRecord;
}

export interface DiffInferredInput extends TransitionBaseInput {
  selectedAction: unknown | null;
  confidence: number;
  uncertainty: string[];
  candidateActions: unknown[];
  inferenceReason: string;
}

export interface CollectedStateRecordLike {
  runId: string;
  tick: number;
  timestamp: string;
  screen: string;
  floor?: number;
  hp?: number;
  maxHp?: number;
  gold?: number;
  rawStatePath: string;
  compactState: JsonRecord;
  stateHash?: string;
}

export function createSnapshotOnlyTransition(input: SnapshotOnlyInput): TransitionRecord {
  return assertGroundTruthInvariants({
    ...baseTransition(input, input.source ?? "replay", "snapshot_only"),
    isGroundTruth: false,
    confidence: 1,
    uncertainty: ["snapshot_only_has_no_selected_action"],
    selectedAction: null
  });
}

export function createSnapshotOnlyTransitionFromCollectedState(
  record: CollectedStateRecordLike,
  transitionId = `${record.runId}-snapshot-${String(record.tick).padStart(6, "0")}`
): TransitionRecord {
  return createSnapshotOnlyTransition({
    runId: record.runId,
    transitionId,
    tick: record.tick,
    timestamp: record.timestamp,
    screen: record.screen,
    floor: record.floor,
    hp: record.hp,
    maxHp: record.maxHp,
    gold: record.gold,
    preStateRef: record.rawStatePath,
    rawStatePath: record.rawStatePath,
    compactState: record.compactState,
    preState: record.compactState,
    compactPreState: record.compactState,
    rawRefs: [record.rawStatePath],
    stateDiff: record.stateHash ? { schemaVersion: DOMAIN_SCHEMA_VERSION, changes: { stateHash: record.stateHash } } : undefined
  });
}

export function createExecutorLoggedTransitionSkeleton(input: ExecutorLoggedInput): TransitionRecord {
  return assertGroundTruthInvariants({
    ...baseTransition(input, "agent", "executor_logged"),
    isGroundTruth: true,
    confidence: 1,
    uncertainty: [],
    selectedAction: input.selectedAction,
    decisionAudit: input.decisionAudit
  });
}

export function createDiffInferredTransitionSkeleton(input: DiffInferredInput): TransitionRecord {
  return assertGroundTruthInvariants({
    ...baseTransition(input, "human", "diff_inferred"),
    isGroundTruth: false,
    confidence: clamp01(input.confidence),
    uncertainty: input.uncertainty,
    candidateActions: input.candidateActions,
    selectedAction: input.selectedAction,
    inferenceReason: input.inferenceReason
  });
}

export function assertGroundTruthInvariants(record: TransitionRecord): TransitionRecord {
  if (record.captureMode === "snapshot_only" && record.isGroundTruth) {
    throw new Error("snapshot_only transitions cannot be ground truth");
  }
  if (record.captureMode === "diff_inferred" && record.isGroundTruth) {
    throw new Error("diff_inferred transitions cannot be ground truth");
  }
  if (record.captureMode === "executor_logged" && record.isGroundTruth && record.selectedAction == null) {
    throw new Error("executor_logged ground truth requires selectedAction");
  }
  if (record.source === "human" && record.captureMode !== "mcp_event" && record.isGroundTruth) {
    throw new Error("human ground truth requires mcp_event capture mode");
  }
  if (record.captureMode === "mcp_event" && record.isGroundTruth) {
    const evidence = record.groundTruthEvidence;
    if (!evidence?.hasActionIdentity || !evidence.hasTiming) {
      throw new Error("mcp_event ground truth requires action identity and timing evidence");
    }
  }
  return record;
}

function baseTransition(
  input: TransitionBaseInput,
  source: TransitionSource,
  captureMode: CaptureMode
): Omit<TransitionRecord, "isGroundTruth" | "confidence" | "uncertainty" | "selectedAction"> {
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    runId: input.runId,
    transitionId: input.transitionId,
    source,
    captureMode,
    candidateActions: input.candidateActions ?? [],
    tick: input.tick,
    timestamp: input.timestamp,
    screen: input.screen,
    floor: input.floor,
    hp: input.hp,
    maxHp: input.maxHp,
    gold: input.gold,
    preStateRef: input.preStateRef,
    postStateRef: input.postStateRef,
    rawStatePath: input.rawStatePath ?? input.preStateRef,
    compactState: input.compactState ?? input.compactPreState,
    preState: input.preState ?? input.compactPreState,
    postState: input.postState ?? input.compactPostState,
    compactPreState: input.compactPreState,
    compactPostState: input.compactPostState,
    legalActions: input.legalActions ?? [],
    localScores: input.localScores,
    llmDecision: input.llmDecision,
    derivedSnapshot: input.derivedSnapshot,
    memorySnapshot: input.memorySnapshot,
    executionResult: input.executionResult,
    stateDiff: input.stateDiff,
    rawRefs: input.rawRefs ?? [input.preStateRef, input.postStateRef].filter((value): value is string => Boolean(value))
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
