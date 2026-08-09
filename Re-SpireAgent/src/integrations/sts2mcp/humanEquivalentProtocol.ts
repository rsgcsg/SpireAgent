import { z } from "zod";
import { isJsonObject, type JsonObject } from "../../shared/json.js";
import { sharedVisibleStateSchema } from "./gatewayVisibleStateProtocol.js";

export const SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL = "1.0-preview.2" as const;

const identitySchema = z.object({
  id: z.literal("sts2_human_equivalent_connector"),
  name: z.string().min(1),
  version: z.string().min(1),
  upstream_commit: z.string().min(1),
  module_version_id: z.string().min(1),
  assembly_file_sha256: z.string().regex(/^[a-f0-9]{64}$/iu),
  runtime_instance_id: z.string().min(1)
}).passthrough();

const gameSchema = z.object({
  version: z.string().nullable().optional(),
  commit: z.string().nullable().optional(),
  main_assembly_hash: z.number().int().nullable().optional(),
  compatibility: z.object({
    state_observation_allowed: z.boolean()
  }).passthrough(),
  modset: z.object({
    status: z.string().min(1),
    fingerprint: z.string().min(1)
  }).passthrough()
}).passthrough();

const controlSchema = z.object({
  recommended_renewal_ms: z.number().int().positive()
}).passthrough();

const controlClientSchema = z.object({
  client_session_id: z.string().min(1),
  client_instance_id: z.string().min(1)
}).passthrough();

const controlLeaseSchema = z.object({
  controller_lease_id: z.string().min(1),
  controller_generation: z.number().int().positive(),
  client_session_id: z.string().min(1),
  expires_at: z.string().min(1)
}).passthrough();

const clientRegistrationSchema = z.object({
  protocol_version: z.literal(SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL),
  schema: z.literal("sts2.connector.human-ui/control-1"),
  runtime_instance_id: z.string().min(1),
  client: controlClientSchema,
  controller: controlLeaseSchema.nullable().optional()
}).strict();

const controllerLeaseResponseSchema = z.object({
  protocol_version: z.literal(SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL),
  schema: z.literal("sts2.connector.human-ui/control-1"),
  runtime_instance_id: z.string().min(1),
  status: z.string().min(1),
  detail: z.string(),
  client: controlClientSchema.nullable().optional(),
  controller: controlLeaseSchema.nullable().optional()
}).strict();

const affordanceSchema: z.ZodTypeAny = z.object({
  affordance_id: z.string().min(1),
  action: z.enum([
    "activate", "select", "deselect", "confirm", "cancel", "play",
    "target", "use", "end_turn", "skip", "open", "close"
  ]),
  target_id: z.string().min(1),
  owner_id: z.string().min(1),
  label: z.string().min(1),
  provenance: z.literal("native_ui_adapter")
}).strict();

const observationSchema: z.ZodTypeAny = z.object({
  protocol_version: z.literal(SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL),
  schema: z.literal("sts2.connector.human-ui/observation-2"),
  state_token: z.string().min(1),
  sequence: z.number().int().positive(),
  observed_at: z.string().min(1),
  status: z.enum(["actionable", "visible_unsupported", "settling", "observed"]),
  owner: z.object({ owner_id: z.string().min(1), kind: z.string().min(1) }).strict(),
  persistent_state: sharedVisibleStateSchema.nullable(),
  surface: z.object({
    kind: z.string().min(1),
    stage: z.string().min(1),
    prompt: z.string().nullable().optional(),
    facts: z.record(z.unknown())
  }).strict(),
  entities: z.array(z.object({
    entity_id: z.string().min(1), kind: z.string().min(1), label: z.string().nullable().optional(),
    visible: z.boolean(), enabled: z.boolean(), selected: z.boolean(), detail: z.unknown().nullable().optional()
  }).strict()),
  controls: z.array(z.object({
    control_id: z.string().min(1), owner_id: z.string().min(1), role: z.string().min(1),
    label: z.string().nullable().optional(), visible: z.boolean(), enabled: z.boolean(),
    selected: z.boolean().nullable(), focused: z.boolean().nullable(), actions: z.array(z.string().min(1))
  }).strict()),
  affordances: z.array(affordanceSchema),
  completeness: z.object({
    player_visible_semantics: z.string().min(1),
    legal_actions: z.string().min(1),
    sources: z.array(z.string()),
    missing: z.array(z.string())
  }).passthrough(),
  bridge: identitySchema,
  game: gameSchema,
  observation_policy: z.object({ includes_hidden_information: z.literal(false) }).passthrough(),
  visibility: z.object({
    profile_id: z.string(), core_status: z.string(), player_visible_closure_status: z.string(),
    available_inspections: z.array(z.string()), linked_detail_kinds: z.array(z.string()),
    hidden_by_policy: z.array(z.string()), missing: z.array(z.string()),
    unknown_critical_field_behavior: z.string()
  }).passthrough(),
  inspection_catalog: z.array(z.record(z.unknown())),
  linked_detail_catalog: z.array(z.record(z.unknown())),
  diagnostics: z.array(z.record(z.unknown())),
  warnings: z.array(z.string()),
  coverage: z.record(z.unknown())
}).strict().superRefine((value, context) => {
  const ids = value.affordances.map((item) => item.affordance_id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "affordance ids must be unique" });
  }
  if (value.affordances.some((item) => item.owner_id !== value.owner.owner_id)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "affordance owner must match current UI owner" });
  }
});

const capabilitiesSchema: z.ZodTypeAny = z.object({
  protocol_version: z.literal(SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL),
  observation_schema: z.literal("sts2.connector.human-ui/observation-2"),
  action_schema: z.literal("sts2.connector.human-ui/action-2"),
  receipt_schema: z.literal("sts2.connector.human-ui/receipt-2"),
  control_schema: z.literal("sts2.connector.human-ui/control-1"),
  status: z.string().min(1), bridge: identitySchema, game: gameSchema,
  actions: z.array(z.string()),
  state_bound: z.literal(true), single_controller: z.literal(true),
  business_source_required: z.literal(false), business_outcome_required: z.literal(false),
  execution_available: z.boolean(), control: controlSchema, non_claims: z.array(z.string())
}).strict();

const attributionSchema = z.object({
  runtime_instance_id: z.string().min(1), client_session_id: z.string().min(1),
  client_instance_id: z.string().min(1), product_id: z.string().min(1), product_name: z.string().min(1),
  product_version: z.string().min(1), controller_lease_id: z.string().min(1),
  controller_generation: z.number().int().positive()
}).passthrough();

const receiptSchema: z.ZodTypeAny = z.object({
  protocol_version: z.literal(SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL),
  schema: z.literal("sts2.connector.human-ui/receipt-2"), request_id: z.string().min(1),
  status: z.enum(["applied", "not_applied", "unknown"]),
  delivery: z.enum(["applied", "not_applied", "unknown"]),
  action: z.object({ affordance_id: z.string(), action: z.string(), target_id: z.string() }).strict(),
  reason_code: z.string().nullable().optional(), detail: z.string().nullable().optional(),
  retry: z.object({ allowed: z.boolean(), reason: z.string() }).strict(),
  successor: observationSchema.nullable(), attribution: attributionSchema.nullable().optional()
}).strict().superRefine((value, context) => {
  if (value.status === "unknown" && value.retry.allowed) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "unknown delivery must not allow retry" });
  }
});

export interface HumanEquivalentBridgeIdentity {
  id: "sts2_human_equivalent_connector";
  name: string;
  version: string;
  upstream_commit: string;
  module_version_id: string;
  assembly_file_sha256: string;
  runtime_instance_id: string;
}
export interface HumanEquivalentGameIdentity {
  version?: string | null;
  commit?: string | null;
  main_assembly_hash?: number | null;
  compatibility: { state_observation_allowed: boolean; [key: string]: unknown };
  modset: { status: string; fingerprint: string; [key: string]: unknown };
  [key: string]: unknown;
}
export interface HumanEquivalentAffordance {
  affordance_id: string;
  action: "activate" | "select" | "deselect" | "confirm" | "cancel" | "play" | "target" | "use" | "end_turn" | "skip" | "open" | "close";
  target_id: string;
  owner_id: string;
  label: string;
  provenance: "native_ui_adapter";
}
export interface HumanEquivalentObservation {
  protocol_version: typeof SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL;
  schema: "sts2.connector.human-ui/observation-2";
  state_token: string;
  sequence: number;
  observed_at: string;
  status: "actionable" | "visible_unsupported" | "settling" | "observed";
  owner: { owner_id: string; kind: string };
  persistent_state: unknown | null;
  surface: { kind: string; stage: string; prompt?: string | null; facts: Record<string, unknown> };
  entities: Array<{ entity_id: string; kind: string; label?: string | null; visible: boolean; enabled: boolean; selected: boolean; detail?: unknown }>;
  controls: Array<{ control_id: string; owner_id: string; role: string; label?: string | null; visible: boolean; enabled: boolean; selected: boolean | null; focused: boolean | null; actions: string[] }>;
  affordances: HumanEquivalentAffordance[];
  completeness: { player_visible_semantics: string; legal_actions: string; sources: string[]; missing: string[] };
  bridge: HumanEquivalentBridgeIdentity;
  game: HumanEquivalentGameIdentity;
  observation_policy: { includes_hidden_information: false; [key: string]: unknown };
  visibility: { profile_id: string; core_status: string; player_visible_closure_status: string; available_inspections: string[]; linked_detail_kinds: string[]; hidden_by_policy: string[]; missing: string[]; unknown_critical_field_behavior: string };
  inspection_catalog: Array<Record<string, unknown>>;
  linked_detail_catalog: Array<Record<string, unknown>>;
  diagnostics: Array<Record<string, unknown>>;
  warnings: string[];
  coverage: Record<string, unknown>;
}
export interface HumanEquivalentCapabilities {
  protocol_version: typeof SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL;
  observation_schema: "sts2.connector.human-ui/observation-2";
  action_schema: "sts2.connector.human-ui/action-2";
  receipt_schema: "sts2.connector.human-ui/receipt-2";
  control_schema: "sts2.connector.human-ui/control-1";
  status: string;
  bridge: HumanEquivalentBridgeIdentity;
  game: HumanEquivalentGameIdentity;
  actions: string[];
  state_bound: true;
  single_controller: true;
  business_source_required: false;
  business_outcome_required: false;
  execution_available: boolean;
  control: { recommended_renewal_ms: number; [key: string]: unknown };
  non_claims: string[];
}
export interface HumanEquivalentReceipt {
  protocol_version: typeof SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL;
  schema: "sts2.connector.human-ui/receipt-2";
  request_id: string;
  status: "applied" | "not_applied" | "unknown";
  delivery: "applied" | "not_applied" | "unknown";
  action: { affordance_id: string; action: string; target_id: string };
  reason_code?: string | null;
  detail?: string | null;
  retry: { allowed: boolean; reason: string };
  successor: HumanEquivalentObservation | null;
  attribution?: { runtime_instance_id: string; client_session_id: string; client_instance_id: string; product_id: string; product_name: string; product_version: string; controller_lease_id: string; controller_generation: number } | null;
}
export interface HumanEquivalentClientRegistration {
  protocol_version: typeof SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL;
  schema: "sts2.connector.human-ui/control-1";
  runtime_instance_id: string;
  client: { client_session_id: string; client_instance_id: string; [key: string]: unknown };
  controller?: HumanEquivalentControllerLease | null;
}
export interface HumanEquivalentControllerLease {
  controller_lease_id: string;
  controller_generation: number;
  client_session_id: string;
  expires_at: string;
  [key: string]: unknown;
}
export interface HumanEquivalentControllerLeaseResponse {
  protocol_version: typeof SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL;
  schema: "sts2.connector.human-ui/control-1";
  runtime_instance_id: string;
  status: string;
  detail: string;
  client?: { client_session_id: string; client_instance_id: string; [key: string]: unknown } | null;
  controller?: HumanEquivalentControllerLease | null;
}
export interface DecodedHumanPayload<T> { raw: JsonObject; data: T }

export function decodeHumanCapabilities(value: unknown): DecodedHumanPayload<HumanEquivalentCapabilities> {
  return decode<HumanEquivalentCapabilities>(value, capabilitiesSchema, "Human-Equivalent capabilities");
}
export function decodeHumanObservation(value: unknown): DecodedHumanPayload<HumanEquivalentObservation> {
  return decode<HumanEquivalentObservation>(value, observationSchema, "Human-Equivalent observation");
}
export function decodeHumanReceipt(value: unknown): DecodedHumanPayload<HumanEquivalentReceipt> {
  return decode<HumanEquivalentReceipt>(value, receiptSchema, "Human-Equivalent receipt");
}
export function decodeHumanClientRegistration(value: unknown): DecodedHumanPayload<HumanEquivalentClientRegistration> {
  return decode<HumanEquivalentClientRegistration>(value, clientRegistrationSchema, "Human-Equivalent client registration");
}
export function decodeHumanControllerLeaseResponse(value: unknown): DecodedHumanPayload<HumanEquivalentControllerLeaseResponse> {
  return decode<HumanEquivalentControllerLeaseResponse>(value, controllerLeaseResponseSchema, "Human-Equivalent controller lease");
}

function decode<T>(value: unknown, schema: z.ZodType<T>, label: string): DecodedHumanPayload<T> {
  if (!isJsonObject(value)) throw new Error(`${label} was not a JSON object`);
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error(`${label} failed strict decoding: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
  return { raw: value, data: parsed.data };
}
