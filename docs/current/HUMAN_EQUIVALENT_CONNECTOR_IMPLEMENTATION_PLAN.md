# Human-Equivalent Connector Implementation Plan

Status: core implemented; exact-runtime validation and information parity open

Authority: [ADR-0008](decisions/ADR-0008-human-equivalent-ui-first-connector.md)

## Delivered Core

```text
current native UI
-> HumanSnapshot
-> finite generic affordances
-> exact native input delivery
-> receipt + successor
-> direct Re opaque choice
```

The implementation reuses V3's state/entity identity, current UI providers,
native adapters and controller lease. It does not use V3 action IDs or require
SourceContract, permission scope, qualification or business Outcome.

`he_assisted` and `he_pure` are A composition modes over the same pure C wire.
D is not embedded in C and currently has no default provider.

## Acceptance Already Covered By Tests

- strict `preview.2` wire decode and rejection of any embedded D annotation;
- unknown business source with exact current UI remains actionable;
- source-free deck-card select/deselect/preview/cancel/confirm contracts;
- source-free combat-pile select/deselect/cancel/confirm contracts;
- opaque Re action projection without V2 `legal_actions[]` wire input;
- exact parameters never leave C and therefore cannot be replaced by Re;
- generic verbs do not expose business operation as wire authority;
- unknown delivery is non-retryable;
- existing Gateway and Re regression suites.
- adapter-confirmed HE delivery remains successful while successor readiness is
  transitional; Re continues instead of inventing a business failure.
- HE semantic cycle detection ignores fresh state/affordance transport identity.

## Remaining Vertical Work

1. Build/install/cold-load `preview.2` and verify SHA/MVID.
2. Regress source-free combat-pile selection and delivery/readiness separation.
3. Assisted ordinary journey and pure bounded journey.
4. Source-unclassified one-of-N and deck-card selector Live holdouts.
5. Re on-demand consumption of implemented state-bound Inspection and Human
   normal-flow native page transitions.
6. Hover/focus/tooltip/scroll structured affordances.
7. One real custom-drawn UI experiment before deciding on visual fallback.
8. Main-menu destructive-operation governance.

## Deletion Rule

Do not delete the V3 rollback endpoint until HE exact-runtime evidence covers
ordinary menu, combat, map, event, reward, shop, rest, treasure, selectors and
game over. It must remain explicit and unreachable from HE/Re default flow.

Do not add source-specific HE permission or business completion to solve a
strategy/flow issue; that belongs to A or optional D evidence.
