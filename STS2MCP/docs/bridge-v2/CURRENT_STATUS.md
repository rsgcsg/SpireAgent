# Bridge v2 Current Status

Status date: 2026-07-16

## Current Phase

Protocol `2.0-preview.3` is implemented in source. Three exact-build surfaces
have bounded organic Bridge and Re-SpireAgent lifecycle evidence. A fourth,
`reward_flow + card_reward_selection`, is exact-source and fixture qualified but
has not yet been installed and exercised in a fresh game process.

## Implemented

- Independent typed `context`, active `surface`, and client action authority.
- `ActiveSurfaceResolver`: the top blocking overlay exclusively selects the
  overlay provider family; otherwise room/turn providers are considered.
  Multiple matches in the active family fail closed.
- Typed diagnostics with separate severity, operational effect, recovery hint,
  optional path/visibility class, and action-critical status. Legacy warnings
  remain compatibility text and do not independently grant or remove authority.
- A disabled inspection contract. It is state-bound, excludes arbitrary
  queries and hidden visibility, advertises no implemented kinds, has no read
  endpoint, and does not enter the command ledger.
- Exact build identity, opaque state-bound actions, execution-time
  revalidation, idempotent requests, and action-specific completion.
- `deck_enchant_selection`, `event_option`, and `combat_turn` organic slices.
- `card_reward_selection` preserves visible cards and every separately labeled
  enabled alternative. It does not collapse alternatives into `can_skip`.
  Missing card-row, clickability, alternatives, or visible alternative labels
  suppress all actions.
- Re-SpireAgent strict `preview.3` decode, projection, diagnostics checks,
  disabled-inspection checks, allowed-action import, prompt guides, and tests.

## Qualification Matrix

| Surface | Exact source/build | Contract/fixture | Organic Bridge | Organic Re lifecycle |
|---|---|---|---|---|
| `deck_enchant_selection` | pass | pass | pass | pass |
| `event_option` | pass | pass | pass | pass |
| `combat_turn` | pass | pass | pass | pass |
| `card_reward_selection` | pass | pass | pending | pending |

The three organic slices used exact identity
`v0.108.0|58694f64|-2044609792` under `2.0-preview.2`. The current running game
still reports `preview.2`; that is historical runtime state, not evidence that
the `preview.3` source failed.

## Verification

- Bridge tests: 27/27.
- Re-SpireAgent tests: 74/74 plus strict typecheck and production build.
- Exact game-source audit confirms card reward alternatives can represent skip,
  reroll, sacrifice, and other relic-provided choices; their visible labels are
  semantic data, not a boolean.

## Current Blocker

The new DLL must be built, installed while the game is closed, and loaded by a
fresh game process before `preview.3` can receive organic evidence. The game is
currently running the old `preview.2` DLL in a combat turn.

## Next Step

1. Close the game, install the built `preview.3` mod, and restart.
2. Verify capabilities, typed diagnostics, disabled inspection, and active
   surface behavior read-only.
3. Reach an ordinary card reward and run one bounded Bridge plus Re-SpireAgent
   lifecycle smoke. Exercise only an action the user is willing to apply.
4. Do not add a fifth surface until card reward either passes organic
   qualification or produces a documented contract correction.

See [the player-visible semantics RFC](PLAYER_VISIBLE_SEMANTICS_PROTOCOL_RFC.md)
and [the composition/inspection/diagnostics audit](COMPOSITION_INSPECTION_DIAGNOSTICS_AUDIT_2026-07-16.md).
