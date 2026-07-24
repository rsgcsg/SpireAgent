# Gate 1 Adaptation And Compatibility Closeout

Date: 2026-07-24  
Repository baseline: `58d18aee39a54890b78bd10dd6e1d7276f45a5c1`  
Source protocol after this change: `2.0-preview.62`

## Verdict

Gate 1 is closed as a **bounded ordinary-single-player v2 connector
baseline**. This means:

- Re and the default MCP adapter are v2-only;
- the Gateway v1 namespace is retired;
- the exact loaded Preview.61 environment completed the previously missing
  Neow's Fury lifecycle through Re;
- action publication, execute-time validation, command settlement and semantic
  completion are present for the bounded supported journeys;
- repeated combat-pile source additions no longer require source-specific C#
  binding records, patches, provider branches or Re unions;
- exact-environment permission is a reviewed embedded policy instead of a C#
  build whitelist;
- a reproducible, non-authorizing exact-assembly audit discovers missed
  selector sources and verifies registered selector/commit call structure.

Gate 1 closure is not complete-game coverage, Mod compatibility, automatic
authorization, player-visible-information closure or product readiness.

## Evidence Boundary

The runtime seal comes from ignored local run evidence and the exact loaded
Preview.61 identity:

```text
run        run-20260724045013-mgcq3a
decisions  decision-000008-mrygpbhw-dzzoo0
           decision-000009-mrygpdi3-l28c9u
           decision-000010-mrygpfqi-aqxv5b
protocol   2.0-preview.61
SHA        9b6f62161f8c6c286a73cb157430b441014c5148ff702ea96894e6f702386a99
MVID       efd31a31-9c2a-4b68-ae22-1cabc1b382f1
runtime    7e6ffb41d8154625bd42ea34190194ef
game       v0.109.0|c12f634d|-1639417500
Modset     exact_bridge_only
```

The sequence was:

1. `play_card` for the exact Neow's Fury instance completed after the required
   child Surface opened;
2. `toggle_combat_pile_card` completed with an exact selected-set change and
   no pile commit;
3. `confirm_combat_pile_selection` completed only after source-task closure,
   child closure and exact selected-card movement from discard to hand.

This closes the Preview.61 runtime-seal item. It does not provide Organic
evidence for newly registered Preview.62 sources.

The exact-assembly audit used the current local macOS arm64 `sts2.dll`:

```text
game assembly SHA   06c78d946ca70658e85abb28f6dc2ee0a023a4467faf0708ff542180fe5f4c82
game assembly MVID  ceb123d1-63f0-4b8e-937c-5c49cec4c651
release             v0.109.0 c12f634d
```

The audit is source/build evidence only. It cannot replace loaded identity,
runtime patch closure, a canary or Organic qualification.

## Preview.62 Deployment Seal

After the source and audit checks passed, the game was closed, the Release DLL
was copied, and STS2 was cold-started through Steam. The exact loaded identity
was:

```text
protocol  2.0-preview.62
SHA       d66f5986f8216104fec76412c4b46b4c863076d0c8c7c5870a66fdb9f0c5a892
MVID      b7bf3824-80bf-4281-9267-262595ce0f49
runtime   6cf5f02288ed40448634656414524f6b
game      v0.109.0|c12f634d|-1639417500
Modset    exact_bridge_only
fingerprint 39d43817a8419e7065ce101aa42bced25e30b914fe0341588ab748822aa0662e
policy    bridge_v2_exact_environment_policy_2026_07_24
digest    1a3f5107e833bb5d561a36bbc2756340392225380088430229d7ef2dcf659f8f
```

Built, installed and loaded SHA matched. Re strict inspection decoded the
stable main-menu state and the same policy provenance. `/api/v1` and
`/api/v1/singleplayer` both returned `410`. This seals deployment,
negotiation, policy provenance and v1 retirement for Preview.62. It does not
transfer Preview.61 Organic evidence or qualify any newly registered source.

An operator-directed current-runtime canary then completed
`main_menu -> singleplayer_menu -> main_menu` through request IDs
`preview62-final-open_singleplayer-1784881719652334000` and
`preview62-final-back-1784881745227362000`, with coherent successor states
`state_4d51f98937_1 -> _2 -> _3`. Each action was submitted once. When the local
poll script stopped after the first submission, the same request was polled to
completion rather than retried. This is a final-artifact action-path recheck,
not a new Surface qualification.

## Problem That Was Real

Before Preview.62, combat-pile support grew through:

```text
card source literal
-> source-specific Harmony patch or binding record
-> provider source switch
-> source-specific completion branch
-> Re source-card union or documentation update
```

The recent Seance, Dredge, Charge and Neow failures were reproducible examples.
More importantly, exact-assembly discovery found seven additional native
`CardSelectCmd.FromCombatPile` callers that run-driven patching had not found:

- Cosmic Indifference;
- Hologram;
- Secret Technique;
- Secret Weapon;
- Seeker Strike;
- Tutor;
- Wish.

This proved that source-by-source runtime failure discovery was incomplete and
too expensive.

## Selected Architecture

The selected bounded model is:

```text
native game source/task
-> reviewed source contract registry
-> one generic task-local source binding
-> native visible grid and current controls
-> opaque state-bound action
-> closed witness topology
-> game-owned commit
-> semantic post-state witness
```

Exact-environment authority is:

```text
runtime game identity
-> reviewed embedded exact-environment policy
-> explicit Surface/Inspection tier
-> explicit operation scopes
-> current source binding and legality
-> execute-time revalidation
```

The architecture deliberately separates:

1. **Discovery:** locate source methods and structural call sites.
2. **Verification:** compare exact assembly identity, selector call, expected
   native commit primitive and reviewed contract.
3. **Authorization:** only an embedded reviewed policy and current operation
   scope can publish actions.
4. **Qualification:** only exact loaded identity plus bounded runtime evidence
   can raise an evidence claim.

`discovered != verified != authorized != qualified`.

## Zero-Core-Code Boundary

Zero-core-code means no new C# provider, patch class, witness implementation,
wire Surface or Re branch. It still requires reviewed data, a rebuild, tests,
an exact audit and evidence appropriate to the requested tier.

| Change | Expected adaptation |
|---|---|
| New runtime instance of an existing contract | automatic, no repository change |
| Data/stat/text/catalog update that preserves visible fields and native semantics | no core code; exact identity and regression checks still apply |
| New native source using an existing combat-pile mechanism, owner binding, closed mutation, commit and witness | registry-only candidate; audit, review, rebuild and canary required |
| New exact game build with unchanged reviewed contracts | exact-environment policy candidate; never inherited from version text alone |
| New Mod content using a proven closed contract | future registry/policy candidate; current production Mod policy remains diagnostic-only |
| New UI owner, target-player binding, selector stage, commit primitive, hidden-information rule or witness topology | code and a new contract review are required |
| Open-ended script or action-relevant Mod patch | fail closed unless its affected operation can be bounded and reviewed |

The first data-only migration registered Cosmic Indifference, Hologram, Secret
Technique, Secret Weapon, Seeker Strike and Wish without a source-specific C#
branch. Their native visible grids remain the legal-candidate authority;
Seeker Strike exposes only the sampled cards already shown by the UI, never
the hidden RNG or omitted draw-pile options.

Tutor is the negative holdout. Its selected pile belongs to
`cardPlay.Target.Player`, not necessarily `SourceCard.Owner`. The current
single-owner contract must not authorize it. Supporting Tutor requires an
explicit participant-binding contract and multiplayer/target ownership
evidence, not another card-name exception.

## Automated Verification

The public developer command is:

```bash
export STS2_GAME_DIR="/path/to/Slay the Spire 2"
npm run audit:connector-compatibility
```

It writes an ignored report under
`STS2MCP/out/compatibility-audit/latest.json` and:

- hashes and identifies the exact game assembly;
- reads release identity;
- fingerprints the reviewed registry and environment policy;
- resolves async source methods;
- verifies registered calls to `CardSelectCmd.FromCombatPile`;
- verifies the expected native commit primitive for the closed witness kind;
- discovers unregistered callers.

It has `authorization_effect=none` and `qualification_effect=none`.
Specifically, it does not prove:

- active UI ownership;
- exact source/destination arguments in every branch;
- runtime Harmony patch closure;
- semantic completion;
- loaded Bridge identity;
- Modset compatibility.

Those limitations are machine-readable in the report.

The loaded Gateway also validates the embedded registry before publishing its
operation scopes. A missing, unresolved or internally inconsistent registry
suppresses only `combat_pile_card_selection` authority and emits
`bridge.compatibility.combat_pile_registry_invalid`; an invalid exact-
environment policy suppresses all authority. This keeps deployment corruption
visible and locally bounded instead of advertising a permanently unusable
canary.

## Rejected Alternatives

- **Universal selector:** rejected because identical grids do not imply the
  same owner, business purpose, commit or completion.
- **Executable effect DSL:** rejected because it would move game authority into
  the Gateway/client and make Mod effects unsafe.
- **Discover-and-auto-authorize:** rejected because the Tutor negative holdout
  demonstrates that a matching selector call is insufficient.
- **External mutable permission JSON:** deferred. An unsigned local policy file
  would make player convenience depend on a new privilege-escalation surface.
  The current policy is embedded and reviewed. A future Companion may
  distribute signed policy bundles.
- **Version-only compatibility:** rejected. Permission remains exact runtime
  identity plus Modset plus reviewed operation scope.

## External Comparison

- [`wuhao21/sts2-cli`](https://github.com/wuhao21/sts2-cli) demonstrates that a
  consumer can reuse the real game engine behind a compact structured command
  boundary. That is useful evidence against reconstructing game rules in Re,
  but its headless/CLI host does not prove live UI input ownership, stale
  opaque actions, Mod patch closure or current Bridge completion witnesses.
- [`Gennadiyev/STS2MCP`](https://github.com/Gennadiyev/STS2MCP) remains the
  transport ancestry and a useful simplicity baseline. The retired v1 path
  showed why transport-level actions without exact state/action/completion
  ownership were insufficient for long-running Re control.
- Harmony's runtime patch metadata can support the next non-authorizing
  action-relevant patch inventory. Patch discovery alone still cannot prove
  business equivalence or grant a mutation scope.

The selected registry/audit slice is therefore narrower than a generic
headless command API and safer than source-literal runtime discovery, while
remaining substantially smaller than a universal transaction/effect DSL.

## G1 Acceptance Matrix

| Requirement | Result |
|---|---|
| Re observation -> advertised action -> submit -> completion -> successor | pass on exact loaded v2 journeys |
| v1 mutation and read fallback removed | pass; Gateway v1 returns `410 Gone` |
| one Active Surface and opaque state-bound actions | pass |
| execute-time validation and unknown-no-retry | pass |
| semantic completion rather than screen-close-only | pass for bounded contracts |
| final Neow's Fury runtime seal | pass on Preview.61 run listed above |
| repeated combat-pile source adaptation without C# branches | pass for six reviewed data-only candidates |
| negative structural holdout rejected | pass; Tutor remains unregistered |
| exact-build policy no longer hardcoded in C# | pass |
| automatic Mod authorization | not implemented and not a G1 claim |
| complete player-visible information | not complete; Gate 2 |

## Remaining Boundaries

- The six new Preview.62 source entries are source-audited canary candidates,
  not organically qualified.
- Tutor and every unregistered source remain fail closed.
- Current production permission still requires the exact Bridge-only Modset.
  Action-relevant Harmony patch inventory is not implemented.
- Crystal Sphere, standalone potion discard, non-standard menu/profile flows
  and multiplayer remain unsupported or outside the bounded G1 scope.
- Environment policy changes are data-only but still require review, build,
  installation, exact loaded identity and evidence. There is no remote or
  unsigned self-update.
- The audit detects call structure, not semantic equivalence. Negative fixtures
  and runtime canaries remain mandatory.

## Next Gate

Gate 2 may now begin with player-visible information closure and
non-authorizing transaction-correlation experiments. It must not reinterpret
the registry as a universal transaction engine, auto-authorize Mods, or widen
unknown runtime permissions.

The next connector adaptation work should be:

1. add a negative fixture suite for target-owner, changed commit and missing
   completion cases;
2. inventory action-relevant Harmony patches at runtime without granting
   permission;
3. prototype a signed/offline compatibility report workflow before any
   player-facing automatic requalification;
4. collect bounded Organic canaries for the newly registered sources when they
   occur naturally.
