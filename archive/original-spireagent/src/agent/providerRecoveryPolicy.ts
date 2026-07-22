import type { JsonRecord, ShadowWorkspaceDecisionOutcome } from "../domain/types.js";
import { isRecord } from "./utils.js";

export const P8_PROVIDER_RECOVERY_POLICY_NAME = "p8_provider_json_recovery_v1";

export interface ProviderRecoveryPolicySummaryInput {
  attempts: unknown;
  outcome?: ShadowWorkspaceDecisionOutcome;
  failureBucket?: string;
  parseState?: string;
  finishReason?: string;
}

export function summarizeProviderRecoveryPolicy(input: ProviderRecoveryPolicySummaryInput): JsonRecord | undefined {
  const attempts = Array.isArray(input.attempts) ? input.attempts.filter(isRecord) : [];
  if (attempts.length === 0) return undefined;

  const primaryAttempts = attempts.filter((attempt) => attempt.requestKind === "primary");
  const rescueAttempts = attempts.filter((attempt) => attempt.requestKind === "rescue");
  const emptyRescueAttempts = rescueAttempts.filter((attempt) => attempt.rescueMode === "empty");
  const truncationRescueAttempts = rescueAttempts.filter((attempt) => attempt.rescueMode === "truncation");
  const primaryMaxOutputTokens = maxNumber(primaryAttempts.map((attempt) => attempt.requestMaxOutputTokens));
  const rescueMaxOutputTokens = maxNumber(rescueAttempts.map((attempt) => attempt.requestMaxOutputTokens));
  const terminalAttempt = attempts.at(-1);
  const primaryThinkingModes = uniqueStrings(primaryAttempts.map((attempt) => attempt.requestedThinkingMode));
  const rescueThinkingModes = uniqueStrings(rescueAttempts.map((attempt) => attempt.requestedThinkingMode));

  return {
    schemaVersion: 1,
    policyName: P8_PROVIDER_RECOVERY_POLICY_NAME,
    separatedFromWorkspaceCompression: true,
    semanticValidationRelaxed: false,
    primaryAttempts: primaryAttempts.length,
    rescueAttempts: rescueAttempts.length,
    emptyRescueAttempts: emptyRescueAttempts.length,
    truncationRescueAttempts: truncationRescueAttempts.length,
    primaryMaxOutputTokens,
    rescueMaxOutputTokens,
    rescueOutputCapRelation: compareOutputCaps(primaryMaxOutputTokens, rescueMaxOutputTokens),
    primaryThinkingModes,
    rescueThinkingModes,
    terminalRequestKind: stringValue(terminalAttempt?.requestKind),
    terminalRescueMode: stringValue(terminalAttempt?.rescueMode),
    terminalThinkingMode: stringValue(terminalAttempt?.requestedThinkingMode),
    terminalFinishReason: input.finishReason ?? stringValue(terminalAttempt?.finishReason),
    terminalContentKind: stringValue(terminalAttempt?.contentKind),
    terminalParseState: input.parseState,
    terminalFailureBucket: input.failureBucket,
    recovered: input.outcome === "valid" && rescueAttempts.length > 0
  };
}

function compareOutputCaps(primaryMaxOutputTokens: number | undefined, rescueMaxOutputTokens: number | undefined): string {
  if (primaryMaxOutputTokens === undefined || rescueMaxOutputTokens === undefined) return "not_applicable";
  if (rescueMaxOutputTokens < primaryMaxOutputTokens) return "rescue_smaller_than_primary";
  if (rescueMaxOutputTokens > primaryMaxOutputTokens) return "rescue_larger_than_primary";
  return "rescue_equal_to_primary";
}

function maxNumber(values: unknown[]): number | undefined {
  const numbers = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return numbers.length > 0 ? Math.max(...numbers) : undefined;
}

function uniqueStrings(values: unknown[]): string[] | undefined {
  const strings = [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))];
  return strings.length > 0 ? strings : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
