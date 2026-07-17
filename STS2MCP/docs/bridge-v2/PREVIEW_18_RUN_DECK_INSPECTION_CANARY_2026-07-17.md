# Preview.18 Run-Deck Inspection Canary

Status date: 2026-07-17  
Protocol: `2.0-preview.18`

## Purpose

Preview.17 proved only the non-destructive merchant-removal cancel lifecycle.
It correctly did not treat command completion as proof of deck mutation. A
destructive removal needs a separately player-visible post-state witness.

Preview.18 therefore adds one read-only, state-bound inspection canary to the
same exact v0.109 identity:

```text
action scope:     deck_removal_selection
inspection scope: run_deck
disabled:         combat_piles and every other inspection/surface
```

This is not a build-wide inspection approval. `run_deck` is independently
scoped because it represents the deck a player can open through
`NDeckViewScreen`; it supplies no legal action and never enters the command
ledger.

## Static Basis

The bridge was rebuilt against the installed
`v0.109.0|c12f634d|-840572606` `sts2.dll`. The existing source bindings for
`RunManager.DebugOnlyGetState`, local-player resolution, `Player.Deck.Cards`,
and card projection compile against that exact assembly. This proves only that
the referenced symbols still bind at compile time. A fresh runtime read remains
required before it can witness a destructive action.

## Contract

- Capabilities use `action_and_inspection_canary_candidate`.
- `action_execution_surface_kinds` is exactly `deck_removal_selection`.
- `inspection_allowed_kinds` is exactly `run_deck`.
- `combat_piles` is neither advertised nor accepted.
- The Re client retains inspection content in `bridgeInspectionFacts.runDeck`.
  It does not invent a full `PlayerSnapshot` in shop/rest contexts.
- v1 sidecar merging remains disabled for the entire candidate build.

## Observed Evidence

The required sequence completed once on an ordinary merchant removal screen:

1. `run_deck` was read with the current expected state ID and returned 11
   visible per-instance cards with no command authority.
2. The selected unupgraded Strike instance was present in that exact deck.
3. The opaque selection action completed and the actual v0.109 screen advanced
   directly to `preview`; no separately published `preview_deck_removal` action
   appeared in this observed shape.
4. A same-state preview inspection still contained all 11 cards, including the
   selected instance.
5. The opaque confirmation action completed. The settled shop context exposed
   no stale child actions. Its same-state `run_deck` inspection contained 10
   cards and no longer contained the selected instance.

This establishes only the exact observed ordinary merchant-removal lifecycle.
It does not qualify all merchant variants, rest Smith, transformations,
enchantments, generic card selection, or any other v0.109 surface. A second
independent ordinary merchant journey remains the resilience follow-up.

## Required Evidence Sequence

1. On a fresh ordinary shop state, capture v2 state and read `run_deck` using
   the same `expected_state_id`; verify exact identity, count/card consistency,
   player-visible policy, and no command-ledger entry.
2. Re-read state. Any drift rejects the composite observation.
3. Only after that read is clean may a new merchant selection journey perform
   select -> preview -> confirm. In the observed v0.109 shape, selection itself
   transitioned directly to preview; legal actions, not declared operations,
   remain authoritative. Capture the same deck inspection immediately before
   and after; the selected visible instance must disappear and no stale
   merchant-removal action may survive.

## Stop And Rollback

Stop on an unavailable/binding/stale/identity/policy failure, unexpected card
content, or any non-`run_deck` inspection exposure. Roll back to preview.17's
no-inspection action canary (or preview.16 observation-only gate) by removing
the v0.109 inspection scope and rebuilding/restarting. No model-driven action,
stable agent state, or broad v0.109 qualification is authorized.
