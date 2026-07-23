# Gate 1 Dredge Closeout

Status: `2.0-preview.59` source-scoped implementation and current-build
operator-directed Re canary. This is not `combat_pile_card_selection`
qualification and does not authorize unknown selector origins.

## Trigger

Real run `run-20260723113740-hafl26`, decision
`decision-000009-mrxfthkr-i0rl7z`, stopped at:

```text
combat + unsupported + authority=none
bridge.surface.combat_pile_card_selection.binding_unavailable
```

The stop was correct fail-closed behavior. The missing contract was exact
`Dredge.OnPlay`, not a provider, Re legality, or generic combat failure.

## Exact Game Contract

Current STS2 `v0.109.0|c12f634d|-1639417500` source shows:

```text
Dredge.OnPlay
  -> choose min(3, available hand capacity) discard cards
  -> CardSelectCmd.FromCombatPile(Discard, exact count)
  -> CardPileCmd.Add(selected, Hand)
```

The native selector has equal minimum and maximum counts, no manual confirm,
and no cancel. When the eligible pile contains no more cards than the required
count, the game may complete directly without opening a child selector. When
more candidates exist, holder presses toggle a visible selected set and the
final required selection automatically commits the exact batch.

## Architecture Decision

Classification: **B, reuse internal mechanics while retaining an independent
source contract**.

- The existing `combat_pile_card_selection` Surface remains the active input
  owner because the player is interacting with the same native combat-pile
  selector.
- Dredge receives the exact source discriminator `source_kind=dredge`, purpose
  `move_bounded_discard_cards_to_hand`, and operation
  `toggle_discard_card_for_dredge`.
- It does not reuse Headbutt or Graveblast's exact-one operation. Dredge is a
  dynamic one-to-three multi-step transaction.
- Intermediate holder actions complete only when the exact selected-reference
  set changes while the source/screen remain active and hand/discard piles are
  unchanged.
- The final holder action completes only when the source task finishes, the
  child closes, and the exact selected batch moves from discard to hand.
- Unknown cards, derived Mod sources, and other callers of the native selector
  remain fail closed.

This avoids both bad extremes: a new Surface for every card and a universal
selector that erases source legality, cardinality, commit, and completion
semantics.

## Artifact And Environment

| Field | Value |
|---|---|
| Protocol | `2.0-preview.59` |
| Game identity | `v0.109.0|c12f634d|-1639417500` |
| Bridge SHA-256 | `afbcc870a180e14e007e66e917467d9eed27c6166562d41a473b7a0e55317423` |
| Bridge MVID | `49d2408c-7a43-4669-b37d-6c8f33308c48` |
| Runtime instance | `844706b0442e443db974f156103d7a00` |
| Modset | exact Bridge-only |
| Permission | `combat_pile_card_selection + toggle_discard_card_for_dredge + canary` |

## Current-Build Runtime Evidence

The first bounded attempt played Dredge with an empty discard pile. The second
played it with exactly three candidates. Both correctly returned directly to
`combat_turn`; neither created a selector and neither qualifies the multi-step
contract.

A cold-restarted real-game journey then ended one ordinary turn, naturally
re-drew Dredge with five visible discard candidates, and exercised the strict
Re production connector:

1. `state_f3722dcf75_11`: Dredge was a Bridge-advertised legal action.
2. Playing it produced `state_f3722dcf75_13`,
   `combat + combat_pile_card_selection + bridge_advertised`.
3. Selecting Defend produced selected count `0 -> 1`, with hand and discard
   unchanged.
4. Deselecting Defend produced selected count `1 -> 0`, with the same piles.
5. Selecting Defend and Graveblast left the child active at selected count 2.
6. Selecting Undeath+ as the third card completed the command and returned to
   `combat_turn`.
7. The exact selected entity IDs appeared in hand and disappeared from
   discard; discard count changed `5 -> 2`, hand gained three cards, and the
   source Dredge was exhausted.

All actions settled through `agent:connector-canary`; Re decoded
`2.0-preview.59` and selected only opaque, state-bound advertised action IDs.
This is real current-build canary evidence, not autonomous strategy evidence or
Surface qualification.

## Verification

- Re typecheck, 168 tests, and production build passed.
- Bridge Release tests passed: 119.
- Bridge Release build passed with zero warnings.
- Release and installed DLL SHA-256 matched.
- Steam cold-start loaded the exact SHA/MVID and a fresh runtime instance.

## Remaining Boundary

- Dredge remains canary-only until repeated natural diversity justifies any
  tier review.
- Hand-capacity counts 1 and 2 are source-audited and fixture-covered but do
  not have separate current-build child-surface runtime evidence.
- Direct no-selector completion and interactive selector completion are two
  native lifecycle branches; reports must not require a child Surface for
  every Dredge play.
- A future multi-pick card may reuse holder/selection mechanics only after its
  source, visible bounds, commit, cancellation, and exact post-state witness
  are independently proven.
