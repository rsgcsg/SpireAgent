# Bridge v2 Current Status

Status date: 2026-07-16

## Current Phase

Three exact-build, typed, organically qualified vertical slices plus a completed
composition/inspection/diagnostics architecture audit. Runtime qualification is
intentionally tracked per surface and action shape rather than inferred from
compilation.

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
Re-SpireAgent lifecycle evidence. The cross-surface composition, read-only
inspection, structured-diagnostics, and diversity audit is complete.
Implementation blockers before the fourth surface are a behavior-preserving
active-surface resolver and typed diagnostics. The inspection contract is
designed but remains future infrastructure, not an implemented capability.

## Next Step

1. Add typed diagnostics alongside compatibility warnings without changing
   action authority.
2. Centralize active-surface resolution without adding a new surface.
3. Implement the next bounded slice as
   `reward_flow + card_reward_selection`, preserving every visible alternative
   instead of assuming the first alternative means skip.
4. Keep inspection and every unlisted surface fail-closed until independently
   implemented and qualified.

See [the player-visible semantics RFC](PLAYER_VISIBLE_SEMANTICS_PROTOCOL_RFC.md)
and [the three-surface audit](COMPOSITION_INSPECTION_DIAGNOSTICS_AUDIT_2026-07-16.md)
for the long-term layering, next-surface decision, and explicit non-goals.
