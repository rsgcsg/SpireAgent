# Workflow C Preview.80 Standard-Run Boundary Contract Wave Closeout

Status: source/test/build/install verified; loaded Preview.80 and all
Preview.80 runtime behavior are non-claims pending cold start.

## Baseline And Evidence

The implementation started from clean `develop@9402fedbda46d3cdb038a508fb29510300cbf16c`.
The fixed Prompt/guide baseline remained global `4` / state guide `5`.
No Prompt, strategy, native legality, permission ceiling or Re completion rule
changed.

All three new runs used exact loaded Preview.79:

```text
protocol        2.0-preview.79
Gateway SHA     1032e079ea1344fb42d1dce4f4dc60bfd85b36c1d7db167877d9e475dddf9268
Gateway MVID    d9435656-951f-42f7-8275-7adc67f05572
runtime         5faa3faa07ca4331a0eedadc3d91e1c3
game            v0.109.1|c8c577f6|-820620422
Modset          exact_bridge_only / b1459e824410741a87c1af91b132e90e61de1161400b75112c2cd1f1d5e4c785
Patch           clean_known_owners / ba7852fbfe6f940c4795b365646e4ae4f3fb4ee888a06c237fd61f6f018da70b
permission      migration_exploration / provisional_trial_scoped
qualification   empty
provenance      unrecorded
```

| Run | Fact | Attribution |
|---|---|---|
| `run-20260730031529-qlyj44` | one decision; `not_executed_llm_failure`; DeepSeek `fetch failed`; no Gateway submit | Re/provider network failure |
| `run-20260730032119-vivqvr` | 173 decisions; 170 settled; one actionless settling state; one pre-submit stale treasure choice; completed boundary | exact Preview.79 Connector coverage |
| `run-20260730033205-b759ts` | 100 decisions; 98 settled; one pre-submit stale treasure choice; completed boundary | exact Preview.79 Connector coverage |

The two complete runs contain no unsupported, unknown, unsettled, observation
or command failure. They exercise ordinary menu/character start, event choice
and proceed, card reward selection, game-over advance/return, broad combat,
reward, map, rest, shop and treasure behavior. One run also exercises three
Headbutt CombatPile lifecycles; the other exercises merchant removal and
combat-hand selection. Their provenance permits defect and coverage claims,
not Organic qualification or durable authority.

## Architecture Verdict

Verdict B remains correct: the Semantic Gateway two-plane macro architecture
is retained, while the authority identity migration continues vertically.
Preview.80 removes fallback identity from five complete, internally coherent
standard-run boundary Surfaces. It adds no publication path, authority
resolver, universal selector or client-side game rule.

The audit rejected three tempting migrations:

- `reward_claim`: unknown native Reward subtypes are still represented as
  `other_visible_reward`; that is visible and executable through the exact
  native button but is not sufficient durable semantic identity.
- CombatPile and combat-hand selection: the shared selector mechanics do not
  establish one source-independent business contract. Headbutt evidence cannot
  qualify Seance, Dredge or another source.
- Rest: `choose_rest_option` spans Heal's HP/option postcondition and Smith's
  upgrade-child handoff. One operation-level completion contract would erase
  this condition partition.

This identifies a real remaining control-plane defect: volatile session grants
are keyed by `surface + operation`. That is too coarse for a family whose
source or condition changes Commit/Outcome. Such a family must receive an
explicit source/condition partition before durable migration; counting it as a
generic explicit contract would be dishonest.

## Contract Wave

The wave moves 13 operations to distinct explicit native contracts:

```text
singleplayer_menu
  open_standard_run_setup
  back_from_singleplayer_menu

character_select
  select_character
  decrease_ascension
  increase_ascension
  embark_standard_run
  back_from_character_select

event_option
  choose_event_option
  proceed_event

card_reward_selection
  select_card_reward
  choose_card_reward_alternative

game_over
  advance_game_over_summary
  return_game_over
```

Each contract records an exact owner, source control, operands, native Commit,
completion boundary and Witness. Providers expose their completion evidence as
constants, and `StandardRunBoundaryFamiliesUseExplicitNativeContracts` proves
catalog/provider parity. Publication and execution still use the existing
single resolver and execute-time revalidation.

The catalog changes from `22 explicit / 65 fallback` to
`35 explicit / 52 fallback`. Supported mixed explicit/fallback Surface count
remains zero. Fallback durable claim admission remains impossible.

## Verification And Deployment

Executed:

```text
targeted Gateway contract tests       2/2 passed
complete Gateway tests              202/202 passed
Re tests                             212/212 passed
Re typecheck / production build        passed
Connector CLI / run-identity checks    passed
docs / links / machine inventories     passed
compatibility fixtures                   6 passed, non-authorizing
permission fixtures                      4 passed, non-authorizing
qualification/profile/migration checks passed
operation binding audit                 reviewed bindings match
CombatPile compatibility audit          Tutor remains code_required
Release Gateway build                  passed, 0 warnings/errors
JSON validation / git diff check       passed after canonical sync
```

The compatibility audit result is
`review_required_unregistered_callers`, not a failed test and not an
authorization. It identifies `Tutor` as
`code_required_new_owner_binding`; all static matches remain non-authorizing.

Preview.80 disk identity:

```text
protocol             2.0-preview.80
built/installed SHA  0677c62957cebb0ec0b9eb0f1a24fd947a5b99f30371de4eda4c219e2bcc6a20
built/installed MVID 23327e75-554e-4ce5-bdf0-c91b71745b8c
install state        installed_game_must_be_cold_started
rollback             STS2MCP/.local/deployments/2026-07-30T06-40-06-163Z
loaded               non-claim
```

The installer confirmed one canonical Gateway manifest and no duplicate
manifest. A final disk inspection confirmed built/installed SHA and MVID
equality. Its overall result is intentionally not ready because the game is
closed and the Gateway is unreachable; no loaded identity, observation,
Inspection, mutation or trial readiness is claimed. The rollback snapshot
contains the previously loaded Preview.79 artifact.

## Evidence Debt And Next Boundary

Pending exact-runtime evidence:

- every Preview.80 mutation and loaded identity;
- character-select ascension decrease/increase and back;
- single-player submenu back;
- card-reward alternative;
- Kifuda and New Leaf natural source journeys;
- source/condition partition design and migration for CombatPile, combat-hand,
  Rest and other multi-semantic fallback operations.

Typed unsupported or out of scope remains Crystal Sphere, standalone manual
potion discard, Tutor's target-owner topology, unknown generated sources,
non-standard profile/menu paths and multiplayer.

The next executable step is a cold game start followed by:

```bash
cd Re-SpireAgent
npm run agent:run
```

The run must report Preview.80 SHA/MVID before any Preview.80 runtime statement
is accepted.
