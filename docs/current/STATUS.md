# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline And Gate

- Agent: `Re-SpireAgent/`.
- Connector: `STS2MCP/` Semantic Gateway, REST contract, and optional MCP
  adapter.
- Legacy: original runtime and P8--P15 are archived; Gateway v1 is retired.
- Architecture: ADR-0002's A-first Semantic Gateway two-plane target, refined
  by ADR-0003 and ADR-0004.

Gate 1 is closed only as a bounded vanilla ordinary-single-player v2 baseline.
Gate 2 remains active for reliability, visibility closure, and native-contract
migration. This is not complete game, Mod, or persistent-qualification coverage.

## Source, Install, And Load

Current source contract is `2.0-preview.72`; Re normalized schema is `29`.
Preview.72 is built, installed, and Steam cold-loaded:

```text
game release    v0.109.1|c8c577f6
release hash    -1041364841 (release-declared diagnostic only)
actual hash     -820620422
built SHA       afb0261fdf1ca8433bdcbc3de2e1270f00daf802da3aaf507492357da399a140
installed SHA   afb0261fdf1ca8433bdcbc3de2e1270f00daf802da3aaf507492357da399a140
loaded SHA      afb0261fdf1ca8433bdcbc3de2e1270f00daf802da3aaf507492357da399a140
built MVID      3e9ad83a-37c9-40dc-bca0-877187c9bdae
installed MVID  3e9ad83a-37c9-40dc-bca0-877187c9bdae
loaded MVID     3e9ad83a-37c9-40dc-bca0-877187c9bdae
runtime epoch   14238a9e9bf443c580a8dfe80bd571fd
rollback        STS2MCP/.local/deployments/2026-07-28T13-05-29-650Z
Mod manifests   one canonical STS2_MCP manifest; no duplicate
```

Loaded Preview.72 reports exact bridge-only Modset, `migration_exploration`,
normal observation enabled, provisional trial ready, and no pre-existing
mutation or Inspection authority. Preview.71's volatile grants and runtime
evidence do not transfer. No Preview.72 action, Hefty/settling canary, Organic
evidence, or persistent qualification is claimed. The separate release-
declared hash `-1041364841` is diagnostic provenance, not actual-loaded
identity.

## Latest Live Evidence

Four earlier `unrecorded` Preview.69 runs were inspected under SHA
`8e7a...` / MVID `0e3d...` / runtime `740e...`:

- `run-20260728020651-03352e`: 97/100 actions settled; three pre-execution
  stale selections were safely rejected and fresh ticks continued.
- `run-20260728021602-bz2rop`: 62/65 actions settled; two safe stale
  rejections; completed the remaining game-over lifecycle and stopped at the
  top-level menu before starting another run.
- `run-20260728033215-6n8wsq`: stopped before mutation on provider
  `fetch failed`.
- `run-20260728033638-xrvcre`: entered from the main menu and settled 99/100
  actions; one safe stale rejection; stopped only at the old 100-tick ceiling.

This is real runtime coverage and defect evidence, not Organic qualification.
Their authority does not transfer to the current MVID.

Current-MVID run `run-20260728041630-2z58bz` resumed the saved floor-9 run,
crossed reward, card reward, map, treasure, combat, rest/Smith, game-over and
menu flows, and stopped at the one-game boundary:

```text
decisions                    127
executed_and_settled         114
executed_checkpoint_pending    1  (Gateway-confirmed end_turn)
not_executed_stale_state      11  (all rejected before execution)
run_boundary                   1
```

Its immutable summary records `completed_run_boundary`; there was no
unsupported, invalid-state, observation-failure, unsettled, or unknown
mutation outcome. Provenance is still `unrecorded`, so this is exact-runtime
coverage and repair evidence, not Organic or persistent qualification.
Operation grants remained runtime-bound `session_canary` /
`session_trial_confirmed`; `persistent_authority_enabled=false`.

A second same-runtime run, `run-20260728044555-ltyx7d`, started at character
select and completed a 107-decision game-to-menu boundary with 106 settled
actions and zero stale, unsupported, invalid, observation/provider failure,
unsettled, or unknown outcomes. Its provenance is also `unrecorded`.

The Preview.70 read-only identity audit found that all 11 stale refusals in the
earlier run changed the semantic candidate; two also changed authority, and
none changed only the legacy composite. This does not support switching state
binding. See the
[Preview.70 closeout](audits/PREVIEW_70_IDENTITY_AND_CONTRACT_SHADOW_CLOSEOUT_2026-07-28.md).

Preview.70 then supplied three same-runtime runs:

- `run-20260728062709-srruj8` stopped before mutation after two DeepSeek
  `fetch failed` attempts;
- `run-20260728062739-cytun5` settled 69 actions, then correctly stopped on an
  unknown `open_treasure_chest` outcome. Silver Crucible made the first chest
  empty; the native game reached normal Proceed, but the old Oracle required a
  non-null relic result and timed out;
- `run-20260728063258-5z9wpz` resumed the same exact runtime, started from the
  completed empty treasure room, settled 121 actions, safely rejected two
  semantic-changing stale selections, and completed the game-to-menu boundary
  at decision 124 with no unsupported or observation failure.

Preview.71 shares treasure lifecycle facts between projection and completion,
accepts either a visible relic-choice handoff or a settled empty chest with
normal Proceed, and promotes `treasure_room/open_treasure_chest` only from a
manifest hypothesis to the sixth explicit **non-authorizing** contract
candidate. See the
[Preview.71 closeout](audits/PREVIEW_71_EMPTY_TREASURE_OUTCOME_CLOSEOUT_2026-07-28.md).

Four later runs prove that Preview.71 was loaded and expose the next two exact
boundaries:

- `run-20260728085047-akattr` and `run-20260728090432-731pf1` stopped before
  mutation on the same exact Hefty Tablet generated-card choice because that
  relic source and its Injury side effect were not bound.
- `run-20260728090507-p3jx5s` completed 111 prior decisions, then Re rejected
  an actionless Skill Potion choice while Gateway truthfully reported
  `settling + candidate_observation_only`. This was an observation-versus-
  mutation-scope consumer bug, not missing Gateway permission.
- `run-20260728091032-3oihpi` completed the current run boundary in ten
  decisions without encountering either branch.

All four are exact-runtime coverage/defect evidence with `unrecorded`
provenance, not Organic or persistent qualification. Preview.72 adds exact
Hefty source/result semantics and permits actionless settling observation
without publishing an action or claiming action authority. See the
[Preview.72 A-first closeout](audits/PREVIEW_72_A_FIRST_GENERATED_CHOICE_ARCHITECTURE_CLOSEOUT_2026-07-28.md).

## Reliability Closeout

- The exact new/resumed-run mount `run_transition + no_action + settling` state
  may defer missing shared HUD only through a typed, actionless diagnostic contract. All
  other active-run shared-state failures remain fail closed.
- Re refreshes dynamic capabilities with each coherent observation; authority
  is not assumed stable from startup negotiation.
- A transient provider transport failure receives at most one retry before any
  game mutation. Unknown mutation outcomes are still never retried.
- New runs write immutable `run-summary.json`. Reaching `AGENT_MAX_TICKS` is an
  incomplete non-zero termination, not success; the default emergency ceiling
  is now 1000. Historical records are not backfilled.

## Immediate Next Step

Run the ordinary bounded Agent journey on the verified loaded Preview.72.
Naturally encountered Hefty select/skip
or generated-combat settling transitions are the highest-value canaries; do not
manufacture them or retry an unknown mutation. Continue player-visible
Inspection/detail closure and native-contract migration only after this current
artifact is loaded. Remaining explicit unsupported scope includes Tutor's
unreviewed owner binding, Crystal Sphere, standalone manual potion discard,
unbound source variants, non-standard profile/menu paths, multiplayer, and
incomplete visible-detail families.
