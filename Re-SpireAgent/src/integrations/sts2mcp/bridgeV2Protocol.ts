import { z } from "zod";
import { isJsonObject, type JsonObject } from "../../shared/json.js";

export const SUPPORTED_BRIDGE_V2_PROTOCOL = "2.0-preview.55" as const;
export const BRIDGE_V2_INSPECTION_KINDS = ["run_deck", "combat_piles", "shop_catalog"] as const;
const inspectionKindSchema = z.enum(BRIDGE_V2_INSPECTION_KINDS);

const actionPermissionScopeSchema = z.object({
  surface_kind: z.string().min(1),
  operation: z.string().min(1),
  tier: z.enum(["qualified", "canary"])
}).passthrough();

const compatibilitySchema = z.object({
  status: z.string().min(1),
  tested_game_versions: z.array(z.string().min(1)),
  tested_build_fingerprints: z.array(z.string().min(1)),
  action_execution_allowed: z.boolean(),
  state_observation_allowed: z.boolean(),
  inspection_allowed: z.boolean(),
  action_execution_surface_kinds: z.array(z.string().min(1)),
  action_canary_surface_kinds: z.array(z.string().min(1)),
  inspection_allowed_kinds: z.array(inspectionKindSchema),
  inspection_canary_kinds: z.array(inspectionKindSchema),
  observation_only_surface_kinds: z.array(z.string().min(1)),
  observation_candidate_build_fingerprints: z.array(z.string().min(1)),
  detail: z.string(),
  action_permission_scopes: z.array(actionPermissionScopeSchema)
}).passthrough();

const loadedModAssemblySchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1).nullable().optional(),
  module_version_id: z.string().min(1)
}).passthrough();

const loadedModSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1).nullable().optional(),
  source: z.string().min(1),
  load_state: z.string().min(1),
  affects_gameplay: z.boolean(),
  // Steam Workshop IDs exceed JavaScript's exact integer range.
  workshop_id: z.string().regex(/^\d+$/u).nullable().optional(),
  assemblies: z.array(loadedModAssemblySchema)
}).passthrough();

const modsetSchema = z.object({
  status: z.string().min(1),
  fingerprint: z.string().min(1),
  fingerprint_scope: z.string().min(1),
  exact_permission_eligible: z.boolean(),
  mods: z.array(loadedModSchema),
  detail: z.string().min(1)
}).passthrough();

const gameSchema = z.object({
  version: z.string().nullable().optional(),
  commit: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  main_assembly_hash: z.number().int().nullable().optional(),
  compatibility: compatibilitySchema,
  modset: modsetSchema
}).passthrough();

const bridgeIdentitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  upstream_commit: z.string().min(1),
  module_version_id: z.string().min(1),
  assembly_file_sha256: z.string().regex(/^[a-f0-9]{64}$/iu),
  runtime_instance_id: z.string().min(1)
}).passthrough();

const authorityHandoffSchema = z.object({
  status: z.enum(["bridge_owned", "none_fail_closed"]),
  surface_kind: z.string().min(1).nullable().optional(),
  reason: z.string().min(1)
}).passthrough();

const visibleEnchantmentSchema = z.object({
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amount: z.number().int(),
  observation_source: z.string().optional()
}).passthrough();

const visibleCardSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  type: z.string(),
  cost: z.string(),
  star_cost: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  rarity: z.string(),
  is_upgraded: z.boolean(),
  is_selected: z.boolean(),
  existing_enchantment: visibleEnchantmentSchema.nullable().optional(),
  target_type: z.string().nullable().optional(),
  can_play: z.boolean().nullable().optional(),
  unplayable_reason: z.string().nullable().optional()
}).passthrough();

const visibleStatusSchema = z.object({
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  amount: z.number(),
  type: z.string(),
  description: z.string().nullable().optional()
}).passthrough();

const visibleIntentSchema = z.object({
  type: z.string().min(1),
  label: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional()
}).passthrough();

const visibleEnemySchema = z.object({
  entity_id: z.string().min(1),
  combat_id: z.number().int().nonnegative().nullable().optional(),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  hp: z.number(),
  max_hp: z.number(),
  block: z.number(),
  statuses: z.array(visibleStatusSchema),
  intents: z.array(visibleIntentSchema)
}).passthrough();

const visiblePotionSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  slot: z.number().int().nonnegative(),
  target_type: z.string(),
  can_use: z.boolean(),
  automatic: z.boolean()
}).passthrough();

const visibleKeywordSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional()
}).passthrough();

const visibleRelicSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  counter: z.number().nullable().optional(),
  keywords: z.array(visibleKeywordSchema),
  card_previews: z.array(visibleCardSchema)
}).passthrough();

const visibleTreasureRelicSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  rarity: z.string().min(1),
  keywords: z.array(visibleKeywordSchema),
  card_previews: z.array(visibleCardSchema)
}).passthrough();

const visibleOrbSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  passive_value: z.number(),
  evoke_value: z.number()
}).passthrough();

const visibleCombatPlayerSchema = z.object({
  player_entity_id: z.string().min(1),
  block: z.number(),
  energy: z.number().int(),
  max_energy: z.number().int(),
  stars: z.number().int().nullable().optional(),
  hand: z.array(visibleCardSchema),
  draw_pile_count: z.number().int().nonnegative(),
  discard_pile_count: z.number().int().nonnegative(),
  exhaust_pile_count: z.number().int().nonnegative(),
  statuses: z.array(visibleStatusSchema),
  companions: z.array(z.object({
    entity_id: z.string().min(1),
    definition_id: z.string().min(1),
    name: z.string().nullable().optional(),
    is_alive: z.boolean(),
    health_bar_visible: z.boolean(),
    hp: z.number().nullable().optional(),
    max_hp: z.number().nullable().optional(),
    block: z.number(),
    statuses: z.array(visibleStatusSchema)
  }).passthrough()),
  potion_states: z.array(z.object({
    entity_id: z.string().min(1),
    target_type: z.string(),
    can_use: z.boolean(),
    automatic: z.boolean()
  }).passthrough()),
  orbs: z.array(visibleOrbSchema),
  orb_slots: z.number().int().nonnegative().nullable().optional()
}).passthrough();

const eventContextSchema = z.object({
  kind: z.literal("event"),
  event_id: z.string().min(1),
  name: z.string().nullable().optional(),
  ancient: z.boolean(),
  in_dialogue: z.boolean(),
  body: z.string().nullable().optional()
}).passthrough();

const combatContextSchema = z.object({
  kind: z.literal("combat"),
  encounter_type: z.enum(["normal", "elite", "boss", "unknown"]),
  round: z.number().int().nonnegative(),
  turn_owner: z.string().min(1),
  is_play_phase: z.boolean(),
  player: visibleCombatPlayerSchema,
  enemies: z.array(visibleEnemySchema)
}).passthrough();

const rewardFlowContextSchema = z.object({
  kind: z.literal("reward_flow"),
  reward_kind: z.enum(["card_reward", "room_rewards"])
}).passthrough();

const restContextSchema = z.object({
  kind: z.literal("rest")
}).passthrough();

const treasureContextSchema = z.object({
  kind: z.literal("treasure")
}).passthrough();

const gameOverContextSchema = z.object({
  kind: z.literal("game_over"),
  result: z.enum(["win", "loss"]),
  game_mode: z.literal("standard"),
  score: z.number().int().nonnegative().nullable().optional(),
  floor_reached: z.number().int().nonnegative().nullable().optional(),
  ascension: z.number().int().nonnegative().nullable().optional()
}).passthrough();

const menuContextSchema = z.object({
  kind: z.literal("menu"),
  flow: z.enum(["root_navigation", "standard_run_setup"])
}).passthrough();

const visibleOwnedPotionSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  slot: z.number().int().nonnegative(),
  keywords: z.array(visibleKeywordSchema),
  card_previews: z.array(visibleCardSchema)
}).passthrough();

const shopContextSchema = z.object({
  kind: z.literal("shop")
}).passthrough();

const sharedVisibleStateSchema = z.object({
  scope: z.literal("active_single_player_run"),
  run: z.object({
    act: z.number().int().positive(),
    act_definition_id: z.string().min(1),
    act_name: z.string().nullable().optional(),
    floor: z.number().int().nonnegative(),
    ascension: z.number().int().nonnegative(),
    bosses: z.array(z.object({
      definition_id: z.string().min(1),
      name: z.string().nullable().optional(),
      order: z.number().int().nonnegative()
    }).passthrough()),
    modifiers: z.array(z.object({
      definition_id: z.string().min(1),
      name: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      keywords: z.array(visibleKeywordSchema),
      card_previews: z.array(visibleCardSchema)
    }).passthrough())
  }).passthrough(),
  player: z.object({
    entity_id: z.string().min(1),
    character_definition_id: z.string().min(1),
    character_name: z.string().nullable().optional(),
    hp: z.number(),
    max_hp: z.number(),
    gold: z.number().int().nonnegative(),
    relics: z.array(visibleRelicSchema),
    potions: z.array(visibleOwnedPotionSchema),
    max_potion_slots: z.number().int().nonnegative()
  }).passthrough(),
  completeness: z.object({
    player_visible_semantics: z.string().min(1),
    sources: z.array(z.string().min(1)),
    missing: z.array(z.string().min(1))
  }).passthrough()
}).passthrough();

// Keep declaration generation bounded while preserving the full schema and
// restoring its exact public type on BridgeV2State below.
const stateSharedVisibleStateSchema: z.ZodTypeAny = sharedVisibleStateSchema;

const visibleMapCoordinateSchema = z.object({
  col: z.number().int(),
  row: z.number().int(),
  point_type: z.string().min(1).nullable().optional()
}).passthrough();

const visibleMapNodeSchema = z.object({
  entity_id: z.string().min(1),
  col: z.number().int(),
  row: z.number().int(),
  point_type: z.string().min(1),
  state: z.enum(["none", "travelable", "traveled", "untravelable"]),
  children: z.array(visibleMapCoordinateSchema)
}).passthrough();

const mapContextSchema = z.object({
  kind: z.literal("map"),
  act_index: z.number().int().nonnegative(),
  // System.Text.Json omits nullable record fields. A newly opened or
  // transitioning map legitimately has no current coordinate yet.
  current_position: visibleMapCoordinateSchema.nullable().optional(),
  visited: z.array(visibleMapCoordinateSchema),
  nodes: z.array(visibleMapNodeSchema)
}).passthrough();

const combatTransitionContextSchema = z.discriminatedUnion("phase", [
  z.object({
    kind: z.literal("combat_transition"),
    phase: z.literal("setup"),
    transition: z.literal("awaiting_combat_start")
  }).passthrough(),
  z.object({
    kind: z.literal("combat_transition"),
    phase: z.literal("resolution"),
    transition: z.literal("awaiting_room_resolution")
  }).passthrough()
]);

const unknownContextSchema = z.object({
  kind: z.literal("unknown"),
  source_type: z.string(),
  reason: z.string()
}).passthrough();

const contextBaseSchema = z.object({ kind: z.string().min(1) }).passthrough();

const deckEnchantSurfaceSchema = z.object({
  kind: z.literal("deck_enchant_selection"),
  stage: z.enum(["selecting", "preview"]),
  screen_entity_id: z.string().min(1),
  prompt: z.string().nullable().optional(),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().nonnegative(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  cancelable: z.boolean(),
  enchantment: visibleEnchantmentSchema,
  cards: z.array(visibleCardSchema)
}).passthrough();

const deckRemovalSurfaceSchema = z.object({
  kind: z.literal("deck_removal_selection"),
  stage: z.enum(["selecting", "preview"]),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().nonnegative(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  cancelable: z.boolean(),
  cards: z.array(visibleCardSchema)
}).passthrough();

const deckUpgradeSurfaceSchema = z.object({
  kind: z.literal("deck_upgrade_selection"),
  stage: z.enum(["selecting", "preview"]),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().nonnegative(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  cancelable: z.boolean(),
  cards: z.array(visibleCardSchema),
  preview_cards: z.array(visibleCardSchema)
}).passthrough();

const deckTransformSurfaceSchema = z.object({
  kind: z.literal("deck_transform_selection"),
  stage: z.enum(["selecting", "preview"]),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().nonnegative(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  cancelable: z.boolean(),
  upgrade_toggle_visible: z.boolean(),
  showing_upgrade_previews: z.boolean(),
  preview_kind: z.enum(["none", "random_uncommitted_cycle"]),
  replacement_known: z.literal(false),
  cards: z.array(visibleCardSchema)
}).passthrough();

const visibleEventOptionSchema = z.object({
  entity_id: z.string().min(1),
  index: z.number().int().nonnegative(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_locked: z.boolean(),
  is_proceed: z.boolean(),
  was_chosen: z.boolean(),
  will_kill_player: z.boolean(),
  relic_name: z.string().nullable().optional(),
  relic_description: z.string().nullable().optional(),
  tooltips: z.array(z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("text"),
      name: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      card: z.null().optional()
    }).passthrough(),
    z.object({
      kind: z.literal("card"),
      name: z.null().optional(),
      description: z.null().optional(),
      card: visibleCardSchema
    }).passthrough()
  ]))
}).passthrough();

const eventOptionSurfaceSchema = z.object({
  kind: z.literal("event_option"),
  screen_entity_id: z.string().min(1),
  options: z.array(visibleEventOptionSchema)
}).passthrough();

const visibleDialogueLineSchema = z.object({
  entity_id: z.string().min(1),
  index: z.number().int().nonnegative(),
  text: z.string().min(1),
  speaker: z.enum(["ancient", "character", "unknown"]),
  is_current: z.boolean()
}).passthrough();

const eventDialogueSurfaceSchema = z.object({
  kind: z.literal("event_dialogue"),
  screen_entity_id: z.string().min(1),
  current_line_index: z.number().int().nonnegative(),
  revealed_lines: z.array(visibleDialogueLineSchema).min(1),
  advance_label: z.string().min(1)
}).passthrough();

const visibleRestOptionSchema = z.object({
  entity_id: z.string().min(1),
  index: z.number().int().nonnegative(),
  option_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  enabled: z.boolean()
}).passthrough();

const restSiteSurfaceSchema = z.object({
  kind: z.literal("rest_site"),
  screen_entity_id: z.string().min(1),
  options: z.array(visibleRestOptionSchema),
  can_proceed: z.boolean()
}).passthrough();

const shopOfferBaseSchema = z.object({
  entity_id: z.string().min(1),
  slot_entity_id: z.string().min(1),
  inventory_index: z.number().int().nonnegative(),
  price: z.number().int().nonnegative(),
  stocked: z.boolean(),
  visible: z.boolean(),
  affordable: z.boolean(),
  can_purchase: z.boolean(),
  blocked_reason: z.enum([
    "sold_out",
    "already_used",
    "not_visible",
    "insufficient_gold",
    "potion_slots_full",
    "potion_procurement_forbidden",
    "ui_control_disabled"
  ]).nullable().optional()
}).passthrough();

const visibleShopCardOfferSchema = shopOfferBaseSchema.extend({
  on_sale: z.boolean(),
  card: visibleCardSchema.nullable().optional()
}).passthrough();

const visibleShopRelicOfferSchema = shopOfferBaseSchema.extend({
  relic: visibleRelicSchema.nullable().optional()
}).passthrough();

const visibleShopPotionOfferSchema = shopOfferBaseSchema.extend({
  definition_id: z.string().min(1).nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  rarity: z.string().nullable().optional()
}).passthrough();

const visibleShopCardRemovalOfferSchema = shopOfferBaseSchema.extend({
  next_price_increase: z.number().int().nonnegative()
}).passthrough();

const shopInventorySurfaceSchema = z.object({
  kind: z.literal("shop_inventory"),
  screen_entity_id: z.string().min(1),
  cards: z.array(visibleShopCardOfferSchema),
  relics: z.array(visibleShopRelicOfferSchema),
  potions: z.array(visibleShopPotionOfferSchema),
  card_removal: visibleShopCardRemovalOfferSchema.nullable().optional(),
  can_close: z.boolean()
}).passthrough();

const shopRoomSurfaceSchema = z.object({
  kind: z.literal("shop_room"),
  room_entity_id: z.string().min(1),
  can_open_inventory: z.boolean(),
  can_proceed: z.boolean()
}).passthrough();

const treasureRoomSurfaceSchema = z.object({
  kind: z.literal("treasure_room"),
  stage: z.enum(["closed", "opening", "relic_choice", "completed"]),
  room_entity_id: z.string().min(1),
  chest_opened: z.boolean(),
  relics: z.array(visibleTreasureRelicSchema).max(1),
  can_skip: z.boolean(),
  can_proceed: z.boolean()
}).passthrough();

const gameOverSurfaceSchema = z.object({
  kind: z.literal("game_over"),
  stage: z.enum(["intro_animating", "intro", "summary_animating", "summary"]),
  screen_entity_id: z.string().min(1),
  return_destination: z.enum(["main_menu", "timeline"]).nullable().optional(),
  can_advance_summary: z.boolean(),
  can_return: z.boolean()
}).passthrough();

const visibleCharacterChoiceSchema = z.object({
  entity_id: z.string().min(1),
  index: z.number().int().nonnegative(),
  character_id: z.string().min(1),
  name: z.string().min(1),
  is_locked: z.boolean(),
  is_selected: z.boolean(),
  is_random: z.boolean()
}).passthrough();

const visibleStartingRelicSchema = z.object({
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional()
}).passthrough();

const visibleSelectedCharacterDetailsSchema = z.object({
  character_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  starting_hp: z.number().int().positive().nullable().optional(),
  starting_gold: z.number().int().nonnegative().nullable().optional(),
  starting_relic: visibleStartingRelicSchema.nullable().optional()
}).passthrough();

const characterSelectSurfaceSchema = z.object({
  kind: z.literal("character_select"),
  stage: z.enum(["choosing", "transitioning"]),
  screen_entity_id: z.string().min(1),
  characters: z.array(visibleCharacterChoiceSchema).min(1),
  selected_details: visibleSelectedCharacterDetailsSchema.nullable().optional(),
  ascension: z.number().int().nonnegative().nullable().optional(),
  ascension_title: z.string().min(1).nullable().optional(),
  ascension_description: z.string().min(1).nullable().optional(),
  can_decrease_ascension: z.boolean(),
  can_increase_ascension: z.boolean(),
  can_embark: z.boolean(),
  can_go_back: z.boolean()
}).passthrough();

const visibleMenuOptionSchema = z.object({
  entity_id: z.string().min(1),
  semantic_id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1).nullable().optional(),
  enabled: z.boolean(),
  bridge_support: z.enum(["actionable", "visible_unsupported"]),
  blocked_reason: z.string().min(1).nullable().optional()
}).passthrough();

const visibleContinueRunSummarySchema = z.object({
  character_id: z.string().min(1),
  character_name: z.string().min(1).nullable().optional(),
  act_id: z.string().min(1),
  act_name: z.string().min(1).nullable().optional(),
  floor: z.number().int().nonnegative(),
  hp: z.number().int().nonnegative(),
  max_hp: z.number().int().positive(),
  gold: z.number().int().nonnegative(),
  ascension: z.number().int().nonnegative()
}).passthrough();

const mainMenuSurfaceSchema = z.object({
  kind: z.literal("main_menu"),
  stage: z.enum(["choosing", "blocked"]),
  screen_entity_id: z.string().min(1),
  options: z.array(visibleMenuOptionSchema).min(1),
  continue_run: visibleContinueRunSummarySchema.nullable().optional()
}).passthrough();

const singleplayerMenuSurfaceSchema = z.object({
  kind: z.literal("singleplayer_menu"),
  stage: z.enum(["choosing", "blocked"]),
  screen_entity_id: z.string().min(1),
  options: z.array(visibleMenuOptionSchema).min(1)
}).passthrough();

const combatTurnSurfaceSchema = z.object({
  kind: z.literal("combat_turn"),
  room_entity_id: z.string().min(1),
  can_end_turn: z.boolean()
}).passthrough();

const combatPileCardSelectionSurfaceBaseSchema = z.object({
  kind: z.literal("combat_pile_card_selection"),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1),
  source_card_entity_id: z.string().min(1),
  pile_type: z.literal("discard"),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().nonnegative(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  require_manual_confirmation: z.boolean(),
  cancelable: z.boolean(),
  cards: z.array(visibleCardSchema)
});

const headbuttCombatPileCardSelectionSurfaceSchema = combatPileCardSelectionSurfaceBaseSchema.extend({
  purpose: z.literal("move_one_discard_card_to_draw_top"),
  source_kind: z.literal("headbutt"),
  source_card_definition_id: z.literal("HEADBUTT"),
  destination_pile: z.literal("draw"),
  destination_position: z.literal("top"),
  overflow_destination: z.null().optional()
}).passthrough();

const graveblastCombatPileCardSelectionSurfaceSchema = combatPileCardSelectionSurfaceBaseSchema.extend({
  purpose: z.literal("move_one_discard_card_to_hand"),
  source_kind: z.literal("graveblast"),
  source_card_definition_id: z.literal("GRAVEBLAST"),
  destination_pile: z.literal("hand"),
  destination_position: z.literal("bottom"),
  overflow_destination: z.literal("discard_if_hand_full")
}).passthrough();

const combatPileCardSelectionSurfaceSchema = z.discriminatedUnion("source_kind", [
  headbuttCombatPileCardSelectionSurfaceSchema,
  graveblastCombatPileCardSelectionSurfaceSchema
]);

const combatHandCardSelectionSurfaceSchema = z.object({
  kind: z.literal("combat_hand_card_selection"),
  hand_entity_id: z.string().min(1),
  prompt: z.string().min(1),
  selection_mode: z.enum(["simple_select", "upgrade_select"]),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().nonnegative(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  require_manual_confirmation: z.boolean(),
  is_peeking: z.boolean(),
  cards: z.array(visibleCardSchema)
}).passthrough();

const eventCardAcquisitionSurfaceSchema = z.object({
  kind: z.literal("event_card_acquisition"),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1),
  destination: z.literal("run_deck"),
  min_select: z.number().int().positive(),
  max_select: z.number().int().positive(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  require_manual_confirmation: z.literal(false),
  cards: z.array(visibleCardSchema).min(1)
}).passthrough();

const generatedCardChoiceBaseSchema = z.object({
  kind: z.literal("generated_card_choice"),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1).nullable().optional(),
  can_skip: z.boolean(),
  is_peeking: z.boolean(),
  cards: z.array(visibleCardSchema)
});

const generatedRunDeckCardChoiceSurfaceSchema = generatedCardChoiceBaseSchema.extend({
  purpose: z.literal("acquire_one_generated_card"),
  source_kind: z.literal("lead_paperweight"),
  destination: z.literal("run_deck"),
  selected_card_cost_policy: z.literal("unchanged"),
  overflow_destination: z.null().optional()
}).passthrough();

const generatedCombatSourceKindSchema = z.enum([
  "colorless_potion",
  "attack_potion",
  "skill_potion",
  "power_potion",
  "splash"
]);

const generatedCombatCardChoiceSurfaceSchema = generatedCardChoiceBaseSchema.extend({
  purpose: z.literal("choose_one_generated_combat_card"),
  source_kind: generatedCombatSourceKindSchema,
  destination: z.literal("combat_hand"),
  selected_card_cost_policy: z.literal("free_this_turn"),
  overflow_destination: z.literal("combat_discard_if_hand_full")
}).passthrough();

const generatedCardChoiceSurfaceSchema = z.discriminatedUnion("source_kind", [
  generatedRunDeckCardChoiceSurfaceSchema,
  generatedCombatCardChoiceSurfaceSchema
]);

const visibleCardBundleSchema = z.object({
  entity_id: z.string().min(1),
  cards: z.array(visibleCardSchema).min(1)
}).passthrough();

const cardBundleSelectionSurfaceSchema = z.object({
  kind: z.literal("card_bundle_selection"),
  stage: z.enum(["choosing", "preview"]),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1).nullable().optional(),
  selected_bundle_entity_id: z.string().min(1).nullable().optional(),
  bundles: z.array(visibleCardBundleSchema).min(1)
}).passthrough();

const visibleCardRewardAlternativeSchema = z.object({
  entity_id: z.string().min(1),
  index: z.number().int().nonnegative(),
  label: z.string().min(1),
  enabled: z.boolean()
}).passthrough();

const cardRewardSelectionSurfaceSchema = z.object({
  kind: z.literal("card_reward_selection"),
  screen_entity_id: z.string().min(1),
  cards: z.array(visibleCardSchema),
  alternatives: z.array(visibleCardRewardAlternativeSchema)
}).passthrough();

const visibleRewardSchema = z.object({
  entity_id: z.string().min(1),
  kind: z.enum(["gold", "potion", "relic", "card", "other_visible_reward"]),
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  enabled: z.boolean()
}).passthrough();

const rewardClaimSurfaceSchema = z.object({
  kind: z.literal("reward_claim"),
  screen_entity_id: z.string().min(1),
  rewards: z.array(visibleRewardSchema),
  potion_slots_full: z.boolean(),
  discardable_potions: z.array(visiblePotionSchema),
  can_proceed: z.boolean(),
  proceed_skips_remaining_rewards: z.boolean()
}).passthrough();

const visibleMapChoiceSchema = z.object({
  entity_id: z.string().min(1),
  col: z.number().int(),
  row: z.number().int(),
  point_type: z.string().min(1)
}).passthrough();

const mapNavigationSurfaceSchema = z.object({
  kind: z.literal("map_navigation"),
  screen_entity_id: z.string().min(1),
  travel_enabled: z.boolean(),
  traveling: z.boolean(),
  drawing_mode: z.enum(["none", "drawing", "erasing"]),
  next_options: z.array(visibleMapChoiceSchema)
}).passthrough();

const unsupportedSurfaceSchema = z.object({
  kind: z.literal("unsupported"),
  source_type: z.string(),
  reason: z.string()
}).passthrough();

const noActionSurfaceSchema = z.object({
  kind: z.literal("no_action"),
  reason: z.literal("settling"),
  message: z.string().min(1).nullable().optional()
}).passthrough();

const surfaceBaseSchema = z.object({ kind: z.string().min(1) }).passthrough();

const legalActionSchema = z.object({
  action_id: z.string().min(1),
  state_id: z.string().min(1),
  kind: z.string().min(1),
  category: z.string().optional(),
  label: z.string().min(1),
  authority: z.string().min(1),
  evidence_code: z.string().min(1),
  entity_bindings: z.array(z.object({
    role: z.string().min(1),
    entity_id: z.string().min(1)
  }))
}).passthrough();

const completenessSchema = z.object({
  player_visible_semantics: z.string(),
  legal_actions: z.string(),
  sources: z.array(z.string()),
  missing: z.array(z.string())
}).passthrough();

const diagnosticSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  category: z.enum(["identity", "compatibility", "authority", "context", "surface", "visibility", "completeness", "action", "completion", "runtime"]),
  effect: z.enum(["none", "field_omitted", "actions_suppressed", "surface_unsupported", "outcome_unknown"]),
  recoverability: z.enum(["settle", "change_surface", "restart", "update_bridge", "legacy_adapter", "unknown"]),
  path: z.string().nullable().optional(),
  visibility_class: z.enum(["on_screen", "normal_inspection", "count_only", "hidden"]).nullable().optional(),
  required_for_action: z.boolean().nullable().optional(),
  safe_detail: z.string().max(500).nullable().optional()
}).passthrough();

const inspectionContractSchema = z.object({
  status: z.enum([
    "implemented_read_only",
    "qualified_read_only_scoped",
    "mixed_scoped_read_only",
    "candidate_read_only_canary",
    "disabled_for_current_build"
  ]),
  state_bound: z.literal(true),
  arbitrary_queries_allowed: z.literal(false),
  enters_command_ledger: z.literal(false),
  visibility_classes: z.array(z.enum(["on_screen", "normal_inspection", "count_only"])),
  ordering_semantics: z.array(z.enum(["unordered_multiset", "player_sorted", "fixed_ui_slots"])),
  implemented_kinds: z.array(inspectionKindSchema)
}).passthrough();

const inspectionCompletenessSchema = z.object({
  player_visible_semantics: z.string().min(1),
  sources: z.array(z.string()),
  missing: z.array(z.string())
}).passthrough();

const runDeckInspectionContentSchema = z.object({
  kind: z.literal("run_deck"),
  card_count: z.number().int().nonnegative(),
  cards: z.array(visibleCardSchema)
}).passthrough();

const combatPileZoneSchema = z.object({
  zone: z.enum(["draw", "discard", "exhaust"]),
  card_count: z.number().int().nonnegative(),
  ordering_semantics: z.literal("unordered_multiset"),
  cards: z.array(visibleCardSchema)
}).passthrough();

const combatPilesInspectionContentSchema = z.object({
  kind: z.literal("combat_piles"),
  zones: z.array(combatPileZoneSchema).length(3)
}).passthrough();

const shopCatalogInspectionContentSchema = z.object({
  kind: z.literal("shop_catalog"),
  access_state: z.enum(["inventory_open", "inventory_closed_open_to_inspect"]),
  cards: z.array(visibleShopCardOfferSchema),
  relics: z.array(visibleShopRelicOfferSchema),
  potions: z.array(visibleShopPotionOfferSchema),
  card_removal: visibleShopCardRemovalOfferSchema.nullable().optional()
}).passthrough();

const inspectionSchema = z.object({
  protocol_version: z.literal(SUPPORTED_BRIDGE_V2_PROTOCOL),
  inspection_id: z.string().min(1),
  expected_state_id: z.string().min(1),
  observed_state_id: z.string().min(1),
  observed_at: z.string().min(1),
  kind: inspectionKindSchema,
  visibility_class: z.literal("normal_inspection"),
  ordering_semantics: z.enum(["unordered_multiset", "fixed_ui_slots"]),
  content: z.discriminatedUnion("kind", [
    runDeckInspectionContentSchema,
    combatPilesInspectionContentSchema,
    shopCatalogInspectionContentSchema
  ]),
  completeness: inspectionCompletenessSchema,
  bridge: bridgeIdentitySchema,
  game: gameSchema,
  observation_policy: z.object({
    id: z.string().min(1),
    includes_hidden_information: z.boolean()
  }).passthrough(),
  diagnostics: z.array(diagnosticSchema)
}).passthrough();

const inspectionCatalogEntrySchema = z.object({
  kind: inspectionKindSchema,
  scope: z.enum(["active_run", "current_combat", "current_shop"]),
  availability: z.enum(["qualified", "canary"]),
  visibility_basis: z.string().min(1),
  state_bound: z.literal(true),
  creates_action_authority: z.literal(false),
  ordering_semantics: z.enum(["unordered_multiset", "fixed_ui_slots"]),
  estimated_cost: z.enum(["low", "medium", "high"]),
  recommended_for: z.array(z.string().min(1)),
  hidden_by_policy: z.array(z.string().min(1))
}).passthrough();

const visibilityStateSchema = z.object({
  profile_id: z.string().min(1),
  core_status: z.enum(["complete", "partial"]),
  player_visible_closure_status: z.enum(["complete", "partial_catalog", "partial"]),
  available_inspections: z.array(inspectionKindSchema),
  linked_detail_kinds: z.array(z.string().min(1)),
  hidden_by_policy: z.array(z.string().min(1)),
  missing: z.array(z.string().min(1)),
  unknown_critical_field_behavior: z.literal("fail_closed")
}).passthrough();

const contractOperationShadowSchema = z.object({
  operation: z.string().min(1),
  evidence_status: z.enum([
    "surface_level_only",
    "source_audited",
    "organic_canary_exercised",
    "organic_qualified",
    "unregistered"
  ]),
  published: z.boolean()
}).passthrough();

const contractInstanceShadowSchema = z.object({
  status: z.enum(["resolved_manifest_contract", "unresolved"]),
  instance_id: z.string().min(1),
  surface_kind: z.string().min(1),
  // System.Text.Json omits nullable record fields in transitional/unresolved states.
  // This inventory is non-authorizing, so absence must remain readable rather than
  // turning an already confirmed command into a settlement read failure.
  semantic_contract_id: z.string().min(1).nullable().optional(),
  declared_binding: z.string().min(1).nullable().optional(),
  operations: z.array(contractOperationShadowSchema),
  current_authority_tier: z.enum(["qualified", "canary", "observation_only", "disabled"]),
  current_authority_basis: z.literal("exact_environment_surface_operation_gate"),
  authorizing: z.literal(false),
  limitations: z.array(z.string().min(1))
}).passthrough().superRefine((shadow, context) => {
  if (shadow.status !== "resolved_manifest_contract") return;
  if (!shadow.semantic_contract_id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["semantic_contract_id"],
      message: "resolved contract shadow requires semantic_contract_id"
    });
  }
  if (!shadow.declared_binding) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["declared_binding"],
      message: "resolved contract shadow requires declared_binding"
    });
  }
});

const stateBaseSchema = z.object({
  protocol_version: z.literal(SUPPORTED_BRIDGE_V2_PROTOCOL),
  state_id: z.string().min(1),
  state_sequence: z.number().int().nonnegative(),
  observed_at: z.string(),
  readiness: z.string().min(1),
  shared_state: stateSharedVisibleStateSchema.nullable(),
  context: contextBaseSchema,
  surface_kind: z.string().min(1),
  surface: surfaceBaseSchema,
  authority_handoff: authorityHandoffSchema,
  legal_actions: z.array(legalActionSchema),
  completeness: completenessSchema,
  bridge: bridgeIdentitySchema,
  game: gameSchema,
  observation_policy: z.object({
    id: z.string().min(1),
    scope: z.string(),
    includes_hidden_information: z.boolean(),
    unknown_field_behavior: z.string()
  }).passthrough(),
  visibility: visibilityStateSchema,
  inspection_catalog: z.array(inspectionCatalogEntrySchema),
  contract_instance_shadow: contractInstanceShadowSchema,
  diagnostics: z.array(diagnosticSchema),
  warnings: z.array(z.string())
}).passthrough();

const capabilitiesSchema = z.object({
  protocol_version: z.literal(SUPPORTED_BRIDGE_V2_PROTOCOL),
  bridge: bridgeIdentitySchema,
  game: gameSchema,
  observation_policy: z.object({
    id: z.string().min(1),
    includes_hidden_information: z.boolean()
  }).passthrough(),
  shared_state: z.object({
    status: z.literal("implemented_read_only_current_build"),
    scope: z.literal("active_single_player_run_hud"),
    creates_action_authority: z.literal(false),
    included_in_state_identity: z.literal(true),
    included_facts: z.array(z.string().min(1)),
    excluded_facts: z.array(z.string().min(1))
  }).passthrough(),
  surfaces: z.array(z.object({
    kind: z.string().min(1),
    support: z.string(),
    operations: z.array(z.string()),
    evidence: z.string()
  }).passthrough()),
  commands: z.object({
    opaque_actions_only: z.boolean(),
    state_bound: z.boolean(),
    idempotent_request_ids: z.boolean(),
    lifecycle_states: z.array(z.string()),
    outcome_timeout_ms: z.number().int().positive()
  }).passthrough(),
  inspections: inspectionContractSchema,
  diagnostics: z.array(diagnosticSchema),
  warnings: z.array(z.string())
}).passthrough();

const commandEventSchema = z.object({
  status: z.string(),
  at: z.string(),
  evidence: z.string().nullable().optional(),
  error_code: z.string().nullable().optional(),
  detail: z.string().nullable().optional()
}).passthrough();

const commandSchema = z.object({
  request_id: z.string().min(1),
  expected_state_id: z.string().min(1),
  action_id: z.string().min(1),
  status: z.enum(["received", "validated", "started", "completed", "rejected", "failed", "timed_out"]),
  outcome: z.enum(["pending", "confirmed", "not_applied", "unknown"]),
  observed_state_id: z.string().nullable().optional(),
  events: z.array(commandEventSchema)
}).passthrough();

const observationBundleSchema = z.object({
  protocol_version: z.literal(SUPPORTED_BRIDGE_V2_PROTOCOL),
  observation_id: z.string().min(1),
  coherent: z.literal(true),
  state: stateBaseSchema,
  inspections: z.record(inspectionKindSchema, inspectionSchema),
  bridge: bridgeIdentitySchema,
  game: gameSchema,
  diagnostics: z.array(diagnosticSchema)
}).passthrough();

export type BridgeV2Capabilities = z.infer<typeof capabilitiesSchema>;
export type BridgeV2LegalAction = z.infer<typeof legalActionSchema>;
export type BridgeV2DeckEnchantSurface = z.infer<typeof deckEnchantSurfaceSchema>;
export type BridgeV2DeckRemovalSurface = z.infer<typeof deckRemovalSurfaceSchema>;
export type BridgeV2DeckUpgradeSurface = z.infer<typeof deckUpgradeSurfaceSchema>;
export type BridgeV2DeckTransformSurface = z.infer<typeof deckTransformSurfaceSchema>;
export type BridgeV2EventContext = z.infer<typeof eventContextSchema>;
export type BridgeV2CombatContext = z.infer<typeof combatContextSchema>;
export type BridgeV2RewardFlowContext = z.infer<typeof rewardFlowContextSchema>;
export type BridgeV2RestContext = z.infer<typeof restContextSchema>;
export type BridgeV2TreasureContext = z.infer<typeof treasureContextSchema>;
export type BridgeV2GameOverContext = z.infer<typeof gameOverContextSchema>;
export type BridgeV2MenuContext = z.infer<typeof menuContextSchema>;
export type BridgeV2ShopContext = z.infer<typeof shopContextSchema>;
export type BridgeV2MapContext = z.infer<typeof mapContextSchema>;
export type BridgeV2CombatTransitionContext = z.infer<typeof combatTransitionContextSchema>;
export type BridgeV2UnknownContext = z.infer<typeof unknownContextSchema>;
export type BridgeV2EventOptionSurface = z.infer<typeof eventOptionSurfaceSchema>;
export type BridgeV2EventDialogueSurface = z.infer<typeof eventDialogueSurfaceSchema>;
export type BridgeV2RestSiteSurface = z.infer<typeof restSiteSurfaceSchema>;
export type BridgeV2ShopInventorySurface = z.infer<typeof shopInventorySurfaceSchema>;
export type BridgeV2ShopRoomSurface = z.infer<typeof shopRoomSurfaceSchema>;
export type BridgeV2TreasureRoomSurface = z.infer<typeof treasureRoomSurfaceSchema>;
export type BridgeV2GameOverSurface = z.infer<typeof gameOverSurfaceSchema>;
export type BridgeV2CharacterSelectSurface = z.infer<typeof characterSelectSurfaceSchema>;
export type BridgeV2MainMenuSurface = z.infer<typeof mainMenuSurfaceSchema>;
export type BridgeV2SingleplayerMenuSurface = z.infer<typeof singleplayerMenuSurfaceSchema>;
export type BridgeV2CombatTurnSurface = z.infer<typeof combatTurnSurfaceSchema>;
export type BridgeV2CombatPileCardSelectionSurface = z.infer<typeof combatPileCardSelectionSurfaceSchema>;
export type BridgeV2CombatHandCardSelectionSurface = z.infer<typeof combatHandCardSelectionSurfaceSchema>;
export type BridgeV2EventCardAcquisitionSurface = z.infer<typeof eventCardAcquisitionSurfaceSchema>;
export type BridgeV2GeneratedCardChoiceSurface = z.infer<typeof generatedCardChoiceSurfaceSchema>;
export type BridgeV2CardBundleSelectionSurface = z.infer<typeof cardBundleSelectionSurfaceSchema>;
export type BridgeV2CardRewardSelectionSurface = z.infer<typeof cardRewardSelectionSurfaceSchema>;
export type BridgeV2RewardClaimSurface = z.infer<typeof rewardClaimSurfaceSchema>;
export type BridgeV2MapNavigationSurface = z.infer<typeof mapNavigationSurfaceSchema>;
export type BridgeV2Diagnostic = z.infer<typeof diagnosticSchema>;
export type BridgeV2InspectionKind = z.infer<typeof inspectionKindSchema>;
export type BridgeV2Inspection = z.infer<typeof inspectionSchema>;
export type BridgeV2InspectionCatalogEntry = z.infer<typeof inspectionCatalogEntrySchema>;
export type BridgeV2VisibilityState = z.infer<typeof visibilityStateSchema>;
export type BridgeV2ContractInstanceShadow = z.infer<typeof contractInstanceShadowSchema>;
export type BridgeV2UnsupportedSurface = z.infer<typeof unsupportedSurfaceSchema>;
export type BridgeV2NoActionSurface = z.infer<typeof noActionSurfaceSchema>;
export type BridgeV2Command = z.infer<typeof commandSchema>;

export type BridgeV2Context =
  | BridgeV2EventContext
  | BridgeV2CombatContext
  | BridgeV2RewardFlowContext
  | BridgeV2RestContext
  | BridgeV2TreasureContext
  | BridgeV2GameOverContext
  | BridgeV2MenuContext
  | BridgeV2ShopContext
  | BridgeV2MapContext
  | BridgeV2CombatTransitionContext
  | BridgeV2UnknownContext
  | (Record<string, unknown> & { kind: string });

export type BridgeV2Surface =
  | BridgeV2DeckEnchantSurface
  | BridgeV2DeckRemovalSurface
  | BridgeV2DeckUpgradeSurface
  | BridgeV2DeckTransformSurface
  | BridgeV2EventDialogueSurface
  | BridgeV2RestSiteSurface
  | BridgeV2ShopInventorySurface
  | BridgeV2ShopRoomSurface
  | BridgeV2TreasureRoomSurface
  | BridgeV2GameOverSurface
  | BridgeV2CharacterSelectSurface
  | BridgeV2MainMenuSurface
  | BridgeV2SingleplayerMenuSurface
  | BridgeV2EventOptionSurface
  | BridgeV2CombatTurnSurface
  | BridgeV2CombatPileCardSelectionSurface
  | BridgeV2CombatHandCardSelectionSurface
  | BridgeV2EventCardAcquisitionSurface
  | BridgeV2GeneratedCardChoiceSurface
  | BridgeV2CardBundleSelectionSurface
  | BridgeV2CardRewardSelectionSurface
  | BridgeV2RewardClaimSurface
  | BridgeV2MapNavigationSurface
  | BridgeV2NoActionSurface
  | BridgeV2UnsupportedSurface
  | (Record<string, unknown> & { kind: string });

export type BridgeV2SharedVisibleState = z.infer<typeof sharedVisibleStateSchema>;

export type BridgeV2State = z.infer<typeof stateBaseSchema> & {
  shared_state: BridgeV2SharedVisibleState | null;
  context: BridgeV2Context;
  surface: BridgeV2Surface;
};

export interface BridgeV2ObservationBundle {
  protocol_version: typeof SUPPORTED_BRIDGE_V2_PROTOCOL;
  observation_id: string;
  coherent: true;
  state: BridgeV2State;
  inspections: Partial<Record<BridgeV2InspectionKind, BridgeV2Inspection>>;
  bridge: z.infer<typeof bridgeIdentitySchema>;
  game: z.infer<typeof gameSchema>;
  diagnostics: BridgeV2Diagnostic[];
}

export interface DecodedBridgePayload<T> {
  data: T;
  raw: JsonObject;
}

export function sameBridgeModsetIdentity(
  left: BridgeV2Capabilities["game"],
  right: BridgeV2Capabilities["game"]
): boolean {
  return left.modset.exact_permission_eligible
    && right.modset.exact_permission_eligible
    && left.modset.status === "exact_bridge_only"
    && right.modset.status === "exact_bridge_only"
    && left.modset.fingerprint_scope === right.modset.fingerprint_scope
    && left.modset.fingerprint === right.modset.fingerprint;
}

export class BridgeV2DecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BridgeV2DecodeError";
  }
}

export function decodeBridgeV2Capabilities(value: unknown): DecodedBridgePayload<BridgeV2Capabilities> {
  const decoded = decode(value, capabilitiesSchema, "Bridge v2 capabilities");
  validateModsetPermissionBoundary(decoded.data.game, decoded.data.bridge);
  const surfaceKinds = decoded.data.surfaces.map((surface) => surface.kind);
  if (new Set(surfaceKinds).size !== surfaceKinds.length) {
    throw new BridgeV2DecodeError("Bridge v2 capabilities contain duplicate surface kinds");
  }
  for (const surface of decoded.data.surfaces) {
    if (new Set(surface.operations).size !== surface.operations.length) {
      throw new BridgeV2DecodeError(`Bridge v2 ${surface.kind} capability contains duplicate operations`);
    }
  }
  const inspection = decoded.data.inspections;
  const explicitInspectionKinds = [...new Set([
    ...decoded.data.game.compatibility.inspection_allowed_kinds,
    ...decoded.data.game.compatibility.inspection_canary_kinds
  ])].sort();
  const declaredInspectionKinds = [...inspection.implemented_kinds].sort();
  if (declaredInspectionKinds.join(",") !== explicitInspectionKinds.join(",")) {
    throw new BridgeV2DecodeError(
      "Inspection capability kinds must match the exact qualified/canary scope"
    );
  }
  if (inspection.status === "disabled_for_current_build" && inspection.implemented_kinds.length > 0) {
    throw new BridgeV2DecodeError("disabled Inspection capability must not advertise kinds");
  }
  if (inspection.status !== "disabled_for_current_build" && inspection.implemented_kinds.length === 0) {
    throw new BridgeV2DecodeError("Inspection capability status requires at least one explicitly permitted kind");
  }
  return decoded;
}

function validateModsetPermissionBoundary(
  game: BridgeV2Capabilities["game"],
  bridgeIdentity: BridgeV2Capabilities["bridge"]
): void {
  const { modset, compatibility } = game;
  if (!modset.exact_permission_eligible) {
    if (compatibility.action_execution_allowed
        || compatibility.inspection_allowed
        || compatibility.action_execution_surface_kinds.length > 0
        || compatibility.action_canary_surface_kinds.length > 0
        || compatibility.inspection_allowed_kinds.length > 0
        || compatibility.inspection_canary_kinds.length > 0) {
      throw new BridgeV2DecodeError(
        "Unqualified Modset must not advertise Bridge v2 action or Inspection permission"
      );
    }
    return;
  }

  if (modset.status !== "exact_bridge_only") {
    throw new BridgeV2DecodeError("Exact-permission Modset must use exact_bridge_only status");
  }
  const loaded = modset.mods.filter((mod) => mod.load_state === "Loaded");
  const bridge = loaded.find((mod) => mod.id === "STS2_MCP");
  if (loaded.length !== 1
      || !bridge
      || !bridge.assemblies.some((assembly) =>
        assembly.module_version_id.toLowerCase() === bridgeIdentity.module_version_id.toLowerCase())) {
    throw new BridgeV2DecodeError(
      "Exact-permission Modset must contain only the negotiated STS2_MCP module"
    );
  }
}

export function decodeBridgeV2State(value: unknown): DecodedBridgePayload<BridgeV2State> {
  const decoded = decode(value, stateBaseSchema, "Bridge v2 state");
  validateModsetPermissionBoundary(decoded.data.game, decoded.data.bridge);
  if (decoded.data.surface_kind !== decoded.data.surface.kind) {
    throw new BridgeV2DecodeError(
      `Bridge v2 state surface_kind ${decoded.data.surface_kind} does not match surface.kind ${decoded.data.surface.kind}`
    );
  }

  const preRunSurface = decoded.data.surface.kind === "character_select"
    || decoded.data.surface.kind === "main_menu"
    || decoded.data.surface.kind === "singleplayer_menu";
  if (decoded.data.surface.kind !== "unsupported"
      && !preRunSurface
      && decoded.data.shared_state === null) {
    throw new BridgeV2DecodeError(
      "Bridge v2 semantic surface requires top-level shared_state for the active single-player run"
    );
  }
  if (preRunSurface && decoded.data.shared_state !== null) {
    throw new BridgeV2DecodeError(`Bridge v2 ${decoded.data.surface.kind} must not carry active-run shared_state`);
  }

  validateVisibilityCatalog(decoded.data);

  const context = parseContext(decoded.data.context);
  let surface: BridgeV2Surface;
  if (decoded.data.surface.kind === "deck_enchant_selection") {
    surface = parse(deckEnchantSurfaceSchema, decoded.data.surface, "deck_enchant_selection surface");
  } else if (decoded.data.surface.kind === "deck_removal_selection") {
    surface = parse(deckRemovalSurfaceSchema, decoded.data.surface, "deck_removal_selection surface");
    if (context.kind !== "shop") {
      throw new BridgeV2DecodeError("Bridge v2 deck_removal_selection surface requires shop context");
    }
  } else if (decoded.data.surface.kind === "deck_upgrade_selection") {
    surface = parse(deckUpgradeSurfaceSchema, decoded.data.surface, "deck_upgrade_selection surface");
    if (context.kind !== "event" && context.kind !== "rest") {
      throw new BridgeV2DecodeError("Bridge v2 deck_upgrade_selection surface requires event or rest context");
    }
  } else if (decoded.data.surface.kind === "deck_transform_selection") {
    surface = parse(deckTransformSurfaceSchema, decoded.data.surface, "deck_transform_selection surface");
    if (context.kind !== "event" || context.event_id !== "WHISPERING_HOLLOW") {
      throw new BridgeV2DecodeError("Bridge v2 deck_transform_selection surface requires exact Whispering Hollow event context");
    }
  } else if (decoded.data.surface.kind === "event_dialogue") {
    surface = parse(eventDialogueSurfaceSchema, decoded.data.surface, "event_dialogue surface");
    if (context.kind !== "event" || !context.ancient || !context.in_dialogue) {
      throw new BridgeV2DecodeError("Bridge v2 event_dialogue surface requires active ancient event dialogue context");
    }
  } else if (decoded.data.surface.kind === "rest_site") {
    surface = parse(restSiteSurfaceSchema, decoded.data.surface, "rest_site surface");
    if (context.kind !== "rest") {
      throw new BridgeV2DecodeError("Bridge v2 rest_site surface requires rest context");
    }
  } else if (decoded.data.surface.kind === "shop_inventory") {
    surface = parse(shopInventorySurfaceSchema, decoded.data.surface, "shop_inventory surface");
    if (context.kind !== "shop") {
      throw new BridgeV2DecodeError("Bridge v2 shop_inventory surface requires shop context");
    }
  } else if (decoded.data.surface.kind === "shop_room") {
    surface = parse(shopRoomSurfaceSchema, decoded.data.surface, "shop_room surface");
    if (context.kind !== "shop") {
      throw new BridgeV2DecodeError("Bridge v2 shop_room surface requires shop context");
    }
  } else if (decoded.data.surface.kind === "treasure_room") {
    surface = parse(treasureRoomSurfaceSchema, decoded.data.surface, "treasure_room surface");
    if (context.kind !== "treasure") {
      throw new BridgeV2DecodeError("Bridge v2 treasure_room surface requires treasure context");
    }
  } else if (decoded.data.surface.kind === "game_over") {
    surface = parse(gameOverSurfaceSchema, decoded.data.surface, "game_over surface");
    if (context.kind !== "game_over") {
      throw new BridgeV2DecodeError("Bridge v2 game_over surface requires game_over context");
    }
  } else if (decoded.data.surface.kind === "character_select") {
    surface = parse(characterSelectSurfaceSchema, decoded.data.surface, "character_select surface");
    if (context.kind !== "menu" || context.flow !== "standard_run_setup") {
      throw new BridgeV2DecodeError("Bridge v2 character_select surface requires standard-run menu context");
    }
  } else if (decoded.data.surface.kind === "main_menu") {
    surface = parse(mainMenuSurfaceSchema, decoded.data.surface, "main_menu surface");
    if (context.kind !== "menu" || context.flow !== "root_navigation") {
      throw new BridgeV2DecodeError("Bridge v2 main_menu surface requires root-navigation menu context");
    }
  } else if (decoded.data.surface.kind === "singleplayer_menu") {
    surface = parse(singleplayerMenuSurfaceSchema, decoded.data.surface, "singleplayer_menu surface");
    if (context.kind !== "menu" || context.flow !== "standard_run_setup") {
      throw new BridgeV2DecodeError("Bridge v2 singleplayer_menu surface requires standard-run menu context");
    }
  } else if (decoded.data.surface.kind === "event_option") {
    surface = parse(eventOptionSurfaceSchema, decoded.data.surface, "event_option surface");
    if (context.kind !== "event") {
      throw new BridgeV2DecodeError("Bridge v2 event_option surface requires event context");
    }
  } else if (decoded.data.surface.kind === "combat_turn") {
    surface = parse(combatTurnSurfaceSchema, decoded.data.surface, "combat_turn surface");
    if (context.kind !== "combat") {
      throw new BridgeV2DecodeError("Bridge v2 combat_turn surface requires combat context");
    }
  } else if (decoded.data.surface.kind === "combat_pile_card_selection") {
    surface = parse(combatPileCardSelectionSurfaceSchema, decoded.data.surface, "combat_pile_card_selection surface");
    if (context.kind !== "combat") {
      throw new BridgeV2DecodeError("Bridge v2 combat_pile_card_selection surface requires combat context");
    }
  } else if (decoded.data.surface.kind === "combat_hand_card_selection") {
    surface = parse(combatHandCardSelectionSurfaceSchema, decoded.data.surface, "combat_hand_card_selection surface");
    if (context.kind !== "combat") {
      throw new BridgeV2DecodeError("Bridge v2 combat_hand_card_selection surface requires combat context");
    }
  } else if (decoded.data.surface.kind === "event_card_acquisition") {
    surface = parse(eventCardAcquisitionSurfaceSchema, decoded.data.surface, "event_card_acquisition surface");
    if (context.kind !== "event") {
      throw new BridgeV2DecodeError("Bridge v2 event_card_acquisition surface requires event context");
    }
  } else if (decoded.data.surface.kind === "generated_card_choice") {
    surface = parse(generatedCardChoiceSurfaceSchema, decoded.data.surface, "generated_card_choice surface");
    if (surface.source_kind === "lead_paperweight"
      && (context.kind !== "event" || context.event_id !== "NEOW")) {
      throw new BridgeV2DecodeError("Bridge v2 Lead Paperweight generated_card_choice requires the exact NEOW event context");
    }
    if (surface.source_kind !== "lead_paperweight" && context.kind !== "combat") {
      throw new BridgeV2DecodeError("Bridge v2 generated combat-potion card choice requires combat context");
    }
  } else if (decoded.data.surface.kind === "card_bundle_selection") {
    // Bundle choice is a reusable UI protocol. Its semantic origin currently
    // includes event rewards, but the surface contract must not fossilize that
    // first observed context into a permanent event-only rule.
    surface = parse(cardBundleSelectionSurfaceSchema, decoded.data.surface, "card_bundle_selection surface");
  } else if (decoded.data.surface.kind === "card_reward_selection") {
    surface = parse(cardRewardSelectionSurfaceSchema, decoded.data.surface, "card_reward_selection surface");
    if (context.kind !== "reward_flow") {
      throw new BridgeV2DecodeError("Bridge v2 card_reward_selection surface requires reward_flow context");
    }
  } else if (decoded.data.surface.kind === "reward_claim") {
    surface = parse(rewardClaimSurfaceSchema, decoded.data.surface, "reward_claim surface");
    if (context.kind !== "reward_flow" || context.reward_kind !== "room_rewards") {
      throw new BridgeV2DecodeError("Bridge v2 reward_claim surface requires room_rewards reward_flow context");
    }
  } else if (decoded.data.surface.kind === "map_navigation") {
    surface = parse(mapNavigationSurfaceSchema, decoded.data.surface, "map_navigation surface");
    if (context.kind !== "map") {
      throw new BridgeV2DecodeError("Bridge v2 map_navigation surface requires map context");
    }
  } else if (decoded.data.surface.kind === "no_action") {
    surface = parse(noActionSurfaceSchema, decoded.data.surface, "no_action surface");
    if (context.kind !== "combat_transition") {
      throw new BridgeV2DecodeError("Bridge v2 no_action surface requires combat_transition context");
    }
    if (decoded.data.readiness !== "settling"
        || decoded.data.legal_actions.length !== 0
        || decoded.data.authority_handoff.status !== "none_fail_closed"
        || decoded.data.authority_handoff.surface_kind != null) {
      throw new BridgeV2DecodeError(
        "Bridge v2 no_action transition must be settling, publish no actions, and retain none_fail_closed authority"
      );
    }
  } else if (decoded.data.surface.kind === "unsupported") {
    surface = parse(unsupportedSurfaceSchema, decoded.data.surface, "unsupported surface");
  } else {
    surface = decoded.data.surface;
  }

  if (isBridgeV2CombatContext(context) && decoded.data.shared_state
      && context.player.player_entity_id !== decoded.data.shared_state.player.entity_id) {
    throw new BridgeV2DecodeError(
      "Bridge v2 combat player_entity_id does not match shared_state player entity_id"
    );
  }

  const visibleEntityIds = collectEntityIds({ shared_state: decoded.data.shared_state, context, surface });
  for (const action of decoded.data.legal_actions) {
    for (const binding of action.entity_bindings) {
      if (!visibleEntityIds.has(binding.entity_id)) {
        throw new BridgeV2DecodeError(
          `Bridge v2 action ${action.action_id} binds ${binding.role} to entity ${binding.entity_id}, which is absent from the visible context and surface`
        );
      }
    }
  }

  return {
    raw: decoded.raw,
    data: {
      ...decoded.data,
      shared_state: decoded.data.shared_state ?? null,
      context,
      surface
    }
  };
}

function collectEntityIds(value: unknown, result = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const entry of value) collectEntityIds(entry, result);
    return result;
  }
  if (!isJsonObject(value)) return result;
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" && (key === "entity_id" || key.endsWith("_entity_id"))) {
      result.add(entry);
    }
    collectEntityIds(entry, result);
  }
  return result;
}

export function decodeBridgeV2Command(value: unknown): DecodedBridgePayload<BridgeV2Command> {
  return decode(value, commandSchema, "Bridge v2 command");
}

export function decodeBridgeV2Inspection(value: unknown): DecodedBridgePayload<BridgeV2Inspection> {
  const decoded = decode(value, inspectionSchema, "Bridge v2 inspection");
  validateModsetPermissionBoundary(decoded.data.game, decoded.data.bridge);
  if (decoded.data.kind !== decoded.data.content.kind) {
    throw new BridgeV2DecodeError(
      `Bridge v2 inspection kind ${decoded.data.kind} does not match content.kind ${decoded.data.content.kind}`
    );
  }
  return decoded;
}

export function decodeBridgeV2ObservationBundle(
  value: unknown
): DecodedBridgePayload<BridgeV2ObservationBundle> {
  const decoded = decode(value, observationBundleSchema, "Bridge v2 observation bundle");
  const state = decodeBridgeV2State(decoded.data.state).data;
  validateModsetPermissionBoundary(decoded.data.game, decoded.data.bridge);
  if (decoded.data.bridge.module_version_id !== state.bridge.module_version_id
      || decoded.data.bridge.assembly_file_sha256 !== state.bridge.assembly_file_sha256
      || decoded.data.bridge.runtime_instance_id !== state.bridge.runtime_instance_id
      || decoded.data.game.modset.fingerprint !== state.game.modset.fingerprint) {
    throw new BridgeV2DecodeError("Bridge v2 observation bundle identity does not match its enclosed state");
  }

  const inspections: Partial<Record<BridgeV2InspectionKind, BridgeV2Inspection>> = {};
  for (const [kind, value] of Object.entries(decoded.data.inspections)) {
    const inspection = decodeBridgeV2Inspection(value).data;
    if (inspection.kind !== kind
        || inspection.expected_state_id !== state.state_id
        || inspection.observed_state_id !== state.state_id
        || inspection.bridge.module_version_id !== state.bridge.module_version_id
        || inspection.bridge.assembly_file_sha256 !== state.bridge.assembly_file_sha256
        || inspection.bridge.runtime_instance_id !== state.bridge.runtime_instance_id
        || inspection.game.modset.fingerprint !== state.game.modset.fingerprint) {
      throw new BridgeV2DecodeError(`Bridge v2 observation bundle ${kind} inspection is not coherent with its state`);
    }
    inspections[kind as BridgeV2InspectionKind] = inspection;
  }

  return {
    raw: decoded.raw,
    data: {
      ...decoded.data,
      state,
      inspections
    }
  };
}

function validateVisibilityCatalog(state: z.infer<typeof stateBaseSchema>): void {
  const catalogKinds = state.inspection_catalog.map((entry) => entry.kind);
  if (new Set(catalogKinds).size !== catalogKinds.length) {
    throw new BridgeV2DecodeError("Bridge v2 inspection catalog contains duplicate kinds");
  }
  if ([...catalogKinds].sort().join(",") !== [...state.visibility.available_inspections].sort().join(",")) {
    throw new BridgeV2DecodeError("Bridge v2 visibility available_inspections does not match inspection_catalog");
  }

  const qualified = new Set(state.game.compatibility.inspection_allowed_kinds);
  const canary = new Set(state.game.compatibility.inspection_canary_kinds);
  for (const entry of state.inspection_catalog) {
    const expectedAvailability = qualified.has(entry.kind) ? "qualified" : canary.has(entry.kind) ? "canary" : undefined;
    if (entry.availability !== expectedAvailability) {
      throw new BridgeV2DecodeError(`Bridge v2 inspection catalog ${entry.kind} exceeds current scoped authority`);
    }
    if (entry.kind === "combat_piles" && state.context.kind !== "combat") {
      throw new BridgeV2DecodeError("Bridge v2 combat_piles catalog entry requires combat context");
    }
    if (entry.kind === "run_deck" && state.shared_state === null) {
      throw new BridgeV2DecodeError("Bridge v2 run_deck catalog entry requires an active run");
    }
  }
}

export function isBridgeV2DeckEnchantSurface(
  surface: BridgeV2Surface
): surface is BridgeV2DeckEnchantSurface {
  return surface.kind === "deck_enchant_selection";
}

export function isBridgeV2DeckRemovalSurface(
  surface: BridgeV2Surface
): surface is BridgeV2DeckRemovalSurface {
  return surface.kind === "deck_removal_selection";
}

export function isBridgeV2DeckUpgradeSurface(
  surface: BridgeV2Surface
): surface is BridgeV2DeckUpgradeSurface {
  return surface.kind === "deck_upgrade_selection";
}

export function isBridgeV2DeckTransformSurface(
  surface: BridgeV2Surface
): surface is BridgeV2DeckTransformSurface {
  return surface.kind === "deck_transform_selection";
}

export function isBridgeV2UnsupportedSurface(
  surface: BridgeV2Surface
): surface is BridgeV2UnsupportedSurface {
  return surface.kind === "unsupported"
    && typeof surface.source_type === "string"
    && typeof surface.reason === "string";
}

export function isBridgeV2NoActionSurface(
  surface: BridgeV2Surface
): surface is BridgeV2NoActionSurface {
  return surface.kind === "no_action" && surface.reason === "settling";
}

export function isBridgeV2EventContext(context: BridgeV2Context): context is BridgeV2EventContext {
  return context.kind === "event";
}

export function isBridgeV2CombatContext(context: BridgeV2Context): context is BridgeV2CombatContext {
  return context.kind === "combat";
}

export function isBridgeV2RewardFlowContext(context: BridgeV2Context): context is BridgeV2RewardFlowContext {
  return context.kind === "reward_flow";
}

export function isBridgeV2RestContext(context: BridgeV2Context): context is BridgeV2RestContext {
  return context.kind === "rest";
}

export function isBridgeV2ShopContext(context: BridgeV2Context): context is BridgeV2ShopContext {
  return context.kind === "shop";
}

export function isBridgeV2TreasureContext(context: BridgeV2Context): context is BridgeV2TreasureContext {
  return context.kind === "treasure";
}

export function isBridgeV2GameOverContext(context: BridgeV2Context): context is BridgeV2GameOverContext {
  return context.kind === "game_over";
}

export function isBridgeV2MenuContext(context: BridgeV2Context): context is BridgeV2MenuContext {
  return context.kind === "menu";
}

export function isBridgeV2MapContext(context: BridgeV2Context): context is BridgeV2MapContext {
  return context.kind === "map";
}

export function isBridgeV2CombatTransitionContext(
  context: BridgeV2Context
): context is BridgeV2CombatTransitionContext {
  return context.kind === "combat_transition"
    && ((context.phase === "setup" && context.transition === "awaiting_combat_start")
      || (context.phase === "resolution" && context.transition === "awaiting_room_resolution"));
}

export function isBridgeV2EventOptionSurface(
  surface: BridgeV2Surface
): surface is BridgeV2EventOptionSurface {
  return surface.kind === "event_option";
}

export function isBridgeV2EventDialogueSurface(
  surface: BridgeV2Surface
): surface is BridgeV2EventDialogueSurface {
  return surface.kind === "event_dialogue";
}

export function isBridgeV2RestSiteSurface(
  surface: BridgeV2Surface
): surface is BridgeV2RestSiteSurface {
  return surface.kind === "rest_site";
}

export function isBridgeV2ShopInventorySurface(
  surface: BridgeV2Surface
): surface is BridgeV2ShopInventorySurface {
  return surface.kind === "shop_inventory";
}

export function isBridgeV2ShopRoomSurface(
  surface: BridgeV2Surface
): surface is BridgeV2ShopRoomSurface {
  return surface.kind === "shop_room";
}

export function isBridgeV2TreasureRoomSurface(
  surface: BridgeV2Surface
): surface is BridgeV2TreasureRoomSurface {
  return surface.kind === "treasure_room";
}

export function isBridgeV2GameOverSurface(
  surface: BridgeV2Surface
): surface is BridgeV2GameOverSurface {
  return surface.kind === "game_over";
}

export function isBridgeV2CharacterSelectSurface(
  surface: BridgeV2Surface
): surface is BridgeV2CharacterSelectSurface {
  return surface.kind === "character_select";
}

export function isBridgeV2MainMenuSurface(
  surface: BridgeV2Surface
): surface is BridgeV2MainMenuSurface {
  return surface.kind === "main_menu";
}

export function isBridgeV2SingleplayerMenuSurface(
  surface: BridgeV2Surface
): surface is BridgeV2SingleplayerMenuSurface {
  return surface.kind === "singleplayer_menu";
}

export function isBridgeV2CombatTurnSurface(
  surface: BridgeV2Surface
): surface is BridgeV2CombatTurnSurface {
  return surface.kind === "combat_turn";
}

export function isBridgeV2CombatPileCardSelectionSurface(
  surface: BridgeV2Surface
): surface is BridgeV2CombatPileCardSelectionSurface {
  return surface.kind === "combat_pile_card_selection";
}

export function isBridgeV2CombatHandCardSelectionSurface(
  surface: BridgeV2Surface
): surface is BridgeV2CombatHandCardSelectionSurface {
  return surface.kind === "combat_hand_card_selection";
}

export function isBridgeV2EventCardAcquisitionSurface(
  surface: BridgeV2Surface
): surface is BridgeV2EventCardAcquisitionSurface {
  return surface.kind === "event_card_acquisition";
}

export function isBridgeV2GeneratedCardChoiceSurface(
  surface: BridgeV2Surface
): surface is BridgeV2GeneratedCardChoiceSurface {
  return surface.kind === "generated_card_choice";
}

export function isBridgeV2CardBundleSelectionSurface(
  surface: BridgeV2Surface
): surface is BridgeV2CardBundleSelectionSurface {
  return surface.kind === "card_bundle_selection";
}

export function isBridgeV2CardRewardSelectionSurface(
  surface: BridgeV2Surface
): surface is BridgeV2CardRewardSelectionSurface {
  return surface.kind === "card_reward_selection";
}

export function isBridgeV2RewardClaimSurface(
  surface: BridgeV2Surface
): surface is BridgeV2RewardClaimSurface {
  return surface.kind === "reward_claim";
}

export function isBridgeV2MapNavigationSurface(
  surface: BridgeV2Surface
): surface is BridgeV2MapNavigationSurface {
  return surface.kind === "map_navigation";
}

function parseContext(value: z.infer<typeof contextBaseSchema>): BridgeV2Context {
  if (value.kind === "event") return parse(eventContextSchema, value, "event context");
  if (value.kind === "combat") return parse(combatContextSchema, value, "combat context");
  if (value.kind === "reward_flow") return parse(rewardFlowContextSchema, value, "reward_flow context");
  if (value.kind === "rest") return parse(restContextSchema, value, "rest context");
  if (value.kind === "treasure") return parse(treasureContextSchema, value, "treasure context");
  if (value.kind === "game_over") return parse(gameOverContextSchema, value, "game_over context");
  if (value.kind === "menu") return parse(menuContextSchema, value, "menu context");
  if (value.kind === "shop") return parse(shopContextSchema, value, "shop context");
  if (value.kind === "map") return parse(mapContextSchema, value, "map context");
  if (value.kind === "combat_transition") {
    return parse(combatTransitionContextSchema, value, "combat_transition context");
  }
  if (value.kind === "unknown") return parse(unknownContextSchema, value, "unknown context");
  return value;
}

function decode<T>(value: unknown, schema: z.ZodType<T>, label: string): DecodedBridgePayload<T> {
  if (!isJsonObject(value)) throw new BridgeV2DecodeError(`${label} must be a JSON object`);
  return { raw: value, data: parse(schema, value, label) };
}

function parse<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const first = result.error.issues[0];
  const path = first?.path.length ? first.path.join(".") : "$";
  throw new BridgeV2DecodeError(`${label} is incompatible at ${path}: ${first?.message ?? "invalid value"}`);
}
