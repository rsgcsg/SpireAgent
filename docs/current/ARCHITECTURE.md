# SpireAgent Architecture

```text
real STS2
-> versioned STS2 Connector release
-> Player Environment Snapshot / Read / BoundAction / Receipt
-> @rsgcsg/sts2-connector-client
-> Re thin adapter and normalized Agent state
-> finite model choices
-> provider decision
-> exact bound-action submit and successor supervision
-> run recording and evaluation
```

## Ownership

`STS2-Connector` owns fair-player observation, one current input owner, native
operands, finite complete BoundActions, execute-time revalidation, native input
delivery, controller coordination, idempotency, strict wire schemas and
strategy-free client utilities.

`Re-SpireAgent` owns the consumer projection: normalized state, prompt input,
provider integration, selection of one advertised action, progress/cycle
supervision and run recording. It cannot create legality, infer hidden facts,
replace native operands or retry unknown delivery.

An ambiguous submit transport response is resolved only by reading the
Connector's idempotent ledger for the same request ID. Re never re-submits that
request or creates a replacement action attempt.

Evaluation reads recorded runs. It never grants live authority. Product tooling
may resolve compatible releases, but compatibility metadata cannot replace the
loaded runtime's state and controller checks.

## Consumer Boundary

Re's connector-specific production modules are deliberately small:

1. `integrations/sts2Connector/playerEnvironmentAdapter.ts` negotiates the
   package contract, imports current BoundActions and submits one handle.
2. `integrations/sts2Connector/rawState.ts` wraps untrusted transport JSON for
   the normalizer.
3. `integrations/sts2Connector/playerCombatPresentation.ts` validates the
   combat context needed by Re's domain projection.

Wire validators, REST, controller sessions, visible-state schemas and coherent
Read aggregation must not be copied into this repository.

See [ADR-0010](decisions/ADR-0010-standalone-connector-dependency.md).
