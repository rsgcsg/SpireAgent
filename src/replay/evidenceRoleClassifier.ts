import type { JsonRecord } from "../domain/types.js";
import { isRecord } from "../agent/utils.js";

export type SourceResolvedEvidenceRole =
  | "workspace_shadow_provider"
  | "llm_selected_execution"
  | "llm_selection_not_eligible"
  | "selection_provenance_mismatch_excluded"
  | "legacy_selection_provenance_not_recorded"
  | "local_fallback_observation"
  | "local_scaffold_observation"
  | "local_safety_guard_observation"
  | "local_mechanical_observation"
  | "unknown_observation";

export interface SourceResolvedEvidence {
  role: SourceResolvedEvidenceRole;
  source: "workspace_shadow" | "selection" | "local_selection" | "legacy" | "unknown";
  eligibleForProposalSeed: boolean;
  reasons: string[];
}

export interface TransitionEvidenceEligibility {
  schemaVersion: 1;
  surface: "p9_g2_evidence_eligibility";
  exactOrganicEnvironment: boolean;
  sourceResolved: boolean;
  proposalSeedEligible: boolean;
  sameSliceProviderEligible: boolean;
  promotionUseAllowed: false;
  reasons: string[];
}

export interface TransitionEvidenceRoleClassification {
  schemaVersion: 1;
  surface: "p9_g2_evidence_role_classifier";
  transitionId: string;
  selectionResolutionStatus: "recorded" | "legacy_mismatch_excluded" | "not_recorded";
  sources: SourceResolvedEvidence[];
  eligibility: TransitionEvidenceEligibility;
  notes: string[];
}

/**
 * Produces source-resolved evidence rather than assigning one exclusive role
 * by precedence. It is deliberately fail-closed for future proposal evidence:
 * legacy LLM labels cannot prove proposal/final selection identity.
 */
export function classifyTransitionEvidenceRole(transition: JsonRecord): TransitionEvidenceRoleClassification {
  const sources = sourceEvidence(transition);
  const exactOrganicEnvironment = hasExactOrganicEnvironment(transition);
  const selectionResolutionStatus = selectionResolutionStatusOf(transition);
  const sourceResolved = selectionResolutionStatus === "recorded" ||
    sources.some((source) => source.role === "workspace_shadow_provider");
  const reasons: string[] = [];

  if (!exactOrganicEnvironment) reasons.push(...environmentIneligibilityReasons(transition));
  if (selectionResolutionStatus === "legacy_mismatch_excluded") {
    reasons.push("historical_proposal_final_mismatch_excluded");
  }
  if (selectionResolutionStatus === "not_recorded" && hasLegacyLlmSelectionClaim(transition)) {
    reasons.push("legacy_llm_selection_resolution_not_recorded");
  }

  const eligibleSources = sources.filter((source) => source.eligibleForProposalSeed);
  if (eligibleSources.length === 0) reasons.push("no_clean_source_resolved_evidence");
  const workspaceSource = sources.find((source) => source.role === "workspace_shadow_provider");
  const proposalSeedEligible = exactOrganicEnvironment && eligibleSources.length > 0 &&
    selectionResolutionStatus !== "legacy_mismatch_excluded";
  const sameSliceProviderEligible = exactOrganicEnvironment &&
    workspaceSource?.eligibleForProposalSeed === true &&
    selectionResolutionStatus !== "legacy_mismatch_excluded";
  if (!proposalSeedEligible && reasons.length === 0) reasons.push("evidence_not_eligible_for_proposal_seed");
  if (!sameSliceProviderEligible && workspaceSource === undefined) reasons.push("workspace_shadow_provider_evidence_missing");

  return {
    schemaVersion: 1,
    surface: "p9_g2_evidence_role_classifier",
    transitionId: stringValue(transition.transitionId, "not_recorded") ?? "not_recorded",
    selectionResolutionStatus,
    sources,
    eligibility: {
      schemaVersion: 1,
      surface: "p9_g2_evidence_eligibility",
      exactOrganicEnvironment,
      sourceResolved,
      proposalSeedEligible,
      sameSliceProviderEligible,
      promotionUseAllowed: false,
      reasons: unique(reasons)
    },
    notes: [
      "Source roles are additive; a workspace-provider observation and an executed selection can coexist.",
      "Eligibility is read-only and cannot authorize stable promotion or proposal application.",
      selectionResolutionStatus === "legacy_mismatch_excluded"
        ? "Historical proposal/final selection mismatch is retained for replay but excluded from LLM-selection evidence."
        : "Fresh SelectionResolutionRecord telemetry is required for an LLM-selection evidence claim."
    ]
  };
}

export function getTransitionProposalEvidenceEligibility(transition: JsonRecord): {
  eligible: boolean;
  reason: string;
  classification: TransitionEvidenceRoleClassification;
} {
  const classification = classifyTransitionEvidenceRole(transition);
  return {
    eligible: classification.eligibility.proposalSeedEligible,
    reason: classification.eligibility.proposalSeedEligible
      ? "exact_organic_source_resolved_evidence"
      : classification.eligibility.reasons[0] ?? "evidence_not_eligible_for_proposal_seed",
    classification
  };
}

export function evidenceRoleNames(classification: TransitionEvidenceRoleClassification): string[] {
  return classification.sources.map((source) => source.role);
}

function sourceEvidence(transition: JsonRecord): SourceResolvedEvidence[] {
  const sources: SourceResolvedEvidence[] = [];
  const shadow = isRecord(transition.shadowWorkspaceDecision) ? transition.shadowWorkspaceDecision : undefined;
  if (shadow?.called === true) {
    const clean = shadow.outcome === "valid" &&
      (shadow.failureBucket === undefined || shadow.failureBucket === "none") &&
      shadow.outputCapHit !== true;
    sources.push({
      role: "workspace_shadow_provider",
      source: "workspace_shadow",
      eligibleForProposalSeed: clean,
      reasons: clean ? ["called_workspace_shadow_provider_clean"] : workspaceProviderReasons(shadow)
    });
  }

  const resolution = selectionResolutionOf(transition);
  if (resolution) {
    const proposed = isRecord(resolution.proposedSelection) ? resolution.proposedSelection : {};
    const final = isRecord(resolution.finalSelection) ? resolution.finalSelection : {};
    if (proposed.source === "llm") {
      if (resolution.llmSelectionEvidenceEligible === true) {
        sources.push({
          role: "llm_selected_execution",
          source: "selection",
          eligibleForProposalSeed: true,
          reasons: ["selection_resolution_llm_proposal_matches_allowed_final_selection"]
        });
      } else if (resolution.candidateIdMatch === false) {
        sources.push({
          role: "selection_provenance_mismatch_excluded",
          source: "selection",
          eligibleForProposalSeed: false,
          reasons: ["llm_proposal_and_final_selection_differ"]
        });
      } else {
        sources.push({
          role: "llm_selection_not_eligible",
          source: "selection",
          eligibleForProposalSeed: false,
          reasons: ["selection_resolution_did_not_qualify_llm_selection_evidence"]
        });
      }
    }
    const finalRole = localObservationRole(final.source);
    if (finalRole) {
      sources.push({
        role: finalRole,
        source: "local_selection",
        eligibleForProposalSeed: false,
        reasons: ["final_selection_is_local_observation"]
      });
    }
    return sources;
  }

  if (hasHistoricalProposalFinalMismatch(transition)) {
    sources.push({
      role: "selection_provenance_mismatch_excluded",
      source: "legacy",
      eligibleForProposalSeed: false,
      reasons: ["historical_llm_proposal_and_final_selection_differ"]
    });
  } else {
    const authority = decisionAuthorityOf(transition);
    if (authority?.selectionSource === "llm") {
      sources.push({
        role: "legacy_selection_provenance_not_recorded",
        source: "legacy",
        eligibleForProposalSeed: false,
        reasons: ["legacy_llm_selection_lacks_selection_resolution_record"]
      });
    }
    const finalRole = localObservationRole(authority?.selectionSource);
    if (finalRole) {
      sources.push({
        role: finalRole,
        source: "local_selection",
        eligibleForProposalSeed: false,
        reasons: ["local_selection_observation"]
      });
    }
  }

  if (sources.length === 0) {
    sources.push({
      role: "unknown_observation",
      source: "unknown",
      eligibleForProposalSeed: false,
      reasons: ["selection_and_workspace_provenance_not_recorded"]
    });
  }
  return sources;
}

function selectionResolutionStatusOf(transition: JsonRecord): TransitionEvidenceRoleClassification["selectionResolutionStatus"] {
  if (selectionResolutionOf(transition)) return "recorded";
  return hasHistoricalProposalFinalMismatch(transition) ? "legacy_mismatch_excluded" : "not_recorded";
}

function selectionResolutionOf(transition: JsonRecord): JsonRecord | undefined {
  const value = transition.selectionResolution;
  if (!isRecord(value) || !isRecord(value.proposedSelection) || !isRecord(value.finalSelection)) return undefined;
  if (typeof value.llmSelectionEvidenceEligible !== "boolean" || typeof value.candidateIdMatch !== "boolean") return undefined;
  return value;
}

function hasHistoricalProposalFinalMismatch(transition: JsonRecord): boolean {
  const proposedCandidateId = llmCandidateId(transition);
  const finalCandidateId = finalCandidateIdOf(transition);
  return Boolean(proposedCandidateId && finalCandidateId && proposedCandidateId !== finalCandidateId);
}

function hasLegacyLlmSelectionClaim(transition: JsonRecord): boolean {
  return decisionAuthorityOf(transition)?.selectionSource === "llm";
}

function llmCandidateId(transition: JsonRecord): string | undefined {
  const decision = isRecord(transition.llmDecision) ? transition.llmDecision : undefined;
  return stringValue(decision?.candidateId, undefined);
}

function finalCandidateIdOf(transition: JsonRecord): string | undefined {
  const audit = isRecord(transition.decisionAudit) ? transition.decisionAudit : undefined;
  const raw = isRecord(audit?.raw) ? audit.raw : undefined;
  return stringValue(raw?.chosenCandidateId, undefined);
}

function decisionAuthorityOf(transition: JsonRecord): JsonRecord | undefined {
  return isRecord(transition.decisionAuthority) ? transition.decisionAuthority : undefined;
}

function localObservationRole(value: unknown): SourceResolvedEvidenceRole | undefined {
  if (value === "local_fallback") return "local_fallback_observation";
  if (value === "local_scaffold") return "local_scaffold_observation";
  if (value === "local_safety_guard") return "local_safety_guard_observation";
  if (value === "local_mechanical") return "local_mechanical_observation";
  return undefined;
}

function workspaceProviderReasons(shadow: JsonRecord): string[] {
  const reasons: string[] = [];
  if (shadow.outcome !== "valid") reasons.push("workspace_shadow_outcome_not_valid");
  if (shadow.failureBucket !== undefined && shadow.failureBucket !== "none") reasons.push("workspace_shadow_provider_failure");
  if (shadow.outputCapHit === true) reasons.push("workspace_shadow_output_cap_hit");
  return reasons.length > 0 ? reasons : ["workspace_shadow_provider_state_not_eligible"];
}

function hasExactOrganicEnvironment(transition: JsonRecord): boolean {
  if (hasConsoleDebugMarker(transition)) return false;
  const fingerprint = isRecord(transition.environmentFingerprint) ? transition.environmentFingerprint : {};
  const scope = isRecord(transition.evidenceEnvironmentScope) ? transition.evidenceEnvironmentScope : {};
  return transition.source === "agent" &&
    transition.captureMode === "executor_logged" &&
    fingerprint.identityStatus === "complete" &&
    scope.scopeStatus === "exact" &&
    scope.captureProvenance === "organic";
}

function environmentIneligibilityReasons(transition: JsonRecord): string[] {
  if (hasConsoleDebugMarker(transition)) return ["console_debug_or_fixture"];
  const fingerprint = isRecord(transition.environmentFingerprint) ? transition.environmentFingerprint : {};
  const scope = isRecord(transition.evidenceEnvironmentScope) ? transition.evidenceEnvironmentScope : {};
  const reasons: string[] = [];
  if (transition.source !== "agent" || transition.captureMode !== "executor_logged") {
    reasons.push("not_executor_logged_agent_evidence");
  }
  if (fingerprint.identityStatus !== "complete") reasons.push("environment_fingerprint_incomplete");
  if (scope.scopeStatus !== "exact") reasons.push("environment_scope_not_exact");
  if (scope.captureProvenance !== "organic") reasons.push("environment_capture_not_organic");
  return reasons.length > 0 ? reasons : ["environment_identity_not_exact_organic"];
}

function hasConsoleDebugMarker(transition: JsonRecord): boolean {
  const audit = isRecord(transition.decisionAudit) ? transition.decisionAudit : {};
  const candidates = [
    transition.source,
    transition.captureMode,
    transition.provenance,
    transition.evidenceKind,
    transition.fixture,
    transition.debug,
    audit.provenance
  ];
  return candidates.some((value) => typeof value === "string" && /console|debug|fixture/i.test(value)) ||
    candidates.some((value) => value === true);
}

function stringValue(value: unknown, fallback: string | undefined): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
