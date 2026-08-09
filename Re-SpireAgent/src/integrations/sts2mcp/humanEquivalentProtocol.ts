import { z } from "zod";
import { isJsonObject, type JsonObject } from "../../shared/json.js";
import { sharedVisibleStateSchema } from "./gatewayVisibleStateProtocol.js";

export const SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL = "1.0-preview.3" as const;

const hostSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  runtime_instance_id: z.string().min(1),
  host_kind: z.enum(["live_ui", "headless", "replay", "test"]),
  implementation: z.object({
    source_revision: z.string().min(1).nullable().optional(),
    module_version_id: z.string().min(1).nullable().optional(),
    artifact_sha256: z.string().regex(/^[a-f0-9]{64}$/iu).nullable().optional()
  }).strict()
}).strict();

const gameSchema = z.object({
  version: z.string().nullable().optional(),
  commit: z.string().nullable().optional(),
  branch: z.string().nullable().optional(),
  main_assembly_hash: z.number().int().nullable().optional(),
  compatibility: z.object({
    status: z.string().min(1),
    observation_allowed: z.boolean(),
    detail: z.string()
  }).strict(),
  modset: z.object({
    status: z.string().min(1),
    fingerprint: z.string().min(1),
    scope: z.string().min(1),
    loaded_mod_ids: z.array(z.string().min(1)),
    detail: z.string()
  }).strict()
}).strict();

const sessionSchema = z.object({
  runtime_instance_id: z.string().min(1),
  environment_fingerprint: z.string().min(1)
}).strict();

const controlSchema = z.object({
  recommended_renewal_ms: z.number().int().nonnegative()
}).strict();

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
  schema: z.literal("sts2.human-environment/control-1"),
  runtime_instance_id: z.string().min(1),
  client: controlClientSchema,
  controller: controlLeaseSchema.nullable().optional()
}).strict();

const controllerLeaseResponseSchema = z.object({
  protocol_version: z.literal(SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL),
  schema: z.literal("sts2.human-environment/control-1"),
  runtime_instance_id: z.string().min(1),
  status: z.string().min(1),
  detail: z.string(),
  client: controlClientSchema.nullable().optional(),
  controller: controlLeaseSchema.nullable().optional()
}).strict();

const actionVerbSchema = z.enum([
  "activate", "select", "deselect", "confirm", "cancel", "play",
  "target", "use", "end_turn", "skip", "open", "close"
]);

const affordanceSchema = z.object({
  affordance_id: z.string().min(1),
  action: actionVerbSchema,
  target_element_id: z.string().min(1),
  owner_id: z.string().min(1),
  label: z.string().min(1)
}).strict();

const elementSchema = z.object({
  element_id: z.string().min(1),
  role: z.string().min(1),
  category: z.enum(["entity", "control"]),
  label: z.string().nullable().optional(),
  state: z.object({
    visible: z.boolean(),
    enabled: z.boolean(),
    selected: z.boolean().nullable().optional(),
    focused: z.boolean().nullable().optional(),
    observation_basis: z.enum(["native_visible_entity", "native_ui_actionability"])
  }).strict(),
  actions: z.array(actionVerbSchema),
  properties_schema: z.string().regex(/^sts2\.human-environment\/element\/[a-z0-9_]+-1$/u).nullable().optional(),
  properties: z.unknown().nullable().optional()
}).strict().superRefine((value, context) => {
  if (value.properties != null && !value.properties_schema) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "element properties require a content schema" });
  }
});

const readSchema = z.object({
  read_id: z.string().min(1),
  kind: z.string().min(1),
  target_element_id: z.string().nullable().optional(),
  content_schema: z.string().regex(/^sts2\.human-environment\/read\/[a-z0-9_]+-1$/u),
  visibility_basis: z.string().min(1),
  snapshot_bound: z.literal(true),
  ordering_semantics: z.string().min(1),
  hidden_by_policy: z.array(z.string())
}).strict();

const observationSchema: z.ZodTypeAny = z.object({
  protocol_version: z.literal(SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL),
  schema: z.literal("sts2.human-environment/observation-1"),
  snapshot_id: z.string().min(1),
  sequence: z.number().int().positive(),
  observed_at: z.string().min(1),
  status: z.enum(["actionable", "visible_unsupported", "settling", "observed"]),
  owner: z.object({ owner_id: z.string().min(1), role: z.string().min(1) }).strict(),
  persistent: z.object({
    content_schema: z.literal("sts2.human-environment/persistent/run-player-1"),
    content: sharedVisibleStateSchema
  }).strict().nullable(),
  surface: z.object({
    kind: z.string().min(1),
    stage: z.string().min(1),
    prompt: z.string().nullable().optional(),
    content_schema: z.string().regex(/^sts2\.human-environment\/surface\/[a-z0-9_]+-1$/u),
    content: z.record(z.unknown())
  }).strict(),
  elements: z.array(elementSchema),
  affordances: z.array(affordanceSchema),
  reads: z.array(readSchema),
  completeness: z.object({
    status: z.enum(["complete", "partial", "visible_unmapped", "unknown"]),
    visible_information: z.string().min(1),
    interaction_discovery: z.string().min(1),
    missing: z.array(z.string()),
    hidden_by_policy: z.array(z.string())
  }).strict(),
  session: sessionSchema,
  observation_policy: z.object({
    id: z.string().min(1),
    scope: z.string().min(1),
    includes_hidden_information: z.literal(false),
    unknown_field_behavior: z.string().min(1)
  }).strict()
}).strict().superRefine((value, context) => {
  const affordanceIds = value.affordances.map((item) => item.affordance_id);
  const elementIds = new Set(value.elements.map((item) => item.element_id));
  if (new Set(affordanceIds).size !== affordanceIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "affordance ids must be unique" });
  }
  if (elementIds.size !== value.elements.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "element ids must be unique" });
  }
  if (value.affordances.some((item) => item.owner_id !== value.owner.owner_id)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "affordance owner must match current UI owner" });
  }
  if (value.affordances.some((item) => !elementIds.has(item.target_element_id))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "every affordance target must be a current element" });
  }
  if (value.reads.some((item) => item.target_element_id && !elementIds.has(item.target_element_id))) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "every targeted read must reference a current element" });
  }
});

const capabilitiesSchema = z.object({
  protocol_version: z.literal(SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL),
  observation_schema: z.literal("sts2.human-environment/observation-1"),
  action_schema: z.literal("sts2.human-environment/action-1"),
  receipt_schema: z.literal("sts2.human-environment/receipt-1"),
  control_schema: z.literal("sts2.human-environment/control-1"),
  status: z.string().min(1),
  host: hostSchema,
  game: gameSchema,
  environment_fingerprint: z.string().min(1),
  actions: z.array(actionVerbSchema),
  snapshot_bound: z.literal(true),
  single_controller: z.literal(true),
  execution_available: z.boolean(),
  control: controlSchema,
  non_claims: z.array(z.string())
}).strict();

const attributionSchema = z.object({
  runtime_instance_id: z.string().min(1), client_session_id: z.string().min(1),
  client_instance_id: z.string().min(1), product_id: z.string().min(1), product_name: z.string().min(1),
  product_version: z.string().min(1), controller_lease_id: z.string().min(1),
  controller_generation: z.number().int().positive()
}).strict();

const receiptSchema: z.ZodTypeAny = z.object({
  protocol_version: z.literal(SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL),
  schema: z.literal("sts2.human-environment/receipt-1"),
  request_id: z.string().min(1),
  delivery: z.enum(["applied", "not_applied", "unknown"]),
  action: z.object({
    affordance_id: z.string(), action: actionVerbSchema, target_element_id: z.string()
  }).strict(),
  reason_code: z.string().nullable().optional(),
  detail: z.string().nullable().optional(),
  retry: z.object({ allowed: z.boolean(), reason: z.string() }).strict(),
  successor: observationSchema.nullable(),
  attribution: attributionSchema.nullable().optional()
}).strict().superRefine((value, context) => {
  if (value.delivery === "unknown" && value.retry.allowed) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "unknown delivery must not allow retry" });
  }
});

export type HumanActionVerb = z.infer<typeof actionVerbSchema>;
export type HumanEnvironmentHostIdentity = z.infer<typeof hostSchema>;
export type HumanEquivalentGameIdentity = z.infer<typeof gameSchema>;
export type HumanEnvironmentElement = z.infer<typeof elementSchema>;
export type HumanEnvironmentRead = z.infer<typeof readSchema>;

export interface HumanEquivalentAffordance {
  affordance_id: string;
  action: HumanActionVerb;
  target_element_id: string;
  owner_id: string;
  label: string;
}

export interface HumanEquivalentObservation {
  protocol_version: typeof SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL;
  schema: "sts2.human-environment/observation-1";
  snapshot_id: string;
  sequence: number;
  observed_at: string;
  status: "actionable" | "visible_unsupported" | "settling" | "observed";
  owner: { owner_id: string; role: string };
  persistent: { content_schema: "sts2.human-environment/persistent/run-player-1"; content: unknown } | null;
  surface: { kind: string; stage: string; prompt?: string | null; content_schema: string; content: Record<string, unknown> };
  elements: HumanEnvironmentElement[];
  affordances: HumanEquivalentAffordance[];
  reads: HumanEnvironmentRead[];
  completeness: { status: "complete" | "partial" | "visible_unmapped" | "unknown"; visible_information: string; interaction_discovery: string; missing: string[]; hidden_by_policy: string[] };
  session: { runtime_instance_id: string; environment_fingerprint: string };
  observation_policy: { id: string; scope: string; includes_hidden_information: false; unknown_field_behavior: string };
}

export interface HumanEquivalentCapabilities {
  protocol_version: typeof SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL;
  observation_schema: "sts2.human-environment/observation-1";
  action_schema: "sts2.human-environment/action-1";
  receipt_schema: "sts2.human-environment/receipt-1";
  control_schema: "sts2.human-environment/control-1";
  status: string;
  host: HumanEnvironmentHostIdentity;
  game: HumanEquivalentGameIdentity;
  environment_fingerprint: string;
  actions: HumanActionVerb[];
  snapshot_bound: true;
  single_controller: true;
  execution_available: boolean;
  control: { recommended_renewal_ms: number };
  non_claims: string[];
}

export interface HumanEquivalentReceipt {
  protocol_version: typeof SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL;
  schema: "sts2.human-environment/receipt-1";
  request_id: string;
  delivery: "applied" | "not_applied" | "unknown";
  action: { affordance_id: string; action: HumanActionVerb; target_element_id: string };
  reason_code?: string | null;
  detail?: string | null;
  retry: { allowed: boolean; reason: string };
  successor: HumanEquivalentObservation | null;
  attribution?: { runtime_instance_id: string; client_session_id: string; client_instance_id: string; product_id: string; product_name: string; product_version: string; controller_lease_id: string; controller_generation: number } | null;
}

export interface HumanEquivalentClientRegistration {
  protocol_version: typeof SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL;
  schema: "sts2.human-environment/control-1";
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
  schema: "sts2.human-environment/control-1";
  runtime_instance_id: string;
  status: string;
  detail: string;
  client?: { client_session_id: string; client_instance_id: string; [key: string]: unknown } | null;
  controller?: HumanEquivalentControllerLease | null;
}

export interface DecodedHumanPayload<T> { raw: JsonObject; data: T }

export function decodeHumanCapabilities(value: unknown): DecodedHumanPayload<HumanEquivalentCapabilities> {
  return decode<HumanEquivalentCapabilities>(value, capabilitiesSchema, "Human Environment capabilities");
}
export function decodeHumanObservation(value: unknown): DecodedHumanPayload<HumanEquivalentObservation> {
  return decode<HumanEquivalentObservation>(value, observationSchema, "Human Environment observation");
}
export function decodeHumanReceipt(value: unknown): DecodedHumanPayload<HumanEquivalentReceipt> {
  return decode<HumanEquivalentReceipt>(value, receiptSchema, "Human Environment receipt");
}
export function decodeHumanClientRegistration(value: unknown): DecodedHumanPayload<HumanEquivalentClientRegistration> {
  return decode<HumanEquivalentClientRegistration>(value, clientRegistrationSchema, "Human Environment client registration");
}
export function decodeHumanControllerLeaseResponse(value: unknown): DecodedHumanPayload<HumanEquivalentControllerLeaseResponse> {
  return decode<HumanEquivalentControllerLeaseResponse>(value, controllerLeaseResponseSchema, "Human Environment controller lease");
}

function decode<T>(value: unknown, schema: z.ZodType<T>, label: string): DecodedHumanPayload<T> {
  if (!isJsonObject(value)) throw new Error(`${label} was not a JSON object`);
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error(`${label} failed strict decoding: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
  return { raw: value, data: parsed.data };
}
