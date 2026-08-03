# Connector V3 Freeze Plan

Status: Preview.12 source closed; conditional exact-runtime freeze candidate

Authority: [ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md)

## Implemented Baseline

Preview.12 provides the Preview.11 baseline plus:

- Gateway-local generated-choice source contracts without a duplicate Re
  source whitelist;
- runtime/catalog witness parity for rest and revised action-local
  combat-hand confirm completion;
- typed visible unsupported for source-unresolved known UI;
- idempotent SIGINT/SIGTERM controller and local-lock release.

The retained baseline provides:

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

- Gateway tests: 284/284.
- Re: typecheck, 291/291 tests and production build.
- Python MCP, docs, CLI, identity, compatibility, permission, qualification,
  profile, migration, inventory, adaptation and clean-closure checks.
- Preview.11 Release build, coherent install and exact cold load.
- Preview.11 V3 capability/control/observation and strict Re decode.
- one Preview.11 203-decision completed-game Journey plus direct combat,
  event, map, shop, rest, reward and selector receipts;
- stale command refusal before Commit and repeatable same-request receipt.
- Human profile default-disabled refusal.

Exact Preview.11 identities are in its
[closeout](../../STS2MCP/docs/connector-v3/PREVIEW_11_FREEZE_CANDIDATE_CLOSEOUT_2026-08-03.md).
The
[freeze re-audit](audits/CONNECTOR_V3_FREEZE_READINESS_AND_ADAPTATION_REAUDIT_2026-08-03.md)
classifies the later exact-runtime runs and Preview.12 repairs.

## Remaining Freeze Phases

### Phase 1: Preview.12 Changed-Path Canaries

Cold-load Preview.12 and re-exercise Quasar, rest heal/Smith, combat-hand
confirm, source-unresolved deck enchant and immediate restart after SIGINT.

Exit: revised receipts are exact, unsupported remains typed, no false
quarantine occurs and no second run waits for the 30-second lease TTL.

### Phase 2: Rare-Family Runtime Matrix

On the same artifact, exercise targetless potion, combat-pile,
deck-transform, Wood Carvings, generated choice, combat-hand reversible
stages, current/stale Inspection and current/stale linked detail.

Exit: action-local receipts and successors are retained for each reached
operation. No sibling or Surface-wide authority is inferred.

### Phase 3: Human Evidence Lifecycle

Enable the profile explicitly, cold-load, then exercise fixed native page
open/read/return plus one stale and one recovery failure. Disable and cold-load
again afterward.

Exit: pre/post owner equality, no ledger entry, no mutation authority and
failure recovery are all observed.

### Phase 4: Rollback And Revoke

Restore one coherent backup, cold-load it, prove loaded identity drift and
authority refusal, then reinstall/cold-load the candidate. Exercise revoke on
one exact session scope.

Exit: loaded rollback, reinstall and revoke are recorded without mixed DLL or
provenance files.

### Phase 5: Journey Review

Preview.11 already has a 203-decision completed-game Journey. Run a Preview.12
Journey when practical, but do not use another Journey to substitute for an
unreached changed path or source.

## Freeze Rule

Mark `FROZEN` only after all five phases. Until then use
`CONDITIONAL FREEZE CANDIDATE`; do not bump support, create durable qualification or
inherit old MVID evidence to satisfy the gate.
