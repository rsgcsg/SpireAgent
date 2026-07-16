# Bridge v2 Integration

## Current Scope

Re-SpireAgent supports the strict `2.0-preview.3` source contract for:

- `deck_enchant_selection`: organically end-to-end qualified;
- `event_option`: organically qualified for ordinary event options;
- `combat_turn`: organically qualified for one immediate targeted-card flow;
- `card_reward_selection`: exact-source and fixture qualified, organic
  lifecycle pending.

The first three organic lifecycles used exact game identity
`v0.108.0|58694f64|-2044609792` under `preview.2`. The currently running game
still has that DLL loaded. Source `preview.3` must be installed in a fresh game
process before its diagnostics, inspection contract, resolver, or card reward
can count as organic evidence.

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

## Active Surface Ownership

Bridge captures the top overlay once. A blocking overlay selects only overlay
providers; otherwise room/turn providers are considered. Exactly one provider
may own the executable surface. Ambiguous ownership, provider failure, or an
unimplemented surface produces no legal actions and a typed diagnostic.

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

`preview.3` exposes only a disabled capability contract:

- `status=disabled_not_implemented`;
- exact-state bound;
- no arbitrary queries;
- no command-ledger entry;
- no hidden visibility;
- no implemented inspection kinds.

Re accepts only that disabled shape. There is no inspection endpoint, result
store, or pile/deck retrieval yet. This is a boundary definition, not a feature.

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
/api/v2/capabilities + /api/v2/state
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
than the disabled contract, the surface is not advertised, context and surface
conflict, diagnostics contradict actions, readiness/completeness is incoherent,
or command identity/status/outcome is inconsistent.

`completed/confirmed` is accepted. `rejected/not_applied` is safely rejected.
`failed/unknown`, `timed_out/unknown`, transport uncertainty after submit, and
poll timeout are unknown and never automatically retried.

## Evidence And Next Step

The next step is not a fifth surface. Build and install `preview.3` while the
game is closed, restart, verify capabilities/state read-only, then run one
bounded card-reward Bridge plus Re lifecycle smoke. A fixture proves client and
serializer behavior only; it does not prove the current game process.

This integration does not add memory, learning, scoring, hidden-information
access, arbitrary MCP calls, generic action payloads, or broad v2 coverage.
