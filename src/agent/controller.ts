import type { GameClient } from "./client.js";
import { buildExecutionCheckpoint } from "./checkpoint.js";
import type {
  AgentAction,
  DecisionLlmAudit,
  DecisionLogEntry,
  FallbackPolicyAudit,
  LlmAuditOutcome,
  LlmDecision,
  NormalizedState,
  ScoredCandidate,
  ExecutionCheckpoint
} from "./types.js";
import type { LlmDecider } from "./llm.js";
import { describeLlmCommandSource } from "./llm.js";
import { NoopLlmDecider } from "./llm.js";
import { validateLlmDecisionForCandidates } from "./llm.js";
import { generateCandidates } from "./candidates.js";
import { AgentDecisionRecorder } from "./decisionRecorder.js";
import { MemoryManager } from "./memory.js";
import { getIncomingDamage, normalizeGameState, summarizeState } from "./state.js";
import { scoreCandidates } from "./scoring.js";
import { buildDecisionPrompt } from "./prompt.js";
import { selectFallbackCandidate } from "./fallback.js";
import { isRecord, nowIso, stableId } from "./utils.js";
import { buildCognitiveScaffold, buildConsolidationRecord, buildPredictionErrorRecord } from "./cognitiveScaffold.js";
import { buildDerivedSnapshot } from "./derivedKnowledge.js";
import { buildCompactWorkspaceSummary, buildP8WorkspaceShadowFromPacket } from "./workspace.js";
import { P8_LIVE_ADDITIVE_FLAG, P8_LIVE_DECISION_CLASSES_FLAG } from "./workspaceExperimentConfig.js";
import { buildMapRoutePlanFromChoice } from "./mapRoutePlan.js";

export interface ControllerOptions {
  dryRun?: boolean;
  forceLlm?: boolean;
  maxLlmPerTick?: number;
}

export interface TickResult {
  state: NormalizedState;
  chosen?: ScoredCandidate;
  chosenBy: "local" | "llm" | "fallback" | "none";
  route?: string;
  routeReasons?: string[];
  fallbackReason?: string;
  fallbackPolicy?: FallbackPolicyAudit;
  llm?: DecisionLlmAudit;
  checkpoint?: ExecutionCheckpoint;
  executed: boolean;
  message: string;
}

export interface LiveAdditivePromptBuild {
  prompt: string;
  promptMode: "legacy_only" | "additive_legacy_prompt_plus_compact_workspace_summary";
  enabled: boolean;
  applied: boolean;
  decisionClass: string;
  whitelist: string[];
  summaryBytes?: number;
}

export function buildP8LiveAdditivePrompt(input: {
  legacyPrompt: string;
  compactWorkspaceSummary: string;
  decisionClass: string;
  liveAdditiveEnabled?: boolean;
  liveDecisionClassWhitelist?: string[];
}): LiveAdditivePromptBuild {
  const enabled = Boolean(input.liveAdditiveEnabled);
  const whitelist = input.liveDecisionClassWhitelist ?? [];
  const whitelisted = whitelist.includes(input.decisionClass);
  const summary = input.compactWorkspaceSummary.trim();
  if (!enabled || !whitelisted || !summary) {
    return {
      prompt: input.legacyPrompt,
      promptMode: "legacy_only",
      enabled,
      applied: false,
      decisionClass: input.decisionClass,
      whitelist,
      summaryBytes: summary ? Buffer.byteLength(summary, "utf8") : undefined
    };
  }

  const additive = {
    mode: "additive_legacy_prompt_plus_compact_workspace_summary",
    decisionClass: input.decisionClass,
    constraints: [
      "Use this only as additional strategic context.",
      "Choose candidateId only from the legacy candidates list.",
      "Do not invent actions, candidate ids, memory writes, derived knowledge, or strategy changes.",
      "Legacy validation, fallback, and execution remain authoritative."
    ],
    workspace_summary: parseJsonOrString(summary)
  };

  return {
    prompt: addJsonField(input.legacyPrompt, "p8_live_additive", additive),
    promptMode: "additive_legacy_prompt_plus_compact_workspace_summary",
    enabled,
    applied: true,
    decisionClass: input.decisionClass,
    whitelist,
    summaryBytes: Buffer.byteLength(summary, "utf8")
  };
}

export class AgentController {
  private settlementBackoffUntilMs = 0;
  private readonly workspaceShadowLlm: LlmDecider;
  private cardSelectGuard?: {
    fingerprint: string;
    kind: "select_card" | "combat_select_card";
    selectedIndices: Set<number>;
  };
  private noProgressActionGuard?: {
    fingerprint: string;
    actionSignature: string;
  };

  constructor(
    private readonly client: GameClient,
    private readonly memory: MemoryManager,
    private readonly llm: LlmDecider,
    private readonly recorder?: AgentDecisionRecorder,
    private readonly workspaceLlm?: LlmDecider
  ) {
    this.workspaceShadowLlm = workspaceLlm ?? new NoopLlmDecider();
  }

  async tick(options: ControllerOptions = {}): Promise<TickResult> {
    const rawState = await this.client.getState("json");
    const state = normalizeGameState(rawState);
    this.memory.updateFromState(state);

    if (!options.dryRun && Date.now() < this.settlementBackoffUntilMs) {
      return {
        state,
        chosenBy: "none",
        executed: false,
        message: "Waiting for previous action settlement"
      };
    }

    if (state.screen === "game_over") {
      const runForGameOverRecord = this.memory.run;
      const reward = this.memory.hasActiveRunEvidence() ? this.memory.finalizeRun(state) : null;
      const chosen = gameOverReturnCandidate(state);
      if (chosen && !options.dryRun) {
        try {
          const executionResult = await this.client.execute(chosen.action);
          const settlement = await this.waitForSettlement(state, chosen.action);
          const checkpoint = buildExecutionCheckpoint({
            before: state,
            after: settlement.state,
            action: chosen.action,
            settled: settlement.settled,
            polls: settlement.polls
          });
          const tags = tagsForState(state);
          const derivedSnapshot = buildDerivedSnapshot({ state, candidates: [chosen], tags });
          const cognitive = buildCognitiveScaffold({
            state,
            run: runForGameOverRecord,
            candidates: [chosen],
            relevantMemories: this.memory.relevantMemories(tags, 5),
            tags,
            route: { kind: "forced_local", shouldAskLlm: false, llmPriority: "none", reasons: ["game_over_return_main_menu"] },
            uncertaintyReasons: [],
            derivedSnapshot
          });
          const gameOverMemories = this.memory.relevantMemories(tags, 5);
          const selectedPlan = cognitive.candidateFutures[0];
          const predictionError = buildPredictionErrorRecord({ selectedPlan, checkpoint });
          const legacyPrompt = buildDecisionPrompt({
            state,
            run: runForGameOverRecord,
            candidates: [chosen],
            memories: gameOverMemories,
            uncertaintyReasons: []
          });
          const workspaceShadow = await buildP8WorkspaceShadowFromPacket({
            legacyPrompt,
            deliberationPacket: cognitive.deliberationPacket,
            candidates: [chosen],
            decisionClass: "game_over:forced_local",
            llm: this.workspaceShadowLlm,
            legacySelectedCandidateId: chosen.id
          });
          this.recorder?.recordAgentDecision({
            runId: runForGameOverRecord.runId,
            tick: runForGameOverRecord.counters.ticks,
            preRawState: rawState,
            preState: state,
            postRawState: settlement.state.raw,
            postState: settlement.state,
            legalActions: [chosen],
            selectedCandidate: chosen,
            selectedAction: chosen.action,
            executionResult,
            checkpoint,
            chosenBy: "local",
            route: { kind: "forced_local", reasons: ["game_over_return_main_menu"] },
            memoryRun: runForGameOverRecord,
            derivedSnapshot,
            strategicImpression: cognitive.strategicImpression,
            salienceSignals: cognitive.salienceSignals,
            memoryActivation: cognitive.memoryActivation,
            candidateFutures: cognitive.candidateFutures,
            deliberationPacket: cognitive.deliberationPacket,
            promptParity: cognitive.promptParity,
            workspaceComparison: workspaceShadow.comparison,
            shadowWorkspaceDecision: workspaceShadow.shadowDecision,
            selectedPlan,
            predictionError,
            consolidation: buildConsolidationRecord({ selectedPlan, predictionError })
          });
          return {
            state,
            chosen,
            chosenBy: "local",
            executed: true,
            message: `${reward ? `Run finalized: ${reward.result} score=${reward.score}` : "Run already finalized"}; returned to main menu`
          };
        } catch (error) {
          return {
            state,
            chosen,
            chosenBy: "none",
            executed: false,
            message: `Game over finalized but menu action failed: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }

      return {
        state,
        chosen,
        chosenBy: "none",
        executed: false,
        message: reward ? `Run finalized: ${reward.result} score=${reward.score}` : "Run already finalized"
      };
    }

    const candidates = generateCandidates(state);
    if (candidates.length === 0) {
      return {
        state,
        chosenBy: "none",
        executed: false,
        message: "No actionable candidates"
      };
    }

    const scoring = scoreCandidates(state, candidates, this.memory.run, this.memory.strategy);
    const tags = tagsForState(state);
    const relevantMemories = this.memory.relevantMemories(tags, 5);
    const derivedSnapshot = buildDerivedSnapshot({ state, candidates: scoring.candidates, tags });
    const cognitive = buildCognitiveScaffold({
      state,
      run: this.memory.run,
      candidates: scoring.candidates,
      relevantMemories,
      tags,
      route: scoring.route,
      uncertaintyReasons: scoring.uncertaintyReasons,
      derivedSnapshot
    });
    let chosen = scoring.top;
    let chosenBy: TickResult["chosenBy"] = "local";
    let llmDecision: LlmDecision | null = null;
    let fallbackReason: string | undefined;
    let fallbackPolicy: FallbackPolicyAudit | undefined;
    let checkpoint: ExecutionCheckpoint | undefined;
    const llmWanted = Boolean(chosen) && (options.forceLlm || scoring.shouldAskLlm);
    const llmAudit: DecisionLlmAudit = {
      wanted: llmWanted,
      called: false,
      available: this.llm.isAvailable?.() ?? true,
      outcome: llmWanted ? "unavailable" : "not_needed",
      providerSource: describeLlmCommandSource()
    };
    const promptCandidates = scoring.candidates.slice(0, this.memory.strategy.thresholds.maxLlmCandidates);
    const decisionClass = `${state.screen}:${scoring.route.kind}`;
    const legacyPrompt = buildDecisionPrompt({
      state,
      run: this.memory.run,
      candidates: promptCandidates,
      memories: relevantMemories,
      uncertaintyReasons: scoring.uncertaintyReasons
    });
    const liveAdditivePrompt = buildP8LiveAdditivePrompt({
      legacyPrompt,
      compactWorkspaceSummary: buildCompactWorkspaceSummary(cognitive.deliberationPacket),
      decisionClass,
      liveAdditiveEnabled: isEnabledEnv(process.env[P8_LIVE_ADDITIVE_FLAG]),
      liveDecisionClassWhitelist: parseEnvList(process.env[P8_LIVE_DECISION_CLASSES_FLAG])
    });
    const liveAdditiveBlocksLlmCall = liveAdditivePrompt.enabled && !liveAdditivePrompt.applied;

    const shouldAskLlm =
      llmWanted &&
      (options.maxLlmPerTick ?? 1) > 0 &&
      !liveAdditiveBlocksLlmCall;

    if (llmWanted && (options.maxLlmPerTick ?? 1) <= 0) {
      chosenBy = "fallback";
      fallbackReason = "llm_disabled_by_tick_limit";
      llmAudit.outcome = "disabled_by_tick_limit";
    } else if (llmWanted && liveAdditiveBlocksLlmCall) {
      chosenBy = "fallback";
      fallbackReason = "live_additive_decision_class_not_whitelisted";
      llmAudit.outcome = "disabled_by_live_whitelist";
      llmAudit.promptMode = liveAdditivePrompt.promptMode;
      llmAudit.liveAdditiveEnabled = liveAdditivePrompt.enabled;
      llmAudit.liveAdditiveApplied = liveAdditivePrompt.applied;
      llmAudit.liveAdditiveDecisionClass = liveAdditivePrompt.decisionClass;
      llmAudit.liveAdditiveWhitelist = liveAdditivePrompt.whitelist;
      llmAudit.liveAdditiveSummaryBytes = liveAdditivePrompt.summaryBytes;
    } else if (shouldAskLlm) {
      if (!llmAudit.available) {
        chosenBy = "fallback";
        fallbackReason = "llm_unavailable";
        llmAudit.outcome = "unavailable";
      } else {
        llmAudit.called = true;
        llmAudit.promptBytes = Buffer.byteLength(liveAdditivePrompt.prompt, "utf8");
        llmAudit.candidatesSent = promptCandidates.length;
        llmAudit.promptMode = liveAdditivePrompt.promptMode;
        llmAudit.liveAdditiveEnabled = liveAdditivePrompt.enabled;
        llmAudit.liveAdditiveApplied = liveAdditivePrompt.applied;
        llmAudit.liveAdditiveDecisionClass = liveAdditivePrompt.decisionClass;
        llmAudit.liveAdditiveWhitelist = liveAdditivePrompt.whitelist;
        llmAudit.liveAdditiveSummaryBytes = liveAdditivePrompt.summaryBytes;
        cognitive.promptParity.livePromptUsed = true;
        cognitive.promptParity.livePromptBytes = llmAudit.promptBytes;
        cognitive.deliberationPacket.promptParity = cognitive.promptParity;

        try {
          llmDecision = await this.llm.decide(liveAdditivePrompt.prompt);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const outcome = classifyLlmError(message);
          llmAudit.outcome = outcome;
          llmAudit.error = message.slice(0, 240);
          chosenBy = "fallback";
          fallbackReason = `llm_${outcome}`;
          console.warn(`LLM decision failed; falling back to local: ${message}`);
        }
      }

      if (llmDecision) {
        llmAudit.candidateId = llmDecision.candidateId;
        const validation = validateLlmDecisionForCandidates(llmDecision, scoring.candidates);
        const llmChoice = validation.valid
          ? scoring.candidates.find((candidate) => candidate.id === llmDecision?.candidateId)
          : undefined;
        if (validation.valid && llmChoice) {
          chosen = llmChoice;
          chosenBy = "llm";
          llmAudit.outcome = "selected";
          if (llmDecision.memoryUpdates) {
            this.memory.applyLlmMemoryUpdate(llmDecision.memoryUpdates);
          }
        } else {
          chosenBy = "fallback";
          fallbackReason = validation.outcome === "invalid_output" ? "llm_invalid_output" : "llm_invalid_choice";
          llmAudit.outcome = validation.outcome ?? "invalid_choice";
          llmAudit.error = validation.error;
        }
      } else if (scoring.shouldAskLlm && chosenBy !== "fallback") {
        chosenBy = "fallback";
        fallbackReason = "llm_unavailable";
        llmAudit.outcome = "unavailable";
      }
    }

    if (!chosen) {
      return {
        state,
        chosenBy: "none",
        executed: false,
        message: "No scored candidate selected"
      };
    }

    if (chosenBy === "fallback") {
      const fallbackSelection = selectFallbackCandidate({
        state,
        route: scoring.route,
        candidates: scoring.candidates,
        localTop: chosen,
        fallbackReason
      });
      chosen = fallbackSelection.candidate ?? chosen;
      fallbackPolicy = fallbackSelection.audit;
    }
    const workspaceShadow = await buildP8WorkspaceShadowFromPacket({
      legacyPrompt,
      deliberationPacket: cognitive.deliberationPacket,
      candidates: scoring.candidates,
      decisionClass,
      llm: this.workspaceShadowLlm,
      legacySelectedCandidateId: chosen.id
    });

    if (!options.dryRun) {
      const guardedChoice = this.avoidRepeatedCardSelectToggle(state, chosen, scoring.candidates);
      if (!guardedChoice) {
        return {
          state,
          chosen,
          chosenBy: "none",
          route: scoring.route.kind,
          routeReasons: scoring.route.reasons,
          fallbackReason,
          fallbackPolicy,
          llm: llmAudit,
          executed: false,
          message: "Waiting for card selection state to expose new selectable cards or confirmation"
        };
      }
      chosen = guardedChoice;
      if (this.shouldBlockRepeatedNoProgressAction(state, chosen.action)) {
        return {
          state,
          chosen,
          chosenBy: "none",
          route: scoring.route.kind,
          routeReasons: scoring.route.reasons,
          fallbackReason,
          fallbackPolicy,
          llm: llmAudit,
          executed: false,
          message: `Waiting after no-progress guard for ${chosen.label}`
        };
      }

      let executionResult: unknown;
      let settlement: { state: NormalizedState; settled: boolean; polls: number };
      try {
        executionResult = await this.client.execute(chosen.action);
        settlement = await this.waitForSettlement(state, chosen.action);
        checkpoint = buildExecutionCheckpoint({
          before: state,
          after: settlement.state,
          action: chosen.action,
          settled: settlement.settled,
          polls: settlement.polls
        });
        this.noteNoProgressGuardFromCheckpoint(checkpoint, chosen.action, settlement.state);
        this.noteSettlement(settlement.settled, chosen.action, settlement.state);
      } catch (error) {
        if (isActionsDisabledWhileSettling(error)) {
          this.settlementBackoffUntilMs = Date.now() + 2000;
        }
        return {
          state,
          chosen,
          chosenBy: "none",
          executed: false,
          message: `Action not accepted; waiting: ${error instanceof Error ? error.message : String(error)}`
        };
      }

      const nextMapRoutePlan = buildMapRoutePlanFromChoice({
        state,
        candidate: chosen,
        run: this.memory.run
      });
      if (nextMapRoutePlan) {
        this.memory.run.activeMapRoutePlan = nextMapRoutePlan;
      }

      const entry = buildDecisionEntry(
        state,
        chosen,
        chosenBy,
        scoring.candidates,
        llmDecision,
        scoring.route,
        llmAudit,
        fallbackReason,
        fallbackPolicy,
        checkpoint
      );
      this.memory.recordDecision(entry);
      const selectedCandidateForRecord = chosen;
      const selectedPlan = cognitive.candidateFutures.find((future) => future.sourceCandidateId === selectedCandidateForRecord.id);
      const predictionError = buildPredictionErrorRecord({ selectedPlan, checkpoint });
      const consolidation = buildConsolidationRecord({ selectedPlan, predictionError });
      this.recorder?.recordAgentDecision({
        runId: this.memory.run.runId,
        tick: this.memory.run.counters.ticks,
        preRawState: rawState,
        preState: state,
        postRawState: settlement.state.raw,
        postState: settlement.state,
        legalActions: scoring.candidates,
        selectedCandidate: chosen,
        selectedAction: chosen.action,
        executionResult,
        checkpoint,
        chosenBy,
        route: scoring.route,
        llmAudit,
        llmDecision,
        fallbackReason,
        fallbackPolicy,
        memoryRun: this.memory.run,
        derivedSnapshot,
        strategicImpression: cognitive.strategicImpression,
        salienceSignals: cognitive.salienceSignals,
        memoryActivation: cognitive.memoryActivation,
        candidateFutures: cognitive.candidateFutures,
        deliberationPacket: cognitive.deliberationPacket,
        promptParity: cognitive.promptParity,
        workspaceComparison: workspaceShadow.comparison,
        shadowWorkspaceDecision: workspaceShadow.shadowDecision,
        selectedPlan,
        predictionError,
        consolidation
      });
    }

    return {
      state,
      chosen,
      chosenBy,
      route: scoring.route.kind,
      routeReasons: scoring.route.reasons,
      fallbackReason,
      fallbackPolicy,
      llm: llmAudit,
      checkpoint,
      executed: !options.dryRun,
      message: `${options.dryRun ? "Dry-run" : "Executed"} ${chosen.label} by ${chosenBy}`
    };
  }

  private async waitForSettlement(
    previous: NormalizedState,
    action: AgentAction
  ): Promise<{ state: NormalizedState; settled: boolean; polls: number }> {
    const maxPolls = action.kind === "end_turn" ? 40 : 8;
    const intervalMs = action.kind === "end_turn" ? 200 : 70;
    const previousFingerprint = stateFingerprint(previous);
    let lastObserved = previous;

    for (let poll = 0; poll < maxPolls; poll += 1) {
      await sleep(intervalMs);
      const next = normalizeGameState(await this.client.getState("json"));
      lastObserved = next;
      if (isSettled(previous, next, previousFingerprint, action)) {
        return { state: next, settled: true, polls: poll + 1 };
      }
    }
    return { state: lastObserved, settled: false, polls: maxPolls };
  }

  private noteSettlement(settled: boolean, action: AgentAction, postState?: NormalizedState): void {
    this.noteCardSelectSettlement(settled, action, postState);

    if (settled) {
      if (action.kind === "choose_rest_option" && postState?.screen === "rest") {
        this.settlementBackoffUntilMs = Date.now() + 900;
        return;
      }
      this.settlementBackoffUntilMs = 0;
      return;
    }
    this.settlementBackoffUntilMs = Date.now() + (action.kind === "end_turn" ? 3000 : 1200);
  }

  private avoidRepeatedCardSelectToggle(
    state: NormalizedState,
    chosen: ScoredCandidate,
    candidates: ScoredCandidate[]
  ): ScoredCandidate | undefined {
    const action = chosen.action;
    if (!isCardSelectToggle(action)) {
      if (state.screen !== "card_select") this.cardSelectGuard = undefined;
      return chosen;
    }

    const fingerprint = stateFingerprint(state);
    if (
      !this.cardSelectGuard ||
      this.cardSelectGuard.fingerprint !== fingerprint ||
      this.cardSelectGuard.kind !== action.kind
    ) {
      this.cardSelectGuard = {
        fingerprint,
        kind: action.kind,
        selectedIndices: new Set()
      };
    }

    if (!this.cardSelectGuard.selectedIndices.has(action.index)) {
      return chosen;
    }

    return candidates.find((candidate) => {
      const candidateAction = candidate.action;
      return (
        isCardSelectToggle(candidateAction) &&
        candidateAction.kind === action.kind &&
        !this.cardSelectGuard?.selectedIndices.has(candidateAction.index)
      );
    });
  }

  private noteCardSelectSettlement(settled: boolean, action: AgentAction, postState?: NormalizedState): void {
    if (!isCardSelectToggle(action)) {
      if (postState?.screen !== "card_select") this.cardSelectGuard = undefined;
      return;
    }

    if (settled || postState?.screen !== "card_select") {
      this.cardSelectGuard = undefined;
      return;
    }

    const fingerprint = postState ? stateFingerprint(postState) : this.cardSelectGuard?.fingerprint;
    if (!fingerprint) return;
    if (
      !this.cardSelectGuard ||
      this.cardSelectGuard.fingerprint !== fingerprint ||
      this.cardSelectGuard.kind !== action.kind
    ) {
      this.cardSelectGuard = {
        fingerprint,
        kind: action.kind,
        selectedIndices: new Set()
      };
    }
    this.cardSelectGuard.selectedIndices.add(action.index);
  }

  private shouldBlockRepeatedNoProgressAction(state: NormalizedState, action: AgentAction): boolean {
    if (!this.noProgressActionGuard) return false;
    const fingerprint = stateFingerprint(state);
    if (this.noProgressActionGuard.fingerprint !== fingerprint) {
      this.noProgressActionGuard = undefined;
      return false;
    }
    return this.noProgressActionGuard.actionSignature === actionSignature(action);
  }

  private noteNoProgressGuardFromCheckpoint(
    checkpoint: ExecutionCheckpoint,
    action: AgentAction,
    postState?: NormalizedState
  ): void {
    const noVisibleProgress =
      checkpoint.kind === "unknown" &&
      checkpoint.preStateHash === checkpoint.postStateHash &&
      checkpoint.reasons.includes("settlement_timeout_or_no_visible_change");
    if (!noVisibleProgress || !postState) {
      this.noProgressActionGuard = undefined;
      return;
    }
    this.noProgressActionGuard = {
      fingerprint: stateFingerprint(postState),
      actionSignature: actionSignature(action)
    };
  }
}

function isEnabledEnv(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseEnvList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseJsonOrString(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function addJsonField(source: string, field: string, value: unknown): string {
  try {
    const parsed = JSON.parse(source);
    if (isRecord(parsed)) {
      return JSON.stringify({ ...parsed, [field]: value });
    }
  } catch {
    // Fall through to a text append for non-JSON live prompt adapters.
  }
  return `${source}\n\n${field}: ${JSON.stringify(value)}`;
}

function buildDecisionEntry(
  state: NormalizedState,
  chosen: ScoredCandidate,
  chosenBy: "local" | "llm" | "fallback" | "none",
  candidates: ScoredCandidate[],
  llmDecision: LlmDecision | null,
  route: { kind: DecisionLogEntry["route"]; reasons: string[] },
  llmAudit: DecisionLlmAudit,
  fallbackReason?: string,
  fallbackPolicy?: FallbackPolicyAudit,
  checkpoint?: ExecutionCheckpoint
): DecisionLogEntry {
  return {
    id: stableId("decision"),
    at: nowIso(),
    act: state.act,
    floor: state.floor,
    screen: state.screen,
    stateSummary: summarizeState(state),
    chosen: chosen.label,
    chosenBy: chosenBy === "none" ? "fallback" : chosenBy,
    route: route.kind,
    routeReasons: route.reasons,
    fallbackReason,
    fallbackPolicy,
    llm: llmAudit,
    checkpoint,
    candidateCount: candidates.length,
    topCandidate: {
      id: candidates[0]?.id ?? chosen.id,
      label: candidates[0]?.label ?? chosen.label,
      score: candidates[0]?.score ?? chosen.score,
      confidence: candidates[0]?.confidence ?? chosen.confidence
    },
    score: chosen.score,
    confidence: chosen.confidence,
    reasons: [...chosen.reasons, ...(llmDecision?.reason ? [`llm:${llmDecision.reason}`] : [])],
    candidates: candidates.slice(0, 5).map((candidate) => ({
      id: candidate.id,
      label: candidate.label,
      score: candidate.score,
      reasons: candidate.reasons
    }))
  };
}

function classifyLlmError(message: string): LlmAuditOutcome {
  if (/timeout|timed out/i.test(message)) return "timeout";
  if (/json|candidateid|missing|output/i.test(message)) return "invalid_output";
  return "error";
}

function isActionsDisabledWhileSettling(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /actions are currently disabled|turn may already be ending|currently disabled/i.test(message);
}

function isCardSelectToggle(action: AgentAction): action is Extract<AgentAction, { kind: "select_card" | "combat_select_card" }> {
  return action.kind === "select_card" || action.kind === "combat_select_card";
}

function tagsForState(state: NormalizedState): string[] {
  const tags = [state.screen, state.stateType, state.player.character];
  if (state.screen === "combat") {
    tags.push("combat");
    const incoming = getIncomingDamage(state);
    if (incoming > 0) tags.push("incoming_damage");
    if (incoming >= state.player.hp * 0.5) tags.push("high_incoming");
    for (const enemy of state.enemies) {
      pushTags(tags, enemy.id, enemy.name);
      for (const status of enemy.status) {
        pushTags(tags, status.id, status.name, status.type);
      }
    }
  }
  for (const card of state.player.hand) {
    pushTags(tags, card.id, card.name, card.type, card.rarity);
  }
  for (const relic of state.player.relics) {
    pushTags(tags, relic.id, relic.name);
  }
  for (const potion of state.player.potions) {
    pushTags(tags, potion.id, potion.name);
  }
  if (state.player.hp / Math.max(1, state.player.maxHp) < 0.35) {
    tags.push("low_hp");
  }
  return tags.filter(Boolean);
}

function pushTags(tags: string[], ...values: unknown[]): void {
  for (const value of values) {
    const tag = String(value ?? "").trim();
    if (tag) tags.push(tag);
  }
}

function gameOverReturnCandidate(state: NormalizedState): ScoredCandidate | undefined {
  const gameOver = isRecord(state.raw.game_over) ? state.raw.game_over : {};
  const rawOptions = gameOver.options;
  const canReturn = Array.isArray(rawOptions) ? rawOptions.some((option) => String(option) === "main_menu") : true;
  if (!canReturn) return undefined;
  return {
    id: "menu-main",
    kind: "menu_select",
    label: "返回主菜单",
    action: { kind: "menu_select", option: "main_menu" },
    score: 1,
    confidence: 0.95,
    reasons: ["game over 后返回主菜单"],
    risks: []
  };
}

function isSettled(
  previous: NormalizedState,
  next: NormalizedState,
  previousFingerprint: string,
  action: AgentAction
): boolean {
  if (action.kind === "end_turn") {
    return (
      next.screen !== "combat" ||
      (next.screen === "combat" &&
        next.round !== previous.round &&
        next.turn !== "enemy" &&
        (next.isPlayPhase || next.player.hand.length > 0))
    );
  }

  if (action.kind === "choose_map_node") {
    return next.screen !== "map" || next.floor !== previous.floor || stateFingerprint(next) !== previousFingerprint;
  }

  if (action.kind === "play_card" && next.screen === previous.screen && next.stateType === previous.stateType) {
    const staleCard = next.player.hand.find((card) => card.index === action.cardIndex);
    if (staleCard && staleCard.name === action.cardName) {
      return false;
    }
  }

  if (
    action.kind === "event_choose_option" ||
    action.kind === "claim_treasure_relic" ||
    action.kind === "select_card" ||
    action.kind === "combat_select_card" ||
    action.kind === "confirm_selection" ||
    action.kind === "combat_confirm_selection" ||
    action.kind === "menu_select" ||
    action.kind === "proceed"
  ) {
    return next.stateType !== previous.stateType || next.screen !== previous.screen || stateFingerprint(next) !== previousFingerprint;
  }

  return stateFingerprint(next) !== previousFingerprint;
}

function stateFingerprint(state: NormalizedState): string {
  return JSON.stringify({
    stateType: state.stateType,
    screen: state.screen,
    act: state.act,
    floor: state.floor,
    round: state.round,
    turn: state.turn,
    isPlayPhase: state.isPlayPhase,
    hp: state.player.hp,
    block: state.player.block,
    energy: state.player.energy,
    hand: state.player.hand.map((card) => `${card.index}:${card.id}:${card.name}`),
    enemies: state.enemies.map((enemy) => `${enemy.id}:${enemy.hp}:${enemy.block}`),
    options: state.options.length,
    mapNodes: state.mapNodes.length,
    rewards: state.rewards.length
  });
}

function actionSignature(action: AgentAction): string {
  switch (action.kind) {
    case "play_card":
      return `${action.kind}:${action.cardIndex}:${action.cardName ?? ""}:${action.target ?? ""}`;
    case "use_potion":
      return `${action.kind}:${action.slot}:${action.target ?? ""}`;
    case "discard_potion":
      return `${action.kind}:${action.slot}`;
    case "choose_map_node":
    case "choose_rest_option":
    case "claim_reward":
    case "claim_treasure_relic":
    case "select_card_reward":
    case "event_choose_option":
    case "shop_purchase":
    case "select_card":
    case "combat_select_card":
    case "bundle_select":
      return `${action.kind}:${action.index}`;
    case "menu_select":
      return `${action.kind}:${String(action.option)}:${action.seed ?? ""}`;
    case "crystal_sphere_set_tool":
      return `${action.kind}:${action.tool}`;
    case "crystal_sphere_click_cell":
      return `${action.kind}:${action.x}:${action.y}`;
    default:
      return action.kind;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
