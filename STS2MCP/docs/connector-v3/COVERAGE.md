# Connector V3 Coverage

Status values distinguish source, automated evidence and exact-runtime Live
evidence. Evidence never transfers across SHA, MVID, runtime, game or Modset.

| Area | Current source | Automated evidence | Exact V3 Live evidence |
|---|---|---|---|
| Observation/state/entity identity | implemented | Gateway/Re tests | repeated v0.110.1 complete journeys |
| Visible unsupported interaction | direct Re consumption; no command authority | strict decoder and normalization tests | exact safe stops on predecessor identities; current artifact pending cold-load |
| Combat play/use potion/end turn | native direct resolver and direct Re | Gateway/Re direct-contract tests and saved-snapshot checks | 78 direct observations and repeated completed commands under Preview.3 |
| Combat-hand selection | explicit hand/card/control facts, direct native resolver and direct Re | descriptor, serialization, no-sidecar and wrong-owner tests | not exercised under loaded Preview.4 |
| Menu/run setup | typed discovery, native resolver, direct Re | descriptor/operand/no-sidecar tests | complete-run exercised |
| Event option | typed discovery, native resolver, direct Re | enabled/owner/option tests | complete-run exercised |
| Map navigation | native resolver, direct Re | exact owner/choice and source-binding tests | repeatedly completed |
| Reward claim/card reward | typed discovery, native resolver, direct Re | exact entity and normalization tests | repeatedly completed |
| Shop room/inventory | native resolver, direct Re | exact offer/source/price/control and replacement-offer negatives | repeatedly completed |
| Rest site | native resolver, direct Re | exact option/disabled-option negatives plus known-room mount classifier | ordinary options exercised under Preview.4; exact mount classifier branch not exercised |
| Treasure | typed native resolver, direct Re | stage/owner/entity and changed-stage negatives | completed plus one expected stale refusal/recovery under Preview.3 |
| Generated card choice | source-discriminated native resolver and direct Re | exact source/owner/screen/card/control tests | direct Attack Potion choice completed under Preview.3 |
| Game over | typed native resolver and direct Re | screen/stage/control tests | complete-run boundary exercised |
| Deck enchant | source-specific native resolver | source/operand tests | Symbiote and Self-Help Book exercised historically; Kifuda not exercised |
| Deck upgrade | exact screen/card/control discovery, direct native resolver and direct Re | selection stages, preview return, confirm and drift tests | Smith predecessor sidecar exercised under Preview.4; direct Preview.5 path pending |
| Merchant deck removal | merchant-source direct resolver and direct Re | source isolation, stages, exact-card/Gold/service Outcome tests | pending Preview.5; relic/reward removal not included |
| Remaining selectors | `provider_native_binding_adapter` plus V2-shaped Re sidecar | inherited family tests | combat-pile, card-bundle, relic/reward removal and other selected families exercised; migration pending |
| V3 Inspection | state-token-bound `run_deck`, `combat_piles`, `shop_catalog`; Gateway/Re/MCP implemented | Gateway serialization, Re strict decode/stale negative, Python syntax | not exercised |
| V3 linked detail | state-token-bound current-Surface `surface_card`; Gateway/Re/MCP implemented | Gateway serialization, Re strict entity/token decode, Python syntax | pending Preview.5 cold load |
| V3 MCP | thin capabilities/observation/Inspection/submit/receipt transport | Python syntax | not exercised in latest Re journey |

## Latest Reviewed Runtime

The latest reviewed Preview.4 run is `run-20260802094606-6734zk`: 161
decisions, 157 completed/confirmed commands with available successors and one
completed game. It used Gateway SHA
`eafde5add1fbe4f815422e6a8abfacbc057179b3ecc8c4e27375e18d1f455da6`,
MVID `0c011228-68a6-4717-9689-95ba6420a155`, runtime
`5a57a66e318f4bdeb7167e4b719e1c3d`, game `v0.110.1` commit `db5d3552`,
and exact-bridge-only Modset fingerprint
`9d665afd68a0bba4bc7428ccb12d70456b4d72573b5d91b874950cf8b6460b91`.

See
[the exact evidence record](LIVE_EVIDENCE_V0_110_1_PREVIEW_4_COMPLETE_JOURNEY_2026-08-02.md).
Provenance is `unrecorded`, so this is reviewed coverage evidence, not a
durable qualification.

## Replacement Source

Preview.5 migrates the observed Smith deck-upgrade selector and merchant-only
deck removal to direct V3 discovery, execution and Re consumption. It adds
bounded `surface_card` linked detail. Gateway 258 tests and Re 265 tests plus
typecheck/build pass. Release SHA
`dda1e348d7972f42c75768bdde9db5242f332c08bfb739c26fceef96385babcd`
and MVID `7446a1a2-4a7f-44c0-8c5c-ad95651a7ebd` are built and installed with
one canonical Mod manifest. Preview.4 remains the latest reviewed Live
identity until Preview.5 is cold-loaded.

## Non-Claims

- No current durable qualification exists.
- Fixture, replay, build and install do not prove loaded or Live behavior.
- A complete journey does not qualify a family that did not occur.
- Kifuda, New Leaf, multi-stack Stratagem, combat-hand, merchant removal,
  Preview.5 direct Smith, V3 Inspection and linked detail were not exercised
  in the latest batch.
- New versions, MVIDs, Modsets and Patch sets do not inherit authority.
- Physical UI-page opening is not implemented by semantic Inspection; it is a
  separate optional evidence profile.

Older exact-runtime records remain available in this directory and retain
their original identity scope. They are history, not current authority.
