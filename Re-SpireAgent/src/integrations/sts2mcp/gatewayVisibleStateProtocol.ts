import { z } from "zod";

export const visibleEnchantmentSchema = z.object({
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amount: z.number().int(),
  observation_source: z.string().optional()
}).passthrough();

export const visibleCardSchema = z.object({
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

export const visibleKeywordSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional()
}).passthrough();

export const visibleRelicSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  counter: z.number().nullable().optional(),
  keywords: z.array(visibleKeywordSchema),
  card_previews: z.array(visibleCardSchema)
}).passthrough();

export const visibleOwnedPotionSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  slot: z.number().int().nonnegative(),
  keywords: z.array(visibleKeywordSchema),
  card_previews: z.array(visibleCardSchema)
}).passthrough();

export const sharedVisibleStateSchema = z.object({
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

export type GatewayVisibleCard = z.infer<typeof visibleCardSchema>;
export type GatewaySharedVisibleState = z.infer<typeof sharedVisibleStateSchema>;
