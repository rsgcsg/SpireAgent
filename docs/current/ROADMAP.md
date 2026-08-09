# Human-Equivalent Connector Roadmap

## HE-0: Architecture And Cutover

Status: complete. ADR-0008 is canonical; V3 is rollback/comparison only.

## HE-1: Clean C -> A Wire

Status: source/test complete; exact-runtime pending.

- `preview.2` pure C observation with no mode, D annotation or fake frame;
- opaque state-bound affordances; exact operands stay C-local;
- generic action verbs in A rather than affordance IDs;
- delivery receipt plus `SuccessorWatcher` readiness;
- HE cycle identity excludes transport tokens and affordance IDs.

Exit: build/install/cold-load exact `preview.2` and complete the shortest
ordinary regression without the proven shop open/close loop.

## HE-2: Positive UI Facts And Native Ownership

Status: positive HE projection complete; native ownership migration ongoing.

Known Surface families now use positive HE fact projection rather than
business-key deletion. Move useful family providers/adapters under neutral
`NativeUi` ownership as each path is touched; do not add shims, source
authority or a second executor.

## HE-3: Adaptation Holdouts

Status: pending exact runtime.

Exercise source-free combat-pile, unknown-source one-of-N/deck selectors,
stale replacement, duplicate request, unknown delivery, multi-stage selection
and `he_pure`. Known UI mechanics with a new source should need no wire, Re or
C-core change.

## HE-4: Human Information Parity

Status: partial.

Add truthful hover/focus/tooltip/scroll and native page open/read/return. Keep
semantic accessibility default; page transitions are optional evidence
profiles. Test a visual fallback only after a real unsupported custom-drawn UI.

## HE-5: Run Lifecycle Governance

Status: pending. Support abandon and return-menu as gameplay while denying
destructive profile/save/Mod management and quit unless explicitly configured.

## A Mainline

Status: ready to become the main effort after HE-1 exact-runtime regression.

Improve decision-lossless projection, previous transition context, planning,
cycle recovery and long-run quality. Do not move legality, hidden game rules or
business completion into A.

Learning, arbitrary Mod compatibility, Companion, Workshop, Headless and SDK
work are separate programs and not C short-freeze blockers.
