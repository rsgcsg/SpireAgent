# Preview.24 Shared Visible State Closeout

Status date: 2026-07-17

> This report records the shared-state qualification checkpoint and its loaded
> artifact. The same protocol was subsequently rebuilt to qualify
> `combat_hand_card_selection`; current permissions and final runtime identity
> are canonical in [CURRENT_STATUS.md](CURRENT_STATUS.md) and the
> [hand-selection report](PREVIEW_24_COMBAT_HAND_SELECTION_QUALIFICATION_2026-07-17.md).

## Verdict

`2.0-preview.24` is qualified on exact game identity
`v0.109.0|c12f634d|-840572606` for the top-level, read-only
`shared_state` contract. This closes the v1 shared run/player sidecar on every
Bridge-owned semantic state. This particular pass did not qualify a new
executable Surface.

The selected architecture is a wire-level composition change:

```text
SharedVisibleState + Context + one Active Surface + Authority
                         + optional read-only Inspection
```

`SharedVisibleState` owns persistent facts rendered by the normal single-player
run HUD. Context still owns the semantic situation. Surface still owns the only
executable grammar. Inspection remains an independent state-bound read outside
the command ledger.

## Exact Source And UI Boundary

The current-build audit traced the shared projection to `RunState`,
`LocalContext.GetMe`, `NTopBar`, `NTopBarBossIcon`, `NTopBarFloorIcon`,
`NTopBarHp`, `NTopBarGold`, `NRelicInventory`, and `NPotionContainer`.

The contract exposes:

- act identity/name, floor, ascension, visible boss identity/name, and run
  modifiers;
- local player identity/character, HP/max HP, gold, relics, potions, potion
  slots/capacity, descriptions, counters, and supported hover keywords.

It excludes deck contents, hidden RNG, draw order, future events/rewards,
future outcomes, and the run timer. Deck contents remain the fixed `run_deck`
Inspection. Unknown hover-tip kinds or shared-state projection failures suppress
actions rather than silently claiming completeness.

No-run states serialize `shared_state: null`. Active multiplayer runs remain
unsupported. Shared state creates no legal actions and is included in
`state_id`, so a visible HP/gold/relic/potion/run change invalidates stale
actions.

## Organic Runtime Evidence

Final installed artifact:

- DLL SHA-256:
  `ac836baeed4b0ac0bfed22e6c9fdeec6c5e4d4f0b627ab2effd727f32fd6806b`;
- module MVID: `d2218a22-198a-4c74-bfba-c409e24c84d3`;
- runtime instance: `d59f198d9d9a4596bae35401389f62c3`.

The final MVID resumed an organic Ironclad run into
`combat + combat_turn`. State `state_d6951c29b0_2` exposed exact shared
run/player facts and two potions; combat `potion_states` referenced those same
two entity IDs exactly once. It remained `bridge_owned` and published only
combat actions.

Command `preview24-final-potion-canary-1` used only the opaque action ID and
completed as `confirmed` with witness `potion_consumed_or_combat_ended`. The
post-state removed Weak Potion from both shared state and combat affordances,
retained Touch of Insanity, and showed Weak 3 on Shrinker Beetle. Re-SpireAgent
decoded the same post-state with clean diagnostics and
`actionAuthority=bridge_advertised`.

An earlier development MVID also completed an opaque map-node command and the
same potion lifecycle. It is retained as implementation evidence, not as the
identity used for final qualification.

## Re-SpireAgent Migration

Re now strictly decodes `shared_state`, projects normalized schema 17, records
`bridgeSharedStateEvidence`, and validates shared/combat entity coherence. A
semantic Bridge state without shared state, a mismatched player identity, or a
combat potion set that does not exactly cover visible shared potions is invalid.

Bridge-owned states no longer issue the v1 state read for shared run/player
facts. Unsupported legacy-owned states may still use v1 for their entire
Context/Surface contract; that fallback cannot add actions to a Bridge-owned
state.

## Verification

- Bridge contract/runtime tests: 54/54.
- Re-SpireAgent tests: 121/121.
- Re strict typecheck and production build: passed.
- Exact-source Release build: zero warnings, zero errors.
- Installed/Release DLL hash equality: passed.
- Menu/no-run explicit null and active-run read canaries: passed.
- Final-MVID combat potion action and semantic post-state: passed.
- `git diff --check`: passed before documentation closeout.

## Remaining Boundary

- menu, character select, run start, and game over are still v1-owned;
- linked rewards and unlisted Surface variants remain fail closed;
- run timer and non-strategic chrome are intentionally not part of shared state;
- unsupported rich hover-tip forms fail closed and need typed coverage before
  being admitted;
- multiplayer shared state is not implemented;
- this work does not modify strategy, learning, memory, or root SpireAgent.

## Architecture Review

Decision: **D for the wire boundary, B for repeated entity projection**.

The wire protocol needed a top-level component because persistent run/player
facts are neither a semantic Context, an input-owning Surface, nor an optional
Inspection. Relic/potion/keyword projection is an internal no-authority helper.
Purpose-specific Surface DTOs, legality, commit, and completion remain separate.

The next highest-value coherent journey is menu -> character select -> run
start -> game over, because it is the largest remaining v1 authority boundary.
It must be audited as purpose-specific stages and semantic completion, not as a
universal menu-click protocol.
