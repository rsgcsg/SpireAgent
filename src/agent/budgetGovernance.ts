import type { BudgetGovernancePolicy, BudgetGovernanceProfileName } from "../domain/types.js";

export const BUDGET_GOVERNANCE_PROFILE_FLAG = "STS2_BUDGET_GOVERNANCE_PROFILE";

export type { BudgetGovernanceProfileName };

export interface BudgetGovernancePolicyInput {
  profile?: BudgetGovernanceProfileName;
  decisionClass: string;
  liveAdditiveEnabled: boolean;
  liveDecisionClassWhitelist: string[];
  maxShadowCalls: number;
  shadowCallsUsed: number;
  estimatedInputTokens: number;
  softInputTokenLimit: number;
  hardInputTokenLimit: number;
  maxOutputTokens: number;
  timeoutMs: number;
  retryLimit: number;
  estimatedCostUsd?: number;
  maxEstimatedCostUsd?: number;
  status: string;
  skippedReason?: string;
}

export function budgetGovernanceProfileFromEnv(): BudgetGovernanceProfileName {
  return normalizeBudgetGovernanceProfile(process.env[BUDGET_GOVERNANCE_PROFILE_FLAG]);
}

export function normalizeBudgetGovernanceProfile(value: unknown): BudgetGovernanceProfileName {
  if (typeof value !== "string") return "shadow_exploration";
  const normalized = value.trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "observe_only" || normalized === "observe") return "observe_only";
  if (normalized === "shadow_readiness" || normalized === "readiness") return "shadow_readiness";
  if (normalized === "live_additive_candidate" || normalized === "live_additive") return "live_additive_candidate";
  if (normalized === "protected_learning_preparation" || normalized === "learning_preparation") {
    return "protected_learning_preparation";
  }
  if (normalized === "stable_update_candidate" || normalized === "stable_update") return "stable_update_candidate";
  return "shadow_exploration";
}

export function buildBudgetGovernancePolicy(input: BudgetGovernancePolicyInput): BudgetGovernancePolicy {
  const profile = input.profile ?? "shadow_exploration";
  const liveClassWhitelisted = input.liveDecisionClassWhitelist.includes(input.decisionClass);
  const liveAdditiveProtected = profile === "live_additive_candidate" || input.liveAdditiveEnabled;
  const stableUpdateProtected = profile === "stable_update_candidate";
  const protectedPathReasons: string[] = [];
  if (liveAdditiveProtected && !input.liveAdditiveEnabled) protectedPathReasons.push("live_additive_flag_off");
  if (liveAdditiveProtected && !liveClassWhitelisted) protectedPathReasons.push("decision_class_not_whitelisted");
  if (stableUpdateProtected) protectedPathReasons.push("stable_update_not_implemented");

  return {
    schemaVersion: 1,
    profile,
    principle: "budget_is_guard_not_goal",
    callBudget: {
      estimatedInputTokens: input.estimatedInputTokens,
      softInputTokenLimit: input.softInputTokenLimit,
      hardInputTokenLimit: input.hardInputTokenLimit,
      maxOutputTokens: input.maxOutputTokens,
      timeoutMs: input.timeoutMs,
      status: input.status
    },
    recoveryBudget: {
      retryLimit: input.retryLimit,
      policy: "failure_class_specific_provider_recovery",
      separatedFromWorkspaceCompression: true
    },
    runBudget: {
      maxShadowCalls: input.maxShadowCalls,
      shadowCallsUsed: input.shadowCallsUsed,
      estimatedCostUsd: input.estimatedCostUsd,
      maxEstimatedCostUsd: input.maxEstimatedCostUsd,
      status: input.status,
      skippedReason: input.skippedReason
    },
    evidenceBudget: {
      decisionClass: input.decisionClass,
      freshnessRequired: true,
      mixedRevisionWindowAllowedForPromotion: false,
      mixedBudgetWindowAllowedForPromotion: false
    },
    rolloutBudget: {
      stage: input.liveAdditiveEnabled ? "live_additive_candidate" : "shadow_only",
      liveAdditiveEnabled: input.liveAdditiveEnabled,
      liveDecisionClassWhitelist: input.liveDecisionClassWhitelist,
      promotionRequiresHumanAuthorization: true
    },
    protectedPathBudget: {
      liveAdditiveRequiresExplicitFlag: true,
      stableMemoryWritesAllowed: false,
      derivedKnowledgeWritesAllowed: false,
      strategyParamWritesAllowed: false,
      protectedPathReasons
    }
  };
}
