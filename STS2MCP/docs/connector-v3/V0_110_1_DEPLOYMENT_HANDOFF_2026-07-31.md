# Connector V3 v0.110.1 Deployment Handoff: 2026-07-31

This is a build/install/startup-canary closeout, not Organic qualification.

## Source And Game Boundary

- branch: `connectorV3`;
- committed baseline: `5640d2c1590aa3682a113dec3aae9ff082235cb8`;
- protocol: `3.0-preview.1`;
- game: `v0.110.1`, commit `db5d3552`, release assembly hash `-959015736`;
- `sts2.dll`: SHA
  `7c446efabf80614c429b5088e87101423aa5bb4c04fc3e73393261f6e6d404fd`,
  MVID `c0f649b8-8d57-4a9c-8b07-21aece97dca0`.

The worktree additionally contains the Windows deployment fixes and
card-reward V3-native cutover described below. A Git commit has not been made.

## Verified Changes

- Windows tests use native path semantics; the Gateway test host copies its
  required STS2 managed dependencies.
- Connector installation now detects a running Windows game through
  `tasklist` and refuses hot DLL replacement.
- Connector child npm commands execute correctly on Windows.
- `agent:run` reads only `STS2_GAME_DIR` from ignored Re local configuration
  before the Connector preflight, so a new Windows terminal needs no injected
  parent-shell variable. Provider secrets remain Re-owned.
- Card-reward candidates derive from typed screen, selectable-card and enabled
  alternative facts. Execution resolves the exact current screen and entity,
  revalidates visibility/clickability or label/enabled state, then uses the
  existing native Commit path.
- Card-reward completion compares the same filtered and ordered visible option
  sets used at publication, avoiding a false positive from hidden controls or
  child ordering.
- The exact v0.110.1 static compatibility fixture passes with 14 registered
  sources and the existing Tutor diagnostic-only holdout. All reviewed
  operation-binding probes match.

The static reports have `authorization_effect: none` and
`qualification_effect: none`. They do not inherit v0.110.0 authority.

## Automated And Deployment Evidence

- Gateway: 220/220 tests passed.
- Re: 222/222 tests, strict typecheck and production build passed.
- Python MCP lock and syntax, documentation links/inventory, CLI, run identity,
  compatibility, permission, qualification, profile and migration checks
  passed.
- Release/installed DLL SHA:
  `b3897459d122e7208ad7d6fa2e56816ec594146fa92c637eecfd691a4fd2a469`.
- Release/installed MVID: `591c6251-d2a3-4281-b723-9a048b0ac9d0`.
- rollback backup:
  `STS2MCP/.local/deployments/2026-07-31T09-52-39-492Z`.
- one canonical `STS2_MCP` manifest is installed.

## Loaded Identity And Bounded Canary

After enabling the installed `STS2_MCP` entry in the game-owned
`settings.save`, a Steam cold start loaded the exact installed artifact:

- loaded SHA:
  `b3897459d122e7208ad7d6fa2e56816ec594146fa92c637eecfd691a4fd2a469`;
- loaded MVID: `591c6251-d2a3-4281-b723-9a048b0ac9d0`;
- runtime instance: `98b52677796c4e6aa103c404a6952789`;
- protocol: `3.0-preview.1`;
- exact game: `v0.110.1`, commit `db5d3552`, assembly hash `-959015736`;
- Modset: `exact_bridge_only`.

`run-20260731104027-lxj3h3`, decision
`decision-000001-ms8ta5sn-ueffiu`, exercised the normal `npm run agent:run`
entry, provider decision, V3 submission and polling. One advertised
`main_menu` command returned `executed_and_settled`. The deliberate
`--max-ticks 1` limit then stopped before a run boundary and therefore
returned a supervisory nonzero exit.

## Non-Claims And Next Gate

The cold load and single main-menu canary are verified. They do not prove a
completed journey, direct combat repairs, V3-native card rewards, cross-run
stability or durable qualification. The local permission mode is
`migration_exploration`; current authority is an exact-runtime,
operation-scoped session canary.

With the verified game process still running, continue from `Re-SpireAgent`:

```bash
cd Re-SpireAgent
npm run agent:run
```

The preflight must stop before mutation if loaded identity, Modset, Patch,
owner or operation authority is not exact.
