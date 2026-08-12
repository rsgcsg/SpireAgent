#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const absolute = (relative) => path.join(workspace, relative);
const read = (relative) => readFileSync(absolute(relative), "utf8");
const requireText = (relative, value, label) => {
  if (!read(relative).includes(value)) failures.push(`${relative}: missing ${label}`);
};
const forbidText = (relative, value, label) => {
  if (read(relative).includes(value)) failures.push(`${relative}: contains ${label}`);
};
const sourceFiles = (relative) => {
  const root = absolute(relative);
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true })
    .map((entry) => path.join(root, String(entry)))
    .filter((entry) => statSync(entry).isFile() && /\.(cs|ts)$/u.test(entry));
};

const runtimeFactory = "Re-SpireAgent/src/app/runtimeFactory.ts";
requireText(runtimeFactory, "Sts2PlayerEnvironmentAdapter", "single Player Environment adapter");
requireText(runtimeFactory, "normalizePlayerEnvironmentCurrentState", "direct current normalizer");
requireText(runtimeFactory, "buildPlayerEnvironmentAllowedActions", "finite current action projection");
for (const legacy of ["BridgeV2", "ConnectorV3", "Hybrid", "humanEnvironment"])
  forbidText(runtimeFactory, legacy, `legacy runtime ${legacy}`);

const client = "Re-SpireAgent/src/integrations/sts2mcp/playerEnvironmentClient.ts";
for (const route of [
  "/api/player-environment/capabilities",
  "/api/player-environment/snapshot",
  "/api/player-environment/reads/",
  "/api/player-environment/actions",
  "/api/player-environment/clients/register",
  "/api/player-environment/controller/"
]) requireText(client, route, `current route ${route}`);
for (const legacy of ["/api/he", "/api/v2", "/api/v3", "legal_actions"])
  forbidText(client, legacy, `legacy client seam ${legacy}`);

const protocol = "Re-SpireAgent/src/integrations/sts2mcp/playerEnvironmentProtocol.ts";
requireText(protocol, 'SUPPORTED_PLAYER_ENVIRONMENT_PROTOCOL = "1.0-rc.1"', "current protocol");
requireText(protocol, "information_policy:", "information boundary");
requireText(protocol, "bound_actions:", "finite C projection");
for (const legacy of [
  "observation_policy", "optional_annotations", "state_token", "legal_actions",
  "expected_frame_id", "expected_owner_id", "parameter_domains", "SourceContract",
  "native_ui_actionability"
]) forbidText(protocol, legacy, `retired public field ${legacy}`);

const action = "Re-SpireAgent/src/domain/actions/action.ts";
requireText(action, 'kind: "bound_action"', "single current executable action");
for (const legacy of ["human_ui_action", "connector_v3_command", "bridge_v2_action", "cardIndex", "targetId"])
  forbidText(action, legacy, `retired action ${legacy}`);

const environmentExample = "Re-SpireAgent/.env.example";
for (const current of [
  "STS2_CONNECTOR_TIMEOUT_MS", "STS2_CONNECTOR_STARTUP_WAIT_MS",
  "STS2_CONNECTOR_STARTUP_POLL_MS"
]) requireText(environmentExample, current, `current local setting ${current}`);
for (const retired of [
  "STS2_MCP_PROTOCOL", "SPIREAGENT_HE_MODE", "STS2_MCP_TIMEOUT_MS",
  "STS2_MCP_STARTUP_WAIT_MS", "STS2_MCP_STARTUP_POLL_MS",
  "STS2_HE_ACTION_POLL_MS", "STS2_HE_ACTION_TIMEOUT_MS"
]) forbidText(environmentExample, retired, `retired local setting ${retired}`);

const tsconfig = JSON.parse(read("Re-SpireAgent/tsconfig.json"));
if (JSON.stringify(tsconfig.include) !== JSON.stringify(["src/**/*.ts"])) {
  failures.push("Re-SpireAgent/tsconfig.json: current source is not compiled as one domain");
}
if ((tsconfig.exclude ?? []).some((entry) => String(entry).includes("src/"))) {
  failures.push("Re-SpireAgent/tsconfig.json: retired source is hidden by an exclusion shim");
}

for (const retired of [
  "Re-SpireAgent/src/integrations/sts2mcp/bridgeV2Protocol.ts",
  "Re-SpireAgent/src/integrations/sts2mcp/connectorV3Protocol.ts",
  "Re-SpireAgent/src/integrations/sts2mcp/humanEnvironmentProtocol.ts",
  "Re-SpireAgent/src/normalization/normalizeCurrentState.ts",
  "STS2MCP/HumanEnvironment",
  "STS2MCP/ConnectorV3",
  "STS2MCP/BridgeV2",
  "STS2MCP/Authority/GatewayAuthorityRuntime.cs",
  "STS2MCP/Authority/EnvironmentPermissionManager.cs",
  "STS2MCP/Authority/EnvironmentQualificationStore.cs",
  "STS2MCP/NativeUi/NativeOperationManifest.cs",
  "STS2MCP/LiveHost/GeneratedCardChoiceSourceBinding.cs",
  "STS2MCP/LiveHost/CombatPileSelectionSourceBinding.cs",
  "STS2MCP/LiveHost/EventDeckRemovalSelectionSurface.cs",
  "STS2MCP/LiveHost/PreciseScissorsRemovalSourceBinding.cs",
  "STS2MCP/LiveHost/RewardCardRemovalSourceBinding.cs",
  "STS2MCP/LiveHost/WoodCarvingsReplacementSourceBinding.cs",
  "STS2MCP/LiveHost/MerchantRemovalCompletionWitness.cs",
  "STS2MCP/LiveHost/RestSiteSurfaceReader.cs"
]) {
  if (existsSync(absolute(retired))) failures.push(`${retired}: retired production ownership remains`);
}

const cProtocol = "STS2MCP/PlayerEnvironment/Protocol/PlayerEnvironmentContracts.cs";
for (const required of [
  "PlayerEnvironmentSnapshot", "PlayerEnvironmentInteraction", "PlayerEnvironmentReferent",
  "PlayerEnvironmentReadOpportunity", "PlayerEnvironmentBoundAction",
  "PlayerEnvironmentActionReceipt", "PlayerEnvironmentInformationPolicy"
]) requireText(cProtocol, required, `public contract ${required}`);
for (const legacy of ["BridgeV2", "ConnectorV3", "SourceContract", "BusinessOutcome", "ObservationPolicy"])
  forbidText(cProtocol, legacy, `legacy public ontology ${legacy}`);

const nativeCandidate = "STS2MCP/NativeUi/NativeUiActionContracts.cs";
forbidText(nativeCandidate, "AuthorityState", "retired candidate-local authority state");

const boundProjection = "STS2MCP/PlayerEnvironment/Projection/BoundActionProjection.cs";
requireText(boundProjection, "visibleReferents.ContainsKey(value)", "visible referent action binding");
const visibleProjection = "STS2MCP/PlayerEnvironment/Observation/VisibleInteractionProjection.cs";
requireText(visibleProjection, "BuildFactReferents", "fact-owned referent projection");
for (const leak of [
  "native_ui_actionability", "value.ScreenEntityId", "value.RoomEntityId",
  "value.HandEntityId", "value.SlotEntityId", "value.AnnotationInputEntityId"
]) forbidText(visibleProjection, leak, `Host-private public projection ${leak}`);

const currentHostFiles = [
  ...sourceFiles("STS2MCP/PlayerEnvironment"),
  ...sourceFiles("STS2MCP/NativeUi"),
  ...sourceFiles("STS2MCP/LiveHost"),
  absolute("STS2MCP/Authority/EnvironmentIdentityRuntime.cs"),
  absolute("STS2MCP/Authority/MutationControlRuntime.cs"),
];
const currentHost = currentHostFiles.map((file) => readFileSync(file, "utf8")).join("\n");
for (const legacy of [
  "GatewayAuthorityRuntime", "EnvironmentPermission", "QualificationStore",
  "NativeOperationManifest", "provider_native_binding_adapter", "SourceContract",
  "CompletionProbe", "NativeInputResult.Started", "business_contract", "gateway_owned"
]) {
  if (currentHost.includes(legacy)) failures.push(`current Host/C/NativeUi path contains retired authority ${legacy}`);
}

const snapshotBuilder = read("STS2MCP/PlayerEnvironment/Observation/SnapshotBuilder.cs");
for (const adapter of [
  "NativeGeneratedCardChoice", "NativeDeckTransformSelection", "NativeCombatPileSelection",
  "NativeDeckCardSelection", "NativeSimpleCardSelection", "NativeRestSite"
]) {
  if (!snapshotBuilder.includes(adapter)) failures.push(`SnapshotBuilder: missing source-free adapter ${adapter}`);
}

const submission = "STS2MCP/PlayerEnvironment/Execution/ActionSubmission.cs";
for (const required of ["stale_snapshot", "bound_action_not_current", "MutationControlRuntime.Authorize", "input_delivery_unknown"])
  requireText(submission, required, `delivery hard shell ${required}`);
forbidText(submission, "CompletionProbe", "business completion wait");

const transport = read("STS2MCP/McpMod.cs")
  + read("STS2MCP/PlayerEnvironment/Transport/McpMod.PlayerEnvironment.cs");
requireText("STS2MCP/McpMod.cs", "/api/player-environment/snapshot", "snapshot route");
requireText("STS2MCP/McpMod.cs", 'path.StartsWith("/api/he"', "retired HE route returns explicit error");
if (transport.includes("/api/v3/human-equivalence")) failures.push("transport retains V3-owned HE route");

const python = "STS2MCP/mcp/server.py";
requireText(python, "observe_sts2_player_environment", "current MCP observe tool");
requireText(python, '_environment_get("snapshot")', "current MCP snapshot route");
for (const legacy of ["_he_", "get_sts2_human", "read_sts2_human", "Human-Equivalent"])
  forbidText(python, legacy, `legacy Python transport ${legacy}`);

const normalizer = "Re-SpireAgent/src/normalization/normalizePlayerEnvironmentCurrentState.ts";
requireText(normalizer, "bound_actions", "host finite projection");
for (const legacy of ["legalActions", "source_kind", "operation_contract"])
  forbidText(normalizer, legacy, `consumer authority reconstruction ${legacy}`);

if (failures.length > 0) {
  console.error(["Player Environment boundary checks failed:", ...failures.map((item) => `- ${item}`)].join("\n"));
  process.exitCode = 1;
} else {
  console.log("player-environment boundary checks passed");
}
