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

export interface ProtectedPathGateDecision {
  allowed: boolean;
  reasons: string[];
  gate: "live_llm_stable_writes" | "legacy_finalize_stable_writes";
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
  const env = input.env ?? process.env;
  const enabled = isEnabled(env[PROTECTED_PATH_LIVE_MEMORY_UPDATES_FLAG]);
  const attemptedTargets = normalizeTargets(input.attemptedTargets ?? LIVE_LLM_PROTECTED_WRITE_TARGETS);
  return enabled
    ? buildDecision({
      allowed: true,
      reasons: [],
      gate: "live_llm_stable_writes",
      flag: PROTECTED_PATH_LIVE_MEMORY_UPDATES_FLAG,
      attemptedTargets,
      protectedTargets: LIVE_LLM_PROTECTED_WRITE_TARGETS
    })
    : buildDecision({
      allowed: false,
      reasons: attemptedTargets.map(liveLlmBlockedReason),
      gate: "live_llm_stable_writes",
      flag: PROTECTED_PATH_LIVE_MEMORY_UPDATES_FLAG,
      attemptedTargets,
      protectedTargets: LIVE_LLM_PROTECTED_WRITE_TARGETS
    });
}

export function evaluateLegacyFinalizeStableWriteGate(env: NodeJS.ProcessEnv = process.env): ProtectedPathGateDecision {
  const enabled = isEnabled(env[PROTECTED_PATH_LEGACY_FINALIZE_FLAG]);
  return enabled
    ? buildDecision({
      allowed: true,
      reasons: [],
      gate: "legacy_finalize_stable_writes",
      flag: PROTECTED_PATH_LEGACY_FINALIZE_FLAG,
      attemptedTargets: LEGACY_FINALIZE_PROTECTED_WRITE_TARGETS,
      protectedTargets: LEGACY_FINALIZE_PROTECTED_WRITE_TARGETS
    })
    : buildDecision({
      allowed: false,
      reasons: ["legacy_finalize_stable_writes_blocked_by_default"],
      gate: "legacy_finalize_stable_writes",
      flag: PROTECTED_PATH_LEGACY_FINALIZE_FLAG,
      attemptedTargets: LEGACY_FINALIZE_PROTECTED_WRITE_TARGETS,
      protectedTargets: LEGACY_FINALIZE_PROTECTED_WRITE_TARGETS
    });
}

export function protectedPathGateSnapshot(env: NodeJS.ProcessEnv = process.env): JsonRecord {
  return {
    schemaVersion: 1,
    stableWriteTargets: [...PROTECTED_STABLE_WRITE_TARGETS],
    liveLlmMemoryUpdates: {
      ...evaluateLiveLlmMemoryUpdateGate(env)
    },
    liveLlmStableWrites: {
      ...evaluateLiveLlmStableWriteGate({ env })
    },
    legacyFinalizeStableWrites: {
      ...evaluateLegacyFinalizeStableWriteGate(env)
    }
  };
}

function buildDecision(decision: ProtectedPathGateDecision): ProtectedPathGateDecision {
  return decision;
}

function normalizeTargets(targets: ProtectedStableWriteTarget[]): ProtectedStableWriteTarget[] {
  return [...new Set(targets)].filter((target) => PROTECTED_STABLE_WRITE_TARGETS.includes(target));
}

function liveLlmBlockedReason(target: ProtectedStableWriteTarget): string {
  if (target === "memory") return "live_llm_memory_updates_blocked_by_default";
  return `live_llm_${target}_blocked_by_default`;
}

function isEnabled(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "TRUE";
}
