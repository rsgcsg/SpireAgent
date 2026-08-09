# Fresh Clone And Local Deployment

This is the canonical source deployment path for public testers and
contributors. It deliberately avoids hand-copying artifacts and does not treat
one developer's installed DLL as repository truth.

## Components And Names

| Name | Meaning |
|---|---|
| SpireAgent | This public monorepo and overall project |
| `Re-SpireAgent/` | External Agent runtime and strict Human-Equivalent C consumer |
| Human-Equivalent C | In-game player-visible UI observation, affordance and input-delivery owner |
| `STS2MCP/` | Compatibility-sensitive source directory and Mod ID for the Gateway, REST and optional MCP adapter |

The `STS2MCP` name does not make MCP mandatory. Re uses REST directly. A Mod ID
or directory rename is a separate compatibility migration.

## 1. Choose A Coherent Revision

For the public default branch:

```bash
git clone https://github.com/rsgcsg/SpireAgent.git
cd SpireAgent
git status --short --branch
```

Contributors testing the Human-Equivalent migration before it reaches the default
branch may explicitly track the shared branch:

```bash
git fetch origin
git switch --track origin/human_equivalent_connector
```

If the local branch already exists, use `git switch human_equivalent_connector` followed by
`git pull --ff-only`. Never pull over an unexplained dirty worktree. Branch
roles and multi-developer handoff rules are in
[Development Model](DEVELOPMENT_MODEL.md).

## 2. Install Prerequisites

Required:

- Node.js 20 or newer and npm;
- .NET 9 SDK;
- Git;
- Slay the Spire 2 through Steam.

Optional MCP development also needs Python 3.11 or newer and `uv`.

The repository does not contain proprietary game assemblies. Gateway tests and
builds reference the exact local Steam installation.

Install Re dependencies from the repository root:

```bash
npm run bootstrap
```

## 3. Configure Only This Machine

```bash
cp Re-SpireAgent/.env.example Re-SpireAgent/.env.local
chmod 600 Re-SpireAgent/.env.local
```

Set `DEEPSEEK_API_KEY` in `.env.local` or the process environment. Never print,
commit, upload or place it in run evidence. Each machine creates its own file.

The default Steam locations are detected on macOS and Linux. For another
location, especially Windows, set the exact game directory:

```text
STS2_GAME_DIR=D:\SteamLibrary\steamapps\common\Slay the Spire 2
```

Do not edit project files to encode a machine-specific path.

## 4. Diagnose Before Mutating

```bash
npm run doctor
```

`doctor` is read-only. It reports prerequisites, Git branch/HEAD/worktree,
source protocol, source-to-build provenance, built/installed/loaded SHA and
MVID, game identity, Modset, runtime authority and ordered next steps. It reads
only `STS2_GAME_DIR` from `.env.local`; it never prints provider configuration.

Typical action-required results include:

- `source_build_digest_mismatch`: source changed after the last Release build;
- `build_provenance_missing`: an old/manual artifact cannot be tied to source;
- `source_loaded_protocol_mismatch`: the running game still has an older DLL;
- `duplicate_gateway_manifests_detected`: more than one Mod manifest is scanned.

Do not bypass these checks by enabling fallback permissions.

## 5. Verified Build And Install

Fully exit Slay the Spire 2, then run:

```bash
npm run deploy
```

The command performs, in order:

1. Gateway, Re, Python/MCP and repository contract checks;
2. exact-game Release build and Re production build;
3. a build provenance record containing source revision/digest, protocol,
   artifact SHA and MVID;
4. duplicate-Mod diagnosis;
5. timestamped backup of the previous Gateway under ignored
   `STS2MCP/.local/deployments/`;
6. safe install and built/installed identity verification.

Installed provenance is keyed by the normalized game directory, so one checkout
can diagnose multiple local Steam installations without transferring identity
between them.

It refuses to start while the game is running and refuses to install a stale or
unattributed Release artifact. Its final `loaded` value is always `non_claim`.

Advanced contributors can run individual stages with:

```bash
npm run connector -- test
npm run connector -- audit
npm run connector -- build
npm run connector -- diagnose-installation
npm run connector -- install
```

The root workflow is authoritative. Manual `cp` is an emergency diagnostic,
not the supported deployment path, because it bypasses provenance and rollback.

## 6. Cold-Load And Verify

Start Slay the Spire 2 through Steam and wait until a stable menu. Then run:

```bash
npm run verify:loaded
```

This requires exact agreement among current C#/Re protocol, current source
digest, built DLL, installed DLL and Gateway-reported loaded SHA/MVID. It also
reports exact game, Modset and runtime identity. A successful check proves only
loaded identity and environment readiness; it is not mutation canary, Organic
evidence or persistent qualification.

For read-only diagnostics:

```bash
npm run connector -- show-status
npm run connector -- collect-evidence
```

Current routes are `/api/he/*`. Re consumes Human Environment snapshots and exact current UI
affordances without a V2/V3 capabilities or state sidecar. `/api/v3/*` is an
explicit rollback/comparison API, never a silent fallback.

## 7. Run Re-SpireAgent

```bash
cd Re-SpireAgent
npm run agent:run
```

The wrapper verifies exact identity and HE execution availability before
invoking the provider. Re consumes snapshots, finite opaque affordances,
delivery receipts and successors. It may query the same pending request, but
unknown delivery terminates the run and is never resubmitted.

The optional MCP transport is started separately:

```bash
uv run --directory STS2MCP/mcp python server.py
```

MCP owns no game legality, completion or additional permission.

## 8. Update Or Add Another Machine

On each machine:

1. stop Re and fully close the game;
2. protect local work with `git status --short --branch`;
3. `git fetch origin`, then fast-forward the intended branch;
4. rerun `npm run bootstrap`, `npm run doctor` and `npm run deploy`;
5. cold-start the game and run `npm run verify:loaded`;
6. recreate `.env.local` locally;
7. treat a changed game, Modset, Patch, Gateway SHA/MVID or runtime as a new
   evidence scope.

Do not move `node_modules/`, `dist/`, `bin/`, `obj/`, `out/`, game binaries,
installed DLLs, `.local/`, qualification stores or `data/runs/` through Git.

## 9. Rollback

Every changed install reports `rollback_backup`. With the game closed:

```bash
npm run connector -- restore-known-environment --backup <reported-directory>
```

This restores only the backed-up Gateway artifact and its local provenance. It
does not restore a Steam game version, Modset, save, permission or qualification.
Cold-start and verify again after rollback.

## 10. Troubleshooting

| Symptom | Safe response |
|---|---|
| Gateway endpoint unavailable | Confirm the game is running, the Mod is enabled and port `15526` is free. |
| Source/build/install drift | Close the game and rerun `npm run deploy`; do not manually relabel the old DLL. |
| Installed differs from loaded | Fully quit the game, confirm the process exited and cold-start again. |
| Duplicate `STS2_MCP` manifests | Close the game, run `diagnose-installation`, then use `repair-installation` only for recognized backup directories. |
| Protocol or strict decode mismatch | Fetch one coherent revision, rebuild both components and cold-start; never enable silent fallback. |
| Unknown command outcome | Stop and inspect the original receipt/evidence; never retry the mutation. |
| Missing provider key | Check the local file name and permissions without printing the value. |

Current support is defined by [Status](STATUS.md),
[Connector coverage](../../STS2MCP/docs/human-equivalent/COVERAGE.md) and immutable
exact-runtime evidence records, not by a successful build alone.
