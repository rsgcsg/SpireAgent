# Current Functional Roadmap

## V3-0: Vertical Source Cutover

Status: implemented and repeatedly exercised for ordinary journeys. V3 is the
default Gateway/Re contract; REST and MCP are thin transports. Preview.8 source
is reviewed and tested, while its per-machine build/install/load state must be
queried rather than copied into repository truth.

Exit remains exact source/build/install/load identity plus automated checks.
Installing a DLL is not loading it.

## V3-1: Exact Runtime Canary

Status: Preview.7 loaded exactly. One run completed an ordinary game with 202
settled commands and an expected completed-run stop. Two preceding Merchant
removal stops exposed the direct-descriptor authority cycle fixed in Preview.8.
Preview.8 inherits none of that runtime authority.

Next exit:

- use a provenance-verified Preview.8 build/install and cold-load its exact
  reported SHA/MVID;
- verify protocol, game, Modset, runtime and scoped authority;
- exercise one migrated source-bound selector and retain exact receipts.

## V3-2: Ordinary Journey

Status: multiple exact v0.110.1 ordinary journeys exist. The latest reviewed
Preview.7 run completed one game with 202 settled commands and stopped at the
top-level menu rather than starting another game. It retains its exact
SHA/MVID/runtime and does not qualify Preview.8.

## V3-3: Native Family Migration

Direct Gateway and direct Re currently cover ordinary combat and major
non-combat families, combat-hand, Smith upgrade, merchant/relic/reward removal,
Scroll Boxes bundles, rest, event card acquisition, source-discriminated
generated-card choices and Luminous Choir event removal. These selector slices
no longer depend on Provider candidate publication/execution or a V2-shaped Re
sidecar.

Next vertical slices, in priority order:

1. `combat_pile_card_selection` using its existing typed source catalog;
2. deck-transform with source-distinct transaction contracts;
3. Wood Carvings without transferring unrelated selector authority;
4. any earlier blocker reached organically.

Each slice requires typed owner/source/stage facts, exact operands, shared
publication/execution validation, native Commit, semantic Outcome, direct Re,
negative tests, scoped permission and exact-runtime evidence before old-path
deletion. Similar UI never transfers business semantics.

## V3-4: Visibility And Human Information

Status: persistent summary, complete current Surface, typed state-bound
Inspection and bounded `surface_card` linked detail are implemented. Preview.5
proved current/stale `run_deck` and linked-detail behavior. Combat-piles and
shop-catalog Live evidence remain pending.

Semantic accessibility stays the default. Physically opening native pages is
an optional human-equivalence evidence profile and must not become mutation
authority.

## V3-5: Authority And V2 Retirement

Status: no durable qualification exists. Exact operation contracts support
volatile encounter trials only when current runtime/source admission succeeds;
  empty scopes are Fail Closed. Eleven manifest fallback contracts remain
tracked migration debt: two combat-pile, six deck-transform and three Wood
Carvings contracts. The catalog has 83 explicit native contracts.

Retire each remaining Provider/V2-shaped path only after a V3-native
replacement is tested and exact-runtime exercised. Do not perform a bulk V2
rewrite, design V4 or move game rules into Re.

## Later

After the Live Connector is stable and ordinary migration debt is closed,
resume measurable Agent evaluation. Headless and learning remain separate
future projects.
