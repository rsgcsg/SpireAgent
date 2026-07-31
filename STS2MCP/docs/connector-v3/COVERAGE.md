# Connector V3 Coverage

Status values are deliberately distinct from Live evidence.

| Area | Source implementation | Automated evidence | Exact V3 Live evidence |
|---|---|---|---|
| Observation/state token/entity identity | implemented | C# and Re tests | pending |
| Visible unsupported interaction | implemented | protocol tests | pending |
| Combat play card/use potion/end turn | direct native resolver | C# and Re contract tests | pending |
| Menu/map/reward/shop/rest/treasure | internal native-binding adapter | inherited Provider tests plus V3 projection tests | pending |
| Generated and selection families | internal native-binding adapter | inherited family tests | pending |
| Single-stack Stratagem combat-pile source | exact Power source contract | source registry and protocol tests | pending |
| Multi-stack Stratagem | typed unsupported | contract deliberately excludes it | not exercised |
| V3 detail/Inspection | pending | none | none |
| V3 MCP | implemented | Python syntax and CLI schema checks passed | pending |
| Re default V3 run | implemented | 219 tests, typecheck and production build passed | pending |

The latest predecessor v2 runs are defect and coverage evidence only. They do
not qualify V3.

The current V3 Release is built and installed as SHA
`c045438f2a1d32bae1137f4ba2dc923c6f8aed0e1840854d7510bfc5d21577e2`,
MVID `79b762d1-062d-485a-b36c-ac71f24944dd`. Loaded identity and every V3 Live
column remain pending until a cold game restart.
