import assert from "node:assert/strict";
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
  gateway_protocol: "2.0-preview.65",
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
            bridge_protocol_version: "2.0-preview.65",
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
            bridge_protocol_version: "2.0-preview.65",
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
  protocol_version: "2.0-preview.65",
  bridge: { assembly_file_sha256: "a".repeat(64), module_version_id: "mvid" },
  game: {
    version: "v0.109.0",
    commit: "commit",
    main_assembly_hash: 1,
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
  assert.equal(runCli("inspect", "--store", storePath).status, 0);
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
