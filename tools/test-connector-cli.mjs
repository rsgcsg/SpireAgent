import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  agentRunPreflightErrors,
  defaultMigrationCycleArgs,
  evaluateBuildProvenance,
  evaluateEnvironmentReadiness,
  evaluateLoadedArtifact,
  gatewaySourceIdentity,
  inspectModInstallation,
  isTransientAgentObservation,
  loadAgentGameDirFromLocalEnv,
  migrationCycleDelegateArgs,
  processListHasGame,
  recommendDoctorSteps,
  resolveExecutable,
  resolveGameDir,
  resolveModsDir,
  selectAgentAuthorityPath,
  windowsTaskListHasGame,
  workspaceSourceIdentity
} from "./connector.mjs";
import { auditRunIdentity } from "./connector-run-identity-audit.mjs";

assert.equal(typeof auditRunIdentity, "function");
const sourceIdentity = workspaceSourceIdentity();
assert.match(sourceIdentity.revision, /^[0-9a-f]{40}$/u);
assert.match(sourceIdentity.sourceDigest, /^[0-9a-f]{64}$/u);
assert.ok(["clean", "dirty"].includes(sourceIdentity.worktreeStatus));
const gatewayIdentity = gatewaySourceIdentity();
assert.match(gatewayIdentity.revision, /^[0-9a-f]{40}$/u);
assert.match(gatewayIdentity.sourceDigest, /^[0-9a-f]{64}$/u);
assert.ok(gatewayIdentity.fileCount > 0);

assert.equal(
  resolveGameDir({ STS2_GAME_DIR: "./fixture-game" }, "linux", "/home/test"),
  path.resolve("./fixture-game")
);
assert.equal(
  resolveModsDir("/game", "darwin"),
  "/game/SlayTheSpire2.app/Contents/MacOS/mods"
);
assert.equal(
  resolveModsDir("C:\\game", "win32"),
  path.win32.join("C:\\game", "mods")
);
assert.equal(processListHasGame(`
  100 /Users/fire/Library/Application Support/Steam/steamapps/common/Slay the Spire 2/SlayTheSpire2.app/Contents/MacOS/Slay the Spire 2
`), true);
assert.equal(processListHasGame(`
  101 /game/SlayTheSpire2
`), true);
assert.equal(processListHasGame(`
  102 npm run connector -- install --game-dir /Users/fire/Library/Application Support/Steam/steamapps/common/Slay the Spire 2
`), false);
assert.equal(windowsTaskListHasGame(
  '"SlayTheSpire2.exe","4242","Console","1","1,024 K"'
), true);
assert.equal(windowsTaskListHasGame(
  "INFO: No tasks are running which match the specified criteria."
), false);
assert.equal(resolveExecutable("npm", "win32"), "npm.cmd");
assert.equal(resolveExecutable("npm", "darwin"), "npm");
assert.equal(resolveExecutable("dotnet", "win32"), "dotnet");

const fixtureEnvDir = mkdtempSync(path.join(os.tmpdir(), "spireagent-connector-env-"));
try {
  const envFile = path.join(fixtureEnvDir, ".env.local");
  writeFileSync(envFile, "DEEPSEEK_API_KEY=not-loaded\nSTS2_GAME_DIR=C:\\Games\\Slay the Spire 2\n");
  const localEnv = {};
  assert.equal(loadAgentGameDirFromLocalEnv(localEnv, envFile), true);
  assert.equal(localEnv.STS2_GAME_DIR, "C:\\Games\\Slay the Spire 2");
  assert.equal(localEnv.DEEPSEEK_API_KEY, undefined);

  const explicitEnv = { STS2_GAME_DIR: "D:\\Explicit" };
  assert.equal(loadAgentGameDirFromLocalEnv(explicitEnv, envFile), false);
  assert.equal(explicitEnv.STS2_GAME_DIR, "D:\\Explicit");
} finally {
  rmSync(fixtureEnvDir, { recursive: true, force: true });
}

const migrationArgs = defaultMigrationCycleArgs({
  gameDir: "/fixture-game",
  endpoint: "http://127.0.0.1:19999"
});
assert.deepEqual(migrationArgs.slice(0, 2), ["--endpoint", "http://127.0.0.1:19999"]);
assert.equal(migrationArgs.at(-1), "true");
assert.ok(migrationArgs.includes(path.join(
  resolveModsDir(path.resolve("/fixture-game")),
  "STS2_MCP.qualifications.json"
)));
const delegatedMigrationArgs = migrationCycleDelegateArgs({
  gameDir: "/fixture-game",
  endpoint: "http://127.0.0.1:19999",
  passthrough: ["--apply", "false"]
});
assert.ok(delegatedMigrationArgs.includes("--registry"));
assert.deepEqual(delegatedMigrationArgs.slice(-2), ["--apply", "false"]);

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
  csharpProtocol: "2.0-preview.71",
  reProtocol: "2.0-preview.71",
  builtSha: "a".repeat(64),
  installedSha: "a".repeat(64),
  builtMvid: "mvid",
  installedMvid: "mvid",
  capabilities: {
    protocol_version: "2.0-preview.71",
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
assert.equal(isTransientAgentObservation({
  context: { kind: "unknown", source_type: "no_active_run_context" },
  interaction: { execution_support: "unsupported", command_candidates: [] }
}), true);
assert.equal(isTransientAgentObservation({
  context: { kind: "event", source_type: "unmapped_visible_event" },
  interaction: { execution_support: "unsupported", command_candidates: [] }
}), false);
assert.equal(isTransientAgentObservation({
  context: { kind: "menu", source_type: "main_menu" },
  interaction: { execution_support: "trial", command_candidates: [{}] }
}), false);

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

const buildMetadata = {
  gateway_source_digest: "source-digest",
  source_protocol: "3.0-preview.fixture",
  artifact_sha256: "a".repeat(64),
  artifact_mvid: "mvid-a"
};
assert.deepEqual(evaluateBuildProvenance({
  currentSource: { sourceDigest: "source-digest" },
  sourceProtocol: "3.0-preview.fixture",
  builtSha: "a".repeat(64),
  builtMvid: "mvid-a",
  buildMetadata,
  installedSha: "a".repeat(64),
  installedMvid: "mvid-a",
  installedMetadata: buildMetadata
}), { ok: true, errors: [] });
assert.deepEqual(evaluateBuildProvenance({
  currentSource: { sourceDigest: "new-source" },
  sourceProtocol: "3.0-preview.next",
  builtSha: "b".repeat(64),
  builtMvid: "mvid-b",
  buildMetadata,
  installedSha: "a".repeat(64),
  installedMvid: "mvid-a",
  installedMetadata: buildMetadata
}).errors, [
  "source_build_digest_mismatch",
  "source_build_protocol_mismatch",
  "build_provenance_sha_mismatch",
  "build_provenance_mvid_mismatch"
]);

const doctorPrerequisites = {
  node: { required: true, available: true },
  npm: { required: true, available: true },
  dotnet: { required: true, available: true },
  git: { required: true, available: true },
  python: { required: false, available: false }
};
assert.deepEqual(recommendDoctorSteps({
  prerequisites: doctorPrerequisites,
  gameDirExists: true,
  agentDependenciesInstalled: true,
  status: {
    ok: false,
    errors: ["source_build_digest_mismatch", "source_loaded_protocol_mismatch"],
    mod_installation: { exact_permission_blocker: false }
  }
}), [
  "Fully close STS2, then run npm run deploy from the repository root.",
  "After a verified deploy, cold-restart STS2 so the installed Gateway is actually loaded."
]);
assert.deepEqual(recommendDoctorSteps({
  prerequisites: doctorPrerequisites,
  gameDirExists: true,
  agentDependenciesInstalled: true,
  status: {
    ok: true,
    errors: [],
    environment_ready: true,
    mutation_ready: true,
    provisional_trial_ready: false,
    mod_installation: { exact_permission_blocker: false }
  }
}), ["Run cd Re-SpireAgent && npm run agent:run."]);
assert.deepEqual(recommendDoctorSteps({
  prerequisites: doctorPrerequisites,
  gameDirExists: true,
  agentDependenciesInstalled: true,
  status: {
    ok: true,
    errors: [],
    environment_ready: false,
    mutation_ready: false,
    provisional_trial_ready: false,
    blockers: ["normal_observation_disabled"],
    mod_installation: { exact_permission_blocker: false }
  }
}), ["Resolve loaded environment blockers: normal_observation_disabled."]);

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
