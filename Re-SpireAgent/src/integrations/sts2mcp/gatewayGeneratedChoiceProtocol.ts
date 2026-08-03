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
  skip_operation: z.string().min(1).nullable().optional(),
  purpose: z.string().min(1),
  source_kind: z.string().min(1),
  destination: z.string().min(1),
  selected_card_cost_policy: z.string().min(1),
  overflow_destination: z.string().min(1).nullable().optional()
}).passthrough();

export const gatewayGeneratedChoiceSurfaceSchema = generatedChoiceBase.superRefine(
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
