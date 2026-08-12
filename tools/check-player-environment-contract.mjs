#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(workspace, relative), "utf8");
const contract = JSON.parse(read("contracts/player-environment-contract.json"));
const csharp = read("STS2MCP/PlayerEnvironment/Protocol/PlayerEnvironmentContracts.cs");
const service = read("STS2MCP/PlayerEnvironment/Core/PlayerEnvironmentService.cs");
const projection = read("STS2MCP/PlayerEnvironment/Projection/BoundActionProjection.cs");
const submission = read("STS2MCP/PlayerEnvironment/Execution/ActionSubmission.cs");
const reads = read("STS2MCP/PlayerEnvironment/Reads/ReadService.cs")
  + read("STS2MCP/LiveHost/PlayerVisibleReadBuilder.cs");
const typescript = read("Re-SpireAgent/src/integrations/sts2mcp/playerEnvironmentProtocol.ts");
const client = read("Re-SpireAgent/src/integrations/sts2mcp/playerEnvironmentClient.ts");
const transport = read("STS2MCP/McpMod.cs")
  + read("STS2MCP/PlayerEnvironment/Transport/McpMod.PlayerEnvironment.cs")
  + read("STS2MCP/LegacyV1RoutePolicy.cs");
const python = read("STS2MCP/mcp/server.py");
const failures = [];

function requireIn(source, value, owner) {
  if (!source.includes(value)) failures.push(`${owner}: missing ${value}`);
}

requireIn(csharp, `ProtocolVersion = "${contract.protocol_version}"`, "C# protocol");
requireIn(typescript, `SUPPORTED_PLAYER_ENVIRONMENT_PROTOCOL = "${contract.protocol_version}"`, "Re protocol");
requireIn(python, `_CONTROL_PROTOCOL = "${contract.protocol_version}"`, "Python transport");

for (const schema of Object.values(contract.schemas)) {
  requireIn(csharp + projection, schema, "C# schemas");
  if (schema !== contract.schemas.native_page_evidence) requireIn(typescript, schema, "Re schemas");
}

const verbBody = typescript.match(/const verbSchema = z\.enum\(\[([\s\S]*?)\]\);/u)?.[1] ?? "";
const actualVerbs = [...verbBody.matchAll(/"([a-z_]+)"/gu)].map((match) => match[1]).sort();
const expectedVerbs = [...contract.action_verbs].sort();
if (JSON.stringify(actualVerbs) !== JSON.stringify(expectedVerbs)) {
  failures.push(`Re verbs differ: expected ${expectedVerbs.join(", ")}; actual ${actualVerbs.join(", ")}`);
}
for (const verb of expectedVerbs) requireIn(service, `"${verb}"`, "C capability verbs");

for (const [name, route] of Object.entries(contract.routes)) {
  const prefix = route.replace("/{read_id}", "/").replace("/{request_id}", "/");
  const transportPrefix = name.startsWith("controller_") && name !== "controller_snapshot"
    ? "/api/player-environment/controller/"
    : prefix;
  requireIn(transport, transportPrefix, `C route ${name}`);
  if (["capabilities", "snapshot", "read", "submit_action", "action_receipt", "register_client", "controller_acquire", "controller_renew", "controller_release"].includes(name)) {
    const clientPrefix = prefix.endsWith("/") ? prefix : route;
    requireIn(client, clientPrefix, `Re route ${name}`);
  }
}

for (const field of contract.snapshot_contract.required_fields) {
  requireIn(typescript, `${field}:`, `Re snapshot field ${field}`);
}
requireIn(csharp, "PlayerEnvironmentInformationPolicy", "C information policy");
requireIn(typescript, "information_policy:", "Re information policy");
requireIn(typescript, "surface: z.object({ kind:", "tagged surface content");
requireIn(typescript, "context: z.object({ kind:", "tagged context content");

for (const kind of Object.keys(contract.read_kinds)) requireIn(reads, `"${kind}"`, `read kind ${kind}`);
for (const state of contract.delivery_contract.states) requireIn(submission, `"${state}"`, `delivery state ${state}`);
requireIn(typescript, 'value.delivery === "unknown" && value.retry.allowed', "unknown-no-retry schema");

for (const profile of contract.evidence_profiles) {
  requireIn(csharp, `NativePageEvidenceProfile = "${profile.id}"`, "native-page profile");
  requireIn(typescript, "creates_mutation_authority: z.literal(false)", "non-authorizing evidence profile");
}

for (const retired of contract.retired_current_routes) requireIn(transport, retired, `retired route ${retired}`);
requireIn(python, '_environment_get("snapshot")', "Python snapshot route");

if (failures.length > 0) {
  console.error(["Player Environment contract checks failed:", ...failures.map((item) => `- ${item}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("player-environment contract checks passed");
}
