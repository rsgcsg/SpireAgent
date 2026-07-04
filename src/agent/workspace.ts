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
import { serializeWorkspaceCandidateFutures } from "./candidateFutureCompressor.js";
import { analyzeReasonCueAttribution, analyzeSerializedCandidateFutures } from "./candidateFutureReviewSignals.js";
import { assessReasonQuality, classifyProviderFailure, summarizeProviderAttempts, summarizeReasonQualityNotes } from "./providerFailureClassifier.js";
import {
  budgetGovernanceProfileFromEnv,
  buildBudgetGovernancePolicy,
  type BudgetGovernanceProfileName
} from "./budgetGovernance.js";
import { summarizeProviderRecoveryPolicy } from "./providerRecoveryPolicy.js";
import type { ScoredCandidate } from "./types.js";
import { isRecord } from "./utils.js";
import {
  P8_DEEPSEEK_API_KEY_FLAG,
  P8_DEEPSEEK_MODEL_FLAG,
  P8_LIVE_ADDITIVE_FLAG,
  P8_LIVE_DECISION_CLASSES_FLAG,
  P8_WORKSPACE_ABLATION_MODE_FLAG,
  P8_WORKSPACE_CALL_FLAG,
  P8_WORKSPACE_REVISION,
  P8_WORKSPACE_SHADOW_FLAG,
  WORKSPACE_REASON_BRIEF_MAX_WORDS,
  type WorkspaceAblationMode,
  normalizeWorkspaceAblationMode,
  workspaceAblationModeFromEnv
} from "./workspaceExperimentConfig.js";

export { normalizeWorkspaceAblationMode, workspaceAblationModeFromEnv } from "./workspaceExperimentConfig.js";

interface WorkspaceSerializationTelemetry {
  compressionMode: string;
  futuresTruncated: number;
  futuresOmitted: number;
  truncatedFields: Record<string, number>;
  candidateFuturesBytesBefore: number;
  candidateFuturesBytesAfter: number;
  candidateFuturesTokensBefore: number;
  candidateFuturesTokensAfter: number;
  workspaceBytesBefore: number;
  workspaceBytesAfter: number;
  workspaceTokensBefore: number;
  workspaceTokensAfter: number;
  informationPreservationEstimate: number;
  largestFieldSources: Record<string, number>;
  repeatedTextBytes: number;
  repeatedTextCount: number;
}

interface WorkspacePromptBuildArtifact {
  prompt: string;
  payload: JsonRecord;
  telemetry: WorkspaceSerializationTelemetry;
}

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
  budgetGovernanceProfile?: BudgetGovernanceProfileName;
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
    budgetGovernanceProfile: budgetGovernanceProfileFromEnv(),
    ablationMode: workspaceAblationModeFromEnv(),
    liveAdditiveEnabled: isEnabled(process.env[P8_LIVE_ADDITIVE_FLAG]),
    liveDecisionClassWhitelist: parseList(process.env[P8_LIVE_DECISION_CLASSES_FLAG])
  };
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
  mode: WorkspaceAblationMode = "full",
  decisionClass?: string
): string {
  return buildWorkspacePromptArtifact(packet, candidates, mode, decisionClass).prompt;
}

function buildWorkspacePromptArtifact(
  packet: DeliberationPacket,
  candidates: ScoredCandidate[] = [],
  mode: WorkspaceAblationMode = "full",
  decisionClass?: string
): WorkspacePromptBuildArtifact {
  const allowedCandidateIds = candidates.map((candidate) => candidate.id);
  const payload = mode === "ultra_compact"
    ? buildUltraCompactWorkspacePayload(packet, candidates, allowedCandidateIds, decisionClass)
    : mode === "compact"
      ? buildCompactWorkspacePayload(packet, candidates, allowedCandidateIds, decisionClass)
      : buildFullWorkspacePayload(packet, candidates, allowedCandidateIds, mode, decisionClass);
  const prompt = `${JSON.stringify(payload)}\n${workspaceCandidateFooter(allowedCandidateIds)}`;
  const telemetry = workspaceSerializationTelemetry(packet, payload, prompt, candidates, mode);
  return { prompt, payload, telemetry };
}

function buildFullWorkspacePayload(
  packet: DeliberationPacket,
  candidates: ScoredCandidate[],
  allowedCandidateIds: string[],
  mode: WorkspaceAblationMode,
  decisionClass?: string
): JsonRecord {
  const candidateFutureResult = serializeWorkspaceCandidateFutures(packet, candidates, mode);
  const reasonBriefStyle = reasonBriefStyleForDecisionClass(decisionClass);
  const reasonBriefRule = reasonBriefRuleForDecisionClass(decisionClass);
  return {
    ablation_mode: mode,
    decision_class: decisionClass,
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
      one_line_minified_json: true,
      reasonBrief_max_words: WORKSPACE_REASON_BRIEF_MAX_WORDS,
      reasonBrief_style: reasonBriefStyle,
      reasonBrief_rule: reasonBriefRule,
      optional_arrays_default_empty: true,
      optional_arrays_max_items: 1,
      optional_fields_may_be_omitted: ["confidence", "riskTags", "missingInfo", "scaffoldFeedback"],
      required_fields: ["selectedCandidateId", "reasonBrief"],
      preferred_shape: {
        selectedCandidateId: "<exact allowed candidate id>",
        reasonBrief: "short tactical sentence",
        confidence: 0.0,
        riskTags: [],
        missingInfo: [],
        scaffoldFeedback: []
      }
    },
    allowed_candidate_ids: allowedCandidateIds,
    output_schema: packet.outputSchema ?? {
      selectedCandidateId: "string",
      confidence: "0..1 number",
      reasonBrief: "short tactical or strategic sentence",
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
    candidate_futures: candidateFutureResult.serialized,
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
  allowedCandidateIds: string[],
  decisionClass?: string
): JsonRecord {
  return {
    ablation_mode: "compact",
    decision_class: decisionClass,
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
  allowedCandidateIds: string[],
  decisionClass?: string
): JsonRecord {
  return {
    ablation_mode: "ultra_compact",
    decision_class: decisionClass,
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
  const structuredArtifact = buildWorkspacePromptArtifact(
    input.deliberationPacket,
    input.candidates,
    ablationMode,
    input.decisionClass
  );
  const structuredPrompt = structuredArtifact.prompt;
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
  const budget = buildWorkspaceBudget(options, structuredTokenEstimate, maxOutputTokens, input.decisionClass);
  const providerAvailable = Boolean(options.providerAvailable);
  const providerReadinessReasons: string[] = [];
  if (!providerAvailable) providerReadinessReasons.push(`${P8_DEEPSEEK_API_KEY_FLAG}=missing`);
  if (!shadowEnabled) providerReadinessReasons.push(`${P8_WORKSPACE_SHADOW_FLAG}=off`);
  if (gatedReadiness !== "ready") providerReadinessReasons.push("workspace_not_ready");
  const providerReadiness = providerReadinessReasons.length === 0 ? "ready_for_shadow_call" : providerAvailable ? "not_ready" : "needs_api_key";
  const liveAdditiveEnabled = Boolean(options.liveAdditiveEnabled);
  const decisionClassWhitelist = options.liveDecisionClassWhitelist ?? [];
  const decisionClassWhitelisted = decisionClassWhitelist.includes(input.decisionClass);
  const serializedCandidateFutures = Array.isArray(structuredArtifact.payload.candidate_futures)
    ? structuredArtifact.payload.candidate_futures
    : [];
  const candidateFutureReview = analyzeSerializedCandidateFutures(
    input.deliberationPacket,
    serializedCandidateFutures,
    input.decisionClass
  );
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
      sectionTokenEstimate,
      compressionMode: structuredArtifact.telemetry.compressionMode,
      futuresTruncated: structuredArtifact.telemetry.futuresTruncated,
      futuresOmitted: structuredArtifact.telemetry.futuresOmitted,
      truncatedFields: structuredArtifact.telemetry.truncatedFields,
      candidateFuturesBytesBefore: structuredArtifact.telemetry.candidateFuturesBytesBefore,
      candidateFuturesBytesAfter: structuredArtifact.telemetry.candidateFuturesBytesAfter,
      candidateFuturesTokensBefore: structuredArtifact.telemetry.candidateFuturesTokensBefore,
      candidateFuturesTokensAfter: structuredArtifact.telemetry.candidateFuturesTokensAfter,
      workspaceBytesBefore: structuredArtifact.telemetry.workspaceBytesBefore,
      workspaceBytesAfter: structuredArtifact.telemetry.workspaceBytesAfter,
      workspaceTokensBefore: structuredArtifact.telemetry.workspaceTokensBefore,
      workspaceTokensAfter: structuredArtifact.telemetry.workspaceTokensAfter,
      informationPreservationEstimate: structuredArtifact.telemetry.informationPreservationEstimate,
      largestFieldSources: structuredArtifact.telemetry.largestFieldSources,
      repeatedTextBytes: structuredArtifact.telemetry.repeatedTextBytes,
      repeatedTextCount: structuredArtifact.telemetry.repeatedTextCount,
      candidateFutureCompleteness: candidateFutureReview.completeness,
      candidateFutureReviewSignals: candidateFutureReview.reviewSignals,
      candidateFutureProposalSignals: candidateFutureReview.proposalSignals,
      candidateFutureCueAttribution: candidateFutureReview.cueAttribution as unknown as JsonRecord
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
    summary: `P8 structured workspace ${gatedReadiness}; ablation=${ablationMode}; compression=${structuredArtifact.telemetry.compressionMode}; preservation=${informationPreservationScore}/${structuredArtifact.telemetry.informationPreservationEstimate}; legacy=${legacyPromptBytes ?? 0}B structured=${structuredPromptBytes}B candidates=${input.candidates.length}; provider=${providerReadiness}`
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
    const reasonAssessment = assessReasonQuality(decision?.reason);
    const agreement = candidateId === undefined
      ? "not_applicable"
      : input.candidates.some((candidate) => candidate.id === candidateId)
        ? candidateId === input.legacySelectedCandidateId ? "agree" : "disagree"
        : "missing_candidate";
    const failure = classifyProviderFailure({
      outcome: validation.valid ? "valid" : validation.outcome ?? "invalid_output",
      agreement: validation.valid ? agreement : candidateId ? "missing_candidate" : "not_applicable",
      providerFinishReason: providerMetadataString(decision, "finishReason"),
      providerParseState: typeof providerAudit?.parseState === "string" ? providerAudit.parseState : undefined,
      providerCleanupReason: typeof providerAudit?.cleanupReason === "string" ? providerAudit.cleanupReason : undefined,
      providerOutputKind: typeof providerAudit?.contentKind === "string" ? providerAudit.contentKind : undefined,
      validationError: validation.error
    });
    const providerRecoveryPolicy = summarizeProviderRecoveryPolicy({
      attempts: providerAudit?.attempts,
      outcome: validation.valid ? "valid" : validation.outcome ?? "invalid_output",
      failureBucket: failure.bucket,
      parseState: typeof providerAudit?.parseState === "string" ? providerAudit.parseState : undefined,
      finishReason: providerMetadataString(decision, "finishReason")
    });
    const reasonCueAttribution = analyzeReasonCueAttribution(
      decision?.reason,
      isRecord(input.comparison.coverage) ? input.comparison.coverage.candidateFutureCueAttribution : undefined
    );
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
        decisionClass: input.comparison.decisionClass,
        liveEligibleClass: isLiveEligibleDecisionClass(input.comparison.decisionClass),
        legacySelectedCandidateId: input.legacySelectedCandidateId,
        structuredSelectedCandidateId: candidateId,
        confidence: typeof decision?.confidence === "number" ? decision.confidence : undefined,
        reason: typeof decision?.reason === "string" ? decision.reason : undefined,
        reasonQuality: reasonAssessment.quality,
        reasonQualityNotes: summarizeReasonQualityNotes(reasonAssessment.notes),
        reasonCueAttribution: reasonCueAttribution as JsonRecord | undefined,
        validationError: validation.error,
        promptHash: input.comparison.structuredPromptHash,
        provider: providerName,
        model,
        providerMode: typeof providerAudit?.requestMode === "string" ? providerAudit.requestMode : undefined,
        ablationMode,
        workspacePromptBytes,
        workspacePromptTokens,
        providerOutputKind: typeof providerAudit?.contentKind === "string" ? providerAudit.contentKind : undefined,
        providerContentSource: typeof providerAudit?.contentSource === "string" ? providerAudit.contentSource : undefined,
        providerOutputPreview: typeof providerAudit?.contentPreview === "string" ? providerAudit.contentPreview : undefined,
        providerOutputBytes: numberValue(providerAudit?.contentBytes),
        providerReasoningContentBytes: numberValue(providerAudit?.reasoningContentBytes),
        providerReasoningContentReturned: typeof providerAudit?.reasoningContentReturned === "boolean"
          ? providerAudit.reasoningContentReturned
          : undefined,
        providerThinkingMode: typeof providerAudit?.requestedThinkingMode === "string" ? providerAudit.requestedThinkingMode : undefined,
        providerParseState: typeof providerAudit?.parseState === "string" ? providerAudit.parseState : undefined,
        providerCleanupReason: typeof providerAudit?.cleanupReason === "string" ? providerAudit.cleanupReason : undefined,
        providerAttempts: summarizeProviderAttempts(providerAudit?.attempts),
        providerRecoveryPolicy,
        providerRecoveryPolicyName: typeof providerRecoveryPolicy?.policyName === "string" ? providerRecoveryPolicy.policyName : undefined,
        failureCategory: failure.category,
        failureBucket: failure.bucket,
        outputCapHit: isOutputCapHit(decision, input.comparison),
        retryCount: numberValue(providerAudit?.retryCount),
        emptyContentRetryCount: numberValue(providerAudit?.emptyContentRetryCount),
        emptyContentRetrySucceeded: typeof providerAudit?.emptyContentRetrySucceeded === "boolean"
          ? providerAudit.emptyContentRetrySucceeded
          : undefined,
        truncationRetryCount: numberValue(providerAudit?.truncationRetryCount),
        truncationRetrySucceeded: typeof providerAudit?.truncationRetrySucceeded === "boolean"
          ? providerAudit.truncationRetrySucceeded
          : undefined,
        estimatedInputTokens: input.comparison.budget?.estimatedInputTokens,
        actualInputTokens: providerUsageNumber(decision, "promptTokens"),
        actualOutputTokens: providerUsageNumber(decision, "completionTokens"),
        actualTotalTokens: providerUsageNumber(decision, "totalTokens"),
        maxOutputTokens: input.comparison.budget?.maxOutputTokens,
        providerFinishReason: providerMetadataString(decision, "finishReason"),
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
  const structuredPrompt = buildWorkspacePromptArtifact(
    input.deliberationPacket,
    input.candidates,
    options.ablationMode ?? "full"
  ).prompt;
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
    reasonBrief_max_words: WORKSPACE_REASON_BRIEF_MAX_WORDS,
    reasonBrief_style: "one short tactical or strategic sentence naming the main tradeoff",
    optional_arrays_default_empty: true,
    optional_arrays_max_items: 1,
    optional_fields_may_be_omitted: ["confidence", "riskTags", "missingInfo", "scaffoldFeedback"],
    required_fields: ["selectedCandidateId", "reasonBrief"],
    preferred_shape: {
      selectedCandidateId: "<exact allowed candidate id>",
      reasonBrief: "short tactical or strategic sentence",
      confidence: 0.0,
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
        reasonBrief: "short tactical or strategic sentence",
        riskTags: "short string[] <=1",
        missingInfo: "short string[] <=1",
        scaffoldFeedback: "short string[] <=1"
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

function buildWorkspaceCandidateFutures(
  packet: DeliberationPacket,
  candidates: ScoredCandidate[],
  mode: WorkspaceAblationMode
): { serialized: JsonRecord[] } {
  const fullSerialized = packet.candidateFutures.slice(0, 8).map(serializeFullCandidateFuture);
  if (mode !== "full_bounded_candidate_futures" || packet.screen !== "combat") {
    return { serialized: fullSerialized };
  }
  const rankedCandidates = new Map(candidates.map((candidate, index) => [candidate.id, index]));
  const pressureProfile = buildCombatCompressionProfile(packet);
  return {
    serialized: packet.candidateFutures
      .map((future, index) => ({ future, index }))
      .sort((left, right) =>
        candidateFuturePriority(right.future, right.index, rankedCandidates) - candidateFuturePriority(left.future, left.index, rankedCandidates)
      )
      .slice(0, pressureProfile.maxFutures)
      .map(({ future, index }) => serializeBoundedCandidateFuture(
        future,
        index,
        candidateFuturePriority(future, index, rankedCandidates),
        pressureProfile
      ))
  };
}

function serializeFullCandidateFuture(future: DeliberationPacket["candidateFutures"][number]): JsonRecord {
  return {
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
  };
}

function serializeBoundedCandidateFuture(
  future: DeliberationPacket["candidateFutures"][number],
  index: number,
  priority: number,
  pressureProfile: CombatCompressionProfile
): JsonRecord {
  const highPriority = priority >= 8;
  const caps = fieldCapsForFuture(pressureProfile, highPriority);
  return compactObject({
    id: future.sourceCandidateId ?? future.id,
    label: trimText(future.label, caps.label),
    plan: pressureProfile.criticalPressure && !highPriority ? undefined : trimText(future.plan, caps.plan),
    deterministicCalculations: compactStructuredValue(future.deterministicCalculations, caps.mechanicsKeys, 1, caps.text),
    tacticalFacts: summarizeFutureTacticalFacts(future, caps.factItems, caps.text),
    tradeoff: summarizeFutureTradeoff(future, caps.text),
    predictedOutcome: pressureProfile.criticalPressure ? undefined : limitStringList(future.predictedOutcome, caps.outcomeItems, caps.outcomeText),
    predictionChecks: limitPredictionChecks(future.predictionChecks, caps.predictionCheckItems, caps),
    cost: limitStringList(future.cost, 1, caps.shortText),
    risk: limitStringList(future.risk, caps.riskItems, caps.text),
    uncertainty: limitStringList(future.uncertainty, 1, caps.shortText),
    assumptions: limitStringList(future.assumptions, 1, caps.shortText),
    invalidationTriggers: limitStringList(future.invalidationTriggers, 1, caps.shortText),
    confidence: future.confidence
  });
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

function workspaceSerializationTelemetry(
  packet: DeliberationPacket,
  payload: JsonRecord,
  prompt: string,
  candidates: ScoredCandidate[],
  mode: WorkspaceAblationMode
): WorkspaceSerializationTelemetry {
  const fullPayload = buildFullWorkspacePayload(packet, candidates, candidates.map((candidate) => candidate.id), "full");
  const fullCandidateFutures = Array.isArray(fullPayload.candidate_futures) ? fullPayload.candidate_futures : [];
  const promptFooter = workspaceCandidateFooter(candidates.map((candidate) => candidate.id));
  const candidateFuturesBeforeBytes = Buffer.byteLength(JSON.stringify(fullCandidateFutures), "utf8");
  const candidateFuturesBeforeTokens = estimateTokens(JSON.stringify(fullCandidateFutures));
  const candidateFuturesAfter = Array.isArray(payload.candidate_futures) ? payload.candidate_futures : [];
  const candidateFuturesAfterBytes = Buffer.byteLength(JSON.stringify(candidateFuturesAfter), "utf8");
  const candidateFuturesAfterTokens = estimateTokens(JSON.stringify(candidateFuturesAfter));
  const fullPrompt = `${JSON.stringify(fullPayload)}\n${promptFooter}`;
  const fullPromptBytes = Buffer.byteLength(fullPrompt, "utf8");
  const fullPromptTokens = estimateTokens(fullPrompt);
  const fieldSizes = candidateFutureFieldSizes(fullCandidateFutures);
  const afterIds = new Set(candidateFuturesAfter.map((future) => futureId(future)).filter(Boolean));
  const beforeIds = fullCandidateFutures.map((future) => futureId(future)).filter(Boolean);
  const futuresOmitted = beforeIds.filter((id) => !afterIds.has(id)).length;
  return {
    compressionMode:
      mode === "full_bounded_candidate_futures"
        ? packet.screen === "combat"
          ? "bounded_candidate_futures"
          : "bounded_candidate_futures_non_combat"
        : "none",
    futuresTruncated: countTruncatedStrings(candidateFuturesAfter),
    futuresOmitted,
    truncatedFields: truncatedFieldCounts(candidateFuturesAfter),
    candidateFuturesBytesBefore: candidateFuturesBeforeBytes,
    candidateFuturesBytesAfter: candidateFuturesAfterBytes,
    candidateFuturesTokensBefore: candidateFuturesBeforeTokens,
    candidateFuturesTokensAfter: candidateFuturesAfterTokens,
    workspaceBytesBefore: fullPromptBytes,
    workspaceBytesAfter: Buffer.byteLength(prompt, "utf8"),
    workspaceTokensBefore: fullPromptTokens,
    workspaceTokensAfter: estimateTokens(prompt),
    informationPreservationEstimate: informationPreservationEstimate(fullCandidateFutures, candidateFuturesAfter),
    largestFieldSources: topFieldSources(fieldSizes, 6),
    repeatedTextBytes: repeatedTextSummary(fullCandidateFutures).bytes,
    repeatedTextCount: repeatedTextSummary(fullCandidateFutures).count
  };
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

function limitStringList(value: unknown, maxItems: number, maxLength: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => trimText(item, maxLength))
    .filter((item): item is string => typeof item === "string" && item.length > 0);
  return items.length > 0 ? items.slice(0, maxItems) : undefined;
}

function limitPredictionChecks(value: unknown, maxItems: number, caps: FutureFieldCaps): JsonRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter(isRecord)
    .slice(0, maxItems)
    .map((check) => {
      const type = typeof check.type === "string" ? check.type : undefined;
      return compactObject({
        type,
        severity: typeof check.severity === "string" ? check.severity : undefined,
        prediction: trimText(check.prediction, caps.predictionText),
        expected: summarizePredictionCheckExpected(type, check.expected, caps.expectedFacts, caps.expectedText)
      });
    });
  return items.length > 0 ? items : undefined;
}

function compactStructuredValue(value: unknown, maxKeys: number, maxDepth: number, maxStringLength: number): unknown {
  if (typeof value === "string") return trimText(value, maxStringLength);
  if (Array.isArray(value)) return value.slice(0, maxKeys).map((item) => compactStructuredValue(item, maxKeys, maxDepth - 1, maxStringLength));
  if (!isRecord(value) || maxDepth <= 0) return value;
  return compactObject(
    Object.fromEntries(
      Object.entries(value)
        .slice(0, maxKeys)
        .map(([key, item]) => [key, compactStructuredValue(item, Math.max(2, maxKeys - 1), maxDepth - 1, maxStringLength)])
    )
  );
}

function compactObject<T extends JsonRecord>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

interface CombatCompressionProfile {
  boss: boolean;
  highPressure: boolean;
  criticalPressure: boolean;
  multipleEnemies: boolean;
  incomingDamage: number;
  hpRatio: number | undefined;
  maxFutures: number;
}

interface FutureFieldCaps {
  label: number;
  plan: number;
  text: number;
  shortText: number;
  outcomeText: number;
  outcomeItems: number;
  riskItems: number;
  predictionCheckItems: number;
  predictionText: number;
  expectedText: number;
  expectedFacts: number;
  mechanicsKeys: number;
  factItems: number;
}

function buildCombatCompressionProfile(packet: DeliberationPacket): CombatCompressionProfile {
  const stateFacts = isRecord(packet.stateFacts) ? packet.stateFacts : undefined;
  const deterministic = isRecord(packet.deterministicCalculations) ? packet.deterministicCalculations : undefined;
  const hp = firstNumber(stateFacts?.playerHp, stateFacts?.hp, deterministic?.playerHp, deterministic?.hp);
  const maxHp = firstNumber(stateFacts?.playerMaxHp, stateFacts?.maxHp, deterministic?.playerMaxHp, deterministic?.maxHp);
  const incomingDamage = firstNumber(
    stateFacts?.incomingDamage,
    deterministic?.incomingDamage,
    stateFacts?.incomingIntentDamage
  ) ?? 0;
  const enemyCount = firstNumber(stateFacts?.enemyCount, deterministic?.enemyCount) ?? (Array.isArray(packet.enemyIntent) ? packet.enemyIntent.length : 0);
  const stateType = firstNonEmptyString(
    stateFacts?.combatType,
    stateFacts?.encounterType,
    stateFacts?.roomType,
    deterministic?.combatType,
    packet.stateSummary
  );
  const hpRatio = typeof hp === "number" && typeof maxHp === "number" && maxHp > 0 ? hp / maxHp : undefined;
  const boss = /boss/i.test(stateType ?? "");
  const multipleEnemies = enemyCount >= 2;
  const highPressure = boss || multipleEnemies || incomingDamage >= 10 || (typeof hpRatio === "number" && hpRatio <= 0.6);
  const criticalPressure = boss || incomingDamage >= 14 || (typeof hpRatio === "number" && hpRatio <= 0.45);
  return {
    boss,
    highPressure,
    criticalPressure,
    multipleEnemies,
    incomingDamage,
    hpRatio,
    maxFutures: criticalPressure ? 3 : highPressure ? (multipleEnemies ? 4 : 5) : 6
  };
}

function fieldCapsForFuture(profile: CombatCompressionProfile, highPriority: boolean): FutureFieldCaps {
  if (profile.criticalPressure) {
    return {
      label: highPriority ? 96 : 88,
      plan: highPriority ? 96 : 80,
      text: highPriority ? 64 : 56,
      shortText: highPriority ? 56 : 48,
      outcomeText: highPriority ? 60 : 52,
      outcomeItems: 1,
      riskItems: 1,
      predictionCheckItems: 1,
      predictionText: highPriority ? 56 : 44,
      expectedText: highPriority ? 40 : 32,
      expectedFacts: 1,
      mechanicsKeys: 2,
      factItems: highPriority ? 2 : 1
    };
  }
  if (profile.highPressure) {
    return {
      label: highPriority ? 110 : 96,
      plan: highPriority ? 112 : 96,
      text: highPriority ? 84 : 72,
      shortText: highPriority ? 72 : 60,
      outcomeText: highPriority ? 76 : 64,
      outcomeItems: 1,
      riskItems: highPriority ? 2 : 1,
      predictionCheckItems: 1,
      predictionText: highPriority ? 72 : 56,
      expectedText: highPriority ? 56 : 44,
      expectedFacts: 1,
      mechanicsKeys: 3,
      factItems: highPriority ? 4 : 3
    };
  }
  return {
    label: highPriority ? 120 : 104,
    plan: highPriority ? 120 : 104,
    text: highPriority ? 92 : 80,
    shortText: highPriority ? 76 : 64,
    outcomeText: highPriority ? 84 : 72,
    outcomeItems: highPriority ? 2 : 1,
    riskItems: highPriority ? 2 : 1,
    predictionCheckItems: highPriority ? 2 : 1,
    predictionText: highPriority ? 76 : 60,
    expectedText: highPriority ? 68 : 52,
    expectedFacts: highPriority ? 2 : 1,
    mechanicsKeys: 3,
    factItems: highPriority ? 4 : 3
  };
}

function summarizeFutureTacticalFacts(
  future: DeliberationPacket["candidateFutures"][number],
  maxItems: number,
  maxLength: number
): string[] | undefined {
  const facts = new Set<string>();
  const calculations = isRecord(future.deterministicCalculations) ? future.deterministicCalculations : undefined;
  const cardName = firstNonEmptyString(calculations?.cardName, calculations?.primaryCard, calculations?.card);
  const energyCost = firstNumber(calculations?.energyCost, calculations?.cost, calculations?.energySpend);
  const score = firstNumber(calculations?.score, calculations?.candidateScore);
  const rank = firstNumber(calculations?.rank, calculations?.candidateRank);
  if (cardName) facts.add(trimText(cardName, maxLength) ?? cardName);
  if (typeof energyCost === "number") facts.add(`cost ${energyCost}`);
  if (typeof score === "number") facts.add(`score ${score.toFixed(1)}`);
  if (typeof rank === "number") facts.add(`rank ${rank}`);
  const normalized = [...facts]
    .map((item) => trimText(item, maxLength))
    .filter((item): item is string => typeof item === "string" && item.length > 0);
  return normalized.length > 0 ? normalized.slice(0, maxItems) : undefined;
}

function summarizeFutureTradeoff(
  future: DeliberationPacket["candidateFutures"][number],
  maxLength: number
): string | undefined {
  const upside = firstNonEmptyString(...(future.predictedOutcome ?? []), ...(future.cost ?? []));
  const downside = firstNonEmptyString(
    ...(future.risk ?? []),
    ...(future.uncertainty ?? []),
    ...(future.assumptions ?? []),
    ...(future.invalidationTriggers ?? [])
  );
  if (!upside && !downside) return undefined;
  if (!upside) return trimText(`Watch ${downside}.`, maxLength);
  if (!downside) return trimText(upside, maxLength);
  return trimText(`${upside}; watch ${downside}.`, maxLength);
}

function summarizePredictionCheckExpected(
  type: string | undefined,
  expected: unknown,
  maxFacts: number,
  maxLength: number
): string[] | string | undefined {
  const facts = predictionCheckExpectedFacts(type, expected, maxFacts)
    .map((fact) => trimText(fact, maxLength))
    .filter((fact): fact is string => typeof fact === "string" && fact.length > 0);
  if (facts.length > 0) return facts;
  if (typeof expected === "string") return trimText(expected, maxLength);
  return trimText(JSON.stringify(compactStructuredValue(expected, 2, 1, maxLength)), maxLength);
}

function predictionCheckExpectedFacts(type: string | undefined, expected: unknown, maxFacts: number): string[] {
  const facts: string[] = [];
  if (!isRecord(expected)) return facts;
  switch (type) {
    case "card_removed_from_hand":
      buildCardExpectedFact(expected, facts);
      buildHandCountFact(expected, facts);
      break;
    case "resource_delta":
      buildEnergyExpectedFact(expected, facts);
      break;
    case "enemy_hp_or_block_delta":
      buildHpExpectedFact(expected, facts, "enemy hp");
      buildBlockExpectedFact(expected, facts, "enemy block");
      break;
    case "block_delta":
      buildBlockExpectedFact(expected, facts, "block");
      break;
    case "player_hp_delta":
      buildHpExpectedFact(expected, facts, "hp");
      break;
    case "phase_or_visible_progress":
    case "phase_or_turn_change":
    case "route_progress":
      actionFact(expected, facts);
      break;
    default:
      break;
  }
  booleanFact(expected, facts, "lethal");
  booleanFact(expected, facts, "survive");
  if (facts.length > 0) return facts.slice(0, maxFacts);
  for (const [key, value] of Object.entries(expected)) {
    if (facts.length >= maxFacts) break;
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      facts.push(`${key}:${String(value)}`);
    }
  }
  return facts.slice(0, maxFacts);
}

function buildCardExpectedFact(expected: JsonRecord, facts: string[]): void {
  const name = firstNonEmptyString(expected.cardName, expected.card, expected.removedCardName);
  const index = firstNumber(expected.handIndex, expected.cardIndex, expected.removedHandIndex);
  if (name && typeof index === "number") {
    facts.push(`remove ${name}@${index}`);
    return;
  }
  if (name) facts.push(`remove ${name}`);
}

function buildHandCountFact(expected: JsonRecord, facts: string[]): void {
  const before = firstNumber(expected.handCountBefore, expected.handBefore);
  const after = firstNumber(expected.handCountAfter, expected.handAfter);
  if (typeof before === "number" && typeof after === "number") facts.push(`hand ${before}->${after}`);
}

function buildEnergyExpectedFact(expected: JsonRecord, facts: string[]): void {
  const before = firstNumber(expected.energyBefore, expected.before, expected.playerEnergyBefore);
  const after = firstNumber(expected.energyAfter, expected.after, expected.playerEnergyAfter);
  const cost = firstNumber(expected.energyCost, expected.cost, expected.delta);
  if (expected.energyChanged === true) {
    facts.push("energy changes");
    return;
  }
  if (typeof before === "number" && typeof after === "number") {
    facts.push(`energy ${before}->${after}`);
    return;
  }
  if (typeof cost === "number") facts.push(`energy cost ${Math.abs(cost)}`);
}

function buildBlockExpectedFact(expected: JsonRecord, facts: string[], prefix: string): void {
  const before = firstNumber(expected.blockBefore, expected.beforeBlock, expected.playerBlockBefore, expected.enemyBlockBefore);
  const after = firstNumber(expected.blockAfter, expected.afterBlock, expected.playerBlockAfter, expected.enemyBlockAfter);
  if (typeof before === "number" && typeof after === "number") facts.push(`${prefix} ${before}->${after}`);
}

function buildHpExpectedFact(expected: JsonRecord, facts: string[], prefix: string): void {
  const before = firstNumber(expected.hpBefore, expected.beforeHp, expected.playerHpBefore, expected.enemyHpBefore);
  const after = firstNumber(expected.hpAfter, expected.afterHp, expected.playerHpAfter, expected.enemyHpAfter);
  if (typeof before === "number" && typeof after === "number") facts.push(`${prefix} ${before}->${after}`);
}

function actionFact(expected: JsonRecord, facts: string[]): void {
  const action = firstNonEmptyString(expected.action, expected.transition, expected.progress, expected.phase);
  const screen = firstNonEmptyString(expected.screen, expected.nextScreen);
  if (action && screen) {
    facts.push(`${action} -> ${screen}`);
    return;
  }
  if (action) facts.push(action);
}

function booleanFact(expected: JsonRecord, facts: string[], key: string, label = key): void {
  if (typeof expected[key] === "boolean") facts.push(`${label}:${expected[key] ? "yes" : "no"}`);
}

function firstNonEmptyString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function candidateFuturePriority(
  future: DeliberationPacket["candidateFutures"][number],
  index: number,
  rankedCandidates: Map<string, number>
): number {
  let priority = Math.max(0, 8 - index);
  const candidateRank = rankedCandidates.get(future.sourceCandidateId ?? future.id);
  if (typeof candidateRank === "number") priority += Math.max(0, 6 - candidateRank);
  if (matchesFutureSignal(future, /lethal|kill|survive|survival|incoming|block|death|boss/i)) priority += 6;
  if (Array.isArray(future.risk) && future.risk.length > 0) priority += 2;
  if (Array.isArray(future.predictionChecks) && future.predictionChecks.some((check) => isRecord(check) && check.severity === "critical")) {
    priority += 4;
  }
  return priority;
}

function matchesFutureSignal(future: DeliberationPacket["candidateFutures"][number], pattern: RegExp): boolean {
  const values = [
    future.label,
    future.plan,
    ...(future.predictedOutcome ?? []),
    ...(future.risk ?? []),
    ...(future.uncertainty ?? []),
    ...(future.assumptions ?? []),
    ...(future.invalidationTriggers ?? [])
  ];
  return values.some((value) => typeof value === "string" && pattern.test(value));
}

function candidateFutureFieldSizes(candidateFutures: unknown[]): Record<string, number> {
  const sizes: Record<string, number> = {};
  for (const future of candidateFutures) {
    if (!isRecord(future)) continue;
    for (const [key, value] of Object.entries(future)) {
      sizes[key] = (sizes[key] ?? 0) + Buffer.byteLength(JSON.stringify(value), "utf8");
    }
  }
  return sizes;
}

function topFieldSources(sizes: Record<string, number>, limit: number): Record<string, number> {
  return Object.fromEntries(
    Object.entries(sizes)
      .sort((left, right) => right[1] - left[1])
      .slice(0, limit)
  );
}

function repeatedTextSummary(candidateFutures: unknown[]): { bytes: number; count: number } {
  const counts = new Map<string, number>();
  for (const future of candidateFutures) {
    for (const text of futureStrings(future)) {
      counts.set(text, (counts.get(text) ?? 0) + 1);
    }
  }
  let bytes = 0;
  let count = 0;
  for (const [text, occurrences] of counts) {
    if (occurrences <= 1) continue;
    count += occurrences - 1;
    bytes += Buffer.byteLength(text, "utf8") * (occurrences - 1);
  }
  return { bytes, count };
}

function futureStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(futureStrings);
  if (!isRecord(value)) return [];
  return Object.values(value).flatMap(futureStrings);
}

function countTruncatedStrings(value: unknown): number {
  if (typeof value === "string") return value.endsWith("...") ? 1 : 0;
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + countTruncatedStrings(item), 0);
  if (!isRecord(value)) return 0;
  return Object.values(value).reduce<number>((sum, item) => sum + countTruncatedStrings(item), 0);
}

function truncatedFieldCounts(value: unknown, path = ""): Record<string, number> {
  const counts: Record<string, number> = {};
  if (typeof value === "string") {
    if (value.endsWith("...")) {
      counts[path || "string"] = 1;
    }
    return counts;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      mergeCounts(counts, truncatedFieldCounts(item, path));
    }
    return counts;
  }
  if (!isRecord(value)) return counts;
  for (const [key, item] of Object.entries(value)) {
    mergeCounts(counts, truncatedFieldCounts(item, key));
  }
  return counts;
}

function mergeCounts(target: Record<string, number>, source: Record<string, number>): void {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] ?? 0) + value;
  }
}

function futureId(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  const candidateId = typeof value.id === "string" ? value.id : undefined;
  return candidateId?.trim() || undefined;
}

function informationPreservationEstimate(before: unknown[], after: unknown[]): number {
  const beforeBytes = Buffer.byteLength(JSON.stringify(before), "utf8");
  const afterBytes = Buffer.byteLength(JSON.stringify(after), "utf8");
  if (beforeBytes <= 0) return 1;
  return Number(Math.min(1, Math.max(0, afterBytes / beforeBytes)).toFixed(3));
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

function reasonBriefStyleForDecisionClass(decisionClass?: string): string {
  if (typeof decisionClass === "string" && decisionClass.startsWith("combat:")) {
    return "one short tactical sentence naming the main gain and the main cost, delay, or risk this turn";
  }
  return "one short tactical or strategic sentence naming the main tradeoff";
}

function reasonBriefRuleForDecisionClass(decisionClass?: string): string | undefined {
  if (typeof decisionClass === "string" && decisionClass.startsWith("combat:")) {
    return "In combat, say both what this line gains now and what it gives up, delays, or risks.";
  }
  return undefined;
}

function buildWorkspaceBudget(
  options: WorkspaceShadowOptions,
  estimatedInputTokens: number,
  maxOutputTokens: number,
  decisionClass: string
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
    skippedReason = "skipped_by_budget";
  } else if (estimatedInputTokens > hardInputTokenLimit) {
    status = "token_budget_exceeded";
    skippedReason = "token_budget_exceeded";
  } else if (estimatedCostUsd > maxEstimatedCostUsd) {
    status = "cost_budget_exceeded";
    skippedReason = "cost_budget_exceeded";
  } else if (estimatedInputTokens > softInputTokenLimit) {
    status = "soft_token_limit_exceeded";
  }
  const governanceProfile = options.budgetGovernanceProfile ?? "shadow_exploration";
  const governancePolicy = buildBudgetGovernancePolicy({
    profile: governanceProfile,
    decisionClass,
    liveAdditiveEnabled: Boolean(options.liveAdditiveEnabled),
    liveDecisionClassWhitelist: options.liveDecisionClassWhitelist ?? [],
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
  });
  return {
    governanceProfile,
    governancePolicy,
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

function providerMetadataString(decision: unknown, key: string): string | undefined {
  if (!isRecord(decision) || !isRecord(decision.providerMetadata)) return undefined;
  const value = decision.providerMetadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isOutputCapHit(
  decision: unknown,
  comparison: DeliberationWorkspaceComparison
): boolean | undefined {
  const finishReason = providerMetadataString(decision, "finishReason");
  if (finishReason === "length") return true;
  const completionTokens = providerUsageNumber(decision, "completionTokens");
  const maxOutputTokens = comparison.budget?.maxOutputTokens;
  if (typeof completionTokens === "number" && typeof maxOutputTokens === "number") {
    return completionTokens >= maxOutputTokens;
  }
  return undefined;
}

function classifyShadowError(message: string): string {
  return /timed out|timeout|abort/i.test(message) ? "timeout" : "error";
}

function isLiveEligibleDecisionClass(decisionClass: string): boolean {
  return /:llm_required$/u.test(decisionClass);
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
