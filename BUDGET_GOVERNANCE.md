# Budget Governance

This document defines the long-lived budget governance model for the project.

It is not a temporary P8 memo, not a token-tuning diary, and not a place to store the current best `.env.local` values.

Its purpose is to answer a more important question:

```text
How should the project decide
how much context to send,
how much output to allow,
how many times to retry,
how much money to spend,
which paths may proceed automatically,
and when the system must stop,
without violating the North Star?
```

Read this after:

1. `PROJECT_NORTH_STAR.md`
2. `PROJECT_AUTHORITY_GUIDE.md`
3. `PROJECT_PLAN.md`
4. `ARCHITECTURE.md`

---

## 1. Why This Document Exists

The project already has budget-like controls:

- token limits
- output caps
- retry limits
- timeout limits
- max shadow calls
- estimated cost caps
- replay/eval budget-skip reporting

But today these controls mostly live as local guards around P8 workspace shadow calls. They are useful, but they are not yet a coherent governance system.

That gap matters because the project has already seen failures that looked like:

```text
provider instability
reasonQuality collapse
candidate_futures too large
empty JSON output
shadow invalid_output
live-readiness no_go
```

while the deeper cause was often budget-contract coupling, for example:

```text
thinking budget and answer budget mixed together
rescue budget smaller than the failing primary budget
compression used as a reliability patch instead of a strategic-fidelity tool
call-count budget mixed with readiness evidence gating
token/cost limits treated as quality targets instead of safety rails
```

This document turns budget from an ad hoc cap collection into a governance model.

---

## 2. North Star Alignment

The project is not trying to build the cheapest possible LLM loop.
It is not trying to maximize valid JSON per dollar.
It is not trying to compress the LLM into a shallow selector that only emits `selectedCandidateId`.

The North Star is:

```text
LLM remains the core strategic player.
The local system is a predictive cognitive scaffold.
```

Therefore budget governance must serve strategic fidelity first, then safety, then efficiency.

In this project, “good budget policy” means:

- the LLM still sees the real strategic problem
- the scaffold still preserves tradeoffs, risks, uncertainty, assumptions, and invalidation structure
- the system remains replayable, testable, and rollback-capable
- provider reliability failures are contained and diagnosed rather than hidden
- cost and latency are controlled without silently degrading the strategic workspace

Bad budget policy is anything that improves surface validity by shrinking away the real decision.

Examples of budget failure relative to the North Star:

- keeping JSON valid by stripping CandidateFuture into an action list
- reducing cost by removing survival, lethal, route lock-in, or opportunity-cost cues
- tightening output caps until `reasonBrief` loses the tradeoff
- using budget skips to avoid collecting hard evidence
- declaring readiness because invalid output disappeared after over-thinning the workspace

Budget is a guard, not a goal.

The same principle applies to temporary manual contract fixes. A hand-tuned reason contract such as "combat reasons should express benefit plus cost, delay, or risk" can be a legitimate short-term scaffold repair, but it must not calcify into an unreviewed permanent rule pile. Long term, that policy should be attributable, proposal-driven, replay-validated, and rollback-capable like other inner-scaffold policies.

---

## 3. Budget Is Not Just Tokens

For this project, budget has at least six dimensions:

1. Context budget
   - how much structured strategic information may enter a model call
2. Output budget
   - how much final answer plus provider-generated auxiliary content may be emitted
3. Retry budget
   - how many recovery attempts are allowed, under what contract, and for which failure class
4. Run budget
   - how many calls, how much time, and how much cost may be spent in one run or slice
5. Experiment budget
   - how much evidence is required before a mode may advance to the next gate
6. Risk budget
   - which paths may proceed automatically, which require explicit authorization, and which are forbidden

This is why “set `max_tokens` lower” is not a budget strategy.
It is only one parameter inside one budget layer.

---

## 4. Current Project Problems

### 4.1 The budget logic is too P8-local

Today, most explicit budget governance is concentrated in `src/agent/workspace.ts` and the P8 replay/eval surfaces.

That is useful for shadow workspace experiments, but it is too narrow for a long-lived architecture because it makes budget feel like:

```text
the thing that decides whether a DeepSeek shadow call is skipped
```

instead of:

```text
the cross-cutting governance layer for model use, evidence collection, rollout safety, and learning safety
```

### 4.2 Different budget types are partly fused

Current controls and their meanings are not fully separated:

- `maxShadowCalls` is both a safety limit and an evidence-shaping mechanism
- token limits affect readiness, but readiness also depends on quality and safety
- cost caps affect whether we collect data, but they are not yet expressed as experiment-level sampling policy
- rescue output caps have historically been embedded inside provider retry logic rather than modeled as explicit recovery policy

This increases the chance of misdiagnosis:

- provider failure can look like workspace failure
- call-budget exhaustion can look like lack of evidence
- cheap rescue can look like reliable recovery while actually guaranteeing another truncation

### 4.3 Current schema emphasizes workspace-call budget, not full governance budget

The current durable schema captures:

- estimated input tokens
- max output tokens
- timeout
- retry limit
- max estimated cost
- budget status

That is a solid start, but it is still closer to a call guard than a full governance model.

Missing higher-level concepts include:

- budget profile identity
- decision-class-specific budget policy
- rescue policy identity
- budget lineage across primary and retry attempts
- experiment/sample target versus hard stop
- rollout authorization level
- “quality preserved under budget” signals

### 4.4 Budget currently risks being read as an optimization target

The project has already had moments where the practical question drifted toward:

```text
How do we get valid JSON more consistently?
```

instead of:

```text
How do we preserve strategic fidelity while making the provider contract reliable enough?
```

That drift is dangerous because the system’s deepest failure mode is becoming a stable JSON selector while losing the strategic workspace.

### 4.5 Budget is not yet modeled as a protected-path governance system

Some operations are inherently more dangerous than others:

- shadow comparison
- shadow provider calling
- additive live prompting
- stable memory mutation
- derived knowledge promotion
- strategy-param mutation

These should not share one flat notion of “budget”.

Related implication:

- workspace-side reason contract
- candidate-template shaping
- compression policy
- decision-class budget policy

should be treated as inner-scaffold policies that may be proposed and promoted under evidence. They are not allowed to cross into protected-path governance. The outer shell still owns semantic validation, execution safety, live authorization, rollback, and stable-write bans.

---

## 5. What The Project Should Learn From External Systems

This section records design inspiration, not implementation dependency.

### 5.1 Codex: boundaries first, not just quotas

OpenAI’s Codex docs distinguish sandboxing from approvals: the sandbox defines technical boundaries, while approval policy defines when the agent must stop and ask before crossing them. This is the right governance shape for SpireAgent too.  
Source: OpenAI Codex sandboxing and approvals docs  
- https://developers.openai.com/codex/concepts/sandboxing  
- https://developers.openai.com/codex/agent-approvals-security

Project implication:

- shadow-only work should live in a low-risk autonomous zone
- live additive should be a higher-risk gated zone
- stable memory / derived / strategy writes should be protected paths
- budget should encode permission level, not only token count

### 5.2 Agents SDK: guardrails plus human review

The OpenAI Agents docs separate automatic guardrails from human review. Guardrails validate behavior; human review decides whether sensitive actions may proceed.  
Source:  
- https://developers.openai.com/api/docs/guides/agents  
- https://developers.openai.com/api/docs/guides/agents/guardrails-approvals

Project implication:

- quality and safety checks should be first-class budget guardrails
- promotion from shadow to live must remain a human-authorized gate
- budget policy should define when a run may continue, pause, skip, or stop

### 5.3 DeepSeek docs: output budget must account for reasoning

DeepSeek documents that for reasoning models, `max_tokens` covers total output length including chain-of-thought, with `reasoning_content` and final `content` separated in the response. DeepSeek’s JSON mode docs also warn that JSON can truncate and may occasionally return empty `content`.  
Source:  
- https://api-docs.deepseek.com/guides/reasoning_model  
- https://api-docs.deepseek.com/guides/thinking_mode  
- https://api-docs.deepseek.com/guides/json_mode  
- https://api-docs.deepseek.com/api/create-chat-completion

Project implication:

- answer budget and reasoning budget cannot be treated as the same thing
- rescue policy must be explicitly modeled
- “shorter retry” is not always safer
- provider telemetry must record reasoning presence, finish reason, and attempt-level budget settings

### 5.4 LangGraph: step limits are runtime policy, not architecture destiny

LangGraph exposes a recursion limit to stop runaway graph executions, and it can be raised for legitimately complex runs.  
Source:  
- https://docs.langchain.com/oss/python/langgraph/graph-api  
- https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT

Project implication:

- call-count limits and retry limits should be explicit, runtime-visible policy
- raising a limit can be correct when complexity is real
- limits should fail closed but be adjustable with explanation

### 5.5 Kubernetes: budgets are layered

Kubernetes separates aggregate quota from per-object limits.  
Source:  
- https://kubernetes.io/docs/concepts/policy/resource-quotas/  
- https://kubernetes.io/docs/concepts/policy/limit-range/

Project implication:

- one-call caps are not enough
- the project needs:
  - per-call budget
  - per-run budget
  - per-decision-class sample budget
  - per-experiment budget
  - rollout-stage budget

### 5.6 Temporal: retry policy should depend on failure type

Temporal defines retry policy as a structured set of rules for how and when to try again after failure.  
Source:  
- https://docs.temporal.io/encyclopedia/retry-policies

Project implication:

- `fetch failed`, `provider_length_empty`, `tail noise`, `missing candidate id`, and `invalid choice` should not share one retry path
- retry belongs to failure classification, not just provider plumbing

### 5.7 OpenTelemetry: observability must correlate attempts, costs, and outcomes

OpenTelemetry treats traces, metrics, and logs as coordinated telemetry signals.  
Source:  
- https://opentelemetry.io/docs/  
- https://opentelemetry.io/docs/concepts/signals/

Project implication:

- the project should think in correlated budget telemetry, not isolated counters
- one shadow decision should be inspectable as a sequence:
  - budget profile
  - compression profile
  - request attempt
  - finish reason
  - parse state
  - quality outcome
  - gate consequence

---

## 6. Core Principles

### 6.1 Strategic fidelity outranks token thrift

If a budget rule forces removal of the strategic tradeoff, the budget rule is wrong.

### 6.2 Budget controls must be additive, inspectable, and reversible

No hidden fallback budget behavior.
No silent change to `full`.
No silent rescue mode that changes semantics without telemetry.

### 6.3 `full` is sacred

`full` is the baseline control group for structured workspace semantics.
It must not be silently optimized, bounded, or redefined to solve provider problems.

If a new budget behavior is needed, it belongs in:

- a named experiment mode
- a named recovery contract
- a named rollout profile

never as an invisible mutation of `full`

### 6.4 Recovery budgets are not compression budgets

When a provider fails with `length + empty`, the first question is not:

```text
What else can we cut?
```

It is:

```text
What output/reasoning contract failed,
and what is the smallest recovery change
that preserves strategic meaning?
```

### 6.5 Skip is better than hidden degradation

If the project cannot call safely under a given profile, it should skip with traceable reasons.

Skipping is preferable to:

- low-fidelity context sent as if it were normal
- empty output treated as acceptable
- semantic invalidity hidden as provider success

### 6.6 Budget must not rewrite evaluation truth

Budget controls can skip a call or stop a rollout.
They must not:

- convert invalid output to valid
- guess a missing candidate id
- relax semantic validation
- redefine readiness by renaming failures

### 6.7 Promotion budgets must be stricter than exploration budgets

The closer a path gets to live behavior or stable learning, the stricter the budget governance must become.

### 6.8 Budget governance must separate evidence collection from policy promotion

A cheap sample is not the same thing as sufficient evidence.
A passed shadow slice is not the same thing as promotion authority.

---

## 7. The Target Governance Model

Budget governance should be layered.

### 7.1 Layer A: Call Budget

Controls one model call attempt.

Includes:

- estimated input tokens
- max output tokens
- timeout
- provider mode
- thinking mode
- response format mode
- expected cost

Purpose:

- keep one request inside safe technical boundaries

### 7.2 Layer B: Recovery Budget

Controls retry behavior after a classified failure.

Includes:

- failure class
- retry eligibility
- retry count
- rescue output cap
- rescue thinking mode
- rescue response contract
- recovery success/failure telemetry

Purpose:

- recover provider failure without mutating semantic truth

### 7.3 Layer C: Run Budget

Controls total spend and total call count for one local run or process window.

Includes:

- max shadow calls
- max total estimated cost
- max total actual cost when available
- max long-tail retries
- max provider error budget before auto-stop

Purpose:

- stop unbounded experimentation

### 7.4 Layer D: Slice / Evidence Budget

Controls how much fresh evidence is required before drawing conclusions.

Includes:

- target sample count
- per-decision-class minimums
- fresh window definition
- revision purity
- budget-window purity

Purpose:

- prevent fake readiness from tiny or mixed samples

### 7.5 Layer E: Rollout Budget

Controls whether a mode may progress from:

- shadow-only
- shadow-readiness
- static pre-audit
- additive live
- future guarded learning

Includes:

- explicit status vocabulary
- blocker classes
- acceptable WARN classes
- rollback triggers
- authorization requirement

Purpose:

- protect live behavior and future learning boundaries

### 7.6 Layer F: Protected-Path Budget

Controls especially dangerous actions.

Includes:

- additive live enable
- whitelist expansion
- memory write enable
- derived promotion enable
- strategy-param update enable

Purpose:

- require stronger evidence and stricter review than ordinary shadow work

---

## 8. Budget Profiles The Project Should Eventually Use

The project should move toward named profiles instead of loose environment-variable clusters.

Suggested long-lived profiles:

### `observe_only`

- no provider call
- comparison and telemetry only

### `shadow_exploration`

- limited shadow call budget
- provider contract experimentation allowed
- invalid output acceptable as evidence, not as pass

### `shadow_readiness`

- stricter call budget
- stricter failure gating
- clearer per-class evidence targets
- no live effect

### `live_additive_candidate`

- additive only
- whitelist limited
- rollback mandatory
- stricter quality thresholds

### `protected_learning_preparation`

- no stable mutation
- proposal-only evidence

### `stable_update_candidate`

- future phase only
- evidence + thresholds + rollback + review mandatory

These profiles are governance objects, not merely `.env` presets.

---

## 9. What Must Stay Separate

Budget governance should integrate with many systems, but it must not merge their identities.

It must stay distinct from:

### 9.1 Strategic workspace semantics

Budget may constrain workspace size.
Budget must not define what a CandidateFuture fundamentally is.

### 9.2 Candidate generation and scoring

Budget may decide whether to call a shadow model.
Budget must not silently change live candidate ordering or execution semantics.

### 9.3 Semantic validation

Budget may skip.
Budget may retry.
Budget may block promotion.
Budget must not weaken validation.

### 9.4 Replay/eval judgment

Budget is one dimension of evaluation.
It must not erase safety, quality, or attribution signals.

### 9.5 Learning state

Budget data can inform whether evidence is sufficient.
It must not directly write stable memory, derived knowledge, or strategy params.

---

## 10. Current Couplings That Should Be Reduced

The following current couplings are understandable but should eventually be cleaned up:

### 10.1 Workspace assembly and budget policy

`workspace.ts` currently owns too much of:

- prompt building
- budget calculation
- shadow readiness gating
- call skipping logic
- cost estimation

Long term, this should separate into at least:

- workspace serializer
- budget profile / policy
- rollout gate evaluator

### 10.2 Provider adapter and retry policy

`llm.ts` currently mixes:

- provider request construction
- retry policy
- rescue contract
- parse cleanup
- some telemetry semantics

Long term, recovery policy should be a first-class module boundary.

### 10.3 Budget status and readiness meaning

Today, replay/eval/review already expose budget windows well enough to debug P8, but the project still partially relies on convention to interpret:

- call-budget exhaustion
- mixed budget window
- insufficient evidence
- provider blocker

These should become more explicitly modeled governance concepts.

---

## 11. The Right Future Direction

The best-fit budget system for this project is not:

- “use the smallest prompt that still passes”
- “minimize cost first”
- “retry until valid”
- “compress candidate futures aggressively”

The right future direction is:

```text
governed strategic fidelity
```

Meaning:

- preserve the LLM’s real strategic workspace
- explicitly budget riskier capabilities
- classify failures honestly
- use budget to protect evidence quality
- keep promotion conservative
- keep rollback simple

In practice, that means:

### 11.1 Use more generous budgets when the problem is real complexity

If high-pressure combat genuinely needs more output room, allow it under a named profile and record the cost.

### 11.2 Use tighter budgets only when they do not degrade strategic meaning

Tight budgets are acceptable when they remove redundancy, not when they remove the decision.

### 11.3 Prefer explicit profile changes over hidden heuristics

Budget changes should be attributable to named policy, not invisible conditionals.

### 11.4 Treat provider rescue as a contract problem

Not every provider failure should trigger more workspace cutting.

### 11.5 Keep fresh-evidence budgets separate from rollout authorization

You can have enough evidence to continue shadow work without having enough evidence to enable live additive.

---

## 12. Anti-Patterns

The project should explicitly avoid these:

### 12.1 “Valid JSON at all costs”

This can produce a shallow selector that passes metrics while violating the architecture.

### 12.2 “Cheaper rescue is safer rescue”

A smaller retry is not safer if it guarantees another truncation.

### 12.3 “Budget skip means quality failure”

Budget skip often means policy stop, not strategic degradation.

### 12.4 “Reason quality can be ignored if candidateId is valid”

That is how the system degrades into a selector.

### 12.5 “History can be mixed because the totals look good”

Mixed revision windows and mixed budget windows destroy causal interpretation.

### 12.6 “Compression success means workspace success”

A smaller payload is only good if the strategic problem remains visible.

---

## 13. What The Current Project Should Change In Principle

The following are principle-level changes, not immediate code promises:

1. Stop treating budget as a P8-only implementation detail.
2. Define named budget profiles for shadow, readiness, live additive, and future guarded learning.
3. Separate call budget, recovery budget, evidence budget, and rollout budget in both code and schema.
4. Preserve `full` as the unchanged control group permanently.
5. Treat compression as strategic-fidelity engineering, not cost shaving.
6. Make provider recovery policies explicit and failure-class-specific.
7. Record attempt-level budget lineage and quality consequences.
8. Gate promotion with safety and quality, not just provider validity.
9. Keep budget governance out of stable memory / derived / strategy mutation until P9+ guarded update work exists.

---

## 14. Proposed Engineering Rollout Plan

This is the bridge from principle to implementation.
It is intentionally phased and conservative.

### Phase BG-1: Vocabulary and ownership cleanup

Goal:

- define durable terms:
  - call budget
  - recovery budget
  - run budget
  - evidence budget
  - rollout budget
  - protected-path budget

Deliverables:

- shared schema additions for budget profile identity and recovery policy identity
- doc alignment
- replay/eval vocabulary alignment

Do not:

- change live behavior

### Phase BG-2: Budget profile extraction

Goal:

- stop scattering budget meaning across env vars and local conditions

Deliverables:

- explicit budget profile/config module
- named profile identity recorded in transitions
- decision-class-specific profile selection policy

Do not:

- silently rewrite `full`
- expand live scope

Current implementation note:

- `src/agent/budgetGovernance.ts` is the first implementation anchor.
- `STS2_BUDGET_GOVERNANCE_PROFILE` records the intended governance profile.
- `workspaceComparison.budget.governanceProfile` and `governancePolicy` record profile, call budget, recovery budget, run budget, evidence budget, rollout budget, and protected-path budget interpretation.
- Replay/eval/review aggregate governance profile counts so mixed-profile windows are visible during audits.
- This is metadata and guard interpretation only. It does not change live behavior or stable learning behavior.

### Phase BG-3: Recovery policy extraction

Goal:

- separate provider adapter from recovery policy

Deliverables:

- failure-class-specific retry policy
- rescue contract identity in telemetry
- attempt lineage in replay/eval/review

Do not:

- weaken semantic validation

Current implementation note:

- `src/agent/providerRecoveryPolicy.ts` is the first BG-3 code anchor.
- `ShadowWorkspaceDecision.providerRecoveryPolicyName` and `providerRecoveryPolicy` summarize existing primary/rescue attempts, rescue mode, output-cap relation, primary/rescue thinking modes, terminal finish reason, and terminal parse/failure state.
- High-pressure combat recovery should be judged by attempt lineage: primary may still hit provider `length+empty`, but a valid terminal rescue with independent output cap and explicit disabled thinking is a recovered provider-contract case, not a CandidateFuture compression success.
- Replay/eval/review aggregate recovery policy and rescue output-cap relation counts.
- This is telemetry only. It does not change provider retry behavior, output caps, workspace compression, semantic validation, candidate selection, or live behavior.

### Phase BG-4: Evidence-budget formalization

Goal:

- distinguish “sample target reached” from “promotion allowed”

Deliverables:

- explicit sample targets per decision class
- mixed-window detection as first-class governance signal
- freshness-aware readiness reporting

Current implementation note:

- `src/replay/evidenceBudget.ts` is the first BG-4 code anchor.
- `P8LiveReadinessAssessment.evidenceBudget` records fresh live-eligible sample targets, per-decision-class evidence targets, mixed revision/budget windows, and whether the evidence window is usable for promotion.
- This does not change live readiness status by itself. It explains evidence sufficiency so readiness cannot be confused with call-budget exhaustion or mixed-window artifacts.

### Phase BG-5: Rollout-budget formalization

Goal:

- make additive live gating reflect governance policy instead of ad hoc interpretation

Deliverables:

- explicit live-readiness policy object
- blocked/WARN/allowed classes by rollout stage
- clearer rollback rules

Current implementation note:

- `src/replay/rolloutBudget.ts` is the first BG-5/BG-6 code anchor.
- `P8LiveReadinessAssessment.rolloutBudget` records the intended first live mode, recommended whitelist, blocked classes, explicit flag requirement, human authorization requirement, rollback requirement, and protected-path write bans.
- This is readiness metadata only. It does not enable `STS2_P8_LIVE_ADDITIVE`, does not change the live prompt, and does not route shadow decisions into execution.

### Phase BG-6: Future protected-path governance

Goal:

- prepare for P9/P10 without opening stable mutation early

Deliverables:

- budget rules for proposal-only, review-only, and future stable-update candidate paths

Current implementation note:

- `rolloutBudget` and `workspaceComparison.budget.governancePolicy.protectedPathBudget` both explicitly keep stable memory, derived knowledge, and strategy-param writes disabled.
- Future protected learning or stable-update candidates must add evidence, review, rollback, and human authorization before any mutation path is opened.

---

## 15. Immediate Recommendations For Current P8/P8.5 Work

Given the current codebase and current risks:

1. Do not keep shrinking `candidate_futures` unless fresh evidence proves workspace size is still the blocker.
2. Continue treating `full_bounded_candidate_futures` as an experiment, not the new definition of `full`.
3. Use provider recovery policy to solve `length + empty` before cutting strategic fields further.
4. Keep current replay/eval/review budget telemetry, but reframe it as early governance telemetry rather than the finished system.
5. Make future readiness decisions using:
   - provider reliability
   - live safety
   - reason quality
   - CandidateFuture completeness
   - evidence sufficiency
   not cost alone
6. Do not allow budget pressure to justify live additive promotion.

Current North Star audit note:

- The active P8.5 issue is no longer primarily provider reachability or provider-length recovery on fresh evidence.
- The active issue is quality attribution: whether missing survival/tradeoff information originates in CandidateFuture generation, compression, prompt contract, model output, or review heuristics.
- Budget governance should not respond by blindly raising caps or shrinking workspace. It should first preserve attribution evidence.

---

## 16. Learning-Aware Budget Governor Route

The long-term target is not a larger set of fixed caps. It is a learning-aware Budget Governor that can propose, test, promote, and roll back budget/compression policy while the outer safety shell remains fixed.

This must be staged carefully.

### Stage 0: Guard + telemetry

Current state:

- env/config caps guard calls
- provider recovery is classified and summarized
- evidence and rollout budgets are reported
- protected paths remain closed

This is useful, but it is not yet a learning-aware governor.

### Stage 1: Attribution-only budget analysis

Goal:

- determine whether a quality failure was caused by budget/compression, CandidateFuture generation, prompt contract, provider output, or review heuristic

Allowed behavior:

- record before/after compression survival/tradeoff presence
- record whether the final model reason used available scaffold information
- record whether rescue policy changed terminal output quality

Forbidden behavior:

- automatically change caps
- automatically promote compression policy
- use budget attribution to bypass validation

### Stage 2: Proposal-only policy changes

Goal:

- generate reviewable proposals such as:
  - preserve survival lines in high-pressure combat
  - allocate more non-combat future budget to card-reward deck direction
  - shorten repeated prediction-check prose while preserving expected facts
  - use disabled-thinking rescue for `length+empty` failures

Proposal requirements:

- decision class
- triggering conditions
- affected budget layer
- expected quality benefit
- cost/latency/risk estimate
- rollback path
- required shadow evidence

These proposals must not mutate runtime policy by themselves.

### Stage 3: Shadow budget experiments

Goal:

- compare named policies without live execution

Examples:

- `full` control
- `full_bounded_candidate_futures`
- high-pressure combat survival-preserving profile
- non-combat strategic compact profile
- provider recovery profile variants

Experiments must report provider reliability, reason quality, CandidateFuture completeness, cost, latency, and evidence-window cleanliness.

### Stage 4: Guarded policy promotion

Goal:

- promote a budget/compression policy only after clean shadow evidence

Promotion requires:

- fresh target-class evidence
- no live-eligible invalid/error
- no strategic-fidelity regression against `full`
- explicit rollback
- versioned policy identity
- human authorization for any live or protected-path use

### Stage 5: Decision-class deliberation profiles

Long-term target:

- budget policy becomes part of a typed deliberation profile:
  - workspace depth
  - candidate count
  - memory activation depth
  - prompt fields
  - compression policy
  - output cap
  - rescue policy
  - evidence target

The LLM may propose these profiles inside the experimental scaffold, but the outer shell must still enforce hard caps, validation, live gating, and stable-update promotion rules.

---

## 17. Success Criteria For Budget Governance

The budget system is healthy when:

- strategic fidelity remains visible under budgeted operation
- provider failures are attributable, not mysterious
- rescue policy is explicit and class-specific
- `full` remains stable as a control group
- replay/eval/review can separate:
  - quality problem
  - provider problem
  - evidence problem
  - budget stop
  - rollout blocker
- promotion to more dangerous paths requires stronger evidence
- live behavior and future learning behavior remain protected by explicit gates

The budget system is unhealthy when:

- cost savings routinely come from semantic thinning
- output validity is achieved by hiding real strategic uncertainty
- retry behavior is opaque
- evidence windows are mixed and still used for promotion claims
- budget logic silently changes what the workspace means

---

## 18. Final Position

The project should treat budget governance as part of the agent’s safety and epistemology, not merely part of provider configuration.

The right mental model is:

```text
Budget governance is the system that decides
how much autonomy,
how much context,
how much output,
how much recovery,
how much evidence,
and how much risk
the project is allowed to take
at each stage of the maturity route.
```

When done correctly, budget governance does not make the agent smaller.
It makes the agent honest, bounded, replayable, and promotable without betraying the North Star.
