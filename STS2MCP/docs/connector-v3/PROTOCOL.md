# Connector V3 Protocol

Source protocol: `3.0-preview.12`

Schemas:

- `sts2.connector.v3/observation-1`
- `sts2.connector.v3/command-1`
- `sts2.connector.v3/control-1`
- `sts2.connector.v3/inspection-1`
- `sts2.connector.v3/linked-detail-1`
- `sts2.connector.v3/human-equivalence-1`

## Capabilities And Control

`GET /api/v3/capabilities` publishes exact Gateway/game/Modset/runtime
identity, runtime Patch inventory, permission policy and operation scopes,
qualification store/environment identity, command vocabulary and the optional
Human-profile capability. Empty permission or qualification lists grant
nothing.

Client registration and the single controller lease use only `control-1`:

```text
POST /api/v3/clients/register
GET  /api/v3/clients
GET  /api/v3/controller
POST /api/v3/controller/{acquire|renew|release}
```

Every response repeats protocol, schema and runtime identity. A lease does not
create operation authority; it only selects the one current mutation client.

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
Inspection catalog are typed independently from Bridge v2. Re consumes every
recognized V3 Surface directly from these facts and candidates; it does not
request a V2 capabilities/state projection sidecar. Inspection catalog entries
advertise state-bound read availability only; they never authorize mutation.

A visible unsupported interaction remains present with
`execution_support=unsupported` and no candidates.

An observed known UI with an unresolved exact source is also visible
unsupported. The Gateway retains the observed family and safe reason, but it
must not label the partial Surface supported or publish candidates. Re does
not decode that partial payload as a completed supported contract.

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

Generated-card choices expose source, purpose, destination, cost policy,
select/skip operations and the current selectable entity set. Those fields are
a Gateway-local source contract, not a Re-maintained source whitelist. Re
checks that every candidate uses the Surface's current operation and exact
screen/card/control bindings. A new source still requires Gateway owner,
Commit, Outcome and authority evidence; emitting a new string never grants
permission.

For source-rich known mechanics, the Gateway may load a reviewed embedded
SourceContract registry. A contract binds exact native owner/source type,
participant, selection shape, Commit and Outcome references; it is not wire,
does not execute, and cannot be supplied by a Mod at runtime. Encounter trial
authority is partitioned by the explicit operation-contract digest plus exact
source-evidence digest. Static reviewed scopes may retain the base operation
digest, but a dynamic grant for one source never admits a sibling source.

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

Precise Scissors and CardRemovalReward removal use the same bounded grid
mechanics but direct execution re-resolves their independent task-local source
before Commit. Precise Scissors does not advertise selection cancel because no
exact source-completion contract exists for that path.

Scroll Boxes bundle selection publishes atomic visible bundles,
`selectable_bundle_entity_ids`, `can_confirm` and `can_cancel_preview`.
Preview, confirmation and return bind the exact current screen and bundle.
Cards inside a bundle are visible facts, not independent operands.

Luminous Choir event removal is a separate source-specific transaction. It
binds the exact active `ReachIntoTheFlesh` task and non-cancelable two-card
selector. Its confirm Outcome requires both exact cards absent, one new Spore
Mind and event completion. It shares grid mechanics with other selectors but
does not share their authority or effect semantics. An unknown event, task or
selector shape publishes no commands.

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
discovery consumes typed `selectable_card_entity_ids`, `skip_available`,
`select_operation` and `skip_operation` facts. Re requires exact command-set
parity and rejects a source-operation mismatch. Execution revalidates the exact
active source, screen and card before using that source's native Commit and
Outcome witness. A Skill Potion, Quasar and Knowledge Demon therefore do not
share a generic result contract merely because they use the same selection UI.

Combat-pile, deck-transform and Wood Carvings selectors expose typed current
membership, stage, controls and source/effect facts. Their V3 resolvers remain
separate semantic contracts even where the native grid mechanics overlap.
An unregistered combat-pile source is visible but authority-free. In the exact
`v0.110.1` source audit, multiplayer-only `Tutor` selects from
`cardPlay.Target.Player`; it is intentionally excluded from the ordinary
source-card-owner contract and remains unsupported until a separate exact
participant-binding contract and evidence exist.

Map annotation exit and character selection are advertised only when their
exact current native controls are enabled. A broader visible drawing mode,
unlocked character or remembered prior state cannot substitute for that fact.

V3-native command descriptors are non-executing publication facts. Session trial
admission may use them only when the exact operation resolves to an explicit
native contract. A manifest fallback, fixture or static fingerprint cannot
turn a descriptor into authority. Rest-site and event-card-acquisition
commands follow this path without requiring Provider `draft.Actions`.

Game-over controls bind the exact current screen, stage and semantic control.
Execution resolves those facts again and invokes the native advance/return
Commit without retaining a Provider action closure.

Combat potions bind every explicit native target. Potions whose native
`TargetType` accepts `null`, such as an all-enemy effect, advertise an empty
target operand and revalidate `IsValidTarget(null)` before native Commit. An
explicit player/enemy target is never omitted merely because it is visually
obvious.

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

The current protocol supports the bounded `surface_card` kind only. The entity must be in
the exact current observation's `linked_detail_catalog`; the response repeats
the current state token and exact visible card instance. Reads are stale-safe,
read-only and non-authorizing. They do not create a ledger request, controller
lease or command candidate, and they do not expose cards outside the current
visible Surface.

## Optional Human-Equivalence Evidence

The default-off `native_pages.v1` profile uses:

```text
POST /api/v3/human-equivalence/sessions
GET  /api/v3/human-equivalence/sessions/{session_id}
POST /api/v3/human-equivalence/sessions/{session_id}/return
```

Supported fixed kinds are `run_deck`, `combat_draw_pile`,
`combat_discard_pile`, `combat_exhaust_pile` and `shop_catalog`. Open binds
the expected state token and runtime instance, verifies the pre-owner, invokes
only the exact native page control and suppresses mutation while the evidence
session is active. Read repeats current owner/page evidence. Return requires
the same runtime and restores/validates the pre-owner; a partial failure enters
`recovery_required` rather than guessing success.

The profile is operator evidence only. It is outside Agent Prompt flow, does
not create controller or command authority, never enters the Command Ledger
and cannot qualify an operation. Invalid/absent config remains disabled.

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
