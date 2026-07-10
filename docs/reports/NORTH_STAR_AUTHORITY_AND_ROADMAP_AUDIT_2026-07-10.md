# North Star, Strategic Authority, And Roadmap Audit

Date: 2026-07-10

Status: historical architecture audit. Its authority/environment decisions remain valid, but its P9-P16 phase numbering was superseded by the [P9-P15 Phase Architecture Audit](P9_P15_PHASE_ARCHITECTURE_AUDIT_2026-07-11.md), [ADR-0005](../decisions/ADR-0005-phase-architecture-and-parallel-workstreams.md), and the [current roadmap](../phases/P9_P15_EXECUTION_ROADMAP.md). This report is not the current-status source of truth; use [Current Status](../04_CURRENT_STATUS.md).

## Executive Verdict

SpireAgent's existing North Star remains broadly correct, but it was underspecified in two places:

1. it said that the LLM is the core strategic player without defining who owns deliberation, selection, authorization, and execution when local skills become capable;
2. it treated environment/version resilience as future engineering polish even though Slay the Spire 2 is an actively changing Early Access game.

The corrected identity is:

```text
LLM-centered, not LLM-exclusive.

The LLM owns strategic deliberation in the main product mode.
The external experience shell may learn memory, perception, candidates,
skills, context, review, and budget policies, but capability does not
automatically grant strategic authority.

The deterministic hard shell owns legality, validation, execution safety,
truth separation, authorization, rollback, and promotion gates.
```

The audit also corrected one internal priority conflict: learning integrity and adaptation now outrank speed/token efficiency. Efficiency remains important, but it cannot become the objective that deletes strategic information or blocks the learning loop.

The long-term goal that the soft shell should "almost disappear" is valid only if interpreted as the disappearance of permanently hand-authored soft policy. It does not mean removing the experience shell, erasing audit boundaries, or transferring the main product's strategic identity to an opaque local policy.

P9.5C paired shadow work remains useful, but it is no longer the only prerequisite to P9.6. Before stable promotion design, the project needs:

- P9.5D decision-authority schema and audit foundations;
- P9.5E environment fingerprint and evidence-scope foundations.

## Material Review

The supplied documents were treated as arguments, not specifications.

### Adopted As Identity Constraint

The strongest and most coherent formulation came from *SpireAgent 的主体性、经验外壳与战略决策权*:

- LLM-centered is not LLM-exclusive;
- strategic capability is not strategic authority;
- execution authority and deliberation authority are different;
- mechanical proof, empirical competence, and model confidence are different;
- learned skills may be delegated only with bounded scope, termination, invalidation, escalation, versioning, and rollback;
- broad local autonomy requires a deliberate product-identity decision rather than silent rollout drift.

This framing resolves the project's central tension better than either extreme: forcing the LLM to perform every mechanical detail, or letting the local shell quietly become the actual player.

### Adopted With Corrections

The product-form document correctly proposes a thin mod, local runtime, provider-neutral adapters, player-selectable modes, local-only secrets, and visible takeover controls. It was corrected by separating provider choice from authority mode and by refusing to describe the current CLI package as an already completed player product.

The environment-truth document correctly places real observations above internal speculation. It was corrected by rejecting outcome-as-causality: one win or loss may update a hypothesis, but cannot directly create stable knowledge.

The "memory assembler to learnable cognition" critique correctly identifies retrieval, candidate generation, representation, policy coordination, counterexamples, and prompt-policy debt. Its world/value-model and architecture-search suggestions remain research directions, not immediate commitments.

The update-resilience critique is substantially correct and more urgent than the existing roadmap implied. Environment identity, version-scoped knowledge, quarantine, and revalidation must begin before stable promotion.

### Rejected For The Main Product, Retained As Research

Some supplied audits argue that authority should dynamically migrate to whichever component is most competent and that the shell should ultimately become the autonomous policy/value/world-model agent.

Useful ideas were retained:

- empirical calibration;
- out-of-distribution detection;
- world-model prediction;
- value/risk estimation;
- skill discovery;
- local shadow benchmarks;
- environment-driven correction.

The automatic authority-transfer conclusion was rejected for the main product. It would change SpireAgent from an LLM-centered learner into an authority-optimizing ensemble. That may be valuable research, but it belongs in isolated `local_autonomy_experimental` mode and a future P16 research track.

## Current Game Reality

Official sources establish that the target environment is non-stationary:

- Slay the Spire 2 launched in Early Access on March 5, 2026. Mega Crit states that more content, modes, balance changes, bug fixes, and compatibility work are planned: <https://store.steampowered.com/app/2868840/Slay_the_Spire_2/>.
- The July 2 beta patch included balance, content, multiplayer-card, mod-loading, and serialization changes: <https://steamcommunity.com/app/2868840/allnews/>.
- Major Update 2 added official Steam Workshop support after an evolving integrated mod loader: <https://steamcommunity.com/app/2868840/allnews/>.
- Mega Crit's April roadmap described active feedback, balance, systems, and content work: <https://www.megacrit.com/news/2026-4-17-neowsletter-issue-21/>.

Engineering consequence: a run ID and agent revision are not enough to determine whether evidence remains valid. Game build, branch, mod set, adapter capability, and fact snapshot must become part of evidence identity.

## Scientific And Engineering References

The following sources inform the design but do not prove that their methods directly solve SpireAgent:

- Learning-to-defer research supports modeling delegation as a decision rather than assuming one component is universally best: <https://proceedings.neurips.cc/paper/2018/hash/09d37c08f7b129e96277388757530c72-Abstract.html>.
- Calibration research warns that confidence is not correctness probability without measurement: <https://proceedings.mlr.press/v70/guo17a>.
- The Option-Critic architecture is useful inspiration for skill entry, internal policy, and termination, but SpireAgent must add explicit safety, authority, version, and rollback governance: <https://ojs.aaai.org/index.php/AAAI/article/view/10916>.
- Continual-learning research documents plasticity loss, reinforcing the need for revalidation, rollback, and non-monotonic knowledge lifecycle: <https://www.nature.com/articles/s41586-024-07711-7>.
- World-model work demonstrates the value of prediction through imagined futures, but it does not justify replacing LLM strategic authority: <https://www.nature.com/articles/s41586-025-08744-2>.

## Architecture Classification

### Core Identity

- LLM strategic deliberation in `llm_primary` mode;
- Strategic Impression and salience;
- evidence-linked Memory Activation;
- Candidate Futures with benefit, cost, risk, uncertainty, assumptions, invalidation, and prediction checks;
- DeliberationPacket / learned Context OS;
- validated candidate selection and execution;
- transition recording, replay, eval, weak attribution, proposals, and rollback;
- explicit decision authority and environment compatibility.

### Hard Shell

- canonical state and data-truth separation;
- legal candidate/action surface;
- schema and semantic validation;
- execution checkpoints and mismatch detection;
- live authorization and stop conditions;
- protected-path and stable-promotion authority;
- environment compatibility and quarantine;
- secret isolation and runtime artifact hygiene.

The hard shell is not a learning target controlled by the LLM.

### Learnable Experience Shell

- memory representation and retrieval;
- strategic first-impression policy;
- candidate templates and candidate-set critique;
- review and weak-attribution policy;
- classification and skill routing hints;
- bounded skills;
- context assembly and compression;
- deliberation and budget profiles;
- provider selection recommendations.

These are proposal-driven and evidence-scoped. Learning them does not automatically grant authority.

### Integration And Product Surface

- game mod/adapter;
- provider adapters;
- CLI/UI/overlay;
- key storage;
- installation, updates, and compatibility UX.

These are essential product engineering but not the strategic brain.

### Optional Experimental Research

- learned local policy/value/world models;
- broad local autonomy;
- architecture search;
- model distillation;
- automatic authority allocation.

These must stay isolated from the main product until a future North Star decision explicitly changes that boundary.

## Keep, Refactor, Or Rewrite

### Keep And Strengthen

- canonical state, validation, checkpoint, execution, transition, replay/eval;
- StrategicImpression, MemoryActivation, CandidateFuture, and DeliberationPacket;
- protected-path gate and append-only proposal infrastructure;
- EvidenceSliceReader and provenance exclusion;
- P9.5 offline/shadow comparison;
- provider adapters and explicit live flags;
- thin game-adapter boundary.

### Refactor Incrementally

- decision recording must add an authority chain rather than relying on `chosenBy`;
- evidence slicing must include environment fingerprints and compatibility;
- proposals need behavior-impact classification;
- retrieval must record policy/skill/environment versions;
- skills need qualification and delegation contracts;
- controller boundaries should be extracted only where behavior-preserving.

### Rewrite Or Retire As Authority

- stale phase/status prose in `PROJECT_AUTHORITY_GUIDE.md`;
- any claim that run mode is the same thing as decision authority mode;
- portable docs that imply provider-returned `memoryUpdates` are a normal live write path;
- permanent per-class strategic prompt/candidate rules as the long-term design;
- the assumption that one clean provider outcome makes a policy shadow-validated;
- the assumption that successful execution proves environment compatibility.

## P9 Corrections

P9 remains proposal-driven guarded learning, but its sequence changes:

1. continue P9.5C counterexample-quality shadow evidence;
2. add P9.5D authority types and audit-only records;
3. add P9.5E environment identity and evidence scope;
4. design P9.6 ledger/snapshot/rollback only after all three foundations are reviewable;
5. allow the first stable promotion only for low-risk presentation policy;
6. make P9.7 retrieval authority-mode-aware and environment-compatible;
7. complete one rollback-capable P9.8 lifecycle.

Candidate, classification, skill, budget, and authority-changing proposals may exist in schema and shadow evaluation before they are executable.

## Future Phase Direction

- **P10:** continuous evidence, memory, and scaffold learning; no automatic authority transfer.
- **P11:** curriculum, skill qualification, and delegation governance.
- **P12:** learned Context OS / prompt compiler.
- **P13:** deliberation and Compute/Budget OS under hard caps.
- **P14:** full environment compatibility, knowledge invalidation, revalidation, and canary system.
- **P15:** player productization: thin mod, provider-neutral runtime, authority UI, key security, takeover, packaging.
- **P16:** optional local policy/world/value/autonomy research, isolated from the main product.

## Metrics Correction

`reasonQuality`, `missing_tradeoff`, and cue detectors remain smoke alarms. They are not strategic truth.

Long-term evaluation should add:

- prediction accuracy by horizon and environment scope;
- risk calibration and abstention/escalation quality;
- decision consistency under equivalent states;
- candidate coverage and missing-plan recovery;
- retrieval usefulness and harm rate;
- proposal survival and counterexample rate;
- skill success, termination, escalation, and OOD rate;
- policy usage impact and regression rate;
- rollback and quarantine frequency;
- LLM-primary versus local-shadow benchmark deltas.

## Immediate Engineering Direction

Do not enable stable promotion yet. The next implementation sequence is:

1. P9.5D schema/telemetry-only authority foundation;
2. P9.5E schema/telemetry-only environment identity foundation;
3. resume promotion-grade paired/counterexample evidence under exact environment/provider scope;
4. then design the P9.6 promotion ledger, rollback snapshot, retrieval trace, and status transition.

No step above expands live, changes validation/execution, writes stable memory, or grants local strategic authority.
