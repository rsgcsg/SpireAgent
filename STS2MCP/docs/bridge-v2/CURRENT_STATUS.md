# Bridge v2 Current Status

Status date: 2026-07-18

## Current Contract

- protocol: `2.0-preview.46`
- source-qualified game identity: `v0.109.0|c12f634d|-840572606`
- current workspace loaded game identity: `v0.109.0|c12f634d|-840572606`
- installed/Release DLL SHA-256:
  `264352a987fcdb508398f5179e25dc551e5ba719f667361a3db0594d943007ca`
- loaded module MVID: `9e6124ca-0082-451a-adb3-54b692a85d33`
- loaded runtime instance: `96e022a2f4ae431aa99c2bf80272fd6a`
- loaded Modset status: `exact_bridge_only`
- loaded Modset fingerprint:
  `01fd94643fe75b68a32a011e454263090560ce38223ec7b013a32761d72f1a1c`

Bridge v2 is an incremental, exact-build-scoped protocol. It is not full v1
parity, all-game coverage, or complete player-visible truth.

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
| source-qualified `v0.109.0|c12f634d|-840572606`: `candidate_action_canary` | `event_card_acquisition`, `reward_claim`, `card_reward_selection`, `map_navigation`, `shop_inventory`, `shop_room`, `treasure_room`, `game_over`, `card_bundle_selection`, `character_select`, `main_menu`, `singleplayer_menu`, `event_dialogue`, `event_option`, `deck_transform_selection`, exact Headbutt `combat_pile_card_selection`, source-scoped `generated_card_choice` |
| source-qualified `v0.109.0|c12f634d|-840572606`: `qualified_read_only_scoped` | `run_deck` Inspection |
| source-qualified `v0.109.0|c12f634d|-840572606`: `candidate_read_only_canary` | `combat_piles` Inspection |
| source-qualified target: disabled | `deck_enchant_selection`, every non-Headbutt `combat_pile_card_selection` origin, every unlisted contract; every `generated_card_choice` origin except exact Lead Paperweight and exact Colorless Potion remains fail closed |
| historical alternate-device `v0.109.0|c12f634d|1833084275`: `candidate_action_canary` | `event_option`, `event_card_acquisition`, `map_navigation` |
| historical alternate-device `v0.109.0|c12f634d|1833084275`: disabled | every qualified Surface scope, the other 20 declared Surfaces, `run_deck`, `combat_piles`, and every unlisted Inspection |

Source implementation, target-build permission, local build/install/load,
canary, and Organic qualification are separate states. There are 23 declared
semantic Surface contracts: the currently loaded source-qualified target has
five qualified, seventeen canary-permitted, and one disabled Surface kind. The historical
alternate-device build has three canaries and no qualified contract.

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

## Next Work

1. Use the new non-authorizing inventory to audit operation/origin permission
   granularity for `treasure_room`. Do not promote any operation merely because
   it is implemented or listed.
2. Audit `combat_turn` at operation granularity before any future environment
   permission changes; the currently loaded source target retains its existing
   qualified scope unchanged.
3. Keep `event_option`, `event_dialogue`, and `character_select` at canary while
   collecting ordinary non-Neow diversity and first-run/tutorial boundaries.
4. Collect the still-missing Organic `open_singleplayer` and submenu
   Standard/Back lifecycles when the profile naturally exposes that branch;
   do not destroy a saved run merely to manufacture evidence.
5. Re-run a fresh natural preview.28+ game-over intro -> summary -> main-menu
   journey; the fixed contract still lacks final organic qualification.
6. Requalify high-value disabled selectors/Inspection and close linked reward,
   special treasure, tooltip, and shared-HUD variants from exact evidence.
7. Retire each v1 family only after source, strict client, loaded identity,
   organic lifecycle, and semantic completion all agree.
8. Continue treating each additional `1833084275` Surface as a separate
   source/UI audit and bounded canary; do not copy target-build authority merely
   because version and commit match.

The typed inventory closeout and exact loaded identity are recorded in
[PREVIEW_35_TYPED_CONTRACT_INVENTORY_CLOSEOUT_2026-07-18.md](PREVIEW_35_TYPED_CONTRACT_INVENTORY_CLOSEOUT_2026-07-18.md).
Preview.37 menu evidence is recorded in
[PREVIEW_37_MENU_NAVIGATION_CLOSEOUT_2026-07-18.md](PREVIEW_37_MENU_NAVIGATION_CLOSEOUT_2026-07-18.md).

See the [coverage matrix](PLAYER_VISIBLE_COVERAGE.md) and
[v1 retirement/completeness audit](BRIDGE_V2_V1_RETIREMENT_AND_COMPLETENESS_AUDIT_2026-07-18.md).

The independent architecture decision and staged evolution plan are recorded
in [ARCHITECTURE_AUDIT_2026-07-18.md](ARCHITECTURE_AUDIT_2026-07-18.md) and
[ARCHITECTURE_EVOLUTION_PLAN.md](ARCHITECTURE_EVOLUTION_PLAN.md).
