import type { JsonObject } from "../../shared/json.js";
import {
  decodeHumanClientRegistration,
  decodeHumanCapabilities,
  decodeHumanControllerLeaseResponse,
  decodeHumanObservation,
  decodeHumanRead,
  decodeHumanReceipt,
  type DecodedHumanPayload,
  type HumanEquivalentCapabilities,
  type HumanEquivalentClientRegistration,
  type HumanEquivalentControllerLeaseResponse,
  type HumanEquivalentObservation,
  type HumanEnvironmentReadResponse,
  type HumanEquivalentReceipt
} from "./humanEquivalentProtocol.js";

export class HumanEquivalentHttpError extends Error {
  constructor(message: string, readonly statusCode?: number) {
    super(message);
    this.name = "HumanEquivalentHttpError";
  }
}

export class HumanEquivalentRestClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async capabilities(): Promise<DecodedHumanPayload<HumanEquivalentCapabilities>> {
    return decodeHumanCapabilities(await this.get("/api/he/capabilities"));
  }

  async observation(): Promise<DecodedHumanPayload<HumanEquivalentObservation>> {
    return decodeHumanObservation(await this.get("/api/he/observation"));
  }

  async read(readId: string, expectedSnapshotId: string): Promise<DecodedHumanPayload<HumanEnvironmentReadResponse>> {
    const encodedRead = encodeURIComponent(readId);
    const encodedSnapshot = encodeURIComponent(expectedSnapshotId);
    return decodeHumanRead(await this.get(`/api/he/reads/${encodedRead}?expected_snapshot_id=${encodedSnapshot}`));
  }

  async submit(input: {
    requestId: string;
    expectedSnapshotId: string;
    affordanceId: string;
    clientSessionId: string;
    controllerLeaseId: string;
    controllerGeneration: number;
  }): Promise<DecodedHumanPayload<HumanEquivalentReceipt>> {
    return decodeHumanReceipt(await this.post("/api/he/actions", {
      request_id: input.requestId,
      expected_snapshot_id: input.expectedSnapshotId,
      affordance_id: input.affordanceId,
      client_session_id: input.clientSessionId,
      controller_lease_id: input.controllerLeaseId,
      controller_generation: input.controllerGeneration
    }));
  }

  async poll(requestId: string): Promise<DecodedHumanPayload<HumanEquivalentReceipt>> {
    return decodeHumanReceipt(await this.get(`/api/he/actions/${encodeURIComponent(requestId)}`));
  }

  async registerClient(input: {
    clientInstanceId: string; productId: string; productName: string; productVersion: string;
  }): Promise<DecodedHumanPayload<HumanEquivalentClientRegistration>> {
    return decodeHumanClientRegistration(await this.post("/api/he/clients/register", {
      client_instance_id: input.clientInstanceId,
      product_id: input.productId,
      product_name: input.productName,
      product_version: input.productVersion
    }));
  }

  async acquireController(clientSessionId: string): Promise<DecodedHumanPayload<HumanEquivalentControllerLeaseResponse>> {
    return decodeHumanControllerLeaseResponse(await this.post("/api/he/controller/acquire", {
      client_session_id: clientSessionId
    }));
  }

  async renewController(input: { clientSessionId: string; controllerLeaseId: string; controllerGeneration: number }): Promise<DecodedHumanPayload<HumanEquivalentControllerLeaseResponse>> {
    return decodeHumanControllerLeaseResponse(await this.post("/api/he/controller/renew", {
      client_session_id: input.clientSessionId,
      controller_lease_id: input.controllerLeaseId,
      controller_generation: input.controllerGeneration
    }));
  }

  async releaseController(input: { clientSessionId: string; controllerLeaseId: string; controllerGeneration: number }): Promise<DecodedHumanPayload<HumanEquivalentControllerLeaseResponse>> {
    return decodeHumanControllerLeaseResponse(await this.post("/api/he/controller/release", {
      client_session_id: input.clientSessionId,
      controller_lease_id: input.controllerLeaseId,
      controller_generation: input.controllerGeneration
    }));
  }

  private async get(path: string): Promise<JsonObject> {
    return this.request(path, { method: "GET" });
  }

  private async post(path: string, body: JsonObject): Promise<JsonObject> {
    return this.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  private async request(path: string, init: RequestInit): Promise<JsonObject> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: AbortSignal.timeout(this.timeoutMs)
      });
    } catch (error) {
      throw new HumanEquivalentHttpError(`Human-Equivalent transport failed: ${safeMessage(error)}`);
    }
    const value: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new HumanEquivalentHttpError(
        `Human-Equivalent request failed with HTTP ${response.status}: ${safeMessage(value)}`,
        response.status
      );
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new HumanEquivalentHttpError("Human-Equivalent response was not a JSON object");
    }
    return value as JsonObject;
  }
}

function safeMessage(value: unknown): string {
  if (value instanceof Error) return value.message.slice(0, 500);
  try { return JSON.stringify(value).slice(0, 500); } catch { return String(value).slice(0, 500); }
}
