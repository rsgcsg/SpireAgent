import type { AllowedAction } from "../domain/actions/allowedAction.js";
import type { ExecutableGameAction } from "../domain/actions/action.js";
import type { StateEnvelope } from "../domain/state/index.js";
import type { GameAdapter, GameExecutionResult, RawGameState } from "../game-io/adapter.js";
import type { SettlementResult, SettlementWatcher } from "./settlementWatcher.js";

export type AdvertisedActionExecution =
  | {
      readonly stage: "preflight_failed";
      readonly outcome: "not_executed_stale_state";
      readonly error: string;
      readonly latest?: StateEnvelope;
    }
  | {
      readonly stage: "execution_failed";
      readonly outcome: "execution_failed";
      readonly error: string;
    }
  | {
      readonly stage: "adapter_terminal";
      readonly outcome: "execution_failed" | "executed_unsettled";
      readonly adapterResult: GameExecutionResult;
      readonly error: string;
    }
  | {
      readonly stage: "settlement";
      readonly outcome: "executed_and_settled" | "executed_checkpoint_pending" | "executed_unsettled";
      readonly adapterResult: GameExecutionResult;
      readonly settlement: SettlementResult;
      readonly error?: string;
    };

/**
 * The single Re-side execution boundary for an action advertised by the
 * current observation. It adds no game legality: the Gateway remains the
 * authority and revalidates again when the command is submitted.
 */
export async function executeAdvertisedAction(input: {
  readonly pre: StateEnvelope;
  readonly selectedAction: AllowedAction;
  readonly adapter: GameAdapter<RawGameState, ExecutableGameAction, GameExecutionResult>;
  readonly normalize: (raw: unknown) => StateEnvelope;
  readonly settlement: SettlementWatcher;
}): Promise<AdvertisedActionExecution> {
  let latest: StateEnvelope;
  try {
    latest = input.normalize(await input.adapter.readCurrentState());
  } catch (error) {
    return {
      stage: "preflight_failed",
      outcome: "not_executed_stale_state",
      error: `Could not re-read state before execution: ${safeError(error)}`
    };
  }

  if (latest.stateHash !== input.pre.stateHash || input.selectedAction.sourceStateHash !== latest.stateHash) {
    return {
      stage: "preflight_failed",
      outcome: "not_executed_stale_state",
      latest,
      error: "State changed after action selection and before execution"
    };
  }

  let adapterResult: GameExecutionResult;
  try {
    adapterResult = await input.adapter.execute(input.selectedAction.action);
  } catch (error) {
    return {
      stage: "execution_failed",
      outcome: "execution_failed",
      error: safeError(error)
    };
  }

  if (!adapterResult.accepted) {
    const unknown = adapterResult.outcome === "unknown";
    return {
      stage: "adapter_terminal",
      outcome: unknown ? "executed_unsettled" : "execution_failed",
      adapterResult,
      error: unknown
        ? "Adapter command outcome is unknown; the action will not be retried automatically"
        : "Adapter rejected the selected action"
    };
  }

  const settlement = await input.settlement.waitForNextState(
    input.pre,
    input.selectedAction.action,
    adapterResult.settlementAuthority,
    adapterResult.confirmedStateToken
  );
  const bridgeCheckpointPending = adapterResult.settlementAuthority === "adapter_confirmed"
    && settlement.status !== "settled";
  const outcome = settlement.status === "settled"
    ? "executed_and_settled"
    : bridgeCheckpointPending
      ? "executed_checkpoint_pending"
      : "executed_unsettled";
  return {
    stage: "settlement",
    outcome,
    adapterResult,
    settlement,
    ...(settlement.error ? { error: settlement.error } : {})
  };
}

function safeError(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}
