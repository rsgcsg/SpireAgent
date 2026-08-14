import type { JsonObject } from "../../shared/json.js";
import type { NormalizedStateBase } from "./common.js";
import type { EnemySnapshot, MapNodeSnapshot } from "./entities.js";

/**
 * A's compact interpretation of current player-visible context. It is a
 * strategy projection, never C action authority.
 */
export type SemanticContext =
  | CombatContext
  | RewardFlowContext
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
  | CombatTransitionContext
  | RunTransitionContext
  | UnknownContext;

export interface CombatContext {
  kind: "combat";
  encounterType: "normal" | "elite" | "boss" | "unknown";
  round?: number;
  turnOwner: "player" | "enemy" | "unknown";
  isPlayPhase: boolean;
  enemies: EnemySnapshot[];
}
export interface RewardFlowContext {
  kind: "reward_flow";
  rewardKind: "card_reward" | "room_rewards";
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
export interface MenuContext { kind: "menu"; screen?: string; message?: string; }
export interface RunEndedContext {
  kind: "run_ended";
  message?: string;
  result?: "win" | "loss";
  gameMode?: "standard";
  score?: number;
  floorReached?: number;
  ascension?: number;
}
export interface CombatTransitionContext {
  kind: "combat_transition";
  phase: "setup" | "resolution";
}
export interface RunTransitionContext { kind: "run_transition"; phase: "setup"; }
export interface UnknownContext {
  kind: "unknown";
  reason: string;
  observedTopLevelKeys: string[];
}

export interface PlayerEnvironmentSurface {
  kind: "player_environment";
  snapshotId: string;
  interactionKind: string;
  stage: string;
  prompt?: string;
  interactionId: string;
  contentSchema: string;
  content: JsonObject;
  referents: Array<{
    referentId: string;
    role: string;
    kind: "entity" | "control";
    label?: string;
    visible: boolean;
    enabled?: boolean;
    selected?: boolean;
    focused?: boolean;
    observationBasis: "native_visible_fact";
    propertiesSchema?: string;
    properties?: unknown;
  }>;
  reads: Array<{
    readId: string;
    kind: string;
    targetReferentId?: string;
    contentSchema: string;
    visibilityBasis: string;
    snapshotBound: true;
    orderingSemantics: string;
    hiddenByPolicy: string[];
  }>;
  capabilities: Array<{
    verb: string;
    subjectRole?: string;
    arguments: Array<{ role: string; required: boolean }>;
    availabilityBasis: "current_native_interaction";
  }>;
  boundActionProjection: {
    status: "complete" | "truncated" | "unavailable";
    totalCount: number;
    limit: number;
    orderingSemantics: string;
  };
  boundActions: Array<{
    boundActionId: string;
    snapshotId: string;
    verb: string;
    label: string;
    subjectReferentId?: string;
    arguments: Array<{ role: string; referentId: string }>;
  }>;
  completeness: {
    status: "complete" | "partial" | "visible_unmapped" | "unknown";
    visibleInformation: string;
    interactionDiscovery: string;
    missing: string[];
    hiddenByPolicy: string[];
  };
}

export interface UnsupportedSurface {
  kind: "unsupported";
  reason: string;
  classification: "malformed_known_state";
  observedTopLevelKeys: string[];
}

export type InteractionSurface = PlayerEnvironmentSurface | UnsupportedSurface;

export interface NormalizedCurrentState extends NormalizedStateBase {
  context: SemanticContext;
  surface: InteractionSurface;
}

export type SemanticContextKind = SemanticContext["kind"];
export type InteractionSurfaceKind = InteractionSurface["kind"];
