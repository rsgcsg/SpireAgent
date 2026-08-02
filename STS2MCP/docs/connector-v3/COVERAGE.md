# Connector V3 Coverage

Status values distinguish source, automated evidence and exact-runtime Live
evidence. Evidence never transfers across SHA, MVID, runtime, game or Modset.

| Area | Current source | Automated evidence | Exact V3 Live evidence |
|---|---|---|---|
| Observation/state/entity identity | implemented | Gateway/Re tests | repeated v0.110.1 complete journeys |
| Visible unsupported interaction | direct Re consumption; no command authority | strict decoder and normalization tests | exact safe stops on predecessor identities; current artifact pending cold-load |
| Combat play/use potion/end turn | native direct resolver and direct Re | Gateway/Re direct-contract tests and saved-snapshot checks | 78 direct observations and repeated completed commands under Preview.3 |
| Combat-hand selection | explicit hand/card/control facts, direct native resolver and direct Re | descriptor, serialization, no-sidecar and wrong-owner tests | two predecessor Provider/sidecar observations completed under Preview.3; direct Preview.4 path pending |
| Menu/run setup | typed discovery, native resolver, direct Re | descriptor/operand/no-sidecar tests | complete-run exercised |
| Event option | typed discovery, native resolver, direct Re | enabled/owner/option tests | complete-run exercised |
| Map navigation | native resolver, direct Re | exact owner/choice and source-binding tests | repeatedly completed |
| Reward claim/card reward | typed discovery, native resolver, direct Re | exact entity and normalization tests | repeatedly completed |
| Shop room/inventory | native resolver, direct Re | exact offer/source/price/control and replacement-offer negatives | repeatedly completed |
| Rest site | native resolver, direct Re | exact option/disabled-option negatives plus known-room mount classifier | ordinary options exercised under Preview.3; mount repair pending Preview.4 |
| Treasure | typed native resolver, direct Re | stage/owner/entity and changed-stage negatives | completed plus one expected stale refusal/recovery under Preview.3 |
| Generated card choice | source-discriminated native resolver and direct Re | exact source/owner/screen/card/control tests | direct Attack Potion choice completed under Preview.3 |
| Game over | typed native resolver and direct Re | screen/stage/control tests | complete-run boundary exercised |
| Deck enchant | source-specific native resolver | source/operand tests | Symbiote and Self-Help Book exercised historically; Kifuda not exercised |
| Remaining selectors | `provider_native_binding_adapter` plus V2-shaped Re sidecar | inherited family tests | combat-pile, deck-upgrade, card-bundle and other selected families exercised; migration pending |
| V3 Inspection | state-token-bound `run_deck`, `combat_piles`, `shop_catalog`; Gateway/Re/MCP implemented | Gateway serialization, Re strict decode/stale negative, Python syntax | not exercised |
| V3 MCP | thin capabilities/observation/Inspection/submit/receipt transport | Python syntax | not exercised in latest Re journey |

## Latest Reviewed Runtime

The latest reviewed batch contains three Preview.3 runs ending in
`run-20260802090204-x7lsad`: 176 decisions, 172 completed/confirmed commands
with available successors and one completed game. It used Gateway SHA
`1f82431fa5798768074628eea98a131a20f6faa20eda997d6770035045ec44b0`,
MVID `17252734-e9e8-46a4-ba3a-37e6107a5f98`, runtime
`028362bff531495caa375aca0c62eb75`, game `v0.110.1` commit `db5d3552`,
and exact-bridge-only Modset fingerprint
`d70ae57ed91becc30c0fd68c6330681622069fa2f936e3c67dac04fdcff70a3b`.

See
[the exact evidence record](LIVE_EVIDENCE_V0_110_1_PREVIEW_3_DIRECT_JOURNEY_2026-08-02.md).
Provenance is `unrecorded`, so this is reviewed coverage evidence, not a
durable qualification.

## Replacement Artifact

Preview.4 source classifies the exact known-room model/input-owner mount gap as
typed settling and migrates combat-hand selection to direct discovery,
execution and Re consumption. Gateway 255 tests and Re 259 tests/typecheck/
build pass. Release SHA
`eafde5add1fbe4f815422e6a8abfacbc057179b3ecc8c4e27375e18d1f455da6`
and MVID `0c011228-68a6-4717-9689-95ba6420a155` were built and installed with
one canonical Mod manifest. Rollback snapshot:
`STS2MCP/.local/deployments/2026-08-02T09-30-13-237Z`.

The game was fully stopped before installation. Preview.4 loaded identity is
therefore a `non-claim`; Preview.3 remains the latest reviewed Live identity.

## Non-Claims

- No current durable qualification exists.
- Fixture, replay, build and install do not prove loaded or Live behavior.
- A complete journey does not qualify a family that did not occur.
- Kifuda, New Leaf, multi-stack Stratagem and V3 Inspection were not exercised
  in the latest batch.
- New versions, MVIDs, Modsets and Patch sets do not inherit authority.
- Physical UI-page opening is not implemented by semantic Inspection; it is a
  separate optional evidence profile.

Older exact-runtime records remain available in this directory and retain
their original identity scope. They are history, not current authority.
