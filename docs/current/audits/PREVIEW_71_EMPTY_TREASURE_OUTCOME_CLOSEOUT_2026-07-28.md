# Preview.71 Empty-Treasure Outcome Closeout

Status: non-Live engineering complete; built and installed; cold-load and
targeted runtime evidence pending.

## Architecture Verdict

The accepted Semantic Gateway two-plane architecture remains the only target.
The new evidence supports ADR-0003's narrow native-contract migration rather
than a new workflow engine, reward rules model, or Re-side completion layer.

`open_treasure_chest` is one native action with two valid immediate outcome
branches: a relic-choice continuation or an empty chest that settles directly
to normal Proceed. Both are observable through the exact current treasure-room
lifecycle. STS2 remains the sole authority for whether a relic exists.

## Exact Runtime Evidence

All three runs below used loaded Preview.70 SHA
`28c32f40e22abf1779499d6d28ac4e6dbcea1e0b3d090aa8941ba02d5afbbc55`,
MVID `6f169dfe-3938-4256-ac85-af0e9b3e2ff1`, runtime
`a31b1c0764fe4ff4af7c1cd2f25a2fc9`, game
`v0.109.1|c8c577f6|-820620422`, exact bridge-only Modset, and clean known Patch
owners. Provenance is `unrecorded`; this is runtime defect/coverage evidence,
not Organic or persistent qualification.

- `run-20260728062709-srruj8` stopped before mutation after the primary and
  one pre-mutation transport retry both returned DeepSeek `fetch failed`.
- `run-20260728062739-cytun5` settled 69 actions. Decision 70 submitted
  `treasure_room/open_treasure_chest`; native execution changed state, but the
  command timed out after ten seconds with `outcome_not_observed`. Re correctly
  stopped and did not retry the unknown mutation.
- `run-20260728063258-5z9wpz` resumed the same runtime in the same treasure
  room. Its first observation showed `chestOpened=true`, no relics,
  `stage=completed`, and normal Proceed. Player state exposed Silver Crucible:
  "The first Treasure Chest you open is empty." The run then settled 121
  actions, safely rejected two semantic-changing stale decisions, and
  completed the game-to-menu boundary at decision 124 with no unsupported or
  observation failure.

## Source-Proven Root Cause

Exact v0.109.1 source shows:

- `SilverCrucible.ShouldGenerateTreasure()` returns false for its owner's first
  treasure room;
- native `NTreasureRoom.OpenChest()` still opens the chest, initializes an
  empty collection, completes relic picking, closes the collection, and enables
  normal Proceed;
- the old Gateway Oracle required
  `TreasureRoomRelicSynchronizer.CurrentRelics != null` and therefore could
  never confirm this legal empty branch.

The game completed correctly. Gateway completion was too narrow.

## Preview.71 Repair

- `TreasureLifecycleFacts.Stage()` is now the single stage classifier used by
  treasure observation.
- `TreasureLifecycleFacts.OpenChestResultReached()` accepts only two exact
  postconditions: opened + non-empty active collection, or opened + closed
  collection + visible enabled non-Skip Proceed.
- execution still uses the exact current room, screen, chest control and
  execute-time revalidation. Unknown outcomes remain non-retryable.
- no Silver Crucible ID, reward generation, RNG result, or hidden fact is
  encoded in the Connector.
- `treasure_room/open_treasure_chest` becomes the sixth explicit
  non-authorizing component-contract candidate. The other 81 catalog rows
  remain manifest hypotheses. No permission or qualification is created.

## Validation And Deployment

Completed:

- C# tests: 188 passed;
- Re tests: 202 passed;
- Re typecheck and production build passed;
- connector CLI, run-identity, compatibility, permission, qualification,
  Profile, migration, inventory, adaptation and documentation checks passed;
- Release build completed with zero warnings.

Installed artifact:

```text
protocol        2.0-preview.71
built SHA       fd0f7c56cbafd7fcf84386b0ee69944ca2f8170f8982dce9640d2e4f5cf679e6
installed SHA   fd0f7c56cbafd7fcf84386b0ee69944ca2f8170f8982dce9640d2e4f5cf679e6
built MVID      0acccd3d-8d08-4f95-ae64-75fc758a95f5
installed MVID  0acccd3d-8d08-4f95-ae64-75fc758a95f5
rollback        STS2MCP/.local/deployments/2026-07-28T08-46-30-998Z
```

The game is closed. No Preview.71 loaded SHA/MVID/runtime, treasure canary,
Organic action, permission transfer, or qualification is claimed.

## Next Evidence Boundary

Cold-start STS2 and run:

```bash
cd Re-SpireAgent
npm run agent:run
```

The preflight must first match Preview.71 protocol/SHA/MVID. A naturally
reached Silver Crucible empty first chest is the strongest targeted canary.
Do not manufacture that state and do not retry any unknown mutation.
