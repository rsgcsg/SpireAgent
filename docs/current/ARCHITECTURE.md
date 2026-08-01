# Current Architecture

Authority: [ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md)

## Live Path

```text
Native STS2
-> Observation Engine
-> Interaction Engine
-> Native Command Catalog
-> Authority Policy
-> Action Runtime
-> Receipt and successor observation
-> Re-SpireAgent
```

STS2 owns rules, RNG, Tasks, Commands and side effects. The Gateway owns
player-visible facts, the current input owner, command admission,
execute-time native validation, native Commit invocation and action-local
Outcome. Re selects only from commands projected from the current interaction.

## Contracts

Observation and execution support are separate. A visible unsupported
interaction is still represented. The Agent submits:

```text
request_id
state_token
interaction_id
command
exact entity operands
controller lease
```

The Gateway resolves those exact objects again at execution time. A receipt is
`completed`, `not_executed`, `pending` or `unknown`; unknown mutation is never
retried.

## Side Plane

Exact game, Gateway SHA/MVID/runtime, Modset and Patch identity constrain
authority. Session trial, quarantine, persistent qualification, revoke and
rollback are evidence and control concerns. D tooling may recommend but never
grant live authority.

## Consumer Boundary

Re owns normalization, bounded model projection, model choice, command polling,
successor readiness and evidence recording. It does not reconstruct native
legality or completion. MCP and REST are transports only.

Player-visible information is projected in four bounded layers: persistent
HUD summary, the complete current Surface, state-bound linked detail, and
state-bound read-only Inspection. Information availability and mutation
authority are orthogonal. The efficient semantic-accessibility profile is the
mainline A default; physically opening every inspectable UI page is an optional
human-equivalence evidence mode, not a default mutation requirement.

## Current Migration Boundary

Combat, shop-room/inventory, map, rest-site, event-option, treasure-room,
reward-claim, card-reward, deck-enchant, menu/run-setup and generated-card
choice controls have direct V3 native resolvers in current source. Each retains
source-specific owner, operand, Commit and Outcome contracts while sharing
only bounded mechanics. Remaining selectors temporarily call bounded Provider
native bindings inside the Gateway. Re consumes menu facts and commands
directly without V2 semantic validation or capabilities; other families still
read the same-runtime v2 capabilities as a non-authorizing semantic projection
sidecar. Neither path may supply a V2 action ID to V3 execution.

The migration ends when V3 directly owns ordinary non-combat command bindings,
Re consumes V3 facts/candidates without V2 semantic validation, and V3 owns
player-visible detail contracts. The sidecar and v2 production mutation routes
are then deleted.

## Non-Goals

- arbitrary UI tree, coordinates, methods or reflection mutation;
- universal selector, transaction or Effect DSL;
- a second STS2 rules engine;
- hidden RNG, true draw order or future outcome exposure;
- strategy, memory or learning inside the Gateway;
- silent v2 fallback.
