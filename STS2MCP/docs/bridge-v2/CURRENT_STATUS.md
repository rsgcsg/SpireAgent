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

The Release artifact was installed and the Steam process loaded the same
SHA/MVID; Re completed a strict read-only negotiated inspection. No command was
submitted, so no action/completion qualification was renewed for this exact
revision. The current checkout is therefore not an end-to-end qualified
connector.

No current loaded-game identity has been established for the clean checkout.
Historical preview.54 evidence is scoped to its recorded game build, Modset,
Bridge SHA, MVID, runtime instance, and operation. It must not qualify the
current C# source, a different installed artifact, or another environment.

## Required Repair Order

1. Run one existing low-risk action/completion canary and immediately verify
   its successor state through Re.
2. Only then reopen coverage or permission expansion one exact operation at a
   time.

The detailed audit and migration sequence is
[REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md](REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md).

## Current Safety and Scope

- v2 keeps one Active Surface owner, opaque state-bound actions, shared
  publication/execution legality, main-thread commit, semantic completion,
  unknown-no-retry, independent read-only Inspection, and exact-environment
  capability scoping.
- v1 remains active only as explicit legacy compatibility inside `STS2MCP`.
  It is neither proof of v2 coverage nor eligible for silent retirement.
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

The next task is an existing-scope action/completion canary. Do not add another
Surface, broaden capabilities, or mark an historical preview as current before
that exact-artifact action evidence exists. See the
[source-truth repair closeout](SOURCE_TRUTH_REPAIR_CLOSEOUT_2026-07-22.md).
