import { spawn } from "node:child_process";
import type { LlmDecision } from "./types.js";
import { isRecord } from "./utils.js";

export interface LlmDecider {
  isAvailable?(): boolean;
  decide(prompt: string): Promise<LlmDecision | null>;
}

export class NoopLlmDecider implements LlmDecider {
  isAvailable(): boolean {
    return false;
  }

  async decide(): Promise<LlmDecision | null> {
    return null;
  }
}

export class CommandJsonLlmDecider implements LlmDecider {
  constructor(private readonly commandLine = process.env.STS2_LLM_COMMAND ?? "") {}

  isAvailable(): boolean {
    return Boolean(this.commandLine.trim());
  }

  async decide(prompt: string): Promise<LlmDecision | null> {
    if (!this.commandLine.trim()) {
      return null;
    }

    const [command, ...args] = splitCommand(this.commandLine);
    if (!command) {
      return null;
    }

    const output = await runCommand(command, args, prompt);
    return parseJsonDecision(output);
  }
}

export interface DeepSeekV4FlashConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  retryLimit?: number;
  emptyContentRetryLimit?: number;
  outputMode?: DeepSeekResponseMode;
  temperature?: number;
  topP?: number;
  fetchImpl?: typeof fetch;
}

export type DeepSeekResponseMode = "json_mode" | "non_json_strict";

export interface DeepSeekWorkspaceDecision extends LlmDecision {
  riskTags?: string[];
  missingInfo?: string[];
  scaffoldFeedback?: string[];
  providerAudit?: {
    contentKind: string;
    contentPreview?: string;
    contentBytes?: number;
    parseState?: string;
    requestMode?: DeepSeekResponseMode;
    retryCount?: number;
    emptyContentRetryCount?: number;
    emptyContentRetrySucceeded?: boolean;
  };
  providerMetadata?: {
    provider: "deepseek";
    model: string;
    latencyMs: number;
    maxOutputTokens: number;
    requestMode?: DeepSeekResponseMode;
    temperature?: number;
    topP?: number;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}

export class DeepSeekV4FlashDecider implements LlmDecider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxOutputTokens: number;
  private readonly retryLimit: number;
  private readonly emptyContentRetryLimit: number;
  private readonly outputMode: DeepSeekResponseMode;
  private readonly temperature: number;
  private readonly topP: number;
  private readonly fetchImpl: typeof fetch;

  constructor(config: DeepSeekV4FlashConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.STS2_DEEPSEEK_API_KEY ?? "";
    this.baseUrl = config.baseUrl ?? process.env.STS2_DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/chat/completions";
    this.model = config.model ?? process.env.STS2_DEEPSEEK_MODEL ?? "deepseek-v4-flash";
    this.timeoutMs = config.timeoutMs ?? numberFromEnv("STS2_DEEPSEEK_TIMEOUT_MS", 25000);
    this.maxOutputTokens = config.maxOutputTokens ?? numberFromEnv("STS2_DEEPSEEK_MAX_OUTPUT_TOKENS", 400);
    this.retryLimit = config.retryLimit ?? numberFromEnv("STS2_DEEPSEEK_RETRY_LIMIT", 0);
    this.emptyContentRetryLimit = clampRetryLimit(config.emptyContentRetryLimit ?? numberFromEnv("STS2_DEEPSEEK_EMPTY_RETRY_LIMIT", 1), 1);
    this.outputMode = config.outputMode ?? resolveDeepSeekResponseMode(process.env.STS2_DEEPSEEK_OUTPUT_MODE, process.env.STS2_DEEPSEEK_JSON_MODE);
    this.temperature = config.temperature ?? numberFromEnv("STS2_DEEPSEEK_TEMPERATURE", 0);
    this.topP = config.topP ?? numberFromEnv("STS2_DEEPSEEK_TOP_P", 0.1);
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey.trim());
  }

  async decide(prompt: string): Promise<DeepSeekWorkspaceDecision | null> {
    if (!this.isAvailable()) return null;
    let lastError: unknown;
    let emptyContentRetryCount = 0;
    for (let attempt = 0; attempt <= this.retryLimit; attempt += 1) {
      try {
        for (let rescue = 0; rescue <= this.emptyContentRetryLimit; rescue += 1) {
          const requestKind = rescue > 0 ? "rescue" : "primary";
          const result = await this.requestDecision(prompt, requestKind);
          const auditBase = {
            ...result.audit,
            requestMode: this.outputMode,
            retryCount: rescue,
            emptyContentRetryCount,
            emptyContentRetrySucceeded: false
          } satisfies NonNullable<DeepSeekWorkspaceDecision["providerAudit"]>;
          if (result.audit.contentKind === "empty") {
            if (rescue < this.emptyContentRetryLimit) {
              emptyContentRetryCount += 1;
              continue;
            }
            return {
              candidateId: "",
              providerAudit: {
                ...auditBase,
                parseState: emptyContentRetryCount > 0 ? "empty_content_after_retry" : "empty_content"
              },
              providerMetadata: {
                provider: "deepseek",
                model: this.model,
                latencyMs: result.latencyMs,
                maxOutputTokens: this.maxOutputTokens,
                requestMode: this.outputMode,
                temperature: this.temperature,
                topP: this.topP,
                usage: result.usage
              }
            };
          }
          let decision: DeepSeekWorkspaceDecision | null;
          try {
            decision = parseWorkspaceJsonDecision(result.content);
          } catch (error) {
            return {
              candidateId: "",
              reason: error instanceof Error ? error.message.slice(0, 160) : String(error).slice(0, 160),
              providerAudit: {
                ...auditBase,
                parseState: classifyWorkspaceParseFailure(error)
              },
              providerMetadata: {
                provider: "deepseek",
                model: this.model,
                latencyMs: result.latencyMs,
                maxOutputTokens: this.maxOutputTokens,
                requestMode: this.outputMode,
                temperature: this.temperature,
                topP: this.topP,
                usage: result.usage
              }
            };
          }
          if (!decision) {
            return {
              candidateId: "",
              providerAudit: {
                ...auditBase,
                parseState: emptyContentRetryCount > 0 ? "empty_content_after_retry" : "empty_content"
              },
              providerMetadata: {
                provider: "deepseek",
                model: this.model,
                latencyMs: result.latencyMs,
                maxOutputTokens: this.maxOutputTokens,
                requestMode: this.outputMode,
                temperature: this.temperature,
                topP: this.topP,
                usage: result.usage
              }
            };
          }
          decision.providerAudit = {
            ...auditBase,
            parseState: emptyContentRetryCount > 0 ? "parsed_after_empty_retry" : "parsed",
            emptyContentRetrySucceeded: emptyContentRetryCount > 0
          };
          decision.providerMetadata = {
            provider: "deepseek",
            model: this.model,
            latencyMs: result.latencyMs,
            maxOutputTokens: this.maxOutputTokens,
            requestMode: this.outputMode,
            temperature: this.temperature,
            topP: this.topP,
            usage: result.usage
          };
          return decision;
        }
      } catch (error) {
        lastError = error;
        if (attempt >= this.retryLimit) break;
      }
    }
    throw normalizeDeepSeekError(lastError, this.timeoutMs);
  }

  private async requestDecision(
    prompt: string,
    requestKind: "primary" | "rescue"
  ): Promise<{
    content: string;
    audit: NonNullable<DeepSeekWorkspaceDecision["providerAudit"]>;
    usage: NonNullable<DeepSeekWorkspaceDecision["providerMetadata"]>["usage"];
    latencyMs: number;
  }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const startedAt = Date.now();
    try {
      const response = await this.fetchImpl(this.baseUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(buildDeepSeekRequestBody({
          model: this.model,
          maxOutputTokens: this.maxOutputTokens,
          temperature: this.temperature,
          topP: this.topP,
          outputMode: this.outputMode,
          requestKind,
          prompt
        })),
        signal: controller.signal
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`DeepSeek request failed ${response.status}: ${redactSecrets(text).slice(0, 240)}`);
      }
      const json = await response.json();
      const content = extractDeepSeekContent(json);
      return {
        content,
        audit: createContentAudit(content),
        usage: extractDeepSeekUsage(json),
        latencyMs: Date.now() - startedAt
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createDeepSeekV4FlashDecider(config: DeepSeekV4FlashConfig = {}): DeepSeekV4FlashDecider {
  return new DeepSeekV4FlashDecider(config);
}

export function createP8WorkspaceDecider(): LlmDecider {
  return new DeepSeekV4FlashDecider();
}

export function createLlmDecider(): LlmDecider {
  if (process.env.STS2_LLM_COMMAND?.trim()) {
    return new CommandJsonLlmDecider();
  }

  return new NoopLlmDecider();
}

export interface LlmDecisionValidation {
  valid: boolean;
  outcome?: "invalid_output" | "invalid_choice";
  error?: string;
}

export function validateLlmDecisionForCandidates(
  decision: LlmDecision | null,
  candidates: Array<{ id: string }>
): LlmDecisionValidation {
  if (!decision || typeof decision !== "object") {
    return { valid: false, outcome: "invalid_output", error: "LLM decision is empty or not an object" };
  }
  if (typeof decision.candidateId !== "string" || decision.candidateId.trim() === "") {
    return { valid: false, outcome: "invalid_output", error: "LLM decision missing candidateId" };
  }
  if (!candidates.some((candidate) => candidate.id === decision.candidateId)) {
    return {
      valid: false,
      outcome: "invalid_choice",
      error: `LLM candidateId not found: ${decision.candidateId}`
    };
  }
  return { valid: true };
}

function runCommand(command: string, args: string[], stdin: string): Promise<string> {
  const timeoutMs = Number(process.env.STS2_LLM_TIMEOUT_MS || 45000);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: false
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`LLM command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`LLM command exited ${code}: ${stderr}`));
        return;
      }
      resolve(stdout.trim());
    });

    child.stdin.write(stdin);
    child.stdin.end();
  });
}

function parseJsonDecision(output: string): LlmDecision | null {
  const trimmed = output.trim();
  if (!trimmed) {
    return null;
  }

  const jsonText = extractJsonObject(trimmed);
  const parsed = JSON.parse(jsonText) as LlmDecision;
  if (!parsed.candidateId || typeof parsed.candidateId !== "string") {
    throw new Error("LLM decision missing candidateId");
  }

  return parsed;
}

export function parseWorkspaceJsonDecision(output: string): DeepSeekWorkspaceDecision | null {
  const trimmed = output.trim();
  if (!trimmed) return null;
  const parsed = parseLooseJsonObject(trimmed);
  const decisionRecord = unwrapDecisionRecord(parsed);
  if (!decisionRecord) {
    throw new Error("Workspace LLM output was not an object");
  }
  const candidateId =
    stringValue(decisionRecord.candidateId) ??
    stringValue(decisionRecord.candidate_id) ??
    stringValue(decisionRecord.selectedCandidateId) ??
    stringValue(decisionRecord.selected_candidate_id) ??
    stringValue(decisionRecord.choice) ??
    stringValue(decisionRecord.actionId) ??
    stringValue(decisionRecord.action_id);
  if (!candidateId) {
    throw new Error("Workspace LLM decision missing candidateId or selectedCandidateId");
  }
  return {
    candidateId,
    confidence: numberValue(decisionRecord.confidence),
    reason:
      stringValue(decisionRecord.reason) ??
      stringValue(decisionRecord.reasonBrief) ??
      stringValue(decisionRecord.reason_brief) ??
      stringValue(decisionRecord.rationale) ??
      stringValue(decisionRecord.explanation),
    memoryUpdates: isRecord(decisionRecord.memoryUpdates) ? decisionRecord.memoryUpdates : undefined,
    parameterSuggestions: Array.isArray(decisionRecord.parameterSuggestions)
      ? decisionRecord.parameterSuggestions.filter(isParameterSuggestion)
      : undefined,
    riskTags: stringArray(decisionRecord.riskTags ?? decisionRecord.risk_tags),
    missingInfo: stringArray(decisionRecord.missingInfo ?? decisionRecord.missing_info),
    scaffoldFeedback: stringArray(decisionRecord.scaffoldFeedback ?? decisionRecord.scaffold_feedback)
  };
}

export function resolveDeepSeekResponseMode(
  modeValue: string | undefined,
  jsonModeValue?: string | undefined
): DeepSeekResponseMode {
  if (typeof modeValue === "string") {
    const normalized = modeValue.trim().toLowerCase();
    if (normalized === "non_json_strict" || normalized === "non-json-strict" || normalized === "nonjson") {
      return "non_json_strict";
    }
    if (normalized === "json_mode" || normalized === "json-mode" || normalized === "json") {
      return "json_mode";
    }
  }
  if (typeof jsonModeValue === "string" && ["0", "false", "off", "no"].includes(jsonModeValue.trim().toLowerCase())) {
    return "non_json_strict";
  }
  return "json_mode";
}

export function buildDeepSeekRequestBody(input: {
  model: string;
  maxOutputTokens: number;
  temperature: number;
  topP: number;
  outputMode: DeepSeekResponseMode;
  requestKind: "primary" | "rescue";
  prompt: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    temperature: input.temperature,
    top_p: input.topP,
    max_tokens: input.maxOutputTokens,
    messages: [
      {
        role: "system",
        content: buildDeepSeekSystemPrompt(input.requestKind)
      },
      {
        role: "user",
        content: buildDeepSeekUserPrompt(input.prompt, input.requestKind)
      }
    ]
  };
  if (input.outputMode === "json_mode") {
    body.response_format = { type: "json_object" };
  }
  return body;
}

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1) {
    throw new Error(`LLM output was not JSON: ${text.slice(0, 200)}`);
  }
  if (end === -1 || end <= start) {
    return repairPartialJsonObject(text.slice(start));
  }
  return text.slice(start, end + 1);
}

function extractDeepSeekContent(value: unknown): string {
  if (!isRecord(value)) throw new Error("DeepSeek response was not an object");
  const choices = value.choices;
  if (!Array.isArray(choices) || choices.length === 0 || !isRecord(choices[0])) {
    throw new Error("DeepSeek response missing choices");
  }
  const message = choices[0].message;
  if (!isRecord(message)) {
    throw new Error("DeepSeek response missing message.content");
  }
  if (typeof message.content === "string") {
    return message.content;
  }
  if (Array.isArray(message.content)) {
    const text = message.content
      .map((part) => (isRecord(part) && typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
    if (text) return text;
  }
  if (typeof message.reasoning_content === "string" && message.reasoning_content.trim()) {
    return message.reasoning_content;
  }
  const firstChoice = choices[0] as Record<string, unknown>;
  if (isRecord(firstChoice.delta) && typeof firstChoice.delta.content === "string") {
    return String(firstChoice.delta.content);
  }
  if (typeof message.content !== "string") {
    throw new Error("DeepSeek response missing message.content");
  }
  return message.content;
}

function extractDeepSeekUsage(value: unknown): NonNullable<DeepSeekWorkspaceDecision["providerMetadata"]>["usage"] {
  if (!isRecord(value) || !isRecord(value.usage)) return undefined;
  return {
    promptTokens: numberValue(value.usage.prompt_tokens),
    completionTokens: numberValue(value.usage.completion_tokens),
    totalTokens: numberValue(value.usage.total_tokens)
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function clampRetryLimit(value: number, maxValue: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(maxValue, Math.floor(value));
}

function normalizeDeepSeekError(error: unknown, timeoutMs: number): Error {
  if (error instanceof Error && error.name === "AbortError") {
    return new Error(`DeepSeek request timed out after ${timeoutMs}ms`);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new Error(redactSecrets(message));
}

function redactSecrets(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9._~+/=-]+/g, "sk-[REDACTED]");
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(String).map((item) => item.trim()).filter(Boolean);
}

function createContentAudit(content: string): NonNullable<DeepSeekWorkspaceDecision["providerAudit"]> {
  const trimmed = content.trim();
  return {
    contentKind: classifyContentKind(trimmed),
    contentPreview: redactSecrets(trimmed).slice(0, 240),
    contentBytes: Buffer.byteLength(content, "utf8")
  };
}

function parseLooseJsonObject(text: string): unknown {
  const jsonText = extractJsonObject(text);
  try {
    return JSON.parse(jsonText);
  } catch {
    return JSON.parse(repairPartialJsonObject(jsonText));
  }
}

function unwrapDecisionRecord(value: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(value)) {
    if (value.length !== 1) return undefined;
    return unwrapDecisionRecord(value[0]);
  }
  if (!isRecord(value)) return undefined;
  if (hasDecisionIdentity(value)) return value;
  const nested = [value.decision, value.selection, value.result, value.output, value.answer];
  for (const candidate of nested) {
    if (isRecord(candidate) && hasDecisionIdentity(candidate)) {
      return candidate;
    }
  }
  return value;
}

function hasDecisionIdentity(value: Record<string, unknown>): boolean {
  return [
    value.candidateId,
    value.candidate_id,
    value.selectedCandidateId,
    value.selected_candidate_id,
    value.choice,
    value.actionId,
    value.action_id
  ].some((item) => stringValue(item) !== undefined);
}

function repairPartialJsonObject(text: string): string {
  const start = text.indexOf("{");
  if (start === -1) {
    throw new Error(`LLM output was not JSON: ${text.slice(0, 200)}`);
  }
  let repaired = text.slice(start).trim();
  repaired = repaired.replace(/```(?:json)?/gi, "").trim();
  repaired = repaired.replace(/,\s*$/u, "");
  const openBraces = (repaired.match(/{/g) ?? []).length;
  const closeBraces = (repaired.match(/}/g) ?? []).length;
  if (closeBraces < openBraces) {
    repaired += "}".repeat(openBraces - closeBraces);
  }
  return repaired;
}

function classifyContentKind(trimmed: string): string {
  if (!trimmed) return "empty";
  if (trimmed.startsWith("{")) return "json_object_like";
  if (trimmed.startsWith("[")) return "json_array_like";
  if (trimmed.startsWith("```")) return "markdown_fence";
  return "text_other";
}

function classifyWorkspaceParseFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/missing candidateId|selectedCandidateId/i.test(message)) return "missing_candidate_id";
  if (/not an object/i.test(message)) return "non_object_output";
  if (/not JSON/i.test(message)) return "non_json_output";
  return "parse_error";
}

function buildDeepSeekSystemPrompt(requestKind: "primary" | "rescue"): string {
  if (requestKind === "rescue") {
    return [
      "You are the Slay the Spire 2 strategic workspace decider.",
      "Return exactly one JSON object.",
      "Do not return markdown, code fences, arrays, null, or prose.",
      "selectedCandidateId must copy one allowed candidate id exactly.",
      "Use one-line minified JSON. Keep reasonBrief under 18 words. Use [] for optional arrays unless truly needed.",
      `Example JSON: ${workspaceDecisionExampleJson()}`
    ].join(" ");
  }
  return [
    "You are the Slay the Spire 2 strategic workspace decider.",
    "Return exactly one compact JSON object and nothing else.",
    "The reply must be valid JSON, not markdown.",
    "selectedCandidateId must copy one allowed candidate id exactly.",
    "Use one-line minified JSON. Keep reasonBrief under 18 words. Use [] for optional arrays unless truly needed.",
    `Example JSON: ${workspaceDecisionExampleJson()}`
  ].join(" ");
}

function buildDeepSeekUserPrompt(prompt: string, requestKind: "primary" | "rescue"): string {
  const contract = requestKind === "rescue"
    ? [
        "Your previous reply was empty or unusable.",
        "Retry now with exactly one JSON object.",
        "No markdown. No explanation. No array. No null.",
        "selectedCandidateId must come from allowed_candidate_ids in the workspace JSON.",
        "Use one-line minified JSON with short fields.",
        `Return this shape exactly: ${workspaceDecisionExampleJson()}`
      ]
    : [
        "Return exactly one JSON object.",
        "Do not add markdown or explanation.",
        "selectedCandidateId must come from allowed_candidate_ids in the workspace JSON.",
        "Use one-line minified JSON. Keep reasonBrief under 18 words. Use [] for optional arrays unless truly needed.",
        `Target JSON shape: ${workspaceDecisionExampleJson()}`
      ];
  return `${contract.join(" ")}\n\nWORKSPACE_JSON:\n${prompt}`;
}

function workspaceDecisionExampleJson(): string {
  return "{\"selectedCandidateId\":\"<allowed candidate id>\",\"confidence\":0.72,\"reasonBrief\":\"short strategic reason\",\"riskTags\":[],\"missingInfo\":[],\"scaffoldFeedback\":[]}";
}

function isParameterSuggestion(value: unknown): value is { key: string; delta: number; reason: string } {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    typeof value.delta === "number" &&
    Number.isFinite(value.delta) &&
    typeof value.reason === "string"
  );
}

function splitCommand(commandLine: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < commandLine.length; i += 1) {
    const char = commandLine[i];
    if ((char === "'" || char === '"') && quote === null) {
      quote = char;
      continue;
    }
    if (char === quote) {
      quote = null;
      continue;
    }
    if (char === " " && quote === null) {
      if (current) {
        parts.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}
