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
}

export interface DeepSeekWorkspaceDecision extends LlmDecision {
  riskTags?: string[];
  missingInfo?: string[];
  scaffoldFeedback?: string[];
}

export class DeepSeekV4FlashDecider implements LlmDecider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config: DeepSeekV4FlashConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.STS2_DEEPSEEK_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? "";
    this.baseUrl = config.baseUrl ?? process.env.STS2_DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/chat/completions";
    this.model = config.model ?? process.env.STS2_DEEPSEEK_MODEL ?? "deepseek-v4-flash";
    this.timeoutMs = config.timeoutMs ?? Number(process.env.STS2_DEEPSEEK_TIMEOUT_MS || 45000);
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey.trim());
  }

  async decide(prompt: string): Promise<DeepSeekWorkspaceDecision | null> {
    if (!this.isAvailable()) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are the Slay the Spire 2 strategic workspace decider. Return short JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`DeepSeek request failed ${response.status}: ${text.slice(0, 240)}`);
      }
      const json = await response.json();
      const content = extractDeepSeekContent(json);
      return parseWorkspaceJsonDecision(content);
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
  const parsed = JSON.parse(extractJsonObject(trimmed));
  if (!isRecord(parsed)) {
    throw new Error("Workspace LLM output was not an object");
  }
  const candidateId = stringValue(parsed.candidateId) ?? stringValue(parsed.selectedCandidateId);
  if (!candidateId) {
    throw new Error("Workspace LLM decision missing candidateId or selectedCandidateId");
  }
  return {
    candidateId,
    confidence: numberValue(parsed.confidence),
    reason: stringValue(parsed.reason) ?? stringValue(parsed.reasonBrief),
    memoryUpdates: isRecord(parsed.memoryUpdates) ? parsed.memoryUpdates : undefined,
    parameterSuggestions: Array.isArray(parsed.parameterSuggestions)
      ? parsed.parameterSuggestions.filter(isParameterSuggestion)
      : undefined,
    riskTags: stringArray(parsed.riskTags),
    missingInfo: stringArray(parsed.missingInfo),
    scaffoldFeedback: stringArray(parsed.scaffoldFeedback)
  };
}

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`LLM output was not JSON: ${text.slice(0, 200)}`);
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
  if (!isRecord(message) || typeof message.content !== "string") {
    throw new Error("DeepSeek response missing message.content");
  }
  return message.content;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(String).map((item) => item.trim()).filter(Boolean);
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
