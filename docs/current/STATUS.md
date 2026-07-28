# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline And Architecture

- Agent: `Re-SpireAgent/`.
- Connector: `STS2MCP/` Semantic Gateway, REST contract, and optional MCP
  adapter.
- Legacy: original runtime and P8--P15 are archived; Gateway v1 is retired.
- Target: ADR-0002 two-plane Semantic Gateway, refined by ADR-0003 native-
  contract/operation retirement and ADR-0004 risk-calibrated encounter trials.

Gate 1 is closed only as a bounded vanilla ordinary-single-player v2 baseline.
Gate 2 remains active for reliability, visibility closure and native-contract
migration. This is not complete game or Mod coverage.

## Source And Installation

Current source contract is `2.0-preview.69`; Re normalized schema is `28`.
Preview.69 is built and installed, but the game is closed and the artifact is
not yet loaded:

```text
built SHA       7e7405c6c94dbecaaf0ba7a4cad5229c974e892bc4c527a2213c8cadd3cbb8a1
installed SHA   7e7405c6c94dbecaaf0ba7a4cad5229c974e892bc4c527a2213c8cadd3cbb8a1
built MVID      fc1a3e54-1691-4518-ba92-c492cdce6733
installed MVID  fc1a3e54-1691-4518-ba92-c492cdce6733
loaded SHA      not loaded
loaded MVID     not loaded
rollback        STS2MCP/.local/deployments/2026-07-28T00-07-42-715Z
Mod manifests   one canonical STS2_MCP manifest; no duplicate
```

The last verified loaded artifact remains Preview.68
(`d3379139...2418f`, MVID `6c2e1933-462c-43ae-ad6f-edb60b1bf19c`). Its runtime
grants cannot authorize Preview.69.

## Preview.69 Changes

- Models the post-embark mounting gap as
  `run_transition + no_action + settling`.
- Repairs Orb SmartDescription inputs using native `energyPrefix`, `Passive`
  and `Evoke` variables.
- Lets Re recover from a proven reversible Surface cycle by withholding only
  the return edge when another advertised forward action remains.
- Resolves one active Surface once, then projects action authority; dead second
  ownership resolution was removed.
- Separates diagnostic observation, current encounter trial admission, and
  persistent compatibility claims.
- In `migration_exploration`, only current uniquely source-resolved actions may
  receive volatile `encounter_source_resolved` grants. Success becomes
  `session_trial_confirmed`; failure or drift quarantines the runtime scope.
- `run-agent` probes current state first. Bulk candidate-package migration is a
  legacy fallback, not the target startup path.

## Evidence Boundary

Recent Preview.68 runs prove the defects, not Preview.69 behavior:

- `run-20260727135445-hbzl7p`: 98 settled actions; stopped at decision cap.
- `run-20260727140034-8p5zum`: correct game-over to main-menu boundary.
- `run-20260727140238-g0sq13`: reproduced unsupported post-embark gap.
- `run-20260727141159-oc7w6m` and `run-20260727141328-3r0qs2`:
  reproduced the shop open/close semantic cycle.

Their provenance is `unrecorded`; they are real-runtime defect/coverage
evidence, not Organic qualification. Compilation, fixtures and installation do
not prove loaded or live behavior.

## Immediate Next Step

Cold-start STS2, stop at any normal single-player state, then run only:

```bash
cd /Users/fire/Desktop/SpireAgent/Re-SpireAgent
npm run agent:run
```

The live check must confirm loaded Preview.69 SHA/MVID, diagnostic or current
authority path, runtime-epoch grants, command completion and successor state.
Remaining explicit unsupported scope includes Tutor's unreviewed owner binding,
Crystal Sphere, standalone manual potion discard, unbound source variants,
non-standard profiles/menu paths, multiplayer, and incomplete visible-detail
families. Read-only Inspection remains independently scoped.
