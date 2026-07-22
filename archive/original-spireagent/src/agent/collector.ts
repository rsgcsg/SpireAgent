import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CollectedStateRecord, JsonRecord, NormalizedState } from "./types.js";
import type { StateSource } from "./client.js";
import { RestGameClient } from "./client.js";
import { stateHash } from "./checkpoint.js";
import { getIncomingDamage, normalizeGameState, summarizeState } from "./state.js";
import { agentRoot, appendJsonl, ensureDir, nowIso, stableId, writeJsonAtomic } from "./utils.js";

const schemaVersion = 1;
const defaultCollectDir = path.join(agentRoot, "memory", "collected");

export interface CollectorOptions {
  outputDir?: string;
  runId?: string;
  tick?: number;
  source?: CollectedStateRecord["source"];
}

export interface CollectorWriteResult {
  record: CollectedStateRecord;
  logPath: string;
  rawStatePath: string;
}

export async function collectStateOnce(
  source: StateSource = new RestGameClient(),
  options: CollectorOptions = {}
): Promise<CollectorWriteResult> {
  const outputDir = options.outputDir ?? defaultCollectDir;
  const runId = options.runId ?? stableId("collect-run");
  const tick = options.tick ?? 1;
  const rawState = await source.getState("json");
  const compact = normalizeGameState(rawState);
  const snapshotDir = path.join(outputDir, "snapshots");
  const rawStatePath = path.join(snapshotDir, `${runId}-tick-${String(tick).padStart(6, "0")}.raw.json`);

  ensureDir(snapshotDir);
  writeJsonAtomic(rawStatePath, rawState);

  const record = buildCollectedStateRecord({
    rawStatePath: path.relative(agentRoot, rawStatePath),
    runId,
    tick,
    source: options.source ?? "collector",
    state: compact
  });
  const logPath = path.join(outputDir, "state-log.jsonl");
  appendJsonl(logPath, record);

  return { record, logPath, rawStatePath };
}

export function buildCollectedStateRecord(input: {
  rawStatePath: string;
  runId: string;
  tick: number;
  source?: CollectedStateRecord["source"];
  state: NormalizedState;
}): CollectedStateRecord {
  return {
    schemaVersion,
    runId: input.runId,
    tick: input.tick,
    source: input.source ?? "collector",
    timestamp: nowIso(),
    screen: input.state.screen,
    act: input.state.act,
    floor: input.state.floor,
    hp: input.state.player.hp,
    maxHp: input.state.player.maxHp,
    gold: input.state.player.gold,
    stateHash: stateHash(input.state),
    rawStatePath: input.rawStatePath,
    compactState: compactStateForDataset(input.state),
    action: null,
    executionResult: null,
    stateDiff: null,
    checkpointKind: "not_applicable",
    checkpointReasons: []
  };
}

export function compactStateForDataset(state: NormalizedState): JsonRecord {
  return {
    summary: summarizeState(state),
    stateType: state.stateType,
    screen: state.screen,
    act: state.act,
    floor: state.floor,
    round: state.round,
    turn: state.turn,
    isPlayPhase: state.isPlayPhase,
    incomingDamage: getIncomingDamage(state),
    player: {
      character: state.player.character,
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      block: state.player.block,
      energy: state.player.energy,
      maxEnergy: state.player.maxEnergy,
      gold: state.player.gold,
      drawPileCount: state.player.drawPileCount,
      discardPileCount: state.player.discardPileCount,
      exhaustPileCount: state.player.exhaustPileCount,
      hand: state.player.hand.map((card) => ({
        index: card.index,
        id: card.id,
        name: card.name,
        type: card.type,
        cost: card.cost,
        canPlay: card.canPlay,
        targetType: card.targetType
      })),
      relics: state.player.relics.map(compactObjectIdentity),
      potions: state.player.potions.map(compactObjectIdentity),
      status: state.player.status.map(compactObjectIdentity),
      orbs: state.player.orbs.map(compactObjectIdentity)
    },
    enemies: state.enemies.map((enemy) => ({
      id: enemy.id,
      name: enemy.name,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      block: enemy.block,
      intents: enemy.intents,
      status: enemy.status.map(compactObjectIdentity)
    })),
    rewardsCount: state.rewards.length,
    optionsCount: state.options.length,
    mapNodesCount: state.mapNodes.length
  };
}

function compactObjectIdentity(value: JsonRecord): JsonRecord {
  return {
    id: value.id ?? value.power_id ?? value.powerId ?? value.relic_id ?? value.card_id,
    name: value.name ?? value.title ?? value.label,
    amount: value.amount ?? value.stacks ?? value.count,
    type: value.type
  };
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "state";
  const args = process.argv.slice(3);
  const maxTicks = numberArg(args, "--max-ticks", command === "watch" ? 60 : 1);
  const intervalMs = numberArg(args, "--interval-ms", 1000);
  const outputDir = stringArg(args, "--out") ?? defaultCollectDir;
  const runId = stringArg(args, "--run-id") ?? stableId("collect-run");
  const client = new RestGameClient();

  if (command !== "state" && command !== "watch") {
    throw new Error(`Unknown collector command: ${command}`);
  }

  for (let tick = 1; tick <= maxTicks; tick += 1) {
    const result = await collectStateOnce(client, {
      outputDir,
      runId,
      tick,
      source: "collector"
    });
    console.log(
      JSON.stringify(
        {
          message: "Collected state",
          logPath: path.relative(agentRoot, result.logPath),
          rawStatePath: path.relative(agentRoot, result.rawStatePath),
          screen: result.record.screen,
          floor: result.record.floor,
          stateHash: result.record.stateHash
        },
        null,
        2
      )
    );
    if (command === "state" || tick === maxTicks) break;
    await sleep(intervalMs);
  }
}

function numberArg(args: string[], name: string, fallback: number): number {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = Number(args[index + 1]);
  return Number.isFinite(value) ? value : fallback;
}

function stringArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  });
}
