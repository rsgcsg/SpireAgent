# RE-P1 Architecture

## Scope

RE-P1 has one responsibility: make one LLM decision against the current MCP state safely executable and completely auditable. It is a new baseline, not a port of the old P8/P9 runtime.

## Planes

1. Integration plane: untrusted MCP JSON and verified REST action serialization.
2. Domain plane: semantic-context and interaction-surface discriminated unions plus executable action types.
3. Decision plane: deterministic allowed actions, fixed prompts, strict DeepSeek decision.
4. Runtime plane: stale-state validation, execution, settlement, bounded orchestration.
5. Evidence plane: immutable prompt/response/snapshot files and append-only decisions.

Dependencies point inward toward the domain. Raw MCP types do not cross into decision logic.

## Current-State Contract

`NormalizedCurrentState` represents shared run/player facts, one semantic `context`, and one active interaction `surface`. A combat hand-selection overlay therefore normalizes as `context.kind="combat"` plus `surface.kind="card_selection"`; enemy, intent, round, and turn facts remain visible while action construction exposes only selection actions. The surface's `selectionMode` describes an observed interaction contract, while the verified adapter payload remains inside the local `AllowedAction`.

Context/surface compatibility is checked by the normalizer. A known combat context with an unverified overlay becomes `combat + unsupported`, retaining audit facts but exposing no actions. A newly observed event ID using the existing indexed-option protocol remains `event + option_choice`; identity is data, not a new protocol.

The normalizer remains a set of explicit context and surface decoders rather than a generic plugin registry. At RE-P1 scale, a registry would obscure precedence and add configuration machinery without reducing a verified decoder's responsibility. The precedence is documented in `normalizeContext` and overlays are resolved separately by `normalizeSurface`; split those functions into modules only when a future protocol makes their local ownership unclear.

Critical field loss or an unknown potentially action-relevant nested field produces `diagnostics.status="invalid"`, an unknown context, and an unsupported surface. Harmless nested drift remains visible in diagnostics without automatically invalidating a known state. Non-critical inference is recorded as `degraded`, never hidden.

## Action Authority

The action builder is deterministic but not strategic. It dispatches on the active surface and consults context only for facts a protocol needs, such as combat targets. It reconstructs action choices because the current MCP adapter does not list legal actions. DeepSeek sees summaries and returns one ID; the executable payload remains in process memory. A second state read must match both the prompt's pre-state hash and the selected action's source hash. That guard hashes the complete adapter snapshot, while a separate normalized-state hash remains available for semantic audit; unmodeled raw drift therefore stops execution rather than slipping past the normalizer.

RE-P1 deliberately retains one small executable-action union and one adapter serializer instead of adding a duplicate `DomainOperation` plus binding layer. The union is local-only, never model-visible, and every member maps directly to a verified MCP request. A second mirror type would not remove adapter coupling yet; introduce it only if multiple adapters or materially different execution backends appear.

## Provider Contract

There is one provider path. It uses JSON mode and an explicit thinking policy, stores the complete request body without headers/secrets, and retries at most once for empty, truncated, invalid-JSON, or invalid-schema output. A retry never repairs or executes the original malformed response.

## Settlement

Successful POST is only partial evidence. The watcher polls for a changed state hash and requires two identical, non-transitional observations before settlement. Timeout is recorded as `executed_unsettled`; the loop stops and never resends the action automatically. Action-capable CLI commands also acquire an exclusive local lock, so two RE-P1 processes cannot concurrently drive the same MCP session.

## Run Boundaries

`agent:run` is a one-game command, not a menu automation loop. It stops and records a non-executed boundary when the next state is `game_over` or a top-level `menu`; it therefore cannot ask the model to restart a completed run. The lower-level `agent:tick` command intentionally retains the ability to exercise a supported menu action when a developer explicitly requests that protocol test.

## Explicit Inference

The current MCP shop contract has one exception to raw-only capability discovery. Verified legacy live behavior shows that `proceed` leaves a shop even when `shop.can_proceed` is false. RE-P1 keeps this compatibility fact as `shop.canLeave=true` and records the inference in normalization diagnostics. It should be removed if a future adapter exposes an explicit leave action/capability.

## Public API

`src/index.ts` is the only supported import surface. Internal paths may change without compatibility guarantees.

## Schema Compatibility

New decisions use normalized-state and prompt schema version 2 and decision-record version 2. Existing v1 JSONL remains append-only historical evidence and replay-readable as stored JSON, but it is not silently reinterpreted as a v2 context/surface projection.
