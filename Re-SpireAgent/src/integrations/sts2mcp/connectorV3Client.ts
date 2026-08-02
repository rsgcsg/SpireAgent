import {
  decodeBridgeV2ClientRegistration,
  decodeBridgeV2ControllerLeaseResponse,
  decodeBridgeV2ControlSnapshot,
  type BridgeV2ClientRegistration,
  type BridgeV2ControllerLeaseResponse,
  type BridgeV2ControlSnapshot,
  type DecodedBridgePayload
} from "./bridgeV2Protocol.js";
import {
  decodeConnectorV3Capabilities,
  decodeConnectorV3Inspection,
  decodeConnectorV3Observation,
  decodeConnectorV3Receipt,
  type ConnectorV3Capabilities,
  type ConnectorV3Inspection,
  type ConnectorV3Observation,
  type ConnectorV3Receipt,
  type DecodedConnectorV3Payload
} from "./connectorV3Protocol.js";

export class ConnectorV3HttpError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly errorCode?: string
  ) {
    super(message);
    this.name = "ConnectorV3HttpError";
  }
}

export class ConnectorV3RestClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async capabilities(): Promise<DecodedConnectorV3Payload<ConnectorV3Capabilities>> {
    const response = await this.request(`${this.baseUrl}/api/v3/capabilities`, { method: "GET" });
    if (!response.response.ok) throw httpError("Connector v3 capabilities", response.response, response.value);
    return decodeConnectorV3Capabilities(response.value);
  }

  async observation(): Promise<DecodedConnectorV3Payload<ConnectorV3Observation>> {
    const response = await this.request(`${this.baseUrl}/api/v3/observation`, { method: "GET" });
    if (!response.response.ok) throw httpError("Connector v3 observation", response.response, response.value);
    return decodeConnectorV3Observation(response.value);
  }

  async inspection(
    kind: "run_deck" | "combat_piles" | "shop_catalog",
    expectedStateToken: string
  ): Promise<DecodedConnectorV3Payload<ConnectorV3Inspection>> {
    const response = await this.request(
      `${this.baseUrl}/api/v3/inspections/${encodeURIComponent(kind)}`
        + `?expected_state_token=${encodeURIComponent(expectedStateToken)}`,
      { method: "GET" }
    );
    if (!response.response.ok) {
      throw httpError(`Connector v3 ${kind} inspection`, response.response, response.value);
    }
    const decoded = decodeConnectorV3Inspection(response.value);
    if (decoded.data.expected_state_token !== expectedStateToken) {
      throw new ConnectorV3HttpError(
        `Connector v3 ${kind} inspection returned a different state token`
      );
    }
    return decoded;
  }

  async submit(input: {
    requestId: string;
    expectedStateToken: string;
    interactionId: string;
    command: string;
    operands: Record<string, string>;
    clientSessionId: string;
    controllerLeaseId: string;
    controllerGeneration: number;
  }): Promise<DecodedConnectorV3Payload<ConnectorV3Receipt>> {
    const response = await this.request(`${this.baseUrl}/api/v3/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: input.requestId,
        expected_state_token: input.expectedStateToken,
        interaction_id: input.interactionId,
        command: input.command,
        operands: input.operands,
        client_session_id: input.clientSessionId,
        controller_lease_id: input.controllerLeaseId,
        controller_generation: input.controllerGeneration,
        consumer: {
          profile: "re_spireagent_decision_v1",
          agent_id: "re-spireagent",
          agent_version: "0.1.0"
        }
      })
    });
    return decodeConnectorV3Receipt(response.value);
  }

  async poll(requestId: string): Promise<DecodedConnectorV3Payload<ConnectorV3Receipt>> {
    const response = await this.request(
      `${this.baseUrl}/api/v3/commands/${encodeURIComponent(requestId)}`,
      { method: "GET" }
    );
    return decodeConnectorV3Receipt(response.value);
  }

  async registerClient(input: {
    clientInstanceId: string;
    productId: string;
    productName: string;
    productVersion: string;
  }): Promise<DecodedBridgePayload<BridgeV2ClientRegistration>> {
    const response = await this.request(`${this.baseUrl}/api/v3/clients/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_instance_id: input.clientInstanceId,
        product_id: input.productId,
        product_name: input.productName,
        product_version: input.productVersion
      })
    });
    if (!response.response.ok) throw httpError("Connector v3 client registration", response.response, response.value);
    return decodeBridgeV2ClientRegistration(response.value);
  }

  async controlSnapshot(): Promise<DecodedBridgePayload<BridgeV2ControlSnapshot>> {
    const response = await this.request(`${this.baseUrl}/api/v3/controller`, { method: "GET" });
    if (!response.response.ok) throw httpError("Connector v3 controller status", response.response, response.value);
    return decodeBridgeV2ControlSnapshot(response.value);
  }

  async acquireController(
    clientSessionId: string
  ): Promise<DecodedBridgePayload<BridgeV2ControllerLeaseResponse>> {
    return this.controllerOperation("acquire", { client_session_id: clientSessionId });
  }

  async renewController(input: {
    clientSessionId: string;
    controllerLeaseId: string;
    controllerGeneration: number;
  }): Promise<DecodedBridgePayload<BridgeV2ControllerLeaseResponse>> {
    return this.controllerOperation("renew", {
      client_session_id: input.clientSessionId,
      controller_lease_id: input.controllerLeaseId,
      controller_generation: input.controllerGeneration
    });
  }

  async releaseController(input: {
    clientSessionId: string;
    controllerLeaseId: string;
    controllerGeneration: number;
  }): Promise<DecodedBridgePayload<BridgeV2ControllerLeaseResponse>> {
    return this.controllerOperation("release", {
      client_session_id: input.clientSessionId,
      controller_lease_id: input.controllerLeaseId,
      controller_generation: input.controllerGeneration
    });
  }

  private async controllerOperation(
    operation: "acquire" | "renew" | "release",
    body: Record<string, unknown>
  ): Promise<DecodedBridgePayload<BridgeV2ControllerLeaseResponse>> {
    const response = await this.request(`${this.baseUrl}/api/v3/controller/${operation}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const decoded = decodeBridgeV2ControllerLeaseResponse(response.value);
    if (!response.response.ok) {
      throw new ConnectorV3HttpError(
        `Connector v3 controller ${operation} rejected: ${decoded.data.status} - ${decoded.data.detail}`,
        response.response.status,
        decoded.data.status
      );
    }
    return decoded;
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
        throw new ConnectorV3HttpError(
          `${init.method ?? "GET"} ${url} returned invalid JSON`,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof ConnectorV3HttpError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new ConnectorV3HttpError(
          `${init.method ?? "GET"} ${url} timed out after ${this.timeoutMs}ms`
        );
      }
      throw new ConnectorV3HttpError(
        `${init.method ?? "GET"} ${url} failed: ${safeMessage(error)}`
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

function httpError(operation: string, response: Response, body: unknown): ConnectorV3HttpError {
  const detail = typeof body === "object" && body !== null
    ? JSON.stringify(body).slice(0, 300)
    : "no JSON error body";
  const errorCode = typeof body === "object"
      && body !== null
      && "error" in body
      && typeof body.error === "object"
      && body.error !== null
      && "code" in body.error
      && typeof body.error.code === "string"
    ? body.error.code
    : undefined;
  return new ConnectorV3HttpError(
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
