# STS2 Agent Bridge

An in-process Slay the Spire 2 mod plus a thin MCP server for safe, auditable AI
gameplay. This repository starts from
[`Gennadiyev/STS2MCP`](https://github.com/Gennadiyev/STS2MCP) commit
`20eadebde358a37cca41f8b38728099e6d0d19db`, but Bridge v2 is a new,
state-bound protocol intended for the rebuilt `Re-SpireAgent` client.

## Status

Bridge v2 is an incremental preview, not a replacement for all v1 surfaces.

- Current exact game binding: Slay the Spire 2 `v0.108.0`.
- Implemented v2 vertical slice: singleplayer deck enchant selection.
- All unimplemented or version-incompatible v2 surfaces fail closed with no
  legal actions.
- v1 remains available for compatibility and has been made build-compatible
  with `v0.108.0`; its index-based action contract is legacy.
- Static build/protocol tests and a real `v0.108.0` deck-enchant lifecycle smoke
  pass. Other surfaces remain unsupported.

See [current status](docs/bridge-v2/CURRENT_STATUS.md), the
[upstream/design audit](docs/bridge-v2/UPSTREAM_AUDIT.md), and the
[coverage matrix](docs/bridge-v2/PLAYER_VISIBLE_COVERAGE.md).

## Why v2

The v1 endpoint exposes partially normalized state and asks clients to send
indices and targets. That permits stale-index races and reports `ok` before the
game outcome is known. Bridge v2 instead uses:

```text
player-visible game facts
  -> semantic surface
  -> stable state_id
  -> state-scoped opaque legal_actions
  -> exact-state revalidation
  -> UI action start
  -> observed completion / rejection / unknown outcome
```

The bridge is an adapter, not a strategy engine. The LLM chooses among legal
actions; it cannot generate arbitrary Godot paths or MCP calls.

## Requirements

- Slay the Spire 2 installed through Steam.
- .NET 9 SDK.
- Python 3.11+ and [`uv`](https://docs.astral.sh/uv/) for the MCP process.
- A local MCP-capable client or `Re-SpireAgent`.

Do not copy `sts2.dll`, `GodotSharp.dll`, or `0Harmony.dll` into this repository.
The build references them from the local game installation.

## Build And Test

macOS:

```bash
git clone <your-fork-url> STS2MCP
cd STS2MCP

export DOTNET_ROOT="/opt/homebrew/opt/dotnet@9/libexec"
export PATH="$DOTNET_ROOT:$PATH"
export STS2_GAME_DIR="$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2"

dotnet test STS2_MCP.sln -p:STS2GameDir="$STS2_GAME_DIR"
python3 -m py_compile mcp/server.py
dotnet build STS2_MCP.csproj -c Release -o out/STS2_MCP \
  -p:STS2GameDir="$STS2_GAME_DIR"
```

Windows PowerShell:

```powershell
$env:STS2_GAME_DIR = "D:\SteamLibrary\steamapps\common\Slay the Spire 2"
dotnet test STS2_MCP.sln -p:STS2GameDir="$env:STS2_GAME_DIR"
.\build.ps1 -GameDir "$env:STS2_GAME_DIR"
```

The solution currently contains 22 pure contract/runtime/security tests covering stable
state identity, entity identity, stale-state rejection, idempotent request IDs,
completion observation, timeout-as-unknown, and JSON action shape.

## Install The Mod

Close the game before replacing the DLL.

macOS:

```bash
GAME_DIR="$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2"
MODS_DIR="$GAME_DIR/SlayTheSpire2.app/Contents/MacOS/mods"

mkdir -p "$MODS_DIR"
cp out/STS2_MCP/STS2_MCP.dll "$MODS_DIR/STS2_MCP.dll"
cp mod_manifest.json "$MODS_DIR/STS2_MCP.json"
```

Windows/Linux use the game's corresponding `mods/` directory. Launch the game,
enable the mod, then verify:

```bash
curl -s http://localhost:15526/
curl -s http://localhost:15526/api/v2/capabilities | python3 -m json.tool
curl -s http://localhost:15526/api/v2/state | python3 -m json.tool
```

The v2 capabilities response must report an exact supported game identity before
action execution is allowed.

## Run The MCP Server

Install locked Python dependencies and start the stdio MCP server:

```bash
uv run --directory "$PWD/mcp" python server.py
```

Client configuration:

```json
{
  "mcpServers": {
    "sts2": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "/absolute/path/to/STS2MCP/mcp",
        "python",
        "server.py"
      ]
    }
  }
}
```

Bridge v2 MCP tools:

- `get_agent_bridge_capabilities_v2()`
- `get_agent_state_v2()`
- `submit_agent_action_v2(request_id, expected_state_id, action_id)`
- `get_agent_command_v2(request_id)`

The existing v1 tools remain exposed during migration.

## V2 HTTP Contract

```text
GET  /api/v2/capabilities
GET  /api/v2/state
POST /api/v2/commands
GET  /api/v2/commands/{request_id}
```

Submit only identifiers returned by the exact state:

```json
{
  "request_id": "client-generated-idempotency-key",
  "expected_state_id": "state_...",
  "action_id": "action_..."
}
```

`started` means the UI interaction began. Poll until `completed`, `rejected`,
`failed`, or `timed_out`. A timed-out command has `outcome: "unknown"` and must
not be retried automatically.

## Re-SpireAgent Integration

The rebuilt SpireAgent now has a separate strict v2 decoder/projector and a
negotiated hybrid adapter. In the default `auto` mode, the qualified deck
enchant surface uses Bridge-advertised opaque actions as its sole executor;
unsupported v2 surfaces remain on v1 during migration. Exact-build mismatch,
command-response identity mismatch, failed command, and timeout all fail closed.

The client contract is fixture-tested. A fresh organic Re-SpireAgent deck
enchant lifecycle smoke is still required before calling the combined path
end-to-end runtime-qualified. Planning code never reads arbitrary bridge JSON.

## Security And Observation Scope

- Server binds to localhost only.
- v2 accepts no arbitrary game parameters.
- Unknown state, stale state, untested build, or failed reflection means no
  execution.
- The observation policy excludes hidden RNG state, draw order, undisclosed
  event outcomes, future rewards, and future enemy moves.
- Private game fields are used only where the player-visible UI contains the
  fact but no stable public accessor exists; each binding is exact-version
  scoped and documented.

## License

MIT. See [LICENSE](LICENSE). The upstream origin and retained v1 code remain
covered by the same license.
