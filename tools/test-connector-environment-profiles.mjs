import assert from "node:assert/strict";

import {
  buildEnvironmentProfileIdentity,
  buildMigrationPlan,
  createEmptyProfileRegistry,
  environmentProfileId,
  syncEnvironmentProfile,
  validateProfileRegistry
} from "./connector-environment-profiles.mjs";

function capabilities(overrides = {}) {
  const value = {
    protocol_version: "2.0-preview.66",
    bridge: {
      assembly_file_sha256: "a".repeat(64),
      module_version_id: "11111111-1111-1111-1111-111111111111"
    },
    game: {
      version: "v0.109.1",
      commit: "c8c577f6",
      main_assembly_hash: -820620422,
      release_declared_main_assembly_hash: -820620422,
      modset: { fingerprint: "b".repeat(64) },
      compatibility: {
        compatibility_policy_digest: "c".repeat(64)
      }
    },
    permission_system: {
      policy_digest: "d".repeat(64),
      patch_inventory: { digest: "e".repeat(64) }
    },
    qualification_system: {
      current_environment_digest: "f".repeat(64),
      operation_catalog_digest: "1".repeat(64),
      operation_contracts: [
        {
          surface_kind: "main_menu",
          operation: "open_singleplayer",
          risk_class: "reversible_navigation"
        },
        {
          surface_kind: "map_navigation",
          operation: "choose_map_node",
          risk_class: "progression"
        },
        {
          surface_kind: "deck_enchant_selection",
          operation: "confirm_selection",
          risk_class: "persistent_run_mutation"
        },
        {
          surface_kind: "event_option",
          operation: "choose_event_option",
          risk_class: "persistent_run_mutation",
          witness_id: "gateway_reported_operation_witness"
        }
      ],
      qualifications: []
    }
  };
  return {
    ...value,
    ...overrides,
    qualification_system: {
      ...value.qualification_system,
      ...overrides.qualification_system
    }
  };
}

const policy = {
  schema_version: 2,
  authorization_effect: "none",
  rules: [
    {
      risk_class: "reversible_navigation",
      eligible_modes: ["migration_exploration"]
    },
    {
      risk_class: "progression",
      eligible_modes: ["migration_exploration"]
    },
    {
      risk_class: "persistent_run_mutation",
      eligible_modes: ["migration_exploration"]
    }
  ]
};

{
  const current = capabilities();
  const identity = buildEnvironmentProfileIdentity(current);
  const id = environmentProfileId(identity);
  assert.match(id, /^env-[a-f0-9]{24}$/u);
  assert.equal(Object.hasOwn(identity, "game_dir"), false);
  assert.equal(Object.hasOwn(identity, "runtime_epoch"), false);

  const first = syncEnvironmentProfile(
    createEmptyProfileRegistry("fixture"),
    current,
    new Date("2026-07-26T00:00:00.000Z")
  );
  assert.equal(first.selected_profile.profile_id, id);
  assert.equal(first.selected_profile.status, "migration_exploration");
  const second = syncEnvironmentProfile(
    first.registry,
    current,
    new Date("2026-07-26T01:00:00.000Z")
  );
  assert.equal(second.registry.profiles.length, 1);
  assert.equal(second.selected_profile.observation_count, 2);
  assert.deepEqual(validateProfileRegistry(second.registry), []);
}

{
  const original = capabilities();
  const drifted = capabilities({
    bridge: {
      assembly_file_sha256: "9".repeat(64),
      module_version_id: "22222222-2222-2222-2222-222222222222"
    }
  });
  let registry = createEmptyProfileRegistry("fixture");
  registry = syncEnvironmentProfile(registry, original).registry;
  registry = syncEnvironmentProfile(registry, drifted).registry;
  assert.equal(registry.profiles.length, 2);
  assert.notEqual(
    registry.profiles[0].profile_id,
    registry.profiles[1].profile_id
  );
}

{
  const current = capabilities({
    qualification_system: {
      qualifications: [
        {
          qualification_id: "qualified-open",
          authority_tier: "qualified",
          surface_kind: "main_menu",
          operation: "open_singleplayer",
          status: "active",
          applicable_to_current_environment: true
        },
        {
          qualification_id: "candidate-map",
          authority_tier: "session_canary",
          surface_kind: "map_navigation",
          operation: "choose_map_node",
          status: "active",
          applicable_to_current_environment: true
        }
      ]
    }
  });
  const bindingAudit = {
    authorization_effect: "none",
    qualification_effect: "none",
    release: {
      version: "v0.109.1",
      commit: "c8c577f6",
      main_assembly_hash: -820620422
    },
    operations: [
      {
        surface_kind: "deck_enchant_selection",
        operation: "confirm_selection",
        status: "reviewed_binding_match"
      }
    ]
  };
  const plan = buildMigrationPlan({
    capabilities: current,
    bindingAudit,
    migrationPolicy: policy
  });
  assert.equal(plan.summary.direct_confirm_exact_profile, 1);
  assert.equal(plan.summary.collect_migration_evidence, 1);
  assert.equal(plan.summary.test_confirm, 2);
  assert.equal(
    plan.routes.find(
      (entry) => entry.surface_kind === "event_option"
        && entry.operation === "choose_event_option"
    )?.reason,
    "manifest_fallback_requires_live_publication_commit_and_witness"
  );
  assert.equal(plan.authorization_effect, "none");
}

console.log("connector environment profile checks passed");
