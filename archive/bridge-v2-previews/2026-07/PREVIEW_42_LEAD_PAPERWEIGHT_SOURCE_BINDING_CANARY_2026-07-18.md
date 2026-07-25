# Preview.42 Lead Paperweight Source-Binding Canary

Date: 2026-07-18

## Scope

Preview.42 re-enables one bounded `generated_card_choice` origin on the exact
source-qualified v0.109 build: `LeadPaperweight.AfterObtained`. It does not
authorize the same UI for combat generators, Hefty Tablet, Knowledge Demon,
unknown relics, Mods, or any purpose inferred from prompt text.

The wire contract records:

```text
context=event(NEOW)
surface=generated_card_choice
purpose=acquire_one_generated_card
source_kind=lead_paperweight
destination=run_deck
```

Legal operations are `select_generated_run_card` and
`skip_generated_run_card_choice`. Both are opaque, state-bound, and rebuilt
from the same exact source/UI state immediately before execution.

## Source And UI Audit

`NChooseACardSelectionScreen` is a shared mechanic, not a shared business
contract. Current source callers include combat-generated hand cards,
Lead Paperweight run-deck acquisition, Hefty Tablet run-deck mutation, and
Knowledge Demon effect selection. Their destination, side effects, and
completion conditions differ.

Preview.42 therefore instruments the exact `RelicCmd.Obtain` lifecycle and
tracks only the active Lead Paperweight source. Missing, stale, conflicting,
or concurrent source bindings publish no generated-choice actions. The visible
cards, skip control, prompt, and opening guard come from the exact current UI;
the source binding supplies business purpose and expected destination.

Architecture decision: **C**. Reuse the one-of-N selection mechanics and a
strongly typed source binding internally, while retaining a purpose-specific
semantic Surface and Outcome Witness. A universal selector, prompt-derived
purpose, or executable effect DSL was rejected.

## Semantic Completion

Selection is confirmed only when all of these hold:

- the tracked source task completes;
- the selection Surface closes;
- the exact selected card reference appears in the run deck;
- run-deck count increases by exactly one.

Skip is confirmed only when the source task completes, the Surface closes,
run-deck count is unchanged, and none of the offered exact card references is
present. Screen closure alone is insufficient. Timeout or contradictory
post-state remains `outcome_unknown` and is never automatically retried.

## Exact Runtime Evidence

- remote and local code baseline: `79b5b17752fd4aa1a8e31fbe4b6968e321b85100`
- game identity: `v0.109.0|c12f634d|-840572606`
- protocol: `2.0-preview.42`
- Release/installed DLL SHA-256:
  `30e95059661a9f31e2896502788fa570eaeee700f7314ee627864ff9e9f3037b`
- loaded MVID: `d3f9898b-1d34-45a4-9b49-fa7b12593de9`
- runtime instance: `c9bed45e6b5e4cb29f8a4968863cf896`
- Modset: `exact_bridge_only`
- Modset fingerprint:
  `16356907f37cef3eb20f0562e3a06958de434c1c1e1b5b0993edb53ab5017b75`

Organic journey:

1. Opaque event request `preview42-lead-paperweight-1784393217` selected Lead
   Paperweight and opened its exact child Surface.
2. State `state_65ab2316b8_6` exposed Dramatic Entrance, Jack of All Trades,
   and Skip with the exact purpose/source/destination fields above.
3. Strict Re run `run-20260718164741-suylea`, decision
   `decision-000001-mrqlocou-orf2j9`, selected opaque action
   `action_90e35ab02b372611a749` through `bridge_advertised` authority.
4. Bridge request `re-p1-4d908857-cd93-4390-a0ad-3d7e9ad701c8` completed with
   evidence
   `lead_paperweight_choice_closed_and_exact_generated_card_added_to_run_deck`.
5. Successor state `state_65ab2316b8_7` was the parent Neow Proceed Surface.
   Run-deck Inspection increased from 11 to 12 cards and contained the same
   exact Dramatic Entrance entity `card_d73553e8_13`.

This proves one source-scoped canary lifecycle. It does not qualify the whole
Surface family or the skip operation.

## Verification

- Bridge contract tests: `86/86`
- Re strict tests: `140/140`
- Re typecheck and production build: passed
- Bridge Release build: zero warnings, zero errors
- Release SHA equals installed SHA; the game loaded the MVID above
- Re decision evidence records a confirmed opaque v2 action and settled
  semantic post-state; no v1 reconstruction was used

## Remaining Boundary

- `generated_card_choice` remains canary-only and source-scoped.
- Skip has source/witness tests but no Organic action evidence on preview.42.
- Hefty Tablet needs a separate source contract because it also adds Injury.
- Combat-generated hand cards require combat-source and hand-destination
  witnesses.
- Knowledge Demon and Mod callers require independent source, visibility,
  legality, commit, completion, environment, and canary evidence.
- `combat_pile_card_selection` and `deck_enchant_selection` remain disabled.

