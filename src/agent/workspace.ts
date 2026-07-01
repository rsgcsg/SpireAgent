import { createHash } from "node:crypto";
import {
  DOMAIN_SCHEMA_VERSION,
  type DeliberationPacket,
  type DeliberationWorkspaceComparison,
  type JsonRecord,
  type ShadowWorkspaceDecision
} from "../domain/types.js";
import type { LlmDecider } from "./llm.js";
import { validateLlmDecisionForCandidates } from "./llm.js";
import type { ScoredCandidate } from "./types.js";
import { isRecord } from "./utils.js";

export const P8_WORKSPACE_SHADOW_FLAG = "STS2_P8_WORKSPACE_SHADOW";
export const P8_WORKSPACE_CALL_FLAG = "STS2_P8_WORKSPACE_CALL";

export interface WorkspaceShadowOptions {
  shadowEnabled?: boolean;
  callEnabled?: boolean;
}

export interface WorkspaceComparisonInput {
  legacyPrompt?: string;
  deliberationPacket: DeliberationPacket;
  candidates: ScoredCandidate[];
  decisionClass: string;
  options?: WorkspaceShadowOptions;
}

export interface ShadowWorkspaceDecisionInput {
  comparison: DeliberationWorkspaceComparison;
  structuredPrompt: string;
  candidates: ScoredCandidate[];
  llm: LlmDecider;
  legacySelectedCandidateId?: string;
  options?: WorkspaceShadowOptions;
}

export interface P8WorkspaceShadow {
  structuredPrompt: string;
  comparison: DeliberationWorkspaceComparison;
  shadowDecision: ShadowWorkspaceDecision;
}

export function workspaceOptionsFromEnv(): WorkspaceShadowOptions {
  return {
    shadowEnabled: isEnabled(process.env[P8_WORKSPACE_SHADOW_FLAG]),
    callEnabled: isEnabled(process.env[P8_WORKSPACE_CALL_FLAG])
  };
}

export function buildStructuredDeliberationWorkspacePrompt(packet: DeliberationPacket): string {
  const payload = {
    task: "Choose exactly one candidate action for Slay the Spire 2 from the structured strategic workspace. Return short JSON only.",
    north_star_boundary: [
      "LLM is the strategic player",
      "local scaffold exposes observations, memory activation, candidate futures, and validation constraints",
      "choose an existing candidate id; do not invent actions"
    ],
    output_schema: packet.outputSchema ?? {
      candidateId: "string",
      confidence: "0..1 number",
      reason: "short strategic reason"
    },
    state_summary: packet.stateSummary,
    screen: packet.screen,
    state_facts: packet.stateFacts,
    enemy_intent: packet.enemyIntent,
    hand_summary: packet.handSummary,
    deck_summary: packet.deckSummary,
    strategic_impression: packet.strategicImpression,
    salience_signals: packet.salienceSignals,
    memory_activation: packet.memoryActivation,
    derived_knowledge: packet.derivedKnowledgeSummary,
    candidate_futures: packet.candidateFutures.slice(0, 8).map((future) => ({
      id: future.sourceCandidateId ?? future.id,
      futureId: future.id,
      label: future.label,
      plan: future.plan,
      predictedOutcome: future.predictedOutcome,
      predictionChecks: future.predictionChecks,
      cost: future.cost,
      risk: future.risk,
      assumptions: future.assumptions,
      invalidationTriggers: future.invalidationTriggers,
      confidence: future.confidence
    })),
    top_candidates: packet.topCandidates,
    legal_actions_summary: packet.legalActionsSummary,
    deterministic_calculations: packet.deterministicCalculations,
    tradeoffs: packet.tradeoffs,
    uncertainty: packet.uncertainty,
    validation_constraints: packet.validationConstraints
  };
  return JSON.stringify(payload);
}

export function buildWorkspaceComparison(input: WorkspaceComparisonInput): DeliberationWorkspaceComparison {
  const options = input.options ?? workspaceOptionsFromEnv();
  const structuredPrompt = buildStructuredDeliberationWorkspacePrompt(input.deliberationPacket);
  const promptParity = isRecord(input.deliberationPacket.promptParity) ? input.deliberationPacket.promptParity : {};
  const coveredSections = Array.isArray(promptParity.coveredSections) ? promptParity.coveredSections.map(String) : [];
  const missingSections = Array.isArray(promptParity.missingSections) ? promptParity.missingSections.map(String) : [];
  const structuredSections = structuredWorkspaceSections(input.deliberationPacket);
  const missingStructuredSections = requiredStructuredSections(input.deliberationPacket);
  const readinessReasons: string[] = [];
  const shadowEnabled = Boolean(options.shadowEnabled);
  if (!shadowEnabled) readinessReasons.push(`${P8_WORKSPACE_SHADOW_FLAG}=off`);
  if (!input.legacyPrompt?.trim()) readinessReasons.push("legacy_prompt_missing");
  if (!structuredPrompt.trim()) readinessReasons.push("structured_prompt_missing");
  if (input.candidates.length === 0) readinessReasons.push("candidate_count_zero");
  for (const section of missingStructuredSections) {
    readinessReasons.push(`missing_structured_section:${section}`);
  }
  const promptParityCoverage = typeof promptParity.coverage === "number" ? promptParity.coverage : undefined;
  if (promptParityCoverage !== undefined && promptParityCoverage < 0.8) readinessReasons.push(`low_prompt_parity_coverage:${promptParityCoverage}`);
  const gatedReadiness = readinessReasons.length === 0 ? "ready" : "not_ready";
  const legacyPromptBytes = input.legacyPrompt ? Buffer.byteLength(input.legacyPrompt, "utf8") : undefined;
  const structuredPromptBytes = Buffer.byteLength(structuredPrompt, "utf8");
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    phase: "P8",
    mode: "shadow",
    featureFlag: P8_WORKSPACE_SHADOW_FLAG,
    enabled: shadowEnabled,
    structuredPromptAvailable: structuredPrompt.length > 0,
    legacyPromptAvailable: Boolean(input.legacyPrompt?.trim()),
    decisionClass: input.decisionClass,
    legacyPromptHash: input.legacyPrompt ? hashText(input.legacyPrompt) : undefined,
    structuredPromptHash: hashText(structuredPrompt),
    legacyPromptBytes,
    structuredPromptBytes,
    legacyTokenEstimate: legacyPromptBytes === undefined ? undefined : estimateTokens(input.legacyPrompt ?? ""),
    structuredTokenEstimate: estimateTokens(structuredPrompt),
    coverage: {
      promptParityCoverage,
      coveredSections,
      missingSections,
      structuredSections,
      missingStructuredSections,
      candidateFutureCount: input.deliberationPacket.candidateFutures.length
    },
    gatedReadiness,
    readinessReasons,
    summary: `P8 structured workspace ${gatedReadiness}; legacy=${legacyPromptBytes ?? 0}B structured=${structuredPromptBytes}B candidates=${input.candidates.length}`
  };
}

export async function buildP8WorkspaceShadow(input: ShadowWorkspaceDecisionInput): Promise<P8WorkspaceShadow> {
  const options = input.options ?? workspaceOptionsFromEnv();
  const callEnabled = Boolean(options.callEnabled);
  const baseDecision = (outcome: ShadowWorkspaceDecision["outcome"], reason?: string): ShadowWorkspaceDecision => ({
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    phase: "P8",
    mode: "shadow",
    enabled: input.comparison.enabled,
    attempted: input.comparison.enabled,
    called: false,
    available: input.llm.isAvailable?.() ?? true,
    outcome,
    agreement: "not_applicable",
    legacySelectedCandidateId: input.legacySelectedCandidateId,
    reason,
    promptHash: input.comparison.structuredPromptHash
  });

  if (!input.comparison.enabled) {
    return { structuredPrompt: input.structuredPrompt, comparison: input.comparison, shadowDecision: baseDecision("not_enabled") };
  }
  if (input.comparison.gatedReadiness !== "ready") {
    return {
      structuredPrompt: input.structuredPrompt,
      comparison: input.comparison,
      shadowDecision: baseDecision("not_ready", input.comparison.readinessReasons.slice(0, 4).join("; "))
    };
  }
  if (!callEnabled) {
    return { structuredPrompt: input.structuredPrompt, comparison: input.comparison, shadowDecision: baseDecision("unavailable", `${P8_WORKSPACE_CALL_FLAG}=off`) };
  }
  if (!(input.llm.isAvailable?.() ?? true)) {
    return { structuredPrompt: input.structuredPrompt, comparison: input.comparison, shadowDecision: baseDecision("unavailable", "llm_unavailable") };
  }

  try {
    const decision = await input.llm.decide(input.structuredPrompt);
    const validation = validateLlmDecisionForCandidates(decision, input.candidates);
    const candidateId = typeof decision?.candidateId === "string" ? decision.candidateId : undefined;
    const agreement = candidateId === undefined
      ? "not_applicable"
      : input.candidates.some((candidate) => candidate.id === candidateId)
        ? candidateId === input.legacySelectedCandidateId ? "agree" : "disagree"
        : "missing_candidate";
    return {
      structuredPrompt: input.structuredPrompt,
      comparison: input.comparison,
      shadowDecision: {
        schemaVersion: DOMAIN_SCHEMA_VERSION,
        phase: "P8",
        mode: "shadow",
        enabled: true,
        attempted: true,
        called: true,
        available: true,
        outcome: validation.valid ? "valid" : validation.outcome ?? "invalid_output",
        agreement: validation.valid ? agreement : candidateId ? "missing_candidate" : "not_applicable",
        legacySelectedCandidateId: input.legacySelectedCandidateId,
        structuredSelectedCandidateId: candidateId,
        confidence: typeof decision?.confidence === "number" ? decision.confidence : undefined,
        reason: typeof decision?.reason === "string" ? decision.reason : undefined,
        reasonQuality: reasonQuality(decision?.reason),
        validationError: validation.error,
        promptHash: input.comparison.structuredPromptHash
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      structuredPrompt: input.structuredPrompt,
      comparison: input.comparison,
      shadowDecision: {
        ...baseDecision("error", message.slice(0, 240)),
        called: true,
        available: true,
        error: message.slice(0, 240)
      }
    };
  }
}

export async function buildP8WorkspaceShadowFromPacket(input: WorkspaceComparisonInput & {
  llm: LlmDecider;
  legacySelectedCandidateId?: string;
}): Promise<P8WorkspaceShadow> {
  const structuredPrompt = buildStructuredDeliberationWorkspacePrompt(input.deliberationPacket);
  const comparison = buildWorkspaceComparison(input);
  return buildP8WorkspaceShadow({
    comparison,
    structuredPrompt,
    candidates: input.candidates,
    llm: input.llm,
    legacySelectedCandidateId: input.legacySelectedCandidateId,
    options: input.options
  });
}

function structuredWorkspaceSections(packet: DeliberationPacket): string[] {
  const sections: Array<[string, boolean]> = [
    ["state_summary", Boolean(packet.stateSummary)],
    ["state_facts", isRecord(packet.stateFacts)],
    ["enemy_intent", Array.isArray(packet.enemyIntent)],
    ["hand_summary", Array.isArray(packet.handSummary)],
    ["deck_summary", isRecord(packet.deckSummary)],
    ["strategic_impression", isRecord(packet.strategicImpression)],
    ["salience_signals", Array.isArray(packet.salienceSignals)],
    ["memory_activation", isRecord(packet.memoryActivation)],
    ["derived_knowledge", isRecord(packet.derivedKnowledgeSummary)],
    ["candidate_futures", Array.isArray(packet.candidateFutures) && packet.candidateFutures.length > 0],
    ["validation_constraints", Array.isArray(packet.validationConstraints)],
    ["output_schema", isRecord(packet.outputSchema)]
  ];
  return sections.filter(([, present]) => present).map(([name]) => name);
}

function requiredStructuredSections(packet: DeliberationPacket): string[] {
  const present = new Set(structuredWorkspaceSections(packet));
  return ["state_summary", "strategic_impression", "salience_signals", "candidate_futures", "validation_constraints", "output_schema"]
    .filter((section) => !present.has(section));
}

function reasonQuality(reason: unknown): ShadowWorkspaceDecision["reasonQuality"] {
  if (typeof reason !== "string" || reason.trim().length === 0) return "missing";
  return reason.trim().length < 24 ? "thin" : "adequate";
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function isEnabled(value: string | undefined): boolean {
  return /^(1|true|yes|on)$/i.test(String(value ?? "").trim());
}
