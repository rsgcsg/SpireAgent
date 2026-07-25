# Preview.41 Combat Piles Inspection Canary

Date: 2026-07-18  
Protocol: `2.0-preview.41`

## Decision

`combat_piles` is a current-build read-only canary for exact identity
`v0.109.0|c12f634d|-840572606` and the exact Bridge-only Modset. It is not an
action Surface, never enters the command ledger, and grants no authority to
`combat_pile_card_selection`.

The top-level architecture remains:

```text
Shared State + Context + one Active Surface + Stage + Authority
  + independent state-bound Inspection
  + semantic command completion
```

This slice selects abstraction **B**: retain the independent Inspection and
reuse only existing card/entity projection mechanics. No universal selector,
pile action, or executable effect model was introduced.

## Exact Source And Visibility Audit

- `NDrawPileButton`, `NDiscardPileButton`, and `NExhaustPileButton` are the
  player's normal entry points into the corresponding combat piles.
- `NCardPileScreen` presents the selected pile as a visible card grid and uses
  pile card descriptions.
- `PlayerCombatState` is the authoritative current local-player source for the
  three piles while the Bridge context is `combat`.
- The screen presentation does not reveal the true draw sequence. The Bridge
  therefore returns deterministic serialization as an
  `unordered_multiset` and declares `draw_pile_order_hidden_by_policy`.

The request is bound to the exact current `state_id`. Stale state, non-combat
context, missing local combat state, unknown identity, unqualified Modset, or
binding failure rejects the entire Inspection.

## Organic Evidence

Installed and loaded identity:

- Release/installed SHA-256:
  `ad4993e933c5c81c794751339e55662d1fc82e1b9754b4f22db39d92956ff56e`
- MVID: `512d1ab0-9398-462b-b0c7-bc5dc852af61`
- runtime: `d789c48ad7ec462dabe3ffd0da44f74f`
- Modset fingerprint:
  `536e5c79648f2e692f109e57a075f71569e2a8949d8d5dc01425465852ce5241`

The same loaded runtime completed an opaque `continue_run` command and entered
an ordinary Sewer Clam combat without v1 transport.

1. State `state_03e38963dc_4` reported context counts draw/discard/exhaust
   `12/0/0`. Inspection `inspection_b6552db302f411630767` returned the same
   counts and exact visible card multisets with no diagnostics.
2. Opaque request `preview41-end-turn-1784391367` completed. At next-player-turn
   state `state_03e38963dc_a`, context counts were `7/4/1`; Inspection
   `inspection_540144d7c94d5b1fd14a` matched exactly and included Ascender's
   Bane in exhaust.
3. Re-SpireAgent strict inspect negotiated preview.41, projected both
   `run_deck` and `combat_piles`, preserved their evidence records, and emitted
   no normalization diagnostics.

## Verification

- Bridge contract tests: `85/85`
- Re-SpireAgent tests: `139/139`
- Re typecheck and production build: passed
- Python server syntax compilation: passed
- Bridge Release build: passed with zero warnings/errors
- Release SHA equals installed SHA; capabilities prove the loaded MVID/runtime
- `git diff --check`: passed before documentation closeout and rerun at final

## Deliberate Non-Qualification

Two snapshots and one state-changing lifecycle establish a useful read-only
canary, not broad qualification. More encounter, reshuffle, generated-card,
retain, and unusual pile-transition diversity is still needed.

`combat_pile_card_selection` remains disabled. Exact v0.109 callers use the
same screen for materially different outcomes such as move-to-hand,
move-to-draw-top, exhaust, transform, or caller-specific selection. The screen
alone does not establish purpose. Future action support requires a typed
caller/source binding and an outcome witness for each bounded semantic family;
prompt text and selector closure are insufficient.

## Rollback

Remove `combat_piles` from the exact build's `InspectionCanaryKinds` and return
the strict protocol to preview.40. No action permission or saved game data was
changed by this feature.
