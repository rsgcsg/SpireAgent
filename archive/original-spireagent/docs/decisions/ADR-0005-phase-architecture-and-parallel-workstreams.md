# ADR-0005: P9-P15 Phase Architecture And Parallel Workstreams

## Status

Accepted

## Context

The former P9-P16 roadmap accumulated the correct capabilities but assigned them to overlapping or misleading phases:

- P9 had many subphases without finite program gates.
- P11 combined curriculum, evidence scheduling, context experiments, skill qualification, and authority delegation.
- P12 Context OS and P13 Budget OS shared a deliberation-quality loop but were planned as independent systems.
- full environment revalidation followed skill qualification;
- productization arrived only after advanced learning work;
- optional local-autonomy research was numbered as a mandatory maturity phase.

Phase numbers should describe independently finishable product capabilities, not every research theme.

## Decision

The canonical mainline becomes:

```text
P9   Trustworthy Change Kernel
P10  Repeatable Experience Learning
P11  Learned Deliberation OS
P12  Environment Compatibility And Revalidation
P13  Player Runtime Beta
P14  Delegated Skills And Authority Qualification
P15  Product Release And Operations
```

Optional local policy/value/world-model/autonomy work moves to research track `R1` and is not a mainline phase.

P9 is managed through four finite gates:

- `P9-G1 Evidence Safety`
- `P9-G2 Experiment Integrity`
- `P9-G3 Stable Change`
- `P9-G4 Lifecycle Demonstration`

Historical P9.0-P9.5E labels remain valid implementation history and map into G1/G2. New prerequisites should be assigned to a gate rather than extending an indefinite P9.5 alphabet.

P11 combines context and compute at the phase level but keeps separate module boundaries:

- P11A Context Compiler;
- P11B Compute And Provider Orchestration.

P11A precedes P11B. Provider recovery remains operational infrastructure, not a learned context policy.

## Curriculum Decision

There is no mainline Autonomous Curriculum phase.

P10 may implement coverage-gap detection, counterexample scheduling, regression selection, and a bounded experiment queue. P14 may schedule skill-boundary evidence. A general curriculum system requires future evidence that it has a concrete task generator, measurable competence objective, and value beyond structured coverage scheduling.

## Product Decision

Product work uses a parallel workstream model:

- interface, packaging, provider, secret, authority-display, pause/takeover, and diagnostics design may begin before P13;
- P13 is the acceptance gate for a non-developer player beta;
- P15 is the production release/operations gate.

P14 delegated skills do not block P15 core LLM-primary release. Unqualified delegated features remain disabled.

## Phase Versus Workstream Rule

A phase is a maturity gate with finite acceptance criteria.

A workstream is ongoing engineering that may cross phases, including:

- security and secrets;
- environment identity capture;
- benchmarks;
- provider adapters;
- product interface design;
- documentation and migration;
- artifact hygiene.

Do not create a new phase merely because a workstream continues.

## Consequences

- `PROJECT_PLAN.md` and `docs/phases/P9_P15_EXECUTION_ROADMAP.md` become the forward route.
- P9.5D/P9.5E are retained as historical/current work-package aliases under P9-G2.
- former P11 curriculum work moves to P10 scheduling or optional research.
- former P11 skill work moves to P14.
- former P12/P13 combine into P11A/P11B.
- former P14 becomes P12.
- former P15 splits into P13 and P15.
- former P16 becomes R1.
- current runtime telemetry containing historical phase labels remains readable until a deliberate schema migration; a label change alone must not alter behavior.

## Rejected Alternatives

### Preserve P9-P16 and only clarify prose

Rejected. It leaves duplicated ownership and continues to make optional research look mandatory.

### Make every subsystem its own phase

Rejected. Context, budget, security, provider, environment, and product work contain submodules and cross-phase workstreams; phase proliferation would recreate the same problem.

### Merge P9 and P10

Rejected. Proving one safe change and operating a repeated learning system have different failure modes and acceptance tests.

### Require delegated skills before any player beta

Rejected. Observe, Copilot, and LLM-primary modes provide product value and interface evidence without local skill delegation.
