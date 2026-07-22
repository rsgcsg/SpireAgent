import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { auditPromptArtifacts } from "../src/prompting/promptAudit.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("Prompt Information Audit", () => {
  it("reports aggregate prompt shape without returning prompt content", async () => {
    const root = await temporaryRunRoot();
    await writePrompt(root, "run-001", "decision-a", {
      userPromptBytes: 200,
      payload: {
        contextKind: "combat",
        surfaceKind: "combat_turn",
        currentState: {
          player: { runDeck: [{ id: "strike" }], drawPile: [] },
          bridgeInspectionFacts: { runDeck: [{ id: "strike" }], drawPile: [] },
          surface: { kind: "combat_turn", legalActions: [{ id: "surface:play" }] },
          bridgeDiagnostics: [{ code: "known" }]
        },
        allowedActions: [{ id: "prompt:play" }]
      }
    });
    await writePrompt(root, "run-002", "decision-b", {
      userPromptBytes: 100,
      payload: {
        contextKind: "rest",
        surfaceKind: "rest_site",
        currentState: { player: { hp: 20 }, surface: { kind: "rest_site", legalActions: [] } },
        allowedActions: []
      }
    });
    await writeMalformedPrompt(root, "run-002", "broken");

    const result = await auditPromptArtifacts(root);

    expect(result.source).toBe("local_prompt_artifacts_read_only");
    expect(result.promptCount).toBe(2);
    expect(result.malformedArtifactCount).toBe(1);
    expect(result.userPromptBytes).toEqual({ min: 100, median: 100, p95: 100, max: 200 });
    expect(result.duplicateCandidates).toMatchObject({
      playerAndInspectionRunDeck: 1,
      playerAndInspectionDrawPile: 1,
      surfaceAndPayloadActionMenus: 1
    });
    expect(result.shadowProjection).toMatchObject({
      projectionVersion: 1,
      comparablePromptCount: 2,
      omittedEvidenceFieldCounts: {
        bridgeDiagnostics: 1,
        bridgeInspectionFacts: 1,
        "surface.legalActions": 2
      },
      deduplicatedFactGroupCounts: {
        "player.runDeck=inspection.runDeck": 1,
        "player.drawPile=inspection.drawPile": 1
      }
    });
    expect(JSON.stringify(result)).not.toContain("prompt:play");
    expect(result.bySurface).toEqual(expect.arrayContaining([
      expect.objectContaining({ contextKind: "combat", surfaceKind: "combat_turn", promptCount: 1 }),
      expect.objectContaining({ contextKind: "rest", surfaceKind: "rest_site", promptCount: 1 })
    ]));
  });

  it("limits sorted runs or reads an exact run without accepting missing runs", async () => {
    const root = await temporaryRunRoot();
    await writePrompt(root, "run-001", "one", minimalArtifact(10));
    await writePrompt(root, "run-002", "two", minimalArtifact(20));

    await expect(auditPromptArtifacts(root, { runId: "run-missing" })).rejects.toThrow("Run not found");
    await expect(auditPromptArtifacts(root, { runId: "run-001" })).resolves.toMatchObject({
      runIds: ["run-001"],
      promptCount: 1,
      userPromptBytes: { max: 10 }
    });
    await expect(auditPromptArtifacts(root, { limitRuns: 1 })).resolves.toMatchObject({
      runIds: ["run-002"],
      promptCount: 1,
      userPromptBytes: { max: 20 }
    });
  });
});

function minimalArtifact(userPromptBytes: number): Record<string, unknown> {
  return {
    userPromptBytes,
    payload: {
      contextKind: "map",
      surfaceKind: "map_navigation",
      currentState: { surface: { kind: "map_navigation", legalActions: [] } },
      allowedActions: []
    }
  };
}

async function temporaryRunRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "re-spire-prompt-audit-"));
  temporaryRoots.push(root);
  return root;
}

async function writePrompt(root: string, runId: string, decisionId: string, payload: Record<string, unknown>): Promise<void> {
  const dir = join(root, runId, "prompts");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${decisionId}.prompt.json`), JSON.stringify(payload), "utf8");
}

async function writeMalformedPrompt(root: string, runId: string, decisionId: string): Promise<void> {
  const dir = join(root, runId, "prompts");
  await writeFile(join(dir, `${decisionId}.prompt.json`), "not-json", "utf8");
}
