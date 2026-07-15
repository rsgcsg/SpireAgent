import { loadEnvironment, readRuntimeConfig } from "../config/env.js";
import { buildAllowedActions } from "../domain/actions/buildAllowedActions.js";
import { Sts2McpRestAdapter } from "../integrations/sts2mcp/restAdapter.js";
import { normalizeCurrentState } from "../normalization/normalizeCurrentState.js";
import { listRunIds, readRunMetadata, readRunRecords } from "../recording/fileDecisionRecorder.js";
import { runLoop } from "../runtime/runLoop.js";
import { createRuntime } from "./runtimeFactory.js";

async function main(): Promise<void> {
  loadEnvironment();
  const config = readRuntimeConfig();
  const command = process.argv[2] ?? "help";

  if (command === "replay") {
    await replay(config.runtime.dataDir, parseStringFlag("--run-id"), parseStringFlag("--decision-id"));
    return;
  }

  if (command === "inspect") {
    const adapter = new Sts2McpRestAdapter(config.mcp.baseUrl, config.mcp.timeoutMs);
    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    const allowedActions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    process.stdout.write(`${JSON.stringify({
      stateHash: envelope.stateHash,
      normalizedStateHash: envelope.normalizedStateHash,
      diagnostics: envelope.diagnostics,
      currentState: envelope.currentState,
      allowedActions: allowedActions.map(({ action: _action, sourceStateHash: _sourceStateHash, ...summary }) => summary)
    }, null, 2)}\n`);
    return;
  }

  const runtime = await createRuntime(config);

  if (command === "tick") {
    const dryRun = process.argv.includes("--dry-run");
    const result = await runtime.orchestrator.runTick(1, { dryRun });
    printTick(runtime.recorder.runId, result);
    return;
  }

  if (command === "run") {
    const maxTicks = parseIntegerFlag("--max-ticks") ?? config.runtime.maxTicks;
    const delayMs = parseIntegerFlag("--delay-ms") ?? config.runtime.tickDelayMs;
    const dryRun = process.argv.includes("--dry-run");
    const results = await runLoop(runtime.orchestrator, {
      maxTicks,
      delayMs,
      dryRun,
      onTick: (result) => printTick(runtime.recorder.runId, result)
    });
    const failures = results.filter((result) => result.shouldStopRun && result.outcome !== "executed_and_settled");
    process.exitCode = failures.length > 0 ? 1 : 0;
    return;
  }

  printHelp();
}

async function replay(dataDir: string, requestedRunId: string | undefined, decisionId: string | undefined): Promise<void> {
  const runIds = await listRunIds(dataDir);
  const runId = requestedRunId ?? runIds.at(-1);
  if (!runId) throw new Error(`No runs found in ${dataDir}`);
  const metadata = await readRunMetadata(dataDir, runId);
  const records = await readRunRecords(dataDir, runId);
  const selected = decisionId ? records.filter((record) => record.decisionId === decisionId) : records;
  process.stdout.write(`${JSON.stringify({ metadata, decisionCount: selected.length, decisions: selected }, null, 2)}\n`);
}

function printTick(runId: string, result: { decisionId: string; outcome: string; stateKind?: string; selectedActionId?: string }): void {
  process.stdout.write(
    `${JSON.stringify({ runId, decisionId: result.decisionId, stateKind: result.stateKind, outcome: result.outcome, selectedActionId: result.selectedActionId })}\n`
  );
}

function parseStringFlag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseIntegerFlag(name: string): number | undefined {
  const raw = parseStringFlag(name);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

function printHelp(): void {
  process.stdout.write(`RE-P1 commands:\n  npm run agent:inspect\n  npm run agent:tick -- --dry-run\n  npm run agent:tick\n  npm run agent:run -- --max-ticks 20 --delay-ms 250\n  npm run agent:replay -- --run-id <id> [--decision-id <id>]\n`);
}

main().catch((error) => {
  const message = (error instanceof Error ? error.message : String(error))
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9._~+/=-]+/gu, "sk-[REDACTED]")
    .slice(0, 800);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
