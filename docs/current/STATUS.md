# Current Status

Baseline date: 2026-08-02

Branch: `connectorV3`

Source baseline: `1d85fc2820728425fbb870561708ae39c8df43a2` plus the current
reviewed Preview.5 worktree. Source, tests, build, install, load and Live
evidence are separate states below.

## Current Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) remains
the only current Connector target. Native STS2 owns rules and effects; the
Gateway owns player-visible observation, one current interaction owner,
state/entity-bound command admission, execute-time native validation, native
Commit and action-local Outcome. Re selects current V3 candidates and
supervises receipts and successors. REST and MCP are transports.

Connector V3 currently provides:

- `3.0-preview.5` observation and parameterized command contracts;
- `sts2.connector.v3/inspection-1` state-token-bound read-only Inspection;
- `sts2.connector.v3/linked-detail-1` state-token-bound current-Surface card
  detail;
- one visible interaction, including visible unsupported states with no
  command authority;
- exact state, interaction, source, owner, entity, controller and runtime
  identity;
- idempotent requests and `completed/not_executed/pending/unknown` receipts;
- direct Gateway command resolvers for ordinary combat, combat-hand selection,
  menu/run setup, event, map, reward/card reward, shop, rest, treasure,
  generated choice, deck enchant, deck upgrade, merchant deck removal and
  game-over;
- direct Re consumption for the same ordinary families, lifecycle settling
  and every visible unsupported interaction;
- scoped trial/quarantine and no retry after unknown mutation.

Several selector families still use `provider_native_binding_adapter`; relic-
and reward-originated deck removal remain source-specific migration debt. Their
Gateway execution is state-bound but enters through a Provider draft. Some
direct Gateway families still derive candidate discovery from `draft.Actions`.
Re expands bounded V3 operand domains into local opaque choices and retains
the V2 projection sidecar only for unmigrated selector Surfaces. V2 is not a
target architecture or silent mutation fallback.

## Latest Exact Runtime Evidence

Run `run-20260802094606-6734zk` used exact loaded Preview.4 SHA
`eafde5add1fbe4f815422e6a8abfacbc057179b3ecc8c4e27375e18d1f455da6`,
MVID `0c011228-68a6-4717-9689-95ba6420a155`, runtime
`5a57a66e318f4bdeb7167e4b719e1c3d`, game `v0.110.1` commit `db5d3552`,
and exact-bridge-only Modset fingerprint
`9d665afd68a0bba4bc7428ccb12d70456b4d72573b5d91b874950cf8b6460b91`.

It reached `completed_run_boundary` after 161 decisions. All 157 submitted
commands returned completed, confirmed receipts with successors. Direct V3
covered combat, menu, event, map, reward/card reward, shop, rest, treasure and
game over. The only sidecar states were two Smith deck-upgrade child decisions.
Two treasure stale refusals were safe and recovered after fresh observations;
one event settling state and the final main-menu boundary attempted no command.
No unknown receipt occurred. Full attribution is in
[the Preview.4 evidence record](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_1_PREVIEW_4_COMPLETE_JOURNEY_2026-08-02.md).

Run provenance is `unrecorded`. This is reviewed exact-runtime coverage, not
Organic qualification or a durable claim.

## Preview.5 Changes

- Smith deck upgrade now publishes exact selectable/deselectable cards and
  preview/cancel/confirm controls, resolves the current screen/card/control at
  execution, and uses direct Re consumption without the V2 sidecar.
- Merchant deck removal now follows the same direct lifecycle while retaining
  its independent merchant source, Gold/service Commit and exact-card-removal
  Outcome. Relic and reward removal do not inherit this contract.
- Current-Surface cards may advertise bounded `surface_card` linked detail.
  Reads require the exact current state token, are read-only and never create
  command authority.
- The wire protocol moved to `3.0-preview.5`; no permission or persistent
  qualification was inherited from Preview.4.

## Current Artifact State

| Evidence level | Current fact |
|---|---|
| source | protocol `3.0-preview.5`; Inspection `inspection-1`; linked detail `linked-detail-1`; HEAD `1d85fc2...` plus reviewed worktree |
| automated tests | Gateway 258/258; Re 265/265 plus typecheck/build; Python MCP, docs, CLI, identity, compatibility, permission, qualification, profile and migration checks pass |
| Release build | Preview.5 SHA `dda1e348d7972f42c75768bdde9db5242f332c08bfb739c26fceef96385babcd`, MVID `7446a1a2-4a7f-44c0-8c5c-ad95651a7ebd`; 0 warnings/errors |
| installed | exactly matches Preview.5 built SHA/MVID; one canonical Mod manifest and no duplicate manifest |
| loaded | `non-claim` until Preview.5 is cold-loaded and reports exact built/installed SHA/MVID |
| current authority | Preview.4 Live used scoped provisional trial and had no persistent qualification; Preview.5 authority is pending cold load |
| durable claim | none |

Current rollback snapshot:
`STS2MCP/.local/deployments/2026-08-02T10-38-42-535Z`. It contains the
pre-install Preview.4 deployment.

## Pending Exact-Runtime Evidence

- Preview.5 cold-load identity equality for the final built/installed SHA and
  MVID;
- direct Smith select/deselect/reselect, preview return and confirm;
- direct merchant removal selection and confirm;
- direct combat-hand select/deselect/reselect, confirm and peek return;
- RestSite/Merchant/Treasure known-room owner-mount settling and unknown-owner
  visible unsupported behavior;
- V3 `run_deck`, `combat_piles` or `shop_catalog` Inspection with a current
  state token, plus stale-token rejection;
- current-token `surface_card` linked detail plus stale-token rejection;
- remaining Provider selectors and any qualification or durable claim.

Kifuda, New Leaf, multi-stack Stratagem and physical UI-page opening were not
exercised by the latest run and receive no transferred evidence.

## Next Live Step

```bash
cd Re-SpireAgent
npm run agent:run
```

The command performs exact-identity preflight. It must reject a mismatched or
unreachable Gateway rather than inherit Preview.4 authority.
