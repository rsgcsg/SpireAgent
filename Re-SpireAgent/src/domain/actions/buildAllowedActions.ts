import type {
  CardSnapshot,
  CombatCurrentState,
  NormalizedCurrentState,
  PlayerSnapshot,
  PotionSnapshot
} from "../state/index.js";
import type { ExecutableGameAction } from "./action.js";
import type { AllowedAction } from "./allowedAction.js";

export function buildAllowedActions(state: NormalizedCurrentState, sourceStateHash: string): AllowedAction[] {
  if (state.stability !== "actionable") return [];

  switch (state.kind) {
    case "combat":
      return combatActions(state, sourceStateHash);
    case "card_reward":
      return [
        ...state.cardReward.options.flatMap((card, position) =>
          card.index === undefined
            ? []
            : [allowed(`card-reward:${card.index}`, `Take ${card.name}`, { kind: "select_card_reward", index: card.index }, sourceStateHash, card.description)]
        ),
        ...(state.cardReward.canSkip
          ? [allowed("card-reward:skip", "Skip this card reward", { kind: "skip_card_reward" }, sourceStateHash)]
          : []),
        ...(state.cardReward.canProceed
          ? [allowed("card-reward:proceed", "Continue", { kind: "proceed" }, sourceStateHash)]
          : [])
      ];
    case "rewards":
      return rewardActions(state.player, state.rewards.items, state.rewards.canProceed, sourceStateHash);
    case "card_selection":
      return [
        ...state.cardSelection.options.flatMap((card) =>
          card.index === undefined
            ? []
            : [
                allowed(
                  `card-selection:${card.index}`,
                  `Select ${card.name}`,
                  state.cardSelection.actionProtocol === "combat"
                    ? { kind: "combat_select_card", index: card.index }
                    : { kind: "select_card", index: card.index },
                  sourceStateHash,
                  card.description
                )
              ]
        ),
        ...(state.cardSelection.canConfirm
          ? [
              allowed(
                "card-selection:confirm",
                "Confirm current selection",
                state.cardSelection.actionProtocol === "combat"
                  ? { kind: "combat_confirm_selection" }
                  : { kind: "confirm_selection" },
                sourceStateHash
              )
            ]
          : []),
        ...(state.cardSelection.canCancel
          ? [allowed("card-selection:cancel", "Cancel selection", { kind: "cancel_selection" }, sourceStateHash)]
          : [])
      ];
    case "map":
      return state.map.nextOptions.map((node, position) =>
        allowed(
          `map:${node.index ?? position}`,
          `Choose ${node.type} node${node.col !== undefined && node.row !== undefined ? ` at (${node.col},${node.row})` : ""}`,
          { kind: "choose_map_node", index: node.index ?? position },
          sourceStateHash,
          node.leadsTo.length > 0 ? `Leads to ${node.leadsTo.map((next) => `${next.type ?? "node"}@${next.col},${next.row}`).join(", ")}` : undefined
        )
      );
    case "rest":
      return [
        ...state.rest.options.filter((option) => option.enabled).map((option) =>
          allowed(`rest:${option.index}`, option.title, { kind: "choose_rest_option", index: option.index }, sourceStateHash, option.description)
        ),
        ...(state.rest.canProceed ? [allowed("rest:proceed", "Continue", { kind: "proceed" }, sourceStateHash)] : [])
      ];
    case "event":
      return state.event.options.filter((option) => option.enabled).map((option) =>
        allowed(`event:${option.index}`, option.title, { kind: "choose_event_option", index: option.index }, sourceStateHash, option.description)
      );
    case "shop":
      return [
        ...state.shop.items.filter((item) => item.stocked && item.canAfford).map((item) =>
          allowed(
            `shop:${item.index}`,
            `Buy ${item.name ?? item.category}${item.price !== undefined ? ` for ${item.price} gold` : ""}`,
            { kind: "shop_purchase", index: item.index },
            sourceStateHash,
            item.description
          )
        ),
        ...(state.shop.canLeave ? [allowed("shop:leave", "Leave shop", { kind: "proceed" }, sourceStateHash)] : [])
      ];
    case "treasure":
      return [
        ...state.treasure.relics.map((relic) =>
          allowed(
            `treasure:${relic.index}`,
            `Take ${relic.name ?? relic.id ?? `relic ${relic.index}`}`,
            { kind: "claim_treasure_relic", index: relic.index },
            sourceStateHash,
            relic.description
          )
        ),
        ...(state.treasure.canProceed ? [allowed("treasure:proceed", "Continue", { kind: "proceed" }, sourceStateHash)] : [])
      ];
    case "crystal_sphere":
      return crystalSphereActions(state, sourceStateHash);
    case "menu":
      return state.menu.options.filter((option) => option.enabled).map((option) =>
        allowed(`menu:${String(option.value)}`, `Choose ${option.label}`, { kind: "menu_select", option: option.value }, sourceStateHash)
      );
    case "game_over":
      return state.gameOver.options.map((option) =>
        allowed(`game-over:${String(option.value)}`, option.label, { kind: "menu_select", option: option.value }, sourceStateHash)
      );
  }
}

function combatActions(state: CombatCurrentState, sourceStateHash: string): AllowedAction[] {
  const livingEnemies = state.combat.enemies.filter((enemy) => enemy.hp > 0);
  const cards = state.player.hand.flatMap((card) => {
    if (card.canPlay !== true || card.index === undefined) return [];
    if (needsEnemyTarget(card)) {
      return livingEnemies.map((enemy) =>
        allowed(
          `combat:play:${card.index}:target:${enemy.entityId}`,
          `Play ${card.name} on ${enemy.name}`,
          { kind: "play_card", cardIndex: card.index!, targetId: enemy.entityId },
          sourceStateHash,
          card.description
        )
      );
    }
    return [
      allowed(
        `combat:play:${card.index}`,
        `Play ${card.name}`,
        { kind: "play_card", cardIndex: card.index },
        sourceStateHash,
        card.description
      )
    ];
  });

  const potions = state.player.potions.flatMap((potion, position) =>
    potionActions(potion, position, livingEnemies, sourceStateHash)
  );

  return [...cards, ...potions, allowed("combat:end-turn", "End turn", { kind: "end_turn" }, sourceStateHash)];
}

function potionActions(
  potion: PotionSnapshot,
  position: number,
  enemies: CombatCurrentState["combat"]["enemies"],
  sourceStateHash: string
): AllowedAction[] {
  if (potion.canUseInCombat !== true || potion.automatic === true) return [];
  const slot = potion.slot ?? position;
  if ((potion.targetType ?? "").toLowerCase().includes("enemy")) {
    return enemies.map((enemy) =>
      allowed(
        `combat:potion:${slot}:target:${enemy.entityId}`,
        `Use ${potion.name ?? potion.id} on ${enemy.name}`,
        { kind: "use_potion", slot, targetId: enemy.entityId },
        sourceStateHash,
        potion.description
      )
    );
  }
  return [
    allowed(
      `combat:potion:${slot}`,
      `Use ${potion.name ?? potion.id}`,
      { kind: "use_potion", slot },
      sourceStateHash,
      potion.description
    )
  ];
}

function rewardActions(
  player: PlayerSnapshot | undefined,
  rewards: Array<{ index: number; type: string; name?: string; description?: string; potionName?: string }>,
  canProceed: boolean,
  sourceStateHash: string
): AllowedAction[] {
  const potionSlotsFull =
    player?.maxPotionSlots !== undefined && player.potions.length >= player.maxPotionSlots;
  const blockedPotion = rewards.some((reward) => /potion/i.test(reward.type) && potionSlotsFull);
  const claims = rewards
    .filter((reward) => !(/potion/i.test(reward.type) && potionSlotsFull))
    .map((reward) =>
      allowed(
        `reward:${reward.index}`,
        `Claim ${reward.name ?? reward.potionName ?? reward.description ?? reward.type}`,
        { kind: "claim_reward", index: reward.index },
        sourceStateHash,
        reward.description
      )
    );
  const discards = blockedPotion
    ? (player?.potions ?? []).map((potion, position) => {
        const slot = potion.slot ?? position;
        return allowed(
          `reward:discard-potion:${slot}`,
          `Discard ${potion.name ?? potion.id} to free a potion slot`,
          { kind: "discard_potion", slot },
          sourceStateHash
        );
      })
    : [];
  return [
    ...claims,
    ...discards,
    ...(canProceed ? [allowed("reward:proceed", "Continue without remaining rewards", { kind: "proceed" }, sourceStateHash)] : [])
  ];
}

function crystalSphereActions(
  state: Extract<NormalizedCurrentState, { kind: "crystal_sphere" }>,
  sourceStateHash: string
): AllowedAction[] {
  if (state.crystalSphere.canProceed) {
    return [allowed("crystal-sphere:proceed", "Finish divination", { kind: "crystal_sphere_proceed" }, sourceStateHash)];
  }
  return [
    ...(state.crystalSphere.canUseBigTool && state.crystalSphere.selectedTool !== "big"
      ? [allowed("crystal-sphere:tool:big", "Switch to big divination tool", { kind: "crystal_sphere_set_tool", tool: "big" }, sourceStateHash)]
      : []),
    ...(state.crystalSphere.canUseSmallTool && state.crystalSphere.selectedTool !== "small"
      ? [allowed("crystal-sphere:tool:small", "Switch to small divination tool", { kind: "crystal_sphere_set_tool", tool: "small" }, sourceStateHash)]
      : []),
    ...state.crystalSphere.clickableCells.map((cell) =>
      allowed(
        `crystal-sphere:cell:${cell.x}:${cell.y}`,
        `Reveal cell (${cell.x},${cell.y})`,
        { kind: "crystal_sphere_click_cell", x: cell.x, y: cell.y },
        sourceStateHash
      )
    )
  ];
}

function needsEnemyTarget(card: CardSnapshot): boolean {
  return (card.targetType ?? "").toLowerCase().includes("enemy");
}

function allowed(
  id: string,
  label: string,
  action: ExecutableGameAction,
  sourceStateHash: string,
  description?: string
): AllowedAction {
  return {
    id,
    kind: action.kind,
    label,
    ...(description ? { description } : {}),
    action,
    sourceStateHash
  };
}
