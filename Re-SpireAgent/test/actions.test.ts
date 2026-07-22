import { describe, expect, it } from "vitest";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
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

  it("uses a verified standard card-selection surface without inventing its semantic origin", async () => {
    const envelope = normalizeCurrentState(await fixture("card-select"), TEST_ADAPTER);
    expect(envelope.currentState.context.kind).toBe("unknown");
    expect(envelope.currentState.surface).toMatchObject({ kind: "card_selection", selectionMode: "standard" });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.id)).toEqual([
      "card-selection:0"
    ]);
  });

  it("does not invent a generic proceed action for an event option surface", async () => {
    const raw = await fixture("event") as Record<string, any>;
    raw.event.can_proceed = true;
    const envelope = normalizeCurrentState(raw, TEST_ADAPTER);
    const actions = buildAllowedActions(envelope.currentState, envelope.stateHash);
    expect(actions.some((action) => action.id === "event:proceed")).toBe(false);
  });

  it("only exposes confirmation after MCP reports a valid standard selection without selected-id metadata", async () => {
    const envelope = normalizeCurrentState(await fixture("card-select-confirm"), TEST_ADAPTER);
    expect(envelope.currentState.surface).toMatchObject({ kind: "card_selection", selectionMode: "standard", canConfirm: true });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash).map((action) => action.id)).toEqual([
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
