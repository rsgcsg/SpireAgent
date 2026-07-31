# Current Status

Baseline date: 2026-07-31

Branch baseline: `connectorV3` at
`117eb6fb01e4c6a4e2b93c1492b7d82f4d3ec438`, plus the current uncommitted
Gateway Outcome/target repair and V3-native reward-claim cutover.

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
  reward-claim and deck-enchant resolvers;
- bounded non-combat native-binding migration adapters;
- one controller, exact environment authority, idempotent command ledger,
  semantic Outcome and unknown-no-retry;
- V3 REST/MCP and strict Re default consumption.

## Exact V3 Runtime Evidence

The latest exercised cold-loaded runtime used SHA
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
These changes are built and installed but are pending a new cold load.

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
| automated tests | Gateway 219 and Re 221 passed; Python MCP lock/compile, docs, CLI, run-identity, compatibility, permission, qualification, Profile and migration checks passed |
| Release build | current Mod `0.6.0-dev`, SHA `d34c14ee676ed271525e526c007c92be14427b9d0373d6026391621a159cfe09`, MVID `a09f3ddb-ad39-44c0-915d-416be4ef6d80` |
| installed | verified equal to current Release SHA/MVID after clean game shutdown |
| loaded | `non-claim`; game is closed and the newly installed artifact has not cold-loaded |
| V3 mutation canary | prior exact artifact exercised direct combat, map, event and treasure; current artifact has no Live mutation |
| V3 bounded journey | prior runtime reached 152 decisions and several shorter continuations; current repair remains pending exact-runtime evidence |
| V3 durable claim | none |

Current repaired-install rollback:
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

Cold-start STS2, then run:

```bash
cd /Users/fire/Desktop/SpireAgent/Re-SpireAgent
npm run agent:run
```

That local entry delegates to the real `connectorV3` checkout without copying
secrets or run evidence.
