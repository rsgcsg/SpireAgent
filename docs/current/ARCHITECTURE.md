# Current Architecture — Human-Equivalent UI-First Target

Authority: [ADR-0008](decisions/ADR-0008-human-equivalent-ui-first-connector.md)

Implementation baseline: inherited Connector V3 at `5e57e47028b780619a9cd37b0cd13aeaebddaa2a`

## Target Live Path

```text
Native STS2 rendered UI and Control tree
-> Human-Reachable Observation
-> Current UI Affordances
-> state/frame-bound executor
-> delivery ledger
-> successor observation stream
-> REST or thin MCP
-> Re-SpireAgent
```

## Responsibility

STS2 owns game rules, effects, UI state and the actual meaning of player actions.

The Gateway owns complete current human-reachable UI representation, current modal/UI owner, controls/entities/actions, reveal/navigation operations, state/frame-bound dispatch, one-controller coordination, delivery identity and uncertainty, successor observations and main-menu governance enforcement.

Re owns strict decode, compact projection, deciding what information to reveal, choosing a current affordance, submitting once, interpreting successor state, strategy, run quality and business-result reasoning, recovery and local evidence.

REST and MCP remain transports.

## Human-Reachable Observation

Observation includes directly visible information plus information a human can obtain through hover, focus, tooltip, scroll, tabs, details and native pages. The Connector records provenance and excludes hidden RNG, true future outcomes and private engine state merely readable through reflection.

A page-changing reveal may be observation. Observation is a transition stream, not necessarily a zero-side-effect function.

## Input Contract

Every action binds exact current state, frame, owner and target. Structured controls are preferred. Frame-bound pointer fallback is allowed only for current human-visible custom UI that cannot be represented structurally.

The executor revalidates actionability immediately before dispatch and returns:

```text
not_applied
applied
pending_delivery
unknown_delivery
```

It need not assert the complete business transaction. Successor observation is the default completion channel.

## Governance Boundary

Current in-run UI actions are allowed by default, including bad or irreversible game decisions and abandon-run. Persistent account/profile/save/Mod/global settings and quit-application actions use explicit menu governance.

## Relationship To Connector V3

Retained infrastructure:

- stable identities and stale rejection;
- one controller;
- idempotent requests and delivery uncertainty;
- exact runtime provenance;
- strict Re and transport boundaries;
- observation and evidence recording.

Not retained as universal authority requirements:

- exact business source for every UI action;
- per-source command authority;
- source-specific business Outcome before successor;
- unknown source automatically meaning no UI input;
- native-page access restricted to an operator-only evidence profile.

The inherited path remains temporarily as a comparison executor. It must not silently become fallback after Human-Equivalent cutover.

## Non-Goals

- reimplement STS2 rules;
- arbitrary engine methods or reflection mutation;
- unbound or long-lived coordinates;
- hidden information exposure;
- protecting Agent strategy inside a run;
- automatically permitting destructive persistent management;
- claiming arbitrary Mod compatibility before evidence.