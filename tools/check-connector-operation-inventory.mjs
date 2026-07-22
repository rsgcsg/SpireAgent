import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = path.join(root, "STS2MCP/docs/bridge-v2/OPERATION_RETIREMENT_INVENTORY.json");
const legacySourcePath = path.join(root, "STS2MCP/McpMod.Actions.cs");
const manifestPath = path.join(root, "STS2MCP/BridgeV2/Runtime/BridgeContractManifest.cs");

const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const legacySource = await readFile(legacySourcePath, "utf8");
const manifestSource = await readFile(manifestPath, "utf8");

if (inventory.schema_version !== 1) fail("unsupported inventory schema_version");
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
  `Connector operation inventory OK: ${sourceActions.length} legacy dispatch actions accounted for.\n`
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
