#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
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

function textDigest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function operationKey(value) {
  return `${value.surface_kind}\u0000${value.operation}`;
}

const RUNTIME_REPORTED_WITNESS = "gateway_reported_operation_witness";
const EXPLICIT_NATIVE_CONTRACT = "explicit_native_contract";

function qualificationSlotKey(value) {
  return `${value.environment_digest}\u0000${operationKey(value)}`;
}

function advertisedOperationKeys(capabilities) {
  const keys = new Set();
  for (const surface of capabilities?.surfaces ?? []) {
    for (const operation of surface?.operations ?? []) {
      if (typeof surface?.kind === "string" && typeof operation === "string") {
        keys.add(operationKey({ surface_kind: surface.kind, operation }));
      }
    }
  }
  return keys;
}

function evidenceEnvironmentFromRun(run, surfaceKind, operation, witnessId) {
  const negotiated = run?.metadata?.adapter?.negotiated;
  const contract = negotiated?.qualification_operation_contracts?.find(
    (entry) => entry?.surface_kind === surfaceKind
      && entry?.operation === operation
  );
  const environment = {
    protocol_version: negotiated?.bridge_protocol_version,
    game_version: negotiated?.game_version,
    game_commit: negotiated?.game_commit,
    game_main_assembly_hash: negotiated?.main_assembly_hash,
    gateway_assembly_sha256: negotiated?.bridge_assembly_file_sha256,
    gateway_module_version_id: negotiated?.bridge_module_version_id,
    modset_fingerprint: negotiated?.modset_fingerprint,
    patch_digest: negotiated?.runtime_patch_digest,
    environment_digest: negotiated?.qualification_current_environment_digest,
    surface_kind: surfaceKind,
    operation,
    contract_kind: contract?.contract_kind,
    operation_fingerprint: contract?.contract_digest,
    completion_boundary: contract?.completion_boundary,
    witness_id: contract?.witness_id,
    risk_class: contract?.risk_class
  };
  const validStrings = Object.entries(environment)
    .filter(([field]) => field !== "game_main_assembly_hash")
    .every(([, value]) => typeof value === "string" && value.length > 0);
  return validStrings
    && Number.isInteger(environment.game_main_assembly_hash)
    && environment.witness_id === witnessId
    ? environment
    : null;
}

export function expectedEvidenceEnvironment(capabilities, contract) {
  return {
    protocol_version: capabilities?.protocol_version,
    game_version: capabilities?.game?.version,
    game_commit: capabilities?.game?.commit,
    game_main_assembly_hash: capabilities?.game?.main_assembly_hash,
    gateway_assembly_sha256: capabilities?.bridge?.assembly_file_sha256,
    gateway_module_version_id: capabilities?.bridge?.module_version_id,
    modset_fingerprint: capabilities?.game?.modset?.fingerprint,
    patch_digest: capabilities?.permission_system?.patch_inventory?.digest,
    environment_digest:
      capabilities?.qualification_system?.current_environment_digest,
    surface_kind: contract?.surface_kind,
    operation: contract?.operation,
    contract_kind: contract?.contract_kind,
    operation_fingerprint: contract?.contract_digest,
    completion_boundary: contract?.completion_boundary,
    witness_id: contract?.witness_id,
    risk_class: contract?.risk_class
  };
}

export function validateQualificationPackage(qualification, now = new Date()) {
  const errors = [];
  const requiredStrings = [
    "qualification_id", "authority_tier", "surface_kind", "operation",
    "contract_kind", "risk_class",
    "game_version", "game_commit", "gateway_protocol",
    "gateway_assembly_sha256", "gateway_module_version_id",
    "modset_fingerprint", "patch_digest", "environment_digest",
    "operation_fingerprint", "completion_boundary", "witness_id",
    "evidence_bundle_digest"
  ];
  for (const field of requiredStrings) {
    if (typeof qualification?.[field] !== "string" || qualification[field].length === 0) {
      errors.push(`${field} is required`);
    }
  }
  if (!Number.isInteger(qualification?.version) || qualification.version <= 0) {
    errors.push("version must be a positive integer");
  }
  if (!["session_canary", "qualified"].includes(qualification?.authority_tier)) {
    errors.push("authority_tier must be session_canary or qualified");
  }
  if (qualification?.contract_kind !== EXPLICIT_NATIVE_CONTRACT) {
    errors.push("durable qualification requires an explicit native contract");
  }
  if (!Number.isInteger(qualification?.game_main_assembly_hash)) {
    errors.push("game_main_assembly_hash must be an integer");
  }
  if (!/^[a-f0-9]{64}$/iu.test(qualification?.gateway_assembly_sha256 ?? "")) {
    errors.push("gateway_assembly_sha256 must be a SHA-256");
  }
  if (!/^[a-f0-9]{64}$/iu.test(qualification?.evidence_bundle_digest ?? "")) {
    errors.push("evidence_bundle_digest must be a SHA-256");
  }
  if (!Array.isArray(qualification?.evidence_ids) || qualification.evidence_ids.length === 0) {
    errors.push("evidence_ids must not be empty");
  }
  if (!Array.isArray(qualification?.negative_evidence_ids)
      || qualification.negative_evidence_ids.length === 0) {
    errors.push("negative_evidence_ids must not be empty");
  }
  const runtimeEvidence = Array.isArray(qualification?.runtime_evidence)
    ? qualification.runtime_evidence
    : [];
  const runtimeWitnessMatches = (entry) =>
    qualification?.witness_id === RUNTIME_REPORTED_WITNESS
      ? typeof entry?.witness_id === "string" && entry.witness_id.length > 0
      : entry?.witness_id === qualification?.witness_id;
  const epochs = new Set(runtimeEvidence
    .filter((entry) =>
      entry?.outcome === "confirmed"
      && entry?.evidence_class === "organic"
      && runtimeWitnessMatches(entry)
      && typeof entry?.request_id === "string"
      && entry.request_id.length > 0)
    .map((entry) => entry.runtime_epoch)
    .filter(Boolean));
  if (qualification?.authority_tier === "qualified" && epochs.size < 2) {
    errors.push("two distinct confirmed organic runtime epochs are required");
  }
  const issuedAt = new Date(qualification?.issued_at ?? "");
  const expiresAt = new Date(qualification?.expires_at ?? "");
  if (!Number.isFinite(issuedAt.valueOf())
      || !Number.isFinite(expiresAt.valueOf())
      || issuedAt > now
      || issuedAt >= expiresAt
      || expiresAt <= now) {
    errors.push("issued_at/expires_at are invalid or expired");
  }
  if (qualification?.authority_tier === "session_canary"
      && expiresAt - issuedAt > 7 * 24 * 60 * 60 * 1000) {
    errors.push("session_canary candidate lifetime must not exceed seven days");
  }
  return errors;
}

export function validateLedger(ledger, now = new Date()) {
  const errors = [];
  if (ledger?.schema_version !== 1 || typeof ledger?.store_id !== "string") {
    errors.push("ledger metadata must use schema_version=1 and a store_id");
  }
  if (!Array.isArray(ledger?.events)) {
    errors.push("ledger events must be an array");
    return errors;
  }
  const ids = new Set();
  ledger.events.forEach((event, index) => {
    if (event?.sequence !== index + 1) errors.push(`event ${index + 1} has a non-contiguous sequence`);
    if (typeof event?.event_id !== "string" || ids.has(event.event_id)) {
      errors.push(`event ${index + 1} has a missing or duplicate event_id`);
    }
    ids.add(event?.event_id);
    if (!["install", "revoke", "rollback"].includes(event?.type)) {
      errors.push(`event ${index + 1} has unsupported type ${event?.type}`);
    }
    if (event?.type === "install") {
      const eventAt = new Date(event.at);
      errors.push(...validateQualificationPackage(
        event.qualification,
        Number.isFinite(eventAt.valueOf()) ? eventAt : now
      )
        .map((error) => `event ${index + 1}: ${error}`));
    }
  });
  return errors;
}

export function projectLedger(ledger, now = new Date()) {
  const errors = validateLedger(ledger, now);
  if (errors.length > 0) return { errors, packages: [], active: [] };
  const packages = new Map();
  const status = new Map();
  const activeByOperation = new Map();
  for (const event of ledger.events) {
    if (event.type === "install") {
      const qualification = event.qualification;
      if (packages.has(qualification.qualification_id)) {
        errors.push(`duplicate qualification_id ${qualification.qualification_id}`);
        continue;
      }
      const key = qualificationSlotKey(qualification);
      const previous = activeByOperation.get(key);
      if (previous && qualification.supersedes_qualification_id !== previous) {
        errors.push(`${qualification.qualification_id} does not supersede active ${previous}`);
        continue;
      }
      if (!previous && qualification.supersedes_qualification_id) {
        errors.push(`${qualification.qualification_id} supersedes a non-current package`);
        continue;
      }
      if (previous) status.set(previous, "superseded");
      packages.set(qualification.qualification_id, qualification);
      status.set(qualification.qualification_id, "active");
      activeByOperation.set(key, qualification.qualification_id);
    } else {
      const target = packages.get(event.target_qualification_id);
      if (!target) {
        errors.push(`${event.type} targets unknown ${event.target_qualification_id}`);
        continue;
      }
      if (event.type === "rollback" && new Date(target.expires_at) <= now) {
        errors.push(`rollback targets expired ${event.target_qualification_id}`);
        continue;
      }
      const key = qualificationSlotKey(target);
      if (event.type === "revoke") {
        if (activeByOperation.get(key) === target.qualification_id) {
          activeByOperation.delete(key);
        }
        status.set(target.qualification_id, "revoked");
      } else {
        const current = activeByOperation.get(key);
        if (current && current !== target.qualification_id) status.set(current, "rolled_back");
        activeByOperation.set(key, target.qualification_id);
        status.set(target.qualification_id, "active");
      }
    }
  }
  return {
    errors,
    packages: [...packages.values()].map((qualification) => ({
      ...qualification,
      projected_status: new Date(qualification.expires_at) <= now
        && status.get(qualification.qualification_id) === "active"
        ? "expired"
        : status.get(qualification.qualification_id)
    })),
    active: [...activeByOperation.values()]
  };
}

function compareOperation(left, right) {
  if (!left || !right) {
    return {
      classification: "code_required",
      changed_components: ["operation_contract_presence"]
    };
  }
  const fields = [
    "contract_kind", "interaction_digest", "owner_digest", "source_digest", "operand_digest",
    "commit_digest", "completion_digest", "witness_digest",
    "completion_boundary", "witness_id", "risk_class"
  ];
  const changed = fields.filter((field) => left[field] !== right[field]);
  if (changed.length === 0) {
    return { classification: "unchanged", changed_components: [] };
  }
  const codeBoundary = new Set([
    "contract_kind", "owner_digest", "commit_digest", "completion_digest",
    "witness_digest", "completion_boundary", "witness_id"
  ]);
  return {
    classification: changed.some((field) => codeBoundary.has(field))
      ? "code_required"
      : "targeted_requalification",
    changed_components: changed
  };
}

export function compareQualificationInventories(left, right) {
  const leftContracts = new Map(
    (left?.qualification_system?.operation_contracts ?? []).map((entry) => [
      operationKey(entry),
      entry
    ])
  );
  const rightContracts = new Map(
    (right?.qualification_system?.operation_contracts ?? []).map((entry) => [
      operationKey(entry),
      entry
    ])
  );
  const leftAdvertised = advertisedOperationKeys(left);
  const rightAdvertised = advertisedOperationKeys(right);
  const environmentChanges = [
    ["game_version", left?.game?.version, right?.game?.version],
    ["game_commit", left?.game?.commit, right?.game?.commit],
    ["game_main_assembly_hash", left?.game?.main_assembly_hash, right?.game?.main_assembly_hash],
    ["gateway_protocol", left?.protocol_version, right?.protocol_version],
    ["gateway_sha", left?.bridge?.assembly_file_sha256, right?.bridge?.assembly_file_sha256],
    ["gateway_mvid", left?.bridge?.module_version_id, right?.bridge?.module_version_id],
    ["modset", left?.game?.modset?.fingerprint, right?.game?.modset?.fingerprint],
    ["patch", left?.permission_system?.patch_inventory?.digest, right?.permission_system?.patch_inventory?.digest]
  ].filter(([, before, after]) => before !== after)
    .map(([field]) => field);
  const keys = [...new Set([
    ...leftContracts.keys(),
    ...rightContracts.keys(),
    ...leftAdvertised,
    ...rightAdvertised
  ])].sort();
  const operations = keys.map((key) => {
    const before = leftContracts.get(key);
    const after = rightContracts.get(key);
    const [keySurfaceKind, keyOperation] = key.split("\u0000");
    const beforeAdvertised = leftAdvertised.has(key);
    const afterAdvertised = rightAdvertised.has(key);
    const comparison = !before || !after
      ? {
        classification: "code_required",
        changed_components: [
          "reviewed_operation_contract",
          ...(beforeAdvertised === afterAdvertised
            ? []
            : ["advertised_operation_presence"])
        ]
      }
      : compareOperation(before, after);
    const classification = comparison.classification === "unchanged"
      && environmentChanges.length > 0
      ? "targeted_requalification"
      : comparison.classification;
    return {
      surface_kind: after?.surface_kind ?? before?.surface_kind ?? keySurfaceKind,
      operation: after?.operation ?? before?.operation ?? keyOperation,
      classification,
      changed_components: comparison.changed_components,
      environment_changes: environmentChanges,
      reviewed_contract_before: Boolean(before),
      reviewed_contract_after: Boolean(after),
      advertised_before: beforeAdvertised,
      advertised_after: afterAdvertised
    };
  });
  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    source_digests: { left: digest(left), right: digest(right) },
    environment_changes: environmentChanges,
    operations,
    summary: {
      unchanged: operations.filter((entry) => entry.classification === "unchanged").length,
      targeted_requalification: operations.filter((entry) =>
        entry.classification === "targeted_requalification").length,
      code_required: operations.filter((entry) => entry.classification === "code_required").length
    },
    unmodeled_advertised_operations: operations.filter((entry) =>
      (entry.advertised_before || entry.advertised_after)
      && (!entry.reviewed_contract_before || !entry.reviewed_contract_after))
      .map((entry) => ({
        surface_kind: entry.surface_kind,
        operation: entry.operation
      })),
    authorization_effect: "none"
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJsonAtomic(path, value) {
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, path);
}

async function appendEvent(storePath, event) {
  const ledger = await readJson(storePath);
  const before = projectLedger(ledger);
  if (before.errors.length > 0) throw new Error(before.errors.join("; "));
  ledger.events.push({
    sequence: ledger.events.length + 1,
    event_id: randomUUID(),
    at: new Date().toISOString(),
    ...event
  });
  const after = projectLedger(ledger);
  if (after.errors.length > 0) throw new Error(after.errors.join("; "));
  await writeJsonAtomic(storePath, ledger);
  return after;
}

export function exactPackageApplicability(qualification, capabilities) {
  const contract = capabilities?.qualification_system?.operation_contracts?.find(
    (entry) => entry.surface_kind === qualification.surface_kind
      && entry.operation === qualification.operation
  );
  const checks = {
    game_version: qualification.game_version === capabilities?.game?.version,
    game_commit: qualification.game_commit === capabilities?.game?.commit,
    game_main_assembly_hash:
      qualification.game_main_assembly_hash === capabilities?.game?.main_assembly_hash,
    gateway_protocol: qualification.gateway_protocol === capabilities?.protocol_version,
    gateway_sha:
      qualification.gateway_assembly_sha256?.toLowerCase()
        === capabilities?.bridge?.assembly_file_sha256?.toLowerCase(),
    gateway_mvid:
      qualification.gateway_module_version_id?.toLowerCase()
        === capabilities?.bridge?.module_version_id?.toLowerCase(),
    modset: qualification.modset_fingerprint === capabilities?.game?.modset?.fingerprint,
    patch:
      qualification.patch_digest
        === capabilities?.permission_system?.patch_inventory?.digest,
    environment:
      qualification.environment_digest
        === capabilities?.qualification_system?.current_environment_digest,
    operation_contract:
      qualification.operation_fingerprint === contract?.contract_digest,
    contract_kind:
      qualification.contract_kind === EXPLICIT_NATIVE_CONTRACT
      && contract?.contract_kind === EXPLICIT_NATIVE_CONTRACT,
    completion_boundary:
      qualification.completion_boundary === contract?.completion_boundary,
    witness: qualification.witness_id === contract?.witness_id
  };
  return { applicable: Object.values(checks).every(Boolean), checks };
}

export function buildQualificationPackage({
  capabilities,
  evidenceBundle,
  surfaceKind,
  operation,
  qualificationId,
  authorityTier = "qualified",
  version = 1,
  issuedAt = new Date(),
  expiresAt,
  supersedesQualificationId = null
}) {
  const contract = capabilities?.qualification_system?.operation_contracts?.find(
    (entry) => entry.surface_kind === surfaceKind && entry.operation === operation
  );
  if (!contract) {
    throw new Error(
      `${surfaceKind}/${operation} has no reviewed operation qualification contract; code_required`
    );
  }
  if (contract.contract_kind !== EXPLICIT_NATIVE_CONTRACT) {
    throw new Error(
      `${surfaceKind}/${operation} is a migration fallback, not an explicit native contract; code_required`
    );
  }
  if (!capabilities?.qualification_system?.current_environment_digest
      || !capabilities?.permission_system?.patch_inventory?.digest
      || !capabilities?.game?.modset?.fingerprint) {
    throw new Error("Capabilities lack exact qualification identity");
  }
  const expected = expectedEvidenceEnvironment(capabilities, contract);
  if (!evidenceBundle?.evidence_environment
      || digest(evidenceBundle.evidence_environment) !== digest(expected)) {
    throw new Error(
      "Evidence does not match the exact capability environment and operation contract"
    );
  }
  if (authorityTier === "session_canary") {
    const audit = evidenceBundle?.binding_audit;
    if (!["reviewed_binding_match", "runtime_publication_required"].includes(
          audit?.status
        )
        || !/^[a-f0-9]{64}$/iu.test(audit?.report_digest ?? "")
        || !/^[a-f0-9]{64}$/iu.test(audit?.operation_binding_digest ?? "")
        || !/^[a-f0-9]{64}$/iu.test(audit?.game_assembly_sha256 ?? "")
        || !/^[a-f0-9-]{36}$/iu.test(audit?.game_assembly_mvid ?? "")
        || audit?.game_version !== capabilities.game.version
        || audit?.game_commit?.toLowerCase()
          !== capabilities.game.commit?.toLowerCase()
        || audit?.release_declared_main_assembly_hash
          !== capabilities.game.release_declared_main_assembly_hash) {
      throw new Error(
        "Session canary evidence requires an exact reviewed operation binding audit"
      );
    }
  }
  const result = {
    qualification_id: qualificationId,
    version,
    authority_tier: authorityTier,
    surface_kind: surfaceKind,
    operation,
    contract_kind: contract.contract_kind,
    risk_class: contract.risk_class,
    game_version: capabilities.game.version,
    game_commit: capabilities.game.commit,
    game_main_assembly_hash: capabilities.game.main_assembly_hash,
    gateway_protocol: capabilities.protocol_version,
    gateway_assembly_sha256: capabilities.bridge.assembly_file_sha256,
    gateway_module_version_id: capabilities.bridge.module_version_id,
    modset_fingerprint: capabilities.game.modset.fingerprint,
    patch_digest: capabilities.permission_system.patch_inventory.digest,
    environment_digest:
      capabilities.qualification_system.current_environment_digest,
    operation_fingerprint: contract.contract_digest,
    completion_boundary: contract.completion_boundary,
    witness_id: contract.witness_id,
    evidence_bundle_digest: digest(evidenceBundle),
    evidence_ids: evidenceBundle.evidence_ids,
    negative_evidence_ids: evidenceBundle.negative_evidence_ids,
    runtime_evidence: evidenceBundle.runtime_evidence,
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    supersedes_qualification_id: supersedesQualificationId
  };
  const errors = validateQualificationPackage(result, issuedAt);
  if (errors.length > 0) throw new Error(errors.join("; "));
  return result;
}

export function buildCandidateEvidence({
  capabilities,
  bindingAudit,
  surfaceKind,
  operation,
  negativeEvidenceIds,
  additionalEvidenceIds = []
}) {
  const contract = capabilities?.qualification_system?.operation_contracts?.find(
    (entry) => entry.surface_kind === surfaceKind && entry.operation === operation
  );
  const audited = bindingAudit?.operations?.find(
    (entry) => entry.surface_kind === surfaceKind && entry.operation === operation
  );
  if (!contract) {
    throw new Error(`${surfaceKind}/${operation} has no current operation identity`);
  }
  const runtimePublicationFallback =
    contract.witness_id === RUNTIME_REPORTED_WITNESS
    && audited === undefined;
  if (audited?.status !== "reviewed_binding_match"
      && !runtimePublicationFallback) {
    throw new Error(`${surfaceKind}/${operation} lacks a matching binding audit`);
  }
  if (bindingAudit?.authorization_effect !== "none"
      || bindingAudit?.qualification_effect !== "none"
      || bindingAudit?.release?.version !== capabilities?.game?.version
      || bindingAudit?.release?.commit?.toLowerCase()
        !== capabilities?.game?.commit?.toLowerCase()
      || bindingAudit?.release?.main_assembly_hash
        !== capabilities?.game?.release_declared_main_assembly_hash
      || !/^[a-f0-9]{64}$/iu.test(bindingAudit?.game_assembly?.sha256 ?? "")
      || !/^[a-f0-9-]{36}$/iu.test(
        bindingAudit?.game_assembly?.module_version_id ?? ""
      )) {
    throw new Error("Binding audit does not match the exact capability game release");
  }
  if (!Array.isArray(negativeEvidenceIds) || negativeEvidenceIds.length === 0) {
    throw new Error("At least one negative evidence id is required");
  }
  return {
    schema_version: 1,
    surface_kind: surfaceKind,
    operation,
    witness_id: contract.witness_id,
    evidence_environment: expectedEvidenceEnvironment(capabilities, contract),
    binding_audit: {
      status: runtimePublicationFallback
        ? "runtime_publication_required"
        : audited.status,
      report_digest: digest(bindingAudit),
      manifest_id: bindingAudit.manifest_id,
      manifest_digest: bindingAudit.manifest_digest,
      game_version: bindingAudit.release.version,
      game_commit: bindingAudit.release.commit,
      release_declared_main_assembly_hash:
        bindingAudit.release.main_assembly_hash,
      game_assembly_sha256: bindingAudit.game_assembly.sha256,
      game_assembly_mvid: bindingAudit.game_assembly.module_version_id,
      operation_binding_digest: runtimePublicationFallback
        ? contract.contract_digest
        : audited.binding_digest
    },
    evidence_ids: [...new Set([
      runtimePublicationFallback
        ? `runtime-contract:${contract.contract_digest}`
        : `binding-audit:${bindingAudit.manifest_id}:${audited.binding_digest}`,
      ...additionalEvidenceIds
    ])],
    negative_evidence_ids: [...new Set(negativeEvidenceIds)],
    runtime_evidence: [],
    runtime_epoch_count: 0,
    authorization_effect: "none"
  };
}

export function collectQualificationEvidence({
  runs,
  surfaceKind,
  operation,
  witnessId,
  negativeEvidenceIds,
  expectedEnvironment = null
}) {
  const runtimeEvidence = [];
  const evidenceIds = [];
  const evidenceEnvironments = new Map();
  const rejectedRuns = [];
  for (const run of runs) {
    if (run.metadata?.evidence?.provenance !== "ordinary_gameplay") continue;
    const runtimeEpoch =
      run.metadata?.adapter?.negotiated?.bridge_runtime_instance_id;
    const evidenceEnvironment = evidenceEnvironmentFromRun(
      run,
      surfaceKind,
      operation,
      witnessId
    );
    if (typeof runtimeEpoch !== "string"
        || runtimeEpoch.length === 0
        || evidenceEnvironment == null) {
      rejectedRuns.push({
        run_id: run.metadata?.runId ?? "unknown",
        reason: "missing_or_mismatched_exact_qualification_identity"
      });
      continue;
    }
    if (expectedEnvironment != null
        && digest(evidenceEnvironment) !== digest(expectedEnvironment)) {
      rejectedRuns.push({
        run_id: run.metadata?.runId ?? "unknown",
        reason: "mismatched_exact_qualification_environment"
      });
      continue;
    }
    for (const decision of run.decisions) {
      const completion = decision?.execution?.adapterResult?.events
        ?.findLast?.((event) => event?.status === "completed");
      const witnessMatches = witnessId === RUNTIME_REPORTED_WITNESS
        ? typeof completion?.evidence === "string"
          && completion.evidence.length > 0
        : completion?.evidence === witnessId;
      if (decision?.outcome !== "executed_and_settled"
          || decision?.preState?.normalizedState?.surface?.kind !== surfaceKind
          || decision?.execution?.action?.bridgeActionKind !== operation
          || decision?.execution?.adapterResult?.status !== "completed"
          || decision?.execution?.adapterResult?.outcome !== "confirmed"
          || !witnessMatches) {
        continue;
      }
      runtimeEvidence.push({
        runtime_epoch: runtimeEpoch,
        request_id: decision.execution.adapterResult.request_id,
        outcome: "confirmed",
        witness_id: completion.evidence,
        evidence_class: "organic"
      });
      evidenceEnvironments.set(digest(evidenceEnvironment), evidenceEnvironment);
      evidenceIds.push(`${run.metadata.runId}:${decision.decisionId}`);
    }
  }
  if (evidenceEnvironments.size > 1) {
    throw new Error(
      "Organic evidence spans multiple exact environments or operation contracts"
    );
  }
  return {
    schema_version: 1,
    surface_kind: surfaceKind,
    operation,
    witness_id: witnessId,
    evidence_environment:
      evidenceEnvironments.values().next().value ?? null,
    evidence_ids: [...new Set(evidenceIds)],
    negative_evidence_ids: [...new Set(negativeEvidenceIds)],
    runtime_evidence: runtimeEvidence,
    runtime_epoch_count: new Set(
      runtimeEvidence.map((entry) => entry.runtime_epoch)
    ).size,
    rejected_runs: rejectedRuns,
    authorization_effect: "none"
  };
}

export async function readRunDirectory(path) {
  const metadata = await readJson(`${path.replace(/\/$/u, "")}/metadata.json`);
  const lines = (await readFile(
    `${path.replace(/\/$/u, "")}/decisions.jsonl`,
    "utf8"
  )).split(/\r?\n/u).filter(Boolean);
  return { metadata, decisions: lines.map((line) => JSON.parse(line)) };
}

export async function installQualificationPackage({
  storePath,
  qualification,
  reason = "automatic_migration_orchestrator"
}) {
  const errors = validateQualificationPackage(qualification);
  if (errors.length > 0) throw new Error(errors.join("; "));
  let ledger;
  try {
    ledger = await readJson(storePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    ledger = {
      schema_version: 1,
      store_id: "local_connector_qualification_store",
      events: []
    };
    await writeJsonAtomic(storePath, ledger);
  }
  return appendEvent(storePath, {
    type: "install",
    qualification,
    target_qualification_id: null,
    reason
  });
}

async function main(argv) {
  const { command, options } = parseArgs(argv);
  if (command === "inspect") {
    const rawLedger = await readFile(options.store, "utf8");
    const ledger = JSON.parse(rawLedger);
    const projection = projectLedger(ledger);
    console.log(JSON.stringify({
      store_id: ledger.store_id,
      store_digest: textDigest(rawLedger),
      ...projection
    }, null, 2));
    if (projection.errors.length > 0) process.exitCode = 2;
    return;
  }
  if (command === "dry-run") {
    const qualification = await readJson(options.package);
    const errors = validateQualificationPackage(qualification);
    const applicability = options.capabilities
      ? exactPackageApplicability(qualification, await readJson(options.capabilities))
      : null;
    console.log(JSON.stringify({
      valid_package: errors.length === 0,
      errors,
      applicability,
      authorization_effect: "none"
    }, null, 2));
    if (errors.length > 0 || applicability?.applicable === false) process.exitCode = 2;
    return;
  }
  if (command === "install") {
    const qualification = await readJson(options.package);
    const errors = validateQualificationPackage(qualification);
    if (errors.length > 0) throw new Error(errors.join("; "));
    const projection = await appendEvent(options.store, {
      type: "install",
      qualification,
      target_qualification_id: null,
      reason: options.reason ?? null
    });
    console.log(JSON.stringify({ status: "installed", projection }, null, 2));
    return;
  }
  if (command === "revoke" || command === "rollback") {
    const projection = await appendEvent(options.store, {
      type: command,
      qualification: null,
      target_qualification_id: options.id,
      reason: options.reason ?? `operator_${command}`
    });
    console.log(JSON.stringify({ status: command, projection }, null, 2));
    return;
  }
  if (command === "diff") {
    console.log(JSON.stringify(compareQualificationInventories(
      await readJson(options.from),
      await readJson(options.to)
    ), null, 2));
    return;
  }
  if (command === "assemble") {
    const capabilities = await readJson(options.capabilities);
    const evidenceBundle = await readJson(options.evidence);
    const expiresAt = new Date(options.expires);
    if (!Number.isFinite(expiresAt.valueOf())) {
      throw new Error("--expires must be an ISO timestamp");
    }
    const qualification = buildQualificationPackage({
      capabilities,
      evidenceBundle,
      surfaceKind: options.surface,
      operation: options.operation,
      qualificationId: options.id ?? `qualification-${randomUUID()}`,
      authorityTier: options.tier ?? "qualified",
      version: Number(options.version ?? "1"),
      expiresAt,
      supersedesQualificationId: options.supersedes ?? null
    });
    await writeJsonAtomic(options.out, qualification);
    console.log(JSON.stringify({
      status: "assembled_not_installed",
      output: options.out,
      qualification_id: qualification.qualification_id,
      environment_digest: qualification.environment_digest,
      operation_fingerprint: qualification.operation_fingerprint,
      authorization_effect: "none"
    }, null, 2));
    return;
  }
  if (command === "seed-candidate") {
    const bundle = buildCandidateEvidence({
      capabilities: await readJson(options.capabilities),
      bindingAudit: await readJson(options["binding-audit"]),
      surfaceKind: options.surface,
      operation: options.operation,
      negativeEvidenceIds: options.negative.split(",").filter(Boolean),
      additionalEvidenceIds: (options.evidence ?? "").split(",").filter(Boolean)
    });
    await writeJsonAtomic(options.out, bundle);
    console.log(JSON.stringify({
      status: "candidate_evidence_seeded_not_authorized",
      output: options.out,
      binding_audit: bundle.binding_audit,
      authorization_effect: "none"
    }, null, 2));
    return;
  }
  if (command === "collect") {
    const runPaths = options.runs.split(",").filter(Boolean);
    let expectedEnvironment = null;
    if (options.capabilities) {
      const capabilities = await readJson(options.capabilities);
      const contract =
        capabilities?.qualification_system?.operation_contracts?.find(
          (entry) =>
            entry.surface_kind === options.surface
            && entry.operation === options.operation
        );
      if (!contract) {
        throw new Error(
          `${options.surface}/${options.operation} has no current operation contract`
        );
      }
      expectedEnvironment = expectedEvidenceEnvironment(
        capabilities,
        contract
      );
    }
    const bundle = collectQualificationEvidence({
      runs: await Promise.all(runPaths.map(readRunDirectory)),
      surfaceKind: options.surface,
      operation: options.operation,
      witnessId: options.witness,
      negativeEvidenceIds: options.negative.split(",").filter(Boolean),
      expectedEnvironment
    });
    await writeJsonAtomic(options.out, bundle);
    console.log(JSON.stringify({
      status: "evidence_collected_not_authorized",
      output: options.out,
      evidence_count: bundle.evidence_ids.length,
      runtime_epoch_count: bundle.runtime_epoch_count,
      negative_evidence_count: bundle.negative_evidence_ids.length,
      authorization_effect: "none"
    }, null, 2));
    return;
  }
  if (command === "capture") {
    const response = await fetch(`${options.endpoint.replace(/\/$/u, "")}/api/v2/capabilities`);
    if (!response.ok) throw new Error(`Capabilities read failed with HTTP ${response.status}`);
    const capabilities = await response.json();
    await writeJsonAtomic(options.out, capabilities);
    console.log(JSON.stringify({
      status: "captured",
      output: options.out,
      protocol_version: capabilities.protocol_version,
      gateway_sha: capabilities.bridge?.assembly_file_sha256,
      gateway_mvid: capabilities.bridge?.module_version_id,
      modset: capabilities.game?.modset?.fingerprint,
      authorization_effect: "none"
    }, null, 2));
    return;
  }
  throw new Error(
    "Usage: connector-qualification-ledger.mjs "
      + "<inspect|dry-run|collect|seed-candidate|assemble|install|revoke|rollback|diff|capture> [options]"
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
