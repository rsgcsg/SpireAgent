import { describe, expect, it } from "vitest";
import type { ExecutableGameAction } from "../src/domain/actions/action.js";
import type { AllowedAction } from "../src/domain/actions/allowedAction.js";
import type { NormalizedCurrentState } from "../src/domain/state/index.js";
import { ProgressCycleGuard, semanticProgressHash } from "../src/runtime/progressCycleGuard.js";

describe("ProgressCycleGuard", () => {
  it("detects the same player-visible transition despite fresh snapshot and bound-action ids", () => {
    const guard = new ProgressCycleGuard<ExecutableGameAction>();
    const room1 = shopState("shop_room", "snapshot-room-1", 50);
    const inventory1 = shopState("shop_inventory", "snapshot-inventory-1", 50);
    const room2 = shopState("shop_room", "snapshot-room-2", 50);
    const inventory2 = shopState("shop_inventory", "snapshot-inventory-2", 50);

    expect(semanticProgressHash(room1)).toBe(semanticProgressHash(room2));
    expect(guard.observe(room1, action("open", "snapshot-room-1"), inventory1))
      .toBeUndefined();
    expect(guard.observe(room2, action("open", "snapshot-room-2"), inventory2))
      .toMatchObject({ occurrence: 2, selectedActionKind: "open", recoveryPlanned: false });
  });

  it("suppresses a proven return edge while preserving a progression alternative", () => {
    const guard = new ProgressCycleGuard<ExecutableGameAction>();
    const room1 = shopState("shop_room", "snapshot-room-1", 50);
    const inventory1 = shopState("shop_inventory", "snapshot-inventory-1", 50);
    const room2 = shopState("shop_room", "snapshot-room-2", 50);
    const inventory2 = shopState("shop_inventory", "snapshot-inventory-2", 50);
    const room3 = shopState("shop_room", "snapshot-room-3", 50);

    guard.observe(room1, action("open", "snapshot-room-1"), inventory1);
    guard.observe(inventory1, action("close", "snapshot-inventory-1"), room2);
    guard.observe(room2, action("open", "snapshot-room-2"), inventory2);
    expect(guard.observe(inventory2, action("close", "snapshot-inventory-2"), room3))
      .toMatchObject({ recoveryPlanned: true });

    const filtered = guard.filterActions(room3, [
      action("open", "snapshot-room-3"),
      action("activate", "snapshot-room-3")
    ]);
    expect(filtered.actions.map((item) => item.kind)).toEqual(["activate"]);
    expect(filtered.excludedActionHashes).toHaveLength(1);
  });

  it("does not collapse visible game progress into transport churn", () => {
    const guard = new ProgressCycleGuard<ExecutableGameAction>();
    const before = shopState("shop_inventory", "snapshot-1", 50);
    const after = shopState("shop_inventory", "snapshot-2", 20);
    const laterBefore = shopState("shop_inventory", "snapshot-3", 20);
    const laterAfter = shopState("shop_inventory", "snapshot-4", 10);

    expect(guard.observe(before, action("activate", "snapshot-1"), after)).toBeUndefined();
    expect(guard.observe(laterBefore, action("activate", "snapshot-3"), laterAfter)).toBeUndefined();
  });
});

function shopState(
  interactionKind: "shop_room" | "shop_inventory",
  snapshotId: string,
  gold: number
): NormalizedCurrentState {
  return {
    normalizedSchemaVersion: 32,
    sourceStateType: `player_environment:${interactionKind}`,
    stability: "actionable",
    actionAuthority: "player_environment",
    run: { characterId: "IRONCLAD", floor: 2 },
    player: {
      character: "The Ironclad",
      hp: 70,
      maxHp: 80,
      gold,
      hand: [],
      drawPile: [],
      discardPile: [],
      exhaustPile: [],
      companions: [],
      orbs: [],
      statuses: [],
      relics: [],
      potions: []
    },
    context: { kind: "shop" },
    surface: {
      kind: "player_environment",
      snapshotId,
      interactionKind,
      stage: "ready",
      interactionId: interactionKind,
      contentSchema: `sts2.player-environment/surface/${interactionKind}-1`,
      content: {
        surface: { kind: interactionKind, gold },
        context: { kind: "shop" }
      },
      referents: [],
      reads: [],
      capabilities: [],
      boundActionProjection: {
        status: "complete",
        totalCount: 1,
        limit: 512,
        orderingSemantics: "fixture"
      },
      boundActions: [],
      completeness: {
        status: "complete",
        visibleInformation: "fixture",
        interactionDiscovery: "fixture",
        missing: [],
        hiddenByPolicy: []
      }
    }
  };
}

function action(verb: string, snapshotId: string): AllowedAction<ExecutableGameAction> {
  const id = `${verb}-${snapshotId}`;
  return {
    id,
    kind: verb,
    label: verb,
    entityBindings: [{ role: "control", entityId: verb }],
    sourceStateHash: `source-${snapshotId}`,
    action: {
      kind: "bound_action",
      choiceId: id,
      expectedSnapshotId: snapshotId,
      boundActionId: id
    }
  };
}
