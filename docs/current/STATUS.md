# Current Status

Baseline date: 2026-07-31

Branch baseline: `connectorV3` at
`5de97c311c9dfcaa3bb3ec08976c8d8740c83005`, plus the current uncommitted
map source-binding and event/treasure V3-native migration wave.

## Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) is the
only current Connector target. Bridge v2 remains internal migration material
and rollback capability, not the default Agent contract.

Current V3 source implements:

- `3.0-preview.1` observation and command schemas;
- exact state token and entity identity;
- one visible active interaction, including visible unsupported states;
- parameterized commands and action-local receipts;
- direct native combat, shop-room, map, rest-site, event-option, treasure-room
  and deck-enchant resolvers;
- bounded non-combat native-binding migration adapters;
- one controller, exact environment authority, idempotent command ledger,
  semantic Outcome and unknown-no-retry;
- V3 REST/MCP and strict Re default consumption.

## Exact V3 Runtime Evidence

The latest cold-loaded runtime used SHA
`24f44c2482efe36a86be3dd9d085542676c275f5acf7f9c40b47329616069c2b`,
MVID `5feaf546-00c4-436c-8391-96a6087e8eb7`, runtime
`fb0774a99eaf4289b6ce928bc9070f3b`, game `v0.110.0` commit `eecc8c4d`
and exact-bridge-only Modset fingerprint
`a7bcbef56a870aff6373de9c89b89a40887e087209f75ffa522e4531440925e2`.

Seventeen runs from `run-20260731053147-8zvzpz` through
`run-20260731061038-hvey16` used V3 observation, parameterized commands and
receipts. They recorded 116 decisions and 99 submitted commands; every
submitted receipt completed. Exact-source runs exercised both Symbiote and
Self-Help Book deck enchant select/confirm lifecycles successfully. Dream
Catcher's rest child did not naturally appear and remains `not exercised`.

The same runtime proved that the first map repair was incomplete. The loaded
IL no longer called the obsolete zero-argument drawing API, but still called
the removed `NControllerManager.get_IsUsingController()` getter. Map
observations therefore failed closed with `MissingMethodException`. The
current source replaces that direct ABI dependency with a bounded map
input-mode Source Binding and disables shared compiler metadata caching in
the canonical build/test path.

Exact attribution is recorded in
[v0.110.0 Live evidence](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_0_2026-07-31.md).
The event-option and treasure-room V3-native cutovers, and the second map
repair, have source and automated evidence only until the next cold load. The earlier
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
| automated tests | Gateway 218 and Re 220 passed; docs, CLI, run identity, compatibility, permission, qualification, Profile and migration checks passed |
| Release build | current Mod `0.6.0-dev`, SHA `40d088745cd3e23844c06d81bbefd2b85ccb427104e7325d0719e3134607d84c`, MVID `9add88e7-19d6-4854-95e3-060544ce5663` |
| installed | verified equal to current Release SHA/MVID after clean game shutdown |
| loaded | latest verified loaded identity remains SHA `24f44c...`, MVID `5feaf546...`, runtime `fb0774...`; current installed SHA `40d088...` is `loaded = non-claim` until a cold start |
| V3 mutation canary | Symbiote and Self-Help Book deck enchant plus ordinary combat/event/reward/shop mutations obtained on the loaded identity |
| V3 bounded journey | 17-run follow-up obtained; map remained a real blocker and no repaired full journey is claimed |
| V3 durable claim | none |

Current repaired-install rollback:
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

Cold-start STS2 and run:

```bash
cd /Users/fire/Desktop/SpireAgent/Re-SpireAgent
npm run agent:run
```

That local entry delegates to the real `connectorV3` checkout without copying
secrets or run evidence.
