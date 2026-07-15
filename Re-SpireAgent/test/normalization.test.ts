import { describe, expect, it } from "vitest";
import { normalizeCurrentState } from "../src/normalization/normalizeCurrentState.js";
import { fixture, TEST_ADAPTER } from "./helpers.js";

describe("normalizeCurrentState", () => {
  const cases = [
    ["combat", "combat"],
    ["card-reward", "card_reward"],
    ["rewards", "rewards"],
    ["map", "map"],
    ["rest", "rest"],
    ["event", "event"],
    ["shop", "shop"],
    ["treasure", "treasure"],
    ["card-select", "card_selection"],
    ["hand-select", "card_selection"],
    ["crystal-sphere", "crystal_sphere"],
    ["menu", "menu"],
    ["game-over", "game_over"]
  ] as const;

  it.each(cases)("normalizes observed %s fixture as %s", async (name, kind) => {
    const envelope = normalizeCurrentState(await fixture(name), TEST_ADAPTER, "2026-01-01T00:00:00.000Z");
    expect(envelope.currentState.kind).toBe(kind);
    expect(envelope.currentState.stability).toBe("actionable");
    expect(envelope.diagnostics.status).not.toBe("invalid");
    expect(JSON.stringify(envelope.currentState)).not.toContain('"raw"');
    expect(envelope.stateHash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(envelope.normalizedStateHash).toMatch(/^sha256:[a-f0-9]{64}$/u);
  });

  it("gives active hand selection precedence over the underlying battle", async () => {
    const envelope = normalizeCurrentState(await fixture("hand-select"), TEST_ADAPTER);
    expect(envelope.currentState.kind).toBe("card_selection");
    if (envelope.currentState.kind !== "card_selection") throw new Error("unexpected state");
    expect(envelope.currentState.cardSelection.actionProtocol).toBe("combat");
    expect(envelope.currentState.cardSelection.options).toHaveLength(2);
  });

  it.each(["monster", "elite"])("treats the observed post-combat %s shell as a non-decision transition", async (stateType) => {
    const raw = await fixture("post-combat-settling") as Record<string, unknown>;
    raw.state_type = stateType;
    const envelope = normalizeCurrentState(raw, TEST_ADAPTER);
    expect(envelope.currentState.kind).toBe("transition");
    expect(envelope.currentState.stability).toBe("transitioning");
    expect(envelope.diagnostics.status).toBe("ok");
  });

  it("fails closed on an unknown state type", async () => {
    const envelope = normalizeCurrentState(await fixture("unknown"), TEST_ADAPTER);
    expect(envelope.currentState.kind).toBe("unknown");
    expect(envelope.currentState.stability).toBe("unknown");
    expect(envelope.diagnostics.status).toBe("degraded");
  });

  it("fails closed when a critical observed field is missing", async () => {
    const raw = await fixture("combat") as Record<string, any>;
    delete raw.player.hp;
    const envelope = normalizeCurrentState(raw, TEST_ADAPTER);
    expect(envelope.currentState.kind).toBe("unknown");
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
