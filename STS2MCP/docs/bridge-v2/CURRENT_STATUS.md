# Bridge v2 Current Status

This is the canonical current Gateway/Re boundary. Historical preview reports
retain only their recorded environment evidence.

## Source And Artifact Truth

```text
Gateway/Re source     2.0-preview.72
Re normalized schema 29
game release          v0.109.1|c8c577f6
release-declared hash -1041364841 (diagnostic only)
actual loaded hash    -820620422
game assembly SHA     2cb39e2eee651743829abcc0df4dd9cd7e65f46287c7ca264481115c9602382f
game assembly MVID    208f08b8-d5f5-47f8-9e96-d3a4299ee709
built SHA             debc229e7affb514ba25e3f9485cfef8235c6213623ef490934d22072d2ddeed
installed SHA         debc229e7affb514ba25e3f9485cfef8235c6213623ef490934d22072d2ddeed
loaded SHA            debc229e7affb514ba25e3f9485cfef8235c6213623ef490934d22072d2ddeed
built MVID            6d9d4adf-6c34-4401-950f-69980dc5d3d8
installed MVID        6d9d4adf-6c34-4401-950f-69980dc5d3d8
loaded MVID           6d9d4adf-6c34-4401-950f-69980dc5d3d8
runtime epoch         b2332a06f756495a84936520b79cecba
rollback              STS2MCP/.local/deployments/2026-07-28T14-31-37-745Z
```

The installation has one canonical `STS2_MCP` manifest and no duplicate
Gateway manifest. Preview.72 source, build, installed, and loaded artifact
agree. A same-source Release rebuild produced a new binary identity and was
cold-loaded on 2026-07-29. The loaded environment is exact bridge-only
`migration_exploration`: normal observation and provisional trial are ready;
Inspection and pre-existing mutation authority are disabled. Earlier runtime
identity and grants do not transfer. Loaded identity is not action, Organic, or persistent
qualification evidence.

## Current Boundary

- Diagnostic observation, encounter provisional trial, and persistent
  qualification are separate.
- A complete unreviewed game identity may expose player-visible diagnostic
  state while starting with no action or Inspection authority.
- In `migration_exploration`, only current uniquely source-resolved actions may
  receive exact-runtime `encounter_source_resolved` grants. Confirmed completion
  yields only `session_trial_confirmed`; restart rolls it back.
- Failure, timeout, witness mismatch, identity/Patch/mode drift, or expiry
  quarantines the affected runtime scope.
- One active Surface is resolved once before authority projection. An
  unadmitted sibling cannot erase an admitted forward action.
- The new/resumed-run mount lifecycle is
  `run_transition/setup/awaiting_run_state + no_action + settling`. Missing
  shared HUD is deferred only for this exact actionless state and carries the
  typed diagnostic
  `bridge.shared_state.deferred_during_run_mount_transition`. Every other
  active-run shared-state failure remains unsupported and fail closed.
- Re refreshes dynamic capabilities during coherent state reads. Startup
  negotiation is not a frozen grant snapshot.
- Provider transport retry is Re-side and pre-mutation only; Gateway unknown
  outcomes remain terminal and are never retried.

The target remains ADR-0002, refined by ADR-0003 and
[ADR-0004](../../../docs/current/decisions/ADR-0004-risk-calibrated-encounter-trial-and-scoped-claims.md).
`surface_kind + operation` is still the current grant lookup key, not the final
compatibility identity.

## Runtime Evidence And Permission Truth

Runs `run-20260728020651-03352e`, `run-20260728021602-bz2rop`,
`run-20260728033215-6n8wsq`, and `run-20260728033638-xrvcre` belong only to the
older loaded `8e7a.../0e3d.../740e...` identity. They provide:

- 258 `executed_and_settled` decisions across ordinary menu, event, map,
  combat, reward, rest, shop, treasure, selector, and game-over flows;
- six safe pre-execution stale-state rejections with later fresh progress;
- one bounded game-over-to-main-menu stop without entering a second game;
- one provider `fetch failed` stop before mutation; and
- one fresh-menu run that reached 100 ticks and stopped at the old decision
  ceiling rather than a game boundary.

All four metadata records declare provenance `unrecorded`. They are current-
build runtime coverage/defect evidence, not Organic qualification. Their
runtime authority does not transfer to another MVID. Historical runs have no
`run-summary.json` and are not backfilled.

Current exact-identity run `run-20260728041630-2z58bz` provided live evidence
for the final run-mount repair. It resumed a saved floor-9 run, completed 114
actions, rejected 11 stale selections before execution, recorded one
Gateway-confirmed `end_turn` whose Re successor-settlement budget expired,
completed the loss/game-over/menu lifecycle, and stopped before a second game.
Its immutable summary is `completed_run_boundary` after 127 decisions. No
unsupported Surface, invalid state, observation failure, executed-unsettled or
unknown mutation occurred.

This run is also `unrecorded`: it proves exact-runtime repair and broad
coverage, not Organic or persistent qualification. Grants remained
operation-scoped and runtime-bound; successful operations reached at most
`session_trial_confirmed`, while `persistent_authority_enabled=false`.

Same-runtime run `run-20260728044555-ltyx7d` then completed a fresh
character-select-to-game-over-to-main-menu boundary: 106 settled actions in
107 decisions, with zero stale, unsupported, invalid, observation/provider
failure, unsettled, or unknown outcomes. It is also `unrecorded`.

Preview.70's read-only run audit found no composite-only stale candidate in
either current run. All 11 earlier stale refusals changed the semantic
candidate; two also changed authority. Preview.70 therefore keeps composite
state/action binding. It separately marks only five explicit component
contracts as non-authorizing digest candidates; 82 fallback rows remain
manifest hypotheses.

Three later runs share the exact loaded Preview.70 identity:

- `run-20260728062709-srruj8` stopped before mutation on repeated provider
  `fetch failed`;
- `run-20260728062739-cytun5` settled 69 actions, then timed out after native
  `open_treasure_chest` had consumed a Silver Crucible empty chest and reached
  normal Proceed. The old Oracle incorrectly required a non-null relic result;
- `run-20260728063258-5z9wpz` resumed at that completed treasure room, settled
  121 actions, safely rejected two semantic-changing stale selections, and
  completed the game-to-menu boundary at decision 124 without unsupported or
  observation failure.

Preview.71 shares treasure lifecycle classification between projection and
the action-local Oracle. Open completion now accepts either a non-empty
relic-choice handoff or a settled empty chest with normal Proceed. Treasure
open becomes the sixth explicit non-authorizing contract candidate; 81 rows
remain manifest hypotheses.

Four later exact Preview.71 runs close the earlier not-loaded claim:

- `run-20260728085047-akattr` and `run-20260728090432-731pf1` repeated the
  exact Hefty Tablet source-binding failure before mutation;
- `run-20260728090507-p3jx5s` crossed 111 decisions and then exposed Re's
  incorrect mutation-scope requirement for an actionless Skill Potion
  `settling` Surface; and
- `run-20260728091032-3oihpi` completed the run boundary.

Preview.72 keeps the shared generated-card interaction Surface while adding an
exact sealed Hefty Tablet source, explicit Injury tradeoff, and dedicated
select/skip deck Witness. It also lets Re consume a scoped actionless settling
Surface as observation with `actionAuthority=none` and no allowed action. Protocol/schema,
fixtures, and Bridge/Re tests are updated.

Current-runtime run `run-20260728132337-ce2195` then completed a fresh
main-menu-to-game-over-to-main-menu boundary: 144 settled actions in
146 decisions, one stale selection rejected before execution, and no
unsupported, invalid, observation/provider failure, unsettled or unknown
outcome. It crossed combat, event, map, reward, rest, shop, treasure, transform
and menu flows. Provenance is `unrecorded`, Inspection was disabled, and neither
Hefty nor actionless-settling repair was naturally exercised. This is exact-
runtime coverage, not Organic or persistent qualification.

Same-identity run `run-20260728141035-uhrp19` completed another fresh
game-to-menu boundary: 107 settled actions in 108 decisions, with no stale,
unsupported, invalid, observation/provider failure, unsettled, or unknown
outcome. It remains `unrecorded` coverage evidence. The new Re-side baseline
report correctly finds its Gateway/game/Modset identity exact but its Re source
identity incomplete because the run predates source-digest recording. No
Gateway permission or qualification changed.

## Remaining Boundaries

Known unsupported or evidence-limited scope includes Tutor's unreviewed owner
binding, Crystal Sphere, standalone manual potion discard, generated-card
sources other than the exact registered native branches, non-standard
profile/menu paths, multiplayer, and incomplete player-visible detail families.
Hefty Tablet is implemented but remains branch-specific Live-evidence pending.
Static audits, fixtures, trial success, and old MVID evidence do not convert
these into support.

## Next Engineering Step

Remain in the Gate 2 C readiness track while the repository enters M1
Measurable External Agent Baseline. Freeze the exact A baseline, build the
minimum representative/held-out D contract, and keep naturally reached Hefty
select/skip or generated-combat settling transitions as targeted canaries. Do
not manufacture them or retry an unknown mutation. No evidence here authorizes
persistent promotion, generic cross-version/Mod compatibility, or the explicit
unsupported scopes above.
