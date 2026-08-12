import type { RunSummary } from "../recording/types.js";
import type { TickOrchestrator, TickResult } from "./tickOrchestrator.js";

export interface RunLoopOptions {
  maxTicks: number;
  delayMs: number;
  dryRun?: boolean;
  /** Finish game-over cleanup, then stop before any top-level menu action. */
  stopAtRunBoundary?: boolean;
  /** Permit only Player Environment-advertised actions to cross the top-level run boundary. */
  allowRunEntry?: boolean;
  onTick?: (result: TickResult) => void;
}

export async function runLoop(orchestrator: TickOrchestrator, options: RunLoopOptions): Promise<TickResult[]> {
  const results: TickResult[] = [];
  for (let tick = 1; tick <= options.maxTicks; tick += 1) {
    const result = await orchestrator.runTick(tick, {
      ...(options.dryRun === undefined ? {} : { dryRun: options.dryRun }),
      ...(options.stopAtRunBoundary === undefined ? {} : { stopAtRunBoundary: options.stopAtRunBoundary }),
      ...(options.allowRunEntry === undefined ? {} : { allowRunEntry: options.allowRunEntry })
    });
    results.push(result);
    options.onTick?.(result);
    if (result.shouldStopRun) break;
    if (tick < options.maxTicks && options.delayMs > 0) await sleep(options.delayMs);
  }
  return results;
}

export function classifyRunTermination(
  results: readonly TickResult[],
  maxTicks: number
): RunSummary["termination"] {
  const terminal = results.at(-1);
  if (!terminal) return "stopped_runtime_failure";
  if (terminal.stopReason === "run_boundary") return "completed_run_boundary";
  if (terminal.shouldStopRun && terminal.stopReason) return "stopped_runtime_guard";
  if (terminal.shouldStopRun) return "stopped_runtime_failure";
  if (results.length >= maxTicks) return "stopped_decision_limit";
  return "stopped_runtime_failure";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
