import { randomUUID } from "node:crypto";
import type { ExecutableGameAction } from "../../domain/actions/action.js";
import type { AdapterDescriptor, GameAdapter, GameExecutionResult } from "../../game-io/adapter.js";
import type { JsonObject } from "../../shared/json.js";
import { GatewayControlSession, type GatewayControllerCredentials } from "./gatewayControlSession.js";
import { HumanEquivalentHttpError, HumanEquivalentRestClient } from "./humanEquivalentClient.js";
import type { HumanEquivalentAffordance, HumanEquivalentCapabilities } from "./humanEquivalentProtocol.js";
import { wrapHumanEquivalentState, type Sts2McpRawState } from "./rawState.js";

interface HumanInvocation {
  expectedStateToken: string;
  affordanceId: string;
}

export interface HumanEquivalentAdapterOptions {
  mode: "he_assisted" | "he_pure";
  commandPollMs: number;
  commandTimeoutMs: number;
  startupWaitMs?: number;
  startupPollMs?: number;
}

export class Sts2HumanEquivalentAdapter implements GameAdapter<Sts2McpRawState, ExecutableGameAction, GameExecutionResult> {
  private readonly connector: HumanEquivalentRestClient;
  private readonly control: GatewayControlSession;
  private capabilities?: HumanEquivalentCapabilities;
  private invocations = new Map<string, HumanInvocation>();
  private latestStateToken?: string;

  constructor(
    private readonly baseUrl: string,
    timeoutMs: number,
    private readonly options: HumanEquivalentAdapterOptions,
    fetchImpl: typeof fetch = fetch,
    private readonly sleep: (ms: number) => Promise<void> = defaultSleep
  ) {
    this.connector = new HumanEquivalentRestClient(baseUrl, timeoutMs, fetchImpl);
    this.control = new GatewayControlSession(this.connector);
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
        if (!(error instanceof HumanEquivalentHttpError) || remaining <= 0) throw error;
        const delay = Math.min(pollMs, remaining);
        await this.sleep(delay);
        remaining -= delay;
      }
    }
  }

  describe(): AdapterDescriptor {
    const capabilities = this.capabilities;
    return {
      adapterId: "sts2-human-equivalent",
      ...(capabilities ? { adapterVersion: capabilities.bridge.version } : {}),
      endpoint: this.baseUrl,
      capabilities: {
        canReadState: true,
        canExecuteActions: capabilities?.execution_available === true,
        canListLegalActions: Boolean(capabilities),
        actionResults: "partial",
        legalActionAuthority: "current_human_ui",
        protocols: ["human_equivalent"]
      },
      negotiated: {
        protocol_mode: "human_equivalent",
        human_mode: this.options.mode,
        connector_available: Boolean(capabilities),
        ...(capabilities ? {
          connector_protocol_version: capabilities.protocol_version,
          observation_schema: capabilities.observation_schema,
          action_schema: capabilities.action_schema,
          receipt_schema: capabilities.receipt_schema,
          bridge_version: capabilities.bridge.version,
          bridge_module_version_id: capabilities.bridge.module_version_id,
          bridge_assembly_file_sha256: capabilities.bridge.assembly_file_sha256,
          bridge_runtime_instance_id: capabilities.bridge.runtime_instance_id,
          game_version: capabilities.game.version ?? null,
          game_commit: capabilities.game.commit ?? null,
          main_assembly_hash: capabilities.game.main_assembly_hash ?? null,
          modset_status: capabilities.game.modset.status,
          modset_fingerprint: capabilities.game.modset.fingerprint,
          business_source_required: false,
          business_outcome_required: false,
          execution_available: capabilities.execution_available,
          control_session: this.control.snapshot()
        } : {})
      }
    };
  }

  async readCurrentState(): Promise<Sts2McpRawState> {
    await this.initialize();
    const [observed, capabilities] = await Promise.all([
      this.connector.observation(),
      this.connector.capabilities()
    ]);
    assertIdentity(observed.data, capabilities.data);
    this.capabilities = capabilities.data;
    this.latestStateToken = observed.data.state_token;
    this.invocations = new Map(observed.data.affordances.map((affordance) => [
      affordance.affordance_id,
      invocation(observed.data, affordance)
    ]));
    return wrapHumanEquivalentState({ snapshot: observed.raw });
  }

  async execute(action: ExecutableGameAction): Promise<GameExecutionResult> {
    if (action.kind !== "human_ui_action") {
      return rejected("action_authority_mismatch", "Human-Equivalent Re accepts only current UI affordances.");
    }
    const invocation = this.invocations.get(action.choiceId);
    if (!invocation
        || action.affordanceId !== invocation.affordanceId
        || action.expectedStateToken !== invocation.expectedStateToken
        || this.latestStateToken !== invocation.expectedStateToken) {
      return rejected("stale_snapshot", "The selected UI affordance is not bound to the latest snapshot.");
    }
    await this.initialize();
    if (!this.capabilities?.execution_available) {
      return rejected("human_execution_unavailable", "The current UI cannot be observed exactly enough for input delivery.");
    }

    let controller: GatewayControllerCredentials;
    try {
      await this.control.register(this.capabilities, this.capabilities.control);
      controller = await this.control.credentials();
    } catch (error) {
      return rejected("controller_coordination_unavailable", safeMessage(error));
    }

    const requestId = `re-he-${randomUUID()}`;
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
    const started = Date.now();
    while ((receipt.data.status as string) === "pending") {
      if (Date.now() - started >= this.options.commandTimeoutMs) {
        return unknown(requestId, invocation, "action_poll_timeout", "Input delivery did not reach a terminal receipt.", receipt.raw);
      }
      await this.sleep(this.options.commandPollMs);
      try { receipt = await this.connector.poll(requestId); }
      catch (error) { return unknown(requestId, invocation, "action_poll_transport_unknown", safeMessage(error), receipt.raw); }
    }
    if (receipt.data.request_id !== requestId
        || receipt.data.action.affordance_id !== invocation.affordanceId
        || receipt.data.status === "unknown" && receipt.data.retry.allowed
        || !receipt.data.attribution
        || receipt.data.attribution.controller_lease_id !== controller.controllerLeaseId) {
      return unknown(requestId, invocation, "receipt_contract_mismatch", "Input receipt identity or attribution did not match the request.", receipt.raw);
    }
    if (receipt.data.status === "applied") {
      return {
        accepted: true,
        outcome: "accepted",
        // HE proves bounded native input delivery. Re observes readiness but
        // must not turn slow game animation into a failed business outcome.
        settlementAuthority: "adapter_confirmed",
        ...(receipt.data.successor?.state_token
          ? { confirmedStateToken: receipt.data.successor.state_token }
          : {}),
        response: receipt.raw
      };
    }
    if (receipt.data.status === "unknown") return { accepted: false, outcome: "unknown", response: receipt.raw };
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
  observation: { state_token: string },
  affordance: HumanEquivalentAffordance
): HumanInvocation {
  return {
    expectedStateToken: observation.state_token,
    affordanceId: affordance.affordance_id
  };
}

function assertIdentity(
  observation: { bridge: HumanEquivalentCapabilities["bridge"]; game: HumanEquivalentCapabilities["game"] },
  capabilities: HumanEquivalentCapabilities
): void {
  if (observation.bridge.runtime_instance_id !== capabilities.bridge.runtime_instance_id
      || observation.bridge.module_version_id !== capabilities.bridge.module_version_id
      || observation.bridge.assembly_file_sha256.toLowerCase() !== capabilities.bridge.assembly_file_sha256.toLowerCase()
      || observation.game.modset.fingerprint !== capabilities.game.modset.fingerprint) {
    throw new Error("Human-Equivalent observation identity drifted during coherent read");
  }
}

function rejected(code: string, detail: string): GameExecutionResult {
  return { accepted: false, outcome: "rejected", rejectionCode: code, response: { status: "not_applied", error: { code, detail } } };
}

function unknown(requestId: string, action: HumanInvocation, code: string, detail: string, lastReceipt?: JsonObject): GameExecutionResult {
  return {
    accepted: false,
    outcome: "unknown",
    response: { status: "unknown", request_id: requestId, affordance_id: action.affordanceId, code, detail, retry_allowed: false, ...(lastReceipt ? { last_receipt: lastReceipt } : {}) }
  };
}

function safeMessage(value: unknown): string { return value instanceof Error ? value.message.slice(0, 500) : String(value).slice(0, 500); }
function defaultSleep(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }
