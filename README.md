# SpireAgent

SpireAgent connects an external LLM agent to the real Slay the Spire 2 UI.

- [`STS2MCP/`](STS2MCP/) is the in-game Human-Equivalent Connector.
- [`Re-SpireAgent/`](Re-SpireAgent/) is the strict Agent runtime.

Human-Equivalent C is the only current target. Source protocol is
`1.0-preview.5`. Connector V3 remains an explicit rollback implementation and
historical comparison, never a silent execution fallback.

> **Maturity:** source, tests and local Release build are available. Public
> packaged binaries and broad version/Mod compatibility are not yet claimed.
> Each machine must separately verify install, loaded identity and Live use.

## Quick Start

Requirements: Node.js 20+, npm, .NET 9 SDK and a Steam installation of Slay
the Spire 2. Python 3.11+ is needed only for MCP.

```bash
git clone https://github.com/rsgcsg/SpireAgent.git
cd SpireAgent
npm run bootstrap
cp Re-SpireAgent/.env.example Re-SpireAgent/.env.local
npm run doctor
```

Keep `DEEPSEEK_API_KEY` only in `Re-SpireAgent/.env.local` or the process
environment. Set `STS2_GAME_DIR` there only for a non-default Steam location.

With the game fully closed:

```bash
npm run deploy
```

Then cold-start the game and run:

```bash
npm run verify:loaded
cd Re-SpireAgent
npm run agent:run
```

`deploy` backs up the previous mod and records source/build/install identity.
It does not claim the DLL was loaded. `agent:run` verifies loaded SHA/MVID and
uses `/api/he/*`; it never retries unknown input delivery.

Use `SPIREAGENT_HE_MODE=he_pure` for A+C only. The default `he_assisted` may
compose a separate non-authorizing D provider when one is configured; both use
the same pure C observation/action contract.

See [Local Setup](docs/current/LOCAL_SETUP.md) for other machines, custom Steam
paths, rollback and troubleshooting.

## Architecture

```text
Native STS2 UI
-> Human Environment snapshot (visible facts, interaction, referents, reads)
-> current interaction capabilities plus complete finite bound actions
-> native UI-equivalent input delivery
-> delivery receipt + successor snapshot
-> Re-SpireAgent chooses one opaque bound-action ID
```

C does not require a business source, SourceContract or business Outcome to
operate a currently exact human UI control. STS2 remains the only rules and
effects authority. A/Re interprets the flow. Optional D input is external to C
and never authorizes or executes.

## Contributing

Read [Development Model](docs/current/DEVELOPMENT_MODEL.md),
[CONTRIBUTING.md](CONTRIBUTING.md) and the component `AGENT(S).md` before
editing. Every PR must identify branch/HEAD, authority boundary, tests and the
separate source/test/build/install/load/Live evidence levels. Never commit
keys, `.env.local`, game assemblies, installed DLLs, local run data or logs.

- [Documentation map](docs/current/DOCUMENT_MAP.md)
- [Current status](docs/current/STATUS.md)
- [Architecture](docs/current/ARCHITECTURE.md)
- [Roadmap](docs/current/ROADMAP.md)
