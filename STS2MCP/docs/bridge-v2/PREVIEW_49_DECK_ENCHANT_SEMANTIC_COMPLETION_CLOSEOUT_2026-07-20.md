# Preview.49 Deck Enchant Semantic Completion Closeout

Status: source audited, tested, built, installed, cold-loaded, and exercised as
a bounded current-build action canary. It is not organically qualified.

## Problem

The v0.108 contract treated `NDeckEnchantSelectScreen` closure as successful
confirmation. Exact v0.109 source disproves that witness: Self-Help Book awaits
the selector task, then applies the enchantment after the overlay resolves.
Screen closure therefore proves selection completion, not the business result.

## Contract

- Context remains `event`; the independent active Surface is
  `deck_enchant_selection` with `selecting` and `preview` stages.
- Visible facts include exact eligible card instances, selection bounds and
  membership, target enchantment identity/name/description/amount, and current
  controls.
- Actions remain opaque and state-bound. Publication and execution use the
  same exact screen, card, enchantment, and selection facts.
- Confirm captures exact selected card references plus enchantment ID/amount,
  revalidates them before clicking, and completes only when the overlay closes
  and every captured card has that exact enchantment post-state.
- Run-deck Inspection is an independent read-only post-state check and grants
  no command authority.

## Architecture Review

Decision: **B - reuse internal permissionless selection/card facts, retain an
independent semantic Surface and action lifecycle**.

Deck removal, upgrade, transform, and enchant share grid mechanics, but their
eligibility, commit owners, hidden outcomes, and semantic witnesses differ.
This evidence does not justify a universal selector or executable Effect DSL.
The top-level `Context + one Active Surface + Stage` boundary remains sound for
this lifecycle.

## Exact Identity

- protocol: `2.0-preview.49`
- game: `v0.109.0|c12f634d|-840572606`
- Release/installed SHA-256:
  `37af71ae49754804b65be6ade12ea984f76819e2e83263d9bdf17e0f5069f82f`
- loaded MVID: `edc6efd2-7964-4830-a32e-c6260c6e332f`
- runtime: `f2291b6d2e564ca39c7481475a065020`
- Modset: `exact_bridge_only`
- Modset fingerprint:
  `1f02c1c1307f3239cbcca57f33582b05782fee6a4c344f0eae17dff4533fa71e`

## Runtime Evidence

An operator-targeted Self-Help Book branch exposed `SWIFT x2` and nine exact
eligible Power-card instances. The canary:

1. selected `Iteration`, automatically entered preview, and confirmed exact
   selection-membership change;
2. cancelled preview and confirmed preview closure plus empty selection;
3. selected exact entity `card_67e6d174_3b` (`Creative AI+`);
4. confirmed with command evidence
   `enchantment_screen_closed_and_exact_cards_enchanted`;
5. read state-bound run-deck Inspection at the resulting event state and found
   the same entity with `SWIFT`, amount `2`.

Strict-v2 continuation `run-20260719223336-z4erxn` recorded 50 Bridge-owned
decisions: 36 `executed_and_settled`, 11 pre-dispatch stale-state rejects, one
checkpoint-pending game-over transition, and two non-actionable boundaries.
It crossed event Proceed, map, combat, game over, and main menu with no v1,
failed command, timeout, or unknown outcome. The targeted branch means this is
canary/coverage evidence, not unbiased Organic Qualification.

## Verification

- Bridge tests: `95/95` pass.
- Bridge Release build: zero warnings and zero errors.
- Re typecheck/tests/build: `147/147` tests pass.
- Release and installed DLL SHA match.
- Loaded protocol/MVID/runtime/game/Modset match this report.
- `git diff --check` passes.

## Remaining Boundary

Only the exact Self-Help Book source is a current-build canary. Other callers,
explicit preview-button flow, cancelable root close, multi-select enchantment,
Mods, and future builds remain unqualified or fail closed. One targeted sample
does not justify promotion to qualified authority.
