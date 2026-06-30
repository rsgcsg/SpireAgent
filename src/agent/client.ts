import type { AgentAction, JsonRecord } from "./types.js";
import type { AdapterCapabilities } from "../domain/types.js";
import { getSts2McpRestCapabilities } from "../adapters/sts2mcp/capabilities.js";

export interface StateSource {
  getState(format?: "json" | "markdown"): Promise<unknown>;
}

export interface ActionExecutor {
  execute(action: AgentAction): Promise<unknown>;
}

export interface GameClient extends StateSource, ActionExecutor {}

export class RestGameClient implements GameClient {
  constructor(private readonly baseUrl = process.env.STS2_API_URL ?? "http://localhost:15526") {}

  capabilities(): AdapterCapabilities {
    return getSts2McpRestCapabilities();
  }

  async getState(format: "json" | "markdown" = "json"): Promise<unknown> {
    const url = `${this.baseUrl}/api/v1/singleplayer?format=${encodeURIComponent(format)}`;
    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new Error(`GET ${url} failed: ${errorMessage(error)}. Is the STS2 MCP/REST service running?`);
    }
    if (!response.ok) {
      throw new Error(`GET ${url} failed with HTTP ${response.status}`);
    }

    if (format === "markdown") {
      return response.text();
    }

    return response.json();
  }

  async execute(action: AgentAction): Promise<unknown> {
    const body = toRestBody(action);
    const url = `${this.baseUrl}/api/v1/singleplayer`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch (error) {
      throw new Error(`POST ${url} failed: ${errorMessage(error)}. Is the STS2 MCP/REST service running?`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`POST ${url} failed with HTTP ${response.status}: ${text}`);
    }

    const payload = (await response.json().catch(() => ({}))) as JsonRecord;
    if (payload.status === "error" || typeof payload.error === "string") {
      throw new Error(`Game action failed: ${String(payload.message ?? payload.error ?? "unknown error")}`);
    }

    return payload;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function toRestBody(action: AgentAction): JsonRecord {
  switch (action.kind) {
    case "play_card":
      return {
        action: "play_card",
        card_index: action.cardIndex,
        ...(action.target ? { target: action.target } : {})
      };
    case "end_turn":
      return { action: "end_turn" };
    case "use_potion":
      return { action: "use_potion", slot: action.slot, ...(action.target ? { target: action.target } : {}) };
    case "discard_potion":
      return { action: "discard_potion", slot: action.slot };
    case "choose_map_node":
      return { action: "choose_map_node", index: action.index };
    case "choose_rest_option":
      return { action: "choose_rest_option", index: action.index };
    case "proceed":
      return { action: "proceed" };
    case "claim_reward":
      return { action: "claim_reward", reward_index: action.index, index: action.index };
    case "claim_treasure_relic":
      return { action: "claim_treasure_relic", index: action.index };
    case "select_card_reward":
      return { action: "select_card_reward", card_index: action.index };
    case "skip_card_reward":
      return { action: "skip_card_reward" };
    case "event_choose_option":
      return { action: "choose_event_option", index: action.index };
    case "shop_purchase":
      return { action: "shop_purchase", index: action.index };
    case "select_card":
      return { action: "select_card", index: action.index };
    case "combat_select_card":
      return { action: "combat_select_card", card_index: action.index };
    case "confirm_selection":
      return { action: "confirm_selection" };
    case "combat_confirm_selection":
      return { action: "combat_confirm_selection" };
    case "cancel_selection":
      return { action: "cancel_selection" };
    case "bundle_select":
      return { action: "select_bundle", index: action.index };
    case "bundle_confirm_selection":
      return { action: "confirm_bundle_selection" };
    case "bundle_cancel_selection":
      return { action: "cancel_bundle_selection" };
    case "menu_select":
      return { action: "menu_select", option: action.option, ...(action.seed ? { seed: action.seed } : {}) };
  }
}
