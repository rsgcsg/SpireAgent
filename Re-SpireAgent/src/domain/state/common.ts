import type { PlayerSnapshot } from "./entities.js";

export const NORMALIZED_STATE_SCHEMA_VERSION = 2 as const;

export type StateStability =
  | "actionable"
  | "non_actionable"
  | "loading"
  | "settling"
  | "transitioning"
  | "invalid"
  | "unknown";

export interface RunSnapshot {
  runId?: string;
  characterId?: string;
  act?: number;
  floor?: number;
  ascension?: number;
  seed?: string;
}

export interface NormalizedStateBase {
  normalizedSchemaVersion: typeof NORMALIZED_STATE_SCHEMA_VERSION;
  sourceStateType: string;
  stability: StateStability;
  run?: RunSnapshot;
  player?: PlayerSnapshot;
}
