# MCP State Coverage

Canonical Bridge permission and evidence status lives in
[`STS2MCP/docs/bridge-v2/CURRENT_STATUS.md`](../../STS2MCP/docs/bridge-v2/CURRENT_STATUS.md)
and the
[`PLAYER_VISIBLE_COVERAGE.md`](../../STS2MCP/docs/bridge-v2/PLAYER_VISIBLE_COVERAGE.md)
matrix. This document records the Re-SpireAgent consumption boundary.

## Bridge v2 Current Client Contract

Re strictly decodes `2.0-preview.55`. It accepts Bridge actions only when:

- game, Modset, Bridge assembly SHA-256, MVID, and runtime identities match
  exact scoped capabilities and state;
- the Surface kind appears exactly once and has no duplicate operation names;
- context, Surface, stage, readiness, entity bindings, and legal-action kinds
  are mutually consistent;
- one explicit capability scope authorizes that exact Surface operation for
  this build;
- the current Surface is Bridge-advertised and every action is state-bound.

Current identity `v0.109.0|c12f634d|1833084275` has 71 canary operation
scopes across 23 Surface kinds, no qualified operation, and three read-only
Inspection canaries. The table describes supported projections and historical
evidence diversity; every executable row is canary-only on this build.

| Bridge contract | Re projection | Current v0.109 status |
|---|---|---|
| `combat_turn` | `combat + combat_turn + bridge_advertised`, including exact visible `player.companions` | current-build canary; real-game fixture-decision run exercised play/end/potion, historical Osty evidence belongs to an older MVID |
| exact combat setup/resolution no-input transition | `combat_transition(setup|resolution) + no_action + none` | both phases organically observed on current MVID; not an action capability |
| `combat_hand_card_selection` | `combat + combat_hand_card_selection + bridge_advertised` | current-build canary; exercised in the 50-Tick runtime run |
| `deck_removal_selection` | `shop + deck_removal_selection + bridge_advertised` | current-build canary; historical semantic evidence only on older identity |
| `deck_upgrade_selection` | event/rest parent + purpose-specific child | current-build canary; publication/execution validator is shared |
| `rest_site` | `rest + rest_site + bridge_advertised` | current-build canary |
| event acquisition, reward, card reward, map, shop, treasure, card bundle | purpose-specific typed Context + Surface | current-build action canaries |
| `character_select` | `menu + character_select` with no active-run shared state | current-build action canary |
| `event_dialogue` / `event_option` | revealed prefix or typed visible options/tooltips | current-build action canaries |
| `deck_transform_selection` | `event + deck_transform_selection`, exact selected instances and random-uncommitted preview | Whispering Hollow action canary; other origins fail closed |
| `deck_enchant_selection` | `event + deck_enchant_selection`, exact target enchantment, selected instances, and selecting/preview stages | Self-Help Book action canary; semantic exact-card post-state confirmed, other origins fail closed |
| `generated_card_choice` | source-discriminated `event` run-deck or `combat` hand choice with exact purpose/source/destination/cost/overflow semantics | Lead Paperweight, Colorless Potion, and Attack Potion selections exercised; Skill/Power/Splash source-audited only; Skip/overflow diversity pending; every other source fails closed |
| exact Headbutt/Graveblast `combat_pile_card_selection` | exact discard candidate plus source-discriminated draw-top or hand/full-hand-discard purpose | action canary; both final completion branches need a natural repeat |
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

The bounded-run progress guard excludes regenerated transport identities,
including coherent `observationId`, from semantic transition comparison. It
still hashes business facts, Surface/stage, entity bindings, and action
semantics. This prevents an open/close loop from hiding behind fresh bundle
IDs without weakening stale-state execution checks.

## Explicit v1 Diagnostics Boundary

`v2` is the production default and `auto` is a strict-v2 alias. Neither uses
v1. Explicit `v1` can still address a separately enabled legacy server for
diagnostics, but it never participates in a Bridge v2 run or merges v1 facts
or actions into a v2 Surface.

Observed or expected v1-owned families still include:

- generic or purpose-unknown card selectors, including a fresh combat child;
- unsupported root-menu choices and non-standard single-player modes;
  first-run character tutorial; the bounded root/standard menu contracts are
  Bridge v2 canaries;
- crystal-sphere and other special screens without a current v2 contract;
- every non-Self-Help-Book deck-enchant and non-Headbutt/non-Graveblast
  combat-pile selector, plus every generated-card origin except exact Lead
  Paperweight, native Colorless/Attack/Skill/Power Potions, and native Splash.

v1 reconstructs indices and settlement locally. It is diagnostics compatibility
code, not production authority or equivalent semantic evidence.

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
