import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = path.join(root, "STS2MCP/docs/bridge-v2/OPERATION_RETIREMENT_INVENTORY.json");
const legacySourcePath = path.join(root, "archive/legacy-connector-v1/McpMod.Actions.cs");
const activeLegacySourcePaths = [
  "McpMod.Actions.cs",
  "McpMod.MultiplayerActions.cs",
  "McpMod.StateBuilder.cs",
  "McpMod.MultiplayerState.cs",
  "McpMod.Formatting.cs",
  "McpMod.Profile.cs",
  "McpMod.Compendium.cs",
  "McpMod.Wiki.cs"
].map((name) => path.join(root, "STS2MCP", name));
const gatewayHostPath = path.join(root, "STS2MCP/McpMod.cs");
const legacyRoutePolicyPath = path.join(root, "STS2MCP/LegacyV1RoutePolicy.cs");
const mcpServerPath = path.join(root, "STS2MCP/mcp/server.py");
const manifestPath = path.join(root, "STS2MCP/BridgeV2/Runtime/BridgeContractManifest.cs");

const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const legacySource = await readFile(legacySourcePath, "utf8");
const gatewayHostSource = await readFile(gatewayHostPath, "utf8");
const legacyRoutePolicySource = await readFile(legacyRoutePolicyPath, "utf8");
const mcpServerSource = await readFile(mcpServerPath, "utf8");
const manifestSource = await readFile(manifestPath, "utf8");

if (inventory.schema_version !== 2) fail("unsupported inventory schema_version");
if (inventory.gate_1_status !== "closed_bounded_v2_baseline") {
  fail("gate_1_status must name the bounded Gate 1 closeout");
}
if (inventory.gate_1_runtime_seal !== "pending_preview61_neows_fury_organic_lifecycle") {
  fail("Gate 1 runtime seal must remain pending until Neow's Fury is organically exercised");
}
if (inventory.current_source_protocol !== "2.0-preview.61"
    || inventory.last_loaded_protocol !== "2.0-preview.61") {
  fail("source and loaded protocol evidence boundary drifted");
}
if (inventory.legacy_mutation_authority !== "retired") {
  fail("legacy_mutation_authority must remain retired");
}
if (inventory.legacy_get_compatibility !== "retired") {
  fail("legacy GET compatibility must remain retired");
}
if (inventory.default_mcp_action_transport !== "bridge_v2_only") {
  fail("default MCP action transport must remain Bridge v2-only");
}
if (gatewayHostSource.includes("enable_legacy_v1_mutations")) {
  fail("Gateway config must not contain a v1 mutation re-enable switch");
}
if (activeLegacySourcePaths.some((sourcePath) => existsSync(sourcePath))) {
  fail("retired v1 state or mutation source remains in the active Gateway build");
}
if (!gatewayHostSource.includes("Legacy v1 is retired")) {
  fail("Gateway host must return an explicit retired response for v1");
}
if (!legacyRoutePolicySource.includes("IsRetiredPath")) {
  fail("legacy v1 route policy must retire the entire v1 namespace");
}
if (mcpServerSource.includes("/api/v1/")) {
  fail("default MCP adapter must not route through v1");
}
if (!Array.isArray(inventory.legacy_dispatch_actions)) fail("legacy_dispatch_actions must be an array");

const dispatchBlock = legacySource.match(/return action switch\s*\{([\s\S]*?)\n\s*_ =>/u)?.[1];
if (!dispatchBlock) fail("could not locate the single-player legacy action switch");

const sourceActions = [...dispatchBlock.matchAll(/"([a-z][a-z0-9_]*)"\s*=>\s*Execute/gu)]
  .map((match) => match[1])
  .sort();
const inventoryActions = inventory.legacy_dispatch_actions
  .map((entry) => entry.legacy_action)
  .sort();

assertUnique(inventoryActions, "legacy_action");
assertSameSet(sourceActions, inventoryActions, "single-player legacy dispatch actions");

const allowedDispositions = new Set([
  "v2_same_semantics",
  "v2_purpose_split",
  "partial_v2",
  "fail_closed",
  "out_of_scope"
]);
for (const entry of [...inventory.legacy_dispatch_actions, ...(inventory.other_legacy_boundaries ?? [])]) {
  if (!allowedDispositions.has(entry.disposition)) {
    fail(`unknown disposition for ${entry.legacy_action ?? entry.legacy_operation}`);
  }
  if (!Array.isArray(entry.v2_operations)) {
    fail(`v2_operations must be an array for ${entry.legacy_action ?? entry.legacy_operation}`);
  }
  if (entry.disposition === "fail_closed" && entry.v2_operations.length > 0) {
    fail(`fail_closed entry cannot claim v2 operations: ${entry.legacy_action ?? entry.legacy_operation}`);
  }
  for (const operation of entry.v2_operations) {
    if (!manifestSource.includes(`"${operation}"`)) {
      fail(`mapped v2 operation is absent from BridgeContractManifest: ${operation}`);
    }
  }
}

process.stdout.write(
  `Connector operation inventory OK: v1 namespace retired; ${sourceActions.length} historical dispatch actions accounted for.\n`
);

function assertUnique(values, label) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) fail(`duplicate ${label}: ${[...new Set(duplicates)].join(", ")}`);
}

function assertSameSet(expected, actual, label) {
  const missing = expected.filter((value) => !actual.includes(value));
  const extra = actual.filter((value) => !expected.includes(value));
  if (missing.length > 0 || extra.length > 0) {
    fail(`${label} drifted; missing=[${missing.join(", ")}], extra=[${extra.join(", ")}]`);
  }
}

function fail(message) {
  throw new Error(`Connector operation inventory check failed: ${message}`);
}
