# STS2 Agent Bridge

An in-process Slay the Spire 2 mod plus a thin MCP server for safe, auditable AI
gameplay. This repository starts from
[`Gennadiyev/STS2MCP`](https://github.com/Gennadiyev/STS2MCP) commit
`20eadebde358a37cca41f8b38728099e6d0d19db`, but Bridge v2 is a new,
state-bound protocol intended for the rebuilt `Re-SpireAgent` client.

The accepted cross-component destination is
[ADR-0002: Semantic Gateway Two-Plane Target Architecture](../docs/current/decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md).
It does not create a second Gateway or authority: compatibility/evidence stays
outside the live semantic decision path, and Re derives any model-facing view.
[ADR-0003](../docs/current/decisions/ADR-0003-operation-retirement-and-native-continuation-migration.md)
defines operation retirement and the narrow native continuation boundary.
[ADR-0006](../docs/current/decisions/ADR-0006-explicit-native-contract-and-durable-authority-convergence.md)
owns the current explicit-contract/durable-authority convergence.

## Status

Bridge v2 is the only mutation contract for the current Agent and default MCP
adapter. It remains an incremental semantic/visibility preview, not
complete-game coverage.

Current source is `2.0-preview.82`; Re normalized schema is `31`. Preview.82 is
built and installed as SHA `f5f47910...`, MVID `1e12b8d5...`; loaded identity
remains a non-claim until cold start. The latest loaded predecessor was
Preview.81 SHA `411f8cf5...`, MVID `c09e8569...`, runtime `4955bd9e...`; it
completed exact run `run-20260730074240-h09vpq` and exposed the map annotation
and Re stale-supervision defects repaired by Preview.82. Preview.77 types reviewed
`explicit_native_contract` separately from runtime-only
`manifest_migration_fallback` and rejects fallback durable packages in both
Gateway and operator tooling. Preview.82 leaves 50 explicit contracts, 38
volatile fallbacks and zero supported mixed explicit/fallback Surfaces. See
[current status](docs/bridge-v2/CURRENT_STATUS.md) for exact
build/install/load claims.

The following preview progression is historical context, not current source or
permission truth.

Preview.73 C# and Re source shared `2.0-preview.73`; Re normalized schema was
`29`. Gate 1 is closed as a bounded ordinary-single-player v2 connector
baseline. Preview.62 replaced repeated combat-pile source branches with a
reviewed embedded registry, moves exact-environment scopes into a reviewed
embedded policy, and added a non-authorizing exact-assembly audit. Preview.63
adds Gateway-owned operation-scoped session grants, conservative runtime Patch
evidence, semantic-completion promotion and failure quarantine. Preview.64
adds descriptive client registration, one mutation-controller lease,
generation fencing and command attribution. Preview.65 adds an embedded
operation-identity catalog, exact-environment persistent qualification ledger,
short-lived candidate packages, qualified packages, local quarantine, and
non-authorizing qualification tooling. Preview.66 adds non-authorizing
Environment Profiles, a risk-based migration policy, exact evidence
aggregation, automatic package orchestration, multi-environment package slots,
and atomic store reload. The final Neow's Fury runtime seal remains attributed
to Preview.61; new registry entries are never automatically Organic-qualified.
Preview.68 retains the identity shadow and adds typed completion boundaries,
exact Kifuda continuation handoff, source-bound deck-enchant contracts,
coherent read-only observation retry, native hover-derived Orb text, and a
non-authorizing runtime contract/source shadow. The last verified loaded
Preview.69 artifact supplied later real-runtime runs; their
provenance is `unrecorded`, so they are defect/coverage evidence rather than
Organic qualification. Preview.69 adds exact run-start settling, bounded
semantic-cycle recovery, native Orb formatting, and encounter-scoped runtime
trials. Preview.70 subsequently cold-loaded and completed an exact 124-decision
bounded run, while another run proved an empty-treasure-chest completion gap.
Preview.71 repaired that Oracle and later loaded. Preview.72 adds exact Hefty
Tablet source/result semantics and correct actionless-settling consumption; it
was built/installed/loaded, and current-runtime run
`run-20260728132337-ce2195` completed a 146-decision one-game boundary with 144
settled actions and one safe pre-execution stale rejection. The run is
`unrecorded`, Inspection-disabled, and did not exercise either repaired branch;
it is not Organic or persistent qualification. The 87-operation catalog now combines six explicit high-precision
contracts with 81 manifest-derived conservative identity/test-confirm
fallbacks. Fallback metadata does not assert semantic equivalence or bypass
current native legality, Commit, completion, or operation-local quarantine.
Exact evidence is recorded in [current status](docs/bridge-v2/CURRENT_STATUS.md).

Preview.73 repairs two later Rest failures without widening authority. Rest
completion now proves the native base-heal minimum plus option progression,
allowing legitimate native relic side effects above that minimum. A semantic
Surface whose operations are all withheld remains `bridge_owned + blocked`
with zero actions instead of becoming an internally contradictory unsupported
Surface. Preview.73 is source/test/build/install complete; current status owns
its cold-load and Live truth.

> Product security warning: the current HTTP listener is a developer preview.
> It binds to loopback and filters browser Origin. Preview.64 coordinates one
> local mutation controller per runtime, but client metadata is not
> authentication and does not contain a malicious local process. The v1
> namespace is retired, but localhost is still not a product-security
> boundary. Do not represent this as a consumer-safe Workshop product; see the
> [productization architecture audit](../docs/current/audits/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md).

- Historical Gate 1 binding: Slay the Spire 2
  `v0.109.0|c12f634d|-1639417500`. Its authority does not transfer.
- Current game identity:
  `v0.109.1|c8c577f6|-820620422`. Preview.72 grants are bound to its historical
  loaded Gateway identity and do not authorize installed Preview.73.
- A matching version/commit with a different main-assembly hash remains
  untested and has no v2 action or Inspection authority. Check
  [Bridge v2 current status](docs/bridge-v2/CURRENT_STATUS.md) before treating
  a local install as qualified.
- Historical Preview.73 kept centralized overlay/room/menu ownership, typed
  diagnostics, purpose-specific selection and event contracts, staged
  completion semantics, and a top-level read-only shared run/player HUD.
  Current-build capabilities distinguish reviewed exact-policy actions,
  operation-scoped session grants, exact applicable persistent qualifications,
  action canaries, and read-only Inspection instead of treating implementation,
  static similarity, or D evidence as permission.
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
  exact Lead Paperweight, Hefty Tablet, and sealed native Colorless/Attack/Skill/Power Potion sources of
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

Mutation clients must register and hold the current runtime controller lease.
Re-SpireAgent and the optional Python MCP adapter do this automatically.
Read-only capabilities, state, Inspection and command polling do not require a
lease. See the [Gate 3 closeout](docs/bridge-v2/GATE3_LOCAL_CONTROL_COORDINATION_CLOSEOUT_2026-07-25.md).

## Requirements

- Slay the Spire 2 installed through Steam.
- .NET 9 SDK.
- Python 3.11+ and [`uv`](https://docs.astral.sh/uv/) for the MCP process.
- A local MCP-capable client or `Re-SpireAgent`.

Do not copy `sts2.dll`, `GodotSharp.dll`, or `0Harmony.dll` into this repository.
The build references them from the local game installation.

## Build And Test

The preferred cross-component developer entrypoint is the root thin CLI:

```bash
npm run connector -- inspect
npm run connector -- test
npm run connector -- audit
npm run connector -- build
npm run connector -- install
npm run connector -- diagnose-installation
npm run connector -- repair-installation
npm run connector -- wait-for-gateway
npm run connector -- verify-loaded-artifact --wait
npm run connector -- collect-evidence
npm run connector -- run-agent -- --max-ticks 100
```

It delegates to the same component checks and qualification tools. It does not
reconstruct game rules or turn disk installation into loaded/Organic evidence.
`run-agent` performs exact loaded-identity preflight and may append a local
exact trial candidate; only Gateway revalidation can grant session authority.
`diagnose-installation` finds duplicate `STS2_MCP`
manifests in the native recursive Mod scan tree. With the game closed,
`repair-installation` may move only manifests already contained by an explicit
`backups` directory into ignored local quarantine; every other duplicate needs
manual review. `wait-for-gateway` and Re startup retry only the read-only
capabilities handshake. They never retry a mutation. The lower-level commands
remain documented below for diagnosis and CI.

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
npm run check:connector-permission-fixtures
npm run check:connector-qualification
npm run check:connector-profiles
npm run check:connector-migration
npm run audit:connector-compatibility
npm run audit:connector-operation-bindings
```

Windows PowerShell:

```powershell
$env:STS2_GAME_DIR = "D:\SteamLibrary\steamapps\common\Slay the Spire 2"
dotnet test STS2_MCP.sln -p:STS2GameDir="$env:STS2_GAME_DIR"
.\build.ps1 -GameDir "$env:STS2_GAME_DIR"
Set-Location ..
npm run check:connector-adaptation
npm run check:connector-compatibility-fixtures
npm run check:connector-permission-fixtures
npm run check:connector-qualification
npm run check:connector-profiles
npm run check:connector-migration
npm run audit:connector-compatibility
npm run audit:connector-operation-bindings
```

The solution currently contains 162 pure contract/runtime/coordination tests
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

The generated `STS2_MCP.conf` contains transport and local permission-mode
configuration:

```json
{
  "port": 15526,
  "permission_mode": "migration_exploration",
  "qualification_store": "STS2_MCP.qualifications.json"
}
```

Supported modes are `strict`, `balanced_gray`, `developer_gray`, and
`migration_exploration`. Higher modes admit additional reviewed risk classes,
but none bypass exact identity, bounded Modset classification, the reviewed
operation catalog, execute-time validation, native commit, semantic
completion, Patch gating, or quarantine. Migration mode may use an installed
candidate package or a current source-resolved encounter; the latter is
session-only and cannot persist. `strict` disables all candidate/session authority. Restart the game
after changing the mode. An invalid mode or unreadable config fails closed to
`strict`; a missing config creates the local developer default
`balanced_gray`. V1 mutation cannot be enabled; use only state-bound actions
advertised by the current Bridge v2 state.

`qualification_store` is a local append-only operation qualification ledger.
It is loaded at startup and atomically reloaded when the file changes; each
complete snapshot is revalidated before new scopes are published. It is never
served as a mutation endpoint. Missing means no persistent qualification;
malformed means fail closed. Keep it outside Git. Use
`npm run qualification:ledger -- ...` to inspect, compare, assemble, install,
revoke, or roll back packages. Use `npm run migration:profiles -- ...` for the
non-authorizing Profile index and `npm run migration:cycle -- ...` for an exact
candidate/evidence/qualification cycle. See the
[Preview.66 closeout](docs/bridge-v2/PREVIEW_66_MULTI_ENVIRONMENT_MIGRATION_CLOSEOUT_2026-07-26.md).
Set `qualification_store` to JSON `null` or the string `"disabled"` and restart
to disable ledger loading without deleting the local evidence file.

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
POST /api/v2/clients/register
GET  /api/v2/clients
GET  /api/v2/controller
POST /api/v2/controller/acquire
POST /api/v2/controller/renew
POST /api/v2/controller/release
POST /api/v2/commands
GET  /api/v2/commands/{request_id}
```

Submit only identifiers returned by the exact state:

```json
{
  "request_id": "client-generated-idempotency-key",
  "expected_state_id": "state_...",
  "action_id": "action_...",
  "client_session_id": "client_...",
  "controller_lease_id": "lease_...",
  "controller_generation": 1
}
```

Re-SpireAgent and the Python MCP adapter manage the registration and lease
sequence automatically. A direct REST writer must do so explicitly.

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

Current permissions come only from Gateway capability scopes. Preview.63
requires Re to verify scope grant identity against the Gateway permission
ledger; Re never computes, promotes or quarantines a permission. Planning code
never reads arbitrary Bridge JSON. Source `preview.30` projects top-level
shared run/player HUD facts and the scoped run-deck Inspection into typed player
facts without creating actions or entering the command ledger. Historical
v0.108 surfaces remain implementation history, not v0.109 authority.

The repository can verify, but never create, a recorded session transition:

```bash
npm run check:connector-permission-fixtures
npm run audit:connector-permission-transition -- \
  --before <pre-canary-capabilities.json> \
  --after <post-canary-state.json> \
  --surface main_menu \
  --operation continue_run
```

The assertion performs no submission and has no authorization or qualification
effect.

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
