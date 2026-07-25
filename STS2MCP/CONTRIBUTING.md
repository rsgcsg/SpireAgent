# Contributing

Read [AGENTS.md](AGENTS.md) and the [Bridge v2 docs](docs/bridge-v2/README.md)
before changing protocol or game-bound behavior.

## Change Rules

- One audited surface or infrastructure concern per change.
- Cite the exact game version, commit, and assembly hash used to validate game
  facts.
- Do not infer private API signatures from names; inspect the current assembly
  or produce runtime evidence.
- Keep Python MCP tools as a thin HTTP adapter.
- Preserve v1 unless an explicit migration decision removes a qualified surface.
- Never make an unsupported surface executable to improve apparent coverage.

## Required Checks

```bash
GAME_DIR="<Slay the Spire 2 install directory>"
dotnet test STS2_MCP.sln -p:STS2GameDir="$GAME_DIR"
dotnet build STS2_MCP.csproj -c Release -p:STS2GameDir="$GAME_DIR"
uv run --directory mcp python -m py_compile server.py
```

Game-bound changes also require a disposable-run smoke with before/after state,
command events, and the exact field/action under test. Fixture tests prove code
behavior only; they do not qualify a game binding.

## Documentation

Update:

- `docs/bridge-v2/CURRENT_STATUS.md` for phase/blocker changes;
- `PLAYER_VISIBLE_COVERAGE.md` for surface/field support;
- `PROTOCOL.md` for wire or lifecycle changes;
- `OBSERVATION_POLICY.md` for visibility changes;
- `REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md`
  when new game facts invalidate an earlier assumption; consult the preview
  archive only for the exact historical evidence it records.

Do not commit game assemblies, local mod config, runtime logs/snapshots, local MCP
permissions, `.env.local`, or secrets.

## License

Contributions are provided under the repository's MIT license. Upstream
attribution must remain intact.
