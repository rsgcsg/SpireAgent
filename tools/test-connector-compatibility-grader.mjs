import assert from "node:assert/strict";
import { gradeCompatibilityReport } from "./lib/connector-compatibility-grader.mjs";

const scenario = {
  schema_version: 1,
  scenario_id: "grader_contract_fixture",
  authorization_effect: "none",
  qualification_effect: "none",
  applicability: {
    registry_id: "registry-v1",
    catalog_id: "catalog-v1",
    game_version: "0.109.0",
    game_commit: "c12f634d",
    game_assembly_sha256: "assembly-sha",
    game_assembly_mvid: "assembly-mvid"
  },
  assertions: {
    report_schema_version: 2,
    registered_source_count: 1,
    required_registered_classification: "registered_static_match",
    required_registered_permission_recommendation: "no_change_existing_reviewed_policy",
    allowed_unregistered_classifications: ["code_required_new_owner_binding"],
    allow_additional_unregistered_callers: false,
    known_holdouts: [{
      source_type: "Example.TargetBound",
      candidate_classification: "code_required_new_owner_binding",
      required_owner_binding_signal: "references_cardplay_target",
      recommended_ceiling: "diagnostic_only"
    }],
    required_limitations: [
      "static_il_call_discovery_is_non_authorizing",
      "operation_fingerprints_are_structural_evidence_not_semantic_equivalence_proofs",
      "candidate_classification_never_writes_registry_or_policy",
      "runtime_harmony_patch_closure_is_not_proven",
      "semantic_completion_is_not_proven"
    ]
  }
};
const baseReport = {
  schema_version: 2,
  status: "review_required_unregistered_callers",
  authorization_effect: "none",
  qualification_effect: "none",
  release: { version: "v0.109.0", commit: "c12f634d" },
  game_assembly: {
    sha256: "assembly-sha",
    module_version_id: "assembly-mvid"
  },
  registry: { id: "registry-v1" },
  catalog: { id: "catalog-v1" },
  registered_sources: [{
    source_type: "Example.Registered",
    candidate_classification: "registered_static_match",
    permission_recommendation: "no_change_existing_reviewed_policy",
    declared_semantic_fingerprint: "a",
    static_structure_fingerprint: "b",
    implementation_fingerprint: "c",
    operation_fingerprint: "d"
  }],
  unregistered_callers: [{
    source_type: "Example.TargetBound",
    candidate_classification: "code_required_new_owner_binding",
    owner_binding_signals: ["references_cardplay_target"],
    recommended_ceiling: "diagnostic_only"
  }],
  limitations: [...scenario.assertions.required_limitations]
};

assert.equal(gradeCompatibilityReport(baseReport, scenario).status, "pass");
assertFails(
  { ...baseReport, authorization_effect: "session_canary" },
  "report_effect"
);
assertFails(
  {
    ...baseReport,
    unregistered_callers: [{
      ...baseReport.unregistered_callers[0],
      owner_binding_signals: ["no_known_owner_reference"]
    }]
  },
  "holdout_owner_signal"
);
assertFails(
  {
    ...baseReport,
    unregistered_callers: [
      ...baseReport.unregistered_callers,
      {
        ...baseReport.unregistered_callers[0],
        source_type: "Example.Unreviewed"
      }
    ]
  },
  "unexpected_caller"
);
assertFails(
  {
    ...baseReport,
    unregistered_callers: [{
      ...baseReport.unregistered_callers[0],
      recommended_ceiling: "session_canary"
    }]
  },
  "holdout_ceiling"
);
assertFails(
  {
    ...baseReport,
    game_assembly: {
      ...baseReport.game_assembly,
      sha256: "different-assembly"
    }
  },
  "game_assembly_identity"
);

console.log(JSON.stringify({
  status: "pass",
  fixture_cases: 6,
  authorization_effect: "none",
  qualification_effect: "none"
}));

function assertFails(report, code) {
  const grade = gradeCompatibilityReport(report, scenario);
  assert.equal(grade.status, "fail");
  assert(grade.failures.some((failure) => failure.code === code));
}
