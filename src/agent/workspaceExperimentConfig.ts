export const P8_WORKSPACE_SHADOW_FLAG = "STS2_P8_WORKSPACE_SHADOW";
export const P8_WORKSPACE_CALL_FLAG = "STS2_P8_WORKSPACE_CALL";
export const P8_DEEPSEEK_API_KEY_FLAG = "STS2_DEEPSEEK_API_KEY";
export const P8_DEEPSEEK_MODEL_FLAG = "STS2_DEEPSEEK_MODEL";
export const P8_LIVE_ADDITIVE_FLAG = "STS2_P8_LIVE_ADDITIVE";
export const P8_LIVE_DECISION_CLASSES_FLAG = "STS2_P8_LIVE_DECISION_CLASSES";
export const P8_WORKSPACE_ABLATION_MODE_FLAG = "STS2_P8_WORKSPACE_ABLATION_MODE";
export const P8_WORKSPACE_REVISION = "2026-07-03-output-contract-v5.1.5-high-pressure-recovery";
export const WORKSPACE_REASON_BRIEF_MAX_WORDS = 16;

export type WorkspaceAblationMode = "full" | "full_bounded_candidate_futures" | "compact" | "ultra_compact";

export function normalizeWorkspaceAblationMode(value: unknown): WorkspaceAblationMode {
  if (typeof value !== "string") return "full";
  const normalized = value.trim().toLowerCase().replace(/-/g, "_");
  if (normalized === "full_bounded_candidate_futures" || normalized === "bounded" || normalized === "bounded_candidate_futures") {
    return "full_bounded_candidate_futures";
  }
  if (normalized === "compact") return "compact";
  if (normalized === "ultra" || normalized === "ultra_compact" || normalized === "ultracompact") return "ultra_compact";
  return "full";
}

export function workspaceAblationModeFromEnv(): WorkspaceAblationMode {
  return normalizeWorkspaceAblationMode(process.env[P8_WORKSPACE_ABLATION_MODE_FLAG]);
}
