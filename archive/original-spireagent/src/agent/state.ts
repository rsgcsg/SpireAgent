import type { JsonRecord, NormalizedCard, NormalizedEnemy, NormalizedPlayer, NormalizedState, ScreenKind } from "./types.js";
import { asArray, asNumber, asString, isRecord } from "./utils.js";

export function normalizeGameState(rawState: unknown): NormalizedState {
  const raw = isRecord(rawState) ? rawState : {};
  const playerRaw = isRecord(raw.player) ? raw.player : {};
  const battleRaw = isRecord(raw.battle) ? raw.battle : {};
  const runRaw = isRecord(raw.run) ? raw.run : {};
  const enemies = asArray(battleRaw.enemies).filter(isRecord).map(normalizeEnemy);
  const topLevelRewards = findArray(raw, ["rewards", "reward_items", "rewardItems"]);
  const rewards =
    topLevelRewards.length > 0
      ? topLevelRewards
      : findNestedArray(raw, [
          ["rewards", "items"],
          ["reward_screen", "rewards"],
          ["reward_screen", "items"],
          ["rewardScreen", "rewards"],
          ["rewardScreen", "items"],
          ["rewards_screen", "items"]
        ]);
  const topLevelOptions = findArray(raw, ["options", "event_options", "rest_options", "shop_items"]);
  const options =
    topLevelOptions.length > 0
      ? topLevelOptions
      : findNestedArray(raw, [
      ["event", "options"],
      ["rest", "options"],
      ["rest_site", "options"],
      ["restSite", "options"],
      ["shop", "items"],
      ["shop", "options"]
        ]);
  const topLevelMapNodes = findArray(raw, ["map_nodes", "mapNodes", "nodes", "available_nodes"]);
  const mapNodes =
    topLevelMapNodes.length > 0
      ? topLevelMapNodes
      : findNestedArray(raw, [
          ["map", "next_options"],
          ["map", "nextOptions"],
          ["map", "available_nodes"]
        ]);

  const stateType = asString(raw.state_type ?? raw.stateType, "unknown");
  const screen = inferScreen(raw, stateType, enemies, rewards, options, mapNodes);

  return {
    stateType,
    screen,
    act: optionalNumber(runRaw.act),
    floor: optionalNumber(runRaw.floor),
    ascension: optionalNumber(runRaw.ascension),
    round: optionalNumber(battleRaw.round),
    turn: asString(battleRaw.turn, ""),
    isPlayPhase: Boolean(battleRaw.is_play_phase ?? battleRaw.isPlayPhase ?? screen !== "combat"),
    player: normalizePlayer(playerRaw),
    enemies,
    rewards,
    options,
    mapNodes,
    raw
  };
}

export function summarizeState(state: NormalizedState): string {
  const hp = `${state.player.hp}/${state.player.maxHp}`;
  const base = `screen=${state.screen} act=${state.act ?? "?"} floor=${state.floor ?? "?"} hp=${hp} energy=${state.player.energy}/${state.player.maxEnergy}`;
  if (state.screen !== "combat") {
    return base;
  }

  const playerStatuses = formatStatuses(state.player.status);
  const enemies = state.enemies
    .map((enemy) => {
      const statuses = formatStatuses(enemy.status);
      return `${enemy.name}:${enemy.hp}/${enemy.maxHp} intent=${enemy.intents.map((i) => `${i.type}${i.label ? ` ${i.label}` : ""}`).join("+")}${statuses ? ` status=${statuses}` : ""}`;
    })
    .join(", ");
  const hand = state.player.hand.map((card) => `${card.index}:${card.name}`).join(", ");
  return `${base} round=${state.round ?? "?"} incoming=${getIncomingDamage(state)}${playerStatuses ? ` selfStatus=[${playerStatuses}]` : ""} enemies=[${enemies}] hand=[${hand}]`;
}

export function getIncomingDamage(state: NormalizedState): number {
  return state.enemies.reduce((sum, enemy) => {
    return (
      sum +
      enemy.intents.reduce((enemySum, intent) => {
        if (!intent.type.toLowerCase().includes("attack")) {
          return enemySum;
        }

        const labelDamage = parseIntentDamage(intent.label);
        if (labelDamage !== undefined) {
          return enemySum + labelDamage;
        }

        return enemySum + (parseIntentDamage(intent.description ?? "") ?? 0);
      }, 0)
    );
  }, 0);
}

export function getLivingEnemies(state: NormalizedState): NormalizedEnemy[] {
  return state.enemies.filter((enemy) => enemy.hp > 0);
}

export function isCombatActionable(state: NormalizedState): boolean {
  return state.screen === "combat" && state.isPlayPhase && state.turn !== "enemy";
}

export function cardDamage(card: NormalizedCard): number {
  const rawDamage = asNumber(card.raw.damage, Number.NaN);
  if (Number.isFinite(rawDamage)) {
    const hits = asNumber(card.raw.hit_count, 1) || 1;
    return rawDamage * hits;
  }

  const text = card.description;
  const zh = text.match(/造成\s*(\d+)\s*点伤害(?:\s*(\d+)\s*次)?/);
  if (zh) {
    return Number(zh[1]) * (zh[2] ? Number(zh[2]) : 1);
  }

  const enWordHits = text.match(/deal\s+(\d+)\s+damage\s+(twice|thrice)/i);
  if (enWordHits) {
    return Number(enWordHits[1]) * (enWordHits[2].toLowerCase() === "thrice" ? 3 : 2);
  }

  const en = text.match(/deal\s+(\d+)\s+damage(?:\s+(\d+)\s+times)?/i);
  if (en) {
    return Number(en[1]) * (en[2] ? Number(en[2]) : 1);
  }

  return 0;
}

export function cardBlock(card: NormalizedCard): number {
  const rawBlock = asNumber(card.raw.block, Number.NaN);
  if (Number.isFinite(rawBlock)) {
    return rawBlock;
  }

  const text = card.description;
  const zh = text.match(/获得\s*(\d+)\s*点?格挡|获得\s*(\d+)\s*格挡/);
  if (zh) {
    return Number(zh[1] ?? zh[2]);
  }

  const en = text.match(/gain\s+(\d+)\s+block/i);
  if (en) {
    return Number(en[1]);
  }

  return 0;
}

export function cardDraw(card: NormalizedCard): number {
  const rawDraw = asNumber(card.raw.cards_draw, Number.NaN);
  if (Number.isFinite(rawDraw)) {
    return rawDraw;
  }

  const text = card.description;
  const zh = text.match(/抽\s*(\d+)\s*张/);
  if (zh) {
    return Number(zh[1]);
  }

  const en = text.match(/draw\s+(\d+)\s+card/i);
  if (en) {
    return Number(en[1]);
  }

  return 0;
}

export function cardEnergyGain(card: NormalizedCard): number {
  const rawGain = asNumber(card.raw.energy_gain, Number.NaN);
  if (Number.isFinite(rawGain)) {
    return rawGain;
  }

  const text = card.description;
  const zh = text.match(/获得\s*(\d+)\s*点?\[?能量|获得\s*(\d+)\s*\[energy/i);
  if (zh) {
    return Number(zh[1] ?? zh[2]);
  }

  const en = text.match(/gain\s+(\d+)\s+energy/i);
  if (en) {
    return Number(en[1]);
  }

  return 0;
}

export function hasStatusByName(card: NormalizedCard, needle: string): boolean {
  return card.name.toLowerCase().includes(needle.toLowerCase()) || card.id.toLowerCase().includes(needle.toLowerCase());
}

export function statusText(status: JsonRecord): string {
  return [
    status.name,
    status.id,
    status.power_id,
    status.powerId,
    status.type,
    status.label,
    status.title,
    status.description
  ]
    .map((value) => asString(value))
    .filter(Boolean)
    .join(" ");
}

export function statusAmount(status: JsonRecord): number {
  for (const key of ["amount", "stacks", "stack", "value", "count", "turns", "intensity"]) {
    const amount = asNumber(status[key], Number.NaN);
    if (Number.isFinite(amount)) return amount;
  }

  const text = statusText(status);
  const match = text.match(/-?\d+/);
  return match ? Number(match[0]) : 0;
}

export function hasEntityStatus(statuses: JsonRecord[], patterns: RegExp[]): boolean {
  return statuses.some((status) => {
    const text = statusText(status).toLowerCase();
    return patterns.some((pattern) => pattern.test(text));
  });
}

export function entityStatusAmount(statuses: JsonRecord[], patterns: RegExp[]): number {
  return statuses.reduce((sum, status) => {
    const text = statusText(status).toLowerCase();
    if (!patterns.some((pattern) => pattern.test(text))) return sum;
    return sum + Math.max(1, Math.abs(statusAmount(status)));
  }, 0);
}

export function isProblemCard(card: NormalizedCard): boolean {
  const type = `${card.typeKey ?? ""} ${card.type ?? ""}`.toLowerCase();
  if (/status|curse|状态|诅咒/.test(type)) return true;

  const identity = `${card.id} ${card.name}`.toLowerCase();
  return /\b(wound|burn|dazed|void|slimed|curse|injury|normality|regret|doubt|pain|decay|parasite|shame|clumsy)\b|伤口|灼伤|燃烧|眩晕|虚空|黏液|诅咒/.test(
    identity
  );
}

export function isDangerousProblemCard(card: NormalizedCard): boolean {
  if (!isProblemCard(card)) return false;
  const text = `${card.id} ${card.name} ${card.description}`.toLowerCase();
  return /beckon|burn|void|regret|pain|normality|lose\s+\d+\s+hp|end of turn|失去.*生命|回合结束|灼伤|燃烧|虚空|疼痛|悔恨/.test(
    text
  );
}

export function countProblemCards(cards: NormalizedCard[]): number {
  return cards.filter(isProblemCard).length;
}

export function countDangerousProblemCards(cards: NormalizedCard[]): number {
  return cards.filter(isDangerousProblemCard).length;
}

export function problemCardsCreatedBy(card: NormalizedCard): number {
  const text = `${card.id} ${card.name} ${card.description}`.toLowerCase();
  if (!/wound|burn|dazed|void|slimed|status|curse|伤口|灼伤|燃烧|眩晕|虚空|黏液|状态|诅咒/.test(text)) {
    return 0;
  }
  if (!/add|put|shuffle|create|insert|将|加入|添加|洗入|生成|放入/.test(text)) {
    return 0;
  }

  const count = firstCount(text);
  return count ?? 1;
}

export function cleansesProblemCards(card: NormalizedCard): boolean {
  const text = `${card.id} ${card.name} ${card.description}`.toLowerCase();
  if (/compact|压缩/.test(text)) return true;
  return (
    /(exhaust|remove|transform|discard|消耗|移除|转化|转换|弃掉|丢弃)[^.。]*(status|curse|wound|burn|dazed|状态|诅咒|伤口|灼伤|燃烧|眩晕)/.test(
      text
    ) ||
    /(status|curse|wound|burn|dazed|状态|诅咒|伤口|灼伤|燃烧|眩晕)[^.。]*(exhaust|remove|transform|discard|消耗|移除|转化|转换|弃掉|丢弃)/.test(
      text
    )
  );
}

export function isAttack(card: NormalizedCard): boolean {
  return card.typeKey === "Attack" || card.type === "Attack" || card.type === "攻击";
}

export function isSkill(card: NormalizedCard): boolean {
  return card.typeKey === "Skill" || card.type === "Skill" || card.type === "技能";
}

export function isPower(card: NormalizedCard): boolean {
  return card.typeKey === "Power" || card.type === "Power" || card.type === "能力";
}

function normalizeEnemy(enemy: JsonRecord): NormalizedEnemy {
  return {
    id: asString(enemy.entity_id ?? enemy.entityId ?? enemy.id ?? enemy.name, ""),
    name: asString(enemy.name ?? enemy.id, "Enemy"),
    hp: asNumber(enemy.hp),
    maxHp: asNumber(enemy.max_hp ?? enemy.maxHp),
    block: asNumber(enemy.block),
    intents: asArray(enemy.intents).filter(isRecord).map((intent) => ({
      type: asString(intent.type, ""),
      label: asString(intent.label, ""),
      title: asString(intent.title, ""),
      description: asString(intent.description, "")
    })),
    status: asArray(enemy.status).filter(isRecord)
  };
}

function normalizePlayer(player: JsonRecord): NormalizedPlayer {
  return {
    character: asString(player.character, "Unknown"),
    hp: asNumber(player.hp),
    maxHp: asNumber(player.max_hp ?? player.maxHp),
    block: asNumber(player.block),
    energy: asNumber(player.energy),
    maxEnergy: asNumber(player.max_energy ?? player.maxEnergy, 3),
    gold: asNumber(player.gold),
    hand: asArray(player.hand).filter(isRecord).map(normalizeCard),
    drawPileCount: asNumber(player.draw_pile_count ?? player.drawPileCount),
    discardPileCount: asNumber(player.discard_pile_count ?? player.discardPileCount),
    exhaustPileCount: asNumber(player.exhaust_pile_count ?? player.exhaustPileCount),
    relics: asArray(player.relics).filter(isRecord),
    potions: asArray(player.potions).filter(isRecord),
    status: asArray(player.status).filter(isRecord),
    orbs: asArray(player.orbs).filter(isRecord),
    orbSlots: asNumber(player.orb_slots ?? player.orbSlots),
    orbEmptySlots: asNumber(player.orb_empty_slots ?? player.orbEmptySlots)
  };
}

function normalizeCard(card: JsonRecord, fallbackIndex: number): NormalizedCard {
  return {
    id: asString(card.id ?? card.card_id ?? card.name, ""),
    name: asString(card.name ?? card.id, "Card"),
    index: asNumber(card.index, fallbackIndex),
    type: asString(card.type, ""),
    typeKey: asString(card.type_key ?? card.typeKey, ""),
    rarity: asString(card.rarity, ""),
    rarityKey: asString(card.rarity_key ?? card.rarityKey, ""),
    cost: card.cost as string | number | null | undefined,
    description: asString(card.description ?? card.description_raw ?? card.text, ""),
    canPlay: Boolean(card.can_play ?? card.canPlay ?? true),
    targetType: asString(card.target_type ?? card.targetType ?? card.target, ""),
    raw: card
  };
}

function inferScreen(
  raw: JsonRecord,
  stateType: string,
  enemies: NormalizedEnemy[],
  rewards: JsonRecord[],
  options: JsonRecord[],
  mapNodes: JsonRecord[]
): ScreenKind {
  const lower = stateType.toLowerCase();
  if (lower.includes("game_over")) return "game_over";
  if (
    lower.includes("card_select") ||
    lower.includes("hand_select") ||
    isRecord(raw.card_select) ||
    isRecord(raw.cardSelect) ||
    isRecord(raw.hand_select) ||
    isRecord(raw.handSelect)
  ) {
    return "card_select";
  }
  if (lower.includes("combat") || lower.includes("battle") || lower.includes("boss") || enemies.length > 0) return "combat";
  if (lower.includes("card_reward") || hasCardRewardPayload(raw)) return "card_reward";
  if (lower.includes("bundle_select") || isRecord(raw.bundle_select) || isRecord(raw.bundleSelect)) return "bundle_select";
  if (lower.includes("crystal_sphere") || isRecord(raw.crystal_sphere) || isRecord(raw.crystalSphere)) return "crystal_sphere";
  if (lower.includes("reward") || rewards.length > 0) return "rewards";
  if (lower.includes("map") || mapNodes.length > 0) return "map";
  if (lower.includes("rest")) return "rest";
  if (lower.includes("event")) return "event";
  if (lower.includes("shop")) return "shop";
  if (lower.includes("treasure")) return "treasure";
  if (lower.includes("menu")) return "menu";

  const rawKeys = Object.keys(raw).join(" ").toLowerCase();
  if (rawKeys.includes("map")) return "map";
  if (options.length > 0) return "event";
  return "unknown";
}

function hasCardRewardPayload(raw: JsonRecord): boolean {
  for (const key of ["cards", "card_rewards", "cardRewards", "card_options", "cardOptions", "card_choices", "cardChoices"]) {
    if (Array.isArray(raw[key])) return true;
  }
  for (const key of ["card_reward", "cardReward", "reward_screen", "rewardScreen"]) {
    const value = raw[key];
    if (!isRecord(value)) continue;
    for (const childKey of ["cards", "card_rewards", "cardRewards", "choices", "options"]) {
      if (Array.isArray(value[childKey])) return true;
    }
  }
  return false;
}

function findArray(raw: JsonRecord, keys: string[]): JsonRecord[] {
  for (const key of keys) {
    const value = raw[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }
  return [];
}

function findNestedArray(raw: JsonRecord, paths: string[][]): JsonRecord[] {
  for (const path of paths) {
    let value: unknown = raw;
    for (const key of path) {
      if (!isRecord(value)) {
        value = undefined;
        break;
      }
      value = value[key];
    }
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }
  return [];
}

function optionalNumber(value: unknown): number | undefined {
  const number = asNumber(value, Number.NaN);
  return Number.isFinite(number) ? number : undefined;
}

function parseIntentDamage(text: string): number | undefined {
  if (!text) {
    return undefined;
  }

  const multi = text.match(/(\d+)\s*x\s*(\d+)|(\d+)\s*×\s*(\d+)/i);
  if (multi) {
    return Number(multi[1] ?? multi[3]) * Number(multi[2] ?? multi[4]);
  }

  const single = text.match(/\d+/);
  return single ? Number(single[0]) : undefined;
}

function formatStatuses(statuses: JsonRecord[]): string {
  return statuses
    .map((status) => {
      const name = asString(
        status.name ?? status.id ?? status.power_id ?? status.powerId ?? status.type ?? status.label ?? status.title
      );
      if (!name) return "";
      const amount = statusAmount(status);
      return amount ? `${name}:${amount}` : name;
    })
    .filter(Boolean)
    .slice(0, 5)
    .join(",");
}

function firstCount(text: string): number | undefined {
  const nearby = text.match(
    /(?:add|put|shuffle|create|insert|将|加入|添加|洗入|生成|放入)[^.。]*(\d+)[^.。]*(?:wound|burn|dazed|void|slimed|status|curse|伤口|灼伤|燃烧|眩晕|虚空|黏液|状态|诅咒)|(\d+)[^.。]*(?:wound|burn|dazed|void|slimed|status|curse|伤口|灼伤|燃烧|眩晕|虚空|黏液|状态|诅咒)[^.。]*(?:hand|draw|discard|牌|手牌|弃牌|抽牌)/i
  );
  if (nearby) return Number(nearby[1] ?? nearby[2]);
  return undefined;
}
