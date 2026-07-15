import type { CurrentStateBase } from "./common.js";
import type {
  CardSnapshot,
  EnemySnapshot,
  IndexedOptionSnapshot,
  MapNodeSnapshot,
  RewardSnapshot,
  ShopItemSnapshot
} from "./entities.js";

export interface MenuCurrentState extends CurrentStateBase {
  kind: "menu";
  stability: "actionable" | "non_actionable" | "loading";
  menu: {
    screen?: string;
    message?: string;
    options: Array<{ index: number; value: string | number; label: string; enabled: boolean }>;
  };
}

export interface CombatCurrentState extends CurrentStateBase {
  kind: "combat";
  stability: "actionable" | "non_actionable" | "settling" | "invalid";
  player: NonNullable<CurrentStateBase["player"]>;
  combat: {
    round?: number;
    turnOwner: "player" | "enemy" | "unknown";
    isPlayPhase: boolean;
    enemies: EnemySnapshot[];
  };
}

export interface RewardsCurrentState extends CurrentStateBase {
  kind: "rewards";
  stability: "actionable" | "loading" | "settling" | "invalid";
  rewards: {
    items: RewardSnapshot[];
    canProceed: boolean;
  };
}

export interface CardRewardCurrentState extends CurrentStateBase {
  kind: "card_reward";
  stability: "actionable" | "loading" | "settling" | "invalid";
  cardReward: {
    options: CardSnapshot[];
    canSkip: boolean;
    canProceed: boolean;
  };
}

export interface CardSelectionCurrentState extends CurrentStateBase {
  kind: "card_selection";
  stability: "actionable" | "loading" | "settling" | "invalid";
  cardSelection: {
    sourceType: string;
    purpose: "combat_effect" | "reward" | "upgrade" | "remove" | "transform" | "duplicate" | "unknown";
    actionProtocol: "combat" | "standard";
    prompt?: string;
    options: CardSnapshot[];
    minimumSelections?: number;
    maximumSelections?: number;
    canConfirm: boolean;
    canCancel: boolean;
  };
}

export interface MapCurrentState extends CurrentStateBase {
  kind: "map";
  stability: "actionable" | "loading" | "settling" | "invalid";
  map: {
    currentPosition?: { col: number; row: number; type?: string };
    visited: MapNodeSnapshot[];
    nextOptions: MapNodeSnapshot[];
    nodes: MapNodeSnapshot[];
  };
}

export interface RestCurrentState extends CurrentStateBase {
  kind: "rest";
  stability: "actionable" | "loading" | "settling" | "invalid";
  rest: {
    options: IndexedOptionSnapshot[];
    canProceed: boolean;
  };
}

export interface EventCurrentState extends CurrentStateBase {
  kind: "event";
  stability: "actionable" | "loading" | "settling" | "invalid";
  event: {
    eventId?: string;
    name?: string;
    ancient?: boolean;
    inDialogue?: boolean;
    body?: string | null;
    options: IndexedOptionSnapshot[];
  };
}

export interface ShopCurrentState extends CurrentStateBase {
  kind: "shop";
  stability: "actionable" | "loading" | "settling" | "invalid";
  shop: {
    items: ShopItemSnapshot[];
    canLeave: boolean;
  };
}

export interface TreasureCurrentState extends CurrentStateBase {
  kind: "treasure";
  stability: "actionable" | "loading" | "settling" | "invalid";
  treasure: {
    relics: Array<{ index: number; id?: string; name?: string; description?: string }>;
    opened?: boolean;
    canProceed: boolean;
  };
}

export interface CrystalSphereCurrentState extends CurrentStateBase {
  kind: "crystal_sphere";
  stability: "actionable" | "loading" | "settling" | "invalid";
  crystalSphere: {
    width: number;
    height: number;
    selectedTool: "big" | "small" | "unknown";
    canUseBigTool: boolean;
    canUseSmallTool: boolean;
    clickableCells: Array<{ x: number; y: number }>;
    revealedItems: Array<{ itemType?: string; x: number; y: number; width?: number; height?: number; good?: boolean }>;
    divinationsRemainingText?: string;
    canProceed: boolean;
  };
}

export interface GameOverCurrentState extends CurrentStateBase {
  kind: "game_over";
  stability: "actionable" | "non_actionable";
  gameOver: {
    message?: string;
    options: Array<{ index: number; value: string | number; label: string }>;
  };
}

export interface TransitionCurrentState extends CurrentStateBase {
  kind: "transition";
  stability: "loading" | "settling" | "transitioning" | "non_actionable";
  transition: {
    message?: string;
    observedTopLevelKeys: string[];
  };
}

export interface UnknownCurrentState extends CurrentStateBase {
  kind: "unknown";
  stability: "unknown" | "invalid";
  unknown: {
    reason: string;
    observedTopLevelKeys: string[];
  };
}

export type NormalizedCurrentState =
  | MenuCurrentState
  | CombatCurrentState
  | RewardsCurrentState
  | CardRewardCurrentState
  | CardSelectionCurrentState
  | MapCurrentState
  | RestCurrentState
  | EventCurrentState
  | ShopCurrentState
  | TreasureCurrentState
  | CrystalSphereCurrentState
  | GameOverCurrentState
  | TransitionCurrentState
  | UnknownCurrentState;

export type CurrentStateKind = NormalizedCurrentState["kind"];
