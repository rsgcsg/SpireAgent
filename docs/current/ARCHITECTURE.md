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

Combat, shop-room/inventory, map, rest-site, event-option, treasure-room,
reward-claim, card-reward, deck-enchant, deck-upgrade, merchant deck-removal,
menu/run-setup, generated-card choice, combat-hand selection and game-over
controls have direct V3 native resolvers in current source. Each
retains source-specific owner, operand, Commit and Outcome contracts while
sharing only bounded mechanics. Remaining selectors temporarily call bounded
Provider native bindings inside the Gateway. Re consumes ordinary combat,
generated-card choice, menu, event, map, game-over, reward/card-reward, shop,
rest, treasure, lifecycle-settling and visible-unsupported
facts and commands directly without V2 semantic validation or capabilities.
Unmigrated selector families, including relic- and reward-originated deck
removal, still read same-runtime V2 facts as a temporary,
non-authorizing projection sidecar. Neither path may supply a V2 action ID to
V3 execution.

Interaction support and instantaneous readiness are orthogonal. A known native
family may be `settling` with zero legal candidates; it remains observed as a
supported family and Re supervises a typed `no_action` state. Only an unknown
or unbound family is visible unsupported. Empty candidates alone never prove
unsupported semantics.

The migration ends when V3 directly owns remaining selector command bindings,
Re consumes every supported family without V2 semantic validation, and the
optional physical-UI evidence profile is implemented separately from semantic
Inspection. The sidecar and V2 production mutation routes are then deleted.

## Non-Goals

- arbitrary UI tree, coordinates, methods or reflection mutation;
- universal selector, transaction or Effect DSL;
- a second STS2 rules engine;
- hidden RNG, true draw order or future outcome exposure;
- strategy, memory or learning inside the Gateway;
- silent v2 fallback.
