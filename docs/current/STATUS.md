# Current Status

Baseline date: 2026-07-31

Branch baseline: `connectorV3` at
`2c49b0f826781ea8008dd686990ca76e023db98d`, plus the current uncommitted
Re map owner-and-choice contract repair.

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

The latest cold-loaded runtime uses SHA
`40d088745cd3e23844c06d81bbefd2b85ccb427104e7325d0719e3134607d84c`,
MVID `9add88e7-19d6-4854-95e3-060544ce5663`, runtime
`5af58fb23e544f488151057d6c2c53c9`, game `v0.110.0` commit `eecc8c4d`
and exact-bridge-only Modset fingerprint
`1b5f280d2206f1c12ca04f44b995b8f99224cff247b6495aaad30422099e3fc4`.

`run-20260731080952-3q4fw8` used V3 observation, commands and receipts for
menu, character select, event and reward actions. Its direct V3-native event
option completed with a successor observation. The new map Source Binding
also projected the exact current screen and three travelable choices without
the former ABI exception.

The run then stopped before map command submission because Re still validated
the historical one-binding route shape while V3 correctly supplied both
`map_screen` and `map_node`. The current Re repair requires exactly one current
screen plus exactly one current visible choice and rejects missing, replaced,
duplicated or extra bindings. Replaying the saved raw snapshot now yields an
actionable map with all three exact actions. A post-repair map mutation remains
pending exact-runtime evidence.

Exact attribution is recorded in
[v0.110.0 Live evidence](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_0_2026-07-31.md).
The event-option V3-native cutover now has exact Live evidence. Treasure-room
V3-native execution and post-repair map mutation remain pending. The earlier
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
| automated tests | Gateway 218 and Re 221 passed; docs, CLI, run identity, compatibility, permission, qualification, Profile and migration checks passed |
| Release build | current Mod `0.6.0-dev`, SHA `40d088745cd3e23844c06d81bbefd2b85ccb427104e7325d0719e3134607d84c`, MVID `9add88e7-19d6-4854-95e3-060544ce5663` |
| installed | verified equal to current Release SHA/MVID after clean game shutdown |
| loaded | verified equal to Release/installed SHA `40d088...`, MVID `9add88e7...`, runtime `5af58f...` |
| V3 mutation canary | direct V3-native event plus menu, character-select and reward mutations obtained on the current loaded identity |
| V3 bounded journey | latest nine-decision run stopped before map mutation on a Re contract-generation mismatch; raw snapshot replay passes after the current repair |
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

The repair is Re-only; the exact Gateway artifact is already loaded. Run:

```bash
cd /Users/fire/Desktop/SpireAgent/Re-SpireAgent
npm run agent:run
```

That local entry delegates to the real `connectorV3` checkout without copying
secrets or run evidence.
