import { z } from "zod";
import {
  visibleCardSchema,
  visibleEnchantmentSchema
} from "./gatewayVisibleStateProtocol.js";

export const gatewayDeckEnchantSurfaceSchema = z.object({
  kind: z.literal("deck_enchant_selection"),
  stage: z.enum(["selecting", "preview"]),
  screen_entity_id: z.string().min(1),
  source: z.object({
    kind: z.enum(["self_help_book_event", "symbiote_event", "kifuda_relic_pickup"]),
    definition_id: z.string().min(1),
    binding_evidence: z.string().min(1)
  }).passthrough(),
  prompt: z.string().nullable().optional(),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().nonnegative(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  cancelable: z.boolean(),
  enchantment: visibleEnchantmentSchema,
  cards: z.array(visibleCardSchema),
  selectable_card_entity_ids: z.array(z.string().min(1)),
  deselectable_card_entity_ids: z.array(z.string().min(1)),
  can_preview: z.boolean(),
  can_close_selection: z.boolean(),
  can_confirm: z.boolean(),
  can_cancel_preview: z.boolean()
}).passthrough().superRefine((surface, context) => {
  const cardIds = surface.cards.map((card) => card.entity_id);
  const cardSet = new Set(cardIds);
  const selected = new Set(surface.selected_card_entity_ids);
  const selectable = new Set(surface.selectable_card_entity_ids);
  const deselectable = new Set(surface.deselectable_card_entity_ids);
  const issue = (message: string): void => context.addIssue({
    code: z.ZodIssueCode.custom,
    message
  });
  if (cardSet.size !== cardIds.length) issue("deck-enchant card identities must be unique");
  if (selected.size !== surface.selected_card_entity_ids.length) {
    issue("deck-enchant selected identities must be unique");
  }
  if (surface.selected_count !== selected.size) issue("deck-enchant selected count drifted");
  if (surface.min_select > surface.max_select || selected.size > surface.max_select) {
    issue("deck-enchant selection bounds are invalid");
  }
  if ([...selected, ...selectable, ...deselectable].some((id) => !cardSet.has(id))) {
    issue("deck-enchant membership references a card outside the current grid");
  }
  if ([...selectable].some((id) => selected.has(id) || deselectable.has(id))) {
    issue("deck-enchant selectable and selected membership overlap");
  }
  if ([...deselectable].some((id) => !selected.has(id))) {
    issue("deck-enchant deselectable membership is not currently selected");
  }
  if (surface.stage === "preview"
      && (selectable.size > 0 || deselectable.size > 0
        || surface.can_preview || surface.can_close_selection)) {
    issue("deck-enchant preview stage exposes selecting controls");
  }
  if (surface.stage === "selecting" && (surface.can_confirm || surface.can_cancel_preview)) {
    issue("deck-enchant selecting stage exposes preview controls");
  }
});

export type GatewayDeckEnchantSurface = z.infer<typeof gatewayDeckEnchantSurfaceSchema>;
