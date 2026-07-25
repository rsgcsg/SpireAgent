import { createHash } from "node:crypto";
import {
  type EnvironmentCaptureProvenance,
  type EnvironmentFingerprint,
  type EnvironmentModDescriptor,
  type EvidenceEnvironmentScope
} from "../domain/types.js";
import { getSts2McpRestCapabilities } from "../adapters/sts2mcp/capabilities.js";

export const ENVIRONMENT_BUILD_FLAG = "STS2_GAME_BUILD";
export const ENVIRONMENT_RELEASE_CHANNEL_FLAG = "STS2_GAME_RELEASE_CHANNEL";
export const ENVIRONMENT_CONTENT_MANIFEST_FLAG = "STS2_CONTENT_MANIFEST_HASH";
export const ENVIRONMENT_MODS_FLAG = "STS2_MODS_JSON";
export const ENVIRONMENT_ADAPTER_VERSION_FLAG = "STS2_ADAPTER_VERSION";
export const ENVIRONMENT_FACT_SNAPSHOT_FLAG = "STS2_FACT_SNAPSHOT_VERSION";
export const ENVIRONMENT_AGENT_REVISION_FLAG = "STS2_AGENT_REVISION";
export const ENVIRONMENT_PROVENANCE_FLAG = "STS2_EVIDENCE_PROVENANCE";

export function buildEnvironmentFingerprint(input: {
  captureProvenance?: EnvironmentCaptureProvenance;
  env?: NodeJS.ProcessEnv;
} = {}): EnvironmentFingerprint {
  const env = input.env ?? process.env;
  const notes: string[] = [];
  const mods = parseMods(env[ENVIRONMENT_MODS_FLAG], notes);
  const releaseChannel = normalizeReleaseChannel(env[ENVIRONMENT_RELEASE_CHANNEL_FLAG], notes);
  const capabilities = getSts2McpRestCapabilities();
  const fingerprint: EnvironmentFingerprint = {
    schemaVersion: 1,
    gameId: "slay_the_spire_2",
    gameBuild: optionalValue(env[ENVIRONMENT_BUILD_FLAG]),
    releaseChannel,
    contentManifestHash: optionalValue(env[ENVIRONMENT_CONTENT_MANIFEST_FLAG]),
    mods: mods.values,
    modsDeclared: mods.declared,
    adapter: {
      id: "sts2mcp_rest",
      version: optionalValue(env[ENVIRONMENT_ADAPTER_VERSION_FLAG]),
      capabilityHash: hashJson(capabilities)
    },
    factSnapshotVersion: optionalValue(env[ENVIRONMENT_FACT_SNAPSHOT_FLAG]),
    agentRevision: optionalValue(env[ENVIRONMENT_AGENT_REVISION_FLAG]),
    captureProvenance: input.captureProvenance ?? resolveEnvironmentCaptureProvenance(env[ENVIRONMENT_PROVENANCE_FLAG]),
    identityStatus: "unknown",
    notes
  };
  const missing = missingIdentityFields(fingerprint);
  fingerprint.identityStatus = missing.length === 0 ? "complete" : missing.length >= 7 ? "unknown" : "partial";
  fingerprint.notes.push(...missing.map((field) => "missing_" + field));
  fingerprint.fingerprintHash = hashJson({
    gameId: fingerprint.gameId,
    gameBuild: fingerprint.gameBuild,
    releaseChannel: fingerprint.releaseChannel,
    contentManifestHash: fingerprint.contentManifestHash,
    mods: fingerprint.mods,
    modsDeclared: fingerprint.modsDeclared,
    adapter: fingerprint.adapter,
    factSnapshotVersion: fingerprint.factSnapshotVersion,
    agentRevision: fingerprint.agentRevision
  });
  return fingerprint;
}

export function buildEvidenceEnvironmentScope(
  fingerprint: EnvironmentFingerprint
): EvidenceEnvironmentScope {
  const reasons = [...fingerprint.notes];
  const scopeStatus = fingerprint.identityStatus === "complete" && fingerprint.captureProvenance !== "unknown"
    ? "exact"
    : fingerprint.identityStatus === "unknown" || fingerprint.captureProvenance === "unknown"
      ? "unknown"
      : "partial";
  if (fingerprint.captureProvenance !== "organic") {
    reasons.push("capture_provenance_" + fingerprint.captureProvenance);
  }
  reasons.push("compatibility_not_evaluated_pre_p12");
  return {
    schemaVersion: 1,
    fingerprintHash: fingerprint.fingerprintHash,
    scopeStatus,
    compatibilityState: "unknown",
    captureProvenance: fingerprint.captureProvenance,
    reasons: unique(reasons)
  };
}

export function resolveEnvironmentCaptureProvenance(value = process.env[ENVIRONMENT_PROVENANCE_FLAG]): EnvironmentCaptureProvenance {
  switch (value?.trim().toLowerCase()) {
    case "organic":
      return "organic";
    case "console_debug":
    case "console":
    case "debug":
      return "console_debug";
    case "fixture":
      return "fixture";
    default:
      return "unknown";
  }
}

function parseMods(raw: string | undefined, notes: string[]): { declared: boolean; values: EnvironmentModDescriptor[] } {
  if (raw === undefined || raw.trim() === "") {
    notes.push("mods_not_explicitly_declared");
    return { declared: false, values: [] };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("mods_not_array");
    const values = parsed.flatMap((item): EnvironmentModDescriptor[] => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const value = item as Record<string, unknown>;
      const id = optionalValue(value.id);
      if (!id) return [];
      return [{
        id,
        version: optionalValue(value.version),
        affectsGameplay: typeof value.affectsGameplay === "boolean" ? value.affectsGameplay : undefined,
        hash: optionalValue(value.hash)
      }];
    }).sort((left, right) => left.id.localeCompare(right.id));
    if (values.length !== parsed.length) notes.push("mods_invalid_entries_omitted");
    return { declared: true, values };
  } catch {
    notes.push("mods_json_invalid");
    return { declared: false, values: [] };
  }
}

function normalizeReleaseChannel(value: string | undefined, notes: string[]): "main" | "beta" | "unknown" {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "main" || normalized === "beta") return normalized;
  if (normalized) notes.push("release_channel_invalid");
  return "unknown";
}

function missingIdentityFields(fingerprint: EnvironmentFingerprint): string[] {
  const missing: string[] = [];
  if (!fingerprint.gameBuild) missing.push("game_build");
  if (fingerprint.releaseChannel === "unknown") missing.push("release_channel");
  if (!fingerprint.contentManifestHash) missing.push("content_manifest_hash");
  if (!fingerprint.modsDeclared) missing.push("mods");
  if (!fingerprint.adapter.version) missing.push("adapter_version");
  if (!fingerprint.adapter.capabilityHash) missing.push("adapter_capabilities");
  if (!fingerprint.factSnapshotVersion) missing.push("fact_snapshot_version");
  if (!fingerprint.agentRevision) missing.push("agent_revision");
  return missing;
}

function optionalValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 256) : undefined;
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
