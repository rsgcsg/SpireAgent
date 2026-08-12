import type { ExecutableGameAction } from "../domain/actions/action.js";
import type { StateEnvelope } from "../domain/state/index.js";
import type { GameAdapter, GameExecutionResult, RawGameState } from "../game-io/adapter.js";
import { TransientObservationError } from "../game-io/observationError.js";

export interface SuccessorObservationResult {
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

export class SuccessorWatcher<TAction extends { kind: string } = ExecutableGameAction> {
  constructor(
    private readonly adapter: GameAdapter<RawGameState, TAction, GameExecutionResult>,
    private readonly normalize: (raw: unknown) => StateEnvelope,
    private readonly config: {
      pollMs: number;
      defaultTimeoutMs: number;
      endTurnTimeoutMs: number;
      roomTransitionTimeoutMs: number;
    },
    private readonly sleep: (ms: number) => Promise<void> = defaultSleep
  ) {}

  async waitForReadySuccessor(
    before: StateEnvelope,
    action: TAction,
    settlementAuthority: GameExecutionResult["settlementAuthority"] = "client_observation_required",
    confirmedStateToken?: string,
    advertisedActionKind?: string
  ): Promise<SuccessorObservationResult> {
    const started = Date.now();
    const semanticKind = advertisedActionKind ?? action.kind;
    const timeoutMs = isEndTurn(semanticKind)
      ? this.config.endTurnTimeoutMs
      : isLongTransition(semanticKind)
        ? this.config.roomTransitionTimeoutMs
        : this.config.defaultTimeoutMs;
    let polls = 0;
    let last: StateEnvelope | undefined;
    let lastChanged: StateEnvelope | undefined;
    let stableCandidate: StateEnvelope | undefined;
    let transientObservationErrors = 0;
    let lastTransientObservationError: SuccessorObservationResult["lastTransientObservationError"];

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
      if (last.stateHash !== before.stateHash) lastChanged = last;
      if (settlementAuthority === "adapter_confirmed") {
        const beforeToken = environmentSnapshotId(before);
        const observedToken = environmentSnapshotId(last);
        if (confirmedStateToken
            && beforeToken
            && observedToken === beforeToken
            && confirmedStateToken !== beforeToken) {
          continue;
        }
        if (last.currentState.stability === "non_actionable") {
          return settled(last, polls, started, transientObservationErrors, lastTransientObservationError);
        }
        if (!isSemanticCheckpoint(last)) {
          stableCandidate = undefined;
          continue;
        }
        // The receipt proves action-local input delivery. Re still
        // waits for a repeatable actionable successor before spending another
        // model call; this observes quiescence without reconstructing native
        // legality or turning delivery into a business-completion claim.
        if (stableCandidate?.stateHash === last.stateHash) {
          return settled(last, polls, started, transientObservationErrors, lastTransientObservationError);
        }
        stableCandidate = last;
        continue;
      }
      if (last.stateHash === before.stateHash) continue;
      if (!isSemanticCheckpoint(last)) {
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
      ...(lastChanged ? { after: lastChanged } : {}),
      error: "State did not reach a visibly changed, non-transitional checkpoint before timeout",
      ...transientTelemetry(transientObservationErrors, lastTransientObservationError)
    };
  }
}

function settled(
  after: StateEnvelope,
  polls: number,
  started: number,
  transientObservationErrors: number,
  lastTransientObservationError: SuccessorObservationResult["lastTransientObservationError"]
): SuccessorObservationResult {
  return {
    status: "settled",
    polls,
    elapsedMs: Date.now() - started,
    after,
    ...transientTelemetry(transientObservationErrors, lastTransientObservationError)
  };
}

function environmentSnapshotId(envelope: StateEnvelope): string | undefined {
  return envelope.currentState.surface.kind === "player_environment"
    ? envelope.currentState.surface.snapshotId
    : undefined;
}

function isEndTurn(actionKind: string): boolean {
  return actionKind === "end_turn";
}

function isLongTransition(actionKind: string): boolean {
  return actionKind === "choose_map_node"
    || actionKind === "continue_run"
    || actionKind === "embark_standard_run";
}

function isSemanticCheckpoint(envelope: StateEnvelope): boolean {
  return envelope.currentState.stability === "actionable"
    || envelope.currentState.stability === "non_actionable";
}

function transientTelemetry(
  count: number,
  last: SuccessorObservationResult["lastTransientObservationError"]
): Pick<SuccessorObservationResult, "transientObservationErrors" | "lastTransientObservationError"> {
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
