import path from "node:path";
import type {
  DecisionLogEntry,
  DeficitKey,
  DeficitMap,
  ExperienceEntry,
  ExperienceMemory,
  LongTermMemory,
  NormalizedState,
  RewardSummary,
  RunMemory,
  StrategyParams
} from "./types.js";
import { appendJsonl, agentRoot, clamp, ensureDir, nowIso, readJson, stableId, writeJsonAtomic } from "./utils.js";
import { countProblemCards, getIncomingDamage, hasEntityStatus } from "./state.js";
import { evaluateLegacyFinalizeStableWriteGate } from "./protectedPathGate.js";

const defaultMemoryDir = path.join(agentRoot, "memory");

export class MemoryManager {
  run: RunMemory;
  longTerm: LongTermMemory;
  experience: ExperienceMemory;
  strategy: StrategyParams;
  private readonly currentRunPath: string;
  private readonly longTermPath: string;
  private readonly experiencePath: string;
  private readonly strategyPath: string;
  private readonly decisionsPath: string;
  private readonly snapshotsDir: string;
  private readonly legacyFinalizeAuditPath: string;

  constructor(memoryDir = defaultMemoryDir) {
    this.currentRunPath = path.join(memoryDir, "current-run.json");
    this.longTermPath = path.join(memoryDir, "long-term.json");
    this.experiencePath = path.join(memoryDir, "experience.json");
    this.strategyPath = path.join(memoryDir, "strategy-params.json");
    this.decisionsPath = path.join(memoryDir, "decision-log.jsonl");
    this.snapshotsDir = path.join(memoryDir, "snapshots");
    this.legacyFinalizeAuditPath = path.join(memoryDir, "legacy-finalize-audit.jsonl");

    ensureDir(memoryDir);
    ensureDir(this.snapshotsDir);
    this.longTerm = readJson(this.longTermPath, defaultLongTermMemory());
    this.experience = readJson(this.experiencePath, defaultExperienceMemory());
    this.strategy = readJson(this.strategyPath, defaultStrategyParams());
    this.run = hydrateRunMemory(readJson(this.currentRunPath, defaultRunMemory()));
  }

  updateFromState(state: NormalizedState): void {
    if (state.floor !== undefined && this.run.floor !== undefined && state.floor < this.run.floor) {
      this.archiveCurrentRun("new-run-detected");
      this.run = defaultRunMemory();
    }

    if (
      state.floor === 1 &&
      this.run.character &&
      state.player.character &&
      this.run.character !== state.player.character
    ) {
      this.archiveCurrentRun("character-changed");
      this.run = defaultRunMemory();
    }

    this.run.updatedAt = nowIso();
    this.run.character = state.player.character || this.run.character;
    this.run.act = state.act ?? this.run.act;
    this.run.floor = state.floor ?? this.run.floor;
    this.run.ascension = state.ascension ?? this.run.ascension;
    this.run.hp = state.player.hp;
    this.run.maxHp = state.player.maxHp;
    this.run.gold = state.player.gold;
    this.run.counters.ticks += 1;

    if (state.screen === "combat") {
      this.run.counters.combats += state.round === 1 ? 1 : 0;
      if (state.stateType.toLowerCase().includes("elite")) {
        this.run.counters.elitesSeen = Math.max(this.run.counters.elitesSeen, 1);
      }
      this.run.recentCombat.lastIncomingDamage = getIncomingDamage(state);
      this.run.recentCombat.statusBurden = countProblemStatuses(state);
    }

    this.recomputeDeficits(state);
    this.recomputeRouteBias(state);
    this.recomputeRiskFlags(state);
    this.save();
  }

  recordDecision(entry: DecisionLogEntry): void {
    this.run.keyDecisions.push(entry);
    this.run.keyDecisions = this.run.keyDecisions.slice(-80);
    if (entry.llm?.wanted) this.run.counters.llmWanted += 1;
    if (entry.chosenBy === "llm") this.run.counters.llmCalls += 1;
    if (entry.chosenBy === "local") this.run.counters.localDecisions += 1;
    if (entry.chosenBy === "fallback") this.run.counters.fallbackDecisions += 1;
    if (entry.route === "forced_local") this.run.counters.forcedLocalDecisions += 1;
    if (entry.llm?.outcome === "unavailable") this.run.counters.llmUnavailableFallbacks += 1;
    if (entry.llm?.outcome === "invalid_output" || entry.llm?.outcome === "invalid_choice") {
      this.run.counters.llmInvalidFallbacks += 1;
    }
    if (entry.llm?.outcome === "timeout") this.run.counters.llmTimeoutFallbacks += 1;
    if (entry.fallbackPolicy?.name === "conservative_combat") this.run.counters.conservativeFallbackDecisions += 1;
    if (entry.checkpoint?.kind === "none") this.run.counters.checkpointNone += 1;
    if (entry.checkpoint?.kind === "soft") this.run.counters.checkpointSoft += 1;
    if (entry.checkpoint?.kind === "hard") this.run.counters.checkpointHard += 1;
    if (entry.checkpoint?.kind === "unknown") this.run.counters.checkpointUnknown += 1;
    if (entry.chosenBy !== "local") this.run.counters.uncertainDecisions += 1;
    appendJsonl(this.decisionsPath, entry);
    this.save();
  }

  applyLlmMemoryUpdate(update: {
    strategicDirection?: string[];
    riskFlags?: string[];
    deficits?: Partial<DeficitMap>;
  }): void {
    if (update.strategicDirection) {
      this.run.strategicDirection = mergeLimited(this.run.strategicDirection, update.strategicDirection, 8);
    }
    if (update.riskFlags) {
      this.run.riskFlags = mergeLimited(this.run.riskFlags, update.riskFlags, 12);
    }
    if (update.deficits) {
      for (const [key, value] of Object.entries(update.deficits)) {
        const deficitKey = key as DeficitKey;
        this.run.deficits[deficitKey] = clamp(Number(value), 0, 1);
      }
    }
    this.save();
  }

  hasActiveRunEvidence(): boolean {
    return (
      this.run.keyDecisions.length > 0 ||
      this.run.counters.localDecisions > 0 ||
      this.run.counters.uncertainDecisions > 0 ||
      this.run.counters.combats > 0
    );
  }

  finalizeRun(state: NormalizedState): RewardSummary {
    const reward = scoreRun(state, this.run);
    const summary = summarizeRun(state, this.run, reward);
    const gate = evaluateLegacyFinalizeStableWriteGate();
    const auditBase = {
      schemaVersion: 1,
      at: nowIso(),
      runId: this.run.runId,
      source: "legacy_finalize_run",
      learningMode: "legacy_local_learning",
      proposalPromotion: false,
      stablePromotion: false,
      result: reward.result,
      score: reward.score,
      summary,
      reasons: reward.reasons,
      gate: gate.gate,
      gateFlag: gate.flag,
      gateAllowed: gate.allowed,
      gateReasons: gate.reasons,
      attemptedStableWriteTargets: gate.attemptedTargets,
      protectedStableWriteTargets: gate.protectedTargets
    };

    if (gate.allowed) {
      this.longTerm.runs.push({
        runId: this.run.runId,
        at: nowIso(),
        character: this.run.character,
        result: reward.result,
        act: this.run.act,
        floor: this.run.floor,
        rewardScore: reward.score,
        summary,
        failureReasons: reward.reasons.filter((reason) => reason.startsWith("failed:")),
        successfulPatterns: reward.reasons.filter((reason) => reason.startsWith("success:"))
      });
      this.longTerm.runs = this.longTerm.runs.slice(-200);

      this.updateLessons(reward);
      this.updateStrategyParams(reward);
      this.updateExperience(reward);
      appendJsonl(this.legacyFinalizeAuditPath, {
        ...auditBase,
        blockedStableWrites: false,
        appliedStableWriteTargets: gate.attemptedTargets,
        mode: "legacy_finalize_explicitly_enabled"
      });
    } else {
      appendJsonl(this.legacyFinalizeAuditPath, {
        ...auditBase,
        blockedStableWrites: true,
        blockedStableWriteTargets: gate.attemptedTargets,
        appliedStableWriteTargets: [],
        mode: "legacy_finalize_blocked"
      });
    }
    this.archiveCurrentRun("finalized");
    this.run = defaultRunMemory();
    this.save();
    return reward;
  }

  relevantMemories(tags: string[], limit = 5): string[] {
    const normalized = new Set(tags.map(normalizeMemoryTag).filter(Boolean));
    const lessons = this.longTerm.lessons
      .map((lesson) => ({
        score: memoryTagMatchScore(normalized, [lesson.id, ...lesson.tags]) + lesson.confidence,
        text: `${lesson.text} (conf=${lesson.confidence.toFixed(2)})`
      }))
      .filter((item) => item.score > 0);
    const experiences = flattenExperience(this.experience)
      .map((entry) => ({
        score: memoryTagMatchScore(normalized, [entry.id, ...entry.tags]) + entry.confidence,
        text: `${entry.kind}:${entry.id}: ${entry.notes.slice(0, 2).join("; ")} (conf=${entry.confidence.toFixed(2)})`
      }))
      .filter((item) => item.score > 0 && !item.text.endsWith(":  (conf=0.00)"));

    return [...lessons, ...experiences]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.text);
  }

  save(): void {
    writeJsonAtomic(this.currentRunPath, this.run);
    writeJsonAtomic(this.longTermPath, this.longTerm);
    writeJsonAtomic(this.experiencePath, this.experience);
    writeJsonAtomic(this.strategyPath, this.strategy);
  }

  private archiveCurrentRun(reason: string): void {
    const snapshotPath = path.join(this.snapshotsDir, `${this.run.runId}-${reason}-${Date.now()}.json`);
    writeJsonAtomic(snapshotPath, this.run);
  }

  private recomputeDeficits(state: NormalizedState): void {
    const hand = state.player.hand;
    const relics = state.player.relics;
    const hasDraw = hand.some((card) => /draw|抽/.test(card.description.toLowerCase()));
    const hasBlock = hand.some((card) => /block|格挡/.test(card.description.toLowerCase()));
    const hasDamage = hand.some((card) => /damage|伤害/.test(card.description.toLowerCase()));
    const hasEnergy = hand.some((card) => /energy|\[energy|能量/.test(card.description.toLowerCase()));
    const hasScaling = hand.some((card) => /strength|focus|dexterity|力量|集中|敏捷|能力/.test(card.description.toLowerCase()));

    this.run.deficits.draw = smooth(this.run.deficits.draw, hasDraw ? 0.25 : 0.7);
    this.run.deficits.block = smooth(this.run.deficits.block, hasBlock ? 0.25 : 0.75);
    this.run.deficits.damage = smooth(this.run.deficits.damage, hasDamage ? 0.25 : 0.65);
    this.run.deficits.energy = smooth(this.run.deficits.energy, hasEnergy || state.player.maxEnergy > 3 ? 0.2 : 0.55);
    this.run.deficits.scaling = smooth(this.run.deficits.scaling, hasScaling ? 0.25 : state.act && state.act >= 2 ? 0.75 : 0.45);
    this.run.deficits.potions = smooth(this.run.deficits.potions, state.player.potions.length > 0 ? 0.2 : 0.65);
    this.run.deficits.deck_thinness = smooth(this.run.deficits.deck_thinness, state.player.drawPileCount + state.player.discardPileCount > 22 ? 0.75 : 0.35);
    this.run.deficits.healing = smooth(this.run.deficits.healing, state.player.hp / Math.max(1, state.player.maxHp) < 0.45 ? 0.8 : 0.25);
    this.run.deficits.status_control = smooth(this.run.deficits.status_control, this.run.recentCombat.statusBurden > 1 ? 0.75 : 0.3);
    this.run.deficits.aoe = smooth(this.run.deficits.aoe, state.enemies.length >= 3 ? 0.7 : 0.35);

    if (relics.some((relic) => String(relic.name ?? relic.id).toLowerCase().includes("pillow"))) {
      this.run.deficits.healing = Math.max(0, this.run.deficits.healing - 0.1);
    }
  }

  private recomputeRouteBias(state: NormalizedState): void {
    const hpRatio = state.player.hp / Math.max(1, state.player.maxHp);
    this.run.routeBias.elites = clamp(
      0.45 +
        (hpRatio - 0.65) * 1.2 -
        this.run.deficits.block * 0.35 -
        this.run.deficits.damage * 0.25 -
        this.run.deficits.potions * 0.25,
      0,
      1
    );
    this.run.routeBias.shops = clamp(state.player.gold >= 100 ? 0.75 : 0.35, 0, 1);
    this.run.routeBias.rests = clamp(hpRatio < 0.5 ? 0.85 : 0.25, 0, 1);
    this.run.routeBias.events = clamp(hpRatio < 0.35 ? 0.65 : 0.45, 0, 1);
  }

  private recomputeRiskFlags(state: NormalizedState): void {
    const flags = new Set(this.run.riskFlags.slice(-8));
    const hpRatio = state.player.hp / Math.max(1, state.player.maxHp);
    if (hpRatio < 0.35) flags.add("low_hp");
    if (this.run.deficits.block > 0.7) flags.add("缺防御");
    if (this.run.deficits.damage > 0.7) flags.add("缺输出");
    if (this.run.deficits.draw > 0.7) flags.add("缺抽牌");
    if (this.run.deficits.energy > 0.7) flags.add("缺能量");
    if (this.run.deficits.deck_thinness > 0.7) flags.add("牌组偏厚");
    if (this.run.recentCombat.statusBurden > 1 || this.run.deficits.status_control > 0.7) flags.add("手牌状态污染");
    if (hasEntityStatus(state.player.status, [/vulnerable/i, /frail/i, /weak/i, /易伤|脆弱|虚弱/])) {
      flags.add("自身负面状态");
    }
    this.run.riskFlags = Array.from(flags).slice(-12);
  }

  private updateLessons(reward: RewardSummary): void {
    for (const reason of reward.reasons) {
      const lessonText = lessonFromReason(reason);
      if (!lessonText) continue;
      const id = lessonText.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").slice(0, 80);
      const existing = this.longTerm.lessons.find((lesson) => lesson.id === id);
      if (existing) {
        existing.confidence = clamp(existing.confidence + (reward.result === "win" ? 0.03 : 0.05), 0, 1);
        existing.evidenceRunIds = mergeLimited(existing.evidenceRunIds, [reward.runId], 20);
        existing.updatedAt = nowIso();
      } else {
        this.longTerm.lessons.push({
          id,
          text: lessonText,
          tags: tagsFromReason(reason),
          confidence: reward.result === "win" ? 0.45 : 0.55,
          evidenceRunIds: [reward.runId],
          updatedAt: nowIso()
        });
      }
    }
    this.longTerm.lessons = this.longTerm.lessons.slice(-300);
  }

  private updateStrategyParams(reward: RewardSummary): void {
    if (!this.strategy.learning.enabled) return;

    const maxDelta = this.strategy.learning.maxParamDeltaPerRun;
    const changes: Record<string, number> = {};

    for (const [key, feedback] of Object.entries(reward.parameterFeedback)) {
      const delta = clamp(Number(feedback) * 0.03, -maxDelta, maxDelta);
      if (Math.abs(delta) < 0.001) continue;

      if (key === "block") {
        this.strategy.weights.block = clamp(this.strategy.weights.block + delta, 0.2, 3);
        changes["weights.block"] = delta;
      } else if (key === "damage") {
        this.strategy.weights.damage = clamp(this.strategy.weights.damage + delta, 0.2, 3);
        changes["weights.damage"] = delta;
      } else if (key === "draw") {
        this.strategy.weights.draw = clamp(this.strategy.weights.draw + delta, 0.1, 2);
        changes["weights.draw"] = delta;
      } else if (key === "energy") {
        this.strategy.weights.energy = clamp(this.strategy.weights.energy + delta, 0.1, 2);
        changes["weights.energy"] = delta;
      } else if (key === "scaling") {
        this.strategy.weights.scaling = clamp(this.strategy.weights.scaling + delta, 0.1, 2);
        changes["weights.scaling"] = delta;
      } else if (key === "routeEliteRisk") {
        this.strategy.weights.routeEliteRisk = clamp(this.strategy.weights.routeEliteRisk + delta, 0.2, 3);
        changes["weights.routeEliteRisk"] = delta;
      }
    }

    if (Object.keys(changes).length > 0) {
      this.strategy.updatedAt = nowIso();
      this.strategy.history.push({
        at: nowIso(),
        reason: "post-run reward feedback",
        changes,
        rewardScore: reward.score
      });
      this.strategy.history = this.strategy.history.slice(-100);
    }
  }

  private updateExperience(reward: RewardSummary): void {
    const bucket = this.experience.routes;
    const key = reward.result === "win" ? "winning-patterns" : "failure-patterns";
    const entry = bucket[key] ?? defaultExperienceEntry(key);
    entry.updatedAt = nowIso();
    if (reward.result === "win") entry.wins += 1;
    if (reward.result === "loss") entry.losses += 1;
    entry.confidence = clamp(entry.confidence + 0.02, 0, 1);
    entry.notes = mergeLimited(entry.notes, reward.reasons, 30);
    bucket[key] = entry;
  }
}

export function defaultDeficits(): DeficitMap {
  return {
    damage: 0.5,
    block: 0.5,
    draw: 0.5,
    energy: 0.5,
    scaling: 0.5,
    aoe: 0.4,
    deck_thinness: 0.4,
    status_control: 0.4,
    healing: 0.4,
    potions: 0.4
  };
}

function defaultRunMemory(): RunMemory {
  return {
    runId: stableId("run"),
    startedAt: nowIso(),
    updatedAt: nowIso(),
    strategicDirection: [],
    deficits: defaultDeficits(),
    routeBias: {
      elites: 0.5,
      shops: 0.4,
      rests: 0.4,
      events: 0.4
    },
    riskFlags: [],
    keyDecisions: [],
    recentCombat: {
      statusBurden: 0
    },
    counters: {
      ticks: 0,
      llmCalls: 0,
      llmWanted: 0,
      localDecisions: 0,
      uncertainDecisions: 0,
      fallbackDecisions: 0,
      forcedLocalDecisions: 0,
      llmUnavailableFallbacks: 0,
      llmInvalidFallbacks: 0,
      llmTimeoutFallbacks: 0,
      conservativeFallbackDecisions: 0,
      checkpointNone: 0,
      checkpointSoft: 0,
      checkpointHard: 0,
      checkpointUnknown: 0,
      combats: 0,
      elitesSeen: 0,
      restsUsed: 0
    }
  };
}

function hydrateRunMemory(value: RunMemory): RunMemory {
  const defaults = defaultRunMemory();
  return {
    ...defaults,
    ...value,
    strategicDirection: Array.isArray(value.strategicDirection) ? value.strategicDirection : [],
    deficits: {
      ...defaults.deficits,
      ...(value.deficits ?? {})
    },
    routeBias: {
      ...defaults.routeBias,
      ...(value.routeBias ?? {})
    },
    riskFlags: Array.isArray(value.riskFlags) ? value.riskFlags : [],
    keyDecisions: Array.isArray(value.keyDecisions) ? value.keyDecisions : [],
    recentCombat: {
      ...defaults.recentCombat,
      ...(value.recentCombat ?? {})
    },
    counters: {
      ...defaults.counters,
      ...(value.counters ?? {})
    }
  };
}

function defaultStrategyParams(): StrategyParams {
  return {
    version: 1,
    updatedAt: nowIso(),
    weights: {
      damage: 1,
      block: 1.25,
      lethal: 8,
      draw: 0.55,
      energy: 0.5,
      scaling: 0.7,
      statusControl: 1.4,
      deckThinness: 0.7,
      routeEliteRisk: 1,
      routeShopValue: 1,
      restSafety: 1.1
    },
    thresholds: {
      localConfidence: 0.72,
      llmUncertaintyMargin: 4,
      lowHpRatio: 0.35,
      obviousScoreGap: 8,
      maxLlmCandidates: 5
    },
    learning: {
      enabled: true,
      maxParamDeltaPerRun: 0.05,
      memoryConfidenceStep: 0.05
    },
    history: []
  };
}

function defaultLongTermMemory(): LongTermMemory {
  return {
    version: 1,
    runs: [],
    lessons: []
  };
}

function defaultExperienceMemory(): ExperienceMemory {
  return {
    version: 1,
    cards: {},
    relics: {},
    enemies: {},
    routes: {}
  };
}

function defaultExperienceEntry(id: string): ExperienceEntry {
  return {
    id,
    notes: [],
    tags: [],
    confidence: 0.4,
    wins: 0,
    losses: 0,
    updatedAt: nowIso()
  };
}

function scoreRun(state: NormalizedState, run: RunMemory): RewardSummary {
  const isWin = state.stateType.toLowerCase().includes("victory") || state.stateType.toLowerCase().includes("win");
  const isLoss = state.screen === "game_over" && !isWin;
  const act = run.act ?? state.act ?? 1;
  const floor = run.floor ?? state.floor ?? 0;
  const hpRatio = (run.hp ?? state.player.hp) / Math.max(1, run.maxHp ?? state.player.maxHp);
  let score = 0;
  const reasons: string[] = [];
  const feedback: RewardSummary["parameterFeedback"] = {};

  if (isWin) {
    score += 100;
    score += hpRatio * 20;
    reasons.push("success:win");
    if (hpRatio > 0.5) reasons.push("success:healthy-finish");
  } else if (isLoss) {
    score -= 80;
    score += act * 12 + floor * 1.5;
    reasons.push(`failed:death-act-${act}-floor-${floor}`);
  } else {
    score += act * 10 + floor;
  }

  for (const [key, value] of Object.entries(run.deficits)) {
    if (value > 0.72 && isLoss) {
      reasons.push(`failed:${key}`);
      feedback[key as DeficitKey] = 1;
    }
    if (value < 0.35 && isWin) {
      feedback[key as DeficitKey] = -0.2;
    }
  }

  if ((run.routeBias.elites > 0.75 && isLoss && hpRatio < 0.25) || diedAfterEarlyElite(run, act, floor, isLoss)) {
    reasons.push("failed:route-too-greedy");
    feedback.routeEliteRisk = 1;
  }

  if (isLoss && skippedCombatTempo(run)) {
    reasons.push("failed:combat-tempo");
    feedback.damage = Math.max(feedback.damage ?? 0, 0.5);
  }

  return {
    runId: run.runId,
    result: isWin ? "win" : isLoss ? "loss" : "unknown",
    score: Math.round(score),
    reasons,
    parameterFeedback: feedback
  };
}

function diedAfterEarlyElite(run: RunMemory, act: number, floor: number, isLoss: boolean): boolean {
  if (!isLoss || act !== 1 || floor > 8) return false;
  if (run.counters.elitesSeen > 0) return true;
  return run.keyDecisions.some((decision) => /bygone effigy|elite|精英/i.test(decision.stateSummary));
}

function skippedCombatTempo(run: RunMemory): boolean {
  return run.keyDecisions.some((decision) => {
    const endedWithEnergy = decision.chosen === "结束回合" && /energy=[1-9]\//.test(decision.stateSummary);
    const hadPlayableCard = decision.candidates.some((candidate) => candidate.id.startsWith("play-"));
    return endedWithEnergy && hadPlayableCard;
  });
}

function summarizeRun(state: NormalizedState, run: RunMemory, reward: RewardSummary): string {
  return [
    `${reward.result} score=${reward.score}`,
    `character=${run.character ?? state.player.character}`,
    `act=${run.act ?? state.act}`,
    `floor=${run.floor ?? state.floor}`,
    `hp=${run.hp ?? state.player.hp}/${run.maxHp ?? state.player.maxHp}`,
    `deficits=${Object.entries(run.deficits)
      .filter(([, value]) => value > 0.65)
      .map(([key]) => key)
      .join(",") || "none"}`
  ].join(" ");
}

function countProblemStatuses(state: NormalizedState): number {
  return countProblemCards(state.player.hand);
}

function smooth(oldValue: number, nextValue: number): number {
  return clamp(oldValue * 0.65 + nextValue * 0.35, 0, 1);
}

function mergeLimited(values: string[], additions: string[], limit: number): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const value of [...values, ...additions]) {
    const trimmed = String(value).trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    merged.push(trimmed);
  }
  return merged.slice(-limit);
}

function lessonFromReason(reason: string): string | null {
  if (reason === "failed:block") return "死亡局如果长期缺防御，下局提高防御牌、弱化、冰球和休息路线优先级。";
  if (reason === "failed:draw") return "长期缺抽牌会让关键回合不稳定，下局提高过牌和检索牌优先级。";
  if (reason === "failed:energy") return "长期缺能量会卡高费牌，下局降低高费抓牌或提高能量遗物/药水优先级。";
  if (reason === "failed:damage") return "早期缺输出会拖精英和 boss，下局前几层优先抓即时伤害。";
  if (reason === "failed:status_control") return "战斗内被塞状态牌时，需要提高 Compact/消耗/弃牌和低费稳定牌优先级。";
  if (reason === "failed:route-too-greedy") return "低血且防御不足时不要贪多精英，优先火堆、问号或商店补资源。";
  if (reason === "failed:combat-tempo") return "敌人不攻击或已挡住时，不要带着能量空过；优先打 0 费工具、易伤、成长和即时伤害。";
  if (reason === "success:healthy-finish") return "健康通关路线可保留当前抓牌和路线风险偏好。";
  return null;
}

function tagsFromReason(reason: string): string[] {
  return reason
    .replace(/^failed:|^success:/, "")
    .split(/[-_]/)
    .filter(Boolean);
}

function normalizeMemoryTag(tag: string): string {
  return String(tag).trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "_").replace(/^_+|_+$/g, "");
}

function memoryTagMatchScore(tags: Set<string>, candidates: string[]): number {
  let score = 0;
  for (const candidate of candidates) {
    const normalized = normalizeMemoryTag(candidate);
    if (!normalized) continue;
    if (tags.has(normalized)) {
      score += 1;
      continue;
    }
    for (const tag of tags) {
      if (tag.length >= 4 && (normalized.includes(tag) || tag.includes(normalized))) {
        score += 0.35;
        break;
      }
    }
  }
  return score;
}

function flattenExperience(experience: ExperienceMemory): Array<ExperienceEntry & { kind: keyof ExperienceMemory }> {
  const entries: Array<ExperienceEntry & { kind: keyof ExperienceMemory }> = [];
  for (const kind of ["cards", "relics", "enemies", "routes"] as const) {
    for (const entry of Object.values(experience[kind])) {
      entries.push({ ...entry, kind });
    }
  }
  return entries;
}
