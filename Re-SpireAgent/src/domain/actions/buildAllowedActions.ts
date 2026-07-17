import type { CardSnapshot, CombatContext, NormalizedCurrentState, PlayerSnapshot, PotionSnapshot } from "../state/index.js";
import type { ExecutableGameAction } from "./action.js";
import type { AllowedAction } from "./allowedAction.js";

/**
 * Action construction is keyed by the active interaction surface. Context only
 * supplements a protocol when an operation needs semantic facts, such as combat targets.
 */
export function buildAllowedActions(state: NormalizedCurrentState, sourceStateHash: string): AllowedAction[] {
  if (state.stability !== "actionable") return [];
  if (state.actionAuthority === "none") return [];
  if (state.actionAuthority === "bridge_advertised") {
    return bridgeActions(state, sourceStateHash);
  }
  switch (state.surface.kind) {
    case "combat_turn":
      return state.context.kind === "combat" && state.player ? combatActions(state.context, state.player, sourceStateHash) : [];
    case "card_selection":
      return cardSelectionActions(state.surface, sourceStateHash);
    case "deck_enchant_selection":
    case "deck_removal_selection":
    case "combat_pile_card_selection":
    case "combat_hand_card_selection":
    case "generated_card_choice":
    case "card_bundle_selection":
    case "card_reward_selection":
    case "event_dialogue":
    case "event_option":
    case "rest_site":
    case "shop_inventory":
    case "shop_room":
      return [];
    case "card_reward":
      return [
        ...state.surface.options.flatMap((card) => card.index === undefined ? [] : [allowed(`card-reward:${card.index}`, `Take ${card.name}`, { kind: "select_card_reward", index: card.index }, sourceStateHash, card.description)]),
        ...(state.surface.canSkip ? [allowed("card-reward:skip", "Skip this card reward", { kind: "skip_card_reward" }, sourceStateHash)] : []),
        ...(state.surface.canProceed ? [allowed("card-reward:proceed", "Continue", { kind: "proceed" }, sourceStateHash)] : [])
      ];
    case "reward_claim":
      if ("legalActions" in state.surface) return [];
      return rewardActions(state.player, state.surface.items, state.surface.canProceed, sourceStateHash);
    case "map_navigation":
      return state.surface.nextOptions.map((node, position) => allowed(`map:${node.index ?? position}`, `Choose ${node.type} node${node.col !== undefined && node.row !== undefined ? ` at (${node.col},${node.row})` : ""}`, { kind: "choose_map_node", index: node.index ?? position }, sourceStateHash, node.leadsTo.length > 0 ? `Leads to ${node.leadsTo.map((next) => `${next.type ?? "node"}@${next.col},${next.row}`).join(", ")}` : undefined));
    case "option_choice":
      {
        const protocol = state.surface.protocol;
      return [
        ...state.surface.options.filter((option) => option.enabled).map((option) => protocol === "event"
          ? allowed(`event:${option.index}`, option.title, { kind: "choose_event_option", index: option.index }, sourceStateHash, option.description)
          : allowed(`rest:${option.index}`, option.title, { kind: "choose_rest_option", index: option.index }, sourceStateHash, option.description)),
        ...(state.surface.canProceed ? [allowed(`${protocol}:proceed`, "Continue", { kind: "proceed" }, sourceStateHash)] : [])
      ];
      }
    case "shop_interaction":
      return [
        ...state.surface.items.filter((item) => item.stocked && item.canAfford).map((item) => allowed(`shop:${item.index}`, `Buy ${item.name ?? item.category}${item.price !== undefined ? ` for ${item.price} gold` : ""}`, { kind: "shop_purchase", index: item.index }, sourceStateHash, item.description)),
        ...(state.surface.canLeave ? [allowed("shop:leave", "Leave shop", { kind: "proceed" }, sourceStateHash)] : [])
      ];
    case "treasure_claim":
      return [
        ...state.surface.relics.map((relic) => allowed(`treasure:${relic.index}`, `Take ${relic.name ?? relic.id ?? `relic ${relic.index}`}`, { kind: "claim_treasure_relic", index: relic.index }, sourceStateHash, relic.description)),
        ...(state.surface.canProceed ? [allowed("treasure:proceed", "Continue", { kind: "proceed" }, sourceStateHash)] : [])
      ];
    case "grid_interaction":
      return gridActions(state.surface, sourceStateHash);
    case "menu_choice":
      return state.surface.options.filter((option) => option.enabled).map((option) => allowed(`${state.context.kind === "run_ended" ? "game-over" : "menu"}:${String(option.value)}`, `Choose ${option.label}`, { kind: "menu_select", option: option.value }, sourceStateHash));
    case "no_action":
    case "unsupported":
      return [];
  }
}

function bridgeActions(state: NormalizedCurrentState, sourceStateHash: string): AllowedAction[] {
  const legalActions = "legalActions" in state.surface ? state.surface.legalActions : undefined;
  if (!legalActions) return [];
  return legalActions.map((action) => ({
    id: action.actionId,
    kind: action.kind,
    label: action.label,
    description: `Bridge-validated ${action.evidenceCode}`,
    ...(action.entityBindings.length > 0 ? { entityBindings: action.entityBindings } : {}),
    action: {
      kind: "bridge_v2_action",
      actionId: action.actionId,
      expectedStateId: action.stateId,
      bridgeActionKind: action.kind
    },
    sourceStateHash
  }));
}

function combatActions(context: CombatContext, player: PlayerSnapshot, sourceStateHash: string): AllowedAction[] {
  const livingEnemies = context.enemies.filter((enemy) => enemy.hp > 0);
  const cards = player.hand.flatMap((card) => {
    if (card.canPlay !== true || card.index === undefined) return [];
    if (needsEnemyTarget(card)) return livingEnemies.map((enemy) => allowed(`combat:play:${card.index}:target:${enemy.entityId}`, `Play ${card.name} on ${enemy.name}`, { kind: "play_card", cardIndex: card.index!, targetId: enemy.entityId }, sourceStateHash, card.description));
    return [allowed(`combat:play:${card.index}`, `Play ${card.name}`, { kind: "play_card", cardIndex: card.index }, sourceStateHash, card.description)];
  });
  return [...cards, ...player.potions.flatMap((potion, position) => potionActions(potion, position, context.enemies, sourceStateHash)), allowed("combat:end-turn", "End turn", { kind: "end_turn" }, sourceStateHash)];
}

function cardSelectionActions(surface: Extract<NormalizedCurrentState["surface"], { kind: "card_selection" }>, sourceStateHash: string): AllowedAction[] {
  return [
    // MCP currently does not expose selected ids or selection capacity after a standard selection.
    // Combat selection has a separately verified multi-select contract, so only standard selection is narrowed here.
    ...(surface.selectionMode === "standard" && surface.canConfirm ? [] : surface.options.flatMap((card) => card.index === undefined ? [] : [allowed(`card-selection:${card.index}`, `Select ${card.name}`, surface.selectionMode === "combat" ? { kind: "combat_select_card", index: card.index } : { kind: "select_card", index: card.index }, sourceStateHash, card.description)])),
    ...(surface.canConfirm ? [allowed("card-selection:confirm", "Confirm current selection", surface.selectionMode === "combat" ? { kind: "combat_confirm_selection" } : { kind: "confirm_selection" }, sourceStateHash)] : []),
    ...(surface.canCancel ? [allowed("card-selection:cancel", "Cancel selection", { kind: "cancel_selection" }, sourceStateHash)] : [])
  ];
}

function potionActions(potion: PotionSnapshot, position: number, enemies: CombatContext["enemies"], sourceStateHash: string): AllowedAction[] {
  if (potion.canUseInCombat !== true || potion.automatic === true) return [];
  const slot = potion.slot ?? position;
  if ((potion.targetType ?? "").toLowerCase().includes("enemy")) return enemies.filter((enemy) => enemy.hp > 0).map((enemy) => allowed(`combat:potion:${slot}:target:${enemy.entityId}`, `Use ${potion.name ?? potion.id} on ${enemy.name}`, { kind: "use_potion", slot, targetId: enemy.entityId }, sourceStateHash, potion.description));
  return [allowed(`combat:potion:${slot}`, `Use ${potion.name ?? potion.id}`, { kind: "use_potion", slot }, sourceStateHash, potion.description)];
}

function rewardActions(player: PlayerSnapshot | undefined, rewards: Array<{ index: number; type: string; name?: string; description?: string; potionName?: string }>, canProceed: boolean, sourceStateHash: string): AllowedAction[] {
  const potionSlotsFull = player?.maxPotionSlots !== undefined && player.potions.length >= player.maxPotionSlots;
  const blockedPotion = rewards.some((reward) => /potion/i.test(reward.type) && potionSlotsFull);
  const claims = rewards.filter((reward) => !(/potion/i.test(reward.type) && potionSlotsFull)).map((reward) => allowed(`reward:${reward.index}`, `Claim ${reward.name ?? reward.potionName ?? reward.description ?? reward.type}`, { kind: "claim_reward", index: reward.index }, sourceStateHash, reward.description));
  const discards = blockedPotion ? (player?.potions ?? []).map((potion, position) => { const slot = potion.slot ?? position; return allowed(`reward:discard-potion:${slot}`, `Discard ${potion.name ?? potion.id} to free a potion slot`, { kind: "discard_potion", slot }, sourceStateHash); }) : [];
  return [...claims, ...discards, ...(canProceed ? [allowed("reward:proceed", "Continue without remaining rewards", { kind: "proceed" }, sourceStateHash)] : [])];
}

function gridActions(surface: Extract<NormalizedCurrentState["surface"], { kind: "grid_interaction" }>, sourceStateHash: string): AllowedAction[] {
  if (surface.canProceed) return [allowed("crystal-sphere:proceed", "Finish divination", { kind: "crystal_sphere_proceed" }, sourceStateHash)];
  return [
    ...(surface.canUseBigTool && surface.selectedTool !== "big" ? [allowed("crystal-sphere:tool:big", "Switch to big divination tool", { kind: "crystal_sphere_set_tool", tool: "big" }, sourceStateHash)] : []),
    ...(surface.canUseSmallTool && surface.selectedTool !== "small" ? [allowed("crystal-sphere:tool:small", "Switch to small divination tool", { kind: "crystal_sphere_set_tool", tool: "small" }, sourceStateHash)] : []),
    ...surface.clickableCells.map((cell) => allowed(`crystal-sphere:cell:${cell.x}:${cell.y}`, `Reveal cell (${cell.x},${cell.y})`, { kind: "crystal_sphere_click_cell", x: cell.x, y: cell.y }, sourceStateHash))
  ];
}

function needsEnemyTarget(card: CardSnapshot): boolean { return (card.targetType ?? "").toLowerCase().includes("enemy"); }

function allowed(id: string, label: string, action: ExecutableGameAction, sourceStateHash: string, description?: string): AllowedAction {
  return { id, kind: action.kind, label, ...(description ? { description } : {}), action, sourceStateHash };
}
