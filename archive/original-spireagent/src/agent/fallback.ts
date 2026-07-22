import type { DecisionRoute, FallbackPolicyAudit, NormalizedState, ScoredCandidate } from "./types.js";
import { cardBlock, cardDamage, getIncomingDamage, getLivingEnemies } from "./state.js";

export interface FallbackSelection {
  candidate?: ScoredCandidate;
  audit: FallbackPolicyAudit;
}

export function selectFallbackCandidate(input: {
  state: NormalizedState;
  route: DecisionRoute;
  candidates: ScoredCandidate[];
  localTop?: ScoredCandidate;
  fallbackReason?: string;
}): FallbackSelection {
  const original = input.localTop ?? input.candidates[0];
  const baseAudit: FallbackPolicyAudit = {
    name: "local_top",
    originalCandidateId: original?.id,
    selectedCandidateId: original?.id,
    reasons: ["fallback 使用本地最高分候选"]
  };

  if (!original) {
    return { audit: { ...baseAudit, reasons: ["没有可用 fallback 候选"] } };
  }

  if (!shouldUseConservativeCombatFallback(input.state, input.route, input.fallbackReason)) {
    return { candidate: original, audit: baseAudit };
  }

  if (isLikelyLethal(input.state, original)) {
    return {
      candidate: original,
      audit: {
        ...baseAudit,
        reasons: ["本地最高分候选疑似斩杀，保留攻击计划"]
      }
    };
  }

  const pressure = combatPressure(input.state);
  const originalSafety = safetyScore(input.state, original, pressure);
  const safer = input.candidates
    .map((candidate) => ({
      candidate,
      safety: safetyScore(input.state, candidate, pressure)
    }))
    .filter((item) => Number.isFinite(item.safety.score))
    .sort((a, b) => b.safety.score - a.safety.score)[0];

  if (!safer) {
    return { candidate: original, audit: baseAudit };
  }

  const shouldSwitch =
    safer.candidate.id !== original.id &&
    safer.safety.score >= originalSafety.score + 6 &&
    (pressure.isHigh || hasSevereRisk(original) || original.confidence < 0.45);

  if (!shouldSwitch) {
    return {
      candidate: original,
      audit: {
        ...baseAudit,
        reasons: [
          "触发保守 fallback 检查，但本地最高分仍足够安全",
          ...originalSafety.reasons.slice(0, 2)
        ]
      }
    };
  }

  return {
    candidate: safer.candidate,
    audit: {
      name: "conservative_combat",
      originalCandidateId: original.id,
      selectedCandidateId: safer.candidate.id,
      reasons: [
        `LLM ${input.fallbackReason ?? "fallback"} 时进入高压战斗保守策略`,
        ...pressure.reasons,
        ...safer.safety.reasons.slice(0, 3),
        `原候选: ${original.label}`
      ]
    }
  };
}

function shouldUseConservativeCombatFallback(
  state: NormalizedState,
  route: DecisionRoute,
  fallbackReason: string | undefined
): boolean {
  if (!fallbackReason) return false;
  if (state.screen !== "combat") return false;
  return route.kind === "llm_required" || route.kind === "local_recommended_llm_arbitrate";
}

function combatPressure(state: NormalizedState): {
  incoming: number;
  unblocked: number;
  isHigh: boolean;
  reasons: string[];
} {
  const incoming = getIncomingDamage(state);
  const unblocked = Math.max(0, incoming - state.player.block);
  const hp = Math.max(1, state.player.hp);
  const isHigh = unblocked >= Math.max(10, hp * 0.35) || unblocked >= hp - 4;
  const reasons = [`incoming=${incoming}`, `unblocked=${unblocked}`, `hp=${state.player.hp}`];
  if (isHigh) reasons.push("当前为高压或接近生死回合");
  return { incoming, unblocked, isHigh, reasons };
}

function safetyScore(
  state: NormalizedState,
  candidate: ScoredCandidate,
  pressure: ReturnType<typeof combatPressure>
): { score: number; reasons: string[] } {
  let score = candidate.score * 0.25 + candidate.confidence * 12;
  const reasons: string[] = [];

  const action = candidate.action;

  if (action.kind === "play_card") {
    const card = state.player.hand.find((handCard) => handCard.index === action.cardIndex);
    const block = card ? cardBlock(card) : 0;
    const damage = card ? cardDamage(card) : 0;

    if (block > 0) {
      score += block * (pressure.isHigh ? 3.4 : 2.1);
      reasons.push(`补格挡 ${block}`);
    }
    if (damage > 0 && !isLikelyLethal(state, candidate)) {
      score -= pressure.isHigh ? Math.min(18, pressure.unblocked * 0.7) : 2;
      reasons.push("非斩杀攻击在高压回合降权");
    }
    if (isLikelyLethal(state, candidate)) {
      score += 80;
      reasons.push("疑似斩杀优先");
    }
  }

  if (action.kind === "use_potion") {
    score += pressure.isHigh ? 18 : 4;
    reasons.push("高压回合允许考虑药水");
  }

  if (action.kind === "end_turn") {
    score -= pressure.unblocked * 2;
    if (pressure.unblocked === 0) {
      score += 8;
      reasons.push("已无未格挡伤害");
    } else {
      reasons.push("结束回合仍会掉血");
    }
  }

  if (hasSevereRisk(candidate)) {
    score -= 28;
    reasons.push("候选含严重风险");
  }
  if (candidate.risks.length === 0) {
    score += 3;
  }
  if (/补格挡|保命|防御|药水|虚弱|weak|block/i.test([...candidate.reasons, candidate.label].join(" "))) {
    score += pressure.isHigh ? 12 : 5;
    reasons.push("候选文本体现保命价值");
  }

  return {
    score,
    reasons: reasons.length ? reasons : ["候选安全性无明显加分"]
  };
}

function hasSevereRisk(candidate: ScoredCandidate): boolean {
  return candidate.risks.some((risk) => /生死|高压|少挡血|死亡|用光能量|unsafe|lethal/i.test(risk));
}

function isLikelyLethal(state: NormalizedState, candidate: ScoredCandidate): boolean {
  if (candidate.score >= 100 || candidate.reasons.some((reason) => /斩杀|lethal/i.test(reason))) {
    return true;
  }

  const action = candidate.action;
  if (action.kind !== "play_card") return false;
  const card = state.player.hand.find((handCard) => handCard.index === action.cardIndex);
  if (!card) return false;
  const damage = cardDamage(card);
  if (damage <= 0) return false;

  const targetId = action.target;
  const targets = targetId
    ? getLivingEnemies(state).filter((enemy) => enemy.id === targetId)
    : getLivingEnemies(state);

  return targets.some((enemy) => damage >= Math.max(0, enemy.hp + enemy.block));
}
