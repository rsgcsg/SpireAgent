import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import type { AdapterDescriptor } from "../src/game-io/adapter.js";
import { Sts2HumanEquivalentAdapter } from "../src/integrations/sts2mcp/humanEquivalentAdapter.js";
import {
  decodeHumanClientRegistration,
  decodeHumanControllerLeaseResponse,
  decodeHumanObservation
} from "../src/integrations/sts2mcp/humanEquivalentProtocol.js";
import { wrapHumanEquivalentState } from "../src/integrations/sts2mcp/rawState.js";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";
import type { JsonObject } from "../src/shared/json.js";

const SOURCE: AdapterDescriptor = {
  adapterId: "sts2-human-equivalent",
  endpoint: "http://fixture.invalid",
  capabilities: {
    canReadState: true,
    canExecuteActions: true,
    canListLegalActions: true,
    actionResults: "partial",
    legalActionAuthority: "current_human_ui",
    protocols: ["human_equivalent"]
  }
};

function snapshot(): JsonObject {
  return {
    protocol_version: "1.0-preview.2",
    schema: "sts2.connector.human-ui/observation-2",
    state_token: "state-he-1",
    sequence: 1,
    observed_at: "2026-08-04T00:00:00Z",
    status: "actionable",
    owner: { owner_id: "screen-current", kind: "generated_card_choice" },
    persistent_state: null,
    surface: {
      kind: "generated_card_choice",
      stage: "ready",
      prompt: "Choose a card",
      facts: {
        surface: { kind: "generated_card_choice", cards: [{ entity_id: "card-1", name: "Visible card" }] },
        context: { kind: "event", name: "Unknown new event" }
      }
    },
    entities: [{ entity_id: "card-1", kind: "card", label: "Visible card", visible: true, enabled: true, selected: false, detail: {} }],
    controls: [{ control_id: "card-1", owner_id: "screen-current", role: "select", label: "Choose Visible card", visible: true, enabled: true, selected: false, focused: false, actions: ["select"] }],
    affordances: [{
      affordance_id: "affordance-card-1",
      action: "select",
      target_id: "card-1",
      owner_id: "screen-current",
      label: "Choose Visible card",
      provenance: "native_ui_adapter"
    }],
    completeness: { player_visible_semantics: "complete_current_structured_ui", legal_actions: "derived_from_current_visible_enabled_controls", sources: ["native UI"], missing: [] },
    bridge: { id: "sts2_human_equivalent_connector", name: "STS2 Human-Equivalent Connector", version: "fixture", upstream_commit: "fixture", module_version_id: "fixture-mvid", assembly_file_sha256: "a".repeat(64), runtime_instance_id: "fixture-runtime" },
    game: { version: "v0.109.1", commit: "fixture", main_assembly_hash: 1, compatibility: { state_observation_allowed: true }, modset: { status: "exact_bridge_only", fingerprint: "fixture-modset" } },
    observation_policy: { includes_hidden_information: false },
    visibility: { profile_id: "player_visible", core_status: "complete", player_visible_closure_status: "complete", available_inspections: [], linked_detail_kinds: [], hidden_by_policy: [], missing: [], unknown_critical_field_behavior: "fail_closed" },
    inspection_catalog: [], linked_detail_catalog: [], diagnostics: [], warnings: [], coverage: {}
  };
}

function capabilities(): JsonObject {
  const value = snapshot();
  return {
    protocol_version: "1.0-preview.2",
    observation_schema: "sts2.connector.human-ui/observation-2",
    action_schema: "sts2.connector.human-ui/action-2",
    receipt_schema: "sts2.connector.human-ui/receipt-2",
    control_schema: "sts2.connector.human-ui/control-1",
    status: "ready",
    bridge: value.bridge!,
    game: value.game!,
    actions: ["select"],
    state_bound: true,
    single_controller: true,
    business_source_required: false,
    business_outcome_required: false,
    execution_available: true,
    control: { recommended_renewal_ms: 10_000 },
    non_claims: []
  };
}

function json(value: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("Human-Equivalent C", () => {
  it("accepts an unknown business source when current native UI is exact and operable", () => {
    const decoded = decodeHumanObservation(snapshot()).data;
    expect(decoded.affordances).toHaveLength(1);
    expect(decoded.surface.facts).not.toHaveProperty("source_kind");
  });

  it("rejects D annotations in the pure C observation contract", () => {
    expect(() => decodeHumanObservation({ ...snapshot(), optional_annotations: { scene_hint: "event", purpose_hint: null, phase_hint: "ready", expected_transition: null, teacher_generated: false, authorization_effect: "none" } }))
      .toThrow();
  });

  it("projects current UI affordances to opaque Re choices without V2 legal_actions wire data", () => {
    const raw = wrapHumanEquivalentState({ snapshot: snapshot() });
    const normalized = normalizeCurrentState(raw, SOURCE, "2026-08-04T00:00:00Z");
    expect(normalized.currentState.surface.kind).toBe("human_ui");
    const actions = buildAllowedActions(normalized.currentState, normalized.stateHash);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ kind: "select" });
    expect(actions[0]?.action).toEqual({
      kind: "human_ui_action",
      choiceId: "affordance-card-1",
      expectedStateToken: "state-he-1",
      affordanceId: "affordance-card-1"
    });
  });

  it("uses the Human-Equivalent control schema without a V3 wire dependency", () => {
    const registration = decodeHumanClientRegistration({
      protocol_version: "1.0-preview.2",
      schema: "sts2.connector.human-ui/control-1",
      runtime_instance_id: "runtime-he",
      client: { client_session_id: "client-session", client_instance_id: "client-instance" },
      controller: null
    }).data;
    const lease = decodeHumanControllerLeaseResponse({
      protocol_version: "1.0-preview.2",
      schema: "sts2.connector.human-ui/control-1",
      runtime_instance_id: "runtime-he",
      status: "controller_acquired",
      detail: "acquired",
      client: registration.client,
      controller: {
        controller_lease_id: "lease-he",
        controller_generation: 1,
        client_session_id: registration.client.client_session_id,
        expires_at: "2026-08-09T00:00:00Z"
      }
    }).data;

    expect(lease.controller?.controller_lease_id).toBe("lease-he");
    expect(lease.schema).toBe("sts2.connector.human-ui/control-1");
  });

  it("treats applied HE input as delivered while successor readiness remains separate", async () => {
    const current = snapshot();
    const successor = {
      ...snapshot(),
      state_token: "state-he-2",
      sequence: 2,
      status: "settling"
    } satisfies JsonObject;
    let submittedBody: Record<string, unknown> | undefined;
    const adapter = new Sts2HumanEquivalentAdapter(
      "http://fixture.invalid",
      1_000,
      { mode: "he_pure", commandPollMs: 1, commandTimeoutMs: 100 },
      async (input, init) => {
        const url = String(input);
        if (url.endsWith("/api/he/capabilities")) return json(capabilities());
        if (url.endsWith("/api/he/observation")) return json(current);
        if (url.endsWith("/api/he/clients/register")) {
          const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
          return json({
            protocol_version: "1.0-preview.2",
            schema: "sts2.connector.human-ui/control-1",
            runtime_instance_id: "fixture-runtime",
            client: {
              client_session_id: "client-session",
              client_instance_id: String(body.client_instance_id)
            },
            controller: null
          }, 201);
        }
        if (url.endsWith("/api/he/controller/acquire")) {
          return json({
            protocol_version: "1.0-preview.2",
            schema: "sts2.connector.human-ui/control-1",
            runtime_instance_id: "fixture-runtime",
            status: "controller_acquired",
            detail: "acquired",
            client: {
              client_session_id: "client-session",
              client_instance_id: "client-instance"
            },
            controller: {
              controller_lease_id: "controller-lease",
              controller_generation: 1,
              client_session_id: "client-session",
              expires_at: new Date(Date.now() + 60_000).toISOString()
            }
          });
        }
        if (url.endsWith("/api/he/actions")) {
          const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
          submittedBody = body;
          return json({
            protocol_version: "1.0-preview.2",
            schema: "sts2.connector.human-ui/receipt-2",
            request_id: String(body.request_id),
            status: "applied",
            delivery: "applied",
            action: {
              affordance_id: "affordance-card-1",
              action: "select",
              target_id: "card-1"
            },
            reason_code: null,
            detail: "native input delivered",
            retry: { allowed: false, reason: "terminal_receipt" },
            successor,
            attribution: {
              runtime_instance_id: "fixture-runtime",
              client_session_id: "client-session",
              client_instance_id: "client-instance",
              product_id: "re-spireagent",
              product_name: "Re-SpireAgent",
              product_version: "0.1.0",
              controller_lease_id: "controller-lease",
              controller_generation: 1
            }
          });
        }
        throw new Error(`Unexpected request ${url}`);
      }
    );

    const raw = await adapter.readCurrentState();
    const normalized = normalizeCurrentState(raw, adapter.describe());
    const action = buildAllowedActions(normalized.currentState, normalized.stateHash)[0]!;
    const result = await adapter.execute(action.action);
    await adapter.close();

    expect(result, JSON.stringify(result)).toMatchObject({
      accepted: true,
      outcome: "accepted",
      settlementAuthority: "adapter_confirmed",
      confirmedStateToken: "state-he-2"
    });
    expect(submittedBody).toMatchObject({
      expected_state_token: "state-he-1",
      affordance_id: "affordance-card-1"
    });
    expect(submittedBody).not.toHaveProperty("mode");
    expect(submittedBody).not.toHaveProperty("parameters");
    expect(submittedBody).not.toHaveProperty("expected_owner_id");
    expect(submittedBody).not.toHaveProperty("expected_frame_id");
  });
});
