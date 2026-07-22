# Preview.44 Colorless Potion Source-Binding Canary

Date: 2026-07-18

## Scope

Preview.44 extends `generated_card_choice` with one second exact source:
`ColorlessPotion.OnUse`. It does not authorize every caller of
`NChooseACardSelectionScreen` and does not create a universal card selector.

The source contract is:

```text
context=combat
surface=generated_card_choice
purpose=choose_one_generated_combat_card
source_kind=colorless_potion
destination=combat_hand
selected_card_cost_policy=free_this_turn
overflow_destination=combat_discard_if_hand_full
```

The existing Lead Paperweight branch remains a separate discriminant with
`event`, `run_deck`, and unchanged-cost semantics. Bridge and Re reject a
source/context/action mismatch.

## Exact Source And UI Audit

For game identity `v0.109.0|c12f634d|-840572606`:

- `ColorlessPotion.OnUse` generates three distinct Colorless cards and opens
  `CardSelectCmd.FromChooseACardScreen(..., canSkip: true)`;
- after selection it calls `SetToFreeThisTurn()` and adds the exact selected
  card to combat hand;
- `CardPileCmd.Add` redirects to discard when the hand is full;
- `PotionModel.OnUseWrapper` owns the full asynchronous source lifecycle;
- selecting a holder and closing the screen alone do not prove the business
  result.

The source-binding tracker therefore surrounds `PotionModel.OnUseWrapper`, not
the shared UI. The semantic witness requires source-task completion, child
closure, an exact offered reference newly present in hand or discard, a total
hand/discard increase of one, and the free-this-turn cost modifier. Skip has a
separate unchanged-piles witness and remains unexercised.

## Build And Loaded Identity

- protocol: `2.0-preview.44`
- Release/installed SHA-256:
  `ba305b390dfde38f1b84f8aa68c4caaa7edf2d88df4bc5ebf85bfb2a05221d4a`
- loaded MVID: `53936dac-72a2-47ac-8aa2-78ac1bce95f6`
- runtime instance: `abaa5c6bd2f84227adceede0c880ae1b`
- Modset status: `exact_bridge_only`
- Modset fingerprint:
  `e473083e85a26af80c2f031a9ce906761819fbe0e5b54a694bc76fb12828bce8`

Bridge tests passed `88/88`; Re strict tests passed `142/142`; Re typecheck,
Re production build, and Bridge Release build passed. Release and installed
SHA matched before Steam launch, and the running process reported the exact
MVID/runtime/Modset above.

## Organic Journey

1. Existing opaque `use_potion` consumed the exact Colorless Potion and opened
   state `state_c1ade4a05d_5`.
2. The Surface exposed Bolas, Omnislice, Automation, and Skip with three
   source-specific select actions plus one source-specific skip action.
3. Re run `run-20260718172631-zcwq84`, decision
   `decision-000001-mrqn2a3i-syekxt`, selected Omnislice through opaque action
   `action_9533c40ebe6b336b0052`.
4. Request `re-p1-5d85b767-3233-4848-971d-fc041dff788a` revalidated the exact
   state/action and completed with evidence
   `colorless_potion_choice_closed_and_exact_free_card_added_to_combat_hand_or_full_hand_discard`.
5. Successor `state_c1ade4a05d_6` was `combat + combat_turn`; the exact selected
   entity `card_5045740d_34` was in hand as Omnislice with displayed cost `0`.

The decision outcome was `executed_and_settled`; no v1 transport or local
reconstruction participated.

## Permission And Remaining Boundary

- Colorless Potion exact-card **selection** is an Organic action canary.
- Colorless Potion Skip is source-audited/tested but has no Organic lifecycle.
- Full-hand discard completion is source-audited and fixture-tested, not
  Organic evidence.
- Lead Paperweight remains its own source-scoped canary.
- Hefty Tablet, Knowledge Demon, other potions/cards/relics, Mod callers, and
  unknown sources remain fail closed.

## Architecture Decision

Choice **C**: use a strongly typed shared one-of-N mechanism family while
retaining source-discriminated semantic branches, operations, and witnesses.
The evidence supports shared card-holder mechanics and source tracking, but not
a universal selector, generic effect DSL, or automatic permission inheritance.
