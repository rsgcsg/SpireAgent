# STS2 Player Environment Engineering Guide

Read `../docs/current/PLAYER_ENVIRONMENT_NEW_ENGINEER_GUIDE.md`, ADR-0009 and
`docs/player-environment/` before changing the connector.

## Boundaries

- STS2 owns rules, RNG, effects and native Commit.
- `LiveHost` observes visible facts and exactly one input owner. Readers never
  publish executable actions.
- `NativeUi` owns exact controls, entities, operands and execute-time
  revalidation.
- `Authority` owns exact identity, controller integrity and request
  idempotency. It does not grant business/source permissions.
- `PlayerEnvironment` owns public Observe/Read/Interact semantics.
- REST and MCP transport bytes only.

Never accept an index, coordinate, node path, arbitrary method/reflection target
or model-generated native operand. Missing owner, target, identity, authority or
result fails closed. `unknown` delivery is never retried.

Reads and native-page evidence are state-bound, read-only and non-authorizing.
Do not expose hidden RNG, draw order, future rewards/events or any information
unavailable to a normal player.

## Change Evidence

For a new interaction or read:

1. verify the current game class/API or reproducible runtime behavior;
2. document visible and hidden boundaries;
3. add contract, stale and execution tests;
4. build against the exact game install;
5. cold-load and exercise before marking it Live;
6. update coverage and repository status.

Fixtures prove source behavior, not game compatibility. Keep source, test,
build, install, load and Live evidence separate.

## Validation

```powershell
dotnet test STS2_MCP.sln -c Release -p:STS2GameDir="E:\SteamLibrary\steamapps\common\Slay the Spire 2"
dotnet build STS2_MCP.csproj -c Release -p:STS2GameDir="E:\SteamLibrary\steamapps\common\Slay the Spire 2"
python -m py_compile mcp/server.py
```

Never commit game assemblies, local config, `.env.local`, logs or run data.
