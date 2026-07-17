# Re-SpireAgent v2 Integration Boundary

In this project, "SpireAgent" means `Re-SpireAgent` by default.

The rebuilt client now implements this boundary. It does not replace its v1
normalizer with raw Bridge v2 JSON; it uses a parallel adapter:

```text
HTTP/MCP v2 response
  -> strict protocol decoder
  -> raw evidence record
  -> typed context + supported-surface projection
  -> Re-SpireAgent NormalizedCurrentState with action authority
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
- verify every command response repeats the submitted request, state, and action
  identity;
- treat both `failed` and `timed_out` as unknown outcomes;
- never auto-retry unknown outcomes;
- permit only one executor during v1/v2 dual-read tests.

Source `2.0-preview.9` has strict projections for `deck_enchant_selection`,
`event_option`, `combat_turn`, `combat_pile_card_selection`,
`combat_hand_card_selection`, `generated_card_choice`,
`card_reward_selection`, and `reward_claim`, plus typed diagnostics and fixed
read-only `run_deck`/`combat_piles` evidence. Qualification is recorded per
observed shape: generated-card choice still lacks fresh preview.9 organic
execution. Run-deck Glam post-state and non-empty draw/discard/exhaust pile
inspection are organically qualified; hidden draw order remains excluded. In
`auto` mode, unsupported v2 surfaces remain on v1 while inspection sidecars may
still add typed player facts; a v2-owned surface imports only bridge actions.
Exact-build or context/surface incompatibility never silently falls back to v1
authority. Runtime and prompt identity always expose `context.kind +
surface.kind + actionAuthority`.

See the rebuilt client's
[Bridge v2 integration contract](../../../Re-SpireAgent/docs/BRIDGE_V2_INTEGRATION.md).
