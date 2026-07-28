# Bridge v2 Integration

> Current source-truth status, 2026-07-29: Re and C# share the
> `2.0-preview.73` source consumer contract; Re normalized schema is `29`.
> Gate 1 is closed as a bounded ordinary-single-player v2 connector baseline.
> Preview.61 supplied the final Neow's Fury runtime seal; Preview.62 adds
> policy provenance and registry adaptation without inheriting qualification.
> Preview.69 has exact runtime coverage including one clean 107-decision
> game-to-menu journey. Preview.70 later completed a 124-decision boundary and
> exposed the Silver Crucible empty-chest Oracle defect. Preview.71 later
> loaded and exposed exact Hefty Tablet source/result debt plus an actionless-
> settling consumer bug. Preview.72 repairs both and was exact-identity
> loaded; old runtime grants cannot authorize it. Current-runtime run
> `run-20260728132337-ce2195` completed a 146-decision one-game boundary with
> 144 settled actions and one safe stale rejection. It is `unrecorded`, ran
> with Inspection disabled, and did not exercise either repaired branch. Six
> contracts are explicit high-precision rows; 81 remain conservative manifest-derived
> identity/test-confirm fallbacks rather than semantic qualification.
> Preview.73 then repairs a Rest minimum-Outcome overclaim and the incorrect
> loss of semantic ownership after operation quarantine. It is tested, built,
> installed and cold-loaded; strict read-only inspection passed without a
> mutation canary.

## Connector Boundary

Re-SpireAgent's current strict-v2 connection is direct REST through
`BridgeV2RestClient`. The game-side Bridge is the protocol-neutral Live
Semantic Gateway; the Python MCP server is optional and is not in this runtime
path. The canonical cross-project ownership rules are in
[the Live STS2 Connection Boundary](../../STS2MCP/docs/bridge-v2/LIVE_GAME_CONNECTION_BOUNDARY.md).

Re owns connector negotiation, strict schema decoding, coherent structural
projection, advertised-action import, submission/polling, and exact
environment/evidence recording. It does not own or reconstruct strict-v2 game
legality, runtime permission, native Commit, transaction completion, semantic
Witnesses, or host-specific live/Headless rules. A Re change in this area must
remain directly tied to connector, protocol adaptation, or structured state
consumption.

## Current Scope

Re-SpireAgent implements the strict `2.0-preview.73` consumer contract. When a
matching Bridge exists, authority is read from capabilities rather than
inferred from implementation or historical evidence.

For every exact identity, Re accepts only the Gateway's explicit
`surface_kind + operation + tier` scope projection. Every unlisted operation,
source binding, Surface, and Inspection is disabled. Qualification from another
game build or Bridge MVID does not transfer.

Re compares the stable state/capability authorization set
(`surface_kind + operation + tier`), rejects duplicate or unadvertised scopes,
and imports a legal action only when its
`surface_kind + operation` pair is explicitly advertised. Empty qualified,
canary, or Inspection lists never imply wildcard authority. State,
capabilities, bundles, and Inspections must agree on game identity, Modset
fingerprint, Bridge assembly SHA-256, MVID, and runtime instance. Encounter
trial admission additionally requires the negotiated loaded `STS2_MCP` module
and an exact or explicitly candidate Modset classification.

Preview.62 also requires state and capabilities to agree on the reviewed
exact-environment policy ID, its digest and adaptation level. These fields are
provenance, not a client-side permission engine.

Preview.63 additionally requires the Gateway permission runtime epoch, runtime
Patch inventory and complete operation-scope grant bindings. A dynamic scope
must reference the unique current active grant for the same operation and exact
environment. Re preserves superseded/revoked grant versions for audit, imports
no action from them, and cannot promote, quarantine or persist permission.
Preview.69 also verifies each dynamic scope's `admission_basis`. An
`encounter_source_resolved` scope is valid only when the current Gateway grant
is migration-scoped, runtime-bound, and carries explicit encounter evidence.
Static protocol support is negotiated at initialization, but dynamic
capabilities are refreshed with coherent observations. Grant IDs may
legitimately advance after semantic completion; each response is independently
exact-validated while the operation authorization set must remain coherent.

Preview.64 separates controller coordination from game permission. Re may read
without registration. Before a mutation it lazily registers, acquires or
renews the current runtime lease, submits the lease generation, and requires
the command's immutable attribution to match. Lease expiry blocks later
submissions but does not change an already admitted command outcome. Gateway
restart invalidates the registration and lease. Client metadata is descriptive
and must not be treated as authenticated identity.

Re's production Connector is v2-only. The former `auto` and explicit `v1`
runtime modes are rejected; historical v1 raw-state records remain readable
but no Re transport can reach `/api/v1/*`. A `legacy_v1_state` field injected
into a Bridge v2 wrapper is invalid and cannot contribute facts or authority.

Bridge command `completed` is the semantic settlement authority. Re verifies
the echoed request/state/action identity, preserves `failed` and `timed_out`
as unknown outcomes, and captures a coherent successor checkpoint after a
confirmed command. A checkpoint read failure cannot cause action retry.

Preview.68 requires `identity_shadow`. Re strictly verifies its non-authorizing
status and candidate digest shapes and preserves it in raw evidence. It is not
part of normalized strategy state, Prompt construction, action import,
permission, or completion. The legacy composite `state_id` remains the only
state/action binding until a separately reviewed Organic migration.

Preview.71 also strictly decodes explicit component-contract candidates in the
raw contract shadow. Missing candidate digests are invalid. Manifest hypotheses
carry no component digest. Neither form enters normalized strategy state,
Prompt construction, action import, permission, or completion.

The first exact Preview.63 production-path canary submitted advertised
`main_menu/continue_run` once and settled at `reward_flow/reward_claim`. The
Gateway promoted that operation from `session_canary` to
the historical `session_auto_approved` tier for that runtime epoch. Preview.69
renames future equivalent results to `session_trial_confirmed`. Either proves
the consumer contract and one low-risk session loop, not persistent
qualification or broader permission.

Preview.65 adds strict, read-only consumption of the Gateway qualification
projection. A short-lived `session_canary` package may only seed the existing
runtime-epoch canary flow. A persistent operation scope is accepted only when
one current `qualified` package matches the exact environment, operation
fingerprint, completion boundary and witness. Re cannot install, promote,
revoke, roll back, or repair either package tier.

Preview.69 makes the public `npm run agent:run` probe the current state before
using the legacy package migration fallback. A diagnostic no-input transition
may start Re; the Gateway admits only a later current source-resolved action.
This removes bulk preinstallation from the target path without making Re or D
an authority. After terminal game-over cleanup the bounded loop stops at the
top-level menu even though initial run entry was allowed.

Preview.66 permits multiple exact environments to retain packages for the same
Surface/operation without collision. Re continues to consume only the
Gateway's current exact projection; the local Environment Profile registry,
migration plan, evidence collector, and append-only installer are external
non-live tools and never become client-side authority. `--allow-run-entry` is
an explicit experiment boundary: it permits a bounded run to choose a current
Gateway-advertised top-level entry action but does not reconstruct menu
legality or bypass the normal action and command lifecycle. Re accepts the
fallback completion-boundary enum for strict decoding but does not interpret
its witness: the Gateway remains responsible for publishing, executing, and
settling the operation. Every current dynamic scope must still link to its
current grant; current grants are not clipped by the bounded historical-grant
projection.

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

Re now decodes one structural `combat_pile_card_selection` contract rather than
one TypeScript branch per source card. It validates closed movement or
same-index replacement semantics, automatic-at-max versus manual-confirm
commit, exact selected instances, and bounds. Gateway source provenance remains
visible but does not create client-side authority. Unknown structurally valid
provenance can be decoded only when the exact Gateway has already published
scoped opaque actions; unknown Gateway source binding still produces no
actions. See the
[Gate 1 selector audit](../../STS2MCP/docs/bridge-v2/GATE1_CLOSEOUT_AND_SELECTOR_TRANSACTION_AUDIT_2026-07-24.md).

The current working tree additionally decodes the exact post-acquisition
`Precise Scissors` deck-removal task as
`unknown + relic_deck_removal_selection`, not as a shop removal or a generic
card selector. Its only candidate authority is Gateway-advertised, exact
`PreciseScissors.AfterObtained` binding plus the distinct canary scope. Re does
not infer it from reward history and does not attach shop price/service facts.
The source branch is compiled and fixture-tested only until a newly installed
DLL completes an Organic select/preview/confirm/deck-post-state journey.

Preview.58 separately decodes exact `CardRemovalReward` as
`unknown + reward_deck_removal_selection`, never as merchant or relic removal.
Re imports only the advertised opaque select/preview/confirm/cancel actions and
does not infer the producer from prior combat. A current-build bounded canary
completed the full selection lifecycle and an independent `run_deck` post-state
with the selected exact card absent. This is canary evidence, not qualification.

Preview.54 adds exact native Splash to `generated_card_choice` and normalized
schema 25. It reuses only the generated-combat-card selection mechanics and the
free-this-turn hand/discard completion witness. The source remains explicitly
`splash`; no other card generator or Mod subtype inherits its authority.

Discovery is deliberately absent from preview.55: no current C# source binding
proves its native source, legality, destination, Commit, or completion. Re
rejects it as unknown instead of widening the generated-card registry.

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
authority. Preview.69 also admits the exact new/resumed-run
`run_transition(setup/awaiting_run_state) + no_action` mounting gap. That exact
actionless state may omit shared HUD only with the typed
`bridge.shared_state.deferred_during_run_mount_transition` diagnostic and sole
missing field `shared_visible_state`; Re does not generalize the exception to
combat or any action-owning state. No other context may compose with
`no_action`.

A semantic Surface with `readiness=blocked` is different from `no_action` and
from `unsupported`. It remains the current `bridge_owned` input Surface, keeps
its player-visible facts, publishes zero legal actions and normalizes to
`non_actionable + actionAuthority=none`. Re does not invoke the model or infer
permission from those facts. Unknown source/owner states still require
`unsupported + none_fail_closed`.

## State Identity

No single kind represents the full current state. Runtime output and prompts
carry:

```text
shared_state + context.kind + surface.kind + actionAuthority
```

- shared state: persistent visible single-player run/player HUD facts;
- context: semantic game situation (`event`, `combat`, `reward_flow`, etc.);
- surface: currently blocking interaction protocol;
- authority: current runtime states are `bridge_advertised` or `none`;
  `local_reconstruction` remains only in historical v1 record decoding.

For in-run Bridge-owned states, top-level v2 `shared_state` is the sole persistent
run/player authority. It is read-only, included in state identity, and cannot
add actions. Re rejects an in-run semantic Bridge state without it except for
the exact typed actionless run-mount deferral above; it also rejects mismatched
combat player identity or incomplete combat potion coverage. Unsupported legacy-owned
states remain fail closed in the current Re runtime. Historical v1 records can
still be decoded, but no v1 sidecar or mutation path participates in a live
decision.

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

The eager-all Inspection read and the direct full-state Prompt serialization
are current consumer behavior, not Gateway permission requirements. The full
observation remains the replay/validation evidence source; any future strategy
projection or selective Inspection policy must be downstream, state-bound,
shadow-validated, and non-authorizing. The current limitations and falsifiable
experiments are recorded in the
[visibility and observation audit](../../docs/current/audits/VISIBILITY_AND_OBSERVATION_ARCHITECTURE_AUDIT_2026-07-22.md).

The current v0.109 scope exposes `run_deck`, `combat_piles`, and
`shop_catalog` as separate read-only canaries. Historical combat
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
the native base-heal minimum plus option progression, Smith must open the exact
upgrade child, and unknown
enabled options suppress the Surface. Smith's deck selector remains a separate
purpose-specific Surface. Map projects visible topology and exact current choices;
asynchronous completion requires map closure or the exact selected current
coordinate, not an arbitrary state change. Smith's child and map navigation
are current-build canaries. Publication and execution share the
same travelable/enabled/FTUE predicate; controller mode additionally requires
the exact node to be on screen, matching `NMapPoint.OnRelease`.

## Connector Mode

Re uses Bridge v2 only. Unsupported, degraded, mismatched, or unknown contracts
stop safely. Historical v1 records are outside the Agent runtime.

## Data Flow

```text
/api/v2/capabilities + /api/v2/state + fixed inspections
  -> strict Zod protocol decoder
  -> exact identity, inspection, diagnostics, and safety checks
  -> context + surface compatibility validation
  -> NormalizedCurrentState with explicit authority
  -> imported opaque legal actions
  -> DeepSeek selects one allowedActionId
  -> current controller lease
  -> request_id + expected_state_id + action_id + lease generation
  -> command identity/attribution/lifecycle verification
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

Preview.69 has two final-MVID records under SHA `914974b5...`, MVID
`1e457e86...`, runtime `7a312974...`. The first completed a 127-decision
saved-run-to-menu boundary with 114 settled actions, 11 safe stale refusals and
one confirmed command whose successor checkpoint exceeded Re's budget. The
second completed a fresh 107-decision character-select-to-menu journey with
106 settled actions and no stale or runtime failure. Their provenance is
`unrecorded`, so neither is Organic or persistent qualification.

New Re runs write immutable `run-summary.json`; decision-limit exhaustion is
incomplete and exits non-zero. A transient provider transport failure receives
at most one pre-mutation retry. These changes do not alter Gateway completion or
unknown-no-retry. Preview.70 later loaded as SHA `28c32f40...` / MVID
`6f169dfe...` and supplied three more runs. Preview.71 later loaded as SHA
`fd0f7c56...` / MVID `0acccd3d...` and supplied the current defect evidence.
Preview.72 was later rebuilt/installed/loaded as SHA `debc229e...` / MVID
`6d9d4adf...` / runtime `b2332a06...`. Current-runtime run
`run-20260728132337-ce2195` proves broad bounded mutation and one-game
supervision on that identity, but not repaired-branch completion, Organic
evidence, Inspection readiness or persistent qualification.
Preview.73 is built and installed as SHA `f6b2d268...` / MVID `f67e272a...`.
It is cold-loaded as the same identity with runtime `37c04bb7...`; strict Re
read-only inspection passed, but no Preview.73 mutation or repaired-branch
canary has executed.

Current v0.109 evidence includes merchant removal, event/rest upgrade, ordinary
rest, ordinary combat, Brain Leech event card acquisition,
reward/card-reward/map canaries, and treasure choose/Proceed. Historical
v0.108 evidence includes persistent Glam through `run_deck`, non-empty combat
piles, generated-card and bundle choices, ancient dialogue, rest, shop, and
other previously qualified shapes. Historical evidence remains visible but does
not grant current-build authority. Draw order remains intentionally hidden.

Composite state-plus-inspection reads are coherence checked. Earlier long runs
recorded 23 transient drifts during fast game transitions; every one
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
