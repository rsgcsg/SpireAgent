import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const registryPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/combat-pile-source-contracts.json"
);
const catalogPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/combat-pile-contract-catalog.json"
);
const policyPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/exact-environment-policy.json"
);
const manifestPath = path.join(
  root,
  "STS2MCP/BridgeV2/Runtime/BridgeContractManifest.cs"
);
const identityPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/BridgeGameIdentity.cs"
);
const providerPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/CombatPileCardSelectionSurfaceProvider.cs"
);
const bindingPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/CombatPileSelectionSourceBinding.cs"
);

const [registryText, catalogText, policyText, manifest, identity, provider, binding] =
  await Promise.all([
    readFile(registryPath, "utf8"),
    readFile(catalogPath, "utf8"),
    readFile(policyPath, "utf8"),
    readFile(manifestPath, "utf8"),
    readFile(identityPath, "utf8"),
    readFile(providerPath, "utf8"),
    readFile(bindingPath, "utf8")
  ]);

const registry = JSON.parse(registryText);
const catalog = JSON.parse(catalogText);
const policy = JSON.parse(policyText);
assert(registry.schema_version === 1, "unsupported combat-pile registry schema");
assert(
  registry.authorization_mode === "reviewed_embedded_policy_only",
  "combat-pile registry must not self-authorize"
);
assert(catalog.schema_version === 1, "unsupported combat-pile catalog schema");
assert(
  catalog.authorization_effect === "none"
    && catalog.qualification_effect === "none",
  "combat-pile catalog must not authorize or qualify"
);
assert(policy.schema_version === 1, "unsupported exact-environment policy schema");
assert(
  policy.authorization_mode === "reviewed_embedded_policy_only",
  "exact-environment policy must be reviewed and embedded"
);

const sourceKinds = new Set();
const sourceBindings = new Set();
const allowedHooks = new Set(catalog.closed_vocabularies.hook_modes);
const witnessTopologies = new Map(
  catalog.witness_topologies.map((topology) => [
    topology.witness_kind,
    topology
  ])
);
assert(
  witnessTopologies.size === catalog.witness_topologies.length,
  "combat-pile catalog contains duplicate witness topologies"
);
for (const contract of registry.contracts) {
  assert(allowedHooks.has(contract.hook_mode), `unknown hook ${contract.hook_mode}`);
  assert(
    witnessTopologies.has(contract.witness_kind),
    `unknown witness ${contract.witness_kind}`
  );
  assertValidTopology(contract, witnessTopologies.get(contract.witness_kind));
  assert(!sourceKinds.has(contract.source_kind), `duplicate source kind ${contract.source_kind}`);
  const bindingKey = `${contract.source_type}|${contract.hook_mode}`;
  assert(!sourceBindings.has(bindingKey), `duplicate source binding ${bindingKey}`);
  sourceKinds.add(contract.source_kind);
  sourceBindings.add(bindingKey);
}

const manifestKinds = new Set(
  [...manifest.matchAll(/\bEntry\(\s*"([^"]+)"/gu)].map((match) => match[1])
);
const inspectionKinds = new Set(["run_deck", "combat_piles", "shop_catalog"]);
const environmentKeys = new Set();
for (const environment of policy.environments) {
  const key = `${environment.version}|${environment.commit.toLowerCase()}|${environment.main_assembly_hash}`;
  assert(!environmentKeys.has(key), `duplicate exact environment ${key}`);
  environmentKeys.add(key);
  const qualified = new Set(environment.qualified_surface_kinds);
  for (const kind of environment.canary_surface_kinds) {
    assert(!qualified.has(kind), `${key} grants both qualified and canary ${kind}`);
  }
  for (const kind of [
    ...environment.qualified_surface_kinds,
    ...environment.canary_surface_kinds,
    ...environment.observation_only_surface_kinds
  ]) {
    assert(manifestKinds.has(kind), `${key} references unknown Surface ${kind}`);
  }
  for (const kind of [
    ...environment.qualified_inspection_kinds,
    ...environment.canary_inspection_kinds
  ]) {
    assert(inspectionKinds.has(kind), `${key} references unknown Inspection ${kind}`);
  }
}

assert(
  identity.includes("BridgeExactEnvironmentPolicy.Assess"),
  "BridgeGameIdentity must delegate exact-build assessment to reviewed policy data"
);
for (const forbidden of [
  "HeadbuttBinding",
  "GraveblastBinding",
  "CleanseBinding",
  "SeanceBinding",
  "DredgeBinding",
  "ChargeBinding",
  "NeowsFuryBinding"
]) {
  assert(!provider.includes(forbidden), `provider retains source-specific branch ${forbidden}`);
  assert(!binding.includes(forbidden), `binding retains source-specific branch ${forbidden}`);
}
for (const forbidden of [
  "HeadbuttCombatPileWitness",
  "GraveblastCombatPileWitness",
  "CleanseCombatPileWitness",
  "SeanceCombatPileWitness",
  "DredgeCombatPileWitness",
  "ChargeCombatPileWitness",
  "NeowsFuryCombatPileWitness"
]) {
  assert(!provider.includes(forbidden), `provider retains source-named witness ${forbidden}`);
  assert(!binding.includes(forbidden), `binding retains source-named witness ${forbidden}`);
}
assert(
  binding.includes("CombatPileSourceContractRegistry.ResolveDeclaredOnPlayTargets"),
  "declared OnPlay targets must come from the reviewed source registry"
);
assert(
  provider.includes("binding.Contract.WitnessKind"),
  "provider must dispatch the closed witness topology rather than source names"
);

console.log(
  JSON.stringify({
    status: "pass",
    authorization_effect: "none",
    contract_catalog: catalog.catalog_id,
    witness_topology_count: witnessTopologies.size,
    exact_environment_count: policy.environments.length,
    combat_pile_source_count: registry.contracts.length,
    source_kinds: [...sourceKinds].sort()
  })
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertValidTopology(contract, topology) {
  const sourceDestination = contract.source_pile === contract.destination_pile
    ? "same"
    : "different";
  const countMatches = {
    equals_zero: contract.selection_count === 0,
    equals_one: contract.selection_count === 1,
    positive: contract.selection_count > 0,
    greater_than_one: contract.selection_count > 1
  }[topology.selection_count_rule];
  const presenceMatches = (policy, value) => ({
    required: Boolean(value),
    forbidden: !value
  })[policy];
  const valid =
    catalog.closed_vocabularies.piles.includes(contract.source_pile)
    && catalog.closed_vocabularies.piles.includes(contract.destination_pile)
    && catalog.closed_vocabularies.mutation_kinds.includes(contract.mutation_kind)
    && catalog.closed_vocabularies.commit_modes.includes(contract.commit_mode)
    && catalog.closed_vocabularies.selection_bounds.includes(contract.selection_bounds)
    && topology.mutation_kind === contract.mutation_kind
    && topology.commit_mode === contract.commit_mode
    && topology.selection_bounds === contract.selection_bounds
    && countMatches === true
    && topology.source_destination_relation === sourceDestination
    && (
      topology.required_destination_pile === null
      || topology.required_destination_pile === contract.destination_pile
    )
    && topology.required_destination_position === contract.destination_position
    && presenceMatches(topology.overflow_policy, contract.overflow_destination) === true
    && presenceMatches(
      topology.replacement_policy,
      contract.replacement_card_definition_id
    ) === true;
  assert(valid, `inconsistent catalog topology for ${contract.source_kind}`);
}
