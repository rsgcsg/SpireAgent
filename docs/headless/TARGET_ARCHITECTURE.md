# Headless STS2 Target Architecture

Status: proposed future subproject; no implementation or authority.

The product relationship and host-independent gates are also audited in the
[Real Productization Architecture Audit And Roadmap](../product/REAL_PRODUCTIZATION_ARCHITECTURE_AUDIT_AND_ROADMAP_2026-07-22.md).

## Purpose

The Headless project may eventually support deterministic replay, evaluation,
batch runs, differential testing, and a semantic GUI without requiring a
visible official game window. It is not a shortcut around the current live
Semantic Gateway and must not become a second hand-written STS2 rules engine.

## Required Relationship To Live

```text
Live STS2 host ----> Live host adapter -----\
                                           -> protocol-neutral gateway contract
Future Headless host -> Headless adapter --/       -> REST/MCP/JSONL clients
```

The diagram describes a target boundary, not current shared code. Extraction
of a shared package is allowed only after live implementation evidence shows a
pure, stable boundary. The current Bridge binary and Provider classes are not
a ready-made shared kernel.

Live and Headless may share:

- protocol-neutral value types and structural schemas;
- `state_id`, opaque action, and exact operand rules;
- Command state-machine semantics and typed errors;
- transaction phase and finite Witness obligation grammar;
- visibility and hidden-information policy;
- environment/evidence record shapes;
- conformance fixtures and semantic differential test tooling.

They must keep separate:

- scene/UI and native object bindings;
- owner sources and Commit adapters;
- async/task pumping and lifecycle patches;
- original/runtime assembly identity and patch manifests;
- admin/test controls;
- runtime evidence, canary, qualification, and permission.

## Candidate Host Forms

Two host forms are plausible but neither is selected:

1. An official-process offscreen/headless host that preserves the real Godot
   runtime and scene lifecycle.
2. A synthetic real-DLL host that replaces or patches runtime dependencies.

The first Headless engineering phase must be a time-boxed feasibility
comparison and must select at most one initial host. Maintaining both from the
start is not justified. Godot's `--headless` switch proves display/audio mode,
not STS2 business equivalence. A synthetic host's stubs and IL/Harmony patches
create a distinct runtime identity and semantic risk.

## Live Admission Gate

No substantive Headless code, project skeleton, shared-kernel extraction, or
permission profile begins until all of the following are explicitly recorded:

1. The live gateway naming and ownership boundary is stable and current code,
   protocol, Re, capability, permission, and docs agree.
2. Language-neutral Connector fixtures prove cross-language structural and
   negative conformance; no single named Surface is used as a proxy for the
   contract as a whole.
3. Authenticated sessions, one controller lease, runtime epoch, restart, and
   unknown-no-retry behavior are implemented and fault-tested on the live host.
4. Representative source-bound parent/child lifecycles prove owner, exact
   operands, publication/execution predicate parity, native Commit, semantic
   completion, timeout/fault, and cleanup without broadening actions.
5. The bounded visibility/Inspection contract is coherent and its remaining
   incompleteness is explicit; adapter drift is detected by conformance checks.
6. A freshly installed and loaded exact live artifact has environment identity
   plus measured ordinary-journey and fault evidence without borrowing an old
   MVID or another host's permission.
7. A deliberate architecture review identifies a genuinely host-neutral
   contract boundary, approves one first host experiment, and records licensing
   and proprietary-dependency constraints.

Passing this gate does not grant Headless action authority. It only permits an
isolated implementation experiment.

## Future Phases

### H0: Boundary Documentation

Current phase. Keep Headless documentation separate, record candidate hosts,
shared/non-shared contracts, licensing, admission, and rollback. No code or
runtime change.

### H1: Host Feasibility Decision

Audit current STS2/Godot dependencies and compare official offscreen versus
synthetic hosting. Do not run agent actions. Select one bounded initial host or
stop if neither can preserve the required semantics.

Exit: exact assumptions, source evidence, proprietary dependency handling, and
semantic risks are documented. Rollback: retain docs only.

### H2: Identity-Only Bootstrap

Start an isolated process, locate user-owned game files without guessing,
report original/runtime hashes, host revision, patch/stub manifest, Modset, and
runtime instance, then exit. No gameplay, strategy, or authority.

Exit: missing or changed inputs fail closed and no proprietary file enters Git.
Rollback: remove the isolated bootstrap.

### H3: Read-Only Observation

Start one fixed test run and project a minimal player-visible state through the
same structural contract. No actions. Hidden pile order, RNG, future event
results, and debug truth remain excluded.

Exit: visible facts and omissions are explicit and can be shadow-compared with
the live host. Rollback: disable the adapter.

### H4: One Native Choice

Intercept one real game-owned bounded selection, preserve its native waiting
Task, publish exact opaque options, revalidate, resume the same Task, and prove
one semantic post-state. Handle success, fault, cancel, reset, timeout, and
process exit.

Exit: one-owner and negative tests pass; no index is a durable action identity.
Rollback: return to read-only.

### H5: Command And Transaction

Use the shared Command semantics and a host-scoped transaction record for the
single choice. Unknown outcomes are not retried. Admin controls remain on a
separate disabled test plane.

Exit: parent/child Task and Witness lifecycles are explainable. Rollback:
disable action submission.

### H6: Differential Evidence

Run matched exact-build live and Headless traces. Compare owner, visible facts,
semantic action sets, operands, native Commit, transaction phases, Witnesses,
and visible results while classifying allowed host/timing differences.

Exit: representative traces reach an explicitly selected equivalence level;
all divergence is classified. Live remains authoritative. Rollback: Headless
returns to experimental read-only.

### H7: Scoped Experimental Canary

Only a separately approved Headless environment and contract may become a
Headless canary. It cannot inherit live qualification or expand live authority.

## Acceptance Criteria

Every actionable Headless slice must preserve:

- exactly one current input owner;
- player-visible projection and hidden-information exclusions;
- opaque state-bound actions and exact runtime operands;
- publication/execution legality parity and execute-time revalidation;
- a game-owned Commit path rather than an executable effect DSL;
- idempotent Command and explicit native transaction lifecycle;
- semantic Witnesses for every declared side effect;
- unknown outcome without automatic retry;
- exact host, original/runtime assembly, patch/stub, Modset, and runtime
  identity;
- host-scoped evidence and permission;
- disabled, isolated admin/test mutation;
- a reversible rollout and visible-host fallback.

## `sts2-cli` Reference Verdict

This audit directly read source at
[`wuhao21/sts2-cli@d11aa883b582dd68bd39b331f3370746b30d447e`](https://github.com/wuhao21/sts2-cli/tree/d11aa883b582dd68bd39b331f3370746b30d447e)
without building or running it.

Useful demonstrated mechanisms:

- a separate JSON stdin/stdout process over real STS2 types;
- local game-file setup and a synthetic `GodotSharp` substitute;
- native TestSupport run setup;
- a pending card selection backed by `TaskCompletionSource` and exact
  `CardModel` objects;
- broad regression fixtures and deterministic controls.

Reasons it is not the SpireAgent gateway contract:

- setup rewrites copied `sts2.dll` methods with Mono.Cecil and uses Godot
  stubs, so it is a distinct synthetic runtime;
- `RunSimulator` combines host lifecycle, projection, decision detection,
  action execution, compatibility patches, save/load, and debug mutation;
- decision detection uses ordered checks instead of an explicit 0/1/N owner
  proof;
- executable actions use string names and current array indices rather than
  state-bound opaque IDs;
- agent actions and `set_player`/`enter_room`/`set_draw_order` controls share
  one command router;
- no first-class exact-environment permission, idempotent Command ledger,
  cross-decision transaction record, or closed semantic Witness plan was found;
- its own fixed commit contains a card-specific Dismantle preview branch,
  illustrating the difference between useful strategy preview and general
  executable semantics.

Its MIT license covers that repository's source, not STS2 assemblies or game
assets. Any future reuse requires attribution and a separate proprietary-file
distribution review.

## Re-SpireAgent Boundary

Re should use the same connector and structural state contract for any future
host. Host identity may be recorded and compared, but strategy code must not
grow live-versus-headless content branches. Host-specific legality, Commit,
transaction, Witness, permission, and evidence remain in the game integration
layer.

## Open Questions

- Can the official STS2 process reach useful run states with a headless/offscreen
  display while preserving scene-owned business handlers?
- Which current live Bridge types are actually pure enough to extract after the
  transaction pilot?
- What semantic equivalence level is necessary for replay/evaluation versus
  any future action canary?
- How can proprietary local dependencies be tested in CI without copying game
  files?
- Which timing differences are harmless, and which change hooks, owner overlap,
  RNG consumption, or transaction completion?
