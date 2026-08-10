# Human Environment Contract Implementation Plan

Status: Preview.5 source/test complete; current-machine build/install verified;
cold-load and Live pending

Authority: [ADR-0008](decisions/ADR-0008-human-equivalent-ui-first-connector.md)

## Delivered Core

```text
Host observe -> snapshot/interaction/referents/capabilities/reads
-> complete finite bound-action projection
-> consumer chooses opaque bound action
-> Host revalidates exact local binding
-> input delivery -> receipt + successor
```

Public records import no BridgeV2/ConnectorV3 types. Re strictly consumes
Preview.5 without aliases or silent fallback. Observable referents and current
interaction grammar exist before finite action materialization; public
subject/argument bindings never expose native operands.

## Automated Acceptance

- strict schemas reject legacy fields, dangling referents, unversioned
  extensible content and identity drift;
- bound-action interaction/subject/arguments bind the same current snapshot;
- finite projection counts and truncation are explicit and fail closed;
- common visible `entity_id` facts survive without action materialization;
- consumer labels do not alter canonical authority identity;
- multi-enemy actions remain semantically distinguishable;
- complete visible combat context reaches A rather than placeholder state;
- unknown source does not gate current exact UI mechanics;
- stale, duplicate-request and unknown-no-retry behavior remains active;
- one state-bound advertised read route replaces split transport concepts;
- boundary checks prevent V3 wire/default fallback and source authority.

## Remaining Work

1. Cold-load Preview.5 and verify exact source/build/install/load identity.
2. Complete bound-action delivery and stale-read exact-runtime regression.
3. One ordinary `he_pure` journey.
4. Hover/focus/tooltip/scroll/native-page information parity.
5. Neutralize the five real V3-owned Host adapter seams without wrappers.
6. Add generated interaction schemas and a second-Host conformance probe.

V3 remains explicit rollback only. Source authority, reward, business Outcome,
simulation lifecycle and privileged scenario control may not enter C.
