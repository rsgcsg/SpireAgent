import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const registryPath = path.join(
  root,
  "STS2MCP/BridgeV2/Game/combat-pile-source-contracts.json"
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

const [registryText, policyText, manifest, identity, provider, binding] =
  await Promise.all([
    readFile(registryPath, "utf8"),
    readFile(policyPath, "utf8"),
    readFile(manifestPath, "utf8"),
    readFile(identityPath, "utf8"),
    readFile(providerPath, "utf8"),
    readFile(bindingPath, "utf8")
  ]);

const registry = JSON.parse(registryText);
const policy = JSON.parse(policyText);
assert(registry.schema_version === 1, "unsupported combat-pile registry schema");
assert(
  registry.authorization_mode === "reviewed_embedded_policy_only",
  "combat-pile registry must not self-authorize"
);
assert(policy.schema_version === 1, "unsupported exact-environment policy schema");
assert(
  policy.authorization_mode === "reviewed_embedded_policy_only",
  "exact-environment policy must be reviewed and embedded"
);

const sourceKinds = new Set();
const sourceBindings = new Set();
const allowedHooks = new Set(["card_on_play_wrapper", "declared_on_play"]);
const allowedWitnesses = new Set([
  "move_one_to_top",
  "move_one_to_hand_or_source_if_full",
  "move_one_between_piles",
  "replace_one_same_index",
  "move_exact_batch_between_piles",
  "replace_exact_batch_same_index",
  "move_optional_batch_between_piles"
]);
for (const contract of registry.contracts) {
  assert(allowedHooks.has(contract.hook_mode), `unknown hook ${contract.hook_mode}`);
  assert(
    allowedWitnesses.has(contract.witness_kind),
    `unknown witness ${contract.witness_kind}`
  );
  assertValidTopology(contract);
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

function assertValidTopology(contract) {
  const isMove = contract.mutation_kind === "move_selected_cards";
  const isReplace =
    contract.mutation_kind === "replace_selected_cards_same_index"
    && contract.source_pile === contract.destination_pile
    && contract.destination_position === "same_index"
    && Boolean(contract.replacement_card_definition_id);
  const isFixed = (count) =>
    contract.selection_bounds === "fixed_exact"
    && contract.selection_count === count;

  const valid = {
    move_one_to_top:
      isMove
      && isFixed(1)
      && contract.destination_position === "top"
      && contract.commit_mode === "automatic_at_max",
    move_one_to_hand_or_source_if_full:
      isMove
      && isFixed(1)
      && contract.destination_pile === "hand"
      && contract.destination_position === "bottom"
      && Boolean(contract.overflow_destination)
      && contract.commit_mode === "automatic_at_max",
    move_one_between_piles:
      isMove
      && isFixed(1)
      && contract.source_pile !== contract.destination_pile
      && contract.commit_mode === "automatic_at_max",
    replace_one_same_index:
      isReplace
      && isFixed(1)
      && contract.commit_mode === "automatic_at_max",
    move_exact_batch_between_piles:
      isMove
      && contract.selection_bounds === "fixed_exact_capped_by_hand_space"
      && contract.selection_count > 0
      && contract.source_pile !== contract.destination_pile
      && contract.commit_mode === "automatic_at_max",
    replace_exact_batch_same_index:
      isReplace
      && contract.selection_bounds === "fixed_exact"
      && contract.selection_count > 1
      && contract.commit_mode === "automatic_at_max",
    move_optional_batch_between_piles:
      isMove
      && contract.selection_bounds === "dynamic_cards_optional_capped_by_hand_space"
      && contract.selection_count === 0
      && contract.source_pile !== contract.destination_pile
      && contract.commit_mode === "manual_confirm"
  }[contract.witness_kind];
  assert(valid, `inconsistent witness/mutation topology for ${contract.source_kind}`);
}
