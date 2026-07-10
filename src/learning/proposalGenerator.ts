import type { JsonRecord, LearningProposal, ReverseScaffoldFeedback } from "../domain/types.js";
import { isRecord } from "../agent/utils.js";
import { getTransitionPromotionEligibility } from "../replay/evidenceSliceReader.js";

export interface LearningProposalGenerationResult {
  schemaVersion: number;
  policyName: "p9_weak_attribution_proposal_generator_v1";
  runId: string;
  transitions: number;
  consideredTransitions: number;
  excludedTransitions: number;
  exclusionReasonCounts: Record<string, number>;
  proposals: Array<Partial<LearningProposal>>;
  reverseFeedback: Array<Partial<ReverseScaffoldFeedback>>;
  proposalCountsByType: Record<string, number>;
  feedbackCountsByLayer: Record<string, number>;
  pendingReview: number;
  draft: number;
  applyPathEnabled: false;
  stablePromotionEnabled: false;
}

export interface LearningProposalGenerationOptions {
  includeIneligibleEvidence?: boolean;
}

export function generateLearningProposalSeeds(
  runId: string,
  transitions: JsonRecord[],
  options: LearningProposalGenerationOptions = {}
): LearningProposalGenerationResult {
  const proposals: Array<Partial<LearningProposal>> = [];
  const reverseFeedback: Array<Partial<ReverseScaffoldFeedback>> = [];
  const seen = new Set<string>();
  let consideredTransitions = 0;
  let excludedTransitions = 0;
  const exclusionReasonCounts: Record<string, number> = {};
  for (const transition of transitions) {
    const eligibility = getTransitionPromotionEligibility(transition);
    if (!options.includeIneligibleEvidence && !eligibility.eligible) {
      excludedTransitions += 1;
      exclusionReasonCounts[eligibility.reason] = (exclusionReasonCounts[eligibility.reason] ?? 0) + 1;
      continue;
    }
    consideredTransitions += 1;
    for (const proposal of proposalsFromPredictionError(runId, transition)) {
      addProposal(proposals, proposal, seen);
    }
    for (const proposal of proposalsFromWorkspaceSignals(runId, transition)) {
      addProposal(proposals, proposal, seen);
    }
    for (const proposal of proposalsFromReasonQuality(runId, transition)) {
      addProposal(proposals, proposal, seen);
    }
    for (const proposal of proposalsFromBudgetSignals(runId, transition)) {
      addProposal(proposals, proposal, seen);
    }
  }
  for (const proposal of proposals) {
    const feedback = reverseFeedbackFromProposal(proposal);
    if (feedback) reverseFeedback.push(feedback);
  }
  return {
    schemaVersion: 1,
    policyName: "p9_weak_attribution_proposal_generator_v1",
    runId,
    transitions: transitions.length,
    consideredTransitions,
    excludedTransitions,
    exclusionReasonCounts,
    proposals,
    reverseFeedback,
    proposalCountsByType: countBy(proposals, "type"),
    feedbackCountsByLayer: countBy(reverseFeedback, "targetLayer"),
    pendingReview: proposals.filter((proposal) => proposal.status === "pending_review").length,
    draft: proposals.filter((proposal) => proposal.status !== "pending_review").length,
    applyPathEnabled: false,
    stablePromotionEnabled: false
  };
}

export function summarizeGeneratedLearningProposals(result: LearningProposalGenerationResult): JsonRecord {
  return {
    policyName: result.policyName,
    runId: result.runId,
    transitions: result.transitions,
    consideredTransitions: result.consideredTransitions,
    excludedTransitions: result.excludedTransitions,
    exclusionReasonCounts: result.exclusionReasonCounts,
    proposals: result.proposals.length,
    pendingReview: result.pendingReview,
    draft: result.draft,
    proposalCountsByType: result.proposalCountsByType,
    reverseFeedback: result.reverseFeedback.length,
    feedbackCountsByLayer: result.feedbackCountsByLayer,
    applyPathEnabled: false,
    stablePromotionEnabled: false
  };
}

function proposalsFromPredictionError(runId: string, transition: JsonRecord): Array<Partial<LearningProposal>> {
  const predictionError = isRecord(transition.predictionError) ? transition.predictionError : undefined;
  if (!predictionError) return [];
  const buckets = Array.isArray(predictionError.attributionBuckets)
    ? predictionError.attributionBuckets.filter(isRecord)
    : [];
  const actionableBuckets = buckets.filter((bucket) =>
    bucket.status === "unsupported" ||
    bucket.status === "unknown" ||
    bucket.severity === "critical" ||
    predictionError.severity === "critical"
  );
  if (actionableBuckets.length === 0 && predictionError.status !== "open") return [];
  const transitionId = transitionIdOf(transition);
  const decisionClass = decisionClassOf(transition);
  const bucketNames = unique(actionableBuckets.map((bucket) => stringValue(bucket.bucket, "unknown")));
  const severity = stringValue(predictionError.severity, "info");
  const attributedLayer = stringValue(predictionError.attributedLayer, "prediction_error");
  const hasUnsupported = actionableBuckets.some((bucket) => bucket.status === "unsupported" || bucket.severity === "critical");
  const target = targetForPredictionLayer(attributedLayer, bucketNames);
  const evidenceScope = evidenceScopeOf(transition);
  return [
    buildProposal({
      id: generatedId("prediction", runId, transitionId, target.targetLayer, bucketNames.join("-") || "open"),
      runId,
      transitionId,
      decisionClass,
      type: target.type,
      status: hasUnsupported ? "pending_review" : "draft",
      targetLayer: target.targetLayer,
      targetObject: `${target.targetLayer}:${bucketNames.join(",") || "open_prediction_error"}`,
      proposedPatch: {
        proposalOnly: true,
        generator: "p9_weak_attribution_proposal_generator_v1",
        source: "prediction_error",
        attributedLayer,
        buckets: bucketNames,
        suggestedChange: target.suggestedChange
      },
      evidenceSummary: `Prediction error needs weak-attribution review: layer=${attributedLayer} buckets=${bucketNames.join(",") || "open"} severity=${severity}.`,
      evidenceSource: "replay",
      evidenceStrength: hasUnsupported ? "moderate" : "weak",
      suspectedCause: `Possible ${target.targetLayer} gap from ${attributedLayer} prediction evidence.`,
      confidence: hasUnsupported ? 0.45 : 0.25,
      riskLevel: hasUnsupported ? "medium" : "low",
      expectedEffect: `Improve future ${decisionClass} scaffold checks without claiming exact causal attribution.`,
      counterexample: `Find a same-scope transition where ${bucketNames.join(",") || attributedLayer} attribution appears but the proposed ${target.targetLayer} repair would not help.`,
      validationPlan: [
        "compare generated proposal against same-revision evidence slice",
        "look for counterexamples before any shadow overlay",
        "keep stable promotion disabled"
      ],
      rollbackAction: "drop this proposal seed; do not apply any stable change",
      ...evidenceScope
    })
  ];
}

function proposalsFromWorkspaceSignals(runId: string, transition: JsonRecord): Array<Partial<LearningProposal>> {
  const coverage = workspaceCoverageOf(transition);
  if (!coverage) return [];
  const reviewSignals = signalNames(coverage.candidateFutureReviewSignals);
  const proposalSignals = signalNames(coverage.candidateFutureProposalSignals);
  const cueAttribution = isRecord(coverage.candidateFutureCueAttribution) ? coverage.candidateFutureCueAttribution : undefined;
  const missingOriginal = Array.isArray(cueAttribution?.missingInOriginal) ? cueAttribution.missingInOriginal.map(String) : [];
  const lostInSerialization = Array.isArray(cueAttribution?.lostInSerialization) ? cueAttribution.lostInSerialization.map(String) : [];
  const signals = unique([...reviewSignals, ...proposalSignals, ...missingOriginal.map((cue) => `missing_${cue}`), ...lostInSerialization.map((cue) => `compression_lost_${cue}`)]);
  const transitionId = transitionIdOf(transition);
  const decisionClass = decisionClassOf(transition);
  const evidenceScope = evidenceScopeOf(transition);
  return signals.map((signal) => {
    const target = targetForWorkspaceSignal(signal);
    return buildProposal({
      id: generatedId("workspace", runId, transitionId, signal),
      runId,
      transitionId,
      decisionClass,
      type: target.type,
      status: "draft",
      targetLayer: target.targetLayer,
      targetObject: signal,
      proposedPatch: {
        proposalOnly: true,
        generator: "p9_weak_attribution_proposal_generator_v1",
        source: "workspace_quality_signal",
        signal,
        suggestedChange: target.suggestedChange
      },
      evidenceSummary: `Workspace quality signal ${signal} was observed for ${decisionClass}.`,
      evidenceSource: "review",
      evidenceStrength: "weak",
      suspectedCause: `Possible ${target.targetLayer} gap; signal may also be detector noise or scene-specific.`,
      confidence: 0.3,
      riskLevel: "low",
      expectedEffect: `Clarify ${target.targetLayer} evidence for future ${decisionClass} decisions without hand-authoring a permanent class rule.`,
      counterexample: `Find a ${decisionClass} transition where ${signal} appears but the selected action/reason was strategically adequate.`,
      validationPlan: [
        "aggregate repeated same-class signals",
        "check cue attribution source before shadow overlay",
        "do not use this as validation blocker"
      ],
      rollbackAction: "discard proposal seed if repeated evidence does not survive review",
      ...evidenceScope
    });
  });
}

function proposalsFromReasonQuality(runId: string, transition: JsonRecord): Array<Partial<LearningProposal>> {
  const shadow = isRecord(transition.shadowWorkspaceDecision) ? transition.shadowWorkspaceDecision : undefined;
  const notes = Array.isArray(shadow?.reasonQualityNotes) ? shadow.reasonQualityNotes.map(String) : [];
  if (notes.length === 0) return [];
  const transitionId = transitionIdOf(transition);
  const decisionClass = decisionClassOf(transition);
  const evidenceScope = evidenceScopeOf(transition);
  return unique(notes).map((note) => buildProposal({
    id: generatedId("reason", runId, transitionId, note),
    runId,
    transitionId,
    decisionClass,
    type: "reason_policy",
    status: "draft",
    targetLayer: "reason_policy",
    targetObject: note,
    proposedPatch: {
      proposalOnly: true,
      generator: "p9_weak_attribution_proposal_generator_v1",
      source: "reason_quality_note",
      note,
      suggestedChange: "review whether reason policy should emphasize the omitted tactical tradeoff"
    },
    evidenceSummary: `Reason quality note ${note} was observed for ${decisionClass}.`,
    evidenceSource: "review",
    evidenceStrength: "weak",
    suspectedCause: "Model may have omitted available scaffold evidence, or the detector may be too strict.",
    confidence: 0.25,
    riskLevel: "low",
    expectedEffect: "Improve reason-policy review without optimizing only for pretty wording.",
    counterexample: `Find a ${decisionClass} reason with ${note} that still made a strategically adequate decision.`,
    validationPlan: [
      "compare reason cue attribution before changing policy",
      "validate against decision quality, not wording alone"
    ],
    rollbackAction: "drop reason-policy seed if it only rewards template wording",
    ...evidenceScope
  }));
}

function proposalsFromBudgetSignals(runId: string, transition: JsonRecord): Array<Partial<LearningProposal>> {
  const comparison = isRecord(transition.workspaceComparison) ? transition.workspaceComparison : undefined;
  const budget = isRecord(comparison?.budget) ? comparison.budget : undefined;
  if (budget?.status !== "call_budget_exceeded") return [];
  const transitionId = transitionIdOf(transition);
  const decisionClass = decisionClassOf(transition);
  const evidenceScope = evidenceScopeOf(transition);
  return [
    buildProposal({
      id: generatedId("budget", runId, transitionId, decisionClass),
      runId,
      transitionId,
      decisionClass,
      type: "budget_policy",
      status: "draft",
      targetLayer: "budget_policy",
      targetObject: `${decisionClass}:call_budget_exceeded`,
      proposedPatch: {
        proposalOnly: true,
        generator: "p9_weak_attribution_proposal_generator_v1",
        source: "budget_guard_signal",
        budgetStatus: "call_budget_exceeded",
        suggestedChange: "review whether this class needs better evidence budget accounting or a future BudgetPolicyProposal"
      },
      evidenceSummary: `Budget guard skipped a potential call for ${decisionClass}.`,
      evidenceSource: "eval",
      evidenceStrength: "weak",
      suspectedCause: "The call budget may be too small for evidence collection, or the run may simply have exhausted its planned sample.",
      confidence: 0.2,
      riskLevel: "medium",
      expectedEffect: "Create review evidence for future budget policy without automatic budget escalation.",
      counterexample: `Find same-scope runs where ${decisionClass} remains strategically adequate under the current budget.`,
      validationPlan: [
        "aggregate repeated cap exhaustion by same budget profile",
        "compare cost and quality before any budget change",
        "defer runtime Budget OS behavior to P13"
      ],
      rollbackAction: "keep current budget profile; ignore seed if cap exhaustion is expected sampling behavior",
      ...evidenceScope
    })
  ];
}

function reverseFeedbackFromProposal(proposal: Partial<LearningProposal>): Partial<ReverseScaffoldFeedback> | undefined {
  if (proposal.type !== "candidate_template" && proposal.type !== "scaffold_policy" && proposal.type !== "reason_policy") {
    return undefined;
  }
  const transitionId = Array.isArray(proposal.createdFromTransitionIds) ? proposal.createdFromTransitionIds[0] : undefined;
  const runId = Array.isArray(proposal.createdFromRunIds) ? proposal.createdFromRunIds[0] : undefined;
  return {
    id: generatedId("reverse-feedback", runId ?? "run", transitionId ?? "transition", String(proposal.targetObject ?? "unknown")),
    source: "proposal_generator",
    targetLayer: String(proposal.targetLayer ?? "unknown"),
    omittedInformation: [`review signal: ${String(proposal.targetObject ?? "unknown")}`],
    misleadingInformation: [],
    requestedScaffoldChange: String(proposal.expectedEffect ?? "Review scaffold omission before any proposal promotion."),
    evidence: [
      {
        source: "reverse_scaffold_feedback",
        runId,
        transitionId,
        summary: String(proposal.evidence?.[0]?.summary ?? "Generated from proposal seed."),
        strength: "weak",
        tags: ["proposal_seed", String(proposal.type ?? "unknown")]
      }
    ],
    confidence: typeof proposal.confidence === "number" ? proposal.confidence : 0.25,
    riskLevel: typeof proposal.riskLevel === "string" ? proposal.riskLevel : "low",
    proposalSeedIds: typeof proposal.id === "string" ? [proposal.id] : [],
    createdFromRunIds: runId ? [runId] : [],
    createdFromTransitionIds: transitionId ? [transitionId] : []
  };
}

function buildProposal(input: {
  id: string;
  runId: string;
  transitionId: string;
  decisionClass: string;
  type: string;
  status: "draft" | "pending_review";
  targetLayer: string;
  targetObject: string;
  proposedPatch: JsonRecord;
  evidenceSummary: string;
  evidenceSource: string;
  evidenceStrength: "weak" | "moderate" | "strong";
  suspectedCause: string;
  confidence: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  expectedEffect: string;
  counterexample: string;
  validationPlan: string[];
  rollbackAction: string;
  evidenceProvenance: string;
  evidencePromotionEligible: boolean;
  evidencePromotionReason: string;
  environmentScope: LearningProposal["environmentScope"];
}): Partial<LearningProposal> {
  return {
    id: input.id,
    type: input.type,
    status: input.status,
    scope: {
      decisionClasses: [input.decisionClass],
      conditions: [
        `generated_from:${input.evidenceSource}`,
        `evidence_provenance:${input.evidenceProvenance}`,
        `evidence_promotion_eligible:${String(input.evidencePromotionEligible)}`
      ],
      exclusions: ["console_debug_only_evidence_without_organic_confirmation"],
      notes: "P9.2 weak-attribution proposal seed; not an applied policy."
    },
    environmentScope: input.environmentScope,
    targetLayer: input.targetLayer,
    targetObject: input.targetObject,
    proposedPatch: {
      ...input.proposedPatch,
      evidenceProvenance: input.evidenceProvenance,
      evidencePromotionEligible: input.evidencePromotionEligible,
      evidencePromotionReason: input.evidencePromotionReason
    },
    evidence: [
      {
        source: input.evidenceSource,
        runId: input.runId,
        transitionId: input.transitionId,
        summary: input.evidenceSummary,
        strength: input.evidenceStrength,
        tags: [
          input.decisionClass,
          input.targetLayer,
          input.targetObject,
          `provenance:${input.evidenceProvenance}`,
          `promotion_eligible:${String(input.evidencePromotionEligible)}`
        ],
        raw: {
          evidenceProvenance: input.evidenceProvenance,
          evidencePromotionEligible: input.evidencePromotionEligible,
          evidencePromotionReason: input.evidencePromotionReason
        }
      }
    ],
    counterexamples: [
      {
        summary: input.counterexample,
        condition: input.decisionClass,
        impact: "Prevents a weak attribution from becoming stable policy without disconfirming evidence."
      }
    ],
    weakAttribution: {
      suspectedCause: input.suspectedCause,
      confidence: input.confidence,
      counterexampleNeeded: [input.counterexample],
      alternativeHypotheses: [
        "detector_false_positive",
        "scene_specific_exception",
        "candidate_generation_gap",
        "model_reason_omission"
      ]
    },
    confidence: input.confidence,
    riskLevel: input.riskLevel,
    behaviorImpact: behaviorImpactFor(input.type, input.targetLayer),
    expectedEffect: input.expectedEffect,
    promotionCriteria: {
      evidenceRequired: [
        "same-revision evidence slice",
        "counterexample review",
        "shadow-only validation before any stable promotion"
      ],
      validationPlan: input.validationPlan,
      minimumShadowRuns: 1,
      minimumFreshRuns: 0,
      successSignals: ["proposal remains scoped", "no validation/execution behavior change"],
      stopSignals: ["counterexample found", "proposal becomes vague advice", "requires protected-path write before promotion"]
    },
    rollbackPlan: {
      rollbackTrigger: ["shadow validation regression", "counterexample invalidates scope", "unexpected live/runtime behavior change"],
      rollbackAction: input.rollbackAction,
      owner: "human"
    },
    protectedPathImpact: {
      protectedTargets: [input.targetLayer],
      stableWriteRequired: true,
      allowedBeforePromotion: false,
      notes: "Generated proposal seed only; protected target may not change before guarded promotion."
    },
    createdFromRunIds: [input.runId],
    createdFromTransitionIds: [input.transitionId]
  };
}

function behaviorImpactFor(type: string, targetLayer: string): string {
  if (type === "reason_policy" || targetLayer === "reason_policy") return "presentation_only";
  if (type === "candidate_template" || targetLayer === "candidate_future") return "candidate_shaping";
  if (type === "classification_policy" || targetLayer === "classification") return "authority_shaping";
  if (type === "skill") return "authority_shaping";
  if (type === "budget_policy" || targetLayer === "budget_policy") return "deliberation_shaping";
  return "deliberation_shaping";
}

function addProposal(
  proposals: Array<Partial<LearningProposal>>,
  proposal: Partial<LearningProposal>,
  seen: Set<string>
): void {
  if (!proposal.id || seen.has(proposal.id)) return;
  seen.add(proposal.id);
  proposals.push(proposal);
}

function evidenceScopeOf(transition: JsonRecord): {
  evidenceProvenance: string;
  evidencePromotionEligible: boolean;
  evidencePromotionReason: string;
  environmentScope: LearningProposal["environmentScope"];
} {
  const eligibility = getTransitionPromotionEligibility(transition);
  const fingerprint = isRecord(transition.environmentFingerprint) ? transition.environmentFingerprint : {};
  const scope = isRecord(transition.evidenceEnvironmentScope) ? transition.evidenceEnvironmentScope : {};
  const scopeStatus = scope.scopeStatus === "exact" || scope.scopeStatus === "partial" || scope.scopeStatus === "mixed"
    ? scope.scopeStatus
    : "unknown";
  const provenance = scope.captureProvenance === "organic" || scope.captureProvenance === "console_debug" || scope.captureProvenance === "fixture"
    ? scope.captureProvenance
    : "unknown";
  const compatibility = scope.compatibilityState === "compatible" ||
    scope.compatibilityState === "degraded" ||
    scope.compatibilityState === "quarantined" ||
    scope.compatibilityState === "unsupported"
    ? scope.compatibilityState
    : "unknown";
  return {
    evidenceProvenance: eligibility.reason,
    evidencePromotionEligible: eligibility.eligible,
    evidencePromotionReason: eligibility.reason,
    environmentScope: {
      fingerprintHashes: typeof fingerprint.fingerprintHash === "string" ? [fingerprint.fingerprintHash] : [],
      scopeStatus,
      captureProvenance: [provenance],
      compatibilityStates: [compatibility],
      notes: eligibility.eligible
        ? ["source_transition_environment_scope_exact"]
        : ["source_transition_environment_scope_ineligible:" + eligibility.reason]
    }
  };
}

function targetForPredictionLayer(layer: string, buckets: string[]): { type: string; targetLayer: string; suggestedChange: string } {
  if (layer === "candidate_future" || buckets.some((bucket) => ["card_flow", "phase", "resource", "damage", "defense", "kill"].includes(bucket))) {
    return {
      type: "candidate_template",
      targetLayer: "candidate_future",
      suggestedChange: "strengthen prediction checks and invalidation triggers for the suspected bucket"
    };
  }
  if (buckets.some((bucket) => ["route", "reward"].includes(bucket))) {
    return {
      type: "classification_policy",
      targetLayer: "classification_policy",
      suggestedChange: "review soft classification/routing for the suspected delayed-decision bucket"
    };
  }
  return {
    type: "scaffold_policy",
    targetLayer: "prediction_error_attribution",
    suggestedChange: "review attribution policy before creating a more specific proposal"
  };
}

function targetForWorkspaceSignal(signal: string): { type: string; targetLayer: string; suggestedChange: string } {
  if (signal.includes("reason")) {
    return { type: "reason_policy", targetLayer: "reason_policy", suggestedChange: "review reason contract without adding validation blockers" };
  }
  if (signal.includes("budget")) {
    return { type: "budget_policy", targetLayer: "budget_policy", suggestedChange: "review budget telemetry only; no automatic escalation" };
  }
  if (signal.includes("context") || signal.includes("classification")) {
    return { type: "scaffold_policy", targetLayer: "scaffold_policy", suggestedChange: "review scaffold context/routing evidence" };
  }
  return { type: "candidate_template", targetLayer: "candidate_future", suggestedChange: "review candidate future template completeness" };
}

function workspaceCoverageOf(transition: JsonRecord): JsonRecord | undefined {
  const comparison = isRecord(transition.workspaceComparison) ? transition.workspaceComparison : undefined;
  return isRecord(comparison?.coverage) ? comparison.coverage : undefined;
}

function signalNames(value: unknown): string[] {
  if (!isRecord(value)) return [];
  return Object.entries(value)
    .filter(([, count]) => typeof count === "number" && count > 0)
    .map(([signal]) => signal);
}

function transitionIdOf(transition: JsonRecord): string {
  return stringValue(transition.transitionId, "transition-unknown");
}

function decisionClassOf(transition: JsonRecord): string {
  const comparison = isRecord(transition.workspaceComparison) ? transition.workspaceComparison : undefined;
  const shadow = isRecord(transition.shadowWorkspaceDecision) ? transition.shadowWorkspaceDecision : undefined;
  return stringValue(comparison?.decisionClass, stringValue(shadow?.decisionClass, `${stringValue(transition.screen, "unknown")}:unknown`));
}

function generatedId(...parts: Array<string | undefined>): string {
  return parts
    .filter((part): part is string => Boolean(part))
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function countBy(records: Array<Partial<LearningProposal> | Partial<ReverseScaffoldFeedback>>, key: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of records) {
    const value = String((record as Record<string, unknown>)[key] ?? "unknown");
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
