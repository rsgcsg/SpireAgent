# Bridge v2 Current Status

Status date: 2026-07-16

## Current Phase

Protocol `2.0-preview.3` is implemented in source. Four exact-build surfaces
have bounded organic Bridge and Re-SpireAgent lifecycle evidence. The fifth,
`reward_flow + reward_claim`, has bounded organic Bridge command-lifecycle
evidence for ordinary claims and Proceed/Skip; it is not yet a full
Re-SpireAgent model-decision lifecycle qualification.

## Implemented

- Independent typed `context`, active `surface`, and client action authority.
- `ActiveSurfaceResolver`: the top blocking overlay exclusively selects the
  overlay provider family; otherwise room/turn providers are considered.
  Multiple matches in the active family fail closed.
- Typed diagnostics with separate severity, operational effect, recovery hint,
  optional path/visibility class, and action-critical status. Legacy warnings
  remain compatibility text and do not independently grant or remove authority.
- A disabled inspection contract. It is state-bound, excludes arbitrary
  queries and hidden visibility, advertises no implemented kinds, has no read
  endpoint, and does not enter the command ledger.
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
- Re-SpireAgent strict `preview.3` decode, projection, diagnostics checks,
  disabled-inspection checks, allowed-action import, prompt guides, and tests.

## Qualification Matrix

| Surface | Exact source/build | Contract/fixture | Organic Bridge | Organic Re lifecycle |
|---|---|---|---|---|
| `deck_enchant_selection` | pass | pass | pass | pass |
| `event_option` | pass | pass | pass | pass |
| `combat_turn` | pass | pass | pass | pass |
| `card_reward_selection` | pass | pass | pass | pass |
| `reward_claim` ordinary claim | pass | pass | pass | pass at Bridge command layer |
| `reward_claim` Proceed/Skip | pass | pass | pass | Bridge command layer; map witness prevents stale reward actions |

All current organic slices use exact identity
`v0.108.0|58694f64|-2044609792`. Historical `preview.2` observations remain
historical only and do not qualify `preview.3` behavior.

## Verification

- Bridge tests: 28/28.
- Re-SpireAgent tests: 75/75 plus strict typecheck and production build.
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

## Current Blocker

The ordinary outer-reward Bridge contract is runtime-qualified only for the
observed claim and Proceed/Skip shapes. Linked reward sets deliberately remain
unsupported; their visible choice semantics must not be omitted. A full
Re-SpireAgent lifecycle for outer rewards remains a separate, optional bounded
smoke rather than an inference from direct Bridge command evidence.

## Next Step

1. If outer rewards need Re-level qualification, run one bounded model-selected
   ordinary reward lifecycle and verify the recorded prompt, response,
   state-bound action, and settlement.
2. Keep card-selection, reward claim, and future potion/relic flows as distinct
   protocols; do not merge them into a generic reward action.
3. Keep inspection disabled and every unlisted surface fail closed until it has
   its own game-fact audit, contract tests, and organic lifecycle evidence.

See [the player-visible semantics RFC](PLAYER_VISIBLE_SEMANTICS_PROTOCOL_RFC.md)
and [the composition/inspection/diagnostics audit](COMPOSITION_INSPECTION_DIAGNOSTICS_AUDIT_2026-07-16.md).
