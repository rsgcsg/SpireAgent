import { describe, expect, it } from "vitest";
import { readRuntimeConfig } from "../src/config/env.js";

describe("runtime evidence provenance", () => {
  it("defaults to unrecorded and accepts an explicit coverage label", () => {
    expect(readRuntimeConfig({}).runtime.evidenceProvenance).toBe("unrecorded");
    expect(readRuntimeConfig({ AGENT_EVIDENCE_PROVENANCE: "operator_positioned" }).runtime.evidenceProvenance)
      .toBe("operator_positioned");
  });

  it("rejects undeclared provenance labels", () => {
    expect(() => readRuntimeConfig({ AGENT_EVIDENCE_PROVENANCE: "organic_enough" }))
      .toThrow("AGENT_EVIDENCE_PROVENANCE");
  });
});
