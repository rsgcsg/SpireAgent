# Player-Visible Coverage Matrix

Current execution evidence is scoped to exact game identity
`v0.109.0|c12f634d|-840572606` and the observed interaction shape. Source audit,
fixtures, compilation, or historical `v0.108.0` runs alone are not current-build
organic qualification.

## Current-Build Contracts

| Surface / inspection | Context | Current permission | Organic evidence | Remaining boundary |
|---|---|---|---|---|
| `deck_removal_selection` | shop | qualified | select -> automatic preview -> confirm; exact card/deck/gold/counter/service witness and `run_deck` post-state | merchant purpose only; no transform/upgrade/enchant inference |
| `deck_upgrade_selection` | event or rest | qualified | independent event Armaments+ and rest Prep Time+ journeys | other upgrade origins and multi-select variants need evidence |
| `combat_turn` | combat | qualified for observed ordinary shapes | repeated card, potion, target, and end-turn journeys | uncommon target/phase/intent variants remain evidence debt |
| `combat_hand_card_selection` | combat | qualified for observed simple-select shape | Touch of Insanity exact-instance select -> confirm -> same-card cost 2 to 0 | upgrade/peek and other origins need current-build diversity |
| `rest_site` | rest | qualified for ordinary single-player shape | Heal exact HP; Smith exact upgrade child and cancel; Proceed to map | unknown enabled relic/mod options and multiplayer fail closed |
| `event_card_acquisition` | event | action canary | Brain Leech exact one-card auto-commit; same-instance run-deck count 12 -> 13 | Room Full of Cheese two-card lifecycle untested; other simple-grid purposes fail closed |
| `reward_claim` | reward flow | action canary | ordinary claim/card-child/Proceed lifecycle | linked sets and uncommon reward kinds fail closed |
| `card_reward_selection` | reward flow | action canary | ordinary card selection lifecycle | alternatives and special origins need diversity |
| `map_navigation` | map | action canary | exact-node travel after reward and treasure | drawing, special modes, and multiplayer unsupported |
| `treasure_room` | treasure | action canary | choose Bag of Marbles with owned-relic witness; Proceed with map witness | open and skip variants not yet qualified |
| `run_deck` inspection | active single-player run | qualified read-only | exact per-instance removal and upgrade post-state | no arbitrary query; never action authority |
| top-level `shared_state` | active single-player run HUD | qualified read-only composition | menu-null, active-run read, map/combat composition, final-MVID potion post-state | no actions; unsupported hover forms and multiplayer fail closed |

## Historical Implementations

These contracts are implemented and have bounded `v0.108.0` evidence, but are
not executable on v0.109 unless separately listed above:

| Surface / inspection | Player-visible semantics | Historical boundary |
|---|---|---|
| `deck_enchant_selection` | exact eligible cards, selection, preview, enchantment | observed Glam flow only |
| `event_dialogue` | revealed prefix, current line, speaker, advance | future lines intentionally hidden |
| `event_option` | visible options and exact event semantics | event-specific children separate |
| `combat_pile_card_selection` | exact source pile and selection constraints | observed discard single-pick only |
| `generated_card_choice` | temporary visible cards and skip/peek | observed generated choice only |
| `card_bundle_selection` | atomic visible bundles and preview/commit | observed bundle origin only |
| `shop_room` | merchant open and Proceed | observed ordinary merchant only |
| `shop_inventory` | typed stock, prices, affordability, purchases, removal launch | observed ordinary categories only |
| `combat_piles` inspection | unordered draw/discard/exhaust contents | hidden draw order excluded |

## Unsupported Or Legacy-Owned

| Interaction / facts | Current authority | Status |
|---|---|---|
| menu / character select / run start / game over | v1 local reconstruction | lifecycle witnesses incomplete |
| linked reward sets | none in v2 | fail closed |
| transform and unlisted purpose-specific deck maintenance | v1 or none | must retain purpose-specific eligibility and completion |
| treasure open/skip variants | treasure action canary | implemented but not organically qualified |
| rich hover/keyword semantics | mixed | ordinary shared relic/potion keywords covered; unsupported forms need typed contracts |
| multiplayer | none in v2 | intentionally unsupported |

## Visibility Laws

- Shared visible state answers persistent player/run facts; Context answers what
  situation exists; Surface answers which topmost interaction grammar owns
  input; Authority answers who may execute.
- Underlying surfaces are suspended. Their facts may remain in Context or
  read-only data, but their actions never mix with the Active Surface.
- Legal actions bind only to explicit visible entity identities and execute only
  through opaque action IDs.
- Inspection is read-only and state-bound; it never enters the command ledger.
- Unknown or hidden facts are omitted and diagnosed, never guessed. RNG, real
  draw order, future event dialogue/outcomes, future rewards, and future enemy
  moves are outside the protocol.
- Surface completeness is bounded and is never total-UI completeness.
