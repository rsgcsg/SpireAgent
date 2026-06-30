import type { NormalizedState, RunMemory, ScoredCandidate } from "./types.js";
import { summarizeState } from "./state.js";

export interface LlmPromptInput {
  state: NormalizedState;
  run: RunMemory;
  candidates: ScoredCandidate[];
  memories: string[];
  uncertaintyReasons: string[];
}

export function buildDecisionPrompt(input: LlmPromptInput): string {
  const topCandidates = input.candidates.slice(0, 5).map((candidate) => ({
    id: candidate.id,
    label: candidate.label,
    score: Math.round(candidate.score * 10) / 10,
    confidence: Math.round(candidate.confidence * 100) / 100,
    reasons: candidate.reasons.slice(0, 3),
    risks: candidate.risks.slice(0, 3)
  }));

  const payload = {
    task: "Choose exactly one candidate action for Slay the Spire 2. Return short JSON only.",
    output_schema: {
      candidateId: "string",
      confidence: "0..1 number",
      reason: "short string",
      memoryUpdates: {
        strategicDirection: "optional string[]",
        riskFlags: "optional string[]",
        deficits: "optional partial map damage/block/draw/energy/scaling/aoe/deck_thinness/status_control/healing/potions -> 0..1"
      },
      parameterSuggestions: "optional conservative suggestions, not applied automatically unless post-run"
    },
    state: summarizeState(input.state),
    run_memory: {
      direction: input.run.strategicDirection.slice(-6),
      deficits: input.run.deficits,
      routeBias: input.run.routeBias,
      riskFlags: input.run.riskFlags.slice(-8)
    },
    uncertainty: input.uncertaintyReasons,
    relevant_memory: input.memories.slice(0, 5),
    candidates: topCandidates
  };

  return JSON.stringify(payload);
}
