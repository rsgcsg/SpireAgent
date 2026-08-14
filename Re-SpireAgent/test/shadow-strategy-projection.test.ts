import { describe, expect, it } from "vitest";
import { buildShadowStrategyProjection } from "../src/prompting/shadowStrategyProjection.js";
import type { JsonObject } from "../src/shared/json.js";

describe("strategy projection", () => {
  it("separates Player Environment evidence from the finite model menu without mutating it", () => {
    const currentState: JsonObject = {
      normalizedSchemaVersion: 32,
      sourceStateType: "player_environment:shop_inventory",
      actionAuthority: "player_environment",
      player: { hp: 30, gold: 99 },
      surface: {
        kind: "player_environment",
        snapshotId: "snapshot-1",
        interactionKind: "shop_inventory",
        reads: [{ readId: "read:shop_catalog", kind: "shop_catalog" }],
        completeness: {
          status: "complete",
          missing: [],
          hiddenByPolicy: ["future_inventory"]
        },
        boundActions: [{ boundActionId: "buy-card" }]
      }
    };
    const original = JSON.stringify(currentState);

    const result = buildShadowStrategyProjection({
      contextKind: "shop",
      surfaceKind: "player_environment",
      actionAuthority: "player_environment",
      currentState,
      allowedActions: [{ id: "buy-card", kind: "purchase", label: "Buy card" }]
    });
    const state = result.modelPayload.currentState as JsonObject;

    expect(JSON.stringify(currentState)).toBe(original);
    expect(state.normalizedSchemaVersion).toBeUndefined();
    expect(state.sourceStateType).toBeUndefined();
    expect(state.actionAuthority).toBeUndefined();
    expect((state.surface as JsonObject).boundActions).toBeUndefined();
    expect(result.modelPayload.informationBoundary).toEqual({
      completeness: {
        status: "complete",
        missing: [],
        hiddenByPolicy: ["future_inventory"]
      },
      availableReads: [{ readId: "read:shop_catalog", kind: "shop_catalog" }]
    });
    expect(result.omittedEvidenceFields).toEqual(expect.arrayContaining([
      "normalizedSchemaVersion",
      "sourceStateType",
      "actionAuthority",
      "surface.boundActions"
    ]));
    expect(result.deduplicatedFactGroups).toEqual([]);
    expect(result.sourceNormalizedStateHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.projectionHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.userPrompt).not.toContain("boundActionId");
    expect(result.userPrompt).toContain("buy-card");
  });

  it("keeps a compact payload when no reads are available", () => {
    const result = buildShadowStrategyProjection({
      contextKind: "combat",
      surfaceKind: "player_environment",
      actionAuthority: "player_environment",
      currentState: { player: { hp: 30 }, surface: { kind: "player_environment", reads: [], boundActions: [] } },
      allowedActions: []
    });

    expect(result.modelPayload.informationBoundary).toEqual({ availableReads: [] });
    expect(result.modelPayload.currentState).toEqual({
      player: { hp: 30 },
      surface: { kind: "player_environment", reads: [] }
    });
  });

  it("is deterministic for the same environment evidence and finite choices", () => {
    const input = {
      contextKind: "map",
      surfaceKind: "player_environment",
      actionAuthority: "player_environment",
      currentState: { player: { hp: 45 }, surface: { kind: "player_environment", reads: [], boundActions: [] } },
      allowedActions: [{ id: "choose-node", kind: "choose", label: "Choose node" }]
    };

    const first = buildShadowStrategyProjection(input);
    const second = buildShadowStrategyProjection(input);

    expect(second.sourceNormalizedStateHash).toBe(first.sourceNormalizedStateHash);
    expect(second.projectionHash).toBe(first.projectionHash);
    expect(second.userPrompt).toBe(first.userPrompt);
  });
});
