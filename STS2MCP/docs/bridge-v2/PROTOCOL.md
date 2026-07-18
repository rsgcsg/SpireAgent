# Bridge v2 Protocol

Protocol preview: `2.0-preview.35`

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
  `event_dialogue`, and `event_option`;
- qualified read-only inspection: `run_deck`.

Every unlisted Surface and Inspection remains disabled. Historical v0.108
evidence does not grant current-build authority, and canary evidence does not
silently become qualification.

For current local identity `v0.109.0|c12f634d|1833084275`, preview.35 advertises
an independent canary-only exact scope: qualified actions are empty,
`action_canary_surface_kinds=[event_option,event_card_acquisition,map_navigation]`,
and both Inspection lists are empty. A scoped build is executable when the
union of its explicit qualified and canary Surface lists is non-empty; an empty
qualified list is not an error and never becomes a wildcard. Re requires the
same lists in state and capabilities.

The preview.35 canary lists are scoped by Surface kind, not by individual
operation or source origin. A listed canary Surface may publish any operation
that its Provider validates on the exact build. This is controlled canary
authority only; per-operation and per-origin Organic Qualification must still
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
POST /api/v2/commands
GET  /api/v2/commands/{request_id}
```

All game-object reads and mutations run on the Godot main thread. HTTP and MCP
layers own transport only.

## State

Every state response contains:

- protocol, bridge, and exact game identity;
- observation policy;
- stable semantic `state_id` and monotonic process-session sequence;
- explicit top-level `shared_state` (`null` when no single-player run exists);
- readiness, typed semantic `context`, and surface kind;
- typed surface data;
- state-scoped opaque legal actions;
- completeness sources and missing fields;
- typed diagnostics and legacy compatibility warnings.

Timestamps and logging fields do not change `state_id`. Shared visible state,
semantic context, surface data, or the legal action set does.

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
require it. The purpose-specific `character_select` menu Surface requires it to
be `null`, because no run exists yet. Preview.28+ serializes
the active single-player run's act/floor/ascension, visible bosses/modifiers,
and local player identity/HP/gold/relic/potion facts. It must not be copied into
every Context, treated as an Inspection, or allowed to create actions. It is
included in `state_id`; an active-run projection failure suppresses actions.
Unknown hover-tip kinds fail closed instead of being silently omitted. Deck
contents still require the fixed `run_deck` Inspection.

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

The Bridge declares two possible read-only Inspection kinds, but a build may
advertise only the kinds that are explicitly permitted for that exact build:

- `run_deck`: current local player's run deck, including per-instance upgrade
  and enchantment semantics;
- `combat_piles`: draw, discard, and exhaust contents while a qualified combat
  context exists.

Both return `visibility_class=normal_inspection` and
`ordering_semantics=unordered_multiset`. Serialization order is deterministic
but has no game meaning. In particular, real draw order is never returned and
is declared as `draw_pile_order_hidden_by_policy`.

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

For the source-qualified v0.109 identity, capabilities advertise only the
explicitly scoped `run_deck` `qualified_read_only_scoped`; `combat_piles` is not
advertised or accepted. A different exact build may advertise no Inspection
kinds and must then report `disabled_for_current_build`. Inspection scope is
independent of action scope and is never inferred from historical capabilities.

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
