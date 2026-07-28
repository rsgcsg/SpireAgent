# ADR-0005: Semantic State And Authority Identity Separation

Status: accepted for shadow measurement only
Date: 2026-07-27

## Context

The Preview.66 authoritative `state_id` hashes two different kinds of fact:

1. current game-semantic observation, including the active Surface and shared
   player-visible state;
2. control-plane projections, including the complete permission and persistent
   qualification snapshots.

This is safe but too coarse. An unrelated grant-history or qualification-
ledger change can invalidate every advertised action even when the visible
game state, current input owner, legal operands, and relevant operation grant
are unchanged. Real Re runs contain many fail-closed pre-commit stale-state
refusals. Those refusals are not all caused by this coupling, but the current
identity makes control-history churn impossible to distinguish from game-state
drift.

The opposite shortcut is also unsafe: binding actions only to a visually
similar state would omit the current operation authority and exact grant.

## Decision

Preview.67 adds a required `identity_shadow` to every state. It contains two
non-authorizing candidates:

- `semantic_state_id_candidate` hashes the provider's current semantic
  signature plus shared player-visible state;
- `authority_projection_id_candidate` hashes the active Surface, current
  exact opaque action keys and operations, current matching operation scopes,
  authority handoff, and action-execution admission.

The field explicitly reports:

```text
status = candidate_non_authorizing
current_state_id_role = legacy_authoritative_composite
action_binding_uses_current_state_id = true
authorizing = false
```

The existing `state_id`, action IDs, submit contract, permission decision,
execute-time revalidation, completion logic, and command ledger remain
unchanged. Re strictly decodes and preserves the field in raw evidence but
does not place it in `NormalizedCurrentState` or the model Prompt.

Tests establish that:

- changing a relevant current operation grant changes the authority candidate
  but not the semantic candidate;
- adding an unrelated grant does not change either candidate;
- an authorizing or missing shadow is rejected by the Preview.67 Re decoder.

## Why Shadow First

The semantic candidate inherits every input already embedded in each provider
signature. Those signatures have not yet been audited as a common public
semantic-state contract. The authority candidate also has not been compared
against real control-plane churn, transition windows, and operand replacement
across a long Organic run. Switching action binding now would therefore replace
one conservative identity with an unqualified one.

Qualification history still remains in the current evidence envelope. This
ADR separates candidate identity responsibilities; it does not yet paginate or
remove control-plane evidence from state responses.

## Rejected Alternatives

- **Keep one composite forever:** safe but preserves unrelated stale churn and
  prevents useful attribution.
- **Immediately switch `state_id` to the semantic candidate:** omits current
  authority and has no paired live evidence.
- **Use permission or qualification history as action identity:** audit history
  is not current authority.
- **Build a universal transaction identity DSL:** the observed problem is an
  identity-boundary defect, not evidence that every game interaction shares one
  executable grammar.
- **Send the shadow to the LLM:** governance identity is not strategy input and
  would add Prompt noise without decision value.

## Promotion Gate

No authority migration may occur until a separate change demonstrates on
recorded and fresh Organic slices that:

1. semantic candidate stability tracks visible game-semantic stability;
2. authority candidate changes for every relevant grant/operand/owner change;
3. irrelevant history changes do not invalidate actions;
4. execute-time drift and unknown-outcome behavior remain fail closed;
5. C# and Re dual-read evidence agree; and
6. rollback to the legacy composite identity is immediate.

Passing this gate would authorize a migration design, not automatically
qualify any gameplay operation.

## Preview.70 Measurement

The read-only run audit compared both candidate identities around every stale
refusal in `run-20260728041630-2z58bz`. All 11 changed the semantic candidate;
two also changed authority; none changed only the legacy composite. A second
same-runtime run contained no stale refusal. The selected kind and exact
operands remained published in all 11 cases, but player-visible facts such as
pile counts, hand contents, and Power amounts changed.

This evidence rejects using identity migration as the current stale-rate fix.
It does not prove the candidates are complete. Shadow measurement remains
accepted; authoritative migration remains blocked by the original promotion
gate.
