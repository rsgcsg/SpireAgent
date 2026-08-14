# Preview.69 Live Authority And Run Reliability Closeout

## Scope And Evidence Levels

This report closes the interrupted Preview.69 reliability slice against source
commit `36e9f4d2ff7af943653eb56fd105b4d5661ee68c` plus the current uncommitted
closeout changes. It independently inspected four prior local Re run records,
reproduced the saved-run mount defect on an intermediate artifact, and then
completed a fresh exact-identity long run on the final artifact. Run records
remain ignored local evidence and are intentionally not committed.

Evidence levels remain separate:

```text
source and tests
!= built and installed artifact
!= loaded identity
!= real runtime coverage
!= Organic qualification
!= persistent compatibility claim
```

The four run metadata files declare `provenance=unrecorded` and
`qualificationUse=coverage_only_unless_independently_reviewed`. They may prove
runtime behavior and defects for their exact identity, but cannot promote a
persistent package.

## Exact Runtime Identity

All four runs used:

```text
protocol             2.0-preview.69
Gateway SHA          8e7a163bfbcc59f9272c8d92a34b642f51cb57b73cbf8319e4ccbf2b81e93fd5
Gateway MVID         0e3dd896-0e1e-4818-aca3-ac6c0c064b5f
runtime epoch        740e2907100447f3a8d432b2ca592d40
game                  v0.109.1|c8c577f6|-820620422
Modset                exact_bridge_only
Patch status          clean_known_owners
permission mode       migration_exploration
compatibility         provisional_trial_scoped
adaptation            encounter_provisional_trial
persistent authority  false
```

An intermediate rebuilt, installed and loaded binary reproduced the saved-run
mount defect after a confirmed `continue_run`:

```text
run       run-20260728041025-pygxmj
SHA       4ac4b4825116b7ead39bc7bf8ca4cc0a273c1a72c51847784907e8762357fbd1
MVID      ae849af3-4076-4af0-96ff-6f4d99735e96
runtime   c9dbca188c4b4abeaa725f3226c1ca76
result    continue_run settled; next read failed on shared_visible_state
```

The final exact source/build/install/load identity is:

```text
SHA       914974b5177364665dacd26dc614d7f23faa61924d4f68fff3e49a8572fa4789
MVID      1e457e86-8eba-4878-869b-f7545366fa1e
runtime   7a312974c7114abcaa623b9e60e8f438
rollback  STS2MCP/.local/deployments/2026-07-28T04-15-57-837Z
```

Source, built, installed and Gateway-reported loaded identities match. This is
loaded and real-runtime evidence, but it is not Organic or persistent
qualification. Old runtime grants did not transfer.

## Run Findings

| Run | Result | Exact interpretation |
|---|---|---|
| `run-20260728020651-03352e` | 100 decisions; 97 settled; 3 stale | Broad mid-run coverage across combat/event/map/rest/reward/shop/treasure. Every stale selection was rejected before execution and a later fresh tick progressed. |
| `run-20260728021602-bz2rop` | 65 decisions; 62 settled; 2 stale; correct `run_boundary` | Completed the remainder of a loss lifecycle through game-over intro, summary, return, and top-level menu. It proves one-game boundary closure from a mid-run start, not a fresh full-game run. |
| `run-20260728033215-6n8wsq` | 1 decision; `not_executed_llm_failure` | DeepSeek transport failed with `fetch failed`; no mutation was attempted. This is provider reliability evidence, not a Gateway failure. |
| `run-20260728033638-xrvcre` | 100 decisions; 99 settled; 1 stale | Entered from main menu through single-player/character select and continued to Act 1 floor 9. It stopped only because the former default ceiling was 100, so it is not a completed game. |
| `run-20260728041025-pygxmj` | 2 decisions; Continue settled; then invalid state | Intermediate MVID reproduced the defect: a saved floor-9 run had `RunState` but no mounted `CurrentRoom`, so the old new-run-only classifier converted an actionless mount interval into unsupported shared state. |
| `run-20260728041630-2z58bz` | 127 decisions; 114 settled; 1 checkpoint-pending; 11 stale; correct `run_boundary` | Final MVID resumed the same saved run, crossed reward/card/map/treasure/combat/rest-selector/game-over/menu, and stopped before a second game. The checkpoint-pending action was a Gateway-confirmed `end_turn`; no mutation outcome was unknown. |

The four old-MVID records aggregate to 258 settled actions and six safe stale
rejections. The final-MVID run adds 114 settled actions, one semantically
confirmed command whose Re checkpoint wait expired, and 11 safe stale
rejections. No unknown mutation was retried. Both completed-boundary records
started mid-run; `run-...33638` proves fresh entry but not completion.

## Root Causes And Repairs

### Shared HUD Mounting Gap

An active run normally requires complete top-level `shared_state`. During the
exact native new-run or saved-run mounting interval, however, the Gateway can
already prove `run_transition/setup/awaiting_run_state` while `LocalContext` or
the HUD is temporarily unavailable. Converting that actionless state to
`unsupported` confuses lifecycle incompleteness with an actionable semantic
failure.

The intermediate live failure showed the original classifier was still too
narrow: it admitted new runs only when `TotalFloor == 0`, but saved-run resume
has an existing floor while `CurrentRoom` is temporarily null. The final
classifier uses exact native lifecycle facts instead: run in progress, missing
run state or missing current room, no blocking Surface, and exact
`run_without_visible_overlay` source. It does not infer from floor number.

The repair is deliberately narrow. The Gateway may defer `shared_state` only
when all of these are true:

- context is exact run-mount setup/awaiting state;
- Surface is `no_action` with reason `settling`;
- readiness is `settling`;
- no legal action exists;
- authority is `none_fail_closed` with no owner;
- legal-action completeness is `none_no_input_owner`.

It then emits only missing field `shared_visible_state` and typed diagnostic
`bridge.shared_state.deferred_during_run_mount_transition` with
`required_for_action=false`. Re recognizes that exact contract. Combat
transitions, action-owning states, untyped omissions, and every other active-run
HUD failure still fail closed.

### Provider Transport Failure

The `fetch failed` record occurred before model selection and before mutation.
Re now retries a transient provider transport failure exactly once. Timeout,
no-HTTP transport failure, HTTP 408/409/425/429, and 5xx are eligible; a
non-transient rejection such as 401 is not. The retry reuses the original
Prompt. JSON formatting retry remains a separate attempt type. This does not
alter Gateway command retry: any unknown mutation outcome remains terminal.

### Ambiguous Decision-Ceiling Success

The old 100-tick loop returned success when it exhausted its ceiling even if no
game boundary had been reached. That made `run-...33638` look more complete than
it was.

New runs write immutable `run-summary.json` with one of:

- `completed_run_boundary`;
- `stopped_runtime_guard`;
- `stopped_runtime_failure`;
- `stopped_decision_limit`.

Decision-limit exhaustion now exits non-zero and is explicitly incomplete. The
default emergency ceiling is 1000. Historical records stay readable without a
summary and are not backfilled with invented termination evidence.

## Permission Closeout

No permission tier was widened. Each inspected loaded runtime used exact
operation-scoped grants whose `admission_basis` was
`encounter_source_resolved`. On the final runtime, Continue and exercised
reward/map/treasure/combat/rest/selector/game-over operations reached at most
`session_trial_confirmed`; unexercised candidates remained `session_canary`.
Restart, drift, failure, or quarantine still removes this authority.
`persistent_authority_enabled=false`, and no run wrote stable qualification.

Re now treats capabilities as a coherent dynamic companion to each observation,
not a startup-frozen grant snapshot. It validates exact runtime, environment,
Patch, grant, operation fingerprint, and admission basis before importing an
advertised action. D tooling, Re, REST, and MCP still cannot grant authority.

## Architecture Decision

Retain the single Semantic Gateway two-plane target (ADR-0002), native-contract
migration (ADR-0003), and trial/claim split (ADR-0004). The evidence does not
justify a workflow engine, universal Surface, second permission system, or
client-side completion logic.

The useful abstraction is an exact typed transient omission on an existing
lifecycle state, not a general nullable shared-state model. Likewise, provider
retry belongs in Re's pre-mutation transport boundary, while command outcome
truth remains entirely in the Gateway.

## Verification And Non-Claims

Executed verification:

- `npm run connector -- test`: Gateway 176/176 tests; Re 14 files and 202/202
  tests; Re typecheck/build; CLI, docs, inventory, adaptation, compatibility,
  permission, qualification, Profile and migration checks all passed;
- `npm run check`, `npm run check:docs`, `npm run check:connector-cli`, and
  `git diff --check`: passed;
- `npm run connector -- audit`: reviewed operation bindings matched; the static
  compatibility report intentionally remains
  `review_required_unregistered_callers` for Tutor's new target-player owner,
  with `authorization_effect=none` and `qualification_effect=none`;
- Release build/install/load identity: SHA `914974b5...a4789`, MVID
  `1e457e86-8eba-4878-869b-f7545366fa1e`, runtime
  `7a312974c7114abcaa623b9e60e8f438` matched across source tooling and Gateway;
- `collect-evidence` completed read-only with no partial failures. Its local
  artifact and all Re run records remain ignored and uncommitted.

Still not claimed:

- a fresh main-menu-to-game-over run on the final MVID (the completed run
  resumed from a saved floor-9 state);
- Organic or persistent qualification from `unrecorded` runs;
- generic cross-version or cross-Mod compatibility;
- support for Tutor, Crystal Sphere, standalone manual potion discard,
  unbound source variants, non-standard profiles, or multiplayer;
- full player-visible linked-detail/tooltip closure.

## Next Evidence

The interrupted repair is closed. The next bounded investigation should
measure the 11 pre-execution stale selections and the one long enemy-turn Re
settlement timeout, while preserving fresh-observation recovery and
unknown-no-retry. A later fresh main-menu-to-boundary run would improve
coverage, but is not required to claim that the saved-run mount defect is fixed.
