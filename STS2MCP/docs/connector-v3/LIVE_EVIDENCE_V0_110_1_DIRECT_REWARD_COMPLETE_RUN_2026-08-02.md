# Connector V3 v0.110.1 Complete-Run Evidence, 2026-08-02

Status: reviewed exact-runtime coverage evidence. It is not a durable
qualification or evidence for source changes made after the run.

## Exact Identity

The two runs below used clean Agent source
`6413344e1f075d8e52c114b338ab4c02e23dc916`, Connector protocol
`3.0-preview.1`, Gateway SHA
`954150c6d964a4f6a78a6483aa82c5cb5066fc5e2bdf762ce56efb22e2166ff5`,
MVID `2e1b0a8f-05e8-4262-b7ff-5791564e9d56`, runtime
`239d883654b6414e9ab1089c0a45decb`, game `v0.110.1` commit `db5d3552`,
main assembly hash `-205573697`, and exact-bridge-only Modset fingerprint
`1f273ee90ec14e389137f17707436d0065412ecfb432be5f9ef12940196f6035`.
The fixed Agent strategy baseline was global prompt v4 and state guide v5.

Run provenance is recorded as `unrecorded`; therefore these runs are
coverage-only unless independently reviewed. They created no durable claim.

## Runs

`run-20260801205515-3co77m` stopped after one decision. The Gateway returned
the explicit startup sentinel `context.source_type=no_active_run_context`, no
active interaction and no candidates. Re then requested its temporary V2
projection sidecar, whose diagnostic policy rejected the same transient state.
No mutation was submitted. This is an operator-startup sequencing and
migration-sidecar defect, not an unsupported STS2 semantic state.

`run-20260801205605-0fqlrj` reached the completed-run boundary after 175
decisions:

- 172 commands were `executed_and_settled`;
- two treasure decisions were safely refused as stale before submit and the
  run continued from fresh observations;
- the final decision stopped normally after the completed game returned to a
  non-actionable top-level menu;
- no unknown Outcome, unsupported interaction, provider failure or unsettled
  command occurred.

The journey covered combat, event, map, menu, rest, reward, shop, treasure and
game-over contexts. Surface counts included 91 combat turns, 24 reward-claim
states, seven card rewards, 16 maps, eight treasure states, seven shop states,
four rest states, two combat-hand selections, two combat-pile selections, two
deck upgrades and two card-bundle selections.

Direct Re consumption was exercised for menu, event, map, game-over,
reward-claim and card-reward observations. Reward operations comprised 17
claims, seven reward proceeds and seven card selections; their receipts
settled and exposed successors. Shop, rest, treasure and selector observations
still used the Re V2-shaped sidecar in this loaded artifact even though their
Gateway commands were V3-native.

Generated-card choice, Kifuda, New Leaf and V3 Inspection were not exercised.

## Post-Run Source Changes

Current source fixes the startup race by waiting only while the explicit
`no_active_run_context` sentinel is current. Legitimate visible unsupported
states are not hidden or waited away.

Current Re source also consumes shop-room, shop-inventory, rest-site,
treasure-room and visible unsupported V3 observations directly. Seventeen
recorded shop/rest/treasure pre-state snapshots replayed without either V2
sidecar field; exact source/owner/operand/stage negative cases fail closed.

Current Gateway source adds `sts2.connector.v3/inspection-1` and a state-token
bound read-only V3 endpoint for `run_deck`, `combat_piles` and `shop_catalog`.
This endpoint does not enter the Command Ledger or grant action authority.

Those post-run changes are protocol `3.0-preview.2`, tested, built and installed
as SHA `9a829a23d308aabddf43a36543cb65a46340a353bd4327d3eb229c49d516888e`,
MVID `6a5ff4af-5d27-444c-b555-d3682cdfb7dd`. They are pending cold-load and
exact-runtime evidence; no `preview.1` authority transfers to them.

Rollback for the new install:
`STS2MCP/.local/deployments/2026-08-01T21-51-15-903Z`.

## Non-Claims

- The run does not qualify the post-run direct shop/rest/treasure consumer.
- It does not prove V3 Inspection, generated choice or remaining Provider
  selector families.
- It does not create persistent authority or prove cross-version/Modset
  compatibility.
- A successful replay, test, build or install is not loaded or Live evidence.
