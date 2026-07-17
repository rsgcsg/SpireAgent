# Bridge v2 Integration

## Current Scope

Re-SpireAgent supports the strict `2.0-preview.30` source contract. Current
v0.109 authority is read from capabilities rather than inferred from historical
implementation:

- scoped-qualified actions: `deck_removal_selection`,
  `deck_upgrade_selection`, `combat_turn`, `combat_hand_card_selection`, and
  ordinary single-player `rest_site`;
- current-build action canaries: `event_card_acquisition`, `reward_claim`,
  `card_reward_selection`, `map_navigation`, `shop_inventory`, `shop_room`,
  `treasure_room`, `game_over`, `card_bundle_selection`, `character_select`,
  `event_dialogue`, and `event_option`;
- scoped-qualified read-only Inspection: `run_deck`;
- every unlisted Surface and Inspection: disabled for this build.

Current-build organic evidence includes merchant removal with exact post-state,
independent event/rest upgrade journeys, ordinary combat actions, a Touch of
Insanity hand-select/confirm journey, ordinary rest Heal/Smith/Proceed, a Brain
Leech exact-card acquisition, coherent reward/card-reward/map/shop journeys,
treasure relic choose plus Proceed, an exact Scroll Boxes bundle commit,
ordinary character selection/run start, revealed Neow dialogue, and a typed
Neow option/Talisman/Proceed journey.
Preview.28 game-over code is source/test/build verified after a preview.27
organic contract defect; its fresh complete lifecycle, treasure open/skip,
linked rewards, special map modes, and unlisted variants remain unqualified.

Historical v0.108 evidence for enchantment, combat child selectors, generated
choices, and combat-pile Inspection remains protocol history only.
It does not silently grant v0.109 execution authority.

## State Identity

No single kind represents the full current state. Runtime output and prompts
carry:

```text
shared_state + context.kind + surface.kind + actionAuthority
```

- shared state: persistent visible single-player run/player HUD facts;
- context: semantic game situation (`event`, `combat`, `reward_flow`, etc.);
- surface: currently blocking interaction protocol;
- authority: `bridge_advertised`, `local_reconstruction`, or `none`.

For in-run Bridge-owned states, top-level v2 `shared_state` is the sole persistent
run/player authority. It is read-only, included in state identity, and cannot
add actions. Re rejects an in-run semantic Bridge state without it, mismatched combat
player identity, or incomplete combat potion coverage. Unsupported
legacy-owned states may still use v1 for their complete Context/Surface
projection, but no v1 sidecar merges into a Bridge-owned state.

The pre-run `character_select` Surface is the only current exception and must
carry `shared_state=null`. Event options preserve visible lethal warnings and
typed `text`/`card` hover tips; unknown tooltip variants fail closed.

## Action Entity Bindings

Bridge v2 keeps `action_id` as the only executable command argument, but each
legal action also carries non-executable role-to-entity bindings. Re requires
every binding to resolve to an entity already present in the visible Context or
Surface, preserves the bindings in normalized state and decision evidence, and
includes them in the LLM allowed-action payload. This closes ambiguity among
duplicate cards, enemies, rewards, or event options without exposing target
handles, indices, Godot paths, or any new authority.

## Active Surface Ownership

Bridge captures the active player-facing surface once. An explicitly open map
takes precedence over a reward overlay retained during room exit; otherwise a
visible blocking overlay selects only overlay providers, and room/turn
providers are considered. Exactly one provider may own the executable surface.
Ambiguous ownership, provider failure, or an unimplemented surface produces no
legal actions and a typed diagnostic.

Re consumes exactly one action-owning surface and never merges actions from a
suspended surface, the legacy sidecar, or multiple providers. Re keeps explicit
strict decoders rather than adding an auto-discovered plugin registry.

## Shop Contract

Shop is not one universal interaction. `shop_room` owns only merchant-open and
Proceed. `shop_inventory` owns separate card, relic, potion, card-removal, and
close actions. Shared gold and potion occupancy remain in `shop` Context.
Affordability is descriptive; only exact Bridge-advertised actions grant
authority.

The strict decoder accepts explicitly nullable shop product fields when the C#
wire omits them, then re-applies semantic invariants: stocked products must
expose their visible semantics, blocked offers cannot bind actions, full potion
capacity cannot advertise purchase, and each purchasable category must bind
exactly one category-specific action. A universal purchase kind, room-level
purchase, or action bound to an unavailable offer fails closed.

Organic preview.14 evidence covers room open, inventory close/reopen, direct
card/relic/potion purchases, sold-out post-states, and Proceed to map. The
merchant removal child is a different Surface. Preview.15 defines its exact
`shop + NDeckCardSelectScreen` contract. Preview.23 keeps the exact strong
merchant witness: selector closure alone is insufficient; selected instance,
deck, gold, removal counter, and service state must agree. The event/rest
`deck_upgrade_selection` contract shares only read/constraint mechanics and
requires its own exact upgraded-card post-state. Neither contract creates a
generic deck selector.

## Treasure Contract

Treasure uses `treasure + treasure_room`, not `reward_flow + reward_claim`.
Stages are `closed`, `opening`, `relic_choice`, and `completed`. The opening
animation publishes no actions. Relic choose completes only after exact relic
ownership increases and the selection closes; Proceed completes only after the
room leaves or map opens. Current organic evidence confirms choose and Proceed.
Open and skip remain unqualified variants.

## Typed Diagnostics

Bridge `diagnostics` separate severity from operational effect. Re preserves
their code, source, category, effect, recovery hint, optional path/visibility,
and bounded safe detail. It rejects malformed records and contradictions such
as advertised actions coexisting with `actions_suppressed`,
`surface_unsupported`, or `outcome_unknown`.

Legacy warning text remains auditable but warning presence alone no longer
degrades or grants authority.

## Inspection Boundary

Historical exact builds expose exactly two fixed read-only kinds:

- `run_deck` for per-instance deck/upgrade/enchantment semantics;
- `combat_piles` for unordered draw/discard/exhaust contents;
- `status=implemented_read_only`;
- exact-state bound;
- no arbitrary queries;
- no command-ledger entry;
- no hidden visibility;
- no draw-order semantics.

Re reads state, captures applicable inspections, and re-reads state before
accepting the combined snapshot. It validates kind/content, exact identity,
counts, zones, visibility policy, and state binding. Inspection evidence enters
the stale-state hash and normalized player facts, but never creates actions.
Volatile `observed_at` is excluded from stale identity; inspection content and
IDs are not. `inspection_not_available` is the only safely absent condition.
If the state advances during composite state-plus-inspection capture, whether
detected by an inspection `stale_state` response or the final state re-read,
the adapter rejects the partial snapshot with a typed transient observation error.
The settlement watcher may retry only this error within its existing timeout;
decision and execution authorization reads remain fail-closed.

The current v0.109 scope exposes only `run_deck` as
`qualified_read_only_scoped`. It has supported merchant-removal and deck-upgrade
post-state evidence. `combat_piles` remains disabled on this build.

## Card Reward Contract

Card reward uses `reward_flow + card_reward_selection`. It carries visible card
semantics and a list of separately labeled alternatives. Alternative buttons
may be skip, reroll, sacrifice, heal, or future exact-build choices; neither
Bridge nor Re converts them into `canSkip`.

Only opaque `select_card_reward` and `choose_card_reward_alternative` actions
advertised for the exact state may execute. Missing clickability, visible
labels, containers, or other action-critical facts suppress the entire surface.
Completion requires the overlay to close or the visible option object set to be
replaced, which covers reroll without assuming closure.

## Event Card-Acquisition Contract

Event card acquisition uses `event + event_card_acquisition`. It is not the
ordinary room-reward contract and not a universal simple-grid selector. The
current source gate accepts only exact audited event add-to-run-deck call sites:
Brain Leech with one of five cards and Room Full of Cheese with two of eight.
Sealed Deck, Sea Glass, Choices Paradox, and unknown simple-grid sources fail
closed.

Re validates exact selection constraints, selected-card membership, visible
card identities, and one-to-one opaque action bindings. Final auto-commit is
accepted only when Bridge confirms child closure, the expected run-deck count
increase, and every selected exact card instance in the run deck. Current
organic evidence covers Brain Leech one-card commit only; the Surface remains
an action canary until the distinct two-card flow is exercised.

## Outer Reward Claim Contract

Outer room rewards use `reward_flow(room_rewards) + reward_claim`. This surface
contains the rendered ordinary reward buttons and the enabled Proceed/Skip
control, with only opaque `claim_reward` and `proceed_rewards` actions. A card
reward claim is a transition into the separate `card_reward_selection` surface;
it does not expose or invent card alternatives early. If a visible linked reward
set is present, the entire surface suppresses actions until that selection
protocol is independently audited.

Potion capacity is part of this same reward-input protocol. When a visible
potion reward exists and all slots are occupied, the reward is visibly present
but not advertised as claimable. The surface instead exposes exact
`discard_potion_for_reward` actions for current visible potions. Execution
revalidates the full belt, player, exact slot, potion instance, and still-visible
reward before enqueueing the game's discard action. Claim is advertised only
after capacity exists.

## Card-Selection Boundaries

Re has separate normalized surfaces and guides for combat pile, combat hand,
generated card, card reward, and deck enchant selection. It validates every
action binding against a card entity present in that exact visible surface.
This is deliberate: temporary generated cards are not hand/deck cards; a pile
single-pick may auto-complete; hand selection can require confirm; generated
choice has an opening guard; reward cards persist into the run deck. Common
serialization never grants common execution semantics.

## Dialogue, Rest, And Map Boundaries

Ancient dialogue projects only the revealed prefix ending at the exact current
line; game-created future line nodes are deliberately excluded. Rest owns only
exact option controls and Proceed. On v0.109, ordinary single-player Heal uses
an exact HP witness, Smith must open the exact upgrade child, and unknown
enabled options suppress the Surface. Smith's deck selector remains a separate
qualified Surface. Map projects visible topology and exact current choices;
asynchronous completion requires map closure or the exact selected current
coordinate, not an arbitrary state change.

## Modes

| `STS2_MCP_PROTOCOL` | Behavior |
|---|---|
| `auto` | Negotiate v2. Use v2 as sole executor for a qualified surface; use v1 only when a coherent exact v2 response explicitly says unsupported. |
| `v1` | Use only v1 and `local_reconstruction` authority. |
| `v2` | Require v2. Unsupported, degraded, mismatched, or unknown contracts stop safely. |

The adapter remembers authority from its latest successful read. Executing a
legacy action after a v2-owned read, or a v2 action after a legacy read, is
rejected locally.

## Data Flow

```text
/api/v2/capabilities + /api/v2/state + fixed inspections
  -> strict Zod protocol decoder
  -> exact identity, inspection, diagnostics, and safety checks
  -> context + surface compatibility validation
  -> NormalizedCurrentState with explicit authority
  -> imported opaque legal actions
  -> DeepSeek selects one allowedActionId
  -> request_id + expected_state_id + action_id
  -> command identity/lifecycle verification
  -> append-only decision evidence
```

## Fail-Closed Rules

Execution is refused when protocol/build/observation identity differs, hidden
information is declared, command guarantees are absent, inspection claims more
than the fixed read-only contract, the surface is not advertised, context and surface
conflict, diagnostics contradict actions, readiness/completeness is incoherent,
or command identity/status/outcome is inconsistent.

`completed/confirmed` is accepted. `rejected/not_applied` is safely rejected.
`failed/unknown`, `timed_out/unknown`, transport uncertainty after submit, and
poll timeout are unknown and never automatically retried.

`completeness.playerVisibleSemantics` is scoped to the active bounded Surface.
Top-level `shared_state.completeness` separately scopes persistent HUD facts.
Neither asserts that every tooltip or other screen has a Bridge projection, and
neither can add actions to a Bridge-owned surface.

## Evidence And Next Step

Current v0.109 evidence includes merchant removal, event/rest upgrade, ordinary
rest, ordinary combat, Brain Leech event card acquisition,
reward/card-reward/map canaries, and treasure choose/Proceed. Historical
v0.108 evidence includes persistent Glam through `run_deck`, non-empty combat
piles, generated-card and bundle choices, ancient dialogue, rest, shop, and
other previously qualified shapes. Historical evidence remains visible but does
not grant current-build authority. Draw order remains intentionally hidden.

Composite state-plus-inspection reads are coherence checked. Earlier long runs
long runs recorded 23 transient drifts during fast game transitions; every one
produced no prompt and no execution, and the next tick obtained a fresh state.
This is observable retry/ergonomics debt, not permission to accept mixed
evidence.

Preview.24 organically verified menu-null, active-run shared facts, map/combat
composition, and an exact combat potion post-state on the final installed MVID.
Preview.25 then verified a Brain Leech exact-card auto-commit and same-instance
run-deck post-state. Preview.29-.30 verified a purpose-specific character-select
run start, revealed-prefix dialogue, and typed event-option text/card tooltips
through an exact Talisman/deck post-state and Proceed. Continue to the next
coherent blocking legacy boundary; root menu/single-player setup and fresh
game-over remain high-value. This integration
does not add memory, learning, scoring, hidden-information access, arbitrary MCP
calls, generic action payloads, or broad v2 coverage.
