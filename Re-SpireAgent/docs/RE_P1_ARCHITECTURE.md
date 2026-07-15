# RE-P1 Architecture

## Scope

RE-P1 has one responsibility: make one LLM decision against the current MCP state safely executable and completely auditable. It is a new baseline, not a port of the old P8/P9 runtime.

## Planes

1. Integration plane: untrusted MCP JSON and verified REST action serialization.
2. Domain plane: current-state discriminated union and executable action types.
3. Decision plane: deterministic allowed actions, fixed prompts, strict DeepSeek decision.
4. Runtime plane: stale-state validation, execution, settlement, bounded orchestration.
5. Evidence plane: immutable prompt/response/snapshot files and append-only decisions.

Dependencies point inward toward the domain. Raw MCP types do not cross into decision logic.

## Current-State Contract

`NormalizedCurrentState` represents shared current run facts plus exactly one active surface. A combat hand-selection overlay therefore normalizes as `card_selection`, with `actionProtocol="combat"`, even though the underlying `state_type` is combat-related. This prevents the agent from playing a normal card while a modal selection is active.

Critical field loss produces `diagnostics.status="invalid"` and an `UnknownCurrentState`. Non-critical inference is recorded as `degraded`, never hidden. Unknown top-level fields remain visible in diagnostics without automatically invalidating a known state.

## Action Authority

The action builder is deterministic but not strategic. It reconstructs action choices because the current MCP adapter does not list legal actions. DeepSeek sees summaries and returns one ID; the executable payload remains in process memory. A second state read must match both the prompt's pre-state hash and the selected action's source hash. That guard hashes the complete adapter snapshot, while a separate normalized-state hash remains available for semantic audit; unmodeled raw drift therefore stops execution rather than slipping past the normalizer.

## Provider Contract

There is one provider path. It uses JSON mode and an explicit thinking policy, stores the complete request body without headers/secrets, and retries at most once for empty, truncated, invalid-JSON, or invalid-schema output. A retry never repairs or executes the original malformed response.

## Settlement

Successful POST is only partial evidence. The watcher polls for a changed state hash and waits until the normalized state is no longer loading, settling, or transitioning. Timeout is recorded as `executed_unsettled`; the loop stops and never resends the action automatically.

## Explicit Inference

The current MCP shop contract has one exception to raw-only capability discovery. Verified legacy live behavior shows that `proceed` leaves a shop even when `shop.can_proceed` is false. RE-P1 keeps this compatibility fact as `shop.canLeave=true` and records the inference in normalization diagnostics. It should be removed if a future adapter exposes an explicit leave action/capability.

## Public API

`src/index.ts` is the only supported import surface. Internal paths may change without compatibility guarantees.
