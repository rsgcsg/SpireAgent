import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { config as loadDotEnv } from "dotenv";

/** Stable for both `tsx src/...` and compiled `dist/...` entrypoints. */
export const RE_PROJECT_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));

export interface RuntimeConfig {
  mcp: {
    mode: "he_assisted" | "he_pure";
    baseUrl: string;
    timeoutMs: number;
    startupWaitMs: number;
    startupPollMs: number;
    commandPollMs: number;
    commandTimeoutMs: number;
  };
  deepseek: {
    apiKey: string;
    baseUrl: string;
    model: string;
    timeoutMs: number;
    maxOutputTokens: number;
    thinkingMode: "enabled" | "disabled";
  };
  runtime: {
    dataDir: string;
    agentSourceRevision?: string;
    agentSourceDigest?: string;
    agentWorktreeStatus?: "clean" | "dirty";
    evidenceProvenance: "unrecorded" | "ordinary_gameplay" | "operator_positioned" | "console_assisted" | "fixture";
    maxTicks: number;
    tickDelayMs: number;
    settlementPollMs: number;
    settlementTimeoutMs: number;
    endTurnSettlementTimeoutMs: number;
    roomTransitionSettlementTimeoutMs: number;
  };
}

export function loadEnvironment(projectRoot = RE_PROJECT_ROOT): void {
  loadDotEnv({ path: resolve(projectRoot, ".env.local"), override: false, quiet: true });
  loadDotEnv({ path: resolve(projectRoot, ".env"), override: false, quiet: true });
}

export function readRuntimeConfig(env: NodeJS.ProcessEnv = process.env, projectRoot = RE_PROJECT_ROOT): RuntimeConfig {
  const thinkingMode = env.DEEPSEEK_THINKING_MODE ?? "disabled";
  if (thinkingMode !== "enabled" && thinkingMode !== "disabled") {
    throw new Error("DEEPSEEK_THINKING_MODE must be enabled or disabled");
  }
  if (env.STS2_MCP_PROTOCOL !== undefined && env.STS2_MCP_PROTOCOL !== "he") {
    throw new Error("Re-SpireAgent uses Human-Equivalent C; STS2_MCP_PROTOCOL may only be he");
  }
  const humanMode = env.SPIREAGENT_HE_MODE ?? "he_assisted";
  if (humanMode !== "he_assisted" && humanMode !== "he_pure") {
    throw new Error("SPIREAGENT_HE_MODE must be he_assisted or he_pure");
  }
  const evidenceProvenance = env.AGENT_EVIDENCE_PROVENANCE ?? "unrecorded";
  if (!isEvidenceProvenance(evidenceProvenance)) {
    throw new Error(
      "AGENT_EVIDENCE_PROVENANCE must be unrecorded, ordinary_gameplay, operator_positioned, console_assisted, or fixture"
    );
  }
  const agentSourceRevision = optionalGitRevision(env.SPIREAGENT_RE_SOURCE_REVISION);
  const agentSourceDigest = optionalSha256(env.SPIREAGENT_RE_SOURCE_DIGEST, "SPIREAGENT_RE_SOURCE_DIGEST");
  const agentWorktreeStatus = optionalWorktreeStatus(env.SPIREAGENT_RE_WORKTREE_STATUS);
  const sourceIdentityFieldCount = [agentSourceRevision, agentSourceDigest, agentWorktreeStatus]
    .filter((value) => value !== undefined).length;
  if (sourceIdentityFieldCount !== 0 && sourceIdentityFieldCount !== 3) {
    throw new Error("Re source revision, digest, and worktree status must be recorded together");
  }

  return {
    mcp: {
      mode: humanMode,
      baseUrl: stripTrailingSlash(env.STS2_API_URL ?? "http://localhost:15526"),
      timeoutMs: positiveInteger(env.STS2_MCP_TIMEOUT_MS, 5_000, "STS2_MCP_TIMEOUT_MS"),
      startupWaitMs: nonNegativeInteger(
        env.STS2_MCP_STARTUP_WAIT_MS,
        60_000,
        "STS2_MCP_STARTUP_WAIT_MS"
      ),
      startupPollMs: positiveInteger(
        env.STS2_MCP_STARTUP_POLL_MS,
        500,
        "STS2_MCP_STARTUP_POLL_MS"
      ),
      commandPollMs: positiveInteger(
        env.STS2_HE_ACTION_POLL_MS,
        75,
        "STS2_HE_ACTION_POLL_MS"
      ),
      commandTimeoutMs: positiveInteger(
        env.STS2_HE_ACTION_TIMEOUT_MS,
        12_000,
        "STS2_HE_ACTION_TIMEOUT_MS"
      )
    },
    deepseek: {
      apiKey: env.DEEPSEEK_API_KEY ?? env.STS2_DEEPSEEK_API_KEY ?? "",
      baseUrl: env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/chat/completions",
      model: env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
      timeoutMs: positiveInteger(env.DEEPSEEK_TIMEOUT_MS, 30_000, "DEEPSEEK_TIMEOUT_MS"),
      maxOutputTokens: positiveInteger(env.DEEPSEEK_MAX_OUTPUT_TOKENS, 320, "DEEPSEEK_MAX_OUTPUT_TOKENS"),
      thinkingMode
    },
    runtime: {
      dataDir: resolve(projectRoot, env.AGENT_DATA_DIR ?? "data/runs"),
      ...(agentSourceRevision ? { agentSourceRevision } : {}),
      ...(agentSourceDigest ? { agentSourceDigest } : {}),
      ...(agentWorktreeStatus ? { agentWorktreeStatus } : {}),
      evidenceProvenance,
      maxTicks: positiveInteger(env.AGENT_MAX_TICKS, 1_000, "AGENT_MAX_TICKS"),
      tickDelayMs: nonNegativeInteger(env.AGENT_TICK_DELAY_MS, 250, "AGENT_TICK_DELAY_MS"),
      settlementPollMs: positiveInteger(env.AGENT_SETTLEMENT_POLL_MS, 150, "AGENT_SETTLEMENT_POLL_MS"),
      settlementTimeoutMs: positiveInteger(env.AGENT_SETTLEMENT_TIMEOUT_MS, 3_000, "AGENT_SETTLEMENT_TIMEOUT_MS"),
      endTurnSettlementTimeoutMs: positiveInteger(
        env.AGENT_END_TURN_SETTLEMENT_TIMEOUT_MS,
        8_000,
        "AGENT_END_TURN_SETTLEMENT_TIMEOUT_MS"
      ),
      roomTransitionSettlementTimeoutMs: positiveInteger(
        env.AGENT_ROOM_TRANSITION_SETTLEMENT_TIMEOUT_MS,
        8_000,
        "AGENT_ROOM_TRANSITION_SETTLEMENT_TIMEOUT_MS"
      )
    }
  };
}

function optionalGitRevision(value: string | undefined): string | undefined {
  if (value === undefined || value.length === 0) return undefined;
  if (!/^[0-9a-f]{40}$/u.test(value)) {
    throw new Error("SPIREAGENT_RE_SOURCE_REVISION must be a lowercase 40-character Git commit");
  }
  return value;
}

function optionalSha256(value: string | undefined, name: string): string | undefined {
  if (value === undefined || value.length === 0) return undefined;
  if (!/^[0-9a-f]{64}$/u.test(value)) throw new Error(`${name} must be a lowercase SHA-256 digest`);
  return value;
}

function optionalWorktreeStatus(value: string | undefined): "clean" | "dirty" | undefined {
  if (value === undefined || value.length === 0) return undefined;
  if (value !== "clean" && value !== "dirty") {
    throw new Error("SPIREAGENT_RE_WORKTREE_STATUS must be clean or dirty");
  }
  return value;
}

function isEvidenceProvenance(value: string): value is RuntimeConfig["runtime"]["evidenceProvenance"] {
  return ["unrecorded", "ordinary_gameplay", "operator_positioned", "console_assisted", "fixture"].includes(value);
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/u, "");
}

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function nonNegativeInteger(value: string | undefined, fallback: number, name: string): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative integer`);
  return parsed;
}
