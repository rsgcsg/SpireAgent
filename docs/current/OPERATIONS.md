# Current Operations Map

Use [Local Setup](LOCAL_SETUP.md) for the authoritative fresh-clone,
cross-device build/install, loaded-identity, and troubleshooting sequence. This
file is only the concise command map.

## Re-SpireAgent

```bash
cd Re-SpireAgent
npm ci
npm run typecheck
npm test
npm run build
```

Use the bounded inspect/tick/run commands from `Re-SpireAgent/README.md`. Keep
provider keys in `Re-SpireAgent/.env.local`; never print or commit them.

Current internal D-lane commands have narrower meanings:

```bash
# Read stored records; this is not deterministic re-execution.
npm --prefix Re-SpireAgent run agent:replay -- --run-id <id>

# Read-only structure measurement; this is not strategy evaluation.
npm --prefix Re-SpireAgent run agent:prompt-audit -- --limit-runs 5

# Provider-costing, non-executing experiments; neither grants runtime status.
npm --prefix Re-SpireAgent run agent:prompt-shadow-compare -- --run-id <id> --decision-id <id>
npm --prefix Re-SpireAgent run agent:prompt-repeat-baseline -- --run-id <id> --decision-id <id> --samples 3 --variant full
```

See [Internal development and evaluation](DEVELOPMENT_AND_EVALUATION.md) for
the capability inventory and missing scenario/eval infrastructure.

## STS2 Player Environment Host

Preferred root entrypoints:

```bash
npm run bootstrap
npm run doctor
npm run deploy
npm run verify:loaded
npm run connector -- show-status
npm run connector -- test
npm run connector -- build
npm run connector -- install
npm run connector -- collect-evidence
```

`doctor` is read-only. `deploy` runs the complete source checks, writes
source-to-build provenance, builds, backs up and installs while the game is
closed. It does not claim loaded state. The CLI owns no game semantics,
legality or completion. Use
`npm run connector -- help` for the full command map.

Set `STS2_GAME_DIR` to the exact local Steam installation, then use the
platform-specific commands in `STS2MCP/README.md` to run C# tests, Python MCP
syntax checks, and a Release build. Close the game before replacing an
installed DLL. Build/install evidence is not proof of loaded runtime identity;
capture that identity before claiming a Live mutation or journey.

## Repository Checks

```bash
npm run check
npm run check:docs
git diff --check
```

`npm run check` runs Re, current docs/contracts, CLI and run-identity checks.
Host C# tests remain environment-dependent and run through
`npm run connector -- test` when exact local STS2 assemblies are available.

The public CI workflow checks Re and active documentation on Linux. Host
tests and Release builds still require proprietary local game assemblies and
remain explicit local checks; CI success is not loaded or Live evidence.
