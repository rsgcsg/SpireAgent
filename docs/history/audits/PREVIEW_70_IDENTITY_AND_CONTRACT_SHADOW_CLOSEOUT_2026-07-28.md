# Preview.70 Identity And Contract-Shadow Closeout

Status: non-Live engineering complete; built and installed; cold-load and
fresh run evidence pending.

## Scope And Architecture Verdict

The single target remains the Semantic Gateway two-plane architecture in
ADR-0002, with ADR-0003's lean native-contract migration. This slice does not
replace `state_id`, operation permission, native Commit, completion, or the
Gateway-owned permission manager.

Two tempting changes were rejected:

- weakening stale-state rejection because a prior run contained 11 refusals;
- treating all operation-catalog rows as runtime-resolved native contracts.

Both would exceed the evidence. The work instead adds reproducible,
non-authorizing measurements and makes explicit-contract candidates visibly
different from manifest hypotheses.

## Recorded-Run Evidence

`npm run connector -- audit-run-identity --run <run-id>` reads immutable Re
records and snapshots. It does not call the game, mutate evidence, or grant
permission.

For `run-20260728041630-2z58bz` under Preview.69 SHA
`914974b5...`, MVID `1e457e86...`, runtime `7a312974...`:

```text
stale refusals                              11
semantic + authority candidate changed      2
semantic candidate only changed              9
authority candidate only changed             0
neither candidate changed                     0
selected kind + exact operands still present 11
```

The selected action shape remaining present is not permission to execute it:
recorded examples include changing combat pile counts, hand contents, and
enemy Power amounts. Those are player-visible semantic changes that can alter
strategy and require a fresh model decision. There is no observed
`composite-only` stale candidate in this run.

`run-20260728044555-ltyx7d` used the same exact runtime and completed a fresh
character-select-to-game-over-to-main-menu journey:

```text
decisions                    107
executed_and_settled         106
run_boundary                   1
stale/unsupported/invalid      0
observation/provider failure   0
unsettled/unknown              0
```

It exercised combat, generated-card choice, event, map, card reward, reward
claim, shop room/inventory, game over, and menu surfaces. Provenance remains
`unrecorded`; both runs are defect and coverage evidence, not Organic or
persistent qualification.

## Contract-Shadow Repair

Preview.69 exposed every manifest operation through one shadow shape. That
made five manually reviewed component contracts indistinguishable from 82
manifest-derived fallback identities.

Preview.70 adds non-authorizing operation-shadow resolution:

- `published_explicit_candidate` / `unpublished_explicit_candidate` carry a
  contract digest, separate interaction/owner/source/operand/Commit/completion/
  Witness digests, completion boundary, Witness ID, and risk class;
- `published_manifest_hypothesis` / `manifest_hypothesis` carry no component
  digest and remain test-confirm inventory;
- `unregistered` remains explicit rather than receiving inferred semantics.

This is deliberately not a universal transaction DSL. It exposes the
component boundaries already present in the five explicit catalog rows so D
tooling can compare them. It does not infer a source from text, UI similarity,
operation name, or Mod manifest.

## Validation And Deployment

Completed before this closeout:

- C# tests: 177 passed;
- Re tests: 202 passed;
- Re typecheck and production build passed;
- connector CLI and identity-audit fixtures passed;
- Preview.70 Release build succeeded without warnings.

Installed artifact:

```text
protocol        2.0-preview.70
built SHA       28c32f40e22abf1779499d6d28ac4e6dbcea1e0b3d090aa8941ba02d5afbbc55
installed SHA   28c32f40e22abf1779499d6d28ac4e6dbcea1e0b3d090aa8941ba02d5afbbc55
built MVID      6f169dfe-3938-4256-ac85-af0e9b3e2ff1
installed MVID  6f169dfe-3938-4256-ac85-af0e9b3e2ff1
rollback        STS2MCP/.local/deployments/2026-07-28T05-38-41-553Z
```

The game is closed. No Preview.70 loaded SHA, MVID, runtime epoch, canary,
Organic action, or qualification is claimed.

## Next Evidence Boundary

Cold-start STS2, then run only:

```bash
cd Re-SpireAgent
npm run agent:run
```

The next audit must first verify loaded protocol/SHA/MVID. A successful run may
exercise explicit contract candidates and manifest hypotheses, but cannot by
itself authorize identity migration, operation retirement, or persistent
qualification.
