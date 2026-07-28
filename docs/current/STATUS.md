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

Current source contract is `2.0-preview.69`; Re normalized schema is `28`.
The final source build is installed and loaded in the current exact runtime:

```text
built SHA       914974b5177364665dacd26dc614d7f23faa61924d4f68fff3e49a8572fa4789
installed SHA   914974b5177364665dacd26dc614d7f23faa61924d4f68fff3e49a8572fa4789
loaded SHA      914974b5177364665dacd26dc614d7f23faa61924d4f68fff3e49a8572fa4789
built MVID      1e457e86-8eba-4878-869b-f7545366fa1e
installed MVID  1e457e86-8eba-4878-869b-f7545366fa1e
loaded MVID     1e457e86-8eba-4878-869b-f7545366fa1e
runtime epoch   7a312974c7114abcaa623b9e60e8f438
rollback        STS2MCP/.local/deployments/2026-07-28T04-15-57-837Z
Mod manifests   one canonical STS2_MCP manifest; no duplicate
```

The Gateway reports game `v0.109.1|c8c577f6|-820620422`, exact bridge-only
Modset, clean known Patch owners, and `migration_exploration`. Inspection and
persistent qualification remain disabled for this identity.

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

Continue Gate 2 from the exact current identity without widening permission:
review the observed pre-execution stale rate and the single long enemy-turn
settlement timeout, then prioritize player-visible Inspection/linked-detail
closure and ADR-0003 native-contract migration. Remaining explicit unsupported
scope includes Tutor's
unreviewed owner binding, Crystal Sphere, standalone manual potion discard,
unbound source variants, non-standard profile/menu paths, multiplayer, and
incomplete visible-detail families. Read-only Inspection remains independently
scoped.
