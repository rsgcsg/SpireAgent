import type { JsonObject, JsonValue } from "../shared/json.js";

export type RawGameState = JsonObject;

export interface GameExecutionResult {
  accepted: boolean;
  outcome?: "accepted" | "rejected" | "unknown";
  response: JsonValue;
}

export interface AdapterCapabilities {
  canReadState: boolean;
  canExecuteActions: boolean;
  canListLegalActions: boolean;
  actionResults: "none" | "partial" | "complete";
  legalActionAuthority?: "local_reconstruction" | "bridge_advertised" | "mixed";
  protocols?: Array<"sts2mcp_v1" | "bridge_v2">;
}

export interface AdapterDescriptor {
  adapterId: string;
  adapterVersion?: string;
  endpoint: string;
  capabilities: AdapterCapabilities;
  negotiated?: JsonObject;
}

export interface GameAdapter<TRawState, TAction, TExecutionResult> {
  readCurrentState(): Promise<TRawState>;
  execute(action: TAction): Promise<TExecutionResult>;
  describe(): AdapterDescriptor;
}
