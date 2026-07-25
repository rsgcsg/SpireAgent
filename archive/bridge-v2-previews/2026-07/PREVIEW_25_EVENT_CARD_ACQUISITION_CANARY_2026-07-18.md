# Preview.25 Event Card-Acquisition Canary

Status date: 2026-07-18

## Verdict

Preview.25 adds a purpose-specific `event_card_acquisition` Surface and closes
one current-build organic lifecycle for Brain Leech. The Surface remains
`candidate_action_canary`: one one-card event is not enough to qualify the
different two-card Room Full of Cheese lifecycle.

This work does not create a universal card selector. It uses shared bounded-grid
mechanics internally while preserving event purpose, eligibility, commit, and
completion semantics in the owning Surface.

## Exact Source And UI Basis

The exact game identity was `v0.109.0|c12f634d|-840572606`.

- `BrainLeech.ShareKnowledge` creates five card candidates and requests exactly
  one selection with no cancel or manual-confirm control.
- `RoomFullOfCheese` uses the same event add-to-deck helper with eight visible
  candidates and exactly two selections.
- `EventModel.SelectCardsToAddToDeckFromGrid` uses
  `CardSelectCmd.FromSimpleGridForRewards`; committed exact `CardModel` objects
  are appended with `CardPileCmd.Add(..., PileType.Deck)`.
- `NSimpleCardSelectScreen` exposes the visible card grid, selection membership,
  constraints, and current clickability. Reaching the fixed maximum commits
  automatically.

Other call sites do not share this business contract. Sealed Deck is run-start
drafting, Sea Glass is relic pickup, and Choices Paradox uses a different simple
grid flow. They remain unsupported instead of being inferred from screen shape.

## Contract And Authority

The Surface publishes only exact, visible, currently clickable card actions:

- `select_event_card_acquisition`;
- `deselect_event_card_acquisition` when the current selection is reversible.

Every action is opaque and bound to the exact state and card entity. Execution
revalidates event source, screen instance, card object, selection membership,
holder, grid, and clickability.

Completion is semantic:

- an intermediate selection requires exact membership change;
- final auto-commit requires the child overlay to close, run-deck count to
  increase by the committed selection count, and every selected exact object
  instance to exist in the run deck.

Interface closure alone is not success.

## Organic Runtime Evidence

Organic canary Bridge identity:

- protocol: `2.0-preview.25`;
- DLL SHA-256:
  `62949eb56ad54b289ddcb3951e0c108c1e684fb076eb3a1fb66eca2d759c6047`;
- module MVID: `c4abca9d-bcd4-4eb3-a77d-4f19a21cf0dd`;
- runtime instance: `2c3560e2fe264ba6b497caa0111e7d99`.

Brain Leech state `state_6ae70b0315_4` exposed five exact cards and five opaque
actions. Re-SpireAgent decoded the same state as
`event + event_card_acquisition + bridge_advertised` with no diagnostics and
the same five allowed actions.

The run-deck Inspection recorded 12 cards before commit. Request
`preview25-brain-leech-offering-20260718-1` selected exact Offering entity
`card_5b08e5c7_18` and completed with:

```text
status=completed
outcome=confirmed
evidence=selected_event_cards_added_as_exact_instances_to_run_deck
observed_state_id=state_6ae70b0315_5
```

The same-state post-command Inspection recorded 13 cards and the same Offering
entity in the run deck. The parent event then returned to the still-legacy-owned
`event_option` Surface with no v2 action leakage.

After this journey, a behavior-preserving closeout rebuild corrected only the
human-readable exact-build capability detail so it listed
`event_card_acquisition` alongside the existing action canaries. The final
installed artifact has SHA-256
`16c4693e7c73f85be879caa9a72dac743843c3732d76be57e8d1423d6797f18b`, loaded
MVID `8a1f10d1-4a44-4c35-95b9-cd9aa49dbcec`, and runtime instance
`67f94ba3618a40cfa9160c5dd678470d`. Its permissions and detail agree.

The save resumed before the event choice, permitting an independent final-MVID
journey without reusing old state/action IDs. State `state_827f8af9cb_3`
published fresh Offering entity `card_a0eaf7ea_c`. Request
`preview25-final-mvid-brain-leech-offering-20260718-1` again completed with the
same semantic witness; Inspection recorded run deck 12 -> 13 and the exact fresh
Offering instance. These two journeys strengthen the observed Brain Leech
shape, but they remain one event source and do not qualify Room Full of Cheese.

## Abstraction Review

Decision: **C - share strongly typed, non-authoritative grid mechanics while
retaining a purpose-specific semantic Surface**.

The evidence supports common mechanics for visible card projection, fixed
selection constraints, exact membership, and clickability. It does not support
a shared effect, destination, commit, cancellation, or completion protocol.

## Remaining Boundary And Rollback

- Room Full of Cheese two-card auto-commit still needs its own organic journey.
- Sealed Deck, Sea Glass, Choices Paradox, and unknown simple-grid sources fail
  closed.
- The parent `event_option` contract remains legacy-owned on this build.
- Any source-binding, selected-set, holder, deck, or completion uncertainty
  suppresses actions or produces an unknown outcome without automatic retry.

Rollback is local: remove the provider registration and preview.25 protocol
union member. No v1 action path or root SpireAgent policy was changed.
