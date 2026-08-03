# Current Status

Baseline date: 2026-08-03

Active branch: `connectorV3`. The current base HEAD is
`672389d552f2d7b2f32c53e5aa95aa25b02e2140`; Preview.9 is an uncommitted,
reviewed worktree over that HEAD. Always use `git rev-parse HEAD` and
`git status --short` instead of treating this mutable document as checkout
identity.

## Canonical Architecture

[ADR-0007](decisions/ADR-0007-connector-v3-canonical-architecture.md) is the
only current Connector target. Native STS2 owns rules and effects. The Gateway
owns player-visible observation, one mutation owner, exact command admission,
execute-time native validation, native Commit and action-local Outcome. Re is a
strict V3 consumer and receipt supervisor. REST and MCP are transports.

Current source protocol is `3.0-preview.9`. Inspection remains
`sts2.connector.v3/inspection-1`; linked detail remains
`sts2.connector.v3/linked-detail-1`.

## Latest Reviewed Runtime Evidence

The supplied Preview.8 archive contains two runs from source revision
`672389d552f2d7b2f32c53e5aa95aa25b02e2140` with this exact loaded tuple:

- protocol `3.0-preview.8`;
- DLL SHA `26c5baaeaa24cfe6e8665693c4e7e45486df45f8cab65a2d74ebc2d6bac2e529`;
- MVID `d1476ec1-4da8-4658-b594-6fea40de3ca0`;
- runtime `ddc07fa2e35b4d588f9ebc73283d2044`;
- game `v0.110.1`, commit `db5d3552`, main hash `-205573697`;
- Modset `exact_bridge_only`, fingerprint
  `7bad4df8f7498c76e27fdbeb3994db13894824057dd2c3085ab8bce4bcaba4fb`.

`run-20260803032329-7152dd` settled one command and then stopped safely because
no exact current command binding existed. `run-20260803032348-tvtdxe` settled
11 commands and reached a completed-game non-actionable boundary. Both runs
are direct V3 without a Re V2 sidecar. Their provenance is `unrecorded`, so
they are exact-artifact journey coverage, not Organic qualification, durable
authority or evidence for Preview.9.

Older Preview.5-Preview.7 evidence remains valid only for its recorded exact
SHA/MVID/runtime tuples. In particular, Preview.5 proved current/stale
`run_deck` Inspection and `surface_card` linked detail; Preview.7 completed a
202-command game. No predecessor evidence transfers to Preview.9.

## Preview.9 Source Closure

Preview.9 completes the remaining source migration:

- `combat_pile_card_selection`, `deck_transform_selection` and
  `wood_carvings_replacement_selection` have typed direct V3 discovery,
  execution and direct Re consumers;
- all 94 manifest operations require explicit native contracts; fallback
  authority contracts are zero;
- Connector V3 does not consume `draft.Actions`, `LegacyBinding` or
  `provider_native_binding_adapter`;
- Re Connector V3 no longer requests or projects a V2 capabilities/state
  sidecar;
- direct-family Providers publish no `BridgeActionDraft`; generated-card
  descriptors are built by V3 from typed selectable/control/operation facts;
- targetless native potions, including Explosive Ampoule, are no longer
  rejected merely because their valid native target is `null`;
- map annotation and character selection use exact current native control
  availability instead of broader visual approximations.

The exact `v0.110.1` assembly audit still reports `Tutor` as the intentional
negative combat-pile holdout. `Tutor` is multiplayer-only and selects from
`cardPlay.Target.Player`; the current single-owner source contract cannot
authorize that target player's pile. It remains diagnostic-only and Fail
Closed pending a separate participant/visibility/Outcome contract. This does
not leave a fallback in the ordinary single-player production path.

This is source/test/build/install closure. It is not loaded, Live, canary or
qualified evidence for Preview.9.

## Per-machine Deployment Truth

On this machine, the game was closed and the final Release was built and
installed with:

- SHA `540acf9658b3bf04b2e094f3778453e063088aa8af560b67ea35b317c5a39d49`;
- MVID `afa5d986-d82d-4a01-b2ab-5509e3926f61`;
- Gateway source digest
  `f7efbefc0182d4f4da45640391c063271141f36928ed1e1f1bb2ce1affadd99a`;
- rollback snapshot `.local/deployments/2026-08-03T05-01-55-991Z`.

Built and installed identities match. Loaded SHA/MVID, runtime instance,
game/Modset identity and runtime authority are unverified because STS2 is
closed. `npm run verify:loaded` must establish them after a cold start.

## Authority

- durable qualification: none in reviewed current evidence;
- Preview.9 session/canary authority: none until exact cold-load admission;
- Inspection: state-bound, read-only, independent and non-authorizing;
- disabled: empty/absent scope, unknown source, ambiguous owner, stale binding,
  unsupported Modset, discovery failure or incomplete exact contract.

One success never creates a persistent claim. Protocol, MVID, Modset, Patch or
runtime changes never inherit authority.

## Remaining Work

- cold-load Preview.9 and verify SHA/MVID/protocol/game/Modset/runtime;
- exercise targetless potion, combat-pile, deck-transform, Wood Carvings and
  generated-choice operation parity on this exact artifact;
- re-exercise current/stale `combat_piles` and `shop_catalog` Inspection plus
  `surface_card` linked detail;
- retain evidence for rollback/revoke and supported/trial/quarantined/
  unsupported lifecycle behavior;
- add the optional physical native-page human-equivalence evidence profile
  without changing semantic accessibility by default.

## Local Runtime Entry

```bash
npm run verify:loaded
cd Re-SpireAgent
npm run agent:run
```
