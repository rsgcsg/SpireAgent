# Player-Visible Coverage Matrix

Coverage is per exact game build and surface. “v1 exists”, decompiled code, or a
fixture is not organic v2 qualification.

| Surface | Context semantics | Legal actions | Completion | Organic smoke | Status |
|---|---|---|---|---|---|
| deck enchant selection | event/combat parent context | implemented | action-specific | Bridge + Re passed | runtime-qualified |
| ordinary event option | event id/name/body/dialogue flags | implemented | option applied/subsurface/room transition | Bridge + Re passed | runtime-qualified for ordinary options |
| player-phase combat turn | player, hand, piles counts, statuses, relics, potions, orbs, enemies, intents | implemented | card left hand/subsurface, potion consumed, play phase ended | Bridge + Re targeted-card passed | runtime-qualified for immediate player turn |
| ancient event dialogue | event context only | none | none | none | explicit unsupported |
| combat card selection | combat parent context possible | none | none | none | unsupported |
| card reward selection | `reward_flow`, visible cards, separately labeled alternatives | exact card/alternative actions | overlay closes or option objects are replaced | Bridge + Re passed | runtime-qualified for ordinary card/Skip flow |
| outer room reward claim | `reward_flow`, visible ordinary rewards and Proceed/Skip state | exact claim/proceed actions | reward button is removed, card-selection overlay replaces it, or screen exits | Gold claim and post-fix Proceed/Skip passed at Bridge command layer | runtime-qualified for observed ordinary claim/Proceed shapes; linked reward sets fail closed |
| generic deck selection | none | none | none | none | unsupported |
| bundle/relic selection | none | none | none | none | unsupported |
| map/rest/shop/rewards/treasure | none | none | none | none | unsupported |
| menu/game over | none | none | none | none | unsupported |
| read-only deck/pile inspection | disabled capability contract only | n/a | n/a | none | no endpoint or implemented kind |
| multiplayer | none | none | none | none | intentionally unsupported |

## Shared Semantics Learned From Five Source Contracts

- `context.kind` answers which game situation exists; it does not identify the
  blocking interaction by itself.
- `surface.kind` answers which interaction protocol is active; it must not
  duplicate the whole world state.
- action authority is separate from both. Re-SpireAgent records
  `bridge_advertised`, `local_reconstruction`, or `none`.
- `legal_actions` are exact-state mutations/navigation. Read-only facts and
  inspection are not fake actions.
- context/surface combinations are validated. `event + event_option` and
  `combat + combat_turn` have bounded organic lifecycle evidence; mismatches
  still fail closed.
- Card reward alternatives are an open set of visible choices, not a skip
  boolean. If any visible alternative lacks readable semantics, the whole
  strategic choice fails closed rather than hiding an option.
- The outer rewards screen and its card-choice child are distinct interaction
  protocols. A card reward claim is only the transition into card selection;
  it must not manufacture card alternatives or card-selection semantics early.
- During room exit, the game's explicit open map state takes precedence over a
  retained rewards overlay. This prevents a finished Proceed action from
  publishing stale reward actions while preserving the separate reward and map
  protocols.

## Known Visibility Gaps

- After deck enchant closes, v2 cannot yet re-read the complete deck to verify
  the persistent enchant independently.
- Combat includes pile counts but not draw/discard/exhaust contents. Those are
  player-inspectable through separate UI flows and belong in a future read-only
  inspection/query contract. Draw order remains hidden.
- Ancient dialogue advancement has different lifecycle semantics from ordinary
  event options and is intentionally not generalized.
- No claim is made that the current enemy intent DTO covers every game-specific
  intent presentation until organic combat diversity is observed.
- The combat qualification includes one targeted card. Potions, self-target
  cards, end turn, multi-target cards, combat overlays, and longer phase
  transitions need their own bounded evidence before any broader claim.

## Composition And Inspection Boundary

- One topmost verified blocking surface owns all executable actions; context
  remains visible below it.
- Underlying surfaces are suspended, not nested with executable actions.
- Combat pile contents and run-deck contents belong to state-bound read-only
  inspection; count snapshots remain in immediate context.
- `unsupported` means no verified interaction contract. A future typed
  `none`/`transition` surface should represent known contexts with no current
  blocking decision.
- Structured diagnostics must distinguish action-suppressing gaps from
  non-blocking inspection omissions.
- The inspection boundary is now machine-readable but remains disabled. It is
  not evidence that pile/deck inspection has been implemented.
