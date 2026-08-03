import { z } from "zod";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

const visibleBundleSchema = z.object({
  entity_id: z.string().min(1),
  cards: z.array(visibleCardSchema).min(1)
}).passthrough();

export const gatewayCardBundleSurfaceSchema = z.object({
  kind: z.literal("card_bundle_selection"),
  stage: z.enum(["choosing", "preview"]),
  screen_entity_id: z.string().min(1),
  prompt: z.string().min(1).nullable().optional(),
  selected_bundle_entity_id: z.string().min(1).nullable().optional(),
  selectable_bundle_entity_ids: z.array(z.string().min(1)),
  can_confirm: z.boolean(),
  can_cancel_preview: z.boolean(),
  bundles: z.array(visibleBundleSchema).min(1)
}).passthrough().superRefine((surface, context) => {
  const bundleIds = surface.bundles.map((bundle) => bundle.entity_id);
  const selectable = new Set(surface.selectable_bundle_entity_ids);
  const issue = (message: string): void => context.addIssue({
    code: z.ZodIssueCode.custom,
    message
  });
  if (new Set(bundleIds).size !== bundleIds.length) issue("bundle ids must be unique");
  if (selectable.size !== surface.selectable_bundle_entity_ids.length) {
    issue("selectable bundle ids must be unique");
  }
  for (const id of selectable) {
    if (!bundleIds.includes(id)) issue(`selectable bundle ${id} is not visible`);
  }
  if (surface.stage === "choosing") {
    if (surface.selected_bundle_entity_id != null
        || surface.can_confirm
        || surface.can_cancel_preview) {
      issue("choosing stage cannot expose preview state or controls");
    }
  } else {
    if (!surface.selected_bundle_entity_id
        || !bundleIds.includes(surface.selected_bundle_entity_id)) {
      issue("preview stage must bind one exact visible bundle");
    }
    if (selectable.size > 0) issue("preview stage cannot expose selectable bundles");
  }
});

export type GatewayCardBundleSurface = z.infer<typeof gatewayCardBundleSurfaceSchema>;
