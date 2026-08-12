# Player Environment Roadmap

## C1-S: Source Closure

Status: automated source closure verified; final committed build pending.

- one Player Environment public contract and route family;
- one Re decoder/action/executor path;
- no operation permission, qualification, SourceContract or V2/V3 authority;
- source-free generic native selector mechanics where current UI is sufficient;
- machine contract, schema and boundary checks enforce those properties.
- explicit visible-fact projection excludes Host-private binding IDs, and
  action candidates cannot create observation referents.

## C1-I: Stable And Inspectable Information

Status: implemented with explicit limits.

Snapshot contains stable current decision facts. Four state-bound Read families
preserve player-reachable deck, pile, shop and card detail. The optional
`native_pages.v1` evidence profile implements five bounded page paths without
changing normal decisions or mutation authority. Hover, arbitrary scrolling and
unreviewed tooltip subtypes remain explicitly partial/unsupported; the new
artifact has not yet Live-verified those page paths.

## C1-R: Runtime Seal

Status: pending one new exact artifact.

Required evidence:

1. source/build/install SHA and MVID match;
2. cold-loaded protocol/SHA/MVID/runtime/game/Modset match;
3. current and stale Snapshot/Read/Action cases behave correctly;
4. source-free one-of-N, deck, transform and combat-pile selectors execute;
5. settling and visible-unsupported boundaries recover or stop honestly;
6. one same-artifact ordinary C-only journey reaches a correct run boundary.

## After C1

Do not reopen C for strategy work. Shift the main program to A after C1-R unless
new exact-runtime evidence proves a C fact, action, read, stale, idempotency or
delivery defect. Transient PlayerCue is a bounded C1.x information extension;
Headless, Training and Search remain separate hosts/adapters rather than C1
freeze gates.
