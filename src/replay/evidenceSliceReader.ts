import type { JsonRecord } from "../domain/types.js";
import { isRecord } from "../agent/utils.js";

export type EvidenceSliceKind =
  | "shadow_readiness"
  | "live_applied_rollout"
  | "stable_learning_promotion";

export interface EvidenceSliceSummary {
  schemaVersion: number;
  policyName: "pre_p9_evidence_slice_reader_v1";
  transitions: number;
  dimensions: {
    sourceCounts: Record<string, number>;
    captureModeCounts: Record<string, number>;
    decisionClassCounts: Record<string, number>;
    revisionTagCounts: Record<string, number>;
    budgetWindowCounts: Record<string, number>;
    providerSourceCounts: Record<string, number>;
    liveModeCounts: Record<string, number>;
    provenanceCounts: Record<string, number>;
  };
  mixedRevisionWindow: boolean;
  mixedBudgetWindow: boolean;
  consoleDebugOrFixtureTransitions: number;
  unknownProvenanceTransitions: number;
  promotionEvidence: EvidencePromotionEligibilitySummary;
  slices: EvidenceSlice[];
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

export function buildEvidenceSliceSummary(transitions: JsonRecord[]): EvidenceSliceSummary {
  const dimensions = {
    sourceCounts: countBy(transitions, transitionSource),
    captureModeCounts: countBy(transitions, transitionCaptureMode),
    decisionClassCounts: countBy(transitions, transitionDecisionClass),
    revisionTagCounts: countBy(transitions, transitionRevisionTag),
    budgetWindowCounts: countBy(transitions, transitionBudgetWindow),
    providerSourceCounts: countBy(transitions, transitionProviderSource),
    liveModeCounts: countBy(transitions, transitionLiveMode),
    provenanceCounts: countBy(transitions, transitionProvenance)
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
    policyName: "pre_p9_evidence_slice_reader_v1",
    transitions: transitions.length,
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

export function formatEvidenceSliceSummary(summary: EvidenceSliceSummary): string {
  const promotion = summary.slices.find((slice) => slice.kind === "stable_learning_promotion");
  return [
    `policy=${summary.policyName}`,
    `transitions=${summary.transitions}`,
    `source=${JSON.stringify(summary.dimensions.sourceCounts)}`,
    `capture=${JSON.stringify(summary.dimensions.captureModeCounts)}`,
    `classes=${JSON.stringify(summary.dimensions.decisionClassCounts)}`,
    `revision=${JSON.stringify(summary.dimensions.revisionTagCounts)}`,
    `budget=${JSON.stringify(summary.dimensions.budgetWindowCounts)}`,
    `provider=${JSON.stringify(summary.dimensions.providerSourceCounts)}`,
    `liveMode=${JSON.stringify(summary.dimensions.liveModeCounts)}`,
    `provenance=${JSON.stringify(summary.dimensions.provenanceCounts)}`,
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
  if (provenance === "organic_agent_runtime") return { eligible: true, reason: provenance };
  return { eligible: false, reason: provenance };
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
  if (llm && typeof llm.providerSource === "string") return llm.providerSource;
  if (isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.providerSource === "string") {
    return transition.shadowWorkspaceDecision.providerSource;
  }
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
  if (transition.source === "agent" && transition.captureMode === "executor_logged") return "organic_agent_runtime";
  if (transition.source === "human_watch" || transition.source === "human") return "human_observed";
  if (transition.source === "collector" || transition.captureMode === "snapshot_only") return "snapshot_only";
  return "unknown";
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
