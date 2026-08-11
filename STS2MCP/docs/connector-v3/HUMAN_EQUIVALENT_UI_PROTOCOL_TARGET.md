# Human-Equivalent UI Protocol Target

Status: design target; no implemented schema claim

Authority: `docs/current/decisions/ADR-0008-human-environment-ui-first-connector.md`

## Target Schemas

Names are provisional until implementation:

```text
sts2.connector.human-ui/observation-1
sts2.connector.human-ui/reveal-1
sts2.connector.human-ui/action-1
sts2.connector.human-ui/receipt-1
sts2.connector.human-ui/menu-governance-1
```

## Observation

A target observation contains:

- exact runtime and monotonic state identity;
- rendered frame ID and dimensions;
- current modal/UI owner;
- structured visible controls and entities;
- labels, roles, bounds, selection, enabled/disabled and available actions;
- direct and revealable information with provenance;
- navigation/page opportunities;
- completeness and hidden-by-policy declarations.

## Reveal

Reveal operations may hover, focus, scroll, expand, switch tab, open a native page or close/return. They are state/frame-bound and produce a successor observation.

## Action

Actions operate only on a current advertised control/entity or a bounded frame target:

```text
hover
focus
scroll
open
close
activate
select
deselect
confirm
cancel
drag
drop
```

Request identity includes exact expected state, frame, owner, target and controller generation.

## Receipt

Receipts report input delivery:

```text
not_applied
applied
pending_delivery
unknown_delivery
```

A receipt does not assert the complete game transaction result. Consumers observe the successor and reason from human-visible state.

## Menu Governance

The protocol distinguishes ordinary gameplay/menu navigation from persistent management. Destructive profile/save actions, Mod/global configuration and quit application require explicit policy.

## Compatibility

The preferred compatibility key is the human-visible UI contract and structured-control adapter, not every internal source method. Version or Mod changes that preserve human-operable UI may continue to work, but this remains an evidence claim rather than an automatic guarantee.

## Non-Claims

The inherited `3.0-preview.12` wire remains the only implemented protocol at branch creation. None of the target schemas or behavior in this document is currently Live.