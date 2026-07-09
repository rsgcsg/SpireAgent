import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  DOMAIN_SCHEMA_VERSION,
  type JsonRecord,
  type LearningProposal,
  type LearningProposalReviewDecision,
  type LearningProposalReviewDecisionKind,
  type LearningProposalStatus,
  type ReverseScaffoldFeedback
} from "../domain/types.js";
import { appendJsonl, isRecord, nowIso, stableId } from "../agent/utils.js";

export const LEARNING_PROPOSALS_FILE = "learning-proposals.jsonl";
export const REVERSE_SCAFFOLD_FEEDBACK_FILE = "reverse-scaffold-feedback.jsonl";
export const LEARNING_PROPOSAL_REVIEW_DECISIONS_FILE = "learning-proposal-review-decisions.jsonl";

export interface LearningProposalSurface {
  schemaVersion: number;
  surface: "p9_learning_proposals";
  proposals: number;
  pendingReview: number;
  draft: number;
  rejected: number;
  actionablePending: number;
  stableOrApplied: number;
  validationRejected: number;
  statusCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  targetLayerCounts: Record<string, number>;
  protectedTargetCounts: Record<string, number>;
  missingRequiredFieldCounts: Record<string, number>;
  sourceSurfaceCounts: Record<string, number>;
  examples: JsonRecord[];
  applyPathEnabled: false;
  stablePromotionEnabled: false;
}

export interface ReverseScaffoldFeedbackSurface {
  schemaVersion: number;
  surface: "p9_reverse_scaffold_feedback";
  feedback: number;
  targetLayerCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  proposalSeedLinks: number;
  averageConfidence: number;
  examples: JsonRecord[];
  affectsLiveBehavior: false;
  stablePromotionEnabled: false;
}

export interface LearningProposalReviewDecisionSurface {
  schemaVersion: number;
  surface: "p9_learning_proposal_review_decisions";
  decisions: number;
  approve: number;
  reject: number;
  expire: number;
  reviewerCounts: Record<string, number>;
  proposalIds: string[];
  examples: JsonRecord[];
  proposalMutationEnabled: false;
  applyPathEnabled: false;
  stablePromotionEnabled: false;
}

export interface LearningProposalShadowOverlayPlan {
  schemaVersion: number;
  surface: "p9_learning_proposal_shadow_overlay_plan";
  proposalId: string;
  type: string;
  status: string;
  targetLayer: string;
  targetObject: string;
  eligibleForShadowPreview: boolean;
  eligibleForShadowApplication: false;
  blockers: string[];
  affectedSoftLayer: string;
  protectedTargets: string[];
  wouldAffectRuntimeDecision: false;
  proposalMutationEnabled: false;
  applyPathEnabled: false;
  stablePromotionEnabled: false;
  notes: string[];
}

export interface LearningProposalFilter {
  id?: string;
  runId?: string;
  transitionId?: string;
  type?: string;
  status?: string;
  targetLayer?: string;
  missingRequiredField?: string;
}

export interface ReverseScaffoldFeedbackFilter {
  id?: string;
  runId?: string;
  transitionId?: string;
  targetLayer?: string;
  source?: string;
  proposalSeedId?: string;
}

export interface LearningProposalReviewDecisionFilter {
  id?: string;
  proposalId?: string;
  decision?: string;
  reviewer?: string;
}

export function createLearningProposal(input: Partial<LearningProposal>): LearningProposal {
  const createdAt = typeof input.createdAt === "string" ? input.createdAt : nowIso();
  const proposal: LearningProposal = {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    id: typeof input.id === "string" ? input.id : stableId("learning-proposal"),
    type: typeof input.type === "string" ? input.type : "scaffold_policy",
    status: normalizeRequestedStatus(input.status),
    scope: isRecord(input.scope) ? input.scope : {},
    targetLayer: typeof input.targetLayer === "string" ? input.targetLayer : "",
    targetObject: typeof input.targetObject === "string" ? input.targetObject : "",
    proposedPatch: isRecord(input.proposedPatch) ? input.proposedPatch : {},
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    counterexamples: Array.isArray(input.counterexamples) ? input.counterexamples : [],
    weakAttribution: isRecord(input.weakAttribution)
      ? input.weakAttribution
      : {
          suspectedCause: "",
          confidence: 0,
          counterexampleNeeded: [],
          alternativeHypotheses: []
        },
    confidence: typeof input.confidence === "number" ? input.confidence : 0,
    riskLevel: typeof input.riskLevel === "string" ? input.riskLevel : "medium",
    expectedEffect: typeof input.expectedEffect === "string" ? input.expectedEffect : "",
    promotionCriteria: isRecord(input.promotionCriteria)
      ? input.promotionCriteria
      : { evidenceRequired: [], validationPlan: [] },
    rollbackPlan: isRecord(input.rollbackPlan)
      ? input.rollbackPlan
      : { rollbackTrigger: [], rollbackAction: "" },
    protectedPathImpact: isRecord(input.protectedPathImpact)
      ? input.protectedPathImpact
      : {
          protectedTargets: [],
          stableWriteRequired: false,
          allowedBeforePromotion: false
        },
    createdFromRunIds: Array.isArray(input.createdFromRunIds) ? input.createdFromRunIds : [],
    createdFromTransitionIds: Array.isArray(input.createdFromTransitionIds) ? input.createdFromTransitionIds : [],
    reviewHistory: Array.isArray(input.reviewHistory) ? input.reviewHistory : [],
    validation: {
      schemaVersion: DOMAIN_SCHEMA_VERSION,
      actionable: false,
      normalizedStatus: "draft",
      missingRequiredFields: [],
      reasons: []
    },
    createdAt
  };
  return applyLearningProposalValidation(proposal);
}

export function appendLearningProposal(runDir: string, input: Partial<LearningProposal>): LearningProposal {
  const proposal = createLearningProposal(input);
  appendJsonl(path.join(runDir, LEARNING_PROPOSALS_FILE), proposal);
  return proposal;
}

export function readLearningProposals(runDir: string): JsonRecord[] {
  return readJsonlIfExists(path.join(runDir, LEARNING_PROPOSALS_FILE)).map((proposal) => ({
    ...proposal,
    sourceSurface: LEARNING_PROPOSALS_FILE
  }));
}

export function filterLearningProposals(proposals: JsonRecord[], filter: LearningProposalFilter): JsonRecord[] {
  return proposals.filter((proposal) => {
    if (filter.id && proposal.id !== filter.id) return false;
    if (filter.type && proposal.type !== filter.type) return false;
    if (filter.status && proposal.status !== filter.status) return false;
    if (filter.targetLayer && proposal.targetLayer !== filter.targetLayer) return false;
    if (filter.runId && !arrayIncludesString(proposal.createdFromRunIds, filter.runId)) return false;
    if (filter.transitionId && !arrayIncludesString(proposal.createdFromTransitionIds, filter.transitionId)) return false;
    if (filter.missingRequiredField) {
      const validation = isRecord(proposal.validation) ? proposal.validation : undefined;
      if (!arrayIncludesString(validation?.missingRequiredFields, filter.missingRequiredField)) return false;
    }
    return true;
  });
}

export function buildLearningProposalSurface(proposals: unknown[]): LearningProposalSurface {
  const records = proposals.filter(isRecord);
  const surface: LearningProposalSurface = {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    surface: "p9_learning_proposals",
    proposals: records.length,
    pendingReview: 0,
    draft: 0,
    rejected: 0,
    actionablePending: 0,
    stableOrApplied: 0,
    validationRejected: 0,
    statusCounts: {},
    typeCounts: {},
    targetLayerCounts: {},
    protectedTargetCounts: {},
    missingRequiredFieldCounts: {},
    sourceSurfaceCounts: {},
    examples: [],
    applyPathEnabled: false,
    stablePromotionEnabled: false
  };
  for (const proposal of records) {
    const status = stringValue(proposal.status, "unknown");
    const type = stringValue(proposal.type, "unknown");
    const targetLayer = stringValue(proposal.targetLayer, "unknown");
    const validation = isRecord(proposal.validation) ? proposal.validation : undefined;
    count(surface.statusCounts, status);
    count(surface.typeCounts, type);
    count(surface.targetLayerCounts, targetLayer);
    count(surface.sourceSurfaceCounts, stringValue(proposal.sourceSurface, "unknown"));
    if (status === "pending_review") surface.pendingReview += 1;
    if (status === "draft") surface.draft += 1;
    if (status === "rejected") surface.rejected += 1;
    if (status === "stable" || status === "approved" || status === "shadow_validated") surface.stableOrApplied += 1;
    if (status === "rejected" && validation?.actionable === false) surface.validationRejected += 1;
    if (status === "pending_review" && validation?.actionable === true) surface.actionablePending += 1;
    if (Array.isArray(validation?.missingRequiredFields)) {
      for (const field of validation.missingRequiredFields) {
        count(surface.missingRequiredFieldCounts, String(field));
      }
    }
    const impact = isRecord(proposal.protectedPathImpact) ? proposal.protectedPathImpact : undefined;
    if (Array.isArray(impact?.protectedTargets)) {
      for (const target of impact.protectedTargets) count(surface.protectedTargetCounts, String(target));
    }
    if (surface.examples.length < 5) {
      surface.examples.push({
        id: proposal.id,
        type,
        status,
        targetLayer,
        actionable: validation?.actionable === true,
        missingRequiredFields: Array.isArray(validation?.missingRequiredFields) ? validation.missingRequiredFields : []
      });
    }
  }
  return surface;
}

export function formatLearningProposalSurface(surface: LearningProposalSurface): string {
  return [
    `proposals=${surface.proposals}`,
    `pendingReview=${surface.pendingReview}`,
    `actionablePending=${surface.actionablePending}`,
    `draft=${surface.draft}`,
    `rejected=${surface.rejected}`,
    `stableOrApplied=${surface.stableOrApplied}`,
    `types=${JSON.stringify(surface.typeCounts)}`,
    `missingRequired=${JSON.stringify(surface.missingRequiredFieldCounts)}`,
    `applyPathEnabled=${surface.applyPathEnabled}`,
    `stablePromotionEnabled=${surface.stablePromotionEnabled}`
  ].join(" ");
}

export function summarizeLearningProposal(proposal: JsonRecord): JsonRecord {
  const validation = isRecord(proposal.validation) ? proposal.validation : {};
  return {
    id: proposal.id,
    type: proposal.type,
    status: proposal.status,
    targetLayer: proposal.targetLayer,
    targetObject: proposal.targetObject,
    confidence: proposal.confidence,
    riskLevel: proposal.riskLevel,
    actionable: validation.actionable,
    missingRequiredFields: Array.isArray(validation.missingRequiredFields) ? validation.missingRequiredFields : [],
    sourceRuns: proposal.createdFromRunIds,
    sourceTransitions: proposal.createdFromTransitionIds,
    stablePromotionEnabled: false,
    applyPathEnabled: false
  };
}

export function buildLearningProposalShadowOverlayPlan(proposal: JsonRecord): LearningProposalShadowOverlayPlan {
  const validation = isRecord(proposal.validation) ? proposal.validation : {};
  const impact = isRecord(proposal.protectedPathImpact) ? proposal.protectedPathImpact : {};
  const protectedTargets = Array.isArray(impact.protectedTargets) ? impact.protectedTargets.map(String) : [];
  const status = stringValue(proposal.status, "unknown");
  const actionable = validation.actionable === true;
  const blockers: string[] = [];
  if (!actionable) blockers.push("proposal_not_actionable");
  if (status !== "pending_review" && status !== "shadow_validated" && status !== "approved") {
    blockers.push("proposal_not_review_ready");
  }
  if (protectedTargets.length === 0) blockers.push("protected_targets_not_declared");
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    surface: "p9_learning_proposal_shadow_overlay_plan",
    proposalId: stringValue(proposal.id, "unknown"),
    type: stringValue(proposal.type, "unknown"),
    status,
    targetLayer: stringValue(proposal.targetLayer, "unknown"),
    targetObject: stringValue(proposal.targetObject, "unknown"),
    eligibleForShadowPreview: true,
    eligibleForShadowApplication: false,
    blockers,
    affectedSoftLayer: stringValue(proposal.targetLayer, "unknown"),
    protectedTargets,
    wouldAffectRuntimeDecision: false,
    proposalMutationEnabled: false,
    applyPathEnabled: false,
    stablePromotionEnabled: false,
    notes: [
      "Shadow overlay planning is read-only.",
      "This does not alter workspace construction, live behavior, validation, execution, memory, derived knowledge, strategy, skills, or scaffold policy.",
      "Actual shadow application remains disabled until a guarded P9.5 applicator is implemented and tested."
    ]
  };
}

export function createLearningProposalReviewDecision(
  proposals: JsonRecord[],
  input: Partial<LearningProposalReviewDecision>
): LearningProposalReviewDecision {
  const proposalId = typeof input.proposalId === "string" ? input.proposalId : "";
  if (!proposalId) throw new Error("Learning proposal review decision requires proposalId.");
  const proposal = proposals.find((record) => record.id === proposalId);
  if (!proposal) throw new Error(`Learning proposal review decision target not found: ${proposalId}`);
  const decision = normalizeReviewDecision(input.decision);
  const validation = isRecord(proposal.validation) ? proposal.validation : {};
  const missingRequiredFields = Array.isArray(validation.missingRequiredFields)
    ? validation.missingRequiredFields.map(String)
    : [];
  const actionable = validation.actionable === true;
  if (decision === "approve" && !actionable) {
    throw new Error(`Cannot record approve decision for non-actionable proposal: ${proposalId}`);
  }
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  if (!notes) throw new Error("Learning proposal review decision requires notes.");
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    id: typeof input.id === "string" ? input.id : stableId("learning-proposal-review-decision"),
    proposalId,
    decision,
    reviewer: typeof input.reviewer === "string" ? input.reviewer : "human",
    notes,
    createdAt: typeof input.createdAt === "string" ? input.createdAt : nowIso(),
    proposalSnapshot: {
      status: stringValue(proposal.status, "unknown"),
      type: typeof proposal.type === "string" ? proposal.type : undefined,
      targetLayer: typeof proposal.targetLayer === "string" ? proposal.targetLayer : undefined,
      targetObject: typeof proposal.targetObject === "string" ? proposal.targetObject : undefined,
      actionable,
      missingRequiredFields
    },
    reviewScope: "audit_only",
    proposalMutationEnabled: false,
    applyPathEnabled: false,
    stablePromotionEnabled: false
  };
}

export function appendLearningProposalReviewDecision(
  runDir: string,
  proposals: JsonRecord[],
  input: Partial<LearningProposalReviewDecision>
): LearningProposalReviewDecision {
  const decision = createLearningProposalReviewDecision(proposals, input);
  appendJsonl(path.join(runDir, LEARNING_PROPOSAL_REVIEW_DECISIONS_FILE), decision);
  return decision;
}

export function readLearningProposalReviewDecisions(runDir: string): JsonRecord[] {
  return readJsonlIfExists(path.join(runDir, LEARNING_PROPOSAL_REVIEW_DECISIONS_FILE)).map((decision) => ({
    ...decision,
    sourceSurface: LEARNING_PROPOSAL_REVIEW_DECISIONS_FILE
  }));
}

export function filterLearningProposalReviewDecisions(
  decisions: JsonRecord[],
  filter: LearningProposalReviewDecisionFilter
): JsonRecord[] {
  return decisions.filter((decision) => {
    if (filter.id && decision.id !== filter.id) return false;
    if (filter.proposalId && decision.proposalId !== filter.proposalId) return false;
    if (filter.decision && decision.decision !== filter.decision) return false;
    if (filter.reviewer && decision.reviewer !== filter.reviewer) return false;
    return true;
  });
}

export function buildLearningProposalReviewDecisionSurface(decisions: unknown[]): LearningProposalReviewDecisionSurface {
  const records = decisions.filter(isRecord);
  const surface: LearningProposalReviewDecisionSurface = {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    surface: "p9_learning_proposal_review_decisions",
    decisions: records.length,
    approve: 0,
    reject: 0,
    expire: 0,
    reviewerCounts: {},
    proposalIds: [],
    examples: [],
    proposalMutationEnabled: false,
    applyPathEnabled: false,
    stablePromotionEnabled: false
  };
  const proposalIds = new Set<string>();
  for (const record of records) {
    const decision = stringValue(record.decision, "unknown");
    const reviewer = stringValue(record.reviewer, "unknown");
    count(surface.reviewerCounts, reviewer);
    if (decision === "approve") surface.approve += 1;
    if (decision === "reject") surface.reject += 1;
    if (decision === "expire") surface.expire += 1;
    if (typeof record.proposalId === "string") proposalIds.add(record.proposalId);
    if (surface.examples.length < 5) surface.examples.push(summarizeLearningProposalReviewDecision(record));
  }
  surface.proposalIds = [...proposalIds].sort();
  return surface;
}

export function formatLearningProposalReviewDecisionSurface(surface: LearningProposalReviewDecisionSurface): string {
  return [
    `decisions=${surface.decisions}`,
    `approve=${surface.approve}`,
    `reject=${surface.reject}`,
    `expire=${surface.expire}`,
    `reviewers=${JSON.stringify(surface.reviewerCounts)}`,
    `proposals=${surface.proposalIds.length}`,
    `proposalMutationEnabled=${surface.proposalMutationEnabled}`,
    `applyPathEnabled=${surface.applyPathEnabled}`,
    `stablePromotionEnabled=${surface.stablePromotionEnabled}`
  ].join(" ");
}

export function summarizeLearningProposalReviewDecision(decision: JsonRecord): JsonRecord {
  const snapshot = isRecord(decision.proposalSnapshot) ? decision.proposalSnapshot : {};
  return {
    id: decision.id,
    proposalId: decision.proposalId,
    decision: decision.decision,
    reviewer: decision.reviewer,
    notes: decision.notes,
    createdAt: decision.createdAt,
    proposalStatus: snapshot.status,
    proposalActionable: snapshot.actionable,
    missingRequiredFields: Array.isArray(snapshot.missingRequiredFields) ? snapshot.missingRequiredFields : [],
    reviewScope: decision.reviewScope,
    proposalMutationEnabled: false,
    applyPathEnabled: false,
    stablePromotionEnabled: false
  };
}

export function createReverseScaffoldFeedback(input: Partial<ReverseScaffoldFeedback>): ReverseScaffoldFeedback {
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    id: typeof input.id === "string" ? input.id : stableId("reverse-scaffold-feedback"),
    source: typeof input.source === "string" ? input.source : "review",
    targetLayer: typeof input.targetLayer === "string" ? input.targetLayer : "unknown",
    omittedInformation: Array.isArray(input.omittedInformation) ? input.omittedInformation : [],
    misleadingInformation: Array.isArray(input.misleadingInformation) ? input.misleadingInformation : [],
    requestedScaffoldChange: typeof input.requestedScaffoldChange === "string" ? input.requestedScaffoldChange : "",
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    confidence: typeof input.confidence === "number" ? input.confidence : 0,
    riskLevel: typeof input.riskLevel === "string" ? input.riskLevel : "medium",
    proposalSeedIds: Array.isArray(input.proposalSeedIds) ? input.proposalSeedIds : [],
    createdFromRunIds: Array.isArray(input.createdFromRunIds) ? input.createdFromRunIds : [],
    createdFromTransitionIds: Array.isArray(input.createdFromTransitionIds) ? input.createdFromTransitionIds : [],
    createdAt: typeof input.createdAt === "string" ? input.createdAt : nowIso()
  };
}

export function appendReverseScaffoldFeedback(runDir: string, input: Partial<ReverseScaffoldFeedback>): ReverseScaffoldFeedback {
  const feedback = createReverseScaffoldFeedback(input);
  appendJsonl(path.join(runDir, REVERSE_SCAFFOLD_FEEDBACK_FILE), feedback);
  return feedback;
}

export function readReverseScaffoldFeedback(runDir: string): JsonRecord[] {
  return readJsonlIfExists(path.join(runDir, REVERSE_SCAFFOLD_FEEDBACK_FILE)).map((feedback) => ({
    ...feedback,
    sourceSurface: REVERSE_SCAFFOLD_FEEDBACK_FILE
  }));
}

export function filterReverseScaffoldFeedback(feedbackRecords: JsonRecord[], filter: ReverseScaffoldFeedbackFilter): JsonRecord[] {
  return feedbackRecords.filter((feedback) => {
    if (filter.id && feedback.id !== filter.id) return false;
    if (filter.targetLayer && feedback.targetLayer !== filter.targetLayer) return false;
    if (filter.source && feedback.source !== filter.source) return false;
    if (filter.runId && !arrayIncludesString(feedback.createdFromRunIds, filter.runId)) return false;
    if (filter.transitionId && !arrayIncludesString(feedback.createdFromTransitionIds, filter.transitionId)) return false;
    if (filter.proposalSeedId && !arrayIncludesString(feedback.proposalSeedIds, filter.proposalSeedId)) return false;
    return true;
  });
}

export function buildReverseScaffoldFeedbackSurface(feedbackRecords: unknown[]): ReverseScaffoldFeedbackSurface {
  const records = feedbackRecords.filter(isRecord);
  const surface: ReverseScaffoldFeedbackSurface = {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    surface: "p9_reverse_scaffold_feedback",
    feedback: records.length,
    targetLayerCounts: {},
    sourceCounts: {},
    proposalSeedLinks: 0,
    averageConfidence: 0,
    examples: [],
    affectsLiveBehavior: false,
    stablePromotionEnabled: false
  };
  let confidenceSum = 0;
  let confidenceSamples = 0;
  for (const record of records) {
    count(surface.targetLayerCounts, stringValue(record.targetLayer, "unknown"));
    count(surface.sourceCounts, stringValue(record.source, "unknown"));
    if (Array.isArray(record.proposalSeedIds)) surface.proposalSeedLinks += record.proposalSeedIds.length;
    if (typeof record.confidence === "number") {
      confidenceSum += record.confidence;
      confidenceSamples += 1;
    }
    if (surface.examples.length < 5) {
      surface.examples.push({
        id: record.id,
        source: record.source,
        targetLayer: record.targetLayer,
        omittedInformation: record.omittedInformation,
        requestedScaffoldChange: record.requestedScaffoldChange
      });
    }
  }
  surface.averageConfidence = confidenceSamples > 0 ? round(confidenceSum / confidenceSamples) : 0;
  return surface;
}

export function formatReverseScaffoldFeedbackSurface(surface: ReverseScaffoldFeedbackSurface): string {
  return [
    `feedback=${surface.feedback}`,
    `layers=${JSON.stringify(surface.targetLayerCounts)}`,
    `sources=${JSON.stringify(surface.sourceCounts)}`,
    `proposalSeedLinks=${surface.proposalSeedLinks}`,
    `averageConfidence=${surface.averageConfidence}`,
    `affectsLiveBehavior=${surface.affectsLiveBehavior}`,
    `stablePromotionEnabled=${surface.stablePromotionEnabled}`
  ].join(" ");
}

export function summarizeReverseScaffoldFeedback(feedback: JsonRecord): JsonRecord {
  return {
    id: feedback.id,
    source: feedback.source,
    targetLayer: feedback.targetLayer,
    confidence: feedback.confidence,
    riskLevel: feedback.riskLevel,
    omittedInformation: feedback.omittedInformation,
    misleadingInformation: feedback.misleadingInformation,
    requestedScaffoldChange: feedback.requestedScaffoldChange,
    proposalSeedIds: feedback.proposalSeedIds,
    sourceRuns: feedback.createdFromRunIds,
    sourceTransitions: feedback.createdFromTransitionIds,
    affectsLiveBehavior: false,
    stablePromotionEnabled: false
  };
}

function applyLearningProposalValidation(proposal: LearningProposal): LearningProposal {
  const missingRequiredFields = missingProposalFields(proposal);
  const actionable = missingRequiredFields.length === 0 && proposal.status === "pending_review";
  const normalizedStatus = normalizeValidatedStatus(proposal.status, missingRequiredFields);
  return {
    ...proposal,
    status: normalizedStatus,
    validation: {
      schemaVersion: DOMAIN_SCHEMA_VERSION,
      actionable: normalizedStatus === "pending_review" && missingRequiredFields.length === 0,
      normalizedStatus,
      missingRequiredFields,
      reasons: missingRequiredFields.length > 0
        ? ["proposal_missing_operational_fields"]
        : actionable
          ? ["proposal_ready_for_pending_review"]
          : ["proposal_recorded_without_apply_path"]
    },
    reviewHistory: [
      ...proposal.reviewHistory,
      {
        timestamp: nowIso(),
        reviewer: "system",
        decision: normalizedStatus === "pending_review" ? "pending_review" : "marked_draft",
        notes: missingRequiredFields.length > 0
          ? `Missing required fields: ${missingRequiredFields.join(", ")}`
          : "P9.1 proposal recorded as append-only evidence."
      }
    ]
  };
}

function missingProposalFields(proposal: LearningProposal): string[] {
  const missing: string[] = [];
  if (!proposal.type) missing.push("type");
  if (!hasScope(proposal.scope)) missing.push("scope");
  if (!proposal.targetLayer) missing.push("targetLayer");
  if (!proposal.targetObject) missing.push("targetObject");
  if (!isRecord(proposal.proposedPatch) || Object.keys(proposal.proposedPatch).length === 0) missing.push("proposedPatch");
  if (!Array.isArray(proposal.evidence) || proposal.evidence.length === 0) missing.push("evidence");
  if (!Array.isArray(proposal.counterexamples) || proposal.counterexamples.length === 0) missing.push("counterexamples");
  if (!proposal.weakAttribution.suspectedCause) missing.push("weakAttribution.suspectedCause");
  if (!Array.isArray(proposal.weakAttribution.counterexampleNeeded) || proposal.weakAttribution.counterexampleNeeded.length === 0) {
    missing.push("weakAttribution.counterexampleNeeded");
  }
  if (!Array.isArray(proposal.weakAttribution.alternativeHypotheses) || proposal.weakAttribution.alternativeHypotheses.length === 0) {
    missing.push("weakAttribution.alternativeHypotheses");
  }
  if (!proposal.expectedEffect) missing.push("expectedEffect");
  if (!proposal.riskLevel) missing.push("riskLevel");
  if (!proposal.promotionCriteria.evidenceRequired.length) missing.push("promotionCriteria.evidenceRequired");
  if (!proposal.promotionCriteria.validationPlan.length) missing.push("promotionCriteria.validationPlan");
  if (!proposal.rollbackPlan.rollbackTrigger.length) missing.push("rollbackPlan.rollbackTrigger");
  if (!proposal.rollbackPlan.rollbackAction) missing.push("rollbackPlan.rollbackAction");
  if (!Array.isArray(proposal.protectedPathImpact.protectedTargets)) missing.push("protectedPathImpact.protectedTargets");
  if (!proposal.createdFromRunIds.length) missing.push("createdFromRunIds");
  if (!proposal.createdFromTransitionIds.length) missing.push("createdFromTransitionIds");
  return missing;
}

function normalizeRequestedStatus(status: unknown): LearningProposalStatus {
  return typeof status === "string" && isLearningProposalStatus(status) ? status : "draft";
}

function normalizeReviewDecision(decision: unknown): LearningProposalReviewDecisionKind {
  if (decision === "approve" || decision === "reject" || decision === "expire") return decision;
  throw new Error(`Unsupported learning proposal review decision: ${String(decision)}`);
}

function normalizeValidatedStatus(status: LearningProposalStatus, missingRequiredFields: string[]): LearningProposalStatus {
  if (status === "stable" || status === "approved" || status === "shadow_validated") return "rejected";
  if (missingRequiredFields.length > 0 && status === "pending_review") return "draft";
  return status;
}

function isLearningProposalStatus(status: string): status is LearningProposalStatus {
  return ["draft", "pending_review", "shadow_validated", "approved", "stable", "rejected", "expired", "reverted"].includes(status);
}

function hasScope(scope: unknown): boolean {
  if (!isRecord(scope)) return false;
  return Object.values(scope).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
}

function readJsonlIfExists(filePath: string): JsonRecord[] {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parsed = JSON.parse(line);
      if (!isRecord(parsed)) {
        throw new Error(`${path.basename(filePath)} line ${index + 1} is not an object`);
      }
      return parsed;
    });
}

function count(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function arrayIncludesString(value: unknown, expected: string): boolean {
  return Array.isArray(value) && value.some((item) => item === expected);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
