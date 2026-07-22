import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { LlmDecisionAttempt, LlmDecisionProvider, LlmDecisionSession } from "../llm/types.js";
import { stateHash } from "../runtime/stateHash.js";
import { isJsonObject, isJsonValue, type JsonObject, type JsonValue } from "../shared/json.js";
import { buildShadowStrategyProjection } from "./shadowStrategyProjection.js";

export interface RecordedPromptComparisonRequest {
  readonly dataRoot: string;
  readonly runId: string;
  readonly decisionId: string;
}

export interface PromptShadowComparison {
  readonly schemaVersion: 1;
  readonly source: "recorded_prompt_provider_shadow_no_execution";
  readonly runId: string;
  readonly decisionId: string;
  readonly provider: ReturnType<LlmDecisionProvider["describe"]>;
  readonly full: PromptComparisonSide;
  readonly shadow: PromptComparisonSide & {
    readonly projectionVersion: number;
    readonly projectionHash: string;
    readonly sourceNormalizedStateHash: string;
    readonly omittedEvidenceFields: readonly string[];
    readonly deduplicatedFactGroups: readonly string[];
  };
  readonly comparison: {
    readonly bothFinalAttemptsValid: boolean;
    readonly selectedActionAgreement?: boolean;
    readonly fullUserPromptBytes: number;
    readonly shadowUserPromptBytes: number;
    readonly savedUserPromptBytes: number;
  };
  readonly limitations: readonly string[];
}

export interface PromptComparisonSide {
  readonly userPromptHash: string;
  readonly userPromptBytes: number;
  readonly attempts: readonly PromptComparisonAttempt[];
  readonly finalOutcome: LlmDecisionAttempt["outcome"];
  readonly selectedActionId?: string;
  readonly reasonBriefBytes?: number;
}

export interface PromptComparisonAttempt {
  readonly requestKind: LlmDecisionAttempt["requestKind"];
  readonly outcome: LlmDecisionAttempt["outcome"];
  readonly latencyMs: number;
  readonly finishReason?: string;
  readonly httpStatus?: number;
  readonly usage?: LlmDecisionAttempt["usage"];
  readonly error?: string;
}

export interface PromptRepeatBaseline {
  readonly schemaVersion: 1;
  readonly source: "recorded_prompt_provider_repeat_no_execution";
  readonly runId: string;
  readonly decisionId: string;
  readonly provider: ReturnType<LlmDecisionProvider["describe"]>;
  readonly variant: "full" | "shadow";
  readonly projectionHash?: string;
  readonly sampleCount: number;
  readonly samples: readonly PromptComparisonSide[];
  readonly summary: {
    readonly allFinalAttemptsValid: boolean;
    readonly uniqueSelectedActionCount: number;
    readonly selectedActionCounts: Readonly<Record<string, number>>;
  };
  readonly limitations: readonly string[];
}

/**
 * Calls a provider twice against one already-recorded observation. It does not
 * open the Gateway, create a run, write artifacts, submit an action, or poll
 * command completion. It is evidence for a later semantic review only.
 */
export async function compareRecordedPromptWithShadow(
  request: RecordedPromptComparisonRequest,
  provider: LlmDecisionProvider
): Promise<PromptShadowComparison> {
  const recorded = await readRecordedPrompt(request);
  const shadow = buildShadowStrategyProjection({
    contextKind: recorded.contextKind,
    surfaceKind: recorded.surfaceKind,
    actionAuthority: recorded.actionAuthority,
    currentState: recorded.currentState,
    allowedActions: recorded.allowedActions
  });
  const allowedActionIds = actionIds(recorded.allowedActions);

  const fullSession = await provider.decide({
    systemPrompt: recorded.systemPrompt,
    userPrompt: recorded.userPrompt,
    allowedActionIds
  });
  const shadowSession = await provider.decide({
    systemPrompt: recorded.systemPrompt,
    userPrompt: shadow.userPrompt,
    allowedActionIds
  });
  const full = summarizeSession(recorded.userPrompt, fullSession);
  const compact = summarizeSession(shadow.userPrompt, shadowSession);
  const bothFinalAttemptsValid = full.finalOutcome === "valid_json" && compact.finalOutcome === "valid_json";

  return {
    schemaVersion: 1,
    source: "recorded_prompt_provider_shadow_no_execution",
    runId: request.runId,
    decisionId: request.decisionId,
    provider: provider.describe(),
    full,
    shadow: {
      ...compact,
      projectionVersion: shadow.projectionVersion,
      projectionHash: shadow.projectionHash,
      sourceNormalizedStateHash: shadow.sourceNormalizedStateHash,
      omittedEvidenceFields: shadow.omittedEvidenceFields,
      deduplicatedFactGroups: shadow.deduplicatedFactGroups
    },
    comparison: {
      bothFinalAttemptsValid,
      ...(bothFinalAttemptsValid ? { selectedActionAgreement: full.selectedActionId === compact.selectedActionId } : {}),
      fullUserPromptBytes: full.userPromptBytes,
      shadowUserPromptBytes: compact.userPromptBytes,
      savedUserPromptBytes: full.userPromptBytes - compact.userPromptBytes
    },
    limitations: [
      "provider outputs are sequential samples, not a causal quality result",
      "no action was submitted and no Gateway or command lifecycle was opened",
      "action agreement does not prove strategic correctness",
      "reason text is intentionally not emitted; semantic review needs controlled access to recorded evidence"
    ]
  };
}

/**
 * Measures provider variation on one exact full Prompt before interpreting a
 * projection disagreement. Like the paired comparison, it is non-executing and
 * does not open the Gateway or write any local artifact.
 */
export async function repeatRecordedPromptVariant(
  request: RecordedPromptComparisonRequest & { readonly sampleCount: number; readonly variant: "full" | "shadow" },
  provider: LlmDecisionProvider
): Promise<PromptRepeatBaseline> {
  if (!Number.isInteger(request.sampleCount) || request.sampleCount < 2 || request.sampleCount > 5) {
    throw new Error("sampleCount must be an integer from 2 through 5");
  }
  const recorded = await readRecordedPrompt(request);
  const allowedActionIds = actionIds(recorded.allowedActions);
  const shadow = request.variant === "shadow"
    ? buildShadowStrategyProjection({
      contextKind: recorded.contextKind,
      surfaceKind: recorded.surfaceKind,
      actionAuthority: recorded.actionAuthority,
      currentState: recorded.currentState,
      allowedActions: recorded.allowedActions
    })
    : undefined;
  const userPrompt = shadow?.userPrompt ?? recorded.userPrompt;
  const samples: PromptComparisonSide[] = [];
  for (let index = 0; index < request.sampleCount; index += 1) {
    samples.push(summarizeSession(userPrompt, await provider.decide({
      systemPrompt: recorded.systemPrompt,
      userPrompt,
      allowedActionIds
    })));
  }
  const selectedActionCounts = new Map<string, number>();
  for (const sample of samples) {
    if (sample.selectedActionId) {
      selectedActionCounts.set(sample.selectedActionId, (selectedActionCounts.get(sample.selectedActionId) ?? 0) + 1);
    }
  }
  return {
    schemaVersion: 1,
    source: "recorded_prompt_provider_repeat_no_execution",
    runId: request.runId,
    decisionId: request.decisionId,
    provider: provider.describe(),
    variant: request.variant,
    ...(shadow ? { projectionHash: shadow.projectionHash } : {}),
    sampleCount: request.sampleCount,
    samples,
    summary: {
      allFinalAttemptsValid: samples.every((sample) => sample.finalOutcome === "valid_json"),
      uniqueSelectedActionCount: selectedActionCounts.size,
      selectedActionCounts: Object.fromEntries([...selectedActionCounts.entries()].sort(([left], [right]) => left.localeCompare(right)))
    },
    limitations: [
      "repeat samples estimate provider variation only for this recorded prompt variant",
      "no action was submitted and no Gateway or command lifecycle was opened",
      "repeat agreement does not prove strategic correctness or projection fidelity"
    ]
  };
}

interface RecordedPrompt {
  readonly systemPrompt: string;
  readonly userPrompt: string;
  readonly contextKind: string;
  readonly surfaceKind: string;
  readonly actionAuthority: string;
  readonly currentState: JsonObject;
  readonly allowedActions: readonly JsonValue[];
}

async function readRecordedPrompt(request: RecordedPromptComparisonRequest): Promise<RecordedPrompt> {
  const runId = safeSegment(request.runId, "runId");
  const decisionId = safeSegment(request.decisionId, "decisionId");
  const path = join(resolve(request.dataRoot), runId, "prompts", `${decisionId}.prompt.json`);
  let value: unknown;
  try {
    value = JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch {
    throw new Error(`Recorded prompt not found or invalid: ${runId}/${decisionId}`);
  }
  if (!isJsonObject(value) || typeof value.systemPrompt !== "string" || typeof value.userPrompt !== "string" || !isJsonObject(value.payload)) {
    throw new Error(`Recorded prompt has no comparable PromptBundle: ${runId}/${decisionId}`);
  }
  const parsedUserPrompt = parsePayload(value.userPrompt, runId, decisionId);
  if (stateHash(parsedUserPrompt) !== stateHash(value.payload)) {
    throw new Error(`Recorded prompt payload disagrees with userPrompt: ${runId}/${decisionId}`);
  }
  if (!isJsonObject(parsedUserPrompt.currentState) || !Array.isArray(parsedUserPrompt.allowedActions)) {
    throw new Error(`Recorded prompt lacks currentState or allowedActions: ${runId}/${decisionId}`);
  }
  return {
    systemPrompt: value.systemPrompt,
    userPrompt: value.userPrompt,
    contextKind: stringOrUnknown(parsedUserPrompt.contextKind),
    surfaceKind: stringOrUnknown(parsedUserPrompt.surfaceKind),
    actionAuthority: stringOrUnknown(parsedUserPrompt.actionAuthority),
    currentState: parsedUserPrompt.currentState,
    allowedActions: parsedUserPrompt.allowedActions.filter(isJsonValue)
  };
}

function parsePayload(text: string, runId: string, decisionId: string): JsonObject {
  try {
    const value = JSON.parse(text) as unknown;
    if (isJsonObject(value)) return value;
  } catch {
    // The canonical error below avoids printing local Prompt content.
  }
  throw new Error(`Recorded userPrompt is not a JSON object: ${runId}/${decisionId}`);
}

function actionIds(actions: readonly JsonValue[]): string[] {
  const ids = actions.map((action) => isJsonObject(action) && typeof action.id === "string" ? action.id : undefined);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    throw new Error("Recorded allowedActions do not contain unique string ids");
  }
  return ids as string[];
}

function summarizeSession(userPrompt: string, session: LlmDecisionSession): PromptComparisonSide {
  const final = session.finalAttempt;
  return {
    userPromptHash: stateHash(userPrompt),
    userPromptBytes: Buffer.byteLength(userPrompt),
    attempts: session.attempts.map((attempt) => ({
      requestKind: attempt.requestKind,
      outcome: attempt.outcome,
      latencyMs: attempt.latencyMs,
      ...(attempt.finishReason ? { finishReason: attempt.finishReason } : {}),
      ...(attempt.httpStatus !== undefined ? { httpStatus: attempt.httpStatus } : {}),
      ...(attempt.usage ? { usage: attempt.usage } : {}),
      ...(attempt.error ? { error: attempt.error } : {})
    })),
    finalOutcome: final.outcome,
    ...(final.parsedDecision ? { selectedActionId: final.parsedDecision.selectedActionId } : {}),
    ...(final.parsedDecision ? { reasonBriefBytes: Buffer.byteLength(final.parsedDecision.reasonBrief) } : {})
  };
}

function safeSegment(value: string, field: string): string {
  if (!/^[A-Za-z0-9._-]+$/u.test(value)) throw new Error(`Unsafe ${field}`);
  return value;
}

function stringOrUnknown(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "unknown";
}
