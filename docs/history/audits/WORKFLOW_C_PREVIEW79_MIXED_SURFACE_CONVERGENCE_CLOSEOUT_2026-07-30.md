# Workflow C Preview.79 Mixed-Surface Convergence Closeout

**Status:** source, tests, Release build and installation verified; loaded and Live evidence pending  
**Starting commit:** `f019ac8d3859b05fffbf9c5e1986ce0481bf2b4e` on `develop`  
**Protocol/schema:** Bridge `2.0-preview.79`; Re normalized schema `31`  
**Prompt baseline:** global `4`; state guide `5` (unchanged)

## 1. Evidence Boundary

This closeout separates two exact artifacts:

```text
Preview.78 loaded runtime evidence
  SHA     2f3f6141a8dbc2e286b6a496aa9ed16bb2bee2784fadb585914ef1b73702b948
  MVID    be29a156-4746-4e97-9334-c144e42b1462
  runtime e08c8bb0d31d4adb8bb4b50454324bf1

Preview.79 source/build/install evidence
  SHA     1032e079ea1344fb42d1dce4f4dc60bfd85b36c1d7db167877d9e475dddf9268
  MVID    d9435656-951f-42f7-8275-7adc67f05572
  loaded  non-claim; game is closed after installation
```

Preview.78 evidence does not authorize Preview.79. No session grant or durable
claim crosses this boundary. The local qualification store is empty.

## 2. Latest Run Attribution

`run-20260730010057-w2pqnh` was produced by clean commit `f019ac8...` while the
game loaded Preview.78 under exact game `v0.109.1|c8c577f6|-820620422`, exact
Bridge-only Modset, clean Gateway-owned Patch inventory, permission mode
`migration_exploration`, and Prompt/guide `4/5`.

```text
decisions                       200
executed_and_settled            198
safe pre-execution stale          1
normal completed run boundary     1
unsupported                       0
unknown mutation                  0
unsettled command                 0
provider/parse/observation error  0
termination                       completed_run_boundary
```

The stale record was treasure tick 80. Re detected that the state changed
before submit, made no Gateway mutation call, fetched a fresh observation, and
the same semantic `choose_treasure_relic` operation completed on tick 81. This
is expected stale protection, not a Connector failure.

The run exercised:

- ordinary combat: 79 card plays, one potion use and 29 end turns;
- shop inventory open, card purchase, removal-selector handoff, merchant card
  removal, close and proceed;
- treasure open, choose and proceed;
- menu, character select, map, event, reward, rest, upgrade, game-over and
  return-to-menu flows;
- read-only Inspection: run deck, combat piles and shop catalog.

It did not exercise Kifuda, New Leaf, CombatPile selection, shop potion
purchase or treasure relic skip. Its provenance remains `unrecorded`, so this
is exact-runtime defect/coverage evidence, not Organic qualification.

## 3. Architecture Verdict

Verdict **B remains accepted**: the Semantic Gateway two-plane macro
architecture and ADR-0006 durable-authority boundary remain correct. The
remaining defect was mixed-generation authority within otherwise supported
Surfaces, not a need for a universal selector or transaction engine.

The explicit catalog is a reviewed contract-family revision. It binds the
audited owner/source set, operand contract, native Commit, completion boundary
and Witness. Each published action additionally binds current source evidence,
exact entity operands and state identity. Adding a new source changes code and
the catalog digest; visual similarity cannot inherit a durable claim.

## 4. Preview.79 Migration Wave

Preview.79 moves nine existing operations from volatile manifest fallback to
reviewed explicit contracts:

| Surface | Operation | Commit / completion |
|---|---|---|
| `shop_inventory` | `purchase_shop_potion` | native merchant purchase task / exact slot, gold and entry Witness |
| `shop_inventory` | `open_shop_card_removal` | native removal purchase task / exact selector handoff |
| `treasure_room` | `choose_treasure_relic` | exact holder click / exact relic owned and collection closed |
| `treasure_room` | `skip_treasure_relic` | exact skip proceed / settled room exit with unchanged relic count |
| `treasure_room` | `proceed_treasure_room` | exact non-skip proceed / map or room handoff |
| `deck_enchant_selection` | `toggle_card` | exact grid holder signal / membership delta |
| `deck_enchant_selection` | `preview_selection` | exact main confirm / preview visible |
| `deck_enchant_selection` | `close_selection` | exact close control / selector handoff |
| `deck_enchant_selection` | `cancel_preview` | exact preview cancel / preview closed and selection cleared |

`confirm_selection` was already explicit. Preview.79 tightens its catalog
source to the reviewed Self-Help Book and Kifuda runtime bindings, invalidating
the older digest. Source-specific Provider legality and Outcome remain
separate; no UI-shape authorization was introduced.

## 5. Evidence And Non-Claims By Operation

- Preview.78 supplies exact positive evidence for shop removal handoff,
  treasure choose and treasure proceed, plus a negative stale refusal for
  treasure choose.
- Provider source audit and fixture tests cover shop potion, treasure skip and
  the deck-enchant controls.
- All Preview.79 mutations are `pending exact-runtime evidence` because the
  completion-boundary identity and DLL changed.
- Shop potion and treasure skip are `not exercised` in the latest run.
- Kifuda remains `not exercised`; Self-Help Book evidence cannot substitute.
- New Leaf and CombatPile remain independent evidence gates and were not
  migrated in this wave.

No Preview.79 durable qualification was assembled. Encounter trials remain
runtime-bound and immediately quarantinable; fallback contracts still cannot
be persisted.

## 6. Deletion Result

```text
connector shadows                              0
permanent dual-read paths                      0
production action publication paths            1
production authority resolvers                 1
explicit native contracts                     22
manifest session fallback identities          65
operation-authority fallback branches           3
persistent fallback claim admission paths       0
mixed explicit/fallback supported Surfaces      0
bulk candidate startup paths                    0
Re native-completion reconstruction             0
control-history semantic identity inputs        0
```

The three operation-authority branches are the one remaining generic fallback
mechanism for unmigrated families. They are migration debt, not parallel
authority. Supported mixed Surface authority has been eliminated.

## 7. Verification

Completed before installation:

- targeted Gateway contract/store tests: 134 passed;
- complete Gateway tests: 201 passed;
- Re typecheck/tests/build: 212 tests passed;
- compatibility, permission, qualification and Connector CLI fixtures;
- Clean Closure machine inventory: `22 explicit / 65 fallback`;
- Release build: zero warnings and zero errors;
- `git diff --check`.

The installed artifact is the exact Release output. Installation diagnostics
found one canonical Gateway manifest and no duplicate scanned manifest.

## 8. Rollback And Next Gate

Rollback snapshot:

```text
STS2MCP/.local/deployments/2026-07-30T02-18-23-483Z
```

Next exact-runtime gate:

1. cold-start STS2 so the Gateway reports Preview.79 SHA/MVID;
2. run `cd Re-SpireAgent && npm run agent:run`;
3. retain the resulting run and command records;
4. attribute every stale, unsupported or unknown boundary before any new
   family migration or durable qualification.

