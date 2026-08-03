# SpireAgent

SpireAgent connects an external LLM agent to Slay the Spire 2 through a
state-bound Semantic Gateway.

- [`Re-SpireAgent/`](Re-SpireAgent/) is the external Agent runtime.
- [`STS2MCP/`](STS2MCP/) is the in-game Gateway, REST API and optional MCP
  transport adapter.

Connector V3 is the only current target. Source protocol is
`3.0-preview.11`. The old root Agent and Connector V2 are retained only as
history under [`archive/`](archive/).

> **Project maturity:** Connector V3 freeze candidate. There is not yet a packaged
> Steam Workshop/public binary release. Public users can build and test from
> source; installed or loaded status is always local-machine evidence.

## Quick Start

Prerequisites: Node.js 20+, npm, .NET 9 SDK and a Steam installation of Slay
the Spire 2. Python 3.11+ and `uv` are optional unless using MCP.

```bash
git clone https://github.com/rsgcsg/SpireAgent.git
cd SpireAgent
npm run bootstrap
cp Re-SpireAgent/.env.example Re-SpireAgent/.env.local
npm run doctor
```

Put `DEEPSEEK_API_KEY` only in `Re-SpireAgent/.env.local` or the process
environment. On non-default Steam layouts, set `STS2_GAME_DIR` there too.

With the game fully closed, test, build, back up and install one coherent
source revision:

```bash
npm run deploy
```

Cold-start the game, wait for a stable menu, then verify what the process
actually loaded:

```bash
npm run verify:loaded
cd Re-SpireAgent
npm run agent:run
```

`deploy` never claims that the game loaded the new DLL. `agent:run` refuses a
source/build/install/load mismatch and never retries an unknown mutation.

See [Fresh Clone And Local Deployment](docs/current/LOCAL_SETUP.md) for Windows,
custom Steam paths, rollback and troubleshooting.

## Contributing

Read [the development model](docs/current/DEVELOPMENT_MODEL.md) and
[CONTRIBUTING.md](CONTRIBUTING.md) before changing code. Every handoff or PR
must identify its branch/HEAD, affected authority owner, checks run, and the
separate source/test/build/install/load/Live evidence levels. Local runs,
secrets, game DLLs and deployment directories are never committed.

## Current Direction

The V3 production source path is closed: 94 explicit contracts, zero fallback
authority, no Provider action publication and no active Re V2 sidecar. The
remaining freeze gates are final-artifact selector/read canaries, full optional
Human-page evidence, loaded rollback/revoke and one same-artifact ordinary
Journey. Workshop packaging, Companion, Agent SDK, Headless and learning are
later projects and must not acquire Gateway authority.

- [Documentation map](docs/current/DOCUMENT_MAP.md)
- [Current status](docs/current/STATUS.md)
- [Architecture](docs/current/ARCHITECTURE.md)
- [Roadmap](docs/current/ROADMAP.md)
- [Security](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
