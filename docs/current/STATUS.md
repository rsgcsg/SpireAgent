# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/`.
- **Connector:** `STS2MCP/` Semantic Gateway, REST contract, and optional
  v2-only MCP adapter.
- **Legacy:** the original root runtime and P8--P15 route are archived.

## Current Gate

**Gate 1 is closed as a bounded ordinary-single-player v2 mutation baseline.
Gate 2 player-visible information closure is next.**

Current source contract is `2.0-preview.61`; Re normalized schema is `26`.
Re and the default MCP adapter use only Bridge v2 opaque actions. Gateway v1
state reconstruction and mutation are fully retired; every `/api/v1` request
returns `410 Gone`. Unsupported variants still fail closed.

Gate 1 closure does not mean complete-game coverage, all canaries qualified, or
all player-visible facts exposed. Crystal Sphere, standalone manual potion
discard, non-standard menu/profile flows, multiplayer, and unbound selector
semantics remain unsupported or outside the bounded gate.

## Evidence Boundary

The last loaded artifact remains Preview.60:

```text
SHA     49e403b7fb953121256e13f96edbe1eb435a03ce8eac9ddfb17dff473b81d996
MVID    1219fb20-6db0-4b97-a754-57695e2585f8
runtime ec2901d029a241e08831fdece0691a2d
game    v0.109.0|c12f634d|-1639417500
```

Run `run-20260723150256-d2thtq` then safely stopped at an exact Neow's
Fury optional discard-to-hand selector because Preview.60 lacked its source
binding. Preview.61 implements that native `min=0`, dynamic-max,
manual-confirm transaction and replaces Re's source-card union with a closed
structural combat-pile transaction contract.

Preview.61 passes C# contract tests, Re typecheck/tests/build, Python syntax,
and Release build. It is not installed or loaded because the game process was
running during closeout. It has no Organic Neow's Fury evidence.

## Immediate Next Step

Close the game, install Preview.61, cold-start, verify exact loaded identity,
then run one bounded Neow's Fury select/deselect/confirm lifecycle. After that,
begin Gate 2 with non-authorizing transaction-correlation shadow and
player-visible information closure. Do not restore v1 or infer
authority for an unknown selector.

See the
[Gate 1 closeout and selector audit](../../STS2MCP/docs/bridge-v2/GATE1_CLOSEOUT_AND_SELECTOR_TRANSACTION_AUDIT_2026-07-24.md)
and the
[operation inventory](../../STS2MCP/docs/bridge-v2/OPERATION_RETIREMENT_INVENTORY.json).

## Explicit Non-Claims

- Preview.61 is not installed, loaded, canary-qualified, or organically
  exercised yet.
- Gate 1 closure is not complete-game or full-visible-information closure.
- Historical v1 source and records are archive evidence, not a runtime fallback.
- Companion, Workshop product, public Agent SDK, plugin platform, and Headless
  host remain future work.
