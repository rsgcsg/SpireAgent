import type { AllowedAction, PromptAllowedAction } from "../domain/actions/allowedAction.js";
import { toPromptAllowedAction } from "../domain/actions/allowedAction.js";
import type { NormalizedCurrentState } from "../domain/state/index.js";
import { stateHash } from "../runtime/stateHash.js";
import { GLOBAL_PROMPT_ID, GLOBAL_PROMPT_VERSION, GLOBAL_SYSTEM_PROMPT } from "./globalPrompt.js";
import { CONTEXT_GUIDES, SURFACE_GUIDES } from "./stateGuides.js";

export interface DecisionPromptPayload {
  promptSchemaVersion: 2;
  currentStateSchemaVersion: 2;
  contextKind: NormalizedCurrentState["context"]["kind"];
  surfaceKind: NormalizedCurrentState["surface"]["kind"];
  contextGuideId: string;
  contextGuideVersion: number;
  surfaceGuideId: string;
  surfaceGuideVersion: number;
  task: "select_one_allowed_action";
  currentState: NormalizedCurrentState;
  allowedActions: PromptAllowedAction[];
  outputSchema: {
    selectedActionId: "string_exactly_matching_allowed_action_id";
    reasonBrief: "non_empty_string_max_240_chars";
    confidence: "optional_number_0_to_1";
  };
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
  payload: DecisionPromptPayload;
}

export function buildDecisionPrompt(currentState: NormalizedCurrentState, allowedActions: AllowedAction[]): PromptBundle {
  const contextGuide = CONTEXT_GUIDES[currentState.context.kind];
  const surfaceGuide = SURFACE_GUIDES[currentState.surface.kind];
  const payload: DecisionPromptPayload = {
    promptSchemaVersion: 2,
    currentStateSchemaVersion: 2,
    contextKind: currentState.context.kind,
    surfaceKind: currentState.surface.kind,
    contextGuideId: contextGuide.id,
    contextGuideVersion: contextGuide.version,
    surfaceGuideId: surfaceGuide.id,
    surfaceGuideVersion: surfaceGuide.version,
    task: "select_one_allowed_action",
    currentState,
    allowedActions: allowedActions.map(toPromptAllowedAction),
    outputSchema: {
      selectedActionId: "string_exactly_matching_allowed_action_id",
      reasonBrief: "non_empty_string_max_240_chars",
      confidence: "optional_number_0_to_1"
    }
  };
  const systemPrompt = `${GLOBAL_SYSTEM_PROMPT}\n\nSemantic context guide:\n${contextGuide.text}\n\nInteraction surface guide:\n${surfaceGuide.text}`;
  const userPrompt = JSON.stringify(payload);
  return {
    globalPromptId: GLOBAL_PROMPT_ID,
    globalPromptVersion: GLOBAL_PROMPT_VERSION,
    stateGuideId: `${contextGuide.id}+${surfaceGuide.id}`,
    stateGuideVersion: 2,
    systemPrompt,
    userPrompt,
    systemPromptHash: stateHash(systemPrompt),
    userPromptHash: stateHash(userPrompt),
    systemPromptBytes: Buffer.byteLength(systemPrompt),
    userPromptBytes: Buffer.byteLength(userPrompt),
    payload
  };
}
