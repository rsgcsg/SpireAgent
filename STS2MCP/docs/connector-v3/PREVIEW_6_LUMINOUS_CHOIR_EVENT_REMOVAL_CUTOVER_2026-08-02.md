# Connector V3 Preview.6 Luminous Choir Event Removal Cutover

Date: 2026-08-02

Evidence class: source audit, implementation, automated tests, Release build
and install. Loaded and Live evidence are pending a cold start.

## Trigger And Source Audit

The exact Preview.5 session stopped safely at the Luminous Choir
`NDeckCardSelectScreen`. Direct decompilation of the installed v0.110.1
`sts2.dll` verified the following current-build path:

1. `LuminousChoir.ReachIntoTheFlesh` awaits
   `CardSelectCmd.FromDeckForRemoval` with exactly two non-cancelable choices.
2. It removes the returned exact card instances with
   `CardPileCmd.RemoveFromDeck`.
3. It adds `SporeMind` with `CardPileCmd.AddCurseToDeck<SporeMind>`.
4. It marks the event finished.

`NDeckCardSelectScreen` opens preview after the maximum selection, preview
cancel returns to selecting and clears membership, and preview confirm
completes the native selection. Page closure alone is therefore insufficient
to prove the whole event transaction.

## Implemented Vertical Slice

Preview.6 adds `event_deck_removal_selection` with exact source kind
`luminous_choir_reach_into_flesh` and purpose
`remove_two_cards_then_gain_spore_mind`.

- A task-local Harmony scope binds the exact event instance, player, baseline
  deck and baseline Spore Mind count.
- Discovery requires the unique active task, current EventRoom event, exact
  visible selector, `min=max=2`, non-cancelable prefs and visible card grid.
- Direct V3 candidates cover exact select/deselect membership, preview return
  and confirm. There is no whole-selector cancel because the native contract
  is non-cancelable.
- Execution resolves the same screen, task, card instances, membership and
  native controls again before Commit.
- Toggle completion requires the exact card membership change while the same
  selector remains current. Screen disappearance is not success.
- Confirm completion requires source-task completion, selector closure, event
  completion, both exact selected references absent, exactly one new Spore
  Mind and the expected deck-count delta.
- Re strictly decodes the typed Surface and exact command set and consumes it
  directly, with no V2 capabilities or V2-shaped state sidecar.
- Any other `NDeckCardSelectScreen` source remains unsupported and
  non-authorizing. Discovery exceptions replace the current draft with an
  empty fail-closed observation.

This is one source-specific semantic contract sharing bounded selector
mechanics. It is not a universal event selector and grants no authority to
another event, relic, reward or Mod.

## Permission And Evidence Boundary

Three explicit operation contracts were added:

| Operation | Risk | Current evidence state |
|---|---|---|
| `toggle_event_deck_removal_card` | reversible navigation | source-audited and fixture-tested |
| `cancel_event_deck_removal_preview` | reversible navigation | source-audited and fixture-tested |
| `confirm_event_deck_removal` | persistent run mutation | source-audited and fixture-tested |

The contracts may support an exact encounter provisional trial only after the
new artifact is loaded and the source is resolved. Qualified scope is empty,
durable qualification is empty, and no Preview.5 evidence transfers to the
new MVID. Empty or absent operation scopes remain Fail Closed.

## Automated, Build And Install Results

- Gateway: 260/260 tests passed.
- Re: 267/267 tests passed; strict typecheck and production build passed.
- Connector CLI, run identity, inventory, adaptation, Clean Closure,
  compatibility, permission, qualification, profile and migration checks
  passed.
- Active Markdown links passed before this document addition and are rerun in
  final closure.
- Python MCP adapter passed syntax/import checks in its repository virtual
  environment; `uv lock --check` resolved the committed lock without change.
- Release build: 0 warnings, 0 errors.

Final built and installed artifact:

- protocol: `3.0-preview.6`;
- SHA-256:
  `7668a1cd1f99cc917466d43069af716ef8abf22f7b42aac59bda67ab321c3b96`;
- MVID: `6704fa1f-f8fe-4cc1-9fe6-ba513f283239`;
- immediate pre-install snapshot:
  `STS2MCP/.local/deployments/2026-08-02T13-06-57-272Z`;
- last-known-loaded Preview.5 rollback:
  `STS2MCP/.local/deployments/2026-08-02T12-55-11-931Z`.

The game is stopped. Built and installed identities match; loaded SHA, MVID,
runtime, Modset and Live behavior are non-claims until cold start.

## Remaining Work

- Cold-load and exercise select/deselect/reselect, preview return and full
  confirm transaction on the exact Preview.6 MVID.
- Fix and verify the missing Explosive Ampoule combat-potion candidate.
- Reach merchant removal and combat-hand to complete their Preview.5 Live
  matrix.
- Continue vertical migration for combat-pile, card-bundle and source-distinct
  relic/reward removal. Their current Provider/V2-shaped dependencies are not
  hidden or declared complete.
