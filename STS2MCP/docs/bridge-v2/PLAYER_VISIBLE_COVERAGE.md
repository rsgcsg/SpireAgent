# Player-Visible Coverage Matrix

Current execution evidence is scoped to exact game identity
`v0.109.0|c12f634d|-840572606`. Compilation, fixtures, source review, old-build
evidence, canary permission, and organic qualification are distinct states.

An alternate-device runtime observed on 2026-07-18 was
`v0.109.0|c12f634d|1833084275`. It is a different exact build. Preview.35
permits only `event_option`, source-gated `event_card_acquisition`, and ordinary
single-player `map_navigation` as independently source-audited and exercised
action canaries; every other Surface and every Inspection remain disabled.
The current workspace has since loaded the source-qualified `-840572606`
identity. Neither environment inherits permission from the other.

## Historical Alternate-Device Build

| Surface / inspection | Permission | Current evidence | Remaining boundary |
|---|---|---|---|
| `event_option` | canary, not qualified | Brain Leech `Share Knowledge` on preview.32/33/34 MVIDs; not re-exercised on final preview.35 MVID | other options/origins, lethal warning, and final-MVID diversity |
| `event_card_acquisition` | canary, not qualified | Brain Leech one-of-five exact `BEAM_CELL` on preview.33/34 MVIDs; not re-exercised on final preview.35 MVID | Room Full of Cheese two-of-eight and origin diversity remain unexercised |
| `map_navigation` | canary, not qualified | final-MVID exact `(5,5)` node from `(5,4)`; Re agreement; shared controller reachability validator; semantic coordinate/map-close completion | live controller-mode, drawing mode, start-row FTUE, and special-mode diversity remain unexercised |
| `combat_turn` | disabled | successor floor-five combat source-resolved after map canary | exact current-source and three-operation permission-scope audit required |
| every other Surface | disabled | implementation or older-build evidence only | no authority until independently scoped |
| all Inspection kinds | disabled | empty explicit qualified/canary lists | empty remains Fail Closed |

## Current-Build Contracts

| Surface / inspection | Permission | Current evidence | Remaining boundary |
|---|---|---|---|
| `deck_removal_selection` | qualified | merchant select -> preview -> confirm; exact deck/card/gold/service witness | merchant remove only; no generic maintenance inference |
| `deck_upgrade_selection` | qualified | event and rest exact-instance upgrade journeys | other origins and multi-select variants need evidence |
| `combat_turn` | qualified | repeated card, target, potion, and end-turn journeys | uncommon card/target/phase shapes remain evidence debt |
| `combat_hand_card_selection` | qualified | Touch of Insanity exact-instance select/confirm/cost post-state | other hand-selection purposes need diversity |
| `rest_site` | qualified | Heal exact HP, Smith exact child, Proceed to map | unknown enabled options and multiplayer fail closed |
| `event_card_acquisition` | canary | Brain Leech exact one-card deck commit | two-card and other event origins remain unqualified |
| `reward_claim` | canary | ordinary claim, potion-capacity, child, and Proceed flows | linked/special rewards fail closed |
| `card_reward_selection` | canary | repeated ordinary choices | alternatives and special origins need diversity |
| `map_navigation` | canary | repeated exact-node travel | drawings, special modes, and multiplayer unsupported |
| `shop_room` | canary | open/close/Proceed current-build journeys | more lifecycle diversity required |
| `shop_inventory` | canary | card/relic/potion purchases and removal launch with category-specific witnesses | final artifact still needs repeated organic category coverage |
| `treasure_room` | canary | exact relic choose and Proceed; stale state correctly blocked | open/skip variants remain unqualified |
| `card_bundle_selection` | canary | preview and exact three-card Scroll Boxes deck commit on preview.27 | other origins absent; preview.28 behavior unchanged but needs routine regression |
| `game_over` | canary, not organically qualified | preview.27 natural intro exposed a real contract bug; preview.28 fix is source/test/build verified | fresh intro -> summary -> return journey required |
| `character_select` | canary | select character, Ascension down/up, and Embark into a real Silent A10 run | root menus and first-run tutorial confirmation remain unsupported |
| `event_dialogue` | canary | repeated v0.109 revealed-prefix advances with exact index witness | non-Neow/other ancient dialogue diversity remains evidence debt |
| `event_option` | canary | typed text/card hover semantics, Neow Talisman effect, replacement options, and Proceed to map | ordinary non-Neow and lethal-option diversity remain evidence debt |
| `run_deck` Inspection | qualified read-only | exact removal, upgrade, enchant, bundle post-states | no arbitrary query or action authority |
| top-level `shared_state` | qualified read-only composition | active-run HUD composition across map/combat/reward | bounded strategic HUD, not all visible UI information |

## Implemented But Disabled On v0.109

| Contract | Historical evidence | Why disabled now |
|---|---|---|
| `deck_enchant_selection` | v0.108 Glam lifecycle | current-build source/action/post-state requalification missing |
| `combat_pile_card_selection` | v0.108 discard selection | v0.109 exact origins/lifecycle not requalified |
| `generated_card_choice` | v0.108 temporary choice | v0.109 source and variants not requalified |
| `combat_piles` Inspection | v0.108 read-only pile contents | current permission is only `run_deck` |

## Unsupported Or Legacy-Owned

| Interaction / facts | Current status |
|---|---|
| main menu / single-player submenu | v1 local reconstruction or fail closed; no v2 semantic completion |
| first-run character tutorial and non-standard run setup | explicit unsupported boundary; ordinary single-player character select is a canary |
| generic or purpose-unknown card selectors | v1 or fail closed; source purpose must be proven before v2 authority |
| transform, duplicate, and unlisted maintenance | no qualified v2 purpose-specific contract |
| linked/special reward sets | fail closed |
| treasure open/skip variants | implemented canary operations without organic qualification |
| rich tooltip/keyword/hover variants | partial; unsupported forms fail closed rather than disappear silently |
| compendium, settings, profile, timeline, daily/custom and multiplayer flows | unsupported by v2; multiplayer intentionally out of scope |

## Coverage Interpretation

- Twenty semantic Surface contracts exist in source; seventeen are permitted
  on the exact source-qualified v0.109 target (five qualified and twelve
  canaries), while three remain target-build disabled. The historical
  `1833084275` alternate-device build permits three action canaries and no
  qualified contract or Inspection.
- Canary permission is currently Surface-kind scoped. It permits the legal
  operations published by that Provider for bounded canary execution, but it
  does not qualify every operation or source origin. Operation and origin
  evidence therefore remain explicit in each row.
- This is roughly `60-75%` of major ordinary in-run interaction families, but
  only about `50-65%` of practical v1 interaction parity and `30-45%` of all
  single-player player-visible situations. These are engineering ranges, not
  measured product metrics.
- Safety/authority mechanics are substantially more mature than semantic
  coverage. The protocol does not yet expose every fact the player can inspect.
- The typed contract inventory records visible fact groups and operation-level
  evidence, but it is not a claim of visibility completeness and cannot grant
  permission.

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
