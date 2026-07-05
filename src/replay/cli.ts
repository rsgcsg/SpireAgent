import path from "node:path";
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
import { buildWorkspaceDecisionClassQuality, formatWorkspaceDecisionClassQuality } from "./workspaceQuality.js";
import { assessP8LiveReadiness, formatP8LiveReadinessAssessment } from "./p8LiveReadiness.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] && !args[0].startsWith("--") ? args[0] : "timeline";
  const commandArgs = command === args[0] ? args.slice(1) : args;
  const runIdOrPath = parseRunArg(commandArgs);

  if (command !== "timeline" && command !== "proposals") {
    throw new Error(`Unknown replay command: ${command}`);
  }

  const run = readReplayRun(runIdOrPath);
  const cognitiveCoverage = buildReplayCognitiveCoverage(run.transitions);
  const freshShadowSlices = buildReplayFreshShadowSlices(run.transitions);
  const focusedShadowSlices = buildReplayFocusedShadowSlices(run.transitions);
  const workspaceDecisionClassQuality = buildWorkspaceDecisionClassQuality(run.transitions);
  const p8LiveReadinessAssessment = assessP8LiveReadiness(freshShadowSlices.sinceLatestRevision, workspaceDecisionClassQuality);
  const proposalSurface = buildReplayConsolidationProposalSurface(readConsolidationProposals(run.runDir, run.transitions));
  console.log(`Run: ${path.basename(run.runDir)}`);
  console.log(`Transitions: ${run.transitions.length}`);
  console.log(`Cognitive coverage: ${formatReplayCognitiveCoverage(cognitiveCoverage)}`);
  console.log(`Fresh shadow slices: ${formatReplayFreshShadowSlices(freshShadowSlices)}`);
  console.log(`Focused fresh slices: ${formatReplayFocusedShadowSlices(focusedShadowSlices)}`);
  console.log(`P8.5 live readiness: ${formatP8LiveReadinessAssessment(p8LiveReadinessAssessment)}`);
  console.log(`Workspace quality by class: ${formatWorkspaceDecisionClassQuality(workspaceDecisionClassQuality)}`);
  console.log(`Consolidation proposal surface: ${formatReplayConsolidationProposalSurface(proposalSurface)}`);
  if (command === "proposals") {
    console.log(JSON.stringify(proposalSurface, null, 2));
    return;
  }
  const timeline = buildReplayTimeline(run.transitions);
  console.log(formatReplayTimeline(timeline));
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
