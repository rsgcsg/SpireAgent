import { z } from "zod";
import { isJsonObject, type JsonObject } from "../../shared/json.js";
import {
  shopCardOfferSchema,
  shopCardRemovalOfferSchema,
  shopPotionOfferSchema,
  shopRelicOfferSchema
} from "./gatewayRunRoomProtocol.js";
import { visibleCardSchema } from "./gatewayVisibleStateProtocol.js";

export const SUPPORTED_CONNECTOR_V3_PROTOCOL = "3.0-preview.9" as const;

const bridgeIdentitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  upstream_commit: z.string().min(1),
  module_version_id: z.string().min(1),
  assembly_file_sha256: z.string().regex(/^[a-f0-9]{64}$/iu),
  runtime_instance_id: z.string().min(1)
}).passthrough();

const compatibilitySchema = z.object({
  status: z.string().min(1),
  action_execution_allowed: z.boolean(),
  state_observation_allowed: z.boolean(),
  inspection_allowed: z.boolean(),
  action_permission_scopes: z.array(z.object({
    surface_kind: z.string().min(1),
    operation: z.string().min(1),
    tier: z.enum(["qualified", "canary"])
  }).passthrough())
}).passthrough();

const gameIdentitySchema = z.object({
  version: z.string().nullable().optional(),
  commit: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  main_assembly_hash: z.number().int().nullable().optional(),
  compatibility: compatibilitySchema,
  modset: z.object({
    status: z.string().min(1),
    fingerprint: z.string().min(1)
  }).passthrough()
}).passthrough();

const operandDomainSchema = z.object({
  kind: z.literal("entity_ids"),
  entity_ids: z.array(z.string().min(1))
}).strict();

const entityBindingSchema = z.object({
  role: z.string().min(1),
  entity_id: z.string().min(1)
}).passthrough();

const commandCandidateSchema = z.object({
  candidate_id: z.string().min(1),
  command: z.enum([
    "play_card",
    "use_potion",
    "end_turn",
    "choose",
    "purchase",
    "navigate",
    "select_entity",
    "deselect_entity",
    "confirm_interaction",
    "cancel_interaction",
    "activate_control"
  ]),
  operation: z.string().min(1),
  label: z.string().min(1),
  operands: z.record(z.string().min(1)),
  operand_domains: z.record(operandDomainSchema),
  entity_bindings: z.array(entityBindingSchema),
  binding_kind: z.literal("native_direct_resolver"),
  authority_state: z.enum(["supported", "trial"])
}).strict();

const interactionSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  phase: z.string().min(1),
  execution_support: z.enum(["supported", "trial", "unsupported"]),
  support_reason: z.string().nullable().optional(),
  affordances: z.array(z.string().min(1)),
  command_candidates: z.array(commandCandidateSchema)
}).strict();

const diagnosticSchema = z.object({
  code: z.string().min(1),
  severity: z.string().min(1),
  category: z.string().min(1),
  effect: z.string().min(1),
  recoverability: z.string().min(1)
}).passthrough();

const observationPolicySchema = z.object({
  id: z.string().min(1),
  scope: z.string(),
  includes_hidden_information: z.literal(false),
  unknown_field_behavior: z.string().min(1)
}).passthrough();

const inspectionKindSchema = z.enum(["run_deck", "combat_piles", "shop_catalog"]);

const inspectionCatalogEntrySchema = z.object({
  kind: inspectionKindSchema,
  scope: z.enum(["active_run", "current_combat", "current_shop"]),
  availability: z.enum(["qualified", "canary"]),
  visibility_basis: z.string().min(1),
  state_bound: z.literal(true),
  creates_action_authority: z.literal(false),
  ordering_semantics: z.enum(["unordered_multiset", "fixed_ui_slots"]),
  estimated_cost: z.enum(["low", "medium", "high"]),
  recommended_for: z.array(z.string().min(1)),
  hidden_by_policy: z.array(z.string().min(1))
}).passthrough();

const linkedDetailKindSchema = z.literal("surface_card");

const linkedDetailCatalogEntrySchema = z.object({
  kind: linkedDetailKindSchema,
  entity_id: z.string().min(1),
  visibility_basis: z.literal("normal_player_visible_surface_card"),
  state_bound: z.literal(true),
  creates_action_authority: z.literal(false)
}).strict();

const capabilitiesSchema = z.object({
  protocol_version: z.literal(SUPPORTED_CONNECTOR_V3_PROTOCOL),
  observation_schema: z.literal("sts2.connector.v3/observation-1"),
  command_schema: z.literal("sts2.connector.v3/command-1"),
  inspection_schema: z.literal("sts2.connector.v3/inspection-1"),
  linked_detail_schema: z.literal("sts2.connector.v3/linked-detail-1"),
  status: z.string().min(1),
  bridge: bridgeIdentitySchema,
  game: gameIdentitySchema,
  commands: z.array(z.string().min(1)),
  control: z.object({
    recommended_renewal_ms: z.number().int().positive()
  }).passthrough(),
  non_claims: z.array(z.string())
}).strict();

const observationSchema = z.object({
  protocol_version: z.literal(SUPPORTED_CONNECTOR_V3_PROTOCOL),
  schema: z.literal("sts2.connector.v3/observation-1"),
  profile: z.string().min(1),
  state_token: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  observed_at: z.string().min(1),
  status: z.enum(["actionable_complete", "actionable_partial", "observed"]),
  shared_state: z.record(z.unknown()).nullable(),
  context: z.object({ kind: z.string().min(1) }).passthrough(),
  surface: z.object({ kind: z.string().min(1) }).passthrough(),
  interaction: interactionSchema,
  completeness: z.object({
    player_visible_semantics: z.string(),
    legal_actions: z.string(),
    sources: z.array(z.string()),
    missing: z.array(z.string())
  }).passthrough(),
  bridge: bridgeIdentitySchema,
  game: gameIdentitySchema,
  observation_policy: observationPolicySchema,
  visibility: z.object({
    profile_id: z.string().min(1),
    core_status: z.enum(["complete", "partial"]),
    player_visible_closure_status: z.enum(["complete", "partial_catalog", "partial"]),
    available_inspections: z.array(inspectionKindSchema),
    linked_detail_kinds: z.array(linkedDetailKindSchema),
    hidden_by_policy: z.array(z.string()),
    missing: z.array(z.string()),
    unknown_critical_field_behavior: z.literal("fail_closed")
  }).passthrough(),
  inspection_catalog: z.array(inspectionCatalogEntrySchema),
  linked_detail_catalog: z.array(linkedDetailCatalogEntrySchema),
  diagnostics: z.array(diagnosticSchema),
  warnings: z.array(z.string()),
  coverage: z.object({
    visible_information: z.string().min(1),
    interaction_discovery: z.string().min(1),
    execution_support: z.enum(["supported", "trial", "unsupported"]),
    unmapped_visible_controls: z.array(z.string()),
    hidden_by_policy: z.array(z.string())
  }).strict()
}).strict();

const inspectionCompletenessSchema = z.object({
  player_visible_semantics: z.string().min(1),
  sources: z.array(z.string()),
  missing: z.array(z.string())
}).passthrough();

const inspectionContentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("run_deck"),
    card_count: z.number().int().nonnegative(),
    cards: z.array(visibleCardSchema)
  }).passthrough(),
  z.object({
    kind: z.literal("combat_piles"),
    zones: z.array(z.object({
      zone: z.enum(["draw", "discard", "exhaust"]),
      card_count: z.number().int().nonnegative(),
      ordering_semantics: z.literal("unordered_multiset"),
      cards: z.array(visibleCardSchema)
    }).passthrough()).length(3)
  }).passthrough(),
  z.object({
    kind: z.literal("shop_catalog"),
    access_state: z.enum(["inventory_open", "inventory_closed_open_to_inspect"]),
    cards: z.array(shopCardOfferSchema),
    relics: z.array(shopRelicOfferSchema),
    potions: z.array(shopPotionOfferSchema),
    card_removal: shopCardRemovalOfferSchema.nullable().optional()
  }).passthrough()
]);

const inspectionSchema = z.object({
  protocol_version: z.literal(SUPPORTED_CONNECTOR_V3_PROTOCOL),
  schema: z.literal("sts2.connector.v3/inspection-1"),
  inspection_id: z.string().min(1),
  expected_state_token: z.string().min(1),
  observed_state_token: z.string().min(1),
  observed_at: z.string().min(1),
  kind: inspectionKindSchema,
  visibility_class: z.literal("normal_inspection"),
  ordering_semantics: z.enum(["unordered_multiset", "fixed_ui_slots"]),
  content: inspectionContentSchema,
  completeness: inspectionCompletenessSchema,
  bridge: bridgeIdentitySchema,
  game: gameIdentitySchema,
  observation_policy: observationPolicySchema,
  diagnostics: z.array(diagnosticSchema)
}).strict();

const linkedDetailSchema = z.object({
  protocol_version: z.literal(SUPPORTED_CONNECTOR_V3_PROTOCOL),
  schema: z.literal("sts2.connector.v3/linked-detail-1"),
  detail_id: z.string().min(1),
  expected_state_token: z.string().min(1),
  observed_state_token: z.string().min(1),
  observed_at: z.string().min(1),
  kind: linkedDetailKindSchema,
  entity_id: z.string().min(1),
  content: visibleCardSchema,
  bridge: bridgeIdentitySchema,
  game: gameIdentitySchema,
  observation_policy: observationPolicySchema,
  diagnostics: z.array(diagnosticSchema)
}).strict();

const receiptSchema = z.object({
  protocol_version: z.literal(SUPPORTED_CONNECTOR_V3_PROTOCOL),
  request_id: z.string().min(1),
  status: z.enum(["completed", "not_executed", "pending", "unknown"]),
  application: z.enum(["confirmed", "not_applied", "started", "unknown"]),
  command: z.object({
    kind: z.string().min(1),
    operands: z.record(z.string())
  }).strict(),
  reason_code: z.string().nullable().optional(),
  detail: z.string().nullable().optional(),
  completion: z.object({
    boundary: z.string().min(1),
    summary: z.string().min(1)
  }).strict().nullable().optional(),
  retry: z.object({
    allowed: z.boolean(),
    reason: z.string().min(1)
  }).strict(),
  successor: z.object({
    status: z.enum(["pending", "available"]),
    state_token: z.string().nullable().optional()
  }).strict(),
  events: z.array(z.object({
    status: z.string().min(1),
    at: z.string().min(1),
    evidence: z.string().nullable().optional(),
    error_code: z.string().nullable().optional(),
    detail: z.string().nullable().optional()
  }).passthrough()),
  attribution: z.object({
    client_session_id: z.string().min(1),
    client_instance_id: z.string().min(1),
    product_id: z.string().min(1),
    product_name: z.string().min(1),
    product_version: z.string().min(1),
    controller_lease_id: z.string().min(1),
    controller_generation: z.number().int().positive(),
    runtime_instance_id: z.string().min(1)
  }).passthrough().nullable().optional()
}).strict();

export type ConnectorV3Capabilities = z.infer<typeof capabilitiesSchema>;
export type ConnectorV3Observation = z.infer<typeof observationSchema>;
export type ConnectorV3Inspection = z.infer<typeof inspectionSchema>;
export type ConnectorV3LinkedDetail = z.infer<typeof linkedDetailSchema>;
export type ConnectorV3CommandCandidate = z.infer<typeof commandCandidateSchema>;
export type ConnectorV3Receipt = z.infer<typeof receiptSchema>;

export interface DecodedConnectorV3Payload<T> {
  raw: JsonObject;
  data: T;
}

export class ConnectorV3DecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectorV3DecodeError";
  }
}

export function decodeConnectorV3Capabilities(
  value: unknown
): DecodedConnectorV3Payload<ConnectorV3Capabilities> {
  return decode(value, capabilitiesSchema, "Connector v3 capabilities");
}

export function decodeConnectorV3Observation(
  value: unknown
): DecodedConnectorV3Payload<ConnectorV3Observation> {
  const decoded = decode(value, observationSchema, "Connector v3 observation");
  const candidateIds = decoded.data.interaction.command_candidates.map(
    (candidate) => candidate.candidate_id
  );
  if (new Set(candidateIds).size !== candidateIds.length) {
    throw new ConnectorV3DecodeError("Connector v3 observation has duplicate candidate ids");
  }
  if (decoded.data.interaction.kind !== decoded.data.surface.kind) {
    throw new ConnectorV3DecodeError(
      "Connector v3 interaction kind does not match the visible surface"
    );
  }
  if (decoded.data.interaction.execution_support === "unsupported"
      && decoded.data.interaction.command_candidates.length > 0) {
    throw new ConnectorV3DecodeError(
      "Connector v3 unsupported interaction must not publish command candidates"
    );
  }
  const linkedEntityIds = decoded.data.linked_detail_catalog.map(
    (entry) => entry.entity_id
  );
  if (new Set(linkedEntityIds).size !== linkedEntityIds.length) {
    throw new ConnectorV3DecodeError(
      "Connector v3 observation has duplicate linked-detail entity ids"
    );
  }
  return decoded;
}

export function decodeConnectorV3Inspection(
  value: unknown
): DecodedConnectorV3Payload<ConnectorV3Inspection> {
  const decoded = decode(value, inspectionSchema, "Connector v3 inspection");
  if (decoded.data.expected_state_token !== decoded.data.observed_state_token) {
    throw new ConnectorV3DecodeError(
      "Connector v3 inspection expected and observed state tokens must match"
    );
  }
  if (decoded.data.kind !== decoded.data.content.kind) {
    throw new ConnectorV3DecodeError(
      "Connector v3 inspection kind does not match its typed content"
    );
  }
  return decoded;
}

export function decodeConnectorV3LinkedDetail(
  value: unknown
): DecodedConnectorV3Payload<ConnectorV3LinkedDetail> {
  const decoded = decode(value, linkedDetailSchema, "Connector v3 linked detail");
  if (decoded.data.expected_state_token !== decoded.data.observed_state_token) {
    throw new ConnectorV3DecodeError(
      "Connector v3 linked detail expected and observed state tokens must match"
    );
  }
  if (decoded.data.entity_id !== decoded.data.content.entity_id) {
    throw new ConnectorV3DecodeError(
      "Connector v3 linked detail entity does not match its typed card content"
    );
  }
  return decoded;
}

export function decodeConnectorV3Receipt(
  value: unknown
): DecodedConnectorV3Payload<ConnectorV3Receipt> {
  const decoded = decode(value, receiptSchema, "Connector v3 receipt");
  if (decoded.data.status === "unknown" && decoded.data.retry.allowed) {
    throw new ConnectorV3DecodeError("Connector v3 unknown mutation must forbid retry");
  }
  return decoded;
}

function decode<T>(
  value: unknown,
  schema: z.ZodType<T>,
  label: string
): DecodedConnectorV3Payload<T> {
  if (!isJsonObject(value)) {
    throw new ConnectorV3DecodeError(`${label} must be a JSON object`);
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ConnectorV3DecodeError(
      `${label} failed strict decode: ${parsed.error.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.join(".") || "$"} ${issue.message}`)
        .join("; ")}`
    );
  }
  return { raw: value, data: parsed.data };
}
