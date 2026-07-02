import { RestGameClient } from "./client.js";
import { AgentController } from "./controller.js";
import { AgentDecisionRecorder } from "./decisionRecorder.js";
import { createLlmDecider, createP8WorkspaceDecider } from "./llm.js";
import { MemoryManager } from "./memory.js";
import { buildReviewReport } from "./review.js";

async function main(): Promise<void> {
  const command = process.argv[2] ?? "tick";
  const args = new Set(process.argv.slice(3));
  const client = new RestGameClient();
  const memory = new MemoryManager();
  const llm = createLlmDecider();
  const workspaceLlm = createP8WorkspaceDecider();
  const recorder = new AgentDecisionRecorder();
  const controller = new AgentController(client, memory, llm, recorder, workspaceLlm);

  if (command === "tick") {
    const result = await controller.tick({
      dryRun: args.has("--dry-run"),
      forceLlm: args.has("--llm")
    });
    printTick(result);
    return;
  }

  if (command === "run") {
    const maxTicks = numberArg("--max-ticks", 500);
    const delayMs = numberArg("--delay-ms", 120);
    let actions = 0;
    let polls = 0;
    while (actions < maxTicks && polls < maxTicks * 20) {
      polls += 1;
      const result = await controller.tick({
        dryRun: args.has("--dry-run"),
        forceLlm: args.has("--llm")
      });
      if (result.chosenBy !== "none") {
        actions += 1;
        printTick(result);
      } else if (polls % 10 === 0) {
        console.log(JSON.stringify({ message: result.message, waiting: true }, null, 2));
      }
      if (result.state.screen === "game_over" && !result.executed) {
        break;
      }
      await sleep(result.chosenBy === "none" ? Math.max(delayMs, 300) : delayMs);
    }
    return;
  }

  if (command === "review") {
    const report = args.has("--full")
      ? {
          run: memory.run,
          strategy: memory.strategy,
          recentLessons: memory.longTerm.lessons.slice(-10),
          recentRuns: memory.longTerm.runs.slice(-10)
        }
      : buildReviewReport(memory);
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function printTick(result: Awaited<ReturnType<AgentController["tick"]>>): void {
  console.log(
    JSON.stringify(
      {
        message: result.message,
        chosenBy: result.chosenBy,
        executed: result.executed,
        action: result.chosen?.action,
        route: result.route,
        routeReasons: result.routeReasons,
        fallbackReason: result.fallbackReason,
        fallbackPolicy: result.fallbackPolicy,
        llm: result.llm
          ? {
              wanted: result.llm.wanted,
              called: result.llm.called,
              available: result.llm.available,
              outcome: result.llm.outcome,
              promptBytes: result.llm.promptBytes,
              candidatesSent: result.llm.candidatesSent,
              candidateId: result.llm.candidateId,
              error: result.llm.error
            }
          : undefined,
        checkpoint: result.checkpoint
          ? {
              kind: result.checkpoint.kind,
              reasons: result.checkpoint.reasons,
              settled: result.checkpoint.settled,
              polls: result.checkpoint.polls,
              before: result.checkpoint.before,
              after: result.checkpoint.after
            }
          : undefined,
        score: result.chosen?.score,
        confidence: result.chosen?.confidence,
        reasons: result.chosen?.reasons,
        risks: result.chosen?.risks
      },
      null,
      2
    )
  );
}

function numberArg(name: string, fallback: number): number {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) ? value : fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
