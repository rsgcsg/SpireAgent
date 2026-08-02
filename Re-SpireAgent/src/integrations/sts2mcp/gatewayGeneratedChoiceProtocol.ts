import { z } from "zod";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

const generatedChoiceBase = z.object({
  kind: z.literal("generated_card_choice"),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1).nullable().optional(),
  can_skip: z.boolean(),
  is_peeking: z.boolean(),
  cards: z.array(visibleCardSchema).min(1)
});

const generatedCombatSource = z.enum([
  "colorless_potion",
  "attack_potion",
  "skill_potion",
  "power_potion",
  "splash",
  "quasar"
]);

export const gatewayGeneratedChoiceSurfaceSchema = z.discriminatedUnion("source_kind", [
  generatedChoiceBase.extend({
    purpose: z.literal("acquire_one_generated_card"),
    source_kind: z.literal("lead_paperweight"),
    destination: z.literal("run_deck"),
    selected_card_cost_policy: z.literal("unchanged"),
    overflow_destination: z.null().optional()
  }).passthrough(),
  generatedChoiceBase.extend({
    purpose: z.literal("acquire_one_generated_rare_card_plus_injury"),
    source_kind: z.literal("hefty_tablet"),
    destination: z.literal("run_deck"),
    selected_card_cost_policy: z.literal("unchanged"),
    overflow_destination: z.null().optional()
  }).passthrough(),
  generatedChoiceBase.extend({
    purpose: z.literal("choose_one_generated_combat_card"),
    source_kind: generatedCombatSource,
    destination: z.literal("combat_hand"),
    selected_card_cost_policy: z.enum(["free_this_turn", "unchanged"]),
    overflow_destination: z.literal("combat_discard_if_hand_full")
  }).passthrough(),
  generatedChoiceBase.extend({
    purpose: z.literal("choose_one_immediate_enemy_effect"),
    source_kind: z.literal("knowledge_demon_curse"),
    destination: z.literal("immediate_player_effect"),
    selected_card_cost_policy: z.literal("not_applicable"),
    overflow_destination: z.null().optional(),
    can_skip: z.literal(false)
  }).passthrough()
]);

export type GatewayGeneratedChoiceSurface = z.infer<
  typeof gatewayGeneratedChoiceSurfaceSchema
>;
