# Player-Visible Coverage Matrix

> Source-truth warning, 2026-07-22: this matrix inventories historical
> qualification and source implementation. Gate 0 now has exact loaded-runtime
> evidence for a bounded menu lifecycle, but that does not renew historical
> per-operation Organic Qualification. Existing percentage estimates are planning
> estimates, not measured player-visible closure or v1 parity. See the
> [real connector audit and migration plan](REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md).

Current Gate 0 execution evidence is scoped to exact game identity
`v0.109.0|c12f634d|-840572606`, Gateway SHA
`89f94eb99996c2ff4636c1e2ab1119d3dd6eb20a64e59c0270821e2eb2f0e079`,
MVID `3fd03b69-264a-4a41-9da7-1e9b50c7bc50`, and exact Bridge-only Modset
fingerprint `f36fd123b9f272ac61e15a880b6f661489d15873177ec5b423c96fed71cebde2`.
Compilation, fixtures, source review, old-build
evidence, canary permission, and organic qualification are distinct states.

An alternate-device runtime observed on 2026-07-18 was
`v0.109.0|c12f634d|1833084275`. It is a different exact build. Preview.35
permits only `event_option`, source-gated `event_card_acquisition`, and ordinary
single-player `map_navigation` as independently source-audited and exercised
action canaries; every other Surface and every Inspection remain disabled.
The `1833084275` environment inherits no permission from the current loaded
`-840572606` environment.

## Historical Alternate-Device Build

| Surface / inspection | Permission | Current evidence | Remaining boundary |
|---|---|---|---|
| `event_option` | canary, not qualified | Brain Leech `Share Knowledge` on preview.32/33/34 MVIDs; not re-exercised on final preview.35 MVID | other options/origins, lethal warning, and final-MVID diversity |
| `event_card_acquisition` | canary, not qualified | Brain Leech one-of-five exact `BEAM_CELL` on preview.33/34 MVIDs; not re-exercised on final preview.35 MVID | Room Full of Cheese two-of-eight and origin diversity remain unexercised |
| `map_navigation` | canary, not qualified | final-MVID exact `(5,5)` node from `(5,4)`; Re agreement; shared controller reachability validator; semantic coordinate/map-close completion | live controller-mode, drawing mode, start-row FTUE, and special-mode diversity remain unexercised |
| `combat_turn` | disabled | successor floor-five combat source-resolved after map canary | exact current-source and three-operation permission-scope audit required |
| every other Surface | disabled | implementation or older-build evidence only | no authority until independently scoped |
| all Inspection kinds | disabled | empty explicit qualified/canary lists | empty remains Fail Closed |

## Historical Source-Target Contracts

| Surface / inspection | Permission | Current evidence | Remaining boundary |
|---|---|---|---|
| `deck_removal_selection` | qualified | merchant select -> preview -> confirm; exact deck/card/gold/service witness | merchant remove only; no generic maintenance inference |
| `deck_upgrade_selection` | qualified | event and rest exact-instance upgrade journeys | other origins and multi-select variants need evidence |
| `combat_turn` | qualified | repeated card, target, potion, and end-turn journeys; preview.51 fresh Necrobinder run exposes exact alive Osty HP/block/status companion state and Re/DeepSeek consumes it | dead/hidden-health companion Organic lifecycle plus uncommon card/target/phase shapes remain evidence debt |
| `combat_hand_card_selection` | qualified | Touch of Insanity exact-instance select/confirm/cost post-state | other hand-selection purposes need diversity |
| `rest_site` | qualified | Heal exact HP, Smith exact child, Proceed to map | unknown enabled options and multiplayer fail closed |
| `event_card_acquisition` | canary | Brain Leech exact one-card deck commit | two-card and other event origins remain unqualified |
| `reward_claim` | canary | ordinary claim, potion-capacity, child, and Proceed flows | linked/special rewards fail closed |
| `card_reward_selection` | canary | repeated ordinary choices | alternatives and special origins need diversity |
| `map_navigation` | canary | repeated exact-node travel | drawings, special modes, and multiplayer unsupported |
| `shop_room` | canary | open/close/Proceed current-build journeys | more lifecycle diversity required |
| `shop_inventory` | canary | card/relic/potion purchases and removal launch with category-specific witnesses | final artifact still needs repeated organic category coverage |
| `treasure_room` | canary | exact relic choose and Proceed; repeated pre-dispatch refusal preserves the native 2.5-second relic-clickable/Skip-disabled action-set boundary | open/skip/empty-chest/multiplayer variants remain unqualified |
| `card_bundle_selection` | canary | preview and exact three-card Scroll Boxes deck commit on preview.27 | other origins absent; preview.28 behavior unchanged but needs routine regression |
| `game_over` | canary; fresh lifecycle exercised | preview.41 run `run-20260718162449-yvvf7o` completed intro -> summary -> return with both actions confirmed, then Re stopped at top-level menu | win/timeline destination and additional result variants remain evidence debt |
| `character_select` | canary | select character, Ascension down/up, and Embark into a real Silent A10 run | first-run tutorial confirmation remains unsupported; root/menu contracts are tracked separately |
| `main_menu` | canary; Continue exercised on intermediate and final preview.47 MVIDs | exact visible root choices, saved-run summary, unsupported-choice boundary, and Bridge-confirmed Continue into the saved-run shop; final-MVID command settled under operator-positioned provenance | Single Player branch hidden by saved-run state; profile/patch hover detail incomplete; final-MVID action is canary coverage, not qualification |
| `singleplayer_menu` | canary, source/fixture only | exact Standard/Daily/Custom/Back bindings and submenu-stack witnesses | no current-MVID Organic action lifecycle yet |
| `deck_transform_selection` | canary; selection/confirm/upgrade-view exercised | exact Whispering Hollow source, selected instances, upgrade presentation, random-uncommitted preview, exact-instance/deck-count witness | other callers, explicit preview button, cancel paths, multi-select, Mods, and future builds remain unqualified |
| `deck_enchant_selection` | Surface-level current-build canary; only Self-Help Book select/automatic preview/cancel/reselect/confirm was exercised | exact target enchantment ID/amount, exact selected instances, overlay stage, semantic exact-card enchantment witness, independent run-deck post-state; current Provider does not runtime-bind the Self-Help Book source named by manifest/evidence | other callers remain unqualified but are not source-suppressed on the Surface-permitted exact build; explicit preview button, cancelable close, multi-select, parent-transaction side effects, Mods, and future builds remain evidence/architecture debt |
| `generated_card_choice` | source-scoped canary; Lead Paperweight, Colorless Potion, and Attack Potion selections exercised; exact Splash implemented but not final-MVID exercised | exact `RelicCmd.Obtain`, sealed native Colorless/Attack/Skill/Power `PotionModel.OnUseWrapper`, and sealed native `Splash.OnPlayWrapper` bindings; explicit source/run-deck-vs-combat-hand/cost/overflow semantics; exact-reference/deck or hand-discard witnesses | Skill/Power/Splash Organic actions, Skip variants, and full-hand overflow remain pending; Hefty Tablet, Knowledge Demon, other generators, derived Mod types, and unknown sources fail closed |
| exact Headbutt/Graveblast `combat_pile_card_selection` | source-scoped canary; Headbutt source/action observed but corrected completion not re-exercised; Graveblast source-audited and loaded without final-MVID action | exact source task, visible discard candidates, source-discriminated draw-top versus hand/full-hand-discard exact-card witness | both final completion branches still need natural action evidence; all other origins fail closed |
| `event_dialogue` | canary | repeated v0.109 revealed-prefix advances with exact index witness | non-Neow/other ancient dialogue diversity remains evidence debt |
| `event_option` | canary | typed text/card hover semantics, Neow Talisman effect, ordinary event replacement options, async `Nab the Map -> Proceed`, and Proceed to map | lethal-option and more linked-child diversity remain evidence debt |
| `run_deck` Inspection | qualified read-only | exact removal, upgrade, enchant, bundle post-states | no arbitrary query or action authority |
| `combat_piles` Inspection | read-only canary | current-MVID state-bound snapshots matched combat context at `12/0/0` and, after a confirmed end turn, `7/4/1`; Re decoded exact card multisets without diagnostics | more combat/pile diversity before qualification; draw order remains intentionally hidden |
| `shop_catalog` Inspection | read-only canary | preview.48 current-MVID closed/open shop reads exposed fixed typed inventory, prices, stock, affordability, potion-capacity blocks, and used removal service; a strict-v2 follow-up left the shop without reopening inventory | additional ordinary shops and inventory mutations before qualification; Inspection never grants purchase/navigation authority |
| top-level `shared_state` | qualified read-only composition | active-run HUD composition across map/combat/reward; preview.46 Cursed Pearl organically exposed Greed `card_previews` plus Eternal/Unplayable hover text with stable state identity | bounded strategic HUD, not all visible UI information; unknown hover-tip kinds still fail closed |
| `visibility` + `inspection_catalog` | non-authorizing read-only declaration | preview.48 shop state declares `run_deck` and `shop_catalog`; combat declares `combat_piles`; linked detail families and hidden policy remain explicit | catalog covers only three fixed Inspection kinds and does not prove whole-game closure |
| coherent observation bundle | non-authorizing read-only transport | preview.48 returned shop state, `run_deck`, and `shop_catalog` under one exact identity; preview.52 run `run-20260719234320-ze6fp0` crossed shop/map/event/combat with 15/15 settled reads after Re proved state-changing scope drift before retry | same-state catalog/runtime mismatch remains a hard error; needs more inspection-diversity evidence; no command authority |
| `contract_instance_shadow` | diagnostic only, always `authorizing=false` | preview.47 reports manifest contract, published operations, legacy tier, and limitations on real menu/shop states | declaration is not runtime semantic binding; actual permission remains exact environment + Surface kind |
| `combat_transition + no_action` lifecycle observation | non-authorizing, not a permission row | Current-MVID Organic setup and resolution observations around repeated `combat_turn -> reward_claim -> map -> combat_turn` journeys on preview.40 | exact `CombatRoom` setup/resolution only; early-load and other no-overlay gaps remain unsupported |

## Implemented But Disabled On v0.109

| Contract | Historical evidence | Why disabled now |
|---|---|---|
| non-Headbutt/non-Graveblast `combat_pile_card_selection` origins | v0.108 discard selection | only exact Headbutt and Graveblast are v0.109 canaries; other purposes remain source-unresolved |

## Unsupported Or Legacy-Owned

| Interaction / facts | Current status |
|---|---|
| main-menu unsupported choices / non-standard single-player modes | root and standard-entry contracts are v2 canaries; Abandon, Daily, Custom, and other unsupported choices remain visible facts without action authority |
| first-run character tutorial and non-standard run setup | explicit unsupported boundary; ordinary single-player character select is a canary |
| generic or purpose-unknown card selectors | v1 or fail closed; source purpose must be proven before v2 authority |
| other transform callers, duplicate, and unlisted maintenance | Whispering Hollow random transform is a bounded v2 canary; every other origin remains fail closed |
| linked/special reward sets | Orrery-style linked reward continuation is implemented and fixture-tested in preview.47; unrelated linked/special reward transactions remain fail closed |
| Pael's Tooth five-card maintenance transaction | current source/runtime identifies a purpose-specific selector, but no v2 semantic contract exists; fail closed rather than inherit merchant/upgrade authority |
| treasure open/skip variants | implemented canary operations without organic qualification |
| rich tooltip/keyword/hover variants | preview.46 supports text keywords and typed card previews for bounded entity owners; unknown forms fail closed rather than disappear silently |
| compendium, settings, profile, timeline, daily/custom and multiplayer flows | unsupported by v2; multiplayer intentionally out of scope |

## Coverage Interpretation

- Twenty-three semantic Surface contracts exist in preview.54 source;
  twenty-two were permitted on its exact historical source-qualified v0.109
  target (five qualified and
  seventeen canaries), while one remains target-build disabled. Generated choice
  authority is narrower than the Surface kind: only exact Lead Paperweight and
  exact Colorless Potion sources may publish their discriminated operations.
  The historical `1833084275` alternate-device build permits three action
  canaries and no qualified contract or Inspection.
- Canary permission is currently Surface-kind scoped. It permits the legal
  operations published by that Provider for bounded canary execution, but it
  does not qualify every operation or source origin. Operation and origin
  evidence therefore remain explicit in each row.
- `deck_enchant_selection` is the concrete warning against reading origin
  evidence as an authority restriction. Only Self-Help Book has Organic canary
  evidence, but the Provider currently matches the generic enchant screen and
  the exact-build permission gate is Surface-level. The 2026-07-20 architecture
  audit records this as an unresolved governance gap, not a permission
  expansion or qualification of other native origins.
- The historical inventory was estimated as roughly `65-78%` of major ordinary
  in-run interaction families, but
  only about `55-68%` of practical v1 interaction parity and `35-50%` of all
  single-player player-visible situations. These are planning ranges, not
  measured product metrics and not current-checkout support.
- Safety/authority mechanics are substantially more mature than semantic
  coverage. The protocol does not yet expose every fact the player can inspect.
- The typed contract inventory records visible fact groups and operation-level
  evidence, but it is not a claim of visibility completeness and cannot grant
  permission.
- Preview.47 adds machine-readable visibility/catalog declarations, a coherent
  observation bundle, and a non-authorizing contract-instance shadow. These
  reduce observation drift and expose permission debt; they do not add a
  Surface, qualify a contract, or authorize a new operation.
- Runtime records created before explicit evidence provenance are classified as
  `unrecorded`. They remain useful current-MVID coverage/debug evidence but
  cannot independently satisfy Organic qualification.
- Final preview.47 run `run-20260719150346-ptpq0a` explicitly records
  `provenance=operator_positioned`. Its 40 strict-v2 decisions covered
  `shop_room`, `shop_inventory`, merchant `deck_removal_selection`,
  `map_navigation`, `combat_turn`, `reward_claim`, and
  `card_reward_selection`. Thirty-nine settled; one combat action was rejected
  before execution after the state hash changed. All 40 used
  `bridge_advertised` authority and coherent observation bundles, DeepSeek
  validation was 40/40 valid, and contract-instance shadow authority remained
  false. This supports coverage and canary regression review only.
- Preview.36 Modset identity closes an evidence-scope gap but adds no
  player-visible Surface or Inspection coverage. Modded environments do not
  inherit this matrix merely because they reuse native STS2 UI.
- Preview.38 adds only the exact Whispering Hollow random-transform source.
  Its visible cycling preview is presentation, not future-outcome evidence;
  no other transform source or Mod inherits authority.
- Preview.43 makes provider source-binding failure explicit
  `unsupported + none_fail_closed`; this is safety behavior, not coverage.
- Preview.44 adds one Colorless Potion branch without widening the shared
  Surface to other combat generators. Its visible cards, destination,
  temporary cost rule, overflow rule, and exact outcome are source-bound.
- Preview.45 permits only exact Headbutt pile selection and retains its first
  unknown outcome as negative evidence; corrected completion still needs a
  natural repeat before qualification.
- Preview.46 adds typed, read-only card hover facts and stable preview identity.
  It adds no action permission and does not create a universal tooltip tree.

## Visibility Laws

- Context describes the current game situation. The one Active Surface owns
  current input. Stage is lifecycle state inside that Surface. Authority is a
  separate execution decision.
- Underlying Surfaces are suspended and never leak actions through an overlay.
- Legal actions bind visible entity identities and execute only as opaque IDs.
- Inspection is read-only and never enters the command ledger.
- RNG, true draw order, future events/rewards/moves, and private game facts are
  excluded.
- Bounded Surface completeness is never total-screen or whole-game
  completeness.
