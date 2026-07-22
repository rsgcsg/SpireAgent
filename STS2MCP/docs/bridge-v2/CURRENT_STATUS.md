# Bridge v2 Current Status

This is the canonical current status for the Gateway and Re connector boundary.
Historical preview reports are preserved in
[`../../../archive/bridge-v2-previews/`](../../../archive/bridge-v2-previews/)
and do not grant current authority.

## Current Source-Truth Blocker

The C# Bridge source and installed DLL advertise `2.0-preview.54`. Current
Re-SpireAgent requires `2.0-preview.56`, including fields, operation scopes,
and a `discovery` generated-card source branch absent from the C# source. The
independent C# and TypeScript suites can therefore be green while the current
checkout is not a proven end-to-end connector.

No current loaded-game identity has been established for the clean checkout.
Historical preview.54 evidence is scoped to its recorded game build, Modset,
Bridge SHA, MVID, runtime instance, and operation. It must not qualify the
current C# source, a different installed artifact, or another environment.

## Required Repair Order

1. Choose one actual protocol revision and align C# source, Re decoder,
   capabilities, protocol examples, and documentation.
2. Add language-neutral fixtures emitted by the C# contract and decoded by the
   real Re consumer.
3. Produce one Release artifact, record its SHA/MVID, install it, and verify
   the game process loaded the same artifact.
4. Re-negotiate exact game/Modset/runtime identity and run a bounded read plus
   existing low-risk action/completion canary.
5. Only then reopen coverage or permission expansion one exact operation at a
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

Source Truth Repair is the next task. Do not add another Surface, broaden
capabilities, or mark an historical preview as current before the cross-language
contract and loaded-artifact gap closes.
