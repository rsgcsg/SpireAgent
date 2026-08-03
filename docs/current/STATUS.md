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

Current source protocol is `3.0-preview.8`. Inspection remains
`sts2.connector.v3/inspection-1`; linked detail remains
`sts2.connector.v3/linked-detail-1`.

## Latest Reviewed Runtime Evidence

The latest reviewed complete local run is
`run-20260803003138-awi3r5` from source revision
`95bb5602804a8f6e56eb94908e5017a570562377`. Its immutable metadata reports:

- Connector `3.0-preview.7`;
- loaded SHA
  `b57f5a1625d40960afa0d65295ed63c77ddad62c374919e67df856eb681682a6`;
- loaded MVID `06a1b410-3655-474a-bc53-14d688698155`;
- runtime `d3720aad7bdb408e8a4a613e5a04a52c`;
- game `v0.110.1`, commit `db5d3552`, Modset `exact_bridge_only`;
- direct V3 consumption with no V2 consumer projection sidecar;
- 202 `executed_and_settled` commands followed by one expected
  `not_executed_non_actionable_state` at the completed-run top-level menu.

It exercised direct V3 observation, candidates, commands, receipts and
successors across combat and ordinary non-combat surfaces and stopped after
one complete game. Provenance is `unrecorded`, so it is not Organic
qualification or a durable claim and transfers no authority to Preview.8.

Two immediately preceding runs stopped at Merchant deck removal. Their shared
root cause was a Gateway admission cycle: the direct V3 selector no longer
published Provider drafts, while encounter trial admission still depended on
those drafts. Preview.8 fixes admission by accepting exact direct command
descriptors only when they resolve to explicit native contracts. See
[the Preview.8 record](../../STS2MCP/docs/connector-v3/PREVIEW_8_DIRECT_AUTHORITY_AND_SELECTOR_CUTOVER_2026-08-03.md).

A separate reviewed Preview.5 session exercised Smith, state-bound Inspection,
linked detail and stale-token refusal, then stopped safely at Luminous Choir.
It also exposed a visible usable Explosive Ampoule that published no potion
command. See [the evidence record](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_1_PREVIEW_5_SELECTOR_INSPECTION_2026-08-02.md).

## Preview.8 Source

Preview.8 closes the direct-descriptor admission cycle and extends explicit
native contracts and Provider-publication deletion through combat hand, Smith,
reward claim, rest, Precise Scissors, event card acquisition and
source-discriminated generated-card choices. Shared mechanics retain distinct
source, Commit and Outcome contracts. Unknown sources remain Fail Closed.

The source and tests are verified. Build/install are per-machine facts, and
Preview.8 has no loaded or exact-runtime mutation evidence yet.

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
  direct descriptors can request them only through explicit native contracts;
- Inspection: separately state-bound, read-only and non-authorizing;
- disabled: absent scope, unknown source, ambiguous owner, stale binding,
  unsupported Modset or discovery failure.

One success never creates a persistent claim. A new protocol, MVID, Modset,
Patch or runtime does not inherit old authority.

## Remaining V3 Work

- cold-load Preview.8 and exercise Merchant removal plus newly direct sources;
- fix and prove the observed Explosive Ampoule publication gap;
- re-exercise Preview.7 Inspection current/stale reads;
- migrate the remaining 11 fallback contracts: combat-pile, deck-transform
  and Wood Carvings;
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
