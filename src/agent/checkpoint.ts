import type { AgentAction, ExecutionCheckpoint, JsonRecord, NormalizedState } from "./types.js";
import { summarizeState } from "./state.js";

export interface CheckpointInput {
  before: NormalizedState;
  after: NormalizedState;
  action: AgentAction;
  settled: boolean;
  polls: number;
}

export function buildExecutionCheckpoint(input: CheckpointInput): ExecutionCheckpoint {
  const preStateHash = stateHash(input.before);
  const postStateHash = stateHash(input.after);
  const changes = diffState(input.before, input.after, input.action);
  const hardReasons = hardCheckpointReasons(input.before, input.after, input.action, changes);
  const softReasons = softCheckpointReasons(input.before, input.after, input.action, changes);
  const reasons: string[] = [];

  if (!input.settled) reasons.push("settlement_timeout_or_no_visible_change");
  reasons.push(...hardReasons, ...softReasons);

  const kind = classifyKind(preStateHash, postStateHash, input.settled, hardReasons, softReasons);
  return {
    kind,
    reasons: reasons.length > 0 ? reasons : ["no_visible_state_change"],
    settled: input.settled,
    polls: input.polls,
    preStateHash,
    postStateHash,
    before: summarizeState(input.before),
    after: summarizeState(input.after),
    changes
  };
}

export function stateHash(state: NormalizedState): string {
  return JSON.stringify({
    stateType: state.stateType,
    screen: state.screen,
    act: state.act,
    floor: state.floor,
    round: state.round,
    turn: state.turn,
    isPlayPhase: state.isPlayPhase,
    hp: state.player.hp,
    gold: state.player.gold,
    block: state.player.block,
    energy: state.player.energy,
    hand: state.player.hand.map(cardIdentity),
    drawPileCount: state.player.drawPileCount,
    discardPileCount: state.player.discardPileCount,
    exhaustPileCount: state.player.exhaustPileCount,
    potions: state.player.potions.map((potion) => `${String(potion.id ?? potion.name ?? "")}`),
    relics: state.player.relics.map((relic) => `${String(relic.id ?? relic.name ?? "")}`),
    orbs: state.player.orbs.map((orb) => `${String(orb.id ?? orb.name ?? orb.type ?? "")}:${String(orb.evoke_val ?? orb.evokeVal ?? "")}`),
    enemies: state.enemies.map((enemy) => ({
      id: enemy.id,
      hp: enemy.hp,
      block: enemy.block,
      intents: enemy.intents.map((intent) => `${intent.type}:${intent.label}`)
    })),
    options: state.options.length,
    mapNodes: state.mapNodes.length,
    rewards: state.rewards.length,
    crystalSphere: crystalSphereSnapshot(state)
  });
}

function classifyKind(
  preStateHash: string,
  postStateHash: string,
  settled: boolean,
  hardReasons: string[],
  softReasons: string[]
): ExecutionCheckpoint["kind"] {
  if (!settled) return "unknown";
  if (preStateHash === postStateHash) return "none";
  if (hardReasons.length > 0) return "hard";
  if (softReasons.length > 0) return "soft";
  return "unknown";
}

function diffState(before: NormalizedState, after: NormalizedState, action: AgentAction): JsonRecord {
  const beforeLiving = livingEnemyIds(before);
  const afterLiving = livingEnemyIds(after);
  return {
    actionKind: action.kind,
    screen: changed(before.screen, after.screen),
    stateType: changed(before.stateType, after.stateType),
    floor: changed(before.floor, after.floor),
    round: changed(before.round, after.round),
    turn: changed(before.turn, after.turn),
    isPlayPhase: changed(before.isPlayPhase, after.isPlayPhase),
    hp: changed(before.player.hp, after.player.hp),
    gold: changed(before.player.gold, after.player.gold),
    block: changed(before.player.block, after.player.block),
    energy: changed(before.player.energy, after.player.energy),
    handCount: changed(before.player.hand.length, after.player.hand.length),
    hand: {
      before: before.player.hand.map(cardIdentity),
      after: after.player.hand.map(cardIdentity)
    },
    drawPileCount: changed(before.player.drawPileCount, after.player.drawPileCount),
    discardPileCount: changed(before.player.discardPileCount, after.player.discardPileCount),
    exhaustPileCount: changed(before.player.exhaustPileCount, after.player.exhaustPileCount),
    potionCount: changed(before.player.potions.length, after.player.potions.length),
    orbCount: changed(before.player.orbs.length, after.player.orbs.length),
    livingEnemies: {
      before: beforeLiving,
      after: afterLiving,
      removed: beforeLiving.filter((id) => !afterLiving.includes(id)),
      added: afterLiving.filter((id) => !beforeLiving.includes(id))
    },
    enemyDeltas: enemyDeltas(before, after),
    rewardsCount: changed(before.rewards.length, after.rewards.length),
    optionsCount: changed(before.options.length, after.options.length),
    mapNodesCount: changed(before.mapNodes.length, after.mapNodes.length),
    crystalSphere: changed(crystalSphereSnapshot(before), crystalSphereSnapshot(after))
  };
}

function hardCheckpointReasons(
  before: NormalizedState,
  after: NormalizedState,
  action: AgentAction,
  changes: JsonRecord
): string[] {
  const reasons: string[] = [];
  if (stateHash(before) === stateHash(after)) return reasons;
  if (before.screen !== after.screen) reasons.push("screen_changed");
  if (before.stateType !== after.stateType) reasons.push("state_type_changed");
  if (before.floor !== after.floor) reasons.push("floor_changed");
  if (before.round !== after.round && action.kind === "end_turn") reasons.push("new_combat_round");
  if (before.turn !== after.turn) reasons.push("turn_changed");
  if (before.isPlayPhase !== after.isPlayPhase) reasons.push("play_phase_changed");

  const enemyChanges = changes.livingEnemies;
  if (isRecord(enemyChanges)) {
    if (Array.isArray(enemyChanges.removed) && enemyChanges.removed.length > 0) reasons.push("enemy_removed_or_dead");
    if (Array.isArray(enemyChanges.added) && enemyChanges.added.length > 0) reasons.push("enemy_added");
  }

  if (action.kind === "play_card") {
    if (!handLooksLikeSingleCardRemoval(before, after, action.cardIndex)) {
      reasons.push("hand_changed_beyond_expected_card_removal");
    }
    if (after.player.hand.length >= before.player.hand.length) {
      reasons.push("hand_grew_or_generated_card");
    }
    if (after.player.energy > before.player.energy) {
      reasons.push("energy_increased_after_card");
    }
    if (before.player.orbs.length !== after.player.orbs.length) {
      reasons.push("orb_state_changed");
    }
  }

  if (action.kind === "use_potion" || action.kind === "discard_potion") {
    reasons.push("potion_state_changed");
  }

  if (
    action.kind === "claim_reward" ||
    action.kind === "claim_treasure_relic" ||
    action.kind === "select_card_reward" ||
    action.kind === "skip_card_reward" ||
    action.kind === "choose_map_node" ||
    action.kind === "event_choose_option" ||
    action.kind === "shop_purchase" ||
    action.kind === "choose_rest_option" ||
    action.kind === "select_card" ||
    action.kind === "combat_select_card" ||
    action.kind === "confirm_selection" ||
    action.kind === "combat_confirm_selection" ||
    action.kind === "cancel_selection" ||
    action.kind === "menu_select" ||
    action.kind === "proceed" ||
    action.kind === "crystal_sphere_set_tool" ||
    action.kind === "crystal_sphere_click_cell" ||
    action.kind === "crystal_sphere_proceed"
  ) {
    if (stateHash(before) !== stateHash(after)) reasons.push("screen_or_menu_flow_progressed");
  }

  return unique(reasons);
}

function softCheckpointReasons(before: NormalizedState, after: NormalizedState, action: AgentAction, changes: JsonRecord): string[] {
  const reasons: string[] = [];
  if (stateHash(before) === stateHash(after)) return reasons;
  if (before.player.hp !== after.player.hp) reasons.push("player_hp_changed");
  if (before.player.gold !== after.player.gold) reasons.push("player_gold_changed");
  if (before.player.block !== after.player.block) reasons.push("player_block_changed");
  if (before.player.energy !== after.player.energy) reasons.push("player_energy_changed");
  if (before.player.hand.length !== after.player.hand.length) reasons.push("hand_count_changed");
  if (enemyHpOrBlockChanged(before, after)) reasons.push("enemy_hp_or_block_changed");
  if (before.player.drawPileCount !== after.player.drawPileCount) reasons.push("draw_pile_count_changed");
  if (before.player.discardPileCount !== after.player.discardPileCount) reasons.push("discard_pile_count_changed");
  if (before.player.exhaustPileCount !== after.player.exhaustPileCount) reasons.push("exhaust_pile_count_changed");
  if (action.kind === "play_card" && handLooksLikeSingleCardRemoval(before, after, action.cardIndex)) {
    reasons.push("expected_card_removed_from_hand");
  }
  if (stateHash(before) !== stateHash(after) && reasons.length === 0) reasons.push("state_hash_changed");
  return unique(reasons.filter((reason) => reason !== "hand_count_changed" || action.kind !== "play_card"));
}

function handLooksLikeSingleCardRemoval(before: NormalizedState, after: NormalizedState, removedIndex: number): boolean {
  const expected = before.player.hand
    .filter((card) => card.index !== removedIndex)
    .map((card) => `${card.id}:${card.name}`);
  const actual = after.player.hand.map((card) => `${card.id}:${card.name}`);
  if (expected.length !== actual.length) return false;
  return expected.every((identity, index) => identity === actual[index]);
}

function enemyHpOrBlockChanged(before: NormalizedState, after: NormalizedState): boolean {
  const afterById = new Map(after.enemies.map((enemy) => [enemy.id, enemy]));
  return before.enemies.some((enemy) => {
    const next = afterById.get(enemy.id);
    return Boolean(next && (next.hp !== enemy.hp || next.block !== enemy.block));
  });
}

function enemyDeltas(before: NormalizedState, after: NormalizedState): JsonRecord[] {
  const afterById = new Map(after.enemies.map((enemy) => [enemy.id, enemy]));
  const deltas: JsonRecord[] = [];
  for (const enemy of before.enemies) {
    const next = afterById.get(enemy.id);
    if (!next) {
      deltas.push({
        id: enemy.id,
        name: enemy.name,
        removed: true,
        hpBefore: enemy.hp,
        hpAfter: 0,
        hpDelta: -enemy.hp,
        blockBefore: enemy.block,
        blockAfter: 0,
        blockDelta: -enemy.block
      });
      continue;
    }
    const hpDelta = next.hp - enemy.hp;
    const blockDelta = next.block - enemy.block;
    if (hpDelta === 0 && blockDelta === 0) continue;
    deltas.push({
      id: enemy.id,
      name: enemy.name,
      removed: next.hp <= 0,
      hpBefore: enemy.hp,
      hpAfter: next.hp,
      hpDelta,
      blockBefore: enemy.block,
      blockAfter: next.block,
      blockDelta
    });
  }
  return deltas;
}

function livingEnemyIds(state: NormalizedState): string[] {
  return state.enemies.filter((enemy) => enemy.hp > 0).map((enemy) => enemy.id);
}

function cardIdentity(card: { index: number; id: string; name: string }): string {
  return `${card.index}:${card.id}:${card.name}`;
}

function crystalSphereSnapshot(state: NormalizedState): JsonRecord | undefined {
  if (state.stateType !== "crystal_sphere") return undefined;
  const rawSphere = state.raw.crystal_sphere;
  if (!isRecord(rawSphere)) return { visible: false };
  const revealedItems = Array.isArray(rawSphere.revealed_items)
    ? rawSphere.revealed_items.filter(isRecord).map((item) => ({
        type: item.item_type,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        good: item.is_good
      }))
    : [];
  const clickableCells = Array.isArray(rawSphere.clickable_cells)
    ? rawSphere.clickable_cells.filter(isRecord).map((cell) => `${String(cell.x)},${String(cell.y)}`)
    : [];
  return {
    tool: rawSphere.tool,
    canProceed: rawSphere.can_proceed ?? rawSphere.canProceed,
    divinationsLeftText: rawSphere.divinations_left_text ?? rawSphere.divinationsLeftText,
    clickableCells,
    revealedItems
  };
}

function changed<T>(before: T, after: T): JsonRecord {
  return Object.is(before, after) ? { changed: false, value: before as unknown } : { changed: true, before, after };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
