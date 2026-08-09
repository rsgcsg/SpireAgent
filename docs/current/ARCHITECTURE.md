# Current Architecture - Human-Equivalent C

Authority: [ADR-0008](decisions/ADR-0008-human-equivalent-ui-first-connector.md)

## Live Path

```text
Native STS2 UI and structured controls
-> HumanSnapshot
-> current UI affordance catalog
-> state/frame/owner-bound native input delivery
-> delivery receipt + successor snapshot
-> REST or thin MCP
-> Re-SpireAgent
```

## Responsibilities

**STS2** owns rules, RNG, UI state, native actions and effects.

**C/Gateway** owns player-visible UI facts, one current UI owner, stable entity
and control identities, current affordance discovery, exact input admission,
single-writer coordination, native delivery and honest delivery uncertainty.

**A/Re** strictly decodes C, projects finite opaque choices, selects one,
submits once, observes the successor, interprets flow and business meaning,
and owns strategy and recovery. It does not reconstruct native legality.

**D** may supply an `OptionalAnnotationEnvelope` in `he_assisted`; its
`authorization_effect` is always `none`. `he_pure` proves A+C works without it.

**REST/MCP** are transports. **P** owns deployment, persistent configuration
and rollback; this migration does not expand it.

## Contracts

`HumanSnapshot` separates persistent visible run facts, mapped current UI
surface/context facts, entities, controls, current affordances and optional D
annotations. Assisted and pure snapshots share the same state token and
affordance authority. “Mapped” is deliberate: hover/scroll and unknown custom
drawn controls are not yet complete and remain explicit coverage gaps.

An action binds request ID, mode, expected state token, frame ID, owner ID,
affordance ID, exact parameters and controller generation. The Gateway
re-observes and checks the current target immediately before calling a bounded
native UI adapter. No action ID, index, coordinate, node path or arbitrary
method is accepted.

Receipts mean input delivery only:

```text
not_applied  -> safe refusal; obtain a fresh snapshot
applied      -> input delivered; use included successor or read a fresh one
unknown      -> delivery may have happened; never retry
```

An immediate successor read failure does not relabel known delivery as
`unknown`; delivery and observation remain separate facts.

## V3 Decomposition

Retained: observation policy, identity, owner/entity registry, native adapters,
main-thread execution, single-controller lease, Inspection facts and evidence.

Moved out of C authority: source labels, SourceContract explanations,
transaction phase, expected business transition, business Outcome grader,
compatibility/qualification analysis. They belong to optional D/P evidence.

Closed for HE: unknown-source action suppression, source permission as the
default gate, business Outcome blocking successor, Re source whitelists and
silent V3 executor fallback.

## Current Limits

Structured UI coverage reuses bounded native adapters already proven in V3,
but HE supplies its own wire, controller contract, publication and delivery
receipt. Source-free adapters cover native one-of-N card choices and the shared
deck-card selector lifecycle. Complete generic structured-tree discovery,
hover/focus/tooltip/scroll and bounded visual fallback remain pending; unmapped
visible UI is explicit rather than guessed.
