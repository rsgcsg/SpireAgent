# Human-Equivalent C/A Wire And Domain Freeze Reaudit

Date: 2026-08-09

Start branch/HEAD: `human_equivalent_connector` /
`930941a2b9bf6c9cfb329d6d473f2bc0950a5aef`

Input reviewed: current C/Re source, canonical documents, the external
`SPIREAGENT_HE_C_A_CLEAN_ARCHITECTURE_REVIEW_2026-08-09.md`, four latest exact
runtime runs, and the existing boundary/deployment checks. The external review
is evidence and critique, not repository authority.

## Verdict

Keep the Human-Equivalent macro architecture, but do not freeze its
`preview.1` migration wire. The behavior authority had moved to current UI,
while protocol and A domain still retained V3-shaped mode, frame, parameter,
annotation and semantic-action artifacts. Protocol `preview.2` makes C truth
intrinsically HE and leaves D composition and flow semantics in A.

## Runtime Facts

All four reviewed runs used source `930941a2`, SHA `257ccac1...`, MVID
`2345552d...`, runtime `da0c602d...`, protocol `1.0-preview.1`, STS2
`v0.110.1/db5d3552`, and `additional_loaded_mods`.

- `run-20260809114611-rldlev`: 20 decisions, completed game boundary, menu,
  combat and game-over lifecycle.
- `run-20260809083202-4ki7ig`: 150 decisions, broad ordinary surfaces, two
  safe stale refusals.
- `run-20260809083127-8qrm8g`: seven settled decisions; interrupted without a
  terminal summary.
- `run-20260809082509-xi54bi`: 178 decisions; repeated shop inventory open and
  close after no affordable purchase remained.

These are Live coverage facts only. Metadata records
`provenance=unrecorded`; no Organic or qualification claim is made.

The first exact-loaded `preview.2` run, `run-20260809125843-1k1zrv`, stopped at
decision 1 before mutation. Its exact artifact was SHA `28e4b335...`, MVID
`69657c34...`, runtime `b87e2551...`. The Gateway omitted unknown
`selected`/`focused` control fields while Re required the keys. Re now accepts
omitted or null unobserved state. This is exact-load and negative integration
evidence, not journey evidence.

The fixed consumer then completed `run-20260809130134-e1b0kj` on source
`ceb995f4`, SHA `c32a3092...`, MVID `daa75e36...`, runtime `b493c49b...`.
The run reached `completed_run_boundary` after 261 decisions and covered menu,
event, map, combat, reward, rest, shop, treasure and game-over return. Its 9
stale refusals were followed only from fresh observations; 22 delivered inputs
crossed a checkpoint-pending boundary without being resubmitted. There was no
unknown delivery. This closes the ordinary-journey condition but remains
coverage-only, unrecorded-provenance evidence.

`run-20260809131456-dfve6q` subsequently completed an exact `he_pure` journey
on source `b8cfaf30`, SHA `d373f6fb...`, MVID `40051d0a...`, runtime
`c439a4a2...`. It reached `completed_run_boundary` after 231 decisions with
zero unknown delivery. This closes the A+C-only composition condition for that
artifact; it does not create Organic evidence or qualification.

## Root Causes

The shop loop is A-domain debt, not failed C delivery. C repeatedly returned
`applied` with valid successor observations. Re exposed `affordance_id` as the
semantic action kind and included fresh HE transport identity in its cycle
hash, preventing suppression of the proven reverse edge.

The protocol also carried information with no truthful consumer value:

- fake rendered frame dimensions (`0x0`);
- C/D mode and annotations inside C truth;
- exact native parameters sent to Re and echoed unchanged;
- selected/focused control defaults reported as observations.

## Implemented Decision

`preview.2` removes mode, frame, annotations and native operands from C wire.
An affordance is state-bound and opaque; C retains the exact native binding
and revalidates it at execution. Unknown control state is nullable. Re projects
the generic UI verb, and HE cycle identity excludes state/affordance transport
fields. `SettlementWatcher` is renamed `SuccessorWatcher` to match A's actual
responsibility. A positive type switch now projects known visible Surface
facts; source/destination/mutation/Commit/evidence fields are never copied.

The necessary integrity boundaries remain: one owner/controller, exact state
and local target binding, execute-time actionability, request idempotency,
unknown-no-retry, player-visible policy and delivery/successor separation.

## Ownership

- C: player-visible facts, current affordances, local native binding,
  revalidation, input delivery, receipt and successor.
- A/Re: normalization, finite opaque choice projection, transition context,
  LLM invocation, flow interpretation, cycle recovery and strategy.
- D: optional separately composed hints/evaluation; no C authority or input.
- P: build, install, identity, configuration and rollback.
- V3: historical rollback/replay plus inherited adapter implementations still
  awaiting neutral ownership; not a live Re fallback.

## Freeze Contract

Status: `conditional freeze`.

Satisfied in source/tests: one C wire, one live Re executor, source-free
selectors, C-local exact operands, delivery/successor semantics, strict stale
and unknown handling, and structural boundary checks.

Open blockers:

1. source-free combat-pile and unknown-source selector exact-runtime evidence;
2. truthful hover/focus/tooltip/scroll/native-page information parity.

The core C wire, authority and delivery contract is frozen. The remaining
provider ownership debt should be retired family by family; it does not justify
a new protocol, source registry, business Outcome gate or V4. Overall freeze
remains conditional until the source-free selector and Human information-parity
evidence above is obtained.
