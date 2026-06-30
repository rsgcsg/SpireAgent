import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AgentAction, ScoredCandidate } from "./types.js";
import type { GameClient } from "./client.js";
import { toRestBody } from "./client.js";
import { getSts2McpRestCapabilities } from "../adapters/sts2mcp/capabilities.js";
import { AgentController } from "./controller.js";
import { AgentDecisionRecorder } from "./decisionRecorder.js";
import { buildExecutionCheckpoint } from "./checkpoint.js";
import { buildCollectedStateRecord } from "./collector.js";
import {
  assertGroundTruthInvariants,
  createDiffInferredTransitionSkeleton,
  createExecutorLoggedTransitionSkeleton,
  createSnapshotOnlyTransitionFromCollectedState,
  createSnapshotOnlyTransition
} from "../data/transitionSchema.js";
import { selectFallbackCandidate } from "./fallback.js";
import { NoopLlmDecider, validateLlmDecisionForCandidates, type LlmDecider } from "./llm.js";
import { MemoryManager } from "./memory.js";
import { cardDamage, normalizeGameState } from "./state.js";
import { generateCandidates } from "./candidates.js";
import { scoreCandidates } from "./scoring.js";
import { buildReplayTimeline, readReplayRun, readTransitionJsonl } from "../replay/reader.js";
import { evaluateRun } from "../eval/runner.js";

class FakeClient implements GameClient {
  executed: AgentAction[] = [];

  constructor(
    private readonly state: unknown = combatState(),
    private readonly postExecuteState?: unknown
  ) {}

  async getState(): Promise<unknown> {
    if (this.executed.length > 0 && this.postExecuteState) {
      return this.postExecuteState;
    }
    return this.state;
  }

  async execute(action: AgentAction): Promise<unknown> {
    this.executed.push(action);
    return { status: "ok" };
  }
}

class ActionsDisabledClient extends FakeClient {
  async execute(): Promise<unknown> {
    throw new Error("Game action failed: Player actions are currently disabled (turn may already be ending)");
  }
}

class StaleThenSettledClient implements GameClient {
  executed: AgentAction[] = [];
  private readsAfterExecute = 0;

  constructor(
    private readonly state: unknown,
    private readonly staleState: unknown,
    private readonly settledState: unknown
  ) {}

  async getState(): Promise<unknown> {
    if (this.executed.length === 0) return this.state;
    this.readsAfterExecute += 1;
    return this.readsAfterExecute === 1 ? this.staleState : this.settledState;
  }

  async execute(action: AgentAction): Promise<unknown> {
    this.executed.push(action);
    return { status: "ok" };
  }
}

class InvalidChoiceLlmDecider implements LlmDecider {
  isAvailable(): boolean {
    return true;
  }

  async decide(): Promise<{ candidateId: string; reason: string }> {
    return { candidateId: "missing-candidate", reason: "test invalid choice" };
  }
}

class InvalidShapeLlmDecider implements LlmDecider {
  isAvailable(): boolean {
    return true;
  }

  async decide(): Promise<any> {
    return { reason: "missing candidate id" };
  }
}

const capabilities = getSts2McpRestCapabilities();
assert.equal(capabilities.canReadState, true);
assert.equal(capabilities.canReadRawState, true);
assert.equal(capabilities.canReadScreen, true);
assert.equal(capabilities.canExecuteActions, true);
assert.equal(capabilities.canReadAgentActionResults, "partial");
assert.equal(capabilities.canListLegalActions, false);
assert.equal(capabilities.canReadEventLog, false);
assert.equal(capabilities.canReadHumanEvents, false);
assert.equal(capabilities.canProvideFactData, false);
assert.equal(capabilities.canProvideVersionedFacts, false);

const collectedRecord = buildCollectedStateRecord({
  rawStatePath: "memory/collected/snapshots/test.raw.json",
  runId: "run-test",
  tick: 1,
  source: "collector",
  state: normalizeGameState(combatState())
});
const snapshotTransition = createSnapshotOnlyTransitionFromCollectedState(collectedRecord);
assert.equal(snapshotTransition.captureMode, "snapshot_only");
assert.equal(snapshotTransition.isGroundTruth, false);
assert.equal(snapshotTransition.selectedAction, null);
assert.equal(snapshotTransition.preStateRef, collectedRecord.rawStatePath);
assert.deepEqual(snapshotTransition.compactPreState, collectedRecord.compactState);
assert.throws(() => assertGroundTruthInvariants({ ...snapshotTransition, isGroundTruth: true }), /snapshot_only/);

const executorTransition = createExecutorLoggedTransitionSkeleton({
  runId: "run-test",
  transitionId: "transition-executor",
  tick: 2,
  timestamp: new Date(0).toISOString(),
  screen: "combat",
  preStateRef: "pre.raw.json",
  compactPreState: { screen: "combat" },
  selectedAction: { kind: "end_turn" }
});
assert.equal(executorTransition.captureMode, "executor_logged");
assert.equal(executorTransition.isGroundTruth, true);
assert.throws(
  () => assertGroundTruthInvariants({ ...executorTransition, source: "human", captureMode: "executor_logged" }),
  /human ground truth/
);

const diffTransition = createDiffInferredTransitionSkeleton({
  runId: "run-test",
  transitionId: "transition-diff",
  tick: 3,
  timestamp: new Date(0).toISOString(),
  screen: "combat",
  preStateRef: "pre.raw.json",
  compactPreState: { screen: "combat" },
  selectedAction: null,
  confidence: 0.4,
  uncertainty: ["duplicate_cards"],
  candidateActions: [{ kind: "play_card", cardName: "Strike" }],
  inferenceReason: "hand and discard changed, but duplicate cards make identity ambiguous"
});
assert.equal(diffTransition.captureMode, "diff_inferred");
assert.equal(diffTransition.isGroundTruth, false);
assert.throws(() => assertGroundTruthInvariants({ ...diffTransition, isGroundTruth: true }), /diff_inferred/);

const manualSnapshot = createSnapshotOnlyTransition({
  runId: "run-test",
  transitionId: "transition-snapshot",
  tick: 4,
  timestamp: new Date(0).toISOString(),
  screen: "map",
  preStateRef: "map.raw.json",
  compactPreState: { screen: "map" }
});
assert.equal(manualSnapshot.isGroundTruth, false);
assert.equal(validateLlmDecisionForCandidates({ candidateId: "a" }, [{ id: "a" }]).valid, true);
assert.equal(validateLlmDecisionForCandidates({ candidateId: "missing" }, [{ id: "a" }]).outcome, "invalid_choice");
assert.equal(validateLlmDecisionForCandidates({} as any, [{ id: "a" }]).outcome, "invalid_output");

const rewardState = normalizeGameState({
  state_type: "card_reward",
  card_reward: {
    cards: [
      {
        id: "COLD_SNAP",
        name: "Cold Snap",
        type: "Attack",
        rarity: "Common",
        description: "Deal 6 damage. Channel 1 Frost."
      },
      {
        id: "COOLHEADED",
        name: "Coolheaded",
        type: "Skill",
        rarity: "Common",
        description: "Channel 1 Frost. Draw 1 card."
      }
    ],
    can_proceed: false
  },
  run: { act: 1, floor: 2, ascension: 1 },
  player: {
    character: "The Defect",
    hp: 70,
    max_hp: 75,
    block: 0,
    energy: 0,
    max_energy: 3,
    relics: [],
    potions: [],
    status: [],
    draw_pile_count: 8,
    discard_pile_count: 4,
    exhaust_pile_count: 0,
    gold: 99
  }
});
const rewardCandidates = generateCandidates(rewardState);
assert.equal(rewardState.screen, "card_reward");
assert.ok(rewardCandidates.some((candidate) => candidate.kind === "select_card_reward"));
assert.ok(!rewardCandidates.some((candidate) => candidate.kind === "proceed"));
{
  const memoryDir = mkdtempSync(path.join(tmpdir(), "sts2-agent-routing-"));
  try {
    const memory = new MemoryManager(memoryDir);
    const scoring = scoreCandidates(rewardState, rewardCandidates, memory.run, memory.strategy);
    assert.equal(scoring.route.kind, "llm_required");
    assert.equal(scoring.shouldAskLlm, true);

    const noLlmController = new AgentController(new FakeClient(rewardState.raw), memory, new NoopLlmDecider());
    const noLlmResult = await noLlmController.tick({ dryRun: true });
    assert.equal(noLlmResult.chosenBy, "fallback");
    assert.equal(noLlmResult.route, "llm_required");
    assert.equal(noLlmResult.fallbackReason, "llm_unavailable");
    assert.equal(noLlmResult.llm?.wanted, true);
    assert.equal(noLlmResult.llm?.called, false);
    assert.equal(noLlmResult.llm?.outcome, "unavailable");

    const invalidChoiceController = new AgentController(
      new FakeClient(rewardState.raw),
      memory,
      new InvalidChoiceLlmDecider()
    );
    const invalidChoiceResult = await invalidChoiceController.tick({ dryRun: true });
    assert.equal(invalidChoiceResult.chosenBy, "fallback");
    assert.equal(invalidChoiceResult.fallbackReason, "llm_invalid_choice");
    assert.equal(invalidChoiceResult.llm?.called, true);
    assert.equal(invalidChoiceResult.llm?.outcome, "invalid_choice");

    const invalidShapeController = new AgentController(
      new FakeClient(rewardState.raw),
      memory,
      new InvalidShapeLlmDecider()
    );
    const invalidShapeResult = await invalidShapeController.tick({ dryRun: true });
    assert.equal(invalidShapeResult.chosenBy, "fallback");
    assert.equal(invalidShapeResult.fallbackReason, "llm_invalid_output");
    assert.equal(invalidShapeResult.llm?.called, true);
    assert.equal(invalidShapeResult.llm?.outcome, "invalid_output");

    const characterSelectState = normalizeGameState({
      state_type: "menu",
      menu_screen: "character_select",
      menu: { options: ["IRONCLAD", "DEFECT", "embark"] },
      player: { character: "Unknown", max_energy: 3 }
    });
    memory.run.keyDecisions.push({
      id: "old-menu-defect",
      at: "2000-01-01T00:00:00.000Z",
      screen: "menu",
      stateSummary: "old menu",
      chosen: "菜单 DEFECT",
      chosenBy: "local",
      reasons: [],
      candidates: []
    });
    const characterSelectScoring = scoreCandidates(
      characterSelectState,
      generateCandidates(characterSelectState),
      memory.run,
      memory.strategy
    );
    assert.equal(characterSelectScoring.top?.action.kind, "menu_select");
    assert.equal(
      characterSelectScoring.top?.action.kind === "menu_select" ? characterSelectScoring.top.action.option : "",
      "DEFECT"
    );

    const disabledMenuState = normalizeGameState({
      state_type: "menu",
      menu_screen: "character_select",
      options: [
        { name: "DEFECT", enabled: true },
        { name: "embark", enabled: false }
      ],
      player: { character: "Unknown", max_energy: 3 }
    });
    assert.ok(
      !generateCandidates(disabledMenuState).some(
        (candidate) => candidate.action.kind === "menu_select" && candidate.action.option === "embark"
      )
    );

    const runStartingMenuState = normalizeGameState({
      state_type: "menu",
      menu_screen: "character_select",
      run: { act: 1, floor: 0, ascension: 4 },
      options: [
        { name: "DEFECT", enabled: true },
        { name: "confirm", enabled: false },
        { name: "embark", enabled: false }
      ],
      player: { character: "Unknown", max_energy: 3 }
    });
    assert.deepEqual(generateCandidates(runStartingMenuState), []);
  } finally {
    rmSync(memoryDir, { recursive: true, force: true });
  }
}
assert.equal(
  cardDamage({
    id: "REFRACT",
    name: "Refract",
    index: 0,
    type: "Attack",
    cost: "3",
    description: "Deal 9 damage twice. Channel 2 Glass.",
    canPlay: true,
    raw: {}
  }),
  18
);

const rewardsScreenState = normalizeGameState({
  state_type: "rewards",
  rewards: {
    items: [
      {
        index: 0,
        type: "gold",
        description: "Obtain 25 gold.",
        gold_amount: 25
      },
      {
        index: 1,
        type: "card",
        description: "Add a card to your deck."
      }
    ],
    can_proceed: true
  },
  run: { act: 1, floor: 2, ascension: 1 },
  player: {
    character: "The Defect",
    hp: 70,
    max_hp: 75,
    block: 0,
    energy: 0,
    max_energy: 3,
    relics: [],
    potions: [],
    status: [],
    draw_pile_count: 8,
    discard_pile_count: 4,
    exhaust_pile_count: 0,
    gold: 99
  }
});
const rewardsScreenCandidates = generateCandidates(rewardsScreenState);
assert.equal(rewardsScreenState.screen, "rewards");
assert.ok(rewardsScreenCandidates.some((candidate) => candidate.kind === "claim_reward"));
assert.ok(!rewardsScreenCandidates.some((candidate) => candidate.kind === "proceed"));
{
  const memoryDir = mkdtempSync(path.join(tmpdir(), "sts2-agent-reward-order-"));
  try {
    const memory = new MemoryManager(memoryDir);
    const scoring = scoreCandidates(rewardsScreenState, rewardsScreenCandidates, memory.run, memory.strategy);
    assert.equal(scoring.top?.action.kind, "claim_reward");
    assert.equal(scoring.top?.action.kind === "claim_reward" ? scoring.top.action.index : -1, 1);
  } finally {
    rmSync(memoryDir, { recursive: true, force: true });
  }
}

const fullPotionRewardState = normalizeGameState({
  state_type: "rewards",
  rewards: {
    items: [
      {
        index: 0,
        type: "potion",
        description: "Speed Potion",
        potion_id: "SPEED_POTION",
        potion_name: "Speed Potion"
      }
    ],
    can_proceed: true
  },
  run: { act: 1, floor: 5, ascension: 4 },
  player: {
    character: "The Defect",
    hp: 42,
    max_hp: 75,
    block: 0,
    energy: 0,
    max_energy: 3,
    max_potion_slots: 2,
    relics: [],
    potions: [
      { id: "STRENGTH_POTION", name: "Strength Potion", slot: 0 },
      { id: "POTION_OF_CAPACITY", name: "Potion of Capacity", slot: 1 }
    ],
    status: [],
    draw_pile_count: 0,
    discard_pile_count: 0,
    exhaust_pile_count: 0,
    gold: 97
  }
});
const fullPotionRewardCandidates = generateCandidates(fullPotionRewardState);
assert.ok(!fullPotionRewardCandidates.some((candidate) => candidate.kind === "claim_reward"));
assert.deepEqual(
  fullPotionRewardCandidates.map((candidate) => candidate.action),
  [{ kind: "discard_potion", slot: 0 }, { kind: "discard_potion", slot: 1 }, { kind: "proceed" }]
);
{
  const memoryDir = mkdtempSync(path.join(tmpdir(), "sts2-agent-full-potion-reward-"));
  try {
    const memory = new MemoryManager(memoryDir);
    const scoring = scoreCandidates(fullPotionRewardState, fullPotionRewardCandidates, memory.run, memory.strategy);
    assert.equal(scoring.top?.action.kind, "proceed");
  } finally {
    rmSync(memoryDir, { recursive: true, force: true });
  }
}

const smokeMemoryDir = mkdtempSync(path.join(tmpdir(), "sts2-agent-smoke-"));
try {
  const memory = new MemoryManager(smokeMemoryDir);
  const lowHpMapState = normalizeGameState({
    state_type: "map",
    map_nodes: [{ type: "RestSite" }, { type: "Unknown" }],
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 20,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  memory.updateFromState(lowHpMapState);
  const lowHpMapScoring = scoreCandidates(lowHpMapState, generateCandidates(lowHpMapState), memory.run, memory.strategy);
  assert.equal(lowHpMapScoring.shouldAskLlm, false);
  assert.equal(lowHpMapScoring.top?.action.kind, "choose_map_node");
  assert.equal(lowHpMapScoring.top?.action.kind === "choose_map_node" ? lowHpMapScoring.top.action.index : -1, 0);

  const waitingMapState = normalizeGameState({
    state_type: "map",
    map_nodes: [],
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 20,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  assert.deepEqual(generateCandidates(waitingMapState), []);

  const equivalentMapState = normalizeGameState({
    state_type: "map",
    map_nodes: [{ type: "RestSite" }, { type: "RestSite" }],
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 20,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  memory.updateFromState(equivalentMapState);
  const equivalentMapScoring = scoreCandidates(
    equivalentMapState,
    generateCandidates(equivalentMapState),
    memory.run,
    memory.strategy
  );
  assert.equal(equivalentMapScoring.shouldAskLlm, false);

  const riskyEliteMapState = normalizeGameState({
    state_type: "map",
    map_nodes: [{ type: "Elite" }],
    run: { act: 1, floor: 10, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 28,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  memory.updateFromState(riskyEliteMapState);
  const riskyEliteScoring = scoreCandidates(riskyEliteMapState, generateCandidates(riskyEliteMapState), memory.run, memory.strategy);
  assert.equal(riskyEliteScoring.shouldAskLlm, false);
  assert.equal(riskyEliteScoring.route.kind, "forced_local");

  const eventLoadingState = normalizeGameState({
    state_type: "event",
    event: { options: [] },
    run: { act: 1, floor: 8, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 42,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  assert.deepEqual(generateCandidates(eventLoadingState), []);
  const eventLoadingScoring = scoreCandidates(eventLoadingState, generateCandidates(eventLoadingState), memory.run, memory.strategy);
  assert.equal(eventLoadingScoring.shouldAskLlm, false);

  const eventProceedOptionState = normalizeGameState({
    ...eventLoadingState.raw,
    event: { options: [{ title: "Proceed" }] }
  });
  assert.deepEqual(generateCandidates(eventProceedOptionState)[0]?.action, { kind: "event_choose_option", index: 0 });

  const restProceedState = normalizeGameState({
    state_type: "rest",
    rest_site: { options: [], can_proceed: false },
    run: { act: 1, floor: 14, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 42,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  assert.deepEqual(generateCandidates(restProceedState)[0]?.action, { kind: "proceed" });

  const eventDescriptionState = normalizeGameState({
    state_type: "event",
    event: {
      options: [
        { title: "Gorge", description: "Choose 2 of 8 random Common cards to add to your Deck." },
        { title: "Search", description: "Lose 14 HP. Obtain the Chosen Cheese." }
      ]
    },
    run: { act: 1, floor: 8, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 42,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 12,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 80
    }
  });
  const eventDescriptionCandidates = generateCandidates(eventDescriptionState);
  assert.ok(eventDescriptionCandidates.some((candidate) => candidate.label.includes("Lose 14 HP")));

  const forcedEndTurnState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 8,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "TERROR_EEL_0",
          name: "Terror Eel",
          hp: 13,
          max_hp: 140,
          block: 0,
          intents: [{ type: "Attack", label: "33" }]
        }
      ]
    },
    run: { act: 1, floor: 11, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 10,
      max_hp: 75,
      block: 20,
      energy: 0,
      max_energy: 3,
      hand: [
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: false
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 10,
      discard_pile_count: 2,
      exhaust_pile_count: 1,
      gold: 80
    }
  });
  const forcedEndTurnScoring = scoreCandidates(forcedEndTurnState, generateCandidates(forcedEndTurnState), memory.run, memory.strategy);
  assert.equal(forcedEndTurnScoring.shouldAskLlm, false);

  const lethalState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 5,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "WATERFALL_GIANT_0",
          name: "Waterfall Giant",
          hp: 80,
          max_hp: 240,
          block: 0,
          intents: [{ type: "Attack", label: "25" }]
        }
      ]
    },
    run: { act: 1, floor: 17, ascension: 4 },
    player: {
      character: "The Defect",
      hp: 8,
      max_hp: 75,
      block: 0,
      energy: 3,
      max_energy: 3,
      hand: [
        {
          id: "REFRACT",
          name: "Refract",
          index: 0,
          type: "Attack",
          cost: "3",
          description: "Deal 9 damage twice. Channel 2 Glass.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 0,
      exhaust_pile_count: 0,
      gold: 99
    }
  });
  const lethalScoring = scoreCandidates(lethalState, generateCandidates(lethalState), memory.run, memory.strategy);
  assert.equal(lethalScoring.top?.action.kind, "play_card");
  assert.equal(lethalScoring.top?.action.kind === "play_card" ? lethalScoring.top.action.cardName : "", "Defend");

  const highPressureState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "CORPSE_SLUG_0",
          name: "Corpse Slug",
          hp: 27,
          max_hp: 27,
          block: 0,
          intents: [{ type: "Attack", label: "14" }]
        }
      ]
    },
    run: { act: 1, floor: 5, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 47,
      max_hp: 75,
      block: 0,
      energy: 2,
      max_energy: 3,
      hand: [
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 0,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "LEAP",
          name: "Leap",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Gain 9 Block.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 2,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 8,
      discard_pile_count: 3,
      exhaust_pile_count: 0,
      gold: 20
    }
  });
  const highPressureScoring = scoreCandidates(highPressureState, generateCandidates(highPressureState), memory.run, memory.strategy);
  assert.equal(highPressureScoring.top?.action.kind, "play_card");
  assert.equal(highPressureScoring.top?.action.kind === "play_card" ? highPressureScoring.top.action.cardName : "", "Leap");

  const sparsePotionSlotState = normalizeGameState({
    ...highPressureState.raw,
    player: {
      ...(highPressureState.raw.player as object),
      potions: [
        {
          id: "POTION_OF_CAPACITY",
          name: "Potion of Capacity",
          slot: 1,
          can_use_in_combat: true,
          target_type: "Self"
        }
      ]
    }
  });
  const sparsePotionCandidate = generateCandidates(sparsePotionSlotState).find((candidate) => candidate.kind === "use_potion");
  assert.deepEqual(sparsePotionCandidate?.action, { kind: "use_potion", slot: 1 });

  const enemyPotionTargetState = normalizeGameState({
    ...highPressureState.raw,
    player: {
      ...(highPressureState.raw.player as object),
      potions: [
        {
          id: "FIRE_POTION",
          name: "Fire Potion",
          slot: 0,
          can_use_in_combat: true,
          target_type: "AnyEnemy"
        }
      ]
    }
  });
  const enemyPotionCandidate = generateCandidates(enemyPotionTargetState).find((candidate) => candidate.kind === "use_potion");
  assert.deepEqual(enemyPotionCandidate?.action, { kind: "use_potion", slot: 0, target: "CORPSE_SLUG_0" });

  const automaticPotionState = normalizeGameState({
    ...highPressureState.raw,
    player: {
      ...(highPressureState.raw.player as object),
      potions: [
        {
          id: "FAIRY_IN_A_BOTTLE",
          name: "Fairy in a Bottle",
          slot: 1,
          target_type: "Self"
        }
      ]
    }
  });
  assert.ok(!generateCandidates(automaticPotionState).some((candidate) => candidate.kind === "use_potion"));

  const riskyAttackFallback: ScoredCandidate = {
    id: "attack-risky",
    kind: "play_card",
    label: "打出 Strike -> Corpse Slug",
    action: { kind: "play_card", cardIndex: 0, cardName: "Strike", target: "CORPSE_SLUG_0" },
    score: 24,
    confidence: 0.18,
    reasons: ["输出"],
    risks: ["高压回合非斩杀攻击会少挡血"]
  };
  const defensiveFallback: ScoredCandidate = {
    id: "block-safe",
    kind: "play_card",
    label: "打出 Leap",
    action: { kind: "play_card", cardIndex: 1, cardName: "Leap" },
    score: 11,
    confidence: 0.72,
    reasons: ["补格挡 9/14"],
    risks: []
  };
  const conservativeFallback = selectFallbackCandidate({
    state: highPressureState,
    route: {
      kind: "llm_required",
      shouldAskLlm: true,
      llmPriority: "required",
      reasons: ["life_or_death"]
    },
    candidates: [riskyAttackFallback, defensiveFallback],
    localTop: riskyAttackFallback,
    fallbackReason: "llm_unavailable"
  });
  assert.equal(conservativeFallback.candidate?.id, "block-safe");
  assert.equal(conservativeFallback.audit.name, "conservative_combat");

  const lethalFallback = selectFallbackCandidate({
    state: highPressureState,
    route: {
      kind: "llm_required",
      shouldAskLlm: true,
      llmPriority: "required",
      reasons: ["possible_combo"]
    },
    candidates: [
      {
        ...riskyAttackFallback,
        id: "lethal-attack",
        score: 120,
        reasons: ["可斩杀目标"]
      },
      defensiveFallback
    ],
    localTop: {
      ...riskyAttackFallback,
      id: "lethal-attack",
      score: 120,
      reasons: ["可斩杀目标"]
    },
    fallbackReason: "llm_unavailable"
  });
  assert.equal(lethalFallback.candidate?.id, "lethal-attack");
  assert.equal(lethalFallback.audit.name, "local_top");

  const collectedRecord = buildCollectedStateRecord({
    rawStatePath: "memory/collected/snapshots/test.raw.json",
    runId: "test-run",
    tick: 1,
    source: "collector",
    state: highPressureState
  });
  assert.equal(collectedRecord.schemaVersion, 1);
  assert.equal(collectedRecord.source, "collector");
  assert.equal(collectedRecord.screen, "combat");
  assert.equal(collectedRecord.action, null);
  assert.equal(collectedRecord.checkpointKind, "not_applicable");
  assert.ok(typeof collectedRecord.stateHash === "string" && collectedRecord.stateHash.length > 20);

  const bundleSelectState = normalizeGameState({
    state_type: "bundle_select",
    bundle_select: {
      screen_type: "bundle",
      prompt: "Choose a bundle.",
      bundles: [
        {
          index: 0,
          cards: [
            {
              id: "BREAKTHROUGH",
              name: "Breakthrough",
              type: "Attack",
              cost: "1",
              description: "Lose 1 HP. Deal 9 damage to ALL enemies.",
              rarity: "Common",
              index: 0
            },
            {
              id: "MOLTEN_FIST",
              name: "Molten Fist",
              type: "Attack",
              cost: "1",
              description: "Deal 10 damage. Double the enemy's Vulnerable. Exhaust.",
              rarity: "Common",
              index: 1
            }
          ]
        },
        {
          index: 1,
          cards: [
            {
              id: "IRON_WAVE",
              name: "Iron Wave",
              type: "Attack",
              cost: "1",
              description: "Gain 5 Block. Deal 5 damage.",
              rarity: "Common",
              index: 0
            },
            {
              id: "TWIN_STRIKE",
              name: "Twin Strike",
              type: "Attack",
              cost: "1",
              description: "Deal 5 damage twice.",
              rarity: "Common",
              index: 1
            }
          ]
        }
      ],
      preview_showing: false,
      can_cancel: false,
      can_confirm: false
    },
    run: { act: 1, floor: 1, ascension: 1 },
    player: {
      character: "The Ironclad",
      hp: 80,
      max_hp: 80,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [{ id: "BURNING_BLOOD", name: "Burning Blood" }],
      potions: [],
      status: [],
      gold: 99
    }
  });
  assert.equal(bundleSelectState.screen, "bundle_select");
  const bundleCandidates = generateCandidates(bundleSelectState);
  assert.ok(bundleCandidates.some((candidate) => candidate.kind === "bundle_select"));
  const bundleScoring = scoreCandidates(bundleSelectState, bundleCandidates, memory.run, memory.strategy);
  assert.equal(bundleScoring.shouldAskLlm, true);
  assert.equal(bundleScoring.top?.action.kind, "bundle_select");

  const bundleConfirmState = normalizeGameState({
    ...bundleSelectState.raw,
    bundle_select: {
      ...(bundleSelectState.raw.bundle_select as object),
      preview_showing: true,
      preview_cards: [
        { id: "IRON_WAVE", name: "Iron Wave", type: "Attack", cost: "1", description: "Gain 5 Block. Deal 5 damage." }
      ],
      can_confirm: true
    }
  });
  const bundleConfirmCandidates = generateCandidates(bundleConfirmState);
  assert.equal(bundleConfirmCandidates[0]?.kind, "bundle_confirm_selection");
  assert.deepEqual(toRestBody({ kind: "bundle_select", index: 1 }), { action: "select_bundle", index: 1 });
  assert.deepEqual(toRestBody({ kind: "bundle_confirm_selection" }), { action: "confirm_bundle_selection" });

  const handSelectState = normalizeGameState({
    state_type: "hand_select",
    hand_select: {
      mode: "simple_select",
      prompt: "Choose a card to make free.",
      cards: [
        { id: "STRIKE_IRONCLAD", name: "Strike", type: "Attack", cost: "1", index: 0 },
        { id: "DEFEND_IRONCLAD", name: "Defend", type: "Skill", cost: "1", index: 1 }
      ],
      can_confirm: false
    },
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [{ entity_id: "GREMLIN_MERC_0", name: "Gremlin Merc", hp: 24, max_hp: 47, intents: [] }]
    },
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Ironclad",
      hp: 78,
      max_hp: 80,
      block: 5,
      energy: 0,
      max_energy: 3,
      hand: [],
      relics: [],
      potions: [],
      status: [],
      gold: 164
    }
  });
  assert.equal(handSelectState.screen, "card_select");
  assert.deepEqual(
    generateCandidates(handSelectState).map((candidate) => candidate.kind),
    ["combat_select_card", "combat_select_card"]
  );
  assert.deepEqual(toRestBody({ kind: "combat_select_card", index: 1, cardName: "Defend" }), {
    action: "combat_select_card",
    card_index: 1
  });
  assert.deepEqual(toRestBody({ kind: "combat_confirm_selection" }), { action: "combat_confirm_selection" });

  const multiRemoveState = normalizeGameState({
    state_type: "card_select",
    card_select: {
      screen_type: "select",
      prompt: "Choose 5 cards to Remove.",
      cards: [
        { id: "STRIKE_DEFECT", name: "Strike", type: "Attack", cost: "1", rarity: "Basic", index: 0 },
        { id: "STRIKE_DEFECT", name: "Strike", type: "Attack", cost: "1", rarity: "Basic", index: 1 },
        { id: "DEFEND_DEFECT", name: "Defend", type: "Skill", cost: "1", rarity: "Basic", index: 2 }
      ]
    },
    run: { act: 2, floor: 18, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 60,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      hand: [],
      relics: [{ id: "PAELS_TOOTH", name: "Pael's Tooth" }],
      potions: [],
      status: [],
      gold: 200
    }
  });
  const multiRemoveClient = new FakeClient(multiRemoveState.raw, multiRemoveState.raw);
  const multiRemoveController = new AgentController(multiRemoveClient, memory, new NoopLlmDecider());
  const firstRemove = await multiRemoveController.tick();
  await new Promise((resolve) => setTimeout(resolve, 1250));
  const secondRemove = await multiRemoveController.tick();
  assert.equal(firstRemove.chosen?.action.kind, "select_card");
  assert.equal(firstRemove.chosen?.action.kind === "select_card" ? firstRemove.chosen.action.index : -1, 0);
  assert.equal(secondRemove.chosen?.action.kind, "select_card");
  assert.equal(secondRemove.chosen?.action.kind === "select_card" ? secondRemove.chosen.action.index : -1, 1);

  const shopState = normalizeGameState({
    state_type: "shop",
    shop: {
      items: [
        { index: 0, category: "card", price: 49, is_stocked: false, can_afford: false },
        { index: 1, category: "relic", price: 192, is_stocked: true, can_afford: false, relic_name: "Blood Vial" },
        { index: 2, category: "potion", price: 50, is_stocked: true, can_afford: true, potion_name: "Block Potion" }
      ],
      can_proceed: false
    },
    run: { act: 1, floor: 9, ascension: 1 },
    player: {
      character: "The Ironclad",
      hp: 65,
      max_hp: 80,
      block: 0,
      energy: 0,
      max_energy: 3,
      hand: [],
      relics: [],
      potions: [],
      status: [],
      gold: 50
    }
  });
  const shopCandidates = generateCandidates(shopState);
  assert.deepEqual(
    shopCandidates.map((candidate) => candidate.action),
    [{ kind: "shop_purchase", index: 2 }, { kind: "proceed" }]
  );

  const openingTreasureState = normalizeGameState({
    state_type: "treasure",
    treasure: { message: "Opening chest...", can_proceed: false },
    run: { act: 1, floor: 10, ascension: 1 },
    player: { character: "The Ironclad", hp: 65, max_hp: 80, block: 0, energy: 0, max_energy: 3, hand: [] }
  });
  assert.deepEqual(generateCandidates(openingTreasureState), []);

  const treasureRelicState = normalizeGameState({
    ...openingTreasureState.raw,
    treasure: {
      relics: [{ index: 0, id: "LANTERN", name: "Lantern" }],
      can_proceed: false
    }
  });
  assert.deepEqual(generateCandidates(treasureRelicState)[0]?.action, {
    kind: "claim_treasure_relic",
    index: 0,
    relicName: "Lantern"
  });
  assert.deepEqual(toRestBody({ kind: "claim_treasure_relic", index: 0, relicName: "Lantern" }), {
    action: "claim_treasure_relic",
    index: 0
  });

  const treasureProceedState = normalizeGameState({
    ...openingTreasureState.raw,
    treasure: { can_proceed: true }
  });
  assert.deepEqual(generateCandidates(treasureProceedState)[0]?.action, { kind: "proceed" });

  const treasureRelicAndProceedState = normalizeGameState({
    ...openingTreasureState.raw,
    treasure: {
      relics: [{ index: 0, id: "JUZU_BRACELET", name: "Juzu Bracelet" }],
      can_proceed: true
    }
  });
  assert.deepEqual(
    generateCandidates(treasureRelicAndProceedState).map((candidate) => candidate.action.kind),
    ["claim_treasure_relic", "proceed"]
  );

  const softAfterStrikeState = normalizeGameState({
    ...highPressureState.raw,
    battle: {
      ...(highPressureState.raw.battle as object),
      enemies: [
        {
          entity_id: "CORPSE_SLUG_0",
          name: "Corpse Slug",
          hp: 21,
          max_hp: 27,
          block: 0,
          intents: [{ type: "Attack", label: "14" }]
        }
      ]
    },
    player: {
      ...(highPressureState.raw.player as object),
      energy: 1,
      hand: [
        {
          id: "LEAP",
          name: "Leap",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 9 Block.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ]
    }
  });
  const softCheckpoint = buildExecutionCheckpoint({
    before: highPressureState,
    after: softAfterStrikeState,
    action: { kind: "play_card", cardIndex: 0, cardName: "Strike", target: "CORPSE_SLUG_0" },
    settled: true,
    polls: 1
  });
  assert.equal(softCheckpoint.kind, "soft");
  assert.ok(softCheckpoint.reasons.includes("expected_card_removed_from_hand"));

  const generatedCardState = normalizeGameState({
    ...highPressureState.raw,
    player: {
      ...(highPressureState.raw.player as object),
      energy: 1,
      hand: [
        ...(highPressureState.player.hand.map((card) => card.raw)),
        {
          id: "WOUND",
          name: "Wound",
          index: 3,
          type: "Status",
          cost: null,
          description: "Unplayable.",
          can_play: false
        }
      ]
    }
  });
  const generatedCheckpoint = buildExecutionCheckpoint({
    before: highPressureState,
    after: generatedCardState,
    action: { kind: "play_card", cardIndex: 0, cardName: "Strike", target: "CORPSE_SLUG_0" },
    settled: true,
    polls: 1
  });
  assert.equal(generatedCheckpoint.kind, "hard");
  assert.ok(generatedCheckpoint.reasons.includes("hand_grew_or_generated_card"));

  const enemyDeadState = normalizeGameState({
    ...highPressureState.raw,
    battle: {
      ...(highPressureState.raw.battle as object),
      enemies: [
        {
          entity_id: "CORPSE_SLUG_0",
          name: "Corpse Slug",
          hp: 0,
          max_hp: 27,
          block: 0,
          intents: [{ type: "Attack", label: "14" }]
        }
      ]
    },
    player: {
      ...(highPressureState.raw.player as object),
      energy: 1,
      hand: highPressureState.player.hand.slice(1).map((card, index) => ({ ...card.raw, index }))
    }
  });
  const enemyDeadCheckpoint = buildExecutionCheckpoint({
    before: highPressureState,
    after: enemyDeadState,
    action: { kind: "play_card", cardIndex: 0, cardName: "Strike", target: "CORPSE_SLUG_0" },
    settled: true,
    polls: 1
  });
  assert.equal(enemyDeadCheckpoint.kind, "hard");
  assert.ok(enemyDeadCheckpoint.reasons.includes("enemy_removed_or_dead"));

  const obviousLethalCheckpointState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 4,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "CALCIFIED_CULTIST_0",
          name: "Calcified Cultist",
          hp: 3,
          max_hp: 39,
          block: 0,
          intents: [{ type: "Attack", label: "13" }],
          status: [{ id: "VULNERABLE_POWER", name: "Vulnerable", amount: 2, type: "Debuff" }]
        },
        {
          entity_id: "DAMP_CULTIST_0",
          name: "Damp Cultist",
          hp: 22,
          max_hp: 53,
          block: 0,
          intents: [{ type: "Attack", label: "11" }],
          status: [{ id: "STRENGTH_POWER", name: "Strength", amount: 10, type: "Buff" }]
        }
      ]
    },
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 26,
      max_hp: 75,
      block: 0,
      energy: 1,
      max_energy: 3,
      hand: [
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "ZAP",
          name: "Zap",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Channel 1 Lightning.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 2,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 4,
      discard_pile_count: 8,
      exhaust_pile_count: 0,
      gold: 20
    }
  });
  const obviousLethalScoring = scoreCandidates(
    obviousLethalCheckpointState,
    generateCandidates(obviousLethalCheckpointState),
    memory.run,
    memory.strategy
  );
  assert.equal(obviousLethalScoring.shouldAskLlm, false);
  assert.equal(obviousLethalScoring.top?.action.kind, "play_card");
  assert.equal(obviousLethalScoring.top?.action.kind === "play_card" ? obviousLethalScoring.top.action.target : "", "CALCIFIED_CULTIST_0");

  const twoCardLethalState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 6,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "DAMP_CULTIST_0",
          name: "Damp Cultist",
          hp: 10,
          max_hp: 53,
          block: 0,
          intents: [{ type: "Attack", label: "21" }],
          status: [{ id: "STRENGTH_POWER", name: "Strength", amount: 20, type: "Buff" }]
        }
      ]
    },
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 20,
      max_hp: 75,
      block: 0,
      energy: 3,
      max_energy: 3,
      hand: [
        {
          id: "DEFEND_DEFECT",
          name: "Defend",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 1,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 2,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "LEAP",
          name: "Leap",
          index: 3,
          type: "Skill",
          cost: "1",
          description: "Gain 9 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 0,
      discard_pile_count: 12,
      exhaust_pile_count: 0,
      gold: 20
    }
  });
  const twoCardLethalScoring = scoreCandidates(
    twoCardLethalState,
    generateCandidates(twoCardLethalState),
    memory.run,
    memory.strategy
  );
  assert.equal(twoCardLethalScoring.shouldAskLlm, false);
  assert.equal(twoCardLethalScoring.top?.action.kind, "play_card");
  assert.equal(twoCardLethalScoring.top?.action.kind === "play_card" ? twoCardLethalScoring.top.action.cardName : "", "Strike");

  const statusCleanupState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 3,
      turn: "player",
      is_play_phase: true,
      enemies: [{ entity_id: "SLAVER_0", name: "Slaver", hp: 30, max_hp: 30, block: 0, intents: [{ type: "Buff" }] }]
    },
    run: { act: 1, floor: 5, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 40,
      max_hp: 75,
      block: 0,
      energy: 2,
      max_energy: 3,
      hand: [
        { id: "WOUND", name: "Wound", index: 0, type: "Status", cost: null, description: "Unplayable.", can_play: false },
        {
          id: "COMPACT",
          name: "Compact",
          index: 1,
          type: "Skill",
          cost: "0",
          description: "Transform all Status cards in your hand into Fuel.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 2,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 99
    }
  });
  const cleanupScoring = scoreCandidates(statusCleanupState, generateCandidates(statusCleanupState), memory.run, memory.strategy);
  assert.equal(cleanupScoring.top?.action.kind, "play_card");
  assert.equal(cleanupScoring.top?.action.kind === "play_card" ? cleanupScoring.top.action.cardName : "", "Compact");

  const statusCreationState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [{ entity_id: "LOUSE_0", name: "Louse", hp: 30, max_hp: 30, block: 0, intents: [{ type: "Buff" }] }]
    },
    run: { act: 1, floor: 2, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 70,
      max_hp: 75,
      block: 0,
      energy: 3,
      max_energy: 3,
      hand: [
        {
          id: "FIGHT_THROUGH",
          name: "Fight Through",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 10 Block. Add 1 Wound to your hand.",
          target_type: "Self",
          can_play: true
        },
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 1,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 99
    }
  });
  const creationScoring = scoreCandidates(statusCreationState, generateCandidates(statusCreationState), memory.run, memory.strategy);
  assert.equal(creationScoring.top?.action.kind, "play_card");
  assert.equal(creationScoring.top?.action.kind === "play_card" ? creationScoring.top.action.cardName : "", "Strike");

  const enemyStatusState = normalizeGameState({
    state_type: "combat",
    battle: {
      round: 2,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "SCALER_0",
          name: "Scaling Enemy",
          hp: 30,
          max_hp: 30,
          block: 0,
          intents: [{ type: "Buff" }],
          status: [{ name: "Ritual", amount: 3 }]
        },
        {
          entity_id: "NORMAL_0",
          name: "Normal Enemy",
          hp: 30,
          max_hp: 30,
          block: 0,
          intents: [{ type: "Buff" }],
          status: []
        }
      ]
    },
    run: { act: 1, floor: 6, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 60,
      max_hp: 75,
      block: 0,
      energy: 3,
      max_energy: 3,
      hand: [
        {
          id: "STRIKE_DEFECT",
          name: "Strike",
          index: 0,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 4,
      exhaust_pile_count: 0,
      gold: 99
    }
  });
  const enemyStatusScoring = scoreCandidates(enemyStatusState, generateCandidates(enemyStatusState), memory.run, memory.strategy);
  assert.equal(enemyStatusScoring.top?.action.kind, "play_card");
  assert.equal(enemyStatusScoring.top?.action.kind === "play_card" ? enemyStatusScoring.top.action.target : "", "SCALER_0");

  const disabledController = new AgentController(new ActionsDisabledClient(combatState()), memory, new NoopLlmDecider());
  const disabledResult = await disabledController.tick();
  assert.equal(disabledResult.chosenBy, "none");
  assert.equal(disabledResult.executed, false);
  assert.match(disabledResult.message, /Player actions are currently disabled/);

  const restChoiceController = new AgentController(
    new FakeClient(restChoiceState(), restPostChoiceState()),
    memory,
    new NoopLlmDecider()
  );
  const restChoiceResult = await restChoiceController.tick();
  assert.deepEqual(restChoiceResult.chosen?.action, { kind: "choose_rest_option", index: 0 });
  const restBackoffResult = await restChoiceController.tick();
  assert.equal(restBackoffResult.executed, false);
  assert.equal(restBackoffResult.message, "Waiting for previous action settlement");

  const runsRoot = path.join(smokeMemoryDir, "runs");
  const client = new FakeClient(combatState(), combatPostStrikeState());
  const controller = new AgentController(client, memory, new NoopLlmDecider(), new AgentDecisionRecorder({ runsRoot }));
  const result = await controller.tick();
  assert.ok(client.executed.length > 0);
  const runDir = path.join(runsRoot, memory.run.runId);
  const transitionsPath = path.join(runDir, "transitions.jsonl");
  assert.ok(existsSync(path.join(runDir, "metadata.json")));
  assert.ok(existsSync(path.join(runDir, "events.jsonl")));
  assert.ok(existsSync(path.join(runDir, "replay.json")));
  assert.ok(existsSync(path.join(runDir, "snapshots")));
  assert.ok(existsSync(transitionsPath));
  const transitionLines = readFileSync(transitionsPath, "utf8").trim().split(/\r?\n/).filter(Boolean);
  assert.equal(transitionLines.length, 1);
  const parsedTransition = JSON.parse(transitionLines[0]);
  assert.equal(parsedTransition.source, "agent");
  assert.equal(parsedTransition.captureMode, "executor_logged");
  assert.equal(parsedTransition.isGroundTruth, true);
  assert.deepEqual(parsedTransition.selectedAction, client.executed[0]);
  assert.equal(parsedTransition.hp, 80);
  assert.equal(parsedTransition.gold, 99);
  assert.equal(parsedTransition.rawStatePath, parsedTransition.preStateRef);
  assert.ok(typeof parsedTransition.postStateRef === "string");
  assert.ok(Array.isArray(parsedTransition.legalActions));
  assert.ok(parsedTransition.legalActions.length > 0);
  assert.ok(parsedTransition.compactState);
  assert.ok(parsedTransition.memorySnapshot);
  assert.ok(parsedTransition.derivedSnapshot);
  assert.equal(parsedTransition.executionResult.status, "ok");
  assert.ok(parsedTransition.stateDiff.checkpoint);
  assert.equal(readTransitionJsonl(transitionsPath).length, 1);
  const replayRun = readReplayRun(runDir);
  assert.equal(replayRun.transitions.length, 1);
  const timeline = buildReplayTimeline(replayRun.transitions);
  assert.equal(timeline.length, 1);
  assert.equal(timeline[0]?.captureMode, "executor_logged");
  const evalReport = evaluateRun(runDir);
  assert.equal(evalReport.status, "PASS");
  assert.equal(evalReport.summary.transitions, 1);
  assert.equal(evalReport.summary.matchedSelectedActions, 1);
  assert.deepEqual(evalReport.warningSummary, {});
  assert.equal(evalReport.strategyMetrics.fallbackRate, 0);
  assert.deepEqual(evalReport.errors, []);

  const historicalEvalDir = path.join(smokeMemoryDir, "historical-eval");
  const historicalSnapshotsDir = path.join(historicalEvalDir, "snapshots");
  mkdirSync(historicalSnapshotsDir, { recursive: true });
  writeFileSync(path.join(historicalEvalDir, "metadata.json"), JSON.stringify({ runId: "run-mr0rfdcb-yewhg8" }));
  writeFileSync(path.join(historicalSnapshotsDir, "card-select.raw.json"), JSON.stringify(multiRemoveState.raw));
  const historicalTransitionBase = {
    schemaVersion: "1.0",
    runId: "run-mr0rfdcb-yewhg8",
    source: "agent",
    captureMode: "executor_logged",
    isGroundTruth: true,
    timestamp: new Date(0).toISOString(),
    screen: "card_select",
    floor: 18,
    hp: 60,
    gold: 200,
    preStateRef: path.join(historicalSnapshotsDir, "card-select.raw.json"),
    postStateRef: path.join(historicalSnapshotsDir, "card-select.raw.json"),
    rawStatePath: path.join(historicalSnapshotsDir, "card-select.raw.json"),
    rawRefs: [path.join(historicalSnapshotsDir, "card-select.raw.json")],
    compactPreState: { screen: "card_select" },
    compactPostState: { screen: "card_select" },
    compactState: { screen: "card_select" },
    legalActions: generateCandidates(multiRemoveState),
    selectedAction: { kind: "select_card", index: 0, cardName: "Strike" },
    executionResult: { status: "ok" },
    stateDiff: {
      checkpoint: {
        kind: "unknown",
        settled: false,
        reasons: ["settlement_timeout_or_no_visible_change"],
        preStateHash: "same-card-select",
        postStateHash: "same-card-select"
      }
    },
    decisionAudit: { chosenBy: "fallback", confidence: 0.45 },
    derivedSnapshot: {},
    memorySnapshot: {}
  };
  writeFileSync(
    path.join(historicalEvalDir, "transitions.jsonl"),
    [
      JSON.stringify({ ...historicalTransitionBase, transitionId: "transition-historical-1", tick: 708 }),
      JSON.stringify({ ...historicalTransitionBase, transitionId: "transition-historical-2", tick: 713 })
    ].join("\n")
  );
  const historicalEvalReport = evaluateRun(historicalEvalDir);
  assert.equal(historicalEvalReport.status, "WARN");
  assert.equal(historicalEvalReport.errors.length, 0);
  assert.equal(historicalEvalReport.summary.repeatedNoProgress, 1);
  assert.equal(historicalEvalReport.warningSummary.historical_fixed_evidence?.codes.repeated_no_progress, 1);
  assert.equal(
    historicalEvalReport.warnings.find((warning) => warning.code === "repeated_no_progress")?.historical,
    true
  );

  const staleRunsRoot = path.join(smokeMemoryDir, "stale-runs");
  const staleClient = new StaleThenSettledClient(combatState(), combatStalePostStrikeState(), combatPostStrikeState());
  const staleController = new AgentController(
    staleClient,
    memory,
    new NoopLlmDecider(),
    new AgentDecisionRecorder({ runsRoot: staleRunsRoot })
  );
  const staleResult = await staleController.tick();
  assert.ok((staleResult.checkpoint?.polls ?? 0) >= 2);
  assert.match(staleResult.checkpoint?.after ?? "", /hand=\[0:Defend\]/);
  console.log(JSON.stringify({ result, executed: client.executed }, null, 2));
} finally {
  rmSync(smokeMemoryDir, { recursive: true, force: true });
}

function combatStalePostStrikeState(): unknown {
  return {
    state_type: "combat",
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "JAW_WORM_0",
          name: "Jaw Worm",
          hp: 6,
          max_hp: 40,
          block: 0,
          intents: [{ type: "Attack", label: "6" }]
        }
      ]
    },
    run: {
      act: 1,
      floor: 1,
      ascension: 1
    },
    player: {
      character: "Ironclad",
      hp: 80,
      max_hp: 80,
      block: 0,
      energy: 2,
      max_energy: 3,
      hand: [
        {
          id: "STRIKE_IRONCLAD",
          name: "Strike",
          index: 0,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "DEFEND_IRONCLAD",
          name: "Defend",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 1,
      exhaust_pile_count: 0,
      gold: 99
    }
  };
}

function combatPostStrikeState(): unknown {
  return {
    state_type: "combat",
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "JAW_WORM_0",
          name: "Jaw Worm",
          hp: 6,
          max_hp: 40,
          block: 0,
          intents: [{ type: "Attack", label: "6" }]
        }
      ]
    },
    run: {
      act: 1,
      floor: 1,
      ascension: 1
    },
    player: {
      character: "Ironclad",
      hp: 80,
      max_hp: 80,
      block: 0,
      energy: 2,
      max_energy: 3,
      hand: [
        {
          id: "DEFEND_IRONCLAD",
          name: "Defend",
          index: 0,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 1,
      exhaust_pile_count: 0,
      gold: 99
    }
  };
}

function restChoiceState(): unknown {
  return {
    state_type: "rest_site",
    rest_site: {
      options: [{ index: 0, label: "Rest", description: "Heal for 30% of your Max HP." }],
      can_proceed: false
    },
    run: { act: 1, floor: 7, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 31,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      gold: 120
    }
  };
}

function restPostChoiceState(): unknown {
  return {
    state_type: "rest_site",
    rest_site: {
      options: [],
      can_proceed: false
    },
    run: { act: 1, floor: 7, ascension: 1 },
    player: {
      character: "The Defect",
      hp: 53,
      max_hp: 75,
      block: 0,
      energy: 0,
      max_energy: 3,
      relics: [],
      potions: [],
      status: [],
      gold: 120
    }
  };
}

function combatState(): unknown {
  return {
    state_type: "combat",
    battle: {
      round: 1,
      turn: "player",
      is_play_phase: true,
      enemies: [
        {
          entity_id: "JAW_WORM_0",
          name: "Jaw Worm",
          hp: 12,
          max_hp: 40,
          block: 0,
          intents: [{ type: "Attack", label: "6" }]
        }
      ]
    },
    run: {
      act: 1,
      floor: 1,
      ascension: 1
    },
    player: {
      character: "Ironclad",
      hp: 80,
      max_hp: 80,
      block: 0,
      energy: 3,
      max_energy: 3,
      hand: [
        {
          id: "STRIKE_IRONCLAD",
          name: "Strike",
          index: 0,
          type: "Attack",
          cost: "1",
          description: "Deal 6 damage.",
          target_type: "AnyEnemy",
          can_play: true
        },
        {
          id: "DEFEND_IRONCLAD",
          name: "Defend",
          index: 1,
          type: "Skill",
          cost: "1",
          description: "Gain 5 Block.",
          target_type: "Self",
          can_play: true
        }
      ],
      relics: [],
      potions: [],
      status: [],
      draw_pile_count: 5,
      discard_pile_count: 0,
      exhaust_pile_count: 0,
      gold: 99
    }
  };
}
