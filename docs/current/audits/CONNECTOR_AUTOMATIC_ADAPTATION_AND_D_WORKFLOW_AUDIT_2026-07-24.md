# Connector Automatic Adaptation And D-Workflow Audit

**Date:** 2026-07-24  
**Repository baseline:** `develop@e5f798c9d82188851106b9fb85b2f0cda61ecd1e`  
**Status:** accepted architecture correction plus implemented non-authorizing
compatibility slice. This is not a permission or qualification record.

## Executive Verdict

The current Gateway safety kernel is justified by reproduced failures:
stale-index races, source-owner mistakes, async child Surfaces, premature
completion, unknown outcomes and game-update identity drift. It should not be
replaced by a broad index/click API.

The adaptation layer was nevertheless incomplete. It duplicated the same
combat-pile topology in C# and Node, retained source-named Witness
implementations after moving sources to data, and produced an IL report too
shallow to support compatibility decisions. Exact-build and exact-Modset gates
remain deliberately coarse because no operation-level runtime patch closure
exists yet.

The selected correction is:

```text
native game remains the only executor and final fact source
  -> Gateway closed semantic contract catalog
  -> reviewed runtime registry and exact-environment policy
  -> non-authorizing D-lane discovery, fingerprints, scenarios and graders
  -> human-reviewed policy/registry change
  -> exact loaded canary and Organic evidence
```

Discovery and grading may automate work. They do not grant action authority.

## Evidence And Source Boundary

### Current repository evidence

- Preview.62 already had exact identity, opaque state-bound actions,
  execute-time revalidation, game-owned Commit, semantic Witness and
  unknown-no-retry.
- The exact local game assembly is
  `SHA 06c78d946ca70658e85abb28f6dc2ee0a023a4467faf0708ff542180fe5f4c82`,
  `MVID ceb123d1-63f0-4b8e-937c-5c49cec4c651`, release
  `v0.109.0/c12f634d`.
- The release-declared `main_assembly_hash` is diagnostic and differs from the
  runtime-computed identity used by permission. A static tool must not equate
  them.
- The exact assembly contains thirteen reviewed combat-pile sources and one
  unregistered caller, Tutor.

### External evidence

- [`wuhao21/sts2-cli`](https://github.com/wuhao21/sts2-cli) demonstrates that
  the real game engine can be used as a high-throughput scenario oracle. Its
  headless host, IL patches and index/argument JSON actions do not prove live
  UI ownership, state binding or current Mod compatibility, so it is a useful
  D-lane reference rather than a replacement live Gateway.
- [`Gennadiyev/STS2MCP`](https://github.com/Gennadiyev/STS2MCP) demonstrates
  broad practical coverage with a simpler REST/MCP surface. Its release history
  also records index mismatch, overlay-detection and soft-lock repairs. That is
  evidence that broad coverage alone does not remove stale-state and completion
  failures; it does not justify restoring v1.
- Harmony's official
  [`GetPatchInfo`](https://harmony.pardeike.net/articles/basics.html) can
  enumerate Harmony patches on a known method. It cannot prove absence of
  native hooks, dynamic reflection, scripts or other side effects, so future
  patch inventory must remain one evidence source rather than an automatic
  compatibility certificate.

The two supplied architecture papers correctly identify the missing
compatibility-evidence pipeline and the need for a rule-aware semantic
validator. They overreach when they imply that static similarity plus bounded
tests can safely produce automatic session or persistent permission today.
Those permission states are rejected until runtime patch closure, a real
scenario runner, revocation and operation-scoped evidence exist.

## Safety Kernel Versus Adaptation Layer

### Must remain in the runtime security kernel

- exactly one Active Surface mutation owner;
- opaque action IDs bound to one exact state;
- one legality path for publication and execute-time revalidation;
- native game Commit and task lifecycle;
- exact entity and participant identity;
- semantic post-state Witness;
- unknown outcome with no automatic retry;
- hidden-information boundary;
- exact environment and explicit operation scopes;
- fail-closed behavior for unknown owner, binding, patch impact or outcome.

### Belongs in the non-authorizing D lane

- assembly and method discovery;
- layered operation fingerprints;
- candidate classification and candidate patch generation;
- negative samples and holdouts;
- versioned scenario/evidence manifests;
- deterministic graders and regression reports;
- future runtime patch impact inventory.

D may recommend `diagnostic_only`, `review_required` or `code_required`. It may
not write the production registry, change the exact-environment policy, publish
actions or declare qualification.

## Zero-Core-Code Boundary

| Change | Expected path |
|---|---|
| Stat, text, catalog ordering or local data changes with unchanged visible and action semantics | no core code; exact identity and relevant regression still required |
| Existing reviewed source and contract in a new runtime instance | automatic runtime use under the existing exact policy |
| New native source that exactly reuses an existing owner, selector, bounds, Commit, hidden-info policy and Witness | tool-generated review candidate; registry data change, rebuild and canary; no new Provider/Witness code |
| New game build with unchanged operation fingerprints | tool-generated policy candidate plus exact loaded regression; no permission inheritance from version text |
| Extra Mod with no action-relevant patch | future operation-impact candidate; current production still fails closed |
| New participant owner, UI owner, selector stage, Commit primitive, hidden-information rule or Witness topology | code and an independently reviewed semantic contract |
| Open-ended script, dynamic patch or unobservable persistent side effect | unsupported unless the impact and outcome become bounded |

“Zero core code” does not mean “zero evidence” or “automatic production
permission.”

## Implemented In This Slice

### One closed contract source

`combat-pile-contract-catalog.json` now owns the seven closed Witness
topologies, vocabularies and expected native Commit primitives. Runtime C# and
repository checks consume this catalog instead of maintaining independent
switches. Invalid catalog or registry data still suppresses authority.

Source-named Witness classes were replaced by mechanism-named transaction
Witnesses. Source identity remains in the reviewed registry and runtime task
binding, not in generic exact-card movement/replacement algorithms.

### Layered static fingerprint

The exact-assembly audit now records:

- declared semantic fingerprint from enforcement fields;
- static structure fingerprint from selector, known Commit references and
  owner-reference signals;
- implementation fingerprint from canonical method IL;
- combined operation fingerprint.

These are change detectors, not semantic-equivalence proofs. Owner fields are
named reference signals because a method referencing `CardPlay.Target` does
not by itself prove the selected owner flow.

### Conservative candidate classification

- reviewed exact matches remain `registered_static_match` with
  `no_change_existing_reviewed_policy`;
- mismatches recommend quarantine;
- unknown sources with target-player reference but no source-owner reference
  are `code_required_new_owner_binding`;
- unresolved known Commit shapes remain review-only;
- all unregistered candidates have ceiling `diagnostic_only`.

Tutor is the first negative holdout. It is not registered or authorized.

### Versioned scenario and grader

`combat_pile_static_audit_v1_exact_v0_109_0` binds the exact game assembly
SHA/MVID, release version/commit, registry and catalog. Its deterministic grader
requires thirteen registered static matches, the Tutor negative holdout, all
non-authorizing limitations and no unexpected callers.

Six fixtures prove that the grader rejects:

- a report that claims authorization;
- a missing target-player signal;
- an unexpected caller;
- a ceiling above `diagnostic_only`;
- an exact game assembly mismatch;
- while accepting the bounded valid report.

This is the first narrow D2 scenario/evidence contract, not a general gameplay
scenario corpus or qualification engine.

## Deployment Verification

After the code and offline checks passed, the game was closed, the previous
installed DLL was copied to an ignored `/tmp` rollback file, and the current
Release was installed and cold-started through Steam:

```text
protocol    2.0-preview.62
SHA         f22c152aa9a58e429fea4ecc25dcc83ef7666e481c1acecc754545f428a8d8ab
MVID        546ef308-f4ff-45f4-8a07-8d0fff70c304
runtime     2b82c83dcf27427f816857fcdbcdc1e7
game        v0.109.0|c12f634d|-1639417500
Modset      exact_bridge_only
fingerprint eab9ee21fd1d9180b16585c9a528d7f2b831bb7199b08fdf98bf97cf3a49bb57
policy      bridge_v2_exact_environment_policy_2026_07_24
digest      1a3f5107e833bb5d561a36bbc2756340392225380088430229d7ef2dcf659f8f
```

Built, installed and loaded SHA matched. Two capabilities reads three seconds
apart had the same SHA, MVID, runtime, game and Modset identities. Re strict-v2
inspection decoded an actionable main-menu state with no decoder warnings, and
`/api/v1` plus `/api/v1/singleplayer` both returned `410`.

This is current-artifact build/install/load/consumer evidence. No mutation was
submitted, so it is not an action Canary and cannot qualify the refactored
Witnesses, catalog entries or any gameplay operation.

## What Remains Deliberately Unsolved

1. Static IL presence does not prove selector argument data flow, branch
   dominance, participant ownership or completion.
2. The runtime has no action-relevant Harmony patch closure. Additional Mods
   therefore still fail closed globally.
3. No engine-backed scenario runner positions and executes the exact live UI
   transaction automatically.
4. Registry narrative evidence and enforcement fields still share one JSON
   document; split only after a second contract family proves the shape.
5. Exact-environment policy remains embedded and build-scoped. Operation-level
   inheritance is unsafe until patch impact and scenario evidence are
   machine-readable.
6. Session provisional permission, automatic qualification, signed bundles and
   remote policy update are not implemented or authorized.

## Falsifiable Next Engineering Order

1. Add a **read-only runtime patch inventory** over the exact action-relevant
   source/selector/Commit closure. It must report unknown patch owners and have
   no permission effect.
2. Add recorded evidence roles and replay assertions for one existing exact
   combat-pile lifecycle. A fixture proves record interpretation; only an exact
   loaded journey proves runtime behavior.
3. Compare the static fingerprint, loaded patch closure and semantic outcome in
   one report. Reject any contradiction.
4. Only after those pass, design an operation-scoped policy candidate format.
   Keep policy application manual and embedded.
5. Resume Gate 2 feature coverage after this adaptation hardening window, not
   by expanding unknown mutation authority.

The architecture should be revisited if the second contract family cannot use
the Catalog/scenario/grader split without copying game rules. One successful
combat-pile family is evidence for a bounded pattern, not a universal semantic
DSL.
