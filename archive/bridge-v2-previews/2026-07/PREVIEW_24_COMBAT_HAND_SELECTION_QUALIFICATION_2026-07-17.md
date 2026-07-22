# Preview.24 Combat Hand Selection Qualification

Status date: 2026-07-17

## Verdict

`combat_hand_card_selection` is scoped-qualified for exact game identity
`v0.109.0|c12f634d|-840572606`. It remains a purpose-specific combat child
Surface. It is not a universal card selector and grants no authority to pile,
generated-card, reward, deck-maintenance, or other selection protocols.

## Trigger And Root Cause

Organic Re-SpireAgent run `run-20260717135207-gpeaut` completed ten v2 combat
decisions, then fell back to v1 for a Touch of Insanity hand selector. The v1
adapter replaced a selected Defend instance with another same-name Defend but
could not distinguish those instances in its index/name state. Its pre/post
hash therefore stayed equal and decision 13 ended `executed_unsettled`.

This was not a provider, strategy, or game failure. It was an instance-identity
and completion-evidence limitation in `local_reconstruction`.

## Exact Source And UI Audit

The current `sts2.dll` was decompiled for `NPlayerHand`, `CardSelectorPrefs`,
`NSelectedHandCardContainer`, and `TouchOfInsanity`. The v0.109 source confirms:

- `NPlayerHand._prefs` and `_selectedCards` remain the exact selection binding;
- `SimpleSelect` replaces the last selected card at `MaxSelect`;
- active and selected cards are rendered by distinct holder collections;
- the visible confirm control resolves the selection task;
- Touch of Insanity opens `CardSelectCmd.FromHand` with exactly one selection,
  then applies `SetToFreeThisCombat()` to the returned card instance.

The existing bounded Surface therefore matched current source and UI behavior.
No protocol DTO or Re normalizer change was required.

## Final Organic Evidence

Final installed artifact:

- DLL SHA-256:
  `ab8b2e22f1e187f9e6947b243bc8b9a3ef28cd9937ebf547da7b73c89aee0e20`;
- module MVID: `3966756e-1b28-4995-91d1-1950a84ea6d3`;
- runtime instance: `f09cc247f1ae44ba99bfe7e040052a86`.

The final MVID resumed the organic combat save and completed this chain:

1. `preview24-final-hand-open-1` used the opaque Touch of Insanity action;
2. state `state_2921fa429a_2` exposed five exact card instances and no selected
   card under sole `bridge_owned` authority;
3. `preview24-final-hand-select-1` selected Bash and completed with
   `selected_membership_changed_or_auto_completed`;
4. state `state_2921fa429a_3` preserved Bash's entity ID, marked only that card
   selected, and exposed exact replace, deselect, and confirm actions;
5. `preview24-final-hand-confirm-1` completed with
   `combat_hand_selection_confirmed_and_closed`;
6. state `state_2921fa429a_4` returned to `combat_turn`; the same Bash entity's
   visible cost changed from `2` to `0`, confirming the downstream potion
   effect.

Re-SpireAgent strictly decoded the child and post-state with schema 17, clean
diagnostics, and `bridge_advertised` authority. No v1 action was merged.

## Architecture Review

Decision: **A, keep the Surface independent**.

Hand selection has replacement behavior, selected-card containers, peek mode,
and a completion task owned by `NPlayerHand`. Those semantics differ from
combat pile grids and deck-maintenance previews. Existing shared visible-card
projection remains an internal no-authority helper; no universal selector or
wire-level mechanics layer is justified.

## Verification And Boundary

- Bridge tests: 54/54 passed.
- Re-SpireAgent tests: 121/121 passed.
- Re strict typecheck and production build passed.
- Exact-source Release build passed with zero warnings and zero errors.
- Installed DLL hash and loaded MVID were verified before the final journey.

This qualification covers observed v0.109 simple hand selection, exact instance
replacement/deselection/confirm semantics, and the current ordinary combat
context. Upgrade mode and peek retain historical implementation evidence but
need current-build organic diversity before they should be described as
independently qualified variants.
