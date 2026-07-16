export interface KeywordSnapshot {
  name: string;
  description?: string;
}

export interface StatusSnapshot {
  id?: string;
  name?: string;
  amount?: number;
  type?: string;
  description?: string;
}

export interface RelicSnapshot {
  id: string;
  name?: string;
  description?: string;
  counter?: number | null;
  keywords: KeywordSnapshot[];
}

export interface PotionSnapshot {
  id: string;
  name?: string;
  description?: string;
  slot?: number;
  canUseInCombat?: boolean;
  targetType?: string;
  automatic?: boolean;
  keywords: KeywordSnapshot[];
}

export interface CardSnapshot {
  id: string;
  entityId?: string;
  name: string;
  index?: number;
  type?: string;
  cost?: string | number | null;
  starCost?: string | number | null;
  description?: string;
  rarity?: string;
  upgraded?: boolean;
  keywords: KeywordSnapshot[];
  targetType?: string;
  canPlay?: boolean;
  unplayableReason?: string | null;
  selected?: boolean;
  existingEnchantment?: EnchantmentSnapshot;
}

export interface EnchantmentSnapshot {
  definitionId: string;
  name?: string;
  description?: string;
  amount: number;
  observationSource?: string;
}

export interface OrbSnapshot {
  id: string;
  name?: string;
  description?: string;
  passiveValue?: number;
  evokeValue?: number;
}

export interface PlayerSnapshot {
  character: string;
  hp: number;
  maxHp: number;
  block?: number;
  energy?: number;
  maxEnergy?: number;
  gold?: number;
  hand: CardSnapshot[];
  drawPileCount?: number;
  discardPileCount?: number;
  exhaustPileCount?: number;
  drawPile: CardSnapshot[];
  discardPile: CardSnapshot[];
  exhaustPile: CardSnapshot[];
  orbs: OrbSnapshot[];
  orbSlots?: number;
  orbEmptySlots?: number;
  statuses: StatusSnapshot[];
  relics: RelicSnapshot[];
  potions: PotionSnapshot[];
  maxPotionSlots?: number;
}

export interface EnemyIntentSnapshot {
  type: string;
  label?: string;
  title?: string;
  description?: string;
}

export interface EnemySnapshot {
  entityId: string;
  combatId?: number;
  name: string;
  hp: number;
  maxHp: number;
  block?: number;
  statuses: StatusSnapshot[];
  intents: EnemyIntentSnapshot[];
}

export interface MapNodeSnapshot {
  index?: number;
  col?: number;
  row?: number;
  type: string;
  id?: string;
  leadsTo: Array<{ col: number; row: number; type?: string }>;
  children: Array<{ col: number; row: number }>;
}

export interface IndexedOptionSnapshot {
  index: number;
  id?: string;
  title: string;
  description?: string;
  enabled: boolean;
  proceed?: boolean;
  chosen?: boolean;
}

export interface RewardSnapshot {
  index: number;
  type: string;
  id?: string;
  name?: string;
  description?: string;
  goldAmount?: number;
  potionId?: string;
  potionName?: string;
  relicId?: string;
  relicName?: string;
}

export interface ShopItemSnapshot {
  index: number;
  category: string;
  price?: number;
  stocked: boolean;
  canAfford: boolean;
  onSale?: boolean;
  id?: string;
  name?: string;
  description?: string;
}
