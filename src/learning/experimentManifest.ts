import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { JsonRecord, ProviderExperimentFingerprint } from "../domain/types.js";
import { appendJsonl, isRecord, nowIso, stableId } from "../agent/utils.js";
import { classifyTransitionEvidenceRole, evidenceRoleNames } from "../replay/evidenceRoleClassifier.js";
import { assessShadowWorkspaceOverlayEligibility } from "./shadowOverlayPolicy.js";
import {
  buildProviderExperimentFingerprintFromTransition,
  compareProviderExperimentFingerprints,
  type ProviderExperimentIdentityComparison
} from "./providerExperimentFingerprint.js";
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
  providerExperiment: {
    baseline: ProviderExperimentFingerprint;
    overlay?: ProviderExperimentFingerprint;
    identityComparison: ProviderExperimentIdentityComparison;
    exactIdentityApplicable: boolean;
    applicabilityReasons: string[];
  };
  evidenceRoles: {
    baseline: string[];
    overlay: string[];
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
    baselineSameSliceProviderEligible: boolean;
    providerExperimentIdentityExact: boolean;
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
  providerExperimentIdentityExact: number;
  legacyStoreRecords: number;
  manifestStoreStatus: "clean" | "degraded" | "missing" | "not_recorded";
  stablePromotionEnabled: false;
  examples: JsonRecord[];
}

export interface LearningExperimentManifestStoreDigest {
  schemaVersion: number;
  surface: "p9_g2_experiment_manifest_store_digest";
  filePresent: boolean;
  contentHash?: string;
  totalNonEmptyLines: number;
  parsedRecords: number;
  malformedJsonLines: number;
  nonObjectLines: number;
  legacyRecords: number;
  currentRecords: number;
  status: "clean" | "degraded" | "missing";
  notes: string[];
}

export interface LearningExperimentManifestStore {
  manifests: JsonRecord[];
  digest: LearningExperimentManifestStoreDigest;
}

export interface LearningExperimentPreflight {
  proposalId: string;
  transitionId: string;
  eligibleForSameSliceProviderCall: boolean;
  blockers: string[];
  authorityMode: string;
  baselineEvidenceRoles: string[];
  baselineSameSliceProviderEligible: boolean;
  baselineProviderExperiment: ProviderExperimentFingerprint;
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
  const evidence = classifyTransitionEvidenceRole(input.transition);
  const providerExperiment = buildProviderExperimentFingerprintFromTransition(input.transition);
  const overlayEligibility = assessShadowWorkspaceOverlayEligibility(input.proposal, input.transition);
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
  if (!evidence.eligibility.sameSliceProviderEligible) {
    blockers.push(...evidence.eligibility.reasons.map((reason) => `baseline_evidence_ineligible:${reason}`));
  }
  if (providerExperiment.identityStatus !== "complete") {
    blockers.push("baseline_provider_experiment_fingerprint_incomplete");
  }
  blockers.push(...overlayEligibility.blockers);
  return {
    proposalId: typeof input.proposal.id === "string" ? input.proposal.id : "unknown",
    transitionId: typeof input.transition.transitionId === "string" ? input.transition.transitionId : "unknown",
    eligibleForSameSliceProviderCall: unique(blockers).length === 0,
    blockers: unique(blockers),
    authorityMode: typeof authority.authorityMode === "string" ? authority.authorityMode : "not_recorded",
    baselineEvidenceRoles: evidenceRoleNames(evidence),
    baselineSameSliceProviderEligible: evidence.eligibility.sameSliceProviderEligible,
    baselineProviderExperiment: providerExperiment,
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
  const baselineEvidence = classifyTransitionEvidenceRole(input.transition);
  const baselineEvidenceRoles = evidenceRoleNames(baselineEvidence);
  const overlayEvidenceRoles = input.overlay ? ["workspace_shadow_provider"] : ["not_recorded"];
  const baselineProviderExperiment = input.baseline.providerExperimentFingerprint ??
    buildProviderExperimentFingerprintFromTransition(input.transition);
  const overlayProviderExperiment = input.overlay?.providerExperimentFingerprint;
  const providerIdentity = compareProviderExperimentFingerprints(
    baselineProviderExperiment,
    overlayProviderExperiment
  );
  const applicabilityReasons = unique([
    ...(exactOrganicEnvironment ? [] : ["environment_identity_not_exact_organic"]),
    ...(baselineEvidence.eligibility.sameSliceProviderEligible ? [] : baselineEvidence.eligibility.reasons),
    ...providerIdentity.reasons
  ]);
  const exactIdentityApplicable = exactOrganicEnvironment &&
    baselineEvidence.eligibility.sameSliceProviderEligible &&
    providerIdentity.exact;
  return {
    schemaVersion: 2,
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
    providerExperiment: {
      baseline: baselineProviderExperiment,
      overlay: overlayProviderExperiment,
      identityComparison: providerIdentity,
      exactIdentityApplicable,
      applicabilityReasons
    },
    evidenceRoles: {
      baseline: baselineEvidenceRoles,
      overlay: overlayEvidenceRoles,
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
      baselineWorkspaceProviderEvidence: baselineEvidence.sources.some((source) => source.role === "workspace_shadow_provider"),
      overlayWorkspaceProviderEvidence: overlayEvidenceRoles.includes("workspace_shadow_provider"),
      baselineSameSliceProviderEligible: baselineEvidence.eligibility.sameSliceProviderEligible,
      providerExperimentIdentityExact: providerIdentity.exact
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
      `Baseline evidence roles=${baselineEvidenceRoles.join(",") || "none"}; overlay evidence roles=${overlayEvidenceRoles.join(",") || "none"}.`,
      providerIdentity.exact
        ? "Provider experiment identity exactly matches for this pair."
        : `Provider experiment identity is ${providerIdentity.status}: ${providerIdentity.reasons.join(",") || "not_recorded"}.`,
      "A paired result never mutates proposal status or enables stable promotion."
    ]
  };
}

export function appendLearningExperimentManifest(runDir: string, manifest: LearningExperimentManifest): LearningExperimentManifest {
  appendJsonl(path.join(runDir, LEARNING_EXPERIMENT_MANIFESTS_FILE), manifest);
  return manifest;
}

export function readLearningExperimentManifestStore(runDir: string): LearningExperimentManifestStore {
  const filePath = path.join(runDir, LEARNING_EXPERIMENT_MANIFESTS_FILE);
  if (!existsSync(filePath)) {
    return {
      manifests: [],
      digest: {
        schemaVersion: 1,
        surface: "p9_g2_experiment_manifest_store_digest",
        filePresent: false,
        totalNonEmptyLines: 0,
        parsedRecords: 0,
        malformedJsonLines: 0,
        nonObjectLines: 0,
        legacyRecords: 0,
        currentRecords: 0,
        status: "missing",
        notes: ["experiment_manifest_store_not_present"]
      }
    };
  }
  const content = readFileSync(filePath, "utf8");
  const manifests: JsonRecord[] = [];
  let malformedJsonLines = 0;
  let nonObjectLines = 0;
  let legacyRecords = 0;
  let currentRecords = 0;
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    try {
      const value = JSON.parse(line);
      if (!isRecord(value)) {
        nonObjectLines += 1;
        continue;
      }
      manifests.push(value);
      if (value.schemaVersion === 2) currentRecords += 1;
      else legacyRecords += 1;
    } catch {
      malformedJsonLines += 1;
    }
  }
  const degraded = malformedJsonLines > 0 || nonObjectLines > 0;
  return {
    manifests,
    digest: {
      schemaVersion: 1,
      surface: "p9_g2_experiment_manifest_store_digest",
      filePresent: true,
      contentHash: createHash("sha256").update(content).digest("hex").slice(0, 16),
      totalNonEmptyLines: lines.length,
      parsedRecords: manifests.length,
      malformedJsonLines,
      nonObjectLines,
      legacyRecords,
      currentRecords,
      status: degraded ? "degraded" : "clean",
      notes: [
        legacyRecords > 0 ? "legacy_manifest_records_lack_g2_3_identity_diagnostics" : "all_manifest_records_use_current_schema",
        degraded ? "malformed_or_non_object_manifest_lines_were_excluded_from_the_read_view" : "manifest_store_read_cleanly"
      ]
    }
  };
}

export function readLearningExperimentManifests(runDir: string): JsonRecord[] {
  return readLearningExperimentManifestStore(runDir).manifests;
}

export function buildLearningExperimentManifestSurface(
  values: unknown[],
  storeDigest?: LearningExperimentManifestStoreDigest
): LearningExperimentManifestSurface {
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
    providerExperimentIdentityExact: 0,
    legacyStoreRecords: storeDigest?.legacyRecords ?? 0,
    manifestStoreStatus: storeDigest?.status ?? "not_recorded",
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
    if (integrity.providerExperimentIdentityExact === true) surface.providerExperimentIdentityExact += 1;
    if (surface.examples.length < 5) {
      surface.examples.push({
        id: manifest.id,
        proposalId: manifest.proposalId,
        transitionId: manifest.transitionId,
        decisionClass: manifest.decisionClass,
        status: evaluation.status ?? "unknown",
        exactOrganicEnvironment: integrity.exactOrganicEnvironment === true,
        sameEvidenceSlice: integrity.sameEvidenceSlice === true,
        baselineEvidenceRoles: isRecord(manifest.evidenceRoles) ? manifest.evidenceRoles.baseline : ["not_recorded"]
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
    `providerExperimentIdentityExact=${surface.providerExperimentIdentityExact}`,
    `legacyStoreRecords=${surface.legacyStoreRecords}`,
    `manifestStoreStatus=${surface.manifestStoreStatus}`,
    `stablePromotionEnabled=${surface.stablePromotionEnabled}`
  ].join(" ");
}

function hasCalledWorkspaceShadow(transition: JsonRecord): boolean {
  return isRecord(transition.shadowWorkspaceDecision) && transition.shadowWorkspaceDecision.called === true;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
