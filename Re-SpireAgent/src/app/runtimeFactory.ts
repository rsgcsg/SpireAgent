import type { RuntimeConfig } from "../config/env.js";
import { buildPlayerEnvironmentAllowedActions } from "../domain/actions/buildPlayerEnvironmentAllowedActions.js";
import { NORMALIZED_STATE_SCHEMA_VERSION } from "../domain/state/index.js";
import { Sts2PlayerEnvironmentAdapter } from "../integrations/sts2mcp/playerEnvironmentAdapter.js";
import { DeepSeekDecisionProvider } from "../llm/deepseekProvider.js";
import { normalizePlayerEnvironmentCurrentState } from "../normalization/normalizePlayerEnvironmentCurrentState.js";
import { createRunId, FileDecisionRecorder } from "../recording/fileDecisionRecorder.js";
import type { RunMetadata } from "../recording/types.js";
import { SuccessorWatcher } from "../runtime/successorWatcher.js";
import { acquireRuntimeLock } from "../runtime/runtimeLock.js";
import { TickOrchestrator } from "../runtime/tickOrchestrator.js";
import { onceAsync } from "./gracefulShutdown.js";

export async function createRuntime(config: RuntimeConfig): Promise<{
  adapter: Sts2PlayerEnvironmentAdapter;
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
      ...(config.runtime.agentSourceRevision && config.runtime.agentSourceDigest && config.runtime.agentWorktreeStatus
        ? {
            agentSource: {
              revision: config.runtime.agentSourceRevision,
              sourceDigest: config.runtime.agentSourceDigest,
              worktreeStatus: config.runtime.agentWorktreeStatus,
              declaredBy: "runtime_environment" as const
            }
          }
        : {}),
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
        declaredBy: "runtime_configuration"
      },
      schemas: { normalizedState: NORMALIZED_STATE_SCHEMA_VERSION, prompt: 3, decisionRecord: 2 }
    };
    const recorder = new FileDecisionRecorder(config.runtime.dataDir, metadata);
    await recorder.initialize();
    const orchestrator = new TickOrchestrator({
      adapter: connector.adapter,
      normalize: connector.normalize,
      buildAllowedActions: buildPlayerEnvironmentAllowedActions,
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
  adapter: Sts2PlayerEnvironmentAdapter;
  normalize: (raw: unknown) => ReturnType<typeof normalizePlayerEnvironmentCurrentState>;
  settlement: SuccessorWatcher;
  release(): Promise<void>;
}> {
  const lock = await acquireRuntimeLock(config.runtime.dataDir);
  try {
    const adapter = new Sts2PlayerEnvironmentAdapter(config.connector.baseUrl, config.connector.timeoutMs, {
      startupWaitMs: config.connector.startupWaitMs,
      startupPollMs: config.connector.startupPollMs
    });
    await adapter.initialize();
    const adapterDescription = adapter.describe();
    const normalize = (raw: unknown) =>
      normalizePlayerEnvironmentCurrentState(raw, adapterDescription);
    const settlement = new SuccessorWatcher(adapter, normalize, {
      pollMs: config.runtime.settlementPollMs,
      defaultTimeoutMs: config.runtime.settlementTimeoutMs,
      endTurnTimeoutMs: config.runtime.endTurnSettlementTimeoutMs,
      roomTransitionTimeoutMs: config.runtime.roomTransitionSettlementTimeoutMs
    });
    const release = onceAsync(async () => {
      try {
        await adapter.close();
      } finally {
        await lock.release();
      }
    });
    return {
      adapter,
      normalize,
      settlement,
      release
    };
  } catch (error) {
    await lock.release();
    throw error;
  }
}
