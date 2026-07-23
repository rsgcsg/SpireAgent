# Bridge v2 Current Status

This is the canonical current status for the Gateway and Re connector boundary.
Historical preview reports are preserved in
[`../../../archive/bridge-v2-previews/`](../../../archive/bridge-v2-previews/)
and do not grant current authority.

## Current Source-Truth Status

The C# Bridge and Re-SpireAgent now share `2.0-preview.59`. Preview.59 retains
the Preview.57 source-truth repair discovered during cold-start verification:
the previous
identity gate used `release_info.json.main_assembly_hash=-840572606`, while
the game's own `AssemblyHasher` proved the loaded arm64 assembly is
`-1639417500`. `game.main_assembly_hash` now reports and authorizes only the
actual runtime value; `release_declared_main_assembly_hash` keeps the release
claim as non-authorizing diagnostic provenance. C# derives explicit
`surface_kind + operation + tier` scopes from the exact-build manifest,
advertises only those operations, and publishes a path-free SHA-256 for its
loaded assembly. Re decodes the same contract. Preview.58 additionally binds
exact Seance and `CardRemovalReward` child transactions without granting
generic card-selection authority. Preview.59 adds exact Dredge as a
source-scoped bounded multi-selection branch with separate intermediate and
exact-batch completion; it does not grant a generic selector. Preview.56 remains the
coordinated Wood Carvings deterministic replacement contract; it does not revive the
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

That historical lifecycle captured version/commit and the release-declared
hash, not the actual loaded game assembly hash. Preview.59 records the actual
value. The current loaded artifact is SHA `afbcc870...17423`, MVID
`49d2408c-7a43-4669-b37d-6c8f33308c48`, runtime
`844706b0442e443db974f156103d7a00`, under the exact Bridge-only Modset. It has
a bounded Re mutation journey for Dredge selection. This does not transfer
Gate 0 qualification or widen any operation scope.

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

A later fresh Re run recorded a map action with a contradictory pre-state: the
visible map point was `Travelable`, while `RunState.VisitedMapCoords` already
contained its exact coordinate. The source audit confirms that native map travel
ultimately calls `EnterMapCoord`, which no-ops for an already visited coordinate.
The command therefore timed out as `unknown` without retry; it is neither a
successful transition nor a normal-map regression. Current source suppresses
that contradictory map surface before action publication and repeats the same
run-state check at execution. Historical evidence loaded Release SHA
`386885c7...576df7` as MVID `d307fd3c-4235-42ab-9fb9-ad7bf5714b6f` and
runtime `696eb3ae18f74d2bb1815cef9e554a6a`; it is not the current artifact.
That evidence confirmed installation and loading, but an ordinary-map canary
still has not exercised
the contradictory-coordinate repair. Permission remains canary-only and
unchanged.

Those runs also revealed a Re bounded-loop hygiene issue: a coherent,
non-actionable `event_option` snapshot with no advertised actions could repeat
until `--max-ticks`. Re now records and stops on the eighth identical
non-actionable observation without asking the provider or executing anything.
It is a consumer-side stop guard only; the underlying unsupported/settling
event remains neither action-authorized nor v2-qualified.

Fresh runs then separated three source contracts that happen to reuse card-grid
mechanics. Cleanse completed a real exact draw-to-exhaust child in
`run-20260723105825-69ohhl`. Two Seance children in
`run-20260723105904-z3sy3r` and `run-20260723105825-69ohhl` failed closed
because Seance had no exact source binding. Source audit proves Seance transforms
one draw-pile card into a new `Soul` at the same pile index. Preview.58 adds that
source discriminator, operation, and exact completion witness while retaining
the existing `combat_pile_card_selection` mechanics. It is installed, loaded,
and canary-scoped, but has no current-artifact Organic child action yet.

Run `run-20260723113740-hafl26` then failed closed on exact Dredge. Source audit
proved that Dredge selects a dynamic one-to-three discard-card batch, toggles a
visible selected set without manual confirmation, and automatically moves the
completed batch to hand. Preview.59 keeps the shared native selector mechanics
but adds independent Dredge source, purpose, operation, and completion
semantics. A current-build operator-directed Re canary exercised select,
deselect, two intermediate selections, and final exact-three batch movement
from discard to hand. Dredge remains canary-only. See the
[Dredge closeout](GATE1_DREDGE_CLOSEOUT_2026-07-23.md). Every other unbound
origin remains fail closed.

The same evidence set distinguished two non-merchant deck-removal sources.
Precise Scissors remains the independent `relic_deck_removal_selection` canary
and still lacks an Organic lifecycle. Forbidden Grimoire creates a
`CardRemovalReward` after combat; its reward task, not the producer card, is the
source authority. Preview.58 therefore adds the independent
`reward_deck_removal_selection` Surface rather than aliasing merchant or relic
permission. A bounded current-build Re canary completed reward claim, exact-card
selection, preview, confirmation, semantic command completion, successor reward
state, and a `run_deck` post-state with the selected card absent. See the
[Seance and reward-removal closeout](GATE1_SEANCE_AND_REWARD_REMOVAL_CLOSEOUT_2026-07-23.md).

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
All three are repaired without changing permission scope. That repair artifact
was loaded as SHA `61e659c7...de97`, MVID
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

Run bounded natural Seance and Precise Scissors completion canaries on the
Preview.58 contract. Continue the exact-identity journey only after those
results are recorded. The next known fail-closed candidates remain
Crystal Sphere and manual potion discard outside reward handling. Track the
recurring combat stale-state pre-dispatch rejections as a throughput
observation, but do not weaken state-bound validation or retry rejected
actions. Close only bounded contracts and do not convert canary support into
qualification without repeated current exact-build Organic evidence.
