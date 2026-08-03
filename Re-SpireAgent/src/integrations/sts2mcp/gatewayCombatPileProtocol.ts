import { z } from "zod";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

export const gatewayCombatPileSurfaceSchema = z.object({
  kind: z.literal("combat_pile_card_selection"),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1),
  purpose: z.string().min(1),
  mutation_kind: z.enum(["move_selected_cards", "replace_selected_cards_same_index"]),
  commit_mode: z.enum(["automatic_at_max", "manual_confirm"]),
  source_kind: z.string().min(1),
  source_entity_kind: z.enum(["card", "power"]),
  source_entity_id: z.string().min(1),
  source_definition_id: z.string().min(1),
  source_card_entity_id: z.string().min(1).nullable().optional(),
  source_card_definition_id: z.string().min(1).nullable().optional(),
  pile_type: z.enum(["discard", "draw"]),
  destination_pile: z.enum(["discard", "draw", "hand", "exhaust"]),
  destination_position: z.enum(["top", "bottom", "same_index"]),
  overflow_destination: z.enum(["discard_if_hand_full", "draw_if_hand_full"]).nullable().optional(),
  replacement_card_definition_id: z.string().min(1).nullable().optional(),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().positive(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  require_manual_confirmation: z.boolean(),
  cancelable: z.literal(false),
  cards: z.array(visibleCardSchema).min(1),
  selectable_card_entity_ids: z.array(z.string().min(1)),
  deselectable_card_entity_ids: z.array(z.string().min(1)),
  can_confirm: z.boolean()
}).passthrough().superRefine((surface, context) => {
  const cardIds = surface.cards.map((card) => card.entity_id);
  const known = new Set(cardIds);
  const selected = new Set(surface.selected_card_entity_ids);
  const selectable = new Set(surface.selectable_card_entity_ids);
  const deselectable = new Set(surface.deselectable_card_entity_ids);
  const issue = (message: string): void => context.addIssue({
    code: z.ZodIssueCode.custom,
    message
  });
  if (known.size !== cardIds.length
      || selected.size !== surface.selected_card_entity_ids.length
      || selectable.size !== surface.selectable_card_entity_ids.length
      || deselectable.size !== surface.deselectable_card_entity_ids.length) {
    issue("combat-pile entity memberships must be unique");
  }
  if (surface.min_select > surface.max_select
      || surface.selected_count !== selected.size
      || selected.size > surface.max_select) {
    issue("combat-pile selected membership must satisfy exact bounds");
  }
  for (const id of [...selected, ...selectable, ...deselectable]) {
    if (!known.has(id)) issue(`combat-pile membership references unknown card ${id}`);
  }
  for (const id of selectable) {
    if (selected.has(id)) issue("combat-pile selectable cards must not already be selected");
  }
  for (const id of deselectable) {
    if (!selected.has(id)) issue("combat-pile deselectable cards must be selected");
  }
  const manual = surface.commit_mode === "manual_confirm";
  if (surface.require_manual_confirmation !== manual
      || (surface.can_confirm && (!manual || selected.size < surface.min_select))) {
    issue("combat-pile confirm publication must match the native commit mode and bounds");
  }
});

export type GatewayCombatPileSurface = z.infer<typeof gatewayCombatPileSurfaceSchema>;
