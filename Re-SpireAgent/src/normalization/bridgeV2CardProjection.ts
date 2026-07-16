import type { CardSnapshot } from "../domain/state/index.js";
import type { BridgeV2DeckEnchantSurface } from "../integrations/sts2mcp/bridgeV2Protocol.js";

export type BridgeV2VisibleCard = BridgeV2DeckEnchantSurface["cards"][number];

export function projectBridgeV2Card(card: BridgeV2VisibleCard): CardSnapshot {
  return {
    id: card.definition_id,
    entityId: card.entity_id,
    name: card.name ?? card.definition_id,
    type: card.type,
    cost: card.cost,
    ...(card.star_cost !== null && card.star_cost !== undefined ? { starCost: card.star_cost } : {}),
    ...(card.description ? { description: card.description } : {}),
    rarity: card.rarity,
    upgraded: card.is_upgraded,
    selected: card.is_selected,
    ...(card.target_type ? { targetType: card.target_type } : {}),
    ...(card.can_play !== null && card.can_play !== undefined ? { canPlay: card.can_play } : {}),
    ...(card.unplayable_reason !== undefined ? { unplayableReason: card.unplayable_reason } : {}),
    keywords: [],
    ...(card.existing_enchantment ? {
      existingEnchantment: {
        definitionId: card.existing_enchantment.definition_id,
        ...(card.existing_enchantment.name ? { name: card.existing_enchantment.name } : {}),
        ...(card.existing_enchantment.description ? { description: card.existing_enchantment.description } : {}),
        amount: card.existing_enchantment.amount,
        ...(card.existing_enchantment.observation_source
          ? { observationSource: card.existing_enchantment.observation_source }
          : {})
      }
    } : {})
  };
}
