# Connector V3 Coverage

Status values are deliberately distinct from Live evidence.

| Area | Source implementation | Automated evidence | Exact V3 Live evidence |
|---|---|---|---|
| Observation/state token/entity identity | implemented; explicit null outside a run repaired | C# and Re tests | v0.110.0 completed journey |
| Visible unsupported interaction | implemented | protocol and Re projection tests | Crystal Sphere, unknown deck selector and pre-repair Symbiote exercised |
| Combat play card/use potion/end turn | direct native resolver | C# and Re contract tests | exercised with completed receipts |
| Shop room open/proceed | direct native resolver | C# exact-operand tests plus inherited shop tests | exercised on v0.110.0 |
| Map navigation | direct native resolver with audited v0.109/v0.110 ABI binding | C# source/operand tests | old ABI failed on v0.110.0; repair pending new runtime |
| Rest site | direct native resolver with exact child-handoff Outcome | C# source/Outcome tests | Dream Catcher exposed old unknown; repair pending new runtime |
| Deck enchant | source-specific direct native resolvers for Self-Help Book, Symbiote and Kifuda | C# source/operand and Re unsupported-projection tests | pre-repair Symbiote unsupported observed; repaired mutation pending |
| Menu/reward/shop inventory/treasure | internal native-binding adapter | inherited Provider tests plus V3 projection tests | exercised with completed receipts |
| Generated and other selection families | internal native-binding adapter | inherited family tests | combat-hand, card-reward and deck-removal selection exercised |
| Single-stack Stratagem combat-pile source | exact Power source contract | source registry and protocol tests | pending |
| Multi-stack Stratagem | typed unsupported | contract deliberately excludes it | not exercised |
| Tutor combat-pile source | `code_required` for target-player owner binding | static audit; diagnostic only | not exercised |
| V3 detail/Inspection | pending | none | none |
| V3 MCP | implemented | locked Python 3.14 syntax check passed | transport not exercised in this journey |
| Re default V3 run | implemented | 220 tests, typecheck and production build passed | 140 decisions across 21 runs; final run completed one-game boundary |

Exact attribution is recorded in the
[first V3 evidence](LIVE_EVIDENCE_2026-07-31.md) and
[v0.110.0 evidence](LIVE_EVIDENCE_V0_110_0_2026-07-31.md). Each record proves
only its exact artifact, runtime and exercised families; neither is a durable
qualification.

The v0.110.0 evidence artifact was SHA
`68eed0b4890a96741dcb3f234e936149bfcc32affc806eb0c17db1142cc69685`,
MVID `54decad4-0ab8-4b4a-92c7-04aa2b5a35fb`. The subsequent map/rest/enchant
repair is built and installed as SHA
`24f44c2482efe36a86be3dd9d085542676c275f5acf7f9c40b47329616069c2b`,
MVID `5feaf546-00c4-436c-8391-96a6087e8eb7`. It is not loaded and does not
inherit the previous runtime evidence.
