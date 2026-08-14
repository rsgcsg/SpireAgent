import type { AllowedAction, PromptAllowedAction } from "../domain/actions/allowedAction.js";
import { toPromptAllowedAction } from "../domain/actions/allowedAction.js";
import type { NormalizedCurrentState } from "../domain/state/index.js";
import { stateHash } from "../runtime/stateHash.js";
import type { JsonObject, JsonValue } from "../shared/json.js";
import { GLOBAL_PROMPT_ID, GLOBAL_PROMPT_VERSION, GLOBAL_SYSTEM_PROMPT } from "./globalPrompt.js";
import {
  buildStrategyProjection,
  STRATEGY_PROJECTION_VERSION
} from "./shadowStrategyProjection.js";
import { CONTEXT_GUIDES, SURFACE_GUIDES } from "./stateGuides.js";

export interface DecisionPromptPayload {
  promptProjectionVersion: typeof STRATEGY_PROJECTION_VERSION;
  actionAuthority: NormalizedCurrentState["actionAuthority"];
  task: "select_one_allowed_action";
  currentState: JsonObject;
  allowedActions: PromptAllowedAction[];
  informationBoundary?: JsonObject;
}

export interface PromptBundle {
  globalPromptId: string;
  globalPromptVersion: number;
  stateGuideId: string;
  stateGuideVersion: number;
  systemPrompt: string;
  userPrompt: string;
  systemPromptHash: string;
  userPromptHash: string;
  systemPromptBytes: number;
  userPromptBytes: number;
  sourceNormalizedStateHash: string;
  projectionHash: string;
  omittedEvidenceFields: readonly string[];
  deduplicatedFactGroups: readonly string[];
  payload: DecisionPromptPayload;
}

export function buildDecisionPrompt<TAction extends { kind: string }>(
  currentState: NormalizedCurrentState,
  allowedActions: AllowedAction<TAction>[]
): PromptBundle {
  const contextGuide = CONTEXT_GUIDES[currentState.context.kind];
  const surfaceGuide = SURFACE_GUIDES[currentState.surface.kind];
  const promptActions = allowedActions.map(toPromptAllowedAction);
  const projection = buildStrategyProjection({
    contextKind: currentState.context.kind,
    surfaceKind: currentState.surface.kind,
    actionAuthority: currentState.actionAuthority,
    currentState: currentState as unknown as JsonObject,
    allowedActions: promptActions as unknown as readonly JsonValue[]
  });
  const payload = projection.modelPayload as unknown as DecisionPromptPayload;
  const systemPrompt = `${GLOBAL_SYSTEM_PROMPT}\n\nSemantic context guide:\n${contextGuide.text}\n\nInteraction surface guide:\n${surfaceGuide.text}`;
  const userPrompt = projection.userPrompt;
  return {
    globalPromptId: GLOBAL_PROMPT_ID,
    globalPromptVersion: GLOBAL_PROMPT_VERSION,
    stateGuideId: `${contextGuide.id}+${surfaceGuide.id}`,
    stateGuideVersion: Math.max(contextGuide.version, surfaceGuide.version),
    systemPrompt,
    userPrompt,
    systemPromptHash: stateHash(systemPrompt),
    userPromptHash: stateHash(userPrompt),
    systemPromptBytes: Buffer.byteLength(systemPrompt),
    userPromptBytes: Buffer.byteLength(userPrompt),
    sourceNormalizedStateHash: projection.sourceNormalizedStateHash,
    projectionHash: projection.projectionHash,
    omittedEvidenceFields: projection.omittedEvidenceFields,
    deduplicatedFactGroups: projection.deduplicatedFactGroups,
    payload
  };
}
