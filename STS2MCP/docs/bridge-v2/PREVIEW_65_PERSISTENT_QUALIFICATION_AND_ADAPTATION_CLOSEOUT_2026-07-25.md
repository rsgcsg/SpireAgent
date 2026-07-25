# Preview 65 Persistent Qualification And Adaptation Closeout

## Verdict

Preview 65 is a source-complete, fixture-tested implementation of an
operation-scoped qualification kernel. It is **not** installed, loaded,
Organic-qualified, cross-version-qualified, or cross-Mod-qualified at the time
of this closeout.

The implementation closes the restart-loss problem without serializing D3
session grants:

```text
exact environment inventory
  -> component-level operation identity
  -> non-authorizing evidence bundle
  -> bounded session_canary candidate package
  -> Gateway session canary / auto approval / quarantine
  -> two-runtime Organic evidence bundle
  -> qualified package
  -> append-only install / supersede / revoke / rollback
  -> startup exact applicability check
  -> operation-scoped qualified action
```

D, Re, fixtures and the ledger CLI still cannot grant authority through the
live API. Installing a local package is an explicit operator action. The
Gateway validates it again and remains the only runtime decision and
enforcement owner.

## Architecture Selected

Preview 65 adds a deliberately small resolved-operation identity:

- interaction;
- input owner;
- source binding;
- operand and legality contract;
- native Commit;
- completion boundary;
- outcome Witness;
- risk class.

Each component and the full contract have separate digests. This is enough to
distinguish environment-only requalification from changes to owner, Commit or
completion semantics. It is not an executable effect DSL and does not replace
game legality.

The completion boundary is typed as one of:

- `native_commit_observed`;
- `immediate_postcondition_observed`;
- `continuation_handoff_observed`;
- `transaction_settled`.

This corrects the previous assumption that one boolean `CompletionProbe`
explained every operation. Runtime Providers still own their bounded Witness
implementation; Preview 65 does not attempt a high-risk global rewrite of all
existing probes.

## Qualification Tiers

### `session_canary`

A candidate package may temporarily expose only a reviewed low-risk gray
operation in an exact environment. It:

- must match the embedded operation contract and gray-candidate policy;
- must be `reversible_navigation`;
- must contain positive/static evidence references and negative evidence;
- expires within seven days;
- creates only a Gateway-owned runtime-epoch session canary;
- is promoted or quarantined by the existing D3 state machine;
- never becomes persistent qualified authority by itself.

This tier resolves the new-environment bootstrap deadlock. Without it, an
unsupported environment could not execute the operation needed to obtain the
two Organic runtime epochs required by a qualified package.

### `qualified`

A qualified package additionally requires:

- two distinct runtime epochs;
- `ordinary_gameplay` evidence;
- confirmed Gateway command outcomes;
- the exact declared completion Witness;
- one exact evidence identity matching game, Gateway SHA/MVID, Modset, Patch,
  environment digest and operation contract;
- at least one negative-evidence reference.

At startup the Gateway rechecks game version/commit/main assembly hash,
Gateway protocol/SHA/MVID, Modset, Patch digest, environment digest, operation
fingerprint, completion boundary and Witness. Only the exact matching
`surface_kind + operation` is added as a qualified scope.

## Ledger And Lifecycle

The configured local store is an append-only JSON ledger with:

- `install`;
- `revoke`;
- `rollback`.

Replacement must explicitly name the current package it supersedes. Rollback
cannot target an expired package. Historical expired packages remain readable
and do not corrupt newer active packages. Invalid sequence, duplicate event
identity, malformed package or corrupt JSON fails the entire store closed.

A persistent operation that reaches a validated failure, timeout, unknown
outcome or completion-Witness mismatch is quarantined immediately for the
current runtime. The persistent ledger is not silently rewritten; an operator
uses `revoke` or `rollback` after reviewing the failure.

## Tooling

`tools/connector-qualification-ledger.mjs` provides:

```bash
npm run qualification:ledger -- capture --endpoint http://127.0.0.1:15526 --out current-capabilities.json
npm run qualification:ledger -- diff --from old-capabilities.json --to current-capabilities.json
npm run qualification:ledger -- collect --runs run-a,run-b --surface shop_room --operation open_shop_inventory --witness shop_inventory_opened --negative stale-action-negative --out evidence.json
npm run qualification:ledger -- assemble --capabilities current-capabilities.json --evidence evidence.json --surface shop_room --operation open_shop_inventory --tier qualified --expires 2026-08-25T00:00:00Z --out shop-open.qualification-package.json
npm run qualification:ledger -- dry-run --package shop-open.qualification-package.json --capabilities current-capabilities.json
npm run qualification:ledger -- install --store STS2_MCP.qualifications.json --package shop-open.qualification-package.json
npm run qualification:ledger -- inspect --store STS2_MCP.qualifications.json
npm run qualification:ledger -- revoke --store STS2_MCP.qualifications.json --id qualification-id --reason regression
npm run qualification:ledger -- rollback --store STS2_MCP.qualifications.json --id prior-qualification-id --reason rollback
```

All tool writes are local and atomic. `capture`, `diff`, `collect`, `assemble`
and `dry-run` have `authorization_effect=none`. The Gateway loads the ledger
once at startup; install, revoke and rollback require restart before runtime
authority can change.

The collector rejects old or mixed-environment runs that lack the exact
Preview.65 operation contract identity. `assemble --tier qualified` refuses to
combine an evidence bundle with different capabilities. Candidate packages can
use reviewed static evidence because they only seed a bounded session canary.

The diff classifier is intentionally conservative:

- identical operation components and environment: `unchanged`;
- same operation contract but changed exact environment, or changed
  interaction/source/operand: `targeted_requalification`;
- missing operation or owner/Commit/completion/Witness change:
  `code_required`.

Every currently advertised operation is inventoried. An advertised operation
without reviewed qualification-component metadata is also `code_required`; the
five initial catalog rows are a qualification pilot, not complete operation
coverage.

It is an impact planner, not a semantic compatibility oracle.

## First Non-Menu Gray Operation

`shop_room/open_shop_inventory` is the first non-menu D3 candidate. Exact
source and Witness are already implemented by `ShopRoomSurfaceProvider`; its
candidate status does not authorize purchases, card removal, leaving the shop,
or any other shop operation.

Current evidence is source and fixture only. No Preview 65 real-game shop
canary has been run.

## Validation

At source closeout:

- Gateway C# tests: `153` passed;
- Re tests: `179` passed;
- Re typecheck: passed;
- qualification ledger fixtures: passed;
- exact-game Release build: passed with zero warnings;
- built SHA:
  `11b6b014965a9269bd572bd04c3cd8a7575541e8bc6439cf054dc7b1b264164e`;
- built MVID: `4e870cd2-3e35-4db5-8a1b-7c7a41ca631f`.

Installed identity, loaded identity and real canaries remain absent because the
live game still loads Preview 63.

## Explicit Non-Claims

- A matching fingerprint does not grant authority.
- A candidate package is not qualification.
- One successful canary is not persistent qualification.
- A package for one environment does not authorize another environment.
- A package for one operation does not authorize its Surface siblings.
- Additional Mods are not generally supported; only exact package operations
  may become candidates or qualified.
- Runtime session quarantine is not a permanent ledger revoke.
- Cross-version and cross-Mod behavior is implemented for controlled
  requalification, but has no current real second-environment evidence.

## Rollback

Set `qualification_store` to JSON `null` or `"disabled"` and restart to disable
this system without deleting evidence. Deleting the store file also leaves no
persistent authority. Alternatively append a `revoke` event for the affected
operation. Preview 65 does not modify embedded exact-environment policy files
or any game data.
