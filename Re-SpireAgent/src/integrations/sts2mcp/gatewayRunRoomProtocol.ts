import { z } from "zod";
import {
  visibleCardSchema,
  visibleRelicSchema
} from "./gatewayVisibleStateProtocol.js";

export const gatewayRunRoomContextSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("rest") }).passthrough(),
  z.object({ kind: z.literal("shop") }).passthrough(),
  z.object({ kind: z.literal("treasure") }).passthrough()
]);

const restOptionSchema = z.object({
  entity_id: z.string().min(1),
  index: z.number().int().nonnegative(),
  option_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  enabled: z.boolean()
}).passthrough();

export const gatewayRestSiteSurfaceSchema = z.object({
  kind: z.literal("rest_site"),
  screen_entity_id: z.string().min(1),
  options: z.array(restOptionSchema),
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

export const shopCardOfferSchema = shopOfferBaseSchema.extend({
  on_sale: z.boolean(),
  card: visibleCardSchema.nullable().optional()
}).passthrough();

export const shopRelicOfferSchema = shopOfferBaseSchema.extend({
  relic: visibleRelicSchema.nullable().optional()
}).passthrough();

export const shopPotionOfferSchema = shopOfferBaseSchema.extend({
  definition_id: z.string().min(1).nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  rarity: z.string().nullable().optional()
}).passthrough();

export const shopCardRemovalOfferSchema = shopOfferBaseSchema.extend({
  next_price_increase: z.number().int().nonnegative()
}).passthrough();

export const gatewayShopInventorySurfaceSchema = z.object({
  kind: z.literal("shop_inventory"),
  screen_entity_id: z.string().min(1),
  cards: z.array(shopCardOfferSchema),
  relics: z.array(shopRelicOfferSchema),
  potions: z.array(shopPotionOfferSchema),
  card_removal: shopCardRemovalOfferSchema.nullable().optional(),
  can_close: z.boolean()
}).passthrough();

export const gatewayShopRoomSurfaceSchema = z.object({
  kind: z.literal("shop_room"),
  room_entity_id: z.string().min(1),
  can_open_inventory: z.boolean(),
  can_proceed: z.boolean()
}).passthrough();

export const gatewayTreasureRoomSurfaceSchema = z.object({
  kind: z.literal("treasure_room"),
  stage: z.enum(["closed", "opening", "relic_choice", "completed"]),
  room_entity_id: z.string().min(1),
  chest_opened: z.boolean(),
  relics: z.array(visibleRelicSchema).max(1),
  can_skip: z.boolean(),
  can_proceed: z.boolean()
}).passthrough();

export const gatewayRunRoomSurfaceSchema = z.discriminatedUnion("kind", [
  gatewayRestSiteSurfaceSchema,
  gatewayShopInventorySurfaceSchema,
  gatewayShopRoomSurfaceSchema,
  gatewayTreasureRoomSurfaceSchema
]);

export type GatewayRunRoomContext = z.infer<typeof gatewayRunRoomContextSchema>;
export type GatewayRunRoomSurface = z.infer<typeof gatewayRunRoomSurfaceSchema>;
