# Bridge v2 Current Status

Status date: 2026-07-17

## Current Phase

Protocol `2.0-preview.9` is implemented and loaded in the exact supported game.
Eight executable Surface contracts and two fixed, non-executable Inspection
kinds are present. Qualification remains per observed interaction shape: seven
surfaces have bounded organic lifecycle evidence; `generated_card_choice` has
exact-source and fixture qualification but still lacks a fresh preview.9
organic lifecycle.

## Implemented

- Independent typed `context`, active `surface`, and client action authority.
- `ActiveSurfaceResolver`: the top blocking overlay exclusively selects the
  overlay provider family; otherwise room/turn providers are considered.
  Multiple matches in the active family fail closed.
- Typed diagnostics with separate severity, operational effect, recovery hint,
  optional path/visibility class, and action-critical status. Legacy warnings
  remain compatibility text and do not independently grant or remove authority.
- State-bound `run_deck` and `combat_piles` read endpoints. They exclude
  arbitrary queries, hidden visibility, and draw order; they never grant action
  authority or enter the command ledger.
- Exact build identity, opaque state-bound actions, execution-time
  revalidation, idempotent requests, and action-specific completion.
- Legal actions carry non-executable `entity_bindings` to visible entities so
  duplicate cards/targets/options remain strategically distinguishable without
  exposing command arguments or hidden game objects.
- `deck_enchant_selection`, `event_option`, and `combat_turn` organic slices.
- `card_reward_selection` preserves visible cards and every separately labeled
  enabled alternative. It does not collapse alternatives into `can_skip`.
  Missing card-row, clickability, alternatives, or visible alternative labels
  suppress all actions.
- `reward_claim` is the outer `NRewardsScreen` protocol. It exposes visible
  ordinary reward buttons and the enabled Proceed/Skip control as opaque
  actions. Claiming a card reward completes when its distinct card-selection
  overlay replaces the outer screen; it is not flattened into a reward index.
  Visible linked reward sets remain fail-closed until they have their own
  selection contract.
- A full potion belt does not advertise an impossible potion claim. The same
  `reward_claim` surface exposes exact, state-bound discard actions for the
  currently visible potions; after capacity exists, the potion reward becomes
  claimable. Capacity and exact slot identity are revalidated at execution.
- `combat_pile_card_selection`, `combat_hand_card_selection`, and
  `generated_card_choice` are separate blocking protocols. They share opaque
  entity binding and fail-closed laws, but not wire actions or completion
  semantics.
- Re-SpireAgent strict `preview.9` decoding, binding referential-integrity
  checks, inspection projection, context/surface compatibility, allowed-action
  import, prompt guides, and tests.

## Qualification Matrix

| Surface | Exact source/build | Contract/fixture | Organic Bridge | Organic Re lifecycle |
|---|---|---|---|---|
| `deck_enchant_selection` | pass | pass | pass | pass |
| `event_option` | pass | pass | pass | pass |
| `combat_turn` | pass | pass | pass | pass |
| `combat_pile_card_selection` | pass | pass | pass | pass for four observed discard-pile, single-pick auto-complete actions across two runs |
| `combat_hand_card_selection` | pass | pass | pass | pass for observed upgrade select + confirm; other modes remain unqualified |
| `generated_card_choice` | pass | pass | historical pre-preview.9 UI evidence | not yet fresh preview.9 qualified |
| `card_reward_selection` | pass | pass | pass | pass |
| `reward_claim` ordinary claim | pass | pass | pass | pass |
| `reward_claim` full-potion discard then claim | pass | pass | pass | targeted exact-state lifecycle passed |
| `reward_claim` Proceed/Skip | pass | pass | pass | pass; map witness prevents stale reward actions |
| `run_deck` inspection | pass | pass | pass | pass, including Glam post-state |
| `combat_piles` inspection | pass | pass | pass | pass for non-empty draw/discard/exhaust while withholding draw order |

All current organic slices use exact identity
`v0.108.0|58694f64|-2044609792`. Historical observations qualify only the
protocol revision and action shape they actually exercised; they do not
silently qualify preview.9. Fresh preview.9 long runs qualify the current
entity-binding and pile-selection paths but not generated-card choice.

## Verification

- Bridge tests: 35/35.
- Re-SpireAgent tests: 95/95 plus strict typecheck and production build.
- Exact game-source audit confirms card reward alternatives can represent skip,
  reroll, sacrifice, and other relic-provided choices; their visible labels are
  semantic data, not a boolean.
- Fresh `preview.3` smoke: `reward_flow + card_reward_selection` exposed three
  visible Glam cards and a separate Skip alternative; after the documented
  short clickability settling interval, DeepSeek selected legal `Barrage`.
  Bridge confirmed `received -> validated -> started -> completed`; Re settled
  back to the outer reward screen in two polls.
- Fresh ordinary reward smoke: `Claim 12 Gold` completed and changed observed
  gold from 104 to 116. On a separate ordinary reward screen, one opaque
  `proceed_rewards` request completed as `confirmed`; the follow-up v2/auto
  read projected `map`, with no retained `reward_claim` surface or stale
  reward actions. `NMapScreen.IsOpen` is an explicit game UI witness that
  takes precedence over a retained rewards overlay during room exit.
- Fresh run-deck smoke: the restored run exposed ten per-instance starter
  cards. Selecting Glam `Barrage` increased the deck to eleven, and the next
  independent inspection preserved `GLAM`, its description, amount, and card
  instance identity.
- Fresh combat-pile smoke: the first player turn exposed draw=6, discard=0,
  exhaust=0 and matched immediate count fields. After playing Glam `Barrage`,
  discard=1 preserved that enchantment; draw/discard/exhaust counts still
  matched. The response explicitly withheld draw order.
- A restored full-belt reward screen first exposed only exact potion-discard
  actions, not the impossible Skill Potion claim. Request
  `organic-full-potion-discard-1784219982` completed and made capacity; request
  `organic-full-potion-claim-1784219999` then completed and consumed the
  reward. These are targeted organic-state lifecycle tests, not autonomous
  strategy evidence.
- Preview.9 organic runs `run-20260716165340-0v67y4` and
  `run-20260716170107-xu494w` recorded 271 decisions and 165 settled
  Bridge-authorized actions with no Bridge execution failure, unknown command
  outcome, or unsettled Bridge completion. Four pile-selection actions settled
  through exact command lifecycles. A non-empty exhaust pile was observed.
- The same runs recorded 23 fail-closed composite-read drifts during fast UI
  transitions and one correctly blocked legacy treasure stale-state decision.
  No prompt or action was produced from a mixed composite snapshot.
- Real testing found and fixed one client identity bug: volatile inspection
  `observed_at` initially made equivalent reads appear stale. Timestamps are now
  excluded from stale identity while inspection IDs, state binding, and content
  remain included.

## Current Blocker

The current blocker is breadth without dishonest generalization. Fresh
preview.9 qualification is still missing for `generated_card_choice`; linked
reward sets remain unsupported. Map, rest, shop, treasure, menu, and some deck
selection flows still use explicitly labeled v1 local reconstruction in auto
mode. Composite state-plus-inspection capture is coherent and fail-closed, but
its transition-time retry/telemetry ergonomics remain measurable client debt.

## Next Step

1. Wait for a natural preview.9 generated-card choice and qualify its exact
   select/skip lifecycle; do not manufacture organic evidence.
2. Prioritize the most frequent remaining v1 action owner from organic runs
   (map navigation is currently highest), but audit exact UI ownership and
   completion before implementing it.
3. Keep pile/hand/generated/reward/deck card selection and potion/relic flows as distinct
   protocols; do not merge them into a generic reward action.
4. Keep every unlisted executable surface fail closed until it has its own
   game-fact audit, contract tests, and organic lifecycle evidence.

See [the player-visible semantics RFC](PLAYER_VISIBLE_SEMANTICS_PROTOCOL_RFC.md)
and [the composition/inspection/diagnostics audit](COMPOSITION_INSPECTION_DIAGNOSTICS_AUDIT_2026-07-16.md).
The current organic evidence is summarized in
[the July 17 long-run audit](ORGANIC_LONG_RUN_AUDIT_2026-07-17.md).
