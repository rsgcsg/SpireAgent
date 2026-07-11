import type {
  DecisionAuthorizationRecord,
  DecisionAuthorityActor,
  DecisionAuthorityLevel,
  DecisionAuthorityMode,
  SelectionResolutionRecord
} from "../domain/types.js";
import type { DecisionLlmAudit, DecisionRouteKind } from "./types.js";
import { inferSelectionSource } from "./selectionResolution.js";

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
  selectionResolution?: SelectionResolutionRecord;
}): DecisionAuthorizationRecord {
  const authorityMode = input.authorityMode ?? resolveDecisionAuthorityMode();
  const selectionSource = input.selectionResolution?.finalSelection.source ?? inferSelectionSource(input);
  const notes: string[] = [];
  if (authorityMode === "unknown") notes.push("authority_mode_not_explicitly_configured");
  if (input.chosenBy === "fallback") notes.push("fallback_selection_does_not_transfer_authority");
  if (selectionSource === "local_scaffold") notes.push("local_scaffold_selection_is_not_qualified_delegation");
  if (selectionSource === "local_safety_guard") notes.push("local_safety_guard_overrode_proposed_selection");
  if (input.selectionResolution && !input.selectionResolution.llmSelectionEvidenceEligible) {
    notes.push("final_selection_not_eligible_for_llm_selection_evidence");
  }

  return {
    schemaVersion: 1,
    authorityMode,
    authorityLevel: authorityLevelFor(selectionSource),
    deliberationOwner: input.llmAudit?.called === true
      ? "llm"
      : input.route === "forced_local"
        ? "local_mechanical"
        : "local_scaffold",
    selectionSource,
    authorizationSource: authorizationSourceFor({ ...input, selectionSource }),
    executionSource: input.executed ? "agent_executor" : "not_executed",
    planOrigin: input.planOrigin ?? "candidate_generator",
    fallbackOrEscalationReason: input.fallbackReason,
    notes
  };
}

function authorityLevelFor(selectionSource: DecisionAuthorityActor): DecisionAuthorityLevel {
  if (selectionSource === "llm") return "long_horizon_strategy";
  if (selectionSource === "local_mechanical") return "mechanical_execution";
  return "unclassified_local_scaffold";
}

function authorizationSourceFor(input: {
  chosenBy: "local" | "llm" | "fallback";
  route: DecisionRouteKind;
  llmAudit?: DecisionLlmAudit;
  selectionSource: DecisionAuthorityActor;
}): string {
  // A rejected provider response never authorizes the local fallback decision.
  if (input.chosenBy === "fallback") return "local_fallback_policy";
  if (input.selectionSource === "local_safety_guard") return "local_safety_guard_after_validated_selection";
  if (input.llmAudit?.liveAdditiveApplied === true) return "explicit_live_additive_whitelist";
  if (input.llmAudit?.liveAdditiveEnabled === true && input.llmAudit.liveAdditiveApplied === false) {
    return "live_additive_whitelist_blocked";
  }
  if (input.llmAudit?.called === true) return "llm_route_with_semantic_validation";
  if (input.route === "forced_local") return "forced_local_route";
  return "local_route";
}
