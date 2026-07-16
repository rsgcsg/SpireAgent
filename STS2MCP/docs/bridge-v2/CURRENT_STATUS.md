# Bridge v2 Current Status

Status date: 2026-07-16

## Current Phase

Protocol `2.0-preview.4` is implemented in source. Four exact-build surfaces
have bounded organic Bridge and Re-SpireAgent lifecycle evidence. The fifth,
`reward_flow + reward_claim`, has bounded organic Bridge command-lifecycle
evidence for ordinary claims and Proceed/Skip. Two fixed, non-executable
inspection kinds now expose player-visible run-deck and combat-pile evidence.

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
- Re-SpireAgent strict `preview.4` decode, inspection projection, identity and
  completeness checks, allowed-action import, prompt guides, and tests.

## Qualification Matrix

| Surface | Exact source/build | Contract/fixture | Organic Bridge | Organic Re lifecycle |
|---|---|---|---|---|
| `deck_enchant_selection` | pass | pass | pass | pass |
| `event_option` | pass | pass | pass | pass |
| `combat_turn` | pass | pass | pass | pass |
| `card_reward_selection` | pass | pass | pass | pass |
| `reward_claim` ordinary claim | pass | pass | pass | pass at Bridge command layer |
| `reward_claim` Proceed/Skip | pass | pass | pass | Bridge command layer; map witness prevents stale reward actions |
| `run_deck` inspection | pass | pass | pass | pass, including Glam post-state |
| `combat_piles` inspection | pass | pass | pass | pass for non-empty draw/discard and empty exhaust |

All current organic slices use exact identity
`v0.108.0|58694f64|-2044609792`. Historical `preview.2`/`preview.3`
observations remain historical only and do not qualify `preview.4` behavior.

## Verification

- Bridge tests: 29/29.
- Re-SpireAgent tests: 78/78 plus strict typecheck and production build.
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
- Real testing found and fixed one client identity bug: volatile inspection
  `observed_at` initially made equivalent reads appear stale. Timestamps are now
  excluded from stale identity while inspection IDs, state binding, and content
  remain included.

## Current Blocker

The current inspection debt is narrowed to diversity, not protocol absence:
non-empty exhaust and unusual generated/transformed card mechanics still need
organic samples. Linked reward sets and unlisted action surfaces remain
unsupported and must not be inferred from the inspection work.

## Next Step

1. Collect non-empty exhaust and generated/transformed card examples when they
   occur naturally; do not expose hidden order or invent fixtures as organic
   evidence.
2. Keep card-selection, reward claim, and future potion/relic flows as distinct
   protocols; do not merge them into a generic reward action.
3. Keep every unlisted executable surface fail closed until it has its own
   game-fact audit, contract tests, and organic lifecycle evidence.

See [the player-visible semantics RFC](PLAYER_VISIBLE_SEMANTICS_PROTOCOL_RFC.md)
and [the composition/inspection/diagnostics audit](COMPOSITION_INSPECTION_DIAGNOSTICS_AUDIT_2026-07-16.md).
