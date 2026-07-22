# Bridge v2 Current Status

This is the canonical current status for the Gateway and Re connector boundary.
Historical preview reports are preserved in
[`../../../archive/bridge-v2-previews/`](../../../archive/bridge-v2-previews/)
and do not grant current authority.

## Current Source-Truth Status

The C# Bridge and Re-SpireAgent now share `2.0-preview.55`. C# derives explicit
`surface_kind + operation + tier` scopes from the exact-build manifest,
advertises only those operations, and publishes a path-free SHA-256 for its
loaded assembly. Re decodes the same contract. The attempted `.56` Discovery
branch was not retained because current C# source has no verified native source
binding for it; unknown generated-card sources remain rejected.

Gate 0 is now closed on the exact loaded artifact recorded in
[the Gate 0 closeout](CONNECTOR_G0_CLOSEOUT_2026-07-22.md). Re completed
`main_menu -> singleplayer_menu -> main_menu` through advertised opaque
actions, Bridge command completion, and coherent successor observations under
one SHA/MVID/runtime identity.

## Required Repair Order

1. Audit remaining v1 ownership per operation and coherent journey.
2. Close normal-run v2 coverage and visible-information gaps one exact
   operation at a time, preserving current permission tiers.

The detailed audit and migration sequence is
[REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md](REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md).

## Current Safety and Scope

- v2 keeps one Active Surface owner, opaque state-bound actions, shared
  publication/execution legality, main-thread commit, semantic completion,
  unknown-no-retry, independent read-only Inspection, and exact-environment
  capability scoping.
- Re has no v1 mutation transport. Gateway v1 reads remain explicit legacy
  compatibility; all Gateway v1 POST routes are disabled by default and require
  the local `enable_legacy_v1_mutations=true` compatibility setting.
- REST is Re's current transport. The Python MCP server is optional and must
  not become a second legality/completion engine.
- The current HTTP listener is a developer preview, not a consumer-safe
  authorization boundary: it lacks Gateway authentication, controller lease,
  and restart epoch semantics.

## Evidence Vocabulary

Source audit, fixture/unit test, Release build, installation, loaded module,
canary, and Organic Qualification are separate evidence classes. A successful
fixture, static build, old MVID, or historical v1 journey cannot be promoted to
a current v2 permission claim.

## Next High-Value Work

The next task is Gate 1 operation-level migration: select the highest-value
normal-run v1-owned or fail-closed step, prove its exact source/UI contract, and
close Bridge/Re/completion/evidence together. Do not convert canary support into
qualification without current exact-build Organic evidence.
