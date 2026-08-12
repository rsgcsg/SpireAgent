# Connector V3 History

Connector V3 is superseded implementation and evidence history. It is not a
current route, fallback, rollback mode or consumer contract. Current source
truth is the [Player Environment contract](../player-environment/README.md) and
[ADR-0009](../../../docs/current/decisions/ADR-0009-player-environment-core-boundaries.md).

Files in this directory preserve V3 protocol reasoning and artifact-specific
Preview evidence. Their counts, SHA/MVID, authority model and compatibility
claims apply only to the exact historical source/artifact named in each file.
The current Host returns `410` for `/api/v3/*`.

Rollback is artifact-level only: close STS2 and restore one complete timestamped
deployment. It never enables a mixed V3/Player Environment process.
