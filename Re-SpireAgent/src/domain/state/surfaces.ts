import type { NormalizedStateBase } from "./common.js";
import type {
  CardSnapshot,
  EnemySnapshot,
  IndexedOptionSnapshot,
  MapNodeSnapshot,
  RewardSnapshot,
  ShopItemSnapshot
} from "./entities.js";

/** Stable game meaning. It deliberately excludes the currently open UI protocol. */
export type SemanticContext =
  | CombatContext
  | CardRewardContext
  | RewardsContext
  | MapContext
  | RestContext
  | EventContext
  | ShopContext
  | TreasureContext
  | CrystalSphereContext
  | MenuContext
  | RunEndedContext
  | PostCombatContext
  | UnknownContext;

export interface CombatContext {
  kind: "combat";
  encounterType: "normal" | "elite" | "boss" | "unknown";
  round?: number;
  turnOwner: "player" | "enemy" | "unknown";
  isPlayPhase: boolean;
  enemies: EnemySnapshot[];
}

export interface CardRewardContext { kind: "card_reward"; }
export interface RewardsContext { kind: "rewards"; }
export interface RestContext { kind: "rest"; }
export interface ShopContext { kind: "shop"; }
export interface TreasureContext { kind: "treasure"; }
export interface CrystalSphereContext { kind: "crystal_sphere"; }

export interface MapContext {
  kind: "map";
  currentPosition?: { col: number; row: number; type?: string };
  visited: MapNodeSnapshot[];
  nodes: MapNodeSnapshot[];
}

export interface EventContext {
  kind: "event";
  eventId?: string;
  name?: string;
  ancient?: boolean;
  inDialogue?: boolean;
  body?: string | null;
}

export interface MenuContext {
  kind: "menu";
  screen?: string;
  message?: string;
}

export interface RunEndedContext { kind: "run_ended"; message?: string; }
export interface PostCombatContext { kind: "post_combat"; }

export interface UnknownContext {
  kind: "unknown";
  reason: string;
  observedTopLevelKeys: string[];
}

/** Current functional UI contract. This owns action availability, not strategic context. */
export type InteractionSurface =
  | CombatTurnSurface
  | CardSelectionSurface
  | CardRewardSurface
  | RewardClaimSurface
  | MapNavigationSurface
  | OptionChoiceSurface
  | ShopInteractionSurface
  | TreasureClaimSurface
  | GridInteractionSurface
  | MenuChoiceSurface
  | NoActionSurface
  | UnsupportedSurface;

export interface CombatTurnSurface { kind: "combat_turn"; }

export interface CardSelectionSurface {
  kind: "card_selection";
  /** Observed interaction mode, not an MCP payload. The adapter binding remains in AllowedAction. */
  selectionMode: "combat" | "standard";
  sourceType: string;
  purpose: "combat_effect" | "reward" | "upgrade" | "remove" | "transform" | "duplicate" | "unknown";
  prompt?: string;
  options: CardSnapshot[];
  minimumSelections?: number;
  maximumSelections?: number;
  canConfirm: boolean;
  canCancel: boolean;
}

export interface CardRewardSurface { kind: "card_reward"; options: CardSnapshot[]; canSkip: boolean; canProceed: boolean; }
export interface RewardClaimSurface { kind: "reward_claim"; items: RewardSnapshot[]; canProceed: boolean; }
export interface MapNavigationSurface { kind: "map_navigation"; nextOptions: MapNodeSnapshot[]; }

export interface OptionChoiceSurface {
  kind: "option_choice";
  protocol: "event" | "rest";
  options: IndexedOptionSnapshot[];
  canProceed: boolean;
}

export interface ShopInteractionSurface { kind: "shop_interaction"; items: ShopItemSnapshot[]; canLeave: boolean; }
export interface TreasureClaimSurface {
  kind: "treasure_claim";
  relics: Array<{ index: number; id?: string; name?: string; description?: string }>;
  opened?: boolean;
  canProceed: boolean;
}

export interface GridInteractionSurface {
  kind: "grid_interaction";
  width: number;
  height: number;
  selectedTool: "big" | "small" | "unknown";
  canUseBigTool: boolean;
  canUseSmallTool: boolean;
  clickableCells: Array<{ x: number; y: number }>;
  revealedItems: Array<{ itemType?: string; x: number; y: number; width?: number; height?: number; good?: boolean }>;
  divinationsRemainingText?: string;
  canProceed: boolean;
}

export interface MenuChoiceSurface {
  kind: "menu_choice";
  options: Array<{ index: number; value: string | number; label: string; enabled: boolean }>;
}

export interface NoActionSurface {
  kind: "no_action";
  reason: "loading" | "settling" | "transitioning" | "non_actionable";
  message?: string;
  observedTopLevelKeys?: string[];
}

export interface UnsupportedSurface {
  kind: "unsupported";
  reason: string;
  classification: "unknown_context" | "unknown_surface" | "schema_drift" | "malformed_known_state" | "missing_action_protocol";
  observedTopLevelKeys: string[];
}

/** The normalizer constructs only compatibility-checked pairs. */
export interface NormalizedCurrentState extends NormalizedStateBase {
  context: SemanticContext;
  surface: InteractionSurface;
}

export type SemanticContextKind = SemanticContext["kind"];
export type InteractionSurfaceKind = InteractionSurface["kind"];
