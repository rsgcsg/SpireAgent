# LLM Handoff

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
7. `CONTRIBUTING_OR_ENGINEERING_RULES.md`

## Current State

The project has completed Phase 0, Phase 1, the Phase 2 minimum data-loop MVP, the Phase 2.5 offline engineering eval runner, and Phase 2.6 eval warning classification/noise reduction. The formal route now extends through Phase 10, where the target is a complete Guarded Learning Loop.

The permanent mission is to build an agent scaffold system that lets a zero-experience LLM agent progressively unlock and express its full strategic potential through real play, structured perception, memory, candidate futures, deliberation, replay, prediction-error learning, and guarded improvement.

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
- P8.5 preparation metadata and compact workspace summary generation are present, but live integration remains disabled. The only allowed first experiment is additive `legacy prompt + compact workspace summary`, not structured-prompt-only by default.
- With default flags, live behavior is unchanged: legacy prompt remains the live prompt, candidate generation/order/scoring/fallback/validation/execution are unchanged, and no stable memory/derived/strategy updates occur.
- Replay/eval/review expose P8 workspace coverage and stats. Disagreement is a review signal, not a program failure.

P8.x next route:

- P8.3 real shadow call: continue collecting small real shadow samples by decision class; record agreement/disagreement/invalid/missing-candidate/reason quality/token/latency/cost without executing the shadow decision.
- P8.4: collect real shadow A/B samples by decision class and keep disagreement as review signal, not FAIL.
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
