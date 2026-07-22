# Bridge v2 Protocol

Protocol preview: `2.0-preview.56`

Preview.56 adds the source-bound `wood_carvings_replacement_selection`
contract. It distinguishes native Wood Carvings Bird/Torus by the exact
async event task rather than localized prompt text, exposes the deterministic
replacement already visible to the player, and completes only after the
source task ends, the selector closes, the exact original instance leaves the
deck, the expected replacement count increases, and deck count is preserved.
It is a current-identity action canary, not qualification or a universal deck
selector.

Preview.55 repairs the C#/Re source contract: `bridge.assembly_file_sha256`
identifies the loaded Gateway artifact without disclosing a local path, and
`game.compatibility.action_permission_scopes` is the exact, fail-closed
projection of the current build's manifest operations. A Surface capability
lists only operations present in that scope. `legacy_fallback_allowed` is not a
strict-v2 authority handoff; source-resolved but unscoped surfaces publish no
actions with `none_fail_closed`. This does not add a source binding for
Discovery or grant it generated-card authority.

`bridge.upstream_commit` is the immutable imported upstream baseline, currently
`20eadebde358a37cca41f8b38728099e6d0d19db`; it is not the current SpireAgent
Git revision. Runtime evidence must use the loaded module MVID, runtime ID,
Release/installed SHA, exact game identity, and Modset fingerprint. A future
protocol may add a separately named repository source revision, but the legacy
field must not be treated as current-build authority.

## Build Compatibility

This protocol describes bounded v2 contracts, not permission to execute every
contract against every Steam build. For exact identity
`v0.109.0|c12f634d|-840572606`, capabilities separately advertise:

- qualified actions: `deck_removal_selection`, `deck_upgrade_selection`,
  `combat_turn`, `combat_hand_card_selection`, and ordinary single-player
  `rest_site`;
- action canaries: `event_card_acquisition`, `reward_claim`,
  `card_reward_selection`, `map_navigation`, `shop_inventory`, `shop_room`,
  `treasure_room`, `game_over`, `card_bundle_selection`, `character_select`,
  `main_menu`, `singleplayer_menu`, `event_dialogue`, `event_option`, and
  source-bound `deck_transform_selection`, source-bound
  `wood_carvings_replacement_selection`, Surface-level
  `deck_enchant_selection`, exact Headbutt
  `combat_pile_card_selection` for exact Headbutt/Graveblast, and source-scoped
  `generated_card_choice` for exact Lead Paperweight acquisition and native
  Colorless/Attack/Skill/Power Potion plus native Splash combat choices;
- qualified read-only inspection: `run_deck`;
- read-only inspection canaries: `combat_piles` and `shop_catalog`.

Every unlisted Surface and Inspection remains disabled. Historical v0.108
evidence does not grant current-build authority, and canary evidence does not
silently become qualification.

`deck_enchant_selection.confirm_selection` is not complete merely because the
overlay closes. The current event command applies the enchantment after the
selection task resolves. Preview.49 therefore binds commit to the exact
selected card instances plus enchantment ID/amount, revalidates those facts at
dispatch, and requires both overlay closure and exact card-model post-state.

The permission and Provider boundary is broader than the preview.49 evidence:
the exact-build gate permits `deck_enchant_selection` by Surface kind, and the
Provider matches `NDeckEnchantSelectScreen` without proving a Self-Help Book
source token. Self-Help Book is the recorded canary journey and manifest source
text, not a runtime-enforced origin whitelist. Other exact-build origins must
not be described as qualified, but they are not currently suppressed by source
binding once this Surface is permitted. This is a known governance gap and no
permission is expanded by documenting it.

Event option commands may cross a bounded asynchronous intermediate state
before their existing semantic witness becomes true. Preview.50 opts only
`choose_event_option` and `proceed_event` into ledger intermediate-state
waiting. They still require replacement options, a required child Surface,
combat entry, map opening, or room departure before the command completes;
otherwise the command times out as unknown. The ledger default continues to
fail an unexplained state change for every action that did not explicitly opt
in.

Combat `player.companions` is immediate read-only Context, not an executable
Surface. It is sourced from the local player's exact `PlayerCombatState.Pets`
collection used by native `NCombatRoom` pet rendering. Each entry carries
stable entity identity, exact definition, visible name, alive state, block,
and visible statuses. `hp` and `max_hp` are present only when the companion's
native `MonsterModel.IsHealthBarVisible` is true; contradictory visibility and
HP shapes fail strict Re validation. This contract does not create companion
commands, infer hidden pet state, or expose future Summon results.

Exact environment identity is the combination of exact game identity and the
loaded Modset identity. `game.modset` records:

- deterministic `fingerprint` and its declared `fingerprint_scope`;
- ModManager status and whether exact permission is eligible;
- every known Mod's manifest ID/version, source, load state, gameplay flag,
  Workshop ID as an exact decimal string, and loaded assembly name/version/MVID;
- a safe status/detail without local filesystem paths.

The current permission profile requires `exact_bridge_only`: ModManager is
initialized, the only loaded Mod is the negotiated exact `STS2_MCP` module,
and its manifest version and loaded MVID agree with the Bridge identity.
Additional loaded Mods, failed or runtime-added Mods, unavailable identity, or
state/capability fingerprint mismatch fail closed for actions and Inspection.
This is a permission gate, not a claim that disabled Mods or future native-UI
Mods are semantically compatible. Such environments require independent source
binding, visibility, legality, commit, completion, and canary evidence.

For the current local identity `v0.109.0|c12f634d|-840572606`, preview.55
advertises an explicit `surface_kind + operation + tier` inventory. A scoped
build is executable only when the current state operation appears in that
inventory; empty lists never become wildcard authority. Re requires identical
operation scopes in state and capabilities.

Canary authority remains operation-scoped permission, not Organic
Qualification. Per-operation and per-origin qualification must still
be recorded separately. Future permission refinement may narrow this scope but
must not infer or expand authority from implementation alone.

For `map_navigation`, preview.35 uses the same exact-node predicate while
publishing and immediately before execution. Besides run-state travelability,
node enabled state, and FTUE gating, controller input requires the destination
node to be on screen, matching the current `NMapPoint.OnRelease` path.

## Endpoints

```text
GET  /api/v2/capabilities
GET  /api/v2/state
GET  /api/v2/inspections/{kind}?expected_state_id={state_id}
POST /api/v2/observation-bundles
POST /api/v2/commands
GET  /api/v2/commands/{request_id}
```

All game-object reads and mutations run on the Godot main thread. HTTP and MCP
layers own transport only.

The Bridge v2 contract is protocol-neutral domain behavior. The REST routes
above are the current Re-SpireAgent integration. The Python MCP server is an
optional adapter over the same routes; listing or calling an MCP tool does not
grant action legality, exact-build permission, qualification, or strategy
authority. Transport adapters may expose only fixed, capability-advertised
operations and Inspection kinds. They must not reconstruct legal actions,
invent source semantics, or provide arbitrary scene-tree/reflection queries.

Canonical component names, ownership, and the deferred Headless boundary are
defined in [LIVE_GAME_CONNECTION_BOUNDARY.md](LIVE_GAME_CONNECTION_BOUNDARY.md).
This protocol document specifies current wire behavior; it does not make REST,
MCP, or Re an owner of gateway semantics.

Protocol choice and rendering mode are independent. Starting the real Godot
runtime without a display does not create a new action contract and does not
prove that STS2 gameplay is independent of scene/UI lifecycle.

## State

Every state response contains:

- protocol, bridge, exact game identity, and exact loaded Modset identity;
- observation policy;
- stable semantic `state_id` and monotonic process-session sequence;
- explicit top-level `shared_state` (`null` when no single-player run exists);
- readiness, typed semantic `context`, and surface kind;
- typed surface data;
- state-scoped opaque legal actions;
- completeness sources and missing fields;
- a bounded `visibility` declaration and current typed
  `inspection_catalog`;
- a non-authorizing `contract_instance_shadow` describing the current gap
  between declared semantic operations and legacy Surface-kind permission;
- typed diagnostics and legacy compatibility warnings.

Timestamps and logging fields do not change `state_id`. Shared visible state,
semantic context, surface data, or the legal action set does.

`visibility` distinguishes default core completeness, declared linked-detail
families, currently available read-only Inspection kinds, explicit missing
facts, and hidden-by-policy facts. `player_visible_closure_status` describes
the declared default-plus-inspection closure; it is not a claim that one state
payload contains every player-visible fact. Unknown execution-critical fields
remain fail-closed.

`inspection_catalog` is state-bound and deterministic. Every entry records its
visibility basis, availability tier, ordering semantics, cost hint, recommended
uses, and hidden policy. It grants no action authority and does not enter the
command ledger.

`contract_instance_shadow` is migration telemetry only. It may be unresolved
and omit nullable contract/binding fields during transitions. It always reports
`authorizing=false`; neither manifest presence nor operation evidence can add
or suppress legal actions. Current execution permission remains the exact
environment plus explicit qualified/canary Surface-kind lists.

## Coherent Observation Bundle

```json
{
  "expected_state_id": "state_opaque",
  "inspections": [
    { "kind": "run_deck" },
    { "kind": "combat_piles" }
  ]
}
```

`POST /api/v2/observation-bundles` returns one state and the requested fixed,
typed Inspections under the same exact state, Bridge MVID/runtime, game, and
Modset identity. Requests are limited to the current catalog, at most eight
distinct fixed kinds, and 8 KiB. Any stale state, permission mismatch, unknown
kind, or observation drift rejects the complete bundle. The response is
read-only, creates no command, and cannot be supplied as an execution payload.

`context.kind` is not a complete state discriminator. Clients must display and
reason over at least:

```text
shared_state + context.kind + surface.kind + action authority
```

The context contains durable current-situation semantics. The surface contains
the currently blocking interaction protocol. Authority says whether actions
were Bridge-advertised, locally reconstructed by a legacy client, or absent.
Bridge wire actions always use `authority="game_ui"`; the higher-level client
records the effective state authority separately.

`shared_state` is a separate top-level read-only concern. Active-run Surfaces
require it. The purpose-specific `main_menu`, `singleplayer_menu`, and
`character_select` Surfaces require it to be `null`, because no run exists yet.
Preview.28+ serializes
the active single-player run's act/floor/ascension, visible bosses/modifiers,
and local player identity/HP/gold/relic/potion facts. It must not be copied into
every Context, treated as an Inspection, or allowed to create actions. It is
included in `state_id`; an active-run projection failure suppresses actions.
Preview.46 represents bounded entity hover semantics as separate `keywords`
and typed read-only `card_previews`. Relics, run modifiers, owned potions,
shop relics, and treasure relics use this contract. Interactive cards keep
runtime-instance identity; recreated tooltip cards use stable owner-scoped
preview identity so presentation allocation cannot churn `state_id`. Preview
identity grants no action authority. Unknown hover-tip kinds fail closed
instead of being silently omitted. Deck contents still require the fixed
`run_deck` Inspection.

Preview.37 models root and single-player submenu navigation as distinct
semantic Surfaces. They share a typed visible-choice component, not a universal
menu action protocol. An option may be `actionable` or `visible_unsupported`;
only the former may correspond to an opaque legal action. A live modal owns
input above both menus and suppresses all menu actions.

Preview.38 models the exact Whispering Hollow random-transform child as
`event + deck_transform_selection`. It is not a universal card selector or a
generic transform API. During preview it reports
`preview_kind=random_uncommitted_cycle` and `replacement_known=false`; cycling
cards are player-visible presentation and never disclose the committed random
replacement or RNG. Confirmation requires screen closure, absence of every
selected exact original instance, and preserved run-deck count.

That child witness proves the bounded transform operation, not every remaining
effect in the parent event transaction. Parent event-option completion may
occur when a required child opens. The current wire has no transaction-wide
obligation list assigning later parent effects to a command; this limitation is
tracked by the 2026-07-20 architecture audit and must not be inferred away from
the local child witness.

Preview.42 models only `LeadPaperweight.AfterObtained` as
`event + generated_card_choice`. The Surface must declare
`purpose=acquire_one_generated_card`, `source_kind=lead_paperweight`, and
`destination=run_deck`. Legal operations are `select_generated_run_card` and
`skip_generated_run_card_choice`. An exact active source binding is mandatory;
the shared `NChooseACardSelectionScreen`, prompt text, card-grid shape, or relic
ownership alone never supplies purpose or authority. Selection completion
requires source-task completion, Surface closure, exact selected-card presence,
and run-deck count `+1`. Skip requires source-task completion, Surface closure,
unchanged deck count, and absence of all offered exact card references.

Preview.43 standardizes provider binding failure without adding a semantic
Surface: a provider that cannot prove its exact source returns
`unsupported + none_fail_closed + legal_actions=[]` with typed diagnostics.
It may retain safe Context for diagnosis, but it may not retain a business
Surface kind or `bridge_owned` authority. This helper is a wire-safety
mechanism and never grants permission.

Preview.44 adds exact `ColorlessPotion.OnUse` as a second, discriminated
`combat + generated_card_choice` branch. It must declare
`purpose=choose_one_generated_combat_card`,
`source_kind=colorless_potion`, `destination=combat_hand`,
`selected_card_cost_policy=free_this_turn`, and
`overflow_destination=combat_discard_if_hand_full`. Its legal operations are
`select_generated_combat_card` and
`skip_generated_combat_card_choice`. Selection completion requires the source
task to finish, child closure, an exact offered reference newly present in
hand or discard, combined hand/discard count `+1`, and the temporary free-cost
modifier. Skip requires source completion, child closure, unchanged hand and
discard counts, and absence of all offered references. Lead Paperweight and
Colorless Potion share only bounded one-of-N mechanics; source, Context,
destination, cost policy, operations, and witnesses remain distinct.

Preview.52 extends that combat branch only to native sealed `AttackPotion`,
`SkillPotion`, and `PowerPotion`, whose exact v0.109 `OnUse` implementations
have the same visible choice, free-this-turn mutation, hand destination,
full-hand discard overflow, and source-task lifecycle as `ColorlessPotion`.
The wire preserves exact `source_kind` values `colorless_potion`,
`attack_potion`, `skill_potion`, and `power_potion`; exact type equality is
required, so unknown potions, derived
Mod types, card/relic generators, and other callers cannot inherit authority.
Shared mechanics and witness topology do not erase the source identity or
create a universal generated-card selector.

Preview.53 extends `combat_pile_card_selection` only to exact sealed
`Graveblast`. Its wire branch is discriminated from Headbutt by
`source_kind=graveblast`, `purpose=move_one_discard_card_to_hand`,
`destination_pile=hand`, `destination_position=bottom`, and
`overflow_destination=discard_if_hand_full`. Completion requires source-task
completion, child closure, exact-reference movement from discard to hand when
capacity existed, or exact-reference retention in discard only when the
baseline hand was full. Combined hand/discard cardinality must remain stable.
The shared selector mechanics do not grant any other combat-pile caller
authority.

Preview.54 extends the generated-combat branch only to exact sealed native
`Splash`. The source is tracked around `CardModel.OnPlayWrapper`; the offered
set must contain exactly three transient Attack cards owned by the local
player, with the same explicit free-this-turn hand/discard outcome used by the
native source. Wire `source_kind=splash` remains distinct from potion sources.
Unknown cards, derived types, relic generators, and other shared-screen callers
remain fail closed.

Preview.40 models two source-bounded, non-authorizing combat lifecycle phases
under one `combat_transition` Context. `phase=setup` requires the exact current
room to be `CombatRoom`, no blocking Surface, combat not in progress, and
either `CombatManager.IsStarting` or no combat state yet. It uses
`transition=awaiting_combat_start`. `phase=resolution` requires retained combat
state plus a live `NCombatRoom` after combat ended and uses
`transition=awaiting_room_resolution`. Both compose only with `no_action`,
readiness `settling`, zero actions, and `none_fail_closed`. They are absent
from capabilities and permission manifests because they describe lack of
input ownership, not executable Surfaces. Absence of a visible overlay in any
other room remains insufficient evidence and fails closed.

Similar card grids do not imply a shared Surface. Selection limits, selected
cards, preview controls, and opaque-card bindings may be shared structural
facts, but the effect-specific visible semantics, eligibility predicate,
command path, and completion witness remain part of the owning Surface. For
example, merchant removal and deck enchantment are distinct contracts even
though both expose a deck-card selection lifecycle.

## Legal Actions

Each legal action contains an opaque executable identity plus auditable links
to entities already exposed in the current player-visible context or surface:

```json
{
  "action_id": "action_opaque",
  "state_id": "state_opaque",
  "kind": "toggle_card",
  "category": "selection",
  "label": "Select Zap",
  "authority": "game_ui",
  "evidence_code": "NCardGrid.HolderPressed",
  "entity_bindings": [
    { "role": "card", "entity_id": "card_visible_1" }
  ]
}
```

The label and `entity_bindings` are explanatory, not executable. A binding may
only reference an entity already present in the same visible Context/Surface,
including explicit root identities such as `screen_entity_id` and
`room_entity_id`;
it lets clients distinguish duplicate cards, enemies, rewards, and options.
The command still accepts only `action_id`: mutable game objects, target
handles, node paths, indices, and call paths remain inside the registry.

## Command Submission

```json
{
  "request_id": "client-generated-idempotency-key",
  "expected_state_id": "state_opaque",
  "action_id": "action_opaque"
}
```

The bridge rebuilds current state, checks exact state identity, resolves the
registered action, and revalidates its game objects before starting it.

Request IDs are idempotent only for an identical payload. Reusing one with a
different action is rejected.

## Lifecycle

```text
received -> validated -> started -> completed
                     \-> rejected
                     \-> failed
                     \-> timed_out (outcome unknown)
```

`completed` requires the action-specific predicate. In the enchant slice:

| Action | Completion evidence |
|---|---|
| toggle card | selected membership changed |
| preview selection | enchant preview became visible |
| confirm preview | enchant screen closed |
| cancel preview | preview closed and selected set cleared |
| close selection | enchant screen closed |

Additional preview.2 completion evidence:

| Surface/action | Completion evidence |
|---|---|
| event choose | source-backed replacement option set, required child Surface, combat, or room transition; `WasChosen` alone is insufficient |
| shop relic purchase with linked rewards | exact relic gained, exact gold delta, offer advanced, and exact visible linked reward child; a completed failed parent task is never accepted |
| reward Proceed | the purpose-specific reward witness may pass through known intermediate state changes; an unknown outcome is never retried |
| event proceed | map opens or the event room leaves |
| combat play card | card leaves hand, required subsurface opens, or combat ends |
| combat potion | potion leaves its exact slot or combat ends |
| combat end turn | local player play phase ends or combat ends |

Additional preview.3 completion evidence:

| Surface/action | Completion evidence |
|---|---|
| card reward card | reward overlay closes or the visible option object set is replaced |
| card reward alternative | reward overlay closes or the visible option object set is replaced, including reroll |
| outer reward claim | its exact reward button is removed, or a child card-reward overlay replaces the outer screen |
| outer rewards proceed | outer rewards screen exits, its visible reward control set is replaced, or the player-visible map opens |

Preview.15 defines a deliberately narrow merchant-removal child lifecycle. It
is executable only on an exact supported build that observes
`shop + NDeckCardSelectScreen`; it does not generalize other deck selectors.
Preview.16 may observe that same child on its exact v0.109 candidate identity,
but its legal action array is intentionally empty and the lifecycle remains
unqualified.

| Surface/action | Completion evidence |
|---|---|
| merchant removal toggle | selected membership changes, preview opens, or selector closes |
| merchant removal preview | removal preview opens or selector closes |
| merchant removal confirm | selector closes, exact selected instance leaves the run deck, deck count and gold reflect the captured transaction, removal count increments, and the exact service is used |
| merchant removal preview cancel | preview closes and selector remains current |
| merchant removal cancel | selector closes without committing |

On the observed ordinary v0.109 merchant-removal shape, the opaque selection
action completed directly into the preview stage. No separate
`preview_deck_removal` legal action was published. Declared provider operations
are descriptive across supported shapes; the current legal-action array is the
only execution authority for a concrete state.

Current selection and reward completion evidence:

| Surface/action | Completion evidence |
|---|---|
| combat pile card toggle | selected membership changes or the single-pick surface auto-completes |
| combat pile confirm/cancel/peek-close | required selection commits, selection closes, or peek closes respectively |
| combat hand card toggle | exact selected-card instance membership changes |
| combat hand confirm/cancel/peek-close | hand selection commits/closes or peek closes respectively |
| generated card choice select | the choose-a-card overlay closes after its opening input guard |
| generated card choice skip | the choose-a-card overlay closes |
| generated card choice peek-close | peek mode closes without granting underlying combat actions |
| full-belt reward discard | the exact potion leaves its exact slot or the reward surface is replaced |
| potion reward claim | reward set changes or the reward surface is replaced, after capacity is revalidated |
| event dialogue advance | exact current dialogue index advances or the event room closes |
| card bundle preview/confirm/cancel | exact selected bundle enters preview; confirm closes the selector and every selected exact card instance appears in the run deck; cancel returns to choices |
| map node choice | map closes or the exact current map coordinate reaches the selected node |
| rest Heal | exact source-calculated HP post-state and rest-option progression |
| rest Smith | exact `deck_upgrade_selection` child opens; arbitrary overlays do not complete |
| rest Proceed | map opens or the rest room leaves |
| shop open/close | inventory `IsOpen` becomes true/false respectively |
| typed shop card purchase | purchase task succeeds, exact card instance enters the run deck, exact gold is spent, and the typed entry advances |
| typed shop relic purchase | purchase task succeeds, exact relic instance enters inventory, exact gold is spent, and the typed entry advances |
| typed shop potion purchase | capacity is revalidated; purchase task succeeds, exact potion instance enters a slot, exact gold is spent, and the typed entry advances |
| shop card-removal launch | exact merchant removal child opens or the exact service becomes used |
| shop Proceed | map opens or the merchant room exits |
| deck upgrade confirm | exact selected deck instance is upgraded and the selector closes |
| deck transform confirm | exact selected original instances are absent, run-deck count is preserved, and the selector closes; the random replacement is not disclosed before commit |
| event card acquisition select/deselect | exact selected membership changes, or final auto-commit closes the child, increases run-deck count by the committed selection count, and places every selected exact instance in the run deck |
| treasure relic choose | exact relic ownership increases and the relic selection closes |
| treasure skip | relic ownership is unchanged and the room advances |
| treasure Proceed | treasure room leaves or the map opens |
| game-over advance | exact current Continue starts `_isAnimatingSummary` and becomes disabled; container visibility alone is not evidence |
| game-over return | game-over closes, the run is no longer in progress, and the main menu is loaded |
| character select | exact selected character, exact Ascension delta, active run with selected character, or exact submenu departure |

Event options expose the exact rendered title/description, lock/proceed/chosen
state, visible lethal warning, optional relic semantics, and typed hover tips.
Text hover tips remain text; `CardHoverTip` remains a full visible card preview.
Unknown hover-tip types suppress the Surface instead of being flattened or
silently dropped.

Shop uses two mutually exclusive action-owning Surfaces. `shop_inventory`
contains separate card, relic, potion, and card-removal offer types; it never
publishes a generic purchase action. `shop_room` contains only merchant-open and
Proceed controls. Shared gold and potion occupancy live in `shop` Context.
Affordability is descriptive and is not action authority. Product fields and
`blocked_reason` are nullable protocol semantics and may be omitted by the C#
wire serializer when absent; stocked products must still expose their exact
visible product semantics.

Persistent gold and potion occupancy come from top-level `shared_state`, not
the `shop` Context. Shop legality and execution still belong exclusively to the
active shop Surface.

If the state changes but the predicate does not pass, the command fails with an
unknown outcome. Unknown outcomes are never auto-retried.

For an asynchronous semantic commit, a Surface or panel closing is only an
intermediate transition unless exact game source proves it is the terminal
effect. Merchant removal therefore permits intermediate state IDs while its
source-backed postcondition settles. Preview.23 preserves opaque action identity
while adding purpose-specific upgrade and treasure DTOs. Preview.24 changes
state composition only; it grants no new executable Surface. Preview.25 adds a
source-qualified event card-acquisition canary without generalizing other
`NSimpleCardSelectScreen` purposes.

Clients must verify that every command response repeats the submitted
`request_id`, `expected_state_id`, and `action_id`. They must also enforce the
status/outcome pairs: pending lifecycle states use `pending`, `completed` uses
`confirmed`, `rejected` uses `not_applied`, and `failed`/`timed_out` use
`unknown`. A mismatch is an unknown client outcome, not success.

## Diagnostics

`diagnostics` is structured. `severity` describes importance; `effect`
describes operational consequence. Only explicit effects and contract
invariants affect action authority. An informational inspection diagnostic may
coexist with actions; `actions_suppressed`, `surface_unsupported`, or
`outcome_unknown` may not.

Legacy `warnings` remain during preview migration. Clients preserve them for
audit but do not infer safety from warning presence or absence.

## Inspection Contract

The Bridge declares three possible read-only Inspection kinds, but a build may
advertise only the kinds that are explicitly permitted for that exact build:

- `run_deck`: current local player's run deck, including per-instance upgrade
  and enchantment semantics;
- `combat_piles`: draw, discard, and exhaust contents while a qualified combat
  context exists;
- `shop_catalog`: the current merchant's typed fixed-slot card, relic, potion,
  and removal-service catalog while the player is in that shop Context. It
  reports whether the inventory is open or closed, but never publishes
  purchase or navigation actions.

All return `visibility_class=normal_inspection`. `run_deck` and
`combat_piles` use `ordering_semantics=unordered_multiset`; serialization order
is deterministic but has no game meaning. In particular, real draw order is
never returned and is declared as `draw_pile_order_hidden_by_policy`.
`shop_catalog` uses `ordering_semantics=fixed_ui_slots`, preserving the exact
visible merchant slot identities without creating a generic ordered-selector
contract.

Inspection requests require the exact current `state_id`, exact supported game
identity, and a fixed advertised kind. They do not return actions, mutate the
game, or enter the command ledger. `inspection_not_available` means the
player/run object does not exist in the current state; clients may treat that
as absent evidence. Stale state, identity mismatch, binding failure, malformed
content, and unsupported expansion remain hard failures.

Clients constructing one decision observation from state plus inspections must
verify that the state remains identical after sidecar capture. A changed state
or inspection `stale_state` rejects the entire composite observation; clients
must not mix facts from adjacent game states. A bounded client may retry that
read as transient evidence, but never reuse an action from the rejected read.

For the source-qualified v0.109 identity, capabilities advertise `run_deck` as
qualified and `combat_piles` plus `shop_catalog` as separate read-only
canaries, producing `mixed_scoped_read_only`. A different exact build may
advertise no Inspection kinds and must then report
`disabled_for_current_build`. Inspection scope is independent of action scope
and is never inferred from historical capabilities.

An empty qualified/canary Surface or Inspection list is always an empty
permission scope. It never means wildcard, all-declared-Surface authority, or
all declared fixed Inspections. Historical exact build identity may permit an
explicit legacy handoff, but no v2 Provider can publish an action and no fixed
Inspection can answer unless its kind appears in the build's explicit qualified
or canary list.

## Error Codes

| Code | Meaning |
|---|---|
| `invalid_json` | malformed request body |
| `invalid_command_contract` | required opaque IDs absent/invalid |
| `request_id_conflict` | idempotency key reused for another payload |
| `command_capacity_exhausted` | bounded session ledger is full; restart required |
| `stale_state` | expected state no longer current |
| `inspection_not_available` | fixed inspection has no backing player/run object in this state |
| `inspection_scope_mismatch` | inspection requested outside its qualified context |
| `inspection_kind_not_implemented` | kind is not one of the fixed advertised inspections |
| `inspection_binding_failed` | exact-version player-visible binding failed closed |
| `unknown_or_stale_action` | action not registered for current state |
| `screen_stage_changed` | surface changed before execution |
| `card_not_actionable` | bound card/UI object no longer actionable |
| `unexpected_state_transition` | state changed without action-specific proof |
| `completion_probe_failed` | completion observation itself failed |
| `outcome_not_observed` | timeout with unknown outcome |

Error details are safe summaries. Full local exceptions remain in the game log.
