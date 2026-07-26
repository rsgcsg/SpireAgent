#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import pathModule from "node:path";
import { pathToFileURL } from "node:url";

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  return { command, options };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonical(entry)])
    );
  }
  return value;
}

function digest(value) {
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}

function nonEmpty(value, field) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Capabilities lack exact profile field ${field}`);
  }
  return value;
}

export function buildEnvironmentProfileIdentity(capabilities) {
  const gameMainAssemblyHash = capabilities?.game?.main_assembly_hash;
  if (!Number.isInteger(gameMainAssemblyHash)) {
    throw new Error("Capabilities lack exact profile field game_main_assembly_hash");
  }
  return {
    protocol_version: nonEmpty(
      capabilities?.protocol_version,
      "protocol_version"
    ),
    game_version: nonEmpty(capabilities?.game?.version, "game_version"),
    game_commit: nonEmpty(capabilities?.game?.commit, "game_commit"),
    game_main_assembly_hash: gameMainAssemblyHash,
    gateway_assembly_sha256: nonEmpty(
      capabilities?.bridge?.assembly_file_sha256,
      "gateway_assembly_sha256"
    ),
    gateway_module_version_id: nonEmpty(
      capabilities?.bridge?.module_version_id,
      "gateway_module_version_id"
    ),
    modset_fingerprint: nonEmpty(
      capabilities?.game?.modset?.fingerprint,
      "modset_fingerprint"
    ),
    patch_digest: nonEmpty(
      capabilities?.permission_system?.patch_inventory?.digest,
      "patch_digest"
    ),
    environment_digest: nonEmpty(
      capabilities?.qualification_system?.current_environment_digest,
      "environment_digest"
    ),
    operation_catalog_digest: nonEmpty(
      capabilities?.qualification_system?.operation_catalog_digest,
      "operation_catalog_digest"
    ),
    migration_policy_digest: nonEmpty(
      capabilities?.permission_system?.policy_digest,
      "migration_policy_digest"
    ),
    compatibility_policy_digest: nonEmpty(
      capabilities?.game?.compatibility?.compatibility_policy_digest,
      "compatibility_policy_digest"
    )
  };
}

export function environmentProfileId(identity) {
  return `env-${digest(identity).slice(0, 24)}`;
}

function exactActiveQualifications(capabilities) {
  return (capabilities?.qualification_system?.qualifications ?? []).filter(
    (entry) =>
      entry?.status === "active"
      && entry?.applicable_to_current_environment === true
  );
}

function profileStatus(capabilities) {
  const contracts =
    capabilities?.qualification_system?.operation_contracts ?? [];
  const qualifiedKeys = new Set(
    exactActiveQualifications(capabilities)
      .filter((entry) => entry.authority_tier === "qualified")
      .map((entry) => `${entry.surface_kind}\u0000${entry.operation}`)
  );
  if (contracts.length > 0 && qualifiedKeys.size === contracts.length) {
    return "qualified_all_reviewed_operations";
  }
  if (qualifiedKeys.size > 0) return "qualified_partial";
  return "migration_exploration";
}

export function createEmptyProfileRegistry(
  registryId = "local_connector_environment_profiles"
) {
  return {
    schema_version: 1,
    registry_id: registryId,
    authorization_effect: "none",
    profiles: []
  };
}

export function validateProfileRegistry(registry) {
  const errors = [];
  if (registry?.schema_version !== 1
      || typeof registry?.registry_id !== "string"
      || registry.registry_id.length === 0
      || registry?.authorization_effect !== "none"
      || !Array.isArray(registry?.profiles)) {
    errors.push("profile registry metadata is invalid");
    return errors;
  }
  const ids = new Set();
  for (const profile of registry.profiles) {
    if (typeof profile?.profile_id !== "string"
        || ids.has(profile.profile_id)
        || environmentProfileId(profile.identity) !== profile.profile_id) {
      errors.push(`profile ${profile?.profile_id ?? "unknown"} has invalid identity`);
    }
    ids.add(profile?.profile_id);
  }
  return errors;
}

export function syncEnvironmentProfile(
  registry,
  capabilities,
  observedAt = new Date(),
  { incrementObservation = true } = {}
) {
  const errors = validateProfileRegistry(registry);
  if (errors.length > 0) throw new Error(errors.join("; "));
  const identity = buildEnvironmentProfileIdentity(capabilities);
  const profileId = environmentProfileId(identity);
  const contracts =
    capabilities?.qualification_system?.operation_contracts ?? [];
  const applicable = exactActiveQualifications(capabilities);
  const profile = {
    profile_id: profileId,
    identity,
    status: profileStatus(capabilities),
    first_seen_at: observedAt.toISOString(),
    last_seen_at: observedAt.toISOString(),
    observation_count: 1,
    capability_snapshot_digest: digest(capabilities),
    operation_summary: {
      reviewed_contracts: contracts.length,
      persistent_qualified: applicable.filter(
        (entry) => entry.authority_tier === "qualified"
      ).length,
      installed_candidates: applicable.filter(
        (entry) => entry.authority_tier === "session_canary"
      ).length
    },
    authorization_effect: "none"
  };
  const index = registry.profiles.findIndex(
    (entry) => entry.profile_id === profileId
  );
  if (index >= 0) {
    const previous = registry.profiles[index];
    registry.profiles[index] = {
      ...profile,
      first_seen_at: previous.first_seen_at,
      observation_count:
        previous.observation_count + (incrementObservation ? 1 : 0)
    };
  } else {
    registry.profiles.push(profile);
  }
  registry.profiles.sort((left, right) =>
    left.profile_id.localeCompare(right.profile_id));
  return {
    registry,
    selected_profile: registry.profiles.find(
      (entry) => entry.profile_id === profileId
    )
  };
}

function bindingAuditStatus(bindingAudit, contract, capabilities) {
  if (!bindingAudit) return "missing";
  if (bindingAudit?.authorization_effect !== "none"
      || bindingAudit?.qualification_effect !== "none"
      || bindingAudit?.release?.version !== capabilities?.game?.version
      || bindingAudit?.release?.commit?.toLowerCase()
        !== capabilities?.game?.commit?.toLowerCase()
      || bindingAudit?.release?.main_assembly_hash
        !== capabilities?.game?.release_declared_main_assembly_hash) {
    return "identity_mismatch";
  }
  const operationStatus = bindingAudit.operations?.find(
    (entry) =>
      entry?.surface_kind === contract.surface_kind
      && entry?.operation === contract.operation
  )?.status;
  if (operationStatus) return operationStatus;
  return contract?.witness_id === "gateway_reported_operation_witness"
    ? "runtime_publication_required"
    : "missing";
}

export function buildMigrationPlan({
  capabilities,
  bindingAudit = null,
  migrationPolicy
}) {
  const identity = buildEnvironmentProfileIdentity(capabilities);
  if (migrationPolicy?.schema_version !== 2
      || migrationPolicy?.authorization_effect !== "none"
      || !Array.isArray(migrationPolicy?.rules)) {
    throw new Error("Migration permission policy is invalid");
  }
  const rules = new Map(
    migrationPolicy.rules.map((rule) => [rule.risk_class, rule])
  );
  const active = exactActiveQualifications(capabilities);
  const operations = (
    capabilities?.qualification_system?.operation_contracts ?? []
  ).map((contract) => {
    const current = active.find(
      (entry) =>
        entry.surface_kind === contract.surface_kind
        && entry.operation === contract.operation
    );
    if (current?.authority_tier === "qualified") {
      return {
        surface_kind: contract.surface_kind,
        operation: contract.operation,
        risk_class: contract.risk_class,
        route: "direct_confirm_exact_profile",
        reason: `active_exact_qualification:${current.qualification_id}`
      };
    }
    if (current?.authority_tier === "session_canary") {
      return {
        surface_kind: contract.surface_kind,
        operation: contract.operation,
        risk_class: contract.risk_class,
        route: "collect_migration_evidence",
        reason: `active_exact_candidate:${current.qualification_id}`
      };
    }
    const rule = rules.get(contract.risk_class);
    if (!rule || !rule.eligible_modes.includes("migration_exploration")) {
      return {
        surface_kind: contract.surface_kind,
        operation: contract.operation,
        risk_class: contract.risk_class,
        route: "code_required",
        reason: "risk_class_not_supported_by_migration_policy"
      };
    }
    const auditStatus = bindingAuditStatus(
      bindingAudit,
      contract,
      capabilities
    );
    if (auditStatus === "reviewed_binding_match"
        || auditStatus === "runtime_publication_required") {
      return {
        surface_kind: contract.surface_kind,
        operation: contract.operation,
        risk_class: contract.risk_class,
        route: "test_confirm",
        reason: auditStatus === "reviewed_binding_match"
          ? "exact_binding_match_requires_live_commit_and_witness"
          : "manifest_fallback_requires_live_publication_commit_and_witness"
      };
    }
    return {
      surface_kind: contract.surface_kind,
      operation: contract.operation,
      risk_class: contract.risk_class,
      route: auditStatus === "missing"
        ? "evidence_needed"
        : "code_required",
      reason: `binding_audit:${auditStatus}`
    };
  });
  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    profile_id: environmentProfileId(identity),
    profile_identity: identity,
    routes: operations,
    summary: Object.fromEntries(
      [
        "direct_confirm_exact_profile",
        "collect_migration_evidence",
        "test_confirm",
        "evidence_needed",
        "code_required"
      ].map((route) => [
        route,
        operations.filter((entry) => entry.route === route).length
      ])
    ),
    authorization_effect: "none"
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJsonAtomic(filePath, value) {
  await mkdir(pathModule.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(
    temporary,
    `${JSON.stringify(value, null, 2)}\n`,
    { mode: 0o600 }
  );
  await rename(temporary, filePath);
}

async function readCapabilities(options) {
  if (options.capabilities) return readJson(options.capabilities);
  if (!options.endpoint) {
    throw new Error("Provide --capabilities or --endpoint");
  }
  const response = await fetch(
    `${options.endpoint.replace(/\/$/u, "")}/api/v2/capabilities`
  );
  if (!response.ok) {
    throw new Error(`Capabilities read failed with HTTP ${response.status}`);
  }
  return response.json();
}

async function main(argv) {
  const { command, options } = parseArgs(argv);
  if (command === "sync") {
    const capabilities = await readCapabilities(options);
    let registry;
    try {
      registry = await readJson(options.registry);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      registry = createEmptyProfileRegistry();
    }
    const result = syncEnvironmentProfile(registry, capabilities);
    await writeJsonAtomic(options.registry, result.registry);
    if (options.snapshot) {
      await writeJsonAtomic(options.snapshot, capabilities);
    }
    console.log(JSON.stringify({
      status: "profile_selected",
      profile: result.selected_profile,
      registry: options.registry,
      authorization_effect: "none"
    }, null, 2));
    return;
  }
  if (command === "inspect") {
    const registry = await readJson(options.registry);
    const errors = validateProfileRegistry(registry);
    console.log(JSON.stringify({
      registry,
      errors,
      authorization_effect: "none"
    }, null, 2));
    if (errors.length > 0) process.exitCode = 2;
    return;
  }
  if (command === "plan") {
    const plan = buildMigrationPlan({
      capabilities: await readCapabilities(options),
      bindingAudit: options["binding-audit"]
        ? await readJson(options["binding-audit"])
        : null,
      migrationPolicy: await readJson(options.policy)
    });
    if (options.out) await writeJsonAtomic(options.out, plan);
    console.log(JSON.stringify(plan, null, 2));
    return;
  }
  throw new Error(
    "Usage: connector-environment-profiles.mjs "
      + "<sync|inspect|plan> [options]"
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
