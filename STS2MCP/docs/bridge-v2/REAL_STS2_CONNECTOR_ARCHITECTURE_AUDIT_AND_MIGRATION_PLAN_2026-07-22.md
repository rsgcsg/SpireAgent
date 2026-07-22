# Real STS2 Connector Architecture Audit And Migration Plan

Status: canonical architecture audit and migration decision, 2026-07-22.

> **Post-audit update, 2026-07-22:** its source-mismatch findings were repaired
> in `2.0-preview.55`: C# and Re now share explicit operation scopes and the
> Gateway artifact digest. The audit's installed/loaded-artifact and Organic
> evidence gaps remain open. The baseline facts below are historical audit
> evidence, not current status.

Productization addendum: this connector audit remains canonical for live-game
binding and migration, but the later [productization architecture audit](../../../docs/current/audits/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md)
adds authentication, controller-session, restart, BYOK, Workshop, Companion,
SDK, privacy, and release gates. Its repository baseline is
`develop@79bb9d01e11ae7ad5b614cf42eb05e377143a83d`. The addendum does not claim
that those product components are implemented or replace the Source Truth
Repair priority below.

This report starts from the failures a real Slay the Spire 2 connector must
survive. It does not treat the current Bridge v2 terminology, provider count,
coverage estimates, or historical closeouts as proof that the connector is
correct. Exact game source, player-visible behavior, current checkout
compatibility, and environment-scoped runtime evidence outrank those claims.

The report changes no protocol, permission, runtime behavior, or qualification.
It defines the work that must happen before coverage expansion resumes.

## Executive Verdict

The v2 safety problem is real, but the current implementation is not yet a
coherent product connector.

The following v1 failures are evidence-backed rather than hypothetical:

- mutable card and option indices can identify a different entity after state
  changes;
- v1 mutation routes can acknowledge that work was queued before the game has
  proved the business outcome;
- nested and asynchronous native UI lifecycles change the current input owner;
- provider threads cannot safely mutate the active Godot scene tree directly;
- retries after timeout can duplicate an action when the first outcome is
  unknown;
- game updates and loaded Harmony-style patch Mods can invalidate a binding
  without changing the high-level screen name;
- incomplete visible state makes a legal action strategically unusable even
  when transport and execution are correct.

Bridge v2 addresses several of these failures with one active input owner,
opaque state-bound actions, main-thread dispatch, execute-time revalidation,
an idempotent in-runtime command ledger, semantic completion witnesses,
read-only inspections, and exact-environment permission. Four historical
strict-v2 runs on one exact identity recorded 211 settled decisions, three
stale-state refusals, and two non-actionable-state refusals, with no evidence
that those five refusals were converted into unsafe execution. That is useful
safety evidence. It is not a complete-game success metric.

However, the current clean checkout is internally incompatible:

- the C# Bridge advertises `2.0-preview.54`;
- Re-SpireAgent requires `2.0-preview.56` and fields and source values absent
  from the C# source;
- both projects pass their own tests, but no cross-language contract test
  catches the disagreement;
- the installed DLL is preview.54 and no current game process is available to
  establish a loaded runtime identity;
- current documentation mixes historical exact-build qualification, an
  alternate-build canary profile, source implementation, and current product
  support.

Therefore:

1. Coverage expansion must pause until source truth and cross-language
   compatibility are repaired.
2. Bridge v2 must retain its small safety kernel, but stop treating every new
   business case as a reason to expand handwritten Surface DTOs in two
   languages.
3. `Surface` remains useful for current input ownership and visible interaction
   shape. It must not also carry operation semantics, origin, qualification,
   transaction identity, strategy category, and migration status.
4. A minimal in-game Gateway Mod plus an external Companion Runtime is the
   preferred product boundary. The Gateway owns observation and mutation
   truth. The Companion owns model providers, secrets, agent orchestration,
   records, and optional MCP exposure.
5. The next milestone is not more providers or a general Transaction IR. It is
   a reproducible, versioned connector contract with measured end-to-end
   reliability and a truthful v1 retirement ledger.

## Audit Scope And Evidence

### Repository baseline

| Item | Audited state |
|---|---|
| Branch | local `develop` matched `origin/develop` at `3133303d10d18b79bf1ff17646e41ea7b216214b` |
| Worktree at audit start | clean |
| C# Bridge protocol | `2.0-preview.54` |
| Re strict protocol | `2.0-preview.56` |
| Installed Bridge DLL SHA-256 | `7bf3abca5f20594077b31f8e400ef0b27643353846256cb59cb633418a59a8b3` |
| Installed Bridge protocol | decompiled as `2.0-preview.54` |
| Fresh audited Release SHA-256 | `274825c4c88cf9716732b4bcc871a906d599ced5c51a03199d206e67db92695e` |
| Local game assembly SHA-256 | `06c78d946ca70658e85abb28f6dc2ee0a023a4467faf0708ff542180fe5f4c82` |
| Current live process | unavailable during this audit |
| Bridge tests/build | 98 tests passed; Release build passed |
| Re checks | typecheck, 153 tests, and build passed |
| Python MCP syntax | passed `py_compile` |

Passing these suites separately proves local implementation consistency. It
does not prove that the current C# response can be decoded by the current
TypeScript client. The fresh Release and installed DLL are also not
byte-identical. That may include build reproducibility inputs as well as stale
installation, but in either case the current source has not reproduced and
loaded the installed exact artifact.

### Exact game-source evidence

The local exact `sts2.dll` was inspected rather than inferring behavior from
localized prompts or provider class names. Important examples include:

- `PlayCardAction.ExecuteAction` re-resolves the card and target, confirms the
  card is still in hand, checks `CanPlay`, checks target legality, and only then
  invokes the native play path;
- `NTreasureRoom.OpenChest` is a multi-stage asynchronous lifecycle and enables
  Skip after a delay, so a relic can be visible/clickable while the action set
  is still changing;
- `NMerchantRoom` disables and re-enables room controls around inventory and
  child screens, so room context and active input ownership are not identical;
- `ReleaseInfo` contains exact version, commit, branch, build time, and main
  assembly identity inputs useful for compatibility evidence.

These source paths establish the need for liveness revalidation, input-owner
resolution, asynchronous completion, and exact identity. They do not prove
that every current provider implements those properties correctly.

### Runtime evidence limits

The strongest historical strict-v2 evidence is scoped to four preview.54 runs
and their exact environment. Across 216 recorded decisions:

| Outcome | Count |
|---|---:|
| `executed_and_settled` | 211 |
| `not_executed_stale_state` | 3 |
| `not_executed_non_actionable_state` | 2 |

This approximately 97.7 percent settled-decision rate is not a run-completion
rate, strategy score, current-build qualification, or proof of player-visible
information completeness. The source/Re revision mismatch also means it cannot
be transferred to the current checkout.

### Public comparison projects

The audit inspected these projects as implementation evidence, not as
authority:

- [Gennadiyev/STS2MCP](https://github.com/Gennadiyev/STS2MCP) exposes broad
  REST/MCP state and index-based actions with low implementation ceremony. It
  demonstrates fast coverage, but not state-bound entity identity or semantic
  settlement.
- [CharTyr/STS2-Agent](https://github.com/CharTyr/STS2-Agent) combines state,
  available-action discovery, main-thread action invocation, bounded waits,
  and an event stream. It demonstrates that streaming and focused waits can
  reduce polling without a large protocol. Its action request does not bind to
  the advertised `state_version`, and its request correlation is not a client
  idempotency contract.
- [wuhao21/sts2-cli](https://github.com/wuhao21/sts2-cli) runs the real game
  assembly in a patched headless harness with structured I/O and deterministic
  testing value. It is valuable as a future test host, but forced transitions,
  stubs, and fallback patches mean it cannot prove equivalence to live UI input
  ownership or player-visible behavior.

Official Godot guidance states that the active scene tree is not thread-safe,
which supports the current main-thread queue. Official Harmony documentation
shows that loaded Mods can patch methods at runtime, which means base game
source review alone is not a complete description of a modded process. Steam's
official update history shows continuing game, UI, lifecycle, and mod-loader
changes. Exact-environment revalidation is therefore necessary, but it should
be targeted and measurable rather than an ever-growing manual document ritual.

## Real Failure Catalog

| Failure | Minimal reproducible shape | Evidence | Current v2 response | Verdict |
|---|---|---|---|---|
| Stale entity/index | advertise hand index 2, another action removes a card, then execute index 2 | v1 request shape and mutable native collections | opaque `action_id` bound to `state_id`, exact operands, re-observation | Keep; core safety value |
| Early success acknowledgment | enqueue native work and return `ok` before child UI or inventory mutation settles | v1 action routes and asynchronous game Tasks | command lifecycle plus semantic completion | Keep; simplify and test per operation |
| Input-owner drift | shop room opens inventory or removal child while room remains the context | exact merchant source/UI lifecycle | one resolved active Surface publishes actions | Keep owner invariant; decouple from business taxonomy |
| Duplicate retry | client times out after commit, retries same logical mutation | generic distributed-command failure and current timeout states | request ledger and unknown-no-retry | Keep; define restart boundary explicitly |
| Wrong-thread mutation | HTTP/MCP handler touches the active scene tree | official Godot thread-safety contract | bounded main-thread queue | Keep |
| Publication/execution disagreement | provider publishes using one predicate and closure revalidates with another | 65 handwritten action drafts and per-provider closures | intended shared validation, not structurally guaranteed | Fix before expansion |
| UI closed but business effect absent | child overlay closes after cancel, redirect, or exception | treasure, merchant removal, enchant/upgrade lifecycles | action-specific completion witnesses | Keep; forbid close-only success when consequence is observable |
| Game update binding drift | same version family, changed assembly/hash/private member/lifecycle | current exact-build identities and Steam updates | exact environment gate | Keep safe default; add impact-scoped requalification |
| Mod semantic drift | patch Mod changes legality/commit/completion while UI class remains native | Harmony runtime patch model | exact Modset restriction | Keep fail-closed mutation; permit separately classified read-only degradation |
| Missing visible facts | legal action exists but deck, price, tooltip, intent, capacity, or child purpose is missing | prior enchant/shop/combat discoveries | Context/Surface/Inspection additions | Replace provider-by-provider discovery with a visible-information inventory |
| Cross-language contract drift | Bridge emits preview.54 while Re decodes preview.56 | current clean checkout | no effective guard in CI | Critical unresolved blocker |
| Restart ambiguity | process restarts after submit and loses in-memory ledger | current ledger lifetime | command becomes unresolvable | Document and implement explicit epoch/session semantics; never replay blindly |
| Concurrent controller/human input | another process or the player mutates state between choose and submit | architecture review; Re lock covers only Re processes | state binding rejects some races, but no gateway mutation lease | Add optional short controller lease without hiding human state changes |

## v1 Audit

### What v1 did well

v1 achieved broad coverage quickly. It directly exposed familiar state and
actions, was easy to inspect with REST/MCP tools, and remains useful as a
diagnostic transport. Public projects show that this approach is enough for
short controlled demonstrations and can be substantially simpler than the
current v2 provider inventory.

### Real v1 defects

v1 places correctness obligations on the client that the client cannot always
satisfy:

- an index is not a stable game entity identity;
- a client cannot infer whether an asynchronous native task completed merely
  because an HTTP handler accepted it;
- separately reconstructed state and action legality can drift;
- retry semantics are undefined after timeout;
- nested input ownership is flattened into endpoint choice;
- completeness is implicit, so absent information is indistinguishable from
  unsupported information.

These defects justify a new mutation contract. They do not justify rewriting
every read path or every game concept as a unique Surface.

### v1 retirement rule

v1 must retire per operation and journey, not by provider count. An operation
can leave the default path only when v2 has:

1. player-visible fact parity for that decision;
2. advertised legal actions tied to exact entities;
3. publication/execute validation parity;
4. native commit and semantic completion evidence;
5. current-environment canary evidence;
6. Re conformance and run recording;
7. a measured fallback/unknown rate no worse than the accepted threshold.

Explicit v1 diagnostic mode may remain. `auto` must not silently mix v1 facts
or mutations into a v2 decision.

## v2 Mechanism Audit

| Mechanism | Decision | Reason |
|---|---|---|
| One active input owner | Retain | Native overlays and child screens really transfer input ownership |
| Context | Retain, narrow | Represents room/run/combat setting and durable visible facts, not the current command owner |
| Surface | Retain, narrow | Represents the active player interaction and visible choice shape; not a permanent strategy class or qualification key |
| Stage | Retain only for observable lifecycle | Useful for select/preview/confirm and transition phases; avoid artificial stages created only for implementation convenience |
| Opaque state-bound action | Retain | Directly fixes stale indices and arbitrary command synthesis |
| Exact entity operands | Retain | Needed to validate identity and completion across mutable collections |
| Main-thread dispatch | Retain | Required by the live Godot host |
| Shared legality validation | Strengthen | The invariant is correct, but handwritten publish predicates and execute closures can still diverge |
| Command ledger | Retain, scope honestly | Provides in-runtime idempotency and outcome tracking, not durable exactly-once execution across restart |
| Completion witness | Retain, constrain | Use a small typed predicate library and operation-specific composition; do not build an executable Effect DSL |
| Read-only Inspection | Retain | Separates optional player-openable detail from mutation authority |
| Exact-environment gate | Retain | Necessary for mutation safety; split observation compatibility from mutation permission |
| Typed contract/evidence manifest | Retain as non-authorizing | Useful for drift detection and audit; existence must never grant permission |
| Contract-instance shadow | Freeze pending evidence | It currently adds telemetry complexity without repairing cross-language truth or proving migration benefit |
| DecisionFrame/Transaction IR | Defer | Broad IR is premature until repeated multi-step contracts show a concrete reduction in duplication |
| Python MCP server | Keep optional and thin | It should adapt the connector contract, not become a second game model |
| Strict Re decoder | Retain, generate/verify | Fail-closed decoding is correct; duplicated handwritten schemas are not |

## Where v2 Is Overbuilt

The current Bridge has 22 Surface provider files, roughly 11,385 lines under
game-specific Bridge code, 65 action-draft constructions, and a protocol DTO
file over 1,000 lines. Re duplicates substantial protocol and normalization
logic in more than 5,000 lines across its principal connector files.

This complexity is not automatically wrong. The problem is that the repository
does not yet show the expected payoff:

- there is no current cross-language conformance gate;
- current docs and source disagree about protocol and authority;
- player-visible coverage remains an estimate rather than an inventory with
  measurable closure;
- no metric shows that adding a content update using existing mechanics now
  requires near-zero connector code;
- historical decision outcomes do not report complete-journey success, mean
  time to recover, or v1 fallback share;
- publication and execution validation are still easy to duplicate.

The correct response is not to remove the safety kernel. It is to stop growing
the taxonomy until the kernel is centralized and its benefits are measured.

## Critique Of The Supplied Architecture Inputs

The supplied real-connector audit and product-deployment note identified
important problems, but their recommendations are accepted selectively.

Accepted:

- treat the game-side component as a semantic Gateway rather than the whole
  Agent;
- keep model providers, BYOK secrets, orchestration, and heavy product
  dependencies in an external Companion;
- define separate Game Connector and Agent Runtime contracts;
- stop treating MCP as the architecture core;
- centralize source binding, legality, commit, completion, and environment
  permission around a small safety kernel;
- repair the preview.54/preview.56 drift before claiming current support;
- preserve live and future headless hosts as independently qualified adapters.

Corrected or deferred:

- a broad `TransactionContext` or Transaction IR is not the first repair. Most
  simple actions need only an advertised action, exact operands, one validator,
  native commit, and one witness;
- exact-build mutation failure should not be weakened into a warning merely to
  improve compatibility. Tiered degradation is appropriate for separately
  proven read-only observation, not uncertain mutation;
- a Companion/plugin platform is a product milestone, not a prerequisite for
  fixing the connector contract;
- generated manifests and source analysis may detect drift but cannot
  self-authorize an operation;
- event streaming is useful only if measured polling/latency data justifies it;
- a headless host is not a simpler substitute for live UI qualification;
- a shared witness library must remain predicates over observed consequences,
  not an Effect DSL capable of expressing or executing arbitrary game changes.

The supplied documents are therefore retained as problem framing. The staged
order and authority decisions in this report replace their implementation
order where they conflict.

## Selected Target Architecture

```text
Real STS2 process
  -> Source Bindings
       exact native objects, visible controls, native legality and commit paths
  -> In-game Semantic Gateway Mod
       environment probe
       visible-state assembler
       active-input-owner resolver
       semantic operation registry
       shared validator
       opaque action factory
       command manager
       completion witnesses
       read-only inspection service
  -> versioned Game Connector Contract
  -> local REST/IPC adapter
  -> external Companion Runtime
       strict generated decoder
       controller session
       model/API providers and secrets
       agent loop and records
       optional MCP adapter
  -> Re-SpireAgent strategic runtime
```

### Why this boundary

The in-game Mod is the only component that can authoritatively observe native
objects, use native legality, invoke native commit paths, and witness native
completion. It should remain small enough to survive game updates and safe
enough for Workshop distribution.

Model credentials, provider SDKs, agent orchestration, logs, local policy, and
heavy dependencies should remain outside the game process. This reduces secret
exposure, game-thread stalls, Workshop packaging complexity, and crash blast
radius. MCP is one optional client-facing adapter over the same connector
contract, not the architecture core.

### Core semantic split

The wire model should distinguish these concepts instead of overloading
`Surface`:

| Concept | Owns | Does not own |
|---|---|---|
| Context | room/run/combat setting and durable visible facts | current input authority |
| Active Interaction | exact current input owner, visible choice shape, and lifecycle stage | strategic classification |
| Operation | semantic mutation such as play card, buy relic, remove card, choose route | UI implementation identity |
| Origin Binding | why and from which native source the operation exists | permission by itself |
| Operand | exact player-visible entity references used by the operation | arbitrary native object access |
| Validation | publication legality plus execute-time liveness | commit or completion |
| Commit Adapter | one native game-owned mutation path | inferred success |
| Completion Witness | observable operation-specific success/rejection/unknown | arbitrary effect execution |
| Permission | environment-scoped authorization for operation plus binding | implementation existence |

Simple actions do not need a heavyweight transaction object. A transaction is
introduced only when evidence shows a parent/child lifecycle, multi-step commit,
or delayed result that cannot be represented by one command and witness.

### Canonical connector contract

One versioned contract package should own:

- JSON Schema or an equivalent language-neutral schema;
- canonical enum and discriminant inventory;
- compatibility fixtures for every active union branch;
- negative fixtures for unknown/extra/contradictory authority;
- generated or mechanically checked C# and TypeScript views;
- protocol and schema version compatibility rules;
- an environment and permission manifest schema that is explicitly
  non-authorizing without runtime enforcement.

CI must serialize representative C# responses and decode them with the exact Re
decoder. Independent unit suites are insufficient.

### Command semantics

The mutation contract should promise at-most-once handling within one gateway
runtime epoch:

```text
advertise(state_id, action_id, operation, exact operands)
  -> submit(controller_session, request_id, state_id, action_id)
  -> execute-time validation
  -> native commit
  -> completed | rejected | failed | timed_out_unknown
```

Required additions:

- a runtime epoch in every command identity;
- explicit `unknown_after_restart` rather than a fabricated not-found/retry;
- a short mutation controller lease so two external agents cannot submit
  concurrently;
- human input remains observable and may invalidate state; it is not silently
  blocked by default;
- no automatic retry after any potentially committed unknown outcome.

### Player-visible information model

"All player-visible information" must be an auditable closure goal, not a raw
object dump or a claim inferred from provider count.

| Layer | Content |
|---|---|
| Shared state | run/player facts continuously visible or normally available without changing input ownership |
| Context | current room/combat/map semantics and durable local facts |
| Active interaction | controls, choices, prices, targets, constraints, current stage, and exact input owner |
| Tooltip/preview | text and structured details the player can reveal without committing |
| Inspection | optional read-only views such as deck, piles, shop catalog, map detail, history |
| Transient lifecycle | animation, pending child, preview/confirm, and temporarily disabled control state relevant to actionability |
| Diagnostics | completeness, unsupported fields, degraded bindings, ambiguity, and authority reasons |

Each field family needs:

- native source binding;
- visibility condition;
- identity and freshness semantics;
- strategic/action/completion criticality;
- hidden-information classification;
- omission behavior and diagnostic;
- fixture and current-build evidence state.

Negative tests must prove that draw order, hidden RNG, unrevealed future events,
unrevealed rewards, and future enemy actions are not exposed. A visible-data
claim is incomplete until both inclusion and exclusion are tested.

## Update And Mod Compatibility

### Two independent compatibility axes

Observation compatibility and mutation permission must not be collapsed:

- a build may safely expose a limited, verified read-only snapshot with
  structured warnings while all mutation remains disabled;
- mutation requires exact owner, binding, legality, commit, completion, and
  environment evidence;
- missing action-critical or ownership-critical facts force mutation closed;
- unknown optional tooltip detail may degrade one inspection without disabling
  unrelated already-proven observation.

### Environment identity

The runtime identity should include:

- game version, commit, branch, main assembly hash, and relevant module MVIDs;
- Gateway Mod version, source revision, assembly hash, MVID, and runtime epoch;
- all loaded gameplay Mods with stable IDs, versions, assembly hashes, and
  patch-owner information where available;
- connector contract version and permission-manifest digest.

Exact identity is the safe default. Later targeted inheritance is allowed only
when an impact analyzer can prove that the relevant source binding, visible
fields, validation, commit, and witness are unchanged. Version equality or ABI
similarity alone is not permission.

### Mod classes

| Mod change | Default treatment |
|---|---|
| Pure data using an already verified native semantic path | reuse contract only after source binding and visible entity decoding pass; independent canary required |
| New origin using an existing interaction and business outcome | reuse mechanics; add typed origin binding and independent permission evidence |
| New subtype or constraint | extend semantic contract and validator; no inherited mutation authority |
| New mechanic/business outcome | new operation and witness, possibly a new interaction contract |
| Runtime patch of legality/commit/completion/owner | disable affected mutation until exact patch impact is audited |
| Unknown Mod | read-only only where observation closure is still provable; otherwise fail closed |

Harmony patch ownership should be captured when practical. It is evidence for
impact analysis, not an automatic compatibility oracle.

## Architecture Alternatives Rejected

### Keep current provider-per-purpose growth

Rejected as the default path. It preserves semantics but duplicates DTOs,
decoders, validators, completion code, permission records, and docs faster than
the repository can keep them coherent.

### Return to v1-style generic index actions

Rejected for mutations. It is simple but reintroduces known stale identity,
early acknowledgment, and retry ambiguity. Broad v1 reads may remain useful
while their visible-source and hidden-information boundaries are audited.

### Universal UI tree or click API

Rejected. It exposes mechanism without game legality or semantic completion,
creates hidden authority, and makes the external agent reconstruct native
business rules.

### Universal Effect or Witness DSL

Rejected. Completion predicates may share a small internal library, but a wire
DSL capable of describing arbitrary effects would become a second game engine
and a new execution surface.

### Full Transaction IR now

Deferred. Multi-step correlation is real, but current evidence does not show
that a broad IR will reduce more duplication than it creates. Build only the
smallest typed transaction record after at least three independent lifecycles
share the same proven obligations.

### Put the full Agent and API keys in the Workshop Mod

Rejected. It increases secret, dependency, update, game-thread, and crash risk.
The Mod should be a semantic Gateway. The external Companion should own BYOK
providers and agent execution.

### Headless runtime as the current connector

Deferred as a separate host. A patched headless harness can improve tests and
throughput, but it does not establish live UI equivalence and must have its own
binding, visibility, permission, and evidence profile.

## Measurable Success Criteria

The migration must replace narrative confidence with metrics.

| Metric | Purpose | Initial gate |
|---|---|---|
| Cross-language contract conformance | prevent preview/source drift | every active C# fixture decodes in Re; every negative fixture fails closed |
| Ordinary journey completion rate | measure product usefulness | report per journey and exact environment, not one aggregate |
| v2/v1/fail-closed step share | measure real migration | every decision records its owner; no mixed journey called all-v2 |
| Settled/unknown/rejected/error rate | measure command reliability | zero duplicate execution; unknown separately visible |
| Stale refusal precision | ensure safety does not become false blocking | sample refusals and classify true race vs overstrict state identity |
| Settlement latency p50/p95/max | detect lifecycle and polling debt | per operation and environment |
| Controller conflict rate | expose concurrent mutation | zero unclassified dual-controller mutation |
| Visible-information closure | measure decision-relevant completeness | field-family inventory with included/missing/hidden evidence |
| Update blast radius | test compatibility architecture | count operations disabled/requalified per game update |
| Existing-mechanic content cost | test abstraction quality | new card/relic using an existing verified mechanic should normally need data/binding evidence, not a new Surface |
| v1 retirement regressions | prevent premature removal | no journey loses action or visible-fact parity |

The repository does not currently have trustworthy baselines for most of these
metrics. Establishing them is part of the migration, not optional reporting.

## Migration Plan

### Stage 0: Source Truth Repair

Goal: make one clean checkout produce one compatible, testable connector.

Work:

1. Choose the actual current protocol revision from the merged feature set.
2. Align Bridge source, Re schema, docs, examples, and installed artifact.
3. Add the missing Bridge fields/source literals or remove unsupported Re
   expectations. Do not paper over the disagreement with decoder fallbacks.
4. Add a cross-language conformance fixture suite and protocol compatibility
   CI gate.
5. Build Release, install it, launch through Steam, and record loaded SHA,
   MVID, runtime epoch, game identity, and Modset.
6. Reclassify all older exact-identity evidence as historical without deleting
   it.

Exit:

- source, installed, loaded, Re, capabilities, permission, and docs agree;
- a strict read-only observation round trip passes;
- one already-qualified low-risk action canary settles on the exact identity;
- no new operation is authorized.

### Stage 1: Reliability Baseline And Truthful Coverage

Goal: establish measurable current behavior before structural refactoring.

Work:

- record per-step `v2 | v1 | fail_closed`, operation, environment, command
  outcome, settlement latency, and visible-data completeness;
- define five ordinary journey families: run start, map-to-combat-to-reward,
  rest/shop child flow, event child flow, and game-over return;
- execute bounded organic journeys and classify every stop;
- replace percentage guesses with evidence counts and explicit unsupported
  families.

Exit: current exact-environment baseline report exists and can be reproduced.

### Stage 2: Safety Kernel Consolidation

Goal: reduce duplicated safety logic without broad protocol redesign.

Work:

- introduce one typed semantic operation registry;
- make publication and execute-time validation call the same validator, with
  execute-time liveness checks added rather than rewritten;
- add runtime epoch and explicit restart-unknown semantics;
- add a short external controller session/lease;
- extract a small internal completion-predicate library while retaining
  operation-specific witnesses;
- keep manifests non-authorizing.

Exit:

- mutation tests prove publish/execute parity;
- duplicate request and restart simulations cannot double execute;
- controller conflicts fail closed and are diagnostic;
- no provider receives broader authority.

### Stage 3: Player-Visible Information Closure

Goal: make observation completeness explicit and testable.

Work:

- create a source-bound visibility inventory by field family and interaction;
- separate shared, context, active interaction, preview, inspection, transient,
  and diagnostic data;
- add negative hidden-information tests;
- add on-demand inspection only where a normal player can reveal the same
  information without committing;
- remove Re local reconstruction only after source-bound parity is proven.

Exit: each supported journey has a visible-information completeness record and
no critical field is silently absent.

### Stage 4: Journey-Driven v1 Retirement

Goal: migrate coherent gameplay, not isolated provider counts.

Priority:

1. menu, character select, run start, and continue;
2. map, ordinary combat, generated/selected cards, settlement, and rewards;
3. rest, upgrade/enchant/remove children, and return to map;
4. shop inventory, potion capacity, removal child, and proceed;
5. events, linked rewards, special choices, and return;
6. boss transitions, victory/loss, history, and main-menu return.

Each journey records mixed ownership honestly. Retire v1 per operation only
after the retirement rule in this report passes.

### Stage 5: Update And Mod Compatibility

Goal: turn exact-build safety into a maintainable revalidation system.

Work:

- add load-time binding probes and a machine-readable compatibility report;
- inventory patch owners and source-binding dependencies;
- distinguish observation degradation from mutation permission;
- implement targeted requalification manifests that can only preserve or
  narrow prior authority;
- test pure-data Mod, existing-semantic new origin, new subtype, new mechanic,
  and unknown patch-Mod cases separately.

Exit: an update produces a bounded impact report and unrelated proven reads do
not fail solely because one optional binding changed. Mutation remains closed
where impact is unknown.

### Stage 6: Product Connector Packaging

Goal: make the connector installable and operable by players.

Work:

- package the minimal Gateway Mod for Workshop-compatible installation;
- build an external Companion with process discovery, health, controller
  session, strict contract negotiation, local records, and BYOK provider
  configuration;
- expose REST/IPC as the primary connector and MCP as an optional adapter;
- add one-command diagnostics that report source/installed/loaded identity
  without exposing secrets;
- define update, rollback, crash recovery, and support bundle procedures.

Exit: a fresh machine can install, negotiate, run a bounded ordinary journey,
diagnose incompatibility, and roll back without editing game files manually.

### Stage 7: Evidence-Driven Optimization

Only after the earlier metrics exist:

- consider event streaming if polling latency or load is measured as a problem;
- consider a typed transaction model if repeated lifecycles prove shared
  obligations;
- consider generated native binding inventories if update blast radius remains
  dominated by manual source auditing;
- consider a headless host as a separately qualified adapter.

## Immediate Engineering Sequence

| Work item | Scope | Runtime authority |
|---|---|---|
| PR 0: protocol truth repair | C#/TS/docs alignment and compatibility fixtures | unchanged |
| PR 1: end-to-end contract CI | serialize Bridge fixtures, decode in Re, negative drift cases | unchanged |
| PR 2: exact loaded identity closeout | build/install/load/read-only observation and one existing canary | no expansion |
| PR 3: reliability telemetry | journey owner/outcome/latency/completeness reporting | unchanged |
| PR 4: shared validator pilot | one combat and one shop operation, behavior-preserving | unchanged |
| PR 5: epoch and controller lease | command restart/conflict safety | unchanged or narrower |
| PR 6: visibility inventory pilot | combat and shop decision facts plus hidden negative tests | read-only only |
| PR 7+: journey slices | migrate highest-value remaining v1 operations | per-slice evidence gate |

Do not begin broad DecisionFrame/Transaction IR work, add more canary Surfaces,
or claim current-build qualification before PR 0 through PR 2 close.

## Current Support Truth

At the end of this audit:

- Bridge v2 has a historically exercised safety kernel and substantial source
  implementation;
- v1 still provides broader diagnostic/legacy coverage;
- the current C# source and Re source are not protocol-compatible;
- the installed DLL is not proof that the current checkout works with current
  Re;
- no current live process establishes loaded identity;
- historical qualification remains valuable only inside its recorded exact
  environment;
- current all-visible-information and v1-parity percentages are planning
  estimates, not measured product completion;
- no permission, canary, qualification, or v1 retirement is changed by this
  report.

## Durable Decisions

1. Retain the v2 safety kernel because it addresses reproduced failure modes.
2. Narrow `Surface` to active interaction ownership and visible shape.
3. Make operation, origin binding, permission, and completion explicit and
   independently testable.
4. Establish one generated or mechanically conformed connector contract.
5. Separate read compatibility from mutation authority.
6. Measure journey reliability and migration rather than provider count.
7. Keep the game-side component a minimal semantic Gateway and move Agent,
   secrets, providers, and orchestration into an external Companion.
8. Treat MCP and future headless execution as adapters, not the live connector
   architecture.
9. Defer broad transaction/IR abstraction until repeated evidence proves net
   simplification.
10. Repair source truth before expanding coverage.

## References

Repository evidence:

- [Bridge v2 current status](CURRENT_STATUS.md)
- [Player-visible coverage matrix](PLAYER_VISIBLE_COVERAGE.md)
- [Live connection boundary](LIVE_GAME_CONNECTION_BOUNDARY.md)
- [Architecture evolution plan](ARCHITECTURE_EVOLUTION_PLAN.md)
- [Protocol](PROTOCOL.md)
- [Re integration](../../../Re-SpireAgent/docs/BRIDGE_V2_INTEGRATION.md)

Primary external evidence:

- [Gennadiyev/STS2MCP](https://github.com/Gennadiyev/STS2MCP)
- [CharTyr/STS2-Agent](https://github.com/CharTyr/STS2-Agent)
- [wuhao21/sts2-cli](https://github.com/wuhao21/sts2-cli)
- [Godot thread-safe APIs](https://docs.godotengine.org/en/latest/tutorials/performance/thread_safe_apis.html)
- [Harmony patching model](https://harmony.pardeike.net/articles/patching.html)
- [Official Slay the Spire 2 Steam announcements](https://steamcommunity.com/app/2868840/announcements/)
