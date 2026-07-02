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
export const P8_DEEPSEEK_API_KEY_FLAG = "STS2_DEEPSEEK_API_KEY";
export const P8_DEEPSEEK_MODEL_FLAG = "STS2_DEEPSEEK_MODEL";
export const P8_LIVE_ADDITIVE_FLAG = "STS2_P8_LIVE_ADDITIVE";
export const P8_LIVE_DECISION_CLASSES_FLAG = "STS2_P8_LIVE_DECISION_CLASSES";
export const P8_WORKSPACE_ABLATION_MODE_FLAG = "STS2_P8_WORKSPACE_ABLATION_MODE";
export const P8_WORKSPACE_REVISION = "2026-07-02-workspace-ablation-v1";

export type WorkspaceAblationMode = "full" | "compact" | "ultra_compact";

let shadowCallsUsedThisProcess = 0;

export interface WorkspaceShadowOptions {
  shadowEnabled?: boolean;
  callEnabled?: boolean;
  providerAvailable?: boolean;
  providerName?: string;
  model?: string;
  maxShadowCalls?: number;
  softInputTokenLimit?: number;
  hardInputTokenLimit?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  retryLimit?: number;
  maxEstimatedCostUsd?: number;
  estimatedInputUsdPerMillionTokens?: number;
  estimatedOutputUsdPerMillionTokens?: number;
  ablationMode?: WorkspaceAblationMode;
  liveAdditiveEnabled?: boolean;
  liveDecisionClassWhitelist?: string[];
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
    callEnabled: isEnabled(process.env[P8_WORKSPACE_CALL_FLAG]),
    providerAvailable: Boolean((process.env[P8_DEEPSEEK_API_KEY_FLAG] ?? "").trim()),
    providerName: "deepseek-v4-flash",
    model: process.env[P8_DEEPSEEK_MODEL_FLAG] ?? "deepseek-v4-flash",
    maxShadowCalls: numberFromEnvAliases(["STS2_P8_WORKSPACE_MAX_SHADOW_CALLS", "STS2_P8_MAX_SHADOW_CALLS"], 1),
    softInputTokenLimit: numberFromEnv("STS2_P8_WORKSPACE_SOFT_INPUT_TOKENS", 8000),
    hardInputTokenLimit: numberFromEnv("STS2_P8_WORKSPACE_HARD_INPUT_TOKENS", 12000),
    maxOutputTokens: numberFromEnv("STS2_DEEPSEEK_MAX_OUTPUT_TOKENS", 400),
    timeoutMs: numberFromEnv("STS2_DEEPSEEK_TIMEOUT_MS", 25000),
    retryLimit: numberFromEnv("STS2_DEEPSEEK_RETRY_LIMIT", 0),
    maxEstimatedCostUsd: numberFromEnv("STS2_P8_WORKSPACE_MAX_ESTIMATED_COST_USD", 0.05),
    estimatedInputUsdPerMillionTokens: numberFromEnv("STS2_DEEPSEEK_EST_INPUT_USD_PER_MTOK", 0.3),
    estimatedOutputUsdPerMillionTokens: numberFromEnv("STS2_DEEPSEEK_EST_OUTPUT_USD_PER_MTOK", 0.6),
    ablationMode: workspaceAblationModeFromEnv(),
    liveAdditiveEnabled: isEnabled(process.env[P8_LIVE_ADDITIVE_FLAG]),
    liveDecisionClassWhitelist: parseList(process.env[P8_LIVE_DECISION_CLASSES_FLAG])
  };
}

export function workspaceAblationModeFromEnv(): WorkspaceAblationMode {
  return normalizeWorkspaceAblationMode(process.env[P8_WORKSPACE_ABLATION_MODE_FLAG]);
}

export function normalizeWorkspaceAblationMode(value: unknown): WorkspaceAblationMode {
  if (typeof value !== "string") return "full";
  const normalized = value.trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "compact") return "compact";
  if (normalized === "ultra" || normalized === "ultra_compact" || normalized === "ultracompact") return "ultra_compact";
  return "full";
}

export function buildStructuredDeliberationWorkspacePrompt(
  packet: DeliberationPacket,
  candidates: ScoredCandidate[] = []
): string {
  return buildDeliberationWorkspacePrompt(packet, candidates, "full");
}

export function buildDeliberationWorkspacePrompt(
  packet: DeliberationPacket,
  candidates: ScoredCandidate[] = [],
  mode: WorkspaceAblationMode = "full"
): string {
  const allowedCandidateIds = candidates.map((candidate) => candidate.id);
  const payload = mode === "ultra_compact"
    ? buildUltraCompactWorkspacePayload(packet, candidates, allowedCandidateIds)
    : mode === "compact"
      ? buildCompactWorkspacePayload(packet, candidates, allowedCandidateIds)
      : buildFullWorkspacePayload(packet, candidates, allowedCandidateIds);
  return `${JSON.stringify(payload)}\n${workspaceCandidateFooter(allowedCandidateIds)}`;
}

function buildFullWorkspacePayload(
  packet: DeliberationPacket,
  candidates: ScoredCandidate[],
  allowedCandidateIds: string[]
): JsonRecord {
  return {
    ablation_mode: "full",
    task: "Choose exactly one candidate action for Slay the Spire 2 from the structured strategic workspace. Return short JSON only.",
    north_star_boundary: [
      "LLM is the strategic player",
      "local scaffold exposes observations, memory activation, candidate futures, and validation constraints",
      "choose an existing candidate id; do not invent actions"
    ],
    response_contract: {
      return_json_only: true,
      no_markdown: true,
      no_code_fence: true,
      never_return_empty_response: true,
      choose_exactly_one_candidate_id_from_allowed_list: true,
      if_uncertain_still_choose_one_allowed_candidate_id: true,
      required_fields: ["selectedCandidateId", "reasonBrief"],
      preferred_shape: {
        selectedCandidateId: "<exact allowed candidate id>",
        confidence: 0.0,
        reasonBrief: "short strategic reason",
        riskTags: [],
        missingInfo: [],
        scaffoldFeedback: []
      }
    },
    allowed_candidate_ids: allowedCandidateIds,
    output_schema: packet.outputSchema ?? {
      selectedCandidateId: "string",
      confidence: "0..1 number",
      reasonBrief: "short strategic reason",
      riskTags: "string[]",
      missingInfo: "string[]",
      scaffoldFeedback: "string[]"
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
}

function buildCompactWorkspacePayload(
  packet: DeliberationPacket,
  candidates: ScoredCandidate[],
  allowedCandidateIds: string[]
): JsonRecord {
  return {
    ablation_mode: "compact",
    task: "Choose exactly one allowed candidate id. Return JSON only.",
    response_contract: workspaceResponseContract(),
    allowed_candidate_ids: allowedCandidateIds,
    output_schema: shortOutputSchema(packet),
    screen: packet.screen,
    state_summary: packet.stateSummary,
    state_facts: packet.stateFacts,
    enemy_intent: packet.enemyIntent,
    hand_summary: packet.handSummary,
    deck_summary: packet.deckSummary,
    strategic_impression: packet.strategicImpression?.summary ?? packet.strategicImpression,
    salience_signals: (packet.salienceSignals ?? []).slice(0, 5).map((signal) => ({
      severity: signal.severity,
      label: signal.label,
      reason: trimText(signal.reason, 120)
    })),
    memory_activation: packet.memoryActivation?.items.slice(0, 3).map((item) => ({
      kind: item.kind,
      summary: trimText(item.summary, 140),
      relevance: item.relevance,
      confidence: item.confidence
    })),
    derived_knowledge: compactRecord(packet.derivedKnowledgeSummary, 5),
    candidate_futures: packet.candidateFutures.slice(0, 6).map((future) => ({
      id: future.sourceCandidateId ?? future.id,
      label: future.label,
      predictedOutcome: trimText(future.predictedOutcome, 180),
      risk: future.risk?.slice(0, 2).map((item) => trimText(item, 100)),
      assumptions: future.assumptions?.slice(0, 2).map((item) => trimText(item, 100)),
      confidence: future.confidence
    })),
    top_candidates: candidates.slice(0, 6).map(compactCandidate),
    validation_constraints: (packet.validationConstraints ?? []).slice(0, 6).map((item) => trimText(String(item), 140))
  };
}

function buildUltraCompactWorkspacePayload(
  packet: DeliberationPacket,
  candidates: ScoredCandidate[],
  allowedCandidateIds: string[]
): JsonRecord {
  return {
    ablation_mode: "ultra_compact",
    task: "Pick one allowed candidate id. Return JSON only.",
    response_contract: workspaceResponseContract(),
    allowed_candidate_ids: allowedCandidateIds,
    output_schema: shortOutputSchema(packet),
    screen: packet.screen,
    state_summary: trimText(packet.stateSummary, 220),
    enemy_intent: (packet.enemyIntent ?? []).slice(0, 4),
    hand_summary: (packet.handSummary ?? []).slice(0, 8),
    strategic_impression: trimText(packet.strategicImpression?.summary, 220),
    salience: (packet.salienceSignals ?? []).slice(0, 4).map((signal) => trimText(`${signal.severity}:${signal.label}:${signal.reason}`, 160)),
    candidates: candidates.slice(0, 8).map(compactCandidate),
    candidate_futures: packet.candidateFutures.slice(0, 5).map((future) => ({
      id: future.sourceCandidateId ?? future.id,
      outcome: trimText(future.predictedOutcome, 160),
      risk: future.risk?.slice(0, 1).map((item) => trimText(item, 100))
    })),
    validation_constraints: (packet.validationConstraints ?? []).slice(0, 4).map((item) => trimText(String(item), 120))
  };
}

export function buildCompactWorkspaceSummary(packet: DeliberationPacket): string {
  const topFutures = packet.candidateFutures.slice(0, 5).map((future) => ({
    id: future.sourceCandidateId ?? future.id,
    label: future.label,
    predictedOutcome: future.predictedOutcome,
    risk: future.risk?.slice(0, 3),
    assumptions: future.assumptions?.slice(0, 3),
    confidence: future.confidence
  }));
  return JSON.stringify({
    p8_workspace_summary: true,
    screen: packet.screen,
    state: packet.stateSummary,
    strategic_impression: packet.strategicImpression?.summary,
    salience: (packet.salienceSignals ?? []).slice(0, 6).map((signal) => ({
      kind: signal.kind,
      severity: signal.severity,
      label: signal.label,
      reason: signal.reason
    })),
    memory: packet.memoryActivation?.items.slice(0, 5).map((item) => ({
      kind: item.kind,
      summary: item.summary,
      relevance: item.relevance,
      confidence: item.confidence
    })),
    derived: packet.derivedKnowledgeSummary,
    candidate_futures: topFutures,
    validation_constraints: packet.validationConstraints
  });
}

export function buildWorkspaceComparison(input: WorkspaceComparisonInput): DeliberationWorkspaceComparison {
  const options = input.options ?? workspaceOptionsFromEnv();
  const ablationMode = options.ablationMode ?? "full";
  const structuredPrompt = buildDeliberationWorkspacePrompt(input.deliberationPacket, input.candidates, ablationMode);
  const compactWorkspaceSummary = buildCompactWorkspaceSummary(input.deliberationPacket);
  const promptParity = isRecord(input.deliberationPacket.promptParity) ? input.deliberationPacket.promptParity : {};
  const coveredSections = Array.isArray(promptParity.coveredSections) ? promptParity.coveredSections.map(String) : [];
  const missingSections = Array.isArray(promptParity.missingSections) ? promptParity.missingSections.map(String) : [];
  const structuredSections = structuredWorkspaceSections(input.deliberationPacket);
  const missingStructuredSections = requiredStructuredSections(input.deliberationPacket);
  const requiredLegacySections = requiredLegacyPromptSections();
  const preservedLegacySections = preservedLegacyPromptSections(input.deliberationPacket, input.candidates);
  const missingLegacySections = requiredLegacySections.filter((section) => !preservedLegacySections.includes(section));
  const sectionTokenEstimate = structuredSectionTokenEstimate(input.deliberationPacket);
  const informationPreservationScore = Number((preservedLegacySections.length / requiredLegacySections.length).toFixed(3));
  const readinessReasons: string[] = [];
  const shadowEnabled = Boolean(options.shadowEnabled);
  if (!shadowEnabled) readinessReasons.push(`${P8_WORKSPACE_SHADOW_FLAG}=off`);
  if (!input.legacyPrompt?.trim()) readinessReasons.push("legacy_prompt_missing");
  if (!structuredPrompt.trim()) readinessReasons.push("structured_prompt_missing");
  if (input.candidates.length === 0) readinessReasons.push("candidate_count_zero");
  for (const section of missingStructuredSections) {
    readinessReasons.push(`missing_structured_section:${section}`);
  }
  for (const section of missingLegacySections) {
    readinessReasons.push(`missing_legacy_section:${section}`);
  }
  const promptParityCoverage = typeof promptParity.coverage === "number" ? promptParity.coverage : undefined;
  if (promptParityCoverage !== undefined && promptParityCoverage < 0.8) readinessReasons.push(`low_prompt_parity_coverage:${promptParityCoverage}`);
  if (informationPreservationScore < 0.9) readinessReasons.push(`low_information_preservation:${informationPreservationScore}`);
  const gatedReadiness = readinessReasons.length === 0 ? "ready" : "not_ready";
  const legacyPromptBytes = input.legacyPrompt ? Buffer.byteLength(input.legacyPrompt, "utf8") : undefined;
  const structuredPromptBytes = Buffer.byteLength(structuredPrompt, "utf8");
  const structuredTokenEstimate = estimateTokens(structuredPrompt);
  const maxOutputTokens = positiveNumber(options.maxOutputTokens, 400);
  const budget = buildWorkspaceBudget(options, structuredTokenEstimate, maxOutputTokens);
  const providerAvailable = Boolean(options.providerAvailable);
  const providerReadinessReasons: string[] = [];
  if (!providerAvailable) providerReadinessReasons.push(`${P8_DEEPSEEK_API_KEY_FLAG}=missing`);
  if (!shadowEnabled) providerReadinessReasons.push(`${P8_WORKSPACE_SHADOW_FLAG}=off`);
  if (gatedReadiness !== "ready") providerReadinessReasons.push("workspace_not_ready");
  const providerReadiness = providerReadinessReasons.length === 0 ? "ready_for_shadow_call" : providerAvailable ? "not_ready" : "needs_api_key";
  const liveAdditiveEnabled = Boolean(options.liveAdditiveEnabled);
  const decisionClassWhitelist = options.liveDecisionClassWhitelist ?? [];
  const decisionClassWhitelisted = decisionClassWhitelist.includes(input.decisionClass);
  const liveReadinessReasons: string[] = [];
  if (!liveAdditiveEnabled) liveReadinessReasons.push(`${P8_LIVE_ADDITIVE_FLAG}=off`);
  if (liveAdditiveEnabled && !decisionClassWhitelisted) liveReadinessReasons.push("decision_class_not_whitelisted");
  if (gatedReadiness !== "ready") liveReadinessReasons.push("workspace_not_ready");
  if (budget.status !== "within_budget" && budget.status !== "soft_token_limit_exceeded") liveReadinessReasons.push(budget.status);
  const liveReadiness = liveReadinessReasons.length === 0 ? "ready" : liveAdditiveEnabled ? "not_ready" : "not_enabled";
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    phase: "P8",
    mode: "shadow",
    revisionTag: P8_WORKSPACE_REVISION,
    ablationMode,
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
    structuredTokenEstimate,
    coverage: {
      promptParityCoverage,
      coveredSections,
      missingSections,
      structuredSections,
      missingStructuredSections,
      candidateFutureCount: input.deliberationPacket.candidateFutures.length,
      requiredLegacySections,
      preservedLegacySections,
      missingLegacySections,
      informationPreservationScore,
      sectionTokenEstimate
    },
    gatedReadiness,
    readinessReasons,
    providerReadiness,
    providerReadinessReasons,
    budget,
    rolloutGate: {
      phase: "P8.5_preparation_only",
      liveIntegrationEnabled: liveAdditiveEnabled,
      liveIntegrationFlag: P8_LIVE_ADDITIVE_FLAG,
      liveReadiness,
      liveReadinessReasons,
      firstLiveMode: "additive_legacy_prompt_plus_compact_workspace_summary",
      structuredPromptOnlyDefaultAllowed: false,
      decisionClassWhitelist,
      decisionClassWhitelisted,
      compactWorkspaceSummaryAvailable: compactWorkspaceSummary.length > 0,
      compactWorkspaceSummaryHash: hashText(compactWorkspaceSummary),
      compactWorkspaceSummaryBytes: Buffer.byteLength(compactWorkspaceSummary, "utf8"),
      compactWorkspaceSummaryTokenEstimate: estimateTokens(compactWorkspaceSummary),
      fallback: "legacy_prompt_only",
      rollback: `unset ${P8_LIVE_ADDITIVE_FLAG}; unset ${P8_WORKSPACE_SHADOW_FLAG} and ${P8_WORKSPACE_CALL_FLAG}; keep legacy prompt path`
    },
    summary: `P8 structured workspace ${gatedReadiness}; ablation=${ablationMode}; preservation=${informationPreservationScore}; legacy=${legacyPromptBytes ?? 0}B structured=${structuredPromptBytes}B candidates=${input.candidates.length}; provider=${providerReadiness}`
  };
}

export async function buildP8WorkspaceShadow(input: ShadowWorkspaceDecisionInput): Promise<P8WorkspaceShadow> {
  const options = input.options ?? workspaceOptionsFromEnv();
  const callEnabled = Boolean(options.callEnabled);
  const providerName = options.providerName ?? "deepseek-v4-flash";
  const model = options.model ?? process.env[P8_DEEPSEEK_MODEL_FLAG] ?? "deepseek-v4-flash";
  const workspacePromptBytes = Buffer.byteLength(input.structuredPrompt, "utf8");
  const workspacePromptTokens = estimateTokens(input.structuredPrompt);
  const ablationMode = typeof input.comparison.ablationMode === "string" ? input.comparison.ablationMode : options.ablationMode ?? "full";
  const baseDecision = (outcome: ShadowWorkspaceDecision["outcome"], reason?: string): ShadowWorkspaceDecision => ({
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    phase: "P8",
    mode: "shadow",
    revisionTag: P8_WORKSPACE_REVISION,
    enabled: input.comparison.enabled,
    attempted: input.comparison.enabled,
    called: false,
    available: input.llm.isAvailable?.() ?? true,
    outcome,
    agreement: "not_applicable",
    legacySelectedCandidateId: input.legacySelectedCandidateId,
    reason,
    promptHash: input.comparison.structuredPromptHash,
    provider: providerName,
    model,
    ablationMode,
    workspacePromptBytes,
    workspacePromptTokens,
    estimatedInputTokens: input.comparison.budget?.estimatedInputTokens,
    maxOutputTokens: input.comparison.budget?.maxOutputTokens,
    estimatedCostUsd: input.comparison.budget?.estimatedCostUsd,
    budgetStatus: input.comparison.budget?.status
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
    return {
      structuredPrompt: input.structuredPrompt,
      comparison: input.comparison,
      shadowDecision: {
        ...baseDecision("skipped", `${P8_WORKSPACE_CALL_FLAG}=off`),
        skippedReason: `${P8_WORKSPACE_CALL_FLAG}=off`
      }
    };
  }
  if (!(input.llm.isAvailable?.() ?? true)) {
    return { structuredPrompt: input.structuredPrompt, comparison: input.comparison, shadowDecision: baseDecision("unavailable", `${providerName}_unavailable`) };
  }
  const budgetStatus = input.comparison.budget?.status;
  if (budgetStatus && budgetStatus !== "within_budget" && budgetStatus !== "soft_token_limit_exceeded") {
    return {
      structuredPrompt: input.structuredPrompt,
      comparison: input.comparison,
      shadowDecision: {
        ...baseDecision("skipped", input.comparison.budget?.skippedReason ?? budgetStatus),
        skippedReason: input.comparison.budget?.skippedReason ?? budgetStatus
      }
    };
  }

  try {
    shadowCallsUsedThisProcess += 1;
    const decision = await input.llm.decide(input.structuredPrompt);
    const validation = validateLlmDecisionForCandidates(decision, input.candidates);
    const candidateId = typeof decision?.candidateId === "string" ? decision.candidateId : undefined;
    const providerAudit = isRecord(decision) && isRecord(decision.providerAudit) ? decision.providerAudit : undefined;
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
        revisionTag: P8_WORKSPACE_REVISION,
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
        promptHash: input.comparison.structuredPromptHash,
        provider: providerName,
        model,
        providerMode: typeof providerAudit?.requestMode === "string" ? providerAudit.requestMode : undefined,
        ablationMode,
        workspacePromptBytes,
        workspacePromptTokens,
        providerOutputKind: typeof providerAudit?.contentKind === "string" ? providerAudit.contentKind : undefined,
        providerOutputPreview: typeof providerAudit?.contentPreview === "string" ? providerAudit.contentPreview : undefined,
        providerOutputBytes: numberValue(providerAudit?.contentBytes),
        providerParseState: typeof providerAudit?.parseState === "string" ? providerAudit.parseState : undefined,
        retryCount: numberValue(providerAudit?.retryCount),
        emptyContentRetryCount: numberValue(providerAudit?.emptyContentRetryCount),
        emptyContentRetrySucceeded: typeof providerAudit?.emptyContentRetrySucceeded === "boolean"
          ? providerAudit.emptyContentRetrySucceeded
          : undefined,
        estimatedInputTokens: input.comparison.budget?.estimatedInputTokens,
        actualInputTokens: providerUsageNumber(decision, "promptTokens"),
        actualOutputTokens: providerUsageNumber(decision, "completionTokens"),
        actualTotalTokens: providerUsageNumber(decision, "totalTokens"),
        maxOutputTokens: input.comparison.budget?.maxOutputTokens,
        latencyMs: providerMetadataNumber(decision, "latencyMs"),
        estimatedCostUsd: estimateActualOrBudgetCost(input.comparison, decision),
        budgetStatus: input.comparison.budget?.status,
        riskTags: stringArray(isRecord(decision) ? decision.riskTags : undefined),
        missingInfo: stringArray(isRecord(decision) ? decision.missingInfo : undefined),
        scaffoldFeedback: stringArray(isRecord(decision) ? decision.scaffoldFeedback : undefined)
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
        error: message.slice(0, 240),
        budgetStatus: classifyShadowError(message) === "timeout" ? "timeout" : input.comparison.budget?.status
      }
    };
  }
}

export async function buildP8WorkspaceShadowFromPacket(input: WorkspaceComparisonInput & {
  llm: LlmDecider;
  legacySelectedCandidateId?: string;
}): Promise<P8WorkspaceShadow> {
  const options = input.options ?? workspaceOptionsFromEnv();
  const structuredPrompt = buildDeliberationWorkspacePrompt(input.deliberationPacket, input.candidates, options.ablationMode ?? "full");
  const comparison = buildWorkspaceComparison({ ...input, options });
  return buildP8WorkspaceShadow({
    comparison,
    structuredPrompt,
    candidates: input.candidates,
    llm: input.llm,
    legacySelectedCandidateId: input.legacySelectedCandidateId,
    options
  });
}

function workspaceResponseContract(): JsonRecord {
  return {
    return_json_only: true,
    no_markdown: true,
    no_code_fence: true,
    return_one_object_not_array: true,
    never_return_empty_response: true,
    selectedCandidateId_must_be_from_allowed_candidate_ids: true,
    one_line_minified_json: true,
    reasonBrief_max_words: 18,
    optional_arrays_default_empty: true,
    required_fields: ["selectedCandidateId", "reasonBrief"],
    preferred_shape: {
      selectedCandidateId: "<exact allowed candidate id>",
      confidence: 0.0,
      reasonBrief: "short strategic reason",
      riskTags: [],
      missingInfo: [],
      scaffoldFeedback: []
    }
  };
}

function shortOutputSchema(packet: DeliberationPacket): JsonRecord {
  return isRecord(packet.outputSchema)
    ? packet.outputSchema
    : {
        selectedCandidateId: "string from allowed_candidate_ids",
        confidence: "0..1 number",
        reasonBrief: "short strategic reason",
        riskTags: "short string[]",
        missingInfo: "short string[]",
        scaffoldFeedback: "short string[]"
      };
}

function compactCandidate(candidate: ScoredCandidate): JsonRecord {
  return {
    id: candidate.id,
    label: trimText(candidate.label, 160),
    kind: candidate.kind,
    score: Number(candidate.score.toFixed(3)),
    confidence: Number(candidate.confidence.toFixed(3)),
    reasons: candidate.reasons.slice(0, 3).map((reason) => trimText(reason, 120)),
    risks: candidate.risks.slice(0, 3).map((risk) => trimText(risk, 120))
  };
}

function compactRecord(value: unknown, maxKeys: number): JsonRecord | unknown[] | undefined {
  if (Array.isArray(value)) return value.slice(0, maxKeys);
  if (!isRecord(value)) return undefined;
  return Object.fromEntries(Object.entries(value).slice(0, maxKeys).map(([key, item]) => [key, compactValue(item)]));
}

function compactValue(value: unknown): unknown {
  if (typeof value === "string") return trimText(value, 180);
  if (Array.isArray(value)) return value.slice(0, 5).map(compactValue);
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).slice(0, 5).map(([key, item]) => [key, compactValue(item)]));
  return value;
}

function workspaceCandidateFooter(allowedCandidateIds: string[]): string {
  return [
    "FINAL_ALLOWED_CANDIDATE_IDS:",
    JSON.stringify(allowedCandidateIds),
    "Return JSON now."
  ].join("\n");
}

function trimText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 3))}...`;
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

function requiredLegacyPromptSections(): string[] {
  return [
    "task",
    "output_schema",
    "state",
    "screen",
    "state_facts",
    "hand_resource",
    "enemy_intent",
    "run_memory",
    "relevant_memory",
    "derived_knowledge",
    "top_candidates",
    "candidate_futures",
    "prediction_checks",
    "risks_unknowns",
    "validation_constraints"
  ];
}

function preservedLegacyPromptSections(packet: DeliberationPacket, candidates: ScoredCandidate[]): string[] {
  const sections: Array<[string, boolean]> = [
    ["task", true],
    ["output_schema", isRecord(packet.outputSchema)],
    ["state", Boolean(packet.stateSummary)],
    ["screen", Boolean(packet.screen)],
    ["state_facts", isRecord(packet.stateFacts)],
    ["hand_resource", Array.isArray(packet.handSummary) || isRecord(packet.deckSummary)],
    ["enemy_intent", Array.isArray(packet.enemyIntent)],
    ["run_memory", isRecord(packet.runMemorySummary)],
    ["relevant_memory", isRecord(packet.memoryActivation)],
    ["derived_knowledge", isRecord(packet.derivedKnowledgeSummary)],
    ["top_candidates", Array.isArray(packet.topCandidates) && packet.topCandidates.length > 0 && candidates.length > 0],
    ["candidate_futures", Array.isArray(packet.candidateFutures) && packet.candidateFutures.length > 0],
    [
      "prediction_checks",
      packet.candidateFutures.some((future) => Array.isArray(future.predictionChecks) && future.predictionChecks.length > 0)
    ],
    [
      "risks_unknowns",
      (Array.isArray(packet.uncertainty) && packet.uncertainty.length > 0) ||
        packet.candidateFutures.some((future) => (future.risk?.length ?? 0) > 0 || (future.uncertainty?.length ?? 0) > 0)
    ],
    ["validation_constraints", Array.isArray(packet.validationConstraints) && packet.validationConstraints.length > 0]
  ];
  return sections.filter(([, present]) => present).map(([section]) => section);
}

function structuredSectionTokenEstimate(packet: DeliberationPacket): Record<string, number> {
  return {
    state: estimateTokens(JSON.stringify({ stateSummary: packet.stateSummary, screen: packet.screen, stateFacts: packet.stateFacts })),
    handResource: estimateTokens(JSON.stringify({ handSummary: packet.handSummary, deckSummary: packet.deckSummary })),
    enemyIntent: estimateTokens(JSON.stringify(packet.enemyIntent ?? [])),
    strategicImpression: estimateTokens(JSON.stringify(packet.strategicImpression ?? {})),
    salienceSignals: estimateTokens(JSON.stringify(packet.salienceSignals ?? [])),
    memoryActivation: estimateTokens(JSON.stringify(packet.memoryActivation ?? {})),
    derivedKnowledge: estimateTokens(JSON.stringify(packet.derivedKnowledgeSummary ?? {})),
    candidateFutures: estimateTokens(JSON.stringify(packet.candidateFutures ?? [])),
    validation: estimateTokens(JSON.stringify({ validationConstraints: packet.validationConstraints, outputSchema: packet.outputSchema }))
  };
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

function buildWorkspaceBudget(
  options: WorkspaceShadowOptions,
  estimatedInputTokens: number,
  maxOutputTokens: number
): NonNullable<DeliberationWorkspaceComparison["budget"]> {
  const maxShadowCalls = positiveNumber(options.maxShadowCalls, 1);
  const softInputTokenLimit = positiveNumber(options.softInputTokenLimit, 8000);
  const hardInputTokenLimit = positiveNumber(options.hardInputTokenLimit, 12000);
  const timeoutMs = positiveNumber(options.timeoutMs, 25000);
  const retryLimit = Math.max(0, Math.floor(positiveNumber(options.retryLimit, 0)));
  const maxEstimatedCostUsd = positiveNumber(options.maxEstimatedCostUsd, 0.05);
  const estimatedInputUsdPerMillionTokens = positiveNumber(options.estimatedInputUsdPerMillionTokens, 0.3);
  const estimatedOutputUsdPerMillionTokens = positiveNumber(options.estimatedOutputUsdPerMillionTokens, 0.6);
  const estimatedCostUsd = Number((
    (estimatedInputTokens / 1_000_000) * estimatedInputUsdPerMillionTokens +
    (maxOutputTokens / 1_000_000) * estimatedOutputUsdPerMillionTokens
  ).toFixed(6));
  let status: NonNullable<DeliberationWorkspaceComparison["budget"]>["status"] = "within_budget";
  let skippedReason: string | undefined;
  if (shadowCallsUsedThisProcess >= maxShadowCalls) {
    status = "call_budget_exceeded";
    skippedReason = "call_budget_exceeded";
  } else if (estimatedInputTokens > hardInputTokenLimit) {
    status = "token_budget_exceeded";
    skippedReason = "token_budget_exceeded";
  } else if (estimatedCostUsd > maxEstimatedCostUsd) {
    status = "cost_budget_exceeded";
    skippedReason = "cost_budget_exceeded";
  } else if (estimatedInputTokens > softInputTokenLimit) {
    status = "soft_token_limit_exceeded";
  }
  return {
    maxShadowCalls,
    shadowCallsUsed: shadowCallsUsedThisProcess,
    estimatedInputTokens,
    softInputTokenLimit,
    hardInputTokenLimit,
    maxOutputTokens,
    timeoutMs,
    retryLimit,
    estimatedCostUsd,
    maxEstimatedCostUsd,
    status,
    skippedReason
  };
}

function estimateActualOrBudgetCost(
  comparison: DeliberationWorkspaceComparison,
  decision: unknown
): number | undefined {
  const inputTokens = providerUsageNumber(decision, "promptTokens");
  const outputTokens = providerUsageNumber(decision, "completionTokens");
  if (inputTokens === undefined && outputTokens === undefined) return comparison.budget?.estimatedCostUsd;
  const inputRate = numberFromEnv("STS2_DEEPSEEK_EST_INPUT_USD_PER_MTOK", 0.3);
  const outputRate = numberFromEnv("STS2_DEEPSEEK_EST_OUTPUT_USD_PER_MTOK", 0.6);
  return Number((
    ((inputTokens ?? comparison.budget?.estimatedInputTokens ?? 0) / 1_000_000) * inputRate +
    ((outputTokens ?? comparison.budget?.maxOutputTokens ?? 0) / 1_000_000) * outputRate
  ).toFixed(6));
}

function providerUsageNumber(decision: unknown, key: string): number | undefined {
  if (!isRecord(decision) || !isRecord(decision.providerMetadata) || !isRecord(decision.providerMetadata.usage)) return undefined;
  return numberValue(decision.providerMetadata.usage[key]);
}

function providerMetadataNumber(decision: unknown, key: string): number | undefined {
  if (!isRecord(decision) || !isRecord(decision.providerMetadata)) return undefined;
  return numberValue(decision.providerMetadata[key]);
}

function classifyShadowError(message: string): string {
  return /timed out|timeout|abort/i.test(message) ? "timeout" : "error";
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function numberFromEnvAliases(names: string[], fallback: number): number {
  for (const name of names) {
    const value = Number(process.env[name]);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return fallback;
}

function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(String).map((item) => item.trim()).filter(Boolean);
}

function isEnabled(value: string | undefined): boolean {
  return /^(1|true|yes|on)$/i.test(String(value ?? "").trim());
}

function parseList(value: string | undefined): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
