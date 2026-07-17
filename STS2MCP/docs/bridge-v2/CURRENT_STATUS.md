# Bridge v2 Current Status

Status date: 2026-07-18

## Current Phase

Protocol `2.0-preview.25` is the current source and installed runtime contract.
The exact game identity is `v0.109.0|c12f634d|-840572606`.

Current-build authority is deliberately scoped:

| Contract | Permission | Evidence boundary |
|---|---|---|
| `deck_removal_selection` | `qualified_exact_build` | merchant select/automatic-preview/confirm, strong semantic removal witness, same-state `run_deck` post-state |
| `deck_upgrade_selection` | `qualified_exact_build` | independent event and rest select/confirm journeys with exact upgraded-card post-state |
| `combat_turn` | `qualified_exact_build` | repeated ordinary current-build card/potion/end-turn journeys |
| `combat_hand_card_selection` | `qualified_exact_build` | exact-source v0.109 revalidation plus Touch of Insanity select/confirm and same-instance cost post-state |
| `rest_site` | `qualified_exact_build` | ordinary single-player Heal exact HP, Smith exact child launch/cancel, and Proceed-to-map; unknown enabled options fail closed |
| `event_card_acquisition` | `candidate_action_canary` | Brain Leech one-card auto-commit with exact selected-instance run-deck witness; Room Full of Cheese two-card flow remains unqualified |
| `reward_claim` | `candidate_action_canary` | clean ordinary reward child/proceed journey; linked rewards still fail closed |
| `card_reward_selection` | `candidate_action_canary` | clean ordinary card selection journey |
| `map_navigation` | `candidate_action_canary` | clean exact-node travel journey |
| `treasure_room` | `candidate_action_canary` | relic choose plus room Proceed are organically confirmed; open and skip remain unqualified variants |
| `run_deck` | `qualified_read_only_scoped` | state-bound read-only deck post-state; no action authority |

Every unlisted Surface and Inspection remains disabled for this build. Historical
`v0.108.0` evidence remains useful protocol history but grants no v0.109 action
authority.

## Preview.25 Organic Evidence

- organic-canary DLL SHA-256:
  `62949eb56ad54b289ddcb3951e0c108c1e684fb076eb3a1fb66eca2d759c6047`;
- organic-canary module MVID: `c4abca9d-bcd4-4eb3-a77d-4f19a21cf0dd`;
- organic-canary runtime instance: `2c3560e2fe264ba6b497caa0111e7d99`;
- Brain Leech exposed `event + event_card_acquisition` with five exact visible
  card entities and five state-bound opaque actions;
- Re-SpireAgent decoded the same state as `bridge_advertised` without v1 action
  merging;
- request `preview25-brain-leech-offering-20260718-1` completed with
  `selected_event_cards_added_as_exact_instances_to_run_deck`;
- the `run_deck` Inspection changed from 12 to 13 cards and contained the same
  selected Offering entity `card_5b08e5c7_18`;
- the child returned to a legacy-owned event parent without leaking child or
  parent actions across the authority boundary.
- a behavior-preserving closeout rebuild corrected the capability detail text;
  final installed SHA-256 is
  `16c4693e7c73f85be879caa9a72dac743843c3732d76be57e8d1423d6797f18b`,
  loaded MVID is `8a1f10d1-4a44-4c35-95b9-cd9aa49dbcec`, and runtime instance
  is `67f94ba3618a40cfa9160c5dd678470d`;
- final-MVID request
  `preview25-final-mvid-brain-leech-offering-20260718-1` independently repeated
  the exact completion on fresh entities: run deck 12 -> 13 and Offering
  `card_a0eaf7ea_c` present by same-state Inspection.

See the [preview.25 event card-acquisition canary](PREVIEW_25_EVENT_CARD_ACQUISITION_CANARY_2026-07-18.md).

The final installed preview.25 artifact additionally requalifies ordinary
single-player `rest_site` with purpose-specific completion:

- DLL SHA-256:
  `1e5cf857c239acb80fa40105360b690efe9a03b1c0fa2e6645f9c8990126acd0`;
- loaded MVID: `e9a9e229-82b7-4752-afb7-46b910468f58`;
- runtime instance: `81135d086eeb4d5bac16154ad6afdc8b`;
- Heal completed only with exact HP 56 -> 80 plus option progression;
- Smith completed only when the exact upgrade child opened, and child cancel
  returned cleanly to the same rest Surface;
- Proceed completed on map/room transition;
- regression run `run-20260717145202-b5ewm2` recorded 24/24 settled,
  Bridge-owned decisions with no command failure.

See the [preview.25 rest-site requalification](PREVIEW_25_REST_REQUALIFICATION_2026-07-18.md).

## Canonical Model

Runtime identity is:

```text
shared visible state + context.kind + surface.kind + action authority
```

- Context describes the current semantic game situation.
- Exactly one Active Surface describes the topmost player-owned interaction
  grammar and owns every executable action.
- Stage belongs to a Surface when one business interaction has distinct
  selecting, preview, settling, or completed states.
- Inspection is a state-bound read-only view outside the command ledger.
- Authority is independent: `bridge_advertised`, `local_reconstruction`, or
  `none` in Re-SpireAgent.
- Diagnostics report visibility, completeness, ownership, and safety without
  inventing actions.
- `shared_state` is the first-class, top-level, read-only authority for
  persistent single-player run/player HUD facts. It creates no actions and is
  included in `state_id`.

Bridge-owned states no longer dual-read v1 for shared run/player facts. A
no-run state explicitly sends `shared_state: null`; an active run whose shared
projection fails suppresses all actions.

## Preview.24 Organic Evidence

- final installed DLL SHA-256:
  `ab8b2e22f1e187f9e6947b243bc8b9a3ef28cd9937ebf547da7b73c89aee0e20`;
- loaded module MVID: `3966756e-1b28-4995-91d1-1950a84ea6d3`;
- runtime instance: `f09cc247f1ae44ba99bfe7e040052a86`;
- menu/no-run emitted explicit `shared_state: null` with zero v2 actions;
- an organic run exposed act/floor/ascension, visible boss, HP/gold, relics,
  potions/capacity, descriptions, and supported keyword semantics;
- final-MVID `combat + combat_turn` showed exact equality between shared potion
  entities and transient combat potion affordances;
- `preview24-final-potion-canary-1` completed as confirmed. The post-state
  removed Weak Potion from both projections and showed Weak 3 on the enemy;
- Re decoded the same state with clean diagnostics, schema 17, and
  `bridge_advertised` authority without a v1 shared-state read.
- Organic run `run-20260717135207-gpeaut` exposed a real v1 same-name card
  identity/settlement defect at the Touch of Insanity child selector. Exact
  v0.109 source review and two current-MVID canaries then qualified
  `combat_hand_card_selection`: exact Bash selection, confirmed closure, and
  the same Bash entity changing visible cost from 2 to 0.

See the [shared visible state closeout](PREVIEW_24_SHARED_VISIBLE_STATE_CLOSEOUT_2026-07-17.md)
and the [combat hand-selection qualification](PREVIEW_24_COMBAT_HAND_SELECTION_QUALIFICATION_2026-07-17.md).

## Preview.23 Organic Evidence

### Purpose-specific deck upgrade

- `run-20260717110552-69mc6h`: event upgrade selected Armaments and the settled
  run deck contained Armaments+.
- `run-20260717110610-o77s7z` and `run-20260717110639-gsidjv`: rest Smith selected
  Prep Time and the settled run deck contained Prep Time+.
- Event and rest retain separate parent Contexts while sharing only internal,
  non-authoritative bounded-selection mechanics.

### Reward and map canaries

- `run-20260717110843-4shpn0` completed outer reward -> card-reward child ->
  outer reward -> Proceed -> map, then a state-bound map choice.
- These are current-build canaries, not resilience qualification and not
  permission for linked rewards or special map modes.

### Treasure canary

The exact current source and UI establish a separate `treasure_room` Surface
with `closed`, `opening`, `relic_choice`, and `completed` stages. It is not a
universal reward Surface.

- `treasure-choose-1784288012` completed with
  `treasure_relic_owned_and_selection_closed`; the exact player relic inventory
  then contained Bag of Marbles.
- `treasure-proceed-1784288168` completed with
  `treasure_room_left_or_map_opened`; the next state was
  `map + map_navigation` at the visited treasure coordinate.
- The installed DLL hash matched the Release build and the loaded process
  reported module MVID `aaa57733-df23-4069-9dfc-31922dd0e1a7`, runtime instance
  `2d05c1630ac84639b8cd1e2fdc6635f7`, and the exact game identity above.
- The restored save entered a real asynchronous `opening` transient before
  settling to `relic_choice`. That transient published no action.
- Chest open and relic skip were not exercised in this journey and must not be
  called qualified.

## Verification

The current preview.25 implementation has passed:

- Bridge contract/runtime tests: 55/55;
- Re-SpireAgent tests: 123/123;
- Re-SpireAgent strict typecheck and production build;
- exact-source Bridge Release build with zero warnings and zero errors;
- installed-DLL hash equality and loaded runtime identity checks;
- current-build treasure choose and Proceed semantic completion from
  preview.23;
- final-MVID shared-state read and combat potion semantic completion from
  preview.24.
- final-MVID combat hand select/confirm and same-card cost post-state.
- current-MVID Brain Leech exact-card commit and same-instance run-deck
  post-state.

These counts describe the closeout run, not a permanent invariant. A fixture or
successful build never substitutes for organic action evidence.

## Honest Completeness Boundary

`contract_complete_for_visible_*` means complete for one bounded active Surface
contract and its action-critical facts. It is not a claim that Bridge v2 exposes
every fact visible anywhere in the game.

Current debt includes:

- treasure open/skip variants are not organically qualified;
- linked reward sets remain fail closed;
- menu, character select, run start, and game over remain v1-owned;
- shop remains v1-owned on v0.109 despite historical v2 implementation; a
  current organic run recorded three clean legacy shop decisions and requires
  exact-build requalification rather than permission inheritance;
- transform and other purpose-specific deck maintenance remain unsupported;
- rich tooltip/keyword forms beyond supported ordinary hover tips remain
  unqualified and fail closed when encountered;
- map drawing and special map modes need separate evidence;
- multiplayer remains intentionally unsupported.

## Next Step

Preview.25 is closed as a scoped current-build release. Continue the current
organic run until the next coherent unsupported or legacy-owned blocking
journey. The next evidenced migration target is current-build shop
requalification: the provider exists, but three fresh v0.109 decisions correctly
fell back to v1 because only v0.108 permission exists. Re-audit exact inventory,
typed purchase, removal-child, close, and Proceed witnesses before enabling a
canary; do not inherit historical authority. The largest later authority
boundary remains menu -> character select -> run start -> game over.

Room Full of Cheese two-card acquisition, linked rewards, treasure open/skip
diversity, remaining purpose-specific deck maintenance, and typed tooltip
coverage remain explicit evidence debt.

See [the preview.23 closeout audit](PREVIEW_23_UPGRADE_TREASURE_CLOSEOUT_2026-07-17.md),
[the preview.24 shared-state closeout](PREVIEW_24_SHARED_VISIBLE_STATE_CLOSEOUT_2026-07-17.md),
[the combat hand-selection qualification](PREVIEW_24_COMBAT_HAND_SELECTION_QUALIFICATION_2026-07-17.md),
[the preview.25 event card-acquisition canary](PREVIEW_25_EVENT_CARD_ACQUISITION_CANARY_2026-07-18.md),
[the preview.25 rest-site requalification](PREVIEW_25_REST_REQUALIFICATION_2026-07-18.md),
[ADR-0003](ADR-0003-semantic-surfaces-shared-mechanics-and-completion.md),
[the architecture reassessment](ARCHITECTURE_REASSESSMENT_2026-07-17.md), and
[the coverage matrix](PLAYER_VISIBLE_COVERAGE.md).
