# Run-Deck And Combat-Pile Inspection Audit

> Historical implementation audit for preview.4. Fresh preview.9 evidence now
> includes a non-empty exhaust pile; current qualification lives in
> [CURRENT_STATUS.md](CURRENT_STATUS.md) and
> [ORGANIC_LONG_RUN_AUDIT_2026-07-17.md](ORGANIC_LONG_RUN_AUDIT_2026-07-17.md).

Status date: 2026-07-16  
Protocol: `2.0-preview.4`  
Game identity: `v0.108.0|58694f64|-2044609792`

## Verdict

The visibility debt was real. Run-deck state is needed to verify persistent
upgrade/enchantment effects after a selection closes. Combat pile contents are
ordinary player-visible strategic facts and cannot be replaced by counts alone.
Neither belongs in an executable surface or an unrestricted reflection API.

The implemented boundary is a state-bound, read-only evidence channel with two
fixed kinds: `run_deck` and `combat_piles`. It adds no legal action, does not
enter the command ledger, and never exposes draw order.

## Game-Fact Basis

- `NDeckViewScreen` displays `Player.Deck` and lets the player select a sort.
  Therefore deck membership is visible while underlying collection order has
  no strategic protocol meaning.
- `NCardPileScreen` displays draw, discard, and exhaust pile contents.
- The draw viewer sorts cards for presentation rather than showing the model's
  true draw order. The protocol therefore publishes an unordered multiset and
  explicitly marks draw order hidden.
- Card rendering uses pile-sensitive description logic, so inspection card DTOs
  are produced with the relevant deck/draw/discard/exhaust display pile.

## Contract

```text
GET /api/v2/inspections/run_deck?expected_state_id=...
GET /api/v2/inspections/combat_piles?expected_state_id=...
```

Each response repeats exact state, Bridge, game, and observation-policy
identity. It includes completeness sources and missing facts. The adapter reads
state, captures applicable inspections, then reads state again; any state drift
aborts the whole read. Re-SpireAgent validates identity, counts, zones, policy,
and kind/content discriminators before projecting evidence.

Capability support is not universal current availability. A main-menu state
may return `inspection_not_available`; Re treats only that exact code as absent
evidence. Stale state, scope mismatch, transport failure, binding failure,
identity drift, malformed payload, and hidden-policy expansion remain hard
failures.

## Organic Evidence

- Main menu: run deck unavailable without breaking the valid legacy menu read.
- Restored run: `run_deck` returned ten per-instance starter cards.
- Natural Glam card reward: selecting `Barrage` increased the next independent
  run-deck inspection to eleven cards and preserved `GLAM`, its player-visible
  description, amount, and the selected card instance.
- Combat start: immediate counts and inspected contents agreed at draw=6,
  discard=0, exhaust=0.
- After playing Glam `Barrage`: counts and contents agreed at draw=6,
  discard=1, exhaust=0; the discarded card retained its enchantment semantics.

The smoke found a real client bug: volatile inspection `observed_at` initially
entered stale-state hashing, so equivalent reads could never execute. The fix
excludes only that timestamp. Inspection content, inspection ID, state binding,
and card-instance changes still alter stale identity.

## Residual Risks

- Non-empty exhaust has schema/fixture coverage and empty organic coverage, but
  still needs a natural non-empty sample.
- Generated, transformed, retained, temporary, and multiplayer card ownership
  are not qualified by the observed examples.
- Full run deck plus combat piles can enlarge an LLM prompt. RE-P1 intentionally
  preserves player-visible strategic fidelity; any future compact presentation
  must remain separate from this canonical evidence and must be measured rather
  than silently dropping cards or enchantments. In the observed 11-card combat
  state, the user prompt was 14,734 bytes and normalized current state 12,562
  bytes, which does not justify premature lossy compression.

## Architecture Assessment

The abstraction is healthy for RE-P1: one typed active surface owns mutations;
context owns immediate situation facts; fixed inspections supply optional
player-visible evidence; authority remains independent. A generic arbitrary
inspection query, embedding pile contents in `combat_turn.surface`, or exposing
model order would all violate this boundary and should remain forbidden.
