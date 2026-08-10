# Re Human Environment Integration

Re strictly accepts `1.0-preview.4`.

The adapter reads `/api/he/observation`, verifies exact runtime/environment
coherence, and normalizes persistent facts, one interaction, referents,
affordances and read opportunities. It projects finite choices from public
subject/argument referents; exact native operands never leave C.

```text
C observation
-> A strict decode and consumer projection
-> finite model choices
-> LLM selects one opaque ID
-> A submits snapshot ID + affordance ID
-> C revalidates and delivers
-> delivery receipt + successor
-> A interprets readiness and progress
```

Preview.4 projects complete visible combat enemy/status/intent context rather
than replacing it with placeholders. A targeted action includes a `subject`
binding and role-labelled argument bindings, so equal UI verbs against distinct
targets remain distinguishable to the model.

`applied` is delivery-authoritative. Successor readiness remains A's concern.
`not_applied` requires a fresh snapshot; `unknown` stops without retry.

`SPIREAGENT_HE_MODE=he_pure|he_assisted` is an A composition setting. Both use
the same pure C contract. Assisted may add separately supplied D annotations;
D cannot add, remove or authorize an affordance.

V3 is not a fallback. Retained V3 protocol/normalization is historical replay
support only. The normal client also exposes the unified, advertised
`/api/he/reads/{read_id}` path for state-bound information retrieval.
