# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/` is the active Agent implementation.
- **Connector:** `STS2MCP/` is the active Live Semantic Gateway, REST
  connector, and optional MCP adapter.
- **Legacy:** the original root runtime and P8--P15 roadmap are retired and
  archived. They are not active workstreams.

## Current Gate

**Gate 0 is closed; Gate 1 connector reliability and operation-level migration
is active.** The exact loaded `2.0-preview.55` environment completed two
state-bound Re journeys (`main_menu -> singleplayer_menu -> main_menu`) with
Bridge command completion and coherent successor states. Re is now v2-only;
Gateway v1 mutations are disabled by default while v1 reads remain explicit
compatibility diagnostics.

## Immediate Next Step

Continue Gate 1 by auditing and retiring v1 per operation/journey, prioritizing
normal-run blockers and visible-information gaps. Do not infer qualification
from implementation or widen scoped permissions without current exact-build
evidence. See the [Gate 0 closeout](../../STS2MCP/docs/bridge-v2/CONNECTOR_G0_CLOSEOUT_2026-07-22.md).

## Explicit Non-Claims

- Bridge v2 is not yet complete-game coverage or full v1 retirement.
- Historical previews do not qualify the current checkout or another game/Mod
  environment.
- The Companion, consumer Workshop product, BYOK secret store, Agent SDK,
  plugin platform, and Headless host are designs only, not implementations.
