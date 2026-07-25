import path from "node:path";
import { readReplayRun, resolveRunDir } from "../replay/reader.js";
import {
  appendLearningProposal,
  appendLearningProposalReviewDecision,
  appendReverseScaffoldFeedback,
  buildLearningProposalShadowOverlayPlan,
  buildLearningProposalSurface,
  buildLearningProposalReviewDecisionSurface,
  buildReverseScaffoldFeedbackSurface,
  filterLearningProposalReviewDecisions,
  filterLearningProposals,
  filterReverseScaffoldFeedback,
  formatLearningProposalSurface,
  formatLearningProposalReviewDecisionSurface,
  formatReverseScaffoldFeedbackSurface,
  readLearningProposalReviewDecisions,
  readLearningProposals,
  readReverseScaffoldFeedback,
  summarizeLearningProposalReviewDecision,
  summarizeLearningProposal,
  summarizeReverseScaffoldFeedback,
  type LearningProposalReviewDecisionFilter,
  type LearningProposalFilter,
  type ReverseScaffoldFeedbackFilter
} from "./proposals.js";
import {
  generateLearningProposalSeeds,
  summarizeGeneratedLearningProposals
} from "./proposalGenerator.js";
import {
  compareLearningProposalInShadowWorkspace,
  runLearningProposalInSameSliceShadow
} from "./shadowApplicator.js";
import {
  evaluateLearningProposalShadowPair,
  parseSameSliceShadowOutcomeEvidence,
  type ShadowWorkspaceProviderAttempt,
  type ShadowWorkspaceOutcomeEvidence
} from "./shadowEvaluation.js";
import {
  appendLearningExperimentManifest,
  buildLearningExperimentManifest,
  buildLearningExperimentManifestSurface,
  formatLearningExperimentManifestSurface,
  readLearningExperimentManifestStore,
  assessLearningExperimentPreflight
} from "./experimentManifest.js";
import { buildProviderExperimentFingerprintFromTransition } from "./providerExperimentFingerprint.js";
import type { DeliberationPacket, JsonRecord } from "../domain/types.js";
import type { ScoredCandidate } from "../agent/types.js";
import { createDeepSeekV4FlashDecider, type DeepSeekResponseMode, type DeepSeekThinkingMode } from "../agent/llm.js";
import { isRecord } from "../agent/utils.js";

const READ_ONLY_COMMANDS = new Set(["summary", "list", "show", "feedback", "feedback-show", "reviews", "review-show", "generate", "plan", "shadow-compare", "shadow-evaluate", "shadow-preflight"]);
const APPEND_ONLY_COMMANDS = new Set(["record"]);
const SAME_SLICE_SHADOW_COMMANDS = new Set(["shadow-run"]);
const REVIEW_LEDGER_COMMANDS = new Set(["approve", "reject", "expire"]);
const FORBIDDEN_COMMANDS = new Set(["apply", "promote", "revert"]);

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] && !args[0].startsWith("--") ? args[0] : "summary";
  if (FORBIDDEN_COMMANDS.has(command)) {
    throw new Error(`Learning command '${command}' is intentionally unavailable in guarded P9 mode.`);
  }
  if (!READ_ONLY_COMMANDS.has(command) && !APPEND_ONLY_COMMANDS.has(command) && !SAME_SLICE_SHADOW_COMMANDS.has(command) && !REVIEW_LEDGER_COMMANDS.has(command)) {
    throw new Error(`Unknown learning proposal command: ${command}`);
  }
  const commandArgs = command === args[0] ? args.slice(1) : args;
  const idCommand = command === "show" ||
    command === "feedback-show" ||
    command === "review-show" ||
    command === "shadow-preflight" ||
    REVIEW_LEDGER_COMMANDS.has(command) ||
    APPEND_ONLY_COMMANDS.has(command) ||
    SAME_SLICE_SHADOW_COMMANDS.has(command);
  const runDir = resolveRunDir(parseRunArg(commandArgs, !idCommand));
  const proposals = readLearningProposals(runDir);
  const feedback = readReverseScaffoldFeedback(runDir);
  const reviewDecisions = readLearningProposalReviewDecisions(runDir);
  const experimentManifestStore = readLearningExperimentManifestStore(runDir);
  const experimentManifests = experimentManifestStore.manifests;

  if (command === "summary") {
    printHeader(runDir);
    console.log(`Learning proposal surface: ${formatLearningProposalSurface(buildLearningProposalSurface(proposals))}`);
    console.log(`Learning proposal review decisions: ${formatLearningProposalReviewDecisionSurface(buildLearningProposalReviewDecisionSurface(reviewDecisions))}`);
    console.log(`Reverse scaffold feedback: ${formatReverseScaffoldFeedbackSurface(buildReverseScaffoldFeedbackSurface(feedback))}`);
    console.log(`Learning experiment manifests: ${formatLearningExperimentManifestSurface(buildLearningExperimentManifestSurface(experimentManifests, experimentManifestStore.digest))}`);
    console.log("Guardrails: proposalMutationEnabled=false applyPathEnabled=false stablePromotionEnabled=false affectsLiveBehavior=false");
    return;
  }

  if (command === "list") {
    printHeader(runDir);
    const filtered = filterLearningProposals(proposals, parseProposalFilter(commandArgs));
    console.log(JSON.stringify(filtered.map(summarizeLearningProposal), null, 2));
    return;
  }

  if (command === "show") {
    const id = parseRequiredId(commandArgs);
    const [proposal] = filterLearningProposals(proposals, { ...parseProposalFilter(commandArgs), id });
    if (!proposal) throw new Error(`Learning proposal not found: ${id}`);
    console.log(JSON.stringify(proposal, null, 2));
    return;
  }

  if (command === "reviews") {
    printHeader(runDir);
    const filtered = filterLearningProposalReviewDecisions(reviewDecisions, parseReviewDecisionFilter(commandArgs));
    console.log(JSON.stringify(filtered.map(summarizeLearningProposalReviewDecision), null, 2));
    return;
  }

  if (command === "review-show") {
    const id = parseRequiredId(commandArgs);
    const [decision] = filterLearningProposalReviewDecisions(reviewDecisions, { ...parseReviewDecisionFilter(commandArgs), id });
    if (!decision) throw new Error(`Learning proposal review decision not found: ${id}`);
    console.log(JSON.stringify(decision, null, 2));
    return;
  }

  if (command === "plan") {
    const id = parseRequiredId(commandArgs);
    const proposal = proposals.find((record) => record.id === id);
    if (!proposal) throw new Error(`Learning proposal not found: ${id}`);
    const run = readReplayRun(runDir);
    const sourceTransition = sourceTransitionForProposal(proposal, run.transitions as unknown as JsonRecord[]);
    printHeader(runDir);
    console.log(JSON.stringify(buildLearningProposalShadowOverlayPlan(proposal, sourceTransition), null, 2));
    console.log("Shadow overlay plan is read-only: proposalMutationEnabled=false applyPathEnabled=false stablePromotionEnabled=false affectsLiveBehavior=false");
    return;
  }

  if (command === "shadow-compare") {
    const id = parseRequiredId(commandArgs);
    const transitionId = optionValue(commandArgs, "--transition-id");
    if (!transitionId) throw new Error("shadow-compare requires --transition-id <transitionId> to preserve evidence scope.");
    const proposal = proposals.find((record) => record.id === id);
    if (!proposal) throw new Error(`Learning proposal not found: ${id}`);
    const run = readReplayRun(runDir);
    const transition = run.transitions.find((record) => record.transitionId === transitionId);
    if (!transition) throw new Error(`Transition not found in run: ${transitionId}`);
    const packet = packetFromTransition(transition as unknown as JsonRecord);
    const candidates = candidatesFromTransition(transition as unknown as JsonRecord);
    printHeader(runDir);
    console.log(JSON.stringify(compareLearningProposalInShadowWorkspace({
      proposal,
      sourceTransition: transition as unknown as JsonRecord,
      packet,
      candidates,
      decisionClass: decisionClassFromTransition(transition as unknown as JsonRecord),
      mode: workspaceModeFromTransition(transition as unknown as JsonRecord),
      baselineReasonQualityNotes: reasonQualityNotesFromTransition(transition as unknown as JsonRecord)
    }), null, 2));
    console.log("Offline shadow assembly only: providerCalls=0 runArtifactWrites=0 liveBehaviorChanges=0 stablePromotionEnabled=false");
    return;
  }

  if (command === "shadow-evaluate") {
    const id = parseRequiredId(commandArgs);
    const transitionId = optionValue(commandArgs, "--transition-id");
    const overlayJson = optionValue(commandArgs, "--overlay-outcome-json");
    if (!transitionId) throw new Error("shadow-evaluate requires --transition-id <transitionId> to preserve evidence scope.");
    if (!overlayJson) throw new Error("shadow-evaluate requires --overlay-outcome-json <json> from a same-slice shadow result.");
    const proposal = proposals.find((record) => record.id === id);
    if (!proposal) throw new Error(`Learning proposal not found: ${id}`);
    const run = readReplayRun(runDir);
    const transition = run.transitions.find((record) => record.transitionId === transitionId);
    if (!transition) throw new Error(`Transition not found in run: ${transitionId}`);
    const transitionRecord = transition as unknown as JsonRecord;
    const comparison = compareLearningProposalInShadowWorkspace({
      proposal,
      sourceTransition: transitionRecord,
      packet: packetFromTransition(transitionRecord),
      candidates: candidatesFromTransition(transitionRecord),
      decisionClass: decisionClassFromTransition(transitionRecord),
      mode: workspaceModeFromTransition(transitionRecord),
      baselineReasonQualityNotes: reasonQualityNotesFromTransition(transitionRecord)
    });
    const baseline = recordedBaselineOutcome(transitionRecord, comparison);
    const overlay = parseSameSliceShadowOutcomeEvidence(JSON.parse(overlayJson));
    if (!overlay) throw new Error("overlay-outcome-json does not match the required same-slice shadow outcome evidence shape.");
    printHeader(runDir);
    console.log(JSON.stringify(evaluateLearningProposalShadowPair({ comparison, baseline, overlay }), null, 2));
    console.log("Shadow evaluation is read-only: proposalStatusMutationEnabled=false shadowValidated=false stablePromotionEnabled=false");
    return;
  }

  if (command === "shadow-run") {
    const id = parseRequiredId(commandArgs);
    const transitionId = optionValue(commandArgs, "--transition-id");
    if (!transitionId) throw new Error("shadow-run requires --transition-id <transitionId> to preserve evidence scope.");
    const proposal = proposals.find((record) => record.id === id);
    if (!proposal) throw new Error(`Learning proposal not found: ${id}`);
    const run = readReplayRun(runDir);
    const transition = run.transitions.find((record) => record.transitionId === transitionId);
    if (!transition) throw new Error(`Transition not found in run: ${transitionId}`);
    const transitionRecord = transition as unknown as JsonRecord;
    const preflight = assessLearningExperimentPreflight({ proposal, transition: transitionRecord });
    if (!preflight.eligibleForSameSliceProviderCall) {
      printHeader(run.runDir);
      console.log(JSON.stringify(preflight, null, 2));
      console.log("Same-slice shadow refused before provider call: transitionWrites=0 proposalStatusMutationEnabled=false stablePromotionEnabled=false");
      return;
    }
    const comparison = compareLearningProposalInShadowWorkspace({
      proposal,
      sourceTransition: transitionRecord,
      packet: packetFromTransition(transitionRecord),
      candidates: candidatesFromTransition(transitionRecord),
      decisionClass: decisionClassFromTransition(transitionRecord),
      mode: workspaceModeFromTransition(transitionRecord),
      baselineReasonQualityNotes: reasonQualityNotesFromTransition(transitionRecord)
    });
    const baseline = recordedBaselineOutcome(transitionRecord, comparison);
    const decider = createSameSliceDeepSeekDecider(transitionRecord);
    const result = await runLearningProposalInSameSliceShadow({
      proposal,
      sourceTransition: transitionRecord,
      packet: packetFromTransition(transitionRecord),
      candidates: candidatesFromTransition(transitionRecord),
      decisionClass: decisionClassFromTransition(transitionRecord),
      mode: workspaceModeFromTransition(transitionRecord),
      baselineReasonQualityNotes: reasonQualityNotesFromTransition(transitionRecord),
      decider,
      evidenceScope: {
        transitionId: baseline.transitionId,
        revisionTag: baseline.revisionTag,
        budgetWindow: baseline.budgetWindow,
        providerProfile: baseline.providerProfile
      }
    });
    printHeader(runDir);
    const evaluation = evaluateLearningProposalShadowPair({
      comparison: result.comparison,
      baseline,
      overlay: result.overlayOutcome
    });
    const manifest = buildLearningExperimentManifest({
      runId: path.basename(run.runDir),
      proposal,
      transition: transitionRecord,
      comparison: result.comparison,
      baseline,
      overlay: result.overlayOutcome,
      evaluation
    });
    const recordManifest = commandArgs.includes("--record-manifest");
    if (recordManifest) appendLearningExperimentManifest(run.runDir, manifest);
    console.log(JSON.stringify({
      comparison: result.comparison,
      baseline,
      overlay: result.overlayOutcome,
      evaluation,
      experimentManifest: manifest,
      manifestRecorded: recordManifest
    }, null, 2));
    console.log("Same-slice shadow only: providerCalls=1 maximum gameClientCalls=0 transitionWrites=0 proposalStatusMutationEnabled=false stablePromotionEnabled=false liveBehaviorChanges=0");
    return;
  }

  if (command === "shadow-preflight") {
    const id = parseRequiredId(commandArgs);
    const transitionId = optionValue(commandArgs, "--transition-id");
    if (!transitionId) throw new Error("shadow-preflight requires --transition-id <transitionId>.");
    const proposal = proposals.find((record) => record.id === id);
    if (!proposal) throw new Error(`Learning proposal not found: ${id}`);
    const run = readReplayRun(runDir);
    const transition = run.transitions.find((record) => record.transitionId === transitionId);
    if (!transition) throw new Error(`Transition not found in run: ${transitionId}`);
    printHeader(run.runDir);
    console.log(JSON.stringify(assessLearningExperimentPreflight({ proposal, transition: transition as unknown as JsonRecord }), null, 2));
    return;
  }

  if (command === "record") {
    const rawProposal = optionValue(commandArgs, "--proposal-json");
    if (!rawProposal) throw new Error("record requires --proposal-json <json> for an explicit append-only proposal.");
    const parsed = JSON.parse(rawProposal);
    if (!isRecord(parsed)) throw new Error("proposal-json must be a JSON object.");
    if (parsed.status && parsed.status !== "draft" && parsed.status !== "pending_review") {
      throw new Error("record accepts only draft or pending_review proposals; approval, promotion, and stable statuses are unavailable.");
    }
    const proposal = appendLearningProposal(runDir, parsed);
    printHeader(runDir);
    console.log(JSON.stringify(summarizeLearningProposal(proposal as unknown as JsonRecord), null, 2));
    console.log("Append-only proposal record: review required; applyPathEnabled=false stablePromotionEnabled=false affectsLiveBehavior=false");
    return;
  }

  if (command === "feedback") {
    printHeader(runDir);
    const filtered = filterReverseScaffoldFeedback(feedback, parseFeedbackFilter(commandArgs));
    console.log(JSON.stringify(filtered.map(summarizeReverseScaffoldFeedback), null, 2));
    return;
  }

  if (command === "feedback-show") {
    const id = parseRequiredId(commandArgs);
    const [record] = filterReverseScaffoldFeedback(feedback, { ...parseFeedbackFilter(commandArgs), id });
    if (!record) throw new Error(`Reverse scaffold feedback not found: ${id}`);
    console.log(JSON.stringify(record, null, 2));
    return;
  }

  if (command === "generate") {
    const run = readReplayRun(runDir);
    const includeIneligibleEvidence = args.includes("--include-ineligible-evidence");
    const generated = generateLearningProposalSeeds(path.basename(run.runDir), run.transitions as unknown as Record<string, unknown>[], {
      includeIneligibleEvidence
    });
    const write = args.includes("--write");
    const existingProposalIds = new Set(proposals.map((proposal) => String(proposal.id ?? "")));
    const existingFeedbackIds = new Set(feedback.map((record) => String(record.id ?? "")));
    let appendedProposals = 0;
    let appendedFeedback = 0;
    if (write) {
      for (const proposal of generated.proposals) {
        if (typeof proposal.id === "string" && existingProposalIds.has(proposal.id)) continue;
        appendLearningProposal(run.runDir, proposal);
        if (typeof proposal.id === "string") existingProposalIds.add(proposal.id);
        appendedProposals += 1;
      }
      for (const record of generated.reverseFeedback) {
        if (typeof record.id === "string" && existingFeedbackIds.has(record.id)) continue;
        appendReverseScaffoldFeedback(run.runDir, record);
        if (typeof record.id === "string") existingFeedbackIds.add(record.id);
        appendedFeedback += 1;
      }
    }
    printHeader(run.runDir);
    console.log(JSON.stringify({
      ...summarizeGeneratedLearningProposals(generated),
      dryRun: !write,
      includeIneligibleEvidence,
      appendedProposals,
      appendedReverseFeedback: appendedFeedback,
      proposals: generated.proposals.map(summarizeLearningProposal),
      reverseFeedback: generated.reverseFeedback.map(summarizeReverseScaffoldFeedback)
    }, null, 2));
    console.log("Generation guardrails: proposal seeds only; applyPathEnabled=false stablePromotionEnabled=false affectsLiveBehavior=false");
    return;
  }

  if (REVIEW_LEDGER_COMMANDS.has(command)) {
    const id = parseRequiredId(commandArgs);
    const decision = appendLearningProposalReviewDecision(runDir, proposals, {
      proposalId: id,
      decision: command as "approve" | "reject" | "expire",
      reviewer: optionValue(commandArgs, "--reviewer") ?? "human",
      notes: optionValue(commandArgs, "--notes") ?? optionValue(commandArgs, "--reason") ?? ""
    });
    printHeader(runDir);
    console.log(JSON.stringify(summarizeLearningProposalReviewDecision(decision as unknown as Record<string, unknown>), null, 2));
    console.log("Audit-only: proposalMutationEnabled=false applyPathEnabled=false stablePromotionEnabled=false");
  }
}

function printHeader(runDir: string): void {
  console.log(`Run: ${path.basename(runDir)}`);
}

function parseRunArg(args: string[], allowPositional = true): string | undefined {
  const runIdIndex = args.indexOf("--run-id");
  if (runIdIndex !== -1) return args[runIdIndex + 1];
  const pathIndex = args.indexOf("--run-dir");
  if (pathIndex !== -1) return args[pathIndex + 1];
  if (args.includes("--latest")) return undefined;
  if (!allowPositional) return undefined;
  const positional = args.find((arg) => arg !== "--latest" && !arg.startsWith("--"));
  return positional;
}

function parseProposalFilter(args: string[]): LearningProposalFilter {
  return {
    runId: optionValue(args, "--source-run-id"),
    transitionId: optionValue(args, "--transition-id"),
    type: optionValue(args, "--type"),
    status: optionValue(args, "--status"),
    targetLayer: optionValue(args, "--target-layer"),
    missingRequiredField: optionValue(args, "--missing-field")
  };
}

function parseFeedbackFilter(args: string[]): ReverseScaffoldFeedbackFilter {
  return {
    runId: optionValue(args, "--source-run-id"),
    transitionId: optionValue(args, "--transition-id"),
    targetLayer: optionValue(args, "--target-layer"),
    source: optionValue(args, "--source"),
    proposalSeedId: optionValue(args, "--proposal-seed-id")
  };
}

function parseReviewDecisionFilter(args: string[]): LearningProposalReviewDecisionFilter {
  return {
    proposalId: optionValue(args, "--proposal-id"),
    decision: optionValue(args, "--decision"),
    reviewer: optionValue(args, "--reviewer")
  };
}

function parseRequiredId(args: string[]): string {
  const id = optionValue(args, "--id") ?? args.find((arg) => !arg.startsWith("--") && arg !== "--latest");
  if (!id) throw new Error("Missing required id. Use --id <id>.");
  return id;
}

function optionValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function sourceTransitionForProposal(proposal: JsonRecord, transitions: JsonRecord[]): JsonRecord | undefined {
  const transitionIds = Array.isArray(proposal.createdFromTransitionIds)
    ? [...new Set(proposal.createdFromTransitionIds.filter((value): value is string => typeof value === "string"))]
    : [];
  if (transitionIds.length !== 1) return undefined;
  return transitions.find((transition) => transition.transitionId === transitionIds[0]);
}

function packetFromTransition(transition: JsonRecord): DeliberationPacket {
  if (!isRecord(transition.deliberationPacket) || !Array.isArray(transition.deliberationPacket.candidateFutures)) {
    throw new Error("Transition has no replayable DeliberationPacket for shadow comparison.");
  }
  return transition.deliberationPacket as unknown as DeliberationPacket;
}

function candidatesFromTransition(transition: JsonRecord): ScoredCandidate[] {
  const rawCandidates = Array.isArray(transition.candidateActions)
    ? transition.candidateActions
    : Array.isArray(transition.localScores)
      ? transition.localScores
      : [];
  const candidates = rawCandidates.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.id !== "string" || !isRecord(candidate.action) || typeof candidate.action.kind !== "string") {
      return [];
    }
    return [{
      id: candidate.id,
      action: candidate.action as ScoredCandidate["action"],
      kind: candidate.action.kind as ScoredCandidate["kind"],
      label: typeof candidate.label === "string" ? candidate.label : candidate.id,
      score: typeof candidate.score === "number" ? candidate.score : 0,
      confidence: typeof candidate.confidence === "number" ? candidate.confidence : 0,
      reasons: Array.isArray(candidate.reasons) ? candidate.reasons.filter((reason): reason is string => typeof reason === "string") : [],
      risks: Array.isArray(candidate.risks) ? candidate.risks.filter((risk): risk is string => typeof risk === "string") : []
    }];
  });
  if (candidates.length === 0) throw new Error("Transition has no replayable scored candidates; refusing to synthesize allowed actions.");
  return candidates;
}

function decisionClassFromTransition(transition: JsonRecord): string | undefined {
  if (isRecord(transition.workspaceComparison) && typeof transition.workspaceComparison.decisionClass === "string") {
    return transition.workspaceComparison.decisionClass;
  }
  return undefined;
}

function workspaceModeFromTransition(transition: JsonRecord): "full" | "compact" | "ultra_compact" | "full_bounded_candidate_futures" {
  const comparison = isRecord(transition.workspaceComparison) ? transition.workspaceComparison : undefined;
  const mode = comparison?.ablationMode;
  return mode === "compact" || mode === "ultra_compact" || mode === "full_bounded_candidate_futures"
    ? mode
    : "full";
}

function reasonQualityNotesFromTransition(transition: JsonRecord): string[] {
  const shadow = isRecord(transition.shadowWorkspaceDecision) ? transition.shadowWorkspaceDecision : undefined;
  return Array.isArray(shadow?.reasonQualityNotes)
    ? shadow.reasonQualityNotes.filter((note): note is string => typeof note === "string")
    : [];
}

function recordedBaselineOutcome(
  transition: JsonRecord,
  comparison: ReturnType<typeof compareLearningProposalInShadowWorkspace>
): ShadowWorkspaceOutcomeEvidence {
  const shadow = isRecord(transition.shadowWorkspaceDecision) ? transition.shadowWorkspaceDecision : undefined;
  if (!shadow || shadow.called !== true) {
    throw new Error("Transition has no called baseline shadow outcome; refusing to infer paired evidence.");
  }
  const comparisonRecord = isRecord(transition.workspaceComparison) ? transition.workspaceComparison : {};
  const budget = isRecord(comparisonRecord.budget) ? comparisonRecord.budget : {};
  const maxShadowCalls = typeof budget.maxShadowCalls === "number" ? budget.maxShadowCalls : "unknown";
  const profile = typeof budget.governanceProfile === "string" ? budget.governanceProfile : "unknown";
  const maxOutputTokens = typeof shadow.maxOutputTokens === "number" ? shadow.maxOutputTokens : "unknown";
  const thinking = typeof shadow.providerThinkingMode === "string" ? shadow.providerThinkingMode : "unknown";
  const mode = typeof shadow.providerMode === "string" ? shadow.providerMode : "unknown";
  const retry = typeof shadow.retryCount === "number" ? shadow.retryCount : "unknown";
  return {
    source: "recorded_shadow",
    transitionId: typeof transition.transitionId === "string" ? transition.transitionId : "unknown",
    promptHash: typeof shadow.promptHash === "string" ? shadow.promptHash : "unknown",
    allowedCandidateIdsHash: comparison.baseline.allowedCandidateIdsHash,
    candidateFutureFactsHash: comparison.baseline.candidateFutureFactsHash,
    revisionTag: typeof comparisonRecord.revisionTag === "string" ? comparisonRecord.revisionTag : "unknown",
    budgetWindow: `shadow=${maxShadowCalls};profile=${profile}`,
    providerProfile: `output=${maxOutputTokens};thinking=${thinking};mode=${mode};retry=${retry}`,
    providerExperimentFingerprint: buildProviderExperimentFingerprintFromTransition(transition),
    providerAttempts: providerAttemptsFromTransition(shadow.providerAttempts),
    outcome: normalizeShadowOutcome(shadow.outcome),
    selectedCandidateId: typeof shadow.structuredSelectedCandidateId === "string" ? shadow.structuredSelectedCandidateId : undefined,
    reason: typeof shadow.reason === "string" ? shadow.reason : undefined,
    failureBucket: typeof shadow.failureBucket === "string" ? shadow.failureBucket : undefined,
    finishReason: typeof shadow.providerFinishReason === "string" ? shadow.providerFinishReason : undefined,
    outputCapHit: shadow.outputCapHit === true
  };
}

function createSameSliceDeepSeekDecider(transition: JsonRecord) {
  const shadow = isRecord(transition.shadowWorkspaceDecision) ? transition.shadowWorkspaceDecision : undefined;
  const comparison = isRecord(transition.workspaceComparison) ? transition.workspaceComparison : undefined;
  const budget = isRecord(comparison?.budget) ? comparison.budget : undefined;
  const outputMode = parseResponseMode(shadow?.providerMode);
  const thinkingMode = parseThinkingMode(shadow?.providerThinkingMode);
  const maxOutputTokens = typeof shadow?.maxOutputTokens === "number" ? shadow.maxOutputTokens : undefined;
  const timeoutMs = typeof budget?.timeoutMs === "number" ? budget.timeoutMs : undefined;
  const retryLimit = typeof shadow?.retryCount === "number" ? shadow.retryCount : undefined;
  if (!outputMode || !thinkingMode || !maxOutputTokens || !timeoutMs || retryLimit === undefined) {
    throw new Error("Recorded baseline lacks an explicit provider profile; refusing a same-slice overlay call.");
  }
  return createDeepSeekV4FlashDecider({ outputMode, thinkingMode, maxOutputTokens, timeoutMs, retryLimit });
}

function parseResponseMode(value: unknown): DeepSeekResponseMode | undefined {
  return value === "json_mode" || value === "non_json_strict" ? value : undefined;
}

function parseThinkingMode(value: unknown): DeepSeekThinkingMode | undefined {
  return value === "default_enabled" || value === "explicit_enabled" || value === "explicit_disabled" ? value : undefined;
}

function providerAttemptsFromTransition(value: unknown): ShadowWorkspaceOutcomeEvidence["providerAttempts"] {
  if (!Array.isArray(value)) return undefined;
  const attempts = value.flatMap((attempt) => {
    if (!isRecord(attempt)) return [];
    const requestKind = attempt.requestKind;
    if (requestKind !== "primary" && requestKind !== "rescue") return [];
    const parsed: ShadowWorkspaceProviderAttempt = {
      requestKind: requestKind as ShadowWorkspaceProviderAttempt["requestKind"],
      rescueMode: attempt.rescueMode === "empty" || attempt.rescueMode === "truncation" ? attempt.rescueMode : undefined,
      requestMaxOutputTokens: typeof attempt.requestMaxOutputTokens === "number" ? attempt.requestMaxOutputTokens : undefined,
      requestedThinkingMode: typeof attempt.requestedThinkingMode === "string" ? attempt.requestedThinkingMode : undefined,
      finishReason: typeof attempt.finishReason === "string" ? attempt.finishReason : undefined,
      contentKind: typeof attempt.contentKind === "string" ? attempt.contentKind : undefined
    };
    return [parsed];
  });
  return attempts.length > 0 ? attempts : undefined;
}

function normalizeShadowOutcome(value: unknown): ShadowWorkspaceOutcomeEvidence["outcome"] {
  if (value === "valid" || value === "invalid_output" || value === "invalid_choice" || value === "error" || value === "unavailable" || value === "skipped") {
    return value;
  }
  return "error";
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
