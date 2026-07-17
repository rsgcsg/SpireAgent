import type { InteractionSurfaceKind, SemanticContextKind } from "../domain/state/index.js";

export interface StateGuide { id: string; version: number; text: string; }

const guide = (id: string, text: string): StateGuide => ({ id: `re-p1-${id}-guide`, version: 3, text });

/** Context guides explain game meaning; surface guides explain the immediate protocol. */
export const CONTEXT_GUIDES: Record<SemanticContextKind, StateGuide> = {
  combat: guide("context-combat", "Semantic context is combat. context contains encounter, turn, and enemy facts even when an overlay is active."),
  reward_flow: guide("context-reward-flow", "Semantic context is a reward flow. The active surface owns the current reward interaction; do not assume every alternative means skip."),
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
  combat_pile_card_selection: guide("surface-combat-pile-card-selection", "Active surface is a combat-pile card selection. Read the visible source pile, prompt, exact card instances, selected-card membership, selection limits, and auto/manual confirmation mode. Choose only one Bridge-advertised opaque action; selection may close automatically when its requirement is met."),
  combat_hand_card_selection: guide("surface-combat-hand-card-selection", "Active surface is an in-combat hand-card selection. Read the exact card instance ids, selected membership, mode, limits, and confirm state. Selecting another card may replace the current selection; choose only one Bridge-advertised opaque action. If peek mode is active, return to the selector before choosing a card."),
  generated_card_choice: guide("surface-generated-card-choice", "Active surface is a one-of-N temporary card choice created by an in-combat generator. These cards are options, not the current hand, draw pile, or a deck reward. Choose one Bridge-advertised card, use an explicit skip when present, or return from peek mode before choosing."),
  card_bundle_selection: guide("surface-card-bundle-selection", "Active surface is a two-stage choice between atomic card bundles. Compare each package as a whole; its member cards are descriptive facts, not separate legal actions. Preview one advertised bundle, then confirm or cancel only through the exact actions exposed for that preview."),
  card_selection: guide("surface-card-selection", "Active surface is card selection. Read selectionMode, purpose, prompt, options, previewShowing, previewCards, and confirm/cancel availability. When a preview is visible, use previewCards to understand what the current confirm/cancel choice commits or discards. Choose exactly one immediate selection action. If the state does not expose selected cards or remaining capacity, do not claim which cards are selected or whether another selection is legal."),
  deck_enchant_selection: guide("surface-deck-enchant", "Active surface is a two-stage deck enchant selection. Read the target enchantment, selection constraints, selected card instances, candidate cards, and stage. Choose only a Bridge-advertised opaque action; selecting, previewing, cancelling, and applying are distinct actions."),
  card_reward_selection: guide("surface-card-reward-selection", "Active surface is a Bridge-authoritative card reward selection. Compare the visible cards and every separately labeled alternative. Choose only an advertised opaque action; never reinterpret an alternative as skip from its position."),
  card_reward: guide("surface-card-reward", "Active surface is card reward selection. Take, skip, or continue only when that exact allowed action exists."),
  reward_claim: guide("surface-reward-claim", "Active surface is a Bridge-authoritative outer reward screen. Claim only an enabled advertised reward, resolve a full potion belt only through an advertised discard action, or use the separately advertised proceed action. A card reward claim opens a distinct card-reward-selection surface; do not assume its choices here."),
  map_navigation: guide("surface-map-navigation", "Active surface is map navigation. Choose one currently selectable next node."),
  event_dialogue: guide("surface-event-dialogue", "Active surface is an Ancient event dialogue. Read only the revealed dialogue prefix and current speaker. Future dialogue is intentionally absent. Advance only through the single Bridge-advertised opaque action."),
  event_option: guide("surface-event-option", "Active surface is a Bridge-authoritative event option protocol. Read event meaning from context, option text from surface, and choose only an opaque advertised action."),
  rest_site: guide("surface-rest-site", "Active surface is a Bridge-authoritative rest site. Compare each visible enabled rest option and choose only an advertised opaque action. A Smith choice may open a separate card-selection surface; proceeding to the map is a distinct action."),
  option_choice: guide("surface-option-choice", "Active surface is an indexed option choice. Choose one enabled option or explicit proceed action only."),
  shop_interaction: guide("surface-shop", "Active surface is shop interaction. Buy one listed affordable item or leave only via an allowed action."),
  treasure_claim: guide("surface-treasure", "Active surface is treasure claim. Choose an exposed relic or continue action."),
  grid_interaction: guide("surface-grid", "Active surface is a grid interaction. Choose only an exposed tool, cell, or finish action."),
  menu_choice: guide("surface-menu", "Active surface is a menu choice. Choose only an enabled menu option."),
  no_action: guide("surface-no-action", "There is no actionable interaction surface. Do not produce a decision."),
  unsupported: guide("surface-unsupported", "The active interaction protocol is unsupported. Do not produce a decision.")
};
