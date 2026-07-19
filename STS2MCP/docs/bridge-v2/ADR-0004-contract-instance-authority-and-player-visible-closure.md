# ADR-0004: Contract-Instance Authority And Player-Visible Closure

Status: accepted incrementally
Date: 2026-07-19

## Context

Bridge v2 has two independent scaling problems that a larger Surface registry
does not solve.

First, the exact same UI mechanism can participate in different business
transactions. The v0.109 Pael's Tooth flow reuses `NDeckCardSelectScreen` for a
five-card upgrade-and-return transaction. It is not merchant removal, Smith,
or a generic deck-maintenance operation. Surface-kind authority therefore
cannot remain the final qualification unit.

Second, player-visible truth is larger than the default state payload but
smaller than the game object graph. A player can inspect the run deck and
combat piles without committing an action. Re-SpireAgent previously composed
those reads by fetching sidecars and then re-reading state. A real run produced
`stale_state` during that composition even though no game contract was broken.

The preview.46 Orrery purchase exposed a third boundary. The purchase's parent
task remained pending while five linked card rewards owned input. Waiting for
the parent task to finish before acknowledging the linked child deadlocked the
agent, while treating only the relic/gold change as completion would ignore the
transaction continuation.

## Decision

The top-level architecture remains:

```text
exact environment + shared visible state + context + one active surface
  + opaque state-bound actions + independent typed inspection
  + semantic completion + diagnostics
```

It is extended in two orthogonal, non-authorizing directions.

### Player-visible closure

Player-visible information is assigned to one of these typed layers:

1. environment and observation policy;
2. persistent shared state;
3. current context core;
4. active surface core and action operands;
5. linked entity detail;
6. typed, state-bound read-only Inspection;
7. explicitly derived client views.

Each state exposes a `visibility` declaration and an `inspection_catalog`.
The catalog describes information the player may currently inspect; it does
not contain the data and cannot create command authority. A coherent
observation bundle may return one state plus requested typed inspections under
one `state_id`. It fails the whole read on drift.

Player-visible closure is complete only when every decision-relevant fact a
normal player can obtain is either in the default projection, reachable through
a declared linked detail or Inspection, explicitly missing, or explicitly
hidden by policy. It does not mean a raw object dump or one enormous payload.

### Contract-instance authority

The eventual authority unit is an operation on a typed contract instance, not
the Surface discriminator alone. A contract instance must relate:

```text
context profile
+ interaction mechanism
+ semantic contract
+ runtime semantic binding
+ shared validator
+ game-owned commit adapter
+ transaction/outcome witness plan
+ visibility contract
+ exact operation
```

Environment identity and evidence identity are attached to that instance; they
do not replace semantic compatibility analysis.

Preview.47 adds only a `contract_instance_shadow`. It reports the existing
manifest declaration, published operations, current legacy authority tier, and
known limitations. It is always `authorizing=false`. The real action gate
remains exact-environment plus Surface-kind permission. Missing or unresolved
shadow fields must stay readable and must never turn an otherwise confirmed
command into a settlement failure.

The future authority report must keep these facts independent:

```text
observation completeness
semantic-binding basis
execution authority tier
evidence / qualification stage
command outcome
```

No provisional execution is authorized by this ADR or preview.47. Any future
provisional tier requires a separate ADR, negative corpus, shadow comparison,
bounded budget, immediate revocation, and current-environment runtime evidence.

### Evidence provenance

Re-SpireAgent run metadata records declared evidence provenance separately from
the Bridge environment identity. `ordinary_gameplay`, `operator_positioned`,
`console_assisted`, `fixture`, and `unrecorded` are coverage labels, not
qualification grants. Historical records without the field remain readable and
are treated as `unrecorded`.

## Invariants

- Exactly one active Surface may own input.
- Wire actions remain purpose-specific, opaque, state-bound, and bound to
  visible exact entities.
- Publication and execution share business legality; execution adds current
  owner, identity, state, and timing checks.
- Commit is a known game-owned transaction, never a client Effect DSL.
- Completion proves the semantic transaction or reports unknown.
- Inspection is typed, state-bound, read-only, outside the command ledger, and
  never an authority source.
- Unknown critical visibility, ownership, semantic binding, commit, or outcome
  fails closed for execution.
- Environment changes may preserve safe observation, but do not inherit old
  qualification.

## Rejected Alternatives

- **Universal selector/purchase/maintenance Surface:** erases business purpose
  and transaction boundaries.
- **Raw UI tree or low-level click API:** recreates v1 authority and stale-index
  hazards.
- **Executable effect or witness DSL:** turns expected outcomes into mutation
  instructions.
- **Manifest-authorized execution:** declarations and source analysis are
  evidence indexes, not runtime proof.
- **Automatic provisional execution in preview.47:** current contract-instance
  records do not yet prove runtime binding, commit impact, or complete witness.
- **Eager fetch of every Inspection:** increases drift and payload cost without
  improving action safety.
- **Global disable or global inheritance on every build/Modset change:** both
  are too coarse; future compatibility must be assessed per affected contract
  while preserving exact evidence attribution.

## Consequences

Bridge providers may continue to be purpose-specific while repeated internal
mechanics are extracted. The next migration step is shadow comparison of exact
operation/contract instances against the existing Provider result. Authority
may only remain equal or become narrower during that comparison.

The first useful pilot should be a repeated mechanism with multiple proven
semantic transactions, but no pilot may be selected merely because it is easy
to make pass. Pael's Tooth is currently an observation-only contract candidate;
it is evidence against generic deck-selection authority, not evidence for it.

