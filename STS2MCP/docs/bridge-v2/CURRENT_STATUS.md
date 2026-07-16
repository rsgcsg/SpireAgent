# Bridge v2 Current Status

Status date: 2026-07-16

## Current Phase

Protocol core plus three exact-build, typed vertical slices. Runtime qualification
is intentionally tracked per surface rather than inferred from compilation.

## Implemented

- Protocol `2.0-preview.2` source contract with independent typed `context` and
  typed `surface` objects.
- Explicit ordered surface-provider registry with ambiguous multi-match
  rejection.
- Exact version/commit/main-assembly identity, state-scoped opaque actions,
  execution-time revalidation, idempotent request IDs, and action-specific
  completion.
- `deck_enchant_selection`: exact semantics, selecting/preview stages, opaque
  actions, and organic Bridge plus Re-SpireAgent lifecycle evidence.
- `event_option`: event narrative in `context`; visible blocking options and
  state-bound choose/proceed actions in `surface`.
- `combat_turn`: player/enemy/hand/resource semantics in `context`; immediate
  play-card, potion, and end-turn protocol in `surface`/`legal_actions`.
- Re-SpireAgent strict decoding/projection for all three source contracts.
- Client state identity is displayed as `context.kind + surface.kind +
  actionAuthority`; no single discriminator is treated as the whole state.
- Bridge tests: 23/23. Re-SpireAgent tests: 71/71 at this revision.

## Qualification Matrix

| Surface | Build/contract | Re fixture | Organic Bridge | Organic Re lifecycle |
|---|---|---|---|---|
| `deck_enchant_selection` | pass | pass | pass | pass |
| `event_option` | pass | pass | pass | pass |
| `combat_turn` | pass | pass | pass | pass |

The fresh event and combat lifecycles used `2.0-preview.2` on exact game
identity `v0.108.0|58694f64|-2044609792`. The event smoke proves one ordinary
`SUNKEN_STATUE` option choice and its resulting proceed state. The combat smoke
proves one player-phase targeted-card lifecycle against a visible enemy. Neither
proves ancient dialogue, event-specific secondary overlays, combat-selection
overlays, every card target type, or every enemy-intent representation.

## Current Blocker

All three implemented surfaces now have bounded organic Bridge and
Re-SpireAgent lifecycle evidence. The next blocker is not a fourth action
surface: it is an explicit audit of cross-surface composition, read-only
inspection, structured diagnostics, and diversity limits before widening scope.

## Next Step

1. Audit the three qualified slices together; retain their per-surface limits
   instead of promoting them to generic game coverage.
2. Keep ancient dialogue, combat card-selection overlays, post-close deck
   inspection, and every unlisted surface fail-closed until independently
   audited.

See [the player-visible semantics RFC](PLAYER_VISIBLE_SEMANTICS_PROTOCOL_RFC.md)
for the long-term layering and explicit non-goals.
