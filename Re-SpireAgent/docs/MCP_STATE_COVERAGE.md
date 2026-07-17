# MCP State Coverage

Canonical Bridge permission and evidence status lives in
[`STS2MCP/docs/bridge-v2/CURRENT_STATUS.md`](../../STS2MCP/docs/bridge-v2/CURRENT_STATUS.md)
and the
[`PLAYER_VISIBLE_COVERAGE.md`](../../STS2MCP/docs/bridge-v2/PLAYER_VISIBLE_COVERAGE.md)
matrix. This document records the Re-SpireAgent consumption boundary.

## Bridge v2 Current Client Contract

Re strictly decodes `2.0-preview.30`. It accepts Bridge actions only when:

- game and loaded Bridge identities match exact scoped capabilities;
- the Surface kind appears exactly once and has no duplicate operation names;
- context, Surface, stage, readiness, entity bindings, and legal-action kinds
  are mutually consistent;
- the capability permission list authorizes that Surface for this exact build;
- the current Surface is `bridge_owned` and every action is state-bound.

| Bridge contract | Re projection | Current v0.109 status |
|---|---|---|
| `combat_turn` | `combat + combat_turn + bridge_advertised` | qualified |
| `combat_hand_card_selection` | `combat + combat_hand_card_selection + bridge_advertised` | qualified |
| `deck_removal_selection` | `shop + deck_removal_selection + bridge_advertised` | qualified |
| `deck_upgrade_selection` | event/rest parent + purpose-specific child | qualified |
| `rest_site` | `rest + rest_site + bridge_advertised` | qualified |
| event acquisition, reward, card reward, map, shop, treasure, card bundle | purpose-specific typed Context + Surface | current-build action canaries |
| `character_select` | `menu + character_select` with no active-run shared state | current-build action canary |
| `event_dialogue` / `event_option` | revealed prefix or typed visible options/tooltips | current-build action canaries |
| `game_over` | `run_ended + game_over` | preview.28 client contract implemented; fresh organic lifecycle pending |
| `run_deck` Inspection | typed player run-deck evidence | qualified read-only; no authority |
| top-level `shared_state` | persistent run/player facts | read-only and state-bound |

## Explicit v1 Compatibility Boundary

`auto` mode may use v1 only when Bridge returns one coherent
`legacy_fallback_allowed` handoff. It never merges v1 actions into a
Bridge-owned Surface.

Observed or expected v1-owned families still include:

- generic or purpose-unknown card selectors, including a fresh combat child;
- root menu and single-player submenu; first-run character tutorial;
- crystal-sphere and other special screens without a current v2 contract;
- current-build-disabled deck enchant, combat-pile, and generated-card
  variants.

v1 reconstructs indices and settlement locally. It is compatibility code, not
equivalent safety or semantic evidence. A v1-supported shape can still be
unsupported in Re when the raw purpose is ambiguous.

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
