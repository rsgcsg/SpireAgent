# Decision Record Schema

Current schema version: 2. Version 1 remains local historical evidence and is replay-readable as stored JSON, but its old normalized projection is not silently reinterpreted as v2.

Each tick creates one append-only `DecisionRecord`, including non-execution outcomes. Large evidence has stable relative references:

- `preState`: raw ref, normalized state, diagnostics, full-raw stale-guard hash, and normalized projection hash
- `allowedActions`: IDs plus local executable payloads used for audit
- `prompt`: prompt ref, versions, hashes, byte counts
- `llm`: provider/model, all attempts, raw content, parsed decision, validation
- `execution`: selected ID, local payload, stale-state result, adapter response/error
- `settlement`: status, polls, elapsed time, error, plus optional transient-observation count and last safe error code/message when a coherent Bridge state changed during read-only sidecar capture
- `runtimeGuard`: optional exact-transition cycle evidence; a second identical pre-state/action/post-state transition stops the bounded run without rewriting the successful action outcome
- `postState`: raw ref, normalized state, diagnostics, full-raw stale-guard hash, and normalized projection hash
- `outcome`: the terminal classification for this tick

Core outcomes distinguish observation failure, invalid/non-actionable/no-action state, dry run, provider failure, invalid decision, stale state, execution failure, settled execution, and unsettled execution. Adapter results may additionally classify the command as `accepted`, `rejected`, or `unknown`; unknown is never interpreted as safe rejection or retried automatically.

An `observation_failed` record caused by the typed
`state_changed_during_composite_read` race contains no prompt or execution. A
bounded run may continue to a new tick after that exact safe race; generic
transport/decoding observation failures and all pre-execution read failures
remain terminal.

`metadata.json` records adapter endpoint/capabilities, negotiated protocol/build/surface facts when available, provider model/thinking/output cap, agent version, and schema versions. Normalized-state v9 records contain separate semantic `context`, active interaction `surface`, `actionAuthority`, preserved Bridge diagnostics, optional state-bound inspection evidence, player-visible card-selection evidence, and strict Bridge action entity bindings; metadata never records the API key.

The record is evidence of what this process observed and attempted. It is not proof that MCP exposed complete game truth or that a strategic choice was good.
