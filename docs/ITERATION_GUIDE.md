# Iteration Guide

This is the working loop for future Codex/LLM agents and human maintainers.

## Baseline

Start every engineering pass with:

```bash
npm install
npm run check
npm run agent:review
```

If the game and MCP are running:

```bash
curl -s http://localhost:15526/
npm run collect:state
npm run agent:tick -- --dry-run
```

## Live Run Loop

When baseline and dry-run are sane, run the game:

```bash
npm run agent:run -- --max-ticks 100 --delay-ms 120
```

For stable phases, use a larger limit:

```bash
npm run agent:run -- --max-ticks 500 --delay-ms 120
```

Do not interrupt a live run just because the agent lost HP, made a debatable pick, skipped block, or chose a route you dislike. Those are gameplay/strategy observations.

Interrupt only if the program itself is wrong or stuck:

- invalid REST action
- screen parser failure
- no candidates on a real actionable screen
- repeated same action with no progress
- stale hand index or illegal target
- settlement loop
- crash or type error
- malformed LLM output accepted or attempted

## After A Run Or Natural Checkpoint

Run:

```bash
npm run agent:review
npm run collect:state
```

Then classify issues:

- state parsing bug
- action mapping bug
- candidate generation miss
- scoring/strategy weakness
- LLM prompt/validator issue
- memory retrieval issue
- checkpoint/settlement issue
- documentation gap

Fix program bugs immediately with a smoke test or fixture. Fix strategy tuning after reviewing logs, not from a single emotional moment.

## Patch Discipline

Every non-trivial change should include:

- the layer being changed: bottom, middle, high, memory, derived, docs
- why it is needed
- expected behavior change
- risk
- validation command
- rollback path

Bottom-layer changes require tests first or in the same patch.

## Collector Usage

Use collector whenever a real screen is confusing:

```bash
npm run collect:state
```

Collected data lands under `memory/collected/`. It should be used to build future replay/eval tests. Runtime collected data should usually not be committed.

## Documentation Updates

Update docs when behavior changes:

- `DEBUG_REPORT.md` for real validation and findings.
- `LLM_HANDOFF.md` for handoff state.
- `docs/PROJECT_STEERING.md` for durable steering changes.
- `docs/ai-agent-architecture.md` for architecture changes.
- `docs/MCP_USAGE.md` for action/API changes.

