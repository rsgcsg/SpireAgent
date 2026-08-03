# Connector V3 Support And Compatibility

## Current Claim

Connector V3 is a conditional freeze candidate for ordinary vanilla single-player STS2 on
the exact reviewed environment. It is not a claim of arbitrary game-version,
Mod, multiplayer or cross-machine compatibility.

The current source covers all cataloged operations with direct V3 contracts.
That is not a claim that every source variant is cataloged. Runtime support is
still source-, operation- and environment-scoped; source implementation alone
grants nothing.

## Compatibility Identity

Authority is bound to:

- protocol and contract digests;
- Gateway SHA, MVID and runtime instance;
- game version/commit/main-assembly identity;
- exact Modset fingerprint;
- runtime Patch digest;
- permission policy and operation fingerprint.

Any mismatch is a new environment. Empty scope, unknown Mod, unknown source,
ambiguous owner, changed operand binding or incomplete Outcome remains
unsupported or quarantined.

The current reviewed Modset is `exact_bridge_only`. Merely loading another
Mod does not prove its observations, operations or Outcomes are supported.
Mod-declared contracts cannot authorize themselves.

## Authority Matrix

| State | Meaning | Mutation |
|---|---|---|
| unsupported | no exact safe contract or environment | denied |
| quarantined | known risk/revocation requires review | denied |
| trial/canary | exact operation on one runtime | session only |
| scoped-qualified | reviewed operation/environment evidence | only exact scope |
| durable | persisted exact qualification | only while every identity matches |

Exact Preview.11 runtime state:

- encountered session canary scopes exist;
- many current operations promoted to `session_trial_confirmed`;
- rest and combat-hand examples were quarantined after witness/unknown
  evidence, while unknown sources never received authority;
- scoped/durable qualification is empty;
- persistent authority is disabled.

Preview.12 changes contract fingerprints and runtime identity. It inherits no
Preview.11 session authority and remains pending cold-load evidence.

Canary is never whole-Surface, whole-origin or sibling-operation support.

## Information Support

Semantic Inspection and linked detail are state-bound, read-only and
non-authorizing. The optional `native_pages.v1` profile is evidence tooling,
not broader support or mutation permission. Hidden RNG, true draw order and
future rewards/events are unsupported by policy even if reflection could read
them.

## Qualification And Revoke

Fixture, build, install, load, one canary, Journey and Organic evidence are
separate levels. Qualification requires reviewed evidence for the exact
operation/environment and cannot be inferred from prior MVIDs. Revoke and
quarantine must fail closed before Commit.

The current qualification store is empty. The support matrix must remain
`CONDITIONAL FREEZE CANDIDATE` until Preview.12 changed-path and rare-family
Live evidence, Human profile lifecycle and loaded rollback/revoke are reviewed.
Preview.11 already supplies one same-artifact completed Journey, but that does
not qualify Preview.12 or unexercised sources.

## Rollback

`npm run deploy` backs up the prior DLL, manifest and provenance as one
coherent deployment directory. Never mix files from two backups. A disk
restore is not a loaded rollback: cold-start and `npm run verify:loaded` must
prove the restored SHA/MVID/runtime and authority refusal before reinstalling
the candidate.

## V2 Retirement

Connector V3 is the only production Agent contract. The active Re entrypoint
does not import V2 wire/client/state/action code. V2 endpoints and internal
Bridge assets may remain only for migration diagnostics, regression tests and
coherent rollback. They cannot publish V3 authority, execute a V3 command or
silently resume on failure.
