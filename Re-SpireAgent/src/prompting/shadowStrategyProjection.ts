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
  projectInspectionFacts(projectedState, omittedEvidenceFields, deduplicatedFactGroups);
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
    "actionAuthority",
    "bridgeSharedStateEvidence",
    "bridgeDiagnostics",
    "bridgeLegacyWarnings",
    "bridgeInspectionPolicy",
    "bridgeInspections",
    "bridgeVisibility",
    "bridgeInspectionCatalog",
    "bridgeObservation"
  ]) {
    if (field in state) {
      delete state[field];
      omitted.push(field);
    }
  }
}

export const buildShadowStrategyProjection = buildStrategyProjection;

function projectInformationBoundary(source: JsonObject): JsonObject | undefined {
  const visibility = isJsonObject(source.bridgeVisibility) ? source.bridgeVisibility : undefined;
  const observation = isJsonObject(source.bridgeObservation) ? source.bridgeObservation : undefined;
  const inspectionFacts = isJsonObject(source.bridgeInspectionFacts) ? source.bridgeInspectionFacts : undefined;
  if (!visibility && !observation && !inspectionFacts) return undefined;

  const result: JsonObject = {};
  if (visibility) {
    copyIfJsonValue(visibility, result, "playerVisibleClosureStatus");
    copyIfJsonValue(visibility, result, "missing");
    copyIfJsonValue(visibility, result, "hiddenByPolicy");
  }
  if (observation && typeof observation.coherent === "boolean") {
    result.coherentObservation = observation.coherent;
  }
  if (inspectionFacts) {
    const observedFactGroups = Object.keys(inspectionFacts).sort();
    if (observedFactGroups.length > 0) result.observedFactGroups = observedFactGroups;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function projectInspectionFacts(state: JsonObject, omitted: string[], deduplicated: string[]): void {
  const facts = isJsonObject(state.bridgeInspectionFacts) ? state.bridgeInspectionFacts : undefined;
  if (!facts) return;
  const player = isJsonObject(state.player) ? state.player : undefined;
  const projectedFacts = cloneJson(facts);
  const duplicatedFactKeys: ReadonlyArray<readonly [string, string]> = [
    ["runDeck", "runDeck"],
    ["drawPile", "drawPile"],
    ["discardPile", "discardPile"],
    ["exhaustPile", "exhaustPile"]
  ];
  for (const [factKey, playerKey] of duplicatedFactKeys) {
    if (sameField(player, projectedFacts, playerKey, factKey)) {
      delete projectedFacts[factKey];
      deduplicated.push(`player.${playerKey}=inspection.${factKey}`);
    }
  }
  delete state.bridgeInspectionFacts;
  omitted.push("bridgeInspectionFacts");
  if (Object.keys(projectedFacts).length > 0) state.inspectionFacts = projectedFacts;
}

function removeSurfaceActionSummary(state: JsonObject, omitted: string[]): void {
  const surface = isJsonObject(state.surface) ? state.surface : undefined;
  if (!surface || !("legalActions" in surface)) return;
  delete surface.legalActions;
  omitted.push("surface.legalActions");
}

function sameField(
  left: JsonObject | undefined,
  right: JsonObject,
  leftKey: string,
  rightKey: string
): boolean {
  if (!left || !(leftKey in left) || !(rightKey in right)) return false;
  return JSON.stringify(left[leftKey]) === JSON.stringify(right[rightKey]);
}

function copyIfJsonValue(source: JsonObject, target: JsonObject, key: string): void {
  const value = source[key];
  if (value !== undefined) target[key] = cloneJson(value);
}
