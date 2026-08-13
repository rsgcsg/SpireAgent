import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  agentRunPreflightErrors,
  configurePlayerEnvironmentEvidenceProfile,
  evaluateBuildProvenance,
  evaluateEnvironmentReadiness,
  evaluateLoadedArtifact,
  playerEnvironmentSourceIdentity,
  inspectModInstallation,
  inspectAgentLocalConfig,
  isTransientAgentSnapshot,
  loadAgentGameDirFromLocalEnv,
  processListHasGame,
  recommendDoctorSteps,
  resolveExecutable,
  resolveGameDir,
  resolveModsDir,
  sourceProtocols,
  windowsTaskListHasGame,
  workspaceSourceIdentity
} from "./connector.mjs";
import { auditRunIdentity } from "./connector-run-identity-audit.mjs";

assert.equal(typeof auditRunIdentity, "function");
const sourceIdentity = workspaceSourceIdentity();
assert.match(sourceIdentity.revision, /^[0-9a-f]{40}$/u);
assert.match(sourceIdentity.sourceDigest, /^[0-9a-f]{64}$/u);
assert.ok(["clean", "dirty"].includes(sourceIdentity.worktreeStatus));
const environmentIdentity = playerEnvironmentSourceIdentity();
assert.match(environmentIdentity.revision, /^[0-9a-f]{40}$/u);
assert.match(environmentIdentity.sourceDigest, /^[0-9a-f]{64}$/u);
assert.ok(environmentIdentity.fileCount > 0);
assert.deepEqual(sourceProtocols(), {
  csharp: "1.0-rc.2",
  re: "1.0-rc.2"
});

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
  assert.deepEqual(inspectAgentLocalConfig(envFile), {
    exists: true,
    retired_keys: []
  });
  const localEnv = {};
  assert.equal(loadAgentGameDirFromLocalEnv(localEnv, envFile), true);
  assert.equal(localEnv.STS2_GAME_DIR, "C:\\Games\\Slay the Spire 2");
  assert.equal(localEnv.DEEPSEEK_API_KEY, undefined);

  const explicitEnv = { STS2_GAME_DIR: "D:\\Explicit" };
  assert.equal(loadAgentGameDirFromLocalEnv(explicitEnv, envFile), false);
  assert.equal(explicitEnv.STS2_GAME_DIR, "D:\\Explicit");

  writeFileSync(envFile, "DEEPSEEK_API_KEY=not-loaded\nSPIREAGENT_HE_MODE=he_pure\nSTS2_MCP_PROTOCOL=he\n");
  assert.deepEqual(inspectAgentLocalConfig(envFile), {
    exists: true,
    retired_keys: ["SPIREAGENT_HE_MODE", "STS2_MCP_PROTOCOL"]
  });
} finally {
  rmSync(fixtureEnvDir, { recursive: true, force: true });
}

const evidenceProfileDir = mkdtempSync(path.join(os.tmpdir(), "spireagent-evidence-profile-"));
try {
  const configPath = path.join(evidenceProfileDir, "STS2_MCP.conf");
  writeFileSync(configPath, JSON.stringify({
    port: 15526,
    permission_mode: "migration_exploration",
    qualification_store: "fixture-ledger.json"
  }));
  const configured = configurePlayerEnvironmentEvidenceProfile(configPath, true);
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.player_environment_native_page_evidence_enabled, true);
  assert.equal(config.permission_mode, undefined);
  assert.equal(config.qualification_store, undefined);
  assert.equal(configured.requires_cold_load, true);
  assert.equal(configured.creates_action_authority, false);
  configurePlayerEnvironmentEvidenceProfile(configPath, false);
  assert.equal(
    JSON.parse(readFileSync(configPath, "utf8")).player_environment_native_page_evidence_enabled,
    false
  );
  assert.throws(
    () => configurePlayerEnvironmentEvidenceProfile(configPath, "true"),
    /requires --enabled true or --enabled false/u
  );
} finally {
  rmSync(evidenceProfileDir, { recursive: true, force: true });
}

assert.deepEqual(agentRunPreflightErrors({
  errors: [],
  observation_ready: true,
  mutation_ready: false,
  modset_status: "exact_player_environment_only",
  mod_installation: { duplicate_installation_blocker: false }
}), []);
assert.deepEqual(agentRunPreflightErrors({
  errors: [],
  observation_ready: false,
  mutation_ready: false,
  modset_status: "exact_player_environment_only",
  mod_installation: { duplicate_installation_blocker: false }
}, { requireObservation: false }), []);
assert.deepEqual(agentRunPreflightErrors({
  errors: ["installed_loaded_mvid_mismatch"],
  observation_ready: false,
  mutation_ready: false,
  modset_status: "hazardous_mod_state_detected",
  mod_installation: { duplicate_installation_blocker: true }
}, { requireMutation: true }), [
  "installed_loaded_mvid_mismatch",
  "duplicate_host_manifests_detected",
  "player_snapshot_disabled",
  "player_input_delivery_disabled"
]);
assert.equal(isTransientAgentSnapshot({
  status: "settling",
  surface: { kind: "no_action" }
}), true);
assert.equal(isTransientAgentSnapshot({
  status: "visible_unsupported",
  surface: { kind: "unknown_visible_panel" }
}), false);
assert.equal(isTransientAgentSnapshot({
  status: "interactive",
  surface: { kind: "main_menu" },
  bound_actions: { status: "complete", actions: [{}] }
}), false);

const playerEnvironmentReady = evaluateEnvironmentReadiness({
  protocol_version: "1.0-rc.2",
  execution_available: true,
  game: {
    compatibility: { observation_allowed: true },
    modset: { status: "additional_mods_loaded" }
  }
}, "1.0-rc.2");
assert.equal(playerEnvironmentReady.environment_ready, true);
assert.equal(playerEnvironmentReady.mutation_ready, true);
const playerEnvironmentOffline = evaluateEnvironmentReadiness(null, "1.0-rc.2");
assert.deepEqual(playerEnvironmentOffline.blockers, [
  "host_unreachable",
  "player_snapshot_disabled",
  "player_input_delivery_disabled"
]);
assert.deepEqual(agentRunPreflightErrors({
  ...playerEnvironmentReady,
  loaded_protocol: "1.0-rc.2",
  errors: [],
  mod_installation: { duplicate_installation_blocker: false }
}, { requireMutation: true }), []);

const mismatch = evaluateLoadedArtifact({
  csharpProtocol: "1.0-preview.6",
  reProtocol: "1.0-preview.5",
  builtSha: "a".repeat(64),
  installedSha: "b".repeat(64),
  builtMvid: "mvid-a",
  installedMvid: "mvid-b",
  builtSourceRevision: "a".repeat(40),
  capabilities: {
    protocol_version: "1.0-preview.5",
    host: {
      implementation: {
        source_revision: "b".repeat(40),
        artifact_sha256: "c".repeat(64),
        module_version_id: "mvid-c"
      }
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
  "source_loaded_protocol_mismatch",
  "built_loaded_source_revision_mismatch"
]);

const buildMetadata = {
  source_revision: "a".repeat(40),
  player_environment_source_digest: "source-digest",
  source_protocol: "3.0-preview.fixture",
  artifact_sha256: "a".repeat(64),
  artifact_mvid: "mvid-a"
};
assert.deepEqual(evaluateBuildProvenance({
  currentSource: { revision: "a".repeat(40), sourceDigest: "source-digest" },
  sourceProtocol: "3.0-preview.fixture",
  builtSha: "a".repeat(64),
  builtMvid: "mvid-a",
  buildMetadata,
  installedSha: "a".repeat(64),
  installedMvid: "mvid-a",
  installedMetadata: buildMetadata
}), { ok: true, errors: [] });
assert.deepEqual(evaluateBuildProvenance({
  currentSource: { revision: "b".repeat(40), sourceDigest: "new-source" },
  sourceProtocol: "3.0-preview.next",
  builtSha: "b".repeat(64),
  builtMvid: "mvid-b",
  buildMetadata,
  installedSha: "a".repeat(64),
  installedMvid: "mvid-a",
  installedMetadata: buildMetadata
}).errors, [
  "source_build_revision_mismatch",
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
    mod_installation: { duplicate_installation_blocker: false }
  }
}), [
  "Fully close STS2, then run npm run deploy from the repository root.",
  "After a verified deploy, cold-restart STS2 so the installed Player Environment Host is actually loaded."
]);
assert.deepEqual(recommendDoctorSteps({
  prerequisites: doctorPrerequisites,
  gameDirExists: true,
  agentDependenciesInstalled: true,
  agentLocalConfig: {
    exists: true,
    retired_keys: ["SPIREAGENT_HE_MODE", "STS2_MCP_PROTOCOL"]
  },
  status: {
    ok: true,
    errors: [],
    environment_ready: true,
    mutation_ready: true,
    mod_installation: { duplicate_installation_blocker: false }
  }
}), [
  "Remove retired Re-SpireAgent/.env.local settings: SPIREAGENT_HE_MODE, STS2_MCP_PROTOCOL."
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
    mod_installation: { duplicate_installation_blocker: false }
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
    blockers: ["player_snapshot_disabled"],
    mod_installation: { duplicate_installation_blocker: false }
  }
}), ["Resolve loaded environment blockers: player_snapshot_disabled."]);

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
  assert.equal(installation.status, "duplicate_host_manifests_detected");
  assert.equal(installation.duplicate_installation_blocker, true);
  assert.deepEqual(
    installation.duplicate_manifests.map((manifest) => manifest.relative_path),
    [path.join("backups", "old", "STS2_MCP.json")]
  );
} finally {
  rmSync(fixtureMods, { recursive: true, force: true });
}

console.log("connector CLI checks passed");
