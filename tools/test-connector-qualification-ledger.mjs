import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  buildQualificationPackage,
  buildCandidateEvidence,
  collectQualificationEvidence,
  compareQualificationInventories,
  projectLedger,
  validateQualificationPackage
} from "./connector-qualification-ledger.mjs";

const now = new Date("2026-07-25T00:00:00Z");
const contract = {
  surface_kind: "shop_room",
  operation: "open_shop_inventory",
  interaction_digest: "1".repeat(64),
  owner_digest: "2".repeat(64),
  source_digest: "3".repeat(64),
  operand_digest: "4".repeat(64),
  commit_digest: "5".repeat(64),
  completion_digest: "6".repeat(64),
  witness_digest: "7".repeat(64),
  contract_digest: "8".repeat(64),
  completion_boundary: "continuation_handoff_observed",
  witness_id: "shop_inventory_opened",
  risk_class: "reversible_navigation"
};
const fallbackContract = {
  ...contract,
  surface_kind: "event_option",
  operation: "choose_event_option",
  contract_digest: "9".repeat(64),
  completion_boundary: "gateway_semantic_completion_observed",
  witness_id: "gateway_reported_operation_witness",
  risk_class: "persistent_run_mutation"
};
const qualification = {
  qualification_id: "qualification-a",
  version: 1,
  authority_tier: "qualified",
  surface_kind: contract.surface_kind,
  operation: contract.operation,
  risk_class: contract.risk_class,
  game_version: "v0.109.0",
  game_commit: "commit",
  game_main_assembly_hash: 1,
  gateway_protocol: "2.0-preview.67",
  gateway_assembly_sha256: "a".repeat(64),
  gateway_module_version_id: "mvid",
  modset_fingerprint: "modset",
  patch_digest: "patch",
  environment_digest: "environment",
  operation_fingerprint: contract.contract_digest,
  completion_boundary: contract.completion_boundary,
  witness_id: contract.witness_id,
  evidence_bundle_digest: "b".repeat(64),
  evidence_ids: ["run-a", "run-b"],
  negative_evidence_ids: ["stale-negative"],
  runtime_evidence: [
    {
      runtime_epoch: "runtime-a",
      request_id: "request-a",
      outcome: "confirmed",
      witness_id: contract.witness_id,
      evidence_class: "organic"
    },
    {
      runtime_epoch: "runtime-b",
      request_id: "request-b",
      outcome: "confirmed",
      witness_id: contract.witness_id,
      evidence_class: "organic"
    }
  ],
  issued_at: "2026-07-24T00:00:00Z",
  expires_at: "2026-08-25T00:00:00Z",
  supersedes_qualification_id: null
};

assert.deepEqual(validateQualificationPackage(qualification, now), []);
assert.match(
  validateQualificationPackage({
    ...qualification,
    runtime_evidence: qualification.runtime_evidence.slice(0, 1)
  }, now).join("\n"),
  /two distinct/u
);
assert.deepEqual(validateQualificationPackage({
  ...qualification,
  authority_tier: "session_canary",
  runtime_evidence: [],
  expires_at: "2026-07-28T00:00:00Z"
}, now), []);
const evidenceBundle = collectQualificationEvidence({
  runs: [
    {
      metadata: {
        runId: "run-a",
        evidence: { provenance: "ordinary_gameplay" },
        adapter: {
          negotiated: {
            bridge_runtime_instance_id: "runtime-a",
            bridge_protocol_version: "2.0-preview.67",
            bridge_assembly_file_sha256: "a".repeat(64),
            bridge_module_version_id: "mvid",
            game_version: "v0.109.0",
            game_commit: "commit",
            main_assembly_hash: 1,
            modset_fingerprint: "modset",
            runtime_patch_digest: "patch",
            qualification_current_environment_digest: "environment",
            qualification_operation_contracts: [contract]
          }
        }
      },
      decisions: [{
        decisionId: "decision-a",
        outcome: "executed_and_settled",
        preState: { normalizedState: { surface: { kind: "shop_room" } } },
        execution: {
          action: { bridgeActionKind: "open_shop_inventory" },
          adapterResult: {
            request_id: "request-a",
            status: "completed",
            outcome: "confirmed",
            events: [{ status: "completed", evidence: "shop_inventory_opened" }]
          }
        }
      }]
    },
    {
      metadata: {
        runId: "run-b",
        evidence: { provenance: "ordinary_gameplay" },
        adapter: {
          negotiated: {
            bridge_runtime_instance_id: "runtime-b",
            bridge_protocol_version: "2.0-preview.67",
            bridge_assembly_file_sha256: "a".repeat(64),
            bridge_module_version_id: "mvid",
            game_version: "v0.109.0",
            game_commit: "commit",
            main_assembly_hash: 1,
            modset_fingerprint: "modset",
            runtime_patch_digest: "patch",
            qualification_current_environment_digest: "environment",
            qualification_operation_contracts: [contract]
          }
        }
      },
      decisions: [{
        decisionId: "decision-b",
        outcome: "executed_and_settled",
        preState: { normalizedState: { surface: { kind: "shop_room" } } },
        execution: {
          action: { bridgeActionKind: "open_shop_inventory" },
          adapterResult: {
            request_id: "request-b",
            status: "completed",
            outcome: "confirmed",
            events: [{ status: "completed", evidence: "shop_inventory_opened" }]
          }
        }
      }]
    }
  ],
  surfaceKind: "shop_room",
  operation: "open_shop_inventory",
  witnessId: "shop_inventory_opened",
  negativeEvidenceIds: ["stale-action-negative"]
});
assert.equal(evidenceBundle.runtime_epoch_count, 2);
assert.equal(evidenceBundle.evidence_ids.length, 2);
assert.equal(evidenceBundle.evidence_environment.environment_digest, "environment");

const ledger = {
  schema_version: 1,
  store_id: "fixture-store",
  events: [{
    sequence: 1,
    event_id: "event-1",
    type: "install",
    at: "2026-07-25T00:00:00Z",
    qualification,
    target_qualification_id: null,
    reason: null
  }]
};
assert.deepEqual(projectLedger(ledger, now).active, ["qualification-a"]);
const otherEnvironment = {
  ...qualification,
  qualification_id: "qualification-other-environment",
  game_version: "v0.110.0",
  game_commit: "other-commit",
  game_main_assembly_hash: 2,
  modset_fingerprint: "other-modset",
  patch_digest: "other-patch",
  environment_digest: "other-environment"
};
const multiEnvironment = structuredClone(ledger);
multiEnvironment.events.push({
  sequence: 2,
  event_id: "event-other-environment",
  type: "install",
  at: "2026-07-25T00:01:00Z",
  qualification: otherEnvironment,
  target_qualification_id: null,
  reason: "fixture"
});
assert.deepEqual(
  projectLedger(multiEnvironment, now).active.sort(),
  ["qualification-a", "qualification-other-environment"]
);
const revoked = structuredClone(ledger);
revoked.events.push({
  sequence: 2,
  event_id: "event-2",
  type: "revoke",
  at: "2026-07-25T00:01:00Z",
  qualification: null,
  target_qualification_id: "qualification-a",
  reason: "fixture"
});
assert.deepEqual(projectLedger(revoked, now).active, []);

const inventory = {
  protocol_version: "2.0-preview.67",
  bridge: { assembly_file_sha256: "a".repeat(64), module_version_id: "mvid" },
  game: {
    version: "v0.109.0",
    commit: "commit",
    main_assembly_hash: 1,
    release_declared_main_assembly_hash: 42,
    modset: { fingerprint: "modset" }
  },
  permission_system: { patch_inventory: { digest: "patch" } },
  surfaces: [{
    kind: "shop_room",
    operations: ["open_shop_inventory", "purchase_shop_card"]
  }],
  qualification_system: {
    current_environment_digest: "environment",
    operation_contracts: [contract]
  }
};
const bindingAudit = {
  schema_version: 1,
  authorization_effect: "none",
  qualification_effect: "none",
  manifest_id: "fixture-binding-audit",
  manifest_digest: "c".repeat(64),
  release: {
    version: inventory.game.version,
    commit: inventory.game.commit,
    main_assembly_hash: inventory.game.release_declared_main_assembly_hash
  },
  game_assembly: {
    sha256: "d".repeat(64),
    module_version_id: "208f08b8-d5f5-47f8-9e96-d3a4299ee709"
  },
  operations: [{
    surface_kind: contract.surface_kind,
    operation: contract.operation,
    status: "reviewed_binding_match",
    binding_digest: "e".repeat(64)
  }]
};
const candidateEvidence = buildCandidateEvidence({
  capabilities: inventory,
  bindingAudit,
  surfaceKind: contract.surface_kind,
  operation: contract.operation,
  negativeEvidenceIds: ["stale-action-negative"]
});
const fallbackInventory = {
  ...inventory,
  surfaces: [{
    kind: fallbackContract.surface_kind,
    operations: [fallbackContract.operation]
  }],
  qualification_system: {
    ...inventory.qualification_system,
    operation_contracts: [fallbackContract]
  }
};
const fallbackCandidateEvidence = buildCandidateEvidence({
  capabilities: fallbackInventory,
  bindingAudit,
  surfaceKind: fallbackContract.surface_kind,
  operation: fallbackContract.operation,
  negativeEvidenceIds: ["stale-action-negative"]
});
assert.equal(
  fallbackCandidateEvidence.binding_audit.status,
  "runtime_publication_required"
);
assert.equal(
  fallbackCandidateEvidence.binding_audit.operation_binding_digest,
  fallbackContract.contract_digest
);
assert.deepEqual(
  buildQualificationPackage({
    capabilities: fallbackInventory,
    evidenceBundle: fallbackCandidateEvidence,
    surfaceKind: fallbackContract.surface_kind,
    operation: fallbackContract.operation,
    qualificationId: "fallback-candidate-package",
    authorityTier: "session_canary",
    issuedAt: now,
    expiresAt: new Date("2026-07-28T00:00:00Z")
  }).witness_id,
  "gateway_reported_operation_witness"
);
function fallbackRun(runtimeEpoch, requestId, witness) {
  return {
    metadata: {
      runId: `run-${runtimeEpoch}`,
      evidence: { provenance: "ordinary_gameplay" },
      adapter: {
        negotiated: {
          bridge_runtime_instance_id: runtimeEpoch,
          bridge_protocol_version: "2.0-preview.67",
          bridge_assembly_file_sha256: "a".repeat(64),
          bridge_module_version_id: "mvid",
          game_version: "v0.109.0",
          game_commit: "commit",
          main_assembly_hash: 1,
          modset_fingerprint: "modset",
          runtime_patch_digest: "patch",
          qualification_current_environment_digest: "environment",
          qualification_operation_contracts: [fallbackContract]
        }
      }
    },
    decisions: [{
      decisionId: `decision-${runtimeEpoch}`,
      outcome: "executed_and_settled",
      preState: {
        normalizedState: {
          surface: { kind: fallbackContract.surface_kind }
        }
      },
      execution: {
        action: { bridgeActionKind: fallbackContract.operation },
        adapterResult: {
          request_id: requestId,
          status: "completed",
          outcome: "confirmed",
          events: [{ status: "completed", evidence: witness }]
        }
      }
    }]
  };
}
const fallbackEvidence = collectQualificationEvidence({
  runs: [
    fallbackRun(
      "runtime-fallback-a",
      "request-fallback-a",
      "event_option_committed_and_owner_advanced"
    ),
    fallbackRun("runtime-fallback-b", "request-fallback-b", null)
  ],
  surfaceKind: fallbackContract.surface_kind,
  operation: fallbackContract.operation,
  witnessId: fallbackContract.witness_id,
  negativeEvidenceIds: ["stale-action-negative"]
});
assert.equal(fallbackEvidence.runtime_evidence.length, 1);
assert.equal(
  fallbackEvidence.runtime_evidence[0].witness_id,
  "event_option_committed_and_owner_advanced"
);
const candidatePackage = buildQualificationPackage({
  capabilities: inventory,
  evidenceBundle: candidateEvidence,
  surfaceKind: contract.surface_kind,
  operation: contract.operation,
  qualificationId: "candidate-package",
  authorityTier: "session_canary",
  issuedAt: now,
  expiresAt: new Date("2026-07-28T00:00:00Z")
});
assert.equal(candidatePackage.authority_tier, "session_canary");
assert.throws(() => buildCandidateEvidence({
  capabilities: inventory,
  bindingAudit: {
    ...bindingAudit,
    release: {
      ...bindingAudit.release,
      main_assembly_hash: 43
    }
  },
  surfaceKind: contract.surface_kind,
  operation: contract.operation,
  negativeEvidenceIds: ["stale-action-negative"]
}), /exact capability game release/u);
assert.throws(() => buildQualificationPackage({
  capabilities: inventory,
  evidenceBundle: {
    ...candidateEvidence,
    binding_audit: {
      ...candidateEvidence.binding_audit,
      status: "binding_mismatch_code_required"
    }
  },
  surfaceKind: contract.surface_kind,
  operation: contract.operation,
  qualificationId: "invalid-candidate",
  authorityTier: "session_canary",
  issuedAt: now,
  expiresAt: new Date("2026-07-28T00:00:00Z")
}), /reviewed operation binding audit/u);
const assembled = buildQualificationPackage({
  capabilities: inventory,
  evidenceBundle,
  surfaceKind: contract.surface_kind,
  operation: contract.operation,
  qualificationId: "assembled",
  issuedAt: now,
  expiresAt: new Date("2026-08-25T00:00:00Z")
});
assert.equal(assembled.operation_fingerprint, contract.contract_digest);
assert.equal(assembled.witness_id, contract.witness_id);
assert.equal(compareQualificationInventories(inventory, inventory).summary.unchanged, 1);
assert.equal(compareQualificationInventories(inventory, inventory).summary.code_required, 1);
assert.deepEqual(
  compareQualificationInventories(inventory, inventory)
    .unmodeled_advertised_operations,
  [{ surface_kind: "shop_room", operation: "purchase_shop_card" }]
);
assert.throws(() => buildQualificationPackage({
  capabilities: {
    ...inventory,
    game: {
      ...inventory.game,
      modset: { fingerprint: "different-modset" }
    }
  },
  evidenceBundle,
  surfaceKind: contract.surface_kind,
  operation: contract.operation,
  qualificationId: "wrong-environment",
  issuedAt: now,
  expiresAt: new Date("2026-08-25T00:00:00Z")
}), /does not match the exact capability environment/u);
const sourceChanged = structuredClone(inventory);
sourceChanged.qualification_system.operation_contracts[0].source_digest = "9".repeat(64);
assert.equal(
  compareQualificationInventories(inventory, sourceChanged)
    .summary.targeted_requalification,
  1
);
const completionChanged = structuredClone(inventory);
completionChanged.qualification_system.operation_contracts[0].witness_id = "other";
assert.equal(
  compareQualificationInventories(inventory, completionChanged).summary.code_required,
  2
);
const nextGameBuild = structuredClone(inventory);
nextGameBuild.game.version = "v0.110.0";
assert.equal(
  compareQualificationInventories(inventory, nextGameBuild)
    .summary.targeted_requalification,
  1
);
const nextModset = structuredClone(inventory);
nextModset.game.modset.fingerprint = "modset-with-data-mod";
assert.equal(
  compareQualificationInventories(inventory, nextModset)
    .summary.targeted_requalification,
  1
);

const temporary = mkdtempSync(join(tmpdir(), "spireagent-qualification-"));
try {
  const storePath = join(temporary, "ledger.json");
  const packagePath = join(temporary, "package.json");
  writeFileSync(storePath, JSON.stringify({
    schema_version: 1,
    store_id: "cli-fixture-store",
    events: []
  }));
  writeFileSync(packagePath, JSON.stringify(qualification));
  const runCli = (...args) => spawnSync(
    process.execPath,
    [new URL("./connector-qualification-ledger.mjs", import.meta.url).pathname, ...args],
    { encoding: "utf8" }
  );
  assert.equal(
    runCli("install", "--store", storePath, "--package", packagePath).status,
    0
  );
  const inspected = runCli("inspect", "--store", storePath);
  assert.equal(inspected.status, 0);
  assert.equal(
    JSON.parse(inspected.stdout).store_digest,
    createHash("sha256").update(readFileSync(storePath, "utf8")).digest("hex")
  );
  assert.equal(
    runCli(
      "revoke",
      "--store",
      storePath,
      "--id",
      qualification.qualification_id,
      "--reason",
      "cli_fixture"
    ).status,
    0
  );
  assert.equal(
    runCli(
      "rollback",
      "--store",
      storePath,
      "--id",
      qualification.qualification_id,
      "--reason",
      "cli_fixture"
    ).status,
    0
  );
  const projected = projectLedger(JSON.parse(readFileSync(storePath, "utf8")), now);
  assert.deepEqual(projected.errors, []);
  assert.deepEqual(projected.active, [qualification.qualification_id]);
  assert.equal(JSON.parse(readFileSync(storePath, "utf8")).events.length, 3);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

console.log("connector qualification ledger fixtures passed");
