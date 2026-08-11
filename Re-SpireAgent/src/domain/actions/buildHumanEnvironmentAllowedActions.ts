import type { NormalizedCurrentState } from "../state/index.js";
import type { AllowedAction } from "./allowedAction.js";

/**
 * Current Human Environment consumer projection.
 *
 * It imports the host-advertised finite action set without reconstructing
 * legality, operands, completion, or native identity in Re.
 */
export function buildHumanEnvironmentAllowedActions(
  state: NormalizedCurrentState,
  sourceStateHash: string
): AllowedAction[] {
  if (state.stability !== "actionable") return [];
  if (state.actionAuthority !== "current_human_ui") return [];
  if (state.surface.kind !== "human_ui") return [];

  return state.surface.boundActions.map((boundAction) => ({
    id: boundAction.boundActionId,
    kind: boundAction.action,
    label: boundAction.label,
    description: `Current human UI: ${boundAction.action}`,
    entityBindings: [
      ...(boundAction.subjectRef
        ? [{ role: "subject", entityId: boundAction.subjectRef }]
        : []),
      ...boundAction.arguments.map((argument) => ({
        role: argument.role,
        entityId: argument.referentId
      }))
    ],
    action: {
      kind: "human_ui_action" as const,
      choiceId: boundAction.boundActionId,
      expectedSnapshotId: boundAction.snapshotId,
      boundActionId: boundAction.boundActionId
    },
    sourceStateHash
  }));
}
