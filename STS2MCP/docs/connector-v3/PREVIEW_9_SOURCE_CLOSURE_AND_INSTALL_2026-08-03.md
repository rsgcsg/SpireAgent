# Preview.9 Source Closure And Install

Date: 2026-08-03

## Baseline And Evidence

- branch: `connectorV3`;
- base HEAD: `672389d552f2d7b2f32c53e5aa95aa25b02e2140`;
- source protocol: `3.0-preview.9`;
- exact local game assembly:
  `E:/SteamLibrary/steamapps/common/Slay the Spire 2/data_sts2_windows_x86_64/sts2.dll`;
- exact game identity available in reviewed runtime records: `v0.110.1`,
  commit `db5d3552`, main hash `-205573697`;
- source worktree: dirty with this Preview.9 change set.

The exact local assembly was inspected with ILSpy for the affected contracts.
`PotionModel.IsValidTarget(null)` accepts targetless native target types, while
explicit single-target types still require their native target. Explosive
Ampoule is `AllEnemies`. Whispering Hollow and New Leaf use the native
transformation selector; Wood Carvings uses its generic deck selector and a
deterministic branch replacement. These are direct local source observations,
not runtime proof.

The final compatibility audit reports the already-modeled `Tutor` negative
holdout. Direct decompilation confirms `Tutor` is `MultiplayerOnly`, targets
`cardPlay.Target.Player`, selects from that target player's draw pile and then
uses `CardPileCmd.Add(..., Hand)`. The ordinary combat-pile contract binds the
source-card owner, so it cannot safely authorize `Tutor`. The audit result
`review_required_unregistered_callers` is therefore expected and
non-authorizing: `Tutor` remains diagnostic-only pending a separate
participant/visibility/Outcome contract and Organic evidence.

## Preview.8 Archive

The supplied external archive contains two direct-V3 runs on:

```text
SHA      26c5baaeaa24cfe6e8665693c4e7e45486df45f8cab65a2d74ebc2d6bac2e529
MVID     d1476ec1-4da8-4658-b594-6fea40de3ca0
runtime  ddc07fa2e35b4d588f9ebc73283d2044
protocol 3.0-preview.8
game     v0.110.1 / db5d3552 / -205573697
Modset   exact_bridge_only / 7bad4df8f7498c76e27fdbeb3994db13894824057dd2c3085ab8bce4bcaba4fb
```

`run-20260803032329-7152dd` settled one command and stopped because no exact
current binding remained. `run-20260803032348-tvtdxe` settled 11 commands and
reached completed-game state. Provenance is `unrecorded`; these records prove
exact Preview.8 coverage only. They are not Organic qualification, persistent
authority or evidence for Preview.9.

## Defects Closed

1. Combat potion discovery rejected every `null` target before calling native
   legality. It now accepts targetless potions only when
   `PotionModel.IsValidTarget(null)` succeeds.
2. Map annotation exit and character selection used broader facts than their
   current native controls. Typed control availability now drives both V3
   publication and Re parity checks.
3. Generated-card Re validation accepted any selection-shaped operation and
   lacked exact selectable-set parity. The Surface now carries current
   selectable IDs, skip availability and source-bound operations; V3 constructs
   descriptors directly and Re rejects operation or command-set drift.
4. V3 Re still had a V2 projection sidecar and the operation catalog could
   synthesize manifest fallbacks. Both paths are removed; explicit contracts
   are mandatory.

## Completed Direct Slices

- combat-pile card selection;
- deck transformation for exact audited sources;
- Wood Carvings deterministic replacement;
- combat turn, deck enchant and event dialogue typed command facts;
- generated-card source-operation parity;
- remaining menu, map, shop, reward and selection Provider draft deletion.

Shared selector mechanics remain reusable, but source, purpose, native Commit
and Outcome stay independent. No universal selector, index mutation, V2 action
ID, arbitrary reflection call or rules reconstruction was introduced.

## Source Closure Metrics

```text
explicit native contracts             94
fallback authority contracts           0
Provider draft publication (families)  0
Connector draft.Actions consumption    0
Connector LegacyBinding consumption    0
Re V2 capability/state sidecar          0
persistent fallback claim admission     0
```

Historically named Provider files can still contain exact game binding,
execute-time validation, native Commit and witness helpers. That is internal
Gateway mechanics reuse, not a Provider authority or alternate executor.

## Verification

- Gateway tests: `270/270` passed;
- Re typecheck: passed;
- Re tests: `285/285` passed;
- Re production build: passed;
- Connector CLI and run-identity checks: passed;
- clean-closure inventory: `94` explicit, `0` fallback;
- Release build: passed, 0 warnings and 0 errors;
- Markdown/current-truth/inventory/adaptation/closure checks: run again at
  final closeout after this document update.
- exact operation binding audit: `reviewed_bindings_match`;
- exact compatibility audit: registered sources matched; the intentional
  multiplayer-only `Tutor` holdout remained diagnostic-only.

## Build, Install And Rollback

```text
Release SHA    540acf9658b3bf04b2e094f3778453e063088aa8af560b67ea35b317c5a39d49
Release MVID   afa5d986-d82d-4a01-b2ab-5509e3926f61
installed SHA  540acf9658b3bf04b2e094f3778453e063088aa8af560b67ea35b317c5a39d49
installed MVID afa5d986-d82d-4a01-b2ab-5509e3926f61
source digest  f7efbefc0182d4f4da45640391c063271141f36928ed1e1f1bb2ce1affadd99a
rollback       .local/deployments/2026-08-03T05-01-55-991Z
```

STS2 was closed during install. Loaded SHA/MVID, runtime instance, current
game/Modset/Patch identity, authority and observation readiness are therefore
non-claims.

## Human Information

Persistent summary, complete current Surface, state-bound typed Inspection and
bounded `surface_card` linked detail remain the semantic-accessibility default.
Preview.5 previously exercised current/stale run-deck and linked-detail reads.
The optional physical native-page human-equivalence profile remains unbuilt;
it must never silently change the Agent decision flow or create authority.

## Authority And Safety

- qualified/durable Preview.9 scope: none;
- Preview.9 canary/session scope: none while the game is closed;
- empty scope, unknown source/owner, stale token, identity drift and incomplete
  command contract: Fail Closed;
- one current owner, opaque state-bound commands, exact operands, execute-time
  revalidation, native Commit, idempotency, action-local Outcome,
  unknown-no-retry and hidden-information exclusions are retained.

## Non-Claims And Next Gate

Preview.9 is implemented, tested, built and installed. It is not loaded,
Live-exercised, canary-exercised, Organic-qualified or durably qualified. The
next smallest gate is one cold start, exact loaded identity verification, then
a bounded run that prioritizes targetless potion and final selector families
without transferring authority from older MVIDs.
