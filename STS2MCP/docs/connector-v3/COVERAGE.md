# Connector V3 Coverage

Evidence never transfers across protocol, SHA, MVID, runtime, game, Modset or
Patch identity.

## Current Source Matrix

| Area | Preview.11 source | Automated evidence | Exact Preview.11 Live |
|---|---|---|---|
| Identity and one owner | direct V3 | identity, owner, stale, replacement tests | build/install/load tuple and main/single-player owner observed |
| Capability/control | V3-native schemas | strict C#/Re/MCP decode and lease tests | capabilities, clients/controller and exact scopes observed |
| Unsupported/settling | typed and authority-free | lifecycle/decoder tests | not re-exercised on final artifact |
| Ordinary combat | direct resolver/Re | play, targetless/targeted potion, end-turn tests | pending |
| Combat hand | direct typed selector/Re | select/deselect/reselect/confirm/peek tests | pending |
| Combat pile | direct source-bound selector/Re | source, membership, stage and command tests | pending |
| Menu/map/event/game-over | direct resolver/Re | owner/entity/control negatives | main-menu open canary only |
| Shop/rest/treasure/reward | direct resolver/Re | offer/source/capacity/Outcome tests | pending |
| Generated choice | source-operation resolver/Re | selectable set, skip and binding tests | pending |
| Upgrade/removal/enchant | independent direct selectors | stage/source/Outcome tests | pending |
| Transform/Wood Carvings | independent direct selectors | source/effect/stage tests | pending |
| Bundle/event removal | independent direct transactions | atomic/whole-Outcome tests | pending |
| Inspection | state-bound run deck/combat piles/shop | strict current/stale tests | final artifact capability only; reads pending |
| Linked detail | state-bound current-Surface card | strict entity/token tests | pending |
| Prompt projection | deterministic compact v1 | projection, hash and payload tests | model call reached; provider network failed |
| Human evidence | default-off native-pages contract | config/CLI/open/read/return/recovery tests | capability and disabled refusal only |
| REST/MCP | transport-only V3 | route/body/schema/Python checks | REST observed; MCP mutation Journey absent |

## Source Closure

- operation catalog: 94 explicit native contracts, 0 fallback authority;
- direct-family Provider action publication: 0;
- Connector V3 `draft.Actions`, `LegacyBinding`,
  `provider_native_binding_adapter` and `BridgeActionDraft` consumption: 0;
- active Re V3 V2 capabilities/state/action sidecar: 0;
- V3 control routes using V2 wire handlers: 0;
- durable qualification and persistent fallback admission: 0.

Exact game-binding, reflection, native Commit and Outcome helpers may remain in
historically named Bridge/Provider files. They are internal mechanics, not
external authority or a second executor.

## Final Preview.11 Runtime

See the
[dated closeout](PREVIEW_11_FREEZE_CANDIDATE_CLOSEOUT_2026-08-03.md) for the
complete exact tuple. On that runtime:

- V3 capability/control/observation and strict Re decoding succeeded;
- `main_menu/open_singleplayer` completed and settled to
  `singleplayer_menu`;
- a prior state/interaction/screen/control tuple returned
  `not_executed/stale_state/not_applied`, retry forbidden;
- polling the same request returned the same receipt and no controller owner
  remained;
- `native_pages.v1` advertised default-off and rejected open with
  `human_equivalence_disabled`;
- a bounded Agent run failed at the first DeepSeek network request and
  submitted no command.

This is loaded/read-only plus one-operation canary evidence. It is not a rare
selector matrix, Journey, Organic qualification or durable support claim.

## Historical Evidence

Preview.5 proved current/stale `run_deck` Inspection and `surface_card`
linked detail for its exact MVID. Preview.7 completed a 202-command ordinary
game. Preview.8 included an unrecorded-provenance completed-game run. Those
records remain useful regression evidence but grant nothing to Preview.11.

## Support And Negative Boundary

The current claim is ordinary vanilla single-player source coverage on the
exact reviewed game identity. Unknown Mods, changed assemblies, unknown
owners/sources and empty scopes remain Fail Closed.

The exact v0.110.1 static audit retains multiplayer-only `Tutor` as a
diagnostic negative holdout because its target-player pile ownership does not
match the single-owner contract. It is unsupported, not fallback debt.

## Authority

- canary-permitted: exact encountered operation/runtime scopes only;
- canary-exercised: `main_menu/open_singleplayer`;
- scoped/durable qualified: none;
- persistent authority: disabled;
- canary never means Surface, origin or sibling-operation qualification.

Status: **FREEZE CANDIDATE**.
