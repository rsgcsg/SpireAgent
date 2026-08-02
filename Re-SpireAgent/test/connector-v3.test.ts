import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import type { AdapterDescriptor } from "../src/game-io/adapter.js";
import { projectConnectorV3ForRe } from "../src/integrations/sts2mcp/connectorV3Projection.js";
import { Sts2ConnectorV3Adapter } from "../src/integrations/sts2mcp/connectorV3Adapter.js";
import {
  decodeConnectorV3Inspection,
  decodeConnectorV3Observation,
  decodeConnectorV3Receipt,
  type ConnectorV3Observation
} from "../src/integrations/sts2mcp/connectorV3Protocol.js";
import type { JsonObject } from "../src/shared/json.js";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";

const BRIDGE = {
  id: "sts2_connector_v3",
  name: "STS2 Semantic Gateway",
  version: "0.6.0-dev",
  upstream_commit: "fixture",
  module_version_id: "fixture-mvid",
  assembly_file_sha256: "a".repeat(64),
  runtime_instance_id: "fixture-runtime"
};

const GAME = {
  version: "v0.109.1",
  commit: "fixture-game",
  branch: "v0.109.1",
  main_assembly_hash: 123,
  compatibility: {
    status: "supported_exact",
    action_execution_allowed: true,
    state_observation_allowed: true,
    inspection_allowed: false,
    action_permission_scopes: [{
      surface_kind: "combat_turn",
      operation: "play_card",
      tier: "qualified"
    }]
  },
  modset: {
    status: "exact_bridge_only",
    fingerprint: "fixture-modset"
  }
};

const SOURCE: AdapterDescriptor = {
  adapterId: "sts2-connector-v3",
  endpoint: "http://fixture.invalid",
  capabilities: {
    canReadState: true,
    canExecuteActions: true,
    canListLegalActions: true,
    actionResults: "complete",
    legalActionAuthority: "bridge_advertised",
    protocols: ["connector_v3"]
  }
};

function combatObservation(): ConnectorV3Observation {
  return decodeConnectorV3Observation({
    protocol_version: "3.0-preview.3",
    schema: "sts2.connector.v3/observation-1",
    profile: "semantic_accessibility.tools.v1",
    state_token: "state-fixture-1",
    sequence: 1,
    observed_at: "2026-07-31T00:00:00Z",
    status: "actionable_complete",
    shared_state: sharedState(),
    context: {
      kind: "combat",
      encounter_type: "normal",
      round: 1,
      turn_owner: "player",
      is_play_phase: true,
      player: {
        player_entity_id: "player-fixture",
        block: 0,
        energy: 3,
        max_energy: 3,
        hand: [{
          entity_id: "card-fixture-1",
          definition_id: "STRIKE_IRONCLAD",
          name: "Strike",
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          rarity: "Basic",
          is_upgraded: false,
          is_selected: false,
          target_type: "AnyEnemy",
          can_play: true
        }],
        draw_pile_count: 5,
        discard_pile_count: 0,
        exhaust_pile_count: 0,
        statuses: [],
        companions: [],
        potion_states: [],
        orbs: [],
        orb_slots: 0
      },
      enemies: [
        {
          entity_id: "creature-fixture-1",
          combat_id: 1,
          definition_id: "CULTIST",
          name: "Cultist",
          hp: 50,
          max_hp: 50,
          block: 0,
          statuses: [],
          intents: [{ type: "Attack", label: "6" }]
        },
        {
          entity_id: "creature-fixture-2",
          combat_id: 2,
          definition_id: "LOUSE",
          name: "Louse",
          hp: 12,
          max_hp: 12,
          block: 0,
          statuses: [],
          intents: [{ type: "Attack", label: "5" }]
        }
      ]
    },
    surface: {
      kind: "combat_turn",
      room_entity_id: "room-fixture",
      can_end_turn: true
    },
    interaction: {
      id: "interaction-fixture-1",
      kind: "combat_turn",
      phase: "ready",
      execution_support: "supported",
      support_reason: null,
      affordances: ["play_card"],
      command_candidates: [{
        candidate_id: "candidate-fixture-1",
        command: "play_card",
        operation: "play_card",
        label: "Play Strike",
        operands: { card_id: "card-fixture-1" },
        operand_domains: {
          target_id: {
            kind: "entity_ids",
            entity_ids: ["creature-fixture-1", "creature-fixture-2"]
          }
        },
        entity_bindings: [
          { role: "card", entity_id: "card-fixture-1" },
          { role: "target", entity_id: "creature-fixture-1" },
          { role: "target", entity_id: "creature-fixture-2" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "supported"
      }]
    },
    completeness: {
      player_visible_semantics: "complete",
      legal_actions: "complete",
      sources: ["fixture"],
      missing: []
    },
    bridge: BRIDGE,
    game: GAME,
    observation_policy: {
      id: "player_visible_ui_v1",
      scope: "visible",
      includes_hidden_information: false,
      unknown_field_behavior: "omit_and_mark_incomplete"
    },
    visibility: {
      profile_id: "fixture",
      core_status: "complete",
      player_visible_closure_status: "partial_catalog",
      available_inspections: [],
      linked_detail_kinds: [],
      hidden_by_policy: ["hidden_rng"],
      missing: [],
      unknown_critical_field_behavior: "fail_closed"
    },
    inspection_catalog: [],
    diagnostics: [],
    warnings: [],
    coverage: {
      visible_information: "complete_for_declared_contract",
      interaction_discovery: "complete",
      execution_support: "supported",
      unmapped_visible_controls: [],
      hidden_by_policy: ["hidden_rng"]
    }
  }).data;
}

function mainMenuObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.shared_state = null;
  value.context = { kind: "menu", flow: "root_navigation" };
  value.surface = {
    kind: "main_menu",
    stage: "choosing",
    screen_entity_id: "menu-screen-fixture",
    options: [
      {
        entity_id: "menu-option-singleplayer",
        semantic_id: "singleplayer",
        label: "Singleplayer",
        enabled: true,
        bridge_support: "actionable"
      },
      {
        entity_id: "menu-option-settings",
        semantic_id: "settings",
        label: "Settings",
        enabled: true,
        bridge_support: "visible_unsupported",
        blocked_reason: "outside the bounded run contract"
      }
    ]
  };
  value.interaction = {
    id: "interaction-menu-fixture",
    kind: "main_menu",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["activate_control"],
    command_candidates: [{
      candidate_id: "candidate-open-singleplayer",
      command: "activate_control",
      operation: "open_singleplayer",
      label: "Open Single Player",
      operands: {
        menu_screen_id: "menu-screen-fixture",
        control_id: "open_singleplayer"
      },
      operand_domains: {},
      entity_bindings: [{ role: "menu_screen", entity_id: "menu-screen-fixture" }],
      binding_kind: "native_direct_resolver",
      authority_state: "trial"
    }]
  };
  return decodeConnectorV3Observation(value).data;
}

function sharedState() {
  return {
    scope: "active_single_player_run",
    run: {
      act: 1,
      act_definition_id: "UNDERDOCKS",
      act_name: "Underdocks",
      floor: 2,
      ascension: 0,
      bosses: [{ definition_id: "BOSS", name: "Boss", order: 0 }],
      modifiers: []
    },
    player: {
      entity_id: "player-fixture",
      character_definition_id: "IRONCLAD",
      character_name: "The Ironclad",
      hp: 72,
      max_hp: 80,
      gold: 99,
      relics: [],
      potions: [],
      max_potion_slots: 3
    },
    completeness: {
      player_visible_semantics: "complete_for_visible_hud",
      sources: ["fixture_hud"],
      missing: []
    }
  };
}

function generatedCombatChoiceObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.surface = {
    kind: "generated_card_choice",
    screen_entity_id: "generated-screen-fixture",
    prompt: "Choose a Card",
    purpose: "choose_one_generated_combat_card",
    source_kind: "skill_potion",
    destination: "combat_hand",
    selected_card_cost_policy: "free_this_turn",
    overflow_destination: "combat_discard_if_hand_full",
    can_skip: true,
    is_peeking: false,
    cards: [
      {
        entity_id: "generated-card-1",
        definition_id: "TRUE_GRIT",
        name: "True Grit",
        type: "Skill",
        cost: "1",
        description: "Gain Block.",
        rarity: "Common",
        is_upgraded: false,
        is_selected: false
      },
      {
        entity_id: "generated-card-2",
        definition_id: "BATTLE_TRANCE",
        name: "Battle Trance",
        type: "Skill",
        cost: "0",
        description: "Draw cards.",
        rarity: "Uncommon",
        is_upgraded: false,
        is_selected: false
      }
    ]
  };
  value.interaction = {
    id: "interaction-generated-fixture",
    kind: "generated_card_choice",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["select_entity", "activate_control"],
    command_candidates: [
      {
        candidate_id: "candidate-generated-1",
        command: "select_entity",
        operation: "select_generated_combat_card",
        label: "Choose True Grit",
        operands: {
          screen_id: "generated-screen-fixture",
          card_id: "generated-card-1"
        },
        operand_domains: {},
        entity_bindings: [
          { role: "screen", entity_id: "generated-screen-fixture" },
          { role: "card", entity_id: "generated-card-1" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      },
      {
        candidate_id: "candidate-generated-2",
        command: "select_entity",
        operation: "select_generated_combat_card",
        label: "Choose Battle Trance",
        operands: {
          screen_id: "generated-screen-fixture",
          card_id: "generated-card-2"
        },
        operand_domains: {},
        entity_bindings: [
          { role: "screen", entity_id: "generated-screen-fixture" },
          { role: "card", entity_id: "generated-card-2" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      },
      {
        candidate_id: "candidate-generated-skip",
        command: "activate_control",
        operation: "skip_generated_combat_card_choice",
        label: "Skip",
        operands: {
          screen_id: "generated-screen-fixture",
          control_id: "skip_generated_combat_card_choice"
        },
        operand_domains: {},
        entity_bindings: [
          { role: "screen", entity_id: "generated-screen-fixture" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      }
    ]
  };
  return decodeConnectorV3Observation(value).data;
}

function eventObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.shared_state = sharedState();
  value.context = {
    kind: "event",
    event_id: "FIXTURE_EVENT",
    name: "Fixture Event",
    ancient: false,
    in_dialogue: false,
    body: "Choose one visible option."
  };
  value.surface = {
    kind: "event_option",
    screen_entity_id: "event-screen-fixture",
    options: [{
      entity_id: "event-option-fixture",
      index: 0,
      title: "Take the visible reward",
      description: "Gain 10 Gold.",
      is_enabled: true,
      is_locked: false,
      is_proceed: false,
      was_chosen: false,
      will_kill_player: false,
      tooltips: []
    }]
  };
  value.interaction = {
    id: "interaction-event-fixture",
    kind: "event_option",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["choose"],
    command_candidates: [{
      candidate_id: "candidate-event-fixture",
      command: "choose",
      operation: "choose_event_option",
      label: "Take the visible reward",
      operands: {
        screen_id: "event-screen-fixture",
        choice_id: "event-option-fixture"
      },
      operand_domains: {},
      entity_bindings: [
        { role: "screen", entity_id: "event-screen-fixture" },
        { role: "option", entity_id: "event-option-fixture" }
      ],
      binding_kind: "native_direct_resolver",
      authority_state: "trial"
    }]
  };
  return decodeConnectorV3Observation(value).data;
}

function mapObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.shared_state = sharedState();
  value.context = {
    kind: "map",
    act_index: 0,
    current_position: { col: 3, row: 1, point_type: "monster" },
    visited: [{ col: 3, row: 1, point_type: "monster" }],
    nodes: [{
      entity_id: "map-node-fixture",
      col: 3,
      row: 2,
      point_type: "event",
      state: "travelable",
      children: [{ col: 2, row: 3, point_type: "rest" }]
    }]
  };
  value.surface = {
    kind: "map_navigation",
    screen_entity_id: "map-screen-fixture",
    travel_enabled: true,
    traveling: false,
    drawing_mode: "none",
    next_options: [{
      entity_id: "map-node-fixture",
      col: 3,
      row: 2,
      point_type: "event"
    }]
  };
  value.interaction = {
    id: "interaction-map-fixture",
    kind: "map_navigation",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["navigate"],
    command_candidates: [{
      candidate_id: "candidate-map-fixture",
      command: "navigate",
      operation: "choose_map_node",
      label: "Choose event at (3,2)",
      operands: {
        map_screen_id: "map-screen-fixture",
        map_node_id: "map-node-fixture"
      },
      operand_domains: {},
      entity_bindings: [
        { role: "map_screen", entity_id: "map-screen-fixture" },
        { role: "map_node", entity_id: "map-node-fixture" }
      ],
      binding_kind: "native_direct_resolver",
      authority_state: "trial"
    }]
  };
  return decodeConnectorV3Observation(value).data;
}

function gameOverObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.shared_state = sharedState();
  value.context = {
    kind: "game_over",
    result: "loss",
    game_mode: "standard",
    score: 70,
    floor_reached: 7,
    ascension: 0
  };
  value.surface = {
    kind: "game_over",
    stage: "summary",
    screen_entity_id: "game-over-screen-fixture",
    return_destination: "main_menu",
    can_advance_summary: false,
    can_return: true
  };
  value.interaction = {
    id: "interaction-game-over-fixture",
    kind: "game_over",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["activate_control"],
    command_candidates: [{
      candidate_id: "candidate-game-over-fixture",
      command: "activate_control",
      operation: "return_game_over",
      label: "Return to the main menu",
      operands: {
        game_over_screen_id: "game-over-screen-fixture",
        control_id: "return_game_over"
      },
      operand_domains: {},
      entity_bindings: [{
        role: "game_over_screen",
        entity_id: "game-over-screen-fixture"
      }],
      binding_kind: "native_direct_resolver",
      authority_state: "trial"
    }]
  };
  return decodeConnectorV3Observation(value).data;
}

function rewardClaimObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.shared_state = sharedState();
  value.context = { kind: "reward_flow", reward_kind: "room_rewards" };
  value.surface = {
    kind: "reward_claim",
    screen_entity_id: "reward-screen-fixture",
    rewards: [{
      entity_id: "reward-gold-fixture",
      kind: "gold",
      label: "Gain 25 Gold",
      description: "25 Gold",
      enabled: true
    }],
    potion_slots_full: true,
    discardable_potions: [{
      entity_id: "potion-fixture",
      definition_id: "FIRE_POTION",
      name: "Fire Potion",
      description: "Deal damage.",
      slot: 0,
      target_type: "enemy",
      can_use: true,
      automatic: false
    }],
    can_proceed: true,
    proceed_skips_remaining_rewards: true
  };
  value.interaction = {
    id: "interaction-reward-fixture",
    kind: "reward_claim",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["choose", "activate_control"],
    command_candidates: [
      {
        candidate_id: "candidate-claim-reward-fixture",
        command: "choose",
        operation: "claim_reward",
        label: "Gain 25 Gold",
        operands: {
          screen_id: "reward-screen-fixture",
          choice_id: "reward-gold-fixture"
        },
        operand_domains: {},
        entity_bindings: [
          { role: "screen", entity_id: "reward-screen-fixture" },
          { role: "reward", entity_id: "reward-gold-fixture" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      },
      {
        candidate_id: "candidate-discard-potion-fixture",
        command: "activate_control",
        operation: "discard_potion_for_reward",
        label: "Discard Fire Potion",
        operands: {
          screen_id: "reward-screen-fixture",
          potion_id: "potion-fixture",
          control_id: "discard_potion_for_reward"
        },
        operand_domains: {},
        entity_bindings: [
          { role: "screen", entity_id: "reward-screen-fixture" },
          { role: "potion", entity_id: "potion-fixture" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      },
      {
        candidate_id: "candidate-proceed-rewards-fixture",
        command: "activate_control",
        operation: "proceed_rewards",
        label: "Proceed",
        operands: {
          screen_id: "reward-screen-fixture",
          control_id: "proceed_rewards"
        },
        operand_domains: {},
        entity_bindings: [{ role: "screen", entity_id: "reward-screen-fixture" }],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      }
    ]
  };
  return decodeConnectorV3Observation(value).data;
}

function cardRewardObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.shared_state = sharedState();
  value.context = { kind: "reward_flow", reward_kind: "card_reward" };
  value.surface = {
    kind: "card_reward_selection",
    screen_entity_id: "card-reward-screen-fixture",
    cards: [{
      entity_id: "card-reward-fixture",
      definition_id: "STRIKE",
      name: "Strike",
      type: "attack",
      cost: "1",
      description: "Deal damage.",
      rarity: "basic",
      is_upgraded: false,
      is_selected: false,
      target_type: "enemy",
      can_play: null,
      unplayable_reason: null
    }],
    selectable_card_entity_ids: ["card-reward-fixture"],
    alternatives: [{
      entity_id: "card-reward-skip-fixture",
      index: 0,
      label: "Skip",
      enabled: true
    }]
  };
  value.interaction = {
    id: "interaction-card-reward-fixture",
    kind: "card_reward_selection",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["select_entity", "choose"],
    command_candidates: [
      {
        candidate_id: "candidate-card-reward-fixture",
        command: "select_entity",
        operation: "select_card_reward",
        label: "Take Strike",
        operands: {
          screen_id: "card-reward-screen-fixture",
          card_id: "card-reward-fixture"
        },
        operand_domains: {},
        entity_bindings: [
          { role: "screen", entity_id: "card-reward-screen-fixture" },
          { role: "card", entity_id: "card-reward-fixture" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      },
      {
        candidate_id: "candidate-card-reward-skip-fixture",
        command: "choose",
        operation: "choose_card_reward_alternative",
        label: "Skip",
        operands: {
          screen_id: "card-reward-screen-fixture",
          choice_id: "card-reward-skip-fixture"
        },
        operand_domains: {},
        entity_bindings: [
          { role: "screen", entity_id: "card-reward-screen-fixture" },
          { role: "alternative", entity_id: "card-reward-skip-fixture" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      }
    ]
  };
  return decodeConnectorV3Observation(value).data;
}

function restObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.shared_state = sharedState();
  value.context = { kind: "rest" };
  value.surface = {
    kind: "rest_site",
    screen_entity_id: "rest-screen-fixture",
    options: [{
      entity_id: "rest-option-fixture",
      index: 0,
      option_id: "HEAL",
      name: "Rest",
      description: "Heal visible HP.",
      enabled: true
    }],
    can_proceed: false
  };
  value.interaction = {
    id: "interaction-rest-fixture",
    kind: "rest_site",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["choose"],
    command_candidates: [{
      candidate_id: "candidate-rest-fixture",
      command: "choose",
      operation: "choose_rest_option",
      label: "Rest",
      operands: {
        screen_id: "rest-screen-fixture",
        rest_option_id: "rest-option-fixture"
      },
      operand_domains: {},
      entity_bindings: [
        { role: "screen", entity_id: "rest-screen-fixture" },
        { role: "rest_option", entity_id: "rest-option-fixture" }
      ],
      binding_kind: "native_direct_resolver",
      authority_state: "trial"
    }]
  };
  return decodeConnectorV3Observation(value).data;
}

function shopRoomObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.shared_state = sharedState();
  value.context = { kind: "shop" };
  value.surface = {
    kind: "shop_room",
    room_entity_id: "shop-room-fixture",
    can_open_inventory: true,
    can_proceed: true
  };
  value.interaction = {
    id: "interaction-shop-room-fixture",
    kind: "shop_room",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["activate_control"],
    command_candidates: ["open_shop_inventory", "proceed_shop"].map((operation) => ({
      candidate_id: `candidate-${operation}`,
      command: "activate_control",
      operation,
      label: operation,
      operands: { room_id: "shop-room-fixture", control_id: operation },
      operand_domains: {},
      entity_bindings: [{ role: "room", entity_id: "shop-room-fixture" }],
      binding_kind: "native_direct_resolver",
      authority_state: "trial"
    }))
  };
  return decodeConnectorV3Observation(value).data;
}

function shopInventoryObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.shared_state = sharedState();
  value.context = { kind: "shop" };
  value.surface = {
    kind: "shop_inventory",
    screen_entity_id: "shop-screen-fixture",
    cards: [{
      entity_id: "shop-offer-fixture",
      slot_entity_id: "shop-slot-fixture",
      inventory_index: 0,
      price: 50,
      stocked: true,
      visible: true,
      affordable: true,
      can_purchase: true,
      on_sale: false,
      card: {
        entity_id: "shop-card-fixture",
        definition_id: "STRIKE",
        name: "Strike",
        type: "Attack",
        cost: "1",
        description: "Deal damage.",
        rarity: "Basic",
        is_upgraded: false,
        is_selected: false
      }
    }],
    relics: [],
    potions: [],
    card_removal: null,
    can_close: true
  };
  value.interaction = {
    id: "interaction-shop-inventory-fixture",
    kind: "shop_inventory",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["purchase", "cancel_interaction"],
    command_candidates: [
      {
        candidate_id: "candidate-shop-purchase-fixture",
        command: "purchase",
        operation: "purchase_shop_card",
        label: "Buy Strike",
        operands: {
          screen_id: "shop-screen-fixture",
          shop_offer_id: "shop-offer-fixture"
        },
        operand_domains: {},
        entity_bindings: [
          { role: "screen", entity_id: "shop-screen-fixture" },
          { role: "shop_offer", entity_id: "shop-offer-fixture" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      },
      {
        candidate_id: "candidate-shop-close-fixture",
        command: "cancel_interaction",
        operation: "close_shop_inventory",
        label: "Close shop",
        operands: {
          screen_id: "shop-screen-fixture",
          control_id: "close_shop_inventory"
        },
        operand_domains: {},
        entity_bindings: [{ role: "screen", entity_id: "shop-screen-fixture" }],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      }
    ]
  };
  return decodeConnectorV3Observation(value).data;
}

function treasureObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.shared_state = sharedState();
  value.context = { kind: "treasure" };
  value.surface = {
    kind: "treasure_room",
    stage: "closed",
    room_entity_id: "treasure-room-fixture",
    chest_opened: false,
    relics: [],
    can_skip: false,
    can_proceed: false
  };
  value.interaction = {
    id: "interaction-treasure-fixture",
    kind: "treasure_room",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["activate_control"],
    command_candidates: [{
      candidate_id: "candidate-open-treasure-fixture",
      command: "activate_control",
      operation: "open_treasure_chest",
      label: "Open chest",
      operands: {
        treasure_room_id: "treasure-room-fixture",
        control_id: "open_treasure_chest"
      },
      operand_domains: {},
      entity_bindings: [{ role: "treasure_room", entity_id: "treasure-room-fixture" }],
      binding_kind: "native_direct_resolver",
      authority_state: "trial"
    }]
  };
  return decodeConnectorV3Observation(value).data;
}

function connectorCapabilities() {
  return {
    protocol_version: "3.0-preview.3",
    observation_schema: "sts2.connector.v3/observation-1",
    command_schema: "sts2.connector.v3/command-1",
    inspection_schema: "sts2.connector.v3/inspection-1",
    status: "experimental_cutover",
    bridge: BRIDGE,
    game: GAME,
    commands: ["activate_control"],
    control: { recommended_renewal_ms: 10_000 },
    non_claims: []
  };
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("Connector V3 strict contract", () => {
  it("keeps visible unsupported interactions observable without commands", () => {
    const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
    value.status = "actionable_partial";
    value.surface = { kind: "unsupported", source_type: "new_owner", reason: "code_required" };
    value.interaction = {
      id: "interaction-unsupported",
      kind: "unsupported",
      phase: "blocked",
      execution_support: "unsupported",
      support_reason: "No exact binding",
      affordances: [],
      command_candidates: []
    };

    const decoded = decodeConnectorV3Observation(value).data;

    expect(decoded.surface.kind).toBe("unsupported");
    expect(decoded.interaction.command_candidates).toEqual([]);
  });

  it("rejects unknown mutation receipts that permit retry", () => {
    expect(() => decodeConnectorV3Receipt({
      protocol_version: "3.0-preview.3",
      request_id: "request-fixture",
      status: "unknown",
      application: "unknown",
      command: { kind: "play_card", operands: { card_id: "card-fixture" } },
      reason_code: "outcome_timeout",
      detail: "unknown",
      completion: null,
      retry: { allowed: true, reason: "retry" },
      successor: { status: "pending", state_token: null },
      events: []
    })).toThrow("unknown mutation must forbid retry");
  });

  it("decodes state-bound read-only V3 inspections", () => {
    const decoded = decodeConnectorV3Inspection({
      protocol_version: "3.0-preview.3",
      schema: "sts2.connector.v3/inspection-1",
      inspection_id: "v3inspection-fixture",
      expected_state_token: "state-fixture-1",
      observed_state_token: "state-fixture-1",
      observed_at: "2026-08-02T00:00:00Z",
      kind: "run_deck",
      visibility_class: "normal_inspection",
      ordering_semantics: "unordered_multiset",
      content: { kind: "run_deck", card_count: 0, cards: [] },
      completeness: {
        player_visible_semantics: "complete_for_player_run_deck_contents_without_semantic_order",
        sources: ["NDeckViewScreen.ShowScreen(Player)"],
        missing: []
      },
      bridge: BRIDGE,
      game: GAME,
      observation_policy: {
        id: "player_visible_only",
        scope: "current_player_visible_state",
        includes_hidden_information: false,
        unknown_field_behavior: "omit_and_mark_incomplete"
      },
      diagnostics: []
    }).data;

    expect(decoded.content.kind).toBe("run_deck");
    expect(decoded.expected_state_token).toBe(decoded.observed_state_token);
  });

  it("rejects V3 inspections whose state token drifted", () => {
    expect(() => decodeConnectorV3Inspection({
      protocol_version: "3.0-preview.3",
      schema: "sts2.connector.v3/inspection-1",
      inspection_id: "v3inspection-fixture",
      expected_state_token: "state-fixture-1",
      observed_state_token: "state-fixture-2",
      observed_at: "2026-08-02T00:00:00Z",
      kind: "run_deck",
      visibility_class: "normal_inspection",
      ordering_semantics: "unordered_multiset",
      content: { kind: "run_deck", card_count: 0, cards: [] },
      completeness: {
        player_visible_semantics: "complete",
        sources: [],
        missing: []
      },
      bridge: BRIDGE,
      game: GAME,
      observation_policy: {
        id: "player_visible_only",
        scope: "current_player_visible_state",
        includes_hidden_information: false,
        unknown_field_behavior: "omit_and_mark_incomplete"
      },
      diagnostics: []
    })).toThrow("expected and observed state tokens must match");
  });

  it("expands only Gateway-provided operand domains into local opaque choices", () => {
    const observation = combatObservation();
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject,
      { protocol_version: "2.0-preview.86" }
    );

    expect(projected.invocations.size).toBe(2);
    expect([...projected.invocations.values()].map((entry) => entry.operands.target_id))
      .toEqual(["creature-fixture-1", "creature-fixture-2"]);
    expect([...projected.invocations.values()].every(
      (entry) => entry.command === "play_card"
        && entry.operands.card_id === "card-fixture-1"
    )).toBe(true);
    const wrapper = projected.rawState as Record<string, unknown>;
    expect(wrapper.adapter_protocol).toBe("connector_v3_selected");
  });

  it("consumes ordinary combat directly without V2 semantic or capabilities sidecars", () => {
    const observation = combatObservation();
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );
    const wrapper = projected.rawState as Record<string, unknown>;

    expect(wrapper.bridge_v2_state).toBeUndefined();
    expect(wrapper.bridge_v2_capabilities).toBeUndefined();
    const envelope = normalizeCurrentState(projected.rawState, SOURCE);
    expect(envelope.diagnostics.status).toBe("ok");
    expect(envelope.currentState).toMatchObject({
      sourceStateType: "connector_v3:combat:combat_turn:direct",
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: {
        kind: "combat",
        turnOwner: "player",
        enemies: [
          { entityId: "creature-fixture-1" },
          { entityId: "creature-fixture-2" }
        ]
      },
      player: {
        hp: 72,
        energy: 3,
        hand: [{ entityId: "card-fixture-1" }]
      },
      surface: {
        kind: "combat_turn",
        roomEntityId: "room-fixture",
        canEndTurn: true
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toHaveLength(2);
  });

  it("treats a known settling interaction as supervised no-action, not unsupported", () => {
    const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
    value.status = "observed";
    value.interaction = {
      id: "interaction-combat-settling",
      kind: "combat_turn",
      phase: "settling",
      execution_support: "unsupported",
      support_reason: "Legacy preview classified empty candidates as unsupported.",
      affordances: [],
      command_candidates: []
    };
    const observation = decodeConnectorV3Observation(value).data;
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );
    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.diagnostics.status).toBe("ok");
    expect(envelope.currentState).toMatchObject({
      sourceStateType: "connector_v3:combat:combat_turn:direct",
      stability: "settling",
      actionAuthority: "none",
      context: { kind: "combat" },
      surface: { kind: "no_action", reason: "settling" }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("consumes a run-mount settling observation without any V2 sidecar", () => {
    const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
    value.status = "observed";
    value.shared_state = null;
    value.context = {
      kind: "run_transition",
      phase: "setup",
      transition: "awaiting_run_state"
    };
    value.surface = { kind: "no_action", reason: "settling" };
    value.interaction = {
      id: "interaction-run-mount",
      kind: "no_action",
      phase: "settling",
      execution_support: "supported",
      support_reason: null,
      affordances: [],
      command_candidates: []
    };
    const observation = decodeConnectorV3Observation(value).data;
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );
    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.diagnostics.status).toBe("ok");
    expect(envelope.currentState).toMatchObject({
      stability: "settling",
      context: { kind: "run_transition", phase: "setup" },
      surface: { kind: "no_action", reason: "settling" }
    });
  });

  it("consumes visible unsupported V3 facts directly without a V2 sidecar", () => {
    const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
    value.status = "observed";
    value.context = { kind: "event", event_id: "SYMBIOTE" };
    value.surface = {
      kind: "deck_enchant_selection",
      source_type: "NDeckEnchantSelectScreen",
      reason: "The exact source contract is not recognized."
    };
    value.interaction = {
      id: "interaction-enchant-unsupported",
      kind: "deck_enchant_selection",
      phase: "degraded",
      execution_support: "unsupported",
      support_reason: "No exact current command binding is authorized.",
      affordances: [],
      command_candidates: []
    };
    const observation = decodeConnectorV3Observation(value).data;
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );
    const wrapper = projected.rawState as Record<string, unknown>;
    expect(wrapper.bridge_v2_state).toBeUndefined();
    expect(wrapper.bridge_v2_capabilities).toBeUndefined();

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);
    expect(envelope.diagnostics.status).toBe("ok");
    expect(envelope.currentState).toMatchObject({
      sourceStateType: "connector_v3:event:deck_enchant_selection:direct",
      stability: "non_actionable",
      actionAuthority: "none",
      surface: {
        kind: "unsupported",
        reason: "No exact current command binding is authorized."
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("preserves exact card reward owner and entity operands without consumer reconstruction", () => {
    const observation = cardRewardObservation();

    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );

    expect([...projected.invocations.values()]).toContainEqual(
      expect.objectContaining({
        command: "select_entity",
        operation: "select_card_reward",
        operands: {
          screen_id: "card-reward-screen-fixture",
          card_id: "card-reward-fixture"
        }
      })
    );
    const wrapper = projected.rawState as Record<string, unknown>;
    expect(wrapper.bridge_v2_state).toBeUndefined();
    expect(wrapper.bridge_v2_capabilities).toBeUndefined();
  });

  it("consumes menu facts and commands directly without a V2 state projection", () => {
    const observation = mainMenuObservation();
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject,
      { invalid_v2_sidecar: true }
    );
    const wrapper = projected.rawState as Record<string, unknown>;

    expect(wrapper.bridge_v2_state).toBeUndefined();
    expect(wrapper.bridge_v2_capabilities).toBeUndefined();

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);
    expect(envelope.diagnostics.status).toBe("ok");
    expect(envelope.currentState).toMatchObject({
      sourceStateType: "connector_v3:menu:main_menu:direct",
      stability: "actionable",
      actionAuthority: "bridge_advertised",
      context: { kind: "menu", screen: "main_menu" },
      surface: {
        kind: "main_menu",
        screenEntityId: "menu-screen-fixture",
        choices: [
          { semanticId: "singleplayer", bridgeSupport: "actionable" },
          { semanticId: "settings", bridgeSupport: "visible_unsupported" }
        ]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([
      expect.objectContaining({
        kind: "open_singleplayer",
        action: expect.objectContaining({
          kind: "connector_v3_command",
          expectedStateToken: observation.state_token,
          operation: "open_singleplayer"
        })
      })
    ]);
  });

  it("reads a direct V3 menu without requesting the V2 capabilities sidecar", async () => {
    const calls: string[] = [];
    const adapter = new Sts2ConnectorV3Adapter(
      "http://adapter.test",
      1_000,
      { commandPollMs: 1, commandTimeoutMs: 100 },
      async (input) => {
        const url = String(input);
        calls.push(url);
        if (url.endsWith("/api/v3/capabilities")) return json(connectorCapabilities());
        if (url.endsWith("/api/v3/observation")) return json(mainMenuObservation());
        throw new Error(`Unexpected request ${url}`);
      },
      async () => {}
    );

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());

    expect(calls.filter((url) => url.endsWith("/api/v3/capabilities"))).toHaveLength(2);
    expect(calls.some((url) => url.endsWith("/api/v2/capabilities"))).toBe(false);
    expect(envelope.currentState.sourceStateType)
      .toBe("connector_v3:menu:main_menu:direct");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toHaveLength(1);
  });

  it.each([
    ["combat", combatObservation, "combat", "combat_turn", 2],
    ["generated combat choice", generatedCombatChoiceObservation, "combat", "generated_card_choice", 3],
    ["event", eventObservation, "event", "event_option", 1],
    ["map", mapObservation, "map", "map_navigation", 1],
    ["game over", gameOverObservation, "run_ended", "game_over", 1],
    ["room rewards", rewardClaimObservation, "reward_flow", "reward_claim", 3],
    ["card reward", cardRewardObservation, "reward_flow", "card_reward_selection", 2],
    ["rest", restObservation, "rest", "rest_site", 1],
    ["shop room", shopRoomObservation, "shop", "shop_room", 2],
    ["shop inventory", shopInventoryObservation, "shop", "shop_inventory", 2],
    ["treasure", treasureObservation, "treasure", "treasure_room", 1]
  ] as const)(
    "consumes direct V3 %s facts, persistent summary, and commands without V2 sidecars",
    (_label, buildObservation, contextKind, surfaceKind, expectedActions) => {
      const observation = buildObservation();
      const projected = projectConnectorV3ForRe(
        observation,
        observation as unknown as JsonObject
      );
      const wrapper = projected.rawState as Record<string, unknown>;

      expect(wrapper.bridge_v2_state).toBeUndefined();
      expect(wrapper.bridge_v2_capabilities).toBeUndefined();
      const envelope = normalizeCurrentState(projected.rawState, SOURCE);
      expect(envelope.diagnostics.status).toBe("ok");
      expect(envelope.currentState).toMatchObject({
        sourceStateType:
          `connector_v3:${observation.context.kind}:${observation.surface.kind}:direct`,
        stability: "actionable",
        actionAuthority: "bridge_advertised",
        context: { kind: contextKind },
        surface: { kind: surfaceKind },
        run: { act: 1, floor: 2 },
        player: { hp: 72, gold: 99 },
        bridgeSharedStateEvidence: { scope: "active_single_player_run" }
      });
      expect(envelope.currentState.bridgeVisibility).toMatchObject({
        unknownCriticalFieldBehavior: "fail_closed"
      });
      expect(buildAllowedActions(envelope.currentState, envelope.stateHash))
        .toHaveLength(expectedActions);
    }
  );

  it("does not request V2 capabilities for a direct V3 event surface", async () => {
    const calls: string[] = [];
    const adapter = new Sts2ConnectorV3Adapter(
      "http://adapter.test",
      1_000,
      { commandPollMs: 1, commandTimeoutMs: 100 },
      async (input) => {
        const url = String(input);
        calls.push(url);
        if (url.endsWith("/api/v3/capabilities")) return json(connectorCapabilities());
        if (url.endsWith("/api/v3/observation")) return json(eventObservation());
        throw new Error(`Unexpected request ${url}`);
      },
      async () => {}
    );

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());

    expect(calls.some((url) => url.endsWith("/api/v2/capabilities"))).toBe(false);
    expect(envelope.currentState.sourceStateType)
      .toBe("connector_v3:event:event_option:direct");
  });

  it("does not request V2 capabilities for a direct V3 reward surface", async () => {
    const calls: string[] = [];
    const adapter = new Sts2ConnectorV3Adapter(
      "http://adapter.test",
      1_000,
      { commandPollMs: 1, commandTimeoutMs: 100 },
      async (input) => {
        const url = String(input);
        calls.push(url);
        if (url.endsWith("/api/v3/capabilities")) return json(connectorCapabilities());
        if (url.endsWith("/api/v3/observation")) return json(rewardClaimObservation());
        throw new Error(`Unexpected request ${url}`);
      },
      async () => {}
    );

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());

    expect(calls.some((url) => url.endsWith("/api/v2/capabilities"))).toBe(false);
    expect(envelope.currentState.sourceStateType)
      .toBe("connector_v3:reward_flow:reward_claim:direct");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toHaveLength(3);
  });

  it.each([
    ["combat", combatObservation, "combat_turn"],
    ["generated combat choice", generatedCombatChoiceObservation, "generated_card_choice"],
    ["shop inventory", shopInventoryObservation, "shop_inventory"],
    ["rest", restObservation, "rest_site"],
    ["treasure", treasureObservation, "treasure_room"]
  ] as const)(
    "does not request V2 capabilities for direct V3 %s",
    async (_label, buildObservation, expectedSurface) => {
      const calls: string[] = [];
      const adapter = new Sts2ConnectorV3Adapter(
        "http://adapter.test",
        1_000,
        { commandPollMs: 1, commandTimeoutMs: 100 },
        async (input) => {
          const url = String(input);
          calls.push(url);
          if (url.endsWith("/api/v3/capabilities")) return json(connectorCapabilities());
          if (url.endsWith("/api/v3/observation")) return json(buildObservation());
          throw new Error(`Unexpected request ${url}`);
        },
        async () => {}
      );

      const raw = await adapter.readCurrentState();
      const envelope = normalizeCurrentState(raw, adapter.describe());

      expect(calls.some((url) => url.endsWith("/api/v2/capabilities"))).toBe(false);
      expect(envelope.currentState.surface.kind).toBe(expectedSurface);
      expect(envelope.currentState.sourceStateType).toMatch(/:direct$/u);
    }
  );

  it("fails a direct V3 map closed when a candidate binds a non-visible node", () => {
    const observation = mapObservation();
    const candidate = observation.interaction.command_candidates[0]!;
    candidate.operands.map_node_id = "map-node-replacement";
    candidate.entity_bindings[1] = {
      role: "map_node",
      entity_id: "map-node-replacement"
    };
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(envelope.currentState.surface.kind).toBe("unsupported");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("fails a direct V3 reward closed when a candidate binds a replacement entity", () => {
    const observation = rewardClaimObservation();
    const candidate = observation.interaction.command_candidates[0]!;
    candidate.operands.choice_id = "reward-replacement";
    candidate.entity_bindings[1] = { role: "reward", entity_id: "reward-replacement" };
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("fails a direct V3 card reward closed when the advertised card is not selectable", () => {
    const observation = cardRewardObservation();
    const surface = observation.surface as Record<string, unknown>;
    surface.selectable_card_entity_ids = [];
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("fails a direct V3 shop purchase closed when the candidate binds a replacement offer", () => {
    const observation = shopInventoryObservation();
    const candidate = observation.interaction.command_candidates[0]!;
    candidate.operands.shop_offer_id = "shop-offer-replacement";
    candidate.entity_bindings[1] = {
      role: "shop_offer",
      entity_id: "shop-offer-replacement"
    };
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("fails a direct V3 rest choice closed when the current option is disabled", () => {
    const observation = restObservation();
    const surface = observation.surface as unknown as {
      options: Array<{ enabled: boolean }>;
    };
    surface.options[0]!.enabled = false;
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("fails a direct V3 treasure command closed when its stage changes", () => {
    const observation = treasureObservation();
    const surface = observation.surface as unknown as {
      stage: string;
      chest_opened: boolean;
    };
    surface.stage = "completed";
    surface.chest_opened = true;
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("fails a direct menu observation closed when its context flow is inconsistent", () => {
    const observation = mainMenuObservation();
    const raw = observation as unknown as JsonObject;
    raw.context = { kind: "menu", flow: "standard_run_setup" };
    const projected = projectConnectorV3ForRe(
      observation,
      raw,
      { protocol_version: "2.0-preview.86" }
    );

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(envelope.currentState.surface.kind).toBe("unsupported");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });
});
