# Connector V3 Coverage

Evidence never transfers across protocol, SHA, MVID, runtime, game, Modset or
Patch identity.

## Current Source Matrix

| Area | Current source | Automated evidence | Exact Preview.12 Live baseline |
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
| Upgrade/removal/enchant | independent direct selectors plus reviewed enchant-source registry | stage/source/Outcome, Royal Stamp and source-partition tests | upgrade, removal and Symbiote enchant receipts observed; Royal Stamp was repeatably unsupported before the amendment |
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

## Preview.12 Runtime Baseline

See the Preview.12
[dated closeout](PREVIEW_12_CONDITIONAL_FREEZE_CLOSEOUT_2026-08-03.md) and
[adaptation amendment](../../../docs/current/audits/CONNECTOR_V3_ADAPTABILITY_AMENDMENT_AND_LAYERED_FREEZE_VERDICT_2026-08-03.md).
On its exact runtime:

- five retained runs include three completed-game boundaries and two
  repeatable Royal Stamp source-contract failures;
- the three completed runs total 242 decisions: 238 settled, one safe stale
  refusal and three correct completed boundaries;
- a prior state/interaction/screen/control tuple returned
  `not_executed/stale_state/not_applied`, retry forbidden;
- polling the same request returned the same receipt and no controller owner
  remained;
- `native_pages.v1` advertised default-off and rejected open with
  `human_equivalence_disabled`;
- session grants both promoted and quarantined, proving that gray was active;
  failures were not uniformly caused by closed default authority.

This is loaded, direct-command and receipt evidence for the old Preview.12
artifact. It is not evidence for the source-registry amendment, complete rare-
source coverage, Organic qualification, cross-version/Mod qualification or
durable support.

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

Status: **CONDITIONAL FREEZE CANDIDATE**. The source-registry amendment cold-
load and one exact ordinary journey are verified; the Royal Stamp source canary
and remaining rare-family evidence are pending.
The amendment is built and installed at SHA `c9f61d76...e72b24`, MVID
`2b388d99-5a1b-46a7-9626-029a679deba0`; the first post-amendment Re run used
this older Gateway identity and failed before Commit. The corrected artifact
is installed at SHA `1c0e2d82...c20c97`, MVID
`fd3177e5-bc0c-4acd-8097-ea237957a152`; the loaded and Live fields in this
historical status were non-claims before the exact-runtime addendum below.

The corrected artifact was then cold-loaded and used by
`run-20260803144301-4vnzxu` under runtime
`867402a815084c54b6d9eb0d9973aa80`, game `v0.110.1 / db5d3552 /
-205573697`, and `exact_bridge_only` Modset. The run produced 103 direct V3
settled commands with an available successor and `retry.allowed=false`,
including combat, event, map, reward, rest and deck-upgrade selection; it
ended only after game-over returned to the top-level menu. The two
non-actionable event observations and final `run_boundary` are expected
supervision behavior. This proves the repaired authority path in one exact
runtime session; it does not create a durable qualification or prove
unexercised source families.
