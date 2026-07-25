# Gate 1 Seance And Reward Removal Closeout

Date: 2026-07-23

> Historical Preview.58 closeout. Its Dredge fail-closed statement was correct
> for that artifact but is superseded by the
> [Preview.59 Dredge closeout](GATE1_DREDGE_CLOSEOUT_2026-07-23.md).

Status: `2.0-preview.58` implementation, build, installation, loaded-identity,
and bounded canary closeout. This report does not promote any permission tier
or claim full Organic Qualification.

## Triggering Evidence

Three Re runs reached real unsupported child states:

| Run | Decision | Observed state | Root cause |
|---|---|---|---|
| `run-20260723105904-z3sy3r` | `decision-000001-mrxefa93-mwkx6j` | `combat + unsupported + none` | Seance opened an exact `NCombatPileCardSelectScreen` origin that the Gateway had not source-bound. |
| `run-20260723105825-69ohhl` | `decision-000012-mrxef4fe-kn83km` | `combat + unsupported + none` | A second Seance occurrence reproduced the same missing source contract. |
| `run-20260723110000-1z5jqy` | `decision-000002-mrxegmqw-ur8u4u` | `unknown + unsupported + none` | Forbidden Grimoire's post-combat `CardRemovalReward` opened a deck-removal task that was neither merchant nor Precise Scissors. |

The same first run also supplied a useful counterexample. Cleanse completed a
real `select_draw_card_for_exhaust` action with witness
`cleanse_source_completed_screen_closed_and_exact_card_moved_from_draw_to_exhaust`.
The generic combat-pile mechanics were therefore working; the Seance failure
was a missing semantic source/witness, not a universal selector failure.

## Exact Source Semantics

- `Seance.OnPlay` calls `CardSelectCmd.FromCombatPile` for exactly one draw-pile
  card, then transforms that exact card to `Soul` at the same pile position.
- `ForbiddenGrimoirePower.AfterCombatEnd` creates `CardRemovalReward`.
  `CardRemovalReward.OnSelect` enters
  `RewardSynchronizer.DoUnsyncedCardRemoval`, opens
  `CardSelectCmd.FromDeckForRemoval`, and removes the selected exact card through
  `CardPileCmd.RemoveFromDeck`.
- `CardRemovalReward` is the semantic source authority. Forbidden Grimoire is
  one producer, not the permission contract.

## Architecture Decision

The implementation uses option C from the Bridge abstraction review:
strongly typed shared mechanics with independent semantic surfaces/contracts.

- Seance reuses bounded combat-pile card enumeration and exact-entity action
  mechanics. It has its own source discriminator, operation
  `select_draw_card_for_soul_transform`, and same-index `Soul` completion
  witness.
- CardRemovalReward reuses bounded deck-selection mechanics but publishes the
  independent `reward_deck_removal_selection` Surface. It is not aliased to
  merchant `deck_removal_selection` or Precise Scissors
  `relic_deck_removal_selection`.
- Publication and execute-time revalidation share the exact active source
  binding. A closed selector alone is not success.
- Re strictly decodes the new contracts and only selects advertised opaque
  actions. It does not infer the card source or reconstruct completion.

This avoids a universal selector while keeping repeated UI mechanics internal
and non-authorizing. A future permission manifest may include source-contract
identity in addition to `surface + operation`; this task does not perform that
broader permission migration.

## Verification

The coordinated Release artifact is:

| Field | Value |
|---|---|
| Protocol | `2.0-preview.58` |
| SHA-256 | `992e60992901ded1e32e193eeb60e66b9fcc97c3d1b0abe3fd97cd255e8f15b1` |
| MVID | `20d08a59-8b70-42f0-8676-2f8d1d34a6ad` |
| Runtime identity | `c196413151614ca8ac6abdf5a6baaca9` |
| Game | `v0.109.0`, commit `c12f634d`, actual assembly hash `-1639417500` |
| Bridge-only Modset | `8972b47c61e1d3fa3d1b2c0c98407659b9aef54f0a08e452b8b316cdeafab86e` |

Static and fixture verification:

- Re typecheck, 168 tests, and production build passed.
- Bridge Release build and 118 C# tests passed.
- The loaded capability contract advertised only the explicit Seance and
  `reward_deck_removal_selection` canary operations; no wildcard authority was
  added.

Bounded current-build runtime canary:

1. Re continued the saved run through an advertised opaque action.
2. Re claimed the visible card-removal reward.
3. The Gateway exposed `reward_deck_removal_selection` with 25 exact deck
   entities and cancel.
4. Re selected one exact Defend, entered preview, and confirmed.
5. The command completed with
   `reward_removal_selected_card_absent_after_exact_reward_task_completion`.
6. The successor reward state was coherent and a fresh `run_deck` inspection
   contained 25 cards, omitted the selected entity, and reduced the exact
   Defend count from four to three.

This is current-build Organic canary evidence for the exact reward-removal
lifecycle. It is not a broad deck-removal qualification.

## Honest Boundary

- CardRemovalReward/Forbidden Grimoire: current-build full-lifecycle canary
  passed.
- Cleanse: an Organic full-lifecycle action passed under the prior loaded
  `preview.57` identity. That evidence does not automatically qualify
  `preview.58`.
- Seance: source-audited, fixture-tested, built, installed, loaded, and
  canary-scoped. No `preview.58` Organic select-to-transform lifecycle has run.
- Precise Scissors: implemented and canary-scoped, but still lacks an Organic
  select/preview/confirm/deck-post-state lifecycle.
- Dredge and every other unbound combat/deck selection source remain fail
  closed.

## Next Bounded Work

1. Run one natural Seance lifecycle and verify the selected original is absent,
   a new exact `Soul` occupies the same draw-pile index, the source task
   completes, and the selector closes.
2. Run one natural Precise Scissors lifecycle.
3. Keep both at canary tier unless exact current-build evidence supports a
   separate promotion review.
