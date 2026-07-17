import type { AdapterDescriptor } from "../game-io/adapter.js";
import {
  NORMALIZED_STATE_SCHEMA_VERSION,
  type InteractionSurface,
  type NormalizedCurrentState,
  type NormalizedStateBase,
  type PlayerSnapshot,
  type RunSnapshot,
  type SemanticContext,
  type StateEnvelope,
  type StateStability
} from "../domain/state/index.js";
import { isJsonObject, type JsonObject, type JsonValue } from "../shared/json.js";
import {
  bridgeV2CapabilitiesSidecarFromRaw,
  bridgeV2InspectionIdentity,
  bridgeV2InspectionsFromWrapper,
  isBridgeV2WrappedState,
  legacyStateFromBridgeV2Wrapper
} from "../integrations/sts2mcp/rawState.js";
import { decodeBridgeV2Capabilities } from "../integrations/sts2mcp/bridgeV2Protocol.js";
import { stateHash } from "../runtime/stateHash.js";
import { normalizeBridgeV2CurrentState } from "./normalizeBridgeV2CurrentState.js";
import { DiagnosticsBuilder } from "./diagnostics.js";
import { projectBridgeV2Inspections } from "./bridgeV2InspectionProjection.js";
import {
  objectArray,
  objectField,
  optionalBoolean,
  optionalNumber,
  optionalString,
  parseCards,
  parseEnemies,
  parseIndexedOptions,
  parseMapNodes,
  parsePlayer,
  parseRewards,
  parseShopItems
} from "./parsers.js";

const KNOWN_TOP_LEVEL_KEYS = new Set([
  "state_type", "stateType", "run", "player", "battle", "card_reward", "cardReward", "rewards", "map",
  "rest_site", "restSite", "event", "shop", "treasure", "card_select", "cardSelect", "hand_select",
  "handSelect", "bundle_select", "bundleSelect", "crystal_sphere", "crystalSphere", "game_over", "gameOver",
  "menu_screen", "menuScreen", "message", "options", "characters",
  "bridge_v2_capabilities", "bridge_v2_inspections", "bridge_v2_authority_evidence"
]);
const COMBAT_STATE_TOKENS = ["monster", "boss", "elite", "combat", "battle"] as const;

export function normalizeCurrentState(rawInput: unknown, source: AdapterDescriptor, capturedAt = new Date().toISOString()): StateEnvelope {
  if (isBridgeV2WrappedState(rawInput)) {
    const legacyRaw = legacyStateFromBridgeV2Wrapper(rawInput);
    const legacyEnvelope = legacyRaw ? normalizeLegacyCurrentState(legacyRaw, source, capturedAt) : undefined;
    return normalizeBridgeV2CurrentState(rawInput, source, capturedAt, legacyEnvelope);
  }
  return normalizeLegacyCurrentState(rawInput, source, capturedAt);
}

function normalizeLegacyCurrentState(rawInput: unknown, source: AdapterDescriptor, capturedAt: string): StateEnvelope {
  const diagnostics = new DiagnosticsBuilder();
  const rawState = isJsonObject(rawInput) ? rawInput : {};
  if (!isJsonObject(rawInput)) diagnostics.invalid("$", rawInput, "MCP state must be a JSON object");
  reportUnknownKeys(rawState, "$", KNOWN_TOP_LEVEL_KEYS, diagnostics);

  const sourceStateType = optionalString(rawState.state_type ?? rawState.stateType);
  if (!sourceStateType) diagnostics.missing("state_type");
  let base = buildBase(rawState, sourceStateType ?? "unknown", diagnostics);
  const inspectionRaw = bridgeV2InspectionsFromWrapper(rawState);
  const capabilitiesRaw = bridgeV2CapabilitiesSidecarFromRaw(rawState);
  const projectedInspections = projectBridgeV2Inspections(
    capabilitiesRaw,
    inspectionRaw,
    undefined,
    diagnostics
  );
  if (base.player) {
    base = {
      ...base,
      player: {
        ...base.player,
        ...(projectedInspections.runDeck ? { runDeck: projectedInspections.runDeck } : {}),
        ...(projectedInspections.drawPile ? { drawPile: projectedInspections.drawPile } : {}),
        ...(projectedInspections.discardPile ? { discardPile: projectedInspections.discardPile } : {}),
        ...(projectedInspections.exhaustPile ? { exhaustPile: projectedInspections.exhaustPile } : {})
      },
      bridgeInspections: projectedInspections.evidence,
      ...(projectedInspections.diagnostics.length > 0
        ? { bridgeDiagnostics: projectedInspections.diagnostics }
        : {})
    };
  }
  const bridgeInspectionFacts = {
    ...(projectedInspections.runDeck ? { runDeck: projectedInspections.runDeck } : {}),
    ...(projectedInspections.drawPile ? { drawPile: projectedInspections.drawPile } : {}),
    ...(projectedInspections.discardPile ? { discardPile: projectedInspections.discardPile } : {}),
    ...(projectedInspections.exhaustPile ? { exhaustPile: projectedInspections.exhaustPile } : {})
  };
  if (Object.keys(bridgeInspectionFacts).length > 0) {
    base = { ...base, bridgeInspectionFacts };
  }
  if (capabilitiesRaw) {
    try {
      const capabilities = decodeBridgeV2Capabilities(capabilitiesRaw).data;
      base = {
        ...base,
        bridgeInspectionPolicy: {
          status: capabilities.inspections.status,
          stateBound: capabilities.inspections.state_bound,
          arbitraryQueriesAllowed: capabilities.inspections.arbitrary_queries_allowed,
          entersCommandLedger: capabilities.inspections.enters_command_ledger,
          visibilityClasses: [...capabilities.inspections.visibility_classes],
          orderingSemantics: [...capabilities.inspections.ordering_semantics],
          implementedKinds: [...capabilities.inspections.implemented_kinds]
        }
      };
    } catch (error) {
      diagnostics.invalid("bridge_v2_capabilities", capabilitiesRaw, String(error).slice(0, 500));
    }
  }
  const context = normalizeContext(rawState, base.sourceStateType, diagnostics);
  let surface = normalizeSurface(rawState, context, diagnostics);

  if (!isCompatible(context, surface)) {
    diagnostics.invalid("context.surface", { context: context.kind, surface: surface.kind }, "unsupported context/surface combination");
    surface = unsupportedSurface(rawState, "schema_drift", `Unsupported ${context.kind} + ${surface.kind} combination`);
  }

  const builtDiagnostics = diagnostics.build();
  let currentState: NormalizedCurrentState = {
    ...base,
    stability: determineStability(surface, builtDiagnostics.status),
    actionAuthority: surface.kind === "unsupported" || surface.kind === "no_action" ? "none" : "local_reconstruction",
    context,
    surface
  };

  if (builtDiagnostics.status === "invalid") {
    currentState = {
      ...base,
      stability: "invalid",
      actionAuthority: "none",
      context: unknownContext(rawState, `Normalization failed for observed state ${base.sourceStateType}`),
      surface: unsupportedSurface(rawState, "malformed_known_state", "A required field or action-relevant schema contract was invalid")
    };
  }

  const rawStateForIdentity = Object.keys(inspectionRaw).length > 0
    ? { ...rawState, bridge_v2_inspections: bridgeV2InspectionIdentity(inspectionRaw) }
    : rawState;
  return {
    envelopeSchemaVersion: 2,
    capturedAt,
    source,
    rawState,
    currentState,
    diagnostics: builtDiagnostics,
    stateHash: stateHash(rawStateForIdentity),
    normalizedStateHash: stateHash(currentState)
  };
}

function buildBase(
  raw: JsonObject,
  sourceStateType: string,
  diagnostics: DiagnosticsBuilder
): Omit<NormalizedStateBase, "stability" | "actionAuthority"> {
  const run = parseRun(objectField(raw, "run"));
  const player = parsePlayer(objectField(raw, "player"), diagnostics);
  return {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType,
    ...(run ? { run } : {}),
    ...(player ? { player } : {})
  };
}

function normalizeContext(raw: JsonObject, sourceStateType: string, diagnostics: DiagnosticsBuilder): SemanticContext {
  // Overlay precedence belongs to normalizeSurface. Context precedence is evidence-led: post-combat shell, battle,
  // explicit payloads, then state_type. This prevents a reusable surface from erasing its underlying context.
  const lower = sourceStateType.toLowerCase();
  const battle = objectField(raw, "battle");
  const message = optionalString(raw.message);
  if (isObservedPostCombatTransition(lower, message, battle)) return { kind: "post_combat" };
  if (battle || COMBAT_STATE_TOKENS.some((token) => lower.includes(token))) return normalizeCombatContext(raw, battle, lower, diagnostics);
  if (objectField(raw, "card_reward") || objectField(raw, "cardReward") || lower.includes("card_reward")) return { kind: "card_reward" };
  if (objectField(raw, "rewards") || lower.includes("reward")) return { kind: "rewards" };
  if (objectField(raw, "map") || lower === "map") return normalizeMapContext(objectField(raw, "map"), diagnostics);
  if (objectField(raw, "rest_site") || objectField(raw, "restSite") || lower.includes("rest")) return { kind: "rest" };
  if (objectField(raw, "event") || lower.includes("event")) return normalizeEventContext(objectField(raw, "event"), diagnostics);
  if (objectField(raw, "shop") || lower.includes("shop")) return { kind: "shop" };
  if (objectField(raw, "treasure") || lower.includes("treasure")) return { kind: "treasure" };
  if (objectField(raw, "crystal_sphere") || objectField(raw, "crystalSphere") || lower.includes("crystal_sphere")) return { kind: "crystal_sphere" };
  if (objectField(raw, "game_over") || objectField(raw, "gameOver") || lower.includes("game_over")) {
    return { kind: "run_ended", ...(optionalString(objectField(raw, "game_over")?.message ?? objectField(raw, "gameOver")?.message) ? { message: optionalString(objectField(raw, "game_over")?.message ?? objectField(raw, "gameOver")?.message) } : {}) };
  }
  if (lower.includes("menu")) return {
    kind: "menu",
    ...(optionalString(raw.menu_screen ?? raw.menuScreen) ? { screen: optionalString(raw.menu_screen ?? raw.menuScreen) } : {}),
    ...(optionalString(raw.message) ? { message: optionalString(raw.message) } : {})
  };
  if (/loading|transition|settling|starting/u.test(lower)) return unknownContext(raw, `Transient state_type ${sourceStateType} has no semantic context`);
  diagnostics.warn(`Unsupported semantic context for state_type: ${sourceStateType}`);
  return unknownContext(raw, `Unsupported state_type: ${sourceStateType}`);
}

function normalizeCombatContext(raw: JsonObject, battle: JsonObject | undefined, lower: string, diagnostics: DiagnosticsBuilder): SemanticContext {
  if (!battle) {
    diagnostics.missing("battle");
    return unknownContext(raw, "Combat state did not include battle data");
  }
  reportUnknownKeys(battle, "battle", new Set(["round", "turn", "is_play_phase", "isPlayPhase", "enemies"]), diagnostics);
  const isPlayPhase = requiredObservedBoolean(battle.is_play_phase ?? battle.isPlayPhase, "battle.is_play_phase", diagnostics);
  const turn = optionalString(battle.turn)?.toLowerCase();
  return {
    kind: "combat",
    encounterType: lower.includes("boss") ? "boss" : lower.includes("elite") ? "elite" : lower.includes("monster") ? "normal" : "unknown",
    ...(optionalNumber(battle.round) !== undefined ? { round: optionalNumber(battle.round) } : {}),
    turnOwner: turn === "player" ? "player" : turn === "enemy" ? "enemy" : "unknown",
    isPlayPhase,
    enemies: parseEnemies(battle.enemies, diagnostics)
  };
}

function normalizeMapContext(map: JsonObject | undefined, diagnostics: DiagnosticsBuilder): SemanticContext {
  if (!map) diagnostics.missing("map");
  reportUnknownKeys(map ?? {}, "map", new Set(["current_position", "currentPosition", "visited", "nodes", "next_options", "nextOptions", "available_nodes"]), diagnostics);
  return {
    kind: "map",
    ...(parseCoordinate(map?.current_position ?? map?.currentPosition) ? { currentPosition: parseCoordinate(map?.current_position ?? map?.currentPosition) } : {}),
    visited: parseMapNodes(map?.visited),
    nodes: parseMapNodes(map?.nodes)
  };
}

function normalizeEventContext(event: JsonObject | undefined, diagnostics: DiagnosticsBuilder): SemanticContext {
  if (!event) diagnostics.missing("event");
  reportUnknownKeys(event ?? {}, "event", new Set(["event_id", "eventId", "event_name", "eventName", "name", "is_ancient", "isAncient", "in_dialogue", "inDialogue", "body", "options"]), diagnostics);
  return {
    kind: "event",
    ...(optionalString(event?.event_id ?? event?.eventId) ? { eventId: optionalString(event?.event_id ?? event?.eventId) } : {}),
    ...(optionalString(event?.event_name ?? event?.eventName ?? event?.name) ? { name: optionalString(event?.event_name ?? event?.eventName ?? event?.name) } : {}),
    ...(optionalBoolean(event?.is_ancient ?? event?.isAncient) !== undefined ? { ancient: optionalBoolean(event?.is_ancient ?? event?.isAncient) } : {}),
    ...(optionalBoolean(event?.in_dialogue ?? event?.inDialogue) !== undefined ? { inDialogue: optionalBoolean(event?.in_dialogue ?? event?.inDialogue) } : {}),
    ...(event?.body === null ? { body: null } : optionalString(event?.body) ? { body: optionalString(event?.body) } : {})
  };
}

function normalizeSurface(raw: JsonObject, context: SemanticContext, diagnostics: DiagnosticsBuilder): InteractionSurface {
  const lower = optionalString(raw.state_type ?? raw.stateType)?.toLowerCase() ?? "unknown";
  const handSelection = objectField(raw, "hand_select") ?? objectField(raw, "handSelect");
  if (handSelection) return normalizeCardSelection(handSelection, "combat", diagnostics);
  const cardSelection = objectField(raw, "card_select") ?? objectField(raw, "cardSelect");
  if (cardSelection) return normalizeCardSelection(cardSelection, "standard", diagnostics);
  if (objectField(raw, "bundle_select") || objectField(raw, "bundleSelect")) {
    diagnostics.warn("bundle_select has no verified interaction protocol and is intentionally unsupported");
    return unsupportedSurface(raw, "unknown_surface", "bundle_select is not yet verified by an observed raw-state fixture");
  }
  if (context.kind === "post_combat" || /loading|transition|settling|starting/u.test(lower)) {
    return { kind: "no_action", reason: context.kind === "post_combat" ? "transitioning" : lower.includes("loading") ? "loading" : "transitioning", ...(optionalString(raw.message) ? { message: optionalString(raw.message) } : {}), observedTopLevelKeys: Object.keys(raw).sort() };
  }
  switch (context.kind) {
    case "combat":
      if (context.turnOwner === "enemy") return { kind: "no_action", reason: "settling" };
      if (!context.isPlayPhase) return { kind: "no_action", reason: "non_actionable" };
      if (!objectField(raw, "player")) diagnostics.missing("player");
      return { kind: "combat_turn" };
    case "card_reward": return normalizeCardRewardSurface(objectField(raw, "card_reward") ?? objectField(raw, "cardReward"), diagnostics);
    case "rewards": return normalizeRewardClaimSurface(objectField(raw, "rewards"), diagnostics);
    case "map": return { kind: "map_navigation", nextOptions: parseMapNodes(objectField(raw, "map")?.next_options ?? objectField(raw, "map")?.nextOptions ?? objectField(raw, "map")?.available_nodes) };
    case "rest": return normalizeOptionChoiceSurface(objectField(raw, "rest_site") ?? objectField(raw, "restSite"), "rest", diagnostics);
    case "event": return normalizeOptionChoiceSurface(objectField(raw, "event"), "event", diagnostics);
    case "shop": return normalizeShopSurface(objectField(raw, "shop"), diagnostics);
    case "treasure": return normalizeTreasureSurface(objectField(raw, "treasure"), diagnostics);
    case "crystal_sphere": return normalizeGridSurface(objectField(raw, "crystal_sphere") ?? objectField(raw, "crystalSphere"), diagnostics);
    case "menu": return normalizeMenuSurface(raw);
    case "run_ended": return normalizeGameOverSurface(objectField(raw, "game_over") ?? objectField(raw, "gameOver"));
    case "reward_flow":
      return unsupportedSurface(raw, "missing_action_protocol", "reward_flow is available only through the verified Bridge v2 contract");
    case "unknown":
      if (lower.includes("card_select")) return { kind: "card_selection", selectionMode: "standard", sourceType: lower, purpose: "unknown", options: [], previewShowing: false, previewCards: [], canConfirm: false, canCancel: false };
      return unsupportedSurface(raw, "unknown_context", context.reason);
  }
}

function normalizeCardSelection(selection: JsonObject, selectionMode: "combat" | "standard", diagnostics: DiagnosticsBuilder): InteractionSurface {
  const path = selectionMode === "combat" ? "hand_select" : "card_select";
  reportUnknownKeys(selection, path, new Set(["cards", "preview_showing", "previewShowing", "preview_cards", "previewCards", "can_confirm", "canConfirm", "can_cancel", "canCancel", "screen_type", "screenType", "mode", "prompt", "minimum_selections", "minimumSelections", "maximum_selections", "maximumSelections"]), diagnostics);
  const sourceType = optionalString(selection.screen_type ?? selection.screenType ?? selection.mode) ?? path;
  return {
    kind: "card_selection",
    selectionMode,
    sourceType,
    purpose: inferSelectionPurpose(sourceType, optionalString(selection.prompt)),
    ...(optionalString(selection.prompt) ? { prompt: optionalString(selection.prompt) } : {}),
    options: parseCards(selection.cards, `${path}.cards`, diagnostics, true),
    previewShowing: optionalBoolean(selection.preview_showing ?? selection.previewShowing) ?? false,
    previewCards: parseCards(selection.preview_cards ?? selection.previewCards, `${path}.preview_cards`, diagnostics, true),
    ...(optionalNumber(selection.minimum_selections ?? selection.minimumSelections) !== undefined ? { minimumSelections: optionalNumber(selection.minimum_selections ?? selection.minimumSelections) } : {}),
    ...(optionalNumber(selection.maximum_selections ?? selection.maximumSelections) !== undefined ? { maximumSelections: optionalNumber(selection.maximum_selections ?? selection.maximumSelections) } : {}),
    canConfirm: optionalBoolean(selection.can_confirm ?? selection.canConfirm) ?? false,
    canCancel: optionalBoolean(selection.can_cancel ?? selection.canCancel) ?? false
  };
}

function normalizeCardRewardSurface(cardReward: JsonObject | undefined, diagnostics: DiagnosticsBuilder): InteractionSurface {
  if (!cardReward) diagnostics.missing("card_reward");
  reportUnknownKeys(cardReward ?? {}, "card_reward", new Set(["cards", "can_skip", "canSkip", "can_proceed", "canProceed"]), diagnostics);
  return { kind: "card_reward", options: cardReward ? parseCards(cardReward.cards, "card_reward.cards", diagnostics, true) : [], canSkip: optionalBoolean(cardReward?.can_skip ?? cardReward?.canSkip) ?? false, canProceed: optionalBoolean(cardReward?.can_proceed ?? cardReward?.canProceed) ?? false };
}

function normalizeRewardClaimSurface(rewards: JsonObject | undefined, diagnostics: DiagnosticsBuilder): InteractionSurface {
  if (!rewards) diagnostics.missing("rewards");
  reportUnknownKeys(rewards ?? {}, "rewards", new Set(["items", "rewards", "can_proceed", "canProceed"]), diagnostics);
  return { kind: "reward_claim", items: rewards ? parseRewards(rewards.items ?? rewards.rewards) : [], canProceed: optionalBoolean(rewards?.can_proceed ?? rewards?.canProceed) ?? false };
}

function normalizeOptionChoiceSurface(value: JsonObject | undefined, protocol: "event" | "rest", diagnostics: DiagnosticsBuilder): InteractionSurface {
  if (!value) diagnostics.missing(protocol === "event" ? "event" : "rest_site");
  // Events use an explicit indexed proceed option in the verified protocol. Only rest-site proceed has a separately verified flag.
  return { kind: "option_choice", protocol, options: parseIndexedOptions(value?.options), canProceed: protocol === "rest" && (optionalBoolean(value?.can_proceed ?? value?.canProceed) ?? false) };
}

function normalizeShopSurface(shop: JsonObject | undefined, diagnostics: DiagnosticsBuilder): InteractionSurface {
  if (!shop) diagnostics.missing("shop");
  reportUnknownKeys(shop ?? {}, "shop", new Set(["items", "can_proceed", "canProceed"]), diagnostics);
  diagnostics.infer("surface.shop_interaction.canLeave", ["state_type", "shop.can_proceed"], "verified STS2MCP shop protocol exposes proceed to leave");
  return { kind: "shop_interaction", items: parseShopItems(shop?.items), canLeave: Boolean(shop) };
}

function normalizeTreasureSurface(treasure: JsonObject | undefined, diagnostics: DiagnosticsBuilder): InteractionSurface {
  if (!treasure) diagnostics.missing("treasure");
  const relics = objectArray(treasure ?? {}, "relics").map((relic, position) => ({ index: optionalNumber(relic.index) ?? position, ...(optionalString(relic.id) ? { id: optionalString(relic.id) } : {}), ...(optionalString(relic.name) ? { name: optionalString(relic.name) } : {}), ...(optionalString(relic.description) ? { description: optionalString(relic.description) } : {}) }));
  return { kind: "treasure_claim", relics, ...(optionalBoolean(treasure?.opened) !== undefined ? { opened: optionalBoolean(treasure?.opened) } : {}), canProceed: optionalBoolean(treasure?.can_proceed ?? treasure?.canProceed) ?? false };
}

function normalizeGridSurface(sphere: JsonObject | undefined, diagnostics: DiagnosticsBuilder): InteractionSurface {
  if (!sphere) diagnostics.missing("crystal_sphere");
  const width = optionalNumber(sphere?.grid_width ?? sphere?.gridWidth);
  const height = optionalNumber(sphere?.grid_height ?? sphere?.gridHeight);
  if (width === undefined) diagnostics.missing("crystal_sphere.grid_width");
  if (height === undefined) diagnostics.missing("crystal_sphere.grid_height");
  const selected = optionalString(sphere?.tool)?.toLowerCase();
  return { kind: "grid_interaction", width: width ?? 0, height: height ?? 0, selectedTool: selected === "big" || selected === "small" ? selected : "unknown", canUseBigTool: optionalBoolean(sphere?.can_use_big_tool ?? sphere?.canUseBigTool) ?? false, canUseSmallTool: optionalBoolean(sphere?.can_use_small_tool ?? sphere?.canUseSmallTool) ?? false, clickableCells: parseCells(sphere?.clickable_cells ?? sphere?.clickableCells), revealedItems: parseRevealedItems(sphere?.revealed_items ?? sphere?.revealedItems), ...(optionalString(sphere?.divinations_left_text ?? sphere?.divinationsLeftText) ? { divinationsRemainingText: optionalString(sphere?.divinations_left_text ?? sphere?.divinationsLeftText) } : {}), canProceed: optionalBoolean(sphere?.can_proceed ?? sphere?.canProceed) ?? false };
}

function normalizeMenuSurface(raw: JsonObject): InteractionSurface {
  const options = Array.isArray(raw.options) ? raw.options.flatMap((option, position) => {
    if (typeof option === "string" || typeof option === "number") return [{ index: position, value: option, label: String(option), enabled: true }];
    if (!isJsonObject(option)) return [];
    const value = option.value ?? option.id ?? option.name ?? option.option ?? position;
    return typeof value === "string" || typeof value === "number" ? [{ index: position, value, label: optionalString(option.label ?? option.name ?? option.title) ?? String(value), enabled: !(option.enabled === false || option.disabled === true) }] : [];
  }) : [];
  return { kind: "menu_choice", options };
}

function normalizeGameOverSurface(gameOver: JsonObject | undefined): InteractionSurface {
  const options = Array.isArray(gameOver?.options) ? gameOver.options.flatMap((option, position) => typeof option === "string" || typeof option === "number" ? [{ index: position, value: option, label: String(option), enabled: true }] : []) : [];
  return { kind: "menu_choice", options };
}

function unsupportedSurface(raw: JsonObject, classification: Extract<InteractionSurface, { kind: "unsupported" }>["classification"], reason: string): InteractionSurface {
  return { kind: "unsupported", classification, reason, observedTopLevelKeys: Object.keys(raw).sort() };
}

function unknownContext(raw: JsonObject, reason: string): SemanticContext {
  return { kind: "unknown", reason, observedTopLevelKeys: Object.keys(raw).sort() };
}

function determineStability(surface: InteractionSurface, diagnosticsStatus: "ok" | "degraded" | "invalid"): StateStability {
  if (diagnosticsStatus === "invalid") return "invalid";
  if (surface.kind === "unsupported") return "unknown";
  if (surface.kind === "no_action") return surface.reason;
  if (surface.kind === "combat_turn") return "actionable";
  if (surface.kind === "card_selection") return surface.options.length > 0 || surface.canConfirm || surface.canCancel ? "actionable" : "loading";
  if (surface.kind === "deck_enchant_selection") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "deck_removal_selection") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "deck_upgrade_selection") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "combat_pile_card_selection") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "combat_hand_card_selection") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "event_card_acquisition") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "generated_card_choice") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "card_bundle_selection") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "card_reward_selection") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "card_reward") return surface.options.length > 0 || surface.canSkip || surface.canProceed ? "actionable" : "loading";
  if (surface.kind === "reward_claim") {
    if ("legalActions" in surface) return surface.legalActions.length > 0 ? "actionable" : "loading";
    return surface.items.length > 0 || surface.canProceed ? "actionable" : "loading";
  }
  if (surface.kind === "map_navigation") return surface.nextOptions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "event_dialogue") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "event_option") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "rest_site") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "shop_inventory" || surface.kind === "shop_room") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "treasure_room") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "game_over") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "character_select") return surface.legalActions.length > 0 ? "actionable" : "loading";
  if (surface.kind === "option_choice") return surface.options.some((option) => option.enabled) || surface.canProceed ? "actionable" : "loading";
  if (surface.kind === "shop_interaction") return "actionable";
  if (surface.kind === "treasure_claim") return surface.relics.length > 0 || surface.canProceed ? "actionable" : "loading";
  if (surface.kind === "grid_interaction") return surface.canProceed || surface.clickableCells.length > 0 || surface.canUseBigTool || surface.canUseSmallTool ? "actionable" : "loading";
  return surface.options.some((option) => option.enabled) ? "actionable" : "non_actionable";
}

function isCompatible(context: SemanticContext, surface: InteractionSurface): boolean {
  const allowed: Record<SemanticContext["kind"], readonly InteractionSurface["kind"][]> = {
    combat: ["combat_turn", "combat_pile_card_selection", "combat_hand_card_selection", "generated_card_choice", "card_selection", "no_action", "unsupported"],
    reward_flow: ["card_reward_selection", "reward_claim", "no_action", "unsupported"],
    card_reward: ["card_reward", "card_selection", "no_action", "unsupported"],
    rewards: ["reward_claim", "card_selection", "no_action", "unsupported"],
    map: ["map_navigation", "no_action", "unsupported"],
    rest: ["rest_site", "option_choice", "card_selection", "deck_upgrade_selection", "no_action", "unsupported"],
    event: ["event_dialogue", "event_option", "event_card_acquisition", "option_choice", "card_selection", "deck_upgrade_selection", "card_bundle_selection", "no_action", "unsupported"],
    shop: ["shop_inventory", "shop_room", "shop_interaction", "no_action", "unsupported"],
    treasure: ["treasure_room", "treasure_claim", "no_action", "unsupported"],
    crystal_sphere: ["grid_interaction", "no_action", "unsupported"],
    menu: ["character_select", "menu_choice", "no_action", "unsupported"],
    run_ended: ["game_over", "menu_choice", "no_action", "unsupported"],
    post_combat: ["no_action", "unsupported"],
    unknown: ["card_selection", "card_bundle_selection", "no_action", "unsupported"]
  };
  if (!allowed[context.kind].includes(surface.kind)) return false;
  if (surface.kind === "option_choice") return surface.protocol === context.kind;
  return true;
}

function isObservedPostCombatTransition(sourceStateType: string, message: string | undefined, battle: JsonObject | undefined): boolean {
  return !battle && COMBAT_STATE_TOKENS.some((token) => sourceStateType.includes(token)) && /combat ended\.\s*waiting for rewards/i.test(message ?? "");
}

function reportUnknownKeys(object: JsonObject, path: string, known: ReadonlySet<string>, diagnostics: DiagnosticsBuilder): void {
  for (const key of Object.keys(object)) {
    if (known.has(key)) continue;
    const fieldPath = path === "$" ? key : `${path}.${key}`;
    diagnostics.unknown(fieldPath);
    if (/(action|target|selection|confirm|cancel|option|playable|protocol)/iu.test(key)) {
      diagnostics.invalid(fieldPath, object[key], "unknown potentially action-relevant field requires an explicit protocol decision");
    }
  }
}

function parseRun(raw: JsonObject | undefined): RunSnapshot | undefined {
  if (!raw) return undefined;
  return { ...(optionalString(raw.run_id ?? raw.runId) ? { runId: optionalString(raw.run_id ?? raw.runId) } : {}), ...(optionalString(raw.character_id ?? raw.characterId) ? { characterId: optionalString(raw.character_id ?? raw.characterId) } : {}), ...(optionalNumber(raw.act) !== undefined ? { act: optionalNumber(raw.act) } : {}), ...(optionalNumber(raw.floor) !== undefined ? { floor: optionalNumber(raw.floor) } : {}), ...(optionalNumber(raw.ascension) !== undefined ? { ascension: optionalNumber(raw.ascension) } : {}), ...(optionalString(raw.seed) ? { seed: optionalString(raw.seed) } : {}) };
}

function parseCoordinate(value: JsonValue | undefined): { col: number; row: number; type?: string } | undefined {
  if (!isJsonObject(value)) return undefined;
  const col = optionalNumber(value.col); const row = optionalNumber(value.row);
  return col === undefined || row === undefined ? undefined : { col, row, ...(optionalString(value.type) ? { type: optionalString(value.type) } : {}) };
}

function parseCells(value: JsonValue | undefined): Array<{ x: number; y: number }> {
  return Array.isArray(value) ? value.filter(isJsonObject).flatMap((cell) => { const x = optionalNumber(cell.x); const y = optionalNumber(cell.y); return x === undefined || y === undefined ? [] : [{ x, y }]; }) : [];
}

function parseRevealedItems(value: JsonValue | undefined): Array<{ itemType?: string; x: number; y: number; width?: number; height?: number; good?: boolean }> {
  return Array.isArray(value) ? value.filter(isJsonObject).flatMap((item) => { const x = optionalNumber(item.x); const y = optionalNumber(item.y); if (x === undefined || y === undefined) return []; return [{ ...(optionalString(item.item_type ?? item.itemType) ? { itemType: optionalString(item.item_type ?? item.itemType) } : {}), x, y, ...(optionalNumber(item.width) !== undefined ? { width: optionalNumber(item.width) } : {}), ...(optionalNumber(item.height) !== undefined ? { height: optionalNumber(item.height) } : {}), ...(optionalBoolean(item.is_good ?? item.good) !== undefined ? { good: optionalBoolean(item.is_good ?? item.good) } : {}) }]; }) : [];
}

function inferSelectionPurpose(sourceType: string, prompt: string | undefined): "combat_effect" | "reward" | "upgrade" | "remove" | "transform" | "duplicate" | "unknown" {
  const text = `${sourceType} ${prompt ?? ""}`.toLowerCase();
  if (/upgrade|smith/.test(text)) return "upgrade";
  if (/remove|purge/.test(text)) return "remove";
  if (/transform/.test(text)) return "transform";
  if (/duplicate|copy/.test(text)) return "duplicate";
  if (/reward/.test(text)) return "reward";
  if (/hand|combat|replace|discard/.test(text)) return "combat_effect";
  return "unknown";
}

function requiredObservedBoolean(value: JsonValue | undefined, path: string, diagnostics: DiagnosticsBuilder): boolean {
  if (typeof value === "boolean") return value;
  value === undefined || value === null ? diagnostics.missing(path) : diagnostics.invalid(path, value, "expected a boolean");
  return false;
}
