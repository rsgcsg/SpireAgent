import type { JsonRecord } from "../domain/types.js";

export interface P8RolloutBudgetAssessmentInput {
  status: string;
  reasons: string[];
  recommendedFirstLiveWhitelist: string[];
  blockedDecisionClasses: string[];
  evidenceBudget?: JsonRecord;
}

export function buildP8RolloutBudgetAssessment(input: P8RolloutBudgetAssessmentInput): JsonRecord {
  const ready = input.status.startsWith("READY_FOR_P8_5_LIVE");
  return {
    schemaVersion: 1,
    policyName: "p8_live_additive_rollout_budget_v1",
    stage: ready ? "live_additive_candidate" : "shadow_readiness_blocked",
    firstLiveMode: "additive_legacy_prompt_plus_compact_workspace_summary",
    recommendedFirstLiveWhitelist: input.recommendedFirstLiveWhitelist,
    blockedDecisionClasses: input.blockedDecisionClasses,
    blockers: input.reasons,
    explicitLiveFlagRequired: true,
    humanAuthorizationRequired: true,
    rollbackRequired: true,
    structuredPromptOnlyDefaultAllowed: false,
    shadowDecisionExecutes: false,
    stableMemoryWritesAllowed: false,
    derivedKnowledgeWritesAllowed: false,
    strategyParamWritesAllowed: false,
    evidenceWindowStatus: typeof input.evidenceBudget?.status === "string" ? input.evidenceBudget.status : "unknown",
    promotionAllowedByBudget: ready && input.recommendedFirstLiveWhitelist.length > 0
  };
}
