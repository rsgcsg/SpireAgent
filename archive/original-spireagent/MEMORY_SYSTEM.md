# Memory System

The memory system is not just logs. It should affect decisions through explicit, evidence-backed `MemoryActivation` while remaining structured, searchable, compressible, conditional, and reversible.

## Current Files

```text
memory/current-run.json
memory/decision-log.jsonl
memory/long-term.json
memory/experience.json
memory/strategy-params.json
memory/snapshots/
memory/collected/
```

Current implementation: `src/agent/memory.ts`.

## Run Memory

Run memory tracks the current run:

- character, act, floor, hp, gold
- deck deficits
- route bias
- risk flags
- recent combat pressure
- key decisions
- counters for LLM, fallback, local decisions, checkpoints

Required deficits:

- damage
- block
- draw
- energy
- scaling
- aoe
- deck_thinness
- status_control
- healing
- potions

Run memory must influence:

- combat priorities
- card reward pick/skip
- shop priorities
- route risk
- event choices
- rest choices

## Long-Term Memory

Long-term memory is a future guarded stable store. It is **not** updated automatically by the current P9 path. The legacy finalize path is blocked by default as described below.

When guarded promotion exists, long-term memory should record:

- why the run won or lost
- repeated failure causes
- cards/relics/routes/events that performed well or poorly
- lessons with confidence and evidence run IDs
- conditions where the lesson applies
- counterexamples or situations where the lesson should not be trusted
- environment scope, dependencies, invalidation triggers, and last revalidation result
- proposal and promotion-ledger identity

Long-term memory should be retrieved by scoped evidence and tags. Do not dump the whole file into prompts, and do not activate a quarantined or environment-incompatible lesson.

Memory informs the LLM and bounded skills; it does not own strategic authority. A memory becoming confident or frequently retrieved cannot grant a local policy permission to make Level 3 strategic decisions.

### Legacy Finalize Isolation

The historical `finalizeRun()` path is a legacy local-learning path, not P9 proposal promotion.

Default behavior:

- legacy finalize stable writes are blocked by default
- blocked attempts are appended to `memory/legacy-finalize-audit.jsonl`
- audit entries are labeled `learningMode=legacy_local_learning`
- audit entries explicitly set `proposalPromotion=false` and `stablePromotion=false`
- attempted protected stable-write targets are recorded, currently `memory` and `strategy_params`

Explicit opt-in behavior:

- `STS2_ENABLE_LEGACY_FINALIZE_STABLE_WRITES=1` may enable the old local-learning writes for controlled local experiments
- even when explicitly enabled, the path is audited as `legacy_finalize_explicitly_enabled`
- explicit legacy writes are still not P9 stable promotion and must not be treated as proposal-driven guarded learning

P9 stable learning must use typed pending proposals, evidence gates, promotion ledger, version diff, and rollback. It must not reuse legacy finalize as a shortcut.

The promotion ledger must also record proposal behavior impact, decision-authority mode, and environment compatibility. Unknown environment scope blocks stable memory promotion.

## Memory Activation

Each strategic decision should eventually produce a `MemoryActivation` record:

- query tags and screen context
- activated memory IDs
- relevance and confidence
- evidence run IDs
- conditions and counterexamples
- reason the memory matters now
- omissions when memory exists but is not applicable

This record can be stored on `TransitionRecord.memoryActivation` and summarized inside the `DeliberationPacket`. Memory that cannot explain why it applies should not control strategy.

## Strategy Params

Strategy params are local scoring weights and thresholds. Updates must be conservative:

- bounded max delta per run
- reason
- evidence
- old/new or delta
- rollback path

Current implementation stores history in `strategy-params.json`.

## Future Work

- Add `memory/experiments.jsonl`.
- Add memory snapshots per transition.
- Add `MemoryActivation` records per decision.
- Add explicit rollback command for strategy params and derived changes.
- Add environment-scoped stable memory identity, quarantine, and revalidation.
- Add retrieval traces that record policy/memory version, authority mode, compatibility decision, and usefulness/harm evidence.
