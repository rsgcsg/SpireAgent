import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import type { AdapterDescriptor } from "../src/game-io/adapter.js";
import { projectConnectorV3ForRe } from "../src/integrations/sts2mcp/connectorV3Projection.js";
import { Sts2ConnectorV3Adapter } from "../src/integrations/sts2mcp/connectorV3Adapter.js";
import {
  decodeConnectorV3ClientRegistration,
  decodeConnectorV3ControllerLeaseResponse,
  decodeConnectorV3Inspection,
  decodeConnectorV3LinkedDetail,
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
      tier: "qualified",
      grant_id: "grant-fixture",
      grant_version: 1,
      runtime_epoch: "fixture-runtime",
      environment_digest: "environment-fixture",
      patch_digest: "patch-fixture",
      operation_fingerprint: "operation-fixture",
      admission_basis: "fixture"
    }],
    compatibility_policy_id: "policy-fixture",
    compatibility_policy_digest: "policy-digest-fixture"
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
    protocol_version: "3.0-preview.11",
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
      can_end_turn: false,
      playable_cards: [{
        entity_id: "card-fixture-1",
        name: "Strike",
        target_entity_ids: ["creature-fixture-1", "creature-fixture-2"]
      }],
      usable_potions: []
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
    linked_detail_catalog: [],
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
    skip_available: true,
    is_peeking: false,
    selectable_card_entity_ids: ["generated-card-1", "generated-card-2"],
    select_operation: "select_generated_combat_card",
    skip_operation: "skip_generated_combat_card_choice",
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

function combatHandObservation(): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  value.surface = {
    kind: "combat_hand_card_selection",
    hand_entity_id: "hand-fixture",
    prompt: "Confirm Card to Upgrade",
    selection_mode: "upgrade_select",
    min_select: 1,
    max_select: 1,
    selected_count: 0,
    selected_card_entity_ids: [],
    require_manual_confirmation: true,
    is_peeking: false,
    selectable_card_entity_ids: ["card-fixture-1"],
    deselectable_card_entity_ids: [],
    can_confirm: false,
    can_close_peek: false,
    cards: [
      {
        entity_id: "card-fixture-1",
        definition_id: "STRIKE_IRONCLAD",
        name: "Strike",
        type: "Attack",
        cost: "1",
        description: "Deal 6 damage.",
        rarity: "Basic",
        is_upgraded: false,
        is_selected: false
      }
    ]
  };
  value.interaction = {
    id: "interaction-combat-hand-fixture",
    kind: "combat_hand_card_selection",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["select_entity"],
    command_candidates: [
      {
        candidate_id: "candidate-combat-hand-select",
        command: "select_entity",
        operation: "select_combat_hand_card",
        label: "Select Strike",
        operands: {
          hand_id: "hand-fixture",
          card_id: "card-fixture-1"
        },
        operand_domains: {},
        entity_bindings: [
          { role: "hand", entity_id: "hand-fixture" },
          { role: "card", entity_id: "card-fixture-1" }
        ],
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      }
    ]
  };
  return decodeConnectorV3Observation(value).data;
}

const SELECTOR_CARD = {
  entity_id: "selector-card-1",
  definition_id: "STRIKE_IRONCLAD",
  name: "Strike",
  type: "Attack",
  cost: "1",
  description: "Deal 6 damage.",
  rarity: "Basic",
  is_upgraded: false,
  is_selected: false
};

function deckTransformObservation(stage: "selecting" | "preview" = "selecting"):
ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as any;
  const selected = stage === "preview";
  value.context = {
    kind: "event",
    event_id: "WHISPERING_HOLLOW",
    name: "Whispering Hollow",
    ancient: false,
    in_dialogue: false
  };
  value.surface = {
    kind: "deck_transform_selection",
    stage,
    screen_entity_id: "transform-screen",
    source: {
      kind: "whispering_hollow_event",
      definition_id: "WHISPERING_HOLLOW",
      binding_evidence: "WhisperingHollow.Hug+CardSelectCmd.FromDeckForTransformation"
    },
    prompt: "Choose a card to transform.",
    min_select: 1,
    max_select: 1,
    selected_count: selected ? 1 : 0,
    selected_card_entity_ids: selected ? [SELECTOR_CARD.entity_id] : [],
    cancelable: true,
    upgrade_toggle_visible: true,
    showing_upgrade_previews: false,
    preview_kind: selected ? "random_uncommitted_cycle" : "none",
    replacement_known: false,
    cards: [{ ...SELECTOR_CARD, is_selected: selected }],
    selectable_card_entity_ids: selected ? [] : [SELECTOR_CARD.entity_id],
    deselectable_card_entity_ids: [],
    can_preview: false,
    can_cancel_selection: !selected,
    can_cancel_preview: selected,
    can_confirm: selected,
    can_toggle_upgrade_view: !selected
  };
  const screen = { role: "screen", entity_id: "transform-screen" };
  const card = { role: "card", entity_id: SELECTOR_CARD.entity_id };
  const control = (operation: string, command: string) => ({
    candidate_id: `candidate-${operation}`,
    command,
    operation,
    label: operation,
    operands: { screen_id: "transform-screen", control_id: operation },
    operand_domains: {},
    entity_bindings: operation === "cancel_deck_transform_selection"
      || operation === "toggle_deck_transform_upgrade_view"
      ? [screen]
      : [screen, card],
    binding_kind: "native_direct_resolver",
    authority_state: "trial"
  });
  value.interaction = {
    id: `interaction-transform-${stage}`,
    kind: "deck_transform_selection",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: selected
      ? ["confirm_interaction", "cancel_interaction"]
      : ["select_entity", "cancel_interaction", "activate_control"],
    command_candidates: selected
      ? [
          control("confirm_deck_transform", "confirm_interaction"),
          control("cancel_deck_transform_preview", "cancel_interaction")
        ]
      : [
          {
            candidate_id: "candidate-transform-select",
            command: "select_entity",
            operation: "toggle_deck_transform_card",
            label: "Select Strike",
            operands: {
              screen_id: "transform-screen",
              card_id: SELECTOR_CARD.entity_id
            },
            operand_domains: {},
            entity_bindings: [screen, card],
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          },
          control("cancel_deck_transform_selection", "cancel_interaction"),
          control("toggle_deck_transform_upgrade_view", "activate_control")
        ]
  };
  return decodeConnectorV3Observation(value).data;
}

function woodCarvingsObservation(stage: "selecting" | "preview" = "selecting"):
ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as any;
  const selected = stage === "preview";
  value.context = {
    kind: "event",
    event_id: "WOOD_CARVINGS",
    name: "Wood Carvings",
    ancient: false,
    in_dialogue: false
  };
  value.surface = {
    kind: "wood_carvings_replacement_selection",
    stage,
    screen_entity_id: "wood-screen",
    prompt: "Choose a card.",
    branch: "bird",
    replacement_definition_id: "PECK",
    replacement_name: "Peck",
    replacement_description: "Replacement",
    min_select: 1,
    max_select: 1,
    selected_count: selected ? 1 : 0,
    selected_card_entity_ids: selected ? [SELECTOR_CARD.entity_id] : [],
    cards: [{ ...SELECTOR_CARD, is_selected: selected }],
    selectable_card_entity_ids: selected ? [] : [SELECTOR_CARD.entity_id],
    can_cancel_preview: selected,
    can_confirm: selected
  };
  const bindings = [
    { role: "screen", entity_id: "wood-screen" },
    { role: "card", entity_id: SELECTOR_CARD.entity_id }
  ];
  const command = (operation: string, kind: string, control = false) => ({
    candidate_id: `candidate-${operation}`,
    command: kind,
    operation,
    label: operation,
    operands: {
      screen_id: "wood-screen",
      ...(control ? { control_id: operation } : { card_id: SELECTOR_CARD.entity_id })
    },
    operand_domains: {},
    entity_bindings: bindings,
    binding_kind: "native_direct_resolver",
    authority_state: "trial"
  });
  value.interaction = {
    id: `interaction-wood-${stage}`,
    kind: "wood_carvings_replacement_selection",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: selected
      ? ["confirm_interaction", "cancel_interaction"]
      : ["select_entity"],
    command_candidates: selected
      ? [
          command("confirm_wood_carvings_replacement", "confirm_interaction", true),
          command("cancel_wood_carvings_replacement_preview", "cancel_interaction", true)
        ]
      : [command("select_wood_carvings_replacement_card", "select_entity")]
  };
  return decodeConnectorV3Observation(value).data;
}

function combatPileObservation(selected = false): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as any;
  value.surface = {
    kind: "combat_pile_card_selection",
    screen_entity_id: "pile-screen",
    prompt: "Choose up to 1 card.",
    purpose: "move selected card",
    mutation_kind: "move_selected_cards",
    commit_mode: "manual_confirm",
    source_kind: "cleanse",
    source_entity_kind: "card",
    source_entity_id: "source-card",
    source_definition_id: "CLEANSE",
    source_card_entity_id: "source-card",
    source_card_definition_id: "CLEANSE",
    pile_type: "discard",
    destination_pile: "draw",
    destination_position: "top",
    overflow_destination: null,
    replacement_card_definition_id: null,
    min_select: 0,
    max_select: 1,
    selected_count: selected ? 1 : 0,
    selected_card_entity_ids: selected ? [SELECTOR_CARD.entity_id] : [],
    require_manual_confirmation: true,
    cancelable: false,
    cards: [{ ...SELECTOR_CARD, is_selected: selected }],
    selectable_card_entity_ids: selected ? [] : [SELECTOR_CARD.entity_id],
    deselectable_card_entity_ids: selected ? [SELECTOR_CARD.entity_id] : [],
    can_confirm: selected
  };
  const bindings = [
    { role: "screen", entity_id: "pile-screen" },
    { role: "source", entity_id: "source-card" },
    { role: "card", entity_id: SELECTOR_CARD.entity_id }
  ];
  value.interaction = {
    id: `interaction-pile-${selected}`,
    kind: "combat_pile_card_selection",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: selected
      ? ["deselect_entity", "confirm_interaction"]
      : ["select_entity"],
    command_candidates: [
      {
        candidate_id: "candidate-pile-toggle",
        command: selected ? "deselect_entity" : "select_entity",
        operation: "toggle_combat_pile_card",
        label: selected ? "Deselect Strike" : "Select Strike",
        operands: {
          screen_id: "pile-screen",
          source_id: "source-card",
          card_id: SELECTOR_CARD.entity_id
        },
        operand_domains: {},
        entity_bindings: bindings,
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      },
      ...(selected ? [{
        candidate_id: "candidate-pile-confirm",
        command: "confirm_interaction",
        operation: "confirm_combat_pile_selection",
        label: "Confirm selected cards",
        operands: {
          screen_id: "pile-screen",
          source_id: "source-card",
          control_id: "confirm_combat_pile_selection"
        },
        operand_domains: {},
        entity_bindings: bindings,
        binding_kind: "native_direct_resolver",
        authority_state: "trial"
      }] : [])
    ]
  };
  return decodeConnectorV3Observation(value).data;
}

function deckUpgradeObservation(stage: "selecting" | "preview" = "selecting"):
ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  const cards = [
    {
      entity_id: "deck-card-1",
      definition_id: "STRIKE_IRONCLAD",
      name: "Strike",
      type: "Attack",
      cost: "1",
      description: "Deal 6 damage.",
      rarity: "Basic",
      is_upgraded: false,
      is_selected: stage === "preview"
    },
    {
      entity_id: "deck-card-2",
      definition_id: "DEFEND_IRONCLAD",
      name: "Defend",
      type: "Skill",
      cost: "1",
      description: "Gain 5 Block.",
      rarity: "Basic",
      is_upgraded: false,
      is_selected: false
    }
  ];
  value.context = { kind: "rest" };
  value.surface = stage === "selecting"
    ? {
        kind: "deck_upgrade_selection",
        stage,
        screen_entity_id: "upgrade-screen-fixture",
        prompt: "Choose a card to Upgrade.",
        min_select: 1,
        max_select: 1,
        selected_count: 0,
        selected_card_entity_ids: [],
        cancelable: true,
        selectable_card_entity_ids: ["deck-card-1", "deck-card-2"],
        deselectable_card_entity_ids: [],
        can_cancel_selection: true,
        can_cancel_preview: false,
        can_confirm: false,
        cards,
        preview_cards: []
      }
    : {
        kind: "deck_upgrade_selection",
        stage,
        screen_entity_id: "upgrade-screen-fixture",
        prompt: "Confirm Upgrade.",
        min_select: 1,
        max_select: 1,
        selected_count: 1,
        selected_card_entity_ids: ["deck-card-1"],
        cancelable: true,
        selectable_card_entity_ids: [],
        deselectable_card_entity_ids: [],
        can_cancel_selection: false,
        can_cancel_preview: true,
        can_confirm: true,
        cards,
        preview_cards: [{
          ...cards[0],
          entity_id: "upgrade-preview-card-1",
          name: "Strike+",
          description: "Deal 9 damage.",
          is_upgraded: true,
          is_selected: false
        }]
      };
  value.interaction = {
    id: `interaction-deck-upgrade-${stage}`,
    kind: "deck_upgrade_selection",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: stage === "selecting"
      ? ["select_entity", "cancel_interaction"]
      : ["confirm_interaction", "cancel_interaction"],
    command_candidates: stage === "selecting"
      ? [
          ...cards.map((card) => ({
            candidate_id: `candidate-upgrade-${card.entity_id}`,
            command: "select_entity",
            operation: "toggle_deck_upgrade_card",
            label: `Select ${card.name}`,
            operands: {
              screen_id: "upgrade-screen-fixture",
              card_id: card.entity_id
            },
            operand_domains: {},
            entity_bindings: [
              { role: "screen", entity_id: "upgrade-screen-fixture" },
              { role: "card", entity_id: card.entity_id }
            ],
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          })),
          {
            candidate_id: "candidate-upgrade-cancel",
            command: "cancel_interaction",
            operation: "cancel_deck_upgrade_selection",
            label: "Cancel deck upgrade selection",
            operands: {
              screen_id: "upgrade-screen-fixture",
              control_id: "cancel_deck_upgrade_selection"
            },
            operand_domains: {},
            entity_bindings: [
              { role: "screen", entity_id: "upgrade-screen-fixture" }
            ],
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          }
        ]
      : [
          {
            candidate_id: "candidate-upgrade-return",
            command: "cancel_interaction",
            operation: "cancel_deck_upgrade_preview",
            label: "Return to upgrade selection",
            operands: {
              screen_id: "upgrade-screen-fixture",
              control_id: "cancel_deck_upgrade_preview"
            },
            operand_domains: {},
            entity_bindings: [
              { role: "screen", entity_id: "upgrade-screen-fixture" }
            ],
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          },
          {
            candidate_id: "candidate-upgrade-confirm",
            command: "confirm_interaction",
            operation: "confirm_deck_upgrade",
            label: "Confirm the visible card upgrade",
            operands: {
              screen_id: "upgrade-screen-fixture",
              control_id: "confirm_deck_upgrade"
            },
            operand_domains: {},
            entity_bindings: [
              { role: "screen", entity_id: "upgrade-screen-fixture" },
              { role: "card", entity_id: "deck-card-1" }
            ],
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          }
        ]
  };
  return decodeConnectorV3Observation(value).data;
}

function deckEnchantObservation(stage: "selecting" | "preview" = "selecting"):
ConnectorV3Observation {
  const value = structuredClone(eventObservation()) as unknown as any;
  const card = {
    entity_id: "enchant-card-fixture",
    definition_id: "STRIKE_IRONCLAD",
    name: "Strike",
    type: "Attack",
    cost: "1",
    description: "Deal 6 damage.",
    rarity: "Basic",
    is_upgraded: false,
    is_selected: stage === "preview"
  };
  value.context = {
    kind: "event",
    event_id: "SYMBIOTE",
    name: "Symbiote",
    ancient: false,
    in_dialogue: false,
    body: "Choose a card."
  };
  value.surface = {
    kind: "deck_enchant_selection",
    stage,
    screen_entity_id: "enchant-screen-fixture",
    source: {
      kind: "symbiote_event",
      definition_id: "SYMBIOTE",
      binding_evidence: "Symbiote+exact-task"
    },
    prompt: "Choose a card to enchant.",
    min_select: 1,
    max_select: 1,
    selected_count: stage === "preview" ? 1 : 0,
    selected_card_entity_ids: stage === "preview" ? [card.entity_id] : [],
    cancelable: true,
    enchantment: {
      definition_id: "FIXTURE_ENCHANTMENT",
      name: "Fixture",
      description: "Fixture enchantment.",
      amount: 1,
      observation_source: "current_screen"
    },
    cards: [card],
    selectable_card_entity_ids: stage === "selecting" ? [card.entity_id] : [],
    deselectable_card_entity_ids: [],
    can_preview: false,
    can_close_selection: stage === "selecting",
    can_confirm: stage === "preview",
    can_cancel_preview: stage === "preview"
  };
  const screenBinding = { role: "screen", entity_id: "enchant-screen-fixture" };
  value.interaction = {
    id: `interaction-deck-enchant-${stage}`,
    kind: "deck_enchant_selection",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: stage === "selecting"
      ? ["select_entity", "cancel_interaction"]
      : ["confirm_interaction", "cancel_interaction"],
    command_candidates: stage === "selecting"
      ? [{
          candidate_id: "candidate-enchant-select",
          command: "select_entity",
          operation: "toggle_card",
          label: "Select Strike",
          operands: {
            screen_id: "enchant-screen-fixture",
            card_id: card.entity_id
          },
          operand_domains: {},
          entity_bindings: [screenBinding, { role: "card", entity_id: card.entity_id }],
          binding_kind: "native_direct_resolver",
          authority_state: "trial"
        }, {
          candidate_id: "candidate-enchant-close",
          command: "cancel_interaction",
          operation: "close_selection",
          label: "Close enchant selection",
          operands: {
            screen_id: "enchant-screen-fixture",
            control_id: "close_selection"
          },
          operand_domains: {},
          entity_bindings: [screenBinding],
          binding_kind: "native_direct_resolver",
          authority_state: "trial"
        }]
      : [{
          candidate_id: "candidate-enchant-confirm",
          command: "confirm_interaction",
          operation: "confirm_selection",
          label: "Apply enchantment",
          operands: {
            screen_id: "enchant-screen-fixture",
            control_id: "confirm_selection"
          },
          operand_domains: {},
          entity_bindings: [screenBinding, { role: "card", entity_id: card.entity_id }],
          binding_kind: "native_direct_resolver",
          authority_state: "trial"
        }, {
          candidate_id: "candidate-enchant-return",
          command: "cancel_interaction",
          operation: "cancel_preview",
          label: "Return to selection",
          operands: {
            screen_id: "enchant-screen-fixture",
            control_id: "cancel_preview"
          },
          operand_domains: {},
          entity_bindings: [screenBinding],
          binding_kind: "native_direct_resolver",
          authority_state: "trial"
        }]
  };
  return decodeConnectorV3Observation(value).data;
}

function eventDialogueObservation(): ConnectorV3Observation {
  const value = structuredClone(eventObservation()) as unknown as any;
  value.context.in_dialogue = true;
  value.surface = {
    kind: "event_dialogue",
    screen_entity_id: "dialogue-screen-fixture",
    current_line_index: 1,
    revealed_lines: [{
      entity_id: "dialogue-line-0",
      index: 0,
      text: "The first visible line.",
      speaker: "ancient",
      is_current: false
    }, {
      entity_id: "dialogue-line-1",
      index: 1,
      text: "The current visible line.",
      speaker: "character",
      is_current: true
    }],
    advance_label: "Continue",
    can_advance: true
  };
  value.interaction = {
    id: "interaction-event-dialogue",
    kind: "event_dialogue",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: ["activate_control"],
    command_candidates: [{
      candidate_id: "candidate-dialogue-advance",
      command: "activate_control",
      operation: "advance_event_dialogue",
      label: "Continue",
      operands: {
        screen_id: "dialogue-screen-fixture",
        dialogue_line_id: "dialogue-line-1",
        control_id: "advance_event_dialogue"
      },
      operand_domains: {},
      entity_bindings: [
        { role: "screen", entity_id: "dialogue-screen-fixture" },
        { role: "dialogue_line", entity_id: "dialogue-line-1" }
      ],
      binding_kind: "native_direct_resolver",
      authority_state: "trial"
    }]
  };
  return decodeConnectorV3Observation(value).data;
}

function merchantRemovalObservation(stage: "selecting" | "preview" = "selecting"):
ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  const card = {
    entity_id: "merchant-removal-card-1",
    definition_id: "STRIKE_IRONCLAD",
    name: "Strike",
    type: "Attack",
    cost: "1",
    description: "Deal 6 damage.",
    rarity: "Basic",
    is_upgraded: false,
    is_selected: stage === "preview"
  };
  value.context = { kind: "shop" };
  value.surface = {
    kind: "deck_removal_selection",
    stage,
    screen_entity_id: "merchant-removal-screen",
    prompt: stage === "selecting" ? "Choose a card to remove." : "Confirm removal.",
    min_select: 1,
    max_select: 1,
    selected_count: stage === "preview" ? 1 : 0,
    selected_card_entity_ids: stage === "preview" ? [card.entity_id] : [],
    cancelable: true,
    selectable_card_entity_ids: stage === "selecting" ? [card.entity_id] : [],
    deselectable_card_entity_ids: [],
    can_preview: false,
    can_cancel_selection: stage === "selecting",
    can_cancel_preview: stage === "preview",
    can_confirm: stage === "preview",
    cards: [card]
  };
  value.interaction = {
    id: `interaction-merchant-removal-${stage}`,
    kind: "deck_removal_selection",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: stage === "selecting"
      ? ["select_entity", "cancel_interaction"]
      : ["confirm_interaction", "cancel_interaction"],
    command_candidates: stage === "selecting"
      ? [
          {
            candidate_id: "candidate-merchant-removal-select",
            command: "select_entity",
            operation: "toggle_deck_removal_card",
            label: "Select Strike to remove",
            operands: {
              screen_id: "merchant-removal-screen",
              card_id: card.entity_id
            },
            operand_domains: {},
            entity_bindings: [
              { role: "screen", entity_id: "merchant-removal-screen" },
              { role: "card", entity_id: card.entity_id }
            ],
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          },
          {
            candidate_id: "candidate-merchant-removal-cancel",
            command: "cancel_interaction",
            operation: "cancel_deck_removal_selection",
            label: "Cancel card removal",
            operands: {
              screen_id: "merchant-removal-screen",
              control_id: "cancel_deck_removal_selection"
            },
            operand_domains: {},
            entity_bindings: [
              { role: "screen", entity_id: "merchant-removal-screen" }
            ],
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          }
        ]
      : [
          {
            candidate_id: "candidate-merchant-removal-return",
            command: "cancel_interaction",
            operation: "cancel_deck_removal_preview",
            label: "Return to removal selection",
            operands: {
              screen_id: "merchant-removal-screen",
              control_id: "cancel_deck_removal_preview"
            },
            operand_domains: {},
            entity_bindings: [
              { role: "screen", entity_id: "merchant-removal-screen" }
            ],
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          },
          {
            candidate_id: "candidate-merchant-removal-confirm",
            command: "confirm_interaction",
            operation: "confirm_deck_removal",
            label: "Confirm removal of Strike",
            operands: {
              screen_id: "merchant-removal-screen",
              control_id: "confirm_deck_removal"
            },
            operand_domains: {},
            entity_bindings: [
              { role: "screen", entity_id: "merchant-removal-screen" },
              { role: "card", entity_id: card.entity_id }
            ],
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          }
        ]
  };
  return decodeConnectorV3Observation(value).data;
}

function eventRemovalObservation(stage: "selecting" | "preview" = "selecting"):
ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  const cards = ["STRIKE_IRONCLAD", "DEFEND_IRONCLAD"].map((definitionId, index) => ({
    entity_id: `event-removal-card-${index + 1}`,
    definition_id: definitionId,
    name: index === 0 ? "Strike" : "Defend",
    type: index === 0 ? "Attack" : "Skill",
    cost: "1",
    description: index === 0 ? "Deal 6 damage." : "Gain 5 Block.",
    rarity: "Basic",
    is_upgraded: false,
    is_selected: stage === "preview"
  }));
  const selectedIds = stage === "preview" ? cards.map((card) => card.entity_id) : [];
  value.context = {
    kind: "event",
    event_id: "LUMINOUS_CHOIR",
    name: "Luminous Choir",
    ancient: false,
    in_dialogue: false,
    body: "Reach into the flesh."
  };
  value.surface = {
    kind: "event_deck_removal_selection",
    stage,
    screen_entity_id: "event-removal-screen",
    source_kind: "luminous_choir_reach_into_flesh",
    purpose: "remove_two_cards_then_gain_spore_mind",
    expected_effects: ["remove_selected_cards", "add_spore_mind", "finish_event"],
    prompt: stage === "selecting" ? "Choose two cards to remove." : "Confirm removal.",
    min_select: 2,
    max_select: 2,
    selected_count: selectedIds.length,
    selected_card_entity_ids: selectedIds,
    selectable_card_entity_ids: stage === "selecting" ? cards.map((card) => card.entity_id) : [],
    deselectable_card_entity_ids: [],
    can_cancel_preview: stage === "preview",
    can_confirm: stage === "preview",
    cards
  };
  value.interaction = {
    id: `interaction-event-removal-${stage}`,
    kind: "event_deck_removal_selection",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: stage === "selecting"
      ? ["select_entity"]
      : ["confirm_interaction", "cancel_interaction"],
    command_candidates: stage === "selecting"
      ? cards.map((card) => ({
          candidate_id: `candidate-event-removal-${card.entity_id}`,
          command: "select_entity",
          operation: "toggle_event_deck_removal_card",
          label: `Select ${card.name}`,
          operands: {
            screen_id: "event-removal-screen",
            card_id: card.entity_id
          },
          operand_domains: {},
          entity_bindings: [
            { role: "screen", entity_id: "event-removal-screen" },
            { role: "card", entity_id: card.entity_id }
          ],
          binding_kind: "native_direct_resolver",
          authority_state: "trial"
        }))
      : [
          {
            candidate_id: "candidate-event-removal-return",
            command: "cancel_interaction",
            operation: "cancel_event_deck_removal_preview",
            label: "Return to event card selection",
            operands: {
              screen_id: "event-removal-screen",
              control_id: "cancel_event_deck_removal_preview"
            },
            operand_domains: {},
            entity_bindings: [
              { role: "screen", entity_id: "event-removal-screen" },
              ...selectedIds.map((entityId) => ({ role: "card", entity_id: entityId }))
            ],
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          },
          {
            candidate_id: "candidate-event-removal-confirm",
            command: "confirm_interaction",
            operation: "confirm_event_deck_removal",
            label: "Confirm event card removal",
            operands: {
              screen_id: "event-removal-screen",
              control_id: "confirm_event_deck_removal"
            },
            operand_domains: {},
            entity_bindings: [
              { role: "screen", entity_id: "event-removal-screen" },
              ...selectedIds.map((entityId) => ({ role: "card", entity_id: entityId }))
            ],
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          }
        ]
  };
  return decodeConnectorV3Observation(value).data;
}

function sourceRemovalObservation(
  kind: "relic_deck_removal_selection" | "reward_deck_removal_selection",
  stage: "selecting" | "preview" = "selecting"
): ConnectorV3Observation {
  const value = structuredClone(merchantRemovalObservation(stage)) as unknown as any;
  const screenId = kind === "relic_deck_removal_selection"
    ? "precise-scissors-removal-screen"
    : "reward-removal-screen";
  value.context = kind === "relic_deck_removal_selection"
    ? {
        kind: "event",
        event_id: "NEOW",
        name: "Neow",
        ancient: true,
        in_dialogue: false
      }
    : { kind: "reward_flow", reward_kind: "room_rewards" };
  value.surface.kind = kind;
  value.surface.screen_entity_id = screenId;
  value.surface.cancelable = kind === "reward_deck_removal_selection";
  value.surface.can_cancel_selection = kind === "reward_deck_removal_selection"
    && stage === "selecting";
  value.interaction.id = `interaction-${kind}-${stage}`;
  value.interaction.kind = kind;
  value.interaction.command_candidates = value.interaction.command_candidates
    .filter((candidate: any) => kind === "reward_deck_removal_selection"
      || candidate.operation !== "cancel_deck_removal_selection")
    .map((candidate: any) => ({
      ...candidate,
      operands: { ...candidate.operands, screen_id: screenId },
      entity_bindings: candidate.entity_bindings.map((binding: any) =>
        binding.role === "screen" ? { ...binding, entity_id: screenId } : binding)
    }));
  return decodeConnectorV3Observation(value).data;
}

function cardBundleObservation(
  stage: "choosing" | "preview" = "choosing"
): ConnectorV3Observation {
  const value = structuredClone(combatObservation()) as unknown as Record<string, unknown>;
  const bundleId = "scroll-boxes-bundle-1";
  value.context = { kind: "reward_flow", reward_kind: "room_rewards" };
  value.surface = {
    kind: "card_bundle_selection",
    stage,
    screen_entity_id: "scroll-boxes-screen",
    prompt: "Choose one visible bundle.",
    selected_bundle_entity_id: stage === "preview" ? bundleId : null,
    selectable_bundle_entity_ids: stage === "choosing" ? [bundleId] : [],
    can_confirm: stage === "preview",
    can_cancel_preview: stage === "preview",
    bundles: [{
      entity_id: bundleId,
      cards: [{
        entity_id: "scroll-boxes-card-1",
        definition_id: "STRIKE_IRONCLAD",
        name: "Strike",
        type: "Attack",
        cost: "1",
        description: "Deal 6 damage.",
        rarity: "Basic",
        is_upgraded: false,
        is_selected: false
      }]
    }]
  };
  const base = {
    screen_id: "scroll-boxes-screen",
    bundle_id: bundleId
  };
  const bindings = [
    { role: "screen", entity_id: "scroll-boxes-screen" },
    { role: "bundle", entity_id: bundleId }
  ];
  value.interaction = {
    id: `interaction-card-bundle-${stage}`,
    kind: "card_bundle_selection",
    phase: "ready",
    execution_support: "trial",
    support_reason: null,
    affordances: stage === "choosing"
      ? ["select_entity"]
      : ["confirm_interaction", "cancel_interaction"],
    command_candidates: stage === "choosing"
      ? [{
          candidate_id: "candidate-card-bundle-preview",
          command: "select_entity",
          operation: "preview_card_bundle",
          label: "Preview bundle: Strike",
          operands: base,
          operand_domains: {},
          entity_bindings: bindings,
          binding_kind: "native_direct_resolver",
          authority_state: "trial"
        }]
      : [
          {
            candidate_id: "candidate-card-bundle-confirm",
            command: "confirm_interaction",
            operation: "confirm_card_bundle",
            label: "Add the previewed bundle to the run deck",
            operands: { ...base, control_id: "confirm_card_bundle" },
            operand_domains: {},
            entity_bindings: bindings,
            binding_kind: "native_direct_resolver",
            authority_state: "trial"
          },
          {
            candidate_id: "candidate-card-bundle-cancel",
            command: "cancel_interaction",
            operation: "cancel_card_bundle_preview",
            label: "Return to bundle choices",
            operands: { ...base, control_id: "cancel_card_bundle_preview" },
            operand_domains: {},
            entity_bindings: bindings,
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
    annotation_input_entity_id: null,
    can_exit_annotation: false,
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
    protocol_version: "3.0-preview.11",
    observation_schema: "sts2.connector.v3/observation-1",
    command_schema: "sts2.connector.v3/command-1",
    inspection_schema: "sts2.connector.v3/inspection-1",
    linked_detail_schema: "sts2.connector.v3/linked-detail-1",
    control_schema: "sts2.connector.v3/control-1",
    human_equivalence_schema: "sts2.connector.v3/human-equivalence-1",
    status: "experimental_cutover",
    bridge: BRIDGE,
    game: GAME,
    commands: ["activate_control"],
    control: { recommended_renewal_ms: 10_000 },
    permission_system: {
      schema_version: 1,
      status: "session_scoped",
      mode: "migration_exploration",
      runtime_epoch: BRIDGE.runtime_instance_id,
      policy_id: "policy-fixture",
      policy_digest: "policy-digest-fixture",
      dynamic_session_promotion_enabled: false,
      patch_inventory: {
        status: "clean_known_owners",
        digest: "patch-fixture",
        scope: "fixture",
        patched_method_count: 1,
        patch_owners: ["fixture-owner"],
        unknown_owners: [],
        limitations: []
      },
      grants: [],
      limitations: []
    },
    qualification_system: {
      schema_version: 2,
      status: "empty",
      store_id: "fixture-store",
      store_digest: "fixture-store-digest",
      current_environment_digest: "environment-fixture",
      operation_catalog_id: "fixture-catalog",
      operation_catalog_digest: "fixture-catalog-digest",
      persistent_authority_enabled: false,
      session_canary_candidate_enabled: true,
      operation_contracts: [],
      qualifications: [],
      limitations: []
    },
    human_equivalence: {
      profile: "native_pages.v1",
      enabled: false,
      supported_kinds: [
        "run_deck",
        "combat_draw_pile",
        "combat_discard_pile",
        "combat_exhaust_pile",
        "shop_catalog"
      ],
      state_bound: true,
      runtime_bound: true,
      default_in_agent_flow: false,
      creates_action_authority: false,
      enters_command_ledger: false
    },
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
  it("strictly decodes V3-native control registration and leases", () => {
    const client = {
      client_session_id: "client-fixture",
      client_instance_id: "re-fixture",
      product_id: "re-spireagent",
      product_name: "Re-SpireAgent",
      product_version: "0.1.0",
      registered_at: "2026-08-03T00:00:00Z",
      last_seen_at: "2026-08-03T00:00:00Z"
    };
    const registration = decodeConnectorV3ClientRegistration({
      protocol_version: "3.0-preview.11",
      schema: "sts2.connector.v3/control-1",
      runtime_instance_id: "fixture-runtime",
      client
    }).data;
    const lease = decodeConnectorV3ControllerLeaseResponse({
      protocol_version: "3.0-preview.11",
      schema: "sts2.connector.v3/control-1",
      runtime_instance_id: "fixture-runtime",
      status: "controller_acquired",
      detail: "acquired",
      client,
      controller: {
        status: "active",
        controller_lease_id: "lease-fixture",
        controller_generation: 1,
        client_session_id: "client-fixture",
        acquired_at: "2026-08-03T00:00:00Z",
        expires_at: "2026-08-03T00:01:00Z"
      }
    }).data;

    expect(registration.protocol_version).toBe("3.0-preview.11");
    expect(lease.controller?.client_session_id)
      .toBe(registration.client.client_session_id);
    expect(() => decodeConnectorV3ClientRegistration({
      ...registration,
      protocol_version: "2.0-preview.3"
    })).toThrow("Connector v3 client registration");
  });

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
      protocol_version: "3.0-preview.11",
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
      protocol_version: "3.0-preview.11",
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
      protocol_version: "3.0-preview.11",
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

  it("decodes only state-bound linked card detail for the exact entity", () => {
    const detail = {
      protocol_version: "3.0-preview.11",
      schema: "sts2.connector.v3/linked-detail-1",
      detail_id: "detail-fixture",
      expected_state_token: "state-fixture-1",
      observed_state_token: "state-fixture-1",
      observed_at: "2026-08-02T00:00:00Z",
      kind: "surface_card",
      entity_id: "deck-card-1",
      content: {
        entity_id: "deck-card-1",
        definition_id: "STRIKE_IRONCLAD",
        name: "Strike",
        type: "Attack",
        cost: "1",
        description: "Deal 6 damage.",
        rarity: "Basic",
        is_upgraded: false,
        is_selected: false
      },
      bridge: BRIDGE,
      game: GAME,
      observation_policy: {
        id: "player_visible_ui_v1",
        scope: "visible",
        includes_hidden_information: false,
        unknown_field_behavior: "omit_and_mark_incomplete"
      },
      diagnostics: []
    };

    expect(decodeConnectorV3LinkedDetail(detail).data.content.definition_id)
      .toBe("STRIKE_IRONCLAD");
    expect(() => decodeConnectorV3LinkedDetail({
      ...detail,
      observed_state_token: "state-replacement"
    })).toThrow("expected and observed state tokens must match");
    expect(() => decodeConnectorV3LinkedDetail({
      ...detail,
      entity_id: "replacement-card"
    })).toThrow("entity does not match");
  });

  it("expands only Gateway-provided operand domains into local opaque choices", () => {
    const observation = combatObservation();
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
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
        canEndTurn: false
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toHaveLength(2);
  });

  it("consumes combat-hand selection with exact owner and card operands", () => {
    const observation = combatHandObservation();
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );
    const wrapper = projected.rawState as Record<string, unknown>;

    expect(wrapper.bridge_v2_state).toBeUndefined();
    expect(wrapper.bridge_v2_capabilities).toBeUndefined();
    expect([...projected.invocations.values()]).toEqual([
      expect.objectContaining({
        command: "select_entity",
        operation: "select_combat_hand_card",
        operands: {
          hand_id: "hand-fixture",
          card_id: "card-fixture-1"
        }
      })
    ]);
    const envelope = normalizeCurrentState(projected.rawState, SOURCE);
    expect(envelope.diagnostics.status).toBe("ok");
    expect(envelope.currentState).toMatchObject({
      sourceStateType: "connector_v3:combat:combat_hand_card_selection:direct",
      context: { kind: "combat" },
      surface: {
        kind: "combat_hand_card_selection",
        handEntityId: "hand-fixture",
        selectionMode: "upgrade_select"
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toHaveLength(1);
  });

  it("rejects a combat-hand command bound to a different hand owner", () => {
    const observation = combatHandObservation();
    observation.interaction.command_candidates[0]!.operands.hand_id = "hand-replacement";
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );
    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.diagnostics.status).toBe("invalid");
    expect(envelope.diagnostics.invalidFields).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: "connector_v3_observation.interaction.command_candidates"
      })
    ]));
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("consumes deck-upgrade selecting and preview stages without V2 sidecars", () => {
    const selecting = deckUpgradeObservation("selecting");
    const selected = projectConnectorV3ForRe(
      selecting,
      selecting as unknown as JsonObject
    );
    const selectingWrapper = selected.rawState as Record<string, unknown>;
    expect(selectingWrapper.bridge_v2_state).toBeUndefined();
    expect(selectingWrapper.bridge_v2_capabilities).toBeUndefined();
    const selectingEnvelope = normalizeCurrentState(selected.rawState, SOURCE);
    expect(selectingEnvelope.diagnostics.status).toBe("ok");
    expect(selectingEnvelope.currentState).toMatchObject({
      sourceStateType: "connector_v3:rest:deck_upgrade_selection:direct",
      context: { kind: "rest" },
      surface: {
        kind: "deck_upgrade_selection",
        stage: "selecting",
        screenEntityId: "upgrade-screen-fixture",
        selectedCount: 0
      }
    });
    expect(buildAllowedActions(
      selectingEnvelope.currentState,
      selectingEnvelope.stateHash
    )).toHaveLength(3);

    const preview = deckUpgradeObservation("preview");
    const projectedPreview = projectConnectorV3ForRe(
      preview,
      preview as unknown as JsonObject
    );
    const previewEnvelope = normalizeCurrentState(projectedPreview.rawState, SOURCE);
    expect(previewEnvelope.diagnostics.status).toBe("ok");
    expect(previewEnvelope.currentState.surface).toMatchObject({
      kind: "deck_upgrade_selection",
      stage: "preview",
      selectedCardEntityIds: ["deck-card-1"],
      previewCards: [{ entityId: "upgrade-preview-card-1", upgraded: true }]
    });
    expect([...projectedPreview.invocations.values()]).toEqual(expect.arrayContaining([
      expect.objectContaining({
        command: "confirm_interaction",
        operation: "confirm_deck_upgrade"
      }),
      expect.objectContaining({
        command: "cancel_interaction",
        operation: "cancel_deck_upgrade_preview"
      })
    ]));
    expect(buildAllowedActions(
      previewEnvelope.currentState,
      previewEnvelope.stateHash
    )).toHaveLength(2);
  });

  it("keeps direct deck-upgrade select and deselect semantics distinct", () => {
    const value = structuredClone(deckUpgradeObservation("selecting")) as unknown as any;
    value.surface.selected_count = 1;
    value.surface.selected_card_entity_ids = ["deck-card-1"];
    value.surface.selectable_card_entity_ids = ["deck-card-2"];
    value.surface.deselectable_card_entity_ids = ["deck-card-1"];
    value.surface.cards[0].is_selected = true;
    value.interaction.command_candidates[0].command = "deselect_entity";
    value.interaction.command_candidates[0].label = "Deselect Strike";
    const observation = decodeConnectorV3Observation(value).data;
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );
    const commands = [...projected.invocations.values()];

    expect(commands).toEqual(expect.arrayContaining([
      expect.objectContaining({
        command: "deselect_entity",
        operands: expect.objectContaining({ card_id: "deck-card-1" })
      }),
      expect.objectContaining({
        command: "select_entity",
        operands: expect.objectContaining({ card_id: "deck-card-2" })
      })
    ]));
    expect(normalizeCurrentState(projected.rawState, SOURCE).diagnostics.status).toBe("ok");
  });

  it("fails closed when deck-upgrade owner or selected confirmation binding drifts", () => {
    const wrongOwner = deckUpgradeObservation("selecting");
    wrongOwner.interaction.command_candidates[0]!.operands.screen_id = "replacement-screen";
    const wrongOwnerProjection = projectConnectorV3ForRe(
      wrongOwner,
      wrongOwner as unknown as JsonObject
    );
    expect(normalizeCurrentState(wrongOwnerProjection.rawState, SOURCE).diagnostics.status)
      .toBe("invalid");

    const wrongMembership = deckUpgradeObservation("preview");
    const confirm = wrongMembership.interaction.command_candidates.find(
      (candidate) => candidate.operation === "confirm_deck_upgrade"
    )!;
    confirm.entity_bindings = confirm.entity_bindings.filter(
      (binding) => binding.role !== "card"
    );
    const wrongMembershipProjection = projectConnectorV3ForRe(
      wrongMembership,
      wrongMembership as unknown as JsonObject
    );
    const envelope = normalizeCurrentState(wrongMembershipProjection.rawState, SOURCE);
    expect(envelope.diagnostics.status).toBe("invalid");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it.each([
    ["selecting", 2],
    ["preview", 2]
  ] as const)("consumes deck-enchant %s directly without a V2 sidecar", (stage, count) => {
    const observation = deckEnchantObservation(stage);
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );
    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.diagnostics.status).toBe("ok");
    expect(envelope.currentState).toMatchObject({
      sourceStateType: "connector_v3:event:deck_enchant_selection:direct",
      surface: {
        kind: "deck_enchant_selection",
        stage,
        screenEntityId: "enchant-screen-fixture"
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toHaveLength(count);
  });

  it("consumes only the revealed current event-dialogue line", () => {
    const observation = eventDialogueObservation();
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );
    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.diagnostics.status).toBe("ok");
    expect(envelope.currentState).toMatchObject({
      sourceStateType: "connector_v3:event:event_dialogue:direct",
      surface: {
        kind: "event_dialogue",
        currentLineIndex: 1,
        revealedLines: [
          { index: 0, isCurrent: false },
          { index: 1, isCurrent: true }
        ]
      }
    });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toHaveLength(1);
  });

  it("rejects an unrevealed future dialogue line and grants no action authority", () => {
    const value = structuredClone(eventDialogueObservation()) as unknown as any;
    value.surface.revealed_lines.push({
      entity_id: "dialogue-line-2",
      index: 2,
      text: "A future hidden line.",
      speaker: "ancient",
      is_current: false
    });

    const observation = decodeConnectorV3Observation(value).data;
    const projected = projectConnectorV3ForRe(
      observation,
      value as JsonObject
    );
    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.diagnostics.status).toBe("invalid");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it.each([
    ["deck transform selecting", () => deckTransformObservation("selecting"), "event", "deck_transform_selection", 3],
    ["deck transform preview", () => deckTransformObservation("preview"), "event", "deck_transform_selection", 2],
    ["Wood Carvings selecting", () => woodCarvingsObservation("selecting"), "event", "wood_carvings_replacement_selection", 1],
    ["Wood Carvings preview", () => woodCarvingsObservation("preview"), "event", "wood_carvings_replacement_selection", 2],
    ["combat pile selecting", () => combatPileObservation(false), "combat", "combat_pile_card_selection", 1],
    ["combat pile selected", () => combatPileObservation(true), "combat", "combat_pile_card_selection", 2]
  ] as const)(
    "consumes %s directly without a V2 sidecar",
    (_label, buildObservation, contextKind, surfaceKind, actionCount) => {
      const observation = buildObservation();
      const projection = projectConnectorV3ForRe(
        observation,
        observation as unknown as JsonObject
      );
      const wrapper = projection.rawState as Record<string, unknown>;
      expect(wrapper.bridge_v2_state).toBeUndefined();
      expect(wrapper.bridge_v2_capabilities).toBeUndefined();
      const envelope = normalizeCurrentState(projection.rawState, SOURCE);
      expect(envelope.diagnostics.status).toBe("ok");
      expect(envelope.currentState).toMatchObject({
        sourceStateType:
          `connector_v3:${observation.context.kind}:${observation.surface.kind}:direct`,
        context: { kind: contextKind },
        surface: { kind: surfaceKind }
      });
      expect(buildAllowedActions(envelope.currentState, envelope.stateHash))
        .toHaveLength(actionCount);
    }
  );

  it("fails a generated-card choice closed on source-operation drift", () => {
    const observation = generatedCombatChoiceObservation();
    observation.interaction.command_candidates[0]!.operation = "choose_quasar_card";
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("fails a generated-card choice closed when commands exceed current selectable facts", () => {
    const observation = generatedCombatChoiceObservation();
    const surface = observation.surface as Record<string, unknown>;
    surface.selectable_card_entity_ids = ["generated-card-1"];
    const projected = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("keeps final selector exact source, membership, and hidden random outcome fail closed", () => {
    const transform = deckTransformObservation("preview");
    expect((transform.surface as any).replacement_known).toBe(false);
    const transformConfirm = transform.interaction.command_candidates.find(
      (candidate) => candidate.operation === "confirm_deck_transform"
    )!;
    transformConfirm.entity_bindings = transformConfirm.entity_bindings.filter(
      (binding) => binding.role !== "card"
    );
    const transformProjection = projectConnectorV3ForRe(
      transform,
      transform as unknown as JsonObject
    );
    expect(normalizeCurrentState(transformProjection.rawState, SOURCE).diagnostics.status)
      .toBe("invalid");

    const pile = combatPileObservation(true);
    pile.interaction.command_candidates[0]!.operands.source_id = "other-source";
    const pileProjection = projectConnectorV3ForRe(
      pile,
      pile as unknown as JsonObject
    );
    expect(normalizeCurrentState(pileProjection.rawState, SOURCE).diagnostics.status)
      .toBe("invalid");
  });

  it("consumes merchant removal directly while preserving its commit membership", () => {
    const selecting = merchantRemovalObservation("selecting");
    const projectedSelecting = projectConnectorV3ForRe(
      selecting,
      selecting as unknown as JsonObject
    );
    const selectingWrapper = projectedSelecting.rawState as Record<string, unknown>;
    expect(selectingWrapper.bridge_v2_state).toBeUndefined();
    expect(selectingWrapper.bridge_v2_capabilities).toBeUndefined();
    const selectingEnvelope = normalizeCurrentState(projectedSelecting.rawState, SOURCE);
    expect(selectingEnvelope.diagnostics.status).toBe("ok");
    expect(selectingEnvelope.currentState).toMatchObject({
      sourceStateType: "connector_v3:shop:deck_removal_selection:direct",
      context: { kind: "shop" },
      surface: {
        kind: "deck_removal_selection",
        stage: "selecting",
        screenEntityId: "merchant-removal-screen"
      }
    });
    expect(buildAllowedActions(
      selectingEnvelope.currentState,
      selectingEnvelope.stateHash
    )).toHaveLength(2);

    const selectedValue = structuredClone(selecting) as unknown as any;
    selectedValue.surface.selected_count = 1;
    selectedValue.surface.selected_card_entity_ids = ["merchant-removal-card-1"];
    selectedValue.surface.selectable_card_entity_ids = [];
    selectedValue.surface.deselectable_card_entity_ids = ["merchant-removal-card-1"];
    selectedValue.surface.can_preview = true;
    selectedValue.surface.cards[0].is_selected = true;
    selectedValue.interaction.command_candidates[0].command = "deselect_entity";
    selectedValue.interaction.command_candidates[0].label = "Deselect Strike";
    selectedValue.interaction.command_candidates.splice(1, 0, {
      candidate_id: "candidate-merchant-removal-preview",
      command: "confirm_interaction",
      operation: "preview_deck_removal",
      label: "Preview removal of Strike",
      operands: {
        screen_id: "merchant-removal-screen",
        control_id: "preview_deck_removal"
      },
      operand_domains: {},
      entity_bindings: [
        { role: "screen", entity_id: "merchant-removal-screen" },
        { role: "card", entity_id: "merchant-removal-card-1" }
      ],
      binding_kind: "native_direct_resolver",
      authority_state: "trial"
    });
    const selectedObservation = decodeConnectorV3Observation(selectedValue).data;
    const selectedProjection = projectConnectorV3ForRe(
      selectedObservation,
      selectedObservation as unknown as JsonObject
    );
    const selectedEnvelope = normalizeCurrentState(selectedProjection.rawState, SOURCE);
    expect(selectedEnvelope.diagnostics.status).toBe("ok");
    expect([...selectedProjection.invocations.values()]).toEqual(expect.arrayContaining([
      expect.objectContaining({ command: "deselect_entity" }),
      expect.objectContaining({
        command: "confirm_interaction",
        operation: "preview_deck_removal"
      })
    ]));

    const preview = merchantRemovalObservation("preview");
    const projectedPreview = projectConnectorV3ForRe(
      preview,
      preview as unknown as JsonObject
    );
    const previewEnvelope = normalizeCurrentState(projectedPreview.rawState, SOURCE);
    expect(previewEnvelope.diagnostics.status).toBe("ok");
    expect(previewEnvelope.currentState.surface).toMatchObject({
      kind: "deck_removal_selection",
      stage: "preview",
      selectedCardEntityIds: ["merchant-removal-card-1"]
    });
    expect(buildAllowedActions(
      previewEnvelope.currentState,
      previewEnvelope.stateHash
    )).toHaveLength(2);
  });

  it("fails merchant removal closed on source-screen or commit-membership drift", () => {
    const wrongOwner = merchantRemovalObservation("selecting");
    wrongOwner.interaction.command_candidates[0]!.operands.screen_id = "other-shop-screen";
    const wrongOwnerProjection = projectConnectorV3ForRe(
      wrongOwner,
      wrongOwner as unknown as JsonObject
    );
    expect(normalizeCurrentState(wrongOwnerProjection.rawState, SOURCE).diagnostics.status)
      .toBe("invalid");

    const wrongMembership = merchantRemovalObservation("preview");
    const confirm = wrongMembership.interaction.command_candidates.find(
      (candidate) => candidate.operation === "confirm_deck_removal"
    )!;
    confirm.entity_bindings = confirm.entity_bindings.filter(
      (binding) => binding.role !== "card"
    );
    const wrongMembershipProjection = projectConnectorV3ForRe(
      wrongMembership,
      wrongMembership as unknown as JsonObject
    );
    expect(normalizeCurrentState(
      wrongMembershipProjection.rawState,
      SOURCE
    ).diagnostics.status).toBe("invalid");
  });

  it.each([
    ["Precise Scissors", "relic_deck_removal_selection", "event", 1],
    ["CardRemovalReward", "reward_deck_removal_selection", "reward_flow", 2]
  ] as const)(
    "consumes %s removal directly without transferring merchant authority",
    (_label, kind, contextKind, expectedSelectingActions) => {
      const selecting = sourceRemovalObservation(kind, "selecting");
      const projection = projectConnectorV3ForRe(
        selecting,
        selecting as unknown as JsonObject
      );
      const wrapper = projection.rawState as Record<string, unknown>;
      expect(wrapper.bridge_v2_state).toBeUndefined();
      expect(wrapper.bridge_v2_capabilities).toBeUndefined();
      const envelope = normalizeCurrentState(projection.rawState, SOURCE);
      expect(envelope.diagnostics.status).toBe("ok");
      expect(envelope.currentState).toMatchObject({
        sourceStateType: `connector_v3:${selecting.context.kind}:${kind}:direct`,
        context: { kind: contextKind },
        surface: { kind, stage: "selecting" }
      });
      expect(buildAllowedActions(envelope.currentState, envelope.stateHash))
        .toHaveLength(expectedSelectingActions);

      const preview = sourceRemovalObservation(kind, "preview");
      const previewProjection = projectConnectorV3ForRe(
        preview,
        preview as unknown as JsonObject
      );
      const previewEnvelope = normalizeCurrentState(previewProjection.rawState, SOURCE);
      expect(previewEnvelope.diagnostics.status).toBe("ok");
      expect(buildAllowedActions(previewEnvelope.currentState, previewEnvelope.stateHash))
        .toHaveLength(2);
    }
  );

  it("fails Precise Scissors closed when preview actionability contradicts selection bounds", () => {
    const value = structuredClone(sourceRemovalObservation(
      "relic_deck_removal_selection",
      "selecting"
    )) as unknown as any;
    value.surface.can_preview = true;
    const observation = decodeConnectorV3Observation(value).data;
    const projection = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );
    expect(normalizeCurrentState(projection.rawState, SOURCE).diagnostics.status)
      .toBe("invalid");
  });

  it("consumes atomic card bundles directly across preview and commit stages", () => {
    const choosing = cardBundleObservation("choosing");
    const choosingProjection = projectConnectorV3ForRe(
      choosing,
      choosing as unknown as JsonObject
    );
    const wrapper = choosingProjection.rawState as Record<string, unknown>;
    expect(wrapper.bridge_v2_state).toBeUndefined();
    expect(wrapper.bridge_v2_capabilities).toBeUndefined();
    const choosingEnvelope = normalizeCurrentState(choosingProjection.rawState, SOURCE);
    expect(choosingEnvelope.diagnostics.status).toBe("ok");
    expect(choosingEnvelope.currentState.surface).toMatchObject({
      kind: "card_bundle_selection",
      stage: "choosing",
      selectableBundleEntityIds: ["scroll-boxes-bundle-1"],
      canConfirm: false,
      canCancelPreview: false
    });
    expect(buildAllowedActions(
      choosingEnvelope.currentState,
      choosingEnvelope.stateHash
    )).toHaveLength(1);

    const preview = cardBundleObservation("preview");
    const previewProjection = projectConnectorV3ForRe(
      preview,
      preview as unknown as JsonObject
    );
    const previewEnvelope = normalizeCurrentState(previewProjection.rawState, SOURCE);
    expect(previewEnvelope.diagnostics.status).toBe("ok");
    expect(previewEnvelope.currentState.surface).toMatchObject({
      kind: "card_bundle_selection",
      stage: "preview",
      selectedBundleEntityId: "scroll-boxes-bundle-1",
      canConfirm: true,
      canCancelPreview: true
    });
    expect([...previewProjection.invocations.values()]).toEqual(expect.arrayContaining([
      expect.objectContaining({ command: "confirm_interaction", operation: "confirm_card_bundle" }),
      expect.objectContaining({
        command: "cancel_interaction",
        operation: "cancel_card_bundle_preview"
      })
    ]));
  });

  it("fails card bundles closed when selectable facts or exact bundle bindings drift", () => {
    const value = structuredClone(cardBundleObservation("choosing")) as unknown as any;
    value.surface.selectable_bundle_entity_ids = ["replacement-bundle"];
    expect(() => decodeConnectorV3Observation(value)).not.toThrow();
    const observation = decodeConnectorV3Observation(value).data;
    const projection = projectConnectorV3ForRe(
      observation,
      observation as unknown as JsonObject
    );
    expect(normalizeCurrentState(projection.rawState, SOURCE).diagnostics.status).toBe("invalid");
  });

  it("consumes the exact Luminous Choir removal transaction without a V2 sidecar", () => {
    const selecting = eventRemovalObservation("selecting");
    const selectingProjection = projectConnectorV3ForRe(
      selecting,
      selecting as unknown as JsonObject
    );
    const selectingWrapper = selectingProjection.rawState as Record<string, unknown>;
    expect(selectingWrapper.bridge_v2_state).toBeUndefined();
    expect(selectingWrapper.bridge_v2_capabilities).toBeUndefined();
    const selectingEnvelope = normalizeCurrentState(selectingProjection.rawState, SOURCE);
    expect(selectingEnvelope.diagnostics.status).toBe("ok");
    expect(selectingEnvelope.currentState).toMatchObject({
      sourceStateType: "connector_v3:event:event_deck_removal_selection:direct",
      context: { kind: "event" },
      surface: {
        kind: "event_deck_removal_selection",
        stage: "selecting",
        screenEntityId: "event-removal-screen",
        sourceKind: "luminous_choir_reach_into_flesh",
        minimumSelections: 2,
        maximumSelections: 2,
        selectedCount: 0
      }
    });
    expect(buildAllowedActions(
      selectingEnvelope.currentState,
      selectingEnvelope.stateHash
    )).toHaveLength(2);

    const preview = eventRemovalObservation("preview");
    const previewProjection = projectConnectorV3ForRe(
      preview,
      preview as unknown as JsonObject
    );
    const previewEnvelope = normalizeCurrentState(previewProjection.rawState, SOURCE);
    expect(previewEnvelope.diagnostics.status).toBe("ok");
    expect(previewEnvelope.currentState.surface).toMatchObject({
      kind: "event_deck_removal_selection",
      stage: "preview",
      selectedCardEntityIds: ["event-removal-card-1", "event-removal-card-2"],
      expectedEffects: ["remove_selected_cards", "add_spore_mind", "finish_event"]
    });
    expect([...previewProjection.invocations.values()]).toEqual(expect.arrayContaining([
      expect.objectContaining({
        command: "cancel_interaction",
        operation: "cancel_event_deck_removal_preview"
      }),
      expect.objectContaining({
        command: "confirm_interaction",
        operation: "confirm_event_deck_removal"
      })
    ]));
  });

  it("fails event removal closed on unknown source or command membership drift", () => {
    const unknownSource = structuredClone(
      eventRemovalObservation("selecting")
    ) as unknown as any;
    unknownSource.surface.source_kind = "another_event";
    const unknownSourceObservation = decodeConnectorV3Observation(unknownSource).data;
    const unknownSourceProjection = projectConnectorV3ForRe(
      unknownSourceObservation,
      unknownSourceObservation as unknown as JsonObject
    );
    expect(normalizeCurrentState(
      unknownSourceProjection.rawState,
      SOURCE
    ).diagnostics.status).toBe("invalid");

    const wrongMembership = eventRemovalObservation("preview");
    const confirm = wrongMembership.interaction.command_candidates.find(
      (candidate) => candidate.operation === "confirm_event_deck_removal"
    )!;
    confirm.entity_bindings = confirm.entity_bindings.filter(
      (binding) => binding.role !== "card"
    );
    const projection = projectConnectorV3ForRe(
      wrongMembership,
      wrongMembership as unknown as JsonObject
    );
    const envelope = normalizeCurrentState(projection.rawState, SOURCE);
    expect(envelope.diagnostics.status).toBe("invalid");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
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
      observation as unknown as JsonObject
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

  it("executes through V3 control and command contracts without a V2 route", async () => {
    const calls: string[] = [];
    let clientInstanceId = "";
    const clientSessionId = "client-v3-fixture";
    const controllerLeaseId = "lease-v3-fixture";
    const adapter = new Sts2ConnectorV3Adapter(
      "http://adapter.test",
      1_000,
      { commandPollMs: 1, commandTimeoutMs: 100 },
      async (input, init) => {
        const url = String(input);
        calls.push(url);
        if (url.endsWith("/api/v3/capabilities")) {
          return json(connectorCapabilities());
        }
        if (url.endsWith("/api/v3/observation")) {
          return json(mainMenuObservation());
        }
        if (url.endsWith("/api/v3/clients/register")) {
          const body = JSON.parse(String(init?.body)) as {
            client_instance_id: string;
          };
          clientInstanceId = body.client_instance_id;
          return json({
            protocol_version: "3.0-preview.11",
            schema: "sts2.connector.v3/control-1",
            runtime_instance_id: BRIDGE.runtime_instance_id,
            client: {
              client_session_id: clientSessionId,
              client_instance_id: clientInstanceId,
              product_id: "re-spireagent",
              product_name: "Re-SpireAgent",
              product_version: "0.1.0",
              registered_at: "2026-08-03T00:00:00Z",
              last_seen_at: "2026-08-03T00:00:00Z"
            }
          }, 201);
        }
        if (url.endsWith("/api/v3/controller/acquire")) {
          return json({
            protocol_version: "3.0-preview.11",
            schema: "sts2.connector.v3/control-1",
            runtime_instance_id: BRIDGE.runtime_instance_id,
            status: "controller_acquired",
            detail: "fixture acquired",
            controller: {
              status: "active",
              controller_lease_id: controllerLeaseId,
              controller_generation: 1,
              client_session_id: clientSessionId,
              acquired_at: "2026-08-03T00:00:00Z",
              expires_at: new Date(Date.now() + 60_000).toISOString()
            }
          });
        }
        if (url.endsWith("/api/v3/commands")) {
          const body = JSON.parse(String(init?.body)) as any;
          return json({
            protocol_version: "3.0-preview.11",
            request_id: body.request_id,
            status: "completed",
            application: "confirmed",
            command: { kind: body.command, operands: body.operands },
            completion: {
              boundary: "native_control_effect_observed",
              summary: "Single-player menu opened."
            },
            retry: { allowed: false, reason: "terminal_receipt" },
            successor: {
              status: "available",
              state_token: "state-menu-successor"
            },
            events: [],
            attribution: {
              client_session_id: clientSessionId,
              client_instance_id: clientInstanceId,
              product_id: "re-spireagent",
              product_name: "Re-SpireAgent",
              product_version: "0.1.0",
              controller_lease_id: controllerLeaseId,
              controller_generation: 1,
              runtime_instance_id: BRIDGE.runtime_instance_id
            }
          });
        }
        if (url.endsWith("/api/v3/controller/release")) {
          return json({
            protocol_version: "3.0-preview.11",
            schema: "sts2.connector.v3/control-1",
            runtime_instance_id: BRIDGE.runtime_instance_id,
            status: "controller_released",
            detail: "fixture released"
          });
        }
        throw new Error(`Unexpected request ${url}`);
      },
      async () => {}
    );

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    const action = buildAllowedActions(
      envelope.currentState,
      envelope.stateHash
    )[0]!;
    const result = await adapter.execute(action.action);
    await adapter.close();

    expect(result).toMatchObject({
      accepted: true,
      outcome: "accepted",
      confirmedStateToken: "state-menu-successor"
    });
    expect(calls.some((url) => url.includes("/api/v2/"))).toBe(false);
    expect(calls.filter((url) => url.endsWith("/api/v3/commands")))
      .toHaveLength(1);
    expect(calls.filter((url) => url.endsWith("/api/v3/controller/release")))
      .toHaveLength(1);
  });

  it.each([
    ["combat", combatObservation, "combat", "combat_turn", 2],
    ["combat hand", combatHandObservation, "combat", "combat_hand_card_selection", 1],
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
      raw
    );

    const envelope = normalizeCurrentState(projected.rawState, SOURCE);

    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.actionAuthority).toBe("none");
    expect(envelope.currentState.surface.kind).toBe("unsupported");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });
});
