import { z } from "zod";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

const deckRemovalFields = {
  stage: z.enum(["selecting", "preview"]),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().positive(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  selectable_card_entity_ids: z.array(z.string().min(1)),
  deselectable_card_entity_ids: z.array(z.string().min(1)),
  can_cancel_preview: z.boolean(),
  can_confirm: z.boolean(),
  cards: z.array(visibleCardSchema)
} as const;

const merchantRemovalBaseSchema = z.object({
  kind: z.literal("deck_removal_selection"),
  ...deckRemovalFields,
  cancelable: z.boolean(),
  can_preview: z.boolean(),
  can_cancel_selection: z.boolean()
}).passthrough();

const relicRemovalBaseSchema = z.object({
  kind: z.literal("relic_deck_removal_selection"),
  ...deckRemovalFields,
  cancelable: z.boolean(),
  can_preview: z.boolean(),
  can_cancel_selection: z.literal(false)
}).passthrough();

const rewardRemovalBaseSchema = z.object({
  kind: z.literal("reward_deck_removal_selection"),
  ...deckRemovalFields,
  cancelable: z.boolean(),
  can_preview: z.boolean(),
  can_cancel_selection: z.boolean()
}).passthrough();

const eventRemovalBaseSchema = z.object({
  kind: z.literal("event_deck_removal_selection"),
  ...deckRemovalFields,
  min_select: z.literal(2),
  max_select: z.literal(2),
  source_kind: z.literal("luminous_choir_reach_into_flesh"),
  purpose: z.literal("remove_two_cards_then_gain_spore_mind"),
  expected_effects: z.tuple([
    z.literal("remove_selected_cards"),
    z.literal("add_spore_mind"),
    z.literal("finish_event")
  ])
}).passthrough();

type RemovalShape = Pick<
  z.infer<typeof merchantRemovalBaseSchema>,
  keyof typeof deckRemovalFields
>;

type SourceRemovalShape = RemovalShape & {
  cancelable: boolean;
  can_preview: boolean;
  can_cancel_selection: boolean;
};

function validateRemovalSurface(
  surface: RemovalShape,
  context: z.RefinementCtx,
  family: string
): void {
  const cardIds = surface.cards.map((card) => card.entity_id);
  const knownCards = new Set(cardIds);
  const selected = new Set(surface.selected_card_entity_ids);
  const selectable = new Set(surface.selectable_card_entity_ids);
  const deselectable = new Set(surface.deselectable_card_entity_ids);
  const issue = (message: string): void => context.addIssue({
    code: z.ZodIssueCode.custom,
    message
  });

  if (knownCards.size !== cardIds.length) issue(`${family} card ids must be unique`);
  if (selected.size !== surface.selected_card_entity_ids.length
      || selectable.size !== surface.selectable_card_entity_ids.length
      || deselectable.size !== surface.deselectable_card_entity_ids.length) {
    issue(`${family} selection memberships must be unique`);
  }
  if (surface.min_select > surface.max_select
      || surface.selected_count !== selected.size
      || surface.selected_count > surface.max_select) {
    issue(`${family} selection bounds or exact membership are invalid`);
  }
  for (const id of [...selected, ...selectable, ...deselectable]) {
    if (!knownCards.has(id)) issue(`${family} membership references unknown card ${id}`);
  }
  for (const id of deselectable) {
    if (!selected.has(id)) issue(`${family} deselectable cards must be selected`);
  }
  for (const id of selectable) {
    if (selected.has(id)) issue(`${family} selectable cards must not be selected`);
  }
  if (surface.stage === "selecting") {
    if (surface.can_cancel_preview || surface.can_confirm) {
      issue(`${family} selecting stage cannot publish preview controls`);
    }
  } else {
    if (selectable.size > 0 || deselectable.size > 0) {
      issue(`${family} preview stage cannot publish selecting memberships`);
    }
    if (selected.size === 0 || selected.size < surface.min_select) {
      issue(`${family} preview requires exact selected membership`);
    }
  }
}

function validateSourceRemovalControls(
  surface: SourceRemovalShape,
  context: z.RefinementCtx,
  family: string
): void {
  if (surface.stage === "selecting") {
    if (surface.can_preview && surface.selected_count < surface.min_select) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${family} preview requires the native minimum selection`
      });
    }
    if (surface.can_cancel_selection && !surface.cancelable) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${family} selection cancel requires a cancelable selector`
      });
    }
  } else if (surface.can_preview || surface.can_cancel_selection) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${family} preview stage cannot publish selecting controls`
    });
  }
}

export const gatewayMerchantRemovalSurfaceSchema = merchantRemovalBaseSchema
  .superRefine((surface, context) => {
    validateRemovalSurface(surface, context, "merchant-removal");
    validateSourceRemovalControls(surface, context, "merchant-removal");
  });

export const gatewayRelicRemovalSurfaceSchema = relicRemovalBaseSchema
  .superRefine((surface, context) => {
    validateRemovalSurface(surface, context, "precise-scissors-removal");
    validateSourceRemovalControls(surface, context, "precise-scissors-removal");
  });

export const gatewayRewardRemovalSurfaceSchema = rewardRemovalBaseSchema
  .superRefine((surface, context) => {
    validateRemovalSurface(surface, context, "reward-removal");
    validateSourceRemovalControls(surface, context, "reward-removal");
  });

export const gatewayEventDeckRemovalSurfaceSchema = eventRemovalBaseSchema
  .superRefine((surface, context) => {
    validateRemovalSurface(surface, context, "event-removal");
    if (surface.selected_count > 2) context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "event-removal selected count exceeds the exact two-card contract"
    });
  });

export type GatewayMerchantRemovalSurface = z.infer<
  typeof gatewayMerchantRemovalSurfaceSchema
>;
export type GatewayRelicRemovalSurface = z.infer<
  typeof gatewayRelicRemovalSurfaceSchema
>;
export type GatewayRewardRemovalSurface = z.infer<
  typeof gatewayRewardRemovalSurfaceSchema
>;
export type GatewayDeckRemovalSurface = GatewayMerchantRemovalSurface
  | GatewayRelicRemovalSurface
  | GatewayRewardRemovalSurface;
export type GatewayEventDeckRemovalSurface = z.infer<
  typeof gatewayEventDeckRemovalSurfaceSchema
>;
