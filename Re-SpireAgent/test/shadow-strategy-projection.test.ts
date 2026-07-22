import { describe, expect, it } from "vitest";
import { buildShadowStrategyProjection } from "../src/prompting/shadowStrategyProjection.js";
import type { JsonObject } from "../src/shared/json.js";

describe("shadow strategy projection", () => {
  it("removes governance and repeated facts without mutating complete evidence", () => {
    const currentState: JsonObject = {
      normalizedSchemaVersion: 25,
      actionAuthority: "bridge_advertised",
      player: { runDeck: [{ id: "STRIKE" }], drawPile: [] },
      bridgeInspectionFacts: {
        runDeck: [{ id: "STRIKE" }],
        drawPile: [],
        shopCatalog: { cards: [{ id: "BASH", price: 99 }] }
      },
      bridgeObservation: { coherent: true, inspectionKinds: ["run_deck", "shop_catalog"] },
      bridgeVisibility: {
        playerVisibleClosureStatus: "partial_catalog",
        missing: ["linked_details"],
        hiddenByPolicy: ["draw_order"]
      },
      bridgeDiagnostics: [{ code: "audit-only" }],
      bridgeInspectionCatalog: [{ kind: "run_deck" }],
      bridgeContractInstanceShadow: { authorizing: false },
      surface: { kind: "shop_inventory", legalActions: [{ id: "surface-action" }] }
    };
    const original = JSON.stringify(currentState);

    const result = buildShadowStrategyProjection({
      contextKind: "shop",
      surfaceKind: "shop_inventory",
      actionAuthority: "bridge_advertised",
      currentState,
      allowedActions: [{ id: "allowed-action", kind: "purchase_shop_card", label: "Buy Bash" }]
    });
    const state = result.modelPayload.currentState as JsonObject;
    const boundary = result.modelPayload.informationBoundary as JsonObject;

    expect(JSON.stringify(currentState)).toBe(original);
    expect(state.bridgeDiagnostics).toBeUndefined();
    expect(state.bridgeVisibility).toBeUndefined();
    expect((state.surface as JsonObject).legalActions).toBeUndefined();
    expect((state.inspectionFacts as JsonObject).runDeck).toBeUndefined();
    expect((state.inspectionFacts as JsonObject).drawPile).toBeUndefined();
    expect((state.inspectionFacts as JsonObject).shopCatalog).toEqual({ cards: [{ id: "BASH", price: 99 }] });
    expect(boundary).toEqual({
      playerVisibleClosureStatus: "partial_catalog",
      missing: ["linked_details"],
      hiddenByPolicy: ["draw_order"],
      coherentObservation: true,
      observedFactGroups: ["drawPile", "runDeck", "shopCatalog"]
    });
    expect(result.deduplicatedFactGroups).toEqual([
      "player.runDeck=inspection.runDeck",
      "player.drawPile=inspection.drawPile"
    ]);
    expect(result.omittedEvidenceFields).toEqual(expect.arrayContaining([
      "bridgeDiagnostics",
      "bridgeVisibility",
      "bridgeInspectionFacts",
      "surface.legalActions"
    ]));
    expect(result.sourceNormalizedStateHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.projectionHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.userPrompt).not.toContain("surface-action");
    expect(result.userPrompt).toContain("allowed-action");
  });

  it("keeps a usable compact payload when no bridge sidecars exist", () => {
    const result = buildShadowStrategyProjection({
      contextKind: "combat",
      surfaceKind: "combat_turn",
      actionAuthority: "local_reconstruction",
      currentState: { player: { hp: 30 }, surface: { kind: "combat_turn", legalActions: [] } },
      allowedActions: []
    });

    expect(result.modelPayload.informationBoundary).toBeUndefined();
    expect(result.modelPayload.currentState).toEqual({
      player: { hp: 30 },
      surface: { kind: "combat_turn" }
    });
  });

  it("is deterministic for the same full evidence and allowed actions", () => {
    const input = {
      contextKind: "map",
      surfaceKind: "map_navigation",
      actionAuthority: "bridge_advertised",
      currentState: { player: { hp: 45 }, surface: { kind: "map_navigation", legalActions: [] } },
      allowedActions: [{ id: "action:map", kind: "choose_map_node" }]
    };

    const first = buildShadowStrategyProjection(input);
    const second = buildShadowStrategyProjection(input);

    expect(second.sourceNormalizedStateHash).toBe(first.sourceNormalizedStateHash);
    expect(second.projectionHash).toBe(first.projectionHash);
    expect(second.userPrompt).toBe(first.userPrompt);
  });
});
