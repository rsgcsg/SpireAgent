import { describe, expect, it } from "vitest";
import { RE_PROJECT_ROOT, readRuntimeConfig } from "../src/config/env.js";

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

  it("rejects every legacy connector protocol mode", () => {
    expect(readRuntimeConfig({ STS2_MCP_PROTOCOL: "v2" }).mcp).not.toHaveProperty("protocolMode");
    expect(() => readRuntimeConfig({ STS2_MCP_PROTOCOL: "auto" })).toThrow("v2-only");
    expect(() => readRuntimeConfig({ STS2_MCP_PROTOCOL: "v1" })).toThrow("v2-only");
  });

  it("anchors default local evidence under the Re project, not the caller working directory", () => {
    expect(readRuntimeConfig({}).runtime.dataDir).toBe(`${RE_PROJECT_ROOT}/data/runs`);
    expect(readRuntimeConfig({ AGENT_DATA_DIR: "../external-evidence" }, "/tmp/re-spire-test").runtime.dataDir)
      .toBe("/tmp/external-evidence");
    expect(readRuntimeConfig({ AGENT_DATA_DIR: "/var/tmp/re-spire-evidence" }).runtime.dataDir)
      .toBe("/var/tmp/re-spire-evidence");
  });
});
