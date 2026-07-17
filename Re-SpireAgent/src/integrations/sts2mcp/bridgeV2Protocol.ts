import { z } from "zod";
import { isJsonObject, type JsonObject } from "../../shared/json.js";

export const SUPPORTED_BRIDGE_V2_PROTOCOL = "2.0-preview.13" as const;

const compatibilitySchema = z.object({
  status: z.string().min(1),
  action_execution_allowed: z.boolean(),
  detail: z.string()
}).passthrough();

const gameSchema = z.object({
  version: z.string().nullable().optional(),
  commit: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  main_assembly_hash: z.number().int().nullable().optional(),
  compatibility: compatibilitySchema
}).passthrough();

const bridgeIdentitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  upstream_commit: z.string().min(1)
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

const visibleRelicSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  counter: z.number().nullable().optional()
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
  entity_id: z.string().min(1),
  character: z.string().nullable().optional(),
  hp: z.number(),
  max_hp: z.number(),
  block: z.number(),
  energy: z.number().int(),
  max_energy: z.number().int(),
  stars: z.number().int().nullable().optional(),
  gold: z.number().int(),
  hand: z.array(visibleCardSchema),
  draw_pile_count: z.number().int().nonnegative(),
  discard_pile_count: z.number().int().nonnegative(),
  exhaust_pile_count: z.number().int().nonnegative(),
  statuses: z.array(visibleStatusSchema),
  relics: z.array(visibleRelicSchema),
  potions: z.array(visiblePotionSchema),
  max_potion_slots: z.number().int().nonnegative(),
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
  current_position: visibleMapCoordinateSchema.nullable(),
  visited: z.array(visibleMapCoordinateSchema),
  nodes: z.array(visibleMapNodeSchema)
}).passthrough();

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

const visibleEventOptionSchema = z.object({
  entity_id: z.string().min(1),
  index: z.number().int().nonnegative(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_locked: z.boolean(),
  is_proceed: z.boolean(),
  was_chosen: z.boolean(),
  relic_name: z.string().nullable().optional(),
  relic_description: z.string().nullable().optional()
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

const combatTurnSurfaceSchema = z.object({
  kind: z.literal("combat_turn"),
  room_entity_id: z.string().min(1),
  can_end_turn: z.boolean()
}).passthrough();

const combatPileCardSelectionSurfaceSchema = z.object({
  kind: z.literal("combat_pile_card_selection"),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1),
  pile_type: z.enum(["draw", "discard", "exhaust", "hand", "play"]),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().nonnegative(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  require_manual_confirmation: z.boolean(),
  cancelable: z.boolean(),
  cards: z.array(visibleCardSchema)
}).passthrough();

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

const generatedCardChoiceSurfaceSchema = z.object({
  kind: z.literal("generated_card_choice"),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1).nullable().optional(),
  can_skip: z.boolean(),
  is_peeking: z.boolean(),
  cards: z.array(visibleCardSchema)
}).passthrough();

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
  category: z.enum(["identity", "compatibility", "context", "surface", "visibility", "completeness", "action", "completion", "runtime"]),
  effect: z.enum(["none", "field_omitted", "actions_suppressed", "surface_unsupported", "outcome_unknown"]),
  recoverability: z.enum(["settle", "change_surface", "restart", "update_bridge", "unknown"]),
  path: z.string().nullable().optional(),
  visibility_class: z.enum(["on_screen", "normal_inspection", "count_only", "hidden"]).nullable().optional(),
  required_for_action: z.boolean().nullable().optional(),
  safe_detail: z.string().max(500).nullable().optional()
}).passthrough();

const inspectionContractSchema = z.object({
  status: z.literal("implemented_read_only"),
  state_bound: z.literal(true),
  arbitrary_queries_allowed: z.literal(false),
  enters_command_ledger: z.literal(false),
  visibility_classes: z.array(z.enum(["on_screen", "normal_inspection", "count_only"])),
  ordering_semantics: z.array(z.enum(["unordered_multiset", "player_sorted"])),
  implemented_kinds: z.array(z.enum(["run_deck", "combat_piles"]))
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

const inspectionSchema = z.object({
  protocol_version: z.literal(SUPPORTED_BRIDGE_V2_PROTOCOL),
  inspection_id: z.string().min(1),
  expected_state_id: z.string().min(1),
  observed_state_id: z.string().min(1),
  observed_at: z.string().min(1),
  kind: z.enum(["run_deck", "combat_piles"]),
  visibility_class: z.literal("normal_inspection"),
  ordering_semantics: z.literal("unordered_multiset"),
  content: z.discriminatedUnion("kind", [
    runDeckInspectionContentSchema,
    combatPilesInspectionContentSchema
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

const stateBaseSchema = z.object({
  protocol_version: z.literal(SUPPORTED_BRIDGE_V2_PROTOCOL),
  state_id: z.string().min(1),
  state_sequence: z.number().int().nonnegative(),
  observed_at: z.string(),
  readiness: z.string().min(1),
  context: contextBaseSchema,
  surface_kind: z.string().min(1),
  surface: surfaceBaseSchema,
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

export type BridgeV2Capabilities = z.infer<typeof capabilitiesSchema>;
export type BridgeV2LegalAction = z.infer<typeof legalActionSchema>;
export type BridgeV2DeckEnchantSurface = z.infer<typeof deckEnchantSurfaceSchema>;
export type BridgeV2EventContext = z.infer<typeof eventContextSchema>;
export type BridgeV2CombatContext = z.infer<typeof combatContextSchema>;
export type BridgeV2RewardFlowContext = z.infer<typeof rewardFlowContextSchema>;
export type BridgeV2RestContext = z.infer<typeof restContextSchema>;
export type BridgeV2MapContext = z.infer<typeof mapContextSchema>;
export type BridgeV2UnknownContext = z.infer<typeof unknownContextSchema>;
export type BridgeV2EventOptionSurface = z.infer<typeof eventOptionSurfaceSchema>;
export type BridgeV2EventDialogueSurface = z.infer<typeof eventDialogueSurfaceSchema>;
export type BridgeV2RestSiteSurface = z.infer<typeof restSiteSurfaceSchema>;
export type BridgeV2CombatTurnSurface = z.infer<typeof combatTurnSurfaceSchema>;
export type BridgeV2CombatPileCardSelectionSurface = z.infer<typeof combatPileCardSelectionSurfaceSchema>;
export type BridgeV2CombatHandCardSelectionSurface = z.infer<typeof combatHandCardSelectionSurfaceSchema>;
export type BridgeV2GeneratedCardChoiceSurface = z.infer<typeof generatedCardChoiceSurfaceSchema>;
export type BridgeV2CardBundleSelectionSurface = z.infer<typeof cardBundleSelectionSurfaceSchema>;
export type BridgeV2CardRewardSelectionSurface = z.infer<typeof cardRewardSelectionSurfaceSchema>;
export type BridgeV2RewardClaimSurface = z.infer<typeof rewardClaimSurfaceSchema>;
export type BridgeV2MapNavigationSurface = z.infer<typeof mapNavigationSurfaceSchema>;
export type BridgeV2Diagnostic = z.infer<typeof diagnosticSchema>;
export type BridgeV2Inspection = z.infer<typeof inspectionSchema>;
export type BridgeV2UnsupportedSurface = z.infer<typeof unsupportedSurfaceSchema>;
export type BridgeV2Command = z.infer<typeof commandSchema>;

export type BridgeV2Context =
  | BridgeV2EventContext
  | BridgeV2CombatContext
  | BridgeV2RewardFlowContext
  | BridgeV2RestContext
  | BridgeV2MapContext
  | BridgeV2UnknownContext
  | (Record<string, unknown> & { kind: string });

export type BridgeV2Surface =
  | BridgeV2DeckEnchantSurface
  | BridgeV2EventDialogueSurface
  | BridgeV2RestSiteSurface
  | BridgeV2EventOptionSurface
  | BridgeV2CombatTurnSurface
  | BridgeV2CombatPileCardSelectionSurface
  | BridgeV2CombatHandCardSelectionSurface
  | BridgeV2GeneratedCardChoiceSurface
  | BridgeV2CardBundleSelectionSurface
  | BridgeV2CardRewardSelectionSurface
  | BridgeV2RewardClaimSurface
  | BridgeV2MapNavigationSurface
  | BridgeV2UnsupportedSurface
  | (Record<string, unknown> & { kind: string });

export type BridgeV2State = z.infer<typeof stateBaseSchema> & {
  context: BridgeV2Context;
  surface: BridgeV2Surface;
};

export interface DecodedBridgePayload<T> {
  data: T;
  raw: JsonObject;
}

export class BridgeV2DecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BridgeV2DecodeError";
  }
}

export function decodeBridgeV2Capabilities(value: unknown): DecodedBridgePayload<BridgeV2Capabilities> {
  return decode(value, capabilitiesSchema, "Bridge v2 capabilities");
}

export function decodeBridgeV2State(value: unknown): DecodedBridgePayload<BridgeV2State> {
  const decoded = decode(value, stateBaseSchema, "Bridge v2 state");
  if (decoded.data.surface_kind !== decoded.data.surface.kind) {
    throw new BridgeV2DecodeError(
      `Bridge v2 state surface_kind ${decoded.data.surface_kind} does not match surface.kind ${decoded.data.surface.kind}`
    );
  }

  const context = parseContext(decoded.data.context);
  let surface: BridgeV2Surface;
  if (decoded.data.surface.kind === "deck_enchant_selection") {
    surface = parse(deckEnchantSurfaceSchema, decoded.data.surface, "deck_enchant_selection surface");
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
  } else if (decoded.data.surface.kind === "generated_card_choice") {
    surface = parse(generatedCardChoiceSurfaceSchema, decoded.data.surface, "generated_card_choice surface");
    if (context.kind !== "combat") {
      throw new BridgeV2DecodeError("Bridge v2 generated_card_choice surface requires combat context");
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
  } else if (decoded.data.surface.kind === "unsupported") {
    surface = parse(unsupportedSurfaceSchema, decoded.data.surface, "unsupported surface");
  } else {
    surface = decoded.data.surface;
  }

  const visibleEntityIds = collectEntityIds({ context, surface });
  for (const action of decoded.data.legal_actions) {
    for (const binding of action.entity_bindings) {
      if (!visibleEntityIds.has(binding.entity_id)) {
        throw new BridgeV2DecodeError(
          `Bridge v2 action ${action.action_id} binds ${binding.role} to entity ${binding.entity_id}, which is absent from the visible context and surface`
        );
      }
    }
  }

  return { raw: decoded.raw, data: { ...decoded.data, context, surface } };
}

function collectEntityIds(value: unknown, result = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const entry of value) collectEntityIds(entry, result);
    return result;
  }
  if (!isJsonObject(value)) return result;
  if (typeof value.entity_id === "string") result.add(value.entity_id);
  for (const entry of Object.values(value)) collectEntityIds(entry, result);
  return result;
}

export function decodeBridgeV2Command(value: unknown): DecodedBridgePayload<BridgeV2Command> {
  return decode(value, commandSchema, "Bridge v2 command");
}

export function decodeBridgeV2Inspection(value: unknown): DecodedBridgePayload<BridgeV2Inspection> {
  const decoded = decode(value, inspectionSchema, "Bridge v2 inspection");
  if (decoded.data.kind !== decoded.data.content.kind) {
    throw new BridgeV2DecodeError(
      `Bridge v2 inspection kind ${decoded.data.kind} does not match content.kind ${decoded.data.content.kind}`
    );
  }
  return decoded;
}

export function isBridgeV2DeckEnchantSurface(
  surface: BridgeV2Surface
): surface is BridgeV2DeckEnchantSurface {
  return surface.kind === "deck_enchant_selection";
}

export function isBridgeV2UnsupportedSurface(
  surface: BridgeV2Surface
): surface is BridgeV2UnsupportedSurface {
  return surface.kind === "unsupported"
    && typeof surface.source_type === "string"
    && typeof surface.reason === "string";
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

export function isBridgeV2MapContext(context: BridgeV2Context): context is BridgeV2MapContext {
  return context.kind === "map";
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
  if (value.kind === "map") return parse(mapContextSchema, value, "map context");
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
