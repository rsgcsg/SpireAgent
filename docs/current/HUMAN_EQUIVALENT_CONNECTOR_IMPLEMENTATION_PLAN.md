# Human-Equivalent Connector Implementation Plan

Status: architecture accepted on `human_euivalent_connector`; implementation not started

Authority: [ADR-0008](decisions/ADR-0008-human-equivalent-ui-first-connector.md)

Baseline: `connectorV3@5e57e47028b780619a9cd37b0cd13aeaebddaa2a`

## Objective

Build a real-game Agent connector whose default contract is human-equivalent UI access rather than complete business-transaction interpretation.

## Preserve First

Do not weaken these inherited mechanisms:

- exact runtime and artifact provenance;
- one current controller;
- state/entity/control identity;
- stale rejection;
- idempotent request ledger;
- explicit delivery uncertainty and no blind retry;
- strict Re decode and transport-only REST/MCP;
- evidence recording and rollback.

## Phase 1: Human-Reachable Observation Shadow

Add a non-authorizing shadow that records:

- rendered frame identity and dimensions;
- structured current UI tree;
- current modal/UI owner;
- visible controls/entities, roles, labels, bounds, selection and actionability;
- hover/focus/tooltip/scroll/page reveal opportunities;
- information provenance and completeness.

Compare this with current V3 observations without changing execution authority.

## Phase 2: Reveal And Navigation

Add state/frame-bound hover, focus, tooltip, scroll, tab, expand, native-page open/read/return and recovery to normal Agent flow.

A page-changing reveal is an ordinary UI transition. Record before/after owner, state, frame and target.

## Phase 3: Generic Current-Affordance Execution

Expose only current advertised actions such as activate, select, deselect, confirm, cancel, drag and drop.

Each request binds request ID, expected state/frame/owner, target identity and controller generation. Revalidate actionability immediately before dispatch.

Return delivery receipts:

```text
not_applied
applied
pending_delivery
unknown_delivery
```

Do not require a business Outcome before publishing the successor.

## Phase 4: Visual And Mod Fallback

For one custom-drawn UI lacking structured controls, add a bounded frame-pointer target. Reject stale frames and arbitrary long-lived coordinates. Do not expose node paths, methods or reflection mutation.

## Phase 5: Re Closed Loop

Update Re to:

- choose reveal/navigation actions;
- reason from compact current UI plus recent transitions;
- submit each action once;
- interpret successor state itself;
- wait through settling;
- recover with cancel, return or abandon-run when available;
- never blindly retry `unknown_delivery`.

## Phase 6: Main-Menu Governance

Classify ordinary gameplay navigation separately from persistent management.

Allow run start/continue/abandon/return-menu by default. Require explicit policy for destructive profile/save operations, Mod/global configuration and quit application.

## Phase 7: Exact-Runtime Holdouts

Exercise at least:

- Royal Stamp or another source-unresolved selector;
- Luminous Choir multi-stage selection;
- Rest Smith child handoff;
- combat-hand confirm entering a different successor;
- Quasar or another source-rich choice;
- one custom Mod UI fallback;
- abandon-run and return-menu;
- blocked quit-application and destructive profile/save action.

## A/B Evaluation

Compare inherited source-contract V3 and Human-Equivalent on:

- new-content code changes;
- Gateway and Re branch count;
- action completion rate;
- stale/duplicate/unknown behavior;
- false quarantine;
- Agent token and reasoning cost;
- state misinterpretation;
- version and bounded-Mod resilience.

## Cutover Rule

Do not delete or silently fall back to the V3 executor until Human-Equivalent proves input integrity and at least one source-unresolved real UI path. After cutover, one family must not retain two hidden executable authorities.

## Evidence Rule

Source, fixture, test, build, install, load, Live, canary, journey and qualification remain separate. No inherited V3 evidence proves this target.