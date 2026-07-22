import path from "node:path";
import { evaluateRun } from "./runner.js";

async function main(): Promise<void> {
  const runIdOrPath = parseRunArg(process.argv.slice(2));
  const report = evaluateRun(runIdOrPath);
  const focusedWarnings = report.warnings.filter(
    (warning) => warning.actionable || warning.severity === "risk" || warning.category === "strategy_quality"
  );
  console.log(
    JSON.stringify(
      {
        status: report.status,
        run: path.basename(report.summary.runDir),
        summary: report.summary,
        warningSummary: report.warningSummary,
        strategyMetrics: report.strategyMetrics,
        errors: report.errors,
        warnings: focusedWarnings
      },
      null,
      2
    )
  );
  if (report.status === "FAIL") {
    process.exitCode = 1;
  }
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
