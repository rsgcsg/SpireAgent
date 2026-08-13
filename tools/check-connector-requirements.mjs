#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const failures = [];
const requirements = JSON.parse(readFileSync(path.join(root, "connector-requirements.json"), "utf8"));
const agentPackage = JSON.parse(readFileSync(path.join(root, "Re-SpireAgent/package.json"), "utf8"));
const clientRoot = path.join(root, "Re-SpireAgent/node_modules/@rsgcsg/sts2-connector-client");

if (existsSync(path.join(root, "STS2MCP"))) failures.push("SpireAgent still owns an active STS2MCP source tree");
if (existsSync(path.join(root, "contracts/player-environment-contract.json"))) {
  failures.push("SpireAgent still owns a duplicate Player Environment contract");
}

const dependency = agentPackage.dependencies?.[requirements.client.package];
const acceptedDependency = new Set([
  requirements.client.version,
  "file:../../STS2-Connector/sdk/typescript"
]);
if (!acceptedDependency.has(dependency)) {
  failures.push(`Re dependency ${String(dependency)} does not match the released or explicit sibling development source`);
}
if (!existsSync(path.join(clientRoot, "package.json"))) {
  failures.push("Connector client package is not installed; run npm ci in Re-SpireAgent");
} else {
  const installed = JSON.parse(readFileSync(path.join(clientRoot, "package.json"), "utf8"));
  if (installed.name !== requirements.client.package || installed.version !== requirements.client.version) {
    failures.push(`Installed Connector client ${installed.name}@${installed.version} does not match requirements`);
  }
  const client = await import(pathToFileURL(path.join(clientRoot, "dist/index.js")).href);
  if (!requirements.protocol.accepted.includes(client.SUPPORTED_PLAYER_ENVIRONMENT_PROTOCOL)) {
    failures.push(`Client protocol ${client.SUPPORTED_PLAYER_ENVIRONMENT_PROTOCOL} is outside the accepted set`);
  }
}

if (failures.length) {
  console.error(["Connector consumer boundary checks failed:", ...failures.map((item) => `- ${item}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Connector consumer boundary checks passed (${requirements.client.package}@${requirements.client.version}; ${requirements.protocol.accepted.join(", ")})`
  );
}
