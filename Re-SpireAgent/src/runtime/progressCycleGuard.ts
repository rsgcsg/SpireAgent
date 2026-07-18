import type { AllowedAction } from "../domain/actions/allowedAction.js";
import type { NormalizedCurrentState } from "../domain/state/index.js";
import { stateHash } from "./stateHash.js";

const TRANSPORT_IDENTITY_KEYS = new Set([
  "actionId",
  "bridgeStateId",
  "expectedStateId",
  "inspectionId",
  "observedStateId",
  "stateId"
]);

export interface RepeatedSemanticTransition {
  occurrence: number;
  preProgressHash: string;
  postProgressHash: string;
  actionProgressHash: string;
  selectedActionKind: string;
}

/**
 * Detects repeated business-state transitions even when Bridge state/action
 * identities are correctly regenerated for every UI lifecycle step.
 */
export class ProgressCycleGuard {
  private readonly occurrences = new Map<string, number>();

  observe(
    pre: NormalizedCurrentState,
    action: AllowedAction,
    post: NormalizedCurrentState
  ): RepeatedSemanticTransition | undefined {
    const preProgressHash = semanticProgressHash(pre);
    const postProgressHash = semanticProgressHash(post);
    const actionProgressHash = semanticActionHash(action);
    const key = `${preProgressHash}|${actionProgressHash}|${postProgressHash}`;
    const occurrence = (this.occurrences.get(key) ?? 0) + 1;
    this.occurrences.set(key, occurrence);
    if (occurrence < 2) return undefined;
    return {
      occurrence,
      preProgressHash,
      postProgressHash,
      actionProgressHash,
      selectedActionKind: action.kind
    };
  }
}

export function semanticProgressHash(state: NormalizedCurrentState): string {
  return stateHash(stripTransportIdentity(state));
}

export function semanticActionHash(action: AllowedAction): string {
  const transport = action.action.kind === "bridge_v2_action"
    ? { kind: action.action.kind, bridgeActionKind: action.action.bridgeActionKind }
    : action.action;
  return stateHash({
    kind: action.kind,
    label: action.label,
    entityBindings: action.entityBindings ?? [],
    transport
  });
}

function stripTransportIdentity(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripTransportIdentity);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !TRANSPORT_IDENTITY_KEYS.has(key))
      .map(([key, child]) => [key, stripTransportIdentity(child)])
  );
}
