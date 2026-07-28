# Internal Development And Evaluation

This document owns the current scope and maturity of the internal D lane. D is
a formal engineering workstream because evidence, replay, scenarios, and
evaluation have correctness criteria distinct from both the Gateway and the
Agent. It is not a public platform, SDK, marketplace, or qualification
authority.

Under the current M1 milestone, D has two independent customers: it verifies C
contract/runtime correctness and measures whether A candidates improve over a
frozen baseline. It is not subordinate to either implementation and cannot
accept A self-evaluation or C migration counts as capability evidence. See the
[program correction audit](audits/A_PRIMARY_WORKFLOW_AND_PROGRAM_CORRECTION_AUDIT_2026-07-28.md).

## Ownership Boundary

| D owns | D must not own |
|---|---|
| contract conformance and negative fixtures | game truth or player-visible policy |
| scenario definitions and evidence provenance | Gateway action permission |
| replay readers and assertions | native commit or semantic completion |
| experiment definitions and repeatability | Agent strategy or Prompt policy |
| graders and regression reports | product control leases or secrets |
| developer inspect/diagnostic workflows | final canary, session grant or qualification decisions |

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
- Read-only per-run M1 baseline report joining Re source, exact Connector/game/
  Modset identity, provider, Prompt, outcome, settlement and coverage metrics.
- Bounded non-executing full/shadow provider comparison and within-variant
  repeat baseline.
- Public offline GitHub Actions for Re, active documentation/Connector
  contracts, the compatibility grader fixtures, and Python syntax.
- One exact-game static compatibility scenario for the closed combat-pile
  family, with layered fingerprints, a Tutor negative holdout and a
  deterministic non-authorizing grader.
- A conservative Gateway runtime Harmony Patch inventory and a versioned
  non-authorizing gray-candidate policy consumed by the Gateway Permission
  Manager. D still does not issue the resulting session grant.

### Partial Or Misleading If Overclaimed

- `agent:replay` reads and prints stored records; it is not deterministic
  re-execution or a semantic assertion runner.
- Current fixtures primarily protect decoding and local behavior; they are not
  a versioned gameplay scenario corpus.
- Prompt comparisons cover selected recorded decisions; they are not a general
  eval suite or proof of strategic quality.
- Evidence provenance is recorded, but no central eligibility engine turns it
  into qualification.
- Gateway tests and Release builds depend on local proprietary game
  assemblies. Passing Re-only checks cannot stand in for them.
- The combat-pile scenario is static exact-assembly evidence. It does not
  position the game, execute a native transaction, inspect runtime Harmony
  patches, or qualify an operation.

### Missing

- A general versioned `ScenarioCase` corpus beyond the first exact static
  combat-pile manifest.
- A replay assertion runner that separates record readability, contract
  conformance, Agent output evaluation, and execution evidence.
- Grader definitions with versions, limitations, counterexamples, and held-out
  splits.
- Differential regression across protocol/schema versions.
- Automated offline CI for checks that do not require proprietary game
  assemblies.
- Redacted evidence export and retention rules suitable for product support or
  external research.
- One frozen A baseline run with the new Re source revision/content digest;
  historical runs predate that field and are explicitly identity-incomplete.
- A minimum representative/held-out split and one joined report covering run
  completion, stop reasons, validity, provider failures, latency/cost, Prompt
  bytes and decision-family coverage.

## D-Lane Delivery Sequence

### D0: Inventory And Honest Naming

**Status:** complete.

Existing commands are classified as inspect, canary, record reader, audit, or
comparison. None is called a qualification engine or general eval platform.

### D1: Offline Check Baseline

**Status:** complete for public checks that do not require proprietary game
assemblies.

**Deliverables:**

1. A public CI workflow for Re check, active-doc checks, Connector inventory,
   and Python syntax checks.
2. An explicit local-only Gateway test/build requirement where game assemblies
   cannot legally or practically run in hosted CI.
3. A machine-readable summary that identifies which checks did and did not run.

**Exit:** every commit can show an automatic offline result without implying
loaded-game or Organic qualification.

### D2: Scenario And Evidence Contract

**Status:** in progress. The exact combat-pile static scenario, deterministic
grader and six negative fixtures are the first bounded slice.

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

**Status:** in progress. The Connector has closed one operation-scoped
session-canary and auto-approval pilot, but general evaluation/regression and
permission qualification are not complete.

**Entry:** D2 plus representative Gate 1/2 scenarios.

**Deliverables:**

- solver-independent scenario inputs;
- Agent/provider configuration as a separate evaluated implementation;
- deterministic contract graders and explicitly limited model/human graders;
- baseline, candidate, counterexample, and held-out reports;
- cost, latency, validity, action-distribution, and semantic regression views.
- versioned evidence bundles and permission recommendations whose
  `authorization_effect` remains `none`;
- a Gateway-owned, exact-environment-ceiling-bound session grant canary with
  promotion, expiry, supersession and quarantine telemetry.

**Exit:** an Agent or Prompt change can be compared against a frozen baseline
without treating action agreement as strategic truth, and at least one
low-risk operation can complete the evidence-recommendation -> Gateway
session-canary -> semantic outcome -> promote/quarantine loop without D
publishing or granting an action.

### D4: Developer Surface Or SDK Decision

**Entry:** stable official Agent path plus a second real consumer.

Only here decide whether generated client types, an Agent Runtime Contract, or
an out-of-process SDK reduces actual duplication. D1-D3 do not require a public
platform product.

## Near-Term Priority

The bounded first D3 permission closeout is complete: the read-only runtime
Patch inventory, repeated real `main_menu/continue_run` session canary and
read-only recorded-evidence transition assertion are present. Permission
automation is no longer D's default next project.

The joined read-only report is implemented as `npm run agent:baseline-report`.
The M1 priority is now to capture one fresh exact-source run, freeze its
baseline manifest, and define a minimum representative/held-out split. Only then
should D compare a scope-specific Prompt/view or Inspection-policy candidate
with counterexamples. Gateway permission review remains necessary only if a
later candidate requests live mutation influence.

No D artifact grants live permission, canary status, qualification, stable
learning, or product readiness. A D artifact may recommend a candidate, but
the Gateway Permission Manager remains the sole decision point and the Gateway
execution path remains the sole enforcement point.

The report is intentionally per-run rather than a new evaluation framework.
It emits `identityStatus=incomplete` for old records missing source identity,
and always emits `authorizationEffect=none` and `qualificationEffect=none`.

The assertion tooling is deliberately non-executing:

```bash
npm run check:connector-permission-fixtures
npm run audit:connector-permission-transition -- \
  --before <pre-canary-capabilities.json> \
  --after <post-canary-state.json> \
  --surface <surface-kind> \
  --operation <operation>
```

It verifies exact environment identity, current grant/scope binding,
immediate version succession and supersession. Its output explicitly has
`authorization_effect=none` and `qualification_effect=none`.
