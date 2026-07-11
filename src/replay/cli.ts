import path from "node:path";
import type { JsonRecord } from "../domain/types.js";
import {
  buildReplayCognitiveCoverage,
  buildReplayConsolidationProposalSurface,
  buildReplayFocusedShadowSlices,
  buildReplayFreshShadowSlices,
  buildReplayTimeline,
  formatReplayCognitiveCoverage,
  formatReplayConsolidationProposalSurface,
  formatReplayFocusedShadowSlices,
  formatReplayFreshShadowSlices,
  formatReplayTimeline,
  readConsolidationProposals,
  readReplayRun
} from "./reader.js";
import { buildLiveAppliedRolloutSummary, formatLiveAppliedRolloutSummary } from "./liveAppliedRollout.js";
import {
  buildEvidenceSliceSummary,
  formatEvidenceSliceSummary,
  type EvidenceSliceFilter
} from "./evidenceSliceReader.js";
import { buildBudgetGovernanceSummary, formatBudgetGovernanceSummary } from "./budgetGovernanceSummary.js";
import { buildWorkspaceDecisionClassQuality, formatWorkspaceDecisionClassQuality } from "./workspaceQuality.js";
import { assessP8LiveReadiness, formatP8LiveReadinessAssessment } from "./p8LiveReadiness.js";
import {
  buildLearningProposalSurface,
  buildLearningProposalReviewDecisionSurface,
  buildReverseScaffoldFeedbackSurface,
  formatLearningProposalSurface,
  formatLearningProposalReviewDecisionSurface,
  formatReverseScaffoldFeedbackSurface,
  readLearningProposalReviewDecisions,
  readLearningProposals,
  readReverseScaffoldFeedback
} from "../learning/proposals.js";
import {
  buildLearningExperimentManifestSurface,
  formatLearningExperimentManifestSurface,
  readLearningExperimentManifestStore
} from "../learning/experimentManifest.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] && !args[0].startsWith("--") ? args[0] : "timeline";
  const commandArgs = command === args[0] ? args.slice(1) : args;
  const runIdOrPath = parseRunArg(commandArgs);

  if (command !== "timeline" && command !== "proposals" && command !== "evidence") {
    throw new Error(`Unknown replay command: ${command}`);
  }

  const run = readReplayRun(runIdOrPath);
  if (command === "evidence") {
    const evidenceSlices = buildEvidenceSliceSummary(
      run.transitions as unknown as JsonRecord[],
      parseEvidenceSliceFilter(commandArgs)
    );
    console.log(`Run: ${path.basename(run.runDir)}`);
    console.log(`Focused evidence slice: ${formatEvidenceSliceSummary(evidenceSlices)}`);
    console.log(JSON.stringify(evidenceSlices, null, 2));
    return;
  }
  const cognitiveCoverage = buildReplayCognitiveCoverage(run.transitions);
  const freshShadowSlices = buildReplayFreshShadowSlices(run.transitions);
  const focusedShadowSlices = buildReplayFocusedShadowSlices(run.transitions);
  const workspaceDecisionClassQuality = buildWorkspaceDecisionClassQuality(run.transitions);
  const p8LiveReadinessAssessment = assessP8LiveReadiness(freshShadowSlices.sinceLatestRevision, workspaceDecisionClassQuality);
  const proposalSurface = buildReplayConsolidationProposalSurface(readConsolidationProposals(run.runDir, run.transitions));
  const liveAppliedRollout = buildLiveAppliedRolloutSummary(run.transitions as unknown as JsonRecord[]);
  const evidenceSlices = buildEvidenceSliceSummary(run.transitions as unknown as JsonRecord[]);
  const budgetGovernance = buildBudgetGovernanceSummary(run.transitions as unknown as JsonRecord[]);
  const learningProposalSurface = buildLearningProposalSurface(readLearningProposals(run.runDir));
  const learningProposalReviewDecisionSurface = buildLearningProposalReviewDecisionSurface(readLearningProposalReviewDecisions(run.runDir));
  const reverseScaffoldFeedbackSurface = buildReverseScaffoldFeedbackSurface(readReverseScaffoldFeedback(run.runDir));
  const experimentManifestStore = readLearningExperimentManifestStore(run.runDir);
  const experimentManifestSurface = buildLearningExperimentManifestSurface(
    experimentManifestStore.manifests,
    experimentManifestStore.digest
  );
  console.log(`Run: ${path.basename(run.runDir)}`);
  console.log(`Transitions: ${run.transitions.length}`);
  console.log(`Cognitive coverage: ${formatReplayCognitiveCoverage(cognitiveCoverage)}`);
  console.log(`Fresh shadow slices: ${formatReplayFreshShadowSlices(freshShadowSlices)}`);
  console.log(`Focused fresh slices: ${formatReplayFocusedShadowSlices(focusedShadowSlices)}`);
  console.log(`P8.5 live readiness: ${formatP8LiveReadinessAssessment(p8LiveReadinessAssessment)}`);
  console.log(`Live-applied rollout: ${formatLiveAppliedRolloutSummary(liveAppliedRollout)}`);
  console.log(`Evidence slices: ${formatEvidenceSliceSummary(evidenceSlices)}`);
  console.log(`Budget governance: ${formatBudgetGovernanceSummary(budgetGovernance)}`);
  console.log(`Learning proposal surface: ${formatLearningProposalSurface(learningProposalSurface)}`);
  console.log(`Learning proposal review decisions: ${formatLearningProposalReviewDecisionSurface(learningProposalReviewDecisionSurface)}`);
  console.log(`Reverse scaffold feedback: ${formatReverseScaffoldFeedbackSurface(reverseScaffoldFeedbackSurface)}`);
  console.log(`Learning experiment manifests: ${formatLearningExperimentManifestSurface(experimentManifestSurface)}`);
  console.log(`Workspace quality by class: ${formatWorkspaceDecisionClassQuality(workspaceDecisionClassQuality)}`);
  console.log(`Consolidation proposal surface: ${formatReplayConsolidationProposalSurface(proposalSurface)}`);
  if (command === "proposals") {
    console.log(JSON.stringify(proposalSurface, null, 2));
    return;
  }
  const timeline = buildReplayTimeline(run.transitions);
  console.log(formatReplayTimeline(timeline));
}

function parseEvidenceSliceFilter(args: string[]): EvidenceSliceFilter {
  return {
    decisionClass: optionValue(args, "--decision-class"),
    revisionTag: optionValue(args, "--revision-tag"),
    budgetWindow: optionValue(args, "--budget-window"),
    environmentFingerprintHash: optionValue(args, "--environment-fingerprint"),
    authorityMode: optionValue(args, "--authority-mode"),
    captureProvenance: optionValue(args, "--capture-provenance"),
    shadowCalled: booleanOption(args, "--shadow-called")
  };
}

function optionValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  const value = index === -1 ? undefined : args[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

function booleanOption(args: string[], name: string): boolean | undefined {
  const value = optionValue(args, name);
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseRunArg(args: string[]): string | undefined {
  const runIdIndex = args.indexOf("--run-id");
  if (runIdIndex !== -1) return args[runIdIndex + 1];
  const pathIndex = args.indexOf("--run-dir");
  if (pathIndex !== -1) return args[pathIndex + 1];
  const positional = args.find((arg) => arg !== "--latest" && !arg.startsWith("--"));
  return positional;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
