# STS2 Agent Bridge

An in-process Slay the Spire 2 mod plus a thin MCP server for safe, auditable AI
gameplay. This repository starts from
[`Gennadiyev/STS2MCP`](https://github.com/Gennadiyev/STS2MCP) commit
`20eadebde358a37cca41f8b38728099e6d0d19db`, but Bridge v2 is a new,
state-bound protocol intended for the rebuilt `Re-SpireAgent` client.

## Status

Bridge v2 is an incremental preview, not a replacement for all v1 surfaces.

The C# Bridge and Re now share `2.0-preview.55`, with strict explicit
operation scopes and a path-free loaded-assembly digest. The Release artifact
is installed and its Steam-loaded SHA/MVID matches the expected identity; Re
completed a read-only negotiated inspection. Do not expand coverage or
permission until the existing-scope action/completion canary described in
[Bridge v2 current status](docs/bridge-v2/CURRENT_STATUS.md) completes.

> Product security warning: the current HTTP listener is a developer preview.
> It binds to loopback and filters browser Origin, but it has no client
> authentication, Gateway-enforced controller lease, or restart epoch, and v1
> and v2 mutation routes share the listener. Localhost is not an authorization
> boundary. Do not represent this as a consumer-safe Workshop product; see the
> [productization architecture audit](../docs/current/audits/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md).

- Last historical source-qualified exact game binding: Slay the Spire 2
  `v0.109.0|c12f634d|-840572606`.
- A matching version/commit with a different main-assembly hash remains
  untested and has no v2 action or Inspection authority. Check
  [Bridge v2 current status](docs/bridge-v2/CURRENT_STATUS.md) before treating
  a local install as qualified.
- Source `2.0-preview.55` keeps centralized overlay/room/menu ownership, typed
  diagnostics, purpose-specific selection and event contracts, staged
  completion semantics, and a top-level read-only shared run/player HUD.
  Current-build capabilities distinguish scoped-qualified actions, action
  canaries, and read-only Inspection instead of treating implementation as
  permission.
- Qualified combat Context includes exact player-visible companion state from
  native `PlayerCombatState.Pets`. Companion HP is exposed only when the native
  health bar is visible; this adds no companion action authority.
- Exact combat setup and post-combat settlement are exposed as non-authorizing
  `combat_transition + no_action` phases; they grant no capability, action, or
  fallback and do not generalize other no-overlay intervals.
- Exact environment now includes a structured loaded Modset fingerprint.
  Actions and Inspection fail closed unless the currently negotiated profile
  sees only the exact loaded `STS2_MCP` module; native-UI reuse by another Mod
  never inherits authority automatically.
- All unimplemented or version-incompatible v2 surfaces fail closed with no
  legal actions.
- v1 remains available only for explicit legacy-owned Surface fallback; its
  index-based action contract is legacy. Bridge-owned states no longer use it
  for shared run/player facts.
- Historical exact-v0.109 Organic evidence qualified merchant removal, event/rest
  upgrade, ordinary combat turn, combat hand selection, ordinary single-player
  rest, and read-only run deck. Read-only combat pile contents are a separate
  current-build canary and never expose draw order or command authority. Event card acquisition, reward, card reward,
  map, shop, treasure, game over, card bundles, ordinary character select,
  revealed ancient dialogue, ordinary single-player event options, and the
  exact Whispering Hollow random-transform child and Self-Help Book
  deck-enchantment child are action canaries. Only the
  exact Lead Paperweight and sealed native Colorless/Attack/Skill/Power Potion sources of
  `generated_card_choice` are current-build canaries with separate destination,
  cost, operation, and completion semantics; all other callers of the shared
  selection UI remain fail closed. Exact Headbutt pile selection is a canary
  whose corrected completion still needs an Organic repeat. Preview.46 also
  exposes typed read-only card hover previews with stable owner-scoped identity.
  Preview.47 adds a state-bound visibility/Inspection catalog, coherent
  observation bundles, linked-reward completion support, and a non-authorizing
  contract-instance shadow. Preview.48 adds a read-only current-shop catalog
  canary with fixed typed slot semantics so a closed inventory can still be
  reasoned about without granting purchase authority. Neither preview grants
  new actions. Unlisted surfaces are disabled and draw order remains hidden.

See [current status](docs/bridge-v2/CURRENT_STATUS.md), the
[connector migration audit](docs/bridge-v2/REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md),
and the [coverage matrix](docs/bridge-v2/PLAYER_VISIBLE_COVERAGE.md).

## Why v2

The v1 endpoint exposes partially normalized state and asks clients to send
indices and targets. That permits stale-index races and reports `ok` before the
game outcome is known. Bridge v2 instead uses:

```text
player-visible game facts
  -> semantic context
  -> blocking interaction surface
  -> explicit action authority
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

The solution currently contains 98 pure contract/runtime/security tests covering stable
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

For one coherent state plus typed read-only inspections:

```bash
state_id="$(curl -sS http://localhost:15526/api/v2/state | python3 -c 'import json,sys; print(json.load(sys.stdin)["state_id"])')"
curl -sS -X POST http://localhost:15526/api/v2/observation-bundles \
  -H 'content-type: application/json' \
  --data "{\"expected_state_id\":\"$state_id\",\"inspections\":[{\"kind\":\"run_deck\"}]}"
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
- `inspect_run_deck_v2(expected_state_id)`
- `inspect_combat_piles_v2(expected_state_id)`
- `get_agent_observation_bundle_v2(expected_state_id, include_run_deck?, include_combat_piles?)`
- `submit_agent_action_v2(request_id, expected_state_id, action_id)`
- `get_agent_command_v2(request_id)`

The REST Gateway and Re schema also define `shop_catalog`, but the current
Python MCP adapter does not expose it. That adapter gap is visible and
non-authorizing; do not configure or document a nonexistent MCP tool as a
fallback.

The existing v1 tools remain exposed during migration.

## V2 HTTP Contract

```text
GET  /api/v2/capabilities
GET  /api/v2/state
GET  /api/v2/inspections/{kind}?expected_state_id={state_id}
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

The rebuilt SpireAgent has a strict v2 decoder/projector and a compatibility
adapter. It displays `context.kind + surface.kind + authority`. The default is
strict `v2`; current `auto` is only a strict-v2 alias and does not fall back to
v1. A Bridge-owned surface uses only Bridge-advertised opaque actions, while an
unsupported or missing v2 surface fails closed. Explicit `v1` is retained only
as a diagnostics-only compatibility mode. Exact-build mismatch,
context/surface mismatch, command-response identity mismatch, failed command,
and timeout all fail closed.

Current permissions come only from exact-build capability lists. Planning code
never reads arbitrary Bridge JSON. Source `preview.30` projects top-level
shared run/player HUD facts and the scoped run-deck Inspection into typed player
facts without creating actions or entering the command ledger. Historical
v0.108 surfaces remain implementation history, not v0.109 authority.

## Security And Observation Scope

- Server binds to localhost only, which limits network exposure but does not
  authenticate native local clients or serialize multiple controllers.
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
