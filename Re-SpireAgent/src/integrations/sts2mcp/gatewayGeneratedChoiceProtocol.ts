import { z } from "zod";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

const generatedChoiceBase = z.object({
  kind: z.literal("generated_card_choice"),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1).nullable().optional(),
  can_skip: z.boolean(),
  skip_available: z.boolean(),
  is_peeking: z.boolean(),
  cards: z.array(visibleCardSchema).min(1),
  selectable_card_entity_ids: z.array(z.string().min(1)),
  select_operation: z.string().min(1),
  skip_operation: z.string().min(1).nullable().optional()
});

const generatedCombatPotionSource = z.enum([
  "colorless_potion",
  "attack_potion",
  "skill_potion",
  "power_potion"
]);

const generatedChoiceSurfaceSchema = z.discriminatedUnion("source_kind", [
  generatedChoiceBase.extend({
    purpose: z.literal("acquire_one_generated_card"),
    source_kind: z.literal("lead_paperweight"),
    destination: z.literal("run_deck"),
    selected_card_cost_policy: z.literal("unchanged"),
    overflow_destination: z.null().optional(),
    select_operation: z.literal("select_lead_paperweight_card"),
    skip_operation: z.literal("skip_lead_paperweight_choice")
  }).passthrough(),
  generatedChoiceBase.extend({
    purpose: z.literal("acquire_one_generated_rare_card_plus_injury"),
    source_kind: z.literal("hefty_tablet"),
    destination: z.literal("run_deck"),
    selected_card_cost_policy: z.literal("unchanged"),
    overflow_destination: z.null().optional(),
    select_operation: z.literal("select_hefty_tablet_card"),
    skip_operation: z.literal("skip_hefty_tablet_choice")
  }).passthrough(),
  generatedChoiceBase.extend({
    purpose: z.literal("choose_one_generated_combat_card"),
    source_kind: generatedCombatPotionSource,
    destination: z.literal("combat_hand"),
    selected_card_cost_policy: z.literal("free_this_turn"),
    overflow_destination: z.literal("combat_discard_if_hand_full"),
    select_operation: z.literal("select_generated_combat_card"),
    skip_operation: z.literal("skip_generated_combat_card_choice")
  }).passthrough(),
  generatedChoiceBase.extend({
    purpose: z.literal("choose_one_generated_combat_card"),
    source_kind: z.literal("splash"),
    destination: z.literal("combat_hand"),
    selected_card_cost_policy: z.literal("free_this_turn"),
    overflow_destination: z.literal("combat_discard_if_hand_full"),
    select_operation: z.literal("select_splash_generated_card"),
    skip_operation: z.literal("skip_splash_generated_card_choice")
  }).passthrough(),
  generatedChoiceBase.extend({
    purpose: z.literal("choose_one_generated_combat_card"),
    source_kind: z.literal("quasar"),
    destination: z.literal("combat_hand"),
    selected_card_cost_policy: z.literal("unchanged"),
    overflow_destination: z.literal("combat_discard_if_hand_full"),
    select_operation: z.literal("choose_quasar_card"),
    skip_operation: z.literal("skip_quasar_choice")
  }).passthrough(),
  generatedChoiceBase.extend({
    purpose: z.literal("choose_one_immediate_enemy_effect"),
    source_kind: z.literal("knowledge_demon_curse"),
    destination: z.literal("immediate_player_effect"),
    selected_card_cost_policy: z.literal("not_applicable"),
    overflow_destination: z.null().optional(),
    can_skip: z.literal(false),
    skip_available: z.literal(false),
    select_operation: z.literal("choose_knowledge_demon_curse"),
    skip_operation: z.null().optional()
  }).passthrough()
]);

export const gatewayGeneratedChoiceSurfaceSchema = generatedChoiceSurfaceSchema.superRefine(
  (surface, context) => {
    const cardIds = new Set(surface.cards.map((card) => card.entity_id));
    const selectable = new Set(surface.selectable_card_entity_ids);
    if (selectable.size !== surface.selectable_card_entity_ids.length
        || surface.selectable_card_entity_ids.some((id) => !cardIds.has(id))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "generated choice selectable ids must be unique current visible cards"
      });
    }
    if (surface.is_peeking
        && (surface.selectable_card_entity_ids.length > 0 || surface.skip_available)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "generated choice cannot advertise actionable controls while peeking"
      });
    }
    if (surface.skip_available && (!surface.can_skip || !surface.skip_operation)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "generated choice skip availability requires its exact native operation"
      });
    }
  }
);

export type GatewayGeneratedChoiceSurface = z.infer<
  typeof gatewayGeneratedChoiceSurfaceSchema
>;
