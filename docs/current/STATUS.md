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

## Current Source, Installed Artifact, And Last Loaded Evidence

Current source contract is `2.0-preview.68`; Re normalized schema is `27`.
Preview.68 adds coherent read-only observation retry, a correct one-game
terminal boundary, exact Kifuda continuation handoff, source-bound deck-enchant
contracts, typed receipt completion boundaries, native hover-derived Orb text,
and a non-authorizing runtime contract/source shadow.

Preview.68 is built and installed while the game is closed:

```text
built SHA     d33791395a33d6937a03e9853e865f35b631104f943ecf3abcf4027c32c2418f
installed SHA d33791395a33d6937a03e9853e865f35b631104f943ecf3abcf4027c32c2418f
built MVID    6c2e1933-462c-43ae-ad6f-edb60b1bf19c
installed MVID 6c2e1933-462c-43ae-ad6f-edb60b1bf19c
rollback      STS2MCP/.local/deployments/2026-07-27T13-34-39-345Z
```

The last loaded artifact remains historical Preview.67 until the game is cold
restarted:

```text
game      v0.109.1|c8c577f6|-820620422
sts2 SHA  2cb39e2eee651743829abcc0df4dd9cd7e65f46287c7ca264481115c9602382f
sts2 MVID 208f08b8-d5f5-47f8-9e96-d3a4299ee709
Gateway   100ddf42c2114b30602a41c8908f63e154fc8f41a10ed37d4e2a1bded84fc74d
MVID      65bd744d-270b-4026-84c4-2ee397eee4e2
runtime   13f8d3d62d1644ec91a405a59dc4cd64
profile   env-788f4e8ca807b9e99e30757d
env       0cc2f76995afbffece47fb793d8797030acf64f908f4887d2fe91120df401164
Modset    c3dc252c1ba3f60542707b4aa8f2469c1b44f1552dca77eea626d585ad0fd070
Patch     ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
mode      migration_exploration
```

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

Cold-start STS2, wait for the Gateway to become ready, then run only:

```bash
cd /Users/fire/Desktop/SpireAgent/Re-SpireAgent
npm run agent:run
```

Do not call Preview.68 loaded or qualified until that command reports the new
loaded SHA/MVID and a real journey. Remaining explicit unsupported scope
includes Crystal Sphere, standalone manual potion discard, unbound source
variants, non-standard profiles/menu paths, multiplayer, and incomplete
player-visible detail families.
