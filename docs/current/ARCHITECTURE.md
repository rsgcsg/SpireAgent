# Current Architecture - Human-Equivalent C -> A -> LLM

Authority: [ADR-0008](decisions/ADR-0008-human-equivalent-ui-first-connector.md)

## Canonical Path

```text
Native STS2 UI
-> C HumanSnapshot (player-visible facts + current affordances)
-> A normalization + previous transition context
-> finite opaque model choices
-> LLM selects one choice ID
-> A submits state token + affordance ID
-> C rebuilds and revalidates its local native binding
-> native UI callback
-> delivery receipt + successor
-> A interprets readiness, flow and strategy
```

## Ownership

**STS2** owns rules, RNG, UI state, actionability and effects.

**C/Gateway** owns player-visible UI facts, one current owner, entity/control
identity, current affordance discovery, exact C-local input binding,
single-writer coordination, native delivery and honest uncertainty.

**A/Re** decodes C, creates finite opaque choices, asks the model to select
one, submits once, observes the successor, interprets flow and owns strategy
and recovery. It does not reconstruct native legality or business completion.

**D** may provide optional hints to A on a separate input plane. C contains no
D envelope or mode. D cannot create, remove or authorize an affordance and
cannot execute.

**P** owns deployment, persistent configuration and rollback. REST/MCP are
transports only.

## C Contract

`HumanSnapshot` separates persistent visible facts, current UI Surface facts,
entities, controls, current affordances and explicit coverage gaps. Unknown
control state is omitted rather than invented. `he_pure` and `he_assisted`
consume the same C truth; they are A composition modes.

An action request binds request ID, expected state token, opaque affordance ID
and controller generation. Exact owner, target and native operands never leave
C. C re-observes and validates the local binding immediately before a bounded
native UI callback.

Receipts mean delivery only:

```text
not_applied -> safe refusal; obtain a fresh snapshot
applied     -> input delivered; inspect successor or read again
unknown     -> delivery may have happened; never retry
```

Successor readiness in A is distinct from business settlement. A may wait for
a repeatable decision checkpoint but may not overwrite an applied delivery or
reconstruct the native effect.

## V3 Decomposition

Retained infrastructure: observation policy, runtime identity, owner/entity
registry, bounded native adapters, main-thread execution, controller lease,
Inspection and evidence recording.

Removed from C authority: source labels, SourceContract, transaction phase,
business Outcome, compatibility qualification and per-source permission.
Unknown source cannot suppress an otherwise exact human-operable UI.

HE has its own wire, controller contract, publication and receipt. Re has one
live HE client/executor. Historical V3 protocol and normalization remain
read-only replay/comparison assets. Six checked calls into inherited adapter
implementations remain; no new HE family may add another V3-owned authority
path.

## Current Freeze Gaps

- several native provider/adapter implementations remain V3-owned internally;
- hover/focus/tooltip/scroll and native-page open/read/return are incomplete;
- source-free combat-pile and unknown-source selector paths need exact-runtime
  regression on the final artifact.

These gaps do not justify source authority, business Outcome, arbitrary
reflection, coordinates or a second game engine.

`surface.facts` now uses a positive type switch. Known HE/native UI Surface
families project visible mechanics; source, destination, mutation, Commit and
evidence fields are never copied and unknown shapes receive only an explicit
unprojected marker.
