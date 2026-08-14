#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const failures = [];
const requirements = JSON.parse(readFileSync(path.join(root, "connector-requirements.json"), "utf8"));
const agentPackage = JSON.parse(readFileSync(path.join(root, "Re-SpireAgent/package.json"), "utf8"));
const clientRoot = path.join(root, "Re-SpireAgent/node_modules/@rsgcsg/sts2-connector-client");

const trackedConnectorSource = execFileSync("git", ["ls-files", "STS2MCP"], {
  cwd: root,
  encoding: "utf8"
}).trim();
if (trackedConnectorSource) failures.push("SpireAgent still owns a tracked STS2MCP source tree");
if (existsSync(path.join(root, "contracts/player-environment-contract.json"))) {
  failures.push("SpireAgent still owns a duplicate Player Environment contract");
}

const dependency = agentPackage.dependencies?.[requirements.client.package];
if (dependency !== requirements.client.package_url) {
  failures.push(`Re dependency ${String(dependency)} does not match the declared immutable release asset`);
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
