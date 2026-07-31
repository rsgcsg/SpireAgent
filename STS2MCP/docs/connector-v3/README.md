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

See [Protocol](PROTOCOL.md) and [Coverage](COVERAGE.md). Bridge v2 documentation
is retained as migration and runtime evidence, not current Agent protocol.
