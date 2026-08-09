# STS2 Human-Equivalent Connector

`STS2MCP` is the in-game Connector, REST server and optional Python MCP
transport. Human-Equivalent protocol `1.0-preview.2` is current; Connector V3
is explicit rollback/comparison only.

## Build, Test And Deploy

From the repository root:

```bash
npm run doctor
npm run deploy
```

`deploy` runs tests/build, records provenance, creates a timestamped rollback
and installs only while STS2 is closed. Individual commands:

```bash
npm run connector -- test
npm run connector -- build
npm run connector -- install
npm run connector -- show-status
```

Direct macOS test:

```bash
GAME_DIR="$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2"
dotnet test STS2MCP/STS2_MCP.sln -p:STS2GameDir="$GAME_DIR" \
  -p:UseSharedCompilation=false
```

After cold-starting the game, `npm run verify:loaded` proves the installed SHA
and MVID are loaded. Build/install alone are not loaded or Live evidence.

## Current API

See [Human-Equivalent Protocol](docs/human-equivalent/PROTOCOL.md).

```text
GET  /api/he/capabilities
GET  /api/he/observation
GET  /api/he/inspections/{kind}?expected_state_token=...
GET  /api/he/linked-details/{entity_id}?expected_state_token=...
POST /api/he/actions
GET  /api/he/actions/{request_id}
```

The Connector accepts only current advertised state-bound UI affordances. Exact
owner, target and native operands remain C-local. It never accepts arbitrary
methods, paths, coordinates or hidden game information. Unknown delivery is
never retried.

## Rollback

Use the backup printed by install:

```bash
npm run connector -- restore-known-environment --backup /absolute/backup/path
```

Never commit game assemblies, installed DLLs, local configuration, logs,
runtime payloads or secrets.
