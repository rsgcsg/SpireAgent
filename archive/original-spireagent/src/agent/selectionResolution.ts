import type {
  DecisionAuthorityActor,
  SelectionResolutionKind,
  SelectionResolutionRecord
} from "../domain/types.js";

export function inferSelectionSource(input: {
  chosenBy: "local" | "llm" | "fallback";
  route: string;
}): DecisionAuthorityActor {
  if (input.chosenBy === "llm") return "llm";
  if (input.chosenBy === "fallback") return "local_fallback";
  if (input.route === "forced_local") return "local_mechanical";
  return "local_scaffold";
}

export function buildSelectionResolutionRecord(input: {
  proposedCandidateId?: string;
  proposedSelectionSource: DecisionAuthorityActor;
  proposedValidationOutcome?: string;
  finalCandidateId?: string;
  finalSelectionSource: DecisionAuthorityActor;
  allowedCandidateIds: string[];
  resolutionKind?: SelectionResolutionKind;
  resolutionReason?: string;
  notes?: string[];
}): SelectionResolutionRecord {
  const allowedCandidateIds = new Set(input.allowedCandidateIds);
  const proposalAllowed = Boolean(input.proposedCandidateId && allowedCandidateIds.has(input.proposedCandidateId));
  const finalAllowed = Boolean(input.finalCandidateId && allowedCandidateIds.has(input.finalCandidateId));
  // Missing candidate IDs are never a matching selection provenance claim.
  const candidateIdMatch = Boolean(
    input.proposedCandidateId &&
    input.finalCandidateId &&
    input.proposedCandidateId === input.finalCandidateId
  );
  const resolutionKind = input.resolutionKind ?? inferResolutionKind({
    proposedSelectionSource: input.proposedSelectionSource,
    finalSelectionSource: input.finalSelectionSource,
    candidateIdMatch
  });
  const llmSelectionEvidenceEligible =
    input.proposedSelectionSource === "llm" &&
    input.finalSelectionSource === "llm" &&
    candidateIdMatch &&
    proposalAllowed &&
    finalAllowed;
  const notes = [...(input.notes ?? [])];

  if (input.proposedSelectionSource === "llm" && !candidateIdMatch) {
    notes.push("selection_provenance_mismatch");
  }
  if (input.finalSelectionSource === "local_safety_guard") {
    notes.push("final_selection_local_safety_guard");
  }
  if (input.proposedSelectionSource === "llm" && !proposalAllowed) {
    notes.push("llm_proposal_not_in_allowed_candidates");
  }
  if (!finalAllowed) {
    notes.push("final_selection_not_in_allowed_candidates");
  }

  return {
    schemaVersion: 1,
    proposedSelection: {
      candidateId: input.proposedCandidateId,
      source: input.proposedSelectionSource,
      candidateAllowed: proposalAllowed,
      validationOutcome: input.proposedValidationOutcome
    },
    finalSelection: {
      candidateId: input.finalCandidateId,
      source: input.finalSelectionSource,
      candidateAllowed: finalAllowed
    },
    resolutionKind,
    resolutionReason: input.resolutionReason,
    candidateIdMatch,
    llmSelectionEvidenceEligible,
    notes: unique(notes)
  };
}

function inferResolutionKind(input: {
  proposedSelectionSource: DecisionAuthorityActor;
  finalSelectionSource: DecisionAuthorityActor;
  candidateIdMatch: boolean;
}): SelectionResolutionKind {
  if (input.finalSelectionSource === "local_safety_guard") return "local_safety_override";
  if (input.proposedSelectionSource === input.finalSelectionSource && input.candidateIdMatch) {
    return "selected_as_proposed";
  }
  if (input.finalSelectionSource === "local_fallback") return "fallback_selected";
  if (input.finalSelectionSource === "local_mechanical") return "forced_local_selected";
  if (input.finalSelectionSource === "local_scaffold") return "local_selected";
  return "selection_source_changed";
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
