# Human-Equivalent C Implementation And Cutover Audit

Date: 2026-08-04

Evidence scope: source and local tests/build only until a matching artifact is
cold-loaded and exercised.

## Architecture Verdict

The macro UI-first decision is retained. The inherited V3 implementation was
valuable infrastructure but the wrong universal authority model for an Agent
using the real UI. It made exact business source, operation permission and
business Outcome prerequisites for operating controls a human could already
see and use. Royal Stamp and other source gaps were therefore architecture
failures, not merely missing whitelist entries.

The adopted decomposition is:

```text
C = current player-visible UI facts + current owner + exact affordances
    + native input delivery + successor
A = flow interpretation + strategy + recovery
D = optional non-authorizing labels/explanations/evaluation
P = deployment, persistent policy and rollback
```

## One LLM Decision

C supplies persistent visible run facts, current surface/context facts,
entities/controls, enabled/selected state and a finite list such as:

```json
{
  "affordance_id": "affordance_...",
  "action": "select",
  "target_id": "card_...",
  "owner_id": "screen_...",
  "label": "Choose Visible Card"
}
```

Re converts this to one local opaque choice ID. The LLM sees the normalized
Human UI and optional D block, chooses one ID, and Re submits the exact hidden
state/frame/owner/parameter binding. C returns `applied`, `not_applied` or
`unknown` plus successor. A, not C, decides what the successor means.

## V3 Disposition

Retain:

- exact artifact/runtime identity and observation policy;
- current owner and stable entity registry;
- bounded native UI providers/adapters and main-thread dispatch;
- controller lease, stale checks and read-only Inspection facts;
- Re recording and unknown-no-retry supervision.

Move to optional D/P evidence:

- source labels and transaction purpose;
- SourceContract explanation and Patch compatibility analysis;
- business Outcome graders, qualification and long-lived evidence.

Close on HE authority path:

- source-specific permission and qualification gates;
- unknown source causing no current UI action;
- business witness blocking successor;
- Re source whitelist and V2 semantic validators;
- automatic migration/trial preflight and hidden V3 executor fallback.

## Implemented Evidence

- Gateway compiles with HE contracts/runtime/transport;
- source-free native one-of-N card choice binds only current screen, visible
  holders and enabled native controls;
- other supported UI reuses exact native adapters under HE admission;
- Re strictly decodes HE, supports assisted/pure and projects generic choices;
- root CLI verifies HE source/build/install/load identity and no longer requires
  V2 permission/qualification;
- targeted tests cover pure separation, unknown source, exact operands,
  delivery uncertainty and direct Re projection.

## Honest Limits

The current structured observation is not yet every human-reachable fact.
Hover/focus/tooltip/scroll and normal-flow native page transitions remain.
Only native one-of-N choice has an explicit source-free discovery adapter;
other wholly unknown structured selector types may still be visible
unsupported. No visual custom-UI fallback exists.

This cutover therefore establishes a real HE core, not full Human parity or
arbitrary Mod compatibility. The next valid evidence is a cold-loaded ordinary
journey and unknown-source selector, not durable qualification.
