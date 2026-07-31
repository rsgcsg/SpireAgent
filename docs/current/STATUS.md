# Current Status

Baseline date: 2026-07-31

Branch baseline: `connectorV3` at
`19ec93c66c02612a78556b9b7e513d8853c79e48`, plus the current uncommitted V3
cutover work.

## Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) is the
only current Connector target. Bridge v2 remains internal migration material
and rollback capability, not the default Agent contract.

Current V3 source implements:

- `3.0-preview.1` observation and command schemas;
- exact state token and entity identity;
- one visible active interaction, including visible unsupported states;
- parameterized commands and action-local receipts;
- direct native combat resolvers;
- bounded non-combat native-binding migration adapters;
- one controller, exact environment authority, idempotent command ledger,
  semantic Outcome and unknown-no-retry;
- V3 REST/MCP and strict Re default consumption.

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
| automated tests | Gateway 209, Re 219, CLI/docs/identity/compatibility/permission/qualification/profile/migration checks passed |
| Release build | verified, Mod `0.6.0-dev`, SHA `c045438f2a1d32bae1137f4ba2dc923c6f8aed0e1840854d7510bfc5d21577e2`, MVID `79b762d1-062d-485a-b36c-ac71f24944dd` |
| installed | verified equal to Release SHA/MVID |
| loaded | non-claim until cold game restart |
| V3 mutation canary | pending exact-runtime evidence |
| V3 bounded journey | pending exact-runtime evidence |
| V3 durable claim | none |

Final-install immediate predecessor:
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
