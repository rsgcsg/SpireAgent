# Preview.65 v0.109.1 Requalification Closeout

## Verdict

The real update from reviewed STS2 `v0.109.0` to `v0.109.1` has exercised the
Preview.65 adaptation and persistent qualification path. The result is useful
but deliberately narrow:

- two exact main-menu operations are persistent-qualified;
- a third operation is candidate-only because valid runtime evidence was not
  available;
- static binding matches for two more operations remain non-authorizing;
- no build-wide, Surface-wide, cross-Mod or generic cross-version authority was
  created.

This is the first real second-environment evidence for the Preview.65 kernel.
It validates a bounded process, not universal automatic adaptation.

## Starting And Target Environments

Reviewed predecessor:

```text
game v0.109.0|c12f634d|-1639417500
```

Target:

```text
game      v0.109.1|c8c577f6|-820620422
sts2 SHA  2cb39e2eee651743829abcc0df4dd9cd7e65f46287c7ca264481115c9602382f
sts2 MVID 208f08b8-d5f5-47f8-9e96-d3a4299ee709
```

Valve described v0.109.1 as a Traditional Chinese plural-evaluation
translation hotfix. That reduced the expected semantic impact but did not
authorize any operation. The old v0.109.0 assembly was not available locally
for a byte-for-byte comparison, so the cycle used the reviewed predecessor
bindings, exact current assembly inspection and current runtime evidence.

Official notes:
[Beta Hotfix Patch Notes - v0.109.1](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1839041357032587).

## Automatic And Human Steps

Automated or tool-enforced:

1. capture exact Gateway/game/Modset/Patch/environment identity;
2. inspect five reviewed private-binding probes in the exact current assembly;
3. compute per-operation binding digests;
4. classify every binding match as targeted runtime requalification rather
   than inherited authority;
5. seed an exact, expiring candidate package only for an eligible low-risk
   operation;
6. collect exact-environment Re decision records;
7. reject mixed environment, operation identity, Witness or provenance;
8. assemble and dry-run a two-epoch qualified package;
9. install through the append-only ledger;
10. revalidate package applicability on Gateway restart.

Human/source review remained necessary to confirm that the five probes still
represented the same native owner, Commit and completion boundary. Human
positioning was also needed to reach suitable real game states. Neither step
granted authority by itself.

## Operation Diff And Decision

| Operation | Binding digest | Result | Reason |
|---|---|---|---|
| `main_menu/open_singleplayer` | `d733b234409a1519d311ffdf47826e0c55bfbaef29ccdc71ceb6fd09f687318a` | qualified | exact binding plus two confirmed ordinary epochs |
| `main_menu/continue_run` | `03611b0fa5c2161276770224357cd5c7f13d3c4805843867c0a3ef3c62b98c53` | qualified | exact async Commit plus two confirmed ordinary epochs |
| `shop_room/open_shop_inventory` | `948e6487105fd2b512e67397c608a30bc63cafbec1e2c9e32de759d39775bcc6` | targeted requalification | binding match, no current runtime journey |
| `map_navigation/choose_map_node` | `a207284dcf0eb0a3e4a565b595b86b738c5a2448d5d15a978803f050ff1a0f68` | candidate only | no legal route action in available saved run |
| `deck_enchant_selection/confirm_selection` | `693d11094b506bc84caca807c154093fffcfbcaa183e152b9acffd5d3a916785` | targeted requalification | binding match, no current runtime journey |

Unknown operations and any owner, Commit, completion-boundary or Witness
change remain `code_required`.

## Real Runtime Evidence

### `main_menu/open_singleplayer`

```text
run-20260726075353-pqoc6a
run-20260726075427-8d8wb7
witness singleplayer_or_character_select_owner_became_active
package v01091-main-menu-open-qualified version 2
```

Both Re decisions were `executed_and_settled` under the exact target
environment and distinct Gateway runtime epochs.

### `main_menu/continue_run`

```text
run-20260726082338-ooz634
run-20260726082439-kjmwoi
witness saved_singleplayer_run_became_active
package v01091-main-menu-continue-qualified version 2
```

Both records use `ordinary_gameplay` provenance, the native async
`continue_run` Commit and Gateway-confirmed completion. This supplies a second
Commit path rather than repeating only the root-menu button path.

After cold restart, both packages were loaded as persistent qualified scopes
with `runtime_epoch=not_session_bound`. Candidate predecessors remained in the
ledger as superseded evidence.

Final built, installed and loaded identity:

```text
Gateway SHA  4c6c1309c4ac3c0e97eccb084312769595485e21f499b9a1d07040a8e744419e
Gateway MVID 60d4c2ce-44ad-46b4-99f7-0479e75b5741
runtime      56f748fdf9c041e7a10815152dd5a14c
Modset       803245f3df16e1d07f88c9c922f068d34b582edd6c3f09d2e98a11e36337ae49
Patch        ee979e2b877b772adaa28409f474037a832b9ccaf22037afde23a527bb13c587
environment  218ff0b309dd3e1e110bb401d8fc40ca86b53ac7adea331ec68c3d71c7e9feb4
store        13fbc389b3ed9f0eb1ba4bfdc5b8615bd059ffda5fc7ac2596d1b53a42244826
```

The final local mode is `balanced_gray`. Persistent menu scopes recovered;
the developer-only map candidate created no dynamic grant and no canary
Surface. Re strict live inspection decoded the same identity and reported
diagnostics `ok`.

### Map Boundary

The saved run used for map testing had a pre-existing abnormal Neow
transaction. Opening the map exposed topology, but native
`travel_enabled=false` and `next_options=[]`. The Gateway published no action.
No forced action, synthetic success or map qualification was recorded.

## Defect Found And Corrected

The Gateway correctly projected different tiers for sibling operations on
`main_menu`, but Re required a Surface to be wholly qualified or wholly
session-canary. That made a valid mixed state fail closed after one operation
was promoted.

The corrected rule is:

- Surface tier is a coarse highest-tier support projection;
- each operation scope is independently authoritative;
- every advertised action still requires exactly one matching current package
  or grant;
- qualification of one operation never authorizes its Surface siblings.

The correction affects decoding only; it does not widen Gateway permission.

## Qualification Lifecycle

The live store exercised candidate install, qualified supersede and restart
recovery. Isolated store copies exercised:

- wrong Modset rejection;
- wrong Patch rejection;
- wrong Gateway MVID rejection;
- expired package rejection;
- corrupt-store fail-closed;
- revoke;
- rollback.

The ledger CLI and Gateway now report the same SHA-256 over the exact stored
JSON text. Earlier CLI output hashed a canonicalized parsed object while the
Gateway hashed file text, producing different diagnostic digests for the same
valid ledger.

Gateway tests separately cover semantic-Witness mismatch, timeout/unknown
outcome, failure quarantine, Patch drift and invalid ledger sequences.
Unknown outcomes remain terminal and are never automatically retried.

Final repository validation:

- Gateway tests: 154 passed;
- Re tests: 184 passed;
- Re typecheck and production build: passed;
- Python MCP syntax: passed;
- compatibility, permission and qualification fixtures: passed;
- exact operation binding audit: `reviewed_bindings_match`;
- Gateway Release build: zero warnings and zero errors;
- active Markdown, operation inventory and adaptation checks: passed.

## Tools

Exact binding audit:

```bash
STS2_GAME_DIR="/path/to/Slay the Spire 2" \
  npm run audit:connector-operation-bindings
```

Candidate seed:

```bash
npm run qualification:ledger -- seed-candidate \
  --capabilities current-capabilities.json \
  --binding-audit operation-binding-audit.json \
  --surface main_menu \
  --operation continue_run \
  --expires 2026-08-02T00:00:00Z \
  --out continue-run.candidate.json
```

`seed-candidate` requires exact evidence environment and a matching successful
binding audit. The audit must also match the captured game version, commit and
release-declared assembly hash, and carry valid exact assembly SHA/MVID
provenance. It cannot produce persistent qualification.

## Remaining Limits

- Only two exact operations have real v0.109.1 persistent qualification.
- The source audit does not cover every advertised operation.
- No cross-Mod experiment was run.
- No future game update has been tested.
- The v0.109.0 assembly was unavailable for exact binary comparison.
- Runtime `main_assembly_hash` and offline SHA/MVID remain distinct identity
  forms on the wire. The current tooling checks release identity and preserves
  the offline exact assembly digest, but does not claim an in-process
  SHA-to-audit equivalence proof.
- Map, shop and deck-enchantment runtime requalification remain incomplete.

The next safe slice is an ordinary saved run with a legal map choice. If that
state cannot be obtained, the candidate must remain unqualified.
