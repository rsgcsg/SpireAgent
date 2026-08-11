# Re Human Environment Integration

Re strictly accepts `1.0-preview.6`.

```text
C observation
-> strict decode and current-state projection
-> complete finite model choices
-> model selects one opaque local ID
-> Re submits snapshot ID + bound-action ID
-> C revalidates and delivers native input
-> receipt + successor
-> Re supervises progress
```

The production composition directly selects `Sts2HumanEnvironmentAdapter`,
`normalizeHumanEnvironmentCurrentState` and
`buildHumanEnvironmentAllowedActions`. There is no V2/V3 fallback or local
legality reconstruction.

`src/domain/actions/action.ts` defines only the current opaque HE executable
action. Retired index/V2/V3 actions are isolated in `legacyAction.ts` for old
fixtures and are excluded from `dist`; shared runtime utilities are generic
rather than aware of those protocols.

Public subject and argument references remain model-readable; exact native
operands stay in C. A truncated/unavailable bound-action projection authorizes
nothing. `applied` is delivery-authoritative, `not_applied` requires a fresh
snapshot and `unknown` stops without retry.

Re can fetch an advertised `/api/he/reads/{read_id}` lazily. The exported eager
bundle helper validates snapshot/runtime/environment coherence for consumers
that need one complete input tensor; it cannot add facts or actions.

The optional `native_pages.v1` profile is operator evidence tooling. Re does
not open native pages during the normal decision loop and gains no authority
from an evidence session.
