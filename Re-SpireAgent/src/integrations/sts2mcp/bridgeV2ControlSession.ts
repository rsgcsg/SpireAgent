import { randomUUID } from "node:crypto";
import type {
  BridgeV2ClientRegistration,
  BridgeV2ControllerLeaseResponse,
  DecodedBridgePayload
} from "./bridgeV2Protocol.js";
import type { JsonObject } from "../../shared/json.js";

export interface BridgeV2ControllerCredentials {
  readonly clientSessionId: string;
  readonly clientInstanceId: string;
  readonly controllerLeaseId: string;
  readonly controllerGeneration: number;
}

export interface BridgeControlClient {
  registerClient(input: {
    clientInstanceId: string;
    productId: string;
    productName: string;
    productVersion: string;
  }): Promise<DecodedBridgePayload<BridgeV2ClientRegistration>>;
  acquireController(
    clientSessionId: string
  ): Promise<DecodedBridgePayload<BridgeV2ControllerLeaseResponse>>;
  renewController(input: {
    clientSessionId: string;
    controllerLeaseId: string;
    controllerGeneration: number;
  }): Promise<DecodedBridgePayload<BridgeV2ControllerLeaseResponse>>;
  releaseController(input: {
    clientSessionId: string;
    controllerLeaseId: string;
    controllerGeneration: number;
  }): Promise<DecodedBridgePayload<BridgeV2ControllerLeaseResponse>>;
}

export class BridgeV2ControlSession {
  private readonly clientInstanceId = `re-spireagent-${randomUUID()}`;
  private registration?: BridgeV2ClientRegistration;
  private lease?: NonNullable<BridgeV2ControllerLeaseResponse["controller"]>;
  private renewalTimer?: ReturnType<typeof setTimeout>;
  private operation?: Promise<void>;
  private closed = false;
  private recommendedRenewalMs = 10_000;

  constructor(private readonly bridge: BridgeControlClient) {}

  async register(
    gateway: { bridge: { runtime_instance_id: string } },
    coordination: { recommended_renewal_ms: number }
  ): Promise<void> {
    if (this.registration) return;
    const registration = await this.bridge.registerClient({
      clientInstanceId: this.clientInstanceId,
      productId: "re-spireagent",
      productName: "Re-SpireAgent",
      productVersion: "0.1.0"
    });
    if (registration.data.runtime_instance_id !== gateway.bridge.runtime_instance_id
        || registration.data.client.client_instance_id !== this.clientInstanceId) {
      throw new Error("Bridge client registration identity does not match negotiated capabilities");
    }
    this.registration = registration.data;
    this.recommendedRenewalMs = coordination.recommended_renewal_ms;
  }

  async credentials(): Promise<BridgeV2ControllerCredentials> {
    if (this.closed) throw new Error("Bridge control session is closed");
    await this.serialize(async () => {
      if (!this.registration) {
        throw new Error("Bridge control session was not registered");
      }
      if (this.lease && !this.shouldRenew(this.lease)) return;

      if (this.lease) {
        try {
          const renewed = await this.bridge.renewController({
            clientSessionId: this.registration.client.client_session_id,
            controllerLeaseId: this.lease.controller_lease_id,
            controllerGeneration: this.lease.controller_generation
          });
          this.acceptLease(renewed.data);
          return;
        } catch {
          this.lease = undefined;
        }
      }

      const acquired = await this.bridge.acquireController(
        this.registration.client.client_session_id
      );
      this.acceptLease(acquired.data);
    });

    if (!this.registration || !this.lease) {
      throw new Error("Gateway did not provide an active controller lease");
    }
    return {
      clientSessionId: this.registration.client.client_session_id,
      clientInstanceId: this.clientInstanceId,
      controllerLeaseId: this.lease.controller_lease_id,
      controllerGeneration: this.lease.controller_generation
    };
  }

  snapshot(): JsonObject {
    return {
      client_instance_id: this.clientInstanceId,
      registered: Boolean(this.registration),
      client_session_id: this.registration?.client.client_session_id ?? null,
      controller_lease_id: this.lease?.controller_lease_id ?? null,
      controller_generation: this.lease?.controller_generation ?? null,
      controller_expires_at: this.lease?.expires_at ?? null
    };
  }

  async close(): Promise<void> {
    this.closed = true;
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer);
      this.renewalTimer = undefined;
    }
    const registration = this.registration;
    const lease = this.lease;
    this.lease = undefined;
    if (!registration || !lease) return;
    try {
      await this.bridge.releaseController({
        clientSessionId: registration.client.client_session_id,
        controllerLeaseId: lease.controller_lease_id,
        controllerGeneration: lease.controller_generation
      });
    } catch {
      // TTL is the crash-safe release path; shutdown must not mask the caller's result.
    }
  }

  private acceptLease(response: BridgeV2ControllerLeaseResponse): void {
    if (!this.registration
        || response.runtime_instance_id !== this.registration.runtime_instance_id
        || !response.controller
        || response.controller.client_session_id !== this.registration.client.client_session_id) {
      throw new Error("Gateway controller response does not match this registered client");
    }
    this.lease = response.controller;
    this.scheduleRenewal();
  }

  private scheduleRenewal(): void {
    if (this.renewalTimer) clearTimeout(this.renewalTimer);
    if (!this.lease || this.closed) return;
    const expiresInMs = Date.parse(this.lease.expires_at) - Date.now();
    const delayMs = Math.max(100, expiresInMs - this.recommendedRenewalMs);
    this.renewalTimer = setTimeout(() => {
      void this.credentials().catch(() => {
        this.lease = undefined;
      });
    }, delayMs);
    this.renewalTimer.unref?.();
  }

  private shouldRenew(
    lease: NonNullable<BridgeV2ControllerLeaseResponse["controller"]>
  ): boolean {
    return Date.parse(lease.expires_at) - Date.now() <= this.recommendedRenewalMs;
  }

  private async serialize(operation: () => Promise<void>): Promise<void> {
    const previous = this.operation;
    const current = (async () => {
      if (previous) {
        try {
          await previous;
        } catch {
          // The new operation gets one independent attempt.
        }
      }
      await operation();
    })();
    this.operation = current;
    try {
      await current;
    } finally {
      if (this.operation === current) this.operation = undefined;
    }
  }
}
