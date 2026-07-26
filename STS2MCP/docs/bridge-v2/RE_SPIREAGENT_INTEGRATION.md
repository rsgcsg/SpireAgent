# Re-SpireAgent v2 Integration Boundary

In this project, "SpireAgent" means `Re-SpireAgent` by default.

Current source contract is `2.0-preview.66`; Re normalized schema is `26`.
Gate 1 is closed as a bounded ordinary-single-player v2 connector baseline.
Preview.61 supplied the exact Neow's Fury Organic lifecycle; Preview.62 adds
reviewed compatibility/source registries and policy provenance without
inheriting that runtime qualification. Re and the default MCP adapter are
v2-only; the complete Gateway v1 namespace is retired.

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
  -> lazy client registration + controller lease
  -> submit expected_state_id + action_id + controller generation
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
- validate the permission runtime epoch, Patch inventory and each current
  dynamic grant without becoming a permission decision point;
- stop on unsupported/degraded state; Re has no v1 fallback policy;
- never infer an index, target, or MCP operation from an action label;
- retain raw request/response and parsed evidence separately;
- treat `started` as pending and `timed_out` as unknown;
- verify every command response repeats the submitted request, state, and action
  identity and admitted controller attribution;
- treat both `failed` and `timed_out` as unknown outcomes;
- never auto-retry unknown outcomes;
- permit only one action-capable Re process through its runtime lock.

Preview.64 keeps Re's local runtime lock as process-local hygiene while adding
Gateway-wide coordination across Re, MCP and other local mutation clients.
Read-only observation does not register or acquire control. Immediately before
the first mutation, Re registers descriptive process metadata, acquires the
one runtime-bound controller lease, renews it while active, attaches its lease
ID and generation to each command, and releases it best-effort on shutdown.
Gateway restart or lease replacement makes cached credentials stale. This is
not authentication and Re does not decide whether another client may take
control.

Preview.65 keeps qualification authority in the Gateway. Re strictly decodes
the operation identity catalog and exact qualification projection, then
requires each persistent scope to link to one applicable `qualified` package.
It does not install, approve, revoke, roll back, or persist packages. A
`session_canary` package only makes the exact operation eligible for the
Gateway's existing volatile canary state machine.

Preview.66 permits exact packages for the same operation to coexist across
multiple environments. Re sees only the Gateway's current exact operation
projection; it does not consume the local Profile registry or migration plan
as authority. Its explicit `--allow-run-entry` experiment flag may choose only
a current `bridge_advertised` top-level entry action. Default runs remain
one-game bounded. The current projection contains five explicit
high-precision operation contracts plus 82 conservative manifest-derived
fallback identities. Re decodes the fallback boundary but never interprets
the witness or promotes a package; the Gateway remains the only completion and
permission authority.

Re accepts mixed operation tiers on one Surface. For example,
`main_menu/open_singleplayer` may be persistent-qualified while
`main_menu/continue_run` is session-canary. The Surface support tier is only a
coarse projection; Re validates every advertised action against the exact
operation scope and unique current package or grant. No sibling authority is
inferred.

Preview.63 keeps the permission decision and enforcement in the Gateway. Re
requires state and capabilities to agree on the stable
`surface + operation + tier` authorization set, while independently validating
each response's exact grant binding. This allows a negotiated capability's
session-canary grant to be superseded after semantic completion without
accepting a different operation or tier. Every dynamic scope must reference
the unique current active grant for the same Surface/operation, runtime epoch,
exact environment, Patch digest and operation fingerprint. Historical
superseded/revoked grant records remain read-only audit evidence and never
create an allowed action.

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
