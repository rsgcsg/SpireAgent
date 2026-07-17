import { randomUUID } from "node:crypto";
import type { ExecutableGameAction } from "../../domain/actions/action.js";
import type { AdapterDescriptor, GameAdapter } from "../../game-io/adapter.js";
import { TransientObservationError } from "../../game-io/observationError.js";
import type { JsonObject } from "../../shared/json.js";
import { BridgeV2HttpError, BridgeV2RestClient } from "./bridgeV2Client.js";
import type { BridgeV2Capabilities, BridgeV2Command, BridgeV2State } from "./bridgeV2Protocol.js";
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
  private bridgeUnavailable = false;
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
    if (this.options.mode === "v1" || this.capabilitiesPayload || this.bridgeUnavailable) return;
    try {
      this.capabilitiesPayload = await this.bridge.capabilities();
    } catch (error) {
      if (this.options.mode === "auto" && error instanceof BridgeV2HttpError && error.statusCode === 404) {
        this.bridgeUnavailable = true;
        return;
      }
      throw error;
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
        canExecuteActions: this.options.mode === "v1" || this.bridgeUnavailable || !bridge || bridgeExecutionAllowed === true,
        canListLegalActions: this.options.mode === "v2" || Boolean(bridge),
        actionResults: this.options.mode === "v2" ? "complete" : "partial",
        legalActionAuthority: this.options.mode === "v1" ? "local_reconstruction" : this.options.mode === "v2" ? "bridge_advertised" : "mixed",
        protocols: this.options.mode === "v1" || this.bridgeUnavailable ? ["sts2mcp_v1"] : ["sts2mcp_v1", "bridge_v2"]
      },
      negotiated: {
        protocol_mode: this.options.mode,
        bridge_available: Boolean(bridge),
        ...(bridge ? {
          bridge_protocol_version: bridge.protocol_version,
          bridge_version: bridge.bridge.version,
          bridge_module_version_id: bridge.bridge.module_version_id,
          bridge_runtime_instance_id: bridge.bridge.runtime_instance_id,
          game_version: bridge.game.version ?? null,
          game_commit: bridge.game.commit ?? null,
          main_assembly_hash: bridge.game.main_assembly_hash ?? null,
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
    if (this.bridgeUnavailable) return this.readLegacyAuthoritativeState();

    const capabilities = this.capabilitiesPayload;
    if (!capabilities) throw new Error("Bridge v2 capabilities were not negotiated");
    const state = await this.bridge.state();
    const candidateBuild = isCandidateBuild(capabilities.data, state.data);
    const scopedQualifiedBuild = isScopedQualifiedBuild(capabilities.data, state.data);
    const bridgeOwnedState = state.data.authority_handoff.status === "bridge_owned"
      && state.data.surface.kind !== "unsupported";

    // Legacy fallback is allowed only when a coherent exact v2 contract
    // explicitly says this surface is unsupported. Any contract drift remains
    // visible to the strict normalizer and fails closed.
    if (this.options.mode === "v2" || !isSafeExplicitLegacyFallback(capabilities.data, state.data)) {
      const [legacyState, inspections] = await Promise.all([
        candidateBuild || scopedQualifiedBuild || bridgeOwnedState || this.options.mode === "v2"
          ? undefined
          : this.tryReadLegacySidecar(),
        // Candidate builds may expose a separately scoped, v2-owned
        // inspection canary. Never merge v1 there, but do preserve an
        // inspection explicitly authorized by the exact compatibility scope.
        this.readInspectionSidecars(capabilities.data, state.data)
      ]);
      const verifiedState = await this.bridge.state();
      if (verifiedState.data.state_id !== state.data.state_id) {
        throw stateChangedDuringCompositeRead();
      }
      this.lastReadAuthority = "bridge";
      return wrapBridgeV2State({
        state: verifiedState.raw,
        capabilities: capabilities.raw,
        ...(Object.keys(inspections).length > 0 ? { inspections } : {}),
        ...(legacyState ? { legacyState } : {})
      });
    }

    const [legacyState, inspections] = await Promise.all([
      this.legacy.readCurrentState(),
      this.readInspectionSidecars(capabilities.data, state.data)
    ]);
    const verifiedState = await this.bridge.state();
    if (verifiedState.data.state_id !== state.data.state_id) {
      throw stateChangedDuringCompositeRead();
    }
    this.lastReadAuthority = "legacy";
    return {
      ...legacyState,
      bridge_v2_capabilities: capabilities.raw,
      bridge_v2_authority_evidence: bridgeAuthorityEvidence(verifiedState.data),
      ...(Object.keys(inspections).length > 0 ? { bridge_v2_inspections: inspections } : {})
    };
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
      return { accepted: true, outcome: "accepted", response: current.raw };
    }
    if (current.data.status === "failed" || current.data.status === "timed_out") {
      return { accepted: false, outcome: "unknown", response: current.raw };
    }
    return { accepted: false, outcome: "rejected", response: current.raw };
  }

  private async tryReadLegacySidecar(): Promise<JsonObject | undefined> {
    try {
      return await this.legacy.readCurrentState();
    } catch {
      return undefined;
    }
  }

  private async readInspectionSidecars(
    capabilities: BridgeV2Capabilities,
    state: BridgeV2State
  ): Promise<Partial<Record<"run_deck" | "combat_piles", JsonObject>>> {
    // A candidate build gets no inspection by default. The server must
    // explicitly advertise both inspection authority and the allowed kind.
    if (!capabilities.game.compatibility.inspection_allowed) return {};
    const implemented = new Set(capabilities.inspections.implemented_kinds);
    const requested: Array<"run_deck" | "combat_piles"> = [];
    if (implemented.has("run_deck")) requested.push("run_deck");
    if (implemented.has("combat_piles") && state.context.kind === "combat") {
      requested.push("combat_piles");
    }

    const entries = await Promise.all(requested.map(async (kind) => {
      try {
        const inspection = await this.bridge.inspect(kind, state.state_id);
        return [kind, inspection.raw] as const;
      } catch (error) {
        // A fixed inspection capability may be unavailable in a state where
        // its backing player object does not exist (for example, main menu).
        // A stale response here means the game advanced after this adapter
        // read the expected state. Reject the partial snapshot, but preserve a
        // typed signal so settlement polling can retry the whole observation.
        if (error instanceof BridgeV2HttpError && error.errorCode === "inspection_not_available") {
          return undefined;
        }
        if (error instanceof BridgeV2HttpError && error.errorCode === "stale_state") {
          throw stateChangedDuringCompositeRead(`${kind} inspection returned stale_state`);
        }
        throw error;
      }
    }));
    return Object.fromEntries(
      entries.filter((entry): entry is readonly ["run_deck" | "combat_piles", JsonObject] => entry !== undefined)
    ) as Partial<Record<"run_deck" | "combat_piles", JsonObject>>;
  }

  private async readLegacyAuthoritativeState(): Promise<Sts2McpRawState> {
    const state = await this.legacy.readCurrentState();
    this.lastReadAuthority = "legacy";
    return state;
  }
}

function bridgeAuthorityEvidence(state: BridgeV2State): JsonObject {
  return {
    protocol_version: state.protocol_version,
    state_id: state.state_id,
    readiness: state.readiness,
    context_kind: state.context.kind,
    surface_kind: state.surface.kind,
    authority_handoff: {
      status: state.authority_handoff.status,
      ...(state.authority_handoff.surface_kind !== undefined
        ? { surface_kind: state.authority_handoff.surface_kind ?? null }
        : {}),
      reason: state.authority_handoff.reason
    },
    bridge: {
      id: state.bridge.id,
      version: state.bridge.version,
      upstream_commit: state.bridge.upstream_commit,
      module_version_id: state.bridge.module_version_id,
      runtime_instance_id: state.bridge.runtime_instance_id
    },
    game: {
      ...(state.game.version !== undefined ? { version: state.game.version ?? null } : {}),
      ...(state.game.commit !== undefined ? { commit: state.game.commit ?? null } : {}),
      ...(state.game.branch !== undefined ? { branch: state.game.branch ?? null } : {}),
      ...(state.game.main_assembly_hash !== undefined
        ? { main_assembly_hash: state.game.main_assembly_hash ?? null }
        : {}),
      compatibility: {
        status: state.game.compatibility.status,
        tested_game_versions: state.game.compatibility.tested_game_versions,
        tested_build_fingerprints: state.game.compatibility.tested_build_fingerprints,
        action_execution_allowed: state.game.compatibility.action_execution_allowed,
        state_observation_allowed: state.game.compatibility.state_observation_allowed,
        inspection_allowed: state.game.compatibility.inspection_allowed,
        action_execution_surface_kinds: state.game.compatibility.action_execution_surface_kinds,
        action_canary_surface_kinds: state.game.compatibility.action_canary_surface_kinds,
        inspection_allowed_kinds: state.game.compatibility.inspection_allowed_kinds,
        inspection_canary_kinds: state.game.compatibility.inspection_canary_kinds,
        observation_only_surface_kinds: state.game.compatibility.observation_only_surface_kinds,
        observation_candidate_build_fingerprints:
          state.game.compatibility.observation_candidate_build_fingerprints,
        detail: state.game.compatibility.detail
      }
    }
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

function isSafeExplicitLegacyFallback(
  capabilities: BridgeV2Capabilities,
  state: BridgeV2State
): boolean {
  const capabilityGame = capabilities.game;
  const stateGame = state.game;
  return state.surface.kind === "unsupported"
    && state.readiness === "unsupported"
    && state.legal_actions.length === 0
    && state.authority_handoff.status === "legacy_fallback_allowed"
    && isExecutableExactStatus(capabilityGame.compatibility.status)
    && stateGame.compatibility.status === capabilityGame.compatibility.status
    && capabilityGame.compatibility.action_execution_allowed
    && stateGame.compatibility.action_execution_allowed
    && Boolean(capabilityGame.version && capabilityGame.commit && capabilityGame.main_assembly_hash !== null && capabilityGame.main_assembly_hash !== undefined)
    && capabilityGame.version === stateGame.version
    && capabilityGame.commit === stateGame.commit
    && capabilityGame.main_assembly_hash === stateGame.main_assembly_hash
    && capabilityGame.compatibility.tested_build_fingerprints.includes(gameFingerprint(capabilityGame))
    && stateGame.compatibility.tested_build_fingerprints.includes(gameFingerprint(stateGame))
    && capabilities.bridge.id === state.bridge.id
    && capabilities.bridge.name === state.bridge.name
    && capabilities.bridge.version === state.bridge.version
    && capabilities.bridge.upstream_commit === state.bridge.upstream_commit
    && capabilities.bridge.module_version_id === state.bridge.module_version_id
    && capabilities.bridge.runtime_instance_id === state.bridge.runtime_instance_id
    && capabilities.observation_policy.id === state.observation_policy.id
    && !capabilities.observation_policy.includes_hidden_information
    && !state.observation_policy.includes_hidden_information
    && capabilities.commands.opaque_actions_only
    && capabilities.commands.state_bound
    && capabilities.commands.idempotent_request_ids
    && sameStrings(
      capabilityGame.compatibility.action_execution_surface_kinds,
      stateGame.compatibility.action_execution_surface_kinds
    )
    && sameStrings(
      capabilityGame.compatibility.action_canary_surface_kinds,
      stateGame.compatibility.action_canary_surface_kinds
    )
    && sameStrings(
      capabilityGame.compatibility.inspection_allowed_kinds,
      stateGame.compatibility.inspection_allowed_kinds
    )
    && sameStrings(
      capabilityGame.compatibility.inspection_canary_kinds,
      stateGame.compatibility.inspection_canary_kinds
    )
    && sameStrings(
      capabilityGame.compatibility.observation_only_surface_kinds,
      stateGame.compatibility.observation_only_surface_kinds
    )
    && sameStrings(
      capabilityGame.compatibility.observation_candidate_build_fingerprints,
      stateGame.compatibility.observation_candidate_build_fingerprints
    )
    && sameStrings(
      capabilityGame.compatibility.tested_build_fingerprints,
      stateGame.compatibility.tested_build_fingerprints
    )
    && (capabilityGame.compatibility.status !== "qualified_scoped"
      || isScopedLegacyHandoff(capabilities, state));
}

function isExecutableExactStatus(status: string): boolean {
  return status === "supported_exact" || status === "qualified_scoped";
}

function isScopedLegacyHandoff(
  capabilities: BridgeV2Capabilities,
  state: BridgeV2State
): boolean {
  const surfaceKind = state.authority_handoff.surface_kind;
  if (!surfaceKind) return false;
  if (capabilities.game.compatibility.action_execution_surface_kinds.includes(surfaceKind)
      || capabilities.game.compatibility.action_canary_surface_kinds.includes(surfaceKind)) return false;
  return capabilities.surfaces.some((surface) =>
    surface.kind === surfaceKind && surface.support === "not_qualified_for_current_build");
}

function isScopedQualifiedBuild(
  capabilities: BridgeV2Capabilities,
  state: BridgeV2State
): boolean {
  const capabilityCompatibility = capabilities.game.compatibility;
  const stateCompatibility = state.game.compatibility;
  return capabilityCompatibility.status === "qualified_scoped"
    && stateCompatibility.status === "qualified_scoped"
    && capabilityCompatibility.action_execution_allowed
    && stateCompatibility.action_execution_allowed
    && capabilityCompatibility.state_observation_allowed
    && stateCompatibility.state_observation_allowed
    && capabilityCompatibility.action_execution_surface_kinds.length > 0
    && sameStrings(
      capabilityCompatibility.action_execution_surface_kinds,
      stateCompatibility.action_execution_surface_kinds
    )
    && sameStrings(
      capabilityCompatibility.action_canary_surface_kinds,
      stateCompatibility.action_canary_surface_kinds
    )
    && capabilityCompatibility.tested_build_fingerprints.includes(gameFingerprint(capabilities.game))
    && stateCompatibility.tested_build_fingerprints.includes(gameFingerprint(state.game));
}

function isCandidateBuild(
  capabilities: BridgeV2Capabilities,
  state: BridgeV2State
): boolean {
  const capabilityCompatibility = capabilities.game.compatibility;
  const stateCompatibility = state.game.compatibility;
  const candidateStatus = capabilityCompatibility.status === "observation_only_candidate"
    || capabilityCompatibility.status === "action_and_inspection_canary_candidate";
  return candidateStatus
    && stateCompatibility.status === capabilityCompatibility.status
    && capabilityCompatibility.state_observation_allowed
    && stateCompatibility.state_observation_allowed
    && capabilityCompatibility.observation_candidate_build_fingerprints.includes(gameFingerprint(capabilities.game))
    && stateCompatibility.observation_candidate_build_fingerprints.includes(gameFingerprint(state.game));
}

function gameFingerprint(game: BridgeV2Capabilities["game"]): string {
  return `${game.version ?? "unknown"}|${game.commit ?? "unknown"}|${game.main_assembly_hash ?? "unknown"}`;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return [...left].sort().join("\u0000") === [...right].sort().join("\u0000");
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
