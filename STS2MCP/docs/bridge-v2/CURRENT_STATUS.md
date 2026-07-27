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
last loaded protocol 2.0-preview.67
loaded Gateway SHA  100ddf42c2114b30602a41c8908f63e154fc8f41a10ed37d4e2a1bded84fc74d
loaded Gateway MVID 65bd744d-270b-4026-84c4-2ee397eee4e2
runtime epoch        13f8d3d62d1644ec91a405a59dc4cd64
Environment Profile env-788f4e8ca807b9e99e30757d
environment digest   0cc2f76995afbffece47fb793d8797030acf64f908f4887d2fe91120df401164
Modset               c3dc252c1ba3f60542707b4aa8f2469c1b44f1552dca77eea626d585ad0fd070
Patch                ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
operation catalog    8878447144e4fe4d8c01b2940335feb504367a81ac76e4b4fd22e2f4d6b85f0c
mode                 migration_exploration
```

Preview.67 is built, installed, and cold-loaded with exact SHA/MVID agreement.
Gateway v1 is retired and every `/api/v1` route returns `410 Gone` in the
loaded artifact. A duplicate Preview.66 backup manifest inside `mods/backups`
was the proven cause of the earlier simultaneous `STS2_MCP Loaded` and
`STS2_MCP Failed` records. It was reversibly moved outside the native scan
tree; the current loaded Modset is one successful `STS2_MCP` and
`exact_bridge_only`.

## Preview.67 Source State

Preview.67 adds a required `identity_shadow` with non-authorizing semantic-
state and authority-projection candidate hashes. Current state/action identity,
permissions, execution, completion and Re Prompt are unchanged. Contract tests
cover relevant versus irrelevant permission-scope changes, and Re rejects a
missing or authorizing shadow. Cold-load and strict Re decode are now proven.
The exact migration workflow installed 87 session-canary packages and the
Gateway hot-reloaded and revalidated all 87. Re completed one no-mutation
dry-run (`run-20260727101452-4yy236`). Preview.67 still has no real mutation,
settled action canary, Organic action evidence, Inspection authority, or
persistent qualification.

Gate 1 is closed only as the bounded ordinary-single-player v2 connector
baseline documented by the operation inventory. Unsupported variants remain
explicit fail-closed rows.

## Historical Preview.66 Migration Evidence

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

Preview.66 exact operation state in its recorded environment:

| Contract class | Count | Preview.66 authority | Preview.66 Organic evidence |
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
completed with this final binary. Those Preview.66 authority records are
inapplicable to the current Preview.67 environment.

Immediately after `continue_run`, Re may sample a transient loading instant
where shared-state projection is unavailable. It records an unsupported
successor checkpoint but does not retry the already settled command. This is
remaining observation-timing debt, not a failed Gateway completion.

## Explicit Non-Claims

- Preview.66's one qualified operation does not authorize Preview.67 or qualify
  its Surface siblings.
- Preview.67's 87 session canaries are not persistent qualifications.
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

All non-Live preparation is complete. From `Re-SpireAgent/`, run
`npm run agent:run`. It may choose only a current Gateway-advertised run-entry
action and remains one-game bounded. Return the run id and terminal decision;
this is the first possible Preview.67 action-canary/Organic evidence, not a
predeclared qualification. Do not retry unknown outcomes or widen wildcard,
Surface-wide, or build-wide authority.

The exact identity, repaired installation state, startup-readiness behavior,
rollback and evidence boundary are in the
[Preview.67 operator readiness closeout](../../../docs/current/audits/PREVIEW_67_OPERATOR_READINESS_CLOSEOUT_2026-07-27.md).
