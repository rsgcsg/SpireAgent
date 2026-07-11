# LLM Handoff

> Status note: this is a working handoff and recent engineering-context document, not the canonical source of truth for current phase, blocker, roadmap, or architecture. Start from `docs/00_START_HERE.md` and `docs/04_CURRENT_STATUS.md`, then use `PROJECT_NORTH_STAR.md`, `PROJECT_PLAN.md`, `ARCHITECTURE.md`, `DATA_SCHEMA.md`, and `REPLAY_AND_EVAL.md` for enduring authority.

Closeout pointers:

- `docs/phases/P8_CLOSEOUT.md`
- `docs/debt/P8_P9_DEBT_REGISTER.md`
- `docs/phases/P9_ENTRY_CRITERIA.md`
- `docs/phases/P9_GUARDED_LEARNING_PLAN.md`
- `docs/phases/P9_P15_EXECUTION_ROADMAP.md`
- `docs/decisions/ADR-0005-phase-architecture-and-parallel-workstreams.md`
- `docs/decisions/ADR-0003-strategic-authority-and-experience-shell.md`
- `docs/decisions/ADR-0004-environment-scoped-evidence-and-knowledge.md`

## 2026-07-11 P9-G2 Telemetry Handoff

- Audit-only `DecisionAuthorizationRecord` and `EnvironmentFingerprint` / `EvidenceEnvironmentScope` records now land on fresh executor transitions and replay frames. They do not alter live, provider, validation, execution, proposal application, or stable storage.
- Use `STS2_DECISION_AUTHORITY_MODE` only to declare authority for a controlled experiment; absent configuration is intentionally `unknown`. Local fallback after an LLM failure remains local fallback, not delegated LLM authority.
- Use the documented P9-G2 environment variables only for controlled organic evidence. Omitted identity remains unknown; `STS2_EVIDENCE_PROVENANCE=console_debug` or `fixture` remains visible but cannot satisfy promotion evidence.
- New proposals require classified behavior impact plus exact organic environment scope before becoming actionable pending review. Stable promotion is still disabled.
- Next: collect fresh, same-scope paired and counterexample evidence, then audit G2. Do not start G3 ledger/snapshot/retrieval work first.

## 2026-07-11 P9-G2 Experiment Manifest Handoff

- `shadow-run` now emits a typed, audit-only manifest binding proposal, pair outcomes, evaluation, authority, environment scope, and invariants. It writes only when explicitly invoked with `--record-manifest`.
- The manifest is not a promotion ledger and cannot mutate proposal state, apply an overlay, or enable stable promotion. Fresh complete-scope paired/counterexample evidence is still the blocker.

## 2026-07-11 Fresh G2 Baseline

- `run-mrfq2vw1-aap49m` now has five fresh exact-organic valid shadow calls across combat, shop, event, and card selection under fingerprint `a79f70a43ba380f3`. All stopped cleanly without output-cap hits and had adequate reasons.
- The executed routes remained local/fallback because live was deliberately disabled; shadow selection is evidence only. Adequate cross-class reasons are useful counterexamples to expanding a hand-written reason policy from isolated cue omissions, so no actionable overlay proposal was manufactured.
- One initial operator invocation accidentally inherited `.env.local` live settings because its temporary variables were not exported. It is not G2 evidence. Use exported `STS2_P8_WORKSPACE_SHADOW/CALL` and `STS2_P8_LIVE_ADDITIVE=0`; never shell-source `.env.local`.

## 2026-07-11 G2 Fixed-Budget Counterexample Handoff

- `run-mrfq2vw1-aap49m` now also has a clean fixed-budget (`maxShadowCalls=3`) direct-workspace shadow sub-window. The child explicitly set `STS2_LLM_COMMAND=''` and `STS2_P8_LIVE_ADDITIVE=0`, so the configured local live adapter could not be invoked by the legacy execution path; this did not modify `.env.local`.
- Fresh valid direct-shadow evidence: combat `transition-000119-agent-mrfrg7k6-4wm75q`, rewards `transition-000121-agent-mrfrgbzy-bng586`, and card reward `transition-000122-agent-mrfrgekq-1ylwnc`. Provider results were `stop`, no retry, `failureBucket=none`.
- The run has eleven exact-organic valid direct-shadow calls total, but this three-call sub-window is the only one with the explicit fixed `maxShadowCalls=3` profile. Do not merge it with earlier budget profiles when assessing a future pair.
- The last card-reward reason says both benefit and cost (`Patches block deficit now, slight deck bloat.`) but retained the lexical `missing_tradeoff` note. Record this as a counterexample to detector truth, not a justification for another hand-written reason contract.
- G2 remains blocked on a repeated, scoped, low-risk presentation deficiency that survives counterexample review and can justify a real same-slice overlay. Do not manufacture a proposal, manifest, or G3 design merely to advance the phase.
- Use `npm run data:replay -- evidence ...` with the fixed budget/fingerprint/authority/provenance filters from `docs/runbooks/LLM_RUN_MODES.md` to inspect a G2 sub-window. Called workspace shadows now report their direct provider even when the intentionally disabled legacy command is `none`; execution provenance remains separately visible as local fallback where applicable.

## 2026-07-11 G2 Rest Candidate Handoff

- Fresh focused rest evidence: `transition-000127-agent-mrfrt2of-3oqlxw`, exact organic scope, `llm_primary`, `shadow=3;profile=shadow_exploration`, direct provider `deepseek-v4-flash`, valid/stop/no retry/no cap hit. The actual executed rest selection stayed local fallback because the controlled shadow child disabled the legacy command.
- The model reason (`Upgrade for long-term power; HP is nearly full.`) may omit the heal-versus-upgrade opportunity cost. Treat it as a single weak, presentation-only candidate; do not create a proposal until a comparable organic rest/long-horizon counterexample confirms the omission is real rather than detector/context noise.
- Two further bounded windows yielded explicit shop/combat tradeoff reasons and no second rest/long-horizon omission. A forced zero-energy thin reason is mechanical, and one combat call used retry=1, so neither is confirmation for a no-retry rest presentation pair. The rest candidate remains evidence-insufficient; do not manufacture a proposal.
- A second natural rest decision occurred but had no shadow provider call because an all-class capture used its fixed budget earlier in the process. The new `STS2_P8_WORKSPACE_SHADOW_DECISION_CLASSES=rest:llm_required` experiment-only filter reserves shadow calls for the evidence class and records that scope in the budget window. It is default-off and does not affect live, routing, validation, or execution.
- The reserved capture subsequently produced low-HP `rest:llm_required` `transition-000279-agent-mrfsaoch-9oxtf0` with `Heal to survive, but lose upgrade tempo.` and a valid/stop/no-retry/no-cap/no-provider-failure workspace result. It is a contextual counterexample under a different fixed budget (`shadow=1;...;capture=rest:llm_required`), not a pair. Reject the global rest reason-policy hypothesis and do not create a proposal from the isolated high-HP phrase. The next G2 search must wait for a naturally repeated, scoped low-risk deficiency rather than blind rest sampling.

## 2026-07-11 Phase Architecture Handoff

- The accepted mainline is P9-P15 plus optional research track R1. The intermediate P9-P16 route is historical.
- Current work is P9-G2 Experiment Integrity. Historical P9.5A-P9.5E labels map into G2; stable change remains disabled until G2 passes.
- P11 now owns learned context and compute/provider orchestration as separate A/B modules. P12 owns full environment revalidation, P13 player beta, P14 delegated-skill qualification, and P15 release/operations.
- Open-ended autonomous curriculum is not a main phase. P10 may schedule only bounded evidence-gap, counterexample, regression, and revalidation experiments.
- Canonical rationale and implementation gates live in the linked phase audit, ADR-0005, and P9-P15 roadmap.

## 2026-07-10 Authority And Environment Handoff

- The main product identity is now explicit: LLM-centered, not LLM-exclusive. Local capability does not automatically grant strategic authority.
- P9.5D decision-authority records and P9.5E environment-scoped evidence are new blockers before P9.6 promotion design.
- Slay the Spire 2 Early Access update cadence makes game/mod/adapter/fact version scope a data-truth requirement, not later polish.
- Continue P9.5C comparable/counterexample evidence, but do not treat it as the sole P9.6 prerequisite.
- Canonical decisions and forward route are in the linked ADRs and `P9_P15_EXECUTION_ROADMAP.md`; this handoff is only recent context.

## P9.5C Handoff

- One valid **scope-bound** same-packet P9.5C provider pair now exists for organic combat transition `transition-000194-agent-mr7smrum-sk2bgv`. The v2 reason-policy overlay needs the recorded `missing_tradeoff` trigger and is refused for an adequate counterexample baseline. It is only review evidence: no live path, transition write, proposal status mutation, stable write, or promotion occurred.
- The runner must reconstruct both the recorded ablation mode and provider profile. An initial mode mismatch was correctly rejected; do not cite that output as evidence.
- A second matching sample reached provider recovery and produced terminal `256/explicit_disabled/retry=1` rather than the baseline profile; it is incomplete provider evidence, not a confirmation.
- Next: counterexample review across additional provider-profile-comparable organic slices. Do not design P9.6 promotion ledger, rollback snapshot, or retrieval trace until that review is complete.

## Immediate Engineering Truth

- P8/P8.5 should now be described as an explicit-whitelist live scaffold MVP, not wildcard broad live and not learning completion.
- P9.0 hardening has started:
  - live/provider-originated memory updates are blocked by default
  - legacy `finalizeRun()` stable writes are blocked by default and audited
  - replay/eval/review now include a separate `liveAppliedRollout` summary
- P9 proposal-driven infrastructure has started:
  - typed append-only proposal/reverse-feedback stores, audit-only review decisions, weak proposal seeds, evidence slicing, and bounded P9.5 shadow comparison exist
  - no promotion ledger, rollback snapshot, traced stable retrieval, or stable promotion gate exists

Current project directory:

```text
SpireAgent repository root
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

Latest broad-whitelist rollout update:

- The current live posture is now a guarded explicit broad whitelist, not wildcard live.
- The broad runner is:
  - `npm run agent:run:deepseek-broad-live -- --max-ticks <N> --delay-ms 120`
- The runner enables only:
  - `combat:llm_required`
  - `card_reward:llm_required`
  - `map:llm_required`
  - `rest:llm_required`
  - `shop:llm_required`
  - `event:llm_required`
  - `card_select:local_recommended_llm_arbitrate`
- `reward`, `route`, `menu`, ordinary forced/local choices, and unlisted decision classes still do not call live DeepSeek.
- Latest broad-whitelist evidence:
  - run: `run-mr8pwmtm-4z75zt`
  - transitions: `73`
  - live additive decisions: `15`
  - live classes: `event:llm_required=3`, `card_reward:llm_required=5`, `map:llm_required=1`, `combat:llm_required=2`, `card_select:local_recommended_llm_arbitrate=4`
  - provider source: `deepseek-live-command`
  - invalid output / invalid choice / missing candidate / errors / fallback decisions: `0`
  - output cap hits: `0`
  - replay/eval/review can read the live calls
- Current cautions:
  - replay's older P8.5 readiness vocabulary still emphasizes shadow-budget evidence and may say `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE`; do not confuse that with the live-applied transition audit
  - one live combat Defend transition was an acceptable low-visibility `unknown` checkpoint despite visible state changes; treat it as checkpoint/reporting conservatism unless reproduced as execution mismatch
  - eval now reports a strategy-quality warning for block deficit; this is P9/P10 learning evidence, not a live rollback trigger by itself
  - wildcard broad live remains forbidden

Previous targeted-live expansion:

- Default targeted live remains whitelist-based, not broad live.
- Current local targeted classes are `combat:llm_required`, `card_reward:llm_required`, `map:llm_required`, `rest:llm_required`, `shop:llm_required`, and `event:llm_required`.
- `rest:llm_required` is locally promoted after two clean fresh live calls.
- `shop:llm_required` is locally targeted after one clean tiny live purchase and a checkpoint visibility fix; keep watching purchase/skip/leave evidence before calling it mature.
- `event:llm_required` is locally targeted after one clean live event choice; event follow-up `card_select` / `Proceed` screens remain local unless separately authorized.
- README now contains explicit commands for:
  - default targeted live
  - one-screen rest validation
  - one-screen shop validation
- Rest candidates now require LLM arbitration; shop purchase candidates now require LLM arbitration. This does not relax validation or change execution safety.
- Workspace-side rest/shop CandidateFuture facts now include strategic tradeoffs:
  - rest: heal vs upgrade, HP pressure, upgrade opportunity cost, campfire irreversibility
  - shop: item role, deck need, gold opportunity cost, bloat/resource/future flexibility risk
- Rest live calls were clean:
  - run `run-mr8n8h3s-b3c6qj`
  - transition `transition-000073-agent-mr8njzqa-p4awfu`
  - selected `choose_rest_option-1` / Smith
  - provider `deepseek-live-command`, provider bucket none, no invalid/missing/error/mismatch
  - transition `transition-000095-agent-mr8nuch6-x4k208`
  - selected `choose_rest_option-1` / Smith
  - provider `deepseek-live-command`, provider bucket none, no invalid/missing/error/mismatch
- The second rest reason was `Upgrade strengthens deck, rest wasted at full HP.`
- Replay still marks rest reasonQuality as thin due `missing_tradeoff`; treat that as rest detector debt rather than a live safety blocker unless future rest reasons become genuinely content-free.
- After two clean rest calls, local whitelist promotion for `rest:llm_required` was applied.
- Next step: move to shop and start with one tiny `shop:llm_required` live call.
- First shop tiny live call has now landed:
  - run `run-mr8n8h3s-b3c6qj`
  - transition `transition-000097-agent-mr8nzhtr-rh6f1j`
  - selected `shop-4` / Bulk Up
  - provider `deepseek-live-command`, provider bucket none, no invalid/missing/error/mismatch
  - execution result `ok`; post-state gold changed 74 -> 35
- A narrow checkpoint bug was fixed after that call:
  - player gold is now included in `stateHash`
  - checkpoint `changes` now includes `gold`
  - `player_gold_changed` is now a checkpoint reason
  - smoke covers shop purchase checkpoint visibility
- Current shop has no second purchase candidate after the first buy; dry-run routes `proceed` as forced local.
- First event live call has now landed:
  - run `run-mr8n8h3s-b3c6qj`
  - transition `transition-000100-agent-mr8po8ng-ksml69`
  - selected `event_choose_option-1`
  - provider `deepseek-live-command`, provider bucket none, no invalid/missing/error/mismatch
  - reason `Address severe block deficit with Nimble enchant.`
  - checkpoint hard into `card_select`
- Second event live call also landed cleanly:
  - transition `transition-000108-agent-mr8puyz8-yw1aae`
  - selected `event_choose_option-0` / Bottle
  - provider `deepseek-live-command`, provider bucket none, no invalid/missing/error/mismatch
  - checkpoint hard into `rewards`
- The event follow-up card select did not use live:
  - `card_select:local_recommended_llm_arbitrate` was disabled by whitelist and used local fallback
  - `confirm_selection` and event `Proceed` then advanced locally
- Next step: continue targeted live with the current whitelist, but do not broaden to reward/route/menu/broad card-selection until each has its own evidence. The current screen after the second event call is `rewards`.

Latest narrow P8.5 readiness update:

- First fresh `card_reward:llm_required` DeepSeek live call is now recorded:
  - run: `run-mr8ik0g5-as9nsn`
  - transition: `transition-000003-agent-mr8il8uh-ir8wps`
  - action: `select_card_reward:0:Boot Sequence`
  - telemetry:
    - `chosenBy="llm"`
    - `providerSource="deepseek-live-command"`
    - `liveAdditiveApplied=true`
    - `liveAdditiveDecisionClass="card_reward:llm_required"`
    - `candidateId="card-reward-0"`
  - cleanliness:
    - `failureBucket=none`
    - `finishReason=stop`
    - `outputCapHits=0`
    - invalid candidate=`0`
    - missing candidate=`0`
    - execution mismatch observed=`0`
    - reason quality=`adequate`
  - replay/eval/review all read it directly
  - next honest step: stop after this first clean call and ask for the next `card_reward` node
- Narrow adapter cleanup also landed:
  - `src/agent/deepseekLiveCommand.ts` now falls back to `STS2_P8_LIVE_DECISION_CLASSES`
  - this removes one piece of step-specific whitelist duplication between controller and adapter

- DeepSeek live command adapter is now runtime-verified on real combat-only additive calls:
  - run: `run-mr7v10pf-kdjvxe`
  - fresh additive combat transitions:
    - `transition-009862-agent-mr8hi280-t3yxk1`
    - `transition-009863-agent-mr8hi7mc-dqa3fn`
    - `transition-009864-agent-mr8hihrm-z5dblo`
    - `transition-009865-agent-mr8hjs91-pxcun7`
    - `transition-009866-agent-mr8hk2y5-c8i4tl`
    - `transition-009867-agent-mr8hkcy6-zdl8kj`
  - each records `providerSource="deepseek-live-command"`
  - observed result:
    - provider clean: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
    - invalid candidate=`0`
    - missing candidate=`0`
    - execution mismatch observed=`0`
    - reasons non-empty and intelligible
  - this is enough to treat `npm run agent:run:deepseek-combat-live` as the default recommended combat-only live runner
  - `npm run agent:run:bridge` remains useful for manual bridge testing, but it is no longer the default recommended live path
  - local machine state has now been aligned with that recommendation:
    - `.env.local` keeps `STS2_P8_LIVE_ADDITIVE=1`
    - `.env.local` keeps `STS2_P8_LIVE_DECISION_CLASSES=combat:llm_required`
    - `.env.local` now also sets `STS2_LLM_COMMAND=tsx src/agent/deepseekLiveCommand.ts`
  - on this machine, plain `npm run agent:run` now inherits the same combat-only DeepSeek live provider path

- Latest controlled rollout synthesis:
  - replay on `run-mr7s5gfl-edyce7` now reads `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - broad P8.5 remains no-go
  - first whitelist still must remain only `combat:llm_required`
  - `map:llm_required` and `card_reward:llm_required` still do not have first-batch authorization
- The most recent more-formal combat-only boss rollout window stayed within the same boundaries:
  - temporary process env only
  - active bridge responder
  - no provider/recovery change
  - no candidate/scoring/fallback/validation/execution change
  - no persistent flag enable
- Current high-value evidence summary:
  - run: `run-mr7s5gfl-edyce7`
  - direct transition audit shows 10 additive `combat:llm_required` transitions with `chosenBy="llm"`:
    - `transition-000194-agent-mr7smrum-sk2bgv`
    - `transition-000214-agent-mr7sogqq-dks7cm`
    - `transition-000218-agent-mr7sovfs-98f1pi`
    - `transition-000223-agent-mr7spcbu-jveyzu`
    - `transition-000232-agent-mr7sprmi-12owpe`
    - `transition-000287-agent-mr7stati-sx07pz`
    - `transition-000301-agent-mr7sud5x-mvyedy`
    - `transition-000309-agent-mr7suta8-vo3xep`
    - `transition-000314-agent-mr7svce8-zynmhl`
    - `transition-000331-agent-mr7sw1dd-slpbqp`
  - all were provider-clean and validation-clean:
    - `failureBucket=none`
    - no `finishReason=length`
    - no `outputCapHit`
    - no invalid/missing candidate
  - candidate future quality on the called combat slice remained acceptable:
    - `completeEnough`
    - `shallowFutureCount=0`
    - survival/tradeoff cue preserved on the called boss-combat samples
- Latest replay summary to keep quoting accurately:
  - `P8.5 live readiness: READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - `blocked=card_reward:llm_required,map:llm_required`
  - since revision `2026-07-05-v5.1.7-survival-cue-preservation`:
    - `called=11`
    - `liveEligibleCalled=2`
    - `valid=11`
    - `invalid=0`
    - `error=0`
    - `failureBucket={"none":11}`
    - `finishReason={"stop":11}`
    - `outputCapHits=0`
- Honest next-step read:
  - combat-only can continue under the rollout policy
  - the next step is not more provider fixing
  - the next step is a final human confirmation before any persistent-enable preplan
  - if more runtime is needed, keep it combat-only, temporary-env only, and do not broaden the whitelist

- Durable rollout policy now lives in `docs/phases/P8_5_LIVE_ROLLOUT_POLICY.md`.
- Use that policy before any further additive live window.
- A very narrow combat-only additive live-enable plan is now drafted in `docs/04_CURRENT_STATUS.md`; this is not authorization to enable live.
- The plan is North Star-aligned because it keeps the LLM as strategic player while preserving the hard outer shell: legacy fallback, candidate generation/order/scoring, selected-candidate validation, semantic validation, execution, rollback, and stable memory/derived/strategy boundaries.
- First whitelist in the draft plan is exactly `combat:llm_required`.
- Explicitly excluded from first whitelist: `map:llm_required`, `card_reward:llm_required`, shop, reward, route, event, rest, menu, card select, and all other non-combat classes.
- First live mode, if later authorized, must be additive-only: legacy prompt plus compact workspace summary. Structured-prompt-only live remains forbidden.
- Manual approval is required before any rollout. Do not set `STS2_P8_LIVE_ADDITIVE=1` without that approval.
- Rollback is simple and mandatory: set `STS2_P8_LIVE_ADDITIVE=0`, preserve rollout evidence, and return to legacy-only / shadow-only behavior before any tuning.
- Immediate stop conditions include provider failure, unrecovered `finishReason=length`, `outputCapHit`, invalid/error, semantic validation failure, illegal or nonexistent `selectedCandidateId`, unexpected fallback shape, execution mismatch, reason-quality collapse, missing survival/tradeoff cue returning, or any uncertainty about live-path boundaries.
- Post-rollout review commands, once a rollout is separately authorized, are `npm run check`, `npm run data:replay -- --latest`, `npm run data:eval -- --latest`, `npm run agent:review`, and `git status --short`.
- Human approval for the first tiny combat-only rollout was given, and one tiny temporary-env live window has now executed.
- Minimal controller-side additive prompt consumption is now wired:
  - `STS2_P8_LIVE_ADDITIVE=1` plus whitelist match appends compact P8 workspace summary to the legacy live prompt
  - whitelist mismatch blocks the live LLM call before provider invocation and falls back with `fallbackReason=live_additive_decision_class_not_whitelisted`
  - validation/fallback/execution/candidate generation/scoring remain unchanged
- DeepSeek is no longer shadow-only in this narrow sense:
  - it remains shadow-only outside live additive experiments and outside the combat whitelist
  - but the built-in command adapter is now validated as the combat-only additive live provider path
- The rollout used `STS2_LLM_COMMAND="node scripts/llm-bridge-decider.mjs"` as temporary process env only; it was not written to `.env.local`.
- Pre-run stop-condition discovery:
  - an initial bridge preflight tried to request a non-whitelisted `card_select:local_recommended_llm_arbitrate` decision
  - the process was stopped before a response was written or action executed
  - the controller now hard-gates live LLM calls to the additive whitelist when `STS2_P8_LIVE_ADDITIVE=1`
- Actual tiny rollout result:
  - run: `run-mr648yt5-h2h1dw`
  - temporary flags: `STS2_P8_LIVE_ADDITIVE=1`, `STS2_P8_LIVE_DECISION_CLASSES=combat:llm_required`
  - one non-whitelist card-select transition was blocked before live LLM call and fell back safely
  - two `combat:llm_required` additive live decisions executed through the bridge:
    - `play-4-MECHA_KNIGHT_0` / Scrape, reason `Scrape deals damage and draws toward block, but risks taking most incoming.`
    - `play-5` / Defend, reason `Defend reduces incoming damage, but delays offense and leaves most attack unblocked.`
  - both combat decisions had `promptMode=additive_legacy_prompt_plus_compact_workspace_summary`, `liveAdditiveApplied=true`, and whitelist `combat:llm_required`
  - observed invalid=0, error=0, execution mismatch=0
- Replay after the rollout:
  - latest fresh slices remain provider/shadow clean: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - canonical readiness is now `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE` because the newest window is mixed-budget / not promotion-usable
  - interpret this as: tiny combat live smoke passed, but class-level rollout evidence is still too small/mixed for broader authorization
- same-budget follow-up after that smoke:
  - reused the same temporary-env additive setup with `STS2_P8_WORKSPACE_MAX_SHADOW_CALLS=4`
  - one more additive live combat decision executed cleanly:
    - `play-1-MECHA_KNIGHT_0` / Ultimate Strike, reason `Ultimate Strike pushes damage now, but leaves most incoming damage unblocked.`
  - later combat ticks naturally routed to `combat:local_fast_combat` and did not request live additive
  - this is good boundary behavior, but it means the clean same-budget evidence slice is still sparse at the live-eligible level
- newest replay nuance to keep straight:
  - `last5` is now clean same-budget with `plannedShadowCallValueCounts={"4":5}` and `mixedBudget=false`
  - `last5` is provider-clean: `called=5`, `valid=5`, `invalid=0`, `error=0`, `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - but `last5` has only `liveEligibleCalled=1`
  - overall readiness therefore still honestly stays `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE`
  - reason: not a provider/live-path failure; the clean same-budget slice is simply too small, while the broader since-revision promotion window still mixes earlier `plannedShadowCalls=2` and `4`
- newest narrow runtime cleanup:
  - repeated local no-progress churn was found later in the same run on `combat:local_fast_combat`, not on additive `combat:llm_required`
  - the controller now blocks immediately repeating the exact same action on the exact same state after an `unknown` checkpoint with `settlement_timeout_or_no_visible_change`
  - this is a guard only; it does not change provider recovery, additive prompt policy, candidate/scoring semantics, validation, or execution legality
  - first retest after the patch did not reproduce the repeated `Offering` loop
  - that retest also did not create new fresh `combat:llm_required` promotion evidence, so the honest blocker remains evidence volume rather than local loop pollution
- newest attempted combat-only additive window after the guard:
  - launched with the same temporary-env budget/profile and was manually stopped after a short silent period
  - latest replay still shows `run-mr648yt5-h2h1dw` with 29 transitions, meaning the attempt added no new recorded evidence
  - latest recorded `last5` therefore still has `liveEligibleCalled=0`
  - interpret this as inconclusive runtime positioning, not as provider regression and not as a new blocker
- corrected diagnosis after code/history audit:
  - the silence was not primarily bad combat positioning
  - `agent:run:bridge` is a manual/Codex bridge path that blocks until an external responder writes `response-<id>.json`
  - without that responder, `tick()` hangs inside the LLM command and no transition is recorded
  - this was an operational usage mistake, not a new additive/provider bug
- corrected tiny live window with an active responder:
  - run `run-mr6gnmo8-egk8sr`
  - 4 fresh `combat:llm_required` additive live decisions executed and recorded cleanly
  - replay now reports `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - provider remained clean: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`, invalid=0, error=0
  - non-combat classes are still out of scope for first live whitelist because fresh evidence is still insufficient
- follow-up controlled combat-only live window on the same run strengthened the slice:
  - `run-mr6gnmo8-egk8sr` now has 12 transitions total
  - `combat:llm_required` transitions: 10
  - fresh live-eligible called shadow decisions: 6
  - replay still reports `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - provider remained clean and there was no repeated no-progress regression
  - one `Coolheaded` transition was `checkpoint.kind=unknown` with `settlement_timeout_or_no_visible_change`, but eval classed it as acceptable low-visibility flow rather than a live blocker
  - remaining quality debt is narrower now: live combat still shows 2 thin reasons with `missing_tradeoff`
- next, a slightly more formal combat-only rollout step was run under the same whitelist and temporary-env constraints
- result:
  - same run `run-mr6gnmo8-egk8sr` expanded to 17 transitions and 13 `combat:llm_required`
  - provider stayed clean: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`, invalid=0, error=0
  - but replay honestly regressed from `READY_FOR_P8_5_LIVE_COMBAT_ONLY` to `NOT_READY_CANDIDATE_FUTURE_QUALITY`
  - active blocker is now fresh combat review telemetry: `liveSignals={\"missing_survival_line\":2}`
  - there is also a new `end_turn` transition with `checkpoint.kind=unknown`, which eval tags as `needs_fixture_bug_candidate`
- latest narrow audit of those signals:
  - the two fresh live-eligible `missing_survival_line` transitions are `transition-000027-agent-mr6h1qwn-tpxci4` and `transition-000030-agent-mr6h28hh-5kylgc`
  - both show `candidateFutureCueAttribution.cues.survival_line.source=\"compression_lost\"`
  - both still show `candidateFutureCompleteness.completeEnough` and `shallowFutureCount=0`
  - honest read: this is a bounded serialization / cue-preservation problem, not a proof that raw CandidateFuture generation forgot survival logic
  - the same run also contains earlier non-live-eligible `missing_survival_line` warnings with the same attribution, so keep separating class-wide review smoke alarms from called/live-eligible rollout evidence
  - the new `end_turn` unknown checkpoint is `transition-000032-agent-mr6h2hek-umgnbj`, but it is `forced_local`, single-action, `energy=0`, and ends in an enemy-turn death tail with `hp=0`
  - because the user used manual `room boss` console positioning and reported post-death tail weirdness, this should currently be read as low-visibility / console-amplified runtime evidence, not as a provider or additive live-path regression
- latest narrow fix:
  - bounded combat futures now preserve survival cues more explicitly through a normalized `survivalLine`
  - survival cue detection now recognizes current Chinese combat risk phrasing, reducing false `compression_lost` reads when the serialized future kept the signal in Chinese rather than English
  - revision tag bumped to `2026-07-05-v5.1.7-survival-cue-preservation`
  - this has now been exercised on a fresh run window, so we do have current-revision runtime evidence
- newest fresh current-revision confirmation:
  - run stays `run-mr6gnmo8-egk8sr`
  - replay slice `since:2026-07-05-v5.1.7-survival-cue-preservation` now shows `called=8`, `liveEligibleCalled=2`, `valid=8`, `invalid=0`, `error=0`
  - provider remained clean: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - the two fresh called/live-eligible combat transitions are:
    - `transition-000267-agent-mr71482w-j3adut`
    - `transition-000283-agent-mr717m6i-si8tfm`
  - both are `reasonQuality=adequate`
  - both have `candidateFutureReviewSignals={}`
  - both have `candidateFutureCompleteness.completeEnough=3` and `shallowFutureCount=0`
  - both preserve `survival_line` as `serialization_preserved`
  - honest read: fresh called/live-eligible `missing_survival_line` is no longer reproducing on the new revision
- operational rule for future testing:
  - if console commands like `room boss` were used for positioning, say so at the time and treat that window as `console-assisted`
  - post-death or post-boss stuck tails from `console-assisted` windows should be logged, but should not be treated as canonical live-path regressions until reproduced without console help
- honest read:
  - this is not a provider failure
  - it is not yet a reason to broaden whitelist
  - it means the older survival-cue warning has been narrowed down to historical review telemetry, and the next blocker is promotion-evidence thickness rather than current survival-cue loss
- newest same-budget combat-only additive continuation:
  - continue reading `run-mr6gnmo8-egk8sr`, not the later menu-only run `run-mr71izvf-roz0yp`
  - three new live-eligible `combat:llm_required` transitions were added:
    - `transition-000304-agent-mr71hk3l-vvda8x`
    - `transition-000309-agent-mr71i98z-7s34bu`
    - `transition-000310-agent-mr71iw2i-qdbksc`
  - all 3 are `chosenBy="llm"`, `outcome=valid`, `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
  - all 3 have `reasonQuality=adequate`
  - all 3 preserve `survival_line` and `tradeoff`, with `candidateFutureReviewSignals={}` and `shallowFutureCount=0`
  - replay on `run-mr6gnmo8-egk8sr` now shows `last5: called=3, liveEligibleCalled=2, valid=3, invalid=0, error=0`
  - the only thin reason in that `last5` slice is a forced-local line, not a live-eligible additive combat decision
  - honest read: the newest combat continuation is clean, but the full-run readiness status still carries older same-revision live signals; next step should be another clean combat evidence window, not more provider or survival-line patching
- corrected read on that continuation:
  - the `act=2 floor=11` additive combat bridge window did persist after all, in `run-mr71izvf-roz0yp`
  - that run is not menu-only; it now contains 10 transitions total and 8 `combat:llm_required`
  - replay/eval/review can read it directly, and it comes back provider-clean with `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - the earlier "missing persisted artifacts" conclusion was an audit timing/read-path mistake, not a recorder bug
  - important tail nuance: the run ends on a real `combat -> card_select` transition after `Hologram`, so it is canonical combat evidence but not evidence for broadening the first whitelist
- newest same-budget continuation on that same run:
  - `run-mr71izvf-roz0yp` later expanded to 18 transitions total
  - first new transition was `card_select:local_recommended_llm_arbitrate` and was correctly blocked by the combat-only whitelist:
    - `transition-000011-agent-mr72t8hf-yr4any`
    - `fallbackReason=live_additive_decision_class_not_whitelisted`
  - this confirms an important game-flow nuance the user flagged: combat can create in-combat card-pick screens, and those should stay out of the first whitelist
  - two further additive live combat calls then landed cleanly:
    - `transition-000018-agent-mr72tqfd-hhc785` / `Charge Battery`
    - `transition-000019-agent-mr72tr6y-9ea5oy` / `Tesla Coil -> The Insatiable`
  - both were provider-clean and had explicit tradeoff reasons:
    - `Block now to cut incoming, but it slows damage or scaling.`
    - `Push damage now, but it still leaves a block deficit.`
  - replay/eval still read the full run as `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - nuance: after those two live calls, the fight naturally fell into `local_fast_combat`, so `last5` is no longer a clean combat-live slice even though the same-revision aggregate remains clean
- next honest engineering step has narrowed again:
  - not more provider tuning
  - not more survival-line tuning
  - not more persistence debugging for this window
  - instead, keep rollout judgment focused on evidence scope: combat-only is supported; `map` / `card_reward` still are not
  - if a cleaner promotion slice than `last20` is desired, stop the next narrow runtime window immediately after the next 1-2 live-eligible combat calls rather than letting later local-fast transitions dilute `last5`
- that cleaner slice now exists:
  - same run `run-mr71izvf-roz0yp`, later repositioned to `act=3 floor=16`
  - latest `last5` now contains 4 live-eligible called `combat:llm_required` decisions and only 1 preceding local-fast transition
  - replay `last5` is now:
    - called=`4`, liveEligibleCalled=`4`, valid=`4`, invalid=`0`, error=`0`
    - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
    - `reasonQuality={"adequate":3,"thin":1}`
    - `thinReasons={"missing_tradeoff":1}`
  - the 4 fresh combat reasons are:
    - `Push damage now, but it still leaves a block deficit.`
    - `Push damage now, but it still leaves a block deficit.`
    - `Use setup now, but it delays immediate block.` (`thin`)
    - `Add scaling now, but it spends tempo against this attack.`
  - honest read: this is currently the cleanest combat-only promotion slice; provider is clean, live path stayed bounded, and the only remaining fresh quality wobble is one setup-oriented tradeoff miss
- newest same-budget continuation on `run-mr71izvf-roz0yp`:
  - temporary env only; whitelist still `combat:llm_required`
  - fresh live-eligible samples:
    - `transition-000026-agent-mr7cac4b-nahdgw`: valid, `reasonQuality=adequate`, `failureBucket=none`, `finishReason=stop`, `survival_line=serialization_preserved`
    - `transition-000027-agent-mr7caxrt-be9f38`: valid, `reasonQuality=adequate`, but review signal `missing_survival_line`; cue attribution says `compression_lost`
    - `transition-000028-agent-mr7cbfcx-t5y0um`: valid, `reasonQuality=thin`, `thinReason=missing_tradeoff`
  - trailing `transition-000029-agent-mr7cbln1-lkhqy4` is `combat:local_fast_combat` and thin, but not live-eligible
  - replay after this continuation:
    - `last5`: called=5, liveEligibleCalled=4, valid=5, liveEligibleValid=4, invalid=0, error=0
    - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
    - `reasonQuality={"adequate":3,"thin":2}`, `thinReasons={"missing_tradeoff":2}`
    - canonical readiness moved back to `NOT_READY_CANDIDATE_FUTURE_QUALITY`
    - blocker reason: `combat_candidate_future_quality_not_clear`
  - honest read:
    - provider is still not the blocker
    - live path is still bounded and clean
    - the next narrow fix target is fresh combat quality under bounded presentation: one survival-cue `compression_lost` sample plus one remaining setup/scaling tradeoff-thin sample
- survival-cue root-cause audit is now complete:
  - `transition-000027-agent-mr7caxrt-be9f38` was not primarily a detector bug
  - original survival-relevant futures existed on `play-5` and `end-turn`
  - critical-pressure bounded top-3 omitted both, so `missing_survival_line` / `compression_lost` was a real bounded-presentation failure
  - narrow fix landed in `src/agent/candidateFutureCompressor.ts`: high-pressure combat bounded serialization must retain at least one survival-relevant future when the original packet has one
  - smoke regression added in `src/agent/smoke.ts`
  - `tsc`, `agent:smoke`, and `check` all pass
  - replay/eval/review remain unchanged on `run-mr71izvf-roz0yp` until we collect fresh runtime evidence on the patched revision
- newest evidence-surface improvement:
  - replay/eval/review now expose `Focused fresh slices`
  - use `combat:llm_required:fresh_live_eligible` for combat-only rollout judgment instead of raw `last5`
  - it filters to same revision + same `plannedShadowCalls` + `called=true` + `liveEligible=true`
  - this is specifically to stop trailing `local_fast_combat` / `forced_local` tails from muddying combat-only rollout reads
- latest focused combat slice:
  - run: `run-mr71izvf-roz0yp`
  - slice: `combat:llm_required:fresh_live_eligible`
  - samples=5
  - ids:
    - `transition-000045-agent-mr7dj2e4-0txyci`
    - `transition-000050-agent-mr7dqa5v-c5tx6x`
    - `transition-000053-agent-mr7dyyfy-ylbli2`
    - `transition-000055-agent-mr7dzyc1-3ahlwm`
    - `transition-000061-agent-mr7ea81s-rnm5rs`
  - `called=5`, `liveEligibleCalled=5`, `valid=5`, `liveEligibleValid=5`
  - `invalid=0`, `liveEligibleInvalid=0`, `error=0`, `liveEligibleError=0`
  - `failureBucket={"none":5}`, `finishReason={"stop":5}`, `outputCapHits=0`
  - `thinReasons={"missing_tradeoff":1}`
- honest operational read:
  - combat-only acceleration is healthy on the right evidence unit
  - provider is not the blocker
  - broad P8.5 remains no-go
  - do not expand whitelist beyond `combat:llm_required`
  - next rollout decisions should key off the focused combat slice, not generic `last5`
- newest narrow continuation strengthened that conclusion:
  - additional fresh live-eligible combat transitions:
    - `transition-000069-agent-mr7r6hxy-jswnps`
    - `transition-000070-agent-mr7r782s-sgiz56`
    - `transition-000072-agent-mr7r9tzc-kv2xer`
    - `transition-000073-agent-mr7ranf5-lhmmrk`
  - latest focused slice `combat:llm_required:fresh_live_eligible` is now:
    - `called=5`, `liveEligibleCalled=5`, `valid=5`, `liveEligibleValid=5`
    - `invalid=0`, `liveEligibleInvalid=0`, `error=0`, `liveEligibleError=0`
    - `failureBucket={"none":5}`, `finishReason={"stop":5}`, `outputCapHits=0`
    - `thinReasons={"missing_tradeoff":1}`
  - latest raw `last5` also came back clean on the same narrow window:
    - `called=4`, `liveEligibleCalled=4`, `valid=4`, `liveEligibleValid=4`
    - `reasonQuality={"adequate":4}`
    - `failureBucket={"none":4}`, `finishReason={"stop":4}`, `outputCapHits=0`
- honest next-step read:
  - combat-only additive is now strong enough to move into a more formal combat-only rollout step
  - broad P8.5 is still no-go
  - keep first whitelist exactly `combat:llm_required`
  - do not expand to `map`, `card_reward`, or any non-combat class
  - next step is now very narrow and concrete: rerun one same-budget combat-only additive window and check whether a fresh `transition-000027`-style `missing_survival_line` disappears
- that fresh retest has now been collected on the patched revision:
  - run: `run-mr71izvf-roz0yp`
  - fresh called/live transitions:
    - `transition-000030-agent-mr7d0vyd-l2dbfr`
    - `transition-000031-agent-mr7d1h88-ypoya6`
    - `transition-000032-agent-mr7d2657-026jl2`
  - all 3 are provider-clean: `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`, invalid=0, error=0
  - direct cue audit says all 3 now keep `survival_line=serialization_preserved`
  - two are `reasonQuality=adequate`; one remains `thin` with `missing_tradeoff` (`Gain block now, lose damage potential.`)
  - honest read: the active fresh blocker has narrowed again
    - not provider
    - not active survival-cue loss
    - now mainly one remaining setup/defense tradeoff-expression wobble plus the need for a cleaner promotion-quality evidence slice
- one more extra-narrow same-budget continuation was then added:
  - new fresh live-eligible combat sample: `transition-000034-agent-mr7d8f9g-6jybpc`
  - persisted reason: `High damage to reduce threat, but leaves block deficit.`
  - `reasonQuality=adequate`
  - `survival_line=serialization_preserved`
  - replay `last5` now reads `called=5`, `liveEligibleCalled=4`, `valid=5`, `invalid=0`, `error=0`, `reasonQuality={\"adequate\":4,\"thin\":1}`
  - `thinReasons={\"missing_tradeoff\":1}`
  - honest read: combat-only additive evidence is stronger again, but the slice is still not perfectly clean, so broadening live would still be premature
- another follow-up same-budget window was then added:
  - fresh live-eligible combat sample: `transition-000038-agent-mr7dcn6k-6ju0ra`
  - persisted reason: `Take block now, but it still leaves a large damage deficit this turn.`
  - `reasonQuality=adequate`
  - provider stayed clean
  - however, the fresh `last5` slice still remains `adequate=4`, `thin=1`
  - honest read: the new sample helps, but we still do not have a fully clean no-asterisk promotion slice
- after that, a more formal but still narrow combat-only additive rollout step was run:
  - fresh additive combat transitions:
    - `transition-000044-agent-mr7dimll-zjv79w` -> `Kill now to survive, save energy.`
    - `transition-000045-agent-mr7dj2e4-0txyci` -> `Cycle to find scaling while using 0-cost.`
  - both were `reasonQuality=adequate`, provider-clean, and stayed inside the combat-only whitelist
  - replay `last5` still shows `thin=2`, but those lines are actually:
    - `transition-000041-agent-mr7dh784-hejkc1` (`combat:local_fast_combat`)
    - `transition-000043-agent-mr7dhc6r-xj7ddw` (`combat:forced_local`)
  - honest read: the more formal combat-only additive step itself remained clean; the apparent wobble is fresh-slice contamination from non-live routes, not a new additive-combat regression
- fresh promotion-quality combat window now clears the current combat-only shadow gate strongly enough to draft, but not execute, a constrained additive live-enable plan
- latest run: `run-mr648yt5-h2h1dw`
- newest controlled continuation on `run-mr71izvf-roz0yp`:
  - stayed under the same combat-only additive policy and temporary-env constraints
  - two fresh `combat:llm_required` decisions were added cleanly:
    - `transition-000050-agent-mr7dqa5v-c5tx6x`
      - reason: `Push damage and draw now, but it spends this turn into 30 incoming.`
      - `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`, `retryCount=0`
      - `candidateFutureReviewSignals={}`, `completeEnough=3`, `shallowFutureCount=0`
      - `tradeoff`, `resource_tradeoff`, `future_risk`, and `survival_line` all stayed `serialization_preserved`
    - `transition-000051-agent-mr7dqzlx-f5ekbt`
      - reason: `Take the free chip and preserve energy, but it still leaves the 30 incoming mostly unanswered.`
      - `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
      - `candidateFutureReviewSignals={}`, `completeEnough=3`, `shallowFutureCount=0`
      - `tradeoff`, `resource_tradeoff`, and `survival_line` stayed `serialization_preserved`; `future_risk` alone remained `compression_lost`
  - replay/eval/review now read:
    - `last5`: called=4, valid=4, invalid=0, error=0
    - `reasonQuality={"adequate":4}`
    - `failureBucket={"none":4}`, `finishReason={"stop":4}`, `outputCapHits=0`
  - honest read:
    - the fresh combat-only slice is clean again
    - do not let `local_fast_combat` / forced-local tails drive rollout judgment
    - broad P8.5 is still no-go
    - `map` / `card_reward` still remain out of the first whitelist
- one slightly more aggressive continuation was then run under the same narrow policy:
  - fresh additive combat transitions:
    - `transition-000053-agent-mr7dyb2f-txe4z9`
    - `transition-000055-agent-mr7dzyc1-3ahlwm`
  - persisted reasons:
    - `Push heavier damage now, but it leaves the 30 incoming mostly unanswered.`
    - `Take the free chip now, but it still leaves most of the 30 incoming unanswered.`
  - both were provider-clean: `failureBucket=none`, `finishReason=stop`, `outputCapHit=false`
  - both stayed within `combat:llm_required`; no whitelist expansion happened
  - the trailing `last5` slice is noisy again only because the run then rolled into:
    - `combat:local_fast_combat`
    - `combat:forced_local`
  - replay/eval therefore need to be read carefully:
    - `last20` remains the healthier combat evidence surface here: called=16, liveEligibleCalled=7, valid=16, liveEligibleValid=7, invalid=0, error=0
    - `last5` should not be over-read as a combat-live blocker because only one transition in that slice is fresh live-eligible combat
- current honest posture:
  - combat-only can keep accelerating under the rollout policy
  - provider is still not the blocker
  - broad P8.5 remains no-go
  - `map` / `card_reward` still do not belong in the first whitelist
- new evidence-reading rule is now partially institutionalized in tooling:
  - replay prints `Focused fresh slices`
  - the important one for current rollout is `combat:llm_required:fresh_live_eligible`
  - it is same-revision, same-budget, called/live-eligible only, so it avoids false wobble from trailing `local_fast_combat` / `forced_local` transitions
  - current focused combat slice is clean: samples=5, valid=5, invalid=0, error=0, `failureBucket={"none":5}`, `finishReason={"stop":5}`, `outputCapHits=0`, `thinReasons={}`
- fresh combat slice:
  - called=4
  - liveEligibleCalled=3
  - valid=4
  - invalid=0
  - error=0
  - `failureBucket=none`
  - `finishReason=stop`
  - `outputCapHits=0`
  - `retryCount=0`
- fresh live-eligible `combat:llm_required` transitions:
  - `transition-000001-agent-mr649465-7hdlvb` -> `reasonQuality=thin`, `thinReasons=["missing_tradeoff"]`, but provider clean and survival/tradeoff cues preserved in serialization; gap is best read as `model_reason_omitted`
  - `transition-000002-agent-mr6498uu-ovos54` -> `reasonQuality=adequate`
  - `transition-000004-agent-mr649j14-q7t9tb` -> `reasonQuality=adequate`
- earlier replay/eval/review reported canonical readiness as `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
- interpret that earlier status narrowly:
  - it means combat has enough fresh shadow evidence to draft a combat-only additive live-enable plan
  - it does not authorize turning live on
  - live remains off, legacy fallback stays intact, and execution remains unchanged
- broad P8.5 still stays no-go:
  - `card_reward:llm_required` and `map:llm_required` remain blocked from first live whitelist
  - `map:llm_required` has `0` fresh called samples in the latest run, so it is blocked first by missing evidence
  - historical provider/network failures remain part of all-history reporting and must not be washed away
- next honest live-readiness step is not more combat wording work unless regression appears; it is a slightly larger but still tightly bounded combat-only additive window that can produce more than one clean `combat:llm_required` sample under the same budget profile, while separately gathering non-combat fresh evidence before any whitelist expansion
- policy tier read:
  - shadow evidence and tiny live smoke have passed for combat only
  - a larger combat-only additive window produced multiple live combat calls with no provider/validation/execution failure
  - replay now reports `NOT_READY_CANDIDATE_FUTURE_QUALITY`, with `combat_candidate_future_quality_not_clear`
  - usable combat-only rollout evidence is blocked by quality attribution, not by provider reachability
  - non-combat classes remain outside the first whitelist
- latest larger-window live decisions:
  - Offering, Charge Battery, Backflip, Ultimate Strike, Rocket Punch, Defend, Feral, Loop
  - each response included an explicit benefit plus cost/risk/delay style reason
  - live invalid/error/output-cap/missing-candidate/execution-mismatch stayed at 0
- next step:
  - stop rollout acceleration
  - inspect combat CandidateFuture cue attribution and quality gate causes
  - focus on `missing_survival_line`, `missing_lethal_line`, and older `missing_tradeoff`
  - do not broaden whitelist or run larger live windows until the quality blocker is understood
- latest audit result for that blocker:
  - `combat_candidate_future_quality_not_clear` is currently triggered mainly by class-level aggregation semantics, not by a fresh called combat collapse
  - the decisive `missing_survival_line` comes from `transition-000026-agent-mr6f5b3k-fx42ij`, which was `called=false` and `budget.status=call_budget_exceeded`
  - its cue attribution is still meaningful: `survival_line` existed in the original future and was lost in serialization (`compression_lost`)
  - that should stay visible as a review/compression warning, but it should not be casually equated with fresh live-eligible rollout failure
  - `missing_lethal_line` on fresh called combat is present, but today it is review-only and not the active hard blocker
  - the old fresh `missing_tradeoff` case (`transition-000001-agent-mr649465-7hdlvb`) is now better understood as `model_reason_omitted`: tradeoff was preserved in serialization, but not reflected in the model reason
  - next narrow engineering step should target readiness attribution semantics before any more combat wording tweaks or whitelist expansion
- that readiness attribution fix is now done:
  - `workspaceQuality` keeps full review signals and separate `liveEligibleCalled` quality signals
  - `p8LiveReadiness` now gates CandidateFuture quality from the `liveEligibleCalled` view only
  - replay still shows historical smoke alarms (`signals=`), but readiness now uses `liveSignals=` / `liveComplete=`
  - canonical status on `run-mr648yt5-h2h1dw` is now `NOT_READY_INSUFFICIENT_LIVE_ELIGIBLE_EVIDENCE`, not `NOT_READY_CANDIDATE_FUTURE_QUALITY`
  - this is the intended honest outcome: combat no longer looks blocked by budget-skipped review-only signals, but rollout still lacks enough promotion-usable evidence
- provider is not the active fresh combat blocker right now; the fresh `combat:llm_required` window remains valid with `failureBucket=none`, `finishReason=stop`, and `outputCapHits=0`
- the active blocker is still combat reason quality, specifically fresh `missing_tradeoff` on called combat shadow reasons
- newest called samples showed this is not just evaluator noise: lines like `Reduce incoming damage with free attack.` and `Block incoming 21 with 0-cost Hotfix.` still describe only the gain, not the cost/delay/risk
- a minimal combat-only workspace reason-contract refinement is now in place: for `combat:*`, the workspace prompt explicitly asks for one short sentence that states both the immediate gain and the main cost, delay, or risk this turn
- this remains a temporary inner-scaffold policy, not a permanent hand-written rule pile; long-term promotion still has to come through replay/eval/review attribution and guarded proposal flow
- first post-patch fresh called combat sample still came back thin: `transition-000152-agent-mr5qwaky-xkx56i` produced `Block immediately to survive, then scale later.` with `failureBucket=none`, `finishReason=stop`, `reasonQuality=thin`, `reasonQualityNotes=[\"missing_tradeoff\"]`
- evaluator narrowing now treats temporal tradeoffs more fairly, but the next fresh called combat sample still came back thin for a real reason-contract miss: `transition-000155-agent-mr5r64iv-cljtlw` returned `Draw and energy gain to enable block.`
- that means the active blocker is still fresh combat tradeoff expression, not provider stability and not mainly evaluator false negatives
- narrow follow-up fix landed: the combat-specific system prompt now receives the workspace prompt too, so the combat tradeoff contract is enforced on both system and user sides instead of only the user prompt
- first fresh runtime after that wiring stayed provider-clean and improved the narrow combat slice:
  - run `run-mr4rh1mb-tohmxl`
  - fresh `last5`: called=3, liveEligibleCalled=1, valid=3, invalid=0, error=0
  - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - replay/eval mark all 3 called samples in the slice as `reasonQuality=adequate`
- second fresh high-pressure combat follow-up on the same run reinforced the signal:
  - fresh `last5`: called=4, liveEligibleCalled=3, valid=4, invalid=0, error=0
  - the 3 live-eligible combat reasons were all explicit tradeoffs and all graded `adequate`:
    - `Block 6 to survive, but leaves 44 damage unblocked.`
    - `Block 6 to survive 50 damage, but no damage output.`
    - `Damage Spectral Knight to reduce incoming, but leaves block deficit.`
  - `failureBucket=none`, `finishReason=stop`, `outputCapHits=0`
  - the only fresh thin reason in that slice was a non-live-eligible `combat:forced_local` death-state reason
- do not treat that as live-ready proof yet; the broader `last20` window still has `missing_tradeoff` cases, so one more fresh combat window should confirm that this was not a lucky slice
- for combat specifically, the post-fix clean slice has now repeated strongly enough that more hand-tuning would likely be diminishing-return work unless fresh evidence regresses
- readiness synthesis outcome:
  - the first plausible live whitelist is still `combat:llm_required` only
  - however, current canonical readiness still does not clear even combat-only live, because the broader since-revision `combat:llm_required` class summary still contains historical quality warnings (`missing_survival_line`, `missing_lethal_line`, older `missing_tradeoff` / `empty_reason`)
  - `map:llm_required` is behind combat by a larger margin: the latest run has `0` called `map:llm_required` fresh samples, so it is blocked first by missing fresh evidence, then by unresolved quality readiness
  - this means the next honest step is not more combat wording tweaks; it is one clean promotion-quality combat evidence window plus separate fresh `map` evidence before any live-enable plan can be justified

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
- Latest narrow follow-up: combat `missing_tradeoff` is now treated as a telemetry-quality question first, not automatically as a workspace/provider failure. Fresh v5.1.6 combat evidence showed some `thin` reasons were false negatives (`without losing HP`, `sacrificing no energy`) rather than missing strategic tradeoffs.
- This should not become a permanent manual keyword pile. Treat the current combat reason contract as an interim scaffold policy: future replay/eval/review should attribute gaps from `missing_tradeoff`, `missing_survival_line`, and prediction error, then generate proposal-only `CombatReasonPolicy`, `CandidateTemplate`, or `BudgetPolicy` candidates for shadow validation before any stable promotion.
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

- North Star alignment audit:
  - Full report: `docs/reports/P8_NORTH_STAR_ALIGNMENT_AUDIT_2026-07-04.md`.
  - Current judgment: P8 is still broadly aligned with the LLM-centered predictive scaffold doctrine, but inner scaffold mechanisms are becoming too fixed in places.
  - Keep the outer shell hard: legality, validation, provider failure classification, `full` control group, live flag, rollback, stable-update promotion, replay/eval truth, and API-key hygiene.
  - Only the inner scaffold may learn policy-like changes such as workspace presentation, candidate template shaping, memory activation emphasis, bounded compression, budget presentation, or combat reason contract. The outer shell must remain non-negotiable.
  - Make the inner scaffold progressively learnable: CandidateFuture templates, survival/tradeoff generation, salience rules, memory activation conditions, prompt field selection, compression policy, budget allocation, and decision-class deliberation profiles.
  - Treat `reasonQuality`, `missing_tradeoff`, and `missing_survival_line` as smoke alarms. Do not optimize them as final goals; first attribute the source of the gap across CandidateFuture generation, compression, prompt contract, model output, and review heuristic.
  - Budget governance is still guard + telemetry plus early policy structure, not a full learning-aware Budget Governor. The next budget step is attribution/proposal-only, not automatic cap changes.
- Minimal quality-source attribution telemetry is now implemented:
  - `workspaceComparison.coverage.candidateFutureCueAttribution` compares original CandidateFuture cues against serialized workspace cues.
  - `shadowWorkspaceDecision.reasonCueAttribution` checks whether the returned model reason used available cues.
  - Replay/eval/review workspace-quality summaries now include `cueSources` and `reasonCueSources`.
  - Fresh validation transition `transition-000136-agent-mr5p8cor-n0h5r7` populated the fields on `combat:llm_required`: `tradeoff`, `resource_tradeoff`, and `future_risk` were preserved; `survival_line` was `compression_lost`; `lethal_line` was `candidate_future_missing`; provider failure was `none`.
  - Minimal high-pressure combat compressor refinement is now implemented: bounded serialization preserves a short `survivalLine` when the original future contains survival/block/incoming/mitigation cues.
  - Fresh post-fix transitions `transition-000138-agent-mr5pj4ib-fx0yvq` and `transition-000139-agent-mr5pjdm4-spanei` both preserved `survival_line`, were valid, had `reasonQuality=adequate`, `failureBucket=none`, `finishReason=stop`, and `outputCapHit=false`.
  - Missing `lethal_line` is still CandidateFuture/template evidence, not a compression issue.
  - Extended fresh slice for revision `2026-07-04-v5.1.6-survival-line-preservation`: called=5, liveEligibleCalled=5, valid=5, invalid=0, error=0, failureBucket=`none`, finishReason=`stop`, outputCapHits=0.
  - Remaining combat blocker is no longer survival-line loss. It is fresh `missing_tradeoff` thin reasons in 2/5 combat calls plus unresolved CandidateFuture/template gaps such as `lethal_line`.
  - P8.5 live is still blocked by broader `NOT_READY_CANDIDATE_FUTURE_QUALITY` evidence, especially non-combat readiness and the remaining combat tradeoff-quality gap.
- Current state: `P8.5` may continue on static / pre-live audit, but additive live is still `no_go`.
- Fresh `combat:llm_required` failures at transitions `transition-000130-agent-mr4sg5sl-xm6o7z` and `transition-000131-agent-mr4sh7t9-l925tb` were the blocker that forced the high-pressure recovery pass.
- Targeted replay retest on current code recovered both transitions as valid with `reasonQuality=adequate`, `finishReason=stop`, `failureBucket=none`, and no semantic-validation relaxation. One retest explicitly exercised recovery: primary `length+empty`, then truncation rescue with `thinking=disabled` and independent rescue cap returned valid JSON. A second retest had both calls succeed on primary, so fresh runtime high-pressure evidence is still required before changing readiness.
- Fresh high-pressure runtime shadow evidence has now been collected on the same recovery revision:
  - run `run-mr4rh1mb-tohmxl`
  - fresh slice called=3, valid=3, invalid=0, error=0
  - liveEligibleCalled=2, liveEligibleInvalid=0, liveEligibleError=0
  - failureBucket=`none`
  - finishReason=`stop`
  - outputCapHits=0
  - retries=0
  - no fresh `provider_length_empty` reproduced
- Interpretation: high-pressure combat provider length/empty is no longer the active blocker on current fresh evidence, but historical `provider_length_empty` must remain visible in mixed/all-history windows. Do not wash those old failures into success.
- Remaining live-readiness blocker is quality/evidence, not provider reachability: one fresh combat reason was still `thin` due `missing_tradeoff`, combat review signals still include `missing_survival_line`, and the fresh live-eligible sample remains too small for live additive authorization.
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

On 2026-07-01 in the repository root, local validation passed:

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
## 2026-07-05 Bridge Timeout Handoff

- The latest rollout anomaly was `LLM command timed out after 300000ms`.
- Honest root cause:
  - not a provider truncation/empty-output failure
  - not a boss-end or `game_over` request
  - a live combat bridge request was missed by the responder
- Concrete missing request:
  - `/tmp/sts2-llm-bridge/request-llm-mr7rz0nl-jxvshh.json`
  - no matching response file was ever written
  - payload is a real high-pressure `combat:llm_required` state (`hp=29/75`, `incoming=50`)
- Minimal fix landed:
  - `scripts/llm-bridge-decider.mjs`
    - timeout reduced to `120000ms`
    - writes `pending-request.json` and `pending-summary.txt`
    - clears pending bridge files on success/timeout
    - writes `timed-out-<id>.json` on timeout
  - `package.json`
    - `agent:run:bridge` now runs with `STS2_LLM_TIMEOUT_MS=120000` and `STS2_LLM_BRIDGE_TIMEOUT_MS=120000`
- Post-fix status:
  - no repeat of the old 5-minute bridge hang in the immediate follow-up runtime
  - still no new promotion-quality fresh `combat:llm_required` called slice after the fix
- Next honest step:
  - collect one more clean focused `combat:llm_required` live window under the patched bridge
  - if that window is clean, the line returns to “one manual confirmation away from persistent-enable plan”

## 2026-07-05 Combat-Only Persistent Enable Handoff

- Human approval was given to enter the persistent-enable plan for `combat:llm_required` only.
- Local config now has:
  - `STS2_P8_LIVE_ADDITIVE=1`
  - `STS2_P8_LIVE_DECISION_CLASSES=combat:llm_required`
- `STS2_LLM_COMMAND` is intentionally not persisted; use `npm run agent:run:bridge` for live bridge windows.
- Verification through the bridge added `transition-000336-agent-mr7t3f1g-yku3n4`.
- Provider/validation/execution remained clean:
  - invalid `0`
  - error `0`
  - missing candidate `0`
  - provider bucket `none`
  - finish reason `stop`
  - output cap hits `0`
- A report-side attribution bug was fixed: live rollout readiness now evaluates the applied additive `llmDecision.reason` when `liveAdditiveApplied=true`, while preserving shadow reason quality as diagnostic evidence.
- Latest replay status:
  - `READY_FOR_P8_5_LIVE_COMBAT_ONLY`
  - focused fresh `combat:llm_required` live-eligible samples `3`
  - valid `3`
  - invalid/error `0`
  - focused thin reasons `{}`
- Broad P8.5 remains no-go. Do not add `map`, `card_reward`, shop, reward, route, event, rest, menu, or card-select classes without separate fresh evidence and explicit approval.
- Immediate rollback remains `STS2_P8_LIVE_ADDITIVE=0`.

## 2026-07-06 DeepSeek Live Command Adapter Handoff

- A minimal built-in DeepSeek command adapter now exists:
  - `src/agent/deepseekLiveCommand.ts`
  - `npm run agent:run:deepseek-combat-live`
- This is intentionally still an `STS2_LLM_COMMAND` adapter, not a controller rewrite.
- It keeps the first whitelist at `combat:llm_required`, validates DeepSeek's candidate against prompt candidates, and strips memory/parameter suggestion fields before stdout.
- It has passed `tsc` and `npm run check`, but it has not yet produced fresh runtime live evidence.
- Next safe step:
  - run a tiny `combat:llm_required` DeepSeek live window only when the game is positioned for combat
  - stop on provider failure, timeout, invalid output, missing candidate, execution mismatch, or reason/cue collapse
  - run replay/eval/review immediately after
- Broad P8.5 remains no-go and non-combat classes remain excluded.

## 2026-07-06 Map Route-Plan Checkpoint Handoff

- The map system was corrected toward the North Star: map should build an opening route plan and then follow checkpoints, not ask the LLM at every branch unless the plan is missing, blocked, stale, or strategically invalidated.
- New runtime-only module:
  - `src/agent/mapRoutePlan.ts`
- Touched map integration:
  - `src/agent/candidates.ts`
  - `src/agent/scoring.ts`
  - `src/agent/controller.ts`
  - `src/agent/types.ts`
  - `src/agent/smoke.ts`
- What changed:
  - map candidates now include route preview facts
  - successful map choice records `activeMapRoutePlan` in current-run memory only
  - scoring follows the active route checkpoint locally when it still fits
  - LLM is reserved for route-plan creation or true replan checkpoints
- What did not change:
  - no stable memory / derived / strategy writes
  - no candidate generation/scoring/execution rewrite outside map route-plan context
  - no validation relaxation
  - no broad P8.5 live authorization
- Evidence:
  - first map live call in `run-mr8je84c-yequhq` was clean and readable by replay/eval/review
  - a longer pre-fix runtime exposed that `nextNode` pointed at the already-selected map node, causing excessive replan behavior
  - this was patched by advancing `nextNode` to the next checkpoint and including the immediate `leads_to` node in route derivation
- Validation after the patch:
  - `npm exec tsc -- --noEmit`: pass
  - `npm run agent:smoke`: pass
  - `npm run check`: pass
  - `npm run data:replay -- --latest`: pass/readable
  - `npm run data:eval -- --latest`: WARN, no errors; warnings are normal/acceptable checkpoint and evidence-window warnings
  - `npm run agent:review`: readable
- Post-fix runtime:
  - a short window advanced from rewards to a floor 3 map node
  - that node had only one legal option and correctly routed as `map:forced_local`
  - this is safe but not sufficient evidence for multi-option map plan-following
- Next step:
  - current game is on `card_reward`, so ask the user to move to a multi-option map node when ready
  - run one post-fix fresh multi-option map sample
  - expected behavior: follow active route plan as `obvious_local` when the checkpoint matches; call `map:llm_required` only if planning/replanning is truly needed

## 2026-07-06 Targeted Map/Card-Reward Live Handoff

- A new fresh run from a map opening produced clean targeted live evidence:
  - run `run-mr8n8h3s-b3c6qj`
  - `map:llm_required`: `transition-000002-agent-mr8n92ns-nllv8v`
  - `card_reward:llm_required`: `transition-000020-agent-mr8n9s8y-6dtkak`
  - `combat:llm_required`: `transition-000070-agent-mr8nal16-e5zbtl`
- All three used provider source `deepseek-live-command`.
- Safety counters:
  - invalid output `0`
  - missing candidate `0`
  - provider error `0`
  - execution mismatch `0`
  - output cap hit `0`
- Whitelist containment is verified:
  - `event:llm_required` appeared in the same run
  - live was not applied because `event` is not whitelisted
  - fallback handled it
- Map route-plan checkpoint behavior now has useful evidence:
  - opening map used live LLM for route planning
  - later map checkpoints followed the route locally when there was no real branch to deliberate
  - do not reintroduce per-branch map LLM calls unless the route is stale, blocked, divergent, or strategically invalidated
- Local persistent whitelist has been updated, without printing secrets, to:
  - `combat:llm_required`
  - `card_reward:llm_required`
  - `map:llm_required`
  - `rest:llm_required`
- Still excluded:
  - `event`
  - `shop`
  - `route`
  - `reward`
  - `menu`
  - broad card-selection classes outside the verified card-reward path
- Next step:
  - continue normal live runtime with this targeted whitelist
  - stop on any provider failure, invalid/missing candidate, execution mismatch, unexpected non-whitelist live application, or reason collapse
  - broad P8.5 should only expand class-by-class after separate fresh evidence
