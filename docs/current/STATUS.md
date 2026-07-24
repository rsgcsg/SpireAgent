# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/`.
- **Connector:** `STS2MCP/` Semantic Gateway, REST contract, and optional
  v2-only MCP adapter.
- **Legacy:** the original root runtime and P8--P15 route are archived.

## Current Gate

**Gate 1 is closed as a bounded ordinary-single-player v2 connector
baseline. Gate 2 player-visible-information closure may begin without expanding
unknown mutation authority.**

Current source contract is `2.0-preview.62`; Re normalized schema is `26`.
Re and the default MCP adapter use only Bridge v2 opaque actions. Gateway v1
state reconstruction and mutation are fully retired; every `/api/v1` request
returns `410 Gone`. Unsupported variants still fail closed.

Gate 1 closure does not mean complete-game coverage, all canaries qualified, or
all player-visible facts exposed. Crystal Sphere, standalone manual potion
discard, non-standard menu/profile flows, multiplayer, and unbound selector
semantics remain unsupported or outside the bounded gate.

## Evidence Boundary

The Gate 1 Organic runtime seal remains attributed to the loaded Preview.61
identity:

```text
SHA     9b6f62161f8c6c286a73cb157430b441014c5148ff702ea96894e6f702386a99
MVID    efd31a31-9c2a-4b68-ae22-1cabc1b382f1
runtime 7e6ffb41d8154625bd42ea34190194ef
game    v0.109.0|c12f634d|-1639417500
Modset  exact_bridge_only
```

Run `run-20260724045013-mgcq3a` completed exact Neow's Fury play, selection and
manual confirmation with source-task closure and exact discard-to-hand
post-state evidence. This closes the prior runtime-seal blocker.

Preview.62 moves exact environment scopes to an embedded reviewed policy,
replaces source-specific combat-pile C# branches with a closed registry, and
adds a non-authorizing exact-assembly compatibility audit. Six newly discovered
sources are registry canary candidates; Tutor remains a deliberate negative
holdout because its selected player comes from the card target. Preview.62
source/tests/audit may not inherit Preview.61 Organic qualification.

Preview.62 has also been built, installed and Steam cold-loaded on the exact
local environment:

```text
SHA      d66f5986f8216104fec76412c4b46b4c863076d0c8c7c5870a66fdb9f0c5a892
MVID     b7bf3824-80bf-4281-9267-262595ce0f49
runtime  6cf5f02288ed40448634656414524f6b
game     v0.109.0|c12f634d|-1639417500
Modset   exact_bridge_only
fingerprint 39d43817a8419e7065ce101aa42bced25e30b914fe0341588ab748822aa0662e
policy   bridge_v2_exact_environment_policy_2026_07_24
digest   1a3f5107e833bb5d561a36bbc2756340392225380088430229d7ef2dcf659f8f
```

Built, installed and loaded SHA matched; Re strictly decoded the stable
main-menu state; both sampled v1 routes returned `410`. This is deployment and
consumer evidence, not Organic qualification for Preview.62 gameplay sources.
On the same exact runtime, an operator-directed bounded canary completed
`main_menu -> singleplayer_menu -> main_menu` through two advertised opaque
actions and coherent successor states. Each action was submitted once; a local
polling-script error resumed the existing request rather than resubmitting it.
This rechecks only the established menu canary.

## Immediate Next Step

Proceed to Gate 2 player-visible-information closure and bounded,
non-authorizing transaction-correlation work. Collect new source canaries only
when naturally reachable; do not restore v1 or infer authority from discovery
alone.

See the
[Gate 1 closeout and selector audit](../../STS2MCP/docs/bridge-v2/GATE1_CLOSEOUT_AND_SELECTOR_TRANSACTION_AUDIT_2026-07-24.md)
and the
[Gate 1 adaptation closeout](../../STS2MCP/docs/bridge-v2/GATE1_ADAPTATION_AND_COMPATIBILITY_CLOSEOUT_2026-07-24.md)
and the
[operation inventory](../../STS2MCP/docs/bridge-v2/OPERATION_RETIREMENT_INVENTORY.json).

## Explicit Non-Claims

- Preview.62 is not organically qualified merely because source, tests and
  static exact-assembly audit pass.
- Gate 1 closure is not complete-game or full-visible-information closure.
- Historical v1 source and records are archive evidence, not a runtime fallback.
- Companion, Workshop product, public Agent SDK, plugin platform, and Headless
  host remain future work.
