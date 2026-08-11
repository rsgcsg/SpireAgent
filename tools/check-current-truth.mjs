#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function read(relative) {
  return readFileSync(path.join(workspace, relative), "utf8");
}

function capture(relative, pattern, label) {
  const match = read(relative).match(pattern);
  if (!match) {
    failures.push(`${relative}: missing ${label}`);
    return null;
  }
  return match[1];
}

const protocolDeclarations = [
  [
    "STS2MCP/HumanEnvironment/Protocol/HumanEnvironmentContracts.cs",
    /ProtocolVersion\s*=\s*"([^"]+)"/u,
    "C# protocol"
  ],
  [
    "Re-SpireAgent/src/integrations/sts2mcp/humanEnvironmentProtocol.ts",
    /SUPPORTED_HUMAN_ENVIRONMENT_PROTOCOL\s*=\s*"([^"]+)"/u,
    "Re protocol"
  ],
  ["README.md", /Source protocol is\s*`([^`]+)`/u, "README protocol"],
  ["docs/current/STATUS.md", /Current source protocol is `([^`]+)`/u, "status protocol"],
  ["STS2MCP/docs/human-environment/PROTOCOL.md", /Source protocol: `([^`]+)`/u, "protocol doc"],
  ["Re-SpireAgent/docs/HUMAN_ENVIRONMENT_INTEGRATION.md", /strictly accepts `([^`]+)`/u, "Re coverage protocol"]
];
const protocols = protocolDeclarations.map(([relative, pattern, label]) => ({
  relative,
  protocol: capture(relative, pattern, label)
}));
const expected = protocols[0].protocol;
for (const declaration of protocols) {
  if (declaration.protocol && declaration.protocol !== expected) {
    failures.push(`${declaration.relative}: ${declaration.protocol} != ${expected}`);
  }
}

const status = read("docs/current/STATUS.md");
if (/Fixed repository HEAD:/u.test(status)) {
  failures.push("docs/current/STATUS.md: mutable current status must not hard-code a repository HEAD");
}
if (!/Per-machine Deployment Truth/iu.test(status)) {
  failures.push("docs/current/STATUS.md: missing per-machine deployment truth boundary");
}

const setup = read("docs/current/LOCAL_SETUP.md");
for (const stale of [
  "git switch develop",
  "git pull --ff-only origin develop",
  "/api/v2/capabilities",
  "/api/v2/state",
  "Re negotiates `bridge_v2`",
  "It forwards the v2 Gateway contract"
]) {
  if (setup.includes(stale)) failures.push(`docs/current/LOCAL_SETUP.md: stale deployment instruction: ${stale}`);
}
for (const required of ["npm run bootstrap", "npm run doctor", "npm run deploy", "npm run verify:loaded"]) {
  if (!setup.includes(required)) failures.push(`docs/current/LOCAL_SETUP.md: missing canonical command ${required}`);
}

const documentMap = read("docs/current/DOCUMENT_MAP.md");
if (!documentMap.includes("DEVELOPMENT_MODEL.md")) {
  failures.push("docs/current/DOCUMENT_MAP.md: development model is not indexed");
}
for (const required of ["HUMAN_ENVIRONMENT_NEW_ENGINEER_GUIDE.md", "HUMAN_INFORMATION_CLOSURE.md"]) {
  if (!documentMap.includes(required)) failures.push(`docs/current/DOCUMENT_MAP.md: missing ${required}`);
}

for (const [relative, staleTerms] of [
  ["README.md", ["Human-Equivalent", "1.0-preview.5", "temporary freeze"]],
  ["docs/current/STATUS.md", ["Human-Equivalent", "1.0-preview.5", "temporary freeze", "five V3"]],
  ["docs/current/ARCHITECTURE.md", ["Human-Equivalent", "1.0-preview.5", "Temporary Freeze Scope", "five bounded V3"]],
  ["docs/current/REPOSITORY_INVENTORY.md", ["STS2MCP/HumanEquivalent/", "STS2MCP/ConnectorV3/", "STS2MCP/BridgeV2/"]]
]) {
  const current = read(relative);
  for (const stale of staleTerms) {
    if (current.includes(stale)) failures.push(`${relative}: stale current-truth term ${stale}`);
  }
}

if (failures.length > 0) {
  console.error(["Current-truth checks failed:", ...failures.map((failure) => `- ${failure}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log(`current-truth checks passed (${expected})`);
}
