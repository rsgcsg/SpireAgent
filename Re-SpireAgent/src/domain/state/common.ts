import type { PlayerSnapshot } from "./entities.js";

export const NORMALIZED_STATE_SCHEMA_VERSION = 4 as const;

export type StateStability =
  | "actionable"
  | "non_actionable"
  | "loading"
  | "settling"
  | "transitioning"
  | "invalid"
  | "unknown";

export type ActionAuthority = "local_reconstruction" | "bridge_advertised" | "none";

export interface BridgeDiagnosticSnapshot {
  source: "state" | "capabilities";
  code: string;
  severity: "info" | "warning" | "error";
  category: "identity" | "compatibility" | "context" | "surface" | "visibility" | "completeness" | "action" | "completion" | "runtime";
  effect: "none" | "field_omitted" | "actions_suppressed" | "surface_unsupported" | "outcome_unknown";
  recoverability: "settle" | "change_surface" | "restart" | "update_bridge" | "unknown";
  path?: string;
  visibilityClass?: "on_screen" | "normal_inspection" | "count_only" | "hidden";
  requiredForAction?: boolean;
  safeDetail?: string;
}

export interface BridgeInspectionPolicySnapshot {
  status: "disabled_not_implemented";
  stateBound: true;
  arbitraryQueriesAllowed: false;
  entersCommandLedger: false;
  visibilityClasses: Array<"on_screen" | "normal_inspection" | "count_only">;
  orderingSemantics: Array<"unordered_multiset" | "player_sorted">;
  implementedKinds: [];
}

export interface RunSnapshot {
  runId?: string;
  characterId?: string;
  act?: number;
  floor?: number;
  ascension?: number;
  seed?: string;
}

export interface NormalizedStateBase {
  normalizedSchemaVersion: typeof NORMALIZED_STATE_SCHEMA_VERSION;
  sourceStateType: string;
  stability: StateStability;
  actionAuthority: ActionAuthority;
  run?: RunSnapshot;
  player?: PlayerSnapshot;
  bridgeDiagnostics?: BridgeDiagnosticSnapshot[];
  bridgeLegacyWarnings?: string[];
  bridgeInspectionPolicy?: BridgeInspectionPolicySnapshot;
}
