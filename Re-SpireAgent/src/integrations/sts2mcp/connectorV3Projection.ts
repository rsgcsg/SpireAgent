import { createHash } from "node:crypto";
import type {
  ConnectorV3CommandCandidate,
  ConnectorV3Observation
} from "./connectorV3Protocol.js";
import { wrapConnectorV3State, type Sts2McpRawState } from "./legacyRawState.js";
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
  rawObservation: JsonObject
): ConnectorV3ProjectionResult {
  const commands = expandConnectorV3Commands(observation);
  const invocations = new Map<string, ConnectorV3CommandInvocation>(
    commands.map((command) => [command.choiceId, command])
  );
  return {
    rawState: wrapConnectorV3State({ observation: rawObservation }),
    invocations
  };
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
