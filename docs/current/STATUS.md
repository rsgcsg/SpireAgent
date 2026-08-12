# Current Status: Player Environment C

Baseline date: 2026-08-12

Branch: `human_equivalent_connector`

Current source protocol: `1.0-rc.1`

## Verdict

The source tree is a **C1 source freeze candidate in migration**, not frozen.
Player Environment is the only current connector contract. Bridge v2, Connector
V3 and the transitional `/api/he` route are retired and return `410`; Re has no
fallback decoder or executor.

## Current Ownership

- `LiveHost` extracts fair-player facts and resolves the one current UI owner.
- `NativeUi` keeps native objects private, derives exact bindings from current
  UI mechanics, revalidates them at execution and invokes STS2 callbacks.
- `EnvironmentIdentityRuntime` records runtime, artifact, game and Modset
  identity; it does not grant source/operation permissions.
- mutation control owns the single-writer lease and attribution.
- `PlayerEnvironment` owns Snapshot, Read, finite BoundAction projection,
  stale rejection, idempotency, delivery Receipt and successor capture.
- REST and optional MCP are transport only.
- Re imports opaque `bound_action_id` values and never reconstructs legality.

The compiled permission/qualification/operation-manifest graph has been
deleted. Random deck transform, deck selection, combat-pile selection,
generated card choice and rest are source-free Native UI mechanics.

Player-visible Surface facts now use an explicit per-family projection. Native
screen, room, hand, slot and annotation-input bindings remain Host-private.
Referents come only from visible facts; an unobserved native operand truncates
the finite projection and publishes neither capability nor action authority.

## Information Closure

C1 covers stable and inspectable player information:

- persistent run/player summary and complete current structured interaction;
- visible referents plus directly observed enabled/selected state;
- state-bound `run_deck`, `combat_piles`, `shop_catalog` and `surface_card`
  reads;
- optional, non-authorizing `native_pages.v1` open/read/return evidence for run
  deck, combat piles and shop catalog.

Current keyboard/controller focus, active hover traversal, arbitrary scroll
traversal and exhaustive tooltip subtypes remain explicit partial/unsupported
scope. Transient VFX/SFX, floating
text and highlight history are deferred to C1.x, not silently claimed by C1.

## Evidence Boundary

The latest predecessor artifact loaded in the game is protocol
`1.0-preview.6`, SHA
`3dc9febfc857e483f7e70da331a1ebda50233e294b89ffc8ba8643cca13288df`, MVID
`63ae2447-c4b1-4c70-8550-5846dc955f2b`, runtime
`943c1e4ecdad400aaa6fd3bb2654936f`. Runs
`run-20260812011821-glpzol` and `run-20260812034353-ye6qd7` reached correct
complete-run boundaries on that exact artifact. They are historical evidence,
not evidence for rc1.

The same predecessor runtime also supplied actionable negative evidence:

- `run-20260812013637-jijudq` stopped after 526 decisions because
  `FIELD_OF_MAN_SIZED_HOLES` reached an exact visible selector that the old
  source-contract gate rejected. Current source replaces that gate with the
  source-free native simple/deck selector path.
- `run-20260812031218-khf4vp` stopped after 611 decisions when `THE_ARCHITECT`
  remained in a legitimate empty event settling state longer than the old
  eight-observation Re guard. Current Re uses a bounded 40-observation settling
  guard.
- `run-20260812031135-jc8iz5` stopped on provider `fetch failed`; it is an A/
  provider failure, not C evidence.

All three records declare provenance `unrecorded`; they are diagnostic Live
coverage, not qualification or authority for rc1.

The current rc1 source has automated evidence while this migration is being
closed: Host tests pass `82/82`; Re tests pass `67/67`; strict protocol,
CLI, identity, documentation and boundary checks pass. It must still be built
as the final committed revision, installed, cold-loaded and exercised as one exact
artifact before any C1 freeze verdict. Source, test, build, install, loaded,
Live journey and a C1 freeze verdict remain separate claims.

## Deployment Rule

Every checkout runs `npm run doctor`, builds and deploys while STS2 is closed,
then cold-starts the game and runs `npm run verify:loaded`. Matching source,
Release output and installed bytes do not prove the process loaded that DLL.
