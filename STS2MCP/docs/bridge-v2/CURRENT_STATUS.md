# Bridge v2 Current Status

Status date: 2026-07-18

## Current Contract

- protocol: `2.0-preview.31`
- source-qualified game identity: `v0.109.0|c12f634d|-840572606`
- current local runtime game identity: `v0.109.0|c12f634d|1833084275`
- installed/Release DLL SHA-256:
  `4028e3a19b4a5919b774e52b51da536cc2086b1192093631d61b2a8de02be0ff`
- loaded module MVID: `ad025752-ed39-46a4-86c7-bdf2934e02a8`
- loaded runtime instance: `d090682d350b4314bd86d917479e3548`

Bridge v2 is an incremental, exact-build-scoped protocol. It is not full v1
parity, all-game coverage, or complete player-visible truth.

Preview.31 closes a backward permission leak: an empty per-build Surface or
Inspection scope is now unconditionally empty, never an implicit wildcard.
The source-qualified v0.109 permissions are unchanged; recognized historical
v0.108 identity has no current v2 Surface or Inspection authority and can only
use explicit legacy handoff.

The current local runtime identity has the same release version and commit as
the source-qualified target but a different main-assembly hash. The loaded
Bridge therefore reports `untested`, no action authority, no state observation,
and no Inspection kinds. Compilation against that assembly proves only symbol
binding; it does not qualify the changed build. No source-target permission or
Organic evidence is inherited by `1833084275`.

## Current Permission Matrix

| Permission | Contracts |
|---|---|
| source-qualified `v0.109.0|c12f634d|-840572606`: `qualified_exact_build` | `deck_removal_selection`, `deck_upgrade_selection`, `combat_turn`, `combat_hand_card_selection`, `rest_site` |
| source-qualified `v0.109.0|c12f634d|-840572606`: `candidate_action_canary` | `event_card_acquisition`, `reward_claim`, `card_reward_selection`, `map_navigation`, `shop_inventory`, `shop_room`, `treasure_room`, `game_over`, `card_bundle_selection`, `character_select`, `event_dialogue`, `event_option` |
| source-qualified `v0.109.0|c12f634d|-840572606`: `qualified_read_only_scoped` | `run_deck` Inspection |
| source-qualified target: disabled | `deck_enchant_selection`, `combat_pile_card_selection`, `generated_card_choice`, `combat_piles` Inspection, every unlisted contract |
| current local `v0.109.0|c12f634d|1833084275`: `untested` | all Surface actions, state observations, and Inspections disabled; no canary is authorized |

Source implementation, target-build permission, local build/install/load,
canary, and Organic qualification are separate states. There are 20 declared
semantic Surface contracts: the source-qualified target has five qualified,
twelve canary-permitted, and three disabled; the current local build has none
permitted.

## Preview.29-.30 Evidence

- `character_select` added an explicit `Menu` input-owner layer without
  creating a universal menu API. A fresh standard-run journey selected Silent,
  changed Ascension 10 -> 9 -> 10, and embarked into a real Silent A10 run.
  Starting deck and collection totals are intentionally absent because the
  character-select UI does not show them. Root main menu and single-player
  submenu remain v1-owned.
- `event_dialogue` was requalified as a revealed-prefix-only ancient-dialogue
  canary. Four fresh current-build advances across two restarts completed with
  exact dialogue-index evidence; future dialogue remained absent.
- Exact source proved that event options expose `EventOption.HoverTips` on
  focus. The first preview.30 observation correctly failed closed on a
  `CardHoverTip`, disproving the assumption that every tooltip is a text
  keyword. The fixed contract uses typed `text` and `card` tooltip variants.
- A fresh Neow option observation exposed Ambergris text, a full Guilty card
  preview, and Unplayable text. Re strict inspect accepted the same facts.
- Choosing Neow's Talisman completed only after event model options were
  replaced. Post-state independently showed the exact relic plus one upgraded
  Strike and one upgraded Defend. Proceed then completed on the visible map.
- Generic event completion no longer accepts `WasChosen=true`; source sets it
  before the asynchronous option effect finishes. Replacement event state,
  required child Surface, combat, map, or room transition is required.
- The complete Neow Organic Journey belongs to loaded MVID
  `f2604133-ed1a-41f3-a638-ab38829d3cb5`. Historical final target MVID
  `bdc97168-3bc7-40c4-8a2e-bb0698169118` adds a stricter proceed/new-overlay
  completion predicate and was source-, test-, build-, install-, and
  load-verified on the source-qualified target; that narrow final delta has
  not been misrepresented as a repeated organic Neow lifecycle.
- The current local MVID `ad025752-ed39-46a4-86c7-bdf2934e02a8` is
  source-, test-, build-, install-, and load-verified only. It has no action
  canary or Organic qualification, and no previous journey is attributed to it.

Detailed evidence is in
[PREVIEW_29_30_MENU_DIALOGUE_AND_EVENT_OPTION_QUALIFICATION_2026-07-18.md](PREVIEW_29_30_MENU_DIALOGUE_AND_EVENT_OPTION_QUALIFICATION_2026-07-18.md).
Preview.28 history remains in its own report.

## Architecture Verdict

```text
SharedVisibleState + Context + exactly one Active Surface + Stage + Authority
  -> state-bound opaque action
  -> execution-time revalidation
  -> semantic completion witness

Inspection = independent, read-only, state-bound, outside the command ledger
```

The top-level model remains healthy. Preview.29 showed that input ownership is
not limited to run rooms and overlays, so `Menu` is now a third resolver layer.
Preview.30 showed that player-visible hover semantics need typed composition,
not a universal flat keyword list. Neither finding supports a recursive
executable Surface stack, universal selector, or universal menu protocol.

`contract_complete_for_*` means complete only for that bounded contract. It
never means the whole screen or game is completely exposed.

## Next Work

1. Keep `event_option`, `event_dialogue`, and `character_select` at canary while
   collecting ordinary non-Neow diversity and first-run/tutorial boundaries.
2. Add purpose-specific root main-menu and single-player submenu contracts so
   a new or continued standard run can start without v1 reconstruction.
3. Re-run a fresh natural preview.28+ game-over intro -> summary -> main-menu
   journey; the fixed contract still lacks final organic qualification.
4. Requalify high-value disabled selectors/Inspection and close linked reward,
   special treasure, tooltip, and shared-HUD variants from exact evidence.
5. Retire each v1 family only after source, strict client, loaded identity,
   organic lifecycle, and semantic completion all agree.
6. Before any v2 action on the current local `1833084275` build, repeat the
   exact source/UI audit and bounded canary lifecycle for that exact hash; do
   not copy target-build authority merely because version and commit match.

See the [coverage matrix](PLAYER_VISIBLE_COVERAGE.md) and
[v1 retirement/completeness audit](BRIDGE_V2_V1_RETIREMENT_AND_COMPLETENESS_AUDIT_2026-07-18.md).

The independent architecture decision and staged evolution plan are recorded
in [ARCHITECTURE_AUDIT_2026-07-18.md](ARCHITECTURE_AUDIT_2026-07-18.md) and
[ARCHITECTURE_EVOLUTION_PLAN.md](ARCHITECTURE_EVOLUTION_PLAN.md).
