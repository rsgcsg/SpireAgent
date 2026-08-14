# Preview.72 A-First Generated-Choice Architecture Closeout

## Status

Current architecture audit and implementation closeout, 2026-07-28.

This report records source facts, exact Preview.71 runtime evidence, the
Preview.72 code correction, and the critical disposition of four external
architecture critiques. It is not Organic qualification. Current artifact
identity remains canonical in [Status](../STATUS.md).

## Architecture Verdict

Retain the Semantic Gateway two-plane architecture and amend it to be
explicitly **Workflow A first**. A replacement architecture is not justified.
The real defects were local boundary errors:

- one exact native source and result branch was missing;
- Re confused an observable settling owner with absent mutation permission;
- `Context` had been used too often as a business-source discriminator; and
- current status still described Preview.71 as not loaded after four real
  runs proved otherwise.

The selected live decomposition is:

```text
world Context
+ one active interaction Surface and decision purpose
+ exact internal source/participant binding
+ opaque state-bound actions when controls are ready
+ native Commit
+ action-local outcome Witness
+ independent read-only Inspection
```

Compatibility/evidence remains a supporting plane. It must not dominate the
Agent Prompt or substitute package counts for run reliability.

## Exact New Runtime Evidence

All four runs used exact loaded Preview.71:

```text
protocol       2.0-preview.71
Gateway SHA    fd0f7c56cbafd7fcf84386b0ee69944ca2f8170f8982dce9640d2e4f5cf679e6
Gateway MVID   0acccd3d-8d08-4f95-ae64-75fc758a95f5
runtime        19219d23cecb41bf93370f31b73c6bde
game           v0.109.1|c8c577f6|-820620422
Modset         exact_bridge_only
mode           migration_exploration
```

| Run | Result | Evidence |
|---|---|---|
| `run-20260728085047-akattr` | invalid-state stop at decision 5 | exact Hefty Tablet `NChooseACardSelectionScreen` had no source binding |
| `run-20260728090432-731pf1` | same immediate stop | repeated the same source gap without mutation |
| `run-20260728090507-p3jx5s` | invalid-state stop after 111 prior decisions | Skill Potion generated choice was honestly `settling`, actionless, and `candidate_observation_only`; Re demanded mutation scope anyway |
| `run-20260728091032-3oihpi` | completed run boundary | ten decisions completed the current game/menu boundary without the two failing branches |

Provenance is `unrecorded`. These runs are exact-runtime defect and coverage
evidence only. They do not create Organic or persistent qualification.

## Source Truth: Hefty Tablet

The exact v0.109.1 `HeftyTablet.AfterObtained` implementation:

1. creates three Rare card offers;
2. opens `CardSelectCmd.FromChooseACardScreen(..., canSkip: true)`;
3. creates one exact new `Injury`;
4. adds the selected card before the Injury when one was selected; and
5. commits the resulting one- or two-card list to the run deck.

Therefore Hefty Tablet and Lead Paperweight share only the one-of-N screen
mechanics. Their decision and completion semantics differ:

| Branch | Selected | Skipped |
|---|---|---|
| Lead Paperweight | selected exact card; deck `+1` | deck unchanged |
| Hefty Tablet | selected exact Rare plus new Injury; deck `+2` | new Injury; deck `+1` |

Preview.72 keeps one `generated_card_choice` Surface, adds exact sealed
`HeftyTablet` source binding, exposes the Injury tradeoff in purpose and label,
and adds a dedicated post-state Witness. Unknown relics and derived Mod types
remain untracked and fail closed.

The relic task, not the room name, proves this semantic source. Re and Gateway
no longer require `NEOW` merely because the first Lead Paperweight evidence
occurred there. Combat-generated choices still require combat context because
their exact source contract is combat-local.

## Settling And Permission Truth

The Skill Potion failure had:

```text
context           combat
surface           generated_card_choice
source            skill_potion
readiness         settling
legal_actions     []
capability        candidate_observation_only
```

Gateway behavior was correct. The current active input owner existed, but the
opening guard had not yet yielded legal controls. Re incorrectly required the
Surface to appear in an action scope merely because it was active.

Preview.72 requires mutation scope only when legal actions are published. An
actionless `settling` Surface may match `candidate_observation_only`; Re projects
it as settling and produces no allowed actions. A ready Surface with no actions,
an action-bearing observation-only Surface, or a non-settling unscoped Surface
still fails closed.

## Critical Review Of The Attachments

Accepted:

- full evidence, model DecisionProjection, and action authority are separate;
- A-side decision continuity must outrank control-plane sophistication;
- Context, Surface, source binding, Inspection, and memory are orthogonal;
- an Outcome Oracle must recognize every exact native outcome branch rather
  than assume one visible reward shape;
- shared UI is evidence for a bounded mechanic, not automatic shared business
  semantics; and
- governance metadata should not occupy the strategy hot path by default.

Corrected or rejected:

- The claim that the current architecture is fundamentally A-misaligned is too
  broad. ADR-0002 already has the necessary ownership boundaries; priorities
  and several implementations needed correction, not wholesale replacement.
- A universal observation/fact framework is premature. Typed availability is
  useful, but migrating every field now would enlarge the protocol without
  evidence that it closes a current run failure.
- A generic selector or result DSL is rejected. Hefty Tablet demonstrates why
  shared UI mechanics and distinct native results must coexist.
- A coherent successor alone cannot prove every mutation succeeded. Current
  action-local Witness and unknown-no-retry remain required.
- Broad `reconciled_degraded` continuation is deferred. Preview.71's empty
  treasure issue and Preview.72's two defects have specific repairable causes;
  no current evidence justifies allowing ambiguous mutation results to pass.
- Contract/operation count is not a maturity metric. Reliability is measured
  by supported decision boundaries, exact results, visible-information
  completeness, and long-run continuation.

## Code And Test Result

Preview.72 changes:

- exact Hefty Tablet source catalog and active task binding;
- purpose-specific select/skip labels and semantic Witness;
- strict Re wire and normalized-state branch;
- operation-scoped actionless settling observation support;
- `actionAuthority=none` while settling publishes no actions; authority becomes
  `bridge_advertised` only with an actual opaque action set;
- protocol `2.0-preview.72` and normalized schema `29`.

The initial targeted tests and full pre-install checks distinguish static
contract evidence from Live evidence. A new build or installed DLL is not
loaded until the game reports the same SHA/MVID after cold start.

Final non-Live artifact truth:

```text
protocol        2.0-preview.72
built SHA       afb0261fdf1ca8433bdcbc3de2e1270f00daf802da3aaf507492357da399a140
installed SHA   afb0261fdf1ca8433bdcbc3de2e1270f00daf802da3aaf507492357da399a140
built MVID      3e9ad83a-37c9-40dc-bca0-877187c9bdae
installed MVID  3e9ad83a-37c9-40dc-bca0-877187c9bdae
loaded SHA      afb0261fdf1ca8433bdcbc3de2e1270f00daf802da3aaf507492357da399a140
loaded MVID     3e9ad83a-37c9-40dc-bca0-877187c9bdae
runtime         14238a9e9bf443c580a8dfe80bd571fd
game            v0.109.1|c8c577f6|-820620422
Modset          exact_bridge_only
mode            migration_exploration
observation     ready
provisional     ready
mutation        disabled before encounter trial
Inspection      disabled
rollback        STS2MCP/.local/deployments/2026-07-28T13-05-29-650Z
```

Final checks passed: Gateway `190/190`, Re `204/204`, Re typecheck/build,
Release build with zero warnings/errors, connector CLI, run-identity,
compatibility/permission/qualification/Profile/migration fixtures, active-link
and inventory/adaptation checks, and `git diff --check`. The compatibility
audit still reports native `Tutor` as an unregistered `code_required` owner;
that diagnostic has no authorization or qualification effect.

The post-load read-only snapshot is local ignored evidence at
`STS2MCP/.local/evidence/connector-readonly-2026-07-28T13-15-41-888Z.json`.
It captured `state_1c131026e7_1`, identity-shadow status
`candidate_non_authorizing`, and no partial diagnostic failures. It does not
record an action or qualify an operation.

## Non-Claims And Next Evidence

- No Preview.72 live mutation or settling observation has occurred yet.
- Hefty select and skip both require current-artifact bounded runtime evidence.
- Skill Potion settling needs a current-artifact transition canary followed by
  a fresh ready observation and normal opaque action execution.
- No persistent qualification, cross-version generalization, Mod inheritance,
  wildcard permission, or full player-visible closure is claimed.
- Unknown generated-choice sources, Crystal Sphere, standalone potion discard,
  non-standard modes, and multiplayer remain unsupported or separately scoped.

The shortest next experiment is a normal Workflow A run on this loaded identity. If a
Hefty or generated-combat settling branch appears naturally, preserve the
before/after state, receipt, successor, loaded identity, and run summary. Do
not manufacture the branch or retry an unknown mutation.
