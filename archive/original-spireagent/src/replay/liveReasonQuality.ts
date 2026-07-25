import type { JsonRecord } from "../domain/types.js";
import { assessReasonQuality, summarizeReasonQualityNotes } from "../agent/providerFailureClassifier.js";
import { isRecord } from "../agent/utils.js";

export interface TransitionReasonQuality {
  quality?: string;
  notes?: string[];
  source: "live_additive_applied" | "shadow" | "none";
}

export function transitionReasonQuality(
  transition: JsonRecord,
  shadowDecision?: JsonRecord
): TransitionReasonQuality {
  if (isLiveAdditiveApplied(transition) && isRecord(transition.llmDecision) && typeof transition.llmDecision.reason === "string") {
    const assessment = assessReasonQuality(transition.llmDecision.reason);
    return {
      quality: assessment.quality,
      notes: summarizeReasonQualityNotes(assessment.notes),
      source: "live_additive_applied"
    };
  }

  if (typeof shadowDecision?.reasonQuality === "string") {
    return {
      quality: shadowDecision.reasonQuality,
      notes: summarizeReasonQualityNotes(shadowDecision.reasonQualityNotes),
      source: "shadow"
    };
  }

  return { source: "none" };
}

function isLiveAdditiveApplied(transition: JsonRecord): boolean {
  const audit = isRecord(transition.decisionAudit) ? transition.decisionAudit : undefined;
  if (!audit) return false;
  if (audit.liveAdditiveApplied === true) return true;
  if (isRecord(audit.raw) && isRecord(audit.raw.llm)) {
    return audit.raw.llm.liveAdditiveApplied === true;
  }
  return false;
}
