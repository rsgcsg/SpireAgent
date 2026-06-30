import type {
  CandidateAction,
  DecisionRoute,
  JsonRecord,
  NormalizedCard,
  NormalizedState,
  RunMemory,
  ScoredCandidate,
  StrategyParams
} from "./types.js";
import {
  cardBlock,
  cardDamage,
  cardDraw,
  cardEnergyGain,
  cleansesProblemCards,
  countDangerousProblemCards,
  countProblemCards,
  entityStatusAmount,
  getIncomingDamage,
  getLivingEnemies,
  hasEntityStatus,
  hasStatusByName,
  isAttack,
  isDangerousProblemCard,
  isProblemCard,
  isPower,
  isSkill,
  problemCardsCreatedBy
} from "./state.js";
import { asNumber, asString, isRecord } from "./utils.js";

export interface ScoringResult {
  candidates: ScoredCandidate[];
  top?: ScoredCandidate;
  shouldAskLlm: boolean;
  uncertaintyReasons: string[];
  route: DecisionRoute;
}

export function scoreCandidates(
  state: NormalizedState,
  candidates: CandidateAction[],
  run: RunMemory,
  strategy: StrategyParams
): ScoringResult {
  const scored = candidates
    .map((candidate) => scoreCandidate(state, candidate, run, strategy))
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const second = scored[1];
  const gap = top && second ? top.score - second.score : top ? 999 : 0;
  const uncertaintyReasons: string[] = [];

  if (!top) {
    uncertaintyReasons.push("no_candidates");
  }
  if (top?.requiresLlm) {
    uncertaintyReasons.push("strategic_screen");
  }
  if (gap < strategy.thresholds.llmUncertaintyMargin) {
    uncertaintyReasons.push("small_score_gap");
  }
  if ((top?.confidence ?? 0) < strategy.thresholds.localConfidence) {
    uncertaintyReasons.push("low_confidence");
  }
  if (isLifeOrDeath(state)) {
    uncertaintyReasons.push("life_or_death");
  }
  if (hasComboComplexity(state)) {
    uncertaintyReasons.push("possible_combo");
  }

  const route = classifyDecisionRoute(state, scored, uncertaintyReasons, top, second, gap, strategy);
  const shouldAskLlm = route.shouldAskLlm;

  return {
    candidates: scored,
    top,
    shouldAskLlm,
    uncertaintyReasons,
    route
  };
}

function classifyDecisionRoute(
  state: NormalizedState,
  scored: ScoredCandidate[],
  uncertaintyReasons: string[],
  top: ScoredCandidate | undefined,
  second: ScoredCandidate | undefined,
  gap: number,
  strategy: StrategyParams
): DecisionRoute {
  if (!top) {
    return {
      kind: "no_op_or_poll",
      shouldAskLlm: false,
      llmPriority: "none",
      reasons: ["no actionable candidates"]
    };
  }

  const forcedLocal = isForcedLocalDecision(scored);
  if (forcedLocal) {
    return {
      kind: "forced_local",
      shouldAskLlm: false,
      llmPriority: "none",
      reasons: [`single forced ${top.action.kind} action`]
    };
  }

  const strategicScreen = state.screen !== "combat";
  const obviousLocalStrategic = isObviousLocalStrategicDecision(state, top, second, gap, strategy);
  const obviousLocalCombat = isObviousLocalCombatDecision(state, top, second, gap, strategy);
  const strategicAmbiguity =
    strategicScreen &&
    !obviousLocalStrategic &&
    ((uncertaintyReasons.includes("small_score_gap") || uncertaintyReasons.includes("low_confidence")) &&
      gap < strategy.thresholds.obviousScoreGap);
  const strategicRequiresLlm =
    strategicScreen && uncertaintyReasons.includes("strategic_screen") && !obviousLocalStrategic;
  const combatCritical =
    state.screen === "combat" &&
    (uncertaintyReasons.includes("life_or_death") || uncertaintyReasons.includes("possible_combo")) &&
    !obviousLocalCombat;

  if (combatCritical) {
    return {
      kind: "llm_required",
      shouldAskLlm: true,
      llmPriority: "required",
      reasons: uncertaintyReasons.filter((reason) => reason === "life_or_death" || reason === "possible_combo")
    };
  }

  if (strategicRequiresLlm) {
    return {
      kind: "llm_required",
      shouldAskLlm: true,
      llmPriority: "required",
      reasons: ["strategic screen", ...uncertaintyReasons]
    };
  }

  if (strategicAmbiguity) {
    return {
      kind: "local_recommended_llm_arbitrate",
      shouldAskLlm: true,
      llmPriority: "optional",
      reasons: ["strategic ambiguity", ...uncertaintyReasons]
    };
  }

  if (obviousLocalStrategic || obviousLocalCombat) {
    return {
      kind: "obvious_local",
      shouldAskLlm: false,
      llmPriority: "none",
      reasons: [`top candidate is obvious`, `score gap=${gap.toFixed(1)}`]
    };
  }

  if (state.screen === "combat") {
    return {
      kind: "local_fast_combat",
      shouldAskLlm: false,
      llmPriority: "none",
      reasons: uncertaintyReasons.length ? uncertaintyReasons : ["ordinary combat tick"]
    };
  }

  return {
    kind: "local_confident",
    shouldAskLlm: false,
    llmPriority: "none",
    reasons: uncertaintyReasons.length ? uncertaintyReasons : ["local score is sufficient"]
  };
}

function isObviousLocalCombatDecision(
  state: NormalizedState,
  top: ScoredCandidate | undefined,
  second: ScoredCandidate | undefined,
  gap: number,
  strategy: StrategyParams
): boolean {
  if (state.screen !== "combat" || !top) return false;
  if (top.confidence < 0.9 || top.score < 100) return false;
  if (gap >= strategy.thresholds.obviousScoreGap * 3) return true;
  return Boolean(second && second.confidence >= 0.9 && second.score >= 100);
}

function isForcedLocalDecision(candidates: ScoredCandidate[]): boolean {
  if (candidates.length !== 1) return false;
  const kind = candidates[0]?.action.kind;
  return kind === "proceed" || kind === "end_turn" || kind === "choose_map_node" || kind === "claim_reward";
}

function isObviousLocalStrategicDecision(
  state: NormalizedState,
  top: ScoredCandidate | undefined,
  second: ScoredCandidate | undefined,
  gap: number,
  strategy: StrategyParams
): boolean {
  if (state.screen !== "map" || !top || top.action.kind !== "choose_map_node") return false;
  if (top.score < 0 || hasSevereRouteRisk(top)) return false;
  if (gap >= strategy.thresholds.obviousScoreGap) return true;
  if (!second || second.action.kind !== "choose_map_node") return false;
  return mapNodeKind(top.label) === mapNodeKind(second.label) && Math.abs(top.score - second.score) < 0.25;
}

function hasSevereRouteRisk(candidate: ScoredCandidate): boolean {
  return candidate.risks.some((risk) => /精英风险|路线太贪|死亡|高风险/i.test(risk));
}

function mapNodeKind(label: string): string {
  return label.replace(/^.*?:\s*/, "").trim().toLowerCase();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function scoreCandidate(
  state: NormalizedState,
  candidate: CandidateAction,
  run: RunMemory,
  strategy: StrategyParams
): ScoredCandidate {
  switch (candidate.kind) {
    case "play_card":
      return scorePlayCard(state, candidate, run, strategy);
    case "end_turn":
      return scoreEndTurn(state, candidate, strategy);
    case "use_potion":
      return scorePotion(state, candidate, strategy);
    case "select_card_reward":
    case "skip_card_reward":
      return scoreCardReward(state, candidate, run, strategy);
    case "claim_reward":
      return scoreClaimReward(candidate);
    case "claim_treasure_relic":
      return withScore(candidate, 42, 0.9, ["领取宝箱遗物"], []);
    case "choose_map_node":
      return scoreMapNode(state, candidate, run, strategy);
    case "choose_rest_option":
      return scoreRestOption(state, candidate, strategy);
    case "event_choose_option":
      return scoreEventOption(state, candidate, run, strategy);
    case "shop_purchase":
      return scoreShopPurchase(candidate, run, strategy);
    case "select_card":
    case "combat_select_card":
      return scoreSelectCard(candidate);
    case "bundle_select":
      return scoreBundleSelect(candidate, run, strategy);
    case "bundle_confirm_selection":
      return withScore(candidate, 25, 0.9, ["确认已预览卡包"], []);
    case "bundle_cancel_selection":
      return withScore(candidate, -10, 0.35, ["可取消卡包选择"], ["通常不应放弃 Neow/遗物给的卡包"]);
    case "confirm_selection":
    case "combat_confirm_selection":
      return withScore(candidate, 20, 0.9, ["确认已选择卡牌"], []);
    case "cancel_selection":
      return withScore(candidate, -5, 0.4, ["可取消"], ["可能错过收益"]);
    case "menu_select":
      return scoreMenuSelect(candidate, run);
    case "proceed":
      return withScore(candidate, 1, 0.75, ["默认继续"], []);
    default:
      return withScore(candidate, 0, 0.2, ["未知动作"], ["unknown_action"]);
  }
}

function scoreBundleSelect(candidate: CandidateAction, run: RunMemory, strategy: StrategyParams): ScoredCandidate {
  const cards = Array.isArray(candidate.facts?.cards) ? candidate.facts.cards.filter(isRecord) : [];
  let score = 4;
  const reasons: string[] = [];
  const risks: string[] = [];

  for (const card of cards) {
    const name = asString(card.name ?? card.id, "");
    const type = asString(card.type, "").toLowerCase();
    const rarity = asString(card.rarity, "").toLowerCase();
    const description = asString(card.description, "").toLowerCase();
    const cost = asNumber(card.cost, Number.NaN);
    const text = `${name} ${type} ${rarity} ${description}`.toLowerCase();

    if (/block|格挡/.test(text)) {
      score += 6 + run.deficits.block * 8 * strategy.weights.block;
      reasons.push(`${name || "卡牌"}补防御`);
    }
    if (/damage|伤害/.test(text) || type.includes("attack")) {
      score += 4 + run.deficits.damage * 5 * strategy.weights.damage;
      reasons.push(`${name || "卡牌"}补输出`);
    }
    if (/draw|抽/.test(text)) {
      score += 5 + run.deficits.draw * 6 * strategy.weights.draw;
      reasons.push(`${name || "卡牌"}补抽牌`);
    }
    if (/energy|能量|costs? 0|费用变为 0/i.test(text)) {
      score += 4 + run.deficits.energy * 5 * strategy.weights.energy;
      reasons.push(`${name || "卡牌"}改善费用/能量`);
    }
    if (/vulnerable|weak|易伤|虚弱/.test(text)) {
      score += 4;
      reasons.push(`${name || "卡牌"}提供易伤/控制`);
    }
    if (rarity.includes("uncommon")) score += 2;
    if (rarity.includes("rare")) score += 4;
    if (Number.isFinite(cost) && cost >= 2 && run.deficits.energy > 0.6) {
      score -= 2;
      risks.push(`${name || "卡牌"}费用偏高`);
    }
    if (/lose \d+ hp|失去.*生命|自损/.test(text)) {
      score -= 3 * strategy.weights.restSafety;
      risks.push(`${name || "卡牌"}会自损`);
    }
  }

  if (cards.length >= 3) {
    score -= Math.max(0, run.deficits.deck_thinness - 0.4) * 6;
    risks.push("一次加入多张牌会增厚牌组");
  }

  return withScore(
    candidate,
    score,
    0.5,
    unique(reasons).slice(0, 5).length ? unique(reasons).slice(0, 5) : ["卡包选择"],
    unique(risks).slice(0, 4)
  );
}

function scoreMenuSelect(candidate: CandidateAction, run: RunMemory): ScoredCandidate {
  const option = String(candidate.action.kind === "menu_select" ? candidate.action.option : "").toLowerCase();
  const menuScreen = asString(candidate.facts?.menuScreen).toLowerCase();
  const text = `${candidate.label} ${option} ${menuScreen}`.toLowerCase();
  const defectAlreadySelected = hasRecentMenuChoice(run, /菜单 defect/i, 120_000);
  let score = 0;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (/quit|exit|退出/.test(text)) {
    return withScore(candidate, -999, 0.95, [], ["不要退出游戏"]);
  }

  if (/singleplayer|single player|单人/.test(text)) {
    score += 50;
    reasons.push("进入单人模式");
  }
  if (/defect|故障|机器人/.test(text)) {
    score += 70;
    reasons.push("本项目当前优先故障机器人");
    if (menuScreen.includes("character_select") && defectAlreadySelected) {
      score -= 60;
      risks.push("本轮菜单已点过 Defect，下一步应确认出发");
    }
  }
  if (/start|new|begin|embark|开始|新局|出发/.test(text)) {
    score += 35;
    reasons.push("开始新局");
    if (menuScreen.includes("character_select") && !defectAlreadySelected) {
      score -= 90;
      risks.push("尚未在当前菜单流程选择 Defect，不应出发");
    }
  }
  if (/confirm|继续|proceed/.test(text)) {
    score += 20;
    reasons.push("确认菜单流程");
  }
  if (menuScreen.includes("character_select") && defectAlreadySelected && /embark|confirm|start|开始|出发/.test(text)) {
    score += 70;
    reasons.push("Defect 已选择，确认出发");
  }
  if (/main_menu/.test(text)) {
    score += 10;
    reasons.push("返回主菜单");
  }
  if (/ironclad|silent|watcher|观者|战士|猎手/.test(text) && !/defect|故障|机器人/.test(text)) {
    score -= 25;
    risks.push("暂不测试其他角色");
  }
  if (/multiplayer|compendium|timeline|settings|多人|图鉴|设置/.test(text)) {
    score -= 20;
    risks.push("非自动游玩入口");
  }

  return withScore(candidate, score, score >= 30 ? 0.85 : 0.4, reasons.length ? reasons : ["菜单选项"], risks);
}

function hasRecentMenuChoice(run: RunMemory, pattern: RegExp, maxAgeMs: number): boolean {
  const now = Date.now();
  return run.keyDecisions.slice(-8).some((decision) => {
    if (decision.screen !== "menu" || !pattern.test(decision.chosen)) return false;
    const at = Date.parse(decision.at);
    return Number.isFinite(at) && now - at <= maxAgeMs;
  });
}

function scoreEventOption(
  state: NormalizedState,
  candidate: CandidateAction,
  run: RunMemory,
  strategy: StrategyParams
): ScoredCandidate {
  const option = candidate.facts?.option;
  const optionText = isRecord(option)
    ? `${option.label ?? ""} ${option.name ?? ""} ${option.title ?? ""} ${option.text ?? ""} ${option.description ?? ""} ${option.effect ?? ""}`
    : "";
  const text = `${candidate.label} ${optionText}`.toLowerCase();
  const hpRatio = state.player.hp / Math.max(1, state.player.maxHp);
  let score = 4;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (/proceed|continue|继续|离开/.test(text)) {
    return withScore(candidate, 30, 0.95, ["事件已完成，继续"], []);
  }

  if (/curse|cursed|诅咒/.test(text)) {
    score -= 35;
    risks.push("避免诅咒污染牌组");
  }
  if (/lose .*hp|失去.*生命|扣.*血|damage yourself|max hp|最大生命/.test(text)) {
    const penalty = hpRatio < 0.55 ? 28 : 16;
    score -= penalty * strategy.weights.restSafety;
    risks.push("事件代价会压低血量安全线");
  }
  if (/gold|金币/.test(text)) {
    score += 8;
    reasons.push("金币提高商店选择");
  }
  if (/relic|遗物/.test(text) || ((state.floor ?? 0) <= 1 && !/curse|cursed|诅咒/.test(text))) {
    score += 16;
    reasons.push("早期遗物/Neow 奖励价值高");
  }
  if (/remove|delete|删|移除/.test(text)) {
    score += 14 + run.deficits.deck_thinness * 10;
    reasons.push("删牌提升牌组质量");
  }
  if (/transform|变化|转换|变/.test(text)) {
    score += 12;
    reasons.push("早期变 Strike 通常提高上限");
  }
  if (/upgrade|smith|升级|锻造/.test(text)) {
    score += 12;
    reasons.push("升级提高核心牌效率");
  }
  if (/potion|药水|phial|holster/.test(text)) {
    score += 6 + run.deficits.potions * 8;
    reasons.push("药水资源提升安全性");
  }
  if (/heal|治疗|恢复/.test(text)) {
    score += run.deficits.healing * 18;
    reasons.push("恢复血量降低路线风险");
  }

  const confidence = risks.length === 0 && reasons.length > 0 ? 0.65 : 0.45;
  return withScore(candidate, score, confidence, reasons.length ? reasons : ["事件选项需战略判断"], risks);
}

function scoreShopPurchase(
  candidate: CandidateAction,
  run: RunMemory,
  strategy: StrategyParams
): ScoredCandidate {
  const item = candidate.facts?.item;
  if (!isRecord(item)) return withScore(candidate, -999, 0.1, ["缺少商品信息"], ["invalid"]);
  if (item.is_stocked === false || item.can_afford === false) {
    return withScore(candidate, -999, 0.9, ["买不起或无库存"], ["unavailable"]);
  }

  const category = asString(item.category).toLowerCase();
  const price = Math.max(1, asNumber(item.price, 999));
  const name = asString(item.card_name ?? item.relic_name ?? item.potion_name ?? item.category ?? item.id);
  const type = asString(item.card_type).toLowerCase();
  const desc = asString(item.card_description ?? item.relic_description ?? item.potion_description).toLowerCase();
  let score = 0;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (item.on_sale === true) {
    score += 8;
    reasons.push("打折");
  }

  if (category === "card") {
    if (type.includes("attack")) {
      score += 8 + run.deficits.damage * 14;
      reasons.push("补输出牌");
    }
    if (type.includes("skill")) {
      score += 4;
    }
    if (type.includes("power")) {
      score += run.deficits.scaling * 18 * strategy.weights.scaling;
      reasons.push("补成长牌");
    }
    if (/0/.test(asString(item.card_cost))) {
      score += 7;
      reasons.push("0 费灵活");
    }
    if (/vulnerable|易伤/.test(desc)) {
      score += 10;
      reasons.push("易伤提高击杀速度");
    }
    if (/weak|虚弱/.test(desc)) {
      score += 8 + run.deficits.block * 6;
      reasons.push("弱化缓解防御压力");
    }
    if (/block|格挡/.test(desc)) {
      score += run.deficits.block * 16;
      reasons.push("补防御");
    }
    if (/channel|lightning|frost|dark|充能|闪电|冰霜|黑暗/.test(desc)) {
      score += 8;
      reasons.push("补充能球组件");
    }
    if (/draw|抽/.test(desc)) {
      score += run.deficits.draw * 14;
      reasons.push("补抽牌");
    }
  } else if (category === "relic") {
    score += 28;
    reasons.push("遗物通常高价值");
  } else if (category === "potion") {
    score += 8 + run.deficits.potions * 10;
    reasons.push("补药水位");
  } else if (category === "card_removal") {
    score += run.deficits.deck_thinness * 18;
    reasons.push("删牌提高牌组质量");
  }

  score -= price / 12;
  if (price > 80 && category === "card") {
    risks.push("早期买昂贵牌会影响后续资源");
  }
  if (/panic button/i.test(name)) {
    risks.push("Panic Button 有后续不能格挡的风险");
    score -= 5;
  }

  return withScore(candidate, score, 0.55, reasons.length ? reasons : ["商店商品"], risks);
}

function scoreSelectCard(candidate: CandidateAction): ScoredCandidate {
  const card = candidate.facts?.card;
  if (!isRecord(card)) return withScore(candidate, 0, 0.2, ["缺少卡牌信息"], ["invalid"]);

  const prompt = asString(candidate.facts?.prompt).toLowerCase();
  const screenType = asString(candidate.facts?.screenType).toLowerCase();
  const id = asString(card.id).toLowerCase();
  const name = asString(card.name).toLowerCase();
  const type = asString(card.type_key ?? card.type).toLowerCase();
  const text = `${id} ${name} ${type}`;
  let score = 0;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (prompt.includes("transform") || screenType.includes("transform")) {
    if (text.includes("strike") || text.includes("打击")) {
      score += 30;
      reasons.push("变牌优先转换 Strike");
    } else if (text.includes("defend") || text.includes("防御")) {
      score += 18;
      reasons.push("Defend 可转但优先级低于 Strike");
    } else {
      score -= 30;
      risks.push("不要转换核心基础牌");
    }
  } else if (prompt.includes("remove") || prompt.includes("移除")) {
    if (text.includes("strike") || text.includes("打击")) {
      score += 28;
      reasons.push("删牌优先删 Strike");
    } else if (text.includes("defend") || text.includes("防御")) {
      score += 12;
      reasons.push("可删 Defend 但需看防御缺口");
    } else {
      score -= 20;
      risks.push("不要轻易删核心牌");
    }
  } else if (prompt.includes("upgrade") || prompt.includes("升级")) {
    if (text.includes("zap")) {
      score += 25;
      reasons.push("故障机器人早期升级 Zap 很强");
    } else if (text.includes("dualcast")) {
      score += 16;
      reasons.push("Dualcast 升级可降低费用");
    } else {
      score += type.includes("attack") ? 8 : 10;
      reasons.push("升级候选");
    }
  } else {
    score += type.includes("basic") ? 5 : 10;
    reasons.push("选牌界面默认评分");
  }

  return withScore(candidate, score, score > 20 ? 0.75 : 0.45, reasons, risks);
}

function scorePlayCard(
  state: NormalizedState,
  candidate: CandidateAction,
  run: RunMemory,
  strategy: StrategyParams
): ScoredCandidate {
  const card = candidate.facts?.card;
  if (!isRecord(card)) return withScore(candidate, -999, 0, ["缺少卡牌信息"], ["invalid"]);

  const normalized = card as unknown as NormalizedCard;
  const incoming = getIncomingDamage(state);
  const unblocked = Math.max(0, incoming - state.player.block);
  const target = candidate.facts?.target;
  const targetHp = isRecord(target) ? asNumber(target.hp) + asNumber(target.block) : getLivingEnemies(state)[0]?.hp ?? 0;
  const baseDamage = estimateDamage(state, normalized);
  const targetStatuses = entityStatuses(target);
  const targetVulnerable = hasEntityStatus(targetStatuses, [/vulnerable/i, /易伤/]);
  const damage = Math.round(baseDamage * (targetVulnerable ? 1.5 : 1));
  const block = cardBlock(normalized);
  const draw = cardDraw(normalized);
  const energy = cardEnergyGain(normalized);
  const text = `${normalized.name} ${normalized.id} ${normalized.description}`.toLowerCase();
  const cost = numericCost(normalized.cost);
  const usefulBlockNow = Math.min(block, unblocked);
  const handProblemCount = countProblemCards(state.player.hand);
  const dangerousHandProblemCount = countDangerousProblemCards(state.player.hand);
  const createsProblems = problemCardsCreatedBy(normalized);
  const clearsProblems = cleansesProblemCards(normalized);
  const playerVulnerable = hasEntityStatus(state.player.status, [/vulnerable/i, /易伤/]);
  const playerFrail = hasEntityStatus(state.player.status, [/frail/i, /脆弱/]);
  const playerWeak = hasEntityStatus(state.player.status, [/weak/i, /虚弱/]);
  const finishesTargetWithHand =
    damage > 0 && targetHp > 0 && damage < targetHp && canFinishTargetWithHand(state, normalized, target, damage, targetHp);
  let score = 0;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (isProblemCard(normalized) && (isDangerousProblemCard(normalized) || hasStatusByName(normalized, "beckon"))) {
    score += 50 * strategy.weights.statusControl;
    reasons.push("清理危险状态牌");
  } else if (isProblemCard(normalized)) {
    score += 8 * strategy.weights.statusControl;
    reasons.push("清理普通状态/诅咒牌");
  }

  if (clearsProblems && handProblemCount > 0) {
    score += (24 + handProblemCount * 12 + dangerousHandProblemCount * 18) * strategy.weights.statusControl;
    reasons.push(`处理手牌状态污染 ${handProblemCount}`);
  }

  if (createsProblems > 0) {
    const handInjection = /hand|手牌/.test(text);
    const basePenalty = createsProblems * (handInjection ? 10 : 6);
    if (unblocked <= 0 && damage < targetHp) {
      score -= basePenalty + handProblemCount * 2;
      risks.push("会往手牌/牌堆塞状态牌，当前压力不值得");
    } else if (block > 0 && usefulBlockNow > 0) {
      score -= Math.max(2, basePenalty * 0.4);
      risks.push("保命可接受，但会增加状态牌负担");
    } else {
      score -= basePenalty;
      risks.push("会增加状态牌负担");
    }
  }

  if (damage > 0) {
    score += damage * strategy.weights.damage;
    reasons.push(`输出 ${damage}`);
    if (targetIsAttacking(target)) {
      score += 4;
      reasons.push("优先压低正在攻击的敌人");
    }
    const threatScore = targetThreatScore(target);
    if (threatScore > 0) {
      score += threatScore;
      reasons.push("优先处理带成长/高威胁敌人");
    }
    if (targetVulnerable && baseDamage > 0) {
      reasons.push("目标易伤，攻击收益更高");
    }
    if (playerWeak && damage < targetHp) {
      score -= 3;
      risks.push("自身虚弱时非斩杀攻击效率下降");
    }
    if (damage >= targetHp && targetHp > 0) {
      score += 100 * strategy.weights.lethal;
      reasons.push("可斩杀目标");
    } else if (finishesTargetWithHand) {
      score += 90 * strategy.weights.lethal;
      reasons.push("可接后续牌完成斩杀");
    }
    if (isLethalPressureTurn(state, unblocked) && damage < targetHp && block <= 0 && !canMitigateIncoming(text)) {
      if (finishesTargetWithHand) {
        risks.push("需要按计划接后续攻击完成斩杀");
      } else {
        score -= 80 + cost * 5;
        risks.push("生死回合非斩杀且不保命");
        if (cost >= state.player.energy) {
          score -= 20;
          risks.push("会用光能量导致无法补防");
        }
      }
    }
    if (isHighPressureTurn(state, unblocked) && damage < targetHp && !finishesTargetWithHand) {
      score -= 3;
      risks.push("高压回合非斩杀攻击会少挡血");
      if (block <= 0 && !canMitigateIncoming(text)) {
        const blockPenalty = defenseEnergyPressurePenalty(state, normalized, unblocked, strategy);
        if (blockPenalty > 0) {
          score -= blockPenalty;
          risks.push(`会挤占防御能量，预计多掉 ${Math.round(blockPenalty / (strategy.weights.block * 2))} HP`);
        }
      }
    }
    if (state.enemies.length > 1 && (normalized.targetType ?? "").toLowerCase().includes("all")) {
      score += state.enemies.length * 5;
      reasons.push("群体伤害");
    }
    if (baseDamage > 0 && baseDamage <= 4 && hasEntityStatus(targetStatuses, [/plated|armor|metallicize/i, /护甲|镀层|金属化/])) {
      score -= 3;
      risks.push("低伤害打进护甲/镀层效率低");
    }
  }

  if (/vulnerable|易伤/.test(text)) {
    score += 9;
    reasons.push("先挂易伤提高后续攻击收益");
  }

  if (/weak|虚弱/.test(text)) {
    score += 7 + run.deficits.block * 6;
    reasons.push("虚弱降低受击风险");
  }

  if (cost === 0 && isSetupOrDebuff(normalized)) {
    score += 6;
    reasons.push("0 费工具牌优先打出");
  }

  if (cost > 0 && hasUnplayedZeroCostSetup(state, normalized.index)) {
    score -= 3;
    risks.push("手里还有 0 费易伤/工具牌，先打它更好");
  }

  if (block > 0) {
    const usefulBlock = Math.min(block, unblocked);
    score += usefulBlock * strategy.weights.block;
    if (unblocked <= 0) {
      score -= block * 0.35;
      risks.push("当前无防御压力");
    } else {
      reasons.push(`补格挡 ${usefulBlock}/${unblocked}`);
      const pressureBonus = blockPressureBonus(state, usefulBlock, unblocked, strategy);
      if (pressureBonus > 0) {
        score += pressureBonus;
        reasons.push("高压回合优先保血");
      }
      if (playerVulnerable || playerFrail) {
        score += usefulBlock * 0.45;
        reasons.push("自身易伤/脆弱，优先稳血");
      }
    }
  }

  if (draw > 0) {
    score += draw * (2 + run.deficits.draw * 8) * strategy.weights.draw;
    reasons.push(`过牌 ${draw}`);
  }

  if (energy > 0) {
    score += energy * (2 + run.deficits.energy * 6) * strategy.weights.energy;
    reasons.push(`回能 ${energy}`);
  }

  if (normalized.id.toLowerCase() === "zap" || /channel.*lightning|闪电/.test(text)) {
    score += 4;
    reasons.push("充能闪电球提供回合末伤害");
    if (canEnableDualcastCombo(state, normalized)) {
      score += 12;
      reasons.push("可接 Dualcast 爆发");
    }
  }

  if (isPower(normalized)) {
    score += (state.round && state.round <= 2 ? 12 : 5) * strategy.weights.scaling;
    reasons.push("能力牌提供成长");
    if (unblocked > 0 && state.player.hp <= unblocked + 5) {
      score -= 20;
      risks.push("生死回合打慢牌");
    }
  }

  if (isSkill(normalized) && text.includes("upgrade")) {
    score += 4;
    reasons.push("升级/工具收益");
  }

  if (isAttack(normalized) && run.deficits.damage > 0.7) {
    score += 5;
  }

  if (normalized.cost === "X" || text.includes("x cost")) {
    risks.push("X 费牌需要上下文");
    score -= 2;
  }

  const confidence = confidenceFromReasons(score, reasons, risks);
  return withScore(candidate, score, confidence, reasons, risks);
}

function estimateDamage(state: NormalizedState, card: NormalizedCard): number {
  const base = cardDamage(card);
  const text = `${card.id} ${card.name} ${card.description}`.toLowerCase();

  const hitsMatch = text.match(/hits?\s+(\d+)\s+times?/i);
  if (hitsMatch && base > 0) {
    return base * Number(hitsMatch[1]);
  }

  if (text.includes("dualcast") || text.includes("evoke your rightmost orb twice")) {
    if (state.player.orbs.length === 0) return 0;
    const rightmost = state.player.orbs[state.player.orbs.length - 1];
    const evoke = asNumber(rightmost?.evoke_val ?? rightmost?.evokeVal, 0);
    return evoke > 0 ? evoke * 2 : 0;
  }

  if (text.includes("evoke") && state.player.orbs.length > 0) {
    const rightmost = state.player.orbs[state.player.orbs.length - 1];
    return asNumber(rightmost?.evoke_val ?? rightmost?.evokeVal, base);
  }

  return base;
}

function canFinishTargetWithHand(
  state: NormalizedState,
  currentCard: NormalizedCard,
  target: unknown,
  firstDamage: number,
  targetHp: number
): boolean {
  const remainingHp = targetHp - firstDamage;
  if (remainingHp <= 0) return true;
  const remainingEnergy = state.player.energy - numericCost(currentCard.cost);
  if (remainingEnergy < 0) return false;

  const budget = Math.max(0, Math.floor(remainingEnergy));
  const targetVulnerable = hasEntityStatus(entityStatuses(target), [/vulnerable/i, /易伤/]);
  const bestByEnergy = Array.from({ length: budget + 1 }, () => 0);
  for (const card of state.player.hand) {
    if (!card.canPlay || card.index === currentCard.index || !isAttack(card)) continue;
    const cost = Math.max(0, numericCost(card.cost));
    if (cost > budget) continue;
    const baseDamage = estimateDamage(state, card);
    const damage = Math.round(baseDamage * (targetVulnerable ? 1.5 : 1));
    if (damage <= 0) continue;
    for (let energy = budget; energy >= cost; energy -= 1) {
      bestByEnergy[energy] = Math.max(bestByEnergy[energy], bestByEnergy[energy - cost] + damage);
    }
  }
  return Math.max(...bestByEnergy) >= remainingHp;
}

function numericCost(cost: NormalizedCard["cost"]): number {
  if (typeof cost === "number" && Number.isFinite(cost)) return cost;
  if (typeof cost === "string") {
    const parsed = Number(cost);
    return Number.isFinite(parsed) ? parsed : cost.toLowerCase() === "x" ? 99 : 0;
  }
  return 0;
}

function isSetupOrDebuff(card: NormalizedCard): boolean {
  const text = `${card.id} ${card.name} ${card.description}`.toLowerCase();
  return /vulnerable|易伤|weak|虚弱|channel|充能|lightning|闪电|frost|冰霜|draw|抽|focus|集中/.test(text);
}

function hasUnplayedZeroCostSetup(state: NormalizedState, currentIndex: number): boolean {
  return state.player.hand.some((card) => {
    if (card.index === currentIndex || !card.canPlay) return false;
    return numericCost(card.cost) === 0 && isSetupOrDebuff(card);
  });
}

function isHighPressureTurn(state: NormalizedState, unblocked: number): boolean {
  return unblocked >= Math.max(8, state.player.hp * 0.25);
}

function isLethalPressureTurn(state: NormalizedState, unblocked: number): boolean {
  return unblocked >= state.player.hp;
}

function canMitigateIncoming(text: string): boolean {
  return /weak|虚弱|block|格挡|intangible|无实体/.test(text);
}

function defenseEnergyPressurePenalty(
  state: NormalizedState,
  currentCard: NormalizedCard,
  unblocked: number,
  strategy: StrategyParams
): number {
  if (unblocked <= 0 || currentCard.index === undefined) return 0;
  const currentCost = numericCost(currentCard.cost);
  const remainingEnergy = Math.max(0, state.player.energy - currentCost);
  const availableBlockNow = bestPlayableBlockWithEnergy(state, state.player.energy, currentCard.index);
  const availableBlockAfter = bestPlayableBlockWithEnergy(state, remainingEnergy, currentCard.index);
  const preventableNow = Math.min(unblocked, availableBlockNow);
  const preventableAfter = Math.min(unblocked, availableBlockAfter);
  const extraHpLoss = preventableNow - preventableAfter;
  if (extraHpLoss < 4) return 0;
  return extraHpLoss * strategy.weights.block * 2 + Math.max(0, currentCost) * 4;
}

function bestPlayableBlockWithEnergy(
  state: NormalizedState,
  energyBudget: number,
  excludedCardIndex: number
): number {
  const budget = Math.max(0, Math.floor(energyBudget));
  const bestByEnergy = Array.from({ length: budget + 1 }, () => 0);
  for (const card of state.player.hand) {
    if (!card.canPlay || card.index === excludedCardIndex) continue;
    const block = cardBlock(card);
    if (block <= 0) continue;
    const cost = Math.max(0, numericCost(card.cost));
    if (cost > budget) continue;
    for (let energy = budget; energy >= cost; energy -= 1) {
      bestByEnergy[energy] = Math.max(bestByEnergy[energy], bestByEnergy[energy - cost] + block);
    }
  }
  return Math.max(...bestByEnergy);
}

function blockPressureBonus(
  state: NormalizedState,
  usefulBlock: number,
  unblocked: number,
  strategy: StrategyParams
): number {
  if (usefulBlock <= 0 || !isHighPressureTurn(state, unblocked)) return 0;
  const hpPressure = Math.min(1.5, unblocked / Math.max(1, state.player.hp));
  return usefulBlock * strategy.weights.block * hpPressure * 0.75;
}

function targetIsAttacking(target: unknown): boolean {
  if (!isRecord(target) || !Array.isArray(target.intents)) return false;
  return target.intents.some((intent) => isRecord(intent) && asString(intent.type).toLowerCase().includes("attack"));
}

function canEnableDualcastCombo(state: NormalizedState, card: NormalizedCard): boolean {
  const remainingEnergy = state.player.energy - numericCost(card.cost);
  if (remainingEnergy < 1) return false;
  return state.player.hand.some((handCard) => {
    if (handCard.index === card.index || !handCard.canPlay) return false;
    const text = `${handCard.id} ${handCard.name} ${handCard.description}`.toLowerCase();
    return text.includes("dualcast") || text.includes("evoke your rightmost orb twice");
  });
}

function hasPlayableProgressCard(state: NormalizedState): boolean {
  const handProblemCount = countProblemCards(state.player.hand);
  return state.player.hand.some((card) => {
    if (!card.canPlay) return false;
    const damage = estimateDamage(state, card);
    const block = cardBlock(card);
    return (
      damage > 0 ||
      isPower(card) ||
      isSetupOrDebuff(card) ||
      (handProblemCount > 0 && cleansesProblemCards(card)) ||
      (block > 0 && getIncomingDamage(state) > state.player.block)
    );
  });
}

function scoreEndTurn(
  state: NormalizedState,
  candidate: CandidateAction,
  strategy: StrategyParams
): ScoredCandidate {
  const incoming = getIncomingDamage(state);
  const hpLoss = Math.max(0, incoming - state.player.block);
  const unplayedBeckon = state.player.hand.some((card) => hasStatusByName(card, "beckon"));
  const problemCount = countProblemCards(state.player.hand);
  const dangerousProblemCount = countDangerousProblemCards(state.player.hand);
  const hasPlayableCleanup = state.player.hand.some((card) => card.canPlay && cleansesProblemCards(card));
  let score = 4;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (state.player.energy <= 0) {
    score += 8;
    reasons.push("能量已空");
  }
  if (hpLoss === 0) {
    score += 5;
    reasons.push("已挡住来伤");
  } else {
    score -= hpLoss * strategy.weights.block * 2;
    risks.push(`结束会掉 ${hpLoss} HP`);
  }
  if (unplayedBeckon) {
    score -= 100;
    risks.push("手里有 Beckon/扣血状态");
  }
  if (dangerousProblemCount > 0) {
    score -= dangerousProblemCount * 45;
    risks.push("手里有危险状态牌未处理");
  }
  if (problemCount > 0 && hasPlayableCleanup && state.player.energy > 0) {
    score -= problemCount * 12;
    risks.push("还有可用状态处理牌，先处理手牌污染");
  }
  if (state.player.energy > 0 && hasPlayableProgressCard(state)) {
    const penalty = 10 + state.player.energy * 2;
    score -= penalty;
    risks.push("还有能量和可用进攻/成长牌，空过会丢节奏");
  }
  if (state.player.hp <= hpLoss) {
    score -= 999;
    risks.push("结束会死亡");
  }

  return withScore(
    candidate,
    score,
    hpLoss === 0 && !unplayedBeckon && dangerousProblemCount === 0 && risks.length === 0 ? 0.8 : 0.25,
    reasons,
    risks
  );
}

function scorePotion(
  state: NormalizedState,
  candidate: CandidateAction,
  strategy: StrategyParams
): ScoredCandidate {
  const incoming = getIncomingDamage(state);
  const hpLoss = Math.max(0, incoming - state.player.block);
  const score = hpLoss >= state.player.hp * 0.5 ? 25 * strategy.weights.restSafety : 2;
  return withScore(candidate, score, hpLoss > 0 ? 0.45 : 0.2, ["药水可能扭转危险回合"], ["药水资源有限"]);
}

function scoreCardReward(
  state: NormalizedState,
  candidate: CandidateAction,
  run: RunMemory,
  strategy: StrategyParams
): ScoredCandidate {
  if (candidate.kind === "skip_card_reward") {
    const deckLooksThick = run.deficits.deck_thinness > 0.65;
    return withScore(candidate, deckLooksThick ? 15 : 2, deckLooksThick ? 0.55 : 0.35, ["避免稀释牌组"], []);
  }

  const card = candidate.facts?.card;
  if (!isRecord(card)) return withScore(candidate, 0, 0.2, ["缺少奖励卡信息"], ["invalid"]);

  const type = asString(card.type_key ?? card.type);
  const rarity = asString(card.rarity_key ?? card.rarity);
  const description = asString(card.description ?? card.description_raw);
  const name = asString(card.name ?? card.id);
  const normalized = rewardCardToNormalized(card);
  const createsProblems = problemCardsCreatedBy(normalized);
  const clearsProblems = cleansesProblemCards(normalized);
  let score = rarity === "Rare" || rarity === "稀有" ? 8 : rarity === "Uncommon" || rarity === "罕见" ? 4 : 1;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (type === "Attack" || type === "攻击") {
    score += run.deficits.damage * 20;
    reasons.push("补输出");
  }
  if (type === "Skill" || type === "技能") {
    if (/block|格挡|weak|虚弱|frost|冰/.test(description.toLowerCase())) {
      score += run.deficits.block * 22;
      reasons.push("补防御/弱化");
    }
    if (/draw|抽/.test(description.toLowerCase())) {
      score += run.deficits.draw * 18;
      reasons.push("补抽牌");
    }
  }
  if (type === "Power" || type === "能力") {
    score += run.deficits.scaling * 22 * strategy.weights.scaling;
    reasons.push("补成长");
  }
  if (/energy|\[energy|能量/.test(description.toLowerCase())) {
    score += run.deficits.energy * 16;
    reasons.push("补能量");
  }
  if (/exhaust|消耗|status|状态/.test(description.toLowerCase())) {
    score += run.deficits.status_control * 10;
    reasons.push("状态/消耗协同");
  }
  if (clearsProblems) {
    score += run.deficits.status_control * 18 + 8;
    reasons.push("可处理战斗内塞入的状态牌");
  }
  if (createsProblems > 0) {
    const penalty = createsProblems * (run.deficits.status_control > 0.6 ? 4 : 8);
    score -= penalty;
    risks.push("会往手牌/牌堆塞状态牌，需配合状态处理");
  }
  if (name.toLowerCase().includes("strike") || name.includes("打击")) {
    score -= 5;
  }

  return withScore(candidate, score, 0.45, reasons.length ? reasons : ["奖励牌需战略判断"], risks);
}

function scoreClaimReward(candidate: CandidateAction): ScoredCandidate {
  const reward = candidate.facts?.reward;
  const label = isRecord(reward) ? `${reward.name ?? reward.type ?? reward.id ?? ""}`.toLowerCase() : "";
  let score = 10;
  const reasons = ["领取资源"];
  if (candidate.action.kind === "claim_reward" && candidate.action.index > 0) {
    score += candidate.action.index * 20;
    reasons.push("奖励从右到左领取，避免索引位移");
  }
  if (label.includes("gold") || label.includes("金币")) score += 3;
  if (label.includes("relic") || label.includes("遗物")) score += 8;
  if (label.includes("potion") || label.includes("药水")) score += 4;
  return withScore(candidate, score, 0.8, reasons, []);
}

function scoreMapNode(
  state: NormalizedState,
  candidate: CandidateAction,
  run: RunMemory,
  strategy: StrategyParams
): ScoredCandidate {
  const node = candidate.facts?.node;
  const text = isRecord(node) ? `${node.type ?? ""} ${node.node_type ?? ""} ${node.name ?? ""} ${node.symbol ?? ""}`.toLowerCase() : "";
  const hpRatio = state.player.hp / Math.max(1, state.player.maxHp);
  let score = 5;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (/elite|精英/.test(text)) {
    score += run.routeBias.elites * 20 - (1 - hpRatio) * 28 * strategy.weights.routeEliteRisk;
    reasons.push("精英给遗物");
    if (run.recentCombat.statusBurden > 1 || run.deficits.status_control > 0.68) {
      score -= 8 + run.recentCombat.statusBurden * 3;
      risks.push("状态牌污染会放大精英战波动");
    }
    if (hpRatio < 0.65 || run.deficits.potions > 0.6 || run.deficits.block > 0.65) {
      score -= 12;
      risks.push("血量/药水/防御不足，精英风险高");
    }
    if ((state.act ?? 1) === 1 && (state.floor ?? 0) <= 7 && (hpRatio < 0.8 || run.deficits.block > 0.6 || run.deficits.potions > 0.55)) {
      score -= 18;
      risks.push("一层前半段未成型时少贪精英");
    }
  } else if (/rest|火堆|campfire/.test(text)) {
    score += run.routeBias.rests * 20 * strategy.weights.restSafety;
    reasons.push("火堆/休息安全");
  } else if (/shop|商店/.test(text)) {
    score += run.routeBias.shops * 20 * strategy.weights.routeShopValue;
    reasons.push("商店补资源");
  } else if (/monster|enemy|怪/.test(text)) {
    score += run.deficits.damage > 0.7 ? 5 : 10;
    reasons.push("普通怪给卡牌奖励");
  } else if (/\?|event|unknown|未知|事件/.test(text)) {
    score += run.routeBias.events * 12;
    reasons.push("事件降低战斗压力");
  }

  return withScore(candidate, score, 0.35, reasons, risks);
}

function scoreRestOption(
  state: NormalizedState,
  candidate: CandidateAction,
  strategy: StrategyParams
): ScoredCandidate {
  const option = candidate.facts?.option;
  const text = isRecord(option) ? `${option.label ?? ""} ${option.name ?? ""} ${option.title ?? ""}`.toLowerCase() : candidate.label.toLowerCase();
  const hpRatio = state.player.hp / Math.max(1, state.player.maxHp);
  let score = 5;
  const reasons: string[] = [];

  if (/rest|休息|heal|治疗/.test(text)) {
    score += hpRatio < 0.55 ? 30 * strategy.weights.restSafety : -5;
    reasons.push(hpRatio < 0.55 ? "低血优先休息" : "血量尚可");
  } else if (/smith|upgrade|锻造|升级/.test(text)) {
    score += hpRatio > 0.5 ? 20 : 2;
    reasons.push("升级提升长期强度");
  } else {
    score += 4;
    reasons.push("休息点特殊选项");
  }

  return withScore(candidate, score, 0.6, reasons, []);
}

function withScore(
  candidate: CandidateAction,
  score: number,
  confidence: number,
  reasons: string[],
  risks: string[]
): ScoredCandidate {
  return {
    ...candidate,
    score,
    confidence,
    reasons,
    risks
  };
}

function rewardCardToNormalized(card: JsonRecord): NormalizedCard {
  return {
    id: asString(card.id ?? card.card_id ?? card.name),
    name: asString(card.name ?? card.id ?? card.card_id, "Card"),
    index: asNumber(card.index),
    type: asString(card.type),
    typeKey: asString(card.type_key ?? card.typeKey),
    rarity: asString(card.rarity),
    rarityKey: asString(card.rarity_key ?? card.rarityKey),
    cost: card.cost as string | number | null | undefined,
    description: asString(card.description ?? card.description_raw ?? card.text),
    canPlay: true,
    targetType: asString(card.target_type ?? card.targetType ?? card.target),
    raw: card
  };
}

function entityStatuses(target: unknown): JsonRecord[] {
  if (!isRecord(target) || !Array.isArray(target.status)) return [];
  return target.status.filter(isRecord);
}

function targetThreatScore(target: unknown): number {
  const statuses = entityStatuses(target);
  if (statuses.length === 0) return 0;

  const scaling = entityStatusAmount(statuses, [/strength/i, /ritual/i, /growth/i, /focus/i, /力量|仪式|成长|集中/]);
  const defense = entityStatusAmount(statuses, [/plated/i, /metallicize/i, /armor/i, /护甲|镀层|金属化/]);
  return Math.min(14, scaling * 4 + defense * 1.5);
}

function confidenceFromReasons(score: number, reasons: string[], risks: string[]): number {
  const base = Math.min(0.85, Math.max(0.2, Math.abs(score) / 80));
  return Math.max(0.05, Math.min(0.95, base + reasons.length * 0.04 - risks.length * 0.08));
}

function isLifeOrDeath(state: NormalizedState): boolean {
  if (state.screen !== "combat") return false;
  const incoming = getIncomingDamage(state);
  const hpLoss = Math.max(0, incoming - state.player.block);
  return hpLoss >= state.player.hp * 0.7 || state.player.hp / Math.max(1, state.player.maxHp) < 0.22;
}

function hasComboComplexity(state: NormalizedState): boolean {
  if (state.screen !== "combat") return false;
  const playable = state.player.hand.filter((card) => card.canPlay);
  if (playable.length < 5) return false;
  const problemCount = countProblemCards(state.player.hand);
  if (problemCount > 1 && playable.some(cleansesProblemCards)) return true;
  return playable.some((card) => {
    const text = card.description.toLowerCase();
    return /draw|抽|energy|能量|exhaust|消耗|return|放入.*手牌|all 0|status|状态/.test(text);
  });
}
