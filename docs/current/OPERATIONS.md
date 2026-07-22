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
