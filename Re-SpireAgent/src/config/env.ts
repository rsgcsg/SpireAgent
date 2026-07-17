import { resolve } from "node:path";
import { config as loadDotEnv } from "dotenv";

export interface RuntimeConfig {
  mcp: {
    baseUrl: string;
    timeoutMs: number;
    protocolMode: "auto" | "v1" | "v2";
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
    maxTicks: number;
    tickDelayMs: number;
    settlementPollMs: number;
    settlementTimeoutMs: number;
    endTurnSettlementTimeoutMs: number;
    roomTransitionSettlementTimeoutMs: number;
  };
}

export function loadEnvironment(cwd = process.cwd()): void {
  loadDotEnv({ path: resolve(cwd, ".env.local"), override: false, quiet: true });
  loadDotEnv({ path: resolve(cwd, ".env"), override: false, quiet: true });
}

export function readRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const thinkingMode = env.DEEPSEEK_THINKING_MODE ?? "disabled";
  if (thinkingMode !== "enabled" && thinkingMode !== "disabled") {
    throw new Error("DEEPSEEK_THINKING_MODE must be enabled or disabled");
  }
  const protocolMode = env.STS2_MCP_PROTOCOL ?? "auto";
  if (protocolMode !== "auto" && protocolMode !== "v1" && protocolMode !== "v2") {
    throw new Error("STS2_MCP_PROTOCOL must be auto, v1, or v2");
  }

  return {
    mcp: {
      baseUrl: stripTrailingSlash(env.STS2_API_URL ?? "http://localhost:15526"),
      timeoutMs: positiveInteger(env.STS2_MCP_TIMEOUT_MS, 5_000, "STS2_MCP_TIMEOUT_MS"),
      protocolMode,
      commandPollMs: positiveInteger(env.STS2_MCP_V2_COMMAND_POLL_MS, 75, "STS2_MCP_V2_COMMAND_POLL_MS"),
      commandTimeoutMs: positiveInteger(env.STS2_MCP_V2_COMMAND_TIMEOUT_MS, 12_000, "STS2_MCP_V2_COMMAND_TIMEOUT_MS")
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
      dataDir: resolve(env.AGENT_DATA_DIR ?? "data/runs"),
      maxTicks: positiveInteger(env.AGENT_MAX_TICKS, 100, "AGENT_MAX_TICKS"),
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
