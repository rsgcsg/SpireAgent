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

`NormalizedCurrentState` represents shared run/player facts, one semantic
`context`, one active interaction `surface`, and explicit `actionAuthority`.
A combat hand-selection overlay therefore normalizes as
`context.kind="combat"` plus `surface.kind="card_selection"`; authority says
whether executable actions are reconstructed locally, Bridge-advertised, or
absent. No one discriminator represents the whole state.

Context/surface compatibility is checked by the normalizer. A known combat context with an unverified overlay becomes `combat + unsupported`, retaining audit facts but exposing no actions. A newly observed event ID using the existing indexed-option protocol remains `event + option_choice`; identity is data, not a new protocol.

Exactly one active surface owns executable actions. A blocking overlay replaces
the active surface while preserving context; an underlying surface is suspended
and contributes no actions. Bridge owns overlay precedence and must resolve it
before serialization. Re-SpireAgent validates the resulting single-owner
contract instead of recursively composing executable surfaces.

The normalizer remains a set of explicit context and surface decoders rather than a generic plugin registry. At RE-P1 scale, a registry would obscure precedence and add configuration machinery without reducing a verified decoder's responsibility. The precedence is documented in `normalizeContext` and overlays are resolved separately by `normalizeSurface`; split those functions into modules only when a future protocol makes their local ownership unclear.

Critical field loss or an unknown potentially action-relevant nested field produces `diagnostics.status="invalid"`, an unknown context, and an unsupported surface. Harmless nested drift remains visible in diagnostics without automatically invalidating a known state. Non-critical inference is recorded as `degraded`, never hidden.

Read-only inspection is a separate evidence path, not an executable surface or
an arbitrary raw-object escape hatch. The fixed `run_deck` and `combat_piles`
results are state-bound, typed, visibility-labeled, separately recorded, and
excluded from the command ledger. Immediate context keeps compact pile counts
while inspection supplies player-visible unordered contents. Hidden draw order
and RNG are never normalized.

Bridge v2 structured diagnostics preserve both severity and operational effect.
Severity alone cannot grant or remove action authority; explicit readiness,
completeness, and action-suppression semantics remain authoritative. Re
preserves unknown diagnostic codes for audit when their structure is valid and
rejects malformed or action-contradicting effects.

Card-bearing surfaces are modeled by input ownership rather than payload
similarity. Combat pile, combat hand, generated-card, reward-card, and deck
enchant selection stay distinct because their card instances, readiness,
action grammar, and completion witnesses differ. Shared serializers and entity
binding checks are internal implementation laws, not a universal wire Surface.
Deck enchant and merchant removal also share one bounded-selection consistency
validator. It checks limits, selected membership, and visible identity only;
purpose, eligibility, action authority, commit effects, and completion remain
surface-specific.

## Action Authority

The action builder is deterministic but not strategic. It dispatches on the
active surface and first enforces state-level authority. Legacy v1 states may
reconstruct choices. Qualified Bridge deck-enchant/event/combat/card-reward states import
only current state-bound opaque actions. These authority sources never merge.

DeepSeek sees summaries and returns one ID; the executable payload remains in process memory. A second state read must match both the prompt's pre-state hash and the selected action's source hash. That guard hashes the complete adapter snapshot, while a separate normalized-state hash remains available for semantic audit; unmodeled raw drift therefore stops execution rather than slipping past the normalizer.

RE-P1 deliberately retains one small executable-action union and one adapter serializer instead of adding a duplicate `DomainOperation` plus binding layer. The union is local-only, never model-visible, and every member maps directly to a verified MCP request. A second mirror type would not remove adapter coupling yet; introduce it only if multiple adapters or materially different execution backends appear.

## Provider Contract

There is one provider path. It uses JSON mode and an explicit thinking policy, stores the complete request body without headers/secrets, and retries at most once for empty, truncated, invalid-JSON, or invalid-schema output. A retry never repairs or executes the original malformed response.

## Settlement

For v1, successful POST is only partial evidence. The watcher polls for a changed state hash and requires two identical, non-transitional observations before settlement. For v2, the adapter first verifies the submitted command identity and polls the bridge's action-specific lifecycle. Only `completed/confirmed` reaches the next-checkpoint watcher. `rejected/not_applied` is an execution rejection; `failed/unknown`, `timed_out/unknown`, transport uncertainty, or inconsistent command identity is recorded as unsettled/unknown and stops without retry. Settlement budgets follow semantic action lifecycles: opaque and legacy end-turn actions share the longer end-turn window, map navigation uses a separate room-transition window, and ordinary actions retain the default window. Longer windows never convert `loading`, `settling`, or `transitioning` into settled success; two identical complete snapshots are still required. If a confirmed Bridge action reaches a different valid state but that next decision checkpoint is still transitional or not stable twice when the timeout expires, Re records `executed_checkpoint_pending` and starts the next tick with a fresh read. It does not retry the action. v1 acknowledgement, unchanged state, read failure, or unknown Bridge outcome remain terminal. If the game advances while a coherent state plus read-only inspection sidecars are being captured, the adapter returns a typed transient observation error rather than mixed evidence. Settlement polling may retry that observation within its existing timeout. A pre-decision occurrence aborts and records that tick without building a prompt or executing, but does not terminate a bounded run; its next tick must acquire a fresh coherent snapshot. Pre-execution occurrences remain terminal and fail closed.

The bounded orchestrator also records and stops on the second occurrence of an
identical pre-state/action/post-state transition. This catches deterministic
short cycles such as select/cancel loops without treating repeated action kinds,
normal combat damage, or strategically debatable decisions as program errors.

Action-capable CLI commands also acquire an exclusive local lock, so two RE-P1 processes cannot concurrently drive the same MCP session.

## Run Boundaries

`agent:run` is a one-game command, not a menu automation loop. It may finish
the current run's Bridge-owned game-over intro/summary/return lifecycle, but it
stops and records a non-executed boundary at the next top-level `menu`; it
therefore cannot ask the model to continue or start another run. The lower-level
`agent:tick` command intentionally retains the ability to exercise a supported
menu action when a developer explicitly requests that protocol test.

## Explicit Inference

The legacy v1 shop fallback has one exception to raw-only capability discovery.
Verified legacy behavior shows that `proceed` leaves a shop even when
`shop.can_proceed` is false, so that fallback records an explicit inference.
Bridge v2 preview.14 no longer uses it: `shop_room` advertises an exact opaque
Proceed action, while `shop_inventory` owns purchases and close. A v2-owned
shop never imports the v1 inference or its actions.

## Public API

`src/index.ts` is the only supported import surface. Internal paths may change without compatibility guarantees.

## Schema Compatibility

New decisions currently use normalized-state schema version 25, Prompt schema
version 3, and decision-record version 2. The normalized schema has continued
to evolve as current-build Surface and visible-state contracts were added;
Prompt v3 retains explicit action authority in the context/surface split.
Older JSONL remains append-only historical evidence and replay-readable as
stored JSON, but it is not silently reinterpreted as the current projection.
