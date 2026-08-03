# Current Status

Baseline date: 2026-08-03

Active migration branch: `connectorV3`. Obtain the exact checkout with
`git rev-parse HEAD`; a mutable current-status document never fixes its own HEAD.
Branch roles are defined in [Development Model](DEVELOPMENT_MODEL.md).

## Canonical Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) is the
only current Connector target. Native STS2 owns rules and effects. The Gateway
owns player-visible observation, one current mutation owner, exact command
admission, execute-time native validation, native Commit and action-local
Outcome. Re strictly consumes V3 and supervises receipts. REST and MCP are
transports.

Current source protocol is `3.0-preview.7`. Inspection remains
`sts2.connector.v3/inspection-1`; linked detail remains
`sts2.connector.v3/linked-detail-1`.

## Latest Reviewed Runtime Evidence

The latest reviewed local run is
`run-20260802135723-phwd6m` from source revision `0822eef...`. Its immutable
metadata reports:

- Connector `3.0-preview.6`;
- loaded SHA
  `682b1bd647e795c9932648770bd266f010a9e5d7d4ad389eb540d3a6d8160ff7`;
- loaded MVID `717c7f91-1e6c-425d-8836-1581dd7562c0`;
- runtime `4e5708f7126a4a7590f9835fe9d34b9d`;
- game `v0.110.1`, commit `db5d3552`, Modset `exact_bridge_only`;
- direct V3 consumption with no V2 consumer projection sidecar;
- 200 `executed_and_settled` commands, one safely recovered stale-state
  refusal, followed by one expected
  `not_executed_non_actionable_state` at the completed-run top-level menu.

The run exercised combat, direct combat-hand selection, event, Precise
Scissors removal, map, reward/card reward, merchant removal, shop, Smith,
rest, treasure, game-over and menu. Known RestSite/Merchant/Treasure mount
settling recovered normally. It is exact-runtime journey evidence for that
Preview.6 tuple. Provenance is `unrecorded`, so it is not Organic qualification
or a durable claim and transfers no authority to Preview.7.

A separate reviewed Preview.5 session exercised Smith, state-bound Inspection,
linked detail and stale-token refusal, then stopped safely at Luminous Choir.
It also exposed a visible usable Explosive Ampoule that published no potion
command. See [the evidence record](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_1_PREVIEW_5_SELECTOR_INSPECTION_2026-08-02.md).

## Preview.7 Source

Preview.7 cuts merchant, Precise Scissors and CardRemovalReward selectors plus
Scroll Boxes card bundles over to direct V3 candidate discovery, execution and
direct Re consumption. They no longer use `draft.Actions`, `LegacyBinding` or
the V2 consumer sidecar. Shared mechanics retain distinct source, Commit and
Outcome contracts. Card bundles now publish typed selectable-bundle and
preview-control availability rather than deriving authority from Provider
actions. Their old Provider executable closures are deleted and guarded by the
Clean Closure checker. Unknown sources remain Fail Closed.

The change is source- and test-reviewed, and one dated local Release/install
tuple is verified. It has no Preview.7 loaded or exact-runtime mutation
evidence yet. See [the cutover record](../../STS2MCP/docs/connector-v3/PREVIEW_7_SOURCE_BOUND_SELECTOR_CUTOVER_2026-08-03.md).

## Per-machine Deployment Truth

The repository does not declare a globally current built, installed or loaded
DLL. Those facts vary by machine and can become stale immediately after a pull.
Use:

```bash
npm run doctor
npm run verify:loaded
```

`npm run deploy` records source-to-build provenance and rollback locally.
Exact SHA/MVID/runtime values belong in command output or dated evidence, not
in this mutable status table. Source, tests, build, install, load, Live exercise
and qualification remain separate evidence levels.

## Authority

- durable qualification: none in reviewed current evidence;
- session authority: exact runtime- and source-scoped encounter trials only;
- Inspection: separately state-bound, read-only and non-authorizing;
- disabled: absent scope, unknown source, ambiguous owner, stale binding,
  unsupported Modset or discovery failure.

One success never creates a persistent claim. A new protocol, MVID, Modset,
Patch or runtime does not inherit old authority.

## Remaining V3 Work

- cold-load Preview.7 and exercise one migrated source-bound selector;
- fix and prove the observed Explosive Ampoule publication gap;
- re-exercise Preview.7 Inspection current/stale reads;
- migrate combat-pile, deck-transform and remaining Provider selectors;
- delete remaining Provider/V2-shaped production paths after exact V3
  replacements are tested and runtime-exercised;
- retain physical UI opening as an optional human-equivalence evidence profile.

## Local Runtime Entry

```bash
npm run doctor
# With the game closed, if requested:
npm run deploy
# After a cold start:
npm run verify:loaded
cd Re-SpireAgent
npm run agent:run
```
