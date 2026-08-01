import type {
  CardSnapshot,
  NormalizedCurrentState,
  PlayerSnapshot
} from "../domain/state/index.js";
import type {
  GatewaySharedVisibleState,
  GatewayVisibleCard
} from "../integrations/sts2mcp/gatewayVisibleStateProtocol.js";

export function projectGatewayVisibleCard(card: GatewayVisibleCard): CardSnapshot {
  return {
    id: card.definition_id,
    entityId: card.entity_id,
    name: card.name ?? card.definition_id,
    type: card.type,
    cost: card.cost,
    ...(card.star_cost != null ? { starCost: card.star_cost } : {}),
    ...(card.description ? { description: card.description } : {}),
    rarity: card.rarity,
    upgraded: card.is_upgraded,
    selected: card.is_selected,
    ...(card.target_type ? { targetType: card.target_type } : {}),
    ...(card.can_play != null ? { canPlay: card.can_play } : {}),
    ...(card.unplayable_reason !== undefined
      ? { unplayableReason: card.unplayable_reason }
      : {}),
    keywords: [],
    ...(card.existing_enchantment ? {
      existingEnchantment: {
        definitionId: card.existing_enchantment.definition_id,
        ...(card.existing_enchantment.name ? { name: card.existing_enchantment.name } : {}),
        ...(card.existing_enchantment.description
          ? { description: card.existing_enchantment.description }
          : {}),
        amount: card.existing_enchantment.amount,
        ...(card.existing_enchantment.observation_source
          ? { observationSource: card.existing_enchantment.observation_source }
          : {})
      }
    } : {})
  };
}

export function projectGatewayVisibleState(shared: GatewaySharedVisibleState): {
  run: NonNullable<NormalizedCurrentState["run"]>;
  player: PlayerSnapshot;
} {
  const keywords = (items: Array<{ name: string; description?: string | null }>) =>
    items.map((item) => ({
      name: item.name,
      ...(item.description ? { description: item.description } : {})
    }));
  return {
    run: {
      characterId: shared.player.character_definition_id,
      act: shared.run.act,
      actId: shared.run.act_definition_id,
      ...(shared.run.act_name ? { actName: shared.run.act_name } : {}),
      floor: shared.run.floor,
      ascension: shared.run.ascension,
      bosses: shared.run.bosses.map((boss) => ({
        id: boss.definition_id,
        ...(boss.name ? { name: boss.name } : {}),
        order: boss.order
      })),
      modifiers: shared.run.modifiers.map((modifier) => ({
        id: modifier.definition_id,
        ...(modifier.name ? { name: modifier.name } : {}),
        ...(modifier.description ? { description: modifier.description } : {}),
        keywords: keywords(modifier.keywords),
        cardPreviews: modifier.card_previews.map(projectGatewayVisibleCard)
      }))
    },
    player: {
      character: shared.player.character_name ?? shared.player.character_definition_id,
      hp: shared.player.hp,
      maxHp: shared.player.max_hp,
      gold: shared.player.gold,
      hand: [],
      drawPile: [],
      discardPile: [],
      exhaustPile: [],
      companions: [],
      orbs: [],
      statuses: [],
      relics: shared.player.relics.map((relic) => ({
        entityId: relic.entity_id,
        id: relic.definition_id,
        ...(relic.name ? { name: relic.name } : {}),
        ...(relic.description ? { description: relic.description } : {}),
        ...(relic.counter !== undefined ? { counter: relic.counter } : {}),
        keywords: keywords(relic.keywords),
        cardPreviews: relic.card_previews.map(projectGatewayVisibleCard)
      })),
      potions: shared.player.potions.map((potion) => ({
        entityId: potion.entity_id,
        id: potion.definition_id,
        ...(potion.name ? { name: potion.name } : {}),
        ...(potion.description ? { description: potion.description } : {}),
        slot: potion.slot,
        keywords: keywords(potion.keywords),
        cardPreviews: potion.card_previews.map(projectGatewayVisibleCard)
      })),
      maxPotionSlots: shared.player.max_potion_slots
    }
  };
}
