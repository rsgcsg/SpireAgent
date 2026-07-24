# Current Program Plan

This document defines the cross-component dependency order for the rebuilt
SpireAgent. It does not replace:

- [Status](STATUS.md), which owns the current gate, blocker, and next action;
- [Roadmap](ROADMAP.md), which owns Connector and product functional gates;
- component-owned protocol, permission, coverage, and runtime evidence.

Future capability is an architecture pressure test, not permission to divert
the current mainline or claim an unimplemented platform.

## Program Outcome

The long-term system should let an external Agent consume trustworthy
player-visible STS2 state, choose only Gateway-advertised actions, preserve
complete evidence, and evolve its model-facing views, memory, evaluation, and
learning methods without moving game truth or action authority out of the
Gateway.

Success is measured in this order:

1. Connector reliability and honest operation coverage.
2. Player-visible information completeness and provenance.
3. Evidence integrity, replayability, and evaluation repeatability.
4. Official Agent runtime correctness under a frozen baseline.
5. Secure player control, recovery, and distribution.
6. Demonstrated Agent improvement under guarded, reversible changes.

## Program Lanes

### C: Connector And Observation Platform

**Status:** active; current delivery priority.

Owns the Gateway, Connector Contract, exact environment identity,
player-visible facts, action authority, execution validation, semantic
completion, Inspection, operation coverage, and v1 retirement.

It must not absorb Prompt, memory, provider, learning, or external strategy
concepts.

### D: Internal Development And Evaluation Infrastructure

**Status:** active, internal, and subordinate to current Connector needs.

Owns conformance checks, scenario and negative fixtures, evidence records,
replay and inspection tooling, experiment definitions, graders, regression
reporting, and developer diagnostics. These have independent data-quality and
repeatability criteria; they are not incidental Agent features.

This is not a public platform, marketplace, Agent SDK, or second game-rule
engine. Its current implementation is partial: inspect, canary, records,
replay-printing, Prompt audit/comparison, tests, and inventory checks exist,
but there is no versioned scenario corpus, unified eval runner, grader
registry, public CI workflow, or qualification engine. See
[Development and evaluation](DEVELOPMENT_AND_EVALUATION.md).

### A: Official External Agent Runtime

**Status:** active as the frozen RE-P1 baseline; learning remains disabled.

Owns Re-SpireAgent's normalized evidence consumption, consumer views, Prompt
construction, provider invocation, action-ID choice, bounded runtime
orchestration, and future memory or learning experiments.

The Agent is already a distinct external runtime, so its ownership should not
wait for a second consumer. What remains gated is freezing a general Agent
Runtime Contract or public SDK. D evaluates A; A must not define its own game
truth, execution legality, semantic completion, or evidence qualification.

### P: Secure Product And Distribution

**Status:** architecture and threat-model work only; implementation is gated.

Owns the future Companion, authentication, controller lease, runtime epoch,
secret brokerage, recovery, diagnostics, Workshop/Companion distribution, and
player-facing lifecycle. Security contract design may proceed before all
Connector coverage is complete, but consumer rollout cannot.

### X: Research Incubators

**Status:** not active delivery lanes.

- **H, Headless:** starts only after its independent admission gate. Godot
  headless execution does not prove STS2 semantic equivalence.
- **T, post-training:** may define data eligibility and evaluation constraints
  early, but dataset production and weight updates wait for trustworthy
  observation, outcome, provenance, and held-out evaluation.

Headless and post-training are optional research directions, not required
steps on the path to a usable live Agent.

## Cross-Cutting Invariants

The following are governance constraints, not a separate feature program:

- Game truth, player-visible truth, current observation, normalized evidence,
  consumer projection, run history, memory, external knowledge, and action
  authority remain distinct.
- The Connector Contract is the stable host boundary. Re's current
  `NormalizedCurrentState` is versioned evidence owned by Re, not a promise
  that its present shape is a permanent public SDK.
- A compact or tool-driven model view never replaces the complete recorded
  evidence needed for validation, replay, and debugging.
- Inspection and future detail requests are bounded, read-only, state-bound,
  auditable, and non-authorizing.
- Fixture, shadow, canary, Organic, and qualification evidence retain distinct
  meanings and exact environment provenance.
- No memory, skill, policy, model output, SDK, Companion, MCP adapter, or
  Headless host may create game actions or declare native completion.

## Dependency Order

### Current Window

1. Continue Gate 2 visible-information closure and a non-authorizing
   transaction-correlation shadow from concrete selector evidence.
2. Maintain the closed Gate 1 operation/v1-retirement inventory and keep
   unsupported variants explicitly fail closed.
3. Advance D only through concrete evidence needs: offline checks, provenance,
   replay truthfulness, scenario fixtures, diagnostics, and falsifiable
   read-only experiments.
4. Keep A at the frozen RE-P1 baseline while correcting runtime defects exposed
   by C journeys; do not add persistent learning.
5. Design P-lane authentication, controller lease, and restart-epoch contracts
   without changing current permissions.
6. Keep H and T disabled beyond admission/data-governance documentation.

### Gate 1 Exit Basis And Gate 2 Entry

Entry evidence:

- multiple representative ordinary journeys under exact identities;
- action publication, submission, settlement, and successor-state evidence;
- no silent v1 fallback;
- known unsupported operations fail closed and are inventoried.

Gate 1 closed on this bounded basis on 2026-07-24. Therefore:

1. Advance Gate 2 visibility closure and fact-availability semantics from
   concrete ambiguities.
2. Move D from ad hoc tools to a versioned scenario/evidence contract,
   cross-language conformance, replay assertions, graders, and repeatable
   experiment reports.
3. Implement the smallest secure local Connector alpha: authentication,
   observer/controller roles, one-controller lease, runtime epoch, and typed
   recovery.
4. Establish an A-lane frozen Agent baseline over held-out scenarios before
   changing context, memory, or orchestration.
5. Reassess whether a general Agent Runtime Contract has a second real
   consumer. Do not create a public SDK from speculation alone.

### After Secure Connector And Evaluation Baselines

Entry evidence:

- secure local control and restart recovery are tested;
- visibility gaps are bounded and reported honestly;
- comparable baseline/shadow experiments and held-out scenarios exist;
- Re can replay exact evidence and explain model input provenance.

Then:

1. Build the smallest Companion around the official Re runtime and model
   broker.
2. Use D to compare A against frozen held-out baselines, including
   counterexamples and rollback evidence.
3. Experiment with read-only retrieval or memory behind those baselines.
4. Introduce typed, bounded information requests only if eager complete
   evidence has a measured cost or coherence failure.
5. Consider an out-of-process Agent SDK only after the official path is stable
   and a second implementation validates the contract.

### Learning, Headless, And Post-Training Admission

- Guarded learning requires proposal, counterexample, evaluation, activation,
  and rollback contracts before any persistent influence.
- Headless requires independent host identity and differential semantic
  evidence; it inherits no live permission.
- Post-training requires eligible, decontaminated trajectories and held-out
  evaluation. Product delivery does not depend on it.

## Future-Consumer Compatibility Check

For each current observation or Re change, ask:

1. Is the authoritative game fact still owned by the Gateway?
2. Is complete evidence retained independently from the current Prompt?
3. Can a future consumer derive another view without changing action
   authority?
4. Are current observation, run history, memory, and external knowledge
   provenance distinguishable?
5. Is any extra detail typed, bounded, player-visible, state-bound, and
   read-only?
6. Does the change solve a current evidenced problem rather than a hypothetical
   platform need?

A negative answer triggers an architecture review. It does not automatically
authorize a new framework.

## Change Discipline

When a lane status or dependency changes, update:

- `STATUS.md` for current gate/blocker changes;
- `ROADMAP.md` for functional gate changes;
- this file for cross-lane dependency changes;
- `DEVELOPMENT_AND_EVALUATION.md` for D capability or evidence changes;
- the owning component protocol or architecture document;
- evidence and coverage documents when runtime claims change.

The original reasoning is recorded in the
[future program and consumer architecture audit](audits/FUTURE_PROGRAM_AND_CONSUMER_ARCHITECTURE_AUDIT_2026-07-23.md).
Its C/R/P/X lane decision is superseded by the
[program-plan second review](audits/PROGRAM_PLAN_SECOND_REVIEW_2026-07-23.md).
