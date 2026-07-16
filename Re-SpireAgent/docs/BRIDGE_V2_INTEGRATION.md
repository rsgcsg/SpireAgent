# Bridge v2 Integration

## Current Scope

Re-SpireAgent supports the `2.0-preview.2` source contract for:

- `deck_enchant_selection`: organically end-to-end qualified;
- `event_option`: organically end-to-end qualified for ordinary event options;
- `combat_turn`: organically qualified for an immediate player-phase targeted
  card lifecycle.

The qualified event lifecycle used the exact supported `2.0-preview.2` game
binding. Unlisted surfaces remain legacy v1 in `auto` mode and unsupported in
strict `v2` mode.

The Bridge-side three-surface architecture audit is canonical for the next
protocol step:
[`COMPOSITION_INSPECTION_DIAGNOSTICS_AUDIT_2026-07-16.md`](../../STS2MCP/docs/bridge-v2/COMPOSITION_INSPECTION_DIAGNOSTICS_AUDIT_2026-07-16.md).

## State Identity

No single kind represents the full current state. Runtime output and prompts
carry:

```text
context.kind + surface.kind + actionAuthority
```

- context: semantic game situation (`event`, `combat`, etc.);
- surface: currently blocking interaction protocol;
- authority: `bridge_advertised`, `local_reconstruction`, or `none`.

For Bridge combat, v2 context owns action-relevant player, hand, resource,
enemy, intent, and target facts. A v1 sidecar may retain run metadata but cannot
overwrite those facts or add actions.

## Composition Boundary

Re-SpireAgent consumes exactly one active action-owning surface. A verified
blocking overlay replaces the active surface while preserving its semantic
context; the underlying surface contributes no actions. Re never merges actions
from a suspended surface, a v1 sidecar, or two Bridge providers. Bridge owns
surface precedence and must fail closed on ambiguous ownership.

The Bridge should centralize that routing before adding its fourth surface. The
Re normalizer can remain an explicit set of strict surface decoders; it does not
need a generic plugin registry merely because Bridge routing becomes explicit.

## Inspection And Diagnostics Boundary

Read-only deck/pile inspection is a separate state-bound capability. It is not a
legal action, command-lifecycle event, arbitrary raw query, or field copied into
every immediate state. Re must record an inspection result separately and retain
its visibility and ordering semantics. Draw-pile contents may be an unordered or
player-sorted multiset; hidden draw order and RNG remain excluded.

Future typed Bridge diagnostics must be preserved for audit. Re may fail closed
on malformed or action-suppressing effects, but it must not infer authority from
severity or from the absence of warnings. Unknown namespaced codes may remain
auditable when their structural effect is valid.

## Modes

| `STS2_MCP_PROTOCOL` | Behavior |
|---|---|
| `auto` | Negotiate v2. Use v2 as sole executor for a qualified surface; use v1 only when a coherent exact v2 response explicitly says unsupported. |
| `v1` | Use only v1 and `local_reconstruction` authority. |
| `v2` | Require v2. Unsupported, degraded, mismatched, or unknown contracts stop safely. |

The adapter also remembers the authority from its latest successful read.
Executing a legacy action after a v2-owned read, or a v2 action after a legacy
read, is rejected locally.

## Data Flow

```text
/api/v2/capabilities + /api/v2/state
  -> strict Zod protocol decoder
  -> exact identity and safety checks
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
information is declared, command safety guarantees are absent, the surface is
not advertised, context and surface conflict, readiness/completeness is
incoherent, an action is not state-bound/UI-authoritative/advertised, or command
identity/status/outcome is inconsistent.

`completed/confirmed` is accepted. `rejected/not_applied` is safely rejected.
`failed/unknown`, `timed_out/unknown`, transport uncertainty after submit, and
poll timeout are unknown and never automatically retried.

## Evidence Status

- Deck enchant: organic Bridge and Re select/preview/confirm lifecycle passed.
- Event option: organic Bridge and Re choose/settlement lifecycle passed for
  an ordinary `SUNKEN_STATUE` option.
- Combat turn: C# build plus Re decode/projection/authority fixture passed.
- Combat turn: organic Bridge and Re targeted-card/settlement lifecycle passed
  against a visible normal-combat enemy.
- These qualifications do not extend to ancient dialogue, unimplemented
  overlays, every card target type, potion use, or all combat phase changes.

## Non-Goals

This integration does not add memory, learning, scoring, hidden-information
access, arbitrary MCP calls, generic action payloads, or broad v2 coverage.
Read-only deck/pile inspection remains a separate future protocol concern.

## Next Surface

The next selected Bridge slice is ordinary
`reward_flow + card_reward_selection`. Every visible enabled reward alternative
must retain its own visible semantics; neither Bridge nor Re may reduce the
first `NCardRewardAlternativeButton` to an assumed `skip` boolean. This is a
planned slice, not current support.
