# Connector V3 Freeze Plan

Status: Preview.12 Live baseline recorded; adaptation amendment pending cold-load

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

The current amendment adds `deck_enchant_source_contracts_v1`, including
Royal Stamp, and partitions volatile authority by operation contract plus
exact source evidence. It changes no wire, Re schema, Commit adapter or
Outcome contract and creates no durable qualification. Its Release artifact
is now fixed and installed at SHA `1c0e2d82...c20c97`, MVID
`fd3177e5-bc0c-4acd-8097-ea237957a152`; exact cold-load and one bounded Live
journey are verified. A prior
mixed Re/Gateway run exposed the source-blind execute-time lookup and is
recorded as evidence for this repair, not as evidence against the new artifact.

## Completed Evidence

- Gateway tests: 287/287.
- Re: typecheck, 291/291 tests and production build.
- Python MCP, docs, CLI, identity, compatibility, permission, qualification,
  profile, migration, inventory, adaptation and clean-closure checks.
- Preview.11 Release build, coherent install and exact cold load.
- Preview.11 V3 capability/control/observation and strict Re decode.
- one Preview.11 203-decision completed-game Journey plus direct combat,
  event, map, shop, rest, reward and selector receipts;
- stale command refusal before Commit and repeatable same-request receipt.
- Human profile default-disabled refusal.
- `run-20260803144301-4vnzxu`: 106 decisions on the repaired loaded artifact;
  103 direct V3 commands settled with available successors and no retry,
  followed by the intentional completed-run boundary after game-over.

Exact Preview.11 identities are in its
[closeout](../../STS2MCP/docs/connector-v3/PREVIEW_11_FREEZE_CANDIDATE_CLOSEOUT_2026-08-03.md).
The
[freeze re-audit](audits/CONNECTOR_V3_FREEZE_READINESS_AND_ADAPTATION_REAUDIT_2026-08-03.md)
classifies the later exact-runtime runs and Preview.12 repairs.

Preview.12 was subsequently cold-loaded. Three runs reached completed-game
boundaries; two repeatably stopped on Royal Stamp because that source contract
was absent. See the
[adaptation amendment](audits/CONNECTOR_V3_ADAPTABILITY_AMENDMENT_AND_LAYERED_FREEZE_VERDICT_2026-08-03.md).

## Remaining Freeze Phases

### Phase 1: Source-Partition Adaptation Canary

Cold-load the amended artifact. Exercise Royal Stamp and prove it starts from
`session_canary` even after a different deck-enchant source was promoted.
Retain one unknown same-shaped source as visible unsupported.

Exit: Royal Stamp produces exact native receipts, unknown source remains
typed, and failure/quarantine is limited to the exact source partition.

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
