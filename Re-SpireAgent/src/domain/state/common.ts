import type { PlayerSnapshot } from "./entities.js";

import type { CardSnapshot } from "./entities.js";

export const NORMALIZED_STATE_SCHEMA_VERSION = 16 as const;

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
  source: "state" | "capabilities" | "inspection";
  code: string;
  severity: "info" | "warning" | "error";
  category: "identity" | "compatibility" | "authority" | "context" | "surface" | "visibility" | "completeness" | "action" | "completion" | "runtime";
  effect: "none" | "field_omitted" | "actions_suppressed" | "surface_unsupported" | "outcome_unknown";
  recoverability: "settle" | "change_surface" | "restart" | "update_bridge" | "legacy_adapter" | "unknown";
  path?: string;
  visibilityClass?: "on_screen" | "normal_inspection" | "count_only" | "hidden";
  requiredForAction?: boolean;
  safeDetail?: string;
}

export interface BridgeInspectionPolicySnapshot {
  status:
    | "implemented_read_only"
    | "qualified_read_only_scoped"
    | "mixed_scoped_read_only"
    | "candidate_read_only_canary"
    | "disabled_for_current_build";
  stateBound: true;
  arbitraryQueriesAllowed: false;
  entersCommandLedger: false;
  visibilityClasses: Array<"on_screen" | "normal_inspection" | "count_only">;
  orderingSemantics: Array<"unordered_multiset" | "player_sorted">;
  implementedKinds: Array<"run_deck" | "combat_piles">;
}

export interface BridgeInspectionEvidenceSnapshot {
  inspectionId: string;
  kind: "run_deck" | "combat_piles";
  expectedStateId: string;
  observedStateId: string;
  visibilityClass: "normal_inspection";
  orderingSemantics: "unordered_multiset";
  playerVisibleSemantics: string;
  sources: string[];
  missing: string[];
}

/**
 * Player-visible, state-bound inspection content. This stays separate from
 * semantic context and never creates a synthetic full PlayerSnapshot.
 */
export interface BridgeInspectionFactsSnapshot {
  runDeck?: CardSnapshot[];
  drawPile?: CardSnapshot[];
  discardPile?: CardSnapshot[];
  exhaustPile?: CardSnapshot[];
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
  bridgeInspections?: BridgeInspectionEvidenceSnapshot[];
  bridgeInspectionFacts?: BridgeInspectionFactsSnapshot;
}
