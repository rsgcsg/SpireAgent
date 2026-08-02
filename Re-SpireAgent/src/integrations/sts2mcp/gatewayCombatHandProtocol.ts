import { z } from "zod";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

export const gatewayCombatHandSurfaceSchema = z.object({
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
  selectable_card_entity_ids: z.array(z.string().min(1)),
  deselectable_card_entity_ids: z.array(z.string().min(1)),
  can_confirm: z.boolean(),
  can_close_peek: z.boolean(),
  cards: z.array(visibleCardSchema)
}).passthrough().superRefine((surface, context) => {
  const cardIds = new Set(surface.cards.map((card) => card.entity_id));
  const selectedIds = new Set(surface.selected_card_entity_ids);
  if (surface.selected_count !== selectedIds.size) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "combat-hand selected_count must equal exact selected membership"
    });
  }
  for (const id of [
    ...selectedIds,
    ...surface.selectable_card_entity_ids,
    ...surface.deselectable_card_entity_ids
  ]) {
    if (!cardIds.has(id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `combat-hand action membership references unknown card ${id}`
      });
    }
  }
  if (surface.deselectable_card_entity_ids.some((id) => !selectedIds.has(id))) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "combat-hand deselectable cards must be currently selected"
    });
  }
});

export type GatewayCombatHandSurface = z.infer<
  typeof gatewayCombatHandSurfaceSchema
>;
