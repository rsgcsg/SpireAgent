import { z } from "zod";

const visibleDialogueLineSchema = z.object({
  entity_id: z.string().min(1),
  index: z.number().int().nonnegative(),
  text: z.string().min(1),
  speaker: z.enum(["ancient", "character", "unknown"]),
  is_current: z.boolean()
}).passthrough();

export const gatewayEventDialogueSurfaceSchema = z.object({
  kind: z.literal("event_dialogue"),
  screen_entity_id: z.string().min(1),
  current_line_index: z.number().int().nonnegative(),
  revealed_lines: z.array(visibleDialogueLineSchema).min(1),
  advance_label: z.string().min(1),
  can_advance: z.boolean()
}).passthrough().superRefine((surface, context) => {
  const ids = new Set(surface.revealed_lines.map((line) => line.entity_id));
  const indices = new Set(surface.revealed_lines.map((line) => line.index));
  const current = surface.revealed_lines.filter((line) => line.is_current);
  const issue = (message: string): void => context.addIssue({
    code: z.ZodIssueCode.custom,
    message
  });
  if (ids.size !== surface.revealed_lines.length) issue("dialogue line identities must be unique");
  if (indices.size !== surface.revealed_lines.length) issue("dialogue line indices must be unique");
  if (surface.revealed_lines.some((line) => line.index > surface.current_line_index)) {
    issue("event dialogue exposed an unrevealed future line");
  }
  if (current.length !== 1 || current[0]?.index !== surface.current_line_index) {
    issue("event dialogue must bind exactly one current revealed line");
  }
});

export type GatewayEventDialogueSurface = z.infer<typeof gatewayEventDialogueSurfaceSchema>;
