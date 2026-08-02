# Current Status

Baseline date: 2026-08-02

Branch: `connectorV3`

Source baseline: `718bbffc873144db35e2406f11b05de9a6e84054` plus the current reviewed
Preview.3 settling/combat/generated-consumer worktree. Source, tests, build,
install, load and Live evidence are separate states below.

## Current Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) remains
the only current Connector target. Native STS2 owns rules and effects; the
Gateway owns player-visible observation, one current interaction owner,
state/entity-bound command admission, execute-time native validation, native
Commit and action-local Outcome. Re selects only current V3 candidates and
supervises receipts and successors. REST and MCP are transports.

Connector V3 currently provides:

- `3.0-preview.3` observation and parameterized command contracts;
- `sts2.connector.v3/inspection-1` state-token-bound read-only detail;
- one visible interaction, including visible unsupported states with no
  command authority;
- exact state, interaction, source, owner, entity, controller and runtime
  identity;
- idempotent requests and `completed/not_executed/pending/unknown` receipts;
- direct Gateway command resolvers for ordinary combat, menu/run setup,
  event, map, reward/card reward, shop, rest, treasure, generated choice,
  deck enchant and game-over;
- direct Re observation consumption for ordinary combat, generated-card
  choice, menu, event, map, reward/card reward, shop, rest, treasure,
  game-over, lifecycle-settling and every visible unsupported interaction;
- scoped trial/quarantine and no retry after unknown mutation.

Remaining migration debt is explicit: several selector families still use
`provider_native_binding_adapter`; their Gateway execution is state-bound but
still enters through a Provider draft. Some direct Gateway families still
derive candidate discovery from `draft.Actions`. Re still expands bounded V3
operand domains into local opaque choices and retains V2 normalization only
for unmigrated selector surfaces. V2 is not a target architecture or silent
fallback.

## Latest Exact Runtime Evidence

Nine runs from `run-20260802073844-wyq08j` through
`run-20260802074610-ow4g7a` used loaded Preview.2 Gateway SHA
`9a829a23d308aabddf43a36543cb65a46340a353bd4327d3eb229c49d516888e`,
MVID `6a5ff4af-5d27-444c-b555-d3682cdfb7dd`, runtime
`b25326e8f84a49c6963fd5ce4bf7423e`, game `v0.110.1` commit `db5d3552`,
and exact-bridge-only Modset fingerprint
`8d2f9d37e7d6970f117768832a8f2a09ead8bf77cfbdc020aef19584f662077e`.
They recorded 57 decisions: 48 settled commands with confirmed completion and
available successors, then nine safe pre-mutation stops.

Direct Re consumption was exercised for menu, event, map, reward/card reward,
shop, rest and treasure. The nine stops were one run-mount, six combat and two
treasure settling observations incorrectly projected as unsupported. Preview.3
separates lifecycle readiness from family support and moves ordinary combat
and generated choice to the direct consumer. Full attribution is in
[the Preview.2 settling evidence](../../STS2MCP/docs/connector-v3/LIVE_EVIDENCE_V0_110_1_PREVIEW_2_SETTLING_FAILURE_2026-08-02.md).

Run provenance is `unrecorded` and the game log records developer-console
assistance. This is reviewed exact-runtime coverage, not Organic qualification
or a durable claim. Preview.3, generated-choice direct consumption and V3
Inspection have not been exercised.

## Current Artifact State

| Evidence level | Current fact |
|---|---|
| source | protocol `3.0-preview.3`; inspection schema `sts2.connector.v3/inspection-1`; HEAD `718bbff...` plus reviewed worktree |
| automated tests | Gateway 247/247; Re 256/256 plus typecheck/build; Python MCP syntax, CLI, docs, identity, compatibility, permission, qualification, profile and migration checks pass |
| Release build | Preview.3 SHA `1f82431fa5798768074628eea98a131a20f6faa20eda997d6770035045ec44b0`, MVID `17252734-e9e8-46a4-ba3a-37e6107a5f98` |
| installed | Preview.3 exactly matches the built SHA/MVID; one canonical Mod manifest |
| loaded | `non-claim`: the game is stopped and the Preview.3 endpoint has not been cold-loaded |
| current authority | none while the Gateway is stopped; the predecessor runtime used scoped provisional trial and had no persistent qualification |
| durable claim | none |

Current rollback snapshot:
`STS2MCP/.local/deployments/2026-08-02T08-11-59-532Z`.

## Pending Exact-Runtime Evidence

- Preview.3 cold-load identity equality for the built/installed SHA and MVID;
- settling recovery through run mount, combat resolution and treasure
  departure without hiding a legitimate unsupported interaction;
- direct Re combat and generated-card-choice observations without a V2
  sidecar;
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
