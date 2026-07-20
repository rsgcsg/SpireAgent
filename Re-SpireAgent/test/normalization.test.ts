import { describe, expect, it } from "vitest";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";
import { buildAllowedActions } from "../src/domain/actions/buildAllowedActions.js";
import { fixture, TEST_ADAPTER } from "./helpers.js";

describe("normalizeCurrentState", () => {
  const cases = [
    ["combat", "combat", "combat_turn"],
    ["card-reward", "card_reward", "card_reward"],
    ["rewards", "rewards", "reward_claim"],
    ["map", "map", "map_navigation"],
    ["rest", "rest", "option_choice"],
    ["event", "event", "option_choice"],
    ["shop", "shop", "shop_interaction"],
    ["treasure", "treasure", "treasure_claim"],
    ["card-select", "unknown", "card_selection"],
    ["hand-select", "combat", "card_selection"],
    ["crystal-sphere", "crystal_sphere", "grid_interaction"],
    ["menu", "menu", "menu_choice"],
    ["game-over", "run_ended", "menu_choice"]
  ] as const;

  it.each(cases)("normalizes observed %s fixture as %s + %s", async (name, contextKind, surfaceKind) => {
    const envelope = normalizeCurrentState(await fixture(name), TEST_ADAPTER, "2026-01-01T00:00:00.000Z");
    expect(envelope.currentState.context.kind).toBe(contextKind);
    expect(envelope.currentState.surface.kind).toBe(surfaceKind);
    expect(envelope.envelopeSchemaVersion).toBe(2);
    expect(envelope.currentState.stability).toBe("actionable");
    expect(envelope.diagnostics.status).not.toBe("invalid");
    expect(JSON.stringify(envelope.currentState)).not.toContain('"raw"');
    expect(envelope.stateHash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(envelope.normalizedStateHash).toMatch(/^sha256:[a-f0-9]{64}$/u);
  });

  it("gives active hand selection precedence over the underlying battle", async () => {
    const envelope = normalizeCurrentState(await fixture("hand-select"), TEST_ADAPTER);
    expect(envelope.currentState.context.kind).toBe("combat");
    expect(envelope.currentState.surface.kind).toBe("card_selection");
    if (envelope.currentState.surface.kind !== "card_selection") throw new Error("unexpected state");
    expect(envelope.currentState.surface.selectionMode).toBe("combat");
    expect(envelope.currentState.surface.options).toHaveLength(2);
    if (envelope.currentState.context.kind !== "combat") throw new Error("missing combat context");
    expect(envelope.currentState.context.enemies).toHaveLength(1);
  });

  it("preserves player-visible card-selection preview semantics", async () => {
    const raw = await fixture("card-select") as Record<string, any>;
    raw.card_select.preview_showing = true;
    raw.card_select.preview_cards = [
      { ...raw.card_select.cards[0], name: "Strike+", is_upgraded: true, description: "Deal 9 damage." }
    ];
    raw.card_select.can_confirm = true;
    const envelope = normalizeCurrentState(raw, TEST_ADAPTER);

    expect(envelope.currentState.normalizedSchemaVersion).toBe(25);
    expect(envelope.currentState.surface).toMatchObject({
      kind: "card_selection",
      previewShowing: true,
      previewCards: [{ name: "Strike+", upgraded: true, description: "Deal 9 damage." }],
      canConfirm: true
    });
    expect(envelope.diagnostics.unknownFields).not.toContain("card_select.preview_cards");
  });

  it("treats a new event identity as data when it keeps the verified option protocol", async () => {
    const raw = await fixture("event") as Record<string, any>;
    raw.event.event_id = "unseen_event_id";
    raw.event.event_name = "Unseen Event";
    const envelope = normalizeCurrentState(raw, TEST_ADAPTER);
    expect(envelope.currentState.context).toMatchObject({ kind: "event", eventId: "unseen_event_id" });
    expect(envelope.currentState.surface).toMatchObject({ kind: "option_choice", protocol: "event" });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).not.toEqual([]);
  });

  it("preserves a known combat context while failing closed on an unsupported overlay", async () => {
    const raw = await fixture("combat") as Record<string, unknown>;
    raw.bundle_select = { bundles: [] };
    const envelope = normalizeCurrentState(raw, TEST_ADAPTER);
    expect(envelope.currentState.context.kind).toBe("combat");
    expect(envelope.currentState.surface).toMatchObject({ kind: "unsupported", classification: "unknown_surface" });
    expect(buildAllowedActions(envelope.currentState, envelope.stateHash)).toEqual([]);
  });

  it("reports harmless nested drift without inventing a new protocol", async () => {
    const raw = await fixture("combat") as Record<string, any>;
    raw.battle.cosmetic_note = "future display only";
    const envelope = normalizeCurrentState(raw, TEST_ADAPTER);
    expect(envelope.diagnostics.unknownFields).toContain("battle.cosmetic_note");
    expect(envelope.diagnostics.status).not.toBe("invalid");
    expect(envelope.currentState.surface.kind).toBe("combat_turn");
  });

  it("fails closed on an unknown nested field that could alter action protocol", async () => {
    const raw = await fixture("combat") as Record<string, any>;
    raw.battle.targeting_protocol = "future-targeting";
    const envelope = normalizeCurrentState(raw, TEST_ADAPTER);
    expect(envelope.diagnostics.invalidFields.map((field) => field.path)).toContain("battle.targeting_protocol");
    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.currentState.surface.kind).toBe("unsupported");
  });

  it.each(["monster", "elite"])("treats the observed post-combat %s shell as a non-decision transition", async (stateType) => {
    const raw = await fixture("post-combat-settling") as Record<string, unknown>;
    raw.state_type = stateType;
    const envelope = normalizeCurrentState(raw, TEST_ADAPTER);
    expect(envelope.currentState.context).toEqual({ kind: "combat_transition", phase: "resolution" });
    expect(envelope.currentState.surface.kind).toBe("no_action");
    expect(envelope.currentState.stability).toBe("transitioning");
    expect(envelope.diagnostics.status).toBe("ok");
  });

  it("fails closed on an unknown state type", async () => {
    const envelope = normalizeCurrentState(await fixture("unknown"), TEST_ADAPTER);
    expect(envelope.currentState.context.kind).toBe("unknown");
    expect(envelope.currentState.surface.kind).toBe("unsupported");
    expect(envelope.currentState.stability).toBe("unknown");
    expect(envelope.diagnostics.status).toBe("degraded");
  });

  it("fails closed when a critical observed field is missing", async () => {
    const raw = await fixture("combat") as Record<string, any>;
    delete raw.player.hp;
    const envelope = normalizeCurrentState(raw, TEST_ADAPTER);
    expect(envelope.currentState.context.kind).toBe("unknown");
    expect(envelope.currentState.surface.kind).toBe("unsupported");
    expect(envelope.currentState.stability).toBe("invalid");
    expect(envelope.diagnostics.missingRequiredFields).toContain("player.hp");
  });

  it("produces the same hash for semantically identical captures", async () => {
    const raw = await fixture("combat");
    const first = normalizeCurrentState(raw, TEST_ADAPTER, "2026-01-01T00:00:00.000Z");
    const second = normalizeCurrentState(raw, TEST_ADAPTER, "2026-01-02T00:00:00.000Z");
    expect(second.stateHash).toBe(first.stateHash);
    expect(second.normalizedStateHash).toBe(first.normalizedStateHash);
  });

  it("detects raw adapter drift even when the normalized projection is unchanged", async () => {
    const raw = await fixture("combat") as Record<string, unknown>;
    const first = normalizeCurrentState(raw, TEST_ADAPTER);
    const second = normalizeCurrentState({ ...raw, adapter_observation_nonce: 2 }, TEST_ADAPTER);
    expect(second.currentState).toEqual(first.currentState);
    expect(second.normalizedStateHash).toBe(first.normalizedStateHash);
    expect(second.stateHash).not.toBe(first.stateHash);
  });
});
