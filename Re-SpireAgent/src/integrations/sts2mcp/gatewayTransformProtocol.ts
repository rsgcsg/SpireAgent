import { z } from "zod";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

const exactCardMembership = (surface: {
  cards: Array<{ entity_id: string }>;
  selected_card_entity_ids: string[];
  selectable_card_entity_ids: string[];
  deselectable_card_entity_ids?: string[];
}, context: z.RefinementCtx, family: string): void => {
  const cardIds = surface.cards.map((card) => card.entity_id);
  const known = new Set(cardIds);
  const selected = new Set(surface.selected_card_entity_ids);
  const selectable = new Set(surface.selectable_card_entity_ids);
  const deselectable = new Set(surface.deselectable_card_entity_ids ?? []);
  const issue = (message: string): void => context.addIssue({
    code: z.ZodIssueCode.custom,
    message: `${family} ${message}`
  });
  if (known.size !== cardIds.length) issue("card ids must be unique");
  if (selected.size !== surface.selected_card_entity_ids.length) issue("selected card ids must be unique");
  if (selectable.size !== surface.selectable_card_entity_ids.length
      || deselectable.size !== (surface.deselectable_card_entity_ids?.length ?? 0)) {
    issue("actionable card ids must be unique");
  }
  for (const id of [...selected, ...selectable, ...deselectable]) {
    if (!known.has(id)) issue(`membership references unknown card ${id}`);
  }
  for (const id of selectable) {
    if (selected.has(id)) issue("selectable cards must not already be selected");
  }
  for (const id of deselectable) {
    if (!selected.has(id)) issue("deselectable cards must be selected");
  }
};

export const gatewayDeckTransformSurfaceSchema = z.object({
  kind: z.literal("deck_transform_selection"),
  stage: z.enum(["selecting", "preview"]),
  screen_entity_id: z.string().min(1),
  source: z.object({
    kind: z.enum(["whispering_hollow_event", "new_leaf_relic_pickup"]),
    definition_id: z.string().min(1),
    binding_evidence: z.string().min(1)
  }).strict(),
  prompt: z.string().min(1),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().positive(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  cancelable: z.boolean(),
  upgrade_toggle_visible: z.boolean(),
  showing_upgrade_previews: z.boolean(),
  preview_kind: z.enum(["none", "random_uncommitted_cycle"]),
  replacement_known: z.literal(false),
  cards: z.array(visibleCardSchema).min(1),
  selectable_card_entity_ids: z.array(z.string().min(1)),
  deselectable_card_entity_ids: z.array(z.string().min(1)),
  can_preview: z.boolean(),
  can_cancel_selection: z.boolean(),
  can_cancel_preview: z.boolean(),
  can_confirm: z.boolean(),
  can_toggle_upgrade_view: z.boolean()
}).passthrough().superRefine((surface, context) => {
  exactCardMembership(surface, context, "deck-transform");
  const selected = new Set(surface.selected_card_entity_ids);
  const issue = (message: string): void => context.addIssue({
    code: z.ZodIssueCode.custom,
    message
  });
  if (surface.min_select > surface.max_select
      || surface.selected_count !== selected.size
      || selected.size > surface.max_select) {
    issue("deck-transform selected membership must satisfy exact bounds");
  }
  if (surface.can_cancel_selection && !surface.cancelable) {
    issue("deck-transform selection cancel requires a cancelable native selector");
  }
  if (surface.can_toggle_upgrade_view && !surface.upgrade_toggle_visible) {
    issue("deck-transform upgrade control must be visible before publication");
  }
  if (surface.stage === "selecting") {
    if (surface.preview_kind !== "none"
        || surface.can_cancel_preview
        || surface.can_confirm) {
      issue("deck-transform selecting stage cannot expose preview state or controls");
    }
  } else {
    if (surface.preview_kind !== "random_uncommitted_cycle"
        || surface.selectable_card_entity_ids.length > 0
        || surface.deselectable_card_entity_ids.length > 0
        || surface.can_preview
        || surface.can_cancel_selection
        || surface.can_toggle_upgrade_view) {
      issue("deck-transform preview stage cannot expose selecting-stage actions");
    }
    if (selected.size === 0 || selected.size < surface.min_select) {
      issue("deck-transform preview requires an exact non-empty selected set");
    }
  }
});

export const gatewayWoodCarvingsSurfaceSchema = z.object({
  kind: z.literal("wood_carvings_replacement_selection"),
  stage: z.enum(["selecting", "preview"]),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1),
  branch: z.enum(["bird", "torus"]),
  replacement_definition_id: z.string().min(1),
  replacement_name: z.string().nullable().optional(),
  replacement_description: z.string().nullable().optional(),
  min_select: z.literal(1),
  max_select: z.literal(1),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  cards: z.array(visibleCardSchema).min(1),
  selectable_card_entity_ids: z.array(z.string().min(1)),
  can_cancel_preview: z.boolean(),
  can_confirm: z.boolean()
}).passthrough().superRefine((surface, context) => {
  exactCardMembership(surface, context, "wood-carvings");
  const selected = new Set(surface.selected_card_entity_ids);
  const issue = (message: string): void => context.addIssue({
    code: z.ZodIssueCode.custom,
    message
  });
  if (surface.selected_count !== selected.size || selected.size > 1) {
    issue("Wood Carvings selected membership must match the exactly-one contract");
  }
  if (surface.stage === "selecting") {
    if (selected.size !== 0 || surface.can_cancel_preview || surface.can_confirm) {
      issue("Wood Carvings selecting stage cannot expose preview state or controls");
    }
  } else if (selected.size !== 1
      || surface.selectable_card_entity_ids.length > 0) {
    issue("Wood Carvings preview must bind exactly one selected card");
  }
});

export type GatewayDeckTransformSurface = z.infer<typeof gatewayDeckTransformSurfaceSchema>;
export type GatewayWoodCarvingsSurface = z.infer<typeof gatewayWoodCarvingsSurfaceSchema>;
