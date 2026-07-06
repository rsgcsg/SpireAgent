import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { LlmDecision } from "./types.js";
import { createDeepSeekV4FlashDecider, validateLlmDecisionForCandidates } from "./llm.js";
import { isRecord } from "./utils.js";

const DEFAULT_ALLOWED_LIVE_CLASSES = ["combat:llm_required"];

export async function runDeepSeekLiveCommand(input = process.stdin): Promise<void> {
  const prompt = await readStdin(input);
  const parsedPrompt = parsePrompt(prompt);
  const decisionClass = extractDecisionClass(parsedPrompt);
  const allowedLiveClasses = parseList(process.env.STS2_DEEPSEEK_LIVE_DECISION_CLASSES)
    ?? DEFAULT_ALLOWED_LIVE_CLASSES;
  if (!decisionClass || !allowedLiveClasses.includes(decisionClass)) {
    throw new Error(`DeepSeek live command blocked decision class: ${decisionClass ?? "unknown"}`);
  }

  const allowedCandidates = extractAllowedCandidates(parsedPrompt);
  if (allowedCandidates.length === 0) {
    throw new Error("DeepSeek live command prompt had no candidates to validate against");
  }

  const decider = createDeepSeekV4FlashDecider();
  if (!decider.isAvailable()) {
    throw new Error("DeepSeek live command unavailable: missing STS2_DEEPSEEK_API_KEY");
  }

  const decision = await decider.decide(prompt);
  const normalized = normalizeLiveDecision(decision);
  const validation = validateLlmDecisionForCandidates(normalized, allowedCandidates);
  if (!validation.valid) {
    throw new Error(validation.error ?? "DeepSeek live command returned invalid candidate");
  }

  process.stdout.write(`${JSON.stringify(normalized)}\n`);
}

export function extractAllowedCandidates(parsedPrompt: unknown): Array<{ id: string }> {
  if (!isRecord(parsedPrompt)) return [];
  if (Array.isArray(parsedPrompt.candidates)) {
    return parsedPrompt.candidates
      .filter(isRecord)
      .map((candidate) => typeof candidate.id === "string" ? { id: candidate.id } : undefined)
      .filter((candidate): candidate is { id: string } => candidate !== undefined);
  }
  const live = isRecord(parsedPrompt.p8_live_additive) ? parsedPrompt.p8_live_additive : undefined;
  const allowedIds = Array.isArray(live?.allowedCandidateIds)
    ? live.allowedCandidateIds
    : Array.isArray(live?.allowed_candidate_ids)
      ? live.allowed_candidate_ids
      : undefined;
  return allowedIds
    ?.map((id) => typeof id === "string" ? { id } : undefined)
    .filter((candidate): candidate is { id: string } => candidate !== undefined) ?? [];
}

export function extractDecisionClass(parsedPrompt: unknown): string | undefined {
  if (!isRecord(parsedPrompt)) return undefined;
  const live = isRecord(parsedPrompt.p8_live_additive) ? parsedPrompt.p8_live_additive : undefined;
  return typeof live?.decisionClass === "string"
    ? live.decisionClass
    : typeof live?.decision_class === "string"
      ? live.decision_class
      : undefined;
}

export function normalizeLiveDecision(decision: LlmDecision | null): LlmDecision | null {
  if (!decision) return null;
  return {
    candidateId: decision.candidateId,
    confidence: decision.confidence,
    reason: decision.reason
  };
}

function parsePrompt(prompt: string): unknown {
  try {
    return JSON.parse(prompt);
  } catch {
    return undefined;
  }
}

function parseList(value: unknown): string[] | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readStdin(input: NodeJS.ReadStream): Promise<string> {
  if (input.isTTY) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    let data = "";
    input.setEncoding("utf8");
    input.on("data", (chunk) => {
      data += chunk;
    });
    input.on("error", reject);
    input.on("end", () => resolve(data));
  });
}

function isMainModule(): boolean {
  return process.argv[1] === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  runDeepSeekLiveCommand().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${redactSecrets(message).slice(0, 320)}\n`);
    process.exit(1);
  });
}

function redactSecrets(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9._~+/=-]+/g, "sk-[REDACTED]");
}
