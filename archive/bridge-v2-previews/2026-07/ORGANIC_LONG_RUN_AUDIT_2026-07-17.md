# Bridge v2 Organic Long-Run Audit: 2026-07-17

## Scope

All evidence is scoped to exact installed identity
`v0.108.0|58694f64|-2044609792`. Original runs used preview.9; appended organic
evidence covers preview.12 and preview.13. Runs used normal UI and no gameplay
console commands. Local artifacts remain ignored by Git.

## Preview.9 Baseline

| Run | Decisions | Settled | Bridge settled | Local settled | Composite drift | Other safe block |
|---|---:|---:|---:|---:|---:|---:|
| `run-20260716165340-0v67y4` | 118 | 86 | 75 | 11 | 10 | 0 |
| `run-20260716170107-xu494w` | 153 | 108 | 90 | 18 | 13 | 1 stale treasure decision |
| Combined | 271 | 194 | 165 | 29 | 23 | 1 |

There were no Bridge execution failures, unknown command outcomes, or command
identity mismatches. Four discard-pile single-pick actions settled, and fixed
inspection observed non-empty draw/discard/exhaust while withholding draw order.

Targeted organic-state evidence also qualified full-potion capacity:
`organic-full-potion-discard-1784219982` removed the exact visible potion and
`organic-full-potion-claim-1784219999` then consumed the visible reward.

## Preview.12/13 Evidence

- `run-20260716180850-gjv1lg` advanced two exact ancient dialogue lines while
  exposing only the revealed prefix, then transitioned to event options.
- `run-20260716180952-je2em3` completed 60/60 actions and naturally covered
  generated-card choice, card bundle, rewards, map, combat, and legacy rest/shop
  paths without command failure.
- `run-20260716182358-yog6qf` completed 51 actions before an ordinary run death;
  every executed action settled.
- `run-20260716182900-50gm7n` completed 71 actions before a legacy Smith confirm
  settlement stopped the runner. Its Bridge-owned Smith rest action completed
  and opened the separate deck selector.
- `run-20260717012922-la5ibg` completed the remaining Bridge-owned rest Proceed
  action and reached the exact map coordinate.

The dedicated generated-card contract is therefore organically qualified for
the observed temporary-card shape. Card bundle, ancient dialogue, repeated map
travel, and rest controls are also organically qualified for their observed
shapes. None of those statements generalizes to every mode or origin.

## Fail-Closed Findings

- Composite state-plus-inspection drift remains visible and non-executing. A
  rejected mixed snapshot never reaches prompt or action selection.
- The strict Re decoder initially omitted root `screen_entity_id` values from
  visible binding identity. This rejected a valid rest Proceed before execution.
  Preview.13 now recognizes explicit `entity_id`/`*_entity_id` fields and still
  rejects absent identities.
- Character selection in the legacy menu path does not expose selected-state;
  repeated same-character actions can be recorded unsettled. This is not a v2
  command failure.
- Smith's child deck selector remains legacy local reconstruction. Its confirm
  was observed to complete in the UI while the legacy watcher recorded
  unsettled, then the Bridge rest Proceed remained safely available.

## Remaining Coverage Debt

- Shop, treasure, menu/game-over, and generic deck maintenance remain v1 local
  reconstruction.
- Shared HUD/run and hover keyword semantics are not uniformly first-class
  Bridge facts on every non-combat surface.
- Linked reward sets and unobserved selector variants remain fail closed.
- Composite read retry is safe but noisy during fast transitions.

## Architecture Verdict

Context + exactly one Active Surface + Authority + fixed Inspection remains the
right base model. New evidence forced narrower protocols and action-specific
completion rather than a universal selector. The main risks are incomplete
coverage, dual v1/v2 data ownership, and overreading bounded surface
completeness as total UI completeness. A universal card selector, purchase
action, or arbitrary inspection API would make the protocol less honest.
