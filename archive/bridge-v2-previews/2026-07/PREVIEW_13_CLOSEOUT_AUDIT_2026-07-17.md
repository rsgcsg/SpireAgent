# Bridge v2 Preview.13 Closeout Audit

Date: 2026-07-17
Game identity: `v0.108.0|58694f64|-2044609792`
Protocol: `2.0-preview.13`

## Verdict

The base abstraction is healthy and consistent with the exact installed game
source and observed UI: semantic Context, exactly one Active Surface, separate
Authority, fixed read-only Inspection, and structured Diagnostics describe
different concerns. The implementation is fail-closed and does not expose RNG,
future dialogue, draw order, arbitrary Godot objects, or free-form actions.

Preview.13 is ready to close as an incremental protocol milestone. It is not a
complete player-visible game protocol. Twelve executable surfaces are bounded
and organically observed, but unsupported screens and shared hover/HUD
semantics remain real debt.

## Source And Runtime Evidence

The rest lifecycle was audited against `RestSiteRoom.Options`, `NRestSiteRoom`,
`NRestSiteButton`, `NProceedButton`, and `NMapScreen`. Organic run
`run-20260716182900-50gm7n` exposed Rest and Smith with exact text and enabled
state, selected Smith through an opaque state-bound action, and opened a
separate deck-selection overlay. After the legacy deck selection closed, run
`run-20260717012922-la5ibg` executed the only advertised Proceed action and
reached map at the exact visited rest coordinate.

Ancient dialogue was audited against `NAncientEventLayout`,
`NAncientDialogueLine`, and its visible hitbox/tails. The game creates future
line nodes early, so reading all child nodes would leak hidden information. The
provider deliberately projects only the revealed prefix ending at
`_currentDialogueLine`. Organic run `run-20260716180850-gjv1lg` confirmed two
line advances and a clean transition to event options.

Map completion uses `NMapScreen.IsOpen` and the exact current coordinate rather
than treating every intermediate state-ID change as failure. Organic navigation
then completed repeatedly. The same rule is explicitly opted into only by
known asynchronous actions; default actions still reject unexpected state
changes.

## Context And Surface Definitions

**Context** is the current semantic situation that remains meaningful while
the top interaction changes: combat participants/turn, event identity, reward
flow, rest room, or map topology. It is not a screen discriminator and it does
not own executable controls.

**Surface** is the topmost verified player-facing interaction grammar. It owns
the visible controls, action-critical local facts, and exact legal actions for
that moment. Exactly one surface may own input. A Smith card selector suspends
the rest surface; a card reward selector suspends the outer reward surface.

**Authority** is independent of both. Bridge wire actions are game-UI backed;
Re-SpireAgent records whether the effective action list is
`bridge_advertised`, legacy `local_reconstruction`, or `none`.

**Inspection** models facts a player can deliberately inspect without making
that inspection the blocking interaction. Current kinds are only `run_deck`
and `combat_piles`; they are exact-state reads with no command authority.

**Diagnostics** describe missing semantics, compatibility, identity, or
operational effect. A warning cannot grant authority; action-suppressing
diagnostics cannot coexist with executable actions.

## Data-Model Assessment

Strengths:

- Bridge wire types are explicit discriminated records rather than a universal
  screen bag.
- Re-SpireAgent normalizes into context and surface unions; planning never reads
  arbitrary raw JSON.
- Entity IDs distinguish duplicate visible objects while opaque action IDs keep
  indices, Godot paths, and mutable objects server-side.
- State identity, exact game identity, command identity, action-specific
  completion, and post-state evidence are independently auditable.
- Active surface ownership is resolved from actual visible overlay/map state;
  ambiguity fails closed rather than depending on provider order.

Debts:

- Re-SpireAgent retains legacy and Bridge variants in one surface union. Some
  kinds such as `reward_claim` and `map_navigation` use optional Bridge fields,
  so authority/source identity is still needed to distinguish contracts.
- Shared player/run HUD semantics are not yet a first-class Bridge context for
  every non-combat state. Compatible v1 sidecar data currently fills that gap.
- `contract_complete_for_visible_*` names can be overread. They mean bounded
  surface completeness, not full-screen completeness; future schemas should
  encode completeness scope explicitly.
- Generic deck maintenance and menu lifecycle remain weak local protocols.
- The strict client's referential-integrity collector initially recognized only
  `entity_id`, not explicit root identities such as `screen_entity_id`; the
  preview.13 closeout fixed this and added fail-closed regression tests.

## Is All Player-Visible Information Exposed?

No. The supported surfaces expose the action-critical visible facts proven by
their source/UI audits, and the current inspections cover deck and combat pile
contents. The protocol does not yet claim uniform hover keyword definitions,
all shared HUD/run facts, shops, treasure, menu, generic deck maintenance,
linked rewards, multiplayer, or every variant of an implemented surface.

This is an acceptable incremental state because unsupported areas are explicit
and fail closed. It would be dishonest to rename bounded surface completeness
as global player-visible completeness.

## Next Architecture Move

Do not add a universal purchase or universal card-selection abstraction.
Audit shop next as a concrete protocol: visible inventory entries, prices,
affordability, sold-out state, potion capacity, card-removal entry/subsurface,
leave control, exact revalidation, and asynchronous completion. Only repeated
evidence across shop and reward/rest interactions may justify sharing smaller
visible-item or child-surface primitives.
