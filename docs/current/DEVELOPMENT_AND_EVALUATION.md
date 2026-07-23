# Internal Development And Evaluation

This document owns the current scope and maturity of the internal D lane. D is
a formal engineering workstream because evidence, replay, scenarios, and
evaluation have correctness criteria distinct from both the Gateway and the
Agent. It is not a public platform, SDK, marketplace, or qualification
authority.

## Ownership Boundary

| D owns | D must not own |
|---|---|
| contract conformance and negative fixtures | game truth or player-visible policy |
| scenario definitions and evidence provenance | Gateway action permission |
| replay readers and assertions | native commit or semantic completion |
| experiment definitions and repeatability | Agent strategy or Prompt policy |
| graders and regression reports | product control leases or secrets |
| developer inspect/diagnostic workflows | automatic canary or qualification grants |

The Gateway produces authoritative observations, actions, and command outcomes.
The A lane produces model decisions. D records, compares, and evaluates them
without becoming either authority.

## Current Capability Inventory

### Implemented

- Re typecheck, unit tests, and production build.
- Gateway C# unit tests and an exact-game Release build procedure.
- Active Markdown-link and Connector-operation-inventory checks.
- Strict read-only `agent:inspect`.
- Operator-selected `agent:connector-canary` using the production execution
  path rather than a diagnostic bypass.
- Append-only local run metadata, state, Prompt, provider, execution,
  settlement, and provenance records.
- Record inspection through `agent:replay`.
- Read-only Prompt size/duplication audit.
- Bounded non-executing full/shadow provider comparison and within-variant
  repeat baseline.

### Partial Or Misleading If Overclaimed

- `agent:replay` reads and prints stored records; it is not deterministic
  re-execution or a semantic assertion runner.
- Current fixtures primarily protect decoding and local behavior; they are not
  a versioned gameplay scenario corpus.
- Prompt comparisons cover selected recorded decisions; they are not a general
  eval suite or proof of strategic quality.
- Evidence provenance is recorded, but no central eligibility engine turns it
  into qualification.
- Local check commands exist, but the repository currently has no GitHub
  Actions workflow. A commit therefore has no automatic repository-wide check
  result unless an external system supplies one.
- Gateway tests and Release builds depend on local proprietary game
  assemblies. Passing Re-only checks cannot stand in for them.

### Missing

- A versioned `ScenarioCase` manifest with environment, input evidence, expected
  invariants, and applicability.
- A replay assertion runner that separates record readability, contract
  conformance, Agent output evaluation, and execution evidence.
- Grader definitions with versions, limitations, counterexamples, and held-out
  splits.
- One machine-readable report joining Connector, Agent, provider, Prompt, and
  outcome provenance.
- Differential regression across protocol/schema versions.
- Automated offline CI for checks that do not require proprietary game
  assemblies.
- Redacted evidence export and retention rules suitable for product support or
  external research.

## D-Lane Delivery Sequence

### D0: Inventory And Honest Naming

**Status:** complete as documentation only.

Existing commands are classified as inspect, canary, record reader, audit, or
comparison. None is called a qualification engine or general eval platform.

### D1: Offline Check Baseline

**Entry:** current repository.

**Deliverables:**

1. A public CI workflow for Re check, active-doc checks, Connector inventory,
   and Python syntax checks.
2. An explicit local-only Gateway test/build requirement where game assemblies
   cannot legally or practically run in hosted CI.
3. A machine-readable summary that identifies which checks did and did not run.

**Exit:** every commit can show an automatic offline result without implying
loaded-game or Organic qualification.

### D2: Scenario And Evidence Contract

**Entry:** D1 and stable current record reading.

**Deliverables:**

- typed scenario manifest;
- sanitized positive and negative fixtures;
- exact schema/protocol/applicability metadata;
- explicit `fixture`, `recorded`, `operator-positioned`, and `organic` evidence
  roles;
- replay assertions that never execute game actions.

**Exit:** a scenario can be rerun or declared inapplicable without silently
changing expected behavior.

### D3: Evaluation And Regression

**Entry:** D2 plus representative Gate 1/2 scenarios.

**Deliverables:**

- solver-independent scenario inputs;
- Agent/provider configuration as a separate evaluated implementation;
- deterministic contract graders and explicitly limited model/human graders;
- baseline, candidate, counterexample, and held-out reports;
- cost, latency, validity, action-distribution, and semantic regression views.

**Exit:** an Agent or Prompt change can be compared against a frozen baseline
without treating action agreement as strategic truth.

### D4: Developer Surface Or SDK Decision

**Entry:** stable official Agent path plus a second real consumer.

Only here decide whether generated client types, an Agent Runtime Contract, or
an out-of-process SDK reduces actual duplication. D1-D3 do not require a public
platform product.

## Near-Term Priority

D must not displace the current Gate 2 connector work. Its next small
implementation slice should be D1 offline CI because it makes existing checks
visible and repeatable without changing runtime behavior. The next data-model
slice should be D2 only after the team chooses concrete representative
fixtures from the closed Gate 1 evidence and new Gate 2 ambiguities.

No D artifact grants live permission, canary status, qualification, stable
learning, or product readiness.
