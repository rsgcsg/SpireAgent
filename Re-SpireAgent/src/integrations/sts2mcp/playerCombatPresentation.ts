import { z } from "zod";
import { visibleCardSchema } from "./playerVisibleStateProtocol.js";

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

const visibleOrbSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  passive_value: z.number(),
  evoke_value: z.number(),
  queue_index: z.number().int().nonnegative(),
  is_next_to_evoke: z.boolean()
}).passthrough();

export const playerCombatContextSchema = z.object({
  kind: z.literal("combat"),
  encounter_type: z.enum(["normal", "elite", "boss", "unknown"]),
  round: z.number().int().nonnegative(),
  turn_owner: z.string().min(1),
  is_play_phase: z.boolean(),
  player: z.object({
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
  }).passthrough(),
  enemies: z.array(z.object({
    entity_id: z.string().min(1),
    combat_id: z.number().int().nonnegative().nullable().optional(),
    definition_id: z.string().min(1),
    name: z.string().nullable().optional(),
    hp: z.number(),
    max_hp: z.number(),
    block: z.number(),
    statuses: z.array(visibleStatusSchema),
    intents: z.array(visibleIntentSchema)
  }).passthrough())
}).passthrough();

export type PlayerCombatContext = z.infer<typeof playerCombatContextSchema>;
