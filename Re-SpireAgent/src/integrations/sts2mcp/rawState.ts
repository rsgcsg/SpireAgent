import type { RawGameState } from "../../game-io/adapter.js";
import { isJsonObject, type JsonObject } from "../../shared/json.js";
import {
  BRIDGE_V2_INSPECTION_KINDS,
  type BridgeV2InspectionKind
} from "./bridgeV2Protocol.js";

// The adapter response is untrusted JSON. Strong game semantics begin only after normalization.
export type Sts2McpRawState = RawGameState;

export const BRIDGE_V2_WRAPPER_PROTOCOL = "bridge_v2_selected" as const;

export function wrapBridgeV2State(input: {
  state: JsonObject;
  capabilities: JsonObject;
  legacyState?: JsonObject;
  inspections?: Partial<Record<BridgeV2InspectionKind, JsonObject>>;
  observation?: JsonObject;
}): Sts2McpRawState {
  return {
    adapter_protocol: BRIDGE_V2_WRAPPER_PROTOCOL,
    bridge_v2_state: input.state,
    bridge_v2_capabilities: input.capabilities,
    ...(input.observation ? { bridge_v2_observation: input.observation } : {}),
    ...(input.inspections ? { bridge_v2_inspections: input.inspections } : {}),
    ...(input.legacyState ? { legacy_v1_state: input.legacyState } : {})
  };
}

export function bridgeV2ObservationFromWrapper(value: Sts2McpRawState): JsonObject | undefined {
  return isBridgeV2WrappedState(value) && isJsonObject(value.bridge_v2_observation)
    ? value.bridge_v2_observation
    : undefined;
}

export function bridgeV2InspectionsFromWrapper(
  value: Sts2McpRawState
): Partial<Record<BridgeV2InspectionKind, JsonObject>> {
  if (!isJsonObject(value) || !isJsonObject(value.bridge_v2_inspections)) return {};
  const inspections: Partial<Record<BridgeV2InspectionKind, JsonObject>> = {};
  for (const kind of BRIDGE_V2_INSPECTION_KINDS) {
    const inspection = value.bridge_v2_inspections[kind];
    if (isJsonObject(inspection)) inspections[kind] = inspection;
  }
  return inspections;
}

export function bridgeV2InspectionIdentity(
  inspections: Partial<Record<BridgeV2InspectionKind, JsonObject>>
): Partial<Record<BridgeV2InspectionKind, JsonObject>> {
  return Object.fromEntries(Object.entries(inspections).map(([kind, inspection]) => {
    const { observed_at: _observedAt, ...stableInspection } = inspection;
    return [kind, stableInspection];
  })) as Partial<Record<BridgeV2InspectionKind, JsonObject>>;
}

export function bridgeV2CapabilitiesSidecarFromRaw(value: Sts2McpRawState): JsonObject | undefined {
  return isJsonObject(value) && isJsonObject(value.bridge_v2_capabilities)
    ? value.bridge_v2_capabilities
    : undefined;
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
