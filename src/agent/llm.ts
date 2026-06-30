import { spawn } from "node:child_process";
import type { LlmDecision } from "./types.js";

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

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`LLM output was not JSON: ${text.slice(0, 200)}`);
  }
  return text.slice(start, end + 1);
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
