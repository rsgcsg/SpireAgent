# Bridge v2 Integration

## Current Scope

Re-SpireAgent supports the strict `2.0-preview.54` source contract. Current
v0.109 authority is read from capabilities rather than inferred from historical
implementation:

The broad permission list below is scoped to
`v0.109.0|c12f634d|-840572606` only. Local runtime
`v0.109.0|c12f634d|1833084275` is distinct: preview.35 imports only its explicit
`event_option`, `event_card_acquisition`, and `map_navigation` action canaries,
accepts an empty qualified list, and imports no Inspection facts. Every other
Surface remains fail closed.

- scoped-qualified actions: `deck_removal_selection`,
  `deck_upgrade_selection`, `combat_turn`, `combat_hand_card_selection`, and
  ordinary single-player `rest_site`;
- source-target action canaries: `event_card_acquisition`, `reward_claim`,
  `card_reward_selection`, `map_navigation`, `shop_inventory`, `shop_room`,
  `treasure_room`, `game_over`, `card_bundle_selection`, `character_select`,
  `main_menu`, `singleplayer_menu`, `event_dialogue`, `event_option`, and
  source-bound `deck_transform_selection`, Self-Help Book
  `deck_enchant_selection`, exact Headbutt
  plus Graveblast `combat_pile_card_selection`, and exact Lead Paperweight,
  native Colorless/Attack/Skill/Power Potion, plus native Splash
  `generated_card_choice` branches;
- scoped-qualified read-only Inspection: `run_deck`;
- source-target read-only Inspection canaries: `combat_piles`, `shop_catalog`;
- every unlisted Surface and Inspection: disabled for this build.

Canary-only exact scopes are valid only when their explicit canary list is
non-empty. Re compares capability and state scopes, checks the exact game and
Bridge identity, and verifies capability support rows before importing actions;
empty qualified, canary, or Inspection lists never imply wildcard authority.
State, capabilities, and Inspection must also agree on the exact loaded Modset
fingerprint. Re rejects an exact-permission claim unless the sole loaded Mod is
the negotiated `STS2_MCP` assembly and its MVID matches the Bridge identity.

Preview.47 adds one coherent state-plus-Inspection observation bundle, a typed
visibility/Inspection catalog, and non-authorizing contract-instance shadow
telemetry. Re validates and preserves those fields but never uses the shadow as
permission. Unresolved shadow contracts may omit nullable IDs during
transitions. Evidence provenance is stored in run metadata and does not change
execution or qualification.

Preview.48 adds `shop_catalog` as a state-bound read-only canary in the current
shop Context. Re projects exact fixed UI slots, prices, stock, affordability,
potion-capacity blocks, and removal-service state into player facts. It does
not import purchase or navigation actions from the Inspection; those remain
owned by the one active shop Surface.

Preview.51 extends only the qualified combat Context with exact player-visible
`companions`. Re requires unique companion identities, enforces native health
bar visibility against HP presence, and projects the facts into normalized
schema 22. It does not derive actions, targets, or hidden pet state.

Preview.52 keeps the same generated-combat-card destination and completion
contract while preserving the exact native source as
`colorless_potion|attack_potion|skill_potion|power_potion`. Re schema 23 accepts
only those values under combat Context. Attack Potion is organically exercised;
Skill/Power remain source-audited canaries, and other callers remain invalid.

Preview.53 adds exact native Graveblast as a second source-discriminated branch
of `combat_pile_card_selection`. It shares the exact-one visible discard-pile
selection mechanics with Headbutt, but not the business outcome: Graveblast
moves the selected reference to hand, with the native full-hand discard redirect,
while Headbutt moves it to draw-pile top. Both branches retain independent
completion evidence and unknown callers remain invalid.

Preview.54 adds exact native Splash to `generated_card_choice` and normalized
schema 25. It reuses only the generated-combat-card selection mechanics and the
free-this-turn hand/discard completion witness. The source remains explicitly
`splash`; no other card generator or Mod subtype inherits its authority.

Source-target organic evidence includes merchant removal with exact post-state,
independent event/rest upgrade journeys, ordinary combat actions, a Touch of
Insanity hand-select/confirm journey, ordinary rest Heal/Smith/Proceed, a Brain
Leech exact-card acquisition, coherent reward/card-reward/map/shop journeys,
treasure relic choose plus Proceed, an exact Scroll Boxes bundle commit,
ordinary character selection/run start, revealed Neow dialogue, and a typed
Neow option/Talisman/Proceed journey.
The current MVID has a fresh loss intro -> summary -> return game-over
lifecycle. Win/timeline diversity, treasure open/skip, linked rewards, special
map modes, and unlisted variants remain unqualified.

Preview.38 adds only the exact Whispering Hollow random-transform child. Re
requires `random_uncommitted_cycle`, rejects any claimed pre-commit replacement,
and preserves the same selected entity bindings through confirm. Selection,
confirm, and upgrade-view presentation have current-build Organic-canary
evidence; other transform origins and cancel variants remain unqualified.

Preview.42 adds only the exact Lead Paperweight generated run-deck child. Re
requires `purpose=acquire_one_generated_card`,
`sourceKind=lead_paperweight`, `destination=run_deck`, exact visible card
bindings, and matching operation kinds. The Organic selection record proves
the same exact chosen card entered the run deck. Similar combat, relic, effect,
or Mod callers cannot inherit this authority.

Preview.43 ensures a provider whose exact source binding fails emits only
`unsupported + none_fail_closed` with zero actions. Preview.44 adds the exact
Colorless Potion combat child as a separate discriminated branch. Preview.52
adds only the exact native Attack/Skill/Power siblings. Re requires
`purpose=choose_one_generated_combat_card`, an exact supported potion `sourceKind`,
`destination=combat_hand`, `selectedCardCostPolicy=free_this_turn`, and the
full-hand discard overflow declaration, plus source-specific operation kinds.
Organic Colorless and Attack selection evidence proves the exact chosen entity
reached the successor hand at cost zero. Skill/Power, Skip, full-hand overflow,
and every other generated-choice source remain without Organic qualification.

Preview.46 requires typed `card_previews` on bounded hover-bearing entities.
Re projects them into read-only card facts and never converts them into allowed
actions. Stable preview IDs prevent recreated UI-only card models from causing
false state changes; interactive cards still require exact runtime identity.

Current-local evidence is narrower. Brain Leech option/acquisition was
canary-exercised on earlier preview MVIDs. Final preview.35 MVID
`547842a2-27d4-4c5d-8188-ca1d525d7e98` independently exercised exact
`(5,4) -> (5,5)` map travel after adding the controller-only screen
reachability gate. The successor combat remains unsupported with no authority.
This evidence does not qualify those Surfaces or transfer between MVIDs.

Historical v0.108 evidence for enchantment, combat child selectors, generated
choices, and combat-pile Inspection remains protocol history only.
It does not silently grant v0.109 execution authority.

Preview.40 strictly decodes exact combat setup and resolution no-input
transitions only when they are `settling`, have `none_fail_closed` authority,
carry active-run shared state, publish no actions, and report no missing
completeness field. They normalize to
`combat_transition(setup|resolution) + no_action` and cannot inherit v1
authority. No other context may compose with `no_action`.

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

The pre-run `main_menu`, `singleplayer_menu`, and `character_select` Surfaces
must carry `shared_state=null`. Event options preserve visible lethal warnings and
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

The current source contract exposes exactly three fixed read-only kinds:

- `run_deck` for per-instance deck/upgrade/enchantment semantics;
- `combat_piles` for unordered draw/discard/exhaust contents;
- `shop_catalog` for fixed visible merchant slots and service state in the
  current shop Context.

All three use `status=implemented_read_only`, are exact-state bound, support no
arbitrary queries, create no command-ledger entry or action authority, and
exclude hidden information. `run_deck` and `combat_piles` are unordered
multisets; `shop_catalog` alone preserves fixed visible UI slots.

Re first reads the state-bound Inspection catalog and then requests one
coherent Bridge observation bundle containing that state plus every advertised
Inspection. It validates kind/content, exact identity, counts, zones,
visibility policy, and state binding. Inspection evidence enters the stale-state
hash and normalized player facts, but never creates actions. Volatile
`observed_at` is excluded from stale identity; Inspection content and IDs are
not. A bundle `stale_state` is typed as transient whole-read drift. For
`inspection_scope_mismatch`, Re performs one non-authorizing fresh state read:
only a changed `state_id` proves lifecycle drift and permits observation retry;
the same mismatch against an unchanged state remains a hard contract error.
No partial bundle is accepted, and decision/execution authorization remains
fail closed.

The current v0.109 scope exposes `run_deck` as qualified and `combat_piles`
plus `shop_catalog` as separate read-only canaries. Current-MVID combat
snapshots matched context counts before and after an opaque end-turn lifecycle;
preview.48 shop reads matched the open/closed inventory and supported a direct
leave decision without reopening it. No Inspection grants action authority,
combat pile serialization remains explicitly unordered, and the shop catalog
preserves fixed UI slot semantics rather than pretending to be a universal
selector. Preview.52 follow-up run `run-20260719234320-ze6fp0` crossed closed
shop inspection, inventory actions, map, event acquisition, and combat with
15/15 settled Bridge-owned decisions after the bounded scope-drift fix.

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
coordinate, not an arbitrary state change. Publication and execution share the
same travelable/enabled/FTUE predicate; controller mode additionally requires
the exact node to be on screen, matching `NMapPoint.OnRelease`.

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
through an exact Talisman/deck post-state and Proceed. Preview.37 adds bounded
root and standard single-player menu contracts; Continue has final-MVID
Organic evidence, while the hidden Single Player branch still needs its own
lifecycle. Preview.41 fresh evidence now completes loss intro -> summary ->
return. Re finishes that current-run lifecycle but stops at the resulting
top-level menu with `stopReason=run_boundary`, before any continue/new-run
decision. Win/timeline and result diversity remain evidence debt. This integration
does not add memory, learning, scoring, hidden-information access, arbitrary MCP
calls, generic action payloads, or broad v2 coverage.
