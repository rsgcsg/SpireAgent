import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  agentRunPreflightErrors,
  defaultMigrationCycleArgs,
  evaluateEnvironmentReadiness,
  evaluateLoadedArtifact,
  inspectModInstallation,
  resolveGameDir,
  resolveModsDir,
  selectAgentAuthorityPath
} from "./connector.mjs";
import { auditRunIdentity } from "./connector-run-identity-audit.mjs";

assert.equal(typeof auditRunIdentity, "function");

assert.equal(
  resolveGameDir({ STS2_GAME_DIR: "./fixture-game" }, "linux", "/home/test"),
  path.resolve("./fixture-game")
);
assert.equal(
  resolveModsDir("/game", "darwin"),
  "/game/SlayTheSpire2.app/Contents/MacOS/mods"
);
assert.equal(resolveModsDir("C:\\game", "win32"), path.join("C:\\game", "mods"));

const migrationArgs = defaultMigrationCycleArgs({
  gameDir: "/fixture-game",
  endpoint: "http://127.0.0.1:19999"
});
assert.deepEqual(migrationArgs.slice(0, 2), ["--endpoint", "http://127.0.0.1:19999"]);
assert.equal(migrationArgs.at(-1), "true");
assert.ok(migrationArgs.includes(path.join(
  resolveModsDir("/fixture-game"),
  "STS2_MCP.qualifications.json"
)));

assert.deepEqual(agentRunPreflightErrors({
  errors: [],
  observation_ready: true,
  mutation_ready: false,
  modset_status: "exact_bridge_only",
  mod_installation: { exact_permission_blocker: false }
}), []);
assert.deepEqual(agentRunPreflightErrors({
  errors: [],
  observation_ready: false,
  mutation_ready: false,
  modset_status: "exact_bridge_only",
  mod_installation: { exact_permission_blocker: false }
}, { requireObservation: false }), []);
assert.deepEqual(agentRunPreflightErrors({
  errors: ["installed_loaded_mvid_mismatch"],
  observation_ready: false,
  mutation_ready: false,
  modset_status: "hazardous_mod_state_detected",
  mod_installation: { exact_permission_blocker: true }
}, { requireMutation: true }), [
  "installed_loaded_mvid_mismatch",
  "duplicate_gateway_manifests_detected",
  "bounded_modset_permission_required",
  "normal_observation_disabled",
  "mutation_and_provisional_trial_disabled"
]);

const clean = evaluateLoadedArtifact({
  csharpProtocol: "2.0-preview.70",
  reProtocol: "2.0-preview.70",
  builtSha: "a".repeat(64),
  installedSha: "a".repeat(64),
  builtMvid: "mvid",
  installedMvid: "mvid",
  capabilities: {
    protocol_version: "2.0-preview.70",
    bridge: {
      assembly_file_sha256: "a".repeat(64),
      module_version_id: "mvid",
      runtime_instance_id: "runtime"
    },
    game: { version: "fixture" }
  }
});
assert.equal(clean.ok, true);
assert.equal(clean.artifact_identity_ok, true);

const provisional = evaluateEnvironmentReadiness({
  permission_system: { mode: "migration_exploration" },
  game: {
    compatibility: {
      status: "unreviewed_diagnostic_candidate",
      adaptation_level: "diagnostic_candidate",
      state_observation_allowed: true,
      inspection_allowed: false,
      action_execution_allowed: false
    },
    modset: {
      status: "additional_mods_loaded",
      exact_permission_eligible: false,
      qualification_candidate_eligible: true,
      persistent_qualification_eligible: false
    }
  }
});
assert.equal(provisional.provisional_trial_ready, true);
assert.deepEqual(agentRunPreflightErrors({
  ...provisional,
  errors: [],
  mod_installation: { exact_permission_blocker: false }
}, { requireMutation: true }), []);
assert.equal(
  selectAgentAuthorityPath(provisional),
  "encounter_provisional_ready_on_first_actionable_surface"
);
assert.equal(
  selectAgentAuthorityPath({ observation_ready: true, mutation_ready: true }),
  "encounter_provisional_or_existing_authority"
);
assert.equal(
  selectAgentAuthorityPath({ observation_ready: false, mutation_ready: false }),
  "legacy_migration_required"
);

const mismatch = evaluateLoadedArtifact({
  csharpProtocol: "2.0-preview.68",
  reProtocol: "2.0-preview.66",
  builtSha: "a".repeat(64),
  installedSha: "b".repeat(64),
  builtMvid: "mvid-a",
  installedMvid: "mvid-b",
  capabilities: {
    protocol_version: "2.0-preview.66",
    bridge: {
      assembly_file_sha256: "c".repeat(64),
      module_version_id: "mvid-c"
    }
  }
});
assert.equal(mismatch.ok, false);
assert.deepEqual(mismatch.errors, [
  "source_protocol_mismatch",
  "built_installed_sha_mismatch",
  "built_installed_mvid_mismatch",
  "installed_loaded_sha_mismatch",
  "installed_loaded_mvid_mismatch",
  "source_loaded_protocol_mismatch"
]);

const hazardous = evaluateEnvironmentReadiness({
  game: {
    compatibility: {
      status: "untested",
      adaptation_level: "diagnostic_only",
      state_observation_allowed: false,
      inspection_allowed: false,
      action_execution_allowed: false
    },
    modset: { status: "hazardous_mod_state_detected" }
  }
});
assert.equal(hazardous.environment_ready, false);
assert.deepEqual(hazardous.blockers, [
  "hazardous_mod_state_detected",
  "normal_observation_disabled",
  "inspection_disabled",
  "mutation_disabled"
]);

const fixtureMods = mkdtempSync(path.join(os.tmpdir(), "spireagent-connector-cli-"));
try {
  writeFileSync(path.join(fixtureMods, "STS2_MCP.json"), JSON.stringify({
    id: "STS2_MCP",
    version: "fixture"
  }));
  const backupDir = path.join(fixtureMods, "backups", "old");
  mkdirSync(backupDir, { recursive: true });
  writeFileSync(path.join(backupDir, "STS2_MCP.json"), JSON.stringify({
    id: "STS2_MCP",
    version: "old"
  }));
  writeFileSync(path.join(backupDir, "not-a-manifest.json"), "{}");
  const installation = inspectModInstallation(fixtureMods);
  assert.equal(installation.status, "duplicate_gateway_manifests_detected");
  assert.equal(installation.exact_permission_blocker, true);
  assert.deepEqual(
    installation.duplicate_manifests.map((manifest) => manifest.relative_path),
    [path.join("backups", "old", "STS2_MCP.json")]
  );
} finally {
  rmSync(fixtureMods, { recursive: true, force: true });
}

console.log("connector CLI checks passed");
