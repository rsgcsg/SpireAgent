# Current Status

Baseline date: 2026-08-02

Branch: `connectorV3`

Source baseline: `3d9477aba72f599f19ee685c304fb8aadc47ea3c` plus the current
reviewed Preview.4 worktree. Source, tests, build, install, load and Live
evidence are separate states below.

## Current Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) remains
the only current Connector target. Native STS2 owns rules and effects; the
Gateway owns player-visible observation, one current interaction owner,
state/entity-bound command admission, execute-time native validation, native
Commit and action-local Outcome. Re selects current V3 candidates and
supervises receipts and successors. REST and MCP are transports.

Connector V3 currently provides:

- `3.0-preview.4` observation and parameterized command contracts;
- `sts2.connector.v3/inspection-1` state-token-bound read-only detail;
- one visible interaction, including visible unsupported states with no
  command authority;
- exact state, interaction, source, owner, entity, controller and runtime
  identity;
- idempotent requests and `completed/not_executed/pending/unknown` receipts;
- direct Gateway command resolvers for ordinary combat, combat-hand selection,
  menu/run setup, event, map, reward/card reward, shop, rest, treasure,
  generated choice, deck enchant and game-over;
- direct Re consumption for the same ordinary families, lifecycle settling
  and every visible unsupported interaction;
- scoped trial/quarantine and no retry after unknown mutation.

Several selector families still use `provider_native_binding_adapter`; their
Gateway execution is state-bound but enters through a Provider draft. Some
direct Gateway families still derive candidate discovery from `draft.Actions`.
Re expands bounded V3 operand domains into local opaque choices and retains
the V2 projection sidecar only for unmigrated selector Surfaces. V2 is not a
target architecture or silent mutation fallback.

## Latest Exact Runtime Evidence

Three runs, `run-20260802081721-rbd1qh`,
`run-20260802090111-51w94r` and `run-20260802090204-x7lsad`, used exact loaded
Preview.3 SHA
`1f82431fa5798768074628eea98a131a20f6faa20eda997d6770035045ec44b0`,
MVID `17252734-e9e8-46a4-ba3a-37e6107a5f98`, runtime
`028362bff531495caa375aca0c62eb75`, game `v0.110.1` commit `db5d3552`,
and exact-bridge-only Modset fingerprint
`d70ae57ed91becc30c0fd68c6330681622069fa2f936e3c67dac04fdcff70a3b`.

They recorded 176 decisions and 172 completed, confirmed commands with
available successors. The 118-decision run reached `completed_run_boundary`.
Direct V3 consumption was exercised for combat, generated choice, menu,
event, map, reward/card reward, shop, rest, treasure and game-over. The two
combat-hand observations used the predecessor sidecar/Provider path and both
completed.

The four non-success decisions were one invalid model action ID with no
mutation, one RestSite room-model/input-owner mount misclassification, one
safe stale refusal followed by a fresh successful decision, and the expected
post-game main-menu boundary. Full attribution is in
[the Preview.3 evidence record](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_1_PREVIEW_3_DIRECT_JOURNEY_2026-08-02.md).

Run provenance is `unrecorded`. This is reviewed exact-runtime coverage, not
Organic qualification or a durable claim.

## Preview.4 Changes

- RestSite, Merchant and Treasure room models without a mounted native input
  owner now project exact `settling/no_action` only under the bounded
  `run_without_visible_overlay` lifecycle condition. Unknown rooms remain
  visible unsupported.
- Combat-hand selection now exposes exact actionable card/control facts,
  resolves the exact current hand and card at execution, and uses direct Re
  consumption without the V2 sidecar. It remains a distinct family, not a
  universal selector.
- The wire protocol moved to `3.0-preview.4`; no permission or persistent
  qualification was inherited from Preview.3.

## Current Artifact State

| Evidence level | Current fact |
|---|---|
| source | protocol `3.0-preview.4`; inspection schema `sts2.connector.v3/inspection-1`; HEAD `3d9477a...` plus reviewed worktree |
| automated tests | Gateway 255/255; Re 259/259 plus typecheck/build; Python MCP syntax, CLI, docs, identity, compatibility, permission, qualification, profile and migration checks pass |
| Release build | Preview.4 SHA `eafde5add1fbe4f815422e6a8abfacbc057179b3ecc8c4e27375e18d1f455da6`, MVID `0c011228-68a6-4717-9689-95ba6420a155` |
| installed | Preview.4 exactly matches the built SHA/MVID; one canonical Mod manifest |
| loaded | `non-claim`: the game is stopped and the Preview.4 endpoint has not been cold-loaded |
| current authority | none while the Gateway is stopped; Preview.3 used scoped provisional trial and had no persistent qualification |
| durable claim | none |

Current rollback snapshot:
`STS2MCP/.local/deployments/2026-08-02T09-30-13-237Z`.

## Pending Exact-Runtime Evidence

- Preview.4 cold-load identity equality for the built/installed SHA and MVID;
- RestSite room-model/input-owner settling recovery;
- direct combat-hand select and confirm without a V2 sidecar;
- V3 `run_deck`, `combat_piles` or `shop_catalog` Inspection with a current
  state token, plus stale-token rejection;
- remaining Provider selectors and any qualification or durable claim.

Kifuda, New Leaf, multi-stack Stratagem and physical UI-page opening were not
exercised by the latest runs and receive no transferred evidence.

## Next Live Step

```bash
cd Re-SpireAgent
npm run agent:run
```

The command performs exact-identity preflight. It must reject a mismatched or
unreachable Gateway rather than inherit Preview.3 authority.
