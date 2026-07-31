# Connector V3 Coverage

Status values are deliberately distinct from Live evidence.

| Area | Source implementation | Automated evidence | Exact V3 Live evidence |
|---|---|---|---|
| Observation/state token/entity identity | implemented; explicit null outside a run repaired | C# and Re tests | v0.110.0 completed journey |
| Visible unsupported interaction | implemented | protocol and Re projection tests | Crystal Sphere, unknown deck selector and pre-repair Symbiote exercised |
| Combat play card/use potion/end turn | direct native resolver | C# and Re contract tests | exercised with completed receipts |
| Shop room open/proceed | direct native resolver | C# exact-operand tests plus inherited shop tests | exercised on v0.110.0 |
| Map navigation | direct native resolver with bounded drawing/input-mode Source Bindings | C# source/operand tests plus Re exact owner/choice contract and recorded-snapshot replay | current artifact projected exact map owner and three choices; Re pre-repair validation stopped before mutation, repaired mutation pending |
| Rest site | direct native resolver with exact child-handoff Outcome | C# source/Outcome tests | Dream Catcher exposed old unknown; repaired child handoff not exercised |
| Event option | typed-surface V3-native discovery and direct resolver | C# exact enabled/owner/option tests | V3-native option and continuation exercised with completed receipts |
| Treasure | stage-specific typed-surface V3-native discovery and direct resolver | C# stage/owner/entity tests | prior adapter open/proceed exercised; V3-native cutover pending |
| Deck enchant | source-specific direct native resolvers for Self-Help Book, Symbiote and Kifuda | C# source/operand and Re unsupported-projection tests | Symbiote and Self-Help Book select/confirm exercised; Kifuda not exercised |
| Menu/reward/shop inventory | internal native-binding adapter | inherited Provider tests plus V3 projection tests | exercised with completed receipts |
| Generated and other selection families | internal native-binding adapter | inherited family tests | combat-hand, card-reward and deck-removal selection exercised |
| Single-stack Stratagem combat-pile source | exact Power source contract | source registry and protocol tests | pending |
| Multi-stack Stratagem | typed unsupported | contract deliberately excludes it | not exercised |
| Tutor combat-pile source | `code_required` for target-player owner binding | static audit; diagnostic only | not exercised |
| V3 detail/Inspection | pending | none | none |
| V3 MCP | implemented | locked Python 3.14 syntax check passed | transport not exercised in this journey |
| Re default V3 run | implemented | 221 tests, typecheck and production build passed | current run exercised direct event and stopped before map mutation on a repaired Re contract mismatch |

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

The artifact was then cold-loaded as runtime
`5af58fb23e544f488151057d6c2c53c9`.
`run-20260731080952-3q4fw8` proved V3-native event execution and the repaired
map Source Binding. It also exposed a Re-only migration defect: route actions
now bind exact `map_screen + map_node`, while the old consumer validator still
required a single node binding. The saved raw observation passes after the Re
repair, but map mutation remains pending exact-runtime evidence.
