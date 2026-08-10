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
  interaction { id, kind, stage, prompt, schema, content, capabilities[] }
  referents[] { id, role, kind, visible/enabled/selected/focused, properties }
  reads[] + completeness + observation policy
  bound_actions { complete|truncated|unavailable, counts, actions[] }

Action
  request_id + expected_snapshot_id + bound_action_id + controller lease

Receipt
  applied | not_applied | unknown
  exact public action summary + optional immediate successor
```

Facts produce referents before any consumer projection. Interaction
capabilities describe current strategy-free verbs and participant roles. A
finite bound action references one optional subject and zero or more
role-labelled current referents. Exact native objects and operands never cross
the public boundary. A truncated finite projection is observable but cannot
authorize Re. `applied` means input delivery, not business completion;
`unknown` is terminal for automatic retry.

## Ownership

- **Game/Host** owns rules, RNG, native state, legality and effects.
- **C** owns fair-player facts, information reachability, current interaction,
  strategy-free capabilities, the unique native binding/execution authority,
  state binding, delivery integrity and receipts.
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
C observe canonical frame plus complete bound-action projection
-> Re strict decode and finite consumer projection
-> model sees facts plus finite opaque choices
-> LLM selects one local ID
-> Re submits the exact advertised bound action
-> C rebuilds interaction/referents/native binding authority
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

## Projection Boundary

The canonical frame is independently meaningful when no finite action menu is
requested. `interaction.capabilities` is HE truth about the current interaction
grammar. `bound_actions` is the current Re projection and a C-issued execution
handle catalog; it is not the referent ontology. A future typed-intent, RL mask
or Search-edge projection may coexist only if it resolves to the same C-local
binding table and executor. No projection may create legality.

Live and Headless unify these fair-player meanings, not exact wire provenance
or privileged lifecycle. Headless reset/seed/clone/fork/fast-step remain
separate Host ports. Training reward/termination and Search branching/value
remain consumer-owned.

A consumer that cannot issue lazy reads may eagerly aggregate selected
advertised reads for one snapshot before encoding tensors or search state. The
aggregation validates snapshot/runtime/environment coherence and stays outside
C; it cannot change referents, capabilities, bound actions or legality.
