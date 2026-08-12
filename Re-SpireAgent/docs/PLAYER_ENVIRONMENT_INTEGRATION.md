# Re Player Environment Integration

Re strictly accepts protocol `1.0-rc.1`.

```text
C Snapshot
-> strict decode and current-state projection
-> complete finite model choices
-> model selects one opaque local ID
-> Re resolves it to one bound_action_id
-> Re submits snapshot ID + bound-action ID + controller lease
-> C revalidates and delivers native input
-> delivery Receipt + successor Snapshot
-> Re supervises progress
```

The production composition directly selects `Sts2PlayerEnvironmentAdapter`,
`normalizePlayerEnvironmentCurrentState` and
`buildPlayerEnvironmentAllowedActions`. There is no V2/V3 fallback, source
whitelist or local legality reconstruction.

`src/domain/actions/action.ts` defines only the current opaque `bound_action`.
Public referents remain model-readable; exact native operands stay in C. A
truncated or unavailable bound-action projection authorizes nothing.
`delivered` proves input delivery only, `not_delivered` requires a fresh
Snapshot, and `unknown` stops without retry.

Re can fetch an advertised `/api/player-environment/reads/{read_id}` lazily.
The eager decision-bundle helper validates snapshot/runtime/environment
coherence for consumers that need one aggregate input; it cannot add facts or
actions.

The optional `native_pages.v1` profile is operator evidence tooling. Re does
not open native pages during the normal decision loop and gains no authority
from an evidence session.
