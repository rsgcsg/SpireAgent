# Bridge v2 Current Status

This is the canonical current status for the Gateway/Re connector boundary.
Historical preview reports do not grant current authority.

The accepted destination is repository
[ADR-0002](../../../docs/current/decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md).
This file reports present implementation/evidence only; target components do
not become current capability by appearing in that ADR.

## Source Truth

```text
Gateway/Re source    2.0-preview.67
Re schema            26
game                 v0.109.1|c8c577f6|-820620422
game assembly SHA    2cb39e2eee651743829abcc0df4dd9cd7e65f46287c7ca264481115c9602382f
game assembly MVID   208f08b8-d5f5-47f8-9e96-d3a4299ee709
last loaded protocol 2.0-preview.66
loaded Gateway SHA  b0b31f769f25d5a1e5231e92af76f7f09e07ab38f5c43f1ae753eba0b61d7a8a
loaded Gateway MVID a7008eea-b3cd-4cb8-b75c-6dee64e9cd5c
runtime epoch        cebc39821b7e4d16aa1d9d2d9e680df8
Environment Profile env-8eee4ee3f08d1181b7405305
environment digest   2654bef1049808f852f6d946a283941a14db6893678a134543510afeb8d45aa0
Modset               2747e126fbb2f770b5cf2e6b971713a3b0b80d017b606598ca75fc758764a688
Patch                ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
operation catalog    8878447144e4fe4d8c01b2940335feb504367a81ac76e4b4fd22e2f4d6b85f0c
mode                 migration_exploration
```

Preview.67 is built and installed on disk with SHA
`7da8946c9374c7030d5162e8cb1930e1fc0186edc1c1088f3b2fc371c7a9b768`
and MVID `12b55aef-499f-4ea8-8414-d3a360baa2ac`, but the game has not been
cold-started. Therefore the loaded/runtime/Organic facts above remain
Preview.66 evidence. Gateway v1 is retired and every `/api/v1` route returns
`410 Gone` in the last loaded artifact.

## Preview.67 Source State

Preview.67 adds a required `identity_shadow` with non-authorizing semantic-
state and authority-projection candidate hashes. Current state/action identity,
permissions, execution, completion and Re Prompt are unchanged. Contract tests
cover relevant versus irrelevant permission-scope changes, and Re rejects a
missing or authorizing shadow. This is implementation evidence only until a
fresh cold-load and bounded action journey are recorded.

Gate 1 is closed only as the bounded ordinary-single-player v2 connector
baseline documented by the operation inventory. Unsupported variants remain
explicit fail-closed rows.

## Preview.66 Migration State

Preview.66 uses one append-only qualification ledger for multiple exact
environments. The active slot key is:

```text
environment_digest + surface_kind + operation
```

The Environment Profile is a local derived planning index, not permission.
Candidate eligibility is risk-class based, but a current operation identity
and exact installed candidate package remain mandatory. The Gateway atomically
hot-reloads ledger changes and revalidates the complete snapshot before
publishing scopes.

Current exact operation state:

| Contract class | Count | Current authority | Final-binary Organic evidence |
|---|---:|---|---|
| explicit high-precision | 5 | 1 persistent `qualified`, 4 `session_canary` | `continue_run`: 2 ordinary runs in 2 runtime epochs |
| manifest-derived fallback | 82 | 82 `session_canary` | none promoted |

The fallback contracts are conservative identity/test-confirm records. They
do not assert semantic equivalence: each canary still depends on the current
Provider publishing the action, current native legality, execute-time
revalidation, native Commit, and a non-empty Gateway completion witness. Empty
or failed completion quarantines only that operation. Operations absent from
the current manifest remain governed by exact embedded policy or fail closed.
No operation-name wildcard exists.

Final qualified evidence:

```text
run-20260726132908-2e4rz6
run-20260726133036-d3tr3a
operation main_menu/continue_run
witness   saved_singleplayer_run_became_active
package   migration-env-8eee4ee3f08d1181b7405305-5d300df4b5e7f6d7-qualified-ms1u62n0
```

Both runs used Re's current opaque `continue_run` action with
`bridge_advertised` authority and settled through the Gateway command
lifecycle. The qualified package survived a later cold restart and was
revalidated with `runtime_epoch=not_session_bound`.

## Permission Boundary

`migration_exploration` is not unrestricted. It may seed reviewed exact
operation contracts across reversible navigation, progression, and persistent
run mutation risk classes, but only through installed exact candidate
packages. Publication and execution still require:

- exact game, Gateway, Modset, Patch, environment, operation, completion, and
  witness identity;
- one current input owner and one exact operation scope;
- current native legality and operands;
- opaque state binding and execute-time revalidation;
- native STS2 Commit and Gateway semantic completion;
- unknown-no-retry and operation-local quarantine.

Profiles, binding audits, static fingerprints, D recommendations, fixtures,
and one successful canary do not grant persistent authority.

## Lifecycle And Failure Evidence

Automated tests cover:

- package coexistence for the same operation in multiple environments;
- wrong environment, Modset, Patch and Gateway MVID rejection;
- old-protocol package readability without applicability;
- expired and corrupt package handling;
- revoke, supersede and rollback;
- hot reload and cold-restart recovery;
- semantic Witness mismatch, timeout, unknown outcome, Patch drift, and
  first-failure quarantine.

The final Preview.66 artifact completed one real evidence-to-package migration
and one later cold-restart recovery. The final projection contains 87
applicable packages and scopes: one qualified and 86 candidate-backed session
canaries. All 86 current grants survive projection instead of being clipped by
the historical-grant window. Another 105 packages remain audit-visible but
inapplicable. No cross-game-version or cross-Mod Organic migration was
completed with this final binary.

Immediately after `continue_run`, Re may sample a transient loading instant
where shared-state projection is unavailable. It records an unsupported
successor checkpoint but does not retry the already settled command. This is
remaining observation-timing debt, not a failed Gateway completion.

## Explicit Non-Claims

- One qualified operation does not qualify its Surface siblings.
- 86 session canaries are not persistent qualifications.
- 82 manifest-derived fallback identities are not semantic qualification.
- Static binding similarity is not runtime qualification.
- Controlled Gateway identity drift is Profile-isolation evidence, not
  cross-version or cross-Mod Organic evidence.
- Gate 1 closure is not complete-game or complete-visible-information closure.

See the
[Preview.66 closeout](PREVIEW_66_MULTI_ENVIRONMENT_MIGRATION_CLOSEOUT_2026-07-26.md),
[Preview.65 v0.109.1 closeout](PREVIEW_65_V01091_REQUALIFICATION_CLOSEOUT_2026-07-26.md),
and [operation inventory](OPERATION_RETIREMENT_INVENTORY.json).

## Next Step

Cold-start Preview.67, run `npm run connector -- verify-loaded-artifact`, then
capture one read-only evidence snapshot and one bounded ordinary action from a
different Commit/completion mode. Inspect identity-shadow stability without
switching authority. After that, prototype capabilities summary/on-demand
detail through dual-read comparison. Do not widen wildcard, Surface-wide, or
build-wide authority.

The exact prepared commands, acceptance boundary and local rollback point are
in the [Preview.67 Live handoff](PREVIEW_67_IDENTITY_SHADOW_LIVE_HANDOFF_2026-07-27.md).
