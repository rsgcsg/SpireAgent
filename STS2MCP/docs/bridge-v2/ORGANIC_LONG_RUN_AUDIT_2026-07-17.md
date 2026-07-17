# Bridge v2 Organic Long-Run Audit: 2026-07-17

## Scope

This audit covers the exact installed identity
`v0.108.0|58694f64|-2044609792` with Bridge protocol `2.0-preview.9` and the
strict Re-SpireAgent client. The runs used normal game UI and no gameplay
console commands. Local run artifacts are evidence but are intentionally
ignored by Git.

## Runs

| Run | Decisions | Executed and settled | Bridge-authorized settled | Local-reconstructed settled | Composite read drift | Other safe block |
|---|---:|---:|---:|---:|---:|---:|
| `run-20260716165340-0v67y4` | 118 | 86 | 75 | 11 | 10 | 0 |
| `run-20260716170107-xu494w` | 153 | 108 | 90 | 18 | 13 | 1 stale treasure decision |
| Combined | 271 | 194 | 165 | 29 | 23 | 1 |

There were no Bridge `execution_failed`, `executed_unsettled`, invalid action,
unknown command outcome, or command identity mismatch records.

## Newly Qualified Evidence

- Four `combat_pile_card_selection` actions completed across the two runs.
  Each was a discard-pile single-pick choice, state-bound to an exact card
  entity, and completed through `received -> validated -> started -> completed`.
- Combat-pile inspection observed non-empty draw, discard, and exhaust piles
  while still declaring draw order hidden.
- Existing deck-enchant, event, combat-turn, card-reward, reward-claim, and
  inspection contracts continued to operate under preview.9 entity bindings.

Separate targeted organic-state evidence qualified full-belt potion capacity:
`organic-full-potion-discard-1784219982` removed an exact visible potion and
made capacity; `organic-full-potion-claim-1784219999` then claimed the visible
Skill Potion. This proves the command lifecycle, not strategic selection
quality.

## Generated Card Choice

Historical run `run-20260716164019-u5iyl4`, decision 21, organically showed a
Skill Potion opening a temporary three-card choice. Exact source identifies
`NChooseACardSelectionScreen`, including a 350 ms opening guard, skip, peek,
and overlay-close lifecycle. Preview.9 now has a dedicated
`generated_card_choice` contract and fixture tests. Neither current long run
naturally reproduced it, so current organic qualification remains pending.

## Fail-Closed Observation Drift

Twenty-three ticks were rejected because the game changed while Re-SpireAgent
captured state plus fixed read-only inspections. Most occurred during combat or
room-opening transitions; several carried explicit `run_deck stale_state`.
These records contain no prompt and no execution. The next tick acquired a
fresh state and continued.

This is safe but noisy. The correct future improvement is bounded, observable
composite-read retry or a server-issued coherent observation token. Silently
dropping inspections, accepting mixed states, or reusing an action from the
first read is forbidden.

## Remaining Coverage Debt

- Map, shop, rest, treasure, menu, and generic run-deck card selection still
  execute through explicitly labeled v1 local reconstruction in auto mode.
- One character-selection action changed UI-internal selection without a
  normalized-state witness and was recorded unsettled. This is legacy menu
  lifecycle debt, not a Bridge v2 command failure.
- One treasure action became stale while the model deliberated and was safely
  not executed. A future v2 treasure contract should expose exact controls and
  completion rather than weakening the stale guard.
- Linked reward sets and unobserved selector variants remain fail closed.
- Generated-card choice still needs a fresh preview.9 organic select or skip.

## Architecture Verdict

The Context + one Active Surface + Authority + fixed Inspection model remains
healthy. The strongest evidence is not action volume but that newly observed
interactions forced narrower protocols without compromising old ones. The main
engineering risks are incomplete v2 breadth, transition-time composite-read
noise, and continued dependence on v1 local reconstruction outside qualified
surfaces. A universal card selector or arbitrary inspection API would make the
architecture less honest, not more complete.
