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

## Current Migration Boundary

Combat has direct V3 native resolvers. Non-combat families temporarily call
bounded Provider native bindings inside the Gateway. Re temporarily reads the
same-runtime v2 capabilities as a non-authorizing semantic projection sidecar.
Neither path may supply a V2 action ID to V3 execution.

The migration ends when V3 directly owns non-combat command bindings and
player-visible detail contracts, after which the sidecar and v2 production
mutation routes are deleted.

## Non-Goals

- arbitrary UI tree, coordinates, methods or reflection mutation;
- universal selector, transaction or Effect DSL;
- a second STS2 rules engine;
- hidden RNG, true draw order or future outcome exposure;
- strategy, memory or learning inside the Gateway;
- silent v2 fallback.
