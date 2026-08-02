# Connector V3 Coverage

Status values distinguish source, automated evidence and exact-runtime Live
evidence. Evidence never transfers across SHA, MVID, runtime, game or Modset.

| Area | Current source | Automated evidence | Exact V3 Live evidence |
|---|---|---|---|
| Observation/state/entity identity | implemented | Gateway/Re tests | repeated v0.110.1 complete journeys |
| Visible unsupported interaction | direct Re consumption; no command authority | strict decoder and normalization tests | predecessor unsupported states only; current replacement pending cold-load |
| Combat play/use potion/end turn | native direct resolver | Gateway/Re tests | repeatedly completed |
| Menu/run setup | typed discovery, native resolver, direct Re | descriptor/operand/no-sidecar tests | complete-run exercised |
| Event option | typed discovery, native resolver, direct Re | enabled/owner/option tests | complete-run exercised |
| Map navigation | native resolver, direct Re | exact owner/choice and source-binding tests | repeatedly completed |
| Reward claim/card reward | typed discovery, native resolver, direct Re | exact entity and normalization tests | 24 reward-claim and seven card-reward states in latest complete run |
| Shop room/inventory | native resolver; direct Re in replacement source | exact offer/source/price/control and replacement-offer negatives | native commands exercised; direct Re replacement pending cold-load |
| Rest site | native resolver; direct Re in replacement source | exact option and disabled-option negatives | native commands exercised; direct Re replacement pending cold-load |
| Treasure | typed native resolver; direct Re in replacement source | stage/owner/entity and changed-stage negatives | native commands exercised; direct Re replacement pending cold-load |
| Generated card choice | source-discriminated native resolver; direct Re | exact source/owner/card tests | `not exercised` on latest runtime |
| Game over | typed native resolver; direct Re | screen/stage/control tests | complete-run exercised |
| Deck enchant | source-specific native resolver | source/operand tests | Symbiote and Self-Help Book exercised historically; Kifuda not exercised |
| Remaining selectors | `provider_native_binding_adapter` plus V2-shaped Re sidecar | inherited family tests | combat-hand, combat-pile, deck-upgrade and card-bundle exercised; migration pending |
| V3 Inspection | state-token-bound `run_deck`, `combat_piles`, `shop_catalog`; Gateway/Re/MCP implemented | Gateway serialization, Re strict decode/stale negative, Python syntax | pending cold-load and exact-runtime read |
| V3 MCP | thin capabilities/observation/Inspection/submit/receipt transport | Python syntax | not exercised in latest Re journey |

## Latest Reviewed Runtime

The latest reviewed journey is `run-20260801205605-0fqlrj`: 175 decisions,
172 settled commands, two safe pre-submit stale refusals, no unknown Outcome,
and a normal completed-game boundary. It used Gateway SHA
`954150c6d964a4f6a78a6483aa82c5cb5066fc5e2bdf762ce56efb22e2166ff5`,
MVID `2e1b0a8f-05e8-4262-b7ff-5791564e9d56`, runtime
`239d883654b6414e9ab1089c0a45decb`, game `v0.110.1` commit `db5d3552`,
and exact-bridge-only Modset fingerprint
`1f273ee90ec14e389137f17707436d0065412ecfb432be5f9ef12940196f6035`.

See
[the exact evidence record](LIVE_EVIDENCE_V0_110_1_DIRECT_REWARD_COMPLETE_RUN_2026-08-02.md).
Provenance is `unrecorded`, so this is reviewed coverage evidence, not a
durable qualification.

## Replacement Artifact

Current source fixes the startup transient and directly consumes shop, rest,
treasure and visible unsupported observations. It also adds V3-native
state-bound Inspection. Gateway 240 tests, Re 249 tests/typecheck/build and
Python syntax pass.

The replacement is built and installed as SHA
`9a829a23d308aabddf43a36543cb65a46340a353bd4327d3eb229c49d516888e`,
MVID `6a5ff4af-5d27-444c-b555-d3682cdfb7dd`, with rollback
`STS2MCP/.local/deployments/2026-08-01T21-51-15-903Z`.

The game is stopped. Loaded identity, direct shop/rest/treasure behavior,
startup sequencing and V3 Inspection are `pending exact-runtime evidence`.

## Non-Claims

- No current durable qualification exists.
- Fixture, replay, build and install do not prove loaded or Live behavior.
- A complete journey does not qualify a family that did not occur.
- New versions, MVIDs, Modsets and Patch sets do not inherit authority.
- Physical UI-page opening is not implemented by semantic Inspection; it is a
  separate optional evidence profile.

Older exact-runtime records remain available in this directory and retain
their original identity scope. They are history, not current authority.
