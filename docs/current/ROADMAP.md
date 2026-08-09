# Human-Equivalent Connector Roadmap

## HE-0: Architecture And Current Truth

Status: complete.

ADR-0008 is canonical; V3 is explicit rollback/comparison only.

## HE-1: Executable Structured UI Core

Status: source/test/build complete; load/Live pending.

- `HumanSnapshot`, exact owner/entities/controls and current affordances;
- generic state/frame-bound delivery and successor;
- source-free one-of-N and deck-card selection mechanics;
- direct Re consumer with `he_assisted` and `he_pure`;
- HE CLI preflight without V2 permission/qualification gates.

Exit still pending: cold-load matching artifact and complete an ordinary Live
journey without hidden V3 execution.

## HE-2: Adaptation Holdouts

Status: pending exact runtime.

Exercise both unknown-source selectors, stale replacement, duplicate request,
unknown delivery, multi-stage selection and `he_pure`. A new source preserving
known UI mechanics should require no wire, Re or Gateway-core change.

## HE-3: Human Information Parity

Status: partial.

Add hover/focus/tooltip/scroll and native page open/read/return to normal Agent
flow. Keep semantic accessibility default and human page transitions optional.

## HE-4: Run Lifecycle Governance

Status: pending.

Support abandon and return-menu as gameplay. Deny destructive profile/save,
Mod/global management and quit application unless explicitly configured.

## HE-5: A Improvement

Status: next mainline after HE-1/2 evidence.

Improve compact observation, previous-action/surface diff, planning and
recovery. Do not move legality, execution or hidden game rules into A.

## Later, Separate Work

Bounded visual fallback, public binary packaging, Companion, Workshop, SDK,
Headless and learning require their own evidence and are not C freeze blockers.
