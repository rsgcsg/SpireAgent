# Workflow C Preview.81 Source-Closed Selector Contract Wave Closeout

Status: source/test/build/install verified; loaded Preview.81 and all
Preview.81 runtime behavior are non-claims pending cold start.

## Baseline

This wave continues from `develop@9402fedbda46d3cdb038a508fb29510300cbf16c`
with an expected uncommitted Clean Closure worktree. Prompt/guide remains
global `4` / state guide `5`; Re normalized schema remains `31`.

The last loaded artifact is still Preview.79:

```text
SHA       1032e079ea1344fb42d1dce4f4dc60bfd85b36c1d7db167877d9e475dddf9268
MVID      d9435656-951f-42f7-8275-7adc67f05572
runtime   5faa3faa07ca4331a0eedadc3d91e1c3
game      v0.109.1|c8c577f6|-820620422
Modset    exact_bridge_only / b1459e82...c785
Patch     clean_known_owners / ba7852fb...da70b
```

Preview.80 was built and installed but never cold-loaded. Its source/test and
disk facts remain recorded in the
[Preview.80 closeout](WORKFLOW_C_PREVIEW80_STANDARD_RUN_BOUNDARY_CONTRACT_WAVE_CLOSEOUT_2026-07-30.md);
they are not Live evidence for this wave.

## Batch Contract

Shared root cause: four complete Surfaces already have bounded owner, source,
operands, native Commit and action-local Outcome, but still used manifest
fallback authority identity.

The 14 migrated operations are:

```text
deck_removal_selection
  toggle_deck_removal_card
  preview_deck_removal
  confirm_deck_removal
  cancel_deck_removal_preview
  cancel_deck_removal_selection

reward_deck_removal_selection
  toggle_deck_removal_card
  preview_deck_removal
  confirm_deck_removal
  cancel_deck_removal_preview
  cancel_deck_removal_selection

card_bundle_selection
  preview_card_bundle
  confirm_card_bundle
  cancel_card_bundle_preview

event_dialogue
  advance_event_dialogue
```

The removal Surfaces share only bounded selector mechanics. Merchant removal
retains the exact current merchant service, price/gold/removal-count and
service-used Witness. `CardRemovalReward` retains its task-local token,
baseline deck and exact reward completion. Scroll Boxes retains exact bundle
membership and deck post-state. Event dialogue exposes and advances only the
revealed current line.

Provider completion strings are constants and contract tests prove exact
catalog parity. Publication, execute-time revalidation, native Commit,
Outcome, permission mode and Re supervision are unchanged.

## Rejected Migrations

The wave intentionally excludes:

- Precise Scissors removal: its acquisition lifecycle still lacks current
  exact-runtime action evidence, and its cancelability contract is not proven;
- Deck Upgrade: the Provider currently accepts an event/rest context but does
  not bind the initiating source task;
- Deck Transform/New Leaf and Wood Carvings: one operation identity spans
  source or condition partitions, while current session evidence is keyed too
  coarsely to prevent sibling evidence transfer;
- CombatPile, combat-hand, Rest and reward claim for the same source,
  condition or subtype partition reasons.

These are not arguments for a universal selector. They require a minimal
source/condition-partitioned contract identity or remain fallback,
`evidence_pending` or `code_required`.

## Inventory And Verification

The catalog moves from `35 explicit / 52 fallback` to
`49 explicit / 38 fallback`. Supported mixed explicit/fallback Surface count
remains zero; persistent fallback qualification remains impossible.

Executed:

```text
targeted contract/partition tests    2/2 passed
complete Gateway tests            203/203 passed
Re tests                           212/212 passed
Re typecheck / production build      passed
Connector CLI / run identity         passed
docs / links / machine inventories   passed
compatibility fixtures                 6 passed, non-authorizing
permission fixtures                    4 passed, non-authorizing
qualification/profile/migration       passed
operation binding audit               reviewed bindings match
CombatPile compatibility audit        Tutor remains code_required
Release Gateway build               passed, 0 warnings/errors
JSON / git diff checks                passed
```

The compatibility audit remains
`review_required_unregistered_callers` because `Tutor` has a new target-owner
topology. This is an expected non-authorizing diagnostic and remains
`code_required`, not a test failure or a permission grant.

## Deployment

```text
protocol              2.0-preview.81
built/installed SHA   411f8cf5f113e4d39db9d95fb6a5b625aae97eaf00c4ab9c0f3cdf93413637b1
built/installed MVID  c09e8569-19af-4a34-b98b-49339300304b
install state         installed_game_must_be_cold_started
rollback              STS2MCP/.local/deployments/2026-07-30T06-55-52-576Z
loaded                non-claim
```

Disk inspection confirms built/installed equality, one canonical manifest and
no duplicate Gateway. The game is closed and Gateway unreachable, so loaded
identity, observation, Inspection, mutation, trial and qualification are all
non-claims. The rollback snapshot contains Preview.80; its predecessor
snapshot contains the last loaded Preview.79.

## Next Exact-Runtime Boundary

Cold-start the game and run:

```bash
cd Re-SpireAgent
npm run agent:run
```

The run must first report exact Preview.81 SHA/MVID. Natural exercise of
merchant removal, CardRemovalReward, Scroll Boxes or dialogue may then provide
family evidence, but one journey cannot qualify an unexercised sibling.
