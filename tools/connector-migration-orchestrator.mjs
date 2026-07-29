#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildCandidateEvidence,
  buildQualificationPackage,
  collectQualificationEvidence,
  exactPackageApplicability,
  expectedEvidenceEnvironment,
  installQualificationPackage,
  readRunDirectory,
  validateQualificationPackage
} from "./connector-qualification-ledger.mjs";
import {
  buildMigrationPlan,
  createEmptyProfileRegistry,
  syncEnvironmentProfile
} from "./connector-environment-profiles.mjs";

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

function shortDigest(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function operationKey(value) {
  return `${value.surface_kind}\u0000${value.operation}`;
}

function safeName(surfaceKind, operation) {
  return `${surfaceKind}--${operation}`.replace(/[^a-z0-9_-]+/giu, "_");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJsonAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
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
  const response = await fetch(
    `${options.endpoint.replace(/\/$/u, "")}/api/v2/capabilities`
  );
  if (!response.ok) {
    throw new Error(`Capabilities read failed with HTTP ${response.status}`);
  }
  return response.json();
}

async function discoverRuns(runRoot) {
  const entries = await readdir(runRoot, { withFileTypes: true });
  const runDirectories = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("run-"))
    .map((entry) => path.join(runRoot, entry.name));
  const runs = [];
  const rejected = [];
  for (const runDirectory of runDirectories) {
    try {
      runs.push(await readRunDirectory(runDirectory));
    } catch (error) {
      rejected.push({
        run_directory: runDirectory,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return { runs, rejected };
}

function activeQualifications(capabilities) {
  return (capabilities?.qualification_system?.qualifications ?? []).filter(
    (entry) =>
      entry?.status === "active"
      && entry?.applicable_to_current_environment === true
  );
}

function ruleFor(policy, riskClass) {
  return policy.rules.find((rule) => rule.risk_class === riskClass);
}

function packageId(profileId, contract, tier) {
  return [
    "migration",
    profileId,
    shortDigest(operationKey(contract)),
    tier,
    Date.now().toString(36)
  ].join("-");
}

function candidateExpiry(now) {
  return new Date(now.valueOf() + 7 * 24 * 60 * 60 * 1000);
}

function qualifiedExpiry(now) {
  return new Date(now.valueOf() + 180 * 24 * 60 * 60 * 1000);
}

function qualificationThresholdMet(evidence) {
  const confirmed = evidence.runtime_evidence.filter(
    (entry) =>
      entry.outcome === "confirmed"
      && entry.evidence_class === "organic"
      && (evidence.witness_id === "gateway_reported_operation_witness"
        ? typeof entry.witness_id === "string" && entry.witness_id.length > 0
        : entry.witness_id === evidence.witness_id)
  );
  return confirmed.length >= 2 && evidence.runtime_epoch_count >= 2;
}

export async function executeMigrationCycle({
  capabilities,
  reloadCapabilities = null,
  bindingAudit,
  migrationPolicy,
  negativeEvidenceIds,
  profileRegistry,
  runRoot,
  workspace,
  storePath,
  apply = true,
  now = new Date()
}) {
  const synced = syncEnvironmentProfile(
    profileRegistry,
    capabilities,
    now
  );
  const profile = synced.selected_profile;
  const profileWorkspace = path.join(workspace, "profiles", profile.profile_id);
  await mkdir(profileWorkspace, { recursive: true });
  await writeJsonAtomic(
    path.join(profileWorkspace, "capabilities.json"),
    capabilities
  );
  const initialPlan = buildMigrationPlan({
    capabilities,
    bindingAudit,
    migrationPolicy
  });
  await writeJsonAtomic(
    path.join(profileWorkspace, "migration-plan.json"),
    initialPlan
  );

  const actions = [];
  for (const route of initialPlan.routes.filter(
    (entry) => entry.route === "test_confirm"
  )) {
    const contract =
      capabilities.qualification_system.operation_contracts.find(
        (entry) =>
          entry.surface_kind === route.surface_kind
          && entry.operation === route.operation
      );
    const rule = ruleFor(migrationPolicy, contract.risk_class);
    const evidence = buildCandidateEvidence({
      capabilities,
      bindingAudit,
      surfaceKind: contract.surface_kind,
      operation: contract.operation,
      negativeEvidenceIds,
      additionalEvidenceIds: [
        `profile:${profile.profile_id}`,
        `migration-policy:${migrationPolicy.policy_id}`
      ]
    });
    const qualification = buildQualificationPackage({
      capabilities,
      evidenceBundle: evidence,
      surfaceKind: contract.surface_kind,
      operation: contract.operation,
      qualificationId: packageId(profile.profile_id, contract, "candidate"),
      authorityTier: "session_canary",
      issuedAt: now,
      expiresAt: candidateExpiry(now)
    });
    const errors = validateQualificationPackage(qualification, now);
    const applicability = exactPackageApplicability(
      qualification,
      capabilities
    );
    if (errors.length > 0 || !applicability.applicable) {
      throw new Error(
        `Candidate dry-run failed for ${contract.surface_kind}/${contract.operation}: `
          + [...errors, JSON.stringify(applicability.checks)].join("; ")
      );
    }
    const artifactRoot = path.join(
      profileWorkspace,
      "operations",
      safeName(contract.surface_kind, contract.operation)
    );
    await writeJsonAtomic(path.join(artifactRoot, "candidate-evidence.json"), evidence);
    await writeJsonAtomic(path.join(artifactRoot, "candidate-package.json"), qualification);
    if (apply) {
      await installQualificationPackage({
        storePath,
        qualification,
        reason: `migration_profile:${profile.profile_id}`
      });
    }
    actions.push({
      surface_kind: contract.surface_kind,
      operation: contract.operation,
      action: apply ? "candidate_installed" : "candidate_dry_run",
      qualification_id: qualification.qualification_id,
      eligible_in_current_mode:
        rule?.eligible_modes.includes(
          capabilities.permission_system.mode
        ) === true
    });
  }

  let currentCapabilities = capabilities;
  if (apply && actions.length > 0 && reloadCapabilities) {
    currentCapabilities = await reloadCapabilities();
  }

  const runInventory = await discoverRuns(runRoot);
  const currentActive = activeQualifications(currentCapabilities);
  for (const candidate of currentActive.filter(
    (entry) => entry.authority_tier === "session_canary"
  )) {
    const contract =
      currentCapabilities.qualification_system.operation_contracts.find(
        (entry) =>
          entry.surface_kind === candidate.surface_kind
          && entry.operation === candidate.operation
      );
    if (!contract) continue;
    const evidence = collectQualificationEvidence({
      runs: runInventory.runs,
      surfaceKind: contract.surface_kind,
      operation: contract.operation,
      witnessId: contract.witness_id,
      negativeEvidenceIds,
      expectedEnvironment: expectedEvidenceEnvironment(
        currentCapabilities,
        contract
      )
    });
    const artifactRoot = path.join(
      profileWorkspace,
      "operations",
      safeName(contract.surface_kind, contract.operation)
    );
    await writeJsonAtomic(path.join(artifactRoot, "organic-evidence.json"), evidence);
    if (!qualificationThresholdMet(evidence)) {
      actions.push({
        surface_kind: contract.surface_kind,
        operation: contract.operation,
        action: "evidence_accumulating",
        confirmed_successes: evidence.runtime_evidence.length,
        runtime_epoch_count: evidence.runtime_epoch_count
      });
      continue;
    }

    const qualification = buildQualificationPackage({
      capabilities: currentCapabilities,
      evidenceBundle: evidence,
      surfaceKind: contract.surface_kind,
      operation: contract.operation,
      qualificationId: packageId(profile.profile_id, contract, "qualified"),
      authorityTier: "qualified",
      version: candidate.version + 1,
      issuedAt: now,
      expiresAt: qualifiedExpiry(now),
      supersedesQualificationId: candidate.qualification_id
    });
    const errors = validateQualificationPackage(qualification, now);
    const applicability = exactPackageApplicability(
      qualification,
      currentCapabilities
    );
    if (errors.length > 0 || !applicability.applicable) {
      throw new Error(
        `Qualification dry-run failed for ${contract.surface_kind}/${contract.operation}: `
          + [...errors, JSON.stringify(applicability.checks)].join("; ")
      );
    }
    await writeJsonAtomic(
      path.join(artifactRoot, "qualified-package.json"),
      qualification
    );
    if (apply) {
      await installQualificationPackage({
        storePath,
        qualification,
        reason: `automatic_evidence_promotion:${profile.profile_id}`
      });
    }
    actions.push({
      surface_kind: contract.surface_kind,
      operation: contract.operation,
      action: apply ? "qualification_installed" : "qualification_dry_run",
      qualification_id: qualification.qualification_id,
      confirmed_successes: evidence.runtime_evidence.length,
      runtime_epoch_count: evidence.runtime_epoch_count
    });
  }

  if (apply && actions.some(
    (entry) => entry.action === "qualification_installed"
  ) && reloadCapabilities) {
    currentCapabilities = await reloadCapabilities();
  }
  const finalSynced = currentCapabilities === capabilities
    ? synced
    : syncEnvironmentProfile(
        synced.registry,
        currentCapabilities,
        now,
        { incrementObservation: false }
      );
  const verified = activeQualifications(currentCapabilities);
  const result = {
    schema_version: 1,
    completed_at: new Date().toISOString(),
    profile: finalSynced.selected_profile,
    actions,
    run_inventory: {
      readable_runs: runInventory.runs.length,
      rejected_runs: runInventory.rejected
    },
    verified_active_qualifications: verified.map((entry) => ({
      qualification_id: entry.qualification_id,
      authority_tier: entry.authority_tier,
      surface_kind: entry.surface_kind,
      operation: entry.operation,
      applicable: entry.applicable_to_current_environment,
      status: entry.status
    })),
    authorization_effect: apply
      ? "validated_store_events_written_gateway_must_revalidate"
      : "none"
  };
  await writeJsonAtomic(path.join(profileWorkspace, "last-cycle.json"), result);
  return {
    registry: finalSynced.registry,
    result
  };
}

async function main(argv) {
  const { command, options } = parseArgs(argv);
  if (command !== "cycle") {
    throw new Error(
      "Usage: connector-migration-orchestrator.mjs cycle "
        + "--endpoint URL --registry FILE --workspace DIR --store FILE "
        + "--binding-audit FILE --policy FILE --negative-evidence FILE "
        + "--runs DIR [--apply true|false]"
    );
  }
  const capabilities = await readCapabilities(options);
  let registry;
  try {
    registry = await readJson(options.registry);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    registry = createEmptyProfileRegistry();
  }
  const negative = await readJson(options["negative-evidence"]);
  if (negative?.schema_version !== 1
      || negative?.authorization_effect !== "none"
      || !Array.isArray(negative?.evidence_ids)
      || negative.evidence_ids.length === 0) {
    throw new Error("Negative evidence inventory is invalid");
  }
  const reloadCapabilities = options.endpoint
    ? () => readCapabilities({ endpoint: options.endpoint })
    : null;
  const cycle = await executeMigrationCycle({
    capabilities,
    reloadCapabilities,
    bindingAudit: await readJson(options["binding-audit"]),
    migrationPolicy: await readJson(options.policy),
    negativeEvidenceIds: negative.evidence_ids,
    profileRegistry: registry,
    runRoot: options.runs,
    workspace: options.workspace,
    storePath: options.store,
    apply: options.apply !== "false"
  });
  await writeJsonAtomic(options.registry, cycle.registry);
  console.log(JSON.stringify(cycle.result, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
