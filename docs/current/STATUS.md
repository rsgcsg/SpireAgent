# Current Status

Baseline date: 2026-08-02

Branch: `connectorV3`

Source baseline: `6413344e1f075d8e52c114b338ab4c02e23dc916` plus the current reviewed
V3 direct-consumer, startup-preflight and Inspection worktree. Source, tests,
build, install, load and Live evidence are separate states below.

## Current Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) remains
the only current Connector target. Native STS2 owns rules and effects; the
Gateway owns player-visible observation, one current interaction owner,
state/entity-bound command admission, execute-time native validation, native
Commit and action-local Outcome. Re selects only current V3 candidates and
supervises receipts and successors. REST and MCP are transports.

Connector V3 currently provides:

- `3.0-preview.2` observation and parameterized command contracts;
- `sts2.connector.v3/inspection-1` state-token-bound read-only detail;
- one visible interaction, including visible unsupported states with no
  command authority;
- exact state, interaction, source, owner, entity, controller and runtime
  identity;
- idempotent requests and `completed/not_executed/pending/unknown` receipts;
- direct Gateway command resolvers for ordinary combat, menu/run setup,
  event, map, reward/card reward, shop, rest, treasure, generated choice,
  deck enchant and game-over;
- direct Re observation consumption for menu, event, map, reward/card reward,
  shop, rest, treasure, game-over and every visible unsupported interaction;
- scoped trial/quarantine and no retry after unknown mutation.

Remaining migration debt is explicit: several selector families still use
`provider_native_binding_adapter`; their Gateway execution is state-bound but
still enters through a Provider draft. Some direct Gateway families still
derive candidate discovery from `draft.Actions`. Re still expands bounded V3
operand domains into local opaque choices and retains V2 normalization only
for unmigrated selector surfaces. V2 is not a target architecture or silent
fallback.

## Latest Exact Runtime Evidence

`run-20260801205605-0fqlrj` used loaded Gateway SHA
`954150c6d964a4f6a78a6483aa82c5cb5066fc5e2bdf762ce56efb22e2166ff5`,
MVID `2e1b0a8f-05e8-4262-b7ff-5791564e9d56`, runtime
`239d883654b6414e9ab1089c0a45decb`, game `v0.110.1` commit `db5d3552`,
and exact-bridge-only Modset fingerprint
`1f273ee90ec14e389137f17707436d0065412ecfb432be5f9ef12940196f6035`.
It reached a completed-game boundary after 175 decisions: 172 settled, two
safe pre-submit stale refusals, then a normal non-actionable top-menu stop. No
unknown, unsupported, provider failure or unsettled command occurred.

Direct V3 Re consumption was exercised for menu, event, map, game-over,
reward-claim and card-reward. Shop, rest, treasure and selector observations
still used the migration sidecar in that loaded artifact. The immediately
preceding one-decision run exposed the startup `no_active_run_context` race and
made no mutation. Full attribution and non-claims are in
[the 2026-08-02 evidence](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_1_DIRECT_REWARD_COMPLETE_RUN_2026-08-02.md).

Run provenance is `unrecorded`, so this is reviewed exact-runtime coverage,
not Organic qualification or a durable claim. Generated choice, Kifuda, New
Leaf and V3 Inspection were not exercised.

## Current Artifact State

| Evidence level | Current fact |
|---|---|
| source | protocol `3.0-preview.2`; inspection schema `sts2.connector.v3/inspection-1`; HEAD `6413344...` plus reviewed worktree |
| automated tests | Gateway 240/240; Re 249/249 plus typecheck/build; Python MCP syntax passed |
| Release build | SHA `9a829a23d308aabddf43a36543cb65a46340a353bd4327d3eb229c49d516888e`; MVID `6a5ff4af-5d27-444c-b555-d3682cdfb7dd` |
| installed | exactly equals the current Release SHA/MVID; one canonical Mod manifest |
| loaded | `non-claim`: game is stopped and the new artifact has not been cold-loaded |
| last loaded | predecessor SHA `954150c6...6ff5`, MVID `2e1b0a8f...9d56`, runtime `239d8836...decb` |
| current authority | none while the Gateway is stopped |
| durable claim | none |

Current rollback snapshot:
`STS2MCP/.local/deployments/2026-08-01T21-51-15-903Z`.

## Pending Exact-Runtime Evidence

- cold-load source/built/installed SHA and MVID equality;
- direct Re shop, rest, treasure and visible-unsupported observations without
  a V2 sidecar;
- startup wait through `no_active_run_context` without hiding a legitimate
  unsupported interaction;
- V3 `run_deck`, `combat_piles` or `shop_catalog` Inspection with a current
  state token, plus stale-token rejection;
- generated-card-choice direct consumption and remaining Provider selectors;
- any qualification or durable authority claim.

## Next Live Step

```bash
cd Re-SpireAgent
npm run agent:run
```

The command performs exact-identity preflight. It must reject a mismatched or
unreachable Gateway rather than inheriting the predecessor runtime.
