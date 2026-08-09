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
const connectorRuntimePath = path.join(
  root,
  "STS2MCP/ConnectorV3/Runtime/ConnectorV3Runtime.cs"
);
const connectorEventRemovalPath = path.join(
  root,
  "STS2MCP/ConnectorV3/Runtime/EventDeckRemovalSelection.cs"
);
const connectorHumanEquivalencePath = path.join(
  root,
  "STS2MCP/ConnectorV3/Runtime/ConnectorV3HumanEquivalence.cs"
);
const identityPath = path.join(
  root,
  "STS2MCP/BridgeV2/Runtime/BridgeCurrentIdentityProjectionBuilder.cs"
);
const surfacePermissionPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/BridgeSurfacePermission.cs"
);
const permissionManagerPath = path.join(
  root,
  "STS2MCP/BridgeV2/Runtime/BridgePermissionManager.cs"
);
const boundContractPath = path.join(
  root,
  "STS2MCP/BridgeV2/Runtime/BridgeBoundActionContract.cs"
);
const qualificationStorePath = path.join(
  root,
  "STS2MCP/BridgeV2/Runtime/BridgePersistentQualificationStore.cs"
);
const qualificationLedgerPath = path.join(
  root,
  "tools/connector-qualification-ledger.mjs"
);
const deckRemovalProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/DeckRemovalSelectionSurfaceProvider.cs"
);
const cardBundleProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/CardBundleSelectionSurfaceProvider.cs"
);
const deckUpgradeProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/DeckUpgradeSelectionSurfaceProvider.cs"
);
const combatHandProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/CombatHandCardSelectionSurfaceProvider.cs"
);
const combatPileProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/CombatPileCardSelectionSurfaceProvider.cs"
);
const deckTransformProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/DeckTransformSelectionSurfaceProvider.cs"
);
const woodCarvingsProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/WoodCarvingsReplacementSurfaceProvider.cs"
);
const rewardClaimProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/RewardClaimSurfaceProvider.cs"
);
const restSiteProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/RestSiteSurfaceProvider.cs"
);
const eventCardAcquisitionProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/EventCardAcquisitionSurfaceProvider.cs"
);
const reStatePath = path.join(root, "Re-SpireAgent/src/domain/state/common.ts");
const reNormalizerPath = path.join(
  root,
  "Re-SpireAgent/src/normalization/normalizeBridgeV2CurrentState.ts"
);
const deckEnchantProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/DeckEnchantSurfaceProvider.cs"
);
const eventDialogueProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/EventDialogueSurfaceProvider.cs"
);
const combatTurnProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/CombatTurnSurfaceProvider.cs"
);
const mapNavigationProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/MapNavigationSurfaceProvider.cs"
);
const shopProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/ShopSurfaceProviders.cs"
);
const characterSelectProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/CharacterSelectSurfaceProvider.cs"
);
const eventOptionProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/EventOptionSurfaceProvider.cs"
);
const gameOverProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/GameOverSurfaceProvider.cs"
);
const treasureProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/TreasureRoomSurfaceProvider.cs"
);
const cardRewardProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/CardRewardSurfaceProvider.cs"
);
const generatedChoiceProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/GeneratedCardChoiceSurfaceProvider.cs"
);
const menuProviderPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/MenuSurfaceProviders.cs"
);
const reConnectorProjectionPath = path.join(
  root,
  "Re-SpireAgent/src/integrations/sts2mcp/connectorV3Projection.ts"
);
const rePublicIndexPath = path.join(root, "Re-SpireAgent/src/index.ts");
const gatewayRoutesPath = path.join(root, "STS2MCP/McpMod.cs");

const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const protocolSource = await readFile(protocolPath, "utf8");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const runtimeSource = await readFile(runtimePath, "utf8");
const connectorRuntimeSource = await readFile(connectorRuntimePath, "utf8");
const connectorV3CommandSources = connectorRuntimeSource
  + await readFile(connectorEventRemovalPath, "utf8")
  + await readFile(connectorHumanEquivalencePath, "utf8");
const identitySource = await readFile(identityPath, "utf8");
const surfacePermissionSource = await readFile(surfacePermissionPath, "utf8");
const permissionManagerSource = await readFile(permissionManagerPath, "utf8");
const boundContractSource = await readFile(boundContractPath, "utf8");
const qualificationStoreSource = await readFile(qualificationStorePath, "utf8");
const qualificationLedgerSource = await readFile(qualificationLedgerPath, "utf8");
const deckRemovalProviderSource = await readFile(deckRemovalProviderPath, "utf8");
const cardBundleProviderSource = await readFile(cardBundleProviderPath, "utf8");
const deckUpgradeProviderSource = await readFile(deckUpgradeProviderPath, "utf8");
const combatHandProviderSource = await readFile(combatHandProviderPath, "utf8");
const combatPileProviderSource = await readFile(combatPileProviderPath, "utf8");
const deckTransformProviderSource = await readFile(deckTransformProviderPath, "utf8");
const woodCarvingsProviderSource = await readFile(woodCarvingsProviderPath, "utf8");
const rewardClaimProviderSource = await readFile(rewardClaimProviderPath, "utf8");
const restSiteProviderSource = await readFile(restSiteProviderPath, "utf8");
const eventCardAcquisitionProviderSource = await readFile(
  eventCardAcquisitionProviderPath,
  "utf8"
);
const deckEnchantProviderSource = await readFile(deckEnchantProviderPath, "utf8");
const eventDialogueProviderSource = await readFile(eventDialogueProviderPath, "utf8");
const combatTurnProviderSource = await readFile(combatTurnProviderPath, "utf8");
const mapNavigationProviderSource = await readFile(mapNavigationProviderPath, "utf8");
const shopProviderSource = await readFile(shopProviderPath, "utf8");
const characterSelectProviderSource = await readFile(characterSelectProviderPath, "utf8");
const eventOptionProviderSource = await readFile(eventOptionProviderPath, "utf8");
const gameOverProviderSource = await readFile(gameOverProviderPath, "utf8");
const treasureProviderSource = await readFile(treasureProviderPath, "utf8");
const cardRewardProviderSource = await readFile(cardRewardProviderPath, "utf8");
const generatedChoiceProviderSource = await readFile(generatedChoiceProviderPath, "utf8");
const menuProviderSource = await readFile(menuProviderPath, "utf8");
const reStateSource = await readFile(reStatePath, "utf8");
const reNormalizerSource = await readFile(reNormalizerPath, "utf8");
const reConnectorProjectionSource = await readFile(reConnectorProjectionPath, "utf8");
const rePublicIndexSource = await readFile(rePublicIndexPath, "utf8");
const gatewayRoutesSource = await readFile(gatewayRoutesPath, "utf8");

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
if (catalog.schema_version !== 3
    || catalog.authority_effect
      !== "explicit_native_contracts_only") {
  fail("explicit-only operation catalog boundary is missing");
}
const eventRemovalContracts = new Map(catalog.contracts
  .filter((contract) => contract.surface_kind === "event_deck_removal_selection")
  .map((contract) => [contract.operation, contract]));
const expectedEventRemovalContracts = new Map([
  ["toggle_event_deck_removal_card", ["reversible_navigation", "immediate_postcondition_observed"]],
  ["cancel_event_deck_removal_preview", ["reversible_navigation", "immediate_postcondition_observed"]],
  ["confirm_event_deck_removal", ["persistent_run_mutation", "transaction_settled"]]
]);
for (const [operation, [riskClass, completionBoundary]] of expectedEventRemovalContracts) {
  const contract = eventRemovalContracts.get(operation);
  if (!contract
      || contract.risk_class !== riskClass
      || contract.completion_boundary !== completionBoundary
      || contract.source_binding
        !== "LuminousChoir.ReachIntoTheFlesh+task_local_source_binding"
      || !contract.witness_id) {
    fail(`event deck-removal contract drift: ${operation}`);
  }
}
if (eventRemovalContracts.size !== expectedEventRemovalContracts.size) {
  fail("event deck-removal contract set drift");
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
const authorityResolverCount = count(
  surfacePermissionSource,
  /ActionPermissionScope\? FindActionScope\(/gu
);
if (authorityResolverCount !== inventory.current.production_authority_resolver_count) {
  fail(`production authority resolver count drift: ${authorityResolverCount}`);
}
const operationAuthorityUsageCount = [
  /: string\.Equals\(scope\.Operation, operation,/gu.test(surfacePermissionSource),
  /\? string\.Equals\(scope\.Operation, Operation,/gu.test(boundContractSource),
  /: string\.Equals\(value\.Operation, expected\.Operation,/gu.test(permissionManagerSource)
].filter(Boolean).length;
if (operationAuthorityUsageCount !== inventory.current.operation_authority_usage_count) {
  fail(`operation authority usage count drift: ${operationAuthorityUsageCount}`);
}
if (!qualificationStoreSource.includes("Manifest migration fallbacks cannot become durable qualifications")
    || !qualificationLedgerSource.includes("durable qualification requires an explicit native contract")) {
  fail("persistent fallback qualification admission is not closed in both Gateway and operator tooling");
}
if (inventory.current.persistent_fallback_claim_admission_count !== 0) {
  fail("persistent fallback claim admission must remain zero");
}
if (/draft\.Actions|LegacyBinding|provider_native_binding_adapter/gu.test(connectorRuntimeSource)) {
  fail("Connector V3 runtime regained a Provider action or V2-shaped execution dependency");
}
if (/BridgeActionDraft/gu.test(connectorV3CommandSources)) {
  fail("Connector V3 regained the retired BridgeActionDraft command descriptor");
}
if (/BridgeV2RestClient|bridgeSidecar|bridge_v2_capabilities|temporary V2 consumer sidecar/gu
    .test(reConnectorProjectionSource)) {
  fail("Re Connector V3 regained a V2 consumer sidecar");
}
if (/bridgeV2Client|bridgeV2Protocol|hybridAdapter/gu.test(rePublicIndexSource)) {
  fail("Re public production entrypoint exports a retired V2 client path");
}
for (const legacyHandler of [
  "HandlePostBridgeV2ClientRegistration",
  "HandleGetBridgeV2Controller",
  "HandleGetBridgeV2Clients",
  "HandlePostBridgeV2Controller"
]) {
  const v3RouteBlock = gatewayRoutesSource.slice(
    gatewayRoutesSource.indexOf('path == "/api/v3/clients/register"'),
    gatewayRoutesSource.indexOf('path == "/api/v3/commands"')
  );
  if (v3RouteBlock.includes(legacyHandler)) {
    fail(`Connector V3 control route regained V2 wire handler ${legacyHandler}`);
  }
}
if (deckRemovalProviderSource.includes("new BridgeActionDraft")
    || cardBundleProviderSource.includes("new BridgeActionDraft")
    || deckUpgradeProviderSource.includes("new BridgeActionDraft")
    || combatHandProviderSource.includes("new BridgeActionDraft")
    || combatPileProviderSource.includes("new BridgeActionDraft")
    || deckTransformProviderSource.includes("new BridgeActionDraft")
    || woodCarvingsProviderSource.includes("new BridgeActionDraft")
    || rewardClaimProviderSource.includes("new BridgeActionDraft")
    || restSiteProviderSource.includes("new BridgeActionDraft")
    || eventCardAcquisitionProviderSource.includes("new BridgeActionDraft")
    || deckEnchantProviderSource.includes("new BridgeActionDraft")
    || eventDialogueProviderSource.includes("new BridgeActionDraft")
    || combatTurnProviderSource.includes("new BridgeActionDraft")
    || mapNavigationProviderSource.includes("new BridgeActionDraft")
    || shopProviderSource.includes("new BridgeActionDraft")
    || characterSelectProviderSource.includes("new BridgeActionDraft")
    || eventOptionProviderSource.includes("new BridgeActionDraft")
    || gameOverProviderSource.includes("new BridgeActionDraft")
    || treasureProviderSource.includes("new BridgeActionDraft")
    || cardRewardProviderSource.includes("new BridgeActionDraft")
    || generatedChoiceProviderSource.includes("new BridgeActionDraft")
    || menuProviderSource.includes("new BridgeActionDraft")) {
  fail("a V3 direct family regained a Provider publication/execution path");
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
    || inventory.current.production_authority_resolver_count
      !== inventory.target.production_authority_resolver_count
    || inventory.current.operation_authority_usage_count
      !== inventory.target.operation_authority_usage_count
    || inventory.current.persistent_fallback_claim_admission_count
      !== inventory.target.persistent_fallback_claim_admission_count
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
