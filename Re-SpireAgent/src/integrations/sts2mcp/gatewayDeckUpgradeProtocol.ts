import { z } from "zod";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

export const gatewayDeckUpgradeSurfaceSchema = z.object({
  kind: z.literal("deck_upgrade_selection"),
  stage: z.enum(["selecting", "preview"]),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().positive(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  cancelable: z.boolean(),
  selectable_card_entity_ids: z.array(z.string().min(1)),
  deselectable_card_entity_ids: z.array(z.string().min(1)),
  can_cancel_selection: z.boolean(),
  can_cancel_preview: z.boolean(),
  can_confirm: z.boolean(),
  cards: z.array(visibleCardSchema),
  preview_cards: z.array(visibleCardSchema)
}).passthrough().superRefine((surface, context) => {
  const cardIds = surface.cards.map((card) => card.entity_id);
  const knownCards = new Set(cardIds);
  const selected = new Set(surface.selected_card_entity_ids);
  const selectable = new Set(surface.selectable_card_entity_ids);
  const deselectable = new Set(surface.deselectable_card_entity_ids);
  const issue = (message: string): void => context.addIssue({
    code: z.ZodIssueCode.custom,
    message
  });

  if (knownCards.size !== cardIds.length) issue("deck-upgrade card ids must be unique");
  if (selected.size !== surface.selected_card_entity_ids.length) {
    issue("deck-upgrade selected card ids must be unique");
  }
  if (selectable.size !== surface.selectable_card_entity_ids.length
      || deselectable.size !== surface.deselectable_card_entity_ids.length) {
    issue("deck-upgrade actionable card ids must be unique");
  }
  if (surface.min_select > surface.max_select) {
    issue("deck-upgrade selection bounds are invalid");
  }
  if (surface.selected_count !== selected.size
      || surface.selected_count > surface.max_select) {
    issue("deck-upgrade selected_count must equal bounded exact membership");
  }
  for (const id of [...selected, ...selectable, ...deselectable]) {
    if (!knownCards.has(id)) issue(`deck-upgrade membership references unknown card ${id}`);
  }
  for (const id of deselectable) {
    if (!selected.has(id)) issue("deck-upgrade deselectable cards must be selected");
  }
  for (const id of selectable) {
    if (selected.has(id)) issue("deck-upgrade selectable cards must not already be selected");
  }
  if (surface.stage === "selecting") {
    if (surface.preview_cards.length > 0) issue("selecting stage cannot expose preview cards");
    if (surface.can_cancel_preview || surface.can_confirm) {
      issue("selecting stage cannot publish preview controls");
    }
    if (surface.can_cancel_selection && !surface.cancelable) {
      issue("selection cancel control requires a cancelable native selector");
    }
  } else {
    if (selectable.size > 0 || deselectable.size > 0 || surface.can_cancel_selection) {
      issue("preview stage cannot publish selecting-stage controls");
    }
    if (selected.size === 0 || surface.preview_cards.length !== selected.size) {
      issue("preview stage must match exact selected and preview card counts");
    }
    if (surface.can_confirm && selected.size < surface.min_select) {
      issue("preview confirm requires the native minimum selection");
    }
  }
});

export type GatewayDeckUpgradeSurface = z.infer<
  typeof gatewayDeckUpgradeSurfaceSchema
>;
