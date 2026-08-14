import type { NormalizedCurrentState } from "../state/index.js";
import type { AllowedAction } from "./allowedAction.js";

/**
 * Current Player Environment consumer projection.
 *
 * It imports the host-advertised finite action set without reconstructing
 * legality, operands, completion, or native identity in Re.
 */
export function buildPlayerEnvironmentAllowedActions(
  state: NormalizedCurrentState,
  sourceStateHash: string
): AllowedAction[] {
  if (state.stability !== "actionable") return [];
  if (state.actionAuthority !== "player_environment") return [];
  if (state.surface.kind !== "player_environment") return [];

  return state.surface.boundActions.map((boundAction) => ({
    id: boundAction.boundActionId,
    kind: boundAction.verb,
    label: boundAction.label,
    description: `Current player interaction: ${boundAction.verb}`,
    entityBindings: [
      ...(boundAction.subjectReferentId
        ? [{ role: "subject", entityId: boundAction.subjectReferentId }]
        : []),
      ...boundAction.arguments.map((argument) => ({
        role: argument.role,
        entityId: argument.referentId
      }))
    ],
    action: {
      kind: "bound_action" as const,
      choiceId: boundAction.boundActionId,
      expectedSnapshotId: boundAction.snapshotId,
      boundActionId: boundAction.boundActionId
    },
    sourceStateHash
  }));
}
