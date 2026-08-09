# Current Architecture - Human Environment Contract

Authority: [ADR-0008](decisions/ADR-0008-human-equivalent-ui-first-connector.md)

## Canonical Boundary

```text
STS2 Live UI host (today)       future fair-player Headless host
             \                  /
              C Human Environment Contract
              observe / read / act / receipt
                         |
        +----------------+----------------+
        |                |                |
   Re LLM adapter   future Training   future Search
        |             adapter           adapter
        A                A                A
```

C is current player-visible facts, current owner, current elements and
affordances, state-bound read opportunities, exact input delivery and an
immediate successor. It is independent of the intelligence consuming it.

## Normal Live Path

```text
C observe snapshot
-> Re validates and normalizes Surface/elements/reads
-> Re projects finite opaque choices
-> LLM selects one local choice ID
-> Re submits request_id + snapshot_id + affordance_id
-> C rebuilds owner/target/actionability
-> native UI input
-> delivery receipt + optional immediate successor
-> A interprets readiness, flow and strategy
```

`applied` proves delivery, not a business transaction. `not_applied` is a
known refusal. `unknown` means delivery may have occurred and is terminal for
automatic retry.

## Ownership

- **C**: fair-player observation, elements, affordances, reads, stale checks,
  one controller, exact host-local operands, execute-time validation, native
  delivery, idempotency and delivery uncertainty.
- **A/Re**: consumer normalization, finite choice projection, LLM/search/ML
  policy, transition interpretation, strategy and recovery.
- **D**: optional annotations, teachers, graders, rewards, replay evaluation
  and conformance evidence. D never authorizes or executes.
- **P**: build/install/configuration/runtime identity/rollback and experiment
  orchestration.
- **Headless/Simulation Host**: reset, seed, clone, fork, fast stepping and
  host lifecycle. It must emit the same fair-player C semantics.
- **Training Adapter**: tensors, action masks, reward, terminated/truncated,
  vectorization and batching.

## Public Contract

Capabilities carry host/game/Modset identity, an exact environment fingerprint
and optional implementation provenance. The hot observation carries only a
session reference plus:

```text
snapshot_id + owner + persistent + versioned Surface content
+ elements + affordances + reads + completeness + observation policy
```

Every affordance and targeted read references a current element. Exact native
objects and parameters never cross the wire. Persistent, Surface,
element-property and read content is explicitly schema-versioned; unknown
schemas fail strict consumers rather than silently changing meaning.

## Internal Reuse And Limits

The Live implementation still uses Bridge observation providers and five
V3-owned bounded adapter-library calls. These are one-way host implementation
reuse, not C authority or public types. New hosts must implement C directly;
they do not inherit V3 source permission, SourceContract, qualification or
business Outcome.

Do not add reward/reset/clone, arbitrary reflection, coordinates, hidden game
state, source authority or a second rule engine to C. Move reusable native UI
code toward neutral `NativeUi` ownership as touched, without adding shims or a
second executor.
