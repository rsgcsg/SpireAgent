export * from "./common.js";
export * from "./entities.js";
export * from "./surfaces.js";

import type { AdapterDescriptor } from "../../game-io/adapter.js";
import type { NormalizationDiagnostics } from "../../normalization/diagnostics.js";
import type { JsonObject } from "../../shared/json.js";
import type { NormalizedCurrentState } from "./surfaces.js";

export interface StateEnvelope {
  envelopeSchemaVersion: 1 | 2;
  capturedAt: string;
  source: AdapterDescriptor;
  rawState: JsonObject;
  currentState: NormalizedCurrentState;
  diagnostics: NormalizationDiagnostics;
  /** Full adapter snapshot hash used by the fail-closed stale-state guard. */
  stateHash: string;
  /** Normalized-state hash used to compare semantic projections during audit. */
  normalizedStateHash: string;
}
