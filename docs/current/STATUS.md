# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/`.
- **Connector:** `STS2MCP/` Semantic Gateway, REST contract, and optional
  v2-only MCP adapter.
- **Legacy:** the original root runtime and P8--P15 route are archived.

## Current Gate

**Gate 1 repository/source closeout is complete as a bounded
ordinary-single-player v2 mutation baseline. Its runtime seal is pending the
bounded Preview.61 Neow's Fury Organic lifecycle. Preview.61 install, cold-load,
v1 retirement, and strict Re negotiation are verified; Gate 2 must not expand
runtime permission before the remaining lifecycle seal.**

Current source contract is `2.0-preview.61`; Re normalized schema is `26`.
Re and the default MCP adapter use only Bridge v2 opaque actions. Gateway v1
state reconstruction and mutation are fully retired; every `/api/v1` request
returns `410 Gone`. Unsupported variants still fail closed.

Gate 1 closure does not mean complete-game coverage, all canaries qualified, or
all player-visible facts exposed. Crystal Sphere, standalone manual potion
discard, non-standard menu/profile flows, multiplayer, and unbound selector
semantics remain unsupported or outside the bounded gate.

## Evidence Boundary

The currently loaded Preview.61 identity is:

```text
SHA     9b6f62161f8c6c286a73cb157430b441014c5148ff702ea96894e6f702386a99
MVID    efd31a31-9c2a-4b68-ae22-1cabc1b382f1
runtime 7e6ffb41d8154625bd42ea34190194ef
game    v0.109.0|c12f634d|-1639417500
Modset  exact_bridge_only
```

Run `run-20260723150256-d2thtq` then safely stopped at an exact Neow's
Fury optional discard-to-hand selector because Preview.60 lacked its source
binding. Preview.61 implements that native `min=0`, dynamic-max,
manual-confirm transaction and replaces Re's source-card union with a closed
structural combat-pile transaction contract.

Preview.61 passes C# contract tests, Re typecheck/tests/build, Python syntax,
and Release build. The final DLL SHA matches the installed and loaded artifact;
Re strictly decodes its capabilities and main-menu state. Read-only endpoint
verification confirms `/api/v1` and `/api/v1/singleplayer` return `410 Gone`.
It still has no Organic Neow's Fury evidence.

## Immediate Next Step

Run one bounded Neow's Fury select/deselect/confirm lifecycle under the loaded
Preview.61 identity. After that, begin Gate 2 with non-authorizing
transaction-correlation shadow and player-visible information closure. Do not
restore v1 or infer authority for an unknown selector.

See the
[Gate 1 closeout and selector audit](../../STS2MCP/docs/bridge-v2/GATE1_CLOSEOUT_AND_SELECTOR_TRANSACTION_AUDIT_2026-07-24.md)
and the
[operation inventory](../../STS2MCP/docs/bridge-v2/OPERATION_RETIREMENT_INVENTORY.json).

## Explicit Non-Claims

- Preview.61 is installed and loaded, but Neow's Fury is not yet organically
  exercised or qualified on this identity.
- Gate 1 closure is not complete-game or full-visible-information closure.
- Historical v1 source and records are archive evidence, not a runtime fallback.
- Companion, Workshop product, public Agent SDK, plugin platform, and Headless
  host remain future work.
