import type { InteractionSurfaceKind, SemanticContextKind } from "../domain/state/index.js";

export interface StateGuide { id: string; version: number; text: string; }

const guide = (id: string, text: string, version = 3): StateGuide => ({
  id: `re-p1-${id}-guide`,
  version,
  text
});

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
  combat_transition: guide("context-combat-transition", "Combat is starting or resolving. The phase is explicit, no player input owner exists, and the agent must only poll."),
  unknown: guide("context-unknown", "The semantic origin is unknown. Only a separately supported surface may be actionable; never infer missing game facts.")
};

export const SURFACE_GUIDES: Record<InteractionSurfaceKind, StateGuide> = {
  combat_turn: guide("surface-combat-turn", "Active surface is a combat turn. Choose one immediate card, potion, or end-turn action. Targets and indices are encoded in allowed action ids."),
  combat_pile_card_selection: guide("surface-combat-pile-card-selection", "Active surface is a source-bound combat-pile selection. Read purpose, source card, source and destination piles, destination position, overflow behavior, exact visible card instances, current selected set, and selection limits. Some sources commit after one pick; Dredge and CHARGE!! are bounded multi-step toggle transactions that commit automatically at their exact required counts. Do not infer one source card's business outcome from another source that happens to share this selector; choose only one Bridge-advertised opaque action per decision.", 5),
  combat_hand_card_selection: guide("surface-combat-hand-card-selection", "Active surface is an in-combat hand-card selection. Read the exact card instance ids, selected membership, mode, limits, and confirm state. Selecting another card may replace the current selection; choose only one Bridge-advertised opaque action. If peek mode is active, return to the selector before choosing a card."),
  event_card_acquisition: guide("surface-event-card-acquisition", "Active surface is an audited event card acquisition. The visible cards are temporary offers and the fixed number selected will be added to the persistent run deck. Compare the event meaning, exact card facts, selection count, and current selected membership; choose only one Bridge-advertised opaque select or deselect action."),
  generated_card_choice: guide("surface-generated-card-choice", "Active surface is a source-bound one-of-N temporary-card choice. Read purpose, sourceKind, destination, selectedCardCostPolicy, overflowDestination, and canSkip instead of inferring business meaning from the shared card grid. Quasar adds the chosen card at its shown cost; potion and Splash choices make it free this turn; Knowledge Demon applies the chosen effect immediately and cannot be skipped. The cards are offers, not current pile members. Choose one Bridge-advertised action, use skip only when explicitly present, or return from peek mode before choosing.", 4),
  card_bundle_selection: guide("surface-card-bundle-selection", "Active surface is a two-stage choice between atomic card bundles. Compare each package as a whole; its member cards are descriptive facts, not separate legal actions. Preview one advertised bundle, then confirm or cancel only through the exact actions exposed for that preview."),
  card_selection: guide("surface-card-selection", "Active surface is card selection. Read selectionMode, purpose, prompt, options, previewShowing, previewCards, and confirm/cancel availability. When a preview is visible, use previewCards to understand what the current confirm/cancel choice commits or discards. Choose exactly one immediate selection action. If the state does not expose selected cards or remaining capacity, do not claim which cards are selected or whether another selection is legal."),
  deck_enchant_selection: guide("surface-deck-enchant", "Active surface is a two-stage deck enchant selection. Read the target enchantment, selection constraints, selected card instances, candidate cards, and stage. Choose only a Bridge-advertised opaque action; selecting, previewing, cancelling, and applying are distinct actions."),
  deck_removal_selection: guide("surface-deck-removal", "Active surface is the merchant card-removal child. Read its exact visible cards, selection limits, selected membership, prompt, and stage. It is neither a universal deck selector nor an immediate shop purchase: select, preview, confirm, or cancel only through the advertised opaque actions."),
  relic_deck_removal_selection: guide("surface-relic-deck-removal", "Active surface is the exact Precise Scissors acquisition child. It shares visible deck-selection mechanics with merchant removal but has no shop price or service semantics. Select, preview, confirm, or cancel only through the advertised opaque actions."),
  reward_deck_removal_selection: guide("surface-reward-deck-removal", "Active surface is one exact CardRemovalReward child, such as a removal reward created after combat by Forbidden Grimoire. It shares deck-removal mechanics but is not a merchant purchase or relic acquisition. Select, preview, confirm, or cancel only through the advertised opaque actions."),
  deck_upgrade_selection: guide("surface-deck-upgrade", "Active surface is a purpose-specific deck upgrade selector. Compare current card facts with the exact visible upgraded preview, respect selected membership and limits, and use only advertised select, cancel, or confirm actions. Confirmation is not complete until the selected card instances are actually upgraded."),
  deck_transform_selection: guide("surface-deck-transform", "Active surface is a purpose-specific random deck transformation. Compare exact candidate cards and selected membership. The preview is an uncommitted cycle of possibilities, never the known future replacement. Choose only advertised selection, preview, presentation-toggle, cancel, or commit actions."),
  wood_carvings_replacement_selection: guide("surface-wood-carvings-replacement", "Active surface is the native Wood Carvings Bird or Torus replacement. The replacement card is deterministic and visible in the surface. Compare eligible Basic cards and selected membership, then use only the advertised select, preview-cancel, or confirm action."),
  card_reward_selection: guide("surface-card-reward-selection", "Active surface is a Bridge-authoritative card reward selection. Compare the visible cards and every separately labeled alternative. Choose only an advertised opaque action; never reinterpret an alternative as skip from its position."),
  card_reward: guide("surface-card-reward", "Active surface is card reward selection. Take, skip, or continue only when that exact allowed action exists."),
  reward_claim: guide("surface-reward-claim", "Active surface is a Bridge-authoritative outer reward screen. Claim only an enabled advertised reward, resolve a full potion belt only through an advertised discard action, or use the separately advertised proceed action. A card reward claim opens a distinct card-reward-selection surface; do not assume its choices here."),
  map_navigation: guide("surface-map-navigation", "Active surface is map navigation. Choose one currently selectable next node."),
  event_dialogue: guide("surface-event-dialogue", "Active surface is an Ancient event dialogue. Read only the revealed dialogue prefix and current speaker. Future dialogue is intentionally absent. Advance only through the single Bridge-advertised opaque action."),
  event_option: guide("surface-event-option", "Active surface is a Bridge-authoritative event option protocol. Read event meaning from context, option text from surface, and choose only an opaque advertised action."),
  rest_site: guide("surface-rest-site", "Active surface is a Bridge-authoritative rest site. Compare each visible enabled rest option and choose only an advertised opaque action. A Smith choice may open a separate card-selection surface; proceeding to the map is a distinct action."),
  shop_inventory: guide("surface-shop-inventory", "Active surface is the open merchant inventory. Compare typed card, relic, potion, and card-removal offers using price, stock, visibility, affordability, purchase eligibility, and blockedReason. Choose only an advertised opaque purchase or close action. Affordability alone is not purchase authority, a full potion belt blocks potion purchase, and card removal opens a separate selection surface."),
  shop_room: guide("surface-shop-room", "Active surface is the merchant room after the inventory is closed. Only reopen the inventory or proceed to the map through an advertised opaque action. Purchase actions cannot exist on this surface."),
  treasure_room: guide("surface-treasure-room", "Active surface is the single-player treasure room. Chest opening, relic choice or skip, and room departure are separate Bridge-advertised actions. Compare the exact visible relic description, rarity, and hover keywords; a choice is complete only after its semantic inventory post-state is observed."),
  game_over: guide("surface-game-over", "Active surface is the ordinary single-player game-over lifecycle. The intro Continue and the later return control are separate Bridge-advertised actions. Do not skip the current visible stage or infer a restart action."),
  character_select: guide("surface-character-select", "Active surface is ordinary single-player character selection. Compare only the visible character choices, selected-character panel, visible Ascension controls, and Bridge-advertised navigation or embark actions. Starting decks and collection totals are intentionally absent because this screen does not show them."),
  main_menu: guide("surface-main-menu", "Active surface is the exact root menu. Continue or open Single Player only through a Bridge-advertised opaque action. Other visible root choices are facts only when marked visible_unsupported and must never be treated as executable."),
  singleplayer_menu: guide("surface-singleplayer-menu", "Active surface is the standard single-player submenu. Open Standard or go Back only through a Bridge-advertised opaque action. Daily and Custom remain visible facts but are outside this bounded contract."),
  option_choice: guide("surface-option-choice", "Active surface is an indexed option choice. Choose one enabled option or explicit proceed action only."),
  shop_interaction: guide("surface-shop", "Active surface is shop interaction. Buy one listed affordable item or leave only via an allowed action."),
  treasure_claim: guide("surface-treasure", "Active surface is treasure claim. Choose an exposed relic or continue action."),
  grid_interaction: guide("surface-grid", "Active surface is a grid interaction. Choose only an exposed tool, cell, or finish action."),
  menu_choice: guide("surface-menu", "Active surface is a menu choice. Choose only an enabled menu option."),
  no_action: guide("surface-no-action", "There is no actionable interaction surface. Do not produce a decision."),
  unsupported: guide("surface-unsupported", "The active interaction protocol is unsupported. Do not produce a decision.")
};
