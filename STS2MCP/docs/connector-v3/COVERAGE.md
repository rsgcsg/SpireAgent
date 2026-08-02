# Connector V3 Coverage

Evidence never transfers across protocol, SHA, MVID, runtime, game or Modset.

| Area | Current source | Automated evidence | Exact V3 Live evidence |
|---|---|---|---|
| Identity and one current owner | implemented | Gateway/Re identity, owner and stale tests | repeated v0.110.1 journeys; Preview.5 exact |
| Visible unsupported | facts plus zero authority | strict decode/normalization and fail-closed tests | Luminous Choir Preview.5 stop |
| Ordinary combat | direct native resolver and Re | play/potion/end-turn tests | play/end-turn repeated; usable Explosive Ampoule publication gap observed |
| Combat-hand selection | direct native resolver and Re | owner/card/control/stage tests | not exercised under Preview.5 |
| Menu/run setup | direct native resolver and Re | exact operand/no-sidecar tests | complete journeys |
| Event/map/reward | direct native resolver and Re | exact owner/entity/stage tests | repeatedly completed |
| Shop/rest/treasure | direct native resolver and Re | offer/control/source/stage tests | repeatedly completed; known-room settling observed |
| Generated card choice | source-discriminated direct resolver and Re | source/owner/card/control tests | Attack Potion choice completed historically |
| Game over | direct native resolver and Re | stage/control tests | complete-run boundary exercised |
| Deck enchant | source-specific native resolver | source/operand tests | Symbiote and Self-Help Book historical; Kifuda pending |
| Smith deck upgrade | direct exact selector and Re | select/deselect/preview/return/confirm/drift | complete Preview.5 lifecycle and semantic upgrade post-state |
| Merchant deck removal | merchant-only direct selector and Re | source/Gold/service/stage/Outcome tests | not reached under Preview.5 |
| Luminous Choir event removal | exact task-local V3-native selector and direct Re | source/stage/membership/whole-transaction witness tests | Preview.6 pending cold load |
| Combat-pile/card-bundle/relic/reward removal | Provider/native migration adapter and V2-shaped Re sidecar | inherited family tests | selected historical families only; direct migration pending |
| V3 Inspection | state-bound `run_deck`, `combat_piles`, `shop_catalog` | serialization, strict decode and stale negatives | Preview.5 `run_deck` current and stale; others pending |
| V3 linked detail | state-bound current-Surface `surface_card` | strict entity/token tests | Preview.5 current and stale exercised |
| V3 MCP | thin V3 transport | syntax/import and lock checks | no current MCP mutation journey |

## Reviewed Preview.5 Evidence

[Preview.5 selector and Inspection evidence](LIVE_EVIDENCE_V0_110_1_PREVIEW_5_SELECTOR_INSPECTION_2026-08-02.md)
belongs to SHA
`b6c28dc5db538ff411c7385519998c85771f5ad3b434d0e8ef31383baf5dbce3`,
MVID `c98dd735-460a-4970-9606-fb6d2ec6a609`, runtime
`7967ab4cb09a46cfaf013f2519ad3b8d`, game `v0.110.1` commit `db5d3552`
and its exact-bridge-only Modset.

Provenance is reviewed interactive Codex direct-V3 coverage. It is not an
Organic run or durable qualification.

The later `run-20260802104257-2ljjp3` used SHA
`dda1e348d7972f42c75768bdde9db5242f332c08bfb739c26fceef96385babcd`,
MVID `7446a1a2-4a7f-44c0-8c5c-ad95651a7ebd` and runtime
`929acc4158874d9daabccc3524fbfc6f`. It completed 80 V3 commands and stopped at
the completed-run menu. Its provenance is `unrecorded`, so it remains scoped
journey coverage rather than Organic qualification.

## Preview.6 Replacement Source

[Preview.6](PREVIEW_6_LUMINOUS_CHOIR_EVENT_REMOVAL_CUTOVER_2026-08-02.md)
is implemented and tested. Build, installed and loaded identity are
per-machine facts; query `npm run doctor` and `npm run verify:loaded` rather
than treating a dated deployment tuple as current. Preview.6 runtime, canary
and Live behavior remain non-claims until its exact tuple is cold-loaded and
exercised.

## Authority And Non-Claims

- Qualified and durable scopes are empty.
- Canary means an exact operation scope admitted for one current runtime and
  source, not qualification of a Surface, operation family or origin.
- Absent/empty scope, unknown source, owner ambiguity, stale identity,
  incompatible Modset and discovery failure are Fail Closed.
- Fixture, build and install do not prove load or Live behavior.
- Preview.5 evidence does not qualify Preview.6.
- Physical UI opening remains an optional evidence profile, not an implicit
  effect of semantic Inspection.
