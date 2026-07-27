# Workflow C Fact-First Connector Architecture Audit

Date: 2026-07-27  
Repository baseline: `develop` at `594173a7280706edd50f5c80bae1215c8fd724fc`  
Scope: `STS2MCP/`, `Re-SpireAgent/`, current Connector tools, canonical docs,
local exact-environment evidence, and the five 2026-07-27 architecture inputs.

Decision follow-up: this audit is the evidence basis for
[ADR-0002](../decisions/ADR-0002-semantic-gateway-two-plane-target-architecture.md),
which now owns the single accepted target architecture and migration
constraints. This report remains an audit, not a second architecture authority.
Its pre-cold-load Preview.67 statements are historical snapshot facts; current
loaded identity and readiness are owned by
[current status](../STATUS.md) and the
[Preview.67 operator closeout](PREVIEW_67_OPERATOR_READINESS_CLOSEOUT_2026-07-27.md).

## Executive Verdict

The current Connector is neither a failed architecture nor a completed
product. It has a valuable, evidence-backed safety kernel and a broad bounded
ordinary-single-player path, but its control/evidence machinery has become too
entangled with hot observation identity and operator workflow.

Retain:

- game-owned legality and effects;
- one current input owner;
- player-visible semantic projection instead of raw object dump;
- opaque exact actions, publication/execution parity, execute-time
  revalidation, native Commit, operation-local completion, unknown-no-retry;
- independent read-only Inspection;
- exact loaded game/Gateway/Modset/Patch provenance and local quarantine;
- Re as a strict advertised-action consumer.

Correct or simplify:

- separate game-semantic state from current authority projection and audit
  history;
- keep full evidence available but stop treating a roughly 580 KB capability
  and complete control history as a normal hot-path identity input;
- measure mainline-A continuity and transition recovery, not operation count;
- treat 82 manifest-derived contracts as test-confirm candidates, not broad
  semantic adaptation;
- provide one thin operator CLI over existing tools instead of more manual
  copy/paste workflows.

Reject now:

- universal transaction, effect, selector, purchase, or visibility DSL;
- a second game-state or permission engine outside the Gateway;
- qualification count as Connector completion;
- generic full-state Prompt compression after its paired provider experiment
  changed decisions on reward scopes;
- an Artifact Router without a demonstrated ABI/load requirement;
- automatic authority inherited from version, Mod manifest, static fingerprint,
  historical MVID, or one successful canary.

## Evidence Boundary

| Claim | Evidence | Level |
|---|---|---|
| Source branch and commit | local Git plus fetched `origin/develop` equality | direct repository fact |
| Preview.66 loaded identity and one persistent operation | two recorded Re runs, loaded capability identity, cold-restart closeout | exact historical local runtime evidence |
| Current broad ordinary path | multiple long Re runs, 736 settled decisions in the 40 newest inspected runs | local run evidence, not complete-game qualification |
| State/control identity coupling | `BridgeV2Runtime.Observe()` hashes visibility, contract, permission and qualification snapshots into `state_id` | direct source fact |
| Prompt size pressure | 808 measured calls: median about 7,955 tokens, p95 about 30,030; combat piles reached about 35,823 | local run measurement |
| Generic projection unsafe | paired and repeated DeepSeek shadow comparisons changed reward/card-reward choices | provider experiment; no live rollout |
| New Preview.67 identity split | contract tests and strict Re decode only until a fresh loaded run exists | implementation/fixture evidence |
| Cross-version/Mod generality | no representative real Mod or third environment qualification | unsupported claim |

Compilation, fixtures, disk SHA, loaded identity, session canary, Organic
operation evidence, and persistent qualification remain separate evidence
classes.

## Findings By Severity

### Critical: state identity mixes game truth with audit history

`BridgeV2Runtime.Observe()` first hashes the semantic draft and shared state,
then re-hashes the entire visibility, contract shadow, permission ledger and
qualification ledger into the authoritative `state_id`. This can invalidate an
otherwise unchanged action because unrelated historical control data changed.
Preview.67 introduces a non-authorizing dual identity shadow and negative
tests. It does not switch authority.

### High: hot-path evidence is too large and poorly scoped

Capabilities are roughly 580 KB because they include complete operation,
permission and qualification inventories. Full evidence is useful for audit,
but current-action admission needs only the exact current Surface/operation
projection. A future protocol change should add summary plus on-demand detail,
then compare dual reads before removing any current field. Pagination is a
transport/evidence optimization, not permission weakening.

### High: Connector progress is measured too much by coverage and grants

One persistent qualification and 86 session canaries do not prove reliable
continuous play. The latest run corpus shows both long journeys and genuine
unsupported states. Mainline A needs explicit continuity metrics: settled
decision rate, unsupported-state rate by semantic family, stale precommit
recovery, transition timeout, unknown outcome, and bounded run completion.

### High: fallback contracts are conservative but semantically weak

The 82 manifest-derived identities reduce literal code enumeration, but a
non-empty current witness plus exact operation name is still test-confirm
evidence, not proof that a new source or Mod preserves business purpose,
operand visibility, native Commit, or completion. They may seed trials; they
must not become automatic permanent authority merely by accumulating count.

### Medium: Re's full Prompt preserves truth but carries governance noise

Current full `NormalizedCurrentState` avoids lossy hidden reconstruction, yet
some scopes exceed 30k input tokens and include low-value governance metadata.
The already-tested generic compact projection changed decisions and remains
rejected. Any next projection must be Surface/scope-specific, paired on the
same evidence, and independently retrievable from the full envelope.

### Medium: the operator workflow was fragmented

Build, install, loaded verification, evidence capture, migration, revoke and
rollback existed, but only as separate scripts and README fragments. The new
root `connector` CLI is a thin orchestrator. It hashes artifacts and delegates
to existing tools; it does not interpret game rules or grant authority.

### Medium: Runtime Supervisor is only partly implemented

Re's `TickOrchestrator` has bounded retries, progress guards, stale-state
handling and terminal unknown outcomes, but it is still an evidence-runner,
not a product supervisor. Restart reconciliation, user-facing unknown-command
recovery, and long-lived process supervision belong to later Companion work.
They must not be simulated by retrying uncertain commands.

## Architecture Decision

Adopt the candidate direction only as responsibility boundaries:

| Candidate | Decision |
|---|---|
| Complete Observation Envelope | retain; later separate hot summary from on-demand audit detail |
| A-side deterministic DecisionProjection | conditional; Re-owned and scope-evidenced, generic v1 rejected |
| bounded native Transaction Adapter | retain only where exact repeated game mechanics prove value |
| exact BoundAction | already present as opaque state-bound action; retain |
| action-local Outcome Oracle | retain existing purpose-specific completion probes; reject universal Oracle DSL |
| transition-aware Runtime Supervisor | improve incrementally from observed failures; do not move completion to Re |
| Compatibility/Evidence Control Plane | retain but remove it from future semantic-state identity and hot payload |
| Environment Profile | retain as non-authorizing local index |
| risk-tier Trial/Migration Campaign | retain as D tooling; Gateway remains authority |
| conditional Artifact Router | reject until a real ABI/load split proves it necessary |

The useful core remains:

```text
STS2 source/UI facts
  -> bounded semantic adapter + one input owner
  -> complete observation evidence
  -> exact advertised BoundActions
  -> Gateway permission and execute-time validation
  -> native Commit + action-local completion
  -> REST/MCP transport
  -> strict Re consumer + evidenced consumer view
```

This is a dual-plane responsibility model, not two independent game states.

## External Comparisons

- [Godot thread-safe APIs](https://docs.godotengine.org/en/stable/tutorials/performance/thread_safe_apis.html)
  support keeping scene-tree reads/commits on the game/main-thread boundary.
- [Harmony patching](https://harmony.pardeike.net/articles/patching.html) and
  [patch priorities](https://harmony.pardeike.net/articles/priorities.html)
  justify patch-owner/order diagnostics, but owner presence is not semantic
  compatibility proof.
- [wuhao21/sts2-cli](https://github.com/wuhao21/sts2-cli) demonstrates that the
  real engine can be driven headlessly with wait/pump patches. It is useful for
  experiments but does not replace live UI ownership, player-visible closure,
  exact loaded Modset, or unknown-outcome handling.
- [Gennadiyev/STS2MCP](https://github.com/Gennadiyev/STS2MCP) demonstrates a
  smaller MCP/action surface. Its simpler index/payload command model is not a
  substitute for opaque exact operands and semantic completion, though its
  smaller operator footprint is a valid pressure against this repository's
  tooling sprawl.

## Implemented Slice

Preview.67 source changes:

- adds required non-authorizing `identity_shadow` to Gateway state;
- adds independent semantic-state and authority-projection candidate hashes;
- leaves current `state_id`, action IDs, permission and execution untouched;
- adds C# negative tests for relevant versus irrelevant grant changes;
- makes Re strictly decode and preserve the raw shadow without exposing it to
  the model;
- adds a root thin Connector CLI for inspect/test/build/install/loaded verify,
  Re run, read-only evidence capture, trial delegation, revoke/rollback, and
  Gateway-artifact restore.
- replaces the stale current-audit `v0.109.0` grader scenario with a separate
  exact `v0.109.1` scenario while retaining Tutor as a diagnostic-only negative
  holdout; the old scenario remains historical evidence.

## Bounded Completion Definition

Workflow C may be called complete only for a declared support envelope, not
for all STS2 states:

1. bounded vanilla ordinary-single-player journeys have no runtime v1 path;
2. every supported mutation is exact, opaque, revalidated and completion-
   witnessed;
3. unsupported states are typed and recoverable by operator positioning or
   explicit scope declaration, not silently reconstructed;
4. exact install/load identity is reproducible on another machine;
5. long-run continuity metrics and unknown-outcome recovery are measured;
6. player-visible information has an explicit complete/inspectable/missing/
   hidden boundary;
7. version/Mod changes preserve safe diagnostics but do not inherit authority;
8. rollback and known-artifact restore are tested.

Current Gate 1 meets a bounded baseline, not this final product-level closeout.

## Next Falsifiable Experiments

1. Cold-load Preview.67 and capture repeated `/api/v2/state` observations while
   only permission/qualification history changes. The semantic candidate must
   remain stable; the current relevant authority candidate must change only for
   relevant scope changes.
2. Run one ordinary action from a different Commit/completion family and prove
   `observe -> advertised action -> submit -> completion -> successor` under
   the exact loaded Preview.67 identity.
3. Record stale precommit events with current state and both candidate hashes;
   classify real game drift versus irrelevant control-history drift.
4. Prototype capabilities summary/detail dual-read without changing authority;
   require strict equality of the current-scope projection before rollout.
5. Only after the identity experiment passes, design a rollbackable authority
   migration. A shadow field or hash match alone is insufficient.

## Non-Claims

- Preview.67 source is not loaded or Organic-qualified until a cold-start
  runtime proves its SHA/MVID and an action journey.
- The identity shadow does not reduce stale states by itself.
- The CLI is developer operations tooling, not Companion, installer product,
  SDK, authentication, or permission authority.
- The current project does not prove broad Mod support, cross-platform
  qualification, complete visible-information closure, or full-run autonomy.
