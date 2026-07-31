# Bridge v2 Protocol

> Superseded as the current Agent protocol by
> [Connector V3](../connector-v3/PROTOCOL.md). Retained for migration and
> rollback.

Protocol preview: `2.0-preview.86`

Preview.85 corrects combat-hand selection confirmation semantics exposed by an
exact v0.110.1 Touch of Insanity journey. `CardSelectorPrefs` can report that
manual confirmation is not intrinsically required while the current native UI
still presents an explicit confirmation control and does not auto-complete the
selection. The Surface now reports the effective player-visible requirement;
Re rejects a ready state when that requirement contradicts the advertised
confirmation action. No operation or authority scope is added.

Preview.84 corrects the native merchant-relic completion boundary exposed by
an exact v0.110.1 Orrery purchase. A linked reward owner may take over while
the native purchase task and merchant entry remain pending. That handoff is
complete only after the exact relic is owned, the exact gold delta is visible,
and the native rewards screen is the current input owner. Ordinary purchases
without a child still require successful native task completion and entry
advancement. The original unknown receipt remains unknown and was not retried.

Preview.82 changes no JSON shape or Re normalized schema. It adds
`map_navigation/exit_map_annotation` as an explicit native action contract.
The action is published only for an exact active native
`NMapDrawingInput`, binds the visible map screen, commits through
`NMapDrawingInput.StopDrawing`, and witnesses annotation mode closing.
`choose_map_node` remains a separate route condition partition.

The explicit catalog contains 50 reviewed contracts and 38 volatile manifest
fallbacks. No supported Surface mixes explicit and fallback authority.
Preview.82 also clarifies client supervision: an exact
`rejected/not_applied/stale_state` command means no native mutation occurred,
so Re records `not_executed_stale_state` and obtains a fresh observation. It
does not resubmit the old action. Unknown, timed-out and transport-uncertain
outcomes remain terminal and non-retryable.

Exact Preview.81 runs establish predecessor coverage and reproduce both P82
defects. They cannot authorize Preview.82 because its DLL, catalog and
contract digests changed.

Preview.77 types the qualification contract boundary:

```json
{
  "contract_kind": "explicit_native_contract | manifest_migration_fallback"
}
```

`qualification_system.schema_version` is `2`. Every operation contract carries
the kind, while every durable qualification must carry
`explicit_native_contract`. Missing, legacy or fallback package kinds fail
closed in the Gateway and operator tooling. Contract kind participates in the
contract digest and evidence environment. It grants no authority by itself.

Manifest fallbacks remain runtime-local encounter-trial identities and cannot
be assembled, reloaded, superseded or rolled back as durable authority. This
is a permission/identity correction, not a new action, Surface, Completion or
Re strategy rule. See repository
[ADR-0006](../../../docs/current/decisions/ADR-0006-explicit-native-contract-and-durable-authority-convergence.md).

## Preview.76

Preview.76 adds one required source discriminator to
`deck_transform_selection`:

```json
{
  "source": {
    "kind": "whispering_hollow_event | new_leaf_relic_pickup",
    "definition_id": "WHISPERING_HOLLOW | NEW_LEAF",
    "binding_evidence": "exact Gateway binding"
  }
}
```

The wire does not infer caller purpose from `NDeckTransformSelectScreen`,
prompt text, or relic ownership. Whispering Hollow requires the exact active
event owner; New Leaf requires an exact task-local `AfterObtained` binding.
Zero or multiple source contracts produce `unsupported + none_fail_closed`.
Every unsupported Surface is also centrally forced to zero legal actions and
`none_fail_closed`, regardless of a provider draft's default handoff.

Re normalized schema is `31` and retains this source. Preview.76 changes no
permission tier, persistent claim or native completion ownership.

## Historical Preview Notes

Preview.75 preserves Preview.74 wire shapes and adds two runtime semantics:

- in `migration_exploration`, a diagnostic exact environment may advertise
  volatile read-only Inspection canaries only after the same runtime has a
  source-resolved action session scope and clean identity/Patch/Modset;
- this Inspection scope is state-bound, non-authorizing, outside the command
  ledger and never creates a persistent compatibility claim;
- Re accepts a valid strict JSON action when only `reasonBrief` exceeds its
  240-character storage contract, records
  `reason_brief_truncated_to_contract_limit`, retains the raw provider response
  and leaves every action-ID/unknown-outcome check unchanged.

Re normalized schema remained `30`.

Re's post-command supervisor now requires two consecutive equal actionable
state hashes before the next model decision. This is a client runtime behavior,
not a wire change or an extension of Gateway command completion. Coherent
unsupported and non-actionable successors remain typed and non-authorizing.

Preview.74 performs the Clean Closure identity/wire cutover:

- state requires `semantic_state_id` and `authority_projection_id`;
- composite `state_id` binds both for stale-action protection;
- `contract_instance_shadow`, `identity_shadow`, `permission_system`, and
  `qualification_system` are removed from state;
- permission/qualification remain required control-plane capability data;
- advertised actions are internally bound to catalog contract, source
  evidence, exact operands and current state;
- explicit contracts use contract-digest publication/execution admission;
  un-migrated fallback families retain the temporary operation gate;
- Re normalized schema is `30`.

See repository [ADR-0005](../../../docs/current/decisions/ADR-0005-workflow-c-clean-closure.md).

`npm run connector -- audit-run-identity` reads the formal identities for
Preview.74+ recordings and retains explicit historical-only compatibility with
the non-authorizing Preview.67-73 identity shadow. It never grants authority.

Preview.73 corrects two boundaries exposed by final-MVID Preview.72 Rest runs:

- Rest Heal completion proves the game-native base-heal minimum and exact
  option progression; it does not predict final HP after relic or other native
  side effects;
- when exact operation permission withholds every action, the current semantic
  Surface retains `authority_handoff=bridge_owned`, publishes zero actions and
  uses `readiness=blocked`. Re projects this as `non_actionable` without model
  invocation or fallback. Unsupported source/owner states still require
  `none_fail_closed`.

This changes readiness/authority semantics without changing JSON shape. The Re
normalized schema remains `29`.

Preview.71 repairs one action-local Outcome Oracle without expanding
authority. `treasure_room/open_treasure_chest` now completes when the exact
current native lifecycle proves either:

- the chest is opened and a non-empty relic-choice continuation is active; or
- the chest is opened, the collection has settled closed, and normal Proceed
  is visible and enabled.

The second branch is required by native effects such as Silver Crucible, whose
first treasure chest is intentionally empty. Projection and completion reuse
`TreasureLifecycleFacts`; no relic ID, reward-generation rule, or fallback
execution is reconstructed in Re. The operation was the sixth explicit
non-authorizing component-contract candidate at Preview.71. Preview.71 has build/install evidence only
until cold-loaded.

Preview.70 adds two non-authorizing migration measurements without changing
action publication, execution, permission, completion, or state binding:

- each contract-shadow operation now distinguishes a five-row explicit
  component contract from a manifest-derived hypothesis;
- explicit candidates carry separate interaction, owner, source, operand,
  Commit, completion, and Witness digests plus the expected completion boundary;
- manifest fallback rows carry no component digest and remain explicitly
  `manifest_hypothesis` or `published_manifest_hypothesis`;
- the then-current run-identity audit attributed recorded stale refusals
  against the Preview.67 semantic/authority candidates without authorizing an
  identity migration.

These fields are raw evidence only. They do not make `operation` a native
contract, do not promote any qualification, and do not enter Re's strategy
projection. The legacy composite `state_id` remains authoritative.

Preview.69 separates diagnostic observation, encounter trial admission, and
persistent claims:

- a complete but unreviewed game-build identity may remain observable as
  `diagnostic_candidate` while actions and Inspection start disabled;
- in `migration_exploration`, a uniquely source-resolved current action may
  receive a runtime-bound `encounter_source_resolved` canary without a bulk
  preinstalled candidate package;
- `action_permission_scopes` and permission grants carry `admission_basis`;
- confirmed trial completion yields `session_trial_confirmed`, never a
  persistent qualification;
- `run_transition + no_action + settling` represents the exact new/resumed-run
  mounting gap without inventing an input owner; only that exact actionless
  state may defer `shared_state`, using typed diagnostic
  `bridge.shared_state.deferred_during_run_mount_transition` and sole missing
  field `shared_visible_state`.

The Gateway still requires exact loaded identity, bounded Modset eligibility,
clean Patch inventory, current native legality, execute-time revalidation and
semantic completion. Failure or drift quarantines the runtime-local scope.
See [ADR-0004](../../../docs/current/decisions/ADR-0004-risk-calibrated-encounter-trial-and-scoped-claims.md).

Preview.68 adds three explicit boundaries without expanding authority:

- command responses may include `completion_boundary` to distinguish native
  commit, immediate postcondition, exact continuation handoff, transaction
  settlement, and the historical generic Gateway semantic completion;
- `deck_enchant_selection.source` binds the exact current Self-Help Book,
  Symbiote or Kifuda source contract; unknown sources fail closed;
- contract-instance shadow resolution may be
  `resolved_runtime_contract`, with exact runtime source/contract IDs. It
  remains `authorizing=false` and cannot add or remove actions.

A `continuation_handoff_observed` receipt proves only that the current action
committed and transferred input to an exact native child. It does not claim
that the parent transaction settled. The child must be freshly observed and
publishes independently state-bound actions.

Preview.67 introduced `state.identity_shadow`, a non-authorizing migration
measurement containing:

- `semantic_state_id_candidate`, derived from the current provider semantic
  signature and shared player-visible state;
- `authority_projection_id_candidate`, derived from the active Surface,
  current opaque action keys/operations, matching current operation scopes,
  authority handoff, and execution admission;
- explicit declarations that current `state_id` remains the legacy
  authoritative composite, action binding still uses it, and the shadow is
  not authorizing.

The existing `state_id`, action IDs, submit/poll contract, permission,
execute-time validation, native Commit, semantic completion, and command
ledger are unchanged. Re must decode and preserve this field as raw evidence,
but it must not infer action authority or model strategy from it. See
[ADR-0005](ADR-0005-semantic-state-and-authority-identity-separation.md).

Preview.66 retains Preview.65's required `qualification_system` state and adds
multi-environment ledger semantics plus migration orchestration. It reports:

- the current exact environment digest;
- a component-level operation contract catalog;
- local qualification-store identity and status;
- active, expired, superseded, revoked, rolled-back and session-quarantined
  packages;
- whether an exact `session_canary` candidate or persistent `qualified`
  operation is currently applicable.

`game.modset` now separately reports
`qualification_candidate_eligible` and
`persistent_qualification_eligible`. Neither is inferred from Mod presence.
The Gateway sets them only after an installed package matches the exact
game/Gateway/Modset/Patch/environment and operation contract.

A `session_canary` package is short-lived bootstrap input to the existing
Gateway-owned D3 state machine. A `qualified` package requires two distinct
runtime epochs of confirmed exact Organic evidence. Packages are local and
append-only; there is no REST or MCP endpoint that installs or activates one.
The Gateway loads them at startup and atomically reloads complete store
snapshots when the local file changes. Every package is revalidated before any
scope publication. Execution still requires the exact advertised scope and
execute-time validation. Validated failure or Witness mismatch immediately
quarantines the operation for the runtime and quarantine survives store reload.

Qualification is operation-scoped, not Surface-wide. One Surface may contain
a persistent-qualified operation and a session-canary sibling at the same
time. Surface tier lists are coarse highest-tier projections for negotiation;
the authoritative contract is each exact `surface_kind + operation` scope and
its current package or grant. A client must not reject a coherent mixed-tier
Surface, and must not use one operation's tier to authorize a sibling.

One ledger may contain the same operation for multiple exact environments.
Current package slots are keyed by
`environment_digest + surface_kind + operation`; a package from one
environment cannot supersede or authorize the same operation in another.
Historical packages with older protocol identity remain readable but
inapplicable.

Preview.66 also adds a non-authorizing Environment Profile index and a
risk-based migration policy. Profiles exclude local paths and runtime epoch,
and are planning/inspection data only. `migration_exploration` may create
session candidates for exact explicit or manifest-derived operation identities
across configured risk classes, but only when an exact candidate package is
installed. Manifest-derived fallback identity is test-confirm metadata, not
semantic equivalence. It is not operation wildcard or persistent authority.

Preview.64 adds minimal local mutation coordination. Read-only observation and
Inspection remain open. A mutation client registers descriptive process
metadata, acquires the one runtime-bound controller lease, and submits the
current lease ID and monotonically increasing generation with each command.
The Gateway records immutable command attribution and rejects stale or
non-holder submissions before they enter the command ledger. Gateway restart
invalidates all registrations and leases because the coordination epoch is the
existing `bridge.runtime_instance_id`.

This is correctness and debugging coordination, not authentication. Client
metadata and lease IDs are not secrets, do not defend against a malicious local
process, and do not replace exact-environment permission, opaque actions,
execute-time validation, semantic completion, or unknown-no-retry. Lease
expiry blocks new submissions but never cancels or retries an already admitted
command.

Preview.63 adds required `permission_system` state to capabilities and every
state envelope. It reports Gateway mode, runtime epoch, candidate policy,
conservative runtime Patch inventory and a bounded versioned grant ledger.
Each action permission scope now binds grant ID/version, environment digest,
Patch digest and operation fingerprint. Dynamic scopes additionally bind the
current runtime epoch. The exact grant is captured at publication and must
still match when execution starts.

The reviewed exact-environment policy remains the persistent-claim baseline,
not an absolute ceiling on volatile evidence collection. A D candidate has no
authorization effect by itself. Only the Gateway Permission Manager may issue
a runtime-epoch-bound `session_canary` from an installed candidate or current
source-resolved encounter, and only Gateway-confirmed semantic completion may
supersede it with `session_trial_confirmed`. A validated failure, timeout, unknown outcome,
identity/Patch drift or mode change quarantines the affected operation for that
session. Restart is rollback; no dynamic grant becomes persistent
qualification.

Preview.62 kept exact source/task binding and purpose-specific semantic
completion in the Gateway while making the combat-pile wire contract
structural. `combat_pile_card_selection` now reports `mutation_kind`,
`commit_mode`, optional `replacement_card_definition_id`, source/destination
piles, bounds, and exact selected instances. Its only operations are
`toggle_combat_pile_card` and, when the native enabled control exists,
`confirm_combat_pile_selection`. `source_kind` remains provenance and an
internal authorization input; a client must not use a source literal to infer
legality or completion.

Preview.62 adds required compatibility provenance:
`compatibility_policy_id`, `compatibility_policy_digest`, and
`adaptation_level`. Capabilities, state, bundles, and Inspection envelopes must
agree on them. They identify the reviewed embedded exact-environment policy;
they never replace explicit operation scopes or current legality.

The reviewed combat-pile registry is an internal source/transaction contract,
not client-executable data. One generic task-local binding consumes it and
dispatches only the closed witness topology. Exact-assembly discovery and
registry verification have no authorization or qualification effect.

Preview.61 also adds exact Neow's Fury. Its native transaction is an optional
`min_select=0`, dynamic-max discard-to-hand selection with manual confirmation.
The completion witness requires the source task to finish, the child to close,
unselected baseline discard cards to remain, baseline hand cards to remain,
and every selected exact reference to move from discard to hand. It does not
authorize another caller of the same native screen.

Preview.60 retained Preview.59 identity and Dredge semantics and added exact
Quasar and Knowledge Demon branches to `generated_card_choice`, plus exact
Charge to `combat_pile_card_selection`. Quasar, Knowledge Demon, and Charge
reuse only bounded interaction mechanics; their source, purpose, cardinality,
skip policy, commit, and semantic completion remain independent. Exact
`CardRemovalReward` remains on the independent
`reward_deck_removal_selection` Surface.

Preview.57 repairs exact game identity. `game.main_assembly_hash` is now the
hash computed from the main assembly actually loaded by the current process,
using the game's own `AssemblyHasher`. The separately named
`game.release_declared_main_assembly_hash` preserves the value read from
`release_info.json` for diagnosis only. A release declaration never grants
permission when it disagrees with the loaded assembly. Capabilities, state,
observation bundles, and Inspections must agree on both fields, while
compatibility gates use only the actual runtime hash.
The current `-1639417500` permission is specific to the audited macOS arm64
assembly. A matching version/commit on x86_64, Windows, Linux, or a changed
game binary must supply and qualify its own runtime hash; release metadata
cannot bridge that gap.

Preview.56 adds the source-bound `wood_carvings_replacement_selection`
contract. It distinguishes native Wood Carvings Bird/Torus by the exact
async event task rather than localized prompt text, exposes the deterministic
replacement already visible to the player, and completes only after the
source task ends, the selector closes, the exact original instance leaves the
deck, the expected replacement count increases, and deck count is preserved.
It is a current-identity action canary, not qualification or a universal deck
selector.

Preview.55 repairs the C#/Re source contract: `bridge.assembly_file_sha256`
identifies the loaded Gateway artifact without disclosing a local path, and
`game.compatibility.action_permission_scopes` is the exact, fail-closed
projection of the current build's manifest operations. A Surface capability
lists only operations present in that scope. `legacy_fallback_allowed` is not a
strict-v2 authority handoff; source-resolved but unscoped surfaces publish no
actions with `none_fail_closed`. This does not add a source binding for
Discovery or grant it generated-card authority.

`bridge.upstream_commit` is the immutable imported upstream baseline, currently
`20eadebde358a37cca41f8b38728099e6d0d19db`; it is not the current SpireAgent
Git revision. Runtime evidence must use the loaded module MVID, runtime ID,
Release/installed SHA, exact game identity, and Modset fingerprint. A future
protocol may add a separately named repository source revision, but the legacy
field must not be treated as current-build authority.

## Build Compatibility

This protocol describes bounded v2 contracts, not permission to execute every
contract against every Steam build. For exact runtime identity
`v0.109.0|c12f634d|-1639417500`, capabilities separately advertise:

- qualified actions: `deck_removal_selection`, `deck_upgrade_selection`,
  `combat_turn`, `combat_hand_card_selection`, and ordinary single-player
  `rest_site`;
- action canaries: `event_card_acquisition`, `reward_claim`,
  `card_reward_selection`, `map_navigation`, `shop_inventory`, `shop_room`,
  `treasure_room`, `game_over`, `card_bundle_selection`, `character_select`,
  `main_menu`, `singleplayer_menu`, `event_dialogue`, `event_option`, and
  source-bound `deck_transform_selection`, source-bound
  `wood_carvings_replacement_selection`, Surface-level
  `deck_enchant_selection`, exact `relic_deck_removal_selection`,
  exact `reward_deck_removal_selection`,
  `combat_pile_card_selection` for exact
  Headbutt/Graveblast/Cleanse/Seance/Dredge/Charge/Neow's Fury/
  Cosmic Indifference/Hologram/Secret Technique/Secret Weapon/Seeker Strike/
  Wish registry sources,
  and source-scoped
  `generated_card_choice` for exact Lead Paperweight acquisition and native
  Colorless/Attack/Skill/Power Potion, native Splash, native Quasar, and
  Knowledge Demon curse choices;
- qualified read-only inspection: `run_deck`;
- read-only inspection canaries: `combat_piles` and `shop_catalog`.

Every unlisted Surface and Inspection remains disabled. Historical v0.108
evidence does not grant current-build authority, and canary evidence does not
silently become qualification.

Tutor is explicitly not registered: its selected pile is bound to
`cardPlay.Target.Player`, while the current closed registry binds the source
owner. A matching native selector and commit primitive are insufficient to
authorize a different participant-ownership contract.

`relic_deck_removal_selection` is a separately scoped canary contract for the
exact native `Precise Scissors` acquisition task. It is not an alias for the
qualified merchant `deck_removal_selection`: it has no shop Context, price,
service-use counter, or merchant completion witness. Both reuse bounded
selection mechanics internally, while source binding and semantic completion
remain purpose-specific.

`reward_deck_removal_selection` is independently source-bound to the exact
active `CardRemovalReward.OnSelect` task. It is not inferred from Forbidden
Grimoire history and does not inherit merchant or relic authority. Confirmation
requires the selected exact card to leave the deck, deck count to decrease by
one, the reward source task to complete, and the selector to close. Cancellation
requires source completion, selector closure, and an unchanged exact-reference
deck.

`deck_enchant_selection.confirm_selection` is not complete merely because the
overlay closes. The current event command applies the enchantment after the
selection task resolves. Preview.49 therefore binds commit to the exact
selected card instances plus enchantment ID/amount, revalidates those facts at
dispatch, and requires both overlay closure and exact card-model post-state.

The permission and Provider boundary is broader than the preview.49 evidence:
the exact-build gate permits `deck_enchant_selection` by Surface kind, and the
Provider matches `NDeckEnchantSelectScreen` without proving a Self-Help Book
source token. Self-Help Book is the recorded canary journey and manifest source
text, not a runtime-enforced origin whitelist. Other exact-build origins must
not be described as qualified, but they are not currently suppressed by source
binding once this Surface is permitted. This is a known governance gap and no
permission is expanded by documenting it.

Event option commands may cross a bounded asynchronous intermediate state
before their existing semantic witness becomes true. Preview.50 opts only
`choose_event_option` and `proceed_event` into ledger intermediate-state
waiting. They still require replacement options, a required child Surface,
combat entry, map opening, or room departure before the command completes;
otherwise the command times out as unknown. The ledger default continues to
fail an unexplained state change for every action that did not explicitly opt
in.

Combat `player.companions` is immediate read-only Context, not an executable
Surface. It is sourced from the local player's exact `PlayerCombatState.Pets`
collection used by native `NCombatRoom` pet rendering. Each entry carries
stable entity identity, exact definition, visible name, alive state, block,
and visible statuses. `hp` and `max_hp` are present only when the companion's
native `MonsterModel.IsHealthBarVisible` is true; contradictory visibility and
HP shapes fail strict Re validation. This contract does not create companion
commands, infer hidden pet state, or expose future Summon results.

Exact environment identity is the combination of exact game identity and the
loaded Modset identity. `game.modset` records:

- deterministic `fingerprint` and its declared `fingerprint_scope`;
- ModManager status and whether exact permission is eligible;
- every known Mod's manifest ID/version, source, load state, gameplay flag,
  Workshop ID as an exact decimal string, and loaded assembly name/version/MVID;
- a safe status/detail without local filesystem paths.

Encounter provisional admission currently requires `exact_bridge_only` or an
explicitly classified qualification-candidate Modset. ModManager must be
initialized and the loaded Bridge manifest/MVID must agree with the negotiated
identity. Additional, failed, runtime-added, or unknown Mods do not become
eligible from manifest presence alone. This is a trial gate, not a semantic
compatibility claim; each non-exact Modset still requires bounded source,
visibility, legality, Commit, completion, and canary evidence.

For each loaded identity, the Gateway advertises an explicit
`surface_kind + operation + tier` inventory. A scoped
build is executable only when the current state operation appears in that
inventory; empty lists never become wildcard authority. Preview.63 scope
identity additionally includes the grant ID/version, environment, Patch and
operation fingerprint. Re requires identical scopes in state and capabilities
and validates every dynamic scope against the unique current active grant.

Canary and session-trial-confirmed authority remain operation-scoped permission,
not Organic Qualification. Per-operation and per-origin qualification must
still be recorded separately. Session state may narrow current authority but
must not infer or expand the embedded ceiling from implementation alone.

For `map_navigation`, preview.35 uses the same exact-node predicate while
publishing and immediately before execution. Besides run-state travelability,
node enabled state, and FTUE gating, controller input requires the destination
node to be on screen, matching the current `NMapPoint.OnRelease` path.

## Endpoints

```text
GET  /api/v2/capabilities
GET  /api/v2/state
GET  /api/v2/inspections/{kind}?expected_state_id={state_id}
POST /api/v2/observation-bundles
POST /api/v2/clients/register
GET  /api/v2/clients
GET  /api/v2/controller
POST /api/v2/controller/acquire
POST /api/v2/controller/renew
POST /api/v2/controller/release
POST /api/v2/commands
GET  /api/v2/commands/{request_id}
```

All game-object reads and mutations run on the Godot main thread. HTTP and MCP
layers own transport only.

The Bridge v2 contract is protocol-neutral domain behavior. The REST routes
above are the current Re-SpireAgent integration. The Python MCP server is an
optional adapter over the same routes; listing or calling an MCP tool does not
grant action legality, exact-build permission, qualification, or strategy
authority. Transport adapters may expose only fixed, capability-advertised
operations and Inspection kinds. They must not reconstruct legal actions,
invent source semantics, or provide arbitrary scene-tree/reflection queries.

Canonical component names, ownership, and the deferred Headless boundary are
defined in [LIVE_GAME_CONNECTION_BOUNDARY.md](LIVE_GAME_CONNECTION_BOUNDARY.md).
This protocol document specifies current wire behavior; it does not make REST,
MCP, or Re an owner of gateway semantics.

Protocol choice and rendering mode are independent. Starting the real Godot
runtime without a display does not create a new action contract and does not
prove that STS2 gameplay is independent of scene/UI lifecycle.

## State

Every state response contains:

- protocol, bridge, exact game identity, and exact loaded Modset identity;
- observation policy;
- composite `state_id`, formal `semantic_state_id`, formal
  `authority_projection_id`, and monotonic process-session sequence;
- explicit top-level `shared_state` (`null` when no single-player run exists);
- readiness, typed semantic `context`, and surface kind;
- typed surface data;
- state-scoped opaque legal actions;
- completeness sources and missing fields;
- a bounded `visibility` declaration and current typed
  `inspection_catalog`;
- typed diagnostics and legacy compatibility warnings.

Timestamps and logging fields do not change `state_id`. Shared visible state,
semantic context, surface data, or the legal action set does.

`visibility` distinguishes default core completeness, declared linked-detail
families, currently available read-only Inspection kinds, explicit missing
facts, and hidden-by-policy facts. `player_visible_closure_status` describes
the declared default-plus-inspection closure; it is not a claim that one state
payload contains every player-visible fact. Unknown execution-critical fields
remain fail-closed.

`inspection_catalog` is state-bound and deterministic. Every entry records its
visibility basis, availability tier, ordering semantics, cost hint, recommended
uses, and hidden policy. It grants no action authority and does not enter the
command ledger.

Permission and qualification history are not semantic state. They are read
through capabilities/operator control responses and do not enter Prompt or
`semantic_state_id`.

## Permission System

`permission_system` is required on capabilities. Its
`runtime_epoch` must equal `bridge.runtime_instance_id`.

Modes:

- `strict`: embedded `qualified` operations only;
- `balanced_gray`: embedded non-candidate canaries remain available and
  reviewed reversible-navigation candidates may enter the session loop;
- `developer_gray`: additionally permits reviewed progression candidates;
- `migration_exploration`: additionally permits reviewed persistent-run-
  mutation candidates during an explicit migration cycle.

The migration policy is risk-class based rather than an operation-name list.
The current qualification catalog contains six explicit high-precision
contracts plus 81 conservative fallback identities derived from the current
Gateway contract manifest. Explicit rows require their exact completion
boundary and witness. A fallback row uses
`gateway_semantic_completion_observed` with the package sentinel
`gateway_reported_operation_witness`; runtime success still requires a
non-empty witness emitted by the Gateway for that operation. Fallback rows are
eligible only in `migration_exploration` and do not assert semantic
equivalence. The policy cannot authorize an operation absent from the current
catalog. Preview.69 may use either an exact applicable candidate package or a
current uniquely source-resolved encounter as the admission basis; the latter
is volatile and cannot create a persistent claim.

Every grant records:

- versioned ID, `current`, status, tier, issue/expiry and supersession;
- Surface, operation, risk and mode;
- runtime epoch, environment, Gateway SHA/MVID, Modset and Patch digest;
- operation fingerprint and candidate evidence digest/IDs;
- admission basis (`installed_candidate_package` or
  `encounter_source_resolved`);
- revocation reason where applicable.

Only the unique current active grant can back a dynamic action scope. Historical
issuance records remain visible for audit and may retain the exact identity
under which they were issued. A superseded record may therefore show its
issuance tier with `current=false`; it grants no current authority.

The Patch inventory is based on loaded Harmony metadata and is intentionally
conservative. Dynamic promotion requires `clean_known_owners`, at least one
loaded Gateway-owned patch and no unknown owner. An empty inventory, missing
Gateway owner, unknown owner or unavailable metadata suppresses it. This
inventory cannot prove the absence of native/non-Harmony hooks or semantic
drift and never replaces native legality, exact binding or semantic
completion.

D scenarios, fingerprints, graders and candidate records have no authority.
They may supply evidence IDs and a recommendation. The Gateway remains the
sole policy decision and enforcement owner.

## Local Control Coordination

Capabilities expose a required `control_coordination` contract. Its
`runtime_epoch` must equal `bridge.runtime_instance_id`. The current contract
has:

- descriptive client registration for mutation clients;
- no registration requirement for reads or Inspection;
- exactly one active mutation-controller lease;
- a 30-second lease TTL and 10-second recommended renewal interval;
- generation fencing so an expired or released lease cannot regain authority;
- immutable command attribution to the admitted client, lease and generation.

Registration does not authenticate a process. `product_id`, product name and
version exist only for diagnosis and command audit. The direct local Gateway
does not implement accounts, passwords, OAuth, certificates, RBAC or a
malicious-process boundary.

The coordination check runs only for a new request ID and before the command
enters the ledger. Re-reading an existing command by request ID remains open
and cannot create another mutation. An admitted command owns its lifecycle
until semantic completion, rejection, failure or timeout even if the lease
later expires. A new holder may submit only after the previous lease expires
or is released; it cannot cancel or retry the prior command.

## Coherent Observation Bundle

```json
{
  "expected_state_id": "state_opaque",
  "inspections": [
    { "kind": "run_deck" },
    { "kind": "combat_piles" }
  ]
}
```

`POST /api/v2/observation-bundles` returns one state and the requested fixed,
typed Inspections under the same exact state, Bridge MVID/runtime, game, and
Modset identity. Requests are limited to the current catalog, at most eight
distinct fixed kinds, and 8 KiB. Any stale state, permission mismatch, unknown
kind, or observation drift rejects the complete bundle. The response is
read-only, creates no command, and cannot be supplied as an execution payload.

`context.kind` is not a complete state discriminator. Clients must display and
reason over at least:

```text
shared_state + context.kind + surface.kind + action authority
```

The context contains durable current-situation semantics. The surface contains
the currently blocking interaction protocol. Authority says whether actions
were Bridge-advertised, locally reconstructed by a legacy client, or absent.
Bridge wire actions always use `authority="game_ui"`; the higher-level client
records the effective state authority separately.

`shared_state` is a separate top-level read-only concern. Active-run Surfaces
require it. The only active-run omission is the exact typed, actionless
run-mount transition above; it cannot publish actions and is expected to
settle into a fresh complete observation. The purpose-specific `main_menu`,
`singleplayer_menu`, and `character_select` Surfaces require it to be `null`,
because no run exists yet.
Preview.28+ serializes
the active single-player run's act/floor/ascension, visible bosses/modifiers,
and local player identity/HP/gold/relic/potion facts. It must not be copied into
every Context, treated as an Inspection, or allowed to create actions. It is
included in `state_id`; an active-run projection failure suppresses actions.
Preview.46 represents bounded entity hover semantics as separate `keywords`
and typed read-only `card_previews`. Relics, run modifiers, owned potions,
shop relics, and treasure relics use this contract. Interactive cards keep
runtime-instance identity; recreated tooltip cards use stable owner-scoped
preview identity so presentation allocation cannot churn `state_id`. Preview
identity grants no action authority. Unknown hover-tip kinds fail closed
instead of being silently omitted. Deck contents still require the fixed
`run_deck` Inspection.

Preview.37 models root and single-player submenu navigation as distinct
semantic Surfaces. They share a typed visible-choice component, not a universal
menu action protocol. An option may be `actionable` or `visible_unsupported`;
only the former may correspond to an opaque legal action. A live modal owns
input above both menus and suppresses all menu actions.

Preview.38 models the exact Whispering Hollow random-transform child as
`event + deck_transform_selection`. It is not a universal card selector or a
generic transform API. During preview it reports
`preview_kind=random_uncommitted_cycle` and `replacement_known=false`; cycling
cards are player-visible presentation and never disclose the committed random
replacement or RNG. Confirmation requires screen closure, absence of every
selected exact original instance, and preserved run-deck count.

That child witness proves the bounded transform operation, not every remaining
effect in the parent event transaction. Parent event-option completion may
occur when a required child opens. The current wire has no transaction-wide
obligation list assigning later parent effects to a command; this limitation is
tracked by the 2026-07-20 architecture audit and must not be inferred away from
the local child witness.

Preview.42 models only `LeadPaperweight.AfterObtained` as
`generated_card_choice` over the current world Context. The Surface must declare
`purpose=acquire_one_generated_card`, `source_kind=lead_paperweight`, and
`destination=run_deck`. Legal operations are `select_generated_run_card` and
`skip_generated_run_card_choice`. An exact active source binding is mandatory;
the shared `NChooseACardSelectionScreen`, prompt text, card-grid shape, or relic
ownership alone never supplies purpose or authority. Selection completion
requires source-task completion, Surface closure, exact selected-card presence,
and run-deck count `+1`. Skip requires source-task completion, Surface closure,
unchanged deck count, and absence of all offered exact card references.

Preview.43 standardizes provider binding failure without adding a semantic
Surface: a provider that cannot prove its exact source returns
`unsupported + none_fail_closed + legal_actions=[]` with typed diagnostics.
It may retain safe Context for diagnosis, but it may not retain a business
Surface kind or `bridge_owned` authority. This helper is a wire-safety
mechanism and never grants permission.

Preview.44 adds exact `ColorlessPotion.OnUse` as a second, discriminated
`combat + generated_card_choice` branch. It must declare
`purpose=choose_one_generated_combat_card`,
`source_kind=colorless_potion`, `destination=combat_hand`,
`selected_card_cost_policy=free_this_turn`, and
`overflow_destination=combat_discard_if_hand_full`. Its legal operations are
`select_generated_combat_card` and
`skip_generated_combat_card_choice`. Selection completion requires the source
task to finish, child closure, an exact offered reference newly present in
hand or discard, combined hand/discard count `+1`, and the temporary free-cost
modifier. Skip requires source completion, child closure, unchanged hand and
discard counts, and absence of all offered references. Lead Paperweight and
Colorless Potion share only bounded one-of-N mechanics; source, Context,
destination, cost policy, operations, and witnesses remain distinct.

Preview.52 extends that combat branch only to native sealed `AttackPotion`,
`SkillPotion`, and `PowerPotion`, whose exact v0.109 `OnUse` implementations
have the same visible choice, free-this-turn mutation, hand destination,
full-hand discard overflow, and source-task lifecycle as `ColorlessPotion`.
The wire preserves exact `source_kind` values `colorless_potion`,
`attack_potion`, `skill_potion`, and `power_potion`; exact type equality is
required, so unknown potions, derived
Mod types, card/relic generators, and other callers cannot inherit authority.
Shared mechanics and witness topology do not erase the source identity or
create a universal generated-card selector.

Preview.72 adds exact sealed `HeftyTablet.AfterObtained` to the same interaction
Surface without pretending it has Lead Paperweight semantics. It declares
`purpose=acquire_one_generated_rare_card_plus_injury`,
`source_kind=hefty_tablet`, `destination=run_deck`, and
`selected_card_cost_policy=unchanged`. Selection completion requires source
task completion, Surface closure, the selected exact Rare card, one exact new
`Injury`, deck count `+2`, and absence of unselected offers. Skip requires one
exact new Injury, deck count `+1`, and absence of every offer. The exact active
relic task supplies business origin independently of the underlying room
Context; prompt text and UI shape remain insufficient.

Preview.72 also makes action publication explicit in scoped environments. A
semantic Surface may be `settling` with no legal actions and be advertised as
`candidate_observation_only`. Re may observe and record it but must produce no
allowed action and must project `actionAuthority=none`. Once legal actions are
published, an exact qualified or canary operation scope is mandatory. `ready`
with no actions, observation-only with actions, or incompatible Context/source
contracts remain invalid.

Preview.53 extends `combat_pile_card_selection` only to exact sealed
`Graveblast`. Its wire branch is discriminated from Headbutt by
`source_kind=graveblast`, `purpose=move_one_discard_card_to_hand`,
`destination_pile=hand`, `destination_position=bottom`, and
`overflow_destination=discard_if_hand_full`. Completion requires source-task
completion, child closure, exact-reference movement from discard to hand when
capacity existed, or exact-reference retention in discard only when the
baseline hand was full. Combined hand/discard cardinality must remain stable.
The shared selector mechanics do not grant any other combat-pile caller
authority.

The current contract includes exact sealed `Cleanse` and Seance branches.
`Cleanse.OnPlay` opens `CardSelectCmd.FromCombatPile` for exactly one
draw-pile card, then calls `CardCmd.Exhaust` for the selected reference. Its
wire values are `source_kind=cleanse`, `purpose=exhaust_one_draw_card`,
`pile_type=draw`, and `destination_pile=exhaust`. Completion requires the
source task to finish, the child to close, and that exact card to leave the
baseline draw pile and appear in the exhaust pile. This candidate is not
Organic-qualified. Current Release loading and a read-only Re decode confirmed
the explicit source discriminator, but two Organic plays then showed that the
broad `CardModel.OnPlayWrapper` scope did not remain uniquely bound while the
child was active. The corrected implementation binds the exact protected
`Cleanse.OnPlay(PlayerChoiceContext, CardPlay)` task. This establishes an
adaptation rule: shared selection mechanics may remain common, but source
evidence must attach to the narrowest method whose task actually encloses the
player-choice lifecycle. An Organic action later completed that exact Cleanse
contract under its prior loaded Preview.57 identity; the evidence does not
transfer to Preview.60 qualification.

Seance uses `source_kind=seance`,
`purpose=transform_one_draw_card_into_soul`, `pile_type=draw`,
`destination_pile=draw`, and `destination_position=same_index`. Publication and
execution require the same active `Seance.OnPlay` task. Success requires source
completion, selector closure, selected-original absence, pile-count
preservation, and a new exact `Soul` reference at the original draw-pile
index. This branch is loaded and canary-scoped but not Organic-tested.

Dredge uses `source_kind=dredge`,
`purpose=move_bounded_discard_cards_to_hand`, `pile_type=discard`,
`mutation_kind=move_selected_cards`,
`commit_mode=automatic_at_max`, `destination_pile=hand`, and
`destination_position=bottom`. Its equal
`min_select=max_select` is dynamically one to three from native hand capacity;
it has no manual confirmation and no cancel. When more candidates exist than
the required count, `toggle_combat_pile_card` changes the visible selected set.
An intermediate command completes only when that exact set
changes while source/screen and both piles remain stable. The final toggle
completes only when the source task finishes, the selector closes, and the
exact selected batch moves discard to hand. When the native command can resolve
without opening a selector because the candidate set is already bounded, no
child Surface is required. A Preview.59 current-build Re canary exercised
select, deselect, and exact-three automatic commit. All unknown origins remain
unsupported.

Preview.60 added exact Charge under the same bounded pile-selection mechanics.
In Preview.61 its structural branch is `source_kind=charge`,
`purpose=transform_two_draw_cards_into_minion_dive_bombs`,
`mutation_kind=replace_selected_cards_same_index`,
`commit_mode=automatic_at_max`, `pile_type=draw`,
`min_select=max_select=2`,
`destination_pile=draw`, and `destination_position=same_index`. The operation
`toggle_combat_pile_card` completes an intermediate command only when the
exact selected set changes without pile mutation. Final completion requires
source task and child closure, both exact originals absent, unchanged draw-pile
count, and new exact `MinionDiveBomb` references at both original indices.
Upgraded Charge additionally requires upgraded replacements. This witness does
not authorize any other pile transformation.

Preview.61 adds exact Neow's Fury as a distinct manually committed branch:
`source_kind=neows_fury`,
`purpose=move_optional_discard_cards_to_hand`,
`mutation_kind=move_selected_cards`, `commit_mode=manual_confirm`,
`pile_type=discard`, `destination_pile=hand`, `min_select=0`, and a dynamic
maximum bounded by the native card value and free hand slots. Toggle commands
prove only a selected-set change with stable piles. The Gateway advertises
`confirm_combat_pile_selection` only when the current native confirm control is
visible and enabled. Confirmation may commit an empty set; completion uses the
exact source task and post-state movement witness described above.

Preview.60 also added two exact generated-card branches. Quasar uses
`source_kind=quasar`, `destination=combat_hand`,
`selected_card_cost_policy=unchanged`, and allows
`select_generated_combat_card` or `skip_generated_combat_card_choice`.
Selection requires an exact offered reference in hand or full-hand discard
without a local free-cost modifier. Knowledge Demon uses
`source_kind=knowledge_demon_curse`,
`purpose=choose_one_immediate_combat_effect`,
`destination=immediate_effect`, and cannot skip. Its
`select_generated_combat_effect` completion requires the exact corresponding
Power amount to increase after source and child closure. These sources share a
grid, not a business contract.

Preview.54 extends the generated-combat branch only to exact sealed native
`Splash`. The source is tracked around `CardModel.OnPlayWrapper`; the offered
set must contain exactly three transient Attack cards owned by the local
player, with the same explicit free-this-turn hand/discard outcome used by the
native source. Wire `source_kind=splash` remains distinct from potion sources.
Unknown cards, derived types, relic generators, and other shared-screen callers
remain fail closed.

Preview.40 models two source-bounded, non-authorizing combat lifecycle phases
under one `combat_transition` Context. `phase=setup` requires the exact current
room to be `CombatRoom`, no blocking Surface, combat not in progress, and
either `CombatManager.IsStarting` or no combat state yet. It uses
`transition=awaiting_combat_start`. `phase=resolution` requires retained combat
state plus a live `NCombatRoom` after combat ended and uses
`transition=awaiting_room_resolution`. Both compose only with `no_action`,
readiness `settling`, zero actions, and `none_fail_closed`. They are absent
from capabilities and permission manifests because they describe lack of
input ownership, not executable Surfaces. Absence of a visible overlay in any
other room remains insufficient evidence and fails closed.

Similar card grids do not imply a shared Surface. Selection limits, selected
cards, preview controls, and opaque-card bindings may be shared structural
facts, but the effect-specific visible semantics, eligibility predicate,
command path, and completion witness remain part of the owning Surface. For
example, merchant removal and deck enchantment are distinct contracts even
though both expose a deck-card selection lifecycle.

## Legal Actions

Each legal action contains an opaque executable identity plus auditable links
to entities already exposed in the current player-visible context or surface:

```json
{
  "action_id": "action_opaque",
  "state_id": "state_opaque",
  "kind": "toggle_card",
  "category": "selection",
  "label": "Select Zap",
  "authority": "game_ui",
  "evidence_code": "NCardGrid.HolderPressed",
  "entity_bindings": [
    { "role": "card", "entity_id": "card_visible_1" }
  ]
}
```

The label and `entity_bindings` are explanatory, not executable. A binding may
only reference an entity already present in the same visible Context/Surface,
including explicit root identities such as `screen_entity_id` and
`room_entity_id`;
it lets clients distinguish duplicate cards, enemies, rewards, and options.
The command still accepts only `action_id`: mutable game objects, target
handles, node paths, indices, and call paths remain inside the registry.

## Command Submission

```json
{
  "request_id": "client-generated-idempotency-key",
  "expected_state_id": "state_opaque",
  "action_id": "action_opaque",
  "client_session_id": "client_opaque",
  "controller_lease_id": "lease_opaque",
  "controller_generation": 1
}
```

The bridge first resolves an existing request ID for idempotent polling. A new
request must hold the current runtime controller lease. The bridge then
rebuilds current state, checks exact state identity, resolves the registered
action, and revalidates its game objects before starting it.

Request IDs are idempotent only for an identical payload. Reusing one with a
different action is rejected. Coordination rejection does not enter the
command ledger and does not count as an operation failure in the D3 permission
state machine.

## Lifecycle

```text
received -> validated -> started -> completed
                     \-> rejected
                     \-> failed
                     \-> timed_out (outcome unknown)
```

`completed` requires the action-specific predicate. In the enchant slice:

| Action | Completion evidence |
|---|---|
| toggle card | selected membership changed |
| preview selection | enchant preview became visible |
| confirm preview | enchant screen closed |
| cancel preview | preview closed and selected set cleared |
| close selection | enchant screen closed |

Additional preview.2 completion evidence:

| Surface/action | Completion evidence |
|---|---|
| event choose | source-backed replacement option set, required child Surface, combat, or room transition; `WasChosen` alone is insufficient |
| shop relic purchase with linked rewards | exact relic gained, exact gold delta, offer advanced, and exact visible linked reward child; a completed failed parent task is never accepted |
| reward Proceed | the purpose-specific reward witness may pass through known intermediate state changes; an unknown outcome is never retried |
| event proceed | map opens or the event room leaves |
| combat play card | card leaves hand, required subsurface opens, or combat ends |
| combat potion | potion leaves its exact slot or combat ends |
| combat end turn | local player play phase ends or combat ends |

Additional preview.3 completion evidence:

| Surface/action | Completion evidence |
|---|---|
| card reward card | reward overlay closes or the visible option object set is replaced |
| card reward alternative | reward overlay closes or the visible option object set is replaced, including reroll |
| outer reward claim | its exact reward button is removed, or a child card-reward overlay replaces the outer screen |
| outer rewards proceed | outer rewards screen exits, its visible reward control set is replaced, or the player-visible map opens |

Preview.15 defines a deliberately narrow merchant-removal child lifecycle. It
is executable only on an exact supported build that observes
`shop + NDeckCardSelectScreen`; it does not generalize other deck selectors.
Preview.16 may observe that same child on its exact v0.109 candidate identity,
but its legal action array is intentionally empty and the lifecycle remains
unqualified.

| Surface/action | Completion evidence |
|---|---|
| merchant removal toggle | selected membership changes, preview opens, or selector closes |
| merchant removal preview | removal preview opens or selector closes |
| merchant removal confirm | selector closes, exact selected instance leaves the run deck, deck count and gold reflect the captured transaction, removal count increments, and the exact service is used |
| merchant removal preview cancel | preview closes and selector remains current |
| merchant removal cancel | selector closes without committing |

On the observed ordinary v0.109 merchant-removal shape, the opaque selection
action completed directly into the preview stage. No separate
`preview_deck_removal` legal action was published. Declared provider operations
are descriptive across supported shapes; the current legal-action array is the
only execution authority for a concrete state.

Current selection and reward completion evidence:

| Surface/action | Completion evidence |
|---|---|
| combat pile card toggle | selected membership changes or the single-pick surface auto-completes |
| combat pile confirm/cancel/peek-close | required selection commits, selection closes, or peek closes respectively |
| combat hand card toggle | exact selected-card instance membership changes |
| combat hand confirm/cancel/peek-close | hand selection commits/closes or peek closes respectively |
| generated card choice select | the choose-a-card overlay closes after its opening input guard |
| generated card choice skip | the choose-a-card overlay closes |
| generated card choice peek-close | peek mode closes without granting underlying combat actions |
| full-belt reward discard | the exact potion leaves its exact slot or the reward surface is replaced |
| potion reward claim | reward set changes or the reward surface is replaced, after capacity is revalidated |
| event dialogue advance | exact current dialogue index advances or the event room closes |
| card bundle preview/confirm/cancel | exact selected bundle enters preview; confirm closes the selector and every selected exact card instance appears in the run deck; cancel returns to choices |
| map node choice | map closes or the exact current map coordinate reaches the selected node |
| map annotation exit | exact annotation mode becomes `none`, or the exact map owner leaves |
| rest Heal | game-native base-heal minimum reached plus rest-option progression; additional native side effects may raise final HP further |
| rest Smith | exact `deck_upgrade_selection` child opens; arbitrary overlays do not complete |
| rest Proceed | map opens or the rest room leaves |
| shop open/close | inventory `IsOpen` becomes true/false respectively |
| typed shop card purchase | purchase task succeeds, exact card instance enters the run deck, exact gold is spent, and the typed entry advances |
| typed shop relic purchase | purchase task succeeds, exact relic instance enters inventory, exact gold is spent, and the typed entry advances |
| typed shop potion purchase | capacity is revalidated; purchase task succeeds, exact potion instance enters a slot, exact gold is spent, and the typed entry advances |
| shop card-removal launch | exact merchant removal child opens or the exact service becomes used |
| shop Proceed | map opens or the merchant room exits |
| deck upgrade confirm | exact selected deck instance is upgraded and the selector closes |
| deck transform confirm | exact selected original instances are absent, run-deck count is preserved, and the selector closes; the random replacement is not disclosed before commit |
| event card acquisition select/deselect | exact selected membership changes, or final auto-commit closes the child, increases run-deck count by the committed selection count, and places every selected exact instance in the run deck |
| treasure relic choose | exact relic ownership increases and the relic selection closes |
| treasure skip | relic ownership is unchanged and the room advances |
| treasure Proceed | treasure room leaves or the map opens |
| game-over advance | exact current Continue starts `_isAnimatingSummary` and becomes disabled; container visibility alone is not evidence |
| game-over return | game-over closes, the run is no longer in progress, and the main menu is loaded |
| character select | exact selected character, exact Ascension delta, active run with selected character, or exact submenu departure |

Event options expose the exact rendered title/description, lock/proceed/chosen
state, visible lethal warning, optional relic semantics, and typed hover tips.
Text hover tips remain text; `CardHoverTip` remains a full visible card preview.
Unknown hover-tip types suppress the Surface instead of being flattened or
silently dropped.

Shop uses two mutually exclusive action-owning Surfaces. `shop_inventory`
contains separate card, relic, potion, and card-removal offer types; it never
publishes a generic purchase action. `shop_room` contains only merchant-open and
Proceed controls. Shared gold and potion occupancy live in `shop` Context.
Affordability is descriptive and is not action authority. Product fields and
`blocked_reason` are nullable protocol semantics and may be omitted by the C#
wire serializer when absent; stocked products must still expose their exact
visible product semantics.

Persistent gold and potion occupancy come from top-level `shared_state`, not
the `shop` Context. Shop legality and execution still belong exclusively to the
active shop Surface.

If the state changes but the predicate does not pass, the command fails with an
unknown outcome. Unknown outcomes are never auto-retried.

For an asynchronous semantic commit, a Surface or panel closing is only an
intermediate transition unless exact game source proves it is the terminal
effect. Merchant removal therefore permits intermediate state IDs while its
source-backed postcondition settles. Preview.23 preserves opaque action identity
while adding purpose-specific upgrade and treasure DTOs. Preview.24 changes
state composition only; it grants no new executable Surface. Preview.25 adds a
source-qualified event card-acquisition canary without generalizing other
`NSimpleCardSelectScreen` purposes.

Clients must verify that every command response repeats the submitted
`request_id`, `expected_state_id`, and `action_id`, and that command
attribution matches the submitting client session, lease ID and generation.
They must also enforce the status/outcome pairs: pending lifecycle states use
`pending`, `completed` uses `confirmed`, `rejected` uses `not_applied`, and
`failed`/`timed_out` use `unknown`. A mismatch is an unknown client outcome,
not success.

## Diagnostics

`diagnostics` is structured. `severity` describes importance; `effect`
describes operational consequence. Only explicit effects and contract
invariants affect action authority. An informational inspection diagnostic may
coexist with actions; `actions_suppressed`, `surface_unsupported`, or
`outcome_unknown` may not.

Legacy `warnings` remain during preview migration. Clients preserve them for
audit but do not infer safety from warning presence or absence.

## Inspection Contract

The Bridge declares three possible read-only Inspection kinds, but a build may
advertise only the kinds that are explicitly permitted for that exact build:

- `run_deck`: current local player's run deck, including per-instance upgrade
  and enchantment semantics;
- `combat_piles`: draw, discard, and exhaust contents while a qualified combat
  context exists;
- `shop_catalog`: the current merchant's typed fixed-slot card, relic, potion,
  and removal-service catalog while the player is in that shop Context. It
  reports whether the inventory is open or closed, but never publishes
  purchase or navigation actions.

All return `visibility_class=normal_inspection`. `run_deck` and
`combat_piles` use `ordering_semantics=unordered_multiset`; serialization order
is deterministic but has no game meaning. In particular, real draw order is
never returned and is declared as `draw_pile_order_hidden_by_policy`.
`shop_catalog` uses `ordering_semantics=fixed_ui_slots`, preserving the exact
visible merchant slot identities without creating a generic ordered-selector
contract.

Inspection requests require the exact current `state_id`, exact supported game
identity, and a fixed advertised kind. They do not return actions, mutate the
game, or enter the command ledger. `inspection_not_available` means the
player/run object does not exist in the current state; clients may treat that
as absent evidence. Stale state, identity mismatch, binding failure, malformed
content, and unsupported expansion remain hard failures.

Clients constructing one decision observation from state plus inspections must
verify that the state remains identical after sidecar capture. A changed state
or inspection `stale_state` rejects the entire composite observation; clients
must not mix facts from adjacent game states. A bounded client may retry that
read as transient evidence, but never reuse an action from the rejected read.

For the source-qualified v0.109 identity, capabilities advertise `run_deck` as
qualified and `combat_piles` plus `shop_catalog` as separate read-only
canaries, producing `mixed_scoped_read_only`. A different exact build may
advertise no Inspection kinds and must then report
`disabled_for_current_build`. Inspection scope is independent of action scope
and is never inferred from historical capabilities.

An empty qualified/canary Surface or Inspection list is always an empty
permission scope. It never means wildcard, all-declared-Surface authority, or
all declared fixed Inspections. Historical exact build identity may permit an
explicit legacy handoff, but no v2 Provider can publish an action and no fixed
Inspection can answer unless its kind appears in the build's explicit qualified
or canary list.

## Error Codes

| Code | Meaning |
|---|---|
| `invalid_json` | malformed request body |
| `invalid_command_contract` | required opaque IDs absent/invalid |
| `invalid_client_contract` | required descriptive client registration fields absent/invalid |
| `invalid_controller_contract` | required controller session, lease, or generation absent/invalid |
| `client_session_not_found` | client was not registered in the current Gateway runtime |
| `controller_lease_held` | another local mutation client currently holds control |
| `controller_lease_stale` | lease ID/generation is expired, released, replaced, or from another runtime |
| `request_id_conflict` | idempotency key reused for another payload |
| `command_capacity_exhausted` | bounded session ledger is full; restart required |
| `stale_state` | expected state no longer current |
| `inspection_not_available` | fixed inspection has no backing player/run object in this state |
| `inspection_scope_mismatch` | inspection requested outside its qualified context |
| `inspection_kind_not_implemented` | kind is not one of the fixed advertised inspections |
| `inspection_binding_failed` | exact-version player-visible binding failed closed |
| `unknown_or_stale_action` | action not registered for current state |
| `screen_stage_changed` | surface changed before execution |
| `card_not_actionable` | bound card/UI object no longer actionable |
| `unexpected_state_transition` | state changed without action-specific proof |
| `completion_probe_failed` | completion observation itself failed |
| `outcome_not_observed` | timeout with unknown outcome |

Error details are safe summaries. Full local exceptions remain in the game log.
