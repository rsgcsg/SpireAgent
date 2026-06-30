# External Dependencies

This project depends on external systems for game I/O and fact data. External systems must be isolated behind adapters so the agent core can survive API changes or replacement.

## STS2MCP

Repository: https://github.com/Gennadiyev/STS2MCP

Role:

- Primary game I/O provider.
- Exposes localhost REST and MCP tools for Slay the Spire 2.
- Current package uses the REST endpoint through `src/agent/client.ts`.

Useful capabilities:

- Read visible single-player state.
- Execute agent actions through POST requests.
- Provide raw state that can be normalized by this project.
- Return action execution success/error for agent-triggered actions.

Known gaps:

- Current inspected code does not expose a reliable live human action event log.
- Current state endpoint does not reliably say "the human clicked card X targeting Y".
- Human play can only be captured as snapshots or diff-inferred transitions unless the mod is extended.

Recommended status:

- Formal adapter dependency for game I/O.
- Do not let raw STS2MCP state leak into strategy code.
- Add runtime capability detection.
- Add conformance fixtures using captured JSON.

Risk:

- Game and mod APIs may change.
- Human capture requires future mod work.
- REST action names are external contracts and should be tested.

Isolation:

- Keep all REST body mapping in the adapter/client layer.
- Expose `GameIO` and `AdapterCapabilities` to the rest of the project.

## Spire Codex

Repository: https://github.com/ptrlrd/spire-codex

Site/API:

- https://spire-codex.com
- https://spire-codex.com/docs
- https://spire-codex.com/zhs/developers

Role:

- Objective fact database for cards, relics, characters, keywords, potions.
- Synced locally by `scripts/sync-sts2-data.mjs`.

Useful capabilities:

- API endpoints for cards, relics, characters, keywords, potions.
- Chinese `lang=zhs` support.
- Export endpoint may provide bulk JSON if available.

Known gaps:

- It is a fact source, not a strategy source.
- API shape may evolve.
- Its repository license is non-commercial, so do not vendor source code without review.

Recommended status:

- Fact-db adapter and cache source.
- Runtime agent should use local JSON cache, not live API calls.
- Learned experience must go to `memory/` or `derived/`, not `data/spire-codex/`.

Isolation:

- Keep sync logic in scripts/adapters.
- Keep fact lookup tolerant of `name/title/id/description` field variation.

## External LLM Provider

Role:

- Strategic decision maker.
- Connected through `STS2_LLM_COMMAND` or the bridge script.

Contract:

- Input: compact JSON prompt.
- Output: short JSON with `candidateId`, optional confidence, reason, and memory updates.

Risk:

- Timeout.
- Invalid JSON.
- Candidate not found.
- Overlong reasoning.

Isolation:

- LLM output must be parsed and validated before execution.
- Invalid or unavailable LLM falls back to local policy and is logged.

## Other Future Dependencies

Potential future dependencies:

- A vector index for long-term memory retrieval.
- JSON schema validation library.
- Replay/eval fixture runner.
- Event-log mod or STS2MCP fork.

Adoption rule:

- Introduce only after a small adapter and offline test exist.
- Record license, capability, replacement cost, and rollback path.
