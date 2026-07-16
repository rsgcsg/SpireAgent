import type { RawGameState } from "../../game-io/adapter.js";
import { isJsonObject, type JsonObject } from "../../shared/json.js";

// The adapter response is untrusted JSON. Strong game semantics begin only after normalization.
export type Sts2McpRawState = RawGameState;

export const BRIDGE_V2_WRAPPER_PROTOCOL = "bridge_v2_selected" as const;

export function wrapBridgeV2State(input: {
  state: JsonObject;
  capabilities: JsonObject;
  legacyState?: JsonObject;
}): Sts2McpRawState {
  return {
    adapter_protocol: BRIDGE_V2_WRAPPER_PROTOCOL,
    bridge_v2_state: input.state,
    bridge_v2_capabilities: input.capabilities,
    ...(input.legacyState ? { legacy_v1_state: input.legacyState } : {})
  };
}

export function isBridgeV2WrappedState(value: unknown): value is Sts2McpRawState {
  return isJsonObject(value)
    && value.adapter_protocol === BRIDGE_V2_WRAPPER_PROTOCOL
    && isJsonObject(value.bridge_v2_state)
    && isJsonObject(value.bridge_v2_capabilities);
}

export function bridgeV2StateFromWrapper(value: Sts2McpRawState): JsonObject | undefined {
  return isBridgeV2WrappedState(value) && isJsonObject(value.bridge_v2_state)
    ? value.bridge_v2_state
    : undefined;
}

export function bridgeV2CapabilitiesFromWrapper(value: Sts2McpRawState): JsonObject | undefined {
  return isBridgeV2WrappedState(value) && isJsonObject(value.bridge_v2_capabilities)
    ? value.bridge_v2_capabilities
    : undefined;
}

export function legacyStateFromBridgeV2Wrapper(value: Sts2McpRawState): JsonObject | undefined {
  return isBridgeV2WrappedState(value) && isJsonObject(value.legacy_v1_state)
    ? value.legacy_v1_state
    : undefined;
}
