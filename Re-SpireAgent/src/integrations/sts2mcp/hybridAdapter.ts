import { randomUUID } from "node:crypto";
import type { ExecutableGameAction } from "../../domain/actions/action.js";
import type { AdapterDescriptor, GameAdapter } from "../../game-io/adapter.js";
import { TransientObservationError } from "../../game-io/observationError.js";
import type { JsonObject } from "../../shared/json.js";
import { BridgeV2HttpError, BridgeV2RestClient } from "./bridgeV2Client.js";
import {
  type BridgeV2Capabilities,
  type BridgeV2Command,
  type BridgeV2InspectionKind,
  type BridgeV2ObservationBundle,
  type BridgeV2State
} from "./bridgeV2Protocol.js";
import { wrapBridgeV2State, type Sts2McpRawState } from "./rawState.js";
import { Sts2McpRestAdapter, type McpExecutionResult } from "./restAdapter.js";

export type Sts2McpProtocolMode = "auto" | "v1" | "v2";

export interface HybridAdapterOptions {
  mode: Sts2McpProtocolMode;
  commandPollMs: number;
  commandTimeoutMs: number;
}

export class Sts2McpHybridAdapter implements GameAdapter<Sts2McpRawState, ExecutableGameAction, McpExecutionResult> {
  private readonly legacy: Sts2McpRestAdapter;
  private readonly bridge: BridgeV2RestClient;
  private capabilitiesPayload?: { data: BridgeV2Capabilities; raw: JsonObject };
  private lastReadAuthority: "none" | "legacy" | "bridge" = "none";

  constructor(
    private readonly baseUrl: string,
    timeoutMs: number,
    private readonly options: HybridAdapterOptions,
    fetchImpl: typeof fetch = fetch,
    private readonly sleep: (ms: number) => Promise<void> = defaultSleep
  ) {
    this.legacy = new Sts2McpRestAdapter(baseUrl, timeoutMs, fetchImpl);
    this.bridge = new BridgeV2RestClient(baseUrl, timeoutMs, fetchImpl);
  }

  async initialize(): Promise<void> {
    if (this.options.mode === "v1" || this.capabilitiesPayload) return;
    this.capabilitiesPayload = await this.bridge.capabilities();
  }

  describe(): AdapterDescriptor {
    const bridge = this.capabilitiesPayload?.data;
    const bridgeExecutionAllowed = bridge?.game.compatibility.action_execution_allowed;
    const legacySelected = this.options.mode === "v1";
    return {
      adapterId: "sts2mcp-rest-negotiated",
      ...(bridge ? { adapterVersion: bridge.bridge.version } : {}),
      endpoint: this.baseUrl,
      capabilities: {
        canReadState: true,
        canExecuteActions: this.options.mode === "v1" || bridgeExecutionAllowed === true,
        canListLegalActions: this.options.mode === "v2" || Boolean(bridge),
        actionResults: legacySelected ? "partial" : "complete",
        legalActionAuthority: legacySelected ? "local_reconstruction" : "bridge_advertised",
        protocols: legacySelected ? ["sts2mcp_v1"] : ["bridge_v2"]
      },
      negotiated: {
        protocol_mode: this.options.mode,
        bridge_available: Boolean(bridge),
        ...(bridge ? {
          bridge_protocol_version: bridge.protocol_version,
          bridge_version: bridge.bridge.version,
          bridge_module_version_id: bridge.bridge.module_version_id,
          bridge_assembly_file_sha256: bridge.bridge.assembly_file_sha256,
          bridge_runtime_instance_id: bridge.bridge.runtime_instance_id,
          game_version: bridge.game.version ?? null,
          game_commit: bridge.game.commit ?? null,
          main_assembly_hash: bridge.game.main_assembly_hash ?? null,
          modset_status: bridge.game.modset.status,
          modset_fingerprint: bridge.game.modset.fingerprint,
          modset_exact_permission_eligible: bridge.game.modset.exact_permission_eligible,
          loaded_mods: bridge.game.modset.mods.map((mod) => ({
            id: mod.id,
            version: mod.version ?? null,
            source: mod.source,
            load_state: mod.load_state,
            affects_gameplay: mod.affects_gameplay,
            workshop_id: mod.workshop_id ?? null,
            assembly_module_version_ids: mod.assemblies.map((assembly) => assembly.module_version_id)
          })),
          compatibility_status: bridge.game.compatibility.status,
          action_execution_allowed: bridge.game.compatibility.action_execution_allowed,
          state_observation_allowed: bridge.game.compatibility.state_observation_allowed,
          inspection_allowed: bridge.game.compatibility.inspection_allowed,
          shared_state_status: bridge.shared_state.status,
          shared_state_scope: bridge.shared_state.scope,
          shared_state_creates_action_authority: bridge.shared_state.creates_action_authority,
          shared_state_included_in_state_identity: bridge.shared_state.included_in_state_identity,
          action_execution_surface_kinds: bridge.game.compatibility.action_execution_surface_kinds,
          action_canary_surface_kinds: bridge.game.compatibility.action_canary_surface_kinds,
          action_permission_scopes: bridge.game.compatibility.action_permission_scopes.map((scope) => ({
            surface_kind: scope.surface_kind,
            operation: scope.operation,
            tier: scope.tier
          })),
          observation_only_surface_kinds: bridge.game.compatibility.observation_only_surface_kinds,
          supported_surfaces: bridge.surfaces
            .filter((surface) => surface.support === "implemented_exact_game_version")
            .map((surface) => surface.kind),
          qualified_scoped_surfaces: bridge.surfaces
            .filter((surface) => surface.support === "qualified_exact_build")
            .map((surface) => surface.kind),
          candidate_observation_surfaces: bridge.surfaces
            .filter((surface) => surface.support === "candidate_observation_only")
            .map((surface) => surface.kind),
          // A canary is executable only in its explicitly advertised surface;
          // keep it distinct from both exact qualification and read-only observation.
          candidate_action_canary_surfaces: bridge.surfaces
            .filter((surface) => surface.support === "candidate_action_canary")
            .map((surface) => surface.kind)
        } : {})
      }
    };
  }

  async readCurrentState(): Promise<Sts2McpRawState> {
    this.lastReadAuthority = "none";
    if (this.options.mode === "v1") return this.readLegacyAuthoritativeState();
    await this.initialize();

    const capabilities = this.capabilitiesPayload;
    if (!capabilities) throw new Error("Bridge v2 capabilities were not negotiated");
    const state = await this.bridge.state();
    const observation = await this.readObservationBundle(capabilities.data, state.data);
    this.lastReadAuthority = "bridge";
    return wrapBridgeV2State({
      state: observation.rawState,
      capabilities: capabilities.raw,
      ...(Object.keys(observation.inspections).length > 0 ? { inspections: observation.inspections } : {}),
      observation: observation.evidence
    });
  }

  async execute(action: ExecutableGameAction): Promise<McpExecutionResult> {
    if (action.kind !== "bridge_v2_action") {
      return this.options.mode === "v2" || this.lastReadAuthority !== "legacy"
        ? rejectedResult("action_authority_mismatch", "A legacy action was not authorized by the latest adapter state read.")
        : this.legacy.execute(action);
    }
    if (this.options.mode === "v1" || this.lastReadAuthority !== "bridge") {
      return rejectedResult("action_authority_mismatch", "A Bridge v2 action was not authorized by the latest adapter state read.");
    }

    await this.initialize();
    const capabilities = this.capabilitiesPayload?.data;
    if (!capabilities?.game.compatibility.action_execution_allowed) {
      return rejectedResult("bridge_v2_execution_not_allowed", "The negotiated game build is not approved for Bridge v2 execution.");
    }

    const requestId = `re-p1-${randomUUID()}`;
    let current;
    try {
      current = await this.bridge.submit({
        requestId,
        expectedStateId: action.expectedStateId,
        actionId: action.actionId
      });
    } catch (error) {
      return unknownResult(requestId, action, "command_submit_transport_unknown", safeMessage(error));
    }

    const submittedContractError = commandContractError(current.data, requestId, action);
    if (submittedContractError) {
      return unknownResult(requestId, action, "command_response_contract_mismatch", submittedContractError, current.raw);
    }

    const startedAt = Date.now();
    while (isPending(current.data.status)) {
      if (Date.now() - startedAt >= this.options.commandTimeoutMs) {
        return unknownResult(requestId, action, "command_poll_timeout", "Bridge command did not reach a terminal state before the client timeout.", current.raw);
      }
      await this.sleep(this.options.commandPollMs);
      try {
        current = await this.bridge.poll(requestId);
      } catch (error) {
        return unknownResult(requestId, action, "command_poll_transport_unknown", safeMessage(error), current.raw);
      }
      const polledContractError = commandContractError(current.data, requestId, action);
      if (polledContractError) {
        return unknownResult(requestId, action, "command_response_contract_mismatch", polledContractError, current.raw);
      }
    }

    if (current.data.status === "completed") {
      return {
        accepted: true,
        outcome: "accepted",
        settlementAuthority: "adapter_confirmed",
        ...(current.data.observed_state_id ? { confirmedStateToken: current.data.observed_state_id } : {}),
        response: current.raw
      };
    }
    if (current.data.status === "failed" || current.data.status === "timed_out") {
      return { accepted: false, outcome: "unknown", response: current.raw };
    }
    return { accepted: false, outcome: "rejected", response: current.raw };
  }

  private async readObservationBundle(
    capabilities: BridgeV2Capabilities,
    state: BridgeV2State
  ): Promise<{
    state: BridgeV2State;
    rawState: JsonObject;
    inspections: Partial<Record<BridgeV2InspectionKind, JsonObject>>;
    evidence: JsonObject;
  }> {
    // Availability is state-bound. Capabilities describe the vocabulary, but
    // only the current catalog may authorize a read-only inspection request.
    const requested = capabilities.game.compatibility.inspection_allowed
      ? state.inspection_catalog.map((entry) => entry.kind)
      : [];
    let bundle;
    try {
      bundle = await this.bridge.observationBundle(state.state_id, requested);
    } catch (error) {
      if (error instanceof BridgeV2HttpError && error.errorCode === "stale_state") {
        throw stateChangedDuringCompositeRead("coherent observation bundle returned stale_state");
      }
      if (error instanceof BridgeV2HttpError && error.errorCode === "inspection_scope_mismatch") {
        // A Surface can advance between the state read and its state-bound
        // inspection capture. Retry only when a fresh state proves that drift;
        // a mismatch against the same state remains a hard contract failure.
        try {
          const refreshed = await this.bridge.state();
          if (refreshed.data.state_id !== state.state_id) {
            throw stateChangedDuringCompositeRead(
              `coherent observation inspection scope changed from ${state.state_id} to ${refreshed.data.state_id}`
            );
          }
        } catch (refreshError) {
          if (refreshError instanceof TransientObservationError) throw refreshError;
        }
      }
      throw error;
    }
    const inspections = Object.fromEntries(
      Object.entries(bundle.data.inspections).map(([kind, inspection]) => [kind, inspection])
    ) as Partial<Record<BridgeV2InspectionKind, JsonObject>>;
    return {
      state: bundle.data.state,
      rawState: bundle.data.state as unknown as JsonObject,
      inspections,
      evidence: observationEvidence(bundle.data)
    };
  }

  private async readLegacyAuthoritativeState(): Promise<Sts2McpRawState> {
    const state = await this.legacy.readCurrentState();
    this.lastReadAuthority = "legacy";
    return state;
  }
}

function observationEvidence(bundle: BridgeV2ObservationBundle): JsonObject {
  return {
    observation_id: bundle.observation_id,
    coherent: bundle.coherent,
    state_id: bundle.state.state_id,
    inspection_kinds: Object.keys(bundle.inspections).sort()
  };
}

function stateChangedDuringCompositeRead(detail?: string): TransientObservationError {
  return new TransientObservationError(
    "state_changed_during_composite_read",
    `Bridge v2 state changed while read-only inspection evidence was being captured${detail ? `: ${detail}` : ""}`
  );
}

function isPending(status: BridgeV2Command["status"]): boolean {
  return status === "received" || status === "validated" || status === "started";
}

function commandContractError(
  command: BridgeV2Command,
  requestId: string,
  action: Extract<ExecutableGameAction, { kind: "bridge_v2_action" }>
): string | undefined {
  if (command.request_id !== requestId
      || command.expected_state_id !== action.expectedStateId
      || command.action_id !== action.actionId) {
    return "Bridge command response identity does not match the submitted request.";
  }

  const expectedOutcome = command.status === "completed"
    ? "confirmed"
    : command.status === "rejected"
      ? "not_applied"
      : command.status === "failed" || command.status === "timed_out"
        ? "unknown"
        : "pending";
  return command.outcome === expectedOutcome
    ? undefined
    : `Bridge command status ${command.status} is inconsistent with outcome ${command.outcome}.`;
}

function rejectedResult(code: string, detail: string): McpExecutionResult {
  return { accepted: false, outcome: "rejected", response: { status: "rejected", error: { code, detail } } };
}

function unknownResult(
  requestId: string,
  action: Extract<ExecutableGameAction, { kind: "bridge_v2_action" }>,
  code: string,
  detail: string,
  lastCommand?: JsonObject
): McpExecutionResult {
  return {
    accepted: false,
    outcome: "unknown",
    response: {
      status: "client_outcome_unknown",
      request_id: requestId,
      expected_state_id: action.expectedStateId,
      action_id: action.actionId,
      error: { code, detail },
      ...(lastCommand ? { last_command: lastCommand } : {})
    }
  };
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
