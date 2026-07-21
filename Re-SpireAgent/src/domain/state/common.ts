import type { CardSnapshot, PlayerSnapshot, RelicSnapshot } from "./entities.js";

export const NORMALIZED_STATE_SCHEMA_VERSION = 25 as const;

export type StateStability =
  | "actionable"
  | "non_actionable"
  | "loading"
  | "settling"
  | "transitioning"
  | "invalid"
  | "unknown";

export type ActionAuthority = "local_reconstruction" | "bridge_advertised" | "none";
export type BridgeInspectionKind = "run_deck" | "combat_piles" | "shop_catalog";

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
  orderingSemantics: Array<"unordered_multiset" | "player_sorted" | "fixed_ui_slots">;
  implementedKinds: BridgeInspectionKind[];
}

export interface BridgeInspectionEvidenceSnapshot {
  inspectionId: string;
  kind: BridgeInspectionKind;
  expectedStateId: string;
  observedStateId: string;
  visibilityClass: "normal_inspection";
  orderingSemantics: "unordered_multiset" | "fixed_ui_slots";
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
  shopCatalog?: BridgeShopCatalogSnapshot;
}

export interface BridgeShopCatalogOfferBaseSnapshot {
  entityId: string;
  slotEntityId: string;
  inventoryIndex: number;
  price: number;
  stocked: boolean;
  visible: boolean;
  affordable: boolean;
  canPurchase: boolean;
  blockedReason?: "sold_out" | "already_used" | "not_visible" | "insufficient_gold"
    | "potion_slots_full" | "potion_procurement_forbidden" | "ui_control_disabled";
}

export interface BridgeShopCatalogSnapshot {
  accessState: "inventory_open" | "inventory_closed_open_to_inspect";
  cards: Array<BridgeShopCatalogOfferBaseSnapshot & { onSale: boolean; card?: CardSnapshot }>;
  relics: Array<BridgeShopCatalogOfferBaseSnapshot & { relic?: RelicSnapshot }>;
  potions: Array<BridgeShopCatalogOfferBaseSnapshot & {
    id?: string;
    name?: string;
    description?: string;
    rarity?: string;
  }>;
  cardRemoval?: BridgeShopCatalogOfferBaseSnapshot & { nextPriceIncrease: number };
}

export interface BridgeInspectionCatalogEntrySnapshot {
  kind: BridgeInspectionKind;
  scope: "active_run" | "current_combat" | "current_shop";
  availability: "qualified" | "canary";
  visibilityBasis: string;
  stateBound: true;
  createsActionAuthority: false;
  orderingSemantics: "unordered_multiset" | "fixed_ui_slots";
  estimatedCost: "low" | "medium" | "high";
  recommendedFor: string[];
  hiddenByPolicy: string[];
}

export interface BridgeVisibilitySnapshot {
  profileId: string;
  coreStatus: "complete" | "partial";
  playerVisibleClosureStatus: "complete" | "partial_catalog" | "partial";
  availableInspections: BridgeInspectionKind[];
  linkedDetailKinds: string[];
  hiddenByPolicy: string[];
  missing: string[];
  unknownCriticalFieldBehavior: "fail_closed";
}

export interface BridgeObservationSnapshot {
  observationId: string;
  coherent: true;
  stateId: string;
  inspectionKinds: BridgeInspectionKind[];
}

export interface BridgeContractInstanceShadowSnapshot {
  status: "resolved_manifest_contract" | "unresolved";
  instanceId: string;
  surfaceKind: string;
  semanticContractId?: string;
  declaredBinding?: string;
  operations: Array<{
    operation: string;
    evidenceStatus: "surface_level_only" | "source_audited" | "organic_canary_exercised" | "organic_qualified" | "unregistered";
    published: boolean;
  }>;
  currentAuthorityTier: "qualified" | "canary" | "observation_only" | "disabled";
  currentAuthorityBasis: "exact_environment_surface_operation_gate";
  authorizing: false;
  limitations: string[];
}

export interface RunSnapshot {
  runId?: string;
  characterId?: string;
  act?: number;
  actId?: string;
  actName?: string;
  floor?: number;
  ascension?: number;
  seed?: string;
  bosses?: Array<{ id: string; name?: string; order: number }>;
  modifiers?: Array<{
    id: string;
    name?: string;
    description?: string;
    keywords: Array<{ name: string; description?: string }>;
    cardPreviews?: CardSnapshot[];
  }>;
}

export interface BridgeSharedStateEvidenceSnapshot {
  scope: "active_single_player_run";
  playerVisibleSemantics: string;
  sources: string[];
  missing: string[];
}

export interface NormalizedStateBase {
  normalizedSchemaVersion: typeof NORMALIZED_STATE_SCHEMA_VERSION;
  sourceStateType: string;
  stability: StateStability;
  actionAuthority: ActionAuthority;
  run?: RunSnapshot;
  player?: PlayerSnapshot;
  bridgeSharedStateEvidence?: BridgeSharedStateEvidenceSnapshot;
  bridgeDiagnostics?: BridgeDiagnosticSnapshot[];
  bridgeLegacyWarnings?: string[];
  bridgeInspectionPolicy?: BridgeInspectionPolicySnapshot;
  bridgeInspections?: BridgeInspectionEvidenceSnapshot[];
  bridgeInspectionFacts?: BridgeInspectionFactsSnapshot;
  bridgeVisibility?: BridgeVisibilitySnapshot;
  bridgeInspectionCatalog?: BridgeInspectionCatalogEntrySnapshot[];
  bridgeObservation?: BridgeObservationSnapshot;
  bridgeContractInstanceShadow?: BridgeContractInstanceShadowSnapshot;
}
