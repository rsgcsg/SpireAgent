# Decision Record Schema

Current schema version: 2. Version 1 remains local historical evidence and is replay-readable as stored JSON, but its old normalized projection is not silently reinterpreted as v2.

Each tick creates one append-only `DecisionRecord`, including non-execution outcomes. Large evidence has stable relative references:

- `preState`: raw ref, normalized state, diagnostics, full-raw stale-guard hash, and normalized projection hash
- `allowedActions`: IDs plus local executable payloads used for audit
- `prompt`: prompt ref, versions, hashes, byte counts
- `llm`: provider/model, all attempts, raw content, parsed decision, validation
- `execution`: selected ID, local payload, stale-state result, adapter response/error
- `settlement`: status, polls, elapsed time, error
- `postState`: raw ref, normalized state, diagnostics, full-raw stale-guard hash, and normalized projection hash
- `outcome`: the terminal classification for this tick

Core outcomes distinguish observation failure, invalid/non-actionable/no-action state, dry run, provider failure, invalid decision, stale state, execution failure, settled execution, and unsettled execution.

`metadata.json` records adapter endpoint/capabilities, provider model/thinking/output cap, agent version, and schema versions. v2 records contain separate semantic `context` and active interaction `surface`; it never records the API key.

The record is evidence of what this process observed and attempted. It is not proof that MCP exposed complete game truth or that a strategic choice was good.
