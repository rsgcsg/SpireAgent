# Re-SpireAgent v2 Integration Boundary

In this project, "SpireAgent" means `Re-SpireAgent` by default.

Current source contract is `2.0-preview.61`; Re normalized schema is `26`.
Gate 1 is closed as a bounded v2 mutation baseline. Preview.60 remains the last
loaded artifact, so Preview.61 source/build results and its Neow's Fury branch
are not current Organic evidence. Re and the default MCP adapter are v2-only;
the complete Gateway v1 namespace is retired.

The rebuilt client implements this boundary through a strict adapter rather
than consuming raw Bridge JSON in planning code:

```text
Bridge v2 REST response (current Re path)
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

The Python MCP server is an optional adapter for MCP clients and is not in
Re-SpireAgent's strict-v2 path. The canonical ownership split is in
[LIVE_GAME_CONNECTION_BOUNDARY.md](LIVE_GAME_CONNECTION_BOUNDARY.md).

Re's game-connection responsibilities are limited to negotiation, strict
decoding, coherent structural projection, advertised-action import,
submission/polling, and exact identity/evidence recording. Re must not grow
strict-v2 game legality, native Commit logic, transaction inference, Witness
reconstruction, permission, or live-versus-Headless content branches.

Required client behavior:

- reject unknown protocol major versions;
- reject incompatible game/bridge identity for execution;
- stop on unsupported/degraded state; Re has no v1 fallback policy;
- never infer an index, target, or MCP operation from an action label;
- retain raw request/response and parsed evidence separately;
- treat `started` as pending and `timed_out` as unknown;
- verify every command response repeats the submitted request, state, and action
  identity;
- treat both `failed` and `timed_out` as unknown outcomes;
- never auto-retry unknown outcomes;
- permit only one action-capable Re process through its runtime lock.

Source `2.0-preview.47` additionally requires strict decoding of the bounded
visibility declaration, state-bound Inspection catalog, coherent observation
bundle, and non-authorizing contract-instance shadow. Re may use the bundle to
avoid mixed-checkpoint sidecars, but Inspection remains outside the command
ledger. The shadow must never add, suppress, or reinterpret an action. Nullable
contract/binding IDs may be absent for unresolved transition states.

Source `2.0-preview.31` retains strict purpose-specific projections for
event/rest deck upgrade, event card acquisition, card bundle, game-over,
character select, dialogue/options, and the treasure-room lifecycle. On exact
v0.109, merchant removal, deck upgrade, ordinary combat turn, combat hand
selection, and run-deck Inspection are scoped-qualified; event card
acquisition, reward, card reward, map, shop, treasure, game over, card bundle,
character select, event dialogue, and event option are action canaries. All other historical
contracts remain non-executable on this build unless capabilities explicitly
list them.

Re imports only Bridge actions, and top-level `shared_state` supplies persistent
run/player HUD facts. Re does not issue v1 state reads. Exact identity, shared-state,
context/surface, capability, or authority incompatibility fails closed. Runtime
and prompt identity expose `shared_state + context.kind + surface.kind +
actionAuthority`.

Re requires `shared_state` on every in-run semantic Bridge state, records its
evidence, and validates combat player/potion identities against it. The narrow
pre-run `character_select` Surface instead requires `shared_state=null`.
Shared state creates no actions. Event-option hover semantics remain typed as
text or card previews; unknown variants fail closed. Unsupported legacy-owned
states remain fail closed in Re; historical v1 records do not grant Agent
authority.

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
