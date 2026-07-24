# Fresh Clone And Local Deployment

This is the current cross-component setup and deployment runbook. Component
READMEs own detailed commands; this file owns their order and the evidence
needed to call a local deployment complete.

## Names And Repository Layout

| Name | Meaning |
|---|---|
| SpireAgent | This public monorepo and the overall project |
| `Re-SpireAgent/` | Current external Agent runtime and strict REST consumer |
| STS2 Agent Bridge / Semantic Gateway | Current game-side connector product/component |
| `STS2MCP/` | Existing source-directory and Mod ID family for the Gateway, REST adapter, and optional Python MCP adapter |

`STS2MCP` is retained as a compatibility-sensitive directory/Mod identifier.
It does not mean that MCP is the required Agent transport: Re uses Gateway REST
directly, while Python MCP is optional. Renaming the Mod ID, assembly, routes,
or directory is a separate migration and must not be mixed into ordinary
deployment.

## 1. Clone And Prerequisites

```bash
git clone https://github.com/rsgcsg/SpireAgent.git
cd SpireAgent
git switch develop
git pull --ff-only origin develop
```

Install:

- Node.js 20 or newer and npm 10 or newer;
- .NET 9 SDK;
- Python 3.11 or newer and `uv` if the optional MCP adapter is needed;
- Slay the Spire 2 through Steam.

The repository does not contain game assemblies. Gateway builds reference the
exact local Steam installation.

## 2. Verify The Agent

```bash
npm --prefix Re-SpireAgent ci
npm --prefix Re-SpireAgent run check
```

Create local provider configuration:

```bash
cp Re-SpireAgent/.env.example Re-SpireAgent/.env.local
chmod 600 Re-SpireAgent/.env.local
```

Set `DEEPSEEK_API_KEY` only in `Re-SpireAgent/.env.local` or the process
environment. Never copy a key into README files, shell history, run records, or
Git. Each machine owns its own `.env.local`.

## 3. Build And Verify The Gateway

macOS:

```bash
export STS2_GAME_DIR="$HOME/Library/Application Support/Steam/steamapps/common/Slay the Spire 2"
dotnet test STS2MCP/STS2_MCP.sln -p:STS2GameDir="$STS2_GAME_DIR"
python3 -m py_compile STS2MCP/mcp/server.py
uv lock --check --directory STS2MCP/mcp
dotnet build STS2MCP/STS2_MCP.csproj -c Release \
  -o STS2MCP/out/STS2_MCP \
  -p:STS2GameDir="$STS2_GAME_DIR"
npm run check:connector-adaptation
npm run audit:connector-compatibility
```

Windows PowerShell:

```powershell
$env:STS2_GAME_DIR = "D:\SteamLibrary\steamapps\common\Slay the Spire 2"
dotnet test STS2MCP/STS2_MCP.sln -p:STS2GameDir="$env:STS2_GAME_DIR"
dotnet build STS2MCP/STS2_MCP.csproj -c Release `
  -o STS2MCP/out/STS2_MCP `
  -p:STS2GameDir="$env:STS2_GAME_DIR"
python -m py_compile STS2MCP/mcp/server.py
uv lock --check --directory STS2MCP/mcp
npm run check:connector-adaptation
npm run audit:connector-compatibility
```

If Steam is installed elsewhere, change `STS2_GAME_DIR`; do not edit the
project file to encode one machine's path.

The compatibility audit writes an ignored local report to
`STS2MCP/out/compatibility-audit/latest.json`. It hashes the exact game
assembly, verifies reviewed combat-pile selector/commit structure, and lists
unregistered callers. It never grants permission or qualification.

## 4. Install With The Game Closed

Close Slay the Spire 2 and confirm its process has exited before replacing the
DLL. An in-place replacement while the process is running changes disk state,
not the loaded assembly.

macOS:

```bash
MODS_DIR="$STS2_GAME_DIR/SlayTheSpire2.app/Contents/MacOS/mods"
mkdir -p "$MODS_DIR"
cp STS2MCP/out/STS2_MCP/STS2_MCP.dll "$MODS_DIR/STS2_MCP.dll"
cp STS2MCP/mod_manifest.json "$MODS_DIR/STS2_MCP.json"
shasum -a 256 \
  STS2MCP/out/STS2_MCP/STS2_MCP.dll \
  "$MODS_DIR/STS2_MCP.dll"
open "steam://run/2868840"
```

Windows PowerShell:

```powershell
$mods = Join-Path $env:STS2_GAME_DIR "mods"
New-Item -ItemType Directory -Force $mods | Out-Null
Copy-Item STS2MCP/out/STS2_MCP/STS2_MCP.dll (Join-Path $mods "STS2_MCP.dll") -Force
Copy-Item STS2MCP/mod_manifest.json (Join-Path $mods "STS2_MCP.json") -Force
Get-FileHash STS2MCP/out/STS2_MCP/STS2_MCP.dll -Algorithm SHA256
Get-FileHash (Join-Path $mods "STS2_MCP.dll") -Algorithm SHA256
Start-Process "steam://run/2868840"
```

The built and installed hashes must match. Keep any manual rollback copy
outside the repository, for example under the operating-system temporary
directory.

## 5. Prove What Is Loaded

After the game reaches a stable menu:

```bash
curl -sS http://127.0.0.1:15526/
curl -sS http://127.0.0.1:15526/api/v2/capabilities | python3 -m json.tool
curl -sS http://127.0.0.1:15526/api/v2/state | python3 -m json.tool
npm --prefix Re-SpireAgent run agent:inspect
```

A complete local deployment check requires:

- `protocol_version` matches current C# and Re source;
- `bridge.assembly_file_sha256` matches the installed DLL;
- a fresh `bridge.module_version_id` and `bridge.runtime_instance_id` are
  recorded;
- game version/commit/hash and loaded Modset are explicit;
- `compatibility_policy_id`, its 64-character
  `compatibility_policy_digest`, and `adaptation_level` agree across
  capabilities and state;
- compatibility is not inferred from version text alone;
- Re negotiates `bridge_v2` and strictly decodes the same identity.

For a release that retires v1, verify the loaded process rather than the source
tree alone:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:15526/api/v1
curl -sS -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:15526/api/v1/singleplayer
```

Both must return `410`. A build, copied DLL, fixture, or successful decode does
not qualify a gameplay operation; Organic action evidence remains separately
scoped by game/Modset/SHA/MVID/runtime and operation.

## 6. Run Re Or Optional MCP

Re talks directly to Gateway REST:

```bash
npm --prefix Re-SpireAgent run agent:inspect
npm --prefix Re-SpireAgent run agent:tick -- --dry-run
npm --prefix Re-SpireAgent run agent:run -- --max-ticks 20 --delay-ms 250
```

Use the last command only when the current exact environment advertises the
intended operations. Stop on unknown outcome; do not retry an uncertain
command.

The optional Python MCP adapter is for MCP-capable external clients:

```bash
uv run --directory STS2MCP/mcp python server.py
```

MCP does not own game legality, completion, or extra authority. It forwards the
v2 Gateway contract.

## 7. Update Or Move To Another Machine

On every machine:

1. stop Re and close the game;
2. `git pull --ff-only origin develop`;
3. rerun Re checks and the exact-game Gateway tests/build;
4. replace the local DLL and manifest;
5. cold-start through Steam and compare built, installed, and loaded identity;
6. recreate `.env.local` locally rather than copying it through Git;
7. treat a changed game build, Modset, SHA, or MVID as a new evidence scope.

Do not copy `bin/`, `obj/`, `out/`, `dist/`, `node_modules/`, game binaries, run
records, or secrets between machines through Git. Rebuild generated outputs
locally.

## 8. Troubleshooting

| Symptom | Safe response |
|---|---|
| REST endpoint unavailable | Confirm the game is running, the Mod is enabled, and port `15526` is not changed or occupied. |
| Loaded SHA differs from built/installed SHA | Close the game fully, recopy the DLL, and cold-start; do not claim deployment. |
| Runtime identity changes during Steam startup | Wait for a stable menu, read capabilities again, then run Re inspection. Early HTTP availability is not a stable-runtime witness. |
| Protocol or strict decode mismatch | Pull one coherent revision and rebuild both components; never enable fallback. |
| Compatibility or Modset not eligible | Keep actions fail-closed and audit the exact environment; do not widen a wildcard. |
| Command times out or outcome is unknown | Stop the run and inspect evidence; never submit the same mutation automatically. |
| Re cannot find a key | Check only local `.env.local` permissions and variable name; do not print the key. |

Current support and evidence always come from
[Current Status](STATUS.md) and
[Bridge v2 Current Status](../../STS2MCP/docs/bridge-v2/CURRENT_STATUS.md), not
from an old preview closeout.
