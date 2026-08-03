import { createHash } from "node:crypto";
import type {
  ConnectorV3CommandCandidate,
  ConnectorV3Observation
} from "./connectorV3Protocol.js";
import { wrapConnectorV3State, type Sts2McpRawState } from "./rawState.js";
import type { JsonObject } from "../../shared/json.js";
import { stableStringify } from "../../runtime/stateHash.js";

export interface ConnectorV3CommandInvocation {
  choiceId: string;
  expectedStateToken: string;
  interactionId: string;
  command: string;
  operands: Record<string, string>;
  operation: string;
}

export interface ConnectorV3ConsumerCommand extends ConnectorV3CommandInvocation {
  label: string;
  bindingKind: ConnectorV3CommandCandidate["binding_kind"];
  authorityState: ConnectorV3CommandCandidate["authority_state"];
  entityBindings: Array<{ role: string; entityId: string }>;
}

export interface ConnectorV3ProjectionResult {
  rawState: Sts2McpRawState;
  invocations: ReadonlyMap<string, ConnectorV3CommandInvocation>;
}

export function projectConnectorV3ForRe(
  observation: ConnectorV3Observation,
  rawObservation: JsonObject,
  rawCapabilities?: JsonObject
): ConnectorV3ProjectionResult {
  const commands = expandConnectorV3Commands(observation);
  const invocations = new Map<string, ConnectorV3CommandInvocation>(
    commands.map((command) => [command.choiceId, command])
  );
  if (usesDirectConnectorV3Consumer(observation)) {
    return {
      rawState: wrapConnectorV3State({ observation: rawObservation }),
      invocations
    };
  }
  if (!rawCapabilities) {
    throw new Error(
      `Connector V3 surface ${observation.surface.kind} still requires the temporary V2 consumer sidecar`
    );
  }

  const legalActions = commands.map((command) => ({
    action_id: command.choiceId,
    state_id: observation.state_token,
    kind: command.operation,
    category: "connector_v3",
    label: command.label,
    authority: "game_ui",
    evidence_code: command.bindingKind,
    entity_bindings: command.entityBindings.map((binding) => ({
      role: binding.role,
      entity_id: binding.entityId
    }))
  }));
  const semanticDigest = digest({
    stateToken: observation.state_token,
    sharedState: observation.shared_state,
    context: observation.context,
    surface: observation.surface,
    completeness: observation.completeness
  });
  const authorityDigest = digest({
    stateToken: observation.state_token,
    interaction: observation.interaction,
    legalActions
  });
  const actionable = legalActions.length > 0;
  const supportedSurface = observation.interaction.execution_support !== "unsupported";
  const projectedSurface = supportedSurface
    ? observation.surface
    : {
        kind: "unsupported",
        source_type: observation.surface.kind,
        reason: typeof observation.surface.reason === "string"
          ? observation.surface.reason
          : observation.interaction.support_reason
            ?? "Connector v3 has no exact command binding for this visible interaction."
      };
  const projection = {
    protocol_version: "2.0-preview.86",
    state_id: observation.state_token,
    semantic_state_id: `semantic_state_${semanticDigest}`,
    authority_projection_id: `authority_projection_${authorityDigest}`,
    state_sequence: observation.sequence,
    observed_at: observation.observed_at,
    readiness: supportedSurface ? observation.interaction.phase : "unsupported",
    shared_state: observation.shared_state,
    context: observation.context,
    surface_kind: projectedSurface.kind,
    surface: projectedSurface,
    authority_handoff: {
      status: actionable ? "bridge_owned" : "none_fail_closed",
      surface_kind: actionable ? observation.surface.kind : null,
      reason: actionable
        ? "Connector v3 owns the current parameterized command interaction."
        : "Connector v3 published no executable command for the current interaction."
    },
    legal_actions: legalActions,
    completeness: observation.completeness,
    bridge: observation.bridge,
    game: observation.game,
    observation_policy: observation.observation_policy,
    visibility: {
      ...observation.visibility,
      available_inspections: []
    },
    inspection_catalog: [],
    diagnostics: observation.diagnostics,
    warnings: [
      ...observation.warnings,
      "Re consumer projection uses V2 semantic normalization only; action authority remains Connector V3."
    ]
  } as unknown as JsonObject;

  return {
    rawState: wrapConnectorV3State({
      projection,
      capabilities: rawCapabilities,
      observation: rawObservation
    }),
    invocations
  };
}

export function usesDirectConnectorV3Consumer(
  observation: ConnectorV3Observation
): boolean {
  if (observation.interaction.phase === "settling") return true;
  if (observation.interaction.execution_support === "unsupported") return true;
  if (observation.surface.kind === "generated_card_choice") return true;
  if (observation.surface.kind === "combat_hand_card_selection") return true;
  if (observation.surface.kind === "deck_upgrade_selection") return true;
  if (observation.surface.kind === "deck_removal_selection") return true;
  if (observation.surface.kind === "event_deck_removal_selection") return true;
  if (observation.surface.kind === "relic_deck_removal_selection") return true;
  if (observation.surface.kind === "reward_deck_removal_selection") return true;
  if (observation.surface.kind === "card_bundle_selection") return true;
  const pair = `${observation.context.kind}:${observation.surface.kind}`;
  return new Set([
    "combat:combat_turn",
    "menu:main_menu",
    "menu:singleplayer_menu",
    "menu:character_select",
    "event:event_option",
    "map:map_navigation",
    "reward_flow:reward_claim",
    "reward_flow:card_reward_selection",
    "rest:rest_site",
    "shop:shop_inventory",
    "shop:shop_room",
    "treasure:treasure_room",
    "game_over:game_over"
  ]).has(pair);
}

export function expandConnectorV3Commands(
  observation: ConnectorV3Observation
): ConnectorV3ConsumerCommand[] {
  return observation.interaction.command_candidates.flatMap((candidate) =>
    expandCandidate(observation, candidate).map((invocation) => {
      const selectedEntityIds = new Set(Object.values(invocation.operands));
      const domainEntityIds = new Set(
        Object.values(candidate.operand_domains).flatMap((domain) => domain.entity_ids)
      );
      return {
        ...invocation,
        label: candidate.label,
        bindingKind: candidate.binding_kind,
        authorityState: candidate.authority_state,
        entityBindings: candidate.entity_bindings
          .filter((binding) => selectedEntityIds.has(binding.entity_id)
            || !domainEntityIds.has(binding.entity_id))
          .map((binding) => ({ role: binding.role, entityId: binding.entity_id }))
      };
    })
  );
}

function expandCandidate(
  observation: ConnectorV3Observation,
  candidate: ConnectorV3CommandCandidate
): ConnectorV3CommandInvocation[] {
  let operands: Array<Record<string, string>> = [{ ...candidate.operands }];
  for (const [name, domain] of Object.entries(candidate.operand_domains)) {
    operands = operands.flatMap((current) =>
      domain.entity_ids.map((entityId) => ({ ...current, [name]: entityId }))
    );
    if (operands.length > 512) {
      throw new Error(
        `Connector v3 candidate ${candidate.candidate_id} exceeds the bounded consumer expansion limit`
      );
    }
  }
  return operands.map((resolvedOperands) => {
    const choiceId = `v3choice_${digest({
      stateToken: observation.state_token,
      interactionId: observation.interaction.id,
      candidateId: candidate.candidate_id,
      operands: resolvedOperands
    }).slice(0, 24)}`;
    return {
      choiceId,
      expectedStateToken: observation.state_token,
      interactionId: observation.interaction.id,
      command: candidate.command,
      operands: resolvedOperands,
      operation: candidate.operation
    };
  });
}

function digest(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}
