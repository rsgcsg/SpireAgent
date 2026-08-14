import type {
  PlayerSnapshot,
  SemanticContext
} from "../domain/state/index.js";
import type { PlayerCombatContext } from "../integrations/sts2Connector/playerCombatPresentation.js";
import { projectPlayerVisibleCard } from "./projectPlayerVisibleState.js";

export function projectPlayerCombatContext(context: PlayerCombatContext): SemanticContext {
  return {
    kind: "combat",
    encounterType: context.encounter_type,
    round: context.round,
    turnOwner: context.turn_owner === "player"
      ? "player"
      : context.turn_owner === "enemy" ? "enemy" : "unknown",
    isPlayPhase: context.is_play_phase,
    enemies: context.enemies.map((enemy) => ({
      entityId: enemy.entity_id,
      ...(enemy.combat_id != null ? { combatId: enemy.combat_id } : {}),
      name: enemy.name ?? enemy.definition_id,
      hp: enemy.hp,
      maxHp: enemy.max_hp,
      block: enemy.block,
      statuses: enemy.statuses.map(projectStatus),
      intents: enemy.intents.map((intent) => ({
        type: intent.type,
        ...(intent.label ? { label: intent.label } : {}),
        ...(intent.title ? { title: intent.title } : {}),
        ...(intent.description ? { description: intent.description } : {})
      }))
    }))
  };
}

export function projectPlayerCombatState(
  context: PlayerCombatContext,
  persistent: PlayerSnapshot
): PlayerSnapshot {
  const player = context.player;
  const potionStates = new Map(
    player.potion_states.map((potion) => [potion.entity_id, potion])
  );
  return {
    ...persistent,
    block: player.block,
    energy: player.energy,
    maxEnergy: player.max_energy,
    ...(player.stars != null ? { stars: player.stars } : {}),
    hand: player.hand.map(projectPlayerVisibleCard),
    drawPileCount: player.draw_pile_count,
    discardPileCount: player.discard_pile_count,
    exhaustPileCount: player.exhaust_pile_count,
    drawPile: [],
    discardPile: [],
    exhaustPile: [],
    statuses: player.statuses.map(projectStatus),
    companions: player.companions.map((companion) => ({
      entityId: companion.entity_id,
      id: companion.definition_id,
      ...(companion.name ? { name: companion.name } : {}),
      isAlive: companion.is_alive,
      healthBarVisible: companion.health_bar_visible,
      ...(companion.hp != null ? { hp: companion.hp } : {}),
      ...(companion.max_hp != null ? { maxHp: companion.max_hp } : {}),
      block: companion.block,
      statuses: companion.statuses.map(projectStatus)
    })),
    potions: persistent.potions.map((potion) => {
      const state = potion.entityId ? potionStates.get(potion.entityId) : undefined;
      return {
        ...potion,
        ...(state ? {
          targetType: state.target_type,
          canUseInCombat: state.can_use,
          automatic: state.automatic
        } : {})
      };
    }),
    orbs: player.orbs.map((orb) => ({
      id: orb.definition_id,
      ...(orb.name ? { name: orb.name } : {}),
      ...(orb.description ? { description: orb.description } : {}),
      passiveValue: orb.passive_value,
      evokeValue: orb.evoke_value,
      queueIndex: orb.queue_index,
      isNextToEvoke: orb.is_next_to_evoke
    })),
    ...(player.orb_slots != null ? { orbSlots: player.orb_slots } : {})
  };
}

function projectStatus(status: PlayerCombatContext["player"]["statuses"][number]) {
  return {
    id: status.definition_id,
    ...(status.name ? { name: status.name } : {}),
    amount: status.amount,
    type: status.type,
    ...(status.description ? { description: status.description } : {})
  };
}
