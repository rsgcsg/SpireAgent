import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { compareRecordedPromptWithShadow, repeatRecordedPromptVariant } from "../src/prompting/promptShadowComparison.js";
import type { LlmDecisionProvider, LlmDecisionRequest, LlmDecisionSession } from "../src/llm/types.js";
import { stateHash } from "../src/runtime/stateHash.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("recorded prompt shadow comparison", () => {
  it("compares full and deterministic shadow prompts without opening a Gateway or writing an artifact", async () => {
    const root = await mkdtemp(join(tmpdir(), "re-spire-prompt-compare-"));
    temporaryRoots.push(root);
    const runId = "run-001";
    const decisionId = "decision-001";
    const prompts = join(root, runId, "prompts");
    await mkdir(prompts, { recursive: true });
    const payload = {
      contextKind: "combat",
      surfaceKind: "combat_turn",
      actionAuthority: "bridge_advertised",
      currentState: {
        player: { runDeck: [{ id: "STRIKE" }] },
        bridgeInspectionFacts: { runDeck: [{ id: "STRIKE" }] },
        bridgeVisibility: { playerVisibleClosureStatus: "complete" },
        surface: { kind: "combat_turn", legalActions: [{ id: "surface-end" }] }
      },
      allowedActions: [{ id: "action:end", kind: "end_turn", label: "End turn" }]
    };
    const userPrompt = JSON.stringify(payload);
    const path = join(prompts, `${decisionId}.prompt.json`);
    await writeFile(path, JSON.stringify({ systemPrompt: "Return JSON.", userPrompt, payload }), "utf8");
    const before = await readFile(path, "utf8");

    const result = await compareRecordedPromptWithShadow({ dataRoot: root, runId, decisionId }, fakeProvider());

    expect(result.source).toBe("recorded_prompt_provider_shadow_no_execution");
    expect(result.full.finalOutcome).toBe("valid_json");
    expect(result.shadow.finalOutcome).toBe("valid_json");
    expect(result.comparison).toMatchObject({ bothFinalAttemptsValid: true, selectedActionAgreement: true });
    // Small states are a counterexample: projection metadata can cost more
    // than it removes, so callers must use the signed byte delta.
    expect(result.comparison.savedUserPromptBytes).toBeLessThan(0);
    expect(result.shadow.projectionHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.shadow.omittedEvidenceFields).toContain("bridgeInspectionFacts");
    expect(await readFile(path, "utf8")).toBe(before);
  });

  it("refuses an artifact whose payload does not match the recorded prompt", async () => {
    const root = await mkdtemp(join(tmpdir(), "re-spire-prompt-compare-"));
    temporaryRoots.push(root);
    const prompts = join(root, "run-001", "prompts");
    await mkdir(prompts, { recursive: true });
    await writeFile(join(prompts, "decision-001.prompt.json"), JSON.stringify({
      systemPrompt: "Return JSON.",
      userPrompt: JSON.stringify({ contextKind: "map", surfaceKind: "map_navigation", actionAuthority: "bridge_advertised", currentState: {}, allowedActions: [] }),
      payload: { contextKind: "combat", surfaceKind: "combat_turn", actionAuthority: "bridge_advertised", currentState: {}, allowedActions: [] }
    }), "utf8");

    await expect(compareRecordedPromptWithShadow({
      dataRoot: root,
      runId: "run-001",
      decisionId: "decision-001"
    }, fakeProvider())).rejects.toThrow("payload disagrees with userPrompt");
  });

  it("reports a bounded full-prompt repeat baseline without writing evidence", async () => {
    const root = await mkdtemp(join(tmpdir(), "re-spire-prompt-repeat-"));
    temporaryRoots.push(root);
    const prompts = join(root, "run-001", "prompts");
    await mkdir(prompts, { recursive: true });
    const payload = {
      contextKind: "map",
      surfaceKind: "map_navigation",
      actionAuthority: "bridge_advertised",
      currentState: { surface: { kind: "map_navigation", legalActions: [] } },
      allowedActions: [{ id: "action:map", kind: "choose_map_node", label: "Choose node" }]
    };
    const path = join(prompts, "decision-001.prompt.json");
    await writeFile(path, JSON.stringify({ systemPrompt: "Return JSON.", userPrompt: JSON.stringify(payload), payload }), "utf8");

    const result = await repeatRecordedPromptVariant({
      dataRoot: root,
      runId: "run-001",
      decisionId: "decision-001",
      sampleCount: 3,
      variant: "full"
    }, fakeProvider());

    expect(result.source).toBe("recorded_prompt_provider_repeat_no_execution");
    expect(result.variant).toBe("full");
    expect(result.samples).toHaveLength(3);
    expect(result.summary).toEqual({
      allFinalAttemptsValid: true,
      uniqueSelectedActionCount: 1,
      selectedActionCounts: { "action:map": 3 }
    });
    const shadowResult = await repeatRecordedPromptVariant({
      dataRoot: root,
      runId: "run-001",
      decisionId: "decision-001",
      sampleCount: 2,
      variant: "shadow"
    }, fakeProvider());
    expect(shadowResult.variant).toBe("shadow");
    expect(shadowResult.projectionHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(shadowResult.samples[0]!.userPromptBytes).toBeGreaterThan(0);
    await expect(repeatRecordedPromptVariant({
      dataRoot: root,
      runId: "run-001",
      decisionId: "decision-001",
      sampleCount: 1,
      variant: "shadow"
    }, fakeProvider())).rejects.toThrow("sampleCount must be an integer from 2 through 5");
  });
});

function fakeProvider(): LlmDecisionProvider {
  return {
    describe: () => ({ provider: "deepseek", model: "fake", thinkingMode: "disabled", maxOutputTokens: 32 }),
    decide: async (request: LlmDecisionRequest): Promise<LlmDecisionSession> => {
      const selectedActionId = request.allowedActionIds[0]!;
      const finalAttempt = {
        requestKind: "primary" as const,
        startedAt: "2026-07-22T00:00:00.000Z",
        completedAt: "2026-07-22T00:00:00.001Z",
        latencyMs: 1,
        outcome: "valid_json" as const,
        requestBodyRedacted: {},
        requestBodyHash: stateHash(request.userPrompt),
        parsedDecision: { selectedActionId, reasonBrief: "Fixture decision." }
      };
      return { provider: "deepseek", model: "fake", attempts: [finalAttempt], finalAttempt };
    }
  };
}
