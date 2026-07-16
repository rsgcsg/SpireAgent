# Bridge v2 Integration

## Current Scope

Re-SpireAgent negotiates STS2MCP Bridge v2 while preserving v1 compatibility.
Only `deck_enchant_selection` has a v2 domain projection and authoritative v2
actions. Every other currently supported Re-SpireAgent surface remains on the
legacy v1 endpoint in `auto` mode.

## Modes

| `STS2_MCP_PROTOCOL` | Behavior |
|---|---|
| `auto` | Negotiate v2. Use v2 as the sole executor for a qualified surface; use v1 for surfaces that v2 explicitly reports unsupported. |
| `v1` | Use only `/api/v1/singleplayer` and locally reconstructed actions. |
| `v2` | Require v2 state. Unsupported or degraded surfaces stop safely. |

`auto` is the default migration mode. It is not a merge of two action lists.
Strict `v2` also rejects any legacy executable action passed directly to the
adapter API.

The adapter records the authority granted by its latest successful state read.
Execution before a read, a v1 action after a v2-owned read, or a v2 action after
a v1-owned read is rejected locally as an authority mismatch.

## Data Flow

```text
/api/v2/capabilities + /api/v2/state
  -> strict Zod protocol decoder
  -> raw v2 evidence wrapper
  -> exact identity and safety-capability validation
  -> deck-enchant domain projection
  -> imported opaque legal actions
  -> DeepSeek selects one allowedActionId
  -> submit request_id + expected_state_id + action_id
  -> verify response identity and lifecycle semantics
  -> poll to completed/rejected/failed/timed_out
  -> append decision evidence
```

When a v2 surface owns the interaction, a v1 sidecar may provide context, run,
or player facts for the prompt. It cannot provide, remove, or execute actions.

## Fail-Closed Rules

Execution is refused when any of these conditions holds:

- protocol version is not exactly supported;
- state and capabilities bridge/game/observation identity differ;
- exact game version, commit, or assembly hash is absent;
- compatibility is not `supported_exact` or execution is disabled;
- hidden-information observation is declared;
- opaque, state-bound, idempotent command guarantees are absent;
- the current surface is not advertised as exact-version implemented;
- legal actions are stale, unknown, non-UI-authoritative, or not advertised;
- ready-state completeness reports missing required semantics;
- command response identity or status/outcome semantics are inconsistent.

`completed/confirmed` is accepted. `rejected/not_applied` is a safe rejection.
`failed/unknown`, `timed_out/unknown`, transport uncertainty after submit, and
client polling timeout are unknown outcomes. Unknown outcomes stop the run and
are never automatically retried.

## Evidence Status

- Bridge deck-enchant behavior has an existing organic exact-build smoke.
- Re-SpireAgent v2 decoding, projection, authority separation, exact identity,
  and command handling have contract/fixture tests.
- A fresh organic Re-SpireAgent-to-game deck-enchant lifecycle is still
  required for end-to-end qualification.

Fixtures prove client behavior only. They do not prove a current game build or
new surface is compatible.

## Non-Goals

This integration does not add memory, learning, scoring, CandidateFuture,
policy promotion, hidden-information access, arbitrary MCP calls, or broad v2
surface coverage.
