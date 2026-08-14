# Preview.68 Long-Run Reliability And Native-Contract Migration Audit

## Evidence Boundary

Starting source commit: `12c57e90762eb170382ab637a64264bfb089d9f7` on
`develop`, equal to `origin/develop` when this work began.

The three input runs are current-build real-runtime records, but their declared
provenance is `unrecorded`. They are valid defect and coverage evidence after
direct record/runtime-log inspection; they are not Organic qualification and
cannot promote persistent authority.

All three used Preview.67, game `v0.109.1|c8c577f6|-820620422`, Gateway SHA
`100ddf42c2114b30602a41c8908f63e154fc8f41a10ed37d4e2a1bded84fc74d`,
MVID `65bd744d-270b-4026-84c4-2ee397eee4e2`, runtime epoch
`13f8d3d62d1644ec91a405a59dc4cd64`, and environment digest
`0cc2f76995afbffece47fb793d8797030acf64f908f4887d2fe91120df401164`.

## Run Findings

| Run | Settled | Non-settled evidence | Diagnosis |
|---|---:|---|---|
| `run-20260727103406-wn92jv` | 98 | one `state_changed_during_composite_read`; one combat transition | eager state + Inspection bundle crossed a natural state boundary; safe transient observation failure |
| `run-20260727103957-wno7wf` | 26 | two composite-read races; one pre-commit stale state; final unsupported | stale guard was correct and recovered; bounded run incorrectly treated `allow-run-entry` as permission to start a second game after game-over cleanup |
| `run-20260727104330-fdxz1o` | 21 | Kifuda purchase timed out as unknown | purchase committed, but exact native parent awaited a deck-enchant child; generic shop witness required parent task closure and overran 10 seconds |

The run-two terminal sequence was:

```text
combat end
-> game_over summary
-> return main menu
-> open singleplayer
-> character select
-> embark
-> unsupported transition
```

The correct one-game boundary is after returning from a terminal run to the
top-level menu. Initial run entry remains allowed.

The Kifuda record proves native commit before timeout: the selected product was
Kifuda, its player-visible description states that pickup enchants up to three
cards with Adroit, the observed state changed, and exact v0.109.1 source shows
`RelicCmd.Obtain` adds the relic before awaiting `Kifuda.AfterObtained`, which
opens a non-cancelable manual `NDeckEnchantSelectScreen`. This is not an
ordinary slow purchase and not evidence for a generic workflow engine.

Gateway logs also repeatedly failed direct formatting of Frost Orb
`SmartDescription` without the variables supplied by the native hover path.
The fix uses native `HoverTips` first and preserves numeric Passive/Evoke facts
separately.

## Architecture Verdict

Retain the accepted two-plane architecture. Replace neither the Gateway nor
its hard action boundary. Refine the live plane toward the Lean Native-Contract
Semantic Kernel in
[ADR-0003](../decisions/ADR-0003-operation-retirement-and-native-continuation-migration.md).

The attached operation-retirement critiques correctly identify role overload,
but immediate removal would destroy the currently enforced permission path.
The accepted migration is shadow-first:

- runtime source binding and contract identity become explicit and
  non-authorizing;
- command receipts carry a typed completion boundary;
- exact continuation handoff is allowed only for a proven native parent/child;
- operation remains current legacy authority until dual-read migration proves
  its replacement;
- universal selector, purchase, workflow, Transaction IR, and Effect DSL remain
  rejected.

## Preview.68 Implementation

- coherent observation reads retry the complete read-only sequence up to three
  times only on typed transient state drift;
- stale action preflight remains fail closed and does not retry mutation;
- a bounded run stops after game-over cleanup reaches the top-level menu;
- Kifuda purchase may complete at
  `continuation_handoff_observed` only when the exact relic, owner, Adroit
  selector parameters, and native child screen agree;
- Self-Help Book and Kifuda deck-enchant sources are explicit contracts;
  unknown sources advertise no actions;
- CommandReceipt exposes its completion boundary;
- a non-authorizing runtime source/contract shadow is emitted for exact
  providers;
- Orb text uses the native player-visible hover path;
- `npm run agent:run` now performs exact artifact/environment preflight,
  resumes the exact migration trial through the Operator Shell, requires the
  Gateway to revalidate authority, and only then starts the bounded Re loop.

## Non-Claims

- Preview.68 source/tests/build/install are not loaded evidence until a cold
  game restart reports the new SHA/MVID.
- Kifuda fixtures and source audit are not an Organic Kifuda canary.
- A continuation handoff is not a settled parent transaction.
- Retry of read-only coherent observation is not retry of a mutation.
- The runtime contract shadow does not authorize actions.
- Existing Preview.67 real runs do not qualify Preview.68 or persistent claims.

## Verification And Deployment

The completed non-Live verification is:

- C# Gateway tests: `165/165` passed;
- Re tests: `192/192` passed with typecheck and production build;
- Connector CLI, docs, inventory, adaptation, compatibility, permission,
  qualification, profile, and migration checks passed;
- the non-authorizing source/binding audits completed and kept the unregistered
  `Tutor` caller diagnostic-only;
- a running Preview.67 instance was rejected before Agent/model execution for
  built/installed SHA, MVID, and source/loaded protocol drift;
- Release Preview.68 was built and installed with SHA
  `d33791395a33d6937a03e9853e865f35b631104f943ecf3abcf4027c32c2418f`
  and MVID `6c2e1933-462c-43ae-ad6f-edb60b1bf19c` on both sides;
- rollback is available at
  `STS2MCP/.local/deployments/2026-07-27T13-34-39-345Z`.

After cold start, loaded SHA/MVID matched the built and installed artifact.
The first two `agent:run` attempts safely stopped before DeepSeek because the
Operator Shell required normal observation before starting the migration cycle
that could establish it. This was a bootstrap-order defect, not a Gateway
identity, Modset, Patch, provider, or game-state failure.

The fixed identity phase requires exact artifact agreement and the
`exact_bridge_only` Modset without requiring normal observation. The migration
cycle then created profile `env-8fb83dbe8bb6ddd3772d6b64`, installed 87 exact
session-canary candidates, and installed zero persistent qualifications. After
Gateway revalidation, `observation_ready=true`, `mutation_ready=true`, and Re
read the current `event/event_option` state with three advertised actions and
no normalization diagnostics. No model or game mutation was used for this
verification. Inspection remains disabled for this candidate environment.

## Remaining Live Boundary

The only remaining live step is:

```bash
cd Re-SpireAgent
npm run agent:run
```

The preflight must report exact source/built/installed/loaded identity and an
exact Gateway-revalidated trial before DeepSeek is called. The highest-value
journey is a normal one-game run that naturally reaches shop/Kifuda or another
source-bound selector; unsupported rows remain honest stops.
