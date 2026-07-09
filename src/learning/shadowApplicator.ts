import { createHash } from "node:crypto";
import type { DeliberationPacket, JsonRecord, P9ShadowWorkspaceOverlay } from "../domain/types.js";
import { buildDeliberationWorkspacePrompt } from "../agent/workspace.js";
import type { WorkspaceAblationMode } from "../agent/workspaceExperimentConfig.js";
import type { ScoredCandidate } from "../agent/types.js";
import { assessShadowWorkspaceOverlayEligibility } from "./shadowOverlayPolicy.js";

export interface LearningProposalShadowWorkspaceComparison {
  schemaVersion: number;
  surface: "p9_shadow_workspace_comparison";
  proposalId: string;
  decisionClass?: string;
  mode: WorkspaceAblationMode;
  eligibleForOfflineShadowAssembly: boolean;
  applied: boolean;
  blockers: string[];
  changedPaths: string[];
  matchedCandidateFutureIds: string[];
  baseline: ShadowWorkspacePromptArtifact;
  overlay?: ShadowWorkspacePromptArtifact;
  wouldCallProvider: false;
  wouldWriteRunArtifact: false;
  wouldAffectLiveBehavior: false;
  wouldAffectRuntimeDecision: false;
  stablePromotionEnabled: false;
  notes: string[];
}

export interface ShadowWorkspacePromptArtifact {
  promptHash: string;
  promptBytes: number;
  containsP9Overlay: boolean;
  allowedCandidateIds: string[];
  allowedCandidateIdsHash: string;
  candidateFutureIdsHash: string;
  candidateFutureFactsHash: string;
}

export function compareLearningProposalInShadowWorkspace(input: {
  proposal: JsonRecord;
  packet: DeliberationPacket;
  candidates: ScoredCandidate[];
  decisionClass?: string;
  mode?: WorkspaceAblationMode;
}): LearningProposalShadowWorkspaceComparison {
  const mode = input.mode ?? "full";
  const eligibility = assessShadowWorkspaceOverlayEligibility(input.proposal);
  const baselinePrompt = buildDeliberationWorkspacePrompt(input.packet, input.candidates, mode, input.decisionClass);
  const baseline = summarizePrompt(baselinePrompt, input.packet, input.candidates);
  const proposalId = typeof input.proposal.id === "string" ? input.proposal.id : "unknown";

  if (!eligibility.eligible || !eligibility.patch) {
    return {
      schemaVersion: 1,
      surface: "p9_shadow_workspace_comparison",
      proposalId,
      decisionClass: input.decisionClass,
      mode,
      eligibleForOfflineShadowAssembly: false,
      applied: false,
      blockers: eligibility.blockers,
      changedPaths: [],
      matchedCandidateFutureIds: [],
      baseline,
      wouldCallProvider: false,
      wouldWriteRunArtifact: false,
      wouldAffectLiveBehavior: false,
      wouldAffectRuntimeDecision: false,
      stablePromotionEnabled: false,
      notes: [
        "No overlay was assembled.",
        "P9 shadow comparison never calls a provider, writes a transition, or changes runtime behavior."
      ]
    };
  }

  const futureIds = new Set(input.packet.candidateFutures.map((future) => future.id));
  const requestedIds = eligibility.patch.candidateFutureIds ?? [];
  const matchedCandidateFutureIds = requestedIds.filter((id) => futureIds.has(id));
  const unknownIds = requestedIds.filter((id) => !futureIds.has(id));
  if (unknownIds.length > 0) {
    return {
      schemaVersion: 1,
      surface: "p9_shadow_workspace_comparison",
      proposalId,
      decisionClass: input.decisionClass,
      mode,
      eligibleForOfflineShadowAssembly: false,
      applied: false,
      blockers: [`unknown_candidate_future_ids:${unknownIds.join(",")}`],
      changedPaths: [],
      matchedCandidateFutureIds,
      baseline,
      wouldCallProvider: false,
      wouldWriteRunArtifact: false,
      wouldAffectLiveBehavior: false,
      wouldAffectRuntimeDecision: false,
      stablePromotionEnabled: false,
      notes: ["The overlay was rejected rather than guessing a candidate future."]
    };
  }

  const overlay: P9ShadowWorkspaceOverlay = {
    schemaVersion: 1,
    source: "p9_shadow_workspace_applicator_v1",
    proposalIds: [proposalId],
    guidance: [{
      kind: eligibility.patch.kind,
      targetLayer: stringValue(input.proposal.targetLayer, "unknown"),
      text: eligibility.patch.guidance,
      candidateFutureIds: matchedCandidateFutureIds.length ? matchedCandidateFutureIds : undefined
    }],
    policy: "offline_shadow_only"
  };
  const overlayPacket = clonePacketWithOverlay(input.packet, overlay);
  const overlayPrompt = buildDeliberationWorkspacePrompt(overlayPacket, input.candidates, mode, input.decisionClass);
  return {
    schemaVersion: 1,
    surface: "p9_shadow_workspace_comparison",
    proposalId,
    decisionClass: input.decisionClass,
    mode,
    eligibleForOfflineShadowAssembly: true,
    applied: true,
    blockers: [],
    changedPaths: ["deliberationPacket.p9ShadowWorkspaceOverlay", "workspace.p9_shadow_workspace_overlay"],
    matchedCandidateFutureIds,
    baseline,
    overlay: summarizePrompt(overlayPrompt, overlayPacket, input.candidates),
    wouldCallProvider: false,
    wouldWriteRunArtifact: false,
    wouldAffectLiveBehavior: false,
    wouldAffectRuntimeDecision: false,
    stablePromotionEnabled: false,
    notes: [
      "The overlay exists only in a cloned DeliberationPacket used for this comparison.",
      "Candidate facts, candidate order, validation, execution, provider calls, and stable stores remain unchanged.",
      "This comparison is evidence for later P9.5 shadow evaluation, not evidence for promotion."
    ]
  };
}

function clonePacketWithOverlay(packet: DeliberationPacket, overlay: P9ShadowWorkspaceOverlay): DeliberationPacket {
  // Packets are telemetry-shaped JSON. Cloning prevents the offline comparison
  // from mutating the transition object that supplied its baseline.
  return {
    ...(JSON.parse(JSON.stringify(packet)) as DeliberationPacket),
    p9ShadowWorkspaceOverlay: overlay
  };
}

function summarizePrompt(
  prompt: string,
  packet: DeliberationPacket,
  candidates: ScoredCandidate[]
): ShadowWorkspacePromptArtifact {
  return {
    promptHash: createHash("sha256").update(prompt).digest("hex").slice(0, 16),
    promptBytes: Buffer.byteLength(prompt, "utf8"),
    containsP9Overlay: prompt.includes("p9_shadow_workspace_overlay"),
    allowedCandidateIds: candidates.map((candidate) => candidate.id),
    allowedCandidateIdsHash: hashJson(candidates.map((candidate) => candidate.id)),
    candidateFutureIdsHash: hashJson(packet.candidateFutures.map((future) => future.id)),
    candidateFutureFactsHash: hashJson(packet.candidateFutures)
  };
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
