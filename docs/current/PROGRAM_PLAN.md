# Current Program Plan

This document defines the cross-component dependency order for the rebuilt
SpireAgent. It does not replace:

- [Status](STATUS.md), which owns the current gate, blocker, and next action;
- [Roadmap](ROADMAP.md), which owns Connector and product functional gates;
- component-owned protocol, permission, coverage, and runtime evidence.

Future capability is an architecture pressure test, not permission to divert
the current mainline or claim an unimplemented platform.

## Program Outcome

The Connector destination is fixed by
[ADR-0002](decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md).
Program lanes consume that architecture; they may not introduce a competing
game-state, transaction, permission, or completion authority.

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
registry, general eval runner, or qualification engine. Public offline CI now
exists, and one exact combat-pile static scenario plus deterministic grader is
the first narrow D2 slice; it is not a general corpus. See
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

Owns the future Companion, product authentication where justified, secret
brokerage, recovery, diagnostics, Workshop/Companion distribution, and
player-facing lifecycle. Gateway-owned local controller coordination and
runtime epoch are Connector responsibilities; the Companion may manage their
lifecycle but cannot be their sole enforcement point.

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

1. Preserve the final Preview.69 exact-runtime evidence boundary: the completed
   127-decision saved-run journey proves the run-mount repair and bounded
   one-game supervision, but its unrecorded provenance and session-only grants
   do not establish Organic or persistent qualification. Investigate measured
   stale-selection and long-settlement behavior without weakening the safety
   kernel.
2. Continue C through the ADR-0003 migration order: exact runtime source/
   adapter/outcome shadows, continuation boundaries, identity separation, then
   hot-summary/on-demand evidence.
3. Maintain the closed Gate 1 v1-retirement inventory and keep unsupported
   variants explicitly typed and fail closed.
4. Advance D only for concrete C/A evidence needs. D may compare, grade and
   recommend, but remains non-authorizing and outside model strategy input.
5. Keep A's complete evidence record while evaluating only bounded, paired
   DecisionProjection experiments; do not revive the failed generic compact
   projection or add persistent learning.
6. Keep P, H and T behind their existing admission gates. Do not build an
   Artifact Router without a demonstrated ABI/load split.

Preview.69's prior loaded MVID completed broad real-runtime session trials. The
final built/installed/loaded MVID then completed a saved-run-to-menu lifecycle
under a fresh runtime epoch. Neither identity is generic cross-version or
cross-Mod qualification, and no session trial was promoted to a persistent
claim.

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
3. Implement and qualify the smallest local coordination alpha: open read-only
   observers, one mutation-controller lease, runtime epoch and command
   attribution. Do not turn it into an account-security framework.
4. Establish an A-lane frozen Agent baseline over held-out scenarios before
   changing context, memory, or orchestration.
5. Reassess whether a general Agent Runtime Contract has a second real
   consumer. Do not create a public SDK from speculation alone.

### After Coordinated Connector And Evaluation Baselines

Entry evidence:

- one-writer local coordination and restart invalidation are tested;
- authenticated discovery remains optional until a product threat model proves
  it necessary;
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
