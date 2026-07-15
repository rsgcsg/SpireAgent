import type { AllowedAction } from "../domain/actions/allowedAction.js";
import type { ExecutableGameAction } from "../domain/actions/action.js";
import type { StateEnvelope } from "../domain/state/index.js";
import type { GameAdapter, GameExecutionResult, RawGameState } from "../game-io/adapter.js";
import { validateDecisionForActions } from "../llm/decisionSchema.js";
import type { LlmDecisionProvider } from "../llm/types.js";
import { buildDecisionPrompt } from "../prompting/promptBuilder.js";
import type { DecisionOutcome, DecisionRecord, DecisionRecorder, RecordedState } from "../recording/types.js";
import type { JsonValue } from "../shared/json.js";
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
  stateKind?: string;
  selectedActionId?: string;
  shouldStopRun: boolean;
}

export class TickOrchestrator {
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
      return result(decisionId, record.outcome, undefined, undefined, true);
    }

    const allowedActions = this.dependencies.buildAllowedActions(pre.currentState, pre.stateHash);
    if (pre.diagnostics.status === "invalid" || pre.currentState.stability === "invalid" || pre.currentState.kind === "unknown") {
      return this.recordWithoutDecision({
        decisionId,
        tick,
        startedAt,
        pre,
        allowedActions,
        outcome: "not_executed_invalid_state",
        error: pre.currentState.kind === "unknown" ? pre.currentState.unknown.reason : "Normalization diagnostics are invalid",
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
    if (options.stopAtRunBoundary && isRunBoundary(pre.currentState.kind)) {
      return this.recordWithoutDecision({
        decisionId,
        tick,
        startedAt,
        pre,
        allowedActions,
        outcome: "not_executed_non_actionable_state",
        error: `Stopped at ${pre.currentState.kind} run boundary; agent:run never starts or restarts a run automatically`,
        shouldStopRun: true
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
        error: `Actionable ${pre.currentState.kind} state produced no allowed actions`,
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
      return result(decisionId, record.outcome, pre.currentState.kind, undefined, false);
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
      return result(decisionId, record.outcome, pre.currentState.kind, undefined, true);
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
      return result(decisionId, record.outcome, pre.currentState.kind, undefined, true);
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
      return result(decisionId, record.outcome, pre.currentState.kind, validation.selectedAction.id, true);
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
      return result(decisionId, record.outcome, pre.currentState.kind, validation.selectedAction.id, false);
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
      return result(decisionId, record.outcome, pre.currentState.kind, validation.selectedAction.id, true);
    }

    const settlement = await this.dependencies.settlement.waitForNextState(pre, validation.selectedAction.action);
    const outcome = settlement.status === "settled" ? "executed_and_settled" : "executed_unsettled";
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
        ...(settlement.error ? { error: settlement.error } : {})
      },
      ...(settlement.error ? { error: settlement.error } : {})
    });
    await this.dependencies.recorder.append(record, settlement.after ? { postRawState: settlement.after.rawState } : undefined);
    return result(decisionId, record.outcome, pre.currentState.kind, validation.selectedAction.id, outcome !== "executed_and_settled");
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
    return result(input.decisionId, input.outcome, input.pre.currentState.kind, undefined, input.shouldStopRun);
  }
}

function baseRecord(runId: string, decisionId: string, tick: number, startedAt: string, outcome: DecisionOutcome): DecisionRecord {
  return {
    recordSchemaVersion: 1,
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

function isRunBoundary(kind: StateEnvelope["currentState"]["kind"]): boolean {
  return kind === "game_over" || kind === "menu";
}

function result(
  decisionId: string,
  outcome: DecisionOutcome,
  stateKind: string | undefined,
  selectedActionId: string | undefined,
  shouldStopRun: boolean
): TickResult {
  return {
    decisionId,
    outcome,
    ...(stateKind ? { stateKind } : {}),
    ...(selectedActionId ? { selectedActionId } : {}),
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
