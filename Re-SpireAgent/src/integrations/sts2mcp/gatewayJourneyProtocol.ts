import { z } from "zod";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

export const gatewayEventContextSchema = z.object({
  kind: z.literal("event"),
  event_id: z.string().min(1),
  name: z.string().nullable().optional(),
  ancient: z.boolean(),
  in_dialogue: z.boolean(),
  body: z.string().nullable().optional()
}).passthrough();

const visibleEventTooltipSchema = z.discriminatedUnion("kind", [
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
]);

const visibleEventOptionSchema = z.object({
  entity_id: z.string().min(1),
  index: z.number().int().nonnegative(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_enabled: z.boolean(),
  is_locked: z.boolean(),
  is_proceed: z.boolean(),
  was_chosen: z.boolean(),
  will_kill_player: z.boolean(),
  relic_name: z.string().nullable().optional(),
  relic_description: z.string().nullable().optional(),
  tooltips: z.array(visibleEventTooltipSchema)
}).passthrough();

export const gatewayEventOptionSurfaceSchema = z.object({
  kind: z.literal("event_option"),
  screen_entity_id: z.string().min(1),
  options: z.array(visibleEventOptionSchema)
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

export const gatewayMapContextSchema = z.object({
  kind: z.literal("map"),
  act_index: z.number().int().nonnegative(),
  current_position: visibleMapCoordinateSchema.nullable().optional(),
  visited: z.array(visibleMapCoordinateSchema),
  nodes: z.array(visibleMapNodeSchema)
}).passthrough();

const visibleMapChoiceSchema = z.object({
  entity_id: z.string().min(1),
  col: z.number().int(),
  row: z.number().int(),
  point_type: z.string().min(1)
}).passthrough();

export const gatewayMapNavigationSurfaceSchema = z.object({
  kind: z.literal("map_navigation"),
  screen_entity_id: z.string().min(1),
  travel_enabled: z.boolean(),
  traveling: z.boolean(),
  drawing_mode: z.enum(["none", "drawing", "erasing"]),
  next_options: z.array(visibleMapChoiceSchema)
}).passthrough();

export const gatewayGameOverContextSchema = z.object({
  kind: z.literal("game_over"),
  result: z.enum(["win", "loss"]),
  game_mode: z.literal("standard"),
  score: z.number().int().nonnegative().nullable().optional(),
  floor_reached: z.number().int().nonnegative().nullable().optional(),
  ascension: z.number().int().nonnegative().nullable().optional()
}).passthrough();

export const gatewayGameOverSurfaceSchema = z.object({
  kind: z.literal("game_over"),
  stage: z.enum(["intro_animating", "intro", "summary_animating", "summary"]),
  screen_entity_id: z.string().min(1),
  return_destination: z.enum(["main_menu", "timeline"]).nullable().optional(),
  can_advance_summary: z.boolean(),
  can_return: z.boolean()
}).passthrough();

export const gatewayJourneySurfaceSchema = z.discriminatedUnion("kind", [
  gatewayEventOptionSurfaceSchema,
  gatewayMapNavigationSurfaceSchema,
  gatewayGameOverSurfaceSchema
]);

export type GatewayEventContext = z.infer<typeof gatewayEventContextSchema>;
export type GatewayMapContext = z.infer<typeof gatewayMapContextSchema>;
export type GatewayGameOverContext = z.infer<typeof gatewayGameOverContextSchema>;
export type GatewayJourneySurface = z.infer<typeof gatewayJourneySurfaceSchema>;
