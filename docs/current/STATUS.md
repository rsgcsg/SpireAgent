# Current Status

Baseline date: 2026-07-31

Branch baseline: `connectorV3` at
`5640d2c1590aa3682a113dec3aae9ff082235cb8`, plus the current uncommitted
Windows deployment/startup repair, v0.110.1 static compatibility fixture and
V3-native card-reward cutover.

## Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) is the
only current Connector target. Bridge v2 remains internal migration material
and rollback capability, not the default Agent contract.

Current V3 source implements:

- `3.0-preview.1` observation and command schemas;
- exact state token and entity identity;
- one visible active interaction, including visible unsupported states;
- parameterized commands and action-local receipts;
- direct native combat, shop-room, map, rest-site, event-option, treasure-room,
  reward-claim, card-reward and deck-enchant resolvers;
- bounded non-combat native-binding migration adapters;
- one controller, exact environment authority, idempotent command ledger,
  semantic Outcome and unknown-no-retry;
- V3 REST/MCP and strict Re default consumption.

## Exact V3 Runtime Evidence

The current v0.110.1 artifact is cold-loaded as SHA
`b3897459d122e7208ad7d6fa2e56816ec594146fa92c637eecfd691a4fd2a469`,
MVID `591c6251-d2a3-4281-b723-9a048b0ac9d0`, runtime
`98b52677796c4e6aa103c404a6952789`, game `v0.110.1` commit `db5d3552`,
release assembly hash `-959015736`, with an exact-bridge-only Modset. Source,
Release, installed and loaded artifact identities agree.

`run-20260731104027-lxj3h3` exercised the complete `agent:run` startup,
DeepSeek decision and V3 submit/poll path. Decision
`decision-000001-ms8ta5sn-ueffiu` executed one advertised `main_menu` command
and settled. The process then stopped intentionally at `--max-ticks 1` before
a run boundary. This is exact-runtime session-canary evidence for startup and
that menu command only; it is not a completed journey, card-reward evidence or
durable qualification.

The previous v0.110.0 exercised runtime used SHA
`40d088745cd3e23844c06d81bbefd2b85ccb427104e7325d0719e3134607d84c`,
MVID `9add88e7-19d6-4854-95e3-060544ce5663`, runtime
`2b379e0ef1574de6a482e16b31619981`, game `v0.110.0` commit `eecc8c4d`
and exact-bridge-only Modset fingerprint
`1b5f280d2206f1c12ca04f44b995b8f99224cff247b6495aaad30422099e3fc4`.

Eleven runs from `run-20260731081935-zv6pbq` through
`run-20260731083523-r3am2e` recorded 264 decisions on source revision
`117eb6f...`: 244 settled, three checkpoint-pending, six safely stale, two
invalid model-selected IDs, one provider fetch failure, five typed
unsupported/quarantined stops, one pre-Commit potion rejection and two
unknown Outcomes. V3-native map, event and treasure commands all completed on
this exact runtime. The map owner-and-choice repair is therefore exercised,
not merely replayed.

The runs exposed three current Gateway defects now repaired in source:

- a self-target potion candidate omitted its exact player-creature target,
  causing publication/execution legality drift;
- Headbutt waited for the whole source-card task after the exact selected card
  had already reached draw-top and the selector had closed;
- `end_turn` treated native cleanup before phase handoff as an unexpected
  state transition.

The first is fixed by exact target entity binding. The latter two retain
action-specific probes but permit the native asynchronous boundary. Outer
reward claim/discard/proceed candidate discovery and execution are now
V3-native and no longer use `draft.Actions` or `LegacyBinding.Start()`.
Those changes are present in the current branch HEAD. Card-reward
select/alternative discovery and execution now also avoid `draft.Actions` and
`LegacyBinding.Start()`; exact selectable-card facts and a consistently
filtered option-set Witness were added in the current worktree.

Steam updated the local game after the v0.110.0 journey to `v0.110.1`, commit
`db5d3552`, release main assembly hash `-959015736`, `sts2.dll` SHA
`7c446efabf80614c429b5088e87101423aa5bb4c04fc3e73393261f6e6d404fd`
and MVID `c0f649b8-8d57-4a9c-8b07-21aece97dca0`. Static compatibility grading
passes with 14 registered matches and the existing Tutor diagnostic holdout;
all reviewed operation-binding probes match. The report itself has no
authorization or qualification effect. The separately recorded cold load and
menu canary above are the current runtime evidence.

Exact attribution is recorded in
[v0.110.0 Live evidence](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_0_2026-07-31.md).
Event-option, treasure-room and post-repair map V3-native execution now have
exact Live evidence. The current combat Outcome repairs and reward-native
cutover remain pending. The earlier
[v0.109.1 evidence](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_2026-07-31.md)
remains historical exact-runtime evidence only.

## Predecessor Runtime Evidence

The latest exact loaded artifact before this cutover was Bridge v2
`2.0-preview.82`, SHA
`f5f4791091f0480432d2c30ce3bd8f946049380fde0ab02053692285c4ee3b4c`,
MVID `1e12b8d5-ebcc-4bf1-a4bc-a9b768cdcc0f`.

Recent predecessor runs:

- `run-20260731000937-2o8ur5` stopped on a provider response truncated at the
  configured output limit; the strict format retry now has a larger bounded
  output allowance.
- `run-20260731001404-d2xlwt` and
  `run-20260731001658-eouihd` stopped at the same exact unsupported
  `NCombatPileCardSelectScreen`. Source audit identified
  `StratagemPower.AfterShuffle`; the single-stack source is now explicitly
  bound to its native draw-to-hand Outcome.
- `run-20260731003323-4w0q4a` completed a 158-decision one-game boundary and
  stopped normally after returning to the main menu.

These runs are defect and predecessor-coverage evidence. They are not V3 Live
evidence or durable V3 qualification.

## Evidence State

| State | Current result |
|---|---|
| source | V3 `3.0-preview.1` implemented on `connectorV3` worktree |
| automated tests | Gateway 220 and Re 222 passed; Python MCP lock/compile, docs, CLI, run-identity, exact v0.110.1 compatibility/binding audit, permission, qualification, Profile and migration checks passed |
| Release build | current Mod `0.6.0-dev`, SHA `b3897459d122e7208ad7d6fa2e56816ec594146fa92c637eecfd691a4fd2a469`, MVID `591c6251-d2a3-4281-b723-9a048b0ac9d0` |
| installed | verified equal to current Release SHA/MVID after clean game shutdown |
| loaded | source/Release/installed/loaded SHA and MVID agree; runtime `98b52677796c4e6aa103c404a6952789`, exact game and exact-bridge-only Modset verified |
| V3 mutation canary | current v0.110.1 runtime exercised one advertised `main_menu` command with `executed_and_settled`; direct combat and card reward remain pending |
| V3 bounded journey | prior runtime reached 152 decisions and several shorter continuations; current repair remains pending exact-runtime evidence |
| V3 durable claim | none |

Current v0.110.1 install rollback:
`STS2MCP/.local/deployments/2026-07-31T09-52-39-492Z`.
Previous repaired-install rollback:
`STS2MCP/.local/deployments/2026-07-31T08-50-29-091Z`.
Previous current-runtime rollback:
`STS2MCP/.local/deployments/2026-07-31T06-55-35-150Z`.
Previous loaded-repair rollback:
`STS2MCP/.local/deployments/2026-07-31T04-34-03-246Z`.
Previous v0.110.0 evidence artifact rollback:
`STS2MCP/.local/deployments/2026-07-31T03-37-42-912Z`.
First-V3-install immediate predecessor:
`STS2MCP/.local/deployments/2026-07-31T01-49-06-262Z`.
Final pre-V3 rollback:
`STS2MCP/.local/deployments/2026-07-31T01-45-37-637Z`.

## Immediate Next Step

With the current game and Gateway still running, continue the bounded run:

```bash
cd Re-SpireAgent
npm run agent:run
```

The local entry reads the exact Windows game directory from ignored
`Re-SpireAgent/.env.local`, delegates to the real `connectorV3` checkout and
verifies loaded SHA/MVID/runtime before mutation. Current v0.110.1 authority
remains an exact-runtime session canary, not inherited qualification.
