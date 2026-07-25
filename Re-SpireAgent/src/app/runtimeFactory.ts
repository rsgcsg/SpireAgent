import type { RuntimeConfig } from "../config/env.js";
import { buildAllowedActions } from "../domain/actions/buildAllowedActions.js";
import { NORMALIZED_STATE_SCHEMA_VERSION } from "../domain/state/index.js";
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
  const connector = await createConnectorRuntime(config);
  try {
    const llm = new DeepSeekDecisionProvider(config.deepseek);
    const runId = createRunId();
    const adapterDescription = connector.adapter.describe();
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
      evidence: {
        provenance: config.runtime.evidenceProvenance,
        declaredBy: "runtime_configuration",
        qualificationUse: "coverage_only_unless_independently_reviewed"
      },
      schemas: { normalizedState: NORMALIZED_STATE_SCHEMA_VERSION, prompt: 3, decisionRecord: 2 }
    };
    const recorder = new FileDecisionRecorder(config.runtime.dataDir, metadata);
    await recorder.initialize();
    const orchestrator = new TickOrchestrator({
      adapter: connector.adapter,
      normalize: connector.normalize,
      buildAllowedActions,
      llm,
      settlement: connector.settlement,
      recorder
    });
    return { adapter: connector.adapter, llm, recorder, orchestrator, release: connector.release };
  } catch (error) {
    await connector.release();
    throw error;
  }
}

export async function createConnectorRuntime(config: RuntimeConfig): Promise<{
  adapter: Sts2McpHybridAdapter;
  normalize: (raw: unknown) => ReturnType<typeof normalizeCurrentState>;
  settlement: SettlementWatcher;
  release(): Promise<void>;
}> {
  const lock = await acquireRuntimeLock(config.runtime.dataDir);
  try {
    const adapter = new Sts2McpHybridAdapter(config.mcp.baseUrl, config.mcp.timeoutMs, {
      commandPollMs: config.mcp.commandPollMs,
      commandTimeoutMs: config.mcp.commandTimeoutMs
    });
    await adapter.initialize();
    const adapterDescription = adapter.describe();
    const normalize = (raw: unknown) => normalizeCurrentState(raw, adapterDescription);
    const settlement = new SettlementWatcher(adapter, normalize, {
      pollMs: config.runtime.settlementPollMs,
      defaultTimeoutMs: config.runtime.settlementTimeoutMs,
      endTurnTimeoutMs: config.runtime.endTurnSettlementTimeoutMs,
      roomTransitionTimeoutMs: config.runtime.roomTransitionSettlementTimeoutMs
    });
    return { adapter, normalize, settlement, release: () => lock.release() };
  } catch (error) {
    await lock.release();
    throw error;
  }
}
