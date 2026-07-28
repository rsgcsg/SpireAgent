import { describe, expect, it } from "vitest";
import { classifyRunTermination } from "../src/runtime/runLoop.js";
import type { TickResult } from "../src/runtime/tickOrchestrator.js";

describe("run termination evidence", () => {
  it("separates a completed game from a decision ceiling and runtime failures", () => {
    expect(classifyRunTermination([
      result({ shouldStopRun: true, stopReason: "run_boundary" })
    ], 1000)).toBe("completed_run_boundary");

    expect(classifyRunTermination([
      result({ shouldStopRun: false })
    ], 1)).toBe("stopped_decision_limit");

    expect(classifyRunTermination([
      result({ shouldStopRun: true, outcome: "not_executed_llm_failure" })
    ], 1000)).toBe("stopped_runtime_failure");

    expect(classifyRunTermination([
      result({ shouldStopRun: true, stopReason: "repeated_semantic_transition" })
    ], 1000)).toBe("stopped_runtime_guard");
  });
});

function result(overrides: Partial<TickResult>): TickResult {
  return {
    decisionId: "decision-test",
    outcome: "executed_and_settled",
    shouldStopRun: false,
    ...overrides
  };
}
