# Current Program Plan

This document owns the rebuilt project's user-outcome milestones and cross-track
dependency order. It does not replace:

- [Status](STATUS.md), which owns the current artifact, evidence and next action;
- [Roadmap](ROADMAP.md), which owns technical readiness tracks;
- component protocol, permission, coverage and runtime-evidence documents.

The detailed rationale is in the
[A-primary workflow and program correction audit](audits/A_PRIMARY_WORKFLOW_AND_PROGRAM_CORRECTION_AUDIT_2026-07-28.md).

## Program Verdict

SpireAgent's primary value flow is the external Agent in `Re-SpireAgent/`.
The Agent should make trustworthy decisions in real STS2, complete bounded
runs, be independently evaluated, and demonstrate improvement. The Connector,
evaluation infrastructure and product shell enable and constrain that value;
they are not competing end products.

This priority does not transfer authority. ADR-0002 remains the only accepted
macro architecture: STS2 and the Gateway own game truth, legality, execution
and completion; Re chooses only advertised action IDs; D evidence never grants
authority; product tooling never bypasses the Gateway.
[ADR-0006](decisions/ADR-0006-explicit-native-contract-and-durable-authority-convergence.md)
is the current C authority refinement: only explicit native contracts may
enter durable qualification, while manifest fallbacks remain volatile trials.

## Program Milestones

| Milestone | Outcome | Status |
|---|---|---|
| M0 | Trustworthy Live Interface Baseline | bounded closed |
| M1 | Measurable External Agent Baseline | **current** |
| M2 | Demonstrated Agent Capability Improvement | gated by M1 |
| M3 | Player-Controlled Agent Alpha | future product milestone |
| M4 | Guarded Improvement And Sustainable Beta | future |

These milestones answer what user-visible result exists. The functional Gates
in [Roadmap](ROADMAP.md) remain technical readiness checklists and historical
evidence boundaries; they no longer form a second top-level product sequence.

## Readiness Tracks

### A: External Agent Value Track

**Status:** active; primary M1 value track.

Owns Re's evidence consumption, model-facing views, Prompt and provider
configuration, action-ID choice, runtime supervision, run records and future
capability candidates. The current RE-P1 path is the frozen live baseline, not
the permanent limit of Agent architecture.

A may run offline, replay, paired and shadow experiments during M1. It must not
define game facts, reconstruct strict-v2 legality, execute native actions,
declare completion, self-qualify a candidate or write stable learning.

### C: Trustworthy Game Interface Track

**Status:** current closure priority; bounded Gate 1 baseline closed.

Owns the Semantic Gateway, Connector Contract, exact environment identity,
player-visible facts, current input owner, opaque action publication,
execute-time validation, native Commit, action-local outcome, Inspection and
v1 retirement.

C currently executes the
[Clean Closure contract](audits/WORKFLOW_C_CLEAN_CLOSURE_AUDIT_AND_EXECUTION_CONTRACT_2026-07-29.md)
before additional A/D/P feature expansion. It closes ordinary vanilla decision
truth and Inspection, removes permanent migration scaffolding, migrates
supported families to exact native contracts, validates update/claim recovery,
and then returns C to maintenance. A baseline records remain valid evidence,
but new A capability work does not outrank an unclosed Connector authority or
fact boundary.

### D: Independent Development And Evaluation Track

**Status:** active; required for M1 and independent of A self-evaluation.

Owns conformance and negative fixtures, scenario/evidence contracts, replay
assertions, representative and held-out splits, graders, experiment reports,
counterexamples, cost/latency views and developer diagnostics. D evaluates both
C correctness and A capability. It is not a public SDK, game-rule engine or
Gateway permission authority.

### P: Player Operation And Product Track

**Status:** minimum local-control and operator baseline exists; product work is
gated until M3.

Owns future player setup, secrets, pause/takeover, recovery, diagnostics,
Companion lifecycle, install/update/rollback and distribution. Gateway-owned
controller lease and runtime epoch remain C correctness mechanisms. P does not
create Agent capability or mutation authority.

### X: Optional Research Tracks

**Status:** admission-gated, not current delivery.

Headless and post-training are optional. They require independent semantic,
dataset and held-out evidence and inherit no Live permission.

## M0: Trustworthy Live Interface Baseline

**Status:** bounded closed.

M0 includes source-truth repair, one current v2 contract, v1 mutation
retirement, exact loaded identity, coherent observation, opaque state-bound
actions, execute-time revalidation, native Commit, semantic outcome and a
bounded ordinary-single-player one-game loop.

M0 does not claim complete game/Mod coverage, complete visible information,
persistent qualification, strategic quality or product readiness.

## M1: Measurable External Agent Baseline

**Status:** current.

### Current Evidence

Preview.78 is the current source contract with Re schema 31. Its loaded
Preview.77 predecessor supplied a 94-decision completed boundary with 91
settled mutations and two safe stale refusals. New Leaf, Kifuda and CombatPile
were not exercised in that run. Provenance is `unrecorded`; this is runtime
defect/coverage evidence, not Preview.78 load, Organic evidence or persistent
qualification. Preview.78 moves six ordinary combat/shop operations to
explicit contracts and is built/installed pending cold-load evidence.

### Delivery Order

1. Capture and freeze an A baseline identity: Re revision/source digest,
   Prompt/config/provider,
   Connector protocol/schema and exact environment provenance.
2. Use the implemented non-authorizing `agent:baseline-report`, then define the
   minimum versioned representative/held-out D split.
3. Report run completion, stop reason, invalid/stale/unknown outcomes, provider
   failures, latency, cost, Prompt bytes and decision-family coverage.
4. Resume A candidate evaluation after C Clean Closure has one production
   authority path, no permanent shadow/dual-read, a closed ordinary support
   envelope, core Inspection, family dispositions and repeated exact journeys.
5. Keep P at the existing minimum controller/startup/recovery boundary.
6. Evaluate one low-risk, scope-specific A candidate through
   offline/replay -> paired -> counterexample -> held-out -> shadow. Preserve
   the frozen live baseline until explicit evidence-based admission.

The current Prompt is still full normalized evidence. The latest run's 107
model calls carried 1,206,746 user-Prompt bytes, averaging 11,278 and peaking
at 20,269 bytes. This justifies a measured projection experiment; it does
not by itself justify changing the runtime Prompt.

### Exit Criteria

M1 exits only when:

- the exact A baseline configuration and evidence provenance are reproducible;
- representative and held-out scenarios are separated and versioned;
- one report exposes correctness, run, provider, cost and Prompt metrics;
- at least one A candidate is honestly accepted or rejected against baseline,
  counterexamples and held-out evidence;
- C blockers and unsupported scope are attributable rather than silently
  reconstructed by Re;
- no stable memory, learning or automatic self-promotion is enabled.

## M2: Demonstrated Agent Capability Improvement

M2 may compare scope-specific DecisionProjection, bounded Inspection policy,
planning/critique, read-only retrieval, provider and budget candidates. A change
counts as improvement only when held-out decision/run quality, risk calibration,
cost and rollback evidence support it. Classifier prose, reason length, action
agreement and module count are not strategic truth.

Stable live behavior remains frozen while candidates pass offline, replay,
paired, counterexample, held-out and bounded shadow review. Any live admission
is explicit and rollbackable.

## M3: Player-Controlled Agent Alpha

M3 delivers an already evaluated A through the smallest justified Companion:
secret brokerage, lifecycle, pause/takeover, recovery, diagnostics and private
distribution. It does not move game truth, action authority or completion out
of the Gateway and does not imply a public SDK or plugin marketplace.

## M4: Guarded Improvement And Sustainable Beta

Persistent memory or learning requires proposal, independent evaluation,
counterexample, activation, provenance and rollback contracts. Workshop,
third-party Agent SDK, plugins and ecosystem work require separate evidence,
isolation and at least one second real consumer.

## Cross-Cutting Invariants

- Game truth, current observation, complete evidence, model projection, run
  history, memory, external knowledge and action authority remain distinct.
- The complete evidence record is retained even when a compact or tool-driven
  model view is evaluated.
- Inspection/detail requests are bounded, player-visible, read-only,
  state-bound where necessary and non-authorizing.
- Fixture, recorded runtime, canary, Organic and qualification evidence keep
  distinct exact-environment provenance.
- No model, memory, D artifact, SDK, Companion, MCP adapter or Headless host may
  invent a game action or declare native completion.
- Unknown mutation is never automatically retried.

## Success Metrics

Top-level metrics are outcome-shaped:

- A: reproducible bounded-run completion, decision quality on representative
  and held-out cases, invalid output, provider failure, latency/cost and
  candidate regression/rollback.
- C: current-decision coverage, visible-information completeness, action
  publication precision, stale rejection/recovery, coherent successor,
  unsupported/unknown classification and update recovery time.
- D: scenario repeatability, held-out integrity, replay assertions, grader
  versioning, counterexample coverage and report provenance.
- P: setup, one-controller correctness, pause/takeover/recovery, secret
  handling, install/update/rollback and player-visible diagnostics.

Operation count, qualification count, contract count, Prompt length, class
count, one lucky win, one canary, build-only success or loaded-without-action
are not top-level success metrics.

## Change Discipline

When milestone or track status changes, update:

- `STATUS.md` for current facts and next action;
- `ROADMAP.md` for technical readiness;
- this file for user-outcome milestones and dependencies;
- `DEVELOPMENT_AND_EVALUATION.md` for D capability/evidence changes;
- the owning component protocol/coverage documents when runtime semantics
  change;
- evidence documents when current-runtime claims change.

Future capability remains an architecture pressure test. It is not permission
to build a framework before a current evidenced need exists.
