# Preview.67 Operator Readiness Closeout

Date: 2026-07-27  
Repository baseline: `develop` at `bb4b940` before this working change  
Scope: architecture re-review, non-Live repair, exact deployment, and Live
handoff. This report does not claim an Organic Preview.67 mutation.

## Verdict

Retain and strengthen the accepted
[Semantic Gateway Two-Plane Architecture](../decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md).
The Preview.67 failure was not evidence that Gateway action, Commit, Outcome,
or transaction boundaries should be replaced. It exposed three smaller
control-plane/operator defects:

1. a backup manifest remained inside the native recursive Mod scan tree;
2. the read-only evidence CLI requested `/api/v2/control`, which does not
   exist; and
3. Re and the CLI did not provide a bounded Gateway startup wait.

The correct repair is a thin, non-authorizing Operator Shell. A universal
transaction DSL, second permission system, or broader workflow engine would
not have prevented any of these failures.

## Preserved Evidence

Preview.66 evidence remains scoped to its exact environment. It contains
multiple `executed_and_settled` event, map, combat, reward, shop, and selector
actions plus the two-epoch persistent `main_menu/continue_run` qualification.
It does not authorize Preview.67.

Before repair, Preview.67 proved only:

- source/build/install/load protocol, SHA, and MVID agreement;
- `hazardous_mod_state_detected` with one `STS2_MCP Loaded` and one
  `STS2_MCP Failed` record;
- zero real mutations, zero action canaries, and zero Organic actions;
- at least three safe `not_executed_invalid_state` Re stops; and
- one deterministic `collect-evidence` route bug.

These failures remain valid historical evidence and were not rewritten as
successes.

## Exact Root Cause

The current native game log reported both manifest paths:

```text
mods/STS2_MCP.json
mods/backups/preview66-manifest-fallback-20260726/STS2_MCP.json
```

It then loaded the root DLL and emitted:

```text
Tried to load mod with id STS2_MCP, but a mod is already loaded with that name
```

Therefore the hazardous Modset was caused by a recursive duplicate backup
manifest, not by a false-positive Gateway classifier. The backup directory was
moved to ignored local quarantine, preserving a path-level rollback. The root
manifest, root DLL, configuration, and qualification store were not removed.

## Implemented Non-Live Repairs

The Connector CLI now:

- separates loaded artifact identity from environment, observation,
  Inspection, and mutation readiness;
- provides bounded read-only `wait-for-gateway` and `--wait` behavior;
- collects `/api/v2/capabilities`, `/api/v2/state`,
  `/api/v2/controller`, and `/api/v2/clients`;
- treats controller/client diagnostics as optional and records
  `partial_failures` instead of losing core evidence;
- discovers duplicate `STS2_MCP` manifests under the native scan tree;
- relocates only duplicates inside an explicit `backups` directory, with the
  game closed and a recorded rollback path;
- refuses to call an installation clean while duplicate manifests remain; and
- emits a compact startup summary rather than printing the full capabilities
  payload.

Re now:

- retries only transient network/5xx capabilities startup failures for a
  bounded interval;
- does not retry 4xx contract errors or any mutation;
- exposes the same Connector CLI from the `Re-SpireAgent/` working directory;
  and
- makes `npm run agent:run` explicitly opt in to Gateway-advertised run entry,
  while the underlying CLI default remains one-game-boundary conservative.

No Gateway action, permission, Commit, Outcome Oracle, Inspection authority,
or unknown-no-retry behavior was weakened.

## Current Exact Runtime

```text
protocol       2.0-preview.67
game           v0.109.1|c8c577f6|-820620422
Gateway SHA    100ddf42c2114b30602a41c8908f63e154fc8f41a10ed37d4e2a1bded84fc74d
Gateway MVID   65bd744d-270b-4026-84c4-2ee397eee4e2
runtime epoch  13f8d3d62d1644ec91a405a59dc4cd64
Modset         c3dc252c1ba3f60542707b4aa8f2469c1b44f1552dca77eea626d585ad0fd070
Patch          ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
profile        env-788f4e8ca807b9e99e30757d
environment    0cc2f76995afbffece47fb793d8797030acf64f908f4887d2fe91120df401164
```

Built, installed, and loaded SHA/MVID agree. The loaded Modset contains one
successful `STS2_MCP` and is `exact_bridge_only`.

## Trial And Authority Boundary

The exact migration dry-run found 87 reviewed operation contracts and no
applicable Preview.67 package. Applying the same plan installed 87 exact
`session_canary` candidates. The Gateway hot-reloaded the append-only store and
revalidated game, Gateway SHA/MVID, Modset, Patch, environment, operation,
completion, and witness identities before publishing scopes.

Current truth:

```text
normal observation       enabled through exact candidate environment
mutation                 enabled only for 87 exact session-canary operations
Inspection               disabled
Preview.67 real mutation 0
settled action canary     0
Organic action evidence  0
persistent qualification 0
```

Re read the current main menu as `actionable + bridge_advertised` with one
opaque `continue_run` action and completed non-executing dry-run
`run-20260727101452-4yy236`.

## Verification

Completed:

- Gateway tests: 163/163;
- Re tests: 190/190;
- Re typecheck and production build;
- Python MCP syntax check;
- Connector CLI, docs, inventory, adaptation, compatibility, permission,
  qualification, Profile, and migration fixture checks;
- Release build, backup, installation, cold start, and loaded SHA/MVID check;
- clean single-manifest Mod scan;
- read-only evidence capture with no partial route failures;
- exact migration dry-run/apply and Gateway hot reload; and
- strict Re inspection plus one no-mutation model dry-run.

Fixture and static checks remain non-Live evidence. The cold-load identity and
Modset are loaded-runtime evidence. The dry-run is provider/decision-path
evidence, not action completion evidence.

## Rollback

Gateway artifact rollback:

```text
STS2MCP/.local/deployments/2026-07-27T10-11-53-821Z
```

Duplicate-manifest rollback:

```text
STS2MCP/.local/mod-installation-quarantine/2026-07-27T10-11-31-941Z
```

Both are ignored local artifacts. Restore only with the game closed. Restoring
an artifact or manifest does not restore a game build, runtime epoch, Modset,
permission, or qualification.

## Remaining Live Boundary

The only next action is the user-run ordinary journey:

```bash
cd /Users/fire/Desktop/SpireAgent/Re-SpireAgent
npm run agent:run
```

Return the run id and final decision record. Any unknown outcome, timeout,
witness mismatch, identity drift, unsupported stable state, missing action, or
operation quarantine is a stop condition and must not be retried. A clean
journey may supply Preview.67 session-canary/Organic evidence; it does not by
itself qualify all 87 operations or promote any persistent package.

