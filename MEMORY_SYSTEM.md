# Memory System

The memory system is not just logs. It should affect decisions while remaining structured, searchable, compressible, and reversible.

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

Long-term memory is updated after runs. It should record:

- why the run won or lost
- repeated failure causes
- cards/relics/routes/events that performed well or poorly
- lessons with confidence and evidence run IDs

Long-term memory is retrieved by tags. Do not dump the whole file into prompts.

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
- Add retrieval scores to decision logs.
- Add explicit rollback command for strategy params and derived changes.
