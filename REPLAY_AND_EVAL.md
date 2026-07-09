# Replay And Eval

Replay and eval are the observability loop for learning safely. Under the North Star, replay should support prediction-error attribution, not just summarize what happened.

## Current State

Implemented:

- `npm run collect:state`
- `npm run collect:watch`
- `npm run agent:review`
- decision log with route, LLM audit, fallback, checkpoint
- `AgentDecisionRecorder` for executed agent actions
- `data/runs/<runId>/metadata.json`
- `data/runs/<runId>/snapshots/`
- `data/runs/<runId>/events.jsonl`
- `data/runs/<runId>/transitions.jsonl`
- minimal `data/runs/<runId>/replay.json` placeholder
- replay reader timeline helpers
- `npm run data:replay -- <runId-or-run-dir>`
- `npm run data:eval -- --latest`
- `npm run data:eval -- --run-id <runId>`
- `npm run data:eval -- --run-dir <path>`
- grouped eval warning summary
- lightweight strategy quality metrics
- cognitive scaffold coverage for shadow-mode `StrategicImpression`, `SalienceSignal[]`, `MemoryActivation`, `CandidateFuture[]`, and `DeliberationPacket`
- DeliberationPacket section coverage, prompt parity coverage, and PredictionErrorRecord coverage
- P8 DeliberationPacket workspace comparison coverage and optional shadow LLM decision stats

Missing:

- human recorder with diff fallback
- labeled-example export
- guarded stable learning applicator
- event-log adapter for reliable human/game event capture

## Replay Goal

Replay does not need to drive the real game at first. It should read run data and answer:

- What screen was this?
- What did the agent or human see?
- What legal actions were available?
- Which action was selected?
- Was it local, LLM, fallback, human, or inferred?
- What changed after the action?
- What did memory and derived knowledge say at that time?
- What did the system predict would happen?
- What actually happened?
- Which layer should be repaired: normalization, salience, memory activation, candidate future, LLM decision, validation, execution, checkpoint, or eval?

## Eval Goal

Offline eval runs deterministic engineering checks over saved transitions. It normalizes pre-state snapshots, regenerates candidates, and emits lightweight strategy-quality metrics. Strategy metrics are WARN-only signals, not FAIL criteria and not policy tuning.

The eval runner is retrospective by design. If candidate legality is fixed after a live run, old transitions can become `FAIL` because the selected historical action no longer matches regenerated legal candidates. Treat that as useful bug evidence, then validate current code on a fresh run.

As of Phase 2.6, a fresh run returning `WARN` with zero errors is acceptable for engineering health when the focused warnings are strategy-quality metrics or documented audit categories. Normal flow and acceptable settlement warnings are summarized in `warningSummary` instead of flooding the top-level `warnings` list.

As of Phase 3.0, replay/eval also report cognitive coverage. Old runs are expected to show low or zero coverage; that is a WARN-level visibility signal, not a FAIL. New executor-logged transitions should start carrying full shadow scaffold objects.

As of P1, eval summary also reports:

- `deliberationCoverage`: whether structured packet sections exist.
- `derivedKnowledgeSummary`: whether the packet includes a read-only summary of retrieved derived knowledge.
- `promptParityCoverage`: whether the shadow packet covers the old prompt inputs without storing the full prompt.
- `predictionErrorCoverage`: whether a minimal prediction-vs-checkpoint record exists.
- `consolidationCoverage`: whether shadow-only consolidation proposals were recorded.

Old transitions will remain partial. Treat coverage warnings as migration visibility unless fresh transitions stop carrying these fields.

As of P2, replay coverage also reports `derivedSnapshot` and `derivedKnowledgeSummary`. Eval still treats missing coverage on old transitions as WARN-level migration visibility, not a run failure.

As of P3/P4/P5, replay coverage also reports `replayFrame` and `consolidation`. Eval reports typed prediction-check coverage, attribution coverage, consolidation proposal coverage, and parsed event count from `events.jsonl`. Current STS2MCP REST still does not provide a reliable event log, so `parsedEvents=0` is expected unless a future adapter writes events.

As the P3 migration deepens, replay/eval also report `candidateFuturePredictionChecks`. Old transitions may have `CandidateFuture[]` without this field; that is a WARN-level migration signal unless fresh transitions stop carrying it.

As of P6, eval/review also report whether `PredictionErrorRecord.attributionBuckets` are present. These buckets make damage, defense, HP, kill, phase, card-flow, resource, route, reward, and unknown attribution visible without turning the signal into an automatic learning update.

P6 is tied to the CandidateFuture Doctrine: checks should prefer mechanics-informed expected-vs-actual evidence from `CandidateFuture.predictionChecks.expected` and checkpoint `stateDiff`, including `enemyDeltas` when available. Broad checkpoint reasons remain compatibility evidence for old transitions or low-visibility outcomes, not the end state of prediction quality.

As of the P7 proposal surface MVP, fresh runs create `proposals.jsonl` and replay/eval/review report consolidation proposal health. The surface includes proposal count, pending review count, status counts, target layer counts, evidence strength counts, and `mutatingOrAccepted` risk. `proposed` records are non-mutating. `accepted`, `rejected`, `expired`, `reverted`, and legacy `rolled_back` are lifecycle evidence for future guarded updates, not proof that an update has already been applied.

P7.5 adds a derived aggregation view over the same proposal surface. Aggregation groups proposals by target layer, proposed action, and actionable attribution bucket, then reports occurrence count, recurring group count, grouped evidence strength, blocked stable targets, allowed next review steps, forbidden stable mutations, and sample transitions. This helps reviewers see repeated prediction-error patterns without applying learning. Aggregated groups remain shadow-only and must not mutate memory, derived knowledge, strategy params, candidate ordering, prompt behavior, fallback, validation, or execution.

As of P8, replay/eval/review also report the DeliberationPacket strategic workspace surface:

- `workspaceComparison`: legacy prompt hash vs structured workspace hash, byte/token estimates, decision class, section coverage, missing sections, required/preserved legacy-information sections, information-preservation score, provider readiness, and gated readiness.
- `shadowWorkspaceDecision`: optional structured-prompt LLM call result, skipped/unavailable path, provider/model identity, estimated/actual tokens, max output tokens, latency, estimated cost, budget status, agreement/disagreement with the live selected candidate, invalid output, missing candidate, reason quality, risk tags, missing info, scaffold feedback, and errors.
- Replay/eval/review fresh slices also bucket `empty_content`, track provider mode (`json_mode` vs `non_json_strict`), and report retry count / retry success for the single provider-level rescue retry.
- P8.4/P8.4 v5 fresh slices show workspace ablation mode (`full`, `full_bounded_candidate_futures`, `compact`, `ultra_compact`), compression mode, average full-vs-bounded workspace size, average candidate-futures size, output-cap hits, reason quality, and mixed revision/budget windows so empty-content rate can be compared against token/cost/latency without changing live behavior.
- `STS2_P8_WORKSPACE_SHADOW` defaults off, so fresh transitions normally show comparison coverage with readiness blocked by the flag.
- `STS2_P8_WORKSPACE_CALL` separately gates any structured shadow LLM call. With defaults, P8 never calls an extra LLM and never changes action selection.
- DeepSeek V4 Flash provider plumbing is prepared, but missing `STS2_DEEPSEEK_API_KEY` must be reported as `needs_api_key`, `skipped`, or `unavailable`; eval must not treat this as a fake model result.
- P8.4 gate data is visible in replay/eval/review: decision class, readiness, token budget, agreement/disagreement, missing sections, invalid rate, missing candidate, reason quality, error rate, cost estimate, and go/no-go. Budget skips are not FAIL.
- Budget telemetry should be interpreted as governance telemetry, not as a direct proxy for strategic quality. Replay/eval should help separate:
  - provider contract failure
  - strategic workspace quality failure
  - evidence insufficiency
  - budget stop / skip
  - rollout blocker
  See `BUDGET_GOVERNANCE.md`.
- Fresh P8 transitions can now include a `budget.governanceProfile` and `budget.governancePolicy`. These fields make the call / recovery / run / evidence / rollout / protected-path interpretation explicit. Old transitions without these fields remain valid.
- Replay/eval/review aggregate governance profile counts as reporting metadata. Profile counts clarify which budget interpretation produced a sample; they do not by themselves change go/no-go, validation, recovery, or rollout behavior.
- Fresh P8 shadow decisions can also include `providerRecoveryPolicyName` and `providerRecoveryPolicy`. Replay/eval/review aggregate the recovery policy and rescue output-cap relation so provider recovery can be audited separately from workspace compression.
- P8.5 readiness includes an `evidenceBudget` object. It records fresh live-eligible sample targets, per-decision-class evidence targets, mixed revision/budget window flags, and whether the window is usable for promotion. It is explanatory governance metadata, not a shortcut around provider, safety, reason-quality, or CandidateFuture-quality blockers.
- P8.5 readiness also includes a `rolloutBudget` object. It records the additive first-live mode, whitelist proposal, blocked classes, explicit flag and human authorization requirements, rollback requirement, and protected-path write bans. It is not live enablement.
- Budget readiness terms must be read narrowly:
  - `promotionUseAllowed` means an evidence window is clean enough for the relevant review layer, not that stable learning may apply.
  - `promotionAllowedByBudget` means budget metadata did not block that rollout/readiness stage, not that budget alone authorizes live, wildcard, or stable promotion.
  - Passing a budget/evidence window never bypasses provider safety, semantic validation, candidate legality, reason-quality review, protected-path gates, or human authorization where required.
- Replay/eval should keep budget accounting and budget authorization distinct. Accounting reports tokens, cost, latency, finish reason, cap hits, retries, profile identity, and validation/quality outcomes. Authorization reports whether a call, retry, rollout, evidence claim, or protected-path action may continue, skip, stop, or require review.
- Replay/eval/review expose a read-only `budgetGovernance` summary. It aggregates call, recovery, run, evidence, rollout, and protected-path budget layers from existing transition telemetry. It is report-layer visibility only; it does not select profiles, raise caps, change retry behavior, enable live, or apply proposals.
- Cap exhaustion should not collapse into one generic invalid-output story. Future reports should be able to distinguish partial output, no-visible-output after reasoning/cap exhaustion, insufficient rescue cap, context-window pressure, provider timeout/rate limit, prompt/schema contract size, non-length invalid JSON, and invalid candidate choice.
- Workspace quality reporting now includes cue-source attribution. `candidateFutureCueAttribution` separates cues that were missing before serialization from cues lost during compression, while `reasonCueAttribution` separates scaffold/compression gaps from model reasons that omitted available cues. These fields are review telemetry only; they do not alter candidate generation, validation, execution, or live readiness by themselves.
- Replay/eval/review now also expose a separate `liveAppliedRollout` summary. This is a current live-facts view over transitions that actually applied additive live decisions. It reports live-applied count, chosen-by-LLM count, fallback count, decision-class counts, provider-source counts, prompt mode counts, and live invalid/error/missing-candidate signals.
- `liveAppliedRollout` is intentionally separate from the older P8 shadow-readiness assessment. Use shadow readiness to understand workspace/provider exploration coverage. Use live-applied rollout to understand what was actually executed in current explicit whitelist live windows.
- Live LLM audit can now record `protectedPathBlockedWrites` when a provider returns blocked memory-update intent. This is protected-path governance telemetry, not a fallback reason and not proof that stable learning exists.
- P8.5 no longer exists only as preparation metadata. Explicit whitelist additive live has now been exercised. Replay/eval/review therefore need two distinct readings:
  - shadow readiness and workspace-quality reading
  - live-applied rollout reading
- The two readings must not be confused. A stale shadow readiness warning is not by itself proof that a current explicit live-applied slice is unsafe, and a clean live-applied slice is not proof that wildcard broad live is authorized.
- The allowed live mode remains additive `legacy prompt + compact workspace summary`; structured-prompt-only must not be enabled by default.
- When reading live rollout evidence, use the same discipline:
  - compare by decision class, revision tag, and bounded review window
  - do not mix historical network-outage windows into fresh live judgments
  - separate `legacy_only`, `shadow_only`, and `live_additive_enabled` windows
  - treat disagreement as review signal unless it crosses validation/safety boundaries
  - treat any live-eligible invalid/error as rollback-class evidence, not a cosmetic WARN
- A later P9 rollout reader should explicitly separate:
  - shadow-only evidence budgets
  - live-applied rollout slices
  - console/fixture/debug slices
  - stable-learning promotion slices
  The new `liveAppliedRollout` summary is the first step in that separation, not the final P9 rollout reader.
- A read-only `EvidenceSliceReader` now exposes this separation as report-layer evidence slicing:
  - `shadow_readiness`: workspace/provider exploration and smoke-alarm evidence, not stable-learning proof
  - `live_applied_rollout`: decisions actually executed through explicit-whitelist additive live, not stable-learning proof
  - `stable_learning_promotion`: future P9 promotion evidence, currently always `promotionUseAllowed=false`
- Evidence slices report source, capture mode, decision class, revision tag, budget window, provider source, live mode, and provenance counts. Mixed revision/budget windows, console/debug/fixture markers, unknown provenance, and the absence of a P9 promotion engine all keep promotion disabled.
- Evidence slices also report future-promotion provenance eligibility separately from general visibility:
  - `promotionEvidence.eligibleTransitions`: organic agent runtime transitions that are not marked console/debug/fixture, human-observed, snapshot-only, or unknown provenance.
  - `promotionEvidence.excludedTransitions`: transitions still visible in replay/eval/review, but ineligible for future stable-promotion evidence.
  - `promotionEvidence.exclusionReasonCounts`: the reason a transition was excluded, such as `console_debug_or_fixture`, `human_observed`, `snapshot_only`, or `unknown`.
  These fields are read-only labels. They do not implement promotion, do not delete historical data, and do not change live behavior.
- This reader is intentionally read-only. It does not change P8 readiness, live rollout, validation, execution, proposal status, or memory/derived/strategy writes.

P8 disagreement is a review signal, not an eval failure. Invalid structured output or missing candidate is a WARN-level engineering signal unless it corrupts transition data or live validation.

Console-assisted fixture runs:

- The STS2 console can accelerate replay/eval scenario reproduction with commands such as `instant`, `travel`, `fight`, `event`, `card`, `draw`, `energy`, `gold`, `relic`, `potion`, `kill all`, `win`, and `die`.
- Console-modified runs must be marked debug/fixture-only and excluded from real strategy baselines, win-rate analysis, stable memory evidence, derived knowledge promotion, and strategy-param updates.
- Replay/eval/review should keep console/debug/fixture transitions visible, but they must be counted as promotion-excluded evidence. They may help reproduce bugs or inspect a scaffold, but they cannot satisfy future P9 stable-promotion slices by themselves.
- Console fixtures are useful for P8 workspace readiness sampling, shop/event/combat/death boundary replay, prediction attribution fixtures, and adapter state mismatch debugging.
- See `STS2_CONSOLE_DEBUG_RUNBOOK.md` for command groups, risks, and workflows.

P7 proposal rules:

- Generate learning proposals only from unsupported or critical prediction attribution.
- Treat unknown/low-visibility attribution as an evidence gap unless later executor-logged evidence supports it.
- Keep all proposals shadow-only and block automatic writes to memory, derived knowledge, strategy params, candidate ordering, prompt behavior, fallback, validation, and execution.
- `npm run data:replay -- proposals --latest` prints the proposal surface and grouped proposal evidence for the latest run.

P9.1 proposal and reverse-feedback visibility:

- Replay/eval/review now expose a separate typed `learningProposalSurface` when `data/runs/<runId>/learning-proposals.jsonl` exists.
- This surface reports pending, draft, rejected, actionable pending, stable/applied count, missing required fields, proposal type, target layer, and protected target counts.
- `LearningProposal` records are append-only run artifacts. They are not stable memory, derived knowledge, strategy, skill, classification, candidate template, budget, or scaffold policy.
- Anti-vague validation is conservative: proposals missing evidence, scope, counterexamples, expected effect, validation plan, rollback, protected-path impact, or source ids cannot enter actionable pending review.
- Replay/eval/review also expose `reverseScaffoldFeedbackSurface` when `reverse-scaffold-feedback.jsonl` exists. It is telemetry/proposal-seed material only and cannot change live behavior.
- Replay/eval/review also expose `learningProposalReviewDecisionSurface` when `learning-proposal-review-decisions.jsonl` exists.
- Review-decision records are audit-only. `approve`, `reject`, and `expire` record human/system judgment in a separate append-only ledger; they do not mutate proposal status, apply a patch, promote stable policy, or change live/runtime behavior.
- `stableOrApplied`, `proposalMutationEnabled=false`, `applyPathEnabled=false`, and `stablePromotionEnabled=false` must stay visible until later guarded phases deliberately add a shadow applicator and promotion gate.
- `npm run learning:proposals -- summary --latest` prints a summary for typed proposals, review decisions, and reverse feedback.
- `npm run learning:proposals -- list --latest --status pending_review` lists typed proposals with optional filters such as `--type`, `--target-layer`, `--transition-id`, `--source-run-id`, and `--missing-field`.
- `npm run learning:proposals -- show --latest --id <proposalId>` prints one typed proposal.
- `npm run learning:proposals -- approve --latest --id <proposalId> --notes "<why>"` records an audit-only approval for an actionable pending proposal.
- `npm run learning:proposals -- reject --latest --id <proposalId> --notes "<why>"` records an audit-only rejection.
- `npm run learning:proposals -- expire --latest --id <proposalId> --notes "<why>"` records an audit-only expiry.
- `npm run learning:proposals -- reviews --latest` and `review-show --id <decisionId>` inspect the review-decision ledger.
- `npm run learning:proposals -- feedback --latest` and `feedback-show --id <feedbackId>` inspect reverse-scaffold feedback.
- Mutating commands such as apply, promote, and revert remain intentionally unavailable. Review decisions are ledger entries only.

Useful checks:

- candidate generation is non-empty on actionable screens
- selected action is legal
- selected action matches a regenerated candidate
- hand index shift is safe
- human inference ambiguity is marked uncertain
- transition JSONL is parseable
- run IDs and transition IDs are consistent
- snapshot references exist
- event JSONL is parseable
- ground-truth invariants hold
- hard/unknown checkpoints and settlement timeouts are surfaced
- stale index, illegal target, repeated no-progress, and unknown-screen blocking risks are surfaced

Future prediction-error checks:

- candidate future predicted outcome vs state diff
- salience missed high incoming damage, irreversible choice, or repeated failure
- memory activation used an inapplicable lesson or omitted a relevant one
- LLM chose against stated risks without explanation
- checkpoint/eval classified normal flow as a blocker or missed a real execution defect

Warning categories:

- `normal_flow_checkpoint`: expected hard checkpoints such as menu/reward/map/rest/proceed/end-turn/card-reward transitions and combat actions that visibly remove a card, kill an enemy, or change screen.
- `acceptable_settlement_timeout`: low-visibility transitions such as shop purchases, treasure claims, menu character selection, card-select toggles, or visible combat progress where REST state does not expose a clean settled marker.
- `program_risk`: truly dangerous repeated no-progress or empty logs.
- `historical_fixed_evidence`: old run evidence from bugs that have since been fixed and covered.
- `strategy_quality`: low HP/high incoming/block deficit/deck thickness/potion/fallback/tempo metrics.
- `needs_fixture_bug_candidate`: actionable suspicious transitions that are not yet explained and should become fixtures if they repeat.
- `cognitive_coverage`: missing shadow-mode cognitive objects. This is expected for old runs and should rise as fresh transitions are recorded.
- `p8 workspace`: reported inside `cognitive_coverage` and `workspaceCoverage`; missing coverage on old runs is migration visibility, while invalid structured output is a review/debug signal.

Action identity note:

- replay/eval timeline labels include card/action indices for indexed actions, such as `play_card:2:Strike->ENEMY_0` and `select_card:1:Strike`.
- This keeps repeated no-progress detection from collapsing distinct card-select choices that share the same card name.

Historical Phase 2.5 signal:

- `run-mr0rfdcb-yewhg8` currently evaluates as `WARN` with zero errors after 574 parsed transitions.
- A fresh 200 tick run after the latest fixes completed from Act 2 floor 20 rewards to Act 2 floor 31 combat.
- Warnings in that run include historical repeated no-progress evidence from before the card-select guard fix, plus hard/unknown checkpoint and settlement audit items. These are follow-up audit inputs, not current eval errors.

Historical Phase 2.6 signal:

- `run-mr192jap-y1qb0x` evaluates as `WARN` with zero errors after 142 parsed transitions.
- Replay/eval matched 142 selected actions against regenerated candidates.
- `needs_fixture_bug_candidate` is zero after normal menu/card-select/kill-flow hard checkpoints were reclassified.
- Focused warnings are strategy-only: block deficit, one low-pressure potion use, and fallback-heavy decisions.
- This run reached Act 1 floor 15 rewards with HP 39/75 after a fresh 200 tick verification.

## Commands

```bash
npm run data:replay
npm run data:replay -- --latest
npm run data:eval
npm run data:eval -- --latest
```

Example:

```bash
npm run data:replay -- run-mr0ckah9-99khw3
npm run data:eval -- --run-id run-mr0ckah9-99khw3
```

Eval status:

- `PASS`: no engineering errors or warnings.
- `WARN`: no hard engineering failure, but strategy metrics, checkpoint summaries, settlement summaries, or actionable audit candidates should be reviewed.
- `FAIL`: malformed run data, invariant violation, invalid/missing snapshot refs, illegal selected action, or other program-level risk.

Future scripts:

```bash
npm run data:record:human
npm run data:export
```

Keep existing scripts compatible.
