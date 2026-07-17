import type { ExecutableGameAction } from "../domain/actions/action.js";
import type { StateEnvelope } from "../domain/state/index.js";
import type { GameAdapter, GameExecutionResult, RawGameState } from "../game-io/adapter.js";
import { TransientObservationError } from "../game-io/observationError.js";

export interface SettlementResult {
  status: "settled" | "timeout" | "read_error";
  polls: number;
  elapsedMs: number;
  after?: StateEnvelope;
  error?: string;
  transientObservationErrors?: number;
  lastTransientObservationError?: {
    code: string;
    message: string;
  };
}

export class SettlementWatcher {
  constructor(
    private readonly adapter: GameAdapter<RawGameState, ExecutableGameAction, GameExecutionResult>,
    private readonly normalize: (raw: unknown) => StateEnvelope,
    private readonly config: {
      pollMs: number;
      defaultTimeoutMs: number;
      endTurnTimeoutMs: number;
      roomTransitionTimeoutMs: number;
    },
    private readonly sleep: (ms: number) => Promise<void> = defaultSleep
  ) {}

  async waitForNextState(before: StateEnvelope, action: ExecutableGameAction): Promise<SettlementResult> {
    const started = Date.now();
    const timeoutMs = isEndTurn(action)
      ? this.config.endTurnTimeoutMs
      : isRoomTransition(action)
        ? this.config.roomTransitionTimeoutMs
        : this.config.defaultTimeoutMs;
    let polls = 0;
    let last: StateEnvelope | undefined;
    let stableCandidate: StateEnvelope | undefined;
    let transientObservationErrors = 0;
    let lastTransientObservationError: SettlementResult["lastTransientObservationError"];

    while (Date.now() - started < timeoutMs) {
      await this.sleep(this.config.pollMs);
      polls += 1;
      try {
        last = this.normalize(await this.adapter.readCurrentState());
      } catch (error) {
        if (error instanceof TransientObservationError) {
          transientObservationErrors += 1;
          lastTransientObservationError = { code: error.code, message: safeError(error) };
          stableCandidate = undefined;
          continue;
        }
        return {
          status: "read_error",
          polls,
          elapsedMs: Date.now() - started,
          error: safeError(error),
          ...transientTelemetry(transientObservationErrors, lastTransientObservationError)
        };
      }
      if (last.stateHash === before.stateHash) continue;
      if (["loading", "settling", "transitioning"].includes(last.currentState.stability)) {
        stableCandidate = undefined;
        continue;
      }
      if (stableCandidate?.stateHash === last.stateHash) {
        return {
          status: "settled",
          polls,
          elapsedMs: Date.now() - started,
          after: last,
          ...transientTelemetry(transientObservationErrors, lastTransientObservationError)
        };
      }
      stableCandidate = last;
    }

    return {
      status: "timeout",
      polls,
      elapsedMs: Date.now() - started,
      ...(last ? { after: last } : {}),
      error: "State did not reach a visibly changed, non-transitional checkpoint before timeout",
      ...transientTelemetry(transientObservationErrors, lastTransientObservationError)
    };
  }
}

function isEndTurn(action: ExecutableGameAction): boolean {
  return action.kind === "end_turn"
    || (action.kind === "bridge_v2_action" && action.bridgeActionKind === "end_turn");
}

function isRoomTransition(action: ExecutableGameAction): boolean {
  return action.kind === "choose_map_node";
}

function transientTelemetry(
  count: number,
  last: SettlementResult["lastTransientObservationError"]
): Pick<SettlementResult, "transientObservationErrors" | "lastTransientObservationError"> {
  return count > 0
    ? { transientObservationErrors: count, ...(last ? { lastTransientObservationError: last } : {}) }
    : {};
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeError(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}
