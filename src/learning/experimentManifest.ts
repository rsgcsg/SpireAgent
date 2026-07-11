import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { JsonRecord } from "../domain/types.js";
import { appendJsonl, isRecord, nowIso, stableId } from "../agent/utils.js";
import type { LearningProposalShadowWorkspaceComparison } from "./shadowApplicator.js";
import type { LearningProposalShadowEvaluation, ShadowWorkspaceOutcomeEvidence } from "./shadowEvaluation.js";

export const LEARNING_EXPERIMENT_MANIFESTS_FILE = "learning-experiment-manifests.jsonl";

export interface LearningExperimentManifest {
  schemaVersion: number;
  surface: "p9_g2_experiment_manifest";
  id: string;
  kind: "same_slice_shadow_pair";
  runId: string;
  proposalId: string;
  transitionId: string;
  decisionClass: string;
  authority: JsonRecord;
  environmentFingerprint: JsonRecord;
  environmentScope: JsonRecord;
  evidenceRoles: {
    baseline: string;
    overlay: string;
    observedSelection: string;
  };
  integrity: {
    authorityRecorded: boolean;
    environmentRecorded: boolean;
    exactOrganicEnvironment: boolean;
    candidateFactsPreserved: boolean;
    allowedCandidatesPreserved: boolean;
    providerProfileMatches: boolean;
    sameEvidenceSlice: boolean;
    baselineWorkspaceProviderEvidence: boolean;
    overlayWorkspaceProviderEvidence: boolean;
  };
  baseline: ShadowWorkspaceOutcomeEvidence;
  overlay?: ShadowWorkspaceOutcomeEvidence;
  evaluation: LearningProposalShadowEvaluation;
  createdAt: string;
  proposalMutationEnabled: false;
  applyPathEnabled: false;
  stablePromotionEnabled: false;
  notes: string[];
}

export interface LearningExperimentManifestSurface {
  schemaVersion: number;
  surface: "p9_g2_experiment_manifests";
  manifests: number;
  pairedReadyForReview: number;
  incomplete: number;
  regressions: number;
  exactOrganicEnvironment: number;
  authorityRecorded: number;
  sameEvidenceSlice: number;
  baselineWorkspaceProviderEvidence: number;
  stablePromotionEnabled: false;
  examples: JsonRecord[];
}

export interface LearningExperimentPreflight {
  proposalId: string;
  transitionId: string;
  eligibleForSameSliceProviderCall: boolean;
  blockers: string[];
  authorityMode: string;
  baselineEvidenceRole: string;
  environmentScopeStatus: string;
  captureProvenance: string;
  notes: string[];
  wouldCallProvider: false;
  stablePromotionEnabled: false;
}

export function assessLearningExperimentPreflight(input: {
  proposal: JsonRecord;
  transition: JsonRecord;
}): LearningExperimentPreflight {
  const authority = isRecord(input.transition.decisionAuthority) ? input.transition.decisionAuthority : {};
  const fingerprint = isRecord(input.transition.environmentFingerprint) ? input.transition.environmentFingerprint : {};
  const scope = isRecord(input.transition.evidenceEnvironmentScope) ? input.transition.evidenceEnvironmentScope : {};
  const blockers: string[] = [];
  if (authority.authorityMode !== "llm_primary" && authority.authorityMode !== "llm_full_control") {
    blockers.push("authority_mode_not_explicit_llm_product_mode");
  }
  if (fingerprint.identityStatus !== "complete") blockers.push("environment_fingerprint_not_complete");
  if (scope.scopeStatus !== "exact") blockers.push("environment_scope_not_exact");
  if (scope.captureProvenance !== "organic") blockers.push("environment_capture_not_organic");
  if (input.transition.source !== "agent" || input.transition.captureMode !== "executor_logged") {
    blockers.push("baseline_not_executor_logged_agent_evidence");
  }
  if (!hasCalledWorkspaceShadow(input.transition)) {
    blockers.push("baseline_workspace_shadow_not_called");
  }
  if (input.proposal.behaviorImpact !== "presentation_only") blockers.push("proposal_not_presentation_only");
  return {
    proposalId: typeof input.proposal.id === "string" ? input.proposal.id : "unknown",
    transitionId: typeof input.transition.transitionId === "string" ? input.transition.transitionId : "unknown",
    eligibleForSameSliceProviderCall: blockers.length === 0,
    blockers,
    authorityMode: typeof authority.authorityMode === "string" ? authority.authorityMode : "not_recorded",
    baselineEvidenceRole: evidenceRoleOf(input.transition),
    environmentScopeStatus: typeof scope.scopeStatus === "string" ? scope.scopeStatus : "not_recorded",
    captureProvenance: typeof scope.captureProvenance === "string" ? scope.captureProvenance : "not_recorded",
    notes: ["Preflight is read-only and does not prove the provider or overlay outcome."],
    wouldCallProvider: false,
    stablePromotionEnabled: false
  };
}

export function buildLearningExperimentManifest(input: {
  runId: string;
  proposal: JsonRecord;
  transition: JsonRecord;
  comparison: LearningProposalShadowWorkspaceComparison;
  baseline: ShadowWorkspaceOutcomeEvidence;
  overlay?: ShadowWorkspaceOutcomeEvidence;
  evaluation: LearningProposalShadowEvaluation;
}): LearningExperimentManifest {
  const authority = isRecord(input.transition.decisionAuthority) ? input.transition.decisionAuthority : {};
  const environmentFingerprint = isRecord(input.transition.environmentFingerprint) ? input.transition.environmentFingerprint : {};
  const environmentScope = isRecord(input.transition.evidenceEnvironmentScope) ? input.transition.evidenceEnvironmentScope : {};
  const exactOrganicEnvironment = environmentFingerprint.identityStatus === "complete" &&
    environmentScope.scopeStatus === "exact" &&
    environmentScope.captureProvenance === "organic";
  const baselineEvidenceRole = evidenceRoleOf(input.transition);
  const overlayEvidenceRole = input.overlay ? "workspace_shadow_provider" : "not_recorded";
  return {
    schemaVersion: 1,
    surface: "p9_g2_experiment_manifest",
    id: stableId("learning-experiment"),
    kind: "same_slice_shadow_pair",
    runId: input.runId,
    proposalId: typeof input.proposal.id === "string" ? input.proposal.id : input.comparison.proposalId,
    transitionId: input.baseline.transitionId,
    decisionClass: input.comparison.decisionClass ?? "unknown",
    authority,
    environmentFingerprint,
    environmentScope,
    evidenceRoles: {
      baseline: baselineEvidenceRole,
      overlay: overlayEvidenceRole,
      observedSelection: typeof authority.selectionSource === "string" ? authority.selectionSource : "not_recorded"
    },
    integrity: {
      authorityRecorded: Object.keys(authority).length > 0,
      environmentRecorded: Object.keys(environmentFingerprint).length > 0 && Object.keys(environmentScope).length > 0,
      exactOrganicEnvironment,
      candidateFactsPreserved: input.evaluation.candidateFactsPreserved,
      allowedCandidatesPreserved: input.evaluation.allowedCandidatesPreserved,
      providerProfileMatches: input.evaluation.providerProfileMatches,
      sameEvidenceSlice: input.evaluation.sameEvidenceSlice,
      baselineWorkspaceProviderEvidence: baselineEvidenceRole === "workspace_shadow_provider",
      overlayWorkspaceProviderEvidence: overlayEvidenceRole === "workspace_shadow_provider"
    },
    baseline: input.baseline,
    overlay: input.overlay,
    evaluation: input.evaluation,
    createdAt: nowIso(),
    proposalMutationEnabled: false,
    applyPathEnabled: false,
    stablePromotionEnabled: false,
    notes: [
      "Append-only P9-G2 experiment record; it is not a promotion ledger.",
      exactOrganicEnvironment
        ? "Environment identity is exact and organic for review, but pre-P12 compatibility remains unknown."
        : "Environment identity is incomplete, non-organic, or unknown; this manifest cannot support future promotion evidence.",
      `Baseline evidence role=${baselineEvidenceRole}; overlay evidence role=${overlayEvidenceRole}.`,
      "A paired result never mutates proposal status or enables stable promotion."
    ]
  };
}

export function appendLearningExperimentManifest(runDir: string, manifest: LearningExperimentManifest): LearningExperimentManifest {
  appendJsonl(path.join(runDir, LEARNING_EXPERIMENT_MANIFESTS_FILE), manifest);
  return manifest;
}

export function readLearningExperimentManifests(runDir: string): JsonRecord[] {
  const filePath = path.join(runDir, LEARNING_EXPERIMENT_MANIFESTS_FILE);
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const value = JSON.parse(line);
        return isRecord(value) ? [value] : [];
      } catch {
        return [];
      }
    });
}

export function buildLearningExperimentManifestSurface(values: unknown[]): LearningExperimentManifestSurface {
  const manifests = values.filter(isRecord);
  const surface: LearningExperimentManifestSurface = {
    schemaVersion: 1,
    surface: "p9_g2_experiment_manifests",
    manifests: manifests.length,
    pairedReadyForReview: 0,
    incomplete: 0,
    regressions: 0,
    exactOrganicEnvironment: 0,
    authorityRecorded: 0,
    sameEvidenceSlice: 0,
    baselineWorkspaceProviderEvidence: 0,
    stablePromotionEnabled: false,
    examples: []
  };
  for (const manifest of manifests) {
    const evaluation = isRecord(manifest.evaluation) ? manifest.evaluation : {};
    const integrity = isRecord(manifest.integrity) ? manifest.integrity : {};
    if (evaluation.status === "paired_evidence_ready_for_review") surface.pairedReadyForReview += 1;
    if (evaluation.status === "incomplete") surface.incomplete += 1;
    if (evaluation.status === "regression_detected") surface.regressions += 1;
    if (integrity.exactOrganicEnvironment === true) surface.exactOrganicEnvironment += 1;
    if (integrity.authorityRecorded === true) surface.authorityRecorded += 1;
    if (integrity.sameEvidenceSlice === true) surface.sameEvidenceSlice += 1;
    if (integrity.baselineWorkspaceProviderEvidence === true) surface.baselineWorkspaceProviderEvidence += 1;
    if (surface.examples.length < 5) {
      surface.examples.push({
        id: manifest.id,
        proposalId: manifest.proposalId,
        transitionId: manifest.transitionId,
        decisionClass: manifest.decisionClass,
        status: evaluation.status ?? "unknown",
        exactOrganicEnvironment: integrity.exactOrganicEnvironment === true,
        sameEvidenceSlice: integrity.sameEvidenceSlice === true,
        baselineEvidenceRole: isRecord(manifest.evidenceRoles) ? manifest.evidenceRoles.baseline : "not_recorded"
      });
    }
  }
  return surface;
}

export function formatLearningExperimentManifestSurface(surface: LearningExperimentManifestSurface): string {
  return [
    `manifests=${surface.manifests}`,
    `pairedReadyForReview=${surface.pairedReadyForReview}`,
    `incomplete=${surface.incomplete}`,
    `regressions=${surface.regressions}`,
    `exactOrganicEnvironment=${surface.exactOrganicEnvironment}`,
    `authorityRecorded=${surface.authorityRecorded}`,
    `sameEvidenceSlice=${surface.sameEvidenceSlice}`,
    `baselineWorkspaceProviderEvidence=${surface.baselineWorkspaceProviderEvidence}`,
    `stablePromotionEnabled=${surface.stablePromotionEnabled}`
  ].join(" ");
}

function hasCalledWorkspaceShadow(transition: JsonRecord): boolean {
  return isRecord(transition.shadowWorkspaceDecision) && transition.shadowWorkspaceDecision.called === true;
}

function evidenceRoleOf(transition: JsonRecord): string {
  if (hasCalledWorkspaceShadow(transition)) return "workspace_shadow_provider";
  const authority = isRecord(transition.decisionAuthority) ? transition.decisionAuthority : {};
  if (authority.selectionSource === "llm") return "llm_selected_execution";
  if (authority.selectionSource === "local_fallback") return "local_fallback_observation";
  if (authority.selectionSource === "local_scaffold") return "local_scaffold_observation";
  if (authority.selectionSource === "local_mechanical") return "local_mechanical_observation";
  return "unknown_observation";
}
