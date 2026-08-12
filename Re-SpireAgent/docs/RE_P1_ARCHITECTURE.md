# Re-SpireAgent Current Architecture

Re is one Player Environment consumer, not part of C authority.

```text
Player Environment Snapshot
-> strict wire decode
-> normalized strategy state
-> finite current choice projection
-> prompt and strict model decision
-> stale-safe BoundAction submission
-> Receipt and successor supervision
-> append-only local decision record
```

C owns visible facts, advertised Reads, exact native operands, binding and
delivery. Re owns model formatting, strategy, local choice resolution, progress
supervision and recording. Re never invents an action, target, legality
predicate, game effect or native completion.

The current surface domain carries tagged interaction content, visible
referents, Read opportunities and complete BoundActions. A truncated or
malformed projection creates no executable choice.

`delivered` proves native input delivery. Re observes a stable successor
without predicting STS2 effects. `not_delivered` invalidates the old choice;
`unknown`, transport uncertainty or receipt mismatch stops without retry.

`src/index.ts` exports the Player Environment adapter, protocol, normalizer and
consumer helpers. No learning write, local action scorer, JSON repair, arbitrary
tool call or legacy connector fallback belongs in the current runtime.
