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
  });

  it("rejects unknown or malformed action-command options before runtime creation", () => {
    expect(() => parseCliInvocation(["tick", "--anything"])).toThrow("Unknown option");
    expect(() => parseCliInvocation(["run", "--max-ticks"])).toThrow("requires a value");
    expect(() => parseCliInvocation(["run", "--max-ticks", "0"])).toThrow("positive integer");
    expect(() => parseCliInvocation(["connector-canary"])).toThrow("requires --action-id");
  });
});
