#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(workspace, relative), "utf8");
const inventory = JSON.parse(read("contracts/human-environment-contract.json"));
const csharp = read("STS2MCP/HumanEnvironment/Protocol/HumanEnvironmentContracts.cs");
const runtime = read("STS2MCP/HumanEnvironment/Runtime/HumanEnvironmentRuntime.cs");
const typescript = read("Re-SpireAgent/src/integrations/sts2mcp/humanEnvironmentProtocol.ts");
const transport = read("STS2MCP/McpMod.cs");
const python = read("STS2MCP/mcp/server.py");
const failures = [];

function requireIn(source, value, owner) {
  if (!source.includes(value)) failures.push(`${owner}: missing ${value}`);
}

requireIn(csharp, `ProtocolVersion = "${inventory.protocol_version}"`, "C# contract");
requireIn(typescript, `SUPPORTED_HUMAN_ENVIRONMENT_PROTOCOL = "${inventory.protocol_version}"`, "Re contract");
requireIn(python, `_CONTROL_PROTOCOL = "${inventory.protocol_version}"`, "MCP adapter");

for (const schema of Object.values(inventory.schemas)) {
  requireIn(csharp, schema, "C# contract");
  if (schema !== inventory.schemas.native_page_evidence) {
    requireIn(typescript, schema, "Re contract");
  }
}

const actionEnum = typescript.match(/const actionVerbSchema = z\.enum\(\[([\s\S]*?)\]\);/u)?.[1] ?? "";
const reActions = [...actionEnum.matchAll(/"([a-z_]+)"/gu)].map((match) => match[1]).sort();
const expectedActions = [...inventory.action_verbs].sort();
if (JSON.stringify(reActions) !== JSON.stringify(expectedActions)) {
  failures.push(`Re action verbs differ: expected ${expectedActions.join(", ")}; actual ${reActions.join(", ")}`);
}
for (const action of expectedActions) requireIn(runtime, `"${action}"`, "C capability inventory");

for (const route of Object.values(inventory.routes)) {
  const concrete = route.replace("/{read_id}", "/");
  requireIn(transport, concrete, "C REST transport");
}
for (const tag of inventory.interaction_content.required_tags) {
  const [container, field] = tag.split(".");
  requireIn(typescript, `${container}: z.object({ ${field}:`, "Re interaction content envelope");
}
for (const profile of inventory.evidence_profiles) {
  requireIn(csharp, `NativePageEvidenceProfile = "${profile.id}"`, "C evidence profile");
  requireIn(typescript, "creates_mutation_authority: z.literal(false)", "Re evidence profile");
}

if (failures.length > 0) {
  console.error(["Human Environment contract checks failed:", ...failures.map((item) => `- ${item}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("human-environment contract checks passed");
}
