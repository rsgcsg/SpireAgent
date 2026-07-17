# ADR-0002: Preserve Card-Selection Surface Boundaries

Status: accepted for `2.0-preview.9`  
Date: 2026-07-17

## Context

Slay the Spire 2 has several blocking interactions that all render cards but do
not share one player-input protocol:

- selecting from a combat draw/discard/exhaust pile;
- selecting exact card instances from the current hand;
- choosing one temporary card produced by an in-combat generator;
- choosing a persistent card reward;
- selecting cards from the run deck for upgrade/remove/transform/enchant flows.

Legacy v1 represents several of these as broad `card_select` or `hand_select`
shapes. Organic evidence showed why that is insufficient. A Skill Potion
opened `NChooseACardSelectionScreen` with temporary generated cards and a
350 ms input guard, while Headbutt opened a pile grid whose single selection
could auto-complete. A rest-site upgrade used a run-deck selector with a
separate confirm lifecycle. The objects and completion proofs are not
interchangeable.

## Decision

Bridge v2 keeps specific wire surfaces:

- `combat_pile_card_selection`
- `combat_hand_card_selection`
- `generated_card_choice`
- `card_reward_selection`
- `deck_enchant_selection`

Future run-deck selection work must earn its own specific contract before any
shared wire abstraction is introduced.

All selectors may reuse internal laws where evidence supports them:

- player-visible card serialization;
- opaque state-bound action IDs;
- visible entity bindings;
- execute-time identity/clickability revalidation;
- topmost-surface ownership;
- fail-closed missing bindings;
- action-specific completion.

They must not share a generic executable action union merely because they show
cards. Surface identity follows input ownership, action grammar, readiness,
and completion lifecycle, not UI class names or payload convenience.

## Consequences

- Re-SpireAgent can give the model precise semantics without exposing Godot
  nodes, indices, or generated-card internals.
- Suspended combat-turn actions never leak through a selector overlay.
- New selector variants require explicit fixtures and organic qualification.
- Some serialization code remains repetitive until multiple contracts prove a
  stable internal abstraction; this is preferred to premature wire coupling.
- The old v1 `card_selection` remains compatibility-only and must not be cited
  as proof that the corresponding v2 Surface is qualified.

## Rejected Alternative

A universal `card_selection` Surface was rejected. It would erase persistent
versus temporary card identity, pile/hand/run-deck ownership, opening guards,
selection constraints, preview semantics, and completion evidence.
