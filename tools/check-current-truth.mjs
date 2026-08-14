#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const failures = [];
const read = (relative) => readFileSync(path.join(root, relative), "utf8");
const isTracked = (relative) => execFileSync("git", ["ls-files", "--error-unmatch", relative], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"]
}).trim().length > 0;

for (const forbidden of [
  "STS2MCP",
  "contracts/player-environment-contract.json",
  "tools/connector.mjs"
]) {
  try {
    if (isTracked(forbidden)) failures.push(`active C ownership remains at ${forbidden}`);
  } catch {
    // Untracked local residues are not repository ownership.
  }
}

const requirements = JSON.parse(read("connector-requirements.json"));
const status = read("docs/current/STATUS.md");
if (/Fixed repository HEAD:/u.test(status)) failures.push("mutable current status hard-codes a repository HEAD");
if (!status.includes(requirements.client.package) || !status.includes(requirements.protocol.accepted[0])) {
  failures.push("current status does not match machine Connector requirements");
}

const currentFiles = [...walk(path.join(root, "docs/current"))]
  .filter((file) => file.endsWith(".md"));
for (const file of currentFiles) {
  const text = readFileSync(file, "utf8");
  for (const stale of ["STS2MCP/", "tools/connector.mjs", "contracts/player-environment-contract.json"]) {
    if (text.includes(stale)) failures.push(`${path.relative(root, file)} contains retired ownership ${stale}`);
  }
}

for (const duplicate of [
  "Re-SpireAgent/src/integrations/sts2Connector/playerEnvironmentProtocol.ts",
  "Re-SpireAgent/src/integrations/sts2Connector/playerEnvironmentClient.ts",
  "Re-SpireAgent/src/integrations/sts2Connector/controllerSession.ts",
  "Re-SpireAgent/src/integrations/sts2Connector/playerVisibleStateProtocol.ts"
]) {
  if (existsSync(path.join(root, duplicate))) failures.push(`duplicate Connector SDK truth remains at ${duplicate}`);
}

if (failures.length) {
  console.error(["Current-truth checks failed:", ...failures.map((item) => `- ${item}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log(`current-truth checks passed (${currentFiles.length} current documents)`);
}

function* walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}
