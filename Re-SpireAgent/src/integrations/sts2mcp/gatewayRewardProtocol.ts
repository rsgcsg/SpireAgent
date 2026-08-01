import { z } from "zod";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

export const gatewayRewardFlowContextSchema = z.object({
  kind: z.literal("reward_flow"),
  reward_kind: z.enum(["card_reward", "room_rewards"])
}).passthrough();

const visibleCardRewardAlternativeSchema = z.object({
  entity_id: z.string().min(1),
  index: z.number().int().nonnegative(),
  label: z.string().min(1),
  enabled: z.boolean()
}).passthrough();

export const gatewayCardRewardSelectionSurfaceSchema = z.object({
  kind: z.literal("card_reward_selection"),
  screen_entity_id: z.string().min(1),
  cards: z.array(visibleCardSchema),
  selectable_card_entity_ids: z.array(z.string().min(1)).optional(),
  alternatives: z.array(visibleCardRewardAlternativeSchema)
}).passthrough();

const visibleRewardSchema = z.object({
  entity_id: z.string().min(1),
  kind: z.enum(["gold", "potion", "relic", "card", "other_visible_reward"]),
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  enabled: z.boolean()
}).passthrough();

const visibleRewardPotionSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  slot: z.number().int().nonnegative(),
  target_type: z.string(),
  can_use: z.boolean(),
  automatic: z.boolean()
}).passthrough();

export const gatewayRewardClaimSurfaceSchema = z.object({
  kind: z.literal("reward_claim"),
  screen_entity_id: z.string().min(1),
  rewards: z.array(visibleRewardSchema),
  potion_slots_full: z.boolean(),
  discardable_potions: z.array(visibleRewardPotionSchema),
  can_proceed: z.boolean(),
  proceed_skips_remaining_rewards: z.boolean()
}).passthrough();

export const gatewayRewardSurfaceSchema = z.discriminatedUnion("kind", [
  gatewayCardRewardSelectionSurfaceSchema,
  gatewayRewardClaimSurfaceSchema
]);

export type GatewayRewardFlowContext = z.infer<typeof gatewayRewardFlowContextSchema>;
export type GatewayRewardSurface = z.infer<typeof gatewayRewardSurfaceSchema>;
