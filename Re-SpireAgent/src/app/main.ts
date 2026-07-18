import { loadEnvironment, readRuntimeConfig } from "../config/env.js";
import { buildAllowedActions } from "../domain/actions/buildAllowedActions.js";
import { Sts2McpHybridAdapter } from "../integrations/sts2mcp/hybridAdapter.js";
import { normalizeCurrentState } from "../normalization/normalizeCurrentState.js";
import { listRunIds, readRunMetadata, readRunRecords } from "../recording/fileDecisionRecorder.js";
import { runLoop } from "../runtime/runLoop.js";
import { parseCliInvocation } from "./cliArgs.js";
import { createRuntime } from "./runtimeFactory.js";

async function main(): Promise<void> {
  const invocation = parseCliInvocation(process.argv.slice(2));
  if (invocation.command === "help") {
    printHelp();
    return;
  }

  loadEnvironment();
  const config = readRuntimeConfig();

  if (invocation.command === "replay") {
    await replay(config.runtime.dataDir, invocation.runId, invocation.decisionId);
    return;
  }

  if (invocation.command === "inspect") {
    const adapter = new Sts2McpHybridAdapter(config.mcp.baseUrl, config.mcp.timeoutMs, {
      mode: config.mcp.protocolMode,
      commandPollMs: config.mcp.commandPollMs,
      commandTimeoutMs: config.mcp.commandTimeoutMs
    });
    await adapter.initialize();
    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    const allowedActions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    process.stdout.write(`${JSON.stringify({
      adapter: adapter.describe(),
      stateHash: envelope.stateHash,
      normalizedStateHash: envelope.normalizedStateHash,
      diagnostics: envelope.diagnostics,
      currentState: envelope.currentState,
      allowedActions: allowedActions.map(({ action: _action, sourceStateHash: _sourceStateHash, ...summary }) => summary)
    }, null, 2)}\n`);
    return;
  }

  const runtime = await createRuntime(config);
  try {
    if (invocation.command === "tick") {
      const result = await runtime.orchestrator.runTick(1, { dryRun: invocation.dryRun });
      printTick(runtime.recorder.runId, result);
      return;
    }

    if (invocation.command === "run") {
      const maxTicks = invocation.maxTicks ?? config.runtime.maxTicks;
      const delayMs = invocation.delayMs ?? config.runtime.tickDelayMs;
      const results = await runLoop(runtime.orchestrator, {
        maxTicks,
        delayMs,
        dryRun: invocation.dryRun,
        stopAtRunBoundary: true,
        onTick: (result) => printTick(runtime.recorder.runId, result)
      });
      const failures = results.filter((result) =>
        result.shouldStopRun
        && result.stopReason !== "run_boundary"
        && result.outcome !== "executed_and_settled");
      process.exitCode = failures.length > 0 ? 1 : 0;
      return;
    }
  } finally {
    await runtime.release();
  }
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

function printTick(runId: string, result: {
  decisionId: string;
  outcome: string;
  contextKind?: string;
  surfaceKind?: string;
  actionAuthority?: string;
  selectedActionId?: string;
  stopReason?: string;
}): void {
  process.stdout.write(
    `${JSON.stringify({
      runId,
      decisionId: result.decisionId,
      contextKind: result.contextKind,
      surfaceKind: result.surfaceKind,
      authority: result.actionAuthority,
      outcome: result.outcome,
      selectedActionId: result.selectedActionId,
      stopReason: result.stopReason
    })}\n`
  );
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
