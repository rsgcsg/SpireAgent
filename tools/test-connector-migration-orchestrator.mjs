import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createEmptyProfileRegistry
} from "./connector-environment-profiles.mjs";
import {
  executeMigrationCycle
} from "./connector-migration-orchestrator.mjs";
import {
  projectLedger
} from "./connector-qualification-ledger.mjs";

const contract = {
  surface_kind: "event_option",
  operation: "choose_event_option",
  interaction_digest: "1".repeat(64),
  owner_digest: "2".repeat(64),
  source_digest: "3".repeat(64),
  operand_digest: "4".repeat(64),
  commit_digest: "5".repeat(64),
  completion_digest: "6".repeat(64),
  witness_digest: "7".repeat(64),
  contract_digest: "8".repeat(64),
  completion_boundary: "gateway_semantic_completion_observed",
  witness_id: "gateway_reported_operation_witness",
  risk_class: "persistent_run_mutation"
};

function capabilities(qualifications = []) {
  return {
    protocol_version: "2.0-preview.67",
    bridge: {
      assembly_file_sha256: "a".repeat(64),
      module_version_id: "11111111-1111-1111-1111-111111111111"
    },
    game: {
      version: "v0.109.1",
      commit: "c8c577f6",
      main_assembly_hash: -820620422,
      release_declared_main_assembly_hash: -1041364841,
      modset: { fingerprint: "b".repeat(64) },
      compatibility: {
        compatibility_policy_digest: "c".repeat(64)
      }
    },
    permission_system: {
      mode: "migration_exploration",
      policy_digest: "d".repeat(64),
      patch_inventory: { digest: "e".repeat(64) }
    },
    qualification_system: {
      current_environment_digest: "f".repeat(64),
      operation_catalog_digest: "9".repeat(64),
      operation_contracts: [contract],
      qualifications
    }
  };
}

const bindingAudit = {
  authorization_effect: "none",
  qualification_effect: "none",
  manifest_id: "fixture-binding-manifest",
  manifest_digest: "0".repeat(64),
  release: {
    version: "v0.109.1",
    commit: "c8c577f6",
    main_assembly_hash: -1041364841
  },
  game_assembly: {
    sha256: "1".repeat(64),
    module_version_id: "22222222-2222-2222-2222-222222222222"
  },
  operations: []
};

const migrationPolicy = {
  schema_version: 2,
  policy_id: "fixture-migration-policy",
  authorization_effect: "none",
  rules: [
    {
      risk_class: "persistent_run_mutation",
      eligible_modes: ["migration_exploration"]
    }
  ]
};

function activeQualification(qualification, authorityTier) {
  return {
    qualification_id: qualification.qualification_id,
    version: qualification.version,
    authority_tier: authorityTier,
    surface_kind: qualification.surface_kind,
    operation: qualification.operation,
    status: "active",
    applicable_to_current_environment: true
  };
}

async function writeRun(
  root,
  runId,
  runtimeEpoch,
  requestId,
  environmentDigest = "f".repeat(64)
) {
  const runDirectory = path.join(root, runId);
  await mkdir(runDirectory, { recursive: true });
  await writeFile(
    path.join(runDirectory, "metadata.json"),
    JSON.stringify({
      runId,
      evidence: { provenance: "ordinary_gameplay" },
      adapter: {
        negotiated: {
          bridge_protocol_version: "2.0-preview.67",
          game_version: "v0.109.1",
          game_commit: "c8c577f6",
          main_assembly_hash: -820620422,
          bridge_assembly_file_sha256: "a".repeat(64),
          bridge_module_version_id:
            "11111111-1111-1111-1111-111111111111",
          bridge_runtime_instance_id: runtimeEpoch,
          modset_fingerprint: "b".repeat(64),
          runtime_patch_digest: "e".repeat(64),
          qualification_current_environment_digest: environmentDigest,
          qualification_operation_contracts: [
            {
              surface_kind: contract.surface_kind,
              operation: contract.operation,
              contract_digest: contract.contract_digest,
              completion_boundary: contract.completion_boundary,
              witness_id: contract.witness_id,
              risk_class: contract.risk_class
            }
          ]
        }
      }
    })
  );
  await writeFile(
    path.join(runDirectory, "decisions.jsonl"),
    `${JSON.stringify({
      decisionId: `${runId}-decision`,
      outcome: "executed_and_settled",
      preState: {
        normalizedState: {
          surface: { kind: contract.surface_kind }
        }
      },
      execution: {
        action: { bridgeActionKind: contract.operation },
        adapterResult: {
          request_id: requestId,
          status: "completed",
          outcome: "confirmed",
          events: [
            {
              status: "completed",
              evidence: "event_option_committed_and_owner_advanced"
            }
          ]
        }
      }
    })}\n`
  );
}

const temporary = await mkdtemp(
  path.join(os.tmpdir(), "spireagent-migration-orchestrator-")
);
const runRoot = path.join(temporary, "runs");
const workspace = path.join(temporary, "workspace");
const storePath = path.join(temporary, "qualifications.json");
await mkdir(runRoot, { recursive: true });

const initialCapabilities = capabilities();
const reloadCapabilities = async () => {
  const ledger = JSON.parse(await readFile(storePath, "utf8"));
  const projection = projectLedger(ledger);
  const activeId = projection.active[0];
  const qualification = projection.packages.find(
    (entry) => entry.qualification_id === activeId
  );
  return capabilities([
    activeQualification(qualification, qualification.authority_tier)
  ]);
};
const first = await executeMigrationCycle({
  capabilities: initialCapabilities,
  reloadCapabilities,
  bindingAudit,
  migrationPolicy,
  negativeEvidenceIds: ["fixture-negative-evidence"],
  profileRegistry: createEmptyProfileRegistry("fixture"),
  runRoot,
  workspace,
  storePath,
  apply: true
});
const candidateAction = first.result.actions.find(
  (entry) => entry.action === "candidate_installed"
);
assert.ok(candidateAction);
const firstLedger = JSON.parse(await readFile(storePath, "utf8"));
const candidatePackage = firstLedger.events[0].qualification;
const candidateCapabilities = capabilities([
  activeQualification(candidatePackage, "session_canary")
]);
assert.equal(projectLedger(firstLedger).active.length, 1);

await writeRun(runRoot, "run-fixture-a", "runtime-a", "request-a");
await writeRun(runRoot, "run-fixture-b", "runtime-b", "request-b");
await writeRun(
  runRoot,
  "run-historical-environment",
  "runtime-old",
  "request-old",
  "0".repeat(64)
);
const second = await executeMigrationCycle({
  capabilities: candidateCapabilities,
  reloadCapabilities,
  bindingAudit,
  migrationPolicy,
  negativeEvidenceIds: ["fixture-negative-evidence"],
  profileRegistry: first.registry,
  runRoot,
  workspace,
  storePath,
  apply: true
});
const qualificationAction = second.result.actions.find(
  (entry) => entry.action === "qualification_installed"
);
assert.ok(qualificationAction);
const finalLedger = JSON.parse(await readFile(storePath, "utf8"));
const qualifiedPackage = finalLedger.events.at(-1).qualification;
const projection = projectLedger(finalLedger);
assert.deepEqual(projection.errors, []);
assert.deepEqual(projection.active, [qualifiedPackage.qualification_id]);
assert.equal(qualifiedPackage.runtime_evidence.length, 2);
assert.equal(qualifiedPackage.supersedes_qualification_id, candidatePackage.qualification_id);
assert.equal(second.result.profile.status, "qualified_all_reviewed_operations");
assert.deepEqual(second.result.profile.operation_summary, {
  reviewed_contracts: 1,
  persistent_qualified: 1,
  installed_candidates: 0
});
assert.equal(
  second.registry.profiles.find(
    (entry) => entry.profile_id === second.result.profile.profile_id
  )?.status,
  "qualified_all_reviewed_operations"
);

console.log("connector migration orchestrator checks passed");
