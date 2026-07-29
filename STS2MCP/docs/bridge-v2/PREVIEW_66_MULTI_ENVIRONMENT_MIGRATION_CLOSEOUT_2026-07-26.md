# Preview.66 Multi-Environment Migration Closeout

Date: 2026-07-26

## Verdict

Preview.66 closes one narrow but real automatic requalification loop:

```text
exact loaded environment
  -> non-authorizing Environment Profile
  -> explicit or manifest-derived operation identity
  -> exact candidate package
  -> Gateway-owned session canary
  -> two exact Organic decisions in distinct runtime epochs
  -> qualified package
  -> append-only install and hot reload
  -> cold-restart exact revalidation
```

This is not build-wide qualification, generic Mod compatibility, or automatic
support for every implemented action. It proves that one global qualification
ledger can safely hold multiple exact environments and that one exact
operation can move from an unknown Gateway build to persistent authority
without editing the Gateway policy or restarting after every ledger change.

## Architecture Selected

Preview.66 extends the existing Permission Manager and qualification ledger. It
does not add a second permission engine.

### Environment Profile

`tools/connector-environment-profiles.mjs` maintains a local, derived profile
index keyed by:

- protocol;
- game version, commit, and actual loaded main-assembly hash;
- Gateway SHA-256 and MVID;
- Modset fingerprint;
- Patch digest;
- Gateway environment digest;
- operation-catalog digest;
- migration-policy digest;
- compatibility-policy digest.

Local paths and runtime epoch are intentionally excluded from identity. A
Profile is an inspection and planning index only. It cannot authorize an
action, install a package, or turn historical evidence into current evidence.

### One Multi-Environment Ledger

The append-only qualification store remains the only persistent authority
input. Active package slots are keyed by:

```text
environment_digest + surface_kind + operation
```

The prior `surface_kind + operation` key could let a package for one
environment supersede the same operation in another environment. C# and JS now
use the exact environment key, and tests prove that packages can coexist while
only the current exact environment applies.

Historical Preview packages remain readable for audit. A package with an old
protocol or different identity is inapplicable rather than corrupting the
whole ledger.

### Risk-Based Migration Policy

The deleted operation-name candidate list was replaced by
`BridgeV2/Runtime/migration-permission-policy.json`. It classifies operation
contracts by risk:

| Risk class | Balanced gray | Developer gray | Migration exploration |
|---|---:|---:|---:|
| reversible navigation | yes | yes | yes |
| progression | no | yes | yes |
| persistent run mutation | no | no | yes |

The catalog has two intentionally different precision levels:

- five explicit high-precision overrides bind a reviewed completion boundary
  and exact expected witness;
- 82 conservative fallback identities are derived from the 87-operation
  Gateway contract manifest. They use
  `gateway_semantic_completion_observed` and
  `gateway_reported_operation_witness`, remain eligible only in
  `migration_exploration`, and require a non-empty witness actually reported
  by the Gateway.

Fallback identity is not a claim of semantic equivalence. It permits a
state-bound live canary for an operation that the current Gateway already
publishes and executes; it does not manufacture an action, infer a game rule,
or replace the Provider's native legality and completion implementation.
Explicit contracts always override fallback metadata.

This is not wildcard authority. A session canary still requires:

- an exact installed candidate package;
- a current explicit or manifest-derived operation identity;
- a matching exact environment, Modset, Patch, operation fingerprint,
  completion boundary, and package identity;
- current native owner and legal operands;
- execute-time revalidation;
- native game Commit;
- Gateway semantic completion with the explicit expected witness or, for a
  fallback, a non-empty operation-specific witness reported by the Gateway.

Operations absent from the current manifest, changed owner/Commit/completion
semantics, unknown Patch ownership, empty/missing witnesses, or failed
completion remain `code_required`, operation-local quarantined, or fail
closed.

### Atomic Store Reload

The Gateway detects qualification-store file length or modification-time
changes, parses a complete snapshot, and revalidates every package before
publishing any new scope. A malformed replacement fails closed. Runtime
quarantine is retained across reloads. No REST or MCP mutation endpoint was
added.

This removes the old restart-after-install requirement without weakening
exact applicability. Cold restart remains the final test for persistent
recovery.

### Migration Orchestrator

`tools/connector-migration-orchestrator.mjs` composes the existing tools:

```text
profile sync
  -> migration plan
  -> exact candidate package assembly
  -> dry-run
  -> append-only install
  -> Gateway reload verification
  -> exact Organic evidence collection
  -> qualified package assembly
  -> supersede candidate
  -> Gateway reload verification
```

The collector rejects mixed environment, operation, provider, outcome, or
provenance evidence. D remains non-authorizing; the Gateway remains the only
live permission decision and enforcement owner.

## Final Exact Runtime

```text
protocol             2.0-preview.66
game                 v0.109.1|c8c577f6|-820620422
Gateway SHA          b0b31f769f25d5a1e5231e92af76f7f09e07ab38f5c43f1ae753eba0b61d7a8a
Gateway MVID         a7008eea-b3cd-4cb8-b75c-6dee64e9cd5c
runtime epoch        cebc39821b7e4d16aa1d9d2d9e680df8
Environment Profile env-8eee4ee3f08d1181b7405305
environment digest   2654bef1049808f852f6d946a283941a14db6893678a134543510afeb8d45aa0
Modset               2747e126fbb2f770b5cf2e6b971713a3b0b80d017b606598ca75fc758764a688
Patch                ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
operation catalog    8878447144e4fe4d8c01b2940335feb504367a81ac76e4b4fd22e2f4d6b85f0c
migration policy     9d5cc27bb1f7dd9a1839d66267c2e651a06980a32757d0c91e08b0d165574359
mode                 migration_exploration
```

The Release DLL was built, installed, launched through Steam, and confirmed
loaded with the exact SHA and MVID above. A later cold restart created the
recorded final runtime epoch and revalidated the persistent package.

## Final Operation State

| Class | Count | Final state | Evidence boundary |
|---|---:|---|---|
| explicit high-precision contracts | 5 | 1 persistent `qualified`, 4 `session_canary` | exact reviewed boundary/witness |
| manifest-derived fallback contracts | 82 | 82 `session_canary` | identity/test-confirm only; no persistent qualification |
| total current operation identities | 87 | 1 qualified, 86 session canaries | exact final environment |

The cold-restarted Gateway publishes all 87 exact scopes and all 86 current
session grants. It also retains 105 historical packages for audit, but none of
those packages is applicable to the final environment.

Final qualified evidence:

```text
run-20260726132908-2e4rz6
run-20260726133036-d3tr3a
operation main_menu/continue_run
witness   saved_singleplayer_run_became_active
package   migration-env-8eee4ee3f08d1181b7405305-5d300df4b5e7f6d7-qualified-ms1u62n0
```

Both runs selected the current opaque `continue_run` action through Re,
received `bridge_advertised` authority, and settled through the Gateway
command lifecycle. The package remains applicable after cold restart with
`runtime_epoch=not_session_bound`.

## Re Run Boundary

`agent:run` remains one-game bounded by default. Preview.66 adds the explicit
`--allow-run-entry` option so a migration experiment may cross a top-level
menu boundary only through a current `bridge_advertised` action. It never
enables local reconstruction or arbitrary menu automation.

Evidence-producing runs must explicitly declare provenance, for example:

```bash
AGENT_EVIDENCE_PROVENANCE=ordinary_gameplay \
  npm --prefix Re-SpireAgent run agent:run -- \
  --allow-run-entry --max-ticks 1
```

The provenance label is not authority; it only prevents real evidence from
being silently mixed with operator-positioned or unrecorded runs.

## Validation

The final source revision passed:

- Gateway C# tests: `162/162`;
- Gateway Release build: zero warnings and zero errors;
- Re tests: `186/186`;
- Re typecheck and production build;
- qualification-ledger fixtures;
- environment-profile fixtures;
- migration-orchestrator fixtures;
- compatibility fixtures;
- exact operation-binding audit: all five high-precision probes report
  `reviewed_bindings_match`;
- broader combat-pile source audit: intentionally exits non-green with
  `review_required_unregistered_callers` for the target-player-bound `Tutor`
  caller and rejects the old v0.109.0 scenario as current evidence;
- live non-authorizing migration plan: 1 exact-profile direct confirmation and
  86 evidence-collection routes, with no automatic semantic-equivalence claim;
- final exact install and loaded-identity comparison;
- two-runtime-epoch Organic migration;
- append-only install, hot reload, supersession, and cold-restart recovery.

Fixture tests separately cover wrong environment, Modset, Patch and MVID,
expiry, corrupt stores, revoke, rollback, semantic-witness mismatch, timeout,
unknown outcome, and quarantine. Fixtures prove code behavior, not Organic
compatibility.

## Residual Debt

- Only `continue_run` has final Preview.66 persistent qualification.
- The 82 fallback contracts are conservative migration identities, not
  reviewed semantic-equivalence claims. Each still needs real runtime evidence
  before persistent qualification; an empty or mismatched witness quarantines
  only that operation.
- `Tutor` remains outside the current operation manifest and is correctly
  classified `code_required_new_owner_binding`; manifest fallback must not
  absorb its target-player authority semantics.
- No cross-game-version or cross-Mod Organic migration was completed with the
  final Preview.66 binary. Controlled Gateway identity drift proved Profile
  isolation but is not a substitute for either.
- The strict capabilities document is approximately 580 KB with all current
  candidates because it repeats complete package/grant audit records. This is
  correct but too large for a polished product boundary; future work should
  add summary/pagination or on-demand diagnostics without weakening Re's
  strict current-scope validation.
- Immediately after `continue_run`, Re can observe a transient loading instant
  where shared-state projection is unavailable and normalize the successor as
  unsupported. The Gateway command already has exact semantic completion and
  Re does not retry. This is observation-timing/coverage debt, not evidence of
  failed execution.
- The Profile registry and migration workspace are local generated state and
  intentionally ignored by Git.

## Next Work

Do not widen wildcard or Surface authority. The next useful runtime work is to
exercise one of the 86 exact candidate operations under normal gameplay,
preferably a different Commit/completion mode, and let the same orchestrator
either qualify or quarantine it. Promote a fallback to a high-precision
explicit contract only when source/Commit/witness evidence shows that the
generic boundary is insufficient.
