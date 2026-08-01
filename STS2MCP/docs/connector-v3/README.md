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
The latest complete Re-driven journey and shop repair closure are recorded in
[v0.110.1 complete Re journey evidence](LIVE_EVIDENCE_V0_110_1_COMPLETE_RE_JOURNEY_2026-08-01.md).
The predecessor failure is retained in
[v0.110.1 Re shop evidence](LIVE_EVIDENCE_V0_110_1_RE_SHOP_2026-08-01.md).
Bridge v2 documentation is retained as migration and runtime evidence, not
current Agent protocol.
