# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/`.
- **Connector:** `STS2MCP/` Semantic Gateway, REST contract, and optional
  v2-only MCP adapter.
- **Legacy:** the original root runtime and P8--P15 route are archived.

## Current Gate

**Gate 1 is closed as a bounded ordinary-single-player v2 connector
baseline. The first D3 operation-scoped permission/gray-rollout loop is also
closed at session-canary scope. Gate 2 remains the next functional coverage
gate; this change does not resume feature expansion or broaden permissions.**

Current source contract is `2.0-preview.63`; Re normalized schema is `26`.
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

Preview.63 adds a Gateway-owned operation-scoped permission manager and
conservative runtime Harmony Patch inventory. The reviewed exact-environment
policy remains the absolute permission ceiling. Non-authorizing gray
candidates may receive runtime-epoch-bound `session_canary` grants; only
Gateway-confirmed semantic completion can replace one with
`session_auto_approved`. Validated failure, timeout, unknown outcome, identity
drift or unknown Patch ownership quarantines the operation for the session.

The current Preview.63 artifact has been built, installed and Steam cold-loaded
on the exact local environment:

```text
SHA      d05b0580917c5b60acc908ec2575d2d0f8e59778da8c2379cebc0d5e72c90aa0
MVID     4836b3df-fffc-498a-b9c9-ac666adb5a5b
runtime  8aec74c19fed4a09984dc56a7e0c36ac
game     v0.109.0|c12f634d|-1639417500
Modset   2fd2cd789eb082ebfb91a3cd41c6a13869f359bc1d326fb752953c0bf9789d6f
exact policy bridge_v2_exact_environment_policy_2026_07_24
gray policy  bridge_v2_gray_permission_candidates_2026_07_25
Patch    clean_known_owners
Patch digest ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
```

Built, installed and loaded SHA matched. A Re production-path canary executed
advertised `main_menu/continue_run` once, observed semantic saved-run
activation, and settled after eight polls / 1569 ms at
`reward_flow/reward_claim`. The Gateway replaced
the operation's version-1 `session_canary` grant with a version-2
`session_auto_approved` grant in the same runtime epoch. This is a real
session-scoped gray canary, not persistent qualification or broad automatic
authority. A read-only assertion over the recorded pre/post observations
confirmed exact identity, immediate grant-version succession, supersession,
and exact action-scope binding. The assertion has
`authorization_effect=none` and `qualification_effect=none`.

The predecessor Preview.62 artifact
`d66f5986...a892` completed an operator-directed bounded canary:
`main_menu -> singleplayer_menu -> main_menu` through two advertised opaque
actions and coherent successor states. Each action was submitted once; a local
polling-script error resumed the existing request rather than resubmitting it.
That canary remains attributed to its predecessor SHA/MVID/runtime and does not
transfer to the current post-D2 artifact.

## Immediate Next Step

The recorded-evidence assertion path and two-epoch low-risk repeat are
complete. Preserve the current two-candidate ceiling and do not manufacture a
live failure merely to exercise quarantine. The next separately scoped change
may resume Gate 2 visibility work or begin Gate 3 authentication/controller
lease work; neither may infer authority from a fingerprint, fixture, grader or
D recommendation. No non-navigation gray candidate should be added without
independent evidence and candidate-policy review.

See the
[Gate 1 closeout and selector audit](../../STS2MCP/docs/bridge-v2/GATE1_CLOSEOUT_AND_SELECTOR_TRANSACTION_AUDIT_2026-07-24.md)
and the
[Gate 1 adaptation closeout](../../STS2MCP/docs/bridge-v2/GATE1_ADAPTATION_AND_COMPATIBILITY_CLOSEOUT_2026-07-24.md)
and the
[automatic-adaptation audit](audits/CONNECTOR_AUTOMATIC_ADAPTATION_AND_D_WORKFLOW_AUDIT_2026-07-24.md)
and the
[D3 permission closeout](../../STS2MCP/docs/bridge-v2/D3_PERMISSION_GRAY_ROLLOUT_CLOSEOUT_2026-07-25.md)
and the
[operation inventory](../../STS2MCP/docs/bridge-v2/OPERATION_RETIREMENT_INVENTORY.json).

## Explicit Non-Claims

- Preview.63 session auto-approval is volatile and operation-scoped; it is not
  persistent qualification, cross-runtime inheritance, or D-owned authority.
- Gate 1 closure is not complete-game or full-visible-information closure.
- Historical v1 source and records are archive evidence, not a runtime fallback.
- Companion, Workshop product, public Agent SDK, plugin platform, and Headless
  host remain future work.
