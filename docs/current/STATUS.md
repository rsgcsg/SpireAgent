# Current Status

Baseline date: 2026-08-02

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

Current source protocol is `3.0-preview.6`. Inspection remains
`sts2.connector.v3/inspection-1`; linked detail remains
`sts2.connector.v3/linked-detail-1`.

## Latest Reviewed Runtime Evidence

The latest reviewed local run is
`run-20260802104257-2ljjp3` from source revision `a53159b...`. Its immutable
metadata reports:

- Connector `3.0-preview.5`;
- loaded SHA
  `dda1e348d7972f42c75768bdde9db5242f332c08bfb739c26fceef96385babcd`;
- loaded MVID `7446a1a2-4a7f-44c0-8c5c-ad95651a7ebd`;
- runtime `929acc4158874d9daabccc3524fbfc6f`;
- game `v0.110.1`, commit `db5d3552`, Modset `exact_bridge_only`;
- direct V3 consumption with no V2 consumer projection sidecar;
- 80 `executed_and_settled` commands followed by one expected
  `not_executed_non_actionable_state` at the completed-run top-level menu.

The run exercised combat, event, Wood Carvings replacement, map, reward/card
reward, shop, game-over and menu. It is exact-runtime journey evidence for that
Preview.5 tuple. Provenance is `unrecorded`, so it is not Organic qualification
or a durable claim and transfers no authority to Preview.6.

A separate reviewed Preview.5 session exercised Smith, state-bound Inspection,
linked detail and stale-token refusal, then stopped safely at Luminous Choir.
It also exposed a visible usable Explosive Ampoule that published no potion
command. See [the evidence record](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_1_PREVIEW_5_SELECTOR_INSPECTION_2026-08-02.md).

## Preview.6 Source

Preview.6 adds a direct, source-specific Luminous Choir event-removal
transaction with exact task/event/screen/card/control binding,
select/deselect/preview-return/confirm, execute-time revalidation and a
whole-transaction witness. Unknown deck-removal sources remain Fail Closed.

The change is source- and test-reviewed. It has no Preview.6 exact-runtime
mutation evidence yet. See [the cutover record](../../STS2MCP/docs/connector-v3/PREVIEW_6_LUMINOUS_CHOIR_EVENT_REMOVAL_CUTOVER_2026-08-02.md).

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

- cold-load and exercise Preview.6 Luminous Choir lifecycle;
- fix and prove the observed Explosive Ampoule publication gap;
- obtain merchant-removal and combat-hand exact-runtime evidence;
- migrate combat-pile, card-bundle and source-distinct relic/reward selectors;
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
