import type { InteractionSurfaceKind, SemanticContextKind } from "../domain/state/index.js";

export interface StateGuide { id: string; version: number; text: string; }

const guide = (id: string, text: string, version = 5): StateGuide => ({
  id: `re-p1-${id}-guide`,
  version,
  text
});

const COMBAT_BASELINE = [
  "Normal combat baseline unless current visible facts override it:",
  "a turn usually starts with 3 Energy and draws 5 cards;",
  "the hand limit is normally 10;",
  "unspent Energy normally expires and the next turn recalculates Energy;",
  "Block prevents ordinary damage before HP loss and normally clears at the start of the next turn;",
  "played Attacks and Skills normally go to the Discard Pile, Powers normally remain active, and unplayed cards normally discard at end of turn;",
  "Retain keeps a card in hand, Ethereal Exhausts it at end of turn, and Exhaust removes it for the rest of combat;",
  "when a draw cannot be completed from the Draw Pile, the Discard Pile is normally shuffled into a new Draw Pile;",
  "Potions normally cost no Energy and do not count as playing cards;",
  "enemy intents reveal the next enemy actions.",
  "Exact visible card, relic, potion, power, status, character, enemy, and guide text always has priority over these defaults."
].join(" ");

/** A-owned strategy context. It does not grant or remove C actions. */
export const CONTEXT_GUIDES: Record<SemanticContextKind, StateGuide> = {
  combat: guide("context-combat", `Semantic context is combat. ${COMBAT_BASELINE} Use exact displayed values and statuses without inventing or double-applying modifiers. Preserve HP by checking safe lethal, total visible incoming damage, Block and mitigation, threat removal, card order, Energy, hand space, draw/discard/exhaust cycles, potions, and whether immediate defense or scaling produces the best full-turn result.`),
  reward_flow: guide("context-reward-flow", "Semantic context is a reward flow. Resolve the active child interaction using exact visible rewards and inventory limits. Take value that improves the run, compare optional cards with skip, and manage potion capacity explicitly."),
  card_reward: guide("context-card-reward", "Semantic context is a card reward. Compare every visible card with skip. Take a card only when its value outweighs deck dilution."),
  rewards: guide("context-rewards", "Semantic context is a post-combat rewards screen. Resolve visible rewards and inventory constraints before continuing."),
  map: guide("context-map", "Semantic context is map navigation. Choose among visible connected nodes while balancing survival, growth, route flexibility, and the known Act boss."),
  rest: guide("context-rest", "Semantic context is a rest site. Compare visible healing, upgrade, and other enabled options without using a fixed HP threshold."),
  event: guide("context-event", "Semantic context is an event. Evaluate only revealed text, visible costs, rewards, and enabled choices; never use hidden future outcomes."),
  shop: guide("context-shop", "Semantic context is a shop. Compare exact visible offers, prices, inventory capacity, deck needs, remaining gold, and opportunity cost."),
  treasure: guide("context-treasure", "Semantic context is treasure collection. Treat opening, choosing, child interactions, and leaving as separate current actions."),
  crystal_sphere: guide("context-crystal-sphere", "Semantic context is the Crystal Sphere. Use only current player-visible facts and actions."),
  menu: guide("context-menu", "Semantic context is a top-level menu. Continue the intended bounded ordinary run only through current advertised actions."),
  run_ended: guide("context-run-ended", "The bounded run has ended. Stop before selecting any restart action."),
  combat_transition: guide("context-combat-transition", "Combat is starting or resolving. Wait for a coherent player interaction."),
  run_transition: guide("context-run-transition", "The run is mounting a new player-visible state. Wait for a coherent player interaction."),
  unknown: guide("context-unknown", "The context interpretation is unknown. Use only the exact current Player Environment facts and actions; never infer hidden game state.")
};

/**
 * The Player Environment is the only current Re surface. Interaction-specific
 * facts stay in C's tagged content; A interprets them without owning legality.
 */
export const SURFACE_GUIDES: Record<InteractionSurfaceKind, StateGuide> = {
  player_environment: guide("surface-player-environment", "The active surface is the exact current Player Environment interaction. Treat content, referents, state-bound reads, completeness, and capabilities as player-visible C evidence. Choose exactly one advertised opaque bound action. Never invent a control, target, hidden outcome, native operand, or business completion."),
  unsupported: guide("surface-unsupported", "The Player Environment payload failed strict decoding. Do not invoke the model or infer an action.")
};
