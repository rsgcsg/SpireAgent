# M1 Baseline Identity And Report Closeout

## Verdict

ADR-0002's A-first Semantic Gateway two-plane architecture remains the single
target. The latest run did not justify another Gateway Surface, Oracle,
permission layer or transaction abstraction. It instead exposed an A/D evidence
gap: exact Gateway/game/Modset/provider identity was recorded, but Re was only
identified as version `0.1.0`.

## Runtime Evidence

`run-20260728141035-uhrp19` belongs to loaded Preview.72 SHA
`afb0261f...140`, MVID `3e9ad83a...bdae`, runtime `14238a9e...71fd`, game
`v0.109.1|c8c577f6|-820620422` and the exact bridge-only Modset. It recorded:

- 108 decisions and `completed_run_boundary`;
- 107 `executed_and_settled` actions;
- 107 valid provider attempts and no retry;
- no stale, unsupported, invalid, observation/provider failure, unsettled or
  unknown outcome;
- 1,206,746 total user-Prompt bytes, 11,278 average and 20,269 maximum.

Provenance is `unrecorded`; Inspection was disabled. This is coverage evidence,
not Organic, strategic-quality, persistent-qualification or complete-game
evidence.

## Root Cause And Change

A Git commit alone is not exact source identity when a worktree is dirty. New
public `agent:run` invocations therefore record:

1. repository HEAD for historical location;
2. a deterministic SHA-256 over runtime-relevant Re and Operator-Shell files;
3. clean/dirty status for that source scope.

`agent:baseline-report` reads append-only local artifacts and joins this source
identity with Connector, game, Modset, policy, schema, provider, Prompt,
outcome, settlement and decision-family metrics. It never opens the Gateway,
calls a provider, writes evidence, executes an action or changes permission.
Old records remain readable and are explicitly `identityStatus=incomplete`.

## Architecture Review

Choice **B: internal evidence helper only**. No wire protocol or Gateway
authority change is justified. Moving evaluation joins into Gateway would mix
game authority with experiment interpretation; moving game identity assembly
into Re would duplicate Connector truth. The report consumes both while owning
neither.

## Acceptance And Non-Claims

- Re typecheck, tests and build must pass.
- Connector CLI and repository checks must pass.
- The latest historical run must report exactly one missing identity family:
  Re source revision/digest.
- A future public run must record the new source identity before it can become
  the frozen M1 baseline.
- Representative/held-out case separation and strategic grading remain next;
  this slice does not implement or claim either.

## Build And Deployment

All Gateway/Re tests and audits passed. Rebuilding unchanged Preview.72 source
produced a new .NET artifact identity. The game was closed, the old artifact
was backed up, and the new artifact was installed and Steam cold-loaded:

```text
built/installed/loaded SHA   debc229e7affb514ba25e3f9485cfef8235c6213623ef490934d22072d2ddeed
built/installed/loaded MVID  6d9d4adf-6c34-4401-950f-69980dc5d3d8
runtime epoch                b2332a06f756495a84936520b79cecba
rollback                     STS2MCP/.local/deployments/2026-07-28T14-31-37-745Z
```

The new runtime has exact bridge-only observation and provisional-trial
readiness. Mutation starts disabled and no prior session grant or persistent
qualification transferred. No action has yet executed under this identity.
