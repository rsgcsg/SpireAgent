# Bridge v2 Integration

## Current Scope

Re-SpireAgent supports the strict `2.0-preview.9` source contract for:

- `deck_enchant_selection`: organically end-to-end qualified;
- `event_option`: organically qualified for ordinary event options;
- `combat_turn`: organically qualified for repeated immediate combat actions;
- `combat_pile_card_selection`: four organically settled single-pick
  discard-pile actions across two preview.9 runs;
- `combat_hand_card_selection`: organically qualified for one upgrade select
  and confirm shape;
- `generated_card_choice`: exact-source and fixture qualified, but not yet
  organically executed under preview.9;
- `card_reward_selection`: organically qualified for one ordinary card/Skip
  lifecycle;
- `reward_claim`: ordinary claim and Proceed/Skip have bounded installed-game
  and model-selected Re lifecycles;
- `run_deck` and `combat_piles`: fixed read-only, state-bound evidence.

All current evidence is scoped to exact game identity
`v0.108.0|58694f64|-2044609792`. Historical earlier-preview evidence is retained
but does not silently qualify preview.9. Two fresh preview.9 runs executed 165
Bridge-authorized actions without command failure or unsettled Bridge outcome.

## State Identity

No single kind represents the full current state. Runtime output and prompts
carry:

```text
context.kind + surface.kind + actionAuthority
```

- context: semantic game situation (`event`, `combat`, `reward_flow`, etc.);
- surface: currently blocking interaction protocol;
- authority: `bridge_advertised`, `local_reconstruction`, or `none`.

For Bridge-owned states, a v1 sidecar may retain compatible shared run metadata
but cannot overwrite action-relevant v2 facts or add actions.

## Action Entity Bindings

`preview.9` keeps `action_id` as the only executable command argument, but each
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

## Typed Diagnostics

Bridge `diagnostics` separate severity from operational effect. Re preserves
their code, source, category, effect, recovery hint, optional path/visibility,
and bounded safe detail. It rejects malformed records and contradictions such
as advertised actions coexisting with `actions_suppressed`,
`surface_unsupported`, or `outcome_unknown`.

Legacy warning text remains auditable but warning presence alone no longer
degrades or grants authority.

## Inspection Boundary

`preview.9` exposes exactly two fixed read-only kinds:

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

## Evidence And Next Step

Fresh exact-build evidence now includes persistent Glam post-state through
`run_deck`, plus non-empty draw/discard/exhaust through `combat_piles`. Draw
order remains intentionally hidden. Generated-card choice remains an organic
qualification gap, not a reason to weaken the contract.

Composite state-plus-inspection reads are coherence checked. Two preview.9
long runs recorded 23 transient drifts during fast game transitions; every one
produced no prompt and no execution, and the next tick obtained a fresh state.
This is observable retry/ergonomics debt, not permission to accept mixed
evidence.

This integration does not add memory, learning, scoring, hidden-information
access, arbitrary MCP calls, generic action payloads, or broad v2 coverage.
