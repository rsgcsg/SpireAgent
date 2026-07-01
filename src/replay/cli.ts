import path from "node:path";
import { buildReplayCognitiveCoverage, buildReplayTimeline, formatReplayCognitiveCoverage, formatReplayTimeline, readReplayRun } from "./reader.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] && !args[0].startsWith("--") ? args[0] : "timeline";
  const runIdOrPath = parseRunArg(command === "timeline" ? args.slice(command === args[0] ? 1 : 0) : args);

  if (command !== "timeline") {
    throw new Error(`Unknown replay command: ${command}`);
  }

  const run = readReplayRun(runIdOrPath);
  const timeline = buildReplayTimeline(run.transitions);
  const cognitiveCoverage = buildReplayCognitiveCoverage(run.transitions);
  console.log(`Run: ${path.basename(run.runDir)}`);
  console.log(`Transitions: ${run.transitions.length}`);
  console.log(`Cognitive coverage: ${formatReplayCognitiveCoverage(cognitiveCoverage)}`);
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
