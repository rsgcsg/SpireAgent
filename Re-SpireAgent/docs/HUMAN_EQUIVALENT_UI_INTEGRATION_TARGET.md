# Human-Equivalent UI Integration Target

Status: design target; Re implementation unchanged at branch creation

## Agent Loop

```text
observe current complete UI
-> reveal/navigate for missing human-reachable information
-> choose a current affordance
-> submit exactly once
-> inspect delivery receipt
-> observe successor
-> update strategy and continue
```

Re owns interpretation of gameplay consequences. The Gateway does not need to declare that an entire business transaction completed before Re receives the next state.

## Prompt Projection

The model projection should include:

- compact current UI tree;
- rendered-frame references when useful;
- current controls and actionability;
- reveal/navigation opportunities;
- recent state diff and transition history;
- delivery uncertainty;
- menu governance restrictions;
- hidden-by-policy and completeness boundaries.

It should not duplicate one business action into source-specific and UI-specific menus.

## Recovery

Re must:

- discard old controls when state/frame changes;
- never blindly replay `unknown_delivery`;
- use new observations to determine what happened;
- recognize settling/animation and wait or reobserve;
- escape loops through navigation, cancel or abandon-run when currently available;
- respect menu governance before persistent management or application exit.

## Strategy Policy

Re may make bad in-run decisions and may abandon a run. Connector safety must not substitute for strategy quality. Evaluation records mistakes without redefining them as transport or authority failures.

## Evidence Boundary

The current Re adapter still consumes Connector V3 semantic commands and business receipts. This target requires new schemas and exact-runtime A/B evidence before cutover.