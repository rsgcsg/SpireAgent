import path from "node:path";
import { resolveRunDir } from "../replay/reader.js";
import {
  buildLearningProposalSurface,
  buildReverseScaffoldFeedbackSurface,
  filterLearningProposals,
  filterReverseScaffoldFeedback,
  formatLearningProposalSurface,
  formatReverseScaffoldFeedbackSurface,
  readLearningProposals,
  readReverseScaffoldFeedback,
  summarizeLearningProposal,
  summarizeReverseScaffoldFeedback,
  type LearningProposalFilter,
  type ReverseScaffoldFeedbackFilter
} from "./proposals.js";

const READ_ONLY_COMMANDS = new Set(["summary", "list", "show", "feedback", "feedback-show"]);
const FORBIDDEN_COMMANDS = new Set(["approve", "apply", "promote", "reject", "expire", "revert"]);

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] && !args[0].startsWith("--") ? args[0] : "summary";
  if (FORBIDDEN_COMMANDS.has(command)) {
    throw new Error(`Learning command '${command}' is intentionally unavailable in P9.1 read-only mode.`);
  }
  if (!READ_ONLY_COMMANDS.has(command)) {
    throw new Error(`Unknown learning proposal command: ${command}`);
  }
  const commandArgs = command === args[0] ? args.slice(1) : args;
  const runDir = resolveRunDir(parseRunArg(commandArgs, command !== "show" && command !== "feedback-show"));
  const proposals = readLearningProposals(runDir);
  const feedback = readReverseScaffoldFeedback(runDir);

  if (command === "summary") {
    printHeader(runDir);
    console.log(`Learning proposal surface: ${formatLearningProposalSurface(buildLearningProposalSurface(proposals))}`);
    console.log(`Reverse scaffold feedback: ${formatReverseScaffoldFeedbackSurface(buildReverseScaffoldFeedbackSurface(feedback))}`);
    console.log("Read-only: applyPathEnabled=false stablePromotionEnabled=false affectsLiveBehavior=false");
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

function parseRequiredId(args: string[]): string {
  const id = optionValue(args, "--id") ?? args.find((arg) => !arg.startsWith("--") && arg !== "--latest");
  if (!id) throw new Error("Missing required id. Use --id <id>.");
  return id;
}

function optionValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
