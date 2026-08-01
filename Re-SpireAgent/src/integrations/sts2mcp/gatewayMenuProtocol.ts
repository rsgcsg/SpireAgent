import { z } from "zod";

export const gatewayMenuContextSchema = z.object({
  kind: z.literal("menu"),
  flow: z.enum(["root_navigation", "standard_run_setup"])
}).passthrough();

export const visibleCharacterChoiceSchema = z.object({
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

export const characterSelectSurfaceSchema = z.object({
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

export const visibleMenuOptionSchema = z.object({
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

export const mainMenuSurfaceSchema = z.object({
  kind: z.literal("main_menu"),
  stage: z.enum(["choosing", "blocked"]),
  screen_entity_id: z.string().min(1),
  options: z.array(visibleMenuOptionSchema).min(1),
  continue_run: visibleContinueRunSummarySchema.nullable().optional()
}).passthrough();

export const singleplayerMenuSurfaceSchema = z.object({
  kind: z.literal("singleplayer_menu"),
  stage: z.enum(["choosing", "blocked"]),
  screen_entity_id: z.string().min(1),
  options: z.array(visibleMenuOptionSchema).min(1)
}).passthrough();

export const gatewayMenuSurfaceSchema = z.discriminatedUnion("kind", [
  mainMenuSurfaceSchema,
  singleplayerMenuSurfaceSchema,
  characterSelectSurfaceSchema
]);

export type GatewayMenuSurface = z.infer<typeof gatewayMenuSurfaceSchema>;
export type GatewayMenuContext = z.infer<typeof gatewayMenuContextSchema>;
