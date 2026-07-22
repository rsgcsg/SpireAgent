# Re-SpireAgent Engineering Guide

## Purpose

RE-P1 is a minimal LLM-controlled Slay the Spire 2 runtime. It exists to prove a safe and replayable decision loop before memory, learning, strategy scaffolds, or policy governance are reintroduced.

## Non-Negotiable Architecture

```text
untrusted MCP JSON
  -> integration-owned RawState
  -> normalizer-owned StateEnvelope
  -> domain-owned NormalizedCurrentState
  -> deterministic AllowedAction[]
  -> versioned prompt
  -> strict LlmDecision
  -> whitelist and state-hash validation
  -> adapter-owned execution
  -> settlement observation
  -> append-only decision evidence
```

- The LLM is the decision maker. Local code defines safe choices and validates execution; it does not score or secretly choose a strategic action.
- The model chooses an ID, never an MCP payload.
- On a Bridge v2-owned surface, the allowed IDs and executable opaque actions
  come only from the exact current bridge state. Never merge them with v1
  reconstructed actions.
- `NormalizedCurrentState` is the only current-state contract available to planning, prompting, and action generation. Its `context` records semantic game meaning; its `surface` records the active interaction protocol; its `actionAuthority` records who may construct executable actions. Always inspect all three. Do not replace this with one `kind` or combination-specific top-level types.
- Missing and unknown facts stay missing or unknown. Critical missing fields make the state invalid.
- Failures are evidence. They are not hidden by local strategic fallback or JSON repair.

## Module Ownership

- `src/integrations/sts2mcp/`: raw adapter boundary and MCP serialization
- `src/domain/state/`: normalized game semantics and public state union
- `src/domain/actions/`: executable action union and deterministic allowed actions
- `src/normalization/`: the only layer allowed to interpret raw MCP fields
- `src/prompting/`: fixed global contract, state guides, exact runtime payload
- `src/llm/`: provider transport, strict decision schema, redaction
- `src/runtime/`: orchestration, stale-state guard, settlement, bounded loop
- `src/recording/`: evidence schema and append-only local storage
- `src/app/`: CLI composition only
- `src/index.ts`: sole public library entrypoint

Higher layers must not import `integrations/sts2mcp/rawState.ts`. The action builder must not read raw fields. The orchestrator must not contain provider parsing, game-state parsing, or per-screen action logic.

## Adding A State Type

1. Capture a real raw MCP sample without secrets or user-identifying data.
2. Add a minimal fixture under `test/fixtures/mcp-raw/` and document provenance/limitations in `docs/MCP_STATE_COVERAGE.md`.
3. Add or extend a context or surface only when the observed meaning or interaction protocol is genuinely new.
4. Normalize all action-relevant fields and emit diagnostics for inference/defaults/schema drift.
5. Add allowed actions from normalized surface fields only; context may supplement target facts but must not be replaced by raw traversal.
6. Add a state guide that explains schema/action semantics, not hand-written strategy.
7. Add normalization, action, prompt, serializer, stale-state, and recording tests as applicable.
8. Run `npm run check` before real MCP smoke.

Unknown states remain unsupported until these steps are complete.

## Forbidden In RE-P1

- memory, stable knowledge, or learning writes
- action scoring or hidden local strategic selection
- CandidateFuture, DeliberationPacket, shadow/live additive paths, proposal/promotion systems
- direct raw reads outside integration/normalization/recording diagnostics
- LLM-generated MCP payloads or arbitrary tool calls
- execution after invalid JSON, unknown action ID, stale state, or uncertain validation
- parsing code fences, tail text, repaired JSON, or reasoning content as executable decisions
- automatic repeat after settlement timeout
- automatic retry after a Bridge v2 `failed`, `timed_out`, transport-unknown,
  or command-identity-mismatched outcome
- logging headers, API keys, `.env.local`, or secret-bearing errors
- committing `data/runs/`, local provider outputs, or `.env.local`

`loadEnvironment()` and the default `AGENT_DATA_DIR` are anchored to the
`Re-SpireAgent/` project directory, not the caller's working directory. Keep
that invariant when adding CLI tools: `npm --prefix Re-SpireAgent ...` must use
the same local configuration and evidence root as a command launched inside
`Re-SpireAgent/`.

## Maintenance Rules

- Keep types close to their owner; do not create a giant shared `types.ts`.
- Prefer explicit variants and exhaustive switches over optional field bags.
- Version state, prompt, and record schemas independently.
- Any behavior change must update tests and the corresponding doc in `docs/`.
- Keep README commands runnable from a fresh clone.
- Real-game strategy disagreement is not a program bug. Invalid action, stale execution, missing actionable choices, accepted invalid model output, settlement loops, and corrupted evidence are program bugs.
- A known context with an unsupported surface must retain context for audit, set `surface.kind="unsupported"`, and fail closed. A new event ID with a known option protocol remains ordinary event data.
