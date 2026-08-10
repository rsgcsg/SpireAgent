#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
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
requireText(humanClient, "/api/he/reads/", "unified HE read route");
requireText(humanClient, "/api/he/controller", "HE controller route");
forbidText(humanClient, "/api/v3/", "V3 transport fallback");
forbidText(humanClient, "connectorV3Protocol", "V3 controller/wire schema dependency");
forbidText(humanClient, "?mode=", "C observation mode query");
for (const retired of [
  "Re-SpireAgent/src/integrations/sts2mcp/connectorV3Adapter.ts",
  "Re-SpireAgent/src/integrations/sts2mcp/connectorV3Client.ts"
]) {
  if (existsSync(path.join(workspace, retired))) {
    failures.push(`${retired}: retired V3 executor/transport remains in the Re production tree`);
  }
}
forbidText(
  "Re-SpireAgent/src/index.ts",
  "connectorV3Protocol",
  "public V3 wire export"
);
requireText(
  "Re-SpireAgent/src/integrations/sts2mcp/humanEquivalentAdapter.ts",
  'settlementAuthority: "adapter_confirmed"',
  "HE delivery-authoritative settlement boundary"
);
requireText(
  "Re-SpireAgent/src/integrations/sts2mcp/humanEquivalentAdapter.ts",
  'legalActionAuthority: "current_human_ui"',
  "HE adapter authority name"
);
forbidText(
  "Re-SpireAgent/src/integrations/sts2mcp/humanEquivalentAdapter.ts",
  'legalActionAuthority: "bridge_advertised"',
  "legacy Bridge authority name"
);

const pythonMcp = "STS2MCP/mcp/server.py";
requireText(pythonMcp, '_CONTROL_PROTOCOL = "1.0-preview.5"', "Human Environment MCP control protocol");
requireText(pythonMcp, 'f"reads/{encoded_read}', "unified MCP read route");
forbidText(pythonMcp, "inspections/", "split legacy inspection route");
forbidText(pythonMcp, "linked-details/", "split legacy linked-detail route");
for (const legacyMcpInput of [
  "expected_frame_id",
  "expected_owner_id",
  "parameters_json",
  "?mode=",
  "sts2.connector.v3/control-1"
]) {
  forbidText(pythonMcp, legacyMcpInput, `legacy MCP input ${legacyMcpInput}`);
}

const humanProtocol = "Re-SpireAgent/src/integrations/sts2mcp/humanEquivalentProtocol.ts";
for (const legacyWireField of [
  "optional_annotations",
  "state_token",
  "persistent_state",
  "target_id",
  "entities",
  "controls",
  "inspection_catalog",
  "linked_detail_catalog",
  "sts2.connector.human-ui",
  "expected_frame_id",
  "expected_owner_id",
  "parameter_domains",
  "frame_bound"
]) {
  forbidText(humanProtocol, legacyWireField, `legacy HE wire field ${legacyWireField}`);
}
forbidText("tools/connector.mjs", "surface?.facts", "legacy HE Surface facts lookup");
forbidText(
  "Re-SpireAgent/src/domain/state/surfaces.ts",
  "authorizationEffect",
  "D annotation embedded in the C/A UI surface"
);
const humanNormalizer = "Re-SpireAgent/src/normalization/normalizeHumanEquivalentCurrentState.ts";
forbidText(humanNormalizer, "legalActions", "legacy action model in the HE normalizer");
requireText(humanNormalizer, "bound_actions", "HE-native finite bound-action projection");
if (existsSync(path.join(workspace, "Re-SpireAgent/src/runtime/settlementWatcher.ts"))) {
  failures.push("Re-SpireAgent/src/runtime/settlementWatcher.ts: legacy business-settlement owner remains");
}
requireText(
  "Re-SpireAgent/src/runtime/successorWatcher.ts",
  "waitForReadySuccessor",
  "A successor-readiness owner"
);

const runtime = read("STS2MCP/HumanEquivalent/Runtime/HumanEquivalentRuntime.cs");
if (/partial class ConnectorV3Runtime/u.test(runtime)
    || /namespace STS2_MCP\.ConnectorV3\.Runtime/u.test(runtime)) {
  failures.push("HumanEquivalentRuntime.cs: HE remains owned by ConnectorV3Runtime");
}
const contract = read("STS2MCP/HumanEquivalent/Protocol/HumanEquivalentContracts.cs");
for (const legacyNamespace of [
  "STS2_MCP.BridgeV2",
  "STS2_MCP.ConnectorV3"
]) {
  if (contract.includes(legacyNamespace)) {
    failures.push(`HumanEquivalentContracts.cs: public environment contract imports ${legacyNamespace}`);
  }
}
for (const requiredContractName of [
  "HumanEnvironmentInteraction",
  "HumanEnvironmentReferent",
  "HumanEnvironmentBoundActionArgument",
  "HumanEnvironmentReadOpportunity",
  "HumanEnvironmentSessionReference",
  "HumanEnvironmentImplementationIdentity",
  "HumanEnvironmentContent",
  "EnvironmentFingerprint",
  "ContentSchema",
  "SnapshotId",
  "TargetReferentId"
]) {
  if (!contract.includes(requiredContractName)) {
    failures.push(`HumanEquivalentContracts.cs: missing ${requiredContractName}`);
  }
}
for (const retiredContractName of [
  "HumanEquivalentUiEntity",
  "HumanEquivalentUiControl",
  "BridgeServerIdentity",
  "GameBuildIdentity",
  "BusinessSourceRequired",
  "BusinessOutcomeRequired"
]) {
  if (contract.includes(retiredContractName)) {
    failures.push(`HumanEquivalentContracts.cs: public contract retains ${retiredContractName}`);
  }
}
for (const legacyContractName of [
  "HumanEquivalentFrame",
  "HumanEquivalentAnnotationEnvelope",
  "ExpectedFrameId",
  "ExpectedOwnerId",
  "ParameterDomains"
]) {
  if (contract.includes(legacyContractName)) {
    failures.push(`HumanEquivalentContracts.cs: contains retired ${legacyContractName}`);
  }
}
if (/EventDeckRemovalSelection\.TryBuild/u.test(runtime)) {
  failures.push("HumanEquivalentRuntime.cs: source-specific event-removal publication remains active");
}
if (!/HumanDeckCardSelectionAdapter\.TryBuild/u.test(runtime)) {
  failures.push("HumanEquivalentRuntime.cs: source-free deck selector is not in the HE discovery path");
}
if (!/HumanCombatPileSelectionAdapter\.TryBuild/u.test(runtime)) {
  failures.push("HumanEquivalentRuntime.cs: source-free combat-pile selector is not in the HE discovery path");
}
if (/CombatPileSelectionSourceBinding|CombatPileSourceContractRegistry/u.test(
  read("STS2MCP/HumanEquivalent/Runtime/HumanCombatPileSelectionAdapter.cs")
)) {
  failures.push("HumanCombatPileSelectionAdapter.cs: business source authority leaked into HE");
}
if (!/CandidateAdmission\s*=\s*"human_ui"/u.test(runtime)) {
  failures.push("HumanEquivalentRuntime.cs: HE UI admission marker is missing");
}
if (/RemoveBusinessKeys/u.test(runtime)) {
  failures.push("HumanEquivalentRuntime.cs: legacy business-key deny-list defines C facts");
}
if (!/ProjectHumanFacts/u.test(runtime)) {
  failures.push("HumanEquivalentRuntime.cs: positive HE fact projection is missing");
}
const connectorV3Seams = [...runtime.matchAll(/ConnectorV3Runtime\.(\w+)/gu)]
  .map((match) => match[1])
  .sort();
const expectedConnectorV3Seams = [
  "BuildBindings",
  "BuildNativeBinding",
  "BuildSnapshot",
  "StartNativeUiInput",
  "SuppressForNativePageEvidence"
].sort();
if (connectorV3Seams.join("\n") !== expectedConnectorV3Seams.join("\n")) {
  failures.push([
    "HumanEquivalentRuntime.cs: legacy adapter-library seam changed",
    `expected ${expectedConnectorV3Seams.join(", ")}`,
    `actual ${connectorV3Seams.join(", ") || "none"}`
  ].join("; "));
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
