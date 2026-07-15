import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { AdapterDescriptor } from "../src/game-io/adapter.js";

export const TEST_ADAPTER: AdapterDescriptor = {
  adapterId: "sts2mcp-rest",
  adapterVersion: "test-fixture",
  endpoint: "http://localhost:15526",
  capabilities: {
    canReadState: true,
    canExecuteActions: true,
    canListLegalActions: false,
    actionResults: "partial"
  }
};

export async function fixture(name: string): Promise<unknown> {
  const url = new URL(`./fixtures/mcp-raw/${name}.json`, import.meta.url);
  return JSON.parse(await readFile(fileURLToPath(url), "utf8")) as unknown;
}
