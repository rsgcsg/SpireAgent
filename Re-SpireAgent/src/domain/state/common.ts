import type { CardSnapshot, PlayerSnapshot } from "./entities.js";

export const NORMALIZED_STATE_SCHEMA_VERSION = 32 as const;

export type StateStability =
  | "actionable"
  | "non_actionable"
  | "settling"
  | "invalid";

export type ActionAuthority = "player_environment" | "none";

export interface RunSnapshot {
  runId?: string;
  characterId?: string;
  act?: number;
  actId?: string;
  actName?: string;
  floor?: number;
  ascension?: number;
  seed?: string;
  bosses?: Array<{ id: string; name?: string; order: number }>;
  modifiers?: Array<{
    id: string;
    name?: string;
    description?: string;
    keywords: Array<{ name: string; description?: string }>;
    cardPreviews?: CardSnapshot[];
  }>;
}

/** Re's consumer projection. Game truth and executable bindings remain in C. */
export interface NormalizedStateBase {
  normalizedSchemaVersion: typeof NORMALIZED_STATE_SCHEMA_VERSION;
  sourceStateType: string;
  stability: StateStability;
  actionAuthority: ActionAuthority;
  run?: RunSnapshot;
  player?: PlayerSnapshot;
}
