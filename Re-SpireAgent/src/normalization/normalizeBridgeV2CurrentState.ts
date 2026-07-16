import type { AdapterDescriptor } from "../game-io/adapter.js";
import {
  NORMALIZED_STATE_SCHEMA_VERSION,
  type BridgeLegalActionSnapshot,
  type BridgeDiagnosticSnapshot,
  type BridgeSurfaceCompleteness,
  type CardRewardSelectionSurface,
  type BridgeRewardClaimSurface,
  type CombatTurnSurface,
  type DeckEnchantSelectionSurface,
  type EnemySnapshot,
  type EventOptionSurface,
  type NormalizedCurrentState,
  type PlayerSnapshot,
  type SemanticContext,
  type StateEnvelope
} from "../domain/state/index.js";
import {
  decodeBridgeV2Capabilities,
  decodeBridgeV2State,
  isBridgeV2CombatContext,
  isBridgeV2CombatTurnSurface,
  isBridgeV2CardRewardSelectionSurface,
  isBridgeV2RewardClaimSurface,
  isBridgeV2DeckEnchantSurface,
  isBridgeV2EventContext,
  isBridgeV2EventOptionSurface,
  isBridgeV2RewardFlowContext,
  isBridgeV2UnsupportedSurface,
  type BridgeV2CombatContext,
  type BridgeV2CardRewardSelectionSurface,
  type BridgeV2RewardClaimSurface,
  type BridgeV2DeckEnchantSurface,
  type BridgeV2Diagnostic,
  type BridgeV2EventOptionSurface,
  type BridgeV2LegalAction
} from "../integrations/sts2mcp/bridgeV2Protocol.js";
import {
  bridgeV2CapabilitiesFromWrapper,
  bridgeV2InspectionIdentity,
  bridgeV2InspectionsFromWrapper,
  bridgeV2StateFromWrapper,
  legacyStateFromBridgeV2Wrapper,
  type Sts2McpRawState
} from "../integrations/sts2mcp/rawState.js";
import { stateHash } from "../runtime/stateHash.js";
import { DiagnosticsBuilder } from "./diagnostics.js";
import { projectBridgeV2Card } from "./bridgeV2CardProjection.js";
import { projectBridgeV2Inspections } from "./bridgeV2InspectionProjection.js";

const ACTION_KINDS = {
  deck_enchant_selection: new Set([
    "toggle_card",
    "preview_selection",
    "confirm_selection",
    "cancel_preview",
    "close_selection"
  ]),
  event_option: new Set(["choose_event_option", "proceed_event"]),
  combat_turn: new Set(["play_card", "use_potion", "end_turn"]),
  card_reward_selection: new Set(["select_card_reward", "choose_card_reward_alternative"]),
  reward_claim: new Set(["claim_reward", "proceed_rewards"])
} as const;

export function normalizeBridgeV2CurrentState(
  rawState: Sts2McpRawState,
  source: AdapterDescriptor,
  capturedAt: string,
  legacyEnvelope?: StateEnvelope
): StateEnvelope {
  const diagnostics = new DiagnosticsBuilder();
  const bridgeStateRaw = bridgeV2StateFromWrapper(rawState);
  const capabilitiesRaw = bridgeV2CapabilitiesFromWrapper(rawState);
  if (!bridgeStateRaw) diagnostics.missing("bridge_v2_state");
  if (!capabilitiesRaw) diagnostics.missing("bridge_v2_capabilities");

  let state;
  let capabilities;
  try {
    state = decodeBridgeV2State(bridgeStateRaw).data;
  } catch (error) {
    diagnostics.invalid("bridge_v2_state", bridgeStateRaw, safeMessage(error));
  }
  try {
    capabilities = decodeBridgeV2Capabilities(capabilitiesRaw).data;
  } catch (error) {
    diagnostics.invalid("bridge_v2_capabilities", capabilitiesRaw, safeMessage(error));
  }

  const inherited = legacyEnvelope?.diagnostics.status !== "invalid" ? legacyEnvelope?.currentState : undefined;
  let context: SemanticContext = {
    kind: "unknown",
    reason: "Bridge v2 context could not be decoded",
    observedTopLevelKeys: Object.keys(rawState).sort()
  };
  let player = inherited?.player;
  if (state && isBridgeV2EventContext(state.context)) {
    context = projectEventContext(state.context);
  } else if (state && isBridgeV2CombatContext(state.context)) {
    context = projectCombatContext(state.context);
    player = projectCombatPlayer(state.context);
  } else if (state && isBridgeV2RewardFlowContext(state.context)) {
    context = { kind: "reward_flow", rewardKind: state.context.reward_kind };
  }

  const inspectionRaw = bridgeV2InspectionsFromWrapper(rawState);
  const projectedInspections = projectBridgeV2Inspections(
    capabilitiesRaw,
    inspectionRaw,
    state?.state_id,
    diagnostics
  );
  if (player) {
    player = {
      ...player,
      ...(projectedInspections.runDeck ? { runDeck: projectedInspections.runDeck } : {}),
      ...(projectedInspections.drawPile ? { drawPile: projectedInspections.drawPile } : {}),
      ...(projectedInspections.discardPile ? { discardPile: projectedInspections.discardPile } : {}),
      ...(projectedInspections.exhaustPile ? { exhaustPile: projectedInspections.exhaustPile } : {})
    };
  }

  if (inherited?.run || (inherited?.player && !isBridgeV2CombatContext(state?.context ?? { kind: "unknown" }))) {
    diagnostics.infer(
      "run/non_action_shared_state",
      ["legacy_v1_state"],
      "dual-read sidecar only; Bridge v2 context, surface, and legal actions retain action authority"
    );
  }

  const base = {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType: state ? `bridge_v2:${state.context.kind}:${state.surface.kind}` : "bridge_v2:invalid",
    ...(inherited?.run ? { run: inherited.run } : {}),
    ...(player ? { player } : {}),
    ...(state && capabilities ? {
      bridgeDiagnostics: [
        ...capabilities.diagnostics.map((diagnostic) => projectDiagnostic(diagnostic, "capabilities")),
        ...state.diagnostics.map((diagnostic) => projectDiagnostic(diagnostic, "state")),
        ...projectedInspections.diagnostics
      ],
      bridgeLegacyWarnings: [...capabilities.warnings, ...state.warnings],
      bridgeInspectionPolicy: {
        status: capabilities.inspections.status,
        stateBound: capabilities.inspections.state_bound,
        arbitraryQueriesAllowed: capabilities.inspections.arbitrary_queries_allowed,
        entersCommandLedger: capabilities.inspections.enters_command_ledger,
        visibilityClasses: [...capabilities.inspections.visibility_classes],
        orderingSemantics: [...capabilities.inspections.ordering_semantics],
        implementedKinds: [...capabilities.inspections.implemented_kinds]
      },
      bridgeInspections: projectedInspections.evidence
    } : {})
  };
  let surface: NormalizedCurrentState["surface"] = unsupported(rawState, "Bridge v2 state could not be decoded");
  let stability: NormalizedCurrentState["stability"] = "invalid";
  let actionAuthority: NormalizedCurrentState["actionAuthority"] = "none";

  if (state && capabilities) {
    validateEnvelopeIdentity(state, capabilities, diagnostics);
    validateStructuredDiagnostics(
      [...capabilities.diagnostics, ...state.diagnostics],
      state.legal_actions.length,
      diagnostics
    );

    if (!state.game.compatibility.action_execution_allowed || !capabilities.game.compatibility.action_execution_allowed) {
      diagnostics.invalid("bridge_v2.game.compatibility", state.game.compatibility, "exact-build action execution is disabled");
      surface = unsupported(rawState, "Bridge v2 exact game-build compatibility did not pass");
    } else if (isBridgeV2UnsupportedSurface(state.surface)) {
      surface = unsupported(rawState, `Bridge v2 does not implement ${state.surface.source_type}: ${state.surface.reason}`);
      stability = "unknown";
    } else {
      const advertised = capabilities.surfaces.find((candidate) => candidate.kind === state.surface.kind);
      if (!advertised || advertised.support !== "implemented_exact_game_version") {
        diagnostics.invalid(
          "bridge_v2.capabilities.surfaces",
          capabilities.surfaces,
          "current surface is not advertised as exact-version implemented"
        );
      }
      if (state.readiness !== "ready" && state.readiness !== "settling") {
        diagnostics.invalid("bridge_v2.readiness", state.readiness, "supported surface must be ready or settling");
      }

      const advertisedOperations = new Set(advertised?.operations ?? []);
      if (isBridgeV2DeckEnchantSurface(state.surface)) {
        if (!isBridgeV2EventContext(state.context) && !isBridgeV2CombatContext(state.context)) {
          diagnostics.invalid("bridge_v2.context", state.context, "deck enchant requires a qualified event or combat context");
        }
        validateDeckEnchantState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectDeckEnchantSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2EventOptionSurface(state.surface) && isBridgeV2EventContext(state.context)) {
        validateEventOptionState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectEventOptionSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2CombatTurnSurface(state.surface) && isBridgeV2CombatContext(state.context)) {
        validateCombatTurnState(state.context, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectCombatTurnSurface(state.surface.room_entity_id, state.surface.can_end_turn, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2CardRewardSelectionSurface(state.surface) && isBridgeV2RewardFlowContext(state.context)) {
        validateCardRewardSelectionState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectCardRewardSelectionSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2RewardClaimSurface(state.surface)
          && isBridgeV2RewardFlowContext(state.context)
          && state.context.reward_kind === "room_rewards") {
        validateRewardClaimState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectRewardClaimSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else {
        diagnostics.invalid("bridge_v2.context_surface", {
          context: state.context.kind,
          surface: state.surface.kind
        }, "Re-SpireAgent does not support this Bridge v2 context/surface contract");
      }

      stability = state.readiness === "ready" ? "actionable" : "settling";
      actionAuthority = "bridge_advertised";
    }
  }

  const builtDiagnostics = diagnostics.build();
  if (builtDiagnostics.status === "invalid") {
    stability = "invalid";
    actionAuthority = "none";
    if (surface.kind !== "unsupported") surface = unsupported(rawState, "Bridge v2 contract validation failed");
  }
  const currentState: NormalizedCurrentState = {
    ...base,
    stability,
    actionAuthority,
    context,
    surface
  };

  const legacyRaw = legacyStateFromBridgeV2Wrapper(rawState);
  return {
    envelopeSchemaVersion: 2,
    capturedAt,
    source,
    rawState,
    currentState,
    diagnostics: builtDiagnostics,
    // observed_at is excluded. The state id owns action identity while the
    // sidecar hash protects prompt-visible shared state against stale execution.
    stateHash: stateHash({
      bridgeStateId: state?.state_id ?? null,
      legacyState: legacyRaw ?? null,
      inspections: bridgeV2InspectionIdentity(inspectionRaw)
    }),
    normalizedStateHash: stateHash(currentState)
  };
}

function validateEnvelopeIdentity(
  state: NonNullable<ReturnType<typeof decodeBridgeV2State>["data"]>,
  capabilities: NonNullable<ReturnType<typeof decodeBridgeV2Capabilities>["data"]>,
  diagnostics: DiagnosticsBuilder
): void {
  if (state.bridge.id !== capabilities.bridge.id || state.bridge.version !== capabilities.bridge.version) {
    diagnostics.invalid("bridge_v2.identity", state.bridge, "state and capabilities bridge identities differ");
  }
  if (state.game.compatibility.action_execution_allowed !== capabilities.game.compatibility.action_execution_allowed) {
    diagnostics.invalid("bridge_v2.game.compatibility", state.game.compatibility, "state and capabilities execution authority differ");
  }
  if (state.game.version !== capabilities.game.version
      || state.game.commit !== capabilities.game.commit
      || state.game.main_assembly_hash !== capabilities.game.main_assembly_hash) {
    diagnostics.invalid("bridge_v2.game.identity", state.game, "state and capabilities game identities differ");
  }
  validateExactGameIdentity("bridge_v2.state.game", state.game, diagnostics);
  validateExactGameIdentity("bridge_v2.capabilities.game", capabilities.game, diagnostics);
  if (state.observation_policy.id !== capabilities.observation_policy.id) {
    diagnostics.invalid("bridge_v2.observation_policy.id", state.observation_policy.id, "state and capabilities observation policies differ");
  }
  if (state.observation_policy.includes_hidden_information || capabilities.observation_policy.includes_hidden_information) {
    diagnostics.invalid("bridge_v2.observation_policy", state.observation_policy, "hidden-information bridge state is not accepted");
  }
  if (!capabilities.commands.opaque_actions_only
      || !capabilities.commands.state_bound
      || !capabilities.commands.idempotent_request_ids) {
    diagnostics.invalid("bridge_v2.commands", capabilities.commands, "required command safety capabilities are absent");
  }
  const inspectionKinds = [...capabilities.inspections.implemented_kinds].sort();
  if (capabilities.inspections.status !== "implemented_read_only"
      || !capabilities.inspections.state_bound
      || capabilities.inspections.arbitrary_queries_allowed
      || capabilities.inspections.enters_command_ledger
      || inspectionKinds.join(",") !== "combat_piles,run_deck") {
    diagnostics.invalid(
      "bridge_v2.inspections",
      capabilities.inspections,
      "RE-P1 requires exactly the state-bound, non-command run_deck and combat_piles inspection contract"
    );
  }
}

function validateStructuredDiagnostics(
  bridgeDiagnostics: BridgeV2Diagnostic[],
  actionCount: number,
  diagnostics: DiagnosticsBuilder
): void {
  for (const diagnostic of bridgeDiagnostics) {
    if (diagnostic.required_for_action === true && diagnostic.effect !== "actions_suppressed") {
      diagnostics.invalid("bridge_v2.diagnostics.required_for_action", diagnostic, "required fields must explicitly suppress actions when absent");
    }
    if (actionCount > 0 && (diagnostic.effect === "actions_suppressed"
      || diagnostic.effect === "surface_unsupported"
      || diagnostic.effect === "outcome_unknown")) {
      diagnostics.invalid("bridge_v2.diagnostics.effect", diagnostic, "an action-suppressing diagnostic cannot coexist with advertised actions");
    }
  }
}

function validateActions(
  surfaceKind: keyof typeof ACTION_KINDS,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  if (readiness === "ready" && missing.length > 0) {
    diagnostics.invalid("bridge_v2.completeness.missing", missing, "ready surface has missing required semantics");
  }
  if (readiness === "ready" && actions.length === 0) {
    diagnostics.invalid("bridge_v2.legal_actions", actions, `ready ${surfaceKind} surface has no legal actions`);
  }
  if (readiness === "settling" && actions.length > 0) {
    diagnostics.invalid("bridge_v2.legal_actions", actions, `settling ${surfaceKind} surface must not advertise executable actions`);
  }
  const actionIds = new Set(actions.map((action) => action.action_id));
  if (actionIds.size !== actions.length) diagnostics.invalid("bridge_v2.legal_actions", actions, "action ids are not unique");
  for (const action of actions) {
    if (action.state_id !== stateId) diagnostics.invalid("bridge_v2.legal_actions.state_id", action.state_id, "action is not bound to current state");
    if (action.authority !== "game_ui") diagnostics.invalid("bridge_v2.legal_actions.authority", action.authority, "unexpected action authority");
    if (!ACTION_KINDS[surfaceKind].has(action.kind as never)) diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, `unknown ${surfaceKind} action kind`);
    if (!advertisedOperations.has(action.kind)) diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "action kind is absent from advertised operations");
  }
}

function validateDeckEnchantState(
  surface: BridgeV2DeckEnchantSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  if (surface.min_select > surface.max_select) diagnostics.invalid("bridge_v2.surface.selection_range", surface, "min_select exceeds max_select");
  if (surface.selected_count !== surface.selected_card_entity_ids.length) diagnostics.invalid("bridge_v2.surface.selected_count", surface.selected_count, "selected count and selected ids differ");
  if (surface.selected_count > surface.max_select) diagnostics.invalid("bridge_v2.surface.selected_count", surface.selected_count, "selected count exceeds max_select");
  const cardIds = new Set(surface.cards.map((card) => card.entity_id));
  if (cardIds.size !== surface.cards.length) diagnostics.invalid("bridge_v2.surface.cards", surface.cards, "card entity ids are not unique");
  const selectedIds = new Set(surface.selected_card_entity_ids);
  for (const selectedId of selectedIds) {
    if (!cardIds.has(selectedId)) diagnostics.invalid("bridge_v2.surface.selected_card_entity_ids", selectedId, "selected card is absent from cards");
  }
  for (const card of surface.cards) {
    if (card.is_selected !== selectedIds.has(card.entity_id)) diagnostics.invalid("bridge_v2.surface.cards.is_selected", card, "card selected flag disagrees with selected ids");
  }
  validateActions("deck_enchant_selection", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    if (surface.stage === "selecting" && (action.kind === "confirm_selection" || action.kind === "cancel_preview")) diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "preview-only action appeared during selecting stage");
    if (surface.stage === "preview" && (action.kind === "toggle_card" || action.kind === "preview_selection" || action.kind === "close_selection")) diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "selecting-only action appeared during preview stage");
  }
}

function validateEventOptionState(
  surface: BridgeV2EventOptionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  const entityIds = new Set(surface.options.map((option) => option.entity_id));
  const indices = new Set(surface.options.map((option) => option.index));
  if (entityIds.size !== surface.options.length) diagnostics.invalid("bridge_v2.surface.options", surface.options, "event option entity ids are not unique");
  if (indices.size !== surface.options.length) diagnostics.invalid("bridge_v2.surface.options", surface.options, "event option indices are not unique");
  validateActions("event_option", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
}

function validateCombatTurnState(
  context: BridgeV2CombatContext,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  if (!context.player.character) diagnostics.invalid("bridge_v2.context.player.character", context.player.character, "combat player character is required");
  const handIds = new Set(context.player.hand.map((card) => card.entity_id));
  const enemyIds = new Set(context.enemies.map((enemy) => enemy.entity_id));
  const potionSlots = new Set(context.player.potions.map((potion) => potion.slot));
  if (handIds.size !== context.player.hand.length) diagnostics.invalid("bridge_v2.context.player.hand", context.player.hand, "hand card entity ids are not unique");
  if (enemyIds.size !== context.enemies.length) diagnostics.invalid("bridge_v2.context.enemies", context.enemies, "enemy entity ids are not unique");
  if (potionSlots.size !== context.player.potions.length) diagnostics.invalid("bridge_v2.context.player.potions", context.player.potions, "potion slots are not unique");
  if (readiness === "ready" && !context.is_play_phase) diagnostics.invalid("bridge_v2.context.is_play_phase", context.is_play_phase, "ready combat turn must be the player play phase");
  validateActions("combat_turn", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
}

function validateCardRewardSelectionState(
  surface: BridgeV2CardRewardSelectionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  const cardIds = new Set(surface.cards.map((card) => card.entity_id));
  const alternativeIds = new Set(surface.alternatives.map((alternative) => alternative.entity_id));
  const alternativeIndices = new Set(surface.alternatives.map((alternative) => alternative.index));
  if (cardIds.size !== surface.cards.length) diagnostics.invalid("bridge_v2.surface.cards", surface.cards, "card reward entity ids are not unique");
  if (alternativeIds.size !== surface.alternatives.length) diagnostics.invalid("bridge_v2.surface.alternatives", surface.alternatives, "alternative entity ids are not unique");
  if (alternativeIndices.size !== surface.alternatives.length) diagnostics.invalid("bridge_v2.surface.alternatives", surface.alternatives, "alternative indices are not unique");
  validateActions("card_reward_selection", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    if (action.kind === "select_card_reward" && !surface.cards.some((card) => action.label.includes(card.name ?? card.definition_id))) {
      diagnostics.invalid("bridge_v2.legal_actions.label", action.label, "card reward selection action does not identify a visible card");
    }
    if (action.kind === "choose_card_reward_alternative"
        && !surface.alternatives.some((alternative) => alternative.enabled && alternative.label === action.label)) {
      diagnostics.invalid("bridge_v2.legal_actions.label", action.label, "alternative action does not match an enabled visible alternative");
    }
  }
}

function validateRewardClaimState(
  surface: BridgeV2RewardClaimSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  const rewardIds = new Set(surface.rewards.map((reward) => reward.entity_id));
  if (rewardIds.size !== surface.rewards.length) diagnostics.invalid("bridge_v2.surface.rewards", surface.rewards, "reward entity ids are not unique");
  validateActions("reward_claim", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    if (action.kind === "claim_reward" && !surface.rewards.some((reward) => reward.enabled && action.label === `Claim ${reward.label}`)) {
      diagnostics.invalid("bridge_v2.legal_actions.label", action.label, "claim action does not identify an enabled visible reward");
    }
    if (action.kind === "proceed_rewards" && !surface.can_proceed) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "proceed action appeared while the proceed control is disabled");
    }
  }
}

function validateExactGameIdentity(
  path: string,
  game: {
    version?: string | null;
    commit?: string | null;
    main_assembly_hash?: number | null;
    compatibility: { status: string; action_execution_allowed: boolean };
  },
  diagnostics: DiagnosticsBuilder
): void {
  if (game.compatibility.status !== "supported_exact" || !game.compatibility.action_execution_allowed) {
    diagnostics.invalid(`${path}.compatibility`, game.compatibility, "Bridge v2 execution requires supported_exact compatibility");
  }
  if (!game.version || !game.commit || game.main_assembly_hash === null || game.main_assembly_hash === undefined) {
    diagnostics.invalid(path, game, "Bridge v2 execution requires version, commit, and main assembly hash identity");
  }
}

function projectEventContext(context: { event_id: string; name?: string | null; ancient: boolean; in_dialogue: boolean; body?: string | null }): SemanticContext {
  return {
    kind: "event",
    eventId: context.event_id,
    ...(context.name ? { name: context.name } : {}),
    ancient: context.ancient,
    inDialogue: context.in_dialogue,
    ...(context.body !== undefined ? { body: context.body } : {})
  };
}

function projectCombatContext(context: BridgeV2CombatContext): SemanticContext {
  return {
    kind: "combat",
    encounterType: context.encounter_type,
    round: context.round,
    turnOwner: context.turn_owner === "player" ? "player" : context.turn_owner === "enemy" ? "enemy" : "unknown",
    isPlayPhase: context.is_play_phase,
    enemies: context.enemies.map(projectEnemy)
  };
}

function projectCombatPlayer(context: BridgeV2CombatContext): PlayerSnapshot {
  const player = context.player;
  return {
    character: player.character ?? "unknown",
    hp: player.hp,
    maxHp: player.max_hp,
    block: player.block,
    energy: player.energy,
    maxEnergy: player.max_energy,
    ...(player.stars !== null && player.stars !== undefined ? { stars: player.stars } : {}),
    gold: player.gold,
    hand: player.hand.map(projectBridgeV2Card),
    drawPileCount: player.draw_pile_count,
    discardPileCount: player.discard_pile_count,
    exhaustPileCount: player.exhaust_pile_count,
    drawPile: [],
    discardPile: [],
    exhaustPile: [],
    statuses: player.statuses.map((status) => ({
      id: status.definition_id,
      ...(status.name ? { name: status.name } : {}),
      amount: status.amount,
      type: status.type,
      ...(status.description ? { description: status.description } : {})
    })),
    relics: player.relics.map((relic) => ({
      id: relic.definition_id,
      ...(relic.name ? { name: relic.name } : {}),
      ...(relic.description ? { description: relic.description } : {}),
      ...(relic.counter !== undefined ? { counter: relic.counter } : {}),
      keywords: []
    })),
    potions: player.potions.map((potion) => ({
      id: potion.definition_id,
      ...(potion.name ? { name: potion.name } : {}),
      ...(potion.description ? { description: potion.description } : {}),
      slot: potion.slot,
      targetType: potion.target_type,
      canUseInCombat: potion.can_use,
      automatic: potion.automatic,
      keywords: []
    })),
    maxPotionSlots: player.max_potion_slots,
    orbs: player.orbs.map((orb) => ({
      id: orb.definition_id,
      ...(orb.name ? { name: orb.name } : {}),
      ...(orb.description ? { description: orb.description } : {}),
      passiveValue: orb.passive_value,
      evokeValue: orb.evoke_value
    })),
    ...(player.orb_slots !== null && player.orb_slots !== undefined ? { orbSlots: player.orb_slots } : {})
  };
}

function projectEnemy(enemy: BridgeV2CombatContext["enemies"][number]): EnemySnapshot {
  return {
    entityId: enemy.entity_id,
    ...(enemy.combat_id !== null && enemy.combat_id !== undefined ? { combatId: enemy.combat_id } : {}),
    name: enemy.name ?? enemy.definition_id,
    hp: enemy.hp,
    maxHp: enemy.max_hp,
    block: enemy.block,
    statuses: enemy.statuses.map((status) => ({
      id: status.definition_id,
      ...(status.name ? { name: status.name } : {}),
      amount: status.amount,
      type: status.type,
      ...(status.description ? { description: status.description } : {})
    })),
    intents: enemy.intents.map((intent) => ({
      type: intent.type,
      ...(intent.label ? { label: intent.label } : {}),
      ...(intent.title ? { title: intent.title } : {}),
      ...(intent.description ? { description: intent.description } : {})
    }))
  };
}

function projectDeckEnchantSurface(
  surface: BridgeV2DeckEnchantSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): DeckEnchantSelectionSurface {
  return {
    kind: "deck_enchant_selection",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    ...(surface.prompt ? { prompt: surface.prompt } : {}),
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    cancelable: surface.cancelable,
    enchantment: {
      definitionId: surface.enchantment.definition_id,
      ...(surface.enchantment.name ? { name: surface.enchantment.name } : {}),
      ...(surface.enchantment.description ? { description: surface.enchantment.description } : {}),
      amount: surface.enchantment.amount,
      ...(surface.enchantment.observation_source ? { observationSource: surface.enchantment.observation_source } : {})
    },
    cards: surface.cards.map(projectBridgeV2Card),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectEventOptionSurface(
  surface: BridgeV2EventOptionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): EventOptionSurface {
  return {
    kind: "event_option",
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    options: surface.options.map((option) => ({
      entityId: option.entity_id,
      index: option.index,
      title: option.title ?? option.description ?? `Event option ${option.index}`,
      ...(option.description ? { description: option.description } : {}),
      enabled: !option.is_locked,
      proceed: option.is_proceed,
      chosen: option.was_chosen,
      ...(option.relic_name ? { relicName: option.relic_name } : {}),
      ...(option.relic_description ? { relicDescription: option.relic_description } : {})
    })),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectCombatTurnSurface(
  roomEntityId: string,
  canEndTurn: boolean,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): CombatTurnSurface {
  return {
    kind: "combat_turn",
    bridgeStateId: stateId,
    roomEntityId,
    canEndTurn,
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectCardRewardSelectionSurface(
  surface: BridgeV2CardRewardSelectionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): CardRewardSelectionSurface {
  return {
    kind: "card_reward_selection",
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    cards: surface.cards.map(projectBridgeV2Card),
    alternatives: surface.alternatives.map((alternative) => ({
      entityId: alternative.entity_id,
      index: alternative.index,
      label: alternative.label,
      enabled: alternative.enabled
    })),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectRewardClaimSurface(
  surface: BridgeV2RewardClaimSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): BridgeRewardClaimSurface {
  return {
    kind: "reward_claim",
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    rewards: surface.rewards.map((reward) => ({
      entityId: reward.entity_id,
      kind: reward.kind,
      label: reward.label,
      ...(reward.description ? { description: reward.description } : {}),
      enabled: reward.enabled
    })),
    canProceed: surface.can_proceed,
    proceedSkipsRemainingRewards: surface.proceed_skips_remaining_rewards,
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectDiagnostic(
  diagnostic: BridgeV2Diagnostic,
  source: BridgeDiagnosticSnapshot["source"]
): BridgeDiagnosticSnapshot {
  return {
    source,
    code: diagnostic.code,
    severity: diagnostic.severity,
    category: diagnostic.category,
    effect: diagnostic.effect,
    recoverability: diagnostic.recoverability,
    ...(diagnostic.path ? { path: diagnostic.path } : {}),
    ...(diagnostic.visibility_class ? { visibilityClass: diagnostic.visibility_class } : {}),
    ...(diagnostic.required_for_action !== null && diagnostic.required_for_action !== undefined
      ? { requiredForAction: diagnostic.required_for_action }
      : {}),
    ...(diagnostic.safe_detail ? { safeDetail: diagnostic.safe_detail } : {})
  };
}

function projectActions(actions: BridgeV2LegalAction[]): BridgeLegalActionSnapshot[] {
  return actions.map((action) => ({
    actionId: action.action_id,
    stateId: action.state_id,
    kind: action.kind,
    label: action.label,
    authority: action.authority,
    evidenceCode: action.evidence_code,
    ...(action.category ? { category: action.category } : {})
  }));
}

interface RawCompleteness {
  player_visible_semantics: string;
  legal_actions: string;
  sources: string[];
  missing: string[];
}

function projectCompleteness(completeness: RawCompleteness): BridgeSurfaceCompleteness {
  return {
    playerVisibleSemantics: completeness.player_visible_semantics,
    legalActions: completeness.legal_actions,
    sources: [...completeness.sources],
    missing: [...completeness.missing]
  };
}

function unsupported(rawState: Sts2McpRawState, reason: string): NormalizedCurrentState["surface"] {
  return {
    kind: "unsupported",
    reason,
    classification: "missing_action_protocol",
    observedTopLevelKeys: Object.keys(rawState).sort()
  };
}

function safeMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}
