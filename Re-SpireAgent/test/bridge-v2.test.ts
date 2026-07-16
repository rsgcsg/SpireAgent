import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import type { AdapterDescriptor } from "../src/game-io/adapter.js";
import { Sts2McpHybridAdapter } from "../src/integrations/sts2mcp/hybridAdapter.js";
import { decodeBridgeV2Inspection, decodeBridgeV2State } from "../src/integrations/sts2mcp/bridgeV2Protocol.js";
import { isBridgeV2WrappedState, wrapBridgeV2State } from "../src/integrations/sts2mcp/rawState.js";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";
import type { JsonObject } from "../src/shared/json.js";
import { fixture } from "./helpers.js";

const CAPABILITIES = {
  protocol_version: "2.0-preview.4",
  bridge: { id: "sts2_mcp_bridge_v2", name: "STS2 Agent Bridge", version: "0.5.0-dev", upstream_commit: "upstream" },
  game: {
    version: "v0.108.0",
    commit: "58694f64",
    branch: "v0.108.0",
    main_assembly_hash: -2044609792,
    compatibility: { status: "supported_exact", action_execution_allowed: true, detail: "exact" }
  },
  observation_policy: { id: "player_visible_ui_v1", scope: "visible", includes_hidden_information: false, unknown_field_behavior: "omit" },
  surfaces: [
    { kind: "deck_enchant_selection", support: "implemented_exact_game_version", operations: ["toggle_card"], evidence: "test-contract" },
    { kind: "event_option", support: "implemented_exact_game_version", operations: ["choose_event_option", "proceed_event"], evidence: "test-contract" },
    { kind: "combat_turn", support: "implemented_exact_game_version", operations: ["play_card", "use_potion", "end_turn"], evidence: "test-contract" },
    { kind: "card_reward_selection", support: "implemented_exact_game_version", operations: ["select_card_reward", "choose_card_reward_alternative"], evidence: "test-contract" },
    { kind: "reward_claim", support: "implemented_exact_game_version", operations: ["claim_reward", "proceed_rewards"], evidence: "test-contract" }
  ],
  commands: { opaque_actions_only: true, state_bound: true, idempotent_request_ids: true, lifecycle_states: ["started", "completed"], outcome_timeout_ms: 10000 },
  inspections: {
    status: "implemented_read_only",
    state_bound: true,
    arbitrary_queries_allowed: false,
    enters_command_ledger: false,
    visibility_classes: ["on_screen", "normal_inspection", "count_only"],
    ordering_semantics: ["unordered_multiset", "player_sorted"],
    implemented_kinds: ["run_deck", "combat_piles"]
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

const DECK_ENCHANT_STATE = {
  protocol_version: "2.0-preview.4",
  state_id: "state-test-1",
  state_sequence: 1,
  observed_at: "2026-07-16T00:00:00Z",
  readiness: "ready",
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
    selected_card_entity_ids: [],
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
  legal_actions: [{
    action_id: "action-test-1",
    state_id: "state-test-1",
    kind: "toggle_card",
    category: "selection",
    label: "Select Strike",
    authority: "game_ui",
    evidence_code: "NCardGrid.HolderPressed"
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
  diagnostics: [],
  warnings: []
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
      relic_name: null,
      relic_description: null
    }]
  },
  legal_actions: [{
    action_id: "action-event-1",
    state_id: "state-event-1",
    kind: "proceed_event",
    category: "navigation",
    label: "Proceed",
    authority: "game_ui",
    evidence_code: "NEventRoom.OptionButtonClicked+NEventOptionButton"
  }]
};

const COMBAT_TURN_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-combat-1",
  state_sequence: 3,
  context: {
    kind: "combat",
    encounter_type: "elite",
    round: 2,
    turn_owner: "player",
    is_play_phase: true,
    player: {
      entity_id: "player-1",
      character: "Ironclad",
      hp: 61,
      max_hp: 80,
      block: 3,
      energy: 3,
      max_energy: 3,
      stars: null,
      gold: 112,
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
      relics: [],
      potions: [],
      max_potion_slots: 3,
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
  surface_kind: "combat_turn",
  surface: { kind: "combat_turn", room_entity_id: "combat-room-1", can_end_turn: true },
  legal_actions: [
    {
      action_id: "action-combat-play-1",
      state_id: "state-combat-1",
      kind: "play_card",
      category: "combat",
      label: "Play Strike on Cultist",
      authority: "game_ui",
      evidence_code: "CardModel.CanPlay+CombatState.HittableEnemies+CardModel.TryManualPlay"
    },
    {
      action_id: "action-combat-end-1",
      state_id: "state-combat-1",
      kind: "end_turn",
      category: "commit",
      label: "End turn",
      authority: "game_ui",
      evidence_code: "PlayerCmd.EndTurn+NEndTurnButton.CanTurnBeEnded guards"
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_immediate_combat_turn",
    legal_actions: "derived_from_same_validator_as_execution",
    sources: ["CombatManager.DebugOnlyGetState", "CardModel.CanPlay"],
    missing: []
  }
};

const CARD_REWARD_STATE = {
  ...DECK_ENCHANT_STATE,
  state_id: "state-card-reward-1",
  state_sequence: 4,
  context: { kind: "reward_flow", reward_kind: "card_reward" },
  surface_kind: "card_reward_selection",
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
      evidence_code: "NCardRewardSelectionScreen.SelectCard via NCardHolder.Pressed"
    },
    {
      action_id: "action-card-reward-alt-1",
      state_id: "state-card-reward-1",
      kind: "choose_card_reward_alternative",
      category: "alternative",
      label: "Reroll",
      authority: "game_ui",
      evidence_code: "NCardRewardAlternativeButton.visible_label+ForceClick"
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
      evidence_code: "NRewardButton.Reward+NRewardButton.ForceClick"
    },
    {
      action_id: "action-reward-proceed-1",
      state_id: "state-reward-claim-1",
      kind: "proceed_rewards",
      category: "navigation",
      label: "Skip remaining rewards and continue",
      authority: "game_ui",
      evidence_code: "NRewardsScreen.ProceedButton+NProceedButton.ForceClick"
    }
  ],
  completeness: {
    player_visible_semantics: "contract_complete_for_reward_claim",
    legal_actions: "derived_from_same_current_ui_controls_as_execution",
    sources: ["NRewardsScreen._rewardButtons rendered as NRewardButton", "NRewardButton.Reward", "NRewardsScreen.ProceedButton"],
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
    protocol_version: "2.0-preview.4",
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
    protocol_version: "2.0-preview.4",
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
  it("strictly decodes the qualified surface and rejects discriminator mismatch", () => {
    expect(decodeBridgeV2State(DECK_ENCHANT_STATE).data.surface.kind).toBe("deck_enchant_selection");
    expect(() => decodeBridgeV2State({ ...DECK_ENCHANT_STATE, surface_kind: "other" })).toThrow("does not match");
  });

  it("strictly decodes event and combat contracts and rejects context/surface mismatch", () => {
    expect(decodeBridgeV2State(EVENT_OPTION_STATE).data.context.kind).toBe("event");
    expect(decodeBridgeV2State(COMBAT_TURN_STATE).data.surface.kind).toBe("combat_turn");
    expect(() => decodeBridgeV2State({ ...EVENT_OPTION_STATE, context: COMBAT_TURN_STATE.context })).toThrow(
      "event_option surface requires event context"
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
      bridgeInspectionPolicy: { status: "implemented_read_only", implementedKinds: ["run_deck", "combat_piles"] }
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

  it("projects state-bound run-deck and combat-pile evidence without granting action authority", () => {
    const deckInspection = runDeckInspection(COMBAT_TURN_STATE.state_id);
    const pileInspection = combatPilesInspection(COMBAT_TURN_STATE.state_id);
    expect(decodeBridgeV2Inspection(deckInspection).data.content.kind).toBe("run_deck");
    expect(decodeBridgeV2Inspection(pileInspection).data.content.kind).toBe("combat_piles");

    const wrapped = wrapBridgeV2State({
      state: structuredClone(COMBAT_TURN_STATE),
      capabilities: structuredClone(CAPABILITIES),
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
    expect(envelope.currentState.surface.options[0]).toMatchObject({ title: "Proceed", proceed: true, enabled: true });
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
      player: { character: "Ironclad", energy: 3, hand: [{ entityId: "combat-card-1", canPlay: true }] },
      surface: { kind: "combat_turn", roomEntityId: "combat-room-1", canEndTurn: true }
    });
    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    expect(actions.map((action) => action.id)).toEqual(["action-combat-play-1", "action-combat-end-1"]);
    expect(actions.every((action) => action.action.kind === "bridge_v2_action")).toBe(true);
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
      mode: "auto",
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, fetchImpl, async () => {});

    await adapter.initialize();
    expect(adapter.describe().capabilities).toMatchObject({
      canListLegalActions: true,
      legalActionAuthority: "mixed",
      protocols: ["sts2mcp_v1", "bridge_v2"]
    });
    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    const action = buildAllowedActions(envelope.currentState, envelope.stateHash)[0]?.action;
    if (!action) throw new Error("missing imported action");
    const result = await adapter.execute(action);

    expect(result).toMatchObject({ accepted: true, outcome: "accepted", response: { status: "completed" } });
    expect(pollCount).toBe(1);
    expect(requests.filter((request) => request.url.endsWith("/api/v1/singleplayer") && request.init?.method === "POST")).toHaveLength(0);
    expect(requests.find((request) => request.url.endsWith("/api/v2/commands"))?.body).toMatchObject({
      expected_state_id: "state-test-1",
      action_id: "action-test-1"
    });
  });

  it("auto mode keeps v1 ownership for an unsupported v2 surface", async () => {
    const calls: string[] = [];
    const unsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "map", reason: "not implemented" },
      legal_actions: []
    };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      mode: "auto",
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
      if (url.endsWith("/api/v2/state")) return json(unsupported);
      if (url.includes("/api/v2/inspections/run_deck?")) return json(runDeckInspection(unsupported.state_id));
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("map"));
      throw new Error(`Unexpected request ${url}`);
    });

    const state = await adapter.readCurrentState();
    expect(state).toMatchObject({ state_type: "map" });
    expect(calls).toContain("http://adapter.test/api/v1/singleplayer?format=json");
    const envelope = normalizeCurrentState(state, adapter.describe());
    expect(envelope.currentState.actionAuthority).toBe("local_reconstruction");
    expect(envelope.currentState.player?.runDeck).toEqual([
      expect.objectContaining({ entityId: "deck-card-1", id: "STRIKE" })
    ]);
    expect(envelope.currentState.bridgeInspections).toEqual([
      expect.objectContaining({ kind: "run_deck", expectedStateId: unsupported.state_id })
    ]);
  });

  it("treats an unavailable run deck as absent evidence but keeps stale inspection failures hard", async () => {
    const unsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "menu", reason: "not implemented" },
      legal_actions: []
    };
    const makeAdapter = (errorCode: string) => new Sts2McpHybridAdapter(
      "http://adapter.test",
      1_000,
      { mode: "auto", commandPollMs: 1, commandTimeoutMs: 100 },
      async (input) => {
        const url = String(input);
        if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
        if (url.endsWith("/api/v2/state")) return json(unsupported);
        if (url.includes("/api/v2/inspections/run_deck?")) {
          return json({ error: { code: errorCode, detail: "test failure" } }, 409);
        }
        if (url.endsWith("/api/v1/singleplayer?format=json")) {
          return json({ state_type: "menu", options: [] });
        }
        throw new Error(`Unexpected request ${url}`);
      }
    );

    await expect(makeAdapter("inspection_not_available").readCurrentState()).resolves.toMatchObject({
      state_type: "menu",
      bridge_v2_capabilities: expect.any(Object)
    });
    await expect(makeAdapter("stale_state").readCurrentState()).rejects.toThrow("stale_state");
  });

  it("preserves the bridge reason when strict v2 sees an unsupported surface", () => {
    const unsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "NMainMenu", reason: "surface adapter not implemented" },
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
      mode: "v2",
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
      mode: "auto",
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      requests.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
      if (url.endsWith("/api/v2/state")) return json(DECK_ENCHANT_STATE);
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
      action_execution_allowed: false,
      detail: "build mismatch"
    };
    const incompatibleState = structuredClone(DECK_ENCHANT_STATE);
    incompatibleState.game = incompatibleCapabilities.game;
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      mode: "auto",
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(incompatibleCapabilities);
      if (url.endsWith("/api/v2/state")) return json(incompatibleState);
      if (url.includes("/api/v2/inspections/run_deck?")) return json(runDeckInspection(incompatibleState.state_id));
      if (url.endsWith("/api/v1/singleplayer?format=json")) return json(await fixture("event"));
      throw new Error(`Unexpected request ${url}`);
    });

    const raw = await adapter.readCurrentState();
    const envelope = normalizeCurrentState(raw, adapter.describe());
    expect(isBridgeV2WrappedState(raw)).toBe(true);
    expect(envelope.currentState.stability).toBe("invalid");
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("does not hide v2 identity drift behind unsupported-surface v1 fallback", async () => {
    const calls: string[] = [];
    const driftedUnsupported = {
      ...DECK_ENCHANT_STATE,
      readiness: "unsupported",
      surface_kind: "unsupported",
      surface: { kind: "unsupported", source_type: "menu", reason: "not implemented" },
      legal_actions: [],
      game: { ...CAPABILITIES.game, commit: "different-build" }
    };
    const adapter = new Sts2McpHybridAdapter("http://adapter.test", 1_000, {
      mode: "auto",
      commandPollMs: 1,
      commandTimeoutMs: 100
    }, async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
      if (url.endsWith("/api/v2/state")) return json(driftedUnsupported);
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
    mode: "auto",
    commandPollMs: 1,
    commandTimeoutMs: 100
  }, async (input, init) => {
    const url = String(input);
    if (url.endsWith("/api/v2/capabilities")) return json(CAPABILITIES);
    if (url.endsWith("/api/v2/state")) return json(DECK_ENCHANT_STATE);
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
