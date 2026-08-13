# Connector V3 Freeze Readiness And Adaptation Re-audit

Date: 2026-08-03  
Audit baseline: `connectorV3` at
`ea18a3b89853689228d7e7f620d7c28a32c32d54`  
Verdict: **conditional freeze**; the Preview.12 code cut is installed, but its
cold-load and changed-path Live evidence remain blockers. No durable
qualification is authorized by this report.

## Evidence Boundary

The exact Live baseline used by this audit is Preview.11:

- protocol `3.0-preview.11`;
- Gateway SHA
  `5b2d5f6ff7eb3582af4d627ad88aac54d373d29b575f8e4752d9cfa273d831e4`;
- MVID `e47565ad-e792-49ea-a836-b834a6218ab8`;
- runtime `e64c64af13d44553b18148f26a2c8519`;
- STS2 `v0.110.1`, commit `db5d3552`;
- Modset `exact_bridge_only`, Patch inventory `clean_known_owners`;
- permission mode `migration_exploration`;
- qualification store `empty`, persistent authority disabled.

`npm run verify:loaded` and a read-only evidence capture confirmed that tuple.
Across 44 exact-artifact runs, Re recorded 309 decisions. This is Live evidence
for Preview.11 only. Preview.12 source, tests, build and install are separate
levels until a cold start reports its new SHA/MVID/runtime.

The installed Preview.12 candidate is SHA
`18f07ca327bb8e6f58f227674ca82fbe7ba1a91fe41875e5dea6de406edd3eaa`,
MVID `50309e88-c6a0-4faf-b2ae-7092f91eda7d`, with rollback snapshot
`STS2MCP/.local/deployments/2026-08-03T12-07-43-930Z`. These are build and
installation facts, not loaded or Live evidence.

No public-project comparison is used to override these local facts. The
question in this audit is a current implementation and runtime question; the
exact source, receipts, permission ledger and game process are stronger
evidence than architectural analogy.

## Failure Classification

Terminal classification for the 44 exact Preview.11 runs:

| Class | Runs | Finding |
|---|---:|---|
| ended after a settled action or human stop | 19 | not a Connector failure |
| typed unsupported, no current binding | 12 | mixed: three rest runs followed a real quarantine; the remainder are source/family gaps or correct contradiction boundaries |
| controller lease conflict | 4 | Re termination cleanup defect; not missing selector support |
| malformed visible-unsupported projection | 3 | Gateway marked source-unresolved known UI as supported while degraded |
| expected no-action cycle guard | 2 | correct bounded supervisor stop |
| completed-game boundary | 1 | correct one-game stop after a 203-decision journey |
| Re generated-choice contract drift | 1 | Quasar used native V3 `choose`; Re incorrectly expected old `select_entity` mechanics |
| unknown command outcome | 1 | combat-hand confirm crossed to game over before its owner-closed witness; no retry occurred |
| provider failure | 1 | external model fetch boundary; no command submitted |

The twelve typed unsupported terminals partition as three `rest_site`, two
source-unresolved `deck_enchant_selection`, four event-unsupported, two
combat-unsupported and one map contradiction. Therefore the dominant claim
"the implementation exists but default gray is closed" is false. The sample
contains all three states:

1. **implemented and admitted**: many operations reached
   `session_trial_confirmed` after exact receipts;
2. **implemented then quarantined**: rest Smith completed natively, but a
   Provider/catalog witness mismatch revoked `choose_rest_option` for the
   runtime; combat-hand confirm was quarantined after unknown;
3. **not source-qualified**: Orobas deck enchant, unknown event/combat owners,
   and the map UI/run contradiction correctly had no binding to admit.

## Root Causes And Repairs

### Rest witness drift

`run-20260803110112-iw4me1`, decision 5, executed
`choose_rest_option` and observed `rest_smith_exact_upgrade_child_opened`.
The authority catalog required
`rest_option_source_specific_heal_progress_or_smith_upgrade_child_observed`.
The Permission Manager correctly quarantined the scope with
`semantic_completion_witness_mismatch`.

Preview.12 centralizes the runtime witness in
`RestSiteSurfaceProvider.OptionCompletionWitness` and tests equality with the
authority catalog. Heal and Smith retain different native completion
predicates; only the contract-level evidence label is shared.

### Combat-hand unknown

`run-20260803111842-avbdj7` selected, deselected/reselected and confirmed
through direct V3. Confirm returned `unknown/unexpected_state_transition` and
was not retried. The run subsequently reached game over. The old predicate
required the hand-selection owner to disappear, even after the native confirm
control had already been consumed.

Preview.12 accepts either exact owner handoff or the same native confirm
control becoming hidden/disabled. It does not accept an unrelated state-token
change. The witness and operation fingerprint are revised, so old authority
cannot transfer.

### Quasar consumer drift

`run-20260803111410-2wj0w8` carried exact Quasar source, operands and trial
scope, but Re rejected the Gateway-native `choose` command before submission.
The repair removes Re's duplicate generated-source whitelist. Re now checks
the source-local operation named by the current Gateway Surface, current card
membership, exact screen/card binding and exact command set. A holdout test
proves an additional source-local contract does not require a Re source
whitelist. Gateway source audit, permission and Commit remain mandatory.

### Visible unsupported and controller lifecycle

Source-unresolved `UnsupportedSurface` instances now force
`execution_support=unsupported` even when their observed UI family has a known
kind. Re preserves the source-specific visible reason without trying to decode
an incomplete supported Surface.

Re release is now idempotent and SIGINT/SIGTERM-aware. It releases the Gateway
controller lease and local runtime lock before termination. SIGKILL and machine
loss remain covered only by the bounded Gateway lease expiry; the single-writer
rule is not weakened and a new client never steals a live lease.

## Adaptation Audit

### New cards and ordinary events

Cards using an already supported native combat owner and normal native play
path require no command-protocol change: their current entity, target domain
and `CanPlay` result are discovered at runtime. Ordinary event buttons under
the audited event owner similarly reuse the event option mechanics.

This is not universal zero-code adaptation. A new selector source, new owner,
new Commit, hidden-information requirement or different completion boundary
requires a Gateway-local source contract and tests. Unknown derived types do
not inherit vanilla authority merely because they render the same grid.

The generated-choice correction establishes the intended composition:

```text
shared visible grid and entity mechanics
+ Gateway-local source/owner/operation/Outcome contract
+ exact operation-scoped trial or qualification
-> current parameterized V3 command
```

Re no longer enumerates every source. It consumes declared visible semantics
and current commands, but it never creates authority from them.

### Version and Mod adaptation

Protocol, Gateway SHA/MVID/runtime, game assembly, Modset, Patch digest,
operation fingerprint and policy identity are independent scope inputs. A
changed environment loses authority instead of inheriting a similar old
grant. Static audit can classify unchanged, candidate, unsupported or
`code_required`; it cannot qualify a mutation.

The v0.110.1 `Tutor` holdout remains `code_required_new_owner_binding`: its
multiplayer target-player selector is not safely equivalent to the current
single-owner pile contract. This is a useful negative result. No evidence yet
proves automatic cross-version or bounded-Mod qualification end to end.

### Gray, quarantine and durable evidence

Session canary, first-success promotion, first-failure/unknown quarantine and
exact-runtime invalidation are real runtime behavior. Preview.11 shows both
promotion and quarantine. Revoke, supersede, rollback, corruption, expiry and
wrong-environment behavior are automated-test evidence only on the final
artifact; loaded rollback/revoke and durable qualification remain unproven.

The current empty qualification store is correct. A completed journey and many
session trials do not automatically create a durable claim.

## Orthogonality Verdict

The macro architecture is retained:

```text
Observation -> source-local interaction contract -> single authority resolver
-> execute-time native validation -> STS2 Commit -> action-local receipt
-> Re successor supervision
```

REST/MCP remain transport-only. Re does not look up V2 action IDs, own game
legality or infer native completion. Machine checks report 94 explicit
operation contracts, zero fallback authority, zero Provider action
publication and zero active Re V2 sidecar. These are production-path facts,
not proof that every possible vanilla or Mod source is covered.

Remaining imperfections are explicit:

- historically named Bridge V2 runtime/catalog classes are still reused as
  the one permission/control implementation; this is naming and modularity
  debt, not a second authority path;
- `operation` remains the exact permission, quarantine and qualification key;
  old fallback operation authority is gone, but the operation identity itself
  is still necessary;
- source contracts are code-local rather than a safe auto-generated registry;
  this is intentional for new owners/Commit/Outcome, but means adaptation is
  not universally zero-code;
- Human native-page evidence, loaded revoke/rollback and cross-environment
  requalification lack exact-runtime proof.

## Freeze Verdict

**Conditional freeze.** Preview.12 fixes four current-runtime defects and
removes one cross-layer source whitelist, while preserving exact binding,
single writer, native Commit, idempotency, unknown-no-retry and fail-closed
authority. It must not be called frozen or qualified until:

1. Preview.12 is cold-loaded with exact SHA/MVID/runtime verification;
2. Quasar, rest Smith/heal and combat-hand confirm are re-exercised when they
   naturally occur, including the revised receipts and no false quarantine;
3. source-unresolved deck enchant is observed as typed unsupported rather than
   malformed;
4. controller release is exercised by interrupting one run and immediately
   starting another without waiting for lease TTL;
5. loaded revoke/rollback and the optional Human native-page lifecycle are
   recorded before any durable qualification decision.

Cross-version, arbitrary-Mod, every-source Human parity and durable
qualification remain non-claims.
