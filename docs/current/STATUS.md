# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/`.
- **Connector:** `STS2MCP/` Semantic Gateway, REST contract, and optional
  v2-only MCP adapter.
- **Legacy:** the original root runtime and P8--P15 route are archived.

## Current Gate

The repository now has one accepted target architecture: the
[Semantic Gateway Two-Plane Architecture](decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md).
This is an architecture decision, not a runtime completion claim. Preview.67
is its first identity-boundary shadow experiment; current authority remains on
the legacy composite path.

Gate 1 remains closed as a bounded ordinary-single-player v2 connector
baseline. Source contract is `2.0-preview.67`; Re normalized schema is `26`.
Gateway v1 is retired and every `/api/v1` route returns `410 Gone`.

Preview.67 introduces a required, non-authorizing identity shadow that
separates a game-semantic candidate from a current-authority candidate. The
legacy composite `state_id`, action binding, execution, completion, and Re
model input remain authoritative.

The latest exact local artifact is built, installed, and cold-loaded with SHA
`100ddf42c2114b30602a41c8908f63e154fc8f41a10ed37d4e2a1bded84fc74d`
and MVID `65bd744d-270b-4026-84c4-2ee397eee4e2`. Runtime epoch is
`13f8d3d62d1644ec91a405a59dc4cd64`. A historical backup manifest inside the
native Mod scan tree caused the earlier `Loaded + Failed` hazardous Modset; the
exact log source was identified and the backup directory was reversibly moved
outside that tree. The loaded Modset is now one `STS2_MCP` and status
`exact_bridge_only`.

The exact Preview.67 environment is `env-788f4e8ca807b9e99e30757d`, digest
`0cc2f76995afbffece47fb793d8797030acf64f908f4887d2fe91120df401164`.
The reviewed migration workflow installed 87 operation-scoped
`session_canary` packages; the Gateway hot-reloaded and revalidated all 87.
Observation and mutation are available only through those current scopes;
Inspection remains disabled. Re completed one non-executing dry-run
`run-20260727101452-4yy236`. Preview.67 still has **zero real mutations, zero
settled action canaries, zero Organic action evidence, and zero persistent
qualifications**.

Preview.66 completed one exact automatic migration slice on the same game
build under its own historical Gateway SHA/MVID. Preview.67 does not inherit
that authority by version, build, or Mod similarity:

- historical Preview.66 `main_menu/continue_run`: persistent `qualified` only
  in the Preview.66 environment;
- all 87 current Preview.67 manifest operations: exact session canaries only;
- five operations use explicit high-precision completion contracts; 82 use
  conservative manifest-derived identity/test-confirm fallbacks.

The Environment Profile is a non-authorizing local index. One global
append-only ledger can hold packages for multiple exact environments because
active slots are keyed by environment + Surface + operation. The
qualification store is atomically hot-reloaded and every package is
revalidated before publication. This is **real but narrow** automatic
requalification, not broad build, all-operation, cross-version, or cross-Mod
qualification.

## Exact Evidence Boundary

Last loaded exact game and assembly evidence (Preview.67):

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
catalog   8878447144e4fe4d8c01b2940335feb504367a81ac76e4b4fd22e2f4d6b85f0c
mode      migration_exploration
```

Preview.66 `continue_run` retains two historical ordinary-gameplay decisions
in its own exact identity:

```text
run-20260726132908-2e4rz6
run-20260726133036-d3tr3a
```

The orchestrator installed its qualified package, the Gateway hot-reloaded it,
and a later cold restart revalidated it against the exact game, Gateway,
Modset, Patch, environment and operation identity. Wrong environment,
expiry, corruption, revoke, rollback, witness mismatch, timeout, unknown
outcome, and quarantine are covered separately by fixtures. The exact runtime
and evidence boundaries are recorded in the
[Preview.66 closeout](../../STS2MCP/docs/bridge-v2/PREVIEW_66_MULTI_ENVIRONMENT_MIGRATION_CLOSEOUT_2026-07-26.md).

## Immediate Next Step

Do not widen wildcard or Surface authority. All non-Live preparation is
complete. From `Re-SpireAgent/`, run `npm run agent:run`. The npm entry permits
only Gateway-advertised run entry and then remains one-game bounded. Stop on
unknown, timeout, witness mismatch, identity drift, unsupported stable state,
or missing advertised actions. Return the run id and terminal decision; that
journey is the first possible Preview.67 action-canary/Organic evidence, not a
predeclared qualification. Capabilities summary/on-demand dual-read and
Inspection requalification remain later Gate 2 work.

Gate 1 closeout still does not mean complete-game coverage or complete
player-visible information. Crystal Sphere, standalone manual potion discard,
non-standard menu/profile flows, multiplayer, and unbound selector semantics
remain unsupported or outside the bounded gate.
