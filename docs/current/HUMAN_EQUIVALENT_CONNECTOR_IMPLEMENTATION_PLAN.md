# Human Environment Contract Implementation Plan

Status: Preview.4 source/test complete; build/install/cold-load and Live pending

Authority: [ADR-0008](decisions/ADR-0008-human-equivalent-ui-first-connector.md)

## Delivered Core

```text
Host observe -> snapshot/interaction/referents/affordances/reads
-> consumer chooses opaque affordance
-> Host revalidates exact local binding
-> input delivery -> receipt + successor
```

Public records import no BridgeV2/ConnectorV3 types. Re strictly consumes
Preview.4 without aliases or silent fallback. Observable referents are produced
before affordance authority, and public subject/argument bindings never expose
native operands.

## Automated Acceptance

- strict schemas reject legacy fields, dangling referents, unversioned
  extensible content and identity drift;
- affordance interaction/subject/arguments bind the same current snapshot;
- multi-enemy actions remain semantically distinguishable;
- complete visible combat context reaches A rather than placeholder state;
- unknown source does not gate current exact UI mechanics;
- stale, duplicate-request and unknown-no-retry behavior remains active;
- one state-bound advertised read route replaces split transport concepts;
- boundary checks prevent V3 wire/default fallback and source authority.

## Remaining Work

1. Release build/install/cold-load Preview.4.
2. Multi-enemy delivery and stale-read exact-runtime regression.
3. One ordinary `he_pure` journey.
4. Hover/focus/tooltip/scroll/native-page information parity.
5. Neutralize the five real V3-owned Host adapter seams without wrappers.
6. Add generated interaction schemas and a second-Host conformance probe.

V3 remains explicit rollback only. Source authority, reward, business Outcome,
simulation lifecycle and privileged scenario control may not enter C.
