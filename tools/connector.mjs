#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const WORKSPACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_ENDPOINT = "http://127.0.0.1:15526";

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
    game: capabilities?.game ?? null
  };
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
  try {
    const response = await fetch(`${endpoint.replace(/\/$/u, "")}${route}`, {
      signal: AbortSignal.timeout(2500)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (required) throw new Error(`${route} unavailable: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

function parseOptions(args) {
  const options = { passthrough: [] };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--game-dir") options.gameDir = args[++index];
    else if (value === "--endpoint") options.endpoint = args[++index];
    else if (value === "--out") options.out = args[++index];
    else if (value === "--backup") options.backup = args[++index];
    else if (value === "--") options.passthrough.push(...args.slice(index + 1));
    else options.passthrough.push(value);
  }
  return options;
}

async function inspect(options, requireLoaded = false) {
  const resolved = paths(options);
  const protocols = sourceProtocols();
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const capabilities = await readJson(endpoint, "/api/v2/capabilities", requireLoaded);
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
    game_dir: resolved.gameDir,
    mods_dir: resolved.modsDir,
    game_process_running: gameProcessRunning(),
    endpoint,
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
  const capabilities = await readJson(endpoint, "/api/v2/capabilities", true);
  const state = await readJson(endpoint, "/api/v2/state", true);
  const control = await readJson(endpoint, "/api/v2/control", true);
  const resolved = paths(options);
  const output = path.resolve(options.out ?? path.join(
    resolved.localRoot,
    "evidence",
    `connector-readonly-${new Date().toISOString().replace(/[:.]/gu, "-")}.json`
  ));
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify({
    schema_version: 1,
    captured_at: new Date().toISOString(),
    evidence_kind: "read_only_loaded_connector_snapshot",
    authorization_effect: "none",
    built_sha256: sha256File(resolved.builtDll),
    installed_sha256: sha256File(resolved.installedDll),
    capabilities,
    state,
    control
  }, null, 2)}\n`);
  return {
    status: "read_only_evidence_collected",
    output,
    protocol_version: capabilities.protocol_version,
    loaded_sha256: capabilities.bridge?.assembly_file_sha256,
    state_id: state.state_id,
    identity_shadow_status: state.identity_shadow?.status ?? "missing"
  };
}

function delegate(script, command, passthrough) {
  run("node", [path.join(WORKSPACE, script), command, ...passthrough]);
}

function usage() {
  return `Usage: npm run connector -- <command> [options]\n\n`
    + `Commands:\n`
    + `  inspect | show-status             Read source, disk and optional loaded identity\n`
    + `  test                              Run Gateway, Re and connector checks\n`
    + `  audit                             Run exact local game assembly audits\n`
    + `  build                             Build Release Gateway and Re\n`
    + `  install                           Backup and install the built Gateway with game closed\n`
    + `  verify-loaded-artifact            Require source/built/installed/loaded identity agreement\n`
    + `  run-agent -- <agent args>         Run Re agent:run\n`
    + `  collect-evidence [--out FILE]     Capture read-only capabilities/state/control\n`
    + `  start-or-resume-trial -- <args>   Delegate to the migration cycle\n`
    + `  revoke -- <ledger args>           Revoke a persistent qualification\n`
    + `  rollback -- <ledger args>         Roll back a persistent qualification\n`
    + `  restore-known-environment --backup DIR  Restore only a backed-up Gateway artifact\n\n`
    + `Common options: --game-dir DIR --endpoint URL`;
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
  if (command === "restore-known-environment") {
    console.log(JSON.stringify(restoreKnownEnvironment(options), null, 2));
    return;
  }
  if (command === "collect-evidence") {
    console.log(JSON.stringify(await collectEvidence(options), null, 2));
    return;
  }
  if (command === "run-agent") {
    run("npm", ["--prefix", "Re-SpireAgent", "run", "agent:run", "--", ...options.passthrough]);
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
