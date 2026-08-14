# ADR-0010: Standalone Connector Dependency

Status: accepted

Date: 2026-08-13

## Decision

`rsgcsg/STS2-Connector` is the sole authoring authority for the real-game Host,
Player Environment protocol, strategy-free SDK and REST/MCP transports.
SpireAgent consumes a versioned SDK and declares compatibility in
`connector-requirements.json`.

SpireAgent must not retain Host source, duplicate wire validators, a duplicate
machine contract or Connector build/deploy tools. Re may keep only its thin
adapter and consumer projection. Local coordinated development uses explicit
sibling checkouts; ordinary users consume releases.

## Consequences

- Connector and Agent releases are independent.
- Protocol, package version, Host release and exact runtime identity remain
  distinct axes.
- Cross-repository CI must obtain the exact declared package; it must not infer
  compatibility from a branch.
- The production dependency is the immutable SDK asset attached to the
  declared Connector release. A sibling SDK may be installed with `--no-save`
  only for coordinated local development and must not enter committed package
  metadata or CI.

## Safety

The split does not move native operands, legality, idempotency, stale checks or
unknown-delivery handling into Re. A dependency resolver cannot grant gameplay
authority.
