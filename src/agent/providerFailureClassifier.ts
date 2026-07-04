import type { JsonRecord, ShadowWorkspaceDecision } from "../domain/types.js";
import { isRecord } from "./utils.js";

export type ProviderFailureCategory = "none" | "provider_reliability" | "semantic_validation" | "candidate_safety";

export interface ProviderFailureClassification {
  category: ProviderFailureCategory;
  bucket: string;
}

export interface ReasonQualityAssessment {
  quality: NonNullable<ShadowWorkspaceDecision["reasonQuality"]>;
  notes: string[];
}

export function classifyProviderFailure(input: {
  outcome: ShadowWorkspaceDecision["outcome"];
  agreement?: ShadowWorkspaceDecision["agreement"];
  providerFinishReason?: string;
  providerParseState?: string;
  providerCleanupReason?: string;
  providerOutputKind?: string;
  validationError?: string;
  error?: string;
}): ProviderFailureClassification {
  if (input.outcome === "valid") {
    return { category: "none", bucket: "none" };
  }
  if (input.outcome === "invalid_choice" || input.agreement === "missing_candidate") {
    return {
      category: "candidate_safety",
      bucket: input.agreement === "missing_candidate" ? "candidate_missing_from_allowed_list" : "candidate_choice_invalid"
    };
  }
  if (input.outcome === "error") {
    return { category: "provider_reliability", bucket: "provider_request_error" };
  }

  const parseState = input.providerParseState ?? "";
  const cleanupReason = input.providerCleanupReason ?? "";
  const finishReason = input.providerFinishReason ?? "";
  const validationError = input.validationError ?? "";
  const outputKind = input.providerOutputKind ?? "";

  if (finishReason === "length" && parseState === "empty_content_after_retry") {
    return { category: "provider_reliability", bucket: "provider_length_empty" };
  }
  if (finishReason === "length" && (parseState === "truncated_json" || outputKind === "empty")) {
    return { category: "provider_reliability", bucket: "provider_length_truncated" };
  }
  if (parseState === "empty_content" || parseState === "empty_content_after_retry") {
    return { category: "provider_reliability", bucket: "provider_json_empty_content" };
  }
  if (cleanupReason === "trimmed_thinking_tail") {
    return { category: "provider_reliability", bucket: "provider_tail_noise_after_json" };
  }
  if (cleanupReason === "trimmed_repeated_json_tail") {
    return { category: "provider_reliability", bucket: "provider_repeated_json_tail" };
  }
  if (parseState === "truncated_json") {
    return { category: "provider_reliability", bucket: "provider_truncated_json" };
  }
  if (parseState === "non_json_output" || parseState === "non_object_output" || outputKind === "markdown_fence") {
    return { category: "provider_reliability", bucket: "provider_non_json_output" };
  }
  if (/missing candidateId/i.test(validationError) || parseState === "missing_candidate_id") {
    return { category: "semantic_validation", bucket: "semantic_missing_candidate_id" };
  }
  if (/not an object/i.test(validationError)) {
    return { category: "semantic_validation", bucket: "semantic_non_object_output" };
  }
  if (parseState === "parse_error") {
    return { category: "provider_reliability", bucket: "provider_parse_error" };
  }
  if (input.outcome === "invalid_output") {
    return { category: "semantic_validation", bucket: "semantic_invalid_output" };
  }
  if (input.error) {
    return { category: "provider_reliability", bucket: "provider_request_error" };
  }
  return { category: "semantic_validation", bucket: "unknown_invalid_output" };
}

export function assessReasonQuality(reason: unknown): ReasonQualityAssessment {
  if (typeof reason !== "string" || reason.trim().length === 0) {
    return { quality: "missing", notes: ["empty_reason"] };
  }
  const normalized = reason.trim();
  const lower = normalized.toLowerCase();
  const notes: string[] = [];
  const words = normalized.split(/\s+/u).filter(Boolean);
  const mentionsTradeoff =
    /\b(while|but|vs|tradeoff|trade-off|watch|preserve|risk|unless|avoid|delay|commit|lock-?in|opportunity cost|skip value|at the cost of|without|sacrific(?:e|ing)|save|saving|keep)\b/u.test(lower) ||
    mentionsTemporalTradeoff(lower);
  const mentionsTacticalFactor = /\b(block|damage|hp|health|energy|resource|draw|lethal|survive|survival|tempo|kill|attack|defend|deck|route|map|elite|rest|shop|event|scaling|synergy|upgrade|remove|removal|skip|bloat|reward|relic|boss|path|floor)\b/u.test(lower);
  const templated = /^(good|best|safe|better|pick|choose|take)\b/u.test(lower) && words.length <= 4;
  if (normalized.length < 24 || words.length < 4) notes.push("too_short");
  if (!mentionsTradeoff) notes.push("missing_tradeoff");
  if (!mentionsTacticalFactor) notes.push("missing_tactical_factor");
  if (templated) notes.push("templated_reason");
  return {
    quality: notes.length === 0 ? "adequate" : "thin",
    notes
  };
}

function mentionsTemporalTradeoff(lower: string): boolean {
  return /\b(now|immediately|first)\b[\s\S]{0,48}\b(then|later|after)\b/u.test(lower) ||
    /\b(then|later|after)\b[\s\S]{0,48}\b(scale|recover|draw|attack|block|survive|kill|set up|setup)\b/u.test(lower);
}

export function summarizeReasonQualityNotes(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const notes = value
    .map((item) => typeof item === "string" ? item.trim() : "")
    .filter(Boolean);
  return notes.length > 0 ? notes : undefined;
}

export function summarizeProviderAttempts(value: unknown): JsonRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const attempts = value
    .filter(isRecord)
    .map((attempt) => ({
      requestKind: typeof attempt.requestKind === "string" ? attempt.requestKind : undefined,
      rescueMode: typeof attempt.rescueMode === "string" ? attempt.rescueMode : undefined,
      requestMaxOutputTokens: numberValue(attempt.requestMaxOutputTokens),
      requestedThinkingMode: typeof attempt.requestedThinkingMode === "string" ? attempt.requestedThinkingMode : undefined,
      finishReason: typeof attempt.finishReason === "string" ? attempt.finishReason : undefined,
      latencyMs: numberValue(attempt.latencyMs),
      contentKind: typeof attempt.contentKind === "string" ? attempt.contentKind : undefined,
      contentSource: typeof attempt.contentSource === "string" ? attempt.contentSource : undefined,
      contentPreview: typeof attempt.contentPreview === "string" ? attempt.contentPreview : undefined,
      contentBytes: numberValue(attempt.contentBytes),
      reasoningContentBytes: numberValue(attempt.reasoningContentBytes),
      usage: isRecord(attempt.usage)
        ? {
            promptTokens: numberValue(attempt.usage.promptTokens),
            completionTokens: numberValue(attempt.usage.completionTokens),
            totalTokens: numberValue(attempt.usage.totalTokens)
          }
        : undefined
    }));
  return attempts.length > 0 ? attempts : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
