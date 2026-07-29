# Workflow C Architecture Cleanliness Reaudit And Closure Target

**Date:** 2026-07-30  
**Baseline:** `develop@6ad4fd921cd99c3b77c131e92ee93624ca3788b5`  
**Decision:** B - retain the Semantic Gateway two-plane macro architecture,
replace the mixed-generation contract/admission core, then finish vertical
family migration and deletion.

This report is the detailed current audit entry for Workflow C. It supersedes
the closure target in the 2026-07-29 Clean Closure audit where the two differ.
It does not turn source review, fixtures, a build, an installation, or one
completed run into Live qualification.

## 1. Evidence Baseline

### 1.1 Repository and deployment

The audit started before production edits with:

```text
remote                  https://github.com/rsgcsg/SpireAgent.git
remote default          origin/main
checkout/upstream       develop / origin/develop
HEAD                    6ad4fd921cd99c3b77c131e92ee93624ca3788b5
worktree                clean
main/develop merge-base a10e186d0a9c5515d9871dad9e32d4b693cb99b8
origin/main...develop   1 / 29

source protocol         2.0-preview.76
Re normalized schema    31
Prompt/guide baseline   global 4 / state guide 5
source/built/installed  SHA 56b24ea36a9ad95f15414cd7882ab2b6b32b9459aa47feb204d3290569de9003
                        MVID 37f4ce07-1ca7-4942-aec9-868b7d7d4676
loaded                  same SHA/MVID and protocol
runtime instance        8ccf81d0e53b467eb6bf46d86ddd86cc
game                    v0.109.1 / c8c577f6 / actual hash -820620422
Modset                  exact_bridge_only
Patch                   clean_known_owners / only com.sts2mcp
permission mode         migration_exploration
authority               volatile encounter trial; no applicable durable claim
rollback                STS2MCP/.local/deployments/2026-07-29T13-33-27-964Z
```

These are separate claims: source, built, installed, and loaded happen to
agree for Preview.76. That agreement does not prove a family mutation that did
not occur.

### 1.2 Latest exact-runtime run

`run-20260729140216-qi8r24` is the only recorded run at the audited Preview.76
source and loaded identity:

```text
source revision             6ad4fd921cd99c3b77c131e92ee93624ca3788b5
Prompt/guide                4 / 5
protocol/schema             2.0-preview.76 / 31
loaded MVID/runtime         37f4ce07...d7d4676 / 8ccf81d0...d86cc
provenance                  unrecorded
decisions                   172
executed_and_settled        170
safe pre-execution stale    1
completed boundary          1
termination                 completed_run_boundary
```

The stale refusal was `choose_treasure_relic`. Re compared a fresh state before
submission, found the selected action stale, did not call the Gateway, and
continued from a fresh observation. The last mutation closed game-over and
returned to main menu; the next main-menu observation stopped at `run_boundary`.
This is expected supervision, not a Connector failure.

The run exercised menu, character select, map, combat, event, card reward,
generated choice, reward, rest, treasure, shop card purchase/removal, deck
removal/upgrade, game-over, run-deck Inspection, and normal successor
supervision. It did **not** exercise:

- New Leaf deck transformation;
- Kifuda enchantment continuation;
- ordinary shop relic purchase;
- persistent qualification reload or rollback.

Therefore Preview.76 has a bounded complete-run coverage result, not Organic
qualification, not a durable claim, and not evidence for those three families.

### 1.3 Direct predecessor evidence

- `run-20260729112408-jltj8f` used Preview.75 and completed a 282-decision run.
  It includes one exact `purchase_shop_relic` completion and 23 safe stale
  refusals. This is positive evidence for that exact old runtime only.
- `run-20260729123227-o2htaa` used Preview.75 and selected New Leaf at Neow.
  The event command completed and opened `NDeckTransformSelectScreen`; the
  Gateway then failed closed because the selector had no exact New Leaf caller
  binding. This is the direct defect evidence that motivated Preview.76.
- `run-20260729123734-wtdpib` and `run-20260729124247-l1hwck` completed ordinary
  Preview.75 run boundaries without Connector failure.
- Kifuda did not naturally occur in these runs. `not exercised` is the only
  honest status.

All listed runs have `provenance=unrecorded`. They are useful defect and
coverage evidence, not Organic or persistent qualification evidence.

## 2. Reconstructed Current Lifecycle

The current production path is:

```text
Native STS2 state and active screens/tasks
  -> BridgeSnapshotBuilder and ordered Surface providers
  -> one resolved BridgeObservationDraft
  -> shared state, visibility, Inspection catalog and exact environment
  -> BridgeContractManifest.WithExplicitActionScopes
  -> persistent qualification overlay
  -> BridgePermissionManager session overlay
  -> BridgeSurfacePermission.FindActionScope
  -> BridgeBoundActionContract(source evidence + operands + contract digest)
  -> one RegisteredBridgeAction publication path
  -> execute-time state/action/scope/contract revalidation
  -> provider-owned native Commit and action-local completion probe
  -> command receipt and successor observation
  -> Re polling, repeatable successor readiness and run-boundary supervision
```

The live plane and control plane are not separate services. The Gateway owns
the final publication and execution decision. D tools, the qualification
ledger, Re, REST, and MCP cannot submit a native operation that the current
Gateway did not advertise.

## 3. Clean Structures To Retain

| Structure | Decision | Concrete failure prevented |
|---|---|---|
| Native STS2 owns rules and effects | retain | prevents Connector-side rule drift and RNG leakage |
| one active Surface owner | retain | prevents actions from a suspended parent and active child being mixed |
| opaque state-bound action | retain | prevents arbitrary index/click requests and stale operand reuse |
| publication plus execution revalidation | retain | rejects state drift during the model call, as seen in the treasure stale record |
| semantic identity separate from authority identity | retain | permission/lease changes cannot masquerade as visible game changes |
| action-local Outcome separate from Re readiness | retain | a completed native action may still have a changing successor screen |
| Inspection separate from mutation | retain | read-only deck/pile facts cannot create action authority |
| session trial separate from durable claim | retain | one volatile success cannot survive restart as qualification |
| source-specific semantics over shared mechanics | retain | New Leaf and Whispering Hollow share a selector but not caller identity |

These are not accidental duplication. Deleting them would break observed
invariants.

## 4. Principal Cleanliness Defect

The largest active defect is not Provider count. It is that one catalog type
currently represents two different authority meanings.

`BridgeOperationQualificationCatalog` loads seven reviewed rows from
`operation-qualification-contracts.json`, then synthesizes 80 rows from the
non-authorizing `BridgeContractManifest`. Both become
`BridgeOperationQualificationIdentity` and both expose a `ContractDigest`.

The meanings differ:

```text
explicit native contract
  reviewed owner + source + operands + native Commit + completion boundary

manifest migration fallback
  Surface/operation/mechanism labels + generic provider Commit/witness text
```

The code can ask `IsExplicitContract`, but the durable package type and store
do not require that answer. `BridgePersistentQualificationStore` validates a
package by matching the shared digest/boundary/witness object. Tests explicitly
prove that `event_option/choose_event_option` and `combat_turn/play_card`
fallback rows can become persistent authority after two runtime epochs.

This is a real structural defect even though no currently applicable package
uses it. A generic non-empty Gateway witness is useful for volatile trial
quarantine, but it is not a reviewed, stable native completion contract and
must not become durable authority.

## 5. Operation And Native Contract Verdict

### 5.1 Operation

Retain `operation` as:

- a player/developer-readable intent label;
- action and receipt telemetry;
- run/replay grouping;
- migration inventory and evidence search key;
- a temporary session-only fallback key until each family is dispositioned.

Remove it, family by family, from:

- final supported action admission;
- durable claim identity;
- cross-environment compatibility equivalence;
- native completion identity;
- rollback slots once claim schema migration is complete.

`operation authority usages = 0` is a closure destination, not a true current
metric.

### 5.2 Explicit native contract revision

An explicit native contract revision is necessary. Its minimum authority
meaning is:

```text
active owner binding
+ exact source binding
+ exact operand contract
+ native Commit adapter revision
+ action-local completion boundary and witness/oracle revision
+ risk/condition partition
```

It must not encode game effects, RNG, arbitrary workflow graphs, or a universal
selector/transaction DSL. The current seven explicit rows are valid migration
pilots, not proof that every synthesized fallback is a native contract.

### 5.3 Immediate type boundary

Every catalog projection must identify one of:

```text
explicit_native_contract
manifest_migration_fallback
```

Only `explicit_native_contract` may be assembled, loaded, applied, superseded,
rolled back, or reported as a durable qualification. A manifest fallback may
support a runtime-bound encounter trial while its family is migrated, but it
cannot survive restart as authority.

## 6. Mixed-Generation Families

| Family | Current authority generation | Verdict |
|---|---|---|
| main menu | both operations explicit | retain, later rename operation fingerprint to contract revision |
| map navigation | explicit | retain |
| shop room | `open_shop_inventory` explicit, `proceed_shop` fallback | mixed; migrate as one vertical navigation family |
| shop inventory | relic purchase explicit, card/potion/removal/close fallback | mixed; keep purpose contracts separate, migrate shared merchant mechanics only |
| treasure | chest open explicit, result actions fallback | mixed; use `TreasureLifecycleFacts`, do not invent reward-exists assumptions |
| deck enchant | confirm explicit, preview/toggle/cancel/close fallback | mixed; Kifuda is a separate natural evidence gate |
| deck transform | source-specific Provider is modern, authority rows fallback | mixed; Preview.76 New Leaf source fix awaits exact mutation evidence |
| combat pile | reviewed source/transaction registries, fallback authority | mixed; migrate existing concrete topologies, not a universal pile selector |
| ordinary combat | exact actions and strong runtime evidence, fallback authority | mixed; high-value migration wave after the durable boundary fix |
| generated choices | purpose/source-specific providers, fallback authority | mixed; unknown source remains typed unsupported |
| reward/rest/selectors | purpose-specific providers, fallback authority | migration debt, not automatic contract candidates |

The repeated pattern is “modern local legality and Outcome behind legacy
control-plane identity.” It is not a reason to discard proven Providers. It is
a reason to migrate their admission identity and delete fallback synthesis per
family.

## 7. Other Control-Plane Overlap

| Structure | Verdict |
|---|---|
| `BridgeContractManifest` | retain as derived capability/inventory source; stop generating durable contract meaning from it |
| exact-environment policy | retain as environment ceiling, not family semantic proof |
| `BridgePermissionManager` | temporary migration debt; split policy projection from ledger/history only after family keys converge |
| persistent store | retain ledger/revoke/rollback; narrow package applicability to explicit contracts |
| `CompatibilityAssessment` | simplify later; it currently mixes observation readiness, coarse Surface summaries and action scopes |
| four permission modes | evidence insufficient for immediate removal; measure use, then reduce after migration mode is no longer needed |
| Surface support summaries | retain as derived diagnostics only; never use as final operation admission |
| operation catalog | replace as authority catalog; retain a derived operation inventory for human/tooling use |

There is one final action publication path, but more than one stage contributes
candidate scopes before `BridgeSurfacePermission.FindActionScope` resolves the
current action. This is acceptable during migration only if the final resolver
is unique and the inputs have disjoint meanings. Today the fallback/explicit
identity collision violates that condition.

## 8. Human Comprehensibility

A new engineer can currently find the live action path, but cannot answer
“why is this action durable-authorized?” from one type because:

- `operation_fingerprint` can mean an explicit contract digest or a manifest
  fallback digest;
- `BridgeBoundActionContract` may contain either meaning;
- `BridgeOperationQualificationIdentityInfo` does not expose which meaning;
- the ledger CLI can assemble fallback packages;
- current ADRs describe operation retirement while production code still
  keys session grants, package slots, quarantine and rollback by operation.

The target is one canonical lifecycle with explicit transitional labels, not
renaming the ambiguity. The protocol and Operator CLI must expose the contract
kind, and machine checks must make fallback durable authority impossible.

## 9. Adaptation Stress Tests

### New Leaf

The Preview.75 failure was a missing source binding, not a need for a universal
selector. Preview.76 correctly reuses selector facts/commit mechanics while
requiring either the exact Whispering Hollow caller or the task-local New Leaf
caller. Unknown or concurrent callers fail closed. This validates the target
pattern:

```text
shared powerless mechanics + exact source contract + purpose-specific Outcome
```

The implementation is loaded, but the New Leaf mutation is pending exact
runtime evidence.

### Kifuda

The shop purchase owns only the exact native purchase Commit. If Kifuda opens
an enchantment child, fresh observation owns the child decision. No current
evidence requires a general `PendingObligation`; Kifuda is still `not
exercised` on Preview.76.

### New unknown family

The required classification order is:

1. evidence gap;
2. local implementation bug;
3. unmigrated known family;
4. shared powerless mechanics gap;
5. authority/control-plane migration debt;
6. macro architecture defect.

Only repeated cross-layer exceptions, multiple authority paths, Re-side game
rules, or inability to express exact owner/source/Commit/Outcome justify a
macro revision.

## 10. Canonical Architecture Decision

**Verdict B:** the Semantic Gateway two-plane macro architecture remains the
single target, but the contract/admission core must be replaced through a
vertical strangler migration.

```text
Native STS2
  -> coherent player-visible Observation
  -> one active semantic Surface/owner
  -> exact explicit NativeActionContractRevision
  -> opaque BoundAction with source/operands/state
  -> one AuthorityResolver
  -> execute-time revalidation
  -> native Commit
  -> action-local Outcome/receipt
  -> fresh successor Observation
  -> Re transition supervision

Control plane
  environment ceiling + session trial + evidence + durable explicit claim
  quarantine/revoke/rollback
  never publishes or executes an action itself
```

The current `BridgeOperationQualificationCatalog` is a migration component,
not the target authority model. It may remain temporarily only while every
fallback family has an explicit disposition.

## 11. Revised Clean Closure Contract

Workflow C Clean Closure means:

- ordinary vanilla single-player can usually complete or stop at a typed,
  exact boundary;
- supported families use explicit native contract revisions only;
- unknown families are `typed unsupported`, `code_required`,
  `evidence_pending`, or `out_of_scope`;
- there is one production publication path and one current authority resolver;
- no fallback can become a durable claim;
- no supported family mixes explicit and fallback authority;
- operation does not determine final supported admission, durable claim,
  quarantine, completion or rollback identity;
- source/build/install/load, canary, journey, Organic and durable evidence stay
  separately reported;
- current docs are sufficient without reconstructing history from preview
  closeouts.

## 12. Migration Sequence

### C-A: type and durable boundary

1. expose explicit versus fallback contract kind in Gateway and Re evidence;
2. reject fallback packages in the Operator CLI and Gateway store;
3. add wrong-kind, corruption, reload and applicability tests;
4. keep fallback session trials unchanged to avoid an unproved authority
   cutover;
5. update machine inventory and protocol.

**Rollback:** whole DLL plus protocol consumer restore. No live package data is
rewritten.

### C-B: family waves

For each family:

```text
source/owner audit
-> explicit contract revision
-> exact publication/execution parity
-> native Commit and Outcome
-> positive/negative fixtures
-> exact-runtime evidence
-> switch authority
-> delete fallback and duplicate path
-> update inventory
```

Recommended order after C-A: ordinary combat, combat pile, complete deck
enchant, deck transform, generated choices, then remaining shop/treasure/
reward/rest/selectors. Runtime blockers may reorder the list.

### C-C: authority convergence

- migrate claim/quarantine/rollback slots from environment+Surface+operation
  to environment+contract revision;
- make the manifest a derived inventory only;
- split overloaded readiness summaries from executable scopes;
- reduce permission modes when evidence shows which modes remain useful;
- delete fallback synthesis after every row has a disposition.

### C-D: acceptance

- wrong environment/Patch/Modset/source/owner tests;
- stale, witness mismatch, timeout and unknown tests;
- claim reload/revoke/supersede/rollback tests;
- fresh and resumed Inspection-enabled journeys;
- exact-runtime New Leaf and Kifuda gates when naturally available;
- machine-checked deletion metrics.

## 13. Machine Closure Metrics

Target:

```text
connector shadow count                              0
permanent dual-read paths                           0
production action publication paths                 1
production authority resolver count                 1
operation authority usages                          0
fallback authority contracts in supported envelope  0
persistent claims on fallback contracts              impossible
bulk candidate startup paths                        0
Re native-completion reconstruction                 0
control-history semantic identity inputs            0
supported mixed explicit/fallback families          0
```

At the audit baseline the known source metrics are seven explicit contracts,
80 manifest fallbacks, four mixed explicit/fallback Surfaces, one publication
path, no identity shadow, no permanent dual-read, and a durable store that
still accepts fallback. That is not Clean Closure.

## 14. Alternatives Rejected

- **Keep fallback durable qualification because it has two runs.** Rejected:
  repetition cannot supply missing owner/Commit/Outcome semantics.
- **Delete every fallback immediately.** Rejected: it would remove proven
  ordinary-run capability before equivalent explicit contracts exist.
- **Universal selector/transaction/effect graph.** Rejected: shared UI does not
  prove shared purpose, source, legality or Outcome.
- **Move completion to Re.** Rejected: it would create a second game model and
  make transport clients disagree.
- **Make manifest rows native contracts.** Rejected: naming a mechanism is not
  a reviewed source/Commit/witness contract.
- **Big-bang Provider rewrite.** Rejected: existing local Providers contain
  substantial exact-game evidence; the defect is primarily admission identity
  and mixed generation.

## 15. Historical Review

ADR-0002 correctly established the macro planes and already said operation is
not the long-term compatibility identity. ADR-0003 correctly required operation
retirement. ADR-0004 added useful session/durable separation but allowed the
operation-centric store to become broader than the target. ADR-0005 correctly
required vertical migration and deletion, but did not make fallback durable
claims impossible.

Preview archives repeatedly rejected universal selectors, low-level click
APIs, automatic authority from manifests and UI-shape inference. Those
decisions remain valid. The active fallback synthesis is not the return of a
universal click API, but it contradicts the older rule that manifest presence
cannot create durable semantic authority.

The original P8-P15 runtime is archived and was searched only for relevant
historical authority/transaction language. It is not current Connector truth.
The complete historical conversation stream was not available as a
machine-readable source in this audit; claims not represented by repository
history, runs, or the supplied audit are marked `unavailable source` rather
than reconstructed from memory.

## 16. Non-Claims

- Preview.76 New Leaf mutation: `pending exact-runtime evidence`.
- Preview.76 Kifuda continuation: `not exercised`.
- Preview.76 shop relic purchase: `not exercised`; Preview.75 has bounded old
  runtime evidence only.
- latest run provenance: `unrecorded`, not Organic.
- persistent qualification of any ordinary-run family: `non-claim`.
- cross-version and cross-Mod semantic compatibility: `non-claim` beyond exact
  environment diagnostics and tests.
- complete player-visible information for every STS2 screen: `non-claim`.
- Workflow C Clean Closure: not complete at this audit baseline.

## 17. Immediate Executable Slice

The first implementation slice after this report is deliberately narrow:

1. add a required contract-kind discriminator to the qualification catalog
   projection;
2. require `explicit_native_contract` for every durable package in both the
   C# store and Operator CLI;
3. preserve current volatile fallback trial behavior;
4. add C#, Re and CLI negative tests;
5. bump the strict wire protocol and update current truth;
6. build, back up and install; loaded identity remains a non-claim until a
   full restart.

This closes a proved structural hole without pretending that the 80 remaining
families have already been migrated.

## 18. Implemented Slice And Verification

The C-A boundary was implemented as Preview.77:

- catalog and wire distinguish `explicit_native_contract` from
  `manifest_migration_fallback`;
- contract kind enters digest and exact evidence environment;
- C# store, Re cross-object validation and operator ledger reject fallback
  durable qualification;
- migration planning emits `code_required` instead of packaging fallback;
- volatile encounter trial remains unchanged;
- machine inventory records three remaining operation-authority branches, four
  mixed Surfaces and zero persistent fallback claim admission paths.

Executed verification:

```text
Gateway tests                 197/197 pass
Re tests                      212/212 pass; typecheck/build pass
compatibility fixtures        6 pass, non-authorizing
permission fixtures           4 pass, non-authorizing
qualification/profile/
migration fixtures            pass
exact assembly audit          reviewed bindings match; Tutor remains code_required
documentation/link/inventory  pass
Release build                 0 warnings, 0 errors
```

Deployment truth:

```text
source/built/installed protocol 2.0-preview.77
source/built/installed SHA      9d6737b1e34e15b59f4d2d2bad8a239f21d771b0eef25ffedccb8048417edf8d
source/built/installed MVID     0a945d2d-0787-4f6d-a820-4947936aa6be
rollback                       STS2MCP/.local/deployments/2026-07-29T14-45-17-887Z
loaded                         non-claim; game closed after installation
```

No Preview.77 mutation, Inspection, bounded journey, Organic evidence or
qualification is claimed. The next executable boundary is a complete game
restart followed by `cd Re-SpireAgent && npm run agent:run`.
