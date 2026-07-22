# Bridge v2 Current Status

This is the canonical current status for the Gateway and Re connector boundary.
Historical preview reports are preserved in
[`../../../archive/bridge-v2-previews/`](../../../archive/bridge-v2-previews/)
and do not grant current authority.

## Current Source-Truth Status

The C# Bridge and Re-SpireAgent now share `2.0-preview.56`. C# derives explicit
`surface_kind + operation + tier` scopes from the exact-build manifest,
advertises only those operations, and publishes a path-free SHA-256 for its
loaded assembly. Re decodes the same contract. Preview.56 is the coordinated
Wood Carvings deterministic replacement contract; it does not revive the
rejected Discovery experiment, and unknown generated-card sources remain
rejected.

Gate 0 is now closed on the exact loaded artifact recorded in
[the Gate 0 closeout](CONNECTOR_G0_CLOSEOUT_2026-07-22.md). Re completed
`main_menu -> singleplayer_menu -> main_menu` through advertised opaque
actions, Bridge command completion, and coherent successor observations under
one SHA/MVID/runtime identity. A later current-runtime recheck on the final
SHA `61e659c7...de97`, MVID `35c2e71e-66bc-4423-9191-3f00c404c2ad`, and runtime
`7d19e21d5ee84105b32988aabadacc69` repeated that exact two-action round trip:
both commands settled after one poll. It rechecks the existing `main_menu` and
`singleplayer_menu` canary boundary only; it does not widen permission or
promote a tier.

## Required Repair Order

1. Maintain the machine-checked remaining v1 ownership inventory per operation
   and coherent journey.
2. Close normal-run v2 coverage and visible-information gaps one exact
   operation at a time, preserving current permission tiers.

The current inventory and first Gate 1 runtime repair are recorded in
[Gate 1 Operation And Journey Inventory](GATE1_OPERATION_AND_JOURNEY_INVENTORY.md).
The fresh exact-identity run proved standard run entry through Neow and map,
ordinary combat completion, ordinary reward/card-reward handling, and return
to an actionable map. It also exposed and closed a Re-side settlement bug:
transient `unknown/unsupported` observations no longer count as semantic successor
checkpoints, and opaque v2 map actions now receive the room-transition timeout.
No Gateway capability or permission tier changed.

The next exact-identity map journey found the first real fail-closed gap at
`WoodCarvings.Bird -> NDeckCardSelectScreen`. Preview.56 now source-binds Bird
and Torus separately and exposes a purpose-specific deterministic replacement
Surface. The Bird Organic canary exercised select, preview cancel, reselect,
confirm, event successor, and run-deck post-state under loaded SHA
`8ad08daa...36a0`, MVID `00124a4c-6046-45dd-b77a-8e83e80faece`, and runtime
`f881814b6b7a4492849d069d3236261e`. This is canary evidence, not qualification;
see [the closeout](GATE1_WOOD_CARVINGS_CLOSEOUT_2026-07-22.md).

The post-Wood intermediate artifact replaced local replacement-ID literals with
exact `ModelDb` identities and was Steam-loaded as SHA `c9127d63...b117`, MVID
`d5ae09de-cea9-4faf-818c-919f828c7eed`, runtime
`aa43cb8b6bff4aa6871962caacd53802`. The earlier Organic canary did not transfer
to that artifact. A separate Re canary proved `continue_run`
settlement in 11 polls / 2333 ms after Re assigned native load actions the
bounded long-transition budget; no Gateway permission or completion changed.

Fresh user runs then exposed three connector defects: impossible Headbutt/
Graveblast aggregate-count completion, same-state shop Inspection advertisement
without its exact merchant binding, and unexpanded player-visible power text.
All three are repaired without changing permission scope. The current final
artifact is loaded as SHA `61e659c7...de97`, MVID
`35c2e71e-66bc-4423-9191-3f00c404c2ad`, runtime
`7d19e21d5ee84105b32988aabadacc69`. A 100-decision predecessor-artifact run
proved the shop and dynamic-text paths; final-artifact runs then reconfirmed
dynamic text and command lifecycle and completed Headbutt draw-top three times
plus Graveblast hand selection twice with exact-card semantic witnesses. These
are current-build combat-pile canary results, not a tier promotion. See the
[real-run defect closeout](GATE1_REAL_RUN_DEFECT_CLOSEOUT_2026-07-22.md).

The detailed audit and migration sequence is
[REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md](REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md).

## Current Safety and Scope

- v2 keeps one Active Surface owner, opaque state-bound actions, shared
  publication/execution legality, main-thread commit, semantic completion,
  unknown-no-retry, independent read-only Inspection, and exact-environment
  capability scoping.
- Re has no v1 mutation transport. Gateway v1 reads remain explicit legacy
  compatibility; all Gateway v1 POST routes are disabled by default and require
  the local `enable_legacy_v1_mutations=true` compatibility setting.
- REST is Re's current transport. The Python MCP server is optional and must
  not become a second legality/completion engine.
- The current HTTP listener is a developer preview, not a consumer-safe
  authorization boundary: it lacks Gateway authentication, controller lease,
  and restart epoch semantics.

## Evidence Vocabulary

Source audit, fixture/unit test, Release build, installation, loaded module,
canary, and Organic Qualification are separate evidence classes. A successful
fixture, static build, old MVID, or historical v1 journey cannot be promoted to
a current v2 permission claim.

## Next High-Value Work

Continue the exact-identity journey until the next real unsupported semantic
variant. The next known fail-closed candidates remain Crystal Sphere and manual
potion discard outside reward handling. Track the recurring combat stale-state
pre-dispatch rejections as a throughput observation, but do not weaken
state-bound validation or retry rejected actions. Close only bounded contracts
and do not convert canary support into qualification without repeated current
exact-build Organic evidence.
