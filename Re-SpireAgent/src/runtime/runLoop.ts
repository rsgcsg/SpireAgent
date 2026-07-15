import type { TickOrchestrator, TickResult } from "./tickOrchestrator.js";

export interface RunLoopOptions {
  maxTicks: number;
  delayMs: number;
  dryRun?: boolean;
  onTick?: (result: TickResult) => void;
}

export async function runLoop(orchestrator: TickOrchestrator, options: RunLoopOptions): Promise<TickResult[]> {
  const results: TickResult[] = [];
  for (let tick = 1; tick <= options.maxTicks; tick += 1) {
    const result = await orchestrator.runTick(tick, options.dryRun === undefined ? {} : { dryRun: options.dryRun });
    results.push(result);
    options.onTick?.(result);
    if (result.shouldStopRun) break;
    if (tick < options.maxTicks && options.delayMs > 0) await sleep(options.delayMs);
  }
  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
