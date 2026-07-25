import { describe, expect, it } from "vitest";
import { parseCliInvocation } from "../src/app/cliArgs.js";

describe("CLI invocation parsing", () => {
  it("makes help non-actionable even after an action command", () => {
    expect(parseCliInvocation(["tick", "--help"])).toEqual({ command: "help" });
    expect(parseCliInvocation(["run", "-h"])).toEqual({ command: "help" });
  });

  it("accepts only declared tick and run options", () => {
    expect(parseCliInvocation(["tick", "--dry-run"])).toEqual({ command: "tick", dryRun: true });
    expect(parseCliInvocation(["run", "--max-ticks", "5", "--delay-ms", "25"])).toEqual({
      command: "run",
      dryRun: false,
      maxTicks: 5,
      delayMs: 25
    });
    expect(parseCliInvocation(["connector-canary", "--action-id", "action_123"])).toEqual({
      command: "connector-canary",
      actionId: "action_123"
    });
    expect(parseCliInvocation(["prompt-audit", "--run-id", "run_123"])).toEqual({
      command: "prompt-audit",
      runId: "run_123"
    });
    expect(parseCliInvocation(["prompt-audit", "--limit-runs", "5"])).toEqual({
      command: "prompt-audit",
      limitRuns: 5
    });
    expect(parseCliInvocation(["prompt-shadow-compare", "--run-id", "run_123", "--decision-id", "decision_456"])).toEqual({
      command: "prompt-shadow-compare",
      runId: "run_123",
      decisionId: "decision_456"
    });
    expect(parseCliInvocation(["prompt-repeat-baseline", "--run-id", "run_123", "--decision-id", "decision_456", "--samples", "3"])).toEqual({
      command: "prompt-repeat-baseline",
      runId: "run_123",
      decisionId: "decision_456",
      samples: 3,
      variant: "full"
    });
  });

  it("rejects unknown or malformed action-command options before runtime creation", () => {
    expect(() => parseCliInvocation(["tick", "--anything"])).toThrow("Unknown option");
    expect(() => parseCliInvocation(["run", "--max-ticks"])).toThrow("requires a value");
    expect(() => parseCliInvocation(["run", "--max-ticks", "0"])).toThrow("positive integer");
    expect(() => parseCliInvocation(["connector-canary"])).toThrow("requires --action-id");
    expect(() => parseCliInvocation(["prompt-audit", "--limit-runs", "0"])).toThrow("positive integer");
    expect(() => parseCliInvocation(["prompt-shadow-compare", "--run-id", "run_123"])).toThrow("requires --run-id and --decision-id");
    expect(() => parseCliInvocation(["prompt-repeat-baseline", "--run-id", "run_123", "--decision-id", "decision_456", "--samples", "1"])).toThrow("integer from 2 through 5");
    expect(() => parseCliInvocation(["prompt-repeat-baseline", "--run-id", "run_123", "--decision-id", "decision_456", "--samples", "3", "--variant", "both"])).toThrow("--variant must be full or shadow");
  });
});
