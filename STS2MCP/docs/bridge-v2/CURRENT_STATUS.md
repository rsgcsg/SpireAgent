# Bridge v2 Current Status

Status date: 2026-07-18

## Current Contract

- protocol: `2.0-preview.35`
- source-qualified game identity: `v0.109.0|c12f634d|-840572606`
- current workspace loaded game identity: `v0.109.0|c12f634d|-840572606`
- installed/Release DLL SHA-256:
  `533e7db0ab7f6fdf04cc9ff0143133d6ba3ace2af5ef26a088ed379335366216`
- loaded module MVID: `8842875a-c0e0-4381-a473-2b06d2d6fc9d`
- loaded runtime instance: `4dab44137dec4350bad358cf5cc508a5`

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

The current preview.35 infrastructure build starts a non-authorizing typed
contract/evidence/visibility inventory. Capabilities remain byte-equivalent to
the previous loaded build after excluding MVID/runtime identity. Manifest
presence never grants permission; exact-environment lists remain authoritative.

## Current Permission Matrix

| Permission | Contracts |
|---|---|
| source-qualified `v0.109.0|c12f634d|-840572606`: `qualified_exact_build` | `deck_removal_selection`, `deck_upgrade_selection`, `combat_turn`, `combat_hand_card_selection`, `rest_site` |
| source-qualified `v0.109.0|c12f634d|-840572606`: `candidate_action_canary` | `event_card_acquisition`, `reward_claim`, `card_reward_selection`, `map_navigation`, `shop_inventory`, `shop_room`, `treasure_room`, `game_over`, `card_bundle_selection`, `character_select`, `event_dialogue`, `event_option` |
| source-qualified `v0.109.0|c12f634d|-840572606`: `qualified_read_only_scoped` | `run_deck` Inspection |
| source-qualified target: disabled | `deck_enchant_selection`, `combat_pile_card_selection`, `generated_card_choice`, `combat_piles` Inspection, every unlisted contract |
| historical alternate-device `v0.109.0|c12f634d|1833084275`: `candidate_action_canary` | `event_option`, `event_card_acquisition`, `map_navigation` |
| historical alternate-device `v0.109.0|c12f634d|1833084275`: disabled | every qualified Surface scope, the other 17 declared Surfaces, `run_deck`, `combat_piles`, and every unlisted Inspection |

Source implementation, target-build permission, local build/install/load,
canary, and Organic qualification are separate states. There are 20 declared
semantic Surface contracts: the currently loaded source-qualified target has
five qualified, twelve canary-permitted, and three disabled. The historical
alternate-device build has three canaries and no qualified contract.

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
4. Add purpose-specific root main-menu and single-player submenu contracts so
   a new or continued standard run can start without v1 reconstruction.
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

See the [coverage matrix](PLAYER_VISIBLE_COVERAGE.md) and
[v1 retirement/completeness audit](BRIDGE_V2_V1_RETIREMENT_AND_COMPLETENESS_AUDIT_2026-07-18.md).

The independent architecture decision and staged evolution plan are recorded
in [ARCHITECTURE_AUDIT_2026-07-18.md](ARCHITECTURE_AUDIT_2026-07-18.md) and
[ARCHITECTURE_EVOLUTION_PLAN.md](ARCHITECTURE_EVOLUTION_PLAN.md).
