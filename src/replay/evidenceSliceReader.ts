import type { JsonRecord } from "../domain/types.js";
import { isRecord } from "../agent/utils.js";

export type EvidenceSliceKind =
  | "shadow_readiness"
  | "live_applied_rollout"
  | "stable_learning_promotion";

export interface EvidenceSliceSummary {
  schemaVersion: number;
  policyName: "p9_g2_evidence_slice_reader_v3";
  transitions: number;
  selection: EvidenceSliceSelection;
  dimensions: {
    sourceCounts: Record<string, number>;
    captureModeCounts: Record<string, number>;
    decisionClassCounts: Record<string, number>;
    revisionTagCounts: Record<string, number>;
    budgetWindowCounts: Record<string, number>;
    providerSourceCounts: Record<string, number>;
    liveModeCounts: Record<string, number>;
    provenanceCounts: Record<string, number>;
    authorityModeCounts: Record<string, number>;
    selectionSourceCounts: Record<string, number>;
    authorizationSourceCounts: Record<string, number>;
    executionSourceCounts: Record<string, number>;
    environmentFingerprintCounts: Record<string, number>;
    environmentScopeStatusCounts: Record<string, number>;
    environmentCompatibilityStateCounts: Record<string, number>;
  };
  mixedRevisionWindow: boolean;
  mixedBudgetWindow: boolean;
  consoleDebugOrFixtureTransitions: number;
  unknownProvenanceTransitions: number;
  promotionEvidence: EvidencePromotionEligibilitySummary;
  slices: EvidenceSlice[];
}

export interface EvidenceSliceFilter {
  decisionClass?: string;
  revisionTag?: string;
  budgetWindow?: string;
  environmentFingerprintHash?: string;
  authorityMode?: string;
  captureProvenance?: string;
  shadowCalled?: boolean;
}

export interface EvidenceSliceSelection {
  totalTransitions: number;
  matchedTransitions: number;
  appliedFilters: EvidenceSliceFilter;
  transitionIds: string[];
}

export interface EvidencePromotionEligibilitySummary {
  eligibleTransitions: number;
  excludedTransitions: number;
  exclusionReasonCounts: Record<string, number>;
}

export interface EvidenceSlice {
  kind: EvidenceSliceKind;
  purpose: string;
  transitions: number;
  promotionUseAllowed: boolean;
  status: "usable_for_layer" | "not_promotion_eligible";
  reasons: string[];
}

export function buildEvidenceSliceSummary(
  transitions: JsonRecord[],
  filter: EvidenceSliceFilter = {}
): EvidenceSliceSummary {
  const selectedTransitions = filterEvidenceSliceTransitions(transitions, filter);
  const selection = buildEvidenceSliceSelection(transitions, selectedTransitions, filter);
  return buildSelectedEvidenceSliceSummary(selectedTransitions, selection);
}

export function filterEvidenceSliceTransitions(
  transitions: JsonRecord[],
  filter: EvidenceSliceFilter = {}
): JsonRecord[] {
  return transitions.filter((transition) => {
    if (filter.decisionClass && transitionDecisionClass(transition) !== filter.decisionClass) return false;
    if (filter.revisionTag && transitionRevisionTag(transition) !== filter.revisionTag) return false;
    if (filter.budgetWindow && transitionBudgetWindow(transition) !== filter.budgetWindow) return false;
    if (filter.environmentFingerprintHash && transitionEnvironmentFingerprintHash(transition) !== filter.environmentFingerprintHash) return false;
    if (filter.authorityMode && transitionAuthorityMode(transition) !== filter.authorityMode) return false;
    if (filter.captureProvenance && transitionCaptureProvenance(transition) !== filter.captureProvenance) return false;
    if (filter.shadowCalled !== undefined && shadowWorkspaceCalled(transition) !== filter.shadowCalled) return false;
    return true;
  });
}

function buildSelectedEvidenceSliceSummary(
  transitions: JsonRecord[],
  selection: EvidenceSliceSelection
): EvidenceSliceSummary {
  const dimensions = {
    sourceCounts: countBy(transitions, transitionSource),
    captureModeCounts: countBy(transitions, transitionCaptureMode),
    decisionClassCounts: countBy(transitions, transitionDecisionClass),
    revisionTagCounts: countBy(transitions, transitionRevisionTag),
    budgetWindowCounts: countBy(transitions, transitionBudgetWindow),
    providerSourceCounts: countBy(transitions, transitionProviderSource),
    liveModeCounts: countBy(transitions, transitionLiveMode),
    provenanceCounts: countBy(transitions, transitionProvenance),
    authorityModeCounts: countBy(transitions, transitionAuthorityMode),
    selectionSourceCounts: countBy(transitions, transitionSelectionSource),
    authorizationSourceCounts: countBy(transitions, transitionAuthorizationSource),
    executionSourceCounts: countBy(transitions, transitionExecutionSource),
    environmentFingerprintCounts: countBy(transitions, transitionEnvironmentFingerprintHash),
    environmentScopeStatusCounts: countBy(transitions, transitionEnvironmentScopeStatus),
    environmentCompatibilityStateCounts: countBy(transitions, transitionEnvironmentCompatibilityState)
  };
  const mixedRevisionWindow = Object.keys(removeUnknown(dimensions.revisionTagCounts)).length > 1;
  const mixedBudgetWindow = Object.keys(removeUnknown(dimensions.budgetWindowCounts)).length > 1;
  const consoleDebugOrFixtureTransitions = dimensions.provenanceCounts.console_debug_or_fixture ?? 0;
  const unknownProvenanceTransitions = dimensions.provenanceCounts.unknown ?? 0;
  const promotionEvidence = buildPromotionEvidenceSummary(transitions);
  const promotionReasons = promotionIneligibilityReasons({
    transitions: transitions.length,
    mixedRevisionWindow,
    mixedBudgetWindow,
    consoleDebugOrFixtureTransitions,
    unknownProvenanceTransitions,
    promotionEvidence
  });

  return {
    schemaVersion: 1,
    policyName: "p9_g2_evidence_slice_reader_v3",
    transitions: transitions.length,
    selection,
    dimensions,
    mixedRevisionWindow,
    mixedBudgetWindow,
    consoleDebugOrFixtureTransitions,
    unknownProvenanceTransitions,
    promotionEvidence,
    slices: [
      {
        kind: "shadow_readiness",
        purpose: "workspace/provider exploration and readiness smoke alarm; not stable-learning proof",
        transitions: countMatching(transitions, hasShadowWorkspaceDecision),
        promotionUseAllowed: false,
        status: "usable_for_layer",
        reasons: ["shadow_readiness_is_not_stable_promotion_evidence"]
      },
      {
        kind: "live_applied_rollout",
        purpose: "audit of decisions actually executed through explicit-whitelist additive live",
        transitions: countMatching(transitions, isLiveAppliedTransition),
        promotionUseAllowed: false,
        status: "usable_for_layer",
        reasons: ["clean_live_rollout_is_not_learning_proof"]
      },
      {
        kind: "stable_learning_promotion",
        purpose: "future P9 promotion evidence; read-only and disabled before proposal gates exist",
        transitions: promotionEvidence.eligibleTransitions,
        promotionUseAllowed: false,
        status: "not_promotion_eligible",
        reasons: promotionReasons
      }
    ]
  };
}

function buildEvidenceSliceSelection(
  allTransitions: JsonRecord[],
  selectedTransitions: JsonRecord[],
  filter: EvidenceSliceFilter
): EvidenceSliceSelection {
  return {
    totalTransitions: allTransitions.length,
    matchedTransitions: selectedTransitions.length,
    appliedFilters: Object.fromEntries(
      Object.entries(filter).filter(([, value]) => value !== undefined && value !== "")
    ) as EvidenceSliceFilter,
    transitionIds: selectedTransitions
      .map((transition) => typeof transition.transitionId === "string" ? transition.transitionId : undefined)
      .filter((id): id is string => Boolean(id))
      .slice(0, 25)
  };
}

export function formatEvidenceSliceSummary(summary: EvidenceSliceSummary): string {
  const promotion = summary.slices.find((slice) => slice.kind === "stable_learning_promotion");
  return [
    `policy=${summary.policyName}`,
    `transitions=${summary.transitions}`,
    `selection=${JSON.stringify(summary.selection.appliedFilters)}`,
    `selectionTotal=${summary.selection.totalTransitions}`,
    `selectionMatched=${summary.selection.matchedTransitions}`,
    `selectionIds=${JSON.stringify(summary.selection.transitionIds)}`,
    `source=${JSON.stringify(summary.dimensions.sourceCounts)}`,
    `capture=${JSON.stringify(summary.dimensions.captureModeCounts)}`,
    `classes=${JSON.stringify(summary.dimensions.decisionClassCounts)}`,
    `revision=${JSON.stringify(summary.dimensions.revisionTagCounts)}`,
    `budget=${JSON.stringify(summary.dimensions.budgetWindowCounts)}`,
    `provider=${JSON.stringify(summary.dimensions.providerSourceCounts)}`,
    `liveMode=${JSON.stringify(summary.dimensions.liveModeCounts)}`,
    `provenance=${JSON.stringify(summary.dimensions.provenanceCounts)}`,
    `authorityMode=${JSON.stringify(summary.dimensions.authorityModeCounts)}`,
    `selection=${JSON.stringify(summary.dimensions.selectionSourceCounts)}`,
    `authorization=${JSON.stringify(summary.dimensions.authorizationSourceCounts)}`,
    `execution=${JSON.stringify(summary.dimensions.executionSourceCounts)}`,
    `environmentFingerprint=${JSON.stringify(summary.dimensions.environmentFingerprintCounts)}`,
    `environmentScope=${JSON.stringify(summary.dimensions.environmentScopeStatusCounts)}`,
    `environmentCompatibility=${JSON.stringify(summary.dimensions.environmentCompatibilityStateCounts)}`,
    `promotionEligible=${summary.promotionEvidence.eligibleTransitions}`,
    `promotionExcluded=${summary.promotionEvidence.excludedTransitions}`,
    `promotionExclusionReasons=${JSON.stringify(summary.promotionEvidence.exclusionReasonCounts)}`,
    `mixedRevision=${summary.mixedRevisionWindow}`,
    `mixedBudget=${summary.mixedBudgetWindow}`,
    `promotionAllowed=${promotion?.promotionUseAllowed === true}`,
    `promotionReasons=${JSON.stringify(promotion?.reasons ?? [])}`
  ].join(" ");
}

function promotionIneligibilityReasons(input: {
  transitions: number;
  mixedRevisionWindow: boolean;
  mixedBudgetWindow: boolean;
  consoleDebugOrFixtureTransitions: number;
  unknownProvenanceTransitions: number;
  promotionEvidence: EvidencePromotionEligibilitySummary;
}): string[] {
  const reasons = ["p9_promotion_not_implemented"];
  if (input.transitions === 0) reasons.push("no_transitions");
  if (input.mixedRevisionWindow) reasons.push("mixed_revision_window");
  if (input.mixedBudgetWindow) reasons.push("mixed_budget_window");
  if (input.consoleDebugOrFixtureTransitions > 0) reasons.push("console_debug_or_fixture_present");
  if (input.unknownProvenanceTransitions > 0) reasons.push("unknown_provenance_without_first_class_marker");
  if (input.promotionEvidence.excludedTransitions > 0) reasons.push("promotion_evidence_exclusions_present");
  if (input.transitions > 0 && input.promotionEvidence.eligibleTransitions === 0) {
    reasons.push("no_organic_agent_runtime_promotion_evidence");
  }
  return reasons;
}

function buildPromotionEvidenceSummary(transitions: JsonRecord[]): EvidencePromotionEligibilitySummary {
  return transitions.reduce<EvidencePromotionEligibilitySummary>((summary, transition) => {
    const eligibility = transitionPromotionEligibility(transition);
    if (eligibility.eligible) {
      summary.eligibleTransitions += 1;
    } else {
      summary.excludedTransitions += 1;
      summary.exclusionReasonCounts[eligibility.reason] = (summary.exclusionReasonCounts[eligibility.reason] ?? 0) + 1;
    }
    return summary;
  }, {
    eligibleTransitions: 0,
    excludedTransitions: 0,
    exclusionReasonCounts: {}
  });
}

function transitionPromotionEligibility(transition: JsonRecord): { eligible: boolean; reason: string } {
  const provenance = transitionProvenance(transition);
  if (provenance === "console_debug_or_fixture") return { eligible: false, reason: provenance };
  const scope = transitionEnvironmentScope(transition);
  const fingerprint = transitionEnvironmentFingerprintRecord(transition);
  if (!scope) return { eligible: false, reason: "missing_environment_scope" };
  if (!fingerprint || fingerprint.identityStatus !== "complete") {
    return { eligible: false, reason: "environment_fingerprint_incomplete" };
  }
  if (scope.scopeStatus !== "exact") {
    return { eligible: false, reason: "environment_scope_" + String(scope.scopeStatus ?? "unknown") };
  }
  if (scope.captureProvenance !== "organic") {
    return { eligible: false, reason: "capture_provenance_" + String(scope.captureProvenance ?? "unknown") };
  }
  if (provenance === "organic_agent_runtime") return { eligible: true, reason: provenance };
  return { eligible: false, reason: provenance };
}

export function getTransitionPromotionEligibility(transition: JsonRecord): { eligible: boolean; reason: string } {
  return transitionPromotionEligibility(transition);
}

export function classifyTransitionEvidenceProvenance(transition: JsonRecord): string {
  return transitionProvenance(transition);
}

function transitionSource(transition: JsonRecord): string {
  return typeof transition.source === "string" ? transition.source : "unknown";
}

function transitionCaptureMode(transition: JsonRecord): string {
  return typeof transition.captureMode === "string" ? transition.captureMode : "unknown";
}

function transitionDecisionClass(transition: JsonRecord): string {
  if (isRecord(transition.workspaceComparison) && typeof transition.workspaceComparison.decisionClass === "string") {
    return transition.workspaceComparison.decisionClass;
  }
  if (isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.decisionClass === "string") {
    return transition.shadowWorkspaceDecision.decisionClass;
  }
  const llm = transitionLlmAudit(transition);
  if (llm && typeof llm.liveAdditiveDecisionClass === "string") return llm.liveAdditiveDecisionClass;
  return "unknown";
}

function transitionRevisionTag(transition: JsonRecord): string {
  if (isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.revisionTag === "string") {
    return transition.shadowWorkspaceDecision.revisionTag;
  }
  if (isRecord(transition.workspaceComparison) && typeof transition.workspaceComparison.revisionTag === "string") {
    return transition.workspaceComparison.revisionTag;
  }
  return "unknown";
}

function transitionBudgetWindow(transition: JsonRecord): string {
  const comparison = isRecord(transition.workspaceComparison) ? transition.workspaceComparison : undefined;
  const budget = isRecord(comparison?.budget) ? comparison.budget : undefined;
  const maxShadowCalls = typeof budget?.maxShadowCalls === "number" ? budget.maxShadowCalls : undefined;
  const governanceProfile = typeof budget?.governanceProfile === "string"
    ? budget.governanceProfile
    : isRecord(budget?.governancePolicy) && typeof budget.governancePolicy.profile === "string"
      ? budget.governancePolicy.profile
      : undefined;
  if (maxShadowCalls === undefined && governanceProfile === undefined) return "unknown";
  return `shadow=${maxShadowCalls ?? "unknown"};profile=${governanceProfile ?? "unknown"}`;
}

function transitionProviderSource(transition: JsonRecord): string {
  const llm = transitionLlmAudit(transition);
  if (llm?.liveAdditiveApplied === true && typeof llm.providerSource === "string") return llm.providerSource;
  if (isRecord(transition.shadowWorkspaceDecision) && transition.shadowWorkspaceDecision.called === true) {
    if (typeof transition.shadowWorkspaceDecision.providerSource === "string") {
      return transition.shadowWorkspaceDecision.providerSource;
    }
    if (typeof transition.shadowWorkspaceDecision.provider === "string") {
      return transition.shadowWorkspaceDecision.provider;
    }
  }
  if (llm && typeof llm.providerSource === "string") return llm.providerSource;
  return "none";
}

function transitionLiveMode(transition: JsonRecord): string {
  const llm = transitionLlmAudit(transition);
  if (llm?.liveAdditiveApplied === true) return "live_additive_applied";
  if (llm?.liveAdditiveEnabled === true) return "live_additive_enabled_not_applied";
  if (isRecord(transition.shadowWorkspaceDecision) && transition.shadowWorkspaceDecision.called === true) return "shadow_called";
  if (isRecord(transition.shadowWorkspaceDecision)) return "shadow_not_called";
  return "legacy_or_local_only";
}

function transitionProvenance(transition: JsonRecord): string {
  if (hasConsoleDebugMarker(transition)) return "console_debug_or_fixture";
  const scope = transitionEnvironmentScope(transition);
  if (scope?.captureProvenance === "console_debug" || scope?.captureProvenance === "fixture") {
    return "console_debug_or_fixture";
  }
  if (scope?.captureProvenance === "organic") return "organic_agent_runtime";
  if (scope?.captureProvenance === "unknown") return "unknown";
  if (transition.source === "agent" && transition.captureMode === "executor_logged") return "organic_agent_runtime";
  if (transition.source === "human_watch" || transition.source === "human") return "human_observed";
  if (transition.source === "collector" || transition.captureMode === "snapshot_only") return "snapshot_only";
  return "unknown";
}

function transitionAuthorityMode(transition: JsonRecord): string {
  const authority = transitionDecisionAuthority(transition);
  return typeof authority?.authorityMode === "string" ? authority.authorityMode : "not_recorded";
}

function transitionSelectionSource(transition: JsonRecord): string {
  const authority = transitionDecisionAuthority(transition);
  return typeof authority?.selectionSource === "string" ? authority.selectionSource : "not_recorded";
}

function transitionAuthorizationSource(transition: JsonRecord): string {
  const authority = transitionDecisionAuthority(transition);
  return typeof authority?.authorizationSource === "string" ? authority.authorizationSource : "not_recorded";
}

function transitionExecutionSource(transition: JsonRecord): string {
  const authority = transitionDecisionAuthority(transition);
  return typeof authority?.executionSource === "string" ? authority.executionSource : "not_recorded";
}

function transitionEnvironmentFingerprintRecord(transition: JsonRecord): JsonRecord | undefined {
  return isRecord(transition.environmentFingerprint) ? transition.environmentFingerprint : undefined;
}

function transitionEnvironmentScope(transition: JsonRecord): JsonRecord | undefined {
  return isRecord(transition.evidenceEnvironmentScope) ? transition.evidenceEnvironmentScope : undefined;
}

function transitionEnvironmentFingerprintHash(transition: JsonRecord): string {
  const fingerprint = transitionEnvironmentFingerprintRecord(transition);
  return typeof fingerprint?.fingerprintHash === "string" ? fingerprint.fingerprintHash : "not_recorded";
}

function transitionEnvironmentScopeStatus(transition: JsonRecord): string {
  const scope = transitionEnvironmentScope(transition);
  return typeof scope?.scopeStatus === "string" ? scope.scopeStatus : "not_recorded";
}

function transitionCaptureProvenance(transition: JsonRecord): string {
  const scope = transitionEnvironmentScope(transition);
  return typeof scope?.captureProvenance === "string" ? scope.captureProvenance : "not_recorded";
}

function transitionEnvironmentCompatibilityState(transition: JsonRecord): string {
  const scope = transitionEnvironmentScope(transition);
  return typeof scope?.compatibilityState === "string" ? scope.compatibilityState : "not_recorded";
}

function transitionDecisionAuthority(transition: JsonRecord): JsonRecord | undefined {
  return isRecord(transition.decisionAuthority) ? transition.decisionAuthority : undefined;
}

function hasConsoleDebugMarker(transition: JsonRecord): boolean {
  const candidates = [
    transition.source,
    transition.captureMode,
    transition.provenance,
    transition.evidenceKind,
    transition.fixture,
    transition.debug,
    isRecord(transition.decisionAudit) ? transition.decisionAudit.provenance : undefined
  ];
  return candidates.some((value) => typeof value === "string" && /console|debug|fixture/i.test(value)) ||
    candidates.some((value) => value === true);
}

function hasShadowWorkspaceDecision(transition: JsonRecord): boolean {
  return isRecord(transition.shadowWorkspaceDecision);
}

function shadowWorkspaceCalled(transition: JsonRecord): boolean {
  return isRecord(transition.shadowWorkspaceDecision) && transition.shadowWorkspaceDecision.called === true;
}

function isLiveAppliedTransition(transition: JsonRecord): boolean {
  const llm = transitionLlmAudit(transition);
  return llm?.liveAdditiveApplied === true;
}

function transitionLlmAudit(transition: JsonRecord): JsonRecord | undefined {
  const audit = isRecord(transition.decisionAudit) ? transition.decisionAudit : undefined;
  const raw = isRecord(audit?.raw) ? audit.raw : undefined;
  return isRecord(raw?.llm) ? raw.llm : undefined;
}

function countBy(transitions: JsonRecord[], selector: (transition: JsonRecord) => string): Record<string, number> {
  return transitions.reduce<Record<string, number>>((counts, transition) => {
    const key = selector(transition);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function countMatching(transitions: JsonRecord[], predicate: (transition: JsonRecord) => boolean): number {
  return transitions.filter(predicate).length;
}

function removeUnknown(counts: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(counts).filter(([key]) => key !== "unknown"));
}
