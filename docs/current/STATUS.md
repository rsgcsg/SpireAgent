# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline And Architecture

- Agent: `Re-SpireAgent/`.
- Connector: `STS2MCP/` Semantic Gateway, REST contract, and optional MCP
  adapter.
- Legacy: the original runtime and P8--P15 route are archived.
- Target: [ADR-0002 two-plane Semantic Gateway](decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md),
  refined by [ADR-0003 operation retirement/native continuation](decisions/ADR-0003-operation-retirement-and-native-continuation-migration.md).

Gate 1 remains closed as a bounded vanilla ordinary-single-player v2 baseline,
not complete game or visible-information coverage. Gateway v1 is retired.
Gate 2 is active through reliability, observation closure, and shadow-first
native-contract migration.

## Current Source And Loaded Environment

Current source contract is `2.0-preview.68`; Re normalized schema is `27`.
Preview.68 adds coherent read-only observation retry, a correct one-game
terminal boundary, exact Kifuda continuation handoff, source-bound deck-enchant
contracts, typed receipt completion boundaries, native hover-derived Orb text,
and a non-authorizing runtime contract/source shadow.

Preview.68 is built, installed, and loaded:

```text
built SHA     d33791395a33d6937a03e9853e865f35b631104f943ecf3abcf4027c32c2418f
installed SHA d33791395a33d6937a03e9853e865f35b631104f943ecf3abcf4027c32c2418f
built MVID    6c2e1933-462c-43ae-ad6f-edb60b1bf19c
installed MVID 6c2e1933-462c-43ae-ad6f-edb60b1bf19c
loaded SHA      d33791395a33d6937a03e9853e865f35b631104f943ecf3abcf4027c32c2418f
loaded MVID     6c2e1933-462c-43ae-ad6f-edb60b1bf19c
runtime         6b1e1cdf97bd44429b44e37a9b15895d
profile         env-8fb83dbe8bb6ddd3772d6b64
environment     ec4b40c3b801ee4a902e156f7601c619bfc75dd91b8d2fce24355bde78bc755a
Modset          dba2e4b15b47b4b0c5e337bec848cfd7cced575bcf6e73ae0993bab0f1c99eff
Patch           ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
rollback      STS2MCP/.local/deployments/2026-07-27T13-34-39-345Z
```

The first two Preview.68 `agent:run` attempts correctly made no model call or
mutation, but exposed an Operator Shell ordering bug: it required normal
observation before running the migration cycle that establishes observation.
The pre-migration gate now checks artifact identity and an exact bridge-only
Modset; observation and mutation are required only after Gateway revalidation.
The exact cycle installed 87 session-canary candidates and no persistent
qualification. A real action canary and Organic journey remain outstanding.

Three real-runtime Preview.67 runs supplied defect and coverage evidence:

- `run-20260727103406-wn92jv`: 98 settled actions; one transient coherent-read
  race; one normal combat transition.
- `run-20260727103957-wno7wf`: 26 settled actions; two coherent-read races; one
  correctly blocked stale pre-commit action; then an incorrect second-run
  entry after game-over cleanup.
- `run-20260727104330-fdxz1o`: 21 settled actions; Kifuda purchase committed
  but timed out while the native parent awaited its deck-enchant child.

Their declared provenance is `unrecorded`. They are inspected real-runtime
defect evidence, not Organic qualification. Exact diagnosis is in the
[Preview.68 audit](audits/PREVIEW_68_LONG_RUN_RELIABILITY_AND_NATIVE_CONTRACT_MIGRATION_2026-07-27.md).

## Authority Boundary

Preview.67's exact session-canary packages do not authorize Preview.68. On the
first Preview.68 cold load, `npm run agent:run` now performs an Operator Shell
preflight: it verifies source/built/installed/loaded identity, resumes the
exact-environment migration trial, waits for Gateway package revalidation, and
only then starts Re. Re still cannot grant permission. Unknown outcomes are
never retried.

`operation` remains current permission authority during migration, but is no
longer the final target identity. Runtime source binding, adapter/outcome
revision, completion boundary, and covered partition are being emitted as
non-authorizing shadow facts. Unknown source contracts fail closed.

## Immediate Next Step

With STS2 at its current event option, run only:

```bash
cd /Users/fire/Desktop/SpireAgent/Re-SpireAgent
npm run agent:run
```

Do not call Preview.68 qualified until a real journey exercises its exact
candidate actions. Remaining explicit unsupported scope includes Crystal
Sphere, standalone manual potion discard, unbound source variants,
non-standard profiles/menu paths, multiplayer, and incomplete player-visible
detail families. Read-only Inspection remains disabled for this candidate
environment and is separate from normal state observation.
