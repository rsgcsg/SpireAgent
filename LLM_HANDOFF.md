# LLM Handoff

> Status note: this is a working handoff and recent engineering-context document, not the canonical source of truth for current phase, blocker, roadmap, or architecture. Start from `docs/00_START_HERE.md` and `docs/04_CURRENT_STATUS.md`, then use `PROJECT_NORTH_STAR.md`, `PROJECT_PLAN.md`, `ARCHITECTURE.md`, `DATA_SCHEMA.md`, and `REPLAY_AND_EVAL.md` for enduring authority.

Current project directory:

```text
/Users/fire/Desktop/SpireAgent
```

Read first:

1. `PROJECT_NORTH_STAR.md`
2. `PROJECT_AUTHORITY_GUIDE.md`
3. `PROJECT_PLAN.md`
4. `ARCHITECTURE.md`
5. `GAME_IO_CAPABILITIES.md`
6. `DATA_SCHEMA.md`
7. `BUDGET_GOVERNANCE.md`
8. `CONTRIBUTING_OR_ENGINEERING_RULES.md`

## Current State

The project has completed Phase 0, Phase 1, the Phase 2 minimum data-loop MVP, the Phase 2.5 offline engineering eval runner, and Phase 2.6 eval warning classification/noise reduction. The formal route now extends through Phase 10, where the target is a complete Guarded Learning Loop.

The permanent mission is to build an agent scaffold system that lets a zero-experience LLM agent progressively unlock and express its full strategic potential through real play, structured perception, memory, candidate futures, deliberation, replay, prediction-error learning, and guarded improvement.

Budget should now be read as a cross-cutting governance topic rather than a provider-only tuning topic. `BUDGET_GOVERNANCE.md` defines the intended separation between call budget, recovery budget, run budget, evidence budget, rollout budget, and protected-path budget.

BG-1/BG-2 have an initial code anchor: `src/agent/budgetGovernance.ts` resolves `STS2_BUDGET_GOVERNANCE_PROFILE` and records structured governance metadata in `workspaceComparison.budget`. This is observability and policy interpretation only; it does not enable live additive or stable learning writes.

BG-3 has an initial telemetry anchor: `src/agent/providerRecoveryPolicy.ts` summarizes existing DeepSeek primary/rescue attempts into `shadowWorkspaceDecision.providerRecoveryPolicy`. It is attempt-lineage reporting only; it does not alter retry behavior, output caps, workspace compression, validation, or live behavior.

BG-4 has an initial readiness anchor: `src/replay/evidenceBudget.ts` adds `P8LiveReadinessAssessment.evidenceBudget`, making fresh sample sufficiency and mixed-window promotion risk explicit. It does not override provider/safety/reason-quality blockers.

BG-5/BG-6 have an initial rollout/protected-path anchor: `src/replay/rolloutBudget.ts` adds `P8LiveReadinessAssessment.rolloutBudget`, documenting additive live authorization, rollback, whitelist, and stable-write constraints without enabling any live or learning mutation path.

The active North Star is the LLM-centered predictive cognitive scaffold described in `PROJECT_NORTH_STAR.md` and `PROJECT_NORTH_STAR_CHINESE.md`. Current work should migrate the existing working loop toward `StrategicImpression`, `SalienceSignal`, `MemoryActivation`, `CandidateFuture`, `DeliberationPacket`, `PredictionErrorRecord`, `ReplayFrame`, and `ConsolidationRecord` without large controller rewrites or untested strategy changes.

P1 through P10 are a maturity route, not a checklist. The constraint is strict:

- P1 through P2.6: trusted boundaries, recording, replay/eval first; no intelligence chasing.
- P3 through P6: shadow-visible, testable cognitive scaffold objects.
- P7: evidence-backed learning proposals only; no automatic learning.
- P8: feature-flagged `DeliberationPacket` entry into the LLM strategic workspace while preserving the legacy prompt.
- P9: guarded stable memory / derived / scoring updates only with evidence, thresholds, and rollback.
- P10: complete guarded learning loop.

Before advancing any phase, verify that the change improves LLM seeing, remembering, imagining, deliberating, replaying, or learning; preserves the LLM as strategic player; keeps fact / observation / inference / memory / derived / reflection separated; stays replayable/evaluable/testable/rollback-capable; avoids premature stable-state contamination; and improves decision quality rather than merely increasing coverage fields.

Phase 3.0 shadow-mode P0 is now implemented:

- `src/agent/cognitiveScaffold.ts` builds `StrategicImpression`, `SalienceSignal[]`, `MemoryActivation`, `CandidateFuture[]`, and a shadow `DeliberationPacket`.
- `AgentController` constructs these after existing scoring and passes them to `AgentDecisionRecorder`.
- `AgentDecisionRecorder` writes them to new executor-logged transitions.
- Replay/eval report cognitive coverage.
- This does not change prompt construction, candidate ordering, selected action, fallback behavior, or execution semantics.

P1 shadow DeliberationPacket is now implemented:

- `DeliberationPacket` contains structured state facts, enemy intent, hand/deck summaries, legal actions, top candidates, run memory summary, derived summary, strategic impression, salience, memory activation, candidate futures, output schema, and prompt parity.
- `promptParity` records coverage metadata without storing the full live prompt.
- `predictionError` records a minimal prediction-vs-checkpoint result.
- `agent:review`, `data:replay`, and `data:eval` expose coverage.
- This still does not replace the live prompt or change action selection.

P8 DeliberationPacket strategic workspace shadow surface is now implemented:

- `src/agent/workspace.ts` serializes the current `DeliberationPacket` into a structured LLM workspace.
- New transitions can carry `workspaceComparison` with legacy prompt hash, structured prompt hash, byte/token estimates, decision class, coverage, required/preserved/missing legacy sections, per-section token estimates, information-preservation score, provider readiness, and gated readiness.
- New transitions can carry `shadowWorkspaceDecision`, which records optional structured shadow LLM outcomes, skipped/unavailable provider paths, agreement/disagreement, missing candidate, invalid output, reason quality, risk tags, missing info, scaffold feedback, or error.
- P8.1 readiness / information-preservation scoring is implemented.
- P8.2 DeepSeek V4 Flash provider/parser/schema/error-path preparation is implemented without calling the provider by default. DeepSeek is wired as a P8 workspace decider, not as a replacement for the legacy live-prompt decider.
- P8.3 real-provider shadow-call plumbing is implemented with conservative token/call/cost/timeout guards, usage/latency capture, and skipped budget outcomes. A real DeepSeek V4 Flash shadow call has been validated with one recorded sample; the shadow decision was valid, agreed with the live local choice, and was not executed.
- `STS2_P8_WORKSPACE_SHADOW` defaults off and blocks readiness by default.
- `STS2_P8_WORKSPACE_CALL` defaults off and blocks extra structured LLM calls by default.
- `STS2_DEEPSEEK_API_KEY` is required before DeepSeek V4 Flash can become available for shadow calls. The legacy live decider path does not read this key.
- P8.4 A/B gate visibility is implemented in replay/eval/review: decision class, readiness, budget status, agreement/disagreement, missing sections, invalid/missing-candidate/error stats, reason quality, cost, latency, and go/no-go.
- P8.4 empty-content stabilization now hardens the DeepSeek request contract: `json_mode` uses `response_format: {"type":"json_object"}`, explicit JSON-only prompts with a target object example, `temperature=0`, `top_p=0.1`, and at most one provider-level rescue retry for `empty_content`. Replay/eval/review expose provider mode plus retry count/success.
- P8.4 workspace ablation is shadow-only through `STS2_P8_WORKSPACE_ABLATION_MODE=full|full_bounded_candidate_futures|compact|ultra_compact`. `full` remains the unchanged control group. `full_bounded_candidate_futures` is the v5 combat-only bounded serialization experiment for `candidate_futures`; it does not alter live prompt/candidates/scoring/fallback/validation/execution.
- P8 v5 also records workspace-size telemetry on `workspaceComparison.coverage`: compression mode, candidate-futures bytes/tokens before vs after, full workspace bytes/tokens before vs after, futures truncated/omitted, truncated-field counts, largest field sources, repeated-text estimate, and information-preservation estimate.
- P8 cleanup/provider-contract hardening is now in progress as a follow-up to the v5 audit:
  - bounded combat future serialization has a dedicated module seam (`candidateFutureCompressor`) instead of continuing to grow inside workspace assembly.
  - workspace experiment flags/revision/mode normalization have a dedicated config module (`workspaceExperimentConfig`).
  - provider failure classification and reason-quality assessment are centralized (`providerFailureClassifier`) so replay/eval/review can distinguish provider reliability, semantic validation, and candidate-safety failures.
  - `full` remains the control group; smoke invariants still require `mode=full -> compressionMode=none`.
  - DeepSeek request telemetry now records whether thinking was left at the provider default or explicitly overridden, plus whether `reasoning_content` appeared in the response.
  - CandidateFuture quality review telemetry now records serialized-future completeness plus review-only shallow/missing signals and proposal-only improvement signals, so P8.4 can be judged on strategic workspace quality instead of only provider JSON validity.
  - High-pressure combat provider blocker follow-up identified a specific failure mode on fresh `combat:llm_required` calls: `finishReason=length`, `content=""`, `reasoning_content` present, and both rescue attempts also hit `length` because they shrank output caps to `120/140` while leaving thinking at the provider default.
  - The current minimal fix keeps primary shadow behavior unchanged, but hardens rescue behavior: rescue retries now use explicit disabled thinking by default via `STS2_DEEPSEEK_RESCUE_THINKING_MODE`, and rescue output caps are widened via `STS2_DEEPSEEK_TRUNCATION_RESCUE_MAX_OUTPUT_TOKENS` / `STS2_DEEPSEEK_EMPTY_RESCUE_MAX_OUTPUT_TOKENS` so `length+empty` can recover instead of repeating the same provider contract failure.
- P8.5 preparation metadata and compact workspace summary generation are present, but live integration remains disabled. The only allowed first experiment is additive `legacy prompt + compact workspace summary`, not structured-prompt-only by default.
- With default flags, live behavior is unchanged: legacy prompt remains the live prompt, candidate generation/order/scoring/fallback/validation/execution are unchanged, and no stable memory/derived/strategy updates occur.
- Replay/eval/review expose P8 workspace coverage and stats. Disagreement is a review signal, not a program failure.

P8.4 stop criteria are now intentionally narrow:

- provider/output contract is stable enough for shadow use; low-frequency provider failures are bucketed, not hidden
- `invalidChoice=0` and `missingCandidate=0`
- live-eligible provider failures stay low-frequency and explainable by telemetry
- `full` remains unchanged as the control group
- reason quality is not broadly collapsing into `missing` or thin template output
- CandidateFuture serialization still preserves tactical facts, tradeoff, risk/uncertainty, and invalidation structure rather than collapsing into a shallow action list
- shadow P8 does not alter live prompt behavior and does not write stable memory, derived knowledge, or strategy params

Once those are true, additional `selectedCandidateId` / retry / compression tuning becomes diminishing-return work; the main focus should shift back toward CandidateFuture quality, missing/shallow candidate signals, and prediction-error learning evidence.

Latest live-readiness note:

- P8.5 static pre-audit is still passed, but additive live remains blocked by workspace-quality evidence rather than provider reachability.
- `combat:llm_required` is now provider-clean post-recovery; remaining readiness work is to keep survival/tradeoff lines visible in bounded combat summaries.
- `card_reward:llm_required` and `map:llm_required` should currently be treated as CandidateFuture quality/readiness work, not JSON-contract work.
- Keep provider work limited to blocker-class failures. Do not keep widening the output contract or further shrinking `candidate_futures` unless fresh evidence shows a new blocker.
- Fresh 20-call readiness sampling on `full_bounded_candidate_futures` improved `card_reward:llm_required` completeness from `0/4` to `4/8`, but `map:llm_required` is still shallow and fresh live-eligible evidence is still too thin to justify live additive.
- Terminal `llm_unavailable` on executed decisions refers to the live LLM route staying disabled/unavailable; it does not mean the DeepSeek shadow provider was absent. Use `shadowWorkspaceDecision` / replay-eval-review telemetry for P8 readiness judgments, not the executor fallback banner alone.

P8.5 live gate and rollout discipline:

- Current state: `P8.5` may continue on static / pre-live audit, but additive live is still `no_go`.
- Fresh `combat:llm_required` failures at transitions `transition-000130-agent-mr4sg5sl-xm6o7z` and `transition-000131-agent-mr4sh7t9-l925tb` were the blocker that forced the high-pressure recovery pass.
- Targeted replay retest on current code recovered both transitions as valid with `reasonQuality=adequate`, `finishReason=stop`, `failureBucket=none`, and no semantic-validation relaxation. One retest explicitly exercised recovery: primary `length+empty`, then truncation rescue with `thinking=disabled` and independent rescue cap returned valid JSON. A second retest had both calls succeed on primary, so fresh runtime high-pressure evidence is still required before changing readiness.
- Default remains off: `STS2_P8_LIVE_ADDITIVE=0`.
- The first allowed live experiment, when explicitly authorized, is additive only: legacy prompt plus compact workspace summary. Structured-prompt-only live routing is not allowed here.
- `full` remains the control baseline. `full_bounded_candidate_futures` remains an experiment mode and must not silently replace `full`.
- The first possible live whitelist is narrow: start with `combat:llm_required` only. `card_reward:llm_required` may be considered only after separate evidence clears non-combat tradeoff quality. `map:llm_required` must not enter the first live slice.
- Hard blockers before any live additive enable:
  - any live-eligible `invalid_output`, `invalid_choice`, `missing_candidate`, or `error` in the target decision class window
  - provider reliability still being a current blocker rather than a historical bucketed issue
  - fresh target-class evidence still dominated by `reasonQuality=thin|missing`
  - CandidateFuture tradeoff/completeness regressions that make the additive context look like a shallow selector prompt
  - any path that would write stable memory, derived knowledge, or strategy params
- Acceptable WARNs for pre-live only:
  - historical network outage buckets outside the fresh revision window
  - shadow disagreement without validation failure
  - budget-skipped shadow transitions
- Recommended minimum pre-live evidence standard:
  - provider/output contract stable enough in fresh target-class samples
  - `invalidChoice=0`
  - `missingCandidate=0`
  - live prompt / candidate generation / scoring / fallback / validation / execution unchanged
  - `reasonQuality` not collapsing into mostly `thin` / `missing`
  - replay/eval/review can still separate provider failure, semantic invalidity, and candidate-quality issues
- Rollout order once live is explicitly authorized:
  - Step 1: enable additive live only for `combat:llm_required`
  - Step 2: keep legacy fallback, semantic validation, and executor legality checks unchanged
  - Step 3: record fresh rollout slices separately from mixed historical windows
  - Step 4: review provider failure, live-eligible invalid/error, reason quality, and fallback rates before any whitelist expansion
  - Step 5: only then consider `card_reward:llm_required`; `map:llm_required` needs its own fresh called evidence and tradeoff-quality pass first
- Immediate rollback triggers for any future live additive test:
  - any live-eligible invalid/error outcome
  - any `invalid_choice` or `missing_candidate`
  - provider truncation / empty-content failures recurring in the whitelisted live slice
  - noticeable tradeoff-quality collapse or widespread `reasonQuality=missing`
  - any hint that additive context is bypassing legacy validation/fallback boundaries
- Rollback action is simple and mandatory:
  - set `STS2_P8_LIVE_ADDITIVE=0`
  - restore legacy-only prompt path
  - preserve replay/eval/review evidence from the failed rollout window
- A/B recording requirements for any future live additive window:
  - distinguish `legacy_only`, `shadow_only`, and future `live_additive_enabled` windows
  - always group by decision class, revision tag, and budget window
  - do not mix historical outage windows into fresh rollout judgments
  - keep disagreement as review signal, not FAIL, unless it crosses validation/safety boundaries
- Fixed readiness status vocabulary now used for report-side judgments:
  - `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - `READY_FOR_P8_5_LIVE_COMBAT_AND_CARD_REWARD`
  - `NOT_READY_PROVIDER_BLOCKER`
  - `NOT_READY_LIVE_SAFETY_BLOCKER`
  - `NOT_READY_REASON_QUALITY`
  - `NOT_READY_CANDIDATE_FUTURE_QUALITY`
  - `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE`

P8.x next route:

- P8.3 real shadow call: continue collecting small real shadow samples by decision class; record agreement/disagreement/invalid/missing-candidate/reason quality/token/latency/cost without executing the shadow decision.
- P8.4: collect real shadow A/B samples by decision class and keep disagreement as review signal, not FAIL.
- Before more P8.4 tuning, prefer provider-contract clarity over further workspace shrinkage: verify thinking/json/output-budget behavior with small shadow-only A/B samples before changing defaults.
- P8.5: gated live prompt integration only after explicit request; first version must be additive with legacy prompt fallback, not structured-prompt-only by default.
- P9/P10: gradually relax shadow boundaries only when guarded update/eval/rollback infrastructure exists. Do not jump directly from P8 shadow disagreement to stable memory, derived knowledge, strategy params, candidate ordering, or autonomous learning.

STS2 console debug support:

- `STS2_CONSOLE_DEBUG_RUNBOOK.md` documents console commands as debug/fixture tooling for adapter debugging, replay/eval fixtures, P8/P9 state reproduction, and cost-controlled testing.
- Console-modified runs are debug/fixture data only and must not be used as real strategy baselines or stable learning evidence.

Implemented and working:

- TypeScript agent CLI.
- REST game client for STS2 MCP.
- State normalization.
- Candidate generation.
- Local scoring and decision routing.
- LLM command/bridge integration.
- P8 structured workspace prompt surface, comparison, and shadow decision audit.
- LLM unavailable/invalid fallback.
- Checkpoint/state-diff audit after real actions.
- Run memory, long-term memory, experience memory, strategy params.
- Snapshot-only collector.
- Agent executor transition recorder.
- `data/runs/<runId>/` writer for real executed agent actions.
- Minimal replay reader and `npm run data:replay`.
- Minimal offline eval runner and `npm run data:eval`.
- Grouped eval warning summary and lightweight strategy quality metrics.
- Review summary.
- Local Spire Codex fact cache.

Phase 1 anchors:

- Document source-of-truth cleanup.
- `domain-core` types.
- `GameIO` interfaces.
- STS2MCP adapter capability object.
- `TransitionRecord` schema and ground-truth invariants.
- Snapshot-only compatibility helpers.
- `src/domain/types.ts`
- `src/game-io/types.ts`
- `src/adapters/sts2mcp/capabilities.ts`
- `src/data/transitionSchema.ts`
- `validateLlmDecisionForCandidates()` in `src/agent/llm.ts`

Phase 2 MVP anchors:

- `src/agent/decisionRecorder.ts`
- `src/replay/reader.ts`
- `src/replay/cli.ts`
- `src/eval/runner.ts`
- `src/eval/cli.ts`
- `npm run data:replay`
- `npm run data:eval`

Known gaps:

- Offline eval strategy checks are lightweight metrics/WARNs only. They are not policy tuning or training.
- Historical runs may contain pre-fix transition evidence. If `npm run data:eval -- --run-id <oldRun>` fails on an old run, inspect the errors before treating it as a current-code regression.
- Current live loop does not yet populate formal North Star cognitive objects on every transition.
- No reliable human UI event log from current STS2MCP.
- Human data is snapshot/diff-inferred only and is not ground truth.
- No HumanPlayRecorder diff fallback implementation yet.
- `controller.ts`, `candidates.ts`, and `scoring.ts` still need gradual decomposition.

## Baseline

```bash
npm install
npm exec tsc -- --noEmit
npm run agent:smoke
npm run agent:review
npm run check
```

If game/MCP is running:

```bash
npm run collect:state
npm run agent:tick -- --dry-run
```

Short real action validation should start with:

```bash
npm run agent:run -- --max-ticks 10 --delay-ms 120
npm run data:replay
```

Do not do long live runs before the offline baseline passes.

## Latest Desktop Validation

On 2026-07-01 in `/Users/fire/Desktop/SpireAgent`, local validation passed:

- `npm install`
- `npm exec tsc -- --noEmit`
- `npm run agent:smoke`
- `npm run agent:review`
- `npm run check`
- `npm run data:replay -- --latest`
- `npm run data:eval -- --latest`

Live MCP validation also exercised:

- `npm run collect:state`
- `npm run agent:tick -- --dry-run`

The latest known local run in this Desktop clone is `run-mr1jyh2e-5hmiwn`. After Phase 6 planning and attribution validation, `npm run data:eval -- --latest` returns `WARN` with zero errors: 60 parsed transitions and 60 selected actions matched regenerated candidates. Cognitive scaffold coverage is partial because only newer transitions were recorded after the shadow scaffold landed. The latest eval reports `candidateFuturePredictionChecks=2/60`, `predictionError=5/60`, `replayFrame=3/60`, and `withAttributionBuckets=1/60`.

P2 specifically added read-only derived knowledge retrieval into the shadow packet. Fresh transitions should now carry `derivedSnapshot`, `DeliberationPacket.derivedKnowledgeSummary`, and no `derived_knowledge` prompt-parity gap when retrieval succeeds. Prediction-error evidence now includes damage/defense/hp/card-flow/phase/resource attribution from checkpoint state-diff evidence.

P3/P4/P5 shadow refinement is now partially implemented:

- `PredictionErrorRecord.evidence[0].typedChecks` records typed prediction checks.
- `CandidateFuture.predictionChecks` is now the preferred source for typed checks; `predictedOutcome` remains for compatibility/readability.
- New transitions can carry a `ReplayFrame` MVP.
- Unsupported prediction errors can create proposed `ConsolidationRecord` objects with conditions and rollback.
- Eval reports typed-check, attribution, consolidation, and `events.jsonl` parse coverage.
- Current STS2MCP REST capabilities still do not provide reliable event logs or human ground-truth events.

Phase 6 CandidateFuture attribution is now implemented as the current MVP:

- `PROJECT_PLAN.md` and `PROJECT_AUTHORITY_GUIDE.md` define Phase 6 through Phase 10, with Phase 10 as the Guarded Learning Loop.
- `PredictionErrorRecord.attributionBuckets` records typed shadow buckets for damage/defense/HP/kill/phase/card-flow/resource/unknown attribution.
- P6 is now tied more tightly to CandidateFuture Doctrine: `CandidateFuture.predictionChecks.expected` carries mechanics-informed expected records, and new checkpoint diffs include `enemyDeltas` for damage/kill actual evidence.
- Eval/review report attribution bucket coverage, bucket counts, and bucket status counts.
- Latest live validation wrote one executor transition with attribution buckets.

Phase 7 proposal surface MVP is now implemented:

- `ConsolidationRecord` can carry `affectedModule`, `proposedChange`, `expiry`, `revalidation`, `createdAt`, lifecycle status, `proposalKind`, `evidenceStrength`, and `blockedStableTargets`.
- Fresh runs create `proposals.jsonl`; old runs remain readable through transition-level `consolidation` fallback.
- Replay/eval/review report proposal counts, pending review, status counts, target layer counts, evidence strength, and mutating/accepted risk.
- P7.5 proposal aggregation is implemented. Replay/eval/review now group proposal evidence by target layer, proposed action, and actionable attribution bucket, surfacing occurrences, recurring groups, representative transitions, grouped evidence strength, and forbidden stable mutations.
- Proposals are generated only from unsupported or critical attribution buckets. Unknown/low-visibility attribution remains an evidence gap.
- Proposals remain non-mutating; Phase 9 guarded stable updates are not implemented yet.

Current maturity boundary:

- P1-P7 are scaffold, evidence, replay/eval, and proposal-surface work.
- They do not change live prompt, scoring, candidate ordering, fallback, validation, execution, stable memory, derived knowledge, or strategy params.

Planned route:

- Phase 8: move `DeliberationPacket` toward the LLM strategic workspace for gated high-dispute decisions. This is not a raw prompt swap; it is giving the LLM a better workspace while preserving validation/fallback.
- Phase 9: add a guarded stable-update applicator for a narrow low-risk update class.
- Phase 10: close the Guarded Learning Loop from prediction to guarded update and rollback-capable replay/eval validation.

Before continuing a live run, re-read current game state. The latest observed validation action in this Desktop clone was `Strike` in Act 1 floor 5 combat against `SEAPUNK_0`; do not assume the state is still stable.

## Historical Phase 2.5 Notes

Phase 2.5 live hardening fixed:

- event loading screens no longer emit generic proceed candidates
- disabled menu options are filtered, and post-embark run-start menu transition states wait instead of clicking stale menu actions
- full potion reward states avoid direct blocked `claim_reward`
- potion actions use raw slot identity instead of potion array index
- self/buff potions no longer receive enemy targets
- automatic potions such as `Fairy in a Bottle` are not manually used
- rest post-choice flow gets a short settlement backoff before proceed

Those notes are preserved as historical context from the sibling portable project. Revalidate in this Desktop clone before relying on any run ID or floor.

## Historical Phase 2.5 Live Stability Notes

On 2026-07-01, the sibling portable-project run `run-mr0rfdcb-yewhg8` was extended substantially:

- A stale `play_card` settlement bug was fixed after REST rejected a stale hand index.
- A multi-card `card_select` repeated-toggle bug was fixed after `Pael's Tooth` kept selecting `index=0`.
- replay/eval short action labels now include card/action indices, so indexed selections are not collapsed into false repeated no-progress.

In that project at that time, `npm run data:eval -- --latest` returned `WARN` with zero errors. After the fixes, a fresh 200 tick run completed from Act 2 floor 20 rewards to Act 2 floor 31 combat. The run had 574 parsed transitions and 574 selected actions matched regenerated candidates.

Do not treat normal HP loss, imperfect fallback choices, or route/card-pick disagreement as stop conditions. Phase 2.5 has enough engineering signal to proceed to Phase 2.6 planning/implementation. Keep hard/unknown checkpoints, settlement audit warnings, and historical repeated no-progress evidence as follow-up inputs rather than current blockers.

## Historical Phase 2.6 Eval Classification Notes

On 2026-07-01, eval WARN output was grouped into actionable categories:

- `normal_flow_checkpoint`
- `acceptable_settlement_timeout`
- `program_risk`
- `historical_fixed_evidence`
- `strategy_quality`
- `needs_fixture_bug_candidate`

The CLI keeps detailed info-level noise in `warningSummary` and prints focused warnings only when they are actionable, risk-level, or strategy-quality metrics. Normal menu/reward/map/rest/card-select transitions, expected combat hard checkpoints, and low-visibility settlement timeouts are no longer mixed into the top-level warning list.

Historical validation run:

- `run-mr192jap-y1qb0x`
- 142 parsed transitions, 142 selected actions matched regenerated candidates
- `npm run data:eval -- --latest`: `WARN`, zero errors
- `needs_fixture_bug_candidate`: 0 after classification refinement
- focused warnings are strategy-only: block deficit, one low-pressure potion use, fallback-heavy decisions
- current live state after the 200 tick verification: Act 1 floor 15 rewards, HP 39/75, gold 11

This is sufficient to enter Phase 3 combat plan/checkpoint continuation. Do not tune strategy before preserving the eval categories and keeping zero-error replay/eval on a fresh run.
