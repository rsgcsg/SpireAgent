# Re Human-Equivalent Integration

Re strictly accepts `1.0-preview.2`.

The adapter reads `/api/he/observation`, verifies runtime/MVID/SHA/Modset
coherence, and normalizes current C facts and affordances. It projects a finite
choice list whose model-visible kind is the generic UI verb. The model receives
only opaque IDs; exact native operands never leave C.

The live chain is:

```text
C HumanSnapshot
-> A normalization and transition context
-> finite model choices
-> LLM selects one opaque ID
-> A submits state token + affordance ID
-> C revalidates and delivers native UI input
-> delivery receipt + successor
-> A successor readiness and flow interpretation
```

`applied` is adapter-confirmed delivery. `SuccessorWatcher` uses the receipt
successor when present and otherwise reads C until a repeatable decision
checkpoint. A readiness timeout becomes `executed_checkpoint_pending`; it does
not overwrite delivery with a business failure. `not_applied` requires a fresh
snapshot and `unknown` stops without retry.

`SPIREAGENT_HE_MODE=he_pure|he_assisted` is an A composition setting, not a C
mode. Both modes consume the same pure C truth and affordance contract. Pure
uses A+C only. Assisted may add separately supplied D hints when a D provider
exists; this repository currently supplies none by default. D cannot authorize
or execute.

V3 is not a fallback. The old V3 Re client/executor is deleted; retained V3
schema/normalization code exists only for historical replay and comparison.
