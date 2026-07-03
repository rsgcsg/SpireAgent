# Engineering Rules

This project is meant to be maintained by humans and LLM agents.

## Baseline Commands

Run before and after meaningful changes:

```bash
npm install
npm exec tsc -- --noEmit
npm run agent:smoke
npm run agent:review
```

If game and MCP are running:

```bash
npm run collect:state
npm run agent:tick -- --dry-run
```

Short live validation only after offline checks:

```bash
npm run agent:run -- --max-ticks 5 --delay-ms 120
```

## Patch Discipline

Every non-trivial patch should state:

- layer changed
- reason
- expected effect
- risk
- tests
- rollback path

Bottom-layer logic requires tests in the same patch or before it.

## Live Run Policy

Do not stop live testing for normal HP loss, imperfect strategy, or debatable picks. Stop only for program defects:

- invalid REST action
- no candidates on actionable screen
- repeated no-progress actions
- stale card index loop
- illegal target loop
- settlement failure
- crash
- invalid LLM output accepted
- corrupted memory/data logs

Strategy improvements should happen after run review or natural checkpoints.

## Documentation Rule

When behavior changes, update the relevant docs:

- `docs/00_START_HERE.md` for documentation-routing changes
- `docs/04_CURRENT_STATUS.md` when the active blocker, milestone, or next step changed
- `README.md`
- `LLM_HANDOFF.md`
- `DEBUG_REPORT.md`
- `PROJECT_PLAN.md`
- `ARCHITECTURE.md`
- `GAME_IO_CAPABILITIES.md`
- `DATA_SCHEMA.md`
- `BUDGET_GOVERNANCE.md`
- `MEMORY_SYSTEM.md`
- `REPLAY_AND_EVAL.md`

Do not let docs describe a system that the code does not implement.
Do not treat handoff/debug notes as the only source of truth when a canonical doc should be updated.

## Repository Hygiene

This repository is meant to stay publishable on GitHub.

- Never commit API keys, bearer tokens, cookies, or local `.env` files.
- Never commit local replay/run outputs under `data/runs/`.
- Never commit mutable runtime memory such as `memory/current-run.json`, `memory/experience.json`, `memory/long-term.json`, `memory/strategy-params.json`, `memory/decision-log.jsonl`, `memory/snapshots/`, or `memory/collected/`.
- If a local runtime file is accidentally tracked, remove it from the Git index without deleting the local file before continuing.
- If a secret was ever committed, rotate it first and then clean Git history before publishing.
