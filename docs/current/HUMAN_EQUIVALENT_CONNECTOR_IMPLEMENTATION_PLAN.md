# Human Environment Contract Implementation Plan

Status: `preview.3` source/test complete; exact-runtime and information parity open

Authority: [ADR-0008](decisions/ADR-0008-human-equivalent-ui-first-connector.md)

## Delivered Core

```text
host observe -> snapshot/elements/affordances/reads
-> consumer chooses opaque affordance
-> host revalidates exact local binding
-> input delivery -> receipt + successor
```

Public C records have neutral host/game/session/controller/element/read types
and no BridgeV2/ConnectorV3 import. Re strictly consumes `preview.3`; it does
not accept preview.2 aliases or a silent fallback.

## Automated Acceptance

- strict schema rejects legacy fields, dangling action targets and dangling
  read targets, unversioned extensible content and environment drift;
- every affordance targets one current element;
- unknown source does not gate exact current UI;
- source-free selector mechanics remain covered;
- exact operands never leave C;
- Re stores current UI affordances in an HE-native domain type rather than the
  historical Bridge legal-action model;
- stale, duplicate request and unknown-no-retry tests remain active;
- all Gateway and Re regression suites remain active;
- boundary check prevents Bridge/V3 public DTOs and old HE wire fields.

## Remaining Vertical Work

1. Release build/install/cold-load `preview.3` and verify SHA/MVID/protocol.
2. Short current-element/action/read smoke and one ordinary `he_pure` journey.
3. Native hover/focus/tooltip/scroll/page read-return.
4. Neutralize five V3-owned host adapter seams.
5. Generate tagged Surface schemas/SDKs from `content_schema` revisions.

V3 remains explicit rollback only. No source-specific authority, reward,
business Outcome or simulation lifecycle may be added to C.
