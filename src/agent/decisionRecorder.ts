import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  DOMAIN_SCHEMA_VERSION,
  type CandidateFuture,
  type ConsolidationRecord,
  type DeliberationPacket,
  type ExecutionResult,
  type JsonRecord,
  type MemoryActivation,
  type PredictionErrorRecord,
  type PromptParityReport,
  type ReplayFrame,
  type RunRecord,
  type SalienceSignal,
  type StrategicImpression
} from "../domain/types.js";
import { createExecutorLoggedTransitionSkeleton, type TransitionRecord } from "../data/transitionSchema.js";
import { compactStateForDataset } from "./collector.js";
import type {
  AgentAction,
  DecisionLlmAudit,
  DecisionRouteKind,
  ExecutionCheckpoint,
  FallbackPolicyAudit,
  LlmDecision,
  NormalizedState,
  RunMemory,
  ScoredCandidate
} from "./types.js";
import { agentRoot, appendJsonl, ensureDir, isRecord, nowIso, readJson, stableId, writeJsonAtomic } from "./utils.js";

export interface AgentDecisionRecorderOptions {
  runsRoot?: string;
}

export interface AgentDecisionRecordInput {
  runId: string;
  tick: number;
  preRawState: unknown;
  preState: NormalizedState;
  postRawState?: unknown;
  postState: NormalizedState;
  legalActions: ScoredCandidate[];
  selectedCandidate: ScoredCandidate;
  selectedAction: AgentAction;
  executionResult: unknown;
  checkpoint: ExecutionCheckpoint;
  chosenBy: "local" | "llm" | "fallback";
  route: {
    kind: DecisionRouteKind;
    reasons: string[];
  };
  llmAudit?: DecisionLlmAudit;
  llmDecision?: LlmDecision | null;
  fallbackReason?: string;
  fallbackPolicy?: FallbackPolicyAudit;
  memoryRun: RunMemory;
  derivedSnapshot?: JsonRecord;
  strategicImpression?: StrategicImpression | JsonRecord;
  salienceSignals?: SalienceSignal[];
  memoryActivation?: MemoryActivation | JsonRecord;
  candidateFutures?: CandidateFuture[];
  deliberationPacket?: DeliberationPacket | JsonRecord;
  promptParity?: PromptParityReport | JsonRecord;
  selectedPlan?: CandidateFuture | JsonRecord;
  predictionError?: PredictionErrorRecord | JsonRecord;
  replayFrame?: ReplayFrame | JsonRecord;
  consolidation?: ConsolidationRecord | JsonRecord;
}

export interface AgentDecisionRecordResult {
  runDir: string;
  transitionPath: string;
  transition: TransitionRecord;
}

export class AgentDecisionRecorder {
  private readonly runsRoot: string;

  constructor(options: AgentDecisionRecorderOptions = {}) {
    this.runsRoot = options.runsRoot ?? path.join(agentRoot, "data", "runs");
  }

  recordAgentDecision(input: AgentDecisionRecordInput): AgentDecisionRecordResult {
    const runDir = this.ensureRunDirectory(input);
    const transitionId = `transition-${String(input.tick).padStart(6, "0")}-${stableId("agent")}`;
    const timestamp = nowIso();
    const preStateRef = this.writeSnapshot(runDir, transitionId, "pre", input.preRawState);
    const postStateRef = this.writeSnapshot(runDir, transitionId, "post", input.postRawState ?? input.postState.raw);
    const compactPreState = compactStateForDataset(input.preState);
    const compactPostState = compactStateForDataset(input.postState);
    const legalActions = input.legalActions.map(compactCandidate);
    const stateDiff = checkpointStateDiff(input.checkpoint);
    const consolidation = enrichConsolidation(input.consolidation, transitionId);
    const replayFrame = input.replayFrame ?? buildReplayFrame({
      transitionId,
      preState: input.preState,
      selectedAction: input.selectedAction,
      stateDiff,
      strategicImpression: input.strategicImpression,
      salienceSignals: input.salienceSignals,
      memoryActivation: input.memoryActivation,
      candidateFutures: input.candidateFutures,
      deliberationPacket: input.deliberationPacket,
      promptParity: input.promptParity,
      predictionError: input.predictionError
    });
    const transition = createExecutorLoggedTransitionSkeleton({
      runId: input.runId,
      transitionId,
      tick: input.tick,
      timestamp,
      screen: input.preState.screen,
      floor: input.preState.floor,
      hp: input.preState.player.hp,
      maxHp: input.preState.player.maxHp,
      gold: input.preState.player.gold,
      preStateRef,
      postStateRef,
      rawStatePath: preStateRef,
      compactState: compactPreState,
      preState: compactPreState,
      postState: compactPostState,
      compactPreState,
      compactPostState,
      rawRefs: [preStateRef, postStateRef],
      legalActions,
      candidateActions: legalActions,
      selectedAction: input.selectedAction,
      localScores: legalActions,
      llmDecision: input.llmDecision ?? undefined,
      decisionAudit: {
        route: input.route.kind,
        chosenBy: input.chosenBy,
        candidateCount: input.legalActions.length,
        topCandidateId: input.legalActions[0]?.id,
        fallbackReason: input.fallbackReason,
        reasons: input.selectedCandidate.reasons,
        raw: {
          chosenCandidateId: input.selectedCandidate.id,
          chosenLabel: input.selectedCandidate.label,
          routeReasons: input.route.reasons,
          llm: input.llmAudit,
          fallbackPolicy: input.fallbackPolicy
        }
      },
      memorySnapshot: memorySnapshot(input.memoryRun),
      strategicImpression: input.strategicImpression,
      salienceSignals: input.salienceSignals,
      memoryActivation: input.memoryActivation,
      candidateFutures: input.candidateFutures,
      deliberationPacket: input.deliberationPacket,
      promptParity: input.promptParity,
      selectedPlan: input.selectedPlan,
      predictionError: input.predictionError,
      replayFrame,
      consolidation,
      derivedSnapshot: input.derivedSnapshot ?? {
        schemaVersion: DOMAIN_SCHEMA_VERSION,
        relevantFacts: [],
        relevantRules: []
      },
      executionResult: toExecutionResult(input.executionResult),
      stateDiff
    });
    const transitionPath = path.join(runDir, "transitions.jsonl");
    appendJsonl(transitionPath, transition);
    this.updateMetadata(runDir, input);
    return { runDir, transitionPath, transition };
  }

  private ensureRunDirectory(input: AgentDecisionRecordInput): string {
    const runDir = path.join(this.runsRoot, input.runId);
    const snapshotsDir = path.join(runDir, "snapshots");
    ensureDir(snapshotsDir);
    touch(path.join(runDir, "events.jsonl"));
    touch(path.join(runDir, "transitions.jsonl"));

    const metadataPath = path.join(runDir, "metadata.json");
    if (!existsSync(metadataPath)) {
      const metadata: RunRecord = {
        schemaVersion: DOMAIN_SCHEMA_VERSION,
        runId: input.runId,
        startedAt: input.memoryRun.startedAt,
        character: input.memoryRun.character ?? input.preState.player.character,
        result: "unknown",
        metadata: {
          source: "agent",
          recorder: "AgentDecisionRecorder",
          createdAt: nowIso()
        }
      };
      writeJsonAtomic(metadataPath, metadata);
    }

    const replayPath = path.join(runDir, "replay.json");
    if (!existsSync(replayPath)) {
      writeJsonAtomic(replayPath, {
        schemaVersion: DOMAIN_SCHEMA_VERSION,
        runId: input.runId,
        generatedFrom: "transitions.jsonl",
        frames: []
      });
    }

    return runDir;
  }

  private writeSnapshot(runDir: string, transitionId: string, phase: "pre" | "post", rawState: unknown): string {
    const snapshotPath = path.join(runDir, "snapshots", `${transitionId}-${phase}.raw.json`);
    writeJsonAtomic(snapshotPath, rawState);
    return path.relative(agentRoot, snapshotPath);
  }

  private updateMetadata(runDir: string, input: AgentDecisionRecordInput): void {
    const metadataPath = path.join(runDir, "metadata.json");
    const metadata = readJson<RunRecord>(metadataPath, {
      schemaVersion: DOMAIN_SCHEMA_VERSION,
      runId: input.runId,
      startedAt: input.memoryRun.startedAt,
      result: "unknown"
    });
    writeJsonAtomic(metadataPath, {
      ...metadata,
      character: metadata.character ?? input.memoryRun.character ?? input.preState.player.character,
      metadata: {
        ...(metadata.metadata ?? {}),
        updatedAt: nowIso(),
        latestScreen: input.postState.screen,
        latestFloor: input.postState.floor,
        latestHp: input.postState.player.hp,
        latestGold: input.postState.player.gold
      }
    });
  }
}

function enrichConsolidation(consolidation: ConsolidationRecord | JsonRecord | undefined, transitionId: string): ConsolidationRecord | JsonRecord | undefined {
  if (!consolidation || !isRecord(consolidation)) return consolidation;
  return {
    ...consolidation,
    recordId: typeof consolidation.recordId === "string" && !consolidation.recordId.endsWith("-pending")
      ? consolidation.recordId
      : `consolidation-${transitionId}`,
    sourceFrameId: typeof consolidation.sourceFrameId === "string" ? consolidation.sourceFrameId : `frame-${transitionId}`
  };
}

function buildReplayFrame(input: {
  transitionId: string;
  preState: NormalizedState;
  selectedAction: AgentAction;
  stateDiff: JsonRecord;
  strategicImpression?: StrategicImpression | JsonRecord;
  salienceSignals?: SalienceSignal[];
  memoryActivation?: MemoryActivation | JsonRecord;
  candidateFutures?: CandidateFuture[];
  deliberationPacket?: DeliberationPacket | JsonRecord;
  promptParity?: PromptParityReport | JsonRecord;
  predictionError?: PredictionErrorRecord | JsonRecord;
}): ReplayFrame {
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    frameId: `frame-${input.transitionId}`,
    transitionId: input.transitionId,
    stateSummary: `${input.preState.screen} floor=${input.preState.floor ?? "?"} hp=${input.preState.player.hp}/${input.preState.player.maxHp}`,
    selectedAction: input.selectedAction,
    stateDiff: input.stateDiff,
    strategicImpression: input.strategicImpression,
    salienceSignals: input.salienceSignals,
    memoryActivation: input.memoryActivation,
    candidateFutures: input.candidateFutures,
    deliberationPacket: input.deliberationPacket,
    promptParity: input.promptParity,
    predictionError: input.predictionError
  };
}

function compactCandidate(candidate: ScoredCandidate): JsonRecord {
  return {
    id: candidate.id,
    kind: candidate.kind,
    label: candidate.label,
    action: candidate.action,
    score: candidate.score,
    confidence: candidate.confidence,
    reasons: candidate.reasons,
    risks: candidate.risks
  };
}

function checkpointStateDiff(checkpoint: ExecutionCheckpoint): JsonRecord {
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    summary: `${checkpoint.kind}: ${checkpoint.reasons.slice(0, 4).join(", ")}`,
    changes: checkpoint.changes,
    checkpoint: {
      kind: checkpoint.kind,
      reasons: checkpoint.reasons,
      settled: checkpoint.settled,
      polls: checkpoint.polls,
      preStateHash: checkpoint.preStateHash,
      postStateHash: checkpoint.postStateHash,
      before: checkpoint.before,
      after: checkpoint.after
    }
  };
}

function memorySnapshot(run: RunMemory): JsonRecord {
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    runId: run.runId,
    summary: `character=${run.character ?? "unknown"} floor=${run.floor ?? "?"} hp=${run.hp ?? "?"}/${run.maxHp ?? "?"}`,
    deficits: run.deficits,
    routeBias: run.routeBias,
    riskFlags: run.riskFlags.slice(-12),
    counters: run.counters,
    ref: "memory/current-run.json"
  };
}

function toExecutionResult(result: unknown): ExecutionResult | JsonRecord {
  if (isRecord(result)) {
    const status = result.status;
    if (status === "ok" || status === "error" || status === "unknown") {
      return {
        status,
        message: typeof result.message === "string" ? result.message : undefined,
        raw: result
      };
    }
    return {
      status: "unknown",
      raw: result
    };
  }
  return {
    status: "unknown",
    raw: { value: result }
  };
}

function touch(filePath: string): void {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, "", { flag: "a", encoding: "utf8" });
}
