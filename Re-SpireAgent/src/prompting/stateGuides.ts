import type { InteractionSurfaceKind, SemanticContextKind } from "../domain/state/index.js";

export interface StateGuide { id: string; version: number; text: string; }

const guide = (id: string, text: string): StateGuide => ({ id: `re-p1-${id}-guide`, version: 3, text });

/** Context guides explain game meaning; surface guides explain the immediate protocol. */
export const CONTEXT_GUIDES: Record<SemanticContextKind, StateGuide> = {
  combat: guide("context-combat", "Semantic context is combat. context contains encounter, turn, and enemy facts even when an overlay is active."),
  card_reward: guide("context-card-reward", "Semantic context is a card reward."),
  rewards: guide("context-rewards", "Semantic context is a post-combat rewards screen."),
  map: guide("context-map", "Semantic context is map navigation; context retains visible route facts."),
  rest: guide("context-rest", "Semantic context is a rest site."),
  event: guide("context-event", "Semantic context is an event. A new event id is data, not a new protocol, when it exposes a known surface."),
  shop: guide("context-shop", "Semantic context is a shop."),
  treasure: guide("context-treasure", "Semantic context is treasure collection."),
  crystal_sphere: guide("context-crystal-sphere", "Semantic context is the Crystal Sphere."),
  menu: guide("context-menu", "Semantic context is a top-level menu."),
  run_ended: guide("context-run-ended", "The run has ended. Bounded runs stop before choosing a restart action."),
  post_combat: guide("context-post-combat", "Combat has ended and the game is transitioning to rewards."),
  unknown: guide("context-unknown", "The semantic origin is unknown. Only a separately supported surface may be actionable; never infer missing game facts.")
};

export const SURFACE_GUIDES: Record<InteractionSurfaceKind, StateGuide> = {
  combat_turn: guide("surface-combat-turn", "Active surface is a combat turn. Choose one immediate card, potion, or end-turn action. Targets and indices are encoded in allowed action ids."),
  card_selection: guide("surface-card-selection", "Active surface is card selection. Read selectionMode, purpose, prompt, options, and confirm/cancel availability. Choose exactly one immediate selection action. If the state does not expose selected cards or remaining capacity, do not claim which cards are selected or whether another selection is legal."),
  deck_enchant_selection: guide("surface-deck-enchant", "Active surface is a two-stage deck enchant selection. Read the target enchantment, selection constraints, selected card instances, candidate cards, and stage. Choose only a Bridge-advertised opaque action; selecting, previewing, cancelling, and applying are distinct actions."),
  card_reward: guide("surface-card-reward", "Active surface is card reward selection. Take, skip, or continue only when that exact allowed action exists."),
  reward_claim: guide("surface-reward-claim", "Active surface is reward claim. Choose an exposed claim, potion discard, or proceed action."),
  map_navigation: guide("surface-map-navigation", "Active surface is map navigation. Choose one currently selectable next node."),
  option_choice: guide("surface-option-choice", "Active surface is an indexed option choice. Choose one enabled option or explicit proceed action only."),
  shop_interaction: guide("surface-shop", "Active surface is shop interaction. Buy one listed affordable item or leave only via an allowed action."),
  treasure_claim: guide("surface-treasure", "Active surface is treasure claim. Choose an exposed relic or continue action."),
  grid_interaction: guide("surface-grid", "Active surface is a grid interaction. Choose only an exposed tool, cell, or finish action."),
  menu_choice: guide("surface-menu", "Active surface is a menu choice. Choose only an enabled menu option."),
  no_action: guide("surface-no-action", "There is no actionable interaction surface. Do not produce a decision."),
  unsupported: guide("surface-unsupported", "The active interaction protocol is unsupported. Do not produce a decision.")
};
