# Connector V3 Protocol

Source protocol: `3.0-preview.5`

Schemas:

- `sts2.connector.v3/observation-1`
- `sts2.connector.v3/command-1`
- `sts2.connector.v3/inspection-1`
- `sts2.connector.v3/linked-detail-1`

## Observation

An observation contains:

- exact Gateway/game/Modset identity;
- `state_token` and monotonic sequence;
- shared player-visible state, semantic context and visible surface;
- one active interaction and its execution support;
- bounded parameterized command candidates;
- completeness, visibility, diagnostics and hidden-by-policy declarations.

`bridge.upstream_commit` retains the immutable imported Bridge baseline; it is
not the current repository source revision. Loaded artifact identity is the
exact assembly SHA/MVID/runtime tuple. Re records its own source revision and
worktree digest separately in run metadata.

Shared visible facts, semantic context/surface, visibility metadata and the
Inspection catalog are typed independently from Bridge v2. Re currently
consumes ordinary combat, combat-hand selection, generated-card choice, menu,
event, map, game-over, deck upgrade, merchant deck removal,
reward/card-reward, shop, rest, treasure, lifecycle-settling and
visible-unsupported observations directly from these V3 facts. Inspection
catalog entries advertise state-bound read availability only; they never
authorize mutation.

A visible unsupported interaction remains present with
`execution_support=unsupported` and no candidates.

`interaction.phase` and `execution_support` are independent. A known family
may have `phase=settling`, zero candidates and `execution_support=supported`:
no command is legal at that instant, but the family contract is not missing.
Consumers supervise it as non-actionable lifecycle state. A ready family with
no exact binding remains `unsupported` and fails closed.

Event options expose `is_enabled` separately from `is_locked`. V3 candidate
discovery requires both the exact current native control to be enabled and the
semantic option to be unlocked; option text or position never grants authority.

## Command

```json
{
  "request_id": "client-generated-id",
  "expected_state_token": "state_...",
  "interaction_id": "interaction_...",
  "command": "play_card",
  "operands": {
    "card_id": "card_...",
    "target_id": "enemy_..."
  },
  "client_session_id": "client_...",
  "controller_lease_id": "lease_...",
  "controller_generation": 1
}
```

The Gateway accepts only the command and operands advertised for the exact
state and interaction. Entity IDs resolve to the same native object instance;
replacement objects do not inherit IDs. Native owner and legality are checked
again immediately before STS2 Commit.

Generic `activate_control` and `cancel_interaction` candidates include a
semantic `control_id` even when they also bind an owner entity. This
distinguishes multiple visible controls on one owner, such as opening versus
leaving a merchant room or closing the current inventory. `control_id` is not
a V2 action ID and cannot name an unadvertised method or UI node.

Visible Surface facts and command candidates are separate contracts. A
Surface may expose a visible, natively available control while exact
operation-scoped authority filters its command candidate. Consumers must
validate every published candidate but must not infer that an absent candidate
means the visible fact is false.

Event-option candidates bind the exact event screen and option entity.
Treasure candidates bind the exact room and, for relic choice, the exact
relic entity. Both families resolve current native controls at execution and
do not execute through Bridge v2 action IDs or Provider action closures.

Combat-hand selection exposes the exact current hand owner, visible card
membership, selected membership, currently selectable/deselectable card IDs
and current confirm/peek controls. Commands bind `hand_id` plus an exact
`card_id` or semantic `control_id`; execution resolves the same native hand and
card again before using `NPlayerHand`'s native selection controls. This
contract is deliberately distinct from pile/grid selection because its owner,
replacement behavior, Commit and Outcome belong to `NPlayerHand`.

Deck upgrade exposes the exact current upgrade screen, selectable and selected
card instances, preview state and native controls. Merchant deck removal uses
the same bounded card-selection mechanics but retains an independent merchant
source, Gold/service Commit and exact-card-removal Outcome. Relic and reward
removal do not inherit merchant authority merely because their UI is similar.

Reward-claim candidates are derived from the typed rewards Surface rather than
Provider action drafts. They bind the exact screen and reward or potion
entity; proceed/discard controls also carry a semantic `control_id`. Execution
resolves the current native button, player and potion slot again before native
Commit.

Main, single-player and character-select candidates are derived from typed
visible menu facts. They bind the exact current screen and, where applicable,
the exact character entity. Execution resolves the current native control and
single-player lobby again; no Provider action closure or V2 action ID is kept.

Generated-card choices share only bounded screen/card mechanics. Candidate
discovery remains source-discriminated, and execution revalidates the exact
active source, screen and card before using that source's native Commit and
Outcome witness. A Skill Potion, Quasar and Knowledge Demon therefore do not
share a generic result contract merely because they use the same selection UI.

Game-over controls bind the exact current screen, stage and semantic control.
Execution resolves those facts again and invokes the native advance/return
Commit without retaining a Provider action closure.

Combat potions always bind their exact native target, including self/player
targets. A target that is implicit in the visual label is not implicit in the
execution contract.

## Inspection

```text
GET /api/v3/inspections/{kind}?expected_state_token={state_token}
```

Supported typed kinds are `run_deck`, `combat_piles` and `shop_catalog`. The
kind must be present in the exact observation's `inspection_catalog`. The
response repeats matching `expected_state_token` and `observed_state_token`,
plus exact Gateway/game/Modset identity and an explicit completeness boundary.

Inspection is read-only semantic accessibility. It does not create a request
ID, controller lease, command candidate, ledger entry or action authority. A
stale token, unavailable kind or binding failure returns a typed error. Draw
order and other hidden information remain excluded. Physically opening the
native UI is a separate optional evidence profile, not an implicit side effect
of this endpoint.

## Linked Detail

```text
GET /api/v3/linked-details/{entity_id}?expected_state_token={state_token}
```

Preview.5 supports the bounded `surface_card` kind only. The entity must be in
the exact current observation's `linked_detail_catalog`; the response repeats
the current state token and exact visible card instance. Reads are stale-safe,
read-only and non-authorizing. They do not create a ledger request, controller
lease or command candidate, and they do not expose cards outside the current
visible Surface.

## Receipt

Receipt states are:

- `completed`: the action-specific Gateway Outcome was observed;
- `not_executed`: validation rejected before Commit;
- `pending`: poll the same request ID;
- `unknown`: mutation may have occurred; do not retry automatically.

`retry.allowed` is always false. `pending` means polling the existing request,
not submitting it again.

## MCP

The Python adapter exposes V3 capabilities, observation, state-bound
Inspection and `surface_card` linked detail, submit and receipt tools. It is a
transport adapter and cannot add commands, legality or authority.
