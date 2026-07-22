# Bridge v2: v1 Retirement And Completeness Audit

Date: 2026-07-18  
Canonical protocol at latest audit amendment: `2.0-preview.47`

> Historical audit amended on 2026-07-18. Canonical live status remains
> [CURRENT_STATUS.md](CURRENT_STATUS.md); this report records the longer-form
> retirement analysis and must not override the current permission matrix.

## Verdict

Bridge v2 has genuinely solved the most dangerous architectural failures of
v1, but it has not replaced v1 and does not yet expose the complete
player-visible game.

The v2 safety/authority kernel is healthy. Its semantic coverage is incomplete.
Calling v2 “complete” today would be false.

Preview.47 does not change this verdict. It reduces observation-composition
drift, declares a partial player-visible closure/catalog, supports one bounded
linked-reward continuation, and exposes a non-authorizing contract-instance
shadow. It does not add a Surface, retire a v1 family, complete player-visible
truth, or replace Surface-kind authority.

## What v2 Actually Fixes

| v1 failure mode | v2 result |
|---|---|
| client sends mutable indices/targets | only opaque state-bound `action_id` is accepted |
| action list and execution legality can diverge | execution rebuilds the exact state and reruns provider validation |
| HTTP acceptance is mistaken for success | append-only command lifecycle requires semantic completion evidence |
| stale actions can hit shifted cards/options | `state_id` mismatch rejects before mutation |
| two overlapping UI layers can both publish actions | one Active Surface resolver owns input; ambiguity fails closed |
| client guesses purpose from prompt/type | purpose-specific Context/Surface contracts are source-resolved |
| UI closure is treated as business completion | removal, upgrade, purchase, acquisition, bundle, treasure, and other actions use semantic post-state witnesses |
| untested game update inherits permission | exact version/commit/assembly fingerprint scopes observation and execution |
| inspection can be confused with authority | Inspection is independent, read-only, state-bound, and outside the command ledger |
| partial/malformed facts disappear silently | typed diagnostics and completeness suppress actions |

The preview.27 game-over defect is useful evidence that these guarantees are
not merely slogans: Re rejected contradictory facts, command revalidation
rejected a publication mismatch, and no game mutation occurred.

## What v2 Has Not Solved

### Coverage

- root menu and standard single-player setup now have bounded v2 canaries;
  first-run tutorial, destructive/secondary menu choices, and non-standard
  setup remain uncovered;
- deck enchant has an implementation but no v0.109 permission; combat-pile
  selection has only an exact Headbutt canary whose corrected completion still
  lacks a natural repeat; generated choice has exact Lead Paperweight and Colorless Potion
  source canaries but no generic caller authority; event option/dialogue are
  current canaries but lack broad variant evidence;
- generic/purpose-unknown combat card selectors still fall to v1 or stop;
- transform, duplicate, linked reward, special treasure, daily/custom,
  timeline, profile, settings, compendium, and multiplayer are incomplete or
  intentionally unsupported;
- game-over loss intro/summary/return has a fresh lifecycle, while win and
  timeline-destination diversity remain missing.

### Player-visible information

v2 exposes strong bounded facts for active qualified Surfaces and a useful
persistent shared run/player projection. It does **not** expose every fact a
normal player can inspect:

- preview.46 covers text keywords and typed card previews for bounded shared,
  shop, treasure, and event owners; other hover kinds remain partial;
- run-deck is a separate Inspection, not always embedded;
- combat pile contents are a current-build read-only canary, not yet broadly
  qualified;
- menu/profile/history/compendium/timeline information is absent;
- special event, reward, map, shop, relic, potion, and card UI variants have
  not all been audited;
- temporary animation-stage information may intentionally be partial when no
  action is legal.

Hidden RNG, true draw order, future outcomes, future rewards, and future enemy
moves are intentionally excluded and are not completeness debt.

## Current Coverage Distance

Source currently contains 23 semantic Surface contracts. Exact source-qualified
v0.109 permits 22: five qualified and seventeen action canaries. One
implemented contract remains disabled on this build. The generated-choice
canary remains source-scoped to exact Lead Paperweight and exact Colorless
Potion branches. `run_deck` Inspection is qualified; `combat_piles` Inspection
is a separate read-only canary.

Approximate engineering ranges:

| Area | Estimated maturity |
|---|---:|
| authority / stale-state / command-lifecycle safety kernel | 80-90% |
| major ordinary in-run interaction families | 60-75% |
| practical v1 interaction parity | 50-65% |
| all normal single-player situations and player-visible semantics | 30-45% |

These ranges are deliberately broad. Surface count is not weighted by usage,
variant count, information richness, or failure severity.

## Architecture Judgment

Retain the current top-level model:

```text
SharedVisibleState + Context + one Active Surface + Stage + Authority
  + independent Inspection
  + opaque actions
  + semantic completion
```

It localizes game updates and prevents authority mixing better than v1. The
model should be changed only when repeated organic evidence shows a missing
top-level concept. Current defects have come from incorrect provider predicates,
permission drift, and incomplete coverage, not from a need for a universal UI
tree or Surface stack.

Internal reuse is appropriate for entity projection, bounded selection facts,
identity, diagnostics, and completion mechanics. Business eligibility and
commit semantics remain in purpose-specific Surfaces.

## Governance Debt Found

1. Code, permission, capability, and docs can drift independently. Preview.27
   temporarily demonstrated both omitted and duplicated capability entries.
2. Publication and execution revalidation share providers but can still use
   different local predicates inside an action closure. Contract tests need
   more provider-specific predicate fixtures or runtime canaries.
3. Canonical status had remained at preview.25 while code/runtime reached
   preview.27. Current status must stay short and be updated with every preview.
4. Organic runs mix v2 and explicit v1 fallback. Reports must count authority
   and Surface separately rather than call a whole run “v2”.
5. Canaries are too easy to describe as qualification. Permission, fixture,
   source audit, action canary, and organic qualification must remain distinct.
6. Preview.30 still treated an empty exact-build Surface scope as an implicit
   wildcard. Because the Provider registry grows over time, this could grant a
   historical build access to newly added providers. Preview.31 centralizes
   permission interpretation and makes every empty scope fail closed.
7. Preview.35 starts a non-authorizing typed contract inventory and requires it
   to match the lazy Provider registry. This reduces declaration drift, but
   exact-environment permission, operation/origin qualification, and visibility
   completeness remain separate evidence systems rather than manifest-derived
   authority.
8. Preview.40 adds source-bounded combat setup/resolution observation and Re
   semantic-cycle/settlement guards without inventing action authority.
9. Preview.41 confirms that read-only visibility can advance independently of
   action coverage. `combat_piles` is canary-permitted, while the similarly
   named selector remains disabled until caller-specific Source Binding and
   Outcome Witnesses exist.
10. Preview.42 confirms that a shared game UI can be reused without granting
    shared business authority. Exact Lead Paperweight source binding and a
    run-deck witness authorize one generated-choice origin; every other caller
    remains fail closed.
11. Preview.43 centralizes only the non-authorizing provider-failure wire
    shape. It prevents a failed binding from retaining business ownership but
    deliberately does not centralize source legality or completion.
12. Preview.44 confirms the safer extension pattern: a second source can join
    a strongly typed mechanic family only with its own Context, destination,
    cost/overflow semantics, operations, and Outcome Witness. Surface-kind
    permission still does not qualify unknown origins.

## Retirement Plan

1. Qualify preview.28+ game-over end to end.
2. Add purpose-specific root menu -> single-player submenu Surfaces; keep the
   existing character-select canary narrow.
3. Collect ordinary non-Neow event option/dialogue variants before promotion
   beyond canary.
4. Resolve naturally observed combat-pile selection origins into bounded
   source/outcome families; reject unknown purpose rather than trusting prompt
   text or selector closure.
5. Requalify disabled high-use selectors. Broaden `combat_piles` Inspection
   only after more current-build pile/reshuffle diversity.
6. Cover linked rewards, special maintenance, tooltip/keyword families, and
   remaining ordinary run variants.
7. Retire each v1 action family only after the exact v2 replacement has source,
   tests, loaded identity, organic lifecycle, and semantic completion evidence.

v1 should not be deleted wholesale. It should shrink as a visible compatibility
layer until no supported ordinary single-player journey depends on local index
reconstruction.
