# Bridge v2 DecisionFrame And Transaction IR Architecture Audit Closeout

Date: 2026-07-20
Repository baseline: `develop@ec8c84a976ab25ada65133a56ad39ed95eb08c3d`
Protocol in source: `2.0-preview.54`
Scope: documentation and independent architecture audit only

## Executive Verdict

The current Bridge v2 safety kernel is worth preserving. The present
Provider-centric implementation is not.

The correct next architecture is not a universal Surface or executable Effect
DSL. It is a gradual internal split:

```text
Exact Environment And Evidence Scope
  -> One Input Owner Resolver
  -> Typed UI Mechanism Adapter
  -> Attested DecisionFrame
  -> Closed, Non-Executable Transaction IR
  -> Strategy Semantic Projection (read-only)
  -> Shared Validation Result
  -> Game-Owned Commit Adapter
  -> Witness Obligation Plan
  -> Idempotent Command Ledger
```

This design is sufficient only with three corrections to the two input audit
documents:

1. Transaction IR describes the game's transaction and proof obligations. It
   never gives Bridge permission to replay damage, block, movement, rewards,
   hooks, methods, reflection, or scripts.
2. Semantic provenance may be optional, but trustworthy task/command/
   continuation attestation is not. A registry or Mod cannot attest itself.
3. Witness compilation produces a conservative obligation plan. It cannot
   prove an open Mutation Domain or replace a purpose-specific witness when
   hooks and asynchronous effects are not closed.

The strongest current risk is not raw schema duplication. It is orphaned
transaction semantics across parent and child Surfaces: one command can finish
when a child opens, while the child proves only its local mutation and not all
remaining source-transaction effects.

## Inputs And Evidence Classes

The two external documents were read as design inputs:

- `BRIDGE_V2_SURFACE_DECISION_FRAME_ARCHITECTURE_AUDIT_2026-07-20.md`;
- `BRIDGE_V2_ENCHANTMENT_EFFECT_IR_ARCHITECTURE_AUDIT_2026-07-20.md`.

They are not repository truth. This closeout distinguishes evidence as follows.

| Class | What was inspected | What it can prove |
|---|---|---|
| Direct current-code verification | Bridge resolver, permissions, manifest/shadow, Providers, runtime ledger, wire DTOs, Re decoder/normalizer/action import, and tests at the pinned HEAD | Current implementation and static contracts |
| Direct local STS2 source verification | Targeted `ilspycmd` decompilation of the locally installed `sts2.dll`, SHA-256 `ee45848ff6319dfc7af2538d3a52d05d82bef35ee4c5fd0400dc9efe8f9054aa` | Exact local assembly behavior only |
| Repository source-audit record | Preview.38/.42/.44/.45/.47/.49/.52/.53/.54 closeouts and protocol records | What those reports audited on their recorded exact identities; not an independent re-decompilation |
| Runtime/Organic record | Canonical closeouts plus available Re run metadata/snapshots | Only the recorded MVID, runtime, game identity, provenance, and journey |
| Documentation claim | Current status, coverage, ADRs, architecture reviews, and protocol prose | Intended contract; it may be contradicted by code or runtime |
| Inference | Conclusions joining the evidence above | Architecture recommendation, not qualification |

No external web source was needed. The installed game assembly and repository
records were sufficient for this architecture audit.

## Repository And Environment Identity

### Repository

- local HEAD and `origin/develop` both resolve to
  `ec8c84a976ab25ada65133a56ad39ed95eb08c3d`;
- one pre-existing non-document worktree change was present in
  `Re-SpireAgent/test/bridge-v2.test.ts` before this audit and was not modified;
- this audit changes documentation only.

### Last canonical source-target evidence

The preview.54 closeout records:

```text
game: v0.109.0|c12f634d|-840572606
DLL SHA-256: 7bf3abca5f20594077b31f8e400ef0b27643353846256cb59cb633418a59a8b3
MVID: 67b8d32b-8c0c-4514-9df7-fac4ac5fb738
runtime: db112bc183354e9eb397f6c76121f484
Modset fingerprint: 8371ef20e96178fc38ae2427a749815e13a37747aef58d2d4c48e0a10b3d036b
```

This is repository runtime evidence. It was not reloaded or reverified during
this docs-only audit.

### Audit-time local environment

At audit time, `release_info.json` and the installed game report the different
exact identity:

```text
game: v0.109.0|c12f634d|1833084275
installed game DLL SHA-256: ee45848ff6319dfc7af2538d3a52d05d82bef35ee4c5fd0400dc9efe8f9054aa
installed Bridge DLL SHA-256: 236b5f8190b2d2dab7b9fe0ebffe893dc36f55e543472aa5274ff8d3469d82ae
installed Bridge MVID: 0d002485-dc76-4641-8ade-578bef39ee69
```

Available run `run-20260720065514-b80q0v` records that MVID, runtime
`b5b3aa0a2eff44e99cdcbb73c0beb3ef`, Modset fingerprint
`a9e24cce4ad1f16ea97b6be5aad9994c4fdbcfa6c963b81262bed3bb11d200fd`,
and only three action canaries: `event_option`, `event_card_acquisition`, and
`map_navigation`. Its map action settled and its successor `combat_turn` failed
closed as unqualified. Provenance is `unrecorded`, so this is coverage and
identity evidence, not qualification.

Before validation, the pre-existing Release artifact differed from the
installed DLL:

```text
Release SHA-256: 505e9db42b79edc52fd7fd2aead6145a255e47dea54f3a07059b781e1b84dbe6
Release MVID: 547842a2-27d4-4c5d-8188-ca1d525d7e98
```

The Release build performed by the Bridge test command later regenerated SHA
`236b5f8190b2d2dab7b9fe0ebffe893dc36f55e543472aa5274ff8d3469d82ae`, MVID
`0d002485-dc76-4641-8ade-578bef39ee69`. It is byte-identical to the
already-installed DLL; no file was installed by this audit. The Bridge endpoint
remained unavailable, so current process load is not claimed. The available run
is retained as historical exact-module evidence only.

## Current Architecture Findings

### Verified strengths

1. **One action owner is enforced.** `ActiveSurfaceResolver` returns a draft
   only for one matched Provider; ambiguity produces no action authority.
2. **Actions are opaque and state-bound.** Re imports Bridge legal actions as
   action IDs and expected state IDs; it does not rebuild Bridge commands from
   indices or source literals.
3. **Submission is revalidated.** The ledger observes the current state,
   verifies the registered action belongs to it, and invokes the Provider's
   execute-time checks before mutation.
4. **The command lifecycle is idempotent.** Reused request IDs with the same
   payload return one ledger entry; conflicting reuse is rejected.
5. **Unknown outcome is preserved.** Failed completion probes and timeouts are
   `unknown`; Re tests explicitly reject retry semantics.
6. **Inspection is independent.** Permission uses explicit qualified/canary
   lists, reads are state-bound, and Inspection does not enter the ledger or
   create action authority.
7. **Empty permission scopes fail closed.** Surface and Inspection permission
   share `BridgeSurfacePermission`; no empty-list wildcard remains.
8. **Hidden information is intentionally excluded.** Draw order, RNG, future
   choices, and unknown hover forms are not silently projected.

### Verified structural debt

1. Providers own too much: owner recognition, source inference, projection,
   legal-action construction, execute checks, Commit invocation, Completion,
   diagnostics, and evidence strings.
2. Publication and execution use some common game predicates, but there is no
   general typed validation result. Shop, transform, enchantment, and generated
   choice Providers repeat overlapping business conditions in build and start
   methods.
3. `BridgeContractManifest` is static, manually duplicated, and explicitly
   non-authorizing. It detects inventory drift but does not prove runtime
   semantic binding.
4. Re has handwritten Surface/source discriminated unions, action-kind sets,
   context cross-checks, normalizers, and fixtures. New generated sources and
   pile destinations currently require changes on both sides.
5. Completion is a collection of Provider-local closures. Common witness facts
   exist, but transaction-wide Mutation Domains and parent/child obligation
   ownership do not.
6. Current source-target authority is exact environment plus Surface kind.
   Per-operation and per-origin evidence is descriptive and cannot narrow the
   gate at runtime.

### Enchantment authority discrepancy

Current Canonical prose and manifest metadata describe
`deck_enchant_selection` as Self-Help Book scoped. Direct code inspection shows
that `DeckEnchantSurfaceProvider.TryBuild` matches any current
`NDeckEnchantSelectScreen`; it has no runtime source/task binding. On the
`-840572606` permission profile, `deck_enchant_selection` is a Surface-level
canary, so manifest source text is not an enforced origin restriction.

This does not prove that every native origin is unsafe. The Provider reads the
exact visible enchantment, amount, candidates, and selected card instances, and
its confirm witness verifies the exact card enchantment post-state. It does
prove that documentation and runtime authority use different qualification
units.

The local `1833084275` source contains many native enchant-selection callers,
including Self-Help Book, Symbiote, Waterlogged Scriptorium, Stone of All Time,
and multiple relics. One adversarial example, `PaelsGrowth`, passes amount `1`
to the selection UI but later applies `Clone` amount `4`. The current Provider
would expect the UI amount in its witness. Because `deck_enchant_selection` is
disabled on `1833084275`, this is not a current local execution defect. It is a
directly verified counterexample to the assumption that UI presentation alone
is always authoritative for the later Commit.

### Parent/child transaction gap

Current event-option Completion may succeed when a required child Surface
opens. A child Provider then proves its local business mutation. Neither layer
owns an explicit list of the source transaction's remaining obligations.

The locally verified `WhisperingHollow.Hug` performs:

```text
choose exact deck card
-> transform it randomly
-> lose HP
-> finish event
```

The current transform child witness proves original-instance absence and
preserved deck count. The parent event option may already be complete because
the child opened. This is not proof of a known bad Organic outcome on the
source-qualified build. It is proof that the architecture cannot state which
command owns the later HP-loss obligation.

## Fundamental Invariants

The following are derived from failure modes, not current class boundaries, and
must remain unchanged:

| Invariant | Judgment |
|---|---|
| one current input owner | fundamental |
| player-visible information boundary | fundamental |
| opaque, state-bound actions | fundamental |
| exact operand/entity binding | fundamental |
| publication/execution legality parity | fundamental |
| execute-time owner, operand, and legality revalidation | fundamental |
| game-owned Commit path | fundamental |
| idempotent command lifecycle | fundamental |
| unknown outcomes are not retried | fundamental |
| semantic post-state Witness | fundamental |
| hidden RNG and private future state excluded | fundamental |
| unknown/ambiguous/incomplete contracts fail closed | fundamental |
| exact environment and evidence scope | fundamental |
| rollback and non-authorizing shadow comparison | fundamental |
| Inspection is read-only and outside the ledger | fundamental |

No inspected evidence supports weakening any of these.

## Historical Constraints That Are Not Fundamental

The following may be replaced:

- one Provider class per semantic purpose;
- one Surface kind per content origin;
- source type/name as a mandatory wire discriminator;
- manually repeated C# and TypeScript source literals;
- Surface-kind authority as the final qualification unit;
- one handwritten Completion closure per operation;
- exact-build lists as the only requalification aid;
- protocol version changes for content-only IDs or parameter values;
- a requirement that all missing fields invalidate observation rather than only
  missing action-critical fields invalidating authority.

Replacing these constraints is valid only if the hard shell remains intact.

## Target Architecture

### UI Mechanism Adapter

Reads and operates one bounded game UI mechanic: candidates, selected set,
bounds, stage, controls, owner, and exact runtime identities. It has no purpose,
effect, evidence tier, or authority.

### DecisionFrame

A DecisionFrame is the complete current decision boundary:

```text
frame_id
state_id
input_owner
mechanism_id
transaction_token / continuation_token
phase
visible operands
selection constraints
legal operations
hidden and unavailable facts
transaction declaration reference
commit adapter reference
witness obligation reference
```

The transaction token is produced or attested by a qualified game binding. A
content registry, prompt, node name, or Mod declaration cannot manufacture it.

### Closed Transaction IR

Transaction IR is a finite, typed declaration. Its primitives may describe:

- exact entity selection;
- movement between typed zones and positions;
- apply/remove/upgrade/enchant/transform;
- cost/resource/status/HP/block deltas;
- generated entities and bounded overflow;
- bounded alternatives, conditionals, and child decisions;
- parent/child phase boundaries and already-applied effects.

Every primitive declares operand types, Mutation Domain, hidden policy, and
witness obligations. The IR has no arbitrary method name, reflection target,
script, raw node path, or unbounded loop.

Bridge does not execute this graph. A qualified Commit adapter invokes the
current game-owned task/UI command once. The graph lets Bridge and Re understand
what that command is expected to finish and what must be observed afterward.

### Shared Validator

Observation produces a typed validation result containing exact owner,
operands, constraints, controls, and expected transaction identity. Legal
actions compile from that result. Execution re-runs the same validator and
requires identity-equivalent output before invoking Commit.

### Witness Obligation Plan

Known primitives compile to conservative observation obligations. Plans may use
exact presence/absence, collection/cardinality delta, zone/position, attribute
delta, currency/resource delta, owner change, room change, control consumption,
and bounded child completion.

A plan is rejected when:

- the Mutation Domain is incomplete;
- a declared side effect has no observer;
- an observer would require hidden information;
- hooks or asynchronous behavior make the domain open;
- obligation ownership is ambiguous across parent and child frames.

A purpose-specific witness remains a legitimate implementation when a closed
plan cannot be proven. `page_closed` is never a sufficient business witness by
itself.

### Strategy Semantic Projection

Executable application semantics and future strategic semantics are separate.

For enchantment application, execution needs exact card, enchantment ID,
amount, eligibility, game Commit, and post-state. Strategy may additionally
need a read-only behavior graph explaining future triggers and effects. A new
enchantment can therefore be safely applicable while its future strategy model
is partial, provided the visible text is complete and no missing behavior
changes current legality or completion.

Strategy IR never grants action authority. Unknown trigger/effect primitives
degrade strategy understanding and remain visible as unknown; they do not
become executable reflection.

### Evidence And Authority

Authority should eventually narrow to:

```text
exact environment
+ mechanism adapter revision
+ transaction extractor/attestation revision
+ Commit adapter revision
+ witness-plan revision
+ operation/contract instance
+ evidence tier
```

Registry presence, source similarity, source text, or old qualification cannot
raise this tier. A shadow instance remains `authorizing=false` until a separate
authority policy explicitly permits the exact tuple.

## Provenance Versus Binding

| Situation | Provenance requirement |
|---|---|
| complete transaction attested by a qualified game task/command token | source name may be optional; binding is still mandatory |
| origin changes eligibility, hidden policy, Commit, side effects, or Witness | origin/provenance is required as part of binding |
| same task/transaction exposed through multiple UI adapters | provenance may be audit metadata; task binding is stronger |
| known source but incomplete transaction | reject; provenance cannot fill missing semantics |
| complete registry declaration supplied only by a Mod | observation/strategy only; it cannot self-authorize |
| source unknown but mechanism and operands visible | mechanism observation may continue; action authority is denied unless a qualified transaction attestation exists |

## Positive Holdout Examples

These examples test frozen abstractions. They must not add card/source-specific
branches to Bridge/Re core.

| Holdout | Why automatic support is valid | Handling abstraction | Permitted changes | Required Witness and checks |
|---|---|---|---|---|
| New enchantment ID or amount using the existing enchant mechanism | ID/amount are typed data when the game transaction attests that the displayed application equals Commit | enchant DecisionFrame + `apply_enchantment` transaction primitive + native Commit adapter | registry data, fixture, exact-build evidence; zero Bridge/Re core | exact card binding, `CanEnchant`, applied ID/amount, transaction completion; reject UI/Commit amount mismatch |
| Enchantment future behavior composed from known triggers/effects | strategy semantics are a read-only composition of known primitives | Strategy Semantic Projection, separate from application authority | behavior registry and fixtures; no execution/core change | schema exhaustiveness and visible-text agreement; no command witness because it grants no authority |
| New Splash-like generator with a different pool or candidate count | pool/count parameterize the same attested choose/generated-card transaction | generated-choice mechanism + typed generation/choice/move/cost transaction | registry, fixtures, evidence; no core/source literal | exact offered references, bounded count, source task completion, selected reference in destination, cost/overflow obligations |
| `deal_damage -> choose card -> move card` | local source directly shows Headbutt/Graveblast apply damage before child choice; the frame can mark damage already applied and own only pending choice/move | transaction phases + combat-pile mechanism + typed move | transaction data/fixture/evidence; no core | exact selected card leaves source and reaches typed destination/position; do not replay or re-witness already-applied damage |
| `gain_block -> choose card -> move card` | local source directly shows Hologram/Cosmic Indifference with the same phase shape but different move destinations | same phase model and move primitive; different data | registry, fixtures, evidence; no core | exact card movement and destination position; block is marked already applied, not Bridge-executed |
| generated choice followed by `free_this_turn`, movement, overflow, and `lose_hp` | all effects are known bounded primitives and the game Commit owns the sequence | generated-choice DecisionFrame + sequence obligations + bounded overflow | registry/fixtures/evidence; no core | exact chosen reference, temporary cost marker, one destination or declared overflow, exact HP delta, source task completion |
| New source/destination/position combinations | combinations are typed parameters when the adapter declares support and constraints are satisfiable | typed zone/position operands and refinement validation | data/fixtures/evidence; adapter code only for a genuinely new game mechanism | source absence/presence, destination presence/position, cardinality and overflow; invalid pair rejects without combination whitelist branches |
| Random transformation with different typed parameters | current local source has one-, two-, and dynamic-count native callers of the same transform command | bounded deck-selection mechanism + `transform_random(count, preview_policy)` | registry/fixtures/evidence; no core | exact originals absent, deck cardinality preserved, count exact; RNG/replacement remains hidden until committed |
| Purchase followed by one or more child rewards | Orrery proves a game-owned purchase may suspend on a bounded child reward workflow | purchase transaction + continuation token + child DecisionFrames | transaction/registry data, fixtures, current-build evidence; no core if adapters already exist | exact product/gold/offer post-state, exactly-once child correlation, all required children resolved; parent task failure cannot be washed into success |
| Same semantic operation through a different UI adapter | semantics and proof obligations are independent of presentation | new Mechanism Adapter feeding the same DecisionFrame/transaction contract | adapter package code, adapter fixtures, evidence; zero Bridge/Re core and no new primitive | same owner/operand/legality/Commit/Witness shadow result as old adapter |
| Same UI mechanism driving removal, enchantment, transformation, or movement | mechanics are shared while effects remain separate transaction declarations | one bounded selection adapter plus independent typed transactions | contract data/fixtures/evidence; no universal effect branch | operation-specific eligibility, exact Commit, complete Mutation Domain, and operation-specific witness plan |

`PaelsGrowth` is an adversarial holdout for the first row: the local assembly's
selection presentation amount and later applied amount differ. A good extractor
must reject or represent that distinction; it must not assume UI parameters are
the Commit transaction.

## Rejection Holdouts

| Rejection | Why it fails | Rejecting abstraction | Allowed follow-up | Required safety behavior |
|---|---|---|---|---|
| Same UI shape, unknown semantics | mechanism does not prove purpose, Commit, or Mutation Domain | DecisionFrame attestation | add source/task audit and transaction fixture | observation may continue; actions empty |
| Known source, incomplete transaction | a source name cannot prove omitted effects | transaction completeness validator | complete source audit and transaction declaration | Fail Closed |
| Unknown primitive | core cannot validate or witness its semantics | closed IR decoder | implement/review primitive plus negative tests and evidence | reject whole executable frame |
| Unbound operand | mutation could target the wrong entity | exact operand binder | obtain a stable visible entity/task binding | reject before publication |
| Incomplete Mutation Domain | undeclared side effects may invalidate completion | transaction-domain validator | source audit, hooks audit, or purpose-specific contract | no action authority |
| Missing Witness for a declared effect | success could be reported without business consequence | WitnessPlan compiler | add observable witness or mark outcome unprovable | reject contract or time out unknown after a safely started legacy command; never claim success |
| Page closure as business completion | UI lifecycle is not semantic result | witness-strength validator | add exact post-state/owner-change witness appropriate to purpose | closure alone cannot complete |
| Hidden RNG used as legality or strategy truth | reveals or guesses unavailable future state | visibility policy + strategy projection | expose only player-visible distribution/text where legitimate | omit hidden value; no inferred action |
| Arbitrary reflection/method/script execution | breaks closed semantics and game-owned Commit | IR schema and Commit adapter registry | add a reviewed typed primitive/adapter if genuinely needed | reject payload |
| Mod-declared contract grants itself authority | declaration is not independent attestation | evidence/authority policy | observation-only registry plus independent adapter/source audit | `authorizing=false` |
| Authority inherited across builds | old evidence does not prove current code/runtime | exact-environment authority | targeted requalification and current-MVID evidence | new build starts disabled/canary only by explicit policy |
| Unbounded control flow | cannot bound effects, time, or witness obligations | closed IR control-flow validator | replace with finite count/budget and game-owned task semantics | reject frame |

## Anti-Overfitting Gate

Before implementing the pilot, freeze:

1. DecisionFrame fields and phase semantics;
2. the first closed primitive set;
3. Commit adapter interface;
4. witness-obligation rules;
5. authority inputs;
6. hidden-information rules;
7. test fixtures for known examples.

Then evaluate unseen holdouts. Passing requires:

- a content-only composition of known mechanisms, primitives, adapters, and
  witness rules produces no handwritten Bridge/Re core diff;
- no `if card == X`, source-kind switch expansion, new Surface variant, or
  approved full-combination whitelist is added;
- only registry data, fixtures, and exact evidence change;
- unknown primitives, operands, domains, and witnesses fail closed;
- generated actions and witnesses shadow-match or narrow the old Provider.

A new mechanism, primitive, Commit adapter, or structural schema may require
code. That is architecture evolution, not a failed content holdout.

## A/B/C/D Judgment

| Level | Decision |
|---|---|
| A: keep independent | Keep unique UI ownership, game Commit adapters, and manual witnesses where domains are not closed |
| B: permissionless helper | Continue typed visible-card, bounded-selection, identity, and witness-fact helpers |
| C: typed shared component | Pilot DecisionFrame, closed Transaction IR, shared validation, and WitnessPlan for generated-card and combat-pile families |
| D: structural protocol change | Defer until the shadow pilot and holdouts pass; then replace content/source literals with structural typed data without widening authority |

## Rejected Alternatives

- Keep adding one Provider/source literal per content item: safe in the small,
  but it fossilizes content into Bridge/Re core and leaves transaction-wide
  witness ownership implicit.
- Universal selector Surface: shares UI shape but erases purpose and Commit.
- Executable Effect DSL: duplicates game logic and can double-apply effects.
- Full source-name whitelist as final architecture: provenance is sometimes
  weaker than an exact task/transaction token and causes content churn.
- Source-free registry authority: declarations cannot attest themselves.
- Fully automatic Witness compiler: unsafe for hooks, async continuation, and
  open Mutation Domains.
- Compatibility fingerprint inheritance: useful for impact analysis only; not
  proof of unchanged semantics.

## Migration And Rollback Gates

### Phase 0: Correct governance facts

- describe source-target loaded identity as last verified evidence, not current
  live state;
- record the audit-time alternate exact build separately;
- make the deck-enchant Surface-level/source-binding mismatch explicit;
- make no permission change in this docs-only task.

Rollback: documentation-only revert.

### Phase 1: Machine-check the current model

- add manifest/Provider/Re operation exhaustiveness and uniqueness checks;
- record transaction, Commit, witness, Mutation Domain, and evidence IDs in a
  non-authorizing inventory;
- identify parent/child orphan obligations.

Gate: zero runtime behavior and authority change.

### Phase 2: Non-authorizing DecisionFrame shadow

- shadow generated combat choices and combat pile choices;
- include phase and task/continuation identity;
- compare owner, actions, operands, legality, hidden fields, and failure modes.

Gate: old and new must match or new must be narrower for fixtures and Organic
replays. Any unexplained difference disables the shadow result.

### Phase 3: Transaction/WitnessPlan shadow

- add the minimal primitive set needed by the two pilot families;
- run positive holdouts and every rejection holdout;
- keep old Provider Commit and Completion authoritative.

Gate: zero content-specific core branches; no declared effect lacks an owned
witness obligation.

### Phase 4: Enchantment adversarial pilot

- treat application semantics and future behavior semantics separately;
- include Self-Help Book plus UI/Commit mismatch cases such as PaelsGrowth as
  negative holdouts;
- verify parent/child transaction obligations, not only exact enchantment
  post-state.

Gate: no source-target permission expansion; mismatch remains fail closed.

### Phase 5: Structural Re projection

- decode one structural DecisionFrame/IR schema;
- preserve generic opaque Bridge action import;
- generate/golden-test structural schema parity;
- expose Strategy Semantic Projection independently.

Gate: old Re and new Re choose from the same opaque actions in shadow.

### Phase 6: Authority narrowing

- allow operation/contract-instance authority to suppress existing Surface
  canaries first;
- do not let the new system add an action unavailable under the old gate;
- require explicit exact-build policy and current-MVID canary for any later
  promotion.

Rollback: turn off new authorizer and restore the prior Surface gate. The old
Provider path remains compiled and observable through the migration.

### Phase 7: Family migration and retirement

- migrate one evidenced family at a time;
- retain old/new replay and shadow comparison until Organic qualification;
- remove a source-specific path only after the structural path proves the same
  game-owned Commit and equal-or-stronger Witness.

## Authority And Shadow Requirements

- Shadow output is always `authorizing=false`.
- Shadow may reproduce or narrow actions; it may never add one.
- A mismatch in owner, operand, legality, Mutation Domain, Commit adapter,
  hidden policy, or Witness suppresses the new path.
- Runtime authority requires an explicit exact-environment entry separate from
  registry/manifest presence.
- Canary remains canary; operation evidence does not qualify a Surface or
  origin family.
- Organic evidence is bound to game identity, DLL SHA, MVID, runtime, Modset,
  run ID, provenance, exact action, and semantic post-state.
- Old MVID evidence is never reassigned to a new build.

## Documentation Alignment Judgment

| Layer | Judgment at pinned HEAD |
|---|---|
| safety kernel and ledger | aligned with hard-shell claims |
| empty Surface/Inspection permission scopes | aligned and Fail Closed |
| Provider/manifest inventory | structurally aligned, but manifest is non-authorizing metadata |
| Re opaque action execution | aligned |
| Re structural/source schema | safe but manually duplicated and content-coupled |
| source-target permission | honestly Surface-level in code; some prose overstates origin scoping |
| deck-enchant source scope | not fully aligned: Self-Help Book is evidence text, not runtime Provider binding |
| last source-target runtime evidence | internally precise in its closeout, not reverified live here |
| audit-time local runtime | exact alternate-build run exists; Release test output and installed artifact align on disk, but current process load was not reverified |
| transaction-wide Witness ownership | not represented; architecture debt remains |

The system is not fully code-permission-evidence-documentation aligned. The
hard shell is coherent; source/operation qualification and transaction-wide
Completion are the unresolved layers.

## Unresolved Questions

1. Which game-owned object can provide a stable transaction/continuation token
   across every parent/child UI handoff without exposing hidden state?
2. Can the source-qualified `-840572606` assembly be independently recovered
   and decompiled to test the local alternate-build counterexamples?
3. Which hooks make purchase, enchantment, movement, and transformation
   Mutation Domains open, and when must a manual witness remain?
4. Should application authority remain valid when Strategy Semantic Projection
   is partial but all current legality and Completion facts are complete?
5. How should bounded random transformations state distribution/eligibility
   without exposing the committed replacement?
6. What is the smallest structural protocol that removes content literals
   without turning Re into an effect interpreter?

## Closeout Status

- Architecture audit: complete for the pinned repository and available local
  evidence.
- Code changes: none.
- Permission changes: none.
- Bridge validation: `98/98` tests passed after supplying the repository's
  explicit `STS2GameDir`; the first path-less invocation failed dependency
  resolution before tests ran.
- Re validation: strict typecheck, `149/149` tests, and production build passed.
- Release build/install/load: Release compilation occurred as part of Bridge
  tests; its DLL matches the already-installed DLL by SHA and MVID. No install
  occurred and current process load was not reverified.
- Documentation validation: changed-document relative links and
  `git diff --check` passed.
- Runtime canary/Organic Qualification: not performed.
- Direct target-build source verification: not performed; target-build claims
  remain repository source-audit records.
- Highest-value next work: implement a non-authorizing DecisionFrame shadow for
  generated-card and combat-pile choices, while first adding an explicit
  transaction-obligation audit that detects the deck-enchant source-scope and
  parent/child Witness gaps.
