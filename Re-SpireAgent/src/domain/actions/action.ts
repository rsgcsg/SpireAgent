export type ExecutableGameAction =
  | { kind: "play_card"; cardIndex: number; targetId?: string }
  | { kind: "end_turn" }
  | { kind: "use_potion"; slot: number; targetId?: string }
  | { kind: "discard_potion"; slot: number }
  | { kind: "choose_map_node"; index: number }
  | { kind: "choose_rest_option"; index: number }
  | { kind: "proceed" }
  | { kind: "claim_reward"; index: number }
  | { kind: "claim_treasure_relic"; index: number }
  | { kind: "select_card_reward"; index: number }
  | { kind: "skip_card_reward" }
  | { kind: "choose_event_option"; index: number }
  | { kind: "shop_purchase"; index: number }
  | { kind: "crystal_sphere_set_tool"; tool: "big" | "small" }
  | { kind: "crystal_sphere_click_cell"; x: number; y: number }
  | { kind: "crystal_sphere_proceed" }
  | { kind: "select_card"; index: number }
  | { kind: "combat_select_card"; index: number }
  | { kind: "confirm_selection" }
  | { kind: "combat_confirm_selection" }
  | { kind: "cancel_selection" }
  | { kind: "menu_select"; option: string | number; seed?: string };
