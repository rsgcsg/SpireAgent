import type {
  CardSnapshot,
  EnemySnapshot,
  IndexedOptionSnapshot,
  KeywordSnapshot,
  MapNodeSnapshot,
  OrbSnapshot,
  PlayerSnapshot,
  PotionSnapshot,
  RelicSnapshot,
  RewardSnapshot,
  ShopItemSnapshot,
  StatusSnapshot
} from "../domain/state/index.js";
import { isJsonObject, type JsonObject, type JsonValue } from "../shared/json.js";
import type { DiagnosticsBuilder } from "./diagnostics.js";

export function objectField(parent: JsonObject, key: string): JsonObject | undefined {
  const value = parent[key];
  return isJsonObject(value) ? value : undefined;
}

export function objectArray(parent: JsonObject, key: string): JsonObject[] {
  const value = parent[key];
  return Array.isArray(value) ? value.filter(isJsonObject) : [];
}

export function optionalString(value: JsonValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function optionalNumber(value: JsonValue | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function optionalBoolean(value: JsonValue | undefined): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function requiredString(value: JsonValue | undefined, path: string, diagnostics: DiagnosticsBuilder): string {
  if (typeof value === "string" && value.trim()) return value;
  value === undefined || value === null
    ? diagnostics.missing(path)
    : diagnostics.invalid(path, value, "expected a non-empty string");
  return "UNKNOWN";
}

export function requiredNumber(value: JsonValue | undefined, path: string, diagnostics: DiagnosticsBuilder): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  value === undefined || value === null
    ? diagnostics.missing(path)
    : diagnostics.invalid(path, value, "expected a finite number");
  return 0;
}

export function requiredBoolean(value: JsonValue | undefined, path: string, diagnostics: DiagnosticsBuilder): boolean {
  if (typeof value === "boolean") return value;
  value === undefined || value === null
    ? diagnostics.missing(path)
    : diagnostics.invalid(path, value, "expected a boolean");
  return false;
}

export function parsePlayer(raw: JsonObject | undefined, diagnostics: DiagnosticsBuilder): PlayerSnapshot | undefined {
  if (!raw) return undefined;
  const character = requiredString(raw.character, "player.character", diagnostics);
  const hp = requiredNumber(raw.hp, "player.hp", diagnostics);
  const maxHp = requiredNumber(raw.max_hp ?? raw.maxHp, "player.max_hp", diagnostics);
  return {
    character,
    hp,
    maxHp,
    ...(optionalNumber(raw.block) !== undefined ? { block: optionalNumber(raw.block) } : {}),
    ...(optionalNumber(raw.energy) !== undefined ? { energy: optionalNumber(raw.energy) } : {}),
    ...(optionalNumber(raw.max_energy ?? raw.maxEnergy) !== undefined
      ? { maxEnergy: optionalNumber(raw.max_energy ?? raw.maxEnergy) }
      : {}),
    ...(optionalNumber(raw.gold) !== undefined ? { gold: optionalNumber(raw.gold) } : {}),
    hand: parseCards(raw.hand, "player.hand", diagnostics, true),
    ...(optionalNumber(raw.draw_pile_count ?? raw.drawPileCount) !== undefined
      ? { drawPileCount: optionalNumber(raw.draw_pile_count ?? raw.drawPileCount) }
      : {}),
    ...(optionalNumber(raw.discard_pile_count ?? raw.discardPileCount) !== undefined
      ? { discardPileCount: optionalNumber(raw.discard_pile_count ?? raw.discardPileCount) }
      : {}),
    ...(optionalNumber(raw.exhaust_pile_count ?? raw.exhaustPileCount) !== undefined
      ? { exhaustPileCount: optionalNumber(raw.exhaust_pile_count ?? raw.exhaustPileCount) }
      : {}),
    drawPile: parseCards(raw.draw_pile ?? raw.drawPile, "player.draw_pile", diagnostics, false),
    discardPile: parseCards(raw.discard_pile ?? raw.discardPile, "player.discard_pile", diagnostics, false),
    exhaustPile: parseCards(raw.exhaust_pile ?? raw.exhaustPile, "player.exhaust_pile", diagnostics, false),
    orbs: parseOrbs(raw.orbs),
    ...(optionalNumber(raw.orb_slots ?? raw.orbSlots) !== undefined
      ? { orbSlots: optionalNumber(raw.orb_slots ?? raw.orbSlots) }
      : {}),
    ...(optionalNumber(raw.orb_empty_slots ?? raw.orbEmptySlots) !== undefined
      ? { orbEmptySlots: optionalNumber(raw.orb_empty_slots ?? raw.orbEmptySlots) }
      : {}),
    statuses: parseStatuses(raw.status ?? raw.statuses),
    relics: parseRelics(raw.relics, diagnostics),
    potions: parsePotions(raw.potions, diagnostics),
    ...(optionalNumber(raw.max_potion_slots ?? raw.maxPotionSlots) !== undefined
      ? { maxPotionSlots: optionalNumber(raw.max_potion_slots ?? raw.maxPotionSlots) }
      : {})
  };
}

export function parseCards(
  value: JsonValue | undefined,
  path: string,
  diagnostics: DiagnosticsBuilder,
  requireIndex: boolean
): CardSnapshot[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    diagnostics.invalid(path, value, "expected an array");
    return [];
  }
  return value.filter(isJsonObject).map((card, position) => parseCard(card, `${path}[${position}]`, diagnostics, requireIndex));
}

export function parseCard(
  card: JsonObject,
  path: string,
  diagnostics: DiagnosticsBuilder,
  requireIndex: boolean
): CardSnapshot {
  const index = optionalNumber(card.index);
  const cost = card.cost;
  const starCost = card.star_cost ?? card.starCost;
  if (requireIndex && index === undefined) diagnostics.missing(`${path}.index`);
  return {
    id: requiredString(card.id ?? card.card_id ?? card.name, `${path}.id`, diagnostics),
    name: requiredString(card.name ?? card.id, `${path}.name`, diagnostics),
    ...(index !== undefined ? { index } : {}),
    ...(optionalString(card.type) ? { type: optionalString(card.type) } : {}),
    ...(isCost(cost) ? { cost } : {}),
    ...(isCost(starCost) ? { starCost } : {}),
    ...(optionalString(card.description ?? card.description_raw ?? card.text)
      ? { description: optionalString(card.description ?? card.description_raw ?? card.text) }
      : {}),
    ...(optionalString(card.rarity) ? { rarity: optionalString(card.rarity) } : {}),
    ...(optionalBoolean(card.is_upgraded ?? card.upgraded) !== undefined
      ? { upgraded: optionalBoolean(card.is_upgraded ?? card.upgraded) }
      : {}),
    keywords: parseKeywords(card.keywords),
    ...(optionalString(card.target_type ?? card.targetType) ? { targetType: optionalString(card.target_type ?? card.targetType) } : {}),
    ...(optionalBoolean(card.can_play ?? card.canPlay) !== undefined
      ? { canPlay: optionalBoolean(card.can_play ?? card.canPlay) }
      : {}),
    ...(card.unplayable_reason === null
      ? { unplayableReason: null }
      : optionalString(card.unplayable_reason ?? card.unplayableReason)
        ? { unplayableReason: optionalString(card.unplayable_reason ?? card.unplayableReason) }
        : {})
  };
}

export function parseEnemies(value: JsonValue | undefined, diagnostics: DiagnosticsBuilder): EnemySnapshot[] {
  if (!Array.isArray(value)) {
    diagnostics.missing("battle.enemies");
    return [];
  }
  return value.filter(isJsonObject).map((enemy, index) => ({
    entityId: requiredString(enemy.entity_id ?? enemy.entityId ?? enemy.id, `battle.enemies[${index}].entity_id`, diagnostics),
    ...(optionalNumber(enemy.combat_id ?? enemy.combatId) !== undefined
      ? { combatId: optionalNumber(enemy.combat_id ?? enemy.combatId) }
      : {}),
    name: requiredString(enemy.name ?? enemy.id, `battle.enemies[${index}].name`, diagnostics),
    hp: requiredNumber(enemy.hp, `battle.enemies[${index}].hp`, diagnostics),
    maxHp: requiredNumber(enemy.max_hp ?? enemy.maxHp, `battle.enemies[${index}].max_hp`, diagnostics),
    ...(optionalNumber(enemy.block) !== undefined ? { block: optionalNumber(enemy.block) } : {}),
    statuses: parseStatuses(enemy.status ?? enemy.statuses),
    intents: objectArray(enemy, "intents").map((intent) => ({
      type: optionalString(intent.type) ?? "unknown",
      ...(optionalString(intent.label) ? { label: optionalString(intent.label) } : {}),
      ...(optionalString(intent.title) ? { title: optionalString(intent.title) } : {}),
      ...(optionalString(intent.description) ? { description: optionalString(intent.description) } : {})
    }))
  }));
}

export function parseIndexedOptions(value: JsonValue | undefined): IndexedOptionSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).map((option, position) => ({
    index: optionalNumber(option.index) ?? position,
    ...(optionalString(option.id) ? { id: optionalString(option.id) } : {}),
    title: optionalString(option.title ?? option.name ?? option.label ?? option.text) ?? `Option ${position}`,
    ...(optionalString(option.description ?? option.desc ?? option.body)
      ? { description: optionalString(option.description ?? option.desc ?? option.body) }
      : {}),
    enabled: !(
      option.enabled === false ||
      option.is_enabled === false ||
      option.disabled === true ||
      option.is_locked === true
    ),
    ...(optionalBoolean(option.is_proceed ?? option.proceed) !== undefined
      ? { proceed: optionalBoolean(option.is_proceed ?? option.proceed) }
      : {}),
    ...(optionalBoolean(option.was_chosen ?? option.chosen) !== undefined
      ? { chosen: optionalBoolean(option.was_chosen ?? option.chosen) }
      : {})
  }));
}

export function parseMapNodes(value: JsonValue | undefined): MapNodeSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).map((node) => ({
    ...(optionalNumber(node.index) !== undefined ? { index: optionalNumber(node.index) } : {}),
    ...(optionalNumber(node.col) !== undefined ? { col: optionalNumber(node.col) } : {}),
    ...(optionalNumber(node.row) !== undefined ? { row: optionalNumber(node.row) } : {}),
    type: optionalString(node.type ?? node.node_type ?? node.name) ?? "Unknown",
    ...(optionalString(node.id) ? { id: optionalString(node.id) } : {}),
    leadsTo: parseCoordinateObjects(node.leads_to ?? node.leadsTo, true),
    children: parseCoordinates(node.children)
  }));
}

export function parseRewards(value: JsonValue | undefined): RewardSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).map((reward, position) => ({
    index: optionalNumber(reward.index) ?? position,
    type: optionalString(reward.type ?? reward.reward_type ?? reward.rewardType) ?? "unknown",
    ...(optionalString(reward.id) ? { id: optionalString(reward.id) } : {}),
    ...(optionalString(reward.name) ? { name: optionalString(reward.name) } : {}),
    ...(optionalString(reward.description) ? { description: optionalString(reward.description) } : {}),
    ...(optionalNumber(reward.gold_amount ?? reward.goldAmount) !== undefined
      ? { goldAmount: optionalNumber(reward.gold_amount ?? reward.goldAmount) }
      : {}),
    ...(optionalString(reward.potion_id ?? reward.potionId) ? { potionId: optionalString(reward.potion_id ?? reward.potionId) } : {}),
    ...(optionalString(reward.potion_name ?? reward.potionName)
      ? { potionName: optionalString(reward.potion_name ?? reward.potionName) }
      : {}),
    ...(optionalString(reward.relic_id ?? reward.relicId) ? { relicId: optionalString(reward.relic_id ?? reward.relicId) } : {}),
    ...(optionalString(reward.relic_name ?? reward.relicName)
      ? { relicName: optionalString(reward.relic_name ?? reward.relicName) }
      : {})
  }));
}

export function parseShopItems(value: JsonValue | undefined): ShopItemSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).map((item, position) => ({
    index: optionalNumber(item.index) ?? position,
    category: optionalString(item.category ?? item.type) ?? "unknown",
    ...(optionalNumber(item.price) !== undefined ? { price: optionalNumber(item.price) } : {}),
    stocked: !(item.is_stocked === false || item.isStocked === false),
    canAfford: item.can_afford === true || item.canAfford === true,
    ...(optionalBoolean(item.on_sale ?? item.onSale) !== undefined ? { onSale: optionalBoolean(item.on_sale ?? item.onSale) } : {}),
    ...(shopIdentity(item).id ? { id: shopIdentity(item).id } : {}),
    ...(shopIdentity(item).name ? { name: shopIdentity(item).name } : {}),
    ...(shopIdentity(item).description ? { description: shopIdentity(item).description } : {})
  }));
}

function parseKeywords(value: JsonValue | undefined): KeywordSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).map((keyword) => ({
    name: optionalString(keyword.name ?? keyword.id) ?? "Unknown",
    ...(optionalString(keyword.description) ? { description: optionalString(keyword.description) } : {})
  }));
}

function parseStatuses(value: JsonValue | undefined): StatusSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).map((status) => ({
    ...(optionalString(status.id) ? { id: optionalString(status.id) } : {}),
    ...(optionalString(status.name) ? { name: optionalString(status.name) } : {}),
    ...(optionalNumber(status.amount) !== undefined ? { amount: optionalNumber(status.amount) } : {}),
    ...(optionalString(status.type) ? { type: optionalString(status.type) } : {}),
    ...(optionalString(status.description) ? { description: optionalString(status.description) } : {})
  }));
}

function parseRelics(value: JsonValue | undefined, diagnostics: DiagnosticsBuilder): RelicSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).map((relic, index) => ({
    id: requiredString(relic.id ?? relic.name, `player.relics[${index}].id`, diagnostics),
    ...(optionalString(relic.name) ? { name: optionalString(relic.name) } : {}),
    ...(optionalString(relic.description) ? { description: optionalString(relic.description) } : {}),
    ...(relic.counter === null
      ? { counter: null }
      : optionalNumber(relic.counter) !== undefined
        ? { counter: optionalNumber(relic.counter) }
        : {}),
    keywords: parseKeywords(relic.keywords)
  }));
}

function parsePotions(value: JsonValue | undefined, diagnostics: DiagnosticsBuilder): PotionSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).map((potion, index) => ({
    id: requiredString(potion.id ?? potion.name, `player.potions[${index}].id`, diagnostics),
    ...(optionalString(potion.name) ? { name: optionalString(potion.name) } : {}),
    ...(optionalString(potion.description) ? { description: optionalString(potion.description) } : {}),
    ...(optionalNumber(potion.slot) !== undefined ? { slot: optionalNumber(potion.slot) } : {}),
    ...(optionalBoolean(potion.can_use_in_combat ?? potion.canUseInCombat) !== undefined
      ? { canUseInCombat: optionalBoolean(potion.can_use_in_combat ?? potion.canUseInCombat) }
      : {}),
    ...(optionalString(potion.target_type ?? potion.targetType)
      ? { targetType: optionalString(potion.target_type ?? potion.targetType) }
      : {}),
    ...(optionalBoolean(potion.is_automatic ?? potion.isAutomatic ?? potion.automatic) !== undefined
      ? { automatic: optionalBoolean(potion.is_automatic ?? potion.isAutomatic ?? potion.automatic) }
      : {}),
    keywords: parseKeywords(potion.keywords)
  }));
}

function parseOrbs(value: JsonValue | undefined): OrbSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).map((orb) => ({
    id: optionalString(orb.id ?? orb.name) ?? "UNKNOWN",
    ...(optionalString(orb.name) ? { name: optionalString(orb.name) } : {}),
    ...(optionalString(orb.description) ? { description: optionalString(orb.description) } : {}),
    ...(optionalNumber(orb.passive_val ?? orb.passiveValue) !== undefined
      ? { passiveValue: optionalNumber(orb.passive_val ?? orb.passiveValue) }
      : {}),
    ...(optionalNumber(orb.evoke_val ?? orb.evokeValue) !== undefined
      ? { evokeValue: optionalNumber(orb.evoke_val ?? orb.evokeValue) }
      : {})
  }));
}

function parseCoordinateObjects(value: JsonValue | undefined, includeType: boolean): Array<{ col: number; row: number; type?: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).flatMap((coordinate) => {
    const col = optionalNumber(coordinate.col);
    const row = optionalNumber(coordinate.row);
    if (col === undefined || row === undefined) return [];
    const type = includeType ? optionalString(coordinate.type) : undefined;
    return [{ col, row, ...(type ? { type } : {}) }];
  });
}

function parseCoordinates(value: JsonValue | undefined): Array<{ col: number; row: number }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((coordinate) => {
    if (!Array.isArray(coordinate) || coordinate.length < 2) return [];
    const col = coordinate[0];
    const row = coordinate[1];
    return typeof col === "number" && typeof row === "number" ? [{ col, row }] : [];
  });
}

function shopIdentity(item: JsonObject): { id?: string; name?: string; description?: string } {
  const category = optionalString(item.category ?? item.type) ?? "";
  const prefixes = category === "card_removal" ? ["removal"] : [category, "card", "relic", "potion"];
  for (const prefix of prefixes) {
    const id = optionalString(item[`${prefix}_id`]) ?? optionalString(item.id);
    const name = optionalString(item[`${prefix}_name`]) ?? optionalString(item.name);
    const description = optionalString(item[`${prefix}_description`]) ?? optionalString(item.description);
    if (id || name || description) return { ...(id ? { id } : {}), ...(name ? { name } : {}), ...(description ? { description } : {}) };
  }
  return {};
}

function isCost(value: JsonValue | undefined): value is string | number | null {
  return value === null || typeof value === "string" || typeof value === "number";
}
