# Connector V3 Coverage

Evidence never transfers across protocol, SHA, MVID, runtime, game or Modset.

| Area | Preview.9 source | Automated evidence | Exact V3 Live evidence |
|---|---|---|---|
| Identity and one owner | implemented | identity, owner, stale and replacement tests | repeated historical journeys; Preview.9 pending |
| Visible unsupported/settling | typed and authority-free | strict decode and lifecycle tests | known-room settling and unknown-owner stops observed historically |
| Ordinary combat | direct native resolver/Re | play, potion, target and end-turn tests | play/end-turn repeated; targetless potion fix pending Live |
| Combat-hand selection | direct typed resolver/Re | select/deselect/reselect/confirm/peek negatives | select/confirm historical; remaining stages pending |
| Combat-pile selection | direct typed source/selector/Re | exact source, membership, stage and command-set tests | historical source only; Preview.9 direct pending |
| Menu/map/event/game-over | direct resolver/Re | exact owner/entity/control and command-set tests | repeatedly completed under earlier artifacts |
| Shop/rest/treasure/reward | direct resolver/Re | offer, source, capacity, stage and Outcome tests | repeatedly completed under earlier artifacts |
| Generated card choice | direct typed source/operation resolver/Re | exact selectable set, source-operation, skip and owner tests | Attack Potion historical; Preview.9 parity pending |
| Deck enchant/upgrade/removal | source-specific direct resolver/Re | full selector stages, source isolation and Outcome tests | several historical exact sources; siblings remain scoped |
| Deck transform | direct source-distinct resolver/Re | select/deselect/preview/cancel/confirm tests | Preview.9 pending |
| Wood Carvings | direct deterministic replacement resolver/Re | branch, replacement, membership and Outcome tests | Preview.9 pending |
| Card bundles/event removal | independent direct contracts/Re | atomic bundle and whole-transaction tests | historical source evidence; current artifact pending |
| V3 Inspection | state-bound run deck/combat piles/shop catalog | strict content and stale negatives | Preview.5 run-deck current/stale; other kinds pending |
| V3 linked detail | state-bound current-Surface card | strict entity/token tests | Preview.5 current/stale exercised |
| V3 MCP | thin transport | syntax/import/lock checks | no current MCP mutation journey |

## Source Closure

- operation catalog: `94` explicit native contracts, `0` fallback authority;
- direct-family Provider `BridgeActionDraft` publication: `0`;
- Connector V3 `draft.Actions`, `LegacyBinding` and
  `provider_native_binding_adapter` consumption: `0`;
- Re Connector V3 V2 capabilities/state sidecar: `0`;
- durable qualification and persistent fallback admission: `0`.

Exact game-binding and native Commit helpers may remain in historically named
Provider files. They are internal Gateway mechanics, not action publication,
external protocol authority or a second execution path.

The exact `v0.110.1` static audit retains `Tutor` as a diagnostic-only negative
holdout. It is `MultiplayerOnly` and binds the selector to
`cardPlay.Target.Player`, so the ordinary source-card-owner contract must not
authorize it. Supporting it requires a distinct participant ownership,
player-visible target and semantic Outcome contract plus current-MVID Live
evidence. It is not a single-player fallback contract.

## Reviewed Preview.8 Archive

The supplied archive records protocol `3.0-preview.8`, SHA
`26c5baaeaa24cfe6e8665693c4e7e45486df45f8cab65a2d74ebc2d6bac2e529`,
MVID `d1476ec1-4da8-4658-b594-6fea40de3ca0`, runtime
`ddc07fa2e35b4d588f9ebc73283d2044`, game `v0.110.1` commit `db5d3552` and the
exact-bridge-only Modset. One run stopped safely after an exact binding became
unavailable; another settled 11 commands and reached completed-game state.

Provenance is `unrecorded`. This is exact-artifact journey coverage only, not
Organic qualification, durable authority or evidence for Preview.9.

## Preview.9 Build/Install

Release build and installed DLL match SHA
`540acf9658b3bf04b2e094f3778453e063088aa8af560b67ea35b317c5a39d49`, MVID
`afa5d986-d82d-4a01-b2ab-5509e3926f61`. STS2 was closed, so loaded identity,
runtime instance, canary, journey and qualification remain non-claims.

## Authority And Non-Claims

- Qualified and durable scopes are empty.
- Canary is one exact operation on one current runtime/source, never a whole
  Surface, origin or sibling operation.
- Empty scope, unknown source, owner ambiguity, stale identity, incompatible
  Modset and discovery failure are Fail Closed.
- Build/install do not prove load or Live behavior.
- Physical UI opening remains an optional evidence profile, not an implicit
  effect of semantic Inspection.
