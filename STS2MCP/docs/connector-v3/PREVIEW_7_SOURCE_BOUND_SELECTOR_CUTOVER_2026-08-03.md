# Preview.7 Source-Bound Selector Cutover

Status: source, automated checks, Release and install verified; loaded and
Preview.7 Live evidence remain non-claims.

## Evidence Baseline

The latest reviewed predecessor run is
`run-20260802135723-phwd6m` on Connector `3.0-preview.6`, SHA
`682b1bd647e795c9932648770bd266f010a9e5d7d4ad389eb540d3a6d8160ff7`,
MVID `717c7f91-1e6c-425d-8836-1581dd7562c0`, runtime
`4e5708f7126a4a7590f9835fe9d34b9d`, game `v0.110.1` commit `db5d3552`
and Modset `exact_bridge_only`.

It completed 200 commands, safely refused and recovered one stale Treasure
command, and stopped at the completed-run main menu. It exercised direct
combat-hand select/confirm, Precise Scissors removal, merchant removal, Smith,
RestSite/Merchant/Treasure settling, ordinary combat and non-combat journeys.
Its provenance is `unrecorded`: it is bounded journey coverage, not Organic
qualification or a durable claim.

## Problem

Precise Scissors, CardRemovalReward and Scroll Boxes exposed typed Surface
facts but still obtained V3 candidates from `draft.Actions`, executed through
`LegacyBinding.Start()`, and required Re's V2-shaped semantic sidecar. Card
bundle control availability was implicit in Provider actions rather than part
of the Surface contract. This split publication and execution across two
architectural generations and made source-local adaptation harder to audit.

## Cutover

Preview.7:

- generates merchant, Precise Scissors and CardRemovalReward candidates from
  typed deck-removal facts;
- shares only grid mechanics while re-resolving each exact source task before
  native Commit;
- keeps merchant Gold/service, Precise Scissors relic-task and
  CardRemovalReward task completion separate;
- refuses Precise Scissors selection cancel because no exact source-completion
  contract has been proven;
- adds typed card-bundle selectable membership and preview-control facts;
- resolves Scroll Boxes screen, bundle, source relic, native controls and
  exact cards again at execution;
- consumes all four selector families directly in Re without V2 state or
  capabilities sidecars;
- leaves the legacy Providers as typed observation collectors only; they no
  longer publish executable `BridgeActionDraft` closures for these families;
- rejects stale owner, source, membership, bundle and control drift.

No universal selector, Effect DSL, arbitrary reflection mutation, V2 action-ID
lookup or client-side legality/completion reconstruction was added.

## Automated Evidence

Targeted Gateway and Re tests cover:

- exact source-specific deck-removal candidate sets;
- select/deselect, preview, preview-return, confirm and supported cancel stages;
- absence of Precise Scissors selection cancel;
- atomic bundle selection, preview, cancel and commit;
- exact screen/card/bundle bindings and malformed replacement negatives;
- direct Re normalization with no V2 sidecar;
- protocol agreement at `3.0-preview.7`.

Full command results are recorded in the local engineering session and are not
replaced by this document.

## Deployment Identity

```text
source HEAD: 0822eefaf1680d5b5d7e27f0b497e3d6eb8e4412
source worktree: dirty with this reviewed Preview.7 change set
Gateway source digest: 7c5c9e456c289d37a605a678ae99039ef704324153063e009dab437cc7164561
built SHA: b57f5a1625d40960afa0d65295ed63c77ddad62c374919e67df856eb681682a6
built MVID: 06a1b410-3655-474a-bc53-14d688698155
installed SHA: b57f5a1625d40960afa0d65295ed63c77ddad62c374919e67df856eb681682a6
installed MVID: 06a1b410-3655-474a-bc53-14d688698155
rollback: STS2MCP/.local/deployments/2026-08-02T14-49-47-736Z
loaded: non-claim; STS2 was stopped after install
```

The verified deploy reran all Gateway and Re tests, repository checks and the
Release build before installation. The dirty worktree is recorded rather than
misrepresented as a commit; the source digest binds the installed artifact to
the exact reviewed Gateway files.

## Live Evidence Required

- cold-load exact Preview.7 SHA/MVID/protocol;
- exercise any migrated selector end to end with successor observation;
- naturally exercise CardRemovalReward and Scroll Boxes when encountered;
- re-exercise current-token and stale-token Inspection on Preview.7;
- retain unknown-no-retry and minimal-scope quarantine behavior.

Preview.6 evidence does not qualify Preview.7. Kifuda, CombatPile,
deck-transform, unknown owners, Mods and full vanilla completion remain outside
this cutover's claims.
