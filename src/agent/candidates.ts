import type { CandidateAction, JsonRecord, NormalizedCard, NormalizedState } from "./types.js";
import { getLivingEnemies, isCombatActionable } from "./state.js";
import { asNumber, asString, isRecord } from "./utils.js";
import { enrichMapCandidatesWithRoutePlan } from "./mapRoutePlan.js";

export function generateCandidates(state: NormalizedState): CandidateAction[] {
  switch (state.screen) {
    case "combat":
      return generateCombatCandidates(state);
    case "card_reward":
    case "rewards":
      return generateRewardCandidates(state);
    case "map":
      return enrichMapCandidatesWithRoutePlan(state, generateMapCandidates(state));
    case "rest":
      return generateIndexedOptionCandidates(state, "choose_rest_option", "休息点选项", true);
    case "event":
      return generateIndexedOptionCandidates(state, "event_choose_option", "事件选项", true);
    case "shop":
      return generateShopCandidates(state);
    case "crystal_sphere":
      return generateCrystalSphereCandidates(state);
    case "card_select":
      return generateCardSelectCandidates(state);
    case "bundle_select":
      return generateBundleSelectCandidates(state);
    case "menu":
      return generateMenuCandidates(state);
    case "treasure":
      return generateTreasureCandidates(state);
    case "game_over":
      return [{ id: "menu-main", kind: "menu_select", label: "返回主菜单", action: { kind: "menu_select", option: "main_menu" } }];
    default:
      return [];
  }
}

function generateTreasureCandidates(state: NormalizedState): CandidateAction[] {
  const rawTreasure = isRecord(state.raw.treasure) ? state.raw.treasure : {};
  const relics = Array.isArray(rawTreasure.relics) ? rawTreasure.relics.filter(isRecord) : [];
  const candidates: CandidateAction[] = [];
  if (relics.length > 0) {
    candidates.push(...relics.map((relic, index) => ({
      id: `treasure-relic-${relic.index ?? index}`,
      kind: "claim_treasure_relic" as const,
      label: `领取宝箱遗物 ${asString(relic.name ?? relic.id, `#${index}`)}`,
      action: {
        kind: "claim_treasure_relic" as const,
        index: typeof relic.index === "number" ? relic.index : index,
        relicName: asString(relic.name ?? relic.id, "")
      },
      facts: { relic }
    })));
  }

  if (rawTreasure.can_proceed === true || rawTreasure.canProceed === true) {
    candidates.push({ id: "proceed", kind: "proceed", label: "继续", action: { kind: "proceed" } });
  }

  return candidates;
}

function generateMenuCandidates(state: NormalizedState): CandidateAction[] {
  if (isRunStartMenuTransition(state)) return [];

  const rawOptions = rawMenuOptions(state);
  const options = rawOptions.filter(menuOptionEnabled);
  if (options.length === 0) {
    if (rawOptions.length > 0) return [];
    return [
      {
        id: "menu-singleplayer",
        kind: "menu_select" as const,
        label: "菜单 singleplayer",
        action: { kind: "menu_select" as const, option: "singleplayer" },
        facts: { menuScreen: asString(state.raw.menu_screen ?? state.raw.menuScreen, "") }
      }
    ];
  }

  return options.map((option, index) => {
    const value = menuOptionValue(option, index);
    const label = menuOptionLabel(option, index);
    return {
      id: `menu-${String(value)}`,
      kind: "menu_select" as const,
      label: `菜单 ${label}`,
      action: { kind: "menu_select" as const, option: value },
      facts: {
        menuScreen: asString(state.raw.menu_screen ?? state.raw.menuScreen, ""),
        option: isRecord(option) ? option : { value, label }
      }
    };
  });
}

function generateCrystalSphereCandidates(state: NormalizedState): CandidateAction[] {
  const rawSphere = isRecord(state.raw.crystal_sphere) ? state.raw.crystal_sphere : {};
  const tool = asString(rawSphere.tool, "big").toLowerCase();
  const canUseBig = rawSphere.can_use_big_tool === true || rawSphere.canUseBigTool === true;
  const canUseSmall = rawSphere.can_use_small_tool === true || rawSphere.canUseSmallTool === true;
  const canProceed = rawSphere.can_proceed === true || rawSphere.canProceed === true;
  const candidates: CandidateAction[] = [];

  if (canProceed) {
    candidates.push({
      id: "crystal-sphere-proceed",
      kind: "crystal_sphere_proceed" as const,
      label: "结束占卜并继续",
      action: { kind: "crystal_sphere_proceed" as const },
      facts: { screen: "crystal_sphere" }
    });
    return candidates;
  }

  if (canUseBig && tool !== "big") {
    candidates.push({
      id: "crystal-sphere-tool-big",
      kind: "crystal_sphere_set_tool" as const,
      label: "切换到大型占卜",
      action: { kind: "crystal_sphere_set_tool" as const, tool: "big" },
      facts: { tool: "big" }
    });
  }
  if (canUseSmall && tool !== "small") {
    candidates.push({
      id: "crystal-sphere-tool-small",
      kind: "crystal_sphere_set_tool" as const,
      label: "切换到小型占卜",
      action: { kind: "crystal_sphere_set_tool" as const, tool: "small" },
      facts: { tool: "small" }
    });
  }

  const cells = crystalSphereClickableCells(rawSphere);
  const limitedCells = cells
    .sort((a, b) => a.distance - b.distance || a.y - b.y || a.x - b.x)
    .slice(0, 12);

  candidates.push(
    ...limitedCells.map(({ x, y }) => ({
      id: `crystal-sphere-cell-${x}-${y}`,
      kind: "crystal_sphere_click_cell" as const,
      label: `揭示水晶格 (${x},${y})`,
      action: { kind: "crystal_sphere_click_cell" as const, x, y },
      facts: { x, y, tool }
    }))
  );

  return candidates;
}

function generateShopCandidates(state: NormalizedState): CandidateAction[] {
  const rawShop = isRecord(state.raw.shop) ? state.raw.shop : {};
  const items = Array.isArray(rawShop.items) ? rawShop.items.filter(isRecord) : state.options;
  const candidates: CandidateAction[] = items
    .filter((item) => item.is_stocked !== false && item.isStocked !== false && item.can_afford !== false && item.canAfford !== false)
    .map((item, index) => ({
      id: `shop-${item.index ?? index}`,
      kind: "shop_purchase" as const,
      label: `商店购买 ${shopItemName(item)} (${asString(item.price, "?")}g)`,
      action: {
        kind: "shop_purchase" as const,
        index: typeof item.index === "number" ? item.index : index
      },
      requiresLlm: true,
      facts: { item }
    }));

  candidates.push({
    id: "shop-proceed",
    kind: "proceed" as const,
    label: "离开商店",
    action: { kind: "proceed" as const },
    facts: { screen: "shop", canProceed: rawShop.can_proceed ?? rawShop.canProceed }
  });

  return candidates;
}

function rawMenuOptions(state: NormalizedState): unknown[] {
  if (Array.isArray(state.raw.options)) return state.raw.options;
  const menu = isRecord(state.raw.menu) ? state.raw.menu : {};
  if (Array.isArray(menu.options)) return menu.options;
  return [];
}

function isRunStartMenuTransition(state: NormalizedState): boolean {
  const run = isRecord(state.raw.run) ? state.raw.run : {};
  const act = asNumber(run.act, 0);
  const floor = asNumber(run.floor, -1);
  const menuScreen = asString(state.raw.menu_screen ?? state.raw.menuScreen, "").toLowerCase();
  const options = rawMenuOptions(state);
  const hasDisabledEmbarkOrConfirm = options.some(
    (option) =>
      isRecord(option) &&
      option.enabled === false &&
      /embark|confirm|start|开始|出发/i.test(asString(option.name ?? option.id ?? option.value ?? option.label, ""))
  );
  return act > 0 && floor >= 0 && menuScreen.includes("character_select") && hasDisabledEmbarkOrConfirm;
}

function menuOptionEnabled(option: unknown): boolean {
  if (!isRecord(option)) return true;
  return option.enabled !== false && option.disabled !== true && option.can_select !== false && option.canSelect !== false;
}

function menuOptionValue(option: unknown, index: number): string | number {
  if (typeof option === "string" || typeof option === "number") return option;
  if (!isRecord(option)) return index;
  const value = option.value ?? option.id ?? option.key ?? option.option ?? option.name ?? option.label ?? option.title;
  if (typeof value === "string" || typeof value === "number") return value;
  return index;
}

function menuOptionLabel(option: unknown, index: number): string {
  if (typeof option === "string" || typeof option === "number") return String(option);
  if (!isRecord(option)) return `#${index}`;
  return asString(option.label ?? option.name ?? option.title ?? option.id ?? option.value, `#${index}`);
}

function generateCardSelectCandidates(state: NormalizedState): CandidateAction[] {
  const rawCardSelect = cardSelectRaw(state);
  const isHandSelect = isHandSelectRaw(state);
  if (rawCardSelect.can_confirm === true || rawCardSelect.canConfirm === true) {
    return [
      {
        id: "confirm-selection",
        kind: isHandSelect ? "combat_confirm_selection" : "confirm_selection",
        label: "确认选牌",
        action: { kind: isHandSelect ? "combat_confirm_selection" : "confirm_selection" }
      }
    ];
  }

  const cards = asCardSelectCards(rawCardSelect);
  const candidates: CandidateAction[] = cards.map((card, index) => ({
    id: `select-card-${card.index ?? index}`,
    kind: isHandSelect ? "combat_select_card" : "select_card",
    label: `选择 ${asString(card.name ?? card.id, `#${index}`)}`,
    action: {
      kind: isHandSelect ? "combat_select_card" : "select_card",
      index: typeof card.index === "number" ? card.index : index,
      cardName: asString(card.name ?? card.id, "")
    },
    facts: {
      card,
      prompt: rawCardSelect.prompt,
      screenType: rawCardSelect.screen_type ?? rawCardSelect.screenType
    }
  }));

  if (rawCardSelect.can_cancel === true || rawCardSelect.canCancel === true) {
    candidates.push({
      id: "cancel-selection",
      kind: "cancel_selection" as const,
      label: "取消选牌",
      action: { kind: "cancel_selection" as const },
      facts: {
        prompt: rawCardSelect.prompt,
        screenType: rawCardSelect.screen_type ?? rawCardSelect.screenType
      }
    });
  }

  return candidates;
}

function cardSelectRaw(state: NormalizedState): JsonRecord {
  if (isRecord(state.raw.card_select)) return state.raw.card_select;
  if (isRecord(state.raw.cardSelect)) return state.raw.cardSelect;
  if (isRecord(state.raw.hand_select)) return state.raw.hand_select;
  if (isRecord(state.raw.handSelect)) return state.raw.handSelect;
  return {};
}

function isHandSelectRaw(state: NormalizedState): boolean {
  return isRecord(state.raw.hand_select) || isRecord(state.raw.handSelect) || state.stateType.toLowerCase().includes("hand_select");
}

function generateBundleSelectCandidates(state: NormalizedState): CandidateAction[] {
  const rawBundleSelect = bundleSelectRaw(state);
  if (rawBundleSelect.can_confirm === true || rawBundleSelect.canConfirm === true) {
    return [
      {
        id: "bundle-confirm",
        kind: "bundle_confirm_selection" as const,
        label: "确认当前卡包",
        action: { kind: "bundle_confirm_selection" as const },
        facts: {
          prompt: rawBundleSelect.prompt,
          previewCards: Array.isArray(rawBundleSelect.preview_cards) ? rawBundleSelect.preview_cards.filter(isRecord) : []
        }
      }
    ];
  }

  const bundles = asBundles(rawBundleSelect);
  const candidates: CandidateAction[] = bundles.map((bundle, index) => {
    const bundleIndex = typeof bundle.index === "number" ? bundle.index : index;
    const cards = Array.isArray(bundle.cards) ? bundle.cards.filter(isRecord) : [];
    const names = cards.map((card) => asString(card.name ?? card.id, "未知")).join(", ");
    return {
      id: `bundle-${bundleIndex}`,
      kind: "bundle_select" as const,
      label: `选择卡包 ${bundleIndex}: ${names || `${asString(bundle.card_count, "?")} 张牌`}`,
      action: { kind: "bundle_select" as const, index: bundleIndex },
      requiresLlm: true,
      facts: {
        bundle,
        cards,
        prompt: rawBundleSelect.prompt,
        screenType: rawBundleSelect.screen_type ?? rawBundleSelect.screenType
      }
    };
  });

  if (rawBundleSelect.can_cancel === true || rawBundleSelect.canCancel === true) {
    candidates.push({
      id: "bundle-cancel",
      kind: "bundle_cancel_selection" as const,
      label: "取消卡包选择",
      action: { kind: "bundle_cancel_selection" as const },
      facts: {
        prompt: rawBundleSelect.prompt,
        screenType: rawBundleSelect.screen_type ?? rawBundleSelect.screenType
      }
    });
  }

  return candidates;
}

function crystalSphereClickableCells(rawSphere: JsonRecord): Array<{ x: number; y: number; distance: number }> {
  const cells = Array.isArray(rawSphere.clickable_cells)
    ? rawSphere.clickable_cells.filter(isRecord)
    : Array.isArray(rawSphere.clickableCells)
      ? rawSphere.clickableCells.filter(isRecord)
      : [];
  const width = asNumber(rawSphere.grid_width ?? rawSphere.gridWidth, 11);
  const height = asNumber(rawSphere.grid_height ?? rawSphere.gridHeight, 11);
  const centerX = (width - 1) / 2;
  const centerY = (height - 1) / 2;
  return cells
    .map((cell) => {
      const x = asNumber(cell.x, Number.NaN);
      const y = asNumber(cell.y, Number.NaN);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
      return { x, y, distance: Math.abs(x - centerX) + Math.abs(y - centerY) };
    })
    .filter((cell): cell is { x: number; y: number; distance: number } => Boolean(cell));
}

function generateCombatCandidates(state: NormalizedState): CandidateAction[] {
  if (!isCombatActionable(state)) {
    return [];
  }

  const candidates: CandidateAction[] = [];
  const enemies = getLivingEnemies(state);
  const firstEnemy = enemies[0];

  for (const card of state.player.hand) {
    if (!card.canPlay) {
      continue;
    }

    const targets = needsTarget(card) ? enemies : [undefined];
    for (const target of targets) {
      candidates.push({
        id: `play-${card.index}${target ? `-${target.id}` : ""}`,
        kind: "play_card",
        label: target ? `打出 ${card.name} -> ${target.name}` : `打出 ${card.name}`,
        action: {
          kind: "play_card",
          cardIndex: card.index,
          cardName: card.name,
          target: target?.id
        },
        facts: {
          card,
          target
        }
      });
    }
  }

  for (let position = 0; position < state.player.potions.length; position += 1) {
    const potion = state.player.potions[position];
    if (!isManuallyUsablePotion(potion)) continue;
    const slot = typeof potion.slot === "number" ? potion.slot : position;
    const name = asString(potion.name ?? potion.id, `Potion ${slot}`);
    const target = potionNeedsTarget(potion) ? firstEnemy?.id : undefined;
    candidates.push({
      id: `potion-${slot}`,
      kind: "use_potion",
      label: target && firstEnemy ? `使用药水 ${name} -> ${firstEnemy.name}` : `使用药水 ${name}`,
      action: {
        kind: "use_potion",
        slot,
        ...(target ? { target } : {})
      },
      requiresLlm: true,
      facts: { potion }
    });
  }

  candidates.push({
    id: "end-turn",
    kind: "end_turn",
    label: "结束回合",
    action: { kind: "end_turn" }
  });

  return candidates;
}

function generateRewardCandidates(state: NormalizedState): CandidateAction[] {
  const cardRewards = findCardRewardList(state);
  if (cardRewards.length > 0) {
    const cardCandidates: CandidateAction[] = cardRewards.map((card, index) => ({
      id: `card-reward-${index}`,
      kind: "select_card_reward" as const,
      label: `选择卡牌 ${asString(card.name ?? card.id, `#${index}`)}`,
      action: {
        kind: "select_card_reward" as const,
        index,
        cardName: asString(card.name ?? card.id, "")
      },
      requiresLlm: true,
      facts: { card }
    }));

    cardCandidates.push({
      id: "skip-card-reward",
      kind: "skip_card_reward" as const,
      label: "跳过卡牌奖励",
      action: { kind: "skip_card_reward" as const },
      requiresLlm: true,
      facts: {}
    });

    return cardCandidates;
  }

  if (state.rewards.length > 0) {
    const blockedPotionRewards = state.rewards.filter((reward) => isPotionReward(reward) && potionSlotsFull(state));
    const candidates: CandidateAction[] = state.rewards
      .map((reward, position) => ({ reward, index: rewardIndex(reward, position) }))
      .filter(({ reward }) => !(isPotionReward(reward) && potionSlotsFull(state)))
      .map(({ reward, index }) => ({
        id: `reward-${index}`,
        kind: "claim_reward" as const,
        label: `领取奖励 ${asString(reward.name ?? reward.type ?? reward.id ?? reward.description, `#${index}`)}`,
        action: { kind: "claim_reward" as const, index },
        facts: { reward }
      }));

    if (blockedPotionRewards.length > 0) {
      candidates.push(...generateRewardPotionOverflowCandidates(state, blockedPotionRewards));
      if (screenCanProceed(state)) {
        candidates.push({
          id: "proceed-skip-blocked-potion",
          kind: "proceed" as const,
          label: "跳过满槽药水奖励并继续",
          action: { kind: "proceed" as const },
          facts: { blockedRewards: blockedPotionRewards }
        });
      }
    }

    return candidates;
  }

  if (screenCanProceed(state)) {
    return [{ id: "proceed", kind: "proceed", label: "继续到地图", action: { kind: "proceed" } }];
  }

  return [];
}

function generateRewardPotionOverflowCandidates(state: NormalizedState, blockedRewards: JsonRecord[]): CandidateAction[] {
  return state.player.potions.map((potion, position) => {
    const slot = typeof potion.slot === "number" ? potion.slot : position;
    return {
      id: `discard-potion-${slot}`,
      kind: "discard_potion" as const,
      label: `丢弃药水 ${asString(potion.name ?? potion.id, `#${slot}`)}，腾出奖励药水槽位`,
      action: { kind: "discard_potion" as const, slot },
      requiresLlm: true,
      facts: { potion, blockedRewards }
    };
  });
}

function rewardIndex(reward: JsonRecord, fallback: number): number {
  return typeof reward.index === "number" ? reward.index : fallback;
}

function isPotionReward(reward: JsonRecord): boolean {
  const text = `${reward.type ?? ""} ${reward.reward_type ?? ""} ${reward.rewardType ?? ""} ${reward.id ?? ""} ${
    reward.potion_id ?? ""
  } ${reward.potion_name ?? ""} ${reward.name ?? ""} ${reward.description ?? ""}`.toLowerCase();
  return /potion|药水/.test(text);
}

function potionSlotsFull(state: NormalizedState): boolean {
  const rawPlayer = isRecord(state.raw.player) ? state.raw.player : {};
  const maxSlots = Number(rawPlayer.max_potion_slots ?? rawPlayer.maxPotionSlots ?? rawPlayer.potion_slots ?? rawPlayer.potionSlots);
  return Number.isFinite(maxSlots) && maxSlots > 0 && state.player.potions.length >= maxSlots;
}

function generateMapCandidates(state: NormalizedState): CandidateAction[] {
  const nodes = state.mapNodes.length > 0 ? state.mapNodes : state.options;
  if (nodes.length === 0) {
    return [];
  }

  return nodes.map((node, index) => ({
    id: `map-${index}`,
    kind: "choose_map_node" as const,
    label: `选择地图节点 ${index}: ${asString(node.type ?? node.node_type ?? node.name ?? node.symbol, "未知")}`,
    action: { kind: "choose_map_node" as const, index },
    requiresLlm: true,
    facts: { node }
  }));
}

function generateIndexedOptionCandidates(
  state: NormalizedState,
  kind: "choose_rest_option" | "event_choose_option" | "shop_purchase",
  labelPrefix: string,
  requiresLlm = false
): CandidateAction[] {
  const options = state.options.length > 0 ? state.options : inferOptionsFromRaw(state.raw);
  if (options.length === 0) {
    if (kind === "choose_rest_option") {
      return [{ id: "proceed", kind: "proceed", label: "继续", action: { kind: "proceed" }, requiresLlm }];
    }
    return [];
  }

  return options.map((option, index) => {
    const label = asString(option.label ?? option.name ?? option.title ?? option.text, "未知");
    const description = asString(option.description ?? option.desc ?? option.body ?? "", "");
    const display = description ? `${label} - ${truncate(description, 160)}` : label;
    return {
      id: `${kind}-${index}`,
      kind,
      label: `${labelPrefix} ${index}: ${display}`,
      action: { kind, index },
      requiresLlm: requiresLlm && !isFlowOnlyOption(label),
      facts: { option }
    };
  });
}

function needsTarget(card: NormalizedCard): boolean {
  const targetType = (card.targetType ?? "").toLowerCase();
  return targetType.includes("enemy") || targetType === "anyenemy";
}

function potionNeedsTarget(potion: JsonRecord): boolean {
  const targetType = asString(potion.target_type ?? potion.targetType ?? potion.target, "").toLowerCase();
  return targetType.includes("enemy") || targetType === "anyenemy";
}

function isManuallyUsablePotion(potion: JsonRecord): boolean {
  if (
    potion.can_use === false ||
    potion.canUse === false ||
    potion.usable === false ||
    potion.can_use_in_combat === false ||
    potion.canUseInCombat === false ||
    potion.is_automatic === true ||
    potion.isAutomatic === true ||
    potion.automatic === true
  ) {
    return false;
  }
  const text = `${potion.id ?? ""} ${potion.name ?? ""} ${potion.potion_id ?? ""} ${potion.potion_name ?? ""} ${
    potion.description ?? ""
  } ${potion.text ?? ""}`.toLowerCase();
  return !/fairy[_\s-]*in[_\s-]*a[_\s-]*bottle|automatic|cannot be manually used|upon death|on death|自动/.test(text);
}

function truncate(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function findCardRewardList(state: NormalizedState): JsonRecord[] {
  const raw = state.raw;
  for (const key of ["cards", "card_rewards", "cardRewards", "card_options", "cardOptions", "card_choices", "cardChoices"]) {
    const value = raw[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  for (const key of ["card_reward", "cardReward", "reward_screen", "rewardScreen"]) {
    const value = raw[key];
    if (!isRecord(value)) {
      continue;
    }
    for (const childKey of ["cards", "card_rewards", "cardRewards", "choices", "options"]) {
      const child = value[childKey];
      if (Array.isArray(child)) {
        return child.filter(isRecord).filter(looksLikeCardReward);
      }
    }
  }

  for (const reward of state.rewards) {
    for (const key of ["cards", "card_rewards", "cardRewards", "choices", "options"]) {
      const value = reward[key];
      if (Array.isArray(value)) {
        return value.filter(isRecord).filter(looksLikeCardReward);
      }
    }
  }

  return [];
}

function looksLikeCardReward(value: JsonRecord): boolean {
  const text = `${value.id ?? ""} ${value.card_id ?? ""} ${value.name ?? ""} ${value.type ?? ""} ${value.description ?? ""}`;
  return Boolean(value.name ?? value.id ?? value.card_id) && !/gold|金币|relic|遗物|potion|药水/i.test(text);
}

function screenCanProceed(state: NormalizedState): boolean {
  for (const key of ["can_proceed", "canProceed"]) {
    if (state.raw[key] === true) return true;
    if (state.raw[key] === false) return false;
  }
  for (const key of ["reward_screen", "rewardScreen", "rewards", "screen"]) {
    const value = state.raw[key];
    if (!isRecord(value)) continue;
    if (value.can_proceed === true || value.canProceed === true) return true;
    if (value.can_proceed === false || value.canProceed === false) return false;
  }
  return true;
}

function inferOptionsFromRaw(raw: JsonRecord): JsonRecord[] {
  for (const key of ["options", "event_options", "rest_options", "shop_items", "items"]) {
    const value = raw[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }
  for (const path of [
    ["event", "options"],
    ["rest", "options"],
    ["shop", "items"],
    ["shop", "options"]
  ]) {
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

function asCardSelectCards(rawCardSelect: JsonRecord): JsonRecord[] {
  const value = rawCardSelect.cards;
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function bundleSelectRaw(state: NormalizedState): JsonRecord {
  if (isRecord(state.raw.bundle_select)) return state.raw.bundle_select;
  if (isRecord(state.raw.bundleSelect)) return state.raw.bundleSelect;
  return {};
}

function asBundles(rawBundleSelect: JsonRecord): JsonRecord[] {
  const value = rawBundleSelect.bundles;
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isFlowOnlyOption(label: string): boolean {
  return /^(proceed|continue|ok|确认|继续|离开)$/i.test(label.trim());
}

function shopItemName(item: JsonRecord): string {
  return asString(
    item.card_name ??
      item.relic_name ??
      item.potion_name ??
      item.name ??
      item.category ??
      item.id,
    "未知"
  );
}
