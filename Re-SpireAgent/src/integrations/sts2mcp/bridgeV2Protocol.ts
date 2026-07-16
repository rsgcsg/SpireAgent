import { z } from "zod";
import { isJsonObject, type JsonObject } from "../../shared/json.js";

export const SUPPORTED_BRIDGE_V2_PROTOCOL = "2.0-preview.1" as const;

const compatibilitySchema = z.object({
  status: z.string().min(1),
  action_execution_allowed: z.boolean(),
  detail: z.string()
}).passthrough();

const gameSchema = z.object({
  version: z.string().nullable().optional(),
  commit: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  main_assembly_hash: z.number().int().nullable().optional(),
  compatibility: compatibilitySchema
}).passthrough();

const bridgeIdentitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  upstream_commit: z.string().min(1)
}).passthrough();

const visibleEnchantmentSchema = z.object({
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amount: z.number().int(),
  observation_source: z.string().optional()
}).passthrough();

const visibleCardSchema = z.object({
  entity_id: z.string().min(1),
  definition_id: z.string().min(1),
  name: z.string().nullable().optional(),
  type: z.string(),
  cost: z.string(),
  star_cost: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  rarity: z.string(),
  is_upgraded: z.boolean(),
  is_selected: z.boolean(),
  existing_enchantment: visibleEnchantmentSchema.nullable().optional()
}).passthrough();

const deckEnchantSurfaceSchema = z.object({
  kind: z.literal("deck_enchant_selection"),
  stage: z.enum(["selecting", "preview"]),
  screen_entity_id: z.string().min(1),
  prompt: z.string().nullable().optional(),
  min_select: z.number().int().nonnegative(),
  max_select: z.number().int().nonnegative(),
  selected_count: z.number().int().nonnegative(),
  selected_card_entity_ids: z.array(z.string().min(1)),
  cancelable: z.boolean(),
  enchantment: visibleEnchantmentSchema,
  cards: z.array(visibleCardSchema)
}).passthrough();

const unsupportedSurfaceSchema = z.object({
  kind: z.literal("unsupported"),
  source_type: z.string(),
  reason: z.string()
}).passthrough();

const surfaceBaseSchema = z.object({ kind: z.string().min(1) }).passthrough();

const legalActionSchema = z.object({
  action_id: z.string().min(1),
  state_id: z.string().min(1),
  kind: z.string().min(1),
  category: z.string().optional(),
  label: z.string().min(1),
  authority: z.string().min(1),
  evidence_code: z.string().min(1)
}).passthrough();

const completenessSchema = z.object({
  player_visible_semantics: z.string(),
  legal_actions: z.string(),
  sources: z.array(z.string()),
  missing: z.array(z.string())
}).passthrough();

const stateBaseSchema = z.object({
  protocol_version: z.literal(SUPPORTED_BRIDGE_V2_PROTOCOL),
  state_id: z.string().min(1),
  state_sequence: z.number().int().nonnegative(),
  observed_at: z.string(),
  readiness: z.string().min(1),
  surface_kind: z.string().min(1),
  surface: surfaceBaseSchema,
  legal_actions: z.array(legalActionSchema),
  completeness: completenessSchema,
  bridge: bridgeIdentitySchema,
  game: gameSchema,
  observation_policy: z.object({
    id: z.string().min(1),
    scope: z.string(),
    includes_hidden_information: z.boolean(),
    unknown_field_behavior: z.string()
  }).passthrough(),
  warnings: z.array(z.string())
}).passthrough();

const capabilitiesSchema = z.object({
  protocol_version: z.literal(SUPPORTED_BRIDGE_V2_PROTOCOL),
  bridge: bridgeIdentitySchema,
  game: gameSchema,
  observation_policy: z.object({
    id: z.string().min(1),
    includes_hidden_information: z.boolean()
  }).passthrough(),
  surfaces: z.array(z.object({
    kind: z.string().min(1),
    support: z.string(),
    operations: z.array(z.string()),
    evidence: z.string()
  }).passthrough()),
  commands: z.object({
    opaque_actions_only: z.boolean(),
    state_bound: z.boolean(),
    idempotent_request_ids: z.boolean(),
    lifecycle_states: z.array(z.string()),
    outcome_timeout_ms: z.number().int().positive()
  }).passthrough(),
  warnings: z.array(z.string())
}).passthrough();

const commandEventSchema = z.object({
  status: z.string(),
  at: z.string(),
  evidence: z.string().nullable().optional(),
  error_code: z.string().nullable().optional(),
  detail: z.string().nullable().optional()
}).passthrough();

const commandSchema = z.object({
  request_id: z.string().min(1),
  expected_state_id: z.string().min(1),
  action_id: z.string().min(1),
  status: z.enum(["received", "validated", "started", "completed", "rejected", "failed", "timed_out"]),
  outcome: z.enum(["pending", "confirmed", "not_applied", "unknown"]),
  observed_state_id: z.string().nullable().optional(),
  events: z.array(commandEventSchema)
}).passthrough();

export type BridgeV2Capabilities = z.infer<typeof capabilitiesSchema>;
export type BridgeV2LegalAction = z.infer<typeof legalActionSchema>;
export type BridgeV2DeckEnchantSurface = z.infer<typeof deckEnchantSurfaceSchema>;
export type BridgeV2UnsupportedSurface = z.infer<typeof unsupportedSurfaceSchema>;
export type BridgeV2Command = z.infer<typeof commandSchema>;

export type BridgeV2Surface =
  | BridgeV2DeckEnchantSurface
  | BridgeV2UnsupportedSurface
  | (Record<string, unknown> & { kind: string });

export type BridgeV2State = z.infer<typeof stateBaseSchema> & {
  surface: BridgeV2Surface;
};

export interface DecodedBridgePayload<T> {
  data: T;
  raw: JsonObject;
}

export class BridgeV2DecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BridgeV2DecodeError";
  }
}

export function decodeBridgeV2Capabilities(value: unknown): DecodedBridgePayload<BridgeV2Capabilities> {
  return decode(value, capabilitiesSchema, "Bridge v2 capabilities");
}

export function decodeBridgeV2State(value: unknown): DecodedBridgePayload<BridgeV2State> {
  const decoded = decode(value, stateBaseSchema, "Bridge v2 state");
  if (decoded.data.surface_kind !== decoded.data.surface.kind) {
    throw new BridgeV2DecodeError(
      `Bridge v2 state surface_kind ${decoded.data.surface_kind} does not match surface.kind ${decoded.data.surface.kind}`
    );
  }

  let surface: BridgeV2Surface;
  if (decoded.data.surface.kind === "deck_enchant_selection") {
    surface = parse(deckEnchantSurfaceSchema, decoded.data.surface, "deck_enchant_selection surface");
  } else if (decoded.data.surface.kind === "unsupported") {
    surface = parse(unsupportedSurfaceSchema, decoded.data.surface, "unsupported surface");
  } else {
    surface = decoded.data.surface;
  }

  return { raw: decoded.raw, data: { ...decoded.data, surface } };
}

export function decodeBridgeV2Command(value: unknown): DecodedBridgePayload<BridgeV2Command> {
  return decode(value, commandSchema, "Bridge v2 command");
}

export function isBridgeV2DeckEnchantSurface(
  surface: BridgeV2Surface
): surface is BridgeV2DeckEnchantSurface {
  return surface.kind === "deck_enchant_selection";
}

export function isBridgeV2UnsupportedSurface(
  surface: BridgeV2Surface
): surface is BridgeV2UnsupportedSurface {
  return surface.kind === "unsupported"
    && typeof surface.source_type === "string"
    && typeof surface.reason === "string";
}

function decode<T>(value: unknown, schema: z.ZodType<T>, label: string): DecodedBridgePayload<T> {
  if (!isJsonObject(value)) throw new BridgeV2DecodeError(`${label} must be a JSON object`);
  return { raw: value, data: parse(schema, value, label) };
}

function parse<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const first = result.error.issues[0];
  const path = first?.path.length ? first.path.join(".") : "$";
  throw new BridgeV2DecodeError(`${label} is incompatible at ${path}: ${first?.message ?? "invalid value"}`);
}
