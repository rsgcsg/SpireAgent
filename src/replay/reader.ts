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
