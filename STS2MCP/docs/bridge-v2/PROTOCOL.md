# Bridge v2 Protocol

Protocol preview: `2.0-preview.16`

## Build Compatibility

This protocol describes the bounded v2 contract, not a permission to execute
against every Steam build. The currently installed
`v0.109.0|c12f634d|-840572606` is an exact **candidate-observation** binding
only for `shop + deck_removal_selection`: static source/reflection checks passed,
but Bridge publishes no actions, rejects inspection, and forbids legacy-sidecar
merging for that state. Every other v0.109 surface remains unqualified. Organic
lifecycle evidence is required before any action authority can be considered;
historical `v0.108.0` evidence is not v0.109 authority.

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
- readiness, typed semantic `context`, and surface kind;
- typed surface data;
- state-scoped opaque legal actions;
- completeness sources and missing fields;
- typed diagnostics and legacy compatibility warnings.

Timestamps and logging fields do not change `state_id`. Semantic context,
surface data, or the legal action set does.

`context.kind` is not a complete state discriminator. Clients must display and
reason over at least:

```text
context.kind + surface.kind + action authority
```

The context contains durable current-situation semantics. The surface contains
the currently blocking interaction protocol. Authority says whether actions
were Bridge-advertised, locally reconstructed by a legacy client, or absent.
Bridge wire actions always use `authority="game_ui"`; the higher-level client
records the effective state authority separately.

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
| event choose/proceed | option chosen, room/subsurface transition, or a non-empty replacement option set |
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
| merchant removal confirm | selector closes after confirmation |
| merchant removal preview cancel | preview closes and selector remains current |
| merchant removal cancel | selector closes without committing |

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
| event dialogue advance | current revealed line advances or dialogue controls close |
| card bundle preview/confirm/cancel | exact selected bundle enters preview, commits, or returns to choices |
| map node choice | map closes or the exact current map coordinate reaches the selected node |
| rest option | option disappears, Proceed enables, room leaves, or a verified child overlay opens |
| rest Proceed | map opens or the rest room leaves |
| shop open/close | inventory `IsOpen` becomes true/false respectively |
| typed shop purchase | exact product changes, its valid child overlay opens, or the merchant room exits |
| shop card-removal launch | removal becomes used, the child selector opens, or the merchant room exits |
| shop Proceed | map opens or the merchant room exits |

Shop uses two mutually exclusive action-owning Surfaces. `shop_inventory`
contains separate card, relic, potion, and card-removal offer types; it never
publishes a generic purchase action. `shop_room` contains only merchant-open and
Proceed controls. Shared gold and potion occupancy live in `shop` Context.
Affordability is descriptive and is not action authority. Product fields and
`blocked_reason` are nullable protocol semantics and may be omitted by the C#
wire serializer when absent; stocked products must still expose their exact
visible product semantics.

If the state changes but the predicate does not pass, the command fails with an
unknown outcome. Unknown outcomes are never auto-retried.

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

Capabilities advertise exactly two `implemented_read_only` inspection kinds:

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
