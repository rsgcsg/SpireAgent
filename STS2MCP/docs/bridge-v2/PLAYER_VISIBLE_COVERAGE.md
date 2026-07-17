# Player-Visible Coverage Matrix

Coverage is scoped to exact game identity `v0.108.0|58694f64|-2044609792` and
the observed interaction shape. Source audit or fixture evidence alone is not
organic qualification.

The installed Steam build is currently `v0.109.0|c12f634d|-840572606`; all rows
below are historical for execution. Preview.18 additionally permits one
no-sidecar action canary for `shop + deck_removal_selection` and one
read-only `run_deck` inspection canary. One exact ordinary merchant-removal
lifecycle has now passed with same-state deck post-state evidence. This grants
neither any other v0.109 surface/inspection nor a generic deck-selector
qualification.

| Surface / inspection | Context | Player-visible semantics | Organic status | Remaining boundary |
|---|---|---|---|---|
| `deck_enchant_selection` | event/combat parent | exact eligible cards, selection, preview, enchantment | qualified | other enchantment variants need diversity |
| `event_dialogue` | ancient event in dialogue | revealed prefix, current line, speaker, advance label | qualified | future lines intentionally hidden |
| `event_option` | event | title/body plus exact visible options and relic semantics when rendered | qualified | event-specific child surfaces remain separate |
| `rest_site` | rest | exact enabled options/descriptions and Proceed | qualified | Smith/remove child deck selectors are not rest actions and remain legacy |
| `combat_turn` | combat | player/enemy/hand/intents/statuses/relics/potions/orbs plus exact actions | qualified for observed shapes | uncommon intents, hover keywords and phase variants need evidence |
| `combat_pile_card_selection` | combat | exact source pile, prompt, constraints, selected instances | qualified for observed discard single-pick | other piles/modes unqualified |
| `combat_hand_card_selection` | combat | exact hand instances, prompt, constraints, selected instances | qualified for observed upgrade flows | other modes unqualified |
| `generated_card_choice` | combat | temporary generated cards, skip/peek state | qualified for observed generated choice | more generated-card variants needed |
| `card_bundle_selection` | event/other parent | atomic visible card bundles and two-stage preview/commit | qualified for observed bundle | other origins unqualified |
| `card_reward_selection` | reward flow | exact cards and separately labeled alternatives | qualified | alternatives remain an open visible set |
| `reward_claim` | outer room rewards | exact ordinary rewards, potion capacity/discard, Proceed/Skip | qualified for observed shapes | linked reward sets fail closed |
| `map_navigation` | map | full visible topology, visit/travel state, current/next nodes, drawing mode | qualified for observed singleplayer map | multiplayer and special map modes unsupported |
| `shop_room` | shop | current gold/potions plus merchant-open and Proceed controls | qualified for observed normal merchant | special merchant room variants need evidence |
| `shop_inventory` | shop | typed inventory, price, stock, visibility, affordability, category eligibility, sale, potion capacity, removal price | card/relic/potion purchase, open/close, capacity suppression, removal-child launch qualified | removal child is a separate, currently unqualified Surface |
| `deck_removal_selection` | shop parent | exact selected deck cards, selection limits, preview/confirm/cancel controls | v0.109 narrow action-and-inspection canary: first full ordinary flow and external run-deck post-state passed; command completion has since been hardened | second independent journey must pass the strong semantic witness before qualification; never infer Smith/transform/enchant/general-selector semantics |
| `run_deck` inspection | active singleplayer run | per-instance card, upgrade and enchantment | v0.109 narrow read-only canary runtime-smoked; used for exact 11 -> 10 removal proof | no arbitrary queries; `combat_piles` remains disabled on v0.109 |
| `combat_piles` inspection | combat | unordered draw/discard/exhaust contents | qualified | draw order intentionally hidden |

## Unsupported Or Legacy-Owned

| Interaction | Current authority | Status |
|---|---|---|
| treasure | v1 local reconstruction | stale-index risk remains; no v2 contract |
| generic run-deck select/remove/transform/upgrade | v1 local reconstruction | one exact ordinary merchant removal flow has v2 candidate evidence; transform/upgrade and every other selector remain legacy |
| menu / character select / game over | v1 local reconstruction | character selected-state is not represented and can repeat |
| linked reward sets | none in v2 | fail closed |
| multiplayer | none in v2 | intentionally unsupported |

## Visibility Laws

- Context answers what situation exists; Surface answers which topmost
  interaction grammar owns input; Authority answers who may execute.
- Underlying surfaces are suspended. Their facts may remain in Context or
  Inspection, but their actions never mix with the Active Surface.
- Legal actions bind only to explicit visible entity identities and remain
  executable solely by opaque action ID.
- Inspection is read-only and state-bound; it never enters the command ledger.
- Unknown or hidden facts are omitted and diagnosed, never guessed. RNG, real
  draw order, future event dialogue/outcomes, future rewards, and future enemy
  moves are outside the protocol.
- Surface completeness is bounded. It must not be read as a claim of total UI
  or full-game semantic completeness.

## Known Semantic Gaps

- Shared HUD/run facts are not yet a canonical Bridge context shared by every
  non-combat surface; Re-SpireAgent still merges compatible v1 sidecar facts.
- Rich hover/tool-tip keyword semantics are not uniformly projected for cards,
  relics, potions, statuses, and intents.
- Similar card payloads do not imply one selector protocol. Pile, hand,
  generated, reward, bundle, enchantment, and deck-maintenance selectors retain
  separate ownership and completion until repeated evidence proves a safe
  shared abstraction.
