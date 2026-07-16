# Re-SpireAgent v2 Integration Boundary

In this project, "SpireAgent" means `Re-SpireAgent` by default.

Do not replace its v1 normalizer with raw Bridge v2 JSON. Add a parallel adapter:

```text
HTTP/MCP v2 response
  -> strict protocol decoder
  -> raw evidence record
  -> supported-surface projection
  -> Re-SpireAgent NormalizedCurrentState variant
  -> AllowedAction from legal_actions
  -> DeepSeek selects allowedActionId
  -> submit expected_state_id + action_id
  -> poll command settlement
  -> before/after decision record
```

Required client behavior:

- reject unknown protocol major versions;
- reject incompatible game/bridge identity for execution;
- stop on unsupported/degraded state unless an explicitly separate v1 fallback
  policy owns authority;
- never infer an index, target, or MCP operation from an action label;
- retain raw request/response and parsed evidence separately;
- treat `started` as pending and `timed_out` as unknown;
- never auto-retry unknown outcomes;
- permit only one executor during v1/v2 dual-read tests.

The first adapter should support only `deck_enchant_selection`. Broader client
types without broader bridge evidence would recreate the same false-completeness
problem in a new layer.
