import { describe, expect, it } from "vitest";
import { Sts2McpRestAdapter } from "../src/integrations/sts2mcp/restAdapter.js";

describe("Sts2McpRestAdapter", () => {
  it("reads the verified singleplayer JSON endpoint", async () => {
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    const adapter = new Sts2McpRestAdapter("http://adapter.test", 1_000, async (input, init) => {
      calls.push({ input: String(input), ...(init ? { init } : {}) });
      return new Response(JSON.stringify({ state_type: "menu", options: [] }), { status: 200 });
    });

    await expect(adapter.readCurrentState()).resolves.toMatchObject({ state_type: "menu" });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.input).toBe("http://adapter.test/api/v1/singleplayer?format=json");
    expect(calls[0]?.init?.method).toBe("GET");
  });

  it("serializes only the local executable action and returns the adapter receipt", async () => {
    let sentBody: unknown;
    const adapter = new Sts2McpRestAdapter("http://adapter.test", 1_000, async (_input, init) => {
      sentBody = JSON.parse(String(init?.body)) as unknown;
      return new Response(JSON.stringify({ status: "ok", action: "play_card" }), { status: 200 });
    });

    await expect(adapter.execute({ kind: "play_card", cardIndex: 2, targetId: "TARGET_0" })).resolves.toEqual({
      accepted: true,
      outcome: "accepted",
      settlementAuthority: "client_observation_required",
      response: { status: "ok", action: "play_card" }
    });
    expect(sentBody).toEqual({ action: "play_card", card_index: 2, target: "TARGET_0" });
  });

  it("fails closed when MCP rejects an action", async () => {
    const adapter = new Sts2McpRestAdapter("http://adapter.test", 1_000, async () =>
      new Response(JSON.stringify({ status: "error", error: "stale card index" }), { status: 200 })
    );

    await expect(adapter.execute({ kind: "end_turn" })).rejects.toThrow("MCP rejected action");
  });
});
