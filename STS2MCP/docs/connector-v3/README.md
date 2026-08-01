# Connector V3

Connector V3 is the current STS2 Semantic Gateway contract. The canonical
architecture is [ADR-0007](../../../docs/current/decisions/ADR-0007-connector-v3-canonical-architecture.md).

```text
GET  /api/v3/capabilities
GET  /api/v3/observation
POST /api/v3/commands
GET  /api/v3/commands/{request_id}
```

Client registration and the single-controller lease are also available under
`/api/v3/clients/*` and `/api/v3/controller/*`.

See [Protocol](PROTOCOL.md), [Coverage](COVERAGE.md), and the current
[v0.110.1 Codex direct-play evidence](LIVE_EVIDENCE_V0_110_1_CODEX_DIRECT_PLAY_2026-07-31.md).
The latest complete Re-driven journey is recorded in the
[v0.110.1 516-decision evidence](LIVE_EVIDENCE_V0_110_1_516_DECISION_DIRECT_JOURNEY_2026-08-01.md).
It closes direct event/map/game-over runtime evidence and preserves the exact
limits of the later reward consumer cutover.
The predecessor failure is retained in
[v0.110.1 Re shop evidence](LIVE_EVIDENCE_V0_110_1_RE_SHOP_2026-08-01.md).
Bridge v2 documentation is retained as migration and runtime evidence, not
current Agent protocol.
