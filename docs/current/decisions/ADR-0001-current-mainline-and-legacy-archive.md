# ADR-0001: Rebuild Mainline And Legacy Archive

## Status

Accepted, 2026-07-22.

## Decision

`Re-SpireAgent/` is the current Agent mainline. `STS2MCP/` is the current
real-game Gateway, REST connector, and optional MCP adapter. Repository-level
current documentation lives in `docs/current/`.

The original root runtime, P8--P15 learning program, root runtime data/schema
documents, historical handoffs, and old rollout guides are frozen under
`archive/original-spireagent/`. Bridge preview closeouts and dated evidence are
frozen under `archive/bridge-v2-previews/`.

## Consequences

- Historical material remains versioned and discoverable but cannot be used as
  current architecture, action permission, qualification, or roadmap authority.
- `STS2MCP` v1 code remains in the active component until its own v2 migration
  ledger proves a safe retirement path. It is not part of the archived root
  runtime.
- Shared assets may be extracted from the archive only after an explicit owner,
  test, and current-contract justification exist.
- New work must not create root-level P9/P10-style phases or revive the old
  runtime by accident. Use the functional roadmap in `docs/current/ROADMAP.md`.

## Rollback

This consolidation is path-based and preserves Git history through renames.
Any falsely archived asset can be moved back in a focused follow-up without
rewriting production behavior.
