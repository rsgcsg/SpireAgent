import { z } from "zod";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

export const gatewayMerchantRemovalSurfaceSchema = z.object({
  kind: z.literal("deck_removal_selection"),
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
  can_preview: z.boolean(),
  can_cancel_selection: z.boolean(),
  can_cancel_preview: z.boolean(),
  can_confirm: z.boolean(),
  cards: z.array(visibleCardSchema)
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

  if (knownCards.size !== cardIds.length) issue("merchant-removal card ids must be unique");
  if (selected.size !== surface.selected_card_entity_ids.length
      || selectable.size !== surface.selectable_card_entity_ids.length
      || deselectable.size !== surface.deselectable_card_entity_ids.length) {
    issue("merchant-removal selection memberships must be unique");
  }
  if (surface.min_select > surface.max_select
      || surface.selected_count !== selected.size
      || surface.selected_count > surface.max_select) {
    issue("merchant-removal selection bounds or exact membership are invalid");
  }
  for (const id of [...selected, ...selectable, ...deselectable]) {
    if (!knownCards.has(id)) issue(`merchant-removal membership references unknown card ${id}`);
  }
  for (const id of deselectable) {
    if (!selected.has(id)) issue("merchant-removal deselectable cards must be selected");
  }
  for (const id of selectable) {
    if (selected.has(id)) issue("merchant-removal selectable cards must not be selected");
  }
  if (surface.stage === "selecting") {
    if (surface.can_cancel_preview || surface.can_confirm) {
      issue("merchant-removal selecting stage cannot publish preview controls");
    }
    if (surface.can_preview && selected.size < surface.min_select) {
      issue("merchant-removal preview requires the native minimum selection");
    }
    if (surface.can_cancel_selection && !surface.cancelable) {
      issue("merchant-removal selection cancel requires a cancelable selector");
    }
  } else {
    if (selectable.size > 0 || deselectable.size > 0
        || surface.can_preview || surface.can_cancel_selection) {
      issue("merchant-removal preview stage cannot publish selecting controls");
    }
    if (selected.size === 0 || selected.size < surface.min_select) {
      issue("merchant-removal preview requires exact selected membership");
    }
  }
});

export type GatewayMerchantRemovalSurface = z.infer<
  typeof gatewayMerchantRemovalSurfaceSchema
>;
