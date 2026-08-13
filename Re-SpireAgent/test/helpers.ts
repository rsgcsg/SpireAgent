import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { AdapterDescriptor } from "../src/game-io/adapter.js";
import { wrapPlayerEnvironmentState } from "../src/integrations/sts2Connector/rawState.js";
import type { JsonObject } from "../src/shared/json.js";

export const TEST_ADAPTER: AdapterDescriptor = {
  adapterId: "sts2-player-environment",
  adapterVersion: "test-fixture",
  endpoint: "http://localhost:15526",
  capabilities: {
    canReadState: true,
    canExecuteActions: true,
    canListLegalActions: true,
    actionResults: "partial",
    legalActionAuthority: "player_environment",
    protocols: ["player_environment"]
  }
};

/** Current strict Player Environment fixture used by Re unit tests. */
export function playerEnvironmentSnapshot(input: {
  snapshotId?: string;
  sequence?: number;
  status?: "interactive" | "visible_unsupported" | "settling" | "observed";
  interactionKind?: string;
  stage?: string;
  context?: JsonObject;
  surface?: JsonObject;
  actions?: Array<{ id: string; verb: string; label: string }>;
} = {}): JsonObject {
  const snapshotId = input.snapshotId ?? "snapshot-1";
  const interactionKind = input.interactionKind ?? "combat_turn";
  const context = input.context ?? combatContext();
  const surface = input.surface ?? {
    kind: interactionKind,
    room_entity_id: "combat-room",
    can_end_turn: true
  };
  const actions = input.actions ?? [{ id: "end-turn", verb: "end_turn", label: "End turn" }];
  return {
    protocol_version: "1.0-rc.2",
    schema: "sts2.player-environment/snapshot-1",
    snapshot_id: snapshotId,
    sequence: input.sequence ?? 1,
    observed_at: "2026-08-12T00:00:00Z",
    status: input.status ?? (actions.length > 0 ? "interactive" : "observed"),
    persistent: {
      content_schema: "sts2.player-environment/persistent/run-player-1",
      content: persistentState()
    },
    interaction: {
      interaction_id: `interaction-${interactionKind}`,
      kind: interactionKind,
      stage: input.stage ?? "ready",
      content_schema: `sts2.player-environment/surface/${interactionKind}-1`,
      content: { surface, context },
      capabilities: actions.map((action) => ({
        verb: action.verb,
        subject_role: null,
        arguments: [],
        availability_basis: "current_native_interaction"
      }))
    },
    referents: [],
    bound_actions: {
      schema: "sts2.player-environment/bound-actions-1",
      status: "complete",
      materialized_count: actions.length,
      total_count: actions.length,
      limit: 512,
      ordering_semantics: "fixture",
      actions: actions.map((action) => ({
        bound_action_id: action.id,
        verb: action.verb,
        interaction_id: `interaction-${interactionKind}`,
        subject_referent_id: null,
        arguments: [],
        label: action.label
      }))
    },
    reads: [],
    completeness: {
      status: "complete",
      visible_information: "fixture_player_visible_information",
      interaction_discovery: "fixture_current_native_interaction",
      missing: [],
      hidden_by_policy: []
    },
    session: {
      runtime_instance_id: "fixture-runtime",
      environment_fingerprint: "fixture-environment"
    },
    information_policy: {
      id: "player_visible",
      scope: "player_environment",
      includes_hidden_information: false,
      unknown_field_behavior: "fail_closed"
    }
  };
}

export function wrapSnapshot(snapshot: JsonObject = playerEnvironmentSnapshot()) {
  return wrapPlayerEnvironmentState({ snapshot });
}

/** Historical fixture access remains only for append-only replay tests. */
export async function historicalFixture(name: string): Promise<unknown> {
  const url = new URL(`./fixtures/mcp-raw/${name}.json`, import.meta.url);
  return JSON.parse(await readFile(fileURLToPath(url), "utf8")) as unknown;
}

function persistentState(): JsonObject {
  return {
    scope: "active_single_player_run",
    run: {
      act: 1,
      act_definition_id: "ACT_1",
      act_name: "Act 1",
      floor: 1,
      ascension: 0,
      bosses: [],
      modifiers: []
    },
    player: {
      entity_id: "player-1",
      character_definition_id: "IRONCLAD",
      character_name: "The Ironclad",
      hp: 70,
      max_hp: 80,
      gold: 99,
      relics: [],
      potions: [],
      max_potion_slots: 3
    },
    completeness: {
      player_visible_semantics: "fixture",
      sources: ["fixture"],
      missing: []
    }
  };
}

function combatContext(): JsonObject {
  return {
    kind: "combat",
    encounter_type: "normal",
    round: 1,
    turn_owner: "player",
    is_play_phase: true,
    player: {
      player_entity_id: "player-1",
      block: 0,
      energy: 3,
      max_energy: 3,
      stars: null,
      hand: [],
      draw_pile_count: 5,
      discard_pile_count: 0,
      exhaust_pile_count: 0,
      statuses: [],
      companions: [],
      potion_states: [],
      orbs: [],
      orb_slots: 0
    },
    enemies: []
  };
}
