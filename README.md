# SpireAgent

SpireAgent lets external consumers play the real Slay the Spire 2 UI through
one fair-player Player Environment contract.

- [`STS2MCP/`](STS2MCP/) is the in-game Live Host and Player Environment.
- [`Re-SpireAgent/`](Re-SpireAgent/) is the current LLM consumer.

Player Environment is the only production connector. Source protocol is
`1.0-rc.2`. Bridge v2 and Connector V3 are retired implementation history,
not fallback paths.

> Source, tests, build, install, load, Live exercise and a freeze verdict are
> separate evidence levels. This repository does not publish a generally
> compatible game binary or claim arbitrary game-version/Mod support.

## Quick Start

Requirements: Node.js 20+, npm, .NET 9 SDK and a Steam installation of Slay
the Spire 2. Python 3.11+ is required only for the optional MCP transport.

```bash
git clone https://github.com/rsgcsg/SpireAgent.git
cd SpireAgent
npm run bootstrap
cp Re-SpireAgent/.env.example Re-SpireAgent/.env.local
npm run doctor
```

Keep API keys only in `Re-SpireAgent/.env.local` or the process environment.
Set `STS2_GAME_DIR` only when automatic Steam discovery cannot locate the game.

With the game fully closed:

```bash
npm run deploy
```

Then cold-start the game:

```bash
npm run verify:loaded
cd Re-SpireAgent
npm run agent:run
```

`deploy` backs up the installed mod and records source/build/install identity.
It cannot prove that a game process loaded that artifact. `verify:loaded` checks
the exact runtime identity. Unknown input delivery is never retried.

## Architecture

```text
real STS2 runtime
-> LiveHost readers: visible facts and one current input owner
-> NativeUi: exact current candidates, operands and native input delivery
-> Identity/Control: exact provenance, single writer and idempotency
-> PlayerEnvironment: Observe / Read / Interact, receipt and successor
-> REST or optional thin MCP transport
-> Re or another consumer-owned projection
```

STS2 owns rules, RNG, effects and Commit paths. C owns the fair-player world,
state-bound reads and one Host-local execution authority. A consumer can choose
only a current opaque bound action and cannot create legality.

Start with the [new engineer guide](docs/current/PLAYER_ENVIRONMENT_NEW_ENGINEER_GUIDE.md),
then use the [documentation map](docs/current/DOCUMENT_MAP.md).

## Contributing

Read [AGENTS.md](AGENTS.md), [Development Model](docs/current/DEVELOPMENT_MODEL.md),
and [CONTRIBUTING.md](CONTRIBUTING.md). Never commit keys, `.env.local`, game
assemblies, installed DLLs, local run data or logs.
