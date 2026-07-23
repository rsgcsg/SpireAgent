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
3. Re runtime correctness, replayability, and evaluation quality.
4. Secure player control, recovery, and distribution.
5. Demonstrated Agent improvement under fixed baselines and guarded changes.

## Program Lanes

### C: Connector And Observation Platform

**Status:** active; current delivery priority.

Owns the Gateway, Connector Contract, exact environment identity,
player-visible facts, action authority, execution validation, semantic
completion, Inspection, operation coverage, and v1 retirement.

It must not absorb Prompt, memory, provider, learning, or external strategy
concepts.

### R: Agent Runtime And Evaluation

**Status:** active only where it directly supports Re or Connector evidence.

Owns Re-SpireAgent, complete normalized evidence, consumer-specific views,
model invocation, run records, replay, conformance, experiment hygiene, and
future memory or learning experiments.

Development tooling and the official Agent remain one lane until a second real
consumer proves that a separate Agent SDK or general development platform
reduces duplication. Existing inspect, canary, replay, and Prompt-audit tools
are useful capabilities, not proof that a platform product exists.

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

1. Continue Gate 1 exact-identity journeys and close real operation-level
   unsupported or fail-closed gaps.
2. Maintain a structured visible-information and v1-retirement inventory while
   those journeys expose real gaps.
3. Keep R-lane work limited to conformance, records, replay, diagnostics, and
   falsifiable read-only experiments that support C.
4. Design P-lane authentication, controller lease, and restart-epoch contracts
   without changing current permissions.
5. Keep H and T disabled beyond admission/data-governance documentation.

### After Representative Gate 1 Reliability

Entry evidence:

- multiple representative ordinary journeys under exact identities;
- action publication, submission, settlement, and successor-state evidence;
- no silent v1 fallback;
- known unsupported operations fail closed and are inventoried.

Then:

1. Advance Gate 2 visibility closure and fact-availability semantics from
   concrete ambiguities.
2. Strengthen cross-language conformance, scenario corpus, replay, graders, and
   experiment repeatability.
3. Implement the smallest secure local Connector alpha: authentication,
   observer/controller roles, one-controller lease, runtime epoch, and typed
   recovery.
4. Reassess whether a separate Agent Runtime Contract has a second real
   consumer. Do not create an SDK from speculation alone.

### After Secure Connector And Evaluation Baselines

Entry evidence:

- secure local control and restart recovery are tested;
- visibility gaps are bounded and reported honestly;
- comparable baseline/shadow experiments and held-out scenarios exist;
- Re can replay exact evidence and explain model input provenance.

Then:

1. Build the smallest Companion around the official Re runtime and model
   broker.
2. Experiment with read-only retrieval or memory behind frozen baselines.
3. Introduce typed, bounded information requests only if eager complete
   evidence has a measured cost or coherence failure.
4. Consider an out-of-process Agent SDK only after the official path is stable
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
- the owning component protocol or architecture document;
- evidence and coverage documents when runtime claims change.

The detailed reasoning and rejected alternatives are recorded in the
[future program and consumer architecture audit](audits/FUTURE_PROGRAM_AND_CONSUMER_ARCHITECTURE_AUDIT_2026-07-23.md).

