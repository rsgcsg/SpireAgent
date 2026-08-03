# Connector V3 Freeze Plan

Status: source closed; exact-runtime freeze candidate

Authority: [ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md)

## Implemented Baseline

Preview.11 provides:

- V3 capabilities, control, observation, command, receipt, Inspection, linked
  detail and optional Human-equivalence contracts;
- exact state/interaction/entity/control binding, one controller, idempotent
  ledger, execute-time validation, native Commit, semantic Outcome and
  unknown-no-retry;
- direct V3 discovery/execution and direct Re consumption for all currently
  cataloged ordinary vanilla single-player families and selectors;
- V3-native non-executing command descriptors, 94 explicit operation
  contracts, zero fallback authority and zero Provider action publication;
- strict Re capability/control/permission/qualification decoding with no V2
  state/action sidecar;
- state-bound semantic Inspection, bounded linked detail and deterministic
  compact Prompt projection v1;
- default-off `native_pages.v1` with config/CLI/routes, fixed page kinds,
  native open/read/return, pre/post owner checks, stale/runtime binding,
  mutation suppression, recovery state, tests and documentation;
- bounded request bodies for command, control and Human routes.

Provider-named files may retain exact game mechanics but cannot publish
actions or become a second executor.

## Completed Evidence

- Gateway tests: 278/278.
- Re: typecheck, 287/287 tests and production build.
- Python MCP, docs, CLI, identity, compatibility, permission, qualification,
  profile, migration, inventory, adaptation and clean-closure checks.
- Release build, coherent install and exact cold load.
- V3 capability/control/observation and strict Re decode.
- `main_menu/open_singleplayer` native Commit, receipt and stable successor.
- stale command refusal before Commit and repeatable same-request receipt.
- Human profile default-disabled refusal.

Exact identities and rollback path are in the
[Preview.11 closeout](../../STS2MCP/docs/connector-v3/PREVIEW_11_FREEZE_CANDIDATE_CLOSEOUT_2026-08-03.md).

## Remaining Freeze Phases

### Phase 1: Rare-Family Runtime Matrix

On the same artifact, exercise targetless potion, combat-pile,
deck-transform, Wood Carvings, generated choice, combat-hand reversible
stages, current/stale Inspection and current/stale linked detail.

Exit: action-local receipts and successors are retained for each reached
operation. No sibling or Surface-wide authority is inferred.

### Phase 2: Human Evidence Lifecycle

Enable the profile explicitly, cold-load, then exercise fixed native page
open/read/return plus one stale and one recovery failure. Disable and cold-load
again afterward.

Exit: pre/post owner equality, no ledger entry, no mutation authority and
failure recovery are all observed.

### Phase 3: Rollback And Revoke

Restore one coherent backup, cold-load it, prove loaded identity drift and
authority refusal, then reinstall/cold-load the candidate. Exercise revoke on
one exact session scope.

Exit: loaded rollback, reinstall and revoke are recorded without mixed DLL or
provenance files.

### Phase 4: Same-Artifact Journey

Run one bounded ordinary vanilla Journey, classify every stale, unsupported,
settling, unknown and stop, and review evidence before any qualification.

Current blocker: the configured DeepSeek endpoint is unreachable from this
environment; the final-artifact run stops before command submission.

## Freeze Rule

Mark `FROZEN` only after all four phases. Until then use
`FREEZE CANDIDATE`; do not bump support, create durable qualification or
inherit old MVID evidence to satisfy the gate.
