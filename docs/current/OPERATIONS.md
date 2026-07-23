# Current Operations Map

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

## STS2 Gateway

Set `STS2_GAME_DIR` to the exact local Steam installation, then use the
platform-specific commands in `STS2MCP/README.md` to run C# tests, Python MCP
syntax checks, and a Release build. Close the game before replacing an
installed DLL. Build/install evidence is not proof of loaded runtime identity;
capture that identity before claiming a canary or qualification.

## Repository Checks

```bash
npm run check
npm run check:docs
git diff --check
```

`npm run check` delegates only to the active Re project. Gateway checks remain
environment-dependent and should be recorded separately.

The repository currently defines no GitHub Actions workflow. Local success
must not be reported as an automatic commit or pull-request check.
