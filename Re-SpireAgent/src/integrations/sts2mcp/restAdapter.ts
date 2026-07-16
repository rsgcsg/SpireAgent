import type { ExecutableGameAction } from "../../domain/actions/action.js";
import type { AdapterDescriptor, GameAdapter, GameExecutionResult } from "../../game-io/adapter.js";
import { isJsonObject, type JsonObject } from "../../shared/json.js";
import { serializeSts2McpAction } from "./actionSerializer.js";
import type { Sts2McpRawState } from "./rawState.js";

export interface McpExecutionResult extends GameExecutionResult {
  response: JsonObject;
}

export class Sts2McpRestAdapter implements GameAdapter<Sts2McpRawState, ExecutableGameAction, McpExecutionResult> {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  describe(): AdapterDescriptor {
    return {
      adapterId: "sts2mcp-rest",
      endpoint: this.baseUrl,
      capabilities: {
        canReadState: true,
        canExecuteActions: true,
        canListLegalActions: false,
        actionResults: "partial"
      }
    };
  }

  async readCurrentState(): Promise<Sts2McpRawState> {
    const url = `${this.baseUrl}/api/v1/singleplayer?format=json`;
    const response = await this.request(url, { method: "GET" });
    const body = await parseJsonResponse(response, `GET ${url}`);
    if (!isJsonObject(body)) throw new Error(`GET ${url} returned a non-object JSON state`);
    return body;
  }

  async execute(action: ExecutableGameAction): Promise<McpExecutionResult> {
    const url = `${this.baseUrl}/api/v1/singleplayer`;
    const response = await this.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serializeSts2McpAction(action))
    });
    const body = await parseJsonResponse(response, `POST ${url}`);
    if (!isJsonObject(body)) throw new Error(`POST ${url} returned a non-object JSON response`);
    if (body.status === "error" || typeof body.error === "string") {
      throw new Error(`MCP rejected action: ${safeMessage(body.message ?? body.error)}`);
    }
    return { accepted: true, outcome: "accepted", response: body };
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(url, { ...init, signal: controller.signal });
      if (!response.ok) throw new Error(`${init.method ?? "GET"} ${url} failed with HTTP ${response.status}`);
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`${init.method ?? "GET"} ${url} timed out after ${this.timeoutMs}ms`);
      }
      throw new Error(`${init.method ?? "GET"} ${url} failed: ${safeMessage(error)}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function parseJsonResponse(response: Response, operation: string): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${operation} returned invalid JSON`);
  }
}

function safeMessage(value: unknown): string {
  const text = value instanceof Error ? value.message : String(value ?? "unknown error");
  return text
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9._~+/=-]+/gu, "sk-[REDACTED]")
    .slice(0, 400);
}
