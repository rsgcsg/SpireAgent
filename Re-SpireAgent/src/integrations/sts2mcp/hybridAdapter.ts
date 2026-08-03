import { randomUUID } from "node:crypto";
import type { ExecutableGameAction } from "../../domain/actions/action.js";
import type { AdapterDescriptor, GameAdapter, GameExecutionResult } from "../../game-io/adapter.js";
import { TransientObservationError } from "../../game-io/observationError.js";
import type { JsonObject } from "../../shared/json.js";
import { BridgeV2HttpError, BridgeV2RestClient } from "./bridgeV2Client.js";
import {
  GatewayControlSession,
  type GatewayControllerCredentials
} from "./gatewayControlSession.js";
import {
  type BridgeV2Capabilities,
  type BridgeV2Command,
  type BridgeV2InspectionKind,
  type BridgeV2ObservationBundle,
  type BridgeV2State
} from "./bridgeV2Protocol.js";
import { wrapBridgeV2State, type Sts2McpRawState } from "./rawState.js";

export interface HybridAdapterOptions {
  commandPollMs: number;
  commandTimeoutMs: number;
  startupWaitMs?: number;
  startupPollMs?: number;
  observationRetryAttempts?: number;
  observationRetryDelayMs?: number;
}

export class Sts2McpHybridAdapter implements GameAdapter<Sts2McpRawState, ExecutableGameAction, GameExecutionResult> {
  private readonly bridge: BridgeV2RestClient;
  private readonly control: GatewayControlSession;
  private capabilitiesPayload?: { data: BridgeV2Capabilities; raw: JsonObject };
  private lastReadAuthority: "none" | "bridge" = "none";

  constructor(
    private readonly baseUrl: string,
    timeoutMs: number,
    private readonly options: HybridAdapterOptions,
    fetchImpl: typeof fetch = fetch,
    private readonly sleep: (ms: number) => Promise<void> = defaultSleep
  ) {
    this.bridge = new BridgeV2RestClient(baseUrl, timeoutMs, fetchImpl);
    this.control = new GatewayControlSession(this.bridge);
  }

  async initialize(): Promise<void> {
    if (this.capabilitiesPayload) return;
    let remainingWaitMs = this.options.startupWaitMs ?? 0;
    const pollMs = this.options.startupPollMs ?? 500;
    while (true) {
      try {
        this.capabilitiesPayload = await this.bridge.capabilities();
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
    const bridge = this.capabilitiesPayload?.data;
    const bridgeExecutionAllowed = bridge?.game.compatibility.action_execution_allowed;
    return {
      adapterId: "sts2mcp-rest-negotiated",
      ...(bridge ? { adapterVersion: bridge.bridge.version } : {}),
      endpoint: this.baseUrl,
      capabilities: {
        canReadState: true,
        canExecuteActions: bridgeExecutionAllowed === true,
        canListLegalActions: Boolean(bridge),
        actionResults: "complete",
        legalActionAuthority: "bridge_advertised",
        protocols: ["bridge_v2"]
      },
      negotiated: {
        protocol_mode: "v2",
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
          release_declared_main_assembly_hash:
            bridge.game.release_declared_main_assembly_hash ?? null,
          modset_status: bridge.game.modset.status,
          modset_fingerprint: bridge.game.modset.fingerprint,
          modset_exact_permission_eligible: bridge.game.modset.exact_permission_eligible,
          modset_qualification_candidate_eligible:
            bridge.game.modset.qualification_candidate_eligible,
          modset_persistent_qualification_eligible:
            bridge.game.modset.persistent_qualification_eligible,
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
          compatibility_policy_id: bridge.game.compatibility.compatibility_policy_id,
          compatibility_policy_digest: bridge.game.compatibility.compatibility_policy_digest,
          compatibility_adaptation_level: bridge.game.compatibility.adaptation_level,
          permission_status: bridge.permission_system.status,
          permission_mode: bridge.permission_system.mode,
          permission_runtime_epoch: bridge.permission_system.runtime_epoch,
          permission_policy_id: bridge.permission_system.policy_id,
          permission_policy_digest: bridge.permission_system.policy_digest,
          dynamic_session_promotion_enabled:
            bridge.permission_system.dynamic_session_promotion_enabled,
          runtime_patch_status: bridge.permission_system.patch_inventory.status,
          runtime_patch_digest: bridge.permission_system.patch_inventory.digest,
          runtime_patch_owners: bridge.permission_system.patch_inventory.patch_owners,
          runtime_patch_unknown_owners:
            bridge.permission_system.patch_inventory.unknown_owners,
          permission_grants_at_negotiation: bridge.permission_system.grants.map((grant) => ({
            grant_id: grant.grant_id,
            grant_version: grant.grant_version,
            current: grant.current,
            status: grant.status,
            surface_kind: grant.surface_kind,
            operation: grant.operation,
            tier: grant.tier,
            runtime_epoch: grant.runtime_epoch,
            environment_digest: grant.environment_digest,
            patch_digest: grant.patch_digest,
            operation_fingerprint: grant.operation_fingerprint,
            evidence_bundle_digest: grant.evidence_bundle_digest,
            supersedes_grant_id: grant.supersedes_grant_id ?? null,
            revocation_reason: grant.revocation_reason ?? null
          })),
          qualification_status: bridge.qualification_system.status,
          qualification_store_id: bridge.qualification_system.store_id,
          qualification_store_digest: bridge.qualification_system.store_digest,
          qualification_current_environment_digest:
            bridge.qualification_system.current_environment_digest,
          qualification_operation_catalog_id:
            bridge.qualification_system.operation_catalog_id,
          qualification_operation_catalog_digest:
            bridge.qualification_system.operation_catalog_digest,
          qualification_operation_contracts:
            bridge.qualification_system.operation_contracts.map((contract) => ({
              surface_kind: contract.surface_kind,
              operation: contract.operation,
              contract_kind: contract.contract_kind,
              contract_digest: contract.contract_digest,
              completion_boundary: contract.completion_boundary,
              witness_id: contract.witness_id,
              risk_class: contract.risk_class
            })),
          persistent_authority_enabled:
            bridge.qualification_system.persistent_authority_enabled,
          session_canary_candidate_enabled:
            bridge.qualification_system.session_canary_candidate_enabled,
          applicable_qualifications_at_negotiation:
            bridge.qualification_system.qualifications
              .filter((qualification) =>
                qualification.applicable_to_current_environment)
              .map((qualification) => ({
                qualification_id: qualification.qualification_id,
                version: qualification.version,
                surface_kind: qualification.surface_kind,
                operation: qualification.operation,
                contract_kind: qualification.contract_kind,
                environment_digest: qualification.environment_digest,
                patch_digest: qualification.patch_digest,
                operation_fingerprint: qualification.operation_fingerprint,
                completion_boundary: qualification.completion_boundary,
                witness_id: qualification.witness_id,
                evidence_bundle_digest: qualification.evidence_bundle_digest
              })),
          control_coordination_status: bridge.control_coordination.status,
          control_coordination_runtime_epoch: bridge.control_coordination.runtime_epoch,
          control_registration_required_for_mutation:
            bridge.control_coordination.registration_required_for_mutation,
          control_single_controller: bridge.control_coordination.single_controller,
          control_lease_ttl_ms: bridge.control_coordination.lease_ttl_ms,
          control_recommended_renewal_ms:
            bridge.control_coordination.recommended_renewal_ms,
          control_session: this.control.snapshot(),
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
            tier: scope.tier,
            grant_id: scope.grant_id,
            grant_version: scope.grant_version,
            runtime_epoch: scope.runtime_epoch,
            environment_digest: scope.environment_digest,
            patch_digest: scope.patch_digest,
            operation_fingerprint: scope.operation_fingerprint,
            admission_basis: scope.admission_basis
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
    await this.initialize();

    if (!this.capabilitiesPayload) throw new Error("Bridge v2 capabilities were not negotiated");
    const maxAttempts = Math.max(1, this.options.observationRetryAttempts ?? 3);
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const state = await this.bridge.state();
        const observation = await this.readObservationBundle(state.data);
        const capabilities = await this.bridge.capabilities();
        if (!sameDynamicAuthorityProjection(observation.state, capabilities.data)) {
          throw stateChangedDuringCompositeRead(
            "state and capabilities dynamic authority projections differ"
          );
        }
        this.capabilitiesPayload = capabilities;
        this.lastReadAuthority = "bridge";
        return wrapBridgeV2State({
          state: observation.rawState,
          capabilities: capabilities.raw,
          ...(Object.keys(observation.inspections).length > 0 ? { inspections: observation.inspections } : {}),
          observation: observation.evidence
        });
      } catch (error) {
        if (!(error instanceof TransientObservationError) || attempt >= maxAttempts) throw error;
        await this.sleep(this.options.observationRetryDelayMs ?? 10);
      }
    }
    throw new Error("Bridge v2 observation retry loop ended without a result");
  }

  async execute(action: ExecutableGameAction): Promise<GameExecutionResult> {
    if (action.kind !== "bridge_v2_action") {
      return rejectedResult("action_authority_mismatch", "Re-SpireAgent accepts only Bridge v2 advertised actions.");
    }
    if (this.lastReadAuthority !== "bridge") {
      return rejectedResult("action_authority_mismatch", "A Bridge v2 action was not authorized by the latest adapter state read.");
    }

    await this.initialize();
    const capabilities = this.capabilitiesPayload?.data;
    if (!capabilities?.game.compatibility.action_execution_allowed) {
      return rejectedResult("bridge_v2_execution_not_allowed", "The negotiated game build is not approved for Bridge v2 execution.");
    }

    const requestId = `re-p1-${randomUUID()}`;
    let controller: GatewayControllerCredentials;
    try {
      await this.control.register(capabilities, capabilities.control_coordination);
      controller = await this.control.credentials();
    } catch (error) {
      return rejectedResult("controller_coordination_unavailable", safeMessage(error));
    }
    let current;
    try {
      current = await this.bridge.submit({
        requestId,
        expectedStateId: action.expectedStateId,
        actionId: action.actionId,
        clientSessionId: controller.clientSessionId,
        controllerLeaseId: controller.controllerLeaseId,
        controllerGeneration: controller.controllerGeneration
      });
    } catch (error) {
      return unknownResult(requestId, action, "command_submit_transport_unknown", safeMessage(error));
    }

    const submittedContractError = commandContractError(
      current.data,
      requestId,
      action,
      controller
    );
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
      const polledContractError = commandContractError(
        current.data,
        requestId,
        action,
        controller
      );
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
    const rejectionCode = terminalRejectionCode(current.data);
    return {
      accepted: false,
      outcome: "rejected",
      ...(rejectionCode ? { rejectionCode } : {}),
      response: current.raw
    };
  }

  async close(): Promise<void> {
    await this.control.close();
  }

  private async readObservationBundle(
    state: BridgeV2State
  ): Promise<{
    state: BridgeV2State;
    rawState: JsonObject;
    inspections: Partial<Record<BridgeV2InspectionKind, JsonObject>>;
    evidence: JsonObject;
  }> {
    // Availability is state-bound. Capabilities describe the vocabulary, but
    // only the current catalog may authorize a read-only inspection request.
    const requested = state.game.compatibility.inspection_allowed
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

}

function sameDynamicAuthorityProjection(
  state: BridgeV2State,
  capabilities: BridgeV2Capabilities
): boolean {
  const stateCompatibility = state.game.compatibility;
  const capabilityCompatibility = capabilities.game.compatibility;
  const scopes = (value: typeof stateCompatibility.action_permission_scopes) => value
    .map((scope) => [
      scope.surface_kind,
      scope.operation,
      scope.tier,
      scope.grant_id,
      scope.grant_version,
      scope.runtime_epoch,
      scope.environment_digest,
      scope.patch_digest,
      scope.operation_fingerprint,
      scope.admission_basis
    ].join("\u0000"))
    .sort()
    .join("\u0001");
  const strings = (value: readonly string[]) => [...value].sort().join("\u0000");
  return stateCompatibility.status === capabilityCompatibility.status
    && stateCompatibility.adaptation_level === capabilityCompatibility.adaptation_level
    && stateCompatibility.action_execution_allowed === capabilityCompatibility.action_execution_allowed
    && stateCompatibility.state_observation_allowed === capabilityCompatibility.state_observation_allowed
    && stateCompatibility.inspection_allowed === capabilityCompatibility.inspection_allowed
    && strings(stateCompatibility.action_execution_surface_kinds)
      === strings(capabilityCompatibility.action_execution_surface_kinds)
    && strings(stateCompatibility.action_canary_surface_kinds)
      === strings(capabilityCompatibility.action_canary_surface_kinds)
    && strings(stateCompatibility.inspection_allowed_kinds)
      === strings(capabilityCompatibility.inspection_allowed_kinds)
    && strings(stateCompatibility.inspection_canary_kinds)
      === strings(capabilityCompatibility.inspection_canary_kinds)
    && scopes(stateCompatibility.action_permission_scopes)
      === scopes(capabilityCompatibility.action_permission_scopes);
}

function isTransientGatewayStartupError(error: unknown): boolean {
  return error instanceof BridgeV2HttpError
    && (error.statusCode === undefined || error.statusCode >= 500);
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
  action: Extract<ExecutableGameAction, { kind: "bridge_v2_action" }>,
  controller: GatewayControllerCredentials
): string | undefined {
  if (command.request_id !== requestId
      || command.expected_state_id !== action.expectedStateId
      || command.action_id !== action.actionId) {
    return "Bridge command response identity does not match the submitted request.";
  }
  if (!command.attribution
      || command.attribution.client_session_id !== controller.clientSessionId
      || command.attribution.client_instance_id !== controller.clientInstanceId
      || command.attribution.controller_lease_id !== controller.controllerLeaseId
      || command.attribution.controller_generation !== controller.controllerGeneration) {
    return "Bridge command attribution does not match the submitting controller session.";
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

function rejectedResult(code: string, detail: string): GameExecutionResult {
  return {
    accepted: false,
    outcome: "rejected",
    rejectionCode: code,
    response: { status: "rejected", error: { code, detail } }
  };
}

function terminalRejectionCode(command: BridgeV2Command): string | undefined {
  for (let index = command.events.length - 1; index >= 0; index -= 1) {
    const event = command.events[index];
    if (event?.status === "rejected" && event.error_code) return event.error_code;
  }
  return undefined;
}

function unknownResult(
  requestId: string,
  action: Extract<ExecutableGameAction, { kind: "bridge_v2_action" }>,
  code: string,
  detail: string,
  lastCommand?: JsonObject
): GameExecutionResult {
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
