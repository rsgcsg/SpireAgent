import type { AdapterDescriptor } from "../game-io/adapter.js";
import {
  NORMALIZED_STATE_SCHEMA_VERSION,
  type CurrentStateBase,
  type NormalizedCurrentState,
  type RunSnapshot,
  type StateEnvelope
} from "../domain/state/index.js";
import { isJsonObject, type JsonObject, type JsonValue } from "../shared/json.js";
import { stateHash } from "../runtime/stateHash.js";
import { DiagnosticsBuilder } from "./diagnostics.js";
import {
  objectArray,
  objectField,
  optionalBoolean,
  optionalNumber,
  optionalString,
  parseCard,
  parseCards,
  parseEnemies,
  parseIndexedOptions,
  parseMapNodes,
  parsePlayer,
  parseRewards,
  parseShopItems
} from "./parsers.js";

const KNOWN_TOP_LEVEL_KEYS = new Set([
  "state_type",
  "stateType",
  "run",
  "player",
  "battle",
  "card_reward",
  "cardReward",
  "rewards",
  "map",
  "rest_site",
  "restSite",
  "event",
  "shop",
  "treasure",
  "card_select",
  "cardSelect",
  "hand_select",
  "handSelect",
  "bundle_select",
  "bundleSelect",
  "crystal_sphere",
  "crystalSphere",
  "game_over",
  "gameOver",
  "menu_screen",
  "menuScreen",
  "message",
  "options",
  "characters"
]);

export function normalizeCurrentState(rawInput: unknown, source: AdapterDescriptor, capturedAt = new Date().toISOString()): StateEnvelope {
  const diagnostics = new DiagnosticsBuilder();
  const rawState = isJsonObject(rawInput) ? rawInput : {};
  if (!isJsonObject(rawInput)) diagnostics.invalid("$", rawInput, "MCP state must be a JSON object");

  for (const key of Object.keys(rawState)) {
    if (!KNOWN_TOP_LEVEL_KEYS.has(key)) diagnostics.unknown(key);
  }

  const sourceStateType = optionalString(rawState.state_type ?? rawState.stateType);
  if (!sourceStateType) diagnostics.missing("state_type");
  const common = buildCommon(rawState, sourceStateType ?? "unknown", diagnostics);
  let currentState = normalizeSurface(rawState, common, diagnostics);
  const builtDiagnostics = diagnostics.build();

  if (builtDiagnostics.status === "invalid" && currentState.kind !== "unknown") {
    currentState = {
      ...common,
      kind: "unknown",
      stability: "invalid",
      unknown: {
        reason: `Normalization failed for observed state ${common.sourceStateType}`,
        observedTopLevelKeys: Object.keys(rawState).sort()
      }
    };
  }

  return {
    envelopeSchemaVersion: 1,
    capturedAt,
    source,
    rawState,
    currentState,
    diagnostics: builtDiagnostics,
    stateHash: stateHash(rawState),
    normalizedStateHash: stateHash(currentState)
  };
}

function buildCommon(raw: JsonObject, sourceStateType: string, diagnostics: DiagnosticsBuilder): CurrentStateBase {
  const run = parseRun(objectField(raw, "run"));
  const player = parsePlayer(objectField(raw, "player"), diagnostics);
  return {
    normalizedSchemaVersion: NORMALIZED_STATE_SCHEMA_VERSION,
    sourceStateType,
    stability: "unknown",
    ...(run ? { run } : {}),
    ...(player ? { player } : {})
  };
}

function normalizeSurface(raw: JsonObject, common: CurrentStateBase, diagnostics: DiagnosticsBuilder): NormalizedCurrentState {
  const lower = common.sourceStateType.toLowerCase();

  const handSelection = objectField(raw, "hand_select") ?? objectField(raw, "handSelect");
  if (handSelection) return normalizeCardSelection(common, handSelection, "combat", diagnostics);
  const cardSelection = objectField(raw, "card_select") ?? objectField(raw, "cardSelect");
  if (cardSelection) return normalizeCardSelection(common, cardSelection, "standard", diagnostics);

  if (objectField(raw, "bundle_select") || objectField(raw, "bundleSelect")) {
    diagnostics.warn("bundle_select has no verified raw fixture in RE-P1 and is intentionally unsupported");
    return unknownState(common, raw, "bundle_select is not yet verified by an observed raw-state fixture");
  }

  if (objectField(raw, "crystal_sphere") || objectField(raw, "crystalSphere") || lower.includes("crystal_sphere")) {
    return normalizeCrystalSphere(common, objectField(raw, "crystal_sphere") ?? objectField(raw, "crystalSphere"), diagnostics);
  }
  if (["monster", "boss", "combat", "battle"].some((token) => lower.includes(token))) {
    return normalizeCombat(common, objectField(raw, "battle"), diagnostics);
  }
  if (lower.includes("card_reward") || objectField(raw, "card_reward") || objectField(raw, "cardReward")) {
    return normalizeCardReward(common, objectField(raw, "card_reward") ?? objectField(raw, "cardReward"), diagnostics);
  }
  if (lower.includes("reward")) return normalizeRewards(common, objectField(raw, "rewards"), diagnostics);
  if (lower === "map" || objectField(raw, "map")) return normalizeMap(common, objectField(raw, "map"), diagnostics);
  if (lower.includes("rest")) return normalizeRest(common, objectField(raw, "rest_site") ?? objectField(raw, "restSite"), diagnostics);
  if (lower.includes("event")) return normalizeEvent(common, objectField(raw, "event"), diagnostics);
  if (lower.includes("shop")) return normalizeShop(common, objectField(raw, "shop"), diagnostics);
  if (lower.includes("treasure")) return normalizeTreasure(common, objectField(raw, "treasure"), diagnostics);
  if (lower.includes("game_over")) return normalizeGameOver(common, objectField(raw, "game_over") ?? objectField(raw, "gameOver"));
  if (lower.includes("menu")) return normalizeMenu(common, raw);
  if (/loading|transition|settling|starting/u.test(lower)) {
    return {
      ...common,
      kind: "transition",
      stability: lower.includes("loading") ? "loading" : "transitioning",
      transition: {
        ...(optionalString(raw.message) ? { message: optionalString(raw.message) } : {}),
        observedTopLevelKeys: Object.keys(raw).sort()
      }
    };
  }

  diagnostics.warn(`Unsupported state_type: ${common.sourceStateType}`);
  return unknownState(common, raw, `Unsupported state_type: ${common.sourceStateType}`);
}

function normalizeCombat(common: CurrentStateBase, battle: JsonObject | undefined, diagnostics: DiagnosticsBuilder): NormalizedCurrentState {
  if (!common.player) diagnostics.missing("player");
  if (!battle) diagnostics.missing("battle");
  const isPlayPhase = battle ? requiredObservedBoolean(battle.is_play_phase ?? battle.isPlayPhase, "battle.is_play_phase", diagnostics) : false;
  const turn = optionalString(battle?.turn)?.toLowerCase();
  const enemies = battle ? parseEnemies(battle.enemies, diagnostics) : [];
  if (common.player?.hand.some((card) => card.canPlay === undefined)) {
    diagnostics.warn("Some combat hand cards omit can_play; those cards will not become allowed actions");
  }
  return {
    ...common,
    kind: "combat",
    stability: isPlayPhase && turn !== "enemy" ? "actionable" : turn === "enemy" ? "settling" : "non_actionable",
    player: common.player ?? emptyPlayer(),
    combat: {
      ...(optionalNumber(battle?.round) !== undefined ? { round: optionalNumber(battle?.round) } : {}),
      turnOwner: turn === "player" ? "player" : turn === "enemy" ? "enemy" : "unknown",
      isPlayPhase,
      enemies
    }
  };
}

function normalizeCardReward(
  common: CurrentStateBase,
  cardReward: JsonObject | undefined,
  diagnostics: DiagnosticsBuilder
): NormalizedCurrentState {
  if (!cardReward) diagnostics.missing("card_reward");
  const cards = cardReward ? parseCards(cardReward.cards, "card_reward.cards", diagnostics, true) : [];
  const canSkip = optionalBoolean(cardReward?.can_skip ?? cardReward?.canSkip) ?? false;
  const canProceed = optionalBoolean(cardReward?.can_proceed ?? cardReward?.canProceed) ?? false;
  return {
    ...common,
    kind: "card_reward",
    stability: cards.length > 0 || canSkip || canProceed ? "actionable" : "loading",
    cardReward: { options: cards, canSkip, canProceed }
  };
}

function normalizeRewards(common: CurrentStateBase, rewards: JsonObject | undefined, diagnostics: DiagnosticsBuilder): NormalizedCurrentState {
  if (!rewards) diagnostics.missing("rewards");
  const items = rewards ? parseRewards(rewards.items ?? rewards.rewards) : [];
  const canProceed = optionalBoolean(rewards?.can_proceed ?? rewards?.canProceed) ?? false;
  return {
    ...common,
    kind: "rewards",
    stability: items.length > 0 || canProceed ? "actionable" : "loading",
    rewards: { items, canProceed }
  };
}

function normalizeCardSelection(
  common: CurrentStateBase,
  selection: JsonObject,
  protocol: "combat" | "standard",
  diagnostics: DiagnosticsBuilder
): NormalizedCurrentState {
  const options = parseCards(selection.cards, `${protocol === "combat" ? "hand_select" : "card_select"}.cards`, diagnostics, true);
  const canConfirm = optionalBoolean(selection.can_confirm ?? selection.canConfirm) ?? false;
  const canCancel = optionalBoolean(selection.can_cancel ?? selection.canCancel) ?? false;
  const sourceType = optionalString(selection.screen_type ?? selection.screenType ?? selection.mode) ?? common.sourceStateType;
  return {
    ...common,
    kind: "card_selection",
    stability: options.length > 0 || canConfirm || canCancel ? "actionable" : "loading",
    cardSelection: {
      sourceType,
      purpose: inferSelectionPurpose(sourceType, optionalString(selection.prompt)),
      actionProtocol: protocol,
      ...(optionalString(selection.prompt) ? { prompt: optionalString(selection.prompt) } : {}),
      options,
      ...(optionalNumber(selection.minimum_selections ?? selection.minimumSelections) !== undefined
        ? { minimumSelections: optionalNumber(selection.minimum_selections ?? selection.minimumSelections) }
        : {}),
      ...(optionalNumber(selection.maximum_selections ?? selection.maximumSelections) !== undefined
        ? { maximumSelections: optionalNumber(selection.maximum_selections ?? selection.maximumSelections) }
        : {}),
      canConfirm,
      canCancel
    }
  };
}

function normalizeMap(common: CurrentStateBase, map: JsonObject | undefined, diagnostics: DiagnosticsBuilder): NormalizedCurrentState {
  if (!map) diagnostics.missing("map");
  const nextOptions = parseMapNodes(map?.next_options ?? map?.nextOptions ?? map?.available_nodes);
  const current = map ? parseCoordinate(map.current_position ?? map.currentPosition) : undefined;
  return {
    ...common,
    kind: "map",
    stability: nextOptions.length > 0 ? "actionable" : "loading",
    map: {
      ...(current ? { currentPosition: current } : {}),
      visited: parseMapNodes(map?.visited),
      nextOptions,
      nodes: parseMapNodes(map?.nodes)
    }
  };
}

function normalizeRest(common: CurrentStateBase, rest: JsonObject | undefined, diagnostics: DiagnosticsBuilder): NormalizedCurrentState {
  if (!rest) diagnostics.missing("rest_site");
  const options = parseIndexedOptions(rest?.options);
  const canProceed = optionalBoolean(rest?.can_proceed ?? rest?.canProceed) ?? false;
  return {
    ...common,
    kind: "rest",
    stability: options.some((option) => option.enabled) || canProceed ? "actionable" : "loading",
    rest: { options, canProceed }
  };
}

function normalizeEvent(common: CurrentStateBase, event: JsonObject | undefined, diagnostics: DiagnosticsBuilder): NormalizedCurrentState {
  if (!event) diagnostics.missing("event");
  const options = parseIndexedOptions(event?.options);
  return {
    ...common,
    kind: "event",
    stability: options.some((option) => option.enabled) ? "actionable" : "loading",
    event: {
      ...(optionalString(event?.event_id ?? event?.eventId) ? { eventId: optionalString(event?.event_id ?? event?.eventId) } : {}),
      ...(optionalString(event?.event_name ?? event?.eventName ?? event?.name)
        ? { name: optionalString(event?.event_name ?? event?.eventName ?? event?.name) }
        : {}),
      ...(optionalBoolean(event?.is_ancient ?? event?.isAncient) !== undefined
        ? { ancient: optionalBoolean(event?.is_ancient ?? event?.isAncient) }
        : {}),
      ...(optionalBoolean(event?.in_dialogue ?? event?.inDialogue) !== undefined
        ? { inDialogue: optionalBoolean(event?.in_dialogue ?? event?.inDialogue) }
        : {}),
      ...(event?.body === null ? { body: null } : optionalString(event?.body) ? { body: optionalString(event?.body) } : {}),
      options
    }
  };
}

function normalizeShop(common: CurrentStateBase, shop: JsonObject | undefined, diagnostics: DiagnosticsBuilder): NormalizedCurrentState {
  if (!shop) diagnostics.missing("shop");
  const items = parseShopItems(shop?.items);
  // STS2MCP exposes leaving a shop through `proceed`; legacy live evidence confirms it even when can_proceed is false.
  diagnostics.infer("shop.canLeave", ["state_type", "shop.can_proceed"], "verified STS2MCP shop protocol always exposes proceed to leave");
  return {
    ...common,
    kind: "shop",
    stability: shop ? "actionable" : "loading",
    shop: { items, canLeave: Boolean(shop) }
  };
}

function normalizeTreasure(common: CurrentStateBase, treasure: JsonObject | undefined, diagnostics: DiagnosticsBuilder): NormalizedCurrentState {
  if (!treasure) diagnostics.missing("treasure");
  const relics = objectArray(treasure ?? {}, "relics").map((relic, position) => ({
    index: optionalNumber(relic.index) ?? position,
    ...(optionalString(relic.id) ? { id: optionalString(relic.id) } : {}),
    ...(optionalString(relic.name) ? { name: optionalString(relic.name) } : {}),
    ...(optionalString(relic.description) ? { description: optionalString(relic.description) } : {})
  }));
  const canProceed = optionalBoolean(treasure?.can_proceed ?? treasure?.canProceed) ?? false;
  return {
    ...common,
    kind: "treasure",
    stability: relics.length > 0 || canProceed ? "actionable" : "loading",
    treasure: {
      relics,
      ...(optionalBoolean(treasure?.opened) !== undefined ? { opened: optionalBoolean(treasure?.opened) } : {}),
      canProceed
    }
  };
}

function normalizeCrystalSphere(
  common: CurrentStateBase,
  sphere: JsonObject | undefined,
  diagnostics: DiagnosticsBuilder
): NormalizedCurrentState {
  if (!sphere) diagnostics.missing("crystal_sphere");
  const width = optionalNumber(sphere?.grid_width ?? sphere?.gridWidth);
  const height = optionalNumber(sphere?.grid_height ?? sphere?.gridHeight);
  if (width === undefined) diagnostics.missing("crystal_sphere.grid_width");
  if (height === undefined) diagnostics.missing("crystal_sphere.grid_height");
  const cells = parseCells(sphere?.clickable_cells ?? sphere?.clickableCells);
  const canProceed = optionalBoolean(sphere?.can_proceed ?? sphere?.canProceed) ?? false;
  const canUseBigTool = optionalBoolean(sphere?.can_use_big_tool ?? sphere?.canUseBigTool) ?? false;
  const canUseSmallTool = optionalBoolean(sphere?.can_use_small_tool ?? sphere?.canUseSmallTool) ?? false;
  const selected = optionalString(sphere?.tool)?.toLowerCase();
  return {
    ...common,
    kind: "crystal_sphere",
    stability: canProceed || cells.length > 0 || canUseBigTool || canUseSmallTool ? "actionable" : "loading",
    crystalSphere: {
      width: width ?? 0,
      height: height ?? 0,
      selectedTool: selected === "big" || selected === "small" ? selected : "unknown",
      canUseBigTool,
      canUseSmallTool,
      clickableCells: cells,
      revealedItems: parseRevealedItems(sphere?.revealed_items ?? sphere?.revealedItems),
      ...(optionalString(sphere?.divinations_left_text ?? sphere?.divinationsLeftText)
        ? { divinationsRemainingText: optionalString(sphere?.divinations_left_text ?? sphere?.divinationsLeftText) }
        : {}),
      canProceed
    }
  };
}

function normalizeMenu(common: CurrentStateBase, raw: JsonObject): NormalizedCurrentState {
  const options = Array.isArray(raw.options)
    ? raw.options.flatMap((option, position) => {
        if (typeof option === "string" || typeof option === "number") {
          return [{ index: position, value: option, label: String(option), enabled: true }];
        }
        if (!isJsonObject(option)) return [];
        const value = option.value ?? option.id ?? option.name ?? option.option ?? position;
        if (typeof value !== "string" && typeof value !== "number") return [];
        return [{
          index: position,
          value,
          label: optionalString(option.label ?? option.name ?? option.title) ?? String(value),
          enabled: !(option.enabled === false || option.disabled === true)
        }];
      })
    : [];
  return {
    ...common,
    kind: "menu",
    stability: options.some((option) => option.enabled) ? "actionable" : "non_actionable",
    menu: {
      ...(optionalString(raw.menu_screen ?? raw.menuScreen) ? { screen: optionalString(raw.menu_screen ?? raw.menuScreen) } : {}),
      ...(optionalString(raw.message) ? { message: optionalString(raw.message) } : {}),
      options
    }
  };
}

function normalizeGameOver(common: CurrentStateBase, gameOver: JsonObject | undefined): NormalizedCurrentState {
  const options = Array.isArray(gameOver?.options)
    ? gameOver.options.flatMap((option, position) =>
        typeof option === "string" || typeof option === "number"
          ? [{ index: position, value: option, label: String(option) }]
          : []
      )
    : [];
  return {
    ...common,
    kind: "game_over",
    stability: options.length > 0 ? "actionable" : "non_actionable",
    gameOver: {
      ...(optionalString(gameOver?.message) ? { message: optionalString(gameOver?.message) } : {}),
      options
    }
  };
}

function unknownState(common: CurrentStateBase, raw: JsonObject, reason: string): NormalizedCurrentState {
  return {
    ...common,
    kind: "unknown",
    stability: "unknown",
    unknown: { reason, observedTopLevelKeys: Object.keys(raw).sort() }
  };
}

function parseRun(raw: JsonObject | undefined): RunSnapshot | undefined {
  if (!raw) return undefined;
  return {
    ...(optionalString(raw.run_id ?? raw.runId) ? { runId: optionalString(raw.run_id ?? raw.runId) } : {}),
    ...(optionalString(raw.character_id ?? raw.characterId) ? { characterId: optionalString(raw.character_id ?? raw.characterId) } : {}),
    ...(optionalNumber(raw.act) !== undefined ? { act: optionalNumber(raw.act) } : {}),
    ...(optionalNumber(raw.floor) !== undefined ? { floor: optionalNumber(raw.floor) } : {}),
    ...(optionalNumber(raw.ascension) !== undefined ? { ascension: optionalNumber(raw.ascension) } : {}),
    ...(optionalString(raw.seed) ? { seed: optionalString(raw.seed) } : {})
  };
}

function parseCoordinate(value: JsonValue | undefined): { col: number; row: number; type?: string } | undefined {
  if (!isJsonObject(value)) return undefined;
  const col = optionalNumber(value.col);
  const row = optionalNumber(value.row);
  if (col === undefined || row === undefined) return undefined;
  const type = optionalString(value.type);
  return { col, row, ...(type ? { type } : {}) };
}

function parseCells(value: JsonValue | undefined): Array<{ x: number; y: number }> {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).flatMap((cell) => {
    const x = optionalNumber(cell.x);
    const y = optionalNumber(cell.y);
    return x === undefined || y === undefined ? [] : [{ x, y }];
  });
}

function parseRevealedItems(value: JsonValue | undefined): Array<{
  itemType?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  good?: boolean;
}> {
  if (!Array.isArray(value)) return [];
  return value.filter(isJsonObject).flatMap((item) => {
    const x = optionalNumber(item.x);
    const y = optionalNumber(item.y);
    if (x === undefined || y === undefined) return [];
    return [{
      ...(optionalString(item.item_type ?? item.itemType) ? { itemType: optionalString(item.item_type ?? item.itemType) } : {}),
      x,
      y,
      ...(optionalNumber(item.width) !== undefined ? { width: optionalNumber(item.width) } : {}),
      ...(optionalNumber(item.height) !== undefined ? { height: optionalNumber(item.height) } : {}),
      ...(optionalBoolean(item.is_good ?? item.good) !== undefined ? { good: optionalBoolean(item.is_good ?? item.good) } : {})
    }];
  });
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
  value === undefined || value === null
    ? diagnostics.missing(path)
    : diagnostics.invalid(path, value, "expected a boolean");
  return false;
}

function emptyPlayer(): NonNullable<CurrentStateBase["player"]> {
  return {
    character: "UNKNOWN",
    hp: 0,
    maxHp: 0,
    hand: [],
    drawPile: [],
    discardPile: [],
    exhaustPile: [],
    orbs: [],
    statuses: [],
    relics: [],
    potions: []
  };
}
