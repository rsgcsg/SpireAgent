import type { JsonValue } from "../shared/json.js";

export interface LlmDecision {
  selectedActionId: string;
  reasonBrief: string;
  confidence?: number;
}

export interface LlmDecisionRequest {
  systemPrompt: string;
  userPrompt: string;
  allowedActionIds: string[];
}

export type LlmAttemptOutcome =
  | "valid_json"
  | "timeout"
  | "provider_error"
  | "empty"
  | "truncated"
  | "invalid_json"
  | "invalid_schema";

export interface LlmUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface LlmDecisionAttempt {
  requestKind: "primary" | "format_retry";
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  outcome: LlmAttemptOutcome;
  requestBodyRedacted: JsonValue;
  requestBodyHash: string;
  rawProviderResponse?: JsonValue | string;
  rawResponseText?: string;
  parsedDecision?: LlmDecision;
  error?: string;
  httpStatus?: number;
  finishReason?: string;
  usage?: LlmUsage;
}

export interface LlmDecisionSession {
  provider: "deepseek";
  model: string;
  attempts: LlmDecisionAttempt[];
  finalAttempt: LlmDecisionAttempt;
}

export interface LlmDecisionProvider {
  describe(): { provider: "deepseek"; model: string; thinkingMode: "enabled" | "disabled"; maxOutputTokens: number };
  decide(request: LlmDecisionRequest): Promise<LlmDecisionSession>;
}
