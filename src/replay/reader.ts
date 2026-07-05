import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { JsonRecord } from "../domain/types.js";
import type { TransitionRecord } from "../data/transitionSchema.js";
import { assertGroundTruthInvariants } from "../data/transitionSchema.js";
import { agentRoot, isRecord } from "../agent/utils.js";

export interface ReplayRun {
  runDir: string;
  transitions: TransitionRecord[];
}

export interface ReplayTimelineItem {
  index: number;
  tick: number;
  timestamp: string;
  screen: string;
  floor?: number;
  source: string;
  captureMode: string;
  isGroundTruth: boolean;
  selectedAction: unknown;
  checkpointKind?: string;
  summary: string;
}

export interface ReplayCognitiveCoverage {
  transitions: number;
  strategicImpression: number;
  salienceSignals: number;
  memoryActivation: number;
  candidateFutures: number;
  candidateFuturePredictionChecks: number;
  derivedSnapshot: number;
  derivedKnowledgeSummary: number;
  deliberationPacket: number;
  promptParity: number;
  workspaceComparison: number;
  workspaceReady: number;
  workspaceProviderReady: number;
  shadowWorkspaceDecision: number;
  shadowWorkspaceCalled: number;
  shadowWorkspaceSkipped: number;
  shadowWorkspaceValid: number;
  shadowWorkspaceInvalidOrError: number;
  shadowWorkspaceAgreementCounts: Record<string, number>;
  shadowWorkspaceBudgetStatusCounts: Record<string, number>;
  predictionError: number;
  replayFrame: number;
  consolidation: number;
  fullShadowScaffold: number;
}

export interface ReplayShadowSliceStats {
  label: string;
  revisionTag?: string;
  transitions: number;
  shadowRecords: number;
  plannedShadowCalls: number;
  maxObservedShadowCallsUsed: number;
  called: number;
  liveEligibleCalled: number;
  valid: number;
  liveEligibleValid: number;
  invalidOutput: number;
  liveEligibleInvalidOutput: number;
  nonLiveInvalidOutput: number;
  invalidChoice: number;
  liveEligibleInvalidChoice: number;
  error: number;
  liveEligibleError: number;
  unavailable: number;
  skipped: number;
  missingCandidate: number;
  liveEligibleMissingCandidate: number;
  agreementCounts: Record<string, number>;
  reasonQualityCounts: Record<string, number>;
  reasonQualityNoteCounts: Record<string, number>;
  budgetStatusCounts: Record<string, number>;
  governanceProfileCounts: Record<string, number>;
  recoveryPolicyCounts: Record<string, number>;
  recoveryOutputCapRelationCounts: Record<string, number>;
  invalidBucketCounts: Record<string, number>;
  failureCategoryCounts: Record<string, number>;
  failureBucketCounts: Record<string, number>;
  providerModeCounts: Record<string, number>;
  ablationModeCounts: Record<string, number>;
  compressionModeCounts: Record<string, number>;
  finishReasonCounts: Record<string, number>;
  cleanupReasonCounts: Record<string, number>;
  outputCapHits: number;
  retryCount: number;
  retriedCalls: number;
  retrySuccessCount: number;
  averageWorkspacePromptBytes: number;
  averageWorkspacePromptTokens: number;
  workspacePromptSamples: number;
  averageWorkspaceBytesBefore: number;
  averageWorkspaceBytesAfter: number;
  averageWorkspaceTokensBefore: number;
  averageWorkspaceTokensAfter: number;
  averageCandidateFuturesBytesBefore: number;
  averageCandidateFuturesBytesAfter: number;
  averageCandidateFuturesTokensBefore: number;
  averageCandidateFuturesTokensAfter: number;
  sizeTelemetrySamples: number;
  futuresTruncated: number;
  futuresOmitted: number;
  truncatedFieldCounts: Record<string, number>;
  averageInformationPreservationEstimate: number;
  informationPreservationEstimateSamples: number;
  largestFieldSourceBytes: Record<string, number>;
  repeatedTextBytes: number;
  repeatedTextCount: number;
  estimatedCostUsd: number;
  actualOrEstimatedCostUsd: number;
  skippedBudgetEstimatedCostUsd: number;
  averageLatencyMs: number;
  latencySamples: number;
  totalActualInputTokens: number;
  totalActualOutputTokens: number;
  totalActualTokens: number;
  revisionTagCounts: Record<string, number>;
  plannedShadowCallValueCounts: Record<string, number>;
  mixedRevisionWindow: boolean;
  mixedBudgetWindow: boolean;
  gate: {
    status: "go" | "no_go";
    reasons: string[];
  };
}

export interface ReplayFreshShadowSlices {
  last5: ReplayShadowSliceStats;
  last20: ReplayShadowSliceStats;
  last50: ReplayShadowSliceStats;
  sinceLatestRevision: ReplayShadowSliceStats;
}

export interface ReplayFocusedShadowSlice {
  label: string;
  decisionClass: string;
  revisionTag?: string;
  plannedShadowCalls?: number;
  transitionIds: string[];
  ticks: number[];
  stats: ReplayShadowSliceStats;
}

export interface ReplayFocusedShadowSlices {
  combatLiveEligibleFresh: ReplayFocusedShadowSlice;
}

export interface ReplayConsolidationProposalSurface {
  proposals: number;
  fromProposalLog: number;
  fromTransitions: number;
  statusCounts: Record<string, number>;
  targetLayerCounts: Record<string, number>;
  evidenceStrengthCounts: Record<string, number>;
  mutatingOrAccepted: number;
  pendingReview: number;
  groups: ReplayConsolidationProposalGroup[];
  recurringGroups: number;
  examples: JsonRecord[];
}

export interface ReplayConsolidationProposalGroup {
  groupId: string;
  targetLayer: string;
  action: string;
  buckets: string[];
  occurrences: number;
  evidenceStrength: "weak" | "moderate" | "strong" | "unknown";
  confidence: number;
  pendingReview: number;
  mutatingOrAccepted: number;
  transitionIds: string[];
  ticks: number[];
  screens: string[];
  floors: number[];
  selectedActions: unknown[];
  proposal: string;
  stableMutation: boolean;
  blockedStableTargets: string[];
  allowedNextSteps: string[];
  forbiddenNextSteps: string[];
  examples: JsonRecord[];
}

export function readReplayRun(runIdOrPath?: string, runsRoot = path.join(agentRoot, "data", "runs")): ReplayRun {
  const runDir = resolveRunDir(runIdOrPath, runsRoot);
  const transitionsPath = path.join(runDir, "transitions.jsonl");
  const transitions = readTransitionJsonl(transitionsPath);
  return { runDir, transitions };
}

export function readConsolidationProposals(runDir: string, transitions: Array<TransitionRecord | JsonRecord> = []): JsonRecord[] {
  const proposalsPath = path.join(runDir, "proposals.jsonl");
  const fromProposalLog = existsSync(proposalsPath) ? readJsonlObjects(proposalsPath).map((proposal) => ({
    ...proposal,
    sourceSurface: "proposals.jsonl"
  })) : [];
  if (fromProposalLog.length > 0) return fromProposalLog;
  return transitions
    .filter((transition) => isRecord(transition.consolidation))
    .map((transition) => ({
      ...(transition.consolidation as JsonRecord),
      runId: transition.runId,
      transitionId: transition.transitionId,
      tick: transition.tick,
      screen: transition.screen,
      floor: transition.floor,
      selectedAction: transition.selectedAction,
      sourceSurface: "transition.consolidation"
    }));
}

export function buildReplayConsolidationProposalSurface(proposals: unknown[]): ReplayConsolidationProposalSurface {
  const records = proposals.filter(isRecord);
  const surface: ReplayConsolidationProposalSurface = {
    proposals: records.length,
    fromProposalLog: records.filter((proposal) => proposal.sourceSurface === "proposals.jsonl").length,
    fromTransitions: records.filter((proposal) => proposal.sourceSurface === "transition.consolidation").length,
    statusCounts: {},
    targetLayerCounts: {},
    evidenceStrengthCounts: {},
    mutatingOrAccepted: 0,
    pendingReview: 0,
    groups: [],
    recurringGroups: 0,
    examples: []
  };
  const groups = new Map<string, ReplayConsolidationProposalGroup>();
  for (const proposal of records) {
    const status = typeof proposal.status === "string" ? proposal.status : "unknown";
    const targetLayer = typeof proposal.targetLayer === "string" ? proposal.targetLayer : "unknown";
    const evidenceStrength = typeof proposal.evidenceStrength === "string" ? proposal.evidenceStrength : "unknown";
    surface.statusCounts[status] = (surface.statusCounts[status] ?? 0) + 1;
    surface.targetLayerCounts[targetLayer] = (surface.targetLayerCounts[targetLayer] ?? 0) + 1;
    surface.evidenceStrengthCounts[evidenceStrength] = (surface.evidenceStrengthCounts[evidenceStrength] ?? 0) + 1;
    if (status === "accepted" || proposalStableMutation(proposal)) surface.mutatingOrAccepted += 1;
    if (status === "proposed") surface.pendingReview += 1;
    if (surface.examples.length < 5) {
      surface.examples.push({
        recordId: proposal.recordId,
        transitionId: proposal.transitionId,
        tick: proposal.tick,
        status,
        targetLayer,
        evidenceStrength,
        proposal: proposal.proposal,
        stableMutation: proposalStableMutation(proposal)
      });
    }
    addProposalToGroups(groups, proposal, status, targetLayer);
  }
  surface.groups = Array.from(groups.values())
    .map(finalizeProposalGroup)
    .sort((left, right) =>
      right.occurrences - left.occurrences ||
      strengthRank(right.evidenceStrength) - strengthRank(left.evidenceStrength) ||
      left.groupId.localeCompare(right.groupId)
    );
  surface.recurringGroups = surface.groups.filter((group) => group.occurrences >= 2).length;
  return surface;
}

export function readTransitionJsonl(filePath: string): TransitionRecord[] {
  if (!existsSync(filePath)) {
    throw new Error(`Transition log not found: ${filePath}`);
  }
  const lines = readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line, index) => {
    const parsed = JSON.parse(line) as TransitionRecord;
    if (!isRecord(parsed)) {
      throw new Error(`Transition line ${index + 1} is not an object`);
    }
    return assertGroundTruthInvariants(parsed);
  });
}

function readJsonlObjects(filePath: string): JsonRecord[] {
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

export function buildReplayTimeline(transitions: TransitionRecord[]): ReplayTimelineItem[] {
  return transitions.map((transition, index) => {
    const checkpoint = isRecord(transition.stateDiff) && isRecord(transition.stateDiff.checkpoint)
      ? transition.stateDiff.checkpoint
      : undefined;
    const checkpointKind = typeof checkpoint?.kind === "string" ? checkpoint.kind : undefined;
    return {
      index: index + 1,
      tick: transition.tick,
      timestamp: transition.timestamp,
      screen: transition.screen,
      floor: transition.floor,
      source: transition.source,
      captureMode: transition.captureMode,
      isGroundTruth: transition.isGroundTruth,
      selectedAction: transition.selectedAction,
      checkpointKind,
      summary: summarizeTransition(transition, checkpointKind)
    };
  });
}

export function buildReplayCognitiveCoverage(transitions: TransitionRecord[]): ReplayCognitiveCoverage {
  const coverage: ReplayCognitiveCoverage = {
    transitions: transitions.length,
    strategicImpression: 0,
    salienceSignals: 0,
    memoryActivation: 0,
    candidateFutures: 0,
    candidateFuturePredictionChecks: 0,
    derivedSnapshot: 0,
    derivedKnowledgeSummary: 0,
    deliberationPacket: 0,
    promptParity: 0,
    workspaceComparison: 0,
    workspaceReady: 0,
    workspaceProviderReady: 0,
    shadowWorkspaceDecision: 0,
    shadowWorkspaceCalled: 0,
    shadowWorkspaceSkipped: 0,
    shadowWorkspaceValid: 0,
    shadowWorkspaceInvalidOrError: 0,
    shadowWorkspaceAgreementCounts: {},
    shadowWorkspaceBudgetStatusCounts: {},
    predictionError: 0,
    replayFrame: 0,
    consolidation: 0,
    fullShadowScaffold: 0
  };
  for (const transition of transitions) {
    const hasStrategicImpression = isRecord(transition.strategicImpression);
    const hasSalienceSignals = Array.isArray(transition.salienceSignals) && transition.salienceSignals.length > 0;
    const hasMemoryActivation = isRecord(transition.memoryActivation);
    const hasCandidateFutures = Array.isArray(transition.candidateFutures) && transition.candidateFutures.length > 0;
    const hasCandidateFuturePredictionChecks = Array.isArray(transition.candidateFutures) &&
      transition.candidateFutures.some((future) => isRecord(future) && Array.isArray(future.predictionChecks) && future.predictionChecks.length > 0);
    const hasDerivedSnapshot = isRecord(transition.derivedSnapshot);
    const hasDeliberationPacket = isRecord(transition.deliberationPacket);
    const hasDerivedKnowledgeSummary = hasDeliberationPacket && isRecord(transition.deliberationPacket?.derivedKnowledgeSummary);
    const hasPromptParity = isRecord(transition.promptParity) || (hasDeliberationPacket && isRecord(transition.deliberationPacket?.promptParity));
    const hasWorkspaceComparison = isRecord(transition.workspaceComparison);
    const hasWorkspaceReady = hasWorkspaceComparison && transition.workspaceComparison?.gatedReadiness === "ready";
    const hasWorkspaceProviderReady = hasWorkspaceComparison && transition.workspaceComparison?.providerReadiness === "ready_for_shadow_call";
    const hasShadowWorkspaceDecision = isRecord(transition.shadowWorkspaceDecision);
    const hasShadowWorkspaceCalled = hasShadowWorkspaceDecision && transition.shadowWorkspaceDecision?.called === true;
    const hasShadowWorkspaceSkipped = hasShadowWorkspaceDecision && transition.shadowWorkspaceDecision?.outcome === "skipped";
    const shadowOutcome = hasShadowWorkspaceDecision && typeof transition.shadowWorkspaceDecision?.outcome === "string"
      ? transition.shadowWorkspaceDecision.outcome
      : undefined;
    const hasPredictionError = isRecord(transition.predictionError);
    const hasReplayFrame = isRecord(transition.replayFrame);
    const hasConsolidation = isRecord(transition.consolidation);
    if (hasStrategicImpression) coverage.strategicImpression += 1;
    if (hasSalienceSignals) coverage.salienceSignals += 1;
    if (hasMemoryActivation) coverage.memoryActivation += 1;
    if (hasCandidateFutures) coverage.candidateFutures += 1;
    if (hasCandidateFuturePredictionChecks) coverage.candidateFuturePredictionChecks += 1;
    if (hasDerivedSnapshot) coverage.derivedSnapshot += 1;
    if (hasDerivedKnowledgeSummary) coverage.derivedKnowledgeSummary += 1;
    if (hasDeliberationPacket) coverage.deliberationPacket += 1;
    if (hasPromptParity) coverage.promptParity += 1;
    if (hasWorkspaceComparison) coverage.workspaceComparison += 1;
    if (hasWorkspaceReady) coverage.workspaceReady += 1;
    if (hasWorkspaceProviderReady) coverage.workspaceProviderReady += 1;
    if (hasShadowWorkspaceDecision) coverage.shadowWorkspaceDecision += 1;
    if (hasShadowWorkspaceCalled) coverage.shadowWorkspaceCalled += 1;
    if (hasShadowWorkspaceSkipped) coverage.shadowWorkspaceSkipped += 1;
    if (shadowOutcome === "valid") coverage.shadowWorkspaceValid += 1;
    if (shadowOutcome === "invalid_output" || shadowOutcome === "invalid_choice" || shadowOutcome === "error") {
      coverage.shadowWorkspaceInvalidOrError += 1;
    }
    if (hasShadowWorkspaceDecision && typeof transition.shadowWorkspaceDecision?.agreement === "string") {
      const agreement = transition.shadowWorkspaceDecision.agreement;
      coverage.shadowWorkspaceAgreementCounts[agreement] = (coverage.shadowWorkspaceAgreementCounts[agreement] ?? 0) + 1;
    }
    if (hasWorkspaceComparison && isRecord(transition.workspaceComparison?.budget) && typeof transition.workspaceComparison.budget.status === "string") {
      const status = transition.workspaceComparison.budget.status;
      coverage.shadowWorkspaceBudgetStatusCounts[status] = (coverage.shadowWorkspaceBudgetStatusCounts[status] ?? 0) + 1;
    }
    if (!hasWorkspaceComparison && hasShadowWorkspaceDecision && typeof transition.shadowWorkspaceDecision?.budgetStatus === "string") {
      const status = transition.shadowWorkspaceDecision.budgetStatus;
      coverage.shadowWorkspaceBudgetStatusCounts[status] = (coverage.shadowWorkspaceBudgetStatusCounts[status] ?? 0) + 1;
    }
    if (hasPredictionError) coverage.predictionError += 1;
    if (hasReplayFrame) coverage.replayFrame += 1;
    if (hasConsolidation) coverage.consolidation += 1;
    if (hasStrategicImpression && hasSalienceSignals && hasMemoryActivation && hasCandidateFutures && hasDeliberationPacket) {
      coverage.fullShadowScaffold += 1;
    }
  }
  return coverage;
}

export function buildReplayFreshShadowSlices(transitions: TransitionRecord[]): ReplayFreshShadowSlices {
  const latestRevisionTag = latestShadowRevisionTag(transitions);
  const shadowTransitions = transitions.filter((transition) => isRecord(transition.shadowWorkspaceDecision));
  return {
    last5: buildReplayShadowSliceStats("last5", shadowTransitions.slice(-5)),
    last20: buildReplayShadowSliceStats("last20", shadowTransitions.slice(-20)),
    last50: buildReplayShadowSliceStats("last50", shadowTransitions.slice(-50)),
    sinceLatestRevision: buildReplayShadowSliceStats(
      latestRevisionTag ? `since:${latestRevisionTag}` : "since:unversioned",
      latestRevisionTag
        ? shadowTransitions.filter((transition) => shadowRevisionTag(transition) === latestRevisionTag)
        : shadowTransitions,
      latestRevisionTag
    )
  };
}

export function buildReplayFocusedShadowSlices(transitions: TransitionRecord[]): ReplayFocusedShadowSlices {
  return {
    combatLiveEligibleFresh: buildReplayFocusedShadowSlice(transitions, "combat:llm_required")
  };
}

export function buildReplayShadowSliceStats(
  label: string,
  transitions: TransitionRecord[],
  revisionTag?: string
): ReplayShadowSliceStats {
  const stats: ReplayShadowSliceStats = {
    label,
    revisionTag,
    transitions: transitions.length,
    shadowRecords: 0,
    plannedShadowCalls: 0,
    maxObservedShadowCallsUsed: 0,
    called: 0,
    liveEligibleCalled: 0,
    valid: 0,
    liveEligibleValid: 0,
    invalidOutput: 0,
    liveEligibleInvalidOutput: 0,
    nonLiveInvalidOutput: 0,
    invalidChoice: 0,
    liveEligibleInvalidChoice: 0,
    error: 0,
    liveEligibleError: 0,
    unavailable: 0,
    skipped: 0,
    missingCandidate: 0,
    liveEligibleMissingCandidate: 0,
    agreementCounts: {},
    reasonQualityCounts: {},
    reasonQualityNoteCounts: {},
    budgetStatusCounts: {},
    governanceProfileCounts: {},
    recoveryPolicyCounts: {},
    recoveryOutputCapRelationCounts: {},
    invalidBucketCounts: {},
    failureCategoryCounts: {},
    failureBucketCounts: {},
    providerModeCounts: {},
    ablationModeCounts: {},
    compressionModeCounts: {},
    finishReasonCounts: {},
    cleanupReasonCounts: {},
    outputCapHits: 0,
    retryCount: 0,
    retriedCalls: 0,
    retrySuccessCount: 0,
    averageWorkspacePromptBytes: 0,
    averageWorkspacePromptTokens: 0,
    workspacePromptSamples: 0,
    averageWorkspaceBytesBefore: 0,
    averageWorkspaceBytesAfter: 0,
    averageWorkspaceTokensBefore: 0,
    averageWorkspaceTokensAfter: 0,
    averageCandidateFuturesBytesBefore: 0,
    averageCandidateFuturesBytesAfter: 0,
    averageCandidateFuturesTokensBefore: 0,
    averageCandidateFuturesTokensAfter: 0,
    sizeTelemetrySamples: 0,
    futuresTruncated: 0,
    futuresOmitted: 0,
    truncatedFieldCounts: {},
    averageInformationPreservationEstimate: 0,
    informationPreservationEstimateSamples: 0,
    largestFieldSourceBytes: {},
    repeatedTextBytes: 0,
    repeatedTextCount: 0,
    estimatedCostUsd: 0,
    actualOrEstimatedCostUsd: 0,
    skippedBudgetEstimatedCostUsd: 0,
    averageLatencyMs: 0,
    latencySamples: 0,
    totalActualInputTokens: 0,
    totalActualOutputTokens: 0,
    totalActualTokens: 0,
    revisionTagCounts: {},
    plannedShadowCallValueCounts: {},
    mixedRevisionWindow: false,
    mixedBudgetWindow: false,
    gate: {
      status: "no_go",
      reasons: ["no_shadow_records"]
    }
  };
  for (const transition of transitions) {
    if (!isRecord(transition.shadowWorkspaceDecision)) continue;
    stats.shadowRecords += 1;
    const shadow = transition.shadowWorkspaceDecision;
    const liveEligible = shadowLiveEligible(transition);
    if (shadow.called === true) stats.called += 1;
    if (shadow.called === true && liveEligible) stats.liveEligibleCalled += 1;
    const outcome = typeof shadow.outcome === "string" ? shadow.outcome : "unknown";
    if (outcome === "valid") {
      stats.valid += 1;
      if (liveEligible) stats.liveEligibleValid += 1;
    }
    if (outcome === "invalid_output") {
      stats.invalidOutput += 1;
      if (liveEligible) {
        stats.liveEligibleInvalidOutput += 1;
      } else {
        stats.nonLiveInvalidOutput += 1;
      }
    }
    if (outcome === "invalid_choice") {
      stats.invalidChoice += 1;
      if (liveEligible) stats.liveEligibleInvalidChoice += 1;
    }
    if (outcome === "error") {
      stats.error += 1;
      if (liveEligible) stats.liveEligibleError += 1;
    }
    if (outcome === "unavailable") stats.unavailable += 1;
    if (outcome === "skipped") stats.skipped += 1;
    const agreement = typeof shadow.agreement === "string" ? shadow.agreement : "unknown";
    stats.agreementCounts[agreement] = (stats.agreementCounts[agreement] ?? 0) + 1;
    if (agreement === "missing_candidate") stats.missingCandidate += 1;
    if (agreement === "missing_candidate" && liveEligible) stats.liveEligibleMissingCandidate += 1;
    if (typeof shadow.reasonQuality === "string") {
      stats.reasonQualityCounts[shadow.reasonQuality] = (stats.reasonQualityCounts[shadow.reasonQuality] ?? 0) + 1;
    }
    if (Array.isArray(shadow.reasonQualityNotes)) {
      for (const note of shadow.reasonQualityNotes.map(String)) {
        stats.reasonQualityNoteCounts[note] = (stats.reasonQualityNoteCounts[note] ?? 0) + 1;
      }
    }
    if (typeof shadow.failureCategory === "string") {
      stats.failureCategoryCounts[shadow.failureCategory] = (stats.failureCategoryCounts[shadow.failureCategory] ?? 0) + 1;
    }
    if (typeof shadow.failureBucket === "string") {
      stats.failureBucketCounts[shadow.failureBucket] = (stats.failureBucketCounts[shadow.failureBucket] ?? 0) + 1;
    }
    if (typeof shadow.providerMode === "string") {
      stats.providerModeCounts[shadow.providerMode] = (stats.providerModeCounts[shadow.providerMode] ?? 0) + 1;
    }
    if (typeof shadow.ablationMode === "string") {
      stats.ablationModeCounts[shadow.ablationMode] = (stats.ablationModeCounts[shadow.ablationMode] ?? 0) + 1;
    }
    const coverage = isRecord(transition.workspaceComparison) && isRecord(transition.workspaceComparison.coverage)
      ? transition.workspaceComparison.coverage
      : undefined;
    if (typeof coverage?.compressionMode === "string") {
      stats.compressionModeCounts[coverage.compressionMode] = (stats.compressionModeCounts[coverage.compressionMode] ?? 0) + 1;
    }
    const revisionTag = shadowRevisionTag(transition);
    if (revisionTag) {
      stats.revisionTagCounts[revisionTag] = (stats.revisionTagCounts[revisionTag] ?? 0) + 1;
    }
    if (typeof shadow.budgetStatus === "string") {
      stats.budgetStatusCounts[shadow.budgetStatus] = (stats.budgetStatusCounts[shadow.budgetStatus] ?? 0) + 1;
    }
    const governanceProfile = workspaceGovernanceProfile(transition);
    if (governanceProfile) {
      stats.governanceProfileCounts[governanceProfile] = (stats.governanceProfileCounts[governanceProfile] ?? 0) + 1;
    }
    const recoveryPolicyName = typeof shadow.providerRecoveryPolicyName === "string"
      ? shadow.providerRecoveryPolicyName
      : isRecord(shadow.providerRecoveryPolicy) && typeof shadow.providerRecoveryPolicy.policyName === "string"
        ? shadow.providerRecoveryPolicy.policyName
        : undefined;
    if (recoveryPolicyName) {
      stats.recoveryPolicyCounts[recoveryPolicyName] = (stats.recoveryPolicyCounts[recoveryPolicyName] ?? 0) + 1;
    }
    const recoveryOutputCapRelation = isRecord(shadow.providerRecoveryPolicy) &&
        typeof shadow.providerRecoveryPolicy.rescueOutputCapRelation === "string"
      ? shadow.providerRecoveryPolicy.rescueOutputCapRelation
      : undefined;
    if (recoveryOutputCapRelation) {
      stats.recoveryOutputCapRelationCounts[recoveryOutputCapRelation] = (stats.recoveryOutputCapRelationCounts[recoveryOutputCapRelation] ?? 0) + 1;
    }
    const finishReason = typeof shadow.providerFinishReason === "string" ? shadow.providerFinishReason : undefined;
    if (finishReason) {
      stats.finishReasonCounts[finishReason] = (stats.finishReasonCounts[finishReason] ?? 0) + 1;
    }
    if (typeof shadow.providerCleanupReason === "string") {
      stats.cleanupReasonCounts[shadow.providerCleanupReason] = (stats.cleanupReasonCounts[shadow.providerCleanupReason] ?? 0) + 1;
    }
    if (shadowOutputCapHit(shadow)) stats.outputCapHits += 1;
    const plannedShadowCalls = isRecord(transition.workspaceComparison) && isRecord(transition.workspaceComparison.budget) &&
        typeof transition.workspaceComparison.budget.maxShadowCalls === "number"
      ? transition.workspaceComparison.budget.maxShadowCalls
      : undefined;
    if (typeof plannedShadowCalls === "number") {
      stats.plannedShadowCalls = Math.max(stats.plannedShadowCalls, plannedShadowCalls);
      const key = String(plannedShadowCalls);
      stats.plannedShadowCallValueCounts[key] = (stats.plannedShadowCallValueCounts[key] ?? 0) + 1;
    }
    const observedShadowCallsUsed = isRecord(transition.workspaceComparison) && isRecord(transition.workspaceComparison.budget) &&
        typeof transition.workspaceComparison.budget.shadowCallsUsed === "number"
      ? transition.workspaceComparison.budget.shadowCallsUsed
      : undefined;
    if (typeof observedShadowCallsUsed === "number") {
      stats.maxObservedShadowCallsUsed = Math.max(stats.maxObservedShadowCallsUsed, observedShadowCallsUsed);
    }
    if (typeof shadow.retryCount === "number") {
      stats.retryCount += shadow.retryCount;
      if (shadow.retryCount > 0) stats.retriedCalls += 1;
    }
    if (shadow.emptyContentRetrySucceeded === true || shadow.truncationRetrySucceeded === true) {
      stats.retrySuccessCount += 1;
    }
    if (typeof shadow.workspacePromptBytes === "number") {
      stats.averageWorkspacePromptBytes += shadow.workspacePromptBytes;
      stats.workspacePromptSamples += 1;
    } else if (isRecord(transition.workspaceComparison) && typeof transition.workspaceComparison.structuredPromptBytes === "number") {
      stats.averageWorkspacePromptBytes += transition.workspaceComparison.structuredPromptBytes;
      stats.workspacePromptSamples += 1;
    }
    if (typeof shadow.workspacePromptTokens === "number") {
      stats.averageWorkspacePromptTokens += shadow.workspacePromptTokens;
    } else if (isRecord(transition.workspaceComparison) && typeof transition.workspaceComparison.structuredTokenEstimate === "number") {
      stats.averageWorkspacePromptTokens += transition.workspaceComparison.structuredTokenEstimate;
    }
    if (coverage) {
      const beforeBytes = typeof coverage.workspaceBytesBefore === "number" ? coverage.workspaceBytesBefore : undefined;
      const afterBytes = typeof coverage.workspaceBytesAfter === "number" ? coverage.workspaceBytesAfter : undefined;
      const beforeTokens = typeof coverage.workspaceTokensBefore === "number" ? coverage.workspaceTokensBefore : undefined;
      const afterTokens = typeof coverage.workspaceTokensAfter === "number" ? coverage.workspaceTokensAfter : undefined;
      const futureBytesBefore = typeof coverage.candidateFuturesBytesBefore === "number" ? coverage.candidateFuturesBytesBefore : undefined;
      const futureBytesAfter = typeof coverage.candidateFuturesBytesAfter === "number" ? coverage.candidateFuturesBytesAfter : undefined;
      const futureTokensBefore = typeof coverage.candidateFuturesTokensBefore === "number" ? coverage.candidateFuturesTokensBefore : undefined;
      const futureTokensAfter = typeof coverage.candidateFuturesTokensAfter === "number" ? coverage.candidateFuturesTokensAfter : undefined;
      if (
        beforeBytes !== undefined &&
        afterBytes !== undefined &&
        beforeTokens !== undefined &&
        afterTokens !== undefined &&
        futureBytesBefore !== undefined &&
        futureBytesAfter !== undefined &&
        futureTokensBefore !== undefined &&
        futureTokensAfter !== undefined
      ) {
        stats.averageWorkspaceBytesBefore += beforeBytes;
        stats.averageWorkspaceBytesAfter += afterBytes;
        stats.averageWorkspaceTokensBefore += beforeTokens;
        stats.averageWorkspaceTokensAfter += afterTokens;
        stats.averageCandidateFuturesBytesBefore += futureBytesBefore;
        stats.averageCandidateFuturesBytesAfter += futureBytesAfter;
        stats.averageCandidateFuturesTokensBefore += futureTokensBefore;
        stats.averageCandidateFuturesTokensAfter += futureTokensAfter;
        stats.sizeTelemetrySamples += 1;
      }
      if (typeof coverage.futuresTruncated === "number") stats.futuresTruncated += coverage.futuresTruncated;
      if (typeof coverage.futuresOmitted === "number") stats.futuresOmitted += coverage.futuresOmitted;
      if (isRecord(coverage.truncatedFields)) {
        for (const [key, value] of Object.entries(coverage.truncatedFields)) {
          if (typeof value === "number") {
            stats.truncatedFieldCounts[key] = (stats.truncatedFieldCounts[key] ?? 0) + value;
          }
        }
      }
      if (typeof coverage.informationPreservationEstimate === "number") {
        stats.averageInformationPreservationEstimate += coverage.informationPreservationEstimate;
        stats.informationPreservationEstimateSamples += 1;
      }
      if (isRecord(coverage.largestFieldSources)) {
        for (const [key, value] of Object.entries(coverage.largestFieldSources)) {
          if (typeof value === "number") {
            stats.largestFieldSourceBytes[key] = (stats.largestFieldSourceBytes[key] ?? 0) + value;
          }
        }
      }
      if (typeof coverage.repeatedTextBytes === "number") stats.repeatedTextBytes += coverage.repeatedTextBytes;
      if (typeof coverage.repeatedTextCount === "number") stats.repeatedTextCount += coverage.repeatedTextCount;
    }
    if (outcome === "invalid_output" || outcome === "invalid_choice" || outcome === "error") {
      const invalidBucket = [
        typeof shadow.providerParseState === "string" ? shadow.providerParseState : undefined,
        typeof shadow.providerOutputKind === "string" ? shadow.providerOutputKind : undefined,
        typeof shadow.validationError === "string" ? shadow.validationError : undefined,
        typeof shadow.error === "string" ? shadow.error : undefined,
        outcome
      ].find((value) => typeof value === "string" && value.length > 0) ?? "unknown";
      stats.invalidBucketCounts[invalidBucket] = (stats.invalidBucketCounts[invalidBucket] ?? 0) + 1;
    }
    if (typeof shadow.estimatedCostUsd === "number") {
      if (shadow.called === true) {
        stats.actualOrEstimatedCostUsd += shadow.estimatedCostUsd;
      } else {
        stats.skippedBudgetEstimatedCostUsd += shadow.estimatedCostUsd;
      }
      stats.estimatedCostUsd += shadow.estimatedCostUsd;
    } else if (isRecord(transition.workspaceComparison) && isRecord(transition.workspaceComparison.budget) && typeof transition.workspaceComparison.budget.estimatedCostUsd === "number") {
      stats.estimatedCostUsd += transition.workspaceComparison.budget.estimatedCostUsd;
    }
    if (typeof shadow.latencyMs === "number") {
      stats.averageLatencyMs += shadow.latencyMs;
      stats.latencySamples += 1;
    }
    if (typeof shadow.actualInputTokens === "number") stats.totalActualInputTokens += shadow.actualInputTokens;
    if (typeof shadow.actualOutputTokens === "number") stats.totalActualOutputTokens += shadow.actualOutputTokens;
    if (typeof shadow.actualTotalTokens === "number") stats.totalActualTokens += shadow.actualTotalTokens;
  }
  stats.estimatedCostUsd = Number(stats.estimatedCostUsd.toFixed(6));
  stats.actualOrEstimatedCostUsd = Number(stats.actualOrEstimatedCostUsd.toFixed(6));
  stats.skippedBudgetEstimatedCostUsd = Number(stats.skippedBudgetEstimatedCostUsd.toFixed(6));
  stats.averageLatencyMs = stats.latencySamples > 0 ? Number((stats.averageLatencyMs / stats.latencySamples).toFixed(1)) : 0;
  stats.averageWorkspacePromptBytes = stats.workspacePromptSamples > 0 ? Number((stats.averageWorkspacePromptBytes / stats.workspacePromptSamples).toFixed(1)) : 0;
  stats.averageWorkspacePromptTokens = stats.workspacePromptSamples > 0 ? Number((stats.averageWorkspacePromptTokens / stats.workspacePromptSamples).toFixed(1)) : 0;
  stats.averageWorkspaceBytesBefore = stats.sizeTelemetrySamples > 0 ? Number((stats.averageWorkspaceBytesBefore / stats.sizeTelemetrySamples).toFixed(1)) : 0;
  stats.averageWorkspaceBytesAfter = stats.sizeTelemetrySamples > 0 ? Number((stats.averageWorkspaceBytesAfter / stats.sizeTelemetrySamples).toFixed(1)) : 0;
  stats.averageWorkspaceTokensBefore = stats.sizeTelemetrySamples > 0 ? Number((stats.averageWorkspaceTokensBefore / stats.sizeTelemetrySamples).toFixed(1)) : 0;
  stats.averageWorkspaceTokensAfter = stats.sizeTelemetrySamples > 0 ? Number((stats.averageWorkspaceTokensAfter / stats.sizeTelemetrySamples).toFixed(1)) : 0;
  stats.averageCandidateFuturesBytesBefore = stats.sizeTelemetrySamples > 0 ? Number((stats.averageCandidateFuturesBytesBefore / stats.sizeTelemetrySamples).toFixed(1)) : 0;
  stats.averageCandidateFuturesBytesAfter = stats.sizeTelemetrySamples > 0 ? Number((stats.averageCandidateFuturesBytesAfter / stats.sizeTelemetrySamples).toFixed(1)) : 0;
  stats.averageCandidateFuturesTokensBefore = stats.sizeTelemetrySamples > 0 ? Number((stats.averageCandidateFuturesTokensBefore / stats.sizeTelemetrySamples).toFixed(1)) : 0;
  stats.averageCandidateFuturesTokensAfter = stats.sizeTelemetrySamples > 0 ? Number((stats.averageCandidateFuturesTokensAfter / stats.sizeTelemetrySamples).toFixed(1)) : 0;
  stats.averageInformationPreservationEstimate = stats.informationPreservationEstimateSamples > 0
    ? Number((stats.averageInformationPreservationEstimate / stats.informationPreservationEstimateSamples).toFixed(3))
    : 0;
  stats.mixedRevisionWindow = Object.keys(stats.revisionTagCounts).length > 1;
  stats.mixedBudgetWindow = Object.keys(stats.plannedShadowCallValueCounts).length > 1;
  stats.gate = buildReplayShadowSliceGate(stats);
  return stats;
}

export function formatReplayCognitiveCoverage(coverage: ReplayCognitiveCoverage): string {
  const total = Math.max(1, coverage.transitions);
  const item = (label: string, value: number): string => `${label}=${value}/${coverage.transitions} (${((value / total) * 100).toFixed(1)}%)`;
  return [
    item("strategicImpression", coverage.strategicImpression),
    item("salienceSignals", coverage.salienceSignals),
    item("memoryActivation", coverage.memoryActivation),
    item("candidateFutures", coverage.candidateFutures),
    item("candidateFuturePredictionChecks", coverage.candidateFuturePredictionChecks),
    item("derivedSnapshot", coverage.derivedSnapshot),
    item("derivedKnowledgeSummary", coverage.derivedKnowledgeSummary),
    item("deliberationPacket", coverage.deliberationPacket),
    item("promptParity", coverage.promptParity),
    item("workspaceComparison", coverage.workspaceComparison),
    item("workspaceReady", coverage.workspaceReady),
    item("workspaceProviderReady", coverage.workspaceProviderReady),
    item("shadowWorkspaceDecision", coverage.shadowWorkspaceDecision),
    item("shadowWorkspaceCalled", coverage.shadowWorkspaceCalled),
    item("shadowWorkspaceSkipped", coverage.shadowWorkspaceSkipped),
    item("shadowWorkspaceValid", coverage.shadowWorkspaceValid),
    item("shadowWorkspaceInvalidOrError", coverage.shadowWorkspaceInvalidOrError),
    `shadowWorkspaceAgreement=${JSON.stringify(coverage.shadowWorkspaceAgreementCounts)}`,
    `shadowWorkspaceBudget=${JSON.stringify(coverage.shadowWorkspaceBudgetStatusCounts)}`,
    item("predictionError", coverage.predictionError),
    item("replayFrame", coverage.replayFrame),
    item("consolidation", coverage.consolidation),
    item("fullShadowScaffold", coverage.fullShadowScaffold)
  ].join(", ");
}

export function formatReplayFreshShadowSlices(slices: ReplayFreshShadowSlices): string {
  return [
    formatReplayShadowSliceStats(slices.last5),
    formatReplayShadowSliceStats(slices.last20),
    formatReplayShadowSliceStats(slices.last50),
    formatReplayShadowSliceStats(slices.sinceLatestRevision)
  ].join(" | ");
}

export function formatReplayFocusedShadowSlices(slices: ReplayFocusedShadowSlices): string {
  return [formatReplayFocusedShadowSlice(slices.combatLiveEligibleFresh)].join(" | ");
}

export function formatReplayShadowSliceStats(stats: ReplayShadowSliceStats): string {
  return [
    `${stats.label}`,
    `called=${stats.called}`,
    `liveEligibleCalled=${stats.liveEligibleCalled}`,
    `valid=${stats.valid}`,
    `liveEligibleValid=${stats.liveEligibleValid}`,
    `invalid=${stats.invalidOutput + stats.invalidChoice}`,
    `liveEligibleInvalid=${stats.liveEligibleInvalidOutput + stats.liveEligibleInvalidChoice}`,
    `nonLiveInvalid=${stats.nonLiveInvalidOutput}`,
    `error=${stats.error}`,
    `liveEligibleError=${stats.liveEligibleError}`,
    `missingCandidate=${stats.missingCandidate}`,
    `liveEligibleMissingCandidate=${stats.liveEligibleMissingCandidate}`,
    `ablation=${JSON.stringify(stats.ablationModeCounts)}`,
    `compression=${JSON.stringify(stats.compressionModeCounts)}`,
    `governance=${JSON.stringify(stats.governanceProfileCounts)}`,
    `recovery=${JSON.stringify(stats.recoveryPolicyCounts)}`,
    `recoveryCap=${JSON.stringify(stats.recoveryOutputCapRelationCounts)}`,
    `failureCategory=${JSON.stringify(stats.failureCategoryCounts)}`,
    `failureBucket=${JSON.stringify(stats.failureBucketCounts)}`,
    `modes=${JSON.stringify(stats.providerModeCounts)}`,
    `finishReason=${JSON.stringify(stats.finishReasonCounts)}`,
    `cleanup=${JSON.stringify(stats.cleanupReasonCounts)}`,
    `outputCapHits=${stats.outputCapHits}`,
    `workspaceTokensAvg=${stats.averageWorkspacePromptTokens}`,
    `workspaceSize=${stats.averageWorkspaceBytesBefore}->${stats.averageWorkspaceBytesAfter}B/${stats.averageWorkspaceTokensBefore}->${stats.averageWorkspaceTokensAfter}tok`,
    `candidateFuturesSize=${stats.averageCandidateFuturesBytesBefore}->${stats.averageCandidateFuturesBytesAfter}B/${stats.averageCandidateFuturesTokensBefore}->${stats.averageCandidateFuturesTokensAfter}tok`,
    `futureTrim=${stats.futuresTruncated}`,
    `futureOmit=${stats.futuresOmitted}`,
    `fieldTrim=${JSON.stringify(stats.truncatedFieldCounts)}`,
    `fieldBytes=${JSON.stringify(stats.largestFieldSourceBytes)}`,
    `repeatedText=${stats.repeatedTextBytes}B/${stats.repeatedTextCount}`,
    `preserve=${stats.averageInformationPreservationEstimate}`,
    `costCalled=${stats.actualOrEstimatedCostUsd}`,
    `costSkipped=${stats.skippedBudgetEstimatedCostUsd}`,
    `retries=${stats.retryCount}/${stats.retrySuccessCount}`,
    `mixedRevision=${stats.mixedRevisionWindow}`,
    `mixedBudget=${stats.mixedBudgetWindow}`,
    `invalidBuckets=${JSON.stringify(stats.invalidBucketCounts)}`,
    `thinReasons=${JSON.stringify(stats.reasonQualityNoteCounts)}`,
    `gate=${stats.gate.status}`,
    `reasons=${JSON.stringify(stats.gate.reasons)}`
  ].join(" ");
}

export function formatReplayFocusedShadowSlice(slice: ReplayFocusedShadowSlice): string {
  return [
    slice.label,
    `decisionClass=${slice.decisionClass}`,
    `revision=${slice.revisionTag ?? "unversioned"}`,
    `plannedShadowCalls=${slice.plannedShadowCalls ?? "unknown"}`,
    `samples=${slice.transitionIds.length}`,
    `ids=${JSON.stringify(slice.transitionIds)}`,
    formatReplayShadowSliceStats(slice.stats)
  ].join(" ");
}

export function formatReplayConsolidationProposalSurface(surface: ReplayConsolidationProposalSurface): string {
  return [
    `proposals=${surface.proposals}`,
    `pendingReview=${surface.pendingReview}`,
    `mutatingOrAccepted=${surface.mutatingOrAccepted}`,
    `groups=${surface.groups.length}`,
    `recurringGroups=${surface.recurringGroups}`,
    `status=${JSON.stringify(surface.statusCounts)}`,
    `targetLayer=${JSON.stringify(surface.targetLayerCounts)}`,
    `evidenceStrength=${JSON.stringify(surface.evidenceStrengthCounts)}`
  ].join(", ");
}

export function formatReplayTimeline(items: ReplayTimelineItem[]): string {
  if (items.length === 0) {
    return "No transitions found.";
  }
  return items
    .map((item) => {
      const floor = item.floor === undefined ? "?" : String(item.floor);
      return [
        `#${item.index}`,
        `tick=${item.tick}`,
        `floor=${floor}`,
        `screen=${item.screen}`,
        `mode=${item.captureMode}`,
        `gt=${item.isGroundTruth}`,
        `checkpoint=${item.checkpointKind ?? "unknown"}`,
        `action=${shortAction(item.selectedAction)}`
      ].join(" ");
    })
    .join("\n");
}

export function resolveRunDir(runIdOrPath?: string, runsRoot = path.join(agentRoot, "data", "runs")): string {
  if (runIdOrPath && (path.isAbsolute(runIdOrPath) || runIdOrPath.includes(path.sep) || runIdOrPath.startsWith("."))) {
    return path.resolve(runIdOrPath);
  }
  if (runIdOrPath) {
    return path.join(runsRoot, runIdOrPath);
  }
  return latestRunDir(runsRoot);
}

function latestRunDir(runsRoot: string): string {
  if (!existsSync(runsRoot)) {
    throw new Error(`No run directory exists yet: ${runsRoot}`);
  }
  const dirs = readdirSync(runsRoot)
    .map((name) => path.join(runsRoot, name))
    .filter((entry) => statSync(entry).isDirectory())
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (dirs.length === 0) {
    throw new Error(`No runs found under: ${runsRoot}`);
  }
  return dirs[0];
}

function summarizeTransition(transition: TransitionRecord, checkpointKind?: string): string {
  return [
    `tick=${transition.tick}`,
    `screen=${transition.screen}`,
    `action=${shortAction(transition.selectedAction)}`,
    `checkpoint=${checkpointKind ?? "unknown"}`
  ].join(" ");
}

function buildReplayShadowSliceGate(stats: ReplayShadowSliceStats): ReplayShadowSliceStats["gate"] {
  const reasons: string[] = [];
  const mixedWindow = stats.mixedRevisionWindow || stats.mixedBudgetWindow;
  const callBudgetReachedPlannedSample = (stats.budgetStatusCounts.call_budget_exceeded ?? 0) > 0 &&
    stats.plannedShadowCalls > 0 &&
    (stats.called >= stats.plannedShadowCalls || stats.maxObservedShadowCallsUsed >= stats.plannedShadowCalls);
  if (stats.called === 0) reasons.push("no_real_shadow_calls");
  if (stats.liveEligibleCalled === 0) reasons.push("no_live_eligible_shadow_calls");
  if (stats.liveEligibleValid === 0) reasons.push("no_valid_live_eligible_shadow_decisions");
  if (stats.liveEligibleInvalidOutput > 0) reasons.push("live_eligible_invalid_output_present");
  if (stats.liveEligibleInvalidChoice > 0) reasons.push("live_eligible_invalid_choice_present");
  if (stats.liveEligibleError > 0) reasons.push("live_eligible_shadow_error_present");
  if (stats.liveEligibleMissingCandidate > 0) reasons.push("live_eligible_missing_candidate_present");
  if ((stats.budgetStatusCounts.token_budget_exceeded ?? 0) > 0) reasons.push("token_budget_exceeded");
  if ((stats.budgetStatusCounts.call_budget_exceeded ?? 0) > 0 && !callBudgetReachedPlannedSample && !mixedWindow) {
    reasons.push("call_budget_exceeded_before_planned_sample");
  }
  if ((stats.budgetStatusCounts.cost_budget_exceeded ?? 0) > 0) reasons.push("cost_budget_exceeded");
  if ((stats.reasonQualityCounts.missing ?? 0) > 0) reasons.push("missing_reason_quality");
  return {
    status: reasons.length === 0 ? "go" : "no_go",
    reasons
  };
}

function latestShadowRevisionTag(transitions: TransitionRecord[]): string | undefined {
  for (let index = transitions.length - 1; index >= 0; index -= 1) {
    const revisionTag = shadowRevisionTag(transitions[index]);
    if (revisionTag) return revisionTag;
  }
  return undefined;
}

function buildReplayFocusedShadowSlice(
  transitions: TransitionRecord[],
  decisionClass: string
): ReplayFocusedShadowSlice {
  const latestMatching = [...transitions].reverse().find((transition) => isFocusedShadowSliceTransition(transition, decisionClass));
  const revisionTag = latestMatching ? shadowRevisionTag(latestMatching) : latestShadowRevisionTag(transitions);
  const plannedShadowCalls = latestMatching ? workspacePlannedShadowCalls(latestMatching) : undefined;
  const filtered = transitions.filter((transition) =>
    isFocusedShadowSliceTransition(transition, decisionClass) &&
    (revisionTag ? shadowRevisionTag(transition) === revisionTag : true) &&
    (plannedShadowCalls !== undefined ? workspacePlannedShadowCalls(transition) === plannedShadowCalls : true)
  );
  const window = filtered.slice(-5);
  return {
    label: `${decisionClass}:fresh_live_eligible`,
    decisionClass,
    revisionTag,
    plannedShadowCalls,
    transitionIds: window.map((transition) => transition.transitionId),
    ticks: window.map((transition) => transition.tick),
    stats: buildReplayShadowSliceStats(`${decisionClass}:fresh_live_eligible`, window, revisionTag)
  };
}

function shadowRevisionTag(transition: TransitionRecord): string | undefined {
  if (isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.revisionTag === "string") {
    return transition.shadowWorkspaceDecision.revisionTag;
  }
  if (isRecord(transition.workspaceComparison) && typeof transition.workspaceComparison.revisionTag === "string") {
    return transition.workspaceComparison.revisionTag;
  }
  return undefined;
}

function workspacePlannedShadowCalls(transition: TransitionRecord): number | undefined {
  return isRecord(transition.workspaceComparison) &&
      isRecord(transition.workspaceComparison.budget) &&
      typeof transition.workspaceComparison.budget.maxShadowCalls === "number"
    ? transition.workspaceComparison.budget.maxShadowCalls
    : undefined;
}

function decisionClassForTransition(transition: TransitionRecord): string | undefined {
  if (isRecord(transition.workspaceComparison) && typeof transition.workspaceComparison.decisionClass === "string") {
    return transition.workspaceComparison.decisionClass;
  }
  if (isRecord(transition.shadowWorkspaceDecision) && typeof transition.shadowWorkspaceDecision.decisionClass === "string") {
    return transition.shadowWorkspaceDecision.decisionClass;
  }
  return undefined;
}

function isFocusedShadowSliceTransition(transition: TransitionRecord, decisionClass: string): boolean {
  if (!isRecord(transition.shadowWorkspaceDecision) || transition.shadowWorkspaceDecision.called !== true) return false;
  if (!shadowLiveEligible(transition)) return false;
  return decisionClassForTransition(transition) === decisionClass;
}

function workspaceGovernanceProfile(transition: TransitionRecord): string | undefined {
  const budget = isRecord(transition.workspaceComparison) && isRecord(transition.workspaceComparison.budget)
    ? transition.workspaceComparison.budget
    : undefined;
  if (!budget) return undefined;
  if (typeof budget.governanceProfile === "string") return budget.governanceProfile;
  const policy = isRecord(budget.governancePolicy) ? budget.governancePolicy : undefined;
  return typeof policy?.profile === "string" ? policy.profile : undefined;
}

function shadowLiveEligible(transition: TransitionRecord): boolean {
  const shadow = isRecord(transition.shadowWorkspaceDecision) ? transition.shadowWorkspaceDecision : undefined;
  if (!shadow) return false;
  if (typeof shadow.liveEligibleClass === "boolean") return shadow.liveEligibleClass;
  const decisionClass = typeof shadow.decisionClass === "string"
    ? shadow.decisionClass
    : isRecord(transition.workspaceComparison) && typeof transition.workspaceComparison.decisionClass === "string"
      ? transition.workspaceComparison.decisionClass
      : undefined;
  return typeof decisionClass === "string" && /:llm_required$/u.test(decisionClass);
}

function shadowOutputCapHit(shadow: Record<string, unknown>): boolean {
  if (shadow.outputCapHit === true) return true;
  if (shadow.providerFinishReason === "length") return true;
  const actualOutputTokens = typeof shadow.actualOutputTokens === "number" ? shadow.actualOutputTokens : undefined;
  const maxOutputTokens = typeof shadow.maxOutputTokens === "number" ? shadow.maxOutputTokens : undefined;
  return typeof actualOutputTokens === "number" && typeof maxOutputTokens === "number" && actualOutputTokens >= maxOutputTokens;
}

function proposalStableMutation(proposal: JsonRecord): boolean {
  return isRecord(proposal.proposedChange) && proposal.proposedChange.stableMutation !== false;
}

function addProposalToGroups(
  groups: Map<string, ReplayConsolidationProposalGroup>,
  proposal: JsonRecord,
  status: string,
  targetLayer: string
): void {
  const action = proposalAction(proposal);
  const buckets = proposalBuckets(proposal);
  const keyBuckets = buckets.length > 0 ? buckets : ["unknown"];
  const groupId = [targetLayer, action, keyBuckets.sort().join("+")].join("|");
  const group = groups.get(groupId) ?? {
    groupId,
    targetLayer,
    action,
    buckets: keyBuckets,
    occurrences: 0,
    evidenceStrength: "unknown",
    confidence: 0,
    pendingReview: 0,
    mutatingOrAccepted: 0,
    transitionIds: [],
    ticks: [],
    screens: [],
    floors: [],
    selectedActions: [],
    proposal: typeof proposal.proposal === "string" ? proposal.proposal : "",
    stableMutation: false,
    blockedStableTargets: [],
    allowedNextSteps: [],
    forbiddenNextSteps: [],
    examples: []
  };
  group.occurrences += 1;
  group.evidenceStrength = strongestStrength(group.evidenceStrength, typeof proposal.evidenceStrength === "string" ? proposal.evidenceStrength : "unknown");
  group.confidence = Math.max(group.confidence, typeof proposal.confidence === "number" ? proposal.confidence : 0);
  if (status === "proposed") group.pendingReview += 1;
  if (status === "accepted" || proposalStableMutation(proposal)) group.mutatingOrAccepted += 1;
  if (proposalStableMutation(proposal)) group.stableMutation = true;
  pushUniqueString(group.transitionIds, typeof proposal.transitionId === "string" ? proposal.transitionId : undefined, 12);
  pushUniqueNumber(group.ticks, typeof proposal.tick === "number" ? proposal.tick : undefined, 12);
  pushUniqueString(group.screens, typeof proposal.screen === "string" ? proposal.screen : undefined, 8);
  pushUniqueNumber(group.floors, typeof proposal.floor === "number" ? proposal.floor : undefined, 8);
  if (group.selectedActions.length < 5 && proposal.selectedAction !== undefined) group.selectedActions.push(proposal.selectedAction);
  for (const target of stringArray(proposal.blockedStableTargets)) pushUniqueString(group.blockedStableTargets, target, 12);
  if (isRecord(proposal.proposedChange)) {
    for (const step of stringArray(proposal.proposedChange.allowedNextSteps)) pushUniqueString(group.allowedNextSteps, step, 12);
    for (const step of stringArray(proposal.proposedChange.forbiddenNextSteps)) pushUniqueString(group.forbiddenNextSteps, step, 12);
  }
  if (group.examples.length < 3) {
    group.examples.push({
      recordId: proposal.recordId,
      transitionId: proposal.transitionId,
      tick: proposal.tick,
      screen: proposal.screen,
      floor: proposal.floor,
      selectedAction: proposal.selectedAction,
      evidenceStrength: proposal.evidenceStrength,
      stableMutation: proposalStableMutation(proposal)
    });
  }
  groups.set(groupId, group);
}

function finalizeProposalGroup(group: ReplayConsolidationProposalGroup): ReplayConsolidationProposalGroup {
  const aggregatedStrength = group.mutatingOrAccepted > 0
    ? group.evidenceStrength
    : group.occurrences >= 3 && group.evidenceStrength === "weak"
      ? "moderate"
      : group.evidenceStrength;
  return {
    ...group,
    evidenceStrength: aggregatedStrength,
    confidence: Number(Math.min(0.85, Math.max(group.confidence, group.occurrences >= 3 ? 0.55 : group.confidence)).toFixed(3))
  };
}

function proposalAction(proposal: JsonRecord): string {
  if (isRecord(proposal.proposedChange) && typeof proposal.proposedChange.action === "string") {
    return proposal.proposedChange.action;
  }
  return typeof proposal.proposalKind === "string" ? proposal.proposalKind : "unknown";
}

function proposalBuckets(proposal: JsonRecord): string[] {
  const buckets = new Set<string>();
  const evidence = Array.isArray(proposal.evidence) ? proposal.evidence.filter(isRecord) : [];
  for (const item of evidence) {
    const actionable = Array.isArray(item.actionableBuckets) ? item.actionableBuckets.filter(isRecord) : [];
    for (const bucket of actionable) {
      if (typeof bucket.bucket === "string") buckets.add(bucket.bucket);
    }
  }
  return Array.from(buckets);
}

function strongestStrength(
  left: string,
  right: string
): ReplayConsolidationProposalGroup["evidenceStrength"] {
  return strengthRank(right) > strengthRank(left)
    ? normalizeStrength(right)
    : normalizeStrength(left);
}

function normalizeStrength(value: string): ReplayConsolidationProposalGroup["evidenceStrength"] {
  if (value === "weak" || value === "moderate" || value === "strong") return value;
  return "unknown";
}

function strengthRank(value: string): number {
  if (value === "strong") return 3;
  if (value === "moderate") return 2;
  if (value === "weak") return 1;
  return 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function pushUniqueString(target: string[], value: string | undefined, limit: number): void {
  if (!value || target.includes(value) || target.length >= limit) return;
  target.push(value);
}

function pushUniqueNumber(target: number[], value: number | undefined, limit: number): void {
  if (value === undefined || target.includes(value) || target.length >= limit) return;
  target.push(value);
}

function shortAction(action: unknown): string {
  if (!isRecord(action)) return String(action ?? "null");
  const kind = typeof action.kind === "string" ? action.kind : "unknown";
  if (kind === "play_card" && typeof action.cardIndex === "number") {
    const card = typeof action.cardName === "string" ? `:${action.cardName}` : "";
    const target = typeof action.target === "string" ? `->${action.target}` : "";
    return `${kind}:${action.cardIndex}${card}${target}`;
  }
  if (typeof action.index === "number") {
    const card = typeof action.cardName === "string" ? `:${action.cardName}` : "";
    return `${kind}:${action.index}${card}`;
  }
  if (typeof action.cardName === "string") return `${kind}:${action.cardName}`;
  if (typeof action.target === "string") return `${kind}->${action.target}`;
  if (typeof action.option === "string" || typeof action.option === "number") return `${kind}:${String(action.option)}`;
  return kind;
}
