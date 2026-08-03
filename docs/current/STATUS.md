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

Gateway tests pass 284/284. Re typecheck, 291/291 tests and production build
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

Preview.12 fixes those four defect classes and changes the operation catalog to
`bridge_v2_native_action_contracts_v16`. Source/build/install are verified at
SHA `18f07ca327bb8e6f58f227674ca82fbe7ba1a91fe41875e5dea6de406edd3eaa`
and MVID `50309e88-c6a0-4faf-b2ae-7092f91eda7d`; the rollback snapshot is
`STS2MCP/.local/deployments/2026-08-03T12-07-43-930Z`. Loaded identity and all
Preview.12 Live behavior remain non-claims until cold start.

## Authority

- Preview.11 canary-permitted/exercised: exact encountered operations only;
- Preview.11 session promotions and quarantines are runtime evidence, not
  inherited Preview.12 authority;
- durable/scoped qualification: none;
- persistent authority: disabled;
- Inspection and linked detail: read-only, state-bound and non-authorizing;
- disabled: empty/absent scope, unknown source, ambiguous owner, stale
  identity, unsupported Modset, discovery failure or incomplete exact
  contract.

One success never qualifies a Surface, sibling operation or origin. Protocol,
MVID, runtime, game, Modset or Patch changes never inherit authority.

## Freeze Blockers

1. Cold-load Preview.12, then re-exercise Quasar, rest, combat-hand confirm,
   source-unresolved visible unsupported and immediate restart after SIGINT.
2. Complete the remaining targetless potion, rare selector, current/stale
   Inspection and linked-detail matrix on Preview.12 without transferring old
   MVID evidence.
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
