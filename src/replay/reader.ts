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
  shadowWorkspaceDecision: number;
  shadowWorkspaceCalled: number;
  predictionError: number;
  replayFrame: number;
  consolidation: number;
  fullShadowScaffold: number;
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
    shadowWorkspaceDecision: 0,
    shadowWorkspaceCalled: 0,
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
    const hasShadowWorkspaceDecision = isRecord(transition.shadowWorkspaceDecision);
    const hasShadowWorkspaceCalled = hasShadowWorkspaceDecision && transition.shadowWorkspaceDecision?.called === true;
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
    if (hasShadowWorkspaceDecision) coverage.shadowWorkspaceDecision += 1;
    if (hasShadowWorkspaceCalled) coverage.shadowWorkspaceCalled += 1;
    if (hasPredictionError) coverage.predictionError += 1;
    if (hasReplayFrame) coverage.replayFrame += 1;
    if (hasConsolidation) coverage.consolidation += 1;
    if (hasStrategicImpression && hasSalienceSignals && hasMemoryActivation && hasCandidateFutures && hasDeliberationPacket) {
      coverage.fullShadowScaffold += 1;
    }
  }
  return coverage;
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
    item("shadowWorkspaceDecision", coverage.shadowWorkspaceDecision),
    item("shadowWorkspaceCalled", coverage.shadowWorkspaceCalled),
    item("predictionError", coverage.predictionError),
    item("replayFrame", coverage.replayFrame),
    item("consolidation", coverage.consolidation),
    item("fullShadowScaffold", coverage.fullShadowScaffold)
  ].join(", ");
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
