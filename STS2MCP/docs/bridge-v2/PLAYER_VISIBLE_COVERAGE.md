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
| card reward | none | none | none | none | unsupported |
| generic deck selection | none | none | none | none | unsupported |
| bundle/relic selection | none | none | none | none | unsupported |
| map/rest/shop/rewards/treasure | none | none | none | none | unsupported |
| menu/game over | none | none | none | none | unsupported |
| read-only deck/pile inspection | none | n/a | n/a | none | future inspection contract |
| multiplayer | none | none | none | none | intentionally unsupported |

## Shared Semantics Learned From Three Surfaces

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
