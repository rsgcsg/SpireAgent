# STS2 Semantic Gateway

`STS2MCP` contains the in-game Connector V3 Gateway, REST API and optional
Python MCP adapter. V3 is the current protocol; Bridge v2 remains an internal
migration and rollback asset.

## Requirements

- Slay the Spire 2 installed through Steam
- .NET 9 SDK
- Node.js 20+
- Python 3.11+ for MCP syntax/runtime

Never copy game assemblies into this repository.

## Build And Test

From the repository root:

```bash
npm run doctor
npm run deploy
```

`deploy` runs the tests and build commands below, records source-to-artifact
provenance, backs up the old install and installs only while STS2 is closed.
For advanced individual stages:

```bash
npm run connector -- show-status
npm run connector -- test
npm run connector -- audit
npm run connector -- build
npm run connector -- install
```

Direct macOS checks:

```bash
export STS2_GAME_DIR="$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2"
dotnet test STS2MCP/STS2_MCP.sln -p:STS2GameDir="$STS2_GAME_DIR" \
  -p:UseSharedCompilation=false
python3 -m py_compile STS2MCP/mcp/server.py
dotnet build STS2MCP/STS2_MCP.csproj -c Release \
  -o STS2MCP/out/STS2_MCP -p:STS2GameDir="$STS2_GAME_DIR" \
  -p:UseSharedCompilation=false
```

## Install And Roll Back

Close STS2 before installation. A standalone install accepts only a Release
artifact whose recorded source digest and protocol match the current checkout:

```bash
npm run connector -- install
npm run doctor
```

The install command creates a timestamped rollback snapshot and verifies
built/installed SHA and MVID. Build or install is not loaded evidence. After a
cold game start:

```bash
npm run verify:loaded
```

Use the rollback path printed by `install`, or:

```bash
npm run connector -- restore-known-environment --backup /absolute/backup/path
```

## Protocol

See [Connector V3](docs/connector-v3/README.md). The primary endpoints are:

```text
GET  /api/v3/capabilities
GET  /api/v3/observation
GET  /api/v3/inspections/{kind}?expected_state_token={state_token}
POST /api/v3/commands
GET  /api/v3/commands/{request_id}
```

The Python MCP adapter is a thin V3 transport. It does not reconstruct game
rules or add authority.

## Security

The development Gateway listens on loopback and uses a single-controller lease,
not hostile-local-process authentication. Commands require exact state,
interaction, entity, controller and environment binding. Hidden game
information remains excluded. Do not commit installed DLLs, logs, run data,
secrets or mutable qualification state.
