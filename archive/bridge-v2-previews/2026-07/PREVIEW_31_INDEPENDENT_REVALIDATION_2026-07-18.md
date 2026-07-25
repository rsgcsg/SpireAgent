# Preview.31 Independent Revalidation

Date: 2026-07-18  
Branch: `develop`  
Fixed HEAD: `d4fb843ffc99aeefd69540f89707ef7c117211fc`  
Remote: `origin/develop` at the same SHA

The two architecture critique documents were used only as question lists.
This report is based on the fixed repository tree, current permission code,
current Bridge/Re contracts, Release bytes, Steam-loaded runtime identity, and
the Organic evidence that can be resolved from the current device.

## Runtime And Build Identity

| Item | Verified value |
|---|---|
| protocol | `2.0-preview.31` |
| Bridge version | `0.5.0-dev` |
| imported STS2MCP baseline | `20eadebde358a37cca41f8b38728099e6d0d19db` |
| game process | `E:\SteamLibrary\steamapps\common\Slay the Spire 2\SlayTheSpire2.exe` |
| exact game identity | `v0.109.0|c12f634d|1833084275` |
| Release/installed DLL SHA-256 | `7720A5E4E3F7ABCEEB1BD1E11EFEFDA80D313A6C73619AE8ACDA09322D76DF4D` |
| Release/installed/loaded MVID | `8a915c2c-3ba3-48d3-92de-6ca9e612b191` |
| loaded runtime instance | `c3ffb7fd98d54dc88f37d2391ea6b4f6` |
| runtime compatibility | `untested` |
| runtime authority | actions, state observation, and Inspection all disabled |

The process was normally restarted through Steam app `2868840` after copying
the current Release. Release and installed hashes are identical. The new
runtime reports the Release MVID, so this is loaded-module evidence rather than
disk-presence evidence.

## Findings

### 1. Empty Surface Scope

**已证实 / 已修复.** `BridgeSurfacePermission.IsActionPermitted` requires both
the global action flag and explicit qualified/canary membership. Provider
selection and Capability support call the same helper. The recognized
historical v0.108 identity has empty lists and therefore no v2 Provider action
authority. There is no empty-list wildcard on the current HEAD.

### 2. Empty Inspection Scope

**已证实 / 已修复.** The parent revision still interpreted an enabled empty
Inspection scope as both declared fixed kinds and reported
`implemented_read_only`. Current HEAD removes that branch. Inspection request
authorization, advertised kinds, and support status now share
`BridgeSurfacePermission`; Re rejects contradictory empty-scope capabilities.
The loaded untested build advertises no kinds, and a state-bound `run_deck`
request returns `inspection_not_qualified_for_current_build`.

### 3. Provider, Capability, Wire, Re, And Documentation

**已证实.** Static inventory found 20 Provider kinds and 20 Capability kinds
with no missing or duplicate kind. The 20 C# Capability operation sets exactly
match Re's 20 `ACTION_KINDS` sets. Re uses only Bridge-advertised opaque actions
for Bridge-owned Surfaces, and current source-qualified qualified/canary/disabled
sets match Current Status, Protocol, and Coverage.

The inventory remains hand-maintained across C#, Zod, normalizers, fixtures,
and documentation. This is consistency at this HEAD, not proof that future
drift is impossible.

### 4. Publication And Execution Predicates

**仍存在.** State identity and exact object revalidation prevent stale mutation,
but several Providers manually repeat business predicates. `event_option`, for
example, publishes from visible + unlocked + enabled state and separately
rechecks position, object identity, lock, enabled state, and visibility in
`StartOption`, despite claiming the same validator. Combat and shop have similar
local duplication. A future edit can therefore advertise an action that later
self-rejects even though the global safety kernel remains Fail Closed.

### 5. Evidence Identity And Real Runs

**部分成立 / 需要 Organic Evidence.** Wire state, capabilities, Inspections,
Re negotiated metadata, and raw snapshots bind game identity, Bridge MVID, and
runtime instance. Closeout reports also record DLL SHA-256 and keep the Neow
Organic Journey on MVID `f2604133-ed1a-41f3-a638-ab38829d3cb5`, while the later
`bdc97168-3bc7-40c4-8a2e-bb0698169118` and current MVID are not credited with a
repeated journey.

However, `SurfaceCapability.Evidence` is free text and no machine-readable
manifest resolves an evidence ID to DLL SHA, exact game identity, MVID,
runtime instance, command/request IDs, and a persisted Re run. The current
device's `Re-SpireAgent/data/runs` does not contain the preview.30 MVIDs or its
named command IDs. Historical prose attribution is internally careful, but it
cannot be independently replayed from this device. Current MVID
`8a915c2c-3ba3-48d3-92de-6ca9e612b191` has build/install/load evidence only.

### 6. Canary Versus Qualification

**被当前源码否定.** Capability support reports canaries as
`candidate_action_canary`, not `qualified_exact_build`; Canonical documents do
not assign old Organic evidence to the current MVID. No canary was promoted by
this revalidation.

**部分成立.** Permission granularity is currently the Surface kind. Once a
Surface is canary-permitted, every operation its Provider validates may be
advertised for bounded canary execution. `treasure_room` therefore includes
open/choose/skip/proceed even though only choose/proceed have the documented
Organic evidence. This is not a false qualification claim, but it is broader
canary authority than an operation/origin-scoped evidence model would provide.

### 7. Incremental Architecture Pilot

**已证实.** Provider concentration is real: the combined shop Provider file is
799 lines and multiple purpose-specific Providers are 300-531 lines. Projection,
eligibility, exact binding, revalidation, command start, Completion, and
diagnostics commonly live together. Completion closures and C#/TypeScript
schema declarations are also repeated.

**被当前源码否定.** This does not justify a universal Surface, click API,
generic purchase contract, or Effect DSL. The existing
`BoundedCardSelectionFacts` demonstrates the safer B shape: shared mechanics
without authority. A C-level pilot is justified for two bounded selectors,
keeping Source Binding, business eligibility, and Completion purpose-specific.

## Verification

- Bridge tests: `61/61` passed.
- Re-SpireAgent: typecheck, `127/127` tests, and production build passed.
- Python adapter: `python -m py_compile mcp/server.py` passed.
- Bridge Release: zero warnings and zero errors.
- Release/installed DLL hashes: identical.
- Steam restart and loaded MVID/runtime identity: verified.
- `/api/v2/capabilities`: 20 disabled Surfaces, no action/Inspection scope.
- `/api/v2/state`: `unknown` + `unsupported`, `none_fail_closed`, zero actions.
- `npm run agent:inspect`: strict v2 accepted the identity but kept state
  invalid/non-actionable because exact-build authority is disabled.
- No action canary, Organic Qualification, permission expansion, Push, or
  Release publication was performed.

## A/B/C/D Decision

- **A:** retain one Active Surface, opaque state-bound actions, exact entity
  identity, execution revalidation, Semantic Completion, read-only Inspection,
  hidden-information boundaries, and exact-build Fail Closed.
- **B:** continue extracting read-only mechanics, projections, and finite
  witness helpers that cannot grant authority.
- **C:** pilot a typed contract/evidence inventory, operation/origin-scoped
  canary narrowing, and one shared pure validator across two genuinely repeated
  bounded-selection flows.
- **D:** no top-level Wire redesign is justified by current evidence.

## Consistency Verdict

Code, current permission lists, Wire/Re operation sets, Capability output,
current loaded runtime behavior, Current Status, Protocol, and Coverage agree
after this revalidation. Historical Organic ownership is not falsely moved to
the current MVID. Full evidence governance is not yet consistent by machine:
the missing typed manifest and unavailable raw preview.30 run are explicit
remaining boundaries.

## Smallest Next Verifiable Work

Introduce a non-authorizing typed inventory for one `treasure_room` contract
that distinguishes Surface, operation, origin, exact game identity, DLL SHA,
MVID, runtime instance, and evidence/run ID. Add a static cross-check and prove
that open/skip can remain disabled or canary-narrowed without changing
choose/proceed semantics. Do not promote any permission until a fresh exact-MVID
Organic run supplies the missing evidence.
