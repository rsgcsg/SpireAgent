import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import type { AdapterDescriptor } from "../src/game-io/adapter.js";
import { Sts2McpHybridAdapter } from "../src/integrations/sts2mcp/hybridAdapter.js";
import { TransientObservationError } from "../src/game-io/observationError.js";
import { decodeBridgeV2Capabilities, decodeBridgeV2Inspection, decodeBridgeV2ObservationBundle, decodeBridgeV2State } from "../src/integrations/sts2mcp/bridgeV2Protocol.js";
import { isBridgeV2WrappedState, wrapBridgeV2State } from "../src/integrations/sts2mcp/rawState.js";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";
import type { JsonObject } from "../src/shared/json.js";
import { fixture } from "./helpers.js";

const CAPABILITIES = {
  protocol_version: "2.0-preview.55",
  bridge: {
    id: "sts2_mcp_bridge_v2",
    name: "STS2 Agent Bridge",
    version: "0.5.0-dev",
    upstream_commit: "upstream",
    module_version_id: "fixture-module-v1",
    assembly_file_sha256: "A".repeat(64),
    runtime_instance_id: "fixture-runtime-1"
  },
  game: {
    version: "v0.108.0",
    commit: "58694f64",
    branch: "v0.108.0",
    main_assembly_hash: -2044609792,
    compatibility: {
      status: "supported_exact",
      tested_game_versions: ["0.108.0"],
      tested_build_fingerprints: ["v0.108.0|58694f64|-2044609792"],
      action_execution_allowed: true,
      state_observation_allowed: true,
      inspection_allowed: true,
      action_execution_surface_kinds: [] as string[],
      action_canary_surface_kinds: [] as string[],
      inspection_allowed_kinds: ["run_deck"],
      inspection_canary_kinds: ["combat_piles", "shop_catalog"],
      observation_only_surface_kinds: [] as string[],
      observation_candidate_build_fingerprints: [] as string[],
      detail: "exact",
      action_permission_scopes: [] as Array<{
        surface_kind: string;
        operation: string;
        tier: "qualified" | "canary";
      }>
    },
    modset: {
      status: "exact_bridge_only",
      fingerprint: "fixture-modset-1",
      fingerprint_scope: "manager_state+ordered_manifest_identity+load_state+source+workshop_id+loaded_assembly_name_version_mvid",
      exact_permission_eligible: true,
      mods: [{
        id: "STS2_MCP",
        version: "0.5.0-dev",
        source: "ModsDirectory",
        load_state: "Loaded",
        affects_gameplay: false,
        workshop_id: null as string | null,
        assemblies: [{
          name: "STS2_MCP",
          version: "0.5.0.0",
          module_version_id: "fixture-module-v1"
        }]
      }],
      detail: "exact bridge only"
    }
  },
  observation_policy: { id: "player_visible_ui_v1", scope: "visible", includes_hidden_information: false, unknown_field_behavior: "omit" },
  shared_state: {
    status: "implemented_read_only_current_build",
    scope: "active_single_player_run_hud",
    creates_action_authority: false,
    included_in_state_identity: true,
    included_facts: ["act_floor_ascension", "local_player_identity_hp_gold", "relics", "potions_and_capacity"],
    excluded_facts: ["deck_contents_use_inspection", "hidden_rng", "draw_order", "future_events", "future_rewards"]
  },
  surfaces: [
    { kind: "deck_enchant_selection", support: "implemented_exact_game_version", operations: ["toggle_card"], evidence: "test-contract" },
    { kind: "deck_removal_selection", support: "implemented_exact_game_version", operations: ["toggle_deck_removal_card", "preview_deck_removal", "confirm_deck_removal", "cancel_deck_removal_preview", "cancel_deck_removal_selection"], evidence: "test-contract" },
    { kind: "deck_upgrade_selection", support: "implemented_exact_game_version", operations: ["toggle_deck_upgrade_card", "confirm_deck_upgrade", "cancel_deck_upgrade_preview", "cancel_deck_upgrade_selection"], evidence: "test-contract" },
    { kind: "deck_transform_selection", support: "implemented_exact_game_version", operations: ["toggle_deck_transform_card", "preview_deck_transform", "confirm_deck_transform", "cancel_deck_transform_preview", "cancel_deck_transform_selection", "toggle_deck_transform_upgrade_view"], evidence: "test-contract" },
    { kind: "event_dialogue", support: "implemented_exact_game_version", operations: ["advance_event_dialogue"], evidence: "test-contract" },
    { kind: "event_option", support: "implemented_exact_game_version", operations: ["choose_event_option", "proceed_event"], evidence: "test-contract" },
    { kind: "rest_site", support: "implemented_exact_game_version", operations: ["choose_rest_option", "proceed_rest_site"], evidence: "test-contract" },
    { kind: "combat_turn", support: "implemented_exact_game_version", operations: ["play_card", "use_potion", "end_turn"], evidence: "test-contract" },
    { kind: "combat_pile_card_selection", support: "implemented_exact_game_version", operations: ["select_discard_card_for_draw_top", "select_discard_card_for_hand"], evidence: "test-contract" },
    { kind: "combat_hand_card_selection", support: "implemented_exact_game_version", operations: ["select_combat_hand_card", "deselect_combat_hand_card", "confirm_combat_hand_selection", "close_combat_hand_peek"], evidence: "test-contract" },
    { kind: "event_card_acquisition", support: "implemented_exact_game_version", operations: ["select_event_card_acquisition", "deselect_event_card_acquisition"], evidence: "test-contract" },
    { kind: "generated_card_choice", support: "implemented_exact_game_version", operations: ["select_generated_run_card", "skip_generated_run_card_choice", "select_generated_combat_card", "skip_generated_combat_card_choice"], evidence: "test-contract" },
    { kind: "card_bundle_selection", support: "implemented_exact_game_version", operations: ["preview_card_bundle", "confirm_card_bundle", "cancel_card_bundle_preview"], evidence: "test-contract" },
    { kind: "card_reward_selection", support: "implemented_exact_game_version", operations: ["select_card_reward", "choose_card_reward_alternative"], evidence: "test-contract" },
    { kind: "reward_claim", support: "implemented_exact_game_version", operations: ["claim_reward", "discard_potion_for_reward", "proceed_rewards"], evidence: "test-contract" },
    { kind: "map_navigation", support: "implemented_exact_game_version", operations: ["choose_map_node"], evidence: "test-contract" },
    { kind: "shop_inventory", support: "implemented_exact_game_version", operations: ["purchase_shop_card", "purchase_shop_relic", "purchase_shop_potion", "open_shop_card_removal", "close_shop_inventory"], evidence: "test-contract" },
    { kind: "shop_room", support: "implemented_exact_game_version", operations: ["open_shop_inventory", "proceed_shop"], evidence: "test-contract" },
    { kind: "treasure_room", support: "implemented_exact_game_version", operations: ["open_treasure_chest", "choose_treasure_relic", "skip_treasure_relic", "proceed_treasure_room"], evidence: "test-contract" },
    { kind: "game_over", support: "implemented_exact_game_version", operations: ["advance_game_over_summary", "return_game_over"], evidence: "test-contract" },
    { kind: "character_select", support: "implemented_exact_game_version", operations: ["select_character", "decrease_ascension", "increase_ascension", "embark_standard_run", "back_from_character_select"], evidence: "test-contract" },
    { kind: "main_menu", support: "implemented_exact_game_version", operations: ["continue_run", "open_singleplayer"], evidence: "test-contract" },
    { kind: "singleplayer_menu", support: "implemented_exact_game_version", operations: ["open_standard_run_setup", "back_from_singleplayer_menu"], evidence: "test-contract" }
  ],
  commands: { opaque_actions_only: true, state_bound: true, idempotent_request_ids: true, lifecycle_states: ["started", "completed"], outcome_timeout_ms: 10000 },
  inspections: {
    status: "implemented_read_only",
    state_bound: true,
    arbitrary_queries_allowed: false,
    enters_command_ledger: false,
    visibility_classes: ["on_screen", "normal_inspection", "count_only"],
    ordering_semantics: ["unordered_multiset", "player_sorted", "fixed_ui_slots"],
    implemented_kinds: ["run_deck", "combat_piles", "shop_catalog"]
  },
  diagnostics: [{
    code: "bridge.inspection.read_only_enabled",
    severity: "info",
    category: "visibility",
    effect: "none",
    recoverability: "unknown",
    safe_detail: "Run-deck and combat-pile inspection are read-only."
  }],
  warnings: []
};

const SHARED_STATE = {
  scope: "active_single_player_run",
  run: {
    act: 1,
    act_definition_id: "OVERGROWTH",
    act_name: "The Overgrowth",
    floor: 6,
    ascension: 0,
    bosses: [{ definition_id: "TEST_SUBJECTS", name: "Test Subjects", order: 0 }],
    modifiers: []
  },
  player: {
    entity_id: "player-1",
    character_definition_id: "IRONCLAD",
    character_name: "Ironclad",
    hp: 61,
    max_hp: 80,
    gold: 112,
    relics: [],
    potions: [],
    max_potion_slots: 3
  },
  completeness: {
    player_visible_semantics: "complete_for_strategy_relevant_persistent_single_player_hud",
    sources: ["NTopBar"],
    missing: []
  }
} satisfies JsonObject;

const RUN_DECK_CATALOG_ENTRY = {
  kind: "run_deck",
  scope: "active_run",
  availability: "qualified",
  visibility_basis: "player_can_open_deck_view",
  state_bound: true,
  creates_action_authority: false,
  ordering_semantics: "unordered_multiset",
  estimated_cost: "medium",
  recommended_for: ["deck_strategy", "card_choice"],
  hidden_by_policy: ["draw_order"]
};

const RUN_VISIBILITY = {
  profile_id: "event.deck_enchant_selection.v1",
  core_status: "complete",
  player_visible_closure_status: "partial_catalog",
  available_inspections: ["run_deck"],
  linked_detail_kinds: [],
  hidden_by_policy: ["rng_state", "draw_order", "future_outcomes"],
  missing: ["tooltip_keyword_details_are_incremental"],
  unknown_critical_field_behavior: "fail_closed"
};

const DECK_ENCHANT_STATE = {
  protocol_version: "2.0-preview.55",
  state_id: "state-test-1",
  state_sequence: 1,
  observed_at: "2026-07-16T00:00:00Z",
  readiness: "ready",
  shared_state: SHARED_STATE,
  context: {
    kind: "event",
    event_id: "SPIRALING_WHIRLPOOL",
    name: "Spiraling Whirlpool",
    ancient: false,
    in_dialogue: false,
    body: "Choose a card to enchant."
  },
  surface_kind: "deck_enchant_selection",
  surface: {
    kind: "deck_enchant_selection",
    stage: "selecting",
    screen_entity_id: "screen-1",
    prompt: "Choose a card to enchant",
    min_select: 1,
    max_select: 1,
    selected_count: 0,
    selected_card_entity_ids: [] as string[],
    cancelable: false,
    enchantment: {
      definition_id: "SLITHER",
      name: "Slither",
      description: "When drawn, randomize this card's cost.",
      amount: 1,
      observation_source: "visible_ui"
    },
    cards: [{
      entity_id: "card-1",
      definition_id: "STRIKE",
      name: "Strike",
      type: "Attack",
      cost: "1",
      star_cost: null,
      description: "Deal damage.",
      rarity: "Basic",
      is_upgraded: false,
      is_selected: false,
      existing_enchantment: null
    }]
  },
  authority_handoff: {
    status: "bridge_owned",
    surface_kind: "deck_enchant_selection",
    reason: "fixture exact surface ownership"
  },
  legal_actions: [{
    action_id: "action-test-1",
    state_id: "state-test-1",
    kind: "toggle_card",
    category: "selection",
    label: "Select Strike",
    authority: "game_ui",
    evidence_code: "NCardGrid.HolderPressed",
    entity_bindings: [{ role: "card", entity_id: "card-1" }]
  }],
  completeness: {
    player_visible_semantics: "contract_complete_for_supported_surface",
    legal_actions: "derived_from_same_validator_as_execution",
    sources: ["visible_ui"],
    missing: []
  },
  bridge: CAPABILITIES.bridge,
  game: CAPABILITIES.game,
  observation_policy: CAPABILITIES.observation_policy,
  visibility: RUN_VISIBILITY,
  inspection_catalog: [RUN_DECK_CATALOG_ENTRY],
  contract_instance_shadow: {
    status: "resolved_manifest_contract",
    instance_id: "contract-instance-deck-enchant-1",
    surface_kind: "deck_enchant_selection",
    semantic_contract_id: "bridge.surface.deck_enchant_selection.2.0-preview.55",
    declared_binding: "fixture-declared-binding",
    operations: [{ operation: "toggle_card", evidence_status: "surface_level_only", published: true }],
    current_authority_tier: "canary",
    current_authority_basis: "exact_environment_surface_operation_gate",
    authorizing: false,
    limitations: ["shadow_inventory_only", "authority_remains_surface_kind_scoped"]
  },
  diagnostics: [],
  warnings: []
};

const COMBAT_RESOLUTION_NO_ACTION_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-post-combat-1",
  state_sequence: 2,
  readiness: "settling",
  context: {
    kind: "combat_transition",
    phase: "resolution",
    transition: "awaiting_room_resolution"
  },
  surface_kind: "no_action",
  surface: {
    kind: "no_action",
    reason: "settling",
    message: "Combat has ended; the game is resolving room rewards or the next player-visible surface."
  },
  contract_instance_shadow: {
    status: "unresolved",
    instance_id: "contract-instance-transition-1",
    surface_kind: "no_action",
    operations: [],
    current_authority_tier: "disabled",
    current_authority_basis: "exact_environment_surface_operation_gate",
    authorizing: false,
    limitations: ["shadow_inventory_only", "authority_remains_surface_kind_scoped"]
  },
  authority_handoff: {
    status: "none_fail_closed",
    surface_kind: null,
    reason: "The exact combat transition has no player input owner."
  },
  legal_actions: [],
  completeness: {
    player_visible_semantics: "complete_for_bounded_no_input_transition",
    legal_actions: "none_no_input_owner",
    sources: ["RunState.CurrentRoom", "CombatManager.IsInProgress", "NCombatRoom", "ActiveSurfaceResolver"],
    missing: []
  },
  diagnostics: [{
    code: "bridge.lifecycle.no_input_transition",
    severity: "info",
    category: "runtime",
    effect: "none",
    recoverability: "settle",
    safe_detail: "CombatRoom:combat_ended_before_reward_surface"
  }]
};

const DECK_REMOVAL_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-shop-removal-1",
  state_sequence: 15,
  context: {
    kind: "shop"
  },
  surface_kind: "deck_removal_selection",
  authority_handoff: { status: "bridge_owned", surface_kind: "deck_removal_selection", reason: "fixture ownership" },
  surface: {
    kind: "deck_removal_selection",
    stage: "selecting",
    screen_entity_id: "deck-removal-screen-1",
    prompt: "Choose a card to Remove.",
    min_select: 1,
    max_select: 1,
    selected_count: 0,
    selected_card_entity_ids: [],
    cancelable: true,
    cards: [{
      entity_id: "deck-card-strike-1",
      definition_id: "STRIKE_IRONCLAD",
      name: "Strike",
      type: "Attack",
      cost: "1",
      star_cost: null,
      description: "Deal 6 damage.",
      rarity: "Basic",
      is_upgraded: false,
      is_selected: false,
      existing_enchantment: null
    }]
  },
  legal_actions: [{
    action_id: "action-deck-removal-select-1",
    state_id: "state-shop-removal-1",
    kind: "toggle_deck_removal_card",
    category: "selection",
    label: "Select Strike to remove",
    authority: "game_ui",
    evidence_code: "NCardGrid.HolderPressed+NDeckCardSelectScreen selection",
    entity_bindings: [{ role: "card", entity_id: "deck-card-strike-1" }]
  }],
  completeness: {
    player_visible_semantics: "contract_complete_for_merchant_deck_removal_selection",
    legal_actions: "derived_from_exact_visible_grid_and_current_controls",
    sources: ["visible_ui"],
    missing: []
  }
};

const DECK_UPGRADE_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-rest-upgrade-1",
  state_sequence: 16,
  context: { kind: "rest" },
  surface_kind: "deck_upgrade_selection",
  authority_handoff: { status: "bridge_owned", surface_kind: "deck_upgrade_selection", reason: "fixture ownership" },
  surface: {
    kind: "deck_upgrade_selection",
    stage: "selecting",
    screen_entity_id: "deck-upgrade-screen-1",
    prompt: "Choose a card to Upgrade.",
    min_select: 1,
    max_select: 1,
    selected_count: 0,
    selected_card_entity_ids: [],
    cancelable: true,
    cards: [{
      entity_id: "deck-card-strike-upgrade-1",
      definition_id: "STRIKE_IRONCLAD",
      name: "Strike",
      type: "Attack",
      cost: "1",
      star_cost: null,
      description: "Deal 6 damage.",
      rarity: "Basic",
      is_upgraded: false,
      is_selected: false,
      existing_enchantment: null
    }],
    preview_cards: []
  },
  legal_actions: [{
    action_id: "action-deck-upgrade-select-1",
    state_id: "state-rest-upgrade-1",
    kind: "toggle_deck_upgrade_card",
    category: "selection",
    label: "Select Strike for upgrade",
    authority: "game_ui",
    evidence_code: "NDeckUpgradeSelectScreen.OnCardClicked via NCardHolder.Pressed",
    entity_bindings: [{ role: "card", entity_id: "deck-card-strike-upgrade-1" }]
  }],
  completeness: {
    player_visible_semantics: "contract_complete_for_visible_deck_upgrade_selection",
    legal_actions: "derived_from_same_current_upgrade_controls_as_execution",
    sources: ["visible_ui"],
    missing: []
  }
};

const DECK_TRANSFORM_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-event-transform-1",
  state_sequence: 17,
  context: {
    kind: "event",
    event_id: "WHISPERING_HOLLOW",
    name: "Whispering Hollow",
    ancient: false,
    in_dialogue: false,
    body: "Choose a card to transform."
  },
  surface_kind: "deck_transform_selection",
  authority_handoff: { status: "bridge_owned", surface_kind: "deck_transform_selection", reason: "fixture ownership" },
  surface: {
    kind: "deck_transform_selection",
    stage: "selecting",
    screen_entity_id: "deck-transform-screen-1",
    prompt: "Choose a card to Transform.",
    min_select: 1,
    max_select: 1,
    selected_count: 0,
    selected_card_entity_ids: [],
    cancelable: false,
    upgrade_toggle_visible: true,
    showing_upgrade_previews: false,
    preview_kind: "none",
    replacement_known: false,
    cards: [{
      entity_id: "deck-card-strike-transform-1",
      definition_id: "STRIKE_IRONCLAD",
      name: "Strike",
      type: "Attack",
      cost: "1",
      star_cost: null,
      description: "Deal 6 damage.",
      rarity: "Basic",
      is_upgraded: false,
      is_selected: false,
      existing_enchantment: null
    }]
  },
  legal_actions: [{
    action_id: "action-deck-transform-select-1",
    state_id: "state-event-transform-1",
    kind: "toggle_deck_transform_card",
    category: "selection",
    label: "Select Strike for random transformation",
    authority: "game_ui",
    evidence_code: "NCardGrid.HolderPressed+NDeckTransformSelectScreen.OnCardClicked",
    entity_bindings: [{ role: "card", entity_id: "deck-card-strike-transform-1" }]
  }],
  completeness: {
    player_visible_semantics: "contract_complete_for_whispering_hollow_random_transform_selection",
    legal_actions: "derived_from_same_current_transform_controls_as_execution",
    sources: ["visible_ui"],
    missing: []
  }
};

const TREASURE_ROOM_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-treasure-choice-1",
  state_sequence: 17,
  context: { kind: "treasure" },
  surface_kind: "treasure_room",
  authority_handoff: { status: "bridge_owned", surface_kind: "treasure_room", reason: "fixture ownership" },
  surface: {
    kind: "treasure_room",
    stage: "relic_choice",
    room_entity_id: "treasure-room-1",
    chest_opened: true,
    relics: [{
      entity_id: "treasure-relic-1",
      definition_id: "BAG_OF_MARBLES",
      name: "Bag of Marbles",
      description: "At the start of each combat, apply 1 Vulnerable to ALL enemies.",
      rarity: "Common",
      keywords: [{ name: "Vulnerable", description: "Receives 50% more attack damage." }],
      card_previews: []
    }],
    can_skip: true,
    can_proceed: false
  },
  legal_actions: [{
    action_id: "action-treasure-choose-1",
    state_id: "state-treasure-choice-1",
    kind: "choose_treasure_relic",
    category: "claim",
    label: "Take Bag of Marbles",
    authority: "game_ui",
    evidence_code: "NTreasureRoomRelicCollection.PickRelic+RelicCmd.Obtain+player-relic-post-state",
    entity_bindings: [{ role: "relic", entity_id: "treasure-relic-1" }]
  }, {
    action_id: "action-treasure-skip-1",
    state_id: "state-treasure-choice-1",
    kind: "skip_treasure_relic",
    category: "skip",
    label: "Skip the visible treasure relic",
    authority: "game_ui",
    evidence_code: "NTreasureRoom.ProceedButton.IsSkip+SkipRelicLocally+room-exit-post-state",
    entity_bindings: [{ role: "treasure_room", entity_id: "treasure-room-1" }]
  }],
  completeness: {
    player_visible_semantics: "contract_complete_for_single_player_treasure_room_lifecycle",
    legal_actions: "derived_from_same_exact_current_controls_as_execution",
    sources: ["visible_ui"],
    missing: []
  }
};

const GAME_OVER_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-game-over-summary-1",
  state_sequence: 18,
  shared_state: SHARED_STATE,
  context: {
    kind: "game_over",
    result: "loss",
    game_mode: "standard",
    score: 321,
    floor_reached: 12,
    ascension: 0
  },
  surface_kind: "game_over",
  authority_handoff: { status: "bridge_owned", surface_kind: "game_over", reason: "fixture exact stage ownership" },
  surface: {
    kind: "game_over",
    stage: "summary",
    screen_entity_id: "game-over-screen-1",
    return_destination: "main_menu",
    can_advance_summary: false,
    can_return: true
  },
  legal_actions: [{
    action_id: "action-game-over-return-1",
    state_id: "state-game-over-summary-1",
    kind: "return_game_over",
    category: "navigation",
    label: "Return to the main menu",
    authority: "game_ui",
    evidence_code: "NGameOverScreen.%MainMenuButton+NGame.MainMenu-loaded",
    entity_bindings: [{ role: "game_over_screen", entity_id: "game-over-screen-1" }]
  }],
  completeness: {
    player_visible_semantics: "contract_complete_for_ordinary_single_player_game_over_navigation_and_summary",
    legal_actions: "derived_from_exact_current_enabled_game_over_controls",
    sources: ["NGameOverScreen exact controls"],
    missing: []
  }
};

const CHARACTER_SELECT_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-character-select-1",
  state_sequence: 19,
  shared_state: null,
  visibility: {
    ...RUN_VISIBILITY,
    profile_id: "menu.character_select.v1",
    available_inspections: [],
    linked_detail_kinds: []
  },
  inspection_catalog: [],
  context: {
    kind: "menu",
    flow: "standard_run_setup"
  },
  surface_kind: "character_select",
  authority_handoff: { status: "bridge_owned", surface_kind: "character_select", reason: "fixture exact menu ownership" },
  surface: {
    kind: "character_select",
    stage: "choosing",
    screen_entity_id: "character-screen-1",
    characters: [{
      entity_id: "character-ironclad",
      index: 0,
      character_id: "IRONCLAD",
      name: "The Ironclad",
      is_locked: false,
      is_selected: true,
      is_random: false
    }, {
      entity_id: "character-silent",
      index: 1,
      character_id: "SILENT",
      name: "The Silent",
      is_locked: false,
      is_selected: false,
      is_random: false
    }],
    selected_details: {
      character_id: "IRONCLAD",
      title: "The Ironclad",
      description: "A survivor with reliable strength.",
      starting_hp: 80,
      starting_gold: 99,
      starting_relic: {
        definition_id: "BURNING_BLOOD",
        name: "Burning Blood",
        description: "Heal after combat."
      }
    },
    ascension: null,
    ascension_title: null,
    ascension_description: null,
    can_decrease_ascension: false,
    can_increase_ascension: false,
    can_embark: true,
    can_go_back: true
  },
  legal_actions: [{
    action_id: "action-character-silent",
    state_id: "state-character-select-1",
    kind: "select_character",
    category: "selection",
    label: "Select The Silent",
    authority: "game_ui",
    evidence_code: "NCharacterSelectButton.Select+exact-selected-button-witness",
    entity_bindings: [{ role: "character_choice", entity_id: "character-silent" }]
  }, {
    action_id: "action-character-embark",
    state_id: "state-character-select-1",
    kind: "embark_standard_run",
    category: "commit",
    label: "Embark",
    authority: "game_ui",
    evidence_code: "NCharacterSelectScreen.ConfirmButton+RunManager-active-run-witness",
    entity_bindings: [
      { role: "screen", entity_id: "character-screen-1" },
      { role: "character_choice", entity_id: "character-ironclad" }
    ]
  }, {
    action_id: "action-character-back",
    state_id: "state-character-select-1",
    kind: "back_from_character_select",
    category: "navigation",
    label: "Back",
    authority: "game_ui",
    evidence_code: "NCharacterSelectScreen.BackButton+submenu-owner-change-witness",
    entity_bindings: [{ role: "screen", entity_id: "character-screen-1" }]
  }],
  completeness: {
    player_visible_semantics: "contract_complete_for_singleplayer_character_select",
    legal_actions: "derived_from_exact_visible_character_and_menu_controls",
    sources: ["NCharacterSelectScreen exact visible controls"],
    missing: []
  }
};

const MAIN_MENU_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-main-menu-1",
  state_sequence: 20,
  shared_state: null,
  visibility: {
    ...RUN_VISIBILITY,
    profile_id: "menu.main_menu.v1",
    available_inspections: [],
    linked_detail_kinds: []
  },
  inspection_catalog: [],
  context: { kind: "menu", flow: "root_navigation" },
  surface_kind: "main_menu",
  authority_handoff: { status: "bridge_owned", surface_kind: "main_menu", reason: "fixture exact root-menu ownership" },
  surface: {
    kind: "main_menu",
    stage: "choosing",
    screen_entity_id: "main-menu-screen-1",
    options: [{
      entity_id: "menu-singleplayer",
      semantic_id: "singleplayer",
      label: "Single Player",
      description: null,
      enabled: true,
      bridge_support: "actionable",
      blocked_reason: null
    }, {
      entity_id: "menu-settings",
      semantic_id: "settings",
      label: "Settings",
      description: null,
      enabled: true,
      bridge_support: "visible_unsupported",
      blocked_reason: "Settings navigation is not implemented."
    }, {
      entity_id: "menu-quit",
      semantic_id: "quit",
      label: "Quit",
      description: null,
      enabled: true,
      bridge_support: "visible_unsupported",
      blocked_reason: "Process termination is not an Agent action."
    }],
    continue_run: null
  },
  legal_actions: [{
    action_id: "action-open-singleplayer",
    state_id: "state-main-menu-1",
    kind: "open_singleplayer",
    category: "navigation",
    label: "Open Single Player",
    authority: "game_ui",
    evidence_code: "NMainMenu.SingleplayerButton+submenu-owner-witness",
    entity_bindings: [{ role: "menu_screen", entity_id: "main-menu-screen-1" }]
  }],
  completeness: {
    player_visible_semantics: "contract_complete_for_visible_root_choices_and_standard_run_entry",
    legal_actions: "derived_from_exact_visible_root_controls_and_saved_run_binding",
    sources: ["NMainMenu exact current owner"],
    missing: []
  }
};

const SINGLEPLAYER_MENU_STATE = {
  ...MAIN_MENU_STATE,
  state_id: "state-singleplayer-menu-1",
  state_sequence: 21,
  context: { kind: "menu", flow: "standard_run_setup" },
  surface_kind: "singleplayer_menu",
  authority_handoff: { status: "bridge_owned", surface_kind: "singleplayer_menu", reason: "fixture exact submenu ownership" },
  surface: {
    kind: "singleplayer_menu",
    stage: "choosing",
    screen_entity_id: "singleplayer-menu-screen-1",
    options: [{
      entity_id: "menu-standard",
      semantic_id: "standard",
      label: "Standard",
      description: "Play a standard run.",
      enabled: true,
      bridge_support: "actionable",
      blocked_reason: null
    }, {
      entity_id: "menu-daily",
      semantic_id: "daily",
      label: "Daily",
      description: "Play today's Daily Climb.",
      enabled: true,
      bridge_support: "visible_unsupported",
      blocked_reason: "Daily runs are outside this bounded standard-run contract."
    }, {
      entity_id: "menu-back",
      semantic_id: "back",
      label: "Back",
      description: null,
      enabled: true,
      bridge_support: "actionable",
      blocked_reason: null
    }]
  },
  legal_actions: [{
    action_id: "action-open-standard",
    state_id: "state-singleplayer-menu-1",
    kind: "open_standard_run_setup",
    category: "navigation",
    label: "Open Standard run setup",
    authority: "game_ui",
    evidence_code: "NSingleplayerSubmenu.StandardButton+character-select-owner-witness",
    entity_bindings: [{ role: "menu_screen", entity_id: "singleplayer-menu-screen-1" }]
  }, {
    action_id: "action-singleplayer-back",
    state_id: "state-singleplayer-menu-1",
    kind: "back_from_singleplayer_menu",
    category: "navigation",
    label: "Back to main menu",
    authority: "game_ui",
    evidence_code: "NSingleplayerSubmenu.BackButton+root-owner-witness",
    entity_bindings: [{ role: "menu_screen", entity_id: "singleplayer-menu-screen-1" }]
  }],
  completeness: {
    player_visible_semantics: "contract_complete_for_visible_singleplayer_run_modes",
    legal_actions: "derived_from_exact_visible_submenu_controls",
    sources: ["NSingleplayerSubmenu exact current owner"],
    missing: []
  }
};

const EVENT_OPTION_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-event-1",
  state_sequence: 2,
  context: {
    kind: "event",
    event_id: "SPIRALING_WHIRLPOOL",
    name: "Spiraling Whirlpool",
    ancient: false,
    in_dialogue: false,
    body: "The whirlpool settles."
  },
  surface_kind: "event_option",
  authority_handoff: { status: "bridge_owned", surface_kind: "event_option", reason: "fixture ownership" },
  surface: {
    kind: "event_option",
    screen_entity_id: "event-screen-1",
    options: [{
      entity_id: "event-option-1",
      index: 0,
      title: "Proceed",
      description: "Return to the map.",
      is_locked: false,
      is_proceed: true,
      was_chosen: false,
      will_kill_player: false,
      relic_name: null,
      relic_description: null,
      tooltips: [{ kind: "text", name: "Return", description: "Leave this event." }]
    }]
  },
  legal_actions: [{
    action_id: "action-event-1",
    state_id: "state-event-1",
    kind: "proceed_event",
    category: "navigation",
    label: "Proceed",
    authority: "game_ui",
    evidence_code: "NEventRoom.OptionButtonClicked+NEventOptionButton",
    entity_bindings: [{ role: "option", entity_id: "event-option-1" }]
  }]
};

const EVENT_DIALOGUE_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-dialogue-1",
  state_sequence: 2,
  context: {
    kind: "event",
    event_id: "NEOW",
    name: "Neow",
    ancient: true,
    in_dialogue: true,
    body: null
  },
  surface_kind: "event_dialogue",
  authority_handoff: { status: "bridge_owned", surface_kind: "event_dialogue", reason: "fixture ownership" },
  surface: {
    kind: "event_dialogue",
    screen_entity_id: "dialogue-screen-1",
    current_line_index: 1,
    revealed_lines: [
      {
        entity_id: "dialogue-line-0",
        index: 0,
        text: "Welcome back.",
        speaker: "ancient",
        is_current: false
      },
      {
        entity_id: "dialogue-line-1",
        index: 1,
        text: "Choose your beginning.",
        speaker: "ancient",
        is_current: true
      }
    ],
    advance_label: "Continue"
  },
  legal_actions: [{
    action_id: "action-dialogue-1",
    state_id: "state-dialogue-1",
    kind: "advance_event_dialogue",
    category: "navigation",
    label: "Continue",
    authority: "game_ui",
    evidence_code: "NAncientEventLayout.%DialogueHitbox+_currentDialogueLine",
    entity_bindings: [{ role: "dialogue_line", entity_id: "dialogue-line-1" }]
  }]
};

const REST_SITE_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-rest-1",
  state_sequence: 3,
  context: { kind: "rest" },
  surface_kind: "rest_site",
  authority_handoff: { status: "bridge_owned", surface_kind: "rest_site", reason: "fixture ownership" },
  surface: {
    kind: "rest_site",
    screen_entity_id: "rest-screen-1",
    options: [
      {
        entity_id: "rest-option-heal",
        index: 0,
        option_id: "HEAL",
        name: "Rest",
        description: "Heal for 30% of Max HP.",
        enabled: true
      },
      {
        entity_id: "rest-option-smith",
        index: 1,
        option_id: "SMITH",
        name: "Smith",
        description: "Upgrade a card.",
        enabled: true
      }
    ],
    can_proceed: false
  },
  legal_actions: [
    {
      action_id: "action-rest-heal",
      state_id: "state-rest-1",
      kind: "choose_rest_option",
      category: "selection",
      label: "Rest",
      authority: "game_ui",
      evidence_code: "RestSiteRoom.Options+NRestSiteButton.ForceClick",
      entity_bindings: [{ role: "rest_option", entity_id: "rest-option-heal" }]
    },
    {
      action_id: "action-rest-smith",
      state_id: "state-rest-1",
      kind: "choose_rest_option",
      category: "selection",
      label: "Smith",
      authority: "game_ui",
      evidence_code: "RestSiteRoom.Options+NRestSiteButton.ForceClick",
      entity_bindings: [{ role: "rest_option", entity_id: "rest-option-smith" }]
    }
  ]
};

const SHOP_INVENTORY_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-shop-inventory-1",
  state_sequence: 4,
  shared_state: {
    ...SHARED_STATE,
    player: {
      ...SHARED_STATE.player,
      gold: 26,
      max_potion_slots: 2,
      relics: [{
        entity_id: "owned-relic-cursed-pearl",
        definition_id: "CURSED_PEARL",
        name: "Cursed Pearl",
        description: "Upon pickup, receive Greed. Gain 333 Gold.",
        counter: null,
        keywords: [],
        card_previews: [{
          entity_id: "tooltip-card-greed",
          definition_id: "GREED",
          name: "Greed",
          type: "Curse",
          cost: "Unplayable",
          star_cost: null,
          description: "Eternal. Unplayable.",
          rarity: "Curse",
          is_upgraded: false,
          is_selected: false,
          existing_enchantment: null
        }]
      }],
      potions: [
      {
        entity_id: "owned-potion-power",
        definition_id: "POWER_POTION",
        name: "Power Potion",
        description: "Choose 1 of 3 random Powers to add to your hand. It costs 0 this turn.",
        slot: 0,
        keywords: [],
        card_previews: []
      },
      {
        entity_id: "owned-potion-ashwater",
        definition_id: "ASHWATER",
        name: "Ashwater",
        description: "Gain a temporary combat benefit.",
        slot: 1,
        keywords: [],
        card_previews: []
      }
      ]
    }
  },
  context: { kind: "shop" },
  surface_kind: "shop_inventory",
  authority_handoff: { status: "bridge_owned", surface_kind: "shop_inventory", reason: "fixture ownership" },
  surface: {
    kind: "shop_inventory",
    screen_entity_id: "shop-inventory-screen-1",
    cards: [
      {
        entity_id: "shop-offer-card-armaments",
        slot_entity_id: "shop-slot-card-2",
        inventory_index: 2,
        price: 26,
        stocked: true,
        visible: true,
        affordable: true,
        can_purchase: true,
        blocked_reason: null,
        on_sale: true,
        card: {
          entity_id: "shop-card-armaments",
          definition_id: "ARMAMENTS",
          name: "Armaments",
          type: "Skill",
          cost: "1",
          star_cost: null,
          description: "Gain Block. Upgrade a card in your hand for the rest of combat.",
          rarity: "Common",
          is_upgraded: false,
          is_selected: false,
          existing_enchantment: null
        }
      },
      {
        entity_id: "shop-offer-card-sold",
        slot_entity_id: "shop-slot-card-0",
        inventory_index: 0,
        price: 50,
        stocked: false,
        visible: true,
        affordable: false,
        can_purchase: false,
        blocked_reason: "sold_out",
        on_sale: false,
        card: null
      }
    ],
    relics: [{
      entity_id: "shop-offer-relic-1",
      slot_entity_id: "shop-slot-relic-7",
      inventory_index: 7,
      price: 150,
      stocked: true,
      visible: true,
      affordable: false,
      can_purchase: false,
      blocked_reason: "insufficient_gold",
      relic: {
        entity_id: "shop-relic-anchor",
        definition_id: "ANCHOR",
        name: "Anchor",
        description: "Start each combat with Block.",
        counter: null,
        keywords: [],
        card_previews: []
      }
    }],
    potions: [{
      entity_id: "shop-offer-potion-1",
      slot_entity_id: "shop-slot-potion-10",
      inventory_index: 10,
      price: 20,
      stocked: true,
      visible: true,
      affordable: true,
      can_purchase: false,
      blocked_reason: "potion_slots_full" as string | null,
      definition_id: "BLOCK_POTION",
      name: "Block Potion",
      description: "Gain Block.",
      rarity: "Common"
    }],
    card_removal: {
      entity_id: "shop-card-removal-1",
      slot_entity_id: "shop-slot-removal-13",
      inventory_index: 13,
      price: 100,
      next_price_increase: 25,
      stocked: true,
      visible: true,
      affordable: false,
      can_purchase: false,
      blocked_reason: "insufficient_gold"
    },
    can_close: true
  },
  legal_actions: [
    {
      action_id: "action-shop-buy-armaments",
      state_id: "state-shop-inventory-1",
      kind: "purchase_shop_card",
      category: "purchase",
      label: "Buy Armaments for 26 gold",
      authority: "game_ui",
      evidence_code: "MerchantCardEntry.OnTryPurchaseWrapper",
      entity_bindings: [{ role: "shop_offer", entity_id: "shop-offer-card-armaments" }]
    },
    {
      action_id: "action-shop-close",
      state_id: "state-shop-inventory-1",
      kind: "close_shop_inventory",
      category: "navigation",
      label: "Close shop inventory",
      authority: "game_ui",
      evidence_code: "NMerchantInventory.BackButton",
      entity_bindings: [{ role: "screen", entity_id: "shop-inventory-screen-1" }]
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_visible_shop_inventory",
    legal_actions: "derived_from_same_validator_as_execution",
    sources: ["MerchantRoom.GetLocalInventory", "NMerchantInventory"],
    missing: []
  }
};

const SHOP_ROOM_STATE = {
  ...SHOP_INVENTORY_STATE,
  state_id: "state-shop-room-1",
  state_sequence: 5,
  surface_kind: "shop_room",
  authority_handoff: { status: "bridge_owned", surface_kind: "shop_room", reason: "fixture ownership" },
  surface: {
    kind: "shop_room",
    room_entity_id: "shop-room-1",
    can_open_inventory: true,
    can_proceed: true
  },
  legal_actions: [
    {
      action_id: "action-shop-open",
      state_id: "state-shop-room-1",
      kind: "open_shop_inventory",
      category: "navigation",
      label: "Open shop inventory",
      authority: "game_ui",
      evidence_code: "NMerchantRoom.MerchantButton",
      entity_bindings: [{ role: "room", entity_id: "shop-room-1" }]
    },
    {
      action_id: "action-shop-proceed",
      state_id: "state-shop-room-1",
      kind: "proceed_shop",
      category: "navigation",
      label: "Proceed to map",
      authority: "game_ui",
      evidence_code: "NMerchantRoom.ProceedButton+NMapScreen.Open",
      entity_bindings: [{ role: "room", entity_id: "shop-room-1" }]
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_visible_shop_room_controls",
    legal_actions: "derived_from_same_validator_as_execution",
    sources: ["NMerchantRoom"],
    missing: []
  }
};

const COMBAT_TURN_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-combat-1",
  state_sequence: 3,
  shared_state: {
    ...SHARED_STATE,
    player: {
      ...SHARED_STATE.player,
      hp: 61,
      max_hp: 80,
      gold: 112
    }
  },
  context: {
    kind: "combat",
    encounter_type: "elite",
    round: 2,
    turn_owner: "player",
    is_play_phase: true,
    player: {
      player_entity_id: "player-1",
      block: 3,
      energy: 3,
      max_energy: 3,
      stars: null,
      hand: [{
        entity_id: "combat-card-1",
        definition_id: "STRIKE",
        name: "Strike",
        type: "Attack",
        cost: "1",
        star_cost: null,
        description: "Deal 6 damage.",
        rarity: "Basic",
        is_upgraded: false,
        is_selected: false,
        existing_enchantment: null,
        target_type: "AnyEnemy",
        can_play: true,
        unplayable_reason: null
      }],
      draw_pile_count: 5,
      discard_pile_count: 2,
      exhaust_pile_count: 0,
      statuses: [],
      companions: [{
        entity_id: "companion-osty-1",
        definition_id: "OSTY",
        name: "Osty",
        is_alive: true,
        health_bar_visible: true,
        hp: 4 as number | null,
        max_hp: 6 as number | null,
        block: 0,
        statuses: []
      }],
      potion_states: [],
      orbs: [],
      orb_slots: null
    },
    enemies: [{
      entity_id: "enemy-1",
      combat_id: 1,
      definition_id: "CULTIST",
      name: "Cultist",
      hp: 42,
      max_hp: 50,
      block: 0,
      statuses: [],
      intents: [{ type: "Attack", label: "6", title: "Attack", description: "Intends to attack for 6." }]
    }]
  },
  visibility: {
    ...RUN_VISIBILITY,
    profile_id: "combat.combat_turn.v1",
    available_inspections: ["run_deck", "combat_piles"],
    linked_detail_kinds: []
  },
  inspection_catalog: [
    RUN_DECK_CATALOG_ENTRY,
    {
      kind: "combat_piles",
      scope: "current_combat",
      availability: "canary",
      visibility_basis: "player_can_open_combat_piles",
      state_bound: true,
      creates_action_authority: false,
      ordering_semantics: "unordered_multiset",
      estimated_cost: "medium",
      recommended_for: ["combat_planning"],
      hidden_by_policy: ["draw_pile_true_order"]
    }
  ],
  surface_kind: "combat_turn",
  authority_handoff: { status: "bridge_owned", surface_kind: "combat_turn", reason: "fixture ownership" },
  surface: { kind: "combat_turn", room_entity_id: "combat-room-1", can_end_turn: true },
  legal_actions: [
    {
      action_id: "action-combat-play-1",
      state_id: "state-combat-1",
      kind: "play_card",
      category: "combat",
      label: "Play Strike on Cultist",
      authority: "game_ui",
      evidence_code: "CardModel.CanPlay+CombatState.HittableEnemies+CardModel.TryManualPlay",
      entity_bindings: [
        { role: "card", entity_id: "combat-card-1" },
        { role: "target", entity_id: "enemy-1" }
      ]
    },
    {
      action_id: "action-combat-end-1",
      state_id: "state-combat-1",
      kind: "end_turn",
      category: "commit",
      label: "End turn",
      authority: "game_ui",
      evidence_code: "PlayerCmd.EndTurn+NEndTurnButton.CanTurnBeEnded guards",
      entity_bindings: []
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_immediate_combat_turn_including_visible_companions",
    legal_actions: "derived_from_same_validator_as_execution",
    sources: ["CombatManager.DebugOnlyGetState", "CardModel.CanPlay"],
    missing: []
  }
};

const COMBAT_PILE_CARD_SELECTION_STATE = {
  ...COMBAT_TURN_STATE,
  state_id: "state-combat-pile-select-1",
  state_sequence: 6,
  surface_kind: "combat_pile_card_selection",
  authority_handoff: { status: "bridge_owned", surface_kind: "combat_pile_card_selection", reason: "fixture ownership" },
  surface: {
    kind: "combat_pile_card_selection",
    screen_entity_id: "combat-pile-screen-1",
    prompt: "Choose a card to put on top of your Draw Pile.",
    purpose: "move_one_discard_card_to_draw_top",
    source_kind: "headbutt",
    source_card_entity_id: "combat-card-headbutt",
    source_card_definition_id: "HEADBUTT",
    pile_type: "discard",
    destination_pile: "draw",
    destination_position: "top",
    min_select: 1,
    max_select: 1,
    selected_count: 0,
    selected_card_entity_ids: [] as string[],
    require_manual_confirmation: false,
    cancelable: false,
    cards: [
      {
        entity_id: "discard-card-1",
        definition_id: "BALL_LIGHTNING",
        name: "Ball Lightning",
        type: "Attack",
        cost: "1",
        star_cost: null,
        description: "Deal 7 damage. Channel 1 Lightning.",
        rarity: "Common",
        is_upgraded: false,
        is_selected: false,
        existing_enchantment: null
      },
      {
        entity_id: "discard-card-2",
        definition_id: "BALL_LIGHTNING",
        name: "Ball Lightning",
        type: "Attack",
        cost: "1",
        star_cost: null,
        description: "Deal 7 damage. Channel 1 Lightning.",
        rarity: "Common",
        is_upgraded: false,
        is_selected: false,
        existing_enchantment: null
      }
    ]
  },
  legal_actions: [
    {
      action_id: "action-combat-pile-card-2",
      state_id: "state-combat-pile-select-1",
      kind: "select_discard_card_for_draw_top",
      category: "selection",
      label: "Put Ball Lightning on top of the Draw Pile",
      authority: "game_ui",
      evidence_code: "Headbutt.OnPlay+NCardGrid.HolderPressed+CardPileCmd.Add(Draw,Top)+exact-card-witness",
      entity_bindings: [{ role: "card", entity_id: "discard-card-2" }]
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_headbutt_discard_to_draw_top_selection",
    legal_actions: "derived_from_exact_visible_grid_and_current_controls",
    sources: ["NCombatPileCardSelectScreen", "NCardGrid"],
    missing: []
  }
};

const COMBAT_HAND_CARD_SELECTION_STATE = {
  ...COMBAT_TURN_STATE,
  state_id: "state-combat-hand-select-1",
  state_sequence: 7,
  surface_kind: "combat_hand_card_selection",
  authority_handoff: { status: "bridge_owned", surface_kind: "combat_hand_card_selection", reason: "fixture ownership" },
  surface: {
    kind: "combat_hand_card_selection",
    hand_entity_id: "combat-hand-1",
    prompt: "Confirm Card to Upgrade",
    selection_mode: "upgrade_select",
    min_select: 1,
    max_select: 1,
    selected_count: 1,
    selected_card_entity_ids: ["combat-card-1"],
    require_manual_confirmation: true,
    is_peeking: false,
    cards: [
      {
        entity_id: "combat-card-2",
        definition_id: "STRIKE",
        name: "Strike",
        type: "Attack",
        cost: "1",
        star_cost: null,
        description: "Deal 6 damage.",
        rarity: "Basic",
        is_upgraded: false,
        is_selected: false,
        existing_enchantment: null
      },
      {
        entity_id: "combat-card-1",
        definition_id: "STRIKE",
        name: "Strike",
        type: "Attack",
        cost: "1",
        star_cost: null,
        description: "Deal 6 damage.",
        rarity: "Basic",
        is_upgraded: false,
        is_selected: true,
        existing_enchantment: null
      }
    ]
  },
  legal_actions: [
    {
      action_id: "action-combat-hand-card-2",
      state_id: "state-combat-hand-select-1",
      kind: "select_combat_hand_card",
      category: "selection",
      label: "Replace current selection with Strike",
      authority: "game_ui",
      evidence_code: "NPlayerHand.OnHolderPressed+SelectCardInUpgradeMode",
      entity_bindings: [{ role: "card", entity_id: "combat-card-2" }]
    },
    {
      action_id: "action-combat-hand-confirm",
      state_id: "state-combat-hand-select-1",
      kind: "confirm_combat_hand_selection",
      category: "commit",
      label: "Confirm selected cards",
      authority: "game_ui",
      evidence_code: "NPlayerHand.%SelectModeConfirmButton",
      entity_bindings: []
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_combat_hand_card_selection",
    legal_actions: "derived_from_exact_visible_hand_selection_and_current_controls",
    sources: ["NPlayerHand", "CardSelectorPrefs", "NUpgradePreview"],
    missing: []
  }
};

const GENERATED_CARD_CHOICE_STATE = {
  ...COMBAT_TURN_STATE,
  state_id: "state-generated-card-choice-1",
  state_sequence: 8,
  context: {
    kind: "event",
    event_id: "NEOW",
    name: "Neow",
    ancient: true,
    in_dialogue: false
  },
  visibility: {
    ...RUN_VISIBILITY,
    profile_id: "event.generated_card_choice.v1"
  },
  inspection_catalog: [RUN_DECK_CATALOG_ENTRY],
  surface_kind: "generated_card_choice",
  authority_handoff: { status: "bridge_owned", surface_kind: "generated_card_choice", reason: "fixture ownership" },
  surface: {
    kind: "generated_card_choice",
    screen_entity_id: "generated-choice-screen-1",
    prompt: "Choose a Card",
    purpose: "acquire_one_generated_card",
    source_kind: "lead_paperweight",
    destination: "run_deck",
    selected_card_cost_policy: "unchanged",
    overflow_destination: null,
    can_skip: true,
    is_peeking: false,
    cards: [
      {
        entity_id: "generated-card-1",
        definition_id: "PRIMAL_FORCE",
        name: "Primal Force",
        type: "Skill",
        cost: "0",
        star_cost: null,
        description: "Transform all Attacks in your Hand into Giant Rock.",
        rarity: "Rare",
        is_upgraded: false,
        is_selected: false,
        existing_enchantment: null
      },
      {
        entity_id: "generated-card-2",
        definition_id: "BURNING_PACT",
        name: "Burning Pact",
        type: "Skill",
        cost: "1",
        star_cost: null,
        description: "Exhaust 1 card. Draw 2 cards.",
        rarity: "Uncommon",
        is_upgraded: false,
        is_selected: false,
        existing_enchantment: null
      }
    ]
  },
  legal_actions: [
    {
      action_id: "action-generated-card-1",
      state_id: "state-generated-card-choice-1",
      kind: "select_generated_run_card",
      category: "selection",
      label: "Add Primal Force to the run deck",
      authority: "game_ui",
      evidence_code: "NChooseACardSelectionScreen.SelectHolder via NCardHolder.Pressed",
      entity_bindings: [{ role: "card", entity_id: "generated-card-1" }]
    },
    {
      action_id: "action-generated-card-skip",
      state_id: "state-generated-card-choice-1",
      kind: "skip_generated_run_card_choice",
      category: "alternative",
      label: "Skip",
      authority: "game_ui",
      evidence_code: "NChooseACardSelectionScreen.OnSkipButtonReleased via NChoiceSelectionSkipButton",
      entity_bindings: []
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_lead_paperweight_generated_run_card_acquisition",
    legal_actions: "derived_from_exact_source_visible_choice_controls_and_opening_guard",
    sources: ["RelicCmd.Obtain(LeadPaperweight)", "NChooseACardSelectionScreen", "LeadPaperweight.CardPileCmd.Add(Deck)"],
    missing: []
  }
};

const EVENT_CARD_ACQUISITION_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-event-card-acquisition-1",
  state_sequence: 9,
  context: {
    kind: "event",
    event_id: "BRAIN_LEECH",
    name: "Brain Leech",
    ancient: false,
    in_dialogue: false,
    body: "Share knowledge."
  },
  surface_kind: "event_card_acquisition",
  authority_handoff: { status: "bridge_owned", surface_kind: "event_card_acquisition", reason: "fixture ownership" },
  surface: {
    kind: "event_card_acquisition",
    screen_entity_id: "event-card-screen-1",
    prompt: "Choose a Card",
    destination: "run_deck",
    min_select: 1,
    max_select: 1,
    selected_count: 0,
    selected_card_entity_ids: [] as string[],
    require_manual_confirmation: false,
    cards: [
      {
        entity_id: "event-card-1",
        definition_id: "TWIN_STRIKE",
        name: "Twin Strike",
        type: "Attack",
        cost: "1",
        star_cost: null,
        description: "Deal damage twice.",
        rarity: "Common",
        is_upgraded: false,
        is_selected: false,
        existing_enchantment: null
      },
      {
        entity_id: "event-card-2",
        definition_id: "OFFERING",
        name: "Offering",
        type: "Skill",
        cost: "0",
        star_cost: null,
        description: "Lose HP. Gain energy. Draw cards.",
        rarity: "Rare",
        is_upgraded: false,
        is_selected: false,
        existing_enchantment: null
      }
    ]
  },
  legal_actions: [
    {
      action_id: "action-event-card-1",
      state_id: "state-event-card-acquisition-1",
      kind: "select_event_card_acquisition",
      category: "selection",
      label: "Choose Twin Strike to add to the run deck",
      authority: "game_ui",
      evidence_code: "NSimpleCardSelectScreen.NCardGrid.HolderPressed+EventModel.CardPileCmd.Add(Deck)",
      entity_bindings: [{ role: "card", entity_id: "event-card-1" }]
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_audited_event_card_acquisition",
    legal_actions: "derived_from_exact_visible_grid_and_source_qualified_commit_semantics",
    sources: ["BrainLeech.SelectCardsToAddToDeckFromGrid", "NSimpleCardSelectScreen"],
    missing: []
  }
};

const CARD_BUNDLE_SELECTION_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-card-bundle-1",
  state_sequence: 9,
  context: {
    kind: "event",
    event_id: "NEOW",
    name: "Neow",
    ancient: false,
    in_dialogue: false,
    body: "Choose a bundle."
  },
  surface_kind: "card_bundle_selection",
  authority_handoff: { status: "bridge_owned", surface_kind: "card_bundle_selection", reason: "fixture ownership" },
  surface: {
    kind: "card_bundle_selection",
    stage: "choosing",
    screen_entity_id: "card-bundle-screen-1",
    prompt: "Choose a bundle",
    selected_bundle_entity_id: null,
    bundles: [
      {
        entity_id: "card-bundle-1",
        cards: [{
          entity_id: "bundle-card-1",
          definition_id: "BLOOD_WALL",
          name: "Blood Wall",
          type: "Skill",
          cost: "1",
          star_cost: null,
          description: "Gain Block.",
          rarity: "Common",
          is_upgraded: false,
          is_selected: false,
          existing_enchantment: null
        }]
      },
      {
        entity_id: "card-bundle-2",
        cards: [{
          entity_id: "bundle-card-2",
          definition_id: "TREMble",
          name: "Tremble",
          type: "Skill",
          cost: "1",
          star_cost: null,
          description: "Apply Vulnerable.",
          rarity: "Common",
          is_upgraded: false,
          is_selected: false,
          existing_enchantment: null
        }]
      }
    ]
  },
  legal_actions: [
    {
      action_id: "action-preview-bundle-1",
      state_id: "state-card-bundle-1",
      kind: "preview_card_bundle",
      category: "selection",
      label: "Preview bundle: Blood Wall",
      authority: "game_ui",
      evidence_code: "NCardBundle.Hitbox+NChooseABundleSelectionScreen.OnBundleClicked",
      entity_bindings: [{ role: "bundle", entity_id: "card-bundle-1" }]
    },
    {
      action_id: "action-preview-bundle-2",
      state_id: "state-card-bundle-1",
      kind: "preview_card_bundle",
      category: "selection",
      label: "Preview bundle: Tremble",
      authority: "game_ui",
      evidence_code: "NCardBundle.Hitbox+NChooseABundleSelectionScreen.OnBundleClicked",
      entity_bindings: [{ role: "bundle", entity_id: "card-bundle-2" }]
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_two_stage_visible_card_bundle_selection",
    legal_actions: "derived_from_current_bundle_hitboxes_or_preview_controls",
    sources: ["NChooseABundleSelectionScreen", "NCardBundle.Bundle+Hitbox"],
    missing: []
  }
};

const CARD_REWARD_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-card-reward-1",
  state_sequence: 4,
  context: { kind: "reward_flow", reward_kind: "card_reward" },
  surface_kind: "card_reward_selection",
  authority_handoff: { status: "bridge_owned", surface_kind: "card_reward_selection", reason: "fixture ownership" },
  surface: {
    kind: "card_reward_selection",
    screen_entity_id: "card-reward-screen-1",
    cards: [{
      entity_id: "reward-card-1",
      definition_id: "POMMEL_STRIKE",
      name: "Pommel Strike",
      type: "Attack",
      cost: "1",
      star_cost: null,
      description: "Deal damage. Draw a card.",
      rarity: "Common",
      is_upgraded: false,
      is_selected: false,
      existing_enchantment: null
    }],
    alternatives: [
      { entity_id: "reward-alt-1", index: 0, label: "Reroll", enabled: true },
      { entity_id: "reward-alt-2", index: 1, label: "Sacrifice", enabled: true }
    ]
  },
  legal_actions: [
    {
      action_id: "action-card-reward-card-1",
      state_id: "state-card-reward-1",
      kind: "select_card_reward",
      category: "selection",
      label: "Take Pommel Strike",
      authority: "game_ui",
      evidence_code: "NCardRewardSelectionScreen.SelectCard via NCardHolder.Pressed",
      entity_bindings: [{ role: "card", entity_id: "reward-card-1" }]
    },
    {
      action_id: "action-card-reward-alt-1",
      state_id: "state-card-reward-1",
      kind: "choose_card_reward_alternative",
      category: "alternative",
      label: "Reroll",
      authority: "game_ui",
      evidence_code: "NCardRewardAlternativeButton.visible_label+ForceClick",
      entity_bindings: [{ role: "alternative", entity_id: "reward-alt-1" }]
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_card_reward_selection",
    legal_actions: "derived_from_current_clickability_and_enabled_buttons",
    sources: ["NCardRewardSelectionScreen.UI.CardRow", "NCardRewardSelectionScreen.UI.RewardAlternatives"],
    missing: []
  }
};

const REWARD_CLAIM_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-reward-claim-1",
  state_sequence: 5,
  context: { kind: "reward_flow", reward_kind: "room_rewards" },
  surface_kind: "reward_claim",
  authority_handoff: { status: "bridge_owned", surface_kind: "reward_claim", reason: "fixture ownership" },
  surface: {
    kind: "reward_claim",
    screen_entity_id: "rewards-screen-1",
    rewards: [{
      entity_id: "reward-gold-1",
      kind: "gold",
      label: "25 Gold",
      description: "25 Gold",
      enabled: true
    }],
    potion_slots_full: false,
    discardable_potions: [],
    can_proceed: true,
    proceed_skips_remaining_rewards: true
  },
  legal_actions: [
    {
      action_id: "action-reward-claim-1",
      state_id: "state-reward-claim-1",
      kind: "claim_reward",
      category: "claim",
      label: "Claim 25 Gold",
      authority: "game_ui",
      evidence_code: "NRewardButton.Reward+NRewardButton.ForceClick",
      entity_bindings: [{ role: "reward", entity_id: "reward-gold-1" }]
    },
    {
      action_id: "action-reward-proceed-1",
      state_id: "state-reward-claim-1",
      kind: "proceed_rewards",
      category: "navigation",
      label: "Skip remaining rewards and continue",
      authority: "game_ui",
      evidence_code: "NRewardsScreen.ProceedButton+NProceedButton.ForceClick",
      entity_bindings: []
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_reward_claim",
    legal_actions: "derived_from_same_current_ui_controls_as_execution",
    sources: ["NRewardsScreen._rewardButtons rendered as NRewardButton", "NRewardButton.Reward", "NRewardsScreen.ProceedButton"],
    missing: []
  }
};

const FULL_POTION_REWARD_CLAIM_STATE = {
  ...REWARD_CLAIM_STATE,
  state_id: "state-full-potion-reward-1",
  state_sequence: 6,
  surface: {
    ...REWARD_CLAIM_STATE.surface,
    rewards: [{
      entity_id: "reward-potion-1",
      kind: "potion",
      label: "Skill Potion",
      description: "Choose 1 of 3 random Skills to add to your hand.",
      enabled: false
    }],
    potion_slots_full: true,
    discardable_potions: [
      {
        entity_id: "potion-power-1",
        definition_id: "POWER_POTION",
        name: "Power Potion",
        description: "Choose 1 of 3 random Powers to add to your hand.",
        slot: 0,
        target_type: "None",
        can_use: false,
        automatic: false
      },
      {
        entity_id: "potion-glowwater-1",
        definition_id: "GLOWWATER_POTION",
        name: "Glowwater Potion",
        description: "Gain Energy.",
        slot: 1,
        target_type: "None",
        can_use: false,
        automatic: false
      }
    ]
  },
  legal_actions: [
    {
      action_id: "action-discard-power-potion",
      state_id: "state-full-potion-reward-1",
      kind: "discard_potion_for_reward",
      category: "capacity",
      label: "Discard Power Potion from slot 1 to make room",
      authority: "game_ui",
      evidence_code: "NPotionPopup.OnDiscardButtonPressed+DiscardPotionGameAction",
      entity_bindings: [{ role: "potion", entity_id: "potion-power-1" }]
    },
    {
      action_id: "action-discard-glowwater-potion",
      state_id: "state-full-potion-reward-1",
      kind: "discard_potion_for_reward",
      category: "capacity",
      label: "Discard Glowwater Potion from slot 2 to make room",
      authority: "game_ui",
      evidence_code: "NPotionPopup.OnDiscardButtonPressed+DiscardPotionGameAction",
      entity_bindings: [{ role: "potion", entity_id: "potion-glowwater-1" }]
    },
    {
      ...REWARD_CLAIM_STATE.legal_actions[1],
      action_id: "action-full-potion-reward-proceed",
      state_id: "state-full-potion-reward-1"
    }
  ]
};

const MAP_NAVIGATION_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-map-1",
  state_sequence: 10,
  context: {
    kind: "map",
    act_index: 0,
    current_position: { col: 3, row: 0, point_type: "ancient" },
    visited: [{ col: 3, row: 0, point_type: "ancient" }],
    nodes: [
      {
        entity_id: "map-node-start",
        col: 3,
        row: 0,
        point_type: "ancient",
        state: "traveled",
        children: [
          { col: 2, row: 1, point_type: "monster" },
          { col: 5, row: 1, point_type: "monster" }
        ]
      },
      {
        entity_id: "map-node-left",
        col: 2,
        row: 1,
        point_type: "monster",
        state: "travelable",
        children: [{ col: 1, row: 2, point_type: "unknown" }]
      },
      {
        entity_id: "map-node-right",
        col: 5,
        row: 1,
        point_type: "monster",
        state: "travelable",
        children: [{ col: 4, row: 2, point_type: "monster" }]
      },
      { entity_id: "map-node-left-next", col: 1, row: 2, point_type: "unknown", state: "untravelable", children: [] },
      { entity_id: "map-node-right-next", col: 4, row: 2, point_type: "monster", state: "untravelable", children: [] }
    ]
  },
  surface_kind: "map_navigation",
  authority_handoff: { status: "bridge_owned", surface_kind: "map_navigation", reason: "fixture ownership" },
  surface: {
    kind: "map_navigation",
    screen_entity_id: "map-screen-1",
    travel_enabled: true,
    traveling: false,
    drawing_mode: "none",
    next_options: [
      { entity_id: "map-node-left", col: 2, row: 1, point_type: "monster" },
      { entity_id: "map-node-right", col: 5, row: 1, point_type: "monster" }
    ]
  },
  legal_actions: [
    {
      action_id: "action-map-left",
      state_id: "state-map-1",
      kind: "choose_map_node",
      category: "navigation",
      label: "Choose monster at (2,1)",
      authority: "game_ui",
      evidence_code: "NMapPoint.OnRelease+NMapScreen.OnMapPointSelectedLocally",
      entity_bindings: [{ role: "map_node", entity_id: "map-node-left" }]
    },
    {
      action_id: "action-map-right",
      state_id: "state-map-1",
      kind: "choose_map_node",
      category: "navigation",
      label: "Choose monster at (5,1)",
      authority: "game_ui",
      evidence_code: "NMapPoint.OnRelease+NMapScreen.OnMapPointSelectedLocally",
      entity_bindings: [{ role: "map_node", entity_id: "map-node-right" }]
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_visible_singleplayer_map_navigation",
    legal_actions: "derived_from_exact_current_travelable_map_point_controls",
    sources: ["NMapScreen", "NMapPoint", "RunState.Map"],
    missing: []
  }
};

function visibleInspectionCard(overrides: Record<string, unknown> = {}) {
  return {
    entity_id: "deck-card-1",
    definition_id: "STRIKE",
    name: "Strike",
    type: "Attack",
    cost: "1",
    star_cost: null,
    description: "Deal damage.",
    rarity: "Basic",
    is_upgraded: false,
    is_selected: false,
    existing_enchantment: {
      definition_id: "SLITHER",
      name: "Slither",
      description: "When drawn, randomize this card's cost.",
      amount: 1,
      observation_source: "visible_ui"
    },
    ...overrides
  };
}

function runDeckInspection(stateId: string, cards = [visibleInspectionCard()]) {
  return {
    protocol_version: "2.0-preview.55",
    inspection_id: `inspection-run-deck-${stateId}`,
    expected_state_id: stateId,
    observed_state_id: stateId,
    observed_at: "2026-07-16T00:00:01Z",
    kind: "run_deck",
    visibility_class: "normal_inspection",
    ordering_semantics: "unordered_multiset",
    content: { kind: "run_deck", card_count: cards.length, cards },
    completeness: {
      player_visible_semantics: "complete_for_player_run_deck_contents_without_semantic_order",
      sources: ["NDeckViewScreen.ShowScreen(Player)", "PileType.Deck.GetPile(Player).Cards"],
      missing: []
    },
    bridge: CAPABILITIES.bridge,
    game: CAPABILITIES.game,
    observation_policy: CAPABILITIES.observation_policy,
    diagnostics: []
  };
}

function combatPilesInspection(stateId: string) {
  return {
    protocol_version: "2.0-preview.55",
    inspection_id: `inspection-combat-piles-${stateId}`,
    expected_state_id: stateId,
    observed_state_id: stateId,
    observed_at: "2026-07-16T00:00:01Z",
    kind: "combat_piles",
    visibility_class: "normal_inspection",
    ordering_semantics: "unordered_multiset",
    content: {
      kind: "combat_piles",
      zones: [
        {
          zone: "draw",
          card_count: 1,
          ordering_semantics: "unordered_multiset",
          cards: [visibleInspectionCard({ entity_id: "draw-card-1", existing_enchantment: null })]
        },
        {
          zone: "discard",
          card_count: 1,
          ordering_semantics: "unordered_multiset",
          cards: [visibleInspectionCard({ entity_id: "discard-card-1", definition_id: "DEFEND", name: "Defend", type: "Skill", existing_enchantment: null })]
        },
        { zone: "exhaust", card_count: 0, ordering_semantics: "unordered_multiset", cards: [] }
      ]
    },
    completeness: {
      player_visible_semantics: "complete_for_player_visible_combat_pile_contents_without_draw_order",
      sources: ["NCardPileScreen.Pile.Cards"],
      missing: ["draw_pile_order_hidden_by_policy"]
    },
    bridge: CAPABILITIES.bridge,
    game: CAPABILITIES.game,
    observation_policy: CAPABILITIES.observation_policy,
    diagnostics: []
  };
}

function shopCatalogInspection(stateId: string) {
  const closedOffer = <T extends { stocked: boolean; can_purchase: boolean; blocked_reason?: string | null }>(offer: T) => ({
    ...structuredClone(offer),
    can_purchase: false,
    blocked_reason: offer.stocked ? "not_visible" : offer.blocked_reason
  });
  return {
    protocol_version: "2.0-preview.55",
    inspection_id: `inspection-shop-catalog-${stateId}`,
    expected_state_id: stateId,
    observed_state_id: stateId,
    observed_at: "2026-07-20T00:00:01Z",
    kind: "shop_catalog",
    visibility_class: "normal_inspection",
    ordering_semantics: "fixed_ui_slots",
    content: {
      kind: "shop_catalog",
      access_state: "inventory_closed_open_to_inspect",
      cards: SHOP_INVENTORY_STATE.surface.cards.map(closedOffer),
      relics: SHOP_INVENTORY_STATE.surface.relics.map(closedOffer),
      potions: SHOP_INVENTORY_STATE.surface.potions.map(closedOffer),
      card_removal: closedOffer(SHOP_INVENTORY_STATE.surface.card_removal)
    },
    completeness: {
      player_visible_semantics: "complete_for_player_openable_standard_merchant_catalog_without_action_authority",
      sources: ["MerchantRoom.GetLocalInventory", "MerchantInventory typed entries"],
      missing: []
    },
    bridge: CAPABILITIES.bridge,
    game: CAPABILITIES.game,
    observation_policy: CAPABILITIES.observation_policy,
    diagnostics: []
  };
}

function coherentObservationBundle(
  state: Record<string, any>,
  inspections?: Partial<Record<"run_deck" | "combat_piles" | "shop_catalog", Record<string, unknown>>>
) {
  const defaultInspections = Object.fromEntries(state.inspection_catalog.map((entry: { kind: "run_deck" | "combat_piles" | "shop_catalog" }) => {
    const inspection = entry.kind === "run_deck"
      ? runDeckInspection(state.state_id)
      : entry.kind === "combat_piles"
        ? combatPilesInspection(state.state_id)
        : shopCatalogInspection(state.state_id);
    return [entry.kind, { ...inspection, bridge: state.bridge, game: state.game }];
  }));
  const resolvedInspections = inspections ?? defaultInspections;
  return {
    protocol_version: "2.0-preview.55",
    observation_id: `observation-${state.state_id}`,
    coherent: true,
    state,
    inspections: resolvedInspections,
    bridge: state.bridge,
    game: state.game,
    diagnostics: []
  };
}

const TEST_SOURCE: AdapterDescriptor = {
  adapterId: "sts2mcp-rest-negotiated",
  endpoint: "http://adapter.test",
  capabilities: {
    canReadState: true,
    canExecuteActions: true,
    canListLegalActions: false,
    actionResults: "partial" as const,
    legalActionAuthority: "mixed" as const,
    protocols: ["sts2mcp_v1", "bridge_v2"]
  }
};

describe("Bridge v2 Re-SpireAgent integration", () => {
  it("rejects duplicate capability surface declarations before authority evaluation", () => {
    const duplicate = structuredClone(CAPABILITIES);
    duplicate.surfaces.push(structuredClone(duplicate.surfaces[0]!));

    expect(() => decodeBridgeV2Capabilities(duplicate)).toThrow("duplicate surface kinds");
  });

  it("rejects action or Inspection permission from an unqualified Modset", () => {
    const unsafe = structuredClone(CAPABILITIES);
    unsafe.game.modset.status = "additional_loaded_mods";
    unsafe.game.modset.exact_permission_eligible = false;
    unsafe.game.modset.mods.push({
      id: "EXTRA_MOD",
      version: "1.0.0",
      source: "SteamWorkshop",
      load_state: "Loaded",
      affects_gameplay: true,
      workshop_id: "12345678901234567890",
      assemblies: [{ name: "ExtraMod", version: "1.0.0.0", module_version_id: "extra-module-v1" }]
    });

    expect(() => decodeBridgeV2Capabilities(unsafe)).toThrow(
      "Unqualified Modset must not advertise Bridge v2 action or Inspection permission"
    );
  });

  it("rejects exact Modset claims that do not match the negotiated Bridge module", () => {
    const mismatched = structuredClone(CAPABILITIES);
    mismatched.game.modset.mods[0]!.assemblies[0]!.module_version_id = "different-module";

    expect(() => decodeBridgeV2Capabilities(mismatched)).toThrow(
      "Exact-permission Modset must contain only the negotiated STS2_MCP module"
    );
  });

  it("rejects contradictory empty-scope Inspection capability declarations", () => {
    const enabledWithoutKinds = structuredClone(CAPABILITIES);
    enabledWithoutKinds.game.compatibility.inspection_allowed_kinds = [];
    enabledWithoutKinds.game.compatibility.inspection_canary_kinds = [];
    enabledWithoutKinds.inspections.status = "qualified_read_only_scoped";
    enabledWithoutKinds.inspections.implemented_kinds = [];
    expect(() => decodeBridgeV2Capabilities(enabledWithoutKinds)).toThrow(
      "Inspection capability status requires at least one explicitly permitted kind"
    );

    const disabledWithKinds = structuredClone(CAPABILITIES);
    disabledWithKinds.game.compatibility.inspection_canary_kinds = [];
    disabledWithKinds.inspections.status = "disabled_for_current_build";
    disabledWithKinds.inspections.implemented_kinds = ["run_deck"];
    expect(() => decodeBridgeV2Capabilities(disabledWithKinds)).toThrow(
      "disabled Inspection capability must not advertise kinds"
    );

    const emptyScope = structuredClone(CAPABILITIES);
    emptyScope.game.compatibility.inspection_allowed = false;
    emptyScope.game.compatibility.inspection_allowed_kinds = [];
    emptyScope.game.compatibility.inspection_canary_kinds = [];
    emptyScope.inspections.status = "implemented_read_only";
    emptyScope.inspections.implemented_kinds = [];
    expect(() => decodeBridgeV2Capabilities(emptyScope)).toThrow(
      "Inspection capability status requires at least one explicitly permitted kind"
    );
  });

  it("strictly decodes the qualified surface and rejects discriminator mismatch", () => {
    expect(decodeBridgeV2State(DECK_ENCHANT_STATE).data.surface.kind).toBe("deck_enchant_selection");
    const resolvedWithoutContractId = structuredClone(DECK_ENCHANT_STATE) as any;
    delete resolvedWithoutContractId.contract_instance_shadow.semantic_contract_id;
    expect(() => decodeBridgeV2State(resolvedWithoutContractId)).toThrow(
      "resolved contract shadow requires semantic_contract_id"
    );
    expect(() => decodeBridgeV2State({ ...DECK_ENCHANT_STATE, surface_kind: "other" })).toThrow("does not match");
    expect(() => decodeBridgeV2State({ ...DECK_ENCHANT_STATE, shared_state: null })).toThrow(
      "requires top-level shared_state"
    );
    const mismatchedCombatPlayer = structuredClone(COMBAT_TURN_STATE);
    mismatchedCombatPlayer.context.player.player_entity_id = "other-player";
    expect(() => decodeBridgeV2State(mismatchedCombatPlayer)).toThrow(
      "does not match shared_state player entity_id"
    );
  });

  it("projects exact combat no-input transitions without action or legacy authority", () => {
    const decoded = decodeBridgeV2State(COMBAT_RESOLUTION_NO_ACTION_STATE).data;
    expect(decoded).toMatchObject({
      readiness: "settling",
      context: { kind: "combat_transition", phase: "resolution", transition: "awaiting_room_resolution" },
      surface: { kind: "no_action", reason: "settling" },
      authority_handoff: { status: "none_fail_closed", surface_kind: null },
      legal_actions: []
    });

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({
        state: structuredClone(COMBAT_RESOLUTION_NO_ACTION_STATE),
        capabilities: structuredClone(CAPABILITIES)
      }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      context: { kind: "combat_transition", phase: "resolution" },
      surface: { kind: "no_action", reason: "settling" },
      stability: "settling",
      actionAuthority: "none"
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
    expect(envelope.diagnostics.status).toBe("ok");

    const setup = structuredClone(COMBAT_RESOLUTION_NO_ACTION_STATE) as any;
    setup.context = {
      kind: "combat_transition",
      phase: "setup",
      transition: "awaiting_combat_start"
    };
    expect(decodeBridgeV2State(setup).data.context).toMatchObject({
      kind: "combat_transition",
      phase: "setup"
    });
  });

  it("rejects authority, action, completeness, or context contradictions in no-input transitions", () => {
    const withAction = structuredClone(COMBAT_RESOLUTION_NO_ACTION_STATE) as any;
    withAction.legal_actions = [structuredClone(DECK_ENCHANT_STATE.legal_actions[0]!)];
    expect(() => decodeBridgeV2State(withAction)).toThrow("must be settling, publish no actions");

    const bridgeOwned = structuredClone(COMBAT_RESOLUTION_NO_ACTION_STATE) as any;
    bridgeOwned.authority_handoff = {
      status: "bridge_owned",
      surface_kind: "no_action",
      reason: "contradictory fixture"
    };
    expect(() => decodeBridgeV2State(bridgeOwned)).toThrow("retain none_fail_closed authority");

    const wrongContext = structuredClone(COMBAT_RESOLUTION_NO_ACTION_STATE) as any;
    wrongContext.context = structuredClone(DECK_ENCHANT_STATE.context);
    expect(() => decodeBridgeV2State(wrongContext)).toThrow("requires combat_transition context");

    const incomplete = structuredClone(COMBAT_RESOLUTION_NO_ACTION_STATE) as any;
    incomplete.completeness.missing = ["transition_owner"];
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: incomplete, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });
  });

  it("uses shared_state as the sole persistent run/player authority on Bridge-owned states", async () => {
    const legacyState = await fixture("event") as JsonObject;
    const state = structuredClone(SHOP_ROOM_STATE);
    (state.context as Record<string, unknown>).gold = 9999;
    const envelope = normalizeCurrentState(wrapBridgeV2State({
      state,
      capabilities: structuredClone(CAPABILITIES),
      legacyState
    }), TEST_SOURCE);

    expect(envelope.currentState).toMatchObject({
      run: {
        act: 1,
        actId: "OVERGROWTH",
        floor: 6,
        bosses: [{ id: "TEST_SUBJECTS", order: 0 }]
      },
      player: {
        character: "Ironclad",
        hp: 61,
        maxHp: 80,
        gold: 26,
        relics: [{
          id: "CURSED_PEARL",
          cardPreviews: [{ id: "GREED", name: "Greed", type: "Curse" }]
        }]
      },
      context: { kind: "shop", gold: 26 },
      bridgeSharedStateEvidence: {
        scope: "active_single_player_run",
        missing: []
      }
    });
    expect(envelope.diagnostics.inferredFields).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "run/non_action_shared_state" })
    ]));
  });

  it("keeps merchant deck removal separate from universal deck selection and fails closed outside shop", () => {
    const decoded = decodeBridgeV2State(DECK_REMOVAL_STATE).data;
    expect(decoded.surface.kind).toBe("deck_removal_selection");
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(DECK_REMOVAL_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      actionAuthority: "bridge_advertised",
      context: { kind: "shop" },
      surface: {
        kind: "deck_removal_selection",
        prompt: "Choose a card to Remove.",
        selectedCount: 0
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({
        kind: "toggle_deck_removal_card",
        action: expect.objectContaining({ bridgeActionKind: "toggle_deck_removal_card" })
      })
    ]);
    expect(() => decodeBridgeV2State({ ...DECK_REMOVAL_STATE, context: DECK_ENCHANT_STATE.context })).toThrow(
      "deck_removal_selection surface requires shop context"
    );
    const previewWithSelectAction = structuredClone(DECK_REMOVAL_STATE);
    previewWithSelectAction.surface.stage = "preview";
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: previewWithSelectAction, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");
  });

  it("keeps deck upgrade purpose and preview semantics separate from generic card selection", () => {
    const decoded = decodeBridgeV2State(DECK_UPGRADE_STATE).data;
    expect(decoded.surface.kind).toBe("deck_upgrade_selection");
    const selecting = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(DECK_UPGRADE_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(selecting.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "rest" },
      surface: {
        kind: "deck_upgrade_selection",
        stage: "selecting",
        selectedCount: 0,
        previewCards: []
      }
    });
    expect(buildAllowedActions(selecting.currentState, selecting.stateHash)).toEqual([
      expect.objectContaining({
        kind: "toggle_deck_upgrade_card",
        action: expect.objectContaining({ bridgeActionKind: "toggle_deck_upgrade_card" })
      })
    ]);

    const previewStateId = "state-rest-upgrade-preview-1";
    const selectedUpgradeCard = {
      ...DECK_UPGRADE_STATE.surface.cards[0]!,
      is_selected: true
    };
    const preview = {
      ...structuredClone(DECK_UPGRADE_STATE),
      state_id: previewStateId,
      surface: {
        ...structuredClone(DECK_UPGRADE_STATE.surface),
        stage: "preview",
        selected_count: 1,
        selected_card_entity_ids: ["deck-card-strike-upgrade-1"],
        cards: [selectedUpgradeCard],
        preview_cards: [{
          ...selectedUpgradeCard,
          entity_id: "upgrade-preview-card-1",
          name: "Strike+",
          description: "Deal 9 damage.",
          is_upgraded: true,
          is_selected: false
        }]
      },
      legal_actions: [{
        action_id: "action-deck-upgrade-confirm-1",
        state_id: previewStateId,
        kind: "confirm_deck_upgrade",
        category: "commit",
        label: "Confirm the visible card upgrade",
        authority: "game_ui",
        evidence_code: "NDeckUpgradeSelectScreen.ConfirmSelection+caller CardCmd.Upgrade",
        entity_bindings: [{ role: "card", entity_id: "deck-card-strike-upgrade-1" }]
      }]
    };
    const previewEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: preview, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(previewEnvelope.currentState).toMatchObject({
      stability: "actionable",
      surface: {
        kind: "deck_upgrade_selection",
        stage: "preview",
        selectedCount: 1,
        previewCards: [expect.objectContaining({ name: "Strike+", upgraded: true })]
      }
    });

    const selectingWithCommit = {
      ...structuredClone(DECK_UPGRADE_STATE),
      legal_actions: [{
        ...DECK_UPGRADE_STATE.legal_actions[0]!,
        kind: "confirm_deck_upgrade"
      }]
    };
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: selectingWithCommit, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");
    expect(() => decodeBridgeV2State({ ...DECK_UPGRADE_STATE, context: DECK_REMOVAL_STATE.context })).toThrow(
      "deck_upgrade_selection surface requires event or rest context"
    );
  });

  it("keeps random transform purpose, hidden outcome, and exact event source fail closed", () => {
    const decoded = decodeBridgeV2State(DECK_TRANSFORM_STATE).data;
    expect(decoded.surface.kind).toBe("deck_transform_selection");
    const selecting = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(DECK_TRANSFORM_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(selecting.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "event", eventId: "WHISPERING_HOLLOW" },
      surface: {
        kind: "deck_transform_selection",
        stage: "selecting",
        previewKind: "none",
        replacementKnown: false
      }
    });
    expect(buildAllowedActions(selecting.currentState, selecting.stateHash)).toEqual([
      expect.objectContaining({
        kind: "toggle_deck_transform_card",
        action: expect.objectContaining({ bridgeActionKind: "toggle_deck_transform_card" })
      })
    ]);

    const previewStateId = "state-event-transform-preview-1";
    const preview = {
      ...structuredClone(DECK_TRANSFORM_STATE),
      state_id: previewStateId,
      surface: {
        ...structuredClone(DECK_TRANSFORM_STATE.surface),
        stage: "preview",
        selected_count: 1,
        selected_card_entity_ids: ["deck-card-strike-transform-1"],
        preview_kind: "random_uncommitted_cycle",
        cards: [{ ...DECK_TRANSFORM_STATE.surface.cards[0]!, is_selected: true }]
      },
      legal_actions: [{
        action_id: "action-deck-transform-confirm-1",
        state_id: previewStateId,
        kind: "confirm_deck_transform",
        category: "commit",
        label: "Confirm the random transformation",
        authority: "game_ui",
        evidence_code: "NDeckTransformSelectScreen.CompleteSelection+WhisperingHollow.CardCmd.TransformToRandom",
        entity_bindings: [{ role: "card", entity_id: "deck-card-strike-transform-1" }]
      }]
    };
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: preview, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({
      stability: "actionable",
      surface: {
        kind: "deck_transform_selection",
        stage: "preview",
        previewKind: "random_uncommitted_cycle",
        replacementKnown: false
      }
    });

    expect(() => decodeBridgeV2State({
      ...DECK_TRANSFORM_STATE,
      context: { ...DECK_TRANSFORM_STATE.context, event_id: "OTHER_EVENT" }
    })).toThrow("deck_transform_selection surface requires exact Whispering Hollow event context");
    const selectingWithCommit = {
      ...structuredClone(DECK_TRANSFORM_STATE),
      legal_actions: [{ ...DECK_TRANSFORM_STATE.legal_actions[0]!, kind: "confirm_deck_transform" }]
    };
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: selectingWithCommit, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");
  });

  it("keeps treasure chest, relic choice, skip, and departure as one staged semantic surface", () => {
    const decoded = decodeBridgeV2State(TREASURE_ROOM_STATE).data;
    expect(decoded.context.kind).toBe("treasure");
    expect(decoded.surface.kind).toBe("treasure_room");

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(TREASURE_ROOM_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "treasure" },
      surface: {
        kind: "treasure_room",
        stage: "relic_choice",
        chestOpened: true,
        canSkip: true,
        canProceed: false,
        relics: [{
          id: "BAG_OF_MARBLES",
          rarity: "Common",
          keywords: [{ name: "Vulnerable" }],
          cardPreviews: []
        }]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.kind)).toEqual([
      "choose_treasure_relic",
      "skip_treasure_relic"
    ]);

    const opening = {
      ...structuredClone(TREASURE_ROOM_STATE),
      readiness: "settling",
      surface: {
        ...structuredClone(TREASURE_ROOM_STATE.surface),
        stage: "opening",
        relics: [],
        can_skip: false
      },
      legal_actions: []
    };
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: opening, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "settling", actionAuthority: "bridge_advertised" });

    const hiddenBinding = structuredClone(TREASURE_ROOM_STATE);
    hiddenBinding.legal_actions[0]!.entity_bindings[0]!.entity_id = "hidden-relic";
    expect(() => decodeBridgeV2State(hiddenBinding)).toThrow("absent from the visible context and surface");

    const completedWithChoice = structuredClone(TREASURE_ROOM_STATE);
    completedWithChoice.surface.stage = "completed";
    completedWithChoice.surface.relics = [];
    completedWithChoice.surface.can_skip = false;
    completedWithChoice.surface.can_proceed = true;
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: completedWithChoice, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");
  });

  it("keeps game-over intro and summary as separate exact-control stages", () => {
    const decoded = decodeBridgeV2State(GAME_OVER_STATE).data;
    expect(decoded.context.kind).toBe("game_over");
    expect(decoded.surface.kind).toBe("game_over");

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(GAME_OVER_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: {
        kind: "run_ended",
        result: "loss",
        gameMode: "standard",
        score: 321,
        floorReached: 12,
        ascension: 0
      },
      surface: {
        kind: "game_over",
        stage: "summary",
        returnDestination: "main_menu",
        canAdvanceSummary: false,
        canReturn: true
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.kind)).toEqual([
      "return_game_over"
    ]);

    const introStateId = "state-game-over-intro-1";
    const intro = {
      ...structuredClone(GAME_OVER_STATE),
      state_id: introStateId,
      context: {
        kind: "game_over",
        result: "loss",
        game_mode: "standard",
        score: null,
        floor_reached: null,
        ascension: null
      },
      surface: {
        ...structuredClone(GAME_OVER_STATE.surface),
        stage: "intro",
        return_destination: null,
        can_advance_summary: true,
        can_return: false
      },
      legal_actions: [{
        ...GAME_OVER_STATE.legal_actions[0]!,
        action_id: "action-game-over-advance-1",
        state_id: introStateId,
        kind: "advance_game_over_summary",
        label: "Continue to the run summary"
      }]
    };
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: intro, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({
      stability: "actionable",
      context: { kind: "run_ended", result: "loss" },
      surface: { kind: "game_over", stage: "intro", canAdvanceSummary: true, canReturn: false }
    });

    const illegalMixedStage = structuredClone(GAME_OVER_STATE);
    illegalMixedStage.surface.can_advance_summary = true;
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: illegalMixedStage, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");

    expect(() => decodeBridgeV2State({ ...GAME_OVER_STATE, context: { kind: "treasure" } })).toThrow(
      "game_over surface requires game_over context"
    );
  });

  it("accepts menu-owned character selection without active-run shared state", () => {
    const decoded = decodeBridgeV2State(CHARACTER_SELECT_STATE).data;
    expect(decoded.context.kind).toBe("menu");
    expect(decoded.surface.kind).toBe("character_select");

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(CHARACTER_SELECT_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "menu", screen: "character_select" },
      surface: {
        kind: "character_select",
        stage: "choosing",
        canEmbark: true,
        canGoBack: true,
        selectedDetails: {
          characterId: "IRONCLAD",
          startingHp: 80,
          startingGold: 99,
          startingRelic: { id: "BURNING_BLOOD" }
        }
      }
    });
    expect(envelope.currentState.run).toBeUndefined();
    expect(envelope.currentState.player).toBeUndefined();
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.kind)).toEqual([
      "select_character",
      "embark_standard_run",
      "back_from_character_select"
    ]);
    expect(JSON.stringify(envelope.currentState)).not.toContain("starting_deck");

    const invalidSharedState = { ...structuredClone(CHARACTER_SELECT_STATE), shared_state: structuredClone(SHARED_STATE) };
    expect(() => decodeBridgeV2State(invalidSharedState)).toThrow("character_select must not carry active-run shared_state");

    const invalidSelectedDetails = structuredClone(CHARACTER_SELECT_STATE);
    invalidSelectedDetails.surface.selected_details.character_id = "SILENT";
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: invalidSelectedDetails, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");
  });

  it("keeps root-menu visibility broader than its bounded action authority", () => {
    const decoded = decodeBridgeV2State(MAIN_MENU_STATE).data;
    expect(decoded.context).toMatchObject({ kind: "menu", flow: "root_navigation" });
    expect(decoded.surface.kind).toBe("main_menu");

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(MAIN_MENU_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "menu", screen: "main_menu" },
      surface: {
        kind: "main_menu",
        choices: [
          { semanticId: "singleplayer", bridgeSupport: "actionable" },
          { semanticId: "settings", bridgeSupport: "visible_unsupported" },
          { semanticId: "quit", bridgeSupport: "visible_unsupported" }
        ]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.kind)).toEqual([
      "open_singleplayer"
    ]);

    const unsupportedAction = structuredClone(MAIN_MENU_STATE);
    unsupportedAction.legal_actions[0]!.kind = "settings";
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: unsupportedAction, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");
  });

  it("projects Standard and Back without turning Daily into an executable menu action", () => {
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(SINGLEPLAYER_MENU_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      stability: "actionable",
      context: { kind: "menu", screen: "singleplayer_menu" },
      surface: {
        kind: "singleplayer_menu",
        choices: [
          { semanticId: "standard", bridgeSupport: "actionable" },
          { semanticId: "daily", bridgeSupport: "visible_unsupported" },
          { semanticId: "back", bridgeSupport: "actionable" }
        ]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.kind)).toEqual([
      "open_standard_run_setup",
      "back_from_singleplayer_menu"
    ]);

    const wrongContext = { ...structuredClone(SINGLEPLAYER_MENU_STATE), context: { kind: "menu", flow: "root_navigation" } };
    expect(() => decodeBridgeV2State(wrongContext)).toThrow("singleplayer_menu surface requires standard-run menu context");
  });

  it("projects the exact v0.109 removal candidate as non-executable evidence only", () => {
    const candidateCapabilities = structuredClone(CAPABILITIES);
    candidateCapabilities.game = {
      version: "v0.109.0",
      commit: "c12f634d",
      branch: "v0.109.0",
      main_assembly_hash: -840572606,
      modset: structuredClone(CAPABILITIES.game.modset),
      compatibility: {
        status: "observation_only_candidate",
        tested_game_versions: ["0.108.0"],
        tested_build_fingerprints: ["v0.108.0|58694f64|-2044609792"],
        action_execution_allowed: false,
        state_observation_allowed: true,
        inspection_allowed: false,
        action_execution_surface_kinds: [],
        action_canary_surface_kinds: [],
        inspection_allowed_kinds: [],
        inspection_canary_kinds: [],
        observation_only_surface_kinds: ["deck_removal_selection"],
        observation_candidate_build_fingerprints: ["v0.109.0|c12f634d|-840572606"],
        detail: "static bindings only",
        action_permission_scopes: []
      }
    };
    candidateCapabilities.surfaces = candidateCapabilities.surfaces.map((surface) => ({
      ...surface,
      support: surface.kind === "deck_removal_selection"
        ? "candidate_observation_only"
        : "not_qualified_for_current_build"
    }));
    candidateCapabilities.inspections = {
      ...candidateCapabilities.inspections,
      status: "disabled_for_current_build",
      implemented_kinds: []
    };
    const candidateState = {
      ...structuredClone(DECK_REMOVAL_STATE),
      game: candidateCapabilities.game,
      visibility: {
        ...RUN_VISIBILITY,
        available_inspections: [],
        linked_detail_kinds: []
      },
      inspection_catalog: [],
      readiness: "observation_only",
      legal_actions: [],
      completeness: {
        ...DECK_REMOVAL_STATE.completeness,
        legal_actions: "suppressed_by_candidate_observation_gate"
      },
      diagnostics: [{
        code: "bridge.identity.candidate_observation_only",
        severity: "warning",
        category: "identity",
        effect: "actions_suppressed",
        recoverability: "update_bridge"
      }]
    };

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: candidateState, capabilities: candidateCapabilities }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      stability: "unknown",
      actionAuthority: "none",
      context: { kind: "shop" },
      surface: { kind: "deck_removal_selection" }
    });
    expect(envelope.diagnostics.status).toBe("degraded");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);

    const candidateWithAction = {
      ...candidateState,
      legal_actions: structuredClone(DECK_REMOVAL_STATE.legal_actions)
    };
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: candidateWithAction, capabilities: candidateCapabilities }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");
  });

  it("accepts only the explicit v0.109 qualified and canary action scopes", () => {
    const canaryCapabilities = structuredClone(CAPABILITIES);
    const qualifiedKinds = ["deck_removal_selection", "deck_upgrade_selection", "combat_turn"];
    const canaryKinds = ["reward_claim", "card_reward_selection", "map_navigation", "treasure_room", "deck_enchant_selection"];
    const actionPermissionScopes = canaryCapabilities.surfaces.flatMap((surface) => {
      const tier = qualifiedKinds.includes(surface.kind)
        ? "qualified" as const
        : canaryKinds.includes(surface.kind)
          ? "canary" as const
          : null;
      return tier === null
        ? []
        : surface.operations.map((operation) => ({ surface_kind: surface.kind, operation, tier }));
    });
    canaryCapabilities.game = {
      version: "v0.109.0",
      commit: "c12f634d",
      branch: "v0.109.0",
      main_assembly_hash: -840572606,
      modset: structuredClone(CAPABILITIES.game.modset),
      compatibility: {
        status: "qualified_scoped",
        tested_game_versions: ["0.108.0", "0.109.0"],
        tested_build_fingerprints: [
          "v0.108.0|58694f64|-2044609792",
          "v0.109.0|c12f634d|-840572606"
        ],
        action_execution_allowed: true,
        state_observation_allowed: true,
        inspection_allowed: true,
        action_execution_surface_kinds: qualifiedKinds,
        action_canary_surface_kinds: canaryKinds,
        inspection_allowed_kinds: ["run_deck"],
        inspection_canary_kinds: [],
        observation_only_surface_kinds: [],
        observation_candidate_build_fingerprints: [],
        detail: "merchant removal qualified scope only",
        action_permission_scopes: actionPermissionScopes
      }
    };
    canaryCapabilities.surfaces = canaryCapabilities.surfaces.map((surface) => ({
      ...surface,
      support: qualifiedKinds.includes(surface.kind)
        ? "qualified_exact_build"
        : canaryKinds.includes(surface.kind)
          ? "candidate_action_canary"
        : "not_qualified_for_current_build",
      operations: qualifiedKinds.includes(surface.kind) || canaryKinds.includes(surface.kind)
        ? surface.operations
        : []
    }));
    canaryCapabilities.inspections = {
      ...canaryCapabilities.inspections,
      status: "qualified_read_only_scoped",
      implemented_kinds: ["run_deck"]
    };
    const canaryState = {
      ...structuredClone(DECK_REMOVAL_STATE),
      game: canaryCapabilities.game,
      diagnostics: []
    };

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: canaryState, capabilities: canaryCapabilities }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "shop" },
      surface: { kind: "deck_removal_selection" }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({ kind: "toggle_deck_removal_card" })
    ]);
    const inspectionEnvelope = normalizeCurrentState(
      wrapBridgeV2State({
        state: canaryState,
        capabilities: canaryCapabilities,
        inspections: {
          run_deck: {
            ...runDeckInspection(canaryState.state_id),
            game: canaryCapabilities.game
          }
        }
      }),
      TEST_SOURCE
    );
    expect(inspectionEnvelope.currentState.bridgeInspections).toEqual([
      expect.objectContaining({ kind: "run_deck", expectedStateId: canaryState.state_id })
    ]);
    expect(inspectionEnvelope.currentState.bridgeInspectionFacts?.runDeck).toHaveLength(1);

    const combatCanaryState = {
      ...structuredClone(COMBAT_TURN_STATE),
      game: canaryCapabilities.game,
      visibility: {
        ...RUN_VISIBILITY,
        profile_id: "combat.combat_turn.v1"
      },
      inspection_catalog: [RUN_DECK_CATALOG_ENTRY],
      diagnostics: []
    };
    const combatCanary = normalizeCurrentState(
      wrapBridgeV2State({ state: combatCanaryState, capabilities: canaryCapabilities }),
      TEST_SOURCE
    );
    expect(combatCanary.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "combat" },
      surface: { kind: "combat_turn" }
    });

    for (const state of [REWARD_CLAIM_STATE, CARD_REWARD_STATE, MAP_NAVIGATION_STATE, DECK_ENCHANT_STATE]) {
      const canaryState = {
        ...structuredClone(state),
        game: canaryCapabilities.game,
        diagnostics: []
      };
      const canary = normalizeCurrentState(
        wrapBridgeV2State({ state: canaryState, capabilities: canaryCapabilities }),
        TEST_SOURCE
      );
      expect(canary.currentState).toMatchObject({
        stability: "actionable",
        actionAuthority: "bridge_advertised",
        surface: { kind: state.surface.kind }
      });
    }

    const wrongSurface = {
      ...structuredClone(EVENT_OPTION_STATE),
      game: canaryCapabilities.game
    };
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: wrongSurface, capabilities: canaryCapabilities }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");

    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    });
    (adapter as unknown as { capabilitiesPayload: { data: typeof canaryCapabilities } }).capabilitiesPayload = {
      data: canaryCapabilities
    };
    expect(adapter.describe().negotiated).toMatchObject({
      supported_surfaces: [],
      qualified_scoped_surfaces: ["deck_removal_selection", "deck_upgrade_selection", "combat_turn"],
      candidate_observation_surfaces: [],
      candidate_action_canary_surfaces: ["deck_enchant_selection", "card_reward_selection", "reward_claim", "map_navigation", "treasure_room"]
    });

    const mixedInspectionCapabilities = structuredClone(canaryCapabilities);
    mixedInspectionCapabilities.game.compatibility.inspection_canary_kinds = ["combat_piles"];
    mixedInspectionCapabilities.inspections = {
      ...mixedInspectionCapabilities.inspections,
      status: "mixed_scoped_read_only",
      implemented_kinds: ["run_deck", "combat_piles"]
    };
    expect(normalizeCurrentState(
      wrapBridgeV2State({
        state: {
          ...combatCanaryState,
          game: mixedInspectionCapabilities.game,
          visibility: structuredClone(COMBAT_TURN_STATE.visibility),
          inspection_catalog: structuredClone(COMBAT_TURN_STATE.inspection_catalog)
        },
        capabilities: mixedInspectionCapabilities
      }),
      TEST_SOURCE
    ).currentState.stability).toBe("actionable");
  });

  it("accepts a current exact build with only explicit audited canaries", () => {
    const canaryOnlyCapabilities = structuredClone(CAPABILITIES);
    const canaryKinds = ["event_option", "event_card_acquisition", "map_navigation"];
    const actionPermissionScopes = canaryOnlyCapabilities.surfaces.flatMap((surface) =>
      canaryKinds.includes(surface.kind)
        ? surface.operations.map((operation) => ({
          surface_kind: surface.kind,
          operation,
          tier: "canary" as const
        }))
        : []
    );
    canaryOnlyCapabilities.game = {
      version: "v0.109.0",
      commit: "c12f634d",
      branch: "v0.109.0",
      main_assembly_hash: 1833084275,
      modset: structuredClone(CAPABILITIES.game.modset),
      compatibility: {
        status: "qualified_scoped",
        tested_game_versions: ["0.108.0", "0.109.0"],
        tested_build_fingerprints: [
          "v0.108.0|58694f64|-2044609792",
          "v0.109.0|c12f634d|-840572606",
          "v0.109.0|c12f634d|1833084275"
        ],
        action_execution_allowed: true,
        state_observation_allowed: true,
        inspection_allowed: false,
        action_execution_surface_kinds: [],
        action_canary_surface_kinds: canaryKinds,
        inspection_allowed_kinds: [],
        inspection_canary_kinds: [],
        observation_only_surface_kinds: [],
        observation_candidate_build_fingerprints: [],
        detail: "current-build event option, acquisition, and map canaries only",
        action_permission_scopes: actionPermissionScopes
      }
    };
    canaryOnlyCapabilities.surfaces = canaryOnlyCapabilities.surfaces.map((surface) => ({
      ...surface,
      support: canaryKinds.includes(surface.kind)
        ? "candidate_action_canary"
        : "not_qualified_for_current_build",
      operations: canaryKinds.includes(surface.kind) ? surface.operations : []
    }));
    canaryOnlyCapabilities.inspections = {
      ...canaryOnlyCapabilities.inspections,
      status: "disabled_for_current_build",
      implemented_kinds: []
    };
    const eventState = {
      ...structuredClone(EVENT_OPTION_STATE),
      game: canaryOnlyCapabilities.game,
      visibility: {
        ...RUN_VISIBILITY,
        available_inspections: [],
        linked_detail_kinds: []
      },
      inspection_catalog: [],
      diagnostics: []
    };

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: eventState, capabilities: canaryOnlyCapabilities }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "event" },
      surface: { kind: "event_option" }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({ kind: "proceed_event" })
    ]);

    const acquisitionState = {
      ...structuredClone(EVENT_CARD_ACQUISITION_STATE),
      game: canaryOnlyCapabilities.game,
      visibility: {
        ...RUN_VISIBILITY,
        available_inspections: [],
        linked_detail_kinds: []
      },
      inspection_catalog: [],
      diagnostics: []
    };
    const acquisition = normalizeCurrentState(
      wrapBridgeV2State({ state: acquisitionState, capabilities: canaryOnlyCapabilities }),
      TEST_SOURCE
    );
    expect(acquisition.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "event" },
      surface: { kind: "event_card_acquisition" }
    });
    expect(buildAllowedActions(acquisition.currentState, acquisition.stateHash)).toEqual([
      expect.objectContaining({ kind: "select_event_card_acquisition" })
    ]);

    const mapState = {
      ...structuredClone(MAP_NAVIGATION_STATE),
      game: canaryOnlyCapabilities.game,
      visibility: {
        ...RUN_VISIBILITY,
        available_inspections: [],
        linked_detail_kinds: []
      },
      inspection_catalog: [],
      diagnostics: []
    };
    const map = normalizeCurrentState(
      wrapBridgeV2State({ state: mapState, capabilities: canaryOnlyCapabilities }),
      TEST_SOURCE
    );
    expect(map.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "map" },
      surface: { kind: "map_navigation" }
    });
    expect(buildAllowedActions(map.currentState, map.stateHash)).toHaveLength(2);

    const nonCanaryState = {
      ...structuredClone(DECK_REMOVAL_STATE),
      game: canaryOnlyCapabilities.game,
      visibility: {
        ...RUN_VISIBILITY,
        available_inspections: [],
        linked_detail_kinds: []
      },
      inspection_catalog: [],
      diagnostics: []
    };
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: nonCanaryState, capabilities: canaryOnlyCapabilities }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");

    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    });
    (adapter as unknown as { capabilitiesPayload: { data: typeof canaryOnlyCapabilities } }).capabilitiesPayload = {
      data: canaryOnlyCapabilities
    };
    expect(adapter.describe().negotiated).toMatchObject({
      action_execution_allowed: true,
      inspection_allowed: false,
      action_execution_surface_kinds: [],
      action_canary_surface_kinds: ["event_option", "event_card_acquisition", "map_navigation"],
      qualified_scoped_surfaces: [],
      candidate_action_canary_surfaces: ["event_option", "event_card_acquisition", "map_navigation"]
    });
  });

  it("strictly decodes event and combat contracts and rejects context/surface mismatch", () => {
    expect(decodeBridgeV2State(EVENT_DIALOGUE_STATE).data.surface.kind).toBe("event_dialogue");
    expect(decodeBridgeV2State(EVENT_OPTION_STATE).data.context.kind).toBe("event");
    expect(decodeBridgeV2State(COMBAT_TURN_STATE).data.surface.kind).toBe("combat_turn");
    expect(() => decodeBridgeV2State({ ...EVENT_OPTION_STATE, context: COMBAT_TURN_STATE.context })).toThrow(
      "event_option surface requires event context"
    );
  });

  it("projects only the revealed dialogue prefix and binds advance to the current line", () => {
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(EVENT_DIALOGUE_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      actionAuthority: "bridge_advertised",
      context: { kind: "event", ancient: true, inDialogue: true },
      surface: {
        kind: "event_dialogue",
        currentLineIndex: 1,
        revealedLines: [
          { entityId: "dialogue-line-0", index: 0, isCurrent: false },
          { entityId: "dialogue-line-1", index: 1, isCurrent: true }
        ]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({
        id: "action-dialogue-1",
        entityBindings: [{ role: "dialogue_line", entityId: "dialogue-line-1" }],
        action: expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "advance_event_dialogue" })
      })
    ]);
  });

  it("fails closed for a non-contiguous dialogue prefix or an advance bound to stale dialogue", () => {
    const skippedLine = structuredClone(EVENT_DIALOGUE_STATE);
    skippedLine.surface.revealed_lines[1]!.index = 2;
    skippedLine.surface.current_line_index = 2;
    const skippedEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: skippedLine, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(skippedEnvelope.currentState.stability).toBe("invalid");
    expect(skippedEnvelope.currentState.actionAuthority).toBe("none");

    const staleBinding = structuredClone(EVENT_DIALOGUE_STATE);
    staleBinding.legal_actions[0]!.entity_bindings[0]!.entity_id = "dialogue-line-0";
    const staleEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: staleBinding, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(staleEnvelope.currentState.stability).toBe("invalid");
    expect(staleEnvelope.currentState.actionAuthority).toBe("none");
  });

  it("projects exact rest options and keeps option choice separate from proceed", () => {
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(REST_SITE_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      actionAuthority: "bridge_advertised",
      context: { kind: "rest" },
      surface: {
        kind: "rest_site",
        canProceed: false,
        options: [
          { entityId: "rest-option-heal", optionId: "HEAL", enabled: true },
          { entityId: "rest-option-smith", optionId: "SMITH", enabled: true }
        ]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({ id: "action-rest-heal", entityBindings: [{ role: "rest_option", entityId: "rest-option-heal" }] }),
      expect.objectContaining({ id: "action-rest-smith", entityBindings: [{ role: "rest_option", entityId: "rest-option-smith" }] })
    ]);
  });

  it("fails closed when a rest action binds a disabled option", () => {
    const state = structuredClone(REST_SITE_STATE);
    state.surface.options[0]!.enabled = false;
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
  });

  it("accepts rest proceed bound to the visible surface screen and rejects an unknown screen", () => {
    const state = structuredClone(REST_SITE_STATE);
    state.surface.options = [];
    state.surface.can_proceed = true;
    state.legal_actions = [{
      action_id: "action-rest-proceed",
      state_id: "state-rest-1",
      kind: "proceed_rest_site",
      category: "navigation",
      label: "Proceed to map",
      authority: "game_ui",
      evidence_code: "NRestSiteRoom.ProceedButton+NMapScreen.Open",
      entity_bindings: [{ role: "screen", entity_id: "rest-screen-1" }]
    }];

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      surface: { kind: "rest_site", canProceed: true }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({
        id: "action-rest-proceed",
        entityBindings: [{ role: "screen", entityId: "rest-screen-1" }]
      })
    ]);

    state.legal_actions[0]!.entity_bindings[0]!.entity_id = "missing-rest-screen";
    const invalidEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(invalidEnvelope.currentState.stability).toBe("invalid");
    expect(invalidEnvelope.currentState.actionAuthority).toBe("none");
  });

  it("projects exact shop inventory semantics without conflating affordability and action authority", () => {
    expect(decodeBridgeV2State(SHOP_INVENTORY_STATE).data.context.kind).toBe("shop");
    expect(decodeBridgeV2State(SHOP_INVENTORY_STATE).data.surface.kind).toBe("shop_inventory");
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(SHOP_INVENTORY_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );

    expect(envelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: {
        kind: "shop",
        gold: 26,
        maxPotionSlots: 2,
        potions: [{ slot: 0 }, { slot: 1 }]
      },
      surface: {
        kind: "shop_inventory",
        cards: [
          { entityId: "shop-offer-card-armaments", onSale: true, affordable: true, canPurchase: true },
          { entityId: "shop-offer-card-sold", stocked: false, canPurchase: false, blockedReason: "sold_out" }
        ],
        potions: [{ affordable: true, canPurchase: false, blockedReason: "potion_slots_full" }],
        cardRemoval: { affordable: false, canPurchase: false, blockedReason: "insufficient_gold" },
        canClose: true
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({
        id: "action-shop-buy-armaments",
        entityBindings: [{ role: "shop_offer", entityId: "shop-offer-card-armaments" }],
        action: expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "purchase_shop_card" })
      }),
      expect.objectContaining({
        id: "action-shop-close",
        entityBindings: [{ role: "screen", entityId: "shop-inventory-screen-1" }],
        action: expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "close_shop_inventory" })
      })
    ]);
  });

  it("accepts omitted nullable shop product fields from the Bridge wire format", () => {
    const state = structuredClone(SHOP_INVENTORY_STATE);
    Reflect.deleteProperty(state.surface.cards[1]!, "card");
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({
      stability: "actionable",
      surface: {
        kind: "shop_inventory",
        cards: [
          expect.objectContaining({ entityId: "shop-offer-card-armaments", canPurchase: true }),
          expect.objectContaining({ entityId: "shop-offer-card-sold", stocked: false, blockedReason: "sold_out" })
        ]
      }
    });
  });

  it("keeps closed shop room controls separate from inventory offers", () => {
    expect(decodeBridgeV2State(SHOP_ROOM_STATE).data.surface.kind).toBe("shop_room");
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(SHOP_ROOM_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "shop", gold: 26 },
      surface: { kind: "shop_room", canOpenInventory: true, canProceed: true }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.action)).toEqual([
      expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "open_shop_inventory" }),
      expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "proceed_shop" })
    ]);
  });

  it("projects a state-bound shop catalog inspection without creating purchase authority", () => {
    const capabilities = structuredClone(CAPABILITIES);
    const state = structuredClone(SHOP_ROOM_STATE);
    state.inspection_catalog.push({
      kind: "shop_catalog",
      scope: "current_shop",
      availability: "canary",
      visibility_basis: "player_openable_current_merchant_inventory",
      state_bound: true,
      creates_action_authority: false,
      ordering_semantics: "fixed_ui_slots",
      estimated_cost: "low",
      recommended_for: ["shop_planning", "leave_shop_decision"],
      hidden_by_policy: []
    });
    state.visibility.available_inspections.push("shop_catalog");
    const inspection = shopCatalogInspection(state.state_id);
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({
        state,
        capabilities,
        inspections: { shop_catalog: inspection }
      }),
      TEST_SOURCE
    );

    expect(envelope.currentState).toMatchObject({
      actionAuthority: "bridge_advertised",
      surface: { kind: "shop_room" },
      bridgeInspectionFacts: {
        shopCatalog: {
          accessState: "inventory_closed_open_to_inspect",
          cards: [
            expect.objectContaining({
              entityId: "shop-offer-card-armaments",
              stocked: true,
              affordable: true,
              canPurchase: false,
              blockedReason: "not_visible"
            }),
            expect.objectContaining({ entityId: "shop-offer-card-sold", stocked: false })
          ],
          cardRemoval: expect.objectContaining({ blockedReason: "not_visible" })
        }
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.kind)).toEqual([
      "open_shop_inventory",
      "proceed_shop"
    ]);
    expect(envelope.currentState.bridgeInspections).toEqual([
      expect.objectContaining({ kind: "shop_catalog", orderingSemantics: "fixed_ui_slots" })
    ]);
  });

  it("fails closed for impossible shop capacity, blocked-offer actions, and universal purchase kinds", () => {
    const fullBeltPurchase = structuredClone(SHOP_INVENTORY_STATE);
    fullBeltPurchase.surface.potions[0]!.can_purchase = true;
    fullBeltPurchase.surface.potions[0]!.blocked_reason = null;
    fullBeltPurchase.legal_actions.push({
      action_id: "action-shop-buy-potion",
      state_id: "state-shop-inventory-1",
      kind: "purchase_shop_potion",
      category: "purchase",
      label: "Buy Block Potion",
      authority: "game_ui",
      evidence_code: "MerchantPotionEntry.OnTryPurchaseWrapper",
      entity_bindings: [{ role: "shop_offer", entity_id: "shop-offer-potion-1" }]
    });
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: fullBeltPurchase, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });

    const blockedRemovalAction = structuredClone(SHOP_INVENTORY_STATE);
    blockedRemovalAction.legal_actions.push({
      action_id: "action-shop-remove-card",
      state_id: "state-shop-inventory-1",
      kind: "open_shop_card_removal",
      category: "purchase",
      label: "Remove a card",
      authority: "game_ui",
      evidence_code: "MerchantCardRemovalEntry.OnTryPurchaseWrapper",
      entity_bindings: [{ role: "shop_card_removal", entity_id: "shop-card-removal-1" }]
    });
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: blockedRemovalAction, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });

    const universalPurchase = structuredClone(SHOP_INVENTORY_STATE);
    universalPurchase.legal_actions[0]!.kind = "purchase_shop_item";
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: universalPurchase, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });

    const falseAffordability = structuredClone(SHOP_INVENTORY_STATE);
    falseAffordability.surface.relics[0]!.affordable = true;
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: falseAffordability, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });

    const missingBlockedReason = structuredClone(SHOP_INVENTORY_STATE);
    Reflect.deleteProperty(missingBlockedReason.surface.card_removal, "blocked_reason");
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: missingBlockedReason, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });
  });

  it("rejects shop surfaces with the wrong context or purchase authority in the closed room", () => {
    expect(() => decodeBridgeV2State({ ...SHOP_INVENTORY_STATE, context: { kind: "rest" } })).toThrow(
      "shop_inventory surface requires shop context"
    );
    const roomWithPurchase = structuredClone(SHOP_ROOM_STATE);
    roomWithPurchase.legal_actions.push({
      action_id: "action-shop-room-buy",
      state_id: "state-shop-room-1",
      kind: "purchase_shop_card",
      category: "purchase",
      label: "Buy hidden card",
      authority: "game_ui",
      evidence_code: "invalid-test",
      entity_bindings: [{ role: "room", entity_id: "shop-room-1" }]
    });
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: roomWithPurchase, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });
  });

  it("projects exact map topology separately from current opaque route choices", () => {
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(MAP_NAVIGATION_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );

    expect(envelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      actionAuthority: "bridge_advertised",
      context: {
        kind: "map",
        currentPosition: { col: 3, row: 0, type: "ancient" }
      },
      surface: {
        kind: "map_navigation",
        travelEnabled: true,
        traveling: false,
        drawingMode: "none",
        nextOptions: [
          { entityId: "map-node-left", state: "travelable", leadsTo: [{ col: 1, row: 2, type: "unknown" }] },
          { entityId: "map-node-right", state: "travelable", leadsTo: [{ col: 4, row: 2, type: "monster" }] }
        ]
      }
    });
    if (envelope.currentState.context.kind !== "map") throw new Error("unexpected context");
    expect(envelope.currentState.context.nodes.find((node) => node.entityId === "map-node-start")).toMatchObject({
      children: [{ col: 2, row: 1 }, { col: 5, row: 1 }]
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({
        id: "action-map-left",
        entityBindings: [{ role: "map_node", entityId: "map-node-left" }],
        action: expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "choose_map_node" })
      }),
      expect.objectContaining({
        id: "action-map-right",
        entityBindings: [{ role: "map_node", entityId: "map-node-right" }]
      })
    ]);
  });

  it("accepts an omitted nullable map position during a valid map transition", () => {
    const state = structuredClone(MAP_NAVIGATION_STATE);
    Reflect.deleteProperty(state.context, "current_position");
    state.readiness = "settling";
    state.surface.travel_enabled = false;
    state.surface.next_options = [];
    state.legal_actions = [];
    state.completeness.legal_actions = "temporarily_empty_while_map_input_is_not_route_ready";

    const decoded = decodeBridgeV2State(state).data;
    expect(decoded.context).toMatchObject({ kind: "map" });
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      stability: "settling",
      actionAuthority: "bridge_advertised",
      context: { kind: "map" },
      surface: { kind: "map_navigation", travelEnabled: false, nextOptions: [] }
    });
    if (envelope.currentState.context.kind !== "map") throw new Error("unexpected context");
    expect(envelope.currentState.context.currentPosition).toBeUndefined();
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("fails closed when a map action is not a current visible travel choice", () => {
    const hiddenChoice = structuredClone(MAP_NAVIGATION_STATE);
    hiddenChoice.legal_actions[0]!.entity_bindings[0]!.entity_id = "map-node-right-next";
    const hiddenEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: hiddenChoice, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(hiddenEnvelope.currentState.stability).toBe("invalid");
    expect(hiddenEnvelope.currentState.actionAuthority).toBe("none");

    const drawing = structuredClone(MAP_NAVIGATION_STATE);
    drawing.surface.drawing_mode = "drawing";
    const drawingEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: drawing, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(drawingEnvelope.currentState.stability).toBe("invalid");
    expect(drawingEnvelope.currentState.actionAuthority).toBe("none");
  });

  it("requires action entity bindings to resolve inside visible context or surface evidence", () => {
    const unresolved = structuredClone(COMBAT_TURN_STATE);
    unresolved.legal_actions[0]!.entity_bindings[1]!.entity_id = "enemy-hidden";

    expect(() => decodeBridgeV2State(unresolved)).toThrow(
      "absent from the visible context and surface"
    );
  });

  it("strictly decodes card reward cards and separately labeled alternatives", () => {
    expect(decodeBridgeV2State(CARD_REWARD_STATE).data.context.kind).toBe("reward_flow");
    expect(decodeBridgeV2State(CARD_REWARD_STATE).data.surface.kind).toBe("card_reward_selection");
    expect(() => decodeBridgeV2State({ ...CARD_REWARD_STATE, context: COMBAT_TURN_STATE.context })).toThrow(
      "card_reward_selection surface requires reward_flow context"
    );

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(CARD_REWARD_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      actionAuthority: "bridge_advertised",
      context: { kind: "reward_flow", rewardKind: "card_reward" },
      surface: { kind: "card_reward_selection", alternatives: [{ label: "Reroll" }, { label: "Sacrifice" }] },
      bridgeInspectionPolicy: {
        status: "implemented_read_only",
        implementedKinds: ["run_deck", "combat_piles", "shop_catalog"]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.id)).toEqual([
      "action-card-reward-card-1",
      "action-card-reward-alt-1"
    ]);
  });

  it("keeps outer room rewards separate from card reward selection and imports only opaque claims", () => {
    expect(decodeBridgeV2State(REWARD_CLAIM_STATE).data.surface.kind).toBe("reward_claim");
    expect(() => decodeBridgeV2State({
      ...REWARD_CLAIM_STATE,
      context: { kind: "reward_flow", reward_kind: "card_reward" }
    })).toThrow("reward_claim surface requires room_rewards reward_flow context");

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(REWARD_CLAIM_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      actionAuthority: "bridge_advertised",
      context: { kind: "reward_flow", rewardKind: "room_rewards" },
      surface: { kind: "reward_claim", rewards: [{ kind: "gold", label: "25 Gold" }], proceedSkipsRemainingRewards: true }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.id)).toEqual([
      "action-reward-claim-1",
      "action-reward-proceed-1"
    ]);
  });

  it("suppresses an unclaimable full-belt potion reward and exposes exact discard operands", () => {
    expect(decodeBridgeV2State(FULL_POTION_REWARD_CLAIM_STATE).data.surface.kind).toBe("reward_claim");

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({
        state: structuredClone(FULL_POTION_REWARD_CLAIM_STATE),
        capabilities: structuredClone(CAPABILITIES)
      }),
      TEST_SOURCE
    );

    expect(envelope.currentState).toMatchObject({
      actionAuthority: "bridge_advertised",
      surface: {
        kind: "reward_claim",
        potionSlotsFull: true,
        rewards: [{ kind: "potion", enabled: false }],
        discardablePotions: [
          { entityId: "potion-power-1", id: "POWER_POTION", slot: 0 },
          { entityId: "potion-glowwater-1", id: "GLOWWATER_POTION", slot: 1 }
        ]
      }
    });
    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    expect(actions.map((action) => action.action.kind === "bridge_v2_action"
      ? action.action.bridgeActionKind
      : action.action.kind)).toEqual([
      "discard_potion_for_reward",
      "discard_potion_for_reward",
      "proceed_rewards"
    ]);
    expect(actions.some((action) => action.id.includes("claim"))).toBe(false);
    expect(actions[0]).toMatchObject({
      entityBindings: [{ role: "potion", entityId: "potion-power-1" }]
    });
  });

  it("fails closed when reward capacity evidence and advertised actions disagree", () => {
    const discardWithoutFullBelt = structuredClone(FULL_POTION_REWARD_CLAIM_STATE);
    discardWithoutFullBelt.surface.potion_slots_full = false;
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: discardWithoutFullBelt, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });

    const claimDisabledReward = structuredClone(FULL_POTION_REWARD_CLAIM_STATE);
    claimDisabledReward.legal_actions.unshift({
      action_id: "action-invalid-potion-claim",
      state_id: claimDisabledReward.state_id,
      kind: "claim_reward",
      category: "claim",
      label: "Claim Skill Potion",
      authority: "game_ui",
      evidence_code: "NRewardButton.Reward+NRewardButton.ForceClick",
      entity_bindings: [{ role: "reward", entity_id: "reward-potion-1" }]
    });
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: claimDisabledReward, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });
  });

  it("preserves informational diagnostics but fails closed on contradictory action suppression", () => {
    const informational = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(DECK_ENCHANT_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(informational.currentState.bridgeDiagnostics).toEqual([
      expect.objectContaining({ code: "bridge.inspection.read_only_enabled", effect: "none", source: "capabilities" })
    ]);
    expect(informational.currentState.actionAuthority).toBe("bridge_advertised");

    const contradictory = structuredClone(DECK_ENCHANT_STATE) as unknown as JsonObject;
    contradictory.diagnostics = [{
      code: "bridge.action.blocked",
      severity: "error",
      category: "action",
      effect: "actions_suppressed",
      recoverability: "settle",
      required_for_action: true
    }];
    const blocked = normalizeCurrentState(
      wrapBridgeV2State({ state: contradictory, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(blocked.currentState.actionAuthority).toBe("none");
    expect(blocked.currentState.stability).toBe("invalid");

    const contradictoryCapabilities = structuredClone(CAPABILITIES) as unknown as JsonObject;
    contradictoryCapabilities.diagnostics = [{
      code: "bridge.capability.action.blocked",
      severity: "error",
      category: "action",
      effect: "actions_suppressed",
      recoverability: "update_bridge",
      required_for_action: true
    }];
    const capabilityBlocked = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(DECK_ENCHANT_STATE), capabilities: contradictoryCapabilities }),
      TEST_SOURCE
    );
    expect(capabilityBlocked.currentState.actionAuthority).toBe("none");
    expect(capabilityBlocked.currentState.stability).toBe("invalid");
  });

  it("rejects unsafe inspection capability expansion", () => {
    const expandedCapabilities = structuredClone(CAPABILITIES) as unknown as JsonObject;
    const inspections = expandedCapabilities.inspections as JsonObject;
    inspections.arbitrary_queries_allowed = true;

    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(DECK_ENCHANT_STATE), capabilities: expandedCapabilities }),
      TEST_SOURCE
    );

    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(envelope.currentState.stability).toBe("invalid");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("rejects incoherent observation bundles before normalization", () => {
    const valid = coherentObservationBundle(DECK_ENCHANT_STATE);
    expect(decodeBridgeV2ObservationBundle(valid).data).toMatchObject({
      coherent: true,
      state: { state_id: DECK_ENCHANT_STATE.state_id },
      inspections: { run_deck: { observed_state_id: DECK_ENCHANT_STATE.state_id } }
    });

    const staleInspection = structuredClone(valid);
    staleInspection.inspections.run_deck!.observed_state_id = "state-stale";
    expect(() => decodeBridgeV2ObservationBundle(staleInspection)).toThrow("is not coherent with its state");

    const mismatchedIdentity = structuredClone(valid);
    mismatchedIdentity.bridge = {
      ...mismatchedIdentity.bridge,
      runtime_instance_id: "different-runtime"
    };
    expect(() => decodeBridgeV2ObservationBundle(mismatchedIdentity)).toThrow("identity does not match");
  });

  it("projects state-bound run-deck and combat-pile evidence without granting action authority", () => {
    const deckInspection = runDeckInspection(COMBAT_TURN_STATE.state_id);
    const pileInspection = combatPilesInspection(COMBAT_TURN_STATE.state_id);
    expect(decodeBridgeV2Inspection(deckInspection).data.content.kind).toBe("run_deck");
    expect(decodeBridgeV2Inspection(pileInspection).data.content.kind).toBe("combat_piles");

    const wrapped = wrapBridgeV2State({
      state: structuredClone(COMBAT_TURN_STATE),
      capabilities: structuredClone(CAPABILITIES),
      observation: {
        observation_id: "observation-combat-1",
        coherent: true,
        state_id: COMBAT_TURN_STATE.state_id,
        inspection_kinds: ["run_deck", "combat_piles"]
      },
      inspections: {
        run_deck: structuredClone(deckInspection),
        combat_piles: structuredClone(pileInspection)
      }
    });
    const envelope = normalizeCurrentState(wrapped, TEST_SOURCE);

    expect(envelope.currentState.actionAuthority).toBe("bridge_advertised");
    expect(envelope.currentState.player?.runDeck).toEqual([
      expect.objectContaining({
        entityId: "deck-card-1",
        id: "STRIKE",
        existingEnchantment: expect.objectContaining({ definitionId: "SLITHER" })
      })
    ]);
    expect(envelope.currentState.player?.drawPile).toEqual([
      expect.objectContaining({ entityId: "draw-card-1", id: "STRIKE" })
    ]);
    expect(envelope.currentState.player?.discardPile).toEqual([
      expect.objectContaining({ entityId: "discard-card-1", id: "DEFEND" })
    ]);
    expect(envelope.currentState.player?.exhaustPile).toEqual([]);
    expect(envelope.currentState.bridgeInspections).toEqual([
      expect.objectContaining({ kind: "run_deck", orderingSemantics: "unordered_multiset", missing: [] }),
      expect.objectContaining({
        kind: "combat_piles",
        orderingSemantics: "unordered_multiset",
        missing: ["draw_pile_order_hidden_by_policy"]
      })
    ]);
    expect(envelope.currentState.bridgeObservation).toEqual({
      observationId: "observation-combat-1",
      coherent: true,
      stateId: COMBAT_TURN_STATE.state_id,
      inspectionKinds: ["run_deck", "combat_piles"]
    });
    expect(envelope.currentState.bridgeVisibility).toMatchObject({
      profileId: "combat.combat_turn.v1",
      playerVisibleClosureStatus: "partial_catalog",
      availableInspections: ["run_deck", "combat_piles"]
    });
    expect(envelope.currentState.bridgeInspectionCatalog).toEqual([
      expect.objectContaining({ kind: "run_deck", createsActionAuthority: false }),
      expect.objectContaining({ kind: "combat_piles", createsActionAuthority: false })
    ]);
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.id)).toEqual([
      "action-combat-play-1",
      "action-combat-end-1"
    ]);
  });

  it("includes inspection evidence in stale-state identity and fails closed on inspection drift", () => {
    const firstInspection = runDeckInspection(DECK_ENCHANT_STATE.state_id);
    const laterEquivalentInspection = {
      ...runDeckInspection(DECK_ENCHANT_STATE.state_id),
      observed_at: "2026-07-16T00:00:09Z"
    };
    const secondInspection = runDeckInspection(DECK_ENCHANT_STATE.state_id, [
      visibleInspectionCard({ entity_id: "deck-card-2", definition_id: "DEFEND", name: "Defend", type: "Skill" })
    ]);
    const first = normalizeCurrentState(
      wrapBridgeV2State({
        state: structuredClone(DECK_ENCHANT_STATE),
        capabilities: structuredClone(CAPABILITIES),
        inspections: { run_deck: firstInspection }
      }),
      TEST_SOURCE
    );
    const second = normalizeCurrentState(
      wrapBridgeV2State({
        state: structuredClone(DECK_ENCHANT_STATE),
        capabilities: structuredClone(CAPABILITIES),
        inspections: { run_deck: secondInspection }
      }),
      TEST_SOURCE
    );
    const laterEquivalent = normalizeCurrentState(
      wrapBridgeV2State({
        state: structuredClone(DECK_ENCHANT_STATE),
        capabilities: structuredClone(CAPABILITIES),
        inspections: { run_deck: laterEquivalentInspection }
      }),
      TEST_SOURCE
    );
    expect(first.stateHash).toBe(laterEquivalent.stateHash);
    expect(first.stateHash).not.toBe(second.stateHash);

    const mismatched = runDeckInspection("state-other");
    const invalid = normalizeCurrentState(
      wrapBridgeV2State({
        state: structuredClone(DECK_ENCHANT_STATE),
        capabilities: structuredClone(CAPABILITIES),
        inspections: { run_deck: mismatched }
      }),
      TEST_SOURCE
    );
    expect(invalid.currentState.stability).toBe("invalid");
    expect(invalid.currentState.actionAuthority).toBe("none");
    expect(buildAllowedActions(invalid.currentState, invalid.stateHash)).toEqual([]);
  });

  it("preserves enchant semantics and imports only advertised opaque actions", async () => {
    const legacyState = await fixture("event") as JsonObject;
    const wrapped = wrapBridgeV2State({
      state: structuredClone(DECK_ENCHANT_STATE),
      capabilities: structuredClone(CAPABILITIES),
      legacyState
    });
    const envelope = normalizeCurrentState(wrapped, TEST_SOURCE);

    expect(envelope.currentState.context.kind).toBe("event");
    expect(envelope.currentState.actionAuthority).toBe("bridge_advertised");
    expect(envelope.currentState.surface.kind).toBe("deck_enchant_selection");
    if (envelope.currentState.surface.kind !== "deck_enchant_selection") throw new Error("unexpected surface");
    expect(envelope.currentState.surface.enchantment).toMatchObject({ definitionId: "SLITHER", name: "Slither" });
    expect(envelope.currentState.surface.cards[0]).toMatchObject({ entityId: "card-1", id: "STRIKE", selected: false });
    expect(envelope.stateHash).not.toContain(DECK_ENCHANT_STATE.observed_at);

    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    expect(actions).toEqual([expect.objectContaining({
      id: "action-test-1",
      kind: "toggle_card",
      action: {
        kind: "bridge_v2_action",
        actionId: "action-test-1",
        expectedStateId: "state-test-1",
        bridgeActionKind: "toggle_card"
      }
    })]);
  });

  it("keeps event meaning separate from its option surface and imports only event bridge actions", () => {
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(EVENT_OPTION_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      actionAuthority: "bridge_advertised",
      context: { kind: "event", eventId: "SPIRALING_WHIRLPOOL", body: "The whirlpool settles." },
      surface: { kind: "event_option", screenEntityId: "event-screen-1" }
    });
    if (envelope.currentState.surface.kind !== "event_option") throw new Error("unexpected surface");
    expect(envelope.currentState.surface.options[0]).toMatchObject({
      title: "Proceed",
      proceed: true,
      enabled: true,
      willKillPlayer: false,
      tooltips: [{ kind: "text", name: "Return", description: "Leave this event." }]
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({ id: "action-event-1", action: expect.objectContaining({ kind: "bridge_v2_action" }) })
    ]);
  });

  it("uses Bridge combat context as player-visible truth and never reconstructs combat actions locally", () => {
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(COMBAT_TURN_STATE), capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      actionAuthority: "bridge_advertised",
      context: { kind: "combat", encounterType: "elite", round: 2, enemies: [{ entityId: "enemy-1" }] },
      player: {
        character: "Ironclad",
        energy: 3,
        hand: [{ entityId: "combat-card-1", canPlay: true }],
        companions: [{ entityId: "companion-osty-1", id: "OSTY", hp: 4, maxHp: 6, isAlive: true }]
      },
      surface: { kind: "combat_turn", roomEntityId: "combat-room-1", canEndTurn: true }
    });
    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    expect(actions.map((action) => action.id)).toEqual(["action-combat-play-1", "action-combat-end-1"]);
    expect(actions.every((action) => action.action.kind === "bridge_v2_action")).toBe(true);
  });

  it("keeps hidden companion health absent and fails closed on contradictory health visibility", () => {
    const hiddenHealth = structuredClone(COMBAT_TURN_STATE);
    hiddenHealth.context.player.companions[0] = {
      ...hiddenHealth.context.player.companions[0]!,
      is_alive: false,
      health_bar_visible: false,
      hp: null,
      max_hp: null,
      block: 0,
      statuses: []
    };
    const hiddenEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: hiddenHealth, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(hiddenEnvelope.currentState.stability).toBe("actionable");
    expect(hiddenEnvelope.currentState.player?.companions[0]).toEqual(expect.objectContaining({
      id: "OSTY",
      isAlive: false,
      healthBarVisible: false
    }));
    expect(hiddenEnvelope.currentState.player?.companions[0]).not.toHaveProperty("hp");
    expect(hiddenEnvelope.currentState.player?.companions[0]).not.toHaveProperty("maxHp");

    const contradictory = structuredClone(hiddenHealth);
    contradictory.context.player.companions[0]!.hp = 0;
    contradictory.context.player.companions[0]!.max_hp = 6;
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: contradictory, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");
  });

  it("keeps combat context while projecting an exact combat-pile selection overlay", () => {
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({
        state: structuredClone(COMBAT_PILE_CARD_SELECTION_STATE),
        capabilities: structuredClone(CAPABILITIES)
      }),
      TEST_SOURCE
    );

    expect(envelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      actionAuthority: "bridge_advertised",
      context: { kind: "combat", encounterType: "elite" },
      surface: {
        kind: "combat_pile_card_selection",
        purpose: "move_one_discard_card_to_draw_top",
        sourceKind: "headbutt",
        sourceCardDefinitionId: "HEADBUTT",
        pileType: "discard",
        destinationPile: "draw",
        destinationPosition: "top",
        minimumSelections: 1,
        maximumSelections: 1,
        selectedCount: 0,
        requireManualConfirmation: false,
        cards: [
          { entityId: "discard-card-1", name: "Ball Lightning" },
          { entityId: "discard-card-2", name: "Ball Lightning" }
        ]
      }
    });
    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    expect(actions).toEqual([
      expect.objectContaining({
        id: "action-combat-pile-card-2",
        entityBindings: [{ role: "card", entityId: "discard-card-2" }],
        action: expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "select_discard_card_for_draw_top" })
      })
    ]);

    const graveblastState = structuredClone(COMBAT_PILE_CARD_SELECTION_STATE);
    graveblastState.state_id = "state-graveblast-pile-select-1";
    graveblastState.surface = {
      ...graveblastState.surface,
      prompt: "Choose a card to put back in your Hand.",
      purpose: "move_one_discard_card_to_hand",
      source_kind: "graveblast",
      source_card_entity_id: "combat-card-graveblast",
      source_card_definition_id: "GRAVEBLAST",
      destination_pile: "hand",
      destination_position: "bottom",
      overflow_destination: "discard_if_hand_full"
    } as typeof graveblastState.surface;
    graveblastState.legal_actions = [{
      ...graveblastState.legal_actions[0]!,
      action_id: "action-graveblast-discard-card-2",
      state_id: graveblastState.state_id,
      kind: "select_discard_card_for_hand",
      label: "Put Ball Lightning back in your Hand",
      evidence_code: "Graveblast.OnPlay+NCardGrid.HolderPressed+CardPileCmd.Add(Hand)+exact-card-witness"
    }];
    graveblastState.completeness.player_visible_semantics = "contract_complete_for_graveblast_discard_to_hand_selection";

    const graveblastEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: graveblastState, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(graveblastEnvelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      actionAuthority: "bridge_advertised",
      context: { kind: "combat" },
      surface: {
        kind: "combat_pile_card_selection",
        purpose: "move_one_discard_card_to_hand",
        sourceKind: "graveblast",
        sourceCardDefinitionId: "GRAVEBLAST",
        destinationPile: "hand",
        destinationPosition: "bottom",
        overflowDestination: "discard_if_hand_full"
      }
    });
    expect(buildAllowedActions(graveblastEnvelope.currentState, graveblastEnvelope.stateHash)).toEqual([
      expect.objectContaining({
        id: "action-graveblast-discard-card-2",
        action: expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "select_discard_card_for_hand" })
      })
    ]);
  });

  it("rejects a combat-pile selection without combat context or consistent selected-card evidence", () => {
    const wrongContext = structuredClone(COMBAT_PILE_CARD_SELECTION_STATE);
    (wrongContext as { context: unknown }).context = structuredClone(DECK_ENCHANT_STATE.context);
    expect(() => decodeBridgeV2State(wrongContext)).toThrow(
      "requires combat context"
    );

    const inconsistentSelection = structuredClone(COMBAT_PILE_CARD_SELECTION_STATE);
    inconsistentSelection.surface.selected_count = 1;
    (inconsistentSelection.surface.selected_card_entity_ids as string[]).push("discard-card-1");
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: inconsistentSelection, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");

    const wrongSource = structuredClone(COMBAT_PILE_CARD_SELECTION_STATE);
    (wrongSource.surface as { source_kind: string }).source_kind = "hologram";
    expect(() => decodeBridgeV2State(wrongSource)).toThrow();

    const contradictoryKnownSource = structuredClone(COMBAT_PILE_CARD_SELECTION_STATE);
    (contradictoryKnownSource.surface as { source_kind: string }).source_kind = "graveblast";
    expect(() => decodeBridgeV2State(contradictoryKnownSource)).toThrow();
  });

  it("preserves selected instance identity and replacement actions for combat-hand selection", () => {
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({
        state: structuredClone(COMBAT_HAND_CARD_SELECTION_STATE),
        capabilities: structuredClone(CAPABILITIES)
      }),
      TEST_SOURCE
    );

    expect(envelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      actionAuthority: "bridge_advertised",
      context: { kind: "combat" },
      surface: {
        kind: "combat_hand_card_selection",
        selectionMode: "upgrade_select",
        minimumSelections: 1,
        maximumSelections: 1,
        selectedCount: 1,
        selectedCardEntityIds: ["combat-card-1"],
        isPeeking: false,
        cards: [
          { entityId: "combat-card-2", selected: false },
          { entityId: "combat-card-1", selected: true }
        ]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({
        id: "action-combat-hand-card-2",
        entityBindings: [{ role: "card", entityId: "combat-card-2" }],
        action: expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "select_combat_hand_card" })
      }),
      expect.objectContaining({
        id: "action-combat-hand-confirm",
        action: expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "confirm_combat_hand_selection" })
      })
    ]);
  });

  it("fails closed on inconsistent combat-hand selection membership or peek actions", () => {
    const inconsistent = structuredClone(COMBAT_HAND_CARD_SELECTION_STATE);
    inconsistent.surface.cards[1]!.is_selected = false;
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: inconsistent, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");

    const peeking = structuredClone(COMBAT_HAND_CARD_SELECTION_STATE);
    peeking.surface.is_peeking = true;
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: peeking, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState.stability).toBe("invalid");
  });

  it("keeps source-bound generated run-card acquisition separate from combat generators and rewards", () => {
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({
        state: structuredClone(GENERATED_CARD_CHOICE_STATE),
        capabilities: structuredClone(CAPABILITIES)
      }),
      TEST_SOURCE
    );

    expect(envelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      actionAuthority: "bridge_advertised",
      context: { kind: "event", eventId: "NEOW" },
      surface: {
        kind: "generated_card_choice",
        prompt: "Choose a Card",
        purpose: "acquire_one_generated_card",
        sourceKind: "lead_paperweight",
        destination: "run_deck",
        selectedCardCostPolicy: "unchanged",
        canSkip: true,
        isPeeking: false,
        cards: [
          { entityId: "generated-card-1", id: "PRIMAL_FORCE" },
          { entityId: "generated-card-2", id: "BURNING_PACT" }
        ]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({
        id: "action-generated-card-1",
        entityBindings: [{ role: "card", entityId: "generated-card-1" }],
        action: expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "select_generated_run_card" })
      }),
      expect.objectContaining({
        id: "action-generated-card-skip",
        action: expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "skip_generated_run_card_choice" })
      })
    ]);
  });

  it("keeps exact native generated combat-card sources source-bound and explicit", () => {
    for (const sourceKind of ["colorless_potion", "attack_potion", "skill_potion", "power_potion", "splash"] as const) {
      const state = structuredClone(GENERATED_CARD_CHOICE_STATE) as any;
      state.state_id = `state-${sourceKind}-choice-1`;
      state.context = structuredClone(COMBAT_TURN_STATE.context);
      state.surface = {
        ...state.surface,
        screen_entity_id: `${sourceKind}-choice-screen-1`,
        purpose: "choose_one_generated_combat_card",
        source_kind: sourceKind,
        destination: "combat_hand",
        selected_card_cost_policy: "free_this_turn",
        overflow_destination: "combat_discard_if_hand_full"
      };
      state.legal_actions = [
        {
          ...state.legal_actions[0],
          action_id: "action-generated-combat-card-1",
          state_id: state.state_id,
          kind: "select_generated_combat_card",
          label: "Choose Primal Force; add it to the combat hand for free this turn"
        },
        {
          ...state.legal_actions[1],
          action_id: "action-generated-combat-card-skip",
          state_id: state.state_id,
          kind: "skip_generated_combat_card_choice"
        }
      ];
      state.completeness.player_visible_semantics = `contract_complete_for_${sourceKind}_generated_combat_card_choice`;

      const envelope = normalizeCurrentState(
        wrapBridgeV2State({ state, capabilities: structuredClone(CAPABILITIES) }),
        TEST_SOURCE
      );
      expect(envelope.currentState).toMatchObject({
        normalizedSchemaVersion: 25,
        stability: "actionable",
        actionAuthority: "bridge_advertised",
        context: { kind: "combat" },
        surface: {
          kind: "generated_card_choice",
          purpose: "choose_one_generated_combat_card",
          sourceKind,
          destination: "combat_hand",
          selectedCardCostPolicy: "free_this_turn",
          overflowDestination: "combat_discard_if_hand_full"
        }
      });
      expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
        expect.objectContaining({ action: expect.objectContaining({ bridgeActionKind: "select_generated_combat_card" }) }),
        expect.objectContaining({ action: expect.objectContaining({ bridgeActionKind: "skip_generated_combat_card_choice" }) })
      ]);
    }
  });

  it("decodes an unqualified generated-card caller as observable fail-closed state", () => {
    const unavailable = structuredClone(GENERATED_CARD_CHOICE_STATE) as any;
    unavailable.readiness = "degraded";
    unavailable.surface_kind = "unsupported";
    unavailable.surface = {
      kind: "unsupported",
      source_type: "NChooseACardSelectionScreen",
      reason: "The generated-card choice has no source-qualified Lead Paperweight event context."
    };
    unavailable.authority_handoff = {
      status: "none_fail_closed",
      surface_kind: null,
      reason: "Generated-card source or completion semantics are not exact."
    };
    unavailable.legal_actions = [];
    unavailable.completeness = {
      player_visible_semantics: "degraded",
      legal_actions: "empty_fail_closed",
      sources: ["NChooseACardSelectionScreen exact-version mechanics"],
      missing: ["generated_choice_source", "legal_actions"]
    };
    unavailable.diagnostics = [{
      code: "bridge.surface.generated_card_choice.binding_unavailable",
      severity: "error",
      category: "surface",
      effect: "actions_suppressed",
      recoverability: "update_bridge",
      safe_detail: unavailable.surface.reason
    }];

    expect(decodeBridgeV2State(unavailable).data).toMatchObject({
      readiness: "degraded",
      surface: { kind: "unsupported", source_type: "NChooseACardSelectionScreen" },
      authority_handoff: { status: "none_fail_closed", surface_kind: null },
      legal_actions: []
    });
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: unavailable, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState).toMatchObject({
      stability: "unknown",
      actionAuthority: "none",
      context: { kind: "event" },
      surface: { kind: "unsupported" }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("keeps audited event acquisition separate and preserves its run-deck commit semantics", () => {
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({
        state: structuredClone(EVENT_CARD_ACQUISITION_STATE),
        capabilities: structuredClone(CAPABILITIES)
      }),
      TEST_SOURCE
    );

    expect(envelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      actionAuthority: "bridge_advertised",
      context: { kind: "event", eventId: "BRAIN_LEECH" },
      surface: {
        kind: "event_card_acquisition",
        destination: "run_deck",
        minimumSelections: 1,
        maximumSelections: 1,
        selectedCount: 0,
        cards: [
          { entityId: "event-card-1", id: "TWIN_STRIKE", selected: false },
          { entityId: "event-card-2", id: "OFFERING", selected: false }
        ]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({
        id: "action-event-card-1",
        entityBindings: [{ role: "card", entityId: "event-card-1" }],
        action: expect.objectContaining({
          kind: "bridge_v2_action",
          bridgeActionKind: "select_event_card_acquisition"
        })
      })
    ]);
  });

  it("fails closed when event acquisition selected membership is inconsistent", () => {
    const inconsistent = structuredClone(EVENT_CARD_ACQUISITION_STATE);
    inconsistent.surface.selected_count = 1;
    inconsistent.surface.selected_card_entity_ids = ["event-card-1"];
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: inconsistent, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
  });

  it("projects card bundles as atomic two-stage choices rather than independent cards", () => {
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({
        state: structuredClone(CARD_BUNDLE_SELECTION_STATE),
        capabilities: structuredClone(CAPABILITIES)
      }),
      TEST_SOURCE
    );

    expect(envelope.currentState).toMatchObject({
      normalizedSchemaVersion: 25,
      actionAuthority: "bridge_advertised",
      context: { kind: "event", eventId: "NEOW" },
      surface: {
        kind: "card_bundle_selection",
        stage: "choosing",
        bundles: [
          { entityId: "card-bundle-1", cards: [{ entityId: "bundle-card-1", id: "BLOOD_WALL" }] },
          { entityId: "card-bundle-2", cards: [{ entityId: "bundle-card-2", id: "TREMble" }] }
        ]
      }
    });
    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    expect(actions).toHaveLength(2);
    expect(actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "action-preview-bundle-1",
        entityBindings: [{ role: "bundle", entityId: "card-bundle-1" }],
        action: expect.objectContaining({ kind: "bridge_v2_action", bridgeActionKind: "preview_card_bundle" })
      })
    ]));
    expect(actions.some((action) => action.entityBindings?.some((binding) => binding.role === "card"))).toBe(false);
  });

  it("accepts only selected-bundle confirm/cancel controls during bundle preview", () => {
    const preview = structuredClone(CARD_BUNDLE_SELECTION_STATE);
    preview.surface.stage = "preview";
    (preview.surface as { selected_bundle_entity_id: string | null }).selected_bundle_entity_id = "card-bundle-1";
    preview.surface.bundles = [preview.surface.bundles[0]!];
    preview.legal_actions = [
      {
        action_id: "action-confirm-bundle-1",
        state_id: preview.state_id,
        kind: "confirm_card_bundle",
        category: "commit",
        label: "Add the previewed bundle to the run deck",
        authority: "game_ui",
        evidence_code: "NChooseABundleSelectionScreen.%Confirm+ConfirmSelection",
        entity_bindings: [{ role: "bundle", entity_id: "card-bundle-1" }]
      },
      {
        action_id: "action-cancel-bundle-1",
        state_id: preview.state_id,
        kind: "cancel_card_bundle_preview",
        category: "navigation",
        label: "Return to bundle choices",
        authority: "game_ui",
        evidence_code: "NChooseABundleSelectionScreen.%Cancel+CancelSelection",
        entity_bindings: [{ role: "bundle", entity_id: "card-bundle-1" }]
      }
    ];
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: preview, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({
      stability: "actionable",
      surface: { kind: "card_bundle_selection", stage: "preview", selectedBundleEntityId: "card-bundle-1" }
    });

    const contradictory = structuredClone(CARD_BUNDLE_SELECTION_STATE);
    (contradictory.surface as { selected_bundle_entity_id: string | null }).selected_bundle_entity_id = "card-bundle-1";
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: contradictory, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });
  });

  it("fails closed on generated-choice context, skip, binding, or peek contradictions", () => {
    const wrongContext = structuredClone(GENERATED_CARD_CHOICE_STATE);
    (wrongContext as { context: unknown }).context = structuredClone(DECK_ENCHANT_STATE.context);
    expect(() => decodeBridgeV2State(wrongContext)).toThrow(
      "Lead Paperweight generated_card_choice requires the exact NEOW event context"
    );

    const nonSkippable = structuredClone(GENERATED_CARD_CHOICE_STATE);
    nonSkippable.surface.can_skip = false;
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: nonSkippable, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });

    const wrongBinding = structuredClone(GENERATED_CARD_CHOICE_STATE);
    wrongBinding.legal_actions[0]!.entity_bindings[0]!.entity_id = "generated-card-2";
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: wrongBinding, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });

    const peeking = structuredClone(GENERATED_CARD_CHOICE_STATE);
    peeking.surface.is_peeking = true;
    expect(normalizeCurrentState(
      wrapBridgeV2State({ state: peeking, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    ).currentState).toMatchObject({ stability: "invalid", actionAuthority: "none" });
  });

  it("fails closed instead of importing an unknown advertised action kind", () => {
    const raw = structuredClone(DECK_ENCHANT_STATE);
    raw.legal_actions[0]!.kind = "invented_operation";
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: raw, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(envelope.currentState.surface.kind).toBe("unsupported");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("fails closed when state identity or advertised operations disagree", () => {
    const mismatchedIdentity = structuredClone(DECK_ENCHANT_STATE);
    mismatchedIdentity.game.commit = "different-build";
    const identityEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: mismatchedIdentity, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(identityEnvelope.currentState.stability).toBe("invalid");
    expect(buildAllowedActions(identityEnvelope.currentState, identityEnvelope.stateHash)).toEqual([]);

    const mismatchedModset = structuredClone(DECK_ENCHANT_STATE);
    mismatchedModset.game.modset.fingerprint = "different-modset";
    const modsetEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: mismatchedModset, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(modsetEnvelope.currentState.stability).toBe("invalid");
    expect(buildAllowedActions(modsetEnvelope.currentState, modsetEnvelope.stateHash)).toEqual([]);

    const capabilitiesWithoutOperation = structuredClone(CAPABILITIES);
    capabilitiesWithoutOperation.surfaces[0]!.operations = [];
    const operationEnvelope = normalizeCurrentState(
      wrapBridgeV2State({ state: structuredClone(DECK_ENCHANT_STATE), capabilities: capabilitiesWithoutOperation }),
      TEST_SOURCE
    );
    expect(operationEnvelope.currentState.stability).toBe("invalid");
    expect(buildAllowedActions(operationEnvelope.currentState, operationEnvelope.stateHash)).toEqual([]);
  });

  it("auto mode uses v2 as the single executor for a qualified surface", async () => {
    const requests: Array<{ url: string; init?: RequestInit; body?: any }> = [];
    let pollCount = 0;
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      requests.push({ url, ...(init ? { init } : {}), ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}) });
      if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
      if (url.endsWith("/api/v2/state")) return json(DECK_ENCHANT_STATE);
      if (url.endsWith("/api/v2/observation-bundles")) return json(coherentObservationBundle(DECK_ENCHANT_STATE));
      if (url.includes("/api/v2/inspections/run_deck?")) return json(runDeckInspection(DECK_ENCHANT_STATE.state_id));
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("event"));
      if (url.endsWith("/api/v2/commands") && init?.method === "POST") {
        return json(command(requests.at(-1)?.body.request_id, "started"), 202);
      }
      if (url.includes("/api/v2/commands/")) {
        pollCount += 1;
        return json(command(url.split("/").at(-1), "completed"));
      }
      throw new Error(`Unexpected request ${url}`);
    };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, fetchImpl, async () => {});

    await adapter.initialize();
    expect(adapter.describe().capabilities).toMatchObject({
      canListLegalActions: true,
      legalActionAuthority: "bridge_advertised",
      protocols: ["bridge_v2"]
    });
    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    const action = buildAllowedActions(envelope.currentState, envelope.stateHash)[0]?.action;
    if (!action) throw new Error("missing imported action");
    const result = await adapter.execute(action);

    expect(result).toMatchObject({
      accepted: true,
      outcome: "accepted",
      settlementAuthority: "adapter_confirmed",
      confirmedStateToken: "state-test-1",
      response: { status: "completed" }
    });
    expect(pollCount).toBe(1);
    expect(requests.filter((request) => request.url.endsWith("/api/v1/singleplayer") && request.init?.method === "POST")).toHaveLength(0);
    expect(requests.filter((request) => request.url.endsWith("/api/v1/singleplayer?format=json"))).toHaveLength(0);
    expect(requests.find((request) => request.url.endsWith("/api/v2/commands"))?.body).toMatchObject({
      expected_state_id: "state-test-1",
      action_id: "action-test-1"
    });
  });

  it("auto mode keeps an unsupported v2 surface fail closed without v1 fallback", async () => {
    const calls: string[] = [];
    const unsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "map", reason: "not implemented" },
      authority_handoff: {
        status: "none_fail_closed",
        surface_kind: null,
        reason: "fixture unsupported surface"
      },
      legal_actions: []
    };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
      if (url.endsWith("/api/v2/state")) return json(unsupported);
      if (url.endsWith("/api/v2/observation-bundles")) return json(coherentObservationBundle(unsupported));
      if (url.includes("/api/v2/inspections/run_deck?")) return json(runDeckInspection(unsupported.state_id));
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("map"));
      throw new Error(`Unexpected request ${url}`);
    });

    const state = await adapter.readCurrentState();
    expect(isBridgeV2WrappedState(state)).toBe(true);
    expect(calls.some((url) => url.includes("/api/v1/"))).toBe(false);
    const envelope = normalizeCurrentState(state, adapter.describe());
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(envelope.currentState.surface.kind).toBe("unsupported");
    expect(envelope.currentState.player?.runDeck).toEqual([
      expect.objectContaining({ entityId: "deck-card-1", id: "STRIKE" })
    ]);
    expect(envelope.currentState.bridgeInspections).toEqual([
      expect.objectContaining({ kind: "run_deck", expectedStateId: unsupported.state_id })
    ]);
  });

  it("treats auto as strict v2 when the Bridge endpoint is missing", async () => {
    const requests: string[] = [];
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      requests.push(url);
      if (url.endsWith("/api/v2/capabilities")) {
        return new Response('{"error":{"code":"not_found"}}', {
          status: 404,
          headers: { "content-type": "application/json" }
        });
      }
      throw new Error(`Unexpected request ${url}`);
    });

    await expect(adapter.readCurrentState()).rejects.toMatchObject({ statusCode: 404 });
    expect(requests.some((url) => url.includes("/api/v1/"))).toBe(false);
    expect(adapter.describe().capabilities.protocols).toEqual(["bridge_v2"]);
  });

  it("keeps a source-resolved but unqualified scoped surface v2-only and fail closed", async () => {
    const calls: string[] = [];
    const capabilities = structuredClone(CAPABILITIES);
    const qualifiedKinds = ["deck_removal_selection", "deck_upgrade_selection", "combat_turn"];
    const canaryKinds = ["reward_claim", "card_reward_selection", "map_navigation", "treasure_room"];
    const actionPermissionScopes = capabilities.surfaces.flatMap((surface) => {
      const tier = qualifiedKinds.includes(surface.kind)
        ? "qualified" as const
        : canaryKinds.includes(surface.kind)
          ? "canary" as const
          : null;
      return tier === null
        ? []
        : surface.operations.map((operation) => ({ surface_kind: surface.kind, operation, tier }));
    });
    capabilities.game = {
      version: "v0.109.0",
      commit: "c12f634d",
      branch: "v0.109.0",
      main_assembly_hash: -840572606,
      modset: structuredClone(CAPABILITIES.game.modset),
      compatibility: {
        status: "qualified_scoped",
        tested_game_versions: ["0.108.0", "0.109.0"],
        tested_build_fingerprints: [
          "v0.108.0|58694f64|-2044609792",
          "v0.109.0|c12f634d|-840572606"
        ],
        action_execution_allowed: true,
        state_observation_allowed: true,
        inspection_allowed: true,
        action_execution_surface_kinds: qualifiedKinds,
        action_canary_surface_kinds: canaryKinds,
        inspection_allowed_kinds: ["run_deck"],
        inspection_canary_kinds: [],
        observation_only_surface_kinds: [],
        observation_candidate_build_fingerprints: [],
        detail: "scoped exact qualification",
        action_permission_scopes: actionPermissionScopes
      }
    };
    capabilities.surfaces = capabilities.surfaces.map((surface) => ({
      ...surface,
      support: qualifiedKinds.includes(surface.kind)
        ? "qualified_exact_build"
        : canaryKinds.includes(surface.kind)
          ? "candidate_action_canary"
        : "not_qualified_for_current_build",
      operations: qualifiedKinds.includes(surface.kind) || canaryKinds.includes(surface.kind)
        ? surface.operations
        : []
    }));
    capabilities.inspections = {
      ...capabilities.inspections,
      status: "qualified_read_only_scoped",
      implemented_kinds: ["run_deck"]
    };
    const unsupported = {
      ...structuredClone(SHOP_INVENTORY_STATE),
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "NMerchantInventory", reason: "not qualified" },
      authority_handoff: {
        status: "none_fail_closed",
        surface_kind: null,
        reason: "unqualified semantic owner cannot execute"
      },
      legal_actions: [],
      game: capabilities.game,
      diagnostics: []
    };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(capabilities);
      if (url.endsWith("/api/v2/state")) return json(unsupported);
      if (url.endsWith("/api/v2/observation-bundles")) {
        return json(coherentObservationBundle(unsupported, {
          run_deck: { ...runDeckInspection(unsupported.state_id), game: capabilities.game }
        }));
      }
      if (url.includes("/api/v2/inspections/run_deck?")) {
        return json({ ...runDeckInspection(unsupported.state_id), game: capabilities.game });
      }
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("shop"));
      throw new Error(`Unexpected scoped fallback request ${url}`);
    });

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    expect(isBridgeV2WrappedState(raw)).toBe(true);
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(envelope.currentState.surface.kind).toBe("unsupported");
    expect(calls.some((url) => url.includes("/api/v1/"))).toBe(false);
    expect(adapter.describe().negotiated).toMatchObject({
      compatibility_status: "qualified_scoped",
      qualified_scoped_surfaces: ["deck_removal_selection", "deck_upgrade_selection", "combat_turn"],
      candidate_action_canary_surfaces: ["card_reward_selection", "reward_claim", "map_navigation", "treasure_room"]
    });
  });

  it("fails closed when scoped handoff targets a v2-qualified surface", async () => {
    const capabilities = structuredClone(CAPABILITIES);
    capabilities.game.compatibility = {
      ...capabilities.game.compatibility,
      status: "qualified_scoped",
      action_execution_surface_kinds: ["deck_removal_selection"],
      action_canary_surface_kinds: [],
      inspection_allowed_kinds: ["run_deck"]
    };
    capabilities.surfaces = capabilities.surfaces.map((surface) => ({
      ...surface,
      support: surface.kind === "deck_removal_selection"
        ? "qualified_exact_build"
        : "not_qualified_for_current_build"
    }));
    capabilities.inspections = {
      ...capabilities.inspections,
      status: "qualified_read_only_scoped",
      implemented_kinds: ["run_deck"]
    };
    const unsupported = {
      ...structuredClone(DECK_REMOVAL_STATE),
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "NDeckCardSelectScreen", reason: "provider degraded" },
      authority_handoff: {
        status: "legacy_fallback_allowed",
        surface_kind: "deck_removal_selection",
        reason: "invalid fixture handoff"
      },
      legal_actions: [],
      game: capabilities.game
    };
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: unsupported, capabilities }),
      TEST_SOURCE
    );
    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
  });

  it("rejects state from a different loaded module or runtime instance", () => {
    const drifted = {
      ...structuredClone(DECK_ENCHANT_STATE),
      bridge: {
        ...DECK_ENCHANT_STATE.bridge,
        module_version_id: "different-loaded-module",
        runtime_instance_id: "different-runtime"
      }
    };
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: drifted, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
  });

  it("fails closed on catalog/runtime inspection mismatch and types composite-read stale races", async () => {
    const unsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "menu", reason: "not implemented" },
      authority_handoff: {
        status: "none_fail_closed",
        surface_kind: null,
        reason: "fixture unsupported surface"
      },
      legal_actions: []
    };
    const makeAdapter = (errorCode: string) => new Sts2McpHybridAdapter(
      "http://adapter.test",
      1_000,
      { commandPollMs: 1, commandTimeoutMs: 100 },
      async (input) => {
        const url = String(input);
        if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
        if (url.endsWith("/api/v2/state")) return json(unsupported);
        if (url.endsWith("/api/v2/observation-bundles")) {
          return json({ error: { code: errorCode, detail: "test failure" } }, 409);
        }
        if (url.endsWith("/api/v1/singleplayer?format=json")) {
          return json({ state_type: "menu", options: [] });
        }
        throw new Error(`Unexpected request ${url}`);
      }
    );

    await expect(makeAdapter("inspection_not_available").readCurrentState()).rejects.toMatchObject({
      name: "BridgeV2HttpError",
      errorCode: "inspection_not_available"
    });
    await expect(makeAdapter("stale_state").readCurrentState()).rejects.toMatchObject({
      name: "TransientObservationError",
      code: "state_changed_during_composite_read"
    } satisfies Partial<TransientObservationError>);
  });

  it("retries an inspection scope mismatch only when a fresh state proves lifecycle drift", async () => {
    const unsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "menu", reason: "not implemented" },
      authority_handoff: {
        status: "none_fail_closed",
        surface_kind: null,
        reason: "fixture unsupported surface"
      },
      legal_actions: []
    };
    const changed = {
      ...unsupported,
      state_id: "state-after-shop-transition",
      state_sequence: unsupported.state_sequence + 1
    };
    let stateReads = 0;
    const makeAdapter = (refreshedState: typeof unsupported) => new Sts2McpHybridAdapter(
      "http://adapter.test",
      1_000,
      { commandPollMs: 1, commandTimeoutMs: 100 },
      async (input) => {
        const url = String(input);
        if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
        if (url.endsWith("/api/v2/state")) {
          stateReads += 1;
          return json(stateReads === 1 ? unsupported : refreshedState);
        }
        if (url.endsWith("/api/v2/observation-bundles")) {
          return json({ error: { code: "inspection_scope_mismatch", detail: "transition race" } }, 409);
        }
        if (url.endsWith("/api/v1/singleplayer?format=json")) {
          return json({ state_type: "menu", options: [] });
        }
        throw new Error(`Unexpected request ${url}`);
      }
    );

    stateReads = 0;
    await expect(makeAdapter(changed).readCurrentState()).rejects.toMatchObject({
      name: "TransientObservationError",
      code: "state_changed_during_composite_read"
    } satisfies Partial<TransientObservationError>);

    stateReads = 0;
    await expect(makeAdapter(unsupported).readCurrentState()).rejects.toMatchObject({
      name: "BridgeV2HttpError",
      errorCode: "inspection_scope_mismatch"
    });
  });

  it("preserves the bridge reason when strict v2 sees an unsupported surface", () => {
    const unsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "NMainMenu", reason: "surface adapter not implemented" },
      authority_handoff: {
        status: "none_fail_closed",
        surface_kind: null,
        reason: "strict fixture"
      },
      legal_actions: []
    };
    const envelope = normalizeCurrentState(
      wrapBridgeV2State({ state: unsupported, capabilities: structuredClone(CAPABILITIES) }),
      TEST_SOURCE
    );
    expect(envelope.currentState.surface).toMatchObject({
      kind: "unsupported",
      reason: "Bridge v2 does not implement NMainMenu: surface adapter not implemented"
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("rejects legacy actions at the strict v2 adapter boundary", async () => {
    let called = false;
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async () => {
      called = true;
      throw new Error("strict v2 must not call a v1 endpoint");
    });

    await expect(adapter.execute({ kind: "end_turn" })).resolves.toMatchObject({
      accepted: false,
      outcome: "rejected",
      response: { error: { code: "action_authority_mismatch" } }
    });
    expect(called).toBe(false);
  });

  it("enforces the latest read as the single executor authority in auto mode", async () => {
    const requests: string[] = [];
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      requests.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
      if (url.endsWith("/api/v2/state")) return json(DECK_ENCHANT_STATE);
      if (url.endsWith("/api/v2/observation-bundles")) return json(coherentObservationBundle(DECK_ENCHANT_STATE));
      if (url.includes("/api/v2/inspections/run_deck?")) return json(runDeckInspection(DECK_ENCHANT_STATE.state_id));
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("event"));
      throw new Error(`Unexpected request ${url}`);
    });

    await adapter.readCurrentState();
    await expect(adapter.execute({ kind: "end_turn" })).resolves.toMatchObject({
      accepted: false,
      outcome: "rejected",
      response: { error: { code: "action_authority_mismatch" } }
    });
    expect(requests.some((url) => url.endsWith("/api/v1/singleplayer"))).toBe(false);
  });

  it("does not regain v1 action authority when exact-build execution is denied", async () => {
    const calls: string[] = [];
    const incompatibleCapabilities = structuredClone(CAPABILITIES);
    incompatibleCapabilities.game.compatibility = {
      status: "unsupported",
      tested_game_versions: ["0.108.0"],
      tested_build_fingerprints: ["v0.108.0|58694f64|-2044609792"],
      action_execution_allowed: false,
      state_observation_allowed: false,
      inspection_allowed: false,
      action_execution_surface_kinds: [],
      action_canary_surface_kinds: [],
      inspection_allowed_kinds: [],
      inspection_canary_kinds: [],
      observation_only_surface_kinds: [],
      observation_candidate_build_fingerprints: [],
      detail: "build mismatch",
      action_permission_scopes: []
    };
    incompatibleCapabilities.inspections = {
      ...incompatibleCapabilities.inspections,
      status: "disabled_for_current_build",
      implemented_kinds: []
    };
    const incompatibleState = structuredClone(DECK_ENCHANT_STATE);
    incompatibleState.game = incompatibleCapabilities.game;
    incompatibleState.visibility = {
      ...RUN_VISIBILITY,
      available_inspections: [],
      linked_detail_kinds: []
    };
    incompatibleState.inspection_catalog = [];
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(incompatibleCapabilities);
      if (url.endsWith("/api/v2/state")) return json(incompatibleState);
      if (url.endsWith("/api/v2/observation-bundles")) return json(coherentObservationBundle(incompatibleState, {}));
      if (url.includes("/api/v2/inspections/run_deck?")) return json(runDeckInspection(incompatibleState.state_id));
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("event"));
      throw new Error(`Unexpected request ${url}`);
    });

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    expect(isBridgeV2WrappedState(raw)).toBe(true);
    expect(adapter.describe().capabilities.canExecuteActions).toBe(false);
    expect(envelope.currentState.stability).toBe("invalid");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("keeps candidate observation v2-only and skips both legacy and inspection reads", async () => {
    const requests: string[] = [];
    const candidateCapabilities = structuredClone(CAPABILITIES);
    candidateCapabilities.game = {
      version: "v0.109.0",
      commit: "c12f634d",
      branch: "v0.109.0",
      main_assembly_hash: -840572606,
      modset: structuredClone(CAPABILITIES.game.modset),
      compatibility: {
        status: "observation_only_candidate",
        tested_game_versions: ["0.108.0"],
        tested_build_fingerprints: ["v0.108.0|58694f64|-2044609792"],
        action_execution_allowed: false,
        state_observation_allowed: true,
        inspection_allowed: false,
        action_execution_surface_kinds: [],
        action_canary_surface_kinds: [],
        inspection_allowed_kinds: [],
        inspection_canary_kinds: [],
        observation_only_surface_kinds: ["deck_removal_selection"],
        observation_candidate_build_fingerprints: ["v0.109.0|c12f634d|-840572606"],
        detail: "static bindings only",
        action_permission_scopes: []
      }
    };
    candidateCapabilities.surfaces = candidateCapabilities.surfaces.map((surface) => ({
      ...surface,
      support: surface.kind === "deck_removal_selection"
        ? "candidate_observation_only"
        : "not_qualified_for_current_build"
    }));
    candidateCapabilities.inspections = {
      ...candidateCapabilities.inspections,
      status: "disabled_for_current_build",
      implemented_kinds: []
    };
    const candidateState = {
      ...structuredClone(DECK_REMOVAL_STATE),
      game: candidateCapabilities.game,
      visibility: {
        ...RUN_VISIBILITY,
        available_inspections: [],
        linked_detail_kinds: []
      },
      inspection_catalog: [],
      readiness: "observation_only",
      legal_actions: [],
      completeness: {
        ...DECK_REMOVAL_STATE.completeness,
        legal_actions: "suppressed_by_candidate_observation_gate"
      },
      diagnostics: []
    };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      requests.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(candidateCapabilities);
      if (url.endsWith("/api/v2/state")) return json(candidateState);
      if (url.endsWith("/api/v2/observation-bundles")) {
        return json(coherentObservationBundle(candidateState, {}));
      }
      throw new Error(`Unexpected candidate-observation request ${url}`);
    });

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    expect(isBridgeV2WrappedState(raw)).toBe(true);
    expect(envelope.currentState).toMatchObject({
      stability: "unknown",
      actionAuthority: "none",
      surface: { kind: "deck_removal_selection" }
    });
    expect(requests.some((url) => url.includes("/inspections/"))).toBe(false);
    expect(requests.some((url) => url.includes("/api/v1/"))).toBe(false);
  });

  it("reads only the explicitly scoped run-deck inspection in the v0.109 qualification", async () => {
    const requests: string[] = [];
    const capabilities = structuredClone(CAPABILITIES);
    const qualifiedKinds = ["deck_removal_selection", "deck_upgrade_selection", "combat_turn"];
    const canaryKinds = ["reward_claim", "card_reward_selection", "map_navigation", "treasure_room"];
    const actionPermissionScopes = capabilities.surfaces.flatMap((surface) => {
      const tier = qualifiedKinds.includes(surface.kind)
        ? "qualified" as const
        : canaryKinds.includes(surface.kind)
          ? "canary" as const
          : null;
      return tier === null
        ? []
        : surface.operations.map((operation) => ({ surface_kind: surface.kind, operation, tier }));
    });
    capabilities.game = {
      version: "v0.109.0",
      commit: "c12f634d",
      branch: "v0.109.0",
      main_assembly_hash: -840572606,
      modset: structuredClone(CAPABILITIES.game.modset),
      compatibility: {
        status: "qualified_scoped",
        tested_game_versions: ["0.108.0", "0.109.0"],
        tested_build_fingerprints: [
          "v0.108.0|58694f64|-2044609792",
          "v0.109.0|c12f634d|-840572606"
        ],
        action_execution_allowed: true,
        state_observation_allowed: true,
        inspection_allowed: true,
        action_execution_surface_kinds: qualifiedKinds,
        action_canary_surface_kinds: canaryKinds,
        inspection_allowed_kinds: ["run_deck"],
        inspection_canary_kinds: [],
        observation_only_surface_kinds: [],
        observation_candidate_build_fingerprints: [],
        detail: "qualified merchant removal and run deck only",
        action_permission_scopes: actionPermissionScopes
      }
    };
    capabilities.surfaces = capabilities.surfaces.map((surface) => ({
      ...surface,
      support: qualifiedKinds.includes(surface.kind)
        ? "qualified_exact_build"
        : canaryKinds.includes(surface.kind)
          ? "candidate_action_canary"
        : "not_qualified_for_current_build",
      operations: qualifiedKinds.includes(surface.kind) || canaryKinds.includes(surface.kind)
        ? surface.operations
        : []
    }));
    capabilities.inspections = {
      ...capabilities.inspections,
      status: "qualified_read_only_scoped",
      implemented_kinds: ["run_deck"]
    };
    const state = { ...structuredClone(DECK_REMOVAL_STATE), game: capabilities.game, diagnostics: [] };
    const inspection = { ...runDeckInspection(state.state_id), game: capabilities.game };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      requests.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(capabilities);
      if (url.endsWith("/api/v2/state")) return json(state);
      if (url.endsWith("/api/v2/observation-bundles")) {
        return json(coherentObservationBundle(state, { run_deck: inspection }));
      }
      if (url.includes("/api/v2/inspections/run_deck?")) return json(inspection);
      throw new Error(`Unexpected action-canary request ${url}`);
    });

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    expect(envelope.currentState).toMatchObject({
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      bridgeInspectionFacts: { runDeck: [expect.objectContaining({ id: "STRIKE" })] }
    });
    expect(requests.some((url) => url.endsWith("/api/v2/observation-bundles"))).toBe(true);
    expect(requests.some((url) => url.includes("/inspections/run_deck?"))).toBe(false);
    expect(requests.some((url) => url.includes("/inspections/combat_piles?"))).toBe(false);
    expect(requests.some((url) => url.includes("/api/v1/"))).toBe(false);
  });

  it("keeps every exact candidate-build surface free of legacy or inspection contamination", async () => {
    const requests: string[] = [];
    const candidateCapabilities = structuredClone(CAPABILITIES);
    candidateCapabilities.game = {
      version: "v0.109.0",
      commit: "c12f634d",
      branch: "v0.109.0",
      main_assembly_hash: -840572606,
      modset: structuredClone(CAPABILITIES.game.modset),
      compatibility: {
        status: "observation_only_candidate",
        tested_game_versions: ["0.108.0"],
        tested_build_fingerprints: ["v0.108.0|58694f64|-2044609792"],
        action_execution_allowed: false,
        state_observation_allowed: true,
        inspection_allowed: false,
        action_execution_surface_kinds: [],
        action_canary_surface_kinds: [],
        inspection_allowed_kinds: [],
        inspection_canary_kinds: [],
        observation_only_surface_kinds: ["deck_removal_selection"],
        observation_candidate_build_fingerprints: ["v0.109.0|c12f634d|-840572606"],
        detail: "static bindings only",
        action_permission_scopes: []
      }
    };
    candidateCapabilities.surfaces = candidateCapabilities.surfaces.map((surface) => ({
      ...surface,
      support: surface.kind === "deck_removal_selection"
        ? "candidate_observation_only"
        : "not_qualified_for_current_build"
    }));
    candidateCapabilities.inspections = {
      ...candidateCapabilities.inspections,
      status: "disabled_for_current_build",
      implemented_kinds: []
    };
    const unsupportedCandidateState = {
      ...structuredClone(DECK_REMOVAL_STATE),
      game: candidateCapabilities.game,
      visibility: {
        ...RUN_VISIBILITY,
        available_inspections: [],
        linked_detail_kinds: []
      },
      inspection_catalog: [],
      readiness: "unsupported",
      context: { kind: "unknown", source_type: "menu", reason: "menu is not candidate-observable" },
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "menu", reason: "menu is not candidate-observable" },
      authority_handoff: {
        status: "none_fail_closed",
        surface_kind: null,
        reason: "candidate build cannot hand off"
      },
      legal_actions: [],
      diagnostics: []
    };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      requests.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(candidateCapabilities);
      if (url.endsWith("/api/v2/state")) return json(unsupportedCandidateState);
      if (url.endsWith("/api/v2/observation-bundles")) {
        return json(coherentObservationBundle(unsupportedCandidateState, {}));
      }
      throw new Error(`Unexpected candidate-build request ${url}`);
    });

    const raw = await adapter.readCurrentState();
    expect(isBridgeV2WrappedState(raw)).toBe(true);
    expect(raw).not.toHaveProperty("legacy_v1_state");
    expect(adapter.describe().capabilities.canExecuteActions).toBe(false);
    expect(adapter.describe().negotiated).toMatchObject({
      supported_surfaces: [],
      candidate_observation_surfaces: ["deck_removal_selection"]
    });
    expect(normalizeCurrentState(raw, adapter.describe()).currentState).toMatchObject({
      stability: "unknown",
      actionAuthority: "none",
      surface: { kind: "unsupported" }
    });
    expect(requests.some((url) => url.includes("/inspections/"))).toBe(false);
    expect(requests.some((url) => url.includes("/api/v1/"))).toBe(false);
  });

  it("does not hide v2 identity drift behind unsupported-surface v1 fallback", async () => {
    const calls: string[] = [];
    const driftedUnsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "menu", reason: "not implemented" },
      authority_handoff: {
        status: "none_fail_closed",
        surface_kind: null,
        reason: "fixture unsupported surface"
      },
      legal_actions: [],
      game: { ...CAPABILITIES.game, commit: "different-build" }
    };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
      if (url.endsWith("/api/v2/state")) return json(driftedUnsupported);
      if (url.endsWith("/api/v2/observation-bundles")) return json(coherentObservationBundle(driftedUnsupported));
      if (url.includes("/api/v2/inspections/run_deck?")) return json(runDeckInspection(driftedUnsupported.state_id));
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("event"));
      throw new Error(`Unexpected request ${url}`);
    });

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    expect(isBridgeV2WrappedState(raw)).toBe(true);
    expect(envelope.currentState.stability).toBe("invalid");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("treats failed commands and mismatched command identities as unknown without retry", async () => {
    const failedAdapter = commandAdapter((requestId) => command(requestId, "failed"));
    const failedAction = await firstBridgeAction(failedAdapter);
    const failed = await failedAdapter.execute(failedAction);
    expect(failed).toMatchObject({ accepted: false, outcome: "unknown", response: { status: "failed" } });

    let submissions = 0;
    const mismatchedAdapter = commandAdapter((_requestId) => {
      submissions += 1;
      return command("wrong-request-id", "completed");
    }, true);
    const mismatchedAction = await firstBridgeAction(mismatchedAdapter);
    const mismatched = await mismatchedAdapter.execute(mismatchedAction);
    expect(mismatched).toMatchObject({
      accepted: false,
      outcome: "unknown",
      response: { status: "client_outcome_unknown", error: { code: "command_response_contract_mismatch" } }
    });
    expect(submissions).toBe(1);
  });
});

function command(
  requestId: string | undefined,
  status: "started" | "completed" | "failed" | "timed_out"
) {
  const outcome = status === "completed" ? "confirmed" : status === "failed" || status === "timed_out" ? "unknown" : "pending";
  return {
    request_id: requestId ?? "request-missing",
    expected_state_id: "state-test-1",
    action_id: "action-test-1",
    status,
    outcome,
    observed_state_id: "state-test-1",
    events: [{ status, at: "2026-07-16T00:00:00Z", evidence: status === "completed" ? "test_completion" : null, error_code: null, detail: null }]
  };
}

function commandAdapter(
  terminal: (requestId: string) => ReturnType<typeof command>,
  terminalOnSubmit = false
): Sts2McpHybridAdapter {
  return new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
    commandPollMs: 1,
    commandTimeoutMs: 100
  }, async (input, init) => {
    const url = String(input);
    if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
    if (url.endsWith("/api/v2/state")) return json(DECK_ENCHANT_STATE);
    if (url.endsWith("/api/v2/observation-bundles")) return json(coherentObservationBundle(DECK_ENCHANT_STATE));
    if (url.includes("/api/v2/inspections/run_deck?")) return json(runDeckInspection(DECK_ENCHANT_STATE.state_id));
    if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("event"));
    if (url.endsWith("/api/v2/commands") && init?.method === "POST") {
      const requestId = JSON.parse(String(init.body)).request_id as string;
      return json(terminalOnSubmit ? terminal(requestId) : command(requestId, "started"), terminalOnSubmit ? 200 : 202);
    }
    if (url.includes("/api/v2/commands/")) {
      return json(terminal(decodeURIComponent(url.split("/").at(-1) ?? "")));
    }
    throw new Error(`Unexpected request ${url}`);
  }, async () => {});
}

async function firstBridgeAction(adapter: Sts2McpHybridAdapter) {
  const raw = await adapter.readCurrentState();
  const envelope = normalizeCurrentState(raw, adapter.describe());
  const action = buildAllowedActions(envelope.currentState, envelope.stateHash)[0]?.action;
  if (!action || action.kind !== "bridge_v2_action") throw new Error("missing bridge action");
  return action;
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
}
