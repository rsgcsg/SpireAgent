# Bridge v2 Current Status

Status date: 2026-07-16

## Current Phase

Protocol core plus the first exact-version game-bound vertical slice.

## Implemented

- Clean import of upstream commit `20eadebde358a37cca41f8b38728099e6d0d19db`.
- v1 build compatibility fixes for the installed Slay the Spire 2 `v0.108.0` API.
- `/api/v2/capabilities`, `/api/v2/state`, `/api/v2/commands`, and command polling.
- Stable semantic `state_id` and process-scoped object identities.
- State-scoped opaque legal actions; v2 accepts no index or arbitrary target.
- Idempotent request IDs and explicit command events.
- Action-specific completion predicates; unexplained transitions become unknown
  outcomes rather than successful completions.
- Exact version/commit/main-assembly identity and fail-closed action execution.
- Singleplayer `NDeckEnchantSelectScreen` support, including enchantment text,
  min/max selection, selected cards, selecting/preview stage, and correct
  preview confirm/cancel actions.
- Thin Python MCP tools for v2.
- Loopback-only browser Origin policy.
- 21 pure protocol/runtime/security tests.
- Installed-build deck enchant smoke on `v0.108.0`: exact build identity,
  player-visible semantics, stale rejection, idempotency, select/preview/cancel,
  select/preview/confirm, and action-specific completion all passed.

## Not Yet Qualified

- Every v2 surface other than deck enchant selection is unsupported and returns
  no legal actions.
- Multiplayer v2 is intentionally unsupported.
- `Re-SpireAgent` has not yet received a v2 decoder/domain adapter.

## Current Blocker

No blocker remains for the deck enchant vertical slice. Broader v2 adoption is
blocked by missing per-surface game-fact adapters and the missing Re-SpireAgent
v2 decoder/projector, not by this slice's command contract.

## Next Step

1. Add a separate Re-SpireAgent v2 decoder/projector for
   `deck_enchant_selection`, with one executor during dual-read.
2. Choose the next game surface from observed client failures, audit its exact
   game facts, and implement another narrow provider.
3. Do not widen v2 support by reusing v1 indices or generic confirm fallbacks.

Do not mark other surfaces supported based on v1 behavior or decompilation alone.
