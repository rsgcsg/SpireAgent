# Player Environment Clean-Baseline Plan

Status: source migration implemented; automated verification and new-artifact
Live proof are the remaining gates.

Authority: [ADR-0009](decisions/ADR-0009-player-environment-core-boundaries.md)

## Delivered Source Boundary

```text
LiveHost observe
-> NativeUi bind exact current native controls and operands
-> Identity/Control verify artifact, controller and request identity
-> PlayerEnvironment publish snapshot/reads/bound actions
-> consumer chooses one opaque handle
-> Host revalidates and delivers native input
-> receipt + successor
```

- Provider action publication and V2/V3 runtime HTTP authority are removed.
- Player Environment public records import no retired protocol types.
- Re production startup directly selects the Player Environment adapter, strict decoder,
  normalizer and finite action projection.
- machine-readable contract and boundary checks guard cross-component drift.
- native-page evidence is isolated, default-off and non-authorizing.

## Current Acceptance Gates

1. Host tests and Release build against the exact discovered game install.
2. Re typecheck, tests and production build.
3. Python MCP syntax, CLI, current-truth, schema, boundary and link checks.
4. Safe install while STS2 is closed and rollback record verification.
5. Cold-load exact SHA/MVID/protocol/game/Modset/runtime identity.
6. ordinary Player Environment-only Live run covering Observe/Read/Interact and stale refusal.
7. Bounded native-page profile Live exercise including recovery.

## Deferred Programs

Headless, Training, Search, learning and A strategy improvements remain outside
this plan. A future consumer may add a projection but cannot change C truth,
native binding or authority.
