import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { RE_PROJECT_ROOT, readDataDirectory, readRuntimeConfig } from "../src/config/env.js";

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

  it("has one Player Environment path and rejects retired mode selectors", () => {
    expect(readRuntimeConfig({}).connector.baseUrl).toBe("http://localhost:15526");
    expect(() => readRuntimeConfig({ STS2_MCP_PROTOCOL: "he" }))
      .toThrow("retired");
    expect(() => readRuntimeConfig({ SPIREAGENT_HE_MODE: "he_pure" }))
      .toThrow("retired");
  });

  it("uses a bounded read-only connector startup wait", () => {
    expect(readRuntimeConfig({}).connector).toMatchObject({
      startupWaitMs: 60_000,
      startupPollMs: 500
    });
    expect(readRuntimeConfig({ STS2_CONNECTOR_STARTUP_WAIT_MS: "0" }).connector.startupWaitMs).toBe(0);
    expect(() => readRuntimeConfig({ STS2_CONNECTOR_STARTUP_POLL_MS: "0" }))
      .toThrow("STS2_CONNECTOR_STARTUP_POLL_MS");
  });

  it("anchors default local evidence under the Re project, not the caller working directory", () => {
    expect(readRuntimeConfig({}).runtime.dataDir).toBe(resolve(RE_PROJECT_ROOT, "data/runs"));
    expect(readRuntimeConfig({ AGENT_DATA_DIR: "../external-evidence" }, "/tmp/re-spire-test").runtime.dataDir)
      .toBe(resolve("/tmp/re-spire-test", "../external-evidence"));
    expect(readRuntimeConfig({ AGENT_DATA_DIR: "/var/tmp/re-spire-evidence" }).runtime.dataDir)
      .toBe(resolve("/var/tmp/re-spire-evidence"));
  });

  it("lets offline evidence commands locate runs without parsing live connector settings", () => {
    expect(readDataDirectory({
      AGENT_DATA_DIR: "runs",
      STS2_MCP_PROTOCOL: "retired-local-value"
    }, "/tmp/re-spire-test")).toBe(resolve("/tmp/re-spire-test", "runs"));
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
