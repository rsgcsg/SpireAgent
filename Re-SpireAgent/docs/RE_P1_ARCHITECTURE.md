# Re-SpireAgent Current Architecture

Re is one Human Environment consumer, not part of C authority.

```text
HE observation
-> strict wire decode
-> normalized strategy state
-> finite current choice projection
-> prompt and strict model decision
-> stale-safe advertised action execution
-> receipt and successor supervision
-> append-only local decision record
```

## Ownership

- C owns visible facts, reads, exact native operands, legality and delivery.
- Re owns model formatting, strategy, local choice validation, progress
  supervision and decision recording.
- Re never invents an action, target, legality predicate, effect or completion.

## State And Actions

The normalizer consumes only `HumanEnvironmentRawState`. The current surface is
`human_ui` and carries tagged interaction content, visible referents, read
opportunities and complete bound actions. The action builder imports those
opaque handles deterministically. A truncated or malformed projection produces
no execution authority.

## Settlement

`applied` proves native input delivery. Re observes a stable successor without
predicting STS2 effects. `not_applied` invalidates the old choice; `unknown`,
transport uncertainty or receipt mismatch stops without retry. Repeated exact
or semantic transitions and repeated non-actionable observations are bounded
liveness guards, not game rules.

## Reads

Interactive consumers may fetch advertised reads lazily. A memoryless consumer
may aggregate selected reads for one coherent snapshot. Read aggregation stays
outside C and cannot create facts or actions.

## Public API

`src/index.ts` exports the current HE adapter, protocol, normalizer and consumer
helpers. Internal paths are not compatibility guarantees.

## Exclusions

No learning writes, local action scoring, JSON repair, arbitrary tool calls,
legacy connector fallback or automatic retry after unknown delivery belongs in
the current runtime.
