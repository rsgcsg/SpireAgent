# Headless STS2 Target Architecture

Status: proposed future Host; no current implementation or authority.

## Shared Contract

```text
Live Host --------> Player Environment semantics ----> consumer projections
Future Headless --> Player Environment semantics ----> consumer projections

Headless lifecycle/branching/scenario/acceleration APIs remain separate.
```

Hosts may share public Snapshot, Read, Interaction, Referent, BoundAction,
Receipt, stale/idempotency and hidden-information semantics. They do not share
native object bindings, lifecycle pumps, patch/stub manifests, controller
instances or evidence.

Exact operands remain private to each Host. A Headless Host must call real
game-owned rules/effects rather than implement an Effect DSL or second rules
engine. It need not fabricate Godot nodes or a .NET MVID when its own exact
implementation identity is available.

## Orthogonal APIs

| Capability | Owner |
|---|---|
| fair-player observe/read/interact | Player Environment implementation |
| start/reset/save/load | Headless lifecycle Host API |
| clone/fork/restore | Headless branching API |
| seed/scenario mutation | privileged scenario-control API |
| fast-step/vectorization | acceleration/training adapter |
| tensor/action mask/reward | consumer Training adapter |
| search tree and policy | Search consumer |

None of these privileged controls may appear as player BoundActions.

## Admission After C1

Before implementation, select one Host approach, document proprietary-file
handling, prove an identity-only bootstrap, and define structural conformance
fixtures against the frozen Player Environment contract. The first executable
slice must preserve player-visible policy, stable referent identity,
execute-time native revalidation, idempotency and unknown-no-retry.

`wuhao21/sts2-cli` remains a useful external implementation reference, not
SpireAgent runtime evidence or an adopted architecture. Its synthetic runtime
and privileged controls require separate validation and licensing review.
