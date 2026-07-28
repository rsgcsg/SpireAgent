# Preview.69 Risk-Calibrated Trial And Reliability Migration

> Historical engineering checkpoint: the pre-live non-claims in this report
> were correct at its source commit. Later Preview.69 runtime evidence and the
> final rebuilt/installed identity are recorded in the
> [live authority and run reliability closeout](PREVIEW_69_LIVE_AUTHORITY_AND_RUN_RELIABILITY_CLOSEOUT_2026-07-28.md).

## Scope And Evidence Boundary

This audit uses source at `develop` commit
`68ded38d56fb45ff6165ee6279fe7a71dea1418f`, Preview.68 runtime records, the
loaded Preview.68 log, current tests, and the 2026-07-28 authorization critiques.
The critiques are inputs, not authority. Preview.69 code and fixtures are not
current-build Organic evidence until the new DLL is cold-loaded and exercised.

## Runtime Findings

| Evidence | Finding | Classification |
|---|---|---|
| `run-20260727135445-hbzl7p` | 98/100 decisions settled; one normal combat transition and one safe stale action | bounded long-run evidence; decision cap stop |
| `run-20260727140034-8p5zum` | game-over returned to main menu after 17 settled actions | correct one-game terminal boundary |
| `run-20260727140238-g0sq13` | embark committed, then a 260 ms `run_without_visible_overlay` gap was reported as unsupported | lifecycle modeling defect |
| `run-20260727141159-oc7w6m` | purchases settled; repeated shop open/close edge stopped the run | Re supervision defect, not Gateway mutation failure |
| `run-20260727141328-3r0qs2` | same shop open/close/open cycle reproduced | counterexample confirming the supervision defect |
| loaded Gateway log | Frost Orb formatting called SmartDescription without `energyPrefix`, `Passive`, and `Evoke` variables | player-visible observation defect |

No new run in this audit proves Preview.69 loaded behavior.

## Architecture Verdict

Retain the Semantic Gateway two-plane architecture. Reject the Preview.63-68
assumption that a reviewed environment or preinstalled qualification candidate
must be the absolute ceiling for even a volatile trial. It conflates admission
with durable compatibility and causes bulk package installation before any
current Surface is observed.

The corrected control model is ADR-0004:

```text
coherent diagnostic observation
  -> current source-resolved encounter admission
  -> runtime-only trial and quarantine
  -> separately reviewed persistent scoped claim
```

ADR-0003 remains necessary. Operation keys and the 87-row package/catalog path
are a rollback-compatible migration layer, not the target semantic identity.
The final claim identity remains native owner/source + adapter + outcome
boundary + covered partition under exact provenance.

## Preview.69 Engineering Changes

- Model the post-embark mounting gap as `run_transition + no_action + settling`
  rather than unsupported.
- Make Re's semantic cycle guard suppress only a proven return edge when a
  different Gateway-advertised forward action remains. It never invents an
  action or retries a mutation.
- Format Orb descriptions with the exact native SmartDescription variables.
- Resolve one active Surface once, before authority projection; remove the dead
  second unqualified-provider resolution path.
- Preserve diagnostic observation for a complete but unreviewed game-build
  identity while keeping actions and Inspection disabled initially.
- Admit only current source-resolved actions as runtime-epoch-bound provisional
  trials in `migration_exploration`.
- Record `admission_basis` on grants and scopes; rename post-success session
  state to `session_trial_confirmed` to avoid implying persistent approval.
- Allow partial action admission on a Surface while withholding unadmitted
  siblings.
- Make `run-agent` probe current state before invoking legacy package migration.
  A no-input diagnostic transition may start Re when encounter admission is
  ready for the first later actionable Surface.

## Safety And Non-Claims

Unchanged:

- STS2 owns rules, native legality, Commit and side effects.
- Gateway owns observation, one input owner, action publication, execution-time
  revalidation, completion and quarantine.
- Re selects only current opaque action IDs.
- Unknown mutation outcome is terminal and is never retried.
- A new build, MVID or Modset inherits no persistent permission.

Not claimed by this pre-live migration audit:

- Compilation alone does not establish loaded or Organic qualification.
- Encounter trial success is not persistent qualification.
- Additional Modsets are not generally supported; candidate eligibility still
  requires an explicit current classification.
- Unknown owners, operations, source bindings, commits and outcomes still fail
  closed.
- Crystal Sphere, standalone potion discard, multiplayer and remaining
  unbound variants are not closed by this migration.

## Verification Before Live

This section records the pre-live gate at the time of the migration. Final
load and runtime results are in the
[live authority and run reliability closeout](PREVIEW_69_LIVE_AUTHORITY_AND_RUN_RELIABILITY_CLOSEOUT_2026-07-28.md).

- C# tests must include diagnostic observation, encounter admission, strict
  rejection, witness quarantine and session-only promotion.
- Re must reject mismatched admission evidence and accept exact dynamic scopes.
- Connector CLI must demonstrate that diagnostic trial readiness no longer
  requires current mutation authority or a bulk package cycle.
- Full Re check, C# test/Release build, connector checks and docs checks must
  pass before installation.
- Installation must record a rollback directory and exact built/installed SHA
  and MVID. Loaded identity and runtime behavior require a later cold restart;
  that restart has since been completed and does not create Organic status.
