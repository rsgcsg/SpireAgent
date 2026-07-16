import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import { DeepSeekDecisionProvider } from "../src/llm/deepseekProvider.js";
import { parseDecisionText, validateDecisionForActions } from "../src/llm/decisionSchema.js";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";
import { buildDecisionPrompt } from "../src/prompting/promptBuilder.js";
import { fixture, TEST_ADAPTER } from "./helpers.js";

describe("prompt contract", () => {
  it("records the complete current state and non-executable action summaries", async () => {
    const envelope = normalizeCurrentState(await fixture("combat"), TEST_ADAPTER);
    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    const prompt = buildDecisionPrompt(envelope.currentState, actions);
    const payload = JSON.parse(prompt.userPrompt) as Record<string, any>;

    expect(prompt.systemPrompt).toContain("Return exactly one JSON object");
    expect(payload.promptSchemaVersion).toBe(3);
    expect(payload.currentStateSchemaVersion).toBe(3);
    expect(payload.contextKind).toBe("combat");
    expect(payload.surfaceKind).toBe("combat_turn");
    expect(payload.actionAuthority).toBe("local_reconstruction");
    expect(payload.currentState.context.kind).toBe("combat");
    expect(payload.currentState.surface.kind).toBe("combat_turn");
    expect(payload.allowedActions).toHaveLength(actions.length);
    expect(payload.allowedActions[0].action).toBeUndefined();
    expect(prompt.userPrompt).not.toContain("DEEPSEEK_API_KEY");
  });
});

describe("strict LLM decision schema", () => {
  it("accepts the exact contract", () => {
    expect(parseDecisionText('{"selectedActionId":"combat:end-turn","reasonBrief":"No useful plays.","confidence":0.7}')).toEqual({
      valid: true,
      decision: { selectedActionId: "combat:end-turn", reasonBrief: "No useful plays.", confidence: 0.7 }
    });
  });

  it("rejects code fences, unknown fields, and out-of-range confidence", () => {
    expect(parseDecisionText('```json\n{"selectedActionId":"x","reasonBrief":"y"}\n```')).toMatchObject({ valid: false, outcome: "invalid_json" });
    expect(parseDecisionText('{"selectedActionId":"x","reasonBrief":"y","extra":true}')).toMatchObject({ valid: false, outcome: "invalid_schema" });
    expect(parseDecisionText('{"selectedActionId":"x","reasonBrief":"y","confidence":2}')).toMatchObject({ valid: false, outcome: "invalid_schema" });
  });

  it("rejects an action id outside the in-memory whitelist", async () => {
    const envelope = normalizeCurrentState(await fixture("card-reward"), TEST_ADAPTER);
    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    expect(validateDecisionForActions({
      requestKind: "primary",
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:00.001Z",
      latencyMs: 1,
      outcome: "valid_json",
      requestBodyRedacted: {},
      requestBodyHash: "sha256:test",
      parsedDecision: { selectedActionId: "invented", reasonBrief: "Invented." }
    }, actions)).toMatchObject({ valid: false, outcome: "unknown_action_id" });
  });
});

describe("DeepSeekDecisionProvider", () => {
  it("uses JSON mode, explicit thinking policy, and one bounded format retry", async () => {
    const requestBodies: Array<Record<string, any>> = [];
    const fetchImpl: typeof fetch = async (_input, init) => {
      requestBodies.push(JSON.parse(String(init?.body)) as Record<string, any>);
      const content = requestBodies.length === 1
        ? ""
        : '{"selectedActionId":"combat:end-turn","reasonBrief":"End safely.","confidence":0.8}';
      return new Response(JSON.stringify({
        choices: [{ finish_reason: "stop", message: { content } }],
        usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
        diagnostic: { authorization: "Bearer provider-secret", nested: "sk-provider-secret" }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    };
    const provider = new DeepSeekDecisionProvider({
      apiKey: "test-secret-never-record",
      baseUrl: "https://example.invalid/chat/completions",
      model: "deepseek-v4-flash",
      timeoutMs: 1_000,
      maxOutputTokens: 320,
      thinkingMode: "disabled"
    }, fetchImpl);

    const session = await provider.decide({
      systemPrompt: "Return JSON.",
      userPrompt: "{}",
      allowedActionIds: ["combat:end-turn"]
    });

    expect(session.attempts).toHaveLength(2);
    expect(session.attempts[0]?.outcome).toBe("empty");
    expect(session.finalAttempt.outcome).toBe("valid_json");
    expect(requestBodies[0]?.response_format).toEqual({ type: "json_object" });
    expect(requestBodies[0]?.thinking).toEqual({ type: "disabled" });
    expect(JSON.stringify(session)).not.toContain("test-secret-never-record");
    expect(JSON.stringify(session)).not.toContain("provider-secret");
    const requestRecord = session.finalAttempt.requestBodyRedacted as Record<string, unknown>;
    expect(requestRecord.max_tokens).toBe(320);
    const providerRecord = session.finalAttempt.rawProviderResponse as { usage?: Record<string, unknown> };
    expect(providerRecord.usage?.prompt_tokens).toBe(10);
  });

  it("classifies finish_reason length as truncation and does not accept partial JSON", async () => {
    const provider = new DeepSeekDecisionProvider({
      apiKey: "test-secret",
      baseUrl: "https://example.invalid/chat/completions",
      model: "deepseek-v4-flash",
      timeoutMs: 1_000,
      maxOutputTokens: 32,
      thinkingMode: "disabled"
    }, async () => new Response(JSON.stringify({
      choices: [{ finish_reason: "length", message: { content: "{\"selectedActionId\":" } }]
    }), { status: 200 }));

    const session = await provider.decide({ systemPrompt: "JSON", userPrompt: "{}", allowedActionIds: ["x"] });
    expect(session.attempts).toHaveLength(2);
    expect(session.finalAttempt.outcome).toBe("truncated");
    expect(session.finalAttempt.parsedDecision).toBeUndefined();
  });
});
