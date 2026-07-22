# Preview.52 Generated Combat Potion Family Closeout

Status: exact v0.109 source audited, bounded protocol implemented, Bridge/Re
tests and production builds passed, Release installed and cold-loaded, and an
Attack Potion lifecycle organically exercised on the exact loaded identity.
Skill and Power Potion remain source-audited canaries without Organic action
evidence.

## Natural Defect

Strict-v2 run `run-20260719231523-l68939` completed 78 actions across combat,
rewards, map, and event before Attack Potion opened
`NChooseACardSelectionScreen`. Preview.51 correctly returned
`unsupported + authority=none + legal_actions=[]`: it had no exact source
binding beyond Lead Paperweight and Colorless Potion. This was a real coverage
gap, not a reason to infer purpose from the shared card grid.

## Exact Source And UI Audit

Current `v0.109.0|c12f634d|-840572606` source shows that sealed native
`ColorlessPotion`, `AttackPotion`, `SkillPotion`, and `PowerPotion` each:

- generate exactly three distinct cards from a source-specific visible pool;
- await `CardSelectCmd.FromChooseACardScreen(..., canSkip: true)`;
- call `SetToFreeThisTurn` on the selected exact card;
- add it to the combat hand through `CardPileCmd.AddGeneratedCardToCombat`;
- use the native full-hand redirect to combat discard.

Only their candidate pool differs. Exact type equality is part of the binding.
Unknown potions, derived Mod types, cards, relics, effects, and other callers of
the same screen do not inherit this contract.

## Architecture Decision

Decision: **D - evolve the bounded Wire Protocol without changing the top-level
Context + one Active Surface architecture**.

The existing `generated_card_choice` Surface remains the one input owner. Its
combat branch now has a strict source-kind union:

```text
colorless_potion | attack_potion | skill_potion | power_potion
```

Bridge internally shares the source tracker and exact hand/discard witness,
but preserves source identity, combat Context, destination, cost policy,
overflow policy, operations, and completion. This is not a universal selector,
Effect DSL, generic potion authority, or permission inferred from UI shape.

## Contract And Completion

Selection remains state-bound and execute-time revalidated against the same
screen, unique source token, exact offered card reference, visible clickable
holder, and opening guard used for publication. Completion requires:

- source task finished;
- child Surface closed;
- selected exact reference was absent from baseline hand/discard;
- it is now in hand or discard;
- combined hand/discard count increased by exactly one;
- the selected card has a local free-this-turn cost modifier.

Skip retains the source/closure/unchanged-piles/absence witness. Unknown outcome
is never retried.

## Exact Loaded Identity

- protocol: `2.0-preview.52`
- normalized Re schema: `23`
- game: `v0.109.0|c12f634d|-840572606`
- Release/installed SHA-256:
  `7d29dac5794c07ffe0da870878a79ff4910015c6e1538b9f90ec97a61472f2c6`
- loaded MVID: `9dad6057-c901-401d-ba15-54f653432063`
- runtime instance: `6ff167a6698c46a6b62b7690bc232076`
- Modset: `exact_bridge_only`
- Modset fingerprint:
  `f1ecc8c0a30eb006bc27581fc3a4a21f9dfb9e9597461dff4a8faf3f51878a8c`

## Organic Evidence

After cold load, the saved floor-7 elite naturally replayed under run
`run-20260719232912-qd6f0j`. Attack Potion produced Bone Shards, Rattle, and
Squeeze with `source_kind=attack_potion`. The Surface remained non-actionable
during two opening-guard polls, then published exact state-bound actions.
DeepSeek chose Rattle. Command evidence was
`attack_potion_choice_closed_and_exact_free_card_added_to_combat_hand_or_full_hand_discard`;
the successor `combat_turn` contained the same Rattle entity in hand at cost
`0`.

One separate coherent Inspection bundle returned `stale_state` while combat
was changing. No action was dispatched on that tick, and the next observation
continued normally. It is a normal read race, not provider, authority,
completion, or execution failure.

## Verification

- Bridge tests: `97/97` pass.
- Re tests: `148/148` pass.
- Re typecheck and production build: pass.
- Bridge Release build: zero warnings and zero errors.
- Release and installed DLL SHA: exact match.
- Loaded protocol/MVID/runtime/game/Modset: exact match.
- Runtime artifacts remain ignored and uncommitted.

## Permission And Remaining Debt

The Surface-kind tier remains canary; no qualified tier or v1 fallback changed.
Attack Potion now has current-MVID Organic canary evidence. Colorless retains
its prior Organic canary. Skill and Power are implemented from exact source and
contract-tested but are not Organic-qualified. Skip and full-hand overflow are
also pending. Every unlisted source remains fail closed.

Rollback is the preview.51 DLL plus Re schema 22. Rolling back must restore the
old safe failure for Attack/Skill/Power sources rather than routing them through
Colorless semantics.
