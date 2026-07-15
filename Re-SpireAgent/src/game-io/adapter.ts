import type { JsonObject, JsonValue } from "../shared/json.js";

export type RawGameState = JsonObject;

export interface GameExecutionResult {
  accepted: boolean;
  response: JsonValue;
}

export interface AdapterCapabilities {
  canReadState: boolean;
  canExecuteActions: boolean;
  canListLegalActions: boolean;
  actionResults: "none" | "partial" | "complete";
}

export interface AdapterDescriptor {
  adapterId: string;
  adapterVersion?: string;
  endpoint: string;
  capabilities: AdapterCapabilities;
}

export interface GameAdapter<TRawState, TAction, TExecutionResult> {
  readCurrentState(): Promise<TRawState>;
  execute(action: TAction): Promise<TExecutionResult>;
  describe(): AdapterDescriptor;
}
