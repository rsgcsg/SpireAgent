#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const requirements = JSON.parse(readFileSync(path.join(root, "connector-requirements.json"), "utf8"));
const clientRoot = path.join(root, "Re-SpireAgent/node_modules/@rsgcsg/sts2-connector-client");
const result = {
  status: "action_required",
  node: process.version,
  agent_dependencies_installed: existsSync(clientRoot),
  agent_local_config_present: existsSync(path.join(root, "Re-SpireAgent/.env.local")),
  requirements,
  loaded_connector: null,
  next_steps: []
};

if (!result.agent_dependencies_installed) result.next_steps.push("Run npm run bootstrap.");
if (!result.agent_local_config_present) result.next_steps.push("Create Re-SpireAgent/.env.local from .env.example.");

if (result.agent_dependencies_installed) {
  const { PlayerEnvironmentRestClient } = await import(
    pathToFileURL(path.join(clientRoot, "dist/index.js")).href
  );
  try {
    const connector = new PlayerEnvironmentRestClient(
      process.env.STS2_API_URL ?? "http://127.0.0.1:15526",
      2_000
    );
    const capabilities = (await connector.capabilities()).data;
    result.loaded_connector = {
      protocol: capabilities.protocol_version,
      host_version: capabilities.host.version,
      sha256: capabilities.host.implementation.artifact_sha256 ?? null,
      mvid: capabilities.host.implementation.module_version_id ?? null,
      runtime_instance_id: capabilities.host.runtime_instance_id,
      game: capabilities.game,
      execution_available: capabilities.execution_available
    };
    if (!requirements.protocol.accepted.includes(capabilities.protocol_version)) {
      result.next_steps.push(`Install a Connector using protocol ${requirements.protocol.accepted.join(" or ")}.`);
    } else if (!capabilities.execution_available) {
      result.next_steps.push("Resolve the Connector runtime blockers before starting Re.");
    }
  } catch (error) {
    result.next_steps.push(`Start STS2 with a compatible STS2 Connector (${error instanceof Error ? error.message : String(error)}).`);
  }
}

if (result.next_steps.length === 0) {
  result.status = "ready";
  result.next_steps.push("Run cd Re-SpireAgent && npm run agent:run.");
}
console.log(JSON.stringify(result, null, 2));
