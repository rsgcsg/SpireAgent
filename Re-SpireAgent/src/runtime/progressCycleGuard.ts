import type { AllowedAction } from "../domain/actions/allowedAction.js";
import type { NormalizedCurrentState } from "../domain/state/index.js";
import { stateHash } from "./stateHash.js";

const TRANSPORT_IDENTITY_KEYS = new Set([
  "actionId",
  "affordanceId",
  "bridgeStateId",
  "expectedStateId",
  "inspectionId",
  "observationId",
  "observedStateId",
  "snapshotId",
  "stateId"
]);

export interface RepeatedSemanticTransition {
  occurrence: number;
  preProgressHash: string;
  postProgressHash: string;
  actionProgressHash: string;
  selectedActionKind: string;
  recoveryPlanned: boolean;
  suppressedReturnActionHashes: string[];
}

export interface CycleActionFilterResult {
  actions: AllowedAction[];
  excludedActionHashes: string[];
}

/**
 * Detects repeated business-state transitions even when Bridge state/action
 * identities are correctly regenerated for every UI lifecycle step.
 */
export class ProgressCycleGuard {
  private readonly occurrences = new Map<string, number>();
  private readonly transitions = new Map<string, Array<{ actionHash: string; postHash: string }>>();
  private readonly suppressedActions = new Map<string, Set<string>>();

  filterActions(
    state: NormalizedCurrentState,
    actions: AllowedAction[]
  ): CycleActionFilterResult {
    const blocked = this.suppressedActions.get(semanticProgressHash(state));
    if (!blocked?.size) return { actions, excludedActionHashes: [] };

    const filtered = actions.filter((action) => !blocked.has(semanticActionHash(action)));
    // A cycle warning must never invent a dead end. If every currently legal
    // action was part of the observed loop, keep them and let the existing
    // terminal guard stop on the next repeated transition.
    if (filtered.length === 0) return { actions, excludedActionHashes: [] };
    return {
      actions: filtered,
      excludedActionHashes: actions
        .map(semanticActionHash)
        .filter((hash) => blocked.has(hash))
    };
  }

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

    const reverseActionHashes = occurrence >= 2
      ? (this.transitions.get(postProgressHash) ?? [])
          .filter((transition) => transition.postHash === preProgressHash)
          .map((transition) => transition.actionHash)
      : [];
    const existingTransitions = this.transitions.get(preProgressHash) ?? [];
    if (!existingTransitions.some((transition) =>
      transition.actionHash === actionProgressHash && transition.postHash === postProgressHash)) {
      existingTransitions.push({ actionHash: actionProgressHash, postHash: postProgressHash });
      this.transitions.set(preProgressHash, existingTransitions);
    }

    if (occurrence < 2) return undefined;
    if (reverseActionHashes.length > 0) {
      const blocked = this.suppressedActions.get(postProgressHash) ?? new Set<string>();
      for (const hash of reverseActionHashes) blocked.add(hash);
      this.suppressedActions.set(postProgressHash, blocked);
    }
    return {
      occurrence,
      preProgressHash,
      postProgressHash,
      actionProgressHash,
      selectedActionKind: action.kind,
      recoveryPlanned: reverseActionHashes.length > 0,
      suppressedReturnActionHashes: [...new Set(reverseActionHashes)]
    };
  }
}

export function semanticProgressHash(state: NormalizedCurrentState): string {
  return stateHash(stripTransportIdentity(state));
}

export function semanticActionHash(action: AllowedAction): string {
  const transport = action.action.kind === "bridge_v2_action"
    ? { kind: action.action.kind, bridgeActionKind: action.action.bridgeActionKind }
    : action.action.kind === "connector_v3_command"
      ? { kind: action.action.kind, operation: action.action.operation }
      : action.action.kind === "human_ui_action"
        ? { kind: action.action.kind, affordance: action.kind }
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
