# LLM Handoff

Current project directory:

```text
/Users/fire/STS2MCP/sts2-ai-agent-portable
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

The project has completed Phase 0, Phase 1, the Phase 2 minimum data-loop MVP, the Phase 2.5 offline engineering eval runner, and Phase 2.6 eval warning classification/noise reduction.

Implemented and working:

- TypeScript agent CLI.
- REST game client for STS2 MCP.
- State normalization.
- Candidate generation.
- Local scoring and decision routing.
- LLM command/bridge integration.
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

## Latest Validation

On 2026-07-01, Phase 2.5 local validation passed:

- `npm install`
- `npm exec tsc -- --noEmit`
- `npm run agent:smoke`
- `npm run check`
- `npm run agent:review`
- `npm run data:replay -- --latest`

Live MCP validation also exercised:

- `npm run collect:state`
- `npm run agent:tick -- --dry-run`
- multiple `npm run agent:run -- --max-ticks 50 --delay-ms 120` passes while fixing program-level bugs.

The latest known local run is `run-mr0rfdcb-yewhg8`. `npm run data:eval -- --latest` returns `WARN` with zero errors: 374 parsed transitions and 374 selected actions matched regenerated candidates. The warnings are hard/unknown checkpoint, settlement-timeout audit items, and historical repeated no-progress evidence from before the latest card-select guard fix in the same run.

Phase 2.5 live hardening fixed:

- event loading screens no longer emit generic proceed candidates
- disabled menu options are filtered, and post-embark run-start menu transition states wait instead of clicking stale menu actions
- full potion reward states avoid direct blocked `claim_reward`
- potion actions use raw slot identity instead of potion array index
- self/buff potions no longer receive enemy targets
- automatic potions such as `Fairy in a Bottle` are not manually used
- rest post-choice flow gets a short settlement backoff before proceed

Before continuing a live run, re-read current game state. The latest observed live state for `run-mr0rfdcb-yewhg8` was Act 2 floor 20 rewards after a post-fix 50 tick verification, but that should not be assumed.

## Latest Phase 2.5 Live Stability Notes

On 2026-07-01, the same latest run `run-mr0rfdcb-yewhg8` was extended substantially:

- A stale `play_card` settlement bug was fixed after REST rejected a stale hand index.
- A multi-card `card_select` repeated-toggle bug was fixed after `Pael's Tooth` kept selecting `index=0`.
- replay/eval short action labels now include card/action indices, so indexed selections are not collapsed into false repeated no-progress.

Current `npm run data:eval -- --latest` returns `WARN` with zero errors. After the fixes, a fresh 200 tick run completed from Act 2 floor 20 rewards to Act 2 floor 31 combat. The run now has 574 parsed transitions and 574 selected actions matched regenerated candidates.

Do not treat normal HP loss, imperfect fallback choices, or route/card-pick disagreement as stop conditions. Phase 2.5 has enough engineering signal to proceed to Phase 2.6 planning/implementation. Keep hard/unknown checkpoints, settlement audit warnings, and historical repeated no-progress evidence as follow-up inputs rather than current blockers.

## Latest Phase 2.6 Eval Classification Notes

On 2026-07-01, eval WARN output was grouped into actionable categories:

- `normal_flow_checkpoint`
- `acceptable_settlement_timeout`
- `program_risk`
- `historical_fixed_evidence`
- `strategy_quality`
- `needs_fixture_bug_candidate`

The CLI keeps detailed info-level noise in `warningSummary` and prints focused warnings only when they are actionable, risk-level, or strategy-quality metrics. Normal menu/reward/map/rest/card-select transitions, expected combat hard checkpoints, and low-visibility settlement timeouts are no longer mixed into the top-level warning list.

Latest validation run:

- `run-mr192jap-y1qb0x`
- 142 parsed transitions, 142 selected actions matched regenerated candidates
- `npm run data:eval -- --latest`: `WARN`, zero errors
- `needs_fixture_bug_candidate`: 0 after classification refinement
- focused warnings are strategy-only: block deficit, one low-pressure potion use, fallback-heavy decisions
- current live state after the 200 tick verification: Act 1 floor 15 rewards, HP 39/75, gold 11

This is sufficient to enter Phase 3 combat plan/checkpoint continuation. Do not tune strategy before preserving the eval categories and keeping zero-error replay/eval on a fresh run.
