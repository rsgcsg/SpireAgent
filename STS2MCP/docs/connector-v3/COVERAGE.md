# Connector V3 Coverage

Status values are deliberately distinct from Live evidence.

| Area | Source implementation | Automated evidence | Exact V3 Live evidence |
|---|---|---|---|
| Observation/state token/entity identity | implemented; explicit null outside a run repaired | C# and Re tests | v0.110.0 completed journey |
| Visible unsupported interaction | implemented | protocol and Re projection tests | Crystal Sphere, unknown deck selector and pre-repair Symbiote exercised |
| Combat play card/use potion/end turn | direct native resolver; self-target operands and asynchronous end-turn Outcome repaired | C# and Re contract tests | current v0.110.1 `.86` artifact exercised all three with completed receipts across multi-round combats |
| Shop room open/proceed | direct native resolver | C# exact-operand tests plus inherited shop tests | exercised on v0.110.0 |
| Map navigation | direct native resolver with bounded drawing/input-mode Source Bindings | C# source/operand tests plus Re exact owner/choice contract and recorded-snapshot replay | repeated current-runtime V3-native mutations completed |
| Rest site | direct native resolver with exact child-handoff Outcome | C# source/Outcome tests | Dream Catcher exposed old unknown; repaired child handoff not exercised |
| Event option | typed-surface V3-native discovery and direct resolver | C# exact enabled/owner/option tests | V3-native option and continuation exercised with completed receipts |
| Treasure | stage-specific typed-surface V3-native discovery and direct resolver | C# stage/owner/entity tests | current-runtime V3-native mutations completed |
| Deck enchant | source-specific direct native resolvers for Self-Help Book, Symbiote and Kifuda | C# source/operand and Re unsupported-projection tests | Symbiote and Self-Help Book select/confirm exercised; Kifuda not exercised |
| Outer reward claim/discard/proceed | typed-surface V3-native discovery and direct resolver | C# owner/entity/discovery tests | current v0.110.1 `.86` claim/proceed path exercised repeatedly; potion discard not exercised on this artifact |
| Card reward select/alternative | typed-surface V3-native discovery and direct resolver with exact selectable-card facts | C# owner/entity/eligibility tests plus inherited Provider tests | current v0.110.1 `.86` card selection exercised repeatedly; skip alternative not exercised in this session |
| Menu/run setup | internal native-binding adapter | inherited Provider tests plus V3 projection tests | current `.86` menu and run setup exercised with completed receipts |
| Shop inventory purchase/removal/close | typed-surface V3-native discovery and direct resolver with exact screen/offer/slot/price revalidation | Gateway 235 tests, including typed eligibility and exact operand discovery | `.86` exercised adapter-backed purchase/close; current SHA `28a6...bf7f` is installed but not loaded, so native-cutover Live evidence is pending |
| Generated and other selection families | internal native-binding adapter | inherited family tests | current `.86` Hologram pile selection, Scroll Boxes bundle preview/commit and Infernal Blade generated free attack exercised; `.86` combat-hand label repair still pending |
| Single-stack Stratagem combat-pile source | exact Power source contract | source registry and protocol tests | pending |
| Multi-stack Stratagem | typed unsupported | contract deliberately excludes it | not exercised |
| Tutor combat-pile source | `code_required` for target-player owner binding | static audit; diagnostic only | not exercised |
| V3 detail/Inspection | pending | none | none |
| V3 MCP | implemented | locked Python 3.14 syntax check passed | transport not exercised in this journey |
| Re default V3 run | implemented | 223 tests, typecheck and production build passed | earlier v0.110.1 startup plus one settled main-menu command exercised; the current bounded journeys were Codex direct-play, not Re evidence |

Exact attribution is recorded in the
[first V3 evidence](LIVE_EVIDENCE_2026-07-31.md) and
[v0.110.0 evidence](LIVE_EVIDENCE_V0_110_0_2026-07-31.md). Each record proves
only its exact artifact, runtime and exercised families; neither is a durable
qualification.

The v0.110.0 evidence artifact was SHA
`68eed0b4890a96741dcb3f234e936149bfcc32affc806eb0c17db1142cc69685`,
MVID `54decad4-0ab8-4b4a-92c7-04aa2b5a35fb`. The subsequent map/rest/enchant
repair was built, installed and cold-loaded as SHA
`24f44c2482efe36a86be3dd9d085542676c275f5acf7f9c40b47329616069c2b`,
MVID `5feaf546-00c4-436c-8391-96a6087e8eb7`, runtime
`fb0774a99eaf4289b6ce928bc9070f3b`. It proved Symbiote and Self-Help Book
deck-enchant execution, did not exercise Dream Catcher, and exposed the
remaining map input-mode ABI drift. The second map repair plus event/treasure
V3-native cutovers were subsequently built and installed as SHA
`40d088745cd3e23844c06d81bbefd2b85ccb427104e7325d0719e3134607d84c`,
MVID `9add88e7-19d6-4854-95e3-060544ce5663`. At that installation boundary
they remained pending a new cold load; installation itself was not Live
evidence.

The artifact was later cold-loaded again as runtime
`2b379e0ef1574de6a482e16b31619981`.
`run-20260731080952-3q4fw8` proved V3-native event execution and the repaired
map Source Binding. It also exposed a Re-only migration defect: route actions
now bind exact `map_screen + map_node`, while the old consumer validator still
required a single node binding. The saved raw observation passes after the Re
repair. Subsequent runs completed repeated map, event and treasure V3-native
mutations and exposed action-local combat Outcome defects recorded in the
v0.110.0 evidence log.

The latest v0.110.1-targeted worktree artifact was built, installed and
cold-loaded as SHA
`548f15e45dc6609cf4a25af61af2ef2b07365af625b23dbd4f58369001a5f703`,
MVID `4700a63e-f587-49b7-a642-bfe10713cc42`, runtime
`a611dc97e2f046e4bd6e604c3501d692`. Direct Codex play exercised two bounded
journeys, including current-artifact combat, rewards, card rewards, map,
event, shop, bundle, pile selection, generated attack, menu and game-over
paths. The game is now stopped and no session authority remains. See the
[direct-play evidence](LIVE_EVIDENCE_V0_110_1_CODEX_DIRECT_PLAY_2026-07-31.md).

The preceding v0.110.1 startup artifact and its single Re-driven main-menu
command remain separately recorded in the
[deployment handoff](V0_110_1_DEPLOYMENT_HANDOFF_2026-07-31.md). No evidence
from an older SHA/MVID is reassigned to the latest artifact.

The subsequent shop-inventory native cutover is built and installed as SHA
`28a6fba283bf26075ac8056e167f931f51322e5c36f85f93f85e617e10f8bf7f`,
MVID `ceee2912-fd46-4f9d-9c80-bef0d81d03fc`, but remains unloaded. See the
[shop-inventory cutover closeout](SHOP_INVENTORY_V3_NATIVE_CUTOVER_2026-08-01.md).
