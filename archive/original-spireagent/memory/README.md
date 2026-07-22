# Agent Memory

This directory is runtime state for the local STS2 agent.

- `current-run.json`: mutable memory for the current run.
- `long-term.json`: post-run lessons and compressed summaries.
- `experience.json`: learned card/relic/enemy/route experience.
- `strategy-params.json`: conservative local weights and thresholds.
- `decision-log.jsonl`: append-only decision audit log.
- `legacy-finalize-audit.jsonl`: audit log for blocked legacy post-run stable writes.
- `snapshots/`: archived run-memory snapshots for rollback/debugging.
- `collected/state-log.jsonl`: read-only raw/compact state collection for replay, fixture, eval, and failure analysis.
- `collected/snapshots/`: raw state snapshots referenced by collected JSONL records.

The agent may update these files. Raw Spire Codex data stays in `data/spire-codex/` and should not be polluted with learned strategy.

## GitHub Boundary

This directory contains a mix of repository-owned placeholders and local runtime state.

Commit:

- `memory/.gitkeep`
- `memory/README.md`

Do not commit:

- `current-run.json`
- `long-term.json`
- `experience.json`
- `strategy-params.json`
- `decision-log.jsonl`
- `legacy-finalize-audit.jsonl`
- anything under `snapshots/`
- anything under `collected/`

These files are local run products and may contain large replay/debug context. They should stay ignored even when the project is pushed to a public GitHub repository.

## Current Decision Log Shape

New decision entries include route and LLM audit fields:

- `route`: `forced_local`, `obvious_local`, `local_fast_combat`, `local_confident`, `local_recommended_llm_arbitrate`, `llm_required`, or `no_op_or_poll`.
- `routeReasons`: why the router chose that path.
- `llm`: whether LLM was wanted, called, available, and the final outcome.
- `fallbackReason`: why local fallback was used when LLM was wanted.
- `fallbackPolicy`: how fallback chose locally, e.g. `local_top` or `conservative_combat`.
- `checkpoint`: post-action state diff with `none`, `soft`, `hard`, or `unknown`.
- `candidateCount` and `topCandidate`: compact candidate audit info.

Older entries may not contain these fields; review output will show missing route as `unknown` and missing checkpoint as `missing`.

Use:

```bash
npm run agent:review
```

for a compact aggregate summary, and:

```bash
npm run agent:review -- --full
```

for the raw memory dump.

## Collector Data

Use:

```bash
npm run collect:state
npm run collect:watch -- --max-ticks 60 --interval-ms 1000
```

Collector records are read-only observations. They do not generate candidates, call LLM, execute actions, update strategy params, or write derived knowledge. Each record includes schemaVersion, runId, tick, timestamp, screen, floor, hp, gold, stateHash, rawStatePath, and compactState.

## Protected-Path Note

As part of P8 closeout and P9 entry hardening:

- live/provider-originated memory updates are blocked by default
- legacy `finalizeRun()` stable writes are blocked by default
- blocked legacy stable-write attempts are recorded in `legacy-finalize-audit.jsonl`

This keeps legacy learning behavior visible without allowing it to silently mutate stable memory or strategy state during P9 preparation.
