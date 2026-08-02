# Current Status

Baseline date: 2026-08-02

Branch: `connectorV3`

Fixed repository HEAD: `a53159b40e3a15d155fc263d6162fc29327d0d16`.
The current worktree contains the reviewed Preview.6 vertical slice described
below. Source, tests, build, install, load, Live exercise and qualification are
separate evidence levels.

## Canonical Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) remains
the only current Connector target. Native STS2 owns rules and effects. The
Gateway owns player-visible observation, one current mutation owner,
state/interaction/entity-bound command admission, execute-time native
validation, STS2 Commit and action-local Outcome. Re strictly consumes V3 and
supervises receipts; REST and MCP are transports.

Current source protocol is `3.0-preview.6`. Inspection remains
`sts2.connector.v3/inspection-1`; linked detail remains
`sts2.connector.v3/linked-detail-1`.

## Latest Exact Runtime Evidence

The latest loaded artifact was Preview.5:

- SHA-256:
  `b6c28dc5db538ff411c7385519998c85771f5ad3b434d0e8ef31383baf5dbce3`;
- MVID: `c98dd735-460a-4970-9606-fb6d2ec6a609`;
- runtime: `7967ab4cb09a46cfaf013f2519ad3b8d`;
- game: `v0.110.1`, commit `db5d3552`, assembly hash `-959015736`;
- Modset: `exact_bridge_only`, with DamageMeter disabled;
- authority: scoped encounter canary only; persistent qualification empty.

That reviewed direct session proved ordinary combat, the complete Smith
select/preview/return/cancel/reselect/confirm lifecycle, a semantic upgraded
card post-state, current-token `run_deck` Inspection, current-token
`surface_card` detail, both stale-token refusals, and the distinction between
known settling and unknown-owner unsupported. It did not reach merchant
removal or combat-hand. Details are in
[the Preview.5 evidence record](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_1_PREVIEW_5_SELECTOR_INSPECTION_2026-08-02.md).

The session stopped safely at Luminous Choir's two-card deck selector. It also
found a separate combat gap: visible usable Explosive Ampoule did not publish
a potion command. Neither defect used a fallback.

## Preview.6 Slice

Preview.6 adds one V3-native source-specific transaction:
`event_deck_removal_selection` for exact
`LuminousChoir.ReachIntoTheFlesh`.

- exact task/event/screen/card/control binding;
- select/deselect, automatic preview, preview return and confirm;
- execution-time revalidation and native selector Commit;
- whole-transaction witness for two exact removals, one Spore Mind and event
  completion;
- direct Re schema, command-set validation, projection and prompt guide;
- no V2 action ID, Provider closure or V2-shaped Re sidecar for this family;
- all unknown selector sources remain Fail Closed.

See [the Preview.6 closeout](../../STS2MCP/docs/connector-v3/PREVIEW_6_LUMINOUS_CHOIR_EVENT_REMOVAL_CUTOVER_2026-08-02.md).

## Artifact State

| Evidence level | Current fact |
|---|---|
| source | Preview.6 worktree on fixed HEAD `a53159b40e3a15d155fc263d6162fc29327d0d16` |
| automated tests | Gateway 260/260; Re 267/267; typecheck/build and all connector guards pass |
| Python/MCP | syntax/import pass in repository venv; `uv lock --check` passes |
| Release build | SHA `7668a1cd1f99cc917466d43069af716ef8abf22f7b42aac59bda67ab321c3b96`, MVID `6704fa1f-f8fe-4cc1-9fe6-ba513f283239`; 0 warnings/errors |
| installed | exactly matches the Preview.6 built SHA/MVID; one canonical manifest |
| loaded | non-claim; game is stopped and Gateway is unreachable |
| Live Preview.6 | non-claim pending cold load |
| durable qualification | none |

Immediate pre-install snapshot:
`STS2MCP/.local/deployments/2026-08-02T13-06-57-272Z`. The last-known-loaded
Preview.5 rollback remains
`STS2MCP/.local/deployments/2026-08-02T12-55-11-931Z`.

## Authority Matrix

- **qualified:** empty for the current environment;
- **durable:** empty;
- **canary:** only exact operation scopes admitted for the current runtime and
  resolved encounter; never an entire Surface or origin;
- **Preview.6 event removal:** three explicit operation contracts exist in
  source, but no loaded runtime scope or Live evidence yet;
- **disabled/unsupported:** any absent scope, unknown source, ambiguous owner,
  stale binding, unsupported Modset or discovery failure.

Inspection remains separately state-bound and read-only. Empty Inspection or
Surface scopes grant nothing.

## Remaining Migration Debt

- Preview.6 cold-load identity and event-removal Live lifecycle;
- missing combat-potion publication for the observed Explosive Ampoule case;
- Preview.5 merchant-removal and combat-hand Live coverage;
- V3-native combat-pile, card-bundle and source-distinct relic/reward removal;
- deletion of the remaining Provider candidate/execution and Re V2-shaped
  sidecar paths after each replacement has exact-runtime evidence;
- optional human-equivalence physical page profile, without changing semantic
  accessibility defaults.

## Next Runtime Step

```bash
# Fully exit and restart Slay the Spire 2 first.
cd Re-SpireAgent
npm run agent:run
```

Exact-identity preflight must reject any artifact other than the installed
Preview.6 tuple.
