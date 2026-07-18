# Preview.46 Typed Card-Hover Shared-State Closeout

Status: source audited, tested, built, installed, loaded, and organically
verified on 2026-07-18.

## Problem

The exact v0.109 Cursed Pearl source exposes `Greed` through a
`CardHoverTip`, not through text-only `HoverTip`. The previous shared-state
reader threw `NotSupportedException`, correctly suppressed all actions, but
therefore omitted a normal player-visible relic fact and blocked the saved
run.

The first preview.46 implementation exposed the card but used runtime object
identity. The game recreates the tooltip card model on every read, so each
poll generated a new `entity_id`, changed `state_id`, and made state-bound
Inspection permanently stale. That intermediate build is not qualified.

## Contract

Relics, run modifiers, owned potions, shop relics, and treasure relics now
carry two bounded hover channels:

- `keywords`: text hover semantics;
- `card_previews`: typed, read-only `VisibleCard` previews.

Unknown hover-tip kinds still fail closed. Preview cards create no action,
never enter the command ledger, and are not recursively modeled as a universal
tooltip graph.

Interactive cards retain exact runtime-instance identity. Read-only tooltip
cards instead use a deterministic identity derived from the stable visible
owner, card definition, and ordinal. This prevents ephemeral presentation
objects from changing semantic state identity without weakening action entity
binding.

## Final Identity And Verification

- protocol: `2.0-preview.46`
- exact game: `v0.109.0|c12f634d|-840572606`
- Release/installed SHA-256:
  `264352a987fcdb508398f5179e25dc551e5ba719f667361a3db0594d943007ca`
- loaded MVID: `9e6124ca-0082-451a-adb3-54b692a85d33`
- runtime instance: `96e022a2f4ae431aa99c2bf80272fd6a`
- Modset: `exact_bridge_only`
- Modset fingerprint:
  `01fd94643fe75b68a32a011e454263090560ce38223ec7b013a32761d72f1a1c`

Bridge tests passed `90/90`; Re tests passed `142/142`; strict typecheck,
both production builds, and Python compilation passed.

On the final loaded MVID, the saved run organically exposed Cursed Pearl with:

- visible description `Upon pickup, receive Greed. Gain 333 Gold.`;
- text hover semantics for `Eternal` and `Unplayable`;
- typed `GREED` card preview with visible title, type, cost, rarity, and
  description.

Eight consecutive reads retained state `state_a33462ad51_4`, sequence `4`,
and tooltip entity `tooltip_card_c1c5ff48d52b62d08d5c`. Re strict-v2 then
decoded the same preview and a state-bound `run_deck` Inspection with no
diagnostics. The following Neow `Proceed` action completed and settled.

Strict-v2 run `run-20260718181820-m33mb0` subsequently crossed map, combat,
reward, card reward, and shop using Bridge-owned actions only. Its bounded
progress guard stopped a model-driven shop close/reopen cycle; no v1 action,
provider failure, invalid action, or unknown Bridge outcome occurred.

## Architecture Decision

Classification: **C, one strongly typed shared visible component while
retaining independent semantic Surfaces**. The shared component is read-only
hover projection plus stable preview identity. It grants no authority and
does not merge relic, potion, modifier, shop, treasure, or event semantics.

Rejected alternatives:

- raw object dump or recursive UI tree;
- treating a recreated tooltip model as an interactive card instance;
- retrying stale composite reads until one happens to pass;
- silently dropping unknown hover types.

## Remaining Boundary

The card preview itself does not yet contain a nested keyword array; in the
Cursed Pearl case the owner hover also exposes Eternal/Unplayable text, so the
player-visible semantics are present without duplication. A future source
where decision-relevant card keywords exist only inside the preview requires
separate evidence before extending `VisibleCard`.
