# Current Status

Baseline date: 2026-08-03

Connector V3 is a **FREEZE CANDIDATE**, not frozen. The active branch is
`connectorV3`; checkout identity remains a per-machine fact and must be read
with `git rev-parse HEAD` and `git status --short`.

## Canonical Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) is the
only current Connector target. Native STS2 owns rules and effects. The Gateway
owns player-visible observation, the one mutation owner, exact command
admission, execute-time native validation, native Commit and action-local
Outcome. Re is a strict V3 consumer and receipt supervisor. REST and MCP are
transports.

Current source protocol is `3.0-preview.11`. The wire set includes
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
- The production Prompt uses deterministic compact projection v1. It retains
  player-visible decision facts, exact actions, instance identity and the
  information boundary while removing duplicated action menus, duplicated
  Inspection facts and governance-only metadata.
- The optional `native_pages.v1` human-equivalence evidence profile is
  implemented, configurable and CLI-accessible. It is disabled by default,
  read-only, runtime/state bound, outside normal Agent flow and non-authorizing.

Gateway tests pass 278/278. Re typecheck, 287/287 tests and production build
pass. Python MCP syntax, CLI, identity, compatibility, permission,
qualification, profile, migration, inventory, adaptation and clean-closure
checks pass.

## Per-machine Deployment Truth

The exact Preview.11 tuple and evidence levels are recorded in the
[Preview.11 freeze-candidate closeout](../../STS2MCP/docs/connector-v3/PREVIEW_11_FREEZE_CANDIDATE_CLOSEOUT_2026-08-03.md).
On that artifact:

- build, install and loaded SHA/MVID match;
- V3 capabilities, control, observation and strict Re decoding were observed;
- the Human profile advertised `enabled=false`, and an open request failed
  with `human_equivalence_disabled`;
- `main_menu/open_singleplayer` completed through native Commit, receipt and
  a stable `singleplayer_menu` successor;
- an old state/interaction/operand tuple returned
  `not_executed/stale_state/not_applied`; polling the same request returned
  the same receipt and no controller remained;
- the bounded Re run reached the model call but DeepSeek failed at the network
  boundary before any command submission.

This proves one exact operation canary and safety behavior. It does not prove
the rare selector matrix, a same-artifact Journey, Organic qualification or
cross-version/Mod support.

## Authority

- canary-permitted: exact encountered operation scopes on the current runtime;
- canary-exercised: `main_menu/open_singleplayer` only;
- durable/scoped qualification: none;
- persistent authority: disabled;
- Inspection and linked detail: read-only, state-bound and non-authorizing;
- disabled: empty/absent scope, unknown source, ambiguous owner, stale
  identity, unsupported Modset, discovery failure or incomplete exact
  contract.

One success never qualifies a Surface, sibling operation or origin. Protocol,
MVID, runtime, game, Modset or Patch changes never inherit authority.

## Freeze Blockers

1. Exercise targetless potion, combat-pile, deck-transform, Wood Carvings,
   generated choice, combat-hand reversible stages, current/stale Inspection
   and linked detail on the exact final artifact.
2. Exercise full native-page open/read/return/recovery with the optional Human
   profile enabled under operator control.
3. Complete one same-artifact ordinary Journey and classify every stop.
4. Record loaded rollback/revoke behavior; disk restore detection is already
   proven, but rollback loading is not.
5. Review evidence before creating any durable qualification.

## Local Runtime Entry

```bash
npm run verify:loaded
cd Re-SpireAgent
npm run agent:run
```
