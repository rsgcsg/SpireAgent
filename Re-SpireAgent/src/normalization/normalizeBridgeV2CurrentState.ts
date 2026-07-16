import type { AdapterDescriptor } from "../game-io/adapter.js";
import {
  NORMALIZED_STATE_SCHEMA_VERSION,
  type CardSnapshot,
  type DeckEnchantSelectionSurface,
  type NormalizedCurrentState,
  type SemanticContext,
  type StateEnvelope
} from "../domain/state/index.js";
import {
  decodeBridgeV2Capabilities,
  decodeBridgeV2State,
  isBridgeV2DeckEnchantSurface,
  isBridgeV2UnsupportedSurface,
  type BridgeV2DeckEnchantSurface
} from "../integrations/sts2mcp/bridgeV2Protocol.js";
import {
  bridgeV2CapabilitiesFromWrapper,
  bridgeV2StateFromWrapper,
  legacyStateFromBridgeV2Wrapper,
  type Sts2McpRawState
} from "../integrations/sts2mcp/rawState.js";
import { stateHash } from "../runtime/stateHash.js";
import { DiagnosticsBuilder } from "./diagnostics.js";

const DECK_ENCHANT_ACTION_KINDS = new Set([
  "toggle_card",
  "preview_selection",
  "confirm_selection",
  "cancel_preview",
  "close_selection"
]);

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
  const context: SemanticContext = inherited?.context ?? {
    kind: "unknown",
    reason: "Bridge v2 surface does not yet provide parent semantic context",
    observedTopLevelKeys: Object.keys(rawState).sort()
  };
  if (inherited) {
    diagnostics.infer(
      "context/run/player",
      ["legacy_v1_state"],
      "dual-read migration sidecar; Bridge v2 remains the sole action authority"
    );
  }

  const sourceStateType = state ? `bridge_v2:${state.surface.kind}` : "bridge_v2:invalid";
  const base = {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType,
    ...(inherited?.run ? { run: inherited.run } : {}),
    ...(inherited?.player ? { player: inherited.player } : {})
  };

  let surface: NormalizedCurrentState["surface"] = {
    kind: "unsupported",
    reason: "Bridge v2 state could not be decoded",
    classification: "schema_drift",
    observedTopLevelKeys: Object.keys(rawState).sort()
  };

  if (state && capabilities) {
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

    if (!state.game.compatibility.action_execution_allowed || !capabilities.game.compatibility.action_execution_allowed) {
      diagnostics.invalid("bridge_v2.game.compatibility", state.game.compatibility, "exact-build action execution is disabled");
      surface = unsupported(rawState, "Bridge v2 exact game-build compatibility did not pass");
    } else if (isBridgeV2UnsupportedSurface(state.surface)) {
      surface = unsupported(rawState, `Bridge v2 does not implement ${state.surface.source_type}: ${state.surface.reason}`);
    } else if (!isBridgeV2DeckEnchantSurface(state.surface)) {
      surface = unsupported(rawState, `Re-SpireAgent does not support Bridge v2 surface ${state.surface.kind}`);
    } else if (state.readiness !== "ready") {
      diagnostics.invalid("bridge_v2.readiness", state.readiness, "supported surface is not ready");
      surface = unsupported(rawState, `Bridge v2 surface readiness is ${state.readiness}`);
    } else {
      const advertised = capabilities.surfaces.find((candidate) => candidate.kind === state.surface.kind);
      if (!advertised || advertised.support !== "implemented_exact_game_version") {
        diagnostics.invalid("bridge_v2.capabilities.surfaces", capabilities.surfaces, "current surface is not advertised as exact-version implemented");
      }
      validateDeckEnchantState(
        state.surface,
        state.state_id,
        state.legal_actions,
        state.completeness.missing,
        new Set(advertised?.operations ?? []),
        diagnostics
      );
      surface = projectDeckEnchantSurface(state.surface, state.state_id, state.legal_actions, state.completeness);
    }

    for (const warning of state.warnings) diagnostics.warn(`Bridge v2: ${warning}`);
  }

  const builtDiagnostics = diagnostics.build();
  const currentState: NormalizedCurrentState = {
    ...base,
    stability: builtDiagnostics.status === "invalid" || surface.kind === "unsupported" ? "invalid" : "actionable",
    context,
    surface: builtDiagnostics.status === "invalid" && surface.kind !== "unsupported"
      ? unsupported(rawState, "Bridge v2 contract validation failed")
      : surface
  };

  const legacyRaw = legacyStateFromBridgeV2Wrapper(rawState);
  return {
    envelopeSchemaVersion: 2,
    capturedAt,
    source,
    rawState,
    currentState,
    diagnostics: builtDiagnostics,
    // observed_at is intentionally excluded; the bridge state id owns action
    // identity while the sidecar hash protects prompt-visible legacy semantics.
    stateHash: stateHash({ bridgeStateId: state?.state_id ?? null, legacyState: legacyRaw ?? null }),
    normalizedStateHash: stateHash(currentState)
  };
}

function validateDeckEnchantState(
  surface: BridgeV2DeckEnchantSurface,
  stateId: string,
  actions: Array<{ action_id: string; state_id: string; kind: string; authority: string }>,
  missing: string[],
  advertisedOperations: ReadonlySet<string>,
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
  const cardIds = new Set(surface.cards.map((card) => card.entity_id));
  if (cardIds.size !== surface.cards.length) {
    diagnostics.invalid("bridge_v2.surface.cards", surface.cards, "card entity ids are not unique");
  }
  const selectedIds = new Set(surface.selected_card_entity_ids);
  for (const selectedId of surface.selected_card_entity_ids) {
    if (!cardIds.has(selectedId)) diagnostics.invalid("bridge_v2.surface.selected_card_entity_ids", selectedId, "selected card is absent from cards");
  }
  for (const card of surface.cards) {
    if (card.is_selected !== selectedIds.has(card.entity_id)) {
      diagnostics.invalid("bridge_v2.surface.cards.is_selected", card, "card selected flag disagrees with selected ids");
    }
  }
  if (missing.length > 0) diagnostics.invalid("bridge_v2.completeness.missing", missing, "ready surface has missing required semantics");
  if (actions.length === 0) diagnostics.invalid("bridge_v2.legal_actions", actions, "ready deck-enchant surface has no legal actions");
  const actionIds = new Set(actions.map((action) => action.action_id));
  if (actionIds.size !== actions.length) diagnostics.invalid("bridge_v2.legal_actions", actions, "action ids are not unique");
  for (const action of actions) {
    if (action.state_id !== stateId) diagnostics.invalid("bridge_v2.legal_actions.state_id", action.state_id, "action is not bound to current state");
    if (action.authority !== "game_ui") diagnostics.invalid("bridge_v2.legal_actions.authority", action.authority, "unexpected action authority");
    if (!DECK_ENCHANT_ACTION_KINDS.has(action.kind)) diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "unknown deck-enchant action kind");
    if (!advertisedOperations.has(action.kind)) diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "action kind is absent from the advertised surface operations");
    if (surface.stage === "selecting" && (action.kind === "confirm_selection" || action.kind === "cancel_preview")) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "preview-only action appeared during selecting stage");
    }
    if (surface.stage === "preview" && (action.kind === "toggle_card" || action.kind === "preview_selection" || action.kind === "close_selection")) {
      diagnostics.invalid("bridge_v2.legal_actions.kind", action.kind, "selecting-only action appeared during preview stage");
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

function projectDeckEnchantSurface(
  surface: BridgeV2DeckEnchantSurface,
  stateId: string,
  actions: Array<{
    action_id: string;
    state_id: string;
    kind: string;
    category?: string;
    label: string;
    authority: string;
    evidence_code: string;
  }>,
  completeness: {
    player_visible_semantics: string;
    legal_actions: string;
    sources: string[];
    missing: string[];
  }
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
    cards: surface.cards.map(projectCard),
    legalActions: actions.map((action) => ({
      actionId: action.action_id,
      stateId: action.state_id,
      kind: action.kind,
      label: action.label,
      authority: action.authority,
      evidenceCode: action.evidence_code,
      ...(action.category ? { category: action.category } : {})
    })),
    completeness: {
      playerVisibleSemantics: completeness.player_visible_semantics,
      legalActions: completeness.legal_actions,
      sources: [...completeness.sources],
      missing: [...completeness.missing]
    }
  };
}

function projectCard(card: BridgeV2DeckEnchantSurface["cards"][number]): CardSnapshot {
  return {
    id: card.definition_id,
    entityId: card.entity_id,
    name: card.name ?? card.definition_id,
    type: card.type,
    cost: card.cost,
    ...(card.star_cost !== null && card.star_cost !== undefined ? { starCost: card.star_cost } : {}),
    ...(card.description ? { description: card.description } : {}),
    rarity: card.rarity,
    upgraded: card.is_upgraded,
    selected: card.is_selected,
    keywords: [],
    ...(card.existing_enchantment ? {
      existingEnchantment: {
        definitionId: card.existing_enchantment.definition_id,
        ...(card.existing_enchantment.name ? { name: card.existing_enchantment.name } : {}),
        ...(card.existing_enchantment.description ? { description: card.existing_enchantment.description } : {}),
        amount: card.existing_enchantment.amount,
        ...(card.existing_enchantment.observation_source ? { observationSource: card.existing_enchantment.observation_source } : {})
      }
    } : {})
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
