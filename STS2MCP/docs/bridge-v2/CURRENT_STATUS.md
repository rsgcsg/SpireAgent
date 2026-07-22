# Bridge v2 Current Status

Status date: 2026-07-22

## 2026-07-22 Source-Truth Blocker

The current clean checkout is not an end-to-end compatible Bridge/Re product
baseline. The C# Bridge source and installed DLL advertise
`2.0-preview.54`, while current Re-SpireAgent requires
`2.0-preview.56`, `bridge.assembly_file_sha256`, operation permission scopes,
and a `discovery` source branch that the C# source does not implement. Both
projects pass their own unit suites, but there is no cross-language conformance
test that exercises a C# fixture through the current Re decoder.

No game process was running during the 2026-07-22 audit, so there is no current
loaded SHA/MVID/runtime identity. A fresh Release build produced SHA-256
`274825c4c88cf9716732b4bcc871a906d599ced5c51a03199d206e67db92695e`,
which is not byte-identical to the installed preview.54 DLL SHA-256
`7bf3abca5f20594077b31f8e400ef0b27643353846256cb59cb633418a59a8b3`.
This is an exact-artifact closure gap, not proof of a semantic difference.
Historical preview.54 Organic evidence
remains valid only for its exact recorded environment and cannot qualify the
current checkout. Coverage expansion and new permission are paused until
source, Re, installed artifact, loaded identity, capabilities, and docs agree.

The mandatory repair and migration sequence is in the
[real STS2 connector architecture audit](REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md).
This blocker narrows current claims; it does not revoke or rewrite historical
evidence.

## Last Coherent Historical Contract

- protocol: `2.0-preview.54`
- canonical source-qualified game identity: `v0.109.0|c12f634d|-840572606`
- last verified source-target loaded game identity: `v0.109.0|c12f634d|-840572606`
- last verified source-target installed/Release DLL SHA-256:
  `7bf3abca5f20594077b31f8e400ef0b27643353846256cb59cb633418a59a8b3`
- last verified source-target module MVID: `67b8d32b-8c0c-4514-9df7-fac4ac5fb738`
- last verified source-target runtime instance: `db112bc183354e9eb397f6c76121f484`
- last verified source-target Modset status: `exact_bridge_only`
- last verified source-target Modset fingerprint:
  `8371ef20e96178fc38ae2427a749815e13a37747aef58d2d4c48e0a10b3d036b`

Wire field `bridge.upstream_commit=20eadebde358a37cca41f8b38728099e6d0d19db`
identifies the original imported Gennadiyev baseline, not the current
SpireAgent repository revision. The last verified source-target built-code
identity is bound by the Release/installed SHA, loaded MVID, runtime instance,
and exact Modset above.
The wire should eventually add an explicit repository source revision rather
than overloading `upstream_commit`; this naming debt grants no permission.

Audit-time local state is separate from the source-target closeout above. The
installed game now reports `v0.109.0|c12f634d|1833084275`. Available run
`run-20260720065514-b80q0v` records installed Bridge MVID
`0d002485-dc76-4641-8ade-578bef39ee69`, runtime
`b5b3aa0a2eff44e99cdcbb73c0beb3ef`, and only the three explicit alternate-build
action canaries. The Bridge endpoint was unavailable during the 2026-07-20
architecture audit. The audit's Release test build produced SHA-256
`236b5f8190b2d2dab7b9fe0ebffe893dc36f55e543472aa5274ff8d3469d82ae`, MVID
`0d002485-dc76-4641-8ade-578bef39ee69`, byte-identical to the already-installed
DLL; no installation or live-load verification was performed. Therefore the
source-target identity above remains last verified historical runtime evidence,
not a claim about a currently live process. See
[the DecisionFrame/Transaction IR audit closeout](DECISION_FRAME_TRANSACTION_IR_ARCHITECTURE_AUDIT_CLOSEOUT_2026-07-20.md).

Bridge v2 is an incremental, exact-build-scoped protocol. It is not full v1
parity, all-game coverage, or complete player-visible truth.

The repository-level semantic-gateway/headless audit at
`develop@af091244d9b72ad87a5b86e7b9e7ec691b8e7f86` made no protocol, permission,
runtime, or qualification change. It directly re-ran 98 Bridge tests and 149
Re tests plus typecheck/build. It independently decompiled only the audit-time
alternate game assembly `v0.109.0|c12f634d|1833084275` with SHA-256
`ee45848ff6319dfc7af2538d3a52d05d82bef35ee4c5fd0400dc9efe8f9054aa`;
that source review is not evidence for the canonical `-840572606` build and no
new live-load or Organic claim was made.

The audit clarifies that the game-side Bridge is the protocol-neutral semantic
gateway, REST is Re's current transport, and the Python MCP server is an
optional adapter that still includes legacy v1 tools. It also found one
non-authorizing adapter drift: Bridge/Re declare three Inspection kinds, while
the Python MCP v2 observation helper currently exposes only `run_deck` and
`combat_piles`, omitting `shop_catalog`. See
[the semantic-gateway/headless audit closeout](MCP_SEMANTIC_GATEWAY_HEADLESS_ARCHITECTURE_AUDIT_CLOSEOUT_2026-07-20.md).

The docs-only boundary audit at
`develop@54b716261af47395176cb9e968b8aef45a3732db` independently rechecked the
current Bridge/REST/MCP/Re ownership and read `wuhao21/sts2-cli` source at
`d11aa883b582dd68bd39b331f3370746b30d447e`. It establishes
[the Live connection boundary](LIVE_GAME_CONNECTION_BOUNDARY.md) and a
separate, deferred [Headless future-project plan](../../../docs/headless/README.md).
It made no protocol, code, permission, build, install, load, runtime, canary,
qualification, or Organic-evidence change and did not execute `sts2-cli`.

Preview.53 adds an exact native `Graveblast` branch to
`combat_pile_card_selection`. Headbutt and Graveblast share only the visible
exact-one discard selection mechanic; source identity, destination and semantic
completion remain discriminated. Graveblast completion requires the exact
selected reference to move from discard to hand, or remain in discard only
under the native full-hand redirect, with combined cardinality preserved.
Unknown callers remain fail closed. The final preview.53 MVID did not naturally
replay Graveblast, so this branch is source/test/build/load complete but not
Organic-qualified.

Preview.54 closes a natural strict-v2 gap from
`run-20260719235923-qz8bg5`: playing native `Splash` opened
`NChooseACardSelectionScreen`, and preview.53 correctly returned
`unsupported + authority=none` because the source was not tracked. Exact v0.109
source proves a three-Attack, optional-Skip, free-this-turn, combat-hand choice
with native full-hand discard redirect. Preview.54 tracks only exact sealed
`Splash.OnPlayWrapper`; it reuses the generated-combat choice mechanics and
exact hand/discard witness without granting authority to other card generators.

The preview.54 Release was cold-loaded under the identity above. Four strict-v2
runtime windows (`run-20260720000758-ycmcau`,
`run-20260720000955-3zg1o9`, `run-20260720001351-ogghci`, and
`run-20260720001906-r04a9h`) recorded 216 decisions: 211
`executed_and_settled`, three execution-time stale-state refusals, and two
run-boundary stops. Every decision was `bridge_advertised`; no v1 action,
unknown outcome, unsupported Surface, or authority conflict occurred across
combat, hand selection, reward/card reward, map, event, event/rest upgrade,
treasure, shop, rest, game over, and menu. Splash itself did not naturally
recur on the final MVID, so its branch remains a canary rather than qualified.

Two of the three stale refusals repeated one exact native treasure lifecycle:
the relic holder becomes clickable before `NTreasureRoom` enables Skip after
its fixed 2.5-second delay. The complete legal-action set therefore changed
during model deliberation. Re correctly rejected the old state-bound action and
the next tick selected the same relic successfully. This is an explained,
fail-closed efficiency cost, not a command or qualification failure; hiding the
already-clickable relic or freezing state identity would be less truthful. See
[the treasure skip-delay audit](TREASURE_SKIP_DELAY_STATE_DRIFT_AUDIT_2026-07-20.md).

Re integration now distinguishes a real coherent-Inspection contract mismatch
from lifecycle drift without weakening either boundary. In strict-v2 run
`run-20260719233653-zsgua8`, a Bridge-confirmed map-to-shop action reached the
shop, but the first settlement read crossed the merchant lifecycle and received
`inspection_scope_mismatch` for `shop_catalog`. Re now performs one fresh,
non-authorizing state read: only a changed `state_id` becomes retriable
composite-read drift; a same-state mismatch remains a hard error. Follow-up run
`run-20260719234320-ze6fp0` settled all 15 Bridge-advertised decisions across
shop, map, event acquisition, and combat with no error or v1 action. This is a
Re client fix only; preview.52 protocol, DLL identity, permissions, and
qualification tiers are unchanged.

Preview.52 closes a natural strict-v2 failure found at tick 79 of
`run-20260719231523-l68939`. Attack Potion opened the shared generated-card
screen, but preview.51 intentionally knew only Lead Paperweight and Colorless
Potion sources and therefore returned `unsupported + authority=none`. Exact
v0.109 source shows that native Colorless, Attack, Skill, and Power Potions
share one business outcome: three generated choices, optional Skip, selected
card free this turn, and hand insertion with discard overflow. The Bridge now
tracks exactly those four sealed source types under one bounded combat-potion
mechanism while retaining distinct `source_kind` values. Every other potion,
generator, subclass, and Mod origin remains fail closed.

After cold load, the saved floor-7 elite naturally replayed Attack Potion in
`run-20260719232912-qd6f0j`. The child stayed non-actionable during its input
guard, then exposed three exact Attack cards as `source_kind=attack_potion`.
DeepSeek chose Rattle; command completion proved source-task completion, child
closure, exact-reference hand/discard cardinality `+1`, and free-cost policy.
The successor combat hand contained the same Rattle entity at cost `0`.
Twenty-nine other actions settled; one coherent Inspection read observed a
normal state race and was retried by the next tick without action dispatch.
This is Organic canary evidence for Attack Potion only. Skill and Power Potion
branches are exact-source audited and contract-tested, not Organic-qualified.

Preview.51 fixes a combat visibility overclaim discovered by natural
Necrobinder run `run-20260719225440-hb3j7n`: combat Context claimed immediate
completeness while omitting Osty's current HP, Max HP, block, and visible
statuses even though native `NCombatRoom` renders the pet and Osty's damage is
defined from current HP. Exact v0.109 source identifies
`PlayerCombatState.Pets` as the authoritative owner and
`MonsterModel.IsHealthBarVisible` as the disclosure boundary. Combat player
state now contains typed `companions`; HP values exist only while the native
health bar is visible. This is read-only Context, not a new Surface or action.

On the loaded identity above, fresh ordinary Necrobinder A0 run
`run-20260719230912-qnblao` recorded 30/30 settled strict-v2 decisions across
event, map, two combats, reward, and card reward. Its combat states exposed
exact Osty instances and visible `2/2` HP plus `Die for You`; normalized schema
22 preserved those facts in the DeepSeek prompt. A real response used the
field to calculate `Unleash = 8 + 2`. There was no v1 authority, failed
command, timeout, or unknown outcome. This qualifies the alive companion
projection on this exact MVID; dead/hidden-health omission is source-audited
and fixture-tested but still lacks an Organic lifecycle sample.

Preview.50 fixes a command-lifecycle defect found by natural strict-v2 run
`run-20260719224136-9a48po`. `The Legends Were True -> Nab the Map` changed
state before its replacement Proceed option was attached, so the old event
contract failed the command as `unexpected_state_transition` even though the
business action had applied. The global ledger remains fail-closed; only the
known asynchronous `event_option` and `proceed_event` transitions explicitly
allow intermediate states while waiting for their existing semantic witness.

After cold load, the saved run restored the exact pre-choice event. The same
`Nab the Map` action remained pending across the intermediate state and then
completed with `event_option_replaced_or_required_subsurface_opened` when the
Proceed option appeared. Strict-v2 follow-up `run-20260719224802-jpyv00`
recorded 33 Bridge-owned decisions through Proceed, map, combat, combat-hand
selection, game over, and main menu: 32 confirmed actions and one non-actionable
run boundary, with no v1, stale action, failed command, timeout, or unknown
outcome. This is current-MVID regression evidence, not a permission expansion.

Preview.49 requalifies `deck_enchant_selection` only as a current-build action
canary. Exact v0.109 source shows that Self-Help Book awaits the selection
overlay and applies the enchantment afterward, so overlay closure alone is not
semantic completion. Confirm now captures the exact selected card instances,
target enchantment ID, and amount; execution revalidates all of them and
completes only after the overlay closes and every captured card contains that
exact enchantment.

On the loaded identity above, an operator-targeted Self-Help Book lifecycle
exposed `SWIFT x2`, selected `Creative AI+`, exercised preview cancel and
selection reset, then confirmed with evidence
`enchantment_screen_closed_and_exact_cards_enchanted`. A state-bound
`run_deck` Inspection independently observed the same card entity with
`SWIFT x2`. Strict-v2 continuation `run-20260719223336-z4erxn` then recorded
50 Bridge-owned decisions through event Proceed, map, combat, game over, and
main menu: 36 settled, 11 safely rejected before dispatch as stale, one
checkpoint-pending game-over transition, and two non-actionable boundaries.
It used no v1 fallback and produced no failed, timed-out, or unknown command.
This is bounded current-build canary and coverage evidence, not qualification.

Preview.48 adds the state-bound, read-only `shop_catalog` Inspection for the
current shop Context. It exposes the same exact typed merchant inventory,
fixed UI slot order, prices, stock, affordability, potion-capacity blocks, and
removal-service state that the player can inspect by opening the inventory.
When the inventory is closed, every offer remains non-purchasable and the
Inspection publishes no actions. It is a current-build canary, not a qualified
Inspection and not a new command scope.

The final preview.48 artifact was cold-loaded under the identity above. A
strict Re read at closed and open inventory decoded `run_deck` plus
`shop_catalog` without diagnostics. Operator-positioned run
`run-20260719215323-ej3no7` exercised card/relic purchases and the full
merchant removal child lifecycle; one action was safely rejected before
execution after state drift. Follow-up run `run-20260719215617-longql` closed
the inventory, left the shop directly from the catalog-bearing room state,
travelled through map, and entered combat without reopening the catalog or
using v1. This is bounded canary and integration evidence, not automatic
qualification.

Preview.47 closes evidence-backed contract gaps without changing the permission
matrix. Orrery-style relic purchases can now acknowledge a visible linked
reward continuation without waiting for the parent purchase task to finish;
reward Proceed accepts its known intermediate transition. State now advertises
a bounded `visibility` declaration and typed `inspection_catalog`, while
`POST /api/v2/observation-bundles` returns one state plus requested read-only
Inspections under one coherent state/environment identity. Re consumes that
bundle instead of composing eager sidecars through multiple state reads.

Preview.47 also emits a non-authorizing `contract_instance_shadow`. It exposes
the manifest contract, published operations, current legacy authority tier,
and known limitations, but remains `authorizing=false`; exact-environment plus
Surface-kind lists still own real permission. Intermediate preview.47 MVID
`eb96741b-42ce-43e1-86b3-6d71a1caea4e` confirmed Continue into the saved-run
shop and returned a coherent shop + run-deck observation. The first Continue
record was mislabeled unsettled only because Re treated omitted nullable shadow
fields in a transitional state as required; that decoder bug is fixed without
changing command or permission behavior. Final loaded MVID
`784bbdc5-e7b3-40e7-872f-3c8ba538f9b0` has passed capabilities, state,
coherent-bundle, strict Re inspection, and a bounded operator-positioned
journey. Its `continue_run` settled, followed by 40 strict-v2 decisions across
shop/removal, map, combat, reward, and card reward: 39 settled and one combat
action was safely rejected before execution as stale. All 40 observations were
coherent, all selected actions were Bridge-advertised, and the shadow remained
`authorizing=false`. This is current-MVID coverage/canary evidence, not an
automatic qualification upgrade; no evidence is transferred from the
intermediate MVID.
Run metadata now supports explicit evidence provenance; old records remain
`unrecorded` and may support coverage/debugging but not qualification alone.

Detailed evidence and architectural decisions are in
[the Re observation-scope drift closeout](RE_OBSERVATION_SCOPE_DRIFT_CLOSEOUT_2026-07-20.md),
[the preview.52 closeout](PREVIEW_52_GENERATED_COMBAT_POTION_FAMILY_CLOSEOUT_2026-07-20.md),
[the preview.51 closeout](PREVIEW_51_COMBAT_COMPANION_VISIBILITY_CLOSEOUT_2026-07-20.md),
[the preview.50 closeout](PREVIEW_50_EVENT_ASYNC_TRANSITION_CLOSEOUT_2026-07-20.md),
[the preview.49 closeout](PREVIEW_49_DECK_ENCHANT_SEMANTIC_COMPLETION_CLOSEOUT_2026-07-20.md),
[the preview.48 closeout](PREVIEW_48_SHOP_CATALOG_AND_PROGRESS_GUARD_CLOSEOUT_2026-07-20.md),
[the preview.47 closeout](PREVIEW_47_LINKED_REWARDS_COHERENT_OBSERVATION_AND_AUTHORITY_SHADOW_2026-07-19.md),
[ADR-0004](ADR-0004-contract-instance-authority-and-player-visible-closure.md),
and the
[authority/visibility architecture review](ARCHITECTURE_REVIEW_TIERED_AUTHORITY_AND_VISIBILITY_2026-07-19.md).

Preview.31 closes a backward permission leak: an empty per-build Surface or
Inspection scope is now unconditionally empty, never an implicit wildcard.
Preview.32 independently source-audited `event_option`. Preview.33 extends the
same current-build canary only to source-gated `event_card_acquisition` after
checking the exact selector, source calls, and deck commit path. Preview.34
adds only `map_navigation` after rechecking current `NMapScreen`, `NMapPoint`,
route readiness, exact-node execution, and coordinate completion. Its final
audit then found that the shared node predicate omitted the controller-only
`IsNodeOnScreen` gate from `NMapPoint.OnRelease`. Preview.35 adds that gate to
both publication and execution and re-exercises map travel on a fresh MVID. It
does not copy the older source-target permission set. Every qualified action
list and every Inspection list remain empty for `1833084275`; all unlisted
contracts fail closed. That hash is a historical alternate-device environment,
not the current workspace loaded identity.

The preview.35 infrastructure build starts a non-authorizing typed
contract/evidence/visibility inventory. Capabilities remain byte-equivalent to
the previous loaded build after excluding MVID/runtime identity. Manifest
presence never grants permission; exact-environment lists remain authoritative.

Preview.36 closes an exact-environment gap: game version/commit/hash no longer
stand in for the loaded Modset. Capabilities, state, Inspection, Re
normalization, and legacy-fallback evaluation now bind to one deterministic
Modset fingerprint. Current loaded observation found exactly one loaded Mod,
the exact `STS2_MCP` assembly and MVID above. Extra loaded Mods, failed/runtime-
added Mods, missing Bridge identity, or state/capability Modset mismatch clear
all action and Inspection scopes. Disabled Mods remain visible in identity but
do not invent runtime effects. This adds no Surface and grants no Mod
compatibility or inherited permission.

Preview.37 replaces the root-menu v1/fail-closed gap with two bounded semantic
contracts: `main_menu` and `singleplayer_menu`. They share typed visible menu
facts but retain independent source bindings, operations, and completion
witnesses. A live modal preempts both. Unsupported visible choices never become
actions. The final loaded MVID organically exercised only `continue_run`; the
saved-run UI hid Single Player, so the other menu operations remain
source-audited canary operations rather than Organic evidence.

Preview.38 closes the naturally observed Whispering Hollow random-transform
gap with a purpose-specific `deck_transform_selection` canary. The exact
source, current controls, selected card instances, visible upgrade mode, and
random-uncommitted preview semantics are explicit. The cycling preview never
becomes a prediction of the committed replacement. The exercised confirmation
completed only after the original exact instance disappeared and run-deck
count remained stable. Other transform callers, cancel variants, Mods, and
future builds do not inherit this authority or evidence.

Preview.39 corrects one bounded lifecycle misclassification without adding a
Surface provider or permission. Exact `CombatRoom` post-combat settlement with
no blocking input owner is now `post_combat + no_action + none_fail_closed`
instead of `unknown + unsupported`. A current-build Organic sequence captured
that state between `combat_turn` and `reward_claim`; it published zero actions
and strict v2 continued. Unknown rooms and other no-overlay gaps remain
unsupported.

Preview.40 replaces that one-sided observation with a source-bounded
`combat_transition` Context. `phase=setup` means the exact `CombatRoom` has
entered `CombatManager.IsStarting` or has not yet created combat state;
`phase=resolution` means combat state still exists after combat ended while a
live `NCombatRoom` is settling. Both compose only with `no_action`, publish
zero actions, and remain absent from capabilities and permission manifests.
Unknown rooms, ambiguous ownership, and generic no-overlay gaps still fail
closed. Current-MVID high-frequency evidence captured two setup and two
resolution observations between ordinary Bridge-owned states.

Preview.41 requalifies only the read-only `combat_piles` Inspection as a
current-build canary. It remains independent of action authority and returns
unordered draw/discard/exhaust multisets; true draw order stays hidden. The
exact v0.109 source and UI bindings were re-audited, Bridge/Re tests passed, and
the installed MVID above produced two state-bound Organic snapshots whose pile
counts exactly matched combat context before and after a confirmed end turn.
The superficially related `combat_pile_card_selection` Surface remains disabled:
its exact callers have different business purposes and require caller-specific
Source Binding and semantic Outcome Witnesses rather than prompt-based or
screen-closure inference.

Preview.42 re-enables only the exact Lead Paperweight origin of
`generated_card_choice` as a current-build action canary. A source-binding
tracker around `RelicCmd.Obtain` distinguishes this run-deck acquisition from
combat-generated hand cards, Hefty Tablet, Knowledge Demon, and unknown Mod
callers that reuse the same selection UI. The wire records purpose, source, and
destination. Selection completes only when the source task finishes, the
Surface closes, the exact selected card reference enters the run deck, and the
deck grows by one. Re organically selected Dramatic Entrance and recorded that
exact semantic post-state. Skip and every other caller remain unqualified.

Preview.43 fixes the negative path shared by five purpose-specific selection
providers. A missing or contradictory source binding now emits only
`unsupported + none_fail_closed + legal_actions=[]` with typed diagnostics;
it cannot retain a business Surface kind with `bridge_owned` authority. A
Colorless Potion child organically exercised this safe stop before that source
had a semantic contract. The helper centralizes no business legality and
grants no permission.

Preview.44 adds only exact `ColorlessPotion.OnUse` as a second discriminated
branch of `generated_card_choice`. Its combat destination, free-this-turn
policy, and full-hand discard overflow are explicit. Selection completion
requires source-task completion, child closure, the exact offered entity newly
present in hand or discard, pile cardinality `+1`, and the temporary free-cost
modifier. Re organically selected Omnislice and observed the same entity in
the successor hand at cost zero. Colorless Skip, full-hand overflow Organic
evidence, and every other source remain outside qualification.

Preview.45 adds only the exact Headbutt discard-to-draw-top child as a
`combat_pile_card_selection` action canary. The first Organic action exposed a
real completion-observer bug and ended unknown; the corrected build retains
exact-card/source-task/draw-top witnesses but has not yet naturally reproduced
the action. It is implemented and canary-permitted, not qualified. Every other
pile-selection origin remains fail closed.

Preview.46 closes a player-visible shared-state gap for `CardHoverTip`. Relics,
run modifiers, owned potions, shop relics, and treasure relics now expose typed
read-only `card_previews` alongside text keywords. An intermediate build used
ephemeral tooltip object identity and changed `state_id` on every poll; the
final build replaces only preview identity with deterministic owner-scoped
identity. On the final MVID, Cursed Pearl organically exposed Greed plus
Eternal/Unplayable semantics, eight repeated reads retained one state ID, Re
decoded state-bound run-deck Inspection, and Neow Proceed settled. No action
authority was added by the new visible facts.

## Current Permission Matrix

| Permission | Contracts |
|---|---|
| source-qualified `v0.109.0|c12f634d|-840572606`: `qualified_exact_build` | `deck_removal_selection`, `deck_upgrade_selection`, `combat_turn`, `combat_hand_card_selection`, `rest_site` |
| source-qualified `v0.109.0|c12f634d|-840572606`: `candidate_action_canary` | `event_card_acquisition`, `reward_claim`, `card_reward_selection`, `map_navigation`, `shop_inventory`, `shop_room`, `treasure_room`, `game_over`, `card_bundle_selection`, `character_select`, `main_menu`, `singleplayer_menu`, `event_dialogue`, `event_option`, `deck_transform_selection`, Surface-level `deck_enchant_selection`, exact Headbutt/Graveblast `combat_pile_card_selection`, source-scoped `generated_card_choice` |
| source-qualified `v0.109.0|c12f634d|-840572606`: `qualified_read_only_scoped` | `run_deck` Inspection |
| source-qualified `v0.109.0|c12f634d|-840572606`: `candidate_read_only_canary` | `combat_piles`, `shop_catalog` Inspections |
| source-qualified target: disabled | every non-Headbutt/non-Graveblast `combat_pile_card_selection` origin, every unlisted contract; every `generated_card_choice` origin except exact Lead Paperweight, native Colorless/Attack/Skill/Power Potions, and native Splash remains fail closed |
| source-qualified target: unresolved governance gap | only Self-Help Book has recorded `deck_enchant_selection` canary evidence, but the Provider does not runtime-bind that source; any matching native enchant screen on the Surface-permitted exact build can publish actions |
| audit-time alternate-device `v0.109.0|c12f634d|1833084275`: `candidate_action_canary` | `event_option`, `event_card_acquisition`, `map_navigation` |
| audit-time alternate-device `v0.109.0|c12f634d|1833084275`: disabled | every qualified Surface scope, the other 20 declared Surfaces, `run_deck`, `combat_piles`, and every unlisted Inspection |

Source implementation, target-build permission, local build/install/load,
canary, and Organic qualification are separate states. There are 23 declared
semantic Surface contracts: the source-qualified target permission profile has
five qualified, seventeen canary-permitted, and one disabled Surface kind. The
audit-time alternate-device profile has three canaries and no qualified
contract. These are code-level permission profiles, not claims that either
artifact is currently loaded.

## Preview.47 Coherent Observation And Authority-Shadow Closeout

- Bridge tests: `92/92`; Re strict tests: `145/145`; typecheck, production
  builds, and Bridge Release build passed.
- Release/installed SHA, loaded MVID/runtime, exact game identity, and Modset
  are recorded in the current contract block above.
- `continue_run` was Bridge `completed/confirmed` and reached
  `shop + shop_room`; a Re decoder regression in an unresolved, non-authorizing
  shadow field was corrected and covered by a transitional-state fixture.
- A live `run_deck` observation bundle was coherent with the exact shop
  `state_id`; strict Re inspect consumed the same contract with no action
  authority from Inspection or shadow metadata.
- Historical preview.46 runs identified linked Orrery rewards, reward Proceed
  intermediate-state handling, Pael's Tooth unsupported semantics, and eager
  sidecar drift. Their provenance is unrecorded and they remain scoped to the
  preview.46 MVID.

## Preview.46 Typed Card-Hover Shared-State Closeout

- Bridge tests: `90/90`; Re strict tests: `142/142`; typecheck, production
  builds, and Python compilation passed.
- Final Release/installed SHA, loaded MVID/runtime, exact game identity, and
  Modset are recorded in the current contract block above.
- Cursed Pearl organically exposed typed Greed preview plus Eternal and
  Unplayable text semantics. Eight reads retained `state_a33462ad51_4` and
  `tooltip_card_c1c5ff48d52b62d08d5c`.
- Re strict-v2 decoded the same state and state-bound run-deck Inspection with
  no diagnostics; the following Neow Proceed settled.
- Run `run-20260718181820-m33mb0` then crossed map, combat, reward, card reward,
  and shop with Bridge-owned actions only. Its no-progress guard stopped a
  model-driven shop close/reopen cycle; this is not a Bridge unknown outcome.

Detailed evidence is in
[PREVIEW_46_TYPED_CARD_HOVER_SHARED_STATE_CLOSEOUT_2026-07-18.md](PREVIEW_46_TYPED_CARD_HOVER_SHARED_STATE_CLOSEOUT_2026-07-18.md).

## Preview.45 Headbutt Combat-Pile Canary

The exact Headbutt source and selected card were organically exercised, but
the first action ended unknown because intermediate parent-state movement was
not accepted. The observer is fixed and loaded evidence was obtained, but the
post-fix semantic completion has not naturally recurred. Canary permission is
retained; qualification is not claimed.

Detailed evidence is in
[PREVIEW_45_HEADBUTT_COMBAT_PILE_SOURCE_BINDING_CANARY_2026-07-18.md](PREVIEW_45_HEADBUTT_COMBAT_PILE_SOURCE_BINDING_CANARY_2026-07-18.md).

## Preview.44 Colorless Potion Source-Binding Canary

- Bridge tests: `88/88`; Re strict tests: `142/142`; Re typecheck, Re
  production build, and Bridge Release build passed.
- Release/installed SHA match; the running process reports the exact
  MVID/runtime/game/Modset identity in the current contract block above.
- State `state_c1ade4a05d_5` exposed exactly three generated Colorless cards,
  Skip, combat-hand destination, free-this-turn cost policy, and full-hand
  discard overflow. No prompt or shared-grid inference supplied purpose.
- Re run `run-20260718172631-zcwq84`, decision
  `decision-000001-mrqn2a3i-syekxt`, selected Omnislice with opaque action
  `action_9533c40ebe6b336b0052`. Request
  `re-p1-5d85b767-3233-4848-971d-fc041dff788a` completed only after the exact
  selected entity entered hand/discard with the free-this-turn modifier.
- Successor `state_c1ade4a05d_6` contained exact entity
  `card_5045740d_34` in hand at cost `0`. Re recorded
  `executed_and_settled`; no v1 transport participated.
- Architecture choice C shares typed one-of-N mechanics but preserves distinct
  Lead Paperweight and Colorless Potion source contracts and witnesses.

Detailed evidence is in
[PREVIEW_44_COLORLESS_POTION_SOURCE_BINDING_CANARY_2026-07-18.md](PREVIEW_44_COLORLESS_POTION_SOURCE_BINDING_CANARY_2026-07-18.md).

## Preview.43 Fail-Closed Provider Contract

Five purpose-specific selectors now return one legal non-authorizing wire
shape when source binding fails. The exact Colorless Potion child on preview.43
proved Re can stop safely rather than crash or inherit another origin's
authority. Preview.44 supersedes the loaded artifact; preview.43 evidence
remains scoped to its own MVID.

Detailed evidence is in
[PREVIEW_43_FAIL_CLOSED_PROVIDER_CONTRACT_2026-07-18.md](PREVIEW_43_FAIL_CLOSED_PROVIDER_CONTRACT_2026-07-18.md).

## Preview.42 Lead Paperweight Source-Binding Canary

- Bridge tests: `86/86`; Re strict tests: `140/140`; Re typecheck and both
  production builds passed; Bridge Release had zero warnings.
- Release and installed SHA match; the loaded MVID/runtime, exact game
  identity, and Modset match the current contract block above.
- State `state_65ab2316b8_6` exposed only exact Lead Paperweight run-deck
  acquisition with two offered Colorless cards and Skip. Purpose was not
  inferred from the shared UI or prompt.
- Re run `run-20260718164741-suylea`, decision
  `decision-000001-mrqlocou-orf2j9`, selected Dramatic Entrance using an opaque
  v2 action. Request `re-p1-4d908857-cd93-4390-a0ad-3d7e9ad701c8` completed
  only after the source task closed and the exact selected entity appeared in
  a run deck that grew from 11 to 12 cards.
- Architecture choice C reuses internal one-of-N mechanics and a typed source
  binding while preserving a purpose-specific Surface and semantic witness.
  Hefty Tablet, combat generators, Knowledge Demon, unknown Mods, and Skip
  remain outside Organic qualification.

Detailed evidence is in
[PREVIEW_42_LEAD_PAPERWEIGHT_SOURCE_BINDING_CANARY_2026-07-18.md](PREVIEW_42_LEAD_PAPERWEIGHT_SOURCE_BINDING_CANARY_2026-07-18.md).

## Preview.41 Combat Piles Inspection Canary

- Bridge tests: `85/85`; Re strict tests: `139/139`; typecheck and both
  production builds passed; Bridge Release had zero warnings.
- Release and installed SHA match; the loaded MVID/runtime, exact game
  identity, and Modset match the current contract block above.
- State `state_03e38963dc_4` exposed context counts `12/0/0`; Inspection
  `inspection_b6552db302f411630767` returned the same draw/discard/exhaust
  counts with complete card multisets and no diagnostics.
- Opaque request `preview41-end-turn-1784391367` completed. At successor state
  `state_03e38963dc_a`, context and Inspection
  `inspection_540144d7c94d5b1fd14a` both reported `7/4/1`, including the
  exhausted Ascender's Bane. Re strict inspection decoded both fixed kinds
  without diagnostics or v1 reconstruction.
- This is a read-only canary, not broad qualification. It grants no command,
  does not enter the command ledger, and deliberately excludes draw order.
- Discovery run `run-20260718162006-ub1nvb` completed 28 consecutive v2
  actions across combat, hand selection, rewards, card reward, and map before
  reaching a fresh game-over intro. Re previously stopped before that already
  legal game-over action because its one-game boundary conflated finishing the
  current run with starting another. The boundary now permits the existing
  game-over intro/summary/return contract and stops only at the resulting
  top-level menu.
- Regression run `run-20260718162449-yvvf7o` confirmed both fresh game-over
  actions, then stopped at `menu + main_menu` without sending a menu decision.
  A one-tick menu check records `stopReason=run_boundary` and exits cleanly;
  real execution failures remain nonzero.

Detailed evidence is in
[PREVIEW_41_COMBAT_PILES_INSPECTION_CANARY_2026-07-18.md](PREVIEW_41_COMBAT_PILES_INSPECTION_CANARY_2026-07-18.md).

## Preview.40 Combat Transition And Runtime Guard Closeout

- Bridge tests: `84/84`; Re strict tests: `139/139`; both production builds
  and Re typecheck passed; Bridge Release had zero warnings.
- Release/installed SHA, loaded MVID/runtime, exact game identity, and Modset
  match the current contract block above.
- Organic states `state_a5162da2cc_4` and `state_a5162da2cc_94` were
  `combat_transition(setup) + no_action`; states
  `state_a5162da2cc_2f` and `state_a5162da2cc_8b` were
  `combat_transition(resolution) + no_action`. All were settling,
  `none_fail_closed`, and published zero actions.
- Strict-v2 run `run-20260718155144-xkdstj` completed 40/40 decisions through
  combat, reward, card reward, and map. Every decision used
  `bridge_advertised` authority and an opaque v2 action; all 40 were confirmed
  and settled, with no v1 action or command failure.
- Re now stops a repeated semantic transition even when Bridge regenerates
  state/action IDs. The guard strips transport identity only; gold, HP,
  inventory, deck, entity bindings, stage, and action semantics remain part of
  progress. Organic run `run-20260718154042-ftcmwf` stopped the repeated
  `shop_room -> shop_inventory -> shop_room -> shop_inventory` cycle on the
  second semantic occurrence.
- Re records Bridge command completion separately from readiness of the next
  stable decision checkpoint. A confirmed opaque v2 action that reaches a
  different valid but still transitional state becomes
  `executed_checkpoint_pending`; the next tick re-reads and the action is never
  retried. Legacy acknowledgement, unchanged state, read error, and unknown
  command outcome remain terminal.

Detailed evidence is in
[PREVIEW_40_COMBAT_TRANSITION_AND_RUNTIME_PROGRESS_GUARD_CLOSEOUT_2026-07-18.md](PREVIEW_40_COMBAT_TRANSITION_AND_RUNTIME_PROGRESS_GUARD_CLOSEOUT_2026-07-18.md).

## Historical Preview.39 Post-Combat Lifecycle Closeout

- Bridge tests: `77/77`; Re strict tests: `135/135`; both production builds
  and Re typecheck passed; Bridge Release had zero warnings.
- Its Release/installed SHA, loaded MVID/runtime, exact game identity, and
  Modset were recorded in its own closeout report. Preview.40 supersedes its
  wire shape without reassigning the older evidence.
- Organic state `state_f8d5a2449f_1ab` was
  `post_combat + no_action + settling + none_fail_closed`, with zero actions
  and diagnostic `bridge.lifecycle.no_input_transition`.
- Its predecessor was Bridge-owned `combat_turn`; its successor was
  Bridge-owned `reward_claim`. No v1 transport or action authority existed in
  the transition.

Detailed evidence is in
[PREVIEW_39_POST_COMBAT_NO_INPUT_TRANSITION_CLOSEOUT_2026-07-18.md](PREVIEW_39_POST_COMBAT_NO_INPUT_TRANSITION_CLOSEOUT_2026-07-18.md).

## Preview.38 Deck Transform Closeout

- Bridge tests: `76/76`; Re strict tests: `133/133`; both production builds
  and Re typecheck passed before the final evidence-status rebuild.
- Upgrade-view presentation changed the displayed Strike to Strike+ and back
  without changing its entity binding.
- Selection opened a `random_uncommitted_cycle` preview with
  `replacement_known=false`; Re strict v2 accepted it with zero normalization
  diagnostics.
- Confirmation request `preview38-confirm-transform-1784386346` completed
  `confirmed` through
  `transform_screen_closed_original_instances_absent_and_deck_count_preserved`.
- Run deck remained 14 cards, the exact original Strike instance was absent,
  and a new Creative AI instance was present.
- Only selection, confirm, and upgrade-view operations gained Organic-canary
  evidence. Separate preview-button and cancel operations remain source-audited.

Detailed evidence is in
[PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md](PREVIEW_38_DECK_TRANSFORM_CLOSEOUT_2026-07-18.md).

## Preview.37 Menu Navigation Closeout

- Bridge tests: `75/75`; Re strict tests: `132/132`; both production builds
  and Re typecheck passed. Bridge Release had zero warnings.
- Release/installed SHA, loaded MVID/runtime, exact game identity, and Modset
  match the current contract block above.
- Re strict inspection accepted `menu + main_menu + bridge_advertised`, with
  only opaque `continue_run`; unsupported visible root choices produced no
  actions.
- Command `preview37-final-continue-1784384566` completed and confirmed via
  `saved_singleplayer_run_became_active`; the successor was a Bridge-owned Neow
  event state.
- Root Single Player and the submenu were hidden by the valid saved run. Their
  operations therefore remain source/fixture evidence only.

Detailed evidence is in
[PREVIEW_37_MENU_NAVIGATION_CLOSEOUT_2026-07-18.md](PREVIEW_37_MENU_NAVIGATION_CLOSEOUT_2026-07-18.md).

## Preview.36 Exact Modset Identity Closeout

- Bridge contract tests: `73/73`.
- Re-SpireAgent strict tests: `130/130`; typecheck and production build passed.
- Python MCP server syntax compilation and zero-warning Bridge Release build
  passed.
- Installed SHA equals the Release SHA. Steam cold-load reported protocol,
  MVID, runtime, exact game identity, and the Modset fingerprint at the top.
- Current `ModManager` evidence is `STS2_MCP:Loaded` only. Normalized preview.35
  versus preview.36 capabilities are identical after removing expected
  protocol/module/runtime/modset fields, including the `5 + 12` action scopes
  and one qualified Inspection.
- Re strict decoding accepted the loaded root-menu diagnostic state as
  `unknown + unsupported + none_fail_closed`, with zero actions. Root-menu
  coverage remains a separate unsupported/v1-owned debt.

Detailed evidence is in
[PREVIEW_36_MODSET_IDENTITY_CLOSEOUT_2026-07-18.md](PREVIEW_36_MODSET_IDENTITY_CLOSEOUT_2026-07-18.md).

## Preview.35 Map Navigation Revalidation

- `CanAdvertiseMapChoice` is now the shared pure node validator. It requires
  exact travelable state, enabled UI, the FTUE gate, and, while a controller is
  active, `NMapScreen.IsNodeOnScreen`. A missing controller manager also fails
  closed. Publication and execution call the same validator.
- Bridge `64/64`, Re `128/128`, strict typecheck, production build, tracked
  Python compilation, and a zero-warning Release rebuild passed.
- After the new DLL was installed and cold-loaded, v1 was used only as a
  bounded transport through the unsupported main menu, floor-five combat, and
  rewards. Those actions are not Bridge evidence. They reached a fresh map at
  current `(5,4)` with one legal next node `(5,5) monster`.
- Re strict inspect accepted state `state_ed14bb023a_1`, the same exact node,
  diagnostics `ok`, `bridge_advertised` authority, and no Inspection facts.
- Request `preview35-map-1784363763173` selected exact entity
  `map_node_f43f0d90_18`. Its lifecycle was
  `received -> validated -> started -> completed`, outcome `confirmed`, with
  evidence `map_closed_or_current_map_coordinate_reached`.
- The successor was another real combat. `combat_turn` remains
  `not_qualified_for_current_build`; Bridge and Re expose combat Context but
  no authority, no Inspection, and zero actions.
- This map canary belongs only to the current SHA, MVID, runtime, and exact game
  identity at the top. The two event Surfaces are canary-permitted but were not
  re-exercised on this final MVID; their Organic evidence remains attached to
  preview.33/34 identities.

Detailed evidence is in
[PREVIEW_35_MAP_CONTROLLER_GATE_CLOSEOUT_2026-07-18.md](PREVIEW_35_MAP_CONTROLLER_GATE_CLOSEOUT_2026-07-18.md).

## Historical Preview.34 Map Navigation Evidence

- Current `NMapScreen` still exposes the exact open/travel/traveling lifecycle,
  private `_isInputDisabled`, drawing mode, and `OnMapPointSelectedLocally`.
  Current `NMapPoint.OnRelease` requires a travelable node, FTUE gate, no
  drawing mode, and a visible/controller-valid point.
- The Provider published unique current UI nodes satisfying travelable state,
  enabled UI, coordinate, FTUE, and route readiness. The same predicate was
  used during execution, but it did not yet include the controller-only
  `IsNodeOnScreen` gate. The exercised mouse/single-player path was valid; the
  wider controller variant was not yet fully fail closed.
- After a cold Steam restart, v1 `menu_select:continue` was used only to reach
  the persisted run because root main menu is not a v2 Surface. The restored
  Brain Leech steps were then completed through preview.34 opaque v2 commands.
- Re strict inspect accepted map state `state_287469a4de_7` with current
  coordinate `(4,3)`, 60 visible topology nodes, and exactly two Bridge actions:
  `(3,4) monster` and `(5,4) unknown`. It exposed no Inspection facts.
- Request `preview34-map-1784362747378` selected the exact `(5,4)` node. Its
  lifecycle was `received -> validated -> started -> completed`, outcome
  `confirmed`, with evidence `map_closed_or_current_map_coordinate_reached`.
- The successor was a real floor-five combat. `combat_turn` remained
  `not_qualified_for_current_build`; Bridge and Re exposed combat Context but
  `unsupported`, no authority, no Inspection, and zero legal actions.
- All preview.34 evidence belongs only to SHA
  `b029d0119f70ba19c582c2dfe5148622b9c3f006fee66b4672dcb43a630acb97`,
  MVID `ff3537d8-ee16-4ae3-9e18-0796f87abe7e`, runtime
  `8fd06a38d2c841debdd0b7796888af39`, and the same exact game identity. It is
  historical mouse/single-player canary evidence, not qualification and not
  evidence for preview.35.

Detailed evidence is in
[PREVIEW_34_CURRENT_BUILD_MAP_NAVIGATION_CANARY_2026-07-18.md](PREVIEW_34_CURRENT_BUILD_MAP_NAVIGATION_CANARY_2026-07-18.md).

## Preview.33 Event Acquisition Evidence

- Exact source and real UI confirmed the Brain Leech one-of-five,
  non-cancelable, auto-commit `NSimpleCardSelectScreen` and the separate Room
  Full of Cheese two-of-eight source gate. Unknown simple-grid origins remain
  unsupported.
- Re strict inspect accepted both canary Surfaces with the exact current MVID,
  explicit entity bindings, and no Inspection facts.
- Request `preview33-event-option-1784361786064` completed with
  `event_option_replaced_or_required_subsurface_opened`, producing ready
  `event_card_acquisition` state `state_6d5c086e99_2` with five legal actions.
- Request `preview33-event-card-acquisition-1784361829259` selected exact card
  instance `BEAM_CELL/card_a085375b_b`. It completed with
  `selected_event_cards_added_as_exact_instances_to_run_deck` and returned to
  a one-action event proceed state.
- Request `preview33-event-proceed-1784361847130` completed with
  `event_proceed_opened_map_or_left_room`. The successor source-resolved
  `map_navigation` but suppressed it with zero actions because map is not in
  this build's scope.
- All evidence in this section belongs to DLL SHA
  `9fceb2887b9527e45ec2cdc3346a410c30a46bf41a7d376097940f3040de7248`,
  MVID `c5492a5b-8840-4557-9ba0-2c74bd7a31f0`, and runtime
  `15ca0dec2a134f699d2a8009880270de`. Both Surfaces remain
  canary-exercised, not qualified. Preview.32's earlier MVID evidence stays in
  its own report and is not attributed here.

Detailed evidence is in
[PREVIEW_33_CURRENT_BUILD_EVENT_ACQUISITION_CANARY_2026-07-18.md](PREVIEW_33_CURRENT_BUILD_EVENT_ACQUISITION_CANARY_2026-07-18.md).

## Preview.32 Current-Build Canary Evidence

- Exact installed source audit confirmed current `NEventRoom`,
  `NEventOptionButton`, `EventOption`, and the `BRAIN_LEECH` option call paths.
- Re strict inspect accepted `event + event_option`, two exact entity-bound
  opaque actions, and an empty read-only Inspection scope.
- DeepSeek tick `run-20260718074756-g49oav` stopped before execution with
  `not_executed_llm_failure`; the provider connection was reset before any
  HTTP response, so this is transport evidence, not an API-key rejection and
  not a game canary.
- Explicit request `preview32-event-option-1784360996899` selected the visible
  `Share Knowledge` option from state `state_5a9e3ccc85_1`. The command passed
  `received -> validated -> started -> completed`, outcome `confirmed`, with
  completion evidence `event_option_replaced_or_required_subsurface_opened`.
- Successor `state_5a9e3ccc85_2` was the source-resolved
  `event_card_acquisition` child. Because that child is not authorized on this
  build, Bridge and Re exposed `event + unsupported`, zero legal actions, and
  no action authority. This is the next natural coverage boundary.
- All loaded evidence in this section belongs to MVID
  `e4902978-a8d2-4944-a59c-b8163f76eb0c`, runtime
  `def0812ea2c44928b84a6b50ca2365b4`, and DLL SHA
  `7a0bb4801ad24d14d996c21690bb5ac8e555d4697efcf66db0a502a909fa7680`.
  It is canary-exercised only, not Organic Qualification.

Detailed evidence is in
[PREVIEW_32_CURRENT_BUILD_EVENT_OPTION_CANARY_2026-07-18.md](PREVIEW_32_CURRENT_BUILD_EVENT_OPTION_CANARY_2026-07-18.md).

The current action permission model is scoped by Surface kind. A Surface in
the canary list may publish any operation that its current Provider proves
legal at runtime. This grants bounded canary execution, not operation- or
origin-level qualification. For example, treasure open/skip remain without
Organic Qualification even though they are implemented operations of the
`treasure_room` canary. A future finer-grained permission model may narrow this
authority; it must not broaden it.

## Preview.29-.30 Evidence

- `character_select` added an explicit `Menu` input-owner layer without
  creating a universal menu API. A fresh standard-run journey selected Silent,
  changed Ascension 10 -> 9 -> 10, and embarked into a real Silent A10 run.
  Starting deck and collection totals are intentionally absent because the
  character-select UI does not show them. Root main menu and single-player
  submenu remain v1-owned.
- `event_dialogue` was requalified as a revealed-prefix-only ancient-dialogue
  canary. Four fresh current-build advances across two restarts completed with
  exact dialogue-index evidence; future dialogue remained absent.
- Exact source proved that event options expose `EventOption.HoverTips` on
  focus. The first preview.30 observation correctly failed closed on a
  `CardHoverTip`, disproving the assumption that every tooltip is a text
  keyword. The fixed contract uses typed `text` and `card` tooltip variants.
- A fresh Neow option observation exposed Ambergris text, a full Guilty card
  preview, and Unplayable text. Re strict inspect accepted the same facts.
- Choosing Neow's Talisman completed only after event model options were
  replaced. Post-state independently showed the exact relic plus one upgraded
  Strike and one upgraded Defend. Proceed then completed on the visible map.
- Generic event completion no longer accepts `WasChosen=true`; source sets it
  before the asynchronous option effect finishes. Replacement event state,
  required child Surface, combat, map, or room transition is required.
- The complete Neow Organic Journey belongs to loaded MVID
  `f2604133-ed1a-41f3-a638-ab38829d3cb5`. Historical final target MVID
  `bdc97168-3bc7-40c4-8a2e-bb0698169118` adds a stricter proceed/new-overlay
  completion predicate and was source-, test-, build-, install-, and
  load-verified on the source-qualified target; that narrow final delta has
  not been misrepresented as a repeated organic Neow lifecycle.
- The preview.31 audit MVID `8a915c2c-3ba3-48d3-92de-6ca9e612b191` is
  source-, test-, build-, install-, and load-verified only. It has no action
  canary or Organic qualification, and no previous journey is attributed to it.

Detailed evidence is in
[PREVIEW_29_30_MENU_DIALOGUE_AND_EVENT_OPTION_QUALIFICATION_2026-07-18.md](PREVIEW_29_30_MENU_DIALOGUE_AND_EVENT_OPTION_QUALIFICATION_2026-07-18.md).
Preview.28 history remains in its own report.

## Architecture Verdict

```text
SharedVisibleState + Context + exactly one Active Surface + Stage + Authority
  -> state-bound opaque action
  -> execution-time revalidation
  -> semantic completion witness

Inspection = independent, read-only, state-bound, outside the command ledger
```

The top-level model remains healthy. Preview.29 showed that input ownership is
not limited to run rooms and overlays, so `Menu` is now a third resolver layer.
Preview.30 showed that player-visible hover semantics need typed composition,
not a universal flat keyword list. Neither finding supports a recursive
executable Surface stack, universal selector, or universal menu protocol.

`contract_complete_for_*` means complete only for that bounded contract. It
never means the whole screen or game is completely exposed.

The 2026-07-20 independent audit retains that hard shell but finds two internal
architecture gaps: `deck_enchant_selection` evidence is described as
Self-Help-Book-scoped while runtime authority is Surface-scoped, and
parent/child commands do not explicitly own every remaining source-transaction
Witness obligation. A closed, non-executable Transaction IR plus attested
DecisionFrame and WitnessPlan is approved for shadow evaluation only; it does
not change current authority.

## Next Work

1. Before further Surface expansion, add a non-authorizing transaction/source
   binding audit for `deck_enchant_selection` and parent/child Witness
   obligations. Runtime authority must be narrowed or fail closed before prose
   can call the Surface Self-Help-Book-scoped.
2. Add a minimal non-authorizing transaction-correlation record around the
   already-tracked generated-card and combat-pile native Task scopes. Shadow
   owner, exact operands, child phase, source Task completion, and all Witness
   obligations before introducing a broader IR or changing authority.
3. After that record is stable, shadow-pilot an attested DecisionFrame, closed
   non-executable Transaction IR, shared validator, and WitnessPlan on those
   same families. The shadow may only reproduce or narrow existing actions.
4. Fix the Python MCP v2 Inspection adapter drift by deriving bounded requests
   from the fixed advertised catalog, with no arbitrary query language and no
   permission change.
5. Continue strict-v2 organic journeys on an explicitly installed and loaded
   exact artifact, selecting the first natural `unsupported`, `legacy-owned`,
   degraded, or missing-visible-information checkpoint.
6. Keep `shop_catalog` at read-only canary until another ordinary shop and
   inventory-mutation journey independently confirm the same contract. It must
   never authorize purchase or navigation.
7. Audit `combat_turn` at operation granularity before any future environment
   permission changes; the source-target profile retains its existing
   qualified scope unchanged.
8. Keep `event_option`, `event_dialogue`, and `character_select` at canary while
   collecting ordinary non-Neow diversity and first-run/tutorial boundaries.
9. Collect the still-missing Organic `open_singleplayer` and submenu
   Standard/Back lifecycles when the profile naturally exposes that branch;
   do not destroy a saved run merely to manufacture evidence.
10. Re-run a fresh natural preview.28+ game-over intro -> summary -> main-menu
   journey; the fixed contract still lacks final organic qualification.
11. Requalify high-value disabled selectors/Inspection and close linked reward,
   special treasure, tooltip, and shared-HUD variants from exact evidence.
12. Retire each v1 family only after source, strict client, loaded identity,
   organic lifecycle, and semantic completion all agree.
13. Continue treating each additional `1833084275` Surface as a separate
   source/UI audit and bounded canary; do not copy target-build authority merely
   because version and commit match.
14. Keep Headless implementation blocked until the explicit live admission
   gate in `docs/headless/TARGET_ARCHITECTURE.md` is passed. Do not extract a
   speculative shared kernel or add live/Headless branches to Re.

The typed inventory closeout and exact loaded identity are recorded in
[PREVIEW_35_TYPED_CONTRACT_INVENTORY_CLOSEOUT_2026-07-18.md](PREVIEW_35_TYPED_CONTRACT_INVENTORY_CLOSEOUT_2026-07-18.md).
Preview.37 menu evidence is recorded in
[PREVIEW_37_MENU_NAVIGATION_CLOSEOUT_2026-07-18.md](PREVIEW_37_MENU_NAVIGATION_CLOSEOUT_2026-07-18.md).

See the [coverage matrix](PLAYER_VISIBLE_COVERAGE.md) and
[v1 retirement/completeness audit](BRIDGE_V2_V1_RETIREMENT_AND_COMPLETENESS_AUDIT_2026-07-18.md).

The independent architecture decision and staged evolution plan are recorded
in [ARCHITECTURE_AUDIT_2026-07-18.md](ARCHITECTURE_AUDIT_2026-07-18.md) and
[ARCHITECTURE_EVOLUTION_PLAN.md](ARCHITECTURE_EVOLUTION_PLAN.md). The latest
independent reassessment is
[DECISION_FRAME_TRANSACTION_IR_ARCHITECTURE_AUDIT_CLOSEOUT_2026-07-20.md](DECISION_FRAME_TRANSACTION_IR_ARCHITECTURE_AUDIT_CLOSEOUT_2026-07-20.md).
