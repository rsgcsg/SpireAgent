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
The latest installed-but-unloaded migration boundary is the
[shop-inventory V3-native cutover](SHOP_INVENTORY_V3_NATIVE_CUTOVER_2026-08-01.md).
Bridge v2 documentation is retained as migration and runtime evidence, not
current Agent protocol.
