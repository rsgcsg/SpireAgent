import type { AdapterDescriptor } from "../game-io/adapter.js";
import {
  NORMALIZED_STATE_SCHEMA_VERSION,
  type BridgeLegalActionSnapshot,
  type BridgeDiagnosticSnapshot,
  type BridgeSurfaceCompleteness,
  type CombatPileCardSelectionSurface,
  type CombatHandCardSelectionSurface,
  type EventCardAcquisitionSurface,
  type GeneratedCardChoiceSurface,
  type CardBundleSelectionSurface,
  type CardRewardSelectionSurface,
  type BridgeRewardClaimSurface,
  type CombatTurnSurface,
  type DeckEnchantSelectionSurface,
  type DeckRemovalSelectionSurface,
  type RelicDeckRemovalSelectionSurface,
  type RewardDeckRemovalSelectionSurface,
  type DeckUpgradeSelectionSurface,
  type DeckTransformSelectionSurface,
  type WoodCarvingsReplacementSelectionSurface,
  type EnemySnapshot,
  type EventDialogueSurface,
  type EventOptionSurface,
  type MapNavigationSurface,
  type NormalizedCurrentState,
  type PlayerSnapshot,
  type RestSiteSurface,
  type ShopInventorySurface,
  type ShopRoomSurface,
  type TreasureRoomSurface,
  type GameOverSurface,
  type CharacterSelectSurface,
  type MainMenuSurface,
  type SingleplayerMenuSurface,
  type SemanticContext,
  type StateEnvelope
} from "../domain/state/index.js";
import {
  BRIDGE_V2_INSPECTION_KINDS,
  decodeBridgeV2Capabilities,
  decodeBridgeV2State,
  sameBridgeModsetIdentity,
  isBridgeV2CombatContext,
  isBridgeV2CombatPileCardSelectionSurface,
  isBridgeV2CombatHandCardSelectionSurface,
  isBridgeV2EventCardAcquisitionSurface,
  isBridgeV2GeneratedCardChoiceSurface,
  isBridgeV2CardBundleSelectionSurface,
  isBridgeV2CombatTurnSurface,
  isBridgeV2CardRewardSelectionSurface,
  isBridgeV2RewardClaimSurface,
  isBridgeV2DeckEnchantSurface,
  isBridgeV2DeckRemovalSurface,
  isBridgeV2RelicDeckRemovalSurface,
  isBridgeV2RewardDeckRemovalSurface,
  isBridgeV2DeckUpgradeSurface,
  isBridgeV2DeckTransformSurface,
  isBridgeV2WoodCarvingsReplacementSurface,
  isBridgeV2EventContext,
  isBridgeV2EventDialogueSurface,
  isBridgeV2EventOptionSurface,
  isBridgeV2RewardFlowContext,
  isBridgeV2RestContext,
  isBridgeV2RestSiteSurface,
  isBridgeV2ShopContext,
  isBridgeV2ShopInventorySurface,
  isBridgeV2ShopRoomSurface,
  isBridgeV2TreasureContext,
  isBridgeV2TreasureRoomSurface,
  isBridgeV2GameOverContext,
  isBridgeV2GameOverSurface,
  isBridgeV2MenuContext,
  isBridgeV2CharacterSelectSurface,
  isBridgeV2MainMenuSurface,
  isBridgeV2SingleplayerMenuSurface,
  isBridgeV2MapContext,
  isBridgeV2MapNavigationSurface,
  isBridgeV2CombatTransitionContext,
  isBridgeV2NoActionSurface,
  isBridgeV2UnsupportedSurface,
  type BridgeV2CombatContext,
  type BridgeV2CombatPileCardSelectionSurface,
  type BridgeV2CombatHandCardSelectionSurface,
  type BridgeV2EventCardAcquisitionSurface,
  type BridgeV2GeneratedCardChoiceSurface,
  type BridgeV2CardBundleSelectionSurface,
  type BridgeV2CardRewardSelectionSurface,
  type BridgeV2RewardClaimSurface,
  type BridgeV2SharedVisibleState,
  type BridgeV2RestSiteSurface,
  type BridgeV2ShopContext,
  type BridgeV2ShopInventorySurface,
  type BridgeV2ShopRoomSurface,
  type BridgeV2TreasureRoomSurface,
  type BridgeV2GameOverContext,
  type BridgeV2GameOverSurface,
  type BridgeV2CharacterSelectSurface,
  type BridgeV2MainMenuSurface,
  type BridgeV2SingleplayerMenuSurface,
  type BridgeV2MapContext,
  type BridgeV2MapNavigationSurface,
  type BridgeV2DeckEnchantSurface,
  type BridgeV2DeckRemovalSurface,
  type BridgeV2RelicDeckRemovalSurface,
  type BridgeV2RewardDeckRemovalSurface,
  type BridgeV2DeckUpgradeSurface,
  type BridgeV2DeckTransformSurface,
  type BridgeV2WoodCarvingsReplacementSurface,
  type BridgeV2Diagnostic,
  type BridgeV2EventDialogueSurface,
  type BridgeV2EventOptionSurface,
  type BridgeV2InspectionKind,
  type BridgeV2LegalAction
} from "../integrations/sts2mcp/bridgeV2Protocol.js";
import {
  bridgeV2CapabilitiesFromWrapper,
  bridgeV2InspectionIdentity,
  bridgeV2InspectionsFromWrapper,
  bridgeV2ObservationFromWrapper,
  bridgeV2StateFromWrapper,
  legacyStateFromBridgeV2Wrapper,
  type Sts2McpRawState
} from "../integrations/sts2mcp/rawState.js";
import { stateHash } from "../runtime/stateHash.js";
import type { JsonObject } from "../shared/json.js";
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
  deck_removal_selection: new Set([
    "toggle_deck_removal_card",
    "preview_deck_removal",
    "confirm_deck_removal",
    "cancel_deck_removal_preview",
    "cancel_deck_removal_selection"
  ]),
  relic_deck_removal_selection: new Set([
    "toggle_deck_removal_card",
    "preview_deck_removal",
    "confirm_deck_removal",
    "cancel_deck_removal_preview",
    "cancel_deck_removal_selection"
  ]),
  reward_deck_removal_selection: new Set([
    "toggle_deck_removal_card",
    "preview_deck_removal",
    "confirm_deck_removal",
    "cancel_deck_removal_preview",
    "cancel_deck_removal_selection"
  ]),
  deck_upgrade_selection: new Set([
    "toggle_deck_upgrade_card",
    "confirm_deck_upgrade",
    "cancel_deck_upgrade_preview",
    "cancel_deck_upgrade_selection"
  ]),
  deck_transform_selection: new Set([
    "toggle_deck_transform_card",
    "preview_deck_transform",
    "confirm_deck_transform",
    "cancel_deck_transform_preview",
    "cancel_deck_transform_selection",
    "toggle_deck_transform_upgrade_view"
  ]),
  wood_carvings_replacement_selection: new Set([
    "select_wood_carvings_replacement_card",
    "confirm_wood_carvings_replacement",
    "cancel_wood_carvings_replacement_preview"
  ]),
  event_dialogue: new Set(["advance_event_dialogue"]),
  event_option: new Set(["choose_event_option", "proceed_event"]),
  rest_site: new Set(["choose_rest_option", "proceed_rest_site"]),
  combat_turn: new Set(["play_card", "use_potion", "end_turn"]),
  combat_pile_card_selection: new Set([
    "select_discard_card_for_draw_top",
    "select_discard_card_for_hand",
    "select_draw_card_for_exhaust",
    "select_draw_card_for_soul_transform",
    "toggle_discard_card_for_dredge",
    "toggle_draw_card_for_charge"
  ]),
  combat_hand_card_selection: new Set([
    "select_combat_hand_card",
    "deselect_combat_hand_card",
    "confirm_combat_hand_selection",
    "close_combat_hand_peek"
  ]),
  event_card_acquisition: new Set([
    "select_event_card_acquisition",
    "deselect_event_card_acquisition"
  ]),
  generated_card_choice: new Set([
    "select_generated_run_card",
    "skip_generated_run_card_choice",
    "select_generated_combat_card",
    "skip_generated_combat_card_choice",
    "choose_quasar_card",
    "skip_quasar_choice",
    "choose_knowledge_demon_curse"
  ]),
  card_bundle_selection: new Set([
    "preview_card_bundle",
    "confirm_card_bundle",
    "cancel_card_bundle_preview"
  ]),
  card_reward_selection: new Set(["select_card_reward", "choose_card_reward_alternative"]),
  reward_claim: new Set(["claim_reward", "discard_potion_for_reward", "proceed_rewards"]),
  map_navigation: new Set(["choose_map_node"]),
  shop_inventory: new Set([
    "purchase_shop_card",
    "purchase_shop_relic",
    "purchase_shop_potion",
    "open_shop_card_removal",
    "close_shop_inventory"
  ]),
  shop_room: new Set(["open_shop_inventory", "proceed_shop"]),
  treasure_room: new Set([
    "open_treasure_chest",
    "choose_treasure_relic",
    "skip_treasure_relic",
    "proceed_treasure_room"
  ]),
  game_over: new Set(["advance_game_over_summary", "return_game_over"]),
  character_select: new Set([
    "select_character",
    "decrease_ascension",
    "increase_ascension",
    "embark_standard_run",
    "back_from_character_select"
  ]),
  main_menu: new Set(["continue_run", "open_singleplayer"]),
  singleplayer_menu: new Set(["open_standard_run_setup", "back_from_singleplayer_menu"])
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
  const sharedProjection = state?.shared_state ? projectSharedVisibleState(state.shared_state) : undefined;
  const mayInheritLegacy = state?.surface.kind === "unsupported"
    && state.authority_handoff.status !== "bridge_owned";
  let context: SemanticContext = {
    kind: "unknown",
    reason: "Bridge v2 context could not be decoded",
    observedTopLevelKeys: Object.keys(rawState).sort()
  };
  let run = sharedProjection?.run ?? (mayInheritLegacy ? inherited?.run : undefined);
  let player = sharedProjection?.player ?? (mayInheritLegacy ? inherited?.player : undefined);
  if (state && isBridgeV2EventContext(state.context)) {
    context = projectEventContext(state.context);
  } else if (state && isBridgeV2CombatContext(state.context)) {
    context = projectCombatContext(state.context);
    if (state.shared_state) player = projectCombatPlayer(state.context, state.shared_state);
  } else if (state && isBridgeV2RewardFlowContext(state.context)) {
    context = { kind: "reward_flow", rewardKind: state.context.reward_kind };
  } else if (state && isBridgeV2RestContext(state.context)) {
    context = { kind: "rest" };
  } else if (state && isBridgeV2ShopContext(state.context)) {
    context = projectShopContext(sharedProjection?.player);
  } else if (state && isBridgeV2TreasureContext(state.context)) {
    context = { kind: "treasure" };
  } else if (state && isBridgeV2GameOverContext(state.context)) {
    context = projectGameOverContext(state.context);
  } else if (state && isBridgeV2MenuContext(state.context)) {
    context = state.context.flow === "root_navigation"
      ? { kind: "menu", screen: "main_menu", message: "Navigate the visible root menu." }
      : {
          kind: "menu",
          screen: state.surface.kind === "singleplayer_menu" ? "singleplayer_menu" : "character_select",
          message: "Choose a standard run setup action."
        };
  } else if (state && isBridgeV2MapContext(state.context)) {
    context = projectMapContext(state.context);
  } else if (state && isBridgeV2CombatTransitionContext(state.context)) {
    context = { kind: "combat_transition", phase: state.context.phase };
  }

  const inspectionRaw = bridgeV2InspectionsFromWrapper(rawState);
  const observationRaw = bridgeV2ObservationFromWrapper(rawState);
  if (state) {
    const availableKinds = new Set(state.inspection_catalog.map((entry) => entry.kind));
    for (const kind of Object.keys(inspectionRaw)) {
      if (!availableKinds.has(kind as BridgeV2InspectionKind)) {
        diagnostics.invalid(
          `bridge_v2_inspections.${kind}`,
          inspectionRaw[kind as BridgeV2InspectionKind],
          "inspection sidecar was not advertised by the current state-bound catalog"
        );
      }
    }
  }
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
  const bridgeInspectionFacts = {
    ...(projectedInspections.runDeck ? { runDeck: projectedInspections.runDeck } : {}),
    ...(projectedInspections.drawPile ? { drawPile: projectedInspections.drawPile } : {}),
    ...(projectedInspections.discardPile ? { discardPile: projectedInspections.discardPile } : {}),
    ...(projectedInspections.exhaustPile ? { exhaustPile: projectedInspections.exhaustPile } : {}),
    ...(projectedInspections.shopCatalog ? { shopCatalog: projectedInspections.shopCatalog } : {})
  };

  const bridgeObservation = state && observationRaw
    ? projectCoherentObservation(observationRaw, state.state_id, Object.keys(inspectionRaw), diagnostics)
    : undefined;

  if (mayInheritLegacy && (inherited?.run || inherited?.player)) {
    diagnostics.infer(
      "run/non_action_shared_state",
      ["legacy_v1_state"],
      "legacy fallback state only; a Bridge-owned semantic surface may not inherit shared facts from v1"
    );
  }

  const base = {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType: state ? `bridge_v2:${state.context.kind}:${state.surface.kind}` : "bridge_v2:invalid",
    ...(run ? { run } : {}),
    ...(player ? { player } : {}),
    ...(state && capabilities ? {
      ...(state.shared_state ? {
        bridgeSharedStateEvidence: {
          scope: state.shared_state.scope,
          playerVisibleSemantics: state.shared_state.completeness.player_visible_semantics,
          sources: [...state.shared_state.completeness.sources],
          missing: [...state.shared_state.completeness.missing]
        }
      } : {}),
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
      bridgeVisibility: {
        profileId: state.visibility.profile_id,
        coreStatus: state.visibility.core_status,
        playerVisibleClosureStatus: state.visibility.player_visible_closure_status,
        availableInspections: [...state.visibility.available_inspections],
        linkedDetailKinds: [...state.visibility.linked_detail_kinds],
        hiddenByPolicy: [...state.visibility.hidden_by_policy],
        missing: [...state.visibility.missing],
        unknownCriticalFieldBehavior: state.visibility.unknown_critical_field_behavior
      },
      bridgeInspectionCatalog: state.inspection_catalog.map((entry) => ({
        kind: entry.kind,
        scope: entry.scope,
        availability: entry.availability,
        visibilityBasis: entry.visibility_basis,
        stateBound: entry.state_bound,
        createsActionAuthority: entry.creates_action_authority,
        orderingSemantics: entry.ordering_semantics,
        estimatedCost: entry.estimated_cost,
        recommendedFor: [...entry.recommended_for],
        hiddenByPolicy: [...entry.hidden_by_policy]
      })),
      bridgeContractInstanceShadow: {
        status: state.contract_instance_shadow.status,
        instanceId: state.contract_instance_shadow.instance_id,
        surfaceKind: state.contract_instance_shadow.surface_kind,
        ...(state.contract_instance_shadow.semantic_contract_id
          ? { semanticContractId: state.contract_instance_shadow.semantic_contract_id }
          : {}),
        ...(state.contract_instance_shadow.declared_binding
          ? { declaredBinding: state.contract_instance_shadow.declared_binding }
          : {}),
        operations: state.contract_instance_shadow.operations.map((operation) => ({
          operation: operation.operation,
          evidenceStatus: operation.evidence_status,
          published: operation.published
        })),
        currentAuthorityTier: state.contract_instance_shadow.current_authority_tier,
        currentAuthorityBasis: state.contract_instance_shadow.current_authority_basis,
        authorizing: state.contract_instance_shadow.authorizing,
        limitations: [...state.contract_instance_shadow.limitations]
      },
      ...(bridgeObservation ? { bridgeObservation } : {}),
      bridgeInspections: projectedInspections.evidence,
      ...(Object.keys(bridgeInspectionFacts).length > 0 ? { bridgeInspectionFacts } : {})
    } : {})
  };
  let surface: NormalizedCurrentState["surface"] = unsupported(rawState, "Bridge v2 state could not be decoded");
  let stability: NormalizedCurrentState["stability"] = "invalid";
  let actionAuthority: NormalizedCurrentState["actionAuthority"] = "none";

  if (state && capabilities) {
    const candidateBuild = isCandidateBuild(state, capabilities);
    const observationOnlyCandidate = isObservationOnlyCandidate(state, capabilities);
    const actionCanaryCandidate = isActionCanaryCandidate(state, capabilities);
    const scopedQualifiedBuild = isScopedQualifiedBuild(state, capabilities);
    validateEnvelopeIdentity(state, capabilities, diagnostics);
    validateStructuredDiagnostics(
      [...capabilities.diagnostics, ...state.diagnostics],
      state.legal_actions.length,
      diagnostics
    );
    validateAuthorityHandoff(state, capabilities, diagnostics);
    validateSharedVisibleState(state.shared_state, state.surface.kind, diagnostics);

    if (!state.game.compatibility.action_execution_allowed || !capabilities.game.compatibility.action_execution_allowed) {
      if (observationOnlyCandidate) {
        if (!isBridgeV2DeckRemovalSurface(state.surface) || !isBridgeV2ShopContext(state.context)) {
          diagnostics.invalid("bridge_v2.observation_only.surface", state.surface, "candidate observation may expose only shop deck_removal_selection");
        } else if (state.readiness !== "observation_only") {
          diagnostics.invalid("bridge_v2.observation_only.readiness", state.readiness, "candidate observation must use observation_only readiness");
        } else if (state.legal_actions.length !== 0) {
          diagnostics.invalid("bridge_v2.observation_only.legal_actions", state.legal_actions, "candidate observation must not publish executable actions");
        } else {
          const advertised = capabilities.surfaces.find((candidate) => candidate.kind === state.surface.kind);
          if (!advertised || advertised.support !== "candidate_observation_only") {
            diagnostics.invalid(
              "bridge_v2.capabilities.surfaces",
              capabilities.surfaces,
              "candidate observation surface must be explicitly advertised as candidate_observation_only"
            );
          }
          validateDeckRemovalFacts(state.surface, diagnostics);
          surface = projectDeckRemovalSurface(state.surface, state.state_id, [], state.completeness);
          stability = "unknown";
          actionAuthority = "none";
          diagnostics.infer(
            "bridge_v2.observation_only",
            ["bridge_v2.game.compatibility", "bridge_v2.state"],
            "candidate-build player-visible evidence is intentionally non-executable and cannot fall back to legacy execution"
          );
        }
      } else if (candidateBuild && isBridgeV2UnsupportedSurface(state.surface) && state.readiness === "unsupported" && state.legal_actions.length === 0) {
        surface = unsupported(rawState, "This surface is not qualified for the current Bridge v2 candidate build");
        stability = "unknown";
        actionAuthority = "none";
        diagnostics.infer(
          "bridge_v2.candidate_build.unqualified_surface",
          ["bridge_v2.game.compatibility", "bridge_v2.state"],
          "candidate-build observation authority is limited to deck_removal_selection; this surface remains safely unsupported"
        );
      } else {
        diagnostics.invalid("bridge_v2.game.compatibility", state.game.compatibility, "exact-build action execution is disabled");
        surface = unsupported(rawState, "Bridge v2 exact game-build compatibility did not pass");
      }
    } else if (actionCanaryCandidate) {
      if (!isBridgeV2DeckRemovalSurface(state.surface) || !isBridgeV2ShopContext(state.context)) {
        diagnostics.invalid("bridge_v2.action_canary.surface", state.surface, "action canary may expose only shop deck_removal_selection");
      } else {
        const advertised = capabilities.surfaces.find((candidate) => candidate.kind === state.surface.kind);
        if (!advertised || advertised.support !== "candidate_action_canary") {
          diagnostics.invalid(
            "bridge_v2.capabilities.surfaces",
            capabilities.surfaces,
            "action canary surface must be explicitly advertised as candidate_action_canary"
          );
        }
        if (state.readiness !== "ready" && state.readiness !== "settling") {
          diagnostics.invalid("bridge_v2.action_canary.readiness", state.readiness, "action canary must be ready or settling");
        }
        validateDeckRemovalState(
          state.surface,
          state.state_id,
          state.legal_actions,
          state.completeness.missing,
          new Set(advertised?.operations ?? []),
          state.readiness,
          diagnostics
        );
        surface = projectDeckRemovalSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
        stability = state.readiness === "ready" ? "actionable" : "settling";
        actionAuthority = "bridge_advertised";
        diagnostics.infer(
          "bridge_v2.action_canary",
          ["bridge_v2.game.compatibility", "bridge_v2.state"],
          "candidate-build action authority is restricted to the exact merchant-removal surface; only explicitly scoped v2 inspection is permitted and no legacy sidecar may merge"
        );
      }
    } else if (isBridgeV2NoActionSurface(state.surface) && isBridgeV2CombatTransitionContext(state.context)) {
      if (state.readiness !== "settling"
          || state.legal_actions.length !== 0
          || state.completeness.missing.length !== 0) {
        diagnostics.invalid(
          "bridge_v2.no_action",
          state,
          "combat-transition no_action must be settling, complete, and publish no actions"
        );
      }
      surface = {
        kind: "no_action",
        reason: "settling",
        ...(state.surface.message ? { message: state.surface.message } : {})
      };
      stability = "settling";
      actionAuthority = "none";
    } else if (isBridgeV2UnsupportedSurface(state.surface)) {
      surface = unsupported(rawState, `Bridge v2 does not implement ${state.surface.source_type}: ${state.surface.reason}`);
      stability = "unknown";
    } else {
      const advertised = capabilities.surfaces.find((candidate) => candidate.kind === state.surface.kind);
      const expectedSupport = scopedQualifiedBuild
        ? capabilities.game.compatibility.action_execution_surface_kinds.includes(state.surface.kind)
          ? "qualified_exact_build"
          : capabilities.game.compatibility.action_canary_surface_kinds.includes(state.surface.kind)
            ? "candidate_action_canary"
            : "not_qualified_for_current_build"
        : "implemented_exact_game_version";
      if (scopedQualifiedBuild && expectedSupport === "not_qualified_for_current_build") {
        diagnostics.invalid(
          "bridge_v2.game.compatibility.action_scope",
          state.surface.kind,
          "an active scoped-build surface must be explicitly qualified or action-canary authorized"
        );
      }
      if (!advertised || advertised.support !== expectedSupport) {
        diagnostics.invalid(
          "bridge_v2.capabilities.surfaces",
          capabilities.surfaces,
          `current surface is not advertised as ${expectedSupport}`
        );
      }
      const blockedMenu = state.readiness === "blocked"
        && (isBridgeV2MainMenuSurface(state.surface) || isBridgeV2SingleplayerMenuSurface(state.surface));
      if (state.readiness !== "ready" && state.readiness !== "settling" && !blockedMenu) {
        diagnostics.invalid("bridge_v2.readiness", state.readiness, "supported surface must be ready or settling");
      }

      const advertisedOperations = new Set(advertised?.operations ?? []);
      if (isBridgeV2DeckEnchantSurface(state.surface)) {
        if (!isBridgeV2EventContext(state.context) && !isBridgeV2CombatContext(state.context)) {
          diagnostics.invalid("bridge_v2.context", state.context, "deck enchant requires a qualified event or combat context");
        }
        validateDeckEnchantState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectDeckEnchantSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2DeckRemovalSurface(state.surface) && isBridgeV2ShopContext(state.context)) {
        validateDeckRemovalState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectDeckRemovalSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2RelicDeckRemovalSurface(state.surface)) {
        validateDeckRemovalState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectRelicDeckRemovalSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2RewardDeckRemovalSurface(state.surface)) {
        validateDeckRemovalState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectRewardDeckRemovalSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2DeckUpgradeSurface(state.surface)
          && (isBridgeV2EventContext(state.context) || isBridgeV2RestContext(state.context))) {
        validateDeckUpgradeState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectDeckUpgradeSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2DeckTransformSurface(state.surface)
          && isBridgeV2EventContext(state.context)
          && state.context.event_id === "WHISPERING_HOLLOW") {
        validateDeckTransformState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectDeckTransformSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2WoodCarvingsReplacementSurface(state.surface)
          && isBridgeV2EventContext(state.context)
          && state.context.event_id === "WOOD_CARVINGS") {
        validateWoodCarvingsReplacementState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectWoodCarvingsReplacementSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2EventDialogueSurface(state.surface) && isBridgeV2EventContext(state.context)) {
        validateEventDialogueState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectEventDialogueSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2EventOptionSurface(state.surface) && isBridgeV2EventContext(state.context)) {
        validateEventOptionState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectEventOptionSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2RestSiteSurface(state.surface) && isBridgeV2RestContext(state.context)) {
        validateRestSiteState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectRestSiteSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2ShopInventorySurface(state.surface) && isBridgeV2ShopContext(state.context)) {
        validateShopInventoryState(state.shared_state, state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectShopInventorySurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2ShopRoomSurface(state.surface) && isBridgeV2ShopContext(state.context)) {
        validateShopRoomState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectShopRoomSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2TreasureRoomSurface(state.surface) && isBridgeV2TreasureContext(state.context)) {
        validateTreasureRoomState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectTreasureRoomSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2GameOverSurface(state.surface) && isBridgeV2GameOverContext(state.context)) {
        validateGameOverState(state.context, state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectGameOverSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2CharacterSelectSurface(state.surface) && isBridgeV2MenuContext(state.context)) {
        validateCharacterSelectState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectCharacterSelectSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2MainMenuSurface(state.surface)
          && isBridgeV2MenuContext(state.context)
          && state.context.flow === "root_navigation") {
        validateMainMenuState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectMainMenuSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2SingleplayerMenuSurface(state.surface)
          && isBridgeV2MenuContext(state.context)
          && state.context.flow === "standard_run_setup") {
        validateSingleplayerMenuState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectSingleplayerMenuSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2CombatTurnSurface(state.surface) && isBridgeV2CombatContext(state.context)) {
        validateCombatTurnState(state.shared_state, state.context, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectCombatTurnSurface(state.surface.room_entity_id, state.surface.can_end_turn, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2CombatPileCardSelectionSurface(state.surface) && isBridgeV2CombatContext(state.context)) {
        validateCombatPileCardSelectionState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectCombatPileCardSelectionSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2CombatHandCardSelectionSurface(state.surface) && isBridgeV2CombatContext(state.context)) {
        validateCombatHandCardSelectionState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectCombatHandCardSelectionSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2EventCardAcquisitionSurface(state.surface) && isBridgeV2EventContext(state.context)) {
        validateEventCardAcquisitionState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectEventCardAcquisitionSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2GeneratedCardChoiceSurface(state.surface)
                 && ((state.surface.source_kind === "lead_paperweight"
                      && isBridgeV2EventContext(state.context)
                      && state.context.event_id === "NEOW")
                     || (state.surface.source_kind !== "lead_paperweight"
                         && isBridgeV2CombatContext(state.context)))) {
        validateGeneratedCardChoiceState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectGeneratedCardChoiceSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2CardBundleSelectionSurface(state.surface)) {
        validateCardBundleSelectionState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectCardBundleSelectionSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2CardRewardSelectionSurface(state.surface) && isBridgeV2RewardFlowContext(state.context)) {
        validateCardRewardSelectionState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectCardRewardSelectionSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2RewardClaimSurface(state.surface)
          && isBridgeV2RewardFlowContext(state.context)
          && state.context.reward_kind === "room_rewards") {
        validateRewardClaimState(state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectRewardClaimSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
      } else if (isBridgeV2MapNavigationSurface(state.surface) && isBridgeV2MapContext(state.context)) {
        validateMapNavigationState(state.context, state.surface, state.state_id, state.legal_actions, state.completeness.missing, advertisedOperations, state.readiness, diagnostics);
        surface = projectMapNavigationSurface(state.context, state.surface, state.state_id, state.legal_actions, state.completeness);
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
    // observed_at is excluded. The Bridge state id already includes the
    // top-level shared_state; legacy data participates only on unsupported
    // states where the v1 fallback still owns observation.
    stateHash: stateHash({
      bridgeStateId: state?.state_id ?? null,
      legacyState: legacyRaw ?? null,
      inspections: bridgeV2InspectionIdentity(inspectionRaw)
    }),
    normalizedStateHash: stateHash(currentState)
  };
}

function validateAuthorityHandoff(
  state: NonNullable<ReturnType<typeof decodeBridgeV2State>["data"]>,
  capabilities: NonNullable<ReturnType<typeof decodeBridgeV2Capabilities>["data"]>,
  diagnostics: DiagnosticsBuilder
): void {
  const handoff = state.authority_handoff;
  if (isBridgeV2NoActionSurface(state.surface)) {
    if (handoff.status !== "none_fail_closed"
        || handoff.surface_kind != null
        || state.legal_actions.length !== 0) {
      diagnostics.invalid(
        "bridge_v2.authority_handoff",
        handoff,
        "a no-input lifecycle transition must retain none_fail_closed authority and publish no actions"
      );
    }
    return;
  }
  if (!isBridgeV2UnsupportedSurface(state.surface)) {
    if (handoff.status !== "bridge_owned" || handoff.surface_kind !== state.surface.kind) {
      diagnostics.invalid(
        "bridge_v2.authority_handoff",
        handoff,
        "a semantic Bridge v2 surface must retain exclusive bridge ownership"
      );
    }
    return;
  }

  if (state.legal_actions.length !== 0 || handoff.status === "bridge_owned") {
    diagnostics.invalid(
      "bridge_v2.authority_handoff",
      handoff,
      "an unsupported surface cannot publish actions or claim Bridge v2 ownership"
    );
  }
  if (handoff.status !== "none_fail_closed" || handoff.surface_kind != null) {
    diagnostics.invalid(
      "bridge_v2.authority_handoff",
      handoff,
      "an unsupported surface must retain none_fail_closed authority"
    );
  }
}

function validateEnvelopeIdentity(
  state: NonNullable<ReturnType<typeof decodeBridgeV2State>["data"]>,
  capabilities: NonNullable<ReturnType<typeof decodeBridgeV2Capabilities>["data"]>,
  diagnostics: DiagnosticsBuilder
): void {
  if (state.bridge.id !== capabilities.bridge.id
      || state.bridge.version !== capabilities.bridge.version
      || state.bridge.upstream_commit !== capabilities.bridge.upstream_commit
      || state.bridge.module_version_id !== capabilities.bridge.module_version_id
      || state.bridge.assembly_file_sha256 !== capabilities.bridge.assembly_file_sha256
      || state.bridge.runtime_instance_id !== capabilities.bridge.runtime_instance_id) {
    diagnostics.invalid("bridge_v2.identity", state.bridge, "state and capabilities bridge identities differ");
  }
  if (state.game.compatibility.action_execution_allowed !== capabilities.game.compatibility.action_execution_allowed) {
    diagnostics.invalid("bridge_v2.game.compatibility", state.game.compatibility, "state and capabilities execution authority differ");
  }
  if (state.game.compatibility.state_observation_allowed !== capabilities.game.compatibility.state_observation_allowed
      || state.game.compatibility.inspection_allowed !== capabilities.game.compatibility.inspection_allowed
      || !sameStrings(
        state.game.compatibility.action_execution_surface_kinds,
        capabilities.game.compatibility.action_execution_surface_kinds
      )
      || !sameStrings(
        state.game.compatibility.action_canary_surface_kinds,
        capabilities.game.compatibility.action_canary_surface_kinds
      )
      || !sameActionPermissionScopes(
        state.game.compatibility.action_permission_scopes,
        capabilities.game.compatibility.action_permission_scopes
      )
      || !sameStrings(
        state.game.compatibility.inspection_allowed_kinds,
        capabilities.game.compatibility.inspection_allowed_kinds
      )
      || !sameStrings(
        state.game.compatibility.inspection_canary_kinds,
        capabilities.game.compatibility.inspection_canary_kinds
      )
      || !sameStrings(
        state.game.compatibility.observation_only_surface_kinds,
        capabilities.game.compatibility.observation_only_surface_kinds
      )
      || !sameStrings(
        state.game.compatibility.observation_candidate_build_fingerprints,
        capabilities.game.compatibility.observation_candidate_build_fingerprints
      )) {
    diagnostics.invalid("bridge_v2.game.compatibility", state.game.compatibility, "state and capabilities observation authority differ");
  }
  if (state.game.version !== capabilities.game.version
      || state.game.commit !== capabilities.game.commit
      || state.game.main_assembly_hash !== capabilities.game.main_assembly_hash
      || state.game.release_declared_main_assembly_hash
        !== capabilities.game.release_declared_main_assembly_hash
      || !sameBridgeModsetIdentity(state.game, capabilities.game)) {
    diagnostics.invalid("bridge_v2.game.identity", state.game, "state and capabilities game identities differ");
  }
  if (isCandidateBuild(state, capabilities)) {
    validateCandidateBuildIdentity("bridge_v2.state.game", state.game, diagnostics);
    validateCandidateBuildIdentity("bridge_v2.capabilities.game", capabilities.game, diagnostics);
  } else if (isScopedQualifiedBuild(state, capabilities)) {
    validateScopedQualifiedIdentity("bridge_v2.state.game", state.game, diagnostics);
    validateScopedQualifiedIdentity("bridge_v2.capabilities.game", capabilities.game, diagnostics);
  } else {
    validateExactGameIdentity("bridge_v2.state.game", state.game, diagnostics);
    validateExactGameIdentity("bridge_v2.capabilities.game", capabilities.game, diagnostics);
  }
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
  const candidateInspectionCanary = capabilities.game.compatibility.status === "action_and_inspection_canary_candidate";
  const scopedInspection = capabilities.game.compatibility.status === "qualified_scoped";
  const expectedInspectionStatus = !capabilities.game.compatibility.inspection_allowed
    ? "disabled_for_current_build"
    : candidateInspectionCanary
      ? "candidate_read_only_canary"
      : scopedInspection
        ? capabilities.game.compatibility.inspection_canary_kinds.length > 0
          && capabilities.game.compatibility.inspection_allowed_kinds.length > 0
            ? "mixed_scoped_read_only"
            : capabilities.game.compatibility.inspection_canary_kinds.length > 0
              ? "candidate_read_only_canary"
              : "qualified_read_only_scoped"
        : "implemented_read_only";
  const expectedInspectionKinds = capabilities.game.compatibility.inspection_allowed
    ? [...new Set([
      ...capabilities.game.compatibility.inspection_allowed_kinds,
      ...capabilities.game.compatibility.inspection_canary_kinds
    ])].sort().join(",")
    : "";
  if (capabilities.inspections.status !== expectedInspectionStatus
      || !capabilities.inspections.state_bound
      || capabilities.inspections.arbitrary_queries_allowed
      || capabilities.inspections.enters_command_ledger
      || inspectionKinds.join(",") !== expectedInspectionKinds) {
    diagnostics.invalid(
      "bridge_v2.inspections",
      capabilities.inspections,
      "inspection capability does not match this build's exact, state-bound inspection scope"
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
  if (readiness === "blocked" && actions.length > 0) {
    diagnostics.invalid("bridge_v2.legal_actions", actions, `blocked ${surfaceKind} surface must not advertise executable actions`);
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
  validateBoundedCardSelectionFacts(surface, diagnostics);
  validateActions("deck_enchant_selection", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    if (surface.stage === "selecting" && (action.kind === "confirm_selection" || action.kind === "cancel_preview")) diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "preview-only action appeared during selecting stage");
    if (surface.stage === "preview" && (action.kind === "toggle_card" || action.kind === "preview_selection" || action.kind === "close_selection")) diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "selecting-only action appeared during preview stage");
  }
}

function validateDeckRemovalState(
  surface: BridgeV2DeckRemovalSurface | BridgeV2RelicDeckRemovalSurface | BridgeV2RewardDeckRemovalSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  validateDeckRemovalFacts(surface, diagnostics);
  validateActions(surface.kind, stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    if (surface.stage === "selecting" && (action.kind === "confirm_deck_removal" || action.kind === "cancel_deck_removal_preview")) diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "preview-only action appeared during selecting stage");
    if (surface.stage === "preview" && (action.kind === "toggle_deck_removal_card" || action.kind === "preview_deck_removal" || action.kind === "cancel_deck_removal_selection")) diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "selecting-only action appeared during preview stage");
  }
}

function validateDeckRemovalFacts(
  surface: BridgeV2DeckRemovalSurface | BridgeV2RelicDeckRemovalSurface | BridgeV2RewardDeckRemovalSurface,
  diagnostics: DiagnosticsBuilder
): void {
  validateBoundedCardSelectionFacts(surface, diagnostics);
}

function validateDeckUpgradeState(
  surface: BridgeV2DeckUpgradeSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  validateBoundedCardSelectionFacts(surface, diagnostics);
  validateActions("deck_upgrade_selection", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  const previewIds = new Set(surface.preview_cards.map((card) => card.entity_id));
  if (previewIds.size !== surface.preview_cards.length) {
    diagnostics.invalid("bridge_v2.surface.preview_cards", surface.preview_cards, "preview card entity ids are not unique");
  }
  if (surface.stage === "selecting") {
    if (surface.preview_cards.length !== 0) diagnostics.invalid("bridge_v2.surface.preview_cards", surface.preview_cards, "selecting stage cannot expose hidden preview cards");
    for (const action of actions) {
      if (action.kind === "confirm_deck_upgrade" || action.kind === "cancel_deck_upgrade_preview") {
        diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "preview-only upgrade action appeared during selecting stage");
      }
    }
  } else {
    if (surface.selected_count === 0 || surface.preview_cards.length !== surface.selected_count) {
      diagnostics.invalid("bridge_v2.surface.preview_cards", surface.preview_cards, "preview stage must expose one upgraded preview per selected card");
    }
    for (const action of actions) {
      if (action.kind === "toggle_deck_upgrade_card" || action.kind === "cancel_deck_upgrade_selection") {
        diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "selecting-only upgrade action appeared during preview stage");
      }
    }
  }
}

function validateDeckTransformState(
  surface: BridgeV2DeckTransformSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  validateBoundedCardSelectionFacts(surface, diagnostics);
  validateActions("deck_transform_selection", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  if (surface.showing_upgrade_previews && !surface.upgrade_toggle_visible) {
    diagnostics.invalid("bridge_v2.surface.showing_upgrade_previews", surface, "hidden upgrade toggle cannot own an active upgraded preview mode");
  }
  if (surface.replacement_known !== false) {
    diagnostics.invalid("bridge_v2.surface.replacement_known", surface.replacement_known, "random transform replacement must remain unknown before commit");
  }
  if (surface.stage === "selecting") {
    if (surface.preview_kind !== "none") {
      diagnostics.invalid("bridge_v2.surface.preview_kind", surface.preview_kind, "selecting stage cannot expose a transform preview");
    }
    for (const action of actions) {
      if (action.kind === "confirm_deck_transform" || action.kind === "cancel_deck_transform_preview") {
        diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "preview-only transform action appeared during selecting stage");
      }
    }
  } else {
    if (surface.preview_kind !== "random_uncommitted_cycle" || surface.selected_count === 0) {
      diagnostics.invalid("bridge_v2.surface.preview_kind", surface, "preview stage requires selected cards and explicit random-uncommitted semantics");
    }
    for (const action of actions) {
      if (action.kind === "toggle_deck_transform_card"
          || action.kind === "preview_deck_transform"
          || action.kind === "cancel_deck_transform_selection"
          || action.kind === "toggle_deck_transform_upgrade_view") {
        diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "selecting-only transform action appeared during preview stage");
      }
    }
  }
}

function validateWoodCarvingsReplacementState(
  surface: BridgeV2WoodCarvingsReplacementSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  validateBoundedCardSelectionFacts(surface, diagnostics);
  validateActions("wood_carvings_replacement_selection", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  const expectedReplacement = surface.branch === "bird" ? "PECK" : "TORIC_TOUGHNESS";
  if (surface.replacement_definition_id !== expectedReplacement) {
    diagnostics.invalid("bridge_v2.surface.replacement_definition_id", surface, "Wood Carvings branch and deterministic replacement disagree");
  }
  if (surface.stage === "selecting") {
    if (surface.selected_count !== 0) diagnostics.invalid("bridge_v2.surface.selected_count", surface.selected_count, "Wood Carvings selecting stage must not retain a selected card");
    for (const action of actions) {
      if (action.kind !== "select_wood_carvings_replacement_card") diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "preview-only Wood Carvings action appeared while selecting");
    }
  } else {
    if (surface.selected_count !== 1) diagnostics.invalid("bridge_v2.surface.selected_count", surface.selected_count, "Wood Carvings preview requires exactly one selected card");
    for (const action of actions) {
      if (action.kind === "select_wood_carvings_replacement_card") diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "selection action appeared during Wood Carvings preview");
    }
  }
}

function validateBoundedCardSelectionFacts(
  surface: Pick<BridgeV2DeckEnchantSurface, "min_select" | "max_select" | "selected_count" | "selected_card_entity_ids" | "cards">,
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

function validateRestSiteState(
  surface: BridgeV2RestSiteSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  const optionIds = new Set(surface.options.map((option) => option.entity_id));
  const optionIndices = new Set(surface.options.map((option) => option.index));
  if (optionIds.size !== surface.options.length) {
    diagnostics.invalid("bridge_v2.surface.options", surface.options, "rest option entity ids are not unique");
  }
  if (optionIndices.size !== surface.options.length
      || surface.options.some((option, index) => option.index !== index)) {
    diagnostics.invalid("bridge_v2.surface.options", surface.options, "rest options must retain contiguous UI order");
  }

  validateActions("rest_site", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    if (action.kind === "choose_rest_option") {
      const bindings = action.entity_bindings.filter((binding) => binding.role === "rest_option");
      const boundOption = bindings.length === 1
        ? surface.options.find((option) => option.entity_id === bindings[0]!.entity_id)
        : undefined;
      if (!boundOption || !boundOption.enabled) {
        diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "rest choice must bind exactly one enabled visible option");
      }
    } else {
      const bindings = action.entity_bindings.filter((binding) => binding.role === "screen");
      if (!surface.can_proceed || bindings.length !== 1 || bindings[0]?.entity_id !== surface.screen_entity_id) {
        diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "rest proceed must bind the current screen and require can_proceed");
      }
    }
  }
}

function validateSharedVisibleState(
  shared: BridgeV2SharedVisibleState | null,
  surfaceKind: string,
  diagnostics: DiagnosticsBuilder
): void {
  if (!shared) {
    if (surfaceKind !== "unsupported"
        && surfaceKind !== "character_select"
        && surfaceKind !== "main_menu"
        && surfaceKind !== "singleplayer_menu") {
      diagnostics.invalid("bridge_v2.shared_state", shared, "semantic Bridge-owned state requires shared visible run facts");
    }
    return;
  }
  if (shared.player.hp > shared.player.max_hp) {
    diagnostics.invalid("bridge_v2.shared_state.player.hp", shared.player, "current HP exceeds max HP");
  }
  const relicIds = new Set(shared.player.relics.map((relic) => relic.entity_id));
  if (relicIds.size !== shared.player.relics.length) {
    diagnostics.invalid("bridge_v2.shared_state.player.relics", shared.player.relics, "relic entity ids must be unique");
  }
  const potionIds = new Set(shared.player.potions.map((potion) => potion.entity_id));
  const potionSlots = new Set(shared.player.potions.map((potion) => potion.slot));
  if (potionIds.size !== shared.player.potions.length || potionSlots.size !== shared.player.potions.length) {
    diagnostics.invalid("bridge_v2.shared_state.player.potions", shared.player.potions, "potion entity ids and slots must be unique");
  }
  if (shared.player.potions.length > shared.player.max_potion_slots
      || shared.player.potions.some((potion) => potion.slot >= shared.player.max_potion_slots)) {
    diagnostics.invalid("bridge_v2.shared_state.player.potions", shared.player, "potion occupancy exceeds visible capacity");
  }
  const bossOrders = new Set(shared.run.bosses.map((boss) => boss.order));
  if (bossOrders.size !== shared.run.bosses.length) {
    diagnostics.invalid("bridge_v2.shared_state.run.bosses", shared.run.bosses, "boss order values must be unique");
  }
}

function validateCharacterSelectState(
  surface: BridgeV2CharacterSelectSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  validateActions("character_select", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  const characterIds = new Set(surface.characters.map((choice) => choice.entity_id));
  const definitionIds = new Set(surface.characters.map((choice) => choice.character_id));
  if (characterIds.size !== surface.characters.length || definitionIds.size !== surface.characters.length) {
    diagnostics.invalid("bridge_v2.surface.characters", surface.characters, "character choices must have unique entity and definition ids");
  }
  const selected = surface.characters.filter((choice) => choice.is_selected);
  if (selected.length !== 1 || surface.selected_details?.character_id !== selected[0]?.character_id) {
    diagnostics.invalid("bridge_v2.surface.selected_details", surface, "character select requires one selected choice and matching visible details");
  }
  if (selected[0]?.is_random) {
    if (surface.selected_details?.starting_hp != null
        || surface.selected_details?.starting_gold != null
        || surface.selected_details?.starting_relic != null) {
      diagnostics.invalid("bridge_v2.surface.selected_details", surface.selected_details, "random character must preserve hidden starting details");
    }
  } else if (surface.selected_details
      && (surface.selected_details.starting_hp == null
          || surface.selected_details.starting_gold == null
          || surface.selected_details.starting_relic == null)) {
    diagnostics.invalid("bridge_v2.surface.selected_details", surface.selected_details, "ordinary selected character must expose the visible HP, gold, and starting relic panel");
  }
  const ascensionFields = [surface.ascension, surface.ascension_title, surface.ascension_description];
  const ascensionFieldCount = ascensionFields.filter((value) => value != null).length;
  if (ascensionFieldCount !== 0 && ascensionFieldCount !== ascensionFields.length) {
    diagnostics.invalid("bridge_v2.surface.ascension", surface, "visible Ascension facts must be recorded together or omitted together");
  }
  if (ascensionFieldCount === 0 && (surface.can_decrease_ascension || surface.can_increase_ascension)) {
    diagnostics.invalid("bridge_v2.surface.ascension", surface, "Ascension controls cannot be actionable when the panel is not visible");
  }

  const expectedKinds = new Set<string>();
  if (surface.characters.some((choice) => !choice.is_locked && !choice.is_selected)) expectedKinds.add("select_character");
  if (surface.can_decrease_ascension) expectedKinds.add("decrease_ascension");
  if (surface.can_increase_ascension) expectedKinds.add("increase_ascension");
  if (surface.can_embark) expectedKinds.add("embark_standard_run");
  if (surface.can_go_back) expectedKinds.add("back_from_character_select");
  for (const action of actions) {
    if (!expectedKinds.has(action.kind)) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "character-select action does not match a visible current control");
      continue;
    }
    if (action.kind === "select_character") {
      const bindings = action.entity_bindings.filter((binding) => binding.role === "character_choice");
      const choice = bindings.length === 1
        ? surface.characters.find((candidate) => candidate.entity_id === bindings[0]!.entity_id)
        : undefined;
      if (!choice || choice.is_locked || choice.is_selected) {
        diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "select-character action must bind one unlocked unselected visible choice");
      }
    } else if (action.kind === "embark_standard_run") {
      const screenBindings = action.entity_bindings.filter((binding) => binding.role === "screen" && binding.entity_id === surface.screen_entity_id);
      const characterBindings = action.entity_bindings.filter((binding) => binding.role === "character_choice" && binding.entity_id === selected[0]?.entity_id);
      if (screenBindings.length !== 1 || characterBindings.length !== 1) {
        diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "embark must bind the exact screen and selected character");
      }
    } else {
      const screenBindings = action.entity_bindings.filter((binding) => binding.role === "screen" && binding.entity_id === surface.screen_entity_id);
      if (screenBindings.length !== 1) {
        diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "character-select control action must bind the current screen");
      }
    }
  }
}

function validateMainMenuState(
  surface: BridgeV2MainMenuSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  // Profile/Patch Notes hover detail is a visible-information debt, but the
  // Bridge explicitly marks it non-required for the bounded Continue/Single
  // Player actions. Any other future missing field still fails closed.
  const actionRequiredMissing = missing.filter(
    (field) => field !== "profile_and_patch_notes_hover_detail_not_exposed"
  );
  validateActions("main_menu", stateId, actions, actionRequiredMissing, advertisedOperations, readiness, diagnostics);
  validateVisibleMenuChoices(surface.options, diagnostics);
  const continueChoice = surface.options.find((choice) => choice.semantic_id === "continue");
  if (continueChoice?.bridge_support === "actionable" && !surface.continue_run) {
    diagnostics.invalid("bridge_v2.surface.continue_run", surface.continue_run, "actionable Continue requires its visible saved-run summary");
  }
  if (surface.continue_run && surface.continue_run.hp > surface.continue_run.max_hp) {
    diagnostics.invalid("bridge_v2.surface.continue_run.hp", surface.continue_run, "saved-run HP exceeds max HP");
  }
  validateMenuActions(
    surface.screen_entity_id,
    surface.options,
    actions,
    new Map([
      ["continue", "continue_run"],
      ["singleplayer", "open_singleplayer"]
    ]),
    diagnostics
  );
}

function validateSingleplayerMenuState(
  surface: BridgeV2SingleplayerMenuSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  validateActions("singleplayer_menu", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  validateVisibleMenuChoices(surface.options, diagnostics);
  validateMenuActions(
    surface.screen_entity_id,
    surface.options,
    actions,
    new Map([
      ["standard", "open_standard_run_setup"],
      ["back", "back_from_singleplayer_menu"]
    ]),
    diagnostics
  );
}

function validateVisibleMenuChoices(
  choices: BridgeV2MainMenuSurface["options"],
  diagnostics: DiagnosticsBuilder
): void {
  const entityIds = new Set(choices.map((choice) => choice.entity_id));
  const semanticIds = new Set(choices.map((choice) => choice.semantic_id));
  if (entityIds.size !== choices.length || semanticIds.size !== choices.length) {
    diagnostics.invalid("bridge_v2.surface.options", choices, "visible menu choices require unique entity and semantic ids");
  }
  for (const choice of choices) {
    if (choice.bridge_support === "actionable" && (!choice.enabled || choice.blocked_reason)) {
      diagnostics.invalid("bridge_v2.surface.options.bridge_support", choice, "an actionable menu choice must be enabled and unblocked");
    }
    if (choice.bridge_support === "visible_unsupported" && !choice.blocked_reason) {
      diagnostics.invalid("bridge_v2.surface.options.blocked_reason", choice, "a visible unsupported menu choice requires an explicit reason");
    }
  }
}

function validateMenuActions(
  screenEntityId: string,
  choices: BridgeV2MainMenuSurface["options"],
  actions: BridgeV2LegalAction[],
  actionBySemanticId: ReadonlyMap<string, string>,
  diagnostics: DiagnosticsBuilder
): void {
  const expectedKinds = new Set(
    choices
      .filter((choice) => choice.enabled && choice.bridge_support === "actionable")
      .map((choice) => actionBySemanticId.get(choice.semantic_id))
      .filter((kind): kind is string => kind !== undefined)
  );
  if (expectedKinds.size !== actions.length) {
    diagnostics.invalid("bridge_v2.legal_actions", actions, "menu actions must correspond one-to-one with actionable visible choices");
  }
  for (const action of actions) {
    if (!expectedKinds.has(action.kind)) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "menu action has no actionable visible semantic choice");
    }
    const screenBindings = action.entity_bindings.filter(
      (binding) => binding.role === "menu_screen" && binding.entity_id === screenEntityId
    );
    if (screenBindings.length !== 1) {
      diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "menu action must bind the exact current menu screen");
    }
  }
}

function validateShopInventoryState(
  shared: BridgeV2SharedVisibleState | null,
  surface: BridgeV2ShopInventorySurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  if (!shared) {
    diagnostics.invalid("bridge_v2.shared_state", shared, "shop inventory requires shared player gold and potion capacity");
    return;
  }
  const player = shared.player;

  const offers = [
    ...surface.cards.map((offer) => ({ category: "card" as const, offer })),
    ...surface.relics.map((offer) => ({ category: "relic" as const, offer })),
    ...surface.potions.map((offer) => ({ category: "potion" as const, offer })),
    ...(surface.card_removal ? [{ category: "card_removal" as const, offer: surface.card_removal }] : [])
  ];
  const offerIds = new Set(offers.map(({ offer }) => offer.entity_id));
  const slotIds = new Set(offers.map(({ offer }) => offer.slot_entity_id));
  const inventoryIndices = new Set(offers.map(({ offer }) => offer.inventory_index));
  if (offerIds.size !== offers.length || slotIds.size !== offers.length || inventoryIndices.size !== offers.length) {
    diagnostics.invalid("bridge_v2.surface.shop_offers", offers, "shop offer, slot, and inventory identities must be unique");
  }

  for (const { category, offer } of offers) {
    if (offer.affordable !== (player.gold >= offer.price)) {
      diagnostics.invalid("bridge_v2.surface.shop_offers.affordable", offer, "shop affordability must match current visible gold and exact price");
    }
    if (offer.can_purchase
        && (!offer.stocked || !offer.visible || !offer.affordable || offer.blocked_reason != null)) {
      diagnostics.invalid("bridge_v2.surface.shop_offers.can_purchase", offer, "purchasable offer must be stocked, visible, affordable, and unblocked");
    }
    if (!offer.can_purchase && offer.blocked_reason == null) {
      diagnostics.invalid("bridge_v2.surface.shop_offers.blocked_reason", offer, "unavailable shop offer must expose a bounded blocked reason");
    }
    if (!offer.stocked && offer.can_purchase) {
      diagnostics.invalid("bridge_v2.surface.shop_offers.stocked", offer, "sold-out offer cannot be purchasable");
    }
    const expectedFactBlock = !offer.stocked
      ? (category === "card_removal" ? "already_used" : "sold_out")
      : !offer.visible
        ? "not_visible"
        : !offer.affordable
          ? "insufficient_gold"
        : category === "potion" && player.potions.length >= player.max_potion_slots
            ? "potion_slots_full"
            : null;
    if (expectedFactBlock !== null && offer.blocked_reason !== expectedFactBlock) {
      diagnostics.invalid("bridge_v2.surface.shop_offers.blocked_reason", offer, "shop blocked reason contradicts visible stock, visibility, affordability, or capacity");
    }
    if (category === "potion"
        && player.potions.length >= player.max_potion_slots
        && offer.can_purchase) {
      diagnostics.invalid("bridge_v2.surface.potions.can_purchase", offer, "full potion capacity cannot advertise a potion purchase");
    }
    if (category === "card") {
      const cardOffer = offer as BridgeV2ShopInventorySurface["cards"][number];
      if (cardOffer.stocked !== Boolean(cardOffer.card)) {
        diagnostics.invalid("bridge_v2.surface.cards.card", cardOffer, "stocked card offer must expose exactly its visible card");
      }
    } else if (category === "relic") {
      const relicOffer = offer as BridgeV2ShopInventorySurface["relics"][number];
      if (relicOffer.stocked !== Boolean(relicOffer.relic)) {
        diagnostics.invalid("bridge_v2.surface.relics.relic", relicOffer, "stocked relic offer must expose exactly its visible relic");
      }
    } else if (category === "potion") {
      const potionOffer = offer as BridgeV2ShopInventorySurface["potions"][number];
      if (potionOffer.stocked !== Boolean(potionOffer.definition_id)) {
        diagnostics.invalid("bridge_v2.surface.potions.definition_id", potionOffer, "stocked potion offer must expose potion semantics");
      }
    }
  }

  validateActions("shop_inventory", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  const expectedPurchaseKinds: Record<(typeof offers)[number]["category"], string> = {
    card: "purchase_shop_card",
    relic: "purchase_shop_relic",
    potion: "purchase_shop_potion",
    card_removal: "open_shop_card_removal"
  };
  const purchaseActions = actions.filter((action) => action.kind !== "close_shop_inventory");
  for (const { category, offer } of offers) {
    const role = category === "card_removal" ? "shop_card_removal" : "shop_offer";
    const bound = purchaseActions.filter((action) =>
      action.entity_bindings.some((binding) => binding.role === role && binding.entity_id === offer.entity_id));
    if (offer.can_purchase) {
      if (bound.length !== 1 || bound[0]?.kind !== expectedPurchaseKinds[category]) {
        diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", bound, "each purchasable shop offer must have exactly one category-specific action");
      }
    } else if (bound.length > 0) {
      diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", bound, "blocked shop offer cannot have a purchase action");
    }
  }
  for (const action of purchaseActions) {
    const matchingOffers = offers.filter(({ category, offer }) => {
      const role = category === "card_removal" ? "shop_card_removal" : "shop_offer";
      return action.entity_bindings.some((binding) => binding.role === role && binding.entity_id === offer.entity_id);
    });
    if (matchingOffers.length !== 1 || !matchingOffers[0]!.offer.can_purchase) {
      diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "shop purchase action must bind exactly one visible purchasable offer");
    }
  }
  const closeActions = actions.filter((action) => action.kind === "close_shop_inventory");
  if (surface.can_close) {
    if (closeActions.length !== 1
        || closeActions[0]!.entity_bindings.filter((binding) =>
          binding.role === "screen" && binding.entity_id === surface.screen_entity_id).length !== 1) {
      diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", closeActions, "open shop inventory must expose exactly one screen-bound close action");
    }
  } else if (closeActions.length > 0) {
    diagnostics.invalid("bridge_v2.legal_actions.kind", closeActions, "shop close action appeared while can_close is false");
  }
}

function validateShopRoomState(
  surface: BridgeV2ShopRoomSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  validateActions("shop_room", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  const openActions = actions.filter((action) => action.kind === "open_shop_inventory");
  const proceedActions = actions.filter((action) => action.kind === "proceed_shop");
  if (openActions.length !== (surface.can_open_inventory ? 1 : 0)
      || proceedActions.length !== (surface.can_proceed ? 1 : 0)) {
    diagnostics.invalid("bridge_v2.legal_actions", actions, "shop room actions must match visible merchant and proceed controls");
  }
  for (const action of actions) {
    const roomBindings = action.entity_bindings.filter((binding) =>
      binding.role === "room" && binding.entity_id === surface.room_entity_id);
    if (roomBindings.length !== 1) {
      diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "shop room action must bind the current room");
    }
  }
}

function validateTreasureRoomState(
  surface: BridgeV2TreasureRoomSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  const relicIds = new Set(surface.relics.map((relic) => relic.entity_id));
  if (relicIds.size !== surface.relics.length) {
    diagnostics.invalid("bridge_v2.surface.relics", surface.relics, "treasure relic entity ids are not unique");
  }
  validateActions("treasure_room", stateId, actions, missing, advertisedOperations, readiness, diagnostics);

  if (surface.stage === "closed") {
    if (surface.chest_opened || surface.relics.length > 0 || surface.can_skip || surface.can_proceed) {
      diagnostics.invalid("bridge_v2.surface", surface, "closed treasure stage must expose only the unopened chest");
    }
  } else if (surface.stage === "opening") {
    if (actions.length > 0 || surface.can_skip || surface.can_proceed) {
      diagnostics.invalid("bridge_v2.surface", surface, "opening treasure stage cannot publish commit actions");
    }
  } else if (surface.stage === "relic_choice") {
    if (!surface.chest_opened || surface.relics.length !== 1 || surface.can_proceed) {
      diagnostics.invalid("bridge_v2.surface", surface, "single-player relic choice requires one visible relic and no final proceed");
    }
  } else if (!surface.chest_opened || surface.relics.length > 0 || surface.can_skip) {
    diagnostics.invalid("bridge_v2.surface", surface, "completed treasure stage cannot retain a visible relic or skip control");
  }

  for (const action of actions) {
    if (action.kind === "open_treasure_chest" && surface.stage !== "closed") {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "open action appeared outside closed stage");
    } else if (action.kind === "choose_treasure_relic") {
      const bindings = action.entity_bindings.filter((binding) => binding.role === "relic");
      if (surface.stage !== "relic_choice" || bindings.length !== 1 || !relicIds.has(bindings[0]!.entity_id)) {
        diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "treasure choice must bind the one visible relic");
      }
    } else if (action.kind === "skip_treasure_relic" && (surface.stage !== "relic_choice" || !surface.can_skip)) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "skip action appeared without the visible skip control");
    } else if (action.kind === "proceed_treasure_room" && (surface.stage !== "completed" || !surface.can_proceed)) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "proceed action appeared before treasure completion");
    }
  }
}

function validateGameOverState(
  context: BridgeV2GameOverContext,
  surface: BridgeV2GameOverSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  validateActions("game_over", stateId, actions, missing, advertisedOperations, readiness, diagnostics);

  const advanceActions = actions.filter((action) => action.kind === "advance_game_over_summary");
  const returnActions = actions.filter((action) => action.kind === "return_game_over");
  if (surface.can_advance_summary && surface.can_return) {
    diagnostics.invalid("bridge_v2.surface", surface, "game-over stages cannot publish intro and return authority together");
  }
  if (advanceActions.length !== (surface.can_advance_summary ? 1 : 0)
      || returnActions.length !== (surface.can_return ? 1 : 0)
      || actions.length !== advanceActions.length + returnActions.length) {
    diagnostics.invalid("bridge_v2.legal_actions", actions, "game-over actions must exactly match the visible stage controls");
  }
  if (surface.stage === "intro") {
    if (!surface.can_advance_summary || surface.can_return || surface.return_destination != null) {
      diagnostics.invalid("bridge_v2.surface", surface, "game-over intro must expose only summary advance");
    }
  } else if (surface.stage === "summary") {
    if (surface.can_advance_summary || !surface.can_return || surface.return_destination == null) {
      diagnostics.invalid("bridge_v2.surface", surface, "game-over summary must expose one explicit return destination");
    }
  } else if (actions.length > 0 || surface.can_advance_summary || surface.can_return || surface.return_destination != null) {
    diagnostics.invalid("bridge_v2.surface", surface, "animating game-over stages must remain actionless and destination-free");
  }

  const summaryFacts = [context.score, context.floor_reached, context.ascension];
  const recordedFactCount = summaryFacts.filter((value) => value != null).length;
  if (recordedFactCount !== 0 && recordedFactCount !== summaryFacts.length) {
    diagnostics.invalid("bridge_v2.context", context, "game-over summary facts must be recorded together or omitted together");
  }
  if ((surface.stage === "intro" || surface.stage === "intro_animating") && recordedFactCount > 0) {
    diagnostics.invalid("bridge_v2.context", context, "summary-only facts cannot appear before the summary is visible");
  }

  for (const action of actions) {
    const bindings = action.entity_bindings.filter((binding) =>
      binding.role === "game_over_screen" && binding.entity_id === surface.screen_entity_id);
    if (bindings.length !== 1) {
      diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "game-over action must bind the exact current screen");
    }
  }
}

function validateEventDialogueState(
  surface: BridgeV2EventDialogueSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  const lineIds = new Set(surface.revealed_lines.map((line) => line.entity_id));
  if (lineIds.size !== surface.revealed_lines.length) {
    diagnostics.invalid("bridge_v2.surface.revealed_lines", surface.revealed_lines, "dialogue line entity ids are not unique");
  }
  const expectedIndices = surface.revealed_lines.map((_, index) => index);
  const actualIndices = surface.revealed_lines.map((line) => line.index);
  if (actualIndices.some((index, position) => index !== expectedIndices[position])) {
    diagnostics.invalid("bridge_v2.surface.revealed_lines", actualIndices, "revealed dialogue must be a contiguous prefix starting at zero");
  }
  if (surface.current_line_index !== surface.revealed_lines.length - 1) {
    diagnostics.invalid("bridge_v2.surface.current_line_index", surface.current_line_index, "current line must be the last revealed line");
  }
  const currentLines = surface.revealed_lines.filter((line) => line.is_current);
  if (currentLines.length !== 1 || currentLines[0]?.index !== surface.current_line_index) {
    diagnostics.invalid("bridge_v2.surface.revealed_lines.is_current", surface.revealed_lines, "exactly the final revealed line must be current");
  }

  validateActions("event_dialogue", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    const bindings = action.entity_bindings.filter((binding) => binding.role === "dialogue_line");
    if (bindings.length !== 1 || bindings[0]?.entity_id !== currentLines[0]?.entity_id) {
      diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "dialogue advance must bind exactly the current revealed line");
    }
  }
}

function validateCombatTurnState(
  shared: BridgeV2SharedVisibleState | null,
  context: BridgeV2CombatContext,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  if (!shared) {
    diagnostics.invalid("bridge_v2.shared_state", shared, "combat turn requires shared player identity and persistent HUD facts");
    return;
  }
  if (context.player.player_entity_id !== shared.player.entity_id) {
    diagnostics.invalid("bridge_v2.context.player.player_entity_id", context.player, "combat player must reference shared player identity");
  }
  const handIds = new Set(context.player.hand.map((card) => card.entity_id));
  const companionIds = new Set(context.player.companions.map((companion) => companion.entity_id));
  const enemyIds = new Set(context.enemies.map((enemy) => enemy.entity_id));
  const sharedPotionIds = new Set(shared.player.potions.map((potion) => potion.entity_id));
  const potionStateIds = new Set(context.player.potion_states.map((potion) => potion.entity_id));
  if (handIds.size !== context.player.hand.length) diagnostics.invalid("bridge_v2.context.player.hand", context.player.hand, "hand card entity ids are not unique");
  if (companionIds.size !== context.player.companions.length) {
    diagnostics.invalid("bridge_v2.context.player.companions", context.player.companions, "companion entity ids are not unique");
  }
  if (context.player.companions.some((companion) => companion.entity_id === context.player.player_entity_id || enemyIds.has(companion.entity_id))) {
    diagnostics.invalid("bridge_v2.context.player.companions", context.player.companions, "companion identities must be distinct from the player and enemies");
  }
  for (const companion of context.player.companions) {
    const hasHp = companion.hp !== null && companion.hp !== undefined;
    const hasMaxHp = companion.max_hp !== null && companion.max_hp !== undefined;
    if (companion.health_bar_visible !== (hasHp && hasMaxHp)) {
      diagnostics.invalid(
        "bridge_v2.context.player.companions.health_bar",
        companion,
        "visible companion health bars require both hp fields, and hidden health bars must omit both"
      );
    }
    if (hasHp && hasMaxHp && (companion.max_hp! <= 0 || companion.hp! < 0 || companion.hp! > companion.max_hp!)) {
      diagnostics.invalid("bridge_v2.context.player.companions.hp", companion, "companion hp must be within visible max hp bounds");
    }
  }
  if (enemyIds.size !== context.enemies.length) diagnostics.invalid("bridge_v2.context.enemies", context.enemies, "enemy entity ids are not unique");
  if (potionStateIds.size !== context.player.potion_states.length
      || potionStateIds.size !== sharedPotionIds.size
      || context.player.potion_states.some((potion) => !sharedPotionIds.has(potion.entity_id))) {
    diagnostics.invalid("bridge_v2.context.player.potion_states", context.player.potion_states, "combat potion state must cover each visible shared potion exactly once");
  }
  if (readiness === "ready" && !context.is_play_phase) diagnostics.invalid("bridge_v2.context.is_play_phase", context.is_play_phase, "ready combat turn must be the player play phase");
  validateActions("combat_turn", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
}

function validateCombatPileCardSelectionState(
  surface: BridgeV2CombatPileCardSelectionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  if (surface.min_select > surface.max_select) {
    diagnostics.invalid("bridge_v2.surface.selection_range", surface, "min_select exceeds max_select");
  }
  if (surface.selected_count !== surface.selected_card_entity_ids.length) {
    diagnostics.invalid("bridge_v2.surface.selected_count", surface.selected_count, "selected count and selected ids differ");
  }
  if (surface.selected_count > surface.max_select) {
    diagnostics.invalid("bridge_v2.surface.selected_count", surface.selected_count, "selected count exceeds max_select");
  }
  if (surface.source_kind === "dredge") {
    if (surface.min_select !== surface.max_select
        || surface.min_select < 1
        || surface.max_select > 3
        || surface.require_manual_confirmation
        || surface.cancelable) {
      diagnostics.invalid(
        "bridge_v2.surface.dredge_selection_contract",
        surface,
        "Dredge requires an exact dynamic 1..3 selection count, automatic final commit, and no cancel"
      );
    }
  } else if (surface.source_kind === "charge") {
    if (surface.min_select !== 2
        || surface.max_select !== 2
        || surface.require_manual_confirmation
        || surface.cancelable) {
      diagnostics.invalid(
        "bridge_v2.surface.charge_selection_contract",
        surface,
        "CHARGE!! requires exact-two automatic selection and no cancel"
      );
    }
  } else if (surface.min_select !== 1
             || surface.max_select !== 1
             || surface.require_manual_confirmation
             || surface.cancelable) {
    diagnostics.invalid(
      "bridge_v2.surface.single_pick_contract",
      surface,
      `${surface.source_kind} requires exact-one automatic selection with no cancel`
    );
  }
  const cardIds = new Set(surface.cards.map((card) => card.entity_id));
  if (cardIds.size !== surface.cards.length) {
    diagnostics.invalid("bridge_v2.surface.cards", surface.cards, "combat-pile card entity ids are not unique");
  }
  const selectedIds = new Set(surface.selected_card_entity_ids);
  for (const selectedId of selectedIds) {
    if (!cardIds.has(selectedId)) {
      diagnostics.invalid("bridge_v2.surface.selected_card_entity_ids", selectedId, "selected card is absent from visible cards");
    }
  }
  for (const card of surface.cards) {
    if (card.is_selected !== selectedIds.has(card.entity_id)) {
      diagnostics.invalid("bridge_v2.surface.cards.is_selected", card, "card selected flag disagrees with selected ids");
    }
  }
  validateActions("combat_pile_card_selection", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  const expectedActionKind = combatPileSelectionContract(surface.source_kind).operation;
  for (const action of actions) {
    if (action.kind !== expectedActionKind) {
      diagnostics.invalid(
        "bridge_v2.legal_actions.kind",
        action.kind,
        `action does not belong to the exact ${surface.source_kind} source contract`
      );
    }
    const cardBindings = action.entity_bindings.filter((binding) => binding.role === "card");
    const boundCard = cardBindings.length === 1
      ? surface.cards.find((card) => card.entity_id === cardBindings[0]!.entity_id)
      : undefined;
    if (!boundCard) {
      diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, `${surface.source_kind} selection must bind exactly one visible ${surface.pile_type} card`);
    } else {
      const expectedLabel = combatPileSelectionContract(surface.source_kind)
        .label(boundCard.name ?? boundCard.definition_id, boundCard.is_selected);
      if (action.label !== expectedLabel) {
        diagnostics.invalid("bridge_v2.legal_actions.label", action.label, `${surface.source_kind} action label disagrees with its exact visible card and destination`);
      }
    }
  }
}

function validateCombatHandCardSelectionState(
  surface: BridgeV2CombatHandCardSelectionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  if (surface.min_select > surface.max_select) {
    diagnostics.invalid("bridge_v2.surface.selection_range", surface, "min_select exceeds max_select");
  }
  if (surface.selected_count !== surface.selected_card_entity_ids.length) {
    diagnostics.invalid("bridge_v2.surface.selected_count", surface.selected_count, "selected count and selected ids differ");
  }
  if (surface.selected_count > surface.max_select) {
    diagnostics.invalid("bridge_v2.surface.selected_count", surface.selected_count, "selected count exceeds max_select");
  }
  if (surface.selection_mode === "upgrade_select" && surface.selected_count > 1) {
    diagnostics.invalid("bridge_v2.surface.selected_count", surface.selected_count, "upgrade selection cannot visibly hold more than one card");
  }
  const cardIds = new Set(surface.cards.map((card) => card.entity_id));
  if (cardIds.size !== surface.cards.length) {
    diagnostics.invalid("bridge_v2.surface.cards", surface.cards, "combat-hand card entity ids are not unique");
  }
  const selectedIds = new Set(surface.selected_card_entity_ids);
  if (selectedIds.size !== surface.selected_card_entity_ids.length) {
    diagnostics.invalid("bridge_v2.surface.selected_card_entity_ids", surface.selected_card_entity_ids, "selected card ids are not unique");
  }
  for (const selectedId of selectedIds) {
    if (!cardIds.has(selectedId)) diagnostics.invalid("bridge_v2.surface.selected_card_entity_ids", selectedId, "selected card is absent from visible cards");
  }
  for (const card of surface.cards) {
    if (card.is_selected !== selectedIds.has(card.entity_id)) {
      diagnostics.invalid("bridge_v2.surface.cards.is_selected", card, "card selected flag disagrees with selected ids");
    }
  }
  validateActions("combat_hand_card_selection", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    if (surface.is_peeking && action.kind !== "close_combat_hand_peek") {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "peek mode may advertise only its close action");
    }
    if (action.kind === "deselect_combat_hand_card" && surface.selection_mode !== "simple_select") {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "only simple hand selection exposes selected-card holders");
    }
    if (action.kind === "confirm_combat_hand_selection"
        && (surface.selected_count < surface.min_select || surface.selected_count > surface.max_select)) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "confirm appeared outside the selection range");
    }
  }
}

function validateEventCardAcquisitionState(
  surface: BridgeV2EventCardAcquisitionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  if (surface.min_select !== surface.max_select || surface.max_select > surface.cards.length) {
    diagnostics.invalid(
      "bridge_v2.surface.selection_range",
      { min: surface.min_select, max: surface.max_select, cards: surface.cards.length },
      "audited event acquisition requires one fixed non-empty selection count within the visible cards"
    );
  }
  if (surface.selected_count > surface.max_select
      || surface.selected_count !== surface.selected_card_entity_ids.length) {
    diagnostics.invalid(
      "bridge_v2.surface.selected_count",
      surface.selected_count,
      "selected count must match the selected card ids and remain within the fixed acquisition count"
    );
  }
  const cardIds = new Set(surface.cards.map((card) => card.entity_id));
  if (cardIds.size !== surface.cards.length) {
    diagnostics.invalid("bridge_v2.surface.cards", surface.cards, "event acquisition card entity ids are not unique");
  }
  const selectedIds = new Set(surface.selected_card_entity_ids);
  if (selectedIds.size !== surface.selected_card_entity_ids.length) {
    diagnostics.invalid("bridge_v2.surface.selected_card_entity_ids", surface.selected_card_entity_ids, "selected card ids are not unique");
  }
  for (const card of surface.cards) {
    if (card.is_selected !== selectedIds.has(card.entity_id)) {
      diagnostics.invalid("bridge_v2.surface.cards.is_selected", card, "card selected flag disagrees with selected ids");
    }
  }
  validateActions("event_card_acquisition", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    const bindings = action.entity_bindings.filter((binding) => binding.role === "card");
    const boundCard = bindings.length === 1
      ? surface.cards.find((card) => card.entity_id === bindings[0]!.entity_id)
      : undefined;
    if (!boundCard) {
      diagnostics.invalid(
        "bridge_v2.legal_actions.entity_bindings",
        action.entity_bindings,
        "event acquisition actions must bind exactly one visible card"
      );
      continue;
    }
    if (action.kind === "select_event_card_acquisition" && boundCard.is_selected) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "select action cannot bind an already selected card");
    }
    if (action.kind === "deselect_event_card_acquisition" && !boundCard.is_selected) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "deselect action must bind a selected card");
    }
  }
}

function validateGeneratedCardChoiceState(
  surface: BridgeV2GeneratedCardChoiceSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  const cardIds = new Set(surface.cards.map((card) => card.entity_id));
  if (cardIds.size !== surface.cards.length) {
    diagnostics.invalid("bridge_v2.surface.cards", surface.cards, "generated card entity ids are not unique");
  }
  if (surface.source_kind !== "knowledge_demon_curse" && !surface.can_skip) {
    diagnostics.invalid("bridge_v2.surface.can_skip", surface.can_skip, "skippable generated-card source omitted its exact skip control");
  }
  validateActions("generated_card_choice", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  const selectKind = surface.source_kind === "lead_paperweight"
    ? "select_generated_run_card"
    : surface.source_kind === "quasar"
      ? "choose_quasar_card"
      : surface.source_kind === "knowledge_demon_curse"
        ? "choose_knowledge_demon_curse"
        : "select_generated_combat_card";
  const skipKind = surface.source_kind === "lead_paperweight"
    ? "skip_generated_run_card_choice"
    : surface.source_kind === "quasar"
      ? "skip_quasar_choice"
      : surface.source_kind === "knowledge_demon_curse"
        ? undefined
        : "skip_generated_combat_card_choice";
  for (const action of actions) {
    if (surface.is_peeking) {
      diagnostics.invalid("bridge_v2.surface.is_peeking", surface.is_peeking, "generated-card selection cannot publish choice actions while combat peek mode owns input");
    }
    if ((action.kind === "skip_generated_run_card_choice" || action.kind === "skip_generated_combat_card_choice")
      && !surface.can_skip) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "skip action appeared for a non-skippable generated-card choice");
    }
    if (action.kind !== selectKind && action.kind !== skipKind) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, `action does not belong to ${surface.source_kind}`);
    }
    if (action.kind === selectKind) {
      const cardBindings = action.entity_bindings.filter((binding) => binding.role === "card");
      const boundCard = cardBindings.length === 1
        ? surface.cards.find((card) => card.entity_id === cardBindings[0]!.entity_id)
        : undefined;
      if (!boundCard) {
        diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "generated-card selection must bind exactly one visible card");
      } else if (surface.source_kind === "lead_paperweight"
        && action.label !== `Add ${boundCard.name ?? boundCard.definition_id} to the run deck`) {
        diagnostics.invalid("bridge_v2.legal_actions.label", action.label, "generated-card selection label disagrees with its bound visible card");
      } else if (surface.source_kind === "quasar"
        && action.label !== `Choose ${boundCard.name ?? boundCard.definition_id}; add it to the combat hand at its shown cost`) {
        diagnostics.invalid("bridge_v2.legal_actions.label", action.label, "Quasar selection label disagrees with its unchanged-cost destination");
      } else if (surface.source_kind === "knowledge_demon_curse"
        && action.label !== `Accept ${boundCard.name ?? boundCard.definition_id} from Knowledge Demon`) {
        diagnostics.invalid("bridge_v2.legal_actions.label", action.label, "Knowledge Demon selection label disagrees with its immediate-effect contract");
      } else if (surface.source_kind !== "lead_paperweight"
        && surface.source_kind !== "quasar"
        && surface.source_kind !== "knowledge_demon_curse"
        && action.label !== `Choose ${boundCard.name ?? boundCard.definition_id}; add it to the combat hand for free this turn`) {
        diagnostics.invalid("bridge_v2.legal_actions.label", action.label, "generated combat selection label disagrees with its exact destination and cost policy");
      }
    }
  }
}

function validateCardBundleSelectionState(
  surface: BridgeV2CardBundleSelectionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  const bundleIds = new Set(surface.bundles.map((bundle) => bundle.entity_id));
  if (bundleIds.size !== surface.bundles.length) {
    diagnostics.invalid("bridge_v2.surface.bundles", surface.bundles, "card-bundle entity ids are not unique");
  }
  const cardIds = surface.bundles.flatMap((bundle) => bundle.cards.map((card) => card.entity_id));
  if (new Set(cardIds).size !== cardIds.length) {
    diagnostics.invalid("bridge_v2.surface.bundles.cards", surface.bundles, "card instances are not unique across visible bundles");
  }

  if (surface.stage === "choosing") {
    if (surface.selected_bundle_entity_id !== null && surface.selected_bundle_entity_id !== undefined) {
      diagnostics.invalid("bridge_v2.surface.selected_bundle_entity_id", surface.selected_bundle_entity_id, "choosing stage cannot retain a selected bundle");
    }
    if (actions.some((action) => action.kind !== "preview_card_bundle")) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", actions, "choosing stage may advertise only bundle-preview actions");
    }
  } else {
    if (!surface.selected_bundle_entity_id
        || surface.bundles.length !== 1
        || surface.bundles[0]?.entity_id !== surface.selected_bundle_entity_id) {
      diagnostics.invalid("bridge_v2.surface.selected_bundle_entity_id", surface, "preview stage must expose exactly its selected bundle");
    }
    if (actions.some((action) => action.kind !== "confirm_card_bundle" && action.kind !== "cancel_card_bundle_preview")) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", actions, "preview stage may advertise only confirm or cancel");
    }
  }

  validateActions("card_bundle_selection", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    const bindings = action.entity_bindings.filter((binding) => binding.role === "bundle");
    if (bindings.length !== 1 || !bundleIds.has(bindings[0]!.entity_id)) {
      diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "bundle action must bind exactly one visible atomic bundle");
    }
    if (surface.stage === "preview" && bindings[0]?.entity_id !== surface.selected_bundle_entity_id) {
      diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "preview controls must remain bound to the selected bundle");
    }
  }
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
  const potionIds = new Set(surface.discardable_potions.map((potion) => potion.entity_id));
  const potionSlots = new Set(surface.discardable_potions.map((potion) => potion.slot));
  if (rewardIds.size !== surface.rewards.length) diagnostics.invalid("bridge_v2.surface.rewards", surface.rewards, "reward entity ids are not unique");
  if (potionIds.size !== surface.discardable_potions.length) diagnostics.invalid("bridge_v2.surface.discardable_potions", surface.discardable_potions, "discardable potion entity ids are not unique");
  if (potionSlots.size !== surface.discardable_potions.length) diagnostics.invalid("bridge_v2.surface.discardable_potions", surface.discardable_potions, "discardable potion slots are not unique");
  if (!surface.potion_slots_full && surface.discardable_potions.length > 0) {
    diagnostics.invalid("bridge_v2.surface.discardable_potions", surface.discardable_potions, "discard operands appeared while potion slots are not full");
  }
  validateActions("reward_claim", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    if (action.kind === "claim_reward" && !surface.rewards.some((reward) => reward.enabled && action.label === `Claim ${reward.label}`)) {
      diagnostics.invalid("bridge_v2.legal_actions.label", action.label, "claim action does not identify an enabled visible reward");
    }
    if (action.kind === "proceed_rewards" && !surface.can_proceed) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "proceed action appeared while the proceed control is disabled");
    }
    if (action.kind === "discard_potion_for_reward" && (!surface.potion_slots_full || surface.discardable_potions.length === 0)) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "potion discard appeared without a visible full-capacity resolution");
    }
  }
}

function validateMapNavigationState(
  context: BridgeV2MapContext,
  surface: BridgeV2MapNavigationSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
  readiness: string,
  diagnostics: DiagnosticsBuilder
): void {
  const nodeIds = new Set(context.nodes.map((node) => node.entity_id));
  const nodeCoords = new Set(context.nodes.map((node) => `${node.col},${node.row}`));
  if (nodeIds.size !== context.nodes.length) {
    diagnostics.invalid("bridge_v2.context.nodes", context.nodes, "map node entity ids are not unique");
  }
  if (nodeCoords.size !== context.nodes.length) {
    diagnostics.invalid("bridge_v2.context.nodes", context.nodes, "map node coordinates are not unique");
  }
  for (const node of context.nodes) {
    for (const child of node.children) {
      if (!nodeCoords.has(`${child.col},${child.row}`)) {
        diagnostics.invalid("bridge_v2.context.nodes.children", child, "map child is absent from visible topology");
      }
    }
  }
  const optionIds = new Set(surface.next_options.map((option) => option.entity_id));
  const optionCoords = new Set(surface.next_options.map((option) => `${option.col},${option.row}`));
  if (optionIds.size !== surface.next_options.length || optionCoords.size !== surface.next_options.length) {
    diagnostics.invalid("bridge_v2.surface.next_options", surface.next_options, "map choices are not unique");
  }
  for (const option of surface.next_options) {
    const node = context.nodes.find((candidate) => candidate.entity_id === option.entity_id);
    if (!node
        || node.col !== option.col
        || node.row !== option.row
        || node.point_type !== option.point_type
        || node.state !== "travelable") {
      diagnostics.invalid("bridge_v2.surface.next_options", option, "map choice does not match one visible travelable topology node");
    }
  }
  if (readiness === "ready"
      && (!surface.travel_enabled || surface.traveling || surface.drawing_mode !== "none")) {
    diagnostics.invalid("bridge_v2.surface.readiness", surface, "ready map navigation requires route input ownership");
  }
  validateActions("map_navigation", stateId, actions, missing, advertisedOperations, readiness, diagnostics);
  for (const action of actions) {
    const bindings = action.entity_bindings.filter((binding) => binding.role === "map_node");
    if (bindings.length !== 1 || !optionIds.has(bindings[0]!.entity_id)) {
      diagnostics.invalid("bridge_v2.legal_actions.entity_bindings", action.entity_bindings, "map action must bind exactly one current map choice");
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

function validateScopedQualifiedIdentity(
  path: string,
  game: {
    version?: string | null;
    commit?: string | null;
    main_assembly_hash?: number | null;
    compatibility: {
      status: string;
      tested_build_fingerprints: string[];
      action_execution_allowed: boolean;
      state_observation_allowed: boolean;
      inspection_allowed: boolean;
      action_execution_surface_kinds: string[];
      action_canary_surface_kinds: string[];
      action_permission_scopes: Array<{
        surface_kind: string;
        operation: string;
        tier: "qualified" | "canary";
      }>;
      inspection_allowed_kinds: string[];
      inspection_canary_kinds: string[];
      observation_only_surface_kinds: string[];
      observation_candidate_build_fingerprints: string[];
    };
  },
  diagnostics: DiagnosticsBuilder
): void {
  const compatibility = game.compatibility;
  const fingerprint = gameFingerprint(game);
  if (compatibility.status !== "qualified_scoped"
      || !compatibility.action_execution_allowed
      || !compatibility.state_observation_allowed
      || compatibility.action_execution_surface_kinds.length + compatibility.action_canary_surface_kinds.length === 0
      || compatibility.action_permission_scopes.length === 0
      || compatibility.observation_only_surface_kinds.length !== 0
      || compatibility.observation_candidate_build_fingerprints.length !== 0
      || !compatibility.tested_build_fingerprints.includes(fingerprint)) {
    diagnostics.invalid(`${path}.compatibility`, compatibility, "scoped qualification requires exact identity and a non-empty explicit action scope");
  }
  if (compatibility.action_execution_surface_kinds.some((kind) => compatibility.action_canary_surface_kinds.includes(kind))) {
    diagnostics.invalid(`${path}.compatibility.action_scope`, compatibility, "qualified and canary action scopes must be disjoint");
  }
  const qualified = new Set(compatibility.action_execution_surface_kinds);
  const canary = new Set(compatibility.action_canary_surface_kinds);
  const scopeKeys = new Set<string>();
  for (const scope of compatibility.action_permission_scopes) {
    const key = `${scope.surface_kind}\u0000${scope.operation}`;
    if (scopeKeys.has(key)) {
      diagnostics.invalid(`${path}.compatibility.action_permission_scopes`, scope, "action permission scopes must be unique");
    }
    scopeKeys.add(key);
    if ((scope.tier === "qualified" && !qualified.has(scope.surface_kind))
        || (scope.tier === "canary" && !canary.has(scope.surface_kind))) {
      diagnostics.invalid(
        `${path}.compatibility.action_permission_scopes`,
        scope,
        "operation tier must match the explicit qualified or canary Surface scope"
      );
    }
  }
  if (compatibility.inspection_allowed !== (
    compatibility.inspection_allowed_kinds.length + compatibility.inspection_canary_kinds.length > 0
  )) {
    diagnostics.invalid(`${path}.compatibility.inspection`, compatibility, "scoped inspection authority must match its explicit non-empty kind list");
  }
  if (compatibility.inspection_allowed_kinds.some((kind) => compatibility.inspection_canary_kinds.includes(kind))) {
    diagnostics.invalid(`${path}.compatibility.inspection_scope`, compatibility, "qualified and canary inspection scopes must be disjoint");
  }
  if (!game.version || !game.commit || game.main_assembly_hash === null || game.main_assembly_hash === undefined) {
    diagnostics.invalid(path, game, "scoped qualification requires version, commit, and main assembly hash identity");
  }
}

function isCandidateBuild(
  state: NonNullable<ReturnType<typeof decodeBridgeV2State>["data"]>,
  capabilities: NonNullable<ReturnType<typeof decodeBridgeV2Capabilities>["data"]>
): boolean {
  const stateCompatibility = state.game.compatibility;
  const capabilityCompatibility = capabilities.game.compatibility;
  const observationCandidate = stateCompatibility.status === "observation_only_candidate"
    && !stateCompatibility.action_execution_allowed
    && !capabilityCompatibility.action_execution_allowed
    && stateCompatibility.action_execution_surface_kinds.length === 0
    && capabilityCompatibility.action_execution_surface_kinds.length === 0
    && sameStrings(stateCompatibility.observation_only_surface_kinds, ["deck_removal_selection"])
    && sameStrings(capabilityCompatibility.observation_only_surface_kinds, ["deck_removal_selection"]);
  const actionCanary = stateCompatibility.status === "action_and_inspection_canary_candidate"
    && stateCompatibility.action_execution_allowed
    && capabilityCompatibility.action_execution_allowed
    && stateCompatibility.inspection_allowed
    && capabilityCompatibility.inspection_allowed
    && sameStrings(stateCompatibility.action_execution_surface_kinds, ["deck_removal_selection"])
    && sameStrings(capabilityCompatibility.action_execution_surface_kinds, ["deck_removal_selection"])
    && sameStrings(stateCompatibility.inspection_allowed_kinds, ["run_deck"])
    && sameStrings(capabilityCompatibility.inspection_allowed_kinds, ["run_deck"])
    && stateCompatibility.observation_only_surface_kinds.length === 0
    && capabilityCompatibility.observation_only_surface_kinds.length === 0;
  return (observationCandidate || actionCanary)
    && capabilityCompatibility.status === stateCompatibility.status
    && stateCompatibility.state_observation_allowed
    && capabilityCompatibility.state_observation_allowed
    && stateCompatibility.observation_candidate_build_fingerprints.includes(gameFingerprint(state.game))
    && capabilityCompatibility.observation_candidate_build_fingerprints.includes(gameFingerprint(capabilities.game));
}

function isScopedQualifiedBuild(
  state: NonNullable<ReturnType<typeof decodeBridgeV2State>["data"]>,
  capabilities: NonNullable<ReturnType<typeof decodeBridgeV2Capabilities>["data"]>
): boolean {
  const stateCompatibility = state.game.compatibility;
  const capabilityCompatibility = capabilities.game.compatibility;
  const scoped = stateCompatibility.status === "qualified_scoped"
    && capabilityCompatibility.status === "qualified_scoped"
    && stateCompatibility.action_execution_allowed
    && capabilityCompatibility.action_execution_allowed
    && stateCompatibility.state_observation_allowed
    && capabilityCompatibility.state_observation_allowed
    && stateCompatibility.action_execution_surface_kinds.length
      + stateCompatibility.action_canary_surface_kinds.length > 0
    && sameStrings(
      stateCompatibility.action_execution_surface_kinds,
      capabilityCompatibility.action_execution_surface_kinds
    )
    && sameStrings(
      stateCompatibility.action_canary_surface_kinds,
      capabilityCompatibility.action_canary_surface_kinds
    )
    && sameActionPermissionScopes(
      stateCompatibility.action_permission_scopes,
      capabilityCompatibility.action_permission_scopes
    )
    && sameStrings(
      stateCompatibility.inspection_allowed_kinds,
      capabilityCompatibility.inspection_allowed_kinds
    );
  if (!scoped) return false;

  const qualifiedKinds = new Set(capabilityCompatibility.action_execution_surface_kinds);
  const canaryKinds = new Set(capabilityCompatibility.action_canary_surface_kinds);
  const advertisedQualified = capabilities.surfaces
    .filter((surface) => surface.support === "qualified_exact_build")
    .map((surface) => surface.kind);
  const advertisedCanary = capabilities.surfaces
    .filter((surface) => surface.support === "candidate_action_canary")
    .map((surface) => surface.kind);
  const operationScopesBySurface = new Map<string, string[]>();
  for (const scope of capabilityCompatibility.action_permission_scopes) {
    const operations = operationScopesBySurface.get(scope.surface_kind) ?? [];
    operations.push(scope.operation);
    operationScopesBySurface.set(scope.surface_kind, operations);
  }
  const advertisedOperationsMatch = capabilities.surfaces.every((surface) => {
    const expected = operationScopesBySurface.get(surface.kind) ?? [];
    return sameStrings(surface.operations, expected);
  });
  return advertisedQualified.length === qualifiedKinds.size
    && advertisedQualified.every((kind) => qualifiedKinds.has(kind))
    && advertisedCanary.length === canaryKinds.size
    && advertisedCanary.every((kind) => canaryKinds.has(kind))
    && advertisedOperationsMatch;
}

function isObservationOnlyCandidate(
  state: NonNullable<ReturnType<typeof decodeBridgeV2State>["data"]>,
  capabilities: NonNullable<ReturnType<typeof decodeBridgeV2Capabilities>["data"]>
): boolean {
  return isCandidateBuild(state, capabilities)
    && state.game.compatibility.status === "observation_only_candidate"
    && !state.game.compatibility.action_execution_allowed
    && !capabilities.game.compatibility.action_execution_allowed
    && !state.game.compatibility.inspection_allowed
    && !capabilities.game.compatibility.inspection_allowed
    && state.game.compatibility.action_execution_surface_kinds.length === 0
    && capabilities.game.compatibility.action_execution_surface_kinds.length === 0
    && isBridgeV2DeckRemovalSurface(state.surface)
    && capabilities.surfaces.some((surface) => surface.kind === state.surface.kind && surface.support === "candidate_observation_only");
}

function isActionCanaryCandidate(
  state: NonNullable<ReturnType<typeof decodeBridgeV2State>["data"]>,
  capabilities: NonNullable<ReturnType<typeof decodeBridgeV2Capabilities>["data"]>
): boolean {
  return isCandidateBuild(state, capabilities)
    && state.game.compatibility.status === "action_and_inspection_canary_candidate"
    && state.game.compatibility.action_execution_allowed
    && capabilities.game.compatibility.action_execution_allowed
    && state.game.compatibility.inspection_allowed
    && capabilities.game.compatibility.inspection_allowed
    && sameStrings(state.game.compatibility.action_execution_surface_kinds, ["deck_removal_selection"])
    && sameStrings(capabilities.game.compatibility.action_execution_surface_kinds, ["deck_removal_selection"])
    && sameStrings(state.game.compatibility.inspection_allowed_kinds, ["run_deck"])
    && sameStrings(capabilities.game.compatibility.inspection_allowed_kinds, ["run_deck"])
    && state.game.compatibility.observation_only_surface_kinds.length === 0
    && capabilities.game.compatibility.observation_only_surface_kinds.length === 0
    && isBridgeV2DeckRemovalSurface(state.surface)
    && capabilities.surfaces.some((surface) => surface.kind === state.surface.kind && surface.support === "candidate_action_canary");
}

function validateCandidateBuildIdentity(
  path: string,
  game: {
    version?: string | null;
    commit?: string | null;
    main_assembly_hash?: number | null;
    compatibility: {
      status: string;
      action_execution_allowed: boolean;
      state_observation_allowed: boolean;
      inspection_allowed: boolean;
      action_execution_surface_kinds: string[];
      inspection_allowed_kinds: string[];
      observation_only_surface_kinds: string[];
      observation_candidate_build_fingerprints: string[];
    };
  },
  diagnostics: DiagnosticsBuilder
): void {
  const fingerprint = gameFingerprint(game);
  const observationCandidate = game.compatibility.status === "observation_only_candidate"
    && !game.compatibility.action_execution_allowed
    && !game.compatibility.inspection_allowed
    && game.compatibility.action_execution_surface_kinds.length === 0
    && game.compatibility.inspection_allowed_kinds.length === 0
    && sameStrings(game.compatibility.observation_only_surface_kinds, ["deck_removal_selection"]);
  const actionCanary = game.compatibility.status === "action_and_inspection_canary_candidate"
    && game.compatibility.action_execution_allowed
    && game.compatibility.inspection_allowed
    && sameStrings(game.compatibility.action_execution_surface_kinds, ["deck_removal_selection"])
    && sameStrings(game.compatibility.inspection_allowed_kinds, ["run_deck"])
    && game.compatibility.observation_only_surface_kinds.length === 0;
  if ((!observationCandidate && !actionCanary)
      || !game.compatibility.state_observation_allowed
      || !game.compatibility.observation_candidate_build_fingerprints.includes(fingerprint)) {
    diagnostics.invalid(`${path}.compatibility`, game.compatibility, "Bridge v2 candidate build requires an exact, scoped identity contract");
  }
  if (!game.version || !game.commit || game.main_assembly_hash === null || game.main_assembly_hash === undefined) {
    diagnostics.invalid(path, game, "Bridge v2 candidate observation requires version, commit, and main assembly hash identity");
  }
}

function gameFingerprint(game: { version?: string | null; commit?: string | null; main_assembly_hash?: number | null }): string {
  return `${game.version ?? "unknown"}|${game.commit ?? "unknown"}|${game.main_assembly_hash ?? "unknown"}`;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return [...left].sort().join("\u0000") === [...right].sort().join("\u0000");
}

function sameActionPermissionScopes(
  left: ReadonlyArray<{ surface_kind: string; operation: string; tier: string }>,
  right: ReadonlyArray<{ surface_kind: string; operation: string; tier: string }>
): boolean {
  const keys = (scopes: ReadonlyArray<{ surface_kind: string; operation: string; tier: string }>) =>
    scopes
      .map((scope) => `${scope.surface_kind}\u0000${scope.operation}\u0000${scope.tier}`)
      .sort()
      .join("\u0001");
  return keys(left) === keys(right);
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

function projectGameOverContext(context: BridgeV2GameOverContext): SemanticContext {
  return {
    kind: "run_ended",
    result: context.result,
    gameMode: context.game_mode,
    ...(context.score != null ? { score: context.score } : {}),
    ...(context.floor_reached != null ? { floorReached: context.floor_reached } : {}),
    ...(context.ascension != null ? { ascension: context.ascension } : {})
  };
}

function projectShopContext(player?: PlayerSnapshot): SemanticContext {
  return {
    kind: "shop",
    ...(player?.gold !== undefined ? { gold: player.gold } : {}),
    ...(player?.maxPotionSlots !== undefined ? { maxPotionSlots: player.maxPotionSlots } : {}),
    ...(player ? {
      potions: player.potions.map((potion) => ({
        entityId: potion.entityId ?? potion.id,
        id: potion.id,
        ...(potion.name ? { name: potion.name } : {}),
        ...(potion.description ? { description: potion.description } : {}),
        slot: potion.slot ?? 0
      }))
    } : {})
  };
}

function projectMapContext(context: BridgeV2MapContext): SemanticContext {
  const projectCoordinate = (coord: BridgeV2MapContext["visited"][number]) => ({
    col: coord.col,
    row: coord.row,
    type: coord.point_type ?? "unknown",
    leadsTo: [],
    children: []
  });
  return {
    kind: "map",
    ...(context.current_position ? {
      currentPosition: {
        col: context.current_position.col,
        row: context.current_position.row,
        ...(context.current_position.point_type ? { type: context.current_position.point_type } : {})
      }
    } : {}),
    visited: context.visited.map(projectCoordinate),
    nodes: context.nodes.map((node) => ({
      entityId: node.entity_id,
      col: node.col,
      row: node.row,
      type: node.point_type,
      state: node.state,
      leadsTo: node.children.map((child) => ({
        col: child.col,
        row: child.row,
        ...(child.point_type ? { type: child.point_type } : {})
      })),
      children: node.children.map((child) => ({ col: child.col, row: child.row }))
    }))
  };
}

function projectSharedVisibleState(shared: BridgeV2SharedVisibleState): {
  run: NonNullable<NormalizedCurrentState["run"]>;
  player: PlayerSnapshot;
} {
  const keywords = (items: Array<{ name: string; description?: string | null }>) => items.map((item) => ({
    name: item.name,
    ...(item.description ? { description: item.description } : {})
  }));
  return {
    run: {
      characterId: shared.player.character_definition_id,
      act: shared.run.act,
      actId: shared.run.act_definition_id,
      ...(shared.run.act_name ? { actName: shared.run.act_name } : {}),
      floor: shared.run.floor,
      ascension: shared.run.ascension,
      bosses: shared.run.bosses.map((boss) => ({
        id: boss.definition_id,
        ...(boss.name ? { name: boss.name } : {}),
        order: boss.order
      })),
      modifiers: shared.run.modifiers.map((modifier) => ({
        id: modifier.definition_id,
        ...(modifier.name ? { name: modifier.name } : {}),
        ...(modifier.description ? { description: modifier.description } : {}),
        keywords: keywords(modifier.keywords),
        cardPreviews: modifier.card_previews.map(projectBridgeV2Card)
      }))
    },
    player: {
      character: shared.player.character_name ?? shared.player.character_definition_id,
      hp: shared.player.hp,
      maxHp: shared.player.max_hp,
      gold: shared.player.gold,
      hand: [],
      drawPile: [],
      discardPile: [],
      exhaustPile: [],
      companions: [],
      orbs: [],
      statuses: [],
      relics: shared.player.relics.map((relic) => ({
        entityId: relic.entity_id,
        id: relic.definition_id,
        ...(relic.name ? { name: relic.name } : {}),
        ...(relic.description ? { description: relic.description } : {}),
        ...(relic.counter !== undefined ? { counter: relic.counter } : {}),
        keywords: keywords(relic.keywords),
        cardPreviews: relic.card_previews.map(projectBridgeV2Card)
      })),
      potions: shared.player.potions.map((potion) => ({
        entityId: potion.entity_id,
        id: potion.definition_id,
        ...(potion.name ? { name: potion.name } : {}),
        ...(potion.description ? { description: potion.description } : {}),
        slot: potion.slot,
        keywords: keywords(potion.keywords),
        cardPreviews: potion.card_previews.map(projectBridgeV2Card)
      })),
      maxPotionSlots: shared.player.max_potion_slots
    }
  };
}

function projectCombatPlayer(
  context: BridgeV2CombatContext,
  shared: BridgeV2SharedVisibleState
): PlayerSnapshot {
  const player = context.player;
  const persistent = projectSharedVisibleState(shared).player;
  const potionStates = new Map(player.potion_states.map((potion) => [potion.entity_id, potion]));
  return {
    ...persistent,
    block: player.block,
    energy: player.energy,
    maxEnergy: player.max_energy,
    ...(player.stars !== null && player.stars !== undefined ? { stars: player.stars } : {}),
    hand: player.hand.map(projectBridgeV2Card),
    drawPileCount: player.draw_pile_count,
    discardPileCount: player.discard_pile_count,
    exhaustPileCount: player.exhaust_pile_count,
    drawPile: [],
    discardPile: [],
    exhaustPile: [],
    companions: player.companions.map((companion) => ({
      entityId: companion.entity_id,
      id: companion.definition_id,
      ...(companion.name ? { name: companion.name } : {}),
      isAlive: companion.is_alive,
      healthBarVisible: companion.health_bar_visible,
      ...(companion.hp !== null && companion.hp !== undefined ? { hp: companion.hp } : {}),
      ...(companion.max_hp !== null && companion.max_hp !== undefined ? { maxHp: companion.max_hp } : {}),
      block: companion.block,
      statuses: companion.statuses.map((status) => ({
        id: status.definition_id,
        ...(status.name ? { name: status.name } : {}),
        amount: status.amount,
        type: status.type,
        ...(status.description ? { description: status.description } : {})
      }))
    })),
    statuses: player.statuses.map((status) => ({
      id: status.definition_id,
      ...(status.name ? { name: status.name } : {}),
      amount: status.amount,
      type: status.type,
      ...(status.description ? { description: status.description } : {})
    })),
    potions: persistent.potions.map((potion) => {
      const state = potion.entityId ? potionStates.get(potion.entityId) : undefined;
      return {
        ...potion,
        ...(state ? {
          targetType: state.target_type,
          canUseInCombat: state.can_use,
          automatic: state.automatic
        } : {})
      };
    }),
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

function projectDeckRemovalSurface(
  surface: BridgeV2DeckRemovalSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): DeckRemovalSelectionSurface {
  return {
    kind: "deck_removal_selection",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    cancelable: surface.cancelable,
    cards: surface.cards.map(projectBridgeV2Card),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectRelicDeckRemovalSurface(
  surface: BridgeV2RelicDeckRemovalSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): RelicDeckRemovalSelectionSurface {
  return {
    kind: "relic_deck_removal_selection",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    cancelable: surface.cancelable,
    cards: surface.cards.map(projectBridgeV2Card),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectRewardDeckRemovalSurface(
  surface: BridgeV2RewardDeckRemovalSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): RewardDeckRemovalSelectionSurface {
  return {
    kind: "reward_deck_removal_selection",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    cancelable: surface.cancelable,
    cards: surface.cards.map(projectBridgeV2Card),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectDeckUpgradeSurface(
  surface: BridgeV2DeckUpgradeSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): DeckUpgradeSelectionSurface {
  return {
    kind: "deck_upgrade_selection",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    cancelable: surface.cancelable,
    cards: surface.cards.map(projectBridgeV2Card),
    previewCards: surface.preview_cards.map(projectBridgeV2Card),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectDeckTransformSurface(
  surface: BridgeV2DeckTransformSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): DeckTransformSelectionSurface {
  return {
    kind: "deck_transform_selection",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    cancelable: surface.cancelable,
    upgradeToggleVisible: surface.upgrade_toggle_visible,
    showingUpgradePreviews: surface.showing_upgrade_previews,
    previewKind: surface.preview_kind,
    replacementKnown: false,
    cards: surface.cards.map(projectBridgeV2Card),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectWoodCarvingsReplacementSurface(
  surface: BridgeV2WoodCarvingsReplacementSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): WoodCarvingsReplacementSelectionSurface {
  return {
    kind: "wood_carvings_replacement_selection",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    branch: surface.branch,
    replacementDefinitionId: surface.replacement_definition_id,
    ...(surface.replacement_name ? { replacementName: surface.replacement_name } : {}),
    ...(surface.replacement_description ? { replacementDescription: surface.replacement_description } : {}),
    minimumSelections: 1,
    maximumSelections: 1,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
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
      willKillPlayer: option.will_kill_player,
      tooltips: option.tooltips.map((tooltip) => tooltip.kind === "card"
        ? { kind: "card" as const, card: projectBridgeV2Card(tooltip.card) }
        : {
            kind: "text" as const,
            ...(tooltip.name ? { name: tooltip.name } : {}),
            ...(tooltip.description ? { description: tooltip.description } : {})
          }),
      ...(option.relic_name ? { relicName: option.relic_name } : {}),
      ...(option.relic_description ? { relicDescription: option.relic_description } : {})
    })),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectEventDialogueSurface(
  surface: BridgeV2EventDialogueSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): EventDialogueSurface {
  return {
    kind: "event_dialogue",
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    currentLineIndex: surface.current_line_index,
    revealedLines: surface.revealed_lines.map((line) => ({
      entityId: line.entity_id,
      index: line.index,
      text: line.text,
      speaker: line.speaker,
      isCurrent: line.is_current
    })),
    advanceLabel: surface.advance_label,
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectRestSiteSurface(
  surface: BridgeV2RestSiteSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): RestSiteSurface {
  return {
    kind: "rest_site",
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    options: surface.options.map((option) => ({
      entityId: option.entity_id,
      index: option.index,
      optionId: option.option_id,
      ...(option.name ? { name: option.name } : {}),
      ...(option.description ? { description: option.description } : {}),
      enabled: option.enabled
    })),
    canProceed: surface.can_proceed,
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectShopInventorySurface(
  surface: BridgeV2ShopInventorySurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): ShopInventorySurface {
  type ShopOffer = BridgeV2ShopInventorySurface["cards"][number]
    | BridgeV2ShopInventorySurface["relics"][number]
    | BridgeV2ShopInventorySurface["potions"][number]
    | NonNullable<BridgeV2ShopInventorySurface["card_removal"]>;
  const base = (offer: ShopOffer) => ({
    entityId: offer.entity_id,
    slotEntityId: offer.slot_entity_id,
    inventoryIndex: offer.inventory_index,
    price: offer.price,
    stocked: offer.stocked,
    visible: offer.visible,
    affordable: offer.affordable,
    canPurchase: offer.can_purchase,
    ...(offer.blocked_reason ? { blockedReason: offer.blocked_reason } : {})
  });
  return {
    kind: "shop_inventory",
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    cards: surface.cards.map((offer) => ({
      ...base(offer),
      onSale: offer.on_sale,
      ...(offer.card ? { card: projectBridgeV2Card(offer.card) } : {})
    })),
    relics: surface.relics.map((offer) => ({
      ...base(offer),
      ...(offer.relic ? {
        relic: {
          id: offer.relic.definition_id,
          ...(offer.relic.name ? { name: offer.relic.name } : {}),
          ...(offer.relic.description ? { description: offer.relic.description } : {}),
          ...(offer.relic.counter !== undefined ? { counter: offer.relic.counter } : {}),
          keywords: offer.relic.keywords.map((keyword) => ({
            name: keyword.name,
            ...(keyword.description ? { description: keyword.description } : {})
          })),
          cardPreviews: offer.relic.card_previews.map(projectBridgeV2Card)
        }
      } : {})
    })),
    potions: surface.potions.map((offer) => ({
      ...base(offer),
      ...(offer.definition_id ? { id: offer.definition_id } : {}),
      ...(offer.name ? { name: offer.name } : {}),
      ...(offer.description ? { description: offer.description } : {}),
      ...(offer.rarity ? { rarity: offer.rarity } : {})
    })),
    ...(surface.card_removal ? {
      cardRemoval: {
        ...base(surface.card_removal),
        nextPriceIncrease: surface.card_removal.next_price_increase
      }
    } : {}),
    canClose: surface.can_close,
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectShopRoomSurface(
  surface: BridgeV2ShopRoomSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): ShopRoomSurface {
  return {
    kind: "shop_room",
    bridgeStateId: stateId,
    roomEntityId: surface.room_entity_id,
    canOpenInventory: surface.can_open_inventory,
    canProceed: surface.can_proceed,
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectTreasureRoomSurface(
  surface: BridgeV2TreasureRoomSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): TreasureRoomSurface {
  return {
    kind: "treasure_room",
    stage: surface.stage,
    bridgeStateId: stateId,
    roomEntityId: surface.room_entity_id,
    chestOpened: surface.chest_opened,
    relics: surface.relics.map((relic) => ({
      entityId: relic.entity_id,
      id: relic.definition_id,
      ...(relic.name ? { name: relic.name } : {}),
      ...(relic.description ? { description: relic.description } : {}),
      rarity: relic.rarity,
      keywords: relic.keywords.flatMap((keyword) => keyword.name
        ? [{ name: keyword.name, ...(keyword.description ? { description: keyword.description } : {}) }]
        : []),
      cardPreviews: relic.card_previews.map(projectBridgeV2Card)
    })),
    canSkip: surface.can_skip,
    canProceed: surface.can_proceed,
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectGameOverSurface(
  surface: BridgeV2GameOverSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): GameOverSurface {
  return {
    kind: "game_over",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    ...(surface.return_destination ? { returnDestination: surface.return_destination } : {}),
    canAdvanceSummary: surface.can_advance_summary,
    canReturn: surface.can_return,
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectCharacterSelectSurface(
  surface: BridgeV2CharacterSelectSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): CharacterSelectSurface {
  return {
    kind: "character_select",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    characters: surface.characters.map((choice) => ({
      entityId: choice.entity_id,
      index: choice.index,
      characterId: choice.character_id,
      name: choice.name,
      locked: choice.is_locked,
      selected: choice.is_selected,
      random: choice.is_random
    })),
    ...(surface.selected_details ? {
      selectedDetails: {
        characterId: surface.selected_details.character_id,
        title: surface.selected_details.title,
        ...(surface.selected_details.description ? { description: surface.selected_details.description } : {}),
        ...(surface.selected_details.starting_hp != null ? { startingHp: surface.selected_details.starting_hp } : {}),
        ...(surface.selected_details.starting_gold != null ? { startingGold: surface.selected_details.starting_gold } : {}),
        ...(surface.selected_details.starting_relic ? {
          startingRelic: {
            id: surface.selected_details.starting_relic.definition_id,
            ...(surface.selected_details.starting_relic.name ? { name: surface.selected_details.starting_relic.name } : {}),
            ...(surface.selected_details.starting_relic.description ? { description: surface.selected_details.starting_relic.description } : {})
          }
        } : {})
      }
    } : {}),
    ...(surface.ascension != null ? { ascension: surface.ascension } : {}),
    ...(surface.ascension_title ? { ascensionTitle: surface.ascension_title } : {}),
    ...(surface.ascension_description ? { ascensionDescription: surface.ascension_description } : {}),
    canDecreaseAscension: surface.can_decrease_ascension,
    canIncreaseAscension: surface.can_increase_ascension,
    canEmbark: surface.can_embark,
    canGoBack: surface.can_go_back,
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectMainMenuSurface(
  surface: BridgeV2MainMenuSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): MainMenuSurface {
  return {
    kind: "main_menu",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    choices: projectMenuChoices(surface.options),
    ...(surface.continue_run ? {
      continueRun: {
        characterId: surface.continue_run.character_id,
        ...(surface.continue_run.character_name ? { characterName: surface.continue_run.character_name } : {}),
        actId: surface.continue_run.act_id,
        ...(surface.continue_run.act_name ? { actName: surface.continue_run.act_name } : {}),
        floor: surface.continue_run.floor,
        hp: surface.continue_run.hp,
        maxHp: surface.continue_run.max_hp,
        gold: surface.continue_run.gold,
        ascension: surface.continue_run.ascension
      }
    } : {}),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectSingleplayerMenuSurface(
  surface: BridgeV2SingleplayerMenuSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): SingleplayerMenuSurface {
  return {
    kind: "singleplayer_menu",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    choices: projectMenuChoices(surface.options),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectMenuChoices(choices: BridgeV2MainMenuSurface["options"]): MainMenuSurface["choices"] {
  return choices.map((choice) => ({
    entityId: choice.entity_id,
    semanticId: choice.semantic_id,
    label: choice.label,
    ...(choice.description ? { description: choice.description } : {}),
    enabled: choice.enabled,
    bridgeSupport: choice.bridge_support,
    ...(choice.blocked_reason ? { blockedReason: choice.blocked_reason } : {})
  }));
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

function projectCombatPileCardSelectionSurface(
  surface: BridgeV2CombatPileCardSelectionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): CombatPileCardSelectionSurface {
  const base = {
    kind: "combat_pile_card_selection" as const,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    sourceCardEntityId: surface.source_card_entity_id,
    pileType: surface.pile_type,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    requireManualConfirmation: surface.require_manual_confirmation,
    cancelable: surface.cancelable,
    cards: surface.cards.map(projectBridgeV2Card),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
  switch (surface.source_kind) {
    case "graveblast":
      return {
        ...base,
        purpose: surface.purpose,
        sourceKind: surface.source_kind,
        sourceCardDefinitionId: surface.source_card_definition_id,
        destinationPile: surface.destination_pile,
        destinationPosition: surface.destination_position,
        overflowDestination: surface.overflow_destination
      };
    case "headbutt":
      return {
        ...base,
        purpose: surface.purpose,
        sourceKind: surface.source_kind,
        sourceCardDefinitionId: surface.source_card_definition_id,
        destinationPile: surface.destination_pile,
        destinationPosition: surface.destination_position
      };
    case "cleanse":
      return {
        ...base,
        purpose: surface.purpose,
        sourceKind: surface.source_kind,
        sourceCardDefinitionId: surface.source_card_definition_id,
        pileType: surface.pile_type,
        destinationPile: surface.destination_pile,
        destinationPosition: surface.destination_position
      };
    case "seance":
      return {
        ...base,
        purpose: surface.purpose,
        sourceKind: surface.source_kind,
        sourceCardDefinitionId: surface.source_card_definition_id,
        pileType: surface.pile_type,
        destinationPile: surface.destination_pile,
        destinationPosition: surface.destination_position,
        overflowDestination: surface.overflow_destination ?? null
      };
    case "dredge":
      return {
        ...base,
        purpose: surface.purpose,
        sourceKind: surface.source_kind,
        sourceCardDefinitionId: surface.source_card_definition_id,
        pileType: surface.pile_type,
        destinationPile: surface.destination_pile,
        destinationPosition: surface.destination_position,
        overflowDestination: surface.overflow_destination ?? null
      };
    case "charge":
      return {
        ...base,
        purpose: surface.purpose,
        sourceKind: surface.source_kind,
        sourceCardDefinitionId: surface.source_card_definition_id,
        pileType: surface.pile_type,
        destinationPile: surface.destination_pile,
        destinationPosition: surface.destination_position,
        overflowDestination: surface.overflow_destination ?? null
      };
  }
}

function combatPileSelectionContract(sourceKind: BridgeV2CombatPileCardSelectionSurface["source_kind"]): {
  operation: string;
  label: (cardName: string, selected?: boolean) => string;
} {
  switch (sourceKind) {
    case "headbutt":
      return {
        operation: "select_discard_card_for_draw_top",
        label: (cardName) => `Put ${cardName} on top of the Draw Pile`
      };
    case "graveblast":
      return {
        operation: "select_discard_card_for_hand",
        label: (cardName) => `Put ${cardName} back in your Hand`
      };
    case "cleanse":
      return {
        operation: "select_draw_card_for_exhaust",
        label: (cardName) => `Exhaust ${cardName}`
      };
    case "seance":
      return {
        operation: "select_draw_card_for_soul_transform",
        label: (cardName) => `Transform ${cardName} into Soul`
      };
    case "dredge":
      return {
        operation: "toggle_discard_card_for_dredge",
        label: (cardName, selected = false) => selected
          ? `Deselect ${cardName} from Dredge`
          : `Select ${cardName} for Dredge`
      };
    case "charge":
      return {
        operation: "toggle_draw_card_for_charge",
        label: (cardName, selected = false) => selected
          ? `Deselect ${cardName} from CHARGE!!`
          : `Select ${cardName} for CHARGE!!`
      };
  }
}

function projectCombatHandCardSelectionSurface(
  surface: BridgeV2CombatHandCardSelectionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): CombatHandCardSelectionSurface {
  return {
    kind: "combat_hand_card_selection",
    bridgeStateId: stateId,
    handEntityId: surface.hand_entity_id,
    prompt: surface.prompt,
    selectionMode: surface.selection_mode,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    requireManualConfirmation: surface.require_manual_confirmation,
    isPeeking: surface.is_peeking,
    cards: surface.cards.map(projectBridgeV2Card),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectEventCardAcquisitionSurface(
  surface: BridgeV2EventCardAcquisitionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): EventCardAcquisitionSurface {
  return {
    kind: "event_card_acquisition",
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    prompt: surface.prompt,
    destination: surface.destination,
    minimumSelections: surface.min_select,
    maximumSelections: surface.max_select,
    selectedCount: surface.selected_count,
    selectedCardEntityIds: [...surface.selected_card_entity_ids],
    requireManualConfirmation: false,
    cards: surface.cards.map(projectBridgeV2Card),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectGeneratedCardChoiceSurface(
  surface: BridgeV2GeneratedCardChoiceSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): GeneratedCardChoiceSurface {
  const base = {
    kind: "generated_card_choice" as const,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    ...(surface.prompt ? { prompt: surface.prompt } : {}),
    canSkip: surface.can_skip,
    isPeeking: surface.is_peeking,
    cards: surface.cards.map(projectBridgeV2Card),
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
  return surface.source_kind === "lead_paperweight"
    ? {
        ...base,
        purpose: surface.purpose,
        sourceKind: surface.source_kind,
        destination: surface.destination,
        selectedCardCostPolicy: surface.selected_card_cost_policy
      }
    : surface.source_kind === "knowledge_demon_curse"
      ? {
          ...base,
          purpose: surface.purpose,
          sourceKind: surface.source_kind,
          destination: surface.destination,
          selectedCardCostPolicy: surface.selected_card_cost_policy,
          canSkip: false as const
        }
      : {
        ...base,
        purpose: surface.purpose,
        sourceKind: surface.source_kind,
        destination: surface.destination,
        selectedCardCostPolicy: surface.selected_card_cost_policy,
        overflowDestination: surface.overflow_destination
      };
}

function projectCardBundleSelectionSurface(
  surface: BridgeV2CardBundleSelectionSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): CardBundleSelectionSurface {
  return {
    kind: "card_bundle_selection",
    stage: surface.stage,
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    ...(surface.prompt ? { prompt: surface.prompt } : {}),
    ...(surface.selected_bundle_entity_id ? { selectedBundleEntityId: surface.selected_bundle_entity_id } : {}),
    bundles: surface.bundles.map((bundle) => ({
      entityId: bundle.entity_id,
      cards: bundle.cards.map(projectBridgeV2Card)
    })),
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
    potionSlotsFull: surface.potion_slots_full,
    discardablePotions: surface.discardable_potions.map((potion) => ({
      entityId: potion.entity_id,
      id: potion.definition_id,
      ...(potion.name ? { name: potion.name } : {}),
      ...(potion.description ? { description: potion.description } : {}),
      slot: potion.slot
    })),
    canProceed: surface.can_proceed,
    proceedSkipsRemainingRewards: surface.proceed_skips_remaining_rewards,
    legalActions: projectActions(actions),
    completeness: projectCompleteness(completeness)
  };
}

function projectMapNavigationSurface(
  context: BridgeV2MapContext,
  surface: BridgeV2MapNavigationSurface,
  stateId: string,
  actions: BridgeV2LegalAction[],
  completeness: RawCompleteness
): MapNavigationSurface {
  return {
    kind: "map_navigation",
    bridgeStateId: stateId,
    screenEntityId: surface.screen_entity_id,
    travelEnabled: surface.travel_enabled,
    traveling: surface.traveling,
    drawingMode: surface.drawing_mode,
    nextOptions: surface.next_options.map((option) => {
      const topology = context.nodes.find((node) => node.entity_id === option.entity_id);
      return {
        entityId: option.entity_id,
        col: option.col,
        row: option.row,
        type: option.point_type,
        state: "travelable",
        leadsTo: (topology?.children ?? []).map((child) => ({
          col: child.col,
          row: child.row,
          ...(child.point_type ? { type: child.point_type } : {})
        })),
        children: (topology?.children ?? []).map((child) => ({ col: child.col, row: child.row }))
      };
    }),
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
    entityBindings: action.entity_bindings.map((binding) => ({
      role: binding.role,
      entityId: binding.entity_id
    })),
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

function projectCoherentObservation(
  raw: JsonObject,
  expectedStateId: string,
  observedInspectionKinds: string[],
  diagnostics: DiagnosticsBuilder
) {
  const observationId = typeof raw.observation_id === "string" ? raw.observation_id : undefined;
  const stateId = typeof raw.state_id === "string" ? raw.state_id : undefined;
  const inspectionKinds = Array.isArray(raw.inspection_kinds)
    ? raw.inspection_kinds.filter(isBridgeV2InspectionKind)
    : [];
  const expectedKinds = observedInspectionKinds.filter(isBridgeV2InspectionKind);
  const coherent = raw.coherent === true;
  if (!observationId
      || !coherent
      || stateId !== expectedStateId
      || inspectionKinds.length !== (Array.isArray(raw.inspection_kinds) ? raw.inspection_kinds.length : -1)
      || [...inspectionKinds].sort().join(",") !== [...expectedKinds].sort().join(",")) {
    diagnostics.invalid(
      "bridge_v2_observation",
      raw,
      "coherent observation metadata must match the enclosed state and inspection sidecars"
    );
    return undefined;
  }
  return {
    observationId,
    coherent: true as const,
    stateId,
    inspectionKinds
  };
}

function isBridgeV2InspectionKind(value: unknown): value is BridgeV2InspectionKind {
  return typeof value === "string"
    && BRIDGE_V2_INSPECTION_KINDS.includes(value as BridgeV2InspectionKind);
}

function safeMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}
