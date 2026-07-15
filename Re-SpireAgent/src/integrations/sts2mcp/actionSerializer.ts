import type { ExecutableGameAction } from "../../domain/actions/action.js";
import type { JsonObject } from "../../shared/json.js";

export function serializeSts2McpAction(action: ExecutableGameAction): JsonObject {
  switch (action.kind) {
    case "play_card":
      return { action: "play_card", card_index: action.cardIndex, ...(action.targetId ? { target: action.targetId } : {}) };
    case "end_turn":
      return { action: "end_turn" };
    case "use_potion":
      return { action: "use_potion", slot: action.slot, ...(action.targetId ? { target: action.targetId } : {}) };
    case "discard_potion":
      return { action: "discard_potion", slot: action.slot };
    case "choose_map_node":
      return { action: "choose_map_node", index: action.index };
    case "choose_rest_option":
      return { action: "choose_rest_option", index: action.index };
    case "proceed":
      return { action: "proceed" };
    case "claim_reward":
      return { action: "claim_reward", reward_index: action.index, index: action.index };
    case "claim_treasure_relic":
      return { action: "claim_treasure_relic", index: action.index };
    case "select_card_reward":
      return { action: "select_card_reward", card_index: action.index };
    case "skip_card_reward":
      return { action: "skip_card_reward" };
    case "choose_event_option":
      return { action: "choose_event_option", index: action.index };
    case "shop_purchase":
      return { action: "shop_purchase", index: action.index };
    case "crystal_sphere_set_tool":
      return { action: "crystal_sphere_set_tool", tool: action.tool };
    case "crystal_sphere_click_cell":
      return { action: "crystal_sphere_click_cell", x: action.x, y: action.y };
    case "crystal_sphere_proceed":
      return { action: "crystal_sphere_proceed" };
    case "select_card":
      return { action: "select_card", index: action.index };
    case "combat_select_card":
      return { action: "combat_select_card", card_index: action.index };
    case "confirm_selection":
      return { action: "confirm_selection" };
    case "combat_confirm_selection":
      return { action: "combat_confirm_selection" };
    case "cancel_selection":
      return { action: "cancel_selection" };
    case "menu_select":
      return { action: "menu_select", option: action.option, ...(action.seed ? { seed: action.seed } : {}) };
  }
}
