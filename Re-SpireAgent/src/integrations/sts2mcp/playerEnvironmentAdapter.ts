import { randomUUID } from "node:crypto";
import type { ExecutableGameAction } from "../../domain/actions/action.js";
import type { AdapterDescriptor, GameAdapter, GameExecutionResult } from "../../game-io/adapter.js";
import type { JsonObject } from "../../shared/json.js";
import {
  EnvironmentControllerSession,
  type EnvironmentControllerCredentials
} from "./controllerSession.js";
import { PlayerEnvironmentHttpError, PlayerEnvironmentRestClient } from "./playerEnvironmentClient.js";
import type { PlayerEnvironmentBoundAction, PlayerEnvironmentCapabilities } from "./playerEnvironmentProtocol.js";
import { wrapPlayerEnvironmentState, type PlayerEnvironmentRawState } from "./rawState.js";

interface BoundActionInvocation {
  expectedSnapshotId: string;
  boundActionId: string;
}

export interface PlayerEnvironmentAdapterOptions {
  startupWaitMs?: number;
  startupPollMs?: number;
}

export class Sts2PlayerEnvironmentAdapter implements GameAdapter<PlayerEnvironmentRawState, ExecutableGameAction, GameExecutionResult> {
  private readonly connector: PlayerEnvironmentRestClient;
  private readonly control: EnvironmentControllerSession;
  private capabilities?: PlayerEnvironmentCapabilities;
  private invocations = new Map<string, BoundActionInvocation>();
  private latestStateToken?: string;

  constructor(
    private readonly baseUrl: string,
    timeoutMs: number,
    private readonly options: PlayerEnvironmentAdapterOptions,
    fetchImpl: typeof fetch = fetch,
    private readonly sleep: (ms: number) => Promise<void> = defaultSleep
  ) {
    this.connector = new PlayerEnvironmentRestClient(baseUrl, timeoutMs, fetchImpl);
    this.control = new EnvironmentControllerSession(this.connector);
  }

  async initialize(): Promise<void> {
    if (this.capabilities) return;
    let remaining = this.options.startupWaitMs ?? 0;
    const pollMs = this.options.startupPollMs ?? 500;
    while (true) {
      try {
        this.capabilities = (await this.connector.capabilities()).data;
        return;
      } catch (error) {
        if (!(error instanceof PlayerEnvironmentHttpError) || remaining <= 0) throw error;
        const delay = Math.min(pollMs, remaining);
        await this.sleep(delay);
        remaining -= delay;
      }
    }
  }

  describe(): AdapterDescriptor {
    const capabilities = this.capabilities;
    return {
      adapterId: "sts2-player-environment",
      ...(capabilities ? { adapterVersion: capabilities.host.version } : {}),
      endpoint: this.baseUrl,
      capabilities: {
        canReadState: true,
        canExecuteActions: capabilities?.execution_available === true,
        canListLegalActions: Boolean(capabilities),
        actionResults: "partial",
        legalActionAuthority: "player_environment",
        protocols: ["player_environment"]
      },
      negotiated: {
        protocol_mode: "player_environment",
        connector_available: Boolean(capabilities),
        ...(capabilities ? {
          connector_protocol_version: capabilities.protocol_version,
          snapshot_schema: capabilities.snapshot_schema,
          action_schema: capabilities.action_schema,
          receipt_schema: capabilities.receipt_schema,
          host_version: capabilities.host.version,
          host_module_version_id: capabilities.host.implementation.module_version_id ?? null,
          host_artifact_sha256: capabilities.host.implementation.artifact_sha256 ?? null,
          host_runtime_instance_id: capabilities.host.runtime_instance_id,
          environment_fingerprint: capabilities.environment_fingerprint,
          game_version: capabilities.game.version ?? null,
          game_commit: capabilities.game.commit ?? null,
          main_assembly_hash: capabilities.game.main_assembly_hash ?? null,
          modset_status: capabilities.game.modset.status,
          modset_fingerprint: capabilities.game.modset.fingerprint,
          execution_available: capabilities.execution_available,
          control_session: this.control.snapshot()
        } : {})
      }
    };
  }

  async readCurrentState(): Promise<PlayerEnvironmentRawState> {
    await this.initialize();
    const [observed, capabilities] = await Promise.all([
      this.connector.observe(),
      this.connector.capabilities()
    ]);
    assertIdentity(observed.data, capabilities.data);
    this.capabilities = capabilities.data;
    this.latestStateToken = observed.data.snapshot_id;
    const executableActions = observed.data.bound_actions.status === "complete"
      ? observed.data.bound_actions.actions
      : [];
    this.invocations = new Map(executableActions.map((boundAction) => [
      boundAction.bound_action_id,
      invocation(observed.data, boundAction)
    ]));
    return wrapPlayerEnvironmentState({ snapshot: observed.raw });
  }

  async execute(action: ExecutableGameAction): Promise<GameExecutionResult> {
    if (action.kind !== "bound_action") {
      return rejected("action_authority_mismatch", "Player Environment Re accepts only current bound UI actions.");
    }
    const invocation = this.invocations.get(action.choiceId);
    if (!invocation
        || action.boundActionId !== invocation.boundActionId
        || action.expectedSnapshotId !== invocation.expectedSnapshotId
        || this.latestStateToken !== invocation.expectedSnapshotId) {
      return rejected("stale_snapshot", "The selected UI action is not bound to the latest snapshot.");
    }
    await this.initialize();
    if (!this.capabilities?.execution_available) {
      return rejected("player_environment_execution_unavailable", "The current interaction cannot be observed exactly enough for input delivery.");
    }

    let controller: EnvironmentControllerCredentials;
    try {
      await this.control.register(this.capabilities.host, this.capabilities.control);
      controller = await this.control.credentials();
    } catch (error) {
      return rejected("controller_coordination_unavailable", safeMessage(error));
    }

    const requestId = `re-player-${randomUUID()}`;
    let receipt;
    try {
      receipt = await this.connector.submit({
        requestId,
        ...invocation,
        clientSessionId: controller.clientSessionId,
        controllerLeaseId: controller.controllerLeaseId,
        controllerGeneration: controller.controllerGeneration
      });
    } catch (error) {
      return unknown(requestId, invocation, "action_submit_transport_unknown", safeMessage(error));
    }
    if (receipt.data.request_id !== requestId
        || receipt.data.action.bound_action_id !== invocation.boundActionId
        || receipt.data.delivery === "unknown" && receipt.data.retry.allowed
        || !receipt.data.attribution
        || receipt.data.attribution.controller_lease_id !== controller.controllerLeaseId) {
      return unknown(requestId, invocation, "receipt_contract_mismatch", "Input receipt identity or attribution did not match the request.", receipt.raw);
    }
    if (receipt.data.delivery === "delivered") {
      return {
        accepted: true,
        outcome: "accepted",
        // C proves bounded native input delivery. Re observes readiness but
        // must not turn slow game animation into a failed input delivery.
        settlementAuthority: "adapter_confirmed",
        ...(receipt.data.successor?.snapshot_id
          ? { confirmedStateToken: receipt.data.successor.snapshot_id }
          : {}),
        response: receipt.raw
      };
    }
    if (receipt.data.delivery === "unknown") return { accepted: false, outcome: "unknown", response: receipt.raw };
    return {
      accepted: false,
      outcome: "rejected",
      ...(receipt.data.reason_code ? { rejectionCode: receipt.data.reason_code } : {}),
      response: receipt.raw
    };
  }

  async close(): Promise<void> { await this.control.close(); }
}

function invocation(
  observation: { snapshot_id: string },
  boundAction: PlayerEnvironmentBoundAction
): BoundActionInvocation {
  return {
    expectedSnapshotId: observation.snapshot_id,
    boundActionId: boundAction.bound_action_id
  };
}

function assertIdentity(
  observation: { session: { runtime_instance_id: string; environment_fingerprint: string } },
  capabilities: PlayerEnvironmentCapabilities
): void {
  if (observation.session.runtime_instance_id !== capabilities.host.runtime_instance_id) {
    throw new Error("Player Environment observation identity drifted during coherent read");
  }
  if (observation.session.environment_fingerprint !== capabilities.environment_fingerprint) {
    throw new Error("Player Environment environment identity drifted during coherent read");
  }
}

function rejected(code: string, detail: string): GameExecutionResult {
  return { accepted: false, outcome: "rejected", rejectionCode: code, response: { status: "not_delivered", error: { code, detail } } };
}

function unknown(requestId: string, action: BoundActionInvocation, code: string, detail: string, lastReceipt?: JsonObject): GameExecutionResult {
  return {
    accepted: false,
    outcome: "unknown",
    response: { status: "unknown", request_id: requestId, bound_action_id: action.boundActionId, code, detail, retry_allowed: false, ...(lastReceipt ? { last_receipt: lastReceipt } : {}) }
  };
}

function safeMessage(value: unknown): string { return value instanceof Error ? value.message.slice(0, 500) : String(value).slice(0, 500); }
function defaultSleep(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }
