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

export interface ConnectorV3ProjectionResult {
  rawState: Sts2McpRawState;
  invocations: ReadonlyMap<string, ConnectorV3CommandInvocation>;
}

export function projectConnectorV3ForRe(
  observation: ConnectorV3Observation,
  rawObservation: JsonObject,
  rawCapabilities: JsonObject
): ConnectorV3ProjectionResult {
  const invocations = new Map<string, ConnectorV3CommandInvocation>();
  const legalActions = observation.interaction.command_candidates.flatMap((candidate) =>
    expandCandidate(observation, candidate).map((invocation) => {
      invocations.set(invocation.choiceId, invocation);
      const selectedEntityIds = new Set(Object.values(invocation.operands));
      return {
        action_id: invocation.choiceId,
        state_id: observation.state_token,
        kind: candidate.operation,
        category: "connector_v3",
        label: candidate.label,
        authority: "game_ui",
        evidence_code: candidate.binding_kind,
        entity_bindings: candidate.entity_bindings.filter((binding) =>
          selectedEntityIds.has(binding.entity_id))
      };
    })
  );
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
  const projection = {
    protocol_version: "2.0-preview.82",
    state_id: observation.state_token,
    semantic_state_id: `semantic_state_${semanticDigest}`,
    authority_projection_id: `authority_projection_${authorityDigest}`,
    state_sequence: observation.sequence,
    observed_at: observation.observed_at,
    readiness: observation.interaction.phase,
    shared_state: observation.shared_state,
    context: observation.context,
    surface_kind: observation.surface.kind,
    surface: observation.surface,
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
