# Connector V3 v0.110.1 Re Shop Evidence: 2026-08-01

## Exact Identity

- run 1 Agent source revision:
  `7b3567775f5cea7d3e27679db721a695e99d46bd`;
- run 2 Agent source revision:
  `9a9546813566dd9e2e0460553de20a0cdc308cc2`;
- both metadata records declare the same clean source digest
  `2cd602d17915dc0df9baac7cdba1b9e380f25693bdef67e69b7a0a0053a8583b`;
- protocol: `3.0-preview.1`;
- loaded Gateway SHA:
  `3faf7cf2f402cafec0db40ea90a4212aef35c590c093caf6b114b69b7dba2d2b`;
- loaded MVID: `ebbea794-be0a-422d-a2ce-e2b981e664a5`;
- runtime: `0d517090cd3f4a10a2d844e423f01e5f`;
- game: `v0.110.1`, commit `db5d3552`, runtime main assembly hash
  `-205573697`, release-declared hash `348485714`;
- Modset: exact bridge only, fingerprint
  `1bf26047b68166b98b967e691d4a8d2630ed09092010bd1f20939432ca1c435f`;
- authority: encounter-scoped provisional trial; no durable qualification.

## Runs

`run-20260801104256-1qtr0a` used the V3 observation, command and receipt path.
It recorded 52 decisions: 51 `executed_and_settled` and one pre-Commit
`execution_failed`. The exercised journey included menu/run continuation,
combat card play and end turn, rewards, card rewards, map, event, shop-room
open, and V3-native shop card and potion purchases.

Decision 52 selected the advertised `close_shop_inventory` candidate. The
request carried `command=cancel_interaction` and the exact `screen_id`, but no
`control_id`. The direct shop resolver rejected it as
`shop_inventory_command_unsupported`; no native Commit occurred and retry was
forbidden.

`run-20260801104619-bh39g3` observed the still-open shop. The Gateway preserved
the visible inventory and published only one currently admitted purchase
candidate. Re then stopped before model or mutation because the temporary V2
consumer validator required a close action whenever `surface.can_close=true`.
This was a Re migration-projection defect, not an invalid STS2 state.

## Repair Boundary

Source now gives generic `cancel_interaction` controls an exact semantic
`control_id`, matching execute-time validation. Re now treats V3 candidate
coverage as authority-filtered while keeping visible shop facts complete and
validating every command that is actually published. The saved second-run raw
snapshot re-normalizes as `ok/actionable/shop_inventory` with only the one
Gateway-authorized V3 command.

Gateway contract tests, Re contract tests and snapshot re-normalization are
source/test evidence. The repaired artifact requires a new cold load and a
real shop close before this repair has Live evidence.

The repaired Release was built and installed after the game exited as SHA
`752cff7c7749868822804b8da724ef8385054bba7574b019a69a6fa6150c0b07`,
MVID `0be26638-fbdf-4a98-8950-d3179ee768db`. Built and installed identities
match. Loaded identity is a non-claim until the next cold start. Rollback:
`STS2MCP/.local/deployments/2026-08-01T11-08-02-342Z`.

## Non-claims

- The two purchases prove those exact commands in this exact runtime; they do
  not qualify all shop offers or card-removal continuation.
- The rejected close proves fail-closed behavior, not close success.
- Provenance is recorded as `unrecorded`; these runs are coverage evidence
  unless independently reviewed.
- No persistent qualification was created.
