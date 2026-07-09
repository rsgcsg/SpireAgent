# Pre-P9 Engineering Debt Audit

## Purpose

This document audits visible engineering debt before formal P9 work begins.

It separates:

- debt that must be repaired or explicitly mitigated before formal P9
- debt that is safe and useful to repair before P9
- P9.1 entry work that starts proposal infrastructure without stable application
- later P9, P10, P11, P12, and P13 work
- debt that is real but too broad or unsafe to attempt now

This document does **not** authorize wildcard live, stable learning, automatic promotion, broad controller rewrites, or LLM/provider writes to stable memory, derived knowledge, strategy, skills, prompt policies, budget policies, or scaffold policies.

## Current Phase Snapshot

Current phase is P8/P8.5 closeout plus early P9.0 hardening.

Honest status:

- P8/P8.5 may be closed only as an explicit-whitelist live scaffold MVP.
- Explicit whitelist live is real and locally exercised.
- Wildcard live remains forbidden.
- P9 has not started as stable learning.
- P9 must be proposal-driven guarded learning, not automatic learning.
- Clean live rollout evidence is not learning proof.
- P9 entry means safe proposal infrastructure can begin.

Current pre-P9 blocker class:

- hard-shell protected paths must remain non-bypassable
- legacy stable-write surfaces must be isolated or clearly gated
- evidence windows must become first-class enough that console/debug/mixed evidence cannot qualify stable promotion
- typed proposal and reverse-scaffold feedback surfaces must exist before learning work can be reviewed safely

## Evidence Inspected

Documentation:

- `AGENTS.md`
- `docs/00_START_HERE.md`
- `PROJECT_NORTH_STAR.md`
- `PROJECT_AUTHORITY_GUIDE.md`
- `docs/04_CURRENT_STATUS.md`
- `PROJECT_PLAN.md`
- `ARCHITECTURE.md`
- `DATA_SCHEMA.md`
- `REPLAY_AND_EVAL.md`
- `BUDGET_GOVERNANCE.md`
- `MEMORY_SYSTEM.md`
- `docs/phases/P8_CLOSEOUT.md`
- `docs/phases/P9_ENTRY_CRITERIA.md`
- `docs/phases/P9_GUARDED_LEARNING_PLAN.md`
- `docs/phases/P9_P13_EXECUTION_ROADMAP.md`
- `docs/phases/P8_5_LIVE_ROLLOUT_POLICY.md`
- `docs/runbooks/LLM_RUN_MODES.md`
- `docs/debt/P8_P9_DEBT_REGISTER.md`
- `README.md`
- `CONTRIBUTING_OR_ENGINEERING_RULES.md`
- `docs/archive/legacy/*.md`

Code and config:

- `package.json`
- `tsconfig.json`
- `src/agent/protectedPathGate.ts`
- `src/agent/controller.ts`
- `src/agent/memory.ts`
- `src/agent/llm.ts`
- `src/agent/prompt.ts`
- `src/agent/workspace.ts`
- `src/agent/cognitiveScaffold.ts`
- `src/agent/candidates.ts`
- `src/agent/scoring.ts`
- `src/agent/fallback.ts`
- `src/agent/decisionRecorder.ts`
- `src/agent/review.ts`
- `src/agent/smoke.ts`
- `src/domain/types.ts`
- `src/replay/p8LiveReadiness.ts`
- `src/replay/liveAppliedRollout.ts`
- `src/replay/evidenceBudget.ts`
- `src/replay/reader.ts`
- `src/replay/cli.ts`
- `src/eval/runner.ts`
- `src/eval/cli.ts`
- `src/agent/checkpoint.ts`
- `src/agent/client.ts`
- `src/agent/state.ts`

## Definitions And Non-Goals

Definitions:

- `explicit-whitelist live`: live additive execution may call the LLM only for explicitly listed decision classes. This is the current authorized live model.
- `wildcard live`: any live mode where unlisted decision classes may freely call the LLM. This remains forbidden.
- `stable learning`: persistent changes to memory, derived knowledge, strategy, skills, prompt policy, budget policy, scaffold policy, candidate templates, or classification policy that affect future decisions.
- `protected path`: any path that could mutate stable learning state or future strategic behavior.
- `pre-P9 feasible debt`: safety, documentation, and read-only/reporting work that reduces P9 risk without applying stable learning.
- `P9.1 entry work`: typed schema/store/read-only surfaces for proposal-driven learning.
- `deferred future debt`: real debt whose repair requires later P9/P10+ infrastructure or is too broad for pre-P9.

Non-goals:

- no runtime implementation in this audit task
- no stable promotion
- no shadow applicator
- no automatic learning
- no broad controller rewrite
- no Context OS or Budget OS live behavior
- no live-class expansion
- no wildcard live

## Comprehensive Debt Taxonomy

All requested categories were audited. Current visibility:

| Category | Visible In Repo? | Existing Tracking | Audit Finding |
|---|---:|---|---|
| documentation/source-of-truth | yes | partial | improved, but still needs this audit as pre-P9 index |
| stale docs/archive visibility | yes | partial | mostly redirected; keep archive warnings strong |
| hard-shell safety | yes | partial | hard shell exists but must remain explicit in every P9 PR |
| protected-path/stable-write | yes | yes | gate exists, but future protected surface is wider than current implementation |
| live whitelist/wildcard boundary | yes | partial | current docs are aligned; reporting still has split semantics |
| legacy finalize/local learning | yes | yes | blocked by default, still needs explicit legacy classification |
| replay/eval/readiness semantics | yes | yes | shadow readiness and live-applied audit coexist and can be misread |
| EvidenceSliceReader/evidence window | yes | yes | first-class read-only module started; not yet promotion-grade canonical slice authority |
| console/debug/fixture pollution | yes | yes | documented; needs enforceable slice semantics |
| LearningProposal schema/store | yes | yes | append-only read-only store started; no apply path |
| ReverseScaffoldFeedback schema/store | yes | yes | append-only telemetry/store started; proposal-seed only |
| weak attribution/overclaim | yes | yes | encoded for pending proposals; attribution remains weak |
| anti-vague proposal validation | yes | yes | implemented for pending proposal status normalization |
| controller boundary/orchestration | yes | yes | high debt, but broad rewrite is not P9-entry work |
| LiveDecisionGateway boundary | yes | partial | useful narrow extraction, optional before P9 |
| budget/recovery governance | yes | yes | governance exists; implementation is still P8-local |
| prompt/context/budget telemetry | yes | partial | enough for P8, not enough for P12/P13 learning |
| memory-system boundary | yes | yes | protected path and legacy learner boundary are core pre-P9 concerns |
| data/transition schema | yes | partial | lacks typed P9 proposal and reverse feedback |
| candidate/scoring maintainability | yes | no | real but not pre-P9 blocker |
| cognitiveScaffold responsibility creep | yes | no | real; schedule to P9.2/P9.3 |
| mechanics/deterministic prediction | yes | partial | useful P10+ improvement, not P9 entry |
| Game IO/event log/human recorder | yes | partial | needed for future evidence quality, not immediate P9 entry |
| replay/eval benchmark maturity | yes | partial | P10+ unless blocking current checks |
| test coverage/CI/check | yes | partial | targeted tests needed with each PR |
| adapter/capability boundary | yes | partial | keep adapter as provider path; full capability model can wait |
| secrets/runtime artifact hygiene | yes | partial | current docs warn; every PR must preserve |
| Context OS long-term | yes | partial | P12, schema/telemetry only before then |
| Budget OS long-term | yes | partial | P13, schema/telemetry only before then |
| team workflow/ADR/PR governance | yes | partial | use this audit and ADRs to reduce drift |

## Full Debt Matrix

Legend:

- blocking: whether unresolved debt blocks formal proposal-driven P9 entry
- model: recommended model level for the repair PR

| ID | Debt | Category | Evidence | Status | Severity | Phase | Blocking | Model | Recommended PR | Acceptance / Checks / Safety |
|---|---|---|---|---|---|---|---:|---|---|---|
| D-001 | Documentation source-of-truth drift | docs | `docs/00_START_HERE.md`, `docs/04_CURRENT_STATUS.md`, `LLM_HANDOFF.md`, `DEBUG_REPORT.md` | in_progress | medium | should_fix_before_P9_if_safe | no | mini | PR-1 | Active docs point to canonical sources; handoff/debug non-canonical; `npm run check` |
| D-002 | Stale archive visibility | docs | `docs/archive/legacy/*.md` | in_progress | low | should_fix_before_P9_if_safe | no | mini | PR-1 | Archive docs clearly historical; no current-status claims |
| D-003 | Hard-shell safety vocabulary not centralized enough | safety | North Star, P9 docs, protected gate docs | open | high | should_fix_before_P9_if_safe | no | advanced | PR-2 | P9 PR template uses hard-shell checklist; no runtime behavior weakened |
| D-004 | Protected-path surface incomplete | protected path | `src/agent/protectedPathGate.ts`, `src/agent/controller.ts` | in_progress | critical | must_fix_before_formal_P9 | yes | advanced | PR-2 | Live/provider memory writes blocked by default; future stable targets enumerated; smoke covers blocked provider writes |
| D-005 | Legacy finalize/local learning path classified | memory | `src/agent/memory.ts` | in_progress | critical | must_fix_before_formal_P9 | yes | advanced | PR-3 | Legacy finalize stable writes blocked by default or explicitly legacy-labeled; audit log retained; rollback safe |
| D-006 | Explicit whitelist vs wildcard reporting ambiguity | live boundary | `README.md`, `docs/runbooks/LLM_RUN_MODES.md`, `liveAppliedRollout.ts` | in_progress | high | should_fix_before_P9_if_safe | no | mini/advanced | PR-4 | Reports distinguish explicit whitelist live from wildcard-forbidden |
| D-007 | Shadow readiness and live-applied rollout semantics split | readiness | `p8LiveReadiness.ts`, `liveAppliedRollout.ts`, `REPLAY_AND_EVAL.md` | in_progress | critical | must_fix_before_formal_P9 | yes | advanced | PR-4 | Replay/eval/review expose separate evidence purposes without conflicting gates |
| D-008 | EvidenceSliceReader read-only surface started | evidence | `reader.ts`, `evidenceBudget.ts`, P9 docs | in_progress | critical | must_fix_before_formal_P9 | yes | advanced | PR-4 | First-class read-only slice dimensions for run/revision/budget/live/shadow/console |
| D-009 | Console/debug/fixture evidence pollution | evidence | `REPLAY_AND_EVAL.md`, console guidance | in_progress | critical | must_fix_before_formal_P9 | yes | advanced | PR-5 | Console/debug evidence is labeled/excludable from promotion slices |
| D-010 | LearningProposal schema/store started | P9 schema | `domain/types.ts`, `DATA_SCHEMA.md`, `learning-proposals.jsonl` | closed | critical | P9.1_entry | no | advanced | PR-7 | Typed proposal family, append-only pending store, no apply path |
| D-011 | ReverseScaffoldFeedback schema/store started | P9 schema | P9 docs, review signals, `reverse-scaffold-feedback.jsonl` | closed | high | P9.1_entry | no | advanced | PR-8 | Typed telemetry/proposal-seed surface, no live behavior change |
| D-012 | Weak attribution encoded for proposals | attribution | P9 docs, `domain/types.ts` | closed | critical | must_fix_before_formal_P9 | no | advanced | PR-9 | Proposals require suspected cause, confidence, alternatives, counterexample need |
| D-013 | Anti-vague proposal validation implemented | proposal quality | P9 docs, `learning/proposals.ts` | closed | critical | must_fix_before_formal_P9 | no | advanced | PR-9 | Draft/reject vague proposals without evidence/scope/counterexample/validation plan |
| D-014 | Controller owns too many concerns | architecture | `controller.ts` | open | high | P9.2_to_P9.8 | no | advanced | PR-11 optional | Narrow extraction only; broad rewrite deferred |
| D-015 | LiveDecisionGateway missing | architecture | `controller.ts`, live adapter path | open | medium | should_fix_before_P9_if_safe | no | advanced | PR-11 optional | Extract live decision boundary only if tests stay small and rollback easy |
| D-016 | Budget/recovery governance still P8-local | budget | `BUDGET_GOVERNANCE.md`, `llm.ts`, `workspace.ts` | in_progress | high | should_fix_before_P9_if_safe | no | advanced | PR-6 | Separate call/recovery/run/evidence/protected-path budgets in docs/reporting |
| D-017 | Prompt/context/budget telemetry incomplete for learned policy | telemetry | `workspace.ts`, `DATA_SCHEMA.md` | open | medium | P12/P13 | no | advanced | future | Keep telemetry read-only; no learned budget behavior before P13 |
| D-018 | Memory-system boundary debt | memory | `MEMORY_SYSTEM.md`, `memory.ts` | open | high | must_fix_before_formal_P9 | yes | advanced | PR-2/3 | Stable targets cannot be mutated outside proposal/promotion path |
| D-019 | Data/transition schema lacks P9 proposal/reverse feedback | schema | `domain/types.ts`, `DATA_SCHEMA.md` | open | high | P9.1_entry | yes | advanced | PR-7/8 | Schema docs and types align; old transitions remain readable |
| D-020 | Candidate generation/scoring maintainability | candidate/scoring | `candidates.ts`, `scoring.ts` | untracked | medium | P9.2_to_P9.8 | no | advanced | future | Do not rewrite before proposal engine needs it |
| D-021 | cognitiveScaffold responsibility creep | scaffold | `cognitiveScaffold.ts` | untracked | medium | P9.2_to_P9.8 | no | advanced | future | Split attribution/proposal building only when P9 modules land |
| D-022 | Mechanics/deterministic prediction gaps | mechanics | eval fixture categories, prediction errors | untracked | medium | P10 | no | advanced | future | Improve predictors after P9 proposal loop is observable |
| D-023 | Game IO/event log/human recorder debt | IO/evidence | run artifacts, console-assisted docs | untracked | medium | P10/P11 | no | advanced | future | Add durable event provenance before using as learning proof |
| D-024 | Replay/eval benchmark maturity | eval | `eval/runner.ts`, review summaries | open | medium | P10 | no | advanced | future | Benchmarks for proposal impact and regressions |
| D-025 | Test coverage and CI/check debt | tests | `smoke.ts`, package scripts | partial | medium | continuous | no | mini/advanced | every PR | Each PR adds targeted smoke/replay/eval checks |
| D-026 | Adapter/capability boundary debt | adapter | `client.ts`, live command adapter, MCP docs | partial | medium | P9.2_to_P9.8 | no | advanced | future | Capability model only if adapter diversity demands it |
| D-027 | Secrets/runtime artifact hygiene | hygiene | docs, `.env.example`, git status checks | partial | high | must_fix_before_formal_P9 | yes | mini | PR-0/12 | No secrets/runtime artifacts in tracked changes; verify with `git status --short` |
| D-028 | Context OS long-term debt | context | North Star, P9-P13 plan | partial | medium | P12 | no | advanced | future | P9 may add schema/telemetry only, no live context self-modification |
| D-029 | Budget OS long-term debt | budget | `BUDGET_GOVERNANCE.md` | partial | medium | P13 | no | advanced | future | P9 may add proposal schema only; no learned budget behavior before gate |
| D-030 | Team workflow/ADR/PR governance | process | docs operating system, ADR docs | partial | low | should_fix_before_P9_if_safe | no | mini | PR-1/12 | PR prompts, acceptance criteria, and checklists are explicit |

## Debts That Must Be Fixed Before Formal P9

These are not optional if P9 means proposal-driven guarded learning rather than loose runtime reflection.

### D-004 Protected-Path Surface Incomplete

Why it matters:

- Live/provider output must never mutate stable memory, derived knowledge, strategy, skills, prompt policies, budget policies, candidate templates, classification policies, or scaffold policies directly.
- Current protection exists for live LLM memory updates and legacy finalize stable writes, but P9 will expand the stable target surface.

Hard-shell risk:

- A future provider output could accidentally become a stable strategic change.

Minimum repair:

- enumerate protected targets centrally
- keep live/provider writes denied by default
- add tests showing provider-returned memory or strategy intent is blocked

### D-005 Legacy Finalize / Legacy-Local-Learning Classification

Why it matters:

- `finalizeRun()` historically wrote long-term memory and strategy params.
- This path must remain impossible to confuse with P9 proposal promotion.

Minimum repair:

- label legacy finalize as legacy-local-learning
- preserve audit output
- ensure no stable write is possible without explicit gate

### D-007 Readiness Semantics Split

Why it matters:

- Shadow readiness is not live execution truth.
- Live-applied rollout evidence is not stable-learning truth.
- P9 needs both, but they must not be fused into a single green/red gate.

Minimum repair:

- replay/eval/review must say which layer each summary describes
- P9 entry must use live-applied cleanliness plus proposal-safety readiness, not stale P8 combat-only heuristics

### D-008 EvidenceSliceReader Started But Not Yet Promotion-Grade

Why it matters:

- Stable promotion cannot rely on ad hoc latest-window interpretation.
- Slices must encode live vs shadow, revision, budget, provider, decision class, console/debug assistance, and historical vs fresh windows.

Minimum repair:

- add a first-class read-only reader before proposal promotion exists
- make console/debug slices excludable by construction

### D-009 Console/Debug/Fixture Pollution

Why it matters:

- Console-assisted runs are valuable for reproducing scenarios, but they are not organic strategy evidence.
- Debug evidence should remain inspectable, but its provenance must keep it out of future stable-promotion eligibility.

Minimum repair:

- label or infer debug/fixture provenance
- block those slices from stable-promotion eligibility
- report organic promotion-eligible transition counts separately from promotion-excluded transition counts

Current state:

- `EvidenceSliceReader` exposes `promotionEvidence.eligibleTransitions`, `promotionEvidence.excludedTransitions`, and `promotionEvidence.exclusionReasonCounts`.
- Console/debug/fixture, human-observed, snapshot-only, and unknown-provenance transitions remain visible but cannot satisfy future stable-promotion slices.
- Stable promotion itself remains unimplemented and disabled.

### D-010 LearningProposal Schema/Store

Why it matters:

- Current `ConsolidationRecord` is useful proposal evidence but too weak for P9.

Current state:

- typed proposal family exists
- append-only pending store exists
- no apply path exists
- no stable write exists

### D-012 Weak Attribution

Why it matters:

- Slay the Spire failures are delayed and multi-causal.
- P9 must not pretend exact single-transition causality.

Current state:

- `LearningProposal` encodes `suspectedCause`, `confidence`, `counterexampleNeeded`, and `alternativeHypotheses`
- attribution remains weak and cannot become stable truth without later evidence slices and promotion gates

### D-013 Anti-Vague Proposal Validation

Why it matters:

- LLMs can generate plausible but useless advice.

Current state:

- proposals missing evidence, scope, counterexample handling, expected effect, validation plan, or rollback plan stay draft/rejected
- this validation only controls proposal status; it does not approve, apply, or promote proposals

### D-018 Memory-System Boundary

Why it matters:

- Stable memory contamination is the largest P9 risk.

Minimum repair:

- protect every stable memory/derived/strategy/skill/scaffold target before stable proposal work begins

### D-027 Runtime Artifact And Secret Hygiene

Why it matters:

- Learning infrastructure will create more local state.

Minimum repair:

- every PR verifies no `.env.local`, API key, provider output, snapshot, run artifact, or mutable memory file is accidentally tracked

## Debts That Should Be Fixed Before P9 If Safe

- D-001 documentation source-of-truth drift
- D-002 stale archive visibility
- D-003 hard-shell vocabulary centralization
- D-006 whitelist/wildcard report wording
- D-015 optional narrow LiveDecisionGateway extraction
- D-016 budget/recovery governance clarification
- D-030 PR governance and debt prompts

These reduce risk, but they should not delay P9 indefinitely if the hard blockers above are fixed.

## P9.1 Entry Debts

P9.1 may begin when it is still read-only / append-only:

- D-010 `LearningProposal` schema/store
- D-011 `ReverseScaffoldFeedback` schema/store
- D-019 transition/schema alignment

Rules:

- proposal creation is allowed
- proposal review is allowed
- proposal application is not allowed
- stable promotion is not allowed

## Debts Deferred To P9.2-P9.8

| Phase | Deferred Work |
|---|---|
| P9.2 | weak attribution engine, proposal generation from replay/review signals |
| P9.3 | full evidence slicing, counterexample search, clean-slice review |
| P9.4 | review CLI for list/show/approve/reject/expire |
| P9.5 | shadow-only proposal applicator |
| P9.6 | stable promotion gate with ledger and rollback |
| P9.7 | retrieval integration for stable policies |
| P9.8 | end-to-end guarded learning window |

Controller, candidate, scoring, and cognitive scaffold refactors should be tied to these phases, not performed speculatively.

## Debts Deferred To P10+

P10+ owns:

- continuous proposal loop
- proposal aggregation
- replay A/B
- semi-automatic promotion under strict gates
- rollback detection
- long-run benchmark maturity
- mechanics-engine improvements
- event log and human recorder maturity
- curriculum design
- scaffold experiments that need stable evidence

## Debts Deferred To P12/P13

P12 owns Context OS learned behavior.

P13 owns Budget OS learned behavior.

Before then:

- P9 may define schemas, telemetry, proposal types, and review surfaces
- P9 must not let learned context/budget policy directly change live behavior
- P9 must not let LLM self-modify prompts, compression, budgets, or classifications without proposal review and later promotion gates

## Debts That Should Not Be Attempted Now

Do not attempt now:

- wildcard live
- all-class live claims
- stable promotion/apply path
- ShadowApplicator
- broad controller rewrite
- full skill/scaffold DSL
- automatic proposal approval
- learned budget/context live behavior
- replacing deterministic safety shell with LLM judgment
- treating reason-quality detector pass as strategic truth

These are phase-wrong and would create more risk than value.

## Critique Of Proposed Pre-P9 Repair Order

The proposed order is mostly right:

- freeze discipline first is correct
- documentation cleanup is useful before handoff-heavy work
- ProtectedPathGate and legacy finalize isolation are true blockers
- EvidenceSliceReader belongs before stable promotion
- LearningProposal schema/store is P9.1, not a side task
- LiveDecisionGateway should be optional and narrow

What is missing:

- ReverseScaffoldFeedback should be paired with LearningProposal as a P9.1 read-only surface.
- Anti-vague proposal validation should be treated as a blocker, not a nice-to-have.
- Console/debug/fixture exclusion must be part of evidence slicing, not just documentation.
- Runtime artifact hygiene must be explicit because P9 will create more local state.

What should be reordered:

- EvidenceSliceReader should come before or alongside proposal store if any promotion discussion begins.
- Budget/recovery governance clarification should happen before BudgetPolicyProposal work, but not block proposal schema itself.
- Classification/Scaffold policy proposal types should be schema-only early; behavior belongs later.

What should be deferred:

- broad controller extraction
- stable promotion gate apply path
- shadow applicator
- Context OS and Budget OS live behavior
- mechanics-engine expansion unless needed by a concrete proposal test

What should not be done before P9:

- wildcard live
- automatic learning
- class-by-class prompt pile expansion
- stable write enablement

## Final Recommended Repair Order

### Conservative Detailed Sequence

1. PR-0 read-only coordinator audit refresh
2. PR-1 documentation/source-of-truth cleanup
3. PR-2 ProtectedPathGate hardening
4. PR-3 legacy finalize isolation / legacy-local-learning labeling
5. PR-4 EvidenceSliceReader and readiness semantics separation
6. PR-5 console/debug/fixture evidence exclusion
7. PR-6 budget/recovery governance clarification
8. PR-7 LearningProposal schema + append-only pending proposal store
9. PR-8 ReverseScaffoldFeedback schema + append-only telemetry/store
10. PR-9 weak attribution + anti-vague proposal validation
11. PR-10 classification/scaffold policy proposal schema-only guard
12. PR-11 optional LiveDecisionGateway narrow extraction
13. PR-12 final audit, debt register update, and P9 entry decision

### Credit-Efficient Compressed Sequence

1. PR-A docs + debt + entry criteria sync: PR-0, PR-1, PR-12 planning portions
2. PR-B protected path + legacy finalize hardening: PR-2, PR-3
3. PR-C evidence semantics: PR-4, PR-5, part of PR-6
4. PR-D P9.1 read-only schemas/stores: PR-7, PR-8, PR-10 schema-only
5. PR-E attribution/proposal quality guard: PR-9
6. PR-F optional boundary extraction: PR-11 only if risk is low

The conservative sequence is safer. The compressed sequence is acceptable only if each combined PR stays small, testable, and reversible.

## Engineering Details Per PR

| PR | Purpose | Model | Likely Files | Allowed | Forbidden | Checks | Acceptance | Future Phase Enabled |
|---|---|---|---|---|---|---|---|---|
| PR-0 | Refresh read-only debt facts | mini | docs only | audit, status, no code | behavior changes | `git status --short`, `npm run check` if cheap | facts current | all |
| PR-1 | Source-of-truth cleanup | mini | `docs/00_START_HERE.md`, debt docs, phase docs | links, redirects, warnings | runtime edits | grep + check | canonical docs clear | P9 onboarding |
| PR-2 | ProtectedPathGate hardening | advanced | `protectedPathGate.ts`, controller, smoke, docs | enumerate protected targets, block provider writes | allow stable writes | tsc/check/smoke | blocked by default | P9.0 |
| PR-3 | Legacy finalize isolation | advanced | `memory.ts`, docs, smoke | label/gate legacy local learner | automatic stable writes | tsc/check/smoke | audited and blocked/labeled | P9.0 |
| PR-4 | EvidenceSliceReader/readiness semantics | advanced | replay/eval/review docs | read-only slice reader | promotion/apply | replay/eval/check | slices explicit | P9.0/P9.3 |
| PR-5 | Console/debug exclusion | advanced | evidence reader, docs, eval | exclude from promotion-eligible slices | delete evidence | replay/eval/check | debug slices visible but ineligible | P9.3 |
| PR-6 | Budget/recovery governance | advanced | budget docs, telemetry docs, maybe reports | clarify/report budgets | change live budget behavior | check/replay/eval | budget classes separated | P13 prep |
| PR-7 | LearningProposal schema/store | advanced | `types.ts`, data schema, new store | append-only pending store | apply/promote | tsc/check/smoke | pending proposals readable | P9.1 |
| PR-8 | ReverseScaffoldFeedback schema/store | advanced | `types.ts`, data schema, review | telemetry/store only | live second-pass controller | tsc/check/smoke | feedback captured read-only | P9.1 |
| PR-9 | Weak attribution + anti-vague validation | advanced | attribution/proposal modules, smoke | reject/draft weak proposals | exact-causality claims | tsc/check/smoke | vague proposals cannot enter pending | P9.2 |
| PR-10 | Classification/scaffold proposal schema | advanced | types/docs | schema-only proposal types | behavior/routing changes | tsc/check | no live behavior changes | P9.1/P9.2 |
| PR-11 | Optional LiveDecisionGateway extraction | advanced | controller, new gateway tests | narrow extraction | broad controller rewrite | tsc/check/smoke/live dry reports | behavior-preserving | P9.2 |
| PR-12 | Final P9 entry decision | mini | docs/debt/phase/status | audit update | runtime edits | full check set | entry yes/no explicit | formal P9 |

Rollback/safety for every PR:

- keep explicit whitelist live semantics unchanged unless the PR explicitly targets reporting only
- keep wildcard live forbidden
- keep validation/execution safety unchanged
- do not commit secrets, provider outputs, run data, snapshots, or mutable memory artifacts
- if a PR mixes behavior and docs too much, split it

## Copy-Paste Codex Prompts For Follow-Up PRs

### PR-0 Prompt: Read-Only Coordinator Audit Refresh

```text
Task:
In SpireAgent, perform a read-only pre-P9 coordinator audit refresh. Do not edit source code or runtime behavior.

Context:
The project is in P8/P8.5 closeout and early P9.0 hardening. P9 is proposal-driven guarded learning, not automatic learning.

Must read before editing:
docs/00_START_HERE.md, docs/04_CURRENT_STATUS.md, PROJECT_NORTH_STAR.md, PROJECT_PLAN.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, docs/debt/P8_P9_DEBT_REGISTER.md, docs/phases/P9_ENTRY_CRITERIA.md.

Current phase and phase fit:
This is pre-P9 audit maintenance. It may update docs only if facts are stale.

Allowed changes:
Documentation-only corrections to current status, debt register links, or audit timestamps if evidence changed.

Forbidden changes:
No source code, package scripts, live flags, schema behavior, stable learning, wildcard live, runtime artifacts, .env.local, API keys, data/runs, snapshots, or mutable memory.

Implementation requirements:
Run read-only checks, compare current docs against git status and package scripts, and update docs only where stale.

Tests/checks to run:
git status --short; rg for overclaims; npm run check if available and cheap.

Acceptance criteria:
Current docs match repo state and no runtime behavior changed.

Rollback/safety requirements:
Revert only your doc edits if wrong; never revert user work.

Deliverable format:
List docs changed, checks run, remaining stale risks, and explicitly state no runtime behavior changed.
```

### PR-1 Prompt: Documentation Source-Of-Truth Cleanup

```text
Task:
Clean up SpireAgent documentation source-of-truth debt for P9 onboarding.

Context:
docs/04_CURRENT_STATUS.md is canonical for current phase. DEBUG_REPORT.md and LLM_HANDOFF.md are historical/non-canonical.

Must read before editing:
docs/00_START_HERE.md, PROJECT_AUTHORITY_GUIDE.md, docs/04_CURRENT_STATUS.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, README.md, DEBUG_REPORT.md, LLM_HANDOFF.md.

Current phase and phase fit:
Pre-P9 documentation cleanup only.

Allowed changes:
Docs only. Replace local absolute paths with repo-relative links. Strengthen archive/historical warnings.

Forbidden changes:
No runtime code, package scripts, schema behavior, live expansion, wildcard live, stable learning, runtime artifacts, .env.local, API keys, data/runs.

Implementation requirements:
Ensure active docs say P8/P8.5 is explicit-whitelist live scaffold MVP, not stable learning or wildcard live.

Tests/checks to run:
rg for local absolute paths and overclaims; npm run check if cheap; git status --short.

Acceptance criteria:
Docs point to canonical sources and stale docs cannot be mistaken for active architecture.

Rollback/safety requirements:
Keep historical content unless clearly marked; do not delete project history.

Deliverable format:
Changed docs, stale risks, checks, no runtime behavior changed.
```

### PR-2 Prompt: ProtectedPathGate Hardening

```text
Task:
Harden SpireAgent protected-path governance before formal P9.

Context:
P9 stable learning must not start until live/provider-originated writes to memory, derived knowledge, strategy, skills, prompt policy, budget policy, candidate templates, classification policy, and scaffold policy are blocked by default.

Must read before editing:
PROJECT_NORTH_STAR.md, docs/phases/P9_ENTRY_CRITERIA.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, DATA_SCHEMA.md, src/agent/protectedPathGate.ts, src/agent/controller.ts, src/agent/smoke.ts.

Current phase and phase fit:
P9.0 hardening. This is safety infrastructure, not learning.

Allowed changes:
Centralize protected target enumeration, strengthen gate telemetry, add smoke tests, update schema/docs.

Forbidden changes:
No stable learning, no proposal apply, no wildcard live, no live-class expansion, no validation/execution weakening, no provider obedience assumptions.

Implementation requirements:
Live/provider memory or strategy intent must be denied by default and auditable. Future protected target names should be explicit even if not yet implemented.

Tests/checks to run:
npm exec tsc -- --noEmit; npm run check; npm run agent:smoke; npm run data:replay -- --latest; npm run data:eval -- --latest; npm run agent:review; git status --short.

Acceptance criteria:
Provider-returned stable-write intent is blocked and recorded; docs/schema match.

Rollback/safety requirements:
If any existing live/validation behavior changes unexpectedly, stop and revert only this PR.

Deliverable format:
Files changed, gate behavior, tests, remaining protected-path risks.
```

### PR-3 Prompt: Legacy Finalize Isolation

```text
Task:
Isolate and label legacy finalize-run learning before formal P9.

Context:
Legacy finalize behavior must not silently write stable memory or strategy during P9. It may remain only as blocked/audited legacy-local-learning unless explicitly gated.

Must read before editing:
MEMORY_SYSTEM.md, docs/phases/P9_ENTRY_CRITERIA.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, src/agent/memory.ts, src/agent/protectedPathGate.ts, src/agent/smoke.ts.

Current phase and phase fit:
P9.0 hardening, not P9 stable learning.

Allowed changes:
Label legacy finalize, strengthen default block/audit behavior, add tests and docs.

Forbidden changes:
No stable write enablement, no automatic promotion, no memory policy changes, no runtime artifacts committed.

Implementation requirements:
finalizeRun must be impossible to mistake for P9 proposal promotion.

Tests/checks to run:
npm exec tsc -- --noEmit; npm run check; npm run agent:smoke; git status --short.

Acceptance criteria:
Legacy writes are blocked or explicitly gated/labeled and audited.

Rollback/safety requirements:
Preserve old data reading; do not delete memory files.

Deliverable format:
Behavior summary, docs updated, tests, remaining risks.
```

### PR-4 Prompt: EvidenceSliceReader And Readiness Semantics

```text
Task:
Add a read-only EvidenceSliceReader and clarify readiness semantics.

Context:
P9 cannot use mixed latest windows as learning evidence. Slices must separate live, shadow, bridge, console/debug, revision, budget, provider, decision class, and current/historical windows.

Must read before editing:
REPLAY_AND_EVAL.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, src/replay/reader.ts, src/replay/p8LiveReadiness.ts, src/replay/liveAppliedRollout.ts, src/replay/evidenceBudget.ts, src/eval/runner.ts, src/agent/review.ts.

Current phase and phase fit:
Pre-P9/P9.0 evidence infrastructure. Read-only only.

Allowed changes:
New read-only slice reader, report formatting, docs, tests.

Forbidden changes:
No stable promotion, no proposal apply, no live behavior change, no wildcard live.

Implementation requirements:
Shadow readiness, live-applied rollout, and future promotion evidence must be distinct summaries.

Tests/checks to run:
npm exec tsc -- --noEmit; npm run check; npm run data:replay -- --latest; npm run data:eval -- --latest; npm run agent:review.

Acceptance criteria:
Reports identify slice type and avoid treating console/debug or mixed evidence as promotion-ready.

Rollback/safety requirements:
Old run reading must remain backward compatible.

Deliverable format:
Slice dimensions, report output summary, tests, residual semantics risks.
```

### PR-5 Prompt: Console/Debug/Fixture Evidence Exclusion

```text
Task:
Make console/debug/fixture evidence ineligible for stable promotion slices.

Context:
Console-assisted runs are useful debugging evidence but not organic learning proof.

Must read before editing:
REPLAY_AND_EVAL.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, src/replay/reader.ts, src/eval/runner.ts, src/agent/checkpoint.ts, DEBUG_REPORT.md.

Current phase and phase fit:
Pre-P9 evidence safety.

Allowed changes:
Read-only provenance labels, exclusion flags, docs, tests.

Forbidden changes:
No deletion of historical evidence, no promotion engine, no live behavior change.

Implementation requirements:
Debug evidence remains visible but cannot satisfy promotion eligibility.

Tests/checks to run:
npm exec tsc -- --noEmit; npm run check; npm run data:replay -- --latest; npm run data:eval -- --latest.

Acceptance criteria:
Reports show console/debug/fixture eligibility separately from organic evidence.

Rollback/safety requirements:
Keep historical replay readable.

Deliverable format:
Fields/labels added, tests, limitations.
```

### PR-6 Prompt: Budget/Recovery Governance Clarification

```text
Task:
Clarify budget and recovery governance boundaries for P9 without changing live behavior.

Context:
Budget is a guard, not an optimization target. Recovery budget must stay separate from workspace compression and evidence budget. Current fixed caps are provider-profile defaults, not universal strategy or Budget OS.

Must read before editing:
BUDGET_GOVERNANCE.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, DATA_SCHEMA.md, REPLAY_AND_EVAL.md, src/agent/llm.ts, src/agent/workspace.ts, src/replay/reader.ts.

Current phase and phase fit:
Pre-P9 governance/reporting only unless a tiny telemetry fix is required.

Allowed changes:
Docs/reporting/telemetry clarification; tests if reporting changes; schema-only direction for future `BudgetUseRecord`, `BudgetProfile`, and `BudgetPolicyProposal`.

Forbidden changes:
No provider contract rewrite, no live budget widening, no compression behavior change, no stable learning.

Implementation requirements:
Reports should distinguish call, recovery, run, evidence, rollout, and protected-path budgets. Cap exhaustion should be classified before recovery. Repeated cap failure should create telemetry/proposal evidence, not automatic budget escalation.

Tests/checks to run:
npm run check; replay/eval/review if report output changes.

Acceptance criteria:
Budget language is auditable and does not imply token saving is a strategic goal. P9 budget work remains proposal-only; P13 owns runtime Budget/Compute OS behavior.

Rollback/safety requirements:
If runtime behavior changes, stop.

Deliverable format:
Changed docs/reports, checks, remaining P13 debt.
```

### PR-7 Prompt: LearningProposal Schema And Pending Store

```text
Task:
Implement typed LearningProposal schema and append-only pending proposal store.

Context:
This starts P9.1 read-only proposal infrastructure. It must not apply or promote proposals.

Must read before editing:
PROJECT_NORTH_STAR.md, DATA_SCHEMA.md, docs/phases/P9_GUARDED_LEARNING_PLAN.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, src/domain/types.ts, src/agent/decisionRecorder.ts, src/replay/reader.ts, src/eval/runner.ts.

Current phase and phase fit:
P9.1 entry. Append-only and read-only.

Allowed changes:
Types, schema docs, local pending store reader/writer, replay/eval visibility, smoke tests.

Forbidden changes:
No stable write, no apply path, no promotion, no live behavior change, no automatic learning.

Implementation requirements:
Proposal fields include type, status, scope, target layer/object, evidence, counterexamples, confidence, risk, promotion criteria, rollback plan, protected-path impact, review history, and source transition/run ids.

Tests/checks to run:
npm exec tsc -- --noEmit; npm run check; npm run agent:smoke; replay/eval/review.

Acceptance criteria:
Pending proposals can be appended/read/reported; stable behavior unchanged.

Rollback/safety requirements:
Store is append-only; no runtime artifacts committed.

Deliverable format:
Schema summary, store path, checks, non-goals confirmed.
```

### PR-8 Prompt: ReverseScaffoldFeedback Schema And Store

```text
Task:
Implement typed ReverseScaffoldFeedback schema and append-only telemetry/store.

Context:
Reverse feedback lets the LLM/review layer say the scaffold missed, compressed, classified, retrieved, or budgeted the wrong thing. It is proposal-seed telemetry only.

Must read before editing:
PROJECT_NORTH_STAR.md, docs/phases/P9_GUARDED_LEARNING_PLAN.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, DATA_SCHEMA.md, src/domain/types.ts, src/agent/workspace.ts, src/replay/reader.ts, src/eval/runner.ts.

Current phase and phase fit:
P9.1 read-only telemetry.

Allowed changes:
Types, schema docs, append-only capture/reporting, tests.

Forbidden changes:
No second-pass live controller, no prompt mutation, no budget mutation, no stable policy write.

Implementation requirements:
Feedback should record target scaffold layer, omitted/misleading information, evidence, confidence, risk, and proposal seed links.

Tests/checks to run:
npm exec tsc -- --noEmit; npm run check; smoke/replay/eval/review as touched.

Acceptance criteria:
Feedback can be captured and reported without changing decisions.

Rollback/safety requirements:
If feedback affects live behavior, stop.

Deliverable format:
Fields added, reporting, tests, non-goals.
```

### PR-9 Prompt: Weak Attribution And Anti-Vague Proposal Validation

```text
Task:
Add weak-attribution fields and anti-vague proposal validation for pending proposals.

Context:
P9 must not pretend precise causal attribution. Proposals without evidence, scope, counterexamples, risk, expected effect, validation plan, and rollback stay draft/rejected.

Must read before editing:
docs/phases/P9_GUARDED_LEARNING_PLAN.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, src/agent/cognitiveScaffold.ts, src/domain/types.ts, src/replay/reader.ts.

Current phase and phase fit:
P9.1/P9.2 safety gate for proposal quality.

Allowed changes:
Schema fields, proposal validator, tests, docs.

Forbidden changes:
No stable promotion, no automatic approval, no exact-causality claims.

Implementation requirements:
Add suspectedCause, confidence, counterexampleNeeded, alternativeHypotheses. Reject/draft vague advice.

Tests/checks to run:
npm exec tsc -- --noEmit; npm run check; npm run agent:smoke.

Acceptance criteria:
Vague proposals cannot enter pending review as actionable items.

Rollback/safety requirements:
Existing old proposal records remain readable.

Deliverable format:
Validator behavior, tests, compatibility notes.
```

### PR-10 Prompt: Classification/Scaffold Policy Proposal Schema-Only Guard

```text
Task:
Add schema-only ClassificationPolicyProposal and ScaffoldPolicyProposal types.

Context:
Class whitelists are useful P8 safety scaffolding but must not fossilize into permanent hand-written inner policy. P9 should let classification/scaffold changes be proposed, reviewed, and later tested.

Must read before editing:
PROJECT_NORTH_STAR.md, PROJECT_PLAN.md, docs/phases/P9_GUARDED_LEARNING_PLAN.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, src/domain/types.ts, DATA_SCHEMA.md.

Current phase and phase fit:
P9.1 schema-only. No behavior.

Allowed changes:
Types, docs, examples, tests for serialization.

Forbidden changes:
No routing behavior change, no live whitelist change, no prompt mutation, no automatic policy application.

Implementation requirements:
Proposal types must include scope, evidence, counterexamples, risk, promotion criteria, rollback plan, and protected-path impact.

Tests/checks to run:
npm exec tsc -- --noEmit; npm run check; npm run agent:smoke.

Acceptance criteria:
Types exist and are non-executable.

Rollback/safety requirements:
If any decision route changes, stop.

Deliverable format:
Types/docs added, tests, explicit behavior non-change.
```

### PR-11 Prompt: Optional LiveDecisionGateway Narrow Extraction

```text
Task:
Optionally extract a narrow LiveDecisionGateway boundary from controller orchestration.

Context:
Controller owns too many concerns, but broad refactor is unsafe. Extract only if behavior-preserving and testable.

Must read before editing:
ARCHITECTURE.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, src/agent/controller.ts, src/agent/llm.ts, src/agent/workspace.ts, src/agent/fallback.ts, src/agent/decisionRecorder.ts, src/agent/smoke.ts.

Current phase and phase fit:
Optional pre-P9 maintainability. Skip if risk is high.

Allowed changes:
Move live-decision orchestration into a small module with same inputs/outputs.

Forbidden changes:
No prompt changes, no validation changes, no execution changes, no provider changes, no whitelist changes, no broad controller rewrite.

Implementation requirements:
Diff should be behavior-preserving. Add tests around chosenBy/liveAdditiveApplied/fallback.

Tests/checks to run:
npm exec tsc -- --noEmit; npm run check; npm run agent:smoke; replay/eval/review.

Acceptance criteria:
Existing live/shadow behavior unchanged and controller is slightly thinner.

Rollback/safety requirements:
If behavior changes or diff grows too broad, abort and document deferral.

Deliverable format:
Extraction summary, tests, why safe or why deferred.
```

### PR-12 Prompt: Final Audit And P9 Entry Decision

```text
Task:
Perform final pre-P9 audit and decide whether formal P9 proposal infrastructure may begin.

Context:
P9 entry does not mean stable learning is implemented. It means safe proposal infrastructure can begin.

Must read before editing:
docs/00_START_HERE.md, docs/04_CURRENT_STATUS.md, docs/debt/PRE_P9_ENGINEERING_DEBT_AUDIT.md, docs/debt/P8_P9_DEBT_REGISTER.md, docs/phases/P9_ENTRY_CRITERIA.md, docs/phases/P9_GUARDED_LEARNING_PLAN.md, REPLAY_AND_EVAL.md.

Current phase and phase fit:
P8/P8.5 closeout and P9 entry decision.

Allowed changes:
Docs/status/debt register updates only, unless this PR is explicitly paired with completed checks from prior PRs.

Forbidden changes:
No source code behavior changes, no stable promotion, no wildcard live, no live expansion.

Implementation requirements:
Check every P9 entry criterion, mark pass/fail/accepted risk, and name the next PR.

Tests/checks to run:
npm exec tsc -- --noEmit; npm run check; npm run agent:smoke; npm run data:replay -- --latest; npm run data:eval -- --latest; npm run agent:review; git status --short.

Acceptance criteria:
Humans can decide P9 entry from one document without reading handoff/debug history.

Rollback/safety requirements:
Do not overclaim readiness.

Deliverable format:
P9 entry verdict, blockers, checks, next PR.
```

## Future Debt Schedule

| Phase | Debt Focus |
|---|---|
| P9.1 | LearningProposal schema/store; ReverseScaffoldFeedback schema/store; schema-only classification/scaffold proposal types |
| P9.2 | weak attribution, proposal generation, anti-vague filtering |
| P9.3 | EvidenceSliceReader expansion, counterexample search, console/debug exclusion enforcement |
| P9.4 | review CLI and ledger operations |
| P9.5 | shadow applicator for proposal overlays |
| P9.6 | stable promotion gate with rollback and version diff |
| P9.7/P9.8 | retrieval integration and end-to-end guarded learning window |
| P10 | continuous proposal loop, aggregation, replay A/B, benchmark maturity, rollback detection |
| P11 | curriculum and long-run learning experiments |
| P12 | Context OS proposal-to-policy pipeline; no early live behavior |
| P13 | Budget OS proposal-to-policy pipeline; no early live behavior |

Controller/module-boundary debt:

- optional LiveDecisionGateway before P9 if low risk
- larger controller split after proposal/apply boundaries are clearer

Candidates/scoring/cognitiveScaffold maintainability debt:

- defer until proposal engine needs to address these surfaces
- do not preemptively rewrite strategic scaffold code

Mechanics-engine debt:

- schedule for P10+ unless it blocks attribution fixtures

Benchmark/eval maturity debt:

- grow alongside proposal impact measurement

Game IO / event-log / human-recorder debt:

- add provenance before using as learning evidence

Context OS and Budget OS debt:

- keep as future learned policy systems, not P9 live behavior

Team-process debt:

- use one PR per concern unless combining is clearly safe
- include checklists and rollback notes in every P9-facing PR

## P9 Entry Decision Checklist

P9 entry does not mean stable learning is implemented.

P9 entry means safe proposal infrastructure can begin.

Before formal P9:

- [ ] `npm run check` passes
- [ ] latest replay/eval/review can read current live-applied evidence
- [ ] explicit whitelist live remains distinct from wildcard live
- [ ] wildcard live remains forbidden
- [ ] stable writes remain protected paths
- [ ] live/provider-originated stable-write intent is blocked by default
- [ ] legacy finalize behavior is blocked, isolated, or labeled legacy-local-learning
- [ ] EvidenceSliceReader or equivalent explicit slice semantics exist
- [ ] console/debug/fixture evidence cannot qualify stable promotion
- [x] weak attribution fields are available or accepted as a P9.1 blocker
- [x] vague proposals cannot become actionable pending proposals
- [x] LearningProposal schema/store exists before proposal generation
- [x] ReverseScaffoldFeedback exists as telemetry/proposal-seed only
- [x] proposal apply/promotion remains deferred until later guarded phases
- [x] clean live rollout is not treated as learning proof
- [x] every decision class being live-ready is not required
- [x] runtime artifacts, provider outputs, snapshots, mutable memory, `.env.local`, and API keys are not tracked

## Remaining Risks

Even after all pre-P9 feasible debt is repaired:

- weak attribution will remain noisy and delayed
- proposal quality may still skew toward plausible summaries rather than executable changes
- reason-quality detectors may still overfit language instead of strategic value
- class labels may still bias the inner scaffold toward hand-authored categories
- live evidence may remain too small or too console-assisted for some decision classes
- stable promotion may still create regression risk
- rollback will need real use before it can be trusted
- LLM strategic improvement may be slower than engineering progress
- Context OS and Budget OS self-modification remain long-horizon risks, not P9 deliverables

## Recommended Next Step

Proceed with PR-0 or PR-2 depending on team appetite:

- choose PR-0 if the team wants a no-risk coordinator refresh first
- choose PR-2 if the team is ready for the highest-value P9.0 safety hardening

Do not start PR-7 until PR-2, PR-3, and minimum evidence-slice semantics are accepted or explicitly mitigated.
