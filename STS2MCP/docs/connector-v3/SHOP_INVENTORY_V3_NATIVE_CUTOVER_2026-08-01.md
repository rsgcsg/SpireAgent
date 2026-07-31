# Shop Inventory V3-Native Cutover Closeout: 2026-08-01

This closeout records one implementation slice. It does not promote authority
or reassign prior Live evidence to the new artifact.

## Boundary

- branch baseline:
  `connectorV3@6fa7ee5d22c872748580babddbec03625db9f17f` plus the documented
  uncommitted migration worktree;
- protocol: `3.0-preview.1`, unchanged;
- exact game assembly audited: STS2 `v0.110.1`, commit `db5d3552`,
  `sts2.dll` SHA
  `7c446efabf80614c429b5088e87101423aa5bb4c04fc3e73393261f6e6d404fd`,
  MVID `c0f649b8-8d57-4a9c-8b07-21aece97dca0`;
- permission and qualification changes: none;
- persistent qualification: none.

## Implemented

`shop_inventory` no longer obtains Connector V3 candidates or execution from
`draft.Actions` and `LegacyBinding.Start()`.

The V3 runtime now derives card, relic and potion purchases, card-removal
handoff and inventory close from the typed `ShopInventorySurface`. Every
candidate binds the exact inventory screen plus the exact offer or service.
At execution it resolves those IDs back to the current game objects, requires
the same open inventory and unique native slot, revalidates stock, visibility,
control enablement, affordability and advertised price, then calls the
existing STS2-owned purchase or UI commit. Existing semantic completion
Witnesses remain authoritative.

The card-removal path also now captures and revalidates its advertised price,
closing a publication/execution parity gap that existed in the Provider path.
No index, V2 action ID, coordinate, arbitrary reflection target or
client-reconstructed legality was added.

## Verification

- Gateway tests: `235/235` passed;
- Re-SpireAgent: typecheck, `223/223` tests and production build passed;
- Connector CLI, run-identity, docs/link, inventory, adaptation, clean-closure,
  compatibility, permission, qualification, environment-profile and migration
  checks passed;
- exact assembly operation-binding probes matched;
- the combat-pile audit still reports the known unregistered `Tutor` caller as
  diagnostic-only, with `authorization_effect: none`;
- Release build completed with zero warnings and zero errors.

## Artifact And Deployment

- built and installed DLL SHA:
  `28a6fba283bf26075ac8056e167f931f51322e5c36f85f93f85e617e10f8bf7f`;
- built and installed MVID:
  `ceee2912-fd46-4f9d-9c80-bef0d81d03fc`;
- rollback:
  `STS2MCP/.local/deployments/2026-07-31T15-03-48-449Z`;
- game process: stopped;
- loaded SHA/MVID/runtime: none for this artifact.

The preceding `.86` artifact, SHA
`548f15e45dc6609cf4a25af61af2ef2b07365af625b23dbd4f58369001a5f703`,
MVID `4700a63e-f587-49b7-a642-bfe10713cc42`, has the prior shop purchase and
close Live evidence. That run used `provider_native_binding_adapter`; it is
behavioral predecessor evidence, not proof of this V3-native cutover.

## Remaining Gate

The new artifact is **implemented, tested, built and installed**, but is not
loaded, observed, canary-exercised or qualified. The next cold-start window
must verify exact loaded identity, then exercise an advertised shop purchase
and close on their original request IDs. Card removal and linked relic reward
handoff remain separate targeted variants. Any stale owner, offer, slot or
price must fail before mutation.

