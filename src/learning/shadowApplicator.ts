import { createHash } from "node:crypto";
import type { DeliberationPacket, JsonRecord, P9ShadowWorkspaceOverlay } from "../domain/types.js";
import { buildDeliberationWorkspacePrompt } from "../agent/workspace.js";
import type { WorkspaceAblationMode } from "../agent/workspaceExperimentConfig.js";
import type { ScoredCandidate } from "../agent/types.js";
import type { LlmDecider } from "../agent/llm.js";
import { classifyProviderFailure } from "../agent/providerFailureClassifier.js";
import { P8_PROVIDER_RECOVERY_POLICY_NAME } from "../agent/providerRecoveryPolicy.js";
import { isRecord } from "../agent/utils.js";
import { assessShadowWorkspaceOverlayEligibility } from "./shadowOverlayPolicy.js";
import { buildProviderExperimentFingerprint } from "./providerExperimentFingerprint.js";
import type { ShadowWorkspaceOutcomeEvidence, ShadowWorkspaceProviderAttempt } from "./shadowEvaluation.js";

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

export interface SameSliceShadowRunResult {
  comparison: LearningProposalShadowWorkspaceComparison;
  overlayOutcome?: ShadowWorkspaceOutcomeEvidence;
}

export function compareLearningProposalInShadowWorkspace(input: {
  proposal: JsonRecord;
  sourceTransition?: JsonRecord;
  packet: DeliberationPacket;
  candidates: ScoredCandidate[];
  decisionClass?: string;
  mode?: WorkspaceAblationMode;
  baselineReasonQualityNotes?: string[];
}): LearningProposalShadowWorkspaceComparison {
  return assembleLearningProposalShadowWorkspace(input).comparison;
}

/**
 * Runs only the overlay prompt against a provider. The caller must supply the
 * recorded baseline scope; this function has no game client or execution path.
 */
export async function runLearningProposalInSameSliceShadow(input: {
  proposal: JsonRecord;
  sourceTransition?: JsonRecord;
  packet: DeliberationPacket;
  candidates: ScoredCandidate[];
  decisionClass?: string;
  mode?: WorkspaceAblationMode;
  baselineReasonQualityNotes?: string[];
  decider: LlmDecider;
  evidenceScope: Pick<ShadowWorkspaceOutcomeEvidence, "transitionId" | "revisionTag" | "budgetWindow" | "providerProfile">;
}): Promise<SameSliceShadowRunResult> {
  const assembled = assembleLearningProposalShadowWorkspace(input);
  if (!assembled.overlayPrompt) return { comparison: assembled.comparison };
  const artifact = assembled.comparison.overlay;
  if (!artifact || !(input.decider.isAvailable?.() ?? true)) {
    return {
      comparison: assembled.comparison,
      overlayOutcome: {
        source: "same_slice_shadow",
        ...input.evidenceScope,
        promptHash: artifact?.promptHash ?? "unknown",
        allowedCandidateIdsHash: artifact?.allowedCandidateIdsHash ?? "unknown",
        candidateFutureFactsHash: artifact?.candidateFutureFactsHash ?? "unknown",
        outcome: "unavailable",
        failureBucket: "provider_unavailable"
      }
    };
  }
  try {
    const decision = await input.decider.decide(assembled.overlayPrompt);
    const candidateId = decision?.candidateId;
    const valid = typeof candidateId === "string" && artifact.allowedCandidateIds.includes(candidateId);
    const decisionRecord = decision as unknown as JsonRecord | null;
    const metadata = decisionRecord && isRecord(decisionRecord.providerMetadata) ? decisionRecord.providerMetadata : {};
    const audit = decisionRecord && isRecord(decisionRecord.providerAudit) ? decisionRecord.providerAudit : {};
    const outcome = valid ? "valid" : typeof candidateId === "string" && candidateId.length > 0 ? "invalid_choice" : "invalid_output";
    const failure = classifyProviderFailure({
      outcome,
      providerFinishReason: optionalString(metadata.finishReason),
      providerParseState: optionalString(audit.parseState),
      providerCleanupReason: optionalString(audit.cleanupReason),
      providerOutputKind: optionalString(audit.contentKind),
      validationError: valid ? undefined : "same_slice_shadow_candidate_validation_failed"
    });
    return {
      comparison: assembled.comparison,
      overlayOutcome: {
        source: "same_slice_shadow",
        ...input.evidenceScope,
        promptHash: artifact.promptHash,
        allowedCandidateIdsHash: artifact.allowedCandidateIdsHash,
        candidateFutureFactsHash: artifact.candidateFutureFactsHash,
        outcome,
        selectedCandidateId: valid ? candidateId : undefined,
        reason: optionalString(decisionRecord?.reason),
        failureBucket: failure.bucket,
        finishReason: optionalString(metadata.finishReason),
        outputCapHit: optionalString(metadata.finishReason) === "length",
        providerProfile: providerProfile(metadata, audit),
        providerAttempts: providerAttempts(audit),
        providerExperimentFingerprint: buildProviderExperimentFingerprint({
          provider: metadata.provider,
          providerSource: "workspace_shadow",
          model: metadata.model,
          responseMode: metadata.requestMode ?? audit.requestMode,
          thinkingMode: metadata.requestedThinkingMode ?? audit.requestedThinkingMode,
          maxOutputTokens: metadata.maxOutputTokens,
          retryCount: audit.retryCount,
          recoveryPolicyName: P8_PROVIDER_RECOVERY_POLICY_NAME,
          attempts: audit.attempts
        })
      }
    };
  } catch {
    return {
      comparison: assembled.comparison,
      overlayOutcome: {
        source: "same_slice_shadow",
        ...input.evidenceScope,
        promptHash: artifact.promptHash,
        allowedCandidateIdsHash: artifact.allowedCandidateIdsHash,
        candidateFutureFactsHash: artifact.candidateFutureFactsHash,
        outcome: "error",
        failureBucket: "provider_request_error"
      }
    };
  }
}

function assembleLearningProposalShadowWorkspace(input: {
  proposal: JsonRecord;
  sourceTransition?: JsonRecord;
  packet: DeliberationPacket;
  candidates: ScoredCandidate[];
  decisionClass?: string;
  mode?: WorkspaceAblationMode;
  baselineReasonQualityNotes?: string[];
}): { comparison: LearningProposalShadowWorkspaceComparison; overlayPrompt?: string } {
  const mode = input.mode ?? "full";
  const eligibility = assessShadowWorkspaceOverlayEligibility(input.proposal, input.sourceTransition);
  const baselinePrompt = buildDeliberationWorkspacePrompt(input.packet, input.candidates, mode, input.decisionClass);
  const baseline = summarizePrompt(baselinePrompt, input.packet, input.candidates);
  const proposalId = typeof input.proposal.id === "string" ? input.proposal.id : "unknown";

  if (!eligibility.eligible || !eligibility.patch) {
    return { comparison: unavailableComparison({ proposalId, decisionClass: input.decisionClass, mode, blockers: eligibility.blockers, baseline }) };
  }

  const futureIds = new Set(input.packet.candidateFutures.map((future) => future.id));
  const requestedIds = eligibility.patch.candidateFutureIds ?? [];
  const matchedCandidateFutureIds = requestedIds.filter((id) => futureIds.has(id));
  const unknownIds = requestedIds.filter((id) => !futureIds.has(id));
  if (unknownIds.length > 0) {
    return {
      comparison: {
        ...unavailableComparison({ proposalId, decisionClass: input.decisionClass, mode, blockers: [`unknown_candidate_future_ids:${unknownIds.join(",")}`], baseline }),
        matchedCandidateFutureIds,
        notes: ["The overlay was rejected rather than guessing a candidate future."]
      }
    };
  }
  if (eligibility.patch.requiredReasonQualityNote &&
    !input.baselineReasonQualityNotes?.includes(eligibility.patch.requiredReasonQualityNote)) {
    return {
      comparison: unavailableComparison({
        proposalId,
        decisionClass: input.decisionClass,
        mode,
        blockers: [`required_reason_quality_note_missing:${eligibility.patch.requiredReasonQualityNote}`],
        baseline
      })
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
    comparison: {
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
    },
    overlayPrompt
  };
}

function unavailableComparison(input: {
  proposalId: string;
  decisionClass?: string;
  mode: WorkspaceAblationMode;
  blockers: string[];
  baseline: ShadowWorkspacePromptArtifact;
}): LearningProposalShadowWorkspaceComparison {
  return {
    schemaVersion: 1,
    surface: "p9_shadow_workspace_comparison",
    proposalId: input.proposalId,
    decisionClass: input.decisionClass,
    mode: input.mode,
    eligibleForOfflineShadowAssembly: false,
    applied: false,
    blockers: input.blockers,
    changedPaths: [],
    matchedCandidateFutureIds: [],
    baseline: input.baseline,
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

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function providerProfile(metadata: JsonRecord, audit: JsonRecord): string {
  const output = typeof metadata.maxOutputTokens === "number" ? metadata.maxOutputTokens : "unknown";
  const thinking = optionalString(metadata.requestedThinkingMode) ?? optionalString(audit.requestedThinkingMode) ?? "unknown";
  const mode = optionalString(metadata.requestMode) ?? optionalString(audit.requestMode) ?? "unknown";
  const retry = typeof audit.retryCount === "number" ? audit.retryCount : "unknown";
  return `output=${output};thinking=${thinking};mode=${mode};retry=${retry}`;
}

function providerAttempts(audit: JsonRecord): ShadowWorkspaceProviderAttempt[] | undefined {
  if (!Array.isArray(audit.attempts)) return undefined;
  const attempts = audit.attempts.flatMap((attempt) => {
    if (!isRecord(attempt) || (attempt.requestKind !== "primary" && attempt.requestKind !== "rescue")) return [];
    return [{
      requestKind: attempt.requestKind,
      rescueMode: attempt.rescueMode === "empty" || attempt.rescueMode === "truncation" ? attempt.rescueMode : undefined,
      requestMaxOutputTokens: typeof attempt.requestMaxOutputTokens === "number" ? attempt.requestMaxOutputTokens : undefined,
      requestedThinkingMode: optionalString(attempt.requestedThinkingMode),
      finishReason: optionalString(attempt.finishReason),
      contentKind: optionalString(attempt.contentKind)
    } satisfies ShadowWorkspaceProviderAttempt];
  });
  return attempts.length > 0 ? attempts : undefined;
}
