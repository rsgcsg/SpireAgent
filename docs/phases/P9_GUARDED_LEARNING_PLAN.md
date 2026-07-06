# P9 Guarded Learning Plan

P9 is not "turn on automatic learning".

P9 is the phase where the project turns replayable evidence into typed, guarded, proposal-driven inner-scaffold changes while keeping the outer safety shell fixed.

## Definition

P9 should be understood as:

```text
proposal-driven guarded learning
```

The outer shell stays hard:

- candidate legality
- semantic validation
- execution safety
- live authorization
- rollback authority
- stable-write protection
- fact / memory / derived separation

The inner scaffold becomes gradually learnable:

- memory content
- memory retrieval tags and compression
- first-impression shaping
- candidate templates
- reason contract
- budget/compression policy
- decision classification policy
- scaffold policy and future skill policy

Long-term direction:

```text
the soft shell should gradually almost disappear
```

That does not mean the hard shell disappears.

It means humans should not permanently hand-author separate combat/shop/card_reward/event soft frameworks forever. Over time, the LLM should be able to propose, validate, revise, and improve:

- memory structure and retrieval
- first-impression structure
- candidate templates
- review style
- scoring/scaffold heuristics
- classification/routing structure
- skills
- scaffold policies

under the fixed outer shell of validation, execution safety, rollback, protected-path governance, and fact/memory/derived separation.

## Target Proposal Families

- `MemoryProposal`
- `DerivedKnowledgeProposal`
- `CandidateTemplateProposal`
- `ReasonPolicyProposal`
- `BudgetCompressionPolicyProposal`
- `ClassificationPolicyProposal`
- `SkillProposal`
- `ScaffoldPolicyProposal`

Each proposal must include at least:

- scope
- target layer
- proposed patch
- supporting evidence
- counterexamples
- confidence
- risk
- promotion criteria
- rollback plan

## Minimal Data Model

The durable learning flow should look like:

```text
transition/replay/review signal
  -> PredictionErrorAttributor
  -> LearningProposalEngine
  -> pending proposal store
  -> EvidenceSliceReader
  -> human review / guarded gate
  -> shadow applicator
  -> replay/eval/fresh validation
  -> stable promotion ledger
  -> rollback if regression
```

## Required Components

### `ProtectedPathGate`

Purpose:

- stop live/provider-originated writes to protected paths
- separate live rollout from learning promotion

### `EvidenceSliceReader`

Purpose:

- define clean evidence windows
- exclude mixed revision/budget windows when needed
- exclude console fixture/debug evidence from stable promotion

### `PredictionErrorAttributor`

Purpose:

- map replay/review failures to likely repair layers
- keep provider failure, candidate-future weakness, reason omission, and budget issues separable
- start with weak attribution instead of pretending to know exact causality

### `LearningProposalEngine`

Purpose:

- turn repeated evidence into typed pending proposals
- avoid direct mutation
- reject vague advice that cannot be tied to evidence, scope, risk, and validation

### `StablePromotionGate`

Purpose:

- require promotion criteria
- write promotion logs
- produce rollback snapshots

## Major P9 Weak Points

### 1. Prediction Error Is Hard To Define

Slay the Spire errors are often not single-step causal mistakes.

Deaths may come from:

- a card reward several floors ago
- a greedy route
- a missed shop buy
- excessive HP loss in a previous fight
- a boss phase-transition miss

Therefore the first `PredictionErrorAttributor` must use weak attribution.

Initial output should default to fields like:

- `suspectedCause`
- `confidence`
- `counterexampleNeeded`
- `alternativeHypotheses`

Default rule:

- attribution is a suspected cause, not a stable truth
- attribution must not directly become stable knowledge
- only evidence slices, counterexamples, replay/eval confirmation, or live validation may move it toward promotion

### 2. Proposals Can Degrade Into Empty Advice

LLMs are very good at writing plausible but useless summaries such as:

- "defend more"
- "buy better cards"
- "be careful at low HP"

P9 must force proposals to be operational.

Every non-draft proposal should require:

- concrete transition evidence
- scope
- counterexample or non-applicable conditions
- risk
- expected effect
- promotion criteria
- rollback plan

If a proposal lacks evidence, scope, counterexample handling, or validation planning, it should be rejected or remain draft-only.

### 3. Stable Memory Pollution Is The Biggest Risk

Once a bad lesson reaches stable memory, derived knowledge, skill, or scaffold policy, the system can repeatedly retrieve and reinforce the same mistake.

Therefore:

- `ProtectedPathGate` is mandatory P9.0 work
- live LLM, DeepSeek provider, bridge responder, runtime reflection, and legacy finalize feedback must not directly write stable memory / derived / strategy / skill
- every stable write must go through:
  - pending proposal
  - evidence gate
  - promotion ledger
  - version diff
  - rollback

Legacy `finalizeRun()` behavior must be isolated, labeled, or gated before P9 starts.

### 4. Class Whitelist Can Ossify

Targeted live by decision class was a reasonable P8/P8.5 safety strategy.

But if P9 continues by hand-authoring one soft framework per class, the project will drift toward:

```text
human classification system plus LLM fill-in
```

P9 must add:

- `ClassificationPolicyProposal`
- `ScaffoldPolicyProposal`

so the LLM can gradually propose softer scene structure such as:

- `shop + survival-risk + deck-scaling`
- `card_reward + thin-deck skill`
- `event + risk-budget policy`

Long term, decision classes should remain hard-shell routing and audit labels, not permanent human-authored thinking modes.

### 5. Current Metrics Are Not Enough

`reasonQuality`, `missing_tradeoff`, and `survival_line` are good smoke alarms.

They are not strategic truth.

P9/P10 must avoid training the system to merely produce prettier reasons.

Longer-term evaluation needs signals closer to learning quality, such as:

- decision consistency
- prediction accuracy
- risk calibration
- counterexample rate
- retrieval usefulness
- proposal survival rate
- rollback frequency
- policy usage impact
- regression rate

Reason detectors should remain warning signals, not the long-term optimization target.

## Phases

### P9.0 Protected-Path Hardening

Goal:

- remove accidental write paths before any learning work

Allowed:

- gating
- labeling
- telemetry

Forbidden:

- auto-promoting stable learning

### P9.1 Proposal Schema And Store

Goal:

- replace free-form proposal evidence with typed pending proposals

Allowed:

- schema
- append-only store
- review CLI read path

### P9.2 Attribution And Proposal Generation

Goal:

- generate proposal candidates from replay/review evidence

### P9.3 Evidence Slicing

Goal:

- ensure promotion evidence is clean, scoped, and comparable

### P9.4 Review And Decision CLI

Goal:

- let humans inspect, approve, reject, expire, and revert proposals

### P9.5 Shadow Applicator

Goal:

- apply proposals only in shadow first

### P9.6 Stable Promotion Gate

Goal:

- allow a narrow stable promotion path with rollback

### P9.7 Retrieval Integration

Goal:

- let stable learned policies influence future scaffold construction in a recorded way

### P9.8 End-To-End Guarded Learning Window

Goal:

- complete one full proposal lifecycle from evidence to stable to rollback-capable validation

## First Recommended Narrow Target

The first P9 stable target should not be strategy params.

The safest first target is one of:

- `ReasonPolicyProposal`
- `CandidateTemplateProposal`

because they affect scaffold presentation more naturally than protected-path execution behavior.

## Out Of Scope

P9 does not authorize:

- wildcard live expansion
- provider contract heroics as a substitute for learning
- automatic stable memory writes without proposal review
- letting LLM proposals rewrite validation or execution rules
