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

V3 Inspection is a separate `inspection-1` read contract keyed by the exact
current `state_token`. It reuses only the Gateway's player-visible read
mechanics, never creates a command, never enters the Command Ledger and never
grants action authority. A stale token or a kind outside the current catalog
fails closed. Physical UI opening remains a future evidence profile and must
not be smuggled into this semantic read path.

## Current Migration Boundary

All currently cataloged combat, room, menu, reward and selector families have
typed direct V3 discovery/execution and direct Re consumption. Each retains
source-specific owner, operand, Commit and Outcome contracts while sharing
only bounded mechanics. The operation catalog contains 94 explicit contracts
and zero fallback authority. Connector V3 does not consume Provider
`draft.Actions` or legacy bindings, and Re does not request V2 capabilities or
state. Historically named Provider files may retain exact game-binding and
native Commit helpers inside the Gateway; they are neither external authority
nor a second executor.

Interaction support and instantaneous readiness are orthogonal. A known native
family may be `settling` with zero legal candidates; it remains observed as a
supported family and Re supervises a typed `no_action` state. Only an unknown
or unbound family is visible unsupported. Empty candidates alone never prove
unsupported semantics.

Source migration is closed. Runtime closure now requires a cold-loaded exact
Preview.9 artifact, final selector/potion canaries, a same-artifact journey and
tested revoke/rollback. The optional physical-UI evidence profile remains
separate from semantic Inspection. V2 endpoints are diagnostics/rollback only
and cannot regain Re or mutation authority.

## Non-Goals

- arbitrary UI tree, coordinates, methods or reflection mutation;
- universal selector, transaction or Effect DSL;
- a second STS2 rules engine;
- hidden RNG, true draw order or future outcome exposure;
- strategy, memory or learning inside the Gateway;
- silent v2 fallback.
