import { randomUUID } from "node:crypto";
import type { ExecutableGameAction } from "../../domain/actions/action.js";
import type {
  AdapterDescriptor,
  GameAdapter,
  GameExecutionResult
} from "../../game-io/adapter.js";
import type { JsonObject } from "../../shared/json.js";
import { stableStringify } from "../../runtime/stateHash.js";
import {
  GatewayControlSession,
  type GatewayControllerCredentials
} from "./gatewayControlSession.js";
import { ConnectorV3HttpError, ConnectorV3RestClient } from "./connectorV3Client.js";
import {
  projectConnectorV3ForRe,
  type ConnectorV3CommandInvocation
} from "./connectorV3Projection.js";
import type {
  ConnectorV3Capabilities,
  ConnectorV3Receipt
} from "./connectorV3Protocol.js";
import type { Sts2McpRawState } from "./rawState.js";

export interface ConnectorV3AdapterOptions {
  commandPollMs: number;
  commandTimeoutMs: number;
  startupWaitMs?: number;
  startupPollMs?: number;
}

export class Sts2ConnectorV3Adapter implements GameAdapter<
  Sts2McpRawState,
  ExecutableGameAction,
  GameExecutionResult
> {
  private readonly connector: ConnectorV3RestClient;
  private readonly control: GatewayControlSession;
  private capabilities?: ConnectorV3Capabilities;
  private invocations = new Map<string, ConnectorV3CommandInvocation>();
  private latestStateToken?: string;
  private lastReadAuthority: "none" | "connector_v3" = "none";

  constructor(
    private readonly baseUrl: string,
    timeoutMs: number,
    private readonly options: ConnectorV3AdapterOptions,
    fetchImpl: typeof fetch = fetch,
    private readonly sleep: (ms: number) => Promise<void> = defaultSleep
  ) {
    this.connector = new ConnectorV3RestClient(baseUrl, timeoutMs, fetchImpl);
    this.control = new GatewayControlSession(this.connector);
  }

  async initialize(): Promise<void> {
    if (this.capabilities) return;
    let remainingWaitMs = this.options.startupWaitMs ?? 0;
    const pollMs = this.options.startupPollMs ?? 500;
    while (true) {
      try {
        const connector = await this.connector.capabilities();
        this.capabilities = connector.data;
        return;
      } catch (error) {
        if (!isTransientGatewayStartupError(error) || remainingWaitMs <= 0) throw error;
        const delayMs = Math.min(pollMs, remainingWaitMs);
        await this.sleep(delayMs);
        remainingWaitMs -= delayMs;
      }
    }
  }

  describe(): AdapterDescriptor {
    const connector = this.capabilities;
    return {
      adapterId: "sts2-connector-v3",
      ...(connector ? { adapterVersion: connector.bridge.version } : {}),
      endpoint: this.baseUrl,
      capabilities: {
        canReadState: true,
        canExecuteActions:
          connector?.game.compatibility.action_execution_allowed === true,
        canListLegalActions: Boolean(connector),
        actionResults: "complete",
        legalActionAuthority: "bridge_advertised",
        protocols: ["connector_v3"]
      },
      negotiated: {
        protocol_mode: "connector_v3",
        connector_available: Boolean(connector),
        ...(connector ? {
          connector_protocol_version: connector.protocol_version,
          observation_schema: connector.observation_schema,
          command_schema: connector.command_schema,
          bridge_version: connector.bridge.version,
          bridge_module_version_id: connector.bridge.module_version_id,
          bridge_assembly_file_sha256: connector.bridge.assembly_file_sha256,
          bridge_runtime_instance_id: connector.bridge.runtime_instance_id,
          game_version: connector.game.version ?? null,
          game_commit: connector.game.commit ?? null,
          main_assembly_hash: connector.game.main_assembly_hash ?? null,
          modset_status: connector.game.modset.status,
          modset_fingerprint: connector.game.modset.fingerprint,
          runtime_patch_status: connector.permission_system.patch_inventory.status,
          runtime_patch_digest: connector.permission_system.patch_inventory.digest,
          permission_status: connector.permission_system.status,
          permission_mode: connector.permission_system.mode,
          permission_policy_id: connector.permission_system.policy_id,
          permission_policy_digest: connector.permission_system.policy_digest,
          qualification_status: connector.qualification_system.status,
          qualification_store_digest: connector.qualification_system.store_digest,
          qualification_environment_digest:
            connector.qualification_system.current_environment_digest,
          persistent_authority_enabled:
            connector.qualification_system.persistent_authority_enabled,
          action_permission_scopes:
            connector.game.compatibility.action_permission_scopes.map((scope) => ({
              surface_kind: scope.surface_kind,
              operation: scope.operation,
              tier: scope.tier,
              grant_id: scope.grant_id,
              runtime_epoch: scope.runtime_epoch,
              environment_digest: scope.environment_digest,
              patch_digest: scope.patch_digest,
              operation_fingerprint: scope.operation_fingerprint,
              admission_basis: scope.admission_basis
            })),
          action_execution_allowed:
            connector.game.compatibility.action_execution_allowed,
          state_observation_allowed:
            connector.game.compatibility.state_observation_allowed,
          connector_status: connector.status,
          commands: connector.commands,
          control_session: this.control.snapshot()
        } : {})
      }
    };
  }

  async readCurrentState(): Promise<Sts2McpRawState> {
    this.lastReadAuthority = "none";
    await this.initialize();
    const [observation, connectorCapabilities] = await Promise.all([
      this.connector.observation(),
      this.connector.capabilities()
    ]);
    assertObservationIdentity(observation.data, connectorCapabilities.data);
    const projected = projectConnectorV3ForRe(
      observation.data,
      observation.raw
    );
    this.capabilities = connectorCapabilities.data;
    this.invocations = new Map(projected.invocations);
    this.latestStateToken = observation.data.state_token;
    this.lastReadAuthority =
      observation.data.interaction.command_candidates.length > 0
        ? "connector_v3"
        : "none";
    return projected.rawState;
  }

  async execute(action: ExecutableGameAction): Promise<GameExecutionResult> {
    if (action.kind !== "connector_v3_command") {
      return rejectedResult(
        "action_authority_mismatch",
        "Re-SpireAgent V3 accepts only choices projected from the current Connector V3 interaction."
      );
    }
    if (this.lastReadAuthority !== "connector_v3") {
      return rejectedResult(
        "action_authority_mismatch",
        "No Connector V3 command was authorized by the latest state read."
      );
    }
    const invocation = this.invocations.get(action.choiceId);
    if (!invocation
        || invocation.expectedStateToken !== action.expectedStateToken
        || invocation.operation !== action.operation
        || this.latestStateToken !== action.expectedStateToken) {
      return rejectedResult(
        "stale_state",
        "The selected Connector V3 choice is not bound to the latest observation."
      );
    }

    await this.initialize();
    if (!this.capabilities?.game.compatibility.action_execution_allowed) {
      return rejectedResult(
        "connector_v3_execution_not_allowed",
        "The exact environment does not currently permit Connector V3 execution."
      );
    }

    let controller: GatewayControllerCredentials;
    try {
      await this.control.register(
        this.capabilities,
        this.capabilities.control
      );
      controller = await this.control.credentials();
    } catch (error) {
      return rejectedResult("controller_coordination_unavailable", safeMessage(error));
    }

    const requestId = `re-v3-${randomUUID()}`;
    let receipt;
    try {
      receipt = await this.connector.submit({
        requestId,
        expectedStateToken: invocation.expectedStateToken,
        interactionId: invocation.interactionId,
        command: invocation.command,
        operands: invocation.operands,
        clientSessionId: controller.clientSessionId,
        controllerLeaseId: controller.controllerLeaseId,
        controllerGeneration: controller.controllerGeneration
      });
    } catch (error) {
      return unknownResult(
        requestId,
        invocation,
        "command_submit_transport_unknown",
        safeMessage(error)
      );
    }

    const startedAt = Date.now();
    while (receipt.data.status === "pending") {
      if (Date.now() - startedAt >= this.options.commandTimeoutMs) {
        return unknownResult(
          requestId,
          invocation,
          "command_poll_timeout",
          "Connector V3 command did not reach a terminal receipt before the client timeout.",
          receipt.raw
        );
      }
      await this.sleep(this.options.commandPollMs);
      try {
        receipt = await this.connector.poll(requestId);
      } catch (error) {
        return unknownResult(
          requestId,
          invocation,
          "command_poll_transport_unknown",
          safeMessage(error),
          receipt.raw
        );
      }
    }

    const contractError = receiptContractError(
      receipt.data,
      requestId,
      invocation,
      controller
    );
    if (contractError) {
      return unknownResult(
        requestId,
        invocation,
        "receipt_contract_mismatch",
        contractError,
        receipt.raw
      );
    }
    if (receipt.data.status === "completed") {
      return {
        accepted: true,
        outcome: "accepted",
        settlementAuthority: "adapter_confirmed",
        ...(receipt.data.successor.state_token
          ? { confirmedStateToken: receipt.data.successor.state_token }
          : {}),
        response: receipt.raw
      };
    }
    if (receipt.data.status === "unknown") {
      return { accepted: false, outcome: "unknown", response: receipt.raw };
    }
    return {
      accepted: false,
      outcome: "rejected",
      ...(receipt.data.reason_code
        ? { rejectionCode: receipt.data.reason_code }
        : {}),
      response: receipt.raw
    };
  }

  async close(): Promise<void> {
    await this.control.close();
  }
}

function assertObservationIdentity(
  observation: {
    bridge: ConnectorV3Capabilities["bridge"];
    game: ConnectorV3Capabilities["game"];
  },
  capabilities: ConnectorV3Capabilities
): void {
  if (observation.bridge.runtime_instance_id !== capabilities.bridge.runtime_instance_id
      || observation.bridge.module_version_id !== capabilities.bridge.module_version_id
      || observation.bridge.assembly_file_sha256.toLowerCase()
        !== capabilities.bridge.assembly_file_sha256.toLowerCase()
      || observation.game.modset.fingerprint !== capabilities.game.modset.fingerprint) {
    throw new Error("Connector V3 observation identity drifted during the coherent read");
  }
}

function receiptContractError(
  receipt: ConnectorV3Receipt,
  requestId: string,
  invocation: ConnectorV3CommandInvocation,
  controller: GatewayControllerCredentials
): string | undefined {
  if (receipt.request_id !== requestId
      || receipt.command.kind !== invocation.command
      || stableStringify(receipt.command.operands) !== stableStringify(invocation.operands)) {
    return "Connector V3 receipt identity does not match the submitted command.";
  }
  if (receipt.status === "unknown" && receipt.retry.allowed) {
    return "Connector V3 unknown mutation incorrectly permits retry.";
  }
  if (!receipt.attribution
      || receipt.attribution.client_session_id !== controller.clientSessionId
      || receipt.attribution.client_instance_id !== controller.clientInstanceId
      || receipt.attribution.controller_lease_id !== controller.controllerLeaseId
      || receipt.attribution.controller_generation !== controller.controllerGeneration) {
    return "Connector V3 receipt attribution does not match the submitting controller.";
  }
  return undefined;
}

function rejectedResult(code: string, detail: string): GameExecutionResult {
  return {
    accepted: false,
    outcome: "rejected",
    rejectionCode: code,
    response: { status: "not_executed", error: { code, detail } }
  };
}

function unknownResult(
  requestId: string,
  invocation: ConnectorV3CommandInvocation,
  code: string,
  detail: string,
  lastReceipt?: JsonObject
): GameExecutionResult {
  return {
    accepted: false,
    outcome: "unknown",
    response: {
      status: "client_outcome_unknown",
      request_id: requestId,
      expected_state_token: invocation.expectedStateToken,
      command: invocation.command,
      operands: invocation.operands,
      error: { code, detail },
      ...(lastReceipt ? { last_receipt: lastReceipt } : {})
    }
  };
}

function isTransientGatewayStartupError(error: unknown): boolean {
  return error instanceof ConnectorV3HttpError
    && (error.statusCode === undefined
      || error.statusCode === 404
      || error.statusCode === 500
      || error.statusCode === 502
      || error.statusCode === 503);
}

function safeMessage(value: unknown): string {
  return (value instanceof Error ? value.message : String(value ?? "unknown error"))
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/giu, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9._~+/=-]+/gu, "sk-[REDACTED]")
    .slice(0, 400);
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
