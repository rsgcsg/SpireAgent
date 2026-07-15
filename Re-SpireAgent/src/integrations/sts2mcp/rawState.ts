import type { RawGameState } from "../../game-io/adapter.js";

// The adapter response is untrusted JSON. Strong game semantics begin only after normalization.
export type Sts2McpRawState = RawGameState;
