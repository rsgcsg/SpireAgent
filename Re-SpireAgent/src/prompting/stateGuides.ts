import type { CurrentStateKind } from "../domain/state/index.js";

export interface StateGuide {
  id: string;
  version: number;
  stateKind: CurrentStateKind;
  text: string;
}

const guide = (stateKind: CurrentStateKind, text: string): StateGuide => ({
  id: `re-p1-${stateKind}-guide`,
  version: 1,
  stateKind,
  text
});

export const STATE_GUIDES: Record<CurrentStateKind, StateGuide> = {
  combat: guide(
    "combat",
    "This is combat. player.hand is the current hand; combat.enemies contains visible enemies and intents. Choose one immediate card, potion, or end-turn action. Targets and indices are already encoded in allowedAction ids."
  ),
  card_reward: guide(
    "card_reward",
    "This is a card reward. Taking a card adds it to the deck. Skip or continue is legal only when the corresponding allowedAction exists."
  ),
  rewards: guide(
    "rewards",
    "This is the post-combat reward screen. Choose one currently allowed reward, potion-discard, or proceed action. The next state will be read after execution."
  ),
  card_selection: guide(
    "card_selection",
    "This is a card-selection surface. Read cardSelection.purpose, prompt, actionProtocol, options, and confirm/cancel availability. Select or confirm exactly one immediate action."
  ),
  map: guide(
    "map",
    "This is the map. map.nextOptions are the nodes currently selectable. map.nodes and map.visited provide visible route context. Choose one next-node action."
  ),
  rest: guide(
    "rest",
    "This is a rest site. Choose one enabled rest option or proceed only when that exact action is available."
  ),
  event: guide(
    "event",
    "This is an event. event.options describes the currently visible choices, including explicit proceed options. Choose one enabled option."
  ),
  shop: guide(
    "shop",
    "This is a shop. shop.items includes current stock, prices, affordability, and descriptions. You may buy one listed item or leave using an allowed action."
  ),
  treasure: guide(
    "treasure",
    "This is a treasure screen. Choose a visible relic or continue only through the provided allowed action."
  ),
  crystal_sphere: guide(
    "crystal_sphere",
    "This is the Crystal Sphere. Choose one tool switch, one clickable cell, or finish when provided. Coordinates are already validated in allowedAction ids."
  ),
  menu: guide(
    "menu",
    "This is a game menu. Choose one enabled menu option from allowedActions."
  ),
  game_over: guide(
    "game_over",
    "The run has ended. Choose one available game-over menu action."
  ),
  transition: guide(
    "transition",
    "This state is transitional and must not produce a decision."
  ),
  unknown: guide(
    "unknown",
    "This state is unsupported or invalid and must not produce a decision."
  )
};
