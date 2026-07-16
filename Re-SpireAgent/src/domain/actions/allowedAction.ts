import type { ExecutableGameAction } from "./action.js";

export interface AllowedAction {
  id: string;
  /** Strategic/display kind. The executable transport action remains private. */
  kind: string;
  label: string;
  description?: string;
  action: ExecutableGameAction;
  sourceStateHash: string;
}

export interface PromptAllowedAction {
  id: string;
  kind: string;
  label: string;
  description?: string;
}

export function toPromptAllowedAction(action: AllowedAction): PromptAllowedAction {
  return {
    id: action.id,
    kind: action.kind,
    label: action.label,
    ...(action.description ? { description: action.description } : {})
  };
}
