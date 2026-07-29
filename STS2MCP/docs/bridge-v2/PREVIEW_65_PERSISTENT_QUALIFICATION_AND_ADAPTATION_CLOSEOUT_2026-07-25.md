# Preview 65 Persistent Qualification And Adaptation Closeout

## Verdict

Preview 65 is a source-complete, fixture-tested implementation of an
operation-scoped qualification kernel. On 2026-07-26 it was rebuilt against
the current local game, installed, Steam cold-loaded, and strictly decoded by
Re. A subsequent real `v0.109.1` cycle qualified two exact main-menu
operations. It remains **not** build-wide-qualified, cross-Mod-qualified, or
proof of generic future-version adaptation. See the
[v0.109.1 requalification closeout](PREVIEW_65_V01091_REQUALIFICATION_CLOSEOUT_2026-07-26.md).

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

The later v0.109.1 cycle also added
`map_navigation/choose_map_node` as a developer-gray progression candidate,
but did not obtain a legal route action or qualify it. Neither candidate
authorizes Surface siblings.

## Validation

At final local verification:

- Gateway C# tests: `153` passed;
- Re tests: `179` passed;
- Re typecheck: passed;
- Re production build: passed;
- Python MCP syntax check: passed;
- qualification ledger fixtures: passed;
- current-install Release build: passed with zero warnings;
- built SHA:
  `599a126d03e314ce6f8bd58ae47fb7af24e208ab02e008f8b593e33d5b842341`;
- built MVID: `c0bfde51-1f4b-44af-a1b1-2a884cdc34ce`.

The earlier SHA `11b6b0149...164e` / MVID
`4e870cd2-3e35-4db5-8a1b-7c7a41ca631f` was built against the preceding game
assembly. It was briefly installed and loaded only to discover that Steam had
updated the game. The final Release was then rebuilt against the new exact
installation and reinstalled.

## Loaded Runtime Evidence

```text
protocol  2.0-preview.65
SHA       599a126d03e314ce6f8bd58ae47fb7af24e208ab02e008f8b593e33d5b842341
MVID      c0bfde51-1f4b-44af-a1b1-2a884cdc34ce
runtime   0b42511dd71f4c40883830de8ef3a89c
game      v0.109.1|c8c577f6|-820620422
Modset    57d2e880e45244fbd55422096ba3f218de84e79596d9097a08637a3cbbd54a88
Patch     clean_known_owners
Patch     ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
```

At this initial cold load, Release, installed, and loaded SHA/MVID matched. The
operation catalog loaded, the local store was empty, and both authority flags
were false. Re strictly decoded the qualification and coordination contracts.

This records the initial cold-load baseline before requalification. The newer
game identity started `untested`, with diagnostic-only adaptation and no
action authority. It was later superseded by the narrow operation-scoped
results in the v0.109.1 closeout; this paragraph is not current status.

A non-game two-client coordination check passed: A acquired the sole lease, B
received HTTP `409 controller_lease_held`, A released it, and the final
controller snapshot had no active controller. Sampled v1 routes returned
`410 Gone`. No action canary or qualification package was installed.

The non-authorizing exact-assembly audit sees `sts2.dll` SHA
`2cb39e2eee651743829abcc0df4dd9cd7e65f46287c7ca264481115c9602382f`,
MVID `208f08b8-d5f5-47f8-9e96-d3a4299ee709`. Its 13 registered combat-pile
sources remain static matches and Tutor remains `code_required` because its
owner is target-player-bound. The old exact `v0.109.0` scenario rejects this
report on game and assembly identity, so the audit exits nonzero as designed.
It has no authorization or qualification effect.

## Explicit Non-Claims

- A matching fingerprint does not grant authority.
- A candidate package is not qualification.
- One successful canary is not persistent qualification.
- A package for one environment does not authorize another environment.
- A package for one operation does not authorize its Surface siblings.
- Additional Mods are not generally supported; only exact package operations
  may become candidates or qualified.
- Runtime session quarantine is not a permanent ledger revoke.
- The v0.109.1 cycle is real second-environment evidence for two operations,
  not generic cross-version or any cross-Mod qualification.

## Rollback

Set `qualification_store` to JSON `null` or `"disabled"` and restart to disable
this system without deleting evidence. Deleting the store file also leaves no
persistent authority. Alternatively append a `revoke` event for the affected
operation. Preview 65 does not modify embedded exact-environment policy files
or any game data.
