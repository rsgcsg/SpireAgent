import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
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

  it("accepts only Human-Equivalent C and separates assisted from pure mode", () => {
    expect(readRuntimeConfig({ STS2_MCP_PROTOCOL: "he" }).mcp.mode).toBe("he_assisted");
    expect(readRuntimeConfig({ SPIREAGENT_HE_MODE: "he_pure" }).mcp.mode).toBe("he_pure");
    expect(() => readRuntimeConfig({ STS2_MCP_PROTOCOL: "v3" })).toThrow("Human-Equivalent C");
    expect(() => readRuntimeConfig({ SPIREAGENT_HE_MODE: "semantic_auto" })).toThrow("SPIREAGENT_HE_MODE");
  });

  it("uses a bounded read-only Gateway startup wait", () => {
    expect(readRuntimeConfig({}).mcp).toMatchObject({
      startupWaitMs: 60_000,
      startupPollMs: 500
    });
    expect(readRuntimeConfig({ STS2_MCP_STARTUP_WAIT_MS: "0" }).mcp.startupWaitMs).toBe(0);
    expect(() => readRuntimeConfig({ STS2_MCP_STARTUP_POLL_MS: "0" }))
      .toThrow("STS2_MCP_STARTUP_POLL_MS");
  });

  it("anchors default local evidence under the Re project, not the caller working directory", () => {
    expect(readRuntimeConfig({}).runtime.dataDir).toBe(resolve(RE_PROJECT_ROOT, "data/runs"));
    expect(readRuntimeConfig({ AGENT_DATA_DIR: "../external-evidence" }, "/tmp/re-spire-test").runtime.dataDir)
      .toBe(resolve("/tmp/re-spire-test", "../external-evidence"));
    expect(readRuntimeConfig({ AGENT_DATA_DIR: "/var/tmp/re-spire-evidence" }).runtime.dataDir)
      .toBe(resolve("/var/tmp/re-spire-evidence"));
  });

  it("keeps a full-game-sized emergency decision ceiling without making it a success boundary", () => {
    expect(readRuntimeConfig({}).runtime.maxTicks).toBe(1_000);
    expect(readRuntimeConfig({ AGENT_MAX_TICKS: "12" }).runtime.maxTicks).toBe(12);
  });

  it("accepts only an exact Git revision for reproducible run identity", () => {
    const revision = "a".repeat(40);
    const sourceDigest = "b".repeat(64);
    expect(readRuntimeConfig({
      SPIREAGENT_RE_SOURCE_REVISION: revision,
      SPIREAGENT_RE_SOURCE_DIGEST: sourceDigest,
      SPIREAGENT_RE_WORKTREE_STATUS: "dirty"
    }).runtime).toMatchObject({ agentSourceRevision: revision, agentSourceDigest: sourceDigest, agentWorktreeStatus: "dirty" });
    expect(() => readRuntimeConfig({ SPIREAGENT_RE_SOURCE_REVISION: "develop" }))
      .toThrow("SPIREAGENT_RE_SOURCE_REVISION");
    expect(() => readRuntimeConfig({ SPIREAGENT_RE_SOURCE_REVISION: revision }))
      .toThrow("must be recorded together");
  });
});
