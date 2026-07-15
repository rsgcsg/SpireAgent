import type { RuntimeConfig } from "../config/env.js";
import { buildAllowedActions } from "../domain/actions/buildAllowedActions.js";
import { Sts2McpRestAdapter } from "../integrations/sts2mcp/restAdapter.js";
import { DeepSeekDecisionProvider } from "../llm/deepseekProvider.js";
import { normalizeCurrentState } from "../normalization/normalizeCurrentState.js";
import { createRunId, FileDecisionRecorder } from "../recording/fileDecisionRecorder.js";
import type { RunMetadata } from "../recording/types.js";
import { SettlementWatcher } from "../runtime/settlementWatcher.js";
import { TickOrchestrator } from "../runtime/tickOrchestrator.js";

export async function createRuntime(config: RuntimeConfig): Promise<{
  adapter: Sts2McpRestAdapter;
  llm: DeepSeekDecisionProvider;
  recorder: FileDecisionRecorder;
  orchestrator: TickOrchestrator;
}> {
  const adapter = new Sts2McpRestAdapter(config.mcp.baseUrl, config.mcp.timeoutMs);
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
      capabilities: { ...adapterDescription.capabilities }
    },
    provider: llm.describe(),
    schemas: { normalizedState: 1, prompt: 1, decisionRecord: 1 }
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
  return { adapter, llm, recorder, orchestrator };
}
