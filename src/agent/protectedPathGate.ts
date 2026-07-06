import type { JsonRecord } from "../domain/types.js";

export const PROTECTED_PATH_LIVE_MEMORY_UPDATES_FLAG = "STS2_ALLOW_LIVE_LLM_MEMORY_UPDATES";
export const PROTECTED_PATH_LEGACY_FINALIZE_FLAG = "STS2_ENABLE_LEGACY_FINALIZE_STABLE_WRITES";

export interface ProtectedPathGateDecision {
  allowed: boolean;
  reasons: string[];
}

export function evaluateLiveLlmMemoryUpdateGate(env: NodeJS.ProcessEnv = process.env): ProtectedPathGateDecision {
  const enabled = isEnabled(env[PROTECTED_PATH_LIVE_MEMORY_UPDATES_FLAG]);
  return enabled
    ? { allowed: true, reasons: [] }
    : { allowed: false, reasons: ["live_llm_memory_updates_blocked_by_default"] };
}

export function evaluateLegacyFinalizeStableWriteGate(env: NodeJS.ProcessEnv = process.env): ProtectedPathGateDecision {
  const enabled = isEnabled(env[PROTECTED_PATH_LEGACY_FINALIZE_FLAG]);
  return enabled
    ? { allowed: true, reasons: [] }
    : { allowed: false, reasons: ["legacy_finalize_stable_writes_blocked_by_default"] };
}

export function protectedPathGateSnapshot(env: NodeJS.ProcessEnv = process.env): JsonRecord {
  return {
    liveLlmMemoryUpdates: {
      flag: PROTECTED_PATH_LIVE_MEMORY_UPDATES_FLAG,
      ...evaluateLiveLlmMemoryUpdateGate(env)
    },
    legacyFinalizeStableWrites: {
      flag: PROTECTED_PATH_LEGACY_FINALIZE_FLAG,
      ...evaluateLegacyFinalizeStableWriteGate(env)
    }
  };
}

function isEnabled(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "TRUE";
}
