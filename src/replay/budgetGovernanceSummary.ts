import type { JsonRecord } from "../domain/types.js";
import { isRecord } from "../agent/utils.js";

export interface BudgetGovernanceSummary {
  schemaVersion: number;
  policyName: "pre_p9_budget_governance_summary_v1";
  transitions: number;
  withGovernancePolicy: number;
  profileCounts: Record<string, number>;
  callBudgetStatusCounts: Record<string, number>;
  recoveryPolicyCounts: Record<string, number>;
  recoverySeparatedFromWorkspaceCompressionCounts: Record<string, number>;
  runBudgetStatusCounts: Record<string, number>;
  evidenceDecisionClassCounts: Record<string, number>;
  evidenceMixedRevisionAllowedCounts: Record<string, number>;
  evidenceMixedBudgetAllowedCounts: Record<string, number>;
  rolloutStageCounts: Record<string, number>;
  rolloutLiveAdditiveEnabledCounts: Record<string, number>;
  rolloutHumanAuthorizationRequiredCounts: Record<string, number>;
  protectedStableMemoryWritesAllowedCounts: Record<string, number>;
  protectedDerivedKnowledgeWritesAllowedCounts: Record<string, number>;
  protectedStrategyParamWritesAllowedCounts: Record<string, number>;
  protectedPathReasonCounts: Record<string, number>;
  providerRecoveryPolicyCounts: Record<string, number>;
  providerRecoveryOutputCapRelationCounts: Record<string, number>;
  accountingNotAuthorization: true;
  p9BudgetPolicyProposalOnly: true;
  runtimeBudgetOsDeferredTo: "P13";
}

export function buildBudgetGovernanceSummary(transitions: JsonRecord[]): BudgetGovernanceSummary {
  const summary: BudgetGovernanceSummary = {
    schemaVersion: 1,
    policyName: "pre_p9_budget_governance_summary_v1",
    transitions: transitions.length,
    withGovernancePolicy: 0,
    profileCounts: {},
    callBudgetStatusCounts: {},
    recoveryPolicyCounts: {},
    recoverySeparatedFromWorkspaceCompressionCounts: {},
    runBudgetStatusCounts: {},
    evidenceDecisionClassCounts: {},
    evidenceMixedRevisionAllowedCounts: {},
    evidenceMixedBudgetAllowedCounts: {},
    rolloutStageCounts: {},
    rolloutLiveAdditiveEnabledCounts: {},
    rolloutHumanAuthorizationRequiredCounts: {},
    protectedStableMemoryWritesAllowedCounts: {},
    protectedDerivedKnowledgeWritesAllowedCounts: {},
    protectedStrategyParamWritesAllowedCounts: {},
    protectedPathReasonCounts: {},
    providerRecoveryPolicyCounts: {},
    providerRecoveryOutputCapRelationCounts: {},
    accountingNotAuthorization: true,
    p9BudgetPolicyProposalOnly: true,
    runtimeBudgetOsDeferredTo: "P13"
  };

  for (const transition of transitions) {
    const policy = transitionGovernancePolicy(transition);
    if (policy) {
      summary.withGovernancePolicy += 1;
      countString(summary.profileCounts, policy.profile);

      const callBudget = isRecord(policy.callBudget) ? policy.callBudget : undefined;
      countString(summary.callBudgetStatusCounts, callBudget?.status);

      const recoveryBudget = isRecord(policy.recoveryBudget) ? policy.recoveryBudget : undefined;
      countString(summary.recoveryPolicyCounts, recoveryBudget?.policy);
      countBoolean(summary.recoverySeparatedFromWorkspaceCompressionCounts, recoveryBudget?.separatedFromWorkspaceCompression);

      const runBudget = isRecord(policy.runBudget) ? policy.runBudget : undefined;
      countString(summary.runBudgetStatusCounts, runBudget?.status);

      const evidenceBudget = isRecord(policy.evidenceBudget) ? policy.evidenceBudget : undefined;
      countString(summary.evidenceDecisionClassCounts, evidenceBudget?.decisionClass);
      countBoolean(summary.evidenceMixedRevisionAllowedCounts, evidenceBudget?.mixedRevisionWindowAllowedForPromotion);
      countBoolean(summary.evidenceMixedBudgetAllowedCounts, evidenceBudget?.mixedBudgetWindowAllowedForPromotion);

      const rolloutBudget = isRecord(policy.rolloutBudget) ? policy.rolloutBudget : undefined;
      countString(summary.rolloutStageCounts, rolloutBudget?.stage);
      countBoolean(summary.rolloutLiveAdditiveEnabledCounts, rolloutBudget?.liveAdditiveEnabled);
      countBoolean(summary.rolloutHumanAuthorizationRequiredCounts, rolloutBudget?.promotionRequiresHumanAuthorization);

      const protectedPathBudget = isRecord(policy.protectedPathBudget) ? policy.protectedPathBudget : undefined;
      countBoolean(summary.protectedStableMemoryWritesAllowedCounts, protectedPathBudget?.stableMemoryWritesAllowed);
      countBoolean(summary.protectedDerivedKnowledgeWritesAllowedCounts, protectedPathBudget?.derivedKnowledgeWritesAllowed);
      countBoolean(summary.protectedStrategyParamWritesAllowedCounts, protectedPathBudget?.strategyParamWritesAllowed);
      if (Array.isArray(protectedPathBudget?.protectedPathReasons)) {
        for (const reason of protectedPathBudget.protectedPathReasons) countString(summary.protectedPathReasonCounts, reason);
      }
    } else {
      const budget = transitionBudget(transition);
      countString(summary.profileCounts, budget?.governanceProfile);
    }

    const providerRecovery = transitionProviderRecoveryPolicy(transition);
    if (providerRecovery) {
      countString(summary.providerRecoveryPolicyCounts, providerRecovery.policyName);
      countString(summary.providerRecoveryOutputCapRelationCounts, providerRecovery.rescueOutputCapRelation);
    }
  }

  return summary;
}

export function formatBudgetGovernanceSummary(summary: BudgetGovernanceSummary): string {
  return [
    `policy=${summary.policyName}`,
    `transitions=${summary.transitions}`,
    `withGovernancePolicy=${summary.withGovernancePolicy}`,
    `profiles=${JSON.stringify(summary.profileCounts)}`,
    `callStatus=${JSON.stringify(summary.callBudgetStatusCounts)}`,
    `recoveryPolicy=${JSON.stringify(summary.recoveryPolicyCounts)}`,
    `recoverySeparatedFromCompression=${JSON.stringify(summary.recoverySeparatedFromWorkspaceCompressionCounts)}`,
    `runStatus=${JSON.stringify(summary.runBudgetStatusCounts)}`,
    `evidenceClasses=${JSON.stringify(summary.evidenceDecisionClassCounts)}`,
    `evidenceMixedRevisionAllowed=${JSON.stringify(summary.evidenceMixedRevisionAllowedCounts)}`,
    `evidenceMixedBudgetAllowed=${JSON.stringify(summary.evidenceMixedBudgetAllowedCounts)}`,
    `rolloutStage=${JSON.stringify(summary.rolloutStageCounts)}`,
    `liveAdditiveEnabled=${JSON.stringify(summary.rolloutLiveAdditiveEnabledCounts)}`,
    `humanAuthorizationRequired=${JSON.stringify(summary.rolloutHumanAuthorizationRequiredCounts)}`,
    `protectedStableMemoryWritesAllowed=${JSON.stringify(summary.protectedStableMemoryWritesAllowedCounts)}`,
    `protectedDerivedKnowledgeWritesAllowed=${JSON.stringify(summary.protectedDerivedKnowledgeWritesAllowedCounts)}`,
    `protectedStrategyParamWritesAllowed=${JSON.stringify(summary.protectedStrategyParamWritesAllowedCounts)}`,
    `protectedReasons=${JSON.stringify(summary.protectedPathReasonCounts)}`,
    `providerRecovery=${JSON.stringify(summary.providerRecoveryPolicyCounts)}`,
    `rescueCapRelation=${JSON.stringify(summary.providerRecoveryOutputCapRelationCounts)}`,
    `accountingNotAuthorization=${summary.accountingNotAuthorization}`,
    `p9BudgetPolicyProposalOnly=${summary.p9BudgetPolicyProposalOnly}`,
    `runtimeBudgetOsDeferredTo=${summary.runtimeBudgetOsDeferredTo}`
  ].join(" ");
}

function transitionGovernancePolicy(transition: JsonRecord): JsonRecord | undefined {
  const budget = transitionBudget(transition);
  return isRecord(budget?.governancePolicy) ? budget.governancePolicy : undefined;
}

function transitionBudget(transition: JsonRecord): JsonRecord | undefined {
  const comparison = isRecord(transition.workspaceComparison) ? transition.workspaceComparison : undefined;
  return isRecord(comparison?.budget) ? comparison.budget : undefined;
}

function transitionProviderRecoveryPolicy(transition: JsonRecord): JsonRecord | undefined {
  const shadow = isRecord(transition.shadowWorkspaceDecision) ? transition.shadowWorkspaceDecision : undefined;
  return isRecord(shadow?.providerRecoveryPolicy) ? shadow.providerRecoveryPolicy : undefined;
}

function countString(counts: Record<string, number>, value: unknown): void {
  if (typeof value !== "string" || value.length === 0) return;
  counts[value] = (counts[value] ?? 0) + 1;
}

function countBoolean(counts: Record<string, number>, value: unknown): void {
  if (typeof value !== "boolean") return;
  const key = String(value);
  counts[key] = (counts[key] ?? 0) + 1;
}
