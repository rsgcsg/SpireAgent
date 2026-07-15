import { z } from "zod";
import type { AllowedAction } from "../domain/actions/allowedAction.js";
import type { LlmDecision, LlmDecisionAttempt } from "./types.js";

export const LlmDecisionSchema = z
  .object({
    selectedActionId: z.string().trim().min(1).max(240),
    reasonBrief: z.string().trim().min(1).max(240),
    confidence: z.number().min(0).max(1).optional()
  })
  .strict();

export type DecisionParseResult =
  | { valid: true; decision: LlmDecision }
  | { valid: false; outcome: "empty" | "invalid_json" | "invalid_schema"; error: string };

export function parseDecisionText(text: string): DecisionParseResult {
  if (!text.trim()) return { valid: false, outcome: "empty", error: "Provider returned empty content" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      valid: false,
      outcome: "invalid_json",
      error: error instanceof Error ? error.message : "Provider response was not JSON"
    };
  }
  const result = LlmDecisionSchema.safeParse(parsed);
  if (!result.success) {
    return {
      valid: false,
      outcome: "invalid_schema",
      error: result.error.issues.map((issue) => `${issue.path.join(".") || "$"}: ${issue.message}`).join("; ").slice(0, 500)
    };
  }
  return { valid: true, decision: result.data };
}

export type DecisionValidation =
  | { valid: true; decision: LlmDecision; selectedAction: AllowedAction }
  | { valid: false; outcome: "provider_failure" | "unknown_action_id"; error: string };

export function validateDecisionForActions(attempt: LlmDecisionAttempt, allowedActions: AllowedAction[]): DecisionValidation {
  if (attempt.outcome !== "valid_json" || !attempt.parsedDecision) {
    return { valid: false, outcome: "provider_failure", error: attempt.error ?? `Provider outcome: ${attempt.outcome}` };
  }
  const selectedAction = allowedActions.find((action) => action.id === attempt.parsedDecision?.selectedActionId);
  if (!selectedAction) {
    return {
      valid: false,
      outcome: "unknown_action_id",
      error: `Unknown selectedActionId: ${attempt.parsedDecision.selectedActionId}`
    };
  }
  return { valid: true, decision: attempt.parsedDecision, selectedAction };
}
