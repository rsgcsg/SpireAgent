import type { RawGameState } from "../../game-io/adapter.js";
import { isJsonObject, type JsonObject } from "../../shared/json.js";

/** Untrusted transport JSON selected by the current Player Environment adapter. */
export type PlayerEnvironmentRawState = RawGameState;

export const PLAYER_ENVIRONMENT_WRAPPER_PROTOCOL = "player_environment_selected" as const;

export function wrapPlayerEnvironmentState(input: {
  snapshot: JsonObject;
}): PlayerEnvironmentRawState {
  return {
    adapter_protocol: PLAYER_ENVIRONMENT_WRAPPER_PROTOCOL,
    player_snapshot: input.snapshot
  };
}

export function isPlayerEnvironmentWrappedState(
  value: unknown
): value is PlayerEnvironmentRawState {
  return isJsonObject(value)
    && value.adapter_protocol === PLAYER_ENVIRONMENT_WRAPPER_PROTOCOL
    && isJsonObject(value.player_snapshot);
}
