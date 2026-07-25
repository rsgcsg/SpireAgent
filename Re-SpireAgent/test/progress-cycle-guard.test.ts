import { describe, expect, it } from "vitest";
import type { AllowedAction } from "../src/domain/actions/allowedAction.js";
import type { NormalizedCurrentState } from "../src/domain/state/index.js";
import { ProgressCycleGuard, semanticProgressHash } from "../src/runtime/progressCycleGuard.js";

describe("ProgressCycleGuard", () => {
  it("stops a repeated semantic transition despite fresh Bridge transport ids", () => {
    const guard = new ProgressCycleGuard();
    const first = shopState("shop_room", "state-room-1", "action-open-1", 50);
    const firstPost = shopState("shop_inventory", "state-inventory-1", "action-close-1", 50);
    const second = shopState("shop_room", "state-room-2", "action-open-2", 50);
    const secondPost = shopState("shop_inventory", "state-inventory-2", "action-close-2", 50);

    expect(semanticProgressHash(first)).toBe(semanticProgressHash(second));
    expect(guard.observe(first, openAction("action-open-1", "state-room-1"), firstPost)).toBeUndefined();
    expect(guard.observe(second, openAction("action-open-2", "state-room-2"), secondPost)).toMatchObject({
      occurrence: 2,
      selectedActionKind: "open_shop_inventory"
    });
  });

  it("does not collapse real business progress into transport churn", () => {
    const guard = new ProgressCycleGuard();
    const before = shopState("shop_inventory", "state-shop-1", "action-buy-1", 50);
    const afterPurchase = shopState("shop_inventory", "state-shop-2", "action-buy-2", 20);
    const laterBefore = shopState("shop_inventory", "state-shop-3", "action-buy-3", 20);
    const laterAfter = shopState("shop_inventory", "state-shop-4", "action-buy-4", 10);

    expect(guard.observe(before, purchaseAction("action-buy-1", "state-shop-1"), afterPurchase)).toBeUndefined();
    expect(guard.observe(laterBefore, purchaseAction("action-buy-3", "state-shop-3"), laterAfter)).toBeUndefined();
  });
});

function shopState(
  kind: "shop_room" | "shop_inventory",
  bridgeStateId: string,
  actionId: string,
  gold: number
): NormalizedCurrentState {
  return {
    normalizedSchemaVersion: 26,
    sourceStateType: `bridge_v2:shop:${kind}`,
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
      potions: [],
      maxPotionSlots: 2,
      runDeck: []
    },
    enemies: [],
    rewards: [],
    map: { current: null, nextOptions: [] },
    selection: { cards: [], selectedIndices: [], minimum: 0, maximum: 0, canConfirm: false, canCancel: false },
    shop: { items: [], canLeave: true },
    event: { title: "Merchant", body: "", options: [] },
    rest: { options: [] },
    treasure: { relics: [], canProceed: false },
    menu: { options: [] },
    completeness: { playerVisibleSemantics: "fixture", missing: [] },
    bridgeDiagnostics: [],
    bridgeLegacyWarnings: [],
    bridgeObservation: {
      observationId: `observation-${bridgeStateId}`,
      coherent: true,
      stateId: bridgeStateId,
      inspectionKinds: []
    },
    stability: "actionable",
    actionAuthority: "bridge_advertised",
    context: { kind: "shop" },
    surface: kind === "shop_room"
      ? {
          kind,
          bridgeStateId,
          roomEntityId: "room-1",
          canOpenInventory: true,
          canProceed: true,
          legalActions: [legalAction(actionId, bridgeStateId, "open_shop_inventory")],
          completeness: bridgeCompleteness()
        }
      : {
          kind,
          bridgeStateId,
          screenEntityId: "screen-1",
          cards: [],
          relics: [],
          potions: [],
          cardRemoval: null,
          canClose: true,
          legalActions: [legalAction(actionId, bridgeStateId, "close_shop_inventory")],
          completeness: bridgeCompleteness()
        }
  } as NormalizedCurrentState;
}

function legalAction(actionId: string, stateId: string, kind: string) {
  return {
    actionId,
    stateId,
    kind,
    label: kind,
    authority: "game_ui" as const,
    evidenceCode: "fixture",
    entityBindings: [{ role: "shop", entityId: "room-1" }],
    category: "navigation" as const
  };
}

function bridgeCompleteness() {
  return {
    playerVisibleSemantics: "fixture",
    legalActions: "fixture",
    sources: ["fixture"],
    missing: []
  };
}

function openAction(actionId: string, stateId: string): AllowedAction {
  return bridgeAction(actionId, stateId, "open_shop_inventory");
}

function purchaseAction(actionId: string, stateId: string): AllowedAction {
  return bridgeAction(actionId, stateId, "purchase_shop_card");
}

function bridgeAction(actionId: string, stateId: string, kind: string): AllowedAction {
  return {
    id: actionId,
    kind,
    label: kind,
    entityBindings: [{ role: "shop", entityId: "room-1" }],
    sourceStateHash: `source-${stateId}`,
    action: { kind: "bridge_v2_action", actionId, expectedStateId: stateId, bridgeActionKind: kind }
  };
}
