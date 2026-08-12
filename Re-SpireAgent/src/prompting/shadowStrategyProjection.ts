import { cloneJson, isJsonObject, type JsonObject, type JsonValue } from "../shared/json.js";
import { stateHash } from "../runtime/stateHash.js";

export const SHADOW_STRATEGY_PROJECTION_VERSION = 1 as const;
export const STRATEGY_PROJECTION_VERSION = SHADOW_STRATEGY_PROJECTION_VERSION;

export interface ShadowStrategyProjectionInput {
  readonly contextKind: string;
  readonly surfaceKind: string;
  readonly actionAuthority: string;
  readonly currentState: JsonObject;
  readonly allowedActions: readonly JsonValue[];
}

export interface ShadowStrategyProjection {
  readonly projectionVersion: typeof SHADOW_STRATEGY_PROJECTION_VERSION;
  readonly sourceNormalizedStateHash: string;
  /** Hashes the exact deterministic model payload; it is not an action or authority token. */
  readonly projectionHash: string;
  readonly omittedEvidenceFields: readonly string[];
  readonly deduplicatedFactGroups: readonly string[];
  readonly modelPayload: JsonObject;
  readonly userPrompt: string;
  readonly userPromptBytes: number;
}

/**
 * Builds the deterministic compact model view from complete recorded evidence.
 * Prompt construction and offline shadow comparison use this same projection;
 * execution authority remains the in-memory allowed-action whitelist.
 */
export function buildStrategyProjection(input: ShadowStrategyProjectionInput): ShadowStrategyProjection {
  const projectedState = cloneJson(input.currentState);
  const omittedEvidenceFields: string[] = [];
  const deduplicatedFactGroups: string[] = [];

  removeGovernanceEvidence(projectedState, omittedEvidenceFields);
  const informationBoundary = projectInformationBoundary(input.currentState);
  removeSurfaceActionSummary(projectedState, omittedEvidenceFields);

  const modelPayload: JsonObject = {
    promptProjectionVersion: SHADOW_STRATEGY_PROJECTION_VERSION,
    task: "select_one_allowed_action",
    actionAuthority: input.actionAuthority,
    currentState: projectedState,
    allowedActions: cloneJson([...input.allowedActions])
  };
  if (informationBoundary) modelPayload.informationBoundary = informationBoundary;

  const userPrompt = JSON.stringify(modelPayload);
  return {
    projectionVersion: SHADOW_STRATEGY_PROJECTION_VERSION,
    sourceNormalizedStateHash: stateHash(JSON.stringify(input.currentState)),
    projectionHash: stateHash(userPrompt),
    omittedEvidenceFields,
    deduplicatedFactGroups,
    modelPayload,
    userPrompt,
    userPromptBytes: Buffer.byteLength(userPrompt)
  };
}

function removeGovernanceEvidence(state: JsonObject, omitted: string[]): void {
  for (const field of [
    "normalizedSchemaVersion",
    "sourceStateType",
    "actionAuthority"
  ]) {
    if (field in state) {
      delete state[field];
      omitted.push(field);
    }
  }
}

export const buildShadowStrategyProjection = buildStrategyProjection;

function projectInformationBoundary(source: JsonObject): JsonObject | undefined {
  const surface = isJsonObject(source.surface) ? source.surface : undefined;
  if (!surface || surface.kind !== "player_environment") return undefined;
  const completeness = isJsonObject(surface.completeness)
    ? surface.completeness
    : undefined;
  const reads = Array.isArray(surface.reads) ? surface.reads : [];
  const result: JsonObject = {
    ...(completeness ? { completeness: cloneJson(completeness) } : {}),
    availableReads: reads
      .filter(isJsonObject)
      .map((read) => ({
        readId: typeof read.readId === "string" ? read.readId : "",
        kind: typeof read.kind === "string" ? read.kind : "",
        ...(typeof read.targetReferentId === "string"
          ? { targetReferentId: read.targetReferentId }
          : {})
      }))
      .filter((read) => read.readId.length > 0 && read.kind.length > 0)
  };
  return Object.keys(result).length > 0 ? result : undefined;
}

function removeSurfaceActionSummary(state: JsonObject, omitted: string[]): void {
  const surface = isJsonObject(state.surface) ? state.surface : undefined;
  if (!surface) return;
  if ("legalActions" in surface) {
    delete surface.legalActions;
    omitted.push("surface.legalActions");
  }
  if ("boundActions" in surface) {
    delete surface.boundActions;
    omitted.push("surface.boundActions");
  }
}
