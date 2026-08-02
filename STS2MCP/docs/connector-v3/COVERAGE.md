# Connector V3 Coverage

Status values distinguish source, automated evidence and exact-runtime Live
evidence. Evidence never transfers across SHA, MVID, runtime, game or Modset.

| Area | Current source | Automated evidence | Exact V3 Live evidence |
|---|---|---|---|
| Observation/state/entity identity | implemented | Gateway/Re tests | repeated v0.110.1 complete journeys |
| Visible unsupported interaction | direct Re consumption; no command authority | strict decoder and normalization tests | predecessor unsupported states only; current replacement pending cold-load |
| Combat play/use potion/end turn | native direct resolver; direct Re in Preview.3 source | Gateway/Re direct-contract tests and 11 protocol-rewritten saved snapshots | native commands repeatedly completed under Preview.2; direct Re pending Preview.3 cold load |
| Menu/run setup | typed discovery, native resolver, direct Re | descriptor/operand/no-sidecar tests | complete-run exercised |
| Event option | typed discovery, native resolver, direct Re | enabled/owner/option tests | complete-run exercised |
| Map navigation | native resolver, direct Re | exact owner/choice and source-binding tests | repeatedly completed |
| Reward claim/card reward | typed discovery, native resolver, direct Re | exact entity and normalization tests | 24 reward-claim and seven card-reward states in latest complete run |
| Shop room/inventory | native resolver; direct Re | exact offer/source/price/control and replacement-offer negatives | direct Re exercised under Preview.2 |
| Rest site | native resolver; direct Re | exact option and disabled-option negatives | direct Re exercised under Preview.2 |
| Treasure | typed native resolver; direct Re | stage/owner/entity and changed-stage negatives | direct Re exercised under Preview.2; settling departure exposed the repaired classification defect |
| Generated card choice | source-discriminated native resolver; direct Re in Preview.3 source | exact source/owner/screen/card/control tests | earlier Skill Potion adapter exercised; direct Re `not exercised` |
| Game over | typed native resolver; direct Re | screen/stage/control tests | complete-run exercised |
| Deck enchant | source-specific native resolver | source/operand tests | Symbiote and Self-Help Book exercised historically; Kifuda not exercised |
| Remaining selectors | `provider_native_binding_adapter` plus V2-shaped Re sidecar | inherited family tests | combat-hand, combat-pile, deck-upgrade and card-bundle exercised; migration pending |
| V3 Inspection | state-token-bound `run_deck`, `combat_piles`, `shop_catalog`; Gateway/Re/MCP implemented | Gateway serialization, Re strict decode/stale negative, Python syntax | pending cold-load and exact-runtime read |
| V3 MCP | thin capabilities/observation/Inspection/submit/receipt transport | Python syntax | not exercised in latest Re journey |

## Latest Reviewed Runtime

The latest reviewed batch is the nine runs from
`run-20260802073844-wyq08j` through `run-20260802074610-ow4g7a`: 57
decisions, 48 settled commands, no stale submission or unknown Outcome, and
nine safe stops caused by one settling-classification defect. It used Gateway
SHA `9a829a23d308aabddf43a36543cb65a46340a353bd4327d3eb229c49d516888e`,
MVID `6a5ff4af-5d27-444c-b555-d3682cdfb7dd`, runtime
`b25326e8f84a49c6963fd5ce4bf7423e`, game `v0.110.1` commit `db5d3552`,
and exact-bridge-only Modset fingerprint
`8d2f9d37e7d6970f117768832a8f2a09ead8bf77cfbdc020aef19584f662077e`.

See
[the exact evidence record](LIVE_EVIDENCE_V0_110_1_PREVIEW_2_SETTLING_FAILURE_2026-08-02.md).
Provenance is `unrecorded`, so this is reviewed coverage evidence, not a
durable qualification.

## Replacement Artifact

Preview.3 source separates known settling from unsupported families and
directly consumes ordinary combat and generated-card choices. Gateway 247
tests and Re 256 tests/typecheck/build pass. Release SHA
`1f82431fa5798768074628eea98a131a20f6faa20eda997d6770035045ec44b0` and
MVID `17252734-e9e8-46a4-ba3a-37e6107a5f98` were built and installed with one
canonical Mod manifest. Rollback snapshot:
`STS2MCP/.local/deployments/2026-08-02T08-11-59-532Z`.

The game was fully stopped before installation. Preview.3 loaded identity is
therefore a `non-claim`; the Preview.2 identity above remains only the latest
reviewed Live evidence. Preview.3 settling recovery, direct combat/generated
behavior and V3 Inspection are `pending exact-runtime evidence`.

## Non-Claims

- No current durable qualification exists.
- Fixture, replay, build and install do not prove loaded or Live behavior.
- A complete journey does not qualify a family that did not occur.
- New versions, MVIDs, Modsets and Patch sets do not inherit authority.
- Physical UI-page opening is not implemented by semantic Inspection; it is a
  separate optional evidence profile.

Older exact-runtime records remain available in this directory and retain
their original identity scope. They are history, not current authority.
