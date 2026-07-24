# STS2 Agent Bridge

An in-process Slay the Spire 2 mod plus a thin MCP server for safe, auditable AI
gameplay. This repository starts from
[`Gennadiyev/STS2MCP`](https://github.com/Gennadiyev/STS2MCP) commit
`20eadebde358a37cca41f8b38728099e6d0d19db`, but Bridge v2 is a new,
state-bound protocol intended for the rebuilt `Re-SpireAgent` client.

## Status

Bridge v2 is the only mutation contract for the current Agent and default MCP
adapter. It remains an incremental semantic/visibility preview, not
complete-game coverage.

The C# Bridge and Re source share `2.0-preview.62`; Re normalized schema is
`26`. Gate 1 is closed as a bounded ordinary-single-player v2 connector
baseline. Preview.62 replaces repeated combat-pile source branches with a
reviewed embedded registry, moves exact-environment scopes into a reviewed
embedded policy, and adds a non-authorizing exact-assembly audit. The final
Neow's Fury runtime seal remains attributed to Preview.61; new Preview.62
registry entries are not automatically Organic-qualified. Preview.62 is built,
installed and cold-loaded on the local exact Bridge-only environment; the
exact SHA/MVID/runtime/policy evidence is recorded in
[current status](docs/bridge-v2/CURRENT_STATUS.md).

> Product security warning: the current HTTP listener is a developer preview.
> It binds to loopback and filters browser Origin, but it has no client
> authentication, Gateway-enforced controller lease, or restart epoch. The v1
> namespace is retired, but
> localhost is still not an authorization
> boundary. Do not represent this as a consumer-safe Workshop product; see the
> [productization architecture audit](../docs/current/audits/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md).

- Current source-qualified exact game binding: Slay the Spire 2
  `v0.109.0|c12f634d|-1639417500`. The separate release declaration
  `-840572606` is retained for diagnostics but cannot authorize actions.
- A matching version/commit with a different main-assembly hash remains
  untested and has no v2 action or Inspection authority. Check
  [Bridge v2 current status](docs/bridge-v2/CURRENT_STATUS.md) before treating
  a local install as qualified.
- Source `2.0-preview.62` keeps centralized overlay/room/menu ownership, typed
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
- The complete `/api/v1` namespace is retired and returns `410 Gone`. Its code
  and raw API references are preserved only under
  `archive/legacy-connector-v1/`.
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
  selection UI remain fail closed. Exact combat-pile registry branches now
  include Headbutt, Graveblast, Cleanse, Seance, Dredge, Charge, Neow's Fury,
  Cosmic Indifference, Hologram, Secret Technique, Secret Weapon, Seeker Strike,
  and Wish under one closed structural mutation/commit contract while
  retaining exact source and completion semantics. Tutor remains fail closed
  because its selected player is target-bound rather than
  source-owner-bound. Dredge has a current-build
  select/deselect/exact-three batch canary but remains canary-only. Preview.46 also
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
git clone https://github.com/rsgcsg/SpireAgent.git
cd SpireAgent/STS2MCP

export DOTNET_ROOT="/opt/homebrew/opt/dotnet@9/libexec"
export PATH="$DOTNET_ROOT:$PATH"
export STS2_GAME_DIR="$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2"

dotnet test STS2_MCP.sln -p:STS2GameDir="$STS2_GAME_DIR"
python3 -m py_compile mcp/server.py
dotnet build STS2_MCP.csproj -c Release -o out/STS2_MCP \
  -p:STS2GameDir="$STS2_GAME_DIR"
cd ..
npm run check:connector-adaptation
npm run check:connector-compatibility-fixtures
npm run audit:connector-compatibility
```

Windows PowerShell:

```powershell
$env:STS2_GAME_DIR = "D:\SteamLibrary\steamapps\common\Slay the Spire 2"
dotnet test STS2_MCP.sln -p:STS2GameDir="$env:STS2_GAME_DIR"
.\build.ps1 -GameDir "$env:STS2_GAME_DIR"
Set-Location ..
npm run check:connector-adaptation
npm run audit:connector-compatibility
```

The solution currently contains 122 pure contract/runtime/security tests
covering stable state identity, entity identity, stale-state rejection,
idempotent request IDs, completion observation, timeout-as-unknown, retired-v1
routing, and JSON action shape.

The compatibility audit writes ignored `latest.json` and `latest-grade.json`
reports under `STS2MCP/out/compatibility-audit/`. It identifies the exact game
assembly, emits declared/static/implementation operation fingerprints, verifies
registered selector/commit structure, classifies unregistered callers, and
grades the exact SHA/MVID scenario plus Tutor negative holdout. Its
authorization, promotion and qualification effects are always `none`.
Fingerprints are change detectors, not semantic-equivalence proofs.

Content is data-only only when it reuses an already reviewed source owner,
native selector, closed mutation/commit contract and witness topology. A new UI
owner, target-player binding, commit primitive, hidden-information policy or
completion topology requires code and independent evidence. See the
[Gate 1 adaptation closeout](docs/bridge-v2/GATE1_ADAPTATION_AND_COMPATIBILITY_CLOSEOUT_2026-07-24.md).
The seven closed combat-pile topologies are defined once in the embedded
contract catalog and consumed by runtime validation, repository checks and the
audit; no generated candidate writes that production catalog or source
registry.

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

The generated `STS2_MCP.conf` contains only transport configuration:

```json
{
  "port": 15526
}
```

V1 mutation cannot be enabled. Use only state-bound actions advertised by the
current Bridge v2 state.

Windows/Linux use the game's corresponding `mods/` directory. Launch the game,
enable the mod, then verify:

```bash
curl -s http://localhost:15526/
curl -s http://localhost:15526/api/v2/capabilities | python3 -m json.tool
curl -s http://localhost:15526/api/v2/state | python3 -m json.tool
```

Compare `bridge.assembly_file_sha256` in capabilities with the SHA-256 of the
DLL you copied. Also record `bridge.module_version_id`,
`bridge.runtime_instance_id`, exact game identity, and Modset. A matching disk
file without matching loaded identity is not deployment proof. A loaded build
still is not Organic action qualification.

For the complete fresh-clone, cross-device, install, restart, and
troubleshooting sequence, use the repository
[Local Setup guide](../docs/current/LOCAL_SETUP.md).

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
- `inspect_shop_catalog_v2(expected_state_id)`
- `get_agent_observation_bundle_v2(expected_state_id, include_run_deck?, include_combat_piles?, include_shop_catalog?)`
- `submit_agent_action_v2(request_id, expected_state_id, action_id)`
- `get_agent_command_v2(request_id)`

The default adapter exposes no v1 tools. The Gateway exposes no v1 state,
profile, wiki, compendium, or mutation endpoint.

## V2 HTTP Contract

```text
GET  /api/v2/capabilities
GET  /api/v2/state
GET  /api/v2/inspections/{kind}?expected_state_id={state_id}
POST /api/v2/observation-bundles
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

The rebuilt SpireAgent has a strict v2-only decoder/projector and Connector. It
displays `context.kind + surface.kind + authority`. A Bridge-owned surface uses
only Bridge-advertised opaque actions, while an unsupported or missing v2
surface fails closed. Historical v1 records are outside the Re runtime.
Exact-build mismatch,
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

MIT. See [LICENSE](LICENSE). The upstream origin and archived v1 source remain
covered by the same license.
