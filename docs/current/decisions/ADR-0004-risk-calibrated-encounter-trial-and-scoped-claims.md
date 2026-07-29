# ADR-0004: Risk-Calibrated Encounter Trial And Scoped Claims

## Status

Accepted on 2026-07-28. This refines the control plane of
[ADR-0002](ADR-0002-semantic-gateway-two-plane-target-architecture.md) while
preserving the native-contract migration in
[ADR-0003](ADR-0003-operation-retirement-and-native-continuation-migration.md).

ADR-0006 (2026-07-30) retains this diagnostic/session/durable separation and
closes one ambiguity: only an explicit native contract may enter the package
or durable-claim lifecycle. Manifest fallbacks remain volatile session trials.

## Problem

The Preview.63-68 permission path coupled three different questions:

1. can the Gateway coherently observe the current environment and input owner;
2. may one currently encountered action enter a volatile trial; and
3. has a compatibility claim earned persistence across restarts.

That coupling made an unreviewed game build fully blind until an external tool
installed candidate packages for most declared operations. Preview.68 therefore
installed 87 session candidates before a run, even though only one current
Surface could own input. Package count looked like compatibility while adding
no current native evidence. A harmless new/resumed-run mount transition could also block
the Agent because no mutation scope existed before an actionable Surface had
appeared.

The opposite shortcut is also wrong: a successful action in a new build does
not prove broad or persistent compatibility.

## Decision

Keep the two-plane Semantic Gateway and split the control decision into three
orthogonal states:

```text
diagnostic observation
  != encounter provisional trial admission
  != persistent scoped compatibility claim
```

In `migration_exploration`, the Gateway may issue a session-only provisional
grant for an action that is present on the current uniquely resolved Surface
without a preinstalled qualification package. Admission requires all of:

- complete game version, commit and loaded main-assembly identity;
- exact loaded Gateway SHA/MVID and runtime epoch;
- an exact or explicitly candidate Modset classification;
- a clean known-owner Patch inventory;
- one source-resolved current Surface and current native legal action;
- an existing bounded adapter/outcome contract and risk rule;
- no prior quarantine for that Surface/action in this runtime.

The grant is state-bound at publication, rechecked at execution, expires with
the runtime, and has `admission_basis=encounter_source_resolved`. Confirmed
semantic completion changes only its session tier from `session_canary` to
`session_trial_confirmed`. Failure, timeout, witness mismatch, identity drift,
Patch drift, mode change, or expiry quarantines the local scope. No result from
this path writes a persistent qualification.

Persistent claims remain separately versioned, exact-environment scoped,
reviewable, revocable, supersedable, and rollbackable. They may use trial
evidence, but trial admission never implies claim maturity.

The Operator Shell first performs a read-only state probe. It starts Re when
existing authority or encounter-provisional readiness is present. The bulk
installed-candidate migration remains only a legacy fallback during migration;
it is not the target startup path.

## Architecture Consequences

- Source resolution happens once, before permission projection. Permission may
  withhold some actions but cannot create a Surface, operand, legality rule,
  Commit, or completion witness.
- A no-input transition can be observed and polled without preauthorizing a
  future action.
- A new exact game build can gather bounded action evidence without inheriting
  an old persistent claim.
- An unknown Modset does not become eligible merely because a Mod manifest is
  present. Current Mod candidate classification remains conservative.
- `surface_kind + operation` remains the temporary grant lookup key. ADR-0003
  still requires migration to native source/adapter/outcome/partition claim
  identity; this ADR does not make operation packages the final architecture.

## Runtime Verification Note

Four Preview.69 runs on exact loaded SHA `8e7a...`, MVID `0e3d...`, runtime
`740e...` exercised the decision in production: current source-resolved actions
received session-scoped authority, successful completion advanced volatile
grants, and no run created persistent qualification. The records settled 258
actions and safely rejected six stale selections before execution. Their
provenance is `unrecorded`, so this validates the runtime separation but does not
promote a compatibility claim. A later rebuilt MVID must start a new runtime
epoch and cannot inherit those grants.

## Rejected Alternatives

- **Keep the reviewed environment as an absolute trial ceiling:** this makes
  evidence collection depend on manual preauthorization and stalls every data-
  only game update.
- **Automatically persist a successful trial:** one success cannot establish
  cross-restart semantic compatibility.
- **Let Re or D authorize trials:** this would duplicate Gateway legality and
  break the sole-authority boundary.
- **Admit every declared operation before observation:** this recreates the
  87-package pseudo-whitelist and hides what the run actually exercised.
- **Use static similarity alone:** method or fingerprint similarity cannot
  prove current owner, native legality, Commit, or outcome.

## Rollback

Set permission mode to `strict` or revert the Operator Shell to the installed-
package path. All encounter grants are volatile, so restarting the Gateway is a
complete rollback. Persistent qualification files are neither created nor
modified by encounter admission.
