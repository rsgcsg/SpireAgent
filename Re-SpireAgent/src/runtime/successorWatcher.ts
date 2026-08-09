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

export class SuccessorWatcher {
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

  async waitForReadySuccessor(
    before: StateEnvelope,
    action: ExecutableGameAction,
    settlementAuthority: GameExecutionResult["settlementAuthority"] = "client_observation_required",
    confirmedStateToken?: string
  ): Promise<SuccessorObservationResult> {
    const started = Date.now();
    const timeoutMs = isEndTurn(action)
      ? this.config.endTurnTimeoutMs
      : isLongTransition(action)
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
        const beforeToken = bridgeStateToken(before);
        const observedToken = bridgeStateToken(last);
        if (confirmedStateToken
            && beforeToken
            && observedToken === beforeToken
            && confirmedStateToken !== beforeToken) {
          continue;
        }
        if (isCoherentUnsupportedSuccessor(before, last)
            || last.currentState.stability === "non_actionable") {
          return settled(last, polls, started, transientObservationErrors, lastTransientObservationError);
        }
        if (!isSemanticCheckpoint(last)) {
          stableCandidate = undefined;
          continue;
        }
        // Gateway completion proves the action-local native outcome. Re still
        // waits for a repeatable actionable successor before spending another
        // model call; this observes quiescence without reconstructing native
        // legality or broadening the Gateway's completion claim.
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

function bridgeStateToken(envelope: StateEnvelope): string | undefined {
  const surface = envelope.currentState.surface as { bridgeStateId?: unknown };
  if (typeof surface.bridgeStateId === "string") return surface.bridgeStateId;
  const observation = envelope.currentState.bridgeObservation;
  return typeof observation?.stateId === "string" ? observation.stateId : undefined;
}

function isCoherentUnsupportedSuccessor(
  before: StateEnvelope,
  after: StateEnvelope
): boolean {
  const beforeToken = bridgeStateToken(before);
  const afterToken = bridgeStateToken(after);
  return after.diagnostics.status !== "invalid"
    && after.currentState.surface.kind === "unsupported"
    && after.currentState.bridgeObservation?.coherent === true
    && typeof beforeToken === "string"
    && typeof afterToken === "string"
    && afterToken !== beforeToken;
}

function isEndTurn(action: ExecutableGameAction): boolean {
  return action.kind === "end_turn"
    || (action.kind === "bridge_v2_action" && action.bridgeActionKind === "end_turn")
    || (action.kind === "connector_v3_command" && action.operation === "end_turn");
}

function isLongTransition(action: ExecutableGameAction): boolean {
  return action.kind === "choose_map_node"
    || (action.kind === "bridge_v2_action"
      && (action.bridgeActionKind === "choose_map_node"
        || action.bridgeActionKind === "continue_run"
        || action.bridgeActionKind === "embark_standard_run"))
    || (action.kind === "connector_v3_command"
      && (action.operation === "choose_map_node"
        || action.operation === "continue_run"
        || action.operation === "embark_standard_run"));
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
