# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/` is the active Agent implementation.
- **Connector:** `STS2MCP/` is the active Live Semantic Gateway, REST
  connector, and optional MCP adapter.
- **Legacy:** the original root runtime and P8--P15 roadmap are retired and
  archived. They are not active workstreams.

## Current Gate

The C# Gateway and Re consumer now share `2.0-preview.55`; the Release DLL was
installed and the running Steam process proved the same SHA/MVID to Re during a
read-only negotiated inspection. The next gate is one existing, low-risk
action/completion canary on that exact environment. No coverage expansion,
permission widening, or product release claim is valid yet.

## Immediate Next Step

Run one existing, low-risk action/completion canary on the loaded `.55` artifact
and immediately verify its successor state through Re. This is required before
opening another coverage slice. See the [source-truth repair closeout](../../STS2MCP/docs/bridge-v2/SOURCE_TRUTH_REPAIR_CLOSEOUT_2026-07-22.md).

## Explicit Non-Claims

- Bridge v2 is not yet complete-game coverage or full v1 retirement.
- Historical previews do not qualify the current checkout or another game/Mod
  environment.
- The Companion, consumer Workshop product, BYOK secret store, Agent SDK,
  plugin platform, and Headless host are designs only, not implementations.
