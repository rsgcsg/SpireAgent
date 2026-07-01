import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { TransitionRecord } from "../data/transitionSchema.js";
import { assertGroundTruthInvariants } from "../data/transitionSchema.js";
import { agentRoot, isRecord } from "../agent/utils.js";

export interface ReplayRun {
  runDir: string;
  transitions: TransitionRecord[];
}

export interface ReplayTimelineItem {
  index: number;
  tick: number;
  timestamp: string;
  screen: string;
  floor?: number;
  source: string;
  captureMode: string;
  isGroundTruth: boolean;
  selectedAction: unknown;
  checkpointKind?: string;
  summary: string;
}

export interface ReplayCognitiveCoverage {
  transitions: number;
  strategicImpression: number;
  salienceSignals: number;
  memoryActivation: number;
  candidateFutures: number;
  candidateFuturePredictionChecks: number;
  derivedSnapshot: number;
  derivedKnowledgeSummary: number;
  deliberationPacket: number;
  promptParity: number;
  predictionError: number;
  replayFrame: number;
  consolidation: number;
  fullShadowScaffold: number;
}

export function readReplayRun(runIdOrPath?: string, runsRoot = path.join(agentRoot, "data", "runs")): ReplayRun {
  const runDir = resolveRunDir(runIdOrPath, runsRoot);
  const transitionsPath = path.join(runDir, "transitions.jsonl");
  const transitions = readTransitionJsonl(transitionsPath);
  return { runDir, transitions };
}

export function readTransitionJsonl(filePath: string): TransitionRecord[] {
  if (!existsSync(filePath)) {
    throw new Error(`Transition log not found: ${filePath}`);
  }
  const lines = readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line, index) => {
    const parsed = JSON.parse(line) as TransitionRecord;
    if (!isRecord(parsed)) {
      throw new Error(`Transition line ${index + 1} is not an object`);
    }
    return assertGroundTruthInvariants(parsed);
  });
}

export function buildReplayTimeline(transitions: TransitionRecord[]): ReplayTimelineItem[] {
  return transitions.map((transition, index) => {
    const checkpoint = isRecord(transition.stateDiff) && isRecord(transition.stateDiff.checkpoint)
      ? transition.stateDiff.checkpoint
      : undefined;
    const checkpointKind = typeof checkpoint?.kind === "string" ? checkpoint.kind : undefined;
    return {
      index: index + 1,
      tick: transition.tick,
      timestamp: transition.timestamp,
      screen: transition.screen,
      floor: transition.floor,
      source: transition.source,
      captureMode: transition.captureMode,
      isGroundTruth: transition.isGroundTruth,
      selectedAction: transition.selectedAction,
      checkpointKind,
      summary: summarizeTransition(transition, checkpointKind)
    };
  });
}

export function buildReplayCognitiveCoverage(transitions: TransitionRecord[]): ReplayCognitiveCoverage {
  const coverage: ReplayCognitiveCoverage = {
    transitions: transitions.length,
    strategicImpression: 0,
    salienceSignals: 0,
    memoryActivation: 0,
    candidateFutures: 0,
    candidateFuturePredictionChecks: 0,
    derivedSnapshot: 0,
    derivedKnowledgeSummary: 0,
    deliberationPacket: 0,
    promptParity: 0,
    predictionError: 0,
    replayFrame: 0,
    consolidation: 0,
    fullShadowScaffold: 0
  };
  for (const transition of transitions) {
    const hasStrategicImpression = isRecord(transition.strategicImpression);
    const hasSalienceSignals = Array.isArray(transition.salienceSignals) && transition.salienceSignals.length > 0;
    const hasMemoryActivation = isRecord(transition.memoryActivation);
    const hasCandidateFutures = Array.isArray(transition.candidateFutures) && transition.candidateFutures.length > 0;
    const hasCandidateFuturePredictionChecks = Array.isArray(transition.candidateFutures) &&
      transition.candidateFutures.some((future) => isRecord(future) && Array.isArray(future.predictionChecks) && future.predictionChecks.length > 0);
    const hasDerivedSnapshot = isRecord(transition.derivedSnapshot);
    const hasDeliberationPacket = isRecord(transition.deliberationPacket);
    const hasDerivedKnowledgeSummary = hasDeliberationPacket && isRecord(transition.deliberationPacket?.derivedKnowledgeSummary);
    const hasPromptParity = isRecord(transition.promptParity) || (hasDeliberationPacket && isRecord(transition.deliberationPacket?.promptParity));
    const hasPredictionError = isRecord(transition.predictionError);
    const hasReplayFrame = isRecord(transition.replayFrame);
    const hasConsolidation = isRecord(transition.consolidation);
    if (hasStrategicImpression) coverage.strategicImpression += 1;
    if (hasSalienceSignals) coverage.salienceSignals += 1;
    if (hasMemoryActivation) coverage.memoryActivation += 1;
    if (hasCandidateFutures) coverage.candidateFutures += 1;
    if (hasCandidateFuturePredictionChecks) coverage.candidateFuturePredictionChecks += 1;
    if (hasDerivedSnapshot) coverage.derivedSnapshot += 1;
    if (hasDerivedKnowledgeSummary) coverage.derivedKnowledgeSummary += 1;
    if (hasDeliberationPacket) coverage.deliberationPacket += 1;
    if (hasPromptParity) coverage.promptParity += 1;
    if (hasPredictionError) coverage.predictionError += 1;
    if (hasReplayFrame) coverage.replayFrame += 1;
    if (hasConsolidation) coverage.consolidation += 1;
    if (hasStrategicImpression && hasSalienceSignals && hasMemoryActivation && hasCandidateFutures && hasDeliberationPacket) {
      coverage.fullShadowScaffold += 1;
    }
  }
  return coverage;
}

export function formatReplayCognitiveCoverage(coverage: ReplayCognitiveCoverage): string {
  const total = Math.max(1, coverage.transitions);
  const item = (label: string, value: number): string => `${label}=${value}/${coverage.transitions} (${((value / total) * 100).toFixed(1)}%)`;
  return [
    item("strategicImpression", coverage.strategicImpression),
    item("salienceSignals", coverage.salienceSignals),
    item("memoryActivation", coverage.memoryActivation),
    item("candidateFutures", coverage.candidateFutures),
    item("candidateFuturePredictionChecks", coverage.candidateFuturePredictionChecks),
    item("derivedSnapshot", coverage.derivedSnapshot),
    item("derivedKnowledgeSummary", coverage.derivedKnowledgeSummary),
    item("deliberationPacket", coverage.deliberationPacket),
    item("promptParity", coverage.promptParity),
    item("predictionError", coverage.predictionError),
    item("replayFrame", coverage.replayFrame),
    item("consolidation", coverage.consolidation),
    item("fullShadowScaffold", coverage.fullShadowScaffold)
  ].join(", ");
}

export function formatReplayTimeline(items: ReplayTimelineItem[]): string {
  if (items.length === 0) {
    return "No transitions found.";
  }
  return items
    .map((item) => {
      const floor = item.floor === undefined ? "?" : String(item.floor);
      return [
        `#${item.index}`,
        `tick=${item.tick}`,
        `floor=${floor}`,
        `screen=${item.screen}`,
        `mode=${item.captureMode}`,
        `gt=${item.isGroundTruth}`,
        `checkpoint=${item.checkpointKind ?? "unknown"}`,
        `action=${shortAction(item.selectedAction)}`
      ].join(" ");
    })
    .join("\n");
}

export function resolveRunDir(runIdOrPath?: string, runsRoot = path.join(agentRoot, "data", "runs")): string {
  if (runIdOrPath && (path.isAbsolute(runIdOrPath) || runIdOrPath.includes(path.sep) || runIdOrPath.startsWith("."))) {
    return path.resolve(runIdOrPath);
  }
  if (runIdOrPath) {
    return path.join(runsRoot, runIdOrPath);
  }
  return latestRunDir(runsRoot);
}

function latestRunDir(runsRoot: string): string {
  if (!existsSync(runsRoot)) {
    throw new Error(`No run directory exists yet: ${runsRoot}`);
  }
  const dirs = readdirSync(runsRoot)
    .map((name) => path.join(runsRoot, name))
    .filter((entry) => statSync(entry).isDirectory())
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (dirs.length === 0) {
    throw new Error(`No runs found under: ${runsRoot}`);
  }
  return dirs[0];
}

function summarizeTransition(transition: TransitionRecord, checkpointKind?: string): string {
  return [
    `tick=${transition.tick}`,
    `screen=${transition.screen}`,
    `action=${shortAction(transition.selectedAction)}`,
    `checkpoint=${checkpointKind ?? "unknown"}`
  ].join(" ");
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
