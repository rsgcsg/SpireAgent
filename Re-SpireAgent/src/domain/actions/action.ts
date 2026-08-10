export type ExecutableGameAction =
  | {
      kind: "human_ui_action";
      choiceId: string;
      expectedSnapshotId: string;
      boundActionId: string;
    }
  | {
      kind: "connector_v3_command";
      choiceId: string;
      expectedStateToken: string;
      operation: string;
    }
  | {
      kind: "bridge_v2_action";
      actionId: string;
      expectedStateId: string;
      bridgeActionKind: string;
    }
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
