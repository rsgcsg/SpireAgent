# Current Status

This is the canonical short current-state document for the rebuilt project.

## Mainline

- **Agent:** `Re-SpireAgent/`.
- **Connector:** `STS2MCP/` Semantic Gateway, REST contract, and optional
  v2-only MCP adapter.
- **Legacy:** the original root runtime and P8--P15 route are archived.

## Current Gate

**Gate 1 remains closed as a bounded ordinary-single-player v2 connector
baseline on its recorded exact environment. The first D3 operation-scoped
permission loop is closed. Preview.65 extends it with a disabled-by-default
persistent operation qualification kernel and cross-environment impact
tooling. Preview.65 and Gate 3 Local Control Coordination Alpha are now built,
installed, cold-loaded, and strictly decoded by Re; the newly updated local
game `v0.109.1` is deliberately diagnostic-only because it has no reviewed
exact-environment policy.**

Current source contract is `2.0-preview.65`; Re normalized schema is `26`.
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

Preview.64 adds descriptive client registration, one runtime-bound mutation
controller lease, generation fencing and command attribution. It reuses
`bridge.runtime_instance_id`; it does not add authentication, RBAC, secrets or
a second permission system. Coordination admission precedes the command
Ledger, while D3 operation permission and game legality remain unchanged.
Gateway tests (142), Re tests (175), Re typecheck/build, Python syntax and the
Gateway Release build pass.

Preview.65 separates persistent qualification from volatile session grants.
It adds component-level operation identities, bounded `session_canary`
candidate packages, two-runtime `qualified` packages, exact startup
applicability, operation-scoped session quarantine, append-only
install/supersede/revoke/rollback, and non-authorizing
capture/diff/collect/assemble/dry-run tools. The first non-menu gray candidate
is only `shop_room/open_shop_inventory`; it does not authorize purchases or
other shop operations. Gateway tests (`153`), Re tests (`179`), Re typecheck,
Re build, Python syntax, and qualification fixtures pass. Preview.65 rebuilt
against the current `v0.109.1` installation with zero warnings as SHA
`599a126d03e314ce6f8bd58ae47fb7af24e208ab02e008f8b593e33d5b842341`,
MVID `c0bfde51-1f4b-44af-a1b1-2a884cdc34ce`. The earlier SHA
`11b6b0149...164e` / MVID `4e870cd2-3e35-4db5-8a1b-7c7a41ca631f`
was built against the preceding game assembly and is not the current installed
artifact.

The current Preview.65 artifact has been built, installed and Steam
cold-loaded:

```text
SHA      599a126d03e314ce6f8bd58ae47fb7af24e208ab02e008f8b593e33d5b842341
MVID     c0bfde51-1f4b-44af-a1b1-2a884cdc34ce
runtime  0b42511dd71f4c40883830de8ef3a89c
game     v0.109.1|c8c577f6|-820620422
Modset   57d2e880e45244fbd55422096ba3f218de84e79596d9097a08637a3cbbd54a88
exact policy bridge_v2_exact_environment_policy_2026_07_24
gray policy  bridge_v2_gray_permission_candidates_2026_07_25
Patch    clean_known_owners
Patch digest ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
```

Built, installed and loaded SHA/MVID matched. Re strict inspection decoded the
same protocol, game, Gateway, Modset, Patch, qualification, and coordination
identities. The qualification store is empty, with
`persistent_authority_enabled=false` and
`session_canary_candidate_enabled=false`. Compatibility is `untested`; normal
observation, Inspection, and all actions are disabled. State correctly
projects `unknown + unsupported + authority none`, and sampled `/api/v1`
endpoints return `410 Gone`.

A loaded two-client coordination check registered two descriptive local
clients, let client A acquire generation 2, rejected client B with HTTP `409`
and `controller_lease_held`, then released A and returned to no active
controller. This verifies loaded coordination without granting a game action.

A non-authorizing exact-assembly audit recorded `sts2.dll` SHA
`2cb39e2e...382f`, MVID `208f08b8-d5f5-47f8-9e96-d3a4299ee709`.
All 13 registered combat-pile sources remain static matches and Tutor remains
the deliberate target-player `code_required` holdout. The existing
`v0.109.0` scenario correctly failed on both game identity and game assembly
identity. Audit authorization and qualification effects are `none`.

The historical Preview.63 Re production-path canary executed
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

The standalone Preview.64 Release was built as SHA
`84d812ac7fba2a7e0169a7afb800b8d69e967580a941a43c037e38a3c3cec494`
but was not installed as that standalone artifact. Its coordination behavior
is now loaded as part of Preview.65 and has the bounded non-game conflict
evidence above.

## Immediate Next Step

Audit the exact `v0.109.1|c8c577f6|-820620422` source/private bindings and
player-visible lifecycles before creating any observation or action policy for
that game identity. Do not inherit `v0.109.0` permission from compilation,
loaded identity, Modset similarity, or the successful coordination check. Do
not install a candidate or `qualified` package while compatibility remains
`untested`.

See the
[Gate 1 closeout and selector audit](../../STS2MCP/docs/bridge-v2/GATE1_CLOSEOUT_AND_SELECTOR_TRANSACTION_AUDIT_2026-07-24.md)
and the
[Gate 1 adaptation closeout](../../STS2MCP/docs/bridge-v2/GATE1_ADAPTATION_AND_COMPATIBILITY_CLOSEOUT_2026-07-24.md)
and the
[automatic-adaptation audit](audits/CONNECTOR_AUTOMATIC_ADAPTATION_AND_D_WORKFLOW_AUDIT_2026-07-24.md)
and the
[D3 permission closeout](../../STS2MCP/docs/bridge-v2/D3_PERMISSION_GRAY_ROLLOUT_CLOSEOUT_2026-07-25.md)
and the
[Gate 3 coordination closeout](../../STS2MCP/docs/bridge-v2/GATE3_LOCAL_CONTROL_COORDINATION_CLOSEOUT_2026-07-25.md)
and the
[Preview 65 qualification closeout](../../STS2MCP/docs/bridge-v2/PREVIEW_65_PERSISTENT_QUALIFICATION_AND_ADAPTATION_CLOSEOUT_2026-07-25.md)
and the
[operation inventory](../../STS2MCP/docs/bridge-v2/OPERATION_RETIREMENT_INVENTORY.json).

## Explicit Non-Claims

- Preview.63 session auto-approval remains volatile and operation-scoped.
  Preview.65 can persist only an operator-installed exact package that passes
  Gateway validation; D and Re still own no authority.
- Preview.64 coordination identity is descriptive and local; it is not client
  authentication or protection from a malicious local process.
- Preview.65 is installed and loaded, but has no current-game action canary,
  Organic qualification, persistent qualification, cross-version
  qualification, or cross-Mod qualification.
- Gate 1 closure is not complete-game or full-visible-information closure.
- Historical v1 source and records are archive evidence, not a runtime fallback.
- Companion, Workshop product, public Agent SDK, plugin platform, and Headless
  host remain future work.
