import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = path.join(
  root,
  "STS2MCP/docs/bridge-v2/CLEAN_CLOSURE_DELETION_INVENTORY.json"
);
const protocolPath = path.join(root, "STS2MCP/BridgeV2/Protocol/BridgeContracts.cs");
const catalogPath = path.join(
  root,
  "STS2MCP/BridgeV2/Runtime/operation-qualification-contracts.json"
);
const runtimePath = path.join(root, "STS2MCP/BridgeV2/Runtime/BridgeV2Runtime.cs");
const identityPath = path.join(
  root,
  "STS2MCP/BridgeV2/Runtime/BridgeCurrentIdentityProjectionBuilder.cs"
);
const reStatePath = path.join(root, "Re-SpireAgent/src/domain/state/common.ts");
const reNormalizerPath = path.join(
  root,
  "Re-SpireAgent/src/normalization/normalizeBridgeV2CurrentState.ts"
);

const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const protocolSource = await readFile(protocolPath, "utf8");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const runtimeSource = await readFile(runtimePath, "utf8");
const identitySource = await readFile(identityPath, "utf8");
const reStateSource = await readFile(reStatePath, "utf8");
const reNormalizerSource = await readFile(reNormalizerPath, "utf8");

const protocol = protocolSource.match(/ProtocolVersion\s*=\s*"([^"]+)"/u)?.[1];
if (inventory.schema_version !== 1) fail("unsupported inventory schema");
if (!protocol || inventory.source_protocol !== protocol) {
  fail("source protocol drift");
}
if (inventory.current.explicit_native_contract_count !== catalog.contracts.length) {
  fail("explicit contract count drift");
}
if (inventory.current.explicit_contract_digest_admission_count !== catalog.contracts.length) {
  fail("explicit contract admission count drift");
}

const connectorShadowCount = count(
  protocolSource + reStateSource + reNormalizerSource,
  /BridgeContractInstanceShadow|BridgeObservationIdentityShadow|contract_instance_shadow|identity_shadow|bridgeContractInstanceShadow/gu
);
if (connectorShadowCount !== inventory.current.connector_shadow_count) {
  fail(`connector shadow count drift: ${connectorShadowCount}`);
}

const publicationPathCount = count(runtimeSource, /Actions\[actionId\]\s*=\s*new RegisteredBridgeAction/gu);
if (publicationPathCount !== inventory.current.production_action_publication_path_count) {
  fail(`production action publication path drift: ${publicationPathCount}`);
}
if (/PermissionManager\.Snapshot|QualificationStore\.Snapshot/gu.test(identitySource)) {
  fail("control history re-entered current state identity");
}
if (!identitySource.includes("semanticStateId")
    || !identitySource.includes("authorityProjectionId")) {
  fail("formal semantic/authority identity split is missing");
}
if (inventory.current.connector_shadow_count !== inventory.target.connector_shadow_count
    || inventory.current.permanent_dual_read_path_count
      !== inventory.target.permanent_dual_read_path_count
    || inventory.current.production_action_publication_path_count
      !== inventory.target.production_action_publication_path_count
    || inventory.current.bulk_candidate_startup_path_count
      !== inventory.target.bulk_candidate_startup_path_count
    || inventory.current.re_native_completion_reconstruction_count
      !== inventory.target.re_native_completion_reconstruction_count
    || inventory.current.control_history_semantic_identity_input_count
      !== inventory.target.control_history_semantic_identity_input_count) {
  fail("a claimed closed structural metric drifted from its target");
}

if (process.argv.includes("--require-closed")
    && inventory.current.fallback_authority_contract_count
      !== inventory.target.fallback_authority_contract_count) {
  fail("Clean Closure is not complete: fallback authority contracts remain");
}

process.stdout.write(
  `Connector Clean Closure inventory OK: ${catalog.contracts.length} explicit contracts; `
  + `${inventory.current.fallback_authority_contract_count} fallback authority contracts remain.\n`
);

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function fail(message) {
  throw new Error(`Connector Clean Closure check failed: ${message}`);
}
