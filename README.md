# SpireAgent

SpireAgent has two active components:

- [`Re-SpireAgent/`](Re-SpireAgent/): the LLM decision runtime.
- [`STS2MCP/`](STS2MCP/): the in-game STS2 Semantic Gateway, REST API and
  optional MCP adapter.

Connector V3 is the current target and the default Re transport. The canonical
decision is [ADR-0007](docs/current/decisions/ADR-0007-connector-v3-canonical-architecture.md).
The retired root Agent is under [`archive/original-spireagent/`](archive/original-spireagent/);
the final pre-V3 Connector documents are under
[`archive/connector-v2-final/`](archive/connector-v2-final/).

## Current Status

Source protocol is `3.0-preview.6`. V3 observation, active interaction,
parameterized commands, receipts, state-bound read-only Inspection and linked
detail, REST, MCP and strict Re consumption are implemented. Combat, ordinary
non-combat, combat-hand, deck-upgrade, merchant deck-removal and the
source-specific Luminous Choir event-removal family use direct native
resolvers; remaining selector families retain bounded Provider migration
bindings until their vertical cutover.

The V3 source has automated test evidence. A V3 Release build and installation
must be distinguished from loaded and Live evidence; see
[current status](docs/current/STATUS.md).

## Developer Workflow

```bash
npm run connector -- inspect
npm run connector -- test
npm run connector -- build
npm run connector -- install
```

After cold-starting Slay the Spire 2:

```bash
cd Re-SpireAgent
npm run agent:run
```

The run command performs exact loaded-identity preflight before Re starts.
Unknown mutations are never retried.

## Documentation

- [Current documentation map](docs/current/DOCUMENT_MAP.md)
- [Architecture](docs/current/ARCHITECTURE.md)
- [Status](docs/current/STATUS.md)
- [V3 implementation plan](docs/current/CONNECTOR_V3_IMPLEMENTATION_PLAN.md)
- [Local setup](docs/current/LOCAL_SETUP.md)
- [Security](SECURITY.md)

Do not commit API keys, `.env.local`, game binaries, installed DLLs, local run
artifacts or mutable qualification state.
