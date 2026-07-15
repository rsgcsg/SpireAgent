import type { RuntimeConfig } from "../config/env.js";
import { stateHash } from "../runtime/stateHash.js";
import { isJsonValue, type JsonObject, type JsonValue } from "../shared/json.js";
import { parseDecisionText } from "./decisionSchema.js";
import { redactJson, redactText } from "./redaction.js";
import type {
  LlmDecisionAttempt,
  LlmDecisionProvider,
  LlmDecisionRequest,
  LlmDecisionSession,
  LlmUsage
} from "./types.js";

export class DeepSeekDecisionProvider implements LlmDecisionProvider {
  constructor(
    private readonly config: RuntimeConfig["deepseek"],
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  describe(): { provider: "deepseek"; model: string; thinkingMode: "enabled" | "disabled"; maxOutputTokens: number } {
    return {
      provider: "deepseek",
      model: this.config.model,
      thinkingMode: this.config.thinkingMode,
      maxOutputTokens: this.config.maxOutputTokens
    };
  }

  async decide(request: LlmDecisionRequest): Promise<LlmDecisionSession> {
    if (!this.config.apiKey.trim()) throw new Error("DEEPSEEK_API_KEY is required for agent decisions");
    const attempts: LlmDecisionAttempt[] = [];
    const primary = await this.requestOnce(request, "primary");
    attempts.push(primary);

    if (["empty", "truncated", "invalid_json", "invalid_schema"].includes(primary.outcome)) {
      attempts.push(await this.requestOnce(request, "format_retry"));
    }

    const finalAttempt = attempts.at(-1)!;
    return { provider: "deepseek", model: this.config.model, attempts, finalAttempt };
  }

  private async requestOnce(request: LlmDecisionRequest, requestKind: "primary" | "format_retry"): Promise<LlmDecisionAttempt> {
    const systemPrompt =
      requestKind === "primary"
        ? request.systemPrompt
        : `${request.systemPrompt}\n\nFORMAT RETRY: Return one complete JSON object only. Keep reasonBrief short.`;
    const body: JsonObject = {
      model: this.config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: request.userPrompt }
      ],
      response_format: { type: "json_object" },
      thinking: { type: this.config.thinkingMode },
      temperature: 0,
      top_p: 0.1,
      max_tokens: this.config.maxOutputTokens,
      stream: false
    };
    const requestBodyRedacted = redactJson(body);
    const startedAt = new Date().toISOString();
    const started = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await this.fetchImpl(this.config.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const rawText = await response.text();
      const rawProviderResponse = parseProviderBody(rawText);
      const common = {
        requestKind,
        startedAt,
        completedAt: new Date().toISOString(),
        latencyMs: Date.now() - started,
        requestBodyRedacted,
        requestBodyHash: stateHash(requestBodyRedacted),
        rawProviderResponse,
        httpStatus: response.status
      } as const;
      if (!response.ok) {
        return {
          ...common,
          outcome: "provider_error",
          error: `DeepSeek HTTP ${response.status}: ${safeProviderError(rawProviderResponse)}`
        };
      }

      const extracted = extractChoice(rawProviderResponse);
      if (!extracted) {
        return { ...common, outcome: "provider_error", error: "DeepSeek response did not contain choices[0].message" };
      }
      const usage = extractUsage(rawProviderResponse);
      if (extracted.finishReason === "length") {
        return {
          ...common,
          outcome: "truncated",
          rawResponseText: extracted.content,
          finishReason: extracted.finishReason,
          ...(usage ? { usage } : {}),
          error: "DeepSeek response ended with finish_reason=length"
        };
      }
      const parsed = parseDecisionText(extracted.content);
      if (!parsed.valid) {
        return {
          ...common,
          outcome: parsed.outcome,
          rawResponseText: extracted.content,
          ...(extracted.finishReason ? { finishReason: extracted.finishReason } : {}),
          ...(usage ? { usage } : {}),
          error: parsed.error
        };
      }
      return {
        ...common,
        outcome: "valid_json",
        rawResponseText: extracted.content,
        parsedDecision: parsed.decision,
        ...(extracted.finishReason ? { finishReason: extracted.finishReason } : {}),
        ...(usage ? { usage } : {})
      };
    } catch (error) {
      const completedAt = new Date().toISOString();
      const latencyMs = Date.now() - started;
      if (error instanceof Error && error.name === "AbortError") {
        return {
          requestKind,
          startedAt,
          completedAt,
          latencyMs,
          outcome: "timeout",
          requestBodyRedacted,
          requestBodyHash: stateHash(requestBodyRedacted),
          error: `DeepSeek request timed out after ${this.config.timeoutMs}ms`
        };
      }
      return {
        requestKind,
        startedAt,
        completedAt,
        latencyMs,
        outcome: "provider_error",
        requestBodyRedacted,
        requestBodyHash: stateHash(requestBodyRedacted),
        error: redactText(error instanceof Error ? error.message : String(error)).slice(0, 500)
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseProviderBody(text: string): JsonValue | string {
  try {
    const parsed = JSON.parse(text) as unknown;
    return isJsonValue(parsed) ? redactJson(parsed) : redactText(text).slice(0, 4_000);
  } catch {
    return redactText(text).slice(0, 4_000);
  }
}

function extractChoice(value: JsonValue | string): { content: string; finishReason?: string } | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const choices = value.choices;
  if (!Array.isArray(choices) || choices.length === 0) return undefined;
  const choice = choices[0];
  if (typeof choice !== "object" || choice === null || Array.isArray(choice)) return undefined;
  const message = choice.message;
  if (typeof message !== "object" || message === null || Array.isArray(message)) return undefined;
  const content = typeof message.content === "string" ? message.content : "";
  const finishReason = typeof choice.finish_reason === "string" ? choice.finish_reason : undefined;
  return { content, ...(finishReason ? { finishReason } : {}) };
}

function extractUsage(value: JsonValue | string): LlmUsage | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const usage = value.usage;
  if (typeof usage !== "object" || usage === null || Array.isArray(usage)) return undefined;
  const promptTokens = numberValue(usage.prompt_tokens);
  const completionTokens = numberValue(usage.completion_tokens);
  const totalTokens = numberValue(usage.total_tokens);
  if (promptTokens === undefined && completionTokens === undefined && totalTokens === undefined) return undefined;
  return {
    ...(promptTokens !== undefined ? { promptTokens } : {}),
    ...(completionTokens !== undefined ? { completionTokens } : {}),
    ...(totalTokens !== undefined ? { totalTokens } : {})
  };
}

function numberValue(value: JsonValue | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function safeProviderError(value: JsonValue | string): string {
  return redactText(typeof value === "string" ? value : JSON.stringify(value)).slice(0, 500);
}
