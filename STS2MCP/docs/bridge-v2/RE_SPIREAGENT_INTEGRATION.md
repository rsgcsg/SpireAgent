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

Source `2.0-preview.30` retains strict purpose-specific projections for
event/rest deck upgrade, event card acquisition, card bundle, game-over,
character select, dialogue/options, and the treasure-room lifecycle. On exact
v0.109, merchant removal, deck upgrade, ordinary combat turn, combat hand
selection, and run-deck Inspection are scoped-qualified; event card
acquisition, reward, card reward, map, shop, treasure, game over, card bundle,
character select, event dialogue, and event option are action canaries. All other historical
contracts remain non-executable on this build unless capabilities explicitly
list them.

In `auto` mode, a v2-owned Surface imports only Bridge actions and top-level
`shared_state` supplies persistent run/player HUD facts. Re does not issue a v1
state read for a Bridge-owned semantic state. Exact identity, shared-state,
context/surface, capability, or authority incompatibility fails closed. Runtime
and prompt identity expose `shared_state + context.kind + surface.kind +
actionAuthority`.

Re requires `shared_state` on every in-run semantic Bridge state, records its
evidence, and validates combat player/potion identities against it. The narrow
pre-run `character_select` Surface instead requires `shared_state=null`.
Shared state creates no actions. Event-option hover semantics remain typed as
text or card previews; unknown variants fail closed. Unsupported legacy-owned states may still use v1 for their complete
Context/Surface contract, but that fallback cannot merge into Bridge authority.

The shop integration preserves affordability separately from authority and
accepts omitted nullable product fields without weakening stocked-product or
action-binding checks. Organic preview.14 evidence covers room open,
inventory close/reopen, one card purchase with sold-out and run-deck post-state,
and Proceed to map. Relic, potion, and removal categories retain separate
qualification. The removal child is a narrow v0.109 candidate Surface, not a
qualified generic selector. Re shares only bounded-selection consistency checks
between enchantment and removal; context compatibility, action kinds,
eligibility, and completion remain separate. Exact-source review found that
selector closure precedes the async merchant transaction, so Bridge completion
now waits for selected-card/deck/gold/counter/service post-state while Re keeps
the same command consumer and stable post-command settlement.

Deck upgrade reuses only non-authoritative bounded-selection facts while
retaining its own eligibility, action set, visible upgraded preview, and exact
upgraded-card completion. Event card acquisition likewise reuses only grid
mechanics: exact event source, run-deck destination, selection constraints,
commit, and same-instance deck completion remain purpose-specific. Brain Leech
one-card commit has current-build evidence; Room Full of Cheese two-card commit
does not. Treasure remains independent from outer rewards:
choose and Proceed have current-build organic completion evidence, while chest
open and relic skip remain unqualified canary variants.

See the rebuilt client's
[Bridge v2 integration contract](../../../Re-SpireAgent/docs/BRIDGE_V2_INTEGRATION.md).
