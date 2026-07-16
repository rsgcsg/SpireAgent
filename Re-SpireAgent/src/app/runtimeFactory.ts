import type { RuntimeConfig } from "../config/env.js";
import { buildAllowedActions } from "../domain/actions/buildAllowedActions.js";
import { Sts2McpHybridAdapter } from "../integrations/sts2mcp/hybridAdapter.js";
import { DeepSeekDecisionProvider } from "../llm/deepseekProvider.js";
import { normalizeCurrentState } from "../normalization/normalizeCurrentState.js";
import { createRunId, FileDecisionRecorder } from "../recording/fileDecisionRecorder.js";
import type { RunMetadata } from "../recording/types.js";
import { SettlementWatcher } from "../runtime/settlementWatcher.js";
import { acquireRuntimeLock } from "../runtime/runtimeLock.js";
import { TickOrchestrator } from "../runtime/tickOrchestrator.js";

export async function createRuntime(config: RuntimeConfig): Promise<{
  adapter: Sts2McpHybridAdapter;
  llm: DeepSeekDecisionProvider;
  recorder: FileDecisionRecorder;
  orchestrator: TickOrchestrator;
  release(): Promise<void>;
}> {
  const lock = await acquireRuntimeLock(config.runtime.dataDir);
  try {
    const adapter = new Sts2McpHybridAdapter(config.mcp.baseUrl, config.mcp.timeoutMs, {
      mode: config.mcp.protocolMode,
      commandPollMs: config.mcp.commandPollMs,
      commandTimeoutMs: config.mcp.commandTimeoutMs
    });
    await adapter.initialize();
    const llm = new DeepSeekDecisionProvider(config.deepseek);
    const runId = createRunId();
    const adapterDescription = adapter.describe();
    const metadata: RunMetadata = {
      metadataSchemaVersion: 1,
      runId,
      startedAt: new Date().toISOString(),
      agentVersion: "0.1.0",
      adapter: {
        adapterId: adapterDescription.adapterId,
        ...(adapterDescription.adapterVersion ? { adapterVersion: adapterDescription.adapterVersion } : {}),
        endpoint: adapterDescription.endpoint,
        capabilities: { ...adapterDescription.capabilities },
        ...(adapterDescription.negotiated ? { negotiated: adapterDescription.negotiated } : {})
      },
      provider: llm.describe(),
      schemas: { normalizedState: 3, prompt: 3, decisionRecord: 2 }
    };
    const recorder = new FileDecisionRecorder(config.runtime.dataDir, metadata);
    await recorder.initialize();
    const normalize = (raw: unknown) => normalizeCurrentState(raw, adapterDescription);
    const settlement = new SettlementWatcher(adapter, normalize, {
      pollMs: config.runtime.settlementPollMs,
      defaultTimeoutMs: config.runtime.settlementTimeoutMs,
      endTurnTimeoutMs: config.runtime.endTurnSettlementTimeoutMs
    });
    const orchestrator = new TickOrchestrator({
      adapter,
      normalize,
      buildAllowedActions,
      llm,
      settlement,
      recorder
    });
    return { adapter, llm, recorder, orchestrator, release: () => lock.release() };
  } catch (error) {
    await lock.release();
    throw error;
  }
}
