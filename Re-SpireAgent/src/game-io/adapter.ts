import type { JsonObject, JsonValue } from "../shared/json.js";

export type RawGameState = JsonObject;

export interface GameExecutionResult {
  accepted: boolean;
  outcome?: "accepted" | "rejected" | "unknown";
  rejectionCode?: string;
  settlementAuthority?: "adapter_confirmed" | "client_observation_required";
  confirmedStateToken?: string;
  response: JsonValue;
}

export interface AdapterCapabilities {
  canReadState: boolean;
  canExecuteActions: boolean;
  canListLegalActions: boolean;
  actionResults: "none" | "partial" | "complete";
  legalActionAuthority?: "player_environment";
  protocols?: Array<"player_environment">;
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
