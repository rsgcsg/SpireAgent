# ADR-0006: Policy Influence, Selection Resolution, And Evidence Provenance

## Status

Accepted and implemented for P9-G2 correction. G2 evidence qualification remains incomplete; this ADR does not authorize G3.

## Context

P9 must eventually let evidence-backed soft-shell policies affect how the LLM deliberates, while keeping validation, execution, authorization, rollback, and protected writes in the hard shell. Three G2 findings made the former wording unsafe:

- a local card-select guard can replace a validated LLM candidate after `chosenBy` is set to `llm`, so historical records can falsely describe the final selection as LLM-selected;
- replay, proposal generation, and experiment manifests classify evidence roles with different precedence when both a workspace-shadow call and LLM selection exist;
- a `reason_policy` overlay is injected before the provider decides, so it can influence deliberation even when its cloned experiment has no runtime effect. Calling it `presentation_only` confuses runtime isolation with decision neutrality.

These are provenance and semantics problems, not proof that the existing execution guard failed. They do mean that affected records cannot support claims about LLM selection or promotion-grade policy effect until repaired.

## Decision

### 1. Record proposal, resolution, and execution separately

The durable decision record must represent the full resolution chain:

```text
candidate proposal(s)
  -> safety/local resolution
  -> final authorization
  -> execution
  -> transition record
```

Implemented `SelectionResolutionRecord` telemetry retains, at minimum:

- proposed candidate id and proposing actor;
- final candidate id and final-selection actor;
- resolution kind and reason when the final choice differs;
- validation result and allowed-candidate evidence;
- whether the final choice is eligible as LLM-selection evidence.

`chosenBy` remains backward-compatible summary telemetry only. It must not be the sole source for final selection provenance. A local safety override remains valid safety behavior, but its final selection must be recorded as local and the original LLM proposal preserved separately.

Historical transitions are not rewritten. Replay may derive a conservative `selection_provenance_mismatch` warning when an available LLM proposal id differs from the recorded final candidate. Such records remain usable for execution/debug history but are excluded from claims of `llm_selected_execution` until a deliberate backfill policy is reviewed.

### 2. Treat evidence roles as structured observations, not one exclusive string

A transition can simultaneously contain a called workspace provider outcome, an LLM proposal, a local override, and an execution result. G2 code uses one shared classifier that reports independent facts such as:

- workspace provider called;
- proposed-selection source;
- final-selection source;
- execution source;
- selection-provenance consistency;
- eligibility for workspace comparison;
- eligibility for LLM-selection attribution.

Replay, proposal generation, and experiment manifests may derive display labels from that shared record, but cannot use conflicting local precedence rules. Environment/provenance eligibility is separate from evidence role; neither is promotion authorization.

### 3. Classify policy effect by mutation surface and possible decision influence

`presentation_only` is reserved for post-decision display or observability changes with `decisionInfluence: none`. It cannot demonstrate the first meaningful P9 policy lifecycle because it does not affect future deliberation.

Any policy inserted into a prompt, workspace serialization, memory activation, or other pre-decision context is at least `deliberation_shaping` with `decisionInfluence: possible`, even if a cloned shadow experiment is isolated from runtime. Candidate content/generation, routing, authority, execution, and hard-shell changes remain progressively higher-risk surfaces.

The first G3 target, if G2 passes, must therefore be described honestly as a narrow, facts/candidate/validation-preserving **deliberation-shaping** policy. It requires explicit human approval, canary evidence, full retrieval trace, and rollback. It must not be mislabeled as decision-neutral.

### 4. Proposal and experiment eligibility are source-resolved and fail closed

G2 eligibility requires:

- non-empty, valid protected targets compatible with the proposal's layer and mutation surface;
- source run/transition references resolved against recorded artifacts, rather than trusting self-asserted tags;
- a caller-selected source transition matching both the proposal source IDs and declared exact environment scope before any offline overlay is assembled;
- exact environment identity applicability for P9, with no implied cross-version compatibility;
- a complete provider experiment fingerprint for provider comparisons;
- visible manifest corruption or incompleteness, never silent omission;
- one final eligibility decision consumed by every shadow/applicator path.

P9 exact-identity applicability means a learned object can be considered only when its recorded environment fingerprint exactly matches the current one. It is not a claim of `compatible`; P12 owns compatibility ranges, quarantine, and revalidation.

## Consequences

- P9-G3 remains prohibited until a G2 evidence audit passes these implemented contracts with fresh natural paired/counterexample evidence.
- Existing card-select records with proposal/final mismatch cannot be cited as LLM-selection evidence, although they are retained as execution-history evidence.
- Existing P9.5 cloned-packet work remains valuable as isolated comparison tooling, but `wouldAffectRuntimeDecision=false` means only that the experiment did not alter runtime; it does not classify a future pre-decision policy as harmless.
- Stable promotion, wildcard live, automatic learning, provider/budget autonomy, and authority transfer remain disabled.
- P10 must build on immutable proposal/evidence/policy events and semantic scope rather than infer policy state from mutable proposal labels.

## Rejected Alternatives

### Treat the local override as an implementation detail

Rejected. It changes which legal candidate actually executed, so it changes selection provenance even when it protects safety.

### Keep `reason_policy` as `presentation_only` because shadow overlays are offline

Rejected. Offline execution isolation is correct but does not prove that applying the same pre-decision guidance later would be decision-neutral.

### Repair historical data in place

Rejected. Raw transition history is evidence. Add conservative derived warnings/exclusions instead of rewriting history.

### Block all future deliberation-shaping policy forever

Rejected. That would make the soft shell permanently hand-authored and contradict the North Star. The correct response is explicit impact classification, evidence, canarying, audit, and rollback.
