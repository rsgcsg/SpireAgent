import {
  decodeBridgeV2Capabilities,
  decodeBridgeV2Command,
  decodeBridgeV2Inspection,
  decodeBridgeV2ObservationBundle,
  decodeBridgeV2State,
  type DecodedBridgePayload,
  type BridgeV2Capabilities,
  type BridgeV2Command,
  type BridgeV2Inspection,
  type BridgeV2InspectionKind,
  type BridgeV2ObservationBundle,
  type BridgeV2State
} from "./bridgeV2Protocol.js";

export class BridgeV2HttpError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly errorCode?: string
  ) {
    super(message);
    this.name = "BridgeV2HttpError";
  }
}

export class BridgeV2RestClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async capabilities(): Promise<DecodedBridgePayload<BridgeV2Capabilities>> {
    const response = await this.request(`${this.baseUrl}/api/v2/capabilities`, { method: "GET" });
    if (!response.response.ok) throw httpError("Bridge v2 capabilities", response.response, response.value);
    return decodeBridgeV2Capabilities(response.value);
  }

  async state(): Promise<DecodedBridgePayload<BridgeV2State>> {
    const response = await this.request(`${this.baseUrl}/api/v2/state`, { method: "GET" });
    if (!response.response.ok) throw httpError("Bridge v2 state", response.response, response.value);
    return decodeBridgeV2State(response.value);
  }

  async inspect(
    kind: BridgeV2InspectionKind,
    expectedStateId: string
  ): Promise<DecodedBridgePayload<BridgeV2Inspection>> {
    const encodedKind = encodeURIComponent(kind);
    const encodedState = encodeURIComponent(expectedStateId);
    const response = await this.request(
      `${this.baseUrl}/api/v2/inspections/${encodedKind}?expected_state_id=${encodedState}`,
      { method: "GET" }
    );
    if (!response.response.ok) throw httpError(`Bridge v2 ${kind} inspection`, response.response, response.value);
    return decodeBridgeV2Inspection(response.value);
  }

  async observationBundle(
    expectedStateId: string,
    kinds: BridgeV2InspectionKind[]
  ): Promise<DecodedBridgePayload<BridgeV2ObservationBundle>> {
    const response = await this.request(`${this.baseUrl}/api/v2/observation-bundles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expected_state_id: expectedStateId,
        inspections: kinds.map((kind) => ({ kind }))
      })
    });
    if (!response.response.ok) {
      throw httpError("Bridge v2 coherent observation bundle", response.response, response.value);
    }
    return decodeBridgeV2ObservationBundle(response.value);
  }

  async submit(input: {
    requestId: string;
    expectedStateId: string;
    actionId: string;
  }): Promise<DecodedBridgePayload<BridgeV2Command>> {
    const response = await this.request(`${this.baseUrl}/api/v2/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: input.requestId,
        expected_state_id: input.expectedStateId,
        action_id: input.actionId
      })
    });
    return decodeBridgeV2Command(response.value);
  }

  async poll(requestId: string): Promise<DecodedBridgePayload<BridgeV2Command>> {
    const encoded = encodeURIComponent(requestId);
    const response = await this.request(`${this.baseUrl}/api/v2/commands/${encoded}`, { method: "GET" });
    return decodeBridgeV2Command(response.value);
  }

  private async request(url: string, init: RequestInit): Promise<{ response: Response; value: unknown }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(url, { ...init, signal: controller.signal });
      const text = await response.text();
      try {
        return { response, value: JSON.parse(text) as unknown };
      } catch {
        throw new BridgeV2HttpError(`${init.method ?? "GET"} ${url} returned invalid JSON`, response.status);
      }
    } catch (error) {
      if (error instanceof BridgeV2HttpError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new BridgeV2HttpError(`${init.method ?? "GET"} ${url} timed out after ${this.timeoutMs}ms`);
      }
      throw new BridgeV2HttpError(`${init.method ?? "GET"} ${url} failed: ${safeMessage(error)}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function httpError(operation: string, response: Response, body: unknown): BridgeV2HttpError {
  const detail = typeof body === "object" && body !== null ? JSON.stringify(body).slice(0, 300) : "no JSON error body";
  const errorCode = typeof body === "object"
      && body !== null
      && "error" in body
      && typeof body.error === "object"
      && body.error !== null
      && "code" in body.error
      && typeof body.error.code === "string"
    ? body.error.code
    : undefined;
  return new BridgeV2HttpError(
    `${operation} failed with HTTP ${response.status}: ${detail}`,
    response.status,
    errorCode
  );
}

function safeMessage(value: unknown): string {
  return (value instanceof Error ? value.message : String(value ?? "unknown error"))
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9._~+/=-]+/gu, "sk-[REDACTED]")
    .slice(0, 400);
}
