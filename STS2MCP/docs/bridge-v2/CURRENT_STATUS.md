# Bridge v2 Current Status

This is the canonical current status for the Gateway and Re connector boundary.
Historical preview reports are preserved in
[`../../../archive/bridge-v2-previews/`](../../../archive/bridge-v2-previews/)
and do not grant current authority.

## Current Source-Truth Status

The C# Gateway and Re-SpireAgent source now share contract
`2.0-preview.65`; Re normalized schema is `26`. Gate 1 is closed as a bounded
ordinary-single-player v2 connector baseline:

- Re and the default Python MCP adapter submit only advertised Bridge v2
  actions;
- the entire Gateway `/api/v1` namespace is retired and returns `410 Gone`;
- historical v1 state/action/profile/wiki source is outside the active build;
- unsupported Crystal Sphere, standalone manual potion discard, non-standard
  menu/profile flows, multiplayer, and unknown selector origins remain
  explicit fail-closed or out-of-scope rows.

Run `run-20260724045013-mgcq3a` completed the exact Neow's Fury play,
selection and manual-confirm lifecycle under Preview.61. The exact loaded
identity was:

```text
SHA     9b6f62161f8c6c286a73cb157430b441014c5148ff702ea96894e6f702386a99
MVID    efd31a31-9c2a-4b68-ae22-1cabc1b382f1
runtime 7e6ffb41d8154625bd42ea34190194ef
game    v0.109.0|c12f634d|-1639417500
Modset  exact_bridge_only
```

The final command completed only after source-task closure, child closure and
exact selected-card movement from discard to hand. This closes the prior Gate 1
runtime seal.

Preview.62 added reviewed embedded combat-pile source and exact-environment
policies, policy ID/digest provenance, and a non-authorizing exact-assembly
audit. Source-specific C# bindings for the proven combat-pile family are
retired. Six newly discovered owner-bound sources are registry canary
candidates; Tutor remains fail closed because it selects from
`cardPlay.Target.Player`. Preview.62 source/tests/audit do not inherit
Preview.61 Organic qualification.

The Preview.62 post-closeout adaptation slice kept its wire contract and all
permission tiers unchanged. Runtime and repository checks now consume one
embedded seven-topology combat-pile catalog; source-named Witness classes have
been replaced by mechanism-named transaction Witnesses. The exact-assembly
audit emits layered fingerprints and conservative candidate classifications,
then a versioned exact SHA/MVID scenario grades all thirteen reviewed sources
and the Tutor target-player negative holdout. Six offline negative fixtures
prove the grader rejects authorization effects, identity drift, unexpected
callers and a ceiling above `diagnostic_only`. This is D2/static evidence, not
loaded deployment or Organic qualification.

Preview.63 adds a typed Gateway Permission Manager, a conservative loaded
Harmony Patch inventory, versioned operation-scoped session grants, exact
publication/execution grant binding, semantic-completion promotion, and
failure quarantine. The reviewed exact-environment policy remains an absolute
ceiling. D candidate data remains non-authorizing.

Preview.64 adds the Gate 3 Local Control Coordination Alpha source contract:
descriptive client registration, one runtime-bound mutation-controller lease,
generation fencing and immutable command attribution. Reads remain open. The
coordination layer reuses `bridge.runtime_instance_id`, does not authenticate
local processes, does not change operation permissions, and does not cancel or
retry a command after admission.

Preview.65 separates persistent qualification from volatile session grants.
It adds component-level operation identities, short-lived
`session_canary` candidate packages, two-runtime `qualified` packages, exact
startup applicability, operation-scoped session quarantine, append-only
install/supersede/revoke/rollback, and non-authorizing
capture/diff/collect/assemble/dry-run tools. A candidate package can bootstrap
only a reviewed low-risk operation; it never becomes qualified by itself.

The first non-menu gray candidate is only
`shop_room/open_shop_inventory`. It cannot authorize purchases, removal,
leaving the shop, or another shop operation. Gateway tests (`153`), Re tests
(`179`), Re typecheck and qualification fixtures pass. Preview.65 Release
builds with zero warnings as:

```text
SHA  11b6b014965a9269bd572bd04c3cd8a7575541e8bc6439cf054dc7b1b264164e
MVID 4e870cd2-3e35-4db5-8a1b-7c7a41ca631f
```

Preview.65 has no installed, loaded, canary, Organic, persistent,
cross-version or cross-Mod evidence yet. See the
[Preview 65 closeout](PREVIEW_65_PERSISTENT_QUALIFICATION_AND_ADAPTATION_CLOSEOUT_2026-07-25.md).

Gateway tests (`142`), Re tests (`175`), Re typecheck/build, Python MCP syntax
checking and the exact-game Release build pass for Preview.64 source. The
Release SHA is
`84d812ac7fba2a7e0169a7afb800b8d69e967580a941a43c037e38a3c3cec494`.
The artifact is not installed or loaded because the game still has Preview.63
loaded. Therefore Preview.64 currently has no loaded MVID/runtime or Organic
coordination evidence. See the
[Gate 3 closeout](GATE3_LOCAL_CONTROL_COORDINATION_CLOSEOUT_2026-07-25.md).

The currently loaded artifact remains Preview.63:

```text
SHA      d05b0580917c5b60acc908ec2575d2d0f8e59778da8c2379cebc0d5e72c90aa0
MVID     4836b3df-fffc-498a-b9c9-ac666adb5a5b
runtime  8aec74c19fed4a09984dc56a7e0c36ac
game     v0.109.0|c12f634d|-1639417500
Modset   2fd2cd789eb082ebfb91a3cd41c6a13869f359bc1d326fb752953c0bf9789d6f
exact policy bridge_v2_exact_environment_policy_2026_07_24
exact digest 1a3f5107e833bb5d561a36bbc2756340392225380088430229d7ef2dcf659f8f
gray policy  bridge_v2_gray_permission_candidates_2026_07_25
gray digest  618cca62e60d69ad0dc6ab10bab93cb2dc004b54a602e3d2142b21ca34d161fd
Patch status clean_known_owners
Patch digest ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
```

Built, installed and loaded SHA matched. Re strict inspection decoded the
protocol, Bridge/game/Modset/Patch identity, policy provenance and session
grant ledger. An operator-directed Re production-path canary executed
advertised `main_menu/continue_run` once, observed the Gateway semantic
saved-run activation witness, and settled after eight polls / 1569 ms at
`reward_flow/reward_claim`. The Gateway replaced its version-1
`session_canary` grant with a version-2 `session_auto_approved` grant under the
same runtime epoch.

This is a real bounded gray canary. It is not persistent qualification,
cross-runtime inheritance, broad automatic permission, proof that
`open_singleplayer` completed, or permission for any non-navigation operation.
The detailed state machine, exact binding and rollback boundary are in the
[D3 permission closeout](D3_PERMISSION_GRAY_ROLLOUT_CLOSEOUT_2026-07-25.md).

The predecessor Preview.62 artifact
`d66f5986f8216104fec76412c4b46b4c863076d0c8c7c5870a66fdb9f0c5a892`,
MVID `b7bf3824-80bf-4281-9267-262595ce0f49`, runtime
`6cf5f02288ed40448634656414524f6b`, completed an operator-directed bounded
menu round trip:

```text
state_4d51f98937_1 main_menu
  -> preview62-final-open_singleplayer-1784881719652334000 completed
state_4d51f98937_2 singleplayer_menu
  -> preview62-final-back-1784881745227362000 completed
state_4d51f98937_3 main_menu
```

Both actions were advertised, opaque and submitted once. A local polling
script error after the first submission was recovered by polling the same
request ID, never by resubmission. This rechecks the existing menu canary only;
it does not qualify new registry entries or transfer to the current post-D2
artifact.

## Dated Evidence Chronology

The chronology below records prior artifacts and repairs. It does not transfer
Organic qualification or permission to Preview.63.

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
value. Preview.60 is installed and cold-start loaded as SHA
`49e403b7...d996`, MVID `1219fb20-6db0-4b97-a754-57695e2585f8`, runtime
`ec2901d029a241e08831fdece0691a2d`, under exact Bridge-only Modset fingerprint
`24b4d54a...1380c`. Re negotiated that identity and strictly decoded an
actionable main-menu observation. This proves deployment and consumer
compatibility only. The prior Preview.59 Dredge journey does not transfer Gate
0 qualification or qualify any Preview.60 selector branch.

## Required Repair Order

1. The first D3 permission window is closed: runtime Patch inventory,
   two-epoch session-canary repeat and a read-only exact-identity transition
   assertion are complete. Do not broaden gray candidates as part of the next
   Gate 2 slice.
2. Maintain the machine-checked closed Gate 1/v1 retirement inventory and run
   the non-authorizing exact-assembly compatibility audit on each exact build.
3. Do not add a non-navigation gray candidate until independent evidence and
   candidate-policy review exist. Keep Tutor/unknown origins fail closed.
4. Close the game, install the built Preview.65 Release, cold-start through Steam,
   verify exact
   loaded SHA/MVID/runtime identity, then exercise one Re advertised-action
   command and one competing-client rejection. Then separately exercise the
   bounded shop-open candidate before collecting a second runtime epoch. None
   of these steps alone is persistent qualification.

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

Runs `run-20260723132513-103o5y` and
`run-20260723133555-rma1g2` later stopped on
`bridge.surface.generated_card_choice.binding_unavailable`. The second run's
immediate predecessor action was exact Quasar. The first stop followed the
Knowledge Demon enemy turn and exact source audit identifies
`CurseOfKnowledgeMove -> ChooseCurse`; it was not Charge. Preview.60 reuses
only proven card-choice mechanics while keeping their semantic contracts
separate: Quasar is skippable and preserves ordinary selected-card cost,
whereas Knowledge Demon is forced and commits the chosen card's immediate
Power effect. The same source audit found exact Charge independently:
`Charge.OnPlay` selects two draw-pile cards and replaces both with
`MinionDiveBomb` at their original indices. Charge therefore reuses pile-grid
mechanics but has its own cardinality, purpose, commit, and exact replacement
witness. See
[the focused closeout](GATE1_QUASAR_KNOWLEDGE_DEMON_CHARGE_CLOSEOUT_2026-07-24.md).
These branches are implemented, tested, installed, and loaded canaries, but
none has Preview.60 Organic action evidence yet.

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
- Re and the default MCP adapter have no v1 transport. The Gateway v1 namespace
  and its old state/action/profile/wiki implementation are fully retired.
- REST is Re's current transport. The Python MCP server is optional and must
  not become a second legality/completion engine.
- The current HTTP listener is a developer preview, not a consumer-safe
  authentication boundary. Preview.64 coordinates one local mutation client
  with a runtime-bound lease and restart invalidation, but client metadata and
  lease IDs are not secrets and do not isolate a malicious local process.

## Evidence Vocabulary

Source audit, fixture/unit test, Release build, installation, loaded module,
canary, and Organic Qualification are separate evidence classes. A successful
fixture, static build, old MVID, or historical v1 journey cannot be promoted to
a current v2 permission claim.

## Next High-Value Work

Install and cold-load Preview.64 before any further runtime claim. After the
bounded coordination canary, Gate 2 may advance through non-authorizing
transaction-correlation experiments and visible-information closure. Newly
registered combat-pile sources, Quasar, Knowledge Demon, Charge, Seance, and
Precise Scissors remain evidence debt rather than Gate 1 blockers. Do not
weaken state binding, retry unknown outcomes, restore v1, or convert
discovery/source/build evidence into qualification.
