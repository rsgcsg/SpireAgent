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

const READ_ONLY_COMMANDS = new Set(["summary", "list", "show", "feedback", "feedback-show", "reviews", "review-show", "generate", "plan"]);
const REVIEW_LEDGER_COMMANDS = new Set(["approve", "reject", "expire"]);
const FORBIDDEN_COMMANDS = new Set(["apply", "promote", "revert"]);

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] && !args[0].startsWith("--") ? args[0] : "summary";
  if (FORBIDDEN_COMMANDS.has(command)) {
    throw new Error(`Learning command '${command}' is intentionally unavailable in P9.1 audit-only mode.`);
  }
  if (!READ_ONLY_COMMANDS.has(command) && !REVIEW_LEDGER_COMMANDS.has(command)) {
    throw new Error(`Unknown learning proposal command: ${command}`);
  }
  const commandArgs = command === args[0] ? args.slice(1) : args;
  const idCommand = command === "show" ||
    command === "feedback-show" ||
    command === "review-show" ||
    REVIEW_LEDGER_COMMANDS.has(command);
  const runDir = resolveRunDir(parseRunArg(commandArgs, !idCommand));
  const proposals = readLearningProposals(runDir);
  const feedback = readReverseScaffoldFeedback(runDir);
  const reviewDecisions = readLearningProposalReviewDecisions(runDir);

  if (command === "summary") {
    printHeader(runDir);
    console.log(`Learning proposal surface: ${formatLearningProposalSurface(buildLearningProposalSurface(proposals))}`);
    console.log(`Learning proposal review decisions: ${formatLearningProposalReviewDecisionSurface(buildLearningProposalReviewDecisionSurface(reviewDecisions))}`);
    console.log(`Reverse scaffold feedback: ${formatReverseScaffoldFeedbackSurface(buildReverseScaffoldFeedbackSurface(feedback))}`);
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
    printHeader(runDir);
    console.log(JSON.stringify(buildLearningProposalShadowOverlayPlan(proposal), null, 2));
    console.log("Shadow overlay plan is read-only: proposalMutationEnabled=false applyPathEnabled=false stablePromotionEnabled=false affectsLiveBehavior=false");
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

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
