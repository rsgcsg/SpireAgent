#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ENDPOINT = "http://127.0.0.1:15526";
const DEFAULT_GATEWAY_WAIT_MS = 60_000;
const DEFAULT_GATEWAY_POLL_MS = 500;

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
  return platform === "darwin"
    ? path.join(gameDir, "SlayTheSpire2.app/Contents/MacOS/mods")
    : path.join(gameDir, "mods");
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

export function evaluateEnvironmentReadiness(capabilities) {
  const compatibility = capabilities?.game?.compatibility;
  const modset = capabilities?.game?.modset;
  const modsetStatus = modset?.status ?? null;
  const hazardousModset = modsetStatus === "hazardous_mod_state_detected";
  const observationReady = compatibility?.state_observation_allowed === true;
  const inspectionReady = compatibility?.inspection_allowed === true;
  const mutationReady = compatibility?.action_execution_allowed === true;
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
    modset_status: modsetStatus,
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

export function agentRunPreflightErrors(
  status,
  { requireObservation = true, requireMutation = false } = {}
) {
  const errors = [...(status?.errors ?? [])];
  if (status?.mod_installation?.exact_permission_blocker === true) {
    errors.push("duplicate_gateway_manifests_detected");
  }
  if (status?.modset_status !== "exact_bridge_only") {
    errors.push("exact_bridge_only_modset_required");
  }
  if (requireObservation && status?.observation_ready !== true) {
    errors.push("normal_observation_disabled");
  }
  if (requireMutation && status?.mutation_ready !== true) errors.push("mutation_disabled");
  return [...new Set(errors)];
}

function sourceProtocol(file, pattern) {
  const match = readFileSync(file, "utf8").match(pattern);
  if (!match) throw new Error(`Could not read protocol from ${path.relative(WORKSPACE, file)}`);
  return match[1];
}

function paths(options = {}) {
  const gameDir = path.resolve(options.gameDir ?? resolveGameDir());
  const modsDir = resolveModsDir(gameDir);
  return {
    gameDir,
    modsDir,
    builtDll: path.join(WORKSPACE, "STS2MCP/out/STS2_MCP/STS2_MCP.dll"),
    sourceManifest: path.join(WORKSPACE, "STS2MCP/mod_manifest.json"),
    installedDll: path.join(modsDir, "STS2_MCP.dll"),
    installedManifest: path.join(modsDir, "STS2_MCP.json"),
    localRoot: path.join(WORKSPACE, "STS2MCP/.local")
  };
}

function sourceProtocols() {
  return {
    csharp: sourceProtocol(
      path.join(WORKSPACE, "STS2MCP/BridgeV2/Protocol/BridgeContracts.cs"),
      /ProtocolVersion\s*=\s*"([^"]+)"/u
    ),
    re: sourceProtocol(
      path.join(WORKSPACE, "Re-SpireAgent/src/integrations/sts2mcp/bridgeV2Protocol.ts"),
      /SUPPORTED_BRIDGE_V2_PROTOCOL\s*=\s*"([^"]+)"/u
    )
  };
}

function gameProcessRunning() {
  if (process.platform === "win32") return false;
  const result = spawnSync("ps", ["-Ao", "pid=,comm="], { encoding: "utf8" });
  if (result.status !== 0) return false;
  return result.stdout.split("\n").some((line) => /Slay ?the ?Spire ?2|SlayTheSpire2/iu.test(line));
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
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
    const result = await readJsonResult(endpoint, "/api/v2/capabilities");
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
    else if (value === "--wait") options.wait = true;
    else if (value === "--wait-ms") options.waitMs = parseIntegerOption(value, args[++index], true);
    else if (value === "--poll-ms") options.pollMs = parseIntegerOption(value, args[++index], false);
    else if (value === "--") options.passthrough.push(...args.slice(index + 1));
    else options.passthrough.push(value);
  }
  return options;
}

async function inspect(options, requireLoaded = false) {
  const resolved = paths(options);
  const protocols = sourceProtocols();
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const waited = options.wait
    ? await waitForGateway({ endpoint, timeoutMs: options.waitMs, pollMs: options.pollMs })
    : null;
  if (options.wait && !waited.ready && requireLoaded) {
    throw new Error(`Gateway did not become ready within ${waited.waited_ms}ms: ${waited.error}`);
  }
  const capabilities = waited?.capabilities
    ?? await readJson(endpoint, "/api/v2/capabilities", requireLoaded);
  const builtIdentity = artifactIdentity(resolved.builtDll);
  const installedIdentity = artifactIdentity(resolved.installedDll);
  const evaluation = evaluateLoadedArtifact({
    csharpProtocol: protocols.csharp,
    reProtocol: protocols.re,
    builtSha: sha256File(resolved.builtDll),
    installedSha: sha256File(resolved.installedDll),
    builtMvid: builtIdentity?.module_version_id ?? null,
    installedMvid: installedIdentity?.module_version_id ?? null,
    capabilities
  });
  return {
    ...evaluation,
    ...evaluateEnvironmentReadiness(capabilities),
    game_dir: resolved.gameDir,
    mods_dir: resolved.modsDir,
    game_process_running: gameProcessRunning(),
    endpoint,
    gateway_wait: waited ? summarizeGatewayWait(waited) : null,
    mod_installation: inspectModInstallation(resolved.modsDir),
    compatibility_status: capabilities?.game?.compatibility?.status ?? null,
    permission_mode: capabilities?.permission_system?.mode ?? null,
    qualification_status: capabilities?.qualification_system?.status ?? null,
    identity_shadow_status: null,
    note: "Identity shadow is state-scoped and is inspected through collect-evidence or /api/v2/state."
  };
}

function build(options) {
  const resolved = paths(options);
  run("dotnet", [
    "build",
    "STS2MCP/STS2_MCP.csproj",
    "-c", "Release",
    "-o", "STS2MCP/out/STS2_MCP",
    `-p:STS2GameDir=${resolved.gameDir}`
  ]);
  run("dotnet", [
    "build",
    "STS2MCP/tools/STS2.ArtifactIdentity/STS2.ArtifactIdentity.csproj",
    "-c", "Release"
  ]);
  run("npm", ["--prefix", "Re-SpireAgent", "run", "build"]);
}

function test(options) {
  const resolved = paths(options);
  run("dotnet", [
    "test",
    "STS2MCP/STS2_MCP.sln",
    `-p:STS2GameDir=${resolved.gameDir}`
  ]);
  run(process.platform === "win32" ? "python" : "python3", [
    "-m", "py_compile", "STS2MCP/mcp/server.py"
  ]);
  artifactIdentity(resolved.builtDll);
  run("npm", ["--prefix", "Re-SpireAgent", "run", "check"]);
  for (const script of [
    "check:connector-cli",
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
    const result = spawnSync("npm", ["run", script], {
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
    return { status: "already_installed", sha256: builtSha, installed_dll: resolved.installedDll };
  }

  const backupDir = path.join(
    resolved.localRoot,
    "deployments",
    new Date().toISOString().replace(/[:.]/gu, "-")
  );
  mkdirSync(backupDir, { recursive: true });
  if (existsSync(resolved.installedDll)) copyFileSync(resolved.installedDll, path.join(backupDir, "STS2_MCP.dll"));
  if (existsSync(resolved.installedManifest)) copyFileSync(resolved.installedManifest, path.join(backupDir, "STS2_MCP.json"));
  writeFileSync(path.join(backupDir, "deployment.json"), `${JSON.stringify({
    schema_version: 1,
    created_at: new Date().toISOString(),
    previous_installed_sha256: installedSha,
    replacement_sha256: builtSha,
    game_dir: resolved.gameDir,
    scope: "gateway_artifact_only_not_game_or_modset"
  }, null, 2)}\n`);

  copyFileSync(resolved.builtDll, resolved.installedDll);
  copyFileSync(resolved.sourceManifest, resolved.installedManifest);
  const copiedSha = sha256File(resolved.installedDll);
  if (copiedSha !== builtSha) throw new Error("Installed Gateway SHA does not match the Release artifact.");
  return {
    status: "installed_game_must_be_cold_started",
    sha256: copiedSha,
    installed_dll: resolved.installedDll,
    rollback_backup: backupDir
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
  const state = await readJson(endpoint, "/api/v2/state", true);
  const controller = await readJsonResult(endpoint, "/api/v2/controller");
  const clients = await readJsonResult(endpoint, "/api/v2/clients");
  const partialFailures = [
    ...(controller.ok ? [] : [{ route: "/api/v2/controller", error: controller.error }]),
    ...(clients.ok ? [] : [{ route: "/api/v2/clients", error: clients.error }])
  ];
  const resolved = paths(options);
  const output = path.resolve(options.out ?? path.join(
    resolved.localRoot,
    "evidence",
    `connector-readonly-${new Date().toISOString().replace(/[:.]/gu, "-")}.json`
  ));
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify({
    schema_version: 2,
    captured_at: new Date().toISOString(),
    evidence_kind: "read_only_loaded_connector_snapshot",
    authorization_effect: "none",
    built_sha256: sha256File(resolved.builtDll),
    installed_sha256: sha256File(resolved.installedDll),
    capabilities,
    state,
    optional_diagnostics: {
      controller: controller.value,
      clients: clients.value
    },
    partial_failures: partialFailures
  }, null, 2)}\n`);
  return {
    status: "read_only_evidence_collected",
    output,
    protocol_version: capabilities.protocol_version,
    loaded_sha256: capabilities.bridge?.assembly_file_sha256,
    state_id: state.state_id,
    identity_shadow_status: state.identity_shadow?.status ?? "missing",
    partial_failures: partialFailures
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

  delegate(
    "tools/connector-migration-orchestrator.mjs",
    "cycle",
    defaultMigrationCycleArgs({ ...options, endpoint })
  );

  const after = await inspect({ ...options, endpoint }, true);
  const afterErrors = agentRunPreflightErrors(after, { requireMutation: true });
  if (afterErrors.length > 0) {
    throw new Error(
      `Agent preflight did not establish an exact runnable environment: ${afterErrors.join(", ")}`
    );
  }
  return {
    status: "exact_environment_ready_for_bounded_agent_run",
    protocol_version: after.loaded_protocol,
    loaded_sha256: after.loaded_sha256,
    loaded_mvid: after.loaded_mvid,
    runtime_instance_id: after.runtime_instance_id,
    compatibility_status: after.compatibility_status,
    permission_mode: after.permission_mode,
    qualification_status: after.qualification_status,
    non_claims: [
      "preflight is not Organic qualification",
      "unsupported surfaces remain fail closed",
      "the bounded run never retries an unknown mutation outcome"
    ]
  };
}

function usage() {
  return `Usage: npm run connector -- <command> [options]\n\n`
    + `Commands:\n`
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
  if (command === "build") return build(options);
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
  if (command === "run-agent") {
    console.log(JSON.stringify(await prepareAgentRun(options), null, 2));
    run("npm", ["--prefix", "Re-SpireAgent", "run", "agent:run:direct", "--", ...options.passthrough], {
      env: {
        ...process.env,
        STS2_API_URL: options.endpoint ?? process.env.STS2_API_URL ?? DEFAULT_ENDPOINT
      }
    });
    return;
  }
  if (command === "start-or-resume-trial") {
    delegate("tools/connector-migration-orchestrator.mjs", "cycle", options.passthrough);
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
