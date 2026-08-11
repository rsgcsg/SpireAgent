#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const read = (relative) => readFileSync(path.join(workspace, relative), "utf8");
const requireText = (relative, value, label) => {
  if (!read(relative).includes(value)) failures.push(`${relative}: missing ${label}`);
};
const forbidText = (relative, value, label) => {
  if (read(relative).includes(value)) failures.push(`${relative}: contains ${label}`);
};

const runtimeFactory = "Re-SpireAgent/src/app/runtimeFactory.ts";
requireText(runtimeFactory, "Sts2HumanEnvironmentAdapter", "current Human Environment adapter");
requireText(runtimeFactory, "normalizeHumanEnvironmentCurrentState", "direct current normalizer");
requireText(runtimeFactory, "buildAllowedActions: buildHumanEnvironmentAllowedActions", "isolated current action projection");
forbidText(runtimeFactory, "Sts2ConnectorV3Adapter", "V3 production adapter");
forbidText(runtimeFactory, "buildAllowedActions,", "mixed legacy action builder in current runtime");

const humanClient = "Re-SpireAgent/src/integrations/sts2mcp/humanEnvironmentClient.ts";
for (const route of ["/api/he/observation", "/api/he/actions", "/api/he/reads/", "/api/he/controller"]) {
  requireText(humanClient, route, `current route ${route}`);
}
forbidText(humanClient, "/api/v3/", "V3 transport fallback");
forbidText(humanClient, "connectorV3Protocol", "V3 schema dependency");

for (const retired of [
  "Re-SpireAgent/src/integrations/sts2mcp/humanEquivalentAdapter.ts",
  "Re-SpireAgent/src/integrations/sts2mcp/humanEquivalentClient.ts",
  "Re-SpireAgent/src/integrations/sts2mcp/humanEquivalentProtocol.ts",
  "Re-SpireAgent/src/normalization/normalizeHumanEquivalentCurrentState.ts",
  "STS2MCP/HumanEquivalent",
  "STS2MCP/ConnectorV3/Runtime/ConnectorV3HumanEquivalence.cs"
]) {
  if (existsSync(path.join(workspace, retired))) failures.push(`${retired}: retired current-path name remains`);
}

const protocol = "Re-SpireAgent/src/integrations/sts2mcp/humanEnvironmentProtocol.ts";
requireText(protocol, 'SUPPORTED_HUMAN_ENVIRONMENT_PROTOCOL = "1.0-preview.6"', "current protocol");
requireText(protocol, "interactionContentSchema", "tagged interaction content envelope");
requireText(protocol, "evidence_profiles", "evidence profile capability decoding");
for (const legacyField of [
  "optional_annotations", "state_token", "persistent_state", "target_id",
  "inspection_catalog", "linked_detail_catalog", "expected_frame_id",
  "expected_owner_id", "parameter_domains", "frame_bound"
]) forbidText(protocol, legacyField, `legacy wire field ${legacyField}`);

const normalizer = "Re-SpireAgent/src/normalization/normalizeHumanEnvironmentCurrentState.ts";
requireText(normalizer, "bound_actions", "host-published finite action projection");
forbidText(normalizer, "legalActions", "legacy local action model");

const rawState = "Re-SpireAgent/src/integrations/sts2mcp/rawState.ts";
requireText(rawState, "HumanEnvironmentRawState", "current untrusted transport type");
for (const legacy of ["BridgeV2", "ConnectorV3", "bridge_v2", "connector_v3"]) {
  forbidText(rawState, legacy, `legacy wrapper ${legacy}`);
}

const publicIndex = "Re-SpireAgent/src/index.ts";
requireText(publicIndex, "normalizeHumanEnvironmentCurrentState", "current public normalizer");
forbidText(publicIndex, "normalizeCurrentState", "retired protocol-selecting public normalizer");
forbidText(publicIndex, "buildAllowedActions.js", "retired local action-generation export");

const productionTsconfig = "Re-SpireAgent/tsconfig.json";
for (const retiredModule of [
  "src/domain/actions/buildAllowedActions.ts",
  "src/integrations/sts2mcp/bridgeV2Client.ts",
  "src/integrations/sts2mcp/bridgeV2Protocol.ts",
  "src/integrations/sts2mcp/connectorV3Projection.ts",
  "src/integrations/sts2mcp/connectorV3Protocol.ts",
  "src/integrations/sts2mcp/hybridAdapter.ts",
  "src/integrations/sts2mcp/legacyRawState.ts",
  "src/normalization/normalizeBridgeV2CurrentState.ts",
  "src/normalization/normalizeConnectorV3CurrentState.ts",
  "src/normalization/normalizeCurrentState.ts"
]) requireText(productionTsconfig, retiredModule, `production exclusion ${retiredModule}`);

const contract = "STS2MCP/HumanEnvironment/Protocol/HumanEnvironmentContracts.cs";
forbidText(contract, "STS2_MCP.BridgeV2", "Bridge namespace in public C contract");
forbidText(contract, "STS2_MCP.ConnectorV3", "V3 namespace in public C contract");
for (const name of [
  "HumanEnvironmentInteraction", "HumanEnvironmentInteractionContent",
  "HumanEnvironmentReferent", "HumanEnvironmentBoundAction",
  "HumanEnvironmentReadOpportunity", "HumanEnvironmentSessionReference",
  "HumanEnvironmentEvidenceProfile", "SnapshotId", "ContentSchema"
]) requireText(contract, name, `public contract ${name}`);

const runtimeFiles = [
  "STS2MCP/HumanEnvironment/Runtime/HumanEnvironmentRuntime.cs",
  "STS2MCP/HumanEnvironment/Runtime/HumanEnvironmentObservationRuntime.cs",
  "STS2MCP/HumanEnvironment/Runtime/HumanEnvironmentReadRuntime.cs",
  "STS2MCP/HumanEnvironment/Runtime/HumanEnvironmentActionRuntime.cs",
  "STS2MCP/HumanEnvironment/Runtime/HumanEnvironmentConsumerProjection.cs",
  "STS2MCP/HumanEnvironment/Runtime/HumanEnvironmentNativePageEvidence.cs"
];
const runtime = runtimeFiles.map(read).join("\n");
for (const retiredSeam of [
  "ConnectorV3Runtime", "BridgeV2Runtime", "BuildNativeBinding", "SuppressForNativePageEvidence",
  "provider_native_binding_adapter", "bridge_v2_action",
  "v2_consumer_projection_sidecar", "native_direct_resolver",
  "human_ui_native_adapter", "v3cmd_"
]) {
  if (runtime.includes(retiredSeam)) failures.push(`Human Environment runtime contains retired seam ${retiredSeam}`);
}
for (const required of [
  "NativeUiActionRuntime", "MutationControlRuntime", "SnapshotIdentityTracker",
  "ProjectBoundActions", "BuildHumanEnvironmentSnapshot", "HumanReceipt"
]) {
  if (!runtime.includes(required)) failures.push(`Human Environment runtime missing ${required}`);
}

const transport = read("STS2MCP/McpMod.cs")
  + read("STS2MCP/HumanEnvironment/Transport/McpMod.HumanEnvironment.cs");
requireText("STS2MCP/McpMod.cs", "/api/he/evidence/native-pages/sessions", "C-owned native-page evidence route");
if (transport.includes("/api/v3/human-equivalence")) failures.push("transport retains V3-owned human-equivalence route");
requireText("STS2MCP/McpMod.cs", "human_environment_native_page_evidence_enabled", "current evidence profile config");

for (const retiredSource of [
  "STS2MCP/ConnectorV3/Runtime/ConnectorV3Runtime.cs",
  "STS2MCP/ConnectorV3/Protocol/ConnectorV3Contracts.cs",
  "STS2MCP/BridgeV2/Runtime/BridgeV2Runtime.cs",
  "STS2MCP/BridgeV2/Transport/McpMod.BridgeV2.cs",
  "STS2MCP/ConnectorV3/Transport/McpMod.ConnectorV3.cs"
]) {
  if (existsSync(path.join(workspace, retiredSource))) {
    failures.push(`${retiredSource}: retired compiled implementation remains`);
  }
}

const currentGatewayFiles = [
  ...runtimeFiles,
  "STS2MCP/Authority/GatewayAuthorityRuntime.cs",
  "STS2MCP/NativeUi/NativeUiActionRuntime.cs",
  "STS2MCP/LiveHost/LiveObservationReader.cs"
];
const currentGateway = currentGatewayFiles.map(read).join("\n");
for (const legacy of ["STS2_MCP.BridgeV2", "STS2_MCP.ConnectorV3", "SurfaceProvider"])
  if (currentGateway.includes(legacy)) failures.push(`current Gateway path contains ${legacy}`);

const actionProjection = "Re-SpireAgent/src/domain/actions/buildHumanEnvironmentAllowedActions.ts";
requireText(actionProjection, "state.surface.boundActions.map", "direct bound-action import");
for (const forbidden of ["canPlay", "targetType", "cardIndex", "potion", "effect"]) {
  forbidText(actionProjection, forbidden, `consumer legality/effect reconstruction token ${forbidden}`);
}

const currentAction = "Re-SpireAgent/src/domain/actions/action.ts";
requireText(currentAction, 'kind: "human_ui_action"', "single current opaque action");
for (const retiredAction of [
  "connector_v3_command", "bridge_v2_action", "play_card", "end_turn",
  "cardIndex", "index: number", "targetId"
]) forbidText(currentAction, retiredAction, `retired production action ${retiredAction}`);
requireText(
  productionTsconfig,
  "src/domain/actions/legacyAction.ts",
  "fixture-only legacy action exclusion"
);
forbidText(
  "Re-SpireAgent/src/runtime/tickOrchestrator.ts",
  'actionAuthority !== "bridge_advertised"',
  "retired run-entry authority"
);

if (failures.length > 0) {
  console.error(["Human Environment boundary checks failed:", ...failures.map((item) => `- ${item}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("human-environment boundary checks passed");
}
