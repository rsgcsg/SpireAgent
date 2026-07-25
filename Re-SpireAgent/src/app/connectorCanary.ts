import { buildAllowedActions } from "../domain/actions/buildAllowedActions.js";
import type { StateEnvelope } from "../domain/state/index.js";
import { executeAdvertisedAction } from "../runtime/advertisedActionExecutor.js";
import type { RuntimeConfig } from "../config/env.js";
import { createConnectorRuntime } from "./runtimeFactory.js";

export async function runConnectorCanary(config: RuntimeConfig, requestedActionId: string): Promise<unknown> {
  const runtime = await createConnectorRuntime(config);
  try {
    const pre = runtime.normalize(await runtime.adapter.readCurrentState());
    if (pre.diagnostics.status === "invalid" || pre.currentState.stability !== "actionable") {
      throw new Error(`Connector canary requires an actionable valid state; observed ${pre.currentState.stability}`);
    }
    if (pre.currentState.actionAuthority !== "bridge_advertised") {
      throw new Error(`Connector canary requires bridge_advertised authority; observed ${pre.currentState.actionAuthority}`);
    }

    const allowedActions = buildAllowedActions(pre.currentState, pre.stateHash);
    const selectedAction = allowedActions.find((action) => action.id === requestedActionId);
    if (!selectedAction) {
      throw new Error(`Requested action is not advertised by the current state: ${requestedActionId}`);
    }

    const execution = await executeAdvertisedAction({
      pre,
      selectedAction,
      adapter: runtime.adapter,
      normalize: runtime.normalize,
      settlement: runtime.settlement
    });
    return {
      canary: "explicit_advertised_action",
      adapter: runtime.adapter.describe(),
      pre: stateSummary(pre),
      action: {
        id: selectedAction.id,
        kind: selectedAction.kind,
        label: selectedAction.label
      },
      outcome: execution.outcome,
      stage: execution.stage,
      ...(execution.stage === "preflight_failed" && execution.latest ? { successor: stateSummary(execution.latest) } : {}),
      ...(execution.stage === "settlement" ? {
        commandCompleted: execution.adapterResult.accepted,
        settlement: {
          status: execution.settlement.status,
          polls: execution.settlement.polls,
          elapsedMs: execution.settlement.elapsedMs
        },
        ...(execution.settlement.after ? { successor: stateSummary(execution.settlement.after) } : {})
      } : {}),
      ...(execution.error ? { error: execution.error } : {})
    };
  } finally {
    await runtime.release();
  }
}

function stateSummary(envelope: StateEnvelope): object {
  return {
    stateHash: envelope.stateHash,
    normalizedStateHash: envelope.normalizedStateHash,
    contextKind: envelope.currentState.context.kind,
    surfaceKind: envelope.currentState.surface.kind,
    ...(surfaceStage(envelope.currentState.surface) ? { stage: surfaceStage(envelope.currentState.surface) } : {}),
    stability: envelope.currentState.stability,
    actionAuthority: envelope.currentState.actionAuthority
  };
}

function surfaceStage(surface: StateEnvelope["currentState"]["surface"]): string | undefined {
  const value = (surface as { stage?: unknown }).stage;
  return typeof value === "string" ? value : undefined;
}
