import type {
  DecisionAuthorizationRecord,
  DecisionAuthorityActor,
  DecisionAuthorityLevel,
  DecisionAuthorityMode
} from "../domain/types.js";
import type { DecisionLlmAudit, DecisionRouteKind } from "./types.js";

export const DECISION_AUTHORITY_MODE_FLAG = "STS2_DECISION_AUTHORITY_MODE";

export function resolveDecisionAuthorityMode(value = process.env[DECISION_AUTHORITY_MODE_FLAG]): DecisionAuthorityMode {
  switch (value?.trim().toLowerCase()) {
    case "llm_primary":
      return "llm_primary";
    case "llm_full_control":
      return "llm_full_control";
    case "local_shadow":
      return "local_shadow";
    case "local_autonomy_experimental":
      return "local_autonomy_experimental";
    default:
      return "unknown";
  }
}

export function buildDecisionAuthorizationRecord(input: {
  chosenBy: "local" | "llm" | "fallback";
  route: DecisionRouteKind;
  llmAudit?: DecisionLlmAudit;
  fallbackReason?: string;
  executed: boolean;
  planOrigin?: string;
  authorityMode?: DecisionAuthorityMode;
}): DecisionAuthorizationRecord {
  const authorityMode = input.authorityMode ?? resolveDecisionAuthorityMode();
  const selectionSource = selectionSourceFor(input.chosenBy, input.route);
  const notes: string[] = [];
  if (authorityMode === "unknown") notes.push("authority_mode_not_explicitly_configured");
  if (input.chosenBy === "fallback") notes.push("fallback_selection_does_not_transfer_authority");
  if (selectionSource === "local_scaffold") notes.push("local_scaffold_selection_is_not_qualified_delegation");

  return {
    schemaVersion: 1,
    authorityMode,
    authorityLevel: authorityLevelFor(input.chosenBy, input.route),
    deliberationOwner: input.llmAudit?.called === true
      ? "llm"
      : input.route === "forced_local"
        ? "local_mechanical"
        : "local_scaffold",
    selectionSource,
    authorizationSource: authorizationSourceFor(input),
    executionSource: input.executed ? "agent_executor" : "not_executed",
    planOrigin: input.planOrigin ?? "candidate_generator",
    fallbackOrEscalationReason: input.fallbackReason,
    notes
  };
}

function selectionSourceFor(
  chosenBy: "local" | "llm" | "fallback",
  route: DecisionRouteKind
): DecisionAuthorityActor {
  if (chosenBy === "llm") return "llm";
  if (chosenBy === "fallback") return "local_fallback";
  if (route === "forced_local") return "local_mechanical";
  return "local_scaffold";
}

function authorityLevelFor(
  chosenBy: "local" | "llm" | "fallback",
  route: DecisionRouteKind
): DecisionAuthorityLevel {
  if (chosenBy === "llm") return "long_horizon_strategy";
  if (route === "forced_local") return "mechanical_execution";
  return "unclassified_local_scaffold";
}

function authorizationSourceFor(input: {
  chosenBy: "local" | "llm" | "fallback";
  route: DecisionRouteKind;
  llmAudit?: DecisionLlmAudit;
}): string {
  // A rejected provider response never authorizes the local fallback decision.
  if (input.chosenBy === "fallback") return "local_fallback_policy";
  if (input.llmAudit?.liveAdditiveApplied === true) return "explicit_live_additive_whitelist";
  if (input.llmAudit?.liveAdditiveEnabled === true && input.llmAudit.liveAdditiveApplied === false) {
    return "live_additive_whitelist_blocked";
  }
  if (input.llmAudit?.called === true) return "llm_route_with_semantic_validation";
  if (input.route === "forced_local") return "forced_local_route";
  return "local_route";
}
