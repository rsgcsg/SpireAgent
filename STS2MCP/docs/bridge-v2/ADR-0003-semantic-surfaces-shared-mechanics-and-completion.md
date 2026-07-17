# ADR-0003: Semantic Surfaces, Shared Mechanics, And Semantic Completion

Status: accepted
Date: 2026-07-17

## Context

Bridge v2 has repeated evidence that similar controls do not imply the same
game operation. Deck enchantment and merchant card removal both expose a
bounded card grid with selecting and preview stages, but exact game source gives
them different eligibility, commit paths, effects, and completion conditions.
Combat likewise proves that one active Surface may publish several action
families without becoming several input owners.

The exact v0.109 merchant-removal source exposed a concrete completion defect.
`NDeckCardSelectScreen` closes before `DoMerchantCardRemoval` finishes gold
loss, deck mutation, removal-count increment, and merchant-service consumption.
The original `confirm_deck_removal` predicate therefore proved only an
intermediate UI transition. A later `run_deck` inspection proved that the first
organic removal did commit, but did not make the old command predicate sound.

## Decision

Bridge v2 retains this authoritative state model:

```text
exact environment identity
  + semantic Context
  + exactly one active semantic Surface
  + state-bound opaque actions from that Surface only
  + independent state-bound read-only Inspection
  + diagnostics and action-specific completion evidence
```

The following composition rules apply:

- Surface means the current input-owning semantic protocol, not one panel, one
  button, one action family, or one reused Godot base class.
- Stage remains inside its Surface. Selecting and preview are stages when the
  input owner and semantic operation remain the same.
- Shared mechanics are non-authoritative implementation components. The first
  accepted component reads bounded selection constraints and selected-card
  membership. It cannot decide purpose, eligibility, legal actions, commit
  effects, transitions, or completion.
- Semantic actions remain purpose-specific even when the mechanical gesture is
  shared. Clients still execute only opaque `action_id` values.
- Completion is a direct postcondition of the semantic action. A screen closing
  may be sufficient for navigation or cancellation, but not for an asynchronous
  commit whose game-owned effects happen afterward.
- Observed pre/post states and command events remain transition evidence. The
  protocol does not predeclare a universal deterministic transition graph:
  exact v0.109 evidence already shows that one selection can automatically open
  preview while another shape may publish an explicit preview action.
- A cross-Surface Flow object is deferred. It may be introduced only when
  repeated journeys require durable transaction identity that direct semantic
  postconditions cannot prove.

Re-SpireAgent may share structural validation for bounded selection facts, but
keeps surface-specific discriminated unions, action allowlists, guides, and
compatibility checks. Shared validation never grants action authority.

## Merchant-Removal Completion

For the exact no-gameplay-mod v0.109 candidate, confirmation remains pending
while the selector closes. It reaches `completed/confirmed` only when all of the
following source-backed facts agree:

- the selector is no longer active;
- the exact selected card instance is absent from the run deck;
- deck count decreased by one;
- gold decreased by the captured removal price;
- `CardShopRemovalsUsed` increased by one;
- the exact merchant removal entry is marked used.

Intermediate state identities are expected while these effects settle. Missing
or contradictory evidence leads to timeout/unknown, never inferred success.

## Rejected Alternatives

- **Universal card-selection Surface:** erases purpose, identity, eligibility,
  and completion differences.
- **Context + generic mechanism matrix:** adds a compatibility matrix before
  repeated evidence shows it is needed.
- **Universal Effect DSL:** duplicates game logic and encourages clients to
  treat predictions as completion facts.
- **Recursive executable Surface stack:** mixes suspended and active authority.
- **One panel equals one Surface:** couples the protocol to visual scene layout.
- **Fixed wire transition graph now:** would misrepresent source-dependent
  automatic preview and replacement transitions.

## Consequences

- Wire protocol remains `2.0-preview.18`; this is an execution-witness
  hardening, not a DTO change.
- Existing action IDs and Re execution behavior do not change.
- The strengthened merchant-removal witness needs a second independent organic
  journey before the current-build canary can be promoted.
- Enchantment confirmation still uses screen closure and remains a separate
  completion-debt audit; its historical post-state inspection is evidence, not
  permission to copy merchant-removal rules.
- Future shared mechanics must remain small, typed, non-authoritative, and
  justified by at least two exact interactions.

