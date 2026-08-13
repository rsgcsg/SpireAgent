# STS2 Player Environment Host

`STS2MCP` is the compatibility-sensitive in-game Mod directory and Mod ID. The
current code inside it is the Live Host, Player Environment runtime, localhost
REST server and optional thin Python MCP transport. MCP is not required by Re.
The current protocol is `1.0-rc.2`.

## Source Ownership

```text
LiveHost          player-visible facts and one current input owner
NativeUi          private native controls, bindings and input delivery
Authority         exact identity, one controller and idempotency only
PlayerEnvironment public Snapshot / Read / BoundAction / Receipt contract
Transport         localhost HTTP bytes
mcp               optional MCP-to-HTTP adapter
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

`deploy` tests, builds, records source provenance, backs up the installed Mod
and refuses to install while STS2 is running. After a cold start,
`npm run verify:loaded` proves the exact installed SHA, MVID, embedded source
revision and protocol are in the process.

## API

See [Protocol](docs/player-environment/PROTOCOL.md) and
[Coverage](docs/player-environment/COVERAGE.md).

```text
GET  /api/player-environment/capabilities
GET  /api/player-environment/snapshot
GET  /api/player-environment/reads/{read_id}?expected_snapshot_id=...
POST /api/player-environment/clients/register
POST /api/player-environment/controller/{acquire|renew|release}
POST /api/player-environment/actions
GET  /api/player-environment/actions/{request_id}
```

Only a complete current BoundAction projection can authorize input. The Host
rebuilds and revalidates exact native targets before delivery. It accepts no
arbitrary method, path, coordinate, reflection target or hidden information.

## Rollback

Use the backup printed by install, with STS2 closed:

```bash
npm run connector -- restore-known-environment --backup /absolute/backup/path
```

Never commit game assemblies, installed DLLs, local config, logs, runtime
payloads or secrets.
