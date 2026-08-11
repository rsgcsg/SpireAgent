# STS2 Human Environment Connector

`STS2MCP` is the in-game Live Host, Human Environment runtime, REST server and
optional thin Python MCP transport. Protocol `1.0-preview.6` is current.

## Source Ownership

```text
LiveHost       visible facts and one input owner
NativeUi       exact native candidates, bindings and delivery
Authority      environment, controller, idempotency and qualification
HumanEnvironment  Observe / Read / Interact wire and runtime
Transport      HTTP support
mcp            optional MCP-to-HTTP adapter
```

Bridge v2 and Connector V3 are retired history, not execution fallbacks.

## Build, Test And Deploy

From the repository root:

```bash
npm run doctor
npm run connector -- test
npm run connector -- build
npm run deploy
```

Direct Windows test:

```powershell
dotnet test STS2MCP/STS2_MCP.sln -c Release -p:STS2GameDir="E:\SteamLibrary\steamapps\common\Slay the Spire 2"
```

`deploy` builds, records provenance, backs up the installed mod and refuses to
install while STS2 is running. After cold-start, `npm run verify:loaded` proves
the exact installed SHA and MVID are in the process.

## API

See [Protocol](docs/human-environment/PROTOCOL.md) and
[Coverage](docs/human-environment/COVERAGE.md).

```text
GET  /api/he/capabilities
GET  /api/he/observation
GET  /api/he/reads/{read_id}?expected_snapshot_id=...
POST /api/he/actions
GET  /api/he/actions/{request_id}
```

Only a complete current bound-action projection can authorize input. The Host
rebuilds and revalidates exact native targets before delivery. No arbitrary
method, path, coordinate, reflection target or hidden information is accepted.

## Rollback

Use the backup printed by install:

```bash
npm run connector -- restore-known-environment --backup /absolute/backup/path
```

Never commit game assemblies, installed DLLs, local config, logs, runtime
payloads or secrets.
