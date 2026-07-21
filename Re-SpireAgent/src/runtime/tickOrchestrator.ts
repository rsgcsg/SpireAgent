import type { AllowedAction } from "../domain/actions/allowedAction.js";
import type { ExecutableGameAction } from "../domain/actions/action.js";
import type { StateEnvelope } from "../domain/state/index.js";
import type { GameAdapter, GameExecutionResult, RawGameState } from "../game-io/adapter.js";
import { TransientObservationError } from "../game-io/observationError.js";
import { validateDecisionForActions } from "../llm/decisionSchema.js";
import type { LlmDecisionProvider } from "../llm/types.js";
import { buildDecisionPrompt } from "../prompting/promptBuilder.js";
import type { DecisionOutcome, DecisionRecord, DecisionRecorder, RecordedState } from "../recording/types.js";
import type { JsonValue } from "../shared/json.js";
import { ProgressCycleGuard } from "./progressCycleGuard.js";
import type { SettlementWatcher } from "./settlementWatcher.js";

export interface TickOrchestratorDependencies {
  adapter: GameAdapter<RawGameState, ExecutableGameAction, GameExecutionResult>;
  normalize: (raw: unknown) => StateEnvelope;
  buildAllowedActions: (state: StateEnvelope["currentState"], sourceStateHash: string) => AllowedAction[];
  llm: LlmDecisionProvider;
  settlement: SettlementWatcher;
  recorder: DecisionRecorder;
}

export interface TickResult {
  decisionId: string;
  outcome: DecisionOutcome;
  contextKind?: StateEnvelope["currentState"]["context"]["kind"];
  surfaceKind?: StateEnvelope["currentState"]["surface"]["kind"];
  actionAuthority?: StateEnvelope["currentState"]["actionAuthority"];
  selectedActionId?: string;
  shouldStopRun: boolean;
  stopReason?: "run_boundary" | "repeated_exact_transition" | "repeated_semantic_transition";
}

export class TickOrchestrator {
  private readonly executedTransitionOccurrences = new Map<string, number>();
  private readonly progressCycleGuard = new ProgressCycleGuard();

  constructor(private readonly dependencies: TickOrchestratorDependencies) {}

  async runTick(tick: number, options: { dryRun?: boolean; stopAtRunBoundary?: boolean } = {}): Promise<TickResult> {
    const startedAt = new Date().toISOString();
    const decisionId = createDecisionId(tick);
    let pre: StateEnvelope;
    try {
      pre = this.dependencies.normalize(await this.dependencies.adapter.readCurrentState());
    } catch (error) {
      const record = baseRecord(this.dependencies.recorder.runId, decisionId, tick, startedAt, "observation_failed");
      record.error = safeError(error);
      await this.dependencies.recorder.append(record);
      // Composite state/inspection drift means this tick observed no coherent
      // decision state. It is safe to skip only this tick; no prompt or action
      // was produced. Every other observation failure remains terminal.
      const shouldStopRun = !(error instanceof TransientObservationError);
      return result(decisionId, record.outcome, undefined, undefined, shouldStopRun);
    }

    const allowedActions = this.dependencies.buildAllowedActions(pre.currentState, pre.stateHash);
    if (pre.diagnostics.status === "invalid" || pre.currentState.stability === "invalid" || pre.currentState.surface.kind === "unsupported") {
      return this.recordWithoutDecision({
        decisionId,
        tick,
        startedAt,
        pre,
        allowedActions,
        outcome: "not_executed_invalid_state",
        error: pre.currentState.surface.kind === "unsupported" ? pre.currentState.surface.reason : "Normalization diagnostics are invalid",
        shouldStopRun: true
      });
    }
    if (pre.currentState.stability !== "actionable") {
      return this.recordWithoutDecision({
        decisionId,
        tick,
        startedAt,
        pre,
        allowedActions,
        outcome: "not_executed_non_actionable_state",
        shouldStopRun: false
      });
    }
    if (options.stopAtRunBoundary && isAutomaticRunStartBoundary(pre.currentState.context.kind)) {
      return this.recordWithoutDecision({
        decisionId,
        tick,
        startedAt,
        pre,
        allowedActions,
        outcome: "not_executed_non_actionable_state",
        error: `Stopped at ${pre.currentState.context.kind} run-start boundary; agent:run never starts or continues another run automatically`,
        shouldStopRun: true,
        stopReason: "run_boundary"
      });
    }
    if (allowedActions.length === 0) {
      return this.recordWithoutDecision({
        decisionId,
        tick,
        startedAt,
        pre,
        allowedActions,
        outcome: "not_executed_no_actions",
        error: `Actionable ${pre.currentState.context.kind}/${pre.currentState.surface.kind} state produced no allowed actions`,
        shouldStopRun: true
      });
    }

    const prompt = buildDecisionPrompt(pre.currentState, allowedActions);
    const prepared = await this.dependencies.recorder.prepare({
      decisionId,
      preRawState: pre.rawState,
      normalizedState: pre.currentState,
      stateHash: pre.stateHash,
      normalizedStateHash: pre.normalizedStateHash,
      diagnostics: pre.diagnostics,
      prompt
    });
    if (options.dryRun) {
      const record = baseRecord(this.dependencies.recorder.runId, decisionId, tick, startedAt, "dry_run");
      record.preState = prepared.preState;
      record.allowedActions = allowedActions;
      if (prepared.prompt) record.prompt = prepared.prompt;
      await this.dependencies.recorder.append(record);
      return result(decisionId, record.outcome, pre.currentState, undefined, false);
    }

    let session;
    try {
      session = await this.dependencies.llm.decide({
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        allowedActionIds: allowedActions.map((action) => action.id)
      });
    } catch (error) {
      const record = baseRecord(this.dependencies.recorder.runId, decisionId, tick, startedAt, "not_executed_llm_failure");
      record.preState = prepared.preState;
      record.allowedActions = allowedActions;
      if (prepared.prompt) record.prompt = prepared.prompt;
      record.error = safeError(error);
      await this.dependencies.recorder.append(record);
      return result(decisionId, record.outcome, pre.currentState, undefined, true);
    }

    const validation = validateDecisionForActions(session.finalAttempt, allowedActions);
    if (!validation.valid) {
      const outcome = validation.outcome === "unknown_action_id" ? "not_executed_invalid_decision" : "not_executed_llm_failure";
      const record = baseRecord(this.dependencies.recorder.runId, decisionId, tick, startedAt, outcome);
      record.preState = prepared.preState;
      record.allowedActions = allowedActions;
      if (prepared.prompt) record.prompt = prepared.prompt;
      record.llm = {
        provider: session.provider,
        model: session.model,
        session,
        validation: { valid: false, outcome: validation.outcome, error: validation.error }
      };
      record.error = validation.error;
      await this.dependencies.recorder.append(record);
      return result(decisionId, record.outcome, pre.currentState, undefined, true);
    }

    let latest: StateEnvelope;
    try {
      latest = this.dependencies.normalize(await this.dependencies.adapter.readCurrentState());
    } catch (error) {
      const record = decisionRecordWithLlm({
        runId: this.dependencies.recorder.runId,
        decisionId,
        tick,
        startedAt,
        outcome: "not_executed_stale_state",
        preState: prepared.preState,
        allowedActions,
        prompt: prepared.prompt,
        session,
        error: `Could not re-read state before execution: ${safeError(error)}`
      });
      await this.dependencies.recorder.append(record);
      return result(decisionId, record.outcome, pre.currentState, validation.selectedAction.id, true);
    }

    if (latest.stateHash !== pre.stateHash || validation.selectedAction.sourceStateHash !== latest.stateHash) {
      const record = decisionRecordWithLlm({
        runId: this.dependencies.recorder.runId,
        decisionId,
        tick,
        startedAt,
        outcome: "not_executed_stale_state",
        preState: prepared.preState,
        allowedActions,
        prompt: prepared.prompt,
        session,
        postState: recordedState(latest),
        selectedActionId: validation.selectedAction.id,
        selectedAction: validation.selectedAction.action,
        stateHashMatched: false,
        error: "State changed after prompt construction and before execution"
      });
      await this.dependencies.recorder.append(record, { postRawState: latest.rawState });
      return result(decisionId, record.outcome, pre.currentState, validation.selectedAction.id, false);
    }

    let adapterResult: GameExecutionResult;
    try {
      adapterResult = await this.dependencies.adapter.execute(validation.selectedAction.action);
    } catch (error) {
      const record = decisionRecordWithLlm({
        runId: this.dependencies.recorder.runId,
        decisionId,
        tick,
        startedAt,
        outcome: "execution_failed",
        preState: prepared.preState,
        allowedActions,
        prompt: prepared.prompt,
        session,
        selectedActionId: validation.selectedAction.id,
        selectedAction: validation.selectedAction.action,
        stateHashMatched: true,
        error: safeError(error)
      });
      await this.dependencies.recorder.append(record);
      return result(decisionId, record.outcome, pre.currentState, validation.selectedAction.id, true);
    }

    if (!adapterResult.accepted) {
      const outcome: DecisionOutcome = adapterResult.outcome === "unknown" ? "executed_unsettled" : "execution_failed";
      const error = adapterResult.outcome === "unknown"
        ? "Adapter command outcome is unknown; the action will not be retried automatically"
        : "Adapter rejected the selected action";
      const record = decisionRecordWithLlm({
        runId: this.dependencies.recorder.runId,
        decisionId,
        tick,
        startedAt,
        outcome,
        preState: prepared.preState,
        allowedActions,
        prompt: prepared.prompt,
        session,
        selectedActionId: validation.selectedAction.id,
        selectedAction: validation.selectedAction.action,
        stateHashMatched: true,
        adapterResult: adapterResult.response,
        error
      });
      await this.dependencies.recorder.append(record);
      return result(decisionId, record.outcome, pre.currentState, validation.selectedAction.id, true);
    }

    const settlement = await this.dependencies.settlement.waitForNextState(
      pre,
      validation.selectedAction.action,
      adapterResult.settlementAuthority,
      adapterResult.confirmedStateToken
    );
    const bridgeCheckpointPending = adapterResult.settlementAuthority === "adapter_confirmed"
      && settlement.status !== "settled";
    const outcome: DecisionOutcome = settlement.status === "settled"
      ? "executed_and_settled"
      : bridgeCheckpointPending
        ? "executed_checkpoint_pending"
        : "executed_unsettled";
    const transitionKey = outcome === "executed_and_settled" && settlement.after
      ? `${pre.stateHash}|${validation.selectedAction.id}|${settlement.after.stateHash}`
      : undefined;
    const transitionOccurrence = transitionKey
      ? (this.executedTransitionOccurrences.get(transitionKey) ?? 0) + 1
      : 0;
    if (transitionKey) this.executedTransitionOccurrences.set(transitionKey, transitionOccurrence);
    const repeatedExactTransition = transitionOccurrence >= 2 && settlement.after;
    const repeatedSemanticTransition = outcome === "executed_and_settled" && settlement.after
      ? this.progressCycleGuard.observe(pre.currentState, validation.selectedAction, settlement.after.currentState)
      : undefined;
    const record = decisionRecordWithLlm({
      runId: this.dependencies.recorder.runId,
      decisionId,
      tick,
      startedAt,
      outcome,
      preState: prepared.preState,
      allowedActions,
      prompt: prepared.prompt,
      session,
      ...(settlement.after ? { postState: recordedState(settlement.after) } : {}),
      selectedActionId: validation.selectedAction.id,
      selectedAction: validation.selectedAction.action,
      stateHashMatched: true,
      adapterResult: adapterResult.response,
      settlement: {
        status: settlement.status,
        polls: settlement.polls,
        elapsedMs: settlement.elapsedMs,
        ...(settlement.error ? { error: settlement.error } : {}),
        ...(settlement.transientObservationErrors
          ? { transientObservationErrors: settlement.transientObservationErrors }
          : {}),
        ...(settlement.lastTransientObservationError
          ? { lastTransientObservationError: settlement.lastTransientObservationError }
          : {})
      },
      ...(settlement.error ? { error: settlement.error } : {})
    });
    if (repeatedExactTransition && settlement.after) {
      record.runtimeGuard = {
        code: "repeated_exact_transition",
        occurrence: transitionOccurrence,
        preStateHash: pre.stateHash,
        postStateHash: settlement.after.stateHash,
        selectedActionId: validation.selectedAction.id
      };
    } else if (repeatedSemanticTransition) {
      record.runtimeGuard = {
        code: "repeated_semantic_transition",
        occurrence: repeatedSemanticTransition.occurrence,
        preProgressHash: repeatedSemanticTransition.preProgressHash,
        postProgressHash: repeatedSemanticTransition.postProgressHash,
        actionProgressHash: repeatedSemanticTransition.actionProgressHash,
        selectedActionId: validation.selectedAction.id,
        selectedActionKind: repeatedSemanticTransition.selectedActionKind
      };
    }
    await this.dependencies.recorder.append(record, settlement.after ? { postRawState: settlement.after.rawState } : undefined);
    return result(
      decisionId,
      record.outcome,
      pre.currentState,
      validation.selectedAction.id,
      outcome === "executed_unsettled" || Boolean(repeatedExactTransition) || Boolean(repeatedSemanticTransition),
      repeatedExactTransition
        ? "repeated_exact_transition"
        : repeatedSemanticTransition
          ? "repeated_semantic_transition"
          : undefined
    );
  }

  private async recordWithoutDecision(input: {
    decisionId: string;
    tick: number;
    startedAt: string;
    pre: StateEnvelope;
    allowedActions: AllowedAction[];
    outcome: DecisionOutcome;
    error?: string;
    shouldStopRun: boolean;
    stopReason?: TickResult["stopReason"];
  }): Promise<TickResult> {
    const prepared = await this.dependencies.recorder.prepare({
      decisionId: input.decisionId,
      preRawState: input.pre.rawState,
      normalizedState: input.pre.currentState,
      stateHash: input.pre.stateHash,
      normalizedStateHash: input.pre.normalizedStateHash,
      diagnostics: input.pre.diagnostics
    });
    const record = baseRecord(this.dependencies.recorder.runId, input.decisionId, input.tick, input.startedAt, input.outcome);
    record.preState = prepared.preState;
    record.allowedActions = input.allowedActions;
    if (input.error) record.error = input.error;
    await this.dependencies.recorder.append(record);
    return result(
      input.decisionId,
      input.outcome,
      input.pre.currentState,
      undefined,
      input.shouldStopRun,
      input.stopReason
    );
  }
}

function baseRecord(runId: string, decisionId: string, tick: number, startedAt: string, outcome: DecisionOutcome): DecisionRecord {
  return {
    recordSchemaVersion: 2,
    decisionId,
    runId,
    tick,
    startedAt,
    completedAt: new Date().toISOString(),
    allowedActions: [],
    execution: { attempted: false },
    outcome
  };
}

function decisionRecordWithLlm(input: {
  runId: string;
  decisionId: string;
  tick: number;
  startedAt: string;
  outcome: DecisionOutcome;
  preState: RecordedState;
  allowedActions: AllowedAction[];
  prompt: DecisionRecord["prompt"];
  session: NonNullable<DecisionRecord["llm"]>["session"];
  postState?: RecordedState;
  selectedActionId?: string;
  selectedAction?: ExecutableGameAction;
  stateHashMatched?: boolean;
  adapterResult?: JsonValue;
  settlement?: DecisionRecord["settlement"];
  error?: string;
}): DecisionRecord {
  return {
    ...baseRecord(input.runId, input.decisionId, input.tick, input.startedAt, input.outcome),
    preState: input.preState,
    allowedActions: input.allowedActions,
    ...(input.prompt ? { prompt: input.prompt } : {}),
    llm: {
      provider: input.session.provider,
      model: input.session.model,
      session: input.session,
      validation: input.outcome === "not_executed_llm_failure"
        ? { valid: false, outcome: "provider_failure", ...(input.error ? { error: input.error } : {}) }
        : { valid: true, outcome: "valid" }
    },
    execution: {
      attempted: ["execution_failed", "executed_and_settled", "executed_unsettled"].includes(input.outcome),
      ...(input.selectedActionId ? { selectedActionId: input.selectedActionId } : {}),
      ...(input.selectedAction ? { action: input.selectedAction } : {}),
      ...(input.stateHashMatched !== undefined ? { stateHashMatchedBeforeExecution: input.stateHashMatched } : {}),
      ...(input.adapterResult ? { adapterResult: input.adapterResult } : {}),
      ...(input.outcome === "execution_failed" && input.error ? { error: input.error } : {})
    },
    ...(input.settlement ? { settlement: input.settlement } : {}),
    ...(input.postState ? { postState: input.postState } : {}),
    ...(input.error ? { error: input.error } : {})
  };
}

function recordedState(envelope: StateEnvelope): RecordedState {
  return {
    rawStateRef: "pending",
    normalizedState: envelope.currentState,
    stateHash: envelope.stateHash,
    normalizedStateHash: envelope.normalizedStateHash,
    diagnostics: envelope.diagnostics
  };
}

function isAutomaticRunStartBoundary(kind: StateEnvelope["currentState"]["context"]["kind"]): boolean {
  // Finishing the current run's game-over UI is part of that run. The hard
  // boundary is the top-level menu, before any continue/new-run action.
  return kind === "menu";
}

function result(
  decisionId: string,
  outcome: DecisionOutcome,
  state: StateEnvelope["currentState"] | undefined,
  selectedActionId: string | undefined,
  shouldStopRun: boolean,
  stopReason?: TickResult["stopReason"]
): TickResult {
  return {
    decisionId,
    outcome,
    ...(state ? {
      contextKind: state.context.kind,
      surfaceKind: state.surface.kind,
      actionAuthority: state.actionAuthority
    } : {}),
    ...(selectedActionId ? { selectedActionId } : {}),
    ...(stopReason ? { stopReason } : {}),
    shouldStopRun
  };
}

function createDecisionId(tick: number): string {
  return `decision-${String(tick).padStart(6, "0")}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeError(error: unknown): string {
  return (error instanceof Error ? error.message : String(error))
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9._~+/=-]+/gu, "sk-[REDACTED]")
    .slice(0, 500);
}
