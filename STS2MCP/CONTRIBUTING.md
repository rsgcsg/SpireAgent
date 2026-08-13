# Contributing

Start with [AGENTS.md](AGENTS.md), the
[new engineer guide](../docs/current/PLAYER_ENVIRONMENT_NEW_ENGINEER_GUIDE.md),
and the [current protocol](docs/player-environment/PROTOCOL.md). Historical
Bridge and preview documents are evidence records, not implementation guides.

## Change Rules

- Keep stable player-visible extraction in `LiveHost`, exact native bindings
  and delivery in `NativeUi`, and public Observe/Read/Interact behavior in
  `PlayerEnvironment`.
- Cite the exact game version, commit, assembly SHA-256 and MVID used to audit
  native types or private bindings.
- Never infer private APIs from names, expose hidden state, add arbitrary
  reflection/clicks, or let REST/MCP/consumers create action authority.
- Every finite BoundAction must resolve to one current Host-local binding and
  be revalidated immediately before native input delivery.
- Reads remain snapshot-bound, read-only and non-authorizing. Unknown delivery
  is never retried automatically.

## Required Checks

From the repository root:

```bash
npm run check:docs
npm run check:connector-cli
dotnet test STS2MCP/tests/STS2_MCP.Tests/STS2_MCP.Tests.csproj -c Release -p:STS2GameDir="<game-dir>"
dotnet build STS2MCP/STS2_MCP.csproj -c Release -p:STS2GameDir="<game-dir>"
python -m py_compile STS2MCP/mcp/server.py
git diff --check
```

Game-bound changes also require honest source/build/install/load/Live evidence
separation. Fixture tests do not qualify an exact game binding.

## Documentation

Update the current protocol, coverage, Information Closure and status files
when their truth changes. Preserve dated historical evidence without assigning
it to a new source or artifact.

Do not commit game assemblies, local config, runtime logs or runs, installed
artifacts, `.env.local`, credentials, or provider output.

## License

Contributions are provided under the repository's MIT license. Upstream
attribution must remain intact.
