# Current Documentation Map

This directory is the authoritative repository-level documentation entrypoint.
It describes the rebuilt `Re-SpireAgent` plus the real STS2 connector. It does
not inherit authority from the archived root SpireAgent runtime.

## Authority Order

1. [Status](STATUS.md): short current milestone, blocker, and immediate next
   step.
2. [Architecture](ARCHITECTURE.md): component ownership and non-negotiable
   connector boundaries.
3. [Roadmap](ROADMAP.md): current functional gates and retirement sequence.
4. [Product](PRODUCT.md): product boundary and deferred product work.
5. [Operations](OPERATIONS.md): safe local development and validation map.
6. [Repository inventory](REPOSITORY_INVENTORY.md): current/legacy ownership
   classification and v1-retirement holdouts.
7. [Repository consolidation ADR](decisions/ADR-0001-current-mainline-and-legacy-archive.md):
   durable authority and archive decision.

Component-owned truth:

- `Re-SpireAgent/README.md`, `Re-SpireAgent/AGENT.md`, and `Re-SpireAgent/docs/`
  own Agent behavior, records, and consumer contracts.
- `STS2MCP/README.md` and `STS2MCP/docs/bridge-v2/` own Gateway protocol,
  capabilities, coverage, source identity, and Organic evidence.
- [Gate 1 operation inventory](../../STS2MCP/docs/bridge-v2/GATE1_OPERATION_AND_JOURNEY_INVENTORY.md)
  owns current operation-level v1 retirement and ordinary-journey blockers.
- [Wood Carvings Gate 1 closeout](../../STS2MCP/docs/bridge-v2/GATE1_WOOD_CARVINGS_CLOSEOUT_2026-07-22.md)
  records the first organic fail-closed gap and its preview.56 canary closure.

## Historical Material

- [`../../archive/original-spireagent/`](../../archive/original-spireagent/)
  contains the retired root runtime and P8--P15 documentation tree.
- [`../../archive/bridge-v2-previews/`](../../archive/bridge-v2-previews/)
  contains preview closeouts, dated audits, and historical runtime evidence.

Historical records may explain a decision or evidence scope. They never grant
current action permission, runtime compatibility, or roadmap authority.
The [relocation manifest](../../archive/RELOCATION_MANIFEST.md) records why
each historical path family moved and where to find it.
