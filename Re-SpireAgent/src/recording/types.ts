import type { AllowedAction } from "../domain/actions/allowedAction.js";
import type { ExecutableGameAction } from "../domain/actions/action.js";
import type { NormalizedCurrentState } from "../domain/state/index.js";
import type { NormalizationDiagnostics } from "../normalization/diagnostics.js";
import type { PromptBundle } from "../prompting/promptBuilder.js";
import type { LlmDecisionSession } from "../llm/types.js";
import type { JsonValue } from "../shared/json.js";

export type DecisionOutcome =
  | "observation_failed"
  | "not_executed_invalid_state"
  | "not_executed_non_actionable_state"
  | "not_executed_no_actions"
  | "dry_run"
  | "not_executed_llm_failure"
  | "not_executed_invalid_decision"
  | "not_executed_stale_state"
  | "execution_failed"
  | "executed_and_settled"
  | "executed_checkpoint_pending"
  | "executed_unsettled";

export interface RecordedState {
  rawStateRef: string;
  normalizedState: NormalizedCurrentState;
  stateHash: string;
  normalizedStateHash: string;
  diagnostics: NormalizationDiagnostics;
}

export interface DecisionRecord {
  /** v1 records remain replay-readable; v2 carries context/surface normalized state. */
  recordSchemaVersion: 1 | 2;
  decisionId: string;
  runId: string;
  tick: number;
  startedAt: string;
  completedAt: string;
  preState?: RecordedState;
  allowedActions: AllowedAction[];
  prompt?: {
    promptRef: string;
    globalPromptId: string;
    globalPromptVersion: number;
    stateGuideId: string;
    stateGuideVersion: number;
    systemPromptHash: string;
    userPromptHash: string;
    systemPromptBytes: number;
    userPromptBytes: number;
  };
  llm?: {
    provider: "deepseek";
    model: string;
    responseRef?: string;
    session: LlmDecisionSession;
    validation: {
      valid: boolean;
      outcome: "valid" | "provider_failure" | "unknown_action_id";
      error?: string;
    };
  };
  execution: {
    attempted: boolean;
    selectedActionId?: string;
    action?: ExecutableGameAction;
    stateHashMatchedBeforeExecution?: boolean;
    adapterResult?: JsonValue;
    error?: string;
  };
  settlement?: {
    status: "settled" | "timeout" | "read_error";
    polls: number;
    elapsedMs: number;
    error?: string;
    transientObservationErrors?: number;
    lastTransientObservationError?: {
      code: string;
      message: string;
    };
  };
  runtimeGuard?:
    | {
        code: "repeated_exact_transition";
        occurrence: number;
        preStateHash: string;
        postStateHash: string;
        selectedActionId: string;
      }
    | {
        code: "repeated_semantic_transition";
        occurrence: number;
        preProgressHash: string;
        postProgressHash: string;
        actionProgressHash: string;
        selectedActionId: string;
        selectedActionKind: string;
      };
  postState?: RecordedState;
  outcome: DecisionOutcome;
  error?: string;
}

export interface RunMetadata {
  metadataSchemaVersion: 1;
  runId: string;
  startedAt: string;
  agentVersion: string;
  adapter: {
    adapterId: string;
    adapterVersion?: string;
    endpoint: string;
    capabilities: Record<string, unknown>;
    negotiated?: JsonValue;
  };
  provider: {
    provider: "deepseek";
    model: string;
    thinkingMode: "enabled" | "disabled";
    maxOutputTokens: number;
  };
  evidence: {
    provenance: "unrecorded" | "ordinary_gameplay" | "operator_positioned" | "console_assisted" | "fixture";
    declaredBy: "runtime_configuration";
    qualificationUse: "coverage_only_unless_independently_reviewed";
  };
  schemas: {
    normalizedState: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21;
    prompt: 1 | 2 | 3;
    decisionRecord: 1 | 2;
  };
}

export interface PreparedEvidence {
  preState: RecordedState;
  prompt?: DecisionRecord["prompt"];
}

export interface DecisionRecorder {
  readonly runId: string;
  initialize(): Promise<void>;
  prepare(input: {
    decisionId: string;
    preRawState: JsonValue;
    normalizedState: NormalizedCurrentState;
    stateHash: string;
    normalizedStateHash: string;
    diagnostics: NormalizationDiagnostics;
    prompt?: PromptBundle;
  }): Promise<PreparedEvidence>;
  append(record: DecisionRecord, evidence?: { postRawState?: JsonValue }): Promise<void>;
}
