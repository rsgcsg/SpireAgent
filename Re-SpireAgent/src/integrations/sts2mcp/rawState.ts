import type { RawGameState } from "../../game-io/adapter.js";
import { isJsonObject, type JsonObject } from "../../shared/json.js";

/** Untrusted transport JSON selected by the current Human Environment adapter. */
export type HumanEnvironmentRawState = RawGameState;

export const HUMAN_ENVIRONMENT_WRAPPER_PROTOCOL = "human_environment_selected" as const;

export function wrapHumanEnvironmentState(input: {
  snapshot: JsonObject;
}): HumanEnvironmentRawState {
  return {
    adapter_protocol: HUMAN_ENVIRONMENT_WRAPPER_PROTOCOL,
    human_snapshot: input.snapshot
  };
}

export function isHumanEnvironmentWrappedState(
  value: unknown
): value is HumanEnvironmentRawState {
  return isJsonObject(value)
    && value.adapter_protocol === HUMAN_ENVIRONMENT_WRAPPER_PROTOCOL
    && isJsonObject(value.human_snapshot);
}
