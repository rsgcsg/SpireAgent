# P8 North Star Alignment Audit - 2026-07-04

This report audits whether P8/P8.5 work is still moving toward the project's North Star: an LLM-centered predictive cognitive scaffold, not a pile of hard-coded rules, prompt patches, budget caps, review metrics, and debug workarounds.

It is a report, not the canonical current status. Current phase/blocker/next-step authority remains `../04_CURRENT_STATUS.md`.

## Executive Summary

The project is still broadly aligned with `PROJECT_NORTH_STAR.md`. The strongest evidence is that the core object chain exists in recorded transitions: `StrategicImpression`, `SalienceSignal`, `MemoryActivation`, `CandidateFuture`, `DeliberationPacket`, `PredictionErrorRecord`, replay/eval/review, proposal-only consolidation, provider failure classification, budget governance telemetry, and strict safe execution.

The main risk is not that the project has already become a rules bot. It has not. The risk is that P8.4/P8.5 pressure is pulling some inner scaffold mechanisms into fixed heuristics: candidate-future compression caps, prompt field selection, reason-quality checks, budget profiles, rescue policy, local scoring thresholds, memory retrieval, and live-readiness gates. Some of that fixed structure is necessary as the outer safety shell. Some of it is temporary scaffold policy that should eventually become evidence-backed, inspectable, promoted, and rollback-capable.

Current P8.5 live should remain disabled. Fresh high-pressure combat provider failures are no longer the active blocker on current evidence, but CandidateFuture/reason-quality readiness remains insufficient. The next work should not be another provider-contract tuning loop unless a fresh blocker appears. It should improve attribution: identify whether `missing_tradeoff` / `missing_survival_line` comes from CandidateFuture generation, compression, prompt contract, LLM output, or the review signal itself.

## Closest To The North Star

- Safe execution shell is strong. The LLM selects from validated candidates; it does not execute raw actions, invent candidate ids, bypass validation, enable live additive, or write stable learning layers.
- Transition truth is strong. Executed actions are recorded through executor-logged transitions with pre/post state, checkpoint/diff, selected action, candidate context, and replay/eval compatibility.
- Cognitive objects are real enough to audit. `src/agent/cognitiveScaffold.ts` builds strategic impressions, salience, memory activation, candidate futures, and deliberation packets in shadow mode.
- Prediction-error and proposal surfaces exist. `PredictionErrorRecord`, attribution buckets, `ReplayFrame`, and `ConsolidationRecord` proposals are visible without applying stable updates.
- P8 workspace is feature-flagged and shadow-only by default. `full` remains the control group, and bounded modes are explicitly experimental.
- Provider reliability is classified instead of hidden. `provider_length_empty`, semantic invalidity, candidate safety, and output cap issues are separately visible.
- Budget governance is moving in the right direction. It now distinguishes call, recovery, run, evidence, rollout, and protected-path budgets at least as telemetry and doctrine.

## Most At Risk Of Drifting

- `CandidateFuture` is still heavily action-first. It has benefit/cost/risk/assumption/invalidation fields, but many values are generated from local scoring and text heuristics rather than learned future templates.
- `candidateFutureCompressor` is a fixed policy. It has good intent, but field caps and priority rules are hand-written. Long-term, this should become compression policy with evidence, conditions, promotion, and rollback.
- `reasonQuality` is a proxy, not a truth measure. It catches empty/thin/template reasons, but it can incentivize longer or keyword-heavy answers unless upgraded into a broader deliberation/scaffold attribution system.
- `scoring.ts` remains a local strategic engine in places. This is acceptable for safety and fallback today, but route/candidate/scoring policy should gradually become an auditable scaffold proposal domain rather than an expanding hidden strategy bot.
- Memory has historical stable-update behavior. `memory.ts` can update lessons, experience, and strategy params after runs. That predates the stricter P9/P10 doctrine and should be brought under guarded proposal/promotion/rollback before it becomes a learning path for P8/P8.5 decisions.
- Budget governance is mostly observability, not a learning-aware governor. It records profiles and guardrails, but it does not yet learn when high-pressure combat needs more survival context, when card rewards need deck-direction context, or when rescue budget should change by provider failure class.

## Outer Shell That Must Stay Hard

These should remain fixed safety/governance boundaries, not LLM-learned behavior:

- legal action grounding and candidate validation
- `selectedCandidateId` must come from current allowed candidates
- executor legality and state re-read/checkpoint after action
- fact layer and raw game-state truth
- provider failure classification and refusal to wash provider errors into valid output
- semantic validation strictness
- `full` as a sacred control group
- live/additive flag and human authorization requirement
- rollback triggers and rollback path
- stable memory / derived / strategy promotion gate
- API key and secret handling
- replay/eval data truth and transition ground-truth invariants

## Inner Scaffold That Should Become Learnable

These should eventually move from fixed heuristics into typed, evidence-backed scaffold objects:

- CandidateFuture templates: survival line, lethal line, resource-preservation line, greedy damage line, deck-direction line, route-risk line
- decision-class deliberation profiles: combat, card reward, map, shop, event, rest, boss, elite, high-pressure
- salience rules: what counts as danger, opportunity, uncertainty, memory resonance, irreversible risk
- memory activation conditions: which experiences apply, which are counterexamples, which should be omitted
- prompt field selection: which packet sections matter for a decision class
- compression policy: what can be summarized and what cannot be dropped
- budget allocation profile: input budget, output cap, rescue policy, thinking mode, and sample target by decision class and pressure
- reason/deliberation quality signals: whether the LLM explained the relevant tradeoff, not merely whether it used keywords

## Future Memory And Experience Model

The project should treat game-learned experience as layered, typed data:

- Episodic memory: concrete run/fight/choice/outcome/transition records. Stored as run-linked evidence, retrieved by tags and similarity, never promoted as universal truth.
- Semantic memory: abstract lessons with conditions, confidence, evidence ids, counterexamples, decay, and rollback. Stored only after proposal review and shadow validation.
- Procedural memory: reusable decision procedures or candidate-template recipes such as `generate_survival_line`, `evaluate_card_reward`, `detect_missing_scaling`, `evaluate_route_risk`.
- Salience memory: patterns that mark states as high-risk, high-value, high-error, high-uncertainty, repeated-failure, or unexpected-success.
- Candidate template memory: decision-class templates for which futures must be generated in a class of state.
- Budget/compression policy memory: conditions under which the system should allocate more workspace, preserve specific fields, disable thinking for rescue, or gather more evidence before rollout.

Layer assignment:

- Facts: raw cards/relics/game state, never learned from reflection.
- Observations: transition-local outcomes and state diffs.
- Inferences: attributed prediction errors and review judgments.
- Episodic memory: evidence-linked experiences from transitions.
- Semantic memory: promoted conditional lessons.
- Derived knowledge: curated strategic tags/rules above facts, below memory.
- Strategy hypotheses: proposal-only until shadow/eval/review promotion.
- LLM reflection: evidence input only, never stable truth by itself.
- Executed action truth: only executor-logged or reliable event-grounded actions.

## Current Engineering Debt

- Candidate futures need clearer separation between action wrapper, future prediction, and learned candidate template.
- Scoring/fallback are still strategic enough that they risk becoming a hidden rules bot if they expand without proposal/eval boundaries.
- Reason quality is currently lexical and output-only; it does not yet attribute failure to scaffold source.
- Review signals are useful blockers but not yet full repair proposals with target layer, evidence, and suggested fixture.
- Memory updates need to converge with P7/P9/P10 proposal/promotion/rollback doctrine.
- Derived knowledge is separated from facts, but stable update mechanics are not yet implemented.
- Budget governor is not yet learning-aware; it records policy but does not propose budget/compression changes from evidence.
- Compression is still a token/reliability strategy more than a learned strategic-impression policy.
- DeliberationPacket is inspectable, but P8 work still pressures it toward provider-friendly JSON rather than deliberate workspace adaptation.
- Replay/eval can surface proposals, but cannot yet promote/rollback candidate template, memory, budget, or compression policy.
- Zero-memory start is conceptually possible, but not yet proven as a clean mode with learning disabled/enabled boundaries.
- Shadow learning is mostly safe today because it is proposal-only, but historical memory update paths should be audited before any new learning loop uses them.

## ReasonQuality Long-Term Position

`reasonQuality=thin`, `missing_tradeoff`, and `missing_survival_line` are useful smoke alarms. They should remain review signals for live-readiness.

They should not become the final objective. A model can satisfy them by writing keyword-rich filler, and a terse but correct reason can fail them. Long-term this should become:

- `DeliberationQuality`: did the LLM mention the decisive factor and main tradeoff?
- `ScaffoldQuality`: did the workspace expose the information needed to make that tradeoff?
- `CandidateFutureQuality`: did each relevant future preserve benefit/cost/risk/uncertainty/assumption/invalidation?
- `BudgetCandidateQuality`: did compression/budget policy preserve the decisive information under the current profile?

Every thin reason should be attributed to one or more likely sources:

- candidate future missing the tradeoff
- compressor removed survival/tradeoff detail
- prompt contract failed to request the decisive tradeoff
- provider output was truncated/empty
- LLM ignored available scaffold
- review heuristic is too brittle

## Learning-Aware Budget Governor Route

Stage 0: current state.

- Fixed env/config caps plus telemetry.
- Provider recovery policy observed.
- Evidence/rollout/protected-path budgets recorded.

Stage 1: attribution-only governor.

- Attach budget/compression attribution to quality failures.
- Record whether missing tradeoff came from before-compression, after-compression, output, or review.
- Do not change caps automatically.

Stage 2: proposal-only governor.

- Generate budget/compression proposals such as:
  - preserve survival line in high-pressure combat
  - raise rescue cap for provider length/empty
  - allocate more candidate futures for card rewards
  - shorten non-decisive prediction checks
- Proposals are stored as shadow/eval artifacts only.

Stage 3: shadow policy experiments.

- Run named budget/compression profiles in shadow with fixed gates.
- Compare full baseline, bounded futures, strategic compact, and recovery policy variants.

Stage 4: guarded promotion.

- Promote a budget/compression policy only with fresh evidence, rollback, versioning, and no stable memory contamination.
- Live additive remains stricter than shadow.

Stage 5: learned deliberation profiles.

- Decision-class profiles choose workspace depth, candidate count, memory activation, compression, output cap, and rescue policy from evidence-backed policy objects.
- The outer shell still enforces hard caps and protected paths.

## Zero-Memory To Learned Scaffold Route

The route is feasible, but not complete.

1. Start with raw mechanics, fact DB, legality, execution safety, budget hard caps, replay/eval, provider classification, and no stable strategic memory.
2. Record transitions with cognitive scaffold objects and prediction checks.
3. Turn prediction errors into typed attribution.
4. Generate proposal-only updates for memory, candidate templates, salience, compression, budget, and deliberation profiles.
5. Run proposals in shadow/eval windows.
6. Promote only with evidence, conditions, confidence, counterexamples, and rollback.
7. Keep facts, observations, inferences, LLM reflection, and stable strategy separate.

The missing piece is a guarded applicator/promotion layer that can safely move proposals into stable memory/derived/template/policy stores.

## P8.5 Minimum Next Step

Do not enable live yet.

The smallest useful next step is an attribution pass for current quality blockers:

1. For fresh `combat:llm_required` samples, compare candidate futures before compression, after compression, and model output.
2. Record whether survival/tradeoff detail exists at each stage.
3. Split `missing_tradeoff` / `missing_survival_line` into source-attributed signals.
4. If source is CandidateFuture generation, improve the candidate template.
5. If source is compression, adjust compression policy minimally.
6. If source is prompt/output, adjust reason contract minimally.
7. If source is review heuristic, refine the metric without weakening safety.

Only after this attribution is clear should the project collect another small fresh live-eligible shadow window.

## What Not To Do Now

- Do not enable P8.5 live/additive.
- Do not loosen validation.
- Do not let shadow decisions execute.
- Do not make `full_bounded_candidate_futures` replace `full`.
- Do not keep increasing output cap or shrinking workspace without attribution.
- Do not turn reasonQuality into a keyword game.
- Do not add stable memory/derived/strategy writes from P8 review signals.
- Do not rewrite the controller.
- Do not build a large budget platform before the attribution signals exist.
- Do not treat historical provider failures as current blockers once fresh revision evidence is clean, but also do not erase them.
