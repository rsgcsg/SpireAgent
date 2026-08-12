import { describe, expect, it } from "vitest";
import { buildPlayerEnvironmentAllowedActions } from "../src/domain/actions/buildPlayerEnvironmentAllowedActions.js";
import type { AdapterDescriptor } from "../src/game-io/adapter.js";
import { Sts2PlayerEnvironmentAdapter } from "../src/integrations/sts2mcp/playerEnvironmentAdapter.js";
import { prefetchPlayerEnvironmentDecisionBundle } from "../src/integrations/sts2mcp/playerEnvironmentDecisionBundle.js";
import {
  decodePlayerClientRegistration,
  decodePlayerControllerLeaseResponse,
  decodePlayerSnapshot
} from "../src/integrations/sts2mcp/playerEnvironmentProtocol.js";
import { wrapPlayerEnvironmentState } from "../src/integrations/sts2mcp/rawState.js";
import { normalizePlayerEnvironmentCurrentState } from "../src/normalization/normalizePlayerEnvironmentCurrentState.js";
import type { JsonObject } from "../src/shared/json.js";

const SOURCE: AdapterDescriptor = {
  adapterId: "sts2-player-environment",
  endpoint: "http://fixture.invalid",
  capabilities: {
    canReadState: true,
    canExecuteActions: true,
    canListLegalActions: true,
    actionResults: "partial",
    legalActionAuthority: "player_environment",
    protocols: ["player_environment"]
  }
};

function snapshot(): JsonObject {
  return {
    protocol_version: "1.0-rc.1",
    schema: "sts2.player-environment/snapshot-1",
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
      content_schema: "sts2.player-environment/surface/generated_card_choice-1",
      content: {
        surface: { kind: "generated_card_choice", cards: [{ entity_id: "card-1", name: "Visible card" }] },
        context: { kind: "event", name: "Unknown new event" }
      },
      capabilities: [{ verb: "select", subject_role: "card", arguments: [], availability_basis: "current_native_interaction" }]
    },
    referents: [{
      referent_id: "card-1",
      role: "card",
      kind: "entity",
      label: "Visible card",
      state: { visible: true, enabled: true, selected: false, observation_basis: "native_visible_fact" },
      properties_schema: "sts2.player-environment/referent/card-1",
      properties: {}
    }],
    bound_actions: {
      schema: "sts2.player-environment/bound-actions-1",
      status: "complete",
      materialized_count: 1,
      total_count: 1,
      limit: 512,
      ordering_semantics: "candidate_id_then_operand_name_then_referent_id",
      actions: [{
        bound_action_id: "bound-action-card-1",
        verb: "select",
        interaction_id: "screen-current",
        subject_referent_id: "card-1",
        arguments: [],
        label: "Choose Visible card"
      }]
    },
    reads: [],
    completeness: { status: "complete", visible_information: "complete_current_structured_ui", interaction_discovery: "derived_from_current_visible_enabled_controls", missing: [], hidden_by_policy: [] },
    session: { runtime_instance_id: "fixture-runtime", environment_fingerprint: "fixture-environment" },
    information_policy: { id: "player_visible", scope: "player_environment", includes_hidden_information: false, unknown_field_behavior: "fail_closed" }
  };
}

function capabilities(): JsonObject {
  return {
    protocol_version: "1.0-rc.1",
    snapshot_schema: "sts2.player-environment/snapshot-1",
    action_schema: "sts2.player-environment/action-1",
    receipt_schema: "sts2.player-environment/receipt-1",
    control_schema: "sts2.player-environment/control-1",
    status: "ready",
    host: { id: "sts2_player_environment", name: "STS2 Player Environment", version: "fixture", runtime_instance_id: "fixture-runtime", host_kind: "live_ui", implementation: { source_revision: "fixture", module_version_id: "fixture-mvid", artifact_sha256: "a".repeat(64) } },
    game: { version: "v0.109.1", commit: "fixture", branch: "fixture", main_assembly_hash: 1, compatibility: { status: "exact", observation_allowed: true, detail: "fixture" }, modset: { status: "exact_player_environment_only", fingerprint: "fixture-modset", scope: "loaded", loaded_mod_ids: ["STS2_MCP"], detail: "fixture" } },
    environment_fingerprint: "fixture-environment",
    verbs: ["select"],
    snapshot_bound: true,
    single_controller: true,
    execution_available: true,
    control: { recommended_renewal_ms: 10_000 },
    evidence_profiles: [{
      id: "native_pages.v1",
      enabled: false,
      supported_kinds: ["run_deck"],
      snapshot_bound: true,
      runtime_bound: true,
      default_in_consumer_flow: false,
      creates_mutation_authority: false,
      enters_action_ledger: false
    }],
    non_claims: []
  };
}

function json(value: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("Player Environment C", () => {
  it("accepts omitted referent state when selected and focused are not observed", () => {
    const current = snapshot();
    const referent = (current.referents as JsonObject[])[0]!;
    const state = referent.state as JsonObject;
    delete state.selected;
    delete state.focused;

    expect(decodePlayerSnapshot(current).data.referents[0]).toMatchObject({
      referent_id: "card-1",
      state: { visible: true, enabled: true }
    });
  });

  it("accepts an unknown business source when current native UI is exact and operable", () => {
    const decoded = decodePlayerSnapshot(snapshot()).data;
    expect(decoded.bound_actions.actions).toHaveLength(1);
    expect(decoded.interaction.content).not.toHaveProperty("source_kind");
  });

  it("rejects D annotations in the pure C observation contract", () => {
    expect(() => decodePlayerSnapshot({ ...snapshot(), optional_annotations: { scene_hint: "event", purpose_hint: null, phase_hint: "ready", expected_transition: null, teacher_generated: false, authorization_effect: "none" } }))
      .toThrow();
  });

  it("rejects bound actions and reads that do not bind a current referent", () => {
    const missingTarget = snapshot();
    (((missingTarget.bound_actions as JsonObject).actions as JsonObject[])[0]!).subject_referent_id = "missing-referent";
    expect(() => decodePlayerSnapshot(missingTarget)).toThrow(/current referent/u);

    const missingReadTarget = snapshot();
    missingReadTarget.reads = [{
      read_id: "read:surface_card:missing",
      kind: "surface_card",
      target_referent_id: "missing-referent",
      content_schema: "sts2.player-environment/read/surface_card-1",
      visibility_basis: "player_visible",
      snapshot_bound: true,
      ordering_semantics: "single_entity",
      hidden_by_policy: []
    }];
    expect(() => decodePlayerSnapshot(missingReadTarget)).toThrow(/current referent/u);
  });

  it("requires schemas for extensible referent properties", () => {
    const unversioned = snapshot();
    delete (unversioned.referents as JsonObject[])[0]!.properties_schema;
    expect(() => decodePlayerSnapshot(unversioned)).toThrow(/content schema/u);
  });

  it("rejects preview.2 history fields from the current environment contract", () => {
    expect(() => decodePlayerSnapshot({
      ...snapshot(),
      state_token: "legacy-state",
      entities: [],
      controls: []
    })).toThrow();
  });

  it("projects current bound actions to opaque Re choices without V2 legal_actions wire data", () => {
    const raw = wrapPlayerEnvironmentState({ snapshot: snapshot() });
    const normalized = normalizePlayerEnvironmentCurrentState(raw, SOURCE, "2026-08-04T00:00:00Z");
    expect(normalized.currentState.surface.kind).toBe("player_environment");
    const actions = buildPlayerEnvironmentAllowedActions(normalized.currentState, normalized.stateHash);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ kind: "select" });
    expect(actions[0]?.action).toEqual({
      kind: "bound_action",
      choiceId: "bound-action-card-1",
      expectedSnapshotId: "state-he-1",
      boundActionId: "bound-action-card-1"
    });
  });

  it("keeps semantic observation valid but withholds Re authority for a truncated finite projection", () => {
    const current = snapshot();
    current.status = "observed";
    (current.interaction as JsonObject).capabilities = [];
    const projection = current.bound_actions as JsonObject;
    projection.status = "truncated";
    projection.total_count = 600;
    (current.completeness as JsonObject).status = "partial";
    (current.completeness as JsonObject).missing = ["finite_bound_action_projection_incomplete"];

    const normalized = normalizePlayerEnvironmentCurrentState(
      wrapPlayerEnvironmentState({ snapshot: current }),
      SOURCE,
      "2026-08-04T00:00:00Z"
    );

    expect(normalized.currentState.context.kind).toBe("event");
    expect(normalized.currentState.stability).toBe("non_actionable");
    expect(normalized.currentState.actionAuthority).toBe("none");
    expect(buildPlayerEnvironmentAllowedActions(normalized.currentState, normalized.stateHash)).toEqual([]);
  });

  it("rejects interactive or capability claims from an incomplete action projection", () => {
    const inconsistent = snapshot();
    const projection = inconsistent.bound_actions as JsonObject;
    projection.status = "truncated";
    projection.total_count = 2;

    expect(() => decodePlayerSnapshot(inconsistent)).toThrow(/interactive status/u);

    inconsistent.status = "observed";
    expect(() => decodePlayerSnapshot(inconsistent)).toThrow(/interaction capabilities/u);
  });

  it("preserves complete visible combat facts and distinguishes exact target referents", () => {
    const current = snapshot();
    const interaction = current.interaction as JsonObject;
    interaction.kind = "combat_turn";
    interaction.content_schema = "sts2.player-environment/surface/combat_turn-1";
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
      { referent_id: "enemy-1", role: "enemy", kind: "entity", label: "Left enemy", state: { visible: true, observation_basis: "native_visible_fact" }, properties_schema: "sts2.player-environment/referent/enemy-1", properties: { hp: 11 } },
      { referent_id: "enemy-2", role: "enemy", kind: "entity", label: "Right enemy", state: { visible: true, observation_basis: "native_visible_fact" }, properties_schema: "sts2.player-environment/referent/enemy-1", properties: { hp: 9 } }
    ];
    const boundActions = current.bound_actions as JsonObject;
    boundActions.materialized_count = 2;
    boundActions.total_count = 2;
    boundActions.actions = [
      { bound_action_id: "play-left", verb: "play", interaction_id: "screen-current", subject_referent_id: "card-1", arguments: [{ role: "target", referent_id: "enemy-1" }], label: "Play Visible card -> Left enemy" },
      { bound_action_id: "play-right", verb: "play", interaction_id: "screen-current", subject_referent_id: "card-1", arguments: [{ role: "target", referent_id: "enemy-2" }], label: "Play Visible card -> Right enemy" }
    ];

    const normalized = normalizePlayerEnvironmentCurrentState(
      wrapPlayerEnvironmentState({ snapshot: current }),
      SOURCE,
      "2026-08-04T00:00:00Z"
    );
    expect(normalized.currentState.context).toMatchObject({
      kind: "combat",
      encounterType: "elite",
      round: 3,
      enemies: [{ entityId: "enemy-1", name: "Left enemy" }, { entityId: "enemy-2", name: "Right enemy" }]
    });
    const actions = buildPlayerEnvironmentAllowedActions(normalized.currentState, normalized.stateHash);
    expect(actions.map((action) => action.entityBindings)).toEqual([
      [{ role: "subject", entityId: "card-1" }, { role: "target", entityId: "enemy-1" }],
      [{ role: "subject", entityId: "card-1" }, { role: "target", entityId: "enemy-2" }]
    ]);
  });

  it("uses the Player Environment control schema without a V3 wire dependency", () => {
    const registration = decodePlayerClientRegistration({
      protocol_version: "1.0-rc.1",
      schema: "sts2.player-environment/control-1",
      runtime_instance_id: "runtime-he",
      client: { client_session_id: "client-session", client_instance_id: "client-instance" },
      controller: null
    }).data;
    const lease = decodePlayerControllerLeaseResponse({
      protocol_version: "1.0-rc.1",
      schema: "sts2.player-environment/control-1",
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
    expect(lease.schema).toBe("sts2.player-environment/control-1");
  });

  it("rejects an observation from a different exact environment", async () => {
    let capabilityReads = 0;
    const adapter = new Sts2PlayerEnvironmentAdapter(
      "http://fixture.invalid",
      1_000,
      {},
      async (input) => {
        const url = String(input);
        if (url.endsWith("/api/player-environment/capabilities")) {
          capabilityReads += 1;
          const value = capabilities();
          if (capabilityReads > 1) value.environment_fingerprint = "different-environment";
          return json(value);
        }
        if (url.endsWith("/api/player-environment/snapshot")) return json(snapshot());
        throw new Error(`Unexpected request ${url}`);
      }
    );

    await expect(adapter.readCurrentState()).rejects.toThrow(/environment identity drifted/u);
    await adapter.close();
  });

  it("keeps a truncated observation readable while withholding adapter invocations", async () => {
    const current = snapshot();
    current.status = "observed";
    (current.interaction as JsonObject).capabilities = [];
    const projection = current.bound_actions as JsonObject;
    projection.status = "truncated";
    projection.total_count = 600;
    (current.completeness as JsonObject).status = "partial";
    (current.completeness as JsonObject).missing = ["finite_bound_action_projection_incomplete"];
    const adapter = new Sts2PlayerEnvironmentAdapter(
      "http://fixture.invalid",
      1_000,
      {},
      async (input) => {
        const url = String(input);
        if (url.endsWith("/api/player-environment/capabilities")) return json(capabilities());
        if (url.endsWith("/api/player-environment/snapshot")) return json(current);
        throw new Error(`Unexpected request ${url}`);
      }
    );

    const raw = await adapter.readCurrentState();
    const normalized = normalizePlayerEnvironmentCurrentState(raw, adapter.describe());
    await adapter.close();

    expect(normalized.currentState.surface.kind).toBe("player_environment");
    expect(normalized.currentState.actionAuthority).toBe("none");
    expect(buildPlayerEnvironmentAllowedActions(normalized.currentState, normalized.stateHash)).toEqual([]);
  });

  it("lets an eager consumer aggregate advertised reads without creating action authority", async () => {
    const current = decodePlayerSnapshot({
      ...snapshot(),
      reads: [
        {
          read_id: "read:run_deck",
          kind: "run_deck",
          target_referent_id: null,
          content_schema: "sts2.player-environment/read/run_deck-1",
          visibility_basis: "player_openable_run_deck_view",
          snapshot_bound: true,
          ordering_semantics: "unordered_multiset",
          hidden_by_policy: []
        },
        {
          read_id: "read:surface_card:card-1",
          kind: "surface_card",
          target_referent_id: "card-1",
          content_schema: "sts2.player-environment/read/surface_card-1",
          visibility_basis: "normal_player_visible_surface_card",
          snapshot_bound: true,
          ordering_semantics: "single_entity",
          hidden_by_policy: []
        }
      ]
    }).data;
    const calls: string[] = [];
    const bundle = await prefetchPlayerEnvironmentDecisionBundle(
      current,
      async (readId, expectedSnapshotId) => {
        calls.push(readId);
        return {
          protocol_version: "1.0-rc.1",
          schema: "sts2.player-environment/read-1",
          read_id: readId,
          expected_snapshot_id: expectedSnapshotId,
          observed_snapshot_id: expectedSnapshotId,
          observed_at: "2026-08-11T00:00:00Z",
          kind: readId === "read:run_deck" ? "run_deck" : "surface_card",
          target_referent_id: readId === "read:run_deck" ? null : "card-1",
          visibility_basis: readId === "read:run_deck"
            ? "player_openable_run_deck_view"
            : "normal_player_visible_surface_card",
          ordering_semantics: readId === "read:run_deck" ? "unordered_multiset" : "single_entity",
          content_schema: readId === "read:run_deck"
            ? "sts2.player-environment/read/run_deck-1"
            : "sts2.player-environment/read/surface_card-1",
          content: {},
          completeness: {
            status: "complete",
            visible_information: "complete",
            interaction_discovery: "read_only",
            missing: [],
            hidden_by_policy: []
          },
          session: current.session,
          information_policy: current.information_policy
        };
      }
    );

    expect(calls).toEqual(["read:run_deck", "read:surface_card:card-1"]);
    expect(bundle.observation).toBe(current);
    expect(bundle.reads).toHaveLength(2);
    expect(bundle.observation.bound_actions.actions).toHaveLength(1);
  });

  it("rejects a mixed-snapshot eager read bundle", async () => {
    const current = decodePlayerSnapshot({
      ...snapshot(),
      reads: [{
        read_id: "read:run_deck",
        kind: "run_deck",
        target_referent_id: null,
        content_schema: "sts2.player-environment/read/run_deck-1",
        visibility_basis: "player_openable_run_deck_view",
        snapshot_bound: true,
        ordering_semantics: "unordered_multiset",
        hidden_by_policy: []
      }]
    }).data;

    await expect(prefetchPlayerEnvironmentDecisionBundle(current, async () => ({
      protocol_version: "1.0-rc.1",
      schema: "sts2.player-environment/read-1",
      read_id: "read:run_deck",
      expected_snapshot_id: current.snapshot_id,
      observed_snapshot_id: "state-drifted",
      observed_at: "2026-08-11T00:00:00Z",
      kind: "run_deck",
      target_referent_id: null,
      visibility_basis: "player_openable_run_deck_view",
      ordering_semantics: "unordered_multiset",
      content_schema: "sts2.player-environment/read/run_deck-1",
      content: {},
      completeness: {
        status: "complete",
        visible_information: "complete",
        interaction_discovery: "read_only",
        missing: [],
        hidden_by_policy: []
      },
      session: current.session,
      information_policy: current.information_policy
    }))).rejects.toThrow(/not coherent/u);
  });

  it("treats applied Player Environment input as delivered while successor readiness remains separate", async () => {
    const current = snapshot();
    const successor: JsonObject = {
      ...snapshot(),
      snapshot_id: "state-he-2",
      sequence: 2,
      status: "settling"
    };
    (successor.interaction as JsonObject).capabilities = [];
    const successorProjection = successor.bound_actions as JsonObject;
    successorProjection.materialized_count = 0;
    successorProjection.total_count = 0;
    successorProjection.actions = [];
    let submittedBody: Record<string, unknown> | undefined;
    const adapter = new Sts2PlayerEnvironmentAdapter(
      "http://fixture.invalid",
      1_000,
      {},
      async (input, init) => {
        const url = String(input);
        if (url.endsWith("/api/player-environment/capabilities")) return json(capabilities());
        if (url.endsWith("/api/player-environment/snapshot")) return json(current);
        if (url.endsWith("/api/player-environment/clients/register")) {
          const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
          return json({
            protocol_version: "1.0-rc.1",
            schema: "sts2.player-environment/control-1",
            runtime_instance_id: "fixture-runtime",
            client: {
              client_session_id: "client-session",
              client_instance_id: String(body.client_instance_id)
            },
            controller: null
          }, 201);
        }
        if (url.endsWith("/api/player-environment/controller/acquire")) {
          return json({
            protocol_version: "1.0-rc.1",
            schema: "sts2.player-environment/control-1",
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
        if (url.endsWith("/api/player-environment/actions")) {
          const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
          submittedBody = body;
          return json({
            protocol_version: "1.0-rc.1",
            schema: "sts2.player-environment/receipt-1",
            request_id: String(body.request_id),
            delivery: "delivered",
            action: {
              bound_action_id: "bound-action-card-1",
              verb: "select",
              subject_referent_id: "card-1",
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
    const normalized = normalizePlayerEnvironmentCurrentState(raw, adapter.describe());
    const action = buildPlayerEnvironmentAllowedActions(normalized.currentState, normalized.stateHash)[0]!;
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
