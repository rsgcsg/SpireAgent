import type { NormalizedStateBase } from "./common.js";
import type {
  CardSnapshot,
  EnchantmentSnapshot,
  EnemySnapshot,
  IndexedOptionSnapshot,
  MapNodeSnapshot,
  RelicSnapshot,
  RewardSnapshot,
  ShopItemSnapshot
} from "./entities.js";

/** Stable game meaning. It deliberately excludes the currently open UI protocol. */
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
/** The reward flow is semantic context; the active reward UI owns its surface. */
export interface RewardFlowContext {
  kind: "reward_flow";
  rewardKind: "card_reward" | "room_rewards";
}
export interface RewardsContext { kind: "rewards"; }
export interface RestContext { kind: "rest"; }
export interface ShopContext {
  kind: "shop";
  gold?: number;
  maxPotionSlots?: number;
  potions?: Array<{
    entityId: string;
    id: string;
    name?: string;
    description?: string;
    slot: number;
  }>;
}
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

export interface UnknownContext {
  kind: "unknown";
  reason: string;
  observedTopLevelKeys: string[];
}

/** Current functional UI contract. This owns action availability, not strategic context. */
export type InteractionSurface =
  | CombatTurnSurface
  | CombatPileCardSelectionSurface
  | CombatHandCardSelectionSurface
  | EventCardAcquisitionSurface
  | GeneratedCardChoiceSurface
  | CardBundleSelectionSurface
  | CardSelectionSurface
  | DeckEnchantSelectionSurface
  | DeckRemovalSelectionSurface
  | RelicDeckRemovalSelectionSurface
  | RewardDeckRemovalSelectionSurface
  | DeckUpgradeSelectionSurface
  | DeckTransformSelectionSurface
  | WoodCarvingsReplacementSelectionSurface
  | CardRewardSelectionSurface
  | BridgeRewardClaimSurface
  | CardRewardSurface
  | RewardClaimSurface
  | MapNavigationSurface
  | EventDialogueSurface
  | EventOptionSurface
  | RestSiteSurface
  | ShopInventorySurface
  | ShopRoomSurface
  | TreasureRoomSurface
  | GameOverSurface
  | CharacterSelectSurface
  | MainMenuSurface
  | SingleplayerMenuSurface
  | OptionChoiceSurface
  | ShopInteractionSurface
  | TreasureClaimSurface
  | GridInteractionSurface
  | MenuChoiceSurface
  | NoActionSurface
  | UnsupportedSurface;

export interface BridgeSurfaceCompleteness {
  playerVisibleSemantics: string;
  legalActions: string;
  sources: string[];
  missing: string[];
}

export interface CombatTurnSurface {
  kind: "combat_turn";
  bridgeStateId?: string;
  roomEntityId?: string;
  canEndTurn?: boolean;
  legalActions?: BridgeLegalActionSnapshot[];
  completeness?: BridgeSurfaceCompleteness;
}

interface CombatPileCardSelectionSurfaceBase {
  kind: "combat_pile_card_selection";
  bridgeStateId: string;
  screenEntityId: string;
  prompt: string;
  sourceCardEntityId: string;
  pileType: "discard" | "draw";
  minimumSelections: number;
  maximumSelections: number;
  selectedCount: number;
  selectedCardEntityIds: string[];
  requireManualConfirmation: boolean;
  cancelable: boolean;
  cards: CardSnapshot[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

export type CombatPileCardSelectionSurface = CombatPileCardSelectionSurfaceBase & (
  | {
      purpose: "move_one_discard_card_to_draw_top";
      sourceKind: "headbutt";
      sourceCardDefinitionId: "HEADBUTT";
      destinationPile: "draw";
      destinationPosition: "top";
    }
  | {
      purpose: "move_one_discard_card_to_hand";
      sourceKind: "graveblast";
      sourceCardDefinitionId: "GRAVEBLAST";
      destinationPile: "hand";
      destinationPosition: "bottom";
      overflowDestination: "discard_if_hand_full";
    }
  | {
      purpose: "exhaust_one_draw_card";
      sourceKind: "cleanse";
      sourceCardDefinitionId: "CLEANSE";
      pileType: "draw";
      destinationPile: "exhaust";
      destinationPosition: "bottom";
    }
  | {
      purpose: "transform_one_draw_card_into_soul";
      sourceKind: "seance";
      sourceCardDefinitionId: "SEANCE";
      pileType: "draw";
      destinationPile: "draw";
      destinationPosition: "same_index";
      overflowDestination: null;
    }
  | {
      purpose: "move_bounded_discard_cards_to_hand";
      sourceKind: "dredge";
      sourceCardDefinitionId: "DREDGE";
      pileType: "discard";
      destinationPile: "hand";
      destinationPosition: "bottom";
      overflowDestination: null;
    }
);

export interface CombatHandCardSelectionSurface {
  kind: "combat_hand_card_selection";
  bridgeStateId: string;
  handEntityId: string;
  prompt: string;
  selectionMode: "simple_select" | "upgrade_select";
  minimumSelections: number;
  maximumSelections: number;
  selectedCount: number;
  selectedCardEntityIds: string[];
  requireManualConfirmation: boolean;
  isPeeking: boolean;
  cards: CardSnapshot[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Audited event choice that commits selected exact cards to the run deck. */
export interface EventCardAcquisitionSurface {
  kind: "event_card_acquisition";
  bridgeStateId: string;
  screenEntityId: string;
  prompt: string;
  destination: "run_deck";
  minimumSelections: number;
  maximumSelections: number;
  selectedCount: number;
  selectedCardEntityIds: string[];
  requireManualConfirmation: false;
  cards: CardSnapshot[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

interface GeneratedCardChoiceSurfaceBase {
  kind: "generated_card_choice";
  bridgeStateId: string;
  screenEntityId: string;
  prompt?: string;
  canSkip: boolean;
  isPeeking: boolean;
  cards: CardSnapshot[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Source-bound run-deck acquisition; it does not authorize combat generators. */
export interface GeneratedRunDeckCardChoiceSurface extends GeneratedCardChoiceSurfaceBase {
  purpose: "acquire_one_generated_card";
  sourceKind: "lead_paperweight";
  destination: "run_deck";
  selectedCardCostPolicy: "unchanged";
  overflowDestination?: undefined;
}

/** Source-bound native generated-card potion; full hands redirect to discard. */
export interface GeneratedCombatCardChoiceSurface extends GeneratedCardChoiceSurfaceBase {
  purpose: "choose_one_generated_combat_card";
  sourceKind: "colorless_potion" | "attack_potion" | "skill_potion" | "power_potion" | "splash";
  destination: "combat_hand";
  selectedCardCostPolicy: "free_this_turn";
  overflowDestination: "combat_discard_if_hand_full";
}

export type GeneratedCardChoiceSurface =
  | GeneratedRunDeckCardChoiceSurface
  | GeneratedCombatCardChoiceSurface;

/** Two-stage selection of one atomic visible package of cards. */
export interface CardBundleSelectionSurface {
  kind: "card_bundle_selection";
  stage: "choosing" | "preview";
  bridgeStateId: string;
  screenEntityId: string;
  prompt?: string;
  selectedBundleEntityId?: string;
  bundles: Array<{
    entityId: string;
    cards: CardSnapshot[];
  }>;
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

export interface CardSelectionSurface {
  kind: "card_selection";
  /** Observed interaction mode, not an MCP payload. The adapter binding remains in AllowedAction. */
  selectionMode: "combat" | "standard";
  sourceType: string;
  purpose: "combat_effect" | "reward" | "upgrade" | "remove" | "transform" | "duplicate" | "unknown";
  prompt?: string;
  options: CardSnapshot[];
  previewShowing: boolean;
  previewCards: CardSnapshot[];
  minimumSelections?: number;
  maximumSelections?: number;
  canConfirm: boolean;
  canCancel: boolean;
}

export interface BridgeLegalActionSnapshot {
  actionId: string;
  stateId: string;
  kind: string;
  label: string;
  authority: string;
  evidenceCode: string;
  entityBindings: Array<{
    role: string;
    entityId: string;
  }>;
  category?: string;
}

export interface DeckEnchantSelectionSurface {
  kind: "deck_enchant_selection";
  stage: "selecting" | "preview";
  bridgeStateId: string;
  screenEntityId: string;
  prompt?: string;
  minimumSelections: number;
  maximumSelections: number;
  selectedCount: number;
  selectedCardEntityIds: string[];
  cancelable: boolean;
  enchantment: EnchantmentSnapshot;
  cards: CardSnapshot[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Exact merchant removal child; not a universal deck selector. */
export interface DeckRemovalSelectionSurface {
  kind: "deck_removal_selection";
  stage: "selecting" | "preview";
  bridgeStateId: string;
  screenEntityId: string;
  prompt: string;
  minimumSelections: number;
  maximumSelections: number;
  selectedCount: number;
  selectedCardEntityIds: string[];
  cancelable: boolean;
  cards: CardSnapshot[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Exact Precise Scissors acquisition child; merchant service semantics do not apply. */
export interface RelicDeckRemovalSelectionSurface {
  kind: "relic_deck_removal_selection";
  stage: "selecting" | "preview";
  bridgeStateId: string;
  screenEntityId: string;
  prompt: string;
  minimumSelections: number;
  maximumSelections: number;
  selectedCount: number;
  selectedCardEntityIds: string[];
  cancelable: boolean;
  cards: CardSnapshot[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Exact CardRemovalReward child; producer and merchant service semantics do not apply. */
export interface RewardDeckRemovalSelectionSurface {
  kind: "reward_deck_removal_selection";
  stage: "selecting" | "preview";
  bridgeStateId: string;
  screenEntityId: string;
  prompt: string;
  minimumSelections: number;
  maximumSelections: number;
  selectedCount: number;
  selectedCardEntityIds: string[];
  cancelable: boolean;
  cards: CardSnapshot[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Purpose-specific deck upgrade selector with exact visible upgraded previews. */
export interface DeckUpgradeSelectionSurface {
  kind: "deck_upgrade_selection";
  stage: "selecting" | "preview";
  bridgeStateId: string;
  screenEntityId: string;
  prompt: string;
  minimumSelections: number;
  maximumSelections: number;
  selectedCount: number;
  selectedCardEntityIds: string[];
  cancelable: boolean;
  cards: CardSnapshot[];
  previewCards: CardSnapshot[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Random transform child with hidden committed replacement and explicit preview semantics. */
export interface DeckTransformSelectionSurface {
  kind: "deck_transform_selection";
  stage: "selecting" | "preview";
  bridgeStateId: string;
  screenEntityId: string;
  prompt: string;
  minimumSelections: number;
  maximumSelections: number;
  selectedCount: number;
  selectedCardEntityIds: string[];
  cancelable: boolean;
  upgradeToggleVisible: boolean;
  showingUpgradePreviews: boolean;
  previewKind: "none" | "random_uncommitted_cycle";
  replacementKnown: false;
  cards: CardSnapshot[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Wood Carvings deterministic starter replacement; never a random transform. */
export interface WoodCarvingsReplacementSelectionSurface {
  kind: "wood_carvings_replacement_selection";
  stage: "selecting" | "preview";
  bridgeStateId: string;
  screenEntityId: string;
  prompt: string;
  branch: "bird" | "torus";
  replacementDefinitionId: string;
  replacementName?: string;
  replacementDescription?: string;
  minimumSelections: 1;
  maximumSelections: 1;
  selectedCount: number;
  selectedCardEntityIds: string[];
  cards: CardSnapshot[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

export interface CardRewardSelectionSurface {
  kind: "card_reward_selection";
  bridgeStateId: string;
  screenEntityId: string;
  cards: CardSnapshot[];
  alternatives: Array<{
    entityId: string;
    index: number;
    label: string;
    enabled: boolean;
  }>;
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Bridge-authoritative outer room rewards; card choice is a separate surface. */
export interface BridgeRewardClaimSurface {
  kind: "reward_claim";
  bridgeStateId: string;
  screenEntityId: string;
  rewards: Array<{
    entityId: string;
    kind: "gold" | "potion" | "relic" | "card" | "other_visible_reward";
    label: string;
    description?: string;
    enabled: boolean;
  }>;
  potionSlotsFull: boolean;
  discardablePotions: Array<{
    entityId: string;
    id: string;
    name?: string;
    description?: string;
    slot: number;
  }>;
  canProceed: boolean;
  proceedSkipsRemainingRewards: boolean;
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

export interface CardRewardSurface { kind: "card_reward"; options: CardSnapshot[]; canSkip: boolean; canProceed: boolean; }
export interface RewardClaimSurface { kind: "reward_claim"; items: RewardSnapshot[]; canProceed: boolean; }
export interface MapNavigationSurface {
  kind: "map_navigation";
  nextOptions: MapNodeSnapshot[];
  bridgeStateId?: string;
  screenEntityId?: string;
  travelEnabled?: boolean;
  traveling?: boolean;
  drawingMode?: "none" | "drawing" | "erasing";
  legalActions?: BridgeLegalActionSnapshot[];
  completeness?: BridgeSurfaceCompleteness;
}

export interface EventOptionSurface {
  kind: "event_option";
  bridgeStateId: string;
  screenEntityId: string;
  options: Array<IndexedOptionSnapshot & {
    entityId: string;
    relicName?: string;
    relicDescription?: string;
    willKillPlayer: boolean;
    tooltips: Array<
      | { kind: "text"; name?: string; description?: string }
      | { kind: "card"; card: CardSnapshot }
    >;
  }>;
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Revealed prefix of an Ancient event dialogue; future lines are never projected. */
export interface EventDialogueSurface {
  kind: "event_dialogue";
  bridgeStateId: string;
  screenEntityId: string;
  currentLineIndex: number;
  revealedLines: Array<{
    entityId: string;
    index: number;
    text: string;
    speaker: "ancient" | "character" | "unknown";
    isCurrent: boolean;
  }>;
  advanceLabel: string;
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

export interface RestSiteSurface {
  kind: "rest_site";
  bridgeStateId: string;
  screenEntityId: string;
  options: Array<{
    entityId: string;
    index: number;
    optionId: string;
    name?: string;
    description?: string;
    enabled: boolean;
  }>;
  canProceed: boolean;
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

export interface BridgeShopOfferBase {
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

export interface ShopInventorySurface {
  kind: "shop_inventory";
  bridgeStateId: string;
  screenEntityId: string;
  cards: Array<BridgeShopOfferBase & {
    onSale: boolean;
    card?: CardSnapshot;
  }>;
  relics: Array<BridgeShopOfferBase & {
    relic?: RelicSnapshot;
  }>;
  potions: Array<BridgeShopOfferBase & {
    id?: string;
    name?: string;
    description?: string;
    rarity?: string;
  }>;
  cardRemoval?: BridgeShopOfferBase & {
    nextPriceIncrease: number;
  };
  canClose: boolean;
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

export interface ShopRoomSurface {
  kind: "shop_room";
  bridgeStateId: string;
  roomEntityId: string;
  canOpenInventory: boolean;
  canProceed: boolean;
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Purpose-specific Bridge treasure lifecycle; not the legacy indexed claim protocol. */
export interface TreasureRoomSurface {
  kind: "treasure_room";
  stage: "closed" | "opening" | "relic_choice" | "completed";
  bridgeStateId: string;
  roomEntityId: string;
  chestOpened: boolean;
  relics: Array<{
    entityId: string;
    id: string;
    name?: string;
    description?: string;
    rarity: string;
    keywords: Array<{ name: string; description?: string }>;
    cardPreviews: CardSnapshot[];
  }>;
  canSkip: boolean;
  canProceed: boolean;
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

export interface GameOverSurface {
  kind: "game_over";
  stage: "intro_animating" | "intro" | "summary_animating" | "summary";
  bridgeStateId: string;
  screenEntityId: string;
  returnDestination?: "main_menu" | "timeline";
  canAdvanceSummary: boolean;
  canReturn: boolean;
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

export interface CharacterSelectSurface {
  kind: "character_select";
  stage: "choosing" | "transitioning";
  bridgeStateId: string;
  screenEntityId: string;
  characters: Array<{
    entityId: string;
    index: number;
    characterId: string;
    name: string;
    locked: boolean;
    selected: boolean;
    random: boolean;
  }>;
  selectedDetails?: {
    characterId: string;
    title: string;
    description?: string;
    startingHp?: number;
    startingGold?: number;
    startingRelic?: {
      id: string;
      name?: string;
      description?: string;
    };
  };
  ascension?: number;
  ascensionTitle?: string;
  ascensionDescription?: string;
  canDecreaseAscension: boolean;
  canIncreaseAscension: boolean;
  canEmbark: boolean;
  canGoBack: boolean;
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

export interface VisibleMenuChoice {
  entityId: string;
  semanticId: string;
  label: string;
  description?: string;
  enabled: boolean;
  bridgeSupport: "actionable" | "visible_unsupported";
  blockedReason?: string;
}

/** Exact root menu facts and bounded standard single-player entry actions. */
export interface MainMenuSurface {
  kind: "main_menu";
  stage: "choosing" | "blocked";
  bridgeStateId: string;
  screenEntityId: string;
  choices: VisibleMenuChoice[];
  continueRun?: {
    characterId: string;
    characterName?: string;
    actId: string;
    actName?: string;
    floor: number;
    hp: number;
    maxHp: number;
    gold: number;
    ascension: number;
  };
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

/** Standard-run submenu; Daily and Custom remain visible unsupported facts. */
export interface SingleplayerMenuSurface {
  kind: "singleplayer_menu";
  stage: "choosing" | "blocked";
  bridgeStateId: string;
  screenEntityId: string;
  choices: VisibleMenuChoice[];
  legalActions: BridgeLegalActionSnapshot[];
  completeness: BridgeSurfaceCompleteness;
}

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
