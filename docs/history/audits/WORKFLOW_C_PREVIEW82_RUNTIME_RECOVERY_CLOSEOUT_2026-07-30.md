# Workflow C Preview.82 Runtime Recovery Closeout

Status: source, tests and Release build verified. Installation and loaded
identity are recorded separately below. Map-annotation mutation remains
`pending exact-runtime evidence`.

## Scope

Preview.82 closes two failures reproduced on the exact loaded Preview.81
runtime without changing Prompt/guide policy:

1. Gateway `rejected/not_applied/stale_state` receipts were recorded by Re as
   fatal `execution_failed`, even though the native action had not executed.
2. The native map annotation input could remain the active player input owner,
   but `map_navigation` published no legal way to leave that mode.

The batch is intentionally small across two layers. Its shared root cause is
incorrect handling of a current native input transition, not missing game
strategy:

```text
Gateway current owner / exact receipt
-> strict Re projection and supervision
-> fresh observation
```

No permission mode, wildcard admission, Surface, Re legality rule or durable
claim path was added.

## Exact Baseline

```text
repository branch/HEAD  develop / 83d80c2fd795b6a4e46531ea48699806ecc2c292
loaded protocol         2.0-preview.81
loaded SHA              411f8cf5f113e4d39db9d95fb6a5b625aae97eaf00c4ab9c0f3cdf93413637b1
loaded MVID             c09e8569-19af-4a34-b98b-49339300304b
runtime                 4955bd9ec2da426084ea7cff1cc0ae04
game                    v0.109.1 / c8c577f6 / -820620422
Modset                  exact_bridge_only
Patch                   clean_known_owners
permission              migration_exploration / provisional_trial_scoped
persistent claim        empty
Prompt/guide            4 / 5
Re schema               31
```

The run metadata reports `provenance=unrecorded`. These runs are exact loaded
runtime coverage and defect evidence, not Organic qualification or durable
authority.

## Latest Run Audit

| Run | Facts | Attribution |
|---|---|---|
| `run-20260730074240-h09vpq` | 188 decisions; 185 settled, one stale refusal and two non-actionable observations; complete game boundary and return to main menu | broad exact Preview.81 journey coverage |
| `run-20260730080025-oaxily` | eight stable map observations with `drawing_mode=drawing`, no route options | Gateway coverage gap: native annotation input remained owner |
| `run-20260730080059-vf7ui2` | same persistent drawing-mode boundary | confirms the gap is not transient settling |
| `run-20260730080113-tsnmie` | 31 settled decisions, then provider `finish_reason=length` | A/provider output boundary; no Gateway mutation defect |
| `run-20260730080335-w4fitw` | 49 decisions; complete game boundary with safe stale observations | expected state-bound refusal behavior |
| `run-20260730080848-p8byv8` | terminal Re `execution_failed`; Gateway receipt was `rejected/not_applied/stale_state` | Re supervision defect; no native mutation |
| `run-20260730080929-nbos1d` | same two-decision terminal mismatch | confirms the Re defect |
| `run-20260730080950-qzuchn` | 48 recorded decisions, 36 settled, 11 stale; no summary because the process was stopped after a settled combat action | human termination, not a typed Connector terminal |

The exact local records remain under `Re-SpireAgent/data/runs/` and are not
committed. Kifuda and New Leaf did not occur in these journeys: `not
exercised`.

## Source And Architecture Decision

Verdict remains **B**: retain the Semantic Gateway two-plane architecture and
repair the local contracts. The evidence does not support a new top-level
architecture.

The v0.109.1 assembly shows that `NMapScreen._drawingInput` owns the active
annotation input and that the native map control exits through
`NMapDrawingInput.StopDrawing()`. Preview.82 therefore:

- retains `map_navigation` as the active semantic Surface;
- adds source-audited `exit_map_annotation`;
- binds publication to the exact live `_drawingInput` and drawing mode;
- binds the wire action to the visible map screen while keeping the private
  input instance inside the opaque state-bound action;
- revalidates screen, input identity, mode and input readiness at execution;
- calls only native `StopDrawing()`;
- completes only after annotation mode becomes `none` or the map owner leaves.

Route choice and annotation exit share visible map observation mechanics, but
retain different source, operands, Commit and Outcome partitions. This is not
a universal selector or a second map rules engine.

For command supervision, an exact Gateway
`rejected/not_applied/stale_state` is now recorded as
`not_executed_stale_state`. Re does not retry the old action; the next tick
must obtain a fresh observation. Unknown, timeout and transport-uncertain
outcomes remain terminal and non-retryable.

## Contract And Migration Result

```text
protocol                              2.0-preview.82
Re normalized schema                  31
explicit native contracts             50
manifest session fallbacks            38
supported mixed explicit/fallback      0
durable fallback claim admission       0
production publication paths           1
production authority resolvers         1
```

`exit_map_annotation` is an explicit native contract with source-audited
status. Its source tests and build do not grant session or persistent
authority in a new environment. The loaded P81 evidence is negative evidence
for the missing operation, not a P82 mutation canary.

## Verification

Completed before installation:

```text
Re targeted tests              142 passed
Re full check                  215 tests, typecheck and production build passed
Gateway exact-game tests       204 passed
Gateway Release build          succeeded, zero warnings/errors
operation binding audit        _drawingInput, DrawingMode and StopDrawing matched v0.109.1
built SHA                      f5f4791091f0480432d2c30ce3bd8f946049380fde0ab02053692285c4ee3b4c
built MVID                     1e12b8d5-ebcc-4bf1-a4bc-a9b768cdcc0f
installed SHA                  f5f4791091f0480432d2c30ce3bd8f946049380fde0ab02053692285c4ee3b4c
installed MVID                 1e12b8d5-ebcc-4bf1-a4bc-a9b768cdcc0f
loaded identity                non-claim; game closed after installation
rollback                       STS2MCP/.local/deployments/2026-07-30T08-38-44-247Z
```

The final repository checks and installation identity are recorded in current
status after deployment.

## Evidence Boundary And Rollback

- P81 complete journeys remain exact-runtime predecessor coverage.
- P82 map annotation exit is `pending exact-runtime evidence`.
- P82 stale rejection recovery is fixture/test verified; a natural P82 stale
  receipt remains runtime evidence debt.
- No Kifuda or New Leaf evidence was obtained.
- No persistent qualification or durable claim was created.
- Rollback is whole-artifact restoration from the timestamped deployment
  snapshot recorded in current status.
