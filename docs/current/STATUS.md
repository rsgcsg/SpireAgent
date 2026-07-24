# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/`.
- **Connector:** `STS2MCP/` Semantic Gateway, REST contract, and optional
  v2-only MCP adapter.
- **Legacy:** the original root runtime and P8--P15 route are archived.

## Current Gate

**Gate 1 is closed as a bounded ordinary-single-player v2 connector
baseline. Gate 2 remains the next functional coverage gate, but new Gate 2
feature expansion is temporarily paused for Connector adaptation hardening.**

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

The current source also has one non-authorizing D2 compatibility slice: a
shared seven-topology contract catalog, mechanism-named transaction Witnesses,
layered exact-assembly fingerprints, conservative candidate classification,
the Tutor target-player negative holdout, an exact-assembly scenario manifest
and a deterministic grader with six negative fixtures. None can write the
registry or policy, grant canary permission, or declare qualification.

The current post-D2 Preview.62 artifact has been built, installed and Steam
cold-loaded on the exact local environment:

```text
SHA      f22c152aa9a58e429fea4ecc25dcc83ef7666e481c1acecc754545f428a8d8ab
MVID     546ef308-f4ff-45f4-8a07-8d0fff70c304
runtime  2b82c83dcf27427f816857fcdbcdc1e7
game     v0.109.0|c12f634d|-1639417500
Modset   exact_bridge_only
fingerprint eab9ee21fd1d9180b16585c9a528d7f2b831bb7199b08fdf98bf97cf3a49bb57
policy   bridge_v2_exact_environment_policy_2026_07_24
digest   1a3f5107e833bb5d561a36bbc2756340392225380088430229d7ef2dcf659f8f
```

Built, installed and loaded SHA matched; Re strictly decoded the stable
main-menu state; both sampled v1 routes returned `410`. This is deployment and
consumer evidence, not an action Canary or Organic qualification for
Preview.62 gameplay sources.

The predecessor Preview.62 artifact
`d66f5986...a892` completed an operator-directed bounded canary:
`main_menu -> singleplayer_menu -> main_menu` through two advertised opaque
actions and coherent successor states. Each action was submitted once; a local
polling-script error resumed the existing request rather than resubmitting it.
That canary remains attributed to its predecessor SHA/MVID/runtime and does not
transfer to the current post-D2 artifact.

## Immediate Next Step

Complete adaptation hardening with a read-only action-relevant runtime patch
inventory and one recorded-evidence assertion path, then resume Gate 2
player-visible-information closure. Do not expand mutation scopes, restore v1,
or infer authority from a fingerprint, scenario fixture or grader result.

See the
[Gate 1 closeout and selector audit](../../STS2MCP/docs/bridge-v2/GATE1_CLOSEOUT_AND_SELECTOR_TRANSACTION_AUDIT_2026-07-24.md)
and the
[Gate 1 adaptation closeout](../../STS2MCP/docs/bridge-v2/GATE1_ADAPTATION_AND_COMPATIBILITY_CLOSEOUT_2026-07-24.md)
and the
[automatic-adaptation audit](audits/CONNECTOR_AUTOMATIC_ADAPTATION_AND_D_WORKFLOW_AUDIT_2026-07-24.md)
and the
[operation inventory](../../STS2MCP/docs/bridge-v2/OPERATION_RETIREMENT_INVENTORY.json).

## Explicit Non-Claims

- Preview.62 is not organically qualified merely because source, tests and
  static exact-assembly audit pass.
- Gate 1 closure is not complete-game or full-visible-information closure.
- Historical v1 source and records are archive evidence, not a runtime fallback.
- Companion, Workshop product, public Agent SDK, plugin platform, and Headless
  host remain future work.
