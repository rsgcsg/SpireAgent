# Bridge v2 Independent Architecture Audit

Status date: 2026-07-18

This is an independent audit of the current `develop` tree. The supplied
architecture documents were used as a critique framework only. Repository
source, current protocol output, exact installed game identity, and the
currently loaded module are the facts of record.

## Executive Decision

Keep the current top-level model:

```text
Environment identity
  -> shared visible state
  -> semantic context
  -> exactly one Active Surface
  -> opaque state-bound action
  -> execution-time revalidation
  -> semantic completion

Inspection = independent, read-only, state-bound evidence
```

The audit found real structural debt, but no evidence that a recursive Surface
stack, universal selector, low-level click API, generic purchase contract, or
Effect DSL would improve correctness. Those designs would move business
meaning into the client and recreate the v1 failure modes.

The highest-value changes are bounded internal reuse and typed evidence
governance. They must not change the external semantic action boundary or
silently expand exact-build authority.

## Repository And Runtime Ground Truth

| Item | Current fact |
|---|---|
| branch | `develop` |
| local HEAD | `d4fb843ffc99aeefd69540f89707ef7c117211fc` |
| `origin/develop` | same commit as local HEAD |
| protocol | `2.0-preview.31` |
| exact game process | `SlayTheSpire2.exe` from `E:\SteamLibrary\steamapps\common\Slay the Spire 2` |
| loaded game identity | `v0.109.0|c12f634d|1833084275` |
| Release/installed DLL SHA-256 | `7720A5E4E3F7ABCEEB1BD1E11EFEFDA80D313A6C73619AE8ACDA09322D76DF4D` |
| loaded Bridge MVID | `8a915c2c-3ba3-48d3-92de-6ca9e612b191` |
| runtime instance | `c3ffb7fd98d54dc88f37d2391ea6b4f6` |
| loaded capability compatibility | `untested` |
| loaded action/state/Inspection authority | all `false` |
| loaded Inspection status | `disabled_for_current_build`, no kinds |
| loaded state | `context=unknown`, `surface=unsupported`, zero legal actions |

The source-qualified historical target remains
`v0.109.0|c12f634d|-840572606`. Its five qualified Surfaces, twelve action
canaries, and `run_deck` Inspection are not inherited by the current local
hash. The current runtime was cold-started after installing the new Release
DLL, and `/api/v2/capabilities` reports the same protocol, MVID, runtime
identity, and disabled permission boundary.

## Proven Strengths

- `BridgeSnapshotBuilder` gates providers by exact-build permission and keeps
  legacy fallback separate from Bridge-owned action authority.
- `ActiveSurfaceResolver` requires a unique semantic owner. A missing or
  ambiguous owner fails closed.
- Actions are opaque, state-bound, and tied to exact object references or
  exact current controls. `BridgeCommandLedger` rechecks state and action
  identity before mutation.
- The ledger distinguishes `started`, `completed`, `rejected`, `failed`, and
  `timed_out`; an unexplained state change is not completion and timeout is
  `outcome=unknown`.
- Inspection is implemented separately from Surface providers. It is read-only,
  state-bound, does not enter the Command Ledger, and cannot grant action
  authority.
- Organic evidence is separated from implementation, compilation, loading,
  canary, and qualification. No current local MVID is credited with an older
  journey.
- Re-SpireAgent strictly decodes typed Surface discriminators, checks state and
  capability identities, and suppresses candidate-build actions rather than
  merging them with v1 execution.

## Confirmed Structural Debt

| Area | Evidence from current code | Decision |
|---|---|---|
| Provider responsibility | Providers commonly combine owner detection, projection, eligibility, execution revalidation, and Completion. Several are 300-700 lines. | **C later:** extract non-authoritative mechanics, Source Binding, pure validators, and witnesses incrementally. Keep semantic contracts provider-specific until repeated evidence justifies extraction. |
| Owner detection | `ActiveSurfaceResolver` calls full `TryBuild` providers to establish a match. Legacy fallback repeats provider resolution. | **C later:** add a read-only owner probe only when it can be proven cheaper and semantically narrower. Do not let a probe grant authority. |
| Publication vs execution legality | Event option and shop flows duplicate local predicates. Event option text claims a shared validator, but the current code does not provide one. | **C:** add pure shared validator results for the first repeated contract pair. Execution may add identity and timing checks, but not a second business definition. |
| Completion implementation | Semantic witnesses exist, including merchant-removal and shop-purchase witnesses, but many providers still carry inline closures. | **B/C:** extract a small set of observable witness primitives. Keep purpose-specific postconditions and do not model arbitrary effects. |
| Inspection scope | The old empty-scope branch treated an empty list as wildcard. The action helper had been hardened, but capability status still had a latent contradictory `implemented_read_only` branch. | **Implemented in this audit:** one shared Inspection permission interpreter, explicit empty-scope Fail Closed, capability status derived from permitted declared kinds, and Re decoder contradiction checks. |
| Shared visible state | A failed active-run shared-state projection suppresses the whole action surface. | **A for now:** retain whole-surface Fail Closed. Field-criticality downgrades need current-source and organic evidence first. |
| Unknown typed fields | Unknown Event tooltip types throw and fail the surface rather than being silently flattened. | **A for now:** preserve this boundary. **P1 later:** classify identity-, legality-, Completion-, strategy-, and decorative-critical fields with tests before allowing partial observation. |
| Capability declarations | C# manually declares 20 Surface capabilities; Re independently owns the protocol schema; evidence is a free string. | **C:** add a typed contract/evidence manifest for validation and reporting. It must not grant permission by itself. |
| Exact-build qualification cost | `BridgeGameIdentity` hardcodes an exact hash and explicit per-kind permissions. A version/commit match is insufficient. | **C later:** introduce layered fingerprints and targeted requalification, while keeping exact-build and explicit permission as the final gate. |
| Schema duplication | C# DTOs, TypeScript Zod schemas, fixtures, and docs are hand-maintained. | **C:** add protocol golden fixtures or generated structural declarations. Keep semantic invariants and authority rules hand-reviewed. |

## Surface And Inspection Permission Audit

The current runtime has exactly one action owner path. `Context` and shared
state describe facts; only the resolved Active Surface can publish actions.
Unqualified matching is used for diagnostics and legacy handoff, not to create
v2 actions. A provider match is not a permission grant.

The action permission helper now requires both the global compatibility flag and
explicit membership in the qualified or canary list. The Inspection helper has
the same rule. An empty qualified/canary list therefore means no permitted
Inspection kinds, even when the exact build is otherwise recognized.

The capability status is now computed from the declared fixed Inspection kinds:

- no permitted kinds: `disabled_for_current_build`;
- qualified kinds only on a qualified scoped build:
  `qualified_read_only_scoped`;
- qualified and canary kinds together: `mixed_scoped_read_only`;
- canary-only permission: `candidate_read_only_canary`.

Re now uses the explicit qualified-plus-canary Inspection scope for identity
checks and rejects both contradictory forms at the wire boundary:

- disabled Inspection status with advertised kinds;
- non-disabled Inspection status with no explicitly permitted kinds.

This closes a source, wire, and client contradiction without changing any
qualified or canary list.

## Evidence And MVID Governance

| Evidence | MVID | Status |
|---|---|---|
| Neow Organic Journey | `f2604133-ed1a-41f3-a638-ab38829d3cb5` | Organic evidence for that loaded build only |
| Historical final target build with stricter completion predicate | `bdc97168-3bc7-40c4-8a2e-bb0698169118` | source/test/build/install/load verified; no repeated Organic Journey attributed |
| Current local Release and loaded build | `8a915c2c-3ba3-48d3-92de-6ca9e612b191` | source/test/build/install/load verified; no canary and no Organic Qualification |
| Superseded pre-audit local load | `07589587-06a0-437d-9ed8-b39441aecf21` | historical deployment identity only; not the current loaded artifact |

The current `SurfaceCapability.Evidence` field is useful for human context but
is not a typed qualification record. The next governance improvement should
make evidence IDs resolve to exact game identity, Bridge MVID, runtime instance,
test/build/load/observation/canary/qualification status, and source report.
That manifest must be auditable and reportable, not executable permission.

## A/B/C/D Decisions

### A: Keep unchanged

- one Active Surface owns actions;
- opaque, state-bound actions with exact entity binding;
- pre-mutation state and identity revalidation;
- semantic Completion and Unknown Outcome;
- independent read-only Inspection outside the ledger;
- hidden-information policy and hard failure for unknown critical bindings;
- centralized explicit permission lists and exact-build default denial;
- strict protocol versioning until compatibility evidence proves otherwise.

### B: Extract only non-authoritative helpers

- bounded card selection facts;
- typed entity projection;
- deterministic source/evidence formatting;
- small observable witness predicates;
- protocol fixture builders.

The existing `BoundedCardSelectionFacts` is the right shape: it reads shared
mechanics without deciding purpose, legality, authority, commit, or Completion.

### C: Adopt incrementally where repetition is proven

- Mechanism Adapter for repeated bounded-selection mechanics;
- deterministic Source Binding for owner/task/command/caller facts;
- pure shared Validator returning a typed legality result;
- Semantic Contract retaining purpose-specific actions and Completion;
- typed Evidence Manifest and capability cross-checks;
- owner probes that remain observation-only;
- layered fingerprints that reduce requalification work without inheriting
  permission.

### D: Do not adopt on current evidence

- universal card selector or menu Surface;
- recursive executable overlay/transition graph;
- low-level `click(index)` or node-path wire API;
- generic purchase or universal Effect DSL;
- LLM/source-reflection-driven runtime authorization;
- automatic qualification from implementation or assembly version equality.

## Consistency Judgment

After this audit fix, the current source, C# capability computation, Re decoder,
loaded runtime, and canonical status describe the same local-build truth:
protocol `2.0-preview.31`, current exact game hash `1833084275`, loaded MVID
`8a915c2c-3ba3-48d3-92de-6ca9e612b191`, no current-build action or Inspection
authority, and no Organic Qualification.

The source-qualified target matrix remains historical target evidence. It is not
represented as current local authority. The current evidence and documentation
therefore agree on the important distinction between implemented, tested,
built, installed, loaded, canary-permitted, canary-exercised, qualified, and
historical-only.

## Verification

- `dotnet test ... -p:STS2GameDir=...`: 61/61 passed.
- `npm run check`: 126/126 tests passed, strict typecheck passed, production
  build passed.
- Release Bridge build: zero warnings, zero errors.
- Release/installed SHA equality: passed.
- Cold Steam restart and loaded-module identity: passed.
- `/api/v2/capabilities`: protocol, MVID, runtime instance, exact game identity,
  and disabled permissions verified.
- No action canary, Organic Qualification, permission expansion, Push, or
  Release publication was performed.

## Remaining Fail-Closed Boundaries

- Current local hash `1833084275` is untested for Bridge v2 authority.
- Main-menu and unsupported state surfaces remain unavailable to v2.
- All action and Inspection kinds remain disabled on the current local build.
- Unknown or contradictory owner, identity, tooltip, shared-state, or Completion
  evidence suppresses authority.
- Historical MVID evidence cannot qualify the current DLL.
- Canaries remain canaries; fixture, source, build, install, and load evidence
  cannot promote them.

## Highest-Value Next Work

Run a bounded current-build source and organic canary for the highest-value
single contract, then record it in a typed evidence manifest keyed by the new
MVID. Before that, implement the first shared pure validator and owner probe on
two genuinely repeated bounded-selection flows, with no permission change until
the resulting post-state evidence passes.
