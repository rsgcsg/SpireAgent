# Current Status

Baseline date: 2026-07-31

Branch baseline: `connectorV3` at
`8c68d124e7e02ffd4a8cf0a243a674e34fa92858`, plus the current uncommitted
repair wave.

## Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) is the
only current Connector target. Bridge v2 remains internal migration material
and rollback capability, not the default Agent contract.

Current V3 source implements:

- `3.0-preview.1` observation and command schemas;
- exact state token and entity identity;
- one visible active interaction, including visible unsupported states;
- parameterized commands and action-local receipts;
- direct native combat, shop-room, map, rest-site and deck-enchant resolvers;
- bounded non-combat native-binding migration adapters;
- one controller, exact environment authority, idempotent command ledger,
  semantic Outcome and unknown-no-retry;
- V3 REST/MCP and strict Re default consumption.

## Exact V3 Runtime Evidence

The latest cold-loaded runtime used SHA
`68eed0b4890a96741dcb3f234e936149bfcc32affc806eb0c17db1142cc69685`,
MVID `54decad4-0ab8-4b4a-92c7-04aa2b5a35fb`, runtime
`a009ff9f1bbf4a35bffe5a1c73ae4e95`, game `v0.110.0` commit `eecc8c4d`
and the exact-bridge-only Modset.

Twenty-one runs used V3 observation, parameterized commands and receipts for
117 submitted commands. They exercised combat and ordinary non-combat
families. The final `run-20260731040632-00yz1g` completed one game and stopped
at the normal non-actionable main-menu boundary.

The same runtime exposed three bounded defects: v0.110.0 changed the map
`GetLocalDrawingMode` CLR signature; Dream Catcher opened a valid rest-site
child after Heal that the old Outcome did not accept; and Symbiote opened an
unregistered deck-enchant source which Re then projected with the wrong
unsupported shape. The repair wave adds a bounded map ABI binding, exact
rest-child handoff Outcome, exact Symbiote source contract, and direct V3 map,
rest and deck-enchant resolvers.

Exact attribution is recorded in
[v0.110.0 Live evidence](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_0_2026-07-31.md).
The new repair SHA/MVID has no loaded or mutation evidence yet. The earlier
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
| automated tests | Gateway 216 and Re 220 passed; docs, CLI, run identity, compatibility, permission, qualification, Profile, migration, audit and MCP checks passed |
| Release build | verified, Mod `0.6.0-dev`, SHA `24f44c2482efe36a86be3dd9d085542676c275f5acf7f9c40b47329616069c2b`, MVID `5feaf546-00c4-436c-8391-96a6087e8eb7` |
| installed | verified equal to Release SHA/MVID after clean game shutdown |
| loaded | non-claim; game is stopped and Gateway is unreachable until the next cold start |
| V3 mutation canary | obtained for the preceding exact v0.110.0 SHA/MVID only |
| V3 bounded journey | completed on preceding exact v0.110.0 SHA/MVID; repair artifact pending |
| V3 durable claim | none |

Current repaired-install rollback:
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
