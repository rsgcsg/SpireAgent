# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline And Gate

- Agent: `Re-SpireAgent/`.
- Connector: `STS2MCP/` Semantic Gateway, REST contract, and optional MCP
  adapter.
- Legacy: original runtime and P8--P15 are archived; Gateway v1 is retired.
- Architecture: ADR-0002, refined by ADR-0003 and ADR-0004.

Gate 1 is closed only as a bounded vanilla ordinary-single-player v2 baseline.
Gate 2 remains active for reliability, visibility closure, and native-contract
migration. This is not complete game, Mod, or persistent-qualification coverage.

## Source, Install, And Load

Current source contract is `2.0-preview.71`; Re normalized schema is `28`.
The Preview.71 source build is installed but not loaded because the game is
closed:

```text
built SHA       fd0f7c56cbafd7fcf84386b0ee69944ca2f8170f8982dce9640d2e4f5cf679e6
installed SHA   fd0f7c56cbafd7fcf84386b0ee69944ca2f8170f8982dce9640d2e4f5cf679e6
loaded SHA      not loaded (game closed)
built MVID      0acccd3d-8d08-4f95-ae64-75fc758a95f5
installed MVID  0acccd3d-8d08-4f95-ae64-75fc758a95f5
loaded MVID     not loaded (game closed)
runtime epoch   none for Preview.71
rollback        STS2MCP/.local/deployments/2026-07-28T08-46-30-998Z
Mod manifests   one canonical STS2_MCP manifest; no duplicate
```

The last loaded Preview.70 runtime reported game
`v0.109.1|c8c577f6|-820620422`, SHA `28c32f40...`, MVID `6f169dfe...`, runtime
`a31b1c...`, exact bridge-only Modset, clean known Patch owners, and
`migration_exploration`. Those runtime facts and grants do not transfer to
Preview.71. Inspection and persistent qualification remain
unclaimed for the new artifact.

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

Cold-start the installed Preview.71 artifact and run the ordinary bounded Agent
journey. First verify loaded protocol/SHA/MVID; then use the run only as scoped
coverage evidence. The most valuable canary is another naturally reached
Silver Crucible empty first chest; do not manufacture or retry an unknown
mutation. Continue player-visible Inspection/linked-detail closure and ADR-0003
native-contract migration without widening permission. Remaining explicit unsupported
scope includes Tutor's
unreviewed owner binding, Crystal Sphere, standalone manual potion discard,
unbound source variants, non-standard profile/menu paths, multiplayer, and
incomplete visible-detail families. Read-only Inspection remains independently
scoped.
