# Decision Record Schema

Current decision-record schema: `2`. Current normalized-state schema: `32`.
Older local records remain readable as historical JSON; they are not silently
reinterpreted as current Player Environment evidence.

Each tick appends one `DecisionRecord`, including non-execution outcomes:

- `preState`: raw reference, normalized state and stale-guard hashes;
- `allowedActions`: local opaque choices and their exact `bound_action_id`;
- `prompt`: versions, hashes and byte counts;
- `llm`: provider/model attempts, parsed decision and validation;
- `execution`: selected local choice, submission result and error;
- `settlement`: bounded successor polling and stable-checkpoint status;
- `runtimeGuard`: repeated-transition evidence used only for liveness;
- `postState`: successor evidence when available;
- `outcome`: terminal classification for the tick.

`delivered` proves only native input delivery. Re then observes successor
Snapshots without reconstructing native completion. `not_delivered` invalidates
the old action. `unknown`, transport uncertainty or receipt mismatch stops
without retry. Read-only transient Snapshot races may obtain a fresh Snapshot;
mutation uncertainty is never treated as a safe rejection.

`metadata.json` records the adapter endpoint, protocol/artifact/runtime/game/
Modset identity when available, provider configuration excluding secrets,
Agent version, schema versions and declared evidence provenance. Historical
metadata lacking current identity fields is explicitly identity-incomplete.

The record proves only what this process observed, selected and submitted. It
does not prove complete UI coverage, strategic quality, a loaded artifact or a
successful journey by itself.
