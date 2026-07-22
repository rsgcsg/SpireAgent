import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { isJsonObject, isJsonValue, type JsonObject, type JsonValue } from "../shared/json.js";
import { buildShadowStrategyProjection, SHADOW_STRATEGY_PROJECTION_VERSION } from "./shadowStrategyProjection.js";

export interface PromptAuditOptions {
  readonly runId?: string;
  /** Limits sorted run directories when a specific run is not requested. */
  readonly limitRuns?: number;
}

export interface PromptByteSummary {
  readonly min: number;
  readonly median: number;
  readonly p95: number;
  readonly max: number;
}

export interface PromptSurfaceSummary {
  readonly contextKind: string;
  readonly surfaceKind: string;
  readonly promptCount: number;
  readonly userPromptBytes: PromptByteSummary;
}

export interface PromptInformationAudit {
  readonly schemaVersion: 1;
  readonly source: "local_prompt_artifacts_read_only";
  readonly runIds: readonly string[];
  readonly promptCount: number;
  readonly malformedArtifactCount: number;
  readonly userPromptBytes?: PromptByteSummary;
  readonly bySurface: readonly PromptSurfaceSummary[];
  /** Aggregate serialized bytes of fields inside full normalized current state. */
  readonly currentStateComponentBytes: Readonly<Record<string, number>>;
  /** Evidence of repeated representations; it does not assert strategic harm. */
  readonly duplicateCandidates: {
    readonly playerAndInspectionRunDeck: number;
    readonly playerAndInspectionDrawPile: number;
    readonly playerAndInspectionDiscardPile: number;
    readonly playerAndInspectionExhaustPile: number;
    readonly surfaceAndPayloadActionMenus: number;
  };
  readonly shadowProjection: {
    readonly projectionVersion: typeof SHADOW_STRATEGY_PROJECTION_VERSION;
    readonly comparablePromptCount: number;
    readonly userPromptBytes?: PromptByteSummary;
    readonly savedBytes?: PromptByteSummary;
    readonly omittedEvidenceFieldCounts: Readonly<Record<string, number>>;
    readonly deduplicatedFactGroupCounts: Readonly<Record<string, number>>;
  };
}

interface ParsedPromptArtifact {
  readonly userPromptBytes: number;
  readonly contextKind: string;
  readonly surfaceKind: string;
  readonly actionAuthority: string;
  readonly currentState: JsonObject;
  readonly allowedActions: readonly JsonValue[];
}

/**
 * Reads ignored prompt artifacts only. It intentionally reports aggregate shape
 * and size data, never the model prompt or provider output.
 */
export async function auditPromptArtifacts(
  dataRoot: string,
  options: PromptAuditOptions = {}
): Promise<PromptInformationAudit> {
  const runIds = await selectRunIds(dataRoot, options);
  const artifacts: ParsedPromptArtifact[] = [];
  let malformedArtifactCount = 0;

  for (const runId of runIds) {
    const promptsDir = join(resolve(dataRoot), runId, "prompts");
    const names = await readdir(promptsDir).catch(() => [] as string[]);
    for (const name of names.filter((entry) => entry.endsWith(".prompt.json")).sort()) {
      const parsed = await readPromptArtifact(join(promptsDir, name));
      if (parsed) artifacts.push(parsed);
      else malformedArtifactCount += 1;
    }
  }

  const componentBytes = new Map<string, number>();
  const surfaces = new Map<string, { contextKind: string; surfaceKind: string; bytes: number[] }>();
  const duplicateCandidates = {
    playerAndInspectionRunDeck: 0,
    playerAndInspectionDrawPile: 0,
    playerAndInspectionDiscardPile: 0,
    playerAndInspectionExhaustPile: 0,
    surfaceAndPayloadActionMenus: 0
  };
  const shadowBytes: number[] = [];
  const savedBytes: number[] = [];
  const omittedEvidenceFieldCounts = new Map<string, number>();
  const deduplicatedFactGroupCounts = new Map<string, number>();

  for (const artifact of artifacts) {
    for (const [key, value] of Object.entries(artifact.currentState)) {
      componentBytes.set(key, (componentBytes.get(key) ?? 0) + jsonBytes(value));
    }

    const surfaceKey = `${artifact.contextKind}\u0000${artifact.surfaceKind}`;
    const surface = surfaces.get(surfaceKey) ?? {
      contextKind: artifact.contextKind,
      surfaceKind: artifact.surfaceKind,
      bytes: []
    };
    surface.bytes.push(artifact.userPromptBytes);
    surfaces.set(surfaceKey, surface);

    countDuplicatedFacts(artifact, duplicateCandidates);
    const shadow = buildShadowStrategyProjection(artifact);
    shadowBytes.push(shadow.userPromptBytes);
    savedBytes.push(artifact.userPromptBytes - shadow.userPromptBytes);
    for (const field of shadow.omittedEvidenceFields) {
      omittedEvidenceFieldCounts.set(field, (omittedEvidenceFieldCounts.get(field) ?? 0) + 1);
    }
    for (const factGroup of shadow.deduplicatedFactGroups) {
      deduplicatedFactGroupCounts.set(factGroup, (deduplicatedFactGroupCounts.get(factGroup) ?? 0) + 1);
    }
  }

  const bySurface = [...surfaces.values()]
    .map((surface) => ({
      contextKind: surface.contextKind,
      surfaceKind: surface.surfaceKind,
      promptCount: surface.bytes.length,
      userPromptBytes: summarizeBytes(surface.bytes)
    }))
    .sort((left, right) => right.userPromptBytes.max - left.userPromptBytes.max
      || left.contextKind.localeCompare(right.contextKind)
      || left.surfaceKind.localeCompare(right.surfaceKind));

  return {
    schemaVersion: 1,
    source: "local_prompt_artifacts_read_only",
    runIds,
    promptCount: artifacts.length,
    malformedArtifactCount,
    ...(artifacts.length > 0 ? { userPromptBytes: summarizeBytes(artifacts.map((artifact) => artifact.userPromptBytes)) } : {}),
    bySurface,
    currentStateComponentBytes: Object.fromEntries(
      [...componentBytes.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    ),
    duplicateCandidates,
    shadowProjection: {
      projectionVersion: SHADOW_STRATEGY_PROJECTION_VERSION,
      comparablePromptCount: shadowBytes.length,
      ...(shadowBytes.length > 0 ? { userPromptBytes: summarizeBytes(shadowBytes) } : {}),
      ...(savedBytes.length > 0 ? { savedBytes: summarizeBytes(savedBytes) } : {}),
      omittedEvidenceFieldCounts: orderedCounts(omittedEvidenceFieldCounts),
      deduplicatedFactGroupCounts: orderedCounts(deduplicatedFactGroupCounts)
    }
  };
}

function orderedCounts(values: ReadonlyMap<string, number>): Record<string, number> {
  return Object.fromEntries([...values.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])));
}

async function selectRunIds(dataRoot: string, options: PromptAuditOptions): Promise<string[]> {
  const root = resolve(dataRoot);
  const names = await readdir(root, { withFileTypes: true })
    .then((entries) => entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort())
    .catch(() => [] as string[]);
  if (options.runId) {
    if (!names.includes(options.runId)) throw new Error(`Run not found: ${options.runId}`);
    return [options.runId];
  }
  if (options.limitRuns === undefined) return names;
  return names.slice(-options.limitRuns);
}

async function readPromptArtifact(path: string): Promise<ParsedPromptArtifact | undefined> {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch {
    return undefined;
  }
  if (!isJsonObject(value) || typeof value.userPromptBytes !== "number" || !Number.isFinite(value.userPromptBytes) || value.userPromptBytes < 0) {
    return undefined;
  }
  const payload = value.payload;
  if (!isJsonObject(payload) || !isJsonObject(payload.currentState) || !Array.isArray(payload.allowedActions)) return undefined;
  return {
    userPromptBytes: value.userPromptBytes,
    contextKind: stringOrUnknown(payload.contextKind),
    surfaceKind: stringOrUnknown(payload.surfaceKind),
    actionAuthority: stringOrUnknown(payload.actionAuthority),
    currentState: payload.currentState,
    allowedActions: payload.allowedActions.filter(isJsonValue)
  };
}

function countDuplicatedFacts(
  artifact: ParsedPromptArtifact,
  target: {
    playerAndInspectionRunDeck: number;
    playerAndInspectionDrawPile: number;
    playerAndInspectionDiscardPile: number;
    playerAndInspectionExhaustPile: number;
    surfaceAndPayloadActionMenus: number;
  }
): void {
  const player = isJsonObject(artifact.currentState.player) ? artifact.currentState.player : undefined;
  const inspectionFacts = isJsonObject(artifact.currentState.bridgeInspectionFacts)
    ? artifact.currentState.bridgeInspectionFacts
    : undefined;
  if (sameJsonField(player, inspectionFacts, "runDeck")) target.playerAndInspectionRunDeck += 1;
  if (sameJsonField(player, inspectionFacts, "drawPile")) target.playerAndInspectionDrawPile += 1;
  if (sameJsonField(player, inspectionFacts, "discardPile")) target.playerAndInspectionDiscardPile += 1;
  if (sameJsonField(player, inspectionFacts, "exhaustPile")) target.playerAndInspectionExhaustPile += 1;

  const surface = isJsonObject(artifact.currentState.surface) ? artifact.currentState.surface : undefined;
  if (surface && Array.isArray(surface.legalActions) && artifact.allowedActions.length > 0) {
    target.surfaceAndPayloadActionMenus += 1;
  }
}

function sameJsonField(left: JsonObject | undefined, right: JsonObject | undefined, key: string): boolean {
  if (!left || !right || !(key in left) || !(key in right)) return false;
  return JSON.stringify(left[key]) === JSON.stringify(right[key]);
}

function summarizeBytes(values: readonly number[]): PromptByteSummary {
  const sorted = [...values].sort((left, right) => left - right);
  return {
    min: sorted[0] ?? 0,
    median: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    max: sorted.at(-1) ?? 0
  };
}

function percentile(sorted: readonly number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.floor((sorted.length - 1) * fraction)] ?? 0;
}

function jsonBytes(value: JsonValue): number {
  return Buffer.byteLength(JSON.stringify(value));
}

function stringOrUnknown(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "unknown";
}
