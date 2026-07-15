import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import { serializeSts2McpAction } from "../src/integrations/sts2mcp/actionSerializer.js";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";
import { fixture, TEST_ADAPTER } from "./helpers.js";

describe("buildAllowedActions", () => {
  it("builds deterministic combat actions only from playable cards and observed targets", async () => {
    const envelope = normalizeCurrentState(await fixture("combat"), TEST_ADAPTER);
    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    expect(actions.map((action) => action.id)).toEqual([
      "combat:play:0:target:NIBBIT_0",
      "combat:play:0:target:INKLET_0",
      "combat:play:1",
      "combat:potion:0",
      "combat:end-turn"
    ]);
    expect(actions.every((action) => action.sourceStateHash === envelope.stateHash)).toBe(true);
    expect(actions.some((action) => action.label.includes("Void"))).toBe(false);
  });

  it("includes card-reward options and explicit skip", async () => {
    const envelope = normalizeCurrentState(await fixture("card-reward"), TEST_ADAPTER);
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.id)).toEqual([
      "card-reward:0",
      "card-reward:1",
      "card-reward:skip"
    ]);
  });

  it("includes both card selection and confirm when the surface allows both", async () => {
    const envelope = normalizeCurrentState(await fixture("hand-select"), TEST_ADAPTER);
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.id)).toEqual([
      "card-selection:0",
      "card-selection:1",
      "card-selection:confirm"
    ]);
  });

  it("does not offer unaffordable or unstocked shop items", async () => {
    const envelope = normalizeCurrentState(await fixture("shop"), TEST_ADAPTER);
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.id)).toEqual([
      "shop:0",
      "shop:leave"
    ]);
  });

  it("generates no actions for unknown states", async () => {
    const envelope = normalizeCurrentState(await fixture("unknown"), TEST_ADAPTER);
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });
});

describe("serializeSts2McpAction", () => {
  it("uses the verified MCP field names", () => {
    expect(serializeSts2McpAction({ kind: "play_card", cardIndex: 2, targetId: "NIBBIT_0" })).toEqual({
      action: "play_card",
      card_index: 2,
      target: "NIBBIT_0"
    });
    expect(serializeSts2McpAction({ kind: "claim_reward", index: 3 })).toEqual({
      action: "claim_reward",
      reward_index: 3,
      index: 3
    });
    expect(serializeSts2McpAction({ kind: "combat_select_card", index: 1 })).toEqual({
      action: "combat_select_card",
      card_index: 1
    });
  });
});
