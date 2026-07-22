import type { AdapterCapabilities } from "../../domain/types.js";

export const STS2MCP_REST_CAPABILITIES: AdapterCapabilities = Object.freeze({
  canReadState: true,
  canReadRawState: true,
  canReadScreen: true,
  canExecuteActions: true,
  canReadAgentActionResults: "partial",
  canListLegalActions: false,
  canReadEventLog: false,
  canReadHumanEvents: false,
  canProvideFactData: false,
  canProvideVersionedFacts: false
});

export function getSts2McpRestCapabilities(): AdapterCapabilities {
  return { ...STS2MCP_REST_CAPABILITIES };
}
