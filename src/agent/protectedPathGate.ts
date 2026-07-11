import type { JsonRecord } from "../domain/types.js";

export const PROTECTED_PATH_LIVE_MEMORY_UPDATES_FLAG = "STS2_ALLOW_LIVE_LLM_MEMORY_UPDATES";
export const PROTECTED_PATH_LEGACY_FINALIZE_FLAG = "STS2_ENABLE_LEGACY_FINALIZE_STABLE_WRITES";

export const PROTECTED_STABLE_WRITE_TARGETS = [
  "memory",
  "derived_knowledge",
  "strategy_params",
  "skills",
  "prompt_policy",
  "budget_policy",
  "candidate_templates",
  "classification_policy",
  "scaffold_policy"
] as const;

export type ProtectedStableWriteTarget = typeof PROTECTED_STABLE_WRITE_TARGETS[number];

export const LIVE_LLM_PROTECTED_WRITE_TARGETS: ProtectedStableWriteTarget[] = [...PROTECTED_STABLE_WRITE_TARGETS];

export const LEGACY_FINALIZE_PROTECTED_WRITE_TARGETS: ProtectedStableWriteTarget[] = [
  "memory",
  "strategy_params"
];

export const PROTECTED_STABLE_WRITE_ORIGINS = [
  "live_llm",
  "legacy_finalize",
  "p9_stable_promotion",
  "shadow_experiment",
  "runtime_reflection"
] as const;

export type ProtectedStableWriteOrigin = typeof PROTECTED_STABLE_WRITE_ORIGINS[number];

export interface ProtectedPathGateDecision {
  allowed: boolean;
  reasons: string[];
  gate: "live_llm_stable_writes" | "legacy_finalize_stable_writes" | "p9_stable_promotion" | "shadow_experiment_stable_writes" | "runtime_reflection_stable_writes";
  origin: ProtectedStableWriteOrigin;
  flag: string;
  attemptedTargets: ProtectedStableWriteTarget[];
  protectedTargets: ProtectedStableWriteTarget[];
}

export function evaluateLiveLlmMemoryUpdateGate(env: NodeJS.ProcessEnv = process.env): ProtectedPathGateDecision {
  return evaluateLiveLlmStableWriteGate({ attemptedTargets: ["memory"], env });
}

export function evaluateLiveLlmStableWriteGate(input: {
  attemptedTargets?: ProtectedStableWriteTarget[];
  env?: NodeJS.ProcessEnv;
} = {}): ProtectedPathGateDecision {
  return evaluateProtectedStableWriteAuthorization({
    origin: "live_llm",
    attemptedTargets: input.attemptedTargets,
    env: input.env
  });
}

export function evaluateLegacyFinalizeStableWriteGate(env: NodeJS.ProcessEnv = process.env): ProtectedPathGateDecision {
  return evaluateProtectedStableWriteAuthorization({ origin: "legacy_finalize", env });
}

/**
 * The only authorization boundary for all protected stable-write intent.
 * Future P9 origins are deliberately deny-only until G3 is explicitly built.
 */
export function evaluateProtectedStableWriteAuthorization(input: {
  origin: ProtectedStableWriteOrigin;
  attemptedTargets?: ProtectedStableWriteTarget[];
  env?: NodeJS.ProcessEnv;
}): ProtectedPathGateDecision {
  const env = input.env ?? process.env;
  const attemptedTargets = normalizeTargets(input.attemptedTargets ?? targetsForOrigin(input.origin));
  if (input.origin === "live_llm") {
    const enabled = isEnabled(env[PROTECTED_PATH_LIVE_MEMORY_UPDATES_FLAG]);
    return buildDecision({
      allowed: enabled,
      reasons: enabled ? [] : attemptedTargets.map(liveLlmBlockedReason),
      gate: "live_llm_stable_writes",
      origin: input.origin,
      flag: PROTECTED_PATH_LIVE_MEMORY_UPDATES_FLAG,
      attemptedTargets,
      protectedTargets: LIVE_LLM_PROTECTED_WRITE_TARGETS
    });
  }
  if (input.origin === "legacy_finalize") {
    const enabled = isEnabled(env[PROTECTED_PATH_LEGACY_FINALIZE_FLAG]);
    return buildDecision({
      allowed: enabled,
      reasons: enabled ? [] : ["legacy_finalize_stable_writes_blocked_by_default"],
      gate: "legacy_finalize_stable_writes",
      origin: input.origin,
      flag: PROTECTED_PATH_LEGACY_FINALIZE_FLAG,
      attemptedTargets,
      protectedTargets: LEGACY_FINALIZE_PROTECTED_WRITE_TARGETS
    });
  }
  const policy = futureOriginPolicy(input.origin);
  return buildDecision({
    allowed: false,
    reasons: [policy.reason],
    gate: policy.gate,
    origin: input.origin,
    flag: "not_available",
    attemptedTargets,
    protectedTargets: LIVE_LLM_PROTECTED_WRITE_TARGETS
  });
}

export function protectedPathGateSnapshot(env: NodeJS.ProcessEnv = process.env): JsonRecord {
  return {
    schemaVersion: 1,
    stableWriteTargets: [...PROTECTED_STABLE_WRITE_TARGETS],
    stableWriteOrigins: [...PROTECTED_STABLE_WRITE_ORIGINS],
    liveLlmMemoryUpdates: {
      ...evaluateLiveLlmMemoryUpdateGate(env)
    },
    liveLlmStableWrites: {
      ...evaluateLiveLlmStableWriteGate({ env })
    },
    legacyFinalizeStableWrites: {
      ...evaluateLegacyFinalizeStableWriteGate(env)
    },
    p9StablePromotion: {
      ...evaluateProtectedStableWriteAuthorization({ origin: "p9_stable_promotion", env })
    },
    shadowExperimentStableWrites: {
      ...evaluateProtectedStableWriteAuthorization({ origin: "shadow_experiment", env })
    },
    runtimeReflectionStableWrites: {
      ...evaluateProtectedStableWriteAuthorization({ origin: "runtime_reflection", env })
    }
  };
}

function buildDecision(decision: ProtectedPathGateDecision): ProtectedPathGateDecision {
  return decision;
}

function normalizeTargets(targets: ProtectedStableWriteTarget[]): ProtectedStableWriteTarget[] {
  return [...new Set(targets)].filter((target) => PROTECTED_STABLE_WRITE_TARGETS.includes(target));
}

function targetsForOrigin(origin: ProtectedStableWriteOrigin): ProtectedStableWriteTarget[] {
  return origin === "legacy_finalize" ? LEGACY_FINALIZE_PROTECTED_WRITE_TARGETS : LIVE_LLM_PROTECTED_WRITE_TARGETS;
}

function futureOriginPolicy(origin: Exclude<ProtectedStableWriteOrigin, "live_llm" | "legacy_finalize">): {
  gate: ProtectedPathGateDecision["gate"];
  reason: string;
} {
  switch (origin) {
    case "p9_stable_promotion":
      return { gate: "p9_stable_promotion", reason: "p9_stable_promotion_not_implemented" };
    case "shadow_experiment":
      return { gate: "shadow_experiment_stable_writes", reason: "shadow_experiment_stable_writes_forbidden" };
    case "runtime_reflection":
      return { gate: "runtime_reflection_stable_writes", reason: "runtime_reflection_stable_writes_forbidden" };
  }
}

function liveLlmBlockedReason(target: ProtectedStableWriteTarget): string {
  if (target === "memory") return "live_llm_memory_updates_blocked_by_default";
  return `live_llm_${target}_blocked_by_default`;
}

function isEnabled(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "TRUE";
}
