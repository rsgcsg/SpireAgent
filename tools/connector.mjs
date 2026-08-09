#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import {
  evaluateBuildProvenance,
  gatewaySourceIdentity as readGatewaySourceIdentity,
  readOptionalJson
} from "./connector-provenance.mjs";

export { evaluateBuildProvenance } from "./connector-provenance.mjs";

const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ENDPOINT = "http://127.0.0.1:15526";
const DEFAULT_GATEWAY_WAIT_MS = 60_000;
const DEFAULT_GATEWAY_POLL_MS = 500;
const RE_LOCAL_ENV = path.join(WORKSPACE, "Re-SpireAgent", ".env.local");

export function loadAgentGameDirFromLocalEnv(env = process.env, envFile = RE_LOCAL_ENV) {
  if (env.STS2_GAME_DIR || !existsSync(envFile)) return false;
  for (const rawLine of readFileSync(envFile, "utf8").replace(/^\uFEFF/u, "").split(/\r?\n/u)) {
    const match = rawLine.match(/^\s*(?:export\s+)?STS2_GAME_DIR\s*=\s*(.*)$/u);
    if (!match) continue;
    let value = match[1].trim();
    if ((value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/u, "").trim();
    }
    if (!value) return false;
    env.STS2_GAME_DIR = value;
    return true;
  }
  return false;
}

export function resolveGameDir(env = process.env, platform = process.platform, home = os.homedir()) {
  if (env.STS2_GAME_DIR) return path.resolve(env.STS2_GAME_DIR);
  if (platform === "darwin") {
    return path.join(home, "Library/Application Support/Steam/steamapps/common/Slay the Spire 2");
  }
  if (platform === "linux") {
    return path.join(home, ".steam/steam/steamapps/common/Slay the Spire 2");
  }
  throw new Error("Set STS2_GAME_DIR on this platform.");
}

export function resolveModsDir(gameDir, platform = process.platform) {
  if (platform === "win32") return path.win32.join(gameDir, "mods");
  return platform === "darwin"
    ? path.posix.join(gameDir, "SlayTheSpire2.app/Contents/MacOS/mods")
    : path.posix.join(gameDir, "mods");
}

export function sha256File(file) {
  if (!existsSync(file)) return null;
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

export function evaluateLoadedArtifact({
  csharpProtocol,
  reProtocol,
  builtSha,
  installedSha,
  builtMvid = null,
  installedMvid = null,
  capabilities
}) {
  const errors = [];
  const loadedSha = capabilities?.bridge?.assembly_file_sha256 ?? null;
  const loadedProtocol = capabilities?.protocol_version ?? null;
  if (csharpProtocol !== reProtocol) errors.push("source_protocol_mismatch");
  if (!builtSha) errors.push("release_artifact_missing");
  if (!installedSha) errors.push("installed_artifact_missing");
  if (!capabilities) errors.push("gateway_not_loaded_or_unreachable");
  if (builtSha && installedSha && builtSha !== installedSha) errors.push("built_installed_sha_mismatch");
  if (builtMvid && installedMvid && builtMvid !== installedMvid) errors.push("built_installed_mvid_mismatch");
  if (installedSha && loadedSha && installedSha !== loadedSha) errors.push("installed_loaded_sha_mismatch");
  if (installedMvid && capabilities?.bridge?.module_version_id
      && installedMvid !== capabilities.bridge.module_version_id) {
    errors.push("installed_loaded_mvid_mismatch");
  }
  if (loadedProtocol && loadedProtocol !== csharpProtocol) errors.push("source_loaded_protocol_mismatch");
  return {
    ok: errors.length === 0,
    artifact_identity_ok: errors.length === 0,
    errors,
    source_protocol: csharpProtocol,
    re_protocol: reProtocol,
    built_sha256: builtSha,
    installed_sha256: installedSha,
    built_mvid: builtMvid,
    installed_mvid: installedMvid,
    loaded_sha256: loadedSha,
    loaded_protocol: loadedProtocol,
    loaded_mvid: capabilities?.bridge?.module_version_id ?? null,
    runtime_instance_id: capabilities?.bridge?.runtime_instance_id ?? null,
    game: capabilities?.game
      ? {
          version: capabilities.game.version ?? null,
          commit: capabilities.game.commit ?? null,
          branch: capabilities.game.branch ?? null,
          main_assembly_hash: capabilities.game.main_assembly_hash ?? null,
          release_declared_main_assembly_hash:
            capabilities.game.release_declared_main_assembly_hash ?? null
        }
      : null
  };
}

export function evaluateEnvironmentReadiness(
  capabilities,
  expectedProtocol = capabilities?.protocol_version ?? null
) {
  const compatibility = capabilities?.game?.compatibility;
  const modset = capabilities?.game?.modset;
  if (expectedProtocol?.startsWith("1.0-preview.")) {
    const observationReady = compatibility?.state_observation_allowed === true;
    const mutationReady = capabilities?.execution_available === true;
    const blockers = [];
    if (!capabilities) blockers.push("gateway_unreachable");
    if (!observationReady) blockers.push("human_observation_disabled");
    if (!mutationReady) blockers.push("human_input_delivery_disabled");
    return {
      environment_ready: Boolean(capabilities) && observationReady,
      observation_ready: observationReady,
      inspection_ready: observationReady,
      mutation_ready: mutationReady,
      provisional_trial_ready: false,
      modset_status: modset?.status ?? null,
      exact_permission_eligible: null,
      qualification_candidate_eligible: null,
      persistent_qualification_eligible: null,
      permission_mode: null,
      compatibility_status: compatibility?.status ?? null,
      adaptation_level: "human_ui_runtime_binding",
      blockers
    };
  }
  const modsetStatus = modset?.status ?? null;
  const hazardousModset = modsetStatus === "hazardous_mod_state_detected";
  const observationReady = compatibility?.state_observation_allowed === true;
  const inspectionReady = compatibility?.inspection_allowed === true;
  const mutationReady = compatibility?.action_execution_allowed === true;
  const exactPermissionEligible = modset?.exact_permission_eligible === true
    || modsetStatus === "exact_bridge_only";
  const qualificationCandidateEligible =
    modset?.qualification_candidate_eligible === true;
  const persistentQualificationEligible =
    modset?.persistent_qualification_eligible === true;
  const permissionMode = capabilities?.permission_system?.mode ?? null;
  const boundedModsetEligible = exactPermissionEligible
    || qualificationCandidateEligible
    || persistentQualificationEligible;
  const provisionalTrialReady = observationReady
    && boundedModsetEligible
    && compatibility?.adaptation_level === "diagnostic_candidate"
    && permissionMode === "migration_exploration";
  const blockers = [];
  if (!capabilities) blockers.push("gateway_unreachable");
  if (hazardousModset) blockers.push("hazardous_mod_state_detected");
  if (!observationReady) blockers.push("normal_observation_disabled");
  if (!inspectionReady) blockers.push("inspection_disabled");
  if (!mutationReady) blockers.push("mutation_disabled");
  return {
    environment_ready: Boolean(capabilities) && !hazardousModset && observationReady,
    observation_ready: observationReady,
    inspection_ready: inspectionReady,
    mutation_ready: mutationReady,
    provisional_trial_ready: provisionalTrialReady,
    modset_status: modsetStatus,
    exact_permission_eligible: exactPermissionEligible,
    qualification_candidate_eligible: qualificationCandidateEligible,
    persistent_qualification_eligible: persistentQualificationEligible,
    permission_mode: permissionMode,
    compatibility_status: compatibility?.status ?? null,
    adaptation_level: compatibility?.adaptation_level ?? null,
    blockers
  };
}

export function inspectModInstallation(modsDir) {
  const canonicalManifest = path.join(modsDir, "STS2_MCP.json");
  const manifests = [];
  if (existsSync(modsDir)) {
    for (const file of walkFiles(modsDir)) {
      if (path.extname(file).toLowerCase() !== ".json") continue;
      try {
        const parsed = JSON.parse(readFileSync(file, "utf8"));
        if (parsed?.id !== "STS2_MCP") continue;
        manifests.push({
          path: file,
          relative_path: path.relative(modsDir, file),
          canonical: path.resolve(file) === path.resolve(canonicalManifest),
          version: typeof parsed.version === "string" ? parsed.version : null
        });
      } catch {
        // Non-manifest JSON is not an installation candidate.
      }
    }
  }
  const duplicateManifests = manifests.filter((manifest) => !manifest.canonical);
  return {
    status: duplicateManifests.length === 0
      ? "single_gateway_manifest"
      : "duplicate_gateway_manifests_detected",
    canonical_manifest: existsSync(canonicalManifest) ? canonicalManifest : null,
    manifests,
    duplicate_manifests: duplicateManifests,
    exact_permission_blocker: duplicateManifests.length > 0
  };
}

export function defaultMigrationCycleArgs(options = {}) {
  const resolved = paths(options);
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  return [
    "--endpoint", endpoint,
    "--registry", path.join(resolved.localRoot, "environment-profiles.json"),
    "--workspace", path.join(resolved.localRoot, "migration"),
    "--store", path.join(resolved.modsDir, "STS2_MCP.qualifications.json"),
    "--binding-audit", path.join(WORKSPACE, "STS2MCP/out/operation-binding-audit/latest.json"),
    "--policy", path.join(WORKSPACE, "STS2MCP/BridgeV2/Runtime/migration-permission-policy.json"),
    "--negative-evidence", path.join(WORKSPACE, "STS2MCP/compatibility/migration-negative-evidence.v1.json"),
    "--runs", path.join(WORKSPACE, "Re-SpireAgent/data/runs"),
    "--apply", "true"
  ];
}

export function migrationCycleDelegateArgs(options = {}) {
  return [
    ...defaultMigrationCycleArgs(options),
    ...(options.passthrough ?? [])
  ];
}

export function agentRunPreflightErrors(
  status,
  { requireObservation = true, requireMutation = false } = {}
) {
  const errors = [...(status?.errors ?? [])];
  if (status?.loaded_protocol?.startsWith("1.0-preview.")) {
    if (status?.mod_installation?.exact_permission_blocker === true) {
      errors.push("duplicate_gateway_manifests_detected");
    }
    if (requireObservation && status?.observation_ready !== true) {
      errors.push("human_observation_disabled");
    }
    if (requireMutation && status?.mutation_ready !== true) {
      errors.push("human_input_delivery_disabled");
    }
    return [...new Set(errors)];
  }
  if (status?.mod_installation?.exact_permission_blocker === true) {
    errors.push("duplicate_gateway_manifests_detected");
  }
  if (status?.exact_permission_eligible !== true
      && status?.qualification_candidate_eligible !== true
      && status?.persistent_qualification_eligible !== true
      && status?.modset_status !== "exact_bridge_only") {
    errors.push("bounded_modset_permission_required");
  }
  if (requireObservation && status?.observation_ready !== true) {
    errors.push("normal_observation_disabled");
  }
  if (requireMutation
      && status?.mutation_ready !== true
      && status?.provisional_trial_ready !== true) {
    errors.push("mutation_and_provisional_trial_disabled");
  }
  return [...new Set(errors)];
}

export function selectAgentAuthorityPath(status) {
  if (status?.observation_ready !== true) return "legacy_migration_required";
  if (status?.mutation_ready === true) {
    return "encounter_provisional_or_existing_authority";
  }
  if (status?.provisional_trial_ready === true) {
    return "encounter_provisional_ready_on_first_actionable_surface";
  }
  return "legacy_migration_required";
}

function sourceProtocol(file, pattern) {
  const match = readFileSync(file, "utf8").match(pattern);
  if (!match) throw new Error(`Could not read protocol from ${path.relative(WORKSPACE, file)}`);
  return match[1];
}

function paths(options = {}) {
  const gameDir = path.resolve(options.gameDir ?? resolveGameDir());
  const modsDir = resolveModsDir(gameDir);
  const localRoot = path.join(WORKSPACE, "STS2MCP/.local");
  const installationKey = createHash("sha256").update(gameDir).digest("hex").slice(0, 16);
  return {
    gameDir,
    modsDir,
    builtDll: path.join(WORKSPACE, "STS2MCP/out/STS2_MCP/STS2_MCP.dll"),
    sourceManifest: path.join(WORKSPACE, "STS2MCP/mod_manifest.json"),
    installedDll: path.join(modsDir, "STS2_MCP.dll"),
    installedManifest: path.join(modsDir, "STS2_MCP.json"),
    runtimeConfig: path.join(modsDir, "STS2_MCP.conf"),
    localRoot,
    buildIdentity: path.join(WORKSPACE, "STS2MCP/out/STS2_MCP/build-identity.json"),
    installedIdentity: path.join(localRoot, "installations", `${installationKey}.json`)
  };
}

function sourceProtocols() {
  return {
    csharp: sourceProtocol(
      path.join(WORKSPACE, "STS2MCP/HumanEquivalent/Protocol/HumanEquivalentContracts.cs"),
      /ProtocolVersion\s*=\s*"([^"]+)"/u
    ),
    re: sourceProtocol(
      path.join(WORKSPACE, "Re-SpireAgent/src/integrations/sts2mcp/humanEquivalentProtocol.ts"),
      /SUPPORTED_HUMAN_EQUIVALENT_PROTOCOL\s*=\s*"([^"]+)"/u
    )
  };
}

export function processListHasGame(processList) {
  return processList.split("\n").some((line) => {
    const command = line.replace(/^\s*\d+\s+/u, "").trim();
    return command === "Slay the Spire 2"
      || command === "SlayTheSpire2"
      || command.endsWith("/Contents/MacOS/Slay the Spire 2")
      || command.endsWith("/SlayTheSpire2");
  });
}

export function windowsTaskListHasGame(taskList) {
  return taskList.split("\n").some((line) =>
    /^"?SlayTheSpire2\.exe"?(?:,|\s|$)/iu.test(line.trim())
  );
}

function gameProcessRunning() {
  if (process.platform === "win32") {
    const result = spawnSync(
      "tasklist",
      ["/FI", "IMAGENAME eq SlayTheSpire2.exe", "/FO", "CSV", "/NH"],
      { encoding: "utf8" }
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Could not determine STS2 process state (tasklist exited ${result.status}).`);
    }
    return windowsTaskListHasGame(result.stdout);
  }
  const result = spawnSync("ps", ["-Ao", "pid=,comm="], { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Could not determine STS2 process state (ps exited ${result.status}).`);
  }
  return processListHasGame(result.stdout);
}

function run(command, args, options = {}) {
  const result = spawnPortable(command, args, {
    cwd: options.cwd ?? WORKSPACE,
    env: options.env ?? process.env,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = options.capture ? `\n${result.stderr || result.stdout}` : "";
    throw new Error(`${command} exited with ${result.status}${detail}`);
  }
  return result.stdout ?? "";
}

export function resolveExecutable(command, platform = process.platform) {
  return platform === "win32" && (command === "npm" || command === "npx")
    ? `${command}.cmd`
    : command;
}

function spawnPortable(command, args, options) {
  const npmExecPath = options.env?.npm_execpath ?? process.env.npm_execpath;
  if (process.platform === "win32"
      && command === "npm"
      && typeof npmExecPath === "string"
      && npmExecPath.length > 0) {
    return spawnSync(process.execPath, [npmExecPath, ...args], options);
  }
  const executable = resolveExecutable(command);
  return spawnSync(executable, args, {
    ...options,
    shell: process.platform === "win32" && executable.endsWith(".cmd")
  });
}

export function workspaceSourceIdentity() {
  const headResult = spawnSync("git", ["rev-parse", "--verify", "HEAD"], {
    cwd: WORKSPACE,
    encoding: "utf8",
    stdio: "pipe"
  });
  const revision = headResult.status === 0 ? headResult.stdout.trim() : "";
  if (!/^[0-9a-f]{40}$/u.test(revision)) return null;
  const sourcePaths = [
    "Re-SpireAgent/src",
    "Re-SpireAgent/package.json",
    "Re-SpireAgent/package-lock.json",
    "tools/connector.mjs",
    "package.json"
  ];
  const filesResult = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--deduplicate", "--", ...sourcePaths], {
    cwd: WORKSPACE,
    encoding: "utf8",
    stdio: "pipe"
  });
  if (filesResult.status !== 0) return null;
  const files = filesResult.stdout.split("\n").filter(Boolean).sort();
  const digest = createHash("sha256");
  for (const file of files) {
    const absolutePath = path.join(WORKSPACE, file);
    digest.update(file).update("\0");
    if (existsSync(absolutePath)) {
      digest.update(readFileSync(absolutePath));
    } else {
      digest.update("<deleted>");
    }
    digest.update("\0");
  }
  const statusResult = spawnSync("git", ["status", "--porcelain", "--", ...sourcePaths], {
    cwd: WORKSPACE,
    encoding: "utf8",
    stdio: "pipe"
  });
  if (statusResult.status !== 0) return null;
  return {
    revision,
    sourceDigest: digest.digest("hex"),
    worktreeStatus: statusResult.stdout.trim().length === 0 ? "clean" : "dirty"
  };
}

export function gatewaySourceIdentity() {
  return readGatewaySourceIdentity(WORKSPACE);
}

function writeBuildIdentity(resolved) {
  const currentSource = gatewaySourceIdentity();
  const protocols = sourceProtocols();
  const identity = artifactIdentity(resolved.builtDll);
  if (!currentSource || !identity) throw new Error("Could not establish Gateway build provenance.");
  const metadata = {
    schema_version: 1,
    built_at: new Date().toISOString(),
    source_revision: currentSource.revision,
    gateway_source_digest: currentSource.sourceDigest,
    source_worktree_status: currentSource.worktreeStatus,
    source_file_count: currentSource.fileCount,
    source_protocol: protocols.csharp,
    artifact_sha256: identity.sha256,
    artifact_mvid: identity.module_version_id
  };
  writeFileSync(resolved.buildIdentity, `${JSON.stringify(metadata, null, 2)}\n`);
  return metadata;
}

function artifactIdentity(file) {
  if (!existsSync(file)) return null;
  const output = run("dotnet", [
    "run",
    "--project", "STS2MCP/tools/STS2.ArtifactIdentity/STS2.ArtifactIdentity.csproj",
    "-c", "Release",
    "--", file
  ], { capture: true });
  return JSON.parse(output);
}

async function readJson(endpoint, route, required = false) {
  const result = await readJsonResult(endpoint, route);
  if (!result.ok && required) throw new Error(`${route} unavailable: ${result.error}`);
  return result.ok ? result.value : null;
}

async function readJsonResult(endpoint, route) {
  try {
    const response = await fetch(`${endpoint.replace(/\/$/u, "")}${route}`, {
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { ok: true, value: await response.json(), error: null };
  } catch (error) {
    return {
      ok: false,
      value: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function waitForGateway({
  endpoint = DEFAULT_ENDPOINT,
  timeoutMs = DEFAULT_GATEWAY_WAIT_MS,
  pollMs = DEFAULT_GATEWAY_POLL_MS
} = {}) {
  const startedAt = Date.now();
  let attempts = 0;
  let lastError = "not_attempted";
  while (Date.now() - startedAt <= timeoutMs) {
    attempts += 1;
    const result = await readJsonResult(endpoint, "/api/he/capabilities");
    if (result.ok) {
      return {
        ready: true,
        attempts,
        waited_ms: Date.now() - startedAt,
        capabilities: result.value
      };
    }
    lastError = result.error;
    if (Date.now() - startedAt >= timeoutMs) break;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  return {
    ready: false,
    attempts,
    waited_ms: Date.now() - startedAt,
    capabilities: null,
    error: lastError
  };
}

export function isTransientAgentObservation(observation) {
  return observation?.status === "settling";
}

export async function waitForAgentObservation({
  endpoint = DEFAULT_ENDPOINT,
  timeoutMs = DEFAULT_GATEWAY_WAIT_MS,
  pollMs = DEFAULT_GATEWAY_POLL_MS
} = {}) {
  const startedAt = Date.now();
  let attempts = 0;
  let lastError = "not_attempted";
  while (Date.now() - startedAt <= timeoutMs) {
    attempts += 1;
    const result = await readJsonResult(endpoint, "/api/he/observation");
    if (result.ok && !isTransientAgentObservation(result.value)) {
      return {
        ready: true,
        attempts,
        waited_ms: Date.now() - startedAt,
        observation: result.value,
        error: null
      };
    }
    lastError = result.ok ? "native_ui_settling" : result.error;
    if (Date.now() - startedAt >= timeoutMs) break;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  return {
    ready: false,
    attempts,
    waited_ms: Date.now() - startedAt,
    observation: null,
    error: lastError
  };
}

function summarizeGatewayWait(result) {
  return {
    ready: result.ready,
    attempts: result.attempts,
    waited_ms: result.waited_ms,
    protocol_version: result.capabilities?.protocol_version ?? null,
    loaded_sha256: result.capabilities?.bridge?.assembly_file_sha256 ?? null,
    loaded_mvid: result.capabilities?.bridge?.module_version_id ?? null,
    runtime_instance_id: result.capabilities?.bridge?.runtime_instance_id ?? null,
    game: result.capabilities?.game
      ? {
          version: result.capabilities.game.version ?? null,
          commit: result.capabilities.game.commit ?? null,
          main_assembly_hash: result.capabilities.game.main_assembly_hash ?? null
        }
      : null,
    error: result.error ?? null
  };
}

function parseOptions(args) {
  const options = { passthrough: [] };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--game-dir") options.gameDir = args[++index];
    else if (value === "--endpoint") options.endpoint = args[++index];
    else if (value === "--out") options.out = args[++index];
    else if (value === "--backup") options.backup = args[++index];
    else if (value === "--run") options.run = args[++index];
    else if (value === "--runs") options.runs = args[++index];
    else if (value === "--enabled") options.enabled = args[++index];
    else if (value === "--kind") options.kind = args[++index];
    else if (value === "--state-token") options.stateToken = args[++index];
    else if (value === "--runtime-instance-id") options.runtimeInstanceId = args[++index];
    else if (value === "--session") options.session = args[++index];
    else if (value === "--wait") options.wait = true;
    else if (value === "--wait-ms") options.waitMs = parseIntegerOption(value, args[++index], true);
    else if (value === "--poll-ms") options.pollMs = parseIntegerOption(value, args[++index], false);
    else if (value === "--") options.passthrough.push(...args.slice(index + 1));
    else options.passthrough.push(value);
  }
  return options;
}

export function configureHumanEquivalenceProfile(
  configPath,
  enabled
) {
  if (typeof enabled !== "boolean") {
    throw new Error("human-profile configure requires --enabled true or --enabled false");
  }
  let config = {
    port: 15526,
    permission_mode: "balanced_gray",
    qualification_store: "STS2_MCP.qualifications.json"
  };
  if (existsSync(configPath)) {
    const parsed = JSON.parse(readFileSync(configPath, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`Runtime config is not a JSON object: ${configPath}`);
    }
    config = { ...config, ...parsed };
  }
  config.human_equivalence_enabled = enabled;
  mkdirSync(path.dirname(configPath), { recursive: true });
  const temporary = `${configPath}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  renameSync(temporary, configPath);
  return {
    status: "configured",
    profile: "native_pages.v1",
    enabled,
    config_path: configPath,
    default_agent_flow: false,
    creates_action_authority: false,
    enters_command_ledger: false,
    requires_cold_load: true
  };
}

function parseBooleanOption(value, name) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} requires true or false`);
}

async function connectorProtocolRequest(endpoint, route, init = {}) {
  const response = await fetch(`${endpoint.replace(/\/$/u, "")}${route}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {})
    },
    signal: AbortSignal.timeout(10_000)
  });
  const text = await response.text();
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`${route} returned non-JSON HTTP ${response.status}`);
  }
  return { ok: response.ok, http_status: response.status, value };
}

async function humanProfile(options) {
  const action = options.passthrough[0];
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  if (action === "configure") {
    const resolved = paths(options);
    return configureHumanEquivalenceProfile(
      resolved.runtimeConfig,
      parseBooleanOption(options.enabled, "--enabled")
    );
  }
  if (action === "status") {
    const capabilities = await readJson(endpoint, "/api/v3/capabilities", true);
    return {
      protocol_version: capabilities.protocol_version,
      loaded_runtime_instance_id: capabilities.bridge.runtime_instance_id,
      human_equivalence: capabilities.human_equivalence
    };
  }
  if (action === "open") {
    if (!options.kind) throw new Error("human-profile open requires --kind");
    const [capabilities, observation] = await Promise.all([
      readJson(endpoint, "/api/v3/capabilities", true),
      readJson(endpoint, "/api/v3/observation", true)
    ]);
    const result = await connectorProtocolRequest(
      endpoint,
      "/api/v3/human-equivalence/sessions",
      {
        method: "POST",
        body: JSON.stringify({
          profile: "native_pages.v1",
          kind: options.kind,
          expected_state_token: options.stateToken ?? observation.state_token,
          expected_runtime_instance_id:
            options.runtimeInstanceId ?? capabilities.bridge.runtime_instance_id
        })
      }
    );
    return { action, ...result };
  }
  if (action === "read") {
    if (!options.session || !options.runtimeInstanceId) {
      throw new Error("human-profile read requires --session and --runtime-instance-id");
    }
    const route = "/api/v3/human-equivalence/sessions/"
      + `${encodeURIComponent(options.session)}?expected_runtime_instance_id=`
      + encodeURIComponent(options.runtimeInstanceId);
    return { action, ...await connectorProtocolRequest(endpoint, route) };
  }
  if (action === "return" || action === "recover") {
    if (!options.session || !options.runtimeInstanceId) {
      throw new Error(`human-profile ${action} requires --session and --runtime-instance-id`);
    }
    const route = "/api/v3/human-equivalence/sessions/"
      + `${encodeURIComponent(options.session)}/return`;
    const result = await connectorProtocolRequest(endpoint, route, {
      method: "POST",
      body: JSON.stringify({
        profile: "native_pages.v1",
        expected_runtime_instance_id: options.runtimeInstanceId
      })
    });
    return { action, ...result };
  }
  throw new Error(
    "human-profile requires configure, status, open, read, return or recover"
  );
}

async function inspect(options, requireLoaded = false) {
  const resolved = paths(options);
  const protocols = sourceProtocols();
  const currentSource = gatewaySourceIdentity();
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const waited = options.wait
    ? await waitForGateway({ endpoint, timeoutMs: options.waitMs, pollMs: options.pollMs })
    : null;
  if (options.wait && !waited.ready && requireLoaded) {
    throw new Error(`Gateway did not become ready within ${waited.waited_ms}ms: ${waited.error}`);
  }
  const capabilities = waited?.capabilities
    ?? await readJson(endpoint, "/api/he/capabilities", requireLoaded);
  const readinessCapabilities = capabilities;
  const builtIdentity = artifactIdentity(resolved.builtDll);
  const installedIdentity = artifactIdentity(resolved.installedDll);
  const buildMetadata = readOptionalJson(resolved.buildIdentity);
  const installedMetadata = readOptionalJson(resolved.installedIdentity);
  const evaluation = evaluateLoadedArtifact({
    csharpProtocol: protocols.csharp,
    reProtocol: protocols.re,
    builtSha: sha256File(resolved.builtDll),
    installedSha: sha256File(resolved.installedDll),
    builtMvid: builtIdentity?.module_version_id ?? null,
    installedMvid: installedIdentity?.module_version_id ?? null,
    capabilities
  });
  const provenance = evaluateBuildProvenance({
    currentSource,
    sourceProtocol: protocols.csharp,
    builtSha: evaluation.built_sha256,
    builtMvid: evaluation.built_mvid,
    buildMetadata,
    installedSha: evaluation.installed_sha256,
    installedMvid: evaluation.installed_mvid,
    installedMetadata
  });
  const errors = [...new Set([...evaluation.errors, ...provenance.errors])];
  return {
    ...evaluation,
    ok: errors.length === 0,
    artifact_identity_ok: errors.length === 0,
    errors,
    source_identity: currentSource,
    build_provenance: buildMetadata,
    installed_provenance: installedMetadata,
    ...evaluateEnvironmentReadiness(readinessCapabilities, protocols.csharp),
    game_dir: resolved.gameDir,
    mods_dir: resolved.modsDir,
    game_process_running: gameProcessRunning(),
    endpoint,
    gateway_wait: waited ? summarizeGatewayWait(waited) : null,
    mod_installation: inspectModInstallation(resolved.modsDir),
    compatibility_status: capabilities?.game?.compatibility?.status ?? null,
    permission_mode: null,
    qualification_status: null,
    semantic_state_id: null,
    authority_projection_id: null,
    note: "Human-Equivalent C is the default path. It binds current UI affordances to an exact state and C-local owner/target/operands, then returns delivery plus successor; V3 is explicit rollback only."
  };
}

function build(options) {
  const resolved = paths(options);
  run("dotnet", [
    "build",
    "STS2MCP/STS2_MCP.csproj",
    "-c", "Release",
    "-o", "STS2MCP/out/STS2_MCP",
    `-p:STS2GameDir=${resolved.gameDir}`,
    "-p:UseSharedCompilation=false"
  ]);
  run("dotnet", [
    "build",
    "STS2MCP/tools/STS2.ArtifactIdentity/STS2.ArtifactIdentity.csproj",
    "-c", "Release"
  ]);
  run("npm", ["--prefix", "Re-SpireAgent", "run", "build"]);
  return writeBuildIdentity(resolved);
}

function test(options) {
  const resolved = paths(options);
  run("dotnet", [
    "test",
    "STS2MCP/STS2_MCP.sln",
    `-p:STS2GameDir=${resolved.gameDir}`,
    "-p:UseSharedCompilation=false"
  ]);
  run(process.platform === "win32" ? "python" : "python3", [
    "-m", "py_compile", "STS2MCP/mcp/server.py"
  ]);
  artifactIdentity(resolved.builtDll);
  run("npm", ["--prefix", "Re-SpireAgent", "run", "check"]);
  for (const script of [
    "check:connector-cli",
    "check:connector-run-identity",
    "check:docs",
    "check:connector-compatibility-fixtures",
    "check:connector-permission-fixtures",
    "check:connector-qualification",
    "check:connector-profiles",
    "check:connector-migration"
  ]) run("npm", ["run", script]);
}

function audit(options) {
  const resolved = paths(options);
  const env = { ...process.env, STS2_GAME_DIR: resolved.gameDir };
  const failures = [];
  for (const script of [
    "audit:connector-compatibility",
    "audit:connector-operation-bindings"
  ]) {
    const result = spawnPortable("npm", ["run", script], {
      cwd: WORKSPACE,
      env,
      stdio: "inherit"
    });
    if (result.error) throw result.error;
    if (result.status !== 0) failures.push(`${script}:${result.status}`);
  }
  if (failures.length > 0) throw new Error(`Connector audits failed: ${failures.join(", ")}`);
}

function install(options) {
  const resolved = paths(options);
  if (gameProcessRunning()) {
    throw new Error("Slay the Spire 2 is running. Close it before replacing the Gateway artifact.");
  }
  if (!existsSync(resolved.builtDll)) throw new Error("Release DLL is missing; run connector:build first.");
  const currentSource = gatewaySourceIdentity();
  const protocols = sourceProtocols();
  const builtIdentity = artifactIdentity(resolved.builtDll);
  const buildMetadata = readOptionalJson(resolved.buildIdentity);
  const buildProvenance = evaluateBuildProvenance({
    currentSource,
    sourceProtocol: protocols.csharp,
    builtSha: builtIdentity?.sha256 ?? null,
    builtMvid: builtIdentity?.module_version_id ?? null,
    buildMetadata,
    installedSha: null,
    installedMvid: null,
    installedMetadata: null
  });
  if (!buildProvenance.ok) {
    throw new Error(
      `Release build does not match current Gateway source: ${buildProvenance.errors.join(", ")}. Run connector build before install.`
    );
  }
  mkdirSync(resolved.modsDir, { recursive: true });
  const modInstallation = inspectModInstallation(resolved.modsDir);
  if (modInstallation.exact_permission_blocker) {
    throw new Error(
      `Installation refused before changing the Gateway artifact because duplicate STS2_MCP manifests exist under the scanned mods tree: ${modInstallation.duplicate_manifests.map((item) => item.relative_path).join(", ")}. Run connector repair-installation with the game closed.`
    );
  }
  const builtSha = sha256File(resolved.builtDll);
  const installedSha = sha256File(resolved.installedDll);
  if (builtSha === installedSha && existsSync(resolved.installedManifest)) {
    const installedProvenance = {
      ...buildMetadata,
      installed_at: new Date().toISOString()
    };
    mkdirSync(path.dirname(resolved.installedIdentity), { recursive: true });
    writeFileSync(resolved.installedIdentity, `${JSON.stringify(installedProvenance, null, 2)}\n`);
    return {
      status: "already_installed",
      sha256: builtSha,
      mvid: builtIdentity.module_version_id,
      installed_dll: resolved.installedDll,
      gateway_source_digest: buildMetadata.gateway_source_digest
    };
  }

  const backupDir = path.join(
    resolved.localRoot,
    "deployments",
    new Date().toISOString().replace(/[:.]/gu, "-")
  );
  mkdirSync(backupDir, { recursive: true });
  if (existsSync(resolved.installedDll)) copyFileSync(resolved.installedDll, path.join(backupDir, "STS2_MCP.dll"));
  if (existsSync(resolved.installedManifest)) copyFileSync(resolved.installedManifest, path.join(backupDir, "STS2_MCP.json"));
  if (existsSync(resolved.installedIdentity)) {
    copyFileSync(resolved.installedIdentity, path.join(backupDir, "installed-identity.json"));
  }
  const previousIdentity = artifactIdentity(resolved.installedDll);
  writeFileSync(path.join(backupDir, "deployment.json"), `${JSON.stringify({
    schema_version: 1,
    created_at: new Date().toISOString(),
    previous_installed_sha256: installedSha,
    previous_installed_mvid: previousIdentity?.module_version_id ?? null,
    replacement_sha256: builtSha,
    replacement_mvid: builtIdentity.module_version_id,
    replacement_source_revision: buildMetadata.source_revision,
    replacement_gateway_source_digest: buildMetadata.gateway_source_digest,
    replacement_protocol: buildMetadata.source_protocol,
    game_dir: resolved.gameDir,
    scope: "gateway_artifact_only_not_game_or_modset"
  }, null, 2)}\n`);

  copyFileSync(resolved.builtDll, resolved.installedDll);
  copyFileSync(resolved.sourceManifest, resolved.installedManifest);
  const copiedSha = sha256File(resolved.installedDll);
  if (copiedSha !== builtSha) throw new Error("Installed Gateway SHA does not match the Release artifact.");
  const installedProvenance = {
    ...buildMetadata,
    installed_at: new Date().toISOString()
  };
  mkdirSync(path.dirname(resolved.installedIdentity), { recursive: true });
  writeFileSync(resolved.installedIdentity, `${JSON.stringify(installedProvenance, null, 2)}\n`);
  return {
    status: "installed_game_must_be_cold_started",
    sha256: copiedSha,
    mvid: builtIdentity.module_version_id,
    installed_dll: resolved.installedDll,
    gateway_source_digest: buildMetadata.gateway_source_digest,
    rollback_backup: backupDir
  };
}

function deploy(options) {
  if (gameProcessRunning()) {
    throw new Error("Slay the Spire 2 is running. Close it before starting the verified deploy workflow.");
  }
  test(options);
  const buildMetadata = build(options);
  const installation = install(options);
  return {
    status: "verified_source_build_installed_game_must_be_cold_started",
    source_revision: buildMetadata.source_revision,
    gateway_source_digest: buildMetadata.gateway_source_digest,
    protocol: buildMetadata.source_protocol,
    artifact_sha256: buildMetadata.artifact_sha256,
    artifact_mvid: buildMetadata.artifact_mvid,
    installation,
    loaded: "non_claim"
  };
}

function repairInstallation(options) {
  const resolved = paths(options);
  if (gameProcessRunning()) {
    throw new Error("Slay the Spire 2 is running. Close it before relocating duplicate mod manifests.");
  }
  const before = inspectModInstallation(resolved.modsDir);
  if (!before.exact_permission_blocker) {
    return { status: "installation_clean", moved: [], inspection: before };
  }

  const unsafe = before.duplicate_manifests.filter((manifest) =>
    !path.relative(resolved.modsDir, manifest.path).split(path.sep).includes("backups"));
  if (unsafe.length > 0) {
    return {
      status: "manual_review_required",
      moved: [],
      blocked_manifests: unsafe,
      detail: "Only duplicate manifests inside an explicit backups directory can be relocated automatically."
    };
  }

  const quarantineRoot = path.join(
    resolved.localRoot,
    "mod-installation-quarantine",
    new Date().toISOString().replace(/[:.]/gu, "-")
  );
  const sourceDirectories = [...new Set(before.duplicate_manifests.map((manifest) => path.dirname(manifest.path)))];
  const moved = [];
  for (const source of sourceDirectories) {
    const relative = path.relative(resolved.modsDir, source);
    const destination = path.join(quarantineRoot, relative);
    mkdirSync(path.dirname(destination), { recursive: true });
    renameSync(source, destination);
    moved.push({ source, destination });
  }
  return {
    status: "duplicate_backup_manifests_relocated",
    moved,
    inspection: inspectModInstallation(resolved.modsDir),
    rollback: "Move each quarantined directory back to its recorded source path while the game is closed."
  };
}

function restoreKnownEnvironment(options) {
  const resolved = paths(options);
  if (gameProcessRunning()) throw new Error("Close Slay the Spire 2 before restoring a Gateway artifact.");
  if (!options.backup) throw new Error("restore-known-environment requires --backup DIR.");
  const backup = path.resolve(options.backup);
  const dll = path.join(backup, "STS2_MCP.dll");
  if (!existsSync(dll)) throw new Error("The backup does not contain STS2_MCP.dll.");
  mkdirSync(resolved.modsDir, { recursive: true });
  copyFileSync(dll, resolved.installedDll);
  const manifest = path.join(backup, "STS2_MCP.json");
  if (existsSync(manifest)) copyFileSync(manifest, resolved.installedManifest);
  const installedIdentity = path.join(backup, "installed-identity.json");
  if (existsSync(installedIdentity)) {
    mkdirSync(path.dirname(resolved.installedIdentity), { recursive: true });
    copyFileSync(installedIdentity, resolved.installedIdentity);
  } else {
    rmSync(resolved.installedIdentity, { force: true });
  }
  return {
    status: "gateway_artifact_restored_game_must_be_cold_started",
    sha256: sha256File(resolved.installedDll),
    scope: "gateway_artifact_only",
    non_claims: ["Steam game build not restored", "Modset not restored", "permission not granted"]
  };
}

async function collectEvidence(options) {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const waited = await waitForGateway({
    endpoint,
    timeoutMs: options.waitMs,
    pollMs: options.pollMs
  });
  if (!waited.ready) {
    throw new Error(`Gateway did not become ready within ${waited.waited_ms}ms: ${waited.error}`);
  }
  const capabilities = waited.capabilities;
  const state = await readJson(endpoint, "/api/he/observation", true);
  const controller = await readJsonResult(endpoint, "/api/he/controller");
  const partialFailures = [
    ...(controller.ok ? [] : [{ route: "/api/he/controller", error: controller.error }])
  ];
  const resolved = paths(options);
  const output = path.resolve(options.out ?? path.join(
    resolved.localRoot,
    "evidence",
    `connector-readonly-${new Date().toISOString().replace(/[:.]/gu, "-")}.json`
  ));
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify({
    schema_version: 3,
    captured_at: new Date().toISOString(),
    evidence_kind: "read_only_loaded_connector_snapshot",
    authorization_effect: "none",
    built_sha256: sha256File(resolved.builtDll),
    installed_sha256: sha256File(resolved.installedDll),
    capabilities,
    state,
    optional_diagnostics: {
      controller: controller.value
    },
    partial_failures: partialFailures
  }, null, 2)}\n`);
  return {
    status: "read_only_evidence_collected",
    output,
    protocol_version: capabilities.protocol_version,
    loaded_sha256: capabilities.bridge?.assembly_file_sha256,
    state_token: state.state_token,
    frame_id: state.frame?.frame_id ?? null,
    owner_id: state.owner?.owner_id ?? null,
    partial_failures: partialFailures
  };
}

function probeCommand(command, args = ["--version"]) {
  const result = spawnPortable(command, args, {
    cwd: WORKSPACE,
    env: process.env,
    encoding: "utf8",
    stdio: "pipe"
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  return {
    available: !result.error && result.status === 0,
    version: output.split(/\r?\n/u).find(Boolean) ?? null,
    error: result.error?.message ?? (result.status === 0 ? null : `exit_${result.status}`)
  };
}

function gitWorkspaceState() {
  const read = (args) => {
    const result = spawnSync("git", args, {
      cwd: WORKSPACE,
      encoding: "utf8",
      stdio: "pipe"
    });
    return result.status === 0 ? result.stdout.trim() : null;
  };
  return {
    branch: read(["branch", "--show-current"]),
    head: read(["rev-parse", "HEAD"]),
    upstream: read(["rev-parse", "--abbrev-ref", "@{upstream}"]),
    worktree: read(["status", "--porcelain"]) ? "dirty" : "clean"
  };
}

export function recommendDoctorSteps({
  prerequisites,
  gameDirExists,
  agentDependenciesInstalled,
  status,
  inspectionError = null
}) {
  const steps = [];
  const missing = Object.entries(prerequisites)
    .filter(([, value]) => value.required && !value.available)
    .map(([name]) => name);
  if (missing.length > 0) steps.push(`Install required tools: ${missing.join(", ")}.`);
  if (!gameDirExists) steps.push("Install STS2 or set STS2_GAME_DIR to the exact Steam game directory.");
  if (!agentDependenciesInstalled) steps.push("Run npm run bootstrap from the repository root.");
  if (inspectionError) steps.push(`Resolve Connector inspection failure: ${inspectionError}`);

  const deployErrors = new Set([
    "release_artifact_missing",
    "installed_artifact_missing",
    "build_provenance_missing",
    "installed_provenance_missing",
    "source_build_digest_mismatch",
    "source_build_protocol_mismatch",
    "build_provenance_sha_mismatch",
    "build_provenance_mvid_mismatch",
    "build_installed_sha_mismatch",
    "build_installed_mvid_mismatch",
    "build_installed_provenance_mismatch"
  ]);
  if (status?.errors?.some((error) => deployErrors.has(error))) {
    steps.push("Fully close STS2, then run npm run deploy from the repository root.");
  }
  if (status?.mod_installation?.exact_permission_blocker) {
    steps.push("Fully close STS2, then diagnose and repair duplicate STS2_MCP manifests.");
  }
  if (status?.errors?.some((error) => [
    "installed_loaded_sha_mismatch",
    "installed_loaded_mvid_mismatch",
    "source_loaded_protocol_mismatch"
  ].includes(error))) {
    steps.push("After a verified deploy, cold-restart STS2 so the installed Gateway is actually loaded.");
  } else if (status?.errors?.includes("gateway_not_loaded_or_unreachable")) {
    steps.push("Start STS2, wait for a stable menu, then run npm run verify:loaded.");
  }
  if (status?.ok === true
      && status.environment_ready !== true) {
    steps.push(`Resolve loaded environment blockers: ${(status.blockers ?? ["observation_not_ready"]).join(", ")}.`);
  }
  if (status?.ok === true
      && status.environment_ready === true
      && status.mutation_ready !== true
      && status.provisional_trial_ready !== true) {
    steps.push("The loaded environment has no bounded mutation authority; keep actions Fail Closed and inspect compatibility.");
  }
  if (steps.length === 0 && status?.ok) {
    steps.push("Run cd Re-SpireAgent && npm run agent:run.");
  }
  return [...new Set(steps)];
}

async function doctor(options) {
  const python = process.platform === "win32" ? "python" : "python3";
  const prerequisites = {
    node: {
      required: true,
      available: Number(process.versions.node.split(".")[0]) >= 20,
      version: process.version,
      error: null
    },
    npm: { required: true, ...probeCommand("npm") },
    dotnet: { required: true, ...probeCommand("dotnet", ["--version"]) },
    git: { required: true, ...probeCommand("git", ["--version"]) },
    python: { required: false, ...probeCommand(python, ["--version"]) },
    uv: { required: false, ...probeCommand("uv", ["--version"]) }
  };
  let gameDir = null;
  let gameDirExists = false;
  let gameDirError = null;
  try {
    gameDir = path.resolve(options.gameDir ?? resolveGameDir());
    gameDirExists = existsSync(gameDir);
  } catch (error) {
    gameDirError = error instanceof Error ? error.message : String(error);
  }
  const agentDependenciesInstalled = existsSync(path.join(
    WORKSPACE,
    "Re-SpireAgent/node_modules/typescript/package.json"
  ));
  let status = null;
  let inspectionError = gameDirError;
  if (gameDirExists && prerequisites.dotnet.available) {
    try {
      status = await inspect({ ...options, gameDir });
    } catch (error) {
      inspectionError = error instanceof Error ? error.message : String(error);
    }
  }
  const nextSteps = recommendDoctorSteps({
    prerequisites,
    gameDirExists,
    agentDependenciesInstalled,
    status,
    inspectionError
  });
  return {
    status: nextSteps.length === 1 && nextSteps[0].includes("agent:run")
      ? "ready"
      : "action_required",
    repository: gitWorkspaceState(),
    prerequisites,
    game_dir: gameDir,
    game_dir_exists: gameDirExists,
    agent_dependencies_installed: agentDependenciesInstalled,
    connector: status,
    inspection_error: inspectionError,
    next_steps: nextSteps,
    non_claims: [
      "doctor is read-only",
      "installed identity is not loaded identity",
      "loaded identity is not Organic qualification"
    ]
  };
}

function* walkFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isFile()) yield fullPath;
    else if (entry.isDirectory()) yield* walkFiles(fullPath);
  }
}

function parseIntegerOption(name, value, allowZero) {
  const parsed = Number(value);
  const valid = Number.isInteger(parsed) && (allowZero ? parsed >= 0 : parsed > 0);
  if (!valid) throw new Error(`${name} requires ${allowZero ? "a non-negative" : "a positive"} integer.`);
  return parsed;
}

function delegate(script, command, passthrough) {
  run("node", [path.join(WORKSPACE, script), command, ...passthrough]);
}

async function prepareAgentRun(options) {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const waited = await waitForGateway({
    endpoint,
    timeoutMs: options.waitMs,
    pollMs: options.pollMs
  });
  if (!waited.ready) {
    throw new Error(`Gateway did not become ready within ${waited.waited_ms}ms: ${waited.error}`);
  }

  const before = await inspect({ ...options, endpoint }, true);
  const beforeErrors = agentRunPreflightErrors(before, {
    requireObservation: false
  });
  if (beforeErrors.length > 0) {
    throw new Error(`Agent preflight rejected loaded environment: ${beforeErrors.join(", ")}`);
  }

  let after = before;
  let observationWait = null;
  if (before.observation_ready) {
    observationWait = await waitForAgentObservation({
      endpoint,
      timeoutMs: options.waitMs,
      pollMs: options.pollMs
    });
    if (!observationWait.ready) {
      throw new Error(
        `Gateway loaded but no semantic game context became ready within ${observationWait.waited_ms}ms: ${observationWait.error}`
      );
    }
    after = await inspect({ ...options, endpoint }, true);
  }

  const afterErrors = agentRunPreflightErrors(after, { requireMutation: true });
  if (afterErrors.length > 0) {
    throw new Error(
      `Agent preflight did not establish an exact runnable environment: ${afterErrors.join(", ")}`
    );
  }
  return {
    status: "human_equivalent_environment_ready_for_bounded_agent_run",
    protocol_version: after.loaded_protocol,
    loaded_sha256: after.loaded_sha256,
    loaded_mvid: after.loaded_mvid,
    runtime_instance_id: after.runtime_instance_id,
    compatibility_status: after.compatibility_status,
    permission_mode: after.permission_mode,
    qualification_status: after.qualification_status,
    authority_path: "current_native_ui_affordance",
    observation_wait: observationWait
      ? {
          attempts: observationWait.attempts,
          waited_ms: observationWait.waited_ms,
          context_kind: observationWait.observation?.surface?.facts?.context?.kind ?? null,
          surface_kind: observationWait.observation?.surface?.kind ?? null
        }
      : null,
    non_claims: [
      "preflight is not Live journey evidence",
      "visible unsupported UI remains explicit",
      "unknown input delivery is never retried"
    ]
  };
}

function usage() {
  return `Usage: npm run connector -- <command> [options]\n\n`
    + `Commands:\n`
    + `  doctor                            Diagnose prerequisites, checkout and deployment drift\n`
    + `  deploy                            Test, build, back up and install with the game closed\n`
    + `  inspect | show-status             Read source, disk and optional loaded identity\n`
    + `  test                              Run Gateway, Re and connector checks\n`
    + `  audit                             Run exact local game assembly audits\n`
    + `  build                             Build Release Gateway and Re\n`
    + `  install                           Backup and install the built Gateway with game closed\n`
    + `  diagnose-installation              Find duplicate STS2_MCP manifests in the Mod scan tree\n`
    + `  repair-installation                Relocate known backup manifests with game closed\n`
    + `  wait-for-gateway                   Bounded read-only capabilities readiness wait\n`
    + `  verify-loaded-artifact [--wait]   Require source/built/installed/loaded identity agreement\n`
    + `  run-agent -- <agent args>         Exact-identity preflight, trial resume, then bounded Re run\n`
    + `  collect-evidence [--out FILE]     Capture read-only capabilities/state/controller/clients\n`
    + `  human-profile <operation>          Configure or exercise optional native-page evidence\n`
    + `  audit-run-identity [--run ID|DIR] Audit stale refusals using formal IDs or historical shadows\n`
    + `  start-or-resume-trial -- <args>   Delegate to the migration cycle\n`
    + `  revoke -- <ledger args>           Revoke a persistent qualification\n`
    + `  rollback -- <ledger args>         Roll back a persistent qualification\n`
    + `  restore-known-environment --backup DIR  Restore only a backed-up Gateway artifact\n\n`
    + `Common options: --game-dir DIR --endpoint URL --wait-ms N --poll-ms N`;
}

export async function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  const options = parseOptions(argv.slice(1));
  if (!command || command === "help" || command === "--help") {
    console.log(usage());
    return;
  }
  loadAgentGameDirFromLocalEnv();
  if (command === "doctor") {
    console.log(JSON.stringify(await doctor(options), null, 2));
    return;
  }
  if (command === "deploy") {
    console.log(JSON.stringify(deploy(options), null, 2));
    return;
  }
  if (command === "inspect" || command === "show-status") {
    console.log(JSON.stringify(await inspect(options), null, 2));
    return;
  }
  if (command === "verify-loaded-artifact") {
    const status = await inspect(options, true);
    console.log(JSON.stringify(status, null, 2));
    if (!status.ok) process.exitCode = 1;
    return;
  }
  if (command === "test") return test(options);
  if (command === "audit") return audit(options);
  if (command === "build") {
    console.log(JSON.stringify(build(options), null, 2));
    return;
  }
  if (command === "install") {
    console.log(JSON.stringify(install(options), null, 2));
    return;
  }
  if (command === "diagnose-installation") {
    console.log(JSON.stringify(inspectModInstallation(paths(options).modsDir), null, 2));
    return;
  }
  if (command === "repair-installation") {
    const result = repairInstallation(options);
    console.log(JSON.stringify(result, null, 2));
    if (result.status === "manual_review_required") process.exitCode = 1;
    return;
  }
  if (command === "wait-for-gateway") {
    const result = await waitForGateway({
      endpoint: options.endpoint ?? DEFAULT_ENDPOINT,
      timeoutMs: options.waitMs,
      pollMs: options.pollMs
    });
    console.log(JSON.stringify(summarizeGatewayWait(result), null, 2));
    if (!result.ready) process.exitCode = 1;
    return;
  }
  if (command === "restore-known-environment") {
    console.log(JSON.stringify(restoreKnownEnvironment(options), null, 2));
    return;
  }
  if (command === "collect-evidence") {
    console.log(JSON.stringify(await collectEvidence(options), null, 2));
    return;
  }
  if (command === "human-profile") {
    const result = await humanProfile(options);
    console.log(JSON.stringify(result, null, 2));
    if (result?.ok === false) process.exitCode = 1;
    return;
  }
  if (command === "audit-run-identity") {
    const args = [];
    if (options.run) args.push("--run", options.run);
    if (options.runs) args.push("--runs", options.runs);
    run("node", [path.join(WORKSPACE, "tools/connector-run-identity-audit.mjs"), ...args]);
    return;
  }
  if (command === "run-agent") {
    console.log(JSON.stringify(await prepareAgentRun(options), null, 2));
    const sourceIdentity = workspaceSourceIdentity();
    run("npm", ["--prefix", "Re-SpireAgent", "run", "agent:run:direct", "--", ...options.passthrough], {
      env: {
        ...process.env,
        STS2_API_URL: options.endpoint ?? process.env.STS2_API_URL ?? DEFAULT_ENDPOINT,
        ...(sourceIdentity
          ? {
              SPIREAGENT_RE_SOURCE_REVISION: sourceIdentity.revision,
              SPIREAGENT_RE_SOURCE_DIGEST: sourceIdentity.sourceDigest,
              SPIREAGENT_RE_WORKTREE_STATUS: sourceIdentity.worktreeStatus
            }
          : {})
      }
    });
    return;
  }
  if (command === "start-or-resume-trial") {
    delegate(
      "tools/connector-migration-orchestrator.mjs",
      "cycle",
      migrationCycleDelegateArgs(options)
    );
    return;
  }
  if (command === "revoke" || command === "rollback") {
    delegate("tools/connector-qualification-ledger.mjs", command, options.passthrough);
    return;
  }
  throw new Error(`Unknown command ${command}.\n${usage()}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
