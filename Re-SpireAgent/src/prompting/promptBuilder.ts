import type { AllowedAction, PromptAllowedAction } from "../domain/actions/allowedAction.js";
import { toPromptAllowedAction } from "../domain/actions/allowedAction.js";
import type { NormalizedCurrentState } from "../domain/state/index.js";
import { stateHash } from "../runtime/stateHash.js";
import { GLOBAL_PROMPT_ID, GLOBAL_PROMPT_VERSION, GLOBAL_SYSTEM_PROMPT } from "./globalPrompt.js";
import { STATE_GUIDES } from "./stateGuides.js";

export interface DecisionPromptPayload {
  promptSchemaVersion: 1;
  currentStateSchemaVersion: 1;
  stateKind: NormalizedCurrentState["kind"];
  stateGuideId: string;
  stateGuideVersion: number;
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
  const guide = STATE_GUIDES[currentState.kind];
  const payload: DecisionPromptPayload = {
    promptSchemaVersion: 1,
    currentStateSchemaVersion: 1,
    stateKind: currentState.kind,
    stateGuideId: guide.id,
    stateGuideVersion: guide.version,
    task: "select_one_allowed_action",
    currentState,
    allowedActions: allowedActions.map(toPromptAllowedAction),
    outputSchema: {
      selectedActionId: "string_exactly_matching_allowed_action_id",
      reasonBrief: "non_empty_string_max_240_chars",
      confidence: "optional_number_0_to_1"
    }
  };
  const systemPrompt = `${GLOBAL_SYSTEM_PROMPT}\n\nState guide:\n${guide.text}`;
  const userPrompt = JSON.stringify(payload);
  return {
    globalPromptId: GLOBAL_PROMPT_ID,
    globalPromptVersion: GLOBAL_PROMPT_VERSION,
    stateGuideId: guide.id,
    stateGuideVersion: guide.version,
    systemPrompt,
    userPrompt,
    systemPromptHash: stateHash(systemPrompt),
    userPromptHash: stateHash(userPrompt),
    systemPromptBytes: Buffer.byteLength(systemPrompt),
    userPromptBytes: Buffer.byteLength(userPrompt),
    payload
  };
}
