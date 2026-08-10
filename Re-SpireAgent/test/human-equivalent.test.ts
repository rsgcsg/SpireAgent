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
    protocol_version: "1.0-preview.5",
    schema: "sts2.human-environment/observation-3",
    snapshot_id: "state-he-1",
    sequence: 1,
    observed_at: "2026-08-04T00:00:00Z",
    status: "interactive",
    persistent: null,
    interaction: {
      interaction_id: "screen-current",
      kind: "generated_card_choice",
      stage: "ready",
      prompt: "Choose a card",
      content_schema: "sts2.human-environment/surface/generated_card_choice-1",
      content: {
        surface: { kind: "generated_card_choice", cards: [{ entity_id: "card-1", name: "Visible card" }] },
        context: { kind: "event", name: "Unknown new event" }
      },
      capabilities: [{ action: "select", subject_role: "card", arguments: [], availability_basis: "current_native_interaction" }]
    },
    referents: [{
      referent_id: "card-1",
      role: "card",
      kind: "entity",
      label: "Visible card",
      state: { visible: true, enabled: true, selected: false, observation_basis: "native_visible_fact" },
      properties_schema: "sts2.human-environment/referent/card-1",
      properties: {}
    }],
    bound_actions: {
      schema: "sts2.human-environment/bound-actions-1",
      status: "complete",
      materialized_count: 1,
      total_count: 1,
      limit: 512,
      ordering_semantics: "candidate_id_then_operand_name_then_referent_id",
      actions: [{
        bound_action_id: "bound-action-card-1",
        action: "select",
        interaction_id: "screen-current",
        subject_ref: "card-1",
        arguments: [],
        label: "Choose Visible card"
      }]
    },
    reads: [],
    completeness: { status: "complete", visible_information: "complete_current_structured_ui", interaction_discovery: "derived_from_current_visible_enabled_controls", missing: [], hidden_by_policy: [] },
    session: { runtime_instance_id: "fixture-runtime", environment_fingerprint: "fixture-environment" },
    observation_policy: { id: "player_visible", scope: "current_human_ui", includes_hidden_information: false, unknown_field_behavior: "fail_closed" }
  };
}

function capabilities(): JsonObject {
  return {
    protocol_version: "1.0-preview.5",
    observation_schema: "sts2.human-environment/observation-3",
    action_schema: "sts2.human-environment/action-2",
    receipt_schema: "sts2.human-environment/receipt-3",
    control_schema: "sts2.human-environment/control-1",
    status: "ready",
    host: { id: "sts2_human_environment", name: "STS2 Human Environment", version: "fixture", runtime_instance_id: "fixture-runtime", host_kind: "live_ui", implementation: { source_revision: "fixture", module_version_id: "fixture-mvid", artifact_sha256: "a".repeat(64) } },
    game: { version: "v0.109.1", commit: "fixture", branch: "fixture", main_assembly_hash: 1, compatibility: { status: "exact", observation_allowed: true, detail: "fixture" }, modset: { status: "exact_bridge_only", fingerprint: "fixture-modset", scope: "loaded", loaded_mod_ids: ["STS2_MCP"], detail: "fixture" } },
    environment_fingerprint: "fixture-environment",
    actions: ["select"],
    snapshot_bound: true,
    single_controller: true,
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
  it("accepts omitted referent state when selected and focused are not observed", () => {
    const current = snapshot();
    const referent = (current.referents as JsonObject[])[0]!;
    const state = referent.state as JsonObject;
    delete state.selected;
    delete state.focused;

    expect(decodeHumanObservation(current).data.referents[0]).toMatchObject({
      referent_id: "card-1",
      state: { visible: true, enabled: true }
    });
  });

  it("accepts an unknown business source when current native UI is exact and operable", () => {
    const decoded = decodeHumanObservation(snapshot()).data;
    expect(decoded.bound_actions.actions).toHaveLength(1);
    expect(decoded.interaction.content).not.toHaveProperty("source_kind");
  });

  it("rejects D annotations in the pure C observation contract", () => {
    expect(() => decodeHumanObservation({ ...snapshot(), optional_annotations: { scene_hint: "event", purpose_hint: null, phase_hint: "ready", expected_transition: null, teacher_generated: false, authorization_effect: "none" } }))
      .toThrow();
  });

  it("rejects bound actions and reads that do not bind a current referent", () => {
    const missingTarget = snapshot();
    (((missingTarget.bound_actions as JsonObject).actions as JsonObject[])[0]!).subject_ref = "missing-referent";
    expect(() => decodeHumanObservation(missingTarget)).toThrow(/current referent/u);

    const missingReadTarget = snapshot();
    missingReadTarget.reads = [{
      read_id: "read:surface_card:missing",
      kind: "surface_card",
      target_referent_id: "missing-referent",
      content_schema: "sts2.human-environment/read/surface_card-1",
      visibility_basis: "player_visible",
      snapshot_bound: true,
      ordering_semantics: "single_entity",
      hidden_by_policy: []
    }];
    expect(() => decodeHumanObservation(missingReadTarget)).toThrow(/current referent/u);
  });

  it("requires schemas for extensible referent properties", () => {
    const unversioned = snapshot();
    delete (unversioned.referents as JsonObject[])[0]!.properties_schema;
    expect(() => decodeHumanObservation(unversioned)).toThrow(/content schema/u);
  });

  it("rejects preview.2 history fields from the current environment contract", () => {
    expect(() => decodeHumanObservation({
      ...snapshot(),
      state_token: "legacy-state",
      entities: [],
      controls: []
    })).toThrow();
  });

  it("projects current bound actions to opaque Re choices without V2 legal_actions wire data", () => {
    const raw = wrapHumanEquivalentState({ snapshot: snapshot() });
    const normalized = normalizeCurrentState(raw, SOURCE, "2026-08-04T00:00:00Z");
    expect(normalized.currentState.surface.kind).toBe("human_ui");
    const actions = buildAllowedActions(normalized.currentState, normalized.stateHash);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ kind: "select" });
    expect(actions[0]?.action).toEqual({
      kind: "human_ui_action",
      choiceId: "bound-action-card-1",
      expectedSnapshotId: "state-he-1",
      boundActionId: "bound-action-card-1"
    });
  });

  it("keeps semantic observation valid but withholds Re authority for a truncated finite projection", () => {
    const current = snapshot();
    const projection = current.bound_actions as JsonObject;
    projection.status = "truncated";
    projection.total_count = 600;

    const normalized = normalizeCurrentState(
      wrapHumanEquivalentState({ snapshot: current }),
      SOURCE,
      "2026-08-04T00:00:00Z"
    );

    expect(normalized.currentState.context.kind).toBe("event");
    expect(normalized.currentState.stability).toBe("non_actionable");
    expect(normalized.currentState.actionAuthority).toBe("none");
    expect(buildAllowedActions(normalized.currentState, normalized.stateHash)).toEqual([]);
  });

  it("preserves complete visible combat facts and distinguishes exact target referents", () => {
    const current = snapshot();
    const interaction = current.interaction as JsonObject;
    interaction.kind = "combat_turn";
    interaction.content_schema = "sts2.human-environment/surface/combat_turn-1";
    interaction.content = {
      surface: { kind: "combat_turn" },
      context: {
        kind: "combat",
        encounter_type: "elite",
        round: 3,
        turn_owner: "player",
        is_play_phase: true,
        player: {
          player_entity_id: "player-1",
          block: 3,
          energy: 2,
          max_energy: 3,
          hand: [],
          draw_pile_count: 5,
          discard_pile_count: 1,
          exhaust_pile_count: 0,
          statuses: [],
          companions: [],
          potion_states: [],
          orbs: [],
          orb_slots: 0
        },
        enemies: [
          { entity_id: "enemy-1", definition_id: "LEFT", name: "Left enemy", hp: 11, max_hp: 20, block: 2, statuses: [], intents: [{ type: "Attack", label: "7" }] },
          { entity_id: "enemy-2", definition_id: "RIGHT", name: "Right enemy", hp: 9, max_hp: 15, block: 0, statuses: [], intents: [{ type: "Defend" }] }
        ]
      }
    };
    current.referents = [
      ...(current.referents as JsonObject[]),
      { referent_id: "enemy-1", role: "enemy", kind: "entity", label: "Left enemy", state: { visible: true, observation_basis: "native_visible_fact" }, properties_schema: "sts2.human-environment/referent/enemy-1", properties: { hp: 11 } },
      { referent_id: "enemy-2", role: "enemy", kind: "entity", label: "Right enemy", state: { visible: true, observation_basis: "native_visible_fact" }, properties_schema: "sts2.human-environment/referent/enemy-1", properties: { hp: 9 } }
    ];
    const boundActions = current.bound_actions as JsonObject;
    boundActions.materialized_count = 2;
    boundActions.total_count = 2;
    boundActions.actions = [
      { bound_action_id: "play-left", action: "play", interaction_id: "screen-current", subject_ref: "card-1", arguments: [{ role: "target", referent_id: "enemy-1" }], label: "Play Visible card -> Left enemy" },
      { bound_action_id: "play-right", action: "play", interaction_id: "screen-current", subject_ref: "card-1", arguments: [{ role: "target", referent_id: "enemy-2" }], label: "Play Visible card -> Right enemy" }
    ];

    const normalized = normalizeCurrentState(
      wrapHumanEquivalentState({ snapshot: current }),
      SOURCE,
      "2026-08-04T00:00:00Z"
    );
    expect(normalized.currentState.context).toMatchObject({
      kind: "combat",
      encounterType: "elite",
      round: 3,
      enemies: [{ entityId: "enemy-1", name: "Left enemy" }, { entityId: "enemy-2", name: "Right enemy" }]
    });
    const actions = buildAllowedActions(normalized.currentState, normalized.stateHash);
    expect(actions.map((action) => action.entityBindings)).toEqual([
      [{ role: "subject", entityId: "card-1" }, { role: "target", entityId: "enemy-1" }],
      [{ role: "subject", entityId: "card-1" }, { role: "target", entityId: "enemy-2" }]
    ]);
  });

  it("uses the Human-Equivalent control schema without a V3 wire dependency", () => {
    const registration = decodeHumanClientRegistration({
      protocol_version: "1.0-preview.5",
      schema: "sts2.human-environment/control-1",
      runtime_instance_id: "runtime-he",
      client: { client_session_id: "client-session", client_instance_id: "client-instance" },
      controller: null
    }).data;
    const lease = decodeHumanControllerLeaseResponse({
      protocol_version: "1.0-preview.5",
      schema: "sts2.human-environment/control-1",
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
    expect(lease.schema).toBe("sts2.human-environment/control-1");
  });

  it("rejects an observation from a different exact environment", async () => {
    let capabilityReads = 0;
    const adapter = new Sts2HumanEquivalentAdapter(
      "http://fixture.invalid",
      1_000,
      { mode: "he_pure", commandPollMs: 1, commandTimeoutMs: 100 },
      async (input) => {
        const url = String(input);
        if (url.endsWith("/api/he/capabilities")) {
          capabilityReads += 1;
          const value = capabilities();
          if (capabilityReads > 1) value.environment_fingerprint = "different-environment";
          return json(value);
        }
        if (url.endsWith("/api/he/observation")) return json(snapshot());
        throw new Error(`Unexpected request ${url}`);
      }
    );

    await expect(adapter.readCurrentState()).rejects.toThrow(/environment identity drifted/u);
    await adapter.close();
  });

  it("keeps a truncated observation readable while withholding adapter invocations", async () => {
    const current = snapshot();
    const projection = current.bound_actions as JsonObject;
    projection.status = "truncated";
    projection.total_count = 600;
    const adapter = new Sts2HumanEquivalentAdapter(
      "http://fixture.invalid",
      1_000,
      { mode: "he_pure", commandPollMs: 1, commandTimeoutMs: 100 },
      async (input) => {
        const url = String(input);
        if (url.endsWith("/api/he/capabilities")) return json(capabilities());
        if (url.endsWith("/api/he/observation")) return json(current);
        throw new Error(`Unexpected request ${url}`);
      }
    );

    const raw = await adapter.readCurrentState();
    const normalized = normalizeCurrentState(raw, adapter.describe());
    await adapter.close();

    expect(normalized.currentState.surface.kind).toBe("human_ui");
    expect(normalized.currentState.actionAuthority).toBe("none");
    expect(buildAllowedActions(normalized.currentState, normalized.stateHash)).toEqual([]);
  });

  it("treats applied HE input as delivered while successor readiness remains separate", async () => {
    const current = snapshot();
    const successor = {
      ...snapshot(),
      snapshot_id: "state-he-2",
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
            protocol_version: "1.0-preview.5",
            schema: "sts2.human-environment/control-1",
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
            protocol_version: "1.0-preview.5",
            schema: "sts2.human-environment/control-1",
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
            protocol_version: "1.0-preview.5",
            schema: "sts2.human-environment/receipt-3",
            request_id: String(body.request_id),
            delivery: "applied",
            action: {
              bound_action_id: "bound-action-card-1",
              action: "select",
              subject_ref: "card-1",
              arguments: []
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
      expected_snapshot_id: "state-he-1",
      bound_action_id: "bound-action-card-1"
    });
    expect(submittedBody).not.toHaveProperty("mode");
    expect(submittedBody).not.toHaveProperty("parameters");
    expect(submittedBody).not.toHaveProperty("expected_owner_id");
    expect(submittedBody).not.toHaveProperty("expected_frame_id");
  });
});
