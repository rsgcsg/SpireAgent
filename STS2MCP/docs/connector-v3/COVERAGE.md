# Connector V3 Coverage

Evidence never transfers across protocol, SHA, MVID, runtime, game, Modset or
Patch identity.

## Current Source Matrix

| Area | Preview.12 source | Automated evidence | Exact Preview.11 Live baseline |
|---|---|---|---|
| Identity and one owner | direct V3 | identity, owner, stale, replacement tests | build/install/load tuple and main/single-player owner observed |
| Capability/control | V3-native schemas | strict C#/Re/MCP decode and lease tests | capabilities, clients/controller and exact scopes observed |
| Unsupported/settling | typed and authority-free | lifecycle/decoder tests | supported settling and typed boundaries observed; three partial-source payloads exposed a Preview.11 misclassification |
| Ordinary combat | direct resolver/Re | play, targetless/targeted potion, end-turn tests | play/end-turn receipts observed; not every potion variant |
| Combat hand | direct typed selector/Re | select/deselect/reselect/confirm/peek tests | select/deselect/reselect observed; confirm produced one correct unknown-no-retry requiring Preview.12 witness repair |
| Combat pile | direct source-bound selector/Re | source, membership, stage and command tests | exact toggle receipt observed; unknown source remained unsupported |
| Menu/map/event/game-over | direct resolver/Re | owner/entity/control negatives | direct actions and completed-game boundary observed |
| Shop/rest/treasure/reward | direct resolver/Re | offer/source/capacity/Outcome tests | shop, rest, reward and room transitions observed; rest witness mismatch quarantined one scope |
| Generated choice | Gateway-local source contract/Re generic mechanics | selectable set, skip, binding, Quasar and holdout tests | Quasar source/trial observed but Preview.11 Re rejected its native `choose` command |
| Upgrade/removal/enchant | independent direct selectors | stage/source/Outcome tests | upgrade, removal and supported enchant receipts observed; unknown enchant source failed closed |
| Transform/Wood Carvings | independent direct selectors | source/effect/stage tests | Wood Carvings reached but controller lease blocked execution; source-unresolved transform remains unsupported |
| Bundle/event removal | independent direct transactions | atomic/whole-Outcome tests | pending |
| Inspection | state-bound run deck/combat piles/shop | strict current/stale tests | final artifact capability only; reads pending |
| Linked detail | state-bound current-Surface card | strict entity/token tests | pending |
| Prompt projection | deterministic compact v1 | projection, hash and payload tests | hundreds of decisions; one provider fetch failure |
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

## Preview.11 Runtime Baseline

See the
[dated closeout](PREVIEW_11_FREEZE_CANDIDATE_CLOSEOUT_2026-08-03.md) for the
complete exact tuple. On that runtime:

- V3 capability/control/observation and strict Re decoding succeeded across
  44 exact-artifact runs and 309 decisions;
- one 203-decision Journey returned through the completed-game boundary;
- a prior state/interaction/screen/control tuple returned
  `not_executed/stale_state/not_applied`, retry forbidden;
- polling the same request returned the same receipt and no controller owner
  remained;
- `native_pages.v1` advertised default-off and rejected open with
  `human_equivalence_disabled`;
- session grants both promoted and quarantined, proving that gray was active;
  failures were not uniformly caused by closed default authority.

This is loaded, direct-command, receipt and one-Journey evidence. It is not
Preview.12 evidence, complete rare-source coverage, Organic qualification,
cross-version/Mod qualification or durable support.

## Historical Evidence

Preview.5 proved current/stale `run_deck` Inspection and `surface_card`
linked detail for its exact MVID. Preview.7 completed a 202-command ordinary
game. Preview.8 included an unrecorded-provenance completed-game run. Those
records remain useful regression evidence but grant nothing to Preview.12.

## Support And Negative Boundary

The current claim is ordinary vanilla single-player source coverage on the
exact reviewed game identity. Unknown Mods, changed assemblies, unknown
owners/sources and empty scopes remain Fail Closed.

The exact v0.110.1 static audit retains multiplayer-only `Tutor` as a
diagnostic negative holdout because its target-player pile ownership does not
match the single-owner contract. It is unsupported, not fallback debt.

## Authority

- canary-permitted: exact encountered operation/runtime scopes only;
- Preview.11 canary-exercised: multiple exact operations across ordinary
  combat and non-combat families;
- scoped/durable qualified: none;
- persistent authority: disabled;
- canary never means Surface, origin or sibling-operation qualification.

Status: **CONDITIONAL FREEZE CANDIDATE**. Preview.12 cold-load and changed-path
evidence are pending.
