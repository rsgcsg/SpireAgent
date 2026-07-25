# MCP, Semantic Gateway, Source, And Headless Architecture Audit Closeout

Status: documentation-only independent audit at
`develop@af091244d9b72ad87a5b86e7b9e7ec691b8e7f86`. No protocol, runtime code,
permission, canary, qualification, install, or live-load change was made.

## Executive Verdict

The strongest architecture is not "a smarter MCP". It is a protocol-neutral
STS2 Semantic Game Gateway running with the real game engine, with REST, MCP,
tests, replay, and future headless hosts acting as adapters or consumers.

The current Bridge v2 already contains most of the correct hard shell:

```text
exact environment identity
+ player-visible observation
+ one current input owner
+ opaque state-bound action
+ exact entity binding
+ execute-time revalidation
+ game-owned Commit
+ idempotent command lifecycle
+ semantic post-state Witness
+ explicit fail-closed authority
```

The current class boundaries are not the target architecture. Providers are
too broad, source literals and schemas are duplicated across C# and TypeScript,
Surface-level permission is coarser than some evidence, and the command ledger
does not explicitly own the remaining obligations of a native asynchronous
transaction across child decisions.

The two design inputs were directionally right about a protocol-neutral
gateway, DecisionFrame, typed transaction obligations, and non-authorizing
source analysis. They were too strong where they implied that a complete
semantic extractor should precede every new binding, that a separate
Transaction Ledger class is itself fundamental, or that broad mutation tracing
can prove an arbitrary Modded transaction closed. Those claims are narrowed in
this closeout.

Recommended target:

```text
Real STS2 Engine
  -> Environment Attestor
  -> Visible-State And Input-Owner Resolver
  -> Typed UI Mechanism Adapter
  -> Native Task/Transaction Correlator
  -> DecisionFrame
  -> Closed Transaction Contract + Witness Obligations
  -> Shared Publication/Execution Validator
  -> Qualified Native Commit Adapter
  -> Command Lifecycle + Transaction Correlation
  -> Semantic Witness And Evidence Record

REST / MCP / test / replay = transport or harness adapters
Re-SpireAgent = strategy projection and action selection
LLM scaffold = cognition, memory, prompt, and budget policy
Source workbench = offline, open-domain, non-authorizing audit accelerator
```

## Audit Baseline

### Repository

- branch: `develop`
- HEAD: `af091244d9b72ad87a5b86e7b9e7ec691b8e7f86`
- `origin/develop` matched the same full SHA at audit start
- worktree: clean before this documentation audit
- Bridge protocol: `2.0-preview.54`

### Canonical source-target identity from repository records

- game: `v0.109.0|c12f634d|-840572606`
- installed/Release Bridge SHA-256:
  `7bf3abca5f20594077b31f8e400ef0b27643353846256cb59cb633418a59a8b3`
- loaded MVID: `67b8d32b-8c0c-4514-9df7-fac4ac5fb738`
- runtime instance: `db112bc183354e9eb397f6c76121f484`
- Modset status: `exact_bridge_only`

These are historical repository runtime records. This audit did not reconnect
to that runtime or independently load that exact game assembly.

### Audit-time local game assembly

- game: `v0.109.0|c12f634d|1833084275`
- `sts2.dll` SHA-256:
  `ee45848ff6319dfc7af2538d3a52d05d82bef35ee4c5fd0400dc9efe8f9054aa`

This assembly was independently decompiled during this audit. It is a
different exact build from the canonical source-target identity. Its findings
are not copied into canonical permission or Organic evidence.

## Evidence Classes And Limits

| Class | Used here | What it can prove |
|---|---|---|
| Direct current code inspection | Bridge runtime, permission, resolver, Providers, source bindings, manifest, Python MCP adapter, Re client/schema/normalization/actions | current repository behavior at HEAD |
| Direct current test execution | 98 Bridge tests; 149 Re tests plus typecheck and production TypeScript build | fixture/static contract behavior, not live game semantics |
| Direct local assembly decompilation | selected types from alternate `1833084275` assembly | exact-source facts for that assembly only |
| Repository source-audit records | Preview closeouts and architecture audits | what earlier audits recorded; not independent verification by this audit |
| Repository runtime/Organic evidence | exact MVID/run records in Preview closeouts | historical observed behavior for each recorded identity only |
| Documentation claim | Current Status, Coverage, Protocol, ADRs | intended/canonical project position, subject to code/evidence comparison |
| External primary source | MCP, Godot, Harmony, .NET official documentation | platform semantics, not STS2 qualification |
| Inference | recommendations in this closeout | architecture judgment, never authority or evidence promotion |

No game process or Bridge endpoint was live-verified in this audit. No Release
DLL was installed. No loaded MVID, runtime instance, canary, or Organic journey
was added.

## Material Inspected

### Repository instructions and canonical records

- root and STS2MCP `AGENTS.md` files;
- `CONTRIBUTING_OR_ENGINEERING_RULES.md`;
- root `ARCHITECTURE.md`, `GAME_IO_CAPABILITIES.md`, and authority/status docs;
- Bridge `CURRENT_STATUS.md`, `PLAYER_VISIBLE_COVERAGE.md`, `PROTOCOL.md`,
  `ARCHITECTURE_EVOLUTION_PLAN.md`, architecture reviews, ADRs, and README;
- Preview closeouts for transform, generated cards, combat-pile selection,
  enchantment, purchases, linked rewards, Inspections, and hidden pile order.

### Directly inspected Bridge/MCP code

- `BridgeV2Runtime`, `BridgeCommandLedger`, and runtime models;
- `BridgeSurfacePermission`, `ActiveSurfaceResolver`,
  `BridgeSnapshotBuilder`, visibility and Inspection builders;
- contract manifest and exact game/Modset identity;
- generated-card, combat-pile, enchantment, transform, shop, reward, and combat
  Providers plus generated/pile native Task source bindings;
- `STS2MCP/mcp/server.py` v2 adapter and surrounding legacy v1 tools.

### Directly inspected Re code

- `BridgeV2RestClient` and hybrid adapter;
- v2 wire schemas and coherent observation checks;
- Bridge v2 normalization and Inspection projection;
- allowed-action construction and action domain types.

### Directly decompiled local STS2 types

- `CardSelectCmd`;
- `PotionModel`, Attack/Colorless/Skill/Power Potion;
- `Splash`, Headbutt, Graveblast, Hologram, Cosmic Indifference;
- `SelfHelpBook`, `WhisperingHollow`;
- `LeadPaperweight`, `HeftyTablet`, `PaelsGrowth`, `Orrery`.

This was independent source verification for local hash `1833084275`, not for
canonical hash `-840572606`.

## Direct Answers

### 1. What should MCP do?

MCP should expose a small, capability-negotiated adapter over the semantic
gateway:

- get exact capabilities and environment identity;
- get one player-visible state with opaque legal actions;
- request fixed catalog-advertised read-only Inspections;
- submit one opaque action with request and expected-state identity;
- poll the idempotent command lifecycle;
- return typed errors without reinterpretation.

MCP should not infer game purpose, rebuild legality, choose strategy, inspect
arbitrary scene nodes, execute reflection or scripts, grant exact-build
authority, or create one tool per card/relic/potion/event/source.

MCP tool discovery proves only that an adapter operation is available. It does
not prove that any action is legal, permitted, qualified, safe, or desirable.
The official MCP architecture defines MCP as a client/server protocol exposing
focused resources and tools with capability negotiation; it does not assign
the protocol server ownership of an application's domain model:
<https://modelcontextprotocol.io/docs/learn/architecture>.

Direct repository fact: Re-SpireAgent currently calls Bridge v2 REST directly.
The Python MCP server is not in Re's strict-v2 runtime path.

### 2. What is the best MCP or STS2 semantic gateway shape?

The durable product boundary is a protocol-neutral STS2 Semantic Game Gateway,
not a Python MCP tool collection. It should own game-facing truth and safety
while remaining strategy-free.

The minimum gateway contract is:

```text
Observe exact environment and player-visible truth
Resolve exactly one current input owner
Publish opaque actions bound to exact state and operands
Validate one shared legality result at publication and execution
Invoke one qualified game-owned Commit path
Correlate command and native transaction lifecycle
Prove declared post-state obligations
Return settled, rejected, or unknown without unsafe retry
```

REST, MCP, tests, replay, and a future headless host may expose this contract.
None may independently reinterpret it.

### 3. How much should the gateway depend on STS2 source?

Deeply at audit/build time, lightly and explicitly at runtime.

Offline source/decompilation should be used to discover candidate owner paths,
Task/continuation boundaries, legal predicates, Commit paths, hooks, patch-risk
surfaces, mutation domains, hidden-information hazards, and Witness
obligations. It should also produce exact-build impact reports.

Runtime authority should depend on reviewed typed bindings, current objects,
exact environment identity, and proven contracts, not on running a decompiler
or executing generated analysis. Source output proposes; evidence and explicit
permission authorize.

Static extraction cannot prove arbitrary dynamic dispatch, reflection, hooks,
or Mod patches complete. Unknown/open domains remain visible and fail closed.
Harmony can enumerate patched methods and patch information in the current
AppDomain, which supports bounded relevant-patch attestation, but enumeration
alone does not prove semantic compatibility:
<https://harmony.pardeike.net/api/HarmonyLib.Harmony.html>.

### 4. What is the best relationship to headless STS2?

The gateway should make consumers logically headless first: Re/MCP consume
semantic state and actions without knowing UI nodes. That does not require the
game process itself to be displayless.

Physical headless operation should run the real STS2/Godot engine and preserve
the same scene, owner, Task, Commit, timing, and Witness semantics until a
smaller official game interface is proven equivalent. Godot documents
`--headless` as selecting headless display and dummy audio drivers; that switch
does not establish UI-independent gameplay semantics:
<https://docs.godotengine.org/en/stable/tutorials/editor/command_line_tutorial.html>.

A reimplemented STS2 simulator may be useful for explicitly non-authoritative
strategy rollout. It must not become the source of live legality, hidden truth,
Commit, or qualification.

### 5. What are the root current architecture problems?

1. Providers co-locate owner resolution, mechanics, semantic source,
   projection, legality, execution, and Witness logic.
2. Bridge and Re repeat Surface/source unions and content-specific validation.
3. Source literals encode content instances where some contracts should be
   structural transaction data.
4. Surface-level permission cannot faithfully represent operation/origin-level
   evidence.
5. The command ledger owns one submitted action but not an explicit
   cross-decision native transaction and its remaining obligations.
6. Completion closures are fragmented and difficult to audit as a set.
7. Exact-build qualification is safe but expensive because compatibility
   impact is not structurally partitioned.
8. MCP naming conflates the game mod, Bridge domain runtime, REST API, and
   Python adapter.
9. The Python MCP v2 Inspection adapter omits `shop_catalog`, despite Bridge
   and Re supporting three fixed kinds.
10. `DeckEnchantSurfaceProvider` names Self-Help Book in an evidence string but
    has no runtime source/task binding; its canary authority is Surface-scoped.

### 6. How should implementation proceed?

Proceed from correlation and shadow evidence, not from a broad new IR:

1. correct naming and machine-check transport/catalog drift;
2. add a non-authorizing transaction-correlation record to two already-tracked
   Task families;
3. derive DecisionFrame and shared validation in shadow;
4. add closed Witness obligations and compare old/new results;
5. build a non-authorizing offline source audit workbench against frozen facts;
6. migrate Re to structural strategy projection only after holdout success;
7. narrow authority only after current-build replay, canary, and Organic proof;
8. test physical headless operation as a separate equivalence project.

Every phase keeps the old path authoritative until the new path reproduces or
narrows it. Rollback is disabling the shadow or returning the migrated family
to its old Provider without permission expansion.

## Directly Verified Current Strengths

### Permission and owner hard shell

- `BridgeSurfacePermission` requires explicit qualified/canary membership for
  both Surface and Inspection. Empty lists are empty.
- capability support is derived through the same Inspection permission helper.
- `ActiveSurfaceResolver` rejects multiple matching Providers instead of
  selecting by order.
- `BridgeSnapshotBuilder` filters action Providers by exact-build permission
  before resolving authority.

### Action identity and execution

- actions are opaque and bound to one `state_id`;
- submit re-observes current game state before ledger validation;
- Providers bind current object references and re-check liveness/legality;
- request IDs are idempotent; conflicting reuse is rejected;
- timeout/failure outcomes become unknown and are not presented as success.

### Inspection

- three fixed kinds exist: `run_deck`, `combat_piles`, `shop_catalog`;
- Inspection is read-only, state-bound, independently permitted, and outside
  the command ledger;
- draw-pile order is explicitly hidden.

### Native Task source binding

Generated-card and combat-pile source trackers wrap exact native Task-returning
methods and keep a unique token active until the returned Task completes or
faults. This is materially stronger than prompt text, UI class, or page
closure. .NET Tasks carry asynchronous completion and failure to the awaiting
caller, so the wrapper observes the native asynchronous boundary rather than
only the child screen:
<https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/>.

## Directly Verified Structural Debt

### Provider density

The largest Provider files are not small adapters:

- generated-card choice: 609 lines;
- deck transform: 541 lines;
- deck removal and deck enchant: 511 lines each;
- deck upgrade: 452 lines;
- combat hand/pile selection: 449/446 lines.

Line count is not itself a defect. The repeated concentration of mechanics,
purpose, validation, execution, and Completion is the relevant signal.

### Dual-end schema burden

- Python MCP server: 1317 lines, mostly legacy v1 plus a small v2 adapter;
- Re v2 protocol decoder: 1781 lines;
- Re Bridge v2 normalizer: 3252 lines.

Re correctly imports opaque Bridge actions generically in strict-v2 mode, but
its state decoder and projection still contain content/source-specific unions.

### Command versus transaction completion

`BridgeCommandLedger` records one submitted action. Some Providers correctly
wait for exact semantic post-state. `combat_turn.play_card`, however, can settle
when the card leaves hand or a required child Surface opens. A source-native
card Task may still own later effects after that child decision.

This does not prove the current command result false. It proves that the model
lacks an explicit owner for remaining transaction obligations. The generated
and pile source trackers already retain native Task tokens across the child,
which makes them the smallest credible shadow pilot.

### Enchantment counterexample

Direct local decompilation found:

- Self-Help Book selects one eligible card and commits Sharp/Nimble/Swift with
  typed amount 2;
- Pael's Growth opens `FromDeckForEnchantment(... amount: 1)` but then commits
  `CardCmd.Enchant<Clone>(item, 4)`.

Therefore a visible enchant selector's displayed amount is not universally the
business Commit amount. A generic enchant application contract must bind the
native transaction or prove UI/Commit parameter equality. UI mechanics and
enchantment ID alone are insufficient.

### Parent/child and hook counterexamples

Direct local decompilation also found:

- Whispering Hollow chooses a card, transforms it, then deals unblockable HP
  damage before finishing the event;
- Potion `OnUseWrapper` executes Before/After hooks around the potion's own
  asynchronous effect and child decision;
- Orrery purchase/obtain flow offers five child card rewards;
- Hefty Tablet adds Injury even when its generated-card child is skipped;
- Headbutt, Graveblast, Hologram, and Cosmic Indifference share pile-choice
  mechanics while preceding effects and destinations differ.

These are direct facts for the local alternate assembly. They demonstrate why
child-screen completion and source name alone are not complete transactions.

## Fundamental Safety Invariants

The following are retained unchanged:

1. exactly one current input owner;
2. player-visible information and explicit hidden-information boundaries;
3. opaque state-bound actions;
4. exact operand/entity/control binding;
5. publication and execution legality parity;
6. execute-time revalidation before mutation;
7. game-owned Commit paths;
8. idempotent command lifecycle;
9. unknown outcomes are not retried;
10. semantic post-state Witnesses;
11. Inspection remains read-only and non-authorizing;
12. exact environment/evidence scope and no automatic build inheritance;
13. explicit fail-closed unknown, ambiguity, and incompleteness;
14. shadow comparison and rollback before authority migration.

## Historical Constraints To Retire

These current implementation choices are not fundamental:

- one large Provider class per semantic journey;
- one new Surface/source literal for every content item;
- provenance string as the only acceptable semantic binding;
- a hand-written Completion closure for every operation;
- parallel hand-written C# and TypeScript content unions;
- Surface kind as the finest possible permission/evidence unit;
- current REST DTO shape as the permanent domain model;
- a mandatory separate Transaction Ledger class for every action;
- full UI rendering as a permanent consumer requirement;
- exact MVID as the only possible compatibility fingerprint.

The properties those choices currently protect remain required. They may be
replaced only by a narrower or equivalently safe mechanism.

## Target Architecture

### 1. Environment Attestor

Inputs:

- exact game version/commit/hash;
- Bridge protocol, SHA, MVID, runtime instance;
- loaded Modset and relevant patch information;
- contract/adapter fingerprints as diagnostics.

Output: explicit environment scope. It cannot inherit authority from a prior
build or from a matching content registry.

### 2. Visible-State And Input-Owner Resolver

Produces player-visible shared state and exactly one owner. Unknown or multiple
owners publish no actions. It remains independent of strategy.

### 3. Typed UI Mechanism Adapter

Describes bounded mechanics only:

- visible candidates and exact controls;
- selected set and min/max constraints;
- current stage and readiness;
- low-level game-owned interaction entry.

It does not define purpose, Mutation Domain, authority, or Completion.

### 4. Native Task/Transaction Correlator

Correlates the current owner and child decision to a game-owned Task, command,
continuation, or other exact transaction token. Zero matches fail closed;
multiple matches are authority ambiguity.

Provenance is optional only when another binding proves the complete current
transaction more strongly. Transaction binding is never optional.

### 5. DecisionFrame

A DecisionFrame records:

- current owner and exact environment;
- mechanism snapshot and exact operands;
- transaction token and phase;
- shared legality result;
- visible, hidden, unavailable, and critical facts;
- bounded legal semantic actions;
- closed mutation domain and outstanding Witness obligations.

It is a decision boundary, not an executable script.

### 6. Closed Transaction Contract

Use a finite Transaction Contract or Obligation Graph, not a broad Effect DSL.
It declares known game-owned phases and proof obligations such as:

- exact card movement;
- exact enchantment application;
- transformation with typed randomness policy;
- bounded resource delta;
- bounded child decision;
- bounded sequence/all-of/one-of obligations.

The Bridge never replays these effects. One qualified native Commit adapter
does the work. Unknown primitives, operands, control flow, or side effects make
the contract open and non-authorizing.

### 7. Shared Validator

Publication and execute-time revalidation consume one typed business result.
Execution may add liveness, identity, timing, and owner checks, but may not
reinterpret eligibility.

### 8. Native Commit Adapter

Invokes only a reviewed game-owned method/control/task. No arbitrary method,
reflection target, script, or Mod-supplied callback is executable through wire
data or registry data.

### 9. Command Lifecycle And Transaction Correlation

The command ledger continues to own idempotent client requests. A transaction
correlation record owns native source Task identity, child phases, and
remaining obligations across one or more commands.

Whether these are implemented as two classes, one event store, or a composed
record is secondary. The required invariant is that every obligation has one
owner and reaches settled, failed, or unknown exactly once.

### 10. Witness Compiler And Manual Witness

Known finite obligations may compile to typed Witnesses:

- exact entity present/absent;
- exact zone movement and cardinality;
- exact attribute/enchantment change;
- currency/HP/resource delta;
- owner/room/surface transition;
- child completion and source Task completion.

Manual purpose-specific Witnesses remain legitimate for hooks, asynchronous
flows, or domains that cannot be safely expressed. Page closure alone is not a
business Witness.

### 11. Typed Evidence Governance

Evidence records bind:

- repository revision and contract revision;
- exact game and Modset identity;
- Bridge SHA/MVID/runtime;
- source-audit identity;
- test/build/install/load state;
- run and command IDs;
- canary/qualified scope and operation/origin limits;
- missing evidence and rollback point.

Evidence data validates or narrows authority. It never grants itself authority.

## Component Boundaries

| Component | Owns | Must not own |
|---|---|---|
| STS2 | rules, entities, RNG, hooks, Commit, actual state | LLM strategy or Bridge qualification |
| Semantic Gateway / Bridge | visible projection, owner, legal opaque actions, revalidation, native Commit adapter, lifecycle, Witness, exact authority | prompts, memory, reward, training, hidden truth, arbitrary scripts |
| REST adapter | HTTP serialization of gateway contract | independent semantics or legality |
| MCP adapter | focused discovery/read/submit/poll tools over gateway | content-specific authority, strategy, raw scene/reflection access |
| Re-SpireAgent | structural decoding, strategy projection, candidate choice, settlement policy | strict-v2 legality reconstruction or permission expansion |
| LLM scaffold | deliberation, memory activation, prompt/budget policy | direct object access, hidden state, raw native Commit |
| Source workbench | offline candidate extraction, diff, audit reports | runtime authority, self-qualification, effect execution |
| Headless host | run the same gateway/engine without a visible consumer | substitute simulated rules for live authority |

## Source Use Policy

### Source is required when

- UI shape cannot prove business purpose;
- the current transaction/caller/task is ambiguous;
- hooks or async continuations may add side effects;
- hidden facts may influence a proposed projection;
- Commit parameters differ from visible selection parameters;
- a new primitive, adapter, or compatibility fingerprint is proposed.

### Provenance may be optional when

- one reviewed runtime transaction token uniquely binds owner, exact operands,
  Commit adapter, closed Mutation Domain, and Witness obligations;
- source origin does not change legality, effects, hidden policy, or Completion;
- current-build evidence covers that structural contract.

### Source must never

- grant permission by class/name match;
- turn reflection results into executable wire operations;
- expose hidden RNG or future choices to strategy;
- certify a Mod's self-declared contract;
- replace current-build canary and Organic post-state evidence.

## Headless Levels

| Level | Meaning | Current judgment |
|---|---|---|
| H0 semantic consumer headless | Re/MCP sees semantic state/actions, not UI nodes | substantially present in Bridge v2 |
| H1 interface/logical headless | gateway contract is transport and renderer neutral | target architecture; REST already demonstrates transport separation |
| H2 offscreen real engine | real STS2/Godot runs with headless/offscreen display while preserving scene lifecycle | unverified experiment only |
| H3 official UI-independent runtime | STS2 exposes stable game commands/state without scene/UI dependencies | no current evidence; do not assume |
| H4 reimplemented simulator | separate rules engine approximates STS2 | allowed only for labeled strategy rollout/eval; rejected for live authority |

Godot's dedicated-server export can strip visual resources while preserving
scene/resource references, but that is an engine packaging capability, not
proof that a closed-source game remains semantically equivalent:
<https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_dedicated_servers.html>.

H2 admission requires shadow comparison of owner, visible candidates, legal
actions, native Commit, timing, hooks, command lifecycle, and Witness outcomes
on the same exact build. Any divergence keeps visible runtime authoritative.

## Application Semantics Versus Strategy Semantics

Application semantics answer: "What exact mutation did this current native
transaction commit?"

Example:

```text
apply enchantment Sharp amount 2 to exact card C
```

Strategy semantics answer: "How may that enchantment affect future decisions?"

Example:

```text
on future attack calculation, modify known damage term by typed rule
```

The first belongs to executable transaction authority and Witnesses. The
second belongs to a read-only strategy projection. Unknown future behavior may
reduce strategy confidence; it must not fabricate current legality or Commit.
Conversely, knowing future behavior does not prove the enchantment was applied.

## Positive Holdout Acceptance Tests

These examples are tests of frozen abstractions. They must not create
`if card == X`, source switches, new Surface variants, or approved-combination
whitelists.

| Holdout | Why zero handwritten Bridge/Re core should work | Handling abstraction | Allowed changes | Required Witness and safety |
|---|---|---|---|---|
| New enchantment ID/amount through an existing proven enchant transaction | ID and amount are typed operands, not a new mechanic | enchant DecisionFrame + native Commit adapter + apply-enchantment obligation | registry data, fixture, exact-build evidence | exact card, eligibility, Commit parameter equality, exact applied ID/amount, transaction completion |
| Enchantment future behavior composed from known triggers/effects | behavior is read-only strategy composition, not current application authority | strategy semantic projection | registry/fixtures; no execution core | application Witness remains separate; unknown trigger degrades strategy only |
| New Splash-like generator with another pool or bounded candidate count | pool/count are data if the same owner, choose mechanic, Commit, destination, and overflow contract hold | generated-choice mechanism + transaction operands | registry, fixtures, evidence | exact offered set, chosen exact card or skip, free marker, hand/discard overflow, source Task complete |
| `deal_damage -> choose card -> move card` | damage and movement are known bounded obligations around one child choice | transaction sequence + pile DecisionFrame | transaction data, fixtures, evidence | exact target/damage outcome, exact source card and destination, child and source completion |
| `gain_block -> choose card -> move card` | same mechanism, different preceding semantic obligation | transaction sequence + pile DecisionFrame | transaction data, fixtures, evidence | exact block delta/allowed modifiers, exact movement, completion |
| generated selection then free-this-turn, move, bounded overflow, lose HP | known bounded obligations can compose without a new Surface | generated DecisionFrame + all-of/sequence obligations | transaction data, fixtures, evidence | exact cost marker, one declared destination, exact HP delta, no undeclared mutation, source completion |
| New source/destination/position combination for card movement | zones and position are typed operands of known native movement | move-card obligation + Commit adapter | registry/fixture/evidence | exact card leaves source, enters destination at declared semantic position, cardinality conserved |
| Random transformation with different typed parameters | randomness policy and count are operands if hidden result is not exposed pre-Commit | transform contract | registry/fixture/evidence | exact inputs consumed, result appears only post-Commit, count/domain constraints, hidden RNG excluded |
| Purchase followed by one or more child rewards | bounded child obligations belong to the purchase transaction | purchase contract + transaction correlation + child DecisionFrames | transaction data, fixtures, evidence | exact price/product/inventory result, exactly-once child correlation, all required children resolved |
| Same semantic operation through a different UI adapter | presentation can vary independently from purpose | new typed Mechanism Adapter feeding same contract | adapter code/fixtures/evidence; no Bridge/Re domain core | owner/operand/legality/Commit/Witness shadow equivalence |
| Same UI mechanism driving removal, enchantment, transform, or movement | mechanics can be reused while semantic contracts remain distinct | shared mechanism + purpose-specific transaction contract | contract/fixtures/evidence | each purpose has closed domain, qualified Commit, and its own obligations |

Qualification note: zero core code does not mean zero work. Registry data,
fixtures, exact-build source audit, canary, and Organic evidence may still be
required. Unknown hooks or a new native Commit path turn the holdout into a new
code/evidence case.

## Rejection Holdouts

| Holdout | Why reject | Rejecting layer | What may unblock it |
|---|---|---|---|
| Same UI shape with unknown semantics | mechanics do not prove purpose or Mutation Domain | transaction correlator/DecisionFrame | reviewed task/transaction binding and closed contract |
| Known source with incomplete transaction | source name does not enumerate later hooks/effects | transaction contract | complete bounded domain and obligations |
| Unknown primitive | no legal/Witness semantics exist | contract decoder | reviewed new primitive, Commit adapter, fixtures, evidence |
| Unbound operand | name/index cannot identify exact current object | DecisionFrame validator | exact entity/control/token binding |
| Incomplete Mutation Domain | unobserved side effects could remain | contract completeness gate | explicit closed domain or manual fail-closed witness path |
| Missing Witness for a declared side effect | completion cannot prove transaction | Witness compiler | typed/manual Witness and negative fixtures |
| Page closure as business completion | owner change does not prove purchase/enchant/movement | command lifecycle | semantic post-state evidence |
| Hidden RNG as legality or strategy truth | leaks unavailable game information | visibility policy | post-Commit visible result only |
| Arbitrary reflection/method/script execution | bypasses reviewed native Commit boundary | wire/Commit adapter | never data-driven; reviewed adapter code only |
| Mod-declared contract grants authority | self-attestation is not qualification | environment/evidence authority | independent audit, explicit exact-build permission, canary/Organic evidence |
| Automatic authority inheritance across builds | old evidence does not cover changed runtime | environment attestor | explicit current-build requalification |
| Unbounded control flow or recursive child creation | termination and obligations cannot be closed | transaction contract | hard bound or fail closed |
| Extractor claims completeness while relevant dispatch/patches remain unknown | generated model may be a second unsound rules engine | source workbench admission | explicit open-domain result and reviewed bounded patch/commit closure |

## Anti-Overfitting Gate

Before implementing holdouts, freeze:

1. DecisionFrame fields and criticality classes;
2. transaction phases and correlation identity;
3. primitive and control-flow catalog;
4. Commit adapter interface;
5. Witness obligation grammar;
6. hidden-information policy;
7. authority/evidence record shape;
8. failure and rollback behavior.

Then evaluate unseen holdouts. A content-only composition of existing
mechanisms, primitives, control flow, Commit adapters, and Witness rules must
require zero handwritten Bridge/Re domain-core changes. Failure means either:

- the proposed core abstraction is incomplete;
- the holdout contains a genuinely new mechanic/primitive/Commit;
- the transaction is not safely closed and must fail closed.

Adding example-specific branches to make the gate pass is prohibited.

## A/B/C/D Judgment

| Level | Decision |
|---|---|
| A: retain | keep unique Providers and manual Witnesses where evidence does not support safe reuse; retain the full v2 hard shell |
| B: local extraction | extract permissionless mechanism readers, validation results, witness primitives, evidence checks, and catalog-driven MCP Inspection requests |
| C: typed shared pilot | pilot transaction correlation, DecisionFrame, shared validator, and closed Witness obligations on generated-card and combat-pile families |
| D: top-level/wire change | not approved now; consider a structural wire only after C passes holdouts and shadow comparison without authority expansion |

## Migration Phases And Rollback

### Phase 0: Correct names and governance drift

- distinguish semantic gateway, REST adapter, MCP adapter, Re, and LLM;
- machine-check the three fixed Inspection kinds across Bridge/Re/MCP;
- keep permissions unchanged.

Exit: documentation and adapter catalogs agree. Rollback: documentation or
adapter-only revert; no authority impact.

### Phase 1: Minimal transaction-correlation shadow

- add an internal non-authorizing record beside `BridgeCommandLedger`;
- populate from existing generated-card and combat-pile native Task tokens;
- record owner, exact operands, child phase, Task completion, and obligations;
- add ambiguity, orphan, concurrent-owner, fault, and timeout fixtures.

Exit: old and shadow lifecycle records agree or shadow is narrower across
positive/negative fixtures. Rollback: disable/remove shadow flag.

### Phase 2: DecisionFrame and shared validation shadow

- extract mechanism snapshot and one shared legality result;
- compare published actions and execute-time checks to existing Providers;
- preserve old Provider execution and wire.

Exit: no extra action; all mismatches explained; negative holdouts fail closed.
Rollback: stop generating frames.

### Phase 3: Closed obligation/Witness shadow

- model only finite known obligations;
- compile typed Witnesses where safe;
- preserve manual Witnesses for open/hooked domains;
- shadow compare command and full transaction completion.

Exit: no side effect lacks an owner/Witness; unknown remains unknown. Rollback:
manual Provider Witness remains authoritative.

### Phase 4: Offline source audit workbench

- index exact assembly callers, async Tasks, known commits, hooks, and relevant
  patch surfaces;
- generate non-authorizing candidate records and version diffs;
- test against frozen holdouts, including Pael's Growth and Whispering Hollow.

Exit: reviewed facts are reproduced and omissions are explicit. Rollback:
discard generated artifacts; runtime is unchanged.

### Phase 5: Structural Re strategy projection

- consume structural frames/obligations without content source switches;
- keep executable authority in opaque Bridge actions;
- keep strategy behavior IR read-only and separate.

Exit: golden/replay parity and zero-core holdouts pass. Rollback: use existing
v2 decoder/projection.

### Phase 6: Authority narrowing and family migration

- migrate one family only after fixture, source, build, load, canary, semantic
  post-state, and Organic evidence for the exact MVID;
- preserve or narrow current permission; never broaden from shadow match.

Exit: code, runtime, capability, evidence, and docs agree. Rollback: remove the
new family scope or return to the old Provider.

### Phase 7: Physical headless equivalence experiment

- run the same exact game/Bridge artifact with an offscreen/headless host;
- compare visible owner, actions, timing, Task lifecycle, Commit, and Witnesses;
- never use hidden state to make the headless path look complete.

Exit: repeated equivalence on representative journeys. Rollback: visible real
game process remains the only authoritative deployment.

## Rejected Alternatives

1. **Make the Python MCP server the domain core.** Rejected because Re does not
   use it, Bridge already owns main-thread game objects, and transport-specific
   semantics would duplicate authority.
2. **Expose one MCP tool per game action/content item.** Rejected because tool
   existence becomes confused with legality and causes unbounded schema churn.
3. **Universal selector or raw UI tree.** Rejected because UI shape does not
   prove business purpose and raw trees threaten hidden-information boundaries.
4. **Executable Effect DSL or reflection gateway.** Rejected because it creates
   a second game engine and bypasses reviewed native Commit paths.
5. **Require source literal for every transaction forever.** Rejected because a
   reviewed native transaction token can be stronger and more reusable.
6. **Remove source binding whenever UI mechanics match.** Rejected because
   Pael's Growth, Hefty Tablet, pile cards, and potion hooks disprove it.
7. **Build a complete extractor before any further contract work.** Rejected as
   an ordering rule. The extractor needs a frozen minimal transaction model and
   must remain open-domain/non-authorizing.
8. **Treat a separate Transaction Ledger class as a hard invariant.** Rejected.
   Obligation ownership/correlation is fundamental; storage shape is not.
9. **Treat Godot `--headless` as a rules API.** Rejected because it changes
   display/audio behavior, not proven STS2 scene/business dependencies.
10. **Reimplement STS2 for live headless authority.** Rejected because drift,
    Mods, hooks, RNG, and hidden-state semantics would make it a second rules
    engine.

## Current Alignment Judgment

### Aligned and directly verified

- Surface and Inspection empty scopes fail closed;
- one Active Surface owner is enforced;
- strict-v2 actions are opaque and state-bound;
- Re imports advertised actions rather than reconstructing strict-v2 legality;
- command IDs are idempotent and unknown outcomes remain unknown;
- three Inspections are fixed, read-only, state-bound, and non-authorizing;
- protocol/current-status permission matrix is explicit and exact-build scoped.

### Partially aligned

- source binding is strong for generated-card and combat-pile families but
  absent for deck enchant;
- semantic Witnesses are strong locally but transaction obligations are not
  first-class across all parent/child flows;
- manifest/capability inventory is typed, but evidence remains partly prose;
- Re's action path is structural, while state schemas remain highly
  Surface/source-specific.

### Drift found

- architecture evolution plan said two Inspections; code has three;
- Python MCP v2 observation adapter omits `shop_catalog`;
- root Game I/O capabilities described only v1 behavior and said legal actions
  were not listed;
- "MCP" was used loosely for at least four different boundaries.

### Not changed by this audit

- qualified/canary/disabled permission lists;
- protocol `2.0-preview.54`;
- any Organic evidence or MVID attribution;
- Bridge/Re code or runtime artifacts;
- v1 retirement state.

## Unresolved Questions

1. What is the smallest transaction-correlation record that captures all
   obligations without becoming a duplicate command ledger?
2. Which action-relevant Harmony patch closure is sufficient for bounded Mod
   attestation, and how is an unknown patch reported?
3. Which current Surface fields are identity-, legality-, completion-,
   strategy-, or decoration-critical?
4. Can a structural Re schema eliminate source literals without exposing
   transaction internals that the LLM does not need?
5. Which STS2 scene/UI dependencies prevent a real `--headless` run, and can
   they be preserved without hidden-state shortcuts?
6. How should exact-build permission narrow from Surface to operation/origin or
   transaction contract without creating a self-authorizing manifest?

## Strongest Remaining Risk

The strongest architectural risk is an automatically extracted transaction
model quietly becoming a second, incomplete game rules engine and then being
treated as authority under dynamic hooks or Mods. Its most concrete current
counterpart is `deck_enchant_selection`: a source name appears in static
evidence prose while runtime authority does not bind that source, and the local
Pael's Growth source proves visible selector amount need not equal Commit
amount.

The response is not more source literals everywhere. It is a non-authorizing
transaction-correlation shadow, explicit open-domain results, reviewed native
Commit adapters, and current-build semantic Witness evidence.

## Recommended Next Small PR

Implement only a non-authorizing `TransactionCorrelationRecord` shadow for the
existing generated-card and combat-pile source Task tokens:

- no wire change;
- no permission change;
- no Provider retirement;
- no source extractor yet;
- capture owner, token, exact operands, phase, child action, source Task status,
  and remaining Witness obligations;
- add negative fixtures for two active source tokens, orphan child, mismatched
  owner, Task fault, child closure without source completion, source completion
  without post-state Witness, and explicitly open mutation domain;
- emit shadow comparison only to bounded test/debug evidence.

This PR tests the most important new boundary with two families that already
have exact native Task scopes. It can be deleted without affecting gameplay if
the model proves too broad.

## Verification Performed

```text
dotnet test STS2_MCP.sln -c Release --no-restore
  -p:STS2GameDir=E:\SteamLibrary\steamapps\common\Slay the Spire 2
  98 passed, 0 failed

npm run check  (Re-SpireAgent)
  TypeScript typecheck passed
  149 tests passed, 0 failed
  production build passed

python -m py_compile STS2MCP/mcp/server.py
  passed

npm run check  (root SpireAgent, after npm ci restored lockfile dependencies)
  TypeScript typecheck passed
  agent smoke passed
```

These results verify current code/fixtures at HEAD. They do not establish live
load, canary, Organic qualification, or headless equivalence.

## Closeout

- Independent verdict: retain the v2 hard shell; move semantics into a
  protocol-neutral gateway and reduce current Provider/schema/content coupling
  through shadow-proven typed internals.
- Source verdict: deep offline analysis, light reviewed runtime binding,
  non-authorizing generated artifacts.
- MCP verdict: focused optional transport adapter, not game brain or authority.
- Headless verdict: logical headless first; offscreen real engine only after
  equivalence evidence; no reimplemented live rules engine.
- Architecture status: proposal documented, not implemented.
- Permission/evidence status: unchanged.
- Highest-value next work: the bounded non-authorizing transaction-correlation
  shadow described above.
