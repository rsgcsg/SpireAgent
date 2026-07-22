# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/` is the active Agent implementation.
- **Connector:** `STS2MCP/` is the active Live Semantic Gateway, REST
  connector, and optional MCP adapter.
- **Legacy:** the original root runtime and P8--P15 roadmap are retired and
  archived. They are not active workstreams.

## Current Blocker

The source/installed C# Bridge advertises `2.0-preview.54`, while the current
Re consumer contract requires `2.0-preview.56`. Independent suites can pass
while the two implementations remain incompatible. No coverage expansion,
permission widening, or product release claim is valid until the exact
cross-language contract, Release artifact, installed DLL, and loaded runtime
identity agree.

## Immediate Next Step

Complete the source-truth repair described in
[`STS2MCP/docs/bridge-v2/REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md`](../../STS2MCP/docs/bridge-v2/REAL_STS2_CONNECTOR_ARCHITECTURE_AUDIT_AND_MIGRATION_PLAN_2026-07-22.md):
add or mechanically derive cross-language fixtures, align the C# and Re
contract, build/install one exact artifact, then obtain bounded loaded-game
evidence before opening another coverage slice.

## Explicit Non-Claims

- Bridge v2 is not yet complete-game coverage or full v1 retirement.
- Historical previews do not qualify the current checkout or another game/Mod
  environment.
- The Companion, consumer Workshop product, BYOK secret store, Agent SDK,
  plugin platform, and Headless host are designs only, not implementations.
