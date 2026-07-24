# MCP State Coverage

Canonical Bridge permission and evidence status lives in
[`STS2MCP/docs/bridge-v2/CURRENT_STATUS.md`](../../STS2MCP/docs/bridge-v2/CURRENT_STATUS.md)
and the
[`PLAYER_VISIBLE_COVERAGE.md`](../../STS2MCP/docs/bridge-v2/PLAYER_VISIBLE_COVERAGE.md)
matrix. This document records the Re-SpireAgent consumption boundary.

## Bridge v2 Current Client Contract

Re strictly decodes `2.0-preview.61`. It accepts Bridge actions only when:

- game, Modset, Bridge assembly SHA-256, MVID, and runtime identities match
  exact scoped capabilities and state;
- the Surface kind appears exactly once and has no duplicate operation names;
- context, Surface, stage, readiness, entity bindings, and legal-action kinds
  are mutually consistent;
- one explicit capability scope authorizes that exact Surface operation for
  this build;
- the current Surface is Bridge-advertised and every action is state-bound.

The current exact identity determines the Gateway-emitted explicit operation
scopes. The table describes supported projections and historical evidence
diversity; it does not transfer permission between game builds or Gateway
artifacts.

| Bridge contract | Re projection | Current v0.109 status |
|---|---|---|
| `combat_turn` | `combat + combat_turn + bridge_advertised`, including exact visible `player.companions` | current-build canary; real-game fixture-decision run exercised play/end/potion, historical Osty evidence belongs to an older MVID |
| exact combat setup/resolution no-input transition | `combat_transition(setup|resolution) + no_action + none` | both phases organically observed on current MVID; not an action capability |
| `combat_hand_card_selection` | `combat + combat_hand_card_selection + bridge_advertised` | current-build canary; exercised in the 50-Tick runtime run |
| `deck_removal_selection` | `shop + deck_removal_selection + bridge_advertised` | current-build canary; historical semantic evidence only on older identity |
| exact `Precise Scissors` `relic_deck_removal_selection` | `unknown + relic_deck_removal_selection + bridge_advertised` | source-bound canary is loaded on SHA `4940133...e031c2`; C#/Re contract tests pass, but no Organic lifecycle has run |
| exact `CardRemovalReward` `reward_deck_removal_selection` | `unknown + reward_deck_removal_selection + bridge_advertised` | Preview.58 full select/preview/confirm/deck-post-state Organic canary passed on SHA `992e6099...e8f15b1`; not qualified |
| `deck_upgrade_selection` | event/rest parent + purpose-specific child | current-build canary; publication/execution validator is shared |
| `rest_site` | `rest + rest_site + bridge_advertised` | current-build canary |
| event acquisition, reward, card reward, map, shop, treasure, card bundle | purpose-specific typed Context + Surface | current-build action canaries |
| `character_select` | `menu + character_select` with no active-run shared state | current-build action canary |
| `event_dialogue` / `event_option` | revealed prefix or typed visible options/tooltips | current-build action canaries |
| `deck_transform_selection` | `event + deck_transform_selection`, exact selected instances and random-uncommitted preview | Whispering Hollow action canary; other origins fail closed |
| `wood_carvings_replacement_selection` | `event + wood_carvings_replacement_selection`, exact Bird/Torus branch and known deterministic replacement | Bird select/cancel/reselect/confirm and exact run-deck post-state exercised on preview.56; Torus and repeat diversity pending |
| `deck_enchant_selection` | `event + deck_enchant_selection`, exact target enchantment, selected instances, and selecting/preview stages | Self-Help Book action canary; semantic exact-card post-state confirmed, other origins fail closed |
| `generated_card_choice` | source-discriminated run-deck, free combat-hand, unchanged-cost combat-hand, or immediate-effect choice | Preview.60 added strict Quasar and forced Knowledge Demon branches; current Preview.61 is loaded but those branches still need independently scoped Organic evidence. Discovery and every unbound source fail closed. |
| structural `combat_pile_card_selection` | closed movement or same-index replacement, automatic or manual-confirm commit, exact source provenance, selected instances, and bounds | Loaded Preview.61 source/tests cover Headbutt, Graveblast, Cleanse, Seance, Dredge, Charge, and Neow's Fury; the Neow lifecycle remains pending |
| `game_over` | `run_ended + game_over` | current-MVID loss intro -> summary -> return lifecycle confirmed; win/timeline diversity pending |
| `run_deck` Inspection | typed player run-deck evidence | current-build read-only canary; no authority |
| `combat_piles` Inspection | unordered draw/discard/exhaust card evidence | current-build read-only canary; no draw order or authority |
| `shop_catalog` Inspection | fixed visible merchant slots, prices, stock, affordability, potion-capacity blocks, and removal-service state | current-build read-only canary; no purchase/navigation authority |
| top-level `shared_state` | persistent run/player facts, text keywords, and typed read-only card previews | read-only and state-bound; preview facts grant no actions |
| `visibility` / `inspection_catalog` | bounded default-plus-inspection closure and available typed reads | read-only declarations; partial catalog; no action authority |
| coherent observation bundle | one state plus requested catalogued Inspections under one state/environment identity | strict decoder and real shop + run-deck read exercised; stale reads and scope mismatches with a freshly changed state retry as whole-read drift, while same-state mismatches fail hard |
| `contract_instance_shadow` | manifest contract, operations, legacy authority tier, and limitations | diagnostic only; always non-authorizing and not used to build allowed actions |

Map `current_position` is nullable and may be omitted by the Bridge serializer
while the map first opens or transitions from rewards. Re treats that shape as
a valid settling observation with no implied current coordinate or action; all
published route choices still require the ordinary exact-node legality checks.
The Gateway also suppresses the whole map action surface when a node that the
UI marks travelable is already present in the active run's visited-coordinate
set. Re receives no replacement local action in that contradictory state and
must preserve the Gateway's fail-closed result.

The bounded-run progress guard excludes regenerated transport identities,
including coherent `observationId`, from semantic transition comparison. It
still hashes business facts, Surface/stage, entity bindings, and action
semantics. This prevents an open/close loop from hiding behind fresh bundle
IDs without weakening stale-state execution checks.

## Retired v1 Boundary

Re is v2-only. The former `auto` and `v1` modes are rejected. The Gateway v1
HTTP namespace is retired; no runtime client can read, merge, or execute it.

Explicit fail-closed or out-of-scope families still include:

- generic or purpose-unknown card selectors, including a fresh combat child;
- unsupported root-menu choices and non-standard single-player modes;
  first-run character tutorial; the bounded root/standard menu contracts are
  Bridge v2 canaries;
- crystal-sphere and other special screens without a current v2 contract;
- every non-Self-Help-Book deck-enchant and combat-pile selector without exact
  Headbutt/Graveblast/Cleanse/Seance/Dredge/Charge/Neow's Fury source binding,
  plus every generated-card origin except exact Lead Paperweight, native
  Colorless/Attack/Skill/Power Potions, Splash, Quasar, and Knowledge Demon.

Historical v1 source and records remain archive evidence only. None of these
families has a fallback action path.

## Fail-Closed Rules

- Unsupported, ambiguous, malformed, duplicate, exact-identity-mismatched, or
  unqualified Bridge state has no executable Bridge action.
- `failed`, `timed_out`, transport-uncertain, stale, or response-identity
  mismatch is never automatically retried as an action.
- Similar grids do not share authority. Pile, hand, generated, reward,
  removal, upgrade, enchant, acquisition, and bundle protocols remain
  purpose-specific.
- Inspection is read-only. Hidden draw order, RNG, future rewards/events/moves,
  and private state never become prompt facts.

## Qualification Rule

Fixtures prove decoder and action plumbing only. Current-build qualification
requires exact source/UI audit, loaded artifact identity, organic action
lifecycle, semantic post-state witness, Re settlement, and Canonical document
update. Bounded Surface completeness is not whole-game player-visible
completeness.

Run metadata provenance is separate from Bridge identity. `unrecorded`,
operator-positioned, console-assisted, or fixture runs may expose coverage and
defects, but do not independently satisfy Organic qualification.
