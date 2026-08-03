# Current Status

Baseline date: 2026-08-03

Connector V3 is a **CONDITIONAL FREEZE CANDIDATE**, not frozen. The active branch is
`connectorV3`; checkout identity remains a per-machine fact and must be read
with `git rev-parse HEAD` and `git status --short`.

## Canonical Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) is the
only current Connector target. Native STS2 owns rules and effects. The Gateway
owns player-visible observation, the one mutation owner, exact command
admission, execute-time native validation, native Commit and action-local
Outcome. Re is a strict V3 consumer and receipt supervisor. REST and MCP are
transports.

Current source protocol is `3.0-preview.12`. The wire set includes
`observation-1`, `command-1`, `control-1`, `inspection-1`,
`linked-detail-1` and `human-equivalence-1`.

## Source And Test Closure

- All 94 cataloged operations require explicit native contracts; fallback
  authority is zero.
- Connector V3 publishes candidates from its own non-executing command
  descriptor. It does not consume `draft.Actions`, `LegacyBinding`,
  `provider_native_binding_adapter` or `BridgeActionDraft`.
- Direct-family Provider files publish no actions. Historically named files
  may retain exact game binding, native Commit and Outcome helpers only.
- Re's active V3 adapter imports no V2 REST client, state/action sidecar or
  local legality reconstruction. V3 control registration and leases use
  `control-1`.
- V3 capabilities expose exact permission, qualification and Patch identity;
  Re strictly decodes and records those scopes.
- Generated choices compose shared current-card mechanics with a
  Gateway-local source contract. Re validates the advertised source-local
  operation and operands without maintaining a second source whitelist.
- Source-unresolved known UI is visible typed unsupported, not a malformed
  partial supported Surface. Re releases controller/local locks on normal
  exit, SIGINT and SIGTERM; Gateway TTL remains the crash fallback.
- The production Prompt uses deterministic compact projection v1. It retains
  player-visible decision facts, exact actions, instance identity and the
  information boundary while removing duplicated action menus, duplicated
  Inspection facts and governance-only metadata.
- The optional `native_pages.v1` human-equivalence evidence profile is
  implemented, configurable and CLI-accessible. It is disabled by default,
  read-only, runtime/state bound, outside normal Agent flow and non-authorizing.

Gateway tests pass 287/287. Re typecheck, 291/291 tests and production build
pass. Python MCP syntax, CLI, identity, compatibility, permission,
qualification, profile, migration, inventory, adaptation and clean-closure
checks pass.

## Per-machine Deployment Truth

The exact Preview.11 tuple and evidence levels are recorded in the
[Preview.11 freeze-candidate closeout](../../STS2MCP/docs/connector-v3/PREVIEW_11_FREEZE_CANDIDATE_CLOSEOUT_2026-08-03.md).
On that artifact, 44 exact-runtime runs recorded 309 decisions:

- build, install and loaded SHA/MVID match;
- V3 capabilities, control, observation and strict Re decoding were observed;
- the Human profile advertised `enabled=false`, and an open request failed
  with `human_equivalence_disabled`;
- one 203-decision ordinary Journey returned through the completed-game
  boundary; combat, event, map, shop, rest, reward and multiple selector
  families produced direct V3 receipts and successors;
- an old state/interaction/operand tuple returned
  `not_executed/stale_state/not_applied`; polling the same request returned
  the same receipt and no controller remained;
- four interrupted runs encountered a still-live controller lease; Quasar was
  rejected by duplicate Re source mechanics; rest Smith exposed a witness
  mismatch; and combat-hand confirm produced an unknown outcome without retry.

Preview.12 fixed those four defect classes and changed the operation catalog to
`bridge_v2_native_action_contracts_v16`. It was subsequently cold-loaded at
SHA `18f07ca327bb8e6f58f227674ca82fbe7ba1a91fe41875e5dea6de406edd3eaa`
and MVID `50309e88-c6a0-4faf-b2ae-7092f91eda7d` in runtime
`990ef9d80c3e46c988a184d94e05a0d3`. Five exact-runtime runs include three
completed-run boundaries and two repeatable Royal Stamp source-contract
failures. The completed journeys prove reached Preview.12 paths only; they do
not qualify unexercised sources.

The current source amendment moves reviewed deck-enchant sources into one
embedded registry, adds Royal Stamp, and binds volatile trial/quarantine to
the exact source-evidence partition instead of only `surface + operation`.
Source, tests, Release build and install are verified at SHA
`c9f61d76a4b58487f336f73241110fd5befb304a7c5388c57454656640e72b24`
and MVID `2b388d99-5a1b-46a7-9626-029a679deba0`; loaded identity and Live
behavior remain non-claims until cold start. Its detailed evidence and layered
freeze decision are in the
[adaptation amendment](audits/CONNECTOR_V3_ADAPTABILITY_AMENDMENT_AND_LAYERED_FREEZE_VERDICT_2026-08-03.md).

## Authority

- Preview.12 canary-permitted/exercised: exact encountered source/operation
  partitions only;
- all session promotions and quarantines are runtime evidence and are not
  inherited by a new SHA/MVID/runtime;
- durable/scoped qualification: none;
- persistent authority: disabled;
- Inspection and linked detail: read-only, state-bound and non-authorizing;
- disabled: empty/absent scope, unknown source, ambiguous owner, stale
  identity, unsupported Modset, discovery failure or incomplete exact
  contract.

One success never qualifies a Surface, sibling operation or origin. Protocol,
MVID, runtime, game, Modset or Patch changes never inherit authority.

## Freeze Blockers

1. Cold-load the source-registry amendment, prove Royal Stamp starts its own
   source-partitioned canary, and retain unknown-source visible unsupported.
2. Complete Quasar, combat-hand confirm, targetless potion, Kifuda, current/
   stale Inspection and linked-detail evidence on the same final artifact.
3. Exercise full native-page open/read/return/recovery with the optional Human
   profile enabled under operator control.
4. Record loaded rollback/revoke behavior; disk restore detection is already
   proven, but rollback loading is not.
5. Review evidence before creating any durable qualification. Cross-version
   and bounded-Mod requalification remain separate evidence gaps.

## Local Runtime Entry

```bash
npm run verify:loaded
cd Re-SpireAgent
npm run agent:run
```
