export function gradeCompatibilityReport(report, scenario) {
  const failures = [];
  const fail = (code, detail) => failures.push({ code, detail });
  const assertions = scenario.assertions;

  if (scenario.authorization_effect !== "none"
      || scenario.qualification_effect !== "none") {
    fail("scenario_effect", "Scenario must be non-authorizing and non-qualifying.");
  }
  if (report.authorization_effect !== "none"
      || report.qualification_effect !== "none") {
    fail("report_effect", "Audit report attempted to authorize or qualify.");
  }
  if (report.schema_version !== assertions.report_schema_version) {
    fail(
      "report_schema",
      `Expected report schema ${assertions.report_schema_version}, got ${report.schema_version}.`
    );
  }
  if (report.registry?.id !== scenario.applicability.registry_id) {
    fail("registry_identity", "Report registry does not match scenario applicability.");
  }
  if (report.catalog?.id !== scenario.applicability.catalog_id) {
    fail("catalog_identity", "Report catalog does not match scenario applicability.");
  }
  if (normalizeVersion(report.release?.version) !==
      normalizeVersion(scenario.applicability.game_version)
      || report.release?.commit?.toLowerCase() !==
      scenario.applicability.game_commit.toLowerCase()) {
    fail("game_identity", "Report game version/commit does not match scenario.");
  }
  if (report.game_assembly?.sha256 !==
      scenario.applicability.game_assembly_sha256
      || report.game_assembly?.module_version_id !==
      scenario.applicability.game_assembly_mvid) {
    fail("game_assembly_identity", "Report game assembly SHA/MVID does not match scenario.");
  }

  const registered = report.registered_sources ?? [];
  if (registered.length !== assertions.registered_source_count) {
    fail(
      "registered_count",
      `Expected ${assertions.registered_source_count} registered sources, got ${registered.length}.`
    );
  }
  for (const source of registered) {
    if (source.candidate_classification !==
        assertions.required_registered_classification) {
      fail(
        "registered_classification",
        `${source.source_type} is ${source.candidate_classification}.`
      );
    }
    if (source.permission_recommendation !==
        assertions.required_registered_permission_recommendation) {
      fail(
        "registered_permission",
        `${source.source_type} recommends ${source.permission_recommendation}.`
      );
    }
    if (!source.declared_semantic_fingerprint
        || !source.static_structure_fingerprint
        || !source.implementation_fingerprint
        || !source.operation_fingerprint) {
      fail("registered_fingerprint", `${source.source_type} lacks layered fingerprints.`);
    }
  }

  const unregistered = report.unregistered_callers ?? [];
  const holdoutsByType = new Map(
    assertions.known_holdouts.map((holdout) => [holdout.source_type, holdout])
  );
  if (!assertions.allow_additional_unregistered_callers) {
    for (const caller of unregistered) {
      if (!holdoutsByType.has(caller.source_type)) {
        fail("unexpected_caller", `Unregistered caller ${caller.source_type} needs review.`);
      }
    }
  }
  for (const holdout of assertions.known_holdouts) {
    const caller = unregistered.find((candidate) =>
      candidate.source_type === holdout.source_type
    );
    if (!caller) {
      fail("missing_holdout", `Expected holdout ${holdout.source_type} was not reported.`);
      continue;
    }
    if (caller.candidate_classification !== holdout.candidate_classification) {
      fail(
        "holdout_classification",
        `${holdout.source_type} was ${caller.candidate_classification}.`
      );
    }
    if (!caller.owner_binding_signals?.includes(
      holdout.required_owner_binding_signal
    )) {
      fail(
        "holdout_owner_signal",
        `${holdout.source_type} lacks ${holdout.required_owner_binding_signal}.`
      );
    }
    if (caller.recommended_ceiling !== holdout.recommended_ceiling) {
      fail(
        "holdout_ceiling",
        `${holdout.source_type} ceiling was ${caller.recommended_ceiling}.`
      );
    }
  }
  for (const caller of unregistered) {
    if (!assertions.allowed_unregistered_classifications.includes(
      caller.candidate_classification
    )) {
      fail(
        "unregistered_classification",
        `${caller.source_type} has unknown classification ${caller.candidate_classification}.`
      );
    }
    if (caller.recommended_ceiling !== "diagnostic_only") {
      fail(
        "unregistered_ceiling",
        `${caller.source_type} exceeded diagnostic_only.`
      );
    }
  }
  for (const limitation of assertions.required_limitations) {
    if (!report.limitations?.includes(limitation)) {
      fail("missing_limitation", `Report omits ${limitation}.`);
    }
  }

  return {
    schema_version: 1,
    scenario_id: scenario.scenario_id,
    report_status: report.status,
    status: failures.length === 0 ? "pass" : "fail",
    authorization_effect: "none",
    qualification_effect: "none",
    promotion_effect: "none",
    registered_source_count: registered.length,
    unregistered_caller_count: unregistered.length,
    failures
  };
}

function normalizeVersion(value) {
  return String(value ?? "").trim().replace(/^[vV]/u, "");
}
