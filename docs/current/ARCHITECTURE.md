# Current Architecture - Human Environment Interface

Authority: [ADR-0008](decisions/ADR-0008-human-equivalent-ui-first-connector.md)

## Canonical Model

```text
Live STS2 Host                 future fair-player Headless Host
 native UI observation             engine decision observation
 native UI input delivery          engine-native decision delivery
           \                              /
            C Human Environment semantic core
            capabilities / observe / read / interact / receipt
                              |
        +---------------------+----------------------+
        |                     |                      |
  Re LLM projection    future Training adapter   future Search adapter
        A                 tensors/reward/mask       tree/policy state
```

The semantic core is unified; Host mechanics and privileged Host controls are
not. A second Host should implement the same meaning, not fake Live UI nodes or
copy .NET-specific provenance. Preview.4 is therefore a conformance candidate,
not a frozen universal 1.0 wire.

## Public Contract

```text
Capabilities
  host + game + modset + environment identity + supported verbs

Observation
  snapshot_id + session
  persistent visible summary
  interaction { id, kind, stage, prompt, schema, content }
  referents[] { id, role, kind, visible/actionable/selected/focused, properties }
  affordances[] { id, verb, interaction_id, subject_ref, arguments[] }
  reads[] + completeness + observation policy

Action
  request_id + expected_snapshot_id + affordance_id + controller lease

Receipt
  applied | not_applied | unknown
  exact public action summary + optional immediate successor
```

Facts produce referents before authority is projected. An affordance references
one optional subject and zero or more role-labelled current referents. Exact
native objects and operands never cross the public boundary. `applied` means
input delivery, not business completion; `unknown` is terminal for automatic
retry.

## Ownership

- **Game/Host** owns rules, RNG, native state, legality and effects.
- **C** owns fair-player facts, information reachability, current interaction,
  affordances, state binding, delivery integrity and receipts.
- **A/Re** owns normalization, model projection, finite choice resolution,
  strategy, flow interpretation, readiness and recovery.
- **D** owns optional annotations, graders, replay evaluation and conformance
  evidence; it never authorizes or executes.
- **P** owns build/install/configuration/runtime identity, controller policy,
  rollback and experiment orchestration.
- **Headless lifecycle/branching/scenario/acceleration ports** own reset, seed,
  save/load, clone/fork, scenario mutation and fast stepping.
- **Training** owns tensors, masks, reward, termination/truncation and batching.
- **Search** owns tree state, branching policy and value evaluation.

## Normal Live Path

```text
C observe
-> Re strict decode and consumer projection
-> model sees facts plus finite opaque choices
-> LLM selects one local ID
-> Re submits the exact advertised affordance
-> C rebuilds interaction/referents/actionability
-> Host delivers native input
-> receipt + successor
-> A interprets progress
```

## Exclusions And Internal Debt

C is not an LLM API, reward API, business transaction API, privileged simulator
API or second game engine. It exposes no hidden state, arbitrary reflection,
coordinates, SourceContract, source authority or business Outcome authority.

The Live Host currently reuses Bridge observation providers and five bounded
V3 adapter-library seams. This is one-way implementation reuse. It must not
leak into public DTOs, Headless requirements or a second authority/executor.
Move code to neutral `NativeUi` ownership only when the implementation itself
can move; do not add wrappers that merely hide the dependency.
