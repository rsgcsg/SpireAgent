# Player-Visible Coverage Matrix

Coverage is per exact game build and surface. “v1 exists”, decompiled code, or a
fixture is not organic v2 qualification.

| Surface | Context semantics | Legal actions | Completion | Organic smoke | Status |
|---|---|---|---|---|---|
| deck enchant selection | event/combat parent context | implemented | action-specific | Bridge + Re passed | runtime-qualified |
| ordinary event option | event id/name/body/dialogue flags | implemented | option applied/subsurface/room transition | Bridge + Re passed | runtime-qualified for ordinary options |
| player-phase combat turn | player, hand, piles counts, statuses, relics, potions, orbs, enemies, intents | implemented | card left hand/subsurface, potion consumed, play phase ended | Bridge + Re targeted-card passed | runtime-qualified for immediate player turn |
| ancient event dialogue | event context only | none | none | none | explicit unsupported |
| combat pile card selection | combat facts + visible source pile, prompt, constraints, selected members | exact toggle/confirm/cancel/peek-close | membership change, auto-completion, commit/close | four select actions passed across two preview.9 runs | runtime-qualified for observed discard-pile single-pick shape |
| combat hand card selection | combat facts + exact visible hand-card instances and constraints | exact toggle/confirm/cancel/peek-close | membership change or commit/close | one upgrade select + confirm flow passed | runtime-qualified only for observed upgrade shape |
| generated card choice | combat facts + temporary visible generated cards, skip/peek state | exact card/skip/peek-close | overlay closes or peek closes | historical organic UI sample; no fresh preview.9 lifecycle | source/fixture qualified, organic qualification pending |
| card reward selection | `reward_flow`, visible cards, separately labeled alternatives | exact card/alternative actions | overlay closes or option objects are replaced | Bridge + Re passed | runtime-qualified for ordinary card/Skip flow |
| outer room reward claim | `reward_flow`, visible ordinary rewards, potion capacity/discard operands, Proceed/Skip state | exact claim/discard/proceed actions | reward/slot set changes, child surface replaces it, or screen exits | Gold, Proceed/Skip, and full-belt discard-then-claim passed | runtime-qualified for observed ordinary and full-potion shapes; linked reward sets fail closed |
| generic deck selection | none | none | none | rest upgrade still observed through v1 local reconstruction | unsupported; do not merge with the three combat selectors |
| bundle/relic selection | none | none | none | none | unsupported |
| map/rest/shop/treasure | v1 sidecar only | none in v2 | none in v2 | frequent organic local-reconstruction evidence | unsupported in v2; map is the highest-frequency remaining action owner |
| menu/game over | none | none | none | none | unsupported |
| `run_deck` inspection | per-instance deck card, upgrade, enchantment | none; read-only | state-bound exact read | post-card-reward Glam reinspection passed | runtime-qualified for observed singleplayer run deck |
| `combat_piles` inspection | unordered draw/discard/exhaust contents | none; read-only | state-bound exact read | non-empty draw/discard/exhaust passed | runtime-qualified for observed pile shapes; draw order remains hidden |
| multiplayer | none | none | none | none | intentionally unsupported |

## Shared Semantics Learned From Multiple Source Contracts

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
- A shared card payload does not imply a shared Surface. Pile, hand, generated,
  reward, and run-deck selection differ in object ownership, action grammar,
  timing guards, and completion evidence. Common code may share visible-card
  serialization and entity-binding laws without collapsing their wire kinds.
- Full inventory is part of action legality. A visible potion reward is not a
  legal claim while the belt is full; capacity resolution is an action on the
  same reward surface, not hidden local strategy or a fabricated claim retry.

## Known Visibility Gaps

- Generated, transformed, retained, or temporarily modified combat cards still
  need diversity evidence. A historical generated-card choice motivated an
  exact separate protocol, but preview.9 has not yet executed it organically.
- Draw order remains intentionally hidden.
- Ancient dialogue advancement has different lifecycle semantics from ordinary
  event options and is intentionally not generalized.
- No claim is made that the current enemy intent DTO covers every game-specific
  intent presentation until organic combat diversity is observed.
- Long runs now cover many combat-turn actions and four pile-selection actions,
  but qualification remains per observed target/selector shape. Do not infer
  every card effect or every phase transition from aggregate action counts.

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
- The inspection boundary is machine-readable and implemented only for the two
  fixed kinds above. It remains non-executable and is not an arbitrary object
  query API.
