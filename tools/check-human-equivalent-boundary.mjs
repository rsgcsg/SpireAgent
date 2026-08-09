#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function read(relative) {
  return readFileSync(path.join(workspace, relative), "utf8");
}

function requireText(relative, text, label) {
  if (!read(relative).includes(text)) failures.push(`${relative}: missing ${label}`);
}

function forbidText(relative, text, label) {
  if (read(relative).includes(text)) failures.push(`${relative}: contains ${label}`);
}

const defaultReFiles = [
  "Re-SpireAgent/src/app/main.ts",
  "Re-SpireAgent/src/app/runtimeFactory.ts"
];
for (const relative of defaultReFiles) {
  requireText(relative, "Sts2HumanEquivalentAdapter", "Human-Equivalent default adapter");
  forbidText(relative, "Sts2ConnectorV3Adapter", "V3 default adapter");
  forbidText(relative, "connectorV3Protocol", "V3 wire dependency");
}

const humanClient = "Re-SpireAgent/src/integrations/sts2mcp/humanEquivalentClient.ts";
requireText(humanClient, "/api/he/observation", "HE observation route");
requireText(humanClient, "/api/he/actions", "HE action route");
requireText(humanClient, "/api/he/controller", "HE controller route");
forbidText(humanClient, "/api/v3/", "V3 transport fallback");
forbidText(humanClient, "connectorV3Protocol", "V3 controller/wire schema dependency");

const runtime = read("STS2MCP/HumanEquivalent/Runtime/HumanEquivalentRuntime.cs");
if (/EventDeckRemovalSelection\.TryBuild/u.test(runtime)) {
  failures.push("HumanEquivalentRuntime.cs: source-specific event-removal publication remains active");
}
if (!/HumanDeckCardSelectionAdapter\.TryBuild/u.test(runtime)) {
  failures.push("HumanEquivalentRuntime.cs: source-free deck selector is not in the HE discovery path");
}
if (!/CandidateAdmission\s*=\s*"human_ui"/u.test(runtime)) {
  failures.push("HumanEquivalentRuntime.cs: HE UI admission marker is missing");
}

const transport = read("STS2MCP/McpMod.cs");
for (const handler of [
  "HandlePostHumanEquivalentClientRegistration",
  "HandleGetHumanEquivalentControl",
  "HandlePostHumanEquivalentController"
]) {
  if (!transport.includes(handler)) failures.push(`STS2MCP/McpMod.cs: missing ${handler}`);
}

if (failures.length > 0) {
  console.error([
    "Human-Equivalent boundary checks failed:",
    ...failures.map((failure) => `- ${failure}`)
  ].join("\n"));
  process.exitCode = 1;
} else {
  console.log("human-equivalent boundary checks passed");
}
