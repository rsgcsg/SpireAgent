# Preview.28 Game-Over, Bundle, And Contract Alignment

Date: 2026-07-18  
Game identity: `v0.109.0|c12f634d|-840572606`  
Protocol: `2.0-preview.28`

## Executive Result

Preview.28 closes three concrete code/permission/evidence inconsistencies:

1. source-qualified Scroll Boxes bundle selection was implemented but absent
   from the current-build permission list;
2. capabilities accidentally advertised one Surface twice, which made Re's
   exact scoped identity inapplicable;
3. game-over Continue was published under a predicate that execution-time
   revalidation could never accept on the real v0.109 scene.

The first two are organically verified. The game-over defect was organically
discovered on preview.27 and is fixed/tested/installed in preview.28, but a new
complete organic lifecycle is still required.

## Card Bundle Evidence

Exact source review found the active v0.109 ordinary caller to be
`ScrollBoxes.AfterObtained`, using `NChooseABundleSelectionScreen`. The caller
adds every selected card to `PileType.Deck` after selection completes.

The provider now qualifies only that source-resolved shape:

- visible bundle cards share one owner;
- the player owns the exact Scroll Boxes relic;
- offered exact card instances are not already in the run deck;
- confirm completion requires selector closure and every selected exact card
  instance in the same owner's run deck.

Organic request `organic-preview27-bundle-preview-01` opened preview.
`organic-preview27-bundle-confirm-01` selected Iron Wave, Perfected Strike,
and Dismantle. State-bound `run_deck` Inspection changed from 11 to 14 and
contained all three exact entity references. This is a purpose-specific
bundle contract, not a universal selector.

## Capability Drift

During the permission update, `card_bundle_selection` appeared twice in the
capability array. Re compared advertised Surface counts with exact permission
sets and correctly failed scoped applicability. The duplicate was removed.

The strict client now also rejects:

- duplicate capability Surface kinds;
- duplicate operation names inside one Surface declaration.

This keeps one capability declaration as one authority fact and prevents a
future generator/merge error from silently changing eligibility.

## Long-Run Evidence

Organic run `run-20260717160232-20t1ia` produced 75 decisions:

| Result | Count |
|---|---:|
| `executed_and_settled` | 73 |
| `not_executed_stale_state` | 1 |
| `not_executed_invalid_state` | 1 |
| `bridge_advertised` observations | 71 |
| `local_reconstruction` observations | 3 |

The stale decision was a treasure animation/state transition and was blocked
before execution; a fresh observation rebound and completed. Two event options
and one combat card-selection child remained v1-owned. A separate earlier map
decision had one DeepSeek 30-second timeout with no action attempt; the same
state succeeded on the next run, so it is provider evidence, not a Bridge
contract failure.

## Game-Over Failure And Fix

Natural death reached `NGameOverScreen`. Bridge preview.27 observed intro and
advertised `advance_game_over_summary`, but the command
`organic-preview27-game-over-advance-01` was rejected as
`game_over_intro_changed` under the unchanged `state_id`.

Exact v0.109 source showed why:

- `%RunSummaryContainer.Visible` is not the intro/summary authority;
- Continue calls `OpenSummaryScreen`, which sets `_isAnimatingSummary=true`;
- summary animation later enables `%MainMenuButton`;
- the container may be visible while Continue still owns input.

Preview.28 therefore:

- derives `intro` from actionable Continue;
- derives `summary_animating` from `_isAnimatingSummary`;
- derives `summary` from actionable MainMenu;
- omits score/floor/ascension until summary is fully actionable;
- uses the same Continue/animation predicate for publication and execution
  revalidation;
- completes advance only after animation starts and Continue disables;
- completes return only after game-over closes, the run ends, and main menu is
  loaded.

Re's stricter contract rejected the premature summary fields rather than
silently accepting contradictory stage data. That behavior was correct.

## Verification

- Bridge tests: 58/58 passed.
- Re tests: 125/125 passed.
- Re typecheck and production build passed.
- Bridge Release build: zero warnings and zero errors.
- installed/Release SHA-256:
  `29665185005be2663b17d8c87423840b0c3d7a829f2869163d4340591226255c`.
- loaded preview.28 MVID:
  `ae6de567-905f-4ff3-9e01-337c504c03cf`.
- loaded runtime instance:
  `c228f93b292c4b34a5c77c95d03dcc91`.

No fixture or compilation result is being called organic game-over
qualification. A fresh natural intro -> summary -> return journey remains open.

## Abstraction Review

- `game_over`: **A, keep independent**. It has unique intro, summary,
  discovery/timeline, and run-finalization semantics.
- `card_bundle_selection`: **C, retain a strongly typed purpose Surface while
  reusing only non-authoritative bounded-selection mechanics**. Selection UI
  similarity does not authorize other bundle or deck effects.
- capability uniqueness: **B, shared protocol integrity rule**. It creates no
  actions and belongs in strict decoding/governance.
- no universal selector, menu action, completion predicate, or executable UI
  tree was introduced.

## Rollback

Rollback is the preview.27 source plus removal of `game_over` canary
permission. Do not roll back only the strict Re validation: it exposed a real
provider contradiction.
